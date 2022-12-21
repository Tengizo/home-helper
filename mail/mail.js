const nodemailer = require('nodemailer');
const Transport = require("nodemailer-sendinblue-transport");

const {
    MAIL_API_KEY, MAIL_ADDRESSES, MAIL_USERNAME
} = process.env;

// create a transporter object
const transporter = nodemailer.createTransport(
    new Transport({apiKey: MAIL_API_KEY})
);
module.exports.sendMail = function (subject, text) {
// send the email
    transporter.sendMail({
        from: MAIL_USERNAME,
        to: MAIL_ADDRESSES.split(','),
        subject: subject,
        text: text
    }, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log(`Email sent: ${info.response}`);
        }
    });

};