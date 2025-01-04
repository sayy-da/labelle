const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
      quantity: { type: Number, required: true, min: 1 },
      productId:{ type:mongoose.Schema.Types.ObjectId,ref:'Product',required:true}
    },
  ],
  createdAt: { type: Date, default: Date.now }
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
