const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'billy.lange@iress.com',
    subject: 'Welcome, thanks for joining us.',
    text: `Welcome ${name}, please let us know if we cn assist you getting started.`
  })
}

const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'billy.lange@iress.com',
    subject: 'Sorry to see you go',
    text: `Goodbye ${name}, please let us know what we could have done to keep you`
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail
};
