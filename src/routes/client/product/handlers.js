"use strict";

var internals = {};
const { Sales, Returns } = require("@models");

internals.index = async function (req, reply) {
  let sales = await Sales.find({ user_id: req.auth.credentials._id })
  .populate({
    path: 'product_id',
    populate: [
      {
        path: 'brand_id',
        model: 'brand',
      },
      {
        path: 'category_id',
        model: 'category',
      },
    ],
  })
  .sort({ createdAt: -1 })
  .lean();
  return reply.view("client/products/index.html", {
    credentials: req.auth.credentials,
    sales
  });
};
internals.remove = async function (req, reply) {
  const sales = await Sales.remove({ _id: req.params._id }).lean();
  if (!sales) {
    return reply({ status: false, message: "Error to delete", icon: "error" });
  }
  return reply({
    status: true,
    message: "Successfully deleted",
    icon: "success",
  });
};
internals.return = async function (req, reply) {
  let payload = req.payload;
  console.log('req.payload', req.payload);
  try {
    let sales = await Sales.findOne({_id : req.payload.sales_id}).lean()
    if(sales == null) {
      return reply.redirect(
        '/client/products?message=Sale was not found&alert=error'
      );
    }
    payload.user_id = req.auth.credentials._id;
    payload.dateReturn = new Date();
    await Returns.create(payload);
  return reply.redirect(
    '/client/products?message=Successfully return product&alert=success'
  );
  } catch (error) {
    console.log('error', error);
    return reply.redirect(
      '/client/products?message=Failed return product&alert=error'
    );
  }

};
module.exports = internals;
