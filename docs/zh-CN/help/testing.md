---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型 / 提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：unit/e2e/live 测试套件、Docker 运行器，以及每项测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-25T00:41:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3bd1ab654b43a380c6eecb3ba53e74442bad9374be4eea2d9ce368d8b89b7c2
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三个 Vitest 测试套件（unit/integration、e2e、live）以及一小组
Docker 运行器。本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么（以及它刻意**不**覆盖什么）。
- 常见工作流应运行哪些命令（本地、推送前、调试）。
- live 测试如何发现凭证并选择模型 / 提供商。
- 如何为真实世界中的模型 / 提供商问题添加回归测试。

## 快速开始

大多数时候：

- 完整门禁（预期在推送前执行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置充足的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接进入 Vitest 监听循环：`pnpm test:watch`
- 直接定位文件现在也会路由 extension/channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代单个失败用例时，优先先运行定向测试。
- 基于 Docker 的 QA 站点：`pnpm qa:lab:up`
- 基于 Linux VM 的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试或想要更高把握时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- live 测试套件（模型 + Gateway 网关 tool/image 探测）：`pnpm test:live`
- 安静地只运行一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 每个选定模型现在都会运行一个文本回合和一个小型的类文件读取探测。
    元数据声明支持 `image` 输入的模型还会运行一个微型图像回合。
    在隔离提供商故障时，可通过 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用这些额外探测。
  - CI 覆盖范围：每日运行的 `OpenClaw Scheduled Live And E2E Checks` 与手动运行的
    `OpenClaw Release Checks` 都会调用可复用的 live/E2E 工作流，并设置
    `include_live_suites: true`，其中包括按提供商分片的独立 Docker live 模型
    matrix 作业。
  - 若要进行聚焦的 CI 重跑，请派发 `OpenClaw Live And E2E Checks (Reusable)`
    并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 及其
    scheduled/release 调用方中。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 对 Codex app-server 路径运行一个 Docker live 通道，使用 `/codex bind`
    绑定一个合成的 Slack 私信，执行 `/codex fast` 和
    `/codex permissions`，然后验证普通回复和图片附件
    都是通过原生插件绑定路由，而不是 ACP。
- Moonshot/Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行
  `openclaw models list --provider moonshot --json`，然后针对
  `moonshot/kimi-k2.6` 运行独立的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  。验证 JSON 报告了 Moonshot/K2.6，且助手转录中保存了规范化的
  `usage.cost`。

提示：当你只需要一个失败用例时，优先使用下文描述的允许列表环境变量来缩小 live 测试范围。

## QA 专用运行器

当你需要接近 QA-lab 真实环境时，这些命令与主测试套件一起使用：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上
以及从手动派发时使用 mock 提供商运行。`QA-Lab - All Lanes` 会在 `main`
上每晚运行，也可通过手动派发运行，其中 mock parity gate、live Matrix 通道和
Convex 管理的 live Telegram 通道会作为并行作业执行。`OpenClaw Release Checks`
会在发布批准前运行相同的通道。

