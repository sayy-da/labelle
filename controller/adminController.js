const User =require('../models/users')
const mongoose = require('mongoose')
const bcrypt =require('bcrypt')
const Coupon = require('../models/coupon');
const Variant = require('../models/variant');
const Product =require('../models/product');
const Order =require('../models/order');
const Fragrance = require('../models/fragrance');

const adminCredentials = {
  username: 'sayyida',
  password: 'sayyida123'
};


exports.showAdminLogin = (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }

  
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const error = req.session.error;
  req.session.error = null;

  res.render('admin/login', { error });
};

exports.handleAdminLogin = (req, res) => {
  const { username, password } = req.body;

  if (username === adminCredentials.username && password === adminCredentials.password) {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  } else {
    req.session.error = 'Invalid credentials';
   return res.redirect('/admin/login');
  }
};

exports.adminDashboard = async (req, res) => {
  if (!req.session.isAdmin) {
      return res.redirect('/admin/login');
  } else {
      try {
          const overallStats = await Order.aggregate([
              { $match: { paymentStatus: 'true' } },
              {
                  $group: {
                      _id: null,
                      totalSalesCount: { $sum: 1 },
                      totalSalesAmount: { $sum: '$totalAmount' },
                      totalDiscount: { $sum: '$discount' }
                  }
              }
          ]);

          const stats = overallStats[0] || {
              totalSalesCount: 0,
              totalSalesAmount: 0,
              totalDiscount: 0
          };
          const statusBreakdown = await Order.aggregate([
              { $group: {
                  _id: '$status',
                  count: { $sum: 1 },
                  totalAmount: { $sum: '$totalAmount' }
              }}
          ]);

          const paymentMethodBreakdown = await Order.aggregate([
              { $match: { paymentStatus: 'success' } },
              { $group: {
                  _id: '$paymentMethod',
                  count: { $sum: 1 },
                  totalAmount: { $sum: '$totalAmount' }
              }}
          ]);

          const topSellingFragrances = await Order.aggregate([
            { $unwind: '$orderedItems' }, 
            { $match: { 'orderedItems.isCancelled': false } }, 
            { $group: {
                _id: '$orderedItems.variantId',  
                totalSales: { $sum: '$orderedItems.quantity' },
                totalAmount: { $sum: { $multiply: ['$orderedItems.quantity', '$orderedItems.price'] } } ,
                
            }},
            { $sort: { totalSales: -1 } },  
            { $limit: 10 },
            { 
                $lookup: { 
                    from: 'variants', 
                    localField: '_id', 
                    foreignField: '_id', 
                    as: 'variantDetails'
                }
            },
            { 
                $unwind: { 
                    path: '$variantDetails', 
                    preserveNullAndEmptyArrays: true 
                } 
            },
            { 
                $lookup: {
                    from: 'products', 
                    localField: 'variantDetails.productId', 
                    foreignField: '_id', 
                    as: 'productDetails'
                }
            },
            { 
                $unwind: { 
                    path: '$productDetails', 
                    preserveNullAndEmptyArrays: true 
                } 
            },
            { 
                $project: { 
                    _id: 1,
                    totalSales: 1,
                    totalAmount: 1,
                    variantDetails: {
                        _id: 1,
                        name: 1,
                        price: 1
                    },
                    productDetails: {
                        _id: 1,
                        fragranceType: 1
                    }
                } 
            }
        ]);


   
        const topFragrance = topSellingFragrances[0]
          ? await Variant.findById(topSellingFragrances[0]._id).populate('productId', 'fragranceType')  
          : null;
     

         
          const topSellingProducts = await Order.aggregate([
            { $unwind: '$orderedItems' },
            { $match: { 'orderedItems.isCancelled': false } },
            {
              $group: {
                _id: '$orderedItems.variantId',
                totalSales: { $sum: '$orderedItems.quantity' },
                totalAmount: { $sum: { $multiply: ['$orderedItems.quantity', '$orderedItems.price'] } }
              }
            },
            {
              $lookup: {
                from: 'variants', 
                localField: '_id',
                foreignField: '_id',
                as: 'variantDetails'
              }
            },
            {
              $unwind: {
                path: '$variantDetails',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: 'products', 
                localField: 'variantDetails.productId',
                foreignField: '_id',
                as: 'productDetails'
              }
            },
            {
              $unwind: {
                path: '$productDetails',
                preserveNullAndEmptyArrays: true
              }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 10 }
          ]);
          

       

     
          const topProduct = topSellingProducts[0]
            ? await Variant.findById(topSellingProducts[0]._id).populate('productId', 'name')  
            : null;

          res.render('admin/dashboard', {
              overall: stats,
              statusBreakdown,
              paymentMethodBreakdown,
              topSellingFragrances,
              topSellingProducts ,
              topSellingProduct: topProduct ,
              topSellingFragrance: topFragrance 
          });
      } catch (error) {
          console.error('Error fetching dashboard statistics:', error);
          res.status(500).send('Internal Server Error');
      }
  }
};


