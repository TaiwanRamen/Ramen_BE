if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const smtpTransport = require('../config/smtp');
const middleware = require('../middleware'); //will automaticlly include index.js
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const multer = require('multer');
const fs = require('fs');
const message = require('../message-templates/users/user-message')


//set filename to multer
const storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
//only allow jpeg, jpeg, png, gif to be uploaded
let imageFilter = function(req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error(message.WRONG_FILE_TYPE), false);
    }
    cb(null, true);
};
let upload = multer({
    storage: storage,
    fileFilter: imageFilter
})


router.get("/", middleware.isLoggedIn, (req, res) => {
    //console.log(req.user);
    res.redirect('/users/' + req.user._id);
});

/* ========================= 
           LOG IN
============================*/

router.get("/login", (req, res) => {
    res.render("users/login", { page: "login" });
});

//Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/map',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});



/* ========================= 
    SIGN UP EMAIL VERIFY 
============================*/


//SIGH UP ROUTES
//render signup form
router.get("/register", (req, res) => {
    res.render("users/register", { page: "register" });
});


/* ========================= 
    SIGN UP EMAIL VERIFY 
============================*/

//Register Handle with email sent
router.post('/register', async (req, res) => {
    console.log(req.body)
    const { username, email, password, password2 } = req.body;

    let errors = [];
    // Check required fields
    if (!username || !email || !password || !password2) {
        errors.push({ msg: message.FIELD_EMPTY });
    }
    // Check password match
    if (password !== password2) {
        errors.push({ msg: message.PASSWORD_NOT_MATCH });
    }

    //Check pass length capital, special character
    let re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/; //8*(A-Z a-z 0-9 !@#) 
    if (!re.test(password)) {
        errors.push({ msg: message.WRONG_PASSWORD_FORMAT})
    }
    //if there is a issue, rerender the register form and flash errors
    //we also want to keep what the user typed in last time
    if (errors.length > 0) {
        //things below is ES6 syntax, errors, username equals to error: error, username: username
        res.render('users/register', { errors, username, email, password, password2 })

    } else {
        //valid imformation  and password
        //User.findOne will return a promise
        //will give us a user, check the user
        try {
            let user = await User.findOne({ email: email });
            //if user already exist
            //render register again with previously typed in information
            if (user) {
                errors.push({ msg: message.USER_ALREASDY_EXIST });
                res.render('users/register', { errors, username, email, password, password2 })
            } else {

                //Hash Password using bcrypt
                //generate salt using bcrypt
                const salt = await bcrypt.genSalt(process.env.BCRYPT_WORK_FACTOR);
                const hash = await bcrypt.hash(password, salt);

                //jwt data, key, expire after
                //put hashed password inside jwt for verification
                const token = jwt.sign({ username, email, password: hash }, process.env.JWT_SIGNING_KEY, { expiresIn: process.env.JWT_ACC_ACTIVATE_MAX_AGE })

                //sending confirmation mail
                let url = `${process.env.CLIENT_URL}/users/activate/${token}`;

                //sending mail
                const mail_data = {
                    to: email,
                    subject: "驗證您在台灣拉麵俱樂部的帳戶電子郵件",
                    html: `
                        <h2>您即將完成在台灣拉麵俱樂部的註冊</h2>
                        <h4>驗證您的帳戶電子郵件地址</h4>
                        <div style="word-break:break-all">
                        <p style="font-size:13px;line-height:16px">您必須驗證電子郵件地址，才能使用 台灣拉麵俱樂部 的某些功能，並且在討論區中發表貼文。</p>
                        <p style="font-size:13px;line-height:16px" >請點擊以下連結以驗證電子郵件</p>
                        <a href="${url}">驗證電子郵件 </a>
                        
                        <p style="font-size:10px;line-height:16px"> 連結無法使用？請複製以下網址貼入搜尋列</p>
                        <p style="font-size:10px;line-height:16px"> ${url}</p>
                        <p>如果連結失效，請再次點擊<a href="${process.env.CLIENT_URL}/users/register">註冊</a>. 
                        </p>
                        <p style="font-size:13px;line-height:16px">如果您對Email 驗證有任何問題，請聯絡
                        <a href="${process.env.CLIENT_URL}">技術支援</a> 
                        </p>
                        </div>
                        `
                };

                let response = await smtpTransport.sendMail(mail_data, (error, response) => {
                    if (error) {
                        console.log(error);
                        return res.send({
                            error: err.message
                        })
                    }
                    console.log('verification email sent')
                    req.flash('success_msg',
                        message.USER_REGISTER_THROUGH_EMAIL_BEFORE + email + message.USER_REGISTER_THROUGH_EMAIL_AFTER);
                    res.redirect('/users/login');
                });

            }
        } catch (err) {
            console.log(err)
        }
    }
})

