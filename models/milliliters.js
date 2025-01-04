const mongoose = require('mongoose');

const milliliterSchema = new mongoose.Schema({
  milliliter: {type: Number,required: true,unique:true,trim:true},
  createdAt:{type:Date,default:Date.now}
});
 
milliliterSchema.index({ milliliter: 1 }, { unique: true });


const Milliliter = mongoose.model('Milliliter', milliliterSchema);
module.exports = Milliliter;
