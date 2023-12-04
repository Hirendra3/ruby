const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let addressSchema = new Schema({
  "user_id"		   	: { type:mongoose.Schema.Types.ObjectId, ref:'user_wallet' },
  "balance"        : { type: Number, default: 0 },
  "address_base58": String,
}, {"versionKey" : false});

module.exports = mongoose.model('user_wallet', addressSchema, 'user_wallet');