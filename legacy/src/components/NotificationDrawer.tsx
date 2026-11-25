import React from 'react';
import { X, Bell, AlertTriangle, Clock, Calendar, CheckCircle2, Volume2 } from 'lucide-react';
import { NotificationItem } from '../types';
import { requestNotificationPermission, sendPushNotification } from '../services/notifications';
import { toggleStatusDespesa } from '../services/storage';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onDataChange: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onDataChange,
}) => {
  if (!isOpen) return null;

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      sendPushNotification('Notificações Ativadas! 🔔', {
        body: 'Você receberá alertas automáticos de vencimento de boletos e despesas do ADM RHUA.',
      });
      alert('Notificações Push ativadas com sucesso!');
    } else {
      alert('A permissão para notificações foi negada ou não é suportada.');
    }
  };

  const handleCompensar = (despesaId?: string) => {
    if (!despesaId) return;
    toggleStatusDespesa(despesaId, 'Compensado');
    onDataChange();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#111318] border-l border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-black/50">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Alertas de Vencimentos
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {notifications.length} conta(s) precisando de atenção
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Web Push Banner */}
          <div className="p-4 bg-slate-50 dark:bg-neutral-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <Volume2 className="w-4 h-4 text-slate-900 dark:text-[#EED9C6]" />
              <span>Alertas Push no navegador</span>
            </div>
            <button
              onClick={handleEnablePush}
              className="px-3 py-1 rounded-lg bg-black text-[#EED9C6] dark:bg-[#EED9C6] dark:text-black hover:opacity-90 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Ativar Push
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Tudo em dia!
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Não existem boletos em atraso ou vencendo nos próximos 7 dias.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUrgent = notif.type === 'urgent';
                const isWarning = notif.type === 'warning';

                return (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isUrgent
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
                        : isWarning
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
                        : 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/80 text-blue-900 dark:text-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {isUrgent ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        ) : isWarning ? (
                          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        ) : (
                          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                        <span className="text-xs font-black uppercase tracking-wider">
                          {notif.title}
                        </span>
                      </div>

                      {notif.despesa && (
                        <span className="text-xs font-black">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(notif.despesa.valor)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs mt-2 text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {notif.message}
                    </p>

                    {notif.despesa && (
                      <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {notif.despesa.categoria} • Vencimento:{' '}
                          {notif.despesa.dataVencimento.split('-').reverse().join('/')}
                        </div>
                        <button
                          onClick={() => handleCompensar(notif.despesa?.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Marcar Pago
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-black/50 text-center">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Fechar Painel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
