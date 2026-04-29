---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元/e2e/live 套件、Docker 运行器，以及每项测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-29T05:40:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 883840f97ca94a4e6b64cfce414da59ad3710ddd8e5e2e3ba04e33a83e96d407
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三个 Vitest 套件（单元/集成、e2e、live）和一小组
Docker 运行器。本文档是一份“我们如何测试”的指南：

- 每个套件覆盖什么（以及它有意_不_覆盖什么）。
- 常见工作流（本地、推送前、调试）应该运行哪些命令。
- live 测试如何发现凭证并选择模型/提供商。
- 如何为真实世界的模型/提供商问题添加回归测试。

<Note>
**QA 栈（qa-lab、qa-channel、live 传输通道）** 单独记录在以下文档中：

- [QA overview](/zh-CN/concepts/qa-e2e-automation) — 架构、命令界面、场景编写。
- [Matrix QA](/zh-CN/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的参考。
- [QA channel](/zh-CN/channels/qa-channel) — 由仓库支持的场景使用的合成传输插件。

本页介绍如何运行常规测试套件和 Docker/Parallels 运行器。下面的 QA 专用运行器部分（[QA 专用运行器](#qa-specific-runners)）列出了具体的 `qa` 调用，并指回上面的参考文档。
</Note>

## 快速开始

大多数时候：

- 完整门禁（推送前预期执行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在资源充足的机器上更快地运行本地完整套件：`pnpm test:max`
- 直接 Vitest 监听循环：`pnpm test:watch`
- 直接按文件定位现在也会路由扩展/渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 在针对单个失败迭代时，优先先运行目标测试。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改测试或想获得额外信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

调试真实提供商/模型时（需要真实凭证）：

- Live 套件（模型 + Gateway 网关工具/图片探测）：`pnpm test:live`
- 安静地定位一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 每个选中的模型现在会运行一次文本回合外加一个小型文件读取式探测。
    元数据声明支持 `image` 输入的模型也会运行一次微型图片回合。
    在隔离提供商失败时，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用这些额外探测。
  - CI 覆盖：每日 `OpenClaw Scheduled Live And E2E Checks` 和手动
    `OpenClaw Release Checks` 都会调用可复用的 live/E2E 工作流，并设置
    `include_live_suites: true`，其中包含按提供商分片的独立 Docker live 模型
    矩阵任务。
  - 对于聚焦的 CI 重跑，分发 `OpenClaw Live And E2E Checks (Reusable)`，
    并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和它的
    定时/发布调用方中。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 针对 Codex app-server 路径运行 Docker live 通道，使用 `/codex bind`
    绑定一个合成 Slack 私信，执行 `/codex fast` 和
    `/codex permissions`，然后验证一条纯文本回复和一个图片附件通过原生插件绑定
    路由，而不是通过 ACP。
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`
  - 通过插件拥有的 Codex app-server harness 运行 Gateway 网关智能体回合，
    验证 `/codex status` 和 `/codex models`，并默认执行图片、cron MCP、子智能体和 Guardian 探测。在隔离其他 Codex
    app-server 失败时，可用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 禁用子智能体探测。对于聚焦的子智能体检查，禁用其他探测：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置了
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则这会在子智能体探测后退出。
- Crestodian 救援命令冒烟测试：`pnpm test:live:crestodian-rescue-channel`
  - 对消息渠道救援命令界面的可选双保险检查。
    它会执行 `/crestodian status`，排队一个持久模型
    变更，回复 `/crestodian yes`，并验证审计/配置写入路径。
- Crestodian 规划器 Docker 冒烟测试：`pnpm test:docker:crestodian-planner`
  - 在无配置容器中运行 Crestodian，`PATH` 上有一个假的 Claude CLI，
    并验证模糊规划器回退会转换为经过审计的类型化
    配置写入。
- Crestodian 首次运行 Docker 冒烟测试：`pnpm test:docker:crestodian-first-run`
  - 从空的 OpenClaw 状态目录开始，将裸 `openclaw` 路由到
    Crestodian，应用设置/模型/智能体/Discord 插件 + SecretRef 写入，
    验证配置，并验证审计条目。同一条 Ring 0 设置路径
    也在 QA Lab 中通过
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot/Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行
  `openclaw models list --provider moonshot --json`，然后针对
  `moonshot/kimi-k2.6` 运行一个隔离的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  验证 JSON 报告 Moonshot/K2.6，并且助手转录保存了规范化的 `usage.cost`。

<Tip>
当你只需要一个失败用例时，优先通过下面描述的 allowlist 环境变量缩小 live 测试范围。
</Tip>

## QA 专用运行器

当你需要 QA-lab 的真实度时，这些命令与主测试套件并列：

CI 在专用工作流中运行 QA Lab。`Parity gate` 在匹配的 PR 上运行，并且
可通过使用模拟提供商的手动分发运行。`QA-Lab - All Lanes` 每晚在
`main` 上运行，也可通过手动分发运行，其中包含模拟奇偶门禁、live Matrix 通道、
Convex 管理的 live Telegram 通道，以及 Convex 管理的 live Discord 通道，
这些都作为并行任务运行。定时 QA 和发布检查会显式传入 Matrix `--profile fast`，
而 Matrix CLI 和手动工作流输入的默认值仍为
`all`；手动分发可以将 `all` 分片为 `transport`、`media`、`e2ee-smoke`、
`e2ee-deep` 和 `e2ee-cli` 任务。`OpenClaw Release Checks` 在发布批准前运行奇偶检查以及
快速 Matrix 和 Telegram 通道，发布传输检查使用
`mock-openai/gpt-5.5`，以保持确定性并避免常规提供商插件启动。这些 live 传输 Gateway 网关会禁用
memory 搜索；memory 行为仍由 QA 奇偶套件覆盖。

完整发布 live 媒体分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已经有
`ffmpeg` 和 `ffprobe`。Docker live 模型/后端分片使用共享的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像，该镜像会为每个选定的
提交构建一次，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取它，而不是在
每个分片内部重新构建。

- `pnpm openclaw qa suite`
  - 直接在主机上运行由仓库支持的 QA 场景。
  - 默认使用隔离的 Gateway 网关工作器并行运行多个选定场景。
    `qa-channel` 默认并发为 4（受选定场景数量限制）。使用 `--concurrency <count>` 调整工作器
    数量，或使用 `--concurrency 1` 运行较旧的串行通道。
  - 任一场景失败时以非零状态退出。当你
    想要产物但不想要失败退出码时，使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个本地 AIMock 支持的提供商服务器，用于实验性
    fixture 和协议模拟覆盖，而不会替代场景感知的
    `mock-openai` 通道。
- `pnpm test:gateway:cpu-scenarios`
  - 运行 Gateway 网关启动基准测试，以及一个小型模拟 QA Lab 场景包
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`），并在 `.artifacts/gateway-cpu-scenarios/`
    下写入合并的 CPU 观察
    摘要。
  - 默认只标记持续的高 CPU 观察（`--cpu-core-warn`
    加 `--hot-wall-warn-ms`），因此短暂的启动突发会被记录为指标，
    而不会看起来像持续数分钟的 Gateway 网关占满回归。
  - 使用构建好的 `dist` 产物；当检出内容中还没有新的运行时输出时，
    先运行构建。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中运行同一个 QA 套件。
  - 保持与主机上的 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商/模型选择标志。
  - Live 运行会转发对 guest 实用的受支持 QA auth 输入：
    基于环境变量的提供商 key、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保留在仓库根目录下，以便 guest 能通过
    挂载的工作区写回。
  - 在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告 + 摘要以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，用于操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出内容构建一个 npm tarball，在
    Docker 中全局安装它，运行非交互式 OpenAI API key 新手引导，默认配置 Telegram，
    验证启用插件会按需安装运行时依赖，运行 Doctor，并针对模拟的 OpenAI
    端点运行一个本地智能体回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 通过 Discord 运行同一个打包安装
    通道。
- `pnpm test:docker:session-runtime-context`
  - 为嵌入式运行时上下文转录运行确定性的已构建应用 Docker 冒烟测试。
    它会验证隐藏的 OpenClaw 运行时上下文会作为非展示的自定义消息持久化，
    而不是泄露到可见用户回合中，然后植入一个受影响的损坏会话 JSONL，并验证
    `openclaw doctor --fix` 会将其重写到活动分支并创建备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装 OpenClaw 候选包，运行已安装包的
    新手引导，通过已安装的 CLI 配置 Telegram，然后复用
    live Telegram QA 通道，并将该已安装包作为 SUT Gateway 网关。
  - 默认值为 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；设置
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ` 可测试已解析的本地 tarball，而不是
    从 registry 安装。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证源。
    对于 CI/发布自动化，设置
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，以及
    `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果
    `OPENCLAW_QA_CONVEX_SITE_URL` 和一个 Convex 角色密钥存在于 CI 中，
    Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只为此通道覆盖共享的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将此通道暴露为手动维护者工作流
    `NPM Telegram Beta E2E`。它不会在合并时运行。该工作流使用
    `qa-live-shared` 环境和 Convex CI 凭证租约。
- GitHub Actions 还暴露了 `Package Acceptance`，用于针对一个候选包进行旁路产品证明。
  它接受可信 ref、已发布的 npm spec、
  HTTPS tarball URL 加 SHA-256，或来自另一次运行的 tarball 产物，上传
  规范化的 `openclaw-current.tgz` 作为 `package-under-test`，然后使用 smoke、package、product、full 或 custom
  通道 profile 运行现有 Docker E2E 调度器。设置 `telegram_mode=mock-openai` 或 `live-frontier` 可让
  Telegram QA 工作流针对同一个 `package-under-test` 产物运行。
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

- 工件证明会从另一个 Actions 运行下载 tarball 工件：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，使用已配置的 OpenAI 启动 Gateway 网关，然后通过配置编辑启用内置渠道/插件。
  - 验证设置发现会让未配置的插件运行时依赖保持缺失，首次配置的 Gateway 网关或 Doctor 运行会按需安装每个内置插件的运行时依赖，并且第二次重启不会重新安装已激活的依赖。
  - 还会安装一个已知的较旧 npm 基线，在运行 `openclaw update --tag <candidate>` 前启用 Telegram，并验证候选版本的更新后 Doctor 会修复内置渠道运行时依赖，无需 harness 侧 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels 客户机运行原生打包安装更新冒烟测试。每个选中的平台先安装请求的基线包，然后在同一个客户机中运行已安装的 `openclaw update` 命令，并验证已安装版本、更新 Status、Gateway 网关就绪状态，以及一次本地智能体回合。
  - 在迭代单个客户机时使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要工件路径和每条 lane 的 Status。
  - OpenAI lane 默认使用 `openai/gpt-5.5` 作为实时智能体回合证明。若要刻意验证另一个 OpenAI 模型，请传入 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 用主机超时包装长时间本地运行，避免 Parallels 传输停滞耗尽剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 脚本会在 `/tmp/openclaw-parallels-npm-update.*` 下写入嵌套 lane 日志。在假定外层包装器挂起之前，先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在冷启动客户机上，Windows 更新可能会在更新后 Doctor/运行时依赖修复中花费 10 到 15 分钟；只要嵌套 npm 调试日志仍在推进，这仍然是正常的。
  - 不要将这个聚合包装器与单独的 Parallels macOS、Windows 或 Linux 冒烟 lane 并行运行。它们共享虚拟机状态，可能在快照恢复、包服务或客户机 Gateway 网关状态上发生冲突。
  - 更新后证明会运行常规内置插件表面，因为语音、图像生成和媒体理解等能力 facade 是通过内置运行时 API 加载的，即使智能体回合本身只检查一个简单文本响应。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock provider 服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性 Docker 支持的 Tuwunel homeserver 运行 Matrix 实时 QA lane。仅源代码检出可用 — 打包安装不会发布 `qa-lab`。
  - 完整 CLI、profile/场景目录、环境变量和工件布局：[Matrix QA](/zh-CN/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用来自环境变量的 driver 和 SUT bot token，针对真实私有群组运行 Telegram 实时 QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 ID 必须是数字 Telegram 聊天 ID。
  - 支持 `--credential-source convex` 来使用共享池化凭据。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以选择使用池化租约。
  - 任一场景失败时会以非零状态退出。当你想要工件但不想要失败退出码时，使用 `--allow-failures`。
  - 需要同一私有群组中的两个不同 bot，并且 SUT bot 需要公开 Telegram 用户名。
  - 为获得稳定的 bot 到 bot 观察，在两个 bot 的 `@BotFather` 中启用机器人到机器人通信模式，并确保 driver bot 可以观察群组 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 observed-messages 工件。回复场景包含从 driver 发送请求到观察到 SUT 回复的 RTT。

实时传输 lane 共享一个标准契约，避免新传输漂移；每条 lane 的覆盖矩阵位于 [QA overview → 实时传输覆盖范围](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是广泛的合成套件，不属于该矩阵。

### 通过 Convex 共享 Telegram 凭据（v1）

为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）后，QA lab 会从 Convex 支持的池中获取独占租约，在 lane 运行期间对该租约发送心跳，并在关闭时释放租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所选角色的一个密钥：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用于 `ci`
- 凭据角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（CI 中默认为 `ci`，否则为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选跟踪 ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许仅本地开发使用环回 `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常运行中应使用 `https://`。

维护者管理命令（池 add/remove/list）专门需要 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

维护者 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在实时运行前使用 `doctor` 检查 Convex 站点 URL、broker 密钥、端点前缀、HTTP 超时和 admin/list 可达性，且不会打印密钥值。在脚本和 CI 工具中使用 `--json` 获取机器可读输出。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

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

Telegram 类型的 payload 形状：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字 Telegram 聊天 ID 字符串。
- `admin/add` 会针对 `kind: "telegram"` 验证此形状，并拒绝格式错误的 payload。

### 向 QA 添加渠道

新渠道适配器的架构和场景辅助函数名称位于 [QA overview → 添加渠道](/zh-CN/concepts/qa-e2e-automation#adding-a-channel)。最低要求：在共享 `qa-lab` host seam 上实现传输 runner，在插件 manifest 中声明 `qaRunners`，挂载为 `openclaw qa <runner>`，并在 `qa/scenarios/` 下编写场景。

## 测试套件（在哪里运行什么）

可以把这些套件理解为“逐步提高真实性”（同时也提高不稳定性/成本）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：未定向运行使用 `vitest.full-*.config.ts` 分片集，并可能将多项目分片展开为按项目配置以进行并行调度
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的核心/单元清单；UI 单元测试在专用 `unit-ui` 分片中运行
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关鉴权、路由、工具调用、解析、配置）
  - 已知 bug 的确定性回归
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定

<AccordionGroup>
  <Accordion title="项目、分片和限定范围 lane">

    - 未指定目标的 `pnpm test` 会运行十二个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这会降低负载较高机器上的峰值 RSS，并避免 auto-reply/extension 工作让无关套件资源不足。
    - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不实用。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先通过作用域车道分派显式文件/目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可以避免承担完整根项目启动成本。
    - `pnpm test:changed` 默认会把已变更的 git 路径展开为低成本的作用域车道：直接测试编辑、相邻 `*.test.ts` 文件、显式源码映射，以及本地导入图依赖项。Config/Setup/package 编辑不会广泛运行测试，除非你显式使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄范围工作的常规智能本地检查门禁。它会把 diff 分类为 core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling 和 tooling，然后运行匹配的 typecheck、lint 和 guard 命令。它不会运行 Vitest 测试；如需测试证明，请调用 `pnpm test:changed` 或显式 `pnpm test <target>`。仅 release metadata 的版本号提升会运行定向 version/config/root-dependency 检查，并带有一个 guard，用来拒绝顶层 version 字段以外的 package 变更。
    - Live Docker ACP harness 编辑会运行聚焦检查：live Docker auth 脚本的 shell 语法检查，以及 live Docker scheduler dry-run。只有当 diff 限定在 `scripts["test:docker:live-*"]` 时才包含 `package.json` 变更；dependency、export、version 和其他 package 表面编辑仍然使用更广的 guard。
    - 来自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 以及类似纯工具区域的轻导入单元测试会走 `unit-fast` 车道，该车道会跳过 `test/setup-openclaw-runtime.ts`；有状态或运行时较重的文件仍保留在现有车道。
    - 选定的 `plugin-sdk` 和 `commands` helper 源文件也会把 changed-mode 运行映射到这些轻量车道中的显式相邻测试，因此 helper 编辑可以避免为该目录重新运行完整重型套件。
    - `auto-reply` 为顶层 core helpers、顶层 `reply.*` 集成测试以及 `src/auto-reply/reply/**` 子树设置了专用桶。CI 还会进一步把 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，避免一个导入较重的桶占用完整 Node 尾部时间。

  </Accordion>

  <Accordion title="嵌入式运行器覆盖率">

    - 当你更改 message-tool 发现输入或 compaction 运行时
      上下文时，请保留两层覆盖。
    - 为纯 routing 和 normalization
      边界添加聚焦 helper 回归测试。
    - 保持嵌入式运行器集成套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些套件会验证 scoped ids 和 compaction 行为仍然通过真实的
      `run.ts` / `compact.ts` 路径流动；仅 helper 的测试
      不能充分替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置固定 `isolate: false`，并在根项目、e2e 和 live 配置中使用
      非隔离运行器。
    - 根 UI 车道保留其 `jsdom` 设置和优化器，但也运行在
      共享的非隔离运行器上。
    - 每个 `pnpm test` 分片都从共享 Vitest 配置继承相同的 `threads` + `isolate: false`
      默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node
      进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。
      设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与原始 V8
      行为对比。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示一个 diff 触发了哪些架构车道。
    - pre-commit hook 仅负责格式化。它会重新暂存已格式化文件，
      不会运行 lint、typecheck 或测试。
    - 在交接或 push 之前，当你需要智能本地检查门禁时，
      显式运行 `pnpm check:changed`。
    - `pnpm test:changed` 默认会通过低成本作用域车道分派。只有当 agent
      判断 harness、config、package 或 contract 编辑确实需要更广的
      Vitest 覆盖时，才使用
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由
      行为，只是使用更高的 worker 上限。
    - 本地 worker 自动扩缩容有意保持保守，并会在主机负载平均值已经很高时退避，
      因此默认情况下多个并发
      Vitest 运行造成的影响更小。
    - 基础 Vitest 配置会把 projects/config 文件标记为
      `forceRerunTriggers`，因此当测试
      线路变更时，changed-mode 重新运行仍能保持正确。
    - 该配置会在受支持的主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；
      如果你希望直接性能分析使用一个显式缓存位置，请设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest import-duration 报告以及
      import-breakdown 输出。
    - `pnpm test:perf:imports:changed` 会把同一性能分析视图限定到
      自 `origin/main` 以来变更的文件。
    - 分片计时数据会写入 `.artifacts/vitest-shard-timings.json`。
      全配置运行使用配置路径作为键；include-pattern CI
      分片会追加分片名称，以便单独跟踪过滤后的分片。
    - 当某个热点测试仍把大部分时间花在启动导入上时，
      请把重型依赖放在狭窄的本地 `*.runtime.ts` 接缝之后，并
      直接 mock 该接缝，而不是深度导入运行时 helper，只为了
      把它们传给 `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将已提交
      diff 的路由后 `test:changed` 与原生根项目路径进行对比，
      并打印 wall time 与 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过把 changed file list 路由到
      `scripts/test-projects.mjs` 和根 Vitest 配置来对当前
      dirty tree 做基准测试。
    - `pnpm test:perf:profile:main` 会为
      Vitest/Vite 启动和 transform 开销写入主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件并行时为
      单元套件写入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制使用一个 worker
- 范围：
  - 默认启动一个启用诊断的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成 gateway 消息、内存和大载荷 churn
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化 helpers
  - 断言 recorder 保持有界、合成 RSS 样本保持低于 pressure budget，并且每个会话队列深度回落到零
- 预期：
  - CI 安全且不需要密钥
  - 这是用于 stability-regression 跟进的窄车道，不是完整 Gateway 网关套件的替代品

### E2E（Gateway 网关 smoke）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 和 `isolate: false`，与仓库其余部分一致。
  - 使用自适应 workers（CI：最多 2 个，本地：默认 1 个）。
  - 默认以 silent 模式运行，以减少 console I/O 开销。
- 实用覆盖：
  - `OPENCLAW_E2E_WORKERS=<n>` 强制 worker 数量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 重新启用详细 console 输出。
- 范围：
  - 多实例 gateway 端到端行为
  - WebSocket/HTTP 表面、node 配对以及更重的网络
- 预期：
  - 在 CI 中运行（当 pipeline 中启用时）
  - 不需要真实密钥
  - 比单元测试有更多移动部件（可能更慢）

### E2E：OpenShell 后端 smoke

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动隔离的 OpenShell gateway
  - 从临时本地 Dockerfile 创建沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证 remote-canonical 文件系统行为
- 预期：
  - 仅 opt-in；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 以及可工作的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 gateway 和沙箱
- 实用覆盖：
  - `OPENCLAW_E2E_OPENSHELL=1` 在手动运行更广的 e2e 套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 指向非默认 CLI binary 或 wrapper script

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型在 _今天_ 使用真实凭证是否确实可用？”
  - 捕获提供商格式变更、tool-calling 特性差异、auth 问题和 rate limit 行为
- 预期：
  - 设计上不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会产生费用 / 使用 rate limits
  - 优先运行缩窄后的子集，而不是“全部”
- Live 运行会 source `~/.profile` 以获取缺失的 API keys。
- 默认情况下，live 运行仍会隔离 `HOME`，并把 config/auth material 复制到临时测试 home，这样单元 fixture 就不能改变你的真实 `~/.openclaw`。
- 仅当你有意需要 live tests 使用你的真实 home directory 时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：它保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` notice，并静音 gateway bootstrap logs/Bonjour chatter。如果你想恢复完整 startup logs，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key rotation（特定提供商）：设置 `*_API_KEYS`，格式为逗号/分号分隔，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可以通过 `OPENCLAW_LIVE_*_KEY` 进行 per-live override；测试会在 rate limit responses 时重试。
- 进度/heartbeat 输出：
  - Live 套件现在会向 stderr 发出进度行，因此即使 Vitest console capture 较安静，长时间提供商调用也能明显显示仍在活跃。
  - `vitest.live.config.ts` 禁用 Vitest console interception，因此提供商/gateway 进度行会在 live 运行期间立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整 direct-model heartbeats。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 gateway/probe heartbeats。

## 我应该运行哪个套件？

使用这个决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果你改动很多，也运行 `pnpm test:coverage`）
- 触及 gateway networking / WS protocol / pairing：添加 `pnpm test:e2e`
- 调试“我的 bot 宕机了” / 特定提供商失败 / tool calling：运行缩窄后的 `pnpm test:live`

## Live（触网）测试

有关真实模型矩阵、CLI 后端冒烟测试、ACP 冒烟测试、Codex 应用服务器
harness，以及所有媒体提供商真实服务测试（Deepgram、BytePlus、ComfyUI、图像、
音乐、视频、媒体 harness），以及真实运行的凭证处理，请参阅
[测试 —— 真实服务套件](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“可在 Linux 中工作”检查）

这些 Docker 运行器分为两类：

- 真实模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只在仓库 Docker 镜像内运行对应的配置键真实服务文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（如果已挂载，也会读取 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 真实服务运行器默认使用较小的冒烟上限，以便完整 Docker 扫描保持可行：
  `test:docker:live-models` 默认使用 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认使用 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在你明确需要更大的穷尽式扫描时，才覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次真实服务 Docker 镜像，再通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包一次为 npm tarball，然后构建/复用两个 `scripts/e2e/Dockerfile` 镜像。裸镜像只是用于安装/更新/插件依赖通道的 Node/Git 运行器；这些通道会挂载预构建的 tarball。功能镜像会把同一个 tarball 安装到 `/app`，用于已构建应用功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行选定计划。聚合流程使用加权本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会避免繁重的真实服务、npm 安装和多服务通道同时全部启动。如果单个通道比当前上限更重，调度器仍可在池为空时启动它，并让它单独运行，直到容量再次可用。默认值为 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有当 Docker 主机有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。运行器默认执行 Docker 预检，移除陈旧的 OpenClaw E2E 容器，每 30 秒打印一次状态，将成功通道耗时存储在 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中使用这些耗时优先启动更长的通道。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不构建或运行 Docker 的情况下打印加权通道清单，或使用 `node scripts/test-docker-all.mjs --plan-json` 打印选定通道、包/镜像需求和凭证的 CI 计划。
- `Package Acceptance` 是 GitHub 原生的包门禁，用于验证“这个可安装的 tarball 作为产品是否可用？”它会从 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一个候选包，将其上传为 `package-under-test`，然后针对这个精确的 tarball 运行可复用的 Docker E2E 通道，而不是重新打包所选 ref。`workflow_ref` 选择受信任的工作流/harness 脚本，而 `package_ref` 在 `source=ref` 时选择要打包的源提交/分支/标签；这使当前验收逻辑能够验证较旧的受信任提交。配置按覆盖面排序：`smoke` 是快速安装/渠道/智能体加 Gateway 网关/配置，`package` 是包/更新/插件契约，也是大多数 Parallels 包/更新覆盖的默认原生替代，`product` 添加 MCP 渠道、cron/子智能体清理、OpenAI Web 搜索和 OpenWebUI，`full` 使用 OpenWebUI 运行发布路径 Docker 分块。发布验证运行一个自定义包差异（`bundled-channel-deps-compat plugins-offline`），外加 Telegram 包 QA，因为发布路径 Docker 分块已经覆盖重叠的包/更新/插件通道。从构件生成的定向 GitHub Docker 重跑命令会在可用时包含先前的包构件和已准备镜像输入，因此失败通道可以避免重新构建包和镜像。
- 构建和发布检查会在 tsdown 后运行 `scripts/check-cli-bootstrap-imports.mjs`。该守卫从 `dist/entry.js` 和 `dist/cli/run-main.js` 遍历静态构建图，如果命令分派前的启动阶段导入了 Commander、提示 UI、undici 或日志等包依赖，就会失败；它还会让打包的 Gateway 网关运行分块保持在预算内，并拒绝对已知冷 Gateway 网关路径的静态导入。打包 CLI 冒烟测试还覆盖根帮助、onboard 帮助、doctor 帮助、Status、配置架构，以及模型列表命令。
- Package Acceptance 旧版兼容性上限为 `2026.4.25`（包括 `2026.4.25-beta.*`）。在该截止版本之前，harness 只容忍已发布包的元数据缺口：省略的私有 QA 清单条目、缺失的 `gateway install --wrapper`、tarball 派生 git fixture 中缺失的补丁文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。对于 `2026.4.25` 之后的包，这些路径都是严格失败。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

真实模型 Docker 运行器还只会绑定挂载所需的 CLI 认证主目录（或在运行未缩小时挂载所有支持的主目录），然后在运行前将其复制到容器主目录，使外部 CLI OAuth 可以刷新令牌，而不改变主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，并通过 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 对 Droid/OpenCode 做严格覆盖）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + 开发智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性冒烟测试：`pnpm qa:otel:smoke` 是私有 QA 源码检出通道。它有意不属于软件包 Docker 发布通道，因为 npm tarball 会省略 QA Lab。
- Open WebUI 实时冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导/渠道/智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包好的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证 Doctor 是否修复已启用插件的运行时依赖，并运行一次模拟的 OpenAI 智能体轮次。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机重建，或用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- 更新渠道切换冒烟测试：`pnpm test:docker:update-channel-switch` 会在 Docker 中全局安装打包好的 OpenClaw tarball，从软件包 `stable` 切换到 git `dev`，验证持久化的渠道和插件更新后工作正常，然后切回软件包 `stable` 并检查更新 Status。
- 会话运行时上下文冒烟测试：`pnpm test:docker:session-runtime-context` 会验证隐藏运行时上下文转录持久化，以及 Doctor 对受影响的重复提示词重写分支的修复。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前树，在隔离的 home 中用 `bun install -g` 安装它，并验证 `openclaw infer image providers --json` 返回内置图像提供商而不是挂起。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过主机构建，或用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 会在它的 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认以 npm `latest` 作为升级到候选 tarball 之前的 stable 基线。本地可用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或在 GitHub 上用 Install Smoke 工作流的 `update_baseline_version` 输入覆盖。非 root 安装器检查会保留隔离的 npm 缓存，避免 root 拥有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重复运行时复用 root/update/direct-npm 缓存。
- Install Smoke CI 会用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；需要覆盖直接 `npm install -g` 时，在本地运行脚本且不带该环境变量。
- 智能体删除共享工作区 CLI 冒烟测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认构建根 Dockerfile 镜像，在隔离容器 home 中为两个智能体填充一个工作区，运行 `agents delete --json`，并验证有效 JSON 以及保留工作区的行为。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关网络（两个容器，WS 身份验证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照冒烟测试：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）会构建源码 E2E 镜像以及一个 Chromium 层，使用原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP 角色快照覆盖链接 URL、游标提升的可点击项、iframe 引用和框架元数据。
- OpenAI Responses `web_search` minimal 推理回归：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟 OpenAI 服务器，验证 `web_search` 将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制提供商 schema 拒绝，并检查原始详情出现在 Gateway 网关日志中。
- MCP 渠道桥接（已填充的 Gateway 网关 + stdio 桥接 + 原始 Claude 通知帧冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi 配置文件 allow/deny 冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + 在隔离 cron 和一次性 subagent 运行后拆卸 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟测试、ClawHub kitchen-sink 安装/卸载、marketplace 更新，以及 Claude-bundle 启用/检查）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳过 ClawHub 块，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认的 kitchen-sink 软件包/运行时组合。没有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` 时，测试会使用封闭的本地 ClawHub fixture 服务器。
- 插件更新未变化冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认构建一个小型 Docker runner 镜像，在主机上构建并打包一次 OpenClaw，然后把该 tarball 挂载到每个 Linux 安装场景中。用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，在一次新的本地构建后用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过主机重建，或用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。完整 Docker 聚合和发布路径内置渠道分块会先预打包一次该 tarball，然后将内置渠道检查拆分到独立通道，包括 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的单独更新通道。发布分块会把渠道冒烟测试、更新目标以及设置/运行时契约拆分为 `bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`；聚合的 `bundled-channels` 分块仍可用于手动重跑。发布工作流还会拆分提供商安装器分块和内置插件安装/卸载分块；旧版 `package-update`、`plugins-runtime` 和 `plugins-integrations` 分块仍作为手动重跑的聚合别名保留。直接运行内置通道时，用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 缩小渠道矩阵，或用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 缩小更新场景。每场景 Docker 运行默认使用 `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`；多目标更新场景默认使用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`。该通道还会验证 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 会抑制 Doctor/运行时依赖修复。
- 迭代时可通过禁用无关场景来缩小内置插件运行时依赖，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

要手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置后，像 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 这样的套件专用镜像覆盖仍然优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果本地尚不存在，脚本会拉取它。QR 和安装器 Docker 测试保留自己的 Dockerfile，因为它们验证的是软件包/安装行为，而不是共享的已构建应用运行时。

实时模型 Docker runner 还会以只读方式 bind-mount 当前检出，
并在容器内将它暂存到临时 workdir。这会让运行时
镜像保持精简，同时仍然针对你确切的本地源码/配置运行 Vitest。
暂存步骤会跳过大型本地专用缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或
Gradle 输出目录，这样 Docker 实时运行就不会花费数分钟复制
机器专用产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关实时探测就不会在
容器内启动真实的 Telegram/Discord 等渠道 worker。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要从该 Docker 通道
缩小或排除 Gateway 网关实时覆盖时，也要传入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是更高层的兼容性冒烟测试：它会启动一个启用了
OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，
再启动一个 pinned Open WebUI 容器连接该 Gateway 网关，
通过 Open WebUI 登录，验证 `/api/models` 暴露 `openclaw/default`，
然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一个
真实聊天请求。
首次运行可能明显更慢，因为 Docker 可能需要拉取
Open WebUI 镜像，Open WebUI 也可能需要完成自己的冷启动设置。
该通道需要可用的实时模型密钥，而 `OPENCLAW_PROFILE_FILE`
（默认是 `~/.profile`）是在 Docker 化运行中提供它的主要方式。
成功运行会打印一个小型 JSON 负载，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 有意保持确定性，不需要真实的
Telegram、Discord 或 iMessage 账号。它会启动一个已填充的 Gateway 网关
容器，启动第二个容器并生成 `openclaw mcp serve`，然后
验证路由会话发现、转录读取、附件元数据、
实时事件队列行为、出站发送路由，以及通过真实 stdio MCP 桥接发出的 Claude 风格渠道 +
权限通知。通知检查会直接检查原始 stdio MCP 帧，
因此该冒烟测试验证的是桥接实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要实时
模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实 stdio MCP 探测服务器，
通过嵌入式 Pi bundle MCP 运行时物化该服务器，
执行工具，然后验证 `coding` 和 `messaging` 保留
`bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会过滤它们。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要实时模型
密钥。它会启动一个已填充的 Gateway 网关和真实 stdio MCP 探测服务器，运行一个
隔离 cron 轮次和一个 `/subagents spawn` 一次性子轮次，然后验证
MCP 子进程在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归/调试工作流。ACP 线程路由验证可能还会再次需要它，所以不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认值：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认值：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认值：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 仅验证从 `OPENCLAW_PROFILE_FILE` source 的环境变量，使用临时配置/工作区目录，且不挂载外部 CLI 凭证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认值：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内缓存 CLI 安装
- `$HOME` 下的外部 CLI 凭证目录/文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 收窄的提供商运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 可用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于收窄运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内筛选提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于在不需要重新构建的重复运行中复用现有 `openclaw:local-live` 镜像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自配置文件存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关向 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

文档编辑后运行文档检查：`pnpm check:docs`。
如果还需要检查页内标题，请运行完整的 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归（CI 安全）

这些是不使用真实提供商的“真实流水线”回归：

- Gateway 网关工具调用（模拟 OpenAI，真实 Gateway 网关 + 智能体循环）：`src/gateway/gateway.test.ts`（用例："runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，写入配置 + 强制执行凭证）：`src/gateway/gateway.test.ts`（用例："runs wizard over ws and writes auth token config"）

## 智能体可靠性评估（Skills）

我们已经有一些 CI 安全测试，其行为类似“智能体可靠性评估”：

- 通过真实 Gateway 网关 + 智能体循环进行模拟工具调用（`src/gateway/gateway.test.ts`）。
- 端到端向导流程，用于验证会话接线和配置效果（`src/gateway/gateway.test.ts`）。

Skills 仍然缺少的内容（见 [Skills](/zh-CN/tools/skills)）：

- **决策：** 当提示词中列出 Skills 时，智能体是否会选择正确的 skill（或避开不相关的 skill）？
- **合规：** 智能体在使用前是否读取 `SKILL.md`，并遵循必需的步骤/参数？
- **工作流契约：** 断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来评估应首先保持确定性：

- 使用模拟提供商的场景运行器，用于断言工具调用 + 顺序、skill 文件读取和会话接线。
- 一小套以 skill 为中心的场景（使用 vs 避免、门控、提示词注入）。
- 可选实时评估（可选启用，通过环境变量门控）仅在 CI 安全套件到位后再添加。

## 契约测试（插件和渠道形状）

契约测试验证每个已注册插件和渠道是否符合其接口契约。它们会遍历所有已发现的插件，并运行一套形状和行为断言。默认的 `pnpm test` 单元测试通道会有意跳过这些共享接口和冒烟文件；当你触碰共享渠道或提供商表面时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、名称、能力）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息载荷结构
- **inbound** - 入站消息处理
- **actions** - 渠道操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/花名册 API
- **group-policy** - 群组策略强制执行

### 提供商 Status 契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道 Status 探测
- **registry** - 插件注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 凭证流程契约
- **auth-choice** - 凭证选择/选取
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状/接口
- **wizard** - 设置向导

### 何时运行

- 更改 plugin-sdk 导出或子路径后
- 添加或修改渠道或提供商插件后
- 重构插件注册或发现后

契约测试会在 CI 中运行，并且不需要真实 API 密钥。

## 添加回归（指南）

当你修复实时运行中发现的提供商/模型问题时：

- 尽可能添加 CI 安全回归（模拟/stub 提供商，或捕获确切的请求形状转换）
- 如果它本质上只能实时验证（速率限制、凭证策略），请保持实时测试范围狭窄，并通过环境变量可选启用
- 优先针对能捕获该 bug 的最小层级：
  - 提供商请求转换/重放 bug → 直接模型测试
  - Gateway 网关会话/历史/工具流水线 bug → Gateway 网关实时冒烟测试或 CI 安全的 Gateway 网关模拟测试
- SecretRef 遍历护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）为每个 SecretRef 类派生一个采样目标，然后断言包含遍历段的 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会故意在未分类的目标 id 上失败，以便新类别不能被静默跳过。

## 相关

- [实时测试](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)
