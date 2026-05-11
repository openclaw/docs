---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元/e2e/live 套件、Docker 运行器，以及每项测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-05-11T20:30:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三套 Vitest 测试套件（单元/集成、e2e、live）和少量 Docker 运行器。本文档是一份“我们如何测试”的指南：

- 每个套件覆盖什么（以及它刻意_不_覆盖什么）。
- 常见工作流（本地、推送前、调试）应运行哪些命令。
- live 测试如何发现凭证并选择模型/提供商。
- 如何为真实世界的模型/提供商问题添加回归测试。

<Note>
**QA 栈（qa-lab、qa-channel、live 传输通道）**单独记录在：

- [QA overview](/zh-CN/concepts/qa-e2e-automation) - 架构、命令面、场景编写。
- [Matrix QA](/zh-CN/concepts/qa-matrix) - `pnpm openclaw qa matrix` 的参考。
- [QA channel](/zh-CN/channels/qa-channel) - 仓库支持场景使用的合成传输插件。

本页涵盖常规测试套件和 Docker/Parallels 运行器的运行方式。下面的 QA 专用运行器部分（[QA 专用运行器](#qa-specific-runners)）列出了具体的 `qa` 调用，并指回上面的参考资料。
</Note>

## 快速开始

大多数时候：

- 完整门禁（推送前预期运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在资源充足机器上更快运行本地完整套件：`pnpm test:max`
- 直接 Vitest 监听循环：`pnpm test:watch`
- 直接文件定位现在也会路由扩展/渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你正在迭代单个失败时，优先运行定向测试。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux 虚拟机支持的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你改动测试或想要额外信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

当调试真实提供商/模型时（需要真实凭证）：

- live 套件（模型 + Gateway 网关工具/图像探测）：`pnpm test:live`
- 静默定位一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 运行时性能报告：派发 `OpenClaw Performance`，并设置
  `live_gpt54=true` 来运行一次真实 `openai/gpt-5.4` agent 轮次，或设置
  `deep_profile=true` 来生成 Kova CPU/堆/跟踪工件。每日定时运行会在配置
  `CLAWGRIT_REPORTS_TOKEN` 时，将 mock-provider、deep-profile 和 GPT 5.4 通道工件发布到
  `openclaw/clawgrit-reports`。mock-provider 报告还包含源码级 Gateway 网关启动、内存、
  插件压力、重复 fake-model hello-loop 和 CLI 启动数据。
- Docker live 模型扫测：`pnpm test:docker:live-models`
  - 每个选中的模型现在会运行一次文本轮次以及一个小型文件读取风格探测。
    元数据声明支持 `image` 输入的模型还会运行一个微型图像轮次。
    在隔离提供商失败时，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用额外探测。
  - CI 覆盖：每日 `OpenClaw Scheduled Live And E2E Checks` 和手动
    `OpenClaw Release Checks` 都会以 `include_live_suites: true` 调用可复用 live/E2E 工作流，
    其中包含按提供商分片的独立 Docker live 模型矩阵作业。
  - 对于聚焦的 CI 重跑，派发 `OpenClaw Live And E2E Checks (Reusable)`，
    并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和它的
    定时/发布调用方。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 针对 Codex app-server 路径运行 Docker live 通道，绑定一个带 `/codex bind` 的合成
    Slack 私信，执行 `/codex fast` 和
    `/codex permissions`，然后验证普通回复和图像附件通过原生插件绑定路由，而不是 ACP。
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`
  - 通过插件拥有的 Codex app-server harness 运行 Gateway 网关 agent 轮次，
    验证 `/codex status` 和 `/codex models`，并默认执行图像、cron MCP、子 agent 和 Guardian 探测。
    在隔离其他 Codex app-server 失败时，可用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 禁用子 agent 探测。对于聚焦的子 agent 检查，禁用其他探测：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则会在子 agent 探测后退出。
- Codex 按需安装冒烟测试：`pnpm test:docker:codex-on-demand`
  - 在 Docker 中安装打包后的 OpenClaw tarball，运行 OpenAI API key
    新手引导，并验证 Codex 插件以及 `@openai/codex` 依赖已按需下载到托管 npm 根目录。
- live 插件工具依赖冒烟测试：`pnpm test:docker:live-plugin-tool`
  - 打包一个带真实 `slugify` 依赖的夹具插件，通过
    `npm-pack:` 安装，验证托管 npm 根目录下的依赖，然后要求一个 live OpenAI 模型调用插件工具并返回隐藏 slug。
- Crestodian 救援命令冒烟测试：`pnpm test:live:crestodian-rescue-channel`
  - 针对消息渠道救援命令面的可选双保险检查。
    它会执行 `/crestodian status`，排队一次持久化模型变更，回复 `/crestodian yes`，并验证审计/配置写入路径。
- Crestodian 规划器 Docker 冒烟测试：`pnpm test:docker:crestodian-planner`
  - 在无配置容器中运行 Crestodian，并在 `PATH`
    上放置 fake Claude CLI，验证模糊规划器回退会转换为带审计的类型化配置写入。
- Crestodian 首次运行 Docker 冒烟测试：`pnpm test:docker:crestodian-first-run`
  - 从空 OpenClaw 状态目录开始，将裸 `openclaw` 路由到
    Crestodian，应用设置/模型/agent/Discord 插件 + SecretRef 写入，
    校验配置，并验证审计条目。同一 Ring 0 设置路径也由 QA Lab 中的
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot/Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行
  `openclaw models list --provider moonshot --json`，然后针对
  `moonshot/kimi-k2.6` 运行隔离的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  验证 JSON 报告 Moonshot/K2.6，并且助手转录存储了规范化的 `usage.cost`。

<Tip>
当你只需要一个失败用例时，优先通过下面描述的允许列表环境变量来收窄 live 测试。
</Tip>

## QA 专用运行器

当你需要 QA-lab 真实度时，这些命令位于主测试套件旁边：

CI 在专用工作流中运行 QA Lab。Agentic 对等性嵌套在
`QA-Lab - All Lanes` 和发布验证下，而不是独立的 PR 工作流。
广泛验证应使用 `Full Release Validation`，并设置
`rerun_group=qa-parity`，或使用 release-checks QA 组。稳定/默认发布检查会把详尽的 live/Docker soak 保留在 `run_release_soak=true` 后面；`full` 配置会强制启用 soak。`QA-Lab - All Lanes`
每晚在 `main` 上运行，也会从手动派发运行，其中 mock 对等通道、live
Matrix 通道、Convex 托管的 live Telegram 通道，以及 Convex 托管的 live Discord
通道会作为并行作业运行。定时 QA 和发布检查会显式传递 Matrix
`--profile fast`，而 Matrix CLI 和手动工作流输入的默认值仍为 `all`；手动派发可将 `all` 分片为 `transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release
Checks` 会在发布批准前运行对等性以及快速 Matrix 和 Telegram 通道，并为发布传输检查使用 `mock-openai/gpt-5.5`，
使其保持确定性并避开普通提供商插件启动。这些 live 传输 Gateway 网关会禁用记忆搜索；记忆行为仍由 QA 对等套件覆盖。

完整发布 live 媒体分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已经包含
`ffmpeg` 和 `ffprobe`。Docker live 模型/后端分片使用共享的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像，该镜像针对所选提交只构建一次，
然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取它，而不是在每个分片内重新构建。

- `pnpm openclaw qa suite`
  - 直接在主机上运行由仓库支持的 QA 场景。
  - 默认使用隔离的 Gateway 网关工作进程并行运行多个选定场景。`qa-channel` 默认并发数为 4（受选定场景数量限制）。使用 `--concurrency <count>` 调整工作进程数量，或使用 `--concurrency 1` 进入旧版串行通道。
  - 任一场景失败时以非零状态退出。当你想保留产物但不希望退出码失败时，使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 会启动一个由本地 AIMock 支持的提供商服务器，用于实验性的夹具和协议模拟覆盖，同时不会替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm test:plugins:kitchen-sink-live`
  - 通过 QA Lab 运行实时 OpenAI Kitchen Sink 插件考验。它会安装外部 Kitchen Sink 包，验证插件 SDK 表面清单，探测 `/healthz` 和 `/readyz`，记录 Gateway 网关 CPU/RSS 证据，运行一次实时 OpenAI 轮次，并检查对抗性诊断。需要实时 OpenAI 凭证，例如 `OPENAI_API_KEY`。在已注入环境的 Testbox 会话中，如果存在 `openclaw-testbox-env` 辅助工具，它会自动加载 Testbox 实时凭证配置。
- `pnpm test:gateway:cpu-scenarios`
  - 运行 Gateway 网关启动基准测试以及一个小型模拟 QA Lab 场景包（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`），并在 `.artifacts/gateway-cpu-scenarios/` 下写入合并后的 CPU 观测摘要。
  - 默认仅标记持续的高 CPU 观测（`--cpu-core-warn` 加 `--hot-wall-warn-ms`），因此短暂的启动突增会记录为指标，而不会看起来像持续数分钟的 Gateway 网关占满回归。
  - 使用已构建的 `dist` 产物；当检出目录还没有新的运行时输出时，请先运行构建。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 内运行同一套 QA 套件。
  - 保持与主机上的 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商/模型选择标志。
  - 实时运行会转发对 guest 可行的受支持 QA 凭证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保留在仓库根目录下，这样 guest 才能通过挂载的工作区写回。
  - 在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告和摘要，以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动由 Docker 支持的 QA 站点，用于操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建 npm tarball，在 Docker 中全局安装它，运行非交互式 OpenAI API 密钥新手引导，默认配置 Telegram，验证打包的插件运行时能在没有启动依赖修复的情况下加载，运行 Doctor，并针对模拟的 OpenAI 端点运行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 运行同一条带 Discord 的打包安装通道。
- `pnpm test:docker:session-runtime-context`
  - 为嵌入式运行时上下文转录运行确定性的已构建应用 Docker 冒烟测试。它会验证隐藏的 OpenClaw 运行时上下文以非显示自定义消息形式持久化，而不会泄漏到可见用户轮次中，然后植入受影响的损坏会话 JSONL，并验证 `openclaw doctor --fix` 会将其重写到当前分支并保留备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个 OpenClaw 包候选版本，运行已安装包的新手引导，通过已安装的 CLI 配置 Telegram，然后复用实时 Telegram QA 通道，并将该已安装包作为被测系统 Gateway 网关。
  - 该包装器只从检出目录挂载 `qa-lab` 测试框架源代码；已安装包拥有 `dist`、`openclaw/plugin-sdk` 和内置插件运行时，因此该通道不会把当前检出目录中的插件混入被测包。
  - 默认值为 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；设置 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或 `OPENCLAW_CURRENT_PACKAGE_TGZ`，以测试已解析的本地 tarball，而不是从注册表安装。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证来源。对于 CI/发布自动化，设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，以及 `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和一个 Convex 角色密钥，Docker 包装器会自动选择 Convex。
  - Docker 构建/安装工作开始前，包装器会在主机上验证 Telegram 或 Convex 凭证环境变量。仅在有意调试凭证前设置时，才设置 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅对此通道覆盖共享的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将此通道公开为手动维护者工作流 `NPM Telegram Beta E2E`。它不会在合并时运行。该工作流使用 `qa-live-shared` 环境和 Convex CI 凭证租约。
- GitHub Actions 还公开了 `Package Acceptance`，用于针对一个候选包进行旁路产品证明。它接受可信 ref、已发布的 npm 规格、HTTPS tarball URL 加 SHA-256，或来自另一次运行的 tarball 产物，上传规范化后的 `openclaw-current.tgz` 作为 `package-under-test`，然后使用 smoke、package、product、full 或 custom 通道配置运行现有 Docker E2E 调度器。设置 `telegram_mode=mock-openai` 或 `live-frontier`，以针对同一个 `package-under-test` 产物运行 Telegram QA 工作流。
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

- 产物证明会从另一次 Actions 运行下载 tarball 产物：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，启动已配置 OpenAI 的 Gateway 网关，然后通过配置编辑启用内置频道/插件。
  - 验证设置发现会让未配置的可下载插件保持缺失，第一次已配置的 Doctor 修复会显式安装每个缺失的可下载插件，并且第二次重启不会运行隐藏依赖修复。
  - 还会安装一个已知的较旧 npm 基线，在运行 `openclaw update --tag <candidate>` 前启用 Telegram，并验证候选版本的更新后 Doctor 会清理旧版插件依赖残留，而不需要测试框架侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels guest 运行原生打包安装更新冒烟测试。每个选定平台都会先安装请求的基线包，然后在同一个 guest 中运行已安装的 `openclaw update` 命令，并验证已安装版本、更新状态、Gateway 网关就绪状态，以及一次本地智能体轮次。
  - 迭代单个 guest 时使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要产物路径和每个通道的状态。
  - OpenAI 通道默认使用 `openai/gpt-5.5` 进行实时智能体轮次证明。当有意验证另一个 OpenAI 模型时，传入 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 将较长的本地运行包装在主机超时中，这样 Parallels 传输停滞不会耗尽剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本会在 `/tmp/openclaw-parallels-npm-update.*` 下写入嵌套通道日志。在假设外层包装器挂起之前，先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在冷 guest 上，Windows 更新可能会在更新后 Doctor 和包更新工作中花费 10 到 15 分钟；只要嵌套 npm 调试日志仍在推进，这仍然是正常状态。
  - 不要将这个聚合包装器与单独的 Parallels macOS、Windows 或 Linux 冒烟通道并行运行。它们共享 VM 状态，可能在快照还原、包服务或 guest Gateway 网关状态上发生冲突。
  - 更新后证明会运行常规内置插件表面，因为语音、图像生成和媒体理解等能力门面是通过内置运行时 API 加载的，即使智能体轮次本身只检查一个简单文本响应。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的 Docker 支持 Tuwunel homeserver 运行 Matrix 实时 QA 通道。仅支持源代码检出，打包安装不会随附 `qa-lab`。
  - 完整 CLI、配置文件/场景目录、环境变量和产物布局：[Matrix QA](/zh-CN/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用来自环境变量的 driver 和 SUT bot token，针对真实私有群组运行 Telegram 实时 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是数字形式的 Telegram chat id。
  - 支持 `--credential-source convex` 以使用共享池化凭证。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 来选择池化租约。
  - 默认覆盖 canary、mention gating、命令寻址、`/status`、bot 到 bot 的被提及回复，以及核心原生命令回复。`mock-openai` 默认还覆盖确定性 reply-chain 和 Telegram final-message streaming 回归。使用 `--list-scenarios` 查看可选探测，例如 `session_status`。
  - 任一场景失败时以非零状态退出。当你想保留产物但不希望退出码失败时，使用 `--allow-failures`。
  - 需要同一私有群组中的两个不同 bot，且 SUT bot 暴露一个 Telegram 用户名。
  - 为获得稳定的 bot 到 bot 观测，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保 driver bot 可以观测群组 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 observed-messages 产物。回复场景包含从 driver 发送请求到观测到 SUT 回复的 RTT。

`Mantis Telegram Live` 是围绕此通道的 PR 证据包装器。它使用 Convex 租约的 Telegram 凭证运行候选 ref，在 Crabbox 桌面浏览器中渲染已脱敏的观测消息转录，录制 MP4 证据，生成经运动裁剪的 GIF，上传产物包，并在设置 `pr_number` 时通过 Mantis GitHub App 发布内联 PR 证据。维护者可以通过 `Mantis Scenario`（`scenario_id:
telegram-live`）从 Actions UI 启动它，或直接从拉取请求评论启动：

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` 是用于 PR 视觉证明的智能体式原生 Telegram Desktop 前后对比包装器。可在 Actions UI 中使用自由格式 `instructions` 启动，通过 `Mantis Scenario`（`scenario_id:
telegram-desktop-proof`）启动，或从 PR 评论启动：

```text
@Mantis telegram desktop proof
```

Mantis 智能体会读取 PR，判断哪些 Telegram 可见行为能证明此
变更，在基线和候选 ref 上运行真实用户 Crabbox Telegram Desktop 证明通道，
反复迭代直到原生 GIF 有用，写入成对的
`motionPreview` 清单，并在设置了 `pr_number` 时通过
Mantis GitHub App 发布同样的 2 列 GIF 表格。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - 租用或复用一个 Crabbox Linux 桌面，安装原生 Telegram Desktop，使用租用的 Telegram SUT bot token 配置 OpenClaw，启动 Gateway 网关，并从可见的 VNC 桌面录制截图/MP4 证据。
  - 默认使用 `--credential-source convex`，因此工作流只需要 Convex broker secret。使用 `--credential-source env` 时，变量与 `pnpm openclaw qa telegram` 所用的 `OPENCLAW_QA_TELEGRAM_*` 相同。
  - Telegram Desktop 仍然需要用户登录/配置文件。bot token 只用于配置 OpenClaw。使用 `--telegram-profile-archive-env <name>` 指定 base64 `.tgz` 配置文件归档，或使用 `--keep-lease` 并通过 VNC 手动登录一次。
  - 在输出目录下写入 `mantis-telegram-desktop-builder-report.md`、`mantis-telegram-desktop-builder-summary.json`、`telegram-desktop-builder.png` 和 `telegram-desktop-builder.mp4`。

实时传输通道共享一个标准契约，避免新传输方式产生偏差；各通道覆盖矩阵位于 [QA overview → Live transport coverage](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是广泛的合成套件，不属于该矩阵。

### 通过 Convex 共享 Telegram 凭证（v1）

当为实时传输 QA 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支撑的池中获取独占租约，在通道运行期间为该租约发送 Heartbeat，并在关闭时释放租约。该章节名称早于 Discord、Slack 和 WhatsApp 支持；租约契约在各类凭证之间共享。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所选角色对应的一个 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用于 `ci`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认为 `ci`，否则为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅本地开发中使用 loopback `http://` Convex URL。

正常运行时，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者 admin 命令（池添加/移除/列出）明确需要
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

面向维护者的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在实时运行前使用 `doctor` 检查 Convex 站点 URL、broker secrets、
endpoint prefix、HTTP timeout 和 admin/list 可达性，且不会打印
secret 值。在脚本和 CI 工具中使用 `--json` 获取机器可读输出。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 耗尽/可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - 成功：`{ status: "ok", index, data }`
- `POST /heartbeat`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /admin/add`（仅维护者 secret）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅维护者 secret）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅维护者 secret）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 类型的 payload 形状：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字形式的 Telegram chat id 字符串。
- `admin/add` 会针对 `kind: "telegram"` 验证此形状，并拒绝格式错误的 payload。

Telegram 真实用户类型的 payload 形状：

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId` 和 `telegramApiId` 必须是数字字符串。
- `tdlibArchiveSha256` 和 `desktopTdataArchiveSha256` 必须是 SHA-256 十六进制字符串。
- `kind: "telegram-user"` 表示一个 Telegram 临时账号。将租约视为账号级别：TDLib CLI driver 和 Telegram Desktop 视觉见证会从同一个 payload 恢复，并且同一时间只应有一个作业持有租约。

Telegram 真实用户租约恢复：

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

需要视觉录制时，将恢复后的 Desktop 配置文件与 `Telegram -workdir "$tmp/desktop"` 一起使用。在本地 operator 环境中，如果进程环境变量缺失，`scripts/e2e/telegram-user-credential.ts` 默认会读取 `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env`。

智能体驱动的 Crabbox 会话：

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` 会租用 `telegram-user` 凭证，将同一个账号恢复到 Crabbox Linux 桌面上的
TDLib 和 Telegram Desktop，基于当前 checkout 启动本地 mock SUT
Gateway 网关，打开可见的 Telegram 聊天，开始桌面录制，并写入私有的 `session.json`。会话存活期间，智能体可以持续测试，直到满意为止：

- `send --session <file> --text <message>` 通过真实 TDLib 用户发送，并等待 SUT 回复。
- `run --session <file> -- <remote command>` 在 Crabbox 上运行任意命令并保存其输出，例如 `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`。
- `screenshot --session <file>` 捕获当前可见桌面。
- `status --session <file>` 打印租约和 WebVNC 命令。
- `finish --session <file>` 停止录制器，捕获截图/视频/运动裁剪 artifacts，释放 Convex 凭证，停止本地 SUT 进程，并停止 Crabbox 租约，除非传入 `--keep-box`。
- `publish --session <file> --pr <number>` 默认发布仅包含 GIF 的 PR 评论。仅当有意需要日志或 JSON artifacts 时才传入 `--full-artifacts`。

对于确定性的视觉复现，将 `--mock-response-file <path>` 传给 `start`
或单命令 `probe` 简写。runner 默认使用标准
Crabbox class、24fps 录制、24fps motion GIF previews，以及 1920px GIF
宽度。仅在证明需要不同捕获设置时，才使用 `--class`、`--record-fps`、`--preview-fps` 和
`--preview-width` 覆盖。

单命令 Crabbox 证明：

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

默认 `probe` 命令是一次 start/send/finish 循环的简写。将它用于快速 `/status` 冒烟测试。将会话命令用于 PR review、bug 复现工作，或任何智能体需要先进行数分钟任意实验再判断证明完成的场景。使用 `--id <cbx_...>` 复用一个已预热的桌面租约，使用 `--keep-box` 在 finish 后保持 VNC 打开，使用 `--desktop-chat-title <name>` 选择可见聊天，并在使用预构建的 Linux `libtdjson.so` 归档而不是在新 box 上构建 TDLib 时使用 `--tdlib-url <tgz>`。runner 会用 `--tdlib-sha256 <hex>` 验证 `--tdlib-url`，默认则使用同级的 `<url>.sha256` 文件。

Broker 验证的多渠道 payload：

- Discord：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp：`{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack 通道也可以从池中租用，但 Slack payload 验证目前位于 Slack QA runner 中，而不是 broker 中。Slack 行使用
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`。

### 向 QA 添加渠道

新渠道适配器的架构和 scenario helper 名称位于 [QA overview → Adding a channel](/zh-CN/concepts/qa-e2e-automation#adding-a-channel)。最低要求：在共享的 `qa-lab` host seam 上实现 transport runner，在插件清单中声明 `qaRunners`，挂载为 `openclaw qa <runner>`，并在 `qa/scenarios/` 下编写 scenarios。

## 测试套件（在哪里运行什么）

可以把套件理解为“真实度递增”（同时不稳定性/成本也递增）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：未定向的运行使用 `vitest.full-*.config.ts` shard set，并且可能将多项目 shards 展开为每项目配置以进行并行调度
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的 core/unit inventories；UI 单元测试在专用的 `unit-ui` shard 中运行
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关 auth、路由、工具、解析、配置）
  - 已知 bug 的确定性回归
- 预期：
  - 在 CI 中运行
  - 不需要真实 keys
  - 应该快速且稳定
  - Resolver 和 public-surface loader 测试必须使用生成的微型插件 fixtures 证明广泛的 `api.js` 和
    `runtime-api.js` fallback 行为，而不是使用真实内置插件源 API。真实插件 API 加载属于
    插件拥有的契约/集成套件。

原生依赖策略：

- 默认测试安装会跳过可选的原生 Discord opus 构建。Discord 语音接收使用纯 JS `opusscript` 解码器，并且 `@discordjs/opus` 在 `allowBuilds` 中保持禁用，因此本地测试和 Testbox 线路不会编译原生 addon。
- 如果你确实需要比较原生 opus 构建，请使用专用的 Discord 语音性能或 live 线路。不要在默认 `allowBuilds` 中将 `@discordjs/opus` 设为 `true`；这会让无关的安装/测试循环编译原生代码。

<AccordionGroup>
  <Accordion title="项目、分片和限定范围线路">

    - 未指定目标的 `pnpm test` 会运行十二个较小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这会降低负载较高机器上的峰值 RSS，并避免 auto-reply/插件工作饿死无关套件。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不实用。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先将显式文件/目录目标路由到限定范围线路，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可以避免支付完整根项目启动成本。
    - `pnpm test:changed` 默认会将已变更的 git 路径展开为低成本的限定范围线路：直接测试编辑、同级 `*.test.ts` 文件、显式源码映射，以及本地导入图依赖方。配置/设置/package 编辑不会广泛运行测试，除非你显式使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄范围工作的常规智能本地检查关口。它会将 diff 分类为 core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling 和 tooling，然后运行匹配的类型检查、lint 和守卫命令。它不会运行 Vitest 测试；如需测试证明，请调用 `pnpm test:changed` 或显式 `pnpm test <target>`。仅发布元数据的版本升级会运行定向版本/config/根依赖检查，并带有一个守卫，用于拒绝顶层版本字段之外的 package 变更。
    - live Docker ACP harness 编辑会运行聚焦检查：live Docker 认证脚本的 shell 语法检查，以及 live Docker 调度器 dry-run。只有当 diff 限定在 `scripts["test:docker:live-*"]` 时才包含 `package.json` 变更；依赖、export、版本和其他 package 表面编辑仍使用更广泛的守卫。
    - 来自 agents、commands、plugins、auto-reply helper、`plugin-sdk` 和类似纯工具区域的轻导入单元测试会路由到 `unit-fast` 线路，该线路会跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件仍保留在现有线路上。
    - 选定的 `plugin-sdk` 和 `commands` helper 源文件也会将 changed-mode 运行映射到这些轻量线路中的显式同级测试，因此 helper 编辑可避免为该目录重新运行完整的重型套件。
    - `auto-reply` 为顶层 core helper、顶层 `reply.*` 集成测试和 `src/auto-reply/reply/**` 子树提供专用桶。CI 还会将 reply 子树进一步拆分为 agent-runner、dispatch 和 commands/state-routing 分片，因此一个导入较重的桶不会占据完整的 Node 尾部。
    - 常规 PR/main CI 会有意跳过插件批量扫描和仅发布使用的 `agentic-plugins` 分片。完整发布验证会为发布候选运行独立的 `Plugin Prerelease` 子工作流，以覆盖这些插件较重的套件。

  </Accordion>

  <Accordion title="嵌入式运行器覆盖">

    - 当你更改 message-tool 发现输入或 compaction 运行时
      上下文时，请保留两层覆盖。
    - 为纯路由和规范化
      边界添加聚焦 helper 回归测试。
    - 保持嵌入式运行器集成套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些套件会验证限定范围 id 和 compaction 行为仍会流经
      真实的 `run.ts` / `compact.ts` 路径；仅 helper 测试
      不能充分替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置固定 `isolate: false`，并在根项目、e2e 和 live 配置中使用
      非隔离运行器。
    - 根 UI 线路保留其 `jsdom` 设置和 optimizer，但也运行在
      共享非隔离运行器上。
    - 每个 `pnpm test` 分片都会从共享 Vitest 配置继承相同的 `threads` + `isolate: false`
      默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node
      进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。
      设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与原版 V8
      行为比较。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示一个 diff 触发哪些架构线路。
    - pre-commit hook 仅执行格式化。它会重新暂存已格式化文件，并且
      不运行 lint、类型检查或测试。
    - 当你需要智能本地检查关口时，请在交接或 push 前显式运行
      `pnpm check:changed`。
    - `pnpm test:changed` 默认通过低成本限定范围线路路由。只有当智能体
      判断某个 harness、配置、package 或契约编辑确实需要更广泛的
      Vitest 覆盖时，才使用
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由
      行为，只是 worker 上限更高。
    - 本地 worker 自动扩缩容有意保持保守，并且会在主机 load average
      已经很高时退避，因此多个并发
      Vitest 运行默认造成的影响更小。
    - 基础 Vitest 配置将 projects/config 文件标记为
      `forceRerunTriggers`，因此测试
      wiring 变化时 changed-mode 重新运行仍保持正确。
    - 配置会在受支持的主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；
      如果你想为直接 profiling 使用一个显式缓存位置，请设置
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及
      导入拆解输出。
    - `pnpm test:perf:imports:changed` 会将同一 profiling 视图限定到
      自 `origin/main` 以来变更的文件。
    - 分片计时数据会写入 `.artifacts/vitest-shard-timings.json`。
      整配置运行使用配置路径作为键；include-pattern CI
      分片会追加分片名称，因此可单独跟踪过滤后的分片。
    - 当某个热点测试仍然把大部分时间花在启动导入上时，
      请将重型依赖放在窄范围本地 `*.runtime.ts` 接缝后面，并
      直接 mock 该接缝，而不是仅为通过 `vi.mock(...)`
      传递它们而深度导入运行时 helper。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会比较该已提交
      diff 的路由后 `test:changed` 与原生根项目路径，并打印 wall time
      以及 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过将变更文件列表路由到
      `scripts/test-projects.mjs` 和根 Vitest 配置来 benchmark 当前
      dirty tree。
    - `pnpm test:perf:profile:main` 会为 Vitest/Vite 启动和转换开销
      写入主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为
      单元套件写入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制为一个 worker
- 范围：
  - 默认启动启用诊断的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 Gateway 网关消息、记忆和大载荷 churn
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化 helper
  - 断言 recorder 保持有界、合成 RSS 样本保持在压力预算内，并且每会话队列深度会回落为零
- 预期：
  - CI 安全且无需密钥
  - 用于稳定性回归跟进的窄线路，不能替代完整 Gateway 网关套件

### E2E（Gateway 网关 smoke）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 和 `isolate: false`，与仓库其余部分一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以 silent 模式运行，以减少控制台 I/O 开销。
- 有用的覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 表面、节点配对和更重的网络
- 预期：
  - 在 CI 中运行（当 pipeline 启用时）
  - 不需要真实密钥
  - 比单元测试有更多移动部件（可能更慢）

### E2E：OpenShell 后端 smoke

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell Gateway 网关
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 演练 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远程规范文件系统行为
- 预期：
  - 仅 opt-in；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和可工作的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关和沙箱
- 有用的覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1` 用于在手动运行更广泛 e2e 套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用于指向非默认 CLI binary 或 wrapper script

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认值：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型在 _今天_ 使用真实凭据时是否真的可用？”
  - 捕获提供商格式变更、工具调用差异、认证问题和速率限制行为
- 预期：
  - 设计上并非 CI 稳定（真实网络、真实提供商策略、配额、故障）
  - 会产生费用 / 使用速率限制额度
  - 优先运行缩小范围后的子集，而不是“所有内容”
- Live 运行会读取 `~/.profile`，以获取缺失的 API key。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置/认证材料复制到临时测试 home 中，因此单元测试 fixture 无法修改你的真实 `~/.openclaw`。
- 只有在你有意让 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：它保留 `[live] ...` 进度输出，但抑制额外的 `~/.profile` 通知，并静音 Gateway 网关启动日志/Bonjour 噪声。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（按提供商）：设置带逗号/分号格式的 `*_API_KEYS`，或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或通过 `OPENCLAW_LIVE_*_KEY` 进行每次 live 覆盖；测试会在收到速率限制响应时重试。
- 进度/heartbeat 输出：
  - Live 套件现在会向 stderr 输出进度行，因此即使 Vitest 控制台捕获处于安静状态，耗时较长的提供商调用也能显示为活跃。
  - `vitest.live.config.ts` 禁用 Vitest 控制台拦截，因此提供商/Gateway 网关进度行会在 live 运行期间立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型 heartbeat。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关/探测 heartbeat。

## 我应该运行哪个套件？

使用此决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果你改动较多，也运行 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：添加 `pnpm test:e2e`
- 调试“我的机器人宕机了” / 提供商特定故障 / 工具调用：运行缩小范围后的 `pnpm test:live`

## Live（触网）测试

有关 live 模型矩阵、CLI 后端 smoke、ACP smoke、Codex 应用服务器
harness，以及所有媒体提供商 live 测试（Deepgram、BytePlus、ComfyUI、图像、
音乐、视频、媒体 harness），以及 live 运行的凭据处理，请参阅
[Testing live suites](/zh-CN/help/testing-live)。有关专用更新和
插件验证清单，请参阅
[更新和插件测试](/zh-CN/help/testing-updates-plugins)。

## Docker runner（可选的“在 Linux 中可用”检查）

这些 Docker runner 分为两类：

- Live 模型 runner：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行其匹配的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），挂载你的本地配置目录和工作区（如果已挂载，也会读取 `~/.profile`）。匹配的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live runner 默认使用较小的 smoke 上限，以便完整 Docker sweep 仍然实用：
  `test:docker:live-models` 默认设置为 `OPENCLAW_LIVE_MAX_MODELS=12`，并且
  `test:docker:live-gateway` 默认设置为 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在你明确想要更大的穷尽扫描时，才覆盖这些环境变量。
- `test:docker:all` 通过 `test:docker:live-build` 构建一次 live Docker 镜像，通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包一次为 npm tarball，然后构建/复用两个 `scripts/e2e/Dockerfile` 镜像。bare 镜像只是用于安装/更新/插件依赖 lane 的 Node/Git runner；这些 lane 会挂载预构建的 tarball。functional 镜像会把同一个 tarball 安装到 `/app`，用于构建后应用功能 lane。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；planner 逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行所选计划。聚合运行使用加权本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程 slot，而资源上限会避免重型 live、npm-install 和多服务 lane 同时全部启动。如果单个 lane 比当前上限更重，调度器仍可在池为空时启动它，然后让它单独运行，直到再次有可用容量。默认值为 10 个 slot、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；仅当 Docker 主机有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。runner 默认执行 Docker preflight，移除陈旧的 OpenClaw E2E 容器，每 30 秒打印 Status，将成功 lane 的耗时存储在 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中使用这些耗时优先启动更长的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不构建或运行 Docker 的情况下打印加权 lane 清单，或使用 `node scripts/test-docker-all.mjs --plan-json` 打印所选 lane、package/image 需求和凭据的 CI 计划。
- `Package Acceptance` 是 GitHub 原生的 package 门禁，用于回答“这个可安装的 tarball 作为产品是否可用？”它会从 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一个候选 package，将其上传为 `package-under-test`，然后针对该确切 tarball 运行可复用的 Docker E2E lane，而不是重新打包所选 ref。Profile 按覆盖范围排序：`smoke`、`package`、`product` 和 `full`。有关 package/更新/插件契约、已发布升级 survivor 矩阵、发布默认值和失败分诊，请参阅[更新和插件测试](/zh-CN/help/testing-updates-plugins)。
- 构建和发布检查会在 tsdown 后运行 `scripts/check-cli-bootstrap-imports.mjs`。该保护会从 `dist/entry.js` 和 `dist/cli/run-main.js` 遍历静态构建图，并在命令分发前的启动阶段导入 Commander、prompt UI、undici 或日志等 package 依赖时失败；它还会让内置 Gateway 网关运行 chunk 保持在预算内，并拒绝对已知冷 Gateway 网关路径的静态导入。打包后的 CLI smoke 还覆盖根帮助、新手引导帮助、Doctor 帮助、Status、配置 schema 和 model-list 命令。
- Package Acceptance 旧版兼容性上限为 `2026.4.25`（包括 `2026.4.25-beta.*`）。在该截止点之前，harness 仅容忍已发布 package 的元数据缺口：省略的私有 QA inventory 条目、缺失的 `gateway install --wrapper`、tarball 派生 git fixture 中缺失的补丁文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。对于 `2026.4.25` 之后的 package，这些路径都是严格失败。
- 容器 smoke runner：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

Live 模型 Docker runner 还只会 bind-mount 所需的 CLI auth home（或者在运行未缩小时挂载所有受支持的 auth home），然后在运行前将它们复制到容器 home 中，以便外部 CLI OAuth 可以刷新 token，而不会修改宿主机 auth 存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，并通过 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 严格覆盖 Droid/OpenCode）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex 应用服务器测试框架冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + 开发智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性冒烟测试：`pnpm qa:otel:smoke` 是私有 QA 源码检出测试通道。它有意不属于包 Docker 发布通道，因为 npm 压缩包会省略 QA Lab。
- Open WebUI 实时冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm 压缩包新手引导/渠道/智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包后的 OpenClaw 压缩包，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，运行 Doctor，然后运行一次模拟的 OpenAI 智能体轮次。可用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建压缩包，用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机重建，或用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切换渠道。
- Skill 安装冒烟测试：`pnpm test:docker:skill-install` 会在 Docker 中全局安装打包后的 OpenClaw 压缩包，在配置中禁用上传归档安装，从搜索中解析当前实时 ClawHub Skill slug，用 `openclaw skills install` 安装它，并验证已安装的 Skill 以及 `.clawhub` 来源/锁定元数据。
- 更新频道切换冒烟测试：`pnpm test:docker:update-channel-switch` 会在 Docker 中全局安装打包后的 OpenClaw 压缩包，从包 `stable` 切换到 git `dev`，验证持久化的频道和插件更新后可工作，然后切回包 `stable` 并检查更新状态。
- 升级存活冒烟测试：`pnpm test:docker:upgrade-survivor` 会把打包后的 OpenClaw 压缩包安装到一个脏的旧用户夹具上，该夹具包含智能体、渠道配置、插件允许列表、过期插件依赖状态以及现有工作区/会话文件。它会运行包更新和非交互式 Doctor，不需要实时提供商或渠道密钥，然后启动一个 loopback Gateway 网关，并检查配置/状态保留以及启动/状态预算。
- 已发布版本升级存活冒烟测试：`pnpm test:docker:published-upgrade-survivor` 默认安装 `openclaw@latest`，播种真实的现有用户文件，用内置命令配方配置该基线，验证生成的配置，将该已发布安装更新到候选压缩包，运行非交互式 Doctor，写入 `.artifacts/upgrade-survivor/summary.json`，然后启动一个 loopback Gateway 网关，并检查已配置意图、状态保留、启动、`/healthz`、`/readyz` 和 RPC 状态预算。用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖一个基线，要求聚合调度器用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展开精确本地基线，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，并用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展开问题形态夹具，例如 `reported-issues`；`reported-issues` 集合包含 `configured-plugin-installs`，用于自动修复外部 OpenClaw 插件安装。Package Acceptance 将这些公开为 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，解析 `last-stable-4` 或 `all-since-2026.4.23` 等元基线令牌，并且 Full Release Validation 会把 release-soak 包门禁展开为 `last-stable-4 2026.4.23 2026.5.2 2026.4.15` 加 `reported-issues`。
- 会话运行时上下文冒烟测试：`pnpm test:docker:session-runtime-context` 会验证隐藏运行时上下文转录持久化，以及 Doctor 对受影响的重复提示重写分支的修复。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前树，在隔离 home 中用 `bun install -g` 安装它，并验证 `openclaw infer image providers --json` 返回内置图像提供商而不是挂起。可用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建压缩包，用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过主机构建，或用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认使用 npm `latest` 作为稳定基线，然后升级到候选压缩包。可在本地用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或在 GitHub 上用 Install Smoke 工作流的 `update_baseline_version` 输入覆盖。非 root 安装器检查会保留隔离的 npm 缓存，避免 root 拥有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重复运行之间复用 root/update/direct-npm 缓存。
- Install Smoke CI 会用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；需要覆盖直接 `npm install -g` 时，在本地运行脚本且不设置该环境变量。
- 智能体删除共享工作区 CLI 冒烟测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认构建根 Dockerfile 镜像，在隔离容器 home 中播种两个智能体和一个工作区，运行 `agents delete --json`，并验证有效 JSON 以及工作区保留行为。可用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关联网（两个容器，WS 凭证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照冒烟测试：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）会构建源码 E2E 镜像和一个 Chromium 层，用原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP 角色快照覆盖链接 URL、光标提升的可点击项、iframe 引用和 frame 元数据。
- OpenAI Responses web_search 最小推理回归：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟的 OpenAI 服务器，验证 `web_search` 将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制提供商 schema 拒绝，并检查原始详情出现在 Gateway 网关日志中。
- MCP 渠道桥接（播种的 Gateway 网关 + stdio 桥接 + 原始 Claude 通知 frame 冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi 包 MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile 允许/拒绝冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + 隔离 cron 和一次性 subagent 运行后的 stdio MCP 子进程拆除）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（本地路径、`file:`、带提升依赖的 npm registry、git 移动引用、ClawHub kitchen-sink、marketplace 更新以及 Claude-bundle 启用/检查的安装/更新冒烟测试）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳过 ClawHub 块，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认 kitchen-sink 包/运行时对。如果没有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，测试会使用密封的本地 ClawHub 夹具服务器。
- 插件未变化更新冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 插件生命周期矩阵冒烟测试：`pnpm test:docker:plugin-lifecycle-matrix` 会在裸容器中安装打包后的 OpenClaw 压缩包，安装一个 npm 插件，切换启用/禁用，通过本地 npm registry 升级和降级它，删除已安装代码，然后验证卸载仍会移除过期状态，同时记录每个生命周期阶段的 RSS/CPU 指标。
- 配置重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 插件：`pnpm test:docker:plugins` 覆盖本地路径、`file:`、带提升依赖的 npm registry、git 移动引用、ClawHub 夹具、marketplace 更新以及 Claude-bundle 启用/检查的安装/更新冒烟测试。`pnpm test:docker:plugin-update` 覆盖已安装插件的未变化更新行为。`pnpm test:docker:plugin-lifecycle-matrix` 覆盖带资源跟踪的 npm 插件安装、启用、禁用、升级、降级和缺失代码卸载。

要手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置后，套件专属镜像覆盖项（例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）仍会优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果本地尚不存在，脚本会拉取它。QR 和安装器 Docker 测试保留自己的 Dockerfile，因为它们验证的是包/安装行为，而不是共享的已构建应用运行时。

live-model Docker 运行器还会将当前 checkout 以只读方式 bind-mount，
并在容器内暂存到临时 workdir 中。这样可以保持运行时
镜像精简，同时仍然针对你的精确本地源代码/配置运行 Vitest。
暂存步骤会跳过大型的仅本地缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或
Gradle 输出目录，因此 Docker live 运行不会花费数分钟复制
机器特定的产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，因此 Gateway 网关 live 探测不会在容器内启动
真实的 Telegram/Discord 等渠道 worker。
`test:docker:live-models` 仍然运行 `pnpm test:live`，所以当你需要缩小或排除该 Docker lane 中的 Gateway 网关
live 覆盖范围时，也要传入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是更高层级的兼容性 smoke：它会启动一个
启用了 OpenAI 兼容 HTTP 端点的 OpenClaw 网关容器，
针对该网关启动一个固定版本的 Open WebUI 容器，通过
Open WebUI 登录，验证 `/api/models` 暴露 `openclaw/default`，然后通过 Open WebUI 的
`/api/chat/completions` 代理发送一次
真实聊天请求。
对于发布路径 CI 检查，如果应在 Open WebUI 登录和模型发现后停止，
且不等待 live 模型补全，请设置 `OPENWEBUI_SMOKE_MODE=models`。
首次运行可能明显更慢，因为 Docker 可能需要拉取
Open WebUI 镜像，并且 Open WebUI 可能需要完成自己的冷启动设置。
该 lane 需要可用的 live 模型 key，而 `OPENCLAW_PROFILE_FILE`
（默认是 `~/.profile`）是在 Docker 化运行中提供它的主要方式。
成功运行会打印一个小型 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意确定性的，不需要
真实的 Telegram、Discord 或 iMessage 账号。它会启动一个带种子的 Gateway 网关
容器，启动第二个会生成 `openclaw mcp serve` 的容器，然后
验证路由会话发现、transcript 读取、附件元数据、
live 事件队列行为、出站发送路由，以及通过真实 stdio MCP bridge 发送的 Claude 风格渠道 +
权限通知。通知检查会直接检查原始 stdio MCP frame，因此该 smoke 验证的是
bridge 实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要 live
模型 key。它会构建 repo Docker 镜像，在容器内启动一个真实 stdio MCP probe server，
通过嵌入式 Pi bundle
MCP 运行时物化该 server，执行该工具，然后验证 `coding` 和 `messaging` 保留
`bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会过滤它们。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要 live 模型
key。它会启动一个带种子的 Gateway 网关，并带有真实 stdio MCP probe server，运行一次
隔离的 cron turn 和一次 `/subagents spawn` one-shot child turn，然后验证
MCP child process 在每次运行后退出。

手动 ACP plain-language thread smoke（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归/调试工作流。ACP thread routing 验证可能还会再次需要它，因此不要删除。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 仅验证从 `OPENCLAW_PROFILE_FILE` source 的环境变量，使用临时配置/工作区目录，且不挂载外部 CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内缓存的 CLI 安装
- `$HOME` 下的外部 CLI auth 目录/文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围的提供商运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于在不需要重新构建的重新运行中复用现有 `openclaw:local-live` 镜像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭据来自 profile store（而不是 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关为 Open WebUI smoke 暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI smoke 使用的 nonce 检查 prompt
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像 tag

## 文档完整性检查

文档编辑后运行文档检查：`pnpm check:docs`。
当你还需要页内 heading 检查时，运行完整 Mintlify anchor 验证：`pnpm docs:check-links:anchors`。

## 离线回归（CI 安全）

这些是不使用真实提供商的“真实 pipeline”回归：

- Gateway 网关工具调用（mock OpenAI，真实 Gateway 网关 + Agent loop）：`src/gateway/gateway.test.ts`（用例："runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，写入配置 + 强制 auth）：`src/gateway/gateway.test.ts`（用例："runs wizard over ws and writes auth token config"）

## 智能体可靠性评估（Skills）

我们已经有一些 CI 安全测试，其行为类似“智能体可靠性评估”：

- 通过真实 Gateway 网关 + Agent loop 进行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话 wiring 和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

Skills 仍然缺少的内容（见 [Skills](/zh-CN/tools/skills)）：

- **决策：** 当 Skills 在 prompt 中列出时，智能体是否选择正确的 Skill（或避开无关的 Skill）？
- **合规性：** 智能体是否在使用前读取 `SKILL.md`，并遵循必需步骤/参数？
- **工作流契约：** 断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来评估应首先保持确定性：

- 使用 mock 提供商的 scenario runner，用于断言工具调用 + 顺序、Skill 文件读取和会话 wiring。
- 一小组聚焦 Skill 的场景（使用 vs 避免、gating、prompt injection）。
- 可选 live 评估（opt-in、env-gated）只在 CI 安全套件就位后添加。

## 契约测试（插件和渠道形态）

契约测试会验证每个注册的插件和渠道都符合其
接口契约。它们会遍历所有发现的插件，并运行一组
形态和行为断言。默认的 `pnpm test` unit lane 会刻意
跳过这些共享 seam 和 smoke 文件；当你触碰共享渠道或提供商 surface 时，
请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形态（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息 payload 结构
- **inbound** - 入站消息处理
- **actions** - 渠道 action handlers
- **threading** - Thread ID 处理
- **directory** - Directory/roster API
- **group-policy** - 群组策略执行

### 提供商状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件 registry 形态

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - Auth 流程契约
- **auth-choice** - Auth 选择/选取
- **catalog** - 模型 catalog API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形态/接口
- **wizard** - 设置向导

### 何时运行

- 在更改 plugin-sdk exports 或 subpaths 后
- 在添加或修改渠道或提供商插件后
- 在重构插件注册或发现后

契约测试会在 CI 中运行，并且不需要真实 API keys。

## 添加回归（指南）

当你修复 live 中发现的提供商/模型问题时：

- 尽可能添加 CI 安全回归（mock/stub 提供商，或捕获精确的 request-shape 转换）
- 如果它本质上只能 live 运行（rate limits、auth policies），请保持 live 测试范围狭窄，并通过环境变量 opt-in
- 优先针对能捕获 bug 的最小层级：
  - 提供商请求转换/replay bug → 直接 models 测试
  - Gateway 网关会话/history/tool pipeline bug → Gateway 网关 live smoke 或 CI 安全 Gateway 网关 mock 测试
- SecretRef 遍历 guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从 registry metadata（`listSecretTargetRegistryEntries()`）为每个 SecretRef class 派生一个采样目标，然后断言 traversal-segment exec ids 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加新的 `includeInPlan` SecretRef 目标 family，请更新该测试中的 `classifyTargetClass`。该测试会刻意在未分类的目标 ids 上失败，因此新 class 不能被静默跳过。

## 相关

- [Testing live](/zh-CN/help/testing-live)
- [更新和插件测试](/zh-CN/help/testing-updates-plugins)
- [CI](/zh-CN/ci)
