const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  productId: {type: mongoose.Schema.Types.ObjectId,ref: 'Product',required: true},
  milliliter: {type: Number,required: true},
  price: {type: Number,required: true},
  stock: {type: Number,required: true},
  offer:{type:Number,default:0},
  createdDate: {type: Date,default: Date.now}
});

const Variant = mongoose.model('Variant', variantSchema);
module.exports = Variant;
  