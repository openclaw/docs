---
read_when:
    - 在本地或 CI 中运行测试时
    - 为模型 / 提供商缺陷添加回归测试时
    - 调试 Gateway 网关 + 智能体行为时
summary: 测试工具包：单元 / e2e / live 测试套件、Docker 运行器，以及每类测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-06T12:44:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b18d68d08b851dea994af250f7cb833a34523601d04fd2f118def9777c961b55
    source_path: help/testing.md
    workflow: 15
---

# 测试

OpenClaw 有三个 Vitest 测试套件（单元 / 集成、e2e、live）以及一小组 Docker 运行器。

本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么（以及它刻意 _不_ 覆盖什么）
- 常见工作流该运行哪些命令（本地、推送前、调试）
- live 测试如何发现凭证并选择模型 / 提供商
- 如何为真实世界中的模型 / 提供商问题添加回归测试

## 快速开始

大多数时候：

- 完整门槛检查（预期在推送前执行）：`pnpm build && pnpm check && pnpm test`
- 在配置较充足的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接使用 Vitest 观察模式循环（现代 projects 配置）：`pnpm test:watch`
- 现在直接指定文件也会路由扩展 / 渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`

当你修改了测试或想获得更多信心时：

- 覆盖率门槛检查：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

调试真实提供商 / 模型时（需要真实凭证）：

- Live 测试套件（模型 + Gateway 网关 工具 / 图像探测）：`pnpm test:live`
- 安静地只跑一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`

提示：如果你只需要一个失败用例，优先使用下面介绍的 allowlist 环境变量来缩小 live 测试范围。

## 测试套件（各自运行位置）

可以把这些测试套件理解为“真实度逐步增加”（同时不稳定性 / 成本也逐步增加）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：通过 `vitest.config.ts` 使用原生 Vitest `projects`
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 下的核心 / 单元测试清单，以及由 `vitest.unit.config.ts` 覆盖的白名单 `ui` Node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关 身份验证、路由、工具、解析、配置）
  - 已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
- Projects 说明：
  - `pnpm test`、`pnpm test:watch` 和 `pnpm test:changed` 现在都使用同一份原生 Vitest 根级 `projects` 配置。
  - 直接文件过滤现在会通过根项目图原生路由，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 无需自定义包装器也能工作。
- 嵌入式运行器说明：
  - 当你修改消息工具发现输入或压缩运行时上下文时，
    请同时保留两个层级的覆盖。
  - 为纯路由 / 规范化边界添加有针对性的辅助函数回归测试。
  - 同时也要保持嵌入式运行器集成测试套件健康：
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`，以及
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - 这些测试套件用于验证带作用域的 id 和压缩行为仍然会沿真实的
    `run.ts` / `compact.ts` 路径传递；仅有辅助函数测试
    不能充分替代这些集成路径。
- 线程池说明：
  - 基础 Vitest 配置现在默认使用 `threads`。
  - 共享 Vitest 配置也固定了 `isolate: false`，并在根 projects、e2e 和 live 配置中使用非隔离运行器。
  - 根级 UI 通道保留其 `jsdom` 设置和优化器，但现在也运行在共享的非隔离运行器上。
  - `pnpm test` 从根级 `vitest.config.ts` projects 配置继承相同的 `threads` + `isolate: false` 默认值。
  - 共享的 `scripts/run-vitest.mjs` 启动器现在默认还会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。如果你需要与原生 V8 行为做对比，可设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`。
- 快速本地迭代说明：
  - `pnpm test:changed` 会使用原生 projects 配置并带上 `--changed origin/main` 运行。
  - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的原生 projects 配置，只是使用更高的 worker 上限。
  - 本地 worker 自动缩放现在有意采取更保守策略，并且当主机平均负载已经较高时也会回退，因此默认情况下多个并发 Vitest 运行对系统的影响更小。
  - 基础 Vitest 配置会将 projects / config 文件标记为 `forceRerunTriggers`，以便在测试布线发生变化时 changed 模式的重跑仍然正确。
  - 在受支持的主机上，该配置保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接性能分析指定一个明确的缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
