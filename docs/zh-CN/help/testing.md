---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型 / 提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元 / e2e / live 测试套件、Docker 运行器，以及每类测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-27T03:28:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c9975b9c7a6fa53d402219c9b8eb3855b0ed76c8599a35f209deeb700e43b11
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三个 Vitest 测试套件（单元 / 集成、e2e、live）以及一小组 Docker 运行器。本文档是一份“我们如何测试”的指南：

- 每个套件覆盖什么（以及刻意 _不_ 覆盖什么）。
- 常见工作流应运行哪些命令（本地、推送前、调试）。
- live 测试如何发现凭证并选择模型 / 提供商。
- 如何为真实世界中的模型 / 提供商问题添加回归测试。

## 快速开始

大多数时候：

- 完整门禁（预期在 push 前执行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置充足的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接进入 Vitest 监听循环：`pnpm test:watch`
- 现在直接按文件定位也会路由扩展 / 渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你正在迭代单个失败用例时，优先先跑有针对性的测试。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA 测试通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你改动了测试，或想获得更多信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- live 套件（模型 + Gateway 网关工具 / 图像探测）：`pnpm test:live`
- 安静地只跑一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 每个被选中的模型现在都会运行一次文本轮次和一次小型文件读取式探测。元数据声明支持 `image` 输入的模型还会运行一个微型图像轮次。排查提供商故障时，可使用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 关闭额外探测。
  - CI 覆盖：每日的 `OpenClaw Scheduled Live And E2E Checks` 和手动触发的 `OpenClaw Release Checks` 都会调用可复用的 live / E2E 工作流，并设置 `include_live_suites: true`，其中包含按提供商分片的独立 Docker live 模型矩阵作业。
  - 如需有针对性的 CI 重跑，可分发 `OpenClaw Live And E2E Checks (Reusable)` 并设置 `include_live_suites: true` 与 `live_models_only: true`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`、`.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 及其定时 / 发布调用方中。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 对 Codex app-server 路径运行一个 Docker live 测试通道，绑定一个合成的 Slack 私信并执行 `/codex bind`，测试 `/codex fast` 和 `/codex permissions`，然后验证普通回复和图像附件是通过原生插件绑定路由，而不是通过 ACP。
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`
  - 通过插件拥有的 Codex app-server harness 运行 Gateway 网关智能体轮次，验证 `/codex status` 和 `/codex models`，并且默认会测试图像、cron MCP、子智能体和 Guardian 探测。排查其他 Codex app-server 故障时，可使用 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 关闭子智能体探测。如需专门检查子智能体，请关闭其他探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置了 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则该命令会在子智能体探测后退出。
- Crestodian 救援命令冒烟测试：`pnpm test:live:crestodian-rescue-channel`
  - 针对消息渠道救援命令表面的可选多重保险检查。它会执行 `/crestodian status`，排队一个持久模型变更，回复 `/crestodian yes`，并验证审计 / 配置写入路径。
- Crestodian 规划器 Docker 冒烟测试：`pnpm test:docker:crestodian-planner`
  - 在没有配置的容器中运行 Crestodian，容器的 `PATH` 中带有假的 Claude CLI，并验证模糊规划器回退能转换为带审计的类型化配置写入。
- Crestodian 首次运行 Docker 冒烟测试：`pnpm test:docker:crestodian-first-run`
  - 从空的 OpenClaw 状态目录启动，将裸 `openclaw` 路由到 Crestodian，应用 setup / model / agent / Discord 插件 + SecretRef 写入，验证配置，并验证审计条目。相同的 Ring 0 设置路径也在 QA Lab 中通过 `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot / Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行独立命令 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  。验证 JSON 报告了 Moonshot / K2.6，并且助手转录中存储了规范化后的 `usage.cost`。

提示：当你只需要一个失败用例时，优先使用下文描述的允许列表环境变量来缩小 live 测试范围。

## QA 专用运行器

当你需要 QA-lab 的真实环境时，这些命令与主测试套件配合使用：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，也可以通过手动分发使用 mock 提供商运行。`QA-Lab - All Lanes` 每晚在 `main` 上运行，也可以手动分发，以 mock parity gate、live Matrix 测试通道和由 Convex 管理的 live Telegram 测试通道作为并行作业运行。`OpenClaw Release Checks` 会在发布批准前运行相同的测试通道。

