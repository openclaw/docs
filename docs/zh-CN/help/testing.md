---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型 / 提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元 / e2e / live 测试套件、Docker 运行器，以及每类测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-24T01:50:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2598e4f03b2133dcbe6dac0a51f1d75e075e8961b00f6519003d41311936fd1d
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三个 Vitest 测试套件（单元 / 集成、e2e、live）以及一小组 Docker 运行器。本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么内容（以及它刻意**不**覆盖什么内容）。
- 常见工作流应运行哪些命令（本地、推送前、调试）。
- live 测试如何发现凭证并选择模型 / 提供商。
- 如何为真实世界中的模型 / 提供商问题添加回归测试。

## 快速开始

大多数情况下：

- 完整门禁（预期在推送前运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置宽裕的机器上进行更快的本地全套测试运行：`pnpm test:max`
- 直接进入 Vitest 监视循环：`pnpm test:watch`
- 现在直接指定文件路径也会路由扩展 / 渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你正在迭代单个失败用例时，优先先跑有针对性的测试。
- 基于 Docker 的 QA 站点：`pnpm qa:lab:up`
- 基于 Linux VM 的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试或想要更多信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实的提供商 / 模型时（需要真实凭证）：

- live 测试套件（模型 + Gateway 网关工具 / 图像探测）：`pnpm test:live`
- 安静地只跑一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 现在，每个选中的模型都会运行一次文本轮次加一次小型类文件读取探测。元数据声明支持 `image` 输入的模型还会运行一个微型图像轮次。隔离提供商故障时，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用额外探测。
  - CI 覆盖范围：每日的 `OpenClaw Scheduled Live And E2E Checks` 和手动触发的 `OpenClaw Release Checks` 都会调用可复用的 live/E2E 工作流，并设置 `include_live_suites: true`，其中包含按提供商分片的独立 Docker live 模型矩阵作业。
  - 如需有针对性的 CI 重跑，请派发 `OpenClaw Live And E2E Checks (Reusable)`，并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`，以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其 scheduled/release 调用方中。
- Moonshot/Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行隔离的 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。验证 JSON 报告的是 Moonshot/K2.6，并且助手转录存储了标准化后的 `usage.cost`。

提示：如果你只需要一个失败用例，优先使用下文介绍的 allowlist 环境变量来收窄 live 测试范围。

## QA 专用运行器

当你需要 QA-lab 的真实环境时，这些命令与主测试套件并列存在：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，也可通过手动派发以 mock 提供商运行。`QA-Lab - All Lanes` 会在 `main` 上每晚运行，也可通过手动派发运行，其中 mock parity gate、live Matrix 通道和 Convex 管理的 live Telegram 通道会作为并行作业执行。`OpenClaw Release Checks` 会在发布批准前运行同样的通道。

- `pnpm openclaw qa suite`
  - 直接在宿主机上运行基于仓库的 QA 场景。
  - 默认会使用隔离的 Gateway 网关 worker 并行运行多个选中的场景。`qa-channel` 默认并发数为 4（受选中场景数量限制）。使用 `--concurrency <count>` 调整 worker 数量，或者使用 `--concurrency 1` 切换为旧的串行通道。
  - 任一场景失败时，以非零状态退出。如果你想保留产物但不希望退出码失败，请使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 会启动一个本地的 AIMock 支持的提供商服务器，用于实验性的夹具和协议 mock 覆盖，而不会替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 Multipass Linux VM 内运行同样的 QA 套件。
  - 与宿主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商 / 模型选择标志。
  - live 运行会转发适合来宾环境的受支持 QA 认证输入：基于环境变量的提供商密钥、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，这样来宾才能通过挂载的工作区回写。
  - 会将常规 QA 报告 + 摘要以及 Multipass 日志写入 `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动基于 Docker 的 QA 站点，用于偏操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建 npm tarball，在 Docker 中全局安装，运行非交互式 OpenAI API 密钥新手引导，默认配置 Telegram，验证启用插件会按需安装运行时依赖，运行 doctor，并针对 mock 的 OpenAI 端点运行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在 Discord 上运行同样的打包安装通道。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，启动已配置 OpenAI 的 Gateway 网关，然后通过编辑配置启用内置渠道 / 插件。
  - 验证设置发现流程会让未配置插件的运行时依赖保持未安装状态，第一次配置后的 Gateway 网关或 doctor 运行会按需安装每个内置插件的运行时依赖，而第二次重启不会重新安装已经激活的依赖。
  - 还会安装一个已知的旧版 npm 基线，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本在更新后的 doctor 中会修复内置渠道运行时依赖，而无需测试框架侧的 postinstall 修复。
