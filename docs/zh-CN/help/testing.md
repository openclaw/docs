---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：unit/e2e/live 测试套件、Docker 运行器，以及每类测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-22T23:33:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b26f70756380e76203e61f9ee80b44b133eb813e99b9f5909c63a01fc3ec9827
    source_path: help/testing.md
    workflow: 15
---

# 测试

OpenClaw 有三套 Vitest 测试套件（unit/integration、e2e、live）以及一小组 Docker 运行器。

本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么（以及它有意**不**覆盖什么）
- 常见工作流应运行哪些命令（本地、推送前、调试）
- live 测试如何发现凭证并选择模型/提供商
- 如何为真实世界中的模型/提供商问题添加回归测试

## 快速开始

大多数时候：

- 完整门禁（预期在 push 前运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置充足的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接进入 Vitest watch 循环：`pnpm test:watch`
- 直接指定文件的能力现在也支持 extension/channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你正在迭代处理单个失败用例时，优先先跑有针对性的测试。
- 基于 Docker 的 QA 站点：`pnpm qa:lab:up`
- 基于 Linux VM 的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你改动了测试，或者想要额外的把握时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商/模型时（需要真实凭证）：

- Live 测试套件（模型 + Gateway 网关工具/图像探测）：`pnpm test:live`
- 安静地只跑一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Moonshot/Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行
  `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6`
  运行一个隔离的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  验证 JSON 报告了 Moonshot/K2.6，并且 assistant transcript 存储了标准化的 `usage.cost`。

提示：当你只需要一个失败用例时，优先使用下面描述的 allowlist 环境变量来缩小 live 测试范围。

## QA 专用运行器

当你需要接近 qa-lab 的真实环境时，这些命令与主测试套件配套使用：

- `pnpm openclaw qa suite`
  - 直接在宿主机上运行基于仓库的 QA 场景。
  - 默认会以并行方式运行多个已选择的场景，并使用隔离的 Gateway 网关 worker。
    `qa-channel` 默认并发数为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 回退到旧的串行通道。
  - 只要任一场景失败，就会以非零状态退出。若你想保留产物但不希望退出码失败，请使用 `--allow-failures`。
  - 支持的 provider 模式有 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个本地的、由 AIMock 支持的 provider 服务，用于实验性的 fixture 和协议 mock 覆盖，但不会替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 Multipass Linux VM 中运行同一套 QA 测试。
  - 与宿主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的 provider/model 选择参数。
  - Live 运行会转发对来宾系统而言可行的受支持 QA 认证输入：
    基于环境变量的 provider key、QA live provider 配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须位于仓库根目录下，这样来宾系统才能通过挂载的工作区回写内容。
  - 会将常规 QA 报告和摘要，以及 Multipass 日志写入 `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动基于 Docker 的 QA 站点，供偏操作员风格的 QA 工作使用。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建产物，使用已配置 OpenAI 启动 Gateway 网关，然后通过修改配置启用 Telegram 和 Discord。
  - 验证第一次重启 Gateway 网关时，会按需安装每个内置渠道插件的运行时依赖；第二次重启时，不会重新安装已激活的依赖。
  - 还会安装一个已知的旧版 npm 基线，在运行 `openclaw update --tag <candidate>` 前先启用 Telegram，并验证候选版本的更新后 doctor 会修复内置渠道运行时依赖，而不需要测试框架侧的 postinstall 修复。
- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock provider 服务，用于直接的协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 使用基于 Docker 的临时 Tuwunel homeserver 运行 Matrix live QA 通道。
  - 这个 QA 宿主目前仅供仓库/开发环境使用。打包后的 OpenClaw 安装不包含 `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库检出会直接加载内置运行器，不需要单独安装插件。
  - 会配置三个临时 Matrix 用户（`driver`、`sut`、`observer`）以及一个私有房间，然后启动一个 QA Gateway 网关子进程，并把真实 Matrix 插件作为 SUT 传输层。
  - 默认使用固定稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。如需测试其他镜像，可通过 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不提供共享凭证来源参数，因为该通道会在本地配置临时用户。
  - 会将 Matrix QA 报告、摘要、observed-events 产物，以及合并的 stdout/stderr 输出日志写入 `.artifacts/qa-e2e/...`。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 driver 和 SUT bot token，在真实私有群组上运行 Telegram live QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是 Telegram chat id 的数字值。
  - 支持 `--credential-source convex` 以使用共享池化凭证。默认使用 env 模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 只要任一场景失败，就会以非零状态退出。若你想保留产物但不希望退出码失败，请使用 `--allow-failures`。
  - 需要两个不同的 bot 位于同一个私有群组中，并且 SUT bot 必须公开 Telegram 用户名。
  - 为了稳定观察 bot 与 bot 之间的通信，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保 driver bot 能观察群组中的 bot 流量。
  - 会将 Telegram QA 报告、摘要和 observed-messages 产物写入 `.artifacts/qa-e2e/...`。

