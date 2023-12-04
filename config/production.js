// db.js
const mongoose = require('mongoose');

mongoose.connect('mongodb://superruby:SuperPratik99885@3.110.140.60:38476/jscfuyiuytn', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = mongoose;