- `pnpm openclaw qa suite`
  - 直接在主机上运行基于仓库的 QA 场景。
  - 默认并行运行多个选定场景，并使用隔离的
    Gateway 网关 worker。`qa-channel` 默认并发数为 4（受
    所选场景数量限制）。使用 `--concurrency <count>` 调整 worker
    数量，或使用 `--concurrency 1` 获得旧的串行通道。
  - 任一场景失败时以非零状态退出。若你
    只想获取产物而不希望退出失败，请使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个本地的 AIMock 支持的 provider 服务器，用于实验性
    fixture 和协议 mock 覆盖，而不会替代具备场景感知能力的
    `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 Multipass Linux VM 中运行同一个 QA 测试套件。
  - 保持与主机上 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的 provider/model 选择标志。
  - live 运行会转发对来宾系统切实可行的受支持 QA 凭证输入：
    基于环境变量的 provider 密钥、QA live provider 配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须位于仓库根目录下，以便来宾可通过
    挂载的工作区回写。
  - 在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告 + 摘要，以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动基于 Docker 的 QA 站点，用于面向操作人员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建一个 npm tarball，在 Docker 中全局安装，
    运行非交互式 OpenAI API 密钥新手引导，默认配置 Telegram，
    验证启用插件会按需安装运行时依赖，运行 doctor，
    并针对一个模拟的 OpenAI 端点运行一次本地智能体回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在同一打包安装
    通道中改为运行 Discord。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个已发布的 OpenClaw 包，运行已安装包的
    新手引导，通过已安装的 CLI 配置 Telegram，然后复用
    live Telegram QA 通道，并将该已安装包作为 SUT Gateway 网关。
  - 默认值为 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证源。
    对于 CI/发布自动化，设置
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，并同时设置
    `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果
    在 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密钥，
    Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅为该通道覆盖共享的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将此通道公开为手动维护者工作流
    `NPM Telegram Beta E2E`。它不会在合并时运行。该工作流使用
    `qa-live-shared` 环境和 Convex CI 凭证租约。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，使用已配置的 OpenAI 启动
    Gateway 网关，然后通过配置编辑启用内置 channel/plugins。
  - 验证设置发现阶段会让未配置插件的运行时依赖保持缺失状态，
    第一次配置后的 Gateway 网关或 doctor 运行会按需安装每个内置
    插件的运行时依赖，并验证第二次重启不会重新安装
    已经激活的依赖。
  - 还会安装一个已知较旧的 npm 基线版本，在运行
    `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本的
    更新后 doctor 会修复内置渠道运行时依赖，而不需要
    harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 在 Parallels 来宾系统中运行原生打包安装更新冒烟测试。每个选定平台都会先安装请求的基线包，
    然后在同一个来宾系统中运行已安装的 `openclaw update` 命令，并验证已安装版本、
    更新状态、Gateway 网关就绪情况以及一次本地智能体回合。
  - 在迭代单个来宾时，使用 `--platform macos`、`--platform windows` 或
    `--platform linux`。使用 `--json` 获取摘要产物路径和
    每个通道状态。
  - 为长时间本地运行加上主机超时包装，以防 Parallels 传输卡顿
    吞掉其余测试时间窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 脚本会将嵌套通道日志写入 `/tmp/openclaw-parallels-npm-update.*`。
    在假设外层包装器卡死前，先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在冷启动来宾系统上，Windows 更新可能会在更新后的 doctor/运行时
    依赖修复阶段花费 10 到 15 分钟；只要嵌套的
    npm 调试日志还在推进，这仍属健康状态。
  - 不要将这个聚合包装器与单独的 Parallels
    macOS、Windows 或 Linux 冒烟通道并行运行。它们共享 VM 状态，并可能在
    快照恢复、包服务或来宾 Gateway 网关状态上发生冲突。
  - 更新后证明会运行常规的内置插件表面，因为像 speech、image generation 和 media
    understanding 这样的能力 facade 是通过内置运行时 API 加载的，即使智能体回合本身
    只检查一个简单的文本响应也是如此。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock provider 服务器，用于直接协议冒烟
    测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的、基于 Docker 的 Tuwunel homeserver 运行 Matrix live QA 通道。
  - 这个 QA 主机目前仅用于仓库 / 开发环境。打包安装的 OpenClaw 不包含
    `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库检出会直接加载内置运行器；不需要单独的插件安装
    步骤。
  - 预配三个临时 Matrix 用户（`driver`、`sut`、`observer`）和一个私有房间，然后以真实 Matrix 插件作为 SUT 传输启动一个 QA Gateway 网关子进程。
  - 默认使用固定的稳定 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。当你需要测试其他镜像时，可通过 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不提供共享凭证源标志，因为该通道会在本地预配一次性用户。
  - 在 `.artifacts/qa-e2e/...` 下写入 Matrix QA 报告、摘要、observed-events 产物以及合并后的 stdout/stderr 输出日志。
  - 默认输出进度，并通过 `OPENCLAW_QA_MATRIX_TIMEOUT_MS` 强制执行硬性运行超时（默认 30 分钟）。清理由 `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 限制，失败信息中会包含恢复命令 `docker compose ... down --remove-orphans`。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 driver 和 SUT bot token，针对真实私有群组运行 Telegram live QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是数值型 Telegram chat id。
  - 支持 `--credential-source convex` 以使用共享池化凭证。默认使用 env 模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 任一场景失败时以非零状态退出。若你
    只想获取产物而不希望退出失败，请使用 `--allow-failures`。
  - 需要两个位于同一私有群组中的不同 bot，且 SUT bot 必须暴露 Telegram 用户名。
  - 为了实现稳定的 bot 对 bot 观测，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保 driver bot 能观测群组中的 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 observed-messages 产物。回复场景包括从 driver 发送请求到观测到 SUT 回复之间的 RTT。

live 传输通道共享一个标准契约，以防新传输出现漂移：

`qa-channel` 仍然是广泛的合成 QA 测试套件，不属于 live
传输覆盖矩阵的一部分。

| 通道 | Canary | 提及门控 | 允许列表阻止 | 顶层回复 | 重启恢复 | 线程后续跟进 | 线程隔离 | 反应观测 | 帮助命令 |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix | x | x | x | x | x | x | x | x |  |
| Telegram | x |  |  |  |  |  |  |  | x |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，
QA lab 会从一个由 Convex 支持的池中获取独占租约，在通道运行期间为该租约发送心跳，
并在关闭时释放租约。

Convex 项目脚手架参考：

- `qa/convex-credential-broker/`

所需环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 针对所选角色的一个密钥：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用于 `ci`
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

维护者管理命令（池添加 / 删除 / 列表）要求
专门使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供维护者使用的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在 live 运行前使用 `doctor`，以检查 Convex 站点 URL、broker 密钥、
端点前缀、HTTP 超时以及 admin/list 可达性，而不会打印
密钥值。在脚本和 CI
工具中使用 `--json` 可获得机器可读输出。

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

Telegram 类型的负载结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数值型 Telegram chat id 字符串。
- `admin/add` 会对 `kind: "telegram"` 验证该结构，并拒绝格式错误的负载。

### 向 QA 添加一个渠道

向 Markdown QA 系统添加一个渠道只需要两样东西：

1. 该渠道的传输适配器。
2. 一个用于验证渠道契约的场景包。

当共享的 `qa-lab` 主机可以负责流程时，不要添加新的顶层 QA 命令根。

`qa-lab` 负责共享主机机制：

- `openclaw qa` 命令根
- 测试套件启动和拆除
- worker 并发
- 产物写入
- 报告生成
- 场景执行
- 对旧版 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- `openclaw qa <runner>` 如何挂载到共享的 `qa` 根之下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何暴露转录内容和规范化后的传输状态
- 如何执行由传输支持的操作
- 如何处理特定于传输的重置或清理

新渠道的最低接入门槛是：

1. 保持 `qa-lab` 作为共享 `qa` 根的拥有者。
2. 在共享的 `qa-lab` 主机接缝上实现传输运行器。
3. 将特定于传输的机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个相互竞争的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 轻量；延迟 CLI 和运行器执行应保留在单独的入口点之后。
5. 在有主题的 `qa/scenarios/` 目录下编写或调整 Markdown 场景。
6. 为新场景使用通用场景辅助工具。
7. 除非仓库正在进行有意迁移，否则保持现有兼容别名继续可用。

决策规则非常严格：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就把它放进 `qa-lab`。
- 如果某个行为依赖某一个渠道传输，就把它保留在该运行器插件或插件 harness 中。
- 如果某个场景需要一个超过一个渠道都能使用的新能力，请添加一个通用辅助工具，而不是在 `suite.ts` 中增加渠道特定分支。
- 如果某个行为只对一种传输有意义，就保持该场景是传输特定的，并在场景契约中明确说明。

新场景优先使用的通用辅助工具名称是：

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

新的渠道工作应使用通用辅助工具名称。
兼容别名的存在是为了避免一次性强制迁移，而不是作为
新场景编写的范式。

## 测试套件（什么在什么地方运行）

可以把这些测试套件理解为“真实性逐步增加”（以及不稳定性 / 成本逐步增加）：

### Unit / integration（默认）

- 命令：`pnpm test`
- 配置：未定向运行会使用 `vitest.full-*.config.ts` 分片集，并且可能会将多项目分片扩展为按项目拆分的配置，以便并行调度
- 文件：core/unit 清单位于 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts`，以及由 `vitest.unit.config.ts` 覆盖的白名单 `ui` node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关 auth、路由、tooling、解析、配置）
  - 针对已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定

