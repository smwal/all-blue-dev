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

app.get('/home', (_req, res) => {
  res.sendFile(path.join(__dirname, '/static/home.html'));
});

app.get('/auth', (_req, res) => {
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

  console.log(code)
  const opts = { headers: { accept: 'application/json' } };
  axios
    .post('https://clever.com/oauth/tokens', body, opts)
    .then((_res) => _res.data.id_token)
    .then((token) => {
      // eslint-disable-next-line no-console
      console.log('My token:', token);
      
      var JWT = `${token}`;
      var decoded = jwt_decode(JWT);
      
      //create user object
      const user = {
        firstName: decoded['given_name'],
        lastName: decoded['family_name'],
        district: decoded['district'],
        user_id: decoded['user_id'],
        email: decoded['email'],
      }

      res.redirect('/home');
    })
    .catch((err) => res.status(500).json({ err: err.message }));
});

app.post('/user',(req,res) => {
  if(req.session.loggedin = true){
      session=req.session;
      session.userid=req.body.username;
  }
  else{
      res.send('Invalid username or password');
  }
})

app.get('/',(req,res) => {
  session=req.session;
  if(session.userid){
    res.send("Welcome User <a href=\'/logout'>click to logout</a>");
  }else
  res.sendFile('static/index.html',{root:__dirname})
});    

//route for adding cookie
app.get('/setuser', (_req, res) => {
  res.cookie('userId', `${decoded['user_id']}`, { maxAge: oneDay, path: '/' })
  res.send('user data added to cookie');
});

//Iterate user data from cookie
app.get('/getuser', (req, res) => {
  res.send(req.cookies);
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/')
});

app.listen(3000);
// eslint-disable-next-line no-console
console.log('App listening on port 3000');