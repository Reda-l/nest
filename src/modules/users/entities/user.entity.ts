import * as mongoose from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import * as _ from 'lodash';
import { User } from 'src/core/types/interfaces/user.interface';
import {
  validateEmail,
  STATUS_OPTIONS,
  GENDER_OPTIONS,
  Role,
  SALARY_OPTIONS,
} from 'src/core/shared/shared.enum';

const UsersSchema = new mongoose.Schema(
  {
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
    statusFamille: { type: String, required: false },
    gender: {
      type: String,
      enum: GENDER_OPTIONS,
      default: GENDER_OPTIONS.MALE,
      required: true,
    },
    role: {
      type: String,
      enum: Role,
      default: Role.Employee,
      required: true,
    },

    adresse: {
      type: String,
      required: false,
    },
    lastLoginAt: { type: Date, required: false },
    lastLogoutAt: { type: Date, required: false },
    emailVerified: { type: Boolean, default: false, required: false },
    internalComments: { type: String, required: false },

    /* Basic information fields. */
    phoneNumber: { type: String, required: false },
    emergencyName: { type: String, required: false },
    emergencyPhone: { type: String, required: false },

    cinFront: {
      type: String,
      required: false,
      default: null,
    },
    cinBack: {
      type: String,
      required: false,
      default: null,
    },
    empreint: {
      type: String,
      required: false,
      default: null,
    },
    salaryType: {
      type: String,
      enum: SALARY_OPTIONS,
      required: false,
      default: SALARY_OPTIONS.NULL,
    },
    salary: {
      type: Number,
      required: false,
      default: null,
    },
    startDate: { type: Date, required: false },
    cnssCart: { type: String, required: false },
    cnssNumber: {
      type: Number,
      required: false,
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
