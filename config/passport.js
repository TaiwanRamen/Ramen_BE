const LocalStrategy = require('passport-local').Strategy;
const facebookStrategy = require('passport-facebook').Strategy;
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const log = require('../modules/logger');
const User = require('../models/user');

module.exports = (passport) => {

    //check login info
    const localAuthUser = async (email, password, done) => {

        try {
            //Match user
            log.info('Matching user:', email)
            const user = await User.findOne({ email: email });

            // if no user match, return done
            if (!user || !user.password) {
                log.info("email not registered:", email);
                return done(null, false, { message: '該電子信箱未註冊，或是嘗試使用Facebook登入' });
            }
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                log.info("password fail", email);
                return done(null, false, { message: '密碼錯誤' })
            }

        } catch (err) {
            console.log(err)
            done(null, false, { message: '系統出現問題，請稍後再試。' })
        }
    }
    const facebookAuthUser = async (token, refreshToken, profile, done) => {
        try {
            log.info(token);
            log.info(refreshToken);
            log.info(profile);
            let user = await User.findOne({ 'uid': profile.id })
            if (user) {
                log.info("user", user._id, "login");
                updateUserInfo(user, profile, token);
                await user.save();
                return done(null, user);
            } else {
                log.info("new user: "+ profile)
                let newUser = new User();
                updateUserInfo(newUser, profile, token);
                newUser.uuid = uuidv4();
                await newUser.save()
                return done(null, newUser);
            }
        } catch (err) {
            log.info(err);
            return done(err);
        }
    }

    const updateUserInfo = (user, profile, token) => {
        user.uid = profile.id;
        user.token = token;
        user.fbName = profile.name.givenName + ' ' + profile.name.familyName;
        if (!!profile.emails) {
            user.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
        }
        if (!!profile.email) {
            user.email = profile.email[0].value;
        }
        user.avatar = profile.photos[0].value
    }


    passport.use(new LocalStrategy({ usernameField: 'email' }, localAuthUser));
    passport.use(new facebookStrategy({
        clientID: process.env.FB_API_ID,
        clientSecret: process.env.FB_API_SECRET,
        callbackURL: process.env.FB_CALLBACK_URL,
        profileFields: ['id', 'displayName', 'name', 'gender', 'picture.type(large)', 'email']
    }, facebookAuthUser))

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });


}