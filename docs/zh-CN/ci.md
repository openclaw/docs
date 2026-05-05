---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试一个失败的 GitHub Actions 检查
    - 你正在协调一次发布验证的运行或重新运行
    - 你正在更改 ClawSweeper 调度或 GitHub 活动转发
summary: CI 作业图、作用域门禁、发布总括任务和本地等价命令
title: CI 流水线
x-i18n:
    generated_at: "2026-05-05T01:33:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 会在每次推送到 `main` 和每个拉取请求上运行。`preflight` 作业会分类差异，并在只有无关区域发生变更时关闭昂贵的流水线。手动 `workflow_dispatch` 运行会有意绕过智能作用域划分，并为发布候选版本和广泛验证展开完整图。Android 流水线通过 `include_android` 保持可选启用。仅发布阶段的插件覆盖位于单独的 [`Plugin Prerelease`](#plugin-prerelease) 工作流中，并且只会从 [`Full Release Validation`](#full-release-validation) 或显式手动分发运行。

## 流水线概览

| 作业                              | 目的                                                                                                   | 运行时机                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更作用域、变更插件，并构建 CI 清单                   | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                     | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm advisories 进行无依赖的生产锁文件审计                                          | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合项                                                             | 始终在非草稿推送和 PR 上运行 |
| `check-dependencies`             | 生产 Knip 仅依赖检查加未使用文件 allowlist 守卫                                 | Node 相关变更              |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物                       | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性流水线，例如内置插件/插件契约/协议检查                              | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，带有稳定的聚合检查结果                                      | Node 相关变更              |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和插件流水线                          | Node 相关变更              |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、守卫、测试类型和严格 smoke                | Node 相关变更              |
| `check-additional`               | 架构、分片边界/提示词漂移、插件守卫、包边界和 Gateway 网关 watch        | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                                            | Node 相关变更              |
| `checks`                         | 构建产物渠道测试的验证器                                                                 | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 流水线                                                                | 发布用手动 CI 分发    |
| `check-docs`                     | 文档格式、lint 和断链检查                                                             | 文档已变更                       |
| `skills-python`                  | Python 支持的 Skills 的 Ruff + pytest                                                                    | Python Skill 相关变更      |
| `checks-windows`                 | Windows 专用进程/路径测试，以及共享运行时导入说明符回归测试                      | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试流水线                                               | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                            | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试加一个 debug APK 构建                                              | Android 相关变更           |
| `test-performance-agent`         | 受信任活动后的每日 Codex 慢测试优化                                                 | 主 CI 成功或手动分发 |
| `openclaw-performance`           | 每日/按需 Kova 运行时性能报告，包含 mock-provider、deep-profile 和 GPT 5.4 live 流水线 | 定时和手动分发      |

## Fail-fast 顺序

1. `preflight` 决定哪些流水线会存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 流水线重叠运行，这样下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时流水线随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

当同一个 PR 或 `main` ref 上有更新的推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被取代后继续排队。自动 CI 并发键带版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸项无法无限期阻塞新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 作用域和路由

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动分发会跳过 changed-scope 检测，并让 preflight 清单表现得像每个受作用域约束的区域都已变更一样。

- **CI 工作流编辑**会验证 Node CI 图和工作流 linting，但不会单独强制 Windows、Android 或 macOS 原生构建；这些平台流水线仍限定为平台源代码变更。
- **仅 CI 路由编辑、选定的廉价核心测试 fixture 编辑，以及窄范围插件契约 helper/测试路由编辑**使用快速 Node-only 清单路径：`preflight`、security 和单个 `checks-fast-core` 任务。当变更仅限于该快速任务直接执行的路由或 helper 表面时，该路径会跳过构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外守卫矩阵。
- **Windows Node 检查**限定于 Windows 专用进程/路径 wrapper、npm/pnpm/UI runner helper、包管理器配置，以及执行该流水线的 CI 工作流表面；无关源码、插件、install-smoke 和仅测试变更仍留在 Linux Node 流水线上。

