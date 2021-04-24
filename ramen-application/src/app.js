const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
    require('dotenv').config();
}
const express = require('express'),
    socket = require('socket.io'),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    mathodOverride = require("method-override"),
    flash = require('connect-flash'),
    User = require('./models/user'),
    config = require('./config/golbal-config'),
    session = require('express-session'),
    helmet = require('helmet'),
    rateLimit = require('express-rate-limit'),
    moment = require('moment'),
    log = require('./modules/logger'),
    cors = require('cors'),
    cookieParser = require('cookie-parser'),
    morgan = require('morgan'),
    accessLogStream = require('./modules/accesslog-stream'),
    errorhandler = require('errorhandler'),
    response = require('./modules/response-message'),
    promBundle = require("express-prom-bundle"),
    metricsMiddleware = promBundle({includeMethod: true});



const app = express();
app.use(metricsMiddleware);
app.use(morgan(':remote-addr - :remote-user [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', { stream: accessLogStream }))
const corsOptions ={
    origin:process.env.FE_DOMAIN,
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.static(__dirname + '/public')) ;//dirname是你現在script跑的位置。
app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));
app.use(mathodOverride("_method"));
app.use(flash());
app.use('/public/images/', express.static('./public/images'));
require('./config/passport')(passport);
require("./db/connectDB");
require("./config/smtp");


//PASSPORT CONFIGURATION
app.use(session({
    cookieName: "connect.sid",
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    duration: config.SESSION_DURATION,
    activeDuration: config.SESSION_EXTENSION_DURATION,
    cookie: {
        httpOnly: true,
        ephemeral: config.SESSION_EPHEMERAL_COOKIES,
        secure: config.SESSION_SECURE_COOKIES,
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
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');


//error handler
if (!isProduction) {
    app.use(errorhandler());
}

// development error handler
// will print stacktrace
if (!isProduction) {
    app.use(function(err, req, res, next) {
        console.log(err.stack);
        res.status(err.status || 500);
        res.json({'errors': {
                message: err.message,
                error: err
            }});
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({'errors': {
            message: err.message,
            error: {}
        }});
});

//Global variable
//can call the currentUser success_msg and error_msg from anywhere
app.use(async (req, res, next) => {
    res.locals.currentUser = req.user;
    if (req.user) {
        try {
            let user = await User.findById(req.user._id).populate('notifications', null, { isRead: false }).exec();
            res.locals.notifications = user.notifications.reverse();
        } catch (error) {
            log.error(error.message);
        }
    }
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
})

moment.locale('zh-tw');
app.locals.moment = moment;

//rate limit for each ip
const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW,
    max: config.RATE_LIMIT, // 限制請求數量
    handler: (req, res) => {
        response.tooManyRequests(res, "Too many request! Please try again later.")
    },
})
app.use(limiter)

//Routes
//pertain the route from the index
app.use('/', require('./routes'));
app.use('/api/v1', require('./api/v1/api-router'));
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/stores/:id/comments', require('./routes/comments'));
app.use('/stores/:id/reviews', require('./routes/reviews'));
app.use('/stores', require('./routes/stores'));

app.get('/:else', (req, res) => {
    res.send("No such pass exist.");
})

//handle http server and socket io
const PORT = process.env.PORT;

const server = app.listen(PORT, log.info(`Server started on port ${PORT}`));
const io = socket(server);
io.on('connection', (socket) => {
    console.log('socket connection on', socket.id);
})