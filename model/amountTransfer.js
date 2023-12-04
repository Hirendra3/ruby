const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let addressSchema = new Schema({
  "user_id"		   	: { type:mongoose.Schema.Types.ObjectId, ref:'user_info' },
  "to_address"    : String,
  "privateKey"   	: String, 
  "token_type"		: String,
  "amount"        : { type: Number, default: 0 },
  "note"          : String,
  "txID"          : String,
  "created_at" 	 : { type: Date, default: Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('amount_transfer', addressSchema, 'amount_transfer');