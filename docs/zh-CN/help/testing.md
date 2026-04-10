---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型 / 提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元 / e2e / 实时测试套件、Docker 运行器，以及每项测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-10T13:50:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40f29e8db015921a0b6a928517b28440d49b5fb63701e68cb66a1297063012ab
    source_path: help/testing.md
    workflow: 15
---

# 测试

OpenClaw 有三套 Vitest 测试套件（单元 / 集成、e2e、实时测试）以及一小组 Docker 运行器。

这份文档是“我们如何测试”的指南：

- 每个测试套件覆盖什么内容（以及它**刻意不**覆盖什么）
- 常见工作流应运行哪些命令（本地、推送前、调试）
- 实时测试如何发现凭证，以及如何选择模型 / 提供商
- 如何为真实世界中的模型 / 提供商问题添加回归测试

## 快速开始

大多数时候：

- 完整门禁（预期应在推送前运行）：`pnpm build && pnpm check && pnpm test`
- 在配置充裕的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接使用 Vitest 监听循环：`pnpm test:watch`
- 现在直接指定文件也会路由到扩展 / 渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代单个失败用例时，优先运行有针对性的测试。
- 基于 Docker 的 QA 站点：`pnpm qa:lab:up`
- 基于 Linux VM 的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试或想要更高置信度时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- 实时测试套件（模型 + Gateway 网关工具 / 图像探测）：`pnpm test:live`
- 安静地只运行一个实时测试文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`

提示：如果你只需要一个失败用例，优先通过下面描述的 allowlist 环境变量来缩小实时测试范围。

## QA 专用运行器

当你需要接近 qa-lab 的真实环境时，这些命令与主测试套件并列使用：

- `pnpm openclaw qa suite`
  - 直接在主机上运行基于仓库的 QA 场景。
  - 默认会并行运行多个选定场景，并使用隔离的 Gateway 网关 worker，最多 64 个 worker，或以所选场景数量为上限。使用 `--concurrency <count>` 调整 worker 数量，或用 `--concurrency 1` 使用旧的串行通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 Multipass Linux VM 中运行相同的 QA 测试套件。
  - 保留与主机上 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商 / 模型选择参数。
  - 实时运行会转发适合来宾环境的受支持 QA 凭证输入：
    基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须位于仓库根目录下，这样来宾才能通过挂载的工作区回写结果。
  - 会将常规 QA 报告 + 摘要以及 Multipass 日志写入 `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动基于 Docker 的 QA 站点，供偏操作员风格的 QA 工作使用。

## 测试套件（每套在哪运行）

