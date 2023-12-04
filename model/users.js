const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;

let usersSchema = new Schema({
  "username"     : {type:String, index:true},
  "hIgh_value"   : {type:String, index:true},
  "protect_key"  : {type:String, index:true},
  "added_val"    : {type:String, index:true},
  "status"       : { type: Number, default: 0, index:true },
  "tfa_status"   : { type: Number, default: 0 },
  "tfa_code"     : String,
  "tfa_url"      : String,
  "refer_id"     : String,
  "referrer_id"  : { type: String, default: '' },
  "forgot_code"  : String,  
  "created_at"   : { type: Date, default: Date.now, index:true },
  "updated_at"   : { type: Date, default: Date.now },
  "tfa_update"   : { type: Date, default: Date.now },
  "email"        : String,
  "user_fav"     : [],
  "secretkey"    : [],
  "ip_address"   : { type:String, default: '' },
  "email_otp"    : { type: String, default: '' },
  "with_pass"    : { type: String, default: '' },
  "withdraw_otp" : String,
}, {"versionKey" : false});

module.exports = mongoose.model('user_info', usersSchema, 'user_info');