- `pnpm openclaw qa aimock`
  - 只启动本地 AIMock 提供商服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的、基于 Docker 的 Tuwunel homeserver 运行 Matrix live QA 通道。
  - 这个 QA 宿主目前仅用于仓库 / 开发环境。打包后的 OpenClaw 安装不包含 `qa-lab`，因此也不会暴露 `openclaw qa`。
  - 仓库检出会直接加载内置运行器；无需单独安装插件。
  - 预配三个临时 Matrix 用户（`driver`、`sut`、`observer`）以及一个私有房间，然后启动一个 QA gateway 子进程，使用真实 Matrix 插件作为 SUT 传输层。
  - 默认使用固定的稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。如需测试其他镜像，请使用 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭证来源标志，因为该通道会在本地预配一次性用户。
  - 会将 Matrix QA 报告、摘要、observed-events 产物，以及合并的 stdout/stderr 输出日志写入 `.artifacts/qa-e2e/...`。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 driver 和 SUT bot token，针对真实私有群组运行 Telegram live QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是 Telegram chat 的数字 id。
  - 支持 `--credential-source convex` 以使用共享池化凭证。默认使用 env 模式，或者设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 任一场景失败时，以非零状态退出。如果你想保留产物但不希望退出码失败，请使用 `--allow-failures`。
  - 需要同一个私有群组中的两个不同 bot，且 SUT bot 必须暴露 Telegram 用户名。
  - 为了稳定地观察 bot 之间的通信，请在 `@BotFather` 中为两个 bot 都启用 Bot-to-Bot Communication Mode，并确保 driver bot 能观察到群组中的 bot 流量。
  - 会将 Telegram QA 报告、摘要和 observed-messages 产物写入 `.artifacts/qa-e2e/...`。回复场景包含从 driver 发送请求到观察到 SUT 回复之间的 RTT。

live 传输通道共享一套标准契约，因此新传输不会发生漂移：

`qa-channel` 仍然是广泛的合成 QA 套件，不属于 live 传输覆盖矩阵的一部分。

| 通道 | Canary | 提及门禁 | allowlist 阻止 | 顶层回复 | 重启恢复 | 线程后续回复 | 线程隔离 | Reaction 观察 | help 命令 |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的池中获取一个独占租约，在通道运行期间为该租约发送心跳，并在关闭时释放该租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所选角色对应的一个密钥：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 对应 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 对应 `ci`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认是 `ci`，否则默认是 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选追踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

正常运行时，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理命令（池添加 / 移除 / 列表）必须明确使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

面向维护者的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在脚本和 CI 工具中使用 `--json` 获取机器可读输出。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 资源耗尽 / 可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
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
- `admin/add` 会对 `kind: "telegram"` 的此结构进行校验，并拒绝格式不正确的 payload。

### 向 QA 添加一个渠道

将一个渠道添加到 markdown QA 系统中，**只需要且必须**做两件事：

1. 为该渠道实现一个传输适配器。
2. 编写一个用于验证该渠道契约的场景包。

当共享的 `qa-lab` 宿主能够承载整个流程时，不要添加新的顶层 QA 命令根。

`qa-lab` 负责共享宿主机制：

- `openclaw qa` 命令根
- 套件启动与清理
- worker 并发
- 产物写入
- 报告生成
- 场景执行
- 对旧版 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- `openclaw qa <runner>` 如何挂载在共享的 `qa` 根之下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露转录和标准化后的传输状态
- 如何执行由传输支持的操作
- 如何处理传输特定的重置或清理

新渠道的最低接入门槛是：

1. 保持 `qa-lab` 作为共享 `qa` 根的所有者。
2. 在共享的 `qa-lab` 宿主接缝上实现传输运行器。
3. 将传输特定机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个相互竞争的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 轻量；惰性 CLI 和运行器执行应放在独立入口点之后。
5. 在按主题划分的 `qa/scenarios/` 目录下编写或改造 markdown 场景。
6. 为新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意迁移，否则保持现有兼容别名继续可用。

决策规则是严格的：

- 如果某个行为能在 `qa-lab` 中统一表达一次，就把它放进 `qa-lab`。
- 如果某个行为依赖某一个渠道传输，就把它保留在该运行器插件或插件 harness 中。
- 如果某个场景需要超过一个渠道都能使用的新能力，请添加通用辅助函数，而不是在 `suite.ts` 中添加渠道特定分支。
- 如果某个行为只对一种传输有意义，就让该场景保持传输特定，并在场景契约中明确说明。

新场景推荐使用的通用辅助函数名称是：

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

新的渠道开发应使用这些通用辅助函数名称。
兼容别名的存在是为了避免一次性迁移日，而不是作为新场景编写的范式。

## 测试套件（各自运行位置）

可以把这些套件理解为“真实度逐步增加”（同时不稳定性 / 成本也逐步增加）：

### Unit / integration（默认）