可以把这些测试套件理解为“真实度逐步提高”（同时波动性 / 成本也逐步提高）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：对现有分域 Vitest project 进行十个顺序分片运行（`vitest.full-*.config.ts`）
- 文件：`vitest.unit.config.ts` 覆盖的 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 下的核心 / 单元测试清单，以及列入白名单的 `ui` Node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
- Projects 说明：
  - 未指定目标的 `pnpm test` 现在会运行 11 个更小的分片配置（`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生 root-project 进程。这样可以降低高负载机器上的峰值 RSS，并避免 auto-reply / 扩展相关工作拖慢无关测试套件。
  - `pnpm test --watch` 仍然使用原生根级 `vitest.config.ts` project graph，因为多分片的 watch 循环并不现实。
  - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 现在会优先把显式文件 / 目录目标路由到对应的分域通道，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不必支付完整 root project 启动成本。
  - 当 diff 只涉及可路由的源文件 / 测试文件时，`pnpm test:changed` 会把变更过的 git 路径展开到相同的分域通道；配置 / setup 编辑仍会回退到更广泛的 root-project 重跑。
  - 部分 `plugin-sdk` 和 `commands` 测试也会通过专用的轻量通道运行，以跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时开销较大的文件仍保留在现有通道中。
  - 部分 `plugin-sdk` 和 `commands` 辅助源文件在 changed 模式下也会映射到这些轻量通道中的显式同级测试，因此修改 helper 时无需重跑该目录下的整套重型测试。
  - `auto-reply` 现在有三个专用分桶：顶层核心 helper、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树。这使最重的 reply harness 工作不会影响轻量的状态 / chunk / token 测试。
- 嵌入式运行器说明：
  - 当你修改消息工具发现输入或压缩运行时上下文时，
    要同时保留两个层级的覆盖。
  - 为纯路由 / 归一化边界添加聚焦的 helper 回归测试。
  - 还要保持嵌入式运行器集成测试套件健康：
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`，以及
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - 这些测试套件验证带作用域的 id 和压缩行为仍然会通过真实的 `run.ts` / `compact.ts` 路径流动；仅有 helper 级测试并不能充分替代这些集成路径。
- 线程池说明：
  - 基础 Vitest 配置现在默认使用 `threads`。
  - 共享 Vitest 配置还固定设置了 `isolate: false`，并在根级 projects、e2e 和实时测试配置中使用非隔离运行器。
  - 根级 UI 通道仍保留其 `jsdom` setup 和 optimizer，但现在也运行在共享的非隔离运行器上。
  - 每个 `pnpm test` 分片都继承共享 Vitest 配置中的相同 `threads` + `isolate: false` 默认值。
  - 共享的 `scripts/run-vitest.mjs` 启动器现在还会默认给 Vitest 子 Node 进程加上 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。如果你需要对比原始 V8 行为，可设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`。
- 本地快速迭代说明：
  - 当变更路径可以清晰映射到更小的测试套件时，`pnpm test:changed` 会通过分域通道进行路由。
  - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
  - 本地 worker 自动扩缩容现在有意更加保守，并且当主机负载平均值已经很高时也会自动回退，因此默认情况下多个并发 Vitest 运行对系统的影响更小。
  - 基础 Vitest 配置会把 projects / config 文件标记为 `forceRerunTriggers`，以确保测试接线变化时 changed 模式的重跑仍然正确。
  - 配置会在受支持的主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你希望为直接性能分析指定一个明确的缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
- 性能调试说明：
  - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入细分输出。
  - `pnpm test:perf:imports:changed` 会把同样的性能分析视图限制到自 `origin/main` 以来发生变化的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 会把当前提交 diff 的已路由 `test:changed` 与原生 root-project 路径进行比较，并输出耗时以及 macOS 最大 RSS。
- `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和根级 Vitest 配置，将当前未提交工作树中的变更文件列表进行路由，并对其进行基准测试。
  - `pnpm test:perf:profile:main` 会为 Vitest / Vite 启动与转换开销写出主线程 CPU profile。
  - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为单元测试套件写出 runner 的 CPU + 堆 profile。

### E2E（Gateway 网关冒烟测试）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- 运行时默认值：
  - 使用 Vitest `threads` 和 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖选项：
  - `OPENCLAW_E2E_WORKERS=<n>`：强制指定 worker 数量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1`：重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket / HTTP 接口、节点配对，以及更重型的网络行为
- 预期：
  - 在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比单元测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`test/openshell-sandbox.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell Gateway 网关
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远端规范文件系统行为
- 预期：
  - 仅按需启用；不属于默认的 `pnpm test:e2e` 运行范围
  - 需要本地 `openshell` CLI 和可用的 Docker 守护进程
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，随后销毁测试 Gateway 网关和沙箱
- 常用覆盖选项：
  - `OPENCLAW_E2E_OPENSHELL=1`：在手动运行更广泛的 e2e 测试套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非默认 CLI 二进制文件或包装脚本

### 实时测试（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`
- 默认：由 `pnpm test:live` **启用**（会设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型**今天**在真实凭证下是否真的可用？”
  - 捕获提供商格式变化、工具调用怪癖、认证问题和速率限制行为
- 预期：
  - 按设计并不适合作为稳定的 CI 测试（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 更推荐运行缩小范围的子集，而不是“全部”
- 实时运行会读取 `~/.profile`，以获取缺失的 API key。
- 默认情况下，实时运行仍会隔离 `HOME`，并将配置 / 认证材料复制到临时测试 home 中，这样单元测试 fixture 就不会修改你的真实 `~/.openclaw`。
- 仅当你明确需要让实时测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：会保留 `[live] ...` 进度输出，但隐藏额外的 `~/.profile` 提示，并静音 Gateway 网关启动日志 / Bonjour 杂讯。若想恢复完整启动日志，可设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（按提供商区分）：设置 `*_API_KEYS`，使用逗号 / 分号格式，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可以通过 `OPENCLAW_LIVE_*_KEY` 做实时测试级覆盖；测试在遇到速率限制响应时会重试。
- 进度 / 心跳输出：
  - 实时测试套件现在会把进度行输出到 stderr，因此即使 Vitest 控制台捕获处于安静模式，长时间的提供商调用也会显示为仍在活动中。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此提供商 / Gateway 网关进度行会在实时测试运行期间立即流出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直连模型的心跳间隔。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探测心跳间隔。

