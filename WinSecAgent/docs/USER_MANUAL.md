# WinSecAgent 产品说明书

版本：0.1.0  
适用对象：安全运营人员、告警分析人员、演示人员、开发调试人员

## 1. 产品概述

SecAgentX 是一个面向安全运营场景的智能告警分析工作台。系统将原始安全告警转化为安全事件，并通过多阶段智能体流程完成告警解析、风险研判、证据抽取、攻击链分析、处置建议生成和事件报告输出。

SecAgentX 当前定位为 MVP / 演示型产品，适合用于展示 AI 智能体在安全运营场景中的协同分析流程，也可作为后续接入真实 SIEM、EDR、WAF、SOAR 系统的原型基础。

典型使用流程：

1. 载入内置演示案例，或手动创建一条告警。
2. 系统创建关联事件。
3. 选择事件并点击开始分析。
4. 查看 Agent 执行过程、证据、攻击链、处置建议和报告。
5. 对处置建议进行审批、驳回或模拟执行。
6. 生成并下载 Markdown 事件报告。

## 2. 核心能力

| 能力 | 说明 |
| --- | --- |
| 告警录入 | 支持手动粘贴告警文本，也支持从内置演示案例创建告警。 |
| 事件管理 | 将告警关联到事件，按事件维度展示风险等级、置信度、攻击阶段和状态。 |
| 智能体分析流水线 | 解析、研判、证据、攻击链、处置、报告多阶段协同处理。 |
| 证据提取 | 从告警文本中提取日志、IOC、资产、漏洞、工具痕迹等证据项。 |
| 攻击链研判 | 输出攻击路径、可疑成功点、阶段证据和阶段置信度。 |
| 处置建议 | 生成处置动作，支持人工审批、驳回和模拟执行。 |
| 报告生成 | 生成 Markdown 格式安全事件报告，便于复制到工单、知识库或周报系统。 |
| 模型配置 | 支持本地模拟模式，也支持配置 DeepSeek / OpenAI 兼容服务 / Ollama。 |

## 3. 系统组成

项目目录结构：

```text
secagentx/
  backend/       FastAPI 后端服务
  frontend/      Vite + React 前端工作台
  docs/          产品说明和使用文档
  start.bat      Windows 一键启动脚本
  start.sh       Linux/macOS 启动脚本
```

默认访问地址：

| 服务 | 地址 | 说明 |
| --- | --- | --- |
| 前端工作台 | `http://127.0.0.1:5173/` | Vite 开发服务；端口占用时会自动切换到 5174、5175 等。 |
| 后端 API | `http://127.0.0.1:8000/` | FastAPI 服务。 |
| 健康检查 | `http://127.0.0.1:8000/api/health` | 判断后端是否启动成功。 |

## 4. 环境要求

必需环境：

- Windows 10/11、Linux 或 macOS
- Python 3.10 或更高版本
- Node.js 18 或更高版本
- npm

建议环境：

- 使用 Python 虚拟环境，避免污染系统 Python。
- 首次安装依赖时保持网络可用。
- 如需真实模型分析结果，提前准备大模型 API Key。

## 5. 快速启动

### 5.1 Windows 一键启动

在项目根目录双击：

```text
start.bat
```

脚本会依次检查 Python、安装后端依赖、启动后端服务、检查 Node.js、安装前端依赖并启动前端服务。

如果前端终端显示类似内容，表示启动成功：

```text
VITE ready
Local: http://127.0.0.1:5173/
```

如果提示端口被占用，请访问终端中实际输出的新地址，例如：

```text
http://127.0.0.1:5174/
```

### 5.2 手动启动后端

```powershell
cd backend
python -m pip install -r requirements.txt
python run.py
```

启动成功后访问：

```text
http://127.0.0.1:8000/api/health
```

正常返回示例：

```json
{"ok": true, "app": "WinSecAgent", "version": "1.0.0"}
```

### 5.3 手动启动前端

另开一个终端：

```powershell
cd frontend
npm install
npm run dev
```

然后在浏览器打开终端输出的 `Local` 地址。

## 6. 工作台界面

前端页面分为三块：

| 区域 | 位置 | 用途 |
| --- | --- | --- |
| 告警 / 案例列表 | 左侧 | 加载演示案例、查看告警列表、选择事件。 |
| 事件详情 | 中间 | 查看原始告警、风险等级、置信度、攻击阶段，并启动分析。 |
| 分析面板 | 右侧 | 查看 Agent Runs、Evidence、Attack Chain、Actions、Report。 |

顶部操作：

- `New Alert`：手动创建新告警。
- `SecAgentX`：产品名称。
- `SecOps Workbench`：当前工作台定位。

## 7. 首次使用流程

