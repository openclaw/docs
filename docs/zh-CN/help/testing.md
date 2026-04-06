---
read_when:
    - 在本地或 CI 中运行测试时
    - 为模型 / 提供商 bug 添加回归测试时
    - 调试 Gateway 网关 + 智能体行为时
summary: 测试工具包：单元 / e2e / live 测试套件、Docker 运行器，以及各类测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-06T16:52:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d90ff6e00c3e03c480922529cdf77e508add1ca5fc1bdded3d0e4e16aa43d10
    source_path: help/testing.md
    workflow: 15
---

# 测试

OpenClaw 有三套 Vitest 测试（单元 / 集成、e2e、live）以及一小组 Docker 运行器。

本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么（以及它有意 _不_ 覆盖什么）
- 常见工作流应运行哪些命令（本地、推送前、调试）
- live 测试如何发现凭证并选择模型 / 提供商
- 如何为真实世界中的模型 / 提供商问题添加回归测试

## 快速开始

大多数时候：

- 完整门禁（推送前预期运行）：`pnpm build && pnpm check && pnpm test`
- 在配置充足的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接进入 Vitest 监听循环：`pnpm test:watch`
- 直接指定文件现在也会路由扩展 / 渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 基于 Docker 的 QA 站点：`pnpm qa:lab:up`

当你修改了测试或需要更高置信度时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- live 测试套件（模型 + Gateway 网关工具 / 图像探测）：`pnpm test:live`
- 静默运行单个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`

提示：当你只需要复现一个失败用例时，优先使用下文介绍的 allowlist 环境变量来缩小 live 测试范围。

## 测试套件（各自在哪里运行）

可以将这些测试套件理解为“真实度逐步增加”（同时也更容易波动 / 成本更高）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：基于现有作用域化 Vitest 项目的五个顺序分片运行（`vitest.full-*.config.ts`）
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 下的核心 / 单元测试清单，以及 `vitest.unit.config.ts` 覆盖的白名单 `ui` Node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关鉴权、路由、工具、解析、配置）
  - 已知 bug 的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
- 项目说明：
  - 未指定目标的 `pnpm test` 现在会运行五个更小的分片配置（`core-unit`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这能降低高负载机器上的峰值 RSS，并避免 auto-reply / extension 工作拖慢无关套件。
  - `pnpm test --watch` 仍然使用原生根级 `vitest.config.ts` 项目图，因为多分片监听循环并不现实。
  - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 现在会优先将显式文件 / 目录目标路由到作用域化通道，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不必承担完整根项目启动开销。
  - `pnpm test:changed` 会在差异只涉及可路由的源码 / 测试文件时，将变更过的 git 路径展开到同样的作用域化通道；配置 / setup 编辑仍会回退到更广泛的根项目重跑。
  - 部分 `plugin-sdk` 和 `commands` 测试也会通过专用轻量通道运行，并跳过 `test/setup-openclaw-runtime.ts`；而有状态 / 运行时较重的文件仍保留在现有通道上。
  - 部分 `plugin-sdk` 和 `commands` 辅助源文件也会让 changed 模式运行映射到这些轻量通道中的显式同级测试，因此辅助文件变更无需重跑该目录下完整的重型测试套件。
  - `auto-reply` 现在有三个专用分桶：顶层核心辅助、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树。这使最重的 reply harness 工作不会挤占便宜的 status / chunk / token 测试。
- 嵌入式运行器说明：
  - 当你修改消息工具发现输入或压缩运行时上下文时，
    要同时保留这两个层级的覆盖。
  - 为纯路由 / 规范化边界添加聚焦的辅助回归测试。
  - 同时也要保持嵌入式运行器集成测试套件健康：
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - 这些套件验证带作用域的 id 和压缩行为仍然会通过真实的 `run.ts` / `compact.ts` 路径流动；仅有辅助层测试不能充分替代这些集成路径。
- 进程池说明：
  - 基础 Vitest 配置现在默认使用 `threads`。
  - 共享 Vitest 配置还固定使用 `isolate: false`，并在根项目、e2e 和 live 配置中使用非隔离运行器。
  - 根 UI 通道仍保留其 `jsdom` setup 和优化器，但现在也运行在共享的非隔离运行器上。
  - 每个 `pnpm test` 分片都从共享 Vitest 配置继承同样的 `threads` + `isolate: false` 默认值。
  - 共享的 `scripts/run-vitest.mjs` 启动器现在默认还会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。如果你需要对比原生 V8 行为，可设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`。
