const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1) Create a transporter
  // Gmail usually works best with service: 'gmail' or the direct SMTP config
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Adding service helps nodemailer auto-configure
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false // Helps avoid issues with self-signed certificates
    }
  });

  // 2) Define the email options
  // Fix the 'from' field to use the environment variable directly or a fallback
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"SmartKindy" <noreply@smartkindy.edu>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // 3) Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Email send error detail:", error);
    // Log more specific info for debugging
    if (error.code === 'EAUTH') {
      console.error("Authentication failed. Please check your EMAIL_USER and EMAIL_PASS (App Password).");
    }
    return null;
  }
};

module.exports = sendEmail;