- 命令：`pnpm test`
- 配置：未指定目标的运行使用 `vitest.full-*.config.ts` 分片集合，并且可能会将多项目分片展开为按项目划分的配置，以进行并行调度
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 下的 core / 单元测试清单，以及 `vitest.unit.config.ts` 覆盖的白名单 `ui` node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 针对已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
    <AccordionGroup>
    <Accordion title="项目、分片与作用域通道"> - 未指定目标的 `pnpm test` 会运行 12 个较小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是运行一个巨大的原生根项目进程。这能降低高负载机器上的峰值 RSS，并避免 auto-reply / extension 工作拖累无关套件。 - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不现实。 - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会优先通过作用域通道来路由显式文件 / 目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不必承担完整根项目启动的代价。 - 当差异仅触及可路由的源文件 / 测试文件时，`pnpm test:changed` 会将变更的 git 路径展开到同样的作用域通道；配置 / setup 编辑仍会回退到更宽泛的根项目重跑。 - `pnpm check:changed` 是常规的智能本地门禁，适用于小范围工作。它会将 diff 分类为 core、core tests、extensions、extension tests、apps、docs、release metadata 和 tooling，然后运行匹配的类型检查 / lint / 测试通道。公共 Plugin SDK 和插件契约变更会额外包含一次 extension 验证，因为 extensions 依赖这些 core 契约。仅涉及发布元数据的版本提升会运行有针对性的版本 / 配置 / 根依赖检查，而不是全量套件，并带有一个守卫，拒绝顶层版本字段之外的 `package` 变更。 - 来自 agents、commands、plugins、auto-reply 辅助函数、`plugin-sdk` 及类似纯工具区域的轻导入单元测试会路由到 `unit-fast` 通道，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时较重的文件仍保留在现有通道中。 - 选定的 `plugin-sdk` 和 `commands` 辅助源文件也会在 changed 模式运行时映射到这些轻量通道中的显式同级测试，因此辅助函数编辑无需为该目录重跑完整重型套件。 - `auto-reply` 有三个专用分桶：顶层 core 辅助函数、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树。这使最重的 reply harness 工作不会落到廉价的状态 / chunk / token 测试上。
    </Accordion>

      <Accordion title="嵌入式运行器覆盖">
        - 当你修改消息工具发现输入或压缩运行时上下文时，要同时保留两个层级的覆盖。
        - 为纯路由和标准化边界添加聚焦的辅助函数回归测试。
        - 保持嵌入式运行器集成套件健康：
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
        - 这些套件会验证作用域 id 和压缩行为仍然经过真实的 `run.ts` / `compact.ts` 路径；仅有辅助函数测试并不足以替代这些集成路径。
      </Accordion>

      <Accordion title="Vitest 池与隔离默认值">
        - 基础 Vitest 配置默认使用 `threads`。
        - 共享的 Vitest 配置固定为 `isolate: false`，并在根项目、e2e 和 live 配置中使用非隔离运行器。
        - 根 UI 通道保留其 `jsdom` setup 和 optimizer，但同样运行在共享的非隔离运行器上。
        - 每个 `pnpm test` 分片都从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
        - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与 stock V8 行为进行对比。
      </Accordion>

      <Accordion title="快速本地迭代">
        - `pnpm changed:lanes` 会显示某个 diff 触发了哪些架构通道。
        - pre-commit hook 只负责格式化。它会重新暂存已格式化文件，但不会运行 lint、类型检查或测试。
        - 当你需要智能本地门禁时，在交接或推送前显式运行 `pnpm check:changed`。公共 Plugin SDK 和插件契约变更会包含一次 extension 验证。
        - 当变更路径能明确映射到较小套件时，`pnpm test:changed` 会通过作用域通道进行路由。
        - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
        - 本地 worker 自动伸缩有意采取保守策略；当宿主负载平均值已经较高时会自动退让，因此默认情况下，多个并发 Vitest 运行造成的影响会更小。
        - 基础 Vitest 配置将项目 / 配置文件标记为 `forceRerunTriggers`，以便在测试接线发生变化时，changed 模式重跑仍然正确。
        - 配置会在受支持的宿主上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你希望为直接性能分析指定一个显式缓存位置，请设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
      </Accordion>

      <Accordion title="性能调试">
        - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告，以及导入拆解输出。
        - `pnpm test:perf:imports:changed` 会将同样的分析视图收窄到自 `origin/main` 以来变更的文件。
        - 当某个热点测试仍然将大部分时间花在启动导入上时，应将重型依赖放在狭窄的本地 `*.runtime.ts` 接缝之后，并直接 mock 该接缝，而不是为了传给 `vi.mock(...)` 而深度导入运行时辅助函数。
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将路由后的 `test:changed` 与该已提交 diff 的原生根项目路径进行对比，并打印 wall time 以及 macOS 最大 RSS。
        - `pnpm test:perf:changed:bench -- --worktree` 会通过将变更文件列表路由到 `scripts/test-projects.mjs` 和根 Vitest 配置，对当前脏工作树进行基准测试。
        - `pnpm test:perf:profile:main` 会为 Vitest/Vite 的启动和 transform 开销写出主线程 CPU profile。
        - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为单元测试套件写出 runner CPU + heap profile。
      </Accordion>
    </AccordionGroup>

### Stability（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制使用一个 worker
- 范围：
  - 启动一个真实的 loopback Gateway 网关，并默认启用 diagnostics
  - 通过诊断事件路径驱动合成的 gateway 消息、memory 和大 payload 抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化辅助函数
  - 断言记录器保持有界、合成 RSS 样本保持在压力预算之下，并且每个会话的队列深度最终回落为零
- 预期：
  - 对 CI 安全且无需密钥
  - 这是用于稳定性回归跟进的窄通道，而不是完整 Gateway 网关套件的替代品

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用带 `isolate: false` 的 Vitest `threads`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 接口、节点配对，以及更重的网络行为
- 预期：
  - 在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比单元测试涉及更多可变因素（可能更慢）

### E2E：OpenShell 后端冒烟测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在宿主机上启动一个隔离的 OpenShell Gateway 网关
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远程规范文件系统行为
- 预期：
  - 仅按需启用；不属于默认的 `pnpm test:e2e` 运行范围
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：在手动运行更广泛的 e2e 套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非默认 CLI 二进制或包装脚本

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认：由 `pnpm test:live` **启用**（会设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型在 _今天_ 使用真实凭证时，是否真的可用？”
  - 捕获提供商格式变化、工具调用怪癖、认证问题和速率限制行为
