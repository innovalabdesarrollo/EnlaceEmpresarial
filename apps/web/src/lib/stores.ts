import { writable } from 'svelte/store';
import type { User } from './api';
import { getStoredUser } from './api';

export const user = writable<User | null>(null);

export function hydrateUser() {
  user.set(getStoredUser());
}
