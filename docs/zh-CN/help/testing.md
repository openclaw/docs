---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元/e2e/实时测试套件、Docker runners，以及每类测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-24T03:41:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ca5569f167962e3b55cd1873aacaa1eef020fccf2b662cb52b9a6e79fe3f69d
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三套 Vitest 测试套件（单元/集成、e2e、实时），以及少量
Docker runners。本文是一份“我们如何测试”的指南：

- 每套测试覆盖什么内容（以及刻意**不**覆盖什么）。
- 常见工作流该运行哪些命令（本地、推送前、调试）。
- 实时测试如何发现凭据，以及如何选择模型/提供商。
- 如何为真实世界中的模型/提供商问题添加回归测试。

## 快速开始

大多数情况下：

- 完整门禁（预期在 push 前执行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在资源充足的机器上更快地运行本地完整套件：`pnpm test:max`
- 直接进入 Vitest watch 循环：`pnpm test:watch`
- 直接指定文件现在也支持 extension/channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代某个单独失败用例时，优先使用有针对性的测试运行。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试，或想获得更高信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

当你在调试真实的提供商/模型时（需要真实凭据）：

- 实时套件（模型 + Gateway 网关 tool/image probes）：`pnpm test:live`
- 安静地只跑一个实时测试文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker 实时模型扫描：`pnpm test:docker:live-models`
  - 现在每个选中的模型都会运行一个文本轮次加一个小型文件读取类 probe。
    元数据声明支持 `image` 输入的模型还会运行一个微型图像轮次。
    在隔离提供商故障时，可通过 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用这些额外 probes。
  - CI 覆盖：每日的 `OpenClaw Scheduled Live And E2E Checks` 与手动触发的
    `OpenClaw Release Checks` 都会调用可复用的实时/E2E 工作流，并设置
    `include_live_suites: true`，其中包括按提供商分片的独立 Docker 实时模型
    矩阵作业。
  - 若要有针对性地重跑 CI，请触发 `OpenClaw Live And E2E Checks (Reusable)`，
    并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 添加新的高信号提供商 secrets 时，也要更新 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其
    定时/发布调用方。
- 原生 Codex 绑定聊天 smoke：`pnpm test:docker:live-codex-bind`
  - 会针对 Codex app-server 路径运行一个 Docker 实时通道，使用 `/codex bind`
    绑定一个合成 Slack 私信，执行 `/codex fast` 和
    `/codex permissions`，然后验证普通回复和图像附件都通过原生插件绑定路由，
    而不是通过 ACP。
- Moonshot/Kimi 成本 smoke：设置好 `MOONSHOT_API_KEY` 后，运行
  `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6`
  运行一个隔离的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  。验证 JSON 报告中显示 Moonshot/K2.6，并且助手转录中保存了规范化的
  `usage.cost`。

提示：如果你只需要一个失败用例，优先通过下文介绍的允许列表环境变量来缩小实时测试范围。

## QA 专用 runners

当你需要 QA-lab 级别的真实性时，这些命令与主测试套件并列使用：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 和
手动触发时使用模拟提供商运行。`QA-Lab - All Lanes` 会在 `main` 上每夜运行，
并支持手动触发，以并行作业形式运行模拟 parity gate、实时 Matrix 通道以及
由 Convex 管理的实时 Telegram 通道。`OpenClaw Release Checks`
会在发布批准前运行相同的通道。