- 本地快速迭代说明：
  - 当变更路径能明确映射到更小的测试套件时，`pnpm test:changed` 会通过作用域化通道运行。
  - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
  - 本地 worker 自动缩放现在刻意更保守，并且在主机负载平均值已经偏高时也会回退，因此默认情况下多个并发 Vitest 运行对机器的影响会更小。
  - 基础 Vitest 配置将这些项目 / 配置文件标记为 `forceRerunTriggers`，以便在测试接线发生变化时，changed 模式的重跑仍然正确。
  - 配置会在支持的主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接性能分析指定一个明确的缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
- 性能调试说明：
  - `pnpm test:perf:imports` 会启用 Vitest 导入时长报告以及导入明细输出。
  - `pnpm test:perf:imports:changed` 会将同样的性能视图限定到自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将已提交差异的路由式 `test:changed` 与原生根项目路径进行对比，并打印总耗时以及 macOS 最大 RSS。
- `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 与根 Vitest 配置，将当前脏工作树的变更文件列表路由后进行基准测试。
  - `pnpm test:perf:profile:main` 会为 Vitest / Vite 启动与转换开销写出主线程 CPU profile。
  - `pnpm test:perf:profile:runner` 会在禁用文件级并行时，为单元测试套件写出运行器 CPU + 堆 profile。

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- 运行时默认值：
  - 使用 Vitest `threads` 配合 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制指定 worker 数量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket / HTTP 接口、节点配对以及更重的网络路径
- 预期：
  - 在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比单元测试涉及更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟

- 命令：`pnpm test:e2e:openshell`
- 文件：`test/openshell-sandbox.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动隔离的 OpenShell Gateway 网关
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 演练 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远端规范化文件系统行为
- 预期：
  - 仅按需启用；不属于默认的 `pnpm test:e2e` 运行
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，随后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：手动运行更广泛 e2e 测试套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非默认的 CLI 二进制或包装脚本

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型在 _今天_ 搭配真实凭证时是否真的能工作？”
  - 捕捉提供商格式变化、工具调用怪癖、鉴权问题以及限流行为
- 预期：
  - 按设计不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗限额
  - 优先运行缩小范围的子集，而不是“全部”
- live 运行会 source `~/.profile` 以获取缺失的 API 密钥。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置 / 鉴权材料复制到临时测试 home 中，这样单元测试夹具就不会修改你真实的 `~/.openclaw`。
- 只有在你明确需要 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认采用更安静的模式：会保留 `[live] ...` 进度输出，但隐藏额外的 `~/.profile` 提示，并静默 Gateway 网关启动日志 / Bonjour 噪音。若要恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（提供商特定）：可设置逗号 / 分号格式的 `*_API_KEYS` 或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或通过 `OPENCLAW_LIVE_*_KEY` 为单个 live 运行覆盖；测试会在限流响应时重试。
- 进度 / 心跳输出：
  - live 测试套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获处于安静模式，长时间的提供商调用也会显示为正在进行。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此提供商 / Gateway 网关进度行会在 live 运行时立即流出。
  - 通过 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 通过 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探测心跳。

## 我应该运行哪个测试套件？

使用这个决策表：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果改动较多，再加上 `pnpm test:coverage`）
- 涉及 Gateway 网关网络 / WS 协议 / 配对：增加 `pnpm test:e2e`
- 调试“我的 bot 挂了” / 提供商特定故障 / 工具调用：运行缩小范围的 `pnpm test:live`

## Live：Android 节点能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android 节点当前**声明的每一条命令**，并断言命令契约行为。
- 范围：
  - 预设条件 / 手动 setup（该测试套件不会安装 / 运行 / 配对应用）。
  - 针对选定 Android 节点逐命令验证 Gateway 网关 `node.invoke`。
- 必需的预先 setup：
  - Android 应用已连接并与 Gateway 网关配对。
  - 应用保持在前台。
  - 你期望通过的能力所需权限 / 捕获许可已授予。
- 可选目标覆盖项：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android setup 详情： [Android App](/zh-CN/platforms/android)

## Live：模型冒烟（配置档案密钥）

live 测试拆分为两层，以便隔离故障：

- “直接模型”告诉我们：提供商 / 模型是否至少能用给定密钥回答。
- “Gateway 网关冒烟”告诉我们：该模型的完整 Gateway 网关 + 智能体流水线是否正常工作（会话、历史、工具、沙箱策略等）。