最慢的 Node 测试族会被拆分或均衡，使每个作业保持较小规模且不过度预留 runner：渠道契约作为三个加权分片运行，核心单元 fast/support 流水线单独运行，核心运行时基础设施拆分为 state 和 process/config 分片，auto-reply 以均衡 worker 运行（reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片），agentic Gateway 网关/server 配置拆分到 chat/auth/model/http-plugin/runtime/startup 流水线，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享插件 catch-all。Include-pattern 分片使用 CI 分片名称记录 timing 条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和过滤后的分片。`check-additional` 将 package-boundary compile/canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分开；边界守卫列表跨四个矩阵分片条带化，每个分片并发运行选定的独立守卫并打印每项检查的 timing，包括 `pnpm prompt:snapshots:check`，这样 Codex 运行时 happy-path 提示词漂移会固定到导致它的 PR 上。Gateway 网关 watch、渠道测试和核心 support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内并发运行。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。third-party flavor 没有单独的 source set 或 manifest；其单元测试流水线仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每个 Android 相关推送上重复执行 debug APK 打包作业。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`（生产 Knip 仅依赖检查，固定到最新 Knip 版本，并为 `dlx` 安装禁用 pnpm 的最小发布年龄）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 添加新的未审查未使用文件，或留下过期 allowlist 条目时，未使用文件守卫会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、live-test 和包桥接表面。

## ClawSweeper 活动转发

`.github/workflows/clawsweeper-dispatch.yml` 是从 OpenClaw 仓库活动到 ClawSweeper 的目标侧桥接。它不会检出或执行不受信任的拉取请求代码。该工作流会从 `CLAWSWEEPER_APP_PRIVATE_KEY` 创建 GitHub App token，然后向 `openclaw/clawsweeper` 分发紧凑的 `repository_dispatch` payload。

该工作流有四条流水线：

- `clawsweeper_item` 用于精确的 issue 和拉取请求审查请求；
- `clawsweeper_comment` 用于 issue 评论中的显式 ClawSweeper 命令；
- `clawsweeper_commit_review` 用于 `main` 推送上的提交级审查请求；
- `github_activity` 用于 ClawSweeper agent 可能检查的一般 GitHub 活动。

`github_activity` 流水线仅转发规范化元数据：事件类型、操作、actor、仓库、条目编号、URL、标题、状态，以及存在评论或审查时的短摘录。它有意避免转发完整 webhook body。`openclaw/clawsweeper` 中的接收工作流是 `.github/workflows/github-activity.yml`，它会将规范化事件发布到 OpenClaw Gateway 网关 hook，供 ClawSweeper agent 使用。

一般活动是观察，而不是默认投递。ClawSweeper agent 会在其提示词中接收 Discord 目标，并且只有当事件令人意外、可操作、有风险或对运营有用时，才应发布到 `#clawsweeper`。常规打开、编辑、bot 变动、重复 webhook 噪声和正常审查流量都应产生 `NO_REPLY`。

在这条路径中，始终将 GitHub 标题、评论、正文、审查文本、分支名称和提交消息视为不受信任的数据。它们是摘要和分流的输入，而不是工作流或 agent 运行时的指令。

## 手动分发

手动 CI 触发会运行与普通 CI 相同的作业图，但会强制启用每个非 Android 范围通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立的手动 CI 触发仅在 `include_android=true` 时运行 Android；完整发布总括流程通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件批量扫描以及插件预发布 Docker 通道均排除在 CI 之外。Docker 预发布套件只会在 `Full Release Validation` 触发单独的 `Plugin Prerelease` 工作流并启用发布验证门禁时运行。

手动运行使用唯一的并发组，因此候选发布版本的完整套件不会被同一 ref 上的其他 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信任的调用方在使用所选触发 ref 中工作流文件的同时，针对某个分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省的时间）；install-smoke Docker 构建（32-vCPU 排队时间的成本高于节省的时间）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`OpenClaw Performance` 是产品/运行时性能工作流。它每天在 `main` 上运行，也可以手动触发：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手动触发通常会对工作流 ref 进行基准测试。设置 `target_ref` 可使用当前工作流实现对发布标签或其他分支进行基准测试。已发布报告路径和 latest 指针按被测试 ref 编排，每个 `index.md` 都会记录被测试的 ref/SHA、工作流 ref/SHA、Kova ref、profile、通道认证模式、模型、重复次数和场景过滤器。

该工作流会从固定版本安装 OCM，并从 `openclaw/Kova` 的固定 `kova_ref` 输入安装 Kova，然后运行三个通道：