Live 传输通道共享一套标准契约，这样新传输层就不会偏离：

`qa-channel` 仍然是覆盖面广的合成 QA 测试套件，不属于 live
传输覆盖矩阵的一部分。

| 通道 | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| ---- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，
QA lab 会从一个由 Convex 支持的池中获取独占租约，在该通道运行期间维持租约心跳，并在关闭时释放租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 为所选角色提供一个 secret：
  - `maintainer` 使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 使用 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认为 `ci`，否则默认为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

正常运行时，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理命令（池添加/删除/列出）必须特别使用
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供维护者使用的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在脚本和 CI 工具中使用 `--json` 可获得机器可读输出。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 资源耗尽/可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /admin/add`（仅 maintainer secret）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅 maintainer secret）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅 maintainer secret）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 类型的 payload 结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是 Telegram chat id 的数字字符串。
- 对于 `kind: "telegram"`，`admin/add` 会验证此结构，并拒绝格式错误的 payload。

### 向 QA 添加一个渠道

向 markdown QA 系统添加一个渠道，严格只需要两项内容：

1. 该渠道的传输适配器。
2. 一组用于验证该渠道契约的场景包。

当共享 `qa-lab` 宿主能够管理整个流程时，不要新增顶层 QA 命令根。

`qa-lab` 负责共享宿主机制：

- `openclaw qa` 命令根
- 测试套件启动与清理
- worker 并发
- 产物写入
- 报告生成
- 场景执行
- 兼容旧版 `qa-channel` 场景的别名

运行器插件负责传输契约：

- `openclaw qa <runner>` 如何挂载到共享的 `qa` 根命令之下
- 如何为该传输层配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露 transcript 和标准化后的传输状态
- 如何执行由传输层支撑的操作
- 如何处理传输特定的重置或清理

新渠道的最低接入门槛是：

1. 保持由 `qa-lab` 负责共享的 `qa` 根命令。
2. 在共享的 `qa-lab` 宿主接缝上实现传输运行器。
3. 将传输特定的机制保留在运行器插件或渠道测试框架内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个相互竞争的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 轻量；惰性 CLI 和运行器执行应保留在单独的入口点之后。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或改造 markdown 场景。
6. 为新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意的迁移，否则要保持现有兼容性别名继续可用。

决策规则是严格的：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就把它放到 `qa-lab` 中。
- 如果某个行为依赖于单一渠道传输层，就把它保留在对应的运行器插件或插件测试框架中。
- 如果某个场景需要一个多个渠道都能使用的新能力，就添加一个通用辅助函数，而不是在 `suite.ts` 中添加渠道特定分支。
- 如果某个行为只对一种传输有意义，就保持该场景为传输特定场景，并在场景契约中明确说明。

新场景优先使用的通用辅助函数名称是：

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

现有场景仍可使用兼容性别名，包括：

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新的渠道工作应使用通用辅助函数名称。
兼容性别名的存在是为了避免一次性强制迁移，而不是作为
新场景编写的范式。

## 测试套件（各自运行范围）

可以把这些测试套件理解为“真实度逐步提高”（同时不稳定性/成本也逐步增加）：

### Unit / integration（默认）

- 命令：`pnpm test`
- 配置：对现有按范围划分的 Vitest project 执行十个顺序 shard 运行（`vitest.full-*.config.ts`）
- 文件：`vitest.unit.config.ts` 覆盖的 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 下的 core/unit 清单，以及列入白名单的 `ui` node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 已知缺陷的确定性回归测试
- 预期：
  - 会在 CI 中运行
  - 不需要真实 key
  - 应该快速且稳定
- Projects 说明：
  - 未指定目标的 `pnpm test` 现在会运行十一组更小的 shard 配置（`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是运行一个巨大的原生 root-project 进程。这能降低高负载机器上的峰值 RSS，并避免 auto-reply/extension 工作拖累无关测试套件。
  - `pnpm test --watch` 仍然使用原生 root `vitest.config.ts` project graph，因为多 shard 的 watch 循环并不现实。
  - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 现在会先将显式文件/目录目标路由到按范围划分的通道，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 无需承担完整 root project 启动成本。
  - 当 git 变更只涉及可路由的源码/测试文件时，`pnpm test:changed` 会将这些变更路径扩展到相同的按范围通道；而配置/初始化编辑仍会回退到更广泛的 root-project 重跑。
  - `pnpm check:changed` 是常规的智能本地门禁，适用于范围较小的工作。它会将 diff 分类为 core、core tests、extensions、extension tests、apps、docs、release metadata 和 tooling，然后运行对应的 typecheck/lint/test 通道。公共插件 SDK 和插件契约的变更也会包含 extension 验证，因为 extension 依赖这些 core 契约。仅包含发布元数据的版本号变更会运行有针对性的版本/配置/root-dependency 检查，而不是完整测试套件，并带有一个保护措施来拒绝对顶层版本字段之外的 package 改动。
  - 来自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 以及类似纯工具区域的轻量导入 unit 测试会通过 `unit-fast` 通道运行，该通道跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件仍保留在现有通道中。
  - 部分 `plugin-sdk` 和 `commands` helper 源文件也会在 changed 模式运行中映射到这些轻量通道里的显式同级测试，因此 helper 改动无需为该目录重跑完整重型测试套件。
  - `auto-reply` 现在有三个专用分桶：顶层 core helpers、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树。这让最重的 reply 测试框架工作不会拖慢廉价的 status/chunk/token 测试。