- 性能调试说明：
  - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入明细输出。
  - `pnpm test:perf:imports:changed` 会将相同的分析视图限制为自 `origin/main` 以来变更的文件。
  - `pnpm test:perf:profile:main` 会为 Vitest / Vite 启动和转换开销写入主线程 CPU profile。
  - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为单元测试套件写入运行器 CPU + 堆 profile。

### E2E（Gateway 网关 冒烟测试）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- 运行时默认值：
  - 使用 Vitest `threads` 且 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 强制设置 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关 端到端行为
  - WebSocket / HTTP 接口、节点配对以及更重的网络场景
- 预期：
  - 在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比单元测试有更多可变因素（可能更慢）

### E2E：OpenShell 后端冒烟测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`test/openshell-sandbox.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell Gateway 网关
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远端标准文件系统行为
- 预期：
  - 仅在选择加入时运行；不属于默认的 `pnpm test:e2e` 执行内容
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关 和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：在手动运行更广泛的 e2e 测试套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非默认 CLI 二进制或包装脚本

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型在 _今天_ 配合真实凭证是否真的能工作？”
  - 捕捉提供商格式变化、工具调用怪癖、身份验证问题和限流行为
- 预期：
  - 设计上不以 CI 稳定为目标（真实网络、真实提供商策略、配额、故障）
  - 需要花钱 / 消耗速率限制
  - 优先运行缩小范围的子集，而不是“全部”
- Live 运行会读取 `~/.profile`，以补齐缺失的 API 密钥。
- 默认情况下，live 运行仍然会隔离 `HOME`，并将配置 / 身份验证材料复制到临时测试 home 中，这样单元测试夹具就不会修改你真实的 `~/.openclaw`。
- 仅当你明确需要 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认以更安静的模式运行：它会保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静音 Gateway 网关 启动日志 / Bonjour 噪音。如果你想恢复完整启动日志，可设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（提供商专属）：设置 `*_API_KEYS`，使用逗号 / 分号格式，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或者通过 `OPENCLAW_LIVE_*_KEY` 进行逐个 live 覆盖；测试在收到限流响应时会重试。
- 进度 / 心跳输出：
  - Live 测试套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获较安静，较长时间的提供商调用也能显示为仍在活动。
  - `vitest.live.config.ts` 禁用了 Vitest 控制台拦截，因此在 live 运行期间，提供商 / Gateway 网关 进度行会立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探测心跳。

## 我应该运行哪个测试套件？

使用这个决策表：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果改动较多，再加上 `pnpm test:coverage`）
- 触及 Gateway 网关 网络 / WS 协议 / 配对：加跑 `pnpm test:e2e`
- 调试“我的 bot 挂了” / 提供商专属失败 / 工具调用：运行缩小范围的 `pnpm test:live`

## Live：Android 节点能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用连接的 Android 节点当前发布的**每一条命令**，并断言命令契约行为。
- 范围：
  - 需要预先满足条件 / 手动设置（该测试套件不会安装 / 运行 / 配对应用）。
  - 针对所选 Android 节点逐条验证 Gateway 网关 `node.invoke`。
- 所需预先设置：
  - Android 应用已经连接并配对到 Gateway 网关。
  - 应用保持在前台。
  - 为你期望通过的能力授予权限 / 捕获授权。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android App](/zh-CN/platforms/android)

## Live：模型冒烟测试（profile keys）

Live 测试分成两层，这样我们可以隔离失败原因：

- “直接模型”告诉我们提供商 / 模型是否至少能用给定密钥正常响应。
- “Gateway 网关 冒烟测试”告诉我们完整的 Gateway 网关 + 智能体流水线是否适用于该模型（会话、历史、工具、沙箱策略等）。

