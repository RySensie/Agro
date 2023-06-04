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
    added_by: { type: ObjectId, required: true, ref: 'users' },
    qty: { type: Number, required: true },
    status: { type: String, required: true, default: 'damage' },
    dateDamage: { type: Date },
    note: { type: String },
  },
  {
    timestamps: true,
    _id: true,
  }
);

var _schema = Mongoose.model('damages', schema);

module.exports = _schema;
