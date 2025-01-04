const mongoose = require('mongoose')
const {v4:uuidv4}=require('uuid')
const orderSchema = new mongoose.Schema({
  orderId: {type: String,default: () => uuidv4(),unique: true},
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["Pending", "Delivered", "Cancelled", "Returned"], default: "Pending" },
  paymentMethod: { type: String, enum: ["razorpay", "cod", "wallet"], required: true },
  cartAmount:{type:Number,default:0},
  totalAmount: { type: Number, required: true },
  discount: {type:Number,default:0},
  orderedItems: [{ variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true }, quantity: { type: Number, required: true }, price: { type: Number, required: true }, isCancelled: { type: Boolean, default: false } }],
  paymentStatus: { type: String, enum: [true, false], default: false },
  address: { name: { type: String, required: true }, state: { type: String, required: true }, landMark: { type: String }, city: { type: String, required: true }, pincode: { type: String, required: true }, phone: { type: String, required: true } },
  
})



const Order = mongoose.model('Order', orderSchema);
module.exports = Order