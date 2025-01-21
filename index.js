require('dotenv').config();
const fs = require('fs');
const https = require('https');
const axios = require('axios');
const express = require('express');
const path = require('path');
const jwt_decode = require('jwt-decode');
const session = require('express-session');
const pug = require('pug');

// Load SSL certificates from env variables for local development
const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
const credentials = { key: privateKey, cert: certificate };

const app = express();
app.use(express.static('static'));

// Create 24 hours in milliseconds
const oneDay = 1000 * 60 * 60 * 24;

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  cookie: { 
    maxAge: oneDay,
    path: '/',
    sameSite: 'None',  // Allow cross-origin requests
    secure: true,      // Ensures cookies are only sent over HTTPS
    httpOnly: true     // Prevents access to cookies via JavaScript (XSS protection)
  },
  resave: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Root route
app.get('/', (req, res) => {
  res.render('index', {
    title: 'All Blue - Dev',
  });
});

// Home route
app.get('/home', (req, res) => {
  console.log('Session on /home:', req.session);  // Debug session data
  if (req.session.user) {
    res.render('home', {
      title: 'All Blue - Home',
      user: req.session.user,
    });
  } else {
    res.redirect('/');  // Redirect to login page if no user data in session
  }
});

// Redirect to Clever authorization
app.get('/auth', (req, res) => {
  res.redirect(
    `https://clever.com/oauth/authorize?response_type=code&redirect_uri=${process.env.REDIRECT_URI}&client_id=${process.env.CLEVER_CLIENT_ID}`
  );
});

// Clever OAuth callback
app.get('/auth/clever', (req, res) => {
  const { code } = req.query; // Extract code from query params

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

      // Save user data in session
      req.session.user = {
        firstName: decoded.given_name,
        lastName: decoded.family_name,
        district: decoded.district,
        id: decoded.user_id,
        email: decoded.email,
      };

      console.log('User session:', req.session.user);  // Debug session data

      res.redirect('/home');  // Ensure redirection to /home after successful login
    })
    .catch((err) => {
      console.error('OAuth Error:', err.message);
      res.status(500).render('error', { message: 'Failed to log in. Please try again.' });
    });
});

// Logout route (clear session)
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      res.redirect('/home');
    } else {
      res.redirect('/');  // Redirect to index page after session is destroyed
    }
  });
});

// Debug route (optional for development)
app.get('/debug', (req, res) => {
  res.json({
    session: req.session,
    env: process.env.NODE_ENV,
    userAgent: req.headers['user-agent'],
  });
});

// Start the HTTPS server
https.createServer(credentials, app).listen(3000, () => {
  console.log('App listening on https://localhost:3000');
});