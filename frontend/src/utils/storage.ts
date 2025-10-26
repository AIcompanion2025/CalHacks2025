import { User, Route, Adventure, Expense } from '@/types';

const STORAGE_KEYS = {
  USER: 'ai_city_companion_user',
  ROUTES: 'ai_city_companion_routes',
  ADVENTURES: 'ai_city_companion_adventures',
  ONBOARDING_COMPLETE: 'ai_city_companion_onboarding',
  EXPENSES: 'ai_city_companion_expenses',
  AUTH_TOKEN: 'ai_city_companion_token'
};

export const saveUser = (user: User): void => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const isOnboardingComplete = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
};

export const setOnboardingComplete = (): void => {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
};

export const saveRoute = (route: Route): void => {
  const routes = getRoutes();
  routes.push(route);
  localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes));
};

export const getRoutes = (): Route[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ROUTES);
  return data ? JSON.parse(data) : [];
};

export const saveAdventure = (adventure: Adventure): void => {
  const adventures = getAdventures();
  adventures.push(adventure);
  localStorage.setItem(STORAGE_KEYS.ADVENTURES, JSON.stringify(adventures));
};

export const getAdventures = (): Adventure[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ADVENTURES);
  return data ? JSON.parse(data) : [];
};

export const updateUserVisitedPlaces = (placeId: number): void => {
  const user = getUser();
  if (user && !user.visitedPlaces.includes(placeId)) {
    user.visitedPlaces.push(placeId);
    saveUser(user);
  }
};

export const saveExpense = (expense: Expense): void => {
  const expenses = getExpenses();
  expenses.push(expense);
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
};

export const getExpenses = (): Expense[] => {
  const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
  return data ? JSON.parse(data) : [];
};

export const deleteExpense = (expenseId: number): void => {
  const expenses = getExpenses();
  const filtered = expenses.filter(e => e.id !== expenseId);
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
};

export const saveAuthToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const clearAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};