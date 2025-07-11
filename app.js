
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const flash = require('connect-flash');
const passport = require('./config/passport')
const nocache = require('nocache');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('Error connecting to MongoDB', err));

// Middleware 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads/')));
// Session configuration
app.use(session({
  secret: 'labellesecretkey',
  saveUninitialized: true,
  resave: false,
  cookie: { maxAge:  1000 * 60 * 60 * 24 }  // 24 hour expiry time for session cookie
}));

app.use(nocache());
app.use(passport.initialize());
app.use(passport.session())


app.use(flash());
// Middleware to handle error messages
app.use((req, res, next) => {
  res.locals.message = req.session.message;
  delete req.session.message;  // Clear the message after it's shown
  next();
});

app.use((req, res, next) => {
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  next();
});

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', require("./routes/users"));
app.use('/admin', require("./routes/admin"));

// Start the server
app.listen(PORT, () => {
    const renderURL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  console.log(`Server running at http://localhost:${PORT}`);
});
