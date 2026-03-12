import type { User } from '@shared/types';

export interface MockCredential {
  username: string;
  password: string;
  user: User;
}

export const MOCK_USERS: MockCredential[] = [
  {
    username: 'hr_anna',
    password: 'hr123',
    user: {
      id: 1,
      username: 'hr_anna',
      email: 'anna@gradorix.ru',
      role: 'HR',
      firstname: 'Анна',
      lastname: 'Соколова',
      is_active: true,
    },
  },
  {
    username: 'mentor_alex',
    password: 'mentor123',
    user: {
      id: 2,
      username: 'mentor_alex',
      email: 'alex@gradorix.ru',
      role: 'MENTOR',
      firstname: 'Алексей',
      lastname: 'Воронов',
      is_active: true,
    },
  },
  {
    username: 'junior_kate',
    password: 'junior123',
    user: {
      id: 3,
      username: 'junior_kate',
      email: 'kate@gradorix.ru',
      role: 'JUNIOR',
      firstname: 'Катя',
      lastname: 'Ефимова',
      is_active: true,
    },
  },
];

export function mockLogin(username: string, password: string): User | null {
  const found = MOCK_USERS.find(
    (c) => c.username === username && c.password === password
  );
  return found?.user ?? null;
}