- Embedded runner 说明：
  - 当你修改消息工具发现输入或压缩运行时上下文时，
    要同时保留两个层级的覆盖。
  - 为纯路由/标准化边界添加聚焦的 helper 回归测试。
  - 同时也要保持嵌入式运行器集成测试套件健康：
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - 这些测试套件会验证带范围的 id 和压缩行为仍会沿着真实的 `run.ts` / `compact.ts` 路径流动；仅有 helper 测试并不能充分替代这些集成路径。
- Pool 说明：
  - 基础 Vitest 配置现在默认使用 `threads`。
  - 共享 Vitest 配置还固定了 `isolate: false`，并在 root projects、e2e 和 live 配置中使用非隔离运行器。
  - Root UI 通道保留了其 `jsdom` 设置和优化器，但现在也运行在共享的非隔离运行器上。
  - 每个 `pnpm test` shard 都会从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
  - 共享的 `scripts/run-vitest.mjs` 启动器现在也会默认给 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。如果你需要与默认 V8 行为比较，请设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`。
- 快速本地迭代说明：
  - `pnpm changed:lanes` 会显示一个 diff 触发了哪些架构通道。
  - pre-commit hook 会在 staged formatting/linting 之后运行 `pnpm check:changed --staged`，因此仅 core 的提交不会承担 extension 测试成本，除非它们触及面向 extension 的公共契约。仅发布元数据的提交会保留在有针对性的 version/config/root-dependency 通道中。
  - 当变更路径能够清晰映射到更小测试套件时，`pnpm test:changed` 会通过按范围划分的通道运行。
  - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
  - 本地 worker 自动扩缩容现在有意更保守，当宿主机负载平均值已较高时也会退让，因此默认情况下多个并发 Vitest 运行对系统的影响更小。
  - 基础 Vitest 配置将 projects/config 文件标记为 `forceRerunTriggers`，这样当测试接线发生变化时，changed 模式重跑仍然正确。
  - 配置会在受支持的宿主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你希望为直接性能分析指定一个显式缓存位置，请设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
- 性能调试说明：
  - `pnpm test:perf:imports` 会启用 Vitest 导入时长报告以及导入分解输出。
  - `pnpm test:perf:imports:changed` 会将相同的分析视图限定在自 `origin/main` 以来发生变化的文件上。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 会针对该已提交 diff，将路由后的 `test:changed` 与原生 root-project 路径做比较，并输出总耗时与 macOS 最大 RSS。
- `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和 root Vitest 配置，将当前未提交工作树中的变更文件列表路由后进行基准测试。
  - `pnpm test:perf:profile:main` 会写出用于分析 Vitest/Vite 启动和 transform 开销的主线程 CPU profile。
  - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为 unit 测试套件写出运行器 CPU + heap profile。

### E2E（Gateway 网关冒烟测试）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- 运行时默认值：
  - 使用 Vitest `threads` 并设置 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以 silent 模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>`：强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1`：重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 表面、节点配对，以及更重的网络行为
- 预期：
  - 会在 CI 中运行（当流水线启用时）
  - 不需要真实 key
  - 比 unit 测试包含更多可变部分（可能更慢）

### E2E：OpenShell 后端冒烟测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`test/openshell-sandbox.e2e.test.ts`
- 范围：
  - 通过 Docker 在宿主机上启动一个隔离的 OpenShell Gateway 网关
  - 从一个临时本地 Dockerfile 创建沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec，验证 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远程规范化文件系统行为
- 预期：
  - 仅显式启用；不属于默认的 `pnpm test:e2e` 运行
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：在手动运行更广泛的 e2e 测试套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向一个非默认的 CLI 二进制或包装脚本

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型今天用真实凭证是否真的可用？”
  - 捕获提供商格式变化、工具调用怪癖、认证问题和限流行为
- 预期：
  - 按设计并不适合作为稳定 CI 运行项（真实网络、真实提供商策略、配额、中断）
  - 会花钱 / 消耗限流额度
  - 优先运行缩小范围的子集，而不是“一切全跑”
