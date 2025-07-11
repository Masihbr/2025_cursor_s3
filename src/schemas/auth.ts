import Joi from 'joi';

export const authSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  googleAuth: Joi.object({
    token: Joi.string().required()
  }),

  facebookAuth: Joi.object({
    token: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    profilePicture: Joi.string().uri()
  })
}; 