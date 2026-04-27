---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型 / 提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元 / e2e / 实时测试套件、Docker 运行器，以及每类测试涵盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-27T06:15:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5eb70cdcf0a8bd0aeb08a5f6b9b60471ca7abcbcf7ae5a6a6bcb744186ce5d2e
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三个 Vitest 测试套件（单元 / 集成、e2e、实时）以及一小组 Docker 运行器。本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么内容（以及它刻意**不**覆盖什么）。
- 常见工作流应运行哪些命令（本地、推送前、调试）。
- 实时测试如何发现凭证并选择模型 / 提供商。
- 如何为真实世界中的模型 / 提供商问题添加回归测试。

## 快速开始

大多数情况下：

- 完整门禁（推送前的预期要求）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置宽裕的机器上更快地运行本地全套测试：`pnpm test:max`
- 直接进入 Vitest watch 循环：`pnpm test:watch`
- 现在也支持直接按文件定位 extension / channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代单个失败用例时，优先选择有针对性的运行。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试，或者想获得更多信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- 实时测试套件（模型 + Gateway 网关工具 / 图像探测）：`pnpm test:live`
- 安静地只运行一个实时测试文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker 实时模型全量扫描：`pnpm test:docker:live-models`
  - 现在每个选中的模型都会运行一次文本轮次，并附加一个小型的类文件读取探测。元数据声明支持 `image` 输入的模型还会运行一个极小的图像轮次。在隔离提供商故障时，可通过 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用这些额外探测。
  - CI 覆盖：每日运行的 `OpenClaw Scheduled Live And E2E Checks` 与手动运行的 `OpenClaw Release Checks` 都会调用可复用的实时 / E2E 工作流，并设置 `include_live_suites: true`，其中包含按 provider 分片的独立 Docker 实时模型矩阵作业。
  - 若要进行聚焦的 CI 重跑，请触发 `OpenClaw Live And E2E Checks (Reusable)`，并设置 `include_live_suites: true` 与 `live_models_only: true`。
  - 将新的高信号 provider 密钥添加到 `scripts/ci-hydrate-live-auth.sh`，以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和它的 scheduled / release 调用方中。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 在 Codex app-server 路径上运行 Docker 实时通道，绑定一个合成的 Slack 私信 `/codex bind`，执行 `/codex fast` 和 `/codex permissions`，然后验证普通回复和图像附件是通过原生插件绑定路由，而不是 ACP。
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`
  - 通过插件自有的 Codex app-server harness 运行 Gateway 网关智能体轮次，验证 `/codex status` 和 `/codex models`，并且默认执行图像、cron MCP、子智能体和 Guardian 探测。在隔离其他 Codex app-server 故障时，可通过 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 禁用子智能体探测。若要聚焦检查子智能体，请禁用其他探测：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置了 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则该测试会在子智能体探测后退出。
- Crestodian rescue command 冒烟测试：`pnpm test:live:crestodian-rescue-channel`
  - 这是针对消息渠道 rescue command 表面的可选“双保险”检查。它会执行 `/crestodian status`，排队一个持久化模型变更，回复 `/crestodian yes`，并验证审计 / 配置写入路径。
- Crestodian planner Docker 冒烟测试：`pnpm test:docker:crestodian-planner`
  - 在无配置容器中运行 Crestodian，并在 `PATH` 上放置一个假的 Claude CLI，验证模糊 planner 回退会转换为带审计的类型化配置写入。
- Crestodian 首次运行 Docker 冒烟测试：`pnpm test:docker:crestodian-first-run`
  - 从空的 OpenClaw 状态目录启动，将裸 `openclaw` 路由到 Crestodian，应用 setup / model / agent / Discord 插件 + SecretRef 写入，验证配置，并检查审计条目。同一个 Ring 0 setup 路径也在 QA Lab 中由 `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot / Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行独立命令
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  。验证 JSON 报告的是 Moonshot / K2.6，并且助手转录中存储了规范化后的 `usage.cost`。

<Tip>
当你只需要一个失败用例时，优先通过下面描述的 allowlist 环境变量来收窄实时测试范围。
</Tip>

## QA 专用运行器

当你需要 QA-lab 级别的真实环境时，这些命令与主测试套件并列使用：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，也可以通过手动触发以 mock provider 方式运行。`QA-Lab - All Lanes` 会在 `main` 上每夜运行，也可通过手动触发运行，它将 mock parity gate、实时 Matrix 通道、由 Convex 管理的实时 Telegram 通道以及由 Convex 管理的实时 Discord 通道作为并行作业执行。定时 QA 和发布检查会显式传入 Matrix `--profile fast`，而 Matrix CLI 和手动工作流输入的默认值仍为 `all`；手动触发可以将 `all` 分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 会在发布批准前运行 parity，以及快速 Matrix 和 Telegram 通道。

