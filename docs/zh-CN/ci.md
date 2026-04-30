---
read_when:
    - 你需要了解某个 CI 作业为什么运行了或没有运行
    - 你正在调试一个失败的 GitHub Actions 检查
    - 你正在协调一次发布验证运行或重新运行
summary: CI 作业图、范围门禁、发布总括和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-30T05:19:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 80e0edd99f9832bed0c50d2f66b56163e32859e627090e6bf6b9ad7aa5f63d43
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 会在每次推送到 `main` 以及每个拉取请求时运行。`preflight` 作业会对差异进行分类，并在只有无关区域发生变更时关闭开销较高的通道。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为候选发布和广泛验证展开完整图。Android 通道仍通过 `include_android` 选择启用。仅发布使用的插件覆盖位于单独的 [`Plugin Prerelease`](#plugin-prerelease) 工作流中，并且只会从 [`Full Release Validation`](#full-release-validation) 或显式手动分派运行。

## 流水线概览

| 作业                              | 目的                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更的插件，并构建 CI 清单      | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 检测私钥并审计工作流                                        | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm 安全公告，对生产锁文件执行无依赖审计                             | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全作业所需的聚合结果                                                | 始终在非草稿推送和 PR 上运行 |
| `check-dependencies`             | 生产 Knip 仅依赖检查，以及未使用文件允许列表保护                    | Node 相关变更              |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                         | Node 相关变更              |
| `checks-node-core-test`          | Core Node 测试分片，不包含渠道、内置、契约和插件通道             | Node 相关变更              |
| `check`                          | 分片后的主要本地门禁等价项：生产类型、lint、保护项、测试类型和严格 smoke   | Node 相关变更              |
| `check-additional`               | 架构、边界、插件表面保护、包边界和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 构建后的 CLI smoke 测试和启动内存 smoke                                               | Node 相关变更              |
| `checks`                         | 构建产物渠道测试的验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                   | 发布时手动 CI 分派    |
| `check-docs`                     | 文档格式、lint 和断链检查                                                | 文档已变更                       |
| `skills-python`                  | 面向 Python 支撑的 Skills 执行 Ruff + pytest                                                       | Python skill 相关变更      |
| `checks-windows`                 | Windows 专用进程/路径测试，以及共享运行时导入说明符回归         | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                  | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 可信活动之后的每日 Codex 慢测试优化                                    | Main CI 成功或手动分派 |

## 快速失败顺序

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道重叠运行，以便共享构建就绪后下游消费者可以立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

当同一个 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被取代后继续排队。自动 CI 并发键带版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸任务无法无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在运行的任务。

## 范围和路由

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动分派会跳过变更范围检测，并让 preflight 清单表现得像所有限定范围区域都发生了变更。

- **CI 工作流编辑** 会验证 Node CI 图和工作流 lint，但不会单独强制执行 Windows、Android 或 macOS 原生构建；这些平台通道仍限定于平台源代码变更。
- **仅 CI 路由编辑、选定的廉价 core-test fixture 编辑，以及狭窄的插件契约 helper/test-routing 编辑** 使用快速的仅 Node 清单路径：`preflight`、安全检查，以及单个 `checks-fast-core` 任务。当变更仅限于快速任务直接覆盖的路由或 helper 表面时，该路径会跳过构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片和额外保护矩阵。
- **Windows Node 检查** 限定于 Windows 专用进程/路径包装器、npm/pnpm/UI runner helper、包管理器配置，以及执行该通道的 CI 工作流表面；无关源代码、插件、install-smoke 和仅测试变更仍留在 Linux Node 通道上。

最慢的 Node 测试族会被拆分或均衡，让每个作业保持小规模而不过度预留 runner：渠道契约作为三个加权分片运行，小型 core 单元通道会配对，auto-reply 作为四个均衡 worker 运行（reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片），agentic gateway/plugin 配置会分散到现有仅源代码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用它们专用的 Vitest 配置，而不是共享插件兜底配置。包含模式分片会使用 CI 分片名称记录时间条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和经过过滤的分片。`check-additional` 会将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖分离；边界保护分片会在一个作业内并发运行其小型独立保护项。Gateway watch、渠道测试和 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建后，在 `build-artifacts` 内并发运行。

Android CI 会运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。third-party flavor 没有单独的源集或 manifest；其单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包作业。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`（生产 Knip 仅依赖检查，固定到最新 Knip 版本，并为 `dlx` 安装禁用 pnpm 的最短发布年龄）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 对比。当 PR 新增未经审核的未使用文件，或留下过期的允许列表条目时，未使用文件保护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成产物、构建、live-test 和包桥接表面。

## 手动分派

手动 CI 分派运行与正常 CI 相同的作业图，但会强制启用每个非 Android 限定范围通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立手动 CI 分派只有在 `include_android=true` 时才运行 Android；完整发布总工作流通过传递 `include_android=true` 启用 Android。插件预发布静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件批量扫描，以及插件预发布 Docker 通道都不包含在 CI 中。Docker 预发布套件只会在 `Full Release Validation` 以启用 release-validation 门禁的方式分派单独的 `Plugin Prerelease` 工作流时运行。

手动运行使用唯一并发组，因此候选发布完整套件不会被同一 ref 上的另一次推送或 PR 运行取消。可选的 `target_ref` 输入允许可信调用方针对分支、标签或完整提交 SHA 运行该图，同时使用所选分派 ref 中的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 运行器

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/合约/内置检查、分片渠道合约检查、除 lint 以外的 `check` 分片、`check-additional` 分片和聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 预检也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较轻量的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（对 CPU 足够敏感，8 vCPU 省下的时间抵不上成本）；install-smoke Docker 构建（32-vCPU 排队时间的成本高于节省的时间）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本地等效命令

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 完整发布验证

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受一个分支、标签或完整提交 SHA，使用该目标分派手动 `CI` 工作流，分派 `Plugin Prerelease` 以提供仅发布需要的插件/软件包/静态/Docker 验证，并分派 `OpenClaw Release Checks` 以运行安装冒烟、软件包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。当提供已发布的软件包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

`release_profile` 控制传入发布检查的 live/提供商覆盖范围：

- `minimum` 保留最快的 OpenAI/核心发布关键通道。
- `stable` 添加稳定的提供商/后端集合。
- `full` 运行广泛的 advisory 提供商/媒体矩阵。

总控工作流会记录已分派的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流被重新运行并转绿，只需重新运行父验证器作业，即可刷新总控结果和计时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选使用 `all`，只重跑常规完整 CI 子工作流使用 `ci`，重跑每个发布子工作流使用 `release-checks`，也可以在总控工作流上使用更窄的分组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样在有针对性修复后，可以把失败发布盒子的重新运行范围限制住。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将选定 ref 解析一次为 `release-package-under-test` tarball，然后把该工件传给 live/E2E 发布路径 Docker 工作流和软件包验收分片。这样可以保证不同发布盒子中的软件包字节一致，并避免在多个子作业中重复打包同一个候选版本。

## Live 和 E2E 分片

发布 live/E2E 子工作流保留广泛的原生 `pnpm test:live` 覆盖范围，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行，而不是一个串行作业：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 提供商过滤的 `native-live-src-gateway-profiles` 作业
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分后的媒体音频/视频分片，以及按提供商过滤的音乐分片

这在保留相同文件覆盖范围的同时，让缓慢的 live 提供商故障更容易重新运行和诊断。聚合分片名称 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 对手动一次性重新运行仍然有效。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装了 `ffmpeg` 和 `ffprobe`；媒体作业在设置前只验证这些二进制文件。将 Docker 支持的 live 套件保留在常规 Blacksmith runner 上，容器作业不适合启动嵌套 Docker 测试。

Docker 支持的 live 模型/后端分片会为每个选定提交使用单独共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live 发布工作流会构建并推送该镜像一次，然后 Docker live 模型、Gateway 网关、CLI 后端、ACP bind 和 Codex harness 分片会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重新构建完整源代码 Docker 目标，说明发布运行配置有误，并会在重复镜像构建上浪费总耗时。

## 软件包验收

当问题是“这个可安装的 OpenClaw 软件包作为产品是否可用？”时，请使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源代码树，而软件包验收通过用户在安装或更新后使用的同一个 Docker E2E harness 来验证单个 tarball。

### 作业

1. `resolve_package` 检出 `workflow_ref`，解析一个软件包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 工件上传，并在 GitHub step summary 中打印来源、工作流 ref、软件包 ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该工件，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该软件包运行选定 Docker 通道，而不是打包工作流检出内容。当某个 profile 选择多个目标 `docker_lanes` 时，可复用工作流会准备一次软件包和共享镜像，然后将这些通道扇出为具有唯一工件的并行目标 Docker 作业。
3. `package_telegram` 可选地调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果 Package Acceptance 解析了一个软件包，它会安装同一个 `package-under-test` 工件；独立的 Telegram 分派仍可安装已发布的 npm 规格。
4. `summary` 会在软件包解析、Docker 验收或可选 Telegram 通道失败时让工作流失败。

### 候选来源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布 beta/稳定版的验收。
- `source=ref` 会打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离的工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 会下载 HTTPS `.tgz`；`package_sha256` 为必填。
- `source=artifact` 会从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对外共享的制品应提供它。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/测试框架代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这让当前测试框架可以验证较旧的受信任源提交，而无需运行旧的工作流逻辑。

### 套件配置

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 包含 OpenWebUI 的完整 Docker 发布路径分块
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必填

`package` 配置使用离线插件覆盖率，因此已发布包验证不会受实时 ClawHub 可用性的限制。可选的 Telegram 通道会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` 制品，同时保留已发布 npm spec 路径用于独立分发。

发布检查会使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块会覆盖重叠的包/更新/插件通道；Package Acceptance 会针对同一个已解析的包 tarball 保留制品原生的内置渠道兼容、离线插件和 Telegram 证明。跨 OS 发布检查仍会覆盖 OS 特定的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包版和安装器全新安装通道还会验证已安装包可以从原始绝对 Windows 路径导入 browser-control 覆盖项。OpenAI 跨 OS 智能体轮次冒烟测试在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明会保持快速且确定。

### 旧版兼容窗口

Package Acceptance 为已经发布的包提供有界的旧版兼容窗口。到 `2026.4.25` 为止的包（包括 `2026.4.25-beta.*`）可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可能指向 tarball 中省略的文件；
- 当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可能会跳过该持久化子用例；
- `update-channel-switch` 可能会从 tarball 派生的假 git 夹具中裁剪缺失的 `pnpm.patchedDependencies`，并可能记录缺失的持久化 `update.channel`；
- 插件冒烟测试可能会读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；
- `plugin-update` 可能允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。

已发布的 `2026.4.26` 包也可能对已发布的本地构建元数据戳文件发出警告。更新的包必须满足现代契约；相同条件会失败，而不是警告或跳过。

### 示例

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

调试失败的包验收运行时，先查看 `resolve_package` 摘要，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 制品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重跑命令。优先重跑失败的包配置或精确的 Docker 通道，而不是重跑完整发布验证。

## 安装冒烟测试

单独的 `Install Smoke` 工作流会通过自己的 `preflight` 作业复用同一个范围脚本。它把冒烟覆盖率拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径**会在拉取请求触及 Docker/包表面、内置插件包/清单变更，或 Docker 冒烟作业会运行的核心插件/渠道/Gateway 网关/插件 SDK 表面时运行。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会预留 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟测试，运行容器 gateway-network e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker 配置（每个场景的 Docker 运行会单独封顶）。
- **完整路径**为夜间定时运行、手动分发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的拉取请求保留 QR 包安装和安装器 Docker/更新覆盖。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟测试、安装器/更新冒烟测试，以及快速内置插件 Docker E2E 作为独立作业运行，这样安装器工作不会等待根镜像冒烟测试完成。

`main` 推送（包括合并提交）不会强制完整路径；当变更范围逻辑会在推送时请求完整覆盖时，工作流会保留快速 Docker 冒烟测试，并把完整安装冒烟测试留给夜间或发布验证。

较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独门控。它会在夜间计划和发布检查工作流中运行，手动 `Install Smoke` 分发可以选择加入它，但拉取请求和 `main` 推送不会运行。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享实时测试镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 用于安装器/更新/插件依赖通道的裸 Node/Git runner；
- 一个功能镜像，会把同一个 tarball 安装到 `/app`，用于正常功能通道。

Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选定计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 按通道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道。

### 可调参数

| 变量                                   | 默认值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 正常通道的主池槽位数。                                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 提供商敏感尾池槽位数。                                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发实时通道上限，避免提供商限流。                                                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 并发 npm 安装通道上限。                                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务通道上限。                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 通道启动之间的错峰间隔，用于避免 Docker daemon 创建风暴；设为 `0` 表示不错峰。                |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每通道回退超时（120 分钟）；选定的实时/尾部通道使用更严格的上限。                             |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 会打印调度器计划但不运行通道。                                                            |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 逗号分隔的精确通道列表；跳过清理冒烟测试，以便智能体复现某个失败通道。                        |

比有效上限更重的通道仍可从空池启动，然后单独运行直到释放容量。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，发出活动通道状态，持久化通道耗时以便按最长优先排序，并默认在第一次失败后停止调度新的池化通道。

### 可复用实时/E2E 工作流

可复用实时/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、实时镜像、通道和凭证覆盖。随后 `scripts/docker-e2e.mjs` 会把该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包制品，或从 `package_artifact_run_id` 下载包制品；验证 tarball 清单；当计划需要已安装包的通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带有包摘要标签的 bare/functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。Docker 镜像拉取会使用有界的每次尝试 180 秒超时重试，因此卡住的 registry/cache 流会快速重试，而不是消耗大部分 CI 关键路径。

### 发布路径分块

发布 Docker 覆盖会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行更小的分块作业，因此每个分块只拉取所需的镜像类型，并通过同一个加权调度器执行多个通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

当前发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 到 `plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合的 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍保留为聚合插件/运行时别名。`install-e2e` lane 别名仍是两个提供商安装器 lane 的聚合手动重跑别名。`bundled-channels` 分块会运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` lane，而不是串行的一体化 `bundled-channel-deps` lane。

当完整发布路径覆盖请求需要时，OpenWebUI 会合并到 `plugins-runtime-services` 中，并且仅在只调度 OpenWebUI 的情况下保留独立的 `openwebui` 分块。内置渠道更新 lane 会在遇到临时 npm 网络故障时重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢 lane 表，以及每个 lane 的重跑命令。workflow 的 `docker_lanes` 输入会针对已准备的镜像运行选定 lane，而不是运行分块 job，这会把失败 lane 的调试范围限制在一个有针对性的 Docker job 内，并为该次运行准备、下载或复用 package artifact；如果选定 lane 是实时 Docker lane，则目标 job 会为该次重跑在本地构建实时测试镜像。生成的每个 lane GitHub 重跑命令在这些值存在时会包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败 lane 可以复用失败运行中的确切 package 和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

定时的实时/E2E workflow 会每天运行完整发布路径 Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/package 覆盖，因此它是一个单独的 workflow，由 `Full Release Validation` 调度，或由显式操作员调度。普通 pull request、`main` 推送和独立手动 CI 调度会保持该套件关闭。它会在八个插件 worker 之间平衡内置插件测试；这些插件分片 job 每次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node heap，因此导入密集型插件批次不会创建额外的 CI job。

## QA 实验室

QA 实验室在主智能范围 workflow 之外有专用的 CI lane。

- `Parity gate` workflow 会在匹配的 PR 变更和手动调度时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6 的 agentic pack。
- `QA-Lab - All Lanes` workflow 会在 `main` 上每晚运行，也可手动调度；它会将模拟 parity gate、实时 Matrix lane，以及实时 Telegram 和 Discord lane 扇出为并行 job。实时 job 使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex lease。

发布检查使用确定性的模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输 lane，因此渠道契约会与实时模型延迟和普通提供商插件启动隔离。实时传输 Gateway 网关会禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；提供商连接性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 会在定时和发布 gate 中使用 `--profile fast`，并且仅在检出的 CLI 支持时添加 `--fail-fast`。CLI 默认值和手动 workflow 输入仍为 `all`；手动 `matrix_profile=all` 调度始终会把完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` job。

`OpenClaw Release Checks` 还会在发布批准前运行发布关键的 QA 实验室 lane；其 QA parity gate 会把候选 pack 和基线 pack 作为并行 lane job 运行，然后把两个 artifact 下载到一个小型报告 job 中，用于最终 parity 比较。

不要把 PR 落地路径放到 `Parity gate` 后面，除非变更确实触及 QA 运行时、模型 pack parity，或 parity workflow 拥有的表面。对于普通渠道、配置、文档或单元测试修复，请将其视为可选信号，并遵循范围化 CI/check 证据。

## CodeQL

`CodeQL` workflow 有意作为一个狭窄的第一轮安全扫描器，而不是完整仓库扫描。每日、手动和非草稿 pull request 保护运行会扫描 Actions workflow 代码以及风险最高的 JavaScript/TypeScript 表面，并使用高置信度安全查询，筛选到高/严重 `security-severity`。

pull request 保护保持轻量：它只会在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的变更触发，并运行与定时 workflow 相同的高置信度安全矩阵。Android 和 macOS CodeQL 不包含在 PR 默认项中。

### 安全类别

| 类别                                              | 表面                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 身份验证、密钥、沙箱、cron 和 Gateway 网关基线                                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，加上渠道插件运行时、Gateway 网关、插件 SDK、密钥、审计触点                                                           |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络防护、web-fetch 和插件 SDK SSRF 策略表面                                                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行 helper、出站投递和智能体工具执行 gate                                                                             |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、manifest、registry、运行时依赖暂存、源加载，以及插件 SDK package 契约信任表面                                        |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 定时 Android 安全分片。在 workflow sanity 接受的最小 Blacksmith Linux runner 上为 CodeQL 手动构建 Android 应用。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤依赖构建结果，并上传到 `/codeql-critical-security/macos` 下。它不包含在每日默认项中，因为即使干净通过，macOS 构建也会主导运行时间。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它只在较小的 Blacksmith Linux runner 上，对狭窄的高价值表面运行错误严重级别、非安全 JavaScript/TypeScript 质量查询。它的 pull request 保护刻意小于定时 profile：非草稿 PR 只会为渠道运行时、Gateway 网关协议/server-method、MCP/进程/出站投递、提供商运行时/模型目录、插件加载器、插件 SDK 或 package-contract 变更运行对应的 `channel-runtime-boundary`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`plugin-boundary` 和 `plugin-sdk-package-contract` 分片。CodeQL 配置和质量 workflow 变更会运行全部六个 PR 质量分片。

手动调度接受：

```
profile=all|channel-runtime-boundary|gateway-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭窄 profile 是用于单独运行一个质量分片的教学/迭代 hook。

| 类别                                                    | 表面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 身份验证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                           |
| `/codeql-critical-quality/config-boundary`              | 配置 schema、迁移、规范化和 IO 契约                                                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议 schema 和服务器方法契约                                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道实现契约                                                                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商调度、自动回复调度和队列，以及 ACP 控制平面运行时契约                                                                                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥接、进程监督 helper，以及出站投递契约                                                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆宿主 SDK、记忆运行时 facade、记忆插件 SDK 别名、记忆运行时激活胶水代码，以及记忆 Doctor 命令                                                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递 helper、诊断事件/日志包表面，以及会话 Doctor CLI 契约                                                         |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复调度、回复载荷/分块/运行时 helper、渠道回复选项、投递队列，以及会话/线程绑定 helper                                                            |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商身份验证和设备发现、提供商运行时注册、提供商默认值/目录，以及 web/search/fetch/embedding registry                                         |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                 |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、媒体 IO、媒体理解、图像生成和媒体生成运行时契约                                                                                           |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、registry、公共表面和插件 SDK 入口点契约                                                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布 package 侧插件 SDK 源码和插件 package 契约 helper                                                                                                         |

质量与安全保持分离，这样质量发现就可以在不掩盖安全信号的情况下被安排、衡量、禁用或扩展。只有在窄范围配置文件具备稳定运行时间和信号之后，才应将 Swift、Python 和内置插件 CodeQL 扩展作为有范围或分片的后续工作加回。

## 维护工作流

### 文档智能体

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的更改保持一致。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，手动调度也可以直接运行它。工作流运行调用会在 `main` 已经前进，或上一小时内已经创建过另一个未跳过的 Docs Agent 运行时跳过。运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次运行可以覆盖自上次文档检查以来累计的所有 main 更改。

### 测试性能智能体

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，但如果当天 UTC 已经有另一个工作流运行调用已运行或正在运行，它会跳过。手动调度会绕过这个每日活动门禁。该通道会构建全套分组 Vitest 性能报告，让 Codex 只做小型、保持覆盖率的测试性能修复，而不是大范围重构，然后重新运行全套报告，并拒绝会减少通过基线测试数量的更改。如果基线存在失败测试，Codex 只能修复明显失败项，并且智能体之后的全套报告必须通过，才会提交任何内容。当 bot push 落地前 `main` 前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与文档智能体相同的 drop-sudo 安全姿态。

### 合并后重复 PR

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于落地后的重复项清理。它默认 dry-run，并且只有在 `apply=true` 时才会关闭明确列出的 PR。在变更 GitHub 之前，它会验证已落地的 PR 已合并，并验证每个重复项要么有共享的引用 issue，要么有重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门禁和变更路由

本地变更通道路由逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更严格：

- 核心生产代码更改会运行核心生产代码和核心测试 typecheck，以及核心 lint/guard；
- 仅核心测试更改只运行核心测试 typecheck 和核心 lint；
- 插件生产代码更改会运行插件生产代码和插件测试 typecheck，以及插件 lint；
- 仅插件测试更改会运行插件测试 typecheck 和插件 lint；
- 公共插件 SDK 或插件契约更改会扩展到插件 typecheck，因为插件依赖这些核心契约（Vitest 插件扫描仍然是显式测试工作）；
- 仅发布元数据的版本 bump 会运行有针对性的版本、配置、根依赖检查；
- 未知的根目录或配置更改会安全降级到所有检查通道。

本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更轻量：直接测试编辑会运行自身，源代码编辑优先使用显式映射，然后运行同级测试和导入图依赖项。共享群组房间投递配置是显式映射之一：对群组可见回复配置、源回复投递模式或消息工具系统提示词的更改，会通过核心回复测试以及 Discord 和 Slack 投递回归测试进行路由，这样共享默认值更改会在第一次 PR push 前失败。只有当更改范围足够覆盖整个 harness，以至于轻量映射集合无法作为可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

从仓库根目录运行 Testbox，并优先使用新预热的 box 进行宽范围证明。在对一个被复用、已过期或刚报告了意外大规模同步的 box 执行慢门禁之前，先在该 box 内运行 `pnpm testbox:sanity`。

当 `pnpm-lock.yaml` 等必需根文件消失，或 `git status --short` 显示至少 200 个已跟踪文件删除时，完整性检查会快速失败。这通常意味着远程同步状态不是该 PR 的可信副本；此时应停止该 box 并预热一个新的 box，而不是调试产品测试失败。对于有意进行大量删除的 PR，在该完整性检查运行中设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

如果本地 Blacksmith CLI 调用在同步阶段停留超过五分钟且没有同步后输出，`pnpm testbox:run` 也会终止它。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该 guard，或者为异常大的本地 diff 使用更大的毫秒值。

## 相关

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
