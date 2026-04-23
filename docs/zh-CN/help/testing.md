---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型 / 提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元 / e2e / 实时测试套件、Docker 运行器，以及每项测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-23T09:05:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0e9bdea78cba7e512358d2e4d428da04a2071188e74af2d5419d2c85eafe15
    source_path: help/testing.md
    workflow: 15
---

# 测试

OpenClaw 有三个 Vitest 测试套件（单元 / 集成、e2e、实时），以及一小组 Docker 运行器。

本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么（以及它刻意 _不_ 覆盖什么）
- 常见工作流应运行哪些命令（本地、推送前、调试）
- 实时测试如何发现凭证并选择模型 / 提供商
- 如何为真实世界中的模型 / 提供商问题添加回归测试

## 快速开始

大多数时候：

- 完整门禁（预期在推送前运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置充裕的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接进入 Vitest 监听循环：`pnpm test:watch`
- 现在直接按文件定位也会路由扩展 / 渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代处理单个失败用例时，优先先运行有针对性的测试。
- 由 Docker 支持的 QA 站点：`pnpm qa:lab:up`
- 由 Linux VM 支持的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你改动测试或想获得更多信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- 实时测试套件（模型 + Gateway 网关 工具 / 图像探测）：`pnpm test:live`
- 安静地只针对一个实时测试文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker 实时模型全量扫描：`pnpm test:docker:live-models`
  - CI 覆盖：每日的 `OpenClaw Scheduled Live And E2E Checks` 和手动触发的 `OpenClaw Release Checks` 都会调用可复用的实时 / E2E 工作流，并设置 `include_live_suites: true`，其中包括按提供商分片的独立 Docker 实时模型矩阵作业。
  - 对于有针对性的 CI 重跑，可派发 `OpenClaw Live And E2E Checks (Reusable)`，并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 添加新的高信号提供商密钥时，还要更新 `scripts/ci-hydrate-live-auth.sh`、`.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 以及它的定时 / 发布调用方。
- Moonshot / Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行一个隔离的 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。验证 JSON 报告的是 Moonshot / K2.6，并且助手对话记录中存储了规范化的 `usage.cost`。

提示：当你只需要一个失败用例时，优先使用下面描述的 allowlist 环境变量来缩小实时测试范围。

## QA 专用运行器

当你需要 QA lab 级别的真实环境时，这些命令与主测试套件并列使用：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，也可通过手动触发并使用模拟提供商运行。`QA-Lab - All Lanes` 会在 `main` 上每晚运行，也可通过手动触发运行；它会将模拟 parity gate、实时 Matrix 通道，以及由 Convex 管理的实时 Telegram 通道作为并行作业运行。`OpenClaw Release Checks` 会在发布批准前运行相同的通道。

- `pnpm openclaw qa suite`
  - 直接在主机上运行基于仓库的 QA 场景。
  - 默认会以隔离的 Gateway 网关 worker 并行运行多个选定场景。`qa-channel` 默认并发数为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 运行旧的串行通道。
  - 当任一场景失败时，以非零状态退出。若你想保留工件而不以失败退出码结束，请使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个本地的、由 AIMock 支持的提供商服务器，用于实验性的 fixture 和协议模拟覆盖，但不会替代面向场景的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 Multipass Linux VM 中运行同一个 QA 测试套件。
  - 与主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商 / 模型选择标志。
  - 实时运行会转发适合来宾环境的受支持 QA 凭证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，以便来宾可通过挂载的工作区回写。
  - 会将常规 QA 报告 + 摘要以及 Multipass 日志写入 `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动由 Docker 支持的 QA 站点，用于偏运维风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建一个 npm tarball，在 Docker 中全局安装它，运行非交互式 OpenAI API 密钥新手引导，默认配置 Telegram，验证启用该插件时会按需安装运行时依赖，运行 doctor，并针对模拟的 OpenAI 端点执行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可用 Discord 运行同一个打包安装通道。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前的 OpenClaw 构建，启动已配置 OpenAI 的 Gateway 网关，然后通过编辑配置启用内置渠道 / 插件。
  - 验证设置发现阶段不会提前安装未配置插件的运行时依赖；首次配置后的 Gateway 网关 或 doctor 运行会按需安装每个内置插件的运行时依赖；第二次重启不会重新安装已经激活的依赖。
  - 还会安装一个已知较旧的 npm 基线版本，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本的更新后 doctor 会修复内置渠道运行时依赖，而无需测试夹具侧的 postinstall 修复。
- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的、由 Docker 支持的 Tuwunel homeserver 运行 Matrix 实时 QA 通道。
  - 这个 QA 主机目前仅供仓库 / 开发环境使用。打包后的 OpenClaw 安装不包含 `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库检出会直接加载内置运行器；不需要单独安装插件。
  - 会配置三个临时 Matrix 用户（`driver`、`sut`、`observer`）和一个私有房间，然后以真实 Matrix 插件作为 SUT 传输层启动一个 QA Gateway 网关 子进程。
  - 默认使用固定的稳定 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。若你需要测试其他镜像，可通过 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭证来源标志，因为该通道会在本地配置一次性用户。
  - 会将 Matrix QA 报告、摘要、observed-events 工件以及合并后的 stdout / stderr 输出日志写入 `.artifacts/qa-e2e/...`。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 driver 和 SUT bot token，针对一个真实私有群组运行 Telegram 实时 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是 Telegram chat 的数字 id。
  - 支持 `--credential-source convex` 用于共享池化凭证。默认使用 env 模式，或者设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 当任一场景失败时，以非零状态退出。若你想保留工件而不以失败退出码结束，请使用 `--allow-failures`。
  - 需要位于同一私有群组中的两个不同 bot，且 SUT bot 需要公开一个 Telegram 用户名。
  - 为了稳定地观察 bot 到 bot 通信，请在 `@BotFather` 中为两个 bot 都启用 Bot-to-Bot Communication Mode，并确保 driver bot 可以观察群组中的 bot 流量。
  - 会将 Telegram QA 报告、摘要和 observed-messages 工件写入 `.artifacts/qa-e2e/...`。回复场景包括从 driver 发送请求到观察到 SUT 回复之间的 RTT。

实时传输通道共享同一个标准契约，这样新传输方式就不会发生漂移：

`qa-channel` 仍然是广泛的合成 QA 测试套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | Canary | 提及门控 | Allowlist 阻止 | 顶层回复 | 重启恢复 | 线程后续跟进 | 线程隔离 | Reaction 观察 | 帮助命令 |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的凭证池中获取独占租约，在通道运行期间对该租约发送心跳，并在关闭时释放该租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 为所选角色提供一个密钥：
  - `maintainer` 使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 使用 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认为 `ci`，否则为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选追踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常运行中应使用 `https://`。

维护者管理命令（池添加 / 删除 / 列表）必须专门使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

维护者用的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在脚本和 CI 工具中，使用 `--json` 获取机器可读输出。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 耗尽 / 可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /admin/add`（仅限维护者密钥）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅限维护者密钥）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅限维护者密钥）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 类型的负载形状：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是 Telegram chat 数字 id 的字符串。
- `admin/add` 会在 `kind: "telegram"` 时校验此形状，并拒绝格式错误的负载。

### 向 QA 添加一个渠道

向 Markdown QA 系统添加一个渠道，严格来说只需要两样东西：

1. 该渠道的传输适配器。
2. 一个用于验证渠道契约的场景包。

当共享的 `qa-lab` 主机可以负责整个流程时，不要新增顶层 QA 命令根。

`qa-lab` 负责共享主机机制：

- `openclaw qa` 命令根
- 测试套件启动与拆除
- worker 并发
- 工件写入
- 报告生成
- 场景执行
- 面向旧版 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- `openclaw qa <runner>` 如何挂载到共享的 `qa` 根下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露转录内容和规范化的传输状态
- 如何执行由传输支持的操作
- 如何处理传输特定的重置或清理

新渠道的最低采用门槛是：

1. 保持由 `qa-lab` 负责共享的 `qa` 根。
2. 在共享的 `qa-lab` 主机接缝上实现传输运行器。
3. 将传输特定机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个相互竞争的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 轻量；惰性 CLI 和运行器执行应放在独立入口点之后。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或适配 Markdown 场景。
6. 为新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意的迁移，否则保持现有兼容别名继续可用。

判定规则很严格：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就放到 `qa-lab` 中。
- 如果某个行为依赖于单一渠道传输，就保留在该运行器插件或插件 harness 中。
- 如果某个场景需要多个渠道都可使用的新能力，应添加通用辅助函数，而不是在 `suite.ts` 中增加渠道特定分支。
- 如果某个行为只对一种传输有意义，就让该场景保持传输特定，并在场景契约中明确说明。

新场景优先使用的通用辅助函数名称为：

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

现有场景仍可使用兼容别名，包括：

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新的渠道工作应使用通用辅助函数名称。
兼容别名的存在是为了避免一次性迁移日，而不是作为新场景编写的范例。

## 测试套件（各自运行的位置）

可以把这些测试套件理解为“真实度逐步提高”（同时不稳定性 / 成本也随之增加）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：未指定目标的运行使用 `vitest.full-*.config.ts` 分片集合，并且可能会将多项目分片展开为按项目划分的配置，以便并行调度
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 下的核心 / 单元测试清单，以及 `vitest.unit.config.ts` 覆盖的白名单 `ui` Node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关 认证、路由、工具、解析、配置）
  - 已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
- 项目说明：
  - 未指定目标的 `pnpm test` 现在会运行 12 个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这样可以降低高负载机器上的峰值 RSS，并避免 auto-reply / 扩展工作拖慢无关套件。
  - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 项目图，因为多分片监听循环并不现实。
  - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 现在会先将显式文件 / 目录目标路由到有范围的通道，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不需要承担完整根项目启动的成本。
  - 当变更 diff 仅触及可路由的源码 / 测试文件时，`pnpm test:changed` 会将变更的 git 路径展开为同样的有范围通道；配置 / 设置编辑仍会回退为更广泛的根项目重跑。
  - `pnpm check:changed` 是针对窄范围工作的常规智能本地门禁。它会将 diff 分类为 core、core tests、extensions、extension tests、apps、docs、release metadata 和 tooling，然后运行相应的 typecheck / lint / test 通道。公共插件 SDK 和插件契约变更会包含扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本号变更会运行有针对性的版本 / 配置 / 根依赖检查，而不是完整套件，并带有一个保护机制，用于拒绝顶层 version 字段之外的 package 变更。
  - 来自智能体、命令、插件、auto-reply 辅助函数、`plugin-sdk` 以及类似纯工具区域的轻导入单元测试，会路由到 `unit-fast` 通道，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时较重的文件仍保留在现有通道上。
  - 部分选定的 `plugin-sdk` 和 `commands` 辅助源码文件，也会在 changed 模式运行中映射到这些轻量通道中的显式同级测试，因此辅助函数编辑无需为该目录重跑完整的重型套件。
  - `auto-reply` 现在有三个专用桶：顶层核心辅助函数、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树。这使最重的 reply harness 工作不会拖累廉价的状态 / chunk / token 测试。
- 嵌入式运行器说明：
  - 当你修改消息工具发现输入或压缩运行时上下文时，必须同时保持两个层级的覆盖。
  - 为纯路由 / 规范化边界添加聚焦的辅助函数回归测试。
  - 同时也要保持嵌入式运行器集成测试套件健康：
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - 这些测试套件会验证带作用域的 id 和压缩行为仍然会流经真实的 `run.ts` / `compact.ts` 路径；仅有辅助函数测试不能充分替代这些集成路径。
- 池说明：
  - 基础 Vitest 配置现在默认使用 `threads`。
  - 共享 Vitest 配置还固定设置了 `isolate: false`，并在根项目、e2e 和实时配置中使用非隔离运行器。
  - 根 UI 通道保留其 `jsdom` 设置和优化器，但现在也运行在共享的非隔离运行器上。
  - 每个 `pnpm test` 分片都会从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
  - 共享的 `scripts/run-vitest.mjs` 启动器现在还会默认为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。如果你需要对比原生 V8 行为，可设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`。
