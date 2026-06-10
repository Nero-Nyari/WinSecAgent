import { FileText, RefreshCw, Download } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { api } from '../services/api';

export default function ReportView() {
  const { selectedIncident, report, refreshIncidentDetail } = useAppStore();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedIncident) return;
    setGenerating(true);
    try {
      await api.reports.generate(selectedIncident.id);
      await refreshIncidentDetail();
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-slate-600 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          安全事件报告
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1 text-[10px] bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
            {generating ? '生成中' : '重新生成'}
          </button>
          {report && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 text-[10px] bg-slate-600 hover:bg-slate-700 text-white px-2 py-1 rounded"
            >
              <Download className="w-3 h-3" />
              下载
            </button>
          )}
        </div>
      </div>

      {!report && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm">
          <FileText className="w-8 h-8 mb-2 opacity-50" />
          <div>报告尚未生成</div>
          <button
            onClick={handleGenerate}
            className="mt-2 text-xs text-primary-600 hover:underline"
          >
            立即生成
          </button>
        </div>
      )}

      {report && (
        <div className="flex-1 overflow-auto">
          <div className="prose prose-sm max-w-none prose-slate">
            <pre className="bg-white border border-slate-200 rounded-md p-3 text-xs whitespace-pre-wrap font-mono text-slate-700">
              {report.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
