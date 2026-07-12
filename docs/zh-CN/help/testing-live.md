---
read_when:
    - 运行实时模型矩阵 / CLI 后端 / ACP / 媒体提供商冒烟测试
    - 调试实时测试凭据解析
    - 添加新的提供商专属实时测试
sidebarTitle: Live tests
summary: 实时（涉及网络访问）测试：模型矩阵、CLI 后端、ACP、媒体提供商、凭据
title: 测试：实时测试套件
x-i18n:
    generated_at: "2026-07-12T14:30:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

有关快速开始、QA 运行器、单元/集成测试套件和 Docker 流程，请参阅
[测试](/zh-CN/help/testing)。本页介绍**实时**（会访问网络的）测试：
模型矩阵、CLI 后端、ACP、媒体提供商和凭据处理。

## 实时：本地冒烟测试命令

在进行临时实时检查前，请在进程环境中导出所需的提供商密钥。

安全的媒体冒烟测试：

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw 实时冒烟测试。" \
  --output /tmp/openclaw-live-smoke.mp3
```

安全的语音通话就绪性冒烟测试：

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

除非同时指定 `--yes`，否则 `voicecall smoke` 仅进行试运行；只有在
确实打算拨打真实电话时才使用 `--yes`。对于 Twilio、Telnyx 和 Plivo，
成功完成就绪性检查需要一个公共 webhook URL——系统会拒绝本地/私有
回环 URL，因为这些提供商无法访问它们。

## 实时：Android 节点能力全面检查

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android 节点**当前公布的每条命令**，并断言命令契约行为。
- 范围：
  - 需要预先完成条件准备/手动设置（该测试套件不会安装、运行或配对应用）。
  - 针对所选 Android 节点逐条命令验证 Gateway 网关 `node.invoke`。
- 必需的预先设置：
  - Android 应用已连接并配对到 Gateway 网关。
  - 应用保持在前台。
  - 已为预期通过的能力授予权限/捕获同意。
- 可选目标覆盖项：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android 应用](/zh-CN/platforms/android)

## 实时：模型冒烟测试（配置文件密钥）

实时模型测试分为两层，以便隔离故障：

- “直接模型”用于确认提供商/模型是否能使用给定密钥正常回答。
- “Gateway 网关冒烟测试”用于确认该模型的完整 Gateway 网关 + 智能体管线是否正常工作（会话、历史记录、工具、沙箱策略等）。

以下精选模型列表位于 `src/agents/live-model-filter.ts` 中，并且会随时间
变化；请以其中的数组为准，而不是以本页为准。

MiniMax M3 使用 `minimax/MiniMax-M3` 作为其默认提供商/模型引用。

### 第 1 层：直接完成模型请求（无 Gateway 网关）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举发现的模型
  - 使用 `getApiKeyForModel` 选择你拥有凭据的模型
  - 对每个模型运行一个小型完成请求（并在需要时运行针对性回归测试）
- 启用方式：
  - `pnpm test:live`（如果直接调用 Vitest，也可使用 `OPENCLAW_LIVE_TEST=1`）
  - 设置 `OPENCLAW_LIVE_MODELS=modern`、`small` 或 `all`（`modern` 的别名）才会实际运行此测试套件；否则会跳过，因此仅运行 `pnpm test:live` 时仍会专注于 Gateway 网关冒烟测试。
- 选择模型的方式：
  - `OPENCLAW_LIVE_MODELS=modern` 运行精选的高信号优先级列表（请参阅[实时：模型矩阵](#live-model-matrix-what-we-cover)）
  - `OPENCLAW_LIVE_MODELS=small` 运行精选的小模型优先级列表
  - `OPENCLAW_LIVE_MODELS=all` 是 `modern` 的别名
  - 或使用 `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."`（逗号分隔的允许列表）
  - 本地 Ollama 小模型运行默认使用 `http://127.0.0.1:11434`；仅对局域网、自定义或 Ollama Cloud 端点设置 `OPENCLAW_LIVE_OLLAMA_BASE_URL`。
  - Modern/all 和 small 全面检查默认以各自精选列表的长度为上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 可对所选配置文件进行穷举式全面检查，或设置正数以使用更小的上限。
  - 穷举式全面检查使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS` 作为整个直接模型测试的超时时间。默认值：60 分钟。
  - 直接模型探测默认使用 20 路并行；可设置 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 覆盖此值。
- 选择提供商的方式：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔的允许列表）
- 密钥来源：
  - 默认：配置文件存储和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制**仅使用配置文件存储**
- 存在原因：
  - 将“提供商 API 已损坏/密钥无效”和“Gateway 网关智能体管线已损坏”区分开来
  - 包含小型、隔离的回归测试（例如：OpenAI Responses/Codex Responses 推理重放 + 工具调用流程）

### 第 2 层：Gateway 网关 + 开发智能体冒烟测试（“@openclaw”的实际行为）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动进程内 Gateway 网关
  - 创建/修补一个 `agent:dev:*` 会话（每次运行覆盖模型）
  - 遍历拥有密钥的模型并断言：
    - “有意义的”响应（不使用工具）
    - 真实工具调用正常工作（读取探测）
    - 可选的额外工具探测（执行 + 读取探测）
    - OpenAI 回归路径（仅工具调用 -> 后续响应）持续正常工作
- 探测详情（便于你快速解释故障）：
  - `read` 探测：测试在工作区写入一个 nonce 文件，并要求智能体用 `read` 读取该文件并回显 nonce。
  - `exec+read` 探测：测试要求智能体用 `exec` 将 nonce 写入临时文件，然后用 `read` 读回。
  - 图像探测：测试附加一张生成的 PNG（猫 + 随机代码），并要求模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `test/helpers/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（如果直接调用 Vitest，也可使用 `OPENCLAW_LIVE_TEST=1`）
