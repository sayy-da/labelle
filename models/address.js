const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  address: [{
    addressType: { type: String, required: true },
    name: { type: String, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    landmark: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: Number, required: true },
    phone: { type: Number, required: true }
  }]
});

const Address = mongoose.model('Address', addressSchema);
module.exports = Address;
