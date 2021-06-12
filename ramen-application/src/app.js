const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
    require('dotenv').config();
}
const express = require('express'),
    socket = require('socket.io'),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    User = require('./models/user'),
    config = require('./config/global-config'),
    session = require('express-session'),
    helmet = require('helmet'),
    rateLimit = require('express-rate-limit'),
    log = require('./modules/logger'),
    cors = require('cors'),
    cookieParser = require('cookie-parser'),
    morgan = require('morgan'),
    accessLogStream = require('./modules/accesslogStream'),
    errorhandler = require('errorhandler'),
    response = require('./modules/responseMessage'),
    promBundle = require("express-prom-bundle"),
    metricsMiddleware = promBundle({includeMethod: true});


const app = express();
app.use(metricsMiddleware);
app.use(morgan(':remote-addr - :remote-user [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', {stream: accessLogStream}))
const corsOptions = {
    origin: process.env.FE_DOMAIN,
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200
}
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(helmet({contentSecurityPolicy: isProduction ? undefined : false}));
require('./config/passport')(passport);
require("./db/connectDB");
require("./db/connectRedis");
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

//error handler
if (!isProduction) {
    app.use(errorhandler());
}

app.use(function (err, req, res, next) {
    response.internalServerError(res, err.message);
});

//rate limit for each ip
const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW,
    max: config.RATE_LIMIT, // 限制請求數量
    handler: (req, res) => {
        response.tooManyRequests(res, "Too many request! Please try again later.")
    },
})
app.use(limiter)


//api routes
app.use('/api/v1', require('./api/v1/api-router'));

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