exports.dashboard = async (req, res) => {
  const { filter, startDate, endDate } = req.body;
  let filterCriteria = {};
  if(!filter){
    filter = 'daily'
  }

  if (filter === 'daily') {
    filterCriteria.date = { $gte: new Date(new Date().setHours(0, 0, 0, 0)) };
  } else if (filter === 'weekly') {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    filterCriteria.date = { $gte: startOfWeek };
  } else if (filter === 'yearly') {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    filterCriteria.date = { $gte: startOfYear };
  } else if (filter === 'custom' && startDate && endDate) {
    filterCriteria.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  try {
    const orders = await Order.find(filterCriteria).populate('userId', 'name');

    const groupedData = {};
    orders.forEach((order) => {
      const date = new Date(order.date).toLocaleDateString();
      if (!groupedData[date]) groupedData[date] = 0;
      groupedData[date] += order.totalAmount;
    });

    res.json({
      labels: Object.keys(groupedData),
      salesData: Object.values(groupedData),
      summary: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      },
      tableData: orders.map((order) => ({
        orderID: order._id,
        username: order.userId.name,
        totalAmount: order.totalAmount,
        discount: order.discount,
        status: order.status,
        payment: order.paymentMethod,
        createdAt: order.date,
      })),
    });
  } catch (error) {
    console.error('Error in dashboard',error);
    res.status(500).send('Internal Server Error');
  }
};







exports.viewUsers = async (req, res)=>{    
  try{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const query =  req.query.query ? req.query.query.trim() : '';

    const filter = query
    ? {
        $or: [
          { name: { $regex: query, $options: 'i' } },    
          { email: { $regex: query, $options: 'i' } }  
          
        ],
      }
    : {};
        
         
    const users = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)

    const totalUsers = await User.countDocuments(filter)

    const totalPages = Math.ceil(totalUsers/limit) 

    res.render('admin/all-user',{users,page,totalUsers,totalPages,limit,query}) 
  }catch (error){
    res.status(500).send('Error retrieving users')
  }
}



exports.toggleStatus = async (req, res) => {
  const userId = req.params.id;    
  try {
  const user = await User.findById(userId);
    
    if (!user) {
    
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
  user.status = user.status === 'active' ? 'blocked' : 'active';
    try {
      await user.save();
   
      
      res.json({ 
        success: true, 
        newStatus: user.status 
      });
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      
      if (saveError.name === 'ValidationError') {
        console.error('Validation Errors:', saveError.errors);
        return res.status(400).json({
          success: false,
          message: 'Validation error occurred',
          errors: Object.keys(saveError.errors).map(key => saveError.errors[key].message)
        });
      }
      
      console.error('Full save error:', saveError);
      
      res.status(500).json({ 
        success: false, 
        message: 'Error saving user status: ' + saveError.message 
      });
    }
  } catch (error) {
    console.error('Error finding user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred: ' + error.message 
    });
  }
}