- 预期：
  - 按设计不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 优先运行收窄后的子集，而不是“全部”
- live 运行会读取 `~/.profile`，以补充缺失的 API 密钥。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置 / 认证材料复制到临时测试 home 中，以避免单元测试夹具修改你真实的 `~/.openclaw`。
- 仅当你明确需要 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：它会保留 `[live] ...` 进度输出，但隐藏额外的 `~/.profile` 提示，并静默 Gateway 网关引导日志 / Bonjour 噪声。如需恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（提供商特定）：设置逗号 / 分号格式的 `*_API_KEYS`，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可通过 `OPENCLAW_LIVE_*_KEY` 进行每次 live 运行覆盖；测试在收到速率限制响应时会重试。
- 进度 / 心跳输出：
  - live 套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获处于安静模式，长时间的提供商调用也能显示为正在活动。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，这样提供商 / Gateway 网关的进度行能在 live 运行期间立即流出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整 direct-model 心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / probe 心跳。

## 我应该运行哪个套件？

使用下表决策：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果你改动很多，再加上 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：额外运行 `pnpm test:e2e`
- 调试“我的 bot 挂了” / 提供商特定故障 / 工具调用：运行收窄后的 `pnpm test:live`

## Live：Android 节点能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android 节点当前声明的**每一个命令**，并断言命令契约行为。
- 范围：
  - 依赖预先手动设置（该套件不会安装 / 运行 / 配对应用）。
  - 针对所选 Android 节点逐命令验证 gateway `node.invoke`。
- 必需的预先设置：
  - Android 应用已连接并已与 gateway 配对。
  - 应用保持在前台。
  - 已授予你期望通过的能力所需的权限 / 捕获同意。
- 可选目标覆盖项：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android App](/zh-CN/platforms/android)

## Live：模型冒烟测试（profile keys）

live 测试分为两层，以便我们隔离故障：

- “Direct model” 告诉我们：使用给定密钥时，该提供商 / 模型是否至少能响应。
- “Gateway smoke” 告诉我们：该模型的完整 gateway + 智能体流水线是否正常工作（会话、历史、工具、沙箱策略等）。

### 第 1 层：Direct model completion（无 gateway）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举发现到的模型
  - 使用 `getApiKeyForModel` 选择你拥有凭证的模型
  - 为每个模型运行一个小型 completion（并在需要时运行有针对性的回归测试）
- 启用方式：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，即 modern 的别名）才会实际运行此套件；否则它会跳过，以便让 `pnpm test:live` 聚焦于 gateway 冒烟测试
- 如何选择模型：
  - `OPENCLAW_LIVE_MODELS=modern` 运行 modern allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是 modern allowlist 的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."`（逗号分隔的 allowlist）
  - modern/all 扫描默认有一个经过策划的高信号上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 可进行穷尽式 modern 扫描，或设置为正数以缩小上限。
- 如何选择提供商：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔的 allowlist）
- 密钥来源：
  - 默认：profile 存储和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制**仅**使用 profile 存储
- 为什么需要它：
  - 将“提供商 API 坏了 / 密钥无效”与“gateway 智能体流水线坏了”区分开来
  - 容纳小型、隔离的回归测试（例如：OpenAI Responses/Codex Responses 推理重放 + 工具调用流程）

### 第 2 层：Gateway 网关 + dev 智能体冒烟测试（即 “@openclaw” 实际在做的事）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 gateway
  - 创建 / 修补一个 `agent:dev:*` 会话（每次运行按模型覆盖）
  - 遍历有密钥的模型并断言：
    - “有意义的”响应（无工具）
    - 真实工具调用可用（读取探测）
    - 可选的额外工具探测（exec+read 探测）
    - OpenAI 回归路径（仅工具调用 → 后续跟进）持续可用
- 探测详情（这样你可以快速解释故障）：
  - `read` 探测：测试会在工作区写入一个 nonce 文件，并要求智能体 `read` 它并回显 nonce。
  - `exec+read` 探测：测试要求智能体通过 `exec` 将 nonce 写入一个临时文件，然后再 `read` 回来。
  - 图像探测：测试会附加一个生成的 PNG（猫 + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 如何选择模型：
  - 默认：modern allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 modern allowlist 的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）以收窄范围
  - modern/all gateway 扫描默认有一个经过策划的高信号上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可进行穷尽式 modern 扫描，或设置为正数以缩小上限。
- 如何选择提供商（避免“OpenRouter 全家桶”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔的 allowlist）
- 工具 + 图像探测在此 live 测试中始终启用：
  - `read` 探测 + `exec+read` 探测（工具压力测试）
  - 当模型声明支持图像输入时，会运行图像探测
  - 流程（高层级）：
    - 测试生成一个包含 “CAT” + 随机代码的微型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析到 `images[]` 中（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式智能体将多模态用户消息转发给模型
    - 断言：回复中包含 `cat` + 该代码（OCR 容错：允许轻微错误）

提示：要查看你的机器上能测试什么（以及精确的 `provider/model` id），请运行：

```bash
openclaw models list
openclaw models list --json
```