## 我应该运行哪套测试？

使用这个决策表：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果你改动很多，再加上 `pnpm test:coverage`）
- 修改 Gateway 网关网络 / WS 协议 / 配对：加上 `pnpm test:e2e`
- 调试“我的机器人挂了” / 提供商特定故障 / 工具调用：运行缩小范围的 `pnpm test:live`

## 实时测试：Android 节点能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android 节点**当前声明的每一个命令**，并断言命令契约行为。
- 范围：
  - 基于前置条件 / 手动 setup（该测试套件不会安装 / 运行 / 配对应用）。
  - 对所选 Android 节点逐个命令执行 Gateway 网关 `node.invoke` 验证。
- 必需的预先 setup：
  - Android 应用已连接并已与 Gateway 网关配对。
  - 应用保持在前台。
  - 已为你期望通过的能力授予权限 / 捕获同意。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android setup 详情：[Android App](/zh-CN/platforms/android)

## 实时测试：模型冒烟测试（profile 密钥）

实时测试分为两层，这样我们可以隔离故障：

- “直连模型”告诉我们，在给定密钥下，提供商 / 模型是否至少能响应。
- “Gateway 网关冒烟测试”告诉我们，针对该模型，完整的 Gateway 网关 + 智能体流水线是否正常工作（会话、历史记录、工具、沙箱策略等）。

### 第 1 层：直连模型补全（无 Gateway 网关）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举已发现的模型
  - 使用 `getApiKeyForModel` 选择你拥有凭证的模型
  - 为每个模型运行一次小型补全（并在需要时运行定向回归测试）
- 启用方式：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，即 modern 的别名）来实际运行此测试套件；否则它会跳过，以便让 `pnpm test:live` 继续聚焦于 Gateway 网关冒烟测试
- 如何选择模型：
  - `OPENCLAW_LIVE_MODELS=modern` 运行 modern allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是 modern allowlist 的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（逗号分隔 allowlist）
  - modern / all 扫描默认使用精心挑选的高信号上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 可执行穷尽式 modern 扫描，或设置为正数以使用更小的上限。
- 如何选择提供商：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔 allowlist）
- 密钥来源：
  - 默认：profile 存储和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 以强制**仅使用 profile 存储**
- 存在原因：
  - 用来区分“提供商 API 坏了 / 密钥无效”和“Gateway 网关智能体流水线坏了”
  - 容纳小型、隔离的回归测试（例如：OpenAI Responses / Codex Responses 的推理重放 + 工具调用流程）

### 第 2 层：Gateway 网关 + dev 智能体冒烟测试（也就是 “@openclaw” 实际执行的内容）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 Gateway 网关
  - 创建 / 修补一个 `agent:dev:*` 会话（每次运行时覆盖模型）
  - 遍历带密钥的模型并断言：
    - 有“有意义”的响应（不使用工具）
    - 真实工具调用可用（read 探测）
    - 可选的额外工具探测（exec+read 探测）
    - OpenAI 回归路径（仅工具调用 → 后续跟进）继续正常工作
- 探测细节（这样你可以快速解释失败原因）：
  - `read` 探测：测试会在工作区写入一个 nonce 文件，并要求智能体 `read` 该文件并把 nonce 回显出来。
  - `exec+read` 探测：测试会要求智能体通过 `exec` 将 nonce 写入一个临时文件，然后再 `read` 回来。
  - 图像探测：测试会附加一个生成的 PNG（猫 + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 如何选择模型：
  - 默认：modern allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 modern allowlist 的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号分隔列表）以缩小范围
  - modern / all Gateway 网关扫描默认使用精心挑选的高信号上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可执行穷尽式 modern 扫描，或设置为正数以使用更小的上限。
- 如何选择提供商（避免“OpenRouter 全家桶”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔 allowlist）
- 工具 + 图像探测在这个实时测试中始终开启：
  - `read` 探测 + `exec+read` 探测（工具压力测试）
  - 当模型声明支持图像输入时，会运行图像探测
  - 流程（高层级）：
    - 测试生成一个带有 “CAT” + 随机代码的小 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式智能体向模型转发一条多模态用户消息
    - 断言：回复包含 `cat` + 该代码（OCR 容错：允许轻微错误）

