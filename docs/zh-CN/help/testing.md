---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商 bug 添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：unit/e2e/live 测试套件、Docker 运行器，以及每项测试的覆盖内容
title: 测试
x-i18n:
    generated_at: "2026-05-02T02:01:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三个 Vitest 套件（单元/集成、e2e、live）和一小组 Docker 运行器。本文档是一份“我们如何测试”的指南：

- 每个套件覆盖什么（以及它有意 _不_ 覆盖什么）。
- 常见工作流（本地、推送前、调试）应运行哪些命令。
- live 测试如何发现凭证并选择模型/提供商。
- 如何为真实世界的模型/提供商问题添加回归测试。

<Note>
**QA 栈（qa-lab、qa-channel、live 传输通道）**单独记录在：

- [QA overview](/zh-CN/concepts/qa-e2e-automation) — 架构、命令面、场景编写。
- [Matrix QA](/zh-CN/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的参考。
- [QA channel](/zh-CN/channels/qa-channel) — 仓库支持的场景使用的合成传输插件。

本页覆盖常规测试套件和 Docker/Parallels 运行器的运行方式。下面的 QA 专用运行器小节（[QA 专用运行器](#qa-specific-runners)）列出具体的 `qa` 调用，并指回上面的参考资料。
</Note>

## 快速开始

大多数时候：

- 完整门禁（推送前预期运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在资源充足的机器上更快地运行本地完整套件：`pnpm test:max`
- 直接的 Vitest 监听循环：`pnpm test:watch`
- 直接文件定位现在也会路由扩展/渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代单个失败时，优先运行有针对性的命令。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你触及测试或想要额外信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

当调试真实提供商/模型时（需要真实凭证）：

- Live 套件（模型 + Gateway 网关工具/图像探针）：`pnpm test:live`
- 安静地定位一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 每个选中的模型现在会运行一次文本轮次以及一个小型文件读取风格探针。
    元数据声明支持 `image` 输入的模型也会运行一个微型图像轮次。
    在隔离提供商失败时，可使用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用额外探针。
  - CI 覆盖：每日 `OpenClaw Scheduled Live And E2E Checks` 和手动
    `OpenClaw Release Checks` 都会以 `include_live_suites: true` 调用可复用的 live/E2E 工作流，其中包括按提供商分片的独立 Docker live 模型矩阵作业。
  - 对于聚焦的 CI 重跑，使用 `include_live_suites: true` 和 `live_models_only: true` 触发 `OpenClaw Live And E2E Checks (Reusable)`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和它的
    定时/发布调用方。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 针对 Codex app-server 路径运行一个 Docker live 通道，绑定一个合成
    Slack 私信并使用 `/codex bind`，执行 `/codex fast` 和
    `/codex permissions`，然后验证普通回复和图像附件会通过原生插件绑定路由，而不是 ACP。
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`
  - 通过插件拥有的 Codex app-server harness 运行 Gateway 网关智能体轮次，
    验证 `/codex status` 和 `/codex models`，默认还会执行图像、
    cron MCP、子智能体和 Guardian 探针。在隔离其他 Codex
    app-server 失败时，可使用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 禁用子智能体探针。对于聚焦的子智能体检查，禁用其他探针：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置了 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则这会在子智能体探针后退出。
- Crestodian 救援命令冒烟测试：`pnpm test:live:crestodian-rescue-channel`
  - 消息渠道救援命令表面的可选双保险检查。
    它会执行 `/crestodian status`，排队一个持久模型变更，
    回复 `/crestodian yes`，并验证审计/配置写入路径。
- Crestodian 规划器 Docker 冒烟测试：`pnpm test:docker:crestodian-planner`
  - 在无配置容器中运行 Crestodian，并在 `PATH` 上放置一个假的 Claude CLI，
    然后验证模糊规划器回退会转换为经过审计的类型化配置写入。
- Crestodian 首次运行 Docker 冒烟测试：`pnpm test:docker:crestodian-first-run`
  - 从空的 OpenClaw 状态目录开始，将裸 `openclaw` 路由到
    Crestodian，应用设置/模型/智能体/Discord 插件 + SecretRef 写入，
    验证配置，并验证审计条目。相同的 Ring 0 设置路径也由 QA Lab 中的
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot/Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行
  `openclaw models list --provider moonshot --json`，然后针对
  `moonshot/kimi-k2.6` 运行一个隔离的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  验证 JSON 报告 Moonshot/K2.6，并且助手转录存储了规范化的 `usage.cost`。

<Tip>
当你只需要一个失败用例时，优先通过下面描述的 allowlist 环境变量来收窄 live 测试。
</Tip>

## QA 专用运行器

当你需要 QA-lab 真实度时，这些命令与主测试套件并列：

CI 在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，也可通过手动触发并使用模拟提供商运行。`QA-Lab - All Lanes` 每晚在 `main` 上运行，也可通过手动触发运行，并将模拟 parity gate、live Matrix 通道、Convex 托管的 live Telegram 通道和 Convex 托管的 live Discord 通道作为并行作业。定时 QA 和发布检查会显式传递 Matrix `--profile fast`，而 Matrix CLI 和手动工作流输入的默认值仍为 `all`；手动触发可将 `all` 分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 会在发布批准前运行 parity 加 fast Matrix 和 Telegram 通道，发布传输检查使用 `mock-openai/gpt-5.5`，以保持确定性并避免常规提供商插件启动。这些 live 传输 Gateway 网关会禁用记忆搜索；记忆行为仍由 QA parity 套件覆盖。

完整发布 live 媒体分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已经包含
`ffmpeg` 和 `ffprobe`。Docker live 模型/后端分片使用共享的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像，该镜像会为每个选中的提交构建一次，然后通过 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取，而不是在每个分片内部重建。

- `pnpm openclaw qa suite`
  - 直接在主机上运行仓库支持的 QA 场景。
  - 默认使用隔离的 Gateway 网关 worker 并行运行多个选中的场景。
    `qa-channel` 默认并发为 4（受选中场景数量限制）。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 运行较旧的串行通道。
  - 当任何场景失败时以非零状态退出。当你想要产物但不想要失败退出码时，使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个本地 AIMock 支持的提供商服务器，用于实验性 fixture 和协议模拟覆盖，同时不替代场景感知的
    `mock-openai` 通道。
- `pnpm test:gateway:cpu-scenarios`
  - 运行 Gateway 网关启动基准测试，以及一个小型模拟 QA Lab 场景包
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`），并在 `.artifacts/gateway-cpu-scenarios/`
    下写入合并的 CPU 观测摘要。
  - 默认只标记持续的高 CPU 观测（`--cpu-core-warn` 加
    `--hot-wall-warn-ms`），因此短暂启动峰值会被记录为指标，而不会看起来像持续数分钟的 Gateway 网关占满回归。
  - 使用构建好的 `dist` 产物；当检出目录还没有新的运行时输出时，先运行构建。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 内运行相同的 QA 套件。
  - 保持与主机上 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商/模型选择标志。
  - Live 运行会转发对 guest 来说实用的受支持 QA 认证输入：
    基于环境变量的提供商密钥、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，以便 guest 通过挂载的工作区写回。
  - 在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告 + 摘要以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，用于操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建 npm tarball，在 Docker 中全局安装它，运行非交互式 OpenAI API key 新手引导，默认配置 Telegram，验证打包的插件运行时无需启动依赖修复即可加载，运行 Doctor，并针对模拟的 OpenAI 端点运行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可用 Discord 运行相同的打包安装通道。
- `pnpm test:docker:session-runtime-context`
  - 为嵌入式运行时上下文转录运行确定性的构建应用 Docker 冒烟测试。它验证隐藏的 OpenClaw 运行时上下文会作为非显示自定义消息持久化，而不会泄漏到可见用户轮次中，然后植入一个受影响的损坏会话 JSONL，并验证
    `openclaw doctor --fix` 会将其重写到活动分支并创建备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个 OpenClaw 包候选，运行已安装包的新手引导，通过已安装的 CLI 配置 Telegram，然后用该已安装包作为被测系统 Gateway 网关，复用 live Telegram QA 通道。
  - 默认值为 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；设置
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ` 可测试解析后的本地 tarball，而不是从 registry 安装。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境凭证或 Convex 凭证来源。对于 CI/发布自动化，设置
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` 加
    `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密钥存在于 CI 中，
    Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅针对这个通道覆盖共享的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将这个通道公开为手动维护者工作流
    `NPM Telegram Beta E2E`。它不会在合并时运行。该工作流使用
    `qa-live-shared` 环境和 Convex CI 凭证租约。
- GitHub Actions 也公开了 `Package Acceptance`，用于针对一个候选包进行旁路产品证明。它接受受信任的 ref、已发布的 npm spec、HTTPS tarball URL 加 SHA-256，或来自另一个运行的 tarball artifact，将规范化的
  `openclaw-current.tgz` 上传为 `package-under-test`，然后用 smoke、package、product、full 或 custom 通道 profile 运行现有的 Docker E2E 调度器。设置 `telegram_mode=mock-openai` 或 `live-frontier` 可让 Telegram QA 工作流针对同一个 `package-under-test` 产物运行。
  - 最新 beta 产品证明：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精确 tarball URL 证明需要摘要：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact 证明会从另一个 Actions 运行下载一个 tarball artifact：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，启动配置了 OpenAI 的 Gateway 网关，然后通过配置编辑启用内置渠道/插件。
  - 验证设置发现会让未配置的可下载插件保持缺失，第一次配置的 Doctor 修复会显式安装每个缺失的可下载插件，并且第二次重启不会运行隐藏依赖修复。
  - 还会安装一个已知的旧 npm 基线，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本的更新后 Doctor 会清理旧版插件依赖残留，而不依赖 harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels 客户机运行原生打包安装更新冒烟测试。每个选定平台先安装请求的基线包，然后在同一客户机中运行已安装的 `openclaw update` 命令，并验证已安装版本、更新状态、Gateway 网关就绪状态，以及一次本地智能体回合。
  - 在迭代单个客户机时使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要 artifact 路径和每条 lane 的状态。
  - OpenAI lane 默认使用 `openai/gpt-5.5` 作为实时智能体回合证明。仅在有意验证另一个 OpenAI 模型时，传入 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 将较长的本地运行包在主机超时中，避免 Parallels 传输卡顿耗尽剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本会在 `/tmp/openclaw-parallels-npm-update.*` 下写入嵌套 lane 日志。
    在假设外层 wrapper 卡住之前，先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在冷启动客户机上，Windows 更新可能在更新后 Doctor 和包更新工作中花费 10 到 15 分钟；只要嵌套 npm 调试日志仍在推进，这仍是健康状态。
  - 不要将这个聚合 wrapper 与单独的 Parallels macOS、Windows 或 Linux 冒烟 lane 并行运行。它们共享 VM 状态，可能在快照恢复、包服务或客户机 Gateway 网关状态上发生冲突。
  - 更新后证明会运行普通的内置插件 surface，因为语音、图像生成和媒体理解等能力 facade 是通过内置运行时 API 加载的，即使智能体回合本身只检查一个简单文本响应。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性 Docker 支持的 Tuwunel homeserver 运行 Matrix 实时 QA lane。仅限源码检出 — 打包安装不会发布 `qa-lab`。
  - 完整 CLI、profile/scenario 目录、环境变量和 artifact 布局：[Matrix QA](/zh-CN/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用来自环境变量的 driver 和 SUT bot token，针对真实私有群组运行 Telegram 实时 QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是数字 Telegram chat id。
  - 支持 `--credential-source convex` 用于共享池化凭证。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以选择使用池化租约。
  - 当任何 scenario 失败时以非零状态退出。当你想要 artifact 但不想让退出码失败时，使用 `--allow-failures`。
  - 需要同一个私有群组中的两个不同 bot，且 SUT bot 暴露 Telegram 用户名。
  - 为了获得稳定的 bot 到 bot 观测，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保 driver bot 可以观测群组 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 observed-messages artifact。回复 scenario 包含从 driver 发送请求到观测到 SUT 回复的 RTT。

实时传输 lane 共享一套标准契约，避免新传输发生漂移；每条 lane 的覆盖矩阵位于 [QA overview → 实时传输覆盖](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是广义合成套件，不属于该矩阵。

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的池中获取一个独占租约，在 lane 运行期间为该租约发送 Heartbeat，并在关闭时释放该租约。

参考 Convex 项目 scaffold：

- `qa/convex-credential-broker/`

必需环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所选角色的一个 secret：
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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许仅限本地开发的 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常运行中应使用 `https://`。

Maintainer 管理命令（pool add/remove/list）特别需要 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

面向 maintainer 的 CLI helper：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在实时运行前使用 `doctor` 检查 Convex site URL、broker secret、endpoint prefix、HTTP timeout 和 admin/list 可达性，而不打印 secret 值。使用 `--json` 为脚本和 CI 工具生成机器可读输出。

默认 endpoint 契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 耗尽/可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
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

Telegram kind 的 payload 形状：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字 Telegram chat id 字符串。
- `admin/add` 会为 `kind: "telegram"` 验证此形状，并拒绝格式错误的 payload。

### 将渠道添加到 QA

新渠道适配器的架构和 scenario helper 名称位于 [QA overview → 添加渠道](/zh-CN/concepts/qa-e2e-automation#adding-a-channel)。最低要求：在共享 `qa-lab` host seam 上实现传输 runner，在插件 manifest 中声明 `qaRunners`，挂载为 `openclaw qa <runner>`，并在 `qa/scenarios/` 下编写 scenario。

## 测试套件（哪里运行什么）

可以把这些套件理解为“真实度逐步提高”（同时 flaky 程度/成本也逐步提高）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：非定向运行使用 `vitest.full-*.config.ts` shard 集合，并且可能将多项目 shard 展开为每项目配置，以便并行调度
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的 core/unit inventory；UI 单元测试在专用 `unit-ui` shard 中运行
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 已知 bug 的确定性回归
- 预期：
  - 在 CI 中运行
  - 不需要真实 key
  - 应该快速且稳定
  - Resolver 和 public-surface loader 测试必须用生成的微型插件 fixture 证明广义 `api.js` 和 `runtime-api.js` fallback 行为，而不是使用真实内置插件源码 API。真实插件 API 加载属于插件拥有的 contract/integration 套件。

<AccordionGroup>
  <Accordion title="项目、shard 和 scoped lane">

    - 未指定目标的 `pnpm test` 会运行十二个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这会降低负载机器上的峰值 RSS，并避免 auto-reply/extension 工作使无关测试套件得不到资源。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不实际。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先通过作用域车道处理显式文件/目录目标，所以 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可以避免支付完整根项目启动成本。
    - `pnpm test:changed` 默认会把变更的 git 路径展开为低成本的作用域车道：直接测试编辑、同级 `*.test.ts` 文件、显式源映射，以及本地导入图依赖项。配置/设置/包编辑不会广泛运行测试，除非你显式使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄范围工作的常规智能本地检查门禁。它会把 diff 分类为 core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling 和 tooling，然后运行匹配的 typecheck、lint 和 guard 命令。它不会运行 Vitest 测试；如需测试证明，请调用 `pnpm test:changed` 或显式的 `pnpm test <target>`。仅发布元数据的版本 bump 会运行定向版本/配置/根依赖检查，并带有一个 guard，用于拒绝顶层 version 字段之外的 package 变更。
    - Live Docker ACP harness 编辑会运行聚焦检查：live Docker auth 脚本的 shell 语法，以及 live Docker scheduler dry-run。只有当 diff 限于 `scripts["test:docker:live-*"]` 时才包含 `package.json` 变更；依赖、export、version 和其他 package 表面编辑仍使用更广泛的 guard。
    - 来自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和类似纯工具区域的轻导入单元测试会通过 `unit-fast` 车道，该车道跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件仍留在现有车道。
    - 选定的 `plugin-sdk` 和 `commands` helper 源文件也会把 changed-mode 运行映射到这些轻量车道中的显式同级测试，因此 helper 编辑可以避免为该目录重新运行完整重型套件。
    - `auto-reply` 为顶层 core helpers、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树提供了专用 bucket。CI 还会进一步把 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，避免一个导入较重的 bucket 独占完整 Node 尾部时间。
    - 常规 PR/main CI 会有意跳过 extension 批量扫测和仅发布使用的 `agentic-plugins` 分片。完整 Release Validation 会为候选发布触发单独的 `Plugin Prerelease` 子工作流，以运行这些 plugin/extension 密集的测试套件。

  </Accordion>

  <Accordion title="嵌入式 runner 覆盖率">

    - 当你更改 message-tool 发现输入或 compaction 运行时
      上下文时，请保留两级覆盖。
    - 为纯路由和规范化
      边界添加聚焦的 helper 回归测试。
    - 保持嵌入式 runner 集成套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些套件会验证作用域 id 和 compaction 行为仍会
      通过真实的 `run.ts` / `compact.ts` 路径流动；仅 helper 的测试
      不能充分替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置固定为 `isolate: false`，并在根项目、e2e 和 live 配置中使用
      非隔离 runner。
    - 根 UI 车道保留其 `jsdom` 设置和优化器，但也运行在
      共享非隔离 runner 上。
    - 每个 `pnpm test` 分片都会从共享 Vitest 配置继承相同的 `threads` + `isolate: false`
      默认值。
    - `scripts/run-vitest.mjs` 默认为 Vitest 子 Node
      进程添加 `--no-maglev`，以降低大型本地运行期间的 V8 编译抖动。
      设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与原生 V8
      行为对比。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示一个 diff 触发哪些架构车道。
    - pre-commit hook 仅做格式化。它会重新暂存已格式化的文件，并且
      不运行 lint、typecheck 或测试。
    - 当你需要智能本地检查门禁时，请在 handoff 或 push 前显式运行
      `pnpm check:changed`。
    - `pnpm test:changed` 默认通过低成本的作用域车道路由。仅当智能体
      判定 harness、配置、包或契约编辑确实需要更广的
      Vitest 覆盖时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同路由
      行为，只是 worker 上限更高。
    - 本地 worker 自动缩放有意保持保守，并会在主机负载平均值已经很高时
      退避，因此多个并发
      Vitest 运行默认造成的影响更小。
    - 基础 Vitest 配置将项目/配置文件标记为
      `forceRerunTriggers`，以便测试
      wiring 变更时 changed-mode rerun 仍保持正确。
    - 配置会在受支持主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；
      如果你想为直接 profiling 指定一个显式缓存位置，请设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及
      import-breakdown 输出。
    - `pnpm test:perf:imports:changed` 会把同一 profiling 视图限定到
      自 `origin/main` 以来变更的文件。
    - 分片计时数据会写入 `.artifacts/vitest-shard-timings.json`。
      全配置运行使用配置路径作为键；include-pattern CI
      分片会追加分片名称，以便分别跟踪过滤后的分片。
    - 当某个热点测试仍把大部分时间花在启动导入上时，
      请把重型依赖放在狭窄的本地 `*.runtime.ts` seam 后面，并
      直接 mock 该 seam，而不是 deep-import 运行时 helper 只为把它们传给 `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会比较路由后的
      `test:changed` 与该已提交 diff 的原生根项目路径，并打印 wall time 以及 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过把 changed file list 路由到
      `scripts/test-projects.mjs` 和根 Vitest 配置，对当前
      dirty tree 做基准测试。
    - `pnpm test:perf:profile:main` 会为
      Vitest/Vite 启动和 transform 开销写入 main-thread CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为
      单元套件写入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制使用一个 worker
- 范围：
  - 默认启动一个启用 diagnostics 的真实 loopback Gateway 网关
  - 通过 diagnostic event path 驱动合成 gateway message、memory 和 large-payload churn
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖 diagnostic stability bundle persistence helpers
  - 断言 recorder 保持有界，合成 RSS 样本低于压力预算，并且每会话队列深度会排空回零
- 预期：
  - CI 安全且无需密钥
  - 用于 stability-regression 后续处理的窄车道，不能替代完整 Gateway 网关套件

### E2E（Gateway 网关 smoke）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads`，并设置 `isolate: false`，与仓库其余部分一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以 silent 模式运行，以减少控制台 I/O 开销。
- 有用的覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 表面、node pairing，以及更重的网络功能
- 预期：
  - 在 CI 中运行（当 pipeline 中启用时）
  - 不需要真实密钥
  - 比单元测试有更多移动部件（可能更慢）

### E2E：OpenShell 后端 smoke

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell gateway
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证 remote-canonical filesystem 行为
- 预期：
  - 仅 opt-in；不是默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 gateway 和沙箱
- 有用的覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1` 用于在手动运行更广的 e2e 套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用于指向非默认 CLI 二进制或 wrapper script

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认值：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型在 _今天_ 使用真实凭证是否真的能工作？”
  - 捕获提供商格式变更、tool-calling quirks、auth 问题和 rate limit 行为
- 预期：
  - 设计上不保证 CI 稳定（真实网络、真实提供商策略、配额、中断）
  - 会产生成本 / 使用 rate limits
  - 优先运行收窄后的子集，而不是“全部”
- Live 运行会 source `~/.profile` 以获取缺失的 API keys。
- 默认情况下，live 运行仍会隔离 `HOME`，并把配置/auth material 复制到临时测试 home 中，因此单元 fixture 无法修改你的真实 `~/.openclaw`。
- 仅当你有意需要 live 测试使用你的真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：它保留 `[live] ...` progress output，但抑制额外的 `~/.profile` notice，并静音 gateway bootstrap logs/Bonjour chatter。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（特定于提供商）：设置逗号/分号格式的 `*_API_KEYS`，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可以通过 `OPENCLAW_LIVE_*_KEY` 做 per-live 覆盖；测试会在 rate limit 响应时重试。
- 进度/Heartbeat 输出：
  - Live 套件现在会向 stderr 发出进度行，因此即使 Vitest 控制台捕获处于安静状态，长时间的提供商调用也能看到仍在活动。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此提供商/Gateway 网关进度行会在 live 运行期间立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整 direct-model heartbeats。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 gateway/probe heartbeats。

## 我应该运行哪个套件？

使用此决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果改动很多，也运行 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：添加 `pnpm test:e2e`
- 调试“我的 bot 挂了”/ 提供商特定故障 / 工具调用：运行收窄范围的 `pnpm test:live`

## 实时（触及网络的）测试

对于实时模型矩阵、CLI 后端冒烟测试、ACP 冒烟测试、Codex app-server 测试框架，以及所有媒体提供商实时测试（Deepgram、BytePlus（国际版）、ComfyUI、图像、音乐、视频、媒体测试框架）以及实时运行的凭证处理，请参阅[实时测试套件](/zh-CN/help/testing-live)。有关专用的更新和插件验证清单，请参阅[更新和插件测试](/zh-CN/help/testing-updates-plugins)。

## Docker 运行器（可选的“可在 Linux 中运行”检查）

这些 Docker 运行器分为两类：

- 实时模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 仅在仓库 Docker 镜像内运行其匹配 profile-key 的实时文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），挂载你的本地配置目录和工作区（如果已挂载，也会加载 `~/.profile`）。匹配的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 实时运行器默认使用较小的冒烟上限，让完整 Docker 扫描保持实用：
  `test:docker:live-models` 默认使用 `OPENCLAW_LIVE_MAX_MODELS=12`，并且
  `test:docker:live-gateway` 默认使用 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。仅当你明确想要更大的穷尽式扫描时，才覆盖这些环境变量。
- `test:docker:all` 通过 `test:docker:live-build` 构建一次实时 Docker 镜像，通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包一次为 npm tarball，然后构建/复用两个 `scripts/e2e/Dockerfile` 镜像。裸镜像只是用于安装/更新/插件依赖 lane 的 Node/Git 运行器；这些 lane 会挂载预构建的 tarball。功能镜像会将同一个 tarball 安装到 `/app`，用于已构建应用功能 lane。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行所选计划。聚合运行使用加权本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会防止重型实时、npm 安装和多服务 lane 同时全部启动。如果单个 lane 比当前上限更重，调度器仍可在池为空时启动它，然后让它单独运行，直到再次有容量可用。默认值为 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；仅当 Docker 主机有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。运行器默认执行 Docker 预检，移除陈旧的 OpenClaw E2E 容器，每 30 秒打印一次状态，将成功 lane 的耗时存储在 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中使用这些耗时先启动更长的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不构建或运行 Docker 的情况下打印加权 lane 清单，或使用 `node scripts/test-docker-all.mjs --plan-json` 打印所选 lane、package/image 需求和凭证的 CI 计划。
- `Package Acceptance` 是 GitHub 原生的 package gate，用于验证“这个可安装 tarball 是否能作为产品正常工作？”它会从 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一个候选 package，将其作为 `package-under-test` 上传，然后针对该精确 tarball 运行可复用的 Docker E2E lane，而不是重新打包所选 ref。Profile 按覆盖范围排序：`smoke`、`package`、`product` 和 `full`。有关 package/update/plugin 合约、已发布升级幸存者矩阵、发布默认值和失败分诊，请参阅[更新和插件测试](/zh-CN/help/testing-updates-plugins)。
- 构建和发布检查会在 tsdown 后运行 `scripts/check-cli-bootstrap-imports.mjs`。该防护会从 `dist/entry.js` 和 `dist/cli/run-main.js` 遍历静态构建图；如果命令分发前的启动流程导入了 Commander、prompt UI、undici 或日志等 package 依赖，它会失败；它还会让内置 Gateway 网关运行 chunk 保持在预算内，并拒绝已知冷启动 Gateway 网关路径的静态导入。打包后的 CLI 冒烟测试还覆盖 root help、onboard help、doctor help、Status、配置 schema 和模型列表命令。
- Package Acceptance 旧版兼容性封顶于 `2026.4.25`（包括 `2026.4.25-beta.*`）。在该截止版本之前，测试框架仅容忍已发布 package 的元数据缺口：省略的私有 QA inventory 条目、缺失的 `gateway install --wrapper`、tarball 派生 git fixture 中缺失的 patch 文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。对于 `2026.4.25` 之后的 package，这些路径都是严格失败。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

实时模型 Docker 运行器还只会 bind-mount 所需的 CLI auth home（如果运行未收窄，则挂载所有支持的 home），然后在运行前将它们复制到容器 home 中，使外部 CLI OAuth 可以刷新 token，而不会修改主机 auth store：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，并通过 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 严格覆盖 Droid/OpenCode）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server 测试框架冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + 开发智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性冒烟测试：`pnpm qa:otel:smoke` 是私有 QA 源码检出通道。它有意不属于包 Docker 发布通道，因为 npm tarball 会省略 QA Lab。
- Open WebUI 实时冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导/渠道/智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包后的 OpenClaw tarball，通过环境变量引用的新手引导配置 OpenAI，并默认配置 Telegram，运行 Doctor，然后运行一次模拟的 OpenAI 智能体轮次。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机重建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- 更新渠道切换冒烟测试：`pnpm test:docker:update-channel-switch` 会在 Docker 中全局安装打包后的 OpenClaw tarball，从包 `stable` 切换到 git `dev`，验证持久化的渠道和插件更新后工作正常，然后切回包 `stable` 并检查更新状态。
- 升级幸存者冒烟测试：`pnpm test:docker:upgrade-survivor` 会把打包后的 OpenClaw tarball 安装到一个脏旧用户 fixture 上，该 fixture 包含智能体、渠道配置、插件 allowlist、过期的插件依赖状态，以及已有工作区/会话文件。它会运行包更新和非交互式 Doctor，不需要实时提供商或渠道密钥，然后启动 local loopback Gateway 网关，并检查配置/状态保留以及启动/Status 预算。
- 已发布升级幸存者冒烟测试：`pnpm test:docker:published-upgrade-survivor` 默认安装 `openclaw@latest`，写入真实的现有用户文件，用内置命令配方配置该基线，验证生成的配置，将该已发布安装更新到候选 tarball，运行非交互式 Doctor，写入 `.artifacts/upgrade-survivor/summary.json`，然后启动 local loopback Gateway 网关，并检查已配置意图、状态保留、启动、`/healthz`、`/readyz` 和 RPC Status 预算。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖一个基线，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 让聚合调度器展开精确基线，并使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展开问题形状的 fixture，例如 `reported-issues`；Package Acceptance 会将这些公开为 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`。
- 会话运行时上下文冒烟测试：`pnpm test:docker:session-runtime-context` 会验证隐藏运行时上下文 transcript 持久化，以及 Doctor 对受影响的重复 prompt-rewrite 分支的修复。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前树，在隔离的 home 中用 `bun install -g` 安装它，并验证 `openclaw infer image providers --json` 返回内置图片提供商，而不是挂起。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过主机构建，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认使用 npm `latest` 作为稳定基线，然后升级到候选 tarball。在本地使用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或在 GitHub 上使用 Install Smoke 工作流的 `update_baseline_version` 输入覆盖。非 root 安装器检查保留隔离的 npm 缓存，避免 root 拥有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重复运行时复用 root/update/direct-npm 缓存。
- Install Smoke CI 会用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；需要覆盖直接 `npm install -g` 时，在本地运行脚本且不要设置该环境变量。
- 智能体删除共享工作区 CLI 冒烟测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认构建根 Dockerfile 镜像，在隔离容器 home 中写入两个智能体和一个工作区，运行 `agents delete --json`，并验证有效 JSON 以及工作区保留行为。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关联网（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照冒烟测试：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）会构建源码 E2E 镜像和一个 Chromium 层，用原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP 角色快照覆盖链接 URL、由光标提升的可点击项、iframe 引用和 frame 元数据。
- OpenAI Responses web_search 最小 reasoning 回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟 OpenAI 服务器，验证 `web_search` 将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制提供商 schema 拒绝并检查原始详情出现在 Gateway 网关日志中。
- MCP 渠道桥接（已写入种子的 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile allow/deny 冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + stdio MCP 子进程在隔离 cron 和一次性 subagent 运行后被拆除）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（本地路径、`file:`、带 hoisted 依赖的 npm registry、git 移动引用、ClawHub kitchen-sink、marketplace 更新，以及 Claude-bundle 启用/检查的安装/更新冒烟测试）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳过 ClawHub 块，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认 kitchen-sink 包/运行时组合。没有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` 时，测试会使用 hermetic 本地 ClawHub fixture 服务器。
- 插件更新无变化冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 插件：`pnpm test:docker:plugins` 覆盖本地路径、`file:`、带 hoisted 依赖的 npm registry、git 移动引用、ClawHub fixture、marketplace 更新，以及 Claude-bundle 启用/检查的安装/更新冒烟测试。`pnpm test:docker:plugin-update` 覆盖已安装插件的无变化更新行为。

要手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置后，像 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 这样的套件专用镜像覆盖项仍然优先。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果该镜像尚未在本地存在，脚本会拉取它。QR 和安装器 Docker 测试保留自己的 Dockerfile，因为它们验证的是包/安装行为，而不是共享的已构建应用运行时。

实时模型 Docker 运行器还会以只读方式 bind-mount 当前检出，并在容器内将其暂存到临时工作目录。这会保持运行时镜像精简，同时仍然针对你的精确本地源码/配置运行 Vitest。暂存步骤会跳过大型本地专用缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或 Gradle 输出目录，避免 Docker 实时运行花数分钟复制机器专用产物。它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，因此 Gateway 网关实时探针不会在容器内启动真实 Telegram/Discord 等渠道 worker。`test:docker:live-models` 仍会运行 `pnpm test:live`，因此当你需要从该 Docker 通道缩小或排除 Gateway 网关实时覆盖时，也要传入 `OPENCLAW_LIVE_GATEWAY_*`。`test:docker:openwebui` 是更高层的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，启动一个固定版本的 Open WebUI 容器并连接到该 Gateway 网关，通过 Open WebUI 登录，验证 `/api/models` 暴露 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送真实聊天请求。第一次运行可能明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，且 Open WebUI 可能需要完成自己的冷启动设置。此通道需要可用的实时模型密钥，`OPENCLAW_PROFILE_FILE`（默认是 `~/.profile`）是在 Docker 化运行中提供该密钥的主要方式。成功运行会打印一个小型 JSON payload，例如 `{ "ok": true, "model": "openclaw/default", ... }`。`test:docker:mcp-channels` 有意保持确定性，不需要真实 Telegram、Discord 或 iMessage 账号。它会启动一个已写入种子的 Gateway 网关容器，启动第二个容器来生成 `openclaw mcp serve`，然后验证路由后的会话发现、transcript 读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio MCP bridge 发送的 Claude 风格渠道 + 权限通知。通知检查会直接检查原始 stdio MCP frame，因此该冒烟测试验证的是 bridge 实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露的内容。`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要实时模型密钥。它会构建仓库 Docker 镜像，在容器内启动真实 stdio MCP 探针服务器，通过嵌入式 Pi bundle MCP 运行时物化该服务器，执行工具，然后验证 `coding` 和 `messaging` 保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会过滤它们。`test:docker:cron-mcp-cleanup` 是确定性的，不需要实时模型密钥。它会启动带有真实 stdio MCP 探针服务器的已写入种子 Gateway 网关，运行一个隔离 cron 轮次和一个 `/subagents spawn` 一次性子轮次，然后验证 MCP 子进程在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（不属于 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归/调试工作流。ACP 线程路由验证以后可能还会需要它，因此不要删除。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 仅验证从 `OPENCLAW_PROFILE_FILE` source 的环境变量，使用临时配置/工作区目录，并且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内缓存的 CLI 安装
- `$HOME` 下的外部 CLI 认证目录/文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围的提供商运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 可用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内筛选提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于在不需要重新构建的重跑中复用现有 `openclaw:local-live` 镜像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自配置文件存储（而不是环境）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

文档编辑后运行文档检查：`pnpm check:docs`。
当你还需要页内标题检查时，运行完整的 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归测试（CI 安全）

这些是不使用真实提供商的“真实流水线”回归测试：

- Gateway 网关工具调用（mock OpenAI，真实 Gateway 网关 + Agent loop）：`src/gateway/gateway.test.ts`（用例："runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，写入配置 + 强制认证）：`src/gateway/gateway.test.ts`（用例："runs wizard over ws and writes auth token config"）

## 智能体可靠性评测（Skills）

我们已经有一些像“智能体可靠性评测”一样运行的 CI 安全测试：

- 通过真实 Gateway 网关 + Agent loop 进行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

Skills 仍缺失的内容（见 [Skills](/zh-CN/tools/skills)）：

- **决策：** 当提示中列出 Skills 时，智能体是否会选择正确的 Skill（或避开无关的 Skill）？
- **合规：** 智能体是否会在使用前读取 `SKILL.md` 并遵循必需步骤/参数？
- **工作流契约：** 断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来评测应优先保持确定性：

- 使用 mock 提供商的场景运行器，用于断言工具调用 + 顺序、Skill 文件读取和会话接线。
- 一小组面向 Skill 的场景（使用与避开、门控、提示注入）。
- 可选的 live 评测（选择加入、通过环境变量门控）仅在 CI 安全套件就位后再添加。

## 契约测试（插件和渠道形态）

契约测试会验证每个已注册插件和渠道是否符合其接口契约。它们会遍历所有发现的插件，并运行一组形态和行为断言。默认的 `pnpm test` 单元测试通道会有意跳过这些共享边界和冒烟测试文件；当你触碰共享渠道或提供商表面时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形态（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息载荷结构
- **inbound** - 入站消息处理
- **actions** - 渠道动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/成员列表 API
- **group-policy** - 群组策略执行

### 提供商 Status 契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道 Status 探测
- **registry** - 插件注册表形态

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择/选取
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形态/接口
- **wizard** - 设置向导

### 何时运行

- 更改 plugin-sdk 导出或子路径后
- 添加或修改渠道或提供商插件后
- 重构插件注册或发现后

契约测试会在 CI 中运行，并且不需要真实 API key。

## 添加回归测试（指南）

当你修复在 live 中发现的提供商/模型问题时：

- 尽可能添加 CI 安全的回归测试（mock/stub 提供商，或捕获精确的请求形态转换）
- 如果它本质上只能 live 测试（速率限制、认证策略），保持 live 测试范围窄，并通过环境变量选择加入
- 优先定位能捕获 bug 的最小层级：
  - 提供商请求转换/重放 bug → 直接模型测试
  - Gateway 网关会话/历史/工具流水线 bug → Gateway 网关 live 冒烟测试或 CI 安全的 Gateway 网关 mock 测试
- SecretRef 遍历防护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言带遍历片段的 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会有意在未分类目标 id 上失败，因此新类不能被静默跳过。

## 相关

- [Testing live](/zh-CN/help/testing-live)
- [更新和插件测试](/zh-CN/help/testing-updates-plugins)
- [CI](/zh-CN/ci)
