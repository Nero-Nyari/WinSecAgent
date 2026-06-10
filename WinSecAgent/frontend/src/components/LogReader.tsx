import { useState } from 'react';
import { Search, Download, Loader2, AlertTriangle, Monitor } from 'lucide-react';
import { api } from '../services/api';
import type { LogEvent, LogReadResult } from '../types';

const eventLevelMap: Record<number, { label: string; color: string }> = {
  1: { label: '严重', color: 'text-red-600 bg-red-50' },
  2: { label: '错误', color: 'text-red-500 bg-red-50' },
  3: { label: '警告', color: 'text-yellow-600 bg-yellow-50' },
  4: { label: '信息', color: 'text-blue-500 bg-blue-50' },
};

export default function LogReader() {
  const [result, setResult] = useState<LogReadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [filter, setFilter] = useState('');

  const handleRead = async () => {
    setLoading(true);
    try {
      const data = await api.logs.read(undefined, true, 200);
      setResult(data);
    } catch (e: any) {
      alert('读取日志失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const data = await api.logs.importAndAnalyze();
      alert(`已创建 ${data.alerts_created} 条告警，分析了 ${data.incidents_analyzed} 个事件`);
    } catch (e: any) {
      alert('导入失败: ' + e.message);
    } finally {
      setImporting(false);
    }
  };

  const filteredEvents = result?.events.filter((e) =>
    !filter || e.Message.toLowerCase().includes(filter.toLowerCase()) ||
    String(e.EventID).includes(filter)
  ) || [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Monitor className="w-4 h-4" />
            Windows Event Log Reader
          </h3>
          <div className="flex gap-1.5">
            <button
              onClick={handleRead}
              disabled={loading}
              className="flex items-center gap-1 text-xs bg-primary-600 text-white px-2.5 py-1.5 rounded hover:bg-primary-700 disabled:opacity-50 transition"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              读取日志
            </button>
            <button
              onClick={handleImport}
              disabled={importing || !result}
              className="flex items-center gap-1 text-xs bg-emerald-600 text-white px-2.5 py-1.5 rounded hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              导入并分析
            </button>
          </div>
        </div>

        {result && (
          <div className="flex gap-3 text-[10px] text-slate-500 mb-2">
            <span>总数: <b className="text-slate-700">{result.total_raw}</b></span>
            <span>可疑: <b className="text-red-600">{result.total_filtered}</b></span>
            <span>平台: <b>{result.platform}</b></span>
            {result.is_mock && (
              <span className="flex items-center gap-0.5 text-amber-600">
                <AlertTriangle className="w-3 h-3" /> 演示模式
              </span>
            )}
          </div>
        )}

        {result && (
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="按事件ID或关键词筛选..."
            className="w-full text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {!result && !loading && (
          <div className="text-xs text-slate-400 text-center py-8">
            点击"读取日志"扫描 Windows 事件日志
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            正在读取日志...
          </div>
        )}
        {filteredEvents.map((evt, i) => {
          const level = eventLevelMap[evt.Level] || eventLevelMap[4];
          return (
            <div key={i} className="px-3 py-2 border-b border-slate-100 hover:bg-slate-50">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${level.color}`}>
                  {level.label}
                </span>
                <span className="text-[10px] font-mono text-slate-600">ID: {evt.EventID}</span>
                <span className="text-[10px] text-slate-400">{evt.Channel}</span>
                <span className="text-[10px] text-slate-400 ml-auto">{evt.TimeCreated}</span>
              </div>
              <div className="text-[11px] text-slate-600 whitespace-pre-wrap line-clamp-3">
                {evt.Message}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
