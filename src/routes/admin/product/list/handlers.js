"use strict";

var internals = {};
const { Products, Brand, Category, Unit, Stocks, Sales } = require("@models");
const Image = require("@lib/Image");
const _ = require("lodash");
const { remove } = require("lodash");
const messageError =
  "/admin/products?message=Error Please try again!&alert=error";
const messageSuccess =
  "/admin/products?message=Successfully Created&alert=success";
const util = require("util");

internals.index = async function (req, reply) {
  const brand = await Brand.find({}).lean();
  const category = await Category.find({}).lean();
  const unit = await Unit.find({}).lean();

  let products = await Products.find({})
    .populate("category_id brand_id unit_id")
    .lean();

  // const all = await Products.aggregate([
  //     {
  //         $lookup:
  //         {
  //             from: "stocks",
  //             localField: "_id",
  //             foreignField: "product_id",
  //             as: "stocks",
  //         }
  //     },
  //     {
  //         $lookup:
  //         {
  //             from: "categories",
  //             localField: "category_id",
  //             foreignField: "_id",
  //             as: "category_id",
  //         }
  //     },

  //     { "$project": {
  //             "total": { "$sum": "$stocks.qty" },
  //         },
  //     }
  // ]);
  // all.map(r =>{
  //     var total=0;
  //     r.stocks.map(s =>{
  //         total+=s.qty
  //     })
  //     r.category_id = r.category_id[0]
  //     return r.total = total;
  // });
  // console.log(util.inspect(all, {showHidden: false, depth: null, colors: true}))

  const stocks = await Stocks.aggregate([
    { $match: {} },
    {
      $group: {
        _id: "$product_id",
        total: { $sum: "$qty" },
      },
    },
    { $sort: { total: 1 } },
  ]);

  const sales = await Sales.aggregate([
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
    stocks.map((s) => {
      if (String(r._id) == String(s._id)) {
        return (total = s.total);
      }
    });
    return (r.total = total);
  });

  // SUBTRACT TOTAL STOCK TO SALES
  products.map((product) => {
    const salesIndex = sales.findIndex(
      (sale) => sale?._id?.toString() == product?._id?.toString()
    );

    if (product?._id?.toString() == sales[salesIndex]?._id?.toString()) {
      product.total = product.total - sales[salesIndex].total;
    } 
    return { total: product.total, _id: product._id };
  })

  return reply.view("admin/products/list.html", {
    credentials: req.auth.credentials,
    brand,
    category,
    unit,
    products,
  });
};

internals.add = async function (req, reply) {
  try {
    let payload = {
      name: req.payload.name,
      price: req.payload.price,
      category_id: req.payload.category_id,
      brand_id: req.payload.brand_id,
      unit_id: req.payload.unit_id,
      code: req.payload.code,
      isReturn: req.payload.isReturn == "true" ? true : false,
    };
    const product = await Products.create(payload);
    if (!product) return reply.redirect(messageError);
    //add product image
    if (!_.isEmpty(req.payload.img)) {
      Image.upload(req.payload.img, product._id);
      await Products.update(
        { _id: product._id },
        { $set: { img: `/assets/images/products/${product._id}.jpg` } }
      );
    }
    return reply.redirect(messageSuccess);
  } catch (err) {
    return reply.redirect(messageError);
  }
};
internals.update = async function (req, reply) {
  let payload = {
    name: req.payload.name,
    price: req.payload.price,
    category_id: req.payload.category_id,
    brand_id: req.payload.brand_id,
    unit_id: req.payload.unit_id,
    code: req.payload.code,
    isReturn: req.payload.isReturn == "true" ? true : false,
  };
  const product = await Products.findOneAndUpdate(
    {
      _id: req.payload._id,
    },
    { $set: payload }
  ).lean();
  if (!product) return reply.redirect(messageError);
  //add product image
  if (!_.isEmpty(req.payload.img)) {
    Image.upload(req.payload.img, product._id);
    await Products.update(
      { _id: product._id },
      { $set: { img: `/assets/images/products/${product._id}.jpg` } }
    );
  }
  return reply.redirect(messageSuccess);
};
internals.delete = async function (req, reply) {
  //CANT DELETE PRODUCT IF PRODUCT HAS STOCKS
  const countStocks = await Stocks.countDocuments({
    product_id: req.params._id,
  }).lean();
  if (countStocks > 0) {
    return reply({ status: false, message: "Cannot delete products that has transactions.", icon: "error" });
  }
  Image.remove(`/assets/images/products/${req.params._id}.jpg`);
  const brand = await Products.deleteOne({ _id: req.params._id }).lean();
  if (!brand) {
    return reply({ status: false, message: "Problem occured while deleting the product", icon: "error" });
  }
  return reply({
    status: true,
    message: "Successfully deleted",
    icon: "success",
  });
};

module.exports = internals;
