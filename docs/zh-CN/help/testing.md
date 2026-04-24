---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：unit/e2e/live 测试套件、Docker 运行器，以及每项测试涵盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-24T02:42:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: e79571c5a2ebabf025e47fa8bff59beff0d1c3662b53d7c28798a804dea8088d
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三个 Vitest 测试套件（unit/integration、e2e、live）以及一小组 Docker 运行器。本文档是“我们如何测试”的指南：

- 每个测试套件涵盖的内容（以及它**有意不**涵盖的内容）。
- 常见工作流应运行哪些命令（本地、推送前、调试）。
- live 测试如何发现凭证并选择模型/提供商。
- 如何为真实世界中的模型/提供商问题添加回归测试。

## 快速开始

大多数时候：

- 完整门禁（预期应在推送前运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置宽裕的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接进入 Vitest 监听循环：`pnpm test:watch`
- 现在直接按文件定位也会路由 extension/channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代单个失败用例时，优先先跑有针对性的测试。
- 基于 Docker 的 QA 站点：`pnpm qa:lab:up`
- 基于 Linux VM 的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试或想要更高信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商/模型时（需要真实凭证）：

- live 测试套件（模型 + Gateway 网关工具/图像探测）：`pnpm test:live`
- 安静地只跑一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 现在每个选中的模型都会运行一次文本轮次外加一个小型文件读取风格的探测。元数据声明支持 `image` 输入的模型还会额外运行一个小型图像轮次。在隔离提供商故障时，可通过 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用这些额外探测。
  - CI 覆盖：每日的 `OpenClaw Scheduled Live And E2E Checks` 和手动触发的 `OpenClaw Release Checks` 都会调用可复用的 live/E2E 工作流，并设置 `include_live_suites: true`，其中包含按提供商分片的独立 Docker live 模型矩阵作业。
  - 对于定向的 CI 重跑，可触发 `OpenClaw Live And E2E Checks (Reusable)`，并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 向 `scripts/ci-hydrate-live-auth.sh` 以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其 scheduled/release 调用方中添加新的高信号提供商密钥。
- Moonshot/Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行
  `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行独立的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  。确认 JSON 报告的是 Moonshot/K2.6，并且助手转录中存储了标准化后的 `usage.cost`。

提示：如果你只需要一个失败用例，优先使用下文描述的 allowlist 环境变量来缩小 live 测试范围。

## QA 专用运行器

当你需要 QA lab 的真实环境时，这些命令与主测试套件并列提供：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，也可以通过手动触发使用 mock 提供商运行。`QA-Lab - All Lanes` 会在 `main` 上每晚运行，也可以通过手动触发以 mock parity gate、live Matrix 通道和由 Convex 管理的 live Telegram 通道作为并行作业运行。`OpenClaw Release Checks` 会在发布审批前运行相同的通道。

- `pnpm openclaw qa suite`
  - 直接在宿主机上运行基于仓库的 QA 场景。
  - 默认使用隔离的 Gateway 网关工作进程并行运行多个选定场景。`qa-channel` 默认并发度为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整工作进程数量，或使用 `--concurrency 1` 切换为旧的串行通道。
  - 任何场景失败时以非零状态退出。如果你想保留产物但不希望以失败退出码结束，请使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个本地的 AIMock 支持的提供商服务器，用于实验性的 fixture 和协议 mock 覆盖，而不是替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 内运行同一套 QA 测试。
  - 保持与宿主机上的 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商/模型选择标志。
  - live 运行会转发对访客系统实际可行的受支持 QA 凭证输入：基于环境变量的提供商密钥、QA live provider 配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，这样访客系统才能通过挂载的工作区回写内容。
  - 将标准 QA 报告 + 摘要以及 Multipass 日志写入 `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动基于 Docker 的 QA 站点，用于偏操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建 npm tarball，在 Docker 中全局安装，运行非交互式 OpenAI API 密钥新手引导，默认配置 Telegram，验证启用该插件时会按需安装运行时依赖，运行 doctor，并针对一个被 mock 的 OpenAI 端点运行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可用 Discord 运行同一打包安装通道。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，使用已配置的 OpenAI 启动 Gateway 网关，然后通过编辑配置启用内置 channel/plugins。
  - 验证设置发现阶段不会安装未配置插件的运行时依赖，首次已配置的 Gateway 网关或 doctor 运行会按需安装每个内置插件的运行时依赖，而第二次重启不会重新安装已激活的依赖。
  - 还会安装一个已知的较旧 npm 基线，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本在更新后的 doctor 中会修复内置渠道运行时依赖，而无需测试框架侧的 postinstall 修复。
- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一个一次性的、基于 Docker 的 Tuwunel homeserver 运行 Matrix live QA 通道。
  - 这个 QA 宿主当前仅供仓库/开发环境使用。打包后的 OpenClaw 安装不附带 `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库检出会直接加载内置运行器；无需单独安装插件。
  - 配置三个临时 Matrix 用户（`driver`、`sut`、`observer`）以及一个私有房间，然后以真实 Matrix 插件作为 SUT 传输层启动一个 QA gateway 子进程。
  - 默认使用固定的稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。如果你需要测试其他镜像，可通过 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭证源标志，因为该通道会在本地配置一次性用户。
  - 将 Matrix QA 报告、摘要、observed-events 产物以及合并后的 stdout/stderr 输出日志写入 `.artifacts/qa-e2e/...`。
- `pnpm openclaw qa telegram`
  - 使用来自环境变量的 driver 和 SUT bot token，针对真实私有群组运行 Telegram live QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是 Telegram chat 的数字 id。
  - 支持 `--credential-source convex` 以使用共享池化凭证。默认使用 env 模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 任何场景失败时以非零状态退出。如果你想保留产物但不希望以失败退出码结束，请使用 `--allow-failures`。
  - 需要同一个私有群组中的两个不同 bot，且 SUT bot 需要暴露一个 Telegram 用户名。
  - 为了获得稳定的 bot 对 bot 观测，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保 driver bot 可以观测群组中的 bot 流量。
  - 将 Telegram QA 报告、摘要和 observed-messages 产物写入 `.artifacts/qa-e2e/...`。回复场景包含从 driver 发送请求到观测到 SUT 回复之间的 RTT。

live 传输通道共享一个标准契约，因此新传输方式不会发生漂移：

`qa-channel` 仍然是广义的合成 QA 测试套件，不属于 live 传输覆盖矩阵的一部分。

| 通道 | Canary | 提及门控 | Allowlist 屏蔽 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | 反应观测 | 帮助命令 |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的凭证池中获取一个独占租约，在该通道运行期间对租约持续发送心跳，并在关闭时释放租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 为所选角色配置一个密钥：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用于 `ci`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认为 `ci`，否则默认为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选跟踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常运行中应使用 `https://`。

维护者管理命令（池添加/移除/列出）必须专门使用
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

