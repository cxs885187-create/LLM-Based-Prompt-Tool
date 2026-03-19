# AIGC 个性化提示实验系统（后端说明）

## 1. 仪表盘数据来源
前端开发者仪表盘页面 `frontend/src/views/Dashboard.vue` 的数据来源分两层。

1. 主数据源：后端接口 `GET /api/v1/experiment/dashboard`
   - 代码位置：`backend/app/api/v1/experiment.py`
   - 数据表：`experiment_records`（SQLAlchemy 模型 `ExperimentRecord`）
   - 字段来源：
     - `summary.total_records`：过滤条件下全部记录数
     - `summary.completed_records`：`status = completed` 的记录数
     - `summary.uncivil_triggered_records`：`prompt_type` 非空的记录数
     - `records`：最近 `limit` 条记录（倒序），包括 `experiment_id/group/scenario_id/prompt_type/original_comment/final_submitted_comment/final_action/status/created_at/updated_at`
     - `allocation`：当前提示类型分配权重和归一化比例

3. 提示类型比例配置接口
   - `GET /api/v1/experiment/allocation`：读取当前比例
   - `PUT /api/v1/experiment/allocation`：更新比例（例如 1:1:1:1:1）
   - 分配算法：按 `当前人数 / 权重` 做加权均摊随机分配，权重越大分到该组的概率越高。

2. 兜底数据源：前端本地日志（Pinia）
   - 代码位置：`frontend/src/store/experiment.js` 的 `fetchDashboard`
   - 当后端接口失败时，前端用本地 `logs` 生成简化仪表盘，并显示“已切换为本地日志数据”。

## 2. 在哪里填写 GLM-4 API
AI 调用在后端完成，不在前端填写。

1. 配置文件
   - 位置：`backend/.env`
   - 关键变量：
     - `AIGC_API_URL`：`https://open.bigmodel.cn/api/paas/v4/chat/completions`
     - `AIGC_API_KEY`：你的智谱 API Key
     - `AIGC_MODEL`：例如 `glm-4-flash` 或 `glm-4-plus`
     - `USE_MOCK_LLM`：是否启用 mock（`true/false`）
     - `ADMIN_TOKEN`：管理端点令牌（`/experiment/dashboard`、`/experiment/allocation` 需要 `Authorization: Bearer <token>`）

2. 读取配置
   - 代码位置：`backend/app/core/config.py`
   - 变量映射：`aigc_api_url`、`aigc_api_key`、`aigc_model`、`use_mock_llm`

3. 实际调用代码
   - 代码位置：`backend/app/services/llm_client.py`
   - `check_incivility(text)`：直接调用 GLM-4 对话接口，输出 JSON 判断不文明
   - `generate_prompt(template, original_text)`：调用 GLM-4 生成“可直接发布的文明改写版”

## 3. 从 mock 切换到真实 GLM-4
1. 修改 `backend/.env`
   - `USE_MOCK_LLM=false`
   - 填写 `AIGC_API_URL`、`AIGC_API_KEY`、`AIGC_MODEL`
2. 重启后端服务
3. 在前端完成一次 `/init -> /check -> /action` 流程验证

## 4. 本地启动（当前项目）
```powershell
# 终端 1：后端
cd "C:\Users\Cxs07\Desktop\大创1(project_root) - 副本(1)\大创1(project_root) - 副本\backend"
.\.python\py314embed\python.exe -m uvicorn app.main:app --reload --port 8001

# 终端 2：前端
cd "C:\Users\Cxs07\Desktop\大创1(project_root) - 副本(1)\大创1(project_root) - 副本\frontend"
$env:VITE_API_TARGET="http://127.0.0.1:8001"
cmd /c npm run dev
```

## 5. 安全提醒
请把真实 Key 和管理令牌放在 `backend/.env`，不要提交到 Git。`backend/.env.example` 只保留示例占位符。

## 6. 锁死与改写排查
1. 新增了接口防卡机制
   - LLM 调用短超时 + 重试 + 熔断（连续失败后暂时降级）
   - `/check` 改为“读会话/写会话分离”，避免等待 LLM 时长期占用数据库连接
   - SQLite 启用 WAL + busy timeout，减少 `database is locked`

2. 如何确认是否真的调用到大模型
   - `POST /comment/check` 响应新增 `prompt_source` 字段：
     - `llm`：本次润色由大模型返回
     - `fallback`：大模型失败或输出泛提示，已降级为本地改写
     - `mock`：当前是 mock 模式
   - 前端弹窗标题下也会显示“改写来源”。