- `mock-provider`：Kova 诊断场景，针对使用确定性伪 OpenAI 兼容认证的本地构建运行时。
- `mock-deep-profile`：针对启动、Gateway 网关和智能体轮次热点的 CPU/堆/跟踪性能分析。
- `live-gpt54`：一次真实的 OpenAI `openai/gpt-5.4` 智能体轮次；当 `OPENAI_API_KEY` 不可用时跳过。

mock-provider 通道还会在 Kova 通过后运行 OpenClaw 原生源码探测：默认、hook 和 50 插件启动场景下的 Gateway 网关启动时间和内存；重复的 mock-OpenAI `channel-chat-baseline` hello 循环；以及针对已启动 Gateway 网关的 CLI 启动命令。源码探测 Markdown 摘要位于报告包中的 `source/index.md`，原始 JSON 放在旁边。

每个通道都会上传 GitHub 构件。配置 `CLAWGRIT_REPORTS_TOKEN` 后，该工作流还会将 `report.json`、`report.md`、包、`index.md` 和源码探测构件提交到 `openclaw/clawgrit-reports`，路径为 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`。当前被测试 ref 指针会写入为 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整发布验证

`Full Release Validation` 是用于“发布前运行所有内容”的手动总括工作流。它接受分支、标签或完整提交 SHA，使用该目标触发手动 `CI` 工作流，触发 `Plugin Prerelease` 以提供仅发布使用的插件/包/静态/Docker 证明，并触发 `OpenClaw Release Checks` 以执行安装冒烟、包验收、跨 OS 包检查、QA Lab parity、Matrix 和 Telegram 通道。稳定版/默认运行会把完整的 live/E2E 和 Docker 发布路径覆盖保留在 `run_release_soak=true` 之后；`release_profile=full` 会强制启用该 soak 覆盖，因此广泛的 advisory 验证仍然保持广泛。使用 `rerun_group=all` 和 `release_profile=full` 时，它还会针对来自 release checks 的 `release-package-under-test` 构件运行 `NPM Telegram Beta E2E`。发布后，传入 `npm_telegram_package_spec` 可针对已发布的 npm 包重新运行同一个 Telegram 包通道。

请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解阶段矩阵、确切工作流作业名称、profile 差异、构件和定向重运行句柄。

`OpenClaw Release Publish` 是手动的变更型发布工作流。发布标签存在且 OpenClaw npm preflight 成功后，从 `release/YYYY.M.D` 或 `main` 触发它。它会验证 `pnpm plugins:sync:check`，为所有可发布插件包触发 `Plugin NPM Release`，为同一发布 SHA 触发 `Plugin ClawHub Release`，然后才会使用保存的 `preflight_run_id` 触发 `OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

若要在快速移动的分支上提供固定提交证明，请使用辅助命令，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流触发 ref 必须是分支或标签，不能是原始提交 SHA。该辅助命令会在目标 SHA 处推送一个临时 `release-ci/<sha>-...` 分支，从该固定 ref 触发 `Full Release Validation`，验证每个子工作流的 `headSha` 都与目标匹配，并在运行完成时删除临时分支。如果任何子工作流运行在不同的 SHA 上，总括验证器也会失败。

`release_profile` 控制传递给发布检查的实时/提供商覆盖范围。手动发布工作流默认使用 `stable`；只有在你有意需要宽泛的 advisory provider/media 矩阵时才使用 `full`。`run_release_soak` 控制 stable/default 发布检查是否运行详尽的实时/E2E 和 Docker 发布路径 soak；`full` 会强制启用 soak。

- `minimum` 保留最快的 OpenAI/core 发布关键通道。
- `stable` 添加 stable provider/backend 集合。
- `full` 运行宽泛的 advisory provider/media 矩阵。

