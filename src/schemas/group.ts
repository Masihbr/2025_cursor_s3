import Joi from 'joi';

export const createGroupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required()
});

export const joinGroupSchema = Joi.object({
  invitationCode: Joi.string().length(8).required()
});

export const updatePreferencesSchema = Joi.object({
  preferences: Joi.array().items(
    Joi.object({
      genreId: Joi.number().required(),
      genreName: Joi.string().required(),
      weight: Joi.number().min(1).max(10).required()
    })
  ).min(1).required()
});

export const groupSchemas = {
  createGroup: createGroupSchema,
  joinGroup: joinGroupSchema,
  updatePreferences: updatePreferencesSchema,

  updateGroup: Joi.object({
    name: Joi.string().min(2).max(50)
  }),

  generateInvite: Joi.object({
    // No additional fields needed for generating invite
  })
}; 