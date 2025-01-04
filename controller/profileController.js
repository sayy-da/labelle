const bcrypt = require('bcrypt')
const Cart = require('../models/cart')
const Product = require('../models/product')
const Fragrance = require('../models/fragrance')
const Address = require('../models/address')
const Milliliters = require('../models/milliliters')
const Occasion = require('../models/occasion')
const Order = require('../models/order')
const User = require('../models/users')
const Variant = require('../models/variant')
const Wishlist = require('../models/wishlist')
const crypto = require('crypto');
const Coupon = require('../models/coupon');
const Razorpay = require('razorpay');
const PDFDocument = require('pdfkit');





exports.profile = async (req, res) => {

  const user = req.session.user
  if (!user) {
    console.error('User not logged in.');
    return res.redirect('/login');
  }
  try {
    const userData = await User.findOne({ _id: user });
    if (userData.status=='blocked') {
      console.error('User is blocked.');
      return res.redirect('/login');
    }


    const address = await Address.findOne({ userId: user });

    if (!userData.referralCode) {
      const generateReferralCode = () => {
        const randomString = crypto.randomBytes(3).toString('hex'); 
        return `${userData.name.substring(0, 3).toUpperCase()}-${randomString}`; 
      };

      let referralCode = generateReferralCode();

      while (await User.findOne({ referralCode })) {
        referralCode = generateReferralCode();
      }

      userData.referralCode = referralCode;
      await userData.save();
    }

    if (!userData) {
      console.error('User not found in the database.');
      return res.status(404).send('User not found.');
    }

    res.render('user/user-profile', { userData, address, user });
  } catch (error) {
    console.error('Error fetching user address:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.editProfile = async (req, res) => {

  const { gender, dateofbirth, phone, userId } = req.body
  try {
    const user = req.session.user
    const userData = await User.findOne({ _id: user });
  
    if (!user) {
      console.error('User not logged in.');
      return res.redirect('/login');
    }
    if(userData.status=='blocked'){
      
      return res.redirect('/login');
    }

    await User.updateOne({ _id: userId }, {
      $set: {
        phone: phone,
        gender: gender,
        dateofbirth: dateofbirth,
      }
    })
    res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
}


exports.getAddress = async (req, res) => {


  try {
    const user = req.session.user;
    if (!user) {
      console.error('User not logged in.');
      return res.redirect('/login');
    }

    const userData = await User.findOne({ _id: user })
    if(userData.status=='blocked'){
      
      return res.redirect('/login');
    }
    const addressDoc = await Address.findOne({ userId: user });
    const addresses = addressDoc ? addressDoc.address : [];

    res.render('user/user-address', { addresses,userData,user });
} catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Failed to retrieve addresses' });
}
};



exports.editAddress = async (req, res) => {
  const { addressType, name, streetAddress, city, landmark, state, pincode, phone, addressId } = req.body

  const user = req.session.user
  const userData = await User.findOne({ _id: user });

  if (!user) {
    console.error('User not logged in.');
    return res.redirect('/login');
  }
  if(userData.status=='blocked'){
    
    return res.redirect('/login');
  }

  if (phone.length !== 10) {
    return res.json({ success: false, message: 'Mobile number is not valid' })
  } else if (pincode.length !== 6) {
    return res.json({ success: false, message: 'Enter valid pincode' })
  }


  try {
    const address = await Address.updateOne({ 'address._id': addressId }, {
      $set: {
        "address.$.addressType": addressType,
        "address.$.name": name,
        "address.$.streetAddress": streetAddress,
        "address.$.city": city,
        "address.$.landmark": landmark,
        "address.$.state": state,
        "address.$.pincode": pincode,
        "address.$.phone": phone
      }
    })
    res.status(200).json({ success: true, message: 'Address updated successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching address", error });
  }

};
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = req.session.user
    const userData = await User.findOne({ _id: user });
  
    if (!user) {
      console.error('User not logged in.');
      return res.redirect('/login');
    }
    if(userData.status=='blocked'){
      
      return res.redirect('/login');
    }


      const addressDoc = await Address.findOne({ userId: user });

      if (!addressDoc) {
          return res.status(404).json({ success: false, message: 'No addresses found' });
      }

      const addressIndex = addressDoc.address.findIndex(
          addr => addr._id.toString() === addressId
      );
    
      if (addressIndex === -1) {
          return res.status(404).json({ success: false, message: 'Address not found' });
      }

      addressDoc.address.splice(addressIndex, 1);

      await addressDoc.save();


      res.status(200).json({ 
          success: true, 
          message: 'Address deleted successfully' 
      });
  } catch (error) {
      console.error('Delete address error:', error);
      res.status(500).json({ 
          success: false,
          error: 'Failed to delete address' 
      });
  }
};

exports.getChangePassword = async (req, res) => {

  
  const user = req.session.user
  const userData = await User.findOne({ _id: user });

  if (!user) {
    console.error('User not logged in.');
    return res.redirect('/login');
  }
  if(userData.status=='blocked'){
    
    return res.redirect('/login');
  }
  return res.render('user/change-password');  
};

exports.changePassword = async (req, res) => {

  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  const user = req.session.user
  const userData = await User.findOne({ _id: user });

  if (!user) {
    console.error('User not logged in.');
    return res.redirect('/login');
  }
  if(userData.status=='blocked'){
    
    return res.redirect('/login');
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
  
    res.status(200).json({ success: true, message: 'Password changed successfully' });
   
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



exports.getShowCart = async (req, res) => {
  const user = req.session.user
  const userData = await User.findOne({ _id: user });

  if (!user) {
    console.error('User not logged in.');
    return res.redirect('/login');
  }
  if(userData.status=='blocked'){

    return res.redirect('/login');
  }

  try {
    const userId = user;
    const cart = await Cart.findOne({ userId })
      .populate('items.variantId')
      .populate('items.productId'); 
    
    if (!cart) {
      return res.render('user/cart', { cart: null, user: userId });
    }

 
    const fragranceTypes = cart.items.map(item => item.productId.fragranceType);

    const fragrances = await Fragrance.find({ name: { $in: fragranceTypes } });


    const fragranceOffers = fragrances.reduce((acc, fragrance) => {
      acc[fragrance.name] = fragrance.offer;
      return acc;
    }, {});

    res.render('user/cart', { cart, user: userId, fragranceOffers });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



exports.showCart = async (req, res) => {
  
  try {
    const user = req.session.user;
    if (!user) {
      console.error('User not logged in.');
      return res.status(401).json({
        success: false,
        message: 'User not logged in.',
      });
    }

  const userData = await User.findOne({ _id: user });

  if(userData.status=='blocked'){
    return res.redirect('/login');
  }

    const { variantId, quantity } = req.body;
    const quantityNum = parseInt(quantity, 10) || 1;

    if (quantityNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
    }

    const variant = await Variant.findById(variantId).populate('productId');
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found',
      });
    }

    let cart = await Cart.findOne({ userId: user });
    if (!cart) {
      cart = new Cart({ userId: user, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.variantId.toString() === variantId.toString()
    );

    if (existingItemIndex > -1) {
      return res.status(400).json({
        success: false,
        message: 'This item is already in your cart.',
      });
    }

    cart.items.push({
      variantId,
      quantity: quantityNum,
      productId: variant.productId._id,
    });

    await cart.save();

    await Wishlist.findOneAndUpdate(
      { userId: user },
      { $pull: { items: { variantId: variantId } } }
    );

    return res.status(200).json({
      success: true,
      message: 'Item added to cart successfully.',
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};



exports.cartUpdateQuandity= async (req, res) => {
  const user = req.session.user
  const userData = await User.findOne({ _id: user });

  if (!user) {
    console.error('User not logged in.');
    return res.status(401).json({
      success: false,
      message: 'User not logged in.',
    });
  }
  if(userData.status=='blocked'){

    return res.redirect('/login');
  }

  try {
      const { itemId, quantity } = req.body;
    
      if (quantity < 1) {
          return res.status(400).json({ error: 'Quantity must be at least 1' });
      }
      if (quantity > 10) {
        return res.status(400).json({ error: 'You cannot buy more than 10 of each item.' });
    }
      const cart = await Cart.findOne({ userId: user });

      if (!cart) {
          return res.status(404).json({ error: 'Cart not found' });
      }
   
          
      const itemIndex = cart.items.findIndex(item => item.variantId.toString() == itemId);
     
      if (itemIndex ===  -1) {
          return res.status(404).json({ error: 'Item not found in cart' });
      }


      cart.items[itemIndex].quantity = quantity;
      await cart.save();

      res.json({ success: true, message: 'Quantity updated successfully' });
  } catch (error) {
      console.error('Error updating quantity:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
}

exports.removeShowCart = async (req, res) => {
  const { ObjectId, CURSOR_FLAGS } = require('mongodb');
  const user = req.session.user
  const userData = await User.findOne({ _id: user });

  if (!user) {
    console.error('User not logged in.');
    return res.redirect('/login');
  }
  if(userData.status=='blocked'){

    return res.redirect('/login');
  }
  try {
    const userId = user;
    const cart = await Cart.findOne({ userId })
      .populate('items.variantId')
      .populate('items.productId');

    const { itemId } = req.params;
    if (!ObjectId.isValid(itemId)) {
      return res.json({ success: false, message: 'Invalid item ID' });
    }
    const objectIdItemId = new ObjectId(itemId);
    const updatedCart = cart.items.filter(item =>
      !item.variantId._id.equals(objectIdItemId)
    );



    cart.items = updatedCart;
    await cart.save();

    return res.json({ success: true});
  } catch (error) {
    console.error('Error during cart item removal:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
exports.getCheckoutPage = async (req, res) => {  
  try {
   
    const user = req.session.user
    const userData = await User.findOne({ _id: user });
  
    if (!user) {
      console.error('User not logged in.');
      return res.redirect('/login');
    }
    if(userData.status=='blocked'){
      
      return res.redirect('/login');
    }
    const cart = await Cart.findOne({ userId: user })
      .populate('items.variantId')
      .populate('items.productId');


    const coupons = await Coupon.find({ isActive: true });
     
    
    const addressDoc = await Address.findOne({ userId: user });
    const addresses = addressDoc ? addressDoc.address : [];

  

    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    let counter = cart.items.reduce((acc, item) => {
      return item.variantId.stock<item.quantity? acc + 1 : acc;
  }, 0);
  
  
    if (counter>0) {
      req.flash('error', 'Your cart contains items that are out of stock.Please remove that item.');
      return res.redirect('/cart');
    }
    const fragranceTypes = cart.items.map(item => item.productId.fragranceType);

  
    const fragrances = await Fragrance.find({ name: { $in: fragranceTypes } });

    
    const fragranceOffers = fragrances.reduce((acc, fragrance) => {
      acc[fragrance.name] = fragrance.offer;
      return acc;
    }, {});

    const subtotal = cart.items.reduce((total, item) => {
      const fragranceOffer = fragranceOffers[item.productId.fragranceType] || 0;
      const bestOffer = Math.max(item.variantId.offer, fragranceOffer);
      return total + (item.variantId.price - (item.variantId.price * bestOffer / 100)) * item.quantity;
    }, 0);
    
    const usedCoupons = userData ? userData.coupon : [];

    const currentDate = new Date();
    
    
    const availableCoupons = coupons.filter(coupon => !usedCoupons.includes(coupon.code) &&  coupon.expireOn >= currentDate && subtotal>coupon.minimumPrice && subtotal<coupon.maximumPrice);
    
    

    res.render('user/checkout', { 
      cart, 
      subtotal, 
      addresses, 
      coupons: availableCoupons,
      wallet:userData.wallet,
      fragranceOffers,
      counter
    });

  } catch (error) {
    console.error('Checkout page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.applyCoupon = async (req, res) => {
  try {
     
    const user = req.session.user
    const userData = await User.findOne({ _id: user });
  
    if (!user) {
      console.error('User not logged in.');
      return res.status(401).json({
        success: false,
        message: 'User not logged in.',
      });
    }
    if(userData.status=='blocked'){
      
      return res.redirect('/login');
    }

      const { couponCode } = req.body;
      const cart = await Cart.findOne({ userId: user }).populate('items.variantId').populate('items.productId');
      const coupon = await Coupon.findOne({ code: couponCode });

      if (!coupon) return res.json({ success: false, message: 'Invalid coupon code' });
      if (new Date() > coupon.expireOn) return res.json({ success: false, message: 'Coupon is expired' });

      const fragranceTypes = cart.items.map(item => item.productId.fragranceType);

  
    const fragrances = await Fragrance.find({ name: { $in: fragranceTypes } });

    
    const fragranceOffers = fragrances.reduce((acc, fragrance) => {
      acc[fragrance.name] = fragrance.offer;
      return acc;
    }, {});

    const subtotal = cart.items.reduce((total, item) => {
      const fragranceOffer = fragranceOffers[item.productId.fragranceType] || 0;
      const bestOffer = Math.max(item.variantId.offer, fragranceOffer);
      return total + (item.variantId.price - (item.variantId.price * bestOffer / 100)) * item.quantity;
    }, 0);
let  discount =0
    if(subtotal<coupon.maximumPrice&&subtotal>coupon.minimumPrice){

      discount = (coupon.discount / 100) * subtotal;
    }else{
      return res.json({ success: false, message:'this coupon is not available for this price range.' });
    }
      
      
      
      req.session.discount = discount;
      req.session.coupon = couponCode;

      return res.json({ success: true, discount });
  } catch (error) {
      console.error('Error applying coupon:', error);
      return res.status(500).json({ success: false, message: 'An error occurred while applying the coupon.' });
  }
};

exports.cancelCoupon = async (req, res) => {
  try {
     
    const user = req.session.user
    const userData = await User.findOne({ _id: user });
  
    if (!user) {
      console.error('User not logged in.');
      return res.status(401).json({
        success: false,
        message: 'User not logged in.',
      });
    }
    if(userData.status=='blocked'){
      
      return res.redirect('/login');
    }

      if (!req.session.coupon) {
          return res.json({ success: false, message: 'No coupon is currently applied.' });
      }

      req.session.coupon = null;
      req.session.discount = 0;

      const cart = await Cart.findOne({ userId: user }).populate('items.variantId').populate('items.productId');
      const subtotal = cart.items.reduce((total, item) => {
          return total + (item.variantId.price - (item.variantId.price * item.variantId.offer / 100)) * item.quantity;
      }, 0);

      return res.json({ success: true, message: 'Coupon canceled successfully.', subtotal });
  } catch (error) {
      console.error('Error canceling coupon:', error);
      return res.status(500).json({ success: false, message: 'An error occurred while canceling the coupon.' });
  }
};


exports.addAddress = async (req, res) => {
  try {
   
    const user = req.session.user
    const userData = await User.findOne({ _id: user });
  
    if (!user) {
      console.error('User not logged in.');
      return res.status(401).json({
        success: false,
        message: 'User not logged in.',
      });
    }
    if(userData.status=='blocked'){
      
      return res.redirect('/login');
    }


      const { 
          addressType, 
          name, 
          streetAddress, 
          city, 
          landmark, 
          state, 
          pincode, 
          phone 
      } = req.body;



   
      let addressDoc = await Address.findOne({ userId: user });
      
      if (!addressDoc) {
          addressDoc = new Address({
              userId: user,
              address: []
          });
      }

    
      const existingAddress = addressDoc.address.find(
          addr => 
              addr.addressType === addressType &&
              addr.name === name &&
              addr.streetAddress === streetAddress &&
              addr.city === city &&
              addr.landmark === landmark &&
              addr.state === state &&
              addr.pincode === parseInt(pincode) &&
              addr.phone === parseInt(phone)
      );

      if (existingAddress) {
          return res.status(400).json({
              success: false,
              message: 'This address already exists'
          });
      }

      const newAddress = {
          addressType,
          name,
          streetAddress,
          city,
          landmark,
          state,
          pincode: parseInt(pincode),
          phone: parseInt(phone)
      };

      if (addressDoc.address.length === 0) {
          newAddress.isDefault = true;
      }

      addressDoc.address.push(newAddress);
      await addressDoc.save();

      res.status(201).json({
          success: true,
          message: 'Address added successfully',
          address: newAddress
      });



  } catch (error) {
      console.error('Add address error:', error);
      res.status(500).json({
          success: false,
          error: 'Failed to add address',
          message: error.message
      });
  }
};
exports.processCheckout = async (req, res) => {
  try {
   
    const { addressId, paymentMethod } = req.body;

    
    const user = req.session.user
   
    const userData = await User.findById(user);
  
    if (!user) {
      console.error('User not logged in.');
      return res.redirect('/login');
    }
    if(userData.status=='blocked'){
      
      return res.redirect('/login');
    }
   

    const cart = await Cart.findOne({ userId: user })
      .populate('items.variantId')
      .populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    const { Types } = require('mongoose');
    if (!Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ error: 'Invalid address ID format.' });
    }

    const addressDoc = await Address.findOne({ userId: user, 'address._id': addressId });
    const address = addressDoc ? addressDoc.address.id(addressId) : null;
    
    if (!address) {
      return res.status(400).json({ error: 'Address not found.' });
    }



const fragranceTypes = cart.items.map(item => item.productId.fragranceType);


const fragrances = await Fragrance.find({ name: { $in: fragranceTypes } });

const fragranceOffers = fragrances.reduce((acc, fragrance) => {
  acc[fragrance.name] = fragrance.offer || 0; 
  return acc;
}, {});


const cartAmount = cart.items.reduce((total, item) => {
  const fragranceOffer = fragranceOffers[item.productId.fragranceType] || 0; 
  const bestOffer = Math.max(item.variantId.offer, fragranceOffer);
  const discountedPrice = item.variantId.price - (item.variantId.price * bestOffer) / 100;
  
  return total + discountedPrice * item.quantity; 
}, 0);


    const discount = req.session.discount || 0;
    const totalAmount = cartAmount - discount;
    if (paymentMethod === 'cod') {
      if (totalAmount >= 1000) {
        return res.status(400).json({ error: 'Cash on Delivery (COD) is not available for orders above ₹1000. Please choose an alternate payment method.' });
      }
    }


    if (paymentMethod === 'wallet') {
      if (userData.wallet < totalAmount) {
        return res.status(400).json({ error: 'Insufficient wallet balance.' });
      }
    }

    const order = new Order({
      userId: user,
      orderedItems: cart.items.map((item) => {
        const fragranceOffer = fragranceOffers[item.productId.fragranceType] || 0; // Fetch fragrance offer for the item
        const bestOffer = Math.max(item.variantId.offer, fragranceOffer); // Determine the best offer
        const priceAfterDiscount = item.variantId.price - (item.variantId.price * bestOffer) / 100; // Calculate discounted price
    
        return {
          variantId: item.variantId._id,
          quantity: item.quantity,
          price: priceAfterDiscount, // Use the discounted price
          fragranceOffer, // Add fragranceOffer here if you need it stored
        };
      }),
      cartAmount,
      totalAmount,
      discount,
      paymentMethod,
      address: {
        addressType: address.addressType,
        name: address.name,
        phone: address.phone,
        pincode: address.pincode,
        state: address.state,
        city: address.city,
        landMark: address.landmark,
      },
    });
    
    await order.save();

    req.session.discount = 0;
    if (req.session.coupon && !userData.coupon.includes(req.session.coupon)) {
      userData.coupon.push(req.session.coupon);
    }

    if (paymentMethod === 'wallet') {
      userData.wallet -= totalAmount;
      userData.transaction.push({
        mode: 'Order payment',
        date: new Date().toISOString(),
        amount: totalAmount,
        type: 'debit',
      });
    }
  

    await userData.save();
    await Cart.findOneAndDelete({ userId: user });

    if (paymentMethod === 'razorpay') {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100,
        currency: 'INR',
        receipt: order._id.toString(),
        payment_capture: 1,
      });

      return res.status(200).json({
        message: 'Order placed successfully. Please complete payment.',
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
        paymentMethod,
      });
    }

    res.status(200).json({
      message: 'Order placed successfully.',
      orderId: order._id,
      paymentMethod,
     
    });
  } catch (error) {
    console.error('Checkout process error:', error);
    res.status(500).json({ error: 'Checkout failed. Please try again.' });
  }
};





exports.getSuccessOrder = async (req, res) => {
  try {
    
    const user = req.session.user
    const userData = await User.findOne({ _id: user });
  
    if (!user) {
      console.error('User not logged in.');
      return res.redirect('/login');
    }
    if(userData.status=='blocked'){
      
      return res.redirect('/login');
    }
    const { orderId } = req.params;

    const order = await Order.findOne({ _id:orderId })
      .populate({
        path: 'orderedItems.variantId',
        model: 'Variant',
        select: 'milliliter price stock productId'
      })
      .populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
        errorCode: 404
      });
    }

    if (order.paymentStatus !== true) {
      order.paymentStatus = true
      for (const item of order.orderedItems) {
        const variant = item.variantId;
        if (variant) {
          variant.stock -= item.quantity;

          if (variant.stock < 0) {
            return res.status(400).render('error', {
              message: 'Insufficient stock for one or more items',
              errorCode: 400
            });
          }

          await variant.save();
        }
      }

      await order.save();
    }

    res.render('user/success-order', {
      orderId: order._id,
      pageTitle: `Order ${orderId} Confirmation`
    });
  } catch (error) {
    console.error('Order Success Page Error:', error);
    res.status(500).render({
      message: 'Error processing order',
      errorCode: 500
    });
  }
};

exports.getFailureOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

  
    const order = await Order.findById(orderId); 
    if (!order) {
      
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    
    return res.render('user/failure-order',{orderId});
  } catch (error) {
    console.error('Error handling failure order:', error);
    res.status(500).send('An error occurred while processing your request.');
  }
};



exports.retryPayment = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'Order ID is required' });
  }

  try {
    
    const user = req.session.user
    const userData = await User.findOne({ _id: user });
  
    if (!user) {
      console.error('User not logged in.');
      return res.redirect('/login');
    }
    if(userData.status=='blocked'){
      
      return res.redirect('/login');
    }
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus === 'true') {
      return res.status(400).json({ message: 'Payment already completed for this order' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: order.totalAmount * 100,
      currency: 'INR',
      receipt: order._id.toString(),
      payment_capture: 1,
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(200).json({
      message: 'Retry initiated',
      orderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Error in retryPayment:', error);
    res.status(500).json({ message: 'An unexpected error occurred. Please try again.' });
  }
};


exports.getOrderDetails = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    
    if (!user) return res.redirect('/login');
    if (userData.status === 'blocked') return res.redirect('/login');

    const { orderId } = req.params;
    
    const order = await Order.findOne({ _id: orderId })
      .populate({
        path: 'orderedItems.variantId',
        populate: {
          path: 'productId',
          model: 'Product'
        }
      });

    if (!order) return res.status(404).send('Order not found');

    const subtotal =order.orderedItems.reduce((total, item) => 
      !item.isCancelled ? total + (item.price * item.quantity) : total, 0
    );

    res.render('user/user-order-details', {
      userData,
      user,
      order,    
      subtotal,
      pageTitle: `Order ${orderId} Details`,
      error: ''
    });

  } catch (error) {
    console.error('Order Details Error:', error);
    res.status(500).send('Server error');
  }
};

exports.getOrdersList = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });

    if (!user) {
      console.error('User not logged in.');
      return res.redirect('/login');
    }
    if (userData.status == 'blocked') {
      
      return res.redirect('/login');
    }


    const orders = await Order.find({ userId: user })
      .sort({ date: -1 })  
      .populate({
        path: 'orderedItems.variantId',
        model: 'Variant',
        populate: {
          path: 'productId',
          model: 'Product'
        }
      });

    if (!orders || orders.length === 0) {
      return res.status(404).render('error', { 
        message: 'Order Details Not Found',
        errorCode: 404 
      });
    }

    res.render('user/user-order', { orders, userData, user });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).send('Server error');
  }
};



