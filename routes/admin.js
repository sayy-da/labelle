const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const productController = require('../controller/productController');
const adminMiddleware = require('../middleware/adminmiddleware');


router.get('/login', adminController.showAdminLogin);
router.post('/login', adminController.handleAdminLogin);

router.get('/dashboard', adminMiddleware, adminController.adminDashboard);

router.get('/all-user',adminController.viewUsers);
router.post('/toggle-status/:id',adminController.toggleStatus)


router.get('/product-list',productController.getProductList)
router.get('/add-product',productController.getAddProduct )
router.post('/add-product',productController.addProduct)


router.get('/variant/:productId',productController.getVariantList)
router.get('/add-variant/:productId',productController.getAddVariant)
router.post('/add-variant/:productId',productController.addVariant)

router.get('/fragrance-list',productController.getFragranceList)
router.get('/add-fragrance',productController.getAddFragrance)
router.post('/add-fragrance',productController.addFragrance)

router.get('/occasion-list',productController.getOccasionList)
router.get('/add-occasion',productController.getAddOccasion)
router.post('/add-occasion',productController.addOccasion)
// router.post('')
// // router.get('/product-list',(req,res)=>{
// //   res.render('admin/product-list')
// // })

// router.get('/variant', (req, res) =>{
//   res.render('admin/variant');
// });
// router.get('/add-variant', (req, res) =>{
//   res.render('admin/add-variant');
// });

// router.get('/edit-product', (req, res) =>{
//   res.render('admin/edit-product');
// });

// router.get('/category', (req, res) =>{
//   res.render('admin/category');
// });

// router.get('/new-category', (req, res) =>{
//   res.render('admin/new-category');
// });

// product management

// router.get('/add-product',adminController,)





router.get('/logout',adminController.handlelogout)



module.exports = router;
