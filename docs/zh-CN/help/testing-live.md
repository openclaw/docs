---
read_when:
    - 运行实时模型矩阵 / CLI 后端 / ACP / 媒体提供商冒烟测试
    - 调试实时测试凭证解析
    - 添加新的提供商专用实时测试
sidebarTitle: Live tests
summary: 实时（触及网络的）测试：模型矩阵、CLI 后端、ACP、媒体提供商、凭证
title: 测试：实时套件
x-i18n:
    generated_at: "2026-05-06T02:29:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: a17a8065fd15c6d86ab782cb1fdb00d0b2558be2d43fb7cab3ca6e511055b82e
    source_path: help/testing-live.md
    workflow: 16
---

快速开始、QA runner、单元/集成套件和 Docker 流程请参见
[测试](/zh-CN/help/testing)。本页涵盖 **真实环境**（会触碰网络）的测试
套件：模型矩阵、CLI 后端、ACP 和媒体提供商真实环境测试，以及
凭证处理。

## 真实环境：本地配置文件冒烟命令

在临时真实环境检查前先 source `~/.profile`，让提供商密钥和本地工具
路径与你的 shell 保持一致：

```bash
source ~/.profile
```

安全的媒体冒烟测试：

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

安全的语音通话就绪冒烟测试：

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` 是一次空运行，除非同时提供 `--yes`。只有在你明确想发起一次真实通知通话时才使用 `--yes`。对于 Twilio、Telnyx 和 Plivo，成功的就绪检查需要一个公开的 webhook URL；仅本地 loopback/私有回退会按设计被拒绝。

## 真实环境：Android 节点能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android 节点**当前声明的每个命令**，并断言命令契约行为。
- 范围：
  - 有前置条件的手动设置（该套件不会安装/运行/配对应用）。
  - 针对所选 Android 节点逐命令进行 Gateway 网关 `node.invoke` 验证。
- 所需预先设置：
  - Android 应用已经连接并配对到 Gateway 网关。
  - 应用保持在前台。
  - 已为你期望通过的能力授予权限/采集同意。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android 完整设置详情：[Android 应用](/zh-CN/platforms/android)

## 真实环境：模型冒烟测试（配置文件密钥）

真实环境测试拆分为两层，以便隔离故障：

- “直接模型”告诉我们给定密钥下提供商/模型是否至少能作答。
- “Gateway 网关冒烟测试”告诉我们该模型的完整 gateway+agent 管线是否正常工作（会话、历史、工具、沙箱策略等）。

### 第 1 层：直接模型补全（无 Gateway 网关）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举发现的模型
  - 使用 `getApiKeyForModel` 选择你有凭证的模型
  - 对每个模型运行一次小型补全（并在需要时运行定向回归）
- 启用方式：
  - `pnpm test:live`（或在直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，它是 modern 的别名）才会实际运行此套件；否则它会跳过，以便让 `pnpm test:live` 聚焦 Gateway 网关冒烟测试
- 选择模型的方式：
  - `OPENCLAW_LIVE_MODELS=modern` 运行现代 allowlist（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_MODELS=all` 是现代 allowlist 的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."`（逗号分隔 allowlist）
  - Modern/all 扫描默认使用精选的高信号上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 可进行详尽现代扫描，或设置正数作为更小上限。
  - 详尽扫描使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS` 作为整个直接模型测试超时。默认值：60 分钟。
  - 直接模型探测默认以 20 路并行运行；设置 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 可覆盖。
- 选择提供商的方式：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔 allowlist）
- 密钥来源：
  - 默认：配置文件存储和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制**仅使用配置文件存储**
- 存在原因：
  - 将“提供商 API 损坏/密钥无效”与“Gateway 网关 agent 管线损坏”分离
  - 包含小型、隔离的回归（示例：OpenAI Responses/Codex Responses 推理重放 + tool-call 流程）

### 第 2 层：Gateway 网关 + 开发 agent 冒烟测试（“@openclaw” 实际执行的内容）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 Gateway 网关
  - 创建/修补一个 `agent:dev:*` 会话（每次运行覆盖模型）
  - 遍历有密钥的模型并断言：
    - “有意义”的响应（无工具）
    - 真实工具调用可工作（读取探测）
    - 可选的额外工具探测（exec+read 探测）
    - OpenAI 回归路径（仅 tool-call → 跟进）保持可用
- 探测详情（便于你快速解释故障）：
  - `read` 探测：测试在工作区写入一个 nonce 文件，并要求 agent `read` 它，然后回显 nonce。
  - `exec+read` 探测：测试要求 agent 使用 `exec` 将 nonce 写入临时文件，然后再 `read` 回来。
  - 图片探测：测试附加一张生成的 PNG（猫 + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（或在直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
- 选择模型的方式：
  - 默认：现代 allowlist（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代 allowlist 的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）来缩小范围
  - Modern/all Gateway 网关扫描默认使用精选的高信号上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可进行详尽现代扫描，或设置正数作为更小上限。
- 选择提供商的方式（避免“OpenRouter 的全部内容”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔 allowlist）
- 工具 + 图片探测在此真实环境测试中始终启用：
  - `read` 探测 + `exec+read` 探测（工具压力）
  - 当模型声明支持图片输入时运行图片探测
  - 流程（高层）：
    - 测试生成一张带有“CAT”+ 随机代码的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式 agent 将多模态用户消息转发给模型
    - 断言：回复包含 `cat` + 代码（OCR 容忍度：允许少量错误）

<Tip>
要查看你的机器上可以测试什么（以及精确的 `provider/model` ID），运行：

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## 真实环境：CLI 后端冒烟测试（Claude、Codex、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway 网关 + agent 管线，而不触碰你的默认配置。
- 后端特定的冒烟默认值位于拥有该后端的插件的 `cli-backend.ts` 定义中。
- 启用：
  - `pnpm test:live`（或在直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认提供商/模型：`claude-cli/claude-sonnet-4-6`
  - 命令/参数/图片行为来自拥有该 CLI 后端的插件元数据。
- 覆盖（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 发送真实图片附件（路径会注入到提示中）。Docker 配方默认关闭此项，除非明确请求。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 将图片文件路径作为 CLI 参数传入，而不是注入提示。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）在设置 `IMAGE_ARG` 时控制图片参数的传递方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮并验证恢复流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` 在所选模型支持切换目标时选择加入 Claude Sonnet -> Opus 同会话连续性探测。Docker 配方为聚合可靠性默认关闭此项。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` 选择加入 MCP/工具 loopback 探测。Docker 配方默认关闭此项，除非明确请求。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

低成本 Gemini MCP 配置冒烟测试：

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

这不会要求 Gemini 生成响应。它会写入 OpenClaw 提供给 Gemini 的相同系统
设置，然后运行 `gemini --debug mcp list`，以证明保存的 `transport: "streamable-http"` 服务器会规范化为 Gemini 的 HTTP MCP 形态，并且能连接到本地 streamable-HTTP MCP 服务器。

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

- Docker runner 位于 `scripts/test-live-cli-backend-docker.sh`。
- 它会在仓库 Docker 镜像内以非 root 的 `node` 用户运行真实环境 CLI 后端冒烟测试。
- 它从拥有该后端的插件解析 CLI 冒烟元数据，然后将匹配的 Linux CLI 包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 下的缓存可写前缀（默认值：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可移植 Claude Code 订阅 OAuth，可通过带有 `claudeAiOauth.subscriptionType` 的 `~/.claude/.credentials.json` 或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN` 提供。它先在 Docker 中证明直接 `claude -p` 可用，然后在不保留 Anthropic API-key 环境变量的情况下运行两轮 Gateway 网关 CLI 后端。此订阅 lane 默认禁用 Claude MCP/工具和图片探测，因为 Claude 当前会将第三方应用使用路由到额外用量计费，而不是普通订阅计划额度。
- 真实环境 CLI 后端冒烟测试现在会对 Claude、Codex 和 Gemini 执行相同的端到端流程：文本轮次、图片分类轮次，然后通过 Gateway 网关 CLI 验证 MCP `cron` 工具调用。
- Claude 的默认冒烟测试还会将会话从 Sonnet 修补为 Opus，并验证恢复后的会话仍记得较早的备注。