- `pnpm openclaw qa suite`
  - 直接在宿主机上运行基于仓库的 QA 场景。
  - 默认会使用隔离的 Gateway 网关 workers 并行运行多个选定场景。
    `qa-channel` 默认并发数为 4（上限受所选场景数量限制）。使用 `--concurrency <count>`
    调整 worker 数量，或使用 `--concurrency 1` 恢复旧的串行通道。
  - 任一场景失败时会以非零状态退出。若你希望保留产物但不以失败退出，可使用 `--allow-failures`。
  - 支持的 provider 模式包括 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个本地 AIMock 支持的 provider 服务器，用于实验性
    fixture 和协议 mock 覆盖，但不会替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中运行同样的 QA 套件。
  - 与宿主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的 provider/model 选择标志。
  - 实时运行会转发适合传入 guest 的受支持 QA 认证输入：
    基于 env 的 provider keys、QA 实时 provider 配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，这样 guest 才能通过挂载的工作区写回结果。
  - 会将常规 QA 报告 + 摘要，以及 Multipass 日志写入
    `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动基于 Docker 的 QA 站点，用于偏操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前 checkout 构建一个 npm tarball，在 Docker 中全局安装，以非交互方式
    运行 OpenAI API key 新手引导，默认配置 Telegram，验证启用插件会按需安装
    运行时依赖，运行 doctor，并在模拟 OpenAI 端点上执行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在 Discord 上运行同样的
    打包安装通道。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，启动已配置 OpenAI 的 Gateway 网关，
    然后通过配置编辑启用 bundled channel/plugins。
  - 验证 setup discovery 会让未配置 plugin 的运行时依赖保持未安装状态；
    第一次配置后的 Gateway 网关或 doctor 运行会按需安装每个 bundled plugin 的
    运行时依赖；第二次重启则不会重新安装已经启用过的依赖。
  - 还会安装一个已知的较旧 npm 基线，在运行 `openclaw update --tag <candidate>`
    之前先启用 Telegram，并验证候选版本在更新后的 doctor 中会修复 bundled
    channel 运行时依赖，而无需 harness 侧进行 postinstall 修复。
- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock provider 服务器，用于直接协议 smoke 测试。
- `pnpm openclaw qa matrix`
  - 针对一次性、基于 Docker 的 Tuwunel homeserver 运行 Matrix 实时 QA 通道。
  - 这个 QA 宿主当前仅面向仓库/开发环境。打包安装的 OpenClaw 不包含
    `qa-lab`，因此也不会暴露 `openclaw qa`。
  - 仓库 checkout 会直接加载内置 runner；无需额外的插件安装步骤。
  - 会创建三个临时 Matrix 用户（`driver`、`sut`、`observer`）以及一个私有房间，
    然后以真实 Matrix 插件作为 SUT 传输层启动一个 QA Gateway 网关子进程。
  - 默认使用固定的稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。
    当你需要测试其他镜像时，可通过 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享的 credential-source 标志，因为该通道会在本地创建一次性用户。
  - 会将 Matrix QA 报告、摘要、observed-events 产物，以及合并后的 stdout/stderr
    输出日志写入 `.artifacts/qa-e2e/...`。
- `pnpm openclaw qa telegram`
  - 针对真实私有群组运行 Telegram 实时 QA 通道，并使用 env 中的 driver 和 SUT bot token。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是数字型 Telegram chat id。
  - 支持 `--credential-source convex` 以使用共享池化凭据。默认使用 env 模式，
    或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 任一场景失败时会以非零状态退出。若你希望保留产物但不以失败退出，可使用 `--allow-failures`。
  - 需要两个不同的 bot 位于同一个私有群组中，且 SUT bot 需要暴露 Telegram 用户名。
  - 为获得稳定的 bot-to-bot 观测，请在 `@BotFather` 中为两个 bot 都启用 Bot-to-Bot Communication Mode，并确保 driver bot 能观测到群组中的 bot 流量。
  - 会将 Telegram QA 报告、摘要和 observed-messages 产物写入 `.artifacts/qa-e2e/...`。回复场景还包括从 driver 发送请求到观测到 SUT 回复的 RTT。

实时传输通道共享一个标准契约，以防新增传输方式逐渐偏离：

`qa-channel` 仍然是广泛的合成 QA 套件，不属于实时传输覆盖矩阵的一部分。

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### 通过 Convex 共享 Telegram 凭据（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的池中获取一个独占租约，在通道运行期间持续发送该租约的 heartbeat，并在关闭时释放租约。

参考的 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 针对所选角色的一个 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 对应 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 对应 `ci`
- 凭据角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认为 `ci`，否则为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选追踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅本地开发时使用 loopback `http://` Convex URL。