exports.cancelOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const user = req.session.user;
    if (!user) {
      console.error('User not logged in.');
      return res.redirect('/login');
    }

    const userData = await User.findById(user);
    if (!userData || userData.status === 'blocked') {
  
      return res.redirect('/login');
    }

    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const updateStock = async (orderedItems) => {
      for (const item of orderedItems) {
        const variant = await Variant.findById(item.variantId);
        if (variant) {
          variant.stock += item.quantity;
          await variant.save();
        }
      }
    };

    const processRefund = async (userId, amount, mode) => {
      const userAccount = await User.findById(userId);
      if (userAccount) {
        userAccount.wallet += amount;
        userAccount.transaction.push({
          mode,
          amount,
          type: 'credit',
        });
        await userAccount.save();
      }
    };

    if (order.paymentMethod === 'cod' && order.status === 'Pending') {
      await updateStock(order.orderedItems);
      order.status = 'Cancelled';
      await order.save();


      return res.status(200).json({ success: true, message: 'Order cancelled successfully.' });
    } else if (order.paymentMethod === 'cod' && order.status === 'Delivered') {
      await updateStock(order.orderedItems);
      await processRefund(order.userId, order.totalAmount, 'Order Returned');
      order.status = 'Returned';
      await order.save();

      return res.status(200).json({ success: true, message: 'Order returned successfully.' });
    } else if (order.paymentMethod === 'razorpay' && order.status === 'Pending') {
      await updateStock(order.orderedItems);
      await processRefund(order.userId, order.totalAmount, 'Order Cancelled');
      order.status = 'Cancelled';
      await order.save();


      return res.status(200).json({ success: true, message: 'Order cancelled successfully.' });
    } else if (order.paymentMethod === 'razorpay' && order.status === 'Delivered') {
      await updateStock(order.orderedItems);
      await processRefund(order.userId, order.totalAmount, 'Order Returned');
      order.status = 'Returned';
      await order.save();

      return res.status(200).json({ success: true, message: 'Order returned successfully.' });
    } else if (order.paymentMethod === 'wallet' && order.status === 'Pending') {
      await updateStock(order.orderedItems);
      await processRefund(order.userId, order.totalAmount, 'Order Cancelled');
      order.status = 'Cancelled';
      await order.save();

      return res.status(200).json({ success: true, message: 'Order cancelled successfully.' });
    } else if (order.paymentMethod === 'wallet' && order.status === 'Delivered') {
      await updateStock(order.orderedItems);
      await processRefund(order.userId, order.totalAmount, 'Order Returned');
      order.status = 'Returned';
      await order.save();

    
      return res.status(200).json({ success: true, message: 'Order returned successfully.' });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be processed in its current state.',
      });
    }
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};