- `pnpm openclaw qa suite`
  - 直接在宿主机上运行基于仓库的 QA 场景。
  - 默认会并行运行多个选定场景，并使用隔离的 Gateway 网关工作进程。`qa-channel` 默认并发数为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整工作进程数量，或使用 `--concurrency 1` 启用旧的串行测试通道。
  - 任一场景失败时会以非零状态退出。如果你想保留产物而不返回失败退出码，请使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 会启动一个本地的 AIMock 支持提供商服务器，用于实验性的 fixture 和协议 mock 覆盖，而不会替代具备场景感知能力的 `mock-openai` 测试通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 Multipass Linux VM 中运行相同的 QA 套件。
  - 与宿主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商 / 模型选择参数。
  - live 运行会转发适合来宾环境的受支持 QA 认证输入：基于环境变量的提供商密钥、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保留在仓库根目录下，这样来宾环境才能通过挂载的工作区回写数据。
  - 会将常规 QA 报告 + 摘要，以及 Multipass 日志写入 `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，用于偏运营者风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前 checkout 构建一个 npm tarball，在 Docker 中全局安装，运行非交互式 OpenAI API key 新手引导，默认配置 Telegram，验证启用插件时会按需安装运行时依赖，运行 doctor，并针对一个 mock OpenAI 端点运行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在 Discord 上运行相同的打包安装测试通道。
- `pnpm test:docker:session-runtime-context`
  - 运行一个用于嵌入式运行时上下文转录的确定性 built-app Docker 冒烟测试。它会验证隐藏的 OpenClaw 运行时上下文被保存为非展示型自定义消息，而不是泄漏到可见的用户轮次中；随后注入一个受影响的损坏会话 JSONL，并验证 `openclaw doctor --fix` 会将其重写到当前活动分支并生成备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个已发布的 OpenClaw 包，运行已安装包的新手引导，通过已安装的 CLI 配置 Telegram，然后将该已安装包作为被测 Gateway 网关复用 live Telegram QA 测试通道。
  - 默认值为 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证源。对于 CI / 发布自动化，请设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，并提供 `OPENCLAW_QA_CONVEX_SITE_URL` 与角色密钥。如果在 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密钥，Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅为该测试通道覆盖共享的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 也将该测试通道暴露为手动维护者工作流 `NPM Telegram Beta E2E`。它不会在合并时运行。该工作流使用 `qa-live-shared` 环境和 Convex CI 凭证租约。
- GitHub Actions 还提供 `Package Acceptance`，用于针对单个候选包进行附带运行的产品证明。它接受受信任的 ref、已发布的 npm spec、带 SHA-256 的 HTTPS tarball URL，或来自另一个运行的 tarball artifact，上传规范化后的 `openclaw-current.tgz` 作为 `package-under-test`，然后使用 smoke、package、product、full 或 custom 测试通道配置运行现有的 Docker E2E 调度器。已发布的 npm 候选包还可以额外运行 Telegram QA 工作流。
  - 最新 beta 产品证明：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

- 精确 tarball URL 证明需要摘要值：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- artifact 证明会从另一个 Actions 运行下载一个 tarball artifact：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，启动已配置 OpenAI 的 Gateway 网关，然后通过配置编辑启用内置的渠道 / 插件。
  - 验证 setup 发现流程会让未配置的插件运行时依赖保持缺失状态；第一个已配置的 Gateway 网关或 doctor 运行会按需安装每个内置插件的运行时依赖；第二次重启不会重新安装已经激活的依赖。
  - 还会安装一个已知的较旧 npm 基线，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本的更新后 doctor 会修复内置渠道运行时依赖，而不需要 harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 在 Parallels 来宾环境中运行原生打包安装更新冒烟测试。每个被选中的平台都会先安装所请求的基线包，然后在同一个来宾环境中运行已安装的 `openclaw update` 命令，并验证安装版本、更新状态、Gateway 网关就绪状态，以及一次本地智能体轮次。
  - 在迭代单个来宾环境时，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要 artifact 路径和每个测试通道的状态。
  - OpenAI 测试通道默认使用 `openai/gpt-5.5` 作为 live 智能体轮次证明。若有意验证其他 OpenAI 模型，请传入 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 将长时间的本地运行包裹在宿主机超时控制中，这样 Parallels 传输停滞就不会耗尽其余测试时间窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本会将嵌套测试通道日志写入 `/tmp/openclaw-parallels-npm-update.*` 下。
  在认定外层包装器卡住之前，先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - Windows 更新在冷启动来宾环境中，可能会在更新后的 doctor / 运行时依赖修复阶段花费 10 到 15 分钟；只要嵌套的 npm 调试日志仍在推进，这仍然是健康状态。
  - 不要将这个聚合包装器与单独的 Parallels macOS、Windows 或 Linux 冒烟测试通道并行运行。它们共享 VM 状态，可能会在快照恢复、包服务或来宾 Gateway 网关状态上发生冲突。
  - 更新后证明会运行常规的内置插件表面，因为像语音、图像生成和媒体理解这样的能力门面，即使智能体轮次本身只检查一个简单的文本响应，也会通过内置运行时 API 加载。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的 Docker 支持 Tuwunel homeserver 运行 Matrix live QA 测试通道。
  - 这个 QA 宿主当前仅供仓库 / 开发环境使用。已打包的 OpenClaw 安装不包含 `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库 checkout 会直接加载内置运行器；不需要单独的插件安装步骤。
  - 会预配三个临时 Matrix 用户（`driver`、`sut`、`observer`）和一个私有房间，然后启动一个以真实 Matrix 插件作为 SUT 传输层的 QA Gateway 网关子进程。
  - 默认使用固定的稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。当你需要测试其他镜像时，可通过 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭证源标志，因为该测试通道会在本地预配一次性用户。
  - 会将 Matrix QA 报告、摘要、observed-events artifact 和合并后的 stdout / stderr 输出日志写入 `.artifacts/qa-e2e/...`。
  - 默认会输出进度，并通过 `OPENCLAW_QA_MATRIX_TIMEOUT_MS` 强制执行硬运行超时（默认 30 分钟）。清理阶段受 `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 限制；如果失败，输出中会包含用于恢复的 `docker compose ... down --remove-orphans` 命令。
- `pnpm openclaw qa telegram`
  - 使用来自环境变量的 driver 和 SUT 机器人令牌，针对真实私有群组运行 Telegram live QA 测试通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是 Telegram chat 的数字 id。
  - 支持 `--credential-source convex` 以使用共享池化凭证。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 任一场景失败时会以非零状态退出。如果你想保留产物而不返回失败退出码，请使用 `--allow-failures`。
  - 需要同一个私有群组中的两个不同机器人，并且 SUT 机器人必须公开 Telegram 用户名。
  - 为了实现稳定的机器人到机器人观察，请在 `@BotFather` 中为两个机器人启用 Bot-to-Bot Communication Mode，并确保 driver 机器人可以观察群组中的机器人流量。
  - 会将 Telegram QA 报告、摘要和 observed-messages artifact 写入 `.artifacts/qa-e2e/...`。回复场景会包含从 driver 发送请求到观察到 SUT 回复之间的 RTT。

live 传输测试通道共享一个标准契约，这样新传输层就不会发生漂移：

`qa-channel` 仍然是广泛的合成 QA 套件，不属于 live 传输覆盖矩阵的一部分。

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从一个 Convex 支持的池中获取独占租约，在测试通道运行期间对该租约发送心跳，并在关闭时释放租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 为所选角色提供的一个密钥：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 对应 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 对应 `ci`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认是 `ci`，否则为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选的追踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许仅用于本地开发的 loopback `http://` Convex URL。

