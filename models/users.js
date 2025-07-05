const mongoose =require('mongoose')
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  googleId: { type: String, unique: true, sparse: true },
  password: { type: String},
  dateofbirth: { type: String },
  phone: { type: Number },
  gender: { type: String, enum: ['male', 'female'] },
  status: { type: String, enum: ['active', 'blocked'], required: true, default: 'active' },
  referralCode: { type: String, unique: true },
  wallet: { type: Number, default: 0 },
  transaction: [
    {
      mode: { type: String },
      date: { type: Date, default: Date.now },
      amount: { type: Number },
      type: { type: String, enum: ['credit', 'debit'] }
    }
  ],
  coupon: { type: [String] }
});

module.exports = mongoose.model('User', userSchema);
