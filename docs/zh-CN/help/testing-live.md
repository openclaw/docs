---
read_when:
    - 运行实时模型矩阵 / CLI 后端 / ACP / 媒体提供商冒烟测试
    - 调试实时测试凭证解析
    - 添加新的提供商专用实时测试
sidebarTitle: Live tests
summary: 实时（涉及网络）的测试：模型矩阵、CLI 后端、ACP、媒体提供商、凭证
title: 测试：实时测试套件
x-i18n:
    generated_at: "2026-04-24T19:56:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a221bb784b38b3dfd97c32f862f761cc9a655f904826afc181822f463bc4f753
    source_path: help/testing-live.md
    workflow: 15
---

如需了解快速开始、QA 运行器、单元 / 集成测试套件以及 Docker 流程，请参阅
[测试](/zh-CN/help/testing)。本页介绍**实时**（涉及网络）的测试
套件：模型矩阵、CLI 后端、ACP 和媒体提供商实时测试，以及
凭证处理。

## 实时：Android 节点能力全面检查

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android 节点**当前公布的每一条命令**，并断言命令契约行为。
- 范围：
  - 需要预先完成 / 手动设置（该测试套件不会安装 / 运行 / 配对应用）。
  - 针对所选 Android 节点逐条执行 Gateway 网关 `node.invoke` 验证。
- 必需的预先设置：
  - Android 应用已连接并与 Gateway 网关配对。
  - 应用保持在前台。
  - 已授予你期望通过的能力所需的权限 / 捕获同意。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android App](/zh-CN/platforms/android)

## 实时：模型冒烟测试（配置档案键）

实时测试分为两层，这样我们可以隔离故障：

- “直接模型”告诉我们，给定键的情况下，提供商 / 模型本身是否至少可以响应。
- “Gateway 冒烟测试”告诉我们，该模型的完整 Gateway 网关 + 智能体流水线是否正常工作（会话、历史记录、工具、沙箱策略等）。

### 第 1 层：直接模型补全（不经过 Gateway 网关）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举已发现的模型
  - 使用 `getApiKeyForModel` 选择你已有凭证的模型
  - 对每个模型运行一次小型补全（并在需要时运行定向回归测试）
- 启用方式：
  - `pnpm test:live`（如果直接调用 Vitest，则使用 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，即 `modern` 的别名）才能真正运行此测试套件；否则它会跳过，以便让 `pnpm test:live` 聚焦于 Gateway 冒烟测试