### 第 1 层：直接模型补全（无 Gateway 网关）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举发现到的模型
  - 使用 `getApiKeyForModel` 选择你有凭证的模型
  - 为每个模型运行一次小型补全（在需要时也运行有针对性的回归测试）
- 启用方式：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，它是 modern 的别名）才能真正运行该测试套件；否则它会跳过，以便让 `pnpm test:live` 聚焦于 Gateway 网关 冒烟测试
- 如何选择模型：
  - `OPENCLAW_LIVE_MODELS=modern` 运行 modern allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是 modern allowlist 的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（逗号分隔的 allowlist）
- 如何选择提供商：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔的 allowlist）
- 密钥来源：
  - 默认：profile 存储和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 以强制**仅使用 profile 存储**
- 存在原因：
  - 将“提供商 API 坏了 / 密钥无效”与“Gateway 网关 智能体流水线坏了”分离
  - 容纳小而隔离的回归测试（例如：OpenAI Responses / Codex Responses 推理重放 + 工具调用流程）

### 第 2 层：Gateway 网关 + dev 智能体冒烟测试（也就是 “@openclaw” 实际在做什么）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 Gateway 网关
  - 创建 / 修补一个 `agent:dev:*` 会话（每次运行都覆盖模型）
  - 迭代有密钥的模型，并断言：
    - “有意义的”响应（无工具）
    - 真实工具调用可用（read 探测）
    - 可选的额外工具探测（exec+read 探测）
    - OpenAI 回归路径（仅工具调用 → 后续跟进）继续可用
- 探测细节（这样你可以快速解释失败）：
  - `read` 探测：测试会在工作区写入一个 nonce 文件，并要求智能体 `read` 它并回显该 nonce。
  - `exec+read` 探测：测试要求智能体通过 `exec` 将一个 nonce 写入临时文件，然后再 `read` 回来。
  - 图像探测：测试会附加一个生成的 PNG（猫 + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 如何选择模型：
  - 默认：modern allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 modern allowlist 的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号分隔列表）来缩小范围
- 如何选择提供商（避免“OpenRouter 全量”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔的 allowlist）
- 工具 + 图像探测在这个 live 测试中始终启用：
  - `read` 探测 + `exec+read` 探测（工具压力测试）
  - 当模型声明支持图像输入时，会运行图像探测
  - 流程（高层级）：
    - 测试生成一个带有 “CAT” + 随机代码的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关 将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式智能体向模型转发一条多模态用户消息
    - 断言：回复包含 `cat` + 该代码（OCR 容错：允许少量错误）

提示：要查看你的机器上可以测试什么（以及精确的 `provider/model` id），请运行：

```bash
openclaw models list
openclaw models list --json
```

## Live：CLI 后端冒烟测试（Codex CLI 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway 网关 + 智能体流水线，而不触碰你的默认配置。
- 启用：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 模型：`codex-cli/gpt-5.4`
  - 命令：`codex`
  - 参数：`["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 发送真实图像附件（路径会注入到提示词中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 通过 CLI 参数而不是提示词注入传递图像文件路径。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）用于控制在设置 `IMAGE_ARG` 时如何传递图像参数。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮并验证恢复流程。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-cli-backend
```

说明：

