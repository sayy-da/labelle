const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController')
const adminMiddleware = require('../middleware/adminmiddleware')

/* GET home page. */
router.get('/login', adminController.showAdminLogin);
router.post('/login',adminController.handleAdminLogin)


router.get('/dashboard',adminMiddleware,adminController.adminDashboard);


router.get('/all-user',adminController.viewUsers);
// router.get('/all-user',adminMiddleware,adminController.viewUsersProfile);
// router.get('/edit-user/:id',adminController.editUser)
// router.post('/delete/:id',adminMiddleware,adminController.deleteUser)
router.post('/toggle-status/:id',adminController.toggleStatus)




// router.get('/edit-user', (req, res) =>{
//   res.render('admin/edit-user');
// });

// router.get('/product-list', (req, res) =>{
//   res.render('admin/product-list');
// });

// router.get('/add-product', (req, res) =>{
//   res.render('admin/add-product');
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