总控流程会记录已调度的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流被重新运行并转为绿色，只需重新运行父级 verifier 作业，以刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`；仅正常 full CI 子项使用 `ci`；仅插件预发布子项使用 `plugin-prerelease`；每个发布子项使用 `release-checks`；也可以在总控流程上使用更窄的分组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在完成聚焦修复后，将失败发布环境的重跑范围控制住。对于单个失败的 cross-OS 通道，将 `rerun_group=cross-os` 与 `cross_os_suite_filter` 结合使用，例如 `windows/packaged-upgrade`；长时间运行的 cross-OS 命令会输出 heartbeat 行，packaged-upgrade 摘要会包含各阶段耗时。QA release-check 通道是 advisory，因此仅 QA 失败会发出警告，但不会阻塞 release-check verifier。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将选定 ref 一次解析为 `release-package-under-test` tarball，然后将该 artifact 传递给 cross-OS 检查和包验收，以及在运行 soak 覆盖时传递给 live/E2E 发布路径 Docker 工作流。这样可以让各个发布环境中的包字节保持一致，并避免在多个子作业中重复打包同一个候选版本。

针对 `ref=main` 和 `rerun_group=all` 的重复 `Full Release Validation` 运行会取代较旧的总控流程。当父级被取消时，父级 monitor 会取消它已调度的任何子工作流，因此较新的 main 验证不会排在过期的两小时 release-check 运行之后。发布分支/tag 验证和聚焦重跑分组会保持 `cancel-in-progress: false`。

## 实时和 E2E 分片

发布 live/E2E 子项保留宽泛的原生 `pnpm test:live` 覆盖，但会通过 `scripts/test-live-shard.mjs` 以命名分片运行，而不是作为一个串行作业运行：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` 作业
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分后的媒体音频/视频分片，以及 provider-filtered 音乐分片

这会保持相同的文件覆盖，同时让缓慢的实时提供商失败更容易重跑和诊断。聚合分片名称 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 对手动一次性重跑仍然有效。

原生实时媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装了 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证这些二进制文件。将 Docker 支持的实时套件保留在普通 Blacksmith runner 上运行，因为容器作业不适合启动嵌套 Docker 测试。

Docker 支持的实时 model/backend 分片会为每个选定提交使用一个单独共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流会构建并推送该镜像一次，然后 Docker 实时模型、按提供商分片的 Gateway 网关、CLI 后端、ACP bind 和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway 网关 Docker 分片带有显式的脚本级 `timeout` 上限，低于工作流作业超时时间，因此卡住的容器或清理路径会快速失败，而不是耗尽整个 release-check 预算。如果这些分片独立重建完整 source Docker target，则发布运行配置有误，并会把 wall clock 浪费在重复镜像构建上。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证 source tree，而包验收会通过用户在安装或更新后使用的同一个 Docker E2E harness 来验证单个 tarball。

### 作业

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者都作为 `package-under-test` artifact 上传，并在 GitHub step summary 中打印来源、workflow ref、package ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该 artifact、验证 tarball 清单、在需要时准备 package-digest Docker 镜像，并针对该包运行选定 Docker 通道，而不是打包工作流 checkout。当一个 profile 选择多个目标 `docker_lanes` 时，可复用工作流会准备一次包和共享镜像，然后将这些通道扇出为并行的目标 Docker 作业，并带有唯一 artifact。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果包验收已解析出一个包，它会安装同一个 `package-under-test` artifact；独立 Telegram 调度仍可安装已发布的 npm spec。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时使工作流失败。

### 候选来源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将它用于已发布的 prerelease/stable 验收。
- `source=ref` 会打包一个受信任的 `package_ref` 分支、tag 或完整提交 SHA。解析器会获取 OpenClaw 分支/tag，验证选定提交可从仓库分支历史或发布 tag 访问，在 detached worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 会下载 HTTPS `.tgz`；`package_sha256` 必填。
- `source=artifact` 会从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享的 artifact 应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任 workflow/harness 代码。`package_ref` 是在 `source=ref` 时会被打包的源提交。这让当前测试 harness 能够验证较旧的受信任源提交，而无需运行旧工作流逻辑。

### 套件 profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 带 OpenWebUI 的完整 Docker 发布路径 chunks
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

