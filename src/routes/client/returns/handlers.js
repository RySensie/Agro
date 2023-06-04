"use strict";

var internals = {};
const { Sales, Returns } = require("@models");

internals.index = async function (req, reply) {
  let returns = await Returns.find({ user_id: req.auth.credentials._id })
  .populate({
    path: 'product_id approve_user_id',
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
  return reply.view("client/returns/index.html", {
    credentials: req.auth.credentials,
    returns
  });
};
module.exports = internals;