//Verifation email through jwt token
//Adding User in DB
router.get('/activate/:token', async (req, res) => {
    const token = req.params.token;
    console.log(token);
    if (token) {
        //jwt token contain username, email, and hashed password
        try {
            let decodedToken = await jwt.verify(token, process.env.JWT_SIGNING_KEY);
            const { username, email, password } = decodedToken;
            console.log(decodedToken)
            //find if email already in db
            let user = await User.findOne({ email });
            if (user) {
                console.log("User already exist!");
                req.flash('error_msg', message.USER_ALREASDY_EXIST);
                res.redirect('/users/register');
            }
            //create new user
            let newUser = new User({ username, email, password, isActivated: true, uuid: uuidv4() });
            try {
                await newUser.save();
                console.log("Signup success!");
                req.flash('success_msg', '註冊成功！');
                res.redirect('/users/login');

            } catch (err) {
                console.log("Error in signup while account activation: ", err);
                req.flash('error_msg', message.REGISTRY_ERROR);
                res.redirect('/');
            }

        } catch (error) {
            console.log(error)
            req.flash('error_msg', message.WRONG_REGISTRY_URL);
            res.redirect('/');
        }

    } else {
        req.flash('error_msg', message.INTERNAL_SERVER_ERROR);
        res.redirect('/');
    }
})


/* ========================= 
           LOG OUT
============================*/
//LOGOUT
router.get("/logout", (req, res) => {

    req.flash("success_msg", "成功登出!");
    req.session.destroy((err) => {
        res.redirect('/') // will always fire after session is destroyed
    })
});


/* ========================= 
        RECOVER PWD
============================*/
router.get('/recover', (req, res) => {
    res.render('users/recover')
});

//recover pwd, using jwt by user uuid
//send email to verify reset pwd
router.post('/recover', async (req, res) => {
    const email = req.body.email;
    console.log(email)
    //check if the email is in db or not
    try {
        let user = await User.findOne({ email: email });
        //if user exist, send email to reset pwd
        if (user) {
            //jwt user id to create url
            const token = jwt.sign({ uuid: user.uuid }, process.env.JWT_SIGNING_KEY, { expiresIn: process.env.JWT_ACC_ACTIVATE_MAX_AGE })

            //sending confirmation mail
            let url = `${process.env.CLIENT_URL}/users/recover/${token}`;

            //sending mail
            const mail_data = {
                //from: 'noreply@hello.com',
                to: email,
                subject: "Set new password.",
                html: ` <h2> Plaease click on given link to set new password:</h2>
                        <p style="font-size:13px;line-height:16px" >Click this link to complete your YelpCamp password reset:</p>
                        <div style="word-break:break-all">
                        <a href="${url}"> Reset my password </a>
                        <p style="font-size:10px;line-height:16px"> Link not working? Copy and paste this URL into your browser:</p>
                        <p style="font-size:10px;line-height:16px"> ${url}</p>
                        <p>This link is valid for 1 hours. If this link expires, 
                        <a href="${process.env.CLIENT_URL}/users/recover"> reset password</a> again. 
                        </p>
                        <p style="font-size:13px;line-height:16px">If you have questions about the email verification process, please <a href="#">contact support</a> </p>
                        </div>
                        `
            };

            await smtpTransport.sendMail(mail_data, (error, response) => {
                if (error) {
                    console.log(error);
                    return res.send({ error: err.message })
                }
                console.log('recover email sent')
                req.flash('success_msg', `密碼驗證信已寄至您的電子郵件信箱: ${email}\n 請點擊郵件內連結已設定新的密碼`);
                res.redirect('/users/login');
            });

        } else {
            req.flash('error_msg', message.USER_NOT_FOUND);
            res.redirect('/users/register')
        }
    } catch (error) {
        req.flash('error_msg', message.CHANGE_PASSWORD_ERROR);
        console.log(error.message)
        res.redirect('/users/login')
    }
});

