---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型 / 提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元 / e2e / live 测试套件、Docker 运行器，以及每项测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-25T11:37:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: b525ad9cc015d8bb5d4ed8894394ee00a42ac7de0ed8695b3da342094d141309
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三个 Vitest 测试套件（unit/integration、e2e、live）以及一小组 Docker 运行器。本文档是一份“我们的测试方式”指南：

- 每个测试套件覆盖什么（以及它刻意**不**覆盖什么）。
- 常见工作流应运行哪些命令（本地、推送前、调试）。
- live 测试如何发现凭证并选择模型 / 提供商。
- 如何为真实世界中的模型 / 提供商问题添加回归测试。

## 快速开始

大多数情况下：

- 完整门禁（预期在 push 前运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置充足的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接的 Vitest 监听循环：`pnpm test:watch`
- 直接按文件定位现在也会路由 extension / channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代处理单个失败用例时，优先使用有针对性的运行。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA lane：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改测试或想要更高的把握时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- live 测试套件（模型 + Gateway 网关工具 / 图像探针）：`pnpm test:live`
- 安静地只运行一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 现在每个选中的模型都会运行一次文本轮次以及一个小型类文件读取探针。元数据声明支持 `image` 输入的模型还会运行一个微型图像轮次。在隔离提供商故障时，可通过 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用这些额外探针。
  - CI 覆盖：每日的 `OpenClaw Scheduled Live And E2E Checks` 和手动的 `OpenClaw Release Checks` 都会调用可复用的 live/E2E 工作流，并设置 `include_live_suites: true`，其中包括按提供商分片的独立 Docker live 模型矩阵作业。
  - 如需在 CI 中聚焦重跑，请调度 `OpenClaw Live And E2E Checks (Reusable)`，并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`、`.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 以及其 scheduled/release 调用方中。
- 原生 Codex 绑定聊天 smoke 测试：`pnpm test:docker:live-codex-bind`
  - 针对 Codex app-server 路径运行一个 Docker live lane，使用 `/codex bind` 绑定一个合成的 Slack 私信，执行 `/codex fast` 和 `/codex permissions`，然后验证普通回复和图像附件是通过原生插件绑定而不是 ACP 路由的。
- Crestodian 救援命令 smoke 测试：`pnpm test:live:crestodian-rescue-channel`
  - 这是一个可选的双重保险检查，用于验证消息渠道救援命令相关接口。它会执行 `/crestodian status`，排队一个持久化模型变更，回复 `/crestodian yes`，并验证审计 / 配置写入路径。
- Crestodian planner Docker smoke 测试：`pnpm test:docker:crestodian-planner`
  - 在一个无配置容器中运行 Crestodian，并在 `PATH` 上提供一个假的 Claude CLI，验证模糊 planner 回退会转换为带审计记录的类型化配置写入。
- Crestodian 首次运行 Docker smoke 测试：`pnpm test:docker:crestodian-first-run`
  - 从一个空的 OpenClaw 状态目录启动，将裸 `openclaw` 路由到 Crestodian，应用 setup / model / agent / Discord SecretRef 写入，验证配置，并检查审计条目。
- Moonshot/Kimi 成本 smoke 测试：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行一个独立的 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。验证 JSON 报告的是 Moonshot/K2.6，并且 assistant transcript 存储了规范化后的 `usage.cost`。

提示：当你只需要一个失败用例时，优先使用下面描述的 allowlist 环境变量来收窄 live 测试范围。

## QA 专用运行器

当你需要 QA-lab 级别的真实性时，这些命令与主测试套件并列提供：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，也可通过手动调度使用 mock 提供商运行。`QA-Lab - All Lanes` 会在 `main` 上按夜间计划运行，也可通过手动调度并行运行 mock parity gate、live Matrix lane 和由 Convex 管理的 live Telegram lane。`OpenClaw Release Checks` 会在发布审批前运行同样的 lanes。