## Live：CLI 后端冒烟测试（Claude、Codex、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway 网关 + 智能体流水线，而不触碰你的默认配置。
- 后端特定的冒烟测试默认值位于所属扩展的 `cli-backend.ts` 定义中。
- 启用：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认提供商 / 模型：`claude-cli/claude-sonnet-4-6`
  - 命令 / 参数 / 图像行为来自所属 CLI 后端插件元数据。
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 用于发送真实图像附件（路径会注入到提示词中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 用于通过 CLI 参数传递图像文件路径，而不是通过提示词注入。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）用于控制在设置了 `IMAGE_ARG` 时图像参数的传递方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 用于发送第二轮并验证恢复流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` 用于禁用默认的 Claude Sonnet -> Opus 同会话连续性探测（当所选模型支持切换目标时，设为 `1` 可强制启用）。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
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

注意事项：

- Docker 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它会以非 root 的 `node` 用户身份，在仓库 Docker 镜像内运行 live CLI 后端冒烟测试。
- 它会从所属扩展解析 CLI 冒烟测试元数据，然后将匹配的 Linux CLI 包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 指定的可写缓存前缀中（默认：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可移植的 Claude Code 订阅 OAuth，可通过带有 `claudeAiOauth.subscriptionType` 的 `~/.claude/.credentials.json` 或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN` 提供。它会先在 Docker 中验证直接执行 `claude -p`，然后在不保留 Anthropic API 密钥环境变量的情况下运行两次 Gateway 网关 CLI 后端轮次。由于 Claude 目前会将第三方应用使用量路由到额外用量计费，而不是普通订阅计划额度，因此这个订阅通道默认会禁用 Claude MCP / 工具和图像探测。
- live CLI 后端冒烟测试现在对 Claude、Codex 和 Gemini 执行相同的端到端流程：文本轮次、图像分类轮次，然后是通过 gateway CLI 验证的 MCP `cron` 工具调用。
- Claude 的默认冒烟测试还会将会话从 Sonnet 修补到 Opus，并验证恢复后的会话仍记得之前的一条备注。

## Live：ACP 绑定冒烟测试（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用 live ACP 智能体验证真实 ACP 会话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 就地绑定一个合成的消息渠道会话
  - 在同一个会话上发送一次普通的后续消息
  - 验证后续消息确实落入已绑定的 ACP 会话转录中
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - Docker 中的 ACP 智能体：`claude,codex,gemini`
  - 直接使用 `pnpm test:live ...` 时的 ACP 智能体：`claude`
  - 合成渠道：类似 Slack 私信 的会话上下文
  - ACP 后端：`acpx`
- 覆盖项：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.4`
- 注意事项：
  - 该通道使用 gateway `chat.send` 接口，并带有仅管理员可用的合成 originating-route 字段，以便测试能够附加消息渠道上下文，而无需伪装成外部投递。
  - 当未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会对所选 ACP harness 智能体使用内置 `acpx` 插件自带的智能体注册表。

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
- 默认情况下，它会按顺序对所有受支持的 live CLI 智能体运行 ACP 绑定冒烟测试：`claude`、`codex`，然后 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 可收窄矩阵。
- 它会读取 `~/.profile`，将匹配的 CLI 认证材料放入容器，在可写 npm 前缀中安装 `acpx`，然后在缺失时安装请求的 live CLI（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）。
- 在 Docker 内，运行器会设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，以便 `acpx` 能让来自已读取 profile 的提供商环境变量对子 harness CLI 子进程保持可见。

## Live：Codex app-server harness 冒烟测试

- 目标：通过常规 gateway
  `agent` 方法验证由插件拥有的 Codex harness：
  - 加载内置的 `codex` 插件
  - 选择 `OPENCLAW_AGENT_RUNTIME=codex`
  - 在强制使用 Codex harness 的情况下，向 `openai/gpt-5.4` 发送第一个 gateway 智能体轮次
  - 向同一个 OpenClaw 会话发送第二个轮次，并验证 app-server 线程可以恢复
  - 通过同一路径运行 `/codex status` 和 `/codex models`
    gateway 命令路径
  - 可选地运行两个经 Guardian 审核的升级 shell 探测：一个应被批准的无害
    命令，以及一个应被拒绝的伪造密钥上传命令，从而让智能体回问
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认模型：`openai/gpt-5.4`
- 可选图像探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP / 工具探测：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可选 Guardian 探测：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 该冒烟测试会设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，这样损坏的 Codex
  harness 就无法通过静默回退到 PI 来蒙混过关。
- 认证：Codex app-server 认证来自本地 Codex 订阅登录。Docker
  冒烟测试在适用时也可以提供 `OPENAI_API_KEY` 用于非 Codex 探测，
  以及可选复制的 `~/.codex/auth.json` 和 `~/.codex/config.toml`。

本地配方：

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 配方：

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-codex-harness-docker.sh`。
- 它会读取挂载的 `~/.profile`，传递 `OPENAI_API_KEY`，在存在时复制 Codex CLI
  认证文件，将 `@openai/codex` 安装到可写的挂载 npm
  前缀中，准备源码树，然后仅运行 Codex harness live 测试。
- Docker 默认启用图像、MCP / 工具和 Guardian 探测。需要更窄的调试
  运行时，可设置 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 还会导出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，与 live
  测试配置保持一致，因此旧版别名或回退到 PI 都无法掩盖 Codex harness
  回归。

### 推荐的 live 配方