正常运行时，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理员命令（池添加 / 删除 / 列表）必须专门使用
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

面向维护者的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在 live 运行前使用 `doctor`，检查 Convex 站点 URL、broker 密钥、
endpoint prefix、HTTP 超时以及 admin / list 可达性，而不会打印密钥值。在脚本和 CI 工具中使用 `--json` 可获得机器可读输出。

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
- `POST /admin/add`（仅维护者密钥）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅维护者密钥）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅维护者密钥）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 类型的载荷结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是 Telegram chat 的数字 id 字符串。
- `admin/add` 会对 `kind: "telegram"` 验证该结构，并拒绝格式错误的载荷。

### 向 QA 添加一个渠道

向 Markdown QA 系统添加一个渠道，严格来说只需要两样东西：

1. 该渠道的传输适配器。
2. 一个用于测试该渠道契约的场景包。

如果共享的 `qa-lab` 宿主可以承载流程，就不要新增顶级 QA 命令根。

`qa-lab` 负责共享宿主机制：

- `openclaw qa` 命令根
- 套件启动和拆除
- 工作进程并发
- artifact 写入
- 报告生成
- 场景执行
- 对旧版 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- `openclaw qa <runner>` 如何挂载到共享 `qa` 根下
- 如何为该传输层配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露转录和规范化后的传输状态
- 如何执行传输层支持的操作
- 如何处理传输层专属的重置或清理

