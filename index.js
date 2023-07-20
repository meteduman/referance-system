const express = require('express')
var path = require('path');
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const nodemailer = require("nodemailer");
const bodyParser = require('body-parser');
var schedule = require('node-schedule');
console.log("Server Başlatıldı")
const flash = require('connect-flash');
var session = require('express-session');

const app = express()
const config = require("./config/data.json")
const Log = require('./models/log')
const Data = require('./models/data')
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({
  extended: true
}))

app.use(morgan('dev'))
app.use(cookieParser())
app.use(session({ secret: 'botai', cookie: {maxAge: 60000}, resave: true, saveUninitialized: true }));
app.use(flash());

mongoose.connect(config.dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err))

  function reqIp(req) {
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
    return ipAddress.split(',')[0];
  }
  function generateRandomKey() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    const keyLength = 9;
  
    for (let i = 0; i < keyLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      key += characters[randomIndex];
    }
  
    return key;
  }

app.get('/', async (req, res) => {
const success =  req.flash('success');
const error =  req.flash('error');
res.render('index', {success, error})
})

  app.post('/', async (req, res) => {
    try {
   let username = req.body.username
   let email = req.body.email
   let checker = await Log.find({$or: [{username: username}, {email: email}]})
   if (checker.length > 0) {
    req.flash('error', "Kullanıcı Adınız veya E-posta adresiniz zaten kayıtlıdır.")
    res.redirect("/")
   } else {
    const OneClickKey = generateRandomKey();
    await Log.create({username: username, email: email, key: OneClickKey})
    req.flash('success', `http://localhost:3000/ref/${OneClickKey}`)    
    res.redirect("/");
    }
  } catch(error) {
    console.log(error.message)
  }
  })

app.get('/ref/:key', async (req, res) => {
   let key = req.params.key
   let data = await Log.findOne({key: key})
   let checker = await Data.findOne({username: data.username, ip: reqIp(req)})
   try {
    if (checker.ip === reqIp(req)) {
      res.status(403).send("tek tıklama hakkın var")
    } 
   } catch {
    res.render('success')
    let data = await Log.findOne({key: key})
    await Data.create({username: data.username, ip: reqIp(req)})
   }

})
app.get('/top50/', async (req, res) => {
 let data = await Data.aggregate([{$group: {_id: '$username', count: { $sum: 1 }}},{$project: {_id: 0,username: '$_id', count: 1 }}]).limit(50).sort({count: -1, createdAt: -1})
  res.render('top50', {data})
})

app.use((req, res) => {
  res.status(404).render('404')
})
