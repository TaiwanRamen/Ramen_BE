require('dotenv').config();
module.exports = {

    // sessions will last for 30 minutes
    SESSION_DURATION: 1000 * 60 * 10,

    // sessions will be extended by 10 minutes if the user is active
    SESSION_EXTENSION_DURATION: 1000 * 60 * 10,

    // our unique secret key -- this keeps sessions secure -- it should never be
    // checked into version control, but it should be the same among all servers
    SESSION_SECRET_KEY: process.env.SESSION_SECRET_KEY,

    // only set cookies over https. set this to true if you are running in
    // production, false otherwise
    SESSION_SECURE_COOKIES: false,

    SESSION_EPHEMERAL_COOKIES: false,

    JWT_SIGNING_ALGORITHM: "HS512",

    JWT_MAX_AGE: 1000 * 60 * 60 * 24 * 20, //20 days

    //set rate limit to 200 times for 1 minute
    RATE_LIMIT_WINDOW: 1000 * 60,
    RATE_LIMIT: 1000

};