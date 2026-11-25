import { FaturamentoDiario, Despesa, FuncionarioExtra, User } from '../types';
import { INITIAL_FATURAMENTO, INITIAL_DESPESAS, INITIAL_EXTRAS } from '../data/initialData';
import { INITIAL_USERS } from './auth';

const KEYS = {
  FATURAMENTO: 'fluxo_caixa_faturamento_v1',
  DESPESAS: 'fluxo_caixa_despesas_v1',
  EXTRAS: 'fluxo_caixa_extras_v1',
  USERS: 'fluxo_caixa_users_v1',
  CURRENT_USER: 'fluxo_caixa_current_user_v1',
};

// State Listeners for reactivity
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

// FATURAMENTO
export function getFaturamentoList(): FaturamentoDiario[] {
  const data = localStorage.getItem(KEYS.FATURAMENTO);
  if (!data) {
    localStorage.setItem(KEYS.FATURAMENTO, JSON.stringify(INITIAL_FATURAMENTO));
    return INITIAL_FATURAMENTO;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing faturamento:', e);
    return INITIAL_FATURAMENTO;
  }
}

export function saveFaturamento(item: Omit<FaturamentoDiario, 'id'> & { id?: string }): FaturamentoDiario {
  const list = getFaturamentoList();
  let newItem: FaturamentoDiario;

  if (item.id) {
    list.forEach((f, idx) => {
      if (f.id === item.id) {
        list[idx] = item as FaturamentoDiario;
      }
    });
    newItem = item as FaturamentoDiario;
  } else {
    newItem = {
      ...item,
      id: `fat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    list.unshift(newItem);
  }

  localStorage.setItem(KEYS.FATURAMENTO, JSON.stringify(list));
  notifyListeners();
  return newItem;
}

export function deleteFaturamento(id: string): void {
  const list = getFaturamentoList().filter((f) => f.id !== id);
  localStorage.setItem(KEYS.FATURAMENTO, JSON.stringify(list));
  notifyListeners();
}

// DESPESAS
export function getDespesasList(): Despesa[] {
  const data = localStorage.getItem(KEYS.DESPESAS);
  if (!data) {
    localStorage.setItem(KEYS.DESPESAS, JSON.stringify(INITIAL_DESPESAS));
    return INITIAL_DESPESAS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing despesas:', e);
    return INITIAL_DESPESAS;
  }
}

export function saveDespesa(item: Omit<Despesa, 'id'> & { id?: string }): Despesa {
  const list = getDespesasList();
  let newItem: Despesa;

  if (item.id) {
    const idx = list.findIndex((d) => d.id === item.id);
    if (idx !== -1) {
      list[idx] = item as Despesa;
    }
    newItem = item as Despesa;
  } else {
    newItem = {
      ...item,
      id: `desp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    list.unshift(newItem);
  }

  localStorage.setItem(KEYS.DESPESAS, JSON.stringify(list));
  notifyListeners();
  return newItem;
}

export function toggleStatusDespesa(id: string, newStatus: Despesa['status'], dataPagamento?: string): void {
  const list = getDespesasList();
  const idx = list.findIndex((d) => d.id === id);
  if (idx !== -1) {
    list[idx].status = newStatus;
    if (newStatus === 'Compensado') {
      list[idx].dataPagamento = dataPagamento || new Date().toISOString().split('T')[0];
    } else {
      delete list[idx].dataPagamento;
    }
    localStorage.setItem(KEYS.DESPESAS, JSON.stringify(list));
    notifyListeners();
  }
}

export function deleteDespesa(id: string): void {
  const list = getDespesasList().filter((d) => d.id !== id);
  localStorage.setItem(KEYS.DESPESAS, JSON.stringify(list));
  notifyListeners();
}

// EXTRAS
export function getExtrasList(): FuncionarioExtra[] {
  const data = localStorage.getItem(KEYS.EXTRAS);
  if (!data) {
    localStorage.setItem(KEYS.EXTRAS, JSON.stringify(INITIAL_EXTRAS));
    return INITIAL_EXTRAS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_EXTRAS;
  }
}

export function saveExtra(item: Omit<FuncionarioExtra, 'id'> & { id?: string }): FuncionarioExtra {
  const list = getExtrasList();
  let newItem: FuncionarioExtra;

  if (item.id) {
    const idx = list.findIndex((e) => e.id === item.id);
    if (idx !== -1) {
      list[idx] = item as FuncionarioExtra;
    }
    newItem = item as FuncionarioExtra;
  } else {
    newItem = {
      ...item,
      id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    list.unshift(newItem);
  }

  localStorage.setItem(KEYS.EXTRAS, JSON.stringify(list));
  notifyListeners();
  return newItem;
}

export function deleteExtra(id: string): void {
  const list = getExtrasList().filter((e) => e.id !== id);
  localStorage.setItem(KEYS.EXTRAS, JSON.stringify(list));
  notifyListeners();
}

// USERS MANAGEMENT
export function getUsersList(): User[] {
  const data = localStorage.getItem(KEYS.USERS);
  if (!data) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_USERS;
  }
}

export function getCurrentUser(): User {
  const data = localStorage.getItem(KEYS.CURRENT_USER);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      // fallback
    }
  }
  const users = getUsersList();
  return users[0] || INITIAL_USERS[0];
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  notifyListeners();
}

export function saveUser(user: Omit<User, 'id'> & { id?: string }): User {
  const list = getUsersList();
  let newUser: User;
  if (user.id) {
    const idx = list.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      list[idx] = user as User;
    }
    newUser = user as User;
  } else {
    newUser = {
      ...user,
      id: `usr-${Date.now()}`,
    };
    list.push(newUser);
  }
  localStorage.setItem(KEYS.USERS, JSON.stringify(list));
  notifyListeners();
  return newUser;
}

export function deleteUser(id: string): void {
  const list = getUsersList().filter((u) => u.id !== id);
  localStorage.setItem(KEYS.USERS, JSON.stringify(list));
  notifyListeners();
}

// AUTH SESSION STATE
const AUTH_KEY = 'fluxo_caixa_auth_logged_in_v1';
const THEME_KEY = 'rhua_theme_layout_v1';

export type ThemeMode = 'light' | 'dark';

export function getThemePreference(): ThemeMode {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  return 'dark'; // default to RHUA standard dark theme
}

export function setThemePreference(theme: ThemeMode): void {
  localStorage.setItem(THEME_KEY, theme);
  notifyListeners();
}

export function isAuthSessionActive(): boolean {
  const val = localStorage.getItem(AUTH_KEY);
  return val === 'true';
}

export function setAuthSessionActive(active: boolean): void {
  localStorage.setItem(AUTH_KEY, active ? 'true' : 'false');
  notifyListeners();
}

export function loginUserByEmail(email: string, password: string): { success: boolean; message?: string; user?: User } {
  const users = getUsersList();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return { success: false, message: 'Usuário não encontrado com este e-mail.' };
  }

  if (!user.password || user.password !== password) {
    return { success: false, message: 'Senha incorreta. Tente novamente.' };
  }

  setCurrentUser(user);
  setAuthSessionActive(true);
  return { success: true, user };
}

export function logoutUser(): void {
  setAuthSessionActive(false);
}

// RESET TO INITIAL SEED DATA
export function resetDataToSeed(): void {
  localStorage.setItem(KEYS.DESPESAS, JSON.stringify(INITIAL_DESPESAS));
  localStorage.setItem(KEYS.EXTRAS, JSON.stringify(INITIAL_EXTRAS));
  localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
  notifyListeners();
}
