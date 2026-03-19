# AIGC 个性化提示实验系统

一个面向研究场景的全栈实验平台：模拟社交平台评论发布流程，在检测到不文明表达时触发 AIGC 干预，并记录用户最终决策与行为数据，支持开发者仪表盘分析。

## 核心能力

- 参与者流程：`Landing -> Intro -> Scenario -> Debrief`
- 不文明检测：关键词 + LLM 检测双通道
- AIGC 改写：对原评论生成可直接发布的文明改写版
- 决策记录：采纳建议 / 自行修改 / 执意原发 / 取消发布
- 仪表盘：查看统计、查看原始评论与最终提交评论、查看模型改写备份
- 分组策略：支持 5 类提示组并可按权重动态分配
- 管理安全：管理端点 Bearer Token 鉴权 + 接口限流

## 技术栈

- 前端：Vue 3 + Vite + Vue Router + Pinia + Axios + Tailwind CSS
- 后端：FastAPI + SQLAlchemy + SQLite
- LLM 调用：httpx（默认兼容 GLM-4 Chat Completions）

## 目录结构

```text
.
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── .env.example
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── router/
│   │   ├── store/
│   │   └── views/
│   └── package.json
└── README.md
```

## 环境要求

- Python 3.11+
- Node.js 18+
- npm 9+

## 本地启动

### 1) 后端

```powershell
cd backend
# 如使用内置 embed Python：
.\.python\py314embed\python.exe -m pip install -r requirements.txt
.\.python\py314embed\python.exe -m uvicorn app.main:app --reload --port 8001
```

### 2) 前端

```powershell
cd frontend
cmd /c npm install
$env:VITE_API_TARGET="http://127.0.0.1:8001"
cmd /c npm run dev
```

前端默认地址：`http://127.0.0.1:5173`

## 环境变量配置（backend/.env）

可参考 `backend/.env.example`。

关键项：

- `AIGC_API_URL`：LLM 接口地址（GLM-4 兼容地址）
- `AIGC_API_KEY`：LLM API Key
- `AIGC_MODEL`：模型名，如 `glm-4-flash`
- `USE_MOCK_LLM`：`true/false`，是否使用 Mock
- `SECRET_KEY`：应用密钥（强随机）
- `ADMIN_TOKEN`：管理端点令牌（强随机）
- `CORS_ORIGINS`：前端来源白名单

## 管理端安全

以下接口需要管理令牌（`Authorization: Bearer <ADMIN_TOKEN>`）：

- `GET /api/v1/experiment/dashboard`
- `GET /api/v1/experiment/allocation`
- `PUT /api/v1/experiment/allocation`

前端开发者仪表盘进入时会提示输入管理令牌，并存入 `sessionStorage`。

## 限流策略

- `POST /api/v1/experiment/init`：10 次 / 分钟
- `POST /api/v1/comment/check`：5 次 / 分钟

## 主要 API

- `POST /api/v1/experiment/init`：初始化实验并分配组别
- `POST /api/v1/comment/check`：检测评论并在必要时生成 AIGC 改写
- `POST /api/v1/comment/action`：提交最终行为
- `GET /api/v1/experiment/dashboard`：获取仪表盘统计和记录
- `GET /api/v1/experiment/allocation`：获取组别权重
- `PUT /api/v1/experiment/allocation`：更新组别权重

## 仪表盘数据说明

记录表中重点字段：

- `original_comment`：用户初始语句
- `generated_prompt`：模型生成的改写提示备份
- `final_submitted_comment`：最终提交语句（取消发布时为空）
- `final_action`：`post/modify/cancel`

## Docker（后端）

```powershell
cd backend
docker compose up --build
```

默认暴露：`http://127.0.0.1:8001`

## 常见问题

1. 仪表盘 401：
请确认输入的管理令牌与 `backend/.env` 的 `ADMIN_TOKEN` 一致，并重启后端。

2. 明明配置了 LLM 但显示降级：
检查 `AIGC_API_URL`、`AIGC_API_KEY`、`AIGC_MODEL`，以及网络可达性。

3. 提示“实验状态无效”：
同一个 `experiment_id` 的 `/check` 只能调用一次，流程应为 `init -> check -> action`。

## 提交前安全检查

- 不要提交 `backend/.env`
- 不要提交任何真实 API Key 或 Admin Token
- 保留 `backend/.env.example` 作为示例模板

## License

仅用于课程/科研实验用途。若需开源发布，建议补充正式许可证（如 MIT）。