提示：如果你想查看你的机器上能测试什么（以及准确的 `provider/model` id），请运行：

```bash
openclaw models list
openclaw models list --json
```

## 实时测试：CLI 后端冒烟测试（Claude、Codex、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：在不触碰默认配置的情况下，使用本地 CLI 后端验证 Gateway 网关 + 智能体流水线。
- 后端特定的冒烟测试默认值位于对应扩展的 `cli-backend.ts` 定义中。
- 启用：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认提供商 / 模型：`claude-cli/claude-sonnet-4-6`
  - 命令 / 参数 / 图像行为来自对应 CLI 后端插件元数据。
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 发送真实图像附件（路径会注入到提示词中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 通过 CLI 参数传递图像文件路径，而不是注入到提示词中。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）用于控制在设置了 `IMAGE_ARG` 时如何传递图像参数。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮消息并验证恢复流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` 禁用默认的 Claude Sonnet -> Opus 同会话连续性探测（当所选模型支持切换目标时，设置为 `1` 可强制启用）。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker 用法：

```bash
pnpm test:docker:live-cli-backend
```

单提供商 Docker 用法：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

说明：

- Docker 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它会在仓库 Docker 镜像内，以非 root 的 `node` 用户身份运行实时 CLI 后端冒烟测试。
- 它会从对应扩展解析 CLI 冒烟测试元数据，然后把匹配的 Linux CLI 包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到可缓存的可写前缀 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 中（默认：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要通过 `~/.claude/.credentials.json` 中的 `claudeAiOauth.subscriptionType`，或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN`，提供可移植的 Claude Code 订阅 OAuth。它会先证明 Docker 中直接 `claude -p` 可用，然后在不保留 Anthropic API key 环境变量的情况下运行两轮 Gateway 网关 CLI 后端测试。这个订阅通道默认会禁用 Claude MCP / 工具和图像探测，因为 Claude 当前会将第三方应用使用路由到额外使用量计费，而不是普通订阅计划限额。
- 实时 CLI 后端冒烟测试现在会对 Claude、Codex 和 Gemini 执行相同的端到端流程：文本轮次、图像分类轮次，然后通过 Gateway 网关 CLI 验证 MCP `cron` 工具调用。
- Claude 的默认冒烟测试还会把会话从 Sonnet 修补到 Opus，并验证恢复后的会话仍记得之前的备注。

## 实时测试：ACP 绑定冒烟测试（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用实时 ACP 智能体验证真实 ACP 会话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 原地绑定一个合成的消息渠道会话
  - 在同一个会话上发送一条普通后续消息
  - 验证后续消息落入已绑定的 ACP 会话转录中
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
- 说明：
  - 这个通道使用 Gateway 网关 `chat.send` 接口，并带有仅管理员可用的合成 originating-route 字段，因此测试可以附加消息渠道上下文，而无需伪装成外部投递。
  - 当未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会为所选 ACP harness 智能体使用内置 `acpx` 插件的内建智能体注册表。

示例：

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker 用法：

```bash
pnpm test:docker:live-acp-bind
```

