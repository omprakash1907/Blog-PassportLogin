const express = require('express')
var cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const app = express()
const fs = require('fs');

mongoose.connect('mongodb+srv://omprakashkjat19:Mp6RjeJoLEx9SvC3@test.fkf1bxq.mongodb.net/LoginCookies')
  .then(() => console.log('Connected!'));
const { userModel, postModel } = require('./schema')

app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.static('upload'));

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

//-------------------multer
const multer  = require('multer');
const { error } = require('console');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './upload')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname)
  }
})

const upload = multer({ storage: storage }).single('file')

//-------------------session & passport

const session = require('express-session');
const passport = require('passport');
const flash = require('express-flash');
const LocalStrategy = require('passport-local').Strategy;
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//-------------------auth

function auth(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  }
  res.redirect('/');
}


passport.use(new LocalStrategy({
  usernameField: 'email',
},
  async function (email, password, done) {
      try {
          const user = await userModel.findOne({ email: email });
          // console.log(user);
          if (!user) {
              return done(null, false, { message: 'Incorrect email.' });
          }
          if (user.password !== password) {
              return done(null, false, { message: 'Incorrect password.' });
          }
          return done(null, user);
      } catch (err) {
          return done(err);
      }
  }
));



// Serialize and deserialize user
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, cb) => {
  try {
      const userData = await userModel.findById(id);
      cb(null, userData);
  } catch (err) {
      cb(err);
  }
});

app.get('/', function (req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('./Pages/login');
});

app.post('/',  passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/',
  failureFlash: true
}));

app.get('/signup', (req, res) => {
  res.render('./Pages/signup')
})

app.post('/signup', async (req, res) => {
  const newUser = await userModel(req.body)
  const result = newUser.save()
  res.redirect('/')
})

app.get('/dashboard', auth, async (req, res) => {
  const post = await postModel.find({}) 
  // const user = await userModel.find({})
  const user = req.user.name
  res.render('./Pages/hero', { post: post, user: user });
})

app.post('/dashboard', auth, async (req, res) => {
  const user = req.user.name
  upload(req, res, async function(){
    if(req.file){
      var details = {
        file : req.file.filename,
        post : req.body.post,
        time : Date.now(),
        name : user
      }
      const post = await postModel(details)
      const result = post.save()
      res.redirect('/')
    }else{
      console.log("error")
    }
  })
})

// logout
app.get('/signout', (req, res) => {
  req.logout(function (err) {
    if (err) {
        console.error(err);
        return res.redirect('/');
    }
    res.redirect('/');
});
});


app.listen((3000), () => {
  console.log('server started : 3000')
})