- 选择模型的方式：
  - 默认：精选的高信号（`modern`）优先级列表
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` 通过完整 Gateway 网关 + 智能体管线运行精选的小模型列表
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 `modern` 的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号分隔的列表）以缩小范围
  - Modern/all 和 small Gateway 网关全面检查默认以各自精选列表的长度为上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可对所选项进行穷举式全面检查，或设置正数以使用更小的上限。
- 选择提供商的方式（避免“所有内容都走 OpenRouter”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔的允许列表）
- 此实时测试始终启用工具 + 图像探测：
  - `read` 探测 + `exec+read` 探测（工具压力测试）
  - 模型声明支持图像输入时运行图像探测
  - 流程（高层级）：
    - 测试生成一张包含“CAT”+ 随机代码的小型 PNG（`test/helpers/live-image-probe.ts`）
    - 通过 `agent` 的 `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式智能体将多模态用户消息转发给模型
    - 断言：回复包含 `cat` + 该代码（OCR 容错：允许少量错误）

<Tip>
要查看你的机器上可以测试哪些内容（以及确切的 `provider/model` ID），请运行：

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## 实时：CLI 后端冒烟测试（Claude、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway 网关 + 智能体管线，而不修改你的默认配置。
- 后端专用的冒烟测试默认值与所属插件的 `cli-backend.ts` 定义放在一起。
- 启用：
  - `pnpm test:live`（如果直接调用 Vitest，也可使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认提供商/模型：`claude-cli/claude-sonnet-4-6`
  - 命令/参数/图像行为来自所属 CLI 后端插件的元数据。
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`，用于发送真实图像附件（路径会注入提示词）。在 Docker 流程中默认关闭。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`，用于将图像文件路径作为 CLI 参数传递，而不是注入提示词。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`），用于在设置 `IMAGE_ARG` 时控制图像参数的传递方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`，用于发送第二轮消息并验证恢复流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`，用于在所选模型支持切换目标时选择启用 Claude Sonnet -> Opus 同一会话连续性探测。默认关闭，包括 Docker 流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`，用于选择启用 MCP/工具回环探测。在 Docker 流程中默认关闭。

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

