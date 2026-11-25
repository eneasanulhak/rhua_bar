import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Edit2, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { User, Role } from '../types';
import { getUsersList, saveUser, deleteUser } from '../services/storage';
import { getRoleLabel, getRoleBadgeClass } from '../services/auth';

interface UserManagementViewProps {
  currentUser: User;
  onDataChange: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  onDataChange,
}) => {
  const [users, setUsers] = useState<User[]>(getUsersList());
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('operador');

  const handleOpenModal = (u?: User) => {
    if (u) {
      setEditingUser(u);
      setName(u.name);
      setEmail(u.email);
      setRole(u.role);
    } else {
      setEditingUser(null);
      setName('');
      setEmail('');
      setRole('operador');
    }
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveUser({
      id: editingUser?.id,
      name,
      email,
      role,
      avatar: editingUser?.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
    });
    setUsers(getUsersList());
    setShowModal(false);
    onDataChange();
  };

  const handleDelete = (id: string) => {
    if (id === currentUser.id) {
      alert('Você não pode excluir o seu próprio usuário logado.');
      return;
    }
    if (window.confirm('Excluir este usuário?')) {
      deleteUser(id);
      setUsers(getUsersList());
      onDataChange();
    }
  };

  const permissionsMatrix = [
    { name: 'Visualizar Dashboard & Gráficos', admin: true, gerente: true, operador: true, auditor: true },
    { name: 'Lançar e Editar Faturamento Diário', admin: true, gerente: true, operador: true, auditor: false },
    { name: 'Lançar e Editar Despesas e Compras', admin: true, gerente: true, operador: true, auditor: false },
    { name: 'Aprovar / Compensar Pagamentos de Boletos', admin: true, gerente: true, operador: false, auditor: false },
    { name: 'Excluir Registros Financeiros', admin: true, gerente: false, operador: false, auditor: false },
    { name: 'Visualizar Pró-Labore / Retirada de Sócios', admin: true, gerente: true, operador: false, auditor: true },
    { name: 'Exportar Relatórios PDF e Excel', admin: true, gerente: true, operador: false, auditor: true },
    { name: 'Gerenciar Usuários e Permissões', admin: true, gerente: false, operador: false, auditor: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#8E765F] dark:text-[#EED9C6]" />
            <span>Gestão de Usuários & Níveis de Permissão</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Controle de acesso seguro para múltiplos usuários com restrições por perfil
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-xl bg-black text-[#EED9C6] dark:bg-[#EED9C6] dark:text-black hover:opacity-90 text-xs font-black flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {/* User Cards Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 p-4 rounded-2xl flex items-center justify-between shadow-xs hover:border-[#8E765F] dark:hover:border-[#EED9C6] transition-colors"
          >
            <div className="flex items-center space-x-3">
              <img
                src={u.avatar}
                alt={u.name}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-black/20 dark:ring-[#EED9C6]/30"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{u.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadgeClass(
                    u.role
                  )}`}
                >
                  {getRoleLabel(u.role)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleOpenModal(u)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              {u.id !== currentUser.id && (
                <button
                  onClick={() => handleDelete(u.id)}
                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Matrix Table Bento Card */}
      <div className="bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 rounded-2xl overflow-hidden p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#8E765F] dark:text-[#EED9C6]" />
          <span>Matriz de Permissões de Acesso</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-neutral-900 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-800/80">
              <tr>
                <th className="p-3">Funcionalidade / Módulo</th>
                <th className="p-3 text-center">Administrador</th>
                <th className="p-3 text-center">Gerente</th>
                <th className="p-3 text-center">Operador</th>
                <th className="p-3 text-center">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {permissionsMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{row.name}</td>
                  <td className="p-3 text-center">
                    {row.admin ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.gerente ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.operador ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.auditor ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal User */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-[#8E765F] dark:focus:ring-[#EED9C6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-[#8E765F] dark:focus:ring-[#EED9C6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Perfil de Acesso / Nível
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium"
                >
                  <option value="admin">Administrador (Acesso Total)</option>
                  <option value="gerente">Gerente Financeiro (Aprovações/Lançamentos)</option>
                  <option value="operador">Operador de Caixa (Lançamentos Diários)</option>
                  <option value="auditor">Auditor / Consultor (Somente Leitura)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-neutral-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black text-[#EED9C6] dark:bg-[#EED9C6] dark:text-black hover:opacity-90 text-xs font-black shadow-md cursor-pointer"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
