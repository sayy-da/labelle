const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/users');
const Variant = require('../models/variant')
const Product = require('../models/product');
const { error, log } = require('console');
const { search } = require('../routes/admin');
const Fragrance = require('../models/fragrance');
const  Occasion= require('../models/occasion');
const  Wishlist= require('../models/wishlist');




const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS 
  }
});

exports.getSignup = (req, res) => {
  const error = req.query.error || null;
  const mode = req.query.mode; 
  if (req.session.user) {
    return res.redirect('/');
  }

  res.render('user/signup', { error, mode });
};

exports.signup = async (req, res) => {
  const { name, email, password, confirmPassword,referralCode} = req.body;

  
  
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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('user/signup', {
        error: 'Email already registered',
        name,
        email
      });
    }
 
 req.session.referralCode = referralCode;
    const hashedPassword = await bcrypt.hash(password, 8);
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });


    
    req.session.tempUserData = {
      name,
      email,
      password: hashedPassword
    };


    
    const otp = Math.floor(1000 + Math.random() * 9000);
    req.session.otpExpiry = Date.now() + (1 * 60 * 1000); 
    req.session.otp = otp
    
    
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Signup',
      text: `Your OTP for signup is: ${otp}`
    };

    await transporter.sendMail(mailOptions);
  
    res.redirect('/signup-otp');
  
   
  } catch (error) {
    console.error('Error during signup:', error);
    res.render('user/signup', {
      error: 'Error signing up. Please try again later.',
      name,
      email
    });
  }
};


exports.verifyOtp = async (req, res) => {
  const otp = req.body.otp;


  
  const isAjax = req.headers['content-type'] === 'application/json';

  if (!otp) {
 
    if (isAjax) {
      return res.status(400).json({
        success: false,
        message: 'Please enter the complete OTP',
      });
    }
    return res.render('user/signup-otp', {
      error: 'Please enter the complete OTP',
    });
  }


  if (!req.session.tempUserData || !req.session.otp) {

    if (isAjax) {
      return res.status(400).json({
        success: false,
        message: 'Session expired. Please start the signup process again.',
      });
    }
    return res.redirect('/signup');
  }


  if (Date.now() > req.session.otpExpiry) {
   

    delete req.session.tempUserData;
    delete req.session.otp;
    delete req.session.otpExpiry;

    if (isAjax) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please try again.',
        enableResend: true,
      });
    }
    return res.render('user/signup-otp', {
      error: 'OTP has expired. Please try again.',
      enableResend: true,
    });
  }

  if (Number(otp) === req.session.otp) {

    try {

      const userData = req.session.tempUserData;
      const newUser = new User({
        name: userData.name,
        email: userData.email,
        password: userData.password,
      });

   
      await newUser.save();


      const referralCode = req.session.referralCode;
 

      if (referralCode) {
        let referrer;
        const cleanedReferralCode = referralCode.trim();
        referrer = await User.findOne({ referralCode: cleanedReferralCode });

     

        const rewardAmount = 500;
        referrer.wallet += rewardAmount;
        const transaction = {
          date: new Date(),
          amount: rewardAmount,
          mode: 'Referral Reward',
          type: 'credit',
        };
        
        referrer.transaction.push(transaction);
  
        await referrer.save();
      }

    

     
      delete req.session.tempUserData;
      delete req.session.otp;
      delete req.session.otpExpiry;
      delete req.session.referralCode;

      
      if (isAjax) {
        return res.status(200).json({
          success: true,
          message: 'User registered successfully',
        });
      }


      return res.redirect('/login');
    } catch (error) {
      console.error('Error saving user:', error);

      if (isAjax) {
        return res.status(500).json({
          success: false,
          message: 'Error creating account. Please try again.',
        });
      }

      return res.render('user/signup-otp', {
        error: 'Error creating account. Please try again.',
      });
    }
  } else {
   

    if (isAjax) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP. Please try again.',
      });
    }

    return res.render('user/signup-otp', {
      error: 'Incorrect OTP. Please try again.',
    });
  }
};




exports.getOtp = (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }

  if (!req.session.tempUserData) {
    return res.redirect('/signup');
  }

  res.render('user/signup-otp', { error: "" });
};

exports.resendOtp = async (req, res) => {
    try {
        
        if (!req.session.tempUserData) {
            return res.status(400).json({ 
                success: false, 
                message: 'No signup process in progress' 
            });
        }

        const otp = Math.floor(1000 + Math.random() * 9000);
        
        req.session.otp = otp;
        req.session.otpExpiry = Date.now() + (1 * 60 * 1000); 

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: req.session.tempUserData.email,
            subject: 'Your New OTP for Signup',
            text: `Your new OTP for signup is: ${otp}`
        };
    
        
        await transporter.sendMail(mailOptions);

        res.json({ 
            success: true, 
            message: 'New OTP sent successfully' 
        });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error resending OTP. Please try again.' 
        });
    }
};