- `pnpm openclaw qa suite`
  - 直接在主机上运行由仓库支持的 QA 场景。
  - 默认会以隔离的 Gateway 网关工作进程并行运行多个选中的场景。`qa-channel` 默认并发数为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整工作进程数量，或用 `--concurrency 1` 回到旧的串行通道。
  - 任一场景失败时以非零状态退出。若你想保留产物但不希望使用失败退出码，请使用 `--allow-failures`。
  - 支持 `live-frontier`、`mock-openai` 和 `aimock` 三种 provider 模式。`aimock` 会启动一个本地的、由 AIMock 支持的 provider 服务器，用于实验性的夹具与协议 mock 覆盖，而不会替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中运行同一套 QA 测试。
  - 与主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的 provider / model 选择参数。
  - 实时运行会转发那些对访客系统来说切实可用、且受支持的 QA 认证输入：基于环境变量的 provider 密钥、QA 实时 provider 配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须位于仓库根目录之下，这样访客系统才能通过挂载的工作区回写内容。
  - 会将常规 QA 报告 + 摘要以及 Multipass 日志写入 `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，用于偏运维式的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前 checkout 构建一个 npm tarball，在 Docker 中全局安装，运行非交互式 OpenAI API-key onboarding，默认配置 Telegram，验证启用插件时会按需安装运行时依赖，运行 doctor，并针对一个 mocked OpenAI 端点运行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可通过 Discord 运行同一条打包安装通道。
- `pnpm test:docker:session-runtime-context`
  - 针对嵌入式运行时上下文转录运行确定性的内置应用 Docker 冒烟测试。它会验证隐藏的 OpenClaw 运行时上下文被持久化为不可显示的自定义消息，而不是泄漏到可见的用户轮次中；然后注入一个受影响的损坏 session JSONL，并验证 `openclaw doctor --fix` 会将其重写到当前活动分支，同时保留备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个 OpenClaw 候选包，运行已安装包的 onboarding，通过已安装的 CLI 配置 Telegram，然后复用实时 Telegram QA 通道，并将该已安装包作为被测 Gateway 网关。
  - 默认为 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；设置 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或 `OPENCLAW_CURRENT_PACKAGE_TGZ`，可测试解析后的本地 tarball，而不是从注册表安装。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证来源。对于 CI / 发布自动化，请设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，以及 `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果在 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密钥，Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅覆盖此通道使用的共享 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 也将此通道暴露为手动维护者工作流 `NPM Telegram Beta E2E`。它不会在合并时自动运行。该工作流使用 `qa-live-shared` 环境以及 Convex CI 凭证租约。
- GitHub Actions 还提供 `Package Acceptance`，用于针对单个候选包进行旁路产品验证。它接受受信任的 ref、已发布的 npm spec、带 SHA-256 的 HTTPS tarball URL，或来自其他运行的 tarball artifact，上传标准化后的 `openclaw-current.tgz` 作为 `package-under-test`，然后使用现有的 Docker E2E 调度器运行 smoke、package、product、full 或 custom 通道配置。设置 `telegram_mode=mock-openai` 或 `live-frontier`，可让 Telegram QA 工作流针对同一个 `package-under-test` artifact 运行。
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