<AccordionGroup>
  <Accordion title="项目、分片和作用域通道">

    - 未定向的 `pnpm test` 会运行十二个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生 root-project 进程。这可以降低高负载机器上的峰值 RSS，并避免 auto-reply/extension 工作拖慢无关套件。
    - `pnpm test --watch` 仍然使用原生 root `vitest.config.ts` 项目图，因为多分片的 watch 循环并不现实。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先通过作用域通道路由显式文件 / 目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不必承担完整 root 项目启动开销。
    - `pnpm test:changed` 会在差异仅触及可路由的源文件 / 测试文件时，将变更过的 git 路径扩展为相同的作用域通道；配置 / 设置编辑仍会回退为更广泛的 root-project 重跑。
    - `pnpm check:changed` 是窄范围工作时常规的智能本地门禁。它会将差异分类为 core、core tests、extensions、extension tests、apps、docs、release metadata 和 tooling，然后运行匹配的 typecheck/lint/test 通道。公共插件 SDK 和插件契约变更会包含一次 extension 验证通道，因为 extensions 依赖这些 core 契约。仅发布元数据版本号变更会运行定向的 version/config/root-dependency 检查，而不是完整套件，并带有一个守卫，用于拒绝超出顶层 version 字段范围的 package 变更。
    - 来自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 及类似纯工具区域的轻导入 unit 测试会路由到 `unit-fast` 通道，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时较重的文件仍保留在现有通道上。
    - 选定的 `plugin-sdk` 和 `commands` helper 源文件也会将 changed 模式运行映射到这些轻量通道中的显式同级测试，因此 helper 编辑可避免为该目录重跑完整的重型套件。
    - `auto-reply` 有三个专用分桶：顶层 core helper、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树。这让最重的 reply harness 工作不会落到廉价的 status/chunk/token 测试上。

  </Accordion>

  <Accordion title="嵌入式运行器覆盖">

    - 当你变更消息工具发现输入或压缩运行时
      上下文时，请同时保持两个层级的覆盖。
    - 为纯路由和规范化
      边界添加聚焦的 helper 回归测试。
    - 保持嵌入式运行器集成套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些套件会验证作用域 id 和压缩行为仍会
      通过真实的 `run.ts` / `compact.ts` 路径流动；仅有 helper 测试
      不能充分替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置固定 `isolate: false`，并在
      root projects、e2e 和 live 配置中使用非隔离运行器。
    - root UI 通道保留其 `jsdom` 设置和优化器，但也运行在
      共享的非隔离运行器上。
    - 每个 `pnpm test` 分片都继承了相同的 `threads` + `isolate: false`
      默认值，来源于共享的 Vitest 配置。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node
      进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。
      设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与默认 V8
      行为进行对比。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示某个差异触发了哪些架构通道。
    - pre-commit hook 仅执行格式化。它会重新暂存已格式化文件，
      不会运行 lint、typecheck 或测试。
    - 在交接或推送前，当你
      需要智能本地门禁时，请显式运行 `pnpm check:changed`。公共插件 SDK 和 plugin-contract
      变更会包含一次 extension 验证通道。
    - `pnpm test:changed` 会在变更路径
      能清晰映射到更小套件时通过作用域通道路由。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由
      行为，只是使用更高的 worker 上限。
    - 本地 worker 自动扩缩容是有意保守的，并且会在主机负载平均值已较高时回退，
      因此多个并发
      Vitest 运行默认情况下造成的影响会更小。
    - 基础 Vitest 配置会将项目 / 配置文件标记为
      `forceRerunTriggers`，以便在测试
      接线变更时 changed 模式重跑仍然正确。
    - 配置会在受支持
      主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你希望
      为直接分析指定一个明确的缓存位置，请设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest 导入时长报告以及
      导入分解输出。
    - `pnpm test:perf:imports:changed` 会将相同的分析视图限定到
      自 `origin/main` 以来发生变更的文件。
    - 当某个热点测试仍然把大部分时间花在启动导入上时，
      请将重量级依赖保留在狭窄的本地 `*.runtime.ts` 接缝之后，并
      直接 mock 该接缝，而不是深层导入运行时辅助工具，
      仅仅为了再通过 `vi.mock(...)` 传递它们。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将已路由的
      `test:changed` 与该已提交差异对应的原生 root-project 路径进行比较，并打印墙钟时间以及 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过
      `scripts/test-projects.mjs` 和 root Vitest 配置，
      对当前脏工作树执行基准测试，并按变更文件列表进行路由。
    - `pnpm test:perf:profile:main` 会为
      Vitest/Vite 启动和 transform 开销写入主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件级并行的情况下，
      为 unit 套件写入运行器 CPU + heap profile。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制使用一个 worker
