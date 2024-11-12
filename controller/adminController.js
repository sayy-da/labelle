const User =require('../models/users')
const mongoose = require('mongoose')
const bcrypt =require('bcrypt')


const adminCredentials = {
  username: 'sayyida',
  password: 'sayyida123'
};

// Display login page without error on initial load
exports.showAdminLogin = (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }

  
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const error = req.session.error;
  req.session.error = null;

  // Set error to null to prevent showing any message on initial load
  res.render('admin/login', { error });
};

// Handle login attempts and display error if login fails
exports.handleAdminLogin = (req, res) => {
  const { username, password } = req.body;

  if (username === adminCredentials.username && password === adminCredentials.password) {
    req.session.isAdmin = true;
    console.log(req.session);
    
    return res.redirect('/admin/dashboard');
  } else {
    req.session.error = 'Invalid credentials';
    // Send error message to the login view on failed login
   return res.redirect('/admin/login');
  }
};


exports.adminDashboard =(req,res)=>{
  if(!req.session.isAdmin){
   return res.redirect('/admin/login')
  }else{
    res.render('admin/dashboard')
  }
}

exports.handlelogout = (req,res)=>{
  req.session.destroy((err)=>{
    if(err){
      return res.status(500).send('failed to logout')
    }
    res.redirect('/admin/login')
  })
}


// view all user
exports.viewUsers =async (req,res)=>{
  try{
    const users = await User.find()
    res.render('admin/all-user',{users}) 
  }catch (error){
    res.status(500).send('Error retrieving users')
  }
}
// block user 
exports.toggleStatus = async (req, res) => {
  const userId = req.params.id;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Toggle the user's status
    user.status = user.status === 'active' ? 'blocked' : 'active';

    // Save the updated user
    await user.save();

    // Send response with the new status
    res.json({ success: true, newStatus: user.status });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