- artifact 验证会从另一个 Actions 运行中下载 tarball artifact：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，使用已配置的 OpenAI 启动 Gateway 网关，然后通过配置编辑启用内置的 channel / plugins。
  - 验证设置发现流程会让未配置插件的运行时依赖保持缺失状态，首次配置后的 Gateway 网关运行或 doctor 运行会按需安装每个内置插件的运行时依赖，且第二次重启不会重新安装已经激活过的依赖。
  - 同时还会安装一个已知的旧版 npm 基线，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本更新后的 doctor 能修复内置 channel 运行时依赖，而无需 harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 在 Parallels 来宾系统中运行原生打包安装更新冒烟测试。每个选中的平台都会先安装指定的基线包，然后在同一来宾系统中运行已安装的 `openclaw update` 命令，并验证已安装版本、更新状态、Gateway 网关就绪情况，以及一次本地智能体轮次。
  - 在迭代单个来宾系统时，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要 artifact 路径和每条通道状态。
  - OpenAI 通道默认使用 `openai/gpt-5.5` 进行实时智能体轮次验证。若要刻意验证其他 OpenAI 模型，请传入 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 将较长的本地运行包装在主机超时中，这样 Parallels 传输卡顿就不会耗尽剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本会将嵌套通道日志写入 `/tmp/openclaw-parallels-npm-update.*` 下。不要在确认外层包装器卡住之前就下结论，先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在冷启动的来宾系统上，Windows 更新后的 doctor / 运行时依赖修复可能需要 10 到 15 分钟；只要嵌套的 npm 调试日志仍在推进，这仍然是健康状态。
  - 不要将这个聚合包装器与单独的 Parallels macOS、Windows 或 Linux 冒烟通道并行运行。它们共享 VM 状态，可能会在快照恢复、包服务或来宾 Gateway 网关状态上发生冲突。
  - 更新后的验证会运行正常的内置插件表面，因为像语音、图像生成和媒体理解这样的能力 facade，是通过内置运行时 API 加载的，即使智能体轮次本身只检查简单的文本响应也是如此。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock provider 服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的、由 Docker 支持的 Tuwunel homeserver 运行 Matrix 实时 QA 通道。
  - 这个 QA 主机目前仅供仓库 / 开发环境使用。已打包安装的 OpenClaw 不附带 `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库 checkout 会直接加载内置运行器；不需要单独的插件安装步骤。
  - 预配三个临时 Matrix 用户（`driver`、`sut`、`observer`）以及一个私有房间，然后以真实的 Matrix 插件作为 SUT 传输层启动一个 QA Gateway 网关子进程。
  - 默认为 `--profile all`。对于发布关键的传输验证，使用 `--profile fast --fail-fast`；当你要对完整目录进行分片时，使用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`。
  - 默认使用固定的稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。当你需要测试不同镜像时，可通过 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享的凭证来源标志，因为该通道会在本地预配一次性用户。
  - 会将 Matrix QA 报告、摘要、observed-events artifact 以及合并后的 stdout / stderr 输出日志写入 `.artifacts/qa-e2e/...`。
  - 默认会输出进度，并通过 `OPENCLAW_QA_MATRIX_TIMEOUT_MS` 强制执行硬性运行超时（默认 30 分钟）。`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` 用于调整否定性无回复静默窗口，清理过程则受 `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 限制；如果清理失败，输出中会包含恢复命令 `docker compose ... down --remove-orphans`。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 driver 和 SUT bot token，针对真实私有群组运行 Telegram 实时 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是数字形式的 Telegram chat id。
  - 支持 `--credential-source convex` 使用共享凭证池。默认使用 env 模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用共享租约。
  - 任一场景失败时以非零状态退出。若你想保留 artifact 但不希望使用失败退出码，请使用 `--allow-failures`。
  - 需要同一个私有群组中的两个不同 bot，并且 SUT bot 必须暴露 Telegram 用户名。
  - 为了实现稳定的 bot 对 bot 观测，请在 `@BotFather` 中为两个 bot 都启用 Bot-to-Bot Communication Mode，并确保 driver bot 可以观测群组中的 bot 流量。
  - 会将 Telegram QA 报告、摘要和 observed-messages artifact 写入 `.artifacts/qa-e2e/...`。回复类场景会包含从 driver 发送请求到观测到 SUT 回复之间的 RTT。

实时传输通道共享一套标准契约，这样新增传输协议时就不会发生漂移：

`qa-channel` 仍然是广泛的合成 QA 套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | Canary | 提及门控 | Allowlist 阻断 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | Reaction 观测 | 帮助命令 | 原生命令注册 |
| ---- | ------ | -------- | -------------- | -------- | -------- | -------- | -------- | -------------- | -------- | ------------ |
| Matrix | x | x | x | x | x | x | x | x |  |  |
| Telegram | x | x |  |  |  |  |  |  | x |  |
| Discord | x | x |  |  |  |  |  |  |  | x |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从一个由 Convex 支持的池中获取一个独占租约，在通道运行期间为该租约发送心跳，并在关闭时释放租约。

参考用的 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 为所选角色提供一个密钥：
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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选跟踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

在正常运行中，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理命令（池的添加 / 删除 / 列表）必须专门使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

面向维护者的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在实时运行之前使用 `doctor`，可检查 Convex site URL、broker 密钥、端点前缀、HTTP 超时和 admin / list 可达性，而不会打印密钥值。在脚本和 CI 工具中使用 `--json` 可获得机器可读输出。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 已耗尽 / 可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `groupId` 必须是数字形式的 Telegram chat id 字符串。
- `admin/add` 会对 `kind: "telegram"` 校验此结构，并拒绝格式错误的 payload。

### 向 QA 添加一个渠道

向 Markdown QA 系统添加一个渠道，严格来说只需要两样东西：

1. 该渠道的传输适配器。
2. 用于验证该渠道契约的场景包。

当共享的 `qa-lab` 主机可以承载整个流程时，不要新增一个顶层 QA 命令根。

`qa-lab` 负责共享主机机制：

- `openclaw qa` 命令根
- 套件启动与拆除
- 工作进程并发
- artifact 写入
- 报告生成
- 场景执行
- 对旧 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- 如何将 `openclaw qa <runner>` 挂载到共享的 `qa` 根命令下
- 如何为该传输协议配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何暴露转录和规范化的传输状态
- 如何执行由传输协议支撑的动作
- 如何处理特定于传输协议的重置或清理

新渠道的最低接入门槛是：

1. 保持由 `qa-lab` 作为共享 `qa` 根命令的拥有者。
2. 在共享的 `qa-lab` 主机接缝上实现该传输运行器。
3. 将特定于传输协议的机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个相互竞争的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出与之匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 轻量；惰性 CLI 和运行器执行应保留在单独的入口点之后。
5. 在有主题划分的 `qa/scenarios/` 目录下编写或改造 Markdown 场景。
6. 对新场景使用通用场景辅助工具。
7. 除非仓库正在进行有意迁移，否则要保持现有兼容别名继续可用。

决策规则很严格：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就把它放进 `qa-lab`。
- 如果某个行为依赖单一渠道传输协议，就把它保留在对应的运行器插件或插件 harness 中。
- 如果某个场景需要一个可被多个渠道复用的新能力，就添加一个通用 helper，而不是在 `suite.ts` 中增加一个渠道专用分支。
- 如果某个行为只对一种传输协议有意义，就让该场景保持传输协议专用，并在场景契约中明确说明。

新场景推荐使用的通用 helper 名称包括：

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

新的渠道开发应使用通用 helper 名称。
兼容别名的存在是为了避免一次性迁移日，而不是为了成为新场景编写的范式。

## 测试套件（各自运行位置）

可以把这些测试套件理解为“真实性逐步增强”（同时也意味着更高的不稳定性 / 成本）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：未定向运行使用 `vitest.full-*.config.ts` 分片集，并且可能会将多项目分片展开为按项目划分的配置，以便并行调度
- 文件：核心 / 单元测试清单位于 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts`，以及由 `vitest.unit.config.ts` 覆盖的白名单 `ui` Node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 针对已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定

