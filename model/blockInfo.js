const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;

let blockInfoSchema = new Schema({
	"blockID" : {type:String, index:true},
	"blockNumber" : {type:String, index:true},
	"txTrieRoot" : {type:String, index:true},
	"witness_address" : {type:String, index:true},
	"parentHash" : {type:String, index:true},
	"version" : {type:String, index:true},
	"timestamp" : {type:String, index:true},
	"witness_signature" : String,
	"transaction_fetch_status" : {type:String, index:true},
	"created_at"   : { type: Date, default: Date.now, index:true }
}, {"versionKey" : false});

module.exports = mongoose.model('block_info', blockInfoSchema, 'block_info');