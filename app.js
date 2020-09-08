if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();

}
const express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require("passport-local"),

    mathodOverride = require("method-override"),
    flash = require("connect-flash"),
    User = require("./models/user"),
    settings = require("./settings");


app.use(express.static(__dirname + '/public')) //dirname是你現在script跑的位置。

app.use(mathodOverride("_method"));
app.use(flash());

//path
app.use('/public/images/', express.static('./public/images'));

//Passport config
require('./config/passport')(passport);

//connect DB
require("./db/connectDB");

//config email
require("./config/smtp");


//PASSPORT CONFIGURATION
app.use(require("express-session")({
    cookieName: "session",
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    duration: settings.SESSION_DURATION,
    activeDuration: settings.SESSION_EXTENSION_DURATION,
    cookie: {
        httpOnly: true,
        ephemeral: settings.SESSION_EPHEMERAL_COOKIES,
        secure: settings.SESSION_SECURE_COOKIES,
    },
}));

//Passport Middleware init local strategy
app.use(passport.initialize());
app.use(passport.session());



app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.json());
app.use(express.static("public")); //去public找東西
app.set('view engine', 'ejs'); //把ejs設訂為預設檔案。



//Global variable
//used to flash message
//can call the currentUser success_msg and error_msg from anywhere
app.use(async (req, res, next) => {
    res.locals.currentUser = req.user;
    if (req.user) {
        try {
            let user = await User.findById(req.user._id).populate('notifications', null, {
                isRead: false
            }).exec();
            res.locals.notifications = user.notifications.reverse();
        } catch (error) {
            console.log(error.message);
        }
    }
    //res.locals.error = req.flash('error');
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error'); //msg from passport.js will put error in req.flash('error)
    next();
})
const moment = require('moment');
moment.locale('zh-tw');
app.locals.moment = moment;

//Routes
//pertain the route from the index
app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/stores/:id/comments', require('./routes/comments'));
app.use("/stores/:id/reviews", require('./routes/reviews'));
app.use('/stores', require('./routes/stores'));

app.get('/:else', (req, res) => {
    res.send("No such pass exist.");
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));