exports.getAddCoupon =  async (req, res) => {
  try {
      let code;
      let isUnique = false;
      while (!isUnique) {
          code = generateCouponCode();
          const existingCoupon = await Coupon.findOne({ code });
          if (!existingCoupon) {
              isUnique = true;
          }
      }

      res.render('admin/add-coupon', { code }); 
  } catch (error) {
      res.status(500).send("An error occurred while generating the coupon code.");
  }
};

const generateCouponCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

exports.addCoupon =  async (req, res) => {
  try {
      const {
          expireOn,
          minimumPrice,
          maximumPrice,
          discount,
      } = req.body;

      if (!expireOn || !minimumPrice || !maximumPrice || !discount) {
          return res.status(400).json({
              message: "All required fields must be provided."
          });
      }

      let code;
      let isUnique = false;
      while (!isUnique) {
          code = generateCouponCode();
          const existingCoupon = await Coupon.findOne({ code });
          if (!existingCoupon) {
              isUnique = true;
          }
      }

      const newCoupon = new Coupon({
          code,
          expireOn,
          minimumPrice,
          maximumPrice,
          discount,
      });

  
     await newCoupon.save();

      res.redirect('/admin/coupons-list');
  } catch (error) {
      if (error.code === 11000) {
          return res.status(400).json({
              message: "Coupon code must be unique."
          });
      }
      res.status(500).json({
          message: "An error occurred while adding the coupon.",
          error: error.message
      });
  }
};


exports.getCouponslist = async (req, res) => {    
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = req.query.query ? req.query.query.trim() : '';

    const filter = query
      ? {
          $or: [
            { code: { $regex: query, $options: 'i' } }    
          ],
        }
      : {};

    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCoupons = await Coupon.countDocuments(filter);

    const totalPages = Math.ceil(totalCoupons / limit); 

    res.render('admin/coupons-list', {
      coupons,
      page,
      totalCoupons,
      totalPages,
      limit,
      query
    });
  } catch (error) {
    console.error('Error retrieving coupons-list:', error);
    res.status(500).send('Error retrieving coupons list');
  }
};



exports.deleteCoupon = async (req, res) => {
  try {
      const { id } = req.params;


      const deletedCoupon = await Coupon.findByIdAndDelete(id);

      if (!deletedCoupon) {
          return res.status(404).json({ message: "Coupon not found." });
      }

      res.status(200).json({ message: "Coupon deleted successfully." });
  } catch (error) {
      res.status(500).json({
          message: "An error occurred while deleting the coupon.",
          error: error.message,
      });
  }
};


