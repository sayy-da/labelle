const mongoose = require('mongoose');

const occasionSchema = new mongoose.Schema({
  name: {type: String,required: true,unique:true,trim:true},
  createdAt:{type:Date,default:Date.now}
});
 
occasionSchema.index({name:1},{unique:true,collation:{locale:'en',strength:2}})

const Occasion = mongoose.model('Occasion', occasionSchema);
module.exports = Occasion;
