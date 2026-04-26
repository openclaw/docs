---
read_when:
    - 运行实时模型矩阵 / CLI 后端 / ACP / 媒体提供商冒烟测试
    - 调试实时测试凭证解析
    - 添加新的提供商专用实时测试
sidebarTitle: Live tests
summary: 实时（涉及网络）的测试：模型矩阵、CLI 后端、ACP、媒体提供商、凭证
title: 测试：实时测试套件
x-i18n:
    generated_at: "2026-04-26T18:18:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a47decebb4e95db2c1635b2ac72e1284734bbd81330e9d517427eb710e93ead
    source_path: help/testing-live.md
    workflow: 15
---

关于快速开始、QA 运行器、单元 / 集成测试套件以及 Docker 流程，请参阅
[测试](/zh-CN/help/testing)。本页介绍**实时**（涉及网络）的测试
套件：模型矩阵、CLI 后端、ACP 和媒体提供商实时测试，以及
凭证处理。

## 实时：本地 profile 冒烟命令

在进行临时实时检查前，先 source `~/.profile`，这样提供商密钥和本地工具
路径就会与你的 shell 保持一致：

```bash
source ~/.profile
```

安全的媒体冒烟测试：

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

安全的语音通话就绪性冒烟测试：

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` 默认是一次演练，除非同时传入 `--yes`。仅当你明确
想要发起真实的通知呼叫时才使用 `--yes`。对于 Twilio、Telnyx 和
Plivo，成功的就绪性检查要求使用公开的 webhook URL；仅本地的
loopback / 私有回退方案会按设计被拒绝。

## 实时：Android 节点能力全量扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android 节点当前**声明的每一条命令**，并断言命令契约行为。
- 范围：
  - 带前置条件 / 手动设置（该测试套件不会安装 / 运行 / 配对应用）。
  - 对所选 Android 节点逐条执行 Gateway 网关 `node.invoke` 验证。
- 必需的前置设置：
  - Android 应用已连接并与 Gateway 网关完成配对。
  - 应用保持在前台。
  - 你期望通过的能力所需权限 / 采集授权已授予。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android App](/zh-CN/platforms/android)

## 实时：模型冒烟测试（profile 密钥）

实时测试分为两层，这样我们可以隔离故障：

- “直接模型”告诉我们，在给定密钥下，提供商 / 模型本身是否至少可以返回响应。
- “Gateway 网关冒烟测试”告诉我们，该模型的完整 gateway+agent 流水线是否正常工作（会话、历史、工具、沙箱策略等）。

### 第 1 层：直接模型补全（不经过 gateway）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举已发现的模型
  - 使用 `getApiKeyForModel` 选择你有凭证的模型
  - 对每个模型运行一个小型补全测试（并在需要时运行定向回归测试）
- 启用方式：
  - `pnpm test:live`（如果直接调用 Vitest，则用 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，即 modern 的别名）后才会真正运行此套件；否则它会跳过，以保持 `pnpm test:live` 聚焦于 Gateway 网关冒烟测试
- 模型选择方式：
  - `OPENCLAW_LIVE_MODELS=modern` 运行现代允许列表（Opus / Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是现代允许列表的别名
  - 或使用 `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."`（逗号分隔的允许列表）
  - modern / all 扫描默认有一个精挑细选的高信号数量上限；设为 `OPENCLAW_LIVE_MAX_MODELS=0` 可执行完整的 modern 扫描，或设为正数使用较小上限。
  - 完整扫描会对整个直接模型测试使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS`。默认值：60 分钟。
  - 直接模型探测默认使用 20 路并行；可通过 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 覆盖。
- 提供商选择方式：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔的允许列表）
- 密钥来源：
  - 默认：profile 存储和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制**仅使用 profile 存储**
- 为什么需要它：
  - 将“提供商 API 已损坏 / 密钥无效”和“gateway 智能体流水线已损坏”区分开
  - 容纳小型、隔离的回归场景（例如：OpenAI Responses / Codex Responses 推理回放 + 工具调用流程）

### 第 2 层：Gateway 网关 + dev 智能体冒烟测试（也就是 “@openclaw” 实际执行的内容）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 Gateway 网关
  - 创建 / 修补一个 `agent:dev:*` 会话（每次运行可覆盖模型）
  - 遍历带有密钥的模型并断言：
    - 返回“有意义”的响应（不使用工具）
    - 真实工具调用可以正常工作（read 探针）
    - 可选的额外工具探针正常工作（exec+read 探针）
    - OpenAI 回归路径（仅工具调用 → 后续跟进）继续可用
- 探针细节（这样你可以快速解释失败原因）：
  - `read` 探针：测试会在工作区写入一个 nonce 文件，并要求智能体 `read` 该文件并回显该 nonce。
  - `exec+read` 探针：测试会要求智能体通过 `exec` 将 nonce 写入临时文件，再通过 `read` 读回。
  - 图像探针：测试会附加一个生成的 PNG（cat + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（如果直接调用 Vitest，则用 `OPENCLAW_LIVE_TEST=1`）
- 模型选择方式：
  - 默认：现代允许列表（Opus / Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代允许列表的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）来缩小范围
  - modern / all Gateway 网关扫描默认有一个精挑细选的高信号数量上限；设为 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可执行完整的 modern 扫描，或设为正数使用较小上限。
- 提供商选择方式（避免“OpenRouter 所有模型全测”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔的允许列表）
- 工具 + 图像探针在此实时测试中始终启用：
  - `read` 探针 + `exec+read` 探针（工具压力测试）
  - 当模型声明支持图像输入时，会运行图像探针
  - 流程（高层概述）：
    - 测试生成一个带有 “CAT” + 随机代码的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 内嵌智能体将多模态用户消息转发给模型
    - 断言：回复包含 `cat` + 该代码（OCR 容错：允许轻微错误）

提示：如果你想查看本机可测试的内容（以及精确的 `provider/model` id），请运行：

```bash
openclaw models list
openclaw models list --json
```

## 实时：CLI 后端冒烟测试（Claude、Codex、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway 网关 + 智能体流水线，同时不触碰你的默认配置。
- 后端专用的默认冒烟设置位于对应扩展的 `cli-backend.ts` 定义中。
- 启用：
  - `pnpm test:live`（如果直接调用 Vitest，则用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认提供商 / 模型：`claude-cli/claude-sonnet-4-6`
  - command / args / 图像行为来自所属 CLI 后端插件元数据。
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 发送真实图像附件（路径会注入到提示词中）。除非显式请求，否则 Docker 配方默认关闭此项。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 将图像文件路径作为 CLI 参数传递，而不是注入到提示词中。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）用于控制在设置 `IMAGE_ARG` 时图像参数的传递方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮对话并验证恢复流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` 选择加入 Claude Sonnet -> Opus 的同会话连续性探针，前提是所选模型支持切换目标。为了整体稳定性，Docker 配方默认关闭此项。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` 选择加入 MCP / 工具 loopback 探针。除非显式请求，否则 Docker 配方默认关闭此项。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

低成本 Gemini MCP 配置冒烟测试：

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

这不会要求 Gemini 生成响应。它会写入 OpenClaw 提供给 Gemini 的同一套系统
设置，然后运行 `gemini --debug mcp list`，以证明已保存的
`transport: "streamable-http"` 服务器会被规范化为 Gemini 的 HTTP MCP
形式，并且能够连接到本地 streamable-HTTP MCP 服务器。

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
- 它会在仓库 Docker 镜像内，以非 root 的 `node` 用户运行实时 CLI 后端冒烟测试。
- 它会从所属扩展中解析 CLI 冒烟元数据，然后将匹配的 Linux CLI 包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到一个可写且带缓存的前缀目录 `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（默认值：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可移植的 Claude Code 订阅 OAuth，可通过 `~/.claude/.credentials.json` 中的 `claudeAiOauth.subscriptionType`，或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN` 提供。它会先在 Docker 中直接验证 `claude -p`，然后在不保留 Anthropic API-key 环境变量的情况下运行两轮 Gateway 网关 CLI 后端测试。此订阅通道默认禁用 Claude MCP / 工具和图像探针，因为 Claude 当前会将第三方应用使用量计入额外用量计费，而不是普通订阅计划限额。
- 实时 CLI 后端冒烟测试现在对 Claude、Codex 和 Gemini 执行相同的端到端流程：文本轮次、图像分类轮次，然后通过 gateway CLI 验证 MCP `cron` 工具调用。
- Claude 的默认冒烟测试还会将会话从 Sonnet 修补切换到 Opus，并验证恢复后的会话仍然记得之前的记录。

## 实时：ACP 绑定冒烟测试（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用实时 ACP 智能体验证真实的 ACP 会话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 就地绑定一个合成的消息渠道会话
  - 在同一个会话上发送一条普通的后续消息
  - 验证该后续消息会落入已绑定 ACP 会话的 transcript 中
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - Docker 中的 ACP 智能体：`claude,codex,gemini`
  - 直接执行 `pnpm test:live ...` 时使用的 ACP 智能体：`claude`
  - 合成渠道：Slack 私信风格的会话上下文
  - ACP 后端：`acpx`
- 覆盖项：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- 说明：
  - 该测试通道使用 gateway `chat.send` 接口，并结合仅管理员可用的合成 originating-route 字段，这样测试就能附加消息渠道上下文，而无需假装进行外部投递。
  - 当未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会使用内嵌 `acpx` 插件中针对所选 ACP harness 智能体的内置智能体注册表。
  - 已绑定会话中的 cron MCP 创建默认采用尽力而为模式，因为外部 ACP harness 可能会在绑定 / 图像验证通过后取消 MCP 调用；设置 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` 可让该绑定后 cron 探针变为严格模式。

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
- 默认情况下，它会按顺序对聚合的实时 CLI 智能体运行 ACP 绑定冒烟测试：`claude`、`codex`，然后 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` 可以缩小矩阵范围。
- 它会 source `~/.profile`，将匹配的 CLI 认证材料暂存到容器中，然后在缺失时安装所请求的实时 CLI（`@anthropic-ai/claude-code`、`@openai/codex`、通过 `https://app.factory.ai/cli` 安装的 Factory Droid、`@google/gemini-cli` 或 `opencode-ai`）。ACP 后端本身则是来自 `acpx` 插件的内置嵌入式 `acpx/runtime` 包。
- Droid Docker 变体会暂存 `~/.factory` 作为设置目录，转发 `FACTORY_API_KEY`，并要求提供该 API key，因为本地 Factory OAuth / keyring 认证无法移植到容器中。它使用 ACPX 内置的 `droid exec --output-format acp` 注册表项。
- OpenCode Docker 变体是一个严格的单智能体回归测试通道。它会在 source `~/.profile` 之后，根据 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（默认 `opencode/kimi-k2.6`）写入一个临时 `OPENCODE_CONFIG_CONTENT` 默认模型，而 `pnpm test:docker:live-acp-bind:opencode` 要求必须有已绑定的助手 transcript，而不是接受通用的绑定后跳过。
- 直接调用 `acpx` CLI 仅用于在 Gateway 网关之外比较行为的手动 / 变通路径。Docker ACP 绑定冒烟测试验证的是 OpenClaw 内嵌的 `acpx` 运行时后端。

