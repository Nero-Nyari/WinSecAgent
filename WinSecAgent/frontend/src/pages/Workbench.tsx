import { useEffect, useState } from 'react';
import { Shield, Plus, Loader2, Settings } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import AlertList from '../components/AlertList';
import AlertDetail from '../components/AlertDetail';
import AgentFlow from '../components/AgentFlow';
import EvidencePanel from '../components/EvidencePanel';
import AttackChain from '../components/AttackChain';
import ActionPanel from '../components/ActionPanel';
import ReportView from '../components/ReportView';
import LogReader from '../components/LogReader';
import KnowledgePanel from '../components/KnowledgePanel';
import MemoryPanel from '../components/MemoryPanel';
import SystemInfoPanel from '../components/SystemInfoPanel';
import SchedulerPanel from '../components/SchedulerPanel';
import ModelManager from '../components/ModelManager';
import { api } from '../services/api';

const RIGHT_TABS = [
  { key: 'agents', label: '智能体执行' },
  { key: 'evidence', label: '证据列表' },
  { key: 'chain', label: '攻击链' },
  { key: 'actions', label: '处置建议' },
  { key: 'report', label: '事件报告' },
] as const;

const LEFT_TABS = [
  { key: 'logs', label: '日志读取' },
  { key: 'knowledge', label: '知识库' },
  { key: 'memory', label: '记忆库' },
  { key: 'system', label: '系统信息' },
  { key: 'scheduler', label: '定时调度' },
] as const;

type RightTabKey = typeof RIGHT_TABS[number]['key'];
type LeftTabKey = typeof LEFT_TABS[number]['key'];

export default function Workbench() {
  const [activeRightTab, setActiveRightTab] = useState<RightTabKey>('agents');
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTabKey>('logs');
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [newAlertText, setNewAlertText] = useState('');
  const [showModelManager, setShowModelManager] = useState(false);

  const {
    selectedIncident,
    loading,
    refreshAlerts,
    refreshIncidents,
    selectIncident,
    runAnalysis,
  } = useAppStore();

  useEffect(() => {
    refreshAlerts();
    refreshIncidents();
  }, [refreshAlerts, refreshIncidents]);

  const handleCreateAlert = async () => {
    if (!newAlertText.trim()) return;
    await useAppStore.getState().refreshAlerts();
    const alert = await api.alerts.create({
      title: newAlertText.split('\n')[0].slice(0, 80) || '手动告警',
      raw_content: newAlertText,
      source_type: 'manual',
      severity: 'medium',
      status: 'pending',
    });
    await refreshAlerts();
    const incident = await api.incidents.create({ alert_id: alert.id, status: 'pending' });
    await refreshIncidents();
    await selectIncident(incident.id);
    setShowNewAlert(false);
    setNewAlertText('');
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary-600" />
          <h1 className="font-bold text-lg text-slate-800">WinSecAgent</h1>
          <span className="text-xs text-slate-400 ml-2">AI-Powered Windows Security Agent</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModelManager(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm px-3 py-1.5 rounded-md transition border border-slate-200"
          >
            <Settings className="w-4 h-4" />
            模型管理
          </button>
          <button
            onClick={() => setShowNewAlert(true)}
            className="flex items-center gap-1 bg-primary-600 hover:bg-primary-700 text-white text-sm px-3 py-1.5 rounded-md transition"
          >
            <Plus className="w-4 h-4" />
            新建告警
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - WinSecAgent features */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {LEFT_TABS.map((t) => (
              <button key={t.key} onClick={() => setActiveLeftTab(t.key)}
                className={`px-2.5 py-2 text-[10px] font-medium whitespace-nowrap border-b-2 transition ${
                  activeLeftTab === t.key
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {activeLeftTab === 'logs' && <LogReader />}
            {activeLeftTab === 'knowledge' && <KnowledgePanel />}
            {activeLeftTab === 'memory' && <MemoryPanel />}
            {activeLeftTab === 'system' && <SystemInfoPanel />}
            {activeLeftTab === 'scheduler' && <SchedulerPanel />}
          </div>
        </aside>

        {/* Center - Alert queue + detail */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <AlertList />
        </div>

        <main className="flex-1 flex flex-col min-w-0 bg-white">
          <AlertDetail onAnalyze={(id) => runAnalysis(id)} />
        </main>

        {/* Right panel - SecAgentX features */}
        <aside className="w-[26rem] bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {RIGHT_TABS.map((t) => (
              <button key={t.key} onClick={() => setActiveRightTab(t.key)}
                className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition ${
                  activeRightTab === t.key
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-3">
            {loading && (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                处理中...
              </div>
            )}
            {!selectedIncident && !loading && (
              <div className="text-sm text-slate-400 text-center py-8">请从左侧选择一个事件</div>
            )}
            {selectedIncident && (
              <>
                {activeRightTab === 'agents' && <AgentFlow />}
                {activeRightTab === 'evidence' && <EvidencePanel />}
                {activeRightTab === 'chain' && <AttackChain />}
                {activeRightTab === 'actions' && <ActionPanel />}
                {activeRightTab === 'report' && <ReportView />}
              </>
            )}
          </div>
        </aside>
      </div>

      {showNewAlert && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[600px] max-w-[90vw] flex flex-col max-h-[80vh]">
            <div className="px-4 py-3 border-b border-slate-200 font-semibold">新建告警</div>
            <div className="p-4 flex-1">
              <textarea
                className="w-full h-48 border border-slate-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="粘贴告警日志或描述..."
                value={newAlertText}
                onChange={(e) => setNewAlertText(e.target.value)}
              />
            </div>
            <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setShowNewAlert(false)}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md">
                取消
              </button>
              <button onClick={handleCreateAlert}
                className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700">
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      <ModelManager open={showModelManager} onClose={() => setShowModelManager(false)} />
    </div>
  );
}