- `pnpm openclaw qa suite`
  - 直接在主机上运行由仓库支持的 QA 场景。
  - 默认并行运行多个选中的场景，并使用隔离的 Gateway 网关 worker。`qa-channel` 默认并发数为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 采用旧的串行 lane。
  - 只要有任一场景失败，就会以非零状态退出。当你想保留工件但不希望退出码失败时，可使用 `--allow-failures`。
  - 支持 `live-frontier`、`mock-openai` 和 `aimock` 提供商模式。`aimock` 会启动一个本地 AIMock 支持的提供商服务器，用于实验性的 fixture 和协议 mock 覆盖，而不会替代具备场景感知能力的 `mock-openai` lane。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 内运行同样的 QA 测试套件。
  - 保持与主机上 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商 / 模型选择标志。
  - live 运行会转发对来宾可行的受支持 QA 认证输入：基于环境变量的提供商密钥、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，以便来宾能通过挂载的工作区写回内容。
  - 在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告 + 摘要以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，用于偏操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前 checkout 构建一个 npm tarball，在 Docker 中全局安装，运行非交互式 OpenAI API 密钥新手引导，默认配置 Telegram，验证启用插件会按需安装运行时依赖，运行 doctor，并对一个 mock OpenAI 端点执行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在 Discord 上运行相同的打包安装 lane。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个已发布的 OpenClaw 包，运行已安装包的新手引导，通过已安装的 CLI 配置 Telegram，然后复用 live Telegram QA lane，并将该已安装包作为 SUT Gateway 网关。
  - 默认值为 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证源。对于 CI / 发布自动化，设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，并同时设置 `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果在 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密钥，Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅覆盖此 lane 共用的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将此 lane 暴露为手动维护者工作流 `NPM Telegram Beta E2E`。它不会在合并时运行。该工作流使用 `qa-live-shared` 环境和 Convex CI 凭证租约。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前的 OpenClaw 构建，启动已配置 OpenAI 的 Gateway 网关，然后通过配置编辑启用内置 channel / plugins。
  - 验证 setup 发现阶段会让未配置插件的运行时依赖保持缺失状态，首次配置后的 Gateway 网关或 doctor 运行会按需安装每个内置插件的运行时依赖，并且第二次重启不会重新安装已激活的依赖。
  - 还会安装一个已知较旧的 npm 基线版本，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本的更新后 doctor 会修复内置渠道运行时依赖，而不依赖 harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 在 Parallels 来宾系统中运行原生打包安装更新 smoke 测试。每个选中的平台都会先安装请求的基线包，然后在同一个来宾中运行已安装的 `openclaw update` 命令，并验证安装版本、更新状态、Gateway 网关就绪情况以及一次本地智能体轮次。
  - 在迭代单个来宾时，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要工件路径和每个 lane 的状态。
  - 为避免 Parallels 传输停顿耗尽剩余测试窗口，请为长时间本地运行加上主机超时包装：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本会将嵌套 lane 日志写入 `/tmp/openclaw-parallels-npm-update.*`。在认定外层包装器卡住之前，请先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在冷启动来宾上，Windows 更新在更新后的 doctor / 运行时依赖修复阶段可能需要 10 到 15 分钟；只要嵌套的 npm 调试日志仍在推进，这仍然属于健康状态。
  - 不要将这个聚合包装器与单独的 Parallels macOS、Windows 或 Linux smoke lanes 并行运行。它们共享 VM 状态，可能会在快照恢复、包服务或来宾 Gateway 网关状态上发生冲突。
  - 更新后的验证会运行常规的内置插件相关接口，因为即使智能体轮次本身只检查简单的文本响应，诸如语音、图像生成和媒体理解等能力门面仍是通过内置运行时 API 加载的。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接的协议 smoke 测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的 Docker 支持 Tuwunel homeserver 运行 Matrix live QA lane。
  - 这个 QA 主机目前仅供仓库 / 开发使用。打包后的 OpenClaw 安装不包含 `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库 checkout 会直接加载内置运行器；不需要单独安装插件。
  - 配置三个临时 Matrix 用户（`driver`、`sut`、`observer`）和一个私有房间，然后启动一个 QA gateway 子进程，并将真实的 Matrix 插件作为 SUT 传输层。
  - 默认使用固定的稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。当你需要测试其他镜像时，可通过 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不提供共享凭证源标志，因为该 lane 会在本地配置一次性用户。
  - 会在 `.artifacts/qa-e2e/...` 下写入 Matrix QA 报告、摘要、observed-events 工件以及合并后的 stdout/stderr 输出日志。
  - 默认会输出进度，并通过 `OPENCLAW_QA_MATRIX_TIMEOUT_MS` 强制执行硬性运行超时（默认 30 分钟）。清理由 `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 限制，失败信息中会包含恢复命令 `docker compose ... down --remove-orphans`。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 driver 和 SUT bot token，针对真实私有群组运行 Telegram live QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必须是 Telegram 聊天的数字 id。
  - 支持 `--credential-source convex` 以使用共享池化凭证。默认使用 env 模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 只要任一场景失败，就会以非零状态退出。当你想保留工件但不希望退出码失败时，可使用 `--allow-failures`。
  - 需要两个位于同一私有群组中的不同 bot，且 SUT bot 需要暴露 Telegram 用户名。
  - 为了实现稳定的 bot 到 bot 观测，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保 driver bot 可以观测群组中的 bot 流量。
  - 会在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 observed-messages 工件。回复场景包含从 driver 发送请求到观测到 SUT 回复的 RTT。

live 传输 lane 共用一份标准契约，以避免新传输方式发生偏移：

`qa-channel` 仍然是广泛的合成 QA 测试套件，不属于 live 传输覆盖矩阵的一部分。

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的池中获取一个独占租约，在 lane 运行期间持续对该租约发送心跳，并在关闭时释放租约。

参考的 Convex 项目脚手架：

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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许仅用于本地开发的 loopback `http://` Convex URL。

