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


//-------------------auth

const auth = (req, res, next) => {
  if (!req.cookies.user) {
    res.redirect('/')
  } else {
    next()
  }
}

app.get('/', function (req, res) {
  if (req.cookies.user) {
    res.redirect('/dashboard')
  }
  res.render('./Pages/login')
})

app.post('/', async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email: email });
  if (user) {
    if (user.password === password) {
      let minute = 60 * 6000;
      res.cookie('user', user, { maxAge: minute });
      res.redirect('/dashboard');
    }else{
      res.redirect('/')
    }
  }else{
    res.redirect('/')
  }
});

app.get('/signup', (req, res) => {
  res.render('./Pages/signup')
})

app.post('/signup', async (req, res) => {
  const newUser = await userModel(req.body)
  const result = newUser.save()
  console.log(result)
  res.redirect('/')
})

app.get('/dashboard', auth, async (req, res) => {
  const post = await postModel.find({}) 
  const user = req.cookies.user;
  console.log(post)
  res.render('./Pages/hero', { post: post, user: user });
})

app.post('/dashboard', auth, async (req, res) => {
  const user = req.cookies.user;
  upload(req, res, async function(){
    if(req.file){
      var details = {
        file : req.file.filename,
        post : req.body.post,
        time : Date.now(),
        name : user.name
      }
      const post = await postModel(details)
      const result = post.save()
      res.redirect('/')
    }else{
      console.log("error")
    }
  })
})

app.get('/signout', function (req, res) {
  if (req.cookies.user) {
    res.clearCookie('user');
    res.redirect('/')
  }
})


app.listen((3000), () => {
  console.log('server started : 3000')
})