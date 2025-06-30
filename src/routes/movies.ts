import { Router } from 'express';
import { MovieController } from '@/controllers/movieController';
import { authenticateToken, optionalAuth } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { movieSchemas } from '@/schemas/movie';

const router = Router();
const movieController = new MovieController();

// Public movie routes (optional authentication)
router.get('/search', optionalAuth, validateRequest(movieSchemas.searchMovies), movieController.searchMovies);
router.get('/popular', optionalAuth, movieController.getPopularMovies);
router.get('/genres', optionalAuth, movieController.getGenres);
router.get('/:movieId', optionalAuth, movieController.getMovieById);

// Authenticated movie routes
router.use(authenticateToken);
router.get('/recommendations/:groupId', validateRequest(movieSchemas.getRecommendations), movieController.getRecommendations);
router.post('/:movieId/favorite', movieController.toggleFavorite);
router.get('/favorites', movieController.getFavorites);

export default router; 