- Docker 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它会在仓库 Docker 镜像内，以非 root 的 `node` 用户身份运行 live CLI 后端冒烟测试。
- 对于 `codex-cli`，它会将 Linux 版 `@openai/codex` 包安装到可缓存的可写前缀 `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（默认：`~/.cache/openclaw/docker-cli-tools`）中。

## Live：ACP 绑定冒烟测试（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用 live ACP 智能体验证真实 ACP 会话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 就地绑定一个合成的消息渠道会话
  - 在同一会话上发送普通后续消息
  - 验证后续消息确实落入已绑定的 ACP 会话记录
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - ACP 智能体：`claude`
  - 合成渠道：类似 Slack 私信 的会话上下文
  - ACP 后端：`acpx`
- 覆盖项：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 说明：
  - 这个通道使用 Gateway 网关 `chat.send` 接口，并带有仅管理员可用的合成来源路由字段，这样测试就能附加消息渠道上下文，而无需假装对外投递。
  - 当未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会使用内置 `acpx` 插件的内建智能体注册表来选择 ACP 测试智能体。

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

Docker 说明：

- Docker 运行器位于 `scripts/test-live-acp-bind-docker.sh`。
- 它会读取 `~/.profile`，将匹配的 CLI 身份验证材料暂存到容器中，把 `acpx` 安装到可写 npm 前缀，然后在缺失时安装请求的 live CLI（`@anthropic-ai/claude-code` 或 `@openai/codex`）。
- 在 Docker 内部，运行器会设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，这样 acpx 就能保留从已读取 profile 中获得的提供商环境变量，以供子测试 CLI 使用。

### 推荐的 live 配方

范围窄、明确的 allowlist 最快，也最不容易波动：

- 单模型，直接（无 Gateway 网关）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，Gateway 网关 冒烟测试：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 多个提供商上的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 聚焦 Google（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

说明：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth bridge（Cloud Code Assist 风格的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（单独的身份验证 + 工具行为差异）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API key / profile auth）；这也是大多数用户提到 “Gemini” 时的含义。
  - CLI：OpenClaw 调用本地 `gemini` 二进制；它有自己的身份验证，并且行为可能不同（流式传输 / 工具支持 / 版本偏差）。

## Live：模型矩阵（我们覆盖什么）

这里没有固定的“CI 模型列表”（live 是可选加入的），但以下是建议在有密钥的开发机器上定期覆盖的**推荐**模型。

### Modern 冒烟测试集（工具调用 + 图像）

这是我们预期应持续保持可用的“常用模型”运行：

- OpenAI（非 Codex）：`openai/gpt-5.4`（可选：`openai/gpt-5.4-mini`）
- OpenAI Codex：`openai-codex/gpt-5.4`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

运行带工具 + 图像的 Gateway 网关 冒烟测试：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个提供商系列至少选一个：

- OpenAI：`openai/gpt-5.4`（或 `openai/gpt-5.4-mini`）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

可选的附加覆盖（有更好，没有也可以）：

- xAI：`xai/grok-4`（或最新可用版本）
- Mistral：`mistral/`…（选择一个你已启用、具备 “tools” 能力的模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### 视觉：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个具备图像能力的模型（Claude / Gemini / OpenAI 支持视觉的变体等），以覆盖图像探测。

### 聚合器 / 替代 Gateway 网关

如果你启用了相应密钥，我们也支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 找出支持工具 + 图像的候选项）
- OpenCode：Zen 用 `opencode/...`，Go 用 `opencode-go/...`（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 身份验证）

你也可以在 live 矩阵中加入更多提供商（如果你有凭证 / 配置）：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云 / API），以及任意 OpenAI / Anthropic 兼容代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档中硬编码“所有模型”。权威列表始终是你机器上的 `discoverModels(...)` 返回结果 + 当前可用的密钥。

## 凭证（切勿提交）

Live 测试发现凭证的方式与 CLI 相同。实际含义如下：

- 如果 CLI 能工作，live 测试通常也能找到相同的密钥。
- 如果 live 测试提示“无凭证”，就像调试 `openclaw models list` / 模型选择那样去调试。

- 按智能体划分的 auth profiles：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是 live 测试中 “profile keys” 的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（如存在，会复制进暂存的 live home，但它不是主 profile-key 存储）
- 默认情况下，live 本地运行会将当前活动配置、每个智能体的 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 身份验证目录复制到临时测试 home；暂存配置中的 `agents.*.workspace` / `agentDir` 路径覆盖会被去除，这样探测就不会落到你真实主机工作区上。

如果你想依赖环境变量密钥（例如导出在你的 `~/.profile` 中），请在本地测试前运行 `source ~/.profile`，或者使用下面的 Docker 运行器（它们可以将 `~/.profile` 挂载到容器中）。

## Deepgram live（音频转录）

- 测试：`src/media-understanding/providers/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus 编码计划 live

