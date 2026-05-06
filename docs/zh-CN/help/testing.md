---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元/e2e/live 套件、Docker 运行器，以及每项测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-05-06T02:51:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab32451166f7d0b372b618bb409606bf371f291a1fc848e3d3e717db43dc939
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三套 Vitest 测试套件（单元/集成、e2e、live）和一小组
Docker runner。本文档是一份“我们如何测试”的指南：

- 每个套件覆盖什么（以及它刻意_不_覆盖什么）。
- 常见工作流（本地、推送前、调试）应运行哪些命令。
- live 测试如何发现凭据并选择模型/提供商。
- 如何为真实世界的模型/提供商问题添加回归测试。

<Note>
**QA 栈（qa-lab、qa-channel、live 传输 lane）**单独记录在：

- [QA overview](/zh-CN/concepts/qa-e2e-automation) - 架构、命令界面、场景编写。
- [Matrix QA](/zh-CN/concepts/qa-matrix) - `pnpm openclaw qa matrix` 的参考。
- [QA channel](/zh-CN/channels/qa-channel) - 由仓库支持的场景使用的合成传输插件。

本页覆盖常规测试套件以及 Docker/Parallels runner 的运行方式。下面的 QA 专用 runner 小节（[QA 专用 runner](#qa-specific-runners)）列出具体的 `qa` 调用，并回指上面的参考资料。
</Note>

## 快速开始

大多数时候：

- 完整门禁（推送前预期执行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在资源充足的机器上更快运行本地完整套件：`pnpm test:max`
- 直接 Vitest watch 循环：`pnpm test:watch`
- 直接文件定位现在也会路由扩展/渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 在迭代单个失败时，优先使用定向运行。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA lane：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改测试或想要额外信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

调试真实提供商/模型时（需要真实凭据）：

- live 套件（模型 + Gateway 网关工具/图片探针）：`pnpm test:live`
- 静默定位一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 运行时性能报告：派发 `OpenClaw Performance`，设置
  `live_gpt54=true` 以运行一次真实的 `openai/gpt-5.4` agent 轮次，或设置
  `deep_profile=true` 以生成 Kova CPU/堆/跟踪产物。每日定时运行会在配置了
  `CLAWGRIT_REPORTS_TOKEN` 时，将 mock-provider、deep-profile 和 GPT 5.4 lane 产物发布到
  `openclaw/clawgrit-reports`。mock-provider 报告还包括源码级 Gateway 网关启动、内存、
  插件压力、重复 fake-model hello-loop，以及 CLI 启动数据。
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 每个选中的模型现在都会运行一次文本轮次，再加一个小型文件读取风格探针。
    元数据声明支持 `image` 输入的模型还会运行一个小型图片轮次。
    在隔离提供商失败时，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用额外探针。
  - CI 覆盖：每日 `OpenClaw Scheduled Live And E2E Checks` 和手动
    `OpenClaw Release Checks` 都会调用可复用的 live/E2E 工作流，并设置
    `include_live_suites: true`，其中包含按提供商分片的独立 Docker live 模型
    矩阵作业。
  - 对于聚焦的 CI 重跑，派发 `OpenClaw Live And E2E Checks (Reusable)`，
    并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和它的
    定时/发布调用方。
- 原生 Codex 绑定聊天 smoke：`pnpm test:docker:live-codex-bind`
  - 针对 Codex app-server 路径运行一条 Docker live lane，绑定一个带有 `/codex bind` 的合成
    Slack 私信，执行 `/codex fast` 和
    `/codex permissions`，然后验证普通回复和图片附件会通过原生插件绑定路由，而不是 ACP。
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`
  - 通过插件自有的 Codex app-server harness 运行 Gateway 网关 agent 轮次，
    验证 `/codex status` 和 `/codex models`，并默认执行图片、
    cron MCP、sub-agent 和 Guardian 探针。在隔离其他 Codex
    app-server 失败时，可用 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 禁用 sub-agent 探针。要进行聚焦的 sub-agent 检查，请禁用其他探针：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置了 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则它会在 sub-agent 探针后退出。
- Crestodian 救援命令 smoke：`pnpm test:live:crestodian-rescue-channel`
  - 对消息渠道救援命令界面的可选双保险检查。
    它会执行 `/crestodian status`，排队一个持久模型变更，
    回复 `/crestodian yes`，并验证审计/配置写入路径。
- Crestodian planner Docker smoke：`pnpm test:docker:crestodian-planner`
  - 在无配置容器中运行 Crestodian，并在 `PATH` 上放置一个假的 Claude CLI，
    验证模糊 planner 回退会转换为带审计的类型化配置写入。
- Crestodian 首次运行 Docker smoke：`pnpm test:docker:crestodian-first-run`
  - 从空的 OpenClaw 状态目录启动，将裸 `openclaw` 路由到
    Crestodian，应用设置/模型/agent/Discord 插件 + SecretRef 写入，
    验证配置，并验证审计条目。同一个 Ring 0 设置路径也由 QA Lab 中的
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot/Kimi 成本 smoke：设置 `MOONSHOT_API_KEY` 后，运行
  `openclaw models list --provider moonshot --json`，然后运行一个隔离的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  来对接 `moonshot/kimi-k2.6`。验证 JSON 报告 Moonshot/K2.6，且
  assistant transcript 存储了标准化的 `usage.cost`。

<Tip>
当你只需要一个失败用例时，优先通过下面描述的 allowlist 环境变量缩小 live 测试范围。
</Tip>

## QA 专用 runner

当你需要 QA-lab 真实性时，这些命令与主测试套件并列使用：

CI 在专用工作流中运行 QA Lab。Agentic parity 嵌套在
`QA-Lab - All Lanes` 和发布验证下，而不是独立的 PR 工作流。
广泛验证应使用 `Full Release Validation`，并设置
`rerun_group=qa-parity`，或使用 release-checks QA 组。稳定/默认发布
检查将详尽的 live/Docker soak 保持在 `run_release_soak=true` 后面；`full`
profile 会强制开启 soak。`QA-Lab - All Lanes`
每晚在 `main` 上运行，也可通过手动派发运行，并将 mock parity lane、live
Matrix lane、Convex 管理的 live Telegram lane，以及 Convex 管理的 live Discord
lane 作为并行作业。定时 QA 和发布检查会显式传递 Matrix
`--profile fast`，而 Matrix CLI 和手动工作流输入默认值仍为 `all`；手动派发可以将 `all` 分片为 `transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release
Checks` 会在发布批准前运行 parity 加上 fast Matrix 和 Telegram lane，
并对发布传输检查使用 `mock-openai/gpt-5.5`，以保持确定性并避免常规提供商插件启动。这些 live 传输
Gateway 网关会禁用记忆搜索；记忆行为仍由 QA parity
套件覆盖。

完整发布 live media 分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已经包含
`ffmpeg` 和 `ffprobe`。Docker live 模型/后端分片使用共享的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像，该镜像会为每个选中的
commit 构建一次，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取它，而不是在
每个分片内重新构建。

- `pnpm openclaw qa suite`
  - 直接在主机上运行由仓库支持的 QA 场景。
  - 默认使用隔离的 Gateway 网关工作进程并行运行多个选定场景。`qa-channel` 默认并发数为 4（受选定场景数量限制）。使用 `--concurrency <count>` 调整工作进程数量，或使用 `--concurrency 1` 运行较旧的串行通道。
  - 当任何场景失败时以非零状态退出。当你想要保留工件但不想要失败退出码时，使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 会启动一个本地 AIMock 支持的提供商服务器，用于实验性的固定数据和协议模拟覆盖，而不会替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm test:plugins:kitchen-sink-live`
  - 通过 QA Lab 运行实时 OpenAI Kitchen Sink 插件压力测试。它会安装外部 Kitchen Sink 包，验证插件 SDK 表面清单，探测 `/healthz` 和 `/readyz`，记录 Gateway 网关 CPU/RSS 证据，运行一次实时 OpenAI 轮次，并检查对抗性诊断。需要实时 OpenAI 凭证，例如 `OPENAI_API_KEY`。在已注入凭证的 Testbox 会话中，当存在 `openclaw-testbox-env` 辅助程序时，它会自动加载 Testbox 实时凭证配置。
- `pnpm test:gateway:cpu-scenarios`
  - 运行 Gateway 网关启动基准以及一小组模拟 QA Lab 场景包（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`），并在 `.artifacts/gateway-cpu-scenarios/` 下写入合并后的 CPU 观察摘要。
  - 默认只标记持续高 CPU 观察结果（`--cpu-core-warn` 加 `--hot-wall-warn-ms`），因此短暂的启动突增会作为指标记录，而不会看起来像持续数分钟的 Gateway 网关占满回归。
  - 使用已构建的 `dist` 工件；当检出中尚无最新运行时输出时，请先运行构建。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux 虚拟机中运行同一 QA 套件。
  - 保持与主机上 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商/模型选择标志。
  - 实时运行会转发对 guest 可行的受支持 QA 凭证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须位于仓库根目录下，以便 guest 可通过挂载的工作区写回。
  - 在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告和摘要以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动由 Docker 支持的 QA 站点，用于操作员式 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建 npm tarball，在 Docker 中全局安装它，运行非交互式 OpenAI API key 新手引导，默认配置 Telegram，验证打包后的插件运行时在无启动依赖修复的情况下加载，运行 Doctor，并针对模拟的 OpenAI 端点运行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 通过 Discord 运行同一打包安装通道。
- `pnpm test:docker:session-runtime-context`
  - 为嵌入式运行时上下文转录运行确定性的已构建应用 Docker smoke。它验证隐藏的 OpenClaw 运行时上下文会作为非显示自定义消息持久化，而不是泄漏到可见用户轮次中；随后植入一个受影响的损坏会话 JSONL，并验证 `openclaw doctor --fix` 会将其重写到活动分支且创建备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个 OpenClaw 包候选版本，运行已安装包的新手引导，通过已安装的 CLI 配置 Telegram，然后复用实时 Telegram QA 通道，并将该已安装包作为 SUT Gateway 网关。
  - 默认使用 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；设置 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或 `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可测试已解析的本地 tarball，而不是从注册表安装。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证来源。对于 CI/发布自动化，设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，以及 `OPENCLAW_QA_CONVEX_SITE_URL` 和角色 secret。如果 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色 secret，Docker 包装器会自动选择 Convex。
  - 包装器会先在主机上验证 Telegram 或 Convex 凭证环境变量，再执行 Docker 构建/安装工作。仅在有意调试凭证前置设置时设置 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅为此通道覆盖共享的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将此通道作为手动维护者工作流 `NPM Telegram Beta E2E` 暴露。它不会在合并时运行。该工作流使用 `qa-live-shared` 环境和 Convex CI 凭证租约。
- GitHub Actions 还暴露 `Package Acceptance`，用于针对一个候选包进行旁路产品证明。它接受可信 ref、已发布的 npm spec、HTTPS tarball URL 加 SHA-256，或来自另一次运行的 tarball 工件，将标准化后的 `openclaw-current.tgz` 上传为 `package-under-test`，然后使用 smoke、package、product、full 或自定义通道配置运行现有 Docker E2E 调度器。设置 `telegram_mode=mock-openai` 或 `live-frontier`，即可针对同一个 `package-under-test` 工件运行 Telegram QA 工作流。
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

- 工件证明会从另一次 Actions 运行下载 tarball 工件：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，启动已配置 OpenAI 的 Gateway 网关，然后通过配置编辑启用内置渠道/插件。
  - 验证设置发现会让未配置的可下载插件保持缺席，第一次配置后的 Doctor 修复会显式安装每个缺失的可下载插件，并且第二次重启不会运行隐藏的依赖修复。
  - 还会安装一个已知较旧的 npm 基线，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本的更新后 Doctor 会清理旧版插件依赖残留，而不依赖 harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels guest 运行原生打包安装更新 smoke。每个选定平台会先安装请求的基线包，然后在同一 guest 中运行已安装的 `openclaw update` 命令，并验证已安装版本、更新状态、Gateway 网关就绪性，以及一次本地智能体轮次。
  - 在迭代单个 guest 时使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要工件路径和每个通道的状态。
  - OpenAI 通道默认使用 `openai/gpt-5.5` 作为实时智能体轮次证明。仅在有意验证另一个 OpenAI 模型时，传入 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 用主机超时包装较长的本地运行，避免 Parallels 传输停滞消耗剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本会在 `/tmp/openclaw-parallels-npm-update.*` 下写入嵌套通道日志。在假定外层包装器挂起之前，请先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - Windows 更新在冷 guest 上可能会在更新后 Doctor 和包更新工作中花费 10 到 15 分钟；只要嵌套 npm 调试日志仍在推进，这仍是正常状态。
  - 不要将此聚合包装器与单独的 Parallels macOS、Windows 或 Linux smoke 通道并行运行。它们共享虚拟机状态，可能会在快照恢复、包服务或 guest Gateway 网关状态上冲突。
  - 更新后证明会运行常规内置插件表面，因为语音、图像生成和媒体理解等能力 facade 会通过内置运行时 API 加载，即使智能体轮次本身只检查简单文本响应。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议 smoke 测试。
- `pnpm openclaw qa matrix`
  - 针对一次性 Docker 支持的 Tuwunel homeserver 运行 Matrix 实时 QA 通道。仅支持源码检出，打包安装不会包含 `qa-lab`。
  - 完整 CLI、配置文件/场景目录、环境变量和工件布局：[Matrix QA](/zh-CN/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用来自环境变量的驱动和 SUT bot token，针对真实私有群组运行 Telegram 实时 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是数字 Telegram chat id。
  - 支持 `--credential-source convex` 以使用共享池化凭证。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以选择池化租约。
  - 当任何场景失败时以非零状态退出。当你想要保留工件但不想要失败退出码时，使用 `--allow-failures`。
  - 需要同一私有群组中的两个不同 bot，且 SUT bot 需要暴露 Telegram 用户名。
  - 为了稳定进行 bot 到 bot 观察，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保驱动 bot 能观察群组 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 observed-messages 工件。回复场景包含从驱动发送请求到观察到 SUT 回复的 RTT。

实时传输通道共享一个标准合约，以避免新传输发生漂移；每个通道的覆盖矩阵位于 [QA overview → 实时传输覆盖范围](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是广泛的合成套件，不属于该矩阵。

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的池中获取独占租约，在通道运行期间对该租约发送 Heartbeat，并在关闭时释放该租约。

参考 Convex 项目脚手架：

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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选跟踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许仅用于本地开发的 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常运行时应使用 `https://`。

维护者管理命令（池添加/移除/列出）明确要求使用
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

面向维护者的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在实时运行前使用 `doctor` 检查 Convex 站点 URL、broker 密钥、
端点前缀、HTTP 超时以及管理/列表可达性，而不会打印
密钥值。在脚本和 CI 工具中使用 `--json` 获取机器可读输出。

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

Telegram 类型的负载形状：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字形式的 Telegram 聊天 ID 字符串。
- `admin/add` 会针对 `kind: "telegram"` 验证此形状，并拒绝格式错误的负载。

### 向 QA 添加一个渠道

新渠道适配器的架构和场景辅助工具名称位于 [QA overview → 添加一个渠道](/zh-CN/concepts/qa-e2e-automation#adding-a-channel)。最低要求：在共享的 `qa-lab` 主机接缝上实现传输 runner，在插件清单中声明 `qaRunners`，挂载为 `openclaw qa <runner>`，并在 `qa/scenarios/` 下编写场景。

## 测试套件（在哪里运行什么）

可以把这些套件理解为“真实性逐步增加”（同时不稳定性/成本也逐步增加）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：非定向运行使用 `vitest.full-*.config.ts` 分片集，并可能将多项目分片展开为按项目配置，以便并行调度
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的核心/单元清单；UI 单元测试在专用的 `unit-ui` 分片中运行
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 已知 bug 的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应快速且稳定
  - 解析器和公共表面加载器测试必须用生成的微型插件 fixture 证明广泛的 `api.js` 和
    `runtime-api.js` 回退行为，而不是使用真实内置插件源 API。真实插件 API 加载属于
    插件自有的契约/集成套件。

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - 非定向 `pnpm test` 会运行十二个较小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个庞大的原生根项目进程。这会降低负载机器上的峰值 RSS，并避免自动回复/插件工作拖慢无关套件。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不实际。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先通过作用域化 lane 路由显式文件/目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可以避免支付完整根项目启动成本。
    - `pnpm test:changed` 默认会将变更的 git 路径展开为低成本的作用域化 lane：直接测试编辑、相邻 `*.test.ts` 文件、显式源映射，以及本地导入图依赖项。配置/设置/package 编辑不会广泛运行测试，除非你显式使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄范围工作的常规智能本地检查门禁。它会将 diff 分类为核心、核心测试、插件、插件测试、应用、文档、发布元数据、实时 Docker 工具和工具链，然后运行匹配的类型检查、lint 和守卫命令。它不运行 Vitest 测试；要获得测试证明，请调用 `pnpm test:changed` 或显式的 `pnpm test <target>`。仅发布元数据的版本 bump 会运行定向版本/配置/根依赖检查，并带有一个守卫来拒绝顶层版本字段之外的 package 变更。
    - 实时 Docker ACP harness 编辑会运行聚焦检查：实时 Docker 认证脚本的 shell 语法，以及实时 Docker 调度器 dry-run。仅当 diff 限于 `scripts["test:docker:live-*"]` 时才包含 `package.json` 变更；依赖、导出、版本和其他 package 表面编辑仍使用更广泛的守卫。
    - 来自 agents、commands、plugins、auto-reply 辅助工具、`plugin-sdk` 和类似纯工具区域的轻导入单元测试会路由到 `unit-fast` lane，该 lane 会跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件保留在现有 lane 上。
    - 选定的 `plugin-sdk` 和 `commands` 辅助源文件也会将变更模式运行映射到这些轻量 lane 中的显式相邻测试，因此辅助工具编辑可以避免重新运行该目录的完整重型套件。
    - `auto-reply` 为顶层核心辅助工具、顶层 `reply.*` 集成测试以及 `src/auto-reply/reply/**` 子树提供专用桶。CI 还会进一步将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，避免一个导入繁重的桶占用完整 Node 尾部时间。
    - 常规 PR/main CI 会有意跳过插件批量 sweep 和仅发布用的 `agentic-plugins` 分片。Full Release Validation 会为发布候选上的这些插件/插件重型套件分发独立的 `Plugin Prerelease` 子工作流。

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - 当你更改消息工具发现输入或压缩运行时
      上下文时，请保留两层覆盖。
    - 为纯路由和规范化
      边界添加聚焦的辅助回归测试。
    - 保持嵌入式 runner 集成套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些套件会验证作用域化 ID 和压缩行为仍会流经
      真实的 `run.ts` / `compact.ts` 路径；仅辅助工具测试
      不能充分替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置固定 `isolate: false`，并在根项目、e2e 和实时配置中使用
      非隔离 runner。
    - 根 UI lane 保留其 `jsdom` 设置和优化器，但同样运行在
      共享的非隔离 runner 上。
    - 每个 `pnpm test` 分片都会从共享 Vitest 配置继承相同的 `threads` + `isolate: false`
      默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node
      进程添加 `--no-maglev`，以减少大型本地运行中的 V8 编译抖动。
      设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与原生 V8
      行为对比。

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` 会显示一个 diff 触发哪些架构 lane。
    - pre-commit 钩子只做格式化。它会重新暂存格式化后的文件，
      不运行 lint、类型检查或测试。
    - 当你需要智能本地检查门禁时，在交接或推送前显式运行 `pnpm check:changed`。
    - `pnpm test:changed` 默认会通过低成本作用域化 lane 路由。仅当智能体
      判断 harness、配置、package 或契约编辑确实需要更广泛的
      Vitest 覆盖时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由
      行为，只是使用更高的 worker 上限。
    - 本地 worker 自动扩缩有意保持保守，并会在主机负载平均值已经较高时
      退避，因此多个并发
      Vitest 运行默认会降低影响。
    - 基础 Vitest 配置将项目/配置文件标记为
      `forceRerunTriggers`，因此当测试
      wiring 变化时，变更模式重新运行仍保持正确。
    - 配置会在受支持的
      主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接性能分析
      使用一个显式缓存位置，请设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` 会启用 Vitest 导入时长报告以及
      导入分解输出。
    - `pnpm test:perf:imports:changed` 会将相同的性能分析视图限定到
      自 `origin/main` 以来变更的文件。
    - 分片计时数据会写入 `.artifacts/vitest-shard-timings.json`。
      整体配置运行使用配置路径作为键；include-pattern CI
      分片会追加分片名称，因此过滤后的分片可以单独跟踪。
    - 当某个热点测试仍将大部分时间花在启动导入上时，
      请将重型依赖放在狭窄的本地 `*.runtime.ts` 接缝后面，并
      直接 mock 该接缝，而不是为了通过 `vi.mock(...)` 传递它们
      去深度导入运行时辅助工具。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会比较该已提交
      diff 的路由后 `test:changed` 与原生根项目路径，并打印墙钟时间
      以及 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过
      `scripts/test-projects.mjs` 和根 Vitest 配置路由变更文件列表，
      对当前脏工作树进行基准测试。
    - `pnpm test:perf:profile:main` 会为
      Vitest/Vite 启动和转换开销写入主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件并行时，为
      单元套件写入 runner CPU+heap profile。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制使用一个 worker
- 范围：
  - 启动一个默认启用诊断的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成 Gateway 网关消息、记忆和大负载 churn
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化辅助工具
  - 断言 recorder 保持有界，合成 RSS 样本保持低于压力预算，并且每个会话的队列深度回落到零
- 预期：
  - CI 安全且无密钥
  - 用于稳定性回归跟进的窄 lane，而不是完整 Gateway 网关套件的替代品

### E2E（Gateway 网关 smoke）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads`，并设置 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 有用的覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关的端到端行为
  - WebSocket/HTTP 表面、节点配对，以及更重的网络功能
- 预期：
  - 在 CI 中运行（当流水线中启用时）
  - 不需要真实密钥
  - 比单元测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell Gateway 网关
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 测试 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远程规范化文件系统行为
- 预期：
  - 仅按需启用；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 以及可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，随后销毁测试 Gateway 网关和沙箱
- 有用的覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1` 在手动运行更广泛的 e2e 套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 指向非默认的 CLI 二进制文件或包装脚本

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型在_今天_使用真实凭证是否真的可用？”
  - 捕获提供商格式变更、工具调用细节、凭证问题和速率限制行为
- 预期：
  - 按设计并非 CI 稳定（真实网络、真实提供商策略、配额、故障）
  - 会产生费用 / 使用速率限制
  - 优先运行缩窄后的子集，而不是“全部”
- Live 运行会 source `~/.profile` 以获取缺失的 API key。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置/认证材料复制到临时测试 home 中，这样单元 fixture 就无法修改你真实的 `~/.openclaw`。
- 仅当你有意需要 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：它保留 `[live] ...` 进度输出，但抑制额外的 `~/.profile` 提示，并静音 Gateway 网关引导日志/Bonjour 噪声。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（按提供商）：使用逗号/分号格式设置 `*_API_KEYS`，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可通过 `OPENCLAW_LIVE_*_KEY` 对每次 live 运行覆盖；测试会在收到速率限制响应时重试。
- 进度/Heartbeat 输出：
  - Live 套件现在会向 stderr 发出进度行，因此即使 Vitest 控制台捕获很安静，长时间提供商调用也能显示为正在活动。
  - `vitest.live.config.ts` 禁用 Vitest 控制台拦截，因此提供商/Gateway 网关进度行会在 live 运行期间立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型 Heartbeat。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关/探测 Heartbeat。

## 我应该运行哪个套件？

使用此决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果改动很多，也运行 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：添加 `pnpm test:e2e`
- 调试“我的 bot 宕机了”/ 提供商特定故障 / 工具调用：运行缩窄后的 `pnpm test:live`

## Live（触网）测试

有关 live 模型矩阵、CLI 后端冒烟测试、ACP 冒烟测试、Codex app-server
harness，以及所有媒体提供商 live 测试（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness）以及 live 运行的凭证处理，请参阅
[测试 live 套件](/zh-CN/help/testing-live)。有关专门的更新和
插件验证检查清单，请参阅
[更新和插件测试](/zh-CN/help/testing-updates-plugins)。

## Docker runner（可选的“在 Linux 中可用”检查）

这些 Docker runner 分为两类：

- Live 模型 runner：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行各自匹配 profile-key 的 live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），挂载你的本地配置目录和工作区（如果已挂载，也会 source `~/.profile`）。匹配的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live runner 默认使用更小的冒烟上限，因此完整 Docker 扫描仍然可行：
  `test:docker:live-models` 默认设置为 `OPENCLAW_LIVE_MAX_MODELS=12`，并且
  `test:docker:live-gateway` 默认设置为 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。仅当你明确想要更大的穷尽扫描时，
  才覆盖这些环境变量。
- `test:docker:all` 通过 `test:docker:live-build` 构建一次 live Docker 镜像，通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包一次为 npm tarball，然后构建/复用两个 `scripts/e2e/Dockerfile` 镜像。裸镜像只是用于安装/更新/插件依赖 lane 的 Node/Git runner；这些 lane 会挂载预构建的 tarball。功能镜像会将同一个 tarball 安装到 `/app`，用于构建后应用功能 lane。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行所选计划。聚合使用加权本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会避免重型 live、npm-install 和多服务 lane 同时全部启动。如果单个 lane 比活动上限更重，调度器仍可在池为空时启动它，然后让它独占运行，直到容量再次可用。默认值为 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；仅当 Docker 主机有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。runner 默认执行 Docker 预检，移除陈旧的 OpenClaw E2E 容器，每 30 秒打印状态，将成功 lane 的耗时存储到 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中使用这些耗时优先启动更长的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 打印加权 lane 清单而不构建或运行 Docker，或使用 `node scripts/test-docker-all.mjs --plan-json` 打印所选 lane、包/镜像需求和凭证的 CI 计划。
- `Package Acceptance` 是 GitHub 原生的包门禁，用于回答“这个可安装 tarball 作为产品是否可用？”它会从 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一个候选包，将其上传为 `package-under-test`，然后针对这个精确 tarball 运行可复用 Docker E2E lane，而不是重新打包所选 ref。profile 按覆盖范围排序：`smoke`、`package`、`product` 和 `full`。有关包/更新/插件契约、已发布升级幸存者矩阵、发布默认值和失败分流，请参阅[更新和插件测试](/zh-CN/help/testing-updates-plugins)。
- 构建和发布检查会在 tsdown 之后运行 `scripts/check-cli-bootstrap-imports.mjs`。该守卫会从 `dist/entry.js` 和 `dist/cli/run-main.js` 遍历静态构建图；如果命令分发前的启动导入了 Commander、prompt UI、undici 或 logging 等包依赖，它会失败；它还会将内置 Gateway 网关运行 chunk 保持在预算内，并拒绝静态导入已知的冷 Gateway 网关路径。打包后的 CLI 冒烟测试还覆盖根帮助、onboard 帮助、Doctor 帮助、Status、配置 schema 和模型列表命令。
- Package Acceptance 旧版兼容性截止到 `2026.4.25`（包含 `2026.4.25-beta.*`）。在该截止点之前，harness 仅容忍已发布包的元数据缺口：省略的私有 QA inventory 条目、缺失的 `gateway install --wrapper`、tarball 派生 git fixture 中缺失的 patch 文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。对于 `2026.4.25` 之后的包，这些路径都是严格失败。
- 容器冒烟 runner：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix` 和 `test:docker:config-reload` 会启动一个或多个真实容器并验证更高层的集成路径。

Live 模型 Docker runner 还只会绑定挂载所需的 CLI 认证 home（如果运行未缩窄，则挂载所有支持的 home），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 可以刷新 token，而不会修改主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，并通过 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 严格覆盖 Droid/OpenCode）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + 开发智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性冒烟测试：`pnpm qa:otel:smoke` 是私有 QA 源码检出流水线。它有意不属于包 Docker 发布流水线，因为 npm tarball 会省略 QA Lab。
- Open WebUI 实时冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导/渠道/智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包后的 OpenClaw tarball，通过环境引用新手引导配置 OpenAI，并默认配置 Telegram，运行 Doctor，并运行一次模拟的 OpenAI 智能体轮次。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机构建，或用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切换渠道。
- 更新渠道切换冒烟测试：`pnpm test:docker:update-channel-switch` 会在 Docker 中全局安装打包后的 OpenClaw tarball，从包 `stable` 切换到 git `dev`，验证持久化的渠道和插件更新后的工作情况，然后切回包 `stable` 并检查更新 Status。
- 升级幸存者冒烟测试：`pnpm test:docker:upgrade-survivor` 会把打包后的 OpenClaw tarball 安装到一个包含智能体、渠道配置、插件允许列表、陈旧插件依赖状态以及现有工作区/会话文件的脏旧用户夹具上。它会运行包更新和非交互式 Doctor，不使用实时提供商或渠道密钥，然后启动一个 local loopback Gateway 网关，并检查配置/状态保留以及启动/Status 预算。
- 已发布升级幸存者冒烟测试：`pnpm test:docker:published-upgrade-survivor` 默认安装 `openclaw@latest`，填充真实的现有用户文件，用内置命令配方配置该基线，验证生成的配置，将该已发布安装更新到候选 tarball，运行非交互式 Doctor，写入 `.artifacts/upgrade-survivor/summary.json`，然后启动一个 local loopback Gateway 网关，并检查已配置意图、状态保留、启动、`/healthz`、`/readyz` 和 RPC Status 预算。用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖一个基线，让聚合调度器通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展开精确本地基线，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，并通过 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展开问题形状的夹具，例如 `reported-issues`；`reported-issues` 集合包含 `configured-plugin-installs`，用于自动修复外部 OpenClaw 插件安装。Package Acceptance 将这些公开为 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，解析 `last-stable-4` 或 `all-since-2026.4.23` 等元基线 token，并且 Full Release Validation 会将发布浸泡包门禁扩展为 `last-stable-4 2026.4.23 2026.5.2 2026.4.15` 加 `reported-issues`。
- 会话运行时上下文冒烟测试：`pnpm test:docker:session-runtime-context` 会验证隐藏运行时上下文 transcript 持久化，以及 Doctor 对受影响的重复 prompt-rewrite 分支的修复。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前树，在隔离的 home 中用 `bun install -g` 安装，并验证 `openclaw infer image providers --json` 返回内置图像提供商而不是挂起。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过主机构建，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认使用 npm `latest` 作为升级到候选 tarball 之前的 stable 基线。本地用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或在 GitHub 上用 Install Smoke 工作流的 `update_baseline_version` 输入覆盖。非 root 安装器检查会保留隔离的 npm 缓存，因此 root 拥有的缓存条目不会掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`，以便在本地重复运行时复用 root/update/direct-npm 缓存。
- Install Smoke CI 会用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；当需要直接 `npm install -g` 覆盖时，不带该环境变量在本地运行脚本。
- 智能体删除共享工作区 CLI 冒烟测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认构建根 Dockerfile 镜像，在隔离容器 home 中填充两个智能体和一个工作区，运行 `agents delete --json`，并验证有效 JSON 以及保留工作区行为。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照冒烟测试：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）会构建源码 E2E 镜像和一个 Chromium 层，用原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP role 快照覆盖链接 URL、光标提升的可点击项、iframe 引用和 frame 元数据。
- OpenAI Responses web_search 最小推理回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟 OpenAI 服务器，验证 `web_search` 将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制提供商 schema 拒绝，并检查原始详情出现在 Gateway 网关日志中。
- MCP 渠道桥接（已填充种子的 Gateway 网关 + stdio 桥接 + 原始 Claude notification-frame 冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile 允许/拒绝冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + 隔离 cron 和一次性 subagent 运行后的 stdio MCP 子进程清理）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（本地路径、`file:`、带提升依赖的 npm registry、git 移动引用、ClawHub kitchen-sink、marketplace 更新以及 Claude-bundle 启用/检查的安装/更新冒烟测试）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 跳过 ClawHub 块，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认的 kitchen-sink 包/运行时配对。没有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` 时，测试会使用 hermetic 本地 ClawHub 夹具服务器。
- 插件更新未变冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 插件生命周期矩阵冒烟测试：`pnpm test:docker:plugin-lifecycle-matrix` 会在裸容器中安装打包后的 OpenClaw tarball，安装一个 npm 插件，切换启用/禁用，通过本地 npm registry 对其升级和降级，删除已安装代码，然后验证卸载仍会移除陈旧状态，同时记录每个生命周期阶段的 RSS/CPU 指标。
- 配置重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 插件：`pnpm test:docker:plugins` 覆盖本地路径、`file:`、带提升依赖的 npm registry、git 移动引用、ClawHub 夹具、marketplace 更新以及 Claude-bundle 启用/检查的安装/更新冒烟测试。`pnpm test:docker:plugin-update` 覆盖已安装插件的未变更新行为。`pnpm test:docker:plugin-lifecycle-matrix` 覆盖带资源跟踪的 npm 插件安装、启用、禁用、升级、降级和缺失代码卸载。

要手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

套件专用镜像覆盖项（例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）在设置时仍然优先。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果本地尚不存在，脚本会拉取它。QR 和安装器 Docker 测试保留自己的 Dockerfile，因为它们验证的是包/安装行为，而不是共享的已构建应用运行时。

live-model Docker 运行器还会以只读方式绑定挂载当前检出内容，并将其暂存到容器内的临时工作目录中。这样可以保持运行时镜像精简，同时仍然针对你确切的本地源代码和配置运行 Vitest。暂存步骤会跳过大型本地专用缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地的 `.build` 或 Gradle 输出目录，因此 Docker 真实运行不会花费数分钟复制特定机器的产物。它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关真实探测就不会在容器内启动真实的 Telegram、Discord 等渠道工作器。`test:docker:live-models` 仍然会运行 `pnpm test:live`，因此当你需要缩小或排除该 Docker 通道中的 Gateway 网关真实覆盖范围时，也要传入 `OPENCLAW_LIVE_GATEWAY_*`。`test:docker:openwebui` 是更高层级的兼容性冒烟测试：它会启动一个启用了兼容 OpenAI 的 HTTP 端点的 OpenClaw Gateway 网关容器，针对该 Gateway 网关启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送真实聊天请求。第一次运行可能明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，并且 Open WebUI 可能需要完成自己的冷启动设置。此通道需要可用的真实模型密钥，而 `OPENCLAW_PROFILE_FILE`（默认是 `~/.profile`）是在 Docker 化运行中提供它的主要方式。成功运行会打印一个小型 JSON 载荷，例如 `{ "ok": true, "model": "openclaw/default", ... }`。`test:docker:mcp-channels` 有意保持确定性，不需要真实的 Telegram、Discord 或 iMessage 账户。它会启动一个带种子的 Gateway 网关容器，再启动第二个容器来生成 `openclaw mcp serve`，然后验证经过路由的会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio MCP 桥接传递的 Claude 风格渠道 + 权限通知。通知检查会直接检查原始 stdio MCP 帧，因此该冒烟测试验证的是桥接实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露的内容。`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要真实模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实的 stdio MCP 探测服务器，通过嵌入式 Pi bundle MCP 运行时物化该服务器，执行该工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会过滤它们。`test:docker:cron-mcp-cleanup` 是确定性的，不需要真实模型密钥。它会启动一个带种子的 Gateway 网关和一个真实的 stdio MCP 探测服务器，运行一个隔离的 cron 轮次和一个 `/subagents spawn` 一次性子轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（不在 CI 中）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归和调试工作流。ACP 线程路由验证之后可能还会再次需要它，因此不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认值：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认值：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认值：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前被载入
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 只验证从 `OPENCLAW_PROFILE_FILE` 载入的环境变量，使用临时配置和工作区目录，并且不挂载外部 CLI 凭证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认值：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内缓存 CLI 安装
- `$HOME` 下的外部 CLI 凭证目录和文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 收窄后的提供商运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录和文件
  - 可使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 这样的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于收窄运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内筛选提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于在不需要重新构建的重跑中复用现有的 `openclaw:local-live` 镜像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自配置文件存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

编辑文档后运行文档检查：`pnpm check:docs`。
当你也需要页内标题检查时，运行完整的 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归（CI 安全）

这些是不使用真实提供商的“真实流水线”回归：

- Gateway 网关工具调用（模拟 OpenAI，真实 Gateway 网关 + Agent loop）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，写入配置 + 强制执行凭证）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些类似“智能体可靠性评估”的 CI 安全测试：

- 通过真实 Gateway 网关 + Agent loop 进行模拟工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

Skills 仍然缺少的内容（见 [Skills](/zh-CN/tools/skills)）：

- **决策：**当 Skills 被列在提示词中时，智能体是否会选择正确的 Skills（或避开无关项）？
- **合规：**智能体是否会在使用前读取 `SKILL.md` 并遵循所需步骤和参数？
- **工作流契约：**断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来评估应首先保持确定性：

- 使用模拟提供商的场景运行器，用于断言工具调用 + 顺序、Skills 文件读取和会话接线。
- 一小套以 Skills 为重点的场景（使用与避开、门控、提示注入）。
- 仅在 CI 安全套件就位后，再添加可选的真实评估（选择加入、由环境变量门控）。

## 契约测试（插件和渠道形态）

契约测试会验证每个已注册插件和渠道都符合其接口契约。它们会遍历所有发现的插件，并运行一套形态和行为断言。默认的 `pnpm test` 单元通道会有意跳过这些共享接口和冒烟文件；当你触及共享渠道或提供商表面时，请显式运行契约命令。

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
- **actions** - 渠道操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/成员名册 API
- **group-policy** - 群组策略强制执行

### 提供商状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件注册表形态

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 凭证流程契约
- **auth-choice** - 凭证选择
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形态/接口
- **wizard** - 设置向导

### 运行时机

- 更改 plugin-sdk 导出或子路径后
- 添加或修改渠道或提供商插件后
- 重构插件注册或发现后

契约测试会在 CI 中运行，并且不需要真实 API 密钥。

## 添加回归（指南）

当你修复在真实环境中发现的提供商/模型问题时：

- 尽可能添加 CI 安全回归（模拟/桩提供商，或捕获确切的请求形态转换）
- 如果它本质上只能在真实环境中测试（速率限制、凭证策略），保持真实测试范围收窄，并通过环境变量选择加入
- 优先面向能捕获该 bug 的最小层级：
  - 提供商请求转换/重放 bug → 直接模型测试
  - Gateway 网关会话/历史/工具流水线 bug → Gateway 网关真实冒烟测试或 CI 安全的 Gateway 网关模拟测试
- SecretRef 遍历防护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个抽样目标，然后断言包含遍历片段的 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会故意在未分类目标 id 上失败，因此新类不能被静默跳过。

## 相关内容

- [真实环境测试](/zh-CN/help/testing-live)
- [更新和插件测试](/zh-CN/help/testing-updates-plugins)
- [CI](/zh-CN/ci)
