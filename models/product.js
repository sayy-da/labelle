const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {type: String,required: true},
  fragranceType: {type: String,enum:['Eau de Parfum (EDP)','Eau de Toilette (EDT)','Eau de Cologne (EDC)'],required: true},
  gender: {type: String,enum:["Male",'Female','Other'],required: true},
  occasions: {type: String,enum:['Daytime/Office Wear','Evening Wear/Night Ou','Casual Wear','Special Occasions/Events'], required: true},
  description: {type: String,required: true},
  images:[{type:String}],
  createdAt:{type:Date,default:Date.now}
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
