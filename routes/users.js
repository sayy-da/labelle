const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const passport = require('passport');
const profileController = require('../controller/profileController');




router.get('/signup', userController.getSignup)
router.post('/signup', userController.signup)

router.get('/signup-otp', userController.getOtp)
router.post('/verify-otp', userController.verifyOtp)
router.post('/resend-otp', userController.resendOtp);

router.get('/login', userController.getLoginPage)
router.post('/login', userController.login)

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
  req.session.user = req.user._id
  res.redirect('/')
});

router.get('/forget-password', userController.getForgetPassword)
router.post('/forget-password', userController.forgetPassword)
router.get('/reset-password-getOtp', userController.getPasswordResetOtp)
router.post('/resendforgotpasswordOtp', userController.resendforgotpasswordOtp)
router.post('/validateForgetPasswordOtp', userController.validateForgetPasswordOtp)
router.get('/reset-password', userController.getResetPassword)
router.post('/reset-password', userController.resetPassword)

router.get('/', userController.gethome)

router.get('/shop', userController.showShop);
router.get('/product-details/:variantId', userController.showProducts);


router.get('/user-profile', profileController.profile)
router.post('/user-profile/edit', profileController.editProfile)

router.get("/user-address", profileController.getAddress);
router.post("/user-address-add", profileController.addAddress);
router.put("/user-address-edit", profileController.editAddress);
router.delete("/user-address/:addressId", profileController.deleteAddress);

router.get('/change-password',profileController.getChangePassword)
router.post('/change-password', profileController.changePassword)

router.get('/cart',profileController.getShowCart)
router.post('/cart-add',profileController.showCart)
router.post('/cart-update-quantity',profileController.cartUpdateQuandity)
router.delete('/cart-remove/:itemId',profileController.removeShowCart);

router.get('/checkout', profileController.getCheckoutPage);
router.post('/add-address', profileController.addAddress);
router.post('/apply-coupon',profileController.applyCoupon);
router.post('/cancel-coupon',profileController.cancelCoupon);
router.post('/process-checkout', profileController.processCheckout);

router.post('/razorpay',profileController.retryPayment);


router.get('/success-order/:orderId',profileController.getSuccessOrder)
router.get('/failure-order/:orderId',profileController.getFailureOrder)
router.get('/user-order-details/:orderId', profileController.getOrderDetails);
router.get('/download-invoice/:orderId',profileController.invoiceDownload);
router.get('/user-order', profileController.getOrdersList);






router.post('/cancel-order/:orderId',  profileController.cancelOrder);
router.post('/cancel-single-product/:orderId/:productId', profileController.cancelSingleProduct);


router.get('/user-coupon',profileController.getUserCoupon)

router.get('/user-wallet',profileController.getWallet)

router.get('/wishlist', profileController.getWishlist);
router.post('/wishlist-add', profileController.addToWishlist);
router.post('/wishlist-remove', profileController.removeFromWishlist);



router.get('/error',userController.getError)



router.get('/logout', userController.logout)


module.exports = router;
