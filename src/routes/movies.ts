import { Router } from 'express';
import { MovieController } from '@/controllers/movieController';
import { authenticateToken, optionalAuth } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { movieSchemas } from '@/schemas/movie';

const router = Router();
const movieController = new MovieController();

// Public movie routes (optional authentication)
router.get('/search', optionalAuth, validateRequest(movieSchemas.searchMovies), movieController.searchMovies.bind(movieController));
router.get('/popular', optionalAuth, movieController.getPopularMovies.bind(movieController));
router.get('/top-rated', optionalAuth, movieController.getTopRatedMovies.bind(movieController));
router.get('/upcoming', optionalAuth, movieController.getUpcomingMovies.bind(movieController));
router.get('/genres', optionalAuth, movieController.getGenres.bind(movieController));
router.get('/genre/:genreId', optionalAuth, movieController.getMoviesByGenre.bind(movieController));
router.get('/:movieId', optionalAuth, movieController.getMovieById.bind(movieController));
router.get('/:movieId/similar', optionalAuth, movieController.getSimilarMovies.bind(movieController));

// Authenticated movie routes
router.use(authenticateToken);
router.get('/recommendations/:groupId', validateRequest(movieSchemas.getRecommendations), movieController.getRecommendations.bind(movieController));
router.post('/:movieId/favorite', movieController.toggleFavorite.bind(movieController));
router.get('/favorites', movieController.getFavorites.bind(movieController));

export default router; 