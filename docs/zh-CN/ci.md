---
read_when:
    - 你需要了解一个 CI 作业为什么运行或没有运行
    - 你正在调试一个失败的 GitHub Actions 检查
    - 你正在协调一次发布验证运行或重新运行
    - 你正在更改 ClawSweeper 分派或 GitHub 活动转发
summary: CI 作业图、范围门控、发布总括项和本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-07-05T01:54:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1420bd233290e4377b73dea864253eeb3e57b5cd626698305546bcac691840c0
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 会在每次推送到 `main` 和每个拉取请求时运行。规范的 `main` 推送会先经过一个 90 秒的托管运行器准入窗口。现有的 `CI` 并发组会在更新的提交落地时取消该等待运行，因此连续合并不会各自注册完整的 Blacksmith 矩阵。拉取请求和手动触发会跳过等待。随后 `preflight` 作业会对差异进行分类，并在只有无关区域变更时关闭昂贵的通道。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为候选版本和广泛验证展开完整图。Android 通道仍通过 `include_android` 保持选择加入。仅发布使用的插件覆盖位于单独的 [`Plugin Prerelease`](#plugin-prerelease) 工作流中，并且只会从 [`Full Release Validation`](#full-release-validation) 或显式手动触发运行。

## 流水线概览

| 作业                               | 用途                                                                                                      | 运行时机                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 检测仅文档变更、已变更范围、已变更插件，并构建 CI 清单                                                    | 始终在非草稿推送和 PR 上运行                        |
| `runner-admission`                 | 在注册 Blacksmith 工作之前，为规范的 `main` 推送提供托管的 90 秒防抖                                      | 每次 CI 运行；仅在规范的 `main` 推送上休眠          |
| `security-fast`                    | 私钥检测、通过 `zizmor` 审计已变更工作流，以及生产 lockfile 审计                                          | 始终在非草稿推送和 PR 上运行                        |
| `check-dependencies`               | 仅生产 Knip 依赖检查，以及未使用文件 allowlist 防护                                                       | Node 相关变更                                       |
| `build-artifacts`                  | 构建 `dist/`、Control UI、已构建 CLI 冒烟检查、嵌入式构建产物检查，以及可复用产物                         | Node 相关变更                                       |
| `checks-fast-core`                 | 快速 Linux 正确性通道，例如内置、协议、QA Smoke CI 和 CI 路由检查                                         | Node 相关变更                                       |
| `checks-fast-contracts-plugins-*`  | 两个分片的插件契约检查                                                                                    | Node 相关变更                                       |
| `checks-fast-contracts-channels-*` | 两个分片的渠道契约检查                                                                                    | Node 相关变更                                       |
| `checks-node-core-*`               | Core Node 测试分片，不包括渠道、内置、契约和插件通道                                                      | Node 相关变更                                       |
| `check-*`                          | 分片后的主要本地门禁等价项：生产类型、lint、防护、测试类型和严格冒烟                                     | Node 相关变更                                       |
| `check-additional-*`               | 架构、分片的边界/提示词漂移、插件防护、包边界和运行时拓扑                                                | Node 相关变更                                       |
| `checks-node-compat-node22`        | Node 22 兼容性构建和冒烟通道                                                                              | 发布用手动 CI 触发                                  |
| `check-docs`                       | 文档格式化、lint 和断链检查                                                                               | 文档已变更                                          |
| `skills-python`                    | 针对 Python 支撑的 Skills 运行 Ruff + pytest                                                              | Python Skill 相关变更                               |
| `checks-windows`                   | Windows 特定进程/路径测试，以及共享运行时导入说明符回归检查                                              | Windows 相关变更                                    |
| `macos-node`                       | 使用共享构建产物的 macOS TypeScript 测试通道                                                             | macOS 相关变更                                      |
| `macos-swift`                      | macOS 应用的 Swift lint、构建和测试                                                                       | macOS 相关变更                                      |
| `ios-build`                        | Xcode 项目生成，以及 iOS 应用模拟器构建                                                                  | iOS 应用、共享应用工具包或 Swabble 变更             |
| `android`                          | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建                                                 | Android 相关变更                                    |
| `test-performance-agent`           | 可信活动之后的每日 Codex 慢测试优化                                                                      | Main CI 成功或手动触发                              |
| `openclaw-performance`             | 按日/按需生成 Kova 运行时性能报告，包含 mock-provider、deep-profile 和 GPT 5.5 live 通道                  | 定时和手动触发                                      |

## Fail-fast 顺序

1. `runner-admission` 只会等待规范的 `main` 推送；更新的推送会在 Blacksmith 注册前取消运行。
2. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内部的步骤，不是独立作业。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 会快速失败，而不等待更重的产物和平台矩阵作业。
4. `build-artifacts` 与快速 Linux 通道重叠运行，使下游消费者能在共享构建就绪后立即启动。
5. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。

当更新的推送落在同一个 PR 或 `main` ref 上时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪音。矩阵作业使用 `fail-fast: false`，并且 `build-artifacts` 会直接报告嵌入式渠道、core-support-boundary 和 gateway-watch 失败，而不是排队很小的验证作业。自动 CI 并发键已版本化（`CI-v7-*`），因此旧队列组中的 GitHub 侧僵尸运行无法无限期阻塞更新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>` 汇总 GitHub Actions 的墙钟时间、排队时间、最慢作业、失败，以及 `pnpm-store-warmup` 扇出屏障。CI 也会将同一运行摘要作为 `ci-timings-summary` 产物上传。若要查看构建耗时，请检查 `build-artifacts` 作业的 `Build dist` 步骤：`pnpm build:ci-artifacts` 会打印 `[build-all] phase timings:` 并包含 `ui:build`；该作业也会上传 `startup-memory` 产物。

对于拉取请求运行，终端 timing-summary 作业会先从可信基础修订版运行辅助脚本，然后再将 `GH_TOKEN` 传给 `gh run view`。这样可以让带 token 的查询避开分支控制的代码，同时仍然汇总拉取请求当前的 CI 运行。

## PR 上下文和证据

外部贡献者 PR 会从 `.github/workflows/real-behavior-proof.yml` 运行 PR 上下文和证据门禁。该工作流会检出可信基础提交，并且只评估 PR 正文；它不会执行贡献者分支中的代码。

该门禁适用于不是仓库所有者、成员、协作者或机器人的 PR 作者。当 PR 正文包含作者撰写的 `What Problem This Solves` 和 `Evidence` 章节时，门禁通过。证据可以是聚焦测试、CI 结果、截图、录屏、终端输出、live 观察、已脱敏日志或产物链接。正文提供意图和有用验证；审阅者会检查代码、测试和 CI 以评估正确性。

当检查失败时，更新 PR 正文，而不是再推送一个代码提交。

## 范围和路由

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动触发会跳过 changed-scope 检测，并让 preflight 清单表现得像每个限定范围区域都已变更。

- **CI 工作流编辑**会验证 Node CI 图和工作流 lint，但本身不会强制 Windows、iOS、Android 或 macOS 原生构建；这些平台通道仍限定到平台源代码变更。
- **Workflow Sanity** 会对所有工作流 YAML 文件运行 `actionlint`、`zizmor`，以及 composite-action 插值防护和冲突标记防护。PR 范围内的 `security-fast` 作业也会对已变更工作流文件运行 `zizmor`，使工作流安全发现能在主 CI 图中尽早失败。
- **`main` 推送上的文档**由独立的 `Docs` 工作流检查，并使用与 CI 相同的 ClawHub 文档镜像，因此混合代码+文档推送不会同时排队 CI `check-docs` 分片。拉取请求和手动 CI 在文档已变更时仍会从 CI 运行 `check-docs`。
- **TUI PTY** 会在针对 TUI 变更的 `checks-node-core-runtime-tui-pty` Linux Node 分片中运行。该分片使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 运行 `test/vitest/vitest.tui-pty.config.ts`，因此同时覆盖确定性的 `TuiBackend` fixture 通道，以及较慢的、只 mock 外部模型端点的 `tui --local` 冒烟。
- **仅 CI 路由编辑、选定的廉价核心测试 fixture 编辑，以及狭窄的插件契约辅助/测试路由编辑**会使用快速的仅 Node 清单路径：`preflight`、security 和一个 `checks-fast-core` 任务。当变更仅限于快速任务直接执行的路由或辅助表面时，该路径会跳过构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外防护矩阵。
- **Windows Node 检查**限定到 Windows 特定进程/路径包装器、npm/pnpm/UI 运行器辅助、包管理器配置，以及执行该通道的 CI 工作流表面；无关源代码、插件、install-smoke 和仅测试变更会留在 Linux Node 通道上。

最慢的 Node 测试族已被拆分或均衡，使每个作业保持较小规模，同时不会过度预留运行器：插件契约和频道契约各自作为两个带权重的 Blacksmith 支持分片运行，并带有标准 GitHub 运行器回退；核心单元 fast/support 通道分开运行；核心运行时基础设施拆分为 state、process/config、shared 和三个 cron 领域分片；auto-reply 以均衡 worker 运行（reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片）；agentic gateway/server 配置拆分到 chat/auth/model/http-plugin/runtime/startup 通道，而不是等待构建产物。普通 CI 随后只把隔离的基础设施 include-pattern 分片打包进确定性的包中，每个包最多 64 个测试文件，从而缩减 Node 矩阵，同时不会合并非隔离的 command/cron、有状态 agents-core 或 gateway/server 套件；重型固定套件继续使用 8 vCPU，而打包通道和较低权重通道使用 4 vCPU。规范仓库上的 Pull Request 使用额外的紧凑准入计划：相同的按配置分组会在当前 34 作业 Linux Node 计划内以隔离子进程运行，因此单个 PR 不会注册完整的 70 多作业 Node 矩阵。`main` 推送、手动调度和发布门禁保留完整矩阵。广泛的浏览器、QA、媒体和杂项插件测试使用其专用 Vitest 配置，而不是共享的插件兜底配置。include-pattern 分片使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和经过过滤的分片。`check-additional-*` 将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分离；边界守卫列表被条带化为一个提示词密集分片和一个用于其余守卫条带的组合分片，每个分片并发运行选定的独立守卫并打印每项检查耗时。昂贵的 Codex 成功路径提示词快照漂移检查会作为自己的附加作业运行，仅用于手动 CI 和会影响提示词的变更，因此普通无关的 Node 变更不会被冷启动提示词快照生成阻塞，并且边界分片保持均衡，同时提示词漂移仍固定到导致它的 PR；同一个标志还会跳过构建产物 core support-boundary 分片内的提示词快照 Vitest 生成。Gateway 网关 watch、频道测试和 core support-boundary 分片会在 `build-artifacts` 内并发运行，此时 `dist/` 和 `dist-runtime/` 已经构建完成。

准入后，规范 Linux CI 允许最多 24 个并发 Node 测试作业，较小的 fast/check 通道允许 12 个；Windows 和 Android 保持为两个，因为这些运行器池更窄。

紧凑 PR 计划会为当前套件发出 18 个 Node 作业：whole-config 分组以隔离子进程批处理，并设置 120 分钟批处理超时，而 include-pattern 分组共享相同的有界作业预算。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。third-party flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包作业。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`（一个生产 Knip 仅依赖检查，固定到最新 Knip 版本，并在 `dlx` 安装时禁用 pnpm 的最小发布年龄）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产 unused-file 发现与 `scripts/deadcode-unused-files.allowlist.mjs` 对比。当 PR 添加新的未经审查的未使用文件，或留下过期的 allowlist 条目时，unused-file 守卫会失败，同时保留 Knip 无法静态解析的有意动态插件、生成、构建、live-test 和包桥接表面。

## ClawSweeper 活动转发

`.github/workflows/clawsweeper-dispatch.yml` 是从 OpenClaw 仓库活动到 ClawSweeper 的目标侧桥接。它不会检出或执行不受信任的 Pull Request 代码。该 workflow 会从 `CLAWSWEEPER_APP_PRIVATE_KEY` 创建 GitHub App token，然后向 `openclaw/clawsweeper` 调度紧凑的 `repository_dispatch` payload。

该 workflow 有四个通道：

- `clawsweeper_item` 用于精确的 issue 和 Pull Request review 请求；
- `clawsweeper_comment` 用于 issue comment 中显式的 ClawSweeper 命令；
- `clawsweeper_commit_review` 用于 `main` 推送上的 commit 级 review 请求；
- `github_activity` 用于 ClawSweeper agent 可能检查的一般 GitHub 活动。

`github_activity` 通道只转发规范化元数据：event type、action、actor、repository、item number、URL、title、state，以及存在 comment 或 review 时的短摘录。它有意避免转发完整 webhook body。`openclaw/clawsweeper` 中的接收 workflow 是 `.github/workflows/github-activity.yml`，它会将规范化事件发布到供 ClawSweeper agent 使用的 OpenClaw Gateway 网关 hook。

一般活动是观察，而不是默认投递。ClawSweeper agent 会在其提示词中收到 Discord 目标，并且只有当事件意外、可操作、有风险或对运维有用时才应发布到 `#clawsweeper`。常规 open、edit、bot churn、重复 webhook 噪声和正常 review 流量应产生 `NO_REPLY`。

在这条路径中，始终将 GitHub 标题、comment、body、review text、branch name 和 commit message 视为不受信任的数据。它们是用于总结和分诊的输入，不是 workflow 或 agent runtime 的指令。

## 手动调度

手动 CI 调度会运行与普通 CI 相同的作业图，但会强制开启每个非 Android 范围化通道：Linux Node 分片、内置插件分片、插件和频道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建产物 smoke check、文档检查、Python Skills、Windows、macOS、iOS build 和 Control UI i18n。独立手动 CI 调度只在 `include_android=true` 时运行 Android；完整发布总控通过传递 `include_android=true` 启用 Android。插件预发布静态检查、仅发布用的 `agentic-plugins` 分片、完整 extension 批量 sweep，以及插件预发布 Docker 通道均排除在 CI 之外。Docker 预发布套件只在 `Full Release Validation` 以启用 release-validation 门禁的方式调度单独的 `Plugin Prerelease` workflow 时运行。

手动运行使用唯一并发组，因此发布候选的完整套件不会被同一 ref 上的另一个推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方使用所选调度 ref 中的 workflow 文件，针对某个 branch、tag 或完整 commit SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

每月仅 npm 的 extended-stable 路径是例外：从确切的 `extended-stable/YYYY.M.33` 分支调度 `OpenClaw NPM
Release` preflight 和 `Full Release Validation`，保留它们的 run ID，并将两个 ID 都传递给直接 npm publish 运行。请参阅 [每月仅 npm extended-stable
发布](/zh-CN/reference/RELEASING#monthly-npm-only-extended-stable-publication)，了解命令、确切身份要求、registry 回读和 selector
修复流程。此路径不会调度插件、macOS、Windows、GitHub
Release、私有 dist-tag 或其他平台发布。

## 运行器

| 运行器                          | 作业                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手动 CI 调度和非规范仓库回退、CodeQL JavaScript/actions 质量扫描、workflow-sanity、labeler、auto-response、CI 之外的文档 workflow，以及 install-smoke preflight，使 Blacksmith 矩阵可以更早排队                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、较低权重 extension 分片、除 QA Smoke CI 以外的 `checks-fast-core`、插件/频道契约分片、大多数内置/较低权重 Linux Node 分片、`check-guards`、`check-prod-types`、`check-test-types`、选定的 `check-additional-*` 分片，以及 `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的重型 Linux Node 套件、边界/extension 密集型 `check-additional-*` 分片，以及 `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI、CI 和 Testbox 中的 `build-artifacts`、`check-lint`（对 CPU 足够敏感，8 vCPU 的成本高于节省）；install-smoke Docker 构建（32 vCPU 排队时间成本高于节省）                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；fork 回退到 `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 和 `ios-build`；fork 回退到 `macos-26`                                                                                                                                                                                                                     |

## 运行器注册预算

OpenClaw 当前的 GitHub 运行器注册桶在 `ghx api rate_limit` 中报告为每 5 分钟 10,000 次 self-hosted 运行器注册。每次调优前都要重新检查 `actions_runner_registration`，因为 GitHub 可以更改该桶。此限制由 `openclaw` 组织中的所有 Blacksmith 运行器注册共享，因此添加另一个 Blacksmith 安装不会增加新的桶。

将 Blacksmith label 视为突发控制的稀缺资源。仅执行路由、通知、总结、选择分片或运行短 CodeQL 扫描的作业应保留在 GitHub-hosted 运行器上，除非它们有经过测量的 Blacksmith 特定需求。任何新的 Blacksmith 矩阵、更大的 `max-parallel` 或高频 workflow 都必须展示其最坏情况注册数量，并将组织级目标保持在实时桶的大约 60% 以下。按当前 10,000 注册桶计算，这意味着 6,000 注册的运行目标，为并发仓库、重试和突发重叠留出余量。

规范仓库 CI 将 Blacksmith 保持为普通 push 和 pull-request 运行的默认运行器路径。`workflow_dispatch` 和非规范仓库运行使用 GitHub-hosted 运行器，但普通规范运行目前不会探测 Blacksmith 队列健康状况，也不会在 Blacksmith 不可用时自动回退到 GitHub-hosted label。

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

手动调度通常会对工作流引用执行基准测试。设置 `target_ref` 可使用当前工作流实现对发布标签或其他分支执行基准测试。发布的报告路径和 latest 指针按被测试的 ref 作为键，每个 `index.md` 都会记录被测试的 ref/SHA、工作流 ref/SHA、Kova ref、配置文件、lane 认证模式、模型、重复次数和场景过滤器。

该工作流会从固定发布版本安装 OCM，并从 `openclaw/Kova` 的固定 `kova_ref` 输入安装 Kova，然后运行三个 lane：

- `mock-provider`：针对本地构建运行时运行 Kova 诊断场景，并使用确定性的假 OpenAI 兼容认证。
- `mock-deep-profile`：针对启动、Gateway 网关和智能体轮次热点进行 CPU/堆/跟踪剖析。
- `live-openai-candidate`：真实的 OpenAI `openai/gpt-5.5` 智能体轮次；当 `OPENAI_API_KEY` 不可用时跳过。

mock-provider lane 还会在 Kova 通过后运行 OpenClaw 原生源码探针：默认、钩子和 50 插件启动场景下的 Gateway 网关启动耗时和内存；内置插件导入 RSS；重复的 mock-OpenAI `channel-chat-baseline` hello 循环；针对已启动 Gateway 网关的 CLI 启动命令；以及 SQLite 状态烟测性能探针。当被测试 ref 的上一次已发布 mock-provider 源码报告可用时，源码摘要会将当前 RSS 和堆值与该基线比较，并将较大的 RSS 增长标记为 `watch`。源码探针 Markdown 摘要位于报告包中的 `source/index.md`，原始 JSON 位于旁边。

每个 lane 都会上传 GitHub artifacts。当配置了 `CLAWGRIT_REPORTS_TOKEN` 时，该工作流还会把 `report.json`、`report.md`、包、`index.md` 和源码探针 artifacts 提交到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 下。当前 tested-ref 指针会写入 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整发布验证

`Full Release Validation` 是用于“发布前运行一切”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，为仅发布所需的插件/包/静态/Docker 证明调度 `Plugin Prerelease`，并为安装烟测、包验收、跨 OS 包检查、从 QA 配置文件证据渲染成熟度评分卡、QA Lab 对等性、Matrix 和 Telegram lane 调度 `OpenClaw Release Checks`。stable 和 full 配置文件始终包含详尽的 live/E2E 和 Docker 发布路径浸泡覆盖；beta 配置文件可以通过 `run_release_soak=true` 选择加入。规范的包 Telegram E2E 在 Package Acceptance 内运行，因此完整候选版本不会启动重复的 live poller。发布后，传入 `release_package_spec` 可在 release checks、Package Acceptance、Docker、跨 OS 和 Telegram 中复用已发布的 npm 包，而无需重新构建。只有在聚焦重跑已发布包的 Telegram 时，才使用 `npm_telegram_package_spec`。Codex plugin live package lane 默认使用相同的选定状态：已发布的 `release_package_spec=openclaw@<tag>` 会派生出 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA/artifact 运行会从选定 ref 打包 `extensions/codex`。如需使用 `npm:`、`npm-pack:` 或 `git:` specs 等自定义插件来源，请显式设置 `codex_plugin_spec`。

请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解阶段矩阵、确切工作流作业名称、配置文件差异、artifacts 和聚焦重跑句柄。

`OpenClaw Release Publish` 是手动变更型发布工作流。请在发布标签存在且 OpenClaw npm 预检成功后，从 `release/YYYY.M.PATCH` 或 `main` 调度它。它会验证 `pnpm plugins:sync:check`，为所有可发布插件包调度 `Plugin NPM Release`，为同一个发布 SHA 调度 `Plugin ClawHub Release`，然后才使用已保存的 `preflight_run_id` 调度 `OpenClaw NPM Release`。stable 发布还要求精确的 `windows_node_tag`；在任何发布子流程之前，该工作流会验证 Windows 源码发布，并将其 x64/ARM64 安装器与候选已批准的 `windows_node_installer_digests` 输入比较，然后在发布 GitHub release draft 之前，提升并验证这些相同的固定安装器摘要以及精确的配套资产和校验和契约。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

对于快速变化分支上的固定提交证明，请使用辅助命令，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs 必须是分支或标签，不能是原始提交 SHA。该辅助命令会在目标 SHA 上推送一个临时 `release-ci/<sha>-...` 分支，从该固定 ref 调度 `Full Release Validation`，验证每个子工作流的 `headSha` 都与目标匹配，并在运行完成后删除临时分支。如果任何子工作流在不同 SHA 上运行，总控验证器也会失败。

`release_profile` 控制传入 release checks 的 live/provider 覆盖广度。手动发布工作流默认使用 `stable`；仅当你有意需要广泛的 advisory 提供商/媒体矩阵时，才使用 `full`。stable 和 full release checks 始终运行详尽的 live/E2E 和 Docker 发布路径浸泡；beta 配置文件可以通过 `run_release_soak=true` 选择加入。

- `minimum` 保留最快的 OpenAI/核心发布关键 lane。
- `stable` 添加 stable 提供商/后端集合。
- `full` 运行广泛的 advisory 提供商/媒体矩阵。

总控会记录已调度的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行附加最慢作业表。如果某个子工作流被重跑并变绿，只需重跑父验证器作业即可刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对于发布候选版本使用 `all`；仅针对普通完整 CI 子项使用 `ci`；仅针对插件预发布子项使用 `plugin-prerelease`；针对每个发布子项使用 `release-checks`；或者在总控上使用更窄的组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样在聚焦修复后，失败的发布框重跑会保持有界。对于一个失败的跨 OS lane，将 `rerun_group=cross-os` 与 `cross_os_suite_filter` 组合，例如 `windows/packaged-upgrade`；长时间运行的跨 OS 命令会发出 heartbeat 行，packaged-upgrade 摘要包含每阶段耗时。QA release-check lane 是 advisory，但标准运行时工具覆盖 gate 除外；当所需的 OpenClaw 动态工具从标准层摘要中漂移或消失时，该 gate 会阻塞。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将选定 ref 解析一次为 `release-package-under-test` tarball，然后将该 artifact 传给跨 OS 检查和 Package Acceptance，以及在运行浸泡覆盖时传给 live/E2E 发布路径 Docker 工作流。这样可以让各发布框中的包字节保持一致，并避免在多个子作业中重复打包同一个候选版本。对于 Codex npm-plugin live lane，release checks 会传入从 `release_package_spec` 派生出的匹配已发布插件 spec，或传入操作者提供的 `codex_plugin_spec`，或让输入保持空白，使 Docker 脚本打包选定 checkout 的 Codex 插件。

针对 `ref=main` 和 `rerun_group=all` 的重复 `Full Release Validation` 运行会取代较旧的总控。父监控器在父项被取消时，会取消它已调度的任何子工作流，因此较新的 main 验证不会排在过时的两小时 release-check 运行之后。发布分支/标签验证和聚焦重跑组会保留 `cancel-in-progress: false`。

## Live 和 E2E 分片

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行，而不是作为一个串行作业运行：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 按提供商过滤的 `native-live-src-gateway-profiles` 作业
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片

这会保持相同的文件覆盖，同时让缓慢的 live 提供商失败更容易重跑和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重跑。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预安装 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证这些二进制文件。请将 Docker 支持的 live 套件保留在普通 Blacksmith runners 上，container jobs 不适合启动嵌套 Docker 测试。

Docker 支撑的实时模型/后端分片会为每个选定提交使用单独共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流会构建并推送该镜像一次，然后 Docker 实时模型、按提供商分片的 Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway 网关 Docker 分片在脚本层携带明确的 `timeout` 上限，低于工作流作业超时，这样卡住的容器或清理路径会快速失败，而不是耗尽整个发布检查预算。如果这些分片各自独立重建完整源 Docker 目标，则说明发布运行配置错误，并会把挂钟时间浪费在重复镜像构建上。

## 包验收

当问题是“这个可安装的 OpenClaw 包能否作为产品工作？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源码树，而包验收会通过用户安装或更新后实际使用的同一个 Docker E2E harness 验证单个 tarball。

### 作业

1. `resolve_package` 会检出 `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` artifact 上传，并在 GitHub 步骤摘要中打印来源、工作流 ref、包 ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该 artifact，验证 tarball 清单，在需要时准备包摘要 Docker 镜像，并针对该包运行选定的 Docker lane，而不是打包工作流检出目录。当某个 profile 选择多个定向 `docker_lanes` 时，可复用工作流会准备一次包和共享镜像，然后将这些 lane 扇出为并行的定向 Docker 作业，并使用唯一 artifact。
3. `package_telegram` 可选地调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果包验收解析了一个包，它会安装同一个 `package-under-test` artifact；独立 Telegram dispatch 仍然可以安装已发布的 npm spec。
4. 如果包解析、Docker 验收或可选 Telegram lane 失败，`summary` 会使工作流失败。

### 候选来源

- `source=npm` 只接受 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布的 extended-stable、预发布或稳定版验收。
- `source=ref` 会打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签到达，在 detached worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载一个公开 HTTPS `.tgz`；`package_sha256` 是必填项。此路径会拒绝 URL 凭据、非默认 HTTPS 端口、私有/内部/特殊用途主机名或解析出的 IP，以及违反同一公共安全策略的重定向。
- `source=trusted-url` 从 `.github/package-trusted-sources.json` 中命名的 trusted-source 策略下载 HTTPS `.tgz`；`package_sha256` 和 `trusted_source_id` 是必填项。仅将此用于维护者拥有的企业镜像或私有包仓库，这些仓库需要配置主机、端口、路径前缀、重定向主机或私有网络解析。如果策略声明 bearer auth，工作流会使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret；嵌入 URL 的凭据仍会被拒绝。
- `source=artifact` 会从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选项，但对于外部共享 artifact 应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样当前测试 harness 可以验证较旧的受信任源提交，而无需运行旧的工作流逻辑。

### 套件 profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` 加上 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — 带 OpenWebUI 的完整 Docker 发布路径分块
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必填

`package` profile 使用离线插件覆盖率，因此已发布包验证不会受实时 ClawHub 可用性阻塞。可选 Telegram lane 会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` artifact，同时为独立 dispatch 保留已发布 npm spec 路径。

有关专用更新和插件测试策略，包括本地命令、
Docker lane、Package Acceptance 输入、发布默认值和失败分诊，
请参阅 [更新和插件测试](/zh-CN/help/testing-updates-plugins)。

发布检查会使用 `source=artifact`、准备好的发布包 artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。这会让包迁移、更新、实时 ClawHub skill 安装、陈旧插件依赖清理、已配置插件安装修复、离线插件、插件更新和 Telegram 证明都基于同一个已解析包 tarball。发布 beta 后，在 Full Release Validation 或 OpenClaw Release Checks 上设置 `release_package_spec`，即可在不重建的情况下针对已发布 npm 包运行同一矩阵；仅当 Package Acceptance 需要不同于其余发布验证的包时，才设置 `package_acceptance_package_spec`。跨 OS 发布检查仍覆盖 OS 特定的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。`published-upgrade-survivor` Docker lane 会在阻塞发布路径中每次运行验证一个已发布包基线。在 Package Acceptance 中，解析出的 `package-under-test` tarball 始终是候选项，而 `published_upgrade_survivor_baseline` 选择回退的已发布基线，默认是 `openclaw@latest`；失败 lane 重跑命令会保留该基线。启用 `run_release_soak=true` 或 `release_profile=full` 的 Full Release Validation 会设置 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以扩展覆盖最新四个稳定 npm 版本，加上固定的插件兼容性边界版本，以及针对 Feishu 配置、保留的 bootstrap/persona 文件、已配置 OpenClaw 插件安装、波浪号日志路径和陈旧旧版插件依赖根的 issue 形态 fixture。多基线 published-upgrade survivor 选择会按基线分片到独立的定向 Docker runner 作业中。单独的 `Update Migration` 工作流会在问题是彻底清理已发布更新，而不是常规 Full Release CI 覆盖范围时，使用带 `all-since-2026.4.23` 和 `plugin-deps-cleanup` 的 `update-migration` Docker lane。本地聚合运行可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传入精确包 spec，也可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持单个 lane，例如 `openclaw@2026.4.15`，或设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 用于场景矩阵。已发布 lane 使用内置的 `openclaw config set` 命令配方配置基线，在 `summary.json` 中记录配方步骤，并在 Gateway 网关启动后探测 `/healthz`、`/readyz` 和 RPC 状态。Windows 打包版和安装器全新安装 lane 还会验证已安装包能否从原始绝对 Windows 路径导入 browser-control override。OpenAI 跨 OS agent-turn smoke 在已设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.5`，因此安装和 Gateway 网关证明会保留在 GPT-5 测试模型上，同时避免 GPT-4.x 默认值。

### 旧版兼容窗口

Package Acceptance 为已经发布的包设置了有界旧版兼容窗口。直到 `2026.4.25` 的包，包括 `2026.4.25-beta.*`，可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可以指向 tarball 省略的文件；
- 当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过其持久化子用例；
- `update-channel-switch` 可以从 tarball 派生的假 git fixture 中修剪缺失的 pnpm `patchedDependencies`，并可以记录缺失的持久化 `update.channel`；
- 插件 smoke 可以读取旧版安装记录位置，或接受缺失 marketplace 安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。

已发布的 `2026.4.26` 包也可以对已经发布的本地构建元数据戳文件发出警告。更晚的包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，请从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker artifact：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段计时和重跑命令。优先重跑失败的包 profile 或精确 Docker lane，而不是重跑完整发布验证。

## 安装 smoke

单独的 `Install Smoke` 工作流会通过自己的 `preflight` 作业复用同一个 scope 脚本。它将 smoke 覆盖范围拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径**会在拉取请求触及 Docker/包表面、内置插件包/清单变更，或 Docker 冒烟作业会覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面时运行。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟测试，运行容器 gateway-network e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile（每个场景的 Docker 运行会单独限时）。
- **完整路径**会把 QR 包安装以及安装器 Docker/更新覆盖保留给夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的拉取请求。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟测试、安装器/更新冒烟测试，以及快速内置插件 Docker E2E 作为独立作业运行，这样安装器工作不会被根镜像冒烟测试阻塞。

`main` 推送（包括合并提交）不会强制走完整路径；当变更范围逻辑在推送时请求完整覆盖时，工作流会保留快速 Docker 冒烟测试，并把完整安装冒烟测试留给夜间或发布验证。

较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独设门。它会在夜间计划和发布检查工作流中运行，手动 `Install Smoke` 触发可以选择加入，但拉取请求和 `main` 推送不会运行它。普通 PR CI 仍会针对 Node 相关变更运行快速 Bun 启动器回归测试线。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 一个用于安装器/更新/插件依赖测试线的裸 Node/Git runner；
- 一个功能性镜像，会把同一个 tarball 安装到 `/app`，用于普通功能测试线。

Docker 测试线定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选定计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每条测试线选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行测试线。

### 可调项

| 变量                                   | 默认值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 普通测试线的主池槽位数。                                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 提供商敏感尾池槽位数。                                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发 live 测试线上限，避免提供商限流。                                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 并发 npm install 测试线上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务测试线上限。                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 测试线启动之间的错峰间隔，用于避免 Docker daemon 创建风暴；设为 `0` 表示不做错峰。            |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每条测试线的兜底超时（120 分钟）；选定的 live/tail 测试线使用更紧的上限。                    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未设置  | `1` 会打印调度器计划而不运行测试线。                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未设置  | 逗号分隔的精确测试线列表；跳过清理冒烟测试，便于智能体复现单条失败测试线。                  |

比其有效上限更重的测试线仍可从空池启动，然后会独占运行，直到它释放容量。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活跃测试线状态，持久化测试线耗时以便按最长优先排序，并默认在首次失败后停止调度新的池化测试线。

### 可复用 live/E2E 工作流

可复用 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、测试线和凭证覆盖。随后 `scripts/docker-e2e.mjs` 会把该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；校验 tarball 清单；在计划需要已安装包的测试线时，通过 Blacksmith 的 Docker 层缓存构建并推送带包摘要标签的裸/功能性 GHCR Docker E2E 镜像；并在提供了 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或已有包摘要镜像时复用它们，而不是重新构建。Docker 镜像拉取会使用每次尝试 180 秒的有界超时进行重试，这样卡住的 registry/cache 流会快速重试，而不是消耗 CI 关键路径的大部分时间。

### 发布路径分块

发布 Docker 覆盖使用更小的分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取自身需要的镜像类型，并通过同一个加权调度器执行多条测试线：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

当前发布 Docker 分块是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`package-update-openai` 包含 live Codex plugin 包测试线，该测试线会安装候选 OpenClaw 包，从 `codex_plugin_spec` 或同一引用的 tarball 安装 Codex plugin，并带有显式 Codex CLI 安装审批，运行 Codex CLI 预检，然后针对 OpenAI 运行多轮同会话 OpenClaw 智能体轮次。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合的插件/运行时别名。`install-e2e` 测试线别名仍是两个提供商安装器测试线的聚合手动重跑别名。

当完整 release-path 覆盖请求 OpenWebUI 时，OpenWebUI 会并入 `plugins-runtime-services`，并且只为仅 OpenWebUI 的触发保留独立的 `openwebui` 分块。内置渠道更新测试线会针对暂时性 npm 网络故障重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含测试线日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢测试线表，以及每条测试线的重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选定测试线，而不是运行分块作业，这会把失败测试线调试限制在一个有目标的 Docker 作业内，并为该运行准备、下载或复用包产物；如果选定测试线是 live Docker 测试线，目标作业会为该次重跑在本地构建 live-test 镜像。生成的逐测试线 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败测试线可以复用失败运行中的确切包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

定时 live/E2E 工作流每天运行完整 release-path Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个单独的工作流，由 `Full Release Validation` 或显式操作员触发。普通拉取请求、`main` 推送和独立的手动 CI 触发会关闭该套件。它会把内置插件测试均衡分配到八个扩展 worker；这些扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node 堆，这样导入较重的插件批次不会创建额外 CI 作业。仅发布使用的 Docker 预发布路径会把目标 Docker 测试线按小组批处理，避免为一到三分钟的作业占用数十个 runner。该工作流还会从 `@openclaw/plugin-inspector` 上传一个信息性 `plugin-inspector-advisory` 产物；inspector 发现是分类输入，不会改变阻塞性的 Plugin Prerelease gate。

## QA Lab

QA Lab 在主智能范围工作流之外有专用 CI 测试线。Agentic parity 嵌套在宽泛 QA 和发布 harness 下，而不是独立的 PR 工作流。当 parity 应随宽泛验证运行一起执行时，使用 `Full Release Validation` 并设置 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流会在 `main` 上夜间运行，也可手动触发；它会将 mock parity 测试线、live Matrix 测试线，以及 live Telegram 和 Discord 测试线作为并行作业展开。Live 作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。

发布检查会使用确定性的 mock 提供商和 mock 限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram live 传输测试线，因此渠道契约会与 live 模型延迟和普通提供商插件启动隔离。Live 传输 Gateway 网关会禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；提供商连接由单独的 live 模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 在定时和发布 gate 中使用 `--profile fast`，仅当检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 触发始终会把完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 也会在发布批准前运行发布关键 QA Lab 测试线；其 QA parity gate 会把候选包和基线包作为并行测试线作业运行，然后把两个产物下载到一个小型报告作业中，用于最终 parity 对比。

对于普通 PR，请遵循限定范围的 CI/检查证据，而不是把 parity 视为必需状态。

## CodeQL

`CodeQL` 工作流有意作为范围较窄的第一遍安全扫描器，而不是完整仓库扫描。每日、手动和非草稿拉取请求防护运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 表面，并使用高置信度安全查询，筛选到 high/critical `security-severity`。

拉取请求防护保持轻量：它只会针对 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src` 或拥有进程的内置插件运行时路径下的变更启动，并运行与定时工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不在 PR 默认项中。

### 安全类别

| 类别                                              | 表面                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 凭证、密钥、沙箱、cron 和 Gateway 网关基线                                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥、审计触点                                                       |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络防护、web-fetch，以及插件 SDK SSRF 策略表面                                                               |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助工具、出站投递，以及智能体工具执行门控                                                                     |
| `/codeql-security-high/process-exec-boundary`     | 本地 shell、进程 spawn 辅助工具、拥有子进程的内置插件运行时，以及工作流脚本胶水代码                                                |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、清单、注册表、包管理器安装、源码加载，以及插件 SDK 包契约信任表面                                                |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 定时 Android 安全分片。为 CodeQL 手动构建 Android 应用，使用工作流健全性检查接受的最小 Blacksmith Linux runner。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并上传到 `/codeql-critical-security/macos` 下。它保留在每日默认项之外，因为即使干净运行，macOS 构建也会主导运行时间。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它只在 GitHub 托管的 Linux runner 上，对狭窄的高价值表面运行错误严重级别、非安全 JavaScript/TypeScript 质量查询，因此质量扫描不会消耗 Blacksmith runner 注册预算。它的拉取请求保护有意小于定时配置：非草稿 PR 仅会针对智能体命令/模型/工具执行和回复分发代码、配置 schema/迁移/IO 代码、凭证/密钥/沙箱/安全代码、核心渠道和内置渠道插件运行时、Gateway 网关协议/服务器方法、记忆运行时/SDK 胶水代码、MCP/进程/出站投递、提供商运行时/模型目录、会话诊断/投递队列、插件加载器、插件 SDK/包契约，或插件 SDK 回复运行时变更，运行匹配的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 配置和质量工作流变更会运行全部十二个 PR 质量分片。

手动派发接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭窄配置是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 表面                                                                                                                                                            |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 凭证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                               |
| `/codeql-critical-quality/config-boundary`              | 配置 schema、迁移、规范化和 IO 契约                                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议 schema 和服务器方法契约                                                                                                                        |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约                                                                                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥、进程监督辅助工具，以及出站投递契约                                                                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆宿主 SDK、记忆运行时 facade、记忆插件 SDK 别名、记忆运行时激活胶水代码，以及记忆 Doctor 命令                                                                |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递辅助工具、诊断事件/日志包表面，以及会话 Doctor CLI 契约                                                       |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复 payload/分块/运行时辅助工具、渠道回复选项、投递队列，以及会话/线程绑定辅助工具                                                     |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商凭证和设备发现、提供商运行时注册、提供商默认值/目录，以及 web/search/fetch/embedding 注册表                                               |
| `/codeql-critical-quality/ui-control-plane`             | Control UI 启动、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                     |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、媒体 IO、媒体理解、图像生成，以及媒体生成运行时契约                                                                                       |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公共表面，以及插件 SDK 入口点契约                                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧插件 SDK 源码和插件包契约辅助工具                                                                                                                      |

质量与安全保持分离，这样质量发现就可以在不遮蔽安全信号的情况下被定时运行、度量、禁用或扩展。Swift、Python 和内置插件 CodeQL 扩展只应在狭窄配置具备稳定运行时间和信号之后，作为有范围或分片的后续工作加回。

## 维护工作流

### Docs Agent

`Docs Agent` 工作流是事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时计划：`main` 上成功的非 bot push CI 运行可以触发它，手动派发也可以直接运行它。当 `main` 已继续前进，或过去一小时内已创建另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一个未跳过 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档处理以来累积的所有 main 变更。

### Test Performance Agent

`Test Performance Agent` 工作流是事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上成功的非 bot push CI 运行可以触发它，但如果该 UTC 日已有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动派发会绕过这个每日活动门控。该通道会构建全套件分组 Vitest 性能报告，让 Codex 只做小型、保持覆盖率的测试性能修复，而不是大范围重构，然后重新运行全套件报告，并拒绝会降低通过基线测试数量的变更。分组报告会记录 Linux 和 macOS 上每个配置的墙钟时间与最大 RSS，因此前后对比会在持续时间增量旁呈现测试内存增量。如果基线有失败测试，Codex 只能修复明显失败，并且 agent 之后的全套件报告必须通过，之后才会提交任何内容。当 `main` 在 bot push 落地前推进时，该通道会 rebase 已验证补丁，重新运行 `pnpm check:changed`，并重试推送；有冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是用于落地后重复项清理的手动维护者工作流。它默认 dry-run，并且只有在 `apply=true` 时才会关闭明确列出的 PR。在变更 GitHub 之前，它会验证已落地 PR 已合并，并且每个重复项要么有共享的引用 issue，要么有重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门控和变更路由

本地变更通道路由逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门控比宽泛的 CI 平台范围更严格地处理架构边界：

- 核心生产变更会运行核心 prod 和核心测试 typecheck，以及核心 lint/guard；
- 仅核心测试变更只会运行核心测试 typecheck，以及核心 lint；
- 插件生产变更会运行插件 prod 和插件测试 typecheck，以及插件 lint；
- 仅插件测试变更会运行插件测试 typecheck，以及插件 lint；
- 公共插件 SDK 或插件契约变更会扩展到插件 typecheck，因为插件依赖这些核心契约（Vitest 插件 sweep 保持为显式测试工作）；
- 仅发布元数据版本 bump 会运行有针对性的版本/配置/根依赖检查；
- 未知根/配置变更会 fail safe 到所有检查通道。

本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更便宜：直接测试编辑会运行自身，源码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享 group-room 投递配置是显式映射之一：对群组可见回复配置、源回复投递模式，或消息工具系统提示词的变更，会通过核心回复测试以及 Discord 和 Slack 投递回归测试，因此共享默认值变更会在第一次 PR 推送前失败。只有当变更足够覆盖整个 harness，以至于便宜的映射集合不再是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

Crabbox 是仓库自有的远程机器封装器，用于维护者 Linux 证明。当检查对本地编辑循环来说范围过大、需要与 CI 保持一致，或证明需要密钥、Docker、包通道、可复用机器或远程日志时，请从仓库根目录使用它。常规 OpenClaw 后端是 `blacksmith-testbox`；自有 AWS/Hetzner 容量是在 Blacksmith 中断、配额问题或明确需要自有容量测试时的后备。

由 Crabbox 支持的 Blacksmith 运行会预热、认领、同步、运行、报告并清理一次性 Testboxes。内置同步完整性检查会在所需根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时快速失败。对于有意进行大量删除的 PR，请为远程命令设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

如果本地 Blacksmith CLI 调用停留在同步阶段超过五分钟且没有同步后的输出，Crabbox 也会终止它。设置 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可禁用该保护，或为异常大的本地 diff 使用更大的毫秒值。

首次运行前，请从仓库根目录检查封装器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

如果 Crabbox 二进制文件过旧且未声明支持 `blacksmith-testbox`，仓库封装器会拒绝运行。即使 `.crabbox.yaml` 有自有云默认值，也请显式传入提供商。在 Codex 工作树或链接式/稀疏检出中，避免使用本地 `pnpm crabbox:run` 脚本，因为 pnpm 可能会在 Crabbox 启动前协调依赖；请改为直接调用 node 封装器：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

由 Blacksmith 支持的运行需要 Crabbox 0.22.0 或更高版本，这样封装器才能获得当前的 Testbox 同步、队列和清理行为。使用同级检出时，请在计时或证明工作前重新构建被忽略的本地二进制文件：

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

变更门禁：

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
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

完整套件：

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
  "corepack pnpm test"
```

阅读最终 JSON 摘要。有用字段是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。对于委托的 Blacksmith Testbox 运行，Crabbox 封装器退出码和 JSON 摘要就是命令结果。链接的 GitHub Actions 运行负责水合和保活；当 SSH 命令已经返回后 Testbox 被外部停止时，它可能以 `cancelled` 结束。除非封装器 `exitCode` 非零或命令输出显示测试失败，否则将其视为清理/状态产物。一次性的 Blacksmith 支持的 Crabbox 运行应自动停止 Testbox；如果运行被中断或清理不明确，请检查实时机器，并且只停止你创建的机器：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

仅在你有意需要在同一台已水合机器上运行多个命令时才使用复用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是故障层但 Blacksmith 本身可用，只将直接 Blacksmith 用于 `list`、`status` 和清理等诊断。在将直接 Blacksmith 运行视为维护者证明前，请先修复 Crabbox 路径。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可用，但新的预热在几分钟后仍停留在 `queued`，且没有 IP 或 Actions 运行 URL，请将其视为 Blacksmith 提供商、队列、计费或组织限制压力。停止你创建的排队 id，避免启动更多 Testboxes，并在有人检查 Blacksmith 仪表板、计费和组织限制时，将证明迁移到下面的自有 Crabbox 容量路径。

仅在 Blacksmith 停机、受配额限制、缺少所需环境，或明确以自有容量为目标时，才升级到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 压力下，除非任务确实需要 48xlarge 级 CPU，否则避免使用 `class=beast`。`beast` 请求从 192 个 vCPU 起步，是最容易触发区域 EC2 Spot 或 On-Demand Standard 配额的方式。仓库自有的 `.crabbox.yaml` 默认使用 `standard`、多个容量区域和 `capacity.hints: true`，因此经纪式 AWS 租约会打印选定区域/市场、配额压力、Spot 后备和高压力类别警告。对更重的广泛检查使用 `fast`；只有在 standard/fast 不足时才使用 `large`；仅对完整套件或全插件 Docker 矩阵、明确的发布/阻塞验证，或高核心性能剖析等异常 CPU 密集通道使用 `beast`。不要将 `beast` 用于 `pnpm check:changed`、聚焦测试、仅文档工作、常规 lint/typecheck、小型 E2E 复现或 Blacksmith 中断分诊。使用 `--market on-demand` 进行容量诊断，这样 Spot 市场波动不会混入信号。

`.crabbox.yaml` 拥有自有云通道的提供商、同步和 GitHub Actions 水合默认值。它排除本地 `.git`，使水合后的 Actions 检出保留自己的远程 Git 元数据，而不是同步维护者本地的远程和对象存储；它还排除不应传输的本地运行时/构建产物。`.github/workflows/crabbox-hydrate.yml` 拥有检出、Node/pnpm 设置、`origin/main` 获取，以及自有云 `crabbox run --id <cbx_id>` 命令的非密钥环境交接。

## 相关内容

- [安装概览](/zh-CN/install)
- [开发频道](/zh-CN/install/development-channels)
