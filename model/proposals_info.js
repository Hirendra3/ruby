const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;

let proposalsSchema = new Schema({
  "No"          : String,
  "parameter" : String,
  "Current_Value"     : String,
}, {"versionKey" : false});

module.exports = mongoose.model('proposal_content', proposalsSchema, 'proposal_content');