- 选择模型的方法：
  - `OPENCLAW_LIVE_MODELS=modern` 运行现代允许列表（Opus / Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是现代允许列表的别名
  - 或使用 `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."`（逗号分隔的允许列表）
  - `modern` / `all` 全面检查默认采用经过精选的高信号上限；将 `OPENCLAW_LIVE_MAX_MODELS=0` 设为穷尽式现代全面检查，或设为正数以使用更小的上限。
  - 穷尽式全面检查对整个直接模型测试超时使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS`。默认值：60 分钟。
  - 直接模型探测默认使用 20 路并行；可通过 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 覆盖。
- 选择提供商的方法：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔的允许列表）
- 键的来源：
  - 默认：配置档案存储和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制**仅使用配置档案存储**
- 存在原因：
  - 将“提供商 API 已损坏 / 键无效”与“Gateway 网关智能体流水线已损坏”区分开来
  - 容纳小型、隔离的回归测试（例如：OpenAI Responses / Codex Responses 推理回放 + 工具调用流程）

### 第 2 层：Gateway 网关 + dev 智能体冒烟测试（也就是 “@openclaw” 实际做的事）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 Gateway 网关
  - 创建 / 修补一个 `agent:dev:*` 会话（每次运行可覆盖模型）
  - 遍历带键的模型并断言：
    - 有“有意义”的响应（不使用工具）
    - 一次真实工具调用可以正常工作（read 探测）
    - 可选额外工具探测（exec+read 探测）
    - OpenAI 回归路径（仅工具调用 → 后续跟进）持续正常
- 探测细节（这样你就能快速解释失败原因）：
  - `read` 探测：测试会在工作区写入一个随机 nonce 文件，并要求智能体 `read` 该文件并原样回显 nonce。
  - `exec+read` 探测：测试要求智能体通过 `exec` 将一个随机 nonce 写入临时文件，然后再 `read` 出来。
  - 图像探测：测试会附加一个生成的 PNG（猫 + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（如果直接调用 Vitest，则使用 `OPENCLAW_LIVE_TEST=1`）
- 选择模型的方法：
  - 默认：现代允许列表（Opus / Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代允许列表的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号分隔列表）来缩小范围
  - `modern` / `all` Gateway 网关全面检查默认采用经过精选的高信号上限；将 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 设为穷尽式现代全面检查，或设为正数以使用更小的上限。
- 选择提供商的方法（避免 “OpenRouter 所有模型都跑”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔的允许列表）
- 工具 + 图像探测在这个实时测试中始终开启：
  - `read` 探测 + `exec+read` 探测（工具压力测试）
  - 当模型声明支持图像输入时，会运行图像探测
  - 流程（高层说明）：
    - 测试生成一个带有 “CAT” + 随机代码的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式智能体向模型转发一条多模态用户消息
    - 断言：回复中包含 `cat` + 该代码（OCR 容错：允许轻微错误）

提示：若想查看你的机器上可以测试什么（以及精确的 `provider/model` id），请运行：

```bash
openclaw models list
openclaw models list --json
```

## 实时：CLI 后端冒烟测试（Claude、Codex、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway 网关 + 智能体流水线，而不触碰你的默认配置。
- 后端专用的默认冒烟设置位于所属插件的 `cli-backend.ts` 定义中。
- 启用：
  - `pnpm test:live`（如果直接调用 Vitest，则使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认提供商 / 模型：`claude-cli/claude-sonnet-4-6`
  - 命令 / 参数 / 图像行为来自所属 CLI 后端插件元数据。
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 用于发送真实图像附件（路径会注入到提示中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 用于通过 CLI 参数传递图像文件路径，而不是注入到提示中。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）用于控制在设置 `IMAGE_ARG` 时如何传递图像参数。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 用于发送第二轮并验证恢复流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` 用于禁用默认的 Claude Sonnet -> Opus 同会话连续性探测（当所选模型支持切换目标时，设为 `1` 可强制启用）。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-cli-backend
```

单提供商 Docker 配方：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

说明：

- Docker 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它会在仓库 Docker 镜像内，以非 root 的 `node` 用户身份运行实时 CLI 后端冒烟测试。
- 它会从所属插件解析 CLI 冒烟测试元数据，然后将匹配的 Linux CLI 软件包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到位于 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 的可写缓存前缀中（默认：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可移植的 Claude Code 订阅 OAuth，可通过 `~/.claude/.credentials.json` 中带有 `claudeAiOauth.subscriptionType` 的配置，或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN` 提供。它会先在 Docker 中验证直接 `claude -p`，然后在不保留 Anthropic API 键环境变量的情况下运行两轮 Gateway 网关 CLI 后端测试。这个订阅测试通道默认禁用 Claude MCP / 工具和图像探测，因为 Claude 目前会将第三方应用使用量计入额外用量计费，而不是普通订阅计划限额。
- 实时 CLI 后端冒烟测试现在会对 Claude、Codex 和 Gemini 执行相同的端到端流程：文本轮次、图像分类轮次，然后通过 Gateway 网关 CLI 验证 MCP `cron` 工具调用。
- Claude 的默认冒烟测试还会将会话从 Sonnet 修补为 Opus，并验证恢复后的会话仍记得之前的备注。

