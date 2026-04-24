---
read_when:
    - 运行实时 model matrix / CLI 后端 / ACP / media-provider smoke 测试
    - 调试实时测试凭证解析
    - 添加新的 provider 专用实时测试
sidebarTitle: Live tests
summary: 实时（涉及网络）的测试：模型矩阵、CLI 后端、ACP、媒体提供商、凭证
title: 测试：实时套件
x-i18n:
    generated_at: "2026-04-24T04:03:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcc6f6518d8e5207460a6aabc137beb9e0df2c9b6ab3da1f39123416c708971e
    source_path: help/testing-live.md
    workflow: 15
---

如需了解快速开始、QA runner、单元/集成套件以及 Docker 流程，请参见
[Testing](/zh-CN/help/testing)。本页介绍**实时**（涉及网络）的测试
套件：model 矩阵、CLI 后端、ACP 和媒体 provider 实时测试，以及
凭证处理。

## 实时：Android 节点能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android 节点**当前公开的每个命令**，并断言命令 contract 行为。
- 范围：
  - 预设条件/手动设置（该套件不会安装/运行/配对应用）。
  - 对所选 Android 节点逐命令执行 Gateway 网关 `node.invoke` 验证。
- 所需预先设置：
  - Android 应用已连接并与 Gateway 网关配对。
  - 应用保持在前台。
  - 已为你期望通过的能力授予权限/采集同意。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android App](/zh-CN/platforms/android)

## 实时：model smoke（profile keys）

实时测试分为两层，以便我们隔离故障：

- “直接 model” 告诉我们 provider/model 在给定 key 下是否至少能响应。
- “Gateway smoke” 告诉我们该 model 的完整 gateway + agent 流水线是否正常工作（会话、历史、工具、沙箱策略等）。

### 第 1 层：直接 model completion（无 Gateway 网关）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举已发现的模型
  - 使用 `getApiKeyForModel` 选择你拥有凭证的模型
  - 为每个模型运行一个小型 completion（并在需要时运行定向回归）
- 启用方式：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，即 modern 的别名）才会真正运行此套件；否则它会跳过，以便让 `pnpm test:live` 聚焦于 gateway smoke
- 选择模型的方式：
  - `OPENCLAW_LIVE_MODELS=modern` 运行现代 allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是现代 allowlist 的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."`（逗号分隔的 allowlist）
  - modern/all 扫描默认带有精心挑选的高信号上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 可进行完整 modern 扫描，或设置为正数以使用更小上限。
- 选择 provider 的方式：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔的 allowlist）
- key 的来源：
  - 默认：profile 存储和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制**仅使用 profile 存储**
- 存在原因：
  - 将“provider API 已损坏 / key 无效”与“gateway agent 流水线已损坏”分离
  - 包含小型、隔离的回归项（示例：OpenAI Responses/Codex Responses 的 reasoning replay + tool-call 流程）

### 第 2 层：Gateway 网关 + dev agent smoke（即 “@openclaw” 实际执行的内容）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 Gateway 网关
  - 创建/修补一个 `agent:dev:*` 会话（每次运行覆盖 model）
  - 遍历带 key 的 models，并断言：
    - “有意义的”响应（无工具）
    - 真实工具调用有效（read 探针）
    - 可选的额外工具探针（exec+read 探针）
    - OpenAI 回归路径（仅 tool-call → 后续跟进）持续有效
- 探针详情（方便你快速解释故障）：
  - `read` 探针：测试会在工作区写入一个 nonce 文件，并要求 agent `read` 它并回显 nonce。
  - `exec+read` 探针：测试会要求 agent 通过 `exec` 将 nonce 写入临时文件，然后再 `read` 回来。
  - 图片探针：测试会附加一个生成的 PNG（猫 + 随机代码），并期望 model 返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 选择模型的方式：
  - 默认：现代 allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代 allowlist 的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）以缩小范围
  - modern/all Gateway 网关扫描默认带有精心挑选的高信号上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可进行完整 modern 扫描，或设置为正数以使用更小上限。
- 选择 provider 的方式（避免“OpenRouter 全都测”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔的 allowlist）
- 在此实时测试中，工具 + 图片探针始终启用：
  - `read` 探针 + `exec+read` 探针（工具压力测试）
  - 当 model 声明支持图片输入时，会运行图片探针
  - 流程（高层概览）：
    - 测试生成一个带有 “CAT” + 随机代码的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式 agent 将多模态用户消息转发给 model
    - 断言：回复包含 `cat` + 该代码（OCR 容错：允许轻微错误）