新渠道的最低采用门槛是：

1. 保持 `qa-lab` 作为共享 `qa` 根的拥有者。
2. 在共享的 `qa-lab` 宿主接缝上实现传输运行器。
3. 将传输层专属机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个相互竞争的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 轻量；延迟 CLI 和运行器执行应保留在单独的入口点之后。
5. 在按主题划分的 `qa/scenarios/` 目录下编写或改造 Markdown 场景。
6. 为新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意迁移，否则保持现有兼容别名继续可用。

决策规则很严格：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就把它放进 `qa-lab`。
- 如果某个行为依赖单一渠道传输层，就把它保留在该运行器插件或插件 harness 中。
- 如果某个场景需要一个多个渠道都可用的新能力，就添加一个通用辅助函数，而不是在 `suite.ts` 中加入渠道专用分支。
- 如果某个行为只对一种传输层有意义，就让该场景保持传输层专用，并在场景契约中明确说明。

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

新的渠道工作应使用通用辅助函数名称。
兼容别名的存在是为了避免一次性强制迁移，而不是作为新场景编写的范式。

## 测试套件（哪些内容在哪里运行）

可以把这些套件理解为“真实度逐步提升”（同时不稳定性 / 成本也逐步增加）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：未定向运行使用 `vitest.full-*.config.ts` 分片集合，并可能将多项目分片展开为按项目划分的配置，以便并行调度
- 文件：核心 / 单元清单位于 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts`，以及由 `vitest.unit.config.ts` 覆盖的白名单 `ui` Node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定

<AccordionGroup>
  <Accordion title="项目、分片和作用域测试通道">

    - 未定向的 `pnpm test` 会运行 12 个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个庞大的原生根项目进程。这样可以降低高负载机器上的峰值 RSS，并避免 auto-reply / 扩展工作拖慢无关套件。
    - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片监听循环并不现实。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 现在会优先通过作用域测试通道路由显式文件 / 目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不需要承担完整根项目启动开销。
    - `pnpm test:changed` 默认会将 git 变更路径展开为廉价的作用域测试通道：直接测试编辑、同级 `*.test.ts` 文件、显式源码映射，以及本地导入图依赖项。配置 / setup / package 编辑不会广泛运行测试，除非你显式使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是针对小范围工作常规使用的智能本地检查门禁。它会将 diff 分类为 core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling 和 tooling，然后运行匹配的类型检查、lint 和守卫命令。它不会运行 Vitest 测试；测试证明请调用 `pnpm test:changed` 或显式 `pnpm test <target>`。仅包含发布元数据的版本提升会运行有针对性的版本 / 配置 / 根依赖检查，并带有一个守卫，用于拒绝顶级 version 字段之外的 package 变更。
    - live Docker ACP harness 编辑会运行聚焦检查：对 live Docker 认证脚本进行 shell 语法检查，以及执行 live Docker 调度器 dry-run。只有在 diff 仅限于 `scripts["test:docker:live-*"]` 时才包含 `package.json` 变更；依赖、导出、版本以及其他 package 表面编辑仍然使用更广泛的守卫。
    - 来自 agents、commands、plugins、auto-reply 辅助函数、`plugin-sdk` 以及类似纯工具区域的轻导入单元测试，会路由到 `unit-fast` 测试通道，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时较重的文件仍保留在现有测试通道上。
    - 部分选定的 `plugin-sdk` 和 `commands` 辅助源码文件也会在 changed 模式运行中映射到这些轻量测试通道中的显式同级测试，因此辅助函数编辑可以避免为该目录重新运行整个重型套件。
    - `auto-reply` 为顶级 core 辅助函数、顶级 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树提供了专用分桶。CI 还会将 reply 子树进一步拆分为 agent-runner、dispatch 和 commands / state-routing 分片，这样某个导入较重的分桶就不会占据整个 Node 尾部时间。

  </Accordion>

  <Accordion title="嵌入式运行器覆盖">

    - 当你更改消息工具发现输入或压缩运行时上下文时，请同时保持两个层级的覆盖。
    - 为纯路由和规范化边界添加聚焦的辅助函数回归测试。
    - 保持嵌入式运行器集成套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些套件会验证作用域 id 和压缩行为仍然会流经真实的 `run.ts` / `compact.ts` 路径；仅有辅助函数测试不足以替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置固定 `isolate: false`，并在根项目、e2e 和 live 配置中使用非隔离运行器。
    - 根 UI 测试通道保留其 `jsdom` setup 和 optimizer，但也运行在共享的非隔离运行器上。
    - 每个 `pnpm test` 分片都从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与原生 V8 行为进行对比。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示某个 diff 会触发哪些架构测试通道。
    - pre-commit hook 只负责格式化。它会重新暂存已格式化文件，不会运行 lint、类型检查或测试。
    - 当你需要智能本地检查门禁时，请在交接或 push 前显式运行 `pnpm check:changed`。
    - `pnpm test:changed` 默认通过廉价的作用域测试通道路由。仅当智能体判断 harness、配置、package 或契约编辑确实需要更广泛的 Vitest 覆盖时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的工作进程上限。
    - 本地工作进程自动扩缩容有意保持保守；当宿主机负载平均值已经较高时会主动回退，因此默认情况下多个并发 Vitest 运行造成的破坏会更小。
    - 基础 Vitest 配置会将项目 / 配置文件标记为 `forceRerunTriggers`，从而在测试接线变更时，changed 模式重跑仍然保持正确。
    - 在受支持的宿主机上，该配置会保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你希望为直接性能分析指定一个明确的缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入拆解输出。
    - `pnpm test:perf:imports:changed` 会将同样的分析视图限定到自 `origin/main` 以来发生变更的文件。
    - 分片计时数据会写入 `.artifacts/vitest-shard-timings.json`。
      整体配置运行以配置路径作为键；include-pattern CI 分片会追加分片名称，以便单独跟踪过滤后的分片。
    - 当某个热点测试的大部分时间仍消耗在启动导入上时，请将重型依赖放在狭窄的本地 `*.runtime.ts` 接缝之后，并直接 mock 该接缝，而不是为了通过 `vi.mock(...)` 传递它们就深度导入运行时辅助函数。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会针对该已提交 diff，对路由后的 `test:changed` 与原生根项目路径进行比较，并输出 wall time 以及 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和根 Vitest 配置，对当前有未提交更改的工作树进行基准测试。
    - `pnpm test:perf:profile:main` 会为 Vitest / Vite 启动和 transform 开销写入主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在关闭文件并行的情况下，为单元测试套件写入 runner CPU + heap profiles。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制使用单个工作进程
- 范围：
  - 启动一个默认启用诊断的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 Gateway 网关消息、内存和大载荷抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化辅助函数
  - 断言记录器保持有界，合成 RSS 样本保持在压力预算之下，并且每个会话的队列深度会回落到零
- 预期：
  - 对 CI 安全且不需要密钥
  - 这是一个用于稳定性回归跟进的窄测试通道，不是完整 Gateway 网关套件的替代品

### E2E（Gateway 网关冒烟测试）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 并设置 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应工作进程（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以降低控制台 I/O 开销。
- 常用覆盖项：
  - 使用 `OPENCLAW_E2E_WORKERS=<n>` 强制指定工作进程数量（上限为 16）。
  - 使用 `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket / HTTP 表面、节点配对和更重的网络交互
