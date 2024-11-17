const mongoose = require('mongoose');

const fragranceSchema = new mongoose.Schema({
  name: {type: String,required: true,unique:true,trim: true},
  createdAt:{type:Date,default:Date.now}
});

fragranceSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const Fragrance = mongoose.model('Fragrance', fragranceSchema);
module.exports = Fragrance;
