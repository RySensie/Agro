'use strict';
/**
 * ## Imports
 *
 */
//Mongoose - the ORM
var Mongoose = require('mongoose'),
  ObjectId = Mongoose.Schema.Types.ObjectId,
  Schema = Mongoose.Schema;

const schema = new Mongoose.Schema(
  {
    product_id: { type: ObjectId, required: true, ref: 'products' },
    sales_id: { type: ObjectId, required: true, ref: 'sales' },
    user_id: { type: ObjectId, required: true, ref: 'users' },
    qty: { type: Number, required: true },
    price: { type: Number, required: false },
    status: { type: String, required: true, default: 'request' },
    approve_date: { type: Date },
    approve_user_id: { type: ObjectId, ref: 'users' },
    isApproved: { type: Boolean, default: false },
    dateReturn: { type: Date },
    note: { type: String },
  },
  {
    timestamps: true,
    _id: true,
  }
);

var _schema = Mongoose.model('returns', schema);

module.exports = _schema;
