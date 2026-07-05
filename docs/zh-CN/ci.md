---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
    - 你正在协调发布验证运行或重新运行
    - 你正在更改 ClawSweeper 调度或 GitHub 活动转发
summary: CI 作业图、范围门禁、发布总括项和本地命令等价项
title: CI 管道
x-i18n:
    generated_at: "2026-07-05T11:05:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0462c4fe6ce0aacac5fe303cea1181b11822fc44b2d6a2fe4102ca59ce68539e
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 在推送到 `main` 时运行（触发器会忽略 Markdown 和 `docs/**` 路径），在非草稿拉取请求上运行（会忽略仅 CHANGELOG 的差异），也可通过手动调度运行。规范 `main` 推送首先经过 90 秒的托管 runner 准入窗口；当较新的提交落地时，`CI` 并发组会取消该等待中的运行，因此连续合并不会各自注册完整的 Blacksmith 矩阵。拉取请求和手动调度会跳过等待。随后 `preflight` 作业会对差异进行分类，并在只有无关区域发生变化时关闭昂贵的通道。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并展开完整图，用于候选发布版本和广泛验证。Android 通道仍通过 `include_android`（或 `release_gate` 输入）保持选择启用。仅发布使用的插件覆盖位于单独的 [`插件预发布`](#plugin-prerelease) 工作流中，并且只会从 [`完整发布验证`](#full-release-validation) 或显式手动调度运行。

## 流水线概览

| 作业                                | 目的                                                                                                                                                                                            | 运行时机                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 检测仅文档变更、已变更范围、已变更插件，并构建 CI 清单                                                                                                            | 始终在非草稿推送和 PR 上运行                  |
| `runner-admission`                 | 在注册 Blacksmith 工作之前，对规范 `main` 推送进行托管的 90 秒防抖                                                                                                         | 每次 CI 运行；仅在规范 `main` 推送时休眠 |
| `security-fast`                    | 私钥检测、通过 `zizmor` 进行的已变更工作流审计，以及生产 lockfile 审计                                                                                                          | 始终在非草稿推送和 PR 上运行                  |
| `pnpm-store-warmup`                | 预热由 lockfile 固定的 pnpm store 缓存，且不阻塞 Linux Node 分片                                                                                                                       | 选中 Node 或 docs-check 通道                   |
| `build-artifacts`                  | 构建 `dist/`、Control UI、已构建 CLI 冒烟检查、启动内存，以及嵌入式构建产物检查                                                                                              | Node 相关变更                               |
| `checks-fast-core`                 | 快速 Linux 正确性通道：内置 + 协议、QA Smoke CI、Bun 启动器，以及 CI 路由快速任务                                                                                          | Node 相关变更                               |
| `checks-fast-contracts-plugins-*`  | 两个加权插件契约分片                                                                                                                                                                | Node 相关变更                               |
| `checks-fast-contracts-channels-*` | 两个加权渠道契约分片                                                                                                                                                               | Node 相关变更                               |
| `checks-node-*`                    | 核心 Node 测试分片，不包括渠道、内置、契约和插件通道                                                                                                                   | Node 相关变更                               |
| `check-*`                          | 分片后的主本地门禁等价项：guards、shrinkwrap、内置渠道配置元数据、生产类型、lint、依赖项、测试类型                                                                | Node 相关变更                               |
| `check-additional-*`               | 边界检查条带（包括 prompt 快照漂移）、会话访问器/转录读取器边界、插件 lint 分组、包边界编译/canary，以及运行时拓扑架构 | Node 相关变更                               |
| `checks-node-compat-node22`        | Node 22 兼容性构建和冒烟通道                                                                                                                                                         | 发布用手动 CI 调度                     |
| `check-docs`                       | 文档格式化、lint 和断链检查                                                                                                                                                      | 文档已变更（PR 和手动调度）              |
| `native-i18n`                      | 原生应用、Android 和 Apple i18n 清单检查                                                                                                                                               | 原生 i18n 相关变更                        |
| `skills-python`                    | 针对 Python 支持的 Skills 执行 Ruff + pytest                                                                                                                                                             | Python Skill 相关变更                       |
| `checks-windows`                   | Windows 专用进程/路径测试，以及共享运行时 import specifier 回归                                                                                                               | Windows 相关变更                            |
| `macos-node`                       | 聚焦的 macOS TypeScript 测试：launchd、Homebrew、运行时路径、打包脚本、进程组包装器                                                                                         | macOS 相关变更                              |
| `macos-swift`                      | macOS 应用的 Swift lint、构建和测试                                                                                                                                                     | macOS 相关变更                              |
| `ios-build`                        | Xcode 项目生成以及 iOS 应用模拟器构建                                                                                                                                          | iOS 应用、共享应用套件或 Swabble 变更         |
| `android`                          | 两种 flavor 的 Android 单元测试，加上一个 debug APK 构建                                                                                                                                       | Android 相关变更                            |
| `test-performance-agent`           | 单独工作流：在可信活动后每日进行 Codex 慢测试优化                                                                                                                       | 主 CI 成功或手动调度                  |
| `openclaw-performance`             | 单独工作流：每日/按需生成 Kova 运行时性能报告，包含 mock-provider、deep-profile 和 GPT 5.5 live 通道                                                                       | 定时和手动调度                       |

## 快速失败顺序

1. `runner-admission` 仅等待规范 `main` 推送；较新的推送会在 Blacksmith 注册前取消该运行。
2. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内的步骤，而不是独立作业。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
4. `build-artifacts` 与快速 Linux 通道重叠运行，因此下游消费者可在共享构建就绪后立即开始。
5. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。

当较新的推送落在同一 PR 或 `main` ref 上时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。矩阵作业使用 `fail-fast: false`，并且 `build-artifacts` 会直接报告嵌入式渠道、core-support-boundary 和 gateway-watch 失败，而不是排队微型验证器作业。自动 CI 并发键已版本化（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸项无法无限期阻塞较新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，且不会取消正在进行的运行。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>` 可从 GitHub Actions 汇总墙钟时间、排队时间、最慢作业、失败项，以及 `pnpm-store-warmup` fanout 屏障。工作流内的 `ci-timings-summary` 作业存在于 `ci.yml` 中，但当前已禁用（`if: false`）；请改为在本地运行计时辅助工具。对于构建计时，请检查 `build-artifacts` 作业的 `Build dist` 步骤：`pnpm build:ci-artifacts` 会打印 `[build-all] phase timings:` 并包含 `ui:build`；该作业还会上传 `startup-memory` 产物。

## PR 上下文和证据

外部贡献者 PR 会运行来自 `.github/workflows/real-behavior-proof.yml` 的 PR 上下文和证据门禁。该工作流会检出可信工作流修订版（`github.workflow_sha`），并且只评估 PR 正文；它不会执行贡献者分支中的代码。

该门禁适用于不是仓库所有者、成员、协作者或 bot 的 PR 作者。当 PR 正文包含作者编写的 `What Problem This Solves` 和 `Evidence` 小节时，检查会通过。证据可以是聚焦测试、CI 结果、截图、录屏、终端输出、实时观察、已脱敏日志或产物链接。正文提供意图和有用的验证；评审者会检查代码、测试和 CI 来评估正确性。

当检查失败时，请更新 PR 正文，而不是再推送一个代码提交。

## 范围和路由

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动调度会跳过已变更范围检测，并让 preflight 清单表现得像每个限定范围的区域都已变更。

- **CI 工作流编辑**会验证 Node CI 图、工作流 lint 和 Windows 通道（由 `ci.yml` 执行），但本身不会强制执行 iOS、Android 或 macOS 原生构建；这些平台通道仍限定于平台源代码变更。
- **工作流完整性检查**会对所有工作流 YAML 文件运行 `actionlint`、`zizmor`、复合 action 插值保护以及冲突标记保护。PR 作用域的 `security-fast` 作业也会对已变更的工作流文件运行 `zizmor`，使工作流安全发现能在主 CI 图中尽早失败。
- **`main` 推送中的文档**由独立的 `Docs` 工作流检查，并使用与 CI 相同的 ClawHub 文档镜像，因此混合代码 + 文档推送不会再排队运行 CI 的 `check-docs` 分片。拉取请求和手动 CI 仍会在文档变更时从 CI 运行 `check-docs`。
- **TUI PTY** 会在 `checks-node-core-runtime-tui-pty` Linux Node 分片中针对 TUI 变更运行。该分片使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 运行 `test/vitest/vitest.tui-pty.config.ts`，因此同时覆盖确定性的 `TuiBackend` fixture 通道，以及较慢的 `tui --local` 冒烟测试，后者只模拟外部模型端点。
- **仅 CI 路由的编辑、快速任务直接运行的一小组核心测试 fixture，以及窄范围插件契约 helper 编辑**使用快速的仅 Node 清单路径：`preflight`、`security-fast`，以及变更触及的快速通道，也就是单个 `checks-fast-core` CI 路由任务、两个插件契约分片，或二者同时运行。该路径会跳过构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外保护矩阵。
- **Windows Node 检查**限定于 Windows 专用的进程/路径包装器、npm/pnpm/UI runner helper、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源代码、插件、安装冒烟和仅测试变更仍留在 Linux Node 通道上。

最慢的 Node 测试族会被拆分或均衡，使每个作业保持较小规模，同时不过度预留 runner：

- 插件契约和渠道契约各自作为两个加权的 Blacksmith 支撑分片运行，并带有标准 GitHub runner 回退。
- 核心单元快速/支持通道单独运行；核心运行时基础设施拆分为 process、shared、hooks、secrets 和三个 cron 领域分片。
- 自动回复作为均衡 worker 运行，reply 子树拆分为 agent-runner、commands、dispatch、session 和 state-routing 分片。
- Agentic gateway/server（控制平面）配置拆分到 chat、auth、model、HTTP/plugin、runtime 和 startup 通道，而不是等待构建产物。
- 普通 CI 只把隔离的基础设施 include-pattern 分片打包进最多 64 个测试文件的确定性 bundle，从而减少 Node 矩阵，同时不合并非隔离的 command/cron、有状态 agents-core 或 gateway/server 套件。重型固定套件仍使用 8 vCPU，而打包后和较低权重的通道使用 4 vCPU。
- 规范仓库上的拉取请求使用紧凑准入计划：相同的按配置分组会在隔离子进程中运行，目前是 18 个 Node 测试作业，而不是 74 个作业的完整矩阵。`main` 推送、手动调度和发布门禁保留完整矩阵。
- 广泛的浏览器、QA、媒体和杂项插件测试使用其专用 Vitest 配置，而不是共享插件 catch-all。Include-pattern 分片会使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。
- `check-additional-*` 会把补充边界保护列表（`scripts/run-additional-boundary-checks.mjs`）条带化为一个 prompt 密集型分片（`check-additional-boundaries-a`，其中包括 Codex prompt 快照漂移检查）和一个用于剩余条带的合并分片（`check-additional-boundaries-bcd`），每个分片都会并发运行独立保护并打印每项检查的计时。包边界编译/canary 工作保持在一起，运行时拓扑架构则与嵌入在 `build-artifacts` 中的 gateway watch 覆盖分开运行。
- Gateway watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内并发运行。

准入后，规范 Linux CI 最多允许 24 个并发 Node 测试作业，
较小的 fast/check 通道允许 12 个；Windows 和 Android 保持为两个，
因为这些 runner 池更窄。紧凑的完整配置批次使用
120 分钟批次超时，而 include-pattern 分组共享相同的有界
作业预算。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送中重复执行 debug APK 打包作业。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`（一个生产 Knip 仅依赖检查，固定到精确 Knip 版本，并为 `dlx` 安装禁用 pnpm 的最低发布时间限制）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现与 `scripts/deadcode-unused-files.allowlist.mjs` 对比，另有一个建议性的 `pnpm deadcode:report:ci:ts-unused` 报告作为 `deadcode-reports` artifact 上传。当 PR 添加新的未审查未使用文件，或留下陈旧 allowlist 条目时，未使用文件保护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、实时测试和包桥接表面。

## ClawSweeper 活动转发

`.github/workflows/clawsweeper-dispatch.yml` 是从 OpenClaw 仓库活动进入 ClawSweeper 的目标侧桥接。它不会检出或执行不受信任的拉取请求代码。该工作流会从 `CLAWSWEEPER_APP_PRIVATE_KEY` 创建 GitHub App 令牌，然后向 `openclaw/clawsweeper` 调度紧凑的 `repository_dispatch` 载荷。

该工作流有四个通道：

- `clawsweeper_item` 用于精确的问题和拉取请求审查请求；
- `clawsweeper_comment` 用于问题评论中的显式 ClawSweeper 命令；
- `clawsweeper_commit_review` 用于 `main` 推送上的提交级审查请求；
- `github_activity` 用于 ClawSweeper 智能体可能检查的一般 GitHub 活动。

`github_activity` 通道只转发规范化元数据：事件类型、操作、actor、仓库、条目编号、URL、标题、状态，以及存在评论或审查时的短摘录。它有意避免转发完整 webhook 正文。`openclaw/clawsweeper` 中的接收工作流是 `.github/workflows/github-activity.yml`，它会将规范化事件发布到 ClawSweeper 智能体的 OpenClaw Gateway 网关 hook。

一般活动是观察，而不是默认投递。ClawSweeper 智能体会在 prompt 中收到 Discord 目标，并且只应在事件令人意外、可操作、有风险或对运维有用时发布到 `#clawsweeper`。常规打开、编辑、机器人噪声、重复 webhook 噪声和普通审查流量应产生 `NO_REPLY`。

在整个路径中，将 GitHub 标题、评论、正文、审查文本、分支名称和提交消息视为不受信任的数据。它们是摘要和分诊的输入，而不是工作流或智能体运行时的指令。

## 手动调度

手动 CI 调度运行与普通 CI 相同的作业图，但会强制开启每个非 Android 作用域通道：Linux Node 分片、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建产物冒烟检查、文档检查、Python Skills、Windows、macOS、iOS 构建和 Control UI i18n。独立手动 CI 调度只有在 `include_android=true` 时才运行 Android（`release_gate` 输入也会强制 Android）；完整发布总括流程会通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布的 `agentic-plugins` 分片、完整 extension 批量扫查以及插件预发布 Docker 通道不包含在 CI 中。Docker 预发布套件只在 `Full Release Validation` 启用发布验证门禁并调度单独的 `Plugin Prerelease` 工作流时运行。

手动运行使用唯一的并发组，因此发布候选完整套件不会被同一 ref 上的另一项推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任的调用方在使用所选调度 ref 中的工作流文件时，针对分支、标签或完整提交 SHA 运行该图。`release_gate` 输入是一个用于容量受阻 PR CI 的精确 SHA 维护者回退：它要求 `target_ref` 是与被调度分支头匹配的完整提交 SHA。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

每月 npm-only extended-stable 路径是例外：从精确的
`extended-stable/YYYY.M.33` 分支同时调度 `OpenClaw NPM
Release` preflight 和 `Full Release Validation`，保留它们的运行 ID，并将两个 ID 都传给
直接 npm 发布运行。命令、精确身份要求、registry 回读和 selector
修复流程见 [Monthly npm-only extended-stable
publication](/zh-CN/reference/RELEASING#monthly-npm-only-extended-stable-publication)。
该路径不会调度插件、macOS、Windows、GitHub
Release、私有 dist-tag 或其他平台发布。

## Runners

| 运行器                          | 作业                                                                                                                                                                                                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手动 CI 调度和非规范仓库回退、CodeQL 安全和质量扫描、workflow-sanity、labeler、auto-response、独立的 Docs 工作流，以及整个 Install Smoke 工作流                                                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、`pnpm-store-warmup`、`native-i18n`、除 QA Smoke CI 外的 `checks-fast-core`、插件/渠道契约分片、大多数内置/较轻量的 Linux Node 分片、除 `check-lint` 外的 `check-*` 车道、选定的 `check-additional-*` 分片、`check-docs` 和 `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的重型 Linux Node 套件、边界/扩展密集型 `check-additional-*` 分片，以及 `android`                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI、CI 和 Testbox 中的 `build-artifacts`，以及 `check-lint`（对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省的收益）                                                                                                                                                                    |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                   |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；fork 回退到 `macos-15`                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 和 `ios-build`；fork 回退到 `macos-26`                                                                                                                                                                                                                |

## 运行器注册预算

OpenClaw 当前的 GitHub 运行器注册桶在 `ghx api rate_limit` 中报告为每 5 分钟 10,000 次自托管运行器注册。每次调优前重新检查 `actions_runner_registration`，因为 GitHub 可能会更改这个桶。该限制由 `openclaw` 组织中的所有 Blacksmith 运行器注册共享，因此添加另一个 Blacksmith 安装不会增加新的桶。

将 Blacksmith 标签视为突发控制的稀缺资源。仅用于路由、通知、汇总、选择分片或运行短 CodeQL 扫描的作业，应继续留在 GitHub 托管运行器上，除非它们有经过测量的 Blacksmith 特定需求。任何新的 Blacksmith 矩阵、更大的 `max-parallel` 或高频工作流都必须展示其最坏情况下的注册计数，并将组织级目标保持在实时桶的大约 60% 以下。按当前 10,000 次注册的桶计算，这意味着 6,000 次注册的运行目标，为并发仓库、重试和突发重叠留出余量。

规范仓库 CI 将 Blacksmith 保持为普通 push 和 pull-request 运行的默认运行器路径。`workflow_dispatch` 和非规范仓库运行使用 GitHub 托管运行器，但普通规范运行目前不会探测 Blacksmith 队列健康，也不会在 Blacksmith 不可用时自动回退到 GitHub 托管标签。

## 本地等价命令

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

## OpenClaw 性能

`OpenClaw Performance` 是产品/运行时性能工作流。它每天在 `main` 上运行，也可以手动调度：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手动调度通常对工作流 ref 做基准测试。设置 `target_ref` 可使用当前工作流实现对发布标签或其他分支做基准测试。已发布的报告路径和 latest 指针按被测试的 ref 建立键，并且每个 `index.md` 都记录被测试的 ref/SHA、工作流 ref/SHA、Kova ref、profile、车道认证模式、模型、重复次数和场景过滤器。

该工作流从固定发布版安装 OCM，并从 `openclaw/Kova` 在固定的 `kova_ref` 输入处安装 Kova，然后运行三条车道：

- `mock-provider`：针对本地构建运行时、使用确定性的假 OpenAI 兼容认证运行 Kova 诊断场景。
- `mock-deep-profile`：针对启动、Gateway 网关和智能体轮次热点的 CPU/heap/trace 性能分析。按计划运行，或在调度时设置 `deep_profile=true` 运行。
- `live-openai-candidate`：一次真实的 OpenAI `openai/gpt-5.5` 智能体轮次，在 `OPENAI_API_KEY` 不可用时跳过。按计划运行，或在调度时设置 `live_openai_candidate=true` 运行。

`mock-provider` 车道还会在 Kova 通过后运行 OpenClaw 原生源码探针：默认、跳过渠道、内部钩子和五十插件启动场景下的 Gateway 网关启动耗时和内存；内置插件导入 RSS；重复的模拟 OpenAI `channel-chat-baseline` hello 循环；针对已启动 Gateway 网关的 CLI 启动命令；以及 SQLite 状态冒烟性能探针。当被测试 ref 的上一份已发布 mock-provider 源码报告可用时，源码摘要会将当前 RSS 和 heap 值与该基线比较，并将较大的 RSS 增长标记为 `watch`。源码探针 Markdown 摘要位于报告 bundle 中的 `source/index.md`，原始 JSON 位于旁边。

每条车道都会上传 GitHub artifacts。配置 `CLAWGRIT_REPORTS_TOKEN` 时，该工作流还会将 `report.json`、`report.md`、bundle、`index.md` 和源码探针 artifacts 提交到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 下。当前被测试 ref 指针写为 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整发布验证

`Full Release Validation` 是“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整 commit SHA，使用该目标调度手动 `CI` 工作流（包括 Android），调度 `Plugin Prerelease` 以提供仅发布用的插件/包/静态/Docker 证明，针对目标 SHA 调度 `OpenClaw Performance`，并调度 `OpenClaw Release Checks` 以运行安装冒烟、包验收、跨 OS 包检查、QA Lab 对齐、Matrix 和 Telegram 车道（顾问性质的成熟度评分卡渲染可通过 `run_maturity_scorecard` 选择启用）。stable 和 full profile 始终包含详尽的 live/E2E 和 Docker 发布路径 soak 覆盖；beta profile 可以通过 `run_release_soak=true` 选择启用。规范包 Telegram E2E 在 Package Acceptance 内运行，因此完整候选版本不会启动重复的 live poller。发布后，传入 `release_package_spec` 可在发布检查、Package Acceptance、Docker、跨 OS 和 Telegram 中复用已发布的 npm 包，而无需重新构建。仅将 `npm_telegram_package_spec` 用于聚焦的已发布包 Telegram 重跑。Codex 插件 live 包车道默认使用同一个选定状态：已发布的 `release_package_spec=openclaw@<tag>` 会派生 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA/artifact 运行会从选定 ref 打包 `extensions/codex`。对于自定义插件来源，例如 `npm:`、`npm-pack:` 或 `git:` spec，请显式设置 `codex_plugin_spec`。

请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解阶段矩阵、确切的工作流作业名称、profile 差异、artifacts 和聚焦重跑句柄。

`OpenClaw Release Publish` 是手动的变更型发布工作流。在发布标签已存在且 OpenClaw npm 预检已成功后，从 `release/YYYY.M.PATCH` 或 `main` 调度它（预检会在其检查中运行 `pnpm plugins:sync:check`）。它需要已保存的 `preflight_run_id` 和成功的 `full_release_validation_run_id`，会为所有可发布插件包调度 `Plugin NPM Release`，为同一发布 SHA 调度 `Plugin ClawHub Release`，然后才调度 `OpenClaw NPM Release`。stable 发布还需要精确的 `windows_node_tag`；该工作流会验证 Windows 源发布，并在任何发布子流程前，将其 x64/ARM64 安装程序与候选版本已批准的 `windows_node_installer_digests` 输入进行比较，然后在发布 GitHub 发布草稿前，提升并验证这些相同的固定安装程序摘要，以及精确的配套资产和 checksum 契约。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

对于快速移动分支上的固定 commit 证明，请使用 helper，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs 必须是分支或标签，不能是原始 commit SHA。该 helper 会在目标 SHA 上推送一个临时 `release-ci/<sha>-...` 分支，从这个固定 ref 调度 `Full Release Validation`，验证每个子 workflow 的 `headSha` 都与目标匹配，并在运行完成后删除临时分支。如果任何子 workflow 在不同的 SHA 上运行，umbrella verifier 也会失败。

`release_profile` 控制传递给发布检查的 live/provider 覆盖范围。手动发布 workflow 默认使用 `stable`；仅在你有意需要广泛的 advisory provider/media 矩阵时才使用 `full`。Stable 和 full 发布检查始终运行详尽的 live/E2E 与 Docker 发布路径 soak；beta profile 可以通过 `run_release_soak=true` 选择加入。

- `minimum` 保留最快的 OpenAI/core 发布关键 lane。
- `stable` 增加 stable provider/backend 集合。
- `full` 运行广泛的 advisory provider/media 矩阵。

umbrella 会记录已调度的子 run id，最终的 `Verify full validation` job 会重新检查当前子 run 结论，并为每个子 run 追加最慢 job 表。如果某个子 workflow 重新运行后变绿，只需重新运行父 verifier job，以刷新 umbrella 结果和耗时摘要。

恢复时，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选使用 `all`，仅普通 full CI 子项使用 `ci`，仅插件预发布子项使用 `plugin-prerelease`，仅 OpenClaw Performance 子项使用 `performance`，每个发布子项使用 `release-checks`，或在 umbrella 上使用更窄的组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在聚焦修复后，将失败的 release box 重跑限制在有界范围内。对于单个失败的 cross-OS lane，将 `rerun_group=cross-os` 与 `cross_os_suite_filter` 组合使用，例如 `windows/packaged-upgrade`；长时间运行的 cross-OS 命令会发出 heartbeat 行，packaged-upgrade 摘要包含每阶段耗时。QA 发布检查 lane 是 advisory，标准 runtime tool 覆盖 gate 除外；当必需的 OpenClaw dynamic tools 从 standard tier 摘要中漂移或消失时，该 gate 会阻塞。

`OpenClaw Release Checks` 使用受信任的 workflow ref 将所选 ref 解析一次为 `release-package-under-test` tarball，然后将该 artifact 传递给 cross-OS 检查和 Package Acceptance，以及在运行 soak 覆盖时传递给 live/E2E 发布路径 Docker workflow。这样可以确保不同 release box 使用一致的 package bytes，并避免在多个子 job 中重复打包同一个候选版本。对于 Codex npm-plugin live lane，发布检查会传递一个从 `release_package_spec` 派生出的匹配已发布插件 spec，传递操作员提供的 `codex_plugin_spec`，或留空输入，使 Docker 脚本打包所选 checkout 的 Codex plugin。

对于 `ref=main` 和 `rerun_group=all` 的重复 `Full Release Validation` 运行会取代较旧的 umbrella。当父运行被取消时，父 monitor 会取消它已经调度的任何子 workflow，因此较新的 main 验证不会排在过时的两小时 release-check run 后面。发布分支/标签验证和聚焦 rerun group 保持 `cancel-in-progress: false`。

## Live 和 E2E shard

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以命名 shard 运行，而不是一个串行 job：

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
- 拆分的 media audio/video shard，以及 provider-filtered music shard

这保持了相同的文件覆盖，同时让较慢的 live provider 失败更容易重跑和诊断。聚合的 `native-live-src-gateway`、`native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` shard 名称仍可用于手动一次性重跑。

原生 live media shard 在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` workflow 构建。该镜像预安装 `ffmpeg` 和 `ffprobe`；media job 只会在设置前验证这些二进制文件。将 Docker-backed live suite 保持在普通 Blacksmith runner 上，container job 不适合启动嵌套 Docker 测试。

Docker-backed live model/backend shard 为每个所选 commit 使用单独共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` 镜像。live 发布 workflow 会构建并推送该镜像一次，然后 Docker live model、provider-sharded gateway、CLI backend、ACP bind 和 Codex harness shard 使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway 网关 Docker shard 带有明确的脚本级 `timeout` 上限，低于 workflow job timeout，因此卡住的容器或清理路径会快速失败，而不是耗尽整个 release-check 预算。如果这些 shard 独立重建完整 source Docker target，则说明发布运行配置错误，并会在重复镜像构建上浪费 wall clock。

## Package Acceptance

当问题是“这个可安装的 OpenClaw package 是否能作为产品工作？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证 source tree，而 package acceptance 通过用户安装或更新后会执行的同一个 Docker E2E harness 验证单个 tarball。

### Jobs

1. `resolve_package` checkout `workflow_ref`，解析一个 package 候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` artifact 上传，并在 GitHub step summary 中打印 source、workflow ref、package ref、version、SHA-256 和 profile。
2. `package_integrity` 下载 `package-under-test` artifact，并使用 `scripts/check-openclaw-package-tarball.mjs` 强制执行公开 package tarball contract。
3. `docker_acceptance` 使用已解析的 package source SHA（回退到 `workflow_ref`）和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用 workflow 会下载该 artifact、验证 tarball inventory、在需要时准备 package-digest Docker 镜像，并针对该 package 运行所选 Docker lane，而不是打包 workflow checkout。当一个 profile 选择多个定向 `docker_lanes` 时，可复用 workflow 会准备 package 和共享镜像一次，然后将这些 lane 扇出为并行定向 Docker job，并使用唯一 artifact。
4. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行，并在 Package Acceptance 解析出一个 package 时安装同一个 `package-under-test` artifact；独立 Telegram dispatch 仍可安装已发布的 npm spec。
5. 如果 package 解析、完整性、Docker acceptance 或可选 Telegram lane 失败，`summary` 会使 workflow 失败。`advisory` 输入会将 acceptance 失败降级为 advisory caller 的警告。

### 候选来源

- `source=npm` 仅接受 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布的 extended-stable、prerelease 或 stable acceptance。
- `source=ref` 打包受信任的 `package_ref` 分支、标签或完整 commit SHA。resolver 会 fetch OpenClaw 分支/标签，验证所选 commit 可从 repository branch history 或 release tag 访问，在 detached worktree 中安装 deps，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载公开 HTTPS `.tgz`；必须提供 `package_sha256`。此路径会拒绝 URL credentials、非默认 HTTPS 端口、private/internal/special-use hostname 或解析后的 IP，以及跳转到同一公开安全策略之外的 redirect。
- `source=trusted-url` 从 `.github/package-trusted-sources.json` 中具名 trusted-source policy 下载 HTTPS `.tgz`；必须提供 `package_sha256` 和 `trusted_source_id`。仅将其用于需要已配置 hosts、ports、path prefixes、redirect hosts 或 private-network resolution 的 maintainer-owned enterprise mirror 或 private package repository。如果 policy 声明 bearer auth，workflow 会使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret；仍会拒绝嵌入 URL 的 credentials。
- `source=artifact` 从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但应为外部共享 artifact 提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任 workflow/harness code。`package_ref` 是 `source=ref` 时被打包的 source commit。这样当前 test harness 可以验证较旧的受信任 source commit，而无需运行旧 workflow logic。

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`root-managed-vps-upgrade`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `package` 集合，但用 live `plugins` 覆盖替代 `plugins-offline`，再加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 带 OpenWebUI 的完整 Docker 发布路径 chunk
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

`package` profile 使用 offline plugin 覆盖，因此已发布 package 验证不会受 live ClawHub 可用性限制。可选 Telegram lane 在 `NPM Telegram Beta E2E` 中复用 `package-under-test` artifact，同时为独立 dispatch 保留已发布 npm spec 路径。

关于专用的更新和插件测试策略，包括本地命令、Docker lane、Package Acceptance 输入、发布默认值和失败分流，请参阅 [更新和插件测试](/zh-CN/help/testing-updates-plugins)。

发布检查会使用 `source=artifact`、准备好的 release package artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。这样 package 迁移、更新、live ClawHub skill install、stale-plugin-dependency cleanup、configured-plugin install repair、offline plugin、plugin-update 和 Telegram proof 都会基于同一个已解析 package tarball。发布 beta 后，在 Full Release Validation 或 OpenClaw Release Checks 上设置 `release_package_spec`，即可在不重新构建的情况下针对已发布 npm package 运行同一矩阵；仅当 Package Acceptance 需要与其余发布验证不同的 package 时，才设置 `package_acceptance_package_spec`。Cross-OS 发布检查仍覆盖特定 OS 的 onboarding、installer 和 platform 行为；package/update 产品验证应从 Package Acceptance 开始。

`published-upgrade-survivor` Docker 通道会在阻塞发布路径中，每次运行验证一个已发布包基线。在包验收中，解析出的 `package-under-test` tarball 始终是候选包，而 `published_upgrade_survivor_baseline` 选择兜底的已发布基线，默认是 `openclaw@latest`；失败通道的重跑命令会保留该基线。启用 `run_release_soak=true` 或 `release_profile=full` 的完整发布验证会设置 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，从而扩展到最新四个稳定 npm 版本，再加上固定的插件兼容性边界版本，以及面向问题的夹具，覆盖 Feishu 配置、保留的 bootstrap/persona 文件、已配置的 OpenClaw 插件安装、波浪号日志路径和过时的旧版插件依赖根。多基线 published-upgrade survivor 选择会按基线分片到单独的定向 Docker 运行器作业中。单独的 `Update Migration` 工作流会在问题是彻底清理已发布更新，而不是普通完整发布 CI 覆盖面时，使用带有 `all-since-2026.4.23` 基线和 `plugin-deps-cleanup` 场景的 `update-migration` Docker 通道。本地聚合运行可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传入精确包规格，也可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持单个通道，例如 `openclaw@2026.4.15`，或设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 来配置场景矩阵。已发布通道会使用内置的 `openclaw config set` 命令配方配置基线，在 `summary.json` 中记录配方步骤，并在 Gateway 网关启动后探测 `/healthz`、`/readyz` 和 RPC 状态。Windows 打包和安装器全新安装通道还会验证已安装包能否从原始绝对 Windows 路径导入 browser-control 覆盖。OpenAI 跨 OS Agent 轮次冒烟测试在设置了 `OPENCLAW_CROSS_OS_OPENAI_MODEL` 时默认使用该值，否则使用 `openai/gpt-5.5`，因此安装和 Gateway 网关证明会保持在 GPT-5 测试模型上，同时避免 GPT-4.x 默认值。

### 旧版兼容窗口

包验收针对已发布包提供有界的旧版兼容窗口。直到 `2026.4.25` 的包，包括 `2026.4.25-beta.*`，可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可以指向 tarball 省略的文件；
- 当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过该持久化子用例；
- `update-channel-switch` 可以从 tarball 派生的假 git 夹具中修剪缺失的 pnpm `patchedDependencies`，并可以记录缺失的持久化 `update.channel`；
- 插件冒烟测试可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和无重装行为保持不变。

已发布的 `2026.4.26` 包也可以对已发布的本地构建元数据戳文件发出警告，而直到 `2026.5.20` 的包可以在缺少 `npm-shrinkwrap.json` 时警告而不是失败。之后的包必须满足现代合约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，先查看 `resolve_package` 摘要，以确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 构件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重跑命令。优先重跑失败的包配置文件或精确 Docker 通道，而不是重跑完整发布验证。

## 安装冒烟测试

单独的 `Install Smoke` 工作流不再在 pull request 或 `main` 推送上运行。它会按 nightly 计划、手动分发以及作为发布验证中的工作流调用运行，并且每次运行都会在 GitHub 托管运行器上执行完整 install-smoke 路径：

- 根 Dockerfile 冒烟镜像会为每个目标 SHA 构建一次（或从 GHCR 复用为 `ghcr.io/openclaw/openclaw-dockerfile-smoke:<sha>`），随后 CLI 冒烟测试、agents 删除 shared-workspace CLI 冒烟测试、容器 gateway-network E2E，以及内置 `matrix` 插件 build-arg 冒烟测试都会针对该镜像运行。插件冒烟测试会验证运行时依赖安装镜像，并验证插件加载时没有 entry-escape 诊断。
- QR 包安装和安装器/更新 Docker 冒烟测试（包括 Rocky Linux 安装器通道，以及针对可配置 `update_baseline_version` npm 基线的更新通道）作为单独作业运行，因此安装器工作不会排在根镜像冒烟测试之后等待。

较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独控制。它会在 nightly 计划中运行，在来自发布检查的工作流调用中默认开启，手动 `Install Smoke` 分发也可以选择启用。普通 PR CI 仍会针对 Node 相关变更运行快速 Bun 启动器回归通道。QR 和安装器 Docker 测试会保留各自专注安装的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享 `scripts/e2e/Dockerfile` 镜像：

- 一个用于安装器/更新/插件依赖通道的裸 Node/Git 运行器；
- 一个功能镜像，将同一个 tarball 安装到 `/app` 中，用于普通功能通道。

Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行选定计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道。

### 可调参数

| 变量                                   | 默认值  | 目的                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 普通通道的主池槽位数量。                                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 对提供商敏感的尾池槽位数量。                                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发 live 通道上限，避免提供商限流。                                                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 并发 npm 安装通道上限。                                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务通道上限。                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 通道启动之间的错峰时间，用于避免 Docker daemon 创建风暴；设置为 `0` 表示不使用错峰。          |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每通道兜底超时（120 分钟）；选定的 live/tail 通道使用更紧的上限。                             |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未设置  | `1` 会打印调度器计划，而不运行通道。                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未设置  | 逗号分隔的精确通道列表；跳过清理冒烟测试，以便 agents 复现单个失败通道。                     |

如果某个通道重于其有效上限，它仍可以从空池启动，然后独占运行，直到释放容量。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活动通道状态，持久化通道耗时以便按最长优先排序，并默认在首次失败后停止调度新的池化通道。

### 可复用 live/E2E 工作流

可复用 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪个包、镜像类型、live 镜像、通道和凭证覆盖。随后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包构件，或从 `package_artifact_run_id` 下载包构件；验证 tarball 清单；当计划需要已安装包的通道时，通过 Blacksmith 的 Docker layer cache 构建并推送带有包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。Docker 镜像拉取会使用有界的 180 秒单次尝试超时进行重试，因此卡住的 registry/cache 流会快速重试，而不是消耗大部分 CI 关键路径时间。

### 发布路径分块

发布 Docker 覆盖以较小的分块作业运行，并使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取所需的镜像类型，并通过同一个加权调度器执行多个通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

当前发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及从 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`package-update-openai` 包含 live Codex 插件包通道，该通道会安装候选 OpenClaw 包，从 `codex_plugin_spec` 安装 Codex 插件或使用显式 Codex CLI 安装批准安装同 ref tarball，运行 Codex CLI 预检，然后针对 OpenAI 运行多个同会话 OpenClaw Agent 轮次。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合插件/运行时别名。`install-e2e` 通道别名仍是两个提供商安装器通道的聚合手动重跑别名。

OpenWebUI 会在完整发布路径覆盖请求需要时并入 `plugins-runtime-services`，并且仅针对 OpenWebUI 专用分发保留独立的 `openwebui` 分块。内置渠道更新通道会针对短暂的 npm 网络故障重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、计时、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON、慢通道表，以及每通道重新运行命令。工作流 `docker_lanes` 输入会针对已准备好的镜像运行所选通道，而不是运行分块作业，这会将失败通道调试限制在一个有针对性的 Docker 作业内，并为该运行准备、下载或复用包构件；如果所选通道是实时 Docker 通道，目标作业会在本地为该次重新运行构建实时测试镜像。生成的每通道 GitHub 重新运行命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败通道可以复用失败运行中的确切包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

定时的实时/E2E 工作流每天运行完整发布路径 Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个单独的工作流，由 `Full Release Validation` 或显式操作员分发触发。普通拉取请求、`main` 推送和独立的手动 CI 分发都会关闭该套件。它会在八个扩展工作器之间平衡内置插件测试；这些扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest 工作器和更大的 Node 堆，这样导入密集型插件批次就不会创建额外的 CI 作业。仅发布使用的 Docker 预发布路径（由 `full_release_validation` 输入启用）会按四个一组批处理目标 Docker 通道，以避免为一到三分钟的作业预留数十个运行器。该工作流还会从 `@openclaw/plugin-inspector` 上传一个信息性 `plugin-inspector-advisory` 构件；检查器发现是分诊输入，不会改变阻塞性的 Plugin Prerelease 门禁。

## QA Lab

QA Lab 在主智能作用域工作流之外有专用 CI 通道。智能体一致性嵌套在广义 QA 和发布 harness 下，而不是独立的 PR 工作流。当一致性应随广义验证运行一起执行时，使用 `Full Release Validation` 并设置 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也会在手动分发时运行；它会将模拟一致性通道、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道作为并行作业展开。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。

发布检查使用确定性的模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，因此渠道契约会与实时模型延迟和普通提供商插件启动隔离。实时传输 Gateway 网关会禁用记忆搜索，因为 QA 一致性会单独覆盖记忆行为；提供商连接性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 会对定时和发布门禁使用 `--profile fast`，仅在检出的 CLI 支持时添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分发始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 也会在发布审批前运行发布关键的 QA Lab 通道；其 QA 一致性门禁会将候选包和基线包作为并行通道作业运行，然后将两个构件下载到一个小型报告作业中，用于最终一致性比较。

对于普通 PR，请遵循作用域化 CI/检查证据，而不是将一致性视为必需状态。

## CodeQL

`CodeQL` 工作流刻意作为范围较窄的第一轮安全扫描器，而不是完整仓库扫描。每日、手动、`main` 推送和非草稿拉取请求守卫运行会扫描 Actions 工作流代码，以及最高风险的 JavaScript/TypeScript 表面，并使用筛选到高/关键 `security-severity` 的高置信度安全查询。

拉取请求守卫保持轻量：它只会在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src` 或拥有进程的内置插件运行时路径下发生变更时启动，并运行与定时工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不包含在 PR 默认项中。

### 安全类别

| 类别                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 凭证、密钥、沙箱、cron 和 Gateway 网关基线                                                                                          |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥、审计接触点                                                      |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络守卫、网页获取，以及插件 SDK SSRF 策略表面                                                                  |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助函数、出站投递，以及智能体工具执行门禁                                                                      |
| `/codeql-security-high/process-exec-boundary`     | 本地 shell、进程派生辅助函数、拥有子进程的内置插件运行时，以及工作流脚本粘合代码                                                    |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、清单、注册表、包管理器安装、源码加载，以及插件 SDK 包契约信任表面                                                 |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 定时 Android 安全分片。在工作流完整性检查接受的最小 Blacksmith Linux 运行器上，为 CodeQL 手动构建 Android 应用。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并上传到 `/codeql-critical-security/macos` 下。它保留在每日默认项之外，因为即使结果干净，macOS 构建也会主导运行时间。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它仅在狭窄的高价值表面上运行错误严重性、非安全 JavaScript/TypeScript 质量查询，并使用 GitHub 托管的 Linux 运行器，这样质量扫描就不会消耗 Blacksmith 运行器注册预算。它的拉取请求守卫刻意小于定时配置：非草稿 PR 只运行与其触及表面匹配的分片，来自十三个可由 PR 路由的分片：`agent-runtime-boundary`、`channel-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`memory-runtime-boundary`、`network-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime`、`provider-runtime-boundary` 和 `session-diagnostics-boundary`。`ui-control-plane` 和 `web-media-runtime-boundary` 不会进入 PR 运行。CodeQL 配置和质量工作流变更会运行完整 PR 分片集（网络运行时分片会基于自身的 CodeQL 配置文件和网络所有者源码路径触发）。

手动分发接受：

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

窄配置是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 表面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 认证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                               |
| `/codeql-critical-quality/config-boundary`              | 配置 schema、迁移、规范化和 IO 契约                                                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议 schema 和服务器方法契约                                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约                                                                                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥、进程监督辅助工具，以及出站投递契约                                                                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆宿主 SDK、记忆运行时 facade、记忆插件 SDK 别名、记忆运行时激活粘合层，以及记忆 Doctor 命令                                                                   |
| `/codeql-critical-quality/network-runtime-boundary`     | 网络策略包、原始套接字和代理捕获运行时、SSH 隧道、Gateway 网关锁、JSONL 套接字，以及推送传输表面                                                                |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递辅助工具、诊断事件/日志包表面，以及会话 Doctor CLI 契约                                                        |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复载荷/分块/运行时辅助工具、渠道回复选项、投递队列，以及会话/线程绑定辅助工具                                                          |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商认证和设备发现、提供商运行时注册、提供商默认值/目录，以及 Web/搜索/抓取/嵌入注册表                                                        |
| `/codeql-critical-quality/ui-control-plane`             | Control UI 引导、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 Web 抓取/搜索、媒体 IO、媒体理解、图像生成，以及媒体生成运行时契约                                                                                          |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公共表面和插件 SDK 入口点契约                                                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧插件 SDK 源码和插件包契约辅助工具                                                                                                                      |

质量与安全保持分离，这样质量发现就可以在不掩盖安全信号的情况下被排期、度量、禁用或扩展。Swift、Python 和内置插件 CodeQL 扩展只应在窄配置具备稳定运行时和信号后，作为有范围或分片的后续工作加回。

## 维护工作流

### 文档 Agent

`Docs Agent` 工作流是事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时计划：`main` 上一次成功的非机器人推送 CI 运行可以触发它，手动派发也可以直接运行它。当 `main` 已经继续前进，或过去一小时内已创建另一个未跳过的 Docs Agent 运行时，工作流运行调用会跳过。运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上一次文档处理以来累积的所有 main 变更。

### 测试性能 Agent

`Test Performance Agent` 工作流是事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上一次成功的非机器人推送 CI 运行可以触发它，但如果另一个工作流运行调用在该 UTC 日期已经运行或正在运行，它会跳过。手动派发会绕过这个每日活动闸门。该通道构建完整套件分组 Vitest 性能报告，让 Codex 只做小型、保留覆盖率的测试性能修复，而不是大范围重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。分组报告记录 Linux 和 macOS 上每个配置的墙钟时间和最大 RSS，因此前后对比会在持续时间变化旁边呈现测试内存变化。如果基线存在失败测试，Codex 只能修复明显失败，并且 Agent 之后的完整套件报告必须通过，才能提交任何内容。当 `main` 在机器人推送落地前前进时，该通道会对已验证补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是用于落地后重复项清理的手动维护者工作流。它默认 dry-run，且只有在 `apply=true` 时才关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地 PR 已合并，并验证每个重复项要么有共享的引用 issue，要么有重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查闸门和变更路由

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查闸门对架构边界的要求比宽泛的 CI 平台范围更严格：

- 核心生产变更会运行核心生产和核心测试类型检查，以及核心 lint/guard；
- 仅核心测试变更只运行核心测试类型检查和核心 lint；
- 扩展生产变更会运行扩展生产和扩展测试类型检查，以及扩展 lint；
- 仅扩展测试变更会运行扩展测试类型检查和扩展 lint；
- 公共插件 SDK 或插件契约变更会扩展到扩展类型检查，因为扩展依赖这些核心契约（Vitest 扩展扫测仍然是显式测试工作）；
- 仅发布元数据的版本 bump 会运行定向版本/配置/根依赖检查；
- 未知的根/配置变更会 fail safe 到所有检查通道。

本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更轻量：直接测试编辑会运行自身，源码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享群组聊天室投递配置是显式映射之一：对群组可见回复配置、源回复投递模式或消息工具系统提示词的变更，会路由到核心回复测试以及 Discord 和 Slack 投递回归测试，因此共享默认值变更会在第一次 PR 推送前失败。只有当变更足够影响整个 harness，导致廉价映射集合不是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

Crabbox 是仓库自有的远程机器包装器，用于维护者 Linux 证明。Agent
会话默认用它执行测试和计算密集型工作，
包括构建、类型检查、lint 扇出、Docker、包通道、E2E、live
证明和 CI 对齐。可信维护者代码默认使用
`blacksmith-testbox`，而 `.crabbox.yaml` 现在也默认使用它。它配置的
工作流会注入提供商和 Agent 凭证，因此不可信贡献者或
fork 代码必须改用无密钥 fork CI 或经过净化的直接 AWS Crabbox。
经过净化的 AWS 运行会设置 `CRABBOX_ENV_ALLOW=CI`，传入
`--no-hydrate`，并使用全新的临时远程 `HOME`；这会阻止仓库
`OPENCLAW_*` allowlist 和现有认证 profile 触达不可信代码。
它们使用新预热、专用于该不可信来源的租约，绝不使用
可信或此前已注入凭证的租约。从干净的可信 `main` checkout 启动已安装的可信 Crabbox
二进制文件，并且只用 `--fresh-pr` 抓取远程 PR；绝不要在本地执行不可信 checkout 的包装器或配置。
取消设置 `CRABBOX_AWS_INSTANCE_PROFILE`，并且除非解析出的
`aws.instanceProfile` 为空，否则 fail closed。在任何安装/测试之前，使用可信
绝对路径工具要求 IMDSv2 token，证明 IAM 凭证
端点返回 404，并将远程 `git rev-parse HEAD` 与完整的
已审查 PR head SHA 进行比较。将租约绑定到该 SHA，并在 head 变化时停止/重新预热。
从干净的 `main` 上传可信 `scripts/crabbox-untrusted-bootstrap.sh`，
并与 `--fresh-pr` 一起使用；它会安装固定版本的 Node/pnpm，验证 SHA 和
包管理器 pin，隔离 `HOME`，安装依赖，然后执行
请求的测试。
取消设置所有 `CRABBOX_TAILSCALE*` 覆盖，强制使用 `--network public
--tailscale=false`，清除 exit-node/LAN 标志，并要求 `crabbox inspect` 在上传任何脚本前
报告公共网络且没有 Tailscale 状态。
自有 AWS/Hetzner 容量也仍然是 Blacksmith 故障、
配额问题或显式自有容量测试的 fallback。

在很可能需要测试或重型证明的可信代码任务开始时，Agent
应立即在后台命令会话中预热，在注入凭证运行期间继续
检查和编辑，复用返回的 `tbx_...` id，
每次运行都同步当前 checkout，并在交接前停止它：

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Crabbox 支撑的 Blacksmith 运行会预热、认领、同步、运行、报告并清理
一次性 Testbox。内置同步完整性检查会在同步后的机器上
`git status --short` 显示至少 200 个已跟踪删除时快速失败，
这能捕获 `pnpm-lock.yaml` 等根文件消失的情况。对于有意的大规模删除 PR，
为远程命令设置 `CRABBOX_ALLOW_MASS_DELETIONS=1`。

如果本地 Blacksmith CLI 调用停留在
同步阶段超过五分钟且没有同步后输出，Crabbox 也会终止它。设置
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可禁用该 guard，或为异常大的本地 diff 使用更大的
毫秒值。

第一次运行前，从仓库根目录检查包装器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

仓库包装器会拒绝未公布所选提供商的过期 Crabbox 二进制文件；Blacksmith 支撑的运行要求 Crabbox 0.22.0 或更新版本，以便包装器获得当前的 Testbox 同步、队列和清理行为。在 Codex worktree 或 linked/sparse checkout 中，避免使用本地 `pnpm crabbox:run` 脚本，因为 pnpm 可能会在 Crabbox 启动前协调依赖；请改为直接调用 node 包装器：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

使用同级 checkout 时，在计时或证明工作前重新构建被忽略的本地二进制文件：

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

读取最终的 JSON 摘要。有用字段是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。对于委派的 Blacksmith Testbox 运行，Crabbox 包装器退出码和 JSON 摘要就是命令结果。关联的 GitHub Actions 运行负责水合和保活；当 SSH 命令已经返回后 Testbox 被外部停止时，它可能以 `cancelled` 结束。除非包装器的 `exitCode` 非零，或者命令输出显示测试失败，否则将其视为清理/状态工件。一次性 Blacksmith 支持的 Crabbox 运行应自动停止 Testbox；如果运行被中断或清理状态不明确，请检查实时 box，并且只停止你创建的 box：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

仅当你有意需要在同一个已水合 box 上运行多个命令时才使用复用：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

复用租约，而不是陈旧源码。省略 `--no-sync`，让每次运行都上传当前 checkout；只有在有意重跑未变更且已同步的树时才使用它。不受信任的贡献者/fork 代码必须对每个命令使用 `CRABBOX_ENV_ALLOW=CI`、`--provider aws --no-hydrate` 和全新的临时远程 `HOME`；在测试前，在该已清理命令中安装依赖。只复用专用于同一不受信任源码的新预热租约；绝不要复用受信任或先前已水合的租约。绝不要在本地执行不受信任 checkout 的包装器或配置：从干净受信任的 `main` 启动已安装的受信任 Crabbox 二进制文件，并在每次运行时传入 `--fresh-pr`。保持 `CRABBOX_AWS_INSTANCE_PROFILE` 未设置，拒绝非空的已解析 instance profile，要求受信任远程 IMDS 无角色证明，并在安装/测试前验证已审查的 head SHA。将租约绑定到该 SHA；任何 head 变更后都停止并重新预热。如果不存在远程 PR，请使用无密钥 fork CI。绝不要为不受信任源码选择 `hydrate-github` 或凭证水合的 Blacksmith workflow。

如果 Crabbox 是损坏层，但 Blacksmith 本身可用，则仅将直接 Blacksmith 用于 `list`、`status` 和清理等诊断。在将直接 Blacksmith 运行视为维护者证明之前，先修复 Crabbox 路径。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可用，但新的预热在几分钟后仍处于 `queued` 且没有 IP 或 Actions 运行 URL，则将其视为 Blacksmith 提供商、队列、账单或组织限制压力。停止你创建的 queued id，避免启动更多 Testbox，并将证明迁移到下面的自有 Crabbox 容量路径，同时让其他人检查 Blacksmith dashboard、账单和组织限制。

仅当 Blacksmith 宕机、受配额限制、缺少所需环境，或明确以自有容量为目标时，才升级到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

在 AWS 压力下，除非任务确实需要 48xlarge 级 CPU，否则避免使用 `class=beast`。一次 `beast` 请求会从 192 vCPU 开始，这是最容易触发区域 EC2 Spot 或 On-Demand Standard 配额的方式。仓库自有的 `.crabbox.yaml` 默认使用 `class: standard`、on-demand 市场和 `capacity.hints: true`，因此代理的 AWS 租约会打印选定区域/市场、配额压力、Spot 回退和高压 class 警告。将 `fast` 用于较重的大范围检查；仅在 standard/fast 不足时才使用 `large`；仅将 `beast` 用于例外的 CPU 密集型 lane，例如完整套件或全插件 Docker 矩阵、明确的发布/阻塞验证，或高核心性能分析。不要将 `beast` 用于 `pnpm check:changed`、聚焦测试、仅文档工作、普通 lint/typecheck、小型 E2E 复现或 Blacksmith 故障分诊。使用 `--market on-demand` 进行容量诊断，避免将 Spot 市场波动混入信号。

`.crabbox.yaml` 负责提供商、同步和 GitHub Actions 水合默认值。Crabbox 同步从不传输 `.git`，因此已水合的 Actions checkout 会保留自己的远程 Git 元数据，而不是同步维护者本地 remote 和对象存储；仓库配置还会排除不应传输的本地运行时/构建工件（例如 `.artifacts` 和测试报告）。`.github/workflows/crabbox-hydrate.yml` 负责 checkout、Node/pnpm 设置、`origin/main` fetch，以及自有云 `crabbox run --id <cbx_id>` 命令的非密钥环境移交。

## 相关

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
