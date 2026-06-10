import { useState } from 'react';
import { Bell, Play } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { api } from '../services/api';

const DEMO_CASES = [
  { id: 'case_ssh_bruteforce', title: 'SSH 暴力破解后疑似入侵', severity: 'high' },
  { id: 'case_sql_injection', title: 'Web SQL 注入攻击告警', severity: 'critical' },
  { id: 'case_log4j_exploit', title: 'Log4j 类高危漏洞影响研判', severity: 'critical' },
  { id: 'case_abnormal_process', title: '主机异常进程与外联行为', severity: 'medium' },
  { id: 'case_lateral_movement', title: '可疑账号横向登录行为', severity: 'high' },
];

const severityClass: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
  info: 'bg-slate-100 text-slate-600',
};

export default function AlertList() {
  const { alerts, incidents, selectedIncidentId, selectIncident, refreshAlerts, refreshIncidents } = useAppStore();
  const [filter, setFilter] = useState('');

  const filteredAlerts = alerts.filter((a) =>
    a.title.toLowerCase().includes(filter.toLowerCase())
  );

  const handleLoadCase = async (caseId: string) => {
    const alert = await api.alerts.fromCase(caseId);
    await refreshAlerts();
    const incident = await api.incidents.create({ alert_id: alert.id, status: 'pending' });
    await refreshIncidents();
    await selectIncident(incident.id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-slate-200">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">内置演示案例</div>
        <div className="space-y-1">
          {DEMO_CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => handleLoadCase(c.id)}
              className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded hover:bg-slate-100 transition"
              title={c.title}
            >
              <Play className="w-3 h-3 text-primary-600 shrink-0" />
              <span className="truncate">{c.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 py-2 border-b border-slate-200">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">告警队列</div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="筛选告警..."
          className="w-full text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div className="flex-1 overflow-auto">
        {filteredAlerts.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-4">暂无告警</div>
        )}
        {filteredAlerts.map((alert) => {
          const incident = incidents.find((i) => i.alert_id === alert.id);
          return (
            <button
              key={alert.id}
              onClick={() => incident && selectIncident(incident.id)}
              className={`w-full text-left px-3 py-2 border-b border-slate-100 hover:bg-slate-50 transition ${
                incident?.id === selectedIncidentId ? 'bg-primary-50' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Bell className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-xs font-medium truncate">{alert.title}</span>
                </div>
                <span className={`text-[10px] px-1 py-0.5 rounded shrink-0 ${severityClass[alert.severity] || severityClass.info}`}>
                  {alert.severity}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>{alert.source_type}</span>
                <span>·</span>
                <span>{alert.status}</span>
                {incident && (
                  <>
                    <span>·</span>
                    <span className="text-primary-600">事件 #{incident.id}</span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
