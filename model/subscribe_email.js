const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let subscribeSchema = new Schema({
  "email": String,
  "created_at": { type: Date, default: Date.now }
}, {"versionKey" : false});

module.exports = mongoose.model('subscribe', subscribeSchema,'subscribe');