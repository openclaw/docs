---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试一个失败的 GitHub Actions 检查
    - 你正在协调一次发布验证运行或重新运行
    - 你正在更改 ClawSweeper 调度或 GitHub 活动转发
summary: CI 作业图、范围门禁、发布总括项和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-06-28T00:10:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 会在每次推送到 `main` 以及每个拉取请求上运行。规范的 `main` 推送会先经过一个 90 秒的托管运行器准入窗口。现有的 `CI` 并发组会在更新的提交到达时取消那个等待中的运行，因此连续合并不会各自注册完整的 Blacksmith 矩阵。拉取请求和手动派发会跳过等待。随后，`preflight` 作业会对差异进行分类，并在只有无关区域发生变化时关闭昂贵的通道。手动 `workflow_dispatch` 运行会有意绕过智能作用域，并为候选发布版本和广泛验证展开完整图。Android 通道仍通过 `include_android` 保持选择启用。仅发布版本使用的插件覆盖率位于单独的 [`Plugin Prerelease`](#plugin-prerelease) 工作流中，并且只会从 [`Full Release Validation`](#full-release-validation) 或显式手动派发运行。

## 流水线概览

| 作业                               | 用途                                                                                                      | 运行时机                                                |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `preflight`                        | 检测仅文档变更、已变更作用域、已变更扩展，并构建 CI 清单                                                | 始终在非草稿推送和 PR 上运行                            |
| `runner-admission`                 | 在注册 Blacksmith 工作之前，为规范的 `main` 推送提供托管的 90 秒防抖                                    | 每次 CI 运行；仅在规范的 `main` 推送上休眠              |
| `security-fast`                    | 私钥检测、通过 `zizmor` 审计已变更工作流，以及生产锁文件审计                                            | 始终在非草稿推送和 PR 上运行                            |
| `check-dependencies`               | 生产 Knip 仅依赖项检查，以及未使用文件允许列表守卫                                                       | Node 相关变更                                           |
| `build-artifacts`                  | 构建 `dist/`、Control UI、已构建 CLI 冒烟检查、嵌入式构建产物检查，以及可复用产物                        | Node 相关变更                                           |
| `checks-fast-core`                 | 快速 Linux 正确性通道，例如内置、协议、QA Smoke CI 和 CI 路由检查                                        | Node 相关变更                                           |
| `checks-fast-contracts-plugins-*`  | 两个分片的插件契约检查                                                                                    | Node 相关变更                                           |
| `checks-fast-contracts-channels-*` | 两个分片的渠道契约检查                                                                                    | Node 相关变更                                           |
| `checks-node-core-*`               | Core Node 测试分片，不包括渠道、内置、契约和扩展通道                                                     | Node 相关变更                                           |
| `check-*`                          | 分片的主本地门禁等价项：生产类型、lint、守卫、测试类型和严格冒烟                                        | Node 相关变更                                           |
| `check-additional-*`               | 架构、分片的边界/提示漂移、扩展守卫、包边界和运行时拓扑                                                  | Node 相关变更                                           |
| `checks-node-compat-node22`        | Node 22 兼容性构建和冒烟通道                                                                              | 发布版本的手动 CI 派发                                  |
| `check-docs`                       | 文档格式化、lint 和损坏链接检查                                                                           | 文档已变更                                              |
| `skills-python`                    | 针对 Python 支持的 Skills 的 Ruff + pytest                                                                | Python Skills 相关变更                                  |
| `checks-windows`                   | Windows 特定的进程/路径测试，以及共享运行时导入说明符回归                                                | Windows 相关变更                                        |
| `macos-node`                       | 使用共享构建产物的 macOS TypeScript 测试通道                                                              | macOS 相关变更                                          |
| `macos-swift`                      | macOS 应用的 Swift lint、构建和测试                                                                       | macOS 相关变更                                          |
| `ios-build`                        | Xcode 项目生成以及 iOS 应用模拟器构建                                                                     | iOS 应用、共享应用套件或 Swabble 变更                   |
| `android`                          | 两种风格的 Android 单元测试，以及一次 debug APK 构建                                                     | Android 相关变更                                        |
| `test-performance-agent`           | 受信活动后的每日 Codex 慢测试优化                                                                         | Main CI 成功或手动派发                                  |
| `openclaw-performance`             | 带有 mock 提供商、deep-profile 和 GPT 5.5 实时通道的每日/按需 Kova 运行时性能报告                        | 定时和手动派发                                          |

## 快速失败顺序

1. `runner-admission` 只会等待规范的 `main` 推送；更新的推送会在 Blacksmith 注册前取消本次运行。
2. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，而不是独立作业。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
4. `build-artifacts` 会与快速 Linux 通道重叠运行，这样下游消费者可在共享构建就绪后立即开始。
5. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。

当更新的推送落到同一 PR 或 `main` ref 上时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。矩阵作业使用 `fail-fast: false`，而 `build-artifacts` 会直接报告嵌入式渠道、core-support-boundary 和 gateway-watch 失败，而不是排队微小的验证器作业。自动 CI 并发键带有版本（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸项无法无限期阻塞更新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消进行中的运行。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>` 从 GitHub Actions 汇总墙钟时间、排队时间、最慢作业、失败项以及 `pnpm-store-warmup` 扇出屏障。CI 也会将相同的运行摘要作为 `ci-timings-summary` 产物上传。对于构建耗时，请检查 `build-artifacts` 作业的 `Build dist` 步骤：`pnpm build:ci-artifacts` 会打印 `[build-all] phase timings:` 并包含 `ui:build`；该作业也会上传 `startup-memory` 产物。

对于拉取请求运行，终端 timing-summary 作业会先从受信基础版本运行辅助工具，然后再将 `GH_TOKEN` 传给 `gh run view`。这会让带 token 的查询避开分支可控代码，同时仍然汇总拉取请求当前的 CI 运行。

## PR 上下文和证据

外部贡献者 PR 会从 `.github/workflows/real-behavior-proof.yml` 运行 PR 上下文和证据门禁。该工作流会检出受信的基础提交，并且只评估 PR 正文；它不会执行贡献者分支中的代码。

该门禁适用于不是仓库所有者、成员、协作者或 bot 的 PR 作者。当 PR 正文包含作者编写的 `What Problem This Solves` 和 `Evidence` 部分时，门禁通过。证据可以是聚焦测试、CI 结果、截图、录屏、终端输出、实时观察、已脱敏日志或产物链接。正文提供意图和有用的验证；审阅者会检查代码、测试和 CI 来评估正确性。

当检查失败时，请更新 PR 正文，而不是再推送一个代码提交。

## 作用域和路由

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动派发会跳过已变更作用域检测，并让 preflight 清单表现得像每个受作用域控制的区域都已变更。

- **CI 工作流编辑** 会验证 Node CI 图和工作流 lint，但不会单独强制 Windows、iOS、Android 或 macOS 原生构建；这些平台通道仍限定于平台源代码变更。
- **Workflow Sanity** 会对所有工作流 YAML 文件运行 `actionlint`、`zizmor`，并运行 composite-action 插值守卫和冲突标记守卫。PR 作用域的 `security-fast` 作业也会对已变更工作流文件运行 `zizmor`，因此工作流安全发现会在主 CI 图中尽早失败。
- **`main` 推送上的文档** 由独立的 `Docs` 工作流检查，该工作流使用与 CI 相同的 ClawHub 文档镜像，因此混合代码+文档推送不会额外排队 CI `check-docs` 分片。拉取请求和手动 CI 在文档变更时仍会从 CI 运行 `check-docs`。
- **TUI PTY** 会针对 TUI 变更在 `checks-node-core-runtime-tui-pty` Linux Node 分片中运行。该分片使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 运行 `test/vitest/vitest.tui-pty.config.ts`，因此会同时覆盖确定性的 `TuiBackend` fixture 通道，以及只模拟外部模型端点、较慢的 `tui --local` 冒烟。
- **仅 CI 路由的编辑、选定的廉价 core-test fixture 编辑，以及范围狭窄的插件契约辅助工具/测试路由编辑** 会使用快速的仅 Node 清单路径：`preflight`、security，以及单个 `checks-fast-core` 任务。当变更仅限于快速任务直接演练的路由或辅助工具表面时，该路径会跳过构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片和额外守卫矩阵。
- **Windows Node 检查** 限定于 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关源代码、插件、install-smoke 和仅测试变更会留在 Linux Node 通道上。

最慢的 Node 测试族已被拆分或均衡，因此每个作业都保持较小规模，同时不会过度预留运行器：插件契约和渠道契约各自作为两个带权重的 Blacksmith 支持分片运行，并带有标准 GitHub 运行器回退；核心单元 fast/support 车道单独运行；核心运行时基础设施拆分为 state、process/config、shared 和三个 cron 域分片；auto-reply 作为均衡 worker 运行（reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片）；智能体式 Gateway 网关/服务器配置拆分到 chat/auth/model/http-plugin/runtime/startup 车道，而不是等待已构建产物。普通 CI 随后只把隔离的基础设施 include-pattern 分片打包进确定性的 bundle，每个 bundle 最多 64 个测试文件，从而减少 Node 矩阵，同时不合并非隔离的 command/cron、有状态 agents-core 或 Gateway 网关/服务器套件；重型固定套件保留在 8 vCPU 上，而打包后的车道和较低权重车道使用 4 vCPU。规范仓库上的拉取请求使用额外的紧凑准入计划：相同的按配置分组会在当前 34 作业 Linux Node 计划内以隔离子进程运行，因此单个 PR 不会注册完整的 70 多作业 Node 矩阵。`main` 推送、手动调度和发布门禁保留完整矩阵。宽泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。Include-pattern 分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional-*` 将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分离；边界守卫列表被条带化为一个提示词密集型分片和一个用于其余守卫条带的组合分片，每个分片并发运行选定的独立守卫，并打印每项检查的计时。昂贵的 Codex 快乐路径提示词快照漂移检查作为自己的附加作业运行，仅用于手动 CI 和会影响提示词的变更，因此普通的无关 Node 变更不会卡在冷启动提示词快照生成之后，边界分片保持均衡，同时提示词漂移仍固定到导致它的 PR；同一个标志会在已构建产物 core support-boundary 分片内跳过提示词快照 Vitest 生成。Gateway 网关 watch、渠道测试和 core support-boundary 分片在 `build-artifacts` 内并发运行，此时 `dist/` 和 `dist-runtime/` 已经构建完成。

准入后，规范 Linux CI 允许最多 24 个并发 Node 测试作业，
较小的 fast/check 车道允许 12 个；Windows 和 Android 保持为两个，
因为这些运行器池更窄。

紧凑 PR 计划为当前套件发出 18 个 Node 作业：完整配置
分组会在隔离子进程中批处理，批处理超时为 120 分钟，
而 include-pattern 分组共享相同的有界作业预算。

Android CI 会运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试车道仍会使用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包作业。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`（一个仅依赖项的生产 Knip 检查，固定到最新 Knip 版本，并为 `dlx` 安装禁用 pnpm 的 minimum release age）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现与 `scripts/deadcode-unused-files.allowlist.mjs` 比较。当 PR 添加新的未审查未使用文件，或留下过期 allowlist 条目时，未使用文件守卫会失败，同时保留 Knip 无法静态解析的有意动态插件、生成文件、构建、live-test 和包桥接表面。

## ClawSweeper 活动转发

`.github/workflows/clawsweeper-dispatch.yml` 是从 OpenClaw 仓库活动到 ClawSweeper 的目标侧桥接。它不会检出或执行不受信任的拉取请求代码。该 workflow 从 `CLAWSWEEPER_APP_PRIVATE_KEY` 创建 GitHub App token，然后向 `openclaw/clawsweeper` 调度紧凑的 `repository_dispatch` payload。

该 workflow 有四个车道：

- `clawsweeper_item` 用于精确的 issue 和拉取请求审查请求；
- `clawsweeper_comment` 用于 issue 评论中的显式 ClawSweeper 命令；
- `clawsweeper_commit_review` 用于 `main` 推送上的提交级审查请求；
- `github_activity` 用于 ClawSweeper 智能体可能检查的一般 GitHub 活动。

`github_activity` 车道只转发规范化元数据：事件类型、动作、执行者、仓库、条目编号、URL、标题、状态，以及存在评论或审查时的短摘录。它有意避免转发完整 webhook body。`openclaw/clawsweeper` 中接收方 workflow 是 `.github/workflows/github-activity.yml`，它会将规范化事件发布到 OpenClaw Gateway 网关 hook，供 ClawSweeper 智能体使用。

一般活动是观察，而不是默认投递。ClawSweeper 智能体会在其提示词中收到 Discord 目标，并且只应在事件令人意外、可操作、有风险或对运维有用时发布到 `#clawsweeper`。常规打开、编辑、bot 噪声、重复 webhook 噪声和正常审查流量应产生 `NO_REPLY`。

在此路径中，始终将 GitHub 标题、评论、正文、审查文本、分支名称和提交消息视为不受信任的数据。它们是用于摘要和分诊的输入，而不是 workflow 或智能体运行时的指令。

## 手动调度

手动 CI 调度运行与普通 CI 相同的作业图，但强制开启每个非 Android 作用域车道：Linux Node 分片、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、已构建产物 smoke 检查、文档检查、Python Skills、Windows、macOS、iOS 构建和 Control UI i18n。独立手动 CI 调度只有在 `include_android=true` 时才运行 Android；完整发布总控通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布的 `agentic-plugins` 分片、完整插件批量 sweep，以及插件预发布 Docker 车道都排除在 CI 之外。Docker 预发布套件只在 `Full Release Validation` 以启用 release-validation 门禁的方式调度单独的 `Plugin Prerelease` workflow 时运行。

手动运行使用唯一的 concurrency group，因此发布候选的完整套件不会被同一 ref 上的另一个推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方针对分支、标签或完整提交 SHA 运行该图，同时使用所选调度 ref 中的 workflow 文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 运行器

| 运行器                          | 作业                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | 手动 CI 调度和非规范仓库回退、CodeQL JavaScript/actions 质量扫描、workflow-sanity、labeler、auto-response、CI 外部的文档 workflow，以及 install-smoke 预检，使 Blacksmith 矩阵可以更早排队                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、较低权重的扩展分片、`checks-fast-core`、插件/渠道契约分片、大多数内置/较低权重 Linux Node 分片、`check-guards`、`check-prod-types`、`check-test-types`、选定的 `check-additional-*` 分片，以及 `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的重型 Linux Node 套件、边界/扩展密集型 `check-additional-*` 分片，以及 `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`、`check-lint`（对 CPU 足够敏感，8 vCPU 节省的成本低于其带来的成本）；install-smoke Docker 构建（32 vCPU 队列时间的成本高于节省）                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；fork 回退到 `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 和 `ios-build`；fork 回退到 `macos-26`                                                                                                                                                                                                  |

## 运行器注册预算

OpenClaw 当前的 GitHub 运行器注册桶允许每 5 分钟 3,000 次自托管
运行器注册。该限制由 `openclaw` 组织中的所有 Blacksmith 运行器
注册共享，因此添加另一个 Blacksmith 安装不会增加新的桶。

将 Blacksmith 标签视为突发控制的稀缺资源。只负责路由、通知、摘要、选择分片或运行短 CodeQL 扫描的作业应保留在 GitHub 托管运行器上，除非它们有经过测量的 Blacksmith 特定需求。任何新的 Blacksmith 矩阵、更大的 `max-parallel` 或高频 workflow 都必须展示其最坏情况注册次数，并将组织级目标保持在每 5 分钟 2,000 次注册以下，为并发仓库和重试作业留出余量。

规范仓库 CI 将 Blacksmith 保持为普通推送和拉取请求运行的默认运行器路径。`workflow_dispatch` 和非规范仓库运行使用 GitHub 托管运行器，但普通规范运行目前不会探测 Blacksmith 队列健康状况，也不会在 Blacksmith 不可用时自动回退到 GitHub 托管标签。

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

## OpenClaw 性能

`OpenClaw Performance` 是产品/运行时性能工作流。它每天在 `main` 上运行，也可以手动分派：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手动分派通常会对工作流引用进行基准测试。设置 `target_ref` 可使用当前工作流实现对发布标签或另一个分支进行基准测试。已发布的报告路径和 latest 指针按被测试引用设置键名，并且每个 `index.md` 都会记录被测试引用/SHA、工作流引用/SHA、Kova 引用、profile、lane 认证模式、模型、重复次数和场景过滤器。

该工作流会从固定发布版本安装 OCM，并从 `openclaw/Kova` 按固定的 `kova_ref` 输入安装 Kova，然后运行三个 lane：

- `mock-provider`：使用确定性的假 OpenAI 兼容凭证，对本地构建运行时运行 Kova 诊断场景。
- `mock-deep-profile`：针对启动、Gateway 网关和智能体轮次热点的 CPU/堆/跟踪 profiling。
- `live-openai-candidate`：一次真实的 OpenAI `openai/gpt-5.5` 智能体轮次；当 `OPENAI_API_KEY` 不可用时跳过。

mock-provider lane 还会在 Kova 通过后运行 OpenClaw 原生源码探针：默认、hook 和 50 插件启动场景下的 Gateway 网关启动耗时和内存；内置插件导入 RSS、重复的 mock-OpenAI `channel-chat-baseline` hello 循环、针对已启动 Gateway 网关的 CLI 启动命令，以及 SQLite 状态 smoke 性能探针。当被测试引用有先前已发布的 mock-provider 源码报告可用时，源码摘要会将当前 RSS 和堆值与该基线比较，并将较大的 RSS 增幅标记为 `watch`。源码探针 Markdown 摘要位于报告包中的 `source/index.md`，原始 JSON 位于其旁边。

每个 lane 都会上传 GitHub artifact。当配置了 `CLAWGRIT_REPORTS_TOKEN` 时，该工作流还会把 `report.json`、`report.md`、包、`index.md` 和源码探针 artifact 提交到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 下。当前被测试引用指针会写入为 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 全量发布验证

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标分派手动 `CI` 工作流，分派 `Plugin Prerelease` 以获取仅发布所需的插件/包/静态/Docker 证明，并分派 `OpenClaw Release Checks` 以执行安装 smoke、包验收、跨 OS 包检查、基于 QA profile 证据渲染成熟度评分卡、QA Lab parity、Matrix 和 Telegram lane。stable 和 full profile 始终包含详尽的 live/E2E 和 Docker 发布路径 soak 覆盖；beta profile 可以通过 `run_release_soak=true` 选择启用。规范的包 Telegram E2E 在 Package Acceptance 内运行，因此完整候选版本不会启动重复的实时 poller。发布后，传入 `release_package_spec` 可在 release checks、Package Acceptance、Docker、跨 OS 和 Telegram 中复用已发布的 npm 包而无需重建。仅在聚焦的已发布包 Telegram 重跑中使用 `npm_telegram_package_spec`。Codex 插件 live package lane 默认使用相同的选中状态：已发布的 `release_package_spec=openclaw@<tag>` 会派生 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA/artifact 运行会从选中引用打包 `extensions/codex`。如果要使用自定义插件来源（例如 `npm:`、`npm-pack:` 或 `git:` spec），请显式设置 `codex_plugin_spec`。

参见 [全量发布验证](/zh-CN/reference/full-release-validation)，了解阶段矩阵、精确的工作流 job 名称、profile 差异、artifact 和聚焦重跑句柄。

`OpenClaw Release Publish` 是会产生变更的手动发布工作流。在发布标签存在且 OpenClaw npm preflight 已成功后，从 `release/YYYY.M.PATCH` 或 `main` 分派它。它会验证 `pnpm plugins:sync:check`，为所有可发布插件包分派 `Plugin NPM Release`，为同一发布 SHA 分派 `Plugin ClawHub Release`，然后才使用保存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。stable 发布还要求精确的 `windows_node_tag`；该工作流会在任何发布子流程之前验证 Windows 源发布，并将其 x64/ARM64 安装器与候选版本已批准的 `windows_node_installer_digests` 输入进行比较，然后在发布 GitHub release 草稿之前，提升并验证这些同样固定的安装器摘要，以及精确的配套资产和校验和契约。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

对于快速变化分支上的固定提交证明，请使用 helper，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流分派引用必须是分支或标签，不能是原始提交 SHA。该 helper 会在目标 SHA 上推送一个临时 `release-ci/<sha>-...` 分支，从该固定引用分派 `Full Release Validation`，验证每个子工作流 `headSha` 都匹配目标，并在运行完成后删除临时分支。如果任何子工作流在不同 SHA 上运行，总控验证器也会失败。

`release_profile` 控制传入 release checks 的 live/provider 覆盖广度。手动发布工作流默认使用 `stable`；仅当你有意需要广泛的 advisory provider/media 矩阵时才使用 `full`。stable 和 full release checks 始终运行详尽的 live/E2E 和 Docker 发布路径 soak；beta profile 可以通过 `run_release_soak=true` 选择启用。

- `minimum` 保留最快的 OpenAI/核心发布关键 lane。
- `stable` 增加 stable provider/backend 集合。
- `full` 运行广泛的 advisory provider/media 矩阵。

总控工作流会记录已分派的子运行 ID，最终的 `Verify full validation` job 会重新检查当前子运行结论，并为每个子运行追加最慢 job 表。如果某个子工作流被重跑并变绿，只需重跑父验证器 job，即可刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`，仅正常 full CI 子流程使用 `ci`，仅插件 prerelease 子流程使用 `plugin-prerelease`，每个发布子流程使用 `release-checks`，或者在总控中使用更窄的组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在聚焦修复后限制失败发布环境的重跑范围。对于一个失败的跨 OS lane，将 `rerun_group=cross-os` 与 `cross_os_suite_filter` 组合使用，例如 `windows/packaged-upgrade`；长时间运行的跨 OS 命令会发出 heartbeat 行，packaged-upgrade 摘要包含每阶段耗时。QA release-check lane 是 advisory，但标准运行时工具覆盖 gate 除外；当必需的 OpenClaw 动态工具从标准层摘要中漂移或消失时，该 gate 会阻塞。

`OpenClaw Release Checks` 使用可信工作流引用将选中引用解析一次为 `release-package-under-test` tarball，然后将该 artifact 传递给跨 OS 检查和 Package Acceptance，以及在运行 soak 覆盖时传递给 live/E2E 发布路径 Docker 工作流。这会让包字节在各个发布环境中保持一致，并避免在多个子 job 中重新打包同一个候选版本。对于 Codex npm-plugin live lane，release checks 要么传入从 `release_package_spec` 派生出的匹配已发布插件 spec，要么传入操作者提供的 `codex_plugin_spec`，要么将输入留空，让 Docker 脚本打包选中 checkout 的 Codex 插件。

针对 `ref=main` 和 `rerun_group=all` 的重复 `Full Release Validation` 运行会取代较旧的总控运行。父监视器在父运行被取消时，会取消它已分派的任何子工作流，因此较新的 main 验证不会排在过期的两小时 release-check 运行之后。发布分支/标签验证和聚焦重跑组保持 `cancel-in-progress: false`。

## Live 和 E2E 分片

发布 live/E2E 子流程保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行，而不是一个串行 job：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分后的 media 音频/视频分片，以及按 provider 过滤的 music 分片

这会保持相同的文件覆盖，同时让缓慢的 live provider 失败更容易重跑和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍然可用于手动一次性重跑。

原生 live media 分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预安装了 `ffmpeg` 和 `ffprobe`；media job 在设置前只会验证这些二进制文件。将 Docker 支持的 live suite 保持在普通 Blacksmith runner 上，容器 job 不是启动嵌套 Docker 测试的正确位置。

Docker 支持的实时模型/后端分片会为每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流会构建并推送该镜像一次，然后 Docker 实时模型、按提供商分片的 Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片都使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway 网关 Docker 分片在脚本层带有显式 `timeout` 上限，低于工作流作业超时，因此卡住的容器或清理路径会快速失败，而不是耗尽整个发布检查预算。如果这些分片各自独立重建完整源码 Docker 目标，则说明发布运行配置错误，并会把挂钟时间浪费在重复镜像构建上。

## 包验收

当问题是“这个可安装的 OpenClaw 包是否能作为产品正常工作？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证源码树，而包验收会通过用户在安装或更新后使用的同一套 Docker E2E harness 来验证单个 tarball。

### 作业

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 构件上传，并在 GitHub 步骤摘要中打印来源、工作流 ref、包 ref、版本、SHA-256 和配置文件。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该构件，验证 tarball 清单，在需要时准备包摘要 Docker 镜像，并针对该包运行所选 Docker 通道，而不是打包工作流检出内容。当某个配置文件选择多个目标 `docker_lanes` 时，可复用工作流会准备一次包和共享镜像，然后将这些通道扇出为并行的目标 Docker 作业，并使用唯一构件。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果包验收解析出了包，它会安装同一个 `package-under-test` 构件；独立 Telegram 分发仍然可以安装已发布的 npm 规范。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时使工作流失败。

### 候选来源

- `source=npm` 仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将它用于已发布预发布版/稳定版验收。
- `source=ref` 打包可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在 detached worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载公开 HTTPS `.tgz`；必须提供 `package_sha256`。此路径会拒绝 URL 凭据、非默认 HTTPS 端口、私有/内部/特殊用途主机名或解析后的 IP，以及跳转到同一公共安全策略之外的重定向。
- `source=trusted-url` 从 `.github/package-trusted-sources.json` 中命名的 trusted-source 策略下载 HTTPS `.tgz`；必须提供 `package_sha256` 和 `trusted_source_id`。仅将它用于维护者拥有的企业镜像或私有包仓库，这些仓库需要配置主机、端口、路径前缀、重定向主机或私有网络解析。如果策略声明 bearer auth，工作流会使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret；仍然拒绝 URL 内嵌凭据。
- `source=artifact` 从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但应为外部共享构件提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的可信工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源码提交。这样当前测试 harness 就能验证较旧的可信源码提交，而不运行旧工作流逻辑。

### 套件配置文件

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 带 OpenWebUI 的完整 Docker 发布路径分块
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

`package` 配置文件使用离线插件覆盖范围，因此已发布包验证不会受实时 ClawHub 可用性限制。可选 Telegram 通道会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` 构件，同时保留已发布 npm 规范路径供独立分发使用。

有关专用更新和插件测试策略，包括本地命令、
Docker 通道、包验收输入、发布默认值和失败分诊，
请参阅 [更新和插件测试](/zh-CN/help/testing-updates-plugins)。

发布检查使用 `source=artifact`、准备好的发布包构件、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` 和 `telegram_mode=mock-openai` 调用包验收。这会让包迁移、更新、实时 ClawHub skill 安装、过期插件依赖清理、已配置插件安装修复、离线插件、插件更新和 Telegram 证明都基于同一个已解析包 tarball。在发布 beta 后，在 Full Release Validation 或 OpenClaw Release Checks 上设置 `release_package_spec`，可针对已发布 npm 包运行同一矩阵而不重新构建；仅当包验收需要与其余发布验证不同的包时，才设置 `package_acceptance_package_spec`。跨 OS 发布检查仍然覆盖 OS 特定的新手引导、安装器和平台行为；包/更新产品验证应从包验收开始。`published-upgrade-survivor` Docker 通道会在阻塞发布路径中为每次运行验证一个已发布包基线。在包验收中，已解析的 `package-under-test` tarball 始终是候选项，而 `published_upgrade_survivor_baseline` 选择回退的已发布基线，默认值为 `openclaw@latest`；失败通道重跑命令会保留该基线。启用 `run_release_soak=true` 或 `release_profile=full` 的 Full Release Validation 会设置 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以扩展到四个最新稳定 npm 发布版，加上固定的插件兼容性边界发布版，以及针对 Feishu 配置、保留的 bootstrap/persona 文件、已配置 OpenClaw 插件安装、波浪号日志路径和过期旧版插件依赖根的 issue 形态 fixture。多基线 published-upgrade survivor 选择会按基线分片为单独的目标 Docker runner 作业。单独的 `Update Migration` 工作流在问题是详尽的已发布更新清理、而不是普通 Full Release CI 覆盖范围时，使用带有 `all-since-2026.4.23` 和 `plugin-deps-cleanup` 的 `update-migration` Docker 通道。本地聚合运行可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传入精确包规范，也可以使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保留单个通道，例如 `openclaw@2026.4.15`，或设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以使用场景矩阵。已发布通道会使用内置的 `openclaw config set` 命令配方配置基线，在 `summary.json` 中记录配方步骤，并在 Gateway 网关启动后探测 `/healthz`、`/readyz` 以及 RPC 状态。Windows 打包和安装器全新通道还会验证已安装包可以从原始绝对 Windows 路径导入 browser-control override。OpenAI 跨 OS agent-turn 冒烟测试在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.5`，因此安装和 Gateway 网关证明会停留在 GPT-5 测试模型上，同时避免 GPT-4.x 默认值。

### 旧版兼容窗口

包验收对已经发布的包有有界的旧版兼容窗口。直到 `2026.4.25` 的包，包括 `2026.4.25-beta.*`，可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可以指向 tarball 省略的文件；
- 当包未暴露该标志时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；
- `update-channel-switch` 可以从 tarball 派生的 fake git fixture 中修剪缺失的 pnpm `patchedDependencies`，并可以记录缺失的持久化 `update.channel`；
- 插件冒烟测试可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重装行为保持不变。

已发布的 `2026.4.26` 包也可以对已经发布的本地构建元数据戳文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，先从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 构件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段计时和重跑命令。优先重跑失败的包配置文件或精确 Docker 通道，而不是重跑完整发布验证。

## 安装冒烟测试

单独的 `Install Smoke` 工作流通过自己的 `preflight` 作业复用同一个作用域脚本。它将冒烟覆盖范围拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径**会针对触及 Docker/包表面、内置插件包/清单变更，或 Docker smoke 作业会执行的核心插件/渠道/Gateway 网关/插件 SDK 表面的拉取请求运行。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会预留 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 gateway-network e2e，验证一个内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile（每个场景的 Docker 运行会单独设定上限）。
- **完整路径**为夜间定时运行、手动派发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的拉取请求保留 QR 包安装和安装器 Docker/更新覆盖。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile smoke 镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关 smoke、安装器/更新 smoke，以及快速内置插件 Docker E2E 作为独立作业运行，因此安装器工作不会被根镜像 smoke 阻塞。

`main` 推送（包括合并提交）不会强制使用完整路径；当变更范围逻辑会在推送上请求完整覆盖时，该工作流会保留快速 Docker smoke，并将完整 install smoke 留给夜间或发布验证。

较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控。它会在夜间计划和发布检查工作流中运行，手动 `Install Smoke` 派发可以选择启用它，但拉取请求和 `main` 推送不会运行。常规 PR CI 仍会针对 Node 相关变更运行快速 Bun launcher 回归通道。QR 和安装器 Docker 测试保留各自以安装为重点的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 用于安装器/更新/插件依赖通道的裸 Node/Git runner；
- 一个功能镜像，会把同一个 tarball 安装到 `/app`，用于常规功能通道。

Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，planner 逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选定的计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道。

### 可调项

| 变量                                   | 默认值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 常规通道的主池槽位数。                                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 对提供商敏感的尾池槽位数。                                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发 live 通道上限，避免提供商限流。                                                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 并发 npm install 通道上限。                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务通道上限。                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 通道启动之间的错峰时间，用于避免 Docker daemon 创建风暴；设为 `0` 表示不做错峰。              |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每通道兜底超时（120 分钟）；选定的 live/tail 通道使用更严格的上限。                           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未设置  | `1` 会打印调度器计划而不运行通道。                                                            |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未设置  | 逗号分隔的精确通道列表；跳过 cleanup smoke，以便智能体复现一个失败通道。                      |

比其有效上限更重的通道仍可从空池启动，然后会独占运行，直到释放容量。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活动通道状态，持久化通道耗时以用于最长优先排序，并且默认在第一次失败后停止调度新的池化通道。

### 可复用 live/E2E 工作流

可复用 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、通道和凭据覆盖。随后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包 artifact，或从 `package_artifact_run_id` 下载包 artifact；验证 tarball 清单；当计划需要已安装包的通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带包 digest 标签的 bare/functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包 digest 镜像，而不是重新构建。Docker 镜像拉取会以有界的每次尝试 180 秒超时重试，因此卡住的 registry/cache 流会快速重试，而不是消耗 CI 关键路径的大部分时间。

### 发布路径分块

发布 Docker 覆盖会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行更小的分块作业，因此每个分块只拉取它需要的镜像类型，并通过同一个加权调度器执行多个通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

当前发布 Docker 分块是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`package-update-openai` 包含 live Codex 插件包通道，该通道会安装候选 OpenClaw 包，从 `codex_plugin_spec` 或同 ref tarball 安装 Codex 插件并明确批准安装 Codex CLI，运行 Codex CLI 预检，然后对 OpenAI 运行多个同会话 OpenClaw 智能体轮次。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合插件/运行时别名。`install-e2e` 通道别名仍是两个提供商安装器通道的聚合手动重跑别名。

当完整 release-path 覆盖请求 OpenWebUI 时，OpenWebUI 会并入 `plugins-runtime-services`，并且只为仅 OpenWebUI 的派发保留独立的 `openwebui` 分块。内置渠道更新通道会针对临时 npm 网络失败重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及每通道重跑命令。工作流的 `docker_lanes` 输入会针对已准备的镜像运行选定通道，而不是运行分块作业，这会把失败通道调试限制在一个目标明确的 Docker 作业内，并为该运行准备、下载或复用包 artifact；如果选定通道是 live Docker 通道，目标作业会为该重跑在本地构建 live-test 镜像。生成的每通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败通道可以复用失败运行中的确切包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

定时 live/E2E 工作流每天运行完整 release-path Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个单独工作流，由 `Full Release Validation` 或明确的操作者派发。常规拉取请求、`main` 推送和独立手动 CI 派发会保持该套件关闭。它会在八个扩展 worker 之间平衡内置插件测试；这些扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并使用更大的 Node heap，因此导入密集的插件批次不会创建额外的 CI 作业。仅发布的 Docker 预发布路径会以小组批处理目标 Docker 通道，以避免为一到三分钟的作业预留数十个 runner。该工作流还会从 `@openclaw/plugin-inspector` 上传一个信息性 `plugin-inspector-advisory` artifact；inspector 发现是分诊输入，不会改变阻塞性的 Plugin Prerelease 门控。

## QA Lab

QA Lab 在主智能范围工作流之外有专用 CI 通道。智能体一致性嵌套在广义 QA 和发布 harness 下，而不是独立 PR 工作流。当一致性应随广义验证运行一起执行时，请使用 `Full Release Validation` 并设置 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动派发；它会将 mock parity 通道、live Matrix 通道，以及 live Telegram 和 Discord 通道扇出为并行作业。Live 作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。

发布检查会使用确定性的 mock 提供商和 mock 限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram live 传输通道，因此渠道契约与 live 模型延迟和常规提供商插件启动隔离。Live 传输 Gateway 网关会禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；提供商连接性由单独的 live 模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 在定时和发布门控中使用 `--profile fast`，仅当检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 派发总是会将完整 Matrix 覆盖分片到 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 还会在发布批准前运行发布关键的 QA Lab 通道；其 QA parity 门控会将候选包和基线包作为并行通道作业运行，然后将两个 artifact 下载到一个小型报告作业中，用于最终一致性比较。

对于常规 PR，请遵循范围化 CI/检查证据，而不是将 parity 视为必需状态。

## CodeQL

`CodeQL` 工作流有意作为范围较窄的第一轮安全扫描器，而不是完整仓库扫描。每日、手动和非草稿拉取请求守卫运行会扫描 Actions 工作流代码以及最高风险的 JavaScript/TypeScript 表面，并使用高置信度安全查询，过滤到 high/critical `security-severity`。

拉取请求守卫保持轻量：它只会针对 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的变更启动，并运行与定时工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不包含在 PR 默认项中。

### 安全类别

| 类别                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 凭证、密钥、沙箱、cron 和 Gateway 网关基线                                                                                          |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥、审计接触点                                                       |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络防护、web-fetch 和插件 SDK SSRF 策略表面                                                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助工具、出站投递，以及智能体工具执行门禁                                                                      |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、清单、注册表、包管理器安装、源码加载，以及插件 SDK 包契约信任表面                                                 |

### 平台特定的安全分片

- `CodeQL Android Critical Security` — 定时运行的 Android 安全分片。在工作流完整性检查接受的最小 Blacksmith Linux runner 上，为 CodeQL 手动构建 Android 应用。上传到 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每周/手动运行的 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并上传到 `/codeql-critical-security/macos`。它保留在每日默认项之外，因为即使结果干净，macOS 构建也会主导运行时间。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它只在 GitHub 托管的 Linux runner 上，对窄范围高价值表面运行错误严重级别的非安全 JavaScript/TypeScript 质量查询，这样质量扫描就不会消耗 Blacksmith runner 注册预算。它的拉取请求门禁刻意小于定时配置文件：非草稿 PR 仅在智能体命令/模型/工具执行和回复分发代码、配置架构/迁移/IO 代码、凭证/密钥/沙箱/安全代码、核心渠道和内置渠道插件运行时、Gateway 网关协议/服务器方法、记忆运行时/SDK 胶水、MCP/进程/出站投递、提供商运行时/模型目录、会话诊断/投递队列、插件加载器、插件 SDK/包契约，或插件 SDK 回复运行时发生更改时，运行匹配的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 配置和质量工作流更改会运行全部十二个 PR 质量分片。

手动分发接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

这些窄配置文件是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 表面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 凭证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                                |
| `/codeql-critical-quality/config-boundary`              | 配置架构、迁移、规范化和 IO 契约                                                                                                                                 |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议架构和服务器方法契约                                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约                                                                                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥、进程监督辅助工具，以及出站投递契约                                                                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆主机 SDK、记忆运行时 facade、记忆插件 SDK 别名、记忆运行时激活胶水，以及记忆 Doctor 命令                                                                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递辅助工具、诊断事件/日志包表面，以及会话 Doctor CLI 契约                                                        |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复载荷/分块/运行时辅助工具、渠道回复选项、投递队列，以及会话/线程绑定辅助工具                                                          |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商凭证和设备发现、提供商运行时注册、提供商默认值/目录，以及 Web/搜索/抓取/嵌入注册表                                                        |
| `/codeql-critical-quality/ui-control-plane`             | Control UI 引导、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 Web 抓取/搜索、媒体 IO、媒体理解、图像生成，以及媒体生成运行时契约                                                                                          |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公共表面，以及插件 SDK 入口点契约                                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧插件 SDK 源码和插件包契约辅助工具                                                                                                                      |

质量与安全保持分离，这样质量发现就可以在不掩盖安全信号的情况下进行定时、度量、禁用或扩展。Swift、Python 和内置插件 CodeQL 扩展只应在窄配置文件具有稳定运行时间和信号后，作为有范围或分片的后续工作加回。

## 维护工作流

### 文档 Agent

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的更改保持一致。它没有纯定时计划：`main` 上成功的非 bot push CI 运行可以触发它，手动分发也可以直接运行它。当 `main` 已前进，或过去一小时内已创建另一个未跳过的 Docs Agent 运行时，工作流运行调用会跳过。运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档检查以来累积的所有 main 更改。

### 测试性能 Agent

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上成功的非 bot push CI 运行可以触发它，但如果当天 UTC 已经有另一个工作流运行调用运行过或正在运行，它会跳过。手动分发会绕过该每日活动门禁。该通道会构建完整套件分组 Vitest 性能报告，让 Codex 只做小型、保留覆盖率的测试性能修复，而不是宽泛重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的更改。分组报告会记录 Linux 和 macOS 上每个配置的挂钟时间和最大 RSS，因此前后对比会在耗时差异旁边呈现测试内存差异。如果基线存在失败测试，Codex 只能修复明显失败，并且 Agent 之后的完整套件报告必须通过，才会提交任何内容。当 `main` 在 bot push 落地前前进时，该通道会将已验证补丁变基，重新运行 `pnpm check:changed`，并重试 push；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 可以保持与文档 Agent 相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是用于落地后重复项清理的手动维护者工作流。它默认 dry-run，并且只有在 `apply=true` 时才会关闭明确列出的 PR。在变更 GitHub 之前，它会验证已落地 PR 已合并，并验证每个重复 PR 要么共享引用的问题，要么有重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门禁和变更路由

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁在架构边界上比宽泛的 CI 平台范围更严格：

- 核心生产更改会运行核心生产和核心测试类型检查，以及核心 lint/guard；
- 仅核心测试更改只运行核心测试类型检查，以及核心 lint；
- 扩展生产更改会运行扩展生产和扩展测试类型检查，以及扩展 lint；
- 仅扩展测试更改会运行扩展测试类型检查，以及扩展 lint；
- 公共插件 SDK 或插件契约更改会扩展到扩展类型检查，因为扩展依赖这些核心契约（Vitest 扩展 sweep 仍是显式测试工作）；
- 仅发布元数据的版本号提升会运行有针对性的版本/配置/根依赖检查；
- 未知根目录/配置更改会 fail safe 到所有检查通道。

本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且刻意比 `check:changed` 更便宜：直接测试编辑会运行自身，源码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置是其中一个显式映射：对群组可见回复配置、源回复投递模式，或消息工具系统提示词的更改会路由到核心回复测试，以及 Discord 和 Slack 投递回归测试，这样共享默认值更改会在首次 PR push 前失败。仅当变更的范围大到整个 harness，便宜的映射集合不再是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

Crabbox 是仓库自有的远程机器封装器，用于维护者 Linux 证明。当检查对本地编辑循环过宽、CI 一致性很重要，或证明需要密钥、Docker、包通道、可复用机器或远程日志时，请从仓库根目录使用它。常规 OpenClaw 后端是 `blacksmith-testbox`；自有 AWS/Hetzner 容量是 Blacksmith 故障、配额问题，或显式自有容量测试时的 fallback。

Crabbox 支持的 Blacksmith 运行会预热、申领、同步、运行、报告并清理
一次性 Testboxes。内置同步完整性检查会在必需的
根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short`
显示至少 200 个已跟踪删除项时快速失败。对于有意进行的大规模删除 PR，请为
远程命令设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

如果本地 Blacksmith CLI 调用停留在
同步阶段超过五分钟且没有同步后输出，Crabbox 也会终止该调用。设置
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可禁用该保护，或为异常大的本地 diff 使用更大的
毫秒值。

首次运行前，从仓库根目录检查包装器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

如果 Crabbox 二进制文件已过期且未声明 `blacksmith-testbox`，仓库包装器会拒绝运行。即使 `.crabbox.yaml` 已有 owned-cloud 默认值，也要显式传入提供商。在 Codex 工作树或链接/稀疏检出中，避免使用本地 `pnpm crabbox:run` 脚本，因为 pnpm 可能会在 Crabbox 启动前协调依赖；改为直接调用 node 包装器：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith 支持的运行需要 Crabbox 0.22.0 或更新版本，以便包装器获得当前 Testbox 同步、队列和清理行为。使用同级检出时，在计时或证明工作前重新构建被忽略的本地二进制文件：

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

阅读最终 JSON 摘要。有用字段是 `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。对于委托的
Blacksmith Testbox 运行，Crabbox 包装器退出码和 JSON 摘要就是
命令结果。关联的 GitHub Actions 运行负责水合和 keepalive；当 SSH
命令已经返回后 Testbox 被外部停止时，它可能以 `cancelled` 结束。除非
包装器 `exitCode` 非零，或命令输出显示测试失败，否则将其视为清理/状态产物。
一次性 Blacksmith 支持的 Crabbox 运行应自动停止 Testbox；
如果运行被中断或清理情况不明确，请检查在线 boxes，并只停止
你创建的 boxes：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

仅当你有意需要在同一个已水合 box 上运行多个命令时才使用复用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是损坏层，但 Blacksmith 本身可用，仅将直接
Blacksmith 用于 `list`、`status` 和清理等诊断。先修复
Crabbox 路径，再将直接 Blacksmith 运行视为维护者证明。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可用，但新的
warmups 在几分钟后仍停留在 `queued`，且没有 IP 或 Actions 运行 URL，
请将其视为 Blacksmith 提供商、队列、计费或组织限制压力。停止你创建的
queued ids，避免启动更多 Testboxes，并将证明转移到下面的
owned Crabbox 容量路径，同时让相关人员检查 Blacksmith dashboard、
计费和组织限制。

只有在 Blacksmith 停机、受配额限制、缺少所需环境，或明确以 owned capacity 为目标时，才升级到 owned Crabbox capacity：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 压力下，除非任务确实需要 48xlarge 级 CPU，否则避免使用 `class=beast`。一次 `beast` 请求从 192 vCPU 起步，也是最容易触发区域 EC2 Spot 或 On-Demand Standard 配额的方式。仓库拥有的 `.crabbox.yaml` 默认使用 `standard`、多个容量区域和 `capacity.hints: true`，因此经纪的 AWS 租约会输出所选区域/市场、配额压力、Spot 回退和高压力 class 警告。较重的宽范围检查使用 `fast`，仅在 standard/fast 不足时使用 `large`，只有在完整套件或全插件 Docker 矩阵、显式 release/blocker 验证，或高核心性能分析等特殊 CPU 密集型通道中才使用 `beast`。不要将 `beast` 用于 `pnpm check:changed`、聚焦测试、仅文档工作、普通 lint/typecheck、小型 E2E 复现或 Blacksmith 故障分诊。容量诊断请使用 `--market on-demand`，这样 Spot 市场波动不会混入信号。

`.crabbox.yaml` 拥有 owned-cloud 通道的提供商、同步和 GitHub Actions 水合默认值。它排除本地 `.git`，因此已水合的 Actions 检出会保留自己的远程 Git 元数据，而不是同步维护者本地的 remotes 和对象存储；它还排除绝不应传输的本地运行时/构建产物。`.github/workflows/crabbox-hydrate.yml` 拥有 owned-cloud `crabbox run --id <cbx_id>` 命令的检出、Node/pnpm 设置、`origin/main` 获取，以及非密钥环境交接。

## 相关

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
