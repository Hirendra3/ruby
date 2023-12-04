// db.js
const mongoose = require('mongoose');

const main ="mongodb://superruby:SuperPratik99885@3.110.140.60:38476/jscfuyiuytn";
const test="mongodb://localhost:27017/rubydb";
mongoose.connect(main, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = mongoose;