<AccordionGroup>
  <Accordion title="项目、分片与作用域通道">

    - 未定向的 `pnpm test` 会运行 12 个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个庞大的原生根项目进程。这样可以降低高负载机器上的 RSS 峰值，并避免 auto-reply / extension 工作拖慢无关套件。
    - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不现实。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会优先通过作用域通道路由显式文件 / 目录目标，因此像 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 这样的命令无需支付完整根项目启动成本。
    - 默认情况下，`pnpm test:changed` 会将变更的 git 路径展开为低成本的作用域通道：直接测试编辑、同级 `*.test.ts` 文件、显式源码映射，以及本地导入图依赖项。配置 / setup / package 编辑不会触发大范围测试，除非你显式使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是针对窄范围工作常规使用的智能本地检查门禁。它会将 diff 分类到 core、core tests、extensions、extension tests、apps、docs、发布元数据、实时 Docker 工具和工具链，然后运行匹配的 typecheck、lint 和 guard 命令。它不会运行 Vitest 测试；要获得测试证明，请调用 `pnpm test:changed` 或显式使用 `pnpm test <target>`。仅涉及发布元数据的版本提升会运行定向的版本 / 配置 / 根依赖检查，并带有一个防护，拒绝除顶层版本字段以外的 package 改动。
    - 对实时 Docker ACP harness 的编辑会运行聚焦检查：实时 Docker 认证脚本的 shell 语法检查，以及实时 Docker 调度器 dry-run。仅当 diff 限定于 `scripts["test:docker:live-*"]` 时，`package.json` 变更才会被纳入；依赖、导出、版本以及其他 package 表面编辑仍使用更广泛的防护。
    - 来自智能体、命令、插件、auto-reply helper、`plugin-sdk` 及类似纯工具区域的轻导入单元测试，会通过 `unit-fast` 通道路由，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时较重的文件仍保留在现有通道中。
    - 部分 `plugin-sdk` 和 `commands` helper 源文件，在 changed 模式下也会映射到这些轻量通道中的显式同级测试，因此 helper 编辑无需重新运行该目录下完整的重型套件。
    - `auto-reply` 为顶层 core helper、顶层 `reply.*` 集成测试以及 `src/auto-reply/reply/**` 子树设置了专用分桶。在 CI 中，还会将 reply 子树进一步拆分为 agent-runner、dispatch 和 commands / state-routing 分片，这样就不会由一个导入较重的分桶独占完整的 Node 尾部时间。

  </Accordion>

  <Accordion title="嵌入式运行器覆盖">

    - 当你修改消息工具发现输入或 compaction 运行时上下文时，请同时保持这两个层级的覆盖。
    - 为纯路由和规范化边界添加聚焦的 helper 回归测试。
    - 保持嵌入式运行器集成套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`，
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`，以及
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些套件会验证作用域 id 和 compaction 行为仍然沿真实的 `run.ts` / `compact.ts` 路径流转；仅有 helper 测试不足以替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest 池与隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置将 `isolate: false` 固定下来，并在根项目、e2e 和实时配置中都使用非隔离运行器。
    - 根 UI 通道保留其 `jsdom` setup 和优化器，但同样运行在共享的非隔离运行器上。
    - 每个 `pnpm test` 分片都从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与原生 V8 行为进行对比。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示某个 diff 会触发哪些架构通道。
    - pre-commit hook 仅做格式化。它会重新暂存格式化后的文件，但不会运行 lint、typecheck 或测试。
    - 在交接或推送前，当你需要智能本地检查门禁时，请显式运行 `pnpm check:changed`。
    - 默认情况下，`pnpm test:changed` 会通过低成本的作用域通道进行路由。只有当智能体判断某个 harness、配置、package 或契约编辑确实需要更广的 Vitest 覆盖时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
    - 本地 worker 自动扩缩容是有意保守设计的，当主机负载平均值已较高时会回退，因此默认情况下多个并发 Vitest 运行造成的影响更小。
    - 基础 Vitest 配置将项目 / 配置文件标记为 `forceRerunTriggers`，从而在测试接线发生变化时保证 changed 模式重跑的正确性。
    - 配置会在受支持的主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接性能分析指定一个显式缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入细分输出。
    - `pnpm test:perf:imports:changed` 会将同样的性能分析视图限制为自 `origin/main` 以来发生变更的文件。
    - 分片耗时数据会写入 `.artifacts/vitest-shard-timings.json`。整份配置运行会以配置路径作为 key；包含模式的 CI 分片会追加分片名称，以便单独追踪被过滤的分片。
    - 当某个热点测试的大部分时间仍耗在启动导入上时，应将重依赖放在一个狭窄的本地 `*.runtime.ts` 接缝后面，并直接 mock 这个接缝，而不是为了传给 `vi.mock(...)` 就深度导入运行时 helper。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将路由后的 `test:changed` 与该已提交 diff 的原生根项目路径进行对比，并打印总耗时以及 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过将当前脏工作树中的变更文件列表路由到 `scripts/test-projects.mjs` 和根 Vitest 配置来执行基准测试。
    - `pnpm test:perf:profile:main` 会为 Vitest / Vite 启动与转换开销写出主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件级并行的情况下，为单元测试套件写出运行器 CPU + 堆 profile。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制为单 worker
