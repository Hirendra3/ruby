const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let settingSchema = new Schema({
  "contact_mail"     : String, 
  "site_url"         : String,
  "site_name"        : String,
  "sitemode"         : {type: String, default:"1"}, 
  "copyright"        : String,
  "contactnumber"    : Number,
  "address"          : String,
  "facebook"         : {type: String, default: ''},
  "twitter"          : {type: String, default: ''},
  "linkedin"         : {type: String, default: ''}, 
  "telegram"         : {type: String, default: ''},
  "refLevel1"        : Number,
  "refLevel2"        : Number,
  "refBasic"         : Number,
  "singleToken"      : Number,
  "multipleToken"    : Number,
  "singleCoin"       : Number,
  "multipleCoin"     : Number,
  "lendMinRate"      : Number,
  "lendMinDuration"  : Number,
  "lendMaxDuration"  : Number,
  "lendFee"          : Number,
  "marPricePer"      : Number,
  "proLossPer"       : Number,
  "mainPer"          : Number,
  "mainPer"          : Number,
  "erk_ref1"         : Number,
  "erk_ref2"         : Number,
  "erk_usdt"         : Number,
  "erk_val"          : Number,
  "btc_usdt"         : Number,
  "eth_usdt"         : Number,
  "xrp_usdt"         : Number,
  "updated_at"       : { type: Date, default: Date.now }
}, {"versionKey"  : false});

module.exports = mongoose.model('siteSettings', settingSchema, 'sitesettings');