

// Middleware to protect routes
module.exports = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();  // Allow access to the next middleware/route handler
  } else {
    return res.redirect('/admin/login');  // Redirect to login if the user is not logged in
  }
};
