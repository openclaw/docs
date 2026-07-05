---
read_when:
    - 运行实时模型矩阵 / CLI 后端 / ACP / 媒体提供商冒烟测试
    - 调试 live-test 凭据解析
    - 添加新的提供商特定实时测试
sidebarTitle: Live tests
summary: 实时（涉及网络访问）测试：模型矩阵、CLI 后端、ACP、媒体提供商、凭证
title: 测试：实时套件
x-i18n:
    generated_at: "2026-07-05T11:24:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de398a9334b060c2f1e520487cbf945589fb39e57cc7804a27b8a19de96c47a4
    source_path: help/testing-live.md
    workflow: 16
---

如需快速开始、QA 运行器、单元/集成套件和 Docker 流程，请参见
[测试](/zh-CN/help/testing)。本页涵盖**实时**（触及网络的）测试：
模型矩阵、CLI 后端、ACP、媒体提供商和凭证处理。

## 实时：本地冒烟命令

在进行临时实时检查前，请在进程环境中导出所需的提供商密钥。

安全媒体冒烟测试：

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

安全语音通话就绪冒烟测试：

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

除非同时提供 `--yes`，否则 `voicecall smoke` 是一次空运行；仅在你确实打算拨打真实电话时使用 `--yes`。对于 Twilio、Telnyx 和 Plivo，成功的就绪检查需要一个公共 webhook URL - local loopback/私有 loopback URL 会被拒绝，因为这些提供商无法访问它们。

## 实时：Android 节点能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android 节点**当前公布的每个命令**，并断言命令契约行为。
- 范围：
  - 带前置条件的手动设置（该套件不会安装/运行/配对应用）。
  - 针对所选 Android 节点逐条命令执行 Gateway 网关 `node.invoke` 验证。
- 必需的预先设置：
  - Android 应用已连接并配对到 Gateway 网关。
  - 应用保持在前台。
  - 已为你预期通过的能力授予权限/采集同意。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android 应用](/zh-CN/platforms/android)

## 实时：模型冒烟测试（配置文件密钥）

实时模型测试分为两层，以便隔离故障：

- “直接模型”会告诉你提供商/模型能否用给定密钥正常回答。
- “Gateway 网关冒烟测试”会告诉你完整的 Gateway 网关+智能体流水线是否适用于该模型（会话、历史记录、工具、沙箱策略等）。

下面的精选模型列表位于 `src/agents/live-model-filter.ts`，并会随时间变化；请将那里的数组视为事实来源，而不是本页。

MiniMax M3 使用 `minimax/MiniMax-M3` 作为其默认提供商/模型引用。

### 第 1 层：直接模型补全（无 Gateway 网关）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举已发现的模型
  - 使用 `getApiKeyForModel` 选择你拥有凭证的模型
  - 对每个模型运行一次小型补全（并在需要时运行定向回归）
- 如何启用：
  - `pnpm test:live`（或在直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
  - 设置 `OPENCLAW_LIVE_MODELS=modern`、`small` 或 `all`（`modern` 的别名）才会实际运行此套件；否则它会跳过，因此单独运行 `pnpm test:live` 仍会聚焦于 Gateway 网关冒烟测试。
