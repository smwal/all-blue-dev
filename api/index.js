require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const express = require('express');
const path = require('path');
const jwt_decode = require('jwt-decode');
const session = require('express-session');
const pug = require('pug');

// Initialize Express
const app = express();

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

// Session middleware
const oneDay = 1000 * 60 * 60 * 24;

app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  cookie: { 
    maxAge: oneDay,
    path: '/',
    sameSite: 'None',
    secure: true,     
    httpOnly: true     
  },
  resave: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Root route
app.get('/', (req, res) => {
  res.render('index', { title: 'All Blue - Dev' });
});

// Home route
app.get('/home', (req, res) => {
  console.log('Session on /home:', req.session);
  if (req.session.user) {
    res.render('home', { title: 'All Blue - Home', user: req.session.user });
  } else {
    res.redirect('/');  // Redirect to login page if no user data
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

      req.session.user = {
        firstName: decoded.given_name,
        lastName: decoded.family_name,
        district: decoded.district,
        id: decoded.user_id,
        email: decoded.email,
      };

      console.log('User session:', req.session.user);
      res.redirect('/home');
    })
    .catch((err) => {
      console.error('OAuth Error:', err.message);
      res.status(500).render('error', { message: 'Failed to log in. Please try again.' });
    });
});

// Logout route
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

// Debug route
app.get('/debug', (req, res) => {
  res.json({
    session: req.session,
    env: process.env.NODE_ENV,
    userAgent: req.headers['user-agent'],
  });
});

module.exports = app;