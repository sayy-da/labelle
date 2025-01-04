const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const productController = require('../controller/productController');
const adminMiddleware = require('../middleware/adminmiddleware');


router.get('/login', adminController.showAdminLogin);
router.post('/login', adminController.handleAdminLogin);

router.get('/dashboard', adminMiddleware, adminController.adminDashboard);
router.post('/dashboard',adminMiddleware,adminController.dashboard)

router.get('/all-user',adminMiddleware,adminController.viewUsers);
router.post('/toggle-status/:id',adminMiddleware,adminController.toggleStatus)


router.get('/product-list',adminMiddleware,productController.getProductList)
router.get('/add-product',adminMiddleware,productController.getAddProduct )
router.post('/add-product',adminMiddleware,productController.addProduct)
router.get('/edit-product/:id',adminMiddleware,productController.getEditProduct)
router.post('/edit-product/:id',adminMiddleware,productController.editProduct)



router.get('/variant/:productId',adminMiddleware,productController.getVariantList)
router.get('/add-variant/:productId',adminMiddleware,productController.getAddVariant)
router.post('/add-variant/:productId',adminMiddleware,productController.addVariant)
router.get('/edit-variant/:id',adminMiddleware,productController.getEditVariant)
router.post('/edit-variant/:id',adminMiddleware,productController.editVariant)

router.get('/fragrance-list',adminMiddleware,productController.getFragranceList)
router.get('/add-fragrance',adminMiddleware,productController.getAddFragrance)
router.post('/add-fragrance',adminMiddleware,productController.addFragrance)

router.get('/occasion-list',adminMiddleware,productController.getOccasionList)
router.get('/add-occasion',adminMiddleware,productController.getAddOccasion)
router.post('/add-occasion',adminMiddleware,productController.addOccasion)


router.get('/milliliters-list',adminMiddleware,productController.getMillilitersList)
router.get('/add-milliliters',adminMiddleware,productController.getAddMilliliters)
router.post('/add-milliliters',adminMiddleware,productController.addMilliliters)

router.get('/order-list',adminMiddleware,productController.getOrderList)
router.get('/order-details/:orderId',adminMiddleware,productController.getOrderDetails)
router.put('/order-update-status', adminMiddleware,productController.updateOrderStatus);

router.get('/add-coupon',adminMiddleware,adminController.getAddCoupon)
router.post('/add-coupon',adminMiddleware,adminController.addCoupon)
router.get('/coupons-list',adminMiddleware,adminController.getCouponslist)
router.delete('/coupons-list/:id', adminMiddleware,adminController.deleteCoupon);

router.get('/offers-list',adminMiddleware,adminController.getOfferslist)
router.get('/offers-variant-list/:productId',adminMiddleware,adminController.getOffersvariantlist)
router.get('/add-offer/:id',adminMiddleware,adminController.getAddOffer)
router.post('/add-offer/:id',adminMiddleware,adminController.addOffer)

router.get('/category-offer-list', adminMiddleware,adminController.getCategoriesOffer)
router.get('/add-fragrance-offer',adminMiddleware,adminController.getAddFragranceOffer)
router.post('/add-fragrance-offer', adminMiddleware, adminController.addFragranceOffer);
router.get('/edit-fragrance/:id', adminMiddleware,adminController.getEditFragranceOffer)
router.post('/edit-fragrance/:id',adminMiddleware,adminController.editFragranceOffer);

router.get('/logout',adminMiddleware,adminController.handlelogout)



module.exports = router;