- 预期：
  - 会在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比单元测试包含更多可变部分（可能更慢）

### E2E：OpenShell 后端冒烟测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在宿主机上启动一个隔离的 OpenShell Gateway 网关
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 测试 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远端规范文件系统行为
- 预期：
  - 仅按需启用；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - 运行更广泛 e2e 套件时，设置 `OPENCLAW_E2E_OPENSHELL=1` 以启用该测试
  - 设置 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`，指向非默认 CLI 二进制或包装脚本

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认值：由 `pnpm test:live` **启用**（会设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型 _今天_ 在真实凭证下是否真的可用？”
  - 捕获提供商格式变化、工具调用怪癖、认证问题和限流行为
- 预期：
  - 按设计来说不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗限流额度
  - 优先运行缩小范围的子集，而不是“全部”
- live 运行会 source `~/.profile` 以获取缺失的 API key。
- 默认情况下，live 运行仍然会隔离 `HOME`，并将配置 / 认证材料复制到临时测试 home 中，以便单元测试 fixture 不会修改你真实的 `~/.openclaw`。
- 仅当你有意让 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：它会保留 `[live] ...` 进度输出，但会隐藏额外的 `~/.profile` 提示，并静音 Gateway 网关启动日志 / Bonjour 杂音。若要恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（按提供商区分）：设置逗号 / 分号格式的 `*_API_KEYS`，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可通过 `OPENCLAW_LIVE_*_KEY` 为单次 live 运行覆盖；测试会在收到限流响应时重试。
- 进度 / 心跳输出：
  - live 套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获处于安静模式，长时间提供商调用也能显示为仍在活动。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此在 live 运行期间，提供商 / Gateway 网关进度行会立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探测心跳。

## 我应该运行哪个套件？

使用这张决策表：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果你改动很多，再加上 `pnpm test:coverage`）
- 涉及 Gateway 网关网络 / WS 协议 / 配对：补充运行 `pnpm test:e2e`
- 调试“我的机器人挂了” / 提供商专属故障 / 工具调用：运行缩小范围的 `pnpm test:live`

## Live（触网）测试

关于 live 模型矩阵、CLI 后端冒烟测试、ACP 冒烟测试、Codex app-server harness，以及所有媒体提供商 live 测试（Deepgram、BytePlus（国际版）、ComfyUI、image、music、video、media harness）——以及 live 运行的凭证处理——请参阅
[测试 — live 套件](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 仅在仓库 Docker 镜像内运行各自匹配 profile-key 的 live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），挂载你的本地配置目录和工作区（如果已挂载，还会 source `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认采用更小的冒烟测试上限，以便完整的 Docker 扫描仍然可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确想要执行更大的穷尽式扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，再通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包一次为 npm tarball，随后构建 / 复用两个 `scripts/e2e/Dockerfile` 镜像。裸镜像仅包含用于 install / update / plugin-dependency 测试通道的 Node / Git 运行器；这些测试通道会挂载预构建 tarball。功能镜像则将同一个 tarball 安装到 `/app` 中，用于 built-app 功能测试通道。Docker 测试通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 会执行所选计划。该聚合器使用带权重的本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会防止重型 live、npm-install 和多服务测试通道同时全部启动。默认值为 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；仅当 Docker 宿主有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。运行器默认会执行 Docker 预检查，移除陈旧的 OpenClaw E2E 容器，每 30 秒打印一次状态，将成功测试通道的耗时存入 `.artifacts/docker-tests/lane-timings.json`，并在后续运行时利用这些耗时优先启动更长的测试通道。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可以只打印带权重的测试通道清单而不构建或运行 Docker，或使用 `node scripts/test-docker-all.mjs --plan-json` 打印所选测试通道、package / image 需求和凭证的 CI 计划。
- 容器冒烟测试运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

