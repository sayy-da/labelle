const Product = require('../models/product');
const Variant = require('../models/variant')
const multer = require('multer');
const path = require('path');

exports.getProductList = async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await Product.find().sort({ createdAt: -1 });

    // Render the product list page
    res.render('admin/product-list', { products });
  } catch (error) {
    console.error('Error fetching product list', error);
    res.status(500).send('Error fetching product list');
  }
};


exports.getAddProduct = (req,res)=>{
  res.render('admin/add-product',{error:''})
}

// Set up Multer storage configuration
const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, './public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const uploads = multer({ storage: storage });

// Controller to add a product
exports.addProduct = [uploads.array('images', 3), async (req, res) => {
  try {
    // Extract data from the form submission
    const { name, fragranceType, gender, occasions, description } = req.body;
    const images = req.files.map(file => '/uploads/' + file.filename);  // Save relative path to the uploads folder
 // Extract image paths

    // Create a new Product instance
    const newProduct = new Product({
      name,
      fragranceType,
      gender,
      occasions,
      description,
      images  // Save the images paths in the database
    });

    // Save the product to the database
    await newProduct.save();
    
    // Redirect to product list page
    res.redirect('/admin/product-list');
  } catch (error) {
    console.error('Error adding product', error);
    res.status(500).send('Error adding product');
  }
}];

// Controller to get the list of products

// exports.addVariant = async (req,res) => {
//   try {
    
//     const {productId,milliliter,price,stock} = req.body
   
//     const newVariant = new Variant({
//       productId,
//       milliliter,
//       price,
//       stock
//     })

//    await newVariant.save();

//    res.redirect('/admin/variant')
//   } catch (error) {
//     console.error('Error adding variant', error);
//     res.status(500).send('Error adding varient');
//   }
// }

// exports.getVariantList = async (req,res)=>{
//   try {
//     const varient = Variant.find().sort({createdAt:-1})
//     res.render('admin/varient',{varient})
//   } catch (error) {
//     console.error('Error fetching variant list', error);
//     res.status(500).send('Error fetching variant list');
//   }
// }

// exports.getAddVariant = (req,res)=>{
//   res.render('admin/add-variant',{error:''})
// }