范围窄且明确的 allowlist 最快，也最不容易出问题：

- 单模型，direct（无 gateway）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，Gateway 网关冒烟测试：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 聚焦（Gemini API 密钥 + Antigravity）：
  - Gemini（API 密钥）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注意事项：

- `google/...` 使用 Gemini API（API 密钥）。
- `google-antigravity/...` 使用 Antigravity OAuth bridge（类似 Cloud Code Assist 的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（单独的认证 + 工具行为差异）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API 密钥 / profile 认证）；这也是大多数用户所说的 “Gemini”。
  - CLI：OpenClaw 调用本地 `gemini` 二进制；它有自己的认证方式，行为也可能不同（流式传输 / 工具支持 / 版本偏差）。

## Live：模型矩阵（我们覆盖什么）

没有固定的“CI 模型列表”（live 是按需启用的），但以下是在有密钥的开发机上建议定期覆盖的模型。

### 现代冒烟测试集（工具调用 + 图像）

这是我们期望持续可用的“常见模型”运行集：

- OpenAI（非 Codex）：`openai/gpt-5.4`（可选：`openai/gpt-5.4-mini`）
- OpenAI Codex OAuth：`openai-codex/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免使用较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

运行带工具 + 图像的 Gateway 网关冒烟测试：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个提供商家族至少选一个：

- OpenAI：`openai/gpt-5.4`（或 `openai/gpt-5.4-mini`）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

可选附加覆盖（有更好，没有也行）：

- xAI：`xai/grok-4`（或最新可用版本）
- Mistral：`mistral/`…（选一个你已启用的支持工具的模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### Vision：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型（Claude / Gemini / OpenAI 的支持视觉的变体等），以覆盖图像探测。

### 聚合器 / 替代 Gateway 网关

如果你启用了相应密钥，我们还支持通过以下方式进行测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图像的候选）
- OpenCode：`opencode/...` 用于 Zen，`opencode-go/...` 用于 Go（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 认证）

如果你有凭证 / 配置，也可以将更多提供商纳入 live 矩阵：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云端 / API），以及任意 OpenAI / Anthropic 兼容代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档中硬编码“所有模型”。权威列表始终是你机器上 `discoverModels(...)` 返回的结果 + 当前可用的密钥。

## 凭证（绝不要提交）

live 测试发现凭证的方式与 CLI 完全相同。实际含义是：

- 如果 CLI 可用，live 测试也应该能发现相同的密钥。
- 如果 live 测试提示“没有凭证”，就用你调试 `openclaw models list` / 模型选择的同样方式来调试。

- 每个智能体的认证 profile：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是 live 测试中“profile keys”的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（存在时会被复制到已准备好的 live home 中，但它不是主 profile-key 存储）
- 本地 live 运行默认会将当前活动配置、每个智能体的 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 认证目录复制到临时测试 home；已准备好的 live home 会跳过 `workspace/` 和 `sandboxes/`，并移除 `agents.*.workspace` / `agentDir` 路径覆盖，以确保探测不会落到你真实宿主的工作区中。

如果你想依赖环境变量密钥（例如在你的 `~/.profile` 中导出的密钥），请在运行本地测试前执行 `source ~/.profile`，或者使用下方的 Docker 运行器（它们可以将 `~/.profile` 挂载到容器中）。

## Deepgram live（音频转录）

- 测试：`extensions/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus（国际版）编码计划 live

- 测试：`extensions/byteplus/live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流媒体 live

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 覆盖内置 comfy 图像、视频和 `music_generate` 路径
  - 除非已配置 `models.providers.comfy.<capability>`，否则会跳过各项能力
  - 在修改 comfy 工作流提交、轮询、下载或插件注册后很有用

## 图像生成 live

- 测试：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness：`pnpm test:live:media image`
- 范围：
  - 枚举每一个已注册的图像生成提供商插件
  - 在探测前从你的登录 shell（`~/.profile`）中加载缺失的提供商环境变量
  - 默认优先使用 live / 环境变量 API 密钥，而不是已存储的认证 profile，因此 `auth-profiles.json` 中过期的测试密钥不会掩盖真实 shell 凭证
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
  - `openrouter`
  - `vydra`
  - `xai`
- 可选收窄：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制使用 profile 存储认证，并忽略仅环境变量的覆盖

## 音乐生成 live

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media music`
- 范围：
  - 覆盖共享的内置音乐生成提供商路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前从你的登录 shell（`~/.profile`）中加载提供商环境变量
  - 默认优先使用 live / 环境变量 API 密钥，而不是已存储的认证 profile，因此 `auth-profiles.json` 中过期的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 在可用时运行两种已声明的运行时模式：
    - 使用仅提示词输入的 `generate`
    - 当提供商声明 `capabilities.edit.enabled` 时运行 `edit`
  - 当前共享通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：单独的 Comfy live 文件，不在本共享扫描中
- 可选收窄：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制使用 profile 存储认证，并忽略仅环境变量的覆盖

