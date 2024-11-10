const User =require('../models/users')


const adminCredentials={
  username:'sayyida',
  password:'sayyida123'
}

exports.showAdminLogin =(req,res)=>{
  if(req.session.isAdmin){
    return res.redirect('/admin/dashboard')
  }
  res.render('admin/login',{userType:'admin'})
}

exports.handleAdminLogin = (req,res)=>{
  const {username,password}=req.body
  
  if(username === adminCredentials.username && password === adminCredentials.password){
    req.session.isAdmin = true
    console.log(req.session);
    
     return res.redirect('/admin/dashboard')
  }else{
    res.send('invalide credentials.please try again')
  }
}

exports.adminDashboard =(req,res)=>{
  if(req.session.isAdmin){
    res.render('admin/dashboard')
  }else{
    res.redirect('/admin/login')
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