- Live 运行会加载 `~/.profile`，以补充缺失的 API key。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置/认证材料复制到一个临时测试 home 中，这样 unit fixture 就不会修改你真实的 `~/.openclaw`。
- 只有当你明确需要 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静默 Gateway 网关启动日志/Bonjour 噪声。若你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（按提供商区分）：设置逗号/分号格式的 `*_API_KEYS` 或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或通过 `OPENCLAW_LIVE_*_KEY` 做每次 live 运行覆盖；测试在遇到限流响应时会重试。
- 进度/心跳输出：
  - Live 测试套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获较安静，长时间运行的 provider 调用也会明显显示为仍在活动。
  - `vitest.live.config.ts` 禁用了 Vitest 控制台拦截，因此在 live 运行期间，provider/gateway 进度行会立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型调用的心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关/探测的心跳。

## 我应该运行哪个测试套件？

使用这个决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果你改动很多，再加跑 `pnpm test:coverage`）
- 涉及 Gateway 网关网络 / WS 协议 / 配对：额外运行 `pnpm test:e2e`
- 调试“我的 bot 挂了”/ 提供商特定故障 / 工具调用：运行一个缩小范围的 `pnpm test:live`

## Live：Android 节点能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android 节点当前**公布的每一条命令**，并断言命令契约行为。
- 范围：
  - 依赖前置条件/手动设置（该测试套件不会安装/运行/配对应用）。
  - 针对所选 Android 节点，逐条命令验证 Gateway 网关 `node.invoke`。
- 必需的预先设置：
  - Android 应用已连接并与 Gateway 网关配对。
  - 应用保持在前台运行。
  - 已为你期望通过的能力授予权限/采集同意。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android App](/zh-CN/platforms/android)

## Live：模型冒烟测试（profile keys）

Live 测试分为两层，这样我们可以隔离故障：

- “Direct model” 告诉我们，给定 key 后，provider/model 是否至少能够返回响应。
- “Gateway smoke” 告诉我们，该模型的完整 gateway + agent 流水线是否正常工作（会话、历史、工具、沙箱策略等）。

### 第 1 层：直接模型补全（无 gateway）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举已发现的模型
  - 使用 `getApiKeyForModel` 选择你有凭证的模型
  - 为每个模型运行一个小型补全（并在需要时运行有针对性的回归测试）
- 启用方式：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，即 modern 的别名）后，才会实际运行该测试套件；否则会跳过，以便让 `pnpm test:live` 聚焦于 Gateway 网关冒烟测试
- 选择模型的方法：
  - `OPENCLAW_LIVE_MODELS=modern` 运行 modern allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是 modern allowlist 的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（逗号分隔 allowlist）
  - Modern/all 扫描默认有一个精心挑选的高信号上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 可执行完整的 modern 扫描，或设置为正数以使用更小的上限。
- 选择 provider 的方法：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔 allowlist）
- key 来源：
  - 默认：profile 存储和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制**仅**使用 profile 存储
- 存在原因：
  - 将“provider API 坏了 / key 无效”和“gateway agent 流水线坏了”区分开来
  - 承载小型、隔离的回归测试（例如：OpenAI Responses/Codex Responses 推理重放 + 工具调用流程）

### 第 2 层：Gateway 网关 + dev 智能体冒烟测试（即 “@openclaw” 实际执行的内容）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 Gateway 网关
  - 创建/修补一个 `agent:dev:*` 会话（每次运行按模型覆盖）
  - 遍历有 key 的模型并断言：
    - 有“有意义”的响应（无工具）
    - 一次真实的工具调用可用（read 探针）
    - 可选的额外工具探针可用（exec+read 探针）
    - OpenAI 回归路径（仅工具调用 → 后续跟进）持续正常
- 探针细节（这样你能快速解释故障）：
  - `read` 探针：测试会在工作区写入一个 nonce 文件，并要求智能体 `read` 该文件并回显 nonce。
  - `exec+read` 探针：测试会要求智能体通过 `exec` 将 nonce 写入一个临时文件，然后再 `read` 读回。
  - 图像探针：测试会附加一个生成的 PNG（猫 + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 选择模型的方法：
  - 默认：modern allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 modern allowlist 的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）来缩小范围
  - Modern/all Gateway 网关扫描默认有一个精心挑选的高信号上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可执行完整的 modern 扫描，或设置为正数以使用更小的上限。
- 选择 provider 的方法（避免“OpenRouter 全都跑”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔 allowlist）
- 该 live 测试中，工具 + 图像探针始终开启：
  - `read` 探针 + `exec+read` 探针（工具压力测试）
  - 当模型声明支持图像输入时，会运行图像探针
  - 流程（高层说明）：
    - 测试生成一个带有 “CAT” + 随机代码的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析到 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式智能体向模型转发一条多模态用户消息
    - 断言：回复包含 `cat` + 该代码（OCR 容错：允许轻微错误）

提示：要查看你本机可以测试什么（以及精确的 `provider/model` id），请运行：

```bash
openclaw models list
openclaw models list --json
```

