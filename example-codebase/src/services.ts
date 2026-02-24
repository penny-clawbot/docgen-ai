/**
 * Example user service
 */
export class UserService {
  private users: any[] = [];

  constructor() {
    this.users = [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' },
    ];
  }

  /**
   * Get all users
   */
  public getAllUsers(): any[] {
    return this.users;
  }

  /**
   * Get user by ID
   */
  public getUserById(id: string): any {
    return this.users.find(user => user.id === id);
  }

  /**
   * Add new user
   */
  public addUser(user: any): void {
    this.users.push(user);
  }

  /**
   * Delete user by ID
   */
  public deleteUser(id: string): boolean {
    const index = this.users.findIndex(user => user.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }
}

/**
 * Example auth service
 */
export class AuthService {
  /**
   * Authenticate user
   */
  public login(email: string, password: string): { success: boolean; token?: string } {
    if (email === 'admin@example.com' && password === 'secret') {
      return {
        success: true,
        token: 'fake-jwt-token',
      };
    }
    return {
      success: false,
    };
  }

  /**
   * Validate token
   */
  public validateToken(token: string): boolean {
    return token === 'fake-jwt-token';
  }
}
