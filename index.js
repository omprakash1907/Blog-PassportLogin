const express = require('express')
var cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')
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
const multer = require('multer');
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

app.post('/', passport.authenticate('local', {
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

//---------------------------forgot pass

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "omprakashkjat19@gmail.com",
    pass: "btpp pwdx qsgz yrxn"
  }
});



app.get('/forgot', async (req, res) => {
  res.render('./Pages/forget')
})

app.post('/forgot', async (req, res) => {
  const { email } = req.body
  console.log(email)
  var mailOptions = {
    from: 'omprakashkjat19@gmail.com',
    to: email,
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
  res.redirect('/otp')
})

app.get('/dashboard', auth, async (req, res) => {
  const post = await postModel.find().sort('-1')
  const user = req.user.name
  res.render('./Pages/hero', { post: post, user: user });
})

app.post('/dashboard', auth, async (req, res) => {
  const user = req.user.name
  upload(req, res, async function () {
    if (req.file) {
      var details = {
        file: req.file.filename,
        post: req.body.post,
        time: Date.now(),
        name: user
      }
      const post = await postModel(details)
      const result = post.save()
      res.redirect('/')
    } else {
      console.log("error")
    }
  })
})

//---------------- logout
app.get('/signout', (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.error(err);
      return res.redirect('/');
    }
    res.redirect('/');
  });
});

//--------------myProfile

app.get('/myprofile', auth, (req, res) => {
  const user = req.user.name
  res.render('./Pages/myprofile', { user: user })
})

app.post('/myprofile', auth, async (req, res) => {
  const user = req.user.name
  const password = req.user.password
  const newpassword = req.body.newpassword
  const renewpassword = req.body.renewpassword
  console.log(req.body)
  if (password === req.body.password) {
    if (newpassword === renewpassword) {
      var changePass = await userModel.updateOne({ _id: req.user.id }, { $set: { password: newpassword } })
    }
  } else {
    console.log("errr")
  }
  res.render('./Pages/myprofile', { user: user })
})


app.listen((3000), () => {
  console.log('server started : 3000')
})