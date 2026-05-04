---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商缺陷添加回归测试
    - 调试 Gateway 网关和智能体行为
summary: 测试工具包：单元/e2e/live 套件、Docker 运行器，以及每个测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-05-04T06:33:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad724e3879d1d4dec21c4ea97e2fd5724c47269c1084c558a09f51bd72afc6a4
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三个 Vitest 套件（单元/集成、e2e、live）和少量 Docker 运行器。本文档是一份“我们如何测试”指南：

- 每个套件覆盖什么（以及它有意 _不_ 覆盖什么）。
- 常见工作流（本地、推送前、调试）应运行哪些命令。
- live 测试如何发现凭证并选择模型/提供商。
- 如何为真实世界的模型/提供商问题添加回归测试。

<Note>
**QA 栈（qa-lab、qa-channel、live 传输通道）**单独记录在：

- [QA overview](/zh-CN/concepts/qa-e2e-automation) — 架构、命令界面、场景编写。
- [Matrix QA](/zh-CN/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的参考。
- [QA channel](/zh-CN/channels/qa-channel) — 由仓库支持的场景使用的合成传输插件。

本页涵盖常规测试套件以及 Docker/Parallels 运行器。下面的 QA 专用运行器部分（[QA 专用运行器](#qa-specific-runners)）列出了具体的 `qa` 调用，并指回上面的参考资料。
</Note>

## 快速开始

大多数时候：

- 完整门禁（推送前预期运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在资源充足的机器上更快运行本地完整套件：`pnpm test:max`
- 直接 Vitest 监听循环：`pnpm test:watch`
- 直接文件定位现在也会路由插件/渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代单个失败时，优先使用定向运行。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你触碰测试或想要额外信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

调试真实提供商/模型时（需要真实凭证）：

- Live 套件（模型 + Gateway 网关工具/图像探测）：`pnpm test:live`
- 静默定位一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 运行时性能报告：调度 `OpenClaw Performance`，使用
  `live_gpt54=true` 执行一次真实的 `openai/gpt-5.4` 智能体轮次，或使用
  `deep_profile=true` 生成 Kova CPU/堆/跟踪工件。每日定时运行会在配置
  `CLAWGRIT_REPORTS_TOKEN` 时将 mock-provider、deep-profile 和 GPT 5.4 通道工件发布到
  `openclaw/clawgrit-reports`。mock-provider 报告还包含源码级 Gateway 网关启动、内存、
  插件压力、重复 fake-model hello-loop，以及 CLI 启动数据。
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 每个选定模型现在会运行一次文本轮次和一个小型文件读取式探测。
    元数据声明支持 `image` 输入的模型也会运行一次小型图像轮次。
    隔离提供商失败时，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用额外探测。
  - CI 覆盖率：每日 `OpenClaw Scheduled Live And E2E Checks` 和手动
    `OpenClaw Release Checks` 都会以 `include_live_suites: true` 调用可复用 live/E2E 工作流，其中包含按提供商分片的独立 Docker live 模型矩阵任务。
  - 对于聚焦的 CI 重跑，调度 `OpenClaw Live And E2E Checks (Reusable)`，
    并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和它的定时/发布调用方。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 针对 Codex app-server 路径运行 Docker live 通道，使用 `/codex bind` 绑定一个合成
    Slack 私信，执行 `/codex fast` 和
    `/codex permissions`，然后验证纯文本回复和图像附件通过原生插件绑定而不是 ACP 路由。
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`
  - 通过插件拥有的 Codex app-server harness 运行 Gateway 网关智能体轮次，
    验证 `/codex status` 和 `/codex models`，并默认执行图像、
    cron MCP、子智能体和 Guardian 探测。隔离其他 Codex app-server 失败时，可用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 禁用子智能体探测。若要进行聚焦的子智能体检查，禁用其他探测：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置了 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则它会在子智能体探测后退出。
- Crestodian 救援命令冒烟测试：`pnpm test:live:crestodian-rescue-channel`
  - 对消息渠道救援命令界面的选择加入式双保险检查。
    它会执行 `/crestodian status`，排队一个持久模型变更，
    回复 `/crestodian yes`，并验证审计/配置写入路径。
- Crestodian 规划器 Docker 冒烟测试：`pnpm test:docker:crestodian-planner`
  - 在没有配置的容器中运行 Crestodian，`PATH` 上有一个假的 Claude CLI，
    并验证模糊规划器回退会转换为经过审计的类型化配置写入。
- Crestodian 首次运行 Docker 冒烟测试：`pnpm test:docker:crestodian-first-run`
  - 从空的 OpenClaw 状态目录开始，将裸 `openclaw` 路由到
    Crestodian，应用设置/模型/智能体/Discord 插件 + SecretRef 写入，
    验证配置，并验证审计条目。同一个 Ring 0 设置路径也在 QA Lab 中由
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot/Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行
  `openclaw models list --provider moonshot --json`，然后对
  `moonshot/kimi-k2.6` 运行一个隔离的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  验证 JSON 报告 Moonshot/K2.6，且助手转录存储了规范化的 `usage.cost`。

<Tip>
当你只需要一个失败用例时，优先通过下面描述的 allowlist 环境变量缩小 live 测试范围。
</Tip>

## QA 专用运行器

当你需要 QA-lab 真实度时，这些命令位于主测试套件旁边：

CI 在专用工作流中运行 QA Lab。智能体一致性嵌套在
`QA-Lab - All Lanes` 和发布验证下，不是独立的 PR 工作流。
广泛验证应使用 `Full Release Validation`，并设置
`rerun_group=qa-parity` 或发布检查 QA 组。`QA-Lab - All Lanes`
每晚在 `main` 上运行，也可通过手动调度运行，并将 mock parity 通道、live
Matrix 通道、Convex 管理的 live Telegram 通道和 Convex 管理的 live Discord
通道作为并行任务运行。定时 QA 和发布检查会显式传递 Matrix
`--profile fast`，而 Matrix CLI 和手动工作流输入默认值仍为 `all`；手动调度可以将
`all` 分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和
`e2ee-cli` 任务。`OpenClaw Release Checks` 在发布批准前运行 parity 以及快速
Matrix 和 Telegram 通道，发布传输检查使用 `mock-openai/gpt-5.5`，以保持确定性并避免正常的提供商插件启动。这些 live 传输
Gateway 网关会禁用记忆搜索；记忆行为仍由 QA parity 套件覆盖。

完整发布 live 媒体分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已经包含
`ffmpeg` 和 `ffprobe`。Docker live 模型/后端分片使用共享的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像，该镜像会针对每个选定提交构建一次，
然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取它，而不是在每个分片内重新构建。

- `pnpm openclaw qa suite`
  - 直接在主机上运行由仓库支持的 QA 场景。
  - 默认使用隔离的 Gateway 网关工作进程并行运行多个选定场景。`qa-channel` 默认并发数为 4（受选定场景数量限制）。使用 `--concurrency <count>` 调整工作进程数量，或使用 `--concurrency 1` 启用较旧的串行通道。
  - 任一场景失败时以非零状态退出。当你想要保留产物但不希望退出码失败时，请使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 会启动一个由本地 AIMock 支持的提供商服务器，用于实验性 fixture 和协议模拟覆盖，同时不会替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm test:gateway:cpu-scenarios`
  - 运行 Gateway 网关启动基准测试，以及一组小型模拟 QA Lab 场景包（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`），并在 `.artifacts/gateway-cpu-scenarios/` 下写入合并后的 CPU 观察摘要。
  - 默认只标记持续的高 CPU 观察结果（`--cpu-core-warn` 加 `--hot-wall-warn-ms`），因此短暂的启动峰值会作为指标记录，而不会看起来像持续数分钟的 Gateway 网关占满回归。
  - 使用已构建的 `dist` 产物；当检出内容中尚无最新运行时输出时，请先运行构建。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux 虚拟机中运行同一套 QA 套件。
  - 保持与主机上的 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商/模型选择标志。
  - 现场运行会转发适合来宾环境的受支持 QA 凭证输入：基于环境变量的提供商密钥、QA 现场提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须位于仓库根目录下，以便来宾环境能通过挂载的工作区写回。
  - 在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告和摘要，以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动由 Docker 支持的 QA 站点，用于操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出内容构建 npm tarball，在 Docker 中全局安装它，运行非交互式 OpenAI API key 新手引导，默认配置 Telegram，验证打包后的插件运行时在不进行启动依赖修复的情况下可以加载，运行 Doctor，并针对模拟的 OpenAI 端点运行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可用 Discord 运行同一个打包安装通道。
- `pnpm test:docker:session-runtime-context`
  - 为嵌入式运行时上下文转录运行一个确定性的已构建应用 Docker smoke 测试。它会验证隐藏的 OpenClaw 运行时上下文被持久化为非显示自定义消息，而不是泄漏到可见的用户轮次中；随后种入一个受影响的损坏会话 JSONL，并验证 `openclaw doctor --fix` 会将其重写到当前分支并创建备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个 OpenClaw 包候选版本，运行已安装包的新手引导，通过已安装的 CLI 配置 Telegram，然后复用现场 Telegram QA 通道，并将该已安装包作为被测系统 Gateway 网关。
  - 默认值为 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；设置 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或 `OPENCLAW_CURRENT_PACKAGE_TGZ` 可测试已解析的本地 tarball，而不是从注册表安装。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境凭证或 Convex 凭证源。对于 CI/发布自动化，请设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，以及 `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密钥存在于 CI 中，Docker 包装器会自动选择 Convex。
  - 包装器会先在主机上验证 Telegram 或 Convex 凭证环境变量，然后再执行 Docker 构建/安装工作。仅在有意调试凭证前置设置时，才设置 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只为此通道覆盖共享的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将此通道公开为手动维护者工作流 `NPM Telegram Beta E2E`。它不会在合并时运行。该工作流使用 `qa-live-shared` 环境和 Convex CI 凭证租约。
- GitHub Actions 还公开 `Package Acceptance`，用于针对一个候选包进行旁路产品验证。它接受受信任的 ref、已发布的 npm spec、HTTPS tarball URL 加 SHA-256，或来自另一次运行的 tarball 产物，将规范化后的 `openclaw-current.tgz` 作为 `package-under-test` 上传，然后使用 smoke、package、product、full 或 custom 通道配置运行现有的 Docker E2E 调度器。设置 `telegram_mode=mock-openai` 或 `live-frontier` 可让 Telegram QA 工作流针对同一个 `package-under-test` 产物运行。
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

- 产物验证会从另一次 Actions 运行下载 tarball 产物：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，启动已配置 OpenAI 的 Gateway 网关，然后通过配置编辑启用内置渠道/插件。
  - 验证设置发现会让未配置的可下载插件保持缺席；首次配置后的 Doctor 修复会显式安装每个缺失的可下载插件；第二次重启不会运行隐藏的依赖修复。
  - 还会安装一个已知的较旧 npm 基线版本，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本的更新后 Doctor 会清理旧版插件依赖残留，而不需要 harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 在 Parallels 来宾系统中运行原生打包安装更新 smoke 测试。每个选定平台会先安装请求的基线包，然后在同一来宾系统中运行已安装的 `openclaw update` 命令，并验证已安装版本、更新状态、Gateway 网关就绪状态，以及一次本地智能体轮次。
  - 在针对一个来宾系统迭代时使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要产物路径和每个通道的状态。
  - OpenAI 通道默认使用 `openai/gpt-5.5` 进行现场智能体轮次验证。在有意验证另一个 OpenAI 模型时，传入 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 使用主机超时包装长时间本地运行，避免 Parallels 传输停滞耗尽剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 脚本会在 `/tmp/openclaw-parallels-npm-update.*` 下写入嵌套通道日志。在假定外层包装器挂起之前，请先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - Windows 更新在冷启动来宾系统上可能会花费 10 到 15 分钟执行更新后 Doctor 和包更新工作；只要嵌套 npm 调试日志仍在推进，这仍然是健康状态。
  - 不要将这个聚合包装器与单独的 Parallels macOS、Windows 或 Linux smoke 通道并行运行。它们共享虚拟机状态，可能在快照还原、包服务或来宾 Gateway 网关状态上发生冲突。
  - 更新后验证会运行常规的内置插件表面，因为即使智能体轮次本身只检查一个简单文本响应，语音、图像生成和媒体理解等能力门面也会通过内置运行时 API 加载。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接的协议 smoke 测试。
- `pnpm openclaw qa matrix`
  - 针对一次性 Docker 支持的 Tuwunel homeserver 运行 Matrix 现场 QA 通道。仅适用于源代码检出；打包安装不包含 `qa-lab`。
  - 完整 CLI、profile/场景目录、环境变量和产物布局：[Matrix QA](/zh-CN/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用来自环境变量的 driver 和被测系统 bot token，针对真实私有群组运行 Telegram 现场 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是数字形式的 Telegram 聊天 id。
  - 支持 `--credential-source convex` 以使用共享池化凭证。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以选择使用池化租约。
  - 任一场景失败时以非零状态退出。当你想要保留产物但不希望退出码失败时，请使用 `--allow-failures`。
  - 需要同一私有群组中的两个不同 bot，且被测系统 bot 需公开 Telegram 用户名。
  - 为了稳定观察 bot 到 bot 通信，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保 driver bot 可以观察群组中的 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 observed-messages 产物。回复场景包含从 driver 发送请求到观察到被测系统回复的 RTT。

现场传输通道共享一个标准合约，确保新传输不会偏离；每个通道的覆盖矩阵位于 [QA overview → 现场传输覆盖](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是广泛的合成套件，不属于该矩阵。

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的池中获取独占租约，在通道运行期间对该租约发送 Heartbeat，并在关闭时释放租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所选角色对应的一个密钥：
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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许 local loopback `http://` Convex URL，仅用于本地开发。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常操作中应使用 `https://`。

维护者管理命令（池添加/移除/列表）明确需要 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

维护者 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

使用 `doctor` 在实时运行前检查 Convex 站点 URL、broker 密钥、endpoint 前缀、HTTP 超时以及 admin/list 可达性，且不会打印密钥值。在脚本和 CI 工具中使用 `--json` 获取机器可读输出。

默认 endpoint 契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 耗尽/可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /admin/add`（仅限维护者密钥）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅限维护者密钥）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅限维护者密钥）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram kind 的 payload 形状：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字形式的 Telegram chat id 字符串。
- `admin/add` 会针对 `kind: "telegram"` 校验此形状，并拒绝格式错误的 payload。

### 向 QA 添加渠道

新渠道适配器的架构和场景辅助程序命名位于 [QA overview → 添加渠道](/zh-CN/concepts/qa-e2e-automation#adding-a-channel)。最低要求：在共享的 `qa-lab` host seam 上实现 transport runner，在插件清单中声明 `qaRunners`，挂载为 `openclaw qa <runner>`，并在 `qa/scenarios/` 下编写场景。

## 测试套件（运行位置）

可以把这些套件理解为“真实性递增”（同时不稳定性/成本也递增）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：非定向运行使用 `vitest.full-*.config.ts` 分片集，并可能把多项目分片扩展为按项目的配置，以便并行调度
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的 core/unit 清单；UI 单元测试在专用的 `unit-ui` 分片中运行
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 针对已知错误的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
  - 解析器和公开 surface loader 测试必须用生成的小型插件 fixture 证明广义 `api.js` 和
    `runtime-api.js` 回退行为，而不是使用真实内置插件源 API。真实插件 API 加载应放在
    插件所有的契约/集成套件中。

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - 非定向 `pnpm test` 会运行十二个较小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个庞大的原生根项目进程。这会降低高负载机器上的峰值 RSS，并避免 auto-reply/extension 工作拖慢无关套件。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 项目图，因为多分片 watch loop 不实用。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先通过作用域化 lane 路由显式文件/目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可以避免支付完整根项目启动成本。
    - `pnpm test:changed` 默认会把已变更的 git 路径扩展到廉价的作用域化 lane：直接测试编辑、同级 `*.test.ts` 文件、显式源映射，以及本地 import graph 依赖项。配置/设置/package 编辑不会广泛运行测试，除非你显式使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄范围工作的常规智能本地检查门禁。它会把 diff 分类为 core、core 测试、extensions、extension 测试、apps、docs、release 元数据、live Docker tooling 和 tooling，然后运行匹配的 typecheck、lint 和 guard 命令。它不会运行 Vitest 测试；要获得测试证明，请调用 `pnpm test:changed` 或显式 `pnpm test <target>`。仅 release 元数据的版本 bump 会运行定向版本/配置/root-dependency 检查，并带有一个 guard，用于拒绝顶层版本字段之外的 package 变更。
    - Live Docker ACP harness 编辑会运行聚焦检查：live Docker auth 脚本的 shell 语法，以及 live Docker scheduler dry-run。仅当 diff 限定在 `scripts["test:docker:live-*"]` 时才包含 `package.json` 变更；dependency、export、version 和其他 package-surface 编辑仍使用更宽的 guard。
    - 来自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 以及类似纯工具区域的 import-light 单元测试会路由到 `unit-fast` lane，该 lane 会跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件保留在现有 lane 上。
    - 选定的 `plugin-sdk` 和 `commands` helper 源文件也会把 changed-mode 运行映射到这些轻量 lane 中的显式同级测试，因此 helper 编辑可以避免为该目录重新运行完整重型套件。
    - `auto-reply` 为顶层 core helpers、顶层 `reply.*` 集成测试以及 `src/auto-reply/reply/**` 子树提供了专用 bucket。CI 还会进一步把 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，避免某个 import-heavy bucket 占用完整的 Node 尾部时间。
    - 常规 PR/main CI 会有意跳过 extension 批量扫描和仅 release 使用的 `agentic-plugins` 分片。Full Release Validation 会针对 release candidates 调度单独的 `Plugin Prerelease` 子工作流，用于这些 plugin/extension-heavy 套件。

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - 当你更改 message-tool 发现输入或 compaction 运行时
      context 时，请保留两级覆盖。
    - 为纯路由和规范化边界添加聚焦的 helper 回归测试。
    - 保持 embedded runner 集成套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些套件会验证 scoped ids 和 compaction 行为仍会流经真实的
      `run.ts` / `compact.ts` 路径；仅 helper 测试不能充分替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置固定 `isolate: false`，并在根项目、e2e 和 live 配置中使用
      非隔离 runner。
    - 根 UI lane 保留其 `jsdom` 设置和 optimizer，但也运行在共享的
      非隔离 runner 上。
    - 每个 `pnpm test` 分片都会从共享 Vitest 配置继承相同的 `threads` + `isolate: false`
      默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node
      进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。
      设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与原生 V8
      行为对比。

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` 会显示一个 diff 触发哪些架构 lane。
    - pre-commit hook 仅负责格式化。它会重新暂存已格式化的文件，
      不会运行 lint、typecheck 或测试。
    - 当你需要智能本地检查门禁时，请在交接或 push 前显式运行
      `pnpm check:changed`。
    - `pnpm test:changed` 默认会通过廉价的作用域化 lane 路由。仅当智能体
      判断某个 harness、配置、package 或契约编辑确实需要更广泛的
      Vitest 覆盖时，才使用
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由
      行为，只是 worker 上限更高。
    - 本地 worker 自动扩缩容有意保持保守，并会在 host load average 已经较高时退避，
      因此默认情况下多个并发
      Vitest 运行造成的影响更小。
    - 基础 Vitest 配置把 projects/config 文件标记为
      `forceRerunTriggers`，因此当测试
      wiring 变更时，changed-mode rerun 仍保持正确。
    - 该配置会在受支持的 host 上保持 `OPENCLAW_VITEST_FS_MODULE_CACHE` 启用；
      如果你希望为直接 profiling 使用一个显式缓存位置，请设置
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` 会启用 Vitest import-duration reporting 以及
      import-breakdown 输出。
    - `pnpm test:perf:imports:changed` 会将同一 profiling 视图限定到
      自 `origin/main` 以来变更的文件。
    - 分片 timing 数据会写入 `.artifacts/vitest-shard-timings.json`。
      Whole-config 运行使用 config path 作为 key；include-pattern CI
      分片会追加分片名称，以便可以单独跟踪 filtered shards。
    - 当某个 hot test 仍把大部分时间花在 startup imports 上时，
      请把重型依赖保留在狭窄的本地 `*.runtime.ts` seam 后面，并
      直接 mock 该 seam，而不是为了通过 `vi.mock(...)` 传递它们而 deep-import runtime helpers。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会比较已提交
      diff 的 routed `test:changed` 与原生根项目路径，并打印 wall time 以及 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过把 changed file list 路由到
      `scripts/test-projects.mjs` 和根 Vitest 配置，对当前
      dirty tree 进行 benchmark。
    - `pnpm test:perf:profile:main` 会为
      Vitest/Vite 启动和 transform 开销写入 main-thread CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用 file parallelism 的情况下，为
      单元套件写入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制使用一个 worker
- 范围：
  - 启动一个真实的 loopback Gateway 网关，默认启用 diagnostics
  - 通过 diagnostic event path 驱动 synthetic gateway message、memory 和 large-payload churn
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖 diagnostic stability bundle persistence helpers
  - 断言 recorder 保持有界，synthetic RSS samples 保持在 pressure budget 以下，并且 per-session queue depths 恢复为零
- 预期：
  - CI 安全且不需要密钥
  - 用于稳定性回归跟进的窄 lane，不是完整 Gateway 网关套件的替代品

### E2E（Gateway 网关 smoke）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 和 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以降低控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 表面、节点配对和更重的网络行为
- 预期：
  - 在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比单元测试有更多移动部件（可能更慢）

### E2E：OpenShell 后端冒烟测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动隔离的 OpenShell Gateway 网关
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 测试 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs 桥验证远程规范文件系统行为
- 预期：
  - 仅限显式选择；不是默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 以及可用的 Docker 守护进程
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1` 用于在手动运行更广泛的 e2e 套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用于指向非默认 CLI 二进制文件或包装脚本

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认值：通过 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型在 _今天_ 使用真实凭证时真的可用吗？”
  - 捕获提供商格式变更、工具调用怪异行为、认证问题和速率限制行为
- 预期：
  - 按设计不保证 CI 稳定（真实网络、真实提供商策略、配额、中断）
  - 会产生费用 / 使用速率限制额度
  - 优先运行收窄后的子集，而不是“全部”
- Live 运行会 source `~/.profile`，以读取缺失的 API key。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置/认证材料复制到临时测试 home 中，因此单元 fixture 无法修改你的真实 `~/.openclaw`。
- 只有在你有意需要 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：它保留 `[live] ...` 进度输出，但抑制额外的 `~/.profile` 提示，并静音 Gateway 网关 bootstrap 日志/Bonjour 噪声。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（按提供商）：用逗号/分号格式设置 `*_API_KEYS`，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可以通过 `OPENCLAW_LIVE_*_KEY` 进行单个 live 覆盖；测试会在收到速率限制响应时重试。
- 进度/heartbeat 输出：
  - Live 套件现在会向 stderr 发出进度行，因此即使 Vitest 控制台捕获很安静，长时间的提供商调用也能明显看到仍在活动。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此提供商/Gateway 网关进度行会在 live 运行期间立即流式输出。
  - 用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型 heartbeat。
  - 用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关/probe heartbeat。

## 我应该运行哪个套件？

使用这个决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果改动很多，也运行 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：添加 `pnpm test:e2e`
- 调试“我的机器人挂了” / 提供商特定失败 / 工具调用：运行收窄后的 `pnpm test:live`

## Live（触及网络的）测试

对于 live 模型矩阵、CLI 后端冒烟测试、ACP 冒烟测试、Codex app-server 测试框架，以及所有媒体提供商 live 测试（Deepgram、BytePlus、ComfyUI、image、music、video、media 测试框架），再加上 live 运行的凭证处理，请参阅 [Testing live suites](/zh-CN/help/testing-live)。对于专用的更新和插件验证清单，请参阅 [更新和插件测试](/zh-CN/help/testing-updates-plugins)。

## Docker 运行器（可选的“能在 Linux 中运行”检查）

这些 Docker 运行器分为两类：

- Live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行各自匹配的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），挂载你的本地配置目录和工作区（如果已挂载，也会 source `~/.profile`）。匹配的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认使用更小的冒烟上限，因此完整 Docker 扫描仍然实用：
  `test:docker:live-models` 默认设置为 `OPENCLAW_LIVE_MAX_MODELS=12`，并且
  `test:docker:live-gateway` 默认设置为 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在你明确想要更大的穷尽扫描时，才覆盖这些环境变量。
- `test:docker:all` 先通过 `test:docker:live-build` 构建一次 live Docker 镜像，通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包一次为 npm tarball，然后构建/复用两个 `scripts/e2e/Dockerfile` 镜像。裸镜像只是用于安装/更新/插件依赖 lane 的 Node/Git 运行器；这些 lane 会挂载预构建的 tarball。功能镜像会把同一个 tarball 安装到 `/app`，用于已构建应用的功能 lane。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 会执行所选计划。聚合运行使用加权本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会避免重型 live、npm-install 和多服务 lane 同时全部启动。如果单个 lane 比活动上限更重，调度器仍可在池为空时启动它，然后让它单独运行，直到容量再次可用。默认值是 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有当 Docker 主机有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。运行器默认执行 Docker 预检，移除过期的 OpenClaw E2E 容器，每 30 秒打印一次 Status，将成功 lane 的耗时存储在 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中使用这些耗时优先启动更长的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可以在不构建或运行 Docker 的情况下打印加权 lane 清单，或使用 `node scripts/test-docker-all.mjs --plan-json` 打印所选 lane、package/image 需求和凭证的 CI 计划。
- `Package Acceptance` 是 GitHub 原生的包门禁，用于检查“这个可安装 tarball 作为产品是否可用？”它会从 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一个候选包，将其上传为 `package-under-test`，然后针对该精确 tarball 运行可复用的 Docker E2E lane，而不是重新打包所选 ref。profile 按覆盖范围排序：`smoke`、`package`、`product` 和 `full`。有关 package/update/plugin 契约、已发布升级幸存者矩阵、发布默认值和失败分诊，请参阅 [更新和插件测试](/zh-CN/help/testing-updates-plugins)。
- 构建和发布检查会在 tsdown 之后运行 `scripts/check-cli-bootstrap-imports.mjs`。该守卫会从 `dist/entry.js` 和 `dist/cli/run-main.js` 遍历静态构建图，如果在命令分发前的启动导入了 Commander、prompt UI、undici 或 logging 等 package 依赖，就会失败；它还会让内置 Gateway 网关运行 chunk 保持在预算内，并拒绝对已知冷 Gateway 网关路径的静态导入。打包后的 CLI 冒烟测试也覆盖 root help、onboard help、doctor help、Status、config schema 和 model-list 命令。
- Package Acceptance 旧版兼容性截至 `2026.4.25`（包括 `2026.4.25-beta.*`）。在该截止点之前，测试框架只容忍已发布 package 的元数据缺口：省略的私有 QA inventory 条目、缺失的 `gateway install --wrapper`、tarball 派生 git fixture 中缺失的 patch 文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。对于 `2026.4.25` 之后的 package，这些路径都是严格失败。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层的集成路径。

Live 模型 Docker 运行器还只会绑定挂载所需的 CLI 认证 home（或在运行未收窄时挂载所有受支持的 home），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就可以刷新 token，而不会修改主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，并通过 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 严格覆盖 Droid/OpenCode）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex 应用服务器 harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + 开发智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性冒烟测试：`pnpm qa:otel:smoke` 是一个私有 QA 源码检出检查通道。它有意不属于包 Docker 发布检查通道，因为 npm tar 包会省略 QA Lab。
- Open WebUI 实时冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- npm tar 包新手引导/渠道/智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包后的 OpenClaw tar 包，默认通过 env-ref 新手引导配置 OpenAI 加 Telegram，运行 doctor，并运行一次模拟的 OpenAI 智能体轮次。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tar 包，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机重建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- 更新渠道切换冒烟测试：`pnpm test:docker:update-channel-switch` 会在 Docker 中全局安装打包后的 OpenClaw tar 包，从包 `stable` 切换到 git `dev`，验证持久化后的渠道以及插件更新后的工作状态，然后切回包 `stable` 并检查更新 Status。
- 升级存活冒烟测试：`pnpm test:docker:upgrade-survivor` 会把打包后的 OpenClaw tar 包安装到一个脏旧用户夹具上，该夹具包含智能体、渠道配置、插件 allowlist、陈旧的插件依赖状态以及现有工作区/会话文件。它会在没有实时提供商或渠道密钥的情况下运行包更新和非交互式 doctor，然后启动一个 loopback Gateway 网关，并检查配置/状态保留以及启动/Status 预算。
- 已发布版本升级存活冒烟测试：`pnpm test:docker:published-upgrade-survivor` 默认安装 `openclaw@latest`，植入真实感的现有用户文件，用内置命令配方配置该基线，验证生成的配置，将该已发布安装更新到候选 tar 包，运行非交互式 doctor，写入 `.artifacts/upgrade-survivor/summary.json`，然后启动一个 loopback Gateway 网关，并检查已配置 intent、状态保留、启动、`/healthz`、`/readyz` 和 RPC Status 预算。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖一个基线，请求聚合调度器用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展开精确基线，例如 `all-since-2026.4.23`，并用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展开 issue 形态夹具，例如 `reported-issues`；reported-issues 集合包含 `configured-plugin-installs`，用于自动修复外部 OpenClaw 插件安装。Package Acceptance 会将这些公开为 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`。
- 会话运行时上下文冒烟测试：`pnpm test:docker:session-runtime-context` 会验证隐藏运行时上下文 transcript 持久化，以及 doctor 对受影响重复 prompt-rewrite 分支的修复。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前源码树，在隔离 home 中用 `bun install -g` 安装它，并验证 `openclaw infer image providers --json` 返回内置图片提供商而不是挂起。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tar 包，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过主机构建，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 会在它的 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认使用 npm `latest` 作为稳定基线，然后升级到候选 tar 包。本地用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或在 GitHub 上用 Install Smoke workflow 的 `update_baseline_version` 输入覆盖。非 root 安装器检查会保留隔离的 npm 缓存，避免 root 拥有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑之间复用 root/update/direct-npm 缓存。
- Install Smoke CI 会使用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；需要覆盖直接 `npm install -g` 时，在本地运行该脚本且不带该环境变量。
- 智能体删除共享工作区 CLI 冒烟测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认构建根 Dockerfile 镜像，在隔离容器 home 中植入两个使用同一工作区的智能体，运行 `agents delete --json`，并验证有效 JSON 以及保留工作区行为。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关联网（两个容器，WS 认证 + health）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照冒烟测试：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）会构建源码 E2E 镜像和 Chromium 层，用原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP role 快照覆盖链接 URL、cursor-promoted 可点击项、iframe ref 和 frame 元数据。
- OpenAI Responses `web_search` 最小推理回归：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行模拟的 OpenAI 服务器，验证 `web_search` 将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制触发提供商 schema 拒绝，并检查原始详情出现在 Gateway 网关日志中。
- MCP 渠道 bridge（植入的 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile 允许/拒绝冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + 隔离 cron 和一次性 subagent 运行后的 stdio MCP 子进程清理）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（本地路径、`file:`、带提升依赖的 npm registry、git moving refs、ClawHub kitchen-sink、marketplace 更新以及 Claude-bundle 启用/检查的安装/更新冒烟测试）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳过 ClawHub 区块，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认 kitchen-sink 包/运行时配对。没有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` 时，该测试会使用 hermetic 本地 ClawHub 夹具服务器。
- 插件更新无变更冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 插件生命周期矩阵冒烟测试：`pnpm test:docker:plugin-lifecycle-matrix` 会在裸容器中安装打包后的 OpenClaw tar 包，安装一个 npm 插件，切换启用/停用，通过本地 npm registry 升级和降级它，删除已安装代码，然后验证卸载仍会移除陈旧状态，同时记录每个生命周期阶段的 RSS/CPU 指标。
- 配置重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 插件：`pnpm test:docker:plugins` 覆盖本地路径、`file:`、带提升依赖的 npm registry、git moving refs、ClawHub 夹具、marketplace 更新以及 Claude-bundle 启用/检查的安装/更新冒烟测试。`pnpm test:docker:plugin-update` 覆盖已安装插件的无变更更新行为。`pnpm test:docker:plugin-lifecycle-matrix` 覆盖带资源跟踪的 npm 插件安装、启用、停用、升级、降级以及缺失代码卸载。

要手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

特定于套件的镜像覆盖项（例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）在设置时仍然优先。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果该镜像尚未存在于本地，脚本会拉取它。QR 和安装程序 Docker 测试保留各自的 Dockerfiles，因为它们验证的是包/安装行为，而不是共享的已构建应用运行时。

实时模型 Docker 运行器还会以只读方式绑定挂载当前 checkout，并将其暂存到容器内的临时工作目录中。这让运行时镜像保持精简，同时仍能针对你的确切本地源码/配置运行 Vitest。暂存步骤会跳过大型本地专用缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地的 `.build` 或 Gradle 输出目录，这样 Docker 实时运行就不会花费数分钟复制特定机器的工件。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关实时探测就不会在容器内启动真实的 Telegram/Discord 等渠道 worker。
`test:docker:live-models` 仍会运行 `pnpm test:live`，因此当你需要从该 Docker lane 中收窄或排除 Gateway 网关实时覆盖范围时，也要传入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，启动一个固定版本的 Open WebUI 容器并连接到该 Gateway 网关，通过 Open WebUI 登录，验证 `/api/models` 暴露 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送真实聊天请求。
首次运行可能明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI 可能也需要完成自己的冷启动设置。
该 lane 需要可用的实时模型 key，而 `OPENCLAW_PROFILE_FILE`（默认是 `~/.profile`）是在 Docker 化运行中提供它的主要方式。
成功运行会打印一个小型 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是有意保持确定性的，不需要真实的 Telegram、Discord 或 iMessage 账号。它会启动一个已播种的 Gateway 网关容器，再启动第二个容器来生成 `openclaw mcp serve`，然后验证路由后的对话发现、transcript 读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio MCP bridge 传输的 Claude 风格渠道 + 权限通知。通知检查会直接检查原始 stdio MCP frame，因此该冒烟测试验证的是 bridge 实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要实时模型 key。它会构建 repo Docker 镜像，在容器内启动一个真实 stdio MCP probe server，通过嵌入式 Pi bundle MCP 运行时物化该 server，执行工具，然后验证 `coding` 和 `messaging` 保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会过滤掉它们。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要实时模型 key。它会启动一个带有真实 stdio MCP probe server 的已播种 Gateway 网关，运行一次隔离的 cron turn 和一次 `/subagents spawn` 一次性子 turn，然后验证 MCP 子进程在每次运行后都会退出。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归/调试工作流。ACP 线程路由验证可能还会再次需要它，因此不要删除。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于只验证从 `OPENCLAW_PROFILE_FILE` source 得到的环境变量，使用临时配置/工作区目录，且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内缓存的 CLI 安装
- `$HOME` 下的外部 CLI 认证目录/文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 收窄后的提供商运行只会挂载根据 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 可用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于收窄运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于在不需要重新构建的重跑中复用现有 `openclaw:local-live` 镜像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试使用的 nonce 检查 prompt
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像 tag

## 文档完整性检查

编辑文档后运行文档检查：`pnpm check:docs`。
当你还需要页内标题检查时，运行完整的 Mintlify anchor 验证：`pnpm docs:check-links:anchors`。

## 离线回归（CI 安全）

这些是不依赖真实提供商的“真实 pipeline”回归：

- Gateway 网关工具调用（mock OpenAI，真实 Gateway 网关 + Agent loop）：`src/gateway/gateway.test.ts`（用例："runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，写入配置 + 强制认证）：`src/gateway/gateway.test.ts`（用例："runs wizard over ws and writes auth token config"）

## 智能体可靠性评测（Skills）

我们已经有一些 CI 安全测试，它们的行为类似“智能体可靠性评测”：

- 通过真实 Gateway 网关 + Agent loop 的 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话 wiring 和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

Skills 仍然缺失的内容（见 [Skills](/zh-CN/tools/skills)）：

- **决策：** 当 Skills 在 prompt 中列出时，智能体是否会选择正确的 skill（或避开无关的 skill）？
- **合规：** 智能体是否会在使用前读取 `SKILL.md` 并遵循必需步骤/参数？
- **工作流契约：** 断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来评测应首先保持确定性：

- 使用 mock 提供商的场景运行器，用于断言工具调用 + 顺序、skill 文件读取和会话 wiring。
- 一小套聚焦 skill 的场景（使用 vs 避免、门控、prompt injection）。
- 可选的实时评测（opt-in、env-gated）只应在 CI 安全套件就位后添加。

## 契约测试（插件和渠道形状）

契约测试会验证每个已注册插件和渠道是否符合其接口契约。它们会遍历所有发现的插件，并运行一组形状和行为断言。默认的 `pnpm test` 单元 lane 会有意跳过这些共享 seam 和冒烟文件；当你触碰共享渠道或提供商 surface 时，请显式运行契约命令。

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
- **actions** - 渠道 action handler
- **threading** - Thread ID 处理
- **directory** - 目录/roster API
- **group-policy** - 群组策略强制执行

### 提供商 Status 契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道 Status probe
- **registry** - 插件注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择/选取
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状/接口
- **wizard** - 设置向导

### 运行时机

- 更改 plugin-sdk 导出或 subpath 后
- 添加或修改渠道或提供商插件后
- 重构插件注册或发现后

契约测试会在 CI 中运行，并且不需要真实 API key。

## 添加回归（指南）

当你修复实时中发现的提供商/模型问题时：

- 尽可能添加 CI 安全回归（mock/stub 提供商，或捕获确切的请求形状转换）
- 如果它本质上只能实时验证（速率限制、认证策略），保持实时测试范围狭窄，并通过环境变量 opt-in
- 优先定位到能捕获该 bug 的最小层：
  - 提供商请求转换/replay bug → 直接模型测试
  - Gateway 网关会话/history/工具 pipeline bug → Gateway 网关实时冒烟测试或 CI 安全 Gateway 网关 mock 测试
- SecretRef 遍历护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）为每个 SecretRef 类派生一个抽样目标，然后断言包含遍历 segment 的 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会有意在未分类目标 id 上失败，确保新类不会被静默跳过。

## 相关

- [实时测试](/zh-CN/help/testing-live)
- [更新和插件测试](/zh-CN/help/testing-updates-plugins)
- [CI](/zh-CN/ci)
