const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;

let eventsBlockSchema = new Schema({
  "user_id"           : { type:mongoose.Schema.Types.ObjectId, ref:'user_info', index:true },
  "contract_address"  : { type: String },
  "name"              : { type: String },
  "output"            : { type: String },
  "type"              : { type: String },
  "input_params"      : { type: Array },
  "input_types"       : { type: Array },
  "created_at"        : { type:Date, default:Date.now },
}, {"versionKey" : false});

module.exports = mongoose.model('events_block', eventsBlockSchema, 'events_block');