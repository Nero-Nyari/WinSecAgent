# WinSecAgent

基于 FastAPI + React + LLM 的 Windows 安全事件智能研判平台。

系统通过多阶段智能体流水线，将原始安全告警自动转化为结构化的安全事件分析报告，涵盖告警解析、风险研判、证据提取、攻击链分析和处置建议。

---

## 环境要求

| 依赖 | 版本要求 |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 随 Node.js 安装 |

---

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/Nero-Nyari/WinSecAgent.git
cd WinSecAgent
```

### 2. 安装后端依赖

```bash
cd backend

# 创建虚拟环境（推荐，避免污染系统 Python）
python -m venv myenv

# 激活虚拟环境
myenv\Scripts\activate        # Windows
# source myenv/bin/activate   # Linux / macOS

# 安装所有 Python 依赖
pip install -r requirements.txt
```

主要安装的包包括：FastAPI、SQLAlchemy、OpenAI、Anthropic、ChromaDB、sentence-transformers 等。Windows 平台会额外安装 pywin32（用于读取 Windows 事件日志）。

### 3. 安装前端依赖

```bash
cd frontend

# 安装 Node.js 依赖（React、Vite、Tailwind CSS 等）
npm install
```

### 4. 配置环境变量（可选）

如果需要使用真实的大模型 API（如 DeepSeek、OpenAI 等），需要配置 API Key。

**方式一：通过 .env 文件**

```bash
# 在 backend 目录下创建 .env 文件
cd backend
cp .env.example .env
```

编辑 `backend/.env`，填入你的 API Key：

```ini
LLM_TYPE=deepseek
DEEPSEEK_API_KEY=你的API密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-v4-flash
```

**方式二：通过前端界面配置**

启动后可在前端工作台的「模型管理」界面中添加和切换模型，无需手动编辑文件。

> 不配置 API Key 也可以运行，系统会自动使用本地模拟模式，返回占位分析结果，适合功能演示和开发调试。

### 5. 启动服务

**启动后端（终端 1）：**

```bash
# 确保在 backend 目录下，且虚拟环境已激活
python run.py
```

后端启动后访问 http://127.0.0.1:8000/api/health 验证是否成功，正常返回：

```json
{"ok": true, "app": "WinSecAgent", "version": "1.0.0"}
```

**启动前端（终端 2）：**

```bash
# 确保在 frontend 目录下
npm run dev
```

> **Windows 用户**也可以直接双击项目根目录下的 `start.bat` 一键启动前后端（会自动激活虚拟环境并安装缺失依赖）。

### 6. 访问系统

| 服务 | 地址 |
|------|------|
| 前端工作台 | http://127.0.0.1:5173 |
| 后端 API | http://127.0.0.1:8000 |
| API 文档 | http://127.0.0.1:8000/docs |

> 如果 5173 端口被占用，Vite 会自动切换到 5174、5175 等，请以终端实际输出为准。

---

## 使用指南

### 加载演示案例

左侧面板提供内置演示案例，点击即可创建告警并关联事件：

| 案例 | 场景 |
|------|------|
| SSH 暴力破解 | 暴力破解与疑似入侵 |
| SQL 注入攻击 | Web SQL 注入告警 |
| Log4j 漏洞利用 | Log4j 类 RCE 漏洞利用 |
| 异常进程 | 主机异常进程、外联和挖矿行为 |
| 横向移动 | 可疑账号横向登录和凭证滥用 |

### 手动创建告警

点击右上角「新建告警」，粘贴告警日志或描述文本，系统会自动创建关联事件。

### 分析事件

选择事件后点击分析按钮，系统会按以下流程自动执行：

1. **解析** — 提取告警类型、目标、来源等关键字段
2. **研判** — 判断风险等级和置信度
3. **证据提取** — 提取日志、IOC、资产、漏洞等证据
4. **攻击链分析** — 分析攻击阶段和路径
5. **处置建议** — 生成处置动作（支持审批/驳回）
6. **报告生成** — 输出 Markdown 格式的安全事件报告

### Windows 日志读取

系统支持读取本地 Windows 事件日志（需 Windows 平台 + pywin32），可读取 Security、System、Application 通道的可疑事件。

在非 Windows 平台会自动使用合成演示数据。

---

## 支持的 LLM 提供者

| 提供者 | 说明 |
|--------|------|
| DeepSeek | deepseek-chat / deepseek-reasoner 等 |
| OpenAI | gpt-4o / gpt-4o-mini 等 |
| Anthropic | claude-3-opus / claude-3-sonnet 等 |
| Ollama | 本地部署，支持 llama2 / mistral / qwen2 等 |
| Local | 内置模拟模式，无需 API Key |

---

## 项目结构

```
WinSecAgent/
├── backend/
│   ├── app/
│   │   ├── agents/        # 智能体（解析、研判、证据、攻击链、处置、报告）
│   │   ├── api/           # FastAPI 路由
│   │   ├── core/          # 配置与 LLM 提供者
│   │   ├── db/            # 数据库连接
│   │   ├── models/        # SQLAlchemy 数据模型
│   │   ├── schemas/       # Pydantic 请求/响应模型
│   │   └── services/      # 日志读取、记忆、RAG 等服务
│   ├── data/              # 运行时数据（SQLite、模型配置等）
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面
│   │   ├── services/      # API 调用
│   │   └── stores/        # Zustand 状态管理
│   └── package.json
├── docs/                  # 文档
├── .gitignore
└── start.bat              # Windows 一键启动
```

---

## 常见问题

**Q: 启动后端报错 `ModuleNotFoundError`？**

确保已激活虚拟环境并安装了所有依赖：`pip install -r requirements.txt`

**Q: 分析结果返回的是模拟内容？**

说明未配置 LLM API Key，系统使用本地模拟模式。通过 .env 文件或前端「模型管理」界面配置 API Key 即可。

**Q: Windows 日志读取功能无法使用？**

该功能依赖 pywin32，仅在 Windows 平台可用。非 Windows 平台会自动回退到合成演示数据。

**Q: 前端启动后白屏？**

检查后端是否已启动（http://127.0.0.1:8000/api/health），前端需要后端 API 支持。