## 实时：Codex app-server harness 冒烟测试

- 目标：通过常规 gateway
  `agent` 方法验证插件拥有的 Codex harness：
  - 加载内置的 `codex` 插件
  - 选择 `OPENCLAW_AGENT_RUNTIME=codex`
  - 向 `openai/gpt-5.2` 发送第一轮 gateway 智能体请求，并强制使用 Codex harness
  - 向同一个 OpenClaw 会话发送第二轮请求，并验证 app-server
    线程能够恢复
  - 通过相同的 gateway 命令
    路径运行 `/codex status` 和 `/codex models`
  - 可选运行两个经过 Guardian 审核的提权 shell 探针：一个应被批准的无害
    命令，以及一个应被拒绝的伪造秘密上传操作，从而让智能体回头询问
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认模型：`openai/gpt-5.2`
- 可选图像探针：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP / 工具探针：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可选 Guardian 探针：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 此冒烟测试会设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，这样损坏的 Codex
  harness 就无法通过悄悄回退到 PI 来蒙混过关。
- 认证：Codex app-server 认证来自本地 Codex 订阅登录。Docker
  冒烟测试在适用时也可提供 `OPENAI_API_KEY` 用于非 Codex 探针，
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
- 它会 source 挂载的 `~/.profile`，传递 `OPENAI_API_KEY`，在存在时复制 Codex CLI
  认证文件，将 `@openai/codex` 安装到一个可写的挂载 npm
  前缀目录中，暂存源代码树，然后仅运行 Codex-harness 实时测试。