live 模型 Docker 运行器还会仅 bind-mount 所需的 CLI 认证 home（若运行未缩小范围，则挂载所有受支持的认证 home），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就可以刷新令牌，而不会修改宿主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，并通过 `pnpm test:docker:live-acp-bind:droid` 与 `pnpm test:docker:live-acp-bind:opencode` 提供严格的 Droid / OpenCode 覆盖）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性冒烟测试：`pnpm qa:otel:smoke` 是私有 QA 源码 checkout 测试通道。它有意不纳入 package Docker 发布测试通道，因为 npm tarball 不包含 QA Lab。
- Open WebUI live 冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY、完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导 / 渠道 / 智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装已打包的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证 doctor 会修复已激活插件的运行时依赖，然后运行一次 mock OpenAI 智能体轮次。可通过 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过宿主构建，或通过 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- 更新渠道切换冒烟测试：`pnpm test:docker:update-channel-switch` 会在 Docker 中全局安装已打包的 OpenClaw tarball，将渠道从 package `stable` 切换到 git `dev`，验证持久化的渠道和 plugin 在更新后正常工作，然后再切回 package `stable` 并检查更新状态。
- 会话运行时上下文冒烟测试：`pnpm test:docker:session-runtime-context` 会验证隐藏运行时上下文转录的持久化，以及 doctor 对受影响的重复 prompt-rewrite 分支的修复。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前树，在隔离 home 中使用 `bun install -g` 安装，并验证 `openclaw infer image providers --json` 返回的是内置 image 提供商，而不是挂起。可通过 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过宿主构建，或通过 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- Installer Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认使用 npm `latest` 作为稳定基线，然后再升级到候选 tarball。本地可通过 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或在 GitHub 上通过 Install Smoke 工作流的 `update_baseline_version` 输入覆盖。非 root 的 installer 检查会保持隔离的 npm 缓存，这样 root 拥有的缓存条目就不会掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑之间复用 root / update / direct-npm 缓存。
- Install Smoke CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；如果需要覆盖直接 `npm install -g`，请在本地运行脚本时不要设置该环境变量。
- 智能体删除共享工作区 CLI 冒烟测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认会构建根 Dockerfile 镜像，在隔离的容器 home 中预置两个共享一个工作区的智能体，运行 `agents delete --json`，并验证 JSON 有效且工作区保留行为正确。可使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照冒烟测试：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）会构建源码 E2E 镜像以及 Chromium 层，以原始 CDP 方式启动 Chromium，运行 `browser doctor --deep`，并验证 CDP 角色快照覆盖链接 URL、由光标提升的可点击项、iframe 引用和 frame 元数据。
- OpenAI Responses `web_search` 最小推理回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个 mock OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制提供商 schema 拒绝，并检查原始细节是否出现在 Gateway 网关日志中。
- MCP 渠道桥接（预置 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi 内置 MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile allow / deny 冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron / subagent MCP 清理（真实 Gateway 网关 + 在隔离 cron 和一次性 subagent 运行后拆除 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟测试、ClawHub 安装 / 卸载、marketplace 更新，以及 Claude-bundle 启用 / 检查）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳过 live ClawHub 模块，或通过 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认 package。
- 插件更新未变化冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在宿主上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。可通过 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，在完成一次本地构建后通过 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过宿主重新构建，或通过 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。完整 Docker 聚合器会先预先打包该 tarball 一次，然后将内置渠道检查拆分为独立测试通道，其中包括 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的独立更新测试通道。直接运行内置测试通道时，使用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 可缩小渠道矩阵，或使用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 缩小更新场景。该测试通道还会验证 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 会抑制 doctor / 运行时依赖修复。
- 迭代时若想缩小内置插件运行时依赖范围，可禁用无关场景，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

