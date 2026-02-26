const Product = require('../models/product');
const Variant = require('../models/variant')
const multer = require('multer');
const path = require('path');
const Fragrance = require('../models/fragrance');
const Occasion = require('../models/occasion');
const Milliliter = require('../models/milliliters')
const Order = require('../models/order')
const { error } = require('console');
exports.getProductList = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const query = req.query.query ? req.query.query.trim() : ''


    const filter = query
      ? {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { Fragrance: { $regex: query, $options: 'i' } },
          { Occasion: { $regex: query, $options: 'i' } },
          { gender: { $regex: query, $options: 'i' } },
        ],
      }
      : {};

    const products = await Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)


    const totalProducts = await Product.countDocuments(filter)

    const totalPages = Math.ceil(totalProducts / limit)
    res.render('admin/product-list', { products, page, totalProducts, totalPages, limit, query });
  } catch (error) {
    console.error('Error fetching product list', error);
    res.status(500).send('Error fetching product list');
  }
};



exports.getAddProduct = async (req, res) => {
  const fragrances = await Fragrance.find().sort({ createdAt: -1 });
  const occasions = await Occasion.find().sort({ createdAt: -1 });

  res.render('admin/add-product', {
    errors: {},
    formData: {},
    fragrances,
    occasions
  });
}


const { storage } = require('../config/cloudinary');
const uploads = multer({ storage: storage });

exports.addProduct = [uploads.array('images', 3), async (req, res) => {
  try {
     console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    const fragrances = await Fragrance.find().sort({ createdAt: -1 });
    const occasions = await Occasion.find().sort({ createdAt: -1 });


    const { name, fragranceType, gender, occasions: occasionName, description } = req.body;
    const images = req.files.map(file => file.path);

    const existingProduct = await Product.findOne({ name });
    const errors = {};

    if (!name || name.length > 20) {
      errors.name = 'Product name is required and should not exceed 20 characters.';
    } else if (/[^a-zA-Z0-9\s-]/.test(name) || name.trim() === '') {
      errors.name = 'Product name should not contain special characters (except -), or be empty';
    } else if (existingProduct) {
      errors.name = 'Product already exists.';
    }

    if (!fragranceType) {
      errors.fragranceType = 'Invalid fragrance type selected.';
    }

    if (!gender) {
      errors.gender = 'Invalid gender selected.';
    }

    if (!occasionName) {
      errors.occasions = 'Invalid occasion selected.';
    }

    if (!description || description.length > 1000) {
      errors.description = 'Description is required and should not exceed 1000 characters.';
    }

    if (req.files.length < 3) {
      errors.images = 'You must upload exactly 3 images.';
    }

    if (Object.keys(errors).length > 0) {
      return res.render('admin/add-product', {
        errors: errors,
        fragrances,
        occasions
      });
    }

    const newProduct = new Product({
      name,
      fragranceType,
      gender,
      occasions: occasionName,
      description,
      images
    });

    await newProduct.save();
    res.redirect('/admin/product-list');

  } catch (error) {
    console.error('Error adding product', error);
    res.status(500).send('Error adding product');
  }
}];
exports.getEditProduct = async (req, res) => {
  const { id } = req.params
  try {
    const product = await Product.findById(id)
    const fragrances = await Fragrance.find().sort({ createdAt: -1 });
    const occasiones = await Occasion.find().sort({ createdAt: -1 });

    if (!product) {
      return res.render('product-list', { error: 'Product not found' })
    }
    res.render('admin/edit-product', {
      name: product.name,
      fragranceType: product.fragranceType,
      gender: product.gender,
      occasions: product.occasions,
      description: product.description,
      images: product.images,
      id: product._id,
      error: null,
      fragrances,
      occasiones
    })
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).send('Failed to fetch product details');
  }
}

exports.editVariant = async (req, res) => {
  const { id } = req.params;
  const { milliliter, price, stock, productId } = req.body;

  try {


    const variant = await Variant.findById(id)
    if (!variant) {
      throw new Error('variant not found');
    }

    variant.milliliter = milliliter;
    variant.price = price;
    variant.stock = stock;
    variant.productId = productId
    await variant.save();

    res.redirect(`/admin/variant/${productId}`);
  } catch (error) {
    console.error('Error editing variant:', error);
    res.render('admin/edit-variant', {
      error: 'Failed to edit product. Please try again.',
      milliliter,
      price,
      stock,
      id,
      productId

    });
  }
}