- 如何选择模型：
  - `OPENCLAW_LIVE_MODELS=modern` 运行精选的高信号优先级列表（参见[实时：模型矩阵](#live-model-matrix-what-we-cover)）
  - `OPENCLAW_LIVE_MODELS=small` 运行精选的小模型优先级列表
  - `OPENCLAW_LIVE_MODELS=all` 是 `modern` 的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."`（逗号分隔的允许列表）
  - 本地 Ollama 小模型运行默认使用 `http://127.0.0.1:11434`；仅在使用 LAN、自定义端点或 Ollama Cloud 端点时设置 `OPENCLAW_LIVE_OLLAMA_BASE_URL`。
  - modern/all 和 small 扫描默认以其精选列表长度作为上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 可对所选配置文件进行穷尽扫描，或设置正数作为更小的上限。
  - 穷尽扫描使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS` 作为整个直接模型测试的超时时间。默认值：60 分钟。
  - 直接模型探测默认以 20 路并行运行；设置 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 可覆盖。
- 如何选择提供商：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔的允许列表）
- 密钥来源：
  - 默认：配置文件存储和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制仅使用**配置文件存储**
- 为什么存在这一层：
  - 将“提供商 API 损坏/密钥无效”与“Gateway 网关智能体流水线损坏”分离
  - 包含小型、隔离的回归（示例：OpenAI Responses/Codex Responses 推理重放 + 工具调用流程）

### 第 2 层：Gateway 网关 + 开发智能体冒烟测试（“@openclaw” 实际执行的内容）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 Gateway 网关
  - 创建/修补一个 `agent:dev:*` 会话（每次运行覆盖模型）
  - 迭代带密钥的模型并断言：
    - “有意义”的响应（无工具）
    - 真实工具调用可用（读取探测）
    - 可选的额外工具探测（exec+read 探测）
    - OpenAI 回归路径（仅工具调用 -> 跟进）持续可用
- 探测详情（便于你快速解释故障）：
  - `read` 探测：测试在工作区写入一个 nonce 文件，并要求智能体 `read` 它，然后回显 nonce。
  - `exec+read` 探测：测试要求智能体用 `exec` 将 nonce 写入临时文件，然后 `read` 回来。
  - 图像探测：测试附加一张生成的 PNG（cat + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `test/helpers/live-image-probe.ts`。
- 如何启用：
  - `pnpm test:live`（或在直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
- 如何选择模型：
  - 默认：精选的高信号（`modern`）优先级列表
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` 通过完整 Gateway 网关+智能体流水线运行精选的小模型列表
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 `modern` 的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号分隔列表）以缩小范围
  - modern/all 和 small Gateway 网关扫描默认以其精选列表长度作为上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可对所选内容进行穷尽扫描，或设置正数作为更小的上限。
- 如何选择提供商（避免“OpenRouter 全量覆盖”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔的允许列表）
- 此实时测试始终启用工具 + 图像探测：
  - `read` 探测 + `exec+read` 探测（工具压力测试）
  - 当模型声明支持图像输入时运行图像探测
  - 流程（高层次）：
    - 测试生成一张包含 “CAT” + 随机代码的小型 PNG（`test/helpers/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式智能体将多模态用户消息转发给模型
    - 断言：回复包含 `cat` + 该代码（OCR 容差：允许少量错误）

<Tip>
要查看你的机器上可以测试什么（以及确切的 `provider/model` ID），请运行：

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## 实时：CLI 后端冒烟测试（Claude、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway 网关 + 智能体流水线，而不触及你的默认配置。
- 后端专用的冒烟测试默认值位于所属插件的 `cli-backend.ts` 定义中。
- 启用：
  - `pnpm test:live`（或在直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认提供商/模型：`claude-cli/claude-sonnet-4-6`
  - 命令/参数/图像行为来自所属 CLI 后端插件元数据。
- 覆盖（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 用于发送真实图像附件（路径会注入到提示词中）。在 Docker 配方中默认关闭。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 用于将图像文件路径作为 CLI 参数传递，而不是注入到提示词。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）用于在设置 `IMAGE_ARG` 时控制图像参数的传递方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 用于发送第二轮并验证恢复流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` 用于在所选模型支持切换目标时选择加入 Claude Sonnet -> Opus 同会话连续性探测。默认关闭，包括 Docker 配方。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` 用于选择加入 MCP/工具 loopback 探测。在 Docker 配方中默认关闭。

示例：

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

低成本 Gemini MCP 配置冒烟测试：

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

这不会要求 Gemini 生成响应。它会写入 OpenClaw 提供给 Gemini 的相同系统设置，然后运行 `gemini --debug mcp list`，以证明已保存的 `transport: "streamable-http"` 服务器会规范化为 Gemini 的 HTTP MCP 形态，并且可以连接到本地 streamable-HTTP MCP 服务器。

Docker 配方：

```bash
pnpm test:docker:live-cli-backend
```

单提供商 Docker 配方：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

说明：

- Docker 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它以非 root 的 `node` 用户在仓库 Docker 镜像内运行实时 CLI 后端冒烟测试。
- 它从所属插件解析 CLI 冒烟测试元数据，然后将匹配的 Linux CLI 包（`@anthropic-ai/claude-code` 或 `@google/gemini-cli`）安装到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 的缓存可写前缀中（默认：`~/.cache/openclaw/docker-cli-tools`）。
- `codex-cli` 不再是内置 CLI 后端；请改用带 Codex app-server runtime 的 `openai/*`（参见[实时：Codex app-server harness 冒烟测试](#live-codex-app-server-harness-smoke)）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要通过 `~/.claude/.credentials.json` 中的 `claudeAiOauth.subscriptionType` 或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN` 提供可移植 Claude Code 订阅 OAuth。它会先在 Docker 中证明直接 `claude -p` 可用，然后在不保留 Anthropic API 密钥环境变量的情况下运行两轮 Gateway 网关 CLI 后端。此订阅通道默认禁用 Claude MCP/工具和图像探测，因为它会消耗已登录订阅的使用额度，并且 Anthropic 可以在不发布 OpenClaw 版本的情况下更改 Claude Agent SDK / `claude -p` 的计费和速率限制行为。
- Claude 和 Gemini 通过上述标志支持相同的探测集（文本轮次、图像分类、MCP `cron` 工具调用、模型切换连续性），但这些探测默认都不会运行 - 请按需通过对应标志选择加入。

## 实时：APNs HTTP/2 代理可达性

- 测试：`src/infra/push-apns-http2.live.test.ts`
- 目标：通过本地 HTTP CONNECT 代理隧道连接到 Apple 的沙箱 APNs 端点，发送 APNs HTTP/2 验证请求，并断言 Apple 的真实 `403 InvalidProviderToken` 响应会通过代理路径返回。
- 启用：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 可选超时：
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## 实时：ACP 绑定冒烟测试（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用实时 ACP agent 验证真实的 ACP 对话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 就地绑定一个合成消息渠道对话
  - 在同一对话上发送普通后续消息
  - 验证后续消息落入已绑定的 ACP 会话转录中
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
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1`（或 `on`/`true`/`yes`）用于强制开启图像探测；任何其他值都会强制关闭。默认会对除 `opencode` 之外的每个 agent 运行。
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- 说明：
  - 此通道使用 Gateway 网关 `chat.send` 表面，并带有仅限管理员使用的合成 originating-route 字段，因此测试可以附加消息渠道上下文，而不伪装成对外投递。
  - 未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会使用嵌入式 `acpx` 插件的内置 agent 注册表来选择 ACP harness agent。
  - 绑定会话 cron MCP 创建默认是尽力而为，因为外部 ACP harness 可能会在绑定/图像证明已通过后取消 MCP 调用；设置 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` 可让绑定后的 cron 探测变为严格模式。

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
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-acp-bind-docker.sh`。
- 默认情况下，它会按顺序针对聚合实时 CLI agent 运行 ACP 绑定烟雾测试：`claude`、`codex`，然后是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` 来缩小矩阵范围。
- 它会将匹配的 CLI 凭证材料暂存到容器中，然后在缺失时安装请求的实时 CLI（`@anthropic-ai/claude-code`、`@openai/codex`、通过 `https://app.factory.ai/cli` 的 Factory Droid、`@google/gemini-cli` 或 `opencode-ai`）。ACP 后端本身是官方 `acpx` 插件中嵌入的 `acpx/runtime` 包。
- Droid Docker 变体会暂存 `~/.factory` 作为设置，转发 `FACTORY_API_KEY`，并且需要该 API key，因为本地 Factory OAuth/keyring 凭证无法移植到容器中。它使用 ACPX 内置的 `droid exec --output-format acp` 注册表条目。
- OpenCode Docker 变体是严格的单 agent 回归通道。它会从 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` 写入临时 `OPENCODE_CONFIG_CONTENT` 默认模型（默认值为 `opencode/kimi-k2.6`）。
- 直接 `acpx` CLI 调用仅是用于在 Gateway 网关之外比较行为的手动/变通路径。Docker ACP 绑定烟雾测试会运行 OpenClaw 的嵌入式 `acpx` runtime 后端。

## 实时：Codex app-server harness 烟雾测试

- 目标：通过常规 Gateway 网关
  `agent` 方法验证插件拥有的 Codex harness：
  - 加载内置 `codex` 插件
  - 选择 `openai/gpt-5.5`，它默认通过 Codex 路由 OpenAI agent 轮次
  - 在选择 Codex harness 的情况下，向 `openai/gpt-5.5` 发送第一个 Gateway 网关 agent 轮次
  - 向同一 OpenClaw 会话发送第二个轮次，并验证 app-server
    线程可以恢复
  - 通过同一 Gateway 网关命令
    路径运行 `/codex status` 和 `/codex models`
  - 可选运行两个经过 Guardian 审查的提升权限 shell 探测：一个应被批准的良性
    命令，以及一个应被拒绝的假密钥上传，这样 agent 会回问
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认模型：`openai/gpt-5.5`
- 可选图像探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP/工具探测：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可选 Guardian 探测：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 该烟雾测试会强制 provider/model `agentRuntime.id: "codex"`，因此损坏的 Codex
  harness 无法通过静默回退到 OpenClaw 而通过测试。
- 凭证：来自本地 Codex 订阅登录的 Codex app-server 凭证。适用时，Docker
  烟雾测试也可以为非 Codex 探测提供 `OPENAI_API_KEY`，
  以及可选复制的 `~/.codex/auth.json` 和 `~/.codex/config.toml`。

本地配方：

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-codex-harness
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-codex-harness-docker.sh`。
- 它会传入 `OPENAI_API_KEY`，在存在时复制 Codex CLI 凭证文件，将
  `@openai/codex` 安装到可写的已挂载 npm
  前缀中，暂存源码树，然后只运行 Codex-harness 实时测试。
- Docker 默认启用图像、MCP/工具和 Guardian 探测。当你需要更窄的调试
  运行时，设置
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 使用相同的显式 Codex runtime 配置，因此旧别名或 OpenClaw
  回退无法隐藏 Codex harness 回归。

### 推荐的实时配方

狭窄、显式的 allowlist 最快且最不易抖动：

- 单模型，直接运行（无 Gateway 网关）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 小模型直接配置档：
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- 小模型 Gateway 网关配置档：
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API 烟雾测试：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- 单模型，Gateway 网关烟雾测试：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 直接烟雾测试：
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google 重点测试（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 自适应思考烟雾测试（来自私有 QA CLI 的 `qa manual`，需要 `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` 和源码 checkout；参见 [QA overview](/zh-CN/concepts/qa-e2e-automation)）：
  - Gemini 3 动态默认值：`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 动态预算：`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

说明：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth 桥接（Cloud Code Assist 风格的 agent 端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（独立凭证 + 工具行为差异）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API key / profile 凭证）；这是大多数用户所说的 “Gemini”。
  - CLI：OpenClaw shell 到本地 `gemini` 二进制文件；它有自己的凭证，并且行为可能不同（流式传输/工具支持/版本偏差）。

## 实时：模型矩阵（覆盖范围）

实时测试是选择性启用的，因此没有固定的 “CI 模型列表”。`OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern`（以及它们的 `all` 别名）会运行来自 `src/agents/live-model-filter.ts` 中 `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` 的精选优先级列表，优先级顺序如下：

| 提供商/模型                                   | 说明       |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3-flash-preview`               | Gemini API |
| `moonshot/kimi-k2.7-code`                     |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.3`                                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

精选的**小模型**列表（`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`）来自 `SMALL_LIVE_MODEL_PRIORITY`：

| 提供商/模型                   |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

关于 modern 列表的说明：

- `codex` 和 `codex-cli` 提供商会从默认现代扫描中排除（它们覆盖 CLI 后端/ACP 行为，已在上方单独测试）。`openai/gpt-5.5` 本身默认通过 Codex app-server harness 路由；请参阅 [实时：Codex app-server harness 冒烟测试](#live-codex-app-server-harness-smoke)。
- `fireworks`、`google`、`openrouter` 和 `xai` 只会在现代扫描中运行其明确精选的模型 ID（不会自动扩展为“此提供商的每个模型”）。
- 在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型（Claude/Gemini/OpenAI 系列视觉变体等），以执行图像探测。

使用手动挑选的跨提供商集合运行带工具 + 图像的 Gateway 网关冒烟测试：

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

精选列表之外的可选额外覆盖（可选，选择一个你已启用且支持 “tools” 的模型）：

- Mistral：`mistral/...`
- Cerebras：`cerebras/...`（如果你有访问权限）
- LM Studio：`lmstudio/...`（本地；工具调用取决于 API 模式）

### 聚合器 / 替代 Gateway 网关

如果你已启用密钥，也可以通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图像的候选模型）
- OpenCode：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 认证）

你可以纳入 live 矩阵的更多提供商（如果你有凭据/配置）：

- 内置：`anthropic`、`cerebras`、`github-copilot`、`google`、`google-antigravity`、`google-gemini-cli`、`google-vertex`、`groq`、`mistral`、`openai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`zai`
- 通过 `models.providers`（自定义端点）：`minimax`（云/API），以及任何兼容 OpenAI/Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

<Tip>
不要在文档中硬编码“所有模型”。权威列表是你的机器上 `discoverModels(...)` 返回的内容，加上可用的密钥。
</Tip>

## 凭据（切勿提交）

live 测试会以与 CLI 相同的方式发现凭据。实际影响：

- 如果 CLI 可用，live 测试应能找到相同的密钥。
- 如果 live 测试提示 `no creds`，请按调试 `openclaw models list` / 模型选择的方式进行调试。

- 按 Agent 的认证配置文件：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是 live 测试中 “profile keys” 的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版 OAuth 目录：`~/.openclaw/credentials/`（存在时会复制到暂存的 live home 中，但不是主要的 profile-key 存储）
- 本地 live 运行会将活动配置（移除 `agents.*.workspace` / `agentDir` 覆盖项）和每个 Agent 的 `auth-profiles.json` 复制到临时测试 home 中，而不会复制该 Agent 目录的其余内容，因此 `workspace/` 和 `sandboxes/` 数据永远不会进入暂存 home；此外还会复制旧版 `credentials/` 目录以及受支持的外部 CLI 认证文件/目录（`.claude.json`、`.claude/.credentials.json`、`.claude/settings*.json`、`.claude/backups`、`.codex/auth.json`、`.codex/config.toml`、`.gemini`、`.minimax`）。

如果你想依赖环境变量密钥，请在本地测试前导出它们，或使用下面的 Docker runner 并显式设置 `OPENCLAW_PROFILE_FILE`。

## Deepgram live（音频转录）

- 测试：`extensions/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- 测试：`extensions/byteplus/live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 执行内置 comfy 图像、视频和 `music_generate` 路径
  - 除非已配置 `plugins.entries.comfy.config.<capability>`，否则跳过每项能力
  - 适用于更改 comfy 工作流提交、轮询、下载或插件注册之后

## 图像生成 live

- 测试：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图像生成提供商插件
  - 探测前使用已导出的提供商环境变量
  - 默认优先使用 live/env API 密钥，而不是已存储的认证配置文件，因此 `auth-profiles.json` 中的过期测试密钥不会遮蔽真实 shell 凭据
  - 跳过没有可用认证/配置文件/模型的提供商
  - 通过共享图像生成运行时运行每个已配置的提供商：
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
- 可选缩小范围：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于强制使用配置文件存储认证并忽略仅环境变量覆盖

对于已发布的 CLI 路径，在提供商/运行时 live 测试通过后添加一个 `infer` 冒烟测试：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

这会覆盖 CLI 参数解析、配置/默认 Agent 解析、内置插件激活、共享图像生成运行时，以及 live 提供商请求。插件依赖应在运行时加载前已存在。

## 音乐生成 live

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media music`
- 范围：
  - 执行共享的内置音乐生成提供商路径
  - 当前覆盖 `fal`、`google`、`minimax` 和 `openrouter`
  - 探测前使用已导出的提供商环境变量
  - 默认优先使用 live/env API 密钥，而不是已存储的认证配置文件，因此 `auth-profiles.json` 中的过期测试密钥不会遮蔽真实 shell 凭据
  - 跳过没有可用认证/配置文件/模型的提供商
  - 可用时运行两个已声明的运行时模式：
    - 使用仅提示词输入运行 `generate`
    - 当提供商声明 `capabilities.edit.enabled` 时运行 `edit`
  - `comfy` 有自己的独立 live 文件，不在此共享扫描中
- 可选缩小范围：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于强制使用配置文件存储认证并忽略仅环境变量覆盖

## 视频生成 live

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media video`
- 范围：
  - 跨 `alibaba`、`byteplus`、`deepinfra`、`fal`、`google`、`minimax`、`openai`、`openrouter`、`pixverse`、`qwen`、`runway`、`together`、`vydra`、`xai` 执行共享的内置视频生成提供商路径
  - 默认使用对发布安全的冒烟路径：每个提供商一个文本到视频请求、一秒钟龙虾提示词，以及来自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的按提供商操作上限（默认 `180000`）
  - 默认跳过 FAL，因为提供商侧队列延迟可能主导发布时间；传入 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`（或清空跳过列表）以显式运行它
  - 探测前使用已导出的提供商环境变量
  - 默认优先使用 live/env API 密钥，而不是已存储的认证配置文件，因此 `auth-profiles.json` 中的过期测试密钥不会遮蔽真实 shell 凭据
  - 跳过没有可用认证/配置文件/模型的提供商
  - 默认仅运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 可在可用时也运行已声明的转换模式：
    - 当提供商声明 `capabilities.imageToVideo.enabled`，且所选提供商/模型在共享扫描中接受基于 buffer 的本地图像输入时，运行 `imageToVideo`
    - 当提供商声明 `capabilities.videoToVideo.enabled`，且所选提供商/模型在共享扫描中接受基于 buffer 的本地视频输入时，运行 `videoToVideo`
  - 当前在共享扫描中已声明但跳过的 `imageToVideo` 提供商：
    - `vydra`（此 lane 不支持基于 buffer 的本地图像输入）
  - 提供商特定的 Vydra 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件运行 `veo3` 文本到视频，以及一个默认使用远程图像 URL fixture 的 `kling` 图像到视频 lane（使用 `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` 覆盖）。
  - 当前 `videoToVideo` live 覆盖：
    - 仅当所选模型解析为 `gen4_aleph` 时覆盖 `runway`
  - 当前在共享扫描中已声明但跳过的 `videoToVideo` 提供商：
    - `alibaba`、`google`、`openai`、`qwen`、`xai`，因为这些路径当前需要远程 `http(s)` 参考 URL，而不是基于 buffer 的本地输入
- 可选缩小范围：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 用于在默认扫描中包含每个提供商，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 用于缩短激进冒烟运行中每个提供商的操作上限
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于强制使用配置文件存储认证并忽略仅环境变量覆盖

## Media live harness

- 命令：`pnpm test:live:media`
- 入口点：`test/e2e/qa-lab/media/hosted-media-provider-live.ts`，它会按所选 suite 对每个 suite 运行 `pnpm test:live -- <suite-test-file>`，因此心跳和静默模式行为会与其他 `pnpm test:live` 运行保持一致。
- 目的：
  - 通过一个仓库原生入口点运行共享的图像、音乐和视频 live suite
  - 从 `~/.profile` 自动加载缺失的提供商环境变量
  - 默认将每个 suite 自动缩小到当前具有可用认证的提供商
- 标志：
  - `--providers <csv>` 全局提供商过滤器；`--image-providers` / `--music-providers` / `--video-providers` 将过滤器限定到一个 suite
  - `--all-providers` 跳过基于认证的自动过滤
  - `--allow-empty` 在过滤后没有可运行提供商时以 `0` 退出
  - `--quiet` / `--no-quiet` 透传给 `test:live`
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相关

- [测试](/zh-CN/help/testing) - 单元、集成、QA 和 Docker suite