- 范围：
  - 启动一个真实的 local loopback Gateway 网关，默认启用诊断
  - 通过诊断事件路径驱动合成的 Gateway 网关消息、内存和大负载抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化 helper
  - 断言 recorder 保持有界、合成 RSS 样本保持在压力预算之下，以及每个会话的队列深度最终回落到零
- 预期：
  - 可安全用于 CI，且不需要密钥
  - 这是一个用于稳定性回归跟进的窄通道，不可替代完整的 Gateway 网关套件

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下内置插件的 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 且 `isolate: false`，与仓库其他部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以 silent 模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket / HTTP 表面、节点配对和更重的网络行为
- 预期：
  - 会在 CI 中运行（当管道中启用时）
  - 不需要真实密钥
  - 相比单元测试包含更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell Gateway 网关
  - 从一个临时本地 Dockerfile 创建沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远程规范文件系统行为
- 预期：
  - 仅按需启用；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和正常工作的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，之后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：在手动运行更广泛的 e2e 套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非默认 CLI 二进制文件或包装脚本

### 实时（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下内置插件的实时测试
- 默认：由 `pnpm test:live` **启用**（会设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型**今天**在真实凭证下是否真的可用？”
  - 捕获提供商格式变化、工具调用怪癖、认证问题以及速率限制行为
- 预期：
  - 按设计并不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制额度
  - 优先运行收窄后的子集，而不是“全跑”
- 实时运行会加载 `~/.profile`，以获取缺失的 API key。
- 默认情况下，实时运行仍会隔离 `HOME`，并将配置 / 认证材料复制到临时测试 home 中，这样单元测试夹具就不会修改你真实的 `~/.openclaw`。
- 仅当你明确需要让实时测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认以更安静的模式运行：它会保留 `[live] ...` 进度输出，但会隐藏额外的 `~/.profile` 提示，并静默 Gateway 网关启动日志 / Bonjour 噪音。如果你希望恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（按提供商区分）：设置逗号 / 分号格式的 `*_API_KEYS`，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可以通过 `OPENCLAW_LIVE_*_KEY` 进行每次实时运行覆盖；测试会在收到速率限制响应后重试。
- 进度 / 心跳输出：
  - 实时测试套件现在会向 stderr 输出进度行，因此即使 Vitest 控制台捕获保持安静，长时间的 provider 调用也会显式显示仍在活动中。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此 provider / Gateway 网关进度行会在实时运行期间立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探测心跳。