- 快速本地迭代说明：
  - `pnpm changed:lanes` 会显示一个 diff 会触发哪些架构通道。
  - pre-commit hook 会在已暂存的格式化 / lint 之后运行 `pnpm check:changed --staged`，因此仅 core 的提交不会承担扩展测试成本，除非它们触及面向扩展的公共契约。仅发布元数据的提交会保留在有针对性的版本 / 配置 / 根依赖通道上。
  - 如果完全相同的暂存变更集已经通过同等或更强的门禁验证，可使用 `scripts/committer --fast "<message>" <files...>` 仅跳过 changed-scope hook 的重跑。已暂存的格式化 / lint 仍会运行。请在交接中说明已完成的门禁。这也适用于在隔离的偶发 hook 失败被重跑并以有范围证明通过后使用。
  - `pnpm test:changed` 会在变更路径可以清晰映射到更小测试套件时，通过有范围通道进行路由。
  - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
  - 本地 worker 自动缩放现在有意更保守，并且当主机负载平均值已经很高时也会回退，因此默认情况下多个并发 Vitest 运行造成的影响会更小。
  - 基础 Vitest 配置会将项目 / 配置文件标记为 `forceRerunTriggers`，因此测试接线发生变化时，changed 模式重跑仍然正确。
  - 在受支持主机上，配置会保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你希望为直接性能分析指定一个显式缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
- 性能调试说明：
  - `pnpm test:perf:imports` 会启用 Vitest 的导入耗时报告以及导入明细输出。
  - `pnpm test:perf:imports:changed` 会将同样的性能分析视图限定为自 `origin/main` 以来发生变化的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将针对该已提交 diff 路由后的 `test:changed` 与原生根项目路径进行比较，并输出总耗时及 macOS 最大 RSS。