### 7.1 使用内置演示案例

左侧列表提供内置演示案例。点击任意案例后，系统会创建一条告警，并自动关联一个事件。

| 案例 ID | 风险等级 | 场景 |
| --- | --- | --- |
| `case_ssh_bruteforce` | high | SSH 暴力破解与疑似入侵。 |
| `case_sql_injection` | critical | Web SQL 注入攻击告警。 |
| `case_log4j_exploit` | critical | Log4j 类 RCE 漏洞利用。 |
| `case_abnormal_process` | medium | 主机异常进程、外联和挖矿行为。 |
| `case_lateral_movement` | high | 可疑账号横向登录和凭证滥用。 |

注意：当前代码中的部分内置中文文案存在编码乱码，但案例流程、接口和分析链路仍可运行。

### 7.2 手动新建告警

点击右上角 `新建告警`，在弹窗中粘贴告警日志或描述，例如：

```text
[EDR Alert] Suspicious PowerShell
Host: win-server-01
User: admin
Command: powershell -enc ...
Network: outbound connection to 203.0.113.10:443
```

点击 `创建` 后，系统会保存告警、创建关联事件，并自动选中新事件。

## 8. 事件分析流程

选择事件后，点击事件详情区域的分析按钮。系统会同步执行以下 Agent：

| 阶段 | 智能体 | 作用 |
| --- | --- | --- |
| 1 | 解析智能体 | 解析原始告警，提取告警类型、目标、来源、关键字段。 |
| 2 | 研判智能体 | 判断风险等级、置信度和初步研判结论。 |
| 3 | 证据智能体 | 提取日志、IOC、资产、漏洞、工具痕迹等证据。 |
| 4 | 攻击链智能体 | 分析攻击阶段和攻击路径。 |
| 5 | 处置智能体 | 生成处置建议。 |
| 6 | 报告智能体 | 生成安全事件报告。 |

分析完成后，事件状态会进入待复核状态，右侧面板会展示各阶段结果。

## 9. 右侧分析面板

### 9.1 智能体执行

展示每个智能体的执行记录，包括名称、状态、耗时、输出结果和错误信息。常见状态包括 `pending`（待执行）、`running`（运行中）、`success`（成功）、`failed`（失败）。

如果某个智能体失败，优先检查该卡片中的错误信息，以及后端终端日志。

### 9.2 Evidence

展示系统提取出的证据项。证据类型包括：

| 类型 | 含义 |
| --- | --- |
| `log` | 日志证据。 |
| `ioc` | IOC 指标，例如 IP、域名、哈希。 |
| `asset` | 资产信息。 |
| `vuln` | 漏洞信息。 |
| `tool` | 攻击工具或可疑工具。 |

每条证据通常包含标题、来源、内容和置信度。

### 9.3 攻击链分析

展示攻击链分析结果，包括攻击路径、最可疑成功点、分阶段证据和各阶段置信度。该页适合用于复盘攻击是否已经进入执行、持久化、横向移动或命令控制等阶段。

### 9.4 处置建议

展示系统生成的处置建议。每条建议包含动作类型、动作描述、风险等级、是否需要人工审批和当前状态。

支持操作：

| 操作 | 含义 |
| --- | --- |
| `批准` | 同意该处置建议。 |
| `驳回` | 驳回该处置建议。 |
| `模拟` | 模拟执行该建议。 |

当前版本的 `模拟` 只更新动作状态，不会真实隔离主机、封禁 IP 或调用外部安全设备。

### 9.5 事件报告

用于生成、查看和下载事件报告。报告格式为 Markdown，通常包含告警标题、风险等级、研判摘要、证据列表、攻击链、处置建议和人工复核参考。

下载文件名示例：

```text
report-1.md
```

## 10. 大模型配置

WinSecAgent 支持两种运行方式：

1. 本地模拟模式：无需 API Key，适合演示和功能验证。
2. 真实模型模式：配置 API Key 后获得更完整的智能分析结果。

默认配置：

```text
LLM_TYPE=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-v4-flash
```

如果未配置 `DEEPSEEK_API_KEY`，系统会自动切换到 `local` 模式。

### 10.1 配置 DeepSeek

```powershell
$env:LLM_TYPE="deepseek"
$env:DEEPSEEK_API_KEY="你的 DeepSeek API Key"
$env:DEEPSEEK_BASE_URL="https://api.deepseek.com"
$env:LLM_MODEL="deepseek-v4-flash"
python run.py
```

### 10.2 配置 OpenAI 兼容服务

```powershell
$env:LLM_TYPE="openai"
$env:OPENAI_API_KEY="你的 OpenAI API Key"
$env:OPENAI_BASE_URL="https://api.openai.com/v1"
$env:LLM_MODEL="gpt-4o"
python run.py
```

