import { AlertTriangle, CheckCircle2, FileText, Zap } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

const severityClass: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
  benign: 'bg-green-100 text-green-700',
  false_positive: 'bg-green-100 text-green-700',
  info: 'bg-slate-100 text-slate-600',
};

const judgmentClass: Record<string, { box: string; icon: string; title: string; text: string }> = {
  critical: { box: 'bg-red-50 border-red-200', icon: 'text-red-500', title: 'text-red-700', text: 'text-red-800' },
  high: { box: 'bg-orange-50 border-orange-200', icon: 'text-orange-500', title: 'text-orange-700', text: 'text-orange-800' },
  medium: { box: 'bg-yellow-50 border-yellow-200', icon: 'text-yellow-600', title: 'text-yellow-700', text: 'text-yellow-800' },
  low: { box: 'bg-green-50 border-green-200', icon: 'text-green-600', title: 'text-green-700', text: 'text-green-800' },
  benign: { box: 'bg-green-50 border-green-200', icon: 'text-green-600', title: 'text-green-700', text: 'text-green-800' },
  false_positive: { box: 'bg-green-50 border-green-200', icon: 'text-green-600', title: 'text-green-700', text: 'text-green-800' },
  info: { box: 'bg-slate-50 border-slate-200', icon: 'text-slate-500', title: 'text-slate-700', text: 'text-slate-700' },
};

function isNoThreat(incident: { risk_level?: string; status: string; attack_stage?: string }) {
  return (
    incident.status === 'benign' ||
    incident.status === 'false_positive' ||
    incident.attack_stage === 'None / Not Applicable'
  );
}

export default function AlertDetail({ onAnalyze }: { onAnalyze: (id: number) => void }) {
  const { selectedIncident, loading } = useAppStore();

  if (!selectedIncident) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        <FileText className="w-8 h-8 mb-2 opacity-50" />
        <div>请从左侧选择一个事件进行分析</div>
      </div>
    );
  }

  const alert = selectedIncident.alert;
  const canAnalyze = selectedIncident.status !== 'analyzing';
  const riskKey = isNoThreat(selectedIncident) ? 'benign' : selectedIncident.risk_level || 'info';
  const judgmentTone = judgmentClass[riskKey] || judgmentClass.info;
  const JudgmentIcon = riskKey === 'benign' || riskKey === 'low' ? CheckCircle2 : AlertTriangle;

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-bold text-base text-slate-800">{alert?.title || '未命名事件'}</h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>ID: {selectedIncident.id}</span>
            <span>·</span>
            <span>告警 #{selectedIncident.alert_id}</span>
            <span>·</span>
            <span>{new Date(selectedIncident.created_at).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded font-medium ${severityClass[riskKey] || severityClass.info}`}>
            {riskKey === 'benign' ? 'NO THREAT' : selectedIncident.risk_level?.toUpperCase() || '未知'}
          </span>
          {canAnalyze && (
            <button
              onClick={() => onAnalyze(selectedIncident.id)}
              disabled={loading}
              className="flex items-center gap-1 text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded disabled:opacity-50"
            >
              <Zap className="w-3 h-3" />
              开始分析
            </button>
          )}
          {!canAnalyze && (
            <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded">
              分析中...
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5">
          <div className="text-[10px] text-slate-400 uppercase">事件类型</div>
          <div className="text-sm font-medium text-slate-700 mt-0.5">{selectedIncident.event_type || '-'}</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5">
          <div className="text-[10px] text-slate-400 uppercase">风险等级</div>
          <div className={`text-sm font-medium mt-0.5 ${riskKey === 'benign' || riskKey === 'low' ? 'text-green-700' : 'text-slate-700'}`}>
            {riskKey === 'benign' ? 'no threat' : selectedIncident.risk_level || '-'}
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5">
          <div className="text-[10px] text-slate-400 uppercase">置信度</div>
          <div className="text-sm font-medium text-slate-700 mt-0.5">
            {selectedIncident.confidence ? `${(selectedIncident.confidence * 100).toFixed(0)}%` : '-'}
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5">
          <div className="text-[10px] text-slate-400 uppercase">攻击阶段</div>
          <div className={`text-sm font-medium mt-0.5 ${riskKey === 'benign' ? 'text-green-700' : 'text-slate-700'}`}>
            {selectedIncident.attack_stage || '-'}
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5">
          <div className="text-[10px] text-slate-400 uppercase">状态</div>
          <div className={`text-sm font-medium mt-0.5 ${riskKey === 'benign' ? 'text-green-700' : 'text-slate-700'}`}>
            {selectedIncident.status}
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5">
          <div className="text-[10px] text-slate-400 uppercase">分析阶段</div>
          <div className="text-sm font-medium text-slate-700 mt-0.5">
            {selectedIncident.agent_runs?.length ? `${selectedIncident.agent_runs.length} 个 Agent 已执行` : '未开始'}
          </div>
        </div>
      </div>

      {selectedIncident.summary && (
        <div className={`mb-4 border rounded-md p-3 flex gap-2 ${judgmentTone.box}`}>
          <JudgmentIcon className={`w-4 h-4 shrink-0 mt-0.5 ${judgmentTone.icon}`} />
          <div>
            <div className={`text-xs font-semibold mb-0.5 ${judgmentTone.title}`}>研判结论</div>
            <div className={`text-xs leading-relaxed ${judgmentTone.text}`}>{selectedIncident.summary}</div>
          </div>
        </div>
      )}

      <div>
        <div className="text-xs font-semibold text-slate-500 mb-1">原始告警内容</div>
        <pre className="bg-slate-900 text-slate-200 text-xs p-3 rounded-md overflow-auto max-h-64 whitespace-pre-wrap">
          {alert?.raw_content || '无内容'}
        </pre>
      </div>
    </div>
  );
}
