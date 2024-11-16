const mongoose = require('mongoose');

const occasionSchema = new mongoose.Schema({
  name: {type: String,required: true,unique:true},
  createdAt:{type:Date,default:Date.now}
});

const Occasion = mongoose.model('Occasion', occasionSchema);
module.exports = Occasion;
