import axios from 'axios';
import { appConfig } from '@/config/app';
import { Movie, TMDBMovie, TMDBResponse, TMDBGenre } from '@/types';

export class TMDBService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = appConfig.tmdbBaseUrl;
    this.apiKey = appConfig.tmdbApiKey;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params: {
          api_key: this.apiKey,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`TMDB API request failed: ${error}`);
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
      language: 'en-US'
    });

    return this.mapTMDBMovieToMovie(movie);
  }

  async getGenres(): Promise<TMDBGenre[]> {
    const response = await this.makeRequest<{ genres: TMDBGenre[] }>('/genre/movie/list', {
      language: 'en-US'
    });

    return response.genres;
  }

  private mapTMDBMovieToMovie(tmdbMovie: TMDBMovie): Movie {
    return {
      id: tmdbMovie.id,
      title: tmdbMovie.title,
      overview: tmdbMovie.overview,
      posterPath: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : undefined,
      backdropPath: tmdbMovie.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}` : undefined,
      releaseDate: tmdbMovie.release_date,
      genres: [], // Will be populated separately if needed
      voteAverage: tmdbMovie.vote_average,
      voteCount: tmdbMovie.vote_count,
      runtime: tmdbMovie.runtime,
      tagline: tmdbMovie.tagline
    };
  }
} 