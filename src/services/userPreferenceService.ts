import { UserPreference, IUserPreference } from '../models/UserPreference';
import { Group } from '../models/Group';
import { User } from '../models/User';
import mongoose from 'mongoose';

export interface CreatePreferenceData {
  userId: string;
  groupId: string;
  genres: string[];
}

export interface UpdatePreferenceData {
  genres: string[];
}

export class UserPreferenceService {
  // Available movie genres
  static readonly AVAILABLE_GENRES = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance',
    'Sci-Fi', 'Thriller', 'War', 'Western', 'Biography', 'History',
    'Music', 'Sport', 'Superhero', 'Musical', 'Film-Noir', 'Short'
  ];

  /**
   * Create user preferences for a group
   */
  static async createPreferences(data: CreatePreferenceData): Promise<IUserPreference> {
    const { userId, groupId, genres } = data;

    // Validate that user exists and is active
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new Error('Invalid user');
    }

    // Validate that group exists and is active
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      throw new Error('Invalid group');
    }

    // Validate that user is a member of the group
    if (!group.members.some(memberId => memberId.equals(new mongoose.Types.ObjectId(userId)))) {
      throw new Error('User is not a member of this group');
    }

    // Validate genres
    if (!genres || !Array.isArray(genres) || genres.length === 0) {
      throw new Error('At least one genre must be selected');
    }

    if (genres.length > 10) {
      throw new Error('Maximum 10 genres can be selected');
    }

    // Validate each genre
    for (const genre of genres) {
      if (!this.AVAILABLE_GENRES.includes(genre)) {
        throw new Error(`Invalid genre: ${genre}`);
      }
    }

    // Check if preferences already exist
    const existingPreference = await UserPreference.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      groupId: new mongoose.Types.ObjectId(groupId)
    });

    if (existingPreference) {
      throw new Error('User preferences already exist for this group');
    }

    // Create new preferences
    const preference = new UserPreference({
      userId: new mongoose.Types.ObjectId(userId),
      groupId: new mongoose.Types.ObjectId(groupId),
      genres
    });

    return await preference.save();
  }

  /**
   * Update user preferences for a group
   */
  static async updatePreferences(
    userId: string,
    groupId: string,
    data: UpdatePreferenceData
  ): Promise<IUserPreference> {
    const { genres } = data;

    // Validate genres
    if (!genres || !Array.isArray(genres) || genres.length === 0) {
      throw new Error('At least one genre must be selected');
    }

    if (genres.length > 10) {
      throw new Error('Maximum 10 genres can be selected');
    }

    // Validate each genre
    for (const genre of genres) {
      if (!this.AVAILABLE_GENRES.includes(genre)) {
        throw new Error(`Invalid genre: ${genre}`);
      }
    }

    // Find and update preferences
    const preference = await UserPreference.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        groupId: new mongoose.Types.ObjectId(groupId)
      },
      {
        genres,
        updatedAt: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!preference) {
      throw new Error('User preferences not found for this group');
    }

    return preference;
  }

  /**
   * Get user preferences for a group
   */
  static async getUserPreferences(userId: string, groupId: string): Promise<IUserPreference | null> {
    return await UserPreference.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      groupId: new mongoose.Types.ObjectId(groupId)
    });
  }

  /**
   * Get all preferences for a group (for group analysis)
   */
  static async getGroupPreferences(groupId: string): Promise<IUserPreference[]> {
    return await UserPreference.find({
      groupId: new mongoose.Types.ObjectId(groupId)
    }).populate('userId', 'name email picture');
  }

  /**
   * Get all user preferences across all groups
   */
  static async getUserAllPreferences(userId: string): Promise<IUserPreference[]> {
    return await UserPreference.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).populate('groupId', 'name description');
  }

  /**
   * Delete user preferences for a group
   */
  static async deletePreferences(userId: string, groupId: string): Promise<void> {
    const result = await UserPreference.deleteOne({
      userId: new mongoose.Types.ObjectId(userId),
      groupId: new mongoose.Types.ObjectId(groupId)
    });

    if (result.deletedCount === 0) {
      throw new Error('User preferences not found for this group');
    }
  }

  /**
   * Get genre statistics for a group
   */
  static async getGroupGenreStats(groupId: string): Promise<any> {
    const preferences = await this.getGroupPreferences(groupId);
    
    const genreCounts: { [key: string]: number } = {};
    const totalUsers = preferences.length;

    // Count genre preferences
    preferences.forEach(preference => {
      preference.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    // Calculate percentages
    const genreStats = Object.entries(genreCounts).map(([genre, count]) => ({
      genre,
      count,
      percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
    }));

    // Sort by count descending
    genreStats.sort((a, b) => b.count - a.count);

    return {
      totalUsers,
      genreStats,
      mostPopularGenres: genreStats.slice(0, 5).map(stat => stat.genre)
    };
  }

  /**
   * Check if user has set preferences for a group
   */
  static async hasPreferences(userId: string, groupId: string): Promise<boolean> {
    const preference = await UserPreference.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      groupId: new mongoose.Types.ObjectId(groupId)
    });

    return !!preference;
  }

  /**
   * Get available genres
   */
  static getAvailableGenres(): string[] {
    return [...this.AVAILABLE_GENRES];
  }
} 