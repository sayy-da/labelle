const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const productController = require('../controller/productController');
const adminMiddleware = require('../middleware/adminmiddleware');


router.get('/login', adminController.showAdminLogin);
router.post('/login', adminController.handleAdminLogin);

router.get('/dashboard', adminMiddleware, adminController.adminDashboard);

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

router.get('/fragrance-list',adminMiddleware,productController.getFragranceList)
router.get('/add-fragrance',adminMiddleware,productController.getAddFragrance)
router.post('/add-fragrance',adminMiddleware,productController.addFragrance)

router.get('/occasion-list',adminMiddleware,productController.getOccasionList)
router.get('/add-occasion',adminMiddleware,productController.getAddOccasion)
router.post('/add-occasion',adminMiddleware,productController.addOccasion)

router.get('/logout',adminMiddleware,adminController.handlelogout)



module.exports = router;