单智能体 Docker 用法：

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-acp-bind-docker.sh`。
- 默认情况下，它会按顺序对所有受支持的实时 CLI 智能体运行 ACP 绑定冒烟测试：`claude`、`codex`，然后 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 可以缩小测试矩阵。
- 它会读取 `~/.profile`，将匹配的 CLI 认证材料暂存到容器中，把 `acpx` 安装到可写 npm 前缀，然后在缺失时安装请求的实时 CLI（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）。
- 在 Docker 内，运行器会设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，这样 acpx 就能让从已读取 profile 中获得的提供商环境变量继续对其子 harness CLI 可用。

### 推荐的实时测试用法

范围明确的窄 allowlist 速度最快，也最不容易波动：

- 单模型，直连（无 Gateway 网关）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，Gateway 网关冒烟测试：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 聚焦（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

说明：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth bridge（类似 Cloud Code Assist 风格的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（单独的认证 + 工具行为差异）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API key / profile 认证）；这通常就是大多数用户所说的 “Gemini”。
  - CLI：OpenClaw 会 shell out 到本地 `gemini` 二进制；它有自己的认证方式，而且行为可能不同（流式传输 / 工具支持 / 版本偏差）。

## 实时测试：模型矩阵（我们覆盖什么）

没有固定的“CI 模型列表”（实时测试是按需启用的），但以下是**推荐**在有密钥的开发机上定期覆盖的模型。

### 现代冒烟测试集合（工具调用 + 图像）

这是我们预期应持续可用的“常见模型”运行集合：

- OpenAI（非 Codex）：`openai/gpt-5.4`（可选：`openai/gpt-5.4-mini`）
- OpenAI Codex：`openai-codex/gpt-5.4`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

运行带工具 + 图像的 Gateway 网关冒烟测试：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个提供商家族至少选择一个：

- OpenAI：`openai/gpt-5.4`（或 `openai/gpt-5.4-mini`）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

可选附加覆盖（有则更好）：

- xAI：`xai/grok-4`（或当前最新可用版本）
- Mistral：`mistral/`…（选择一个你已启用、支持 “tools” 的模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### 视觉：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型（Claude / Gemini / OpenAI 支持视觉的变体等），以执行图像探测。

### 聚合器 / 替代 Gateway 网关

如果你启用了相应密钥，我们也支持通过以下方式进行测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图像的候选项）
- OpenCode：`opencode/...` 用于 Zen，`opencode-go/...` 用于 Go（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 认证）

你也可以将更多提供商纳入实时测试矩阵（如果你有凭证 / 配置）：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云 / API），以及任何兼容 OpenAI / Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档中硬编码“所有模型”。权威列表应始终是你机器上的 `discoverModels(...)` 返回结果 + 当前可用的密钥。

## 凭证（绝不要提交）

实时测试发现凭证的方式与 CLI 完全相同。实际含义是：

- 如果 CLI 可用，实时测试通常也应能找到相同的密钥。
- 如果某个实时测试提示“无凭证”，就像调试 `openclaw models list` / 模型选择那样进行调试。

- 每个智能体的认证 profile：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是实时测试中 “profile keys” 的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（若存在，会复制到已暂存的实时测试 home 中，但它不是主 profile-key 存储）
- 本地实时运行默认会把当前活动配置、每个智能体的 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 认证目录复制到临时测试 home 中；已暂存的实时测试 home 会跳过 `workspace/` 和 `sandboxes/`，并去除 `agents.*.workspace` / `agentDir` 路径覆盖，这样探测就不会落到你真实主机的工作区上。

如果你想依赖环境变量密钥（例如已导出到你的 `~/.profile` 中），请在执行本地测试前运行 `source ~/.profile`，或者使用下面的 Docker 运行器（它们可以把 `~/.profile` 挂载进容器）。

## Deepgram 实时测试（音频转录）

- 测试：`src/media-understanding/providers/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus 编码计划实时测试

- 测试：`src/agents/byteplus.live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流媒体实时测试

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 运行内置 comfy 图像、视频和 `music_generate` 路径
  - 除非配置了 `models.providers.comfy.<capability>`，否则会跳过对应能力
  - 在你修改 comfy 工作流提交、轮询、下载或插件注册后尤其有用

## 图像生成实时测试

- 测试：`src/image-generation/runtime.live.test.ts`
- 命令：`pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图像生成提供商插件
  - 在探测前从你的登录 shell（`~/.profile`）加载缺失的提供商环境变量
  - 默认优先使用实时 / 环境变量 API key，而不是已存储的认证 profile，这样 `auth-profiles.json` 中过期的测试密钥就不会掩盖真实 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
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
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile 存储认证，并忽略仅环境变量覆盖

