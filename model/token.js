const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;

let tokenSchema = new Schema({
  "user_id"          : { type:mongoose.Schema.Types.ObjectId, ref:'user_info', index:true },
  "contract_address" : {type:String, index:true},
  "token_name"       : {type:String, index:true},
  "token_abbr"       : String,
  "token_intro"      : String,
  "token_supply"     : String,
  "decimal_place"    : String,
  "issuer"           : String,      
  "token_logo"       : String,
  "website_url"      : { type: String, default: '' },
  "email"            : { type: String, default: '' },
  "github_url"       : String,
  "white_paper_url"  : String,
  "twitter_url"      : { type: String, default: '' },
  "facebook_url"     : { type: String, default: '' },
  "telegram_url"     : { type: String, default: '' },
  "webibo_url"       : { type: String, default: '' },
  "created_at"       : { type: Date, default: Date.now, index:true },
  "token_info"       : { type: Object, default: Date.now },
  "token_type"       : { type: String },
  "txID"             : String,
  "ruby_num"          : String,
  "frozen_amount"    : String,
  "frozen_days"      : String,
  "owner_address"    : String,
  "owner_address_hex": String,
  "tokenId"          : { type: String, default: '' },
  // "name"             : String,
  // "description"      : String,
  // "abbr"             : String,
  // "url"              : String,
  // "ref_block_bytes"  : String,
  // "ref_block_hash"   : String,
  // "raw_data_hex"     : String,
}, {"versionKey" : false});

module.exports = mongoose.model('tokens', tokenSchema, 'tokens');           