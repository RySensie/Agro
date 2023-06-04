"use strict";

const internals = {};
const { Users, Sales, Stocks, Products, Returns, Damages } = require("@models");
const _ = require("lodash");
const mongoose = require("mongoose");

const moment = require("moment");

const manipulate = (
  sales,
  stocks,
  returns,
  damages,
  salesAll,
  stocksAll,
  returnAll,
  damageAll
) => {
  let grandTotal = 0;
  let available = [];
  let expiry_date;

  sales = sales.map((r) => {
    available.push({ ...r, type: "available" });
    //SALES
    let total = 0;
    let qty = 0;
    let delivery_date;
    expiry_date = r.stock.expiry_date;
    salesAll.map((s) => {
      if (s.product_id.toString() === r._id.toString()) {
        console.log("Naa nag equal sales", s.qty);
        total += s.qty * r.price;
        qty += s.qty;
        delivery_date = s.delivery_date;
      }
    });

    grandTotal -= total;
    r.total = total;
    r.qty = qty;
    r.unit_id.name = r.unit.name;
    r.expiry_date = moment(expiry_date).format("MMMM DD, YYYY");
    r.delivery_date = moment(delivery_date).format("MMMM DD, YYYY");
    r.type = "stock out";

    return r;
  });
  console.log("returnAll", returnAll);
  returns = returns.map((r) => {
    let total = 0;
    let qty = 0;
    let delivery_date;

    returnAll.map((s) => {
      if (s.product_id._id.toString() === r._id.toString()) {
        total += s.qty * r.price;
        qty += s.qty;
      }
    });

    grandTotal -= total;
    r.total = total;
    r.qty = qty;
    // r.unit_id.name = r.unit.name;
    // r.expiry_date = moment(expiry_date).format("MMMM DD, YYYY");
    // r.delivery_date = moment(delivery_date).format("MMMM DD, YYYY");
    r.type = "returned";

    return r;
  });
  console.log("returns", returns);
  damages = damages.map((r) => {
    let total = 0;
    let qty = 0;

    damageAll.map((s) => {
      if (s.product_id._id.toString() === r._id.toString()) {
        total += s.qty * r.price;
        qty += s.qty;
      }
    });

    grandTotal -= total;
    r.total = total;
    r.qty = qty;
    // r.expiry_date = moment(expiry_date).format("MMMM DD, YYYY");
    // r.delivery_date = moment(delivery_date).format("MMMM DD, YYYY");
    r.type = "damaged";

    return r;
  });
  console.log("damages", damages);

  console.log("stocks", stocks);
  console.log("stocksAll", stocksAll);
  stocks = stocks.map((r) => {
    //STOCKS
    let total = 0;
    let qty = 0;

    stocksAll.map((s) => {
      if (s.product_id.toString() === r._id.toString()) {
        total += s.qty * s.cost;
        qty += s.qty;
        expiry_date = s.expiry_date;
      }
    });

    grandTotal += total;
    r.total = total;
    r.qty = qty;
    r.expiry_date = moment(expiry_date).format("MMMM DD, YYYY");
    r.type = "stock in";
    return r;
  });

  let products = [...stocks, ...sales, ...returns, ...damages];
  console.log("products", products);
  console.log("availables ", available);
  available = available.map((r) => {
    let qty = 0;
    products.map((p) => {
      if (p?._id && r?._id.toString() == p?._id.toString()) {
        if (p.type == "stock in") qty += p.qty;
        else qty -= p.qty;
      }
      r.expiry_date = moment(p.expiry_date).format("MMMM DD, YYYY");
    });
    r.qty = qty;
    return r;
  });
  // products.push(...damages);
  console.log('grandTotal', grandTotal);
  products.push(...available);
  products.push({ grandTotal });
  return { products, grandTotal };
};

