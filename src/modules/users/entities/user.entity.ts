
import * as mongoose from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import * as _ from 'lodash';
import { User } from 'src/core/types/interfaces/user.interface';
import { validateEmail, STATUS_OPTIONS, GENDER_OPTIONS } from 'src/core/shared/shared.enum';


const UsersSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            lowercase: true,
            maxlength: 255,
            minlength: 6,
            required: false,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            index: true,
            validate: [validateEmail, 'Please fill a valid email address'],
            match:
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            maxlength: 255,
            lowercase: true,
            minlength: 6,
            required: false,
            trim: true,
        },
        password: {
            type: String,
            maxlength: 255,
            minlength: 6,
            required: [true, 'PASSWORD_IS_BLANK'],
        },
        isGeneratedPassword: { type: Boolean, required: false },

        firstname: { type: String, required: false },
        lastname: { type: String, required: false },
        DOB: { type: Date, required: false },
        status: {
            type: String,
            enum: STATUS_OPTIONS,
            default: STATUS_OPTIONS.NEW,
            required: false,
        },
        gender: {
            type: String,
            enum: GENDER_OPTIONS,
            default: GENDER_OPTIONS.MALE,
            required: true,
        },


        lastLoginAt: { type: Date, required: false },
        lastLogoutAt: { type: Date, required: false },
        emailVerified: { type: Boolean, default: false, required: false },
        internalComments: { type: String, required: false },

        /* Basic information fields. */
        phoneNumber: { type: String, required: false },
        imageUrl: {
            type: String,
            required: false,
            default: null
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    },
);

UsersSchema.pre<User>('save', async function (next: Function) {
    const user = this;
    if (user.firstname)
        user.firstname = _.join(
            _.map(_.split(_.toLower(user.firstname), '-'), _.startCase),
            '-',
        );

    if (user.lastname)
        user.lastname = _.join(
            _.map(_.split(_.toLower(user.lastname), '-'), _.startCase),
            '-',
        );

    next();
});

export { UsersSchema };