面向维护者的 CLI 辅助命令：

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
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /admin/add`（仅限 maintainer 密钥）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅限 maintainer 密钥）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅限 maintainer 密钥）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 类型的 payload 结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是 Telegram chat id 的数字字符串。
- `admin/add` 会对 `kind: "telegram"` 的此结构进行校验，并拒绝格式错误的 payload。

### 向 QA 添加一个渠道

向 Markdown QA 系统添加一个渠道，严格来说只需要两样东西：

1. 该渠道的传输适配器。
2. 一个用于验证渠道契约的场景包。

当共享的 `qa-lab` 宿主可以承担该流程时，不要新增顶层 QA 命令根。

`qa-lab` 负责共享宿主机制：

- `openclaw qa` 命令根
- 测试套件启动和拆除
- 工作进程并发
- 产物写入
- 报告生成
- 场景执行
- 对旧版 `qa-channel` 场景的兼容性别名

Runner 插件负责传输契约：

- `openclaw qa <runner>` 如何挂载在共享 `qa` 根下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何暴露转录记录和标准化后的传输状态
- 如何执行由传输支持的操作
- 如何处理传输特定的重置或清理

新渠道的最低接入门槛是：

1. 保持 `qa-lab` 作为共享 `qa` 根的所有者。
2. 在共享的 `qa-lab` 宿主接口上实现传输 runner。
3. 将传输特定机制保留在 runner 插件或渠道 harness 内部。
4. 将 runner 挂载为 `openclaw qa <runner>`，而不是注册一个相互竞争的根命令。Runner 插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；惰性 CLI 和 runner 执行应保留在独立入口点之后。
5. 在带主题的 `qa/scenarios/` 目录下编写或改造 Markdown 场景。
6. 对新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意迁移，否则应保持现有兼容性别名可用。

决策规则很严格：

- 如果某个行为可以在 `qa-lab` 中一次表达，就放到 `qa-lab` 中。
- 如果某个行为依赖于单一渠道传输，就把它保留在该 runner 插件或插件 harness 中。
- 如果某个场景需要多于一个渠道都可使用的新能力，就添加一个通用辅助函数，而不是在 `suite.ts` 中添加特定渠道分支。
- 如果某个行为只对一种传输有意义，就保持该场景是传输特定的，并在场景契约中明确说明。

新场景的首选通用辅助函数名称是：

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
兼容性别名的存在是为了避免一次性迁移，而不是作为新场景编写的范式。

## 测试套件（各自运行位置）

可以将这些套件理解为“真实度逐步增加”（同时不稳定性/成本也会增加）：

### Unit / integration（默认）

- 命令：`pnpm test`
- 配置：未定向运行使用 `vitest.full-*.config.ts` 分片集合，并可能将多项目分片扩展为按项目拆分的配置，以便并行调度
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 下的 core/unit 清单，以及由 `vitest.unit.config.ts` 覆盖的白名单 `ui` node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 针对已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
    <AccordionGroup>
    <Accordion title="项目、分片和范围通道"> - 未定向的 `pnpm test` 运行会使用十二个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生 root-project 进程。这样可以降低高负载机器上的 RSS 峰值，并避免 auto-reply/extension 工作饿死无关套件。 - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片监听循环并不现实。 - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会优先通过范围通道路由显式的文件/目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不必承担完整 root project 启动成本。 - 当 diff 仅触及可路由的源码/测试文件时，`pnpm test:changed` 会将变更后的 git 路径扩展为相同的范围通道；配置/设置编辑仍会回退为广泛的 root-project 重跑。 - `pnpm check:changed` 是窄范围工作时的常规智能本地门禁。它会将 diff 分类为 core、core tests、extensions、extension tests、apps、docs、release metadata 和 tooling，然后运行匹配的 typecheck/lint/test 通道。公开的 Plugin SDK 和 plugin-contract 变更会额外包含一次 extension 验证，因为 extensions 依赖这些 core 契约。仅包含发布元数据版本提升的改动会运行定向的版本/配置/根依赖检查，而不是完整套件，并带有一个保护措施，拒绝顶层 version 字段以外的 package 变更。 - 来自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 以及类似纯工具区域的轻导入 unit 测试会通过 `unit-fast` 通道运行，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件则保留在现有通道中。 - 一些选定的 `plugin-sdk` 和 `commands` helper 源文件也会在 changed 模式运行时映射到这些轻量通道中的显式同级测试，因此 helper 编辑可避免为该目录重跑完整的重型套件。 - `auto-reply` 有三个专用桶：顶层 core helpers、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树。这使最重的 reply harness 工作不会落到廉价的 status/chunk/token 测试上。
    </Accordion>

      <Accordion title="嵌入式 runner 覆盖">
        - 当你更改 message-tool 发现输入或压缩运行时上下文时，要同时保留两层覆盖。
        - 为纯路由和标准化边界添加聚焦的 helper 回归测试。
        - 保持嵌入式 runner 集成套件健康：
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
        - 这些套件验证带范围的 id 和压缩行为仍会流经真实的 `run.ts` / `compact.ts` 路径；仅有 helper 测试并不足以替代这些集成路径。
      </Accordion>

      <Accordion title="Vitest 池和隔离默认值">
        - 基础 Vitest 配置默认使用 `threads`。
        - 共享 Vitest 配置固定 `isolate: false`，并在 root projects、e2e 和 live 配置中使用非隔离 runner。
        - 根 UI 通道保留其 `jsdom` 设置和优化器，但也在共享的非隔离 runner 上运行。
        - 每个 `pnpm test` 分片都会从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
        - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与原生 V8 行为做对比。
      </Accordion>

      <Accordion title="快速本地迭代">
        - `pnpm changed:lanes` 会显示某个 diff 触发了哪些架构通道。
        - pre-commit hook 只负责格式化。它会重新暂存已格式化的文件，不会运行 lint、typecheck 或 tests。
        - 当你需要智能本地门禁时，在交接或推送前显式运行 `pnpm check:changed`。公开的 Plugin SDK 和 plugin-contract 变更会额外包含一次 extension 验证。
        - `pnpm test:changed` 会在变更路径可清晰映射到较小套件时通过范围通道进行路由。
        - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
        - 本地 worker 自动扩缩容刻意保持保守，并会在宿主平均负载已经很高时回退，因此默认情况下多个并发 Vitest 运行造成的影响更小。
        - 基础 Vitest 配置将项目/配置文件标记为 `forceRerunTriggers`，因此当测试接线发生变化时，changed 模式重跑仍保持正确。
        - 配置会在受支持宿主上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接性能分析指定一个明确的缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
      </Accordion>

      <Accordion title="性能调试">
        - `pnpm test:perf:imports` 会启用 Vitest 导入时长报告以及 import-breakdown 输出。
        - `pnpm test:perf:imports:changed` 会将相同的分析视图限定到自 `origin/main` 以来变更的文件。
        - 当某个热点测试仍将大部分时间耗在启动导入上时，应将重型依赖保留在狭窄的本地 `*.runtime.ts` 接口之后，并直接 mock 该接口，而不是为了传给 `vi.mock(...)` 而深度导入运行时辅助工具。
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将已路由的 `test:changed` 与该提交 diff 的原生 root-project 路径进行对比，并输出墙钟时间以及 macOS 最大 RSS。
        - `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和根 Vitest 配置将变更文件列表路由后，对当前脏工作树进行基准测试。
        - `pnpm test:perf:profile:main` 会为 Vitest/Vite 启动和转换开销写出主线程 CPU profile。
        - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为 unit 套件写出 runner CPU + heap profile。
      </Accordion>
    </AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制单 worker
