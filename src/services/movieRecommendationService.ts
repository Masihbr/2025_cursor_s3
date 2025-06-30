import { Movie, GenrePreference, GroupPreferences, MovieRecommendation } from '@/types';
import { TMDBService } from './tmdbService';
import { GroupService } from './groupService';

export class MovieRecommendationService {
  private tmdbService: TMDBService;
  private groupService: GroupService;

  constructor() {
    this.tmdbService = new TMDBService();
    this.groupService = new GroupService();
  }

  /**
   * Generate movie recommendations for a group based on member preferences
   */
  async getGroupRecommendations(groupId: string, limit: number = 20): Promise<MovieRecommendation[]> {
    try {
      // Get group preferences
      const groupPreferences = await this.groupService.getGroupPreferences(groupId);
      
      // Get movies from TMDB based on common genres
      const movies = await this.getMoviesByGenres(groupPreferences.commonGenres, limit * 2);
      
      // Score and rank movies based on group preferences
      const scoredMovies = this.scoreMovies(movies, groupPreferences);
      
      // Sort by score and return top recommendations
      return scoredMovies
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to get group recommendations: ${error}`);
    }
  }

  /**
   * Score movies based on group preferences using intelligent algorithm
   */
  private scoreMovies(movies: Movie[], groupPreferences: GroupPreferences): MovieRecommendation[] {
    return movies.map(movie => {
      let score = 0;
      const reasons: string[] = [];

      // Score based on common genre preferences
      const genreScore = this.calculateGenreScore(movie, groupPreferences.commonGenres);
      score += genreScore.score;
      reasons.push(...genreScore.reasons);

      // Score based on individual preferences
      const individualScore = this.calculateIndividualScore(movie, groupPreferences.individualPreferences);
      score += individualScore.score;
      reasons.push(...individualScore.reasons);

      // Bonus for high-rated movies
      if (movie.voteAverage >= 7.5) {
        score += 10;
        reasons.push('High-rated movie');
      }

      // Bonus for recent movies (last 5 years)
      const currentYear = new Date().getFullYear();
      const movieYear = new Date(movie.releaseDate).getFullYear();
      if (currentYear - movieYear <= 5) {
        score += 5;
        reasons.push('Recent release');
      }

      return {
        movie,
        score,
        reasons
      };
    });
  }

  /**
   * Calculate score based on common genre preferences
   */
  private calculateGenreScore(movie: Movie, commonGenres: GenrePreference[]): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    for (const movieGenre of movie.genres) {
      const matchingPreference = commonGenres.find(pref => pref.genreId === movieGenre.id);
      if (matchingPreference) {
        score += matchingPreference.weight * 2; // Double weight for common preferences
        reasons.push(`Matches group preference: ${movieGenre.name}`);
      }
    }

    return { score, reasons };
  }

  /**
   * Calculate score based on individual preferences
   */
  private calculateIndividualScore(
    movie: Movie, 
    individualPreferences: Map<string, GenrePreference[]>
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    for (const [userId, preferences] of individualPreferences) {
      for (const movieGenre of movie.genres) {
        const matchingPreference = preferences.find(pref => pref.genreId === movieGenre.id);
        if (matchingPreference) {
          score += matchingPreference.weight;
          reasons.push(`Matches ${userId}'s preference: ${movieGenre.name}`);
        }
      }
    }

    return { score, reasons };
  }

  /**
   * Get movies from TMDB based on genre preferences
   */
  private async getMoviesByGenres(genres: GenrePreference[], limit: number): Promise<Movie[]> {
    const movies: Movie[] = [];
    const genreIds = genres.map(g => g.genreId);

    // Get movies for each genre and combine
    for (const genreId of genreIds) {
      const genreMovies = await this.tmdbService.getMoviesByGenre(genreId, Math.ceil(limit / genreIds.length));
      movies.push(...genreMovies);
    }

    // Remove duplicates and return
    return this.removeDuplicateMovies(movies);
  }

  /**
   * Remove duplicate movies from array
   */
  private removeDuplicateMovies(movies: Movie[]): Movie[] {
    const seen = new Set();
    return movies.filter(movie => {
      if (seen.has(movie.id)) {
        return false;
      }
      seen.add(movie.id);
      return true;
    });
  }
} 