### 第 1 层：直接模型补全（无 Gateway 网关）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举已发现的模型
  - 使用 `getApiKeyForModel` 选择你有凭证的模型
  - 为每个模型运行一个小型补全（并在需要时运行有针对性的回归测试）
- 启用方式：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，即 modern 的别名）才会实际运行该测试套件；否则它会跳过，以便让 `pnpm test:live` 专注于 Gateway 网关冒烟
- 选择模型的方法：
  - `OPENCLAW_LIVE_MODELS=modern` 运行 modern allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是 modern allowlist 的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（逗号分隔 allowlist）
- 选择提供商的方法：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔 allowlist）
- 密钥来源：
  - 默认：profile store 和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制**仅使用 profile store**
- 存在意义：
  - 将“提供商 API 坏了 / 密钥无效”与“Gateway 网关智能体流水线坏了”区分开
  - 容纳小而隔离的回归测试（例如：OpenAI Responses / Codex Responses 的 reasoning replay + 工具调用流程）

### 第 2 层：Gateway 网关 + 开发智能体冒烟（也就是 “@openclaw” 实际做的事）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 Gateway 网关
  - 创建 / 修补一个 `agent:dev:*` 会话（每次运行覆盖模型）
  - 遍历所有带密钥的模型并断言：
    - “有意义的”回复（不使用工具）
    - 一个真实的工具调用可以工作（read probe）
    - 可选的额外工具探测可以工作（exec+read probe）
    - OpenAI 回归路径（仅工具调用 → 后续跟进）继续正常
- 探测细节（便于你快速解释故障）：
  - `read` probe：测试会在工作区中写入一个 nonce 文件，并要求智能体 `read` 该文件然后回显 nonce。
  - `exec+read` probe：测试要求智能体通过 `exec` 将 nonce 写入临时文件，然后再 `read` 回来。
  - image probe：测试会附加一个生成的 PNG（猫 + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 选择模型的方法：
  - 默认：modern allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 modern allowlist 的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）以缩小范围