- 范围：
  - 启动一个真实的 local loopback Gateway 网关，默认启用诊断
  - 通过诊断事件路径驱动合成的 Gateway 网关消息、记忆和大 payload 抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化辅助函数
  - 断言 recorder 保持有界、合成 RSS 采样保持在压力预算之下，并且每个会话的队列深度会回落到零
- 预期：
  - 对 CI 安全且不需要密钥
  - 这是用于稳定性回归跟进的窄范围通道，不可替代完整的 Gateway 网关测试套件

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads`，并设置 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 workers（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 接口、节点配对以及更重的网络交互
- 预期：
  - 在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比 unit 测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在宿主机上启动一个隔离的 OpenShell Gateway 网关
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远端规范文件系统行为
- 预期：
  - 仅在显式启用时运行；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，随后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1` 用于在手动运行更广泛的 e2e 套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用于指向非默认 CLI 二进制文件或包装脚本

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型**今天**是否真的能用真实凭证正常工作？”
  - 捕获提供商格式变更、工具调用怪癖、认证问题以及速率限制行为
- 预期：
  - 设计上不保证 CI 稳定（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 优先运行缩小范围后的子集，而不是“一切全跑”
- live 运行会读取 `~/.profile`，以获取缺失的 API 密钥。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置/认证材料复制到一个临时测试 home 中，这样 unit fixture 就不会修改你的真实 `~/.openclaw`。
- 仅当你有意让 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认采用更安静的模式：会保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静默 Gateway 网关启动日志/Bonjour 噪声。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（提供商特定）：设置 `*_API_KEYS`，使用逗号/分号格式，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可通过 `OPENCLAW_LIVE_*_KEY` 为单次 live 运行单独覆盖；测试会在速率限制响应时重试。
- 进度/心跳输出：
  - live 套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获较安静，较长的提供商调用也能显式显示为正在进行。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此提供商/Gateway 网关进度行会在 live 运行期间立即流出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整 direct-model 心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关/探测心跳。

## 我应该运行哪个测试套件？

使用这个决策表：

- 修改逻辑/测试：运行 `pnpm test`（如果改动很多，再加上 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：额外运行 `pnpm test:e2e`
- 调试“我的 bot 挂了”/ 提供商特定故障 / 工具调用：运行一个缩小范围的 `pnpm test:live`

