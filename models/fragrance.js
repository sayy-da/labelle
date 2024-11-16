const mongoose = require('mongoose');

const fragranceSchema = new mongoose.Schema({
  name: {type: String,required: true,unique:true},
  createdAt:{type:Date,default:Date.now}
});

const Fragrance = mongoose.model('Fragrance', fragranceSchema);
module.exports = Fragrance;
