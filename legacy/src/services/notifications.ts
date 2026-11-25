import { Despesa, NotificationItem } from '../types';
import { getDespesasList } from './storage';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Este navegador não suporta notificações Web Push.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function sendPushNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } catch (e) {
      console.error('Erro ao disparar notificação push:', e);
    }
  }
}

export function calculatePendingNotifications(): NotificationItem[] {
  const despesas = getDespesasList();
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);

  const notifications: NotificationItem[] = [];

  despesas.forEach((d) => {
    if (d.status === 'Compensado') return;

    const vencimentoDate = new Date(d.dataVencimento);
    const diffTime = vencimentoDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      // Atrasado
      notifications.push({
        id: `notif-overdue-${d.id}`,
        title: '⚠️ Boleto Atrasado!',
        message: `O pagamento para "${d.fornecedorOuFavorecido}" de R$ ${d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} venceu há ${Math.abs(diffDays)} dia(s) em ${formatDateBR(d.dataVencimento)}.`,
        date: d.dataVencimento,
        type: 'urgent',
        despesaId: d.id,
        read: false,
      });
    } else if (diffDays === 0) {
      // Vence Hoje
      notifications.push({
        id: `notif-today-${d.id}`,
        title: '🔔 Vence Hoje!',
        message: `Boleto de R$ ${d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para "${d.fornecedorOuFavorecido}" vence HOJE.`,
        date: d.dataVencimento,
        type: 'warning',
        despesaId: d.id,
        read: false,
      });
    } else if (diffDays <= 7) {
      // Vence nos próximos 7 dias
      notifications.push({
        id: `notif-upcoming-${d.id}`,
        title: '📅 Vencimento Próximo',
        message: `Boleto de R$ ${d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para "${d.fornecedorOuFavorecido}" vence em ${diffDays} dia(s) (${formatDateBR(d.dataVencimento)}).`,
        date: d.dataVencimento,
        type: 'info',
        despesaId: d.id,
        read: false,
      });
    }
  });

  return notifications;
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}