正常运行时，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理命令（池添加 / 删除 / 列表）必须专门使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

面向维护者的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在 live 运行前使用 `doctor`，以检查 Convex site URL、broker 密钥、endpoint 前缀、HTTP 超时以及 admin/list 可达性，而不打印密钥值。在脚本和 CI 工具中使用 `--json` 以获得机器可读输出。

默认 endpoint 契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 池耗尽 / 可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `groupId` 必须是 Telegram 聊天数字 id 的字符串形式。
- 对于 `kind: "telegram"`，`admin/add` 会验证该结构，并拒绝格式错误的 payload。

### 向 QA 添加一个渠道

向 Markdown QA 系统添加一个渠道只需要**恰好两项**内容：

1. 该渠道的传输适配器。
2. 一个用于验证渠道契约的场景包。

当共享的 `qa-lab` 主机能够承载流程时，不要新增一个顶层 QA 命令根。

`qa-lab` 负责共享主机机制：

- `openclaw qa` 命令根
- 测试套件启动与清理
- worker 并发
- 工件写入
- 报告生成
- 场景执行
- 为旧版 `qa-channel` 场景提供兼容别名

运行器插件负责传输契约：

- 如何将 `openclaw qa <runner>` 挂载到共享的 `qa` 根下
- 如何为该传输配置 gateway
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何暴露 transcript 和规范化的传输状态
- 如何执行由传输支持的操作
- 如何处理传输特定的重置或清理

新渠道的最低接入门槛是：

1. 保持由 `qa-lab` 作为共享 `qa` 根的所有者。
2. 在共享的 `qa-lab` 主机接缝上实现该传输运行器。
3. 将传输特定机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 轻量；懒加载的 CLI 和运行器执行应放在独立入口点之后。
5. 在按主题划分的 `qa/scenarios/` 目录下编写或改造 Markdown 场景。
6. 为新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意迁移，否则要保持现有兼容别名继续可用。

决策规则很严格：

- 如果某项行为可以在 `qa-lab` 中统一表达一次，就放到 `qa-lab`。
- 如果某项行为依赖某一个渠道传输，就保留在该运行器插件或插件 harness 中。
- 如果某个场景需要多个渠道都能使用的新能力，就添加一个通用辅助函数，而不是在 `suite.ts` 中加入渠道特定分支。
- 如果某项行为只对一种传输有意义，就保持该场景的传输特定性，并在场景契约中明确说明。

新场景推荐使用的通用辅助函数名称：

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
兼容别名的存在是为了避免一次性强制迁移，而不是作为新场景编写的范式。

## 测试套件（哪些内容在哪里运行）