正常运行时，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理命令（池添加/删除/列出）必须明确使用
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供维护者使用的 CLI helpers：

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在脚本和 CI 工具中可使用 `--json` 获取机器可读输出。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 池耗尽/可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /admin/add`（仅维护者 secret）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅维护者 secret）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活动租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅维护者 secret）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 类型的 payload 结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字形式的 Telegram chat id 字符串。
- `admin/add` 会在 `kind: "telegram"` 时验证该结构，并拒绝格式错误的 payload。

### 向 QA 添加一个渠道

向 markdown QA 系统添加一个渠道，严格来说只需要两样东西：

1. 该渠道的传输适配器。
2. 用于验证该渠道契约的场景包。

当共享的 `qa-lab` 宿主已经能承载整个流程时，不要再新增一个顶层 QA 命令根。

`qa-lab` 负责共享宿主机制：

- `openclaw qa` 命令根
- 套件启动与清理
- worker 并发
- 产物写入
- 报告生成
- 场景执行
- 对旧版 `qa-channel` 场景的兼容别名

Runner 插件负责传输契约：

- `openclaw qa <runner>` 如何挂载在共享 `qa` 根命令下
- 如何为该传输方式配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何暴露转录内容和规范化后的传输状态
- 如何执行基于传输的操作
- 如何处理传输专属的重置或清理

新增渠道的最低接入门槛是：

1. 保持由 `qa-lab` 负责共享 `qa` 根命令。
2. 在共享的 `qa-lab` 宿主接缝上实现传输 runner。
3. 将传输专属机制保留在 runner 插件或渠道 harness 内部。
4. 将 runner 挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。
   Runner 插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 轻量；延迟加载的 CLI 和 runner 执行应放在单独的入口点之后。
5. 在按主题划分的 `qa/scenarios/` 目录下编写或适配 markdown 场景。
6. 为新场景使用通用场景 helper。
7. 保持现有兼容别名继续工作，除非仓库正在进行有意的迁移。

决策规则非常严格：

- 如果某种行为可以在 `qa-lab` 中统一表达一次，就把它放在 `qa-lab` 中。
- 如果某种行为依赖单一渠道传输，就把它保留在对应 runner 插件或 plugin harness 中。
- 如果某个场景需要一个多个渠道都可使用的新能力，请添加通用 helper，而不是在 `suite.ts` 中加入渠道专属分支。
- 如果某种行为只对一种传输方式有意义，就让该场景保持传输专属，并在场景契约中明确说明。

新场景推荐使用的通用 helper 名称：

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

新的渠道工作应使用通用 helper 名称。
兼容别名的存在是为了避免一次性的大迁移，而不是作为
新场景编写的模板。

## 测试套件（各自运行在哪里）

可以将这些套件理解为“真实性逐步增强”（同时也意味着更高的不稳定性/成本）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：未指定目标的运行会使用 `vitest.full-*.config.ts` 分片集，并可能将多项目分片展开为按项目划分的配置，以便并行调度
- 文件：core/单元测试清单位于 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts`，以及由 `vitest.unit.config.ts` 覆盖白名单的 `ui` Node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 已知缺陷的确定性回归测试
- 预期：
  - 会在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
    <AccordionGroup>
    <Accordion title="项目、分片和范围通道"> - 未指定目标的 `pnpm test` 会运行十二个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是启动一个庞大的原生根项目进程。这样可以降低高负载机器上的峰值 RSS，并避免 auto-reply/extension 工作拖慢无关套件。 - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不现实。 - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会优先通过范围通道来处理显式文件/目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不需要承担完整根项目启动的成本。 - 当变更仅触及可路由的源码/测试文件时，`pnpm test:changed` 会将 git 变更路径展开到同样的范围通道；配置/setup 编辑仍会回退到宽范围的根项目重跑。 - `pnpm check:changed` 是日常窄范围工作的标准智能本地门禁。它会将 diff 分类为 core、core 测试、extensions、extension 测试、apps、文档、发布元数据和工具，然后运行匹配的 typecheck/lint/test 通道。公开的 Plugin SDK 和 plugin-contract 变更会额外包含一次 extension 校验，因为 extensions 依赖这些 core 契约。仅发布元数据的版本提升会运行有针对性的 version/config/root-dependency 检查，而不是完整套件，并带有一个 guard，用于拒绝顶层 version 字段之外的 package 变更。 - 来自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 以及类似纯工具区域的轻导入单元测试，会路由到 `unit-fast` 通道，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件则仍然留在现有通道中。 - 某些选定的 `plugin-sdk` 和 `commands` helper 源文件，也会在 changed 模式下映射到这些轻量通道中的显式同级测试，因此 helper 编辑不必为该目录重跑完整的重型套件。 - `auto-reply` 有三个专用桶：顶层 core helpers、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树。这样可以将最重的 reply harness 工作从便宜的 status/chunk/token 测试中剥离出来。
    </Accordion>

      <Accordion title="内嵌 runner 覆盖">
        - 当你修改消息工具发现输入或压缩运行时上下文时，请保持两个层级的覆盖。
        - 为纯路由和规范化边界添加聚焦的 helper 回归测试。
        - 保持内嵌 runner 集成套件健康：
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
        - 这些套件会验证带作用域的 id 和压缩行为仍能经过真实的 `run.ts` / `compact.ts` 路径流动；仅有 helper 级测试并不足以替代这些集成路径。
      </Accordion>

      <Accordion title="Vitest 池与隔离默认值">
        - 基础 Vitest 配置默认使用 `threads`。
        - 共享 Vitest 配置固定使用 `isolate: false`，并在根项目、e2e 和实时配置中采用非隔离 runner。
        - 根 UI 通道保留其 `jsdom` setup 和 optimizer，但也运行在共享的非隔离 runner 上。
        - 每个 `pnpm test` 分片都从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
        - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行时的 V8 编译抖动。
          若要与原生 V8 行为做对比，请设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`。
      </Accordion>

      <Accordion title="快速本地迭代">
        - `pnpm changed:lanes` 可显示某个 diff 触发了哪些架构通道。
        - pre-commit hook 仅处理格式化。它会重新暂存格式化后的文件，并且不会运行 lint、typecheck 或测试。
        - 在交接或 push 之前，如果你需要智能本地门禁，请显式运行 `pnpm check:changed`。公开的 Plugin SDK 和 plugin-contract 变更会额外包含一次 extension 校验。
        - `pnpm test:changed` 会在变更路径可以清晰映射到较小套件时，通过范围通道运行。
        - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是提高了 worker 上限。
        - 本地 worker 自动扩缩策略刻意较为保守；当宿主机负载平均值已经较高时，会自动回退，因此多个并发的 Vitest 运行默认造成的影响更小。
        - 基础 Vitest 配置会将项目/配置文件标记为 `forceRerunTriggers`，从而确保测试接线变更时，changed 模式重跑仍然正确。
        - 配置会在支持的宿主上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接性能分析指定一个明确的缓存位置，请设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
      </Accordion>

      <Accordion title="性能调试">
        - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告，以及导入分解输出。
        - `pnpm test:perf:imports:changed` 会将同样的分析视图限定到自 `origin/main` 以来发生变更的文件。
        - 当某个热点测试仍将大部分时间花在启动导入上时，应将重依赖放在一个狭窄的本地 `*.runtime.ts` 接缝之后，并直接 mock 该接缝，而不是为了传入 `vi.mock(...)` 就深层导入运行时 helpers。
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将已路由的 `test:changed` 与该提交 diff 对应的原生根项目路径进行比较，并输出总耗时和 macOS 最大 RSS。
        - `pnpm test:perf:changed:bench -- --worktree` 会通过
          `scripts/test-projects.mjs` 和根 Vitest 配置，基于当前脏工作树对变更文件列表进行基准测试。
        - `pnpm test:perf:profile:main` 会为 Vitest/Vite 启动与转换开销写出主线程 CPU profile。
        - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为单元测试套件写出 runner CPU+heap profiles。
      </Accordion>
    </AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制单 worker 运行
- 范围：
  - 启动一个默认启用诊断的真实 local loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 Gateway 网关消息、内存和大负载抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化 helpers
  - 断言 recorder 始终有界、合成 RSS 样本保持在压力预算内，并且每个会话的队列深度最终回落到零
- 预期：
  - 对 CI 安全，且不需要密钥
  - 这是一个用于稳定性回归跟进的窄范围通道，并不能替代完整的 Gateway 网关测试套件

### E2E（Gateway 网关 smoke）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的 bundled plugin E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads`，并设置 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 workers（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 强制指定 worker 数量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP surface、节点配对和更重的网络交互
- 预期：
  - 会在 CI 中运行（当流水线中启用时）
  - 不需要真实密钥
  - 比单元测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端 smoke

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在宿主机上启动一个隔离的 OpenShell Gateway 网关
  - 从一个临时本地 Dockerfile 创建沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱文件系统桥接验证远程为准的文件系统行为
