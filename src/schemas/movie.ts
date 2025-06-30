import Joi from 'joi';

export const movieSchemas = {
  searchMovies: Joi.object({
    query: Joi.string().min(1).max(100).required(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(50).default(20)
  }),

  getRecommendations: Joi.object({
    limit: Joi.number().min(1).max(50).default(20)
  })
}; 