## 我应该运行哪个测试套件？

使用下面的决策表：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果你改动很多，再加上 `pnpm test:coverage`）
- 涉及 Gateway 网关网络 / WS 协议 / 配对：再加上 `pnpm test:e2e`
- 调试“我的 bot 挂了” / provider 专属故障 / 工具调用问题：运行收窄后的 `pnpm test:live`

## 实时（触网）测试

对于实时模型矩阵、CLI 后端冒烟、ACP 冒烟、Codex app-server harness，以及所有媒体 provider 实时测试（Deepgram、BytePlus（国际版）、ComfyUI、图像、音乐、视频、媒体 harness）——以及实时运行的凭证处理——请参阅 [测试 — 实时测试套件](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分成两类：

- 实时模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行与其 profile-key 对应的实时测试文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（如果已挂载，也会加载 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 实时运行器默认采用更小的冒烟上限，以便完整的 Docker 扫描仍然切实可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确想进行更大范围的穷尽扫描时，再覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次实时 Docker 镜像，再通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包成一个 npm tarball，然后构建 / 复用两个 `scripts/e2e/Dockerfile` 镜像。裸镜像仅包含用于安装 / 更新 / 插件依赖通道的 Node / Git 运行器；这些通道会挂载预构建的 tarball。功能镜像则会将同一个 tarball 安装到 `/app` 中，用于内置应用功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 负责执行所选计划。该聚合运行器使用加权本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会防止重型实时、npm 安装和多服务通道同时启动。如果单个通道比当前上限更重，调度器仍可在池为空时启动它，然后让它单独运行，直到容量再次可用。默认值为 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有当 Docker 主机有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。该运行器默认会执行 Docker 预检、移除陈旧的 OpenClaw E2E 容器、每 30 秒打印一次状态、将成功通道的耗时存入 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中利用这些耗时优先启动更长的通道。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可只打印加权通道清单而不构建或运行 Docker，或者使用 `node scripts/test-docker-all.mjs --plan-json` 打印所选通道、包 / 镜像需求以及凭证的 CI 计划。
- `Package Acceptance` 是 GitHub 原生的包门禁，用来验证“这个可安装 tarball 作为产品是否可用？”它会从 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析出一个候选包，将其作为 `package-under-test` 上传，然后针对这个精确 tarball 运行可复用的 Docker E2E 通道，而不是重新打包所选 ref。`workflow_ref` 选择受信任的工作流 / harness 脚本，而 `package_ref` 在 `source=ref` 时选择要打包的源码提交 / 分支 / tag；这使得当前 acceptance 逻辑可以验证较早的受信任提交。各 profile 按覆盖范围排序：`smoke` 是快速的安装 / 渠道 / 智能体加上 Gateway 网关 / 配置；`package` 是包 / 更新 / 插件契约，并且是大多数 Parallels 包 / 更新覆盖的默认原生替代；`product` 还会加入 MCP channels、cron / 子智能体清理、OpenAI Web 搜索和 OpenWebUI；`full` 则会运行包含 OpenWebUI 的发布路径 Docker 分块。发布验证会针对目标 ref 运行 `package` profile，并启用 Telegram 包 QA。由 artifact 生成的定向 GitHub Docker 重跑命令会在可用时包含先前的包 artifact 和已准备好的镜像输入，因此失败的通道可以避免重新构建包和镜像。
- Package Acceptance 的旧版兼容性上限是 `2026.4.25`（包括 `2026.4.25-beta.*`）。在该截止版本之前，harness 只容忍已发布包中的元数据缺口：省略的私有 QA 清单项、缺失的 `gateway install --wrapper`、tarball 派生 git 夹具中缺失的补丁文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。对于 `2026.4.25` 之后的包，这些路径都会被视为严格失败。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

实时模型 Docker 运行器还会仅 bind-mount 所需的 CLI 认证 home（如果运行未收窄，则挂载所有受支持的认证 home），然后在运行前将其复制到容器 home 中，这样外部 CLI OAuth 就可以刷新令牌，而不会修改主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，如需严格的 Droid / OpenCode 覆盖，使用 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode`）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + 开发智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性冒烟测试：`pnpm qa:otel:smoke` 是一个私有 QA 源码 checkout 通道。它刻意不属于 package Docker 发布通道的一部分，因为 npm tarball 不包含 QA Lab。
- Open WebUI 实时冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- onboarding 向导（TTY、完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- npm tarball onboarding / 渠道 / 智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包后的 OpenClaw tarball，通过 env-ref onboarding 配置 OpenAI，并默认配置 Telegram，验证 doctor 会修复已激活插件的运行时依赖，然后运行一次模拟的 OpenAI 智能体轮次。可通过 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用一个预构建 tarball，通过 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机构建，或通过 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- 更新渠道切换冒烟测试：`pnpm test:docker:update-channel-switch` 会在 Docker 中全局安装打包后的 OpenClaw tarball，将渠道从 package `stable` 切换到 git `dev`，验证持久化渠道和插件在更新后仍可工作，然后再切回 package `stable` 并检查更新状态。
- 会话运行时上下文冒烟测试：`pnpm test:docker:session-runtime-context` 会验证隐藏的运行时上下文转录持久化，以及 doctor 对受影响的重复 prompt-rewrite 分支的修复。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前工作树，在隔离 home 中使用 `bun install -g` 安装，并验证 `openclaw infer image providers --json` 返回的是内置图像提供商，而不是卡住。可通过 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过主机构建，或通过 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从一个已构建的 Docker 镜像中复制 `dist/`。
- 安装器 Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认使用 npm `latest` 作为稳定基线，然后再升级到候选 tarball。可在本地通过 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或在 GitHub 上通过 Install Smoke 工作流的 `update_baseline_version` 输入覆盖。非 root 的安装器检查会保持隔离的 npm 缓存，这样 root 拥有的缓存条目就不会掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑时复用 root / update / direct-npm 缓存。
- Install Smoke CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；当你需要 direct `npm install -g` 覆盖时，请在本地运行该脚本且不要设置这个环境变量。
- 智能体删除共享工作区 CLI 冒烟测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认会构建根 Dockerfile 镜像，在隔离的容器 home 中注入两个共享同一工作区的智能体，运行 `agents delete --json`，并验证 JSON 有效且保留工作区行为正确。可通过 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关网络（两个容器、WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照冒烟测试：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）会构建源码 E2E 镜像和一个 Chromium 层，以原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP 角色快照覆盖链接 URL、光标提升的可点击项、iframe 引用以及 frame 元数据。
- OpenAI Responses `web_search` 最小 reasoning 回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟的 OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制 provider schema 拒绝并检查原始细节是否出现在 Gateway 网关日志中。
- MCP 渠道桥接（已注入 Gateway 网关 + stdio bridge + 原始 Claude 通知帧冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile allow / deny 冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron / 子智能体 MCP 清理（真实 Gateway 网关 + 在独立 cron 与一次性子智能体运行后清理 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟测试、ClawHub 安装 / 卸载、marketplace 更新，以及 Claude bundle 启用 / 检查）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳过实时 ClawHub 模块，或通过 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认 package。
- 插件更新无变更冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。可通过 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，在完成一次新的本地构建后通过 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过主机构建，或通过 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。完整的 Docker 聚合运行器会预先打包一次这个 tarball，然后将内置渠道检查分片为独立通道，包括 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的单独更新通道。直接运行内置通道时，可通过 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 收窄渠道矩阵，或通过 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 收窄更新场景。该通道还会验证 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 会抑制 doctor / 运行时依赖修复。
- 在迭代时收窄内置插件运行时依赖测试，可禁用无关场景，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

如需手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

像 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 这样的套件专用镜像覆盖项在设置时仍然优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向一个远程共享镜像时，如果它尚未存在于本地，这些脚本会先将其拉取。QR 和安装器 Docker 测试保留它们自己的 Dockerfile，因为它们验证的是 package / install 行为，而不是共享的内置应用运行时。

实时模型 Docker 运行器还会以只读方式 bind-mount 当前 checkout，并将其暂存到容器内的临时工作目录中。这样既能保持运行时镜像轻量，又能让 Vitest 针对你本地的精确源码 / 配置运行。
该暂存步骤会跳过大型本地专用缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地的 `.build` 或
Gradle 输出目录，因此 Docker 实时运行不会花上数分钟去复制机器专用 artifact。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关实时探测就不会在容器中启动真实的 Telegram / Discord / 等渠道工作进程。
`test:docker:live-models` 仍然会运行 `pnpm test:live`，因此当你需要收窄或排除该 Docker 通道中的 Gateway 网关实时覆盖时，也要一并传入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，再针对该 Gateway 网关启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 完成登录，验证 `/api/models` 暴露 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一个真实聊天请求。
首次运行可能明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI 也可能需要完成自己的冷启动设置。
该通道需要一个可用的实时模型密钥，而 `OPENCLAW_PROFILE_FILE`（默认是 `~/.profile`）是在 Docker 化运行中提供该密钥的主要方式。
成功运行会打印一个小型 JSON 负载，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是有意设计为确定性的，不需要真实的 Telegram、Discord 或 iMessage 账号。它会启动一个已注入的 Gateway 网关容器，启动第二个容器来生成 `openclaw mcp serve`，然后通过真实的 stdio MCP bridge 验证路由后的会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。
通知检查会直接检查原始 stdio MCP 帧，因此该冒烟测试验证的是 bridge 实际发出的内容，而不仅仅是某个特定客户端 SDK 恰好暴露出来的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要实时模型密钥。它会构建仓库 Docker 镜像，在容器中启动一个真实的 stdio MCP 探测服务器，通过嵌入式 Pi bundle MCP 运行时将该服务器实例化，执行工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要实时模型密钥。它会启动一个带有真实 stdio MCP 探测服务器的已注入 Gateway 网关，运行一个独立 cron 轮次和一个 `/subagents spawn` 一次性子轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 请保留这个脚本用于回归 / 调试工作流。它未来仍可能再次用于 ACP 线程路由验证，因此不要删除它。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并会在运行测试前被加载
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于仅验证从 `OPENCLAW_PROFILE_FILE` 加载的环境变量，此时会使用临时配置 / 工作区目录，且不挂载外部 CLI 认证内容
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于在 Docker 中缓存 CLI 安装
- `$HOME` 下的外部 CLI 认证目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 收窄后的 provider 运行只会挂载由 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于收窄运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤 provider
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于在无需重新构建时复用现有的 `openclaw:local-live` 镜像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而非环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关向 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试中使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像 tag

## 文档完整性检查

在修改文档后运行文档检查：`pnpm check:docs`。
当你还需要检查页内标题锚点时，运行完整的 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归测试（可安全用于 CI）

这些是在没有真实 provider 的情况下进行的“真实通道”回归测试：

- Gateway 网关工具调用（mock OpenAI、真实 Gateway 网关 + Agent loop）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start` / `wizard.next`，会写入配置 + 强制认证）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有少量可安全用于 CI 的测试，它们的行为类似“智能体可靠性评估”：

- 通过真实 Gateway 网关 + Agent loop 进行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills（参见 [Skills](/zh-CN/tools/skills)），目前仍缺少的是：

- **决策能力：** 当提示中列出 Skills 时，智能体是否会选择正确的 Skills（或避免无关 Skills）？
- **合规性：** 智能体在使用前是否会读取 `SKILL.md`，并遵循所需步骤 / 参数？
- **工作流契约：** 断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 一个使用 mock provider 的场景运行器，用于断言工具调用及其顺序、Skill 文件读取以及会话接线。
- 一小组以 Skills 为中心的场景套件（使用 vs 避免、门控、提示注入）。
- 只有在可安全用于 CI 的套件就位后，才考虑可选的实时评估（按需启用、受环境变量控制）。

## 契约测试（插件与渠道形状）

契约测试用于验证每个已注册插件和渠道都符合其接口契约。它们会遍历所有发现的插件，并运行一组形状与行为断言。默认的 `pnpm test` 单元通道会刻意跳过这些共享接缝和冒烟文件；当你修改共享渠道或 provider 表面时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅 provider 契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、名称、能力）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息负载结构
- **inbound** - 入站消息处理
- **actions** - 渠道动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略执行

### provider Status 契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道 Status 探测
- **registry** - 插件注册表形状

### provider 契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证方式选择 / 选择逻辑
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - provider 运行时
- **shape** - 插件形状 / 接口
- **wizard** - 设置向导

### 何时运行

- 修改 `plugin-sdk` 导出或子路径之后
- 添加或修改渠道插件或 provider 插件之后
- 重构插件注册或发现逻辑之后

契约测试会在 CI 中运行，并且不需要真实 API key。

## 添加回归测试（指南）

当你修复一个在实时环境中发现的 provider / model 问题时：

- 如果可能，添加一个可安全用于 CI 的回归测试（mock / stub provider，或者捕获精确的请求形状转换）
- 如果它本质上只能在实时环境中复现（速率限制、认证策略），就让实时测试保持收窄，并通过环境变量按需启用
- 优先定位到能捕获该缺陷的最小层级：
  - provider 请求转换 / 重放缺陷 → 直接模型测试
  - Gateway 网关会话 / 历史 / 工具通道缺陷 → Gateway 网关实时冒烟测试，或可安全用于 CI 的 Gateway 网关 mock 测试
- SecretRef 遍历防护：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个示例目标，然后断言遍历段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增了一个 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会在遇到未分类目标 id 时故意失败，以确保新类别不会被静默跳过。

## 相关内容

- [实时测试](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)
