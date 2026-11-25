import React, { useState } from 'react';
import { Users, Plus, Trash2, Search } from 'lucide-react';
import { FuncionarioExtra, SetorFuncionario, User } from '../types';
import { getExtrasList, saveExtra, deleteExtra } from '../services/storage';
import { hasPermission } from '../services/auth';

interface FolhaPagamentoViewProps {
  currentUser: User;
  selectedMonth: string;
  onDataChange: () => void;
}

export const FolhaPagamentoView: React.FC<FolhaPagamentoViewProps> = ({
  currentUser,
  selectedMonth,
  onDataChange,
}) => {
  const [extras, setExtras] = useState<FuncionarioExtra[]>(getExtrasList());
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [setorSelecionado, setSetorSelecionado] = useState<SetorFuncionario | 'TODOS'>('TODOS');

  const canAdd = hasPermission(currentUser.role, 'add_despesas');
  const canDelete = hasPermission(currentUser.role, 'delete_despesas');

  // Form Fields
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState<SetorFuncionario>('SALÃO');
  const [funcao, setFuncao] = useState<FuncionarioExtra['funcao']>('SALÃO');
  const [valorAReceber, setValorAReceber] = useState(150);
  const [formaPagamento, setFormaPagamento] = useState<'Dinheiro' | 'Pix'>('Dinheiro');
  const [status, setStatus] = useState<'PAGO' | 'PENDENTE'>('PAGO');
  const [observacao, setObservacao] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveExtra({
      data,
      nome,
      setor,
      funcao,
      valorAReceber: Number(valorAReceber),
      formaPagamento,
      status,
      observacao,
    });
    setExtras(getExtrasList());
    setShowModal(false);
    onDataChange();
  };

  const setores: SetorFuncionario[] = ['COZINHA', 'SEGURANÇA', 'BAR', 'SALÃO', 'RECEPÇÃO', 'LIMPEZA'];

  const identificarSetor = (extra: FuncionarioExtra): SetorFuncionario => {
    if (extra.setor) return extra.setor;
    if (extra.funcao === 'LÍDER' || extra.funcao === 'CUMIM') return 'SALÃO';
    return setores.includes(extra.funcao as SetorFuncionario)
      ? (extra.funcao as SetorFuncionario)
      : 'SALÃO';
  };

  const extrasDoMes = extras.filter((e) => selectedMonth === 'all' || e.data.startsWith(selectedMonth));

  const handleDelete = (id: string) => {
    if (window.confirm('Excluir este lançamento de extra?')) {
      deleteExtra(id);
      setExtras(getExtrasList());
      onDataChange();
    }
  };

  const filtered = extrasDoMes
    .filter((e) => setorSelecionado === 'TODOS' || identificarSetor(e) === setorSelecionado)
    .filter(
      (e) =>
        e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.funcao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        identificarSetor(e).toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.data.localeCompare(a.data));

  const totalPago = filtered
    .filter((e) => e.status === 'PAGO')
    .reduce((acc, e) => acc + e.valorAReceber, 0);

  const funcoesList: FuncionarioExtra['funcao'][] = [
    'SALÃO',
    'BAR',
    'COZINHA',
    'LÍDER',
    'SEGURANÇA',
    'RECEPÇÃO',
    'LIMPEZA',
    'CUMIM',
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8E765F] dark:text-[#EED9C6]" />
            <span>Operacional - Pagamentos de Extras de Funcionários</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão diária da equipe extra de salão, bar, cozinha, limpeza e segurança
          </p>
        </div>

        {canAdd && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-black text-[#EED9C6] dark:bg-[#EED9C6] dark:text-black hover:opacity-90 text-xs font-black flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Diária Extra</span>
          </button>
        )}
      </div>

      {/* Grupos por setor */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {(['TODOS', ...setores] as const).map((item) => {
          const registros = item === 'TODOS'
            ? extrasDoMes
            : extrasDoMes.filter((extra) => identificarSetor(extra) === item);
          const total = registros.reduce((soma, extra) => soma + extra.valorAReceber, 0);
          const ativo = setorSelecionado === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setSetorSelecionado(item)}
              className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                ativo
                  ? 'bg-[#EED9C6] border-[#8E765F] text-slate-950 shadow-md'
                  : 'bg-white dark:bg-[#12141a] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#8E765F]'
              }`}
            >
              <div className="text-[10px] font-black tracking-wider">{item}</div>
              <div className="text-lg font-black mt-1">{registros.length}</div>
              <div className={`text-[10px] ${ativo ? 'text-slate-700' : 'text-slate-500'}`}>
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </button>
          );
        })}
      </div>

      {/* KPI Total Bento Card */}
      <div className="bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 p-4 rounded-2xl flex items-center justify-between max-w-sm shadow-xs">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Total Diárias Pagas:
        </span>
        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
          R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Table Bento Card */}
      <div className="bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-neutral-900/50">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome, setor ou função..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8E765F] dark:focus:ring-[#EED9C6]"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {filtered.length} registro(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-neutral-900 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-800/80">
              <tr>
                <th className="p-3.5">Data</th>
                <th className="p-3.5">Nome do Colaborador</th>
                <th className="p-3.5">Setor</th>
                <th className="p-3.5">Função</th>
                <th className="p-3.5">Valor (R$)</th>
                <th className="p-3.5">Pagamento</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Observação</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Nenhum registro de extra encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      {e.data.split('-').reverse().join('/')}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{e.nome}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        {identificarSetor(e)}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EED9C6]/30 text-slate-800 dark:text-[#EED9C6] border border-[#EED9C6]/50">
                        {e.funcao}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      R$ {e.valorAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{e.formaPagamento}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${e.status === 'PAGO' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400">{e.observacao || '-'}</td>
                    <td className="p-3.5 text-right space-x-1">
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Lançar Diária de Extra</h3>
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
                  Data do Trabalho
                </label>
                <input
                  type="date"
                  required
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-[#8E765F] dark:focus:ring-[#EED9C6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Funcionário / Colaborador
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="ex: Felippe, Vitor Miranda, Vitinho"
                  className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-[#8E765F] dark:focus:ring-[#EED9C6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Setor
                  </label>
                  <select
                    value={setor}
                    onChange={(e) => {
                      const novoSetor = e.target.value as SetorFuncionario;
                      setSetor(novoSetor);
                      setFuncao(novoSetor);
                    }}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium"
                  >
                    {setores.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Função
                  </label>
                  <select
                    value={funcao}
                    onChange={(e) => setFuncao(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium"
                  >
                    {funcoesList.filter((f) => setor === 'SALÃO' ? ['SALÃO', 'LÍDER', 'CUMIM'].includes(f) : f === setor).map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Valor a Receber (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={valorAReceber}
                    onChange={(e) => setValorAReceber(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium"
                  >
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Pix">Pix</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium"
                  >
                    <option value="PAGO">PAGO</option>
                    <option value="PENDENTE">PENDENTE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações / Hora Extra
                </label>
                <input
                  type="text"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="ex: Hora extra pré-abertura"
                  className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                />
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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