`package` profile 使用离线插件覆盖，因此已发布包验证不会受实时 ClawHub 可用性限制。可选 Telegram 通道会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` artifact，并为独立调度保留已发布 npm spec 路径。

有关专门的更新和插件测试策略，包括本地命令、Docker 通道、包验收输入、发布默认值和失败分诊，请参阅[更新和插件测试](/zh-CN/help/testing-updates-plugins)。

发布检查会使用 `source=artifact`、准备好的发布包 artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` 和 `telegram_mode=mock-openai` 调用包验收。这样可以让包迁移、更新、陈旧插件依赖清理、已配置插件安装修复、离线插件、插件更新和 Telegram 证明都基于同一个已解析的包 tarball。设置 Full Release Validation 或 OpenClaw Release Checks 上的 `package_acceptance_package_spec`，可以针对已发布的 npm 包运行同一个矩阵，而不是针对 SHA 构建的 artifact。Cross-OS 发布检查仍覆盖 OS 特定的新手引导、安装程序和平台行为；包/更新产品验证应从包验收开始。`published-upgrade-survivor` Docker 通道会在阻塞发布路径中为每次运行验证一个已发布包基线。在包验收中，解析出的 `package-under-test` tarball 始终是候选版本，而 `published_upgrade_survivor_baseline` 会选择 fallback 已发布基线，默认值为 `openclaw@latest`；失败通道重跑命令会保留该基线。带有 `run_release_soak=true` 或 `release_profile=full` 的 Full Release Validation 会设置 `published_upgrade_survivor_baselines=all-since-2026.4.23` 和 `published_upgrade_survivor_scenarios=reported-issues`，以扩展覆盖从 `2026.4.23` 到 `latest` 的每个 stable npm release，以及面向问题的 fixtures，涵盖 Feishu 配置、保留的 bootstrap/persona 文件、已配置的 OpenClaw 插件安装、波浪号日志路径和陈旧的 legacy 插件依赖根。单独的 `Update Migration` 工作流在问题是详尽的已发布更新清理，而不是普通 Full Release CI 覆盖范围时，会使用 `update-migration` Docker 通道以及 `all-since-2026.4.23` 和 `plugin-deps-cleanup`。本地聚合运行可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传递精确包 spec；也可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保留单个通道，例如 `openclaw@2026.4.15`；或者设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以运行场景矩阵。已发布通道会使用内置的 `openclaw config set` 命令 recipe 配置基线，在 `summary.json` 中记录 recipe 步骤，并在 Gateway 网关启动后探测 `/healthz`、`/readyz` 以及 RPC status。Windows packaged 和 installer fresh 通道还会验证已安装包能够从原始绝对 Windows 路径导入 browser-control override。OpenAI cross-OS agent-turn smoke 在已设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因此安装和 Gateway 网关证明会保留在 GPT-5 测试模型上，同时避免 GPT-4.x 默认值。

### 旧版兼容窗口

包验收对已发布包有有界的旧版兼容窗口。到 `2026.4.25` 为止的包，包括 `2026.4.25-beta.*`，可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可以指向 tarball 省略的文件；
- 当包未暴露 `gateway install --wrapper` flag 时，`doctor-switch` 可以跳过该持久化子用例；
- `update-channel-switch` 可以从 tarball 派生的 fake git fixture 中剪除缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；
- 插件 smoke 可以读取 legacy 安装记录位置，或接受缺失的 marketplace 安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和 no-reinstall 行为保持不变。

已发布的 `2026.4.26` 包也可以对已交付的本地构建元数据 stamp 文件发出警告。更晚的包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 产物：`.artifacts/docker-tests/**/summary.json`、`failures.json`、车道日志、阶段计时和重新运行命令。优先重新运行失败的包配置文件或精确的 Docker 车道，而不是重新运行完整发布验证。

## 安装冒烟测试

单独的 `Install Smoke` 工作流通过自己的 `preflight` 作业复用同一个范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径**会在拉取请求触及 Docker/包表面、内置插件包/清单变更，或 Docker 冒烟作业会覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面时运行。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像、检查 CLI、运行智能体删除共享工作区 CLI 冒烟测试、运行容器 Gateway 网关网络 e2e、验证内置插件构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker 配置文件（每个场景的 Docker 运行会单独设定上限）。
- **完整路径**会保留 QR 包安装和安装器 Docker/更新覆盖，用于夜间定时运行、手动分发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的拉取请求。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟测试、安装器/更新冒烟测试，以及快速内置插件 Docker E2E 作为独立作业运行，这样安装器工作就不必等待根镜像冒烟测试完成。

`main` 推送（包括合并提交）不会强制完整路径；当变更范围逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker 冒烟测试，并将完整安装冒烟测试留给夜间或发布验证。