## 音乐生成实时测试

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media music`
- 范围：
  - 运行共享的内置音乐生成提供商路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用实时 / 环境变量 API key，而不是已存储的认证 profile，这样 `auth-profiles.json` 中过期的测试密钥就不会掩盖真实 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 在可用时同时运行两种已声明的运行时模式：
    - 使用仅提示词输入的 `generate`
    - 当提供商声明 `capabilities.edit.enabled` 时运行 `edit`
  - 当前共享通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：独立的 Comfy 实时测试文件，不在这个共享扫描中
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
  - 运行共享的内置视频生成提供商路径
  - 在探测前从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用实时 / 环境变量 API key，而不是已存储的认证 profile，这样 `auth-profiles.json` 中过期的测试密钥就不会掩盖真实 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 在可用时同时运行两种已声明的运行时模式：
    - 使用仅提示词输入的 `generate`
    - 当提供商声明 `capabilities.imageToVideo.enabled` 且所选提供商 / 模型在共享扫描中接受基于 buffer 的本地图像输入时运行 `imageToVideo`
    - 当提供商声明 `capabilities.videoToVideo.enabled` 且所选提供商 / 模型在共享扫描中接受基于 buffer 的本地视频输入时运行 `videoToVideo`
  - 当前在共享扫描中已声明但被跳过的 `imageToVideo` 提供商：
    - `vydra`，因为内置 `veo3` 仅支持文本，且内置 `kling` 需要远程图像 URL
  - 提供商特定的 Vydra 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件会运行 `veo3` 文本转视频，以及一个默认使用远程图像 URL fixture 的 `kling` 通道
  - 当前 `videoToVideo` 实时测试覆盖：
    - 仅 `runway`，且前提是所选模型为 `runway/gen4_aleph`
  - 当前在共享扫描中已声明但被跳过的 `videoToVideo` 提供商：
    - `alibaba`、`qwen`、`xai`，因为这些路径当前需要远程 `http(s)` / MP4 参考 URL
    - `google`，因为当前共享的 Gemini / Veo 通道使用本地基于 buffer 的输入，而该路径在共享扫描中不被接受
    - `openai`，因为当前共享通道不保证具备组织级视频修补 / remix 访问权限
- 可选缩小范围：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile 存储认证，并忽略仅环境变量覆盖

## 媒体实时测试 harness

- 命令：`pnpm test:live:media`
- 目的：
  - 通过一个仓库原生入口运行共享的图像、音乐和视频实时测试套件
  - 自动从 `~/.profile` 加载缺失的提供商环境变量
  - 默认自动将每个测试套件缩小到当前具备可用认证的提供商
  - 复用 `scripts/test-live.mjs`，因此心跳和静默模式行为保持一致
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- 实时模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行各自匹配的 profile-key 实时测试文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（如果挂载了 `~/.profile`，也会读取它）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 实时运行器默认使用更小的冒烟测试上限，以便完整的 Docker 扫描仍然切实可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确想要更大范围的穷尽式扫描时，再覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次实时 Docker 镜像，然后在两个实时 Docker 通道中复用它。
- 容器冒烟测试运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels` 和 `test:docker:plugins` 会启动一个或多个真实容器，并验证更高层级的集成路径。

这些实时模型 Docker 运行器还会只绑定挂载所需的 CLI 认证主目录（如果运行未缩小范围，则挂载所有受支持的目录），然后在运行前把它们复制到容器 home 中，这样外部 CLI OAuth 就能刷新令牌，而不会修改主机上的认证存储：

- 直连模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI 实时冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- MCP 渠道桥接（带种子数据的 Gateway 网关 + stdio bridge + 原始 Claude 通知帧冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- 插件（安装冒烟测试 + `/plugin` 别名 + Claude bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）

这些实时模型 Docker 运行器还会以只读方式绑定挂载当前 checkout，
并将其暂存到容器内的临时工作目录中。这样既能让运行时镜像保持精简，
又仍然可以针对你本地精确的源代码 / 配置运行 Vitest。
暂存步骤会跳过大型本地专用缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地的 `.build` 或
Gradle 输出目录，因此 Docker 实时测试运行不会花上几分钟去复制机器相关的产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关实时探测就不会在容器中启动
真实的 Telegram / Discord / 等渠道 worker。
`test:docker:live-models` 仍然会运行 `pnpm test:live`，因此当你需要缩小范围或排除该 Docker 通道中的 Gateway 网关实时测试覆盖时，也请一并传入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个
启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，
再针对该 Gateway 网关启动一个固定版本的 Open WebUI 容器，通过
Open WebUI 完成登录，验证 `/api/models` 暴露出 `openclaw/default`，然后通过
Open WebUI 的 `/api/chat/completions` 代理发送一次真实聊天请求。
第一次运行可能会明显更慢，因为 Docker 可能需要拉取
Open WebUI 镜像，而 Open WebUI 也可能需要完成它自己的冷启动 setup。
这个通道需要一个可用的实时模型密钥，而 `OPENCLAW_PROFILE_FILE`
（默认 `~/.profile`）是在 Docker 化运行中提供它的主要方式。
成功运行会打印一小段 JSON 载荷，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是有意保持确定性的，不需要真实的
Telegram、Discord 或 iMessage 账号。它会启动一个带种子数据的 Gateway 网关
容器，启动第二个容器来运行 `openclaw mcp serve`，然后
通过真实的 stdio MCP bridge 验证已路由会话发现、转录读取、附件元数据、
实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 +
权限通知。通知检查会直接检查原始 stdio MCP 帧，因此该冒烟测试验证的是桥接
实际发出了什么，而不仅仅是某个特定客户端 SDK 恰好暴露了什么。