- 测试：`src/agents/byteplus.live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流媒体 live

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 覆盖内置 comfy 图像、视频和 `music_generate` 路径
  - 除非配置了 `models.providers.comfy.<capability>`，否则会跳过各项能力
  - 在修改 comfy 工作流提交、轮询、下载或插件注册后很有用

## 图像生成 live

- 测试：`src/image-generation/runtime.live.test.ts`
- 命令：`pnpm test:live src/image-generation/runtime.live.test.ts`
- 范围：
  - 枚举每个已注册的图像生成提供商插件
  - 在探测前从你的登录 shell（`~/.profile`）中加载缺失的提供商环境变量
  - 默认优先使用 live / 环境变量 API 密钥，而不是已存储的 auth profiles，这样 `auth-profiles.json` 里的过期测试密钥就不会掩盖真实的 shell 凭证
  - 跳过没有可用 auth / profile / model 的提供商
  - 通过共享运行时能力运行标准图像生成变体：
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 当前覆盖的内置提供商：
  - `openai`
  - `google`
- 可选缩小范围：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 可选身份验证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile-store 身份验证并忽略仅环境变量的覆盖

## 音乐生成 live

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 范围：
  - 覆盖共享内置 music-generation 提供商路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前从你的登录 shell（`~/.profile`）中加载提供商环境变量
  - 跳过没有可用 auth / profile / model 的提供商
- 可选缩小范围：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`

## Docker 运行器（可选的“在 Linux 中可工作”检查）

这些 Docker 运行器分为两类：

- Live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像内运行各自匹配的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），同时挂载你的本地配置目录和工作区（如果已挂载，也会读取 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认使用更小的冒烟测试上限，以便完整 Docker 扫描仍然具有可行性：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，并且
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你
  明确想进行更大的穷举扫描时，再覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，然后在两个 live Docker 通道中复用它。
- 容器冒烟测试运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels` 和 `test:docker:plugins` 会启动一个或多个真实容器，并验证更高层级的集成路径。

Live 模型 Docker 运行器还会只绑定挂载所需的 CLI auth home（若运行未缩小范围，则挂载所有受支持项），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就可以刷新令牌，而不会修改主机 auth 存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live 冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Gateway 网关 网络（两个容器、WS 身份验证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- MCP 渠道桥接（已播种的 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- 插件（安装冒烟测试 + `/plugin` 别名 + Claude bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）

Live 模型 Docker 运行器还会以只读方式绑定挂载当前检出内容，并在容器内将其暂存到临时 workdir 中。这能让运行时镜像保持精简，同时仍然针对你本地的确切源码 / 配置运行 Vitest。暂存步骤会跳过大型本地专用缓存和应用构建产物，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或 Gradle 输出目录，这样 Docker live 运行就不会花数分钟复制机器专属产物。它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，因此 Gateway 网关 live 探测不会在容器里启动真实的 Telegram / Discord / 等渠道 worker。`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要缩小或排除该 Docker 通道中的 Gateway 网关 live 覆盖时，也要一并传入 `OPENCLAW_LIVE_GATEWAY_*`。`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关 容器，启动一个指向该 Gateway 网关 的固定版 Open WebUI 容器，通过 Open WebUI 完成登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一条真实聊天请求。首次运行可能明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI 也可能需要完成自身的冷启动设置。这个通道需要一个可用的 live 模型密钥，而 `OPENCLAW_PROFILE_FILE`（默认 `~/.profile`）是在 Docker 化运行中提供它的主要方式。成功运行会打印一个小型 JSON 负载，例如 `{ "ok": true, "model": "openclaw/default", ... }`。`test:docker:mcp-channels` 刻意保持确定性，不需要真实的 Telegram、Discord 或 iMessage 账号。它会启动一个已播种的 Gateway 网关 容器，启动第二个容器来运行 `openclaw mcp serve`，然后通过真实的 stdio MCP bridge 验证路由会话发现、记录读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。通知检查会直接检查原始 stdio MCP 帧，因此该冒烟测试验证的是 bridge 实际发出了什么，而不只是某个特定客户端 SDK 恰好暴露了什么。

手动 ACP 自然语言线程冒烟测试（不在 CI 中）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留这个脚本以供回归 / 调试工作流使用。未来可能还需要它来验证 ACP 线程路由，因此不要删除它。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前读取
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于缓存 Docker 内部的 CLI 安装
- `$HOME` 下的外部 CLI 身份验证目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小提供商范围的运行只会挂载由 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 手动覆盖方式：`OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或逗号列表，例如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 在容器内过滤提供商
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 确保凭证来自 profile store（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 选择 Gateway 网关 为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 覆盖 Open WebUI 冒烟测试使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

