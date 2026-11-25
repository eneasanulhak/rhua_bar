export type Role = 'admin' | 'gerente' | 'operador' | 'auditor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  password?: string;
}

export type Permission = 
  | 'view_dashboard'
  | 'view_faturamento'
  | 'add_faturamento'
  | 'edit_faturamento'
  | 'delete_faturamento'
  | 'view_despesas'
  | 'add_despesas'
  | 'edit_despesas'
  | 'delete_despesas'
  | 'compensar_despesas'
  | 'view_retiradas'
  | 'export_reports'
  | 'manage_users';

export type CategoryType = 'receita' | 'despesa';

export type ExpenseCategory = 
  | 'Fixos e Básicos'
  | 'Compras Bar e Salão'
  | 'Compras Cozinha e Hortifruti'
  | 'Salário Funcionários'
  | 'Operacional / Extras'
  | 'Atrações e DJs'
  | 'Manutenção e Reparos'
  | 'Pagamentos e Reembolsos'
  | 'Impostos e Taxas'
  | 'Parcelamentos e Boletos'
  | 'Retirada de Sócios'
  | 'Adiantamentos';

export type PaymentMethod = 
  | 'Dinheiro'
  | 'Crédito'
  | 'Débito'
  | 'Pix'
  | 'Voucher'
  | 'Boleto'
  | 'DDA'
  | 'Débito em conta'
  | 'Sicoob';

export type TransactionStatus = 'Compensado' | 'Pendente' | 'Atrasado';

export interface FaturamentoDiario {
  id: string;
  data: string; // YYYY-MM-DD
  dinheiro: number;
  credito: number;
  debito: number;
  pix: number;
  voucher: number;
  sicoob: number;
  diferencaCaixa: number; // valor faltante (-) ou sobra (+)
  observacao?: string;
  registradoPor: string;
}

export interface Despesa {
  id: string;
  descricao: string;
  fornecedorOuFavorecido: string;
  categoria: ExpenseCategory;
  formaPagamento: PaymentMethod;
  valor: number;
  dataEmissao: string; // YYYY-MM-DD
  dataVencimento: string; // YYYY-MM-DD
  dataPagamento?: string; // YYYY-MM-DD
  status: TransactionStatus;
  numeroNF?: string;
  parcela?: string; // e.g. "1/3", "2/5"
  observacao?: string;
  registradoPor: string;
}

export type SetorFuncionario = 'COZINHA' | 'SEGURANÇA' | 'BAR' | 'SALÃO' | 'RECEPÇÃO' | 'LIMPEZA';

export interface FuncionarioExtra {
  id: string;
  data: string; // YYYY-MM-DD
  nome: string;
  setor?: SetorFuncionario;
  funcao: 'COZINHA' | 'BAR' | 'SALÃO' | 'LÍDER' | 'SEGURANÇA' | 'RECEPÇÃO' | 'LIMPEZA' | 'CUMIM';
  valorAReceber: number;
  formaPagamento: 'Dinheiro' | 'Pix';
  status: 'PAGO' | 'PENDENTE';
  observacao?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'urgent' | 'warning' | 'info';
  despesaId?: string;
  read: boolean;
}

export interface MonthlyFilter {
  month: number; // 0-11
  year: number; // YYYY
}