- 预期：
  - 仅按需启用；不属于默认的 `pnpm test:e2e` 运行
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：在手动运行更广泛的 e2e 套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非默认的 CLI 二进制或包装脚本

### 实时（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的 bundled plugin 实时测试
- 默认：由 `pnpm test:live` **启用**（会设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “今天这个提供商/模型在真实凭据下是否真的可用？”
  - 捕获提供商格式变更、工具调用怪癖、认证问题和速率限制行为
- 预期：
  - 从设计上就不是 CI 稳定型测试（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 优先运行缩小范围的子集，而不是“一口气跑所有内容”
- 实时运行会加载 `~/.profile` 以补齐缺失的 API keys。
- 默认情况下，实时运行仍会隔离 `HOME`，并将配置/认证材料复制到临时测试 home 中，这样单元测试 fixture 就不会修改你真实的 `~/.openclaw`。
- 仅当你明确需要让实时测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：会保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静音 Gateway 网关启动日志/Bonjour 噪音。如需恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（按提供商）：设置 `*_API_KEYS`（逗号/分号格式）或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可以通过 `OPENCLAW_LIVE_*_KEY` 做每次实时运行覆盖；测试在遇到速率限制响应时会自动重试。
- 进度/heartbeat 输出：
  - 实时套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获处于安静模式，长时间的提供商调用也能显示为仍在活动中。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此提供商/Gateway 网关进度行会在实时运行期间立即流出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型 heartbeat。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关/probe heartbeat。

