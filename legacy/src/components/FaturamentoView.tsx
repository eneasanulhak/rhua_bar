import React, { useState } from 'react';
import {
  Plus,
  TrendingUp,
  Search,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  DollarSign,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { FaturamentoDiario, User } from '../types';
import { saveFaturamento, deleteFaturamento } from '../services/storage';
import { hasPermission } from '../services/auth';

interface FaturamentoViewProps {
  faturamentos: FaturamentoDiario[];
  currentUser: User;
  onDataChange: () => void;
  selectedMonth: string;
}

export const FaturamentoView: React.FC<FaturamentoViewProps> = ({
  faturamentos,
  currentUser,
  onDataChange,
  selectedMonth,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FaturamentoDiario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const canAdd = hasPermission(currentUser.role, 'add_faturamento');
  const canEdit = hasPermission(currentUser.role, 'edit_faturamento');
  const canDelete = hasPermission(currentUser.role, 'delete_faturamento');

  // Form fields state
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [dinheiro, setDinheiro] = useState(0);
  const [credito, setCredito] = useState(0);
  const [debito, setDebito] = useState(0);
  const [pix, setPix] = useState(0);
  const [voucher, setVoucher] = useState(0);
  const [sicoob, setSicoob] = useState(0);
  const [diferencaCaixa, setDiferencaCaixa] = useState(0);
  const [observacao, setObservacao] = useState('');

  const handleOpenModal = (item?: FaturamentoDiario) => {
    if (item) {
      setEditingItem(item);
      setData(item.data);
      setDinheiro(item.dinheiro);
      setCredito(item.credito);
      setDebito(item.debito);
      setPix(item.pix);
      setVoucher(item.voucher);
      setSicoob(item.sicoob);
      setDiferencaCaixa(item.diferencaCaixa);
      setObservacao(item.observacao || '');
    } else {
      setEditingItem(null);
      setData(new Date().toISOString().split('T')[0]);
      setDinheiro(0);
      setCredito(0);
      setDebito(0);
      setPix(0);
      setVoucher(0);
      setSicoob(0);
      setDiferencaCaixa(0);
      setObservacao('');
    }
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveFaturamento({
      id: editingItem?.id,
      data,
      dinheiro: Number(dinheiro),
      credito: Number(credito),
      debito: Number(debito),
      pix: Number(pix),
      voucher: Number(voucher),
      sicoob: Number(sicoob),
      diferencaCaixa: Number(diferencaCaixa),
      observacao,
      registradoPor: currentUser.name,
    });
    setShowModal(false);
    onDataChange();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Excluir este lançamento de faturamento?')) {
      deleteFaturamento(id);
      onDataChange();
    }
  };

  const filtered = faturamentos
    .filter((f) => selectedMonth === 'all' || f.data.startsWith(selectedMonth))
    .filter(
      (f) =>
        f.data.includes(searchTerm) ||
        (f.observacao && f.observacao.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => b.data.localeCompare(a.data));

  const totalCalculado = dinheiro + credito + debito + pix + voucher + sicoob;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Faturamento Diário & Entradas</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Preenchimento manual de receitas por método de pagamento
          </p>
        </div>

        {canAdd && (
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 rounded-xl bg-black text-[#EED9C6] dark:bg-[#EED9C6] dark:text-black hover:opacity-90 text-xs font-black flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Faturamento</span>
          </button>
        )}
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por data ou observação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-[#8E765F] dark:focus:ring-[#EED9C6] shadow-xs"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Exibindo <span className="text-slate-900 dark:text-slate-100 font-bold">{filtered.length}</span> dia(s) registrado(s)
        </div>
      </div>

      {/* Data Table Bento Card */}
      <div className="bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-neutral-900 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-800/80">
              <tr>
                <th className="p-3.5">Data</th>
                <th className="p-3.5">Dinheiro</th>
                <th className="p-3.5">Crédito</th>
                <th className="p-3.5">Débito</th>
                <th className="p-3.5">Pix</th>
                <th className="p-3.5">Sicoob/Outros</th>
                <th className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">Total Dia</th>
                <th className="p-3.5">Dif. Caixa</th>
                <th className="p-3.5">Observação</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Nenhum lançamento de faturamento encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((f) => {
                  const total =
                    f.dinheiro + f.credito + f.debito + f.pix + f.voucher + f.sicoob;

                  return (
                    <tr key={f.id} className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {f.data.split('-').reverse().join('/')}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        R$ {f.dinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        R$ {f.credito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        R$ {f.debito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        R$ {f.pix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        R$ {(f.sicoob + f.voucher).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                        R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5">
                        {f.diferencaCaixa === 0 ? (
                          <span className="text-slate-400 dark:text-slate-500">R$ 0,00</span>
                        ) : f.diferencaCaixa > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            +R$ {f.diferencaCaixa.toFixed(2)} (Sobra)
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            -R$ {Math.abs(f.diferencaCaixa).toFixed(2)} (Falta)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {f.observacao || '-'}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                        {canEdit && (
                          <button
                            onClick={() => handleOpenModal(f)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(f.id)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançamento */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {editingItem ? 'Editar Faturamento Diário' : 'Novo Lançamento de Faturamento'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Data Operacional
                </label>
                <input
                  type="date"
                  required
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-[#8E765F] dark:focus:ring-[#EED9C6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Dinheiro (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={dinheiro}
                    onChange={(e) => setDinheiro(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Pix (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pix}
                    onChange={(e) => setPix(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Cartão Crédito (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={credito}
                    onChange={(e) => setCredito(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Cartão Débito (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={debito}
                    onChange={(e) => setDebito(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Sicoob / Outros (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={sicoob}
                    onChange={(e) => setSicoob(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Diferença/Falta de Caixa
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: -10 para falta ou 5 para sobra"
                    value={diferencaCaixa}
                    onChange={(e) => setDiferencaCaixa(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Total Live Box */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">Total Faturado Calculado:</span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                  R$ {totalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Informações sobre evento, movimento, sobras de caixa..."
                  className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
