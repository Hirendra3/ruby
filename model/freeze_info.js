const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;

let freezeSchema = new Schema({
  "user_id"           : { type:mongoose.Schema.Types.ObjectId, ref:'user_info', index:true },
  "staking_account"   : {type:String, index:true},
  "receiving_account" : {type:String, index:true},
  "resource_type"     : {type:String, index:true},
  "amount_staked"     : { type: Number },
  "frozen_duration"   : {type:String, index:true},
  "txID"              : {type:String, index:true},
  "signature"         : {type:String, index:true},
  "status"            : {type:String, index:true},
  "staked_time"       : { type: Date, default: Date.now, index:true },
  "unstaked_time"     : { type: Date,  index:true },
  "expired_time"      : { type: Date, index:true },
  "unfreeze_txID"     : {type:String, index:true},
  "unfreeze_signature": String
}, {"versionKey" : false});

module.exports = mongoose.model('freeze_info', freezeSchema, 'freeze_info');