const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;

let voteSchema = new Schema({
  "user_id"         : { type:mongoose.Schema.Types.ObjectId, ref:'votes' },
  "votes"           : { type: Number },
  "vote_receiver"   : { type:mongoose.Schema.Types.ObjectId, ref:'votes' }
}, {"versionKey" : false});

module.exports = mongoose.model('votes', voteSchema, 'votes');