exports.editProduct = [
  uploads.array('images', 3),
  async (req, res) => {
    const { id } = req.params;
    const { name, fragranceType, gender, occasions, description } = req.body;


    try {
      const product = await Product.findById(id);

      if (!product) {
        throw new Error('Product not found');
      }


      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => file.path);
        product.images = newImages;
      }

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
        images: product.images || [],
        id
      });
    }
  }
];

exports.getEditVariant = async (req, res) => {
  const { id } = req.params

  try {
    const variant = await Variant.findById(id)
    if (!variant) {
      return res.render('variant', { error: 'variant not found' })
    }

    const milliliters = await Milliliter.find().sort({ createdAt: -1 });
    res.render('admin/edit-variant', {
      milliliter: variant.milliliter,
      price: variant.price,
      stock: variant.stock,
      id: variant._id,
      milliliters,
      productId: variant.productId,

      error: null
    })
  } catch (error) {
    console.error('Error fetching variarnt:', error);
    res.status(500).send('Failed to fetch variant details');
  }
}


exports.getAddVariant = async (req, res) => {
  const productId = req.params.productId

  const milliliters = await Milliliter.find().sort({ createdAt: -1 });

  res.render('admin/add-variant', { productId, milliliters, error: {} })
}
exports.addVariant = async (req, res) => {
  try {
    const productId = req.params.productId
    const { milliliter, price, stock } = req.body



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

exports.getVariantList = async (req, res) => {
  try {
    const productId = req.params.productId



    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const query = req.query.query ? req.query.query.trim() : ''


    const filter = query
      ? {
        $or: [
          { milliliter: { $regex: query, $options: 'i' } },
          { stock: { $regex: query, $options: 'i' } },
          { price: { $regex: query, $options: 'i' } },
        ],
      }
      : {};

    const variants = await Variant.find({ productId }, filter).sort({ createdAt: -1 }).skip(skip).limit(limit)


    const totalvariants = await Variant.countDocuments({ productId }, filter)

    const totalPages = Math.ceil(totalvariants / limit)
    res.render('admin/variant', { variants, productId, page, totalvariants, totalPages, limit, query })
  } catch (error) {
    console.error('Error fetching variant list', error);
    res.status(500).send('Error fetching variant list');
  }
}





exports.addFragrance = async (req, res) => {
  let { name, offer } = req.body;



  try {

    if (/\d/.test(name) || /[^a-zA-Z0-9\s-]/.test(name) || name.trim() === '') {
      return res.render('admin/add-fragrance', {
        error: 'Fragrance name cannot contain numbers, special characters (except -), or be empty.',
        name
      });
    }



    const lowercaseName = name.trim().toLowerCase();

    const existingFragrance = await Fragrance.findOne({ name: lowercaseName });

    if (existingFragrance) {
      return res.render('admin/add-fragrance', {
        error: 'Fragrance name already exists',
        name
      });
    }

    const newFragrance = new Fragrance({ name: name, offer: offer });



    await newFragrance.save();

    res.redirect('/admin/fragrance-list');
  } catch (error) {
    console.error('Error adding fragrance:', error);
    res.status(500).send({ success: false, message: 'Failed to add fragrance' });
  }
};


exports.getAddFragrance = (req, res) => {
  res.render('admin/add-fragrance', { error: '' })
}
exports.getFragranceList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const query = req.query.query ? req.query.query.trim() : '';


    const filter = query
      ? { name: { $regex: query, $options: 'i' } }
      : {};

    const fragrances = await Fragrance.find(filter).sort({ createdAt: -1 })
      .skip(skip).limit(limit)

    const totalFragrances = await Fragrance.countDocuments(filter)

    const totalPages = Math.ceil(totalFragrances / limit)

    res.render('admin/fragrance-list', { fragrances, page, totalFragrances, totalPages, limit, query });
  } catch (error) {
    console.error('Error fetching product list', error);
    res.status(500).send('Error fetching product list');
  }
};

