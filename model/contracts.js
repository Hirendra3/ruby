const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;

let contractSchema = new Schema({
	"user_id": String,
	"contract_name": String,
	"version": String,
	"license": { type: String, default: '' },
	"optimization" : String,
	"runs" : String,
	"txID" : String,
	"contract_address" : String,
	"owner_address" : String,
	"contract_file" : { type: String, default: '' },
	"contract_file_name" : { type: String, default: '' },
	"contract_status" : String,
	"user_address" : String,
  	"contract_type" : { type: String },
	"validated_on" : { type: Date, default: Date.now },
	"created_at"   : { type: Date, default: Date.now },
}, {"versionKey" : false});

module.exports = mongoose.model('contracts', contractSchema, 'contracts');