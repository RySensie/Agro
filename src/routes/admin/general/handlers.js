'use strict';

const internals = {};
const { Users, Sales, Stocks, Products } = require('@models');
const _ = require('lodash');
const mongoose = require('mongoose');

const manipulate = (sales, stocks) => {
  let total = 0;
  let inc = 1;
  sales = sales && sales.length > 0 ? sales : [];
  stocks = stocks && stocks.length > 0 ? stocks : [];

  const products = [...sales, ...stocks].map((r) => {
    let tempTotal = 0;

    if (!_.isNil(r.cost)) {
      r.type = 'stock in';
      tempTotal += r.qty * r.cost;
    } else {
      r.type = 'stock out';
      tempTotal += r.qty * r?.product_id?.price;
    }

    total += tempTotal;
    r.total = tempTotal;
    r.indexItem = inc++;

    return r;
  });

  products.sort((a, b) => {
    return a.indexItem - b.indexItem;
  });

  products.push({ grandTotal: total });

  console.log('productsssssssssssssssssssss', products);
  return { products, total };
};
internals.index = async function (req, reply) {
  let sales = await Sales.find({ status: 'accepted' })
    .populate({
      path: 'product_id',
      populate: { path: 'category_id brand_id unit_id' },
    })
    .sort({ createdAt: -1 })
    .lean();

  let stocks = await Stocks.find({})
    .populate({
      path: 'product_id',
      populate: { path: 'category_id brand_id unit_id' },
    })
    .sort({ createdAt: -1 })
    .lean();

  let item = manipulate(sales, stocks);

  return reply.view('admin/general/index.html', {
    credentials: req.auth.credentials,
    products: item.products,
    grandTotal: item.total,
    type: 'all',
    fromDate: '',
    toDate: '',
  });
};

internals.search = async function (req, reply) {
  const { type, fromDate, toDate } = req.payload;
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

  let sales = await Sales.find({
    status: 'accepted',
    ...filter,
  })
    .populate({
      path: 'product_id',
      populate: { path: 'category_id brand_id unit_id' },
    })
    .sort({ createdAt: -1 })
    .lean();

  let stocks = await Stocks.find({
    ...filter,
  })
    .populate({
      path: 'product_id',
      populate: { path: 'category_id brand_id unit_id' },
    })
    .sort({ createdAt: -1 })
    .lean();

  const item = manipulate(sales, stocks);

  if (type != 'all')
    item.products = item.products.filter((r) => r.type === type);

  return reply.view('admin/general/index.html', {
    credentials: req.auth.credentials,
    products: item.products,
    grandTotal: item.total,
    type,
    fromDate,
    toDate,
  });
};
module.exports = internals;