## 真实环境：APNs HTTP/2 代理可达性

- 测试：`src/infra/push-apns-http2.live.test.ts`
- 目标：通过本地 HTTP CONNECT 代理隧道连接到 Apple 的沙箱 APNs 端点，发送 APNs HTTP/2 验证请求，并断言 Apple 真实的 `403 InvalidProviderToken` 响应会经由代理路径返回。
- 启用：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 可选超时：
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## 真实环境：ACP 绑定冒烟测试（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用实时 ACP 智能体验证真实 ACP 对话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 原地绑定一个合成的消息渠道对话
  - 在同一对话上发送普通后续消息
  - 验证后续消息进入已绑定 ACP 会话转录
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - Docker 中的 ACP 智能体：`claude,codex,gemini`
  - 直接运行 `pnpm test:live ...` 时的 ACP 智能体：`claude`
  - 合成渠道：Slack 私信风格的对话上下文
  - ACP 后端：`acpx`
- 覆盖项：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- 说明：
  - 此测试通道使用 Gateway 网关 `chat.send` 表面，并带有仅限管理员的合成来源路由字段，因此测试可以附加消息渠道上下文，而不必假装向外部投递。
  - 未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会使用内嵌 `acpx` 插件的内置智能体注册表来选择 ACP harness 智能体。
  - 默认情况下，绑定会话的 cron MCP 创建是尽力而为，因为外部 ACP harness 可能会在绑定/图像证明通过后取消 MCP 调用；设置 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` 可让该绑定后 cron 探测变为严格模式。

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
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-acp-bind-docker.sh`。
- 默认情况下，它会按顺序针对聚合的实时 CLI 智能体运行 ACP 绑定冒烟测试：`claude`、`codex`，然后是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` 来收窄矩阵。
- 它会 source `~/.profile`，将匹配的 CLI 凭证材料暂存到容器中，然后在缺失时安装请求的实时 CLI（`@anthropic-ai/claude-code`、`@openai/codex`、通过 `https://app.factory.ai/cli` 安装的 Factory Droid、`@google/gemini-cli` 或 `opencode-ai`）。ACP 后端本身是官方 `acpx` 插件中的内嵌 `acpx/runtime` 包。
- Droid Docker 变体会暂存 `~/.factory` 用于设置，转发 `FACTORY_API_KEY`，并且要求该 API key，因为本地 Factory OAuth/keyring 凭证无法移植进容器。它使用 ACPX 的内置 `droid exec --output-format acp` 注册表条目。
- OpenCode Docker 变体是严格的单智能体回归测试通道。它会在 source `~/.profile` 后，从 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（默认 `opencode/kimi-k2.6`）写入临时 `OPENCODE_CONFIG_CONTENT` 默认模型，并且 `pnpm test:docker:live-acp-bind:opencode` 要求已绑定的助手转录，而不是接受通用的绑定后跳过。
- 直接调用 `acpx` CLI 只是在 Gateway 网关之外比较行为的手动/变通路径。Docker ACP 绑定冒烟测试会执行 OpenClaw 内嵌的 `acpx` 运行时后端。

