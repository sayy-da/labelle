
// Middleware to protect routes
module.exports = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    console.log(req.session , req.session.admin);
    
    return next();  // Allow access to the next middleware/route handler
  } else {
    return res.redirect('/admin/login');  // Redirect to login if the user is not logged in
  }
};