exports.getOfferslist = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const query = req.query.query ? req.query.query.trim() : '';

  const filter = query
    ? {
        $or: [
          { name: { $regex: query, $options: 'i' } },    
          { offer: { $regex: query, $options: 'i' } }  
        ],
      }
    : {};
  
    try {
      
      const products = await Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
     

      const totalOffers = await Coupon.countDocuments(filter);

      const totalPages = Math.ceil(totalOffers / limit); 
  
      
      res.render('admin/offers-list', { products,error: '',page,
        totalOffers,
        totalPages,
        limit,
        query
     })
    } catch (error) {
      res.render('admin/offers-list', {
        error: 'Server error. Please try again later.'
      });
    }
  }


  exports.getOffersvariantlist = async (req,res)=>{
    try {
      const productId = req.params.productId
      const page = parseInt(req.query.page)||1
      const limit = parseInt(req.query.limit)||10
      const skip =(page-1)*limit
      const query =  req.query.query ? req.query.query.trim() : ''
  
  
      const filter = query
      ? {
          $or: [
            { milliliter: { $regex: query, $options: 'i' } },   
            { stock: { $regex: query, $options: 'i' } }, 
            { price: { $regex: query, $options: 'i' } },   
          ],
        }
      : {};
  
      const variants = await Variant.find({productId},filter).sort({createdAt:-1}).skip(skip).limit(limit)
  
      const totalvariants = await Variant.countDocuments({productId},filter)
  
      const totalPages = Math. ceil(totalvariants/limit) 
      res.render('admin/offers-variant-list',{variants,productId,page,totalvariants,totalPages,limit,query})
    } catch (error) {
      console.error('Error fetching variant list', error);
      res.status(500).send('Error fetching variant list');
    }
  }
  

  exports.getAddOffer = exports.getEditVariant = async (req,res) => {
    const {id} = req.params
  
    try {
      const variant = await Variant.findById(id)
      if(!variant){
        return res.render('variant',{error:'variant not found' })
      }
      

      res.render('admin/add-Offer',{
        offer:variant.offer,
        id:variant._id,
        productId:variant.productId,
        error:null
      })
    } catch (error) {
      console.error('Error fetching variarnt:', error);
      res.status(500).send('Failed to fetch variant details');
    }
  }

  exports.addOffer = async (req, res) => {
    try {
      const { id } = req.params; 
      const { offer } = req.body; 

      if (!offer || offer < 0) {
        return res.status(400).send('Offer must be a positive number.');
      }
  
      const variant = await Variant.findByIdAndUpdate(
        id,
        { offer }, 
        { new: true } 
      );
  
      if (!variant) {
        return res.status(404).send('Variant not found.');
      }
  
      res.redirect(`/admin/offers-variant-list/${variant.productId}`)
    } catch (error) {
      console.error('Error updating offer for variant:', error);
      res.status(500).send('Server error. Please try again later.');
    }
  };

  exports.getCategoriesOffer = async (req,res) => {
    res.render('admin/category-offer-list')
  }

  exports.getAddFragranceOffer = async (req, res) => {
    try {
      let fragrances = await Fragrance.find().sort({ createdAt: -1 });
  
      fragrances = fragrances.filter(fragrance => !fragrance.offer);
  
      res.render('admin/add-fragrance-offer', {
        fragrances: fragrances,
      });
    } catch (error) {
      console.error('Error fetching fragrances:', error);
      res.status(500).send('An error occurred while processing your request.');
    }
  };
  

  exports.addFragranceOffer = async (req, res) => {
    try {
      const { fragranceId, offer } = req.body;
  
      if (!fragranceId || !offer || offer < 0 || offer > 100) {
        return res.status(400).send('Invalid fragrance or offer value.');
      }
  
      const fragrance = await Fragrance.findById(fragranceId);
      if (!fragrance) {
        return res.status(404).send('Fragrance not found.');
      }
  
      fragrance.offer = offer; 
      await fragrance.save();
  
      res.redirect('/admin/fragrance-list');
    } catch (error) {
      console.error('Error adding fragrance offer:', error);
      res.status(500).send('An error occurred while processing your request.');
    }
  };
  


  exports.getEditFragranceOffer = async (req, res) => {
      const { id } = req.params; 
  
      try {
          const fragrance = await Fragrance.findById(id);
  
          if (!fragrance) {
              return res.status(404).send('Fragrance not found');
          }
  
          res.render('admin/edit-fragrance', { fragrance });
      } catch (error) {
          console.error('Error fetching fragrance:', error);
          res.status(500).send('Error fetching fragrance for editing');
      }
  };
  
  exports.editFragranceOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, offer } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Invalid or missing fragrance name' });
        }
        if (offer === undefined || offer < 0) {
            return res.status(400).json({ error: 'Invalid or missing offer value' });
        }

        const updatedFragrance = await Fragrance.findByIdAndUpdate(
            id,
            { name, offer },
            { new: true, runValidators: true, context: 'query' }
        );

        if (!updatedFragrance) {
            return res.status(404).json({ error: 'Fragrance not found' });
        }

        res.redirect('/admin/fragrance-list'); 
    } catch (error) {
        console.error('Error updating fragrance:', error);
        res.status(500).json({ error: 'An error occurred while updating the fragrance' });
    }
};


exports.handlelogout = (req,res)=>{
  req.session.destroy((err)=>{
    if(err){
      return res.status(500).send('failed to logout')
    }
    res.redirect('/admin/login')
  })
}