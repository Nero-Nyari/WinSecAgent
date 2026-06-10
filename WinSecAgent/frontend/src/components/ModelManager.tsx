import { useState, useEffect } from 'react';
import { X, Trash2, Check, ChevronDown, ChevronRight, Info, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  api_key: string;
  base_url?: string;
  is_active: boolean;
  created_at: string;
}

interface ProviderOption {
  value: string;
  label: string;
  models: string[];
}

const PROVIDERS: ProviderOption[] = [
  { value: 'deepseek', label: 'DeepSeek', models: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-v4-flash', 'deepseek-v4-pro'] },
  { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { value: 'anthropic', label: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  { value: 'ollama', label: 'Ollama (本地)', models: ['llama2', 'mistral', 'codellama', 'qwen2'] },
];

const API_FORMATS = [
  { value: 'openai', label: 'OpenAI Chat Completions 格式' },
  { value: 'anthropic', label: 'Anthropic Messages 格式' },
];

interface ModelManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function ModelManager({ open, onClose }: ModelManagerProps) {
  const [tab, setTab] = useState<'provider' | 'custom'>('provider');
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Provider mode state
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [apiKey, setApiKey] = useState('');

  // Custom mode state
  const [apiFormat, setApiFormat] = useState('openai');
  const [baseUrl, setBaseUrl] = useState('');
  const [useFullUrl, setUseFullUrl] = useState(false);
  const [modelId, setModelId] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [multiModal, setMultiModal] = useState(true);

  // Advanced config
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (open) {
      loadModels();
    }
  }, [open]);

  const loadModels = async () => {
    try {
      const data = await api.models.list();
      setModels(data);
    } catch (e) {
      console.error('Failed to load models:', e);
    }
  };

  const handleAddModel = async () => {
    setLoading(true);
    try {
      if (tab === 'provider') {
        if (!selectedProvider || !selectedModel || !apiKey) {
          alert('请填写所有必填字段');
          setLoading(false);
          return;
        }
        const provider = PROVIDERS.find(p => p.value === selectedProvider);
        await api.models.create({
          name: displayName || `${provider?.label} ${selectedModel}`,
          provider: selectedProvider,
          model: selectedModel,
          api_key: apiKey,
          base_url: '',
          is_active: models.length === 0,
        });
      } else {
        if (!modelId || !customApiKey) {
          alert('请填写所有必填字段');
          setLoading(false);
          return;
        }
        await api.models.create({
          name: displayName || modelId,
          provider: apiFormat,
          model: modelId,
          api_key: customApiKey,
          base_url: baseUrl,
          is_active: models.length === 0,
        });
      }
      await loadModels();
      // 如果是第一个模型，自动刷新配置
      if (models.length === 0) {
        await api.models.refresh();
      }
      resetForm();
    } catch (e: any) {
      alert('添加失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProvider('');
    setSelectedModel('');
    setApiKey('');
    setBaseUrl('');
    setModelId('');
    setCustomApiKey('');
    setDisplayName('');
    setShowAdvanced(false);
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm('确定删除此模型配置？')) return;
    try {
      await api.models.delete(id);
      await loadModels();
    } catch (e: any) {
      alert('删除失败: ' + e.message);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await api.models.setActive(id);
      await api.models.refresh();
      await loadModels();
      alert('模型已切换，配置已生效');
    } catch (e: any) {
      alert('切换失败: ' + e.message);
    }
  };

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; message: string } | null>(null);

  const handleTestModel = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const result = await api.models.test(id);
      setTestResult({ id, ok: result.ok, message: result.message });
    } catch (e: any) {
      setTestResult({ id, ok: false, message: '测试失败: ' + e.message });
    }
    setTestingId(null);
  };

  const currentModels = tab === 'provider'
    ? PROVIDERS.find(p => p.value === selectedProvider)?.models || []
    : [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[520px] max-w-[90vw] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">添加模型</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex mx-5 mt-4 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setTab('provider')}
            className={`flex-1 py-2 text-sm rounded-md transition ${
              tab === 'provider' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            模型服务商
          </button>
          <button
            onClick={() => setTab('custom')}
            className={`flex-1 py-2 text-sm rounded-md transition ${
              tab === 'custom' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            自定义配置
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 space-y-4">
          {tab === 'provider' ? (
            <>
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="text-red-500">*</span> 服务商
                </label>
                <div className="relative">
                  <select
                    value={selectedProvider}
                    onChange={(e) => { setSelectedProvider(e.target.value); setSelectedModel(''); }}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">选择模型服务商</option>
                    {PROVIDERS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="text-red-500">*</span> 模型
                </label>
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!selectedProvider}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">选择模型</option>
                    {currentModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="text-red-500">*</span> API 密钥
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入 API 密钥"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </>
          ) : (
            <>
              {/* API Format */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="text-red-500">*</span> API 格式
                </label>
                <div className="relative">
                  <select
                    value={apiFormat}
                    onChange={(e) => setApiFormat(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {API_FORMATS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Base URL */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    <span className="text-red-500">*</span> 自定义请求地址
                  </label>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>完整 URL</span>
                    <button
                      onClick={() => setUseFullUrl(!useFullUrl)}
                      className={`w-10 h-5 rounded-full transition relative ${useFullUrl ? 'bg-primary-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition shadow ${useFullUrl ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="e.g. https://api.openai.com/v1"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>请填写兼容 OpenAI API 的服务端点地址，不要以斜杠结尾。/chat/completions 将会被补充到你填写的地址末尾。</span>
                </div>
              </div>

              {/* Model ID */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    <span className="text-red-500">*</span> 模型 ID
                  </label>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>多模态</span>
                    <button
                      onClick={() => setMultiModal(!multiModal)}
                      className={`w-10 h-5 rounded-full transition relative ${multiModal ? 'bg-primary-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition shadow ${multiModal ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="输入模型 ID"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="text-red-500">*</span> API 密钥
                </label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="输入 API 密钥"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </>
          )}

          {/* Advanced Config */}
          <div className="border-t border-slate-200 pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition"
            >
              {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              模型别名
            </button>
            <p className="text-xs text-slate-400 mt-1 ml-6">为模型设置一个易于识别的显示名称。</p>

            {showAdvanced && (
              <div className="mt-4 ml-6">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">显示名称</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="可选，例如：我的 DeepSeek 模型"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200">
          <button
            onClick={handleAddModel}
            disabled={loading}
            className="w-full py-2.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? '添加中...' : '添加模型'}
          </button>
        </div>
      </div>

      {/* Model List Panel */}
      {models.length > 0 && (
        <div className="fixed right-6 top-20 w-72 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700">已添加的模型</h3>
            <span className="text-xs text-slate-400">{models.length} 个</span>
          </div>
          <div className="max-h-80 overflow-auto">
            {models.map(model => (
              <div
                key={model.id}
                className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition ${
                  model.is_active ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700 truncate">{model.name}</span>
                      {model.is_active && (
                        <Check className="w-4 h-4 text-primary-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{model.provider} / {model.model}</div>
                    {testResult && testResult.id === model.id && (
                      <div className={`text-[10px] mt-1 ${testResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                        {testResult.message}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleTestModel(model.id)}
                      disabled={testingId === model.id}
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded transition disabled:opacity-50"
                      title="测试连接"
                    >
                      {testingId === model.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                    </button>
                    {!model.is_active && (
                      <button
                        onClick={() => handleSetActive(model.id)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded transition"
                        title="设为默认"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteModel(model.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded transition"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
