const LocalStrategy = require('passport-local').Strategy;
const facebookStrategy = require('passport-facebook').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

//Load User Model
const User = require('../models/user');

module.exports = (passport) => {

    //check login info
    const localAuthUser = async (email, password, done) => {

        try {
            //Match user
            console.log('Matching user...')
            const user = await User.findOne({ email: email });

            // if no user match, return done
            if (!user) {
                return done(null, false, { message: '該電子信箱未註冊' });
            }

            try {
                if (await bcrypt.compare(password, user.password)) {
                    return done(null, user)
                } else {
                    return done(null, false, { message: '密碼錯誤' })
                }
            } catch (e) {
                return done(e)
            }
        } catch (err) {
            console.log(err)
        }
    }
    const facebookAuthUser = async (token, refreshToken, profile, done) => {
        try {
            // find the user in the database based on their facebook id
            let user = await User.findOne({ 'uid': profile.id })
            // if the user is found, then log them in
            if (user) {
                console.log("user found")
                console.log(user)
                return done(null, user); // user found, return that user
            } else {
                // if there is no user found with that facebook id, create them
                let newUser = new User();
                // set all of the facebook information in our user model
                newUser.uid = profile.id; // set the users facebook id                   
                newUser.token = token; // we will save the token that facebook provides to the user                    
                newUser.fbName = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                if (!!profile.emails) {
                    newUser.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
                }
                newUser.avatar = profile.photos[0].value
                // save our user to the database
                await newUser.save()
                // if successful, return the new user
                return done(null, newUser);
            }
        } catch (err) {
            return done(err);
        }
    }


    passport.use(new LocalStrategy({ usernameField: 'email' }, localAuthUser));
    passport.use(new facebookStrategy({
        // pull in our app id and secret from our auth.js file
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