- Docker 默认启用图像、MCP / 工具和 Guardian 探针。若你需要更窄范围的调试
  运行，请设置 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 还会导出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，与实时
  测试配置保持一致，这样旧别名或 PI 回退都无法掩盖 Codex harness
  回归问题。

### 推荐的实时测试配方

范围小、明确的允许列表最快，也最不容易出错：

- 单模型，直接测试（不经过 gateway）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，Gateway 网关冒烟测试：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 聚焦测试（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 自适应思考冒烟测试：
  - 如果本地密钥保存在 shell profile 中：`source ~/.profile`
  - Gemini 3 动态默认：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 动态预算：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

说明：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth bridge（Cloud Code Assist 风格的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（独立的认证方式 + 工具行为差异）。
- Gemini API 与 Gemini CLI 的区别：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API key / profile 认证）；这通常就是大多数用户所说的 “Gemini”。
  - CLI：OpenClaw 通过 shell 调用本地 `gemini` 二进制；它有自己的认证方式，并且行为可能不同（流式传输 / 工具支持 / 版本偏差）。

## 实时：模型矩阵（我们的覆盖范围）

这里没有固定的“CI 模型列表”（实时测试为选择加入），但以下是在有密钥的开发机器上建议定期覆盖的**推荐**模型。

### 现代冒烟测试集（工具调用 + 图像）