- 范围：
  - 启动一个默认启用诊断功能的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 Gateway 网关消息、内存和大负载抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化辅助工具
  - 断言记录器保持有界、合成 RSS 采样保持在压力预算之下，并且每个会话的队列深度会回落到零
- 预期：
  - 对 CI 安全且无需密钥
  - 是用于稳定性回归跟进的窄通道，不可替代完整的 Gateway 网关套件

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及位于 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads`，并设置 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 有用的覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制指定 worker 数量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 表面、节点配对以及更重的网络行为
- 预期：
  - 在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比 unit 测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell Gateway 网关
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 对 OpenClaw 的 OpenShell 后端进行验证
  - 通过沙箱 fs bridge 验证远端规范文件系统行为
- 预期：
  - 仅按需启用；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关和沙箱
- 有用的覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1` 用于在手动运行更广泛 e2e 套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用于指向非默认 CLI 二进制文件或包装脚本

### live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及位于 `extensions/` 下的内置插件 live 测试
- 默认值：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型在今天配合真实凭证时是否真的可用？”
  - 捕捉提供商格式变化、tool-calling 怪癖、auth 问题以及速率限制行为
- 预期：
  - 按设计并非 CI 稳定（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 优先运行缩小范围后的子集，而不是“全部”
- live 运行会读取 `~/.profile`，以获取缺失的 API 密钥。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置 / auth 材料复制到一个临时测试 home 中，这样 unit fixture 就无法修改你真实的 `~/.openclaw`。
- 仅在你有意让 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认采用更安静的模式：它会保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静音 Gateway 网关启动日志 / Bonjour 噪声。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（提供商特定）：设置 `*_API_KEYS` 使用逗号 / 分号格式，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或通过 `OPENCLAW_LIVE_*_KEY` 进行每个 live 的覆盖；测试会在遇到速率限制响应时重试。
- 进度 / 心跳输出：
  - live 套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获处于安静模式，长时间的提供商调用也能显式显示仍在活动。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此在 live 运行期间，提供商 / Gateway 网关进度行会立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探测心跳。