- 选择提供商的方法（避免“OpenRouter 全家桶”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔 allowlist）
- 工具 + 图像探测在该 live 测试中始终开启：
  - `read` probe + `exec+read` probe`（工具压力测试）
  - 当模型声明支持图像输入时，会运行 image probe
  - 流程（高层）：
    - 测试会生成一个带有 “CAT” + 随机代码的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式智能体将多模态用户消息转发给模型
    - 断言：回复包含 `cat` + 该代码（OCR 容错：允许少量错误）

提示：要查看你的机器上可以测试哪些内容（以及精确的 `provider/model` id），请运行：
__OC_I18N_900000__
## Live：CLI 后端冒烟（Codex CLI 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway 网关 + 智能体流水线，同时不触碰你的默认配置。
- 启用：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 模型：`codex-cli/gpt-5.4`
  - 命令：`codex`
  - 参数：`["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`：发送真实图像附件（路径会注入到提示词中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`：将图像文件路径作为 CLI 参数传入，而不是通过提示词注入。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）：当设置 `IMAGE_ARG` 时，控制图像参数的传递方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`：发送第二轮消息并验证恢复流程。
  
示例：
__OC_I18N_900001__
Docker 配方：
__OC_I18N_900002__
说明：

- Docker 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它会在仓库 Docker 镜像中以非 root 的 `node` 用户身份运行 live CLI 后端冒烟测试。
- 对于 `codex-cli`，它会将 Linux 版 `@openai/codex` 包安装到一个可缓存、可写的前缀 `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（默认：`~/.cache/openclaw/docker-cli-tools`）。

## Live：ACP 绑定冒烟（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用 live ACP 智能体验证真实 ACP 会话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 就地绑定一个合成的消息渠道会话
  - 在同一会话中发送正常跟进消息
  - 验证该跟进消息落入已绑定的 ACP 会话转录中
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - ACP 智能体：`claude`
  - 合成渠道：类似 Slack 私信的会话上下文
  - ACP 后端：`acpx`
- 覆盖项：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 说明：
  - 该通道使用 Gateway 网关 `chat.send` 接口，并带有仅管理员可用的合成 originating-route 字段，因此测试可以附加消息渠道上下文，而无需假装实际向外部投递。
  - 当未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会使用嵌入式 `acpx` 插件内置的智能体注册表来选择 ACP harness 智能体。

示例：
__OC_I18N_900003__
Docker 配方：
__OC_I18N_900004__
Docker 说明：

- Docker 运行器位于 `scripts/test-live-acp-bind-docker.sh`。
- 它会 source `~/.profile`，将匹配的 CLI 鉴权材料暂存到容器中，把 `acpx` 安装到可写的 npm 前缀中，然后在缺失时安装所需的 live CLI（`@anthropic-ai/claude-code` 或 `@openai/codex`）。
- 在 Docker 内部，运行器会设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，以便 `acpx` 保持从已 source 的 profile 获得的提供商环境变量对子 harness CLI 可用。

### 推荐的 live 配方

范围窄、显式的 allowlist 速度最快，也最不容易波动：

- 单模型，直接（无 Gateway 网关）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，Gateway 网关冒烟：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 聚焦 Google（Gemini API 密钥 + Antigravity）：
  - Gemini（API 密钥）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

说明：

- `google/...` 使用 Gemini API（API 密钥）。
- `google-antigravity/...` 使用 Antigravity OAuth bridge（类似 Cloud Code Assist 的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（鉴权方式和工具行为怪癖不同）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API 密钥 / profile 鉴权）；这通常就是大多数用户说的 “Gemini”。
  - CLI：OpenClaw 通过 shell 调用本地 `gemini` 二进制；它有自己的鉴权方式，并且行为可能不同（流式传输 / 工具支持 / 版本偏差）。

## Live：模型矩阵（我们覆盖什么）

这里没有固定的“CI 模型列表”（live 是按需启用的），但以下是在有密钥的开发机上建议定期覆盖的**推荐**模型。

### 现代冒烟集（工具调用 + 图像）

这是我们期望持续保持可用的“常见模型”运行集：

- OpenAI（非 Codex）：`openai/gpt-5.4`（可选：`openai/gpt-5.4-mini`）
- OpenAI Codex：`openai-codex/gpt-5.4`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

运行带工具 + 图像的 Gateway 网关冒烟：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个提供商家族至少选一个：

- OpenAI：`openai/gpt-5.4`（或 `openai/gpt-5.4-mini`）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

可选的额外覆盖（有更好，没有也行）：

- xAI：`xai/grok-4`（或最新可用版本）
- Mistral：`mistral/`…（选择一个你已启用且具备工具能力的模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### Vision：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型（Claude / Gemini / OpenAI 支持 Vision 的变体等），以覆盖 image probe。

### 聚合器 / 替代 Gateway 网关

如果你已启用相关密钥，也支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图像的候选模型）
- OpenCode：`opencode/...` 用于 Zen，`opencode-go/...` 用于 Go（鉴权通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

如果你有凭证 / 配置，也可以将更多提供商纳入 live 矩阵：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云 / API），以及任何兼容 OpenAI / Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档里硬编码“所有模型”。权威列表应当始终是你的机器上 `discoverModels(...)` 的返回结果，加上当前可用的密钥。

## 凭证（绝不要提交）

live 测试发现凭证的方式与 CLI 完全相同。实际含义如下：

- 如果 CLI 能工作，live 测试应该能找到相同的密钥。
- 如果 live 测试提示“没有凭证”，就像调试 `openclaw models list` / 模型选择那样去调试。

- 每智能体鉴权 profile：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是 live 测试里 “profile keys” 的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（存在时会复制到暂存的 live home 中，但它不是主 profile-key store）
- 本地 live 运行默认会将当前配置、每智能体 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 鉴权目录复制到临时测试 home 中；在该暂存配置中会去除 `agents.*.workspace` / `agentDir` 路径覆盖，以确保探测不会落到你真实主机工作区。

如果你希望依赖环境变量密钥（例如导出在 `~/.profile` 中），请在本地测试前运行 `source ~/.profile`，或者使用下面的 Docker 运行器（它们可以将 `~/.profile` 挂载到容器中）。

## Deepgram live（音频转录）

- 测试：`src/media-understanding/providers/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus 编码计划 live

- 测试：`src/agents/byteplus.live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 可选模型覆盖项：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流媒体 live

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 覆盖内置 comfy 图像、视频和 `music_generate` 路径
  - 除非配置了 `models.providers.comfy.<capability>`，否则会跳过各项能力
  - 在修改 comfy 工作流提交、轮询、下载或插件注册后特别有用

## 图像生成 live

- 测试：`src/image-generation/runtime.live.test.ts`
- 命令：`pnpm test:live src/image-generation/runtime.live.test.ts`
- 范围：
  - 枚举每个已注册的图像生成 provider 插件
  - 在探测前从你的登录 shell（`~/.profile`）加载缺失的提供商环境变量
  - 默认优先使用 live / env API 密钥，而不是已存储的鉴权 profile，因此 `auth-profiles.json` 中陈旧的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用鉴权 / profile / 模型的提供商
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
- 可选鉴权行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制使用 profile store 鉴权并忽略仅环境变量覆盖

## 音乐生成 live

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 范围：
  - 覆盖共享的内置音乐生成提供商路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用 live / env API 密钥，而不是已存储的鉴权 profile，因此 `auth-profiles.json` 中陈旧的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用鉴权 / profile / 模型的提供商
  - 在可用时运行两种声明的运行时模式：
    - `generate`：仅提示词输入
    - `edit`：当提供商声明 `capabilities.edit.enabled` 时
  - 当前共享通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：使用单独的 Comfy live 文件，不在此共享扫描中
- 可选缩小范围：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 可选鉴权行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制使用 profile store 鉴权并忽略仅环境变量覆盖

## 视频生成 live

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 范围：
  - 覆盖共享的内置视频生成提供商路径
  - 在探测前从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用 live / env API 密钥，而不是已存储的鉴权 profile，因此 `auth-profiles.json` 中陈旧的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用鉴权 / profile / 模型的提供商
  - 在可用时运行两种声明的运行时模式：
    - `generate`：仅提示词输入
    - `imageToVideo`：当提供商声明 `capabilities.imageToVideo.enabled` 时
    - `videoToVideo`：当提供商声明 `capabilities.videoToVideo.enabled` 且所选提供商 / 模型在共享扫描中接受基于 buffer 的本地视频输入时
  - 当前 `videoToVideo` live 覆盖：
    - `google`
    - `openai`
    - 仅当所选模型为 `runway/gen4_aleph` 时覆盖 `runway`
  - 当前在共享扫描中已声明但跳过的 `videoToVideo` 提供商：
    - `alibaba`、`qwen`、`xai`，因为这些路径目前需要远程 `http(s)` / MP4 引用 URL
- 可选缩小范围：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- 可选鉴权行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制使用 profile store 鉴权并忽略仅环境变量覆盖

## Docker 运行器（可选的“可在 Linux 中工作”检查）

这些 Docker 运行器分为两类：

- live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行与其匹配的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（如果挂载了 `~/.profile`，也会 source 它）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认使用更小的冒烟上限，以保证完整 Docker 扫描仍然可行：
  `test:docker:live-models` 默认使用 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认使用 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确需要更大的穷举扫描时，再覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，然后在两个 live Docker 通道之间复用它。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels` 和 `test:docker:plugins` 会启动一个或多个真实容器，并验证更高层的集成路径。

live 模型 Docker 运行器还会只绑定挂载所需的 CLI 鉴权 home（或在未缩小运行范围时挂载所有受支持的鉴权 home），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就可以刷新令牌而不会修改主机鉴权存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Gateway 网关 + 开发智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live 冒烟：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Gateway 网关网络（两个容器，WS 鉴权 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- MCP 渠道桥接（带种子数据的 Gateway 网关 + stdio bridge + 原始 Claude 通知帧冒烟）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- 插件（安装冒烟 + `/plugin` 别名 + Claude bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）

live 模型 Docker 运行器还会以只读方式绑定挂载当前 checkout，并将其暂存到容器内的临时工作目录中。这能让运行时镜像保持精简，同时仍然针对你本地精确的源代码 / 配置运行 Vitest。
暂存步骤会跳过大型本地专用缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__` 以及应用本地 `.build` 或
Gradle 输出目录，因此 Docker live 运行不会花几分钟复制机器特定产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关 live 探测就不会在容器内启动真实的 Telegram / Discord / 等渠道 worker。
`test:docker:live-models` 仍然会运行 `pnpm test:live`，因此当你需要在该 Docker 通道中缩小或排除 Gateway 网关 live 覆盖时，也请传入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是更高层的兼容性冒烟：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，针对该 Gateway 网关启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一条真实聊天请求。
首次运行可能明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI 也可能需要完成自身冷启动 setup。
该通道需要一个可用的 live 模型密钥，而 `OPENCLAW_PROFILE_FILE`
（默认 `~/.profile`）是在 Docker 化运行中提供它的主要方式。
成功运行会打印一个小型 JSON 载荷，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 刻意设计为确定性测试，不需要真实的
Telegram、Discord 或 iMessage 账号。它会启动一个带种子数据的 Gateway 网关
容器，再启动第二个容器以拉起 `openclaw mcp serve`，然后验证真实 stdio MCP bridge 上的路由会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 +
权限通知。通知检查会直接检视原始 stdio MCP 帧，因此该冒烟测试验证的是
bridge 实际发出的内容，而不仅仅是某个特定客户端 SDK 恰好暴露的内容。

手动 ACP 自然语言线程冒烟（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 请保留这个脚本用于回归 / 调试工作流。之后可能还需要它来验证 ACP 线程路由，因此不要删除它。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile` 并在运行测试前 source
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于在 Docker 内缓存 CLI 安装
- `$HOME` 下的外部 CLI 鉴权目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小提供商范围的运行只会挂载根据 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 手动覆盖方式：`OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤提供商
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 确保凭证来自 profile store（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 选择 Gateway 网关为 Open WebUI 冒烟暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 覆盖 Open WebUI 冒烟所使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

编辑文档后运行文档检查：`pnpm check:docs`。
当你还需要完整的 Mintlify anchor 校验（包括页内标题检查）时，请运行：`pnpm docs:check-links:anchors`。

## 离线回归（CI 安全）

这些是在不接入真实提供商的情况下，对“真实流水线”进行的回归测试：

- Gateway 网关工具调用（mock OpenAI，真实 Gateway 网关 + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start` / `wizard.next`，写入配置 + 强制鉴权）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评测（Skills）

我们已经有一些 CI 安全的测试，它们的行为类似“智能体可靠性评测”：

- 通过真实 Gateway 网关 + 智能体循环进行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills（参见 [Skills](/tools/skills)），目前仍然缺少：

- **决策能力：**当提示词中列出 Skills 时，智能体是否会选择正确的 Skill（或避开无关 Skill）？
- **合规性：**智能体在使用前是否会读取 `SKILL.md` 并遵循所需步骤 / 参数？
- **工作流契约：**断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来的评测应优先保持确定性：

- 一个使用 mock 提供商的场景运行器，用于断言工具调用 + 顺序、Skill 文件读取以及会话接线。
- 一小套以 Skill 为重点的场景（使用 vs 避免、门禁、提示注入）。
- 只有在 CI 安全集合到位之后，才添加可选的 live 评测（按需启用、受环境变量控制）。

## 契约测试（plugin 和 channel 形状）

契约测试用于验证每个已注册 plugin 和 channel 都符合其接口契约。它们会遍历所有已发现的插件，并运行一组形状与行为断言。默认的 `pnpm test` 单元通道会刻意跳过这些共享接缝和冒烟文件；当你修改共享 channel 或 provider 接口时，请显式运行这些契约命令。

### 命令

- 所有契约测试：`pnpm test:contracts`
- 仅 channel 契约测试：`pnpm test:contracts:channels`
- 仅 provider 契约测试：`pnpm test:contracts:plugins`

### Channel 契约测试

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息载荷结构
- **inbound** - 入站消息处理
- **actions** - 渠道动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / 花名册 API
- **group-policy** - 群组策略执行

### Provider 状态契约测试

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - Channel 状态探测
- **registry** - Plugin 注册表形状

### Provider 契约测试

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 鉴权流程契约
- **auth-choice** - 鉴权选择 / 选择逻辑
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - Provider 运行时
- **shape** - 插件形状 / 接口
- **wizard** - 设置向导

### 何时运行

- 修改 plugin-sdk 导出或子路径之后
- 添加或修改 channel 或 provider 插件之后
- 重构插件注册或发现逻辑之后

契约测试会在 CI 中运行，并且不需要真实 API 密钥。

## 添加回归测试（指导）

当你修复 live 中发现的某个 provider / model 问题时：

- 如果可能，添加一个 CI 安全的回归测试（mock / stub provider，或捕获精确的请求形状转换）
- 如果问题本质上只能在 live 中复现（限流、鉴权策略），就让 live 测试保持范围狭窄，并通过环境变量按需启用
- 优先瞄准能捕获该 bug 的最小层级：
  - provider 请求转换 / 回放 bug → 直接模型测试
  - Gateway 网关会话 / 历史 / 工具流水线 bug → Gateway 网关 live 冒烟或 CI 安全的 Gateway 网关 mock 测试
- SecretRef 遍历护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言遍历段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加了新的 `includeInPlan` SecretRef 目标家族，请更新该测试中的 `classifyTargetClass`。该测试会在遇到未分类目标 id 时故意失败，从而确保不会静默跳过新类别。
