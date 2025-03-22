// #filename=utils/email.js#
const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
    constructor() {
        // Для разработки используем ethereal.email
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendEmail(options) {
        try {
            // Базовая конфигурация email
            const mailOptions = {
                from: `Cyprus Classified <${process.env.SMTP_FROM || 'noreply@cyprus-classified.com'}>`,
                to: options.email,
                subject: options.subject,
                text: options.text,
                html: options.html
            };

            // Отправка email
            const info = await this.transporter.sendMail(mailOptions);
            
            if (process.env.NODE_ENV === 'development') {
                logger.info('Preview URL: ' + nodemailer.getTestMessageUrl(info));
            }

            return info;
        } catch (error) {
            logger.error('Email sending error:', error);
            throw new Error('Error sending email');
        }
    }

    // Шаблоны писем
    async sendVerificationEmail(user, verificationUrl) {
        await this.sendEmail({
            email: user.email,
            subject: 'Email Verification',
            html: `
                <h1>Verify Your Email</h1>
                <p>Hello ${user.name},</p>
                <p>Please verify your email by clicking the link below:</p>
                <a href="${verificationUrl}">Verify Email</a>
                <p>If you didn't create this account, please ignore this email.</p>
            `
        });
    }

    async sendPasswordResetEmail(user, resetUrl) {
        await this.sendEmail({
            email: user.email,
            subject: 'Password Reset',
            html: `
                <h1>Reset Your Password</h1>
                <p>Hello ${user.name},</p>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>If you didn't request this, please ignore this email.</p>
                <p>This link will expire in 1 hour.</p>
            `
        });
    }

    async sendWelcomeEmail(user) {
        await this.sendEmail({
            email: user.email,
            subject: 'Welcome to Cyprus Classified',
            html: `
                <h1>Welcome to Cyprus Classified!</h1>
                <p>Hello ${user.name},</p>
                <p>Thank you for joining Cyprus Classified. We're excited to have you!</p>
                <p>Start exploring our platform and create your first listing.</p>
            `
        });
    }
}

module.exports = new EmailService();