## 实时：Codex app-server harness 冒烟测试

- 目标：通过常规 Gateway 网关
  `agent` 方法验证插件拥有的 Codex harness：
  - 加载内置 `codex` 插件
  - 选择 `OPENCLAW_AGENT_RUNTIME=codex`
  - 发送第一个 Gateway 网关智能体轮次到 `openai/gpt-5.5`，并强制使用 Codex harness
  - 向同一个 OpenClaw 会话发送第二个轮次，并验证 app-server
    线程可以恢复
  - 通过同一条 Gateway 网关命令
    路径运行 `/codex status` 和 `/codex models`
  - 可选运行两个经过 Guardian 审核的提权 shell 探测：一个应被批准的无害
    命令，以及一个应被拒绝、从而让智能体回问的假密钥上传
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认模型：`openai/gpt-5.5`
- 可选图像探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP/工具探测：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可选 Guardian 探测：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 冒烟测试使用 `agentRuntime.id: "codex"`，因此损坏的 Codex harness 不能
  通过静默回退到 PI 而通过测试。
- 凭证：来自本地 Codex 订阅登录的 Codex app-server 凭证。Docker
  冒烟测试也可以在适用时为非 Codex 探测提供 `OPENAI_API_KEY`，
  以及可选复制的 `~/.codex/auth.json` 和 `~/.codex/config.toml`。

