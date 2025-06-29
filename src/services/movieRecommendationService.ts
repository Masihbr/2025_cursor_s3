import { UserPreferenceService } from './userPreferenceService';
import { GroupService } from './groupService';
import { Group } from '../models/Group';
import { UserPreference } from '../models/UserPreference';
import mongoose from 'mongoose';

export interface MovieRecommendation {
  movieId: string;
  title: string;
  year: number;
  genres: string[];
  posterUrl?: string;
  score: number;
  reason: string;
}

export interface GroupPreferenceAnalysis {
  totalMembers: number;
  membersWithPreferences: number;
  genreWeights: { [genre: string]: number };
  commonGenres: string[];
  individualPreferences: Array<{
    userId: string;
    genres: string[];
  }>;
}

export class MovieRecommendationService {
  // Mock movie database - in production, this would be a real movie API
  private static readonly MOCK_MOVIES = [
    {
      movieId: 'tt0111161',
      title: 'The Shawshank Redemption',
      year: 1994,
      genres: ['Drama'],
      posterUrl: 'https://example.com/shawshank.jpg'
    },
    {
      movieId: 'tt0068646',
      title: 'The Godfather',
      year: 1972,
      genres: ['Crime', 'Drama'],
      posterUrl: 'https://example.com/godfather.jpg'
    },
    {
      movieId: 'tt0468569',
      title: 'The Dark Knight',
      year: 2008,
      genres: ['Action', 'Crime', 'Drama', 'Thriller'],
      posterUrl: 'https://example.com/dark-knight.jpg'
    },
    {
      movieId: 'tt0071562',
      title: 'The Godfather Part II',
      year: 1974,
      genres: ['Crime', 'Drama'],
      posterUrl: 'https://example.com/godfather-2.jpg'
    },
    {
      movieId: 'tt0050083',
      title: '12 Angry Men',
      year: 1957,
      genres: ['Crime', 'Drama'],
      posterUrl: 'https://example.com/12-angry-men.jpg'
    },
    {
      movieId: 'tt0108052',
      title: 'Schindler\'s List',
      year: 1993,
      genres: ['Biography', 'Drama', 'History'],
      posterUrl: 'https://example.com/schindler.jpg'
    },
    {
      movieId: 'tt0167260',
      title: 'The Lord of the Rings: The Return of the King',
      year: 2003,
      genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
      posterUrl: 'https://example.com/lotr-3.jpg'
    },
    {
      movieId: 'tt0110912',
      title: 'Pulp Fiction',
      year: 1994,
      genres: ['Crime', 'Drama'],
      posterUrl: 'https://example.com/pulp-fiction.jpg'
    },
    {
      movieId: 'tt0060196',
      title: 'The Good, the Bad and the Ugly',
      year: 1966,
      genres: ['Adventure', 'Western'],
      posterUrl: 'https://example.com/good-bad-ugly.jpg'
    },
    {
      movieId: 'tt0133093',
      title: 'The Matrix',
      year: 1999,
      genres: ['Action', 'Sci-Fi'],
      posterUrl: 'https://example.com/matrix.jpg'
    },
    {
      movieId: 'tt0109830',
      title: 'Forrest Gump',
      year: 1994,
      genres: ['Drama', 'Romance'],
      posterUrl: 'https://example.com/forrest-gump.jpg'
    },
    {
      movieId: 'tt0137523',
      title: 'Fight Club',
      year: 1999,
      genres: ['Drama'],
      posterUrl: 'https://example.com/fight-club.jpg'
    },
    {
      movieId: 'tt0114369',
      title: 'Se7en',
      year: 1995,
      genres: ['Crime', 'Drama', 'Mystery', 'Thriller'],
      posterUrl: 'https://example.com/se7en.jpg'
    },
    {
      movieId: 'tt0038650',
      title: 'It\'s a Wonderful Life',
      year: 1946,
      genres: ['Drama', 'Family', 'Fantasy'],
      posterUrl: 'https://example.com/wonderful-life.jpg'
    },
    {
      movieId: 'tt0047478',
      title: 'Seven Samurai',
      year: 1954,
      genres: ['Action', 'Adventure', 'Drama'],
      posterUrl: 'https://example.com/seven-samurai.jpg'
    },
    {
      movieId: 'tt0114814',
      title: 'The Usual Suspects',
      year: 1995,
      genres: ['Crime', 'Drama', 'Mystery', 'Thriller'],
      posterUrl: 'https://example.com/usual-suspects.jpg'
    },
    {
      movieId: 'tt0317248',
      title: 'City of God',
      year: 2002,
      genres: ['Crime', 'Drama'],
      posterUrl: 'https://example.com/city-of-god.jpg'
    },
    {
      movieId: 'tt0118799',
      title: 'Life Is Beautiful',
      year: 1997,
      genres: ['Comedy', 'Drama', 'Romance'],
      posterUrl: 'https://example.com/life-is-beautiful.jpg'
    },
    {
      movieId: 'tt0120737',
      title: 'The Lord of the Rings: The Fellowship of the Ring',
      year: 2001,
      genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
      posterUrl: 'https://example.com/lotr-1.jpg'
    },
    {
      movieId: 'tt0816692',
      title: 'Interstellar',
      year: 2014,
      genres: ['Adventure', 'Drama', 'Sci-Fi'],
      posterUrl: 'https://example.com/interstellar.jpg'
    },
    {
      movieId: 'tt0110413',
      title: 'Léon: The Professional',
      year: 1994,
      genres: ['Action', 'Crime', 'Drama', 'Thriller'],
      posterUrl: 'https://example.com/leon.jpg'
    }
  ];

