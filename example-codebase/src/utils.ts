/**
 * Example utility function for calculating totals
 */
export function calculateTotal(prices: number[]): number {
  return prices.reduce((sum, price) => sum + price, 0);
}

/**
 * Example API function
 */
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface APIResponse {
  users: User[];
  total: number;
}

export async function fetchUsers(): Promise<APIResponse> {
  const users: User[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
    { id: '3', name: 'Charlie', email: 'charlie@example.com' },
  ];

  const total = users.length;

  return {
    users,
    total,
  };
}

/**
 * Example helper function for formatting dates
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