## 视频生成 live

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media video`
- 范围：
  - 覆盖共享的内置视频生成提供商路径
  - 默认使用对发布安全的冒烟测试路径：非 FAL 提供商、每个提供商一个文生视频请求、一秒钟的龙虾提示词，以及来自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每提供商操作上限（默认 `180000`）
  - 默认跳过 FAL，因为提供商侧队列延迟可能主导发布时间；传入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可显式运行它
  - 在探测前从你的登录 shell（`~/.profile`）中加载提供商环境变量
  - 默认优先使用 live / 环境变量 API 密钥，而不是已存储的认证 profile，因此 `auth-profiles.json` 中过期的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 默认只运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 可在可用时也运行已声明的转换模式：
    - 当提供商声明 `capabilities.imageToVideo.enabled`，且所选提供商 / 模型在共享扫描中接受基于 buffer 的本地图像输入时，运行 `imageToVideo`
    - 当提供商声明 `capabilities.videoToVideo.enabled`，且所选提供商 / 模型在共享扫描中接受基于 buffer 的本地视频输入时，运行 `videoToVideo`
  - 当前在共享扫描中已声明但被跳过的 `imageToVideo` 提供商：
    - `vydra`，因为内置的 `veo3` 仅支持文本，而内置的 `kling` 需要远程图像 URL
  - 提供商特定的 Vydra 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件会运行 `veo3` 文生视频，以及一个默认使用远程图像 URL 夹具的 `kling` 通道
  - 当前 `videoToVideo` live 覆盖：
    - 仅 `runway`，且所选模型为 `runway/gen4_aleph` 时
  - 当前在共享扫描中已声明但被跳过的 `videoToVideo` 提供商：
    - `alibaba`、`qwen`、`xai`，因为这些路径当前需要远程 `http(s)` / MP4 参考 URL
    - `google`，因为当前共享的 Gemini/Veo 通道使用基于本地 buffer 的输入，而该路径在共享扫描中不被接受
    - `openai`，因为当前共享通道无法保证组织特定的视频 inpaint/remix 访问权限
- 可选收窄：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 以在默认扫描中包含所有提供商，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 以在激进的冒烟测试运行中降低每个提供商的操作上限
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制使用 profile 存储认证，并忽略仅环境变量的覆盖

## 媒体 live harness

- 命令：`pnpm test:live:media`
- 目的：
  - 通过一个仓库原生入口运行共享的图像、音乐和视频 live 套件
  - 自动从 `~/.profile` 加载缺失的提供商环境变量
  - 默认自动将每个套件收窄到当前拥有可用认证的提供商
  - 复用 `scripts/test-live.mjs`，因此心跳和安静模式行为保持一致
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行各自匹配的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），同时挂载你的本地配置目录和工作区（如果已挂载，也会读取 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认使用更小的冒烟测试上限，以保证完整 Docker 扫描仍然可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你
  明确想要更大、更穷尽的扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，然后在两个 live Docker 通道中复用它。它还会通过 `test:docker:e2e-build` 构建一个共享的 `scripts/e2e/Dockerfile` 镜像，并在执行已构建应用的 E2E 容器冒烟测试运行器中复用它。
- 容器冒烟测试运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

live 模型 Docker 运行器还只会绑定挂载所需的 CLI 认证 home（如果运行未收窄，则挂载所有受支持的 home），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就能刷新 token，同时不会修改宿主的认证存储：

- Direct model：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live 冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导 / 渠道 / 智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装已打包的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证启用插件会按需安装其运行时依赖，运行 doctor，并执行一次 mock 的 OpenAI 智能体轮次。可通过 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过宿主重建，或通过 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前工作树，在隔离 home 中通过 `bun install -g` 安装它，并验证 `openclaw infer image providers --json` 返回的是内置图像提供商而不是卡住。可通过 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过宿主构建，或通过 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装冒烟测试 Docker：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认使用 npm `latest` 作为稳定基线，然后再升级到候选 tarball。非 root 安装器检查会保持独立的 npm 缓存，以避免 root 拥有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑之间复用 root / update / direct-npm 缓存。
- Install Smoke CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；如果你需要覆盖直接 `npm install -g`，请在本地运行该脚本时不要设置此环境变量。
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses `web_search` 最小推理回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个 mock 的 OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制提供商 schema 拒绝，并检查原始细节是否出现在 Gateway 网关日志中。
- MCP 渠道桥接（已预置 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi 内置 MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile allow/deny 冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron / subagent MCP 清理（真实 Gateway 网关 + 隔离 cron 和一次性 subagent 运行后销毁 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟测试 + `/plugin` 别名 + Claude bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
- 插件更新无变更冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在宿主上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。可通过 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，在刚完成一次本地构建后通过 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过宿主重建，或通过 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。
- 在迭代时，可通过禁用无关场景来收窄内置插件运行时依赖测试，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

要手动预构建并复用共享的 built-app 镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置后，像 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 这样的套件专用镜像覆盖仍然优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果本地尚未存在，脚本会先拉取它。QR 和安装器 Docker 测试会保留各自独立的 Dockerfile，因为它们验证的是打包 / 安装行为，而不是共享的 built-app 运行时。

live 模型 Docker 运行器还会将当前检出以只读方式绑定挂载，并将其准备到容器内的临时工作目录中。这样既能保持运行时镜像精简，又能让 Vitest 基于你本地精确的源码 / 配置运行。准备步骤会跳过大型本地专用缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或 Gradle 输出目录，因此 Docker live 运行不会花上几分钟复制机器特定产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关 live 探测就不会在容器内启动真实的 Telegram / Discord / 等渠道 worker。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要从该 Docker 通道中收窄或排除 gateway live 覆盖时，也请一并传入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw gateway 容器，针对该 gateway 启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 完成登录，验证 `/api/models` 暴露 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一次真实聊天请求。
第一次运行可能会明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI 也可能需要完成自己的冷启动设置。
此通道需要一个可用的 live 模型密钥，而 `OPENCLAW_PROFILE_FILE`
（默认是 `~/.profile`）是在 Docker 化运行中提供它的主要方式。
成功运行会打印一小段 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意设计为确定性的，不需要真实的 Telegram、Discord 或 iMessage 账号。它会启动一个已预置的 Gateway 网关容器，启动第二个容器以运行 `openclaw mcp serve`，然后验证经路由的会话发现、转录读取、附件元数据、live 事件队列行为、出站发送路由，以及通过真实 stdio MCP bridge 发送的 Claude 风格渠道 + 权限通知。通知检查会直接检查原始 stdio MCP 帧，因此该冒烟测试验证的是 bridge 实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露出的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要 live 模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实 stdio MCP 探测服务器，通过嵌入式 Pi 内置 MCP 运行时将该服务器实体化，执行该工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要 live 模型密钥。它会启动一个带有真实 stdio MCP 探测服务器的已预置 Gateway 网关，运行一个隔离的 cron 轮次和一个 `/subagents spawn` 一次性子智能体轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（不在 CI 中）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留该脚本用于回归 / 调试工作流。它未来可能还会再次用于 ACP 线程路由验证，因此不要删除。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前读取
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于验证仅来自 `OPENCLAW_PROFILE_FILE` 的环境变量，此时使用临时配置 / 工作区目录，且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于缓存 Docker 内部安装的 CLI
- `$HOME` 下的外部 CLI 认证目录 / 文件会以只读方式挂载到 `/host-auth...`，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 收窄后的提供商运行只会挂载根据 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗号列表（如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`）手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于收窄运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用现有 `openclaw:local-live` 镜像，以便在无需重建时重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 gateway 为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试中使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