## 实时：ACP 绑定冒烟测试（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用实时 ACP 智能体验证真实 ACP 会话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 就地绑定一个合成的消息渠道会话
  - 在同一会话上发送正常的后续消息
  - 验证后续消息落入已绑定的 ACP 会话记录中
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - Docker 中的 ACP 智能体：`claude,codex,gemini`
  - 直接 `pnpm test:live ...` 使用的 ACP 智能体：`claude`
  - 合成渠道：Slack 私信风格的会话上下文
  - ACP 后端：`acpx`
- 覆盖项：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- 说明：
  - 这个测试通道使用 Gateway 网关 `chat.send` 接口，并带有仅管理员可用的合成 originating-route 字段，因此测试可以附加消息渠道上下文，而无需假装向外部投递。
  - 当未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会使用嵌入式 `acpx` 插件的内置智能体注册表来启动所选 ACP 测试智能体。

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

单智能体 Docker 配方：

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-acp-bind-docker.sh`。
- 默认情况下，它会按顺序对所有受支持的实时 CLI 智能体运行 ACP 绑定冒烟测试：`claude`、`codex`，然后 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 可缩小矩阵范围。
- 它会加载 `~/.profile`，将匹配的 CLI 认证材料暂存到容器中，把 `acpx` 安装到可写 npm 前缀中，然后在缺失时安装所请求的实时 CLI（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）。
- 在 Docker 内部，运行器会设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，这样 acpx 就能让从配置文件中加载的提供商环境变量继续提供给其子测试 CLI。

## 实时：Codex app-server 测试框架冒烟测试

- 目标：通过正常的 Gateway 网关
  `agent` 方法验证由插件拥有的 Codex 测试框架：
  - 加载内置的 `codex` 插件
  - 选择 `OPENCLAW_AGENT_RUNTIME=codex`
  - 在强制使用 Codex 测试框架的情况下，向 `openai/gpt-5.2` 发送第一轮 Gateway 网关智能体消息
  - 向同一个 OpenClaw 会话发送第二轮消息，并验证 app-server
    线程能够恢复
  - 通过同一条 Gateway 网关命令
    路径运行 `/codex status` 和 `/codex models`
  - 可选运行两个经过 Guardian 审核的提权 shell 探测：一个应当被批准的无害
    命令，以及一个应当被拒绝的伪造密钥上传，
    以便智能体回过头来询问
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认模型：`openai/gpt-5.2`
- 可选图像探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP / 工具探测：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可选 Guardian 探测：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 该冒烟测试会设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，这样一旦 Codex
  测试框架损坏，就不能通过悄悄回退到 PI 而蒙混过关。
- 认证：Codex app-server 认证来自本地 Codex 订阅登录。Docker
  冒烟测试在适用时也可以为非 Codex 探测提供 `OPENAI_API_KEY`，
  以及可选复制的 `~/.codex/auth.json` 和 `~/.codex/config.toml`。

本地配方：

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 配方：

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-codex-harness-docker.sh`。
- 它会加载已挂载的 `~/.profile`，传递 `OPENAI_API_KEY`，在存在时复制 Codex CLI
  认证文件，将 `@openai/codex` 安装到可写的已挂载 npm
  前缀中，暂存源代码树，然后只运行 Codex 测试框架实时测试。
- Docker 默认启用图像、MCP / 工具和 Guardian 探测。设置
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`，即可在你需要更窄的调试
  运行时关闭它们。
- Docker 还会导出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，与实时
  测试配置保持一致，这样旧别名或 PI 回退就无法掩盖 Codex 测试框架
  回归。

### 推荐的实时测试配方

范围更窄、显式的允许列表速度最快，也最不容易出问题：

- 单模型，直接测试（不经过 Gateway 网关）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，Gateway 网关冒烟测试：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 聚焦 Google（Gemini API 键 + Antigravity）：
  - Gemini（API 键）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

说明：

- `google/...` 使用 Gemini API（API 键）。
- `google-antigravity/...` 使用 Antigravity OAuth 桥接（Cloud Code Assist 风格的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（单独的认证 + 工具行为差异）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API 键 / 配置档案认证）；大多数用户提到 “Gemini” 时指的就是这个。
  - CLI：OpenClaw 调用本地 `gemini` 二进制；它有自己的认证，并且行为可能不同（流式传输 / 工具支持 / 版本偏差）。

## 实时：模型矩阵（我们覆盖哪些内容）

这里没有固定的“CI 模型列表”（实时测试是选择加入的），但以下是建议你在有键的开发机器上定期覆盖的**推荐**模型。

### 现代冒烟集（工具调用 + 图像）

这是我们期望持续可用的“常用模型”运行集：

- OpenAI（非 Codex）：`openai/gpt-5.2`
- OpenAI Codex OAuth：`openai-codex/gpt-5.2`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- DeepSeek：`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