- `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和根 Vitest 配置，将当前未提交工作树中的变更文件列表进行路由，并对其进行基准测试。
  - `pnpm test:perf:profile:main` 会为 Vitest / Vite 启动和转换开销写出主线程 CPU profile。
  - `pnpm test:perf:profile:runner` 会在禁用文件级并行的情况下，为单元测试套件写出运行器 CPU + heap profile。

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制单 worker
- 范围：
  - 启动一个默认启用诊断的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 Gateway 网关 消息、内存和大负载抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化辅助函数
  - 断言记录器保持有界、合成 RSS 样本保持在压力预算内，并且每会话队列深度会回落到零
- 预期：
  - 对 CI 安全且不需要密钥
  - 用于稳定性回归跟进的窄范围通道，而不是完整 Gateway 网关 测试套件的替代品

### E2E（Gateway 网关 冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下内置插件的 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 和 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖方式：
  - `OPENCLAW_E2E_WORKERS=<n>` 强制设置 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关 端到端行为
  - WebSocket / HTTP 表面、节点配对和更重的网络交互
- 预期：
  - 在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比单元测试涉及更多可变因素（可能更慢）

### E2E：OpenShell 后端冒烟

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell Gateway 网关
  - 从一个临时的本地 Dockerfile 创建沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 验证 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远端规范文件系统行为
- 预期：
  - 仅按需启用；不属于默认的 `pnpm test:e2e` 运行
  - 需要本地 `openshell` CLI 和可工作的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关 和沙箱
- 常用覆盖方式：
  - `OPENCLAW_E2E_OPENSHELL=1`：在手动运行更广泛的 e2e 测试套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非默认 CLI 二进制或包装脚本

### 实时（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下内置插件的实时测试
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型 _今天_ 在真实凭证下是否真的可用？”
  - 捕获提供商格式变更、工具调用怪癖、认证问题和限流行为
- 预期：
  - 设计上不保证 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗限流额度
  - 优先运行缩小范围后的子集，而不是“全部”
- 实时运行会读取 `~/.profile`，以获取缺失的 API 密钥。
- 默认情况下，实时运行仍会隔离 `HOME`，并把配置 / 认证材料复制到临时测试 home 中，这样单元测试夹具就不会修改你真实的 `~/.openclaw`。
- 只有在你明确需要让实时测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静音 Gateway 网关 启动日志 / Bonjour 噪声。如果你想恢复完整启动日志，可设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（提供商特定）：设置 `*_API_KEYS` 为逗号 / 分号格式，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或者通过 `OPENCLAW_LIVE_*_KEY` 进行每次实时运行覆盖；测试会在遇到限流响应时重试。
- 进度 / 心跳输出：
  - 实时测试套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获很安静，较长的提供商调用也会显式显示为仍在进行中。
  - `vitest.live.config.ts` 禁用了 Vitest 控制台拦截，因此提供商 / Gateway 网关 进度行会在实时运行期间立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直连模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探针心跳。

## 我该运行哪个测试套件？

使用这个决策表：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果你改动很多，再加上 `pnpm test:coverage`）
- 触及 Gateway 网关 网络 / WS 协议 / 配对：再加上 `pnpm test:e2e`
- 调试“我的 bot 挂了” / 提供商特定故障 / 工具调用：运行缩小范围后的 `pnpm test:live`

## 实时：Android 节点能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android 节点当前宣告的**每一个命令**，并断言命令契约行为。
- 范围：
  - 预先准备 / 手动设置（该测试套件不会安装 / 运行 / 配对应用）。
  - 针对所选 Android 节点逐条验证 Gateway 网关 `node.invoke`。
- 所需预先设置：
  - Android 应用已连接并与 Gateway 网关 配对。
  - 应用保持在前台。
  - 你期望通过的能力所需的权限 / 捕获授权已授予。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android App](/zh-CN/platforms/android)

## 实时：模型冒烟测试（profile key）

实时测试分为两层，以便隔离故障：

- “直连模型”告诉我们：在给定密钥下，提供商 / 模型是否至少能响应。
- “Gateway 网关 冒烟”告诉我们：该模型的完整 Gateway 网关 + 智能体流水线是否正常工作（会话、历史、工具、沙箱策略等）。

### 第 1 层：直连模型补全（无 Gateway 网关）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举已发现的模型
  - 使用 `getApiKeyForModel` 选择你拥有凭证的模型
  - 对每个模型运行一个小型补全（并在需要时运行有针对性的回归测试）
- 启用方式：
  - `pnpm test:live`（或者如果你直接调用 Vitest，则设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，它是 modern 的别名）后，这个测试套件才会真正运行；否则会跳过，以便让 `pnpm test:live` 聚焦于 Gateway 网关 冒烟
- 如何选择模型：
  - `OPENCLAW_LIVE_MODELS=modern` 运行现代 allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是现代 allowlist 的别名
  - 或者 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（逗号分隔的 allowlist）
  - modern / all 扫描默认使用一组精心筛选的高信号上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 可运行完整的现代扫描，或设置正数以使用更小的上限。
- 如何选择提供商：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔的 allowlist）
- 密钥来源：
  - 默认：profile 存储和环境变量后备
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制仅使用 **profile 存储**
- 为什么需要这个：
  - 将“提供商 API 坏了 / 密钥无效”与“Gateway 网关 智能体流水线坏了”区分开
  - 容纳小而隔离的回归测试（例如：OpenAI Responses / Codex Responses 推理重放 + 工具调用流）

### 第 2 层：Gateway 网关 + dev 智能体冒烟（也就是 `@openclaw` 实际在做什么）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 在进程内启动一个 Gateway 网关
  - 创建 / 修补一个 `agent:dev:*` 会话（每次运行按模型覆盖）
  - 遍历带密钥的模型并断言：
    - 有“有意义”的响应（不使用工具）
    - 真实工具调用可用（读取探针）
    - 可选的额外工具探针可用（exec+read 探针）
    - OpenAI 回归路径（仅工具调用 → 后续跟进）继续正常工作
- 探针细节（这样你就能快速解释故障）：
  - `read` 探针：测试会在工作区中写入一个 nonce 文件，并要求智能体 `read` 该文件并回显 nonce。
  - `exec+read` 探针：测试会要求智能体通过 `exec` 将一个 nonce 写入临时文件，然后再 `read` 回来。
  - 图像探针：测试会附加一个生成的 PNG（猫 + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（或者如果你直接调用 Vitest，则设置 `OPENCLAW_LIVE_TEST=1`）
- 如何选择模型：
  - 默认：现代 allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代 allowlist 的别名
  - 或者设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）来缩小范围
  - modern / all Gateway 网关 扫描默认使用一组精心筛选的高信号上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可运行完整的现代扫描，或设置正数以使用更小的上限。
- 如何选择提供商（避免“OpenRouter 全家桶”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔的 allowlist）
- 工具 + 图像探针在这个实时测试中始终启用：
  - `read` 探针 + `exec+read` 探针（工具压力测试）
  - 当模型宣告支持图像输入时，会运行图像探针
  - 流程（高层）：
    - 测试生成一个带有 “CAT” + 随机代码的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` 的 `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关 将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式智能体将多模态用户消息转发给模型
    - 断言：回复中包含 `cat` + 该代码（OCR 容错：允许轻微错误）

提示：如果你想查看自己的机器上能测什么（以及精确的 `provider/model` id），请运行：

```bash
openclaw models list
openclaw models list --json
```

## 实时：CLI 后端冒烟（Claude、Codex、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway 网关 + 智能体流水线，同时不触碰你的默认配置。
- 后端特定的默认冒烟设置位于所属扩展的 `cli-backend.ts` 定义中。
- 启用：
  - `pnpm test:live`（或者如果你直接调用 Vitest，则设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认提供商 / 模型：`claude-cli/claude-sonnet-4-6`
  - 命令 / 参数 / 图像行为来自所属 CLI 后端插件元数据。
- 覆盖方式（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 发送真实图像附件（路径会注入到提示词中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 将图像文件路径作为 CLI 参数传递，而不是注入到提示词中。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）用于控制在设置 `IMAGE_ARG` 时图像参数的传递方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮并验证恢复流程。
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

单提供商 Docker 配方：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

说明：

- Docker 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它会在仓库 Docker 镜像中，以非 root 的 `node` 用户运行实时 CLI 后端冒烟测试。
- 它会从所属扩展中解析 CLI 冒烟元数据，然后将匹配的 Linux CLI 包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到可缓存、可写的前缀 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 中（默认值：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可移植的 Claude Code 订阅 OAuth，可通过 `~/.claude/.credentials.json` 中的 `claudeAiOauth.subscriptionType`，或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN` 提供。它会先在 Docker 中验证直接 `claude -p`，然后在不保留 Anthropic API 密钥环境变量的情况下运行两轮 Gateway 网关 CLI 后端测试。这个订阅通道默认禁用 Claude MCP / 工具 和图像探针，因为 Claude 当前会将第三方应用使用量路由到额外用量计费，而不是普通订阅计划限额。
- 实时 CLI 后端冒烟测试现在会对 Claude、Codex 和 Gemini 执行相同的端到端流程：文本轮次、图像分类轮次，然后通过 Gateway 网关 CLI 验证 MCP `cron` 工具调用。
- Claude 的默认冒烟测试还会将会话从 Sonnet 修补到 Opus，并验证恢复后的会话仍然记得先前的备注。