exports.addOccasion = async (req, res) => {
  const { name } = req.body;


  try {
    if (/\d/.test(name) || /[^a-zA-Z0-9\s/-]/.test(name) || name.trim() === '') {
      return res.render('admin/add-occasion', {
        error: 'Occasion name cannot contain numbers, special characters (except - and /), or be empty.',
        name
      });
    }

    const lowercaseName = name.trim().toLowerCase();


    const existingOccasion = await Occasion.findOne({ name: lowercaseName });

    if (existingOccasion) {
      return res.render('admin/add-occasion', {
        error: 'Occasion name already exists (case-insensitive)',
        name
      })
    }
    const newOccasion = new Occasion({ name: name });
    await newOccasion.save();
    res.redirect('/admin/occasion-list');
  } catch (error) {
    console.error('Error adding occasion:', error);
    res.status(500).send('Failed to add occasion');
  }
};



exports.getAddOccasion = (req, res) => {
  res.render('admin/add-occasion', { error: '' })
}

exports.getOccasionList = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const query = req.query.query ? req.query.query.trim() : '';


    const filter = query
      ? { name: { $regex: query, $options: 'i' } }
      : {};

    const occasions = await Occasion.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)

    const totalOccasions = await Occasion.countDocuments(filter)

    const totalPages = Math.ceil(totalOccasions / limit)

    res.render('admin/occasion-list', { occasions, page, totalOccasions, totalPages, limit, query });
  } catch (error) {
    console.error('Error fetching occasion list', error);
    res.status(500).send('Error fetching occasion list');
  }
};



exports.getMillilitersList = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const query = req.query.query ? req.query.query.trim() : '';


    const filter = query
      ? { name: { $regex: query, $options: 'i' } }
      : {};

    const milliliters = await Milliliter.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)

    const totalMilliliters = await Milliliter.countDocuments(filter)

    const totalPages = Math.ceil(totalMilliliters / limit)

    res.render('admin/milliliters-list', { milliliters, page, totalMilliliters, totalPages, limit, query });
  } catch (error) {
    console.error('Error fetching milliliters list', error);
    res.status(500).send('Error fetching milliliters list');
  }
};



exports.getAddMilliliters = (req, res) => {
  res.render('admin/add-milliliters', { error: '' })
}



exports.addMilliliters = async (req, res) => {
  const { milliliter } = req.body;


  try {

    if (/\D/.test(milliliter) || /[^0-9\s]/.test(milliliter) || milliliter.trim() === '') {
      return res.render('admin/add-milliliters', {
        error: 'Milliliter value cannot contain letters, special characters, or be empty.',
        milliliter
      });
    }

    if (parseInt(milliliter) > 1000) {
      return res.render('admin/add-milliliters', {
        error: 'Milliliter value cannot exceed 1000 ml.',
        milliliter
      });
    }

    const newMilliliter = new Milliliter({ milliliter });
    await newMilliliter.save();
    res.redirect('/admin/milliliters-list');
  } catch (error) {
    console.error('Error adding milliliters:', error);
    res.status(500).send('Failed to add milliliters');
  }
};

exports.getOrderList = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const query = req.query.query ? req.query.query.trim() : ''

    const filter = query
      ? {
        $or: [
          { orderId: { $regex: query, $options: 'i' } },
        ],
      }
      : {};



    const orders = await Order.find(filter)
      .populate('userId', 'name email')
      .populate({
        path: 'orderedItems.variantId',
        model: 'Variant',
        populate: {
          path: 'productId',
          model: 'Product',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);



    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    res.render('admin/order-list', {
      orders,
      page,
      totalOrders,
      totalPages,
      limit,
      query
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).send('Server Error');
  }
};





exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId })
      .populate('userId', 'name email')
      .populate({
        path: 'orderedItems.variantId',
        model: 'Variant',
        populate: {
          path: 'productId',
          model: 'Product',
          select: 'name',
        },
      });

    if (!order) {
      return res.status(404).send('Order not found');
    }

    res.render('admin/order-details', { order });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).send('Server Error');
  }
};



exports.updateOrderStatus = async (req, res) => {
  const { orderId, newStatus } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const finalStates = ['Delivered', 'Cancelled', 'Returned'];
    if (finalStates.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status}`
      });
    }

    order.status = newStatus;



    await order.save();

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({
        success: true,
        order: {
          status: order.status,
          paymentStatus: order.paymentStatus
        }
      });
    }

    res.redirect('/admin/order-list');
  } catch (error) {
    console.error('Error updating order status:', error);

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    res.status(500).send('Server error');
  }
};