## Live：CLI 后端冒烟测试（Claude、Codex、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：在不触碰默认配置的情况下，使用本地 CLI 后端验证 Gateway 网关 + 智能体流水线。
- 后端特定的冒烟测试默认值位于所属扩展的 `cli-backend.ts` 定义中。
- 启用：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认 provider/model：`claude-cli/claude-sonnet-4-6`
  - 命令/参数/图像行为来自所属 CLI 后端插件元数据。
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 发送真实图像附件（路径会注入到提示词中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 将图像文件路径作为 CLI 参数传入，而不是通过提示词注入。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）在设置 `IMAGE_ARG` 时控制图像参数的传递方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮对话并验证恢复流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` 禁用默认的 Claude Sonnet -> Opus 同会话连续性探针（当所选模型支持切换目标时，设置为 `1` 可强制启用）。

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

单 provider Docker 配方：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

说明：

- Docker 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它会在仓库 Docker 镜像内，以非 root 的 `node` 用户身份运行 live CLI 后端冒烟测试。
- 它会从所属扩展中解析 CLI 冒烟测试元数据，然后将对应的 Linux CLI 包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 指定的可写缓存前缀中（默认：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要通过 `~/.claude/.credentials.json` 中的 `claudeAiOauth.subscriptionType`，或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN`，使用可移植的 Claude Code 订阅 OAuth。它会先验证 Docker 中直接执行 `claude -p` 可用，然后在不保留 Anthropic API key 环境变量的情况下，运行两轮 Gateway 网关 CLI 后端交互。由于 Claude 目前会通过额外用量计费而不是正常订阅计划额度来处理第三方应用使用，这个订阅通道默认禁用 Claude MCP/tool 和图像探针。
- Live CLI 后端冒烟测试现在会为 Claude、Codex 和 Gemini 执行相同的端到端流程：文本轮次、图像分类轮次，然后通过 Gateway 网关 CLI 验证 MCP `cron` 工具调用。
- Claude 的默认冒烟测试还会将会话从 Sonnet 修补为 Opus，并验证恢复后的会话仍记得之前的备注。

## Live：ACP 绑定冒烟测试（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用一个 live ACP 智能体验证真实的 ACP 会话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 就地绑定一个合成的消息渠道会话
  - 在该同一会话上发送普通后续消息
  - 验证后续消息落入已绑定的 ACP 会话 transcript 中
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - Docker 中的 ACP 智能体：`claude,codex,gemini`
  - 直接使用 `pnpm test:live ...` 时的 ACP 智能体：`claude`
  - 合成渠道：Slack 私信风格会话上下文
  - ACP 后端：`acpx`
- 覆盖项：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 说明：
  - 此通道使用 Gateway 网关 `chat.send` 接口，并附带仅管理员可用的合成 originating-route 字段，因此测试可以附加消息渠道上下文，而无需假装从外部真正投递。
  - 当未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会使用内置 `acpx` 插件中的内建智能体注册表，来获取所选 ACP 测试框架智能体。

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
- 默认情况下，它会按顺序针对所有受支持的 live CLI 智能体运行 ACP 绑定冒烟测试：`claude`、`codex`，然后 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 可缩小矩阵范围。
- 它会加载 `~/.profile`，将匹配的 CLI 认证材料暂存到容器中，把 `acpx` 安装到一个可写 npm 前缀中，并在缺失时安装请求的 live CLI（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）。
- 在 Docker 内部，运行器会设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，这样 acpx 就能让从已加载的 profile 中获得的 provider 环境变量继续对其子测试框架 CLI 可用。

## Live：Codex app-server 测试框架冒烟测试

- 目标：通过正常的 Gateway 网关 `agent` 方法，验证由插件拥有的 Codex 测试框架：
  - 加载内置的 `codex` 插件
  - 选择 `OPENCLAW_AGENT_RUNTIME=codex`
  - 向 `codex/gpt-5.4` 发送第一轮 Gateway 网关智能体请求
  - 向同一个 OpenClaw 会话发送第二轮请求，并验证 app-server
    线程可以恢复
  - 通过相同的 Gateway 网关命令
    路径运行 `/codex status` 和 `/codex models`
  - 可选运行两个经过 Guardian 审核的提权 shell 探针：一个应被批准的良性
    命令，以及一个应被拒绝的伪造 secret 上传，这样智能体会回头询问
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认模型：`codex/gpt-5.4`
- 可选图像探针：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP/tool 探针：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可选 Guardian 探针：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 该冒烟测试会设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，因此损坏的 Codex
  测试框架无法通过悄悄回退到 PI 而蒙混过关。
- 认证：来自 shell/profile 的 `OPENAI_API_KEY`，以及可选复制的
  `~/.codex/auth.json` 和 `~/.codex/config.toml`