exports.cancelSingleProduct = async (req, res) => {
  const { orderId, productId } = req.params;
  const { actionType } = req.body;

  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    
    if (!user) return res.redirect('/login');
    if (userData.status == 'blocked') return res.redirect('/login');


    const order = await Order.findById(orderId).populate({
      path: 'orderedItems.variantId',
      populate: {
        path: 'productId',
        model: 'Product'
      }
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });


    const itemToCancel = order.orderedItems.find(item =>
      item.variantId._id.toString() === productId
    );
    if (!itemToCancel) return res.status(404).json({ success: false, message: 'Product not found in order' });

    if (actionType === 'cancel' && order.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Order can only be cancelled when pending' });
    }
    if (actionType === 'return' && order.status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Order can only be returned after delivery' });
    }



    let refundAmount = itemToCancel.price * itemToCancel.quantity;
    
    

    itemToCancel.isCancelled = true;

    // Update variant stock
    const variant = await Variant.findById(itemToCancel.variantId);
    if (variant) {
      variant.stock += itemToCancel.quantity;
      await variant.save();
    }

    // Handle refund based on payment method
    switch (order.paymentMethod) {
      case 'cod':
        if (order.status === 'Delivered') {
          userData.wallet += refundAmount;
          userData.transaction.push({
            mode: `Product ${actionType}ed`,
            date: new Date(),
            amount: refundAmount,
            type: 'credit'
          });
        }
        break;

      case 'razorpay':
      case 'wallet':
        userData.wallet += refundAmount;
        userData.transaction.push({
          mode: `Product ${actionType}ed`,
          date: new Date(),
          amount: refundAmount,
          type: 'credit'
        });
        break;
    }

    await userData.save();

    // Update order total and status
    const remainingItems = order.orderedItems.filter(item => !item.isCancelled);
    if (remainingItems.length === 0) {
      order.status = actionType === 'cancel' ? 'Cancelled' : 'Returned';
    } else {
      const calculateDiscountedTotal = async () => {
        let total = 0;
        for (const item of remainingItems) {
          total += item.price * item.quantity;
        }
                return total;
      };

      order.totalAmount = await calculateDiscountedTotal();
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Product ${actionType}ed successfully`,
      updatedOrder: order
    });

  } catch (error) {
    console.error('Error processing product:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

exports.invoiceDownload = async (req, res) => {
  try {

    
    const user = req.session.user
    const userData = await User.findOne({ _id: user });
  
    if (!user) {
      console.error('User not logged in.');
      return res.redirect('/login');
    }
    if(userData.status=='blocked'){
      
      return res.redirect('/login');
    }


    const { orderId } = req.params;
    const order = await Order.findOne({ _id: orderId })
      .populate({
        path: 'orderedItems.variantId',
        model: 'Variant',
        populate: {
          path: 'productId',
          model: 'Product',
        },
      })
      .lean();

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const orderinvoice = {
      id: orderId,
      orderDate: order.date.toLocaleDateString(),
      invoiceDate: new Date().toLocaleDateString(),
      customer: {
        name: order.address.name,
        state: order.address.state,
        landMark: order.address.landMark,
        city: order.address.city,
        pin: order.address.pincode,
        phone: order.address.phone,
      },
      items: order.orderedItems.map((item) => ({
        name: item.variantId.productId.name,
        quantity: item.quantity,
        price: item.price,
      })),
      discount: order.discount || 0,
      deliveryCharge: order.deliveryCharge || 0,
      total: order.totalAmount || 0,
    };


    const subTotal = orderinvoice.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const grandTotal = subTotal - orderinvoice.discount + orderinvoice.deliveryCharge;

 
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderinvoice.id}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    const doc = new PDFDocument({ margin: 50 });

    
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('Invoice', { align: 'center' }).moveDown(1);
    doc.fontSize(10).font('Helvetica').text('Sold By: Labelle Private Limited');
    doc.text('L-169, 13th Cross, 15th Main, Sector - 6, HSR Layout,');
    doc.text('Bangalore, Karnataka, 560102, India');
    doc.text('GSTIN: 29AABCJ9421C1ZP');
    doc.moveDown(2);

    doc.fontSize(10).font('Helvetica-Bold').text('Order Details', { underline: true });
    doc.fontSize(10).font('Helvetica').text(`Order Date: ${orderinvoice.orderDate}`);
    doc.text(`Invoice Date: ${orderinvoice.invoiceDate}`);
    doc.text(`Order ID: ${orderinvoice.id}`);
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica-Bold').text('Customer Details', { underline: true });
    doc.fontSize(10).font('Helvetica').text(`Name: ${orderinvoice.customer.name}`);
    doc.text(`State: ${orderinvoice.customer.state}`);
    doc.text(`Landmark: ${orderinvoice.customer.landMark}`);
    doc.text(`City: ${orderinvoice.customer.city}`);
    doc.text(`Pincode: ${orderinvoice.customer.pin}`);
    doc.text(`Phone: ${orderinvoice.customer.phone}`);
    doc.moveDown(2);

    doc.fontSize(10).font('Helvetica-Bold').text('Product Details', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Name', 50, doc.y, { continued: true });
    doc.text('Quantity', 200, doc.y, { continued: true });
    doc.text('Price', 300, doc.y, { align: 'right' });
    doc.moveDown(0.5);
    doc.font('Helvetica').text('-'.repeat(80), 50, doc.y);
    orderinvoice.items.forEach((item) => {
      doc.font('Helvetica')
        .text(item.name, 50, doc.y, { continued: true })
        .text(item.quantity.toString(), 200, doc.y, { continued: true })
        .text(`$${( item.price * item.quantity).toFixed(2)}`, 300, doc.y, { align: 'right' });
    });

    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Bold').text('Summary', { underline: true });
    doc.font('Helvetica').text(`Subtotal:  ${subTotal.toFixed(2)}`);
    doc.text(`Discount:  ${orderinvoice.discount.toFixed(2)}`);
    doc.text(`Delivery Charge:  ${orderinvoice.deliveryCharge.toFixed(2)}`);
    doc.text(`Grand Total:  ${grandTotal.toFixed(2)}`, { bold: true });

    doc.end();
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).send('An error occurred while generating the invoice.');
  }
};








exports.getUserCoupon = async (req, res) => {
  
  const user = req.session.user
  const userData = await User.findOne({ _id: user });

  if (!user) {
    console.error('User not logged in.');
    return res.redirect('/login');
  }
  if(userData.status=='blocked'){
    
    return res.redirect('/login');
  }
  const coupons = await Coupon.find({ isActive: true });

  const usedCoupons = userData ? userData.coupon : [];

  const formattedCoupons = coupons.map(coupon => ({
    ...coupon._doc, 
    expiredOnFormatted: new Date(coupon.expireOn).toDateString(), 
  }));

  res.render('user/user-coupon', {
    userData,
    user,
    error: '',
    coupons: formattedCoupons,
  });
};

exports.getWallet = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });

    if (!user) {
      console.error('User not logged in.');
      return res.redirect('/login');
    }
    if (userData.status == 'blocked') {
      
      return res.redirect('/login');
    }

    const walletAmount = userData.wallet || 0;
    let transactions = userData.transaction || [];

    transactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.render('user/user-wallet', {
      userData,
      walletAmount,
      transactions, 
      user,
      error: ''
    });
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    res.render('user/user-wallet', {
      userData: null,
      walletAmount: 0,
      transactions: [],
      user,
      error: 'Error fetching wallet data. Please try again later.'
    });
  }
};



exports.getWishlist = async (req, res) => {
 

  try {
    
    const user = req.session.user
    const userData = await User.findOne({ _id: user });
  
    if (!user) {
      console.error('User not logged in.');
      return res.redirect('/login');
    }
    if(userData.status=='blocked'){
      
      return res.redirect('/login');
    }

    const userId = user;
    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: 'items.variantId',
        populate: {
          path: 'productId',
          model: 'Product'
        }
      });

    if (!wishlist || wishlist.items.length === 0) {
      return res.render('user/wishlist', { 
        wishlist: null, 
        user: userId,
        wishlistItems: [] 
      });
    }

    res.render('user/wishlist', { 
      wishlist, 
      user: userId,
      wishlistItems: wishlist.items.map(item => item.variantId._id.toString())
    });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).render('error', { 
      error: 'Internal server error', 
      user: req.session.user || null 
    });
  }
};
exports.addToWishlist = async (req, res) => {
  try {
   
    const user = req.session.user
    const userData = await User.findOne({ _id: user });
  
    if (!user) {
      console.error('User not logged in.');
      return res.status(401).json({
        success: false,
        message: 'User not logged in.',
      });
    }
    if(userData.status=='blocked'){
      
      return res.redirect('/login');
    }

    const { variantId } = req.body;
 

    const variant = await Variant.findById(variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    let wishlist = await Wishlist.findOne({ userId: user });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: user, items: [] });
    }

    const existingItemIndex = wishlist.items.findIndex(
      item => item.variantId.toString() === variantId.toString()
    );

    if (existingItemIndex === -1) {
      wishlist.items.push({ variantId });
      await wishlist.save();
      return res.json({ 
        success: true, 
        message: 'Product added to wishlist', 
        wishlist: wishlist.items.map(item => item.variantId.toString()) 
      });
    }

    return res.json({ 
      success: false, 
      message: 'Product already in wishlist', 
      wishlist: wishlist.items.map(item => item.variantId.toString()) 
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


exports.removeFromWishlist = async (req, res) => {
  try {

    const user = req.session.user
    const userData = await User.findOne({ _id: user });
  
    if (!user) {
      console.error('User not logged in.');
      return res.status(401).json({
        success: false,
        message: 'User not logged in.',
      });
    }
    if(userData.status=='blocked'){
      
      return res.redirect('/login');
    }
    const { variantId } = req.body;

    const wishlist = await Wishlist.findOne({ userId: user });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.items = wishlist.items.filter(
      item => item.variantId.toString() !== variantId.toString()
    );

    await wishlist.save();
    return res.json({ success: true, message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}; 