此测试不会要求 Gemini 生成响应。它会写入 OpenClaw 提供给 Gemini 的相同系统
设置，然后运行 `gemini --debug mcp list`，以证明已保存的
`transport: "streamable-http"` 服务器会规范化为 Gemini 的 HTTP MCP
形态，并且可以连接到本地可流式传输的 HTTP MCP 服务器。

Docker 流程：

```bash
pnpm test:docker:live-cli-backend
```

单提供商 Docker 流程：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

说明：

- Docker 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它在仓库 Docker 镜像中以非 root 的 `node` 用户身份运行实时 CLI 后端冒烟测试。
- 它从所属插件解析 CLI 冒烟测试元数据，然后将匹配的 Linux CLI 软件包（`@anthropic-ai/claude-code` 或 `@google/gemini-cli`）安装到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 指定的已缓存可写前缀中（默认值：`~/.cache/openclaw/docker-cli-tools`）。
- `codex-cli` 不再是内置 CLI 后端；请改用 `openai/*` 和 Codex 应用服务器运行时（请参阅[实时：Codex 应用服务器装具冒烟测试](#live-codex-app-server-harness-smoke)）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 要求通过以下任一方式提供可移植的 Claude Code 订阅 OAuth：使用包含 `claudeAiOauth.subscriptionType` 的 `~/.claude/.credentials.json`，或使用来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN`。它会先验证 Docker 中直接运行 `claude -p`，然后在不保留 Anthropic API 密钥环境变量的情况下运行两轮 Gateway 网关 CLI 后端消息。此订阅测试通道默认禁用 Claude MCP/工具和图像探测，因为它会消耗已登录订阅的使用限额，而且 Anthropic 可能在 OpenClaw 未发布新版本的情况下更改 Claude Agent SDK / `claude -p` 的计费和速率限制行为。
- Claude 和 Gemini 通过上述标志支持相同的探测集合（文本轮次、图像分类、MCP `cron` 工具调用、模型切换连续性），但这些探测默认均不运行——请根据需要通过相应标志选择启用。

## 实时：APNs HTTP/2 代理可达性

- 测试：`src/infra/push-apns-http2.live.test.ts`
- 目标：通过本地 HTTP CONNECT 代理建立隧道，连接 Apple 的沙箱 APNs 端点，发送 APNs HTTP/2 验证请求，并断言 Apple 的真实 `403 InvalidProviderToken` 响应通过代理路径返回。
- 启用：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 可选超时时间：
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## 实时：ACP 绑定冒烟测试（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用实时 ACP 智能体验证真实的 ACP 对话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 原地绑定一个合成的消息渠道对话
  - 在同一对话中发送一条普通的后续消息
  - 验证后续消息已进入绑定的 ACP 会话转录记录
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - Docker 中的 ACP 智能体：`claude,codex,gemini`
  - 直接运行 `pnpm test:live ...` 时使用的 ACP 智能体：`claude`
  - 合成渠道：Slack 私信式对话上下文
  - ACP 后端：`acpx`
- 覆盖项：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1`（或 `on`/`true`/`yes`）强制开启图像探测；任何其他值都会强制关闭。除 `opencode` 外，默认会为每个智能体运行。
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- 注意：
  - 此通道使用 Gateway 网关的 `chat.send` 接口及仅限管理员的合成来源路由字段，让测试无需伪装向外部投递即可附加消息渠道上下文。
  - 未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会针对所选 ACP harness 智能体使用内嵌 `acpx` 插件的内置智能体注册表。
  - 默认情况下，创建绑定会话的 cron MCP 会尽力而为，因为外部 ACP harness 可能在绑定/图像验证通过后取消 MCP 调用；设置 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` 可严格执行该绑定后 cron 探测。

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

Docker 注意事项：

- Docker 运行器位于 `scripts/test-live-acp-bind-docker.sh`。
- 默认情况下，它会依次使用汇总的实时 CLI 智能体运行 ACP 绑定冒烟测试：`claude`、`codex`，然后是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` 缩小矩阵范围。
- 它会将匹配的 CLI 身份验证材料暂存到容器中，然后在缺失时安装所请求的实时 CLI（`@anthropic-ai/claude-code`、`@openai/codex`、通过 `https://app.factory.ai/cli` 安装的 Factory Droid、`@google/gemini-cli` 或 `opencode-ai`）。ACP 后端本身是官方 `acpx` 插件内嵌的 `acpx/runtime` 包。
- Droid Docker 变体会暂存 `~/.factory` 中的设置，转发 `FACTORY_API_KEY`，并要求提供该 API key，因为本地 Factory OAuth/钥匙串身份验证无法移植到容器中。它使用 ACPX 内置的 `droid exec --output-format acp` 注册表条目。
- OpenCode Docker 变体是严格的单智能体回归通道。它会根据 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（默认值为 `opencode/kimi-k2.6`）写入临时的 `OPENCODE_CONFIG_CONTENT` 默认模型。
- 直接调用 `acpx` CLI 仅作为在 Gateway 网关之外比较行为的手动/变通路径。Docker ACP 绑定冒烟测试会执行 OpenClaw 内嵌的 `acpx` 运行时后端。

## 实时：Codex app-server harness 冒烟测试

- 目标：通过正常的 Gateway 网关 `agent` 方法验证插件拥有的 Codex harness：
  - 加载内置 `codex` 插件
  - 通过 `/model <ref> --runtime codex` 选择 OpenAI 模型
  - 以请求的思考级别发送第一个 Gateway 网关智能体轮次
  - 向同一 OpenClaw 会话发送第二个轮次，并验证 app-server 线程可以恢复
  - 通过同一 Gateway 网关命令路径运行 `/codex status` 和 `/codex models`
  - 可选运行两个经 Guardian 审查、提升权限的 shell 探测：一个应获批准的无害命令，以及一个应被拒绝的虚假密钥上传，以便智能体反向询问
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- Harness 基线模型：`openai/gpt-5.6-luna`
- 全新 OpenAI API key 选择默认值：`openai/gpt-5.6`
- 默认思考级别：`low`
- 模型覆盖：`OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- 思考级别覆盖：`OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- 矩阵覆盖：`OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- 身份验证模式：`OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth`（默认）使用复制的 Codex 登录信息；`api-key` 通过 Codex app-server 使用 `OPENAI_API_KEY`。
- 可选图像探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP/工具探测：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可选 Guardian 探测：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 此冒烟测试会强制设置提供商/模型的 `agentRuntime.id: "codex"`，因此损坏的 Codex harness 无法通过静默回退到 OpenClaw 而通过测试。
- 身份验证：使用本地 Codex 订阅登录的 Codex app-server 身份验证，或在 `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key` 时使用 `OPENAI_API_KEY`。Docker 可以复制 `~/.codex/auth.json` 和 `~/.codex/config.toml` 以用于订阅运行。

本地配方：

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-codex-harness
```

GPT-5.6 原生 Codex 矩阵：

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

全新 OpenAI API key 默认值：

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

此验证不设置 `OPENCLAW_LIVE_GATEWAY_MODELS`，通过全新的新手引导推理选择接缝解析模型，断言结果为 `openai/gpt-5.6`，然后使用该解析后的模型运行一个真实的 Gateway 网关轮次。

GPT-5.6 内嵌 OpenClaw 矩阵：

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Docker 注意事项：

- Docker 运行器位于 `scripts/test-live-codex-harness-docker.sh`。
- 它会传递 `OPENAI_API_KEY`，在存在时复制 Codex CLI 身份验证文件，将 `@openai/codex` 安装到可写的已挂载 npm 前缀中，暂存源代码树，然后仅运行 Codex harness 实时测试。
- Docker 默认启用图像、MCP/工具和 Guardian 探测。当你需要范围更窄的调试运行时，请设置 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`、`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或 `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 使用相同的显式 Codex 运行时配置，因此旧版别名或 OpenClaw 回退无法掩盖 Codex harness 回归。
- 矩阵目标会在一个容器中依次运行。Docker 脚本会根据目标数量调整其默认的 35 分钟超时时间；任何外层 shell 或 CI 超时都必须允许相同的总时长。规范 CI 会将每个 GPT-5.6 目标保留在单独的分片中。

### 推荐的实时配方

范围窄且明确的允许列表速度最快、最不易出现不稳定问题：

- 单模型，直接运行（无 Gateway 网关）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- 小模型直接配置：
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- 小模型 Gateway 网关配置：
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API 冒烟测试：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- 单模型，Gateway 网关冒烟测试：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 直接冒烟测试：
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google 专项（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 自适应思考冒烟测试（来自私有 QA CLI 的 `qa manual`——需要 `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` 和源代码检出；请参阅 [QA overview](/zh-CN/concepts/qa-e2e-automation)）：
  - Gemini 3 动态默认值：`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 动态预算：`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注意：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth 桥接器（Cloud Code Assist 风格的智能体端点）。
- `google-gemini-cli/...` 使用你计算机上的本地 Gemini CLI（具有独立的身份验证和工具特性）。
- Gemini API 与 Gemini CLI 的区别：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API key/配置文件身份验证）；大多数用户所说的“Gemini”即指此方式。
  - CLI：OpenClaw 通过 shell 调用本地 `gemini` 二进制文件；它有自己的身份验证，并且可能表现不同（流式传输/工具支持/版本偏差）。

## 实时：模型矩阵（覆盖范围）

实时测试需选择启用，因此不存在固定的“CI 模型列表”。`OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern`（以及它们的 `all` 别名）会按照以下优先顺序运行 `src/agents/live-model-filter.ts` 中 `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` 定义的精选优先列表：

| 提供商/模型                                   | 说明       |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
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
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

精选的**小模型**列表（`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`），来自 `SMALL_LIVE_MODEL_PRIORITY`：

| 提供商/模型                  |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

现代模型列表说明：

- `codex` 和 `codex-cli` 提供商不包含在默认的现代模型全面测试中（它们涵盖 CLI 后端/ACP 行为，已在上文单独测试）。`openai/gpt-5.5` 本身默认通过 Codex app-server harness 路由；请参阅[实时测试：Codex app-server harness 冒烟测试](#live-codex-app-server-harness-smoke)。
- 在现代模型全面测试中，`fireworks`、`google`、`openrouter` 和 `xai` 仅运行明确精选的模型 ID（不会自动扩展为“此提供商的所有模型”）。
- 在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型（Claude/Gemini/OpenAI 系列视觉变体等），以执行图像探测。

使用精心挑选的跨提供商模型集运行包含工具和图像的 Gateway 网关冒烟测试：

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

精选列表之外的可选额外覆盖（最好具备，请选择一个你已启用且支持“工具”的模型）：

- Mistral：`mistral/...`
- Cerebras：`cerebras/...`（如果你有访问权限）
- LM Studio：`lmstudio/...`（本地；工具调用取决于 API 模式）

### 聚合器/备用 Gateway 网关

如果你已启用相应密钥，还可以通过以下方式测试：

- OpenRouter：`openrouter/...`（数百种模型；使用 `openclaw models scan` 查找支持工具和图像的候选模型）
- OpenCode：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 进行身份验证）

可加入实时测试矩阵的更多提供商（如果你有凭据/配置）：

- 内置：`anthropic`、`cerebras`、`github-copilot`、`google`、`google-antigravity`、`google-gemini-cli`、`google-vertex`、`groq`、`mistral`、`openai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`zai`
- 通过 `models.providers`（自定义端点）：`minimax`（云/API），以及任何兼容 OpenAI/Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

<Tip>
不要在文档中硬编码“所有模型”。权威列表由你的机器上 `discoverModels(...)` 返回的结果以及可用密钥共同决定。
</Tip>

## 凭据（切勿提交）

实时测试发现凭据的方式与 CLI 相同。实际影响如下：

- 如果 CLI 可以正常工作，实时测试应能找到相同的密钥。
- 如果实时测试提示“无凭据”，请使用调试 `openclaw models list` / 模型选择时的相同方式进行调试。

- 按智能体划分的身份验证配置文件：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（实时测试中的“配置文件密钥”就是指这个）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版 OAuth 目录：`~/.openclaw/credentials/`（存在时会复制到暂存的实时测试主目录中，但它不是主要的配置文件密钥存储）
- 本地实时测试会将当前配置（移除 `agents.*.workspace` / `agentDir` 覆盖项后）和每个智能体的 `auth-profiles.json` 复制到临时测试主目录，而不会复制该智能体目录中的其余内容，因此 `workspace/` 和 `sandboxes/` 数据绝不会进入暂存主目录；此外还会复制旧版 `credentials/` 目录以及受支持的外部 CLI 身份验证文件/目录（`.claude.json`、`.claude/.credentials.json`、`.claude/settings*.json`、`.claude/backups`、`.codex/auth.json`、`.codex/config.toml`、`.gemini`、`.minimax`）。

如果你想依赖环境变量中的密钥，请在本地测试前将其导出，或使用下方的
Docker 运行器并显式设置 `OPENCLAW_PROFILE_FILE`。

## Deepgram 实时测试（音频转录）

- 测试：`extensions/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus 编码套餐实时测试

- 测试：`extensions/byteplus/live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流媒体实时测试

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 执行内置的 comfy 图像、视频和 `music_generate` 路径
  - 除非已配置 `plugins.entries.comfy.config.<capability>`，否则跳过对应能力
  - 在更改 comfy 工作流提交、轮询、下载或插件注册后非常有用

## 图像生成实时测试

- 测试：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- 测试工具：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图像生成提供商插件
  - 探测前使用已导出的提供商环境变量
  - 默认优先使用实时测试/环境变量中的 API 密钥，而不是存储的身份验证配置文件，因此 `auth-profiles.json` 中过期的测试密钥不会掩盖真实的 shell 凭据
  - 跳过没有可用身份验证/配置文件/模型的提供商
  - 通过共享图像生成运行时运行每个已配置的提供商：
    - `<provider>:generate`
    - 当提供商声明支持编辑时，运行 `<provider>:edit`
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
- 可选身份验证行为：
  - 使用 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制采用配置文件存储中的身份验证，并忽略仅来自环境变量的覆盖项

对于已发布的 CLI 路径，请在提供商/运行时实时测试
通过后添加一次 `infer` 冒烟测试：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "最简扁平测试图像：白色背景上有一个蓝色正方形，无文字。" \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

这涵盖 CLI 参数解析、配置/默认智能体解析、内置
插件激活、共享图像生成运行时和实时提供商
请求。运行时加载前应已安装插件依赖项。

## 音乐生成实时测试

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 测试工具：`pnpm test:live:media music`
- 范围：
  - 执行共享的内置音乐生成提供商路径
  - 当前覆盖 `fal`、`google`、`minimax` 和 `openrouter`
  - 探测前使用已导出的提供商环境变量
  - 默认优先使用实时测试/环境变量中的 API 密钥，而不是存储的身份验证配置文件，因此 `auth-profiles.json` 中过期的测试密钥不会掩盖真实的 shell 凭据
  - 跳过没有可用身份验证/配置文件/模型的提供商
  - 可用时运行声明的两种运行时模式：
    - 使用仅包含提示词的输入运行 `generate`
    - 当提供商声明 `capabilities.edit.enabled` 时运行 `edit`
  - `comfy` 有自己单独的实时测试文件，不属于此共享全面测试
- 可选缩小范围：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 可选身份验证行为：
  - 使用 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制采用配置文件存储中的身份验证，并忽略仅来自环境变量的覆盖项

## 视频生成实时测试

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 测试框架：`pnpm test:live:media video`
- 范围：
  - 对 `alibaba`、`byteplus`、`deepinfra`、`fal`、`google`、`minimax`、`openai`、`openrouter`、`pixverse`、`qwen`、`runway`、`together`、`vydra`、`xai` 执行共享的内置视频生成提供商路径
  - 默认使用发布安全的冒烟测试路径：每个提供商发起一次文生视频请求、使用一秒钟的龙虾提示词，并通过 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 设置每个提供商的操作上限（默认为 `180000`）
  - 默认跳过 FAL，因为提供商端的队列延迟可能占据大部分发布时间；传入 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`（或清空跳过列表）可显式运行它
  - 在探测前使用已导出的提供商环境变量
  - 默认优先使用实时测试环境中的 API 密钥和环境变量中的 API 密钥，而不是已存储的身份验证配置文件，因此 `auth-profiles.json` 中过期的测试密钥不会掩盖真实的 shell 凭据
  - 跳过没有可用身份验证、配置文件或模型的提供商
  - 默认仅运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 后，还会在可用时运行已声明的转换模式：
    - 当提供商声明 `capabilities.imageToVideo.enabled`，并且所选提供商/模型在共享扫描中接受由缓冲区支持的本地图像输入时，运行 `imageToVideo`
    - 当提供商声明 `capabilities.videoToVideo.enabled`，并且所选提供商/模型在共享扫描中接受由缓冲区支持的本地视频输入时，运行 `videoToVideo`
  - 共享扫描中当前已声明但跳过的 `imageToVideo` 提供商：
    - `vydra`（此测试通道不支持由缓冲区支持的本地图像输入）
  - Vydra 提供商专项覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件运行 `veo3` 文生视频，以及使用远程图像 URL 固件的 `kling` 图生视频测试通道（默认使用远程图像 URL 固件，可通过 `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` 覆盖）。
  - xAI 提供商专项覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - 经典用例先生成一张正方形的本地 PNG 首帧，省略几何参数，请求一秒钟的图生视频片段，轮询直至完成，并验证下载的缓冲区。
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - 1.5 用例生成一张本地 PNG 首帧，请求一秒钟的 1080P 图生视频片段，轮询直至完成，并验证下载的缓冲区。
  - 当前 `videoToVideo` 实时测试覆盖：
    - 仅当所选模型解析为 `gen4_aleph` 时覆盖 `runway`
  - 共享扫描中当前已声明但跳过的 `videoToVideo` 提供商：
    - `alibaba`、`google`、`openai`、`qwen`、`xai`，因为这些路径目前需要远程 `http(s)` 引用 URL，而不是由缓冲区支持的本地输入
- 可选缩小范围：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - 使用 `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 在默认扫描中包含所有提供商，包括 FAL
  - 使用 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 缩短每个提供商的操作上限，以执行激进的冒烟测试
- 可选身份验证行为：
  - 使用 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制采用配置文件存储中的身份验证，并忽略仅来自环境变量的覆盖值

## 媒体实时测试框架

- 命令：`pnpm test:live:media`
- 入口点：`test/e2e/qa-lab/media/hosted-media-provider-live.ts`，它会针对每个所选套件运行 `pnpm test:live -- <suite-test-file>`，因此 Heartbeat 和静默模式行为与其他 `pnpm test:live` 运行保持一致。
- 用途：
  - 通过一个仓库原生入口点运行共享的图像、音乐和视频实时测试套件
  - 从 `~/.profile` 自动加载缺失的提供商环境变量
  - 默认自动将每个套件缩小到当前具有可用身份验证的提供商
- 标志：
  - `--providers <csv>` 是全局提供商筛选器；`--image-providers` / `--music-providers` / `--video-providers` 将筛选器的范围限定到一个套件
  - `--all-providers` 跳过基于身份验证的自动筛选
  - `--allow-empty` 在筛选后没有可运行的提供商时以状态码 `0` 退出
  - 将 `--quiet` / `--no-quiet` 传递给 `test:live`
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相关内容

- [测试](/zh-CN/help/testing) - 单元、集成、QA 和 Docker 测试套件
