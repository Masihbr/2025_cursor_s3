import Joi from 'joi';

export const votingSchemas = {
  createSession: Joi.object({
    groupId: Joi.string().required(),
    movieCount: Joi.number().min(5).max(50).default(20)
  }),

  castVote: Joi.object({
    movieId: Joi.number().required(),
    vote: Joi.string().valid('yes', 'no').required()
  })
}; 