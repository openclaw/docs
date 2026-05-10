---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试一个失败的 GitHub Actions 检查
    - 你正在协调一次发布验证运行或重新运行
    - 你正在更改 ClawSweeper 调度或 GitHub 活动转发
summary: CI 作业图、范围门禁、发布总括项和本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-05-10T19:24:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 会在每次推送到 `main` 和每个拉取请求时运行。`preflight` 作业会分类差异，并在仅不相关区域发生变更时关闭昂贵的通道。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为候选发布和广泛验证展开完整图。Android 通道通过 `include_android` 保持选择加入。仅发布时的插件覆盖位于单独的 [`插件预发布`](#plugin-prerelease) 工作流中，并且只会从 [`完整发布验证`](#full-release-validation) 或显式手动调度运行。

## 流水线概览

| 作业                              | 用途                                                                                                   | 运行时机                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更扩展，并构建 CI 清单                   | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                     | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm 安全公告进行无需依赖安装的生产 lockfile 审计                                          | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全作业所需的聚合结果                                                             | 始终在非草稿推送和 PR 上运行 |
| `check-dependencies`             | 生产 Knip 仅依赖检查，以及未使用文件 allowlist 保护                                 | Node 相关变更              |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物                       | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置插件、插件契约和协议检查                              | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                      | Node 相关变更              |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和扩展通道                          | Node 相关变更              |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、保护检查、测试类型和严格 smoke                | Node 相关变更              |
| `check-additional`               | 架构、分片边界和提示词漂移、扩展保护、包边界，以及 Gateway 网关 watch        | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                                            | Node 相关变更              |
| `checks`                         | 构建产物渠道测试的验证器                                                                 | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                                | 发布用手动 CI 调度    |
| `check-docs`                     | 文档格式化、lint 和断链检查                                                             | 文档变更                       |
| `skills-python`                  | Python 支持的 Skills 的 Ruff + pytest                                                                    | Python Skill 相关变更      |
| `checks-windows`                 | Windows 专用进程和路径测试，以及共享运行时导入说明符回归检查                      | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                               | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                            | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建                                              | Android 相关变更           |
| `test-performance-agent`         | 可信活动后的每日 Codex 慢测试优化                                                 | 主 CI 成功或手动调度 |
| `openclaw-performance`           | 按日或按需生成的 Kova 运行时性能报告，包含 mock-provider、deep-profile 和 GPT 5.4 live 通道 | 定时和手动调度      |

## 快速失败顺序

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道重叠执行，使下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

当同一 PR 或 `main` 引用上有更新的推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已被取代后继续排队。自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸项无法无限阻塞更新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

`ci-timings-summary` 作业会为每个非草稿 CI 运行上传一个紧凑的 `ci-timings-summary` 产物。它记录当前运行的墙钟时间、排队时间、最慢作业和失败作业，因此 CI 健康检查不需要反复抓取完整的 Actions payload。

## 范围和路由

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动调度会跳过变更范围检测，并让 preflight 清单表现得像每个有范围的区域都发生了变更。

- **CI 工作流编辑**会验证 Node CI 图以及工作流 linting，但本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍限定于平台源代码变更。
- **仅 CI 路由编辑、选定的廉价核心测试 fixture 编辑，以及窄范围插件契约辅助函数和测试路由编辑**使用快速 Node-only 清单路径：`preflight`、安全检查，以及单个 `checks-fast-core` 任务。当变更仅限于该快速任务直接覆盖的路由或辅助表面时，此路径会跳过构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外保护矩阵。
- **Windows Node 检查**限定于 Windows 专用进程和路径包装器、npm/pnpm/UI runner 辅助函数、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源代码、插件、安装 smoke 和仅测试变更仍留在 Linux Node 通道上。

最慢的 Node 测试族会被拆分或均衡，以便每个作业保持较小规模且不过度预留 runner：渠道契约以三个加权 Blacksmith 支持的分片运行，并带有标准 GitHub runner 回退；核心单元 fast/support 通道单独运行；核心运行时基础设施拆分为 state、process/config、cron 和 shared 分片；auto-reply 以均衡 worker 运行（reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片）；agentic Gateway 网关/server 配置拆分为 chat/auth/model/http-plugin/runtime/startup 通道，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享插件 catch-all。include-pattern 分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和过滤后的分片。`check-additional` 将包边界编译和 canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分离；边界保护列表被条带化为四个矩阵分片，每个分片并发运行选定的独立保护检查，并打印每项检查的计时。昂贵的 Codex happy-path 提示词快照漂移检查作为自己的额外作业运行，仅用于手动 CI 和影响提示词的变更，因此普通不相关的 Node 变更不会被冷启动提示词快照生成阻塞，边界分片也能保持均衡，同时提示词漂移仍会固定到导致它的 PR；同一标志还会跳过构建产物核心 support-boundary 分片内的提示词快照 Vitest 生成。Gateway 网关 watch、渠道测试和核心 support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建后，于 `build-artifacts` 内并发运行。

Android CI 会运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。third-party flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送中重复执行 debug APK 打包作业。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`（生产 Knip 仅依赖检查，固定到最新 Knip 版本，并为 `dlx` 安装禁用 pnpm 的最低发布年龄）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 添加新的未经审查的未使用文件，或留下过时的 allowlist 条目时，未使用文件保护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成产物、构建、live-test 和包桥接表面。

## ClawSweeper 活动转发

`.github/workflows/clawsweeper-dispatch.yml` 是从 OpenClaw 仓库活动到 ClawSweeper 的目标侧桥接。它不会 checkout 或执行不可信的拉取请求代码。该工作流会从 `CLAWSWEEPER_APP_PRIVATE_KEY` 创建 GitHub App token，然后向 `openclaw/clawsweeper` 调度紧凑的 `repository_dispatch` payload。

该工作流有四个通道：

- `clawsweeper_item` 用于精确的 issue 和拉取请求评审请求；
- `clawsweeper_comment` 用于 issue 评论中的显式 ClawSweeper 命令；
- `clawsweeper_commit_review` 用于 `main` 推送上的提交级评审请求；
- `github_activity` 用于 ClawSweeper 智能体可能检查的一般 GitHub 活动。

`github_activity` 通道仅转发规范化元数据：事件类型、动作、actor、仓库、条目编号、URL、标题、状态，以及存在评论或评审时的短摘录。它有意避免转发完整 webhook body。`openclaw/clawsweeper` 中的接收工作流是 `.github/workflows/github-activity.yml`，它会将规范化事件发布到 ClawSweeper 智能体的 OpenClaw Gateway 网关钩子。

一般活动是观察，而不是默认交付。ClawSweeper 智能体会在其提示词中接收 Discord 目标，并且只应在事件令人意外、可操作、有风险或对运维有用时发布到 `#clawsweeper`。常规打开、编辑、bot churn、重复 webhook 噪声和正常评审流量应产生 `NO_REPLY`。

将 GitHub 标题、评论、正文、评审文本、分支名称和提交消息在整个路径中都视为不受信任的数据。它们是用于摘要和分诊的输入，不是工作流或智能体运行时的指令。

## 手动调度

手动 CI 调度运行与常规 CI 相同的作业图，但会强制启用所有非 Android 范围的通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立的手动 CI 调度仅在 `include_android=true` 时运行 Android；完整发布总入口通过传递 `include_android=true` 启用 Android。插件预发布静态检查、仅发布用的 `agentic-plugins` 分片、完整插件批量扫描和插件预发布 Docker 通道不包含在 CI 中。Docker 预发布套件仅在 `Full Release Validation` 以启用发布验证门的方式调度单独的 `Plugin Prerelease` 工作流时运行。

手动运行使用唯一的并发组，因此候选发布的完整套件不会被同一 ref 上的另一次推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任的调用方在使用所选调度 ref 中的工作流文件时，针对分支、标签或完整提交 SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片的渠道契约检查、除 lint 以外的 `check` 分片、`check-additional` 聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 预检也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke、Linux Node 测试分片、内置插件测试分片、`check-additional` 分片、`android`                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`、`check-lint`（对 CPU 足够敏感，以至于 8 vCPU 的成本超过了节省）；install-smoke Docker 构建（32-vCPU 排队时间成本超过了节省）                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

规范仓库 CI 保持 Blacksmith 作为默认运行器路径。在 `preflight` 期间，`scripts/ci-runner-labels.mjs` 会检查最近已排队和正在进行的 Actions 运行，寻找已排队的 Blacksmith 作业。如果某个特定 Blacksmith 标签已经有排队作业，那么本次运行中会使用该确切标签的下游作业会回退到匹配的 GitHub 托管运行器（`ubuntu-24.04`、`windows-2025` 或 `macos-latest`）。同一 OS 系列中的其他 Blacksmith 规格仍保留在其主标签上。如果 API 探测失败，则不应用回退。

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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw 性能

`OpenClaw Performance` 是产品/运行时性能工作流。它每天在 `main` 上运行，也可以手动调度：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手动调度通常对工作流 ref 进行基准测试。设置 `target_ref` 可使用当前工作流实现对发布标签或另一个分支进行基准测试。已发布的报告路径和 latest 指针按被测试的 ref 建立键，每个 `index.md` 记录被测试的 ref/SHA、工作流 ref/SHA、Kova ref、配置文件、通道凭证模式、模型、重复次数和场景过滤器。

该工作流从固定版本安装 OCM，并从 `openclaw/Kova` 的固定 `kova_ref` 输入安装 Kova，然后运行三个通道：

- `mock-provider`：使用确定性的假 OpenAI 兼容凭证，针对本地构建运行时运行 Kova 诊断场景。
- `mock-deep-profile`：针对启动、Gateway 网关 和智能体轮次热点进行 CPU/堆/跟踪性能分析。
- `live-gpt54`：真实的 OpenAI `openai/gpt-5.4` 智能体轮次，在 `OPENAI_API_KEY` 不可用时跳过。

mock-provider 通道还会在 Kova 通过后运行 OpenClaw 原生源码探针：默认、钩子和 50 个插件启动场景下的 Gateway 网关 启动耗时和内存；重复的 mock-OpenAI `channel-chat-baseline` hello 循环；以及针对已启动 Gateway 网关的 CLI 启动命令。源码探针 Markdown 摘要位于报告包中的 `source/index.md`，原始 JSON 位于旁边。

每个通道都会上传 GitHub 工件。当配置了 `CLAWGRIT_REPORTS_TOKEN` 时，该工作流还会把 `report.json`、`report.md`、包、`index.md` 和源码探针工件提交到 `openclaw/clawgrit-reports`，路径为 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`。当前被测试 ref 的指针写入为 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整发布验证

`Full Release Validation` 是用于“发布前运行所有内容”的手动总入口工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，调度 `Plugin Prerelease` 以获取仅发布用的插件/包/静态/Docker 证明，并调度 `OpenClaw Release Checks` 以运行安装冒烟、包验收、跨 OS 包检查、QA Lab 对等性、Matrix 和 Telegram 通道。稳定/默认运行通过 `run_release_soak=true` 将详尽的 live/E2E 和 Docker 发布路径覆盖保留在后面；`release_profile=full` 会强制启用该 soak 覆盖，因此广泛的公告验证仍然保持广泛。使用 `rerun_group=all` 和 `release_profile=full` 时，它还会针对来自发布检查的 `release-package-under-test` 工件运行 `NPM Telegram Beta E2E`。发布后，传递 `npm_telegram_package_spec` 可针对已发布的 npm 包重新运行同一个 Telegram 包通道。

请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解
阶段矩阵、精确的工作流作业名称、配置文件差异、工件和
聚焦重跑句柄。

`OpenClaw Release Publish` 是手动的变更型发布工作流。在发布标签存在且
OpenClaw npm 预检成功后，从 `release/YYYY.M.D` 或 `main` 调度它。它会验证 `pnpm plugins:sync:check`，
为所有可发布的插件包调度 `Plugin NPM Release`，
为同一个发布 SHA 调度 `Plugin ClawHub Release`，然后才使用保存的
`preflight_run_id` 调度 `OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

对于快速变化分支上的固定提交证明，请使用辅助命令，而不是
`gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流分派引用必须是分支或标签，不能是原始提交 SHA。该辅助命令会在目标 SHA 上推送一个临时的 `release-ci/<sha>-...` 分支，从该固定引用分派 `Full Release Validation`，验证每个子工作流的 `headSha` 都匹配目标，并在运行完成后删除临时分支。如果任何子工作流在不同 SHA 上运行，伞形验证器也会失败。

`release_profile` 控制传递给发布检查的实时/提供商覆盖范围。手动发布工作流默认使用 `stable`；只有在你有意需要广泛的建议性提供商/媒体矩阵时，才使用 `full`。`run_release_soak` 控制 stable/default 发布检查是否运行穷尽的实时/E2E 和 Docker 发布路径 soak；`full` 会强制启用 soak。

- `minimum` 保留最快的 OpenAI/核心发布关键通道。
- `stable` 添加稳定的提供商/后端集合。
- `full` 运行广泛的建议性提供商/媒体矩阵。

伞形工作流会记录已分派的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行附加最慢作业表。如果某个子工作流被重新运行并变为绿色，只需重新运行父验证器作业，即可刷新伞形结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版使用 `all`，仅普通完整 CI 子项使用 `ci`，仅插件预发布子项使用 `plugin-prerelease`，所有发布子项使用 `release-checks`，也可以在伞形工作流上使用更窄的分组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样在进行针对性修复后，可以让失败的发布盒子重跑保持有界。对于单个失败的跨 OS 通道，将 `rerun_group=cross-os` 与 `cross_os_suite_filter` 组合使用，例如 `windows/packaged-upgrade`；长时间运行的跨 OS 命令会发出 Heartbeat 行，packaged-upgrade 摘要会包含每阶段耗时。QA 发布检查通道是建议性的，因此仅 QA 失败会发出警告，但不会阻塞发布检查验证器。

`OpenClaw Release Checks` 使用受信任的工作流引用，将所选引用解析一次为 `release-package-under-test` tarball，然后将该产物传递给跨 OS 检查和软件包验收，并在运行 soak 覆盖时传递给实时/E2E 发布路径 Docker 工作流。这样可以在发布盒子之间保持软件包字节一致，并避免在多个子作业中重复打包同一个候选版本。

对于 `ref=main` 和 `rerun_group=all` 的重复 `Full Release Validation` 运行，会取代较旧的伞形工作流。父监视器会在父项被取消时取消它已经分派的任何子工作流，因此新的 main 验证不会排在过时的两小时发布检查运行之后。发布分支/标签验证和针对性重跑分组会保持 `cancel-in-progress: false`。

## 实时和 E2E 分片

发布实时/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行，而不是一个串行作业：

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

这会保持相同的文件覆盖，同时让慢速实时提供商失败更易于重跑和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍然可用于手动一次性重跑。

原生实时媒体分片运行在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装了 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证这些二进制文件。将 Docker 支持的实时套件保留在普通 Blacksmith runner 上运行，容器作业不适合启动嵌套 Docker 测试。

Docker 支持的实时模型/后端分片会为每个所选提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流会构建并推送该镜像一次，然后 Docker 实时模型、按提供商分片的 Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway 网关 Docker 分片带有明确的脚本级 `timeout` 上限，低于工作流作业超时，这样卡住的容器或清理路径会快速失败，而不是消耗整个发布检查预算。如果这些分片独立重建完整源 Docker 目标，则发布运行配置错误，并会在重复镜像构建上浪费墙钟时间。

## 软件包验收

当问题是“这个可安装的 OpenClaw 软件包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证源代码树，而软件包验收会通过用户在安装或更新后实际使用的同一个 Docker E2E harness 来验证单个 tarball。

### 作业

1. `resolve_package` 检出 `workflow_ref`，解析一个软件包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者作为 `package-under-test` 产物上传，并在 GitHub 步骤摘要中打印来源、工作流引用、软件包引用、版本、SHA-256 和 profile。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该产物，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该软件包运行所选 Docker 通道，而不是打包工作流检出内容。当某个 profile 选择多个定向 `docker_lanes` 时，可复用工作流会准备一次软件包和共享镜像，然后将这些通道作为并行定向 Docker 作业扇出，并使用唯一产物。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时它会运行，并且在软件包验收解析出一个软件包时安装同一个 `package-under-test` 产物；独立 Telegram 分派仍然可以安装已发布的 npm spec。
4. `summary` 会在软件包解析、Docker 验收或可选 Telegram 通道失败时让工作流失败。

### 候选来源

- `source=npm` 仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将它用于已发布的预发布版/稳定版验收。
- `source=ref` 会打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离 worktree 中安装依赖，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact` 从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但对于外部共享产物应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样当前测试 harness 可以验证较旧的受信任源提交，而无需运行旧的工作流逻辑。

### 套件 profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 带 OpenWebUI 的完整 Docker 发布路径块
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

`package` profile 使用离线插件覆盖，因此已发布软件包验证不会受实时 ClawHub 可用性约束。可选 Telegram 通道会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` 产物，并保留已发布 npm spec 路径用于独立分派。

有关专用的更新和插件测试策略，包括本地命令、Docker 通道、软件包验收输入、发布默认值和失败分诊，请参阅 [更新和插件测试](/zh-CN/help/testing-updates-plugins)。

发布检查调用软件包验收时会使用 `source=artifact`、已准备好的发布软件包产物、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` 和 `telegram_mode=mock-openai`。这样可以在同一个已解析的软件包 tarball 上完成软件包迁移、更新、实时 ClawHub Skills 安装、陈旧插件依赖清理、已配置插件安装修复、离线插件、plugin-update 和 Telegram 证明。在 Full Release Validation 或 OpenClaw Release Checks 上设置 `package_acceptance_package_spec`，即可针对已发货的 npm 软件包运行同一个矩阵，而不是针对按 SHA 构建的产物运行。跨 OS 发布检查仍然覆盖 OS 特定的新手引导、安装器和平台行为；软件包/更新产品验证应从软件包验收开始。`published-upgrade-survivor` Docker 通道会在阻塞发布路径中每次运行验证一个已发布软件包基线。在软件包验收中，解析出的 `package-under-test` tarball 始终是候选，`published_upgrade_survivor_baseline` 选择回退的已发布基线，默认值为 `openclaw@latest`；失败通道重跑命令会保留该基线。带有 `run_release_soak=true` 或 `release_profile=full` 的 Full Release Validation 会设置 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以扩展到最新四个稳定 npm 发布版，以及固定的插件兼容性边界发布版和问题形状的夹具，覆盖 Feishu 配置、保留的 bootstrap/persona 文件、已配置的 OpenClaw 插件安装、波浪号日志路径和陈旧的遗留插件依赖根。多基线 published-upgrade survivor 选择会按基线分片到单独的定向 Docker runner 作业。单独的 `Update Migration` 工作流在问题是穷尽式已发布更新清理，而不是普通 Full Release CI 覆盖范围时，会使用带 `all-since-2026.4.23` 和 `plugin-deps-cleanup` 的 `update-migration` Docker 通道。本地聚合运行可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传入精确的软件包 spec，通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持单个通道，例如 `openclaw@2026.4.15`，或设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 来运行场景矩阵。已发布通道会使用内置的 `openclaw config set` 命令配方配置基线，在 `summary.json` 中记录配方步骤，并在 Gateway 网关启动后探测 `/healthz`、`/readyz` 以及 RPC Status。Windows 打包版和安装器全新安装通道还会验证已安装的软件包可以从原始绝对 Windows 路径导入 browser-control 覆盖。OpenAI 跨 OS agent 轮次冒烟测试在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因此安装和 Gateway 网关证明会保持在 GPT-5 测试模型上，同时避免 GPT-4.x 默认值。

### 旧版兼容窗口

包验收为已发布的包提供有界的旧版兼容窗口。直到 `2026.4.25` 的包（包括 `2026.4.25-beta.*`）可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可以指向 tarball 中省略的文件；
- 当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过其持久化子用例；
- `update-channel-switch` 可以从基于 tarball 派生的伪 git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；
- 插件冒烟测试可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和无重装行为保持不变。

已发布的 `2026.4.26` 包也可以对已经发布过的本地构建元数据戳文件发出警告。后续包必须满足现代合约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，先查看 `resolve_package` 摘要，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段耗时和重跑命令。优先重跑失败的包 profile 或精确的 Docker lane，而不是重跑完整发布验证。

## 安装冒烟测试

独立的 `Install Smoke` workflow 通过自己的 `preflight` job 复用同一个范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径**会在 pull request 触及 Docker/包表面、内置插件包/清单变更，或 Docker 冒烟 job 会覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面时运行。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟测试，运行容器 gateway-network e2e，验证一个内置 extension 构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile（每个场景的 Docker run 会单独设置上限）。
- **完整路径**为夜间定时运行、手动调度、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的 pull request 保留 QR 包安装和安装器 Docker/更新覆盖。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟测试、安装器/更新冒烟测试，以及快速内置插件 Docker E2E 作为独立 job 运行，避免安装器工作排在根镜像冒烟测试之后等待。

`main` push（包括 merge commit）不会强制完整路径；当变更范围逻辑在 push 上请求完整覆盖时，workflow 会保留快速 Docker 冒烟测试，并将完整安装冒烟测试留给夜间或发布验证。

较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独控制。它会在夜间计划和发布检查 workflow 中运行，手动 `Install Smoke` 调度也可以选择加入它，但 pull request 和 `main` push 不会运行。QR 和安装器 Docker 测试保留各自以安装为重点的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 用于安装器/更新/插件依赖 lane 的裸 Node/Git runner；
- 一个功能镜像，将同一个 tarball 安装到 `/app`，用于普通功能 lane。

Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，planner 逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选中的计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 lane。

### 可调参数

| 变量                                   | 默认值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 普通 lane 的主池 slot 数。                                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider 敏感尾池 slot 数。                                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发 live lane 上限，避免 providers 限流。                                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 并发 npm install lane 上限。                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务 lane 上限。                                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 启动之间的错峰间隔，避免 Docker daemon 创建风暴；设为 `0` 表示不错峰。                   |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每个 lane 的兜底超时（120 分钟）；选定的 live/tail lane 使用更严格的上限。                    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 会打印调度器计划而不运行 lane。                                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 逗号分隔的精确 lane 列表；跳过清理冒烟测试，以便 agents 复现单个失败 lane。                  |

比其有效上限更重的 lane 仍可从空池启动，然后独占运行，直到释放容量。本地聚合流程会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活动 lane 状态，持久化 lane 耗时以用于最长优先排序，并且默认在第一次失败后停止调度新的池化 lane。

### 可复用 live/E2E workflow

可复用 live/E2E workflow 会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、lane 和凭证覆盖。随后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包工件，或从 `package_artifact_run_id` 下载包工件；验证 tarball 清单；当计划需要已安装包的 lane 时，通过 Blacksmith 的 Docker layer cache 构建并推送带 package-digest 标签的 bare/functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有 package-digest 镜像，而不是重建。Docker 镜像拉取会使用有界的每次 180 秒超时进行重试，使卡住的 registry/cache stream 能快速重试，而不是占用 CI 关键路径的大部分时间。

### 发布路径分块

发布 Docker 覆盖使用更小的分块 job，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取所需的镜像类型，并通过同一个加权调度器执行多个 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

当前发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及从 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍作为聚合插件/运行时别名保留。`install-e2e` lane 别名仍是两个 provider 安装器 lane 的聚合手动重跑别名。

当完整 release-path 覆盖请求 OpenWebUI 时，OpenWebUI 会并入 `plugins-runtime-services`，仅在 OpenWebUI-only 调度时保留独立的 `openwebui` 分块。内置渠道更新 lane 会针对临时 npm 网络故障重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢 lane 表，以及每个 lane 的重跑命令。workflow 的 `docker_lanes` 输入会针对已准备的镜像运行选定 lane，而不是运行分块 job，这会把失败 lane 调试限定在一个有针对性的 Docker job，并为该运行准备、下载或复用包工件；如果选定 lane 是 live Docker lane，目标 job 会为该重跑在本地构建 live-test 镜像。生成的每个 lane GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败 lane 可以复用失败运行中的精确包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

计划的 live/E2E workflow 每天运行完整的 release-path Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个由 `Full Release Validation` 或明确操作员调度的独立 workflow。普通 pull request、`main` push 和独立手动 CI 调度会保持该套件关闭。它会在八个 extension worker 之间均衡内置插件测试；这些 extension shard job 每次最多运行两个插件配置组，每个组使用一个 Vitest worker 和更大的 Node heap，避免 import-heavy 插件批次创建额外 CI job。仅发布的 Docker 预发布路径会将目标 Docker lane 分成小组批处理，避免为一到三分钟的 job 占用数十个 runner。

## QA Lab

QA Lab 在主要 smart-scoped workflow 之外有专用 CI lane。Agentic parity 嵌套在广泛 QA 和发布 harness 之下，而不是独立的 PR workflow。当 parity 需要随广泛验证运行一起执行时，使用 `Full Release Validation` 并设置 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` workflow 每晚在 `main` 上运行，也可手动调度；它会将 mock parity lane、live Matrix lane，以及 live Telegram 和 Discord lane 扩展为并行 job。Live job 使用 `qa-live-shared` environment，Telegram/Discord 使用 Convex leases。

发布检查使用确定性 mock provider 和 mock 限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，以便将渠道契约与实时模型延迟和常规 provider 插件启动隔离开。实时传输 Gateway 网关会禁用记忆搜索，因为 QA 对等性会单独覆盖记忆行为；提供商连接性由单独的实时模型、原生 provider 和 Docker provider 套件覆盖。

Matrix 在计划任务和发布门禁中使用 `--profile fast`，仅在签出的 CLI 支持时添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分发始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 还会在发布批准前运行发布关键的 QA Lab 通道；它的 QA 对等性门禁会将候选包和基线包作为并行通道作业运行，然后把两个构件下载到一个小型报告作业中，进行最终对等性比较。

对于常规 PR，请遵循有范围的 CI/检查证据，而不是把对等性视为必需状态。

## CodeQL

`CodeQL` 工作流有意作为范围很窄的第一轮安全扫描器，而不是完整仓库扫描。每日、手动和非草稿拉取请求保护运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 表面，并使用高置信度安全查询，筛选高/严重 `security-severity`。

拉取请求保护保持轻量：它只会在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下发生更改时启动，并运行与计划工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不包含在 PR 默认设置中。

### 安全类别

| 类别                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 认证、密钥、沙箱、cron 和 Gateway 网关基线                                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和审计接触点                                                     |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络保护、web-fetch 和插件 SDK SSRF 策略表面                                                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行帮助器、出站投递和 agent 工具执行门禁                                                                          |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、清单、注册表、包管理器安装、源代码加载和插件 SDK 包契约信任表面                                                  |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 计划运行的 Android 安全分片。为 CodeQL 手动构建 Android 应用，使用工作流完整性检查接受的最小 Blacksmith Linux runner。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中筛掉依赖构建结果，并上传到 `/codeql-critical-security/macos` 下。由于 macOS 构建即使干净也主导运行时间，因此不包含在每日默认设置中。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它只在较小的 Blacksmith Linux runner 上，对范围很窄的高价值表面运行错误严重级别、非安全 JavaScript/TypeScript 质量查询。它的拉取请求保护有意小于计划配置：非草稿 PR 只会对 agent 命令/模型/工具执行和回复分发代码、配置架构/迁移/IO 代码、认证/密钥/沙箱/安全代码、核心渠道和内置渠道插件运行时、Gateway 网关协议/服务器方法、记忆运行时/SDK 胶水代码、MCP/进程/出站投递、提供商运行时/模型目录、会话诊断/投递队列、插件加载器、插件 SDK/包契约，或插件 SDK 回复运行时更改，运行匹配的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 配置和质量工作流更改会运行全部十二个 PR 质量分片。

手动分发接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

窄配置是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 表面                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | 认证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                          |
| `/codeql-critical-quality/config-boundary`              | 配置架构、迁移、规范化和 IO 契约                                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议架构和服务器方法契约                                                                                                                        |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/provider 分发、自动回复分发和队列，以及 ACP 控制平面运行时契约                                                                                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥接、进程监督帮助器，以及出站投递契约                                                                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆宿主 SDK、记忆运行时门面、记忆插件 SDK 别名、记忆运行时激活胶水代码，以及记忆 Doctor 命令                                                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递帮助器、诊断事件/日志包表面，以及会话 Doctor CLI 契约                                                     |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复载荷/分块/运行时帮助器、渠道回复选项、投递队列，以及会话/线程绑定帮助器                                                         |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、provider 认证和发现、provider 运行时注册、provider 默认值/目录，以及 web/搜索/fetch/embedding 注册表                                        |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 启动、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、媒体 IO、媒体理解、图像生成和媒体生成运行时契约                                                                                      |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公共表面和插件 SDK 入口点契约                                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧插件 SDK 源码和插件包契约帮助器                                                                                                                   |

质量与安全分开，以便在不遮蔽安全信号的情况下，对质量发现进行计划、度量、禁用或扩展。Swift、Python 和内置插件 CodeQL 扩展应仅在窄配置具备稳定运行时间和信号之后，作为有范围或分片的后续工作加回。

## 维护工作流

### Docs Agent

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近合入的更改保持一致。它没有纯计划任务：`main` 上成功的非机器人 push CI 运行可以触发它，手动分发也可以直接运行它。当 `main` 已经继续前进，或者过去一小时内已创建另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一个未跳过 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档处理以来累积的所有 main 更改。

### Test Performance Agent

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯计划任务：`main` 上成功的非机器人 push CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动分发会绕过该每日活动门禁。该通道会构建一个全套件分组 Vitest 性能报告，让 Codex 只进行小型、保持覆盖率的测试性能修复，而不是大范围重构，然后重新运行全套件报告，并拒绝会减少通过基线测试数量的更改。如果基线存在失败测试，Codex 只能修复明显故障，并且 agent 后的全套件报告必须通过，才会提交任何内容。当 `main` 在机器人 push 合入前推进时，该通道会对已验证补丁执行 rebase，重新运行 `pnpm check:changed`，并重试 push；有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于合入后的重复项清理。它默认 dry-run，且仅在 `apply=true` 时关闭显式列出的 PR。在修改 GitHub 之前，它会验证已合入 PR 已合并，并验证每个重复项要么有共享的引用 issue，要么有重叠的更改 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门禁和变更路由

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁在架构边界方面比宽泛的 CI 平台范围更严格：

- 核心生产代码更改会运行核心生产代码和核心测试类型检查，以及核心 lint/guard；
- 核心仅测试更改只运行核心测试类型检查，以及核心 lint；
- 插件生产代码更改会运行插件生产代码和插件测试类型检查，以及插件 lint；
- 插件仅测试更改会运行插件测试类型检查，以及插件 lint；
- 公共插件 SDK 或插件契约更改会扩展到插件类型检查，因为插件依赖这些核心契约（Vitest 插件扫测仍然是显式测试工作）；
- 仅发布元数据的版本号更新会运行定向版本/配置/根依赖检查；
- 未知的根目录/配置更改会保守地失败到所有检查通道。

本地 changed-test 路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更轻量：直接测试编辑会运行自身，源代码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置是显式映射之一：对群组可见回复配置、源回复投递模式或 message-tool 系统提示的更改，会通过核心回复测试以及 Discord 和 Slack 投递回归测试，这样共享默认值更改会在第一次 PR 推送前失败。只有当更改覆盖整个 harness，导致低成本映射集无法作为可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

从仓库根目录运行 Testbox，并优先使用新的已预热 box 来做广泛证明。在把慢速 gate 花到一个被复用、已过期或刚报告了异常大型同步的 box 之前，先在该 box 内运行 `pnpm testbox:sanity`。

当必需的根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，sanity check 会快速失败。这通常意味着远程同步状态不是 PR 的可信副本；停止该 box，并预热一个新的 box，而不是调试产品测试失败。对于有意的大规模删除 PR，为该 sanity 运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 还会终止一个本地 Blacksmith CLI 调用，如果它停留在同步阶段超过五分钟且没有同步后输出。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该 guard，或者对异常大的本地 diff 使用更大的毫秒值。

Crabbox 是仓库自有的远程 box 包装器，用于维护者 Linux 证明。当某个检查对本地编辑循环来说过于宽泛、需要 CI 一致性，或证明需要密钥、Docker、包通道、可复用 box 或远程日志时使用它。正常的 OpenClaw 后端是 `blacksmith-testbox`；自有 AWS/Hetzner 容量是 Blacksmith 故障、配额问题或显式自有容量测试的后备。

首次运行前，从仓库根目录检查包装器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

仓库包装器会拒绝不声明 `blacksmith-testbox` 的过期 Crabbox 二进制。即使 `.crabbox.yaml` 有自有云默认值，也要显式传入 provider。

Changed gate：

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

阅读最终 JSON 摘要。有用字段是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。一次性的 Blacksmith 后端 Crabbox 运行应自动停止 Testbox；如果某次运行被中断或清理不明确，请检查活动 box，并只停止你创建的 box：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有当你明确需要在同一个已预置环境的 box 上运行多个命令时，才使用复用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是故障层，但 Blacksmith 本身可用，请使用直接 Blacksmith 作为狭窄后备：

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可用，但新的 warmup 在几分钟后仍停留在 `queued`，且没有 IP 或 Actions 运行 URL，请将其视为 Blacksmith provider、队列、计费或组织限制压力。停止你创建的 queued id，避免启动更多 Testbox，并把证明移到下面的自有 Crabbox 容量路径，同时让相关人员检查 Blacksmith 控制台、计费和组织限制。

只有在 Blacksmith 宕机、受配额限制、缺少所需环境，或明确以自有容量为目标时，才升级到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 压力下，除非任务确实需要 48xlarge 级 CPU，否则避免 `class=beast`。一个 `beast` 请求从 192 vCPU 起步，是最容易触发区域 EC2 Spot 或 On-Demand Standard 配额的方式。仓库自有的 `.crabbox.yaml` 默认使用 `standard`、多个容量区域和 `capacity.hints: true`，因此经代理的 AWS 租约会打印选定区域/市场、配额压力、Spot 后备和高压力 class 警告。较重的广泛检查使用 `fast`；只有在 standard/fast 不够时才使用 `large`；`beast` 仅用于异常的 CPU 密集型通道，例如完整套件或全插件 Docker 矩阵、显式发布/阻断验证，或高核心性能剖析。不要为 `pnpm check:changed`、聚焦测试、仅文档工作、普通 lint/typecheck、小型 E2E 复现或 Blacksmith 故障分诊使用 `beast`。容量诊断使用 `--market on-demand`，这样 Spot 市场波动不会混入信号。

`.crabbox.yaml` 拥有自有云通道的 provider、同步和 GitHub Actions hydrate 默认值。它排除本地 `.git`，使已 hydrate 的 Actions checkout 保留自身的远程 Git 元数据，而不是同步维护者本地的远程和对象存储；它还排除不应传输的本地运行时/构建产物。`.github/workflows/crabbox-hydrate.yml` 拥有 checkout、Node/pnpm 设置、`origin/main` fetch，以及自有云 `crabbox run --id <cbx_id>` 命令的非密钥环境移交。

## 相关

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
