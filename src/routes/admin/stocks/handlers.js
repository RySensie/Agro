'use strict';

var internals = {};
const { Products, Supplier, Stocks, Sales } = require('@models');
const messageError =
  '/admin/stocks?message=Error Please try again!&alert=error';
const messageSuccess =
  '/admin/stocks?message=Successfully Created&alert=success';

internals.index = async function (req, reply) {
  const products = await Products.find({}).populate('unit_id').lean();
  const supplier = await Supplier.find({}).lean();
  const stocks = await Stocks.find({})
    .populate('product_id supplier_id')
    .lean();
  let totalStocks = 0;
  stocks.map((r) => {
    totalStocks += r?.qty * r?.cost;
  });

  return reply.view('admin/stocks/index.html', {
    credentials: req.auth.credentials,
    products,
    supplier,
    stocks,
    totalStocks,
  });
};
internals.add = async function (req, reply) {
  const payload = req.payload;
  const stock = await Stocks.create(payload);
  if (!stock) return reply.redirect(messageError);
  return reply.redirect(messageSuccess);
};
internals.update = async function (req, reply) {
  let payload = req.payload;
  const stock = await Stocks.findOneAndUpdate(
    { _id: req.params._id },
    { $set: payload }
  );
  if (!stock) return reply.redirect(messageError);
  return reply.redirect(
    '/admin/stocks?message=Successfully Updated&alert=success'
  );
};
internals.delete = async function (req, reply) {
  const stockInfo = await Stocks.findOne({
    _id: req.params._id,
  }).lean();

  if (!stockInfo) {
    reply({
      status: false,
      message: 'Invalid stock ID',
      icon: 'error',
    });
  }

  const stockHasTransactions = await Sales.exists({
    product_id: stockInfo?.product_id,
    status: { $in: ['pending', 'accepted'] },
  });

  if (stockHasTransactions) {
    return reply({
      status: false,
      message: 'This stock is currently in used',
      icon: 'error',
    });
  }

  await Stocks.deleteOne({ _id: req.params._id }).lean();
  return reply({
    status: true,
    message: 'Successfully deleted',
    icon: 'success',
  });
};
module.exports = internals;