可以将这些测试套件理解为“真实性逐步增加”（同时脆弱性 / 成本也逐步增加）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：未定向运行使用 `vitest.full-*.config.ts` 分片集，并且可能会将多项目分片展开为按项目拆分的配置，以便并行调度
- 文件：核心 / 单元测试清单位于 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts`，以及由 `vitest.unit.config.ts` 覆盖的白名单 `ui` node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（gateway 认证、路由、工具、解析、配置）
  - 已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应当快速且稳定

<AccordionGroup>
  <Accordion title="项目、分片和定向 lane">

    - 未定向的 `pnpm test` 会运行 12 个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是运行一个巨大的原生根项目进程。这样可以降低繁忙机器上的 RSS 峰值，并避免 auto-reply / extension 工作拖累无关的测试套件。
    - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不现实。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先通过定向 lane 路由显式的文件 / 目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 无需承担完整根项目启动的成本。
    - 当 diff 只涉及可路由的源文件 / 测试文件时，`pnpm test:changed` 会将变更过的 git 路径扩展到相同的定向 lane；配置 / setup 编辑仍会回退到更广泛的根项目重跑。
    - `pnpm check:changed` 是窄范围工作下常规的智能本地门禁。它会将 diff 分类为 core、core tests、extensions、extension tests、apps、docs、release metadata 和 tooling，然后运行匹配的 typecheck / lint / test lanes。公开的 Plugin SDK 和插件契约变更会额外包含一次 extension 验证，因为 extensions 依赖这些核心契约。仅包含发布元数据的版本提升会运行定向的版本 / 配置 / 根依赖检查，而不是完整套件，并带有一项保护措施，用于拒绝顶层 version 字段之外的包变更。
    - 来自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 以及类似纯工具区域的轻导入单元测试会路由到 `unit-fast` lane，该 lane 会跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时较重的文件仍保留在现有 lanes 上。
    - 某些选定的 `plugin-sdk` 和 `commands` helper 源文件也会将 changed 模式运行映射到这些轻量 lane 中的显式同级测试，因此 helper 编辑无需为该目录重跑完整的重型测试套件。
    - `auto-reply` 拥有三个专用桶：顶层 core helpers、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树。这样可以让最重的 reply harness 工作不影响轻量的 status / chunk / token 测试。

  </Accordion>

  <Accordion title="内嵌运行器覆盖">

    - 当你修改消息工具发现输入或压缩运行时上下文时，要同时保持这两个层级的覆盖。
    - 为纯路由和规范化边界添加聚焦的 helper 回归测试。
    - 保持内嵌运行器集成测试套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些测试套件会验证带作用域的 id 和压缩行为仍然通过真实的 `run.ts` / `compact.ts` 路径流动；仅有 helper 测试并不能充分替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置将 `isolate: false` 固定下来，并在根项目、e2e 和 live 配置中使用非隔离运行器。
    - 根 UI lane 保留其 `jsdom` setup 和优化器，但也在共享的非隔离运行器上运行。
    - 每个 `pnpm test` 分片都会从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与 stock V8 行为进行对比。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示某个 diff 会触发哪些架构 lanes。
    - pre-commit hook 仅负责格式化。它会重新暂存已格式化文件，不会运行 lint、typecheck 或测试。
    - 当你需要智能本地门禁时，请在交接或 push 前显式运行 `pnpm check:changed`。公开的 Plugin SDK 和插件契约变更会额外包含一次 extension 验证。
    - 当变更路径能够清晰映射到较小测试套件时，`pnpm test:changed` 会通过定向 lane 路由。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
    - 本地 worker 自动伸缩有意保持保守，并且当主机负载平均值已经较高时会回退，因此默认情况下多个并发 Vitest 运行造成的影响更小。
    - 基础 Vitest 配置将项目 / 配置文件标记为 `forceRerunTriggers`，以便在测试接线发生变化时，changed 模式重跑仍然保持正确。
    - 该配置会在受支持的主机上保持 `OPENCLAW_VITEST_FS_MODULE_CACHE` 启用；如果你希望为直接性能分析指定一个明确的缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入拆解输出。
    - `pnpm test:perf:imports:changed` 会将同样的性能分析视图限定到自 `origin/main` 以来变更的文件。
    - 当某个热点测试仍将大部分时间花在启动导入上时，应将重依赖放在一个狭窄的本地 `*.runtime.ts` 接缝之后，并直接 mock 该接缝，而不是仅仅为了传给 `vi.mock(...)` 就深度导入运行时 helper。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将已提交 diff 的路由式 `test:changed` 与原生根项目路径进行对比，并打印 wall time 和 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和根 Vitest 配置，将当前脏工作树的变更文件列表路由后进行基准测试。
    - `pnpm test:perf:profile:main` 会为 Vitest / Vite 启动和转换开销写出主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为单元测试套件写出 runner CPU + heap profile。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制使用一个 worker
- 范围：
  - 启动一个默认启用诊断的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 gateway 消息、内存以及大载荷抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化 helper
  - 断言记录器保持有界、合成 RSS 样本保持在压力预算之下，并且每个会话的队列深度最终回落到零
- 预期：
  - 对 CI 安全且不需要密钥
  - 这是一个用于稳定性回归跟进的窄 lane，不可替代完整的 Gateway 网关测试套件

### E2E（Gateway 网关 smoke 测试）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads`，并设置 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以 silent 模式运行，以减少控制台 I/O 开销。
- 有用的覆盖选项：
  - `OPENCLAW_E2E_WORKERS=<n>` 强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例 gateway 端到端行为
  - WebSocket / HTTP 接口、节点配对和更重的网络交互
