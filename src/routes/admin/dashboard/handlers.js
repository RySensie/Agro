"use strict";

const internals = {};
const { Users, Sales, Stocks, Products } = require("@models");
const _ = require("lodash");
const mongoose = require("mongoose");

internals.index = async function (req, reply) {
  const cntUser = await Users.countDocuments({ scope: ["client"] });

  const stocks = await Stocks.aggregate([
    { $match: {} },
    {
      $group: {
        _id: null,
        total: { $sum: "$qty" },
      },
    },
  ]);

  const sales = await Sales.aggregate([
    { $match: { status: { $ne: "cancel" } } },
    {
      $group: {
        _id: null,
        total: { $sum: "$qty" },
      },
    },
  ]);

  //GET STOCKS
  let products = await Products.find({})
    .populate("category_id brand_id unit_id")
    .lean();
  const stocksId = await Stocks.aggregate([
    { $match: {} },
    {
      $group: {
        _id: "$product_id",
        total: { $sum: "$qty" },
      },
    },
    { $sort: { total: 1 } },
  ]);

  const salesId = await Sales.aggregate([
    { $match: { status: { $ne: "cancel" } } },
    {
      $group: {
        _id: "$product_id",
        total: { $sum: "$qty" },
      },
    },
  ]);

  // GET TOTAL STOCK
  products.map((r) => {
    let total;
    stocksId.map((s) => {
      if (String(r._id) == String(s._id)) {
        return (total = s.total);
      }
    });
    return (r.total = total || 0);
  });

  // SUBTRACT TOTAL STOCK TO SALES
  products.map((product) => {
    const salesIndex = salesId.findIndex(
      (sale) => sale?._id?.toString() == product?._id?.toString()
    );

    if (product?._id?.toString() == salesId[salesIndex]?._id?.toString()) {
      product.total = product.total - salesId[salesIndex].total;
    }
    return { total: product.total, _id: product._id };
  });

  let cnt = 0;
  const labelsProduct = products.map((r) => r.name);
  const totalProduct = products.map((r) => r.total);
  const colorProduct = products.map((r) => {
    cnt++;
    return `rgba(${cnt}5${cnt}, ${cnt}${cnt}, 131, 1)-`;
  });

  return reply.view("admin/dashboard/index.html", {
    credentials: req.auth.credentials,
    cntUser,
    labelsProduct: [labelsProduct],
    totalProduct: [totalProduct],
    colorProduct: [colorProduct],
    remainingStocks: isNaN(stocks[0]?.total)
      ? 0
      : isNaN(sales[0]?.total)
      ? stocks[0]?.total
      : stocks[0]?.total - sales[0]?.total,
  });
};

internals.checkout = async function (req, reply) {
  if (_.isNil(req.payload)) {
    return reply({ message: "Error invalid sales", type: "danger" });
  }

  const productId = await Sales.find(
    {
      _id: { $in: req.payload.map((v) => v._id) },
    },
    { product_id: 1 }
  ).populate("product_id");

  const stocks = await Stocks.aggregate([
    {
      $match: {
        product_id: {
          $in: productId.map((v) => mongoose.Types.ObjectId(v.product_id._id)),
        },
      },
    },
    {
      $group: {
        _id: "$product_id",
        total: { $sum: "$qty" },
      },
    },
  ]);

  const consumedSales = await Sales.aggregate([
    {
      $match: {
        product_id: {
          $in: productId.map((v) => mongoose.Types.ObjectId(v.product_id._id)),
        },
        status: { $in: ["accepted", "pending"] },
      },
    },
    {
      $group: {
        _id: "$product_id",
        total: { $sum: "$qty" },
      },
    },
  ]);

  // check stocks balance before proceeding
  const hasEnoughStocks = stocks?.some((stock) => {
    let sale = consumedSales?.find((s) => String(s?._id) == String(stock?._id));

    if (!_.isNil(sale)) {
      let remainingStocks = stock?.total - sale?.total;
      return Number.isFinite(remainingStocks) && remainingStocks >= 0;
    }
    return false;
  });

  if (!hasEnoughStocks) {
    return reply({ message: "Insufficient stocks", type: "error" });
  }
  req.payload.map(async (r) => {
    let code =
    "BS-" +
    String(r._id).substring(
      String(r._id).length - 8,
      String(r._id).length
    );
    code = code.toUpperCase();
    await Sales.update(
      { _id: r._id },
      {
        $set: {
          qty: r.qty,
          status: r.status == "cancel" ? "cancel" : "accepted",
          returnDate: r.returnDate ? new Date(r.returnDate) : null,
          approve_date: new Date(),
          code : code,
        },
      }
    );
  });
  return reply({ message: "sucessfully accepted", type: "success" });
};

internals.deliveryDate_add = async function (req, reply) {
  try {
    console.log("req.payload", req.payload);
    const sales = await Sales.updateMany(
      { $and: [{ user_id: req.payload.user_id }, { status: "pending" }] },
      {
        $set: {
          delivery_date:  new Date(req.payload.delivery_date)
        },
      }
    ).lean();
    if (!sales) {
      return reply.redirect(
        "/admin/dashboard?message=User or product not found!!&alert=error"
      );
    }
    return reply.redirect(
      "/admin/dashboard?message=Sucessfully set delivery date!!&alert=success"
    );
  } catch (err) {
    return reply.redirect(
      "/admin/dashboard?message=Error invalid !!&alert=error"
    );
  }
};

internals.acceptBorrowQRcode = async function (req, reply) {
  try {
    const sales = await Sales.findOneAndUpdate(
      {
        product_id: req.payload.product_id,
        user_id: req.payload.user_id,
        status: "pending",
        isAcceptReturn: false,
      },
      {
        $set: {
          returnDate: req.payload.returnDate,
        },
      },
      { new: true }
    ).lean();
    if (!sales) {
      return reply.redirect(
        "/admin/dashboard?message=User or product not found!!&alert=error"
      );
    }
    return reply.redirect(
      "/admin/dashboard?message=Sucessfully accepted!!&alert=success"
    );
  } catch (err) {
    return reply.redirect(
      "/admin/dashboard?message=Error invalid QR code!!&alert=error"
    );
  }
};

module.exports = internals;