## 实时：ACP 绑定冒烟（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用一个实时 ACP 智能体验证真实的 ACP 会话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 原地绑定一个合成的消息渠道会话
  - 在同一个会话上发送一个普通的后续消息
  - 验证该后续消息落入已绑定 ACP 会话的转录中
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - Docker 中的 ACP 智能体：`claude,codex,gemini`
  - 直接运行 `pnpm test:live ...` 时使用的 ACP 智能体：`claude`
  - 合成渠道：Slack 私信 风格的会话上下文
  - ACP 后端：`acpx`
- 覆盖方式：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- 说明：
  - 这个通道使用 Gateway 网关 `chat.send` 表面，并带有仅管理员可用的合成 originating-route 字段，这样测试就能附加消息渠道上下文，而无需伪装成外部投递。
  - 当未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会使用内置 `acpx` 插件中针对所选 ACP harness 智能体的内建智能体注册表。

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
- 默认情况下，它会依次对所有受支持的实时 CLI 智能体运行 ACP 绑定冒烟测试：`claude`、`codex`，然后 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 可缩小矩阵范围。
- 它会读取 `~/.profile`，将匹配的 CLI 认证材料暂存到容器中，把 `acpx` 安装到可写 npm 前缀，然后在缺失时安装请求的实时 CLI（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）。
- 在 Docker 内部，运行器会设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，这样 `acpx` 就能让来自已读取 profile 的提供商环境变量继续对其子 harness CLI 可用。

## 实时：Codex app-server harness 冒烟测试

