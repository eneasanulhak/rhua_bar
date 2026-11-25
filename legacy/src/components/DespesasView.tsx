import React, { useState } from 'react';
import {
  Plus,
  Receipt,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Filter,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { Despesa, ExpenseCategory, PaymentMethod, TransactionStatus, User } from '../types';
import { saveDespesa, toggleStatusDespesa, deleteDespesa } from '../services/storage';
import { hasPermission } from '../services/auth';

interface DespesasViewProps {
  despesas: Despesa[];
  currentUser: User;
  onDataChange: () => void;
  selectedMonth: string;
}

export const DespesasView: React.FC<DespesasViewProps> = ({
  despesas,
  currentUser,
  onDataChange,
  selectedMonth,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Despesa | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const canAdd = hasPermission(currentUser.role, 'add_despesas');
  const canEdit = hasPermission(currentUser.role, 'edit_despesas');
  const canDelete = hasPermission(currentUser.role, 'delete_despesas');
  const canCompensar = hasPermission(currentUser.role, 'compensar_despesas');

  // Form Fields
  const [descricao, setDescricao] = useState('');
  const [fornecedorOuFavorecido, setFornecedorOuFavorecido] = useState('');
  const [categoria, setCategoria] = useState<ExpenseCategory>('Compras Bar e Salão');
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>('Boleto');
  const [valor, setValor] = useState(0);
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<TransactionStatus>('Pendente');
  const [numeroNF, setNumeroNF] = useState('');
  const [parcela, setParcela] = useState('');
  const [observacao, setObservacao] = useState('');

  const handleOpenModal = (item?: Despesa) => {
    if (item) {
      setEditingItem(item);
      setDescricao(item.descricao);
      setFornecedorOuFavorecido(item.fornecedorOuFavorecido);
      setCategoria(item.categoria);
      setFormaPagamento(item.formaPagamento);
      setValor(item.valor);
      setDataEmissao(item.dataEmissao);
      setDataVencimento(item.dataVencimento);
      setStatus(item.status);
      setNumeroNF(item.numeroNF || '');
      setParcela(item.parcela || '');
      setObservacao(item.observacao || '');
    } else {
      setEditingItem(null);
      setDescricao('');
      setFornecedorOuFavorecido('');
      setCategoria('Compras Bar e Salão');
      setFormaPagamento('Boleto');
      setValor(0);
      setDataEmissao(new Date().toISOString().split('T')[0]);
      setDataVencimento(new Date().toISOString().split('T')[0]);
      setStatus('Pendente');
      setNumeroNF('');
      setParcela('');
      setObservacao('');
    }
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveDespesa({
      id: editingItem?.id,
      descricao,
      fornecedorOuFavorecido,
      categoria,
      formaPagamento,
      valor: Number(valor),
      dataEmissao,
      dataVencimento,
      status,
      numeroNF,
      parcela,
      observacao,
      registradoPor: currentUser.name,
      dataPagamento: status === 'Compensado' ? new Date().toISOString().split('T')[0] : undefined,
    });
    setShowModal(false);
    onDataChange();
  };

  const handleToggleCompensar = (id: string, currentStatus: TransactionStatus) => {
    const nextStatus = currentStatus === 'Compensado' ? 'Pendente' : 'Compensado';
    toggleStatusDespesa(id, nextStatus);
    onDataChange();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Excluir este lançamento de despesa?')) {
      deleteDespesa(id);
      onDataChange();
    }
  };

  const categoriesList: ExpenseCategory[] = [
    'Fixos e Básicos',
    'Compras Bar e Salão',
    'Compras Cozinha e Hortifruti',
    'Salário Funcionários',
    'Operacional / Extras',
    'Atrações e DJs',
    'Manutenção e Reparos',
    'Pagamentos e Reembolsos',
    'Impostos e Taxas',
    'Parcelamentos e Boletos',
    'Retirada de Sócios',
    'Adiantamentos',
  ];

  const paymentMethodsList: PaymentMethod[] = [
    'Boleto',
    'Pix',
    'Dinheiro',
    'DDA',
    'Débito em conta',
    'Crédito',
    'Débito',
    'Sicoob',
  ];

  const filtered = despesas
    .filter((d) => selectedMonth === 'all' || d.dataVencimento.startsWith(selectedMonth))
    .filter((d) => filterCategory === 'all' || d.categoria === filterCategory)
    .filter((d) => filterStatus === 'all' || d.status === filterStatus)
    .filter(
      (d) =>
        d.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.fornecedorOuFavorecido.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.dataVencimento.localeCompare(a.dataVencimento));

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <span>Despesas & Contas de Fornecedores</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Lançamento e controle de despesas operacionais, fixas e boletos
          </p>
        </div>

        {canAdd && (
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 rounded-xl bg-black text-[#EED9C6] dark:bg-[#EED9C6] dark:text-black hover:opacity-90 text-xs font-black flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por fornecedor ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-[#8E765F] dark:focus:ring-[#EED9C6] shadow-xs"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#8E765F] dark:focus:ring-[#EED9C6] cursor-pointer shadow-xs"
          >
            <option value="all" className="bg-white dark:bg-neutral-900">Todas as Categorias</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat} className="bg-white dark:bg-neutral-900">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#8E765F] dark:focus:ring-[#EED9C6] cursor-pointer shadow-xs"
          >
            <option value="all" className="bg-white dark:bg-neutral-900">Todos os Status</option>
            <option value="Compensado" className="bg-white dark:bg-neutral-900">Compensado (Pago)</option>
            <option value="Pendente" className="bg-white dark:bg-neutral-900">Pendente</option>
            <option value="Atrasado" className="bg-white dark:bg-neutral-900">Atrasado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-neutral-900 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-800/80">
              <tr>
                <th className="p-3.5">Fornecedor / Favorecido</th>
                <th className="p-3.5">Descrição</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5">Forma</th>
                <th className="p-3.5 font-bold text-rose-600 dark:text-rose-400">Valor (R$)</th>
                <th className="p-3.5">Vencimento</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Nenhuma despesa encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const isPaid = d.status === 'Compensado';

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                        {d.fornecedorOuFavorecido}
                        {d.parcela && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {d.parcela}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {d.descricao}
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {d.categoria}
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {d.formaPagamento}
                      </td>
                      <td className="p-3.5 font-extrabold text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                        R$ {d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {d.dataVencimento.split('-').reverse().join('/')}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Compensado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Pendente</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                        {canCompensar && (
                          <button
                            onClick={() => handleToggleCompensar(d.id, d.status)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              isPaid
                                ? 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                            }`}
                            title={isPaid ? 'Marcar como Pendente' : 'Marcar como Pago'}
                          >
                            {isPaid ? 'Desfazer' : 'Pagar'}
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleOpenModal(d)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
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

      {/* Modal Lançamento Despesa */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {editingItem ? 'Editar Despesa' : 'Novo Lançamento de Despesa'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fornecedor / Favorecido
                  </label>
                  <input
                    type="text"
                    required
                    value={fornecedorOuFavorecido}
                    onChange={(e) => setFornecedorOuFavorecido(e.target.value)}
                    placeholder="ex: Zé Distribuidora, Ambev, Celesc"
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-[#8E765F] dark:focus:ring-[#EED9C6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={valor}
                    onChange={(e) => setValor(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-[#8E765F] dark:focus:ring-[#EED9C6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição do Lançamento
                </label>
                <input
                  type="text"
                  required
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="ex: Fornecimento de refrigerantes e latas"
                  className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-[#8E765F] dark:focus:ring-[#EED9C6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as ExpenseCategory)}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium"
                  >
                    {paymentMethodsList.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data Emissão
                  </label>
                  <input
                    type="date"
                    required
                    value={dataEmissao}
                    onChange={(e) => setDataEmissao(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data Vencimento
                  </label>
                  <input
                    type="date"
                    required
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium"
                  >
                    <option value="Compensado">Compensado</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Atrasado">Atrasado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Número NF
                  </label>
                  <input
                    type="text"
                    value={numeroNF}
                    onChange={(e) => setNumeroNF(e.target.value)}
                    placeholder="NF-1234"
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parcela
                  </label>
                  <input
                    type="text"
                    value={parcela}
                    onChange={(e) => setParcela(e.target.value)}
                    placeholder="1/3, 2/3"
                    className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                  />
                </div>
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
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