手动 ACP 纯自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留这个脚本用于回归 / 调试工作流。未来可能还需要它来验证 ACP 线程路由，因此不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`），挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`），挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`），挂载到 `/home/node/.profile`，并在运行测试前读取
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`），挂载到 `/home/node/.npm-global`，用于缓存 Docker 内部安装的 CLI
- `$HOME` 下的外部 CLI 认证目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围的提供商运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 手动覆盖方式：`OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或逗号分隔列表，例如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用现有的 `openclaw:local-live` 镜像，以便在无需重建时重复运行
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试中使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

编辑文档后运行文档检查：`pnpm check:docs`。
当你还需要完整的 Mintlify 锚点校验（包括页内标题检查）时，运行：`pnpm docs:check-links:anchors`。

## 离线回归测试（CI 安全）

这些是在不依赖真实提供商的情况下，针对“真实流水线”的回归测试：

- Gateway 网关工具调用（模拟 OpenAI，真实 Gateway 网关 + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start` / `wizard.next`，会写入配置 + 强制认证）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些 CI 安全的测试，它们的行为类似“智能体可靠性评估”：

- 通过真实 Gateway 网关 + 智能体循环执行模拟工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills，仍然缺少以下内容（参见 [Skills](/zh-CN/tools/skills)）：

- **决策**：当 Skills 列在提示词中时，智能体是否会选择正确的 Skills（或避免无关 Skills）？
- **合规性**：智能体在使用前是否会读取 `SKILL.md` 并遵循必需的步骤 / 参数？
- **工作流契约**：断言工具顺序、会话历史延续以及沙箱边界的多轮场景。

未来的评估应当优先保持确定性：

- 一个使用模拟提供商的场景运行器，用于断言工具调用 + 顺序、Skills 文件读取以及会话接线。
- 一小套面向 Skills 的场景（使用 vs 避免、门禁、提示注入）。
- 仅在 CI 安全套件就位之后，再添加可选的实时评估（按需启用、环境变量门控）。

## 契约测试（插件和渠道形状）

契约测试用于验证每个已注册的插件和渠道都符合其
接口契约。它们会遍历所有已发现的插件，并运行一组
针对形状和行为的断言。默认的 `pnpm test` 单元测试通道会有意
跳过这些共享接缝和冒烟测试文件；当你修改共享渠道或提供商表面时，
请显式运行契约测试命令。

### 命令

- 所有契约测试：`pnpm test:contracts`
- 仅渠道契约测试：`pnpm test:contracts:channels`
- 仅提供商契约测试：`pnpm test:contracts:plugins`

### 渠道契约测试

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、名称、能力）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息载荷结构
- **inbound** - 入站消息处理
- **actions** - 渠道操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略执行

### 提供商状态契约测试

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件注册表形状

### 提供商契约测试

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择 / 选取
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状 / 接口
- **wizard** - 设置向导

### 何时运行

- 修改 `plugin-sdk` 导出或子路径之后
- 新增或修改渠道插件或提供商插件之后
- 重构插件注册或发现机制之后

契约测试会在 CI 中运行，并且不需要真实 API key。

## 添加回归测试（指南）

当你修复了在实时测试中发现的提供商 / 模型问题时：

- 如果可能，添加一个 CI 安全的回归测试（模拟 / stub 提供商，或捕获精确的请求形状转换）
- 如果问题本质上只能在实时测试中复现（速率限制、认证策略），就让实时测试保持范围狭窄，并通过环境变量按需启用
- 优先瞄准能够捕获该缺陷的最小层级：
  - 提供商请求转换 / 重放缺陷 → 直连模型测试
  - Gateway 网关会话 / 历史记录 / 工具流水线缺陷 → Gateway 网关实时冒烟测试或 CI 安全的 Gateway 网关模拟测试
- SecretRef 遍历防护要求：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言遍历片段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增了一个 `includeInPlan` SecretRef 目标家族，请更新该测试中的 `classifyTargetClass`。该测试会故意在遇到未分类目标 id 时失败，这样新的类别就无法被静默跳过。
