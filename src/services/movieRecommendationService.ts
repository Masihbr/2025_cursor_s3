import { TMDBService } from '@/services/tmdbService';
import { GroupService } from '@/services/groupService';
import { Movie, GenrePreference, MovieRecommendation } from '@/types';

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
  async generateGroupRecommendations(groupId: string, limit: number = 20): Promise<MovieRecommendation[]> {
    try {
      // Get group preferences
      const groupPreferences = await this.groupService.getGroupPreferences(groupId);
      if (!groupPreferences) {
        throw new Error('Group preferences not found');
      }

      // Get group details to access individual member preferences
      const group = await this.groupService.getGroupById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Get all available genres from TMDB
      const allGenres = await this.tmdbService.getGenres();
      
      // Calculate recommendation scores for different genres
      const genreScores = this.calculateGenreScores(groupPreferences.preferences, group.members, allGenres);
      
      // Get movies for top genres
      const topGenres = this.getTopGenres(genreScores, 5); // Top 5 genres
      const movieRecommendations: MovieRecommendation[] = [];

      // Fetch movies for each top genre
      for (const genre of topGenres) {
        const movies = await this.tmdbService.getMoviesByGenre(genre.genreId, 1);
        const scoredMovies = this.scoreMoviesForGenre(movies, genre, group.members);
        movieRecommendations.push(...scoredMovies);
      }

      // Sort by score and remove duplicates
      const uniqueMovies = this.removeDuplicateMovies(movieRecommendations);
      const sortedMovies = uniqueMovies.sort((a, b) => b.score - a.score);

      return sortedMovies.slice(0, limit);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * Calculate genre scores based on common and individual preferences
   */
  private calculateGenreScores(
    groupPreferences: any[],
    members: any[],
    allGenres: any[]
  ): Array<{ genreId: number; genreName: string; score: number; reasons: string[] }> {
    const genreScores: { [key: number]: { score: number; reasons: string[]; genreName: string } } = {};

    // Initialize all genres with base score
    allGenres.forEach(genre => {
      genreScores[genre.id] = {
        score: 0,
        reasons: [],
        genreName: genre.name
      };
    });

    // Calculate common preference score (weighted by group preferences)
    groupPreferences.forEach(pref => {
      if (genreScores[pref.genreId]) {
        const commonScore = pref.weight * 2; // Common preferences get double weight
        genreScores[pref.genreId].score += commonScore;
        genreScores[pref.genreId].reasons.push(`Common preference: ${pref.weight}/10`);
      }
    });

    // Calculate individual preference scores
    members.forEach((member: any) => {
      member.preferences.forEach((pref: GenrePreference) => {
        if (genreScores[pref.genreId]) {
          const individualScore = pref.weight;
          genreScores[pref.genreId].score += individualScore;
          genreScores[pref.genreId].reasons.push(`Individual preference: ${pref.weight}/10`);
        }
      });
    });

    // Convert to array and sort by score
    return Object.entries(genreScores)
      .map(([genreId, data]) => ({
        genreId: parseInt(genreId),
        genreName: data.genreName,
        score: data.score,
        reasons: data.reasons
      }))
      .sort((a: any, b: any) => b.score - a.score);
  }

  /**
   * Get top genres for movie fetching
   */
  private getTopGenres(genreScores: any[], count: number): any[] {
    return genreScores.slice(0, count);
  }

  /**
   * Score movies for a specific genre based on member preferences
   */
  private scoreMoviesForGenre(movies: Movie[], genre: any, members: any[]): MovieRecommendation[] {
    return movies.map((movie: Movie) => {
      let score = movie.voteAverage * 0.3; // Base score from TMDB rating
      const reasons: string[] = [];

      // Add genre match score
      const genreMatch = movie.genres.some(g => g.id === genre.genreId);
      if (genreMatch) {
        score += genre.score * 0.4; // Genre preference weight
        reasons.push(`Matches ${genre.genreName} preference`);
      }

      // Add popularity score
      if (movie.voteCount > 1000) {
        score += 2;
        reasons.push('Popular movie');
      }

      // Add recent release bonus
      const releaseYear = new Date(movie.releaseDate).getFullYear();
      const currentYear = new Date().getFullYear();
      if (currentYear - releaseYear <= 2) {
        score += 1;
        reasons.push('Recent release');
      }

      // Add individual member preference matches
      members.forEach((member: any) => {
        member.preferences.forEach((pref: GenrePreference) => {
          if (movie.genres.some(g => g.id === pref.genreId)) {
            score += pref.weight * 0.1; // Individual preference weight
            reasons.push(`Matches ${member.userId}'s ${pref.genreName} preference`);
          }
        });
      });

      return {
        movie,
        score: Math.round(score * 100) / 100, // Round to 2 decimal places
        reasons: reasons.slice(0, 3) // Limit reasons to top 3
      };
    });
  }

  /**
   * Remove duplicate movies and keep the highest scored version
   */
  private removeDuplicateMovies(recommendations: MovieRecommendation[]): MovieRecommendation[] {
    const movieMap = new Map<number, MovieRecommendation>();

    recommendations.forEach(rec => {
      const existing = movieMap.get(rec.movie.id);
      if (!existing || rec.score > existing.score) {
        movieMap.set(rec.movie.id, rec);
      }
    });

    return Array.from(movieMap.values());
  }

  /**
   * Get personalized recommendations for a specific user in a group
   */
  async getPersonalizedRecommendations(groupId: string, userId: string, limit: number = 10): Promise<MovieRecommendation[]> {
    try {
      const group = await this.groupService.getGroupById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      const userMember = group.members.find(member => member.userId === userId);
      if (!userMember) {
        throw new Error('User is not a member of this group');
      }

      // Get user's preferences
      const userPreferences = userMember.preferences;
      if (!userPreferences || userPreferences.length === 0) {
        throw new Error('User has no preferences set');
      }

      // Sort user preferences by weight
      const sortedPreferences = userPreferences.sort((a, b) => b.weight - a.weight);
      
      const recommendations: MovieRecommendation[] = [];

      // Get movies for user's top preferences
      for (const pref of sortedPreferences.slice(0, 3)) {
        const movies = await this.tmdbService.getMoviesByGenre(pref.genreId, 1);
        const scoredMovies = movies.map(movie => ({
          movie,
          score: this.calculatePersonalScore(movie, pref, group.members),
          reasons: [`Matches your ${pref.genreName} preference (${pref.weight}/10)`]
        }));
        recommendations.push(...scoredMovies);
      }

      // Remove duplicates and sort by score
      const uniqueMovies = this.removeDuplicateMovies(recommendations);
      return uniqueMovies.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      throw error;
    }
  }

  /**
   * Calculate personal score for a movie based on user preference and group context
   */
  private calculatePersonalScore(movie: Movie, userPreference: GenrePreference, allMembers: any[]): number {
    let score = movie.voteAverage * 0.3; // Base TMDB score

    // Add user preference weight
    score += userPreference.weight * 0.5;

    // Add group consensus bonus (if other members also like this genre)
    const otherMembersWithSamePreference = allMembers.filter(member => 
      member.preferences.some((pref: GenrePreference) => 
        pref.genreId === userPreference.genreId && pref.weight >= 6
      )
    ).length;

    if (otherMembersWithSamePreference > 0) {
      score += otherMembersWithSamePreference * 0.2;
    }

    return Math.round(score * 100) / 100;
  }
} 