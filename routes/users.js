const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const passport = require('passport');
/* GET users listing. */
// router.get('/home',(req,res)=>{
//   res.render('user/home')
// })

router.get('/signup',userController.getSignup)
router.post('/signup',userController.signup)

router.get('/signup-otp',userController.getOtp)
router.post('/verify-otp',userController.verifyOtp)
router.post('/resend-otp', userController.resendOtp);

router.get('/login',userController.getLoginPage)
router.post('/login',userController.login)

router.get('/logout',userController.logout)

router.get('/',userController.gethome)
router.get('/home',userController.gethome)

router.get('/product-details/:variantId', userController.showProducts);
router.get('/shop', userController.showShop);

// router.get('/cart',(req,res)=>{
//   res.render('user/cart')
// })
// router.get('/forget-password',(req,res)=>{
//   res.render('user/forget-password')
// })

router.get('/auth/google',passport.authenticate('google',({scope:['profile','email']})))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/singup'}),(req,res)=>{
  res.redirect('/')
});



module.exports = router;