### 10.3 配置 Ollama

先启动 Ollama 服务，然后设置：

```powershell
$env:LLM_TYPE="ollama"
$env:OLLAMA_BASE_URL="http://localhost:11434"
$env:LLM_MODEL="llama2"
python run.py
```

## 11. 数据存储

默认数据库为 SQLite，位置：

```text
backend/data/secagentx.db
```

数据库中保存：

- 告警
- 事件
- Agent 执行记录
- 证据项
- 处置建议
- 事件报告

如需使用自定义数据库，可设置：

```powershell
$env:DATABASE_URL="sqlite:///自定义路径/secagentx.db"
```

也可以使用 SQLAlchemy 支持的其他数据库连接串。

## 12. API 简表

常用后端接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查。 |
| GET | `/api/alerts` | 获取告警列表。 |
| POST | `/api/alerts` | 创建告警。 |
| GET | `/api/alerts/{alert_id}` | 获取告警详情。 |
| DELETE | `/api/alerts/{alert_id}` | 删除告警。 |
| POST | `/api/alerts/from-case/{case_id}` | 从内置案例创建告警。 |
| GET | `/api/incidents` | 获取事件列表。 |
| POST | `/api/incidents` | 创建事件。 |
| GET | `/api/incidents/{incident_id}` | 获取事件详情。 |
| POST | `/api/incidents/{incident_id}/analyze` | 启动事件分析。 |
| GET | `/api/incidents/{incident_id}/actions` | 获取处置建议。 |
| POST | `/api/incidents/{incident_id}/actions/{action_id}/approve` | 审批处置建议。 |
| POST | `/api/incidents/{incident_id}/actions/{action_id}/reject` | 驳回处置建议。 |
| POST | `/api/incidents/{incident_id}/actions/{action_id}/simulate` | 模拟执行处置建议。 |
| GET | `/api/incidents/{incident_id}/report` | 获取最新报告。 |
| POST | `/api/incidents/{incident_id}/report` | 生成新报告。 |

## 13. 常见问题排查

### 13.1 前端打不开

检查前端服务是否启动：

```powershell
cd frontend
npm run dev
```

如果看到端口切换提示，请访问终端输出的实际地址，而不是固定访问 5173。

### 13.2 后端打不开

检查后端服务：

```powershell
cd backend
python run.py
```

然后访问：

```text
http://127.0.0.1:8000/api/health
```

如果 8000 端口被占用，需要关闭占用进程，或修改 `backend/run.py` 中的端口配置。

### 13.3 分析按钮无响应

按顺序检查：

1. 后端是否启动。
2. 前端是否通过 Vite 代理访问 `/api`。
3. 浏览器控制台是否报错。
4. 后端终端是否有异常堆栈。

### 13.4 分析结果较简单

如果没有配置 API Key，系统会使用 local 模拟模式。该模式主要用于验证流程，不代表真实模型能力。需要更完整的结果时，请配置 DeepSeek、OpenAI 兼容服务或 Ollama。

### 13.5 页面或案例文字乱码

当前部分源代码中的中文文案曾被错误编码保存，可能导致页面展示乱码。功能流程本身仍可用。如需彻底修复，需要统一将前端组件、后端内置案例和文档按 UTF-8 重新保存。

## 14. 推荐演示脚本

可按以下步骤进行一次完整演示：

1. 启动后端和前端。
2. 打开前端工作台。
3. 从左侧选择 SQL 注入或 Log4j 演示案例。
4. 在中间事件详情区点击分析按钮。
5. 切换到 `智能体执行`，展示多智能体执行过程。
6. 切换到 `证据列表`，展示提取出的证据。
7. 切换到 `攻击链`，展示攻击路径。
8. 切换到 `处置建议`，审批或模拟执行一条处置建议。
9. 切换到 `事件报告`，生成并下载报告。
10. 打开下载的 Markdown 报告，展示最终输出。

## 15. 当前版本限制

- 处置动作只支持审批、驳回和模拟执行，不会真实调用防火墙、EDR、SOAR 等外部系统。
- 内置案例和部分界面文案可能存在中文乱码，后续需要统一修复编码。
- 分析流程当前为同步执行，点击分析后需要等待加载完成。
- 报告下载格式为 Markdown，不是 PDF 或 Word。
- 默认数据库为本地 SQLite，不适合多人并发生产环境。

## 16. 维护建议

出现无法启动或分析失败时，请优先收集以下信息：

- 操作系统版本。
- Python 版本：`python --version`。
- Node 版本：`node --version`。
- 后端启动日志。
- 前端启动日志。
- 浏览器控制台报错。
- 触发问题的告警内容或案例 ID。