## 我应该运行哪个测试套件？

使用这个决策表：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果你改动很多，也运行 `pnpm test:coverage`）
- 涉及 Gateway 网关网络 / WS 协议 / 配对：额外运行 `pnpm test:e2e`
- 调试“我的 bot 挂了” / 提供商特定故障 / tool calling：运行一个缩小范围的 `pnpm test:live`

## live（涉及网络）测试

关于 live 模型矩阵、CLI 后端冒烟、ACP 冒烟、Codex app-server
harness，以及所有媒体提供商 live 测试（Deepgram、BytePlus（国际版）、ComfyUI、image、
music、video、media harness）—— 以及 live 运行的凭证处理 —— 请参见
[测试 — live 套件](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 仅在仓库 Docker 镜像中运行与其匹配的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（如果已挂载，也会读取 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认使用更小的冒烟上限，以便完整 Docker 扫描仍然切实可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你
  明确需要更大规模的穷尽式扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，然后在 live Docker 通道中复用它。它还会通过 `test:docker:e2e-build` 构建一个共享的 `scripts/e2e/Dockerfile` 镜像，并将其复用于验证已构建应用的 E2E 容器冒烟运行器。这个聚合器使用加权本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会阻止重量级 live、npm-install 和多服务通道同时全部启动。默认值是 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；仅当 Docker 主机有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。运行器默认会执行 Docker 预检、移除陈旧的 OpenClaw E2E 容器、每 30 秒打印一次状态、将成功通道时长存储到 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中使用这些时长优先启动较长通道。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可只打印加权通道清单，而不构建或运行 Docker。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

live 模型 Docker 运行器还只会 bind-mount 所需的 CLI auth home（如果运行未缩小范围，则挂载所有受支持的 auth home），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就能刷新 token，而不会修改主机 auth 存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live 冒烟：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导 / 渠道 / 智能体冒烟：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装已打包的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证 doctor 会修复已激活插件的运行时依赖，并运行一次模拟的 OpenAI 智能体回合。使用 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用一个预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机构建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- Bun 全局安装冒烟：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前工作树，在隔离的 home 中通过 `bun install -g` 安装它，并验证 `openclaw infer image providers --json` 会返回内置 image 提供商，而不是挂起。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用一个预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过主机构建，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从一个已构建的 Docker 镜像复制 `dist/`。
- 安装程序 Docker 冒烟：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟默认使用 npm `latest` 作为稳定基线，然后升级到候选 tarball。非 root 安装程序检查会保留一个隔离的 npm 缓存，这样 root 拥有的缓存条目就不会掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑之间复用 root/update/direct-npm 缓存。
- Install Smoke CI 会使用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；当需要直接 `npm install -g` 覆盖时，请在本地运行该脚本且不要设置此环境变量。
- Gateway 网关网络（两个容器，WS auth + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses `web_search` 最小 reasoning 回归：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟 OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制 provider schema 拒绝，并检查原始细节是否出现在 Gateway 网关日志中。
- MCP 渠道路由桥（预置 Gateway 网关 + stdio bridge + 原始 Claude 通知帧冒烟）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile allow/deny 冒烟）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + 隔离 cron 和一次性 subagent 运行后的 stdio MCP 子进程清理）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟 + `/plugin` 别名 + Claude bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
- 插件更新未变化冒烟：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据冒烟：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用该镜像，在一次新的本地构建之后使用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过主机重建，或使用 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。完整 Docker 聚合器会先预打包一次该 tarball，然后将内置渠道检查分片到独立通道中，包括 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的独立更新通道。直接运行内置通道时，使用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 缩小渠道 matrix，或使用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 缩小更新场景。该通道还会验证 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 会抑制 doctor/运行时依赖修复。
- 在迭代时缩小内置插件运行时依赖范围，可以禁用无关场景，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

若要手动预构建并复用共享的 built-app 镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置后，诸如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 这类套件专用镜像覆盖仍会优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果镜像尚未存在于本地，脚本会拉取它。QR 和安装程序 Docker 测试保留各自的 Dockerfile，因为它们验证的是 package/install 行为，而不是共享的 built-app 运行时。

live 模型 Docker 运行器还会以只读方式 bind-mount 当前检出内容，
并将其暂存到容器内的临时工作目录中。这样既能保持运行时
镜像精简，又能让 Vitest 针对你本地的精确 source/config 运行。
暂存步骤会跳过大型仅本地缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或
Gradle 输出目录，这样 Docker live 运行就不会花费数分钟复制
与机器相关的产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关 live 探测就不会在容器内启动
真实的 Telegram/Discord 等渠道 worker。
`test:docker:live-models` 仍会运行 `pnpm test:live`，因此当你需要缩小或排除该 Docker 通道中的 Gateway 网关
live 覆盖时，也请一并传入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个
启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，
针对该 Gateway 网关启动一个固定版本的 Open WebUI 容器，通过
Open WebUI 完成登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过
Open WebUI 的 `/api/chat/completions` 代理发送一个真实聊天请求。
首次运行可能会明显更慢，因为 Docker 可能需要拉取
Open WebUI 镜像，并且 Open WebUI 可能需要完成自身的冷启动设置。
该通道要求提供一个可用的 live 模型密钥，而 `OPENCLAW_PROFILE_FILE`
（默认 `~/.profile`）是在 Docker 化运行中提供该密钥的主要方式。
成功运行会打印一小段 JSON 负载，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是有意设计为确定性的，不需要
真实的 Telegram、Discord 或 iMessage 账户。它会启动一个预置的 Gateway 网关
容器，再启动第二个容器来生成 `openclaw mcp serve`，然后
验证路由后的会话发现、转录读取、附件元数据、
live 事件队列行为、出站发送路由，以及 Claude 风格的渠道 +
权限通知，这些都通过真实的 stdio MCP bridge 完成。通知检查
会直接检查原始 stdio MCP 帧，因此该冒烟测试验证的是 bridge
实际发出的内容，而不仅仅是某个特定客户端 SDK 恰好暴露出的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要 live
模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实 stdio MCP 探测服务器，
通过嵌入式 Pi bundle
MCP 运行时实例化该服务器，执行工具，然后验证 `coding` 和 `messaging` 会保留
`bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要 live 模型
密钥。它会启动一个带有真实 stdio MCP 探测服务器的预置 Gateway 网关，运行一个
隔离的 cron 回合和一个 `/subagents spawn` 一次性子智能体回合，然后验证
MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 请保留此脚本用于回归 / 调试工作流。它未来可能还会用于 ACP 线程路由验证，因此不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前读取
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于仅验证从 `OPENCLAW_PROFILE_FILE` 读取的环境变量，使用临时配置 / 工作区目录，且不挂载外部 CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于在 Docker 内缓存 CLI 安装
- `$HOME` 下的外部 CLI auth 目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围的 provider 运行只会挂载根据 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗号列表（如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`）手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内筛选 provider
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用已有的 `openclaw:local-live` 镜像，适用于无需重建的重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而非环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关向 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

在编辑文档后运行文档检查：`pnpm check:docs`。
当你还需要检查页内标题时，运行完整的 Mintlify anchor 验证：`pnpm docs:check-links:anchors`。

## 离线回归（对 CI 安全）

这些是在没有真实提供商情况下的“真实流水线”回归：

- Gateway 网关 tool calling（模拟 OpenAI，真实 gateway + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，强制写入配置 + auth）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些对 CI 安全的测试，其行为类似“智能体可靠性评估”：

- 通过真实 Gateway 网关 + 智能体循环进行模拟 tool-calling（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

针对 Skills 仍然缺失的部分（参见 [Skills](/zh-CN/tools/skills)）：

- **决策**：当提示词中列出 Skills 时，智能体是否会选择正确的 Skills（或避开无关的 Skills）？
- **合规性**：智能体在使用前是否会读取 `SKILL.md`，并遵循所需的步骤 / 参数？
- **工作流契约**：断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 一个使用模拟提供商的场景运行器，用于断言工具调用 + 顺序、skill 文件读取以及会话接线。
- 一小组聚焦于 skill 的场景（使用 vs 避免、门控、提示词注入）。
- 只有在对 CI 安全的套件就位后，才添加可选的 live 评估（按需启用、由环境变量门控）。

## 契约测试（插件和渠道形状）

契约测试用于验证每个已注册插件和渠道都符合其
接口契约。它们会遍历所有已发现插件，并运行一组
形状和行为断言。默认的 `pnpm test` unit 通道会有意
跳过这些共享接缝和冒烟文件；当你修改共享渠道或 provider 表面时，
请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅 provider 契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基础插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息负载结构
- **inbound** - 入站消息处理
- **actions** - 渠道操作处理器
- **threading** - 线程 ID 处理
- **directory** - Directory/roster API
- **group-policy** - 群组策略执行

### Provider 状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件注册表形状

### Provider 契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选项 / 选择
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - provider 运行时
- **shape** - 插件形状 / 接口
- **wizard** - 设置向导

### 何时运行

- 在更改插件 SDK 导出或子路径之后
- 在添加或修改渠道或 provider 插件之后
- 在重构插件注册或发现逻辑之后

契约测试会在 CI 中运行，且不需要真实 API 密钥。

## 添加回归测试（指南）

当你修复一个在 live 中发现的 provider/model 问题时：

- 如果可能，添加一个对 CI 安全的回归测试（模拟 / stub provider，或捕获精确的请求形状转换）
- 如果它本质上只能在 live 中复现（速率限制、认证策略），就让 live 测试保持窄范围，并通过环境变量按需启用
- 优先定位到能捕捉该缺陷的最小层级：
  - provider 请求转换 / 重放缺陷 → 直接模型测试
  - Gateway 网关会话 / 历史 / 工具管线缺陷 → Gateway 网关 live 冒烟或对 CI 安全的 Gateway 网关 mock 测试
- SecretRef 遍历保护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言会拒绝 traversal-segment exec id。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会在遇到未分类目标 id 时有意失败，以确保新类别不会被静默跳过。

## 相关内容

- [测试 live](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)
