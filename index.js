require('dotenv').config();
const axios = require('axios');
const express = require('express');
const { userInfo } = require('os');
const path = require('path');
const { code } = require('tar/lib/types');
const jwt_decode = require('jwt-decode');
const { on } = require('events');
const session = require('express-session');
const { application } = require('express');
const pug = require('pug');
const { title } = require('process');


const app = express();
app.use(express.static('static'));

// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;

//session middleware
app.use(session({
    secret: `${process.env.SESSION_SECRET}`,
    saveUninitialized:true,
    cookie: { 
      maxAge: oneDay, 
      path: '/',
      sameSite: 'strict',
    },
    resave: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/static/index.html'));
});

app.get('/home', (req, res) => {
  res.render('home', {
    title: 'All Blue - Dev'
  });
  //res.sendFile(path.join(__dirname, '/static/home.html'));
});

app.get('/auth', (req, res) => {
  res.redirect(
    `https://clever.com/oauth/authorize?response_type=code&redirect_uri=${process.env.REDIRECT_URI}&client_id=${process.env.CLEVER_CLIENT_ID}`,
  );
});

app.get('/auth/clever', ({ query: { code } }, res) => {
  const body = ({
    client_id: `${process.env.CLEVER_CLIENT_ID}`,
    client_secret: `${process.env.CLEVER_CLIENT_SECRET}`,
    code,
    grant_type: 'authorization_code',
    redirect_uri: `${process.env.REDIRECT_URI}`,
  });
  
  const opts = { headers: { accept: 'application/json' } };
  axios
    .post('https://clever.com/oauth/tokens', body, opts)
    .then((_res) => _res.data.id_token)
    .then((token) => {
      // eslint-disable-next-line no-console
      console.log('My token:', token);
      
      var JWT = `${token}`;
      var decoded = jwt_decode(JWT);

      let user = {
        firstName: "",
        lastName: "",
        district: "",
        user_id: "",
        email: "",
      }
      
      //update user object
      user.firstName = decoded['given_name'],
      user.lastName = decoded['family_name'],
      user.district = decoded['district'],
      user.user_id = decoded['user_id'],
      user.email = decoded['email'],

      
      res.redirect('/home');
    })
    .catch((err) => res.status(500).json({ err: err.message }));
});



app.get('/getuser', (req, res) => {
  res.json(req.session.user)
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/')
});

app.listen(3000);
// eslint-disable-next-line no-console
console.log('App listening on port 3000');