const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;

let transactionSchema = new Schema({
	"blockID" : {type:String, index:true},
	"blockNumber" : {type:String, index:true},
	"txID" : {type:String, index:true},
	"parentHash" : {type:String, index:true},
	"txTrieRoot" : String,
	"witness_address" : {type:String, index:true},
	"amount" : String,
	"fee" : String,
	"net_fee" : String,
	"energy_fee" : String,
	"owner_address" : {type:String, index:true},
	"to_address" : {type:String, index:true},
	"type_url" : {type:String, index:true},
	"type" : {type:String, index:true},
	"raw_data_hex" : {type:String, index:true},
	"timestamp" : String,
	"fee_status" : String,
	"created_at"   : { type: Date, default: Date.now, index:true }
}, {"versionKey" : false});

module.exports = mongoose.model('transactions', transactionSchema, 'transactions');