本地配方：

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 配方：

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-codex-harness-docker.sh`。
- 它会 source 已挂载的 `~/.profile`，传递 `OPENAI_API_KEY`，在存在时复制 Codex CLI
  凭证文件，将 `@openai/codex` 安装到可写的已挂载 npm
  前缀中，暂存源代码树，然后仅运行 Codex harness 实时测试。
- Docker 默认启用图像、MCP/工具和 Guardian 探测。当你需要更窄的调试
  运行时，设置 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 使用相同的显式 Codex 运行时配置，因此旧版别名或 PI
  回退无法掩盖 Codex harness 回归。

### 推荐实时配方

窄范围、显式的 allowlist 速度最快，也最不容易波动：

- 单模型，直接运行（无 Gateway 网关）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，Gateway 网关冒烟测试：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 重点测试（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 自适应思考冒烟测试：
  - 如果本地密钥位于 shell profile 中：`source ~/.profile`
  - Gemini 3 动态默认值：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 动态预算：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

说明：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth 桥接（Cloud Code Assist 风格的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（单独的凭证和工具差异）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API key / profile 凭证）；这也是大多数用户说 “Gemini” 时的含义。
  - CLI：OpenClaw shell 到本地 `gemini` 二进制文件；它有自己的凭证，并且行为可能不同（流式传输/工具支持/版本偏差）。

## 实时：模型矩阵（覆盖范围）

没有固定的 “CI 模型列表”（实时测试是选择启用的），但以下是建议在带密钥的开发机器上定期覆盖的**推荐**模型。

### 现代冒烟集（工具调用 + 图像）

这是我们期望持续工作的“常用模型”运行：

- OpenAI（非 Codex）：`openai/gpt-5.5`
- OpenAI Codex OAuth：`openai-codex/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- DeepSeek：`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro`
- Z.AI（GLM）：`zai/glm-5.1`
- MiniMax：`minimax/MiniMax-M2.7`

使用工具 + 图像运行 Gateway 网关冒烟测试：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个提供商系列至少选择一个：

- OpenAI：`openai/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- DeepSeek：`deepseek/deepseek-v4-flash`
- Z.AI（GLM）：`zai/glm-5.1`
- MiniMax：`minimax/MiniMax-M2.7`

可选额外覆盖（有则更好）：

- xAI：`xai/grok-4.3`（或最新可用版本）
- Mistral：`mistral/`…（选择一个你已启用且支持 “tools” 的模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### 视觉：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中包含至少一个支持图像的模型（Claude/Gemini/OpenAI 支持视觉的变体等），以执行图像探测。

### 聚合器 / 替代 Gateway 网关

如果你已启用密钥，也支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具+图像的候选模型）
- OpenCode：`opencode/...` 用于 Zen，`opencode-go/...` 用于 Go（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 进行凭证验证）

可加入实时矩阵的更多提供商（如果你有凭证/配置）：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云/API），以及任何 OpenAI/Anthropic 兼容代理（LM Studio、vLLM、LiteLLM 等）

<Tip>
不要在文档中硬编码“所有模型”。权威列表是你的机器上 `discoverModels(...)` 返回的内容加上可用密钥。
</Tip>

## 凭证（切勿提交）

实时测试会以 CLI 相同的方式发现凭证。实际含义：

- 如果 CLI 可用，实时测试也应该能找到同样的密钥。
- 如果实时测试提示“无凭证”，就用调试 `openclaw models list` / 模型选择的同样方式调试。

- 每个智能体的凭证配置档案：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是实时测试中“profile keys”的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（存在时会复制到暂存的实时测试 home 中，但不是主要的 profile-key 存储）
- 本地实时运行默认会把当前配置、每个智能体的 `auth-profiles.json` 文件、旧版 `credentials/`，以及受支持的外部 CLI 凭证目录复制到临时测试 home；暂存的实时测试 home 会跳过 `workspace/` 和 `sandboxes/`，并移除 `agents.*.workspace` / `agentDir` 路径覆盖项，使探测不会触碰你真实主机上的工作区。

如果你想依赖环境变量密钥（例如在你的 `~/.profile` 中导出的密钥），请在执行 `source ~/.profile` 后运行本地测试，或使用下面的 Docker runner（它们可以把 `~/.profile` 挂载到容器中）。

## Deepgram 实测（音频转写）

- 测试：`extensions/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus 编码计划实测