exports.getLoginPage = async (req, res) => {
  const error = req.query || null;

  try {
    if (req.session.user) {
      const userData = await User.findById(req.session.user._id); 
      
      if (userData && userData.status === 'active') {
        return res.redirect('/');
      } else if (userData && userData.status === 'blocked') {
        return res.render('user/login', { error: 'Your account is blocked. Please contact support.' });
      }
    }
  } catch (err) {
    console.error('Error fetching user data:', err);
    return res.render('user/login', {
      error: 'An unexpected error occurred. Please try again later.',
    });
  }

  res.render('user/login', { error: error['error'] });
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

    req.session.user = user;

    
    res.redirect('/');
  } catch (error) {
    console.error('Error logging in:', error);
    res.render('user/login', {
      error: 'Server error. Please try again later.'
    });
  }
};

exports.getForgetPassword = (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  const errorMessage = req.session.forgetPasswordError || null;

  delete req.session.forgetPasswordError;
  
  res.render('user/forget-password', { error: errorMessage });
}

exports.forgetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    req.session.forgetPasswordError = 'Please provide your email address.';
    return res.redirect('/forget-password');
  }

  try {

    const user = await User.findOne({ email });
    if (!user) {
      req.session.forgetPasswordError = 'User not found.';
      return res.redirect('/forget-password');
    }

  
    if (user.status === 'blocked') {
      req.session.forgetPasswordError = 'Your account is blocked. Please contact support.';
      return res.redirect('/forget-password');
    }

  
    const otp = Math.floor(1000 + Math.random() * 9000);
    req.session.otp = otp.toString(); 
    req.session.otpExpiry = Date.now() + 1  * 60 * 1000;
    req.session.email = email;
   
   
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Forget Password',
      text: `Your OTP for password reset is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
 

    return res.redirect('/reset-password-getOtp')
  } catch (error) {
    console.error('Error in forgetPassword:', error);
    req.session.forgetPasswordError = 'An error occurred. Please try again later.';
    return res.redirect('/forget-password');
  }
};

exports.getPasswordResetOtp = (req, res) => {
  
  if (req.session.user) {
      return res.redirect('/');
  }
  res.render('user/reset-password-otp', { error: '' });
};

exports.validateForgetPasswordOtp = (req, res) => {
  try {
     

      const { otp } = req.body;

    
      if (!req.session.otp || Date.now() > req.session.otpExpiry) {
          console.error('OTP has expired or not available.');
          return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      }

      if (otp === req.session.otp) {
         

   
          req.session.otp = null;
          req.session.otpExpiry = null;

      
          return res.status(200).json({ success: true, message: 'OTP verified successfully!' });
      } else {
          console.error('Incorrect OTP provided.');
          return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
      }
  } catch (error) {
      console.error('Error validating OTP:', error);
      return res.status(500).json({ success: false, message: 'An unexpected error occurred. Please try again later.' });
  }
};



exports.resendforgotpasswordOtp = async (req, res) => {
  if (req.session.user) {
      return res.redirect('/');
  }

  try {
    
      const newOtp = Math.floor(1000 + Math.random() * 9000);
      req.session.otp = newOtp.toString();
      req.session.otpExpiry = Date.now() + 1 * 60 * 1000;


      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: req.session.email,
          subject: 'Your OTP for Forget Password',
          text: `Your OTP for password reset is: ${newOtp}`,
      };

      await transporter.sendMail(mailOptions);
     
      res.json({ success: true, message: 'OTP resent successfully.' });
  } catch (error) {
      console.error('Error resending OTP:', error);
      res.json({ success: false, message: 'Failed to resend OTP. Please try again later.' });
  }
};



exports.getResetPassword = (req,res)=> {
  if (req.session.user ) {
    return res.redirect('/');
  }
  res.render('user/reset-password',{error:null})
}

exports.resetPassword =async (req,res) => {
const { password } =  req.body
const email = req.session.email

if(!email){
  return res.redirect('/forget-password')
}

try{
  const user = await User.findOne({email})
if(!user){
  return res.redirect('/forget-password')
}
const hashedPassword = await bcrypt.hash(password, 8);

user.password = hashedPassword
await user.save()


req.session.destroy
res.redirect('/login')
}catch(error){
  console.error('Error resetting password:', error);
  res.render('user/reset-password', { error: 'Failed to reset password' });
}
}


const otpStore = {};



exports.gethome = async (req, res) => {
const user = req.session.user || null


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
exports.showShop = async (req, res) => {
  try {
    const user = req.session.user || null; 
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search;

    const genderFilter = req.query.gender ? req.query.gender.split(',').map(g => g.toLowerCase()) : [];
    const fragranceFilter = req.query.fragrance ? req.query.fragrance.split(',') : [];
    const occasionFilter = req.query.occasion ? req.query.occasion.split(',') : [];
    const categoryFilter = req.query.category || null;

    const fragrances = await Fragrance.find().sort({ createdAt: -1 });
    const occasions = await Occasion.find().sort({ createdAt: -1 });

    const searchCriteria = {
      ...(searchQuery && {
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { gender: { $regex: searchQuery, $options: 'i' } },
          { fragranceType: { $regex: searchQuery, $options: 'i' } },
          { occasions: { $regex: searchQuery, $options: 'i' } },
        ],
      }),
      ...(genderFilter.length && { gender: { $in: genderFilter.map(g => g.charAt(0).toUpperCase() + g.slice(1))  } }),
      ...(fragranceFilter.length && { fragranceType: { $in: fragranceFilter } }),
      ...(occasionFilter.length && { occasions: { $in: occasionFilter } }),
      ...(categoryFilter && { category: categoryFilter }),
    };

    const products = await Product.find(searchCriteria)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });



      
    const productWithDefaultVariant = await Promise.all(
      products.map(async (product) => {
        const defaultVariant = await Variant.findOne({
          productId: product._id,
        }).sort({ price: 1 });
        
        return { 
          ...product.toObject(), 
          defaultVariant,
          images: product.images || [] 
        };
      })
    );


    const newArrivals = await Product.find()
    .sort({ createdAt: -1 })
    .limit(2); 
  
  const newArrivalsWithDefaultVariant = await Promise.all(
    newArrivals.map(async (product) => {
      const defaultVariant = await Variant.findOne({
        productId: product._id,
      }).sort({ price: 1 });
      
      return {
        ...product.toObject(),
        defaultVariant,
        images: product.images || [],
      };
    })
  );
    

    const totalProducts = await Product.countDocuments(searchCriteria);
    const totalPages = Math.ceil(totalProducts / limit);


      let wishlistItems = [];
  
      if(user) {
        const wishlist = await Wishlist.findOne({ userId: user });
        if (wishlist) {
          wishlistItems = wishlist.items.map(item => item.variantId.toString());
        }
      }

    res.render('user/shop', {
      products: productWithDefaultVariant,
      user,
      newArrivals: newArrivalsWithDefaultVariant,
      totalPages,
      searchQuery,
      currentPage: page,
      fragrances,
      occasions,
      selectedGenders: genderFilter,
      selectedFragrances: fragranceFilter,
      selectedOccasions: occasionFilter,
      wishlistItems,
      error: '',
    });


  } catch (error) {
    console.error('Shop Controller Error:', error);
    res.status(500).render('user/home', {
      error: 'An error occurred while loading the shop. Please try again later.',
      user: req.session.user || null,
    });
  }
};

exports.showProducts = async (req, res) => {
  const user = req.session.user || null;
  const variantId = req.params.variantId;

  try {
    const variant = await Variant.findById(variantId).populate('productId');
    if (!variant) {
      return res.render('user/home', {
        error: 'Variant not found. Please check your selection.',
      });
    }

    const product = variant.productId;

    const variants = await Variant.find({ productId: product._id });
    const fragrance = await Fragrance.find({name:product.fragranceType})
    const relatedProducts = await Product.find({ 
      gender: product.gender,
      _id: { $ne: product._id },
    })
      .sort({ createdAt: -1 })
      .limit(3);

    const relatedProductsWithDefaultVariant = await Promise.all(
      relatedProducts.map(async (relatedProduct) => {
        const defaultVariant = await Variant.findOne({
          productId: relatedProduct._id,
        }).sort({ price: 1 });
        return {
          ...relatedProduct.toObject(),
          defaultVariant,
          images: relatedProduct.images || [],
        };
      })
    );

    let wishlistItems = [];
    let wishlistError = null;

    if (user) {
      const wishlist = await Wishlist.findOne({ userId: user });
      if (wishlist) {
        wishlistItems = wishlist.items.map(item => item.variantId.toString());
      }
    } else {
      wishlistError = "User is not logged in. Please log in to view your wishlist.";
    }


    res.render('user/product-details', { 
      fragranceOffer:fragrance[0].offer,
      product,
      variant,
      variants,
      user,
      relatedProducts: relatedProductsWithDefaultVariant,
      wishlistItems,
      error: '',
      selectedVariant:variantId
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.render('user/home', {
      error: 'Server error. Please try again later.',
    });
  }
};

exports.getError = async (req,res) => {
  const user = req.session.user
  if (!user) {
    console.error('User not logged in.');
    return res.redirect('/login');
  }
  if(userData.status=='blocked'){

    return res.redirect('/login');
  }
  res.render('user/error')
}

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