提示：要查看你的机器上可以测试哪些内容（以及确切的 `provider/model` id），请运行：

```bash
openclaw models list
openclaw models list --json
```

## 实时：CLI 后端 smoke（Claude、Codex、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：在不触碰默认配置的前提下，使用本地 CLI 后端验证 Gateway 网关 + agent 流水线。
- 后端专用的 smoke 默认值位于拥有该后端的扩展的 `cli-backend.ts` 定义中。
- 启用：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认 provider/model：`claude-cli/claude-sonnet-4-6`
  - command/args/image 行为来自拥有该 CLI 后端的 plugin 元数据。
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 发送真实图片附件（路径会注入到提示词中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 通过 CLI 参数传递图片文件路径，而不是注入到提示词中。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）控制在设置 `IMAGE_ARG` 时如何传递图片参数。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮消息并验证恢复流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` 禁用默认的 Claude Sonnet -> Opus 同会话连续性探针（当所选 model 支持切换目标时，设置为 `1` 可强制启用）。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-cli-backend
```

单 provider Docker 配方：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

说明：

- Docker runner 位于 `scripts/test-live-cli-backend-docker.sh`。
- 它会在仓库 Docker 镜像内，以非 root 的 `node` 用户运行实时 CLI 后端 smoke。
- 它会从拥有该后端的扩展解析 CLI smoke 元数据，然后将匹配的 Linux CLI 包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 指定的可写缓存前缀中（默认：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可移植的 Claude Code 订阅 OAuth，可通过 `~/.claude/.credentials.json` 中带有 `claudeAiOauth.subscriptionType` 的配置，或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN` 提供。它会先在 Docker 中验证直接 `claude -p`，然后在不保留 Anthropic API key 环境变量的情况下运行两个 Gateway 网关 CLI 后端轮次。该订阅通道默认禁用 Claude MCP/tool 和图片探针，因为 Claude 当前会将第三方应用使用路由到额外用量计费，而不是普通订阅计划限额。
- 实时 CLI 后端 smoke 现在会对 Claude、Codex 和 Gemini 执行相同的端到端流程：文本轮次、图片分类轮次，然后是通过 gateway CLI 验证的 MCP `cron` 工具调用。
- Claude 的默认 smoke 还会将会话从 Sonnet 修补为 Opus，并验证恢复后的会话仍记得之前的备注。

## 实时：ACP bind smoke（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用实时 ACP agent 验证真实的 ACP 会话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 就地绑定一个合成的 message-channel 对话
  - 在同一对话中发送普通后续消息
  - 验证该后续消息进入已绑定 ACP 会话转录
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - Docker 中的 ACP agents：`claude,codex,gemini`
  - 直接运行 `pnpm test:live ...` 时的 ACP agent：`claude`
  - 合成渠道：Slack 私信风格的对话上下文
  - ACP 后端：`acpx`
- 覆盖项：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.4`
- 说明：
  - 该通道使用 gateway `chat.send` 表面，并带有仅管理员可用的合成 originating-route 字段，因此测试可以附加 message-channel 上下文，而无需伪装成外部投递。
  - 当 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 未设置时，测试会使用嵌入式 `acpx` plugin 的内置 agent 注册表来处理所选 ACP harness agent。