internals.index = async function (req, reply) {
  const productList = await Products.find({ isDeleted: { $ne: true } }).lean();

  const sales = await Products.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $lookup: {
        from: "categories",
        localField: "category_id",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: "$category",
    },
    {
      $lookup: {
        from: "brands",
        localField: "brand_id",
        foreignField: "_id",
        as: "brand",
      },
    },
    { $unwind: "$brand" },
    {
      $lookup: {
        from: "units",
        localField: "unit_id",
        foreignField: "_id",
        as: "unit",
      },
    },
    { $unwind: "$unit" },
    {
      $lookup: {
        from: "stocks",
        localField: "_id",
        foreignField: "product_id",
        as: "stock",
      },
    },
    { $unwind: "$stock" },
  ]);
  console.log("sales", sales);
  // let sales = await Products.find({ isDeleted: { $ne: true } })
  //   .populate('category_id brand_id unit_id')
  //   .lean();
  let stocks = await Products.find({ isDeleted: { $ne: true } })
    .populate("category_id brand_id unit_id")
    .lean();
  let returns = await Products.find({ isDeleted: { $ne: true } })
    .populate("category_id brand_id unit_id")
    .lean();
  let damages = await Products.find({ isDeleted: { $ne: true } })
    .populate("category_id brand_id unit_id")
    .lean();

  const salesAll = await Sales.find({
    status: "accepted",
  }).lean();
  let returnAll = await Returns.find({ status: "confirm" })
    .populate({
      path: "product_id",
      populate: [
        {
          path: "brand_id",
          model: "brand",
        },
        {
          path: "category_id",
          model: "category",
        },
      ],
    })
    .lean();
  let damageAll = await Damages.find({ status: "damage" })
    .populate("product_id")
    .lean();
  // const returns = await Returns.find({
  //   status: "confirm",
  // }).lean();

  console.log("salesAll", salesAll);
  console.log("returns", returns);

  const stocksAll = await Stocks.find({}).lean();

  const item = manipulate(
    sales,
    stocks,
    returns,
    damages,
    salesAll,
    stocksAll,
    returnAll,
    damageAll
  );
  console.log("item", item);
  
  return reply.view("admin/generalInvetory/index.html", {
    credentials: req.auth.credentials,
    products: item.products,
    grandTotal: item.grandTotal,
    productList,
    type: "all",
  });
};

internals.search = async function (req, reply) {
  const productList = await Products.find({ isDeleted: { $ne: true } }).lean();
  const { type, fromDate, toDate, product_id } = req.payload;
  let productId = product_id ? { _id: product_id } : {};
  let product_name;
  if (product_id)
    product_name = await Products.findOne({ _id: product_id }).lean();

  let filter = {};

  if (fromDate && !toDate) {
    var from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    filter = { createdAt: { $gte: from } };
  }

  if (!fromDate && toDate) {
    var to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    filter = { createdAt: { $lt: to } };
  }

  if (fromDate && toDate) {
    var from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    var to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    filter = { createdAt: { $gte: from, $lt: to } };
  }

  // let sales = await Products.find({
  //   ...productId,
  //   isDeleted: { $ne: true },
  //   ...filter,
  // })
  //   .populate("category_id brand_id unit_id")
  //   .lean();
  const sales = await Products.aggregate([
    { $match: { ...productId } },
    { $match: { isDeleted: { $ne: true } } },
    { $match: { ...filter } },
    {
      $lookup: {
        from: "categories",
        localField: "category_id",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: "$category",
    },
    {
      $lookup: {
        from: "brands",
        localField: "brand_id",
        foreignField: "_id",
        as: "brand",
      },
    },
    { $unwind: "$brand" },
    {
      $lookup: {
        from: "units",
        localField: "unit_id",
        foreignField: "_id",
        as: "unit",
      },
    },
    { $unwind: "$unit" },
    {
      $lookup: {
        from: "stocks",
        localField: "_id",
        foreignField: "product_id",
        as: "stock",
      },
    },
    { $unwind: "$stock" },
  ]);
  console.log("salesssssss", sales);
  let stocks = await Products.find({
    ...productId,
    isDeleted: { $ne: true },
    ...filter,
  })
    .populate("category_id brand_id unit_id")
    .lean();
  let returns = await Products.find({
    ...productId,
    isDeleted: { $ne: true },
    ...filter,
  })
    .populate("category_id brand_id unit_id")
    .lean();
  let damages = await Products.find({
    ...productId,
    isDeleted: { $ne: true },
    ...filter,
  })
    .populate("category_id brand_id unit_id")
    .lean();

  const salesAll = await Sales.find({
    status: "accepted",
  })
    .populate("product_id")
    .lean();
  let returnAll = await Returns.find({ status: "confirm" })
    .populate({
      path: "product_id",
      populate: [
        {
          path: "brand_id",
          model: "brand",
        },
        {
          path: "category_id",
          model: "category",
        },
      ],
    })
    .lean();
  let damageAll = await Damages.find({ status: "damage" })
    .populate("product_id")
    .lean();
  console.log("salesAll", salesAll);
  console.log("returns", returns);
  const stocksAll = await Stocks.find({}).lean();

  const item = manipulate(
    sales,
    stocks,
    returns,
    damages,
    salesAll,
    stocksAll,
    returnAll,
    damageAll
  );

  if (type && type != "all")
    item.products = item.products.filter(
      (r) => r.type === type || r.grandTotal
    );

  return reply.view("admin/generalInvetory/index.html", {
    credentials: req.auth.credentials,
    products: item.products,
    grandTotal: item.grandTotal,
    type,
    fromDate,
    toDate,
    productList,
    product_id,
    product_name: product_name?.name,
  });
};

module.exports = internals;
