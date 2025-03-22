const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send verification email
exports.sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Verify Your Email',
      html: `
        <h1>Welcome to Cyprus Classified!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Send password reset email
exports.sendResetPasswordEmail = async (email, token) => {
  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending reset password email:', error);
    return false;
  }
};

// Send new message notification
exports.sendNewMessageEmail = async (recipientEmail, senderName, listingTitle) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: recipientEmail,
      subject: 'New Message Received',
      html: `
        <h1>New Message</h1>
        <p>You have received a new message from ${senderName} regarding "${listingTitle}".</p>
        <p>Log in to your account to view the message.</p>
        <p>If you don't want to receive email notifications, you can disable them in your account settings.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending new message email:', error);
    return false;
  }
};

// Send listing update notification
exports.sendListingUpdateEmail = async (userEmail, listingTitle, updateType) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: userEmail,
      subject: `Listing Update: ${listingTitle}`,
      html: `
        <h1>Listing Update</h1>
        <p>Your listing "${listingTitle}" has been ${updateType}.</p>
        <p>Log in to your account to view the details.</p>
        <p>If you don't want to receive email notifications, you can disable them in your account settings.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending listing update email:', error);
    return false;
  }
}; 