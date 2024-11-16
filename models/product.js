const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {type: String,required: true},
  fragranceType: {type: String,required: true},
  gender: {type: String,enum:["Male",'Female','Other'],required: true},
  occasions: {type: String, required: true},
  description: {type: String,required: true},
  images:[{type:String}],
  createdAt:{type:Date,default:Date.now}
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