示例：

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-acp-bind
```

单 agent Docker 配方：

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker 说明：

- Docker runner 位于 `scripts/test-live-acp-bind-docker.sh`。
- 默认情况下，它会按顺序对所有受支持的实时 CLI agents 运行 ACP bind smoke：`claude`、`codex`，然后 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 可以缩小矩阵范围。
- 它会读取 `~/.profile`，将匹配的 CLI 认证材料暂存到容器中，把 `acpx` 安装到可写 npm 前缀中，然后在缺失时安装所请求的实时 CLI（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）。
- 在 Docker 内，runner 会设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，以便 acpx 保留从 profile 读取到的 provider 环境变量，并传递给子 harness CLI。

## 实时：Codex app-server harness smoke

- 目标：通过正常的 Gateway 网关 `agent` 方法，验证由 plugin 所拥有的 Codex harness：
  - 加载内置的 `codex` plugin
  - 选择 `OPENCLAW_AGENT_RUNTIME=codex`
  - 向 `openai/gpt-5.4` 发送第一轮 Gateway 网关 agent 消息，并强制使用 Codex harness
  - 向同一个 OpenClaw 会话发送第二轮消息，并验证 app-server
    线程可以恢复
  - 通过相同的 Gateway 网关命令路径运行 `/codex status` 和 `/codex models`
  - 可选地运行两个经过 Guardian 审核的提权 shell 探针：一个应被批准的无害命令，以及一个应被拒绝的伪造密钥上传，以便让智能体回问
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认模型：`openai/gpt-5.4`
- 可选图片探针：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP/工具探针：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可选 Guardian 探针：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 该 smoke 会设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，因此损坏的 Codex
  harness 不能通过静默回退到 PI 来“通过”。
- 认证：Codex app-server 认证来自本地 Codex 订阅登录。Docker
  smoke 在适用时也可以为非 Codex 探针提供 `OPENAI_API_KEY`，并且可选复制 `~/.codex/auth.json` 和 `~/.codex/config.toml`。

本地配方：

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 配方：

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 说明：

- Docker runner 位于 `scripts/test-live-codex-harness-docker.sh`。
- 它会读取挂载的 `~/.profile`，传递 `OPENAI_API_KEY`，在存在时复制 Codex CLI
  认证文件，将 `@openai/codex` 安装到一个可写的挂载 npm
  前缀中，准备源代码树，然后仅运行 Codex-harness 实时测试。
- Docker 默认启用图片、MCP/工具以及 Guardian 探针。设置
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`，即可在你需要更窄范围调试运行时关闭它们。
- Docker 也会导出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，与实时
  测试配置一致，因此旧别名或 PI 回退不能掩盖 Codex harness
  回归。

### 推荐的实时配方

范围窄且显式的 allowlist 速度最快，也最不容易出现不稳定：

- 单模型，直接方式（无 Gateway 网关）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，Gateway 网关 smoke：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个 provider 的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 聚焦 Google（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

说明：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth 桥接（Cloud Code Assist 风格的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（独立的认证 + 工具行为差异）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API key / profile 认证）；这是大多数用户所说的“Gemini”。
  - CLI：OpenClaw 会 shell 调用本地 `gemini` 二进制文件；它有自己的认证方式，且行为可能不同（流式传输/工具支持/版本偏差）。

## 实时：model 矩阵（我们覆盖什么）

没有固定的“CI model 列表”（实时测试是选择启用的），但以下是建议在拥有 key 的开发机器上定期覆盖的**推荐**模型。

### 现代 smoke 集合（工具调用 + 图片）

这是我们期望持续保持可用的“常见模型”运行：

- OpenAI（非 Codex）：`openai/gpt-5.4`（可选：`openai/gpt-5.4-mini`）
- OpenAI Codex OAuth：`openai-codex/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

运行带工具 + 图片的 Gateway 网关 smoke：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个 provider 家族至少选一个：

- OpenAI：`openai/gpt-5.4`（或 `openai/gpt-5.4-mini`）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

可选的额外覆盖（有则更好）：

- xAI：`xai/grok-4`（或最新可用版本）
- Mistral：`mistral/`…（选择一个你已启用且支持工具的模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### 视觉：发送图片（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图片的模型（Claude/Gemini/OpenAI 支持视觉的变体等），以执行图片探针。

### 聚合器 / 替代 Gateway 网关

如果你启用了相应 key，我们也支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图片的候选项）
- OpenCode：`opencode/...` 用于 Zen，`opencode-go/...` 用于 Go（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 认证）

你还可以将更多 provider 纳入实时矩阵（前提是你有相应凭证/配置）：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云/API），以及任何兼容 OpenAI/Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档中硬编码“所有模型”。权威列表应以你的机器上 `discoverModels(...)` 的返回结果，以及当前可用的 key 为准。

## 凭证（切勿提交）

实时测试以与 CLI 相同的方式发现凭证。实际含义如下：

- 如果 CLI 能工作，实时测试应能找到相同的 key。
- 如果实时测试提示“无凭证”，请使用与你调试 `openclaw models list` / model 选择时相同的方式来调试。

- 每智能体 auth profile：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是实时测试中“profile keys”的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（存在时会复制到准备好的实时 home 中，但它不是主 profile-key 存储）
- 本地实时运行默认会将当前活动配置、每智能体 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 认证目录复制到临时测试 home；准备好的实时 home 会跳过 `workspace/` 和 `sandboxes/`，并去除 `agents.*.workspace` / `agentDir` 路径覆盖，以便探针不会进入你真实主机的工作区。

如果你想依赖环境变量 key（例如在 `~/.profile` 中导出的 key），请在执行本地测试前运行 `source ~/.profile`，或者使用下面的 Docker runner（它们可以将 `~/.profile` 挂载到容器中）。

## Deepgram 实时测试（音频转写）

- 测试：`extensions/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus 编码计划实时测试

