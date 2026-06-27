---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商错误添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元/e2e/实时套件、Docker 运行器，以及每项测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-06-27T02:15:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三个 Vitest 测试套件（单元/集成、e2e、live）和一小组 Docker runner。本页文档是“我们如何测试”的指南：

- 每个套件覆盖什么（以及它有意_不_覆盖什么）。
- 常见工作流（本地、推送前、调试）应运行哪些命令。
- live 测试如何发现凭证并选择模型/提供商。
- 如何为真实世界中的模型/提供商问题添加回归测试。

<Note>
**QA 栈（qa-lab、qa-channel、live 传输通道）** 单独记录在文档中：

- [QA overview](/zh-CN/concepts/qa-e2e-automation) - 架构、命令界面、场景编写。
- [Matrix QA](/zh-CN/concepts/qa-matrix) - `pnpm openclaw qa matrix` 的参考。
- [Maturity scorecard](/zh-CN/maturity/scorecard) - 发布 QA 证据如何支撑稳定性和 LTS 决策。
- [QA channel](/zh-CN/channels/qa-channel) - 仓库支撑的场景使用的合成传输插件。

本页覆盖常规测试套件和 Docker/Parallels runner 的运行方式。下面的 QA 专用 runner 小节（[QA 专用 runner](#qa-specific-runners)）列出具体的 `qa` 调用，并指回上面的参考资料。
</Note>

## 快速开始

大多数时候：

- 完整门禁（推送前预期执行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在空间充裕的机器上更快地运行本地完整套件：`pnpm test:max`
- 直接 Vitest watch 循环：`pnpm test:watch`
- 直接文件目标现在也会路由 extension/channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你正在迭代单个失败时，优先使用有针对性的运行。
- Docker 支撑的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支撑的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你触碰测试或想获得额外信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

## 测试临时目录

测试自有的临时目录优先使用 `test/helpers/temp-dir.ts` 中的共享 helper。它们让所有权更明确，并把清理保持在同一测试生命周期中：

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

当测试已经拥有路径数组或集合时，使用 `makeTempDir(tempDirs, prefix)` 和 `cleanupTempDirs(tempDirs)`。除非用例明确在验证原始临时目录行为，否则避免在测试中新增裸 `fs.mkdtemp*` 调用。当测试确实有意需要裸临时目录时，添加带有具体原因、可审计的 allow 注释：

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

为了迁移可见性，`node scripts/report-test-temp-creations.mjs` 会报告新增 diff 行中的新裸临时目录创建，而不会阻断现有清理风格。它的文件作用域有意遵循 `scripts/changed-lanes.mjs` 使用的同一套测试路径分类，而不是维护单独的测试 helper 文件名启发式规则，同时跳过共享 helper 实现本身。`check:changed` 会把这份报告作为仅警告的 CI 信号，针对已更改的测试路径运行；发现项是 GitHub 警告注解，不是失败。

调试真实提供商/模型时（需要真实凭证）：

- Live 套件（模型 + Gateway 网关工具/图像探测）：`pnpm test:live`
- 安静地定向一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 运行时性能报告：调度 `OpenClaw Performance`，为真实的 `openai/gpt-5.5` agent 轮次设置 `live_openai_candidate=true`，或为 Kova CPU/堆/trace 工件设置 `deep_profile=true`。当配置了 `CLAWGRIT_REPORTS_TOKEN` 时，每日计划运行会把 mock-provider、deep-profile 和 GPT 5.5 通道工件发布到 `openclaw/clawgrit-reports`。mock-provider 报告还包含源码级 Gateway 网关启动、内存、插件压力、重复 fake-model hello-loop 和 CLI 启动数据。
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 每个选定模型现在会运行一个文本轮次和一个小型文件读取风格探测。元数据声明支持 `image` 输入的模型还会运行一个小型图像轮次。隔离提供商失败时，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用额外探测。
  - CI 覆盖：每日 `OpenClaw Scheduled Live And E2E Checks` 和手动 `OpenClaw Release Checks` 都会以 `include_live_suites: true` 调用可复用 live/E2E 工作流，其中包含按提供商分片的独立 Docker live 模型矩阵作业。
  - 对于聚焦的 CI 重跑，以 `include_live_suites: true` 和 `live_models_only: true` 调度 `OpenClaw Live And E2E Checks (Reusable)`。
  - 将新的高信号提供商 secret 添加到 `scripts/ci-hydrate-live-auth.sh`，以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和它的计划/发布调用方。
- Native Codex plugins 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 针对 Codex app-server 路径运行 Docker live 通道，用 `/codex bind` 绑定一个合成 Slack 私信，执行 `/codex fast` 和 `/codex permissions`，然后验证纯文本回复和图像附件通过原生插件绑定路由，而不是通过 ACP。
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`
  - 通过插件拥有的 Codex app-server harness 运行 Gateway 网关 agent 轮次，验证 `/codex status` 和 `/codex models`，并默认执行图像、cron MCP、子智能体和 Guardian 探测。隔离其他 Codex app-server 失败时，可用 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 禁用子智能体探测。对于聚焦的子智能体检查，禁用其他探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置了 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则它会在子智能体探测后退出。
- Codex 按需安装冒烟测试：`pnpm test:docker:codex-on-demand`
  - 在 Docker 中安装打包后的 OpenClaw tarball，运行 OpenAI API key 新手引导，并验证 Codex 插件和 `@openai/codex` 依赖已按需下载到托管 npm 项目根目录。
- Live 插件工具依赖冒烟测试：`pnpm test:docker:live-plugin-tool`
  - 打包一个带真实 `slugify` 依赖的 fixture 插件，通过 `npm-pack:` 安装它，验证托管 npm 项目根目录下的依赖，然后要求 live OpenAI 模型调用插件工具并返回隐藏 slug。
- Crestodian 救援命令冒烟测试：`pnpm test:live:crestodian-rescue-channel`
  - 针对消息渠道救援命令界面的可选双重保险检查。它执行 `/crestodian status`，排队一个持久模型变更，回复 `/crestodian yes`，并验证审计/配置写入路径。
- Crestodian planner Docker 冒烟测试：`pnpm test:docker:crestodian-planner`
  - 在一个无配置容器中运行 Crestodian，`PATH` 上有一个假的 Claude CLI，并验证 fuzzy planner fallback 会转化为已审计的类型化配置写入。
- Crestodian 首次运行 Docker 冒烟测试：`pnpm test:docker:crestodian-first-run`
  - 从空的 OpenClaw 状态目录开始，验证现代 onboard Crestodian 入口点，应用 setup/model/agent/Discord 插件 + SecretRef 写入，验证配置，并验证审计条目。同一 Ring 0 设置路径也由 QA Lab 中的 `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot/Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行一个隔离的 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。验证 JSON 报告 Moonshot/K2.6，且 assistant transcript 存储了标准化的 `usage.cost`。

<Tip>
当你只需要一个失败用例时，优先通过下面描述的 allowlist 环境变量收窄 live 测试。
</Tip>

## QA 专用 runner

当你需要 QA-lab 真实感时，这些命令与主测试套件并列使用：

CI 在专用工作流中运行 QA Lab。Agentic 对等性嵌套在 `QA-Lab - All Lanes` 和发布验证下，而不是独立的 PR 工作流。广泛验证应使用 `Full Release Validation`，并设置 `rerun_group=qa-parity`，或使用 release-checks QA 组。稳定/默认发布检查会把穷尽 live/Docker soak 放在 `run_release_soak=true` 后面；`full` profile 会强制启用 soak。`QA-Lab - All Lanes` 每晚在 `main` 上运行，也可通过手动调度运行，其中 mock parity 通道、live Matrix 通道、Convex 管理的 live Telegram 通道和 Convex 管理的 live Discord 通道作为并行作业运行。计划 QA 和发布检查会显式传递 Matrix `--profile fast`，而 Matrix CLI 和手动工作流输入默认值仍为 `all`；手动调度可以把 `all` 分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 会在发布批准前运行 parity，以及 fast Matrix 和 Telegram 通道，发布传输检查使用 `mock-openai/gpt-5.5`，以保持确定性并避免常规提供商插件启动。这些 live 传输 Gateway 网关会禁用记忆搜索；记忆行为仍由 QA parity 套件覆盖。

完整发布 live media 分片使用 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，它已经包含 `ffmpeg` 和 `ffprobe`。Docker live 模型/backend 分片使用每个选定 commit 构建一次的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取它，而不是在每个分片内重新构建。

- `pnpm openclaw qa suite`
  - 直接在主机上运行由仓库支持的 QA 场景。
  - 为所选场景集写入顶层 `qa-evidence.json`、`qa-suite-summary.json` 和
    `qa-suite-report.md` 工件，包括混合流程、Vitest 和 Playwright 场景选择。
  - 由 `pnpm openclaw qa run --qa-profile <profile>` 调度时，会在同一个
    `qa-evidence.json` 中嵌入所选分类法配置文件评分卡。
    `smoke-ci` 会写入精简证据，它设置 `evidenceMode: "slim"` 并省略
    每个条目的 `execution`。`release` 覆盖精选的发布就绪切片；
    `all` 选择每个活跃成熟度类别，用于需要完整评分卡工件时显式调度 QA
    配置文件证据工作流。
  - 默认使用隔离的 Gateway 网关 worker 并行运行多个所选场景。`qa-channel`
    默认并发为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整
    worker 数量，或使用 `--concurrency 1` 走较旧的串行通道。
  - 任一场景失败时以非零状态退出。当你希望生成工件但不使用失败退出码时，
    使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个本地 AIMock 支持的提供商服务器，用于实验性夹具和协议 mock
    覆盖，同时不会替代场景感知的 `mock-openai` 通道。
- `pnpm openclaw qa coverage --match <query>`
  - 搜索场景 ID、标题、表面、覆盖 ID、文档引用、代码引用、插件和提供商要求，
    然后打印匹配的套件目标。
  - 当你知道被触及的行为或文件路径，但不知道最小场景时，在 QA Lab 运行前使用它。
    它仅供参考；仍需根据正在变更的行为选择 mock、live、Multipass、Matrix
    或传输协议证据。
- `pnpm test:plugins:kitchen-sink-live`
  - 通过 QA Lab 运行 live OpenAI Kitchen Sink 插件全套测试。它会安装外部
    Kitchen Sink 包，验证插件 SDK 表面清单，探测 `/healthz` 和 `/readyz`，
    记录 Gateway 网关 CPU/RSS 证据，运行一个 live OpenAI 轮次，并检查对抗性诊断。
    需要 live OpenAI 凭证，例如 `OPENAI_API_KEY`。在已预置的 Testbox 会话中，
    当存在 `openclaw-testbox-env` 辅助工具时，它会自动载入 Testbox live-auth
    配置文件。
- `pnpm test:gateway:cpu-scenarios`
  - 运行 Gateway 网关启动基准，以及一个小型 mock QA Lab 场景包
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`），并在 `.artifacts/gateway-cpu-scenarios/`
    下写入组合 CPU 观测摘要。
  - 默认只标记持续的高 CPU 观测（`--cpu-core-warn` 加 `--hot-wall-warn-ms`），
    因此短暂的启动突增会记录为指标，而不会看起来像持续数分钟的 Gateway 网关
    占满回归。
  - 使用已构建的 `dist` 工件；当检出目录还没有新的运行时输出时，请先运行构建。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 内运行同一个 QA 套件。
  - 保持与主机上 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商/模型选择标志。
  - Live 运行会转发适合 guest 的受支持 QA 凭证输入：
    基于环境的提供商密钥、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保留在仓库根目录下，以便 guest 可以通过挂载的工作区写回。
  - 在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告和摘要，以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，用于操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建 npm tarball，在 Docker 中全局安装它，运行非交互式 OpenAI
    API 密钥新手引导，默认配置 Telegram，验证打包后的插件运行时无需启动依赖修复即可加载，
    运行 Doctor，并针对 mock OpenAI 端点运行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 运行同一个打包安装通道。
- `pnpm test:docker:session-runtime-context`
  - 为嵌入式运行时上下文转录运行确定性的已构建应用 Docker smoke。它验证隐藏的
    OpenClaw 运行时上下文会作为非显示自定义消息持久化，而不是泄漏到可见用户轮次中，
    然后播种一个受影响的损坏会话 JSONL，并验证 `openclaw doctor --fix` 会将其重写到
    活跃分支并创建备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装 OpenClaw 包候选版本，运行已安装包的新手引导，通过已安装的 CLI
    配置 Telegram，然后使用该已安装包作为被测系统 Gateway 网关复用 live Telegram QA 通道。
  - 该 wrapper 只从检出目录挂载 `qa-lab` harness 源代码；已安装包拥有 `dist`、
    `openclaw/plugin-sdk` 和内置插件运行时，因此该通道不会把当前检出目录中的插件混入被测包。
  - 默认为 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；设置
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，可测试已解析的本地 tarball，而不是从 registry 安装。
  - 默认使用 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` 在 `qa-evidence.json`
    中发出重复 RTT 计时。覆盖 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` 或
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` 可调整 RTT 运行。
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` 接受以逗号分隔的 Telegram QA 检查 ID
    列表用于采样；未设置时，默认支持 RTT 的检查是
    `telegram-mentioned-message-reply`。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境凭证或 Convex
    凭证来源。对于 CI/发布自动化，请设置
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，以及
    `OPENCLAW_QA_CONVEX_SITE_URL` 和一个角色 secret。如果
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色 secret 存在于 CI 中，
    Docker wrapper 会自动选择 Convex。
  - wrapper 会在 Docker 构建/安装工作前验证主机上的 Telegram 或 Convex 凭证环境。
    仅在有意调试凭证前设置时，才设置
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅为此通道覆盖共享的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。当选择 Convex 凭证且未设置角色时，wrapper
    在 CI 中使用 `ci`，在 CI 外使用 `maintainer`。
  - GitHub Actions 将此通道公开为手动维护者工作流 `NPM Telegram Beta E2E`。
    它不会在合并时运行。该工作流使用 `qa-live-shared` 环境和 Convex CI 凭证租约。
- GitHub Actions 还公开 `Package Acceptance`，用于针对一个候选包运行旁路产品证据。
  它接受可信 ref、已发布 npm spec、HTTPS tarball URL 加 SHA-256，或来自另一运行的
  tarball 工件，将规范化后的 `openclaw-current.tgz` 上传为 `package-under-test`，
  然后使用 smoke、package、product、full 或 custom 通道配置文件运行现有 Docker E2E
  调度器。设置 `telegram_mode=mock-openai` 或 `live-frontier` 可针对同一个
  `package-under-test` 工件运行 Telegram QA 工作流。
  - 最新 beta 产品证据：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精确 tarball URL 证据需要摘要，并使用公共 URL 安全策略：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- 企业/私有 tarball 镜像使用显式可信来源策略：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` 会从可信工作流 ref 读取 `.github/package-trusted-sources.json`，
并且不接受 URL 凭证或工作流输入的私有网络绕过。如果命名策略声明 bearer auth，
请配置固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret。

- 工件证据会从另一个 Actions 运行下载 tarball 工件：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，启动已配置 OpenAI 的 Gateway 网关，
    然后通过配置编辑启用内置渠道/插件。
  - 验证设置发现会让未配置的可下载插件保持缺失，第一次配置后的 Doctor 修复会显式安装每个缺失的
    可下载插件，并且第二次重启不会运行隐藏的依赖修复。
  - 还会安装一个已知的较旧 npm 基线，在运行 `openclaw update --tag <candidate>` 前启用
    Telegram，并验证候选版本的更新后 Doctor 会清理旧版插件依赖残留，而无需 harness 侧的
    postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels guest 运行原生打包安装更新 smoke。每个所选平台首先安装请求的基线包，
    然后在同一个 guest 中运行已安装的 `openclaw update` 命令，并验证已安装版本、
    更新状态、Gateway 网关就绪状态和一次本地智能体轮次。
  - 迭代单个 guest 时使用 `--platform macos`、`--platform windows` 或
    `--platform linux`。使用 `--json` 获取摘要工件路径和每通道状态。
  - OpenAI 通道默认使用 `openai/gpt-5.5` 进行 live 智能体轮次证据。仅在有意验证另一个
    OpenAI 模型时，传入 `--model <provider/model>` 或设置
    `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 用主机超时包裹长时间本地运行，避免 Parallels 传输卡顿耗尽剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 脚本会在 `/tmp/openclaw-parallels-npm-update.*` 下写入嵌套通道日志。
    在假定外层 wrapper 挂起之前，先检查 `windows-update.log`、`macos-update.log`
    或 `linux-update.log`。
  - Windows 更新在冷 guest 上可能会在更新后 Doctor 和包更新工作中花费 10 到 15 分钟；
    只要嵌套 npm debug 日志仍在推进，这仍然是健康状态。
  - 不要将这个聚合 wrapper 与单独的 Parallels macOS、Windows 或 Linux smoke 通道并行运行。
    它们共享 VM 状态，可能在快照恢复、包服务或 guest Gateway 网关状态上发生冲突。
  - 更新后证据会运行常规内置插件表面，因为 speech、图像生成和媒体理解等能力 facade
    会通过内置运行时 API 加载，即使智能体轮次本身只检查简单文本响应。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性、由 Docker 支持的 Tuwunel homeserver 运行 Matrix 实时 QA 通道。仅限源代码检出 - 打包安装不会随附 `qa-lab`。
  - 完整 CLI、配置文件/场景目录、环境变量和工件布局：[Matrix QA](/zh-CN/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用来自环境变量的驱动程序和 SUT bot token，针对真实私有群组运行 Telegram 实时 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 ID 必须是数字形式的 Telegram chat id。
  - 支持 `--credential-source convex` 来使用共享池化凭据。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以选择使用池化租约。
  - 默认覆盖 canary、提及门控、命令寻址、`/status`、bot 到 bot 的被提及回复，以及核心原生命令回复。`mock-openai` 默认值还覆盖确定性回复链和 Telegram 最终消息流式传输回归。使用 `--list-scenarios` 查看可选探针，例如 `session_status`。
  - 任一场景失败时会以非零状态退出。当你想要工件但不想要失败退出码时，使用 `--allow-failures`。
  - 需要同一私有群组中的两个不同 bot，并且 SUT bot 需要公开 Telegram 用户名。
  - 为了稳定观察 bot 到 bot 的通信，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保驱动 bot 能观察群组 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 `qa-evidence.json`。回复场景包含从驱动发送请求到观察到 SUT 回复的 RTT。

`Mantis Telegram Live` 是围绕此通道的 PR 证据包装器。它使用 Convex 租用的 Telegram 凭据运行候选 ref，在 Crabbox 桌面浏览器中渲染已脱敏的 QA 报告/证据包，录制 MP4 证据，生成运动裁剪后的 GIF，上传工件包，并在设置了 `pr_number` 时通过 Mantis GitHub App 发布内联 PR 证据。维护者可以通过 `Mantis Scenario`（`scenario_id:
telegram-live`）从 Actions UI 启动它，也可以直接从 pull request 评论启动：

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` 是用于 PR 视觉证明的智能体式原生 Telegram Desktop 前后对比包装器。可通过带自由格式 `instructions` 的 Actions UI、`Mantis Scenario`（`scenario_id:
telegram-desktop-proof`）或 PR 评论启动：

```text
@openclaw-mantis telegram desktop proof
```

Mantis 智能体会读取 PR，决定哪些 Telegram 可见行为能够证明更改，分别在基线和候选 ref 上运行真实用户 Crabbox Telegram Desktop 证明通道，迭代直到原生 GIF 有用，写入配对的 `motionPreview` 清单，并在设置了 `pr_number` 时通过 Mantis GitHub App 发布同一个 2 列 GIF 表格。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - 租用或复用 Crabbox Linux 桌面，安装原生 Telegram Desktop，使用租用的 Telegram SUT bot token 配置 OpenClaw，启动 Gateway 网关，并从可见的 VNC 桌面录制截图/MP4 证据。
  - 默认使用 `--credential-source convex`，因此工作流只需要 Convex broker secret。使用 `--credential-source env` 时，使用与 `pnpm openclaw qa telegram` 相同的 `OPENCLAW_QA_TELEGRAM_*` 变量。
  - Telegram Desktop 仍然需要用户登录/配置文件。bot token 只配置 OpenClaw。使用 `--telegram-profile-archive-env <name>` 指定 base64 `.tgz` 配置文件归档，或使用 `--keep-lease` 并通过 VNC 手动登录一次。
  - 在输出目录下写入 `mantis-telegram-desktop-builder-report.md`、`mantis-telegram-desktop-builder-summary.json`、`telegram-desktop-builder.png` 和 `telegram-desktop-builder.mp4`。

实时传输通道共享一个标准契约，因此新的传输不会漂移；每个通道的覆盖矩阵位于 [QA overview → 实时传输覆盖](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是广泛的合成套件，不属于该矩阵。

### 通过 Convex 共享 Telegram 凭据（v1）

当为实时传输 QA 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的池中获取独占租约，在通道运行期间对该租约发送 Heartbeat，并在关闭时释放租约。此节名称早于 Discord、Slack 和 WhatsApp 支持；租约契约在各类凭据之间共享。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所选角色的一个 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用于 `ci`
- 凭据角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认为 `ci`，否则默认为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许用于仅本地开发的 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在常规操作中应使用 `https://`。

维护者管理命令（池添加/移除/列出）明确需要 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

维护者 CLI helper：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在实时运行前使用 `doctor` 检查 Convex site URL、broker secret、endpoint prefix、HTTP timeout 和 admin/list 可达性，且不会打印 secret 值。在脚本和 CI 工具中使用 `--json` 获取机器可读输出。

默认 endpoint 契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

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
- `POST /admin/add`（仅限维护者 secret）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅限维护者 secret）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅限维护者 secret）
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
- `kind: "telegram-user"` 保留给 Mantis Telegram Desktop proof 工作流。通用 QA Lab 通道不得获取它。

broker 验证的多渠道 payload：

- Discord：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp：`{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack 通道也可以从池中租用，但 Slack payload 验证目前位于 Slack QA runner 中，而不是 broker 中。Slack 行使用 `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`。

### 向 QA 添加渠道

新渠道适配器的架构和场景 helper 名称位于 [QA overview → 添加渠道](/zh-CN/concepts/qa-e2e-automation#adding-a-channel)。最低要求：在共享的 `qa-lab` host seam 上实现传输 runner，在插件清单中声明 `qaRunners`，挂载为 `openclaw qa <runner>`，并在 `qa/scenarios/` 下编写场景。

## 测试套件（在哪里运行什么）

可以把这些套件视为“现实性递增”（同时不稳定性/成本也递增）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：非定向运行使用 `vitest.full-*.config.ts` shard 集合，并且可能将多项目 shard 展开为按项目的配置，以便并行调度
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的核心/单元清单；UI 单元测试在专用 `unit-ui` shard 中运行
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关 auth、路由、工具、解析、配置）
  - 已知 bug 的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实 key
  - 应快速且稳定
  - Resolver 和 public-surface loader 测试必须使用生成的微型插件 fixture 证明广泛的 `api.js` 和 `runtime-api.js` fallback 行为，而不是使用真实内置插件源 API。真实插件 API 加载属于插件拥有的契约/集成套件。

原生依赖策略：

- 默认测试安装会跳过可选的原生 Discord opus 构建。Discord 语音使用内置 `libopus-wasm`，并且 `@discordjs/opus` 在 `allowBuilds` 中保持禁用，因此本地测试和 Testbox 通道不会编译原生 addon。
- 在 `libopus-wasm` benchmark repo 中比较原生 opus 性能，而不是在默认 OpenClaw 安装/测试循环中比较。不要在默认 `allowBuilds` 中将 `@discordjs/opus` 设为 `true`；这会让无关的安装/测试循环编译原生代码。

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - 未指定目标的 `pnpm test` 会运行十二个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这会降低高负载机器上的峰值 RSS，并避免 auto-reply/extension 工作饿死无关套件。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不实用。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先通过作用域化通道路由显式文件/目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免支付完整根项目启动成本。
    - `pnpm test:changed` 默认会把已变更的 git 路径展开为低成本的作用域化通道：直接测试编辑、同级 `*.test.ts` 文件、显式源映射，以及本地导入图依赖项。配置/设置/package 编辑不会广泛运行测试，除非你显式使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄范围工作的常规智能本地检查门禁。它会把 diff 分类为 core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling 和 tooling，然后运行匹配的类型检查、lint 和 guard 命令。它不会运行 Vitest 测试；如需测试证明，请调用 `pnpm test:changed` 或显式 `pnpm test <target>`。仅发布元数据的版本号变更会运行有针对性的版本/config/root-dependency 检查，并带有一个 guard，拒绝顶层 version 字段之外的 package 变更。
    - Live Docker ACP harness 编辑会运行聚焦检查：live Docker 凭证脚本的 shell 语法检查，以及 live Docker 调度器 dry-run。只有当 diff 限于 `scripts["test:docker:live-*"]` 时，才会包含 `package.json` 变更；依赖、导出、版本和其他 package 表面编辑仍使用更广泛的 guard。
    - 来自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和类似纯工具区域的轻导入单元测试会通过 `unit-fast` 通道路由，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件仍留在现有通道上。
    - 选定的 `plugin-sdk` 和 `commands` helper 源文件还会把 changed-mode 运行映射到这些轻量通道中的显式同级测试，因此 helper 编辑可避免为该目录重新运行完整重型套件。
    - `auto-reply` 为顶层核心 helpers、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树提供专用 bucket。CI 还会把 reply 子树进一步拆成 agent-runner、dispatch 和 commands/state-routing 分片，避免一个导入较重的 bucket 独占完整 Node 尾部。
    - 常规 PR/main CI 会有意跳过 extension 批量扫描和仅发布用的 `agentic-plugins` 分片。完整发布验证会为 release candidates 调度单独的 `Plugin Prerelease` 子工作流，用于这些 plugin/extension 较重的套件。

  </Accordion>

  <Accordion title="嵌入式 runner 覆盖率">

    - 当你更改 message-tool 发现输入或压缩运行时上下文时，请同时保留两个层级的覆盖。
    - 为纯路由和规范化边界添加聚焦的 helper 回归测试。
    - 保持嵌入式 runner 集成套件健康：
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`、
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` 和
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`。
    - 这些套件会验证作用域化 id 和压缩行为仍然经过真实的 `run.ts` / `compact.ts` 路径；仅 helper 的测试不足以替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest pool 和隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置固定 `isolate: false`，并在根项目、e2e 和 live 配置中使用非隔离 runner。
    - 根 UI 通道保留其 `jsdom` 设置和 optimizer，但也运行在共享的非隔离 runner 上。
    - 每个 `pnpm test` 分片都会从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与原生 V8 行为对比。
    - `scripts/run-vitest.mjs` 会在显式非 watch Vitest 运行连续 5 分钟没有 stdout 或 stderr 输出后终止它。设置 `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` 可在有意静默的调查中禁用 watchdog。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示一个 diff 触发哪些架构通道。
    - pre-commit hook 仅做格式化。它会重新暂存格式化后的文件，不会运行 lint、类型检查或测试。
    - 当你需要智能本地检查门禁时，请在交接或 push 前显式运行 `pnpm check:changed`。
    - `pnpm test:changed` 默认通过低成本的作用域化通道路由。仅当智能体判断 harness、配置、package 或契约编辑确实需要更广泛的 Vitest 覆盖时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是 worker 上限更高。
    - 本地 worker 自动扩缩容有意保持保守，并在主机负载平均值已经较高时退让，因此多个并发 Vitest 运行默认会造成更少影响。
    - 基础 Vitest 配置将项目/配置文件标记为 `forceRerunTriggers`，以便在测试接线变化时 changed-mode 重新运行仍保持正确。
    - 配置会在受支持的主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你希望为直接性能分析指定一个显式缓存位置，请设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest 导入时长报告以及导入拆分输出。
    - `pnpm test:perf:imports:changed` 会把相同的性能分析视图限定到自 `origin/main` 以来变更的文件。
    - 分片耗时数据会写入 `.artifacts/vitest-shard-timings.json`。整配置运行使用配置路径作为键；include-pattern CI 分片会追加分片名称，以便单独跟踪经过过滤的分片。
    - 当某个热点测试仍把大部分时间花在启动导入上时，请把重型依赖放在窄范围本地 `*.runtime.ts` 边界后面，并直接 mock 该边界，而不是深度导入运行时 helpers 只为把它们传给 `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会对该已提交 diff 比较已路由的 `test:changed` 与原生根项目路径，并打印 wall time 和 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过把已变更文件列表路由到 `scripts/test-projects.mjs` 和根 Vitest 配置，对当前脏树进行 benchmark。
    - `pnpm test:perf:profile:main` 会为 Vitest/Vite 启动和 transform 开销写入主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为单元套件写入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制使用一个 worker
- 范围：
  - 默认启动启用诊断的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成 gateway 消息、记忆和大 payload 抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化 helpers
  - 断言 recorder 保持有界，合成 RSS 样本保持在压力预算以下，并且每会话队列深度回落到零
- 预期：
  - CI 安全且无需密钥
  - 用于稳定性回归跟进的窄通道，不是完整 Gateway 网关套件的替代品

### E2E（仓库聚合）

- 命令：`pnpm test:e2e`
- 范围：
  - 运行 gateway smoke E2E 通道
  - 运行 mock 的 Control UI 浏览器 E2E 通道
- 预期：
  - CI 安全且无需密钥
  - 需要安装 Playwright Chromium

### E2E（gateway smoke）

- 命令：`pnpm test:e2e:gateway`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 并设置 `isolate: false`，与仓库其余部分一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以 silent mode 运行，以减少控制台 I/O 开销。
- 常用覆盖：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 表面、节点配对和较重的网络
- 预期：
  - 在 CI 中运行（当 pipeline 中启用时）
  - 不需要真实密钥
  - 比单元测试有更多移动部件（可能更慢）

### E2E（Control UI mock 浏览器）

- 命令：`pnpm test:ui:e2e`
- 配置：`test/vitest/vitest.ui-e2e.config.ts`
- 文件：`ui/src/**/*.e2e.test.ts`
- 范围：
  - 启动 Vite Control UI
  - 通过 Playwright 驱动真实 Chromium 页面
  - 用确定性的浏览器内 mock 替换 Gateway 网关 WebSocket
- 预期：
  - 作为 `pnpm test:e2e` 的一部分在 CI 中运行
  - 不需要真实 Gateway 网关、智能体或提供商密钥
  - 必须存在浏览器依赖（`pnpm --dir ui exec playwright install chromium`）

### E2E：OpenShell 后端 smoke

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 复用活动的本地 OpenShell gateway
  - 从临时本地 Dockerfile 创建沙箱
  - 通过真实 `sandbox ssh-config` + SSH exec 演练 OpenClaw 的 OpenShell 后端
  - 通过 sandbox fs bridge 验证 remote-canonical 文件系统行为
- 预期：
  - 仅 opt-in；不属于默认 `pnpm test:e2e` 运行
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 需要活动的本地 OpenShell gateway 及其配置来源
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试沙箱
- 常用覆盖：
  - `OPENCLAW_E2E_OPENSHELL=1` 用于在手动运行更广泛的 e2e 套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用于指向非默认 CLI 二进制或 wrapper script
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` 用于向隔离测试暴露已注册 gateway 配置
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` 用于覆盖 host policy fixture 使用的 Docker gateway IP

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型在_今天_使用真实凭证时是否真的可用？”
  - 捕获提供商格式变化、工具调用细节、凭证问题和速率限制行为
- 预期：
  - 设计上不保证 CI 稳定（真实网络、真实提供商策略、配额、故障）
  - 会产生费用/使用速率限制额度
  - 优先运行缩小后的子集，而不是“全部”
- Live 运行使用已经导出的 API key 和已暂存的凭证配置文件。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置/凭证材料复制到临时测试 home 中，这样单元测试夹具就无法修改你的真实 `~/.openclaw`。
- 只有在你有意需要 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 默认使用更安静的模式：它保留 `[live] ...` 进度输出，并静音 Gateway 网关启动日志/Bonjour 杂讯。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（按提供商）：用逗号/分号格式设置 `*_API_KEYS`，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可以通过 `OPENCLAW_LIVE_*_KEY` 做按 live 运行的覆盖；测试会在遇到速率限制响应时重试。
- 进度/Heartbeat 输出：
  - Live 套件现在会向 stderr 发出进度行，因此即使 Vitest 控制台捕获很安静，长时间的提供商调用也能显示为正在活动。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此提供商/Gateway 网关进度行会在 live 运行期间立即流式输出。
  - 用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型 Heartbeat。
  - 用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关/探针 Heartbeat。

## 我应该运行哪个套件？

使用这个决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果你改动很多，也运行 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：添加 `pnpm test:e2e`
- 调试“我的 bot 挂了”/提供商特定失败/工具调用：运行缩小范围的 `pnpm test:live`

## Live（触及网络的）测试

关于 live 模型矩阵、CLI 后端 smoke、ACP smoke、Codex app-server
harness，以及所有媒体提供商 live 测试（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness）和 live 运行的凭证处理，请参阅
[Testing live suites](/zh-CN/help/testing-live)。关于专用的更新和
插件验证检查清单，请参阅
[Testing updates and plugins](/zh-CN/help/testing-updates-plugins)。

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两个类别：

- Live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只在仓库 Docker 镜像内运行各自匹配的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录、工作区和可选的 profile 环境文件。匹配的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器会在需要时保留自己的实际上限：
  `test:docker:live-models` 默认使用精选的受支持高信号集合，而
  `test:docker:live-gateway` 默认设置为 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确需要更小上限或更大扫描范围时，设置 `OPENCLAW_LIVE_MAX_MODELS`
  或 Gateway 网关环境变量。
- `test:docker:all` 先通过 `test:docker:live-build` 构建一次 live Docker 镜像，再通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包一次为 npm tarball，然后构建/复用两个 `scripts/e2e/Dockerfile` 镜像。裸镜像只是用于安装/更新/插件依赖 lane 的 Node/Git 运行器；这些 lane 会挂载预构建的 tarball。功能镜像会把同一个 tarball 安装到 `/app`，用于构建后应用功能 lane。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行选定计划。聚合运行使用加权本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会防止重型 live、npm 安装和多服务 lane 同时启动。如果单个 lane 比当前上限更重，调度器仍可在池为空时启动它，然后让它单独运行，直到容量再次可用。默认值为 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有当 Docker 主机有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。运行器默认执行 Docker 预检，移除过期的 OpenClaw E2E 容器，每 30 秒打印一次状态，将成功 lane 的耗时存储到 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中使用这些耗时先启动更长的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不构建或运行 Docker 的情况下打印加权 lane 清单，或使用 `node scripts/test-docker-all.mjs --plan-json` 打印所选 lane、包/镜像需求和凭证的 CI 计划。
- `Package Acceptance` 是 GitHub 原生的包门禁，用来判断“这个可安装 tarball 作为产品是否可用？”它会从 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一个候选包，将其上传为 `package-under-test`，然后用那个精确 tarball 运行可复用 Docker E2E lane，而不是重新打包所选 ref。Profile 按覆盖广度排序：`smoke`、`package`、`product` 和 `full`。有关包/更新/插件契约、已发布升级幸存者矩阵、发布默认值和失败分诊，请参阅 [Testing updates and plugins](/zh-CN/help/testing-updates-plugins)。
- 构建和发布检查会在 tsdown 之后运行 `scripts/check-cli-bootstrap-imports.mjs`。该 guard 会从 `dist/entry.js` 和 `dist/cli/run-main.js` 遍历静态构建图；如果命令分发前的启动路径在分发命令前导入 Commander、prompt UI、undici 或日志等包依赖，它会失败；它还会让内置 Gateway 网关运行 chunk 保持在预算内，并拒绝对已知冷 Gateway 网关路径的静态导入。打包后的 CLI smoke 还覆盖根 help、新手引导 help、doctor help、状态、配置 schema 和一个模型列表命令。
- Package Acceptance 旧版兼容性上限为 `2026.4.25`（包含 `2026.4.25-beta.*`）。在该截止版本之前，harness 只容忍已发布包的元数据缺口：省略的私有 QA 清单条目、缺失的 `gateway install --wrapper`、tarball 派生 git 夹具中缺失的 patch 文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。对于 `2026.4.25` 之后的包，这些路径都是严格失败。
- 容器 smoke 运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。
- 通过 `scripts/lib/openclaw-e2e-instance.sh` 安装打包后 OpenClaw tarball 的 Docker/Bash E2E lane，会把 `npm install` 限制在 `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` 内（默认 `600s`；设置为 `0` 可在调试时禁用包装器）。

Live 模型 Docker 运行器还只会 bind-mount 所需的 CLI 凭证 home（或者在未缩小运行范围时挂载所有受支持项），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就能刷新 token，而不会修改宿主机凭证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP bind smoke：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，并通过 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 严格覆盖 Droid/OpenCode）
- CLI 后端 smoke：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev agent：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性 smoke：`pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke` 和 `pnpm qa:observability:smoke` 是私有 QA 源码 checkout lane。它们有意不属于包 Docker 发布 lane，因为 npm tarball 会省略 QA Lab。
- Open WebUI live smoke：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导/渠道/智能体 smoke：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包后的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，默认还会配置 Telegram，运行 doctor，并运行一个模拟的 OpenAI 智能体轮次。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过宿主机构建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切换渠道。

- 发布用户旅程冒烟测试：`pnpm test:docker:release-user-journey` 在干净的 Docker 主目录中全局安装打包后的 OpenClaw tarball，运行新手引导，配置模拟的 OpenAI provider，运行一次智能体轮次，安装/卸载外部插件，针对本地 fixture 配置 ClickClack，验证出站/入站消息，重启 Gateway 网关，并运行 Doctor。
- 发布类型化新手引导冒烟测试：`pnpm test:docker:release-typed-onboarding` 安装打包后的 tarball，通过真实 TTY 驱动 `openclaw onboard`，将 OpenAI 配置为 env-ref 提供商，验证不会持久化原始密钥，并运行一次模拟的智能体轮次。
- 发布媒体/记忆冒烟测试：`pnpm test:docker:release-media-memory` 安装打包后的 tarball，验证来自 PNG 附件的图像理解、OpenAI 兼容图像生成输出、记忆搜索回忆，以及 Gateway 网关重启后的回忆保留。
- 发布升级用户旅程冒烟测试：`pnpm test:docker:release-upgrade-user-journey` 默认安装早于候选 tarball 的最新已发布基线，在已发布软件包上配置提供商/插件/ClickClack 状态，升级到候选 tarball，然后重新运行核心智能体/插件/渠道旅程。如果不存在更旧的已发布基线，则复用候选版本。使用 `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` 覆盖基线。
- 发布插件市场冒烟测试：`pnpm test:docker:release-plugin-marketplace` 从本地 fixture 市场安装，更新已安装的插件，卸载它，并验证插件 CLI 随安装元数据裁剪一同消失。
- Skill 安装冒烟测试：`pnpm test:docker:skill-install` 在 Docker 中全局安装打包后的 OpenClaw tarball，在配置中禁用上传归档安装，从搜索解析当前实时 ClawHub skill slug，使用 `openclaw skills install` 安装它，并验证已安装的 Skill 以及 `.clawhub` 来源/锁定元数据。
- 更新频道切换冒烟测试：`pnpm test:docker:update-channel-switch` 在 Docker 中全局安装打包后的 OpenClaw tarball，从软件包 `stable` 切换到 git `dev`，验证持久化的频道和插件更新后工作，然后切回软件包 `stable` 并检查更新状态。
- 升级幸存者冒烟测试：`pnpm test:docker:upgrade-survivor` 将打包后的 OpenClaw tarball 安装到带有智能体、渠道配置、插件允许列表、过期插件依赖状态以及现有工作区/会话文件的脏旧用户 fixture 上。它在没有实时提供商或渠道密钥的情况下运行软件包更新和非交互式 Doctor，然后启动一个回环 Gateway 网关，并检查配置/状态保留以及启动/状态预算。
- 已发布升级幸存者冒烟测试：`pnpm test:docker:published-upgrade-survivor` 默认安装 `openclaw@latest`，播种真实的现有用户文件，使用内置命令配方配置该基线，验证生成的配置，将该已发布安装更新到候选 tarball，运行非交互式 Doctor，写入 `.artifacts/upgrade-survivor/summary.json`，然后启动一个回环 Gateway 网关，并检查已配置意图、状态保留、启动、`/healthz`、`/readyz` 和 RPC 状态预算。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖单个基线，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 要求聚合调度器展开精确的本地基线，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，并使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展开 issue 形态的 fixture，例如 `reported-issues`；reported-issues 集合包含 `configured-plugin-installs`，用于自动修复外部 OpenClaw 插件安装。软件包验收将这些暴露为 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，解析元基线令牌，例如 `last-stable-4` 或 `all-since-2026.4.23`，并且全量发布验证会将发布 soak 软件包门禁展开为 `last-stable-4 2026.4.23 2026.5.2 2026.4.15` 加上 `reported-issues`。
- 会话运行时上下文冒烟测试：`pnpm test:docker:session-runtime-context` 验证隐藏运行时上下文 transcript 持久化，以及 Doctor 对受影响的重复 prompt-rewrite 分支的修复。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 打包当前树，在隔离主目录中使用 `bun install -g` 安装它，并验证 `openclaw infer image providers --json` 返回内置图像提供商而不是挂起。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过主机构建，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 在它的 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认使用 npm `latest` 作为稳定基线，然后升级到候选 tarball。在本地使用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或在 GitHub 上使用 Install Smoke 工作流的 `update_baseline_version` 输入覆盖。非 root 安装器检查会保留隔离的 npm 缓存，以免 root 拥有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重新运行之间复用 root/update/direct-npm 缓存。
- Install Smoke CI 使用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；需要直接 `npm install -g` 覆盖时，在本地运行脚本且不要设置该环境变量。
- 智能体删除共享工作区 CLI 冒烟测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认构建根 Dockerfile 镜像，在隔离容器主目录中播种两个智能体和一个工作区，运行 `agents delete --json`，并验证有效 JSON 以及保留工作区行为。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关联网（两个容器，WS auth + 健康）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照冒烟测试：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）构建源 E2E 镜像加一个 Chromium 层，使用原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP 角色快照覆盖链接 URL、光标提升的可点击项、iframe 引用和 frame 元数据。
- OpenAI Responses web_search 最小推理回归：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）通过 Gateway 网关运行模拟的 OpenAI 服务器，验证 `web_search` 将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制提供商 schema 拒绝并检查 Gateway 网关日志中出现原始详情。
- MCP 渠道桥接（已播种的 Gateway 网关 + stdio 桥接 + 原始 Claude 通知 frame 冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- OpenClaw 捆绑 MCP 工具（真实 stdio MCP 服务器 + 嵌入式 OpenClaw profile 允许/拒绝冒烟测试）：`pnpm test:docker:agent-bundle-mcp-tools`（脚本：`scripts/e2e/agent-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + 在隔离 cron 和一次性 subagent 运行后拆除 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（针对本地路径、`file:`、带提升依赖的 npm registry、格式错误的 npm 包元数据、git 移动引用、ClawHub kitchen-sink、市场更新以及 Claude-bundle 启用/检查的安装/更新冒烟测试）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳过 ClawHub 区块，或使用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认 kitchen-sink 软件包/运行时对。没有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` 时，测试使用 hermetic 本地 ClawHub fixture 服务器。
- 插件更新未变化冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 插件生命周期矩阵冒烟测试：`pnpm test:docker:plugin-lifecycle-matrix` 在裸容器中安装打包后的 OpenClaw tarball，安装一个 npm 插件，切换启用/禁用，通过本地 npm registry 对其升级和降级，删除已安装代码，然后验证卸载仍会移除过期状态，同时记录每个生命周期阶段的 RSS/CPU 指标。
- 配置重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 插件：`pnpm test:docker:plugins` 覆盖本地路径、`file:`、带提升依赖的 npm registry、git 移动引用、ClawHub fixture、市场更新以及 Claude-bundle 启用/检查的安装/更新冒烟测试。`pnpm test:docker:plugin-update` 覆盖已安装插件的未变化更新行为。`pnpm test:docker:plugin-lifecycle-matrix` 覆盖带资源跟踪的 npm 插件安装、启用、禁用、升级、降级以及缺失代码卸载。

要手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置后，特定套件的镜像覆盖项（例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）仍然优先。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果它还不是本地镜像，脚本会拉取它。QR 和安装器 Docker 测试保留自己的 Dockerfile，因为它们验证的是软件包/安装行为，而不是共享的已构建应用运行时。

实时模型 Docker runner 还会以只读方式绑定挂载当前 checkout，并将其
暂存到容器内的临时工作目录中。这样既能保持运行时镜像精简，又能针对你
准确的本地源代码/配置运行 Vitest。暂存步骤会跳过大型本地专用缓存和应用
构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地
`.build` 或 Gradle 输出目录，避免 Docker live 运行花费数分钟复制
机器特定的产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关 live 探测就不会在
容器内启动真实的 Telegram/Discord 等渠道 worker。
`test:docker:live-models` 仍会运行 `pnpm test:live`，因此当你需要缩小或排除该
Docker lane 中的 Gateway 网关 live 覆盖范围时，也要传入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是更高层级的兼容性冒烟测试：它会启动一个启用了
OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，启动一个固定版本的 Open WebUI
容器并连接到该 Gateway 网关，通过 Open WebUI 登录，验证 `/api/models` 暴露
`openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一个
真实聊天请求。
对于应在 Open WebUI 登录和模型发现后停止、无需等待 live 模型完成的发布路径
CI 检查，请设置 `OPENWEBUI_SMOKE_MODE=models`。
首次运行可能明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI
可能需要完成自己的冷启动设置。
此 lane 需要可用的 live 模型 key。通过进程环境、暂存的认证 profile，或显式的
`OPENCLAW_PROFILE_FILE` 提供它。
成功运行会打印一个小型 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是有意保持确定性的，不需要真实的 Telegram、Discord 或
iMessage 账号。它会启动一个已播种的 Gateway 网关容器，启动第二个容器来生成
`openclaw mcp serve`，然后通过真实的 stdio MCP bridge 验证路由后的会话发现、
transcript 读取、附件 metadata、live 事件队列行为、出站发送路由，以及
Claude 风格的渠道 + 权限通知。通知检查会直接检查原始 stdio MCP frame，因此该
冒烟测试验证的是 bridge 实际发出的内容，而不仅是某个特定客户端 SDK 恰好暴露的内容。
`test:docker:agent-bundle-mcp-tools` 是确定性的，不需要 live 模型 key。它会构建
repo Docker 镜像，在容器内启动一个真实的 stdio MCP 探测服务器，通过嵌入式
OpenClaw bundle MCP 运行时实例化该服务器，执行该工具，然后验证 `coding` 和
`messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]`
会过滤它们。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要 live 模型 key。它会启动带有真实
stdio MCP 探测服务器的已播种 Gateway 网关，运行一个隔离的 cron 轮次和一个
`sessions_spawn` 一次性子轮次，然后验证 MCP 子进程在每次运行后退出。

手动 ACP 自然语言 thread 冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归/调试工作流。ACP thread 路由验证可能还会再次需要它，因此不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` 会在运行测试前被挂载并 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 仅验证从 `OPENCLAW_PROFILE_FILE` source 的环境变量，使用临时配置/工作区目录，并且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内缓存 CLI 安装
- `$HOME` 下的外部 CLI 认证目录/文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围的提供商运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 可使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于在不需要重新构建的重复运行中复用现有 `openclaw:local-live` 镜像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而非环境）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试使用的 nonce 检查 prompt
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像 tag

## 文档完整性检查

文档编辑后运行文档检查：`pnpm check:docs`。
当你还需要页内标题检查时，运行完整的 Mintlify anchor 验证：`pnpm docs:check-links:anchors`。

## 离线回归（CI 安全）

这些是没有真实提供商的“真实 pipeline”回归：

- Gateway 网关工具调用（mock OpenAI，真实 Gateway 网关 + Agent loop）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，写入配置 + 强制认证）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## Agent 可靠性评估（Skills）

我们已经有一些 CI 安全测试，行为类似“Agent 可靠性评估”：

- 通过真实 Gateway 网关 + Agent loop 进行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 端到端向导流程，用于验证会话接线和配置效果（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的内容（参见 [Skills](/zh-CN/tools/skills)）：

- **决策：** 当 prompt 中列出 Skills 时，智能体是否选择了正确的 skill（或避开了无关项）？
- **合规性：** 智能体是否在使用前读取 `SKILL.md` 并遵循必需步骤/参数？
- **工作流契约：** 断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来评估应首先保持确定性：

- 一个使用 mock 提供商的场景 runner，用于断言工具调用 + 顺序、skill 文件读取和会话接线。
- 一小组聚焦 skill 的场景（使用与避免、门控、prompt injection）。
- 可选 live 评估（选择启用、由环境变量门控）仅在 CI 安全套件到位后再添加。

## 契约测试（插件和渠道形状）

契约测试会验证每个已注册插件和渠道是否符合其接口契约。它们会遍历所有已发现插件，
并运行一组形状和行为断言。默认的 `pnpm test` unit lane 会有意跳过这些共享边界和
冒烟文件；当你触及共享渠道或提供商表面时，请显式运行契约命令。

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
- **directory** - Directory/roster API
- **group-policy** - 群组策略强制执行

### 提供商状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件 registry 形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择/选取
- **catalog** - 模型 catalog API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状/接口
- **wizard** - 设置向导

### 何时运行

- 更改 plugin-sdk 导出或子路径后
- 添加或修改渠道或提供商插件后
- 重构插件注册或发现后

契约测试会在 CI 中运行，并且不需要真实 API key。

## 添加回归（指南）

当你修复在 live 中发现的提供商/模型问题时：

- 如果可能，添加 CI 安全回归（mock/stub 提供商，或捕获准确的请求形状转换）
- 如果它本质上只能 live 测试（速率限制、认证策略），请保持 live 测试范围狭窄，并通过环境变量选择启用
- 优先针对能捕获 bug 的最小层：
  - 提供商请求转换/重放 bug → 直接模型测试
  - Gateway 网关 session/history/tool pipeline bug → Gateway 网关 live 冒烟测试或 CI 安全 Gateway 网关 mock 测试
- SecretRef 遍历 guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从 registry metadata（`listSecretTargetRegistryEntries()`）为每个 SecretRef class 派生一个采样 target，然后断言遍历片段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加新的 `includeInPlan` SecretRef target family，请更新该测试中的 `classifyTargetClass`。该测试会有意在未分类的 target id 上失败，确保新 class 不能被静默跳过。

## 相关

- [Testing live](/zh-CN/help/testing-live)
- [更新和插件测试](/zh-CN/help/testing-updates-plugins)
- [CI](/zh-CN/ci)