如需手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置后，像 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 这样的套件专用镜像覆盖仍然优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果该镜像尚未存在于本地，脚本会先拉取它。QR 和 installer Docker 测试仍保留各自的 Dockerfile，因为它们验证的是 package / 安装行为，而不是共享的 built-app 运行时。

live 模型 Docker 运行器还会以只读方式 bind-mount 当前 checkout，并将其预置到容器内的临时工作目录中。这样既能保持运行时镜像精简，又能确保 Vitest 仍然针对你当前本地的准确源码 / 配置运行。
预置步骤会跳过大型仅限本地的缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地的 `.build` 或 Gradle 输出目录，这样 Docker live 运行就不会花费数分钟复制机器专属产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关 live 探测就不会在容器内启动真实的 Telegram / Discord / 等渠道工作进程。
`test:docker:live-models` 仍然会运行 `pnpm test:live`，因此当你需要缩小或排除该 Docker 测试通道中的 Gateway 网关 live 覆盖范围时，也要一并传递 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，启动一个指向该 Gateway 网关的固定版 Open WebUI 容器，通过 Open WebUI 完成登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一个真实聊天请求。
首次运行可能会明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而且 Open WebUI 可能需要完成自己的冷启动设置。
该测试通道需要可用的 live 模型 key，而 `OPENCLAW_PROFILE_FILE`
（默认值为 `~/.profile`）是在 Docker 化运行中提供该 key 的主要方式。
成功运行会打印一个小型 JSON 载荷，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是有意设计为确定性的，不需要真实的 Telegram、Discord 或 iMessage 账号。它会启动一个已预置的 Gateway 网关容器，再启动第二个容器来拉起 `openclaw mcp serve`，然后验证路由会话发现、转录读取、附件元数据、live 事件队列行为、出站发送路由，以及通过真实 stdio MCP bridge 传递的 Claude 风格渠道 + 权限通知。通知检查会直接检查原始 stdio MCP frame，因此该冒烟测试验证的是 bridge 实际发出的内容，而不仅仅是某个特定客户端 SDK 恰好暴露出来的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要 live 模型 key。它会构建仓库 Docker 镜像，在容器内启动一个真实 stdio MCP 探测服务器，通过嵌入式 Pi bundle MCP 运行时实例化该服务器，执行工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要 live 模型 key。它会使用真实 stdio MCP 探测服务器启动一个已预置的 Gateway 网关，运行一次隔离的 cron 轮次和一次 `/subagents spawn` 一次性子智能体轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 请保留该脚本用于回归 / 调试工作流。之后它可能还会再次用于 ACP 线程路由验证，因此不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认值：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认值：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认值：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于仅验证从 `OPENCLAW_PROFILE_FILE` source 的环境变量；它会使用临时配置 / 工作区目录，并且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认值：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内的 CLI 安装缓存
- `$HOME` 下的外部 CLI 认证目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围的提供商运行只会挂载根据 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗号列表（如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`）手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内筛选提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用现有 `openclaw:local-live` 镜像，以便在不需要重新构建时重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而非环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于为 Open WebUI 冒烟测试选择由 Gateway 网关暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试所使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定版 Open WebUI 镜像标签

## 文档完整性检查

文档编辑后运行文档检查：`pnpm check:docs`。
当你还需要页内标题检查时，运行完整的 Mintlify 锚点校验：`pnpm docs:check-links:anchors`。

## 离线回归（对 CI 安全）

这些是在没有真实提供商的情况下进行的“真实流水线”回归：

- Gateway 网关工具调用（mock OpenAI，真实 Gateway 网关 + Agent loop）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start` / `wizard.next`，强制写入配置 + 认证）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些对 CI 安全的测试，其行为类似“智能体可靠性评估”：