- 测试：`extensions/byteplus/live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流媒体实时测试

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 覆盖内置 comfy 图片、视频和 `music_generate` 路径
  - 除非配置了 `models.providers.comfy.<capability>`，否则会跳过各项能力
  - 在更改 comfy 工作流提交、轮询、下载或 plugin 注册后非常有用

## 图片生成实时测试

- 测试：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图片生成 provider plugin
  - 在探测前从你的登录 shell（`~/.profile`）加载缺失的 provider 环境变量
  - 默认优先使用实时/环境变量 API key，而不是已存储的 auth profile，这样 `auth-profiles.json` 中过期的测试 key 就不会掩盖真实的 shell 凭证
  - 跳过没有可用 auth/profile/model 的 provider
  - 通过共享运行时能力运行标准图片生成变体：
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 当前覆盖的内置 provider：
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- 可选缩小范围：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile 存储认证，并忽略仅环境变量覆盖

## 音乐生成实时测试

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media music`
- 范围：
  - 覆盖共享的内置音乐生成 provider 路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前从你的登录 shell（`~/.profile`）加载 provider 环境变量
  - 默认优先使用实时/环境变量 API key，而不是已存储的 auth profile，这样 `auth-profiles.json` 中过期的测试 key 就不会掩盖真实的 shell 凭证
  - 跳过没有可用 auth/profile/model 的 provider
  - 在可用时运行两种声明的运行时模式：
    - `generate`，仅使用提示词输入
    - `edit`，当 provider 声明 `capabilities.edit.enabled` 时
  - 当前共享通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：使用独立的 Comfy 实时文件，而不是这个共享扫描
- 可选缩小范围：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile 存储认证，并忽略仅环境变量覆盖

## 视频生成实时测试

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media video`
- 范围：
  - 覆盖共享的内置视频生成 provider 路径
  - 默认使用对发布安全的 smoke 路径：非 FAL provider、每个 provider 一个文生视频请求、一秒钟龙虾提示词，以及来自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每 provider 操作上限（默认 `180000`）
  - 默认跳过 FAL，因为 provider 端的队列延迟可能主导发布时间；传入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可显式运行它
  - 在探测前从你的登录 shell（`~/.profile`）加载 provider 环境变量
  - 默认优先使用实时/环境变量 API key，而不是已存储的 auth profile，这样 `auth-profiles.json` 中过期的测试 key 就不会掩盖真实的 shell 凭证
  - 跳过没有可用 auth/profile/model 的 provider
  - 默认仅运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 还会在可用时运行已声明的 transform 模式：
    - `imageToVideo`：当 provider 声明 `capabilities.imageToVideo.enabled`，且所选 provider/model 在共享扫描中接受基于 buffer 的本地图片输入时
    - `videoToVideo`：当 provider 声明 `capabilities.videoToVideo.enabled`，且所选 provider/model 在共享扫描中接受基于 buffer 的本地视频输入时
  - 当前在共享扫描中已声明但被跳过的 `imageToVideo` provider：
    - `vydra`，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图片 URL
  - provider 专用的 Vydra 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件会运行 `veo3` 文生视频，以及一个默认使用远程图片 URL fixture 的 `kling` 通道
  - 当前 `videoToVideo` 实时覆盖：
    - 仅 `runway`，且所选模型为 `runway/gen4_aleph` 时
  - 当前在共享扫描中已声明但被跳过的 `videoToVideo` provider：
    - `alibaba`、`qwen`、`xai`，因为这些路径当前需要远程 `http(s)` / MP4 参考 URL
    - `google`，因为当前共享 Gemini/Veo 通道使用基于本地 buffer 的输入，而该路径在共享扫描中不被接受
    - `openai`，因为当前共享通道缺少对组织专用视频 inpaint/remix 访问的保证
- 可选缩小范围：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 以在默认扫描中包含所有 provider，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 以降低每个 provider 的操作上限，用于更激进的 smoke 运行
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile 存储认证，并忽略仅环境变量覆盖

## 媒体实时 harness

- 命令：`pnpm test:live:media`
- 目的：
  - 通过一个仓库原生入口运行共享的图片、音乐和视频实时套件
  - 自动从 `~/.profile` 加载缺失的 provider 环境变量
  - 默认自动将每个套件缩小到当前拥有可用认证的 provider
  - 复用 `scripts/test-live.mjs`，因此 heartbeat 和 quiet-mode 行为保持一致
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相关内容

- [Testing](/zh-CN/help/testing) — 单元、集成、QA 和 Docker 套件
