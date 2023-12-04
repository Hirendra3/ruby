const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;

let contractSchema = new Schema({
	"txID" : {type:String, index:true},
	"contract_address" : {type:String, index:true},
	"owner_address" : {type:String, index:true},
	"bytecode" : String,
	"abi" : Object,
	"name" : {type:String, index:true},
	"consume_user_resource_percent" : String,
	"origin_address" : {type:String, index:true},
	"ref_block_bytes" : String,
	"ref_block_hash" : String,
	"expiration" : String,
	"fee_limit" : String,
	"signature" : String,
	"raw_data_hex" : String,
	"timestamp" : String,
	"created_at"   : { type: Date, default: Date.now, index:true }
}, {"versionKey" : false});

module.exports = mongoose.model('contract', contractSchema, 'contract');