## Live（触网）测试

对于 live 模型矩阵、CLI 后端冒烟测试、ACP 冒烟测试、Codex app-server harness，以及所有媒体提供商 live 测试（Deepgram、BytePlus（国际版）、ComfyUI、image、music、video、media harness）——再加上 live 运行的凭证处理——请参阅
[测试——live 套件](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- Live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行各自匹配的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），挂载你的本地配置目录和工作区（如果已挂载，则也会读取 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认使用更小的冒烟上限，以便完整的 Docker 扫描仍然可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确想要更大、更穷举的扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，然后在两个 live Docker 通道中复用它。它还会通过 `test:docker:e2e-build` 构建一个共享的 `scripts/e2e/Dockerfile` 镜像，并在运行已构建应用的 E2E 容器冒烟运行器中复用它。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层的集成路径。

live 模型 Docker 运行器还会只 bind-mount 所需的 CLI 认证 home（若运行未缩小范围，则挂载所有受支持的 home），然后在运行前将它们复制到容器 home 中，以便外部 CLI OAuth 可以刷新 token，而不会修改宿主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP bind 冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live 冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导/渠道/智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包后的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，默认还会配置 Telegram，验证启用该插件时会按需安装其运行时依赖，运行 doctor，并运行一次被 mock 的 OpenAI 智能体轮次。可通过 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过宿主重建，或通过 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前树，在隔离 home 中使用 `bun install -g` 安装它，并验证 `openclaw infer image providers --json` 返回的是内置 image 提供商，而不是卡住。可通过 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过宿主构建，或通过 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装冒烟测试 Docker：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器间共享一个 npm 缓存。更新冒烟测试默认使用 npm `latest` 作为升级到候选 tarball 前的稳定基线。非 root 安装器检查会保持隔离的 npm 缓存，以避免 root 拥有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重复运行间复用 root/update/direct-npm 缓存。
- 安装冒烟测试 CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；当需要直接 `npm install -g` 覆盖时，请在本地不带该环境变量运行此脚本。
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses `web_search` 最小推理回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个被 mock 的 OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制提供商 schema 拒绝，并检查原始细节是否出现在 Gateway 网关日志中。
- MCP 渠道桥接（已播种的 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi 内置 MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile allow/deny 冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + 在隔离 cron 和一次性 subagent 运行后拆除 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟测试 + `/plugin` 别名 + Claude bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
- 插件更新无变化冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在宿主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。可通过 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，通过 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 在完成本地新构建后跳过宿主重建，或通过 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。
- 迭代时可通过禁用无关场景来缩小内置插件运行时依赖测试范围，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

如需手动预构建并复用共享的 built-app 镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

当设置时，诸如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 之类的套件特定镜像覆盖仍然优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果它尚未存在于本地，脚本会拉取它。QR 和安装器 Docker 测试保留各自独立的 Dockerfile，因为它们验证的是打包/安装行为，而不是共享的 built-app 运行时。

live 模型 Docker 运行器还会将当前检出以只读方式 bind-mount，并在容器内临时 workdir 中完成预置。这样既能保持运行时镜像精简，又仍可针对你当前本地的精确源码/配置运行 Vitest。
预置步骤会跳过大型的本地专用缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地的 `.build` 或 Gradle 输出目录，这样 Docker live 运行就不会花数分钟去复制机器特定产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关 live 探测就不会在容器内启动真实的 Telegram/Discord 等渠道工作进程。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要缩小或排除该 Docker 通道中的 Gateway 网关 live 覆盖时，也要一并传入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，针对该 Gateway 网关启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一个真实聊天请求。
首次运行可能明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI 也可能需要完成自身的冷启动设置。
该通道需要一个可用的 live 模型密钥，而在 Docker 化运行中，`OPENCLAW_PROFILE_FILE`
（默认值为 `~/.profile`）是提供它的主要方式。
成功运行会打印一个小型 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 刻意设计为确定性测试，不需要真实的
Telegram、Discord 或 iMessage 账号。它会启动一个已播种的 Gateway
网关容器，启动第二个会生成 `openclaw mcp serve` 的容器，然后通过真实的
stdio MCP bridge 验证路由后的会话发现、转录读取、附件元数据、live 事件队列行为、出站发送路由，以及 Claude 风格的渠道 +
权限通知。通知检查会直接检查原始 stdio MCP 帧，因此该冒烟测试验证的是 bridge 实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露出来的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要 live
模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实的 stdio MCP 探测服务器，通过嵌入式 Pi 内置 MCP 运行时将该服务器实体化，执行该工具，然后验证 `coding` 和 `messaging` 会保留
`bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要 live 模型密钥。它会启动一个带有真实 stdio MCP 探测服务器的已播种 Gateway 网关，运行一次隔离的 cron 轮次和一次 `/subagents spawn`
一次性子智能体轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 为回归/调试工作流保留此脚本。后续可能还需要它来验证 ACP 线程路由，因此不要删除它。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前读取
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于仅验证从 `OPENCLAW_PROFILE_FILE` 读取的环境变量，使用临时 config/workspace 目录，且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内缓存的 CLI 安装
- `$HOME` 下的外部 CLI 认证目录/文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围的提供商运行仅会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内筛选提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于在无需重建时复用已有的 `openclaw:local-live` 镜像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而非 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关向 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

在编辑文档后运行文档检查：`pnpm check:docs`。
当你还需要检查页内标题时，运行完整的 Mintlify 锚点校验：`pnpm docs:check-links:anchors`。

## 离线回归测试（CI 安全）

这些是在不接入真实提供商时的“真实流水线”回归测试：

- Gateway 网关工具调用（mock OpenAI，真实 gateway + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，强制写入 config + auth）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些 CI 安全的测试，其行为类似“智能体可靠性评估”：

- 通过真实 gateway + 智能体循环进行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills（见 [Skills](/zh-CN/tools/skills)）仍缺少的内容：

- **决策**：当 Skills 列在提示词中时，智能体是否会选择正确的 Skills（或避免选择无关的 Skills）？
- **合规性**：智能体在使用前是否会读取 `SKILL.md`，并遵循所需步骤/参数？
- **工作流契约**：断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 一个使用 mock 提供商的场景运行器，用于断言工具调用 + 顺序、skill 文件读取和会话接线。
- 一小套以 skill 为中心的场景（使用与避免、门控、提示词注入）。
- 只有在 CI 安全套件就位后，才添加可选的 live 评估（显式启用、受环境变量门控）。

## 契约测试（plugin 和 channel 形状）

契约测试用于验证每个已注册的 plugin 和渠道都符合其接口契约。它们会遍历所有已发现的 plugin，并运行一组形状和行为断言。默认的 `pnpm test` unit 通道会有意跳过这些共享接口和冒烟文件；当你修改共享渠道或提供商表面时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本 plugin 形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息 payload 结构
- **inbound** - 入站消息处理
- **actions** - 渠道操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/名册 API
- **group-policy** - 群组策略执行

### 提供商状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - Plugin 注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选项/选择
- **catalog** - 模型目录 API
- **discovery** - Plugin 发现
- **loader** - Plugin 加载
- **runtime** - 提供商运行时
- **shape** - Plugin 形状/接口
- **wizard** - 设置向导

### 何时运行

- 修改 plugin-sdk 导出或子路径之后
- 添加或修改渠道或提供商插件之后
- 重构 plugin 注册或发现之后

契约测试会在 CI 中运行，不需要真实 API 密钥。

## 添加回归测试（指南）

当你修复了在 live 中发现的提供商/模型问题时：

- 如果可能，添加一个 CI 安全的回归测试（mock/stub 提供商，或捕获精确的请求形状转换）
- 如果该问题本质上只能在 live 中出现（速率限制、认证策略），则保持该 live 测试范围狭窄，并通过环境变量显式启用
- 优先针对能捕获该缺陷的最小层级：
  - 提供商请求转换/重放缺陷 → 直接模型测试
  - gateway 会话/历史/工具流水线缺陷 → gateway live 冒烟测试或 CI 安全的 gateway mock 测试
- SecretRef 遍历保护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言遍历段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增了一个 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会在遇到未分类的 target id 时故意失败，这样新类别就无法被静默跳过。
