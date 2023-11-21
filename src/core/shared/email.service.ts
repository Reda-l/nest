import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'nodemailer-express-handlebars';
import * as path from 'path';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'spadesepices@gmail.com',
                pass: 'olwq kyrd wkcp bivn',
            },
        });
        const templatesPath = path.join('src', 'templates'); // Adjust the path based on your project structure

        // Set up handlebars as the template engine
        this.transporter.use(
            'compile',
            handlebars({
                viewEngine: {
                    extName: '.hbs',
                    partialsDir: path.join(templatesPath, 'partials'),
                    layoutsDir: path.join(templatesPath, 'layouts'),
                    defaultLayout: false,
                },
                viewPath: templatesPath,
                extName: '.hbs',
            })
        );
    }

    async sendEmail(to: string | string[], subject: string,template: string,context : any): Promise<void> {
        const mailOptions: nodemailer.SendMailOptions = {
            from: 'spadesepices@gmail.com',
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            template,
            context
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