本地配方：

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 配方：

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-codex-harness-docker.sh`。
- 它会加载挂载的 `~/.profile`，传递 `OPENAI_API_KEY`，在存在时复制 Codex CLI
  认证文件，将 `@openai/codex` 安装到可写的挂载 npm
  前缀中，准备源码树，然后仅运行 Codex-harness live 测试。
- Docker 默认启用图像、MCP/tool 和 Guardian 探针。需要更窄范围的调试
  运行时，请设置 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 还会导出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，与 live
  测试配置保持一致，因此 `openai-codex/*` 或 PI 回退无法掩盖 Codex 测试框架
  回归问题。

### 推荐的 live 配方

范围窄、显式的 allowlist 最快，也最不容易出问题：

- 单模型，direct（无 gateway）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，Gateway 网关冒烟测试：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个 provider 的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 聚焦（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

说明：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth bridge（Cloud Code Assist 风格的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（独立的认证 + 工具行为差异）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API key / profile 认证）；这通常就是大多数用户所说的 “Gemini”。
  - CLI：OpenClaw 会调用本地 `gemini` 二进制；它有自己的认证方式，并且行为可能不同（流式传输/工具支持/版本偏差）。

## Live：模型矩阵（我们的覆盖范围）

没有固定的“CI 模型列表”（live 是按需启用的），但以下是建议你在有 key 的开发机器上定期覆盖的**推荐**模型。

### Modern 冒烟测试集（工具调用 + 图像）

这是我们期望持续可用的“常用模型”运行集：

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

每个 provider 家族至少选一个：

- OpenAI：`openai/gpt-5.4`（或 `openai/gpt-5.4-mini`）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

可选的额外覆盖（有更好，没有也行）：

- xAI：`xai/grok-4`（或最新可用版本）
- Mistral：`mistral/`…（选择一个你已启用、支持工具的模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### Vision：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型（Claude/Gemini/OpenAI 支持视觉的变体等），以运行图像探针。

### 聚合器 / 替代 Gateway 网关

如果你已启用相关 key，我们也支持通过以下方式进行测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图像的候选项）
- OpenCode：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 认证）

你还可以将更多 provider 加入 live 矩阵（如果你有相应凭证/配置）：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云/API），以及任何兼容 OpenAI/Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档里硬编码“所有模型”。权威列表应是你的机器上 `discoverModels(...)` 返回的内容，加上当前可用的 key。

## 凭证（切勿提交）

Live 测试发现凭证的方式与 CLI 相同。实际含义如下：

- 如果 CLI 可用，live 测试也应能找到相同的 key。
- 如果某个 live 测试提示“no creds”，就按你调试 `openclaw models list` / 模型选择时的方式来调试。

- 每个智能体的认证 profile：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是 live 测试中 “profile keys” 的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（存在时会复制到准备好的 live home 中，但它不是主 profile-key 存储）
- 本地 live 运行默认会将活动配置、每个智能体的 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 认证目录复制到临时测试 home 中；准备好的 live home 会跳过 `workspace/` 和 `sandboxes/`，并移除 `agents.*.workspace` / `agentDir` 路径覆盖，这样探针就不会落到你真实宿主机的工作区中。

如果你想依赖环境变量 key（例如导出在你的 `~/.profile` 中），请在运行本地测试前执行 `source ~/.profile`，或者使用下面的 Docker 运行器（它们可以将 `~/.profile` 挂载到容器中）。

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
  - 验证内置 comfy 图像、视频和 `music_generate` 路径
  - 除非已配置 `models.providers.comfy.<capability>`，否则会跳过各项能力
  - 适用于修改 comfy 工作流提交、轮询、下载或插件注册之后的验证

## 图像生成 live

- 测试：`src/image-generation/runtime.live.test.ts`
- 命令：`pnpm test:live src/image-generation/runtime.live.test.ts`
- 测试框架：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图像生成 provider 插件
  - 在探测前，从你的登录 shell（`~/.profile`）中加载缺失的 provider 环境变量
  - 默认优先使用 live/env API key，而不是已存储的认证 profile，因此 `auth-profiles.json` 中过期的测试 key 不会掩盖真实 shell 凭证
  - 跳过没有可用认证/profile/模型的 provider
  - 通过共享运行时能力运行标准图像生成变体：
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 当前覆盖的内置 provider：
  - `openai`
  - `google`
  - `xai`
- 可选缩小范围：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile 存储认证，并忽略仅环境变量提供的覆盖

## 音乐生成 live

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 测试框架：`pnpm test:live:media music`
- 范围：
  - 验证共享的内置音乐生成 provider 路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前，从你的登录 shell（`~/.profile`）中加载 provider 环境变量
  - 默认优先使用 live/env API key，而不是已存储的认证 profile，因此 `auth-profiles.json` 中过期的测试 key 不会掩盖真实 shell 凭证
  - 跳过没有可用认证/profile/模型的 provider
  - 在可用时运行两种已声明的运行时模式：
    - `generate`：仅提示词输入
    - `edit`：当 provider 声明 `capabilities.edit.enabled` 时运行
  - 当前共享通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：单独的 Comfy live 文件，不属于此共享扫描
- 可选缩小范围：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile 存储认证，并忽略仅环境变量提供的覆盖

## 视频生成 live

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 测试框架：`pnpm test:live:media video`
- 范围：
  - 验证共享的内置视频生成 provider 路径
  - 默认走发布安全的冒烟测试路径：非 FAL provider、每个 provider 一次 text-to-video 请求、1 秒龙虾提示词，以及来自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每个 provider 操作上限（默认 `180000`）
  - 默认跳过 FAL，因为 provider 侧队列延迟可能主导发布时间；显式传入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 才会运行它
  - 在探测前，从你的登录 shell（`~/.profile`）中加载 provider 环境变量
  - 默认优先使用 live/env API key，而不是已存储的认证 profile，因此 `auth-profiles.json` 中过期的测试 key 不会掩盖真实 shell 凭证
  - 跳过没有可用认证/profile/模型的 provider
  - 默认仅运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 后，也会在可用时运行已声明的 transform 模式：
    - 当 provider 声明 `capabilities.imageToVideo.enabled` 且所选 provider/model 在共享扫描中接受基于 buffer 的本地图像输入时，运行 `imageToVideo`
    - 当 provider 声明 `capabilities.videoToVideo.enabled` 且所选 provider/model 在共享扫描中接受基于 buffer 的本地视频输入时，运行 `videoToVideo`
  - 当前在共享扫描中已声明但跳过的 `imageToVideo` provider：
    - `vydra`，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图像 URL
  - provider 特定的 Vydra 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件会运行 `veo3` text-to-video，以及一个默认使用远程图像 URL fixture 的 `kling` 通道
  - 当前 `videoToVideo` live 覆盖：
    - 仅 `runway`，并且所选模型为 `runway/gen4_aleph` 时才运行
  - 当前在共享扫描中已声明但跳过的 `videoToVideo` provider：
    - `alibaba`、`qwen`、`xai`，因为这些路径当前需要远程 `http(s)` / MP4 参考 URL
    - `google`，因为当前共享的 Gemini/Veo 通道使用基于本地 buffer 的输入，而该路径在共享扫描中不被接受
    - `openai`，因为当前共享通道缺少组织特定的视频 inpaint/remix 访问保证
- 可选缩小范围：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 以在默认扫描中包含所有 provider，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 以降低每个 provider 的操作上限，用于激进的冒烟测试运行
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile 存储认证，并忽略仅环境变量提供的覆盖

## 媒体 live 测试框架

- 命令：`pnpm test:live:media`
- 用途：
  - 通过一个仓库原生入口点运行共享的图像、音乐和视频 live 测试套件
  - 自动从 `~/.profile` 加载缺失的 provider 环境变量
  - 默认自动将每个测试套件缩小到当前具有可用认证的 provider
  - 复用 `scripts/test-live.mjs`，因此心跳和静默模式行为保持一致
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- Live-model 运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像内运行与之匹配的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（如果挂载了 `~/.profile`，也会加载它）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认使用更小的冒烟测试上限，以便完整 Docker 扫描仍然可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你
  明确想要更大的完整扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，然后将其复用于两个 live Docker 通道。
- 容器冒烟测试运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels` 和 `test:docker:plugins` 会启动一个或多个真实容器，并验证更高层级的集成路径。

这些 live-model Docker 运行器还会只 bind-mount 所需的 CLI 认证 home（若运行未缩小范围，则挂载所有受支持项），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就可以刷新 token，而不会修改宿主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server 测试框架冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live 冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Gateway 网关网络（两个容器、WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- MCP 渠道桥接（已预置的 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- 插件（安装冒烟测试 + `/plugin` 别名 + Claude-bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）

这些 live-model Docker 运行器还会以只读方式 bind-mount 当前检出内容，
并将其准备到容器内的临时工作目录中。这样既能保持运行时
镜像精简，又能让 Vitest 针对你精确的本地源码/配置运行。
准备步骤会跳过大型仅本地缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或
Gradle 输出目录，这样 Docker live 运行就不会花费数分钟复制
机器特定的产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关 live 探针就不会在容器内启动
真实的 Telegram/Discord 等渠道 worker。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要缩小范围或排除该 Docker 通道中的 Gateway 网关
live 覆盖时，也请一并传递
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个
已启用 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，
再针对该 Gateway 网关启动一个固定版本的 Open WebUI 容器，通过
Open WebUI 登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过
Open WebUI 的 `/api/chat/completions` 代理发送一条
真实聊天请求。
首次运行可能会明显更慢，因为 Docker 可能需要拉取
Open WebUI 镜像，并且 Open WebUI 可能需要完成自身的冷启动设置。
该通道需要一个可用的 live 模型 key，而 `OPENCLAW_PROFILE_FILE`
（默认 `~/.profile`）是在 Docker 化运行中提供它的主要方式。
成功运行会打印一个小型 JSON 载荷，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是有意设计为确定性的，不需要
真实的 Telegram、Discord 或 iMessage 账户。它会启动一个已预置的 Gateway 网关
容器，再启动第二个容器来运行 `openclaw mcp serve`，然后
验证已路由的会话发现、transcript 读取、附件元数据、
live 事件队列行为、出站发送路由，以及 Claude 风格的渠道 +
权限通知，这些都通过真实的 stdio MCP bridge 完成。通知检查
会直接检查原始 stdio MCP frame，因此该冒烟测试验证的是 bridge
实际发出的内容，而不仅仅是某个特定客户端 SDK 恰好暴露的内容。

手动 ACP plain-language 线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留这个脚本用于回归/调试工作流。它未来可能还会再次用于 ACP 线程路由验证，因此不要删除。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前加载
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于仅验证从 `OPENCLAW_PROFILE_FILE` 加载的环境变量，使用临时配置/工作区目录且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内的缓存 CLI 安装
- `$HOME` 下的外部 CLI 认证目录/文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小 provider 范围的运行只会挂载根据 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗号列表（如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`）手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤 provider
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用已有的 `openclaw:local-live` 镜像，以便重跑那些不需要重新构建的测试
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关向 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试中使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定版本的 Open WebUI 镜像标签

## 文档完整性检查

修改文档后运行文档检查：`pnpm check:docs`。
当你还需要校验页内标题锚点时，运行完整的 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归测试（CI 安全）

这些是不依赖真实 provider 的“真实流水线”回归测试：

- Gateway 网关工具调用（mock OpenAI、真实 gateway + agent loop）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，强制写入 config + auth）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些 CI 安全的测试，它们的行为类似“智能体可靠性评估”：

- 通过真实的 gateway + agent loop 执行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 端到端向导流程，用于验证会话接线和配置效果（`src/gateway/gateway.test.ts`）。

针对 Skills（参见 [Skills](/zh-CN/tools/skills)），目前仍缺少的内容：

- **决策能力：** 当提示词中列出 Skills 时，智能体是否会选择正确的 skill（或避免选择无关的 skill）？
- **合规性：** 智能体在使用前是否会读取 `SKILL.md`，并遵循要求的步骤/参数？
- **工作流契约：** 多轮场景中要断言工具调用顺序、会话历史延续以及沙箱边界。

未来的评估应优先保持确定性：

- 一个使用 mock provider 的场景运行器，用于断言工具调用 + 顺序、skill 文件读取以及会话接线。
- 一小套聚焦 skill 的场景（使用 vs 避免、门禁、提示词注入）。
- 只有在 CI 安全测试套件落地后，才增加可选 live 评估（按需启用、受环境变量门禁控制）。

## 契约测试（插件与渠道形状）

契约测试用于验证每个已注册的插件和渠道都符合其
接口契约。它们会遍历所有已发现的插件，并运行一组关于形状和行为的断言。默认的 `pnpm test` unit 通道会有意
跳过这些共享接缝和冒烟测试文件；当你修改共享渠道或 provider 表面时，请显式运行这些契约命令。

### 命令

- 所有契约测试：`pnpm test:contracts`
- 仅渠道契约测试：`pnpm test:contracts:channels`
- 仅 provider 契约测试：`pnpm test:contracts:plugins`

### 渠道契约测试

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、名称、能力）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息载荷结构
- **inbound** - 入站消息处理
- **actions** - 渠道操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/成员列表 API
- **group-policy** - 群组策略执行

### Provider 状态契约测试

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件注册表形状

### Provider 契约测试

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - provider 运行时
- **shape** - 插件形状/接口
- **wizard** - 设置向导

### 何时运行

- 修改 plugin-sdk 导出或子路径之后
- 添加或修改渠道或 provider 插件之后
- 重构插件注册或发现逻辑之后

契约测试会在 CI 中运行，不需要真实 API key。

## 添加回归测试（指南）

当你修复一个在 live 中发现的 provider/model 问题时：

- 如果可能，添加一个 CI 安全的回归测试（mock/stub provider，或捕获精确的请求形状转换）
- 如果它本质上只能通过 live 复现（限流、认证策略），就保持 live 测试范围窄，并通过环境变量按需启用
- 优先定位到能够捕获该缺陷的最小层级：
  - provider 请求转换/重放问题 → direct models 测试
  - gateway 会话/历史/工具流水线问题 → Gateway 网关 live 冒烟测试或 CI 安全的 gateway mock 测试
- SecretRef 遍历防护规则：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言会拒绝遍历段 exec id。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增了一个 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会在遇到未分类目标 id 时故意失败，这样新类别就不会被静默跳过。
