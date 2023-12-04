const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;

let tokenSchema = new Schema({
  "user_id"          : { type:mongoose.Schema.Types.ObjectId, ref:'user_info' },
  "contract_address" : String,
  "tokenId"          : String,
  "token_type"       : String,
  "user_address_hex"    : String,
  "user_address_base58" : String,
  "token_balance"       : String,
  "created_at"   : { type: Date, default: Date.now },
}, {"versionKey" : false});

module.exports = mongoose.model('user_tokens', tokenSchema, 'user_tokens');