import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as Mailgen from 'mailgen'
@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private mailGenerator: Mailgen;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'reda9868@gmail.com',
                pass: 'nohn grsa qyis nwdm',
            },
        });

        // Initialize Mailgen
        this.mailGenerator = new Mailgen({
            theme: 'default',
            product: {
                name: 'SPA de Mazraoui',
                link: 'https://yourapp.com/',
                // logo: 'https://yourapp.com/logo.png', // Optionally, provide a logo
            },
        });
    }

    async sendEmail(to: string | string[], subject: string): Promise<void> {
        // Create Mailgen email content
        const email = {
            body: {
                name: 'Mohammed Mazraoui',
                intro: 'Welcome to our SPA ! We\'re very excited to have you on board.',
                action: {
                    instructions: 'Please take an action, Confirm your appointement or it will be canceled automatically withing the next 48h',
                    button: {
                        color: '#22BC66',
                        text: 'Confirm your appointment',
                        link: 'https://frontEnd/confirm?s=d9729feb74992cc3482b350163a1a010'
                    }
                },
                outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
            }
        };

        // Generate the HTML email using Mailgen
        const emailBody = this.mailGenerator.generate(email);

        const mailOptions: nodemailer.SendMailOptions = {
            from: 'reda9868@gmail.com',
            to: Array.isArray(to) ? to.join(', ') : to, // Handle both single and multiple email addresses,
            subject,
            html: emailBody,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent: ' + info.response);
        } catch (error) {
            console.error('Error sending email: ', error);
            throw error;
        }
    }
}
