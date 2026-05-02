---
read_when:
    - 你需要了解 CI 作业为何运行或未运行
    - 你正在调试一个未通过的 GitHub Actions 检查
    - 你正在协调一次发布验证运行或重新运行
    - 你正在更改 ClawSweeper 派发或 GitHub 活动转发
summary: CI 作业图、范围门禁、发布总括项和本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-05-02T20:01:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 会在每次推送到 `main` 以及每个拉取请求时运行。`preflight` 作业会对差异进行分类，并在只有无关区域发生更改时关闭昂贵的通道。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为候选发布和广泛验证展开完整图。Android 通道继续通过 `include_android` 保持选择加入。仅发布使用的插件覆盖范围位于单独的 [`插件预发布`](#plugin-prerelease) 工作流中，并且只会从 [`全量发布验证`](#full-release-validation) 或显式手动调度运行。

## 管道概览

| 作业                             | 用途                                                                                                      | 运行时机                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更插件，并构建 CI 清单                                                       | 始终在非草稿推送和 PR 上运行       |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                                    | 始终在非草稿推送和 PR 上运行       |
| `security-dependency-audit`      | 针对 npm 公告执行无依赖的生产 lockfile 审计                                                               | 始终在非草稿推送和 PR 上运行       |
| `security-fast`                  | 快速安全作业的必需聚合项                                                                                  | 始终在非草稿推送和 PR 上运行       |
| `check-dependencies`             | 仅生产 Knip 依赖检查，以及未使用文件 allowlist 防护                                                       | Node 相关变更                      |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物                                              | Node 相关变更                      |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                                                         | Node 相关变更                      |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                              | Node 相关变更                      |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和插件通道                                                      | Node 相关变更                      |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、防护、测试类型和严格 smoke                                        | Node 相关变更                      |
| `check-additional`               | 架构、边界、插件表面防护、包边界和 gateway-watch 分片                                                     | Node 相关变更                      |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                                  | Node 相关变更                      |
| `checks`                         | 已构建产物渠道测试的验证器                                                                                | Node 相关变更                      |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                                           | 发布使用的手动 CI 调度             |
| `check-docs`                     | 文档格式、lint 和断链检查                                                                                 | 文档已变更                         |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                                              | Python skill 相关变更              |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时导入说明符回归检查                                            | Windows 相关变更                   |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                              | macOS 相关变更                     |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                                       | macOS 相关变更                     |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建                                                  | Android 相关变更                   |
| `test-performance-agent`         | 在可信活动后每日进行 Codex 慢测试优化                                                                     | 主 CI 成功或手动调度               |
| `openclaw-performance`           | 每日/按需生成 Kova 运行时性能报告，包含 mock-provider、deep-profile 和 GPT 5.4 实时通道                  | 定时和手动调度                     |

## 快速失败顺序

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道重叠运行，因此下游消费者可以在共享构建就绪后立即启动。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

当同一个 PR 或 `main` ref 上有新的推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也在失败，否则将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个工作流已经被取代后不会继续排队。自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸任务无法无限期阻塞较新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 范围和路由

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动调度会跳过 changed-scope 检测，并让 preflight 清单表现得像每个限定范围区域都发生了变更。

- **CI 工作流编辑**会验证 Node CI 图和工作流 lint，但不会单独强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍限定到平台源代码变更。
- **仅 CI 路由编辑、选定的廉价核心测试 fixture 编辑，以及窄范围的插件契约 helper/测试路由编辑**会使用快速的仅 Node 清单路径：`preflight`、安全检查和一个 `checks-fast-core` 任务。当变更仅限于该快速任务直接覆盖的路由或 helper 表面时，此路径会跳过构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外防护矩阵。
- **Windows Node 检查**限定到 Windows 特定的进程/路径 wrapper、npm/pnpm/UI runner helper、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源代码、插件、install-smoke 和仅测试变更会留在 Linux Node 通道上。

最慢的 Node 测试系列会被拆分或平衡，让每个作业保持较小规模，同时不过度预留 runner：渠道契约作为三个加权分片运行，小型核心单元通道会成对运行，auto-reply 作为四个平衡 worker 运行（reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片），agentic gateway/插件配置会分布在现有的仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。include-pattern 分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与经过过滤的分片。`check-additional` 将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖范围分开；边界防护分片会在一个作业内并发运行它的小型独立防护。Gateway 网关 watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内并发运行。

Android CI 会运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。third-party flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每个 Android 相关推送上重复执行 debug APK 打包作业。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`（一个仅生产 Knip 依赖检查，固定到最新 Knip 版本，并在 `dlx` 安装时禁用 pnpm 的 minimum release age）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 添加了新的未经审查的未使用文件，或留下过期 allowlist 条目时，未使用文件防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成文件、构建、实时测试和包桥接表面。

## ClawSweeper 活动转发

`.github/workflows/clawsweeper-dispatch.yml` 是从 OpenClaw 仓库活动到 ClawSweeper 的目标侧桥接。它不会检出或执行不可信的拉取请求代码。该工作流会从 `CLAWSWEEPER_APP_PRIVATE_KEY` 创建 GitHub App token，然后向 `openclaw/clawsweeper` 调度紧凑的 `repository_dispatch` payload。

该工作流有四条通道：

- `clawsweeper_item` 用于精确的 issue 和拉取请求审查请求；
- `clawsweeper_comment` 用于 issue 评论中的显式 ClawSweeper 命令；
- `clawsweeper_commit_review` 用于 `main` 推送上的提交级审查请求；
- `github_activity` 用于 ClawSweeper 智能体可能检查的一般 GitHub 活动。

`github_activity` 通道只转发规范化的元数据：事件类型、动作、参与者、仓库、条目编号、URL、标题、状态，以及存在评论或审查时的短摘录。它有意避免转发完整 webhook body。`openclaw/clawsweeper` 中的接收工作流是 `.github/workflows/github-activity.yml`，该工作流会将规范化事件发布到面向 ClawSweeper 智能体的 OpenClaw Gateway 网关 hook。

一般活动是观察，而不是默认投递。ClawSweeper 智能体会在其 prompt 中收到 Discord 目标，并且只有当事件令人意外、可执行、有风险或对运营有用时，才应发布到 `#clawsweeper`。例行打开、编辑、机器人噪音、重复 webhook 噪音以及正常审查流量应返回 `NO_REPLY`。

在整个路径中，都应将 GitHub 标题、评论、正文、审查文本、分支名称和提交消息视为不可信数据。它们是摘要和分流的输入，而不是工作流或智能体运行时的指令。

## 手动调度

手动 CI 调度运行与常规 CI 相同的任务图，但会强制开启每个非 Android 范围的 lane：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立的手动 CI 调度仅在 `include_android=true` 时运行 Android；完整发布总控通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件批量扫描以及插件预发布 Docker lane 都不包含在 CI 中。Docker 预发布套件仅在 `Full Release Validation` 调度单独的 `Plugin Prerelease` 工作流并启用发布验证门禁时运行。

手动运行使用唯一的并发组，因此候选发布的完整套件不会被同一 ref 上的另一个 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信任的调用方在使用所选调度 ref 中的工作流文件时，针对分支、标签或完整提交 SHA 运行该任务图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 运行器

| 运行器                           | 任务                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`，快速安全任务和聚合任务（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合任务、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 预检也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（对 CPU 足够敏感，8 vCPU 的成本超过了节省的成本）；install-smoke Docker 构建（32-vCPU 排队时间的成本超过了节省的成本）                                                                                                                                                                                                                                                                                                                     |
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

## OpenClaw Performance

`OpenClaw Performance` 是产品/运行时性能工作流。它每天在 `main` 上运行，也可以手动调度：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

该工作流从固定发布版本安装 OCM，并从固定的 `kova_ref` 输入安装 Kova，然后运行三个 lane：

- `mock-provider`：使用确定性的假 OpenAI 兼容凭证，针对本地构建运行时运行 Kova 诊断场景。
- `mock-deep-profile`：针对启动、gateway 和 agent-turn 热点进行 CPU/堆/trace 分析。
- `live-gpt54`：一次真实的 OpenAI `openai/gpt-5.4` agent turn，在 `OPENAI_API_KEY` 不可用时跳过。

mock-provider lane 还会在 Kova 通过后运行 OpenClaw 原生源码探针：覆盖默认、hook 和 50 插件启动场景的 gateway 启动耗时和内存；重复的 mock-OpenAI `channel-chat-baseline` hello 循环；以及针对已启动 gateway 的 CLI 启动命令。源码探针的 Markdown 摘要位于报告包中的 `source/index.md`，原始 JSON 位于其旁边。

每个 lane 都会上传 GitHub artifact。当配置了 `CLAWGRIT_REPORTS_TOKEN` 时，该工作流还会将 `report.json`、`report.md`、bundle、`index.md` 和源码探针 artifact 提交到 `openclaw/clawgrit-reports` 中的 `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` 下。当前分支指针会写入 `openclaw-performance/<ref>/latest-<lane>.json`。

## 完整发布验证

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，为仅发布使用的插件/包/静态/Docker 证明调度 `Plugin Prerelease`，并为安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram lane 调度 `OpenClaw Release Checks`。在 `rerun_group=all` 且 `release_profile=full` 时，它还会针对发布检查中的 `release-package-under-test` artifact 运行 `NPM Telegram Beta E2E`。发布后，传入 `npm_telegram_package_spec` 以针对已发布的 npm 包重新运行同一个 Telegram 包 lane。

请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解阶段矩阵、确切的工作流任务名称、profile 差异、artifact 以及聚焦重跑句柄。

`OpenClaw Release Publish` 是会产生变更的手动发布工作流。请在发布标签存在且 OpenClaw npm 预检成功后，从 `release/YYYY.M.D` 或 `main` 调度它。它会验证 `pnpm plugins:sync:check`，为所有可发布的插件包调度 `Plugin NPM Release`，为同一个发布 SHA 调度 `Plugin ClawHub Release`，然后才使用保存的 `preflight_run_id` 调度 `OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

对于快速移动分支上的固定提交证明，请使用辅助命令，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流调度 ref 必须是分支或标签，不能是原始提交 SHA。该辅助命令会在目标 SHA 上推送一个临时 `release-ci/<sha>-...` 分支，从该固定 ref 调度 `Full Release Validation`，验证每个子工作流的 `headSha` 都与目标匹配，并在运行完成后删除临时分支。如果任何子工作流在不同 SHA 上运行，总控验证器也会失败。

`release_profile` 控制传入发布检查的 live/provider 覆盖范围。手动发布工作流默认使用 `stable`；仅在你有意需要广泛的 advisory provider/media 矩阵时使用 `full`。

- `minimum` 保留最快的 OpenAI/核心发布关键 lane。
- `stable` 添加稳定的 provider/backend 集合。
- `full` 运行广泛的 advisory provider/media 矩阵。

总控会记录已调度的子运行 ID，最终的 `Verify full validation` 任务会重新检查当前子运行结论，并为每个子运行追加最慢任务表。如果某个子工作流被重新运行并转绿，只需重新运行父验证器任务，即可刷新总控结果和耗时摘要。

为了恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。在总控工作流上，发布候选版本使用 `all`，仅普通完整 CI 子项使用 `ci`，仅插件预发布子项使用 `plugin-prerelease`，每个发布子项使用 `release-checks`，也可以使用更窄的分组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这能让失败的发布环境在完成针对性修复后，将重跑范围限制住。

`OpenClaw Release Checks` 使用可信工作流引用，将选定引用解析一次为 `release-package-under-test` tarball，然后把该构件传给实时/E2E 发布路径 Docker 工作流和软件包验收分片。这能让发布环境之间的软件包字节保持一致，并避免在多个子任务中重复打包同一个候选版本。

对于 `ref=main` 和 `rerun_group=all` 的重复 `Full Release Validation` 运行，会取代较旧的总控工作流。当父监控器被取消时，它会取消已经分发的所有子工作流，因此较新的 main 验证不会排在过期的两小时发布检查运行后面。发布分支/标签验证和聚焦重跑分组会保持 `cancel-in-progress: false`。

## 实时和 E2E 分片

发布实时/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行，而不是单个串行任务：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 按提供商过滤的 `native-live-src-gateway-profiles` 任务
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分后的媒体音频/视频分片，以及按提供商过滤的音乐分片

这会保持相同的文件覆盖，同时让较慢的实时提供商失败更容易重跑和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重跑。

原生实时媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预安装了 `ffmpeg` 和 `ffprobe`；媒体任务只会在设置前验证这些二进制文件。将 Docker 支持的实时套件保留在普通 Blacksmith 运行器上，容器任务不适合启动嵌套 Docker 测试。

Docker 支持的实时模型/后端分片会为每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流会构建并推送该镜像一次，然后 Docker 实时模型、按提供商分片的 Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片会带着 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway 网关 Docker 分片带有显式脚本级 `timeout` 上限，低于工作流任务超时，因此卡住的容器或清理路径会快速失败，而不是消耗整个发布检查预算。如果这些分片独立重建完整源 Docker 目标，则说明发布运行配置错误，并会把墙钟时间浪费在重复镜像构建上。

## 软件包验收

当问题是“这个可安装的 OpenClaw 软件包是否作为产品正常工作？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证源码树，而软件包验收会通过用户安装或更新后使用的同一套 Docker E2E harness 来验证单个 tarball。

### 任务

1. `resolve_package` 检出 `workflow_ref`，解析一个软件包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者作为 `package-under-test` 构件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、软件包引用、版本、SHA-256 和配置档。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该构件，验证 tarball 清单，在需要时准备软件包摘要 Docker 镜像，并针对该软件包运行选定的 Docker lanes，而不是打包工作流检出内容。当某个配置档选择多个目标 `docker_lanes` 时，可复用工作流会准备一次软件包和共享镜像，然后将这些 lanes 扇出为并行的目标 Docker 任务，并使用唯一构件。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果软件包验收解析了一个 `package-under-test` 构件，它会安装同一个构件；独立 Telegram 分发仍可安装已发布的 npm 规范。
4. 如果软件包解析、Docker 验收或可选 Telegram lane 失败，`summary` 会使工作流失败。

### 候选来源

- `source=npm` 只接受 `openclaw@alpha`、`openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布的预发布/稳定版验收。
- `source=ref` 打包可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签到达，在分离 worktree 中安装依赖，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact` 从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享构件应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的可信工作流/harness 代码。`package_ref` 是当 `source=ref` 时要打包的源提交。这让当前测试 harness 能够验证较旧的可信源提交，而不运行旧的工作流逻辑。

### 套件配置档

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 带 OpenWebUI 的完整 Docker 发布路径分块
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

`package` 配置档使用离线插件覆盖，因此已发布软件包验证不会受实时 ClawHub 可用性限制。可选 Telegram lane 会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` 构件，同时为独立分发保留已发布 npm 规范路径。

有关专门的更新和插件测试策略，包括本地命令、Docker lanes、软件包验收输入、发布默认值和失败分诊，请参见[更新和插件测试](/zh-CN/help/testing-updates-plugins)。

发布检查会调用软件包验收，并使用 `source=artifact`、已准备好的发布软件包构件、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai`。这能让软件包迁移、更新、过期插件依赖清理、已配置插件安装修复、离线插件、插件更新和 Telegram 证明都基于同一个已解析的软件包 tarball。在 Full Release Validation 或 OpenClaw Release Checks 上设置 `package_acceptance_package_spec`，可对已发布的 npm 软件包运行同一矩阵，而不是针对 SHA 构建的构件运行。跨操作系统发布检查仍覆盖特定操作系统的新手引导、安装程序和平台行为；软件包/更新产品验证应从软件包验收开始。`published-upgrade-survivor` Docker lane 在每次运行中验证一个已发布软件包基线。在软件包验收中，已解析的 `package-under-test` tarball 始终是候选包，而 `published_upgrade_survivor_baseline` 选择回退的已发布基线，默认是 `openclaw@latest`；失败 lane 重跑命令会保留该基线。设置 `published_upgrade_survivor_baselines=all-since-2026.4.23`，可将完整发布 CI 扩展到从 `2026.4.23` 到 `latest` 的每个稳定 npm 发布；`release-history` 仍可用于使用较旧日期前锚点的手动更广采样。设置 `published_upgrade_survivor_scenarios=reported-issues`，可将同一组基线扩展到类似问题的夹具，覆盖 Feishu 配置、保留的 bootstrap/persona 文件、已配置的 OpenClaw 插件安装、波浪号日志路径和过期旧版插件依赖根。单独的 `Update Migration` 工作流在问题是穷尽式已发布更新清理而非普通完整发布 CI 广度时，会使用带 `all-since-2026.4.23` 和 `plugin-deps-cleanup` 的 `update-migration` Docker lane。本地聚合运行可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传入精确软件包规范，通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持单个 lane，例如 `openclaw@2026.4.15`，或者为场景矩阵设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`。已发布 lane 会用内置的 `openclaw config set` 命令配方配置基线，在 `summary.json` 中记录配方步骤，并在 Gateway 网关启动后探测 `/healthz`、`/readyz` 以及 RPC 状态。Windows 打包和安装程序全新安装 lanes 还会验证已安装软件包可以从原始绝对 Windows 路径导入 browser-control 覆盖。OpenAI 跨操作系统 agent 回合冒烟在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因此安装和 Gateway 网关证明会保留在 GPT-5 测试模型上，同时避免 GPT-4.x 默认值。

### 旧版兼容窗口

软件包验收为已经发布的软件包提供有界旧版兼容窗口。到 `2026.4.25` 为止的软件包，包括 `2026.4.25-beta.*`，可以使用兼容路径：

- `dist/postinstall-inventory.json` 中的已知私有 QA 条目可以指向 tarball 中省略的文件；
- 当软件包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过其持久化子用例；
- `update-channel-switch` 可以从 tarball 派生的伪 git 夹具中剪除缺失的 `pnpm.patchedDependencies`，并且可以记录缺失的持久化 `update.channel`；
- 插件冒烟可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重装行为保持不变。

已发布的 `2026.4.26` 软件包也可以对已发布的本地构建元数据戳文件发出警告。后续软件包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，先查看 `resolve_package` 摘要，以确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、测试线日志、阶段耗时和重新运行命令。优先重新运行失败的包配置文件或精确 Docker 测试线，而不是重新运行完整发布验证。

## 安装冒烟测试

独立的 `Install Smoke` 工作流通过自己的 `preflight` 作业复用同一个作用域脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径** 会在拉取请求触及 Docker/包表面、内置插件包/清单变更，或 Docker 冒烟作业会覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面时运行。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker 工作器。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete 共享工作区 CLI 冒烟测试，运行容器 gateway-network e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker 配置文件（每个场景的 Docker 运行单独设有上限）。
- **完整路径** 为夜间定时运行、手动分派、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的拉取请求保留 QR 包安装和安装器 Docker/更新覆盖。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟测试、安装器/更新冒烟测试，以及快速内置插件 Docker E2E 作为独立作业运行，因此安装器工作不必等待根镜像冒烟测试。

`main` 推送（包括合并提交）不会强制完整路径；当变更作用域逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker 冒烟测试，并把完整安装冒烟测试留给夜间或发布验证。

较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独控制。它会在夜间计划和发布检查工作流中运行，手动 `Install Smoke` 分派也可以选择加入它，但拉取请求和 `main` 推送不会运行。QR 和安装器 Docker 测试保留各自以安装为重点的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享实时测试镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 一个用于安装器/更新/plugin-dependency 测试线的裸 Node/Git 运行器；
- 一个会把同一个 tarball 安装到 `/app`、用于常规功能测试线的功能镜像。

Docker 测试线定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行选中的计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每条测试线选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行测试线。

### 可调参数

| 变量                                   | 默认值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 常规测试线的主池槽位数。                                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 提供商敏感尾池的槽位数。                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发实时测试线上限，避免提供商限流。                                                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 并发 npm 安装测试线上限。                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务测试线上限。                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 测试线启动之间的错峰间隔，用于避免 Docker daemon 创建风暴；设置为 `0` 表示不做错峰。          |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每条测试线的兜底超时（120 分钟）；选定的实时/尾部测试线使用更严格的上限。                    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 会打印调度器计划而不运行测试线。                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 逗号分隔的精确测试线列表；跳过清理冒烟测试，以便智能体复现一条失败测试线。                   |

比其有效上限更重的测试线仍可从空池启动，然后会独占运行，直到释放容量。本地聚合会预检 Docker，移除过期的 OpenClaw E2E 容器，输出活动测试线状态，持久化测试线耗时以便按最长优先排序，并且默认在第一次失败后停止调度新的池化测试线。

### 可复用实时/E2E 工作流

可复用实时/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪种包、镜像种类、实时镜像、测试线和凭据覆盖。随后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包工件，或从 `package_artifact_run_id` 下载包工件；验证 tarball 清单；在计划需要已安装包的测试线时，通过 Blacksmith 的 Docker layer cache 构建并推送带包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。Docker 镜像拉取会使用有界的每次尝试 180 秒超时重试，因此卡住的 registry/cache 流会快速重试，而不会消耗 CI 关键路径的大部分时间。

### 发布路径分块

发布 Docker 覆盖会使用带有 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的较小分块作业运行，因此每个分块只拉取它需要的镜像种类，并通过同一个加权调度器执行多条测试线：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

当前发布 Docker 分块为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及从 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍保留为聚合插件/运行时别名。`install-e2e` 测试线别名仍是两个提供商安装器测试线的聚合手动重新运行别名。

当完整 release-path 覆盖请求 OpenWebUI 时，它会被并入 `plugins-runtime-services`，并且仅为 OpenWebUI 专用分派保留独立的 `openwebui` 分块。内置渠道更新测试线会针对短暂 npm 网络故障重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含测试线日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢测试线表，以及每条测试线的重新运行命令。工作流 `docker_lanes` 输入会针对已准备的镜像运行选定测试线，而不是运行分块作业，这样就能把失败测试线调试限制在一个目标 Docker 作业内，并为该运行准备、下载或复用包工件；如果选中的测试线是实时 Docker 测试线，目标作业会为该次重新运行在本地构建实时测试镜像。生成的每条测试线 GitHub 重新运行命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备的镜像输入，因此失败测试线可以复用失败运行中的精确包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

计划的实时/E2E 工作流每天运行完整 release-path Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个由 `Full Release Validation` 或显式操作员分派的独立工作流。普通拉取请求、`main` 推送和独立手动 CI 分派都会关闭该套件。它会在八个扩展工作器之间平衡内置插件测试；这些扩展分片作业一次最多运行两个插件配置组，每个组使用一个 Vitest 工作器和更大的 Node 堆，因此导入密集的插件批次不会创建额外 CI 作业。仅发布的 Docker 预发布路径会将目标 Docker 测试线按小组批处理，以避免为一到三分钟的作业占用大量运行器。

## QA Lab

QA Lab 在主智能作用域工作流之外有专用 CI 测试线。智能体一致性嵌套在广泛的 QA 和发布 harness 下，而不是独立的 PR 工作流。当一致性应随广泛验证运行一起执行时，使用带有 `rerun_group=qa-parity` 的 `Full Release Validation`。

- `QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，并支持手动分派；它会将模拟一致性测试线、实时 Matrix 测试线，以及实时 Telegram 和 Discord 测试线展开为并行作业。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。

发布检查使用确定性模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 与 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输测试线，因此渠道契约会与实时模型延迟和常规提供商插件启动隔离。实时传输 Gateway 网关会禁用记忆搜索，因为 QA 一致性会单独覆盖记忆行为；提供商连通性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 对计划和发布门禁使用 `--profile fast`，并且仅在检出的 CLI 支持时添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分派始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 测试线；它的 QA 一致性门禁会将候选包和基线包作为并行测试线作业运行，然后将两个工件下载到一个小型报告作业中，用于最终一致性比较。

对于普通 PR，请遵循作用域内 CI/检查证据，而不是将一致性视为必需状态。

## CodeQL

`CodeQL` 工作流有意作为范围较窄的第一轮安全扫描器，而不是完整的仓库扫描。每日、手动和非草稿拉取请求守护运行会扫描 Actions 工作流代码，以及最高风险的 JavaScript/TypeScript 表面，并使用高置信度安全查询筛选出 high/critical `security-severity`。

拉取请求守护保持轻量：它只会针对 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的变更启动，并运行与定时工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不在 PR 默认范围内。

### 安全类别

| 类别                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 凭证、密钥、沙箱、cron 和 Gateway 网关基线                                                                                          |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥、审计接触点                                                       |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络守护、web-fetch 和插件 SDK SSRF 策略表面                                                                     |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助工具、出站交付，以及智能体工具执行闸门                                                                       |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、清单、注册表、包管理器安装、源加载，以及插件 SDK 包契约信任表面                                                    |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 定时 Android 安全分片。在工作流完整性检查接受的最小 Blacksmith Linux 运行器上为 CodeQL 手动构建 Android 应用。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并上传到 `/codeql-critical-security/macos` 下。由于 macOS 构建即使干净也会主导运行时间，因此保持在每日默认范围之外。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它只在较小的 Blacksmith Linux 运行器上，针对范围较窄的高价值表面运行 error-severity、非安全的 JavaScript/TypeScript 质量查询。它的拉取请求守护有意小于定时配置：非草稿 PR 只会针对智能体命令/模型/工具执行和回复分发代码、配置 schema/迁移/IO 代码、凭证/密钥/沙箱/安全代码、核心渠道和内置渠道插件运行时、Gateway 网关协议/server-method、记忆运行时/SDK 胶水、MCP/进程/出站交付、提供商运行时/模型目录、会话诊断/交付队列、插件加载器、插件 SDK/包契约，或插件 SDK 回复运行时变更，运行匹配的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 配置和质量工作流变更会运行全部十二个 PR 质量分片。

手动调度接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

这些窄配置是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 表面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 凭证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                                |
| `/codeql-critical-quality/config-boundary`              | 配置 schema、迁移、规范化和 IO 契约                                                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议 schema 和服务器方法契约                                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约                                                                                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥接、进程监督辅助工具，以及出站交付契约                                                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆主机 SDK、记忆运行时 facade、记忆插件 SDK 别名、记忆运行时激活胶水，以及记忆 Doctor 命令                                                                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话交付队列、出站会话绑定/交付辅助工具、诊断事件/日志包表面，以及会话 Doctor CLI 契约                                                         |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复 payload/分块/运行时辅助工具、渠道回复选项、交付队列，以及会话/线程绑定辅助工具                                                       |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商凭证和设备发现、提供商运行时注册、提供商默认值/目录，以及 web/search/fetch/embedding 注册表                                                |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 启动、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、媒体 IO、媒体理解、图像生成和媒体生成运行时契约                                                                                            |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公共表面和插件 SDK 入口点契约                                                                                                                     |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧插件 SDK 源代码和插件包契约辅助工具                                                                                                                     |

质量与安全保持分离，因此质量发现可以被定时运行、度量、禁用或扩展，而不会遮蔽安全信号。Swift、Python 和内置插件的 CodeQL 扩展只应在窄配置具备稳定运行时间和信号之后，作为有范围或分片的后续工作重新加入。

## 维护工作流

### Docs Agent

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时计划：`main` 上成功的非 bot push CI 运行可以触发它，手动调度也可以直接运行它。当 `main` 已经向前移动，或过去一小时内已经创建了另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档检查以来累积的所有 main 变更。

### Test Performance Agent

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上成功的非 bot push CI 运行可以触发它，但如果当天 UTC 已有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动调度会绕过这个每日活动闸门。该通道会生成完整套件分组 Vitest 性能报告，让 Codex 只做保持覆盖率的小型测试性能修复，而不是广泛重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显失败，并且 agent 后的完整套件报告必须通过后才能提交任何内容。当 bot push 落地前 `main` 向前推进时，该通道会 rebase 已验证的补丁、重新运行 `pnpm check:changed`，并重试 push；有冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于落地后的重复项清理。它默认 dry-run，并且只有在 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会验证已落地 PR 已合并，并且每个重复项都有共享的引用 issue 或重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查闸门和变更路由

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查闸门在架构边界上比宽泛的 CI 平台范围更严格：

- 核心生产变更会运行核心 prod 和核心 test 类型检查，以及核心 lint/guards；
- 仅核心测试的变更只会运行核心 test 类型检查，以及核心 lint；
- 插件生产变更会运行插件 prod 和插件 test 类型检查，以及插件 lint；
- 仅插件测试的变更会运行插件 test 类型检查，以及插件 lint；
- 公共插件 SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约（Vitest 插件扫描仍然是显式测试工作）；
- 仅发布元数据的版本 bump 会运行定向版本/配置/根依赖检查；
- 未知根目录/配置变更会安全失败到所有检查通道。

本地 changed-test 路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更便宜：直接测试编辑会运行自身，源代码编辑优先使用显式映射，然后是同级测试和 import-graph 依赖项。共享群组房间交付配置是显式映射之一：对群组可见回复配置、源回复交付模式或 message-tool 系统提示的变更，会通过核心回复测试以及 Discord 和 Slack 交付回归测试进行路由，因此共享默认值变更会在第一次 PR push 前失败。只有当变更覆盖整个 harness，以至于廉价映射集合不能作为可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

从仓库根目录运行 Testbox，并优先使用新的已预热 box 做广泛验证。在复用过、已过期，或刚报告了异常大规模同步的 box 上投入慢速门禁前，先在该 box 内运行 `pnpm testbox:sanity`。

当 `pnpm-lock.yaml` 等必需根目录文件消失，或 `git status --short` 显示至少 200 个已跟踪文件被删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本；停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意进行大规模删除的 PR，为该完整性检查运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

如果本地 Blacksmith CLI 调用停留在同步阶段超过五分钟且没有同步后的输出，`pnpm testbox:run` 也会终止该调用。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该保护，或为异常大的本地 diff 使用更大的毫秒值。

当 Blacksmith 不可用，或更适合使用自有云容量时，Crabbox 是仓库自有的第二条 Linux 远程 box 验证路径。预热一个 box，通过项目工作流注水，然后通过 Crabbox CLI 运行命令：

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` 负责提供商、同步和 GitHub Actions 注水默认值。它会排除本地 `.git`，这样注水后的 Actions checkout 会保留自己的远程 Git 元数据，而不是同步维护者本地的 remote 和 object store；它还会排除不应被传输的本地运行时/构建产物。`.github/workflows/crabbox-hydrate.yml` 负责 checkout、Node/pnpm 设置、`origin/main` 获取，以及非 secret 环境交接，后续的 `crabbox run --id <cbx_id>` 命令会加载这些环境。

## 相关

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
