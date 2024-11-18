const Product = require('../models/product');
const Variant = require('../models/variant')
const multer = require('multer');
const path = require('path');
const Fragrance = require('../models/fragrance');
const Occasion = require('../models/occasion');
const { error } = require('console');
exports.getProductList = async (req, res) => {
  try {
    // Fetch all products from the database
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) ||10
    const skip =(page-1)*limit
    const query =  req.query.query ? req.query.query.trim() : ''


    const filter = query
    ? {
        $or: [
          { name: { $regex: query, $options: 'i' } },    // Search for name
          { Fragrance: { $regex: query, $options: 'i' } },  // Search for fragrance
          { Occasion: { $regex: query, $options: 'i' } },   // Search for occasion
          { gender: { $regex: query, $options: 'i' } },     // Search for gender
        ],
      }
    : {};

    const products = await Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)

    const totalProducts = await Product.countDocuments(filter)

    const totalPages = Math. ceil(totalProducts/limit) 
    // Render the product list page
    res.render('admin/product-list', { products ,page,totalProducts,totalPages,limit,query});
  } catch (error) {
    console.error('Error fetching product list', error);
    res.status(500).send('Error fetching product list');
  }
};


exports.getAddProduct = async (req,res)=>{
  const fragrances = await Fragrance.find().sort({ createdAt: -1 });
  const occasions = await Occasion.find().sort({ createdAt: -1 });
  
  res.render('admin/add-product',{error:'',fragrances,occasions})
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

exports.getEditProduct = async (req,res) => {
  const {id} = req.params
  try{
    const product = await Product.findById(id)
    const fragrances = await Fragrance.find().sort({ createdAt: -1 });
    const occasiones = await Occasion.find().sort({ createdAt: -1 });
    // const images = req.files.map(file => '/uploads/' + file.filename);  
    if(!product){
      return res.render('product-list',{error:'Product not found' })
    }
    res.render('admin/edit-product',{
      name:product.name,
      fragranceType:product.fragranceType,
      gender:product.gender,
      occasions:product.occasions,
      description:product.description,
      images:product.images,
      id:product._id,
      error:null,
      fragrances,
      occasiones
    })
  }catch(error){
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Failed to fetch product details' });
  }

}
exports.editProduct = [
  uploads.array('images', 3), // Handle multiple file uploads
  async (req, res) => {
    const { id } = req.params;
    const { name, fragranceType, gender, occasions, description } = req.body;
    
    console.log('Request body:', req.body);
    console.log('Editing product with ID:', id);

    try {
      const product = await Product.findById(id);
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Handle image uploads if new files were uploaded
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => '/uploads/' + file.filename);
        product.images = newImages;
      }

      // Update product fields
      product.name = name;
      product.fragranceType = fragranceType;
      product.gender = gender;
      product.occasions = occasions;
      product.description = description;

      await product.save();
      
      res.redirect('/admin/product-list');
    } catch (error) {
      console.error('Error editing product:', error);
      const fragrances = await Fragrance.find().sort({ createdAt: -1 });
      const occasiones = await Occasion.find().sort({ createdAt: -1 });
      
      res.render('admin/edit-product', {
        error: 'Failed to edit product. Please try again.',
        name,
        fragranceType,
        fragrances,
        gender,
        occasions,
        occasiones,
        description,
        images: product?.images || [],
        id
      });
    }
  }
];

// Controller to get the list of variants

exports.addVariant = async (req,res) => {
  try {   
    const productId = req.params.productId
    const {milliliter,price,stock} = req.body
   console.log(productId);
   
    const newVariant = new Variant({
      productId,
      milliliter,
      price,
      stock
    })

   await newVariant.save();

   res.redirect(`/admin/variant/${productId}`)
  } catch (error) {
    console.error('Error adding variant', error);
    res.status(500).send('Error adding variant');
  }
}

