/**
 * API endpoints for user management
 */

import { fetchUsers } from './utils.js';

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface UpdateUserRequest {
  id: string;
  name?: string;
  email?: string;
}

/**
 * Get all users
 */
export async function getAllUsers() {
  const result = await fetchUsers();
  return result.users;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  const result = await fetchUsers();
  return result.users.find(user => user.id === id);
}

/**
 * Create new user
 */
export async function createUser(request: CreateUserRequest) {
  return {
    id: Date.now().toString(),
    ...request,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Update existing user
 */
export async function updateUser(id: string, updates: Partial<UpdateUserRequest>) {
  return {
    id,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Delete user
 */
export async function deleteUser(id: string) {
  const result = await fetchUsers();
  const exists = result.users.some(user => user.id === id);
  return exists;
}

/**
 * Calculate user statistics
 */
export async function getUserStats() {
  const result = await fetchUsers();
  return {
    total: result.total,
    active: result.users.length,
  lastUpdated: new Date().toISOString(),
  };
}