## 我应该运行哪套测试？

使用这个决策表：

- 修改逻辑/测试：运行 `pnpm test`（如果改动很多，再加上 `pnpm test:coverage`）
- 涉及 Gateway 网关网络 / WS 协议 / 配对：再加上 `pnpm test:e2e`
- 调试“我的机器人挂了” / 提供商专属故障 / 工具调用：运行缩小范围的 `pnpm test:live`

## 实时（触网）测试

关于实时模型矩阵、CLI 后端 smoke、ACP smoke、Codex app-server
harness，以及所有媒体提供商实时测试（Deepgram、BytePlus（国际版）、ComfyUI、图像、
音乐、视频、媒体 harness）——以及实时运行的凭据处理——请参见
[测试 — 实时套件](/zh-CN/help/testing-live)。

## Docker runners（可选的“在 Linux 上可运行”检查）

这些 Docker runners 分为两类：

- 实时模型 runners：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行与其 profile-key 匹配的实时测试文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），会挂载你的本地配置目录和工作区（如果已挂载，也会加载 `~/.profile`）。对应的本地入口命令是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 实时 runners 默认使用更小的 smoke 上限，以便完整 Docker 扫描仍然可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确想要更大范围的穷举扫描时，再覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次实时 Docker 镜像，然后将其复用于两个实时 Docker 通道。它还会通过 `test:docker:e2e-build` 构建一个共享的 `scripts/e2e/Dockerfile` 镜像，并将其复用于运行已构建应用的 E2E 容器 smoke runners。
- 容器 smoke runners：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层的集成路径。