较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独控制。它会在夜间计划和发布检查工作流中运行，手动 `Install Smoke` 分发可以选择启用它，但拉取请求和 `main` 推送不会运行。QR 和安装器 Docker 测试保留各自专注安装的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享的实时测试镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 一个用于安装器/更新/插件依赖车道的裸 Node/Git runner；
- 一个将同一 tarball 安装到 `/app` 中、用于常规功能车道的功能镜像。

Docker 车道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选中的计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每条车道选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行车道。

### 可调参数

| 变量                                   | 默认值 | 用途                                                                                          |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | 常规车道的主池槽位数。                                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | 对提供商敏感的尾部池槽位数。                                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | 并发实时车道上限，避免提供商限流。                                                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10     | 并发 npm 安装车道上限。                                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | 并发多服务车道上限。                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | 车道启动之间的错峰时间，用于避免 Docker daemon 创建风暴；设为 `0` 表示不使用错峰。            |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每条车道的兜底超时（120 分钟）；选定的实时/尾部车道使用更严格的上限。                         |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未设置 | `1` 会打印调度器计划而不运行车道。                                                            |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未设置 | 逗号分隔的精确车道列表；跳过清理冒烟测试，以便智能体复现单个失败车道。                        |

超过其有效上限的车道仍可从空池启动，然后独占运行，直到释放容量。本地聚合会预检 Docker、移除陈旧的 OpenClaw E2E 容器、输出活动车道状态、持久化车道计时以便按最长优先排序，并且默认在第一次失败后停止调度新的池化车道。

### 可复用实时/E2E 工作流

可复用实时/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、实时镜像、车道和凭证覆盖。随后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它要么通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，要么下载当前运行的包产物，要么从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要已安装包的车道时，通过 Blacksmith 的 Docker layer cache 构建并推送带包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。Docker 镜像拉取会使用有界的每次尝试 180 秒超时重试，因此卡住的 registry/cache 流会快速重试，而不会消耗 CI 关键路径的大部分时间。

### 发布路径分块

发布 Docker 覆盖会使用较小的分块作业并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取自己需要的镜像类型，并通过同一个加权调度器执行多条车道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

当前发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及从 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合插件/运行时别名。`install-e2e` 车道别名仍是两个提供商安装器车道的聚合手动重新运行别名。

当完整发布路径覆盖请求 OpenWebUI 时，它会并入 `plugins-runtime-services`；只有 OpenWebUI 专用分发才保留独立的 `openwebui` 分块。内置渠道更新车道会针对瞬时 npm 网络故障重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含车道日志、计时、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON、慢车道表和每条车道的重新运行命令。工作流的 `docker_lanes` 输入会针对已准备的镜像运行选中的车道，而不是运行分块作业；这会将失败车道调试限制在一个目标明确的 Docker 作业内，并为该运行准备、下载或复用包产物；如果选中的车道是实时 Docker 车道，目标作业会为这次重新运行在本地构建实时测试镜像。生成的每车道 GitHub 重新运行命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败车道可以复用失败运行中的精确包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

计划的实时/E2E 工作流每天运行完整发布路径 Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个单独的工作流，由 `Full Release Validation` 或明确的操作员分发触发。常规拉取请求、`main` 推送和独立的手动 CI 分发都不会启用该套件。它会在八个插件 worker 之间均衡内置插件测试；这些插件分片作业每次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node 堆，因此导入较重的插件批次不会创建额外 CI 作业。仅发布的 Docker 预发布路径会以小组批量运行目标 Docker 车道，避免为一到三分钟的作业占用数十个 runner。

## QA Lab

QA Lab 拥有独立于主智能范围工作流之外的专用 CI 车道。Agentic parity 嵌套在广泛的 QA 和发布 harness 下，而不是独立的 PR 工作流。当 parity 应随广泛验证运行一起执行时，使用带有 `rerun_group=qa-parity` 的 `Full Release Validation`。