- 预期：
  - 会在 CI 中运行（当流水线中启用时）
  - 不需要真实密钥
  - 比单元测试包含更多活动部件（可能更慢）

### E2E：OpenShell 后端 smoke 测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell gateway
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱文件系统桥验证远端规范化文件系统行为
- 预期：
  - 仅按需启用；不是默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 gateway 和沙箱
- 有用的覆盖选项：
  - `OPENCLAW_E2E_OPENSHELL=1` 在手动运行更广泛的 e2e 测试套件时启用此测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 指向非默认的 CLI 二进制文件或包装脚本

### live 测试（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型在今天、使用真实凭证时，是否真的能工作？”
  - 捕捉提供商格式变更、工具调用怪癖、认证问题和速率限制行为
- 预期：
  - 按设计并不具备 CI 稳定性（真实网络、真实提供商策略、配额、中断）
  - 会花钱 / 消耗速率限制
  - 优先运行收窄后的子集，而不是“全部”
- live 运行会 source `~/.profile`，以获取缺失的 API 密钥。
- 默认情况下，live 运行仍会隔离 `HOME`，并将 config / auth 材料复制到临时测试 home 中，这样单元测试 fixture 就不会改动你真实的 `~/.openclaw`。
- 只有在你明确需要 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认采用更安静的模式：会保留 `[live] ...` 进度输出，但会隐藏额外的 `~/.profile` 提示，并静默 gateway 启动日志 / Bonjour 噪声。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（按提供商区分）：设置逗号 / 分号格式的 `*_API_KEYS` 或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或通过 `OPENCLAW_LIVE_*_KEY` 进行每次 live 运行覆盖；测试会在遇到速率限制响应时重试。
- 进度 / 心跳输出：
  - live 测试套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获较安静，长时间的提供商调用也能明确显示仍在活动中。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此在 live 运行期间，提供商 / gateway 进度行会立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 gateway / probe 心跳。

## 我应该运行哪个测试套件？

使用下面的决策表：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果你改动很多，再运行 `pnpm test:coverage`）
- 修改 gateway 网络 / WS 协议 / 配对：额外运行 `pnpm test:e2e`
- 调试“我的 bot 挂了” / 提供商特定故障 / 工具调用：运行收窄后的 `pnpm test:live`

## live 测试（接触网络的测试）

