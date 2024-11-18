const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/users');
const Variant = require('../models/variant')
const Product = require('../models/product');
const { error } = require('console');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.getSignup = (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  }
  res.render('user/signup', { error: '' });
};

exports.getOtp = (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  }

  if (!req.session.tempUserData) {
    return res.redirect('/signup');
  }

  res.render('user/signup-otp', { error: "" });
};

exports.signup = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.render('user/signup', {
      error: 'All fields are required',
      name,
      email
    });
  }

  if (confirmPassword !== password) {
    return res.render('user/signup', {
      error: 'Passwords do not match',
      name,
      email
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('user/signup', {
        error: 'Email already registered',
        name,
        email
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 8);

    // Create new user object but don't save it yet
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    // Store the user object temporarily
    req.session.tempUserData = {
      name,
      email,
      password: hashedPassword
    };

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    req.session.otpExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes
    req.session.otp = otp
    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for signup',
      text: ` Your OTP for signup is: ${otp}`
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP sent:', otp); // For development
    res.redirect('/signup-otp');
    console.log('last of otp generator')
   
  } catch (error) {
    console.error('Error during signup:', error);
    res.render('user/signup', {
      error: 'Error signing up. Please try again later.',
      name,
      email
    });
  }
};

// exports.verifyOtp = async (req, res) => {
//   console.log("verify page")
//   const { otp1, otp2, otp3, otp4 } = req.body;
//   const submittedOtp = otp1 + otp2 + otp3 + otp4;
//   console.log(req.session.tempUserData, req.session.otp);

//   // Check if we have the necessary session data
//   if (!req.session.tempUserData || !req.session.otp) {
//     return res.redirect('/signup');
//   }

//   // Check OTP expiry
//   if (Date.now() > req.session.otpExpiry) {
//     // Clear temp data
//     delete req.session.tempUserData;
//     delete req.session.otp;
//     delete req.session.otpExpiry;

//     return res.render('user/signup-otp', {
//       error: 'OTP has expired. Please try again.'
//     });
//   }
//   console.log(req.session.otp);
//   console.log(submittedOtp);
//   // Only add googleId if it exists

//   // Verify OTP
//   if (submittedOtp == req.session.otp) {
//     try {
//       // Create and save new user
//       const userData = req.session.tempUserData;
//       const newUser = new User({
//         name: userData.name,
//         email: userData.email,
//         password: userData.password
//       });
  

//       await newUser.save();
// console.log(req.session.otp);
// console.log(submittedOtp);

//       // Clear all temporary session data
//       delete req.session.tempUserData;
//       delete req.session.otp;
//       delete req.session.otpExpiry;

//       res.redirect('/login');
//     } catch (error) {
//       console.error('Error saving user:', error);
//       res.render('user/signup-otp', {
//         error: 'Error creating account. Please try again.'
//       });
//     }
//   } else {
//     res.render('user/signup-otp', {
//       error: 'Incorrect OTP'
//     });
//   }
// };


exports.verifyOtp = async (req, res) => {
  console.log("verify page")
  const { otp1, otp2, otp3, otp4 } = req.body;
  const submittedOtp = otp1 + otp2 + otp3 + otp4;
  console.log(req.session.tempUserData, req.session.otp);

  // Check if we have the necessary session data
  if (!req.session.tempUserData || !req.session.otp) {
    return res.redirect('/signup');
  }

  // Check OTP expiry
  if (Date.now() > req.session.otpExpiry) {
    // Clear temp data
    delete req.session.tempUserData;
    delete req.session.otp;
    delete req.session.otpExpiry;

    return res.render('user/signup-otp', {
      error: 'OTP has expired. Please try again.'
    });
  }
  console.log(req.session.otp);
  console.log(submittedOtp);

  // Verify OTP
  if (parseInt(submittedOtp) == req.session.otp) {
    try {
      const userData = req.session.tempUserData;

      // Prepare the new user data
      const newUserData = {
        name: userData.name,
        email: userData.email,
        password: userData.password
      };

      // Only add googleId if it exists and is not null
      if (userData.googleId && userData.googleId !== null) {
        newUserData.googleId = userData.googleId;
      }

      // Create and save the new user
      const newUser = new User(newUserData);
      await newUser.save();

      console.log(req.session.otp);
      console.log(submittedOtp);

      // Clear all temporary session data
      delete req.session.tempUserData;
      delete req.session.otp;
      delete req.session.otpExpiry;

      res.redirect('/login');
    } catch (error) {
      console.error('Error saving user:', error);
      res.render('user/signup-otp', {
        error: 'Error creating account. Please try again.'
      });
    }
  } else {
    res.render('user/signup-otp', {
      error: 'Incorrect OTP'
    });
  }
};




exports.resendOtp = async (req, res) => {
  if (!req.session.tempUserData || !req.session.otp) {
    return res.redirect('/signup'); // Redirect if session data is missing
  }

  try {
    // Generate a new OTP and update session data
    const newOtp = Math.floor(1000 + Math.random() * 9000);
    req.session.otp = newOtp;
    req.session.otpExpiry = Date.now() + (5 * 60 * 1000); // Reset the expiry time

    // Resend OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.session.tempUserData.email,
      subject: 'Your OTP for signup',
      text: `Your OTP for signup is: ${newOtp}`
    };

    await transporter.sendMail(mailOptions);
    console.log('Resent OTP:', newOtp); // For development

    res.json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.json({ success: false, message: 'Failed to resend OTP. Please try again later.' });
  }
};



exports.getLoginPage = (req, res) => {
  if (req.session.user) {
    res.redirect('/home');
  } else {
    res.render('user/login', { error: '' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.render('user/login', { error: 'User not found' });
    }

    if (user.status === 'blocked') {
      return res.render('user/login', {
        error: 'Your account is blocked. Please contact support.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('user/login', { error: 'Incorrect password' });
    }

    // Store authenticated user in session
    req.session.user = user;
    res.redirect('/');
  } catch (error) {
    console.error('Error logging in:', error);
    res.render('user/login', {
      error: 'Server error. Please try again later.'
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).render('error', {
        message: 'Error logging out. Please try again later.'
      });
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};

const otpStore = {};




exports.gethome = async (req, res) => {
  const user = req.session.user
  try {
    const products = await Product.find()
    const productWithDefaultVariant = await Promise.all(
      products.map(async (product)=>{
        const defaultVariant = await Variant.findOne({
          productId:product._id,
        }).sort({price:1})
        return { ...product.toObject(), defaultVariant}
      })
    )

    res.render('user/home', { products:productWithDefaultVariant,user,error: '' })
  } catch (error) {
    res.render('user/home', {
      error: 'Server error. Please try again later.'
    });
  }
}

exports.showProducts = async (req, res) => {
  const user = req.session.user || null;
  const variantId = req.params.variantId; // Variant ID from URL
  
  try {
    // Find the variant and populate the product details
    const variant = await Variant.findById(variantId).populate('productId');
    console.log(variant.price,'dskmfomklmsld');
    
    if (!variant) {
      return res.render('user/home', {
        error: 'Variant not found. Please check your selection.'
      });
    } 
    
    

    // Extract the product details from the populated field
    const product = variant.productId;
    console.log(product,'dskmfomklmsld');
    // Optionally, fetch all other variants for the same product
    const variants = await Variant.find({ productId: product._id });

      
    res.render('user/product-details', { product,variant, variants, user, error: '' });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.render('user/home', {
      error: 'Server error. Please try again later.'
    });
  }
};



exports.showShop = async (req, res) => {
  const user = req.session.user || null;
  try {
    const products = await Product.find()
    const productWithDefaultVariant = await Promise.all(
      products.map(async (product)=>{
        const defaultVariant = await Variant.findOne({
          productId:product._id,
        }).sort({price:1})
        return { ...product.toObject(), defaultVariant}
      })
    )

    res.render('user/shop', { products:productWithDefaultVariant,user,error: '' })
  } catch (error) {
    res.render('user/home', {
      error: 'Server error. Please try again later.'
    });
  }
}