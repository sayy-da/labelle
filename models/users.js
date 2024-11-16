const mongoose =require('mongoose')
const userSchema = new mongoose.Schema({
  name:{type:String,required:true},
  email:{type:String,required:true,unique:true},
  googleId:{type:String,unique:true,sparse:true},
  password:{type:String,required:false},
  status:{type:String,enum:['active','blocked'],required:true,default:'active'}
})

module.exports = mongoose.model('User',userSchema)