- 测试：`extensions/byteplus/live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流媒体实测

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 覆盖内置的 comfy 图像、视频和 `music_generate` 路径
  - 除非已配置 `plugins.entries.comfy.config.<capability>`，否则跳过每项能力
  - 适用于更改 comfy 工作流提交、轮询、下载或插件注册之后

## 图像生成实测

- 测试：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图像生成提供商插件
  - 探测前从你的登录 shell（`~/.profile`）加载缺失的提供商环境变量
  - 默认优先使用实时/环境变量 API key，而不是已存储的凭证配置档案，因此 `auth-profiles.json` 中的陈旧测试密钥不会遮蔽真实的 shell 凭证
  - 跳过没有可用凭证/配置档案/模型的提供商
  - 让每个已配置的提供商通过共享图像生成运行时：
    - `<provider>:generate`
    - 当提供商声明支持编辑时运行 `<provider>:edit`
- 当前覆盖的内置提供商：
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- 可选收窄：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 可选凭证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用配置档案存储中的凭证，并忽略仅环境变量的覆盖项

对于随发布提供的 CLI 路径，请在提供商/运行时实测通过后追加一次 `infer` 冒烟测试：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

这会覆盖 CLI 参数解析、配置/默认智能体解析、内置插件激活、共享图像生成运行时，以及实时提供商请求。插件依赖项应在运行时加载前已存在。

## 音乐生成实测

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media music`
- 范围：
  - 覆盖共享的内置音乐生成提供商路径
  - 当前覆盖 Google 和 MiniMax
  - 探测前从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用实时/环境变量 API key，而不是已存储的凭证配置档案，因此 `auth-profiles.json` 中的陈旧测试密钥不会遮蔽真实的 shell 凭证
  - 跳过没有可用凭证/配置档案/模型的提供商
  - 可用时运行两种已声明的运行时模式：
    - 使用仅提示词输入的 `generate`
    - 当提供商声明 `capabilities.edit.enabled` 时运行 `edit`
  - 当前共享通道覆盖范围：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：单独的 Comfy 实测文件，不在这个共享扫描中
- 可选收窄：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 可选凭证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用配置档案存储中的凭证，并忽略仅环境变量的覆盖项

## 视频生成实测

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media video`
- 范围：
  - 覆盖共享的内置视频生成提供商路径
  - 默认使用发布安全的冒烟路径：非 FAL 提供商、每个提供商一次文本到视频请求、一秒钟龙虾提示词，以及来自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每提供商操作上限（默认 `180000`）
  - 默认跳过 FAL，因为提供商侧队列延迟可能主导发布时间；传入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可显式运行它
  - 探测前从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用实时/环境变量 API key，而不是已存储的凭证配置档案，因此 `auth-profiles.json` 中的陈旧测试密钥不会遮蔽真实的 shell 凭证
  - 跳过没有可用凭证/配置档案/模型的提供商
  - 默认只运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 后，也会在可用时运行已声明的转换模式：
    - 当提供商声明 `capabilities.imageToVideo.enabled`，且所选提供商/模型在共享扫描中接受基于 buffer 的本地图像输入时，运行 `imageToVideo`
    - 当提供商声明 `capabilities.videoToVideo.enabled`，且所选提供商/模型在共享扫描中接受基于 buffer 的本地视频输入时，运行 `videoToVideo`
  - 当前在共享扫描中已声明但跳过的 `imageToVideo` 提供商：
    - `vydra`，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图像 URL
  - Vydra 专属覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件会运行 `veo3` 文本到视频，并运行一个默认使用远程图像 URL fixture 的 `kling` 通道
  - 当前 `videoToVideo` 实时覆盖：
    - 仅当所选模型为 `runway/gen4_aleph` 时覆盖 `runway`
  - 当前在共享扫描中已声明但跳过的 `videoToVideo` 提供商：
    - `alibaba`、`qwen`、`xai`，因为这些路径当前需要远程 `http(s)` / MP4 参考 URL
    - `google`，因为当前共享 Gemini/Veo 通道使用基于本地 buffer 的输入，而该路径在共享扫描中不被接受
    - `openai`，因为当前共享通道缺少组织专属视频修补/混剪访问保证
- 可选收窄：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 将默认扫描中的每个提供商都纳入，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 为激进的冒烟运行降低每个提供商的操作上限
- 可选凭证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用配置档案存储中的凭证，并忽略仅环境变量的覆盖项

## 媒体实测 Harness

- 命令：`pnpm test:live:media`
- 目的：
  - 通过一个仓库原生入口点运行共享图像、音乐和视频实测套件
  - 从 `~/.profile` 自动加载缺失的提供商环境变量
  - 默认自动将每个套件收窄到当前拥有可用凭证的提供商
  - 复用 `scripts/test-live.mjs`，因此 Heartbeat 和静默模式行为保持一致
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相关

- [测试](/zh-CN/help/testing) - 单元、集成、QA 和 Docker 套件
