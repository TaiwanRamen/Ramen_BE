const FacebookTokenStrategy = require('passport-facebook-token');
const JwtStrategy = require('passport-jwt').Strategy;
const config = require("./global-config");
const log = require('../modules/logger');
const User = require('../models/user');

module.exports = (passport) => {

    const facebookAuthUser = async (req, token, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ 'fbUid': profile.id })
            if (user) {
                log.info("user", user._id, "login");
                updateUserInfoWhenLogin(user, profile, token, refreshToken);
                await user.save();
                return done(null, user);
            } else {
                log.info("new user: "+ profile.id);
                let newUser = new User();
                updateUserInfoWhenLogin(newUser, profile, token, refreshToken);
                newUser.isVerified = false;
                await newUser.save()
                return done(null, newUser);
            }
        } catch (err) {
            log.error(err);
            return done(err, false, { message: '系統出現問題，請稍後再試。' });
        }
    }

    const jwtAuthUser = async (req, payload, done) => {
        try {
            let user = await User.findById(payload.sub);
            if (!user) {
                return done(null, false);
            }
            req.user = user;
            return done(null, user);
        } catch(err) {
            log.error(err);
            return done(err, false, { message: '系統出現問題，請稍後再試。' });
        }
    }

    const updateUserInfoWhenLogin = (user, profile, token, refreshToken) => {
        user.fbUid = profile.id;
        user.fbToken = (!!token) ? token : refreshToken;
        user.username = profile.name.givenName + ' ' + profile.name.familyName;
        if (!!profile.emails) {
            user.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
        }
        if (!!profile.email) {
            user.email = profile.email[0].value;
        }
        user.avatar = profile.photos[0].value
    }

    const cookieExtractor = req => {
        let token = null;
        if (req && req.cookies) {
            token = req.cookies['access_token'];
        }
        return token;
    }

    passport.use('facebookToken', new FacebookTokenStrategy({
        clientID: process.env.FB_API_ID,
        clientSecret: process.env.FB_API_SECRET,
        passReqToCallback: true,
        profileFields: ['id', 'displayName', 'name', 'gender', 'picture.type(large)', 'email']
    }, facebookAuthUser));

    passport.use('jwt', new JwtStrategy({
        jwtFromRequest: cookieExtractor,
        secretOrKey: process.env.JWT_SIGNING_KEY,
        passReqToCallback: true,
        ignoreExpiration: false,
        algorithms: [config.JWT_SIGNING_ALGORITHM]
    }, jwtAuthUser));


    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });


}