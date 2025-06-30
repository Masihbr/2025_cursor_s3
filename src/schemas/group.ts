import Joi from 'joi';

export const groupSchemas = {
  createGroup: Joi.object({
    name: Joi.string().min(2).max(50).required()
  }),

  updateGroup: Joi.object({
    name: Joi.string().min(2).max(50)
  }),

  joinGroup: Joi.object({
    invitationCode: Joi.string().length(8).required()
  }),

  updatePreferences: Joi.object({
    preferences: Joi.array().items(
      Joi.object({
        genreId: Joi.number().required(),
        genreName: Joi.string().required(),
        weight: Joi.number().min(1).max(10).required()
      })
    ).min(1).required()
  }),

  generateInvite: Joi.object({
    // No additional fields needed for generating invite
  })
}; 