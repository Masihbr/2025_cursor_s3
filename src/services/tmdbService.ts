import axios from 'axios';
import { appConfig } from '@/config/app';
import { Movie, TMDBMovie, TMDBResponse, TMDBGenre } from '@/types';

export class TMDBService {
  private baseUrl: string;
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = appConfig.tmdbBaseUrl;
    this.apiKey = appConfig.tmdbApiKey;
    
    if (!this.apiKey) {
      console.warn('TMDB API key not configured. Movie features will not work.');
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('TMDB API key not configured');
    }

    const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params: {
          api_key: this.apiKey,
          ...params
        },
        timeout: 10000 // 10 second timeout
      });

      // Cache the response
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        // TMDB API error
        const status = error.response.status;
        const message = error.response.data?.status_message || 'TMDB API error';
        
        if (status === 401) {
          throw new Error('Invalid TMDB API key');
        } else if (status === 404) {
          throw new Error('Movie not found');
        } else if (status === 429) {
          throw new Error('TMDB API rate limit exceeded');
        } else {
          throw new Error(`TMDB API error (${status}): ${message}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('TMDB API request timeout');
      } else {
        throw new Error(`TMDB API request failed: ${error.message}`);
      }
    }
  }

  async searchMovies(query: string, page: number = 1): Promise<Movie[]> {
    const response = await this.makeRequest<TMDBResponse<TMDBMovie>>('/search/movie', {
      query,
      page,
      include_adult: false,
      language: 'en-US'
    });

    return response.results.map(this.mapTMDBMovieToMovie);
  }

  async getPopularMovies(page: number = 1): Promise<Movie[]> {
    const response = await this.makeRequest<TMDBResponse<TMDBMovie>>('/movie/popular', {
      page,
      language: 'en-US'
    });

    return response.results.map(this.mapTMDBMovieToMovie);
  }

  async getTopRatedMovies(page: number = 1): Promise<Movie[]> {
    const response = await this.makeRequest<TMDBResponse<TMDBMovie>>('/movie/top_rated', {
      page,
      language: 'en-US'
    });

    return response.results.map(this.mapTMDBMovieToMovie);
  }

  async getUpcomingMovies(page: number = 1): Promise<Movie[]> {
    const response = await this.makeRequest<TMDBResponse<TMDBMovie>>('/movie/upcoming', {
      page,
      language: 'en-US'
    });

    return response.results.map(this.mapTMDBMovieToMovie);
  }

  async getMoviesByGenre(genreId: number, page: number = 1): Promise<Movie[]> {
    const response = await this.makeRequest<TMDBResponse<TMDBMovie>>('/discover/movie', {
      with_genres: genreId,
      page,
      sort_by: 'popularity.desc',
      include_adult: false,
      language: 'en-US'
    });

    return response.results.map(this.mapTMDBMovieToMovie);
  }

  async getMovieById(movieId: number): Promise<Movie> {
    const movie = await this.makeRequest<TMDBMovie>(`/movie/${movieId}`, {
      language: 'en-US',
      append_to_response: 'genres'
    });

    return this.mapTMDBMovieToMovie(movie);
  }

  async getGenres(): Promise<TMDBGenre[]> {
    const response = await this.makeRequest<{ genres: TMDBGenre[] }>('/genre/movie/list', {
      language: 'en-US'
    });

    return response.genres;
  }

  async getMoviesByYear(year: number, page: number = 1): Promise<Movie[]> {
    const response = await this.makeRequest<TMDBResponse<TMDBMovie>>('/discover/movie', {
      primary_release_year: year,
      page,
      sort_by: 'popularity.desc',
      include_adult: false,
      language: 'en-US'
    });

    return response.results.map(this.mapTMDBMovieToMovie);
  }

  async getSimilarMovies(movieId: number, page: number = 1): Promise<Movie[]> {
    const response = await this.makeRequest<TMDBResponse<TMDBMovie>>(`/movie/${movieId}/similar`, {
      page,
      language: 'en-US'
    });

    return response.results.map(this.mapTMDBMovieToMovie);
  }

  async getMovieRecommendations(movieId: number, page: number = 1): Promise<Movie[]> {
    const response = await this.makeRequest<TMDBResponse<TMDBMovie>>(`/movie/${movieId}/recommendations`, {
      page,
      language: 'en-US'
    });

    return response.results.map(this.mapTMDBMovieToMovie);
  }

  private mapTMDBMovieToMovie(tmdbMovie: TMDBMovie): Movie {
    return {
      id: tmdbMovie.id,
      title: tmdbMovie.title,
      overview: tmdbMovie.overview,
      posterPath: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : undefined,
      backdropPath: tmdbMovie.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}` : undefined,
      releaseDate: tmdbMovie.release_date,
      genres: tmdbMovie.genres || [], // Will be populated if append_to_response=genres is used
      voteAverage: tmdbMovie.vote_average,
      voteCount: tmdbMovie.vote_count,
      runtime: tmdbMovie.runtime,
      tagline: tmdbMovie.tagline
    };
  }

  // Clear cache (useful for testing or when cache becomes stale)
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
} 