exports.getVariantList = async (req,res)=>{
  try {
     const productId = req.params.productId
     console.log(productId);

     
    const page = parseInt(req.query.page)||1
    const limit = parseInt(req.query.limit)||10
    const skip =(page-1)*limit
    const query =  req.query.query ? req.query.query.trim() : ''


    const filter = query
    ? {
        $or: [
          { milliliter: { $regex: query, $options: 'i' } },    // Search for name
          { stock: { $regex: query, $options: 'i' } },  // Search for fragrance
          { price: { $regex: query, $options: 'i' } },   // Search for occasion
        ],
      }
    : {};

    const variants = await Variant.find({productId},filter).sort({createdAt:-1}).skip(skip).limit(limit)

    const totalvariants = await Variant.countDocuments({productId},filter)

    const totalPages = Math. ceil(totalvariants/limit) 
    res.render('admin/variant',{variants,productId,page,totalvariants,totalPages,limit,query})
  } catch (error) {
    console.error('Error fetching variant list', error);
    res.status(500).send('Error fetching variant list');
  }
}

exports.getAddVariant = async  (req,res)=>{
  const productId = req.params.productId
  console.log(productId);
  
  res.render('admin/add-variant',{productId,error:''})
}

 // Assuming the model is located here

 exports.addFragrance = async (req, res) => {
  const { name } = req.body;
  console.log('Received fragrance name:', name); // Log the received name

  try {
    const newFragrance = new Fragrance({ name });

    const existingFragrance = await Fragrance.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });

    if (existingFragrance) {
      // If an occasion with the same name exists (case-insensitive), return a message
      return res.render('admin/add-fragrance', { 
       error: 'Fragrance name already exists (case-insensitive)', 
        name
       })
    }
    // Save the fragrance to the database
    await newFragrance.save();

    // Redirect to the fragrance list page after successful creation
    res.redirect('/admin/fragrance-list');
  } catch (error) {
    console.error('Error adding fragrance:', error);
    res.status(500).send({ success: false, message: 'Failed to add fragrance' });
  }
};


exports.getAddFragrance = (req,res)=>{
  res.render('admin/add-fragrance',{error:''})
}
exports.getFragranceList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) ||10
    const skip =(page-1)*limit
    const query = req.query.query ? req.query.query.trim() : '';
   
   
    const filter = query
      ? { name: { $regex: query, $options: 'i' }}  // Search filter
      : {};

    const fragrances = await Fragrance.find(filter).sort({ createdAt: -1 })
    .skip(skip).limit(limit)

    const totalFragrances = await Fragrance.countDocuments(filter)

    const totalPages = Math.ceil(totalFragrances/limit) 
    
    res.render('admin/fragrance-list', { fragrances,page,totalFragrances,totalPages,limit,query });
  } catch (error) {
    console.error('Error fetching product list', error);
    res.status(500).send('Error fetching product list');
  }
};

exports.addOccasion = async (req, res) => {
  const { name } = req.body;
  console.log('Received occasion name:', name);

  try {

    const existingOccasion = await Occasion.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });

    if (existingOccasion) {
      // If an occasion with the same name exists (case-insensitive), return a message
      return res.render('admin/add-occasion', {  
        error: 'Occasion name already exists (case-insensitive)', 
        name
       })
    }
    const newOccasion = new Occasion({ name });
    await newOccasion.save();
    res.redirect('/admin/occasion-list');
  } catch (error) {
    console.error('Error adding occasion:', error);
    res.status(500).json({ success: false, message: 'Failed to add occasion' });
  }
};



exports.getAddOccasion = (req,res)=>{
  res.render('admin/add-occasion',{error:''})
}

exports.getOccasionList = async (req, res) => {
  try {
     
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) ||10
    const skip =(page-1)*limit
  
    const query = req.query.query ? req.query.query.trim() : '';
   
   
    const filter = query
      ? { name: { $regex: query, $options: 'i' }}  // Search filter
      : {};

    const occasions = await Occasion.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)

    const totalOccasions = await Occasion.countDocuments(filter)

    const totalPages = Math. ceil(totalOccasions/limit) 
    
    res.render('admin/occasion-list', { occasions, page,totalOccasions,totalPages,limit,query});
  } catch (error) {
    console.error('Error fetching occasion list', error);
    res.status(500).send('Error fetching occasion list');
  }
};