这是我们期望始终保持可用的“常用模型”运行集：

- OpenAI（非 Codex）：`openai/gpt-5.2`
- OpenAI Codex OAuth：`openai-codex/gpt-5.2`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- DeepSeek：`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

运行带工具 + 图像的 Gateway 网关冒烟测试：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个提供商家族至少选一个：

- OpenAI：`openai/gpt-5.2`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- DeepSeek：`deepseek/deepseek-v4-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

可选的附加覆盖（最好有）：

- xAI：`xai/grok-4`（或最新可用版本）
- Mistral：`mistral/`…（选择一个你已启用、支持工具的模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### 视觉：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型（Claude / Gemini / 支持视觉的 OpenAI 变体等），以覆盖图像探针。

### 聚合器 / 替代 Gateway 网关

如果你启用了相应密钥，我们也支持通过以下方式进行测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图像的候选模型）
- OpenCode：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 认证）

你还可以加入实时矩阵的更多提供商（如果你有凭证 / 配置）：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云 / API），以及任何兼容 OpenAI / Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档中硬编码“所有模型”。权威列表始终是你机器上 `discoverModels(...)` 的返回结果，加上当前可用的密钥。

## 凭证（切勿提交）

实时测试会以与 CLI 相同的方式发现凭证。实际含义如下：

- 如果 CLI 能正常工作，实时测试也应该能找到相同的密钥。
- 如果某个实时测试提示 “no creds”，请用与调试 `openclaw models list` / 模型选择相同的方式来排查。

- 按智能体划分的认证 profile：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是实时测试中 “profile keys” 的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（存在时会复制到暂存的实时 home 中，但它不是主 profile-key 存储）
- 本地实时运行默认会将当前活动配置、各智能体的 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 认证目录复制到一个临时测试 home 中；暂存的实时 home 会跳过 `workspace/` 和 `sandboxes/`，并去除 `agents.*.workspace` / `agentDir` 路径覆盖，这样探针就不会落到你真实主机的工作区上。

如果你希望依赖环境变量密钥（例如导出在你的 `~/.profile` 中），请在执行本地测试前运行 `source ~/.profile`，或者使用下面的 Docker 运行器（它们可以把 `~/.profile` 挂载进容器）。

## Deepgram 实时测试（音频转写）

- 测试：`extensions/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus 编码方案实时测试

- 测试：`extensions/byteplus/live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow 媒体实时测试

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 覆盖内置 comfy 图像、视频和 `music_generate` 路径
  - 除非已配置 `plugins.entries.comfy.config.<capability>`，否则会跳过每项能力
  - 在修改 comfy workflow 提交、轮询、下载或插件注册后特别有用