修改文档后运行文档检查：`pnpm check:docs`。
当你还需要完整的 Mintlify 锚点校验（包括页内标题检查）时，运行：`pnpm docs:check-links:anchors`。

## 离线回归测试（CI 安全）

这些是在没有真实提供商的情况下进行的“真实流水线”回归测试：

- Gateway 网关工具调用（mock OpenAI，真实 gateway + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start` / `wizard.next`，强制写入配置 + 认证）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些 CI 安全的测试，其行为类似“智能体可靠性评估”：

- 通过真实 gateway + 智能体循环进行的 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

针对 Skills 仍缺少的内容（参见 [Skills](/zh-CN/tools/skills)）：

- **决策**：当 Skills 在提示词中列出时，智能体是否会选择正确的 skill（或避免选择无关 skill）？
- **合规**：智能体在使用前是否会读取 `SKILL.md`，并遵循要求的步骤 / 参数？
- **工作流契约**：断言工具顺序、会话历史继承和沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 一个使用 mock 提供商的场景运行器，用于断言工具调用 + 顺序、skill 文件读取和会话接线。
- 一小组聚焦 Skills 的场景（使用与避免、门禁、提示词注入）。
- 只有在 CI 安全套件就位后，才添加可选的 live 评估（按需启用、受环境变量门禁控制）。

## 契约测试（插件和渠道形状）

契约测试用于验证每个已注册的插件和渠道都符合其接口契约。它们会遍历所有已发现的插件，并运行一组关于形状和行为的断言。默认的 `pnpm test` 单元测试通道会刻意跳过这些共享接缝和冒烟测试文件；当你修改共享的渠道或提供商接口时，请显式运行契约测试命令。

### 命令

- 所有契约测试：`pnpm test:contracts`
- 仅渠道契约测试：`pnpm test:contracts:channels`
- 仅提供商契约测试：`pnpm test:contracts:plugins`

### 渠道契约测试

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、名称、能力）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息 payload 结构
- **inbound** - 入站消息处理
- **actions** - 渠道操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略强制执行

### 提供商状态契约测试

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件注册表形状

### 提供商契约测试

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状 / 接口
- **wizard** - 设置向导

### 何时运行

- 修改 plugin-sdk 导出或子路径之后
- 添加或修改渠道或提供商插件之后
- 重构插件注册或发现逻辑之后

契约测试会在 CI 中运行，并且不需要真实 API 密钥。

## 添加回归测试（指导）

当你修复在 live 中发现的提供商 / 模型问题时：

- 如果可能，添加一个对 CI 安全的回归测试（mock / stub 提供商，或捕获精确的请求形状转换）
- 如果它本质上只能通过 live 测试覆盖（速率限制、认证策略），请让 live 测试保持范围窄，并通过环境变量按需启用
- 优先定位到能捕获该缺陷的最小层级：
  - 提供商请求转换 / 重放缺陷 → direct models 测试
  - gateway 会话 / 历史 / 工具流水线缺陷 → Gateway 网关 live 冒烟测试或对 CI 安全的 gateway mock 测试
- SecretRef 遍历防护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言会拒绝 traversal-segment exec id。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加了新的 `includeInPlan` SecretRef 目标家族，请更新该测试中的 `classifyTargetClass`。该测试会在遇到未分类目标 id 时有意失败，这样新类别就无法被静默跳过。