实时模型 Docker runners 还会只 bind-mount 所需的 CLI 认证 home（若运行未缩小范围，则挂载所有支持的认证 home），然后在运行前将其复制到容器 home 中，这样外部 CLI OAuth 就可以刷新 token，而不会修改宿主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定 smoke：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端 smoke：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI 实时 smoke：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY、完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导/渠道/智能体 smoke：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包好的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证启用插件时会按需安装其运行时依赖，运行 doctor，并执行一次模拟 OpenAI 智能体轮次。你可以通过 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过宿主机构建，或通过 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- Bun 全局安装 smoke：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前工作树，在隔离 home 中用 `bun install -g` 安装，并验证 `openclaw infer image providers --json` 会返回内置图像提供商，而不是卡住。你可以通过 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过宿主机构建，或通过 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker smoke：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享同一个 npm 缓存。更新 smoke 默认以 npm `latest` 作为稳定基线，再升级到候选 tarball。非 root 安装器检查会保留独立的 npm 缓存，这样 root 拥有的缓存条目就不会掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重复运行时复用 root/update/direct-npm 缓存。
- Install Smoke CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；若你需要覆盖直接 `npm install -g` 的场景，请在本地运行脚本时不要设置这个环境变量。
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses `web_search` 最小推理回归：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟 OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制提供商 schema 拒绝，并检查原始细节是否出现在 Gateway 网关日志中。
- MCP 渠道桥接（已初始化的 Gateway 网关 + stdio bridge + 原始 Claude notification-frame smoke）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 内嵌 Pi profile allow/deny smoke）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/子智能体 MCP 清理（真实 Gateway 网关 + 在隔离 cron 和一次性子智能体运行后清理 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装 smoke + `/plugin` 别名 + Claude-bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
- 插件更新未变更 smoke：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据 smoke：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- Bundled plugin 运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker runner 镜像，在宿主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。可通过 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用该镜像，通过 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 在一次新的本地构建后跳过宿主机构建，或通过 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向一个已有 tarball。
- 在迭代时，可通过禁用无关场景来缩小 bundled plugin 运行时依赖测试范围，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

若要手动预构建并复用共享的 built-app 镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

当设置了套件专用镜像覆盖项（例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）时，它们仍然优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果本地尚未存在，脚本会先拉取它。QR 和安装器 Docker 测试保留各自的 Dockerfile，因为它们验证的是包/安装行为，而不是共享的已构建应用运行时。

实时模型 Docker runners 还会以只读方式 bind-mount 当前 checkout，并将其暂存到容器内的临时 workdir 中。这样既能保持运行时镜像精简，又能让 Vitest 针对你本地精确的源码/配置运行。暂存步骤会跳过大型本地专用缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或 Gradle 输出目录，因此 Docker 实时运行不会花上几分钟去复制这些机器专属产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关实时 probes 就不会在容器内启动真实的 Telegram/Discord 等渠道 workers。
`test:docker:live-models` 仍然会运行 `pnpm test:live`，因此当你需要缩小或排除该 Docker 通道中的 Gateway 网关实时覆盖时，也请一并传入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层的兼容性 smoke：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，再针对该 Gateway 网关启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 完成登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一条真实聊天请求。
第一次运行可能明显更慢，因为 Docker 可能需要拉取
Open WebUI 镜像，而 Open WebUI 也可能需要完成自己的冷启动设置。
这个通道需要一个可用的实时模型 key，而 `OPENCLAW_PROFILE_FILE`
（默认 `~/.profile`）是在 Docker 化运行中提供该 key 的主要方式。
成功运行后会打印一个小型 JSON 负载，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意设计为确定性的，不需要真实的
Telegram、Discord 或 iMessage 账户。它会启动一个已预置的 Gateway
网关容器，再启动第二个容器来运行 `openclaw mcp serve`，然后验证
路由会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，
以及通过真实 stdio MCP bridge 传递的 Claude 风格渠道 +
权限通知。通知检查会直接检查原始 stdio MCP 帧，因此这个 smoke
验证的是 bridge 实际发出的内容，而不仅仅是某个特定客户端 SDK 恰好暴露的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要实时模型 key。它会构建仓库 Docker 镜像，在容器中启动一个真实的 stdio MCP probe server，通过内嵌 Pi bundle MCP 运行时将该 server 实例化，执行工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 也是确定性的，不需要实时模型
key。它会启动一个带有真实 stdio MCP probe server 的预置 Gateway 网关，
运行一次隔离的 cron 轮次和一次 `/subagents spawn` 一次性子智能体轮次，
然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程 smoke（不在 CI 中运行）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留这个脚本用于回归/调试工作流。未来可能还会再次需要它来验证 ACP 线程路由，因此不要删除它。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前加载
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`：仅验证来自 `OPENCLAW_PROFILE_FILE` 的环境变量，使用临时配置/工作区目录，并且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于缓存 Docker 内部的 CLI 安装
- `$HOME` 下的外部 CLI 认证目录/文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围的提供商运行只会挂载由 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 也可以通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`：缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`：在容器内过滤提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1`：复用已有的 `openclaw:local-live` 镜像，用于不需要重建的重复运行
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`：确保凭据来自 profile 存储，而不是 env
- `OPENCLAW_OPENWEBUI_MODEL=...`：选择 Gateway 网关为 Open WebUI smoke 暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...`：覆盖 Open WebUI smoke 使用的 nonce 检查提示
- `OPENWEBUI_IMAGE=...`：覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

