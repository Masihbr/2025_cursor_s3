import { Request, Response } from 'express';
import { TMDBService } from '@/services/tmdbService';

const tmdbService = new TMDBService();

export class MovieController {
  /**
   * GET /api/movies/search
   * Search for movies by query string
   */
  async searchMovies(req: Request, res: Response): Promise<void> {
    try {
      const { query, page = 1 } = req.query;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Query parameter is required'
        });
        return;
      }

      const movies = await tmdbService.searchMovies(query, parseInt(page as string));
      
      res.status(200).json({
        success: true,
        data: {
          movies,
          pagination: {
            page: parseInt(page as string),
            total: movies.length,
            hasMore: movies.length === 20 // TMDB returns 20 results per page
          }
        }
      });
    } catch (error) {
      console.error('Search movies error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search movies'
      });
    }
  }

  /**
   * GET /api/movies/popular
   * Get popular movies
   */
  async getPopularMovies(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1 } = req.query;
      const movies = await tmdbService.getPopularMovies(parseInt(page as string));
      
      res.status(200).json({
        success: true,
        data: {
          movies,
          pagination: {
            page: parseInt(page as string),
            total: movies.length,
            hasMore: movies.length === 20
          }
        }
      });
    } catch (error) {
      console.error('Get popular movies error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch popular movies'
      });
    }
  }

  /**
   * GET /api/movies/top-rated
   * Get top-rated movies
   */
  async getTopRatedMovies(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1 } = req.query;
      const movies = await tmdbService.getTopRatedMovies(parseInt(page as string));
      
      res.status(200).json({
        success: true,
        data: {
          movies,
          pagination: {
            page: parseInt(page as string),
            total: movies.length,
            hasMore: movies.length === 20
          }
        }
      });
    } catch (error) {
      console.error('Get top-rated movies error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch top-rated movies'
      });
    }
  }

  /**
   * GET /api/movies/upcoming
   * Get upcoming movies
   */
  async getUpcomingMovies(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1 } = req.query;
      const movies = await tmdbService.getUpcomingMovies(parseInt(page as string));
      
      res.status(200).json({
        success: true,
        data: {
          movies,
          pagination: {
            page: parseInt(page as string),
            total: movies.length,
            hasMore: movies.length === 20
          }
        }
      });
    } catch (error) {
      console.error('Get upcoming movies error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch upcoming movies'
      });
    }
  }

  /**
   * GET /api/movies/genres
   * Get all movie genres
   */
  async getGenres(req: Request, res: Response): Promise<void> {
    try {
      const genres = await tmdbService.getGenres();
      
      res.status(200).json({
        success: true,
        data: genres
      });
    } catch (error) {
      console.error('Get genres error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch genres'
      });
    }
  }

  /**
   * GET /api/movies/genre/:genreId
   * Get movies by genre
   */
  async getMoviesByGenre(req: Request, res: Response): Promise<void> {
    try {
      const { genreId } = req.params;
      const { page = 1 } = req.query;
      
      if (!genreId || isNaN(parseInt(genreId))) {
        res.status(400).json({
          success: false,
          error: 'Valid genre ID is required'
        });
        return;
      }

      const movies = await tmdbService.getMoviesByGenre(parseInt(genreId), parseInt(page as string));
      
      res.status(200).json({
        success: true,
        data: {
          movies,
          genreId: parseInt(genreId),
          pagination: {
            page: parseInt(page as string),
            total: movies.length,
            hasMore: movies.length === 20
          }
        }
      });
    } catch (error) {
      console.error('Get movies by genre error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch movies by genre'
      });
    }
  }

  /**
   * GET /api/movies/:movieId
   * Get movie details by ID
   */
  async getMovieById(req: Request, res: Response): Promise<void> {
    try {
      const { movieId } = req.params;
      
      if (!movieId || isNaN(parseInt(movieId))) {
        res.status(400).json({
          success: false,
          error: 'Valid movie ID is required'
        });
        return;
      }

      const movie = await tmdbService.getMovieById(parseInt(movieId));
      
      res.status(200).json({
        success: true,
        data: movie
      });
    } catch (error) {
      console.error('Get movie by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch movie details'
      });
    }
  }

  /**
   * GET /api/movies/:movieId/similar
   * Get similar movies
   */
  async getSimilarMovies(req: Request, res: Response): Promise<void> {
    try {
      const { movieId } = req.params;
      const { page = 1 } = req.query;
      
      if (!movieId || isNaN(parseInt(movieId))) {
        res.status(400).json({
          success: false,
          error: 'Valid movie ID is required'
        });
        return;
      }

      const movies = await tmdbService.getSimilarMovies(parseInt(movieId), parseInt(page as string));
      
      res.status(200).json({
        success: true,
        data: {
          movies,
          movieId: parseInt(movieId),
          pagination: {
            page: parseInt(page as string),
            total: movies.length,
            hasMore: movies.length === 20
          }
        }
      });
    } catch (error) {
      console.error('Get similar movies error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch similar movies'
      });
    }
  }

  /**
   * GET /api/movies/recommendations/:groupId
   * Get movie recommendations for a group (placeholder for future implementation)
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const { limit = 20 } = req.query;
      
      // For now, return popular movies as recommendations
      // This will be enhanced in the future with group preference-based recommendations
      const movies = await tmdbService.getPopularMovies(1);
      const limitedMovies = movies.slice(0, parseInt(limit as string));
      
      res.status(200).json({
        success: true,
        data: {
          movies: limitedMovies,
          groupId,
          note: 'Currently showing popular movies. Group-based recommendations coming soon.'
        }
      });
    } catch (error) {
      console.error('Get recommendations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recommendations'
      });
    }
  }

  /**
   * POST /api/movies/:movieId/favorite
   * Toggle favorite status for a movie (placeholder for future implementation)
   */
  async toggleFavorite(req: Request, res: Response): Promise<void> {
    try {
      const { movieId } = req.params;
      const userId = (req as any).user.id;
      
      // This will be implemented when user preferences are added
      res.status(501).json({
        success: false,
        error: 'Toggle favorite not implemented yet'
      });
    } catch (error) {
      console.error('Toggle favorite error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle favorite'
      });
    }
  }

  /**
   * GET /api/movies/favorites
   * Get user's favorite movies (placeholder for future implementation)
   */
  async getFavorites(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      
      // This will be implemented when user preferences are added
      res.status(501).json({
        success: false,
        error: 'Get favorites not implemented yet'
      });
    } catch (error) {
      console.error('Get favorites error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch favorites'
      });
    }
  }
} 