  /**
   * Analyze group preferences to understand genre distribution
   */
  static async analyzeGroupPreferences(groupId: string): Promise<GroupPreferenceAnalysis> {
    const group = await Group.findById(groupId).populate('members');
    if (!group) {
      throw new Error('Group not found');
    }

    const totalMembers = group.members.length;
    const genreWeights: { [genre: string]: number } = {};
    const individualPreferences: Array<{ userId: string; genres: string[] }> = [];
    let membersWithPreferences = 0;

    // Get all user preferences for this group
    const preferences = await UserPreference.find({ groupId: new mongoose.Types.ObjectId(groupId) });

    // Calculate genre weights
    for (const preference of preferences) {
      membersWithPreferences++;
      individualPreferences.push({
        userId: preference.userId.toString(),
        genres: preference.genres
      });

      for (const genre of preference.genres) {
        genreWeights[genre] = (genreWeights[genre] || 0) + 1;
      }
    }

    // Normalize weights
    for (const genre in genreWeights) {
      genreWeights[genre] = (genreWeights[genre] || 0) / totalMembers;
    }

    // Find common genres (selected by more than 50% of members)
    const commonGenres = Object.entries(genreWeights)
      .filter(([_, weight]) => weight > 0.5)
      .sort(([_, a], [__, b]) => b - a)
      .map(([genre, _]) => genre);

    return {
      totalMembers,
      membersWithPreferences,
      genreWeights,
      commonGenres,
      individualPreferences
    };
  }

  /**
   * Generate intelligent movie recommendations for a group
   */
  static async generateRecommendations(
    groupId: string,
    maxRecommendations: number = 10
  ): Promise<MovieRecommendation[]> {
    const analysis = await this.analyzeGroupPreferences(groupId);
    
    if (analysis.membersWithPreferences === 0) {
      throw new Error('No group members have set preferences yet');
    }

    const recommendations: MovieRecommendation[] = [];

    // Score each movie based on group preferences
    for (const movie of this.MOCK_MOVIES) {
      const score = this.calculateMovieScore(movie, analysis);
      const reason = this.generateRecommendationReason(movie, analysis);

      recommendations.push({
        movieId: movie.movieId,
        title: movie.title,
        year: movie.year,
        genres: movie.genres,
        posterUrl: movie.posterUrl,
        score,
        reason
      });
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations);
  }

