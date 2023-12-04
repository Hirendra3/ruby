const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;

let srusersSchema = new Schema({
  "user_id"          : { type:mongoose.Schema.Types.ObjectId, ref:'sr_users_info' },
  "website_url" : String,
  "vote_count"     : String,
  "lastest_block" : String,
  "status"       : String,
  "applied_at"  : { type: Date, default: Date.now}
}, {"versionKey" : false});

module.exports = mongoose.model('sr_users_info', srusersSchema, 'sr_users_info');
