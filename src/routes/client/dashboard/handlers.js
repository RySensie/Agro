"use strict";

var internals = {};
const { Products, Stocks, Sales } = require("@models");

internals.index = async function (req, reply) {
  let products = await Products.find({})
    .populate("category_id brand_id unit_id")
    .lean();

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

  return reply.view("client/dashboard/index.html", {
    credentials: req.auth.credentials,
    // products
  });
};

internals.addToCart = async (req, reply) => {
  const client_id = req.auth.credentials._id;
  let payload = req.payload;

  const productId = req.payload.map((r) => ({ _id: r.product_id }));

  const products = await Products.find(
    {
      $or: productId,
    },
    { _id: 1, price: 1 }
  ).lean();

  payload = payload.map((p) => {
    products.map((r) => {
      if (p.product_id.toString() == r._id.toString()) p.price = r.price;
    });
    return p;
  });
    let batch_code =
    "SL-" +
    String(req.auth.credentials._id).substring(
      String(req.auth.credentials._id).length - 8,
      String(req.auth.credentials._id).length
    );
    batch_code = batch_code.toUpperCase();
  payload.map(async (product) => {
    product.user_id = client_id;
    product.batch_code = batch_code;
   await Sales.create(product);

  });
  return reply({ message: "sucessfully add", type: "success" });
};
module.exports = internals;
