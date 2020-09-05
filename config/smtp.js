const nodemailer = require("nodemailer");
/*
	Here we are configuring our SMTP Server details.
	STMP is mail server which is responsible for sending and recieving email.
*/
const smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
        type: "OAuth2",
        user: process.env.SMTP_ACCOUNT,
        clientId: process.env.SMTP_CLINENTID,
        clientSecret: process.env.SMTP_CLINENTSECRET,
        refreshToken: process.env.SMTP_REFRESHTOKEN,
    }
});

module.exports = smtpTransport