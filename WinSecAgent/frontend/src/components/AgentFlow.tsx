import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

const statusIcon: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  failed: <XCircle className="w-4 h-4 text-red-500" />,
  running: <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />,
  pending: <Clock className="w-4 h-4 text-slate-400" />,
};

export default function AgentFlow() {
  const { agentRuns } = useAppStore();

  if (!agentRuns.length) {
    return <div className="text-xs text-slate-400 text-center py-4">暂无 Agent 执行记录</div>;
  }

  return (
    <div className="space-y-2">
      {agentRuns.map((run) => (
        <div key={run.id} className="border border-slate-200 rounded-md p-2.5 bg-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {statusIcon[run.status] || statusIcon.pending}
              <span className="text-xs font-semibold text-slate-700">{run.agent_name}</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {run.finished_at
                ? `${Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
                : '运行中'}
            </span>
          </div>
          {run.error_message && (
            <div className="text-[11px] text-red-600 bg-red-50 rounded px-2 py-1 mt-1">{run.error_message}</div>
          )}
          {run.output_data && !run.error_message && (
            <div className="text-[11px] text-slate-600 bg-slate-50 rounded px-2 py-1 mt-1 max-h-32 overflow-auto">
              {typeof run.output_data === 'string' ? run.output_data : JSON.stringify(run.output_data, null, 2)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
