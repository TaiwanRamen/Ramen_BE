const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const FacebookTokenStrategy = require('passport-facebook-token');
const JwtStrategy = require('passport-jwt').Strategy;
const config = require("../config/golbal-config");
const bcrypt = require('bcryptjs');
const log = require('../modules/logger');
const User = require('../models/user');



module.exports = (passport) => {

    const localAuthUser = async (email, password, done) => {

        try {
            //Match user
            log.info('Matching user:', email)
            const user = await User.findOne({ email: email });

            // if no user match, return done
            if (!user) {
                log.info("email not registered:", email);
                return done(null, false, { message: '該電子信箱未註冊' });
            }
            if (!user.password){
                log.info("user " + user._id + "already registered through facebook")
                return done(null, false, { message: '該使用者已透過Facebook註冊，請使用Facebook登入' });
            }

            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                log.info("password fail", email);
                return done(null, false, { message: '密碼錯誤' })
            }
        } catch (err) {
            log.error(err);
            done(null, false, { message: '系統出現問題，請稍後再試。' })
        }
    }
    const facebookAuthUser = async (req, token, refreshToken, profile, done) => {
        try {
            log.info(token);
            log.info(refreshToken);
            log.info(profile);
            let user = await User.findOne({ 'fbUid': profile.id })
            if (user) {
                log.info("user", user._id, "login");
                updateUserInfoWhenLogin(user, profile, token);
                await user.save();
                return done(null, user);
            } else {
                log.info("new user: "+ profile.id)
                let newUser = new User();
                updateUserInfoWhenLogin(newUser, profile, token);
                newUser.isVerified = true;
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
            console.log("payload:", payload)
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

    const updateUserInfoWhenLogin = (user, profile, token) => {
        user.fbUid = profile.id;
        user.fbToken = token;
        user.fbName = profile.name.givenName + ' ' + profile.name.familyName;
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
        console.log('have cookies :', token)
        return token;
    }

    passport.use('local', new LocalStrategy({ usernameField: 'email' }, localAuthUser));

    //FOR WEB
    passport.use('facebook', new FacebookStrategy({
        clientID: process.env.FB_API_ID,
        clientSecret: process.env.FB_API_SECRET,
        callbackURL: process.env.FB_CALLBACK_URL,
        profileFields: ['id', 'displayName', 'name', 'gender', 'picture.type(large)', 'email']
    }, facebookAuthUser));

    //FOR API
    passport.use('facebookToken', new FacebookTokenStrategy({
        clientID: process.env.FB_API_ID,
        clientSecret: process.env.FB_API_SECRET,
        passReqToCallback: true,
        profileFields: ['id', 'displayName', 'name', 'gender', 'picture.type(large)', 'email']
    }, facebookAuthUser));


    // JSON WEB TOKENS STRATEGY
    // USED FOR API CALL
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