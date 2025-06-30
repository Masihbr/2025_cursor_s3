import Joi from 'joi';

export const votingSchemas = {
  createSession: Joi.object({
    groupId: Joi.string().required()
  }),

  castVote: Joi.object({
    movieId: Joi.number().required(),
    vote: Joi.string().valid('yes', 'no').required()
  })
}; 