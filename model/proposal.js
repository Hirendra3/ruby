const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;

let proposalSchema = new Schema({
  "user_id"          : { type:mongoose.Schema.Types.ObjectId, ref:'proposal' },
  "parameter" : String,
  "old_value"  : String,
  "new_value"  : String,
  "votes_count"  : String,
  "status"  : String,
}, {"versionKey" : false});

module.exports = mongoose.model('proposal', proposalSchema, 'proposal');