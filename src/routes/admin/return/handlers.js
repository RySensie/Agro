'use strict';

var internals = {};
const { Products, Supplier, Stocks, Sales, Returns, Users } = require('@models');
const messageError =
  '/admin/stocks?message=Error Please try again!&alert=error';
const messageSuccess =
  '/admin/stocks?message=Successfully Created&alert=success';

internals.index = async function (req, reply) {
  let returns = await Returns.find({ })
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
  return reply.view('admin/return/index.html', {
    credentials: req.auth.credentials,
    returns
  });
};
// internals.add = async function (req, reply) {
//   const payload = req.payload;
//   const stock = await Stocks.create(payload);
//   if (!stock) return reply.redirect(messageError);
//   return reply.redirect(messageSuccess);
// };
internals.confirm = async function (req, reply) {
  try {
    console.log('req.payload', req.payload);
    let payload = {
      isApproved: true,
      approve_user_id : req.auth.credentials._id,
      status: 'confirm',
      approve_date : new Date(),
    };
    await Returns.updateOne({_id : req.payload.sales_id}, { $set:payload});
     return reply.redirect(
    '/admin/return?message=Successfully confirm return item&alert=success');
  //   let payload = req.payload;
  // const stock = await Stocks.findOneAndUpdate(
  //   { _id: req.params._id },
  //   { $set: payload }
  // );
  // if (!stock) return reply.redirect(messageError);
  // return reply.redirect(
  //   '/admin/return?message=Successfully confirm return item&alert=success'
  // );
  } catch (error) {
    return reply.redirect(
      '/admin/return?message=Failed to confirm return&alert=error'
    );
  }
  
};
// internals.delete = async function (req, reply) {
//   const stockInfo = await Stocks.findOne({
//     _id: req.params._id,
//   }).lean();

//   if (!stockInfo) {
//     reply({
//       status: false,
//       message: 'Invalid stock ID',
//       icon: 'error',
//     });
//   }

//   const stockHasTransactions = await Sales.exists({
//     product_id: stockInfo?.product_id,
//     status: { $in: ['pending', 'accepted'] },
//   });

//   if (stockHasTransactions) {
//     return reply({
//       status: false,
//       message: 'This stock is currently in used',
//       icon: 'error',
//     });
//   }

//   await Stocks.deleteOne({ _id: req.params._id }).lean();
//   return reply({
//     status: true,
//     message: 'Successfully deleted',
//     icon: 'success',
//   });
// };
module.exports = internals;
