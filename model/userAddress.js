const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let addressSchema = new Schema({
  "user_id"		   	: { type:mongoose.Schema.Types.ObjectId, ref:'user_info', index:true },
  "privateKey"   	: {type:String, index:true}, 
  "publicKey"		 	: {type:String, index:true},
  "address_base58": {type:String, index:true},
  "address_hex"		: {type:String, index:true},
  "created_at" 	 : { type: Date, default: Date.now, index:true }
}, {"versionKey" : false});

module.exports = mongoose.model('user_address', addressSchema, 'user_address');