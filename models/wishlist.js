const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
      addedOn:{type:Date,default: Date.now}
    },
  ],
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;