//verify token sent to the user via email.
//once the tokes is correct, show the pwd reset page
router.get('/recover/:token', async (req, res) => {
    const token = req.params.token;
    console.log(token)
    if (token) {
        //jwt token contain user Id
        try {
            let decodedToken = await jwt.verify(token, process.env.JWT_SIGNING_KEY);
            const uuid = decodedToken.uuid;
            console.log(uuid)
            //find if userid already in db
            let user = await User.findOne({ uuid });
            console.log(user)
            if (user) {
                return res.render('users/newpassword', { token, email: user.email });
            }

        } catch (error) {
            console.log('Incorrect or Expire link');
            req.flash('error_msg', '連結不存在或已過期');
            res.redirect('/users/login');
        }

    } else {
        return res.send(message.INTERNAL_SERVER_ERROR)
    }
});

router.post('/recover/:token', async (req, res) => {
    const token = req.params.token;
    const { password, password2 } = req.body
    let errors = [];
    // Check required fields
    if (!password || !password2) {
        errors.push({ msg: '請填寫全部欄位' });
    }
    // Check password match
    if (password !== password2) {
        errors.push({ msg: '密碼並不匹配' });
    }

    //Check pass length
    if (password.length < 6) {
        errors.push({ msg: '密碼須至少為六位' })
    }
    //if there is a issue, rerender the register form and flash errors
    //we also want to keep what the user typed in last time
    if (errors.length > 0) {
        return res.render('users/newpassword', { errors, password, password2, token })
    }
    console.log(token)
    try {
        //find if userid already in db
        let decodedToken = await jwt.verify(token, process.env.JWT_SIGNING_KEY);
        const uuid = decodedToken.uuid;
        let user = await User.findOne({ uuid });
        if (user) {
            //Hash Password using bcrypt
            //generate salt using bcrypt
            const salt = await bcrypt.genSalt(process.env.BCRYPT_WORK_FACTOR);
            const hash = await bcrypt.hash(password, salt);


            await User.updateOne({ _id: user._id }, { password: hash });
            console.log("password updated");

            //check if uuid is duplicate, if so, generate another uuid
            let flag = true;
            while (flag) {
                let new_uuid = uuidv4();
                let duplicate_uuid_user = await User.findOne({ uuid: new_uuid })
                if (!duplicate_uuid_user) {
                    flag = false;
                    console.log("no duplicate")
                    await User.updateOne({ _id: user._id }, { uuid: new_uuid })
                } else {
                    console.log("uuid already been taken!")
                    new_uuid = uuidv4()
                }
            }

            req.flash('success_msg', '密碼更新成功！');
            res.redirect('/users/login');
        }
    } catch (err) {
        req.flash('error_msg', message.USER_NOT_FOUND);
        res.redirect('/users/login');

    }
});
/* router.get("/show", middleware.isLoggedIn, (req, res) => {
    res.render('users/show', {
        user: req.user
    });
    console.log(req.user)
}); */

//User Profile
router.get("/:id", middleware.checkUserOwnership, async (req, res) => {
    try {
        req.params.id = req.params.id.replace(/\#(.+)/, ''); //今天不希望partition 5f50b434a93534c9f4a14922#list-notification 也進來
        let user = await User.findById(req.params.id).populate('notifications').populate('reviews').exec();
        res.render("users/show", { user })

    } catch (error) {
        req.flash("error", message.USER_NOT_FOUND);
        res.redirect('/users/register')
    }
});


//SHOW EDIT PAGE
router.get('/:id/edit', middleware.checkUserOwnership, async (req, res) => {

    try {
        let user = await User.findById(req.params.id)
        res.render("users/edit", { user })

    } catch (error) {
        req.flash("error", message.USER_NOT_FOUND);
        res.redirect('/users/register')
    }
})
//EDIT USER 
router.put('/:id', upload.single('image'), async (req, res) => {
    console.log("put route!")
    try {
        //如果有更改上傳照片
        if (req.body.user.avatar) {
            var avatarBase64Data = req.body.user.avatar.replace(/^data:image\/jpeg;base64,/, "");
            fs.writeFile("out.jpg", avatarBase64Data, 'base64', function(err) {
                console.log(err);
            });

        } else {
            console.log(req.body.user.fbName)

        }

    } catch (error) {
        console.log(error);
        req.flash('error_msg', message.INTERNAL_SERVER_ERROR);
        return res.redirect('back');
    }
})


module.exports = router;