修改文档后运行文档检查：`pnpm check:docs`。
如需同时检查页内标题锚点，运行完整 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归测试（CI 安全）

这些是不依赖真实提供商的“真实流水线”回归测试：

- Gateway 网关 工具调用（模拟 OpenAI，真实 Gateway 网关 + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关 向导（WS `wizard.start` / `wizard.next`，写入配置 + 强制身份验证）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些 CI 安全的测试，它们的行为类似“智能体可靠性评估”：

- 通过真实 Gateway 网关 + 智能体循环进行模拟工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话布线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills，仍然缺少的内容（参见 [Skills](/zh-CN/tools/skills)）：

- **决策能力：** 当提示词中列出 Skills 时，智能体是否会选择正确的技能（或避开无关技能）？
- **合规性：** 智能体是否会在使用前读取 `SKILL.md`，并遵守必需的步骤 / 参数？
- **工作流契约：** 断言工具顺序、会话历史延续以及沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 一个使用模拟提供商的场景运行器，用于断言工具调用 + 顺序、技能文件读取和会话布线。
- 一小组面向技能的场景测试（使用 vs 避免、门控、提示词注入）。
- 只有在 CI 安全测试套件建立之后，才增加可选的 live 评估（选择加入、环境变量门控）。

## 契约测试（插件和渠道形状）

契约测试用于验证每个已注册插件和渠道都符合其接口契约。它们会遍历所有发现到的插件，并运行一组形状和行为断言。默认的 `pnpm test` 单元通道会刻意跳过这些共享接缝和冒烟测试文件；当你触及共享渠道或提供商接口时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、名称、能力）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息负载结构
- **inbound** - 入站消息处理
- **actions** - 渠道动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / 花名册 API
- **group-policy** - 群组策略执行

### 提供商状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 身份验证流程契约
- **auth-choice** - 身份验证选择 / 选择逻辑
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状 / 接口
- **wizard** - 设置向导

### 何时运行

- 在修改 plugin-sdk 导出或子路径之后
- 在添加或修改渠道或提供商插件之后
- 在重构插件注册或发现逻辑之后

契约测试会在 CI 中运行，不需要真实 API 密钥。

## 添加回归测试（指南）

当你修复 live 中发现的提供商 / 模型问题时：

- 如果可能，添加一个 CI 安全的回归测试（模拟 / 存根提供商，或捕获确切的请求形状转换）
- 如果它本质上只能通过 live 复现（限流、身份验证策略），让 live 测试保持范围小，并通过环境变量选择加入
- 优先定位到能捕获该缺陷的最小层级：
  - 提供商请求转换 / 重放缺陷 → 直接模型测试
  - Gateway 网关 会话 / 历史 / 工具流水线缺陷 → Gateway 网关 live 冒烟测试或 CI 安全的 Gateway 网关 模拟测试
- SecretRef 遍历防护：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个示例目标，然后断言遍历段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增一个 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会在目标 id 未分类时故意失败，这样新类别就无法被悄悄跳过。
