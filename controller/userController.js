const nodemailer =require('nodemailer')
const crypto = require('crypto')
const bcrypt = require('bcryptjs');
const User = require('../models/users'); // Import the User model
const { error } = require('console');

// Setup Nodemailer transport

const transporter = nodemailer.createTransport({
  service:'gmail',
  auth:{
      user:process.env.EMAIL_USER,
      pass:process.env.EMAIL_PASS
  }
})


exports.getSignup = (req,res)=>{
  res.render('user/signup',{error:''})
}


// Controller for handling user signup
exports.signup = async (req, res) => {
  const { name, email, password ,confirmPassword} = req.body;

if (!name || !email || !password || !confirmPassword) {
  return res.render('user/signup', { error: 'All fields are required',name, email});
}
if(confirmPassword!==password){
  return res.render('user/signup', { error: 'password do not match',name, email});
}

  try {
    // Hash the password
    
    const hashedPassword = await bcrypt.hash(password, 8);

    // Create a new user instance
    const newUser = new User({ name, email, password: hashedPassword });

    // Save the user to the database

    req.session.user = newUser
    
    // res.redirect('/signup-otp'); // Redirect to login page after signup
  } catch (error) {
    console.error('Error signing up user:', error);
    res.status(500).send('Error signing up');
  }

  try {
    const otp = Math.floor(1000 + Math.random() * 9000); // 4-digit numeric OTP
    const otpExpiry = Date.now() + (5 * 60 * 1000);
  
    req.session.otp = otp;
    req.session.otpExpiry = otpExpiry;
    req.session.email = email;
  
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for signup',
      text: `Your OTP for signup is: ${otp}`
    };
  
    console.log(otp);
    await transporter.sendMail(mailOptions);
    console.log(mailOptions);
  
    res.redirect('/signup-otp');
  } catch (error) {
    console.error('Error during signup:', error);
    res.render('signup', { error: 'Error signing up. Please try again later.', name, email });
  }
}

exports.verifyOtp =(req,res)=>{
  console.log("verify page")
  const { otp1, otp2, otp3, otp4 } = req.body
  const otp = otp1 + otp2 + otp3 + otp4

  if(Date.now()>req.session.otpExpiry){
    return res.status(400).send('OTP has expired')
  }

  if(otp===req.session.otp){
    const newUser= req.session.user
    const user = new User(newUser)
    user.save()
    res.redirect('/login')

  }else{
    res.render('signup-otp',{error:'Incorrect/Invalid OTP'})
  }
}





exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).render('login', { error: 'User not found' });
    }

    if (user.status === 'blocked') {
      return res.status(403).render('login', { error: 'Your account is blocked. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).render('login', { error: 'Incorrect password' });
    }

    res.redirect('/home');
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).render('login', { error: 'Server error. Please try again later.' });
  }
};

// Ensure error is defined when rendering the login page without form submission
exports.getLoginPage = (req, res) => {
  res.render('user/login', { error: '' });
};