使用工具 + 图像运行 Gateway 网关冒烟测试：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个提供商家族至少选一个：

- OpenAI：`openai/gpt-5.2`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- DeepSeek：`deepseek/deepseek-v4-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

可选的额外覆盖（有更好，没有也行）：

- xAI：`xai/grok-4`（或最新可用版本）
- Mistral：`mistral/`…（选择一个你已启用、具备 “tools” 能力的模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### 视觉：发送图像（附件 → 多模态消息）

至少在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中包含一个支持图像的模型（Claude / Gemini / OpenAI 的视觉变体等），以覆盖图像探测。

### 聚合器 / 替代 Gateway 网关

如果你启用了相关键，我们也支持通过以下方式进行测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图像的候选项）
- OpenCode：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 认证）

你还可以在实时矩阵中包含更多提供商（如果你有凭证 / 配置）：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云 / API），以及任何兼容 OpenAI / Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档里硬编码 “所有模型”。权威列表应当以你机器上 `discoverModels(...)` 的返回结果以及可用的键为准。

## 凭证（绝不要提交）

实时测试发现凭证的方式与 CLI 完全相同。实际影响如下：

- 如果 CLI 能用，实时测试通常也应能找到相同的键。
- 如果实时测试提示 “没有凭证”，请用调试 `openclaw models list` / 模型选择的同样方法来排查。

- 每个智能体的认证配置档案：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是实时测试中 “profile keys” 的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（存在时会被复制到暂存的实时 home 中，但它不是主配置档案键存储）
- 本地实时运行默认会把当前配置、每个智能体的 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 认证目录复制到临时测试 home 中；暂存的实时 home 会跳过 `workspace/` 和 `sandboxes/`，并移除 `agents.*.workspace` / `agentDir` 路径覆盖项，这样探测就不会落到你真实主机的工作区中。

如果你想依赖环境变量键（例如在你的 `~/.profile` 中导出），请在本地测试前运行 `source ~/.profile`，或者使用下面的 Docker 运行器（它们可以把 `~/.profile` 挂载到容器中）。

## Deepgram 实时测试（音频转录）

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
  - 覆盖内置 comfy 图像、视频和 `music_generate` 路径
  - 除非已配置 `models.providers.comfy.<capability>`，否则会跳过各项能力
  - 在修改 comfy 工作流提交、轮询、下载或插件注册之后特别有用

## 图像生成实时测试

- 测试：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- 测试框架：`pnpm test:live:media image`
- 范围：
  - 枚举每一个已注册的图像生成提供商插件
  - 在探测前从你的登录 shell（`~/.profile`）加载缺失的提供商环境变量
  - 默认优先使用实时 / 环境 API 键而不是已存储的认证配置档案，因此 `auth-profiles.json` 中过期的测试键不会掩盖真实的 shell 凭证
  - 跳过没有可用认证 / 配置档案 / 模型的提供商
  - 通过共享图像生成运行时运行每个已配置的提供商：
    - `<provider>:generate`
    - 当提供商声明支持编辑时运行 `<provider>:edit`
- 当前覆盖的内置提供商：
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 以强制使用配置档案存储认证并忽略仅环境变量覆盖

对于已发布的 CLI 路径，在提供商 / 运行时实时
测试通过后，再添加一个 `infer` 冒烟测试：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

这会覆盖 CLI 参数解析、配置 / 默认智能体解析、内置
插件激活、按需修复内置运行时依赖、共享
图像生成运行时，以及实时提供商请求。

## 音乐生成实时测试

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 测试框架：`pnpm test:live:media music`
- 范围：
  - 覆盖共享的内置音乐生成提供商路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用实时 / 环境 API 键而不是已存储的认证配置档案，因此 `auth-profiles.json` 中过期的测试键不会掩盖真实的 shell 凭证
  - 跳过没有可用认证 / 配置档案 / 模型的提供商
  - 在可用时运行两种已声明的运行时模式：
    - 使用仅提示词输入的 `generate`
    - 当提供商声明 `capabilities.edit.enabled` 时运行 `edit`
  - 当前共享测试通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：单独的 Comfy 实时文件，不在这个共享全面检查中
- 可选缩小范围：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 以强制使用配置档案存储认证并忽略仅环境变量覆盖

## 视频生成实时测试

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 测试框架：`pnpm test:live:media video`
- 范围：
  - 覆盖共享的内置视频生成提供商路径
  - 默认使用适合发布的冒烟路径：非 FAL 提供商、每个提供商一个文生视频请求、一秒龙虾提示词，以及来自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每提供商操作上限（默认 `180000`）
  - 默认跳过 FAL，因为提供商侧队列延迟可能主导发布时间；传入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可显式运行它
  - 在探测前从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用实时 / 环境 API 键而不是已存储的认证配置档案，因此 `auth-profiles.json` 中过期的测试键不会掩盖真实的 shell 凭证
  - 跳过没有可用认证 / 配置档案 / 模型的提供商
  - 默认只运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 后，在可用时也会运行已声明的转换模式：
    - 当提供商声明 `capabilities.imageToVideo.enabled`，且所选提供商 / 模型在共享全面检查中接受基于缓冲区的本地图像输入时，运行 `imageToVideo`
    - 当提供商声明 `capabilities.videoToVideo.enabled`，且所选提供商 / 模型在共享全面检查中接受基于缓冲区的本地视频输入时，运行 `videoToVideo`
  - 当前在共享全面检查中“已声明但跳过”的 `imageToVideo` 提供商：
    - `vydra`，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图像 URL
  - 提供商专用的 Vydra 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件会运行 `veo3` 文生视频，以及一个默认使用远程图像 URL 固定夹具的 `kling` 测试通道
  - 当前 `videoToVideo` 实时覆盖：
    - 仅 `runway`，且所选模型为 `runway/gen4_aleph` 时
  - 当前在共享全面检查中“已声明但跳过”的 `videoToVideo` 提供商：
    - `alibaba`、`qwen`、`xai`，因为这些路径当前需要远程 `http(s)` / MP4 参考 URL
    - `google`，因为当前共享的 Gemini / Veo 测试通道使用本地基于缓冲区的输入，而该路径在共享全面检查中不被接受
    - `openai`，因为当前共享测试通道缺少组织专用视频修补 / remix 访问保证
- 可选缩小范围：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 以在默认全面检查中包含所有提供商，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 以在激进的冒烟运行中降低每个提供商的操作上限
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 以强制使用配置档案存储认证并忽略仅环境变量覆盖

## 媒体实时测试框架

- 命令：`pnpm test:live:media`
- 用途：
  - 通过一个仓库原生入口点运行共享的图像、音乐和视频实时测试套件
  - 自动从 `~/.profile` 加载缺失的提供商环境变量
  - 默认自动将每个测试套件缩小到当前具有可用认证的提供商
  - 复用 `scripts/test-live.mjs`，因此心跳和静默模式行为保持一致
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相关内容

- [测试](/zh-CN/help/testing) — 单元、集成、QA 和 Docker 测试套件