修改文档后运行文档检查：`pnpm check:docs`。
如果你还需要页内标题级别的完整 Mintlify anchor 校验，请运行：`pnpm docs:check-links:anchors`。

## 离线回归（对 CI 安全）

这些是在**没有真实提供商**情况下的“真实流水线”回归：

- Gateway 网关工具调用（模拟 OpenAI、真实 Gateway 网关 + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，强制写入 config + auth）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些对 CI 安全、且行为类似“智能体可靠性评估”的测试：

- 通过真实 Gateway 网关 + 智能体循环进行模拟工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

Skills（参见 [Skills](/zh-CN/tools/skills)）目前仍缺少的部分：

- **决策能力：** 当提示中列出 Skills 时，智能体是否会选择正确的 Skill（或避开无关 Skill）？
- **遵从性：** 智能体在使用前是否会读取 `SKILL.md`，并遵循要求的步骤/参数？
- **工作流契约：** 多轮场景是否能断言工具顺序、会话历史延续，以及沙箱边界？

未来的评估应优先保持确定性：

- 一个使用模拟提供商的场景 runner，用于断言工具调用 + 顺序、Skill 文件读取和会话接线。
- 一小套面向 Skill 的场景（使用 vs 避免、门控、提示注入）。
- 只有在对 CI 安全的套件先落地之后，才考虑可选的实时评估（需显式启用，并受 env 门控）。

## 契约测试（plugin 和渠道形状）

契约测试用于验证每个已注册的 plugin 和渠道都符合其接口契约。它们会遍历所有已发现的 plugins，并运行一组形状与行为断言。默认的 `pnpm test` 单元测试通道会刻意跳过这些共享接缝和 smoke 文件；当你修改共享渠道或提供商 surface 时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本 plugin 形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息负载结构
- **inbound** - 入站消息处理
- **actions** - 渠道动作处理器
- **threading** - 线程 ID 处理
- **directory** - Directory/roster API
- **group-policy** - 群组策略执行

### 提供商状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态 probes
- **registry** - Plugin 注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择/选择流程
- **catalog** - 模型目录 API
- **discovery** - Plugin 发现
- **loader** - Plugin 加载
- **runtime** - 提供商运行时
- **shape** - Plugin 形状/接口
- **wizard** - 设置向导

### 何时运行

- 修改 plugin-sdk 导出或子路径之后
- 添加或修改渠道或提供商 plugin 之后
- 重构 plugin 注册或发现逻辑之后

契约测试会在 CI 中运行，且不需要真实 API keys。

## 添加回归测试（指导）

当你修复了在实时运行中发现的某个提供商/模型问题时：

- 如果可能，添加一个对 CI 安全的回归测试（模拟/存根提供商，或捕获精确的请求形状转换）
- 如果它本质上只能在实时环境中复现（速率限制、认证策略），就保持实时测试范围尽量小，并通过环境变量显式启用
- 优先瞄准能捕获该缺陷的最小层级：
  - 提供商请求转换/重放缺陷 → 直接模型测试
  - Gateway 网关会话/历史/工具流水线缺陷 → Gateway 网关实时 smoke 或对 CI 安全的 Gateway 网关 mock 测试
- SecretRef 遍历防护：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言遍历段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增了一个 `includeInPlan` SecretRef 目标族，请同步更新该测试中的 `classifyTargetClass`。这个测试会在遇到未分类的目标 id 时故意失败，从而防止新类别被静默跳过。