- 通过真实 Gateway 网关 + Agent loop 进行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills（参见 [Skills](/zh-CN/tools/skills)），仍然缺少的是：

- **决策能力：** 当提示词中列出 Skills 时，智能体是否会选择正确的 Skill（或避开无关 Skill）？
- **合规性：** 智能体是否会在使用前读取 `SKILL.md`，并遵循所需步骤 / 参数？
- **工作流契约：** 断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 一个使用 mock 提供商的场景运行器，用于断言工具调用 + 顺序、Skill 文件读取以及会话接线。
- 一小组面向 Skill 的场景（使用 vs 避免、门控、提示注入）。
- 仅在对 CI 安全的套件到位之后，再添加可选的 live 评估（按需启用、受环境变量门控）。

## 契约测试（插件和渠道形状）

契约测试会验证每个已注册插件和渠道都符合其接口契约。它们会遍历所有已发现插件，并运行一组形状和行为断言。默认的 `pnpm test` 单元测试通道会有意跳过这些共享接缝和冒烟文件；当你修改共享渠道或提供商表面时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息载荷结构
- **inbound** - 入站消息处理
- **actions** - 渠道操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略强制执行

### 提供商 Status 契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道 Status 探测
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

- 修改 `plugin-sdk` 导出或子路径后
- 添加或修改渠道或提供商插件后
- 重构插件注册或发现逻辑后

契约测试会在 CI 中运行，不需要真实 API key。

## 添加回归测试（指南）

当你修复在 live 中发现的提供商 / 模型问题时：

- 如果可能，添加一个对 CI 安全的回归测试（mock / stub 提供商，或捕获确切的请求形状转换）
- 如果问题本质上只能在 live 中出现（限流、认证策略），就让 live 测试保持窄范围，并通过环境变量按需启用
- 优先锁定最小但足以捕获该缺陷的层级：
  - 提供商请求转换 / 回放缺陷 → 直接模型测试
  - Gateway 网关会话 / 历史 / 工具流水线缺陷 → Gateway 网关 live 冒烟测试或对 CI 安全的 Gateway 网关 mock 测试
- SecretRef 遍历防护：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言会拒绝遍历片段 exec id。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加了新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会故意在目标 id 未分类时失败，这样新类别就不能被静默跳过。

## 相关内容

- [Testing live](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)
