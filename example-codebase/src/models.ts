/**
 * Data models for the application
 */

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt?: string;
}

export interface FilterOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export class PostRepository {
  private posts: Post[] = [
    {
      id: '1',
      title: 'First Post',
      content: 'This is the first post in our blog',
      authorId: '1',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      title: 'Second Post',
      content: 'Another example post',
      authorId: '1',
      createdAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  /**
   * Get all posts
   */
  public getAll(options: FilterOptions = {}): Post[] {
    let result = [...this.posts];

    if (options.sortBy) {
      result.sort((a, b) => {
        const aDate = new Date(a.createdAt || '0');
        const bDate = new Date(b.createdAt || '0');
        return options.sortOrder === 'desc' 
          ? bDate.getTime() - aDate.getTime() 
          : aDate.getTime() - bDate.getTime();
      });
    }

    if (options.offset) {
      result = result.slice(options.offset);
    }

    if (options.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  /**
   * Get post by ID
   */
  public findById(id: string): Post | undefined {
    return this.posts.find(post => post.id === id);
  }

  /**
   * Create new post
   */
  public create(post: Omit<Post, 'id' | 'createdAt'>): Post {
    const newPost: Post = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...post,
    };
    this.posts.push(newPost);
    return newPost;
  }

  /**
   * Update existing post
   */
  public update(id: string, updates: Partial<Post>): Post | undefined {
    const index = this.posts.findIndex(post => post.id === id);
    if (index !== -1) {
      this.posts[index] = {
        ...this.posts[index],
        ...updates,
        id,
        updatedAt: new Date().toISOString(),
      };
      return this.posts[index] as Post;
    }
    return undefined;
  }

  /**
   * Delete post
   */
  public delete(id: string): boolean {
    const index = this.posts.findIndex(post => post.id === id);
    if (index !== -1) {
      this.posts.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get posts by author
   */
  public getByAuthor(authorId: string): Post[] {
    return this.posts.filter(post => post.authorId === authorId);
  }
}

export interface RepositoryConfig {
  host?: string;
  port?: number;
  database?: string;
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
}

export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any[]>;
}

export class DataSource {
  protected config: RepositoryConfig;
  protected connection: DatabaseConnection | null = null;

  constructor(config: RepositoryConfig = {}) {
    this.config = config;
  }

  /**
   * Connect to data source
   */
  public async connect(): Promise<void> {
    console.log(`Connecting to ${this.config.database || 'database'}...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('Connected');
  }

  /**
   * Disconnect from data source
   */
  public async disconnect(): Promise<void> {
    console.log('Disconnecting...');
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connection = null;
  }

  /**
   * Execute query
   */
  public async query(sql: string, params?: any[]): Promise<any[]> {
    if (!this.connection) {
      await this.connect();
    }
    return [];
  }
}
