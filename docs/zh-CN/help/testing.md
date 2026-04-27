---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型 / 提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元 / e2e / 实时测试套件、Docker 运行器，以及各项测试的覆盖内容
title: 测试
x-i18n:
    generated_at: "2026-04-27T22:50:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5adf6c223bc489d8c9eceb5a5a5b5b2c0fb774a48f6a71f6b793361e2fd4911
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三个 Vitest 测试套件（单元 / 集成、e2e、实时），以及一小组 Docker 运行器。本文档是“我们如何测试”的指南：

- 各个测试套件覆盖什么（以及它刻意**不**覆盖什么）。
- 常见工作流（本地、推送前、调试）应运行哪些命令。
- 实时测试如何发现凭证并选择模型 / 提供商。
- 如何为真实世界中的模型 / 提供商问题添加回归测试。

<Note>
**QA 栈（qa-lab、qa-channel、实时传输通道）** 另有单独文档说明：

- [QA overview](/zh-CN/concepts/qa-e2e-automation) — 架构、命令入口、场景编写。
- [Matrix QA](/zh-CN/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的参考文档。
- [QA channel](/zh-CN/channels/qa-channel) — 仓库支持场景所使用的合成传输插件。

本页涵盖常规测试套件以及 Docker / Parallels 运行器的运行方式。下面的 QA 专用运行器部分（[QA 专用运行器](#qa-specific-runners)）列出了具体的 `qa` 调用方式，并回链到上述参考文档。
</Note>

## 快速开始

大多数时候：

- 完整门禁（预期应在推送前运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置充足的机器上更快地本地运行完整测试套件：`pnpm test:max`
- 直接进入 Vitest 监视循环：`pnpm test:watch`
- 直接指定文件现在也会路由扩展 / 渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代处理单个失败用例时，优先先跑有针对性的测试。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试，或想获得更多信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- 实时套件（模型 + Gateway 网关工具 / 图像探测）：`pnpm test:live`
- 安静地只跑一个实时测试文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker 实时模型全量扫描：`pnpm test:docker:live-models`
  - 现在每个选中的模型都会运行一次文本轮次外加一个小型文件读取式探测。
    元数据声明支持 `image` 输入的模型还会运行一个微型图像轮次。
    当你要隔离提供商故障时，可通过 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用这些额外探测。
  - CI 覆盖范围：每日的 `OpenClaw Scheduled Live And E2E Checks` 和手动触发的
    `OpenClaw Release Checks` 都会调用可复用的实时 / E2E 工作流，并设置
    `include_live_suites: true`，其中包括按提供商分片的独立 Docker 实时模型矩阵任务。
  - 若要在 CI 中有针对性地重跑，可调度 `OpenClaw Live And E2E Checks (Reusable)`
    并设置 `include_live_suites: true` 与 `live_models_only: true`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`，同时更新 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 及其定时 / 发布调用方。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 在 Codex app-server 路径上运行 Docker 实时通道，绑定一个合成 Slack 私信，使用 `/codex bind`，执行 `/codex fast` 和
    `/codex permissions`，然后验证普通回复和图像附件都通过原生插件绑定路由，而不是 ACP。
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`
  - 通过插件拥有的 Codex app-server harness 运行 Gateway 网关智能体轮次，验证 `/codex status` 和 `/codex models`，并默认执行图像、
    cron MCP、子智能体和 Guardian 探测。隔离其他 Codex
    app-server 故障时，可通过 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`
    禁用子智能体探测。若要专注于子智能体检查，请禁用其他探测：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置了 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则该流程会在子智能体探测后退出。
- Crestodian 救援命令冒烟测试：`pnpm test:live:crestodian-rescue-channel`
  - 这是消息渠道救援命令入口的可选双重保险检查。它会执行 `/crestodian status`，排队一个持久化模型变更，回复 `/crestodian yes`，并验证审计 / 配置写入路径。
- Crestodian 规划器 Docker 冒烟测试：`pnpm test:docker:crestodian-planner`
  - 在无配置容器中运行 Crestodian，并在 `PATH` 上放置假的 Claude CLI，验证模糊规划器回退会被转换为带审计记录的类型化配置写入。
- Crestodian 首次运行 Docker 冒烟测试：`pnpm test:docker:crestodian-first-run`
  - 从空的 OpenClaw 状态目录启动，将裸 `openclaw` 路由到
    Crestodian，应用设置 / 模型 / 智能体 / Discord 插件 + SecretRef 写入，验证配置，并核对审计条目。相同的 Ring 0 设置路径也在 QA Lab 中通过
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot / Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行
  `openclaw models list --provider moonshot --json`，然后对 `moonshot/kimi-k2.6` 运行一个隔离的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  。验证 JSON 报告的是 Moonshot / K2.6，并且助手转录中存储了规范化的 `usage.cost`。

<Tip>
当你只需要一个失败用例时，优先使用下面描述的允许列表环境变量来缩小实时测试范围。
</Tip>

## QA 专用运行器

当你需要 qa-lab 级别的真实环境时，这些命令与主测试套件配套使用：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，也可通过手动调度在模拟提供商模式下运行。`QA-Lab - All Lanes` 会在 `main` 上每晚运行，也可手动调度；它会并行运行模拟 parity gate、实时 Matrix 通道、Convex 托管的实时 Telegram 通道，以及 Convex 托管的实时 Discord 通道。定时 QA 和发布检查会显式传递 Matrix `--profile fast`，而 Matrix CLI 和手动工作流输入的默认值仍然是 `all`；手动调度可以将 `all` 分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 任务。`OpenClaw Release Checks` 会在发布批准前运行 parity，以及快速 Matrix 和 Telegram 通道。

- `pnpm openclaw qa suite`
  - 直接在宿主机上运行仓库支持的 QA 场景。
  - 默认会使用隔离的 Gateway 网关工作进程并行运行多个已选场景。`qa-channel` 默认并发度为 4（受已选场景数量限制）。使用 `--concurrency <count>` 调整工作进程数，或使用 `--concurrency 1` 回到较早的串行通道。
  - 任一场景失败时将以非零状态退出。若你想保留制品但不希望退出码失败，可使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个本地的 AIMock 支持提供商服务器，用于实验性的 fixture 和协议模拟覆盖，而不会替换具备场景感知能力的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中运行同一套 QA 测试。
  - 与宿主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商 / 模型选择标志。
  - 实时运行会转发对来宾环境切实可行的受支持 QA 鉴权输入：
    基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保留在仓库根目录下，这样来宾环境才能通过挂载的工作区回写。
  - 会将常规 QA 报告 + 摘要，以及 Multipass 日志写入
    `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，用于偏操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建一个 npm tarball，在 Docker 中全局安装它，运行非交互式 OpenAI API 密钥新手引导，默认配置 Telegram，验证启用插件时会按需安装运行时依赖，运行 doctor，并针对模拟的 OpenAI 端点运行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在 Discord 上运行相同的打包安装通道。
- `pnpm test:docker:session-runtime-context`
  - 为嵌入式运行时上下文转录运行一个确定性的已构建应用 Docker 冒烟测试。它会验证隐藏的 OpenClaw 运行时上下文被持久化为非显示型自定义消息，而不会泄漏到可见的用户轮次中；然后植入一个受影响的损坏会话 JSONL，并验证
    `openclaw doctor --fix` 会将其重写到当前活动分支，并保留备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个 OpenClaw 候选包，运行已安装包的新手引导，通过已安装的 CLI 配置 Telegram，然后复用实时 Telegram QA 通道，并将该已安装包作为被测 Gateway 网关。
  - 默认值为 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；设置
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可测试解析后的本地 tarball，而不是从注册表安装。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证来源。对于 CI / 发布自动化，设置
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，同时配置
    `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果在 CI 中存在
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密钥，Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅为此通道覆盖共享的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 也将该通道暴露为手动维护者工作流
    `NPM Telegram Beta E2E`。它不会在合并时运行。该工作流使用
    `qa-live-shared` 环境和 Convex CI 凭证租约。
- GitHub Actions 还提供 `Package Acceptance`，用于针对单个候选包执行旁路产品验证。它接受可信 ref、已发布的 npm 规格、HTTPS tarball URL 加 SHA-256，或来自另一个运行的 tarball 制品；随后上传规范化的 `openclaw-current.tgz` 作为 `package-under-test`，再运行现有的 Docker E2E 调度器，可选择 smoke、package、product、full 或自定义通道配置。设置 `telegram_mode=mock-openai` 或 `live-frontier`，即可让 Telegram QA 工作流针对同一个 `package-under-test` 制品运行。
  - 最新 beta 产品验证：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精确 tarball URL 验证需要摘要：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- 制品验证会从另一个 Actions 运行下载 tarball 制品：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前的 OpenClaw 构建，配置 OpenAI 后启动 Gateway 网关，然后通过编辑配置启用内置渠道 / 插件。
  - 验证设置发现流程会让未配置插件的运行时依赖保持缺失状态，首次配置后的 Gateway 网关或 doctor 运行会按需安装每个内置插件的运行时依赖，而第二次重启不会重新安装已经激活过的依赖。
  - 还会安装一个已知的旧版 npm 基线，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本在更新后的 doctor 中会修复内置渠道运行时依赖，而无需 harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 在 Parallels 来宾环境中运行原生打包安装更新冒烟测试。每个选定平台都会先安装请求的基线包，然后在同一个来宾环境中运行已安装的 `openclaw update` 命令，并验证已安装版本、更新状态、Gateway 网关就绪情况，以及一次本地智能体轮次。
  - 在只迭代单个来宾时，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 可获取摘要制品路径和各通道状态。
  - OpenAI 通道默认使用 `openai/gpt-5.5` 进行实时智能体轮次验证。若要有意验证其他 OpenAI 模型，请传入 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 将较长的本地运行包在宿主机超时中，这样 Parallels 传输卡顿就不会耗尽剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本会将嵌套通道日志写入 `/tmp/openclaw-parallels-npm-update.*`。在认定外层包装器卡住之前，请先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在冷启动来宾环境上，Windows 更新可能会在更新后的 doctor / 运行时依赖修复阶段耗费 10 到 15 分钟；只要嵌套的 npm 调试日志仍在推进，这仍属于正常状态。
  - 不要将这个聚合包装器与单独的 Parallels macOS、Windows 或 Linux 冒烟通道并行运行。它们共享 VM 状态，可能会在快照恢复、包服务或来宾 Gateway 网关状态上发生冲突。
  - 更新后的验证会运行常规的内置插件入口，因为语音、图像生成和媒体理解等能力 facade 是通过内置运行时 API 加载的，即使智能体轮次本身只检查简单的文本响应也是如此。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性 Docker 支持的 Tuwunel homeserver 运行 Matrix 实时 QA 通道。仅支持源代码检出——打包安装不包含 `qa-lab`。
  - 完整的 CLI、配置文件 / 场景目录、环境变量和制品布局：参见 [Matrix QA](/zh-CN/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的驱动机器人和 SUT 机器人令牌，针对真实私有群组运行 Telegram 实时 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是 Telegram 聊天的数字 id。
  - 支持 `--credential-source convex` 以使用共享池化凭证。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 任一场景失败时将以非零状态退出。若你想保留制品但不希望退出码失败，可使用 `--allow-failures`。
  - 需要同一私有群组中的两个不同机器人，并且 SUT 机器人需要公开一个 Telegram 用户名。
  - 为了实现稳定的机器人到机器人观测，请在 `@BotFather` 中为两个机器人启用 Bot-to-Bot Communication Mode，并确保驱动机器人可以观测群组中的机器人流量。
  - 会在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 observed-messages 制品。回复类场景会包含从驱动发送请求到观测到 SUT 回复之间的 RTT。

实时传输通道共享一套标准契约，这样新传输不会产生漂移；各通道的覆盖矩阵位于 [QA overview → Live transport coverage](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是范围更广的合成测试套件，不属于该矩阵的一部分。

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的凭证池中获取独占租约，在通道运行期间为该租约发送心跳，并在关闭时释放该租约。

参考的 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 为选定角色配置一个密钥：
  - `maintainer` 对应 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 对应 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认为 `ci`，否则默认为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选追踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许仅用于本地开发的 loopback `http://` Convex URL。

在正常运行中，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理命令（池添加 / 移除 / 列表）必须专门使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

面向维护者的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在实时运行前使用 `doctor` 来检查 Convex 站点 URL、broker 密钥、
端点前缀、HTTP 超时和管理 / 列表可达性，同时不会打印密钥值。
在脚本和 CI 工具中使用 `--json` 可获得机器可读输出。

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
- `groupId` 必须是 Telegram 聊天数字 id 的字符串。
- `admin/add` 会针对 `kind: "telegram"` 验证此结构，并拒绝格式错误的 payload。

### 向 QA 添加一个渠道

新渠道适配器的架构和场景辅助函数名称位于 [QA overview → Adding a channel](/zh-CN/concepts/qa-e2e-automation#adding-a-channel)。最低门槛是：在共享的 `qa-lab` 宿主接缝上实现传输运行器、在插件清单中声明 `qaRunners`、挂载为 `openclaw qa <runner>`，并在 `qa/scenarios/` 下编写场景。

## 测试套件（各自运行位置）

可以把这些测试套件理解为“真实性逐级增加”（同时波动性 / 成本也逐级增加）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：未指定目标的运行使用 `vitest.full-*.config.ts` 分片集合，并且可能会将多项目分片展开为按项目划分的配置，以便并行调度
- 文件：核心 / 单元清单位于 `src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts`；UI 单元测试运行在专用的 `unit-ui` 分片中
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应当快速且稳定

<AccordionGroup>
  <Accordion title="项目、分片和作用域通道">

    - 未指定目标的 `pnpm test` 会运行十二个较小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个庞大的原生根项目进程。这样可以降低繁忙机器上的峰值 RSS，并避免 auto-reply / 扩展工作拖累无关测试套件。
    - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片监视循环并不现实。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先通过作用域通道来路由显式文件 / 目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可以避免承担完整根项目启动成本。
    - `pnpm test:changed` 默认会将变更的 git 路径展开为低成本的作用域通道：直接测试编辑、同级 `*.test.ts` 文件、显式源码映射以及本地导入图依赖项。配置 / setup / 包编辑不会广泛运行测试，除非你显式使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄范围工作时的常规智能本地检查门禁。它会将差异分类为核心、核心测试、扩展、扩展测试、应用、文档、发布元数据、实时 Docker 工具和工具链，然后运行匹配的类型检查、lint 和守卫命令。它不会运行 Vitest 测试；如需测试证明，请调用 `pnpm test:changed` 或显式执行 `pnpm test <target>`。仅发布元数据的版本提升会运行有针对性的版本 / 配置 / 根依赖检查，并带有一个守卫，用于拒绝顶层版本字段之外的包变更。
    - 实时 Docker ACP harness 编辑会运行聚焦检查：实时 Docker 认证脚本的 shell 语法检查，以及实时 Docker 调度器 dry-run。只有当差异仅限于 `scripts["test:docker:live-*"]` 时才会包含 `package.json` 变更；依赖、导出、版本和其他包表面编辑仍然使用更广泛的守卫。
    - 来自智能体、commands、插件、auto-reply 辅助器、`plugin-sdk` 以及类似纯工具区域的轻导入单元测试会通过 `unit-fast` 通道路由，从而跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时较重的文件则仍保留在现有通道上。
    - 一些选定的 `plugin-sdk` 和 `commands` 辅助源码文件也会将 changed 模式运行映射到这些轻量通道中的显式同级测试，因此辅助器编辑可以避免为该目录重新运行完整的重型测试套件。
    - `auto-reply` 为顶层核心辅助器、顶层 `reply.*` 集成测试以及 `src/auto-reply/reply/**` 子树提供了专用分桶。CI 还会将 reply 子树进一步拆分为 agent-runner、dispatch 和 commands / state-routing 分片，这样某一个导入开销很大的分桶就不会拖住整个 Node 尾部运行时间。

  </Accordion>

  <Accordion title="嵌入式运行器覆盖范围">

    - 当你修改消息工具发现输入或 compaction 运行时上下文时，要同时保留这两个层级的覆盖。
    - 为纯路由和规范化边界添加聚焦的辅助器回归测试。
    - 保持嵌入式运行器集成套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些套件会验证作用域 id 和 compaction 行为仍然会流经真实的 `run.ts` / `compact.ts` 路径；仅有辅助器级测试并不足以替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置将 `isolate: false` 固定下来，并在根项目、e2e 和实时配置中使用非隔离运行器。
    - 根 UI 通道保留其 `jsdom` 设置和优化器，但也运行在共享的非隔离运行器上。
    - 每个 `pnpm test` 分片都从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。
      设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可对比原生 V8
      行为。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示某个差异会触发哪些架构通道。
    - pre-commit 钩子仅负责格式化。它会重新暂存格式化后的文件，但不会运行 lint、类型检查或测试。
    - 在交接或推送前，如果你需要智能本地检查门禁，请显式运行 `pnpm check:changed`。
    - `pnpm test:changed` 默认通过低成本的作用域通道路由。仅当智能体判断某个 harness、配置、包或契约编辑确实需要更广泛的 Vitest 覆盖时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
    - 本地 worker 自动伸缩刻意保持保守；当宿主负载平均值已经较高时，它会主动回退，因此默认情况下多个并发 Vitest 运行造成的影响会更小。
    - 基础 Vitest 配置将项目 / 配置文件标记为 `forceRerunTriggers`，这样当测试布线发生变化时，changed 模式的重跑仍然是正确的。
    - 该配置会在受支持的宿主上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接分析指定一个显式缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入拆分输出。
    - `pnpm test:perf:imports:changed` 会将相同的分析视图限定到自 `origin/main` 以来变更的文件。
    - 分片耗时数据会写入 `.artifacts/vitest-shard-timings.json`。
      整个配置运行使用配置路径作为键；include-pattern CI 分片会追加分片名称，以便单独跟踪过滤后的分片。
    - 当某个热点测试仍然把大部分时间耗在启动导入上时，应将重依赖放在狭窄的本地 `*.runtime.ts` 接缝之后，并直接 mock 该接缝，而不是为了通过 `vi.mock(...)` 传递它们就去深度导入运行时辅助器。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会针对该已提交差异，对比路由后的 `test:changed` 与原生根项目路径，并打印墙钟时间以及 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和根 Vitest 配置，将变更文件列表路由出去，从而对当前脏工作树做基准测试。
    - `pnpm test:perf:profile:main` 会为 Vitest / Vite 启动和 transform 开销写出主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为单元测试套件写出运行器 CPU + 堆 profile。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制单 worker
- 范围：
  - 默认启用诊断功能，启动一个真实的 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 Gateway 网关消息、内存和大负载抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化辅助器
  - 断言记录器保持有界、合成 RSS 采样保持在压力预算之下，并且每个会话的队列深度最终回落到零
- 预期：
  - 对 CI 安全且无须密钥
  - 这是用于稳定性回归跟进的窄范围通道，不可替代完整 Gateway 网关测试套件

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads`，并设置 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - 使用 `OPENCLAW_E2E_WORKERS=<n>` 强制设置 worker 数量（上限为 16）。
  - 使用 `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket / HTTP 表面、节点配对以及更重的网络交互
- 预期：
  - 会在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 相比单元测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在宿主机上启动一个隔离的 OpenShell Gateway 网关
  - 从一个临时本地 Dockerfile 创建沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远端规范文件系统行为
- 预期：
  - 仅限显式启用；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - 运行更广泛的 e2e 套件时，设置 `OPENCLAW_E2E_OPENSHELL=1` 启用该测试
  - 设置 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 以指向非默认 CLI 二进制或包装脚本

### 实时（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件实时测试
- 默认：由 `pnpm test:live` **启用**（会设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型在 _今天_ 搭配真实凭证是否真的可用？”
  - 捕捉提供商格式变更、工具调用怪癖、认证问题以及限流行为
- 预期：
  - 按设计并不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 优先运行收窄后的子集，而不是“全部都跑”
- 实时运行会加载 `~/.profile`，以拾取缺失的 API 密钥。
- 默认情况下，实时运行仍会隔离 `HOME`，并将配置 / 认证材料复制到一个临时测试 home 中，这样单元测试 fixture 就不会修改你真实的 `~/.openclaw`。
- 仅当你有意让实时测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认采用更安静的模式：它会保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静音 Gateway 网关引导日志 / Bonjour 噪声。如果你想恢复完整启动日志，可设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（按提供商区分）：设置 `*_API_KEYS`（逗号 / 分号格式）或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或通过 `OPENCLAW_LIVE_*_KEY` 进行按实时测试覆盖；测试会在收到限流响应时重试。
- 进度 / 心跳输出：
  - 实时套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获很安静，长时间的提供商调用也能显示仍在活动。
  - `vitest.live.config.ts` 禁用了 Vitest 控制台拦截，因此提供商 / Gateway 网关进度行会在实时运行期间立即流出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探测心跳。

## 我应该运行哪个测试套件？

使用这个决策表：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果改动较多，再加上 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：再加上 `pnpm test:e2e`
- 调试“我的机器人挂了” / 提供商特定故障 / 工具调用：运行收窄后的 `pnpm test:live`

## 实时（触网）测试

关于实时模型矩阵、CLI 后端冒烟测试、ACP 冒烟测试、Codex app-server
harness，以及所有媒体提供商实时测试（Deepgram、BytePlus（国际版）、ComfyUI、图像、
音乐、视频、媒体 harness）——以及实时运行的凭证处理——请参见
[Testing — live suites](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- 实时模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像内运行与其匹配的 profile-key 实时文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），挂载你的本地配置目录和工作区（如果已挂载，也会加载 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 实时运行器默认采用较小的冒烟上限，以便完整的 Docker 扫描保持可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确希望进行更大范围的穷举扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次实时 Docker 镜像，再通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包一次为 npm tarball，然后构建 / 复用两个 `scripts/e2e/Dockerfile` 镜像。裸镜像仅包含用于安装 / 更新 / 插件依赖通道的 Node / Git 运行器；这些通道会挂载预构建的 tarball。功能镜像则将同一个 tarball 安装到 `/app` 中，用于已构建应用的功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 负责执行选定计划。这个聚合运行器使用带权重的本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会阻止高负载的实时、npm 安装和多服务通道同时全部启动。如果某个单独通道比当前启用的上限还重，调度器仍然会在池为空时启动它，然后在容量再次可用之前让它单独运行。默认值是 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有当 Docker 宿主有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。该运行器默认执行 Docker 预检、移除陈旧的 OpenClaw E2E 容器、每 30 秒打印一次状态、将成功通道的耗时存入 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中利用这些耗时优先启动较长的通道。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可以只打印带权重的通道清单而不构建或运行 Docker，或者使用 `node scripts/test-docker-all.mjs --plan-json` 打印所选通道、包 / 镜像需求和凭证的 CI 计划。
- `Package Acceptance` 是 GitHub 原生的包门禁，用于回答“这个可安装的 tarball 作为产品是否可用？”这个问题。它会从 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 中解析出一个候选包，将其作为 `package-under-test` 上传，然后针对这个精确 tarball 运行可复用的 Docker E2E 通道，而不是重新打包所选 ref。`workflow_ref` 选择可信的工作流 / harness 脚本，而 `package_ref` 在 `source=ref` 时选择要打包的源提交 / 分支 / 标签；这样当前的 acceptance 逻辑就能验证较早但可信的提交。各个配置文件按覆盖广度排序：`smoke` 是快速的安装 / 渠道 / 智能体加 Gateway 网关 / 配置检查，`package` 覆盖包 / 更新 / 插件契约，并且是大多数 Parallels 包 / 更新覆盖的默认原生替代方案，`product` 会加入 MCP 渠道、cron / 子智能体清理、OpenAI Web 搜索和 OpenWebUI，而 `full` 会运行带 OpenWebUI 的发布路径 Docker 分块。发布验证会运行自定义的 package delta（`bundled-channel-deps-compat plugins-offline`）加 Telegram package QA，因为发布路径 Docker 分块已经覆盖了重叠的包 / 更新 / 插件通道。根据制品生成的定向 GitHub Docker 重跑命令，在可用时会包含先前的包制品和已准备好的镜像输入，因此失败通道可以避免重新构建包和镜像。
- 构建和发布检查会在 tsdown 之后运行 `scripts/check-cli-bootstrap-imports.mjs`。该守卫会从 `dist/entry.js` 和 `dist/cli/run-main.js` 遍历静态构建图，并在命令分发之前的启动导入阶段，如果发现导入了 Commander、提示 UI、undici 或日志记录等包依赖，就会失败。打包后的 CLI 冒烟测试还覆盖根 help、onboard help、doctor help、status、config schema 和 model-list 命令。
- `Package Acceptance` 旧版兼容性上限为 `2026.4.25`（包含 `2026.4.25-beta.*`）。在这个截止点之前，harness 仅容忍已发布包中的元数据缺口：省略的私有 QA 清单条目、缺失的 `gateway install --wrapper`、从 tarball 派生的 git fixture 中缺失的补丁文件、缺失的持久化 `update.channel`、旧版插件 install-record 位置、缺失的 marketplace install-record 持久化，以及在 `plugins update` 期间发生的配置元数据迁移。对于 `2026.4.25` 之后的包，这些路径都会被视为严格失败。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

实时模型 Docker 运行器还会只绑定挂载所需的 CLI 认证 home 目录（如果运行未收窄，则挂载所有受支持的目录），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就可以刷新令牌，而不会修改宿主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，通过 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 提供严格的 Droid / OpenCode 覆盖）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + 开发智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性冒烟测试：`pnpm qa:otel:smoke` 是一个私有 QA 源代码检出通道。它有意不属于 package Docker 发布通道的一部分，因为 npm tarball 不包含 QA Lab。
- Open WebUI 实时冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY、完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导 / 渠道 / 智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包后的 OpenClaw tarball，默认通过 env-ref 新手引导配置 OpenAI 并配置 Telegram，验证 doctor 会修复已激活插件的运行时依赖，并运行一次模拟的 OpenAI 智能体轮次。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 可复用预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 可跳过宿主机构建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- 更新渠道切换冒烟测试：`pnpm test:docker:update-channel-switch` 会在 Docker 中全局安装打包后的 OpenClaw tarball，从 package `stable` 切换到 git `dev`，验证持久化渠道和插件在更新后仍然可用，然后再切回 package `stable` 并检查更新状态。
- 会话运行时上下文冒烟测试：`pnpm test:docker:session-runtime-context` 会验证隐藏运行时上下文转录的持久化，以及 doctor 对受影响的重复 prompt-rewrite 分支的修复。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前工作树，在隔离的 home 中使用 `bun install -g` 安装它，并验证 `openclaw infer image providers --json` 返回的是内置图像提供商，而不是卡住。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 可复用预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 可跳过宿主机构建，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像中复制 `dist/`。
- 安装器 Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认使用 npm `latest` 作为稳定基线，然后升级到候选 tarball。在本地可用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或在 GitHub 上通过 Install Smoke 工作流的 `update_baseline_version` 输入覆盖。非 root 安装器检查会保留独立的 npm 缓存，这样 root 拥有的缓存条目就不会掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑之间复用 root / update / direct-npm 缓存。
- Install Smoke CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；如果需要直接 `npm install -g` 覆盖，请在本地运行该脚本时不要设置这个环境变量。
- Agents 删除共享工作区 CLI 冒烟测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认构建根 Dockerfile 镜像，在隔离的容器 home 中植入两个共享同一工作区的智能体，运行 `agents delete --json`，并验证 JSON 合法且共享工作区保留行为正确。可使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关网络（两个容器、WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照冒烟测试：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）会构建源码 E2E 镜像加一个 Chromium 层，使用原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP 角色快照覆盖链接 URL、游标提升的可点击元素、iframe 引用和 frame 元数据。
- OpenAI Responses `web_search` 最小推理回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟的 OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制提供商 schema 拒绝，并检查原始细节出现在 Gateway 网关日志中。
- MCP 渠道 bridge（植入的 Gateway 网关 + stdio bridge + 原始 Claude 通知帧冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile allow / deny 冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron / 子智能体 MCP 清理（真实 Gateway 网关 + 在隔离 cron 和一次性子智能体运行后清理 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟测试、ClawHub 安装 / 卸载、marketplace 更新，以及 Claude bundle 启用 / 检查）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳过实时 ClawHub 部分，或使用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认包。
- 插件更新未变化冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在宿主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。可使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，在完成一次新的本地构建后使用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过宿主机构建，或使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。完整的 Docker 聚合运行器和发布路径内置渠道分块会先统一预打包这个 tarball，然后将内置渠道检查分片为独立通道，其中包括针对 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的独立更新通道。发布分块会将渠道冒烟测试、更新目标和设置 / 运行时契约拆分为 `bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`；聚合的 `bundled-channels` 分块仍可用于手动重跑。发布工作流还会拆分提供商安装器分块和内置插件安装 / 卸载分块；旧版的 `package-update`、`plugins-runtime` 和 `plugins-integrations` 分块仍保留为手动重跑时的聚合别名。直接运行内置通道时，可使用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 缩小渠道矩阵，或使用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 缩小更新场景。该通道还会验证 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 会抑制 doctor / 运行时依赖修复。
- 迭代时若要缩小内置插件运行时依赖范围，可禁用无关场景，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

如需手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

诸如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 之类的套件专用镜像覆盖项在设置时仍然优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果它尚未存在于本地，这些脚本会先拉取它。QR 和安装器 Docker 测试保留各自的 Dockerfile，因为它们验证的是包 / 安装行为，而不是共享的已构建应用运行时。

实时模型 Docker 运行器还会以只读方式绑定挂载当前检出内容，并将其暂存到容器内的临时工作目录中。这样既能让运行时镜像保持精简，又能让 Vitest 针对你精确的本地源码 / 配置运行。暂存步骤会跳过大型的本地专用缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或 Gradle 输出目录，因此 Docker 实时运行不会花费数分钟去复制机器专属制品。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关实时探测就不会在容器内启动真实的 Telegram / Discord / 等渠道工作进程。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要缩小或排除该 Docker 通道中的 Gateway 网关实时覆盖时，也要透传 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，再针对该 Gateway 网关启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 登录，验证 `/api/models` 暴露 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一个真实聊天请求。
首次运行可能会明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI 也可能需要完成自己的冷启动设置。
这个通道需要一个可用的实时模型密钥，而 `OPENCLAW_PROFILE_FILE`
（默认为 `~/.profile`）是在 Docker 化运行中提供该密钥的主要方式。
成功运行会打印一个小型 JSON 负载，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 刻意保持确定性，不需要真实的 Telegram、Discord 或 iMessage 账号。它会启动一个植入好的 Gateway 网关容器，再启动第二个容器来拉起 `openclaw mcp serve`，然后验证路由会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio MCP bridge 发送的 Claude 风格渠道 + 权限通知。通知检查会直接检查原始 stdio MCP 帧，因此该冒烟测试验证的是 bridge 实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露出来的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要实时模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实的 stdio MCP 探测服务器，通过嵌入式 Pi bundle MCP 运行时实例化该服务器，执行工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会过滤掉它们。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要实时模型密钥。它会启动一个带有真实 stdio MCP 探测服务器的植入式 Gateway 网关，运行一次隔离的 cron 轮次和一次 `/subagents spawn` 一次性子进程轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留这个脚本用于回归 / 调试工作流。将来它可能还需要用于 ACP 线程路由验证，因此不要删除它。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前加载
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于仅验证从 `OPENCLAW_PROFILE_FILE` 加载的环境变量，使用临时配置 / 工作区目录，并且不挂载外部 CLI 认证目录
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内缓存的 CLI 安装
- `$HOME` 下的外部 CLI 认证目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 收窄后的提供商运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗号列表（如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`）手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于收窄运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内筛选提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用现有的 `openclaw:local-live` 镜像，以便在不需要重建时重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

在修改文档后运行文档检查：`pnpm check:docs`。
当你还需要检查页内标题时，运行完整的 Mintlify 锚点校验：`pnpm docs:check-links:anchors`。

## 离线回归测试（对 CI 安全）

这些是在没有真实提供商的情况下运行的“真实流水线”回归测试：

- Gateway 网关工具调用（模拟 OpenAI、真实 Gateway 网关 + Agent loop）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start` / `wizard.next`，强制写入配置 + 认证）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些对 CI 安全的测试，它们的行为类似“智能体可靠性评估”：

- 通过真实 Gateway 网关 + Agent loop 的模拟工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话布线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

Skills 方面仍然缺少的内容（参见 [Skills](/zh-CN/tools/skills)）：

- **决策**：当提示词中列出 Skills 时，智能体是否会选择正确的 Skills（或避免选择无关的 Skills）？
- **合规性**：智能体是否会在使用前读取 `SKILL.md` 并遵循所需步骤 / 参数？
- **工作流契约**：断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来的评估应当优先保持确定性：

- 一个使用模拟提供商的场景运行器，用于断言工具调用 + 顺序、技能文件读取和会话布线。
- 一小组以 Skills 为重点的场景（使用 vs 避免、门控、提示注入）。
- 仅在对 CI 安全的套件就绪之后，才添加可选的实时评估（显式启用、由环境变量控制）。

## 契约测试（插件和渠道形状）

契约测试会验证每个已注册的插件和渠道都符合其接口契约。它们会遍历所有已发现的插件，并运行一组形状和行为断言。默认的 `pnpm test` 单元测试通道会有意跳过这些共享接缝和冒烟测试文件；当你修改共享渠道或提供商表面时，请显式运行契约命令。

### 命令

- 所有契约测试：`pnpm test:contracts`
- 仅渠道契约测试：`pnpm test:contracts:channels`
- 仅提供商契约测试：`pnpm test:contracts:plugins`

### 渠道契约测试

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基础插件形状（id、名称、能力）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息负载结构
- **inbound** - 入站消息处理
- **actions** - 渠道动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略执行

### 提供商 Status 契约测试

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道 Status 探测
- **registry** - 插件注册表形状

### 提供商契约测试

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证方式 / 选择
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状 / 接口
- **wizard** - 设置向导

### 何时运行

- 在更改 plugin-sdk 导出或子路径之后
- 在添加或修改渠道或提供商插件之后
- 在重构插件注册或发现逻辑之后

契约测试会在 CI 中运行，并且不需要真实 API 密钥。

## 添加回归测试（指南）

当你修复一个在实时环境中发现的提供商 / 模型问题时：

- 如果可能，添加一个对 CI 安全的回归测试（模拟 / stub 提供商，或捕获精确的请求形状转换）
- 如果它本质上只能在实时环境中复现（限流、认证策略），则让该实时测试保持收窄，并通过环境变量显式启用
- 优先定位到能捕捉该缺陷的最小层级：
  - 提供商请求转换 / 重放缺陷 → 直接模型测试
  - Gateway 网关会话 / 历史 / 工具流水线缺陷 → Gateway 网关实时冒烟测试或对 CI 安全的 Gateway 网关模拟测试
- SecretRef 遍历防护：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言遍历段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加了新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会有意在未分类目标 id 上失败，这样新类别就不会被悄悄跳过。

## 相关内容

- [Testing live](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)