关于 live 模型矩阵、CLI 后端 smoke 测试、ACP smoke 测试、Codex app-server harness，以及所有媒体提供商 live 测试（Deepgram、BytePlus（国际版）、ComfyUI、image、music、video、media harness）——以及 live 运行的凭证处理——请参阅
[测试 — live 测试套件](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行各自匹配的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），挂载你的本地配置目录和工作区（如果已挂载，也会 source `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认采用较小的 smoke 上限，以便完整的 Docker 扫描保持可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，并且
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确想要更大范围的穷尽扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，然后在各个 live Docker lane 中复用它。它还会通过 `test:docker:e2e-build` 构建一个共享的 `scripts/e2e/Dockerfile` 镜像，并在用于验证已构建应用的 E2E 容器 smoke 运行器中复用。这个聚合器使用加权本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会避免重型 live、npm 安装和多服务 lane 同时启动。默认值为 10 个槽位，`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有当 Docker 主机有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。运行器默认会执行 Docker 预检，移除过期的 OpenClaw E2E 容器，每 30 秒打印一次状态，将成功 lane 的耗时存储到 `.artifacts/docker-tests/lane-timings.json`，并利用这些耗时在后续运行时优先启动更长的 lanes。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不构建也不运行 Docker 的情况下打印加权 lane 清单。
- 容器 smoke 运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

live 模型 Docker 运行器还会只绑定挂载所需的 CLI auth home（如果运行未收窄，则挂载所有受支持的 home），然后在运行前将它们复制到容器 home 中，以便外部 CLI OAuth 可以刷新 token，而不会改动主机的 auth 存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定 smoke 测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端 smoke 测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke 测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + 开发智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live smoke 测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- npm tarball 新手引导 / 渠道 / 智能体 smoke 测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包后的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证 doctor 会修复已激活插件的运行时依赖，并运行一次模拟的 OpenAI 智能体轮次。使用 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机构建，或通过 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- Bun 全局安装 smoke 测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前树，在隔离的 home 中使用 `bun install -g` 安装，并验证 `openclaw infer image providers --json` 返回的是内置 image 提供商，而不是卡住。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过主机构建，或通过 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker smoke 测试：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新 smoke 测试默认使用 npm `latest` 作为稳定基线，然后再升级到候选 tarball。非 root 安装器检查会保持隔离的 npm 缓存，以避免 root 拥有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑时复用 root / update / direct-npm 缓存。
- Install Smoke CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；当需要覆盖直接 `npm install -g` 时，请在本地不带这个环境变量运行脚本。
- 智能体删除共享工作区 CLI smoke 测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认会构建根 Dockerfile 镜像，在隔离的容器 home 中为两个智能体注入一个工作区，运行 `agents delete --json`，并验证 JSON 有效以及工作区保留行为。可使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses `web_search` 最小推理回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟的 OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升为 `low`，然后强制提供商 schema 拒绝，并检查原始细节是否出现在 Gateway 网关日志中。
- MCP 渠道桥接（已注入的 Gateway 网关 + stdio bridge + 原始 Claude notification-frame smoke 测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi 内置 MCP 工具（真实 stdio MCP 服务器 + 内嵌 Pi profile allow / deny smoke 测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron / subagent MCP 清理（真实 Gateway 网关 + 在隔离的 cron 和一次性 subagent 运行后销毁 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装 smoke 测试 + `/plugin` 别名 + Claude bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
- 插件更新未变更 smoke 测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据 smoke 测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，在刚完成本地构建后使用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过主机构建，或通过 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。完整的 Docker 聚合器会预先打包一次该 tarball，然后将内置渠道检查拆分为独立 lanes，包括 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的单独更新 lanes。直接运行内置 lane 时，可使用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 收窄渠道矩阵，或使用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 收窄更新场景。该 lane 还会验证 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 会抑制 doctor / 运行时依赖修复。
- 在迭代过程中，如需收窄内置插件运行时依赖测试，可禁用无关场景，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

要手动预构建并复用共享的 built-app 镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置后，诸如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 这样的测试套件专用镜像覆盖仍然优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果该镜像尚未存在于本地，这些脚本会先拉取它。QR 和安装器 Docker 测试会保留各自的 Dockerfile，因为它们验证的是包 / 安装行为，而不是共享的 built-app 运行时。

live 模型 Docker 运行器还会将当前 checkout 以只读方式绑定挂载，并在容器内暂存到一个临时工作目录中。这样既能保持运行时镜像精简，又能让 Vitest 针对你本地精确的源代码 / 配置运行。暂存步骤会跳过大型仅本地缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或 Gradle 输出目录，因此 Docker live 运行不会花费数分钟复制机器特定工件。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 gateway live 探针就不会在容器内启动真实的 Telegram/Discord 等渠道 worker。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要收窄或排除该 Docker lane 中的 gateway live 覆盖时，也要一并传递 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性 smoke 测试：它会启动一个启用了 OpenAI-compatible HTTP endpoint 的 OpenClaw gateway 容器，再针对该 gateway 启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 完成登录，验证 `/api/models` 暴露 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一个真实聊天请求。
第一次运行可能会明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而且 Open WebUI 可能需要完成自己的冷启动设置。
这个 lane 需要一个可用的 live 模型密钥，而在 Docker 化运行中，`OPENCLAW_PROFILE_FILE`（默认 `~/.profile`）是提供该密钥的主要方式。
成功运行会打印一个小型 JSON payload，例如 `{ "ok": true, "model": "openclaw/default", ... }`。
`test:docker:mcp-channels` 是有意设计为确定性的，不需要真实的 Telegram、Discord 或 iMessage 账号。它会启动一个已注入状态的 Gateway 网关容器，再启动第二个容器来生成 `openclaw mcp serve`，然后通过真实的 stdio MCP bridge 验证路由后的会话发现、transcript 读取、附件元数据、live 事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。通知检查会直接检查原始 stdio MCP frame，因此该 smoke 测试验证的是 bridge 实际发出的内容，而不仅仅是某个特定客户端 SDK 恰好暴露的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要 live 模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实的 stdio MCP probe 服务器，通过内嵌的 Pi bundle MCP 运行时将该服务器实例化，执行工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会过滤掉它们。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要 live 模型密钥。它会启动一个带有真实 stdio MCP probe 服务器的已注入状态 Gateway 网关，运行一次隔离的 cron 轮次和一次 `/subagents spawn` 一次性子智能体轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程 smoke 测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归 / 调试工作流。之后可能还需要它来验证 ACP 线程路由，因此不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`），挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`），挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`），挂载到 `/home/node/.profile`，并在运行测试前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于验证仅来自 `OPENCLAW_PROFILE_FILE` 的环境变量；此模式会使用临时 config / workspace 目录，且不挂载外部 CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`），挂载到 `/home/node/.npm-global`，用于 Docker 内部缓存的 CLI 安装
- `$HOME` 下的外部 CLI auth 目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 收窄后的提供商运行只会挂载由 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗号列表（如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`）手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于收窄运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内筛选提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用现有的 `openclaw:local-live` 镜像，以便在不需要重建时重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储而不是 env
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 gateway 为 Open WebUI smoke 测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI smoke 测试使用的 nonce 检查 prompt
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

在修改文档后运行文档检查：`pnpm check:docs`。
当你还需要检查页内标题时，运行完整的 Mintlify anchor 验证：`pnpm docs:check-links:anchors`。

## 离线回归测试（CI 安全）

这些是在没有真实提供商的情况下进行的“真实流水线”回归测试：

- Gateway 网关工具调用（mock OpenAI、真实 gateway + Agent loop）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关 wizard（WS `wizard.start` / `wizard.next`，强制写入配置 + auth）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有少量 CI 安全的测试，它们的行为类似“智能体可靠性评估”：

- 通过真实 gateway + Agent loop 的 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证 session 接线和配置效果的端到端 wizard 流程（`src/gateway/gateway.test.ts`）。

对于 Skills（参见 [Skills](/zh-CN/tools/skills)），目前仍缺少的是：

- **决策能力：** 当 prompt 中列出 Skills 时，智能体是否会选择正确的 Skill（或避免选择无关 Skill）？
- **合规性：** 智能体在使用前是否会读取 `SKILL.md` 并遵循所需的步骤 / 参数？
- **工作流契约：** 断言工具顺序、会话历史延续以及沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 一个使用 mock 提供商的场景运行器，用于断言工具调用 + 顺序、Skill 文件读取和会话接线。
- 一小组聚焦 Skill 的场景（使用 vs 避免、门控、prompt 注入）。
- 仅在 CI 安全测试套件就位之后，再添加可选的 live 评估（按需启用、受 env 控制）。

## 契约测试（插件和渠道形状）

契约测试用于验证每个已注册插件和渠道都符合其接口契约。它们会遍历所有已发现的插件，并运行一组形状和行为断言。默认的 `pnpm test` 单元 lane 会有意跳过这些共享接缝和 smoke 文件；当你修改共享渠道或提供商接口时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息 payload 结构
- **inbound** - 入站消息处理
- **actions** - 渠道动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略强制执行

### 提供商 Status 契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道 Status 探针
- **registry** - 插件注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选项 / 选择
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

- 如果可能，添加一个 CI 安全的回归测试（mock / stub 提供商，或捕获精确的请求形状转换）
- 如果该问题天然只能在 live 中复现（速率限制、认证策略），则保持 live 测试收窄，并通过环境变量按需启用
- 优先定位到能够捕获该缺陷的最小层级：
  - 提供商请求转换 / 重放缺陷 → 直接模型测试
  - gateway 会话 / 历史 / 工具流水线缺陷 → gateway live smoke 测试或 CI 安全的 gateway mock 测试
- SecretRef 遍历防护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言遍历段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加了新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会有意在目标 id 未分类时失败，这样新类别就无法被静默跳过。

## 相关内容

- [Testing live](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)
