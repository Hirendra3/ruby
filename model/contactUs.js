const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let contactUsSchema = new Schema({
  "name": String,
  "email": String,
  "subject": String,
  "content": String,
  "created_at": { type: Date, default: Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('contactUs', contactUsSchema,'contactUs');