- `QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动分发；它会将 mock parity 车道、实时 Matrix 车道，以及实时 Telegram 和 Discord 车道展开为并行作业。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。

发布检查会使用确定性 mock 提供商和 mock 限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输车道，因此渠道契约与实时模型延迟和常规提供商插件启动相隔离。实时传输 Gateway 网关会禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；提供商连接性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 会为计划和发布门禁使用 `--profile fast`，仅在检出的 CLI 支持时添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分发始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 车道；其 QA parity 门禁会将候选包和基线包作为并行车道作业运行，然后把两个产物都下载到一个小型报告作业中，用于最终 parity 比较。

对于常规 PR，应遵循限定范围的 CI/检查证据，而不是将 parity 视为必需状态。

## CodeQL

`CodeQL` 工作流有意作为范围狭窄的第一遍安全扫描器，而不是完整仓库扫描。每日、手动和非草稿拉取请求守卫运行会扫描 Actions 工作流代码，以及最高风险的 JavaScript/TypeScript 表面，并使用高置信度安全查询筛选高/严重 `security-severity`。

拉取请求守卫保持轻量：它只会在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下发生变更时启动，并运行与定时工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不包含在 PR 默认项中。

### 安全类别

| 类别                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 认证、密钥、沙箱、cron 和 Gateway 网关基线                                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，加上渠道插件运行时、Gateway 网关、插件 SDK、密钥、审计触点                                                        |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络守卫、Web 抓取和插件 SDK SSRF 策略表面                                                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助工具、出站投递，以及智能体工具执行门控                                                                      |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、清单、注册表、包管理器安装、源加载，以及插件 SDK 包契约信任表面                                                   |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 定时 Android 安全分片。在工作流健全性接受的最小 Blacksmith Linux runner 上手动构建 Android 应用以供 CodeQL 使用。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上手动构建 macOS 应用以供 CodeQL 使用，从上传的 SARIF 中过滤依赖构建结果，并上传到 `/codeql-critical-security/macos` 下。它被排除在每日默认项之外，因为即使结果干净，macOS 构建也会主导运行时长。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它只在较小的 Blacksmith Linux runner 上，对范围狭窄的高价值表面运行错误严重级别、非安全 JavaScript/TypeScript 质量查询。它的拉取请求守卫有意小于定时配置：非草稿 PR 只会针对智能体命令/模型/工具执行和回复分发代码、配置架构/迁移/IO 代码、认证/密钥/沙箱/安全代码、核心渠道和内置渠道插件运行时、Gateway 网关协议/服务器方法、记忆运行时/SDK 粘合代码、MCP/进程/出站投递、提供商运行时/模型目录、会话诊断/投递队列、插件加载器、插件 SDK/包契约，或插件 SDK 回复运行时变更，运行匹配的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 配置和质量工作流变更会运行全部十二个 PR 质量分片。

手动调度接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭窄配置是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 表面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 认证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                               |
| `/codeql-critical-quality/config-boundary`              | 配置架构、迁移、规范化和 IO 契约                                                                                                                                 |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议架构和服务器方法契约                                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约                                                                                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥、进程监督辅助工具，以及出站投递契约                                                                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆主机 SDK、记忆运行时 facade、记忆插件 SDK 别名、记忆运行时激活粘合代码，以及记忆 Doctor 命令                                                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部、会话投递队列、出站会话绑定/投递辅助工具、诊断事件/日志包表面，以及会话 Doctor CLI 契约                                                            |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复载荷/分块/运行时辅助工具、渠道回复选项、投递队列，以及会话/线程绑定辅助工具                                                          |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商认证和设备发现、提供商运行时注册、提供商默认值/目录，以及 Web/搜索/抓取/嵌入注册表                                                        |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 启动、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 Web 抓取/搜索、媒体 IO、媒体理解、图像生成，以及媒体生成运行时契约                                                                                          |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公共表面，以及插件 SDK 入口点契约                                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧插件 SDK 源代码和插件包契约辅助工具                                                                                                                    |

质量与安全保持分离，这样质量发现就可以在不遮蔽安全信号的情况下进行定时、度量、禁用或扩展。Swift、Python 和内置插件 CodeQL 扩展应仅在狭窄配置拥有稳定运行时和信号之后，作为有范围或分片的后续工作加回。

## 维护工作流

### Docs Agent

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时计划：`main` 上成功的非机器人 push CI 运行可以触发它，手动调度也可以直接运行它。当 `main` 已继续前进，或过去一小时内已经创建了另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审核从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档处理以来积累的所有 main 变更。

### Test Performance Agent

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上成功的非机器人 push CI 运行可以触发它，但如果同一个 UTC 日已经有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动调度会绕过该每日活动门控。该通道会构建完整套件分组 Vitest 性能报告，让 Codex 只做保持覆盖率的小型测试性能修复，而不是大范围重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显失败，且 agent 后的完整套件报告必须通过后才能提交任何内容。当机器人 push 落地前 `main` 前进时，该通道会 rebase 已验证补丁，重新运行 `pnpm check:changed`，并重试 push；有冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于落地后的重复项清理。它默认 dry-run，且只有在 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 前，它会验证已落地 PR 已合并，并且每个重复项都有共享的引用 issue 或重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门控和变更路由

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门控在架构边界方面比宽泛的 CI 平台范围更严格：

- 核心生产变更会运行核心生产和核心测试类型检查，加上核心 lint/guards；
- 仅核心测试变更只运行核心测试类型检查，加上核心 lint；
- 扩展生产变更会运行扩展生产和扩展测试类型检查，加上扩展 lint；
- 仅扩展测试变更会运行扩展测试类型检查，加上扩展 lint；
- 公共插件 SDK 或插件契约变更会扩展到扩展类型检查，因为扩展依赖这些核心契约（Vitest 扩展扫描仍然是显式测试工作）；
- 仅发布元数据版本 bump 会运行定向版本/配置/根依赖检查；
- 未知 root/配置变更会故障安全地进入所有检查通道。

本地 changed-test 路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更便宜：直接测试编辑会运行自身，源代码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置是显式映射之一：对群组可见回复配置、源回复投递模式或消息工具系统提示的变更，会经过核心回复测试以及 Discord 和 Slack 投递回归测试，因此共享默认值变更会在首次 PR push 前失败。只有当变更范围足够覆盖整个 harness，以至于廉价映射集合不是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

从仓库根目录运行 Testbox，并优先使用全新预热的 box 进行广泛验证。在对复用过、已过期，或刚报告了异常大规模同步的 box 执行慢速 gate 之前，先在 box 内运行 `pnpm testbox:sanity`。

当所需的根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除项时，sanity check 会快速失败。这通常意味着远程同步状态不是 PR 的可信副本；停止那个 box，并改为预热一个新的 box，而不是调试产品测试失败。对于有意进行大规模删除的 PR，请为该次 sanity run 设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 还会终止本地 Blacksmith CLI 调用：如果它在同步阶段停留超过五分钟且没有同步后的输出。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该保护，或为异常大的本地 diff 使用更大的毫秒值。

Crabbox 是仓库自有的远程 box 包装器，用于维护者 Linux 验证。当某个检查对本地编辑循环来说过于广泛、CI 对等性很重要，或验证需要 secrets、Docker、package lanes、可复用 box，或远程日志时，请使用它。常规 OpenClaw 后端是 `blacksmith-testbox`；自有 AWS/Hetzner 容量是在 Blacksmith 中断、配额问题，或明确进行自有容量测试时的 fallback。

首次运行前，从仓库根目录检查包装器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

如果 Crabbox 二进制文件过旧且未声明 `blacksmith-testbox`，仓库包装器会拒绝运行。即使 `.crabbox.yaml` 有自有云默认值，也要显式传入 provider。

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

阅读最终的 JSON 摘要。有用的字段是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。一次性的 Blacksmith 后端 Crabbox 运行应自动停止 Testbox；如果运行被中断或清理状态不明确，请检查 live boxes，并只停止你创建的 box：

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

只有在你有意需要在同一个已 hydrated 的 box 上执行多条命令时，才使用复用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是损坏的层，但 Blacksmith 本身可用，请将 direct Blacksmith 作为窄 fallback：

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

仅当 Blacksmith 宕机、受配额限制、缺少所需环境，或明确目标是自有容量时，才升级到自有 Crabbox 容量：

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` 负责自有云 lanes 的 provider、sync 和 GitHub Actions hydration 默认值。它排除本地 `.git`，使 hydrated Actions checkout 保持自己的远程 Git 元数据，而不是同步维护者本地的 remotes 和 object stores；它还排除绝不应传输的本地 runtime/build artifacts。`.github/workflows/crabbox-hydrate.yml` 负责 checkout、Node/pnpm 设置、`origin/main` fetch，以及面向自有云 `crabbox run --id <cbx_id>` 命令的非 secret 环境交接。

## 相关

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
