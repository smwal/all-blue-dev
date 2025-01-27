require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const pug = require('pug');
const axios = require('axios');
const jwt_decode = require('jwt-decode');

const app = express();

// Session middleware configuration (using MemoryStore by default)
app.use(session({
  secret: process.env.SESSION_SECRET, // A strong secret for sessions
  saveUninitialized: false, // Don't save empty sessions
  resave: false, // Don't resave unchanged sessions
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 1-day session duration
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // Set 'None' for cross-origin cookies in production
    secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
  },
}));

// Middleware to parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

// Set views directory and engine for Pug
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Root route (index page)
app.get('/', (req, res) => {
  console.log('Session before redirect:', req.session);  // Log session state before redirect
  res.render('index', { title: 'All Blue - Dev' });
});

// Home route
app.get('/home', (req, res) => {
  console.log('Session on /home:', req.session);  // Debugging session data
  if (req.session.user) {
    res.render('home', { title: 'All Blue - Home', user: req.session.user });
  } else {
    console.log('No user session found, redirecting to login');
    res.redirect('/');  // Redirect to login page if no user session
  }
});

// Redirect to Clever OAuth authorization
app.get('/auth', (req, res) => {
  res.redirect(
    `https://clever.com/oauth/authorize?response_type=code&redirect_uri=${process.env.REDIRECT_URI}&client_id=${process.env.CLEVER_CLIENT_ID}`
  );
});

// Handle OAuth callback
app.get('/auth/clever', (req, res) => {
  const { code } = req.query;

  const body = {
    client_id: process.env.CLEVER_CLIENT_ID,
    client_secret: process.env.CLEVER_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: process.env.REDIRECT_URI,
  };

  const opts = { headers: { accept: 'application/json' } };

  axios
    .post('https://clever.com/oauth/tokens', body, opts)
    .then((_res) => _res.data.id_token)
    .then((token) => {
      const decoded = jwt_decode(token);

      // Store user data in session
      req.session.user = {
        firstName: decoded.given_name,
        lastName: decoded.family_name,
        district: decoded.district,
        id: decoded.user_id,
        email: decoded.email,
      };

      console.log('User session:', req.session.user);  // Debug user session
      res.redirect('/home');
    })
    .catch((err) => {
      console.error('OAuth Error:', err.message);
      res.status(500).render('error', { message: 'Failed to log in. Please try again.' });
    });
});

// Logout route (destroy session)
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      res.redirect('/home');
    } else {
      res.redirect('/');
    }
  });
});

app.listen(3000, () => {
  console.log("App is listening on http://localhost:3000");
});

// Export the app for serverless functions (Vercel deployment)
module.exports = app;