## 图像生成实时测试

- 测试：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图像生成提供商插件
  - 在探测前从你的登录 shell（`~/.profile`）加载缺失的提供商环境变量
  - 默认优先使用实时 / 环境变量 API key，而不是已存储的 auth profile，因此 `auth-profiles.json` 中陈旧的测试密钥不会掩盖真实的 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 通过共享图像生成运行时对每个已配置提供商执行：
    - `<provider>:generate`
    - 当提供商声明支持 edit 时执行 `<provider>:edit`
- 当前已内置并覆盖的提供商：
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile-store 认证并忽略仅环境变量的覆盖

对于已发布的 CLI 路径，在提供商 / 运行时实时测试通过后，再添加一个 `infer` 冒烟
测试：

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
图像生成运行时以及实时提供商请求。

## 音乐生成实时测试

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media music`
- 范围：
  - 覆盖共享的内置音乐生成提供商路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用实时 / 环境变量 API key，而不是已存储的 auth profile，因此 `auth-profiles.json` 中陈旧的测试密钥不会掩盖真实的 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 在可用时运行两种已声明的运行时模式：
    - 使用仅 prompt 输入的 `generate`
    - 当提供商声明 `capabilities.edit.enabled` 时运行 `edit`
  - 当前共享通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：使用单独的 Comfy 实时文件，不在此共享扫描中
- 可选缩小范围：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile-store 认证并忽略仅环境变量的覆盖

## 视频生成实时测试

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media video`
- 范围：
  - 覆盖共享的内置视频生成提供商路径
  - 默认使用对发布安全的冒烟路径：非 FAL 提供商、每个提供商一次 text-to-video 请求、一秒钟的龙虾 prompt，以及从 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 继承的每提供商操作上限（默认 `180000`）
  - 默认跳过 FAL，因为提供商侧队列延迟可能主导发布时间；传入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可显式运行它
  - 在探测前从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用实时 / 环境变量 API key，而不是已存储的 auth profile，因此 `auth-profiles.json` 中陈旧的测试密钥不会掩盖真实的 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 默认仅运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 可在可用时也运行已声明的 transform 模式：
    - 当提供商声明 `capabilities.imageToVideo.enabled`，且所选提供商 / 模型在共享扫描中接受基于 buffer 的本地图像输入时，运行 `imageToVideo`
    - 当提供商声明 `capabilities.videoToVideo.enabled`，且所选提供商 / 模型在共享扫描中接受基于 buffer 的本地视频输入时，运行 `videoToVideo`
  - 当前在共享扫描中已声明但跳过的 `imageToVideo` 提供商：
    - `vydra`，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图像 URL
  - 提供商专用的 Vydra 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件会运行 `veo3` text-to-video，以及一个默认使用远程图像 URL fixture 的 `kling` 通道
  - 当前 `videoToVideo` 实时覆盖：
    - 仅 `runway`，且所选模型为 `runway/gen4_aleph`
  - 当前在共享扫描中已声明但跳过的 `videoToVideo` 提供商：
    - `alibaba`、`qwen`、`xai`，因为这些路径当前要求远程 `http(s)` / MP4 参考 URL
    - `google`，因为当前共享 Gemini / Veo 通道使用的是基于本地 buffer 的输入，而该路径不被共享扫描接受
    - `openai`，因为当前共享通道无法保证组织专属的视频 inpaint / remix 访问权限
- 可选缩小范围：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 以在默认扫描中包含所有提供商，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 可将每个提供商的操作上限降低，用于更激进的冒烟测试运行
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile-store 认证并忽略仅环境变量的覆盖

## 媒体实时测试 harness

- 命令：`pnpm test:live:media`
- 目的：
  - 通过一个仓库原生入口运行共享的图像、音乐和视频实时测试套件
  - 自动从 `~/.profile` 加载缺失的提供商环境变量
  - 默认自动将每个套件缩小到当前具有可用认证的提供商
  - 复用 `scripts/test-live.mjs`，因此心跳和静默模式行为保持一致
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相关内容

- [测试](/zh-CN/help/testing) — 单元、集成、QA 和 Docker 测试套件
