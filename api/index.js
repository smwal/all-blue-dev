require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const pug = require('pug');
const axios = require('axios');
const jwt_decode = require('jwt-decode');
const { kv } = require('@vercel/kv');

const app = express();

// In-memory session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false, // Don't save empty sessions
  resave: false, // Don't resave unchanged sessions
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 1-day session duration
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    secure: process.env.NODE_ENV === 'production',
  },
}));

// Middleware to parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Set up views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Root route
app.get('/', (req, res) => {
  console.log('Session before redirect:', req.session);
  res.render('index', { title: 'All Blue - Dev' });
});

// Home route
app.get('/home', async (req, res) => {
  if (req.session.user) {
    res.render('home', { title: 'All Blue - Home', user: req.session.user });
  } else {
    console.log('No user session found, fetching from Vercel KV...');
    
    // Retrieve user session from Vercel KV
    const user = await kv.get(`session:${req.sessionID}`);
    
    if (user) {
      req.session.user = user; // Restore session
      res.render('home', { title: 'All Blue - Home', user });
    } else {
      console.log('No stored session, redirecting to login');
      res.redirect('/');
    }
  }
});

// OAuth authorization route
app.get('/auth', (req, res) => {
  res.redirect(
    `https://clever.com/oauth/authorize?response_type=code&redirect_uri=${process.env.REDIRECT_URI}&client_id=${process.env.CLEVER_CLIENT_ID}`
  );
});

// OAuth callback handler
app.get('/auth/clever', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).render('error', { message: 'Missing authorization code' });
  }

  console.log('Received OAuth code:', code);

  try {
    const body = {
      client_id: process.env.CLEVER_CLIENT_ID,
      client_secret: process.env.CLEVER_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.REDIRECT_URI,
    };

    const opts = { headers: { accept: 'application/json' } };

    const { data } = await axios.post('https://clever.com/oauth/tokens', body, opts);
    const token = data.id_token;
    const decoded = jwt_decode(token);

    const user = {
      firstName: decoded.given_name,
      lastName: decoded.family_name,
      district: decoded.district,
      id: decoded.user_id,
      email: decoded.email,
    };

    // Store user session in memory and in Vercel KV
    req.session.user = user;
    await kv.set(`session:${req.sessionID}`, user, { ex: 86400 }); // Store session for 1 day

    console.log('User session stored:', user);
    res.redirect('/home');
  } catch (err) {
    console.error('OAuth Error:', err.message);
    res.status(500).render('error', { message: 'Failed to log in. Please try again.' });
  }
});

// Logout route
app.get('/logout', async (req, res) => {
  if (req.session.user) {
    console.log('Destroying session for user:', req.session.user);
    await kv.del(`session:${req.sessionID}`); // Remove session from KV
  }

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