- 目标：通过正常的 Gateway 网关 `agent` 方法，验证插件自有的 Codex harness：
  - 加载内置 `codex` 插件
  - 选择 `OPENCLAW_AGENT_RUNTIME=codex`
  - 向 `codex/gpt-5.4` 发送第一轮 Gateway 网关 智能体消息
  - 向同一个 OpenClaw 会话发送第二轮消息，并验证 app-server 线程可以恢复
  - 通过同一个 Gateway 网关 命令路径运行 `/codex status` 和 `/codex models`
  - 可选地运行两个经 Guardian 审核的提权 shell 探针：一个应被批准的良性命令，以及一个应被拒绝、从而让智能体回头询问的伪造密钥上传命令
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认模型：`codex/gpt-5.4`
- 可选图像探针：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP / 工具探针：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可选 Guardian 探针：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 该冒烟测试会设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，因此损坏的 Codex harness 不能通过悄悄回退到 PI 而蒙混过关。
- 认证：来自 shell / profile 的 `OPENAI_API_KEY`，再加上可选复制的 `~/.codex/auth.json` 和 `~/.codex/config.toml`

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
- 它会读取挂载的 `~/.profile`，传递 `OPENAI_API_KEY`，在存在时复制 Codex CLI 认证文件，将 `@openai/codex` 安装到可写的挂载 npm 前缀，暂存源码树，然后仅运行 Codex harness 的实时测试。
- Docker 默认启用图像、MCP / 工具 以及 Guardian 探针。当你需要更窄范围的调试运行时，可设置 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`、`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或 `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 还会导出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，与实时测试配置保持一致，因此 `openai-codex/*` 或 PI 回退都无法掩盖 Codex harness 回归。

### 推荐的实时运行配方

缩小范围、显式 allowlist 的方式最快，也最不容易抖动：

- 单模型，直连（无 Gateway 网关）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，Gateway 网关 冒烟：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 聚焦 Google（Gemini API 密钥 + Antigravity）：
  - Gemini（API 密钥）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

说明：

- `google/...` 使用 Gemini API（API 密钥）。
- `google-antigravity/...` 使用 Antigravity OAuth bridge（Cloud Code Assist 风格的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（有独立的认证 + 工具行为差异）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API 密钥 / profile 认证）；这通常就是大多数用户所说的 “Gemini”。
  - CLI：OpenClaw 会调用本地 `gemini` 二进制；它有自己的认证方式，行为也可能不同（流式传输 / 工具支持 / 版本偏差）。

## 实时：模型矩阵（我们覆盖什么）

没有固定的“CI 模型列表”（实时测试是按需启用的），但以下是在拥有密钥的开发机上建议定期覆盖的模型。

### 现代冒烟集合（工具调用 + 图像）

这是我们期望持续保持可用的“常见模型”运行：

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

每个提供商家族至少选一个：

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

### 视觉：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型（Claude / Gemini / 支持视觉的 OpenAI 变体等），以覆盖图像探针。

### 聚合器 / 替代 Gateway 网关

如果你启用了相应密钥，也支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图像的候选项）
- OpenCode：Zen 用 `opencode/...`，Go 用 `opencode-go/...`（认证通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

如果你有凭证 / 配置，还可以将更多提供商纳入实时矩阵：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云 / API），以及任何兼容 OpenAI / Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档里硬编码“所有模型”。权威列表始终是你机器上 `discoverModels(...)` 的返回结果，以及当前可用的密钥。

## 凭证（切勿提交）

实时测试发现凭证的方式与 CLI 相同。实际含义是：

- 如果 CLI 可用，实时测试应该能找到相同的密钥。
- 如果实时测试提示“没有凭证”，就像调试 `openclaw models list` / 模型选择那样去调试。

- 每个智能体的认证 profile：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是实时测试中“profile keys”的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（存在时会复制到暂存的实时 home 中，但它不是主 profile-key 存储）
- 本地实时运行默认会将当前配置、每个智能体的 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 认证目录复制到临时测试 home 中；暂存的实时 home 会跳过 `workspace/` 和 `sandboxes/`，并剥离 `agents.*.workspace` / `agentDir` 路径覆盖，这样探针就不会落到你真实主机的工作区。

如果你想依赖环境变量密钥（例如已在 `~/.profile` 中导出），请在 `source ~/.profile` 后运行本地测试，或者使用下面的 Docker 运行器（它们可以把 `~/.profile` 挂载进容器）。

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
  - 除非配置了 `models.providers.comfy.<capability>`，否则会跳过每项能力
  - 在更改 comfy 工作流提交、轮询、下载或插件注册后很有用

## 图像生成实时测试

- 测试：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图像生成提供商插件
  - 在探测前，从你的登录 shell（`~/.profile`）加载缺失的提供商环境变量
  - 默认优先使用实时 / 环境变量 API 密钥，而不是已存储的认证 profile，这样 `auth-profiles.json` 中过期的测试密钥就不会掩盖真实 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 通过共享运行时能力运行标准图像生成变体：
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 当前覆盖的内置提供商：
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- 可选缩小范围：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile 存储认证，并忽略仅环境变量的覆盖

## 音乐生成实时测试

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media music`
- 范围：
  - 覆盖共享的内置音乐生成提供商路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前，从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用实时 / 环境变量 API 密钥，而不是已存储的认证 profile，这样 `auth-profiles.json` 中过期的测试密钥就不会掩盖真实 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 在可用时运行两个已声明的运行时模式：
    - `generate`：仅提示词输入
    - `edit`：当提供商声明 `capabilities.edit.enabled` 时
  - 当前共享通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：单独的 Comfy 实时测试文件，不在这个共享扫描中
- 可选缩小范围：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile 存储认证，并忽略仅环境变量的覆盖

## 视频生成实时测试

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media video`
- 范围：
  - 覆盖共享的内置视频生成提供商路径
  - 默认使用发布安全的冒烟路径：非 FAL 提供商、每个提供商一次文生视频请求、一秒龙虾提示词，以及来自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每提供商操作上限（默认 `180000`）
  - 默认跳过 FAL，因为提供商侧队列延迟可能主导发布时间；传入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可显式运行它
  - 在探测前，从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用实时 / 环境变量 API 密钥，而不是已存储的认证 profile，这样 `auth-profiles.json` 中过期的测试密钥就不会掩盖真实 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 默认仅运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 后，在可用时也会运行已声明的转换模式：
    - `imageToVideo`：当提供商声明 `capabilities.imageToVideo.enabled`，且所选提供商 / 模型在共享扫描中接受基于 buffer 的本地图像输入时
    - `videoToVideo`：当提供商声明 `capabilities.videoToVideo.enabled`，且所选提供商 / 模型在共享扫描中接受基于 buffer 的本地视频输入时
  - 当前在共享扫描中已声明但跳过的 `imageToVideo` 提供商：
    - `vydra`，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图像 URL
  - 提供商特定的 Vydra 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件会运行 `veo3` 文生视频，以及一个默认使用远程图像 URL fixture 的 `kling` 通道
  - 当前 `videoToVideo` 实时覆盖：
    - 仅 `runway`，且所选模型为 `runway/gen4_aleph` 时
  - 当前在共享扫描中已声明但跳过的 `videoToVideo` 提供商：
    - `alibaba`、`qwen`、`xai`，因为这些路径当前需要远程 `http(s)` / MP4 参考 URL
    - `google`，因为当前共享的 Gemini / Veo 通道使用本地基于 buffer 的输入，而该路径在共享扫描中不被接受
    - `openai`，因为当前共享通道缺少针对特定组织的视频局部重绘 / remix 访问保证
- 可选缩小范围：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 以在默认扫描中包含每个提供商，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 以在激进的冒烟运行中降低每个提供商的操作上限
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile 存储认证，并忽略仅环境变量的覆盖

## 媒体实时 harness

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

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- 实时模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 仅在仓库 Docker 镜像内运行与之匹配的 profile-key 实时测试文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），同时挂载你的本地配置目录和工作区（如果已挂载，也会读取 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 实时运行器默认使用更小的冒烟上限，以便完整 Docker 扫描保持可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，并且
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确需要更大的完整扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次实时 Docker 镜像，然后在两个实时 Docker 通道中复用它。它还会通过 `test:docker:e2e-build` 构建一个共享的 `scripts/e2e/Dockerfile` 镜像，并在验证已构建应用的 E2E 容器冒烟运行器中复用它。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

这些实时模型 Docker 运行器还会仅 bind-mount 所需的 CLI 认证 home（如果运行未缩小范围，则挂载所有受支持的），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就可以刷新 token，而不会改动主机认证存储：

- 直连模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI 实时冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导 / 渠道 / 智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包后的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证启用该插件时会按需安装其运行时依赖，运行 doctor，然后执行一次模拟 OpenAI 的智能体轮次。可通过 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机重建，或通过 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- Gateway 网关 网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses `web_search` 最小推理回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关 运行一个模拟 OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制提供商 schema 拒绝，并检查原始细节出现在 Gateway 网关 日志中。
- MCP 渠道桥接（预置 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi 内置 MCP 工具（真实 stdio MCP 服务器 + 内嵌 Pi profile allow / deny 冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron / 子智能体 MCP 清理（真实 Gateway 网关 + 在隔离 cron 和一次性子智能体运行后拆除 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟测试 + `/plugin` 别名 + Claude 内置包重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
- 插件更新未变更冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。可通过 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，在完成一次新的本地构建后通过 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过主机重建，或通过 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。
- 在迭代时，可通过禁用无关场景来缩小内置插件运行时依赖测试范围，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

如需手动预构建并复用共享的已构建应用镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置后，诸如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 之类的测试套件专用镜像覆盖仍然优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远端共享镜像时，如果本地尚不存在，脚本会先拉取它。QR 和安装器 Docker 测试仍保留各自的 Dockerfile，因为它们验证的是打包 / 安装行为，而不是共享的已构建应用运行时。

实时模型 Docker 运行器还会以只读方式 bind-mount 当前检出内容，并在容器内将其暂存到临时工作目录中。这样可以在保持运行时镜像精简的同时，仍然针对你精确的本地源码 / 配置运行 Vitest。
暂存步骤会跳过体积较大的本地专用缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地的 `.build` 或 Gradle 输出目录，因此 Docker 实时运行不会花上几分钟复制机器专用工件。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关 实时探针就不会在容器内启动真实的 Telegram / Discord 等渠道 worker。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要在该 Docker 通道中缩小范围或排除 Gateway 网关 实时覆盖时，也请一并传递 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关 容器，针对该 Gateway 网关 启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一次真实聊天请求。
第一次运行可能会明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI 也可能需要完成自己的冷启动设置。
这个通道需要一个可用的实时模型密钥，而 `OPENCLAW_PROFILE_FILE`（默认是 `~/.profile`）是在 Docker 化运行中提供该密钥的主要方式。
成功运行会打印一小段 JSON 负载，例如 `{ "ok": true, "model": "openclaw/default", ... }`。
`test:docker:mcp-channels` 刻意保持确定性，不需要真实的 Telegram、Discord 或 iMessage 账户。它会启动一个预置的 Gateway 网关 容器，再启动第二个容器来运行 `openclaw mcp serve`，然后通过真实的 stdio MCP bridge 验证路由后的会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。通知检查会直接检查原始 stdio MCP 帧，因此这个冒烟测试验证的是 bridge 实际发出了什么，而不只是某个特定客户端 SDK 恰好暴露了什么。
`test:docker:pi-bundle-mcp-tools` 也是确定性的，不需要实时模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实的 stdio MCP 探针服务器，通过内嵌 Pi 内置包 MCP 运行时将该服务器实体化，执行工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 也是确定性的，不需要实时模型密钥。它会启动一个带有真实 stdio MCP 探针服务器的预置 Gateway 网关，运行一次隔离的 cron 轮次和一次 `/subagents spawn` 的一次性子智能体轮次，然后验证每次运行后 MCP 子进程都会退出。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 请保留该脚本用于回归 / 调试工作流。它未来可能还会再次用于 ACP 线程路由验证，因此不要删除它。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前读取
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于仅验证从 `OPENCLAW_PROFILE_FILE` 读取的环境变量，使用临时配置 / 工作区目录，并且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内部缓存 CLI 安装
- `$HOME` 下的外部 CLI 认证目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围后的提供商运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用现有的 `openclaw:local-live` 镜像，以便重跑无需重建的测试
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关 为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试中使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

修改文档后请运行文档检查：`pnpm check:docs`。
当你还需要页内标题检查时，请运行完整的 Mintlify anchor 校验：`pnpm docs:check-links:anchors`。

## 离线回归测试（CI 安全）

这些是在不依赖真实提供商情况下的“真实流水线”回归测试：

- Gateway 网关 工具调用（模拟 OpenAI，真实 Gateway 网关 + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关 向导（WS `wizard.start` / `wizard.next`，强制写入配置 + 认证）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些 CI 安全的测试，它们的行为类似“智能体可靠性评估”：

- 通过真实的 Gateway 网关 + 智能体循环进行模拟工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills（参见 [Skills](/zh-CN/tools/skills)），目前仍缺少的部分：

- **决策**：当 Skills 在提示词中列出时，智能体是否会选择正确的 Skills（或避免选择无关的 Skills）？
- **合规性**：智能体是否会在使用前读取 `SKILL.md`，并遵循要求的步骤 / 参数？
- **工作流契约**：用于断言工具顺序、会话历史继承，以及沙箱边界的多轮场景。

未来的评估应首先保持确定性：

- 一个使用模拟提供商的场景运行器，用于断言工具调用 + 顺序、Skill 文件读取，以及会话接线。
- 一小组面向 Skill 的场景（使用 vs 避免、门控、提示词注入）。
- 只有在 CI 安全套件就位之后，才添加可选的实时评估（按需启用、由环境变量控制）。

## 契约测试（插件和渠道形状）

契约测试会验证每个已注册的插件和渠道是否符合其接口契约。它们会遍历所有已发现的插件，并运行一组形状和行为断言。默认的 `pnpm test` 单元测试通道会刻意跳过这些共享接缝和冒烟文件；当你改动共享渠道或提供商表面时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息负载结构
- **inbound** - 入站消息处理
- **actions** - 渠道操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略强制执行

### 提供商状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择 / 选择逻辑
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状 / 接口
- **wizard** - 设置向导

### 何时运行

- 修改插件 SDK 导出或子路径后
- 添加或修改渠道或提供商插件后
- 重构插件注册或发现逻辑后

契约测试会在 CI 中运行，不需要真实 API 密钥。

## 添加回归测试（指南）

当你修复了一个在实时测试中发现的提供商 / 模型问题时：

- 如果可能，添加一个 CI 安全的回归测试（模拟 / stub 提供商，或捕获确切的请求形状转换）
- 如果它本质上只能通过实时测试验证（限流、认证策略），就让该实时测试保持范围小，并通过环境变量按需启用
- 优先针对能捕获该缺陷的最小层级：
  - 提供商请求转换 / 重放缺陷 → 直连模型测试
  - Gateway 网关 会话 / 历史 / 工具流水线缺陷 → Gateway 网关 实时冒烟测试，或 CI 安全的 Gateway 网关 模拟测试
- SecretRef 遍历防护：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言遍历段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加了新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会刻意在目标 id 未分类时失败，这样新类别就不能被悄悄跳过。
