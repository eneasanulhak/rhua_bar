import { Role, Permission, User } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Fernando (Nando)',
    email: 'fernando@empresa.com.br',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    password: '123',
  },
  {
    id: 'usr-2',
    name: 'Francine Eing',
    email: 'francine@empresa.com.br',
    role: 'gerente',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    password: '123',
  },
  {
    id: 'usr-3',
    name: 'Jhonatan Souza',
    email: 'jhonatan@empresa.com.br',
    role: 'operador',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    password: '123',
  },
  {
    id: 'usr-4',
    name: 'Diego (Consultoria)',
    email: 'diego@empresa.com.br',
    role: 'auditor',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    password: '123',
  },
];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'view_dashboard',
    'view_faturamento',
    'add_faturamento',
    'edit_faturamento',
    'delete_faturamento',
    'view_despesas',
    'add_despesas',
    'edit_despesas',
    'delete_despesas',
    'compensar_despesas',
    'view_retiradas',
    'export_reports',
    'manage_users',
  ],
  gerente: [
    'view_dashboard',
    'view_faturamento',
    'add_faturamento',
    'edit_faturamento',
    'view_despesas',
    'add_despesas',
    'edit_despesas',
    'compensar_despesas',
    'view_retiradas',
    'export_reports',
  ],
  operador: [
    'view_dashboard',
    'view_faturamento',
    'add_faturamento',
    'view_despesas',
    'add_despesas',
  ],
  auditor: [
    'view_dashboard',
    'view_faturamento',
    'view_despesas',
    'view_retiradas',
    'export_reports',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRoleLabel(role: Role): string {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'gerente':
      return 'Gerente Financeiro';
    case 'operador':
      return 'Operador de Caixa';
    case 'auditor':
      return 'Auditor / Leitura';
    default:
      return role;
  }
}

export function getRoleBadgeClass(role: Role): string {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200';
    case 'gerente':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200';
    case 'operador':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200';
    case 'auditor':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}
