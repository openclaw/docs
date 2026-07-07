---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试一个失败的 GitHub Actions 检查
    - 你正在协调一次发布验证运行或重新运行
    - 你正在更改 ClawSweeper 分派或 GitHub 活动转发
summary: CI 作业图、范围门控、发布总括项和本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-07-06T21:46:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56efdae09754c6fe11abfe707a28c679dd0dae231fbaf15da0cf57f76498bb29
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 在推送到 `main` 时运行（触发器会忽略 Markdown 和 `docs/**` 路径），在非草稿拉取请求上运行（仅 CHANGELOG 的差异会被忽略），也会在手动分发时运行。规范 `main` 推送会先经过 90 秒的托管 runner 准入窗口；当较新的提交落地时，`CI` 并发组会取消这个等待中的运行，因此连续合并不会各自注册完整的 Blacksmith 矩阵。拉取请求和手动分发会跳过等待。随后 `preflight` 作业会对差异进行分类，并在只有无关区域发生变化时关闭高成本通道。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为发布候选版本和广泛验证展开完整图。Android 通道通过 `include_android`（或 `release_gate` 输入）保持选择加入。仅发布使用的插件覆盖率位于单独的 [`插件预发布`](#plugin-prerelease) 工作流中，并且只会从 [`完整发布验证`](#full-release-validation) 或显式手动分发运行。

## 流水线概览

| 作业                               | 目的                                                                                                                                                                                            | 运行时机                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 检测仅文档变更、已变更范围、已变更插件，并构建 CI 清单                                                                                                            | 始终在非草稿推送和 PR 上运行                  |
| `runner-admission`                 | 在注册 Blacksmith 工作前，为规范 `main` 推送提供托管的 90 秒防抖                                                                                                         | 每次 CI 运行；仅在规范 `main` 推送时休眠 |
| `security-fast`                    | 私钥检测、通过 `zizmor` 进行已变更工作流审计，以及生产 lockfile 审计                                                                                                          | 始终在非草稿推送和 PR 上运行                  |
| `pnpm-store-warmup`                | 预热 lockfile 固定的 pnpm store 缓存，而不阻塞 Linux Node 分片                                                                                                                       | 已选择 Node 或 docs-check 通道                   |
| `build-artifacts`                  | 构建 `dist/`、Control UI、已构建 CLI 冒烟检查、启动内存，以及嵌入式已构建产物检查                                                                                              | Node 相关变更                               |
| `checks-fast-core`                 | 快速 Linux 正确性通道：内置 + protocol、Bun 启动器，以及 CI 路由快速任务                                                                                                       | Node 相关变更                               |
| `checks-fast-contracts-plugins-*`  | 两个加权插件契约分片                                                                                                                                                                | Node 相关变更                               |
| `checks-fast-contracts-channels-*` | 两个加权渠道契约分片                                                                                                                                                               | Node 相关变更                               |
| `checks-node-*`                    | 核心 Node 测试分片，排除渠道、内置、契约和插件通道                                                                                                                   | Node 相关变更                               |
| `check-*`                          | 分片后的主本地门禁等价检查：守卫、shrinkwrap、内置渠道配置元数据、生产类型、lint、依赖、测试类型                                                                | Node 相关变更                               |
| `check-additional-*`               | 边界检查条带（包括提示词快照漂移）、会话访问器/转录读取器边界、插件 lint 分组、包边界编译/canary，以及运行时拓扑架构 | Node 相关变更                               |
| `checks-node-compat-node22`        | Node 22 兼容性构建和冒烟通道                                                                                                                                                         | 用于发布的手动 CI 分发                     |
| `check-docs`                       | 文档格式化、lint 和断链检查                                                                                                                                                      | 文档已变更（PR 和手动分发）              |
| `native-i18n`                      | 原生应用、Android 和 Apple i18n 清单检查                                                                                                                                               | 原生 i18n 相关变更                        |
| `skills-python`                    | 针对 Python 支持的 Skills 运行 Ruff + pytest                                                                                                                                                             | Python 技能相关变更                       |
| `checks-windows`                   | Windows 特定进程/路径测试，以及共享运行时导入说明符回归检查                                                                                                               | Windows 相关变更                            |
| `macos-node`                       | 聚焦的 macOS TypeScript 测试：launchd、Homebrew、运行时路径、打包脚本、进程组包装器                                                                                         | macOS 相关变更                              |
| `macos-swift`                      | macOS 应用的 Swift lint、构建和测试                                                                                                                                                     | macOS 相关变更                              |
| `ios-build`                        | Xcode 项目生成以及 iOS 应用模拟器构建                                                                                                                                          | iOS 应用、共享应用套件或 Swabble 变更         |
| `android`                          | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建                                                                                                                                       | Android 相关变更                            |
| `test-performance-agent`           | 单独工作流：受信任活动后的每日 Codex 慢测试优化                                                                                                                       | 主 CI 成功或手动分发                  |
| `openclaw-performance`             | 单独工作流：按日/按需生成 Kova 运行时性能报告，包含 mock-provider、deep-profile 和 GPT 5.5 实时通道                                                                       | 定时和手动分发                       |

## 快速失败顺序

1. `runner-admission` 只会等待规范 `main` 推送；较新的推送会在 Blacksmith 注册前取消该运行。
2. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内的步骤，不是独立作业。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 会快速失败，而不等待更重的产物和平台矩阵作业。
4. `build-artifacts` 会与快速 Linux 通道重叠运行，使下游消费者可在共享构建就绪后立即开始。
5. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。

当较新的推送落在同一个 PR 或 `main` ref 上时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。矩阵作业使用 `fail-fast: false`，并且 `build-artifacts` 会直接报告嵌入式渠道、核心支持边界和 gateway-watch 失败，而不是排队微小的验证器作业。自动 CI 并发键带版本号（`CI-v7-*`），因此旧队列组中的 GitHub 端僵尸运行无法无限期阻塞更新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，且不会取消正在进行的运行。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>` 来汇总 GitHub Actions 的墙钟时间、排队时间、最慢作业、失败项，以及 `pnpm-store-warmup` 扇出屏障。工作流内的 `ci-timings-summary` 作业存在于 `ci.yml` 中，但当前已禁用（`if: false`）；请改为在本地运行计时辅助工具。对于构建计时，请检查 `build-artifacts` 作业的 `Build dist` 步骤：`pnpm build:ci-artifacts` 会打印 `[build-all] phase timings:` 并包含 `ui:build`；该作业还会上传 `startup-memory` 产物。

## PR 上下文和证据

外部贡献者 PR 会从 `.github/workflows/real-behavior-proof.yml` 运行 PR 上下文和证据门禁。该工作流会检出受信任的工作流修订版（`github.workflow_sha`），并且只评估 PR 正文；它不会执行贡献者分支中的代码。

该门禁适用于不是仓库所有者、成员、协作者或 bot 的 PR 作者。当 PR 正文包含作者撰写的 `What Problem This Solves` 和 `Evidence` 部分时，门禁通过。证据可以是聚焦测试、CI 结果、截图、录屏、终端输出、实时观察、已脱敏日志或产物链接。正文提供意图和有用验证；审阅者会检查代码、测试和 CI 来评估正确性。

当检查失败时，请更新 PR 正文，而不是再推送一个代码提交。

## 范围和路由

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动分发会跳过变更范围检测，并让 preflight 清单表现得像每个限定范围区域都发生了变化。

- **CI 工作流编辑**会验证 Node CI 图、工作流 lint 和 Windows 通道（由 `ci.yml` 执行），但不会单独强制执行 iOS、Android 或 macOS 原生构建；这些平台通道仍仅限于平台源代码变更。
- **工作流健全性检查**会对所有工作流 YAML 文件运行 `actionlint`、`zizmor`，并运行复合 action 插值保护和冲突标记保护。PR 范围的 `security-fast` 作业也会对变更的工作流文件运行 `zizmor`，以便工作流安全发现能在主 CI 图中尽早失败。
- **`main` 推送上的文档**由独立的 `Docs` 工作流检查，并使用与 CI 相同的 ClawHub 文档镜像，因此混合的代码+文档推送不会同时排队 CI `check-docs` 分片。拉取请求和手动 CI 在文档变更时仍会从 CI 运行 `check-docs`。
- **TUI PTY**会在 `checks-node-core-runtime-tui-pty` Linux Node 分片中针对 TUI 变更运行。该分片使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 运行 `test/vitest/vitest.tui-pty.config.ts`，因此同时覆盖确定性的 `TuiBackend` fixture 通道，以及较慢的 `tui --local` 冒烟测试，后者只模拟外部模型端点。
- **仅 CI 路由编辑、快速任务直接运行的一小组核心测试 fixture，以及窄范围插件合约辅助工具编辑**使用快速的仅 Node 清单路径：`preflight`、`security-fast`，以及变更触及的快速通道，即单个 `checks-fast-core` CI 路由任务、两个插件合约分片，或两者。该路径会跳过构建产物、Node 22 兼容性、渠道合约、完整核心分片、内置插件分片和额外保护矩阵。
- **Windows Node 检查**仅限于 Windows 特定的进程/路径包装器、npm/pnpm/UI runner 辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源代码、插件、安装冒烟和仅测试变更仍留在 Linux Node 通道上。

最慢的 Node 测试族会被拆分或均衡，使每个作业保持较小规模，同时不过度预留 runner：

- 插件合约和渠道合约各自作为两个加权的 Blacksmith 支持分片运行，并带有标准 GitHub runner 回退。
- 核心单元 fast/support 通道会单独运行；核心运行时基础设施会拆分为 process、shared、hooks、secrets 和三个 cron 领域分片。
- 自动回复作为均衡的 worker 运行，reply 子树会拆分为 agent-runner、commands、dispatch、session 和 state-routing 分片。
- Agentic gateway/server（控制平面）配置会拆分到 chat、auth、model、HTTP/plugin、runtime 和 startup 通道，而不是等待已构建产物。
- 普通 CI 只将隔离的基础设施 include-pattern 分片打包进最多 64 个测试文件的确定性 bundle，从而减少 Node 矩阵，同时不合并非隔离的 command/cron、有状态 agents-core 或 gateway/server 套件。重型固定套件仍使用 8 vCPU，而打包后的通道和较低权重通道使用 4 vCPU。
- 规范仓库上的拉取请求使用紧凑准入计划：相同的按配置分组在隔离子进程中运行，目前是 18 个 Node 测试作业，而不是 74 个作业的完整矩阵。`main` 推送、手动分发和发布门禁保留完整矩阵。
- 广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享插件 catch-all。Include-pattern 分片使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。
- `check-additional-*` 会将补充边界保护列表（`scripts/run-additional-boundary-checks.mjs`）分条到一个提示词密集分片（`check-additional-boundaries-a`，其中包含 Codex 提示词快照漂移检查）和一个用于其余条带的组合分片（`check-additional-boundaries-bcd`），每个分片并发运行独立保护并打印每项检查的耗时。包边界编译/canary 工作保持在一起，而运行时拓扑架构会与嵌入在 `build-artifacts` 中的 Gateway 网关 watch 覆盖率分开运行。
- Gateway 网关 watch、渠道测试和核心 support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内并发运行。

准入后，规范 Linux CI 最多允许 24 个并发 Node 测试作业，以及
12 个较小的 fast/check 通道；Windows 和 Android 保持为两个，因为
这些 runner 池更窄。紧凑的完整配置批次使用
120 分钟批次超时，而 include-pattern 分组共享相同的有界
作业预算。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包作业。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`（一个生产 Knip 仅依赖检查，固定到精确 Knip 版本，并为 `dlx` 安装禁用 pnpm 的最低发布年龄）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现与 `scripts/deadcode-unused-files.allowlist.mjs` 比较，另有一个咨询性质的 `pnpm deadcode:report:ci:ts-unused` 报告作为 `deadcode-reports` 产物上传。当 PR 新增未审查的未使用文件或留下过期 allowlist 条目时，未使用文件保护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、实时测试和包桥接表面。

## ClawSweeper 活动转发

`.github/workflows/clawsweeper-dispatch.yml` 是从 OpenClaw 仓库活动到 ClawSweeper 的目标侧桥接。它不会签出或执行不受信任的拉取请求代码。该工作流会从 `CLAWSWEEPER_APP_PRIVATE_KEY` 创建 GitHub App token，然后向 `openclaw/clawsweeper` 分发紧凑的 `repository_dispatch` 载荷。

该工作流有四个通道：

- `clawsweeper_item` 用于精确的问题和拉取请求审查请求；
- `clawsweeper_comment` 用于 issue 评论中的显式 ClawSweeper 命令；
- `clawsweeper_commit_review` 用于 `main` 推送上的提交级审查请求；
- `github_activity` 用于 ClawSweeper 智能体可能检查的一般 GitHub 活动。

`github_activity` 通道只转发规范化元数据：事件类型、操作、参与者、仓库、条目编号、URL、标题、状态，以及存在评论或审查时的简短摘录。它有意避免转发完整 webhook 正文。`openclaw/clawsweeper` 中的接收工作流是 `.github/workflows/github-activity.yml`，它会将规范化事件发布到用于 ClawSweeper 智能体的 OpenClaw Gateway 网关钩子。

一般活动是观察，而不是默认投递。ClawSweeper 智能体会在提示词中收到 Discord 目标，并且只有当事件令人意外、可行动、有风险或对运营有用时，才应发布到 `#clawsweeper`。常规打开、编辑、bot 噪声、重复 webhook 噪声和普通审查流量应产生 `NO_REPLY`。

在整条路径中，将 GitHub 标题、评论、正文、审查文本、分支名称和提交消息都视为不受信任的数据。它们是用于摘要和分流的输入，而不是工作流或智能体运行时的指令。

## 手动分发

手动 CI 分发运行与普通 CI 相同的作业图，但会强制开启每个非 Android 范围通道：Linux Node 分片、内置插件分片、插件和渠道合约分片、Node 22 兼容性、`check-*`、`check-additional-*`、已构建产物冒烟检查、文档检查、Python Skills、Windows、macOS、iOS 构建和 Control UI i18n。独立的手动 CI 分发只有在 `include_android=true` 时才运行 Android（`release_gate` 输入也会强制 Android）；完整发布总工作流通过传递 `include_android=true` 启用 Android。插件预发布静态检查、仅发布的 `agentic-plugins` 分片、完整插件批量扫查，以及插件预发布 Docker 通道会从 CI 中排除。Docker 预发布套件仅在 `Full Release Validation` 通过启用发布验证门禁分发单独的 `Plugin Prerelease` 工作流时运行。

手动运行使用唯一并发组，因此发布候选完整套件不会被同一 ref 上的另一个推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方使用来自所选分发 ref 的工作流文件，针对分支、tag 或完整提交 SHA 运行该图。`release_gate` 输入是用于容量受阻 PR CI 的精确 SHA 维护者回退：它要求 `target_ref` 是与分发分支 head 匹配的完整提交 SHA。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

每月仅 npm extended-stable 路径是例外：从精确的
`extended-stable/YYYY.M.33` 分支分发 `OpenClaw NPM
Release` 预检和 `Full Release Validation`，保留它们的运行 ID，并将两个 ID 传给
直接 npm 发布运行。有关命令、精确身份要求、registry 回读和选择器
修复流程，请参阅 [每月仅 npm extended-stable
发布](/zh-CN/reference/RELEASING#monthly-npm-only-extended-stable-publication)。
该路径不会分发插件、macOS、Windows、GitHub
Release、私有 dist-tag 或其他平台发布。

## Runners

| 运行器                          | 作业                                                                                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手动 CI 调度和非规范仓库回退、CodeQL 安全与质量扫描、workflow-sanity、labeler、auto-response、独立的文档工作流，以及整个 Install Smoke 工作流                                                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、`pnpm-store-warmup`、`native-i18n`、`checks-fast-core`、插件/渠道契约分片、大多数内置/较轻量的 Linux Node 分片、除 `check-lint` 外的 `check-*` 通道、选定的 `check-additional-*` 分片、`check-docs`，以及 `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的重量级 Linux Node 套件、边界/插件密集型 `check-additional-*` 分片，以及 `android`                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404` | CI 和 Testbox 中的 `build-artifacts`，以及 `check-lint`（对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省的收益）                                                                                                                                                              |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；分支回退到 `macos-15`                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 和 `ios-build`；分支回退到 `macos-26`                                                                                                                                                                                             |

## 运行器注册预算

OpenClaw 当前的 GitHub 运行器注册桶在 `ghx api rate_limit` 中报告为每 5 分钟 10,000 次自托管运行器注册。每次调优前都要重新检查 `actions_runner_registration`，因为 GitHub 可能更改这个桶。该限制由 `openclaw` 组织中的所有 Blacksmith 运行器注册共享，因此添加另一个 Blacksmith 安装不会新增桶。

将 Blacksmith 标签视为突发控制的稀缺资源。仅用于路由、通知、汇总、选择分片或运行短 CodeQL 扫描的作业应留在 GitHub 托管运行器上，除非它们有可测量的 Blacksmith 专属需求。任何新的 Blacksmith 矩阵、更大的 `max-parallel` 或高频工作流，都必须展示其最坏情况下的注册数量，并将组织级目标保持在实时桶的大约 60% 以下。对于当前的 10,000 次注册桶，这意味着 6,000 次注册的运行目标，为并发仓库、重试和突发重叠留出余量。

规范仓库 CI 将 Blacksmith 保持为普通推送和拉取请求运行的默认运行器路径。`workflow_dispatch` 和非规范仓库运行使用 GitHub 托管运行器，但普通规范运行当前不会探测 Blacksmith 队列健康状况，也不会在 Blacksmith 不可用时自动回退到 GitHub 托管标签。

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
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` 是产品/运行时性能工作流。它每天在 `main` 上运行，也可以手动调度：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手动调度通常会基准测试工作流 ref。设置 `target_ref` 可使用当前工作流实现来基准测试发布标签或另一个分支。已发布的报告路径和最新指针按被测试的 ref 建立键，每个 `index.md` 都记录被测试的 ref/SHA、工作流 ref/SHA、Kova ref、配置档、通道鉴权模式、模型、重复次数和场景过滤器。

该工作流从固定发布版本安装 OCM，并从 `openclaw/Kova` 按固定的 `kova_ref` 输入安装 Kova，然后运行三个通道：

- `mock-provider`：针对本地构建运行时运行 Kova 诊断场景，并使用确定性的假 OpenAI 兼容鉴权。
- `mock-deep-profile`：对启动、Gateway 网关和智能体轮次热点进行 CPU/堆/追踪分析。按计划运行，或在调度时带 `deep_profile=true` 运行。
- `live-openai-candidate`：真实的 OpenAI `openai/gpt-5.5` 智能体轮次，当 `OPENAI_API_KEY` 不可用时跳过。按计划运行，或在调度时带 `live_openai_candidate=true` 运行。

`mock-provider` 通道还会在 Kova 通过后运行 OpenClaw 原生源探针：默认、跳过渠道、内部钩子和五十插件启动场景下的 Gateway 网关启动耗时和内存；内置插件导入 RSS、重复的模拟 OpenAI `channel-chat-baseline` hello 循环、针对已启动 Gateway 网关的 CLI 启动命令，以及 SQLite 状态冒烟性能探针。当被测试 ref 的上一份已发布 `mock-provider` 源报告可用时，源摘要会将当前 RSS 和堆值与该基线比较，并将较大的 RSS 增长标记为 `watch`。源探针 Markdown 摘要位于报告包中的 `source/index.md`，旁边有原始 JSON。

每个通道都会上传 GitHub 构件。当配置了 `CLAWGRIT_REPORTS_TOKEN` 时，工作流还会将 `report.json`、`report.md`、包、`index.md` 和源探针构件提交到 `openclaw/clawgrit-reports`，路径为 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`。当前被测试 ref 的指针写为 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整发布验证

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流（包括 Android），调度 `Plugin Prerelease` 以获取仅发布用的插件/包/静态/Docker 证明，针对目标 SHA 调度 `OpenClaw Performance`，并调度 `OpenClaw Release Checks` 来执行安装冒烟、包验收、跨 OS 包检查、QA Lab parity、Matrix 和 Telegram 通道（建议性的成熟度评分卡渲染可通过 `run_maturity_scorecard` 选择开启）。stable 和 full 配置档始终包含详尽的实时/E2E 和 Docker 发布路径浸泡覆盖；beta 配置档可通过 `run_release_soak=true` 选择开启。规范包 Telegram E2E 在 Package Acceptance 内运行，因此完整候选不会启动重复的实时轮询器。发布后，传入 `release_package_spec` 可在发布检查、Package Acceptance、Docker、跨 OS 和 Telegram 中复用已发布的 npm 包，无需重新构建。仅对聚焦的已发布包 Telegram 重新运行使用 `npm_telegram_package_spec`。Codex 插件实时包通道默认使用同一已选状态：已发布的 `release_package_spec=openclaw@<tag>` 会派生 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA/构件运行会从所选 ref 打包 `extensions/codex`。对于自定义插件来源（如 `npm:`、`npm-pack:` 或 `git:` 规格），显式设置 `codex_plugin_spec`。

参见 [完整发布验证](/zh-CN/reference/full-release-validation)，了解阶段矩阵、确切的工作流作业名称、配置档差异、构件和聚焦重新运行句柄。

`OpenClaw Release Publish` 是手动变更型发布工作流。在发布标签存在且 OpenClaw npm 预检成功后，从 `release/YYYY.M.PATCH` 或 `main` 调度它（预检会在其检查中运行 `pnpm plugins:sync:check`）。它需要已保存的 `preflight_run_id` 和成功的 `full_release_validation_run_id`，会为所有可发布的插件包调度 `Plugin NPM Release`，为同一发布 SHA 调度 `Plugin ClawHub Release`，然后才调度 `OpenClaw NPM Release`。stable 发布还需要精确的 `windows_node_tag`；该工作流会验证 Windows 源发布，并在任何发布子任务前，将其 x64/ARM64 安装程序与候选已批准的 `windows_node_installer_digests` 输入进行比较，然后在发布 GitHub 发布草稿前，提升并验证这些相同的固定安装程序摘要以及精确的配套资产和校验和契约。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

对于快速变动分支上的固定提交证明，使用辅助命令，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs 必须是分支或标签，而不是原始提交 SHA。该
辅助工具会在目标 SHA 上推送一个临时 `release-ci/<sha>-...` 分支，
从这个固定 ref 调度 `Full Release Validation`，验证每个子
workflow 的 `headSha` 都匹配目标，并在运行完成时删除临时分支。如果任何子 workflow 在不同 SHA 上运行，伞形验证器也会失败。

`release_profile` 控制传递给发布检查的 live/provider 覆盖范围。手动发布 workflow 默认使用 `stable`；只有在你有意需要广泛的 advisory 提供商/媒体矩阵时才使用 `full`。Stable 和 full 发布检查始终运行完整的 live/E2E 以及 Docker 发布路径 soak；beta profile 可以通过 `run_release_soak=true` 选择加入。

- `minimum` 保留最快的 OpenAI/core 发布关键 lane。
- `stable` 添加稳定的提供商/后端集合。
- `full` 运行广泛的 advisory 提供商/媒体矩阵。

伞形 workflow 会记录已调度的子运行 ID，最终的 `Verify full validation` job 会重新检查当前子运行结论，并为每个子运行追加最慢 job 表。如果某个子 workflow 被重新运行并转为绿色，只需重新运行父验证器 job，即可刷新伞形结果和耗时摘要。

用于恢复时，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对发布候选使用 `all`，仅对普通 full CI 子项使用 `ci`，仅对插件预发布子项使用 `plugin-prerelease`，仅对 OpenClaw Performance 子项使用 `performance`，对每个发布子项使用 `release-checks`，或在伞形 workflow 上使用更窄的组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这能让失败的发布 box 在集中修复后进行有界重跑。对于单个失败的跨 OS lane，将 `rerun_group=cross-os` 与 `cross_os_suite_filter` 结合使用，例如 `windows/packaged-upgrade`；长时间运行的跨 OS 命令会发出 heartbeat 行，packaged-upgrade 摘要包含每个阶段的耗时。QA 发布检查 lane 是 advisory 的，但标准运行时工具覆盖率 gate 除外；当必需的 OpenClaw 动态工具在标准层摘要中漂移或消失时，它会阻塞。

`OpenClaw Release Checks` 使用受信任的 workflow ref，将所选 ref 解析一次为 `release-package-under-test` tarball，然后把该构件传递给跨 OS 检查和 Package Acceptance，以及在运行 soak 覆盖时传递给 live/E2E 发布路径 Docker workflow。这样能让发布 box 之间的包字节保持一致，并避免在多个子 job 中重复打包同一个候选包。对于 Codex npm-plugin live lane，发布检查会传入从 `release_package_spec` 派生的匹配已发布插件 spec，传入操作员提供的 `codex_plugin_spec`，或让输入留空，以便 Docker 脚本打包所选 checkout 的 Codex 插件。

对于 `ref=main` 和 `rerun_group=all` 的重复 `Full Release Validation` 运行会取代较旧的伞形 workflow。父监控器在父项被取消时会取消它已经调度的任何子 workflow，因此较新的 main 验证不会排在陈旧的两小时发布检查运行之后。发布分支/标签验证和集中重跑组保持 `cancel-in-progress: false`。

## Live 和 E2E 分片

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖率，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行，而不是一个串行 job：

- `native-live-src-agents` 和 `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` jobs
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片

这在保持相同文件覆盖率的同时，让缓慢的 live 提供商失败更容易重跑和诊断。聚合的 `native-live-src-gateway`、`native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重跑。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` workflow 构建。该镜像预安装了 `ffmpeg` 和 `ffprobe`；媒体 job 只会在设置前验证这些二进制文件。将 Docker 支持的 live 套件保留在普通 Blacksmith runner 上；container job 不适合启动嵌套 Docker 测试。

Docker 支持的 live 模型/后端分片会为每个所选提交使用一个单独共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` 镜像。live 发布 workflow 会构建并推送该镜像一次，然后 Docker live 模型、按提供商分片的 Gateway 网关、CLI 后端、ACP bind 和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway 网关 Docker 分片在脚本级别携带明确的 `timeout` 上限，低于 workflow job 超时，因此卡住的容器或清理路径会快速失败，而不是耗尽整个发布检查预算。如果这些分片独立重建完整的源 Docker target，则说明发布运行配置错误，并会在重复镜像构建上浪费墙钟时间。

## Package Acceptance

当问题是“这个可安装的 OpenClaw 包是否能作为产品工作？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证源代码树，而 package acceptance 会通过用户在安装或更新后使用的同一个 Docker E2E harness 来验证单个 tarball。

### Jobs

1. `resolve_package` checkout `workflow_ref`，解析一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 构件上传，并在 GitHub 步骤摘要中打印来源、workflow ref、package ref、版本、SHA-256 和 profile。
2. `package_integrity` 下载 `package-under-test` 构件，并通过 `scripts/check-openclaw-package-tarball.mjs` 强制执行公共包 tarball 契约。
3. `docker_acceptance` 使用已解析的包源 SHA（回退到 `workflow_ref`）和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用 workflow 下载该构件，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包运行所选 Docker lane，而不是打包 workflow checkout。当某个 profile 选择多个目标 `docker_lanes` 时，可复用 workflow 会先准备包和共享镜像一次，然后将这些 lane 扇出为并行的目标 Docker job，并使用唯一构件。
4. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时它会运行，并在 Package Acceptance 已解析包时安装同一个 `package-under-test` 构件；独立 Telegram dispatch 仍可安装已发布的 npm spec。
5. 如果包解析、完整性、Docker acceptance 或可选 Telegram lane 失败，`summary` 会使 workflow 失败。`advisory` 输入会把 advisory 调用方的 acceptance 失败降级为警告。

### 候选来源

- `source=npm` 只接受 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布的 extended-stable、预发布或 stable acceptance。
- `source=ref` 打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在 detached worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载公共 HTTPS `.tgz`；`package_sha256` 是必需的。此路径会拒绝 URL 凭证、非默认 HTTPS 端口、私有/内部/特殊用途主机名或解析后的 IP，以及跳转到同一公共安全策略之外的重定向。
- `source=trusted-url` 从 `.github/package-trusted-sources.json` 中命名的 trusted-source policy 下载 HTTPS `.tgz`；`package_sha256` 和 `trusted_source_id` 是必需的。仅将其用于维护者拥有的企业镜像或私有包仓库，这些仓库需要配置主机、端口、路径前缀、重定向主机或私有网络解析。如果该 policy 声明 bearer auth，workflow 会使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret；URL 嵌入式凭证仍会被拒绝。
- `source=artifact` 从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但应为外部共享构件提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任 workflow/harness 代码。`package_ref` 是 `source=ref` 时会被打包的源提交。这允许当前测试 harness 验证较旧的受信任源提交，而不运行旧 workflow 逻辑。

### 套件 profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`root-managed-vps-upgrade`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `package` 集合，但使用 live `plugins` 覆盖率代替 `plugins-offline`，并添加 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 带 OpenWebUI 的完整 Docker 发布路径分块
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

`package` profile 使用离线插件覆盖率，因此已发布包验证不会被 live ClawHub 可用性阻塞。可选 Telegram lane 在 `NPM Telegram Beta E2E` 中复用 `package-under-test` 构件，同时为独立 dispatch 保留已发布 npm spec 路径。

有关专用更新和插件测试策略，包括本地命令、Docker lane、Package Acceptance 输入、发布默认值和失败分诊，请参阅 [更新和插件测试](/zh-CN/help/testing-updates-plugins)。

发布检查使用 `source=artifact`、准备好的发布包构件、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。这会让包迁移、更新、live ClawHub skill install、陈旧插件依赖清理、已配置插件安装修复、离线插件、plugin-update 和 Telegram 证明都基于同一个已解析包 tarball。在发布 beta 后，在 Full Release Validation 或 OpenClaw Release Checks 上设置 `release_package_spec`，以便在不重建的情况下针对已发布 npm 包运行同一矩阵；仅当 Package Acceptance 需要与其余发布验证不同的包时，才设置 `package_acceptance_package_spec`。跨 OS 发布检查仍覆盖特定 OS 的 onboarding、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。

`published-upgrade-survivor` Docker lane 会在阻塞发布路径中每次运行验证一个已发布包基线。在 Package Acceptance 中，解析出的 `package-under-test` tarball 始终是候选包，而 `published_upgrade_survivor_baseline` 选择回退的已发布基线，默认是 `openclaw@latest`；失败 lane 的重跑命令会保留该基线。Full Release Validation 在设置 `run_release_soak=true` 或 `release_profile=full` 时，会设置 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以扩展覆盖四个最新的稳定 npm 版本，以及固定的插件兼容性边界版本和按 issue 形态构造的夹具，覆盖 Feishu 配置、保留的 bootstrap/persona 文件、已配置的 OpenClaw 插件安装、波浪号日志路径和陈旧的旧版插件依赖根目录。多基线 published-upgrade survivor 选择会按基线分片到单独的定向 Docker runner 作业中。单独的 `Update Migration` workflow 会在问题是穷尽式已发布更新清理，而不是普通 Full Release CI 覆盖范围时，使用 `update-migration` Docker lane，并带上 `all-since-2026.4.23` 基线和 `plugin-deps-cleanup` 场景。本地聚合运行可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传入精确的包规格，通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持单个 lane，例如 `openclaw@2026.4.15`，或设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 用于场景矩阵。已发布 lane 会用内置的 `openclaw config set` 命令配方配置基线，在 `summary.json` 中记录配方步骤，并在 Gateway 网关启动后探测 `/healthz`、`/readyz` 以及 RPC 状态。Windows 打包版和安装器 fresh lane 还会验证已安装包可以从原始绝对 Windows 路径导入 browser-control override。OpenAI 跨操作系统智能体轮次 smoke 在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.5`，因此安装和 Gateway 网关证明会停留在 GPT-5 测试模型上，同时避免 GPT-4.x 默认值。

### 旧版兼容窗口

Package Acceptance 对已发布包设有有界的旧版兼容窗口。直到 `2026.4.25` 的包，包括 `2026.4.25-beta.*`，可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可以指向 tarball 省略的文件；
- 当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过其持久化子用例；
- `update-channel-switch` 可以从 tarball 派生的假 git 夹具中修剪缺失的 pnpm `patchedDependencies`，并可以记录缺失的已持久化 `update.channel`；
- 插件 smoke 可以读取旧版安装记录位置，或接受缺少 marketplace 安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和 no-reinstall 行为保持不变。

已发布的 `2026.4.26` 包也可以对已经发出的本地构建元数据 stamp 文件发出警告，直到 `2026.5.20` 的包在缺少 `npm-shrinkwrap.json` 时可以警告而不是失败。之后的包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

# Validate the published extended-stable package with package coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

调试失败的包验收运行时，从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段耗时和重跑命令。优先重跑失败的包 profile 或精确的 Docker lane，而不是重跑完整发布验证。

## 安装 smoke

单独的 `Install Smoke` workflow 不再在 pull request 或 `main` 推送上运行。它会按 nightly 计划、手动 dispatch，以及作为发布验证的 workflow call 运行，并且每次运行都会在 GitHub 托管 runner 上走完整 install-smoke 路径：

- 根 Dockerfile smoke 镜像会针对每个目标 SHA 构建一次（或从 GHCR 作为 `ghcr.io/openclaw/openclaw-dockerfile-smoke:<sha>` 复用），然后 CLI smoke、agents delete shared-workspace CLI smoke、容器 gateway-network E2E，以及内置 `matrix` 插件 build-arg smoke 都会基于它运行。插件 smoke 会验证运行时依赖安装镜像一致，并验证插件加载时没有 entry-escape 诊断。
- QR 包安装以及安装器/更新 Docker smoke（包括 Rocky Linux 安装器 lane 和针对可配置 `update_baseline_version` npm 基线的更新 lane）作为单独作业运行，这样安装器工作不会等待根镜像 smoke。

较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控。它会在 nightly 计划中运行，发布检查的 workflow call 默认开启，手动 `Install Smoke` dispatch 可以选择加入。普通 PR CI 仍会针对 Node 相关变更运行快速 Bun launcher 回归 lane。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享 `scripts/e2e/Dockerfile` 镜像：

- 用于安装器/更新/插件依赖 lane 的裸 Node/Git runner；
- 将同一个 tarball 安装到 `/app` 的功能镜像，用于普通功能 lane。

Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选中的计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 lane。

### 可调项

| 变量                                   | 默认值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 普通 lane 的主池槽位数。                                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 提供商敏感 tail-pool 槽位数。                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发 live lane 上限，避免提供商限流。                                                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 并发 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务 lane 上限。                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 启动之间的错峰，避免 Docker daemon create 风暴；设为 `0` 表示不做错峰。                 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每个 lane 的回退超时（120 分钟）；选定的 live/tail lane 使用更紧的上限。                     |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 会打印调度器计划而不运行 lane。                                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 逗号分隔的精确 lane 列表；跳过 cleanup smoke，让智能体可以复现一个失败 lane。                 |

比其有效上限更重的 lane 仍可从空池启动，然后独占运行直到释放容量。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活跃 lane 状态，持久化 lane 耗时用于 longest-first 排序，并且默认在首次失败后停止调度新的池化 lane。

### 可复用 live/E2E workflow

可复用 live/E2E workflow 会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪个包、镜像类型、live 镜像、lane 和凭证覆盖。随后 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包工件，或从 `package_artifact_run_id` 下载包工件；验证 tarball 清单；当计划需要已安装包的 lane 时，通过 Blacksmith 的 Docker layer cache 构建并推送以包摘要标记的 bare/functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。Docker 镜像拉取会使用有界的每次尝试 180 秒超时进行重试，因此卡住的 registry/cache 流会快速重试，而不会消耗 CI 关键路径的大部分时间。

### 发布路径分块

发布 Docker 覆盖会运行更小的分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取所需的镜像类型，并通过同一个加权调度器执行多个 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

当前发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及从 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`package-update-openai` 包含 live Codex 插件包 lane，它会安装候选 OpenClaw 包，从 `codex_plugin_spec` 或同 ref tarball 安装 Codex 插件并带有明确的 Codex CLI 安装审批，运行 Codex CLI 预检，然后针对 OpenAI 运行多个同会话 OpenClaw 智能体轮次。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合插件/运行时别名。`install-e2e` lane 别名仍然是两个提供商安装器 lane 的聚合手动重跑别名。

OpenWebUI 会在完整发布路径覆盖请求需要时并入 `plugins-runtime-services`，并且只为仅 OpenWebUI 的分发保留独立的 `openwebui` 分块。内置渠道更新通道会针对临时 npm 网络故障重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、计时、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON、慢通道表，以及每通道重跑命令。工作流 `docker_lanes` 输入会针对已准备的镜像运行选定通道，而不是运行分块作业，这会将失败通道调试限定在一个有针对性的 Docker 作业内，并为该次运行准备、下载或复用包工件；如果选定通道是 live Docker 通道，目标作业会在本地构建 live-test 镜像用于该次重跑。生成的每通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败通道可以复用失败运行中的确切包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

定时 live/E2E 工作流每天运行完整发布路径 Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个由 `Full Release Validation` 或显式操作员分发的独立工作流。普通拉取请求、`main` 推送和独立手动 CI 分发会保持该套件关闭。它会在八个扩展 worker 之间均衡内置插件测试；这些扩展分片作业每次最多运行两个插件配置组，每组使用一个 Vitest worker，并使用更大的 Node 堆，因此导入密集型插件批次不会创建额外 CI 作业。仅发布使用的 Docker 预发布路径（由 `full_release_validation` 输入启用）会按四个一组批处理目标 Docker 通道，以避免为一到三分钟的作业预留数十个 runner。该工作流还会从 `@openclaw/plugin-inspector` 上传一个信息性 `plugin-inspector-advisory` 工件；inspector 发现是分诊输入，不会改变阻塞性的 Plugin Prerelease 门禁。

## QA Lab

QA Lab 在主智能作用域工作流之外有专用 CI 通道。Agentic parity 嵌套在广泛 QA 和发布 harness 下，而不是独立的 PR 工作流。当 parity 应随广泛验证运行一起执行时，使用 `Full Release Validation` 并设置 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动分发；它会将 mock parity 通道、live Matrix 通道，以及 live Telegram 和 Discord 通道作为并行作业扇出。Live 作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex leases。

发布检查会使用确定性 mock 提供商和符合 mock 条件的模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram live 传输通道，因此渠道契约会与 live 模型延迟和普通 provider-plugin 启动隔离。Live 传输 Gateway 网关会禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；提供商连接性由单独的 live 模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 对定时和发布门禁使用 `--profile fast`，只有在检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分发始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 还会在发布批准前运行发布关键的 QA Lab 通道；其 QA parity 门禁会将候选包和基线包作为并行通道作业运行，然后将两个工件下载到一个小型报告作业中，用于最终 parity 比较。

对于普通 PR，遵循作用域化 CI/检查证据，而不是把 parity 视为必需状态。

## CodeQL

`CodeQL` 工作流有意作为范围较窄的首轮安全扫描器，而不是完整仓库扫描。每日、手动、`main` 推送和非草稿拉取请求保护运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 范围，并使用筛选到高/关键 `security-severity` 的高置信安全查询。

拉取请求保护保持轻量：它只会针对 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src` 或拥有进程的内置插件运行时路径下的变更启动，并运行与定时工作流相同的高置信安全矩阵。Android 和 macOS CodeQL 不包含在 PR 默认值中。

### 安全类别

| 类别                                              | 范围                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 凭证、密钥、沙箱、cron 和 Gateway 网关基线                                                                                          |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥、审计触点                                                         |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络防护、web-fetch 和插件 SDK SSRF 策略范围                                                                     |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助工具、出站投递和智能体工具执行门禁                                                                           |
| `/codeql-security-high/process-exec-boundary`     | 本地 shell、进程 spawn 辅助工具、拥有子进程的内置插件运行时，以及工作流脚本胶水层                                                   |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、清单、注册表、包管理器安装、源加载，以及插件 SDK 包契约信任范围                                                    |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 定时 Android 安全分片。在工作流完整性检查接受的最小 Blacksmith Linux runner 上，为 CodeQL 手动构建 Android 应用。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤依赖构建结果，并上传到 `/codeql-critical-security/macos` 下。它保持在每日默认值之外，因为即使干净运行，macOS 构建也会主导运行时间。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它只在范围较窄的高价值表面上运行 error-severity、非安全 JavaScript/TypeScript 质量查询，并使用 GitHub 托管的 Linux runner，因此质量扫描不会消耗 Blacksmith runner 注册预算。它的拉取请求保护有意小于定时配置：非草稿 PR 只会针对它们触及的范围运行匹配分片，这些分片来自十三个可由 PR 路由的分片：`agent-runtime-boundary`、`channel-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`memory-runtime-boundary`、`network-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime`、`provider-runtime-boundary` 和 `session-diagnostics-boundary`。`ui-control-plane` 和 `web-media-runtime-boundary` 不参与 PR 运行。CodeQL 配置和质量工作流变更会运行完整 PR 分片集（network runtime 分片会根据自身 CodeQL 配置文件和拥有网络的源路径触发）。

手动分发接受：

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

窄配置是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 表面                                                                                                                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 凭证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                                |
| `/codeql-critical-quality/config-boundary`              | 配置 schema、迁移、规范化和 IO 契约                                                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议 schema 和服务器方法契约                                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约                                                                                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥接、进程监督辅助工具，以及出站投递契约                                                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆宿主 SDK、记忆运行时 facade、记忆插件 SDK 别名、记忆运行时激活胶水代码，以及记忆 Doctor 命令                                                                  |
| `/codeql-critical-quality/network-runtime-boundary`     | 网络策略包、原始套接字和代理捕获运行时、SSH 隧道、Gateway 网关锁、JSONL 套接字，以及推送传输表面                                                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递辅助工具、诊断事件/日志包表面，以及会话 Doctor CLI 契约                                                         |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复载荷/分块/运行时辅助工具、渠道回复选项、投递队列，以及会话/线程绑定辅助工具                                                           |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商凭证和发现、提供商运行时注册、提供商默认值/目录，以及 Web/搜索/抓取/嵌入注册表                                                             |
| `/codeql-critical-quality/ui-control-plane`             | Control UI 启动、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                       |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 Web 抓取/搜索、媒体 IO、媒体理解、图像生成，以及媒体生成运行时契约                                                                                           |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公共表面，以及插件 SDK 入口点契约                                                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧插件 SDK 源码和插件包契约辅助工具                                                                                                                       |

质量与安全保持分离，这样质量发现就可以被排期、度量、禁用或扩展，而不会遮蔽安全信号。Swift、Python 和内置插件的 CodeQL 扩展只应在这些窄配置文件具备稳定运行时和信号后，作为有范围或分片的后续工作加回。

## 维护工作流

### Docs Agent

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的更改保持一致。它没有纯定时调度：`main` 上一次成功的非 bot 推送 CI 运行可以触发它，手动分发也可以直接运行它。当 `main` 已经继续前进，或过去一小时内已经创建过另一个未跳过的 Docs Agent 运行时，工作流运行调用会跳过。运行时，它会审查从上一个未跳过的 Docs Agent 来源 SHA 到当前 `main` 的提交范围，因此一次小时级运行可以覆盖自上次文档检查以来积累的所有 main 更改。

### Test Performance Agent

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：`main` 上一次成功的非 bot 推送 CI 运行可以触发它，但如果当天 UTC 已经有另一个工作流运行调用运行过或正在运行，它会跳过。手动分发会绕过该每日活动门控。该通道会构建一份全套分组 Vitest 性能报告，让 Codex 只做小型、保持覆盖率的测试性能修复，而不是大范围重构，然后重新运行全套报告，并拒绝会降低通过基线测试数量的更改。分组报告会记录 Linux 和 macOS 上每个配置的墙钟时间和最大 RSS，因此前后对比会在时长变化旁呈现测试内存变化。如果基线存在失败测试，Codex 只能修复明显失败，并且后置 agent 全套报告必须通过后才会提交任何内容。当 bot 推送落地前 `main` 前进时，该通道会对已验证补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于落地后的重复项清理。它默认 dry-run，并且仅在 `apply=true` 时关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地 PR 已合并，并且每个重复项要么有共享的引用 issue，要么有重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门控和变更路由

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门控对架构边界的要求比宽泛的 CI 平台范围更严格：

- 核心生产更改会运行核心生产和核心测试类型检查，以及核心 lint/guard；
- 仅核心测试更改只会运行核心测试类型检查以及核心 lint；
- 插件生产更改会运行插件生产和插件测试类型检查，以及插件 lint；
- 仅插件测试更改会运行插件测试类型检查以及插件 lint；
- 公共插件 SDK 或插件契约更改会扩展到插件类型检查，因为插件依赖这些核心契约（Vitest 插件扫描仍然是显式测试工作）；
- 仅发布元数据的版本升级会运行定向版本/配置/根依赖检查；
- 未知的根目录/配置更改会 fail safe 到所有检查通道。

本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更便宜：直接测试编辑会运行自身，源码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置是显式映射之一：对群组可见回复配置、来源回复投递模式，或 message-tool 系统提示词的更改，会经由核心回复测试以及 Discord 和 Slack 投递回归测试路由，因此共享默认值更改会在第一次 PR 推送前失败。仅当更改具有足够广的 harness 范围，使廉价映射集合不再是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

Crabbox 是仓库自有的远程盒子包装器，用于维护者 Linux 证明。Agent
会话默认用它运行测试和计算密集型工作，
包括构建、类型检查、lint 扇出、Docker、包通道、E2E、实时
证明，以及 CI 对齐。可信维护者代码默认使用
`blacksmith-testbox`，并且 `.crabbox.yaml` 现在默认指向它。其配置的
工作流会注入提供商和 agent 凭据，因此不受信任的贡献者或
fork 代码必须改用无密钥 fork CI 或经过清理的 direct AWS Crabbox。
经过清理的 AWS 运行会设置 `CRABBOX_ENV_ALLOW=CI`，传入
`--no-hydrate`，并使用新的临时远程 `HOME`；这会防止仓库
`OPENCLAW_*` allowlist 和现有凭证配置文件接触不受信任的代码。
它们使用为该不受信任来源专门新预热的租约，绝不使用
可信或之前已注入凭据的租约。从干净可信的 `main` checkout 启动已安装的可信 Crabbox
二进制文件，并且仅使用
`--fresh-pr` 获取远程 PR；绝不在本地执行不受信任 checkout 的包装器或配置。
取消设置 `CRABBOX_AWS_INSTANCE_PROFILE`，并在解析后的
`aws.instanceProfile` 非空时 fail closed。在任何安装/测试前，使用可信的
绝对路径工具要求 IMDSv2 token，证明 IAM 凭据
端点返回 404，并将远程 `git rev-parse HEAD` 与完整的
已审查 PR head SHA 比较。将租约绑定到该 SHA，并在 head 变化时停止/重新预热。
从干净的 `main` 上传可信的 `scripts/crabbox-untrusted-bootstrap.sh`
并配合 `--fresh-pr`；它会安装固定版本的 Node/pnpm，验证 SHA 和
包管理器固定版本，隔离 `HOME`，安装依赖，然后执行
请求的测试。
取消设置所有 `CRABBOX_TAILSCALE*` 覆盖，强制 `--network public
--tailscale=false`，清除 exit-node/LAN 标志，并要求 `crabbox inspect` 在上传任何脚本前
报告公共网络且没有 Tailscale 状态。
自有 AWS/Hetzner 容量也仍然是 Blacksmith 中断、
配额问题，或显式自有容量测试的回退。

在一个很可能需要测试或重型证明的可信代码任务开始时，agent
应立即在后台命令会话中预热，在注入运行期间继续
检查和编辑，复用返回的 `tbx_...` id，
在每次运行时同步当前 checkout，并在交接前停止它：

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Crabbox 支持的 Blacksmith 运行会预热、领取、同步、运行、报告并清理
一次性 Testbox。内置同步完整性检查会在
同步盒子上的 `git status --short` 显示至少 200 个已跟踪删除时快速失败，
这会捕捉 `pnpm-lock.yaml` 等根文件消失的情况。对于有意的大规模删除 PR，
为远程命令设置 `CRABBOX_ALLOW_MASS_DELETIONS=1`。

如果本地 Blacksmith CLI 调用在同步阶段停留超过五分钟且没有同步后输出，
Crabbox 也会终止它。设置
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可禁用该 guard，或针对异常大的本地 diff
使用更大的毫秒值。

首次运行前，从仓库根目录检查包装器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

仓库包装器会拒绝不声明所选提供商的过期 Crabbox 二进制文件，并且 Blacksmith 支持的运行需要 Crabbox 0.22.0 或更新版本，以便包装器获得当前的 Testbox 同步、队列和清理行为。在 Codex 工作树或链接/稀疏 checkout 中，避免使用本地 `pnpm crabbox:run` 脚本，因为 pnpm 可能会在 Crabbox 启动前协调依赖；请改为直接调用 node 包装器：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

使用同级 checkout 时，请在计时或证明工作前重新构建被忽略的本地二进制文件：

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

`.crabbox.yaml` 中的 `blacksmith:` 块已经固定了组织、workflow、job 和 ref 默认值，所以下面的显式标志是可选的。变更门禁：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

聚焦测试重跑：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

完整套件：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

读取最终 JSON 摘要。有用的字段是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。对于委派的 Blacksmith Testbox 运行，Crabbox 包装器退出码和 JSON 摘要就是命令结果。链接的 GitHub Actions 运行负责 hydration 和 keepalive；当 SSH 命令已经返回后，Testbox 被外部停止时，它可能以 `cancelled` 结束。除非包装器 `exitCode` 非零或命令输出显示测试失败，否则将其视为清理/状态产物。一次性 Blacksmith 支持的 Crabbox 运行应自动停止 Testbox；如果运行被中断或清理状态不明确，请检查实时 box，并且只停止你创建的 box：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有当你有意需要在同一个已 hydrated box 上运行多个命令时，才使用复用：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

复用租约，而不是陈旧源码。省略 `--no-sync`，这样每次运行都会上传当前 checkout；只有在有意重跑一个未变更且已经同步的树时才使用它。不受信任的贡献者/fork 代码必须对每条命令使用 `CRABBOX_ENV_ALLOW=CI`、`--provider aws --no-hydrate` 和全新的临时远程 `HOME`；在测试前，在该已净化命令中安装依赖。只复用专用于同一不受信任源码的新预热租约；绝不要复用受信任或之前已 hydrated 的租约。绝不要在本地执行不受信任 checkout 的包装器或配置：从干净且受信任的 `main` 启动已安装的受信任 Crabbox 二进制文件，并在每次运行时传入 `--fresh-pr`。保持 `CRABBOX_AWS_INSTANCE_PROFILE` 未设置，拒绝非空的已解析 instance profile，要求受信任远程 IMDS 无角色证明，并在安装/测试前验证已审核的 head SHA。将租约绑定到该 SHA；任何 head 变更后都停止并重新预热。如果不存在远程 PR，请使用无密钥 fork CI。绝不要为不受信任源码选择 `hydrate-github` 或凭证 hydrated 的 Blacksmith workflow。

如果 Crabbox 是损坏层但 Blacksmith 本身正常，仅将直接 Blacksmith 用于 `list`、`status` 和清理等诊断。在将直接 Blacksmith 运行视为维护者证明之前，先修复 Crabbox 路径。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 正常，但新的预热在几分钟后仍处于 `queued` 且没有 IP 或 Actions 运行 URL，请将其视为 Blacksmith 提供商、队列、计费或组织限制压力。停止你创建的 queued id，避免启动更多 Testbox，并将证明移到下面自有 Crabbox 容量路径，同时安排人员检查 Blacksmith 仪表板、计费和组织限制。

仅当 Blacksmith 宕机、受配额限制、缺少所需环境，或明确目标是自有容量时，才升级到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

在 AWS 压力下，除非任务确实需要 48xlarge 级 CPU，否则避免使用 `class=beast`。`beast` 请求从 192 个 vCPU 起步，最容易触发区域性 EC2 Spot 或 On-Demand Standard 配额。仓库自有的 `.crabbox.yaml` 默认使用 `class: standard`、on-demand market 和 `capacity.hints: true`，因此经纪式 AWS 租约会打印所选区域/市场、配额压力、Spot fallback 和高压力 class 警告。较重的广泛检查使用 `fast`，仅在 standard/fast 不够时使用 `large`，而 `beast` 只用于例外的 CPU 密集型通道，例如完整套件或全插件 Docker 矩阵、明确的发布/阻塞验证，或高核心性能分析。不要将 `beast` 用于 `pnpm check:changed`、聚焦测试、仅文档工作、普通 lint/typecheck、小型 E2E 复现或 Blacksmith 故障分流。容量诊断使用 `--market on-demand`，这样 Spot 市场波动不会混入信号。

`.crabbox.yaml` 负责提供商、同步和 GitHub Actions hydration 默认值。Crabbox 同步绝不传输 `.git`，因此 hydrated 的 Actions checkout 会保留自己的远程 Git 元数据，而不是同步维护者本地的 remotes 和 object stores；仓库配置还会额外排除本地运行时/构建产物（例如 `.artifacts` 和测试报告），这些永远不应被传输。`.github/workflows/crabbox-hydrate.yml` 负责 checkout、Node/pnpm 设置、`origin/main` fetch，以及自有云 `crabbox run --id <cbx_id>` 命令的非密钥环境交接。

## 相关

- [安装概览](/zh-CN/install)
- [开发频道](/zh-CN/install/development-channels)