  /**
   * Calculate a score for a movie based on group preferences
   */
  private static calculateMovieScore(movie: any, analysis: GroupPreferenceAnalysis): number {
    let score = 0;
    const { genreWeights, commonGenres, individualPreferences } = analysis;

    // Base score from genre matching
    for (const movieGenre of movie.genres) {
      if (genreWeights[movieGenre]) {
        score += genreWeights[movieGenre] * 20; // Weight by popularity
      }
    }

    // Bonus for movies with multiple preferred genres
    const matchingGenres = movie.genres.filter((genre: string) => genreWeights[genre]);
    if (matchingGenres.length > 1) {
      score += (matchingGenres.length - 1) * 10; // Bonus for genre diversity
    }

    // Bonus for common genres
    const commonGenreMatches = movie.genres.filter((genre: string) => commonGenres.includes(genre));
    score += commonGenreMatches.length * 15;

    // Individual preference matching
    for (const preference of individualPreferences) {
      const userMatches = movie.genres.filter((genre: string) => preference.genres.includes(genre));
      if (userMatches.length > 0) {
        score += userMatches.length * 5; // Individual preference bonus
      }
    }

    // Year factor (prefer newer movies slightly)
    const currentYear = new Date().getFullYear();
    const yearFactor = Math.max(0, (movie.year - 1950) / (currentYear - 1950));
    score += yearFactor * 5;

    // Normalize score to 0-100 range
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate a human-readable reason for the recommendation
   */
  private static generateRecommendationReason(movie: any, analysis: GroupPreferenceAnalysis): string {
    const { genreWeights, commonGenres, totalMembers } = analysis;
    const matchingGenres = movie.genres.filter((genre: string) => genreWeights[genre]);
    
    if (matchingGenres.length === 0) {
      return `This movie might appeal to the group's diverse tastes`;
    }

    const commonMatches = matchingGenres.filter((genre: string) => commonGenres.includes(genre));
    
    if (commonMatches.length > 0) {
      const genreList = commonMatches.join(', ');
      return `Highly recommended! ${Math.round((genreWeights[commonMatches[0]] || 0) * 100)}% of group members love ${genreList} movies`;
    }

    if (matchingGenres.length > 1) {
      const genreList = matchingGenres.join(', ');
      return `Great choice! Combines multiple genres the group enjoys: ${genreList}`;
    }

    const genre = matchingGenres[0];
    const percentage = Math.round((genreWeights[genre] || 0) * 100);
    return `${percentage}% of group members enjoy ${genre} movies`;
  }

  /**
   * Get movie details by ID
   */
  static getMovieById(movieId: string): any {
    return this.MOCK_MOVIES.find(movie => movie.movieId === movieId);
  }

  /**
   * Search movies by title or genre
   */
  static searchMovies(query: string, genres?: string[]): any[] {
    const lowercaseQuery = query.toLowerCase();
    
    return this.MOCK_MOVIES.filter(movie => {
      const titleMatch = movie.title.toLowerCase().includes(lowercaseQuery);
      const genreMatch = !genres || genres.some(genre => 
        movie.genres.some(movieGenre => 
          movieGenre.toLowerCase().includes(genre.toLowerCase())
        )
      );
      
      return titleMatch && genreMatch;
    });
  }

  /**
   * Get movies by specific genres
   */
  static getMoviesByGenres(genres: string[]): any[] {
    return this.MOCK_MOVIES.filter(movie => 
      genres.some(genre => 
        movie.genres.some(movieGenre => 
          movieGenre.toLowerCase() === genre.toLowerCase()
        )
      )
    );
  }

  /**
   * Get all available movies
   */
  static getAllMovies(): any[] {
    return [...this.MOCK_MOVIES];
  }
} 