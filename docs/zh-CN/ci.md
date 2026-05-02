---
read_when:
    - 你需要了解某个 CI 作业为什么运行了或没有运行
    - 你正在调试一个失败的 GitHub Actions 检查
    - 你正在协调发布验证的运行或重新运行
    - 你正在更改 ClawSweeper 调度或 GitHub 活动转发
summary: CI 作业图、范围门禁、发布总括流程和本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-05-02T22:39:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d8e929702c21ad52152eb518a6c775613b1858653932a088d701e6014be0de9
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 会在每次推送到 `main` 以及每个拉取请求上运行。`preflight` 作业会对差异进行分类，并在只有无关区域发生变更时关闭昂贵的通道。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为候选发布版本和广泛验证展开完整图。Android 通道通过 `include_android` 保持选择加入。仅发布使用的插件覆盖率位于单独的 [`插件预发布`](#plugin-prerelease) 工作流中，并且只会从 [`完整发布验证`](#full-release-validation) 或显式手动分发运行。

## 流水线概览

| 作业                              | 用途                                                                                                             | 运行时机                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更的 extensions，并构建 CI 清单                             | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                               | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm 公告执行无依赖的生产 lockfile 审计                                                    | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合项                                                                       | 始终在非草稿推送和 PR 上运行 |
| `check-dependencies`             | 生产 Knip 仅依赖检查，加上未使用文件 allowlist 防护                                           | Node 相关变更              |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查以及可复用的下游产物                                 | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                                        | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，带稳定的聚合检查结果                                                | Node 相关变更              |
| `checks-node-core-test`          | Core Node 测试分片，不包含渠道、内置、契约和 extension 通道                                    | Node 相关变更              |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、防护、测试类型和严格 smoke                          | Node 相关变更              |
| `check-additional`               | 架构、边界、提示词快照漂移、extension 表面防护、包边界和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                                                      | Node 相关变更              |
| `checks`                         | 已构建产物渠道测试的验证器                                                                           | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                                          | 发布用手动 CI 分发    |
| `check-docs`                     | 文档格式、lint 和断链检查                                                                       | 文档已变更                       |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                                                              | Python Skill 相关变更      |
| `checks-windows`                 | Windows 特定进程/路径测试，加上共享运行时导入说明符回归检查                                | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                         | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                                      | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，加上一次 debug APK 构建                                                        | Android 相关变更           |
| `test-performance-agent`         | 受信任活动后的每日 Codex 慢测试优化                                                           | Main CI 成功或手动分发 |
| `openclaw-performance`           | 每日/按需 Kova 运行时性能报告，包含 mock-provider、deep-profile 和 GPT 5.4 实时通道           | 定时和手动分发      |

## 快速失败顺序

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道重叠运行，因此共享构建准备好后，下游消费者可以立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

当同一 PR 或 `main` ref 上有更新的推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已被取代后继续排队。自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸项无法无限期阻塞更新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 范围和路由

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动分发会跳过变更范围检测，并让 preflight 清单表现得像每个有范围的区域都已变更。

- **CI 工作流编辑** 会验证 Node CI 图以及工作流 linting，但不会单独强制 Windows、Android 或 macOS 原生构建；这些平台通道仍然限定于平台源代码变更。
- **仅 CI 路由编辑、选定的低成本 core-test fixture 编辑，以及窄范围插件契约 helper/测试路由编辑** 使用快速的仅 Node 清单路径：`preflight`、安全检查和单个 `checks-fast-core` 任务。当变更仅限于快速任务直接覆盖的路由或 helper 表面时，该路径会跳过构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片和附加防护矩阵。
- **Windows Node 检查** 限定于 Windows 特定的进程/路径包装器、npm/pnpm/UI runner helper、包管理器配置，以及执行该通道的 CI 工作流表面；无关源代码、插件、install-smoke 和仅测试变更仍留在 Linux Node 通道上。

最慢的 Node 测试族会被拆分或平衡，使每个作业保持小规模且不过度预留 runner：渠道契约作为三个加权分片运行，小型 core 单元通道会成对运行，auto-reply 作为四个均衡 worker 运行（reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片），agentic gateway/插件配置会分散到现有仅源代码的 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件 catch-all。Include-pattern 分片使用 CI 分片名称记录时间条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和经过过滤的分片。`check-additional` 将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖率分开；边界防护分片会在一个作业内并发运行其小型独立防护，包括 `pnpm prompt:snapshots:check`，因此 Codex 运行时 happy-path 提示词漂移会固定到导致它的 PR。Gateway watch、渠道测试和 core 支持边界分片会在 `dist/` 和 `dist-runtime/` 已构建后，于 `build-artifacts` 内并发运行。

Android CI 会运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。third-party flavor 没有单独的 source set 或清单；其单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包作业。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`（一个生产 Knip 仅依赖检查，固定到最新 Knip 版本，并在 `dlx` 安装时禁用 pnpm 的 minimum release age）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 新增了未经审查的未使用文件，或留下过期 allowlist 条目时，未使用文件防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成产物、构建、实时测试和包桥接表面。

## ClawSweeper 活动转发

`.github/workflows/clawsweeper-dispatch.yml` 是从 OpenClaw 仓库活动到 ClawSweeper 的目标侧桥接。它不会 checkout 或执行不受信任的拉取请求代码。该工作流会从 `CLAWSWEEPER_APP_PRIVATE_KEY` 创建 GitHub App token，然后将紧凑的 `repository_dispatch` 负载分发到 `openclaw/clawsweeper`。

该工作流有四个通道：

- `clawsweeper_item` 用于精确的问题和拉取请求 review 请求；
- `clawsweeper_comment` 用于 issue 评论中的显式 ClawSweeper 命令；
- `clawsweeper_commit_review` 用于 `main` 推送上的 commit 级 review 请求；
- `github_activity` 用于 ClawSweeper agent 可能检查的一般 GitHub 活动。

`github_activity` 通道只转发规范化元数据：事件类型、操作、actor、仓库、条目编号、URL、标题、状态，以及存在评论或 review 时的短摘录。它有意避免转发完整 webhook body。`openclaw/clawsweeper` 中的接收工作流是 `.github/workflows/github-activity.yml`，它会将规范化事件发布到用于 ClawSweeper agent 的 OpenClaw Gateway 网关 hook。

一般活动是观察，而不是默认投递。ClawSweeper agent 会在其提示词中收到 Discord 目标，并且只有当事件令人意外、可操作、有风险或对运维有用时，才应发布到 `#clawsweeper`。例行打开、编辑、机器人 churn、重复 webhook 噪声和正常 review 流量应产生 `NO_REPLY`。

在整个路径中，将 GitHub 标题、评论、正文、review 文本、分支名称和 commit 消息视为不受信任的数据。它们是用于摘要和分诊的输入，而不是工作流或 agent 运行时的指令。

## 手动分发

手动 CI 分发运行与普通 CI 相同的作业图，但会强制启用每个非 Android 作用域的通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立的手动 CI 分发仅在 `include_android=true` 时运行 Android；完整发布总控通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布使用的 `agentic-plugins` 分片、完整扩展批量扫描以及插件预发布 Docker 通道都不包含在 CI 中。Docker 预发布套件仅在 `Full Release Validation` 通过启用发布验证门禁分发单独的 `Plugin Prerelease` 工作流时运行。

手动运行使用唯一并发组，因此发布候选完整套件不会被同一 ref 上的另一个 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用者在使用所选分发 ref 中的工作流文件的同时，针对分支、标签或完整提交 SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 预检也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的扩展分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（对 CPU 足够敏感，8 vCPU 的成本高于节省的成本）；install-smoke Docker 构建（32-vCPU 排队时间的成本高于节省的成本）                                                                                                                                                                                                                                                                                                                     |
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

`OpenClaw Performance` 是产品/运行时性能工作流。它每天在 `main` 上运行，也可以手动分发：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

该工作流从固定发布版本安装 OCM，并从固定的 `kova_ref` 输入安装 Kova，然后运行三个通道：

- `mock-provider`：使用确定性的假 OpenAI 兼容鉴权，针对本地构建运行时运行 Kova 诊断场景。
- `mock-deep-profile`：针对启动、Gateway 网关和智能体回合热点进行 CPU/堆/跟踪分析。
- `live-gpt54`：真实 OpenAI `openai/gpt-5.4` 智能体回合，在 `OPENAI_API_KEY` 不可用时跳过。

mock-provider 通道还会在 Kova 执行后运行 OpenClaw 原生源码探针：默认、钩子和 50 插件启动场景下的 Gateway 网关启动耗时和内存；重复的模拟 OpenAI `channel-chat-baseline` hello 循环；以及针对已启动 Gateway 网关的 CLI 启动命令。源码探针 Markdown 摘要位于报告包中的 `source/index.md`，原始 JSON 位于旁边。

每个通道都会上传 GitHub artifacts。当配置了 `CLAWGRIT_REPORTS_TOKEN` 时，该工作流还会将 `report.json`、`report.md`、包、`index.md` 和源码探针 artifacts 提交到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` 下。当前分支指针会写入 `openclaw-performance/<ref>/latest-<lane>.json`。

## 完整发布验证

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标分发手动 `CI` 工作流，为仅发布使用的插件/包/静态/Docker 证明分发 `Plugin Prerelease`，并为安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道分发 `OpenClaw Release Checks`。使用 `rerun_group=all` 和 `release_profile=full` 时，它还会针对来自发布检查的 `release-package-under-test` artifact 运行 `NPM Telegram Beta E2E`。发布后，传入 `npm_telegram_package_spec` 可针对已发布的 npm 包重新运行同一 Telegram 包通道。

有关阶段矩阵、确切工作流作业名称、profile 差异、artifacts 和聚焦重跑句柄，请参阅[完整发布验证](/zh-CN/reference/full-release-validation)。

`OpenClaw Release Publish` 是会产生变更的手动发布工作流。在发布标签存在且 OpenClaw npm 预检成功后，从 `release/YYYY.M.D` 或 `main` 分发它。它会验证 `pnpm plugins:sync:check`，为所有可发布插件包分发 `Plugin NPM Release`，为同一发布 SHA 分发 `Plugin ClawHub Release`，然后才使用保存的 `preflight_run_id` 分发 `OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

对于快速变化分支上的固定提交证明，请使用辅助命令，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流分发 ref 必须是分支或标签，不能是原始提交 SHA。该辅助命令会在目标 SHA 处推送一个临时 `release-ci/<sha>-...` 分支，从该固定 ref 分发 `Full Release Validation`，验证每个子工作流的 `headSha` 都与目标匹配，并在运行完成时删除临时分支。如果任何子工作流在不同 SHA 上运行，总控验证器也会失败。

`release_profile` 控制传入发布检查的 live/提供商覆盖范围。手动发布工作流默认使用 `stable`；仅在你有意需要广泛 advisory 提供商/媒体矩阵时才使用 `full`。

- `minimum` 保留最快的 OpenAI/核心发布关键通道。
- `stable` 添加稳定的提供商/后端集合。
- `full` 运行广泛 advisory 提供商/媒体矩阵。

总控会记录已分发的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果子工作流被重新运行并变绿，只需重新运行父验证器作业，即可刷新总控结果和耗时摘要。

恢复时，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对发布候选版本使用 `all`，仅对普通完整 CI 子项使用 `ci`，仅对插件预发布子项使用 `plugin-prerelease`，对每个发布子项使用 `release-checks`，或者在 umbrella 上使用更窄的分组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这会在完成针对性修复后，将失败发布框的重跑范围限制住。

`OpenClaw Release Checks` 使用受信任的工作流引用，将所选引用解析一次为 `release-package-under-test` tarball，然后把该制品传给 live/E2E 发布路径 Docker 工作流和包验收分片。这能让发布框之间的包字节保持一致，并避免在多个子任务中重复打包同一个候选版本。

针对 `ref=main` 和 `rerun_group=all` 的重复 `Full Release Validation` 运行会取代旧的 umbrella。父级监控器在父级被取消时，会取消它已经派发的任何子工作流，因此较新的 main 验证不会排在一个过时的两小时 release-check 运行后面。发布分支/标签验证和针对性重跑分组保留 `cancel-in-progress: false`。

## Live 和 E2E 分片

发布 live/E2E 子项保留宽覆盖的原生 `pnpm test:live`，但通过 `scripts/test-live-shard.mjs` 以命名分片运行，而不是一个串行任务：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 提供商过滤的 `native-live-src-gateway-profiles` 任务
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分后的媒体音频/视频分片，以及提供商过滤的音乐分片

这能保持相同的文件覆盖范围，同时让缓慢的 live 提供商失败更容易重跑和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重跑。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装了 `ffmpeg` 和 `ffprobe`；媒体任务只在设置前验证这些二进制文件。让 Docker 支持的 live 套件继续在普通 Blacksmith runner 上运行，容器任务并不适合启动嵌套 Docker 测试。

Docker 支持的 live 模型/后端分片对每个所选提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live 发布工作流构建并推送该镜像一次，然后 Docker live 模型、按提供商分片的 Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway 网关 Docker 分片带有显式的脚本级 `timeout` 上限，低于工作流任务超时，因此卡住的容器或清理路径会快速失败，而不是耗尽整个 release-check 预算。如果这些分片独立重建完整源 Docker 目标，说明发布运行配置错误，并会在重复镜像构建上浪费墙钟时间。

## 包验收

当问题是“这个可安装的 OpenClaw 包是否能作为产品正常工作？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证源代码树，而包验收通过用户在安装或更新后实际使用的同一套 Docker E2E harness 来验证单个 tarball。

### 任务

1. `resolve_package` 签出 `workflow_ref`，解析一个包候选版本，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者作为 `package-under-test` 制品上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和配置档。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。可复用工作流会下载该制品，验证 tarball 清单，在需要时准备包摘要 Docker 镜像，并针对该包运行所选 Docker 通道，而不是打包工作流签出的内容。当某个配置档选择多个定向 `docker_lanes` 时，可复用工作流会先准备包和共享镜像一次，然后将这些通道扇出为并行的定向 Docker 任务，并生成唯一制品。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果包验收解析出了一个包，它会安装同一个 `package-under-test` 制品；独立的 Telegram 派发仍可安装已发布的 npm spec。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时让工作流失败。

### 候选来源

- `source=npm` 只接受 `openclaw@alpha`、`openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将它用于已发布的预发布/稳定版验收。
- `source=ref` 会打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离 worktree 中安装依赖，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact` 从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选项，但对外共享制品应提供它。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是 `source=ref` 时会被打包的源提交。这让当前测试 harness 可以验证较旧的受信任源提交，而不运行旧的工作流逻辑。

### 套件配置档

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 带 OpenWebUI 的完整 Docker 发布路径分块
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

`package` 配置档使用离线插件覆盖范围，因此已发布包验证不会受 live ClawHub 可用性限制。可选 Telegram 通道会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` 制品，同时为独立派发保留已发布 npm spec 路径。

有关专门的更新和插件测试策略，包括本地命令、Docker 通道、包验收输入、发布默认值和失败分诊，请参阅 [更新和插件测试](/zh-CN/help/testing-updates-plugins)。

发布检查调用包验收时使用 `source=artifact`、准备好的发布包制品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai`。这会让包迁移、更新、陈旧插件依赖清理、已配置插件安装修复、离线插件、插件更新和 Telegram 证明使用同一个已解析包 tarball。在 Full Release Validation 或 OpenClaw Release Checks 上设置 `package_acceptance_package_spec`，可针对已发布的 npm 包而不是按 SHA 构建的制品运行同一矩阵。跨 OS 发布检查仍覆盖 OS 特定的新手引导、安装器和平台行为；包/更新产品验证应从包验收开始。`published-upgrade-survivor` Docker 通道每次运行验证一个已发布包基线。在包验收中，已解析的 `package-under-test` tarball 始终是候选版本，而 `published_upgrade_survivor_baseline` 选择回退的已发布基线，默认是 `openclaw@latest`；失败通道重跑命令会保留该基线。设置 `published_upgrade_survivor_baselines=all-since-2026.4.23` 可将 Full Release CI 扩展到从 `2026.4.23` 到 `latest` 的每个稳定 npm 版本；`release-history` 仍可用于手动进行更宽的采样，并使用较旧的预日期锚点。设置 `published_upgrade_survivor_scenarios=reported-issues` 可将同一组基线扩展到 issue 形态的夹具，覆盖 Feishu 配置、保留的 bootstrap/persona 文件、已配置的 OpenClaw 插件安装、波浪号日志路径和陈旧的旧版插件依赖根。单独的 `Update Migration` 工作流在问题是全面的已发布更新清理，而不是普通 Full Release CI 广度时，会使用带 `all-since-2026.4.23` 和 `plugin-deps-cleanup` 的 `update-migration` Docker 通道。本地聚合运行可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传入精确包 spec，通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持单个通道，例如 `openclaw@2026.4.15`，或设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 用于场景矩阵。已发布通道使用内置的 `openclaw config set` 命令配方配置基线，在 `summary.json` 中记录配方步骤，并在 Gateway 网关启动后探测 `/healthz`、`/readyz` 以及 RPC 状态。Windows 打包版和安装器全新安装通道还会验证已安装包可以从原始绝对 Windows 路径导入浏览器控制覆盖项。OpenAI 跨 OS agent turn smoke 在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4`，因此安装和 Gateway 网关证明会停留在 GPT-5 测试模型上，同时避免 GPT-4.x 默认值。

### 旧版兼容窗口

包验收对已发布包有有限的旧版兼容窗口。到 `2026.4.25` 为止的包，包括 `2026.4.25-beta.*`，可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可以指向 tarball 省略的文件；
- 当包未公开 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；
- `update-channel-switch` 可以从 tarball 派生的假 git 夹具中修剪缺失的 `pnpm.patchedDependencies`，并且可以记录缺失的已持久化 `update.channel`；
- 插件 smoke 可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和无重装行为保持不变。

已发布的 `2026.4.26` 包也可以对已经发出的本地构建元数据戳记文件发出警告。之后的包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，先从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段耗时和重新运行命令。优先重新运行失败的包配置文件或精确的 Docker lane，而不是重新运行完整发布验证。

## 安装冒烟测试

独立的 `Install Smoke` 工作流通过自己的 `preflight` job 复用同一个范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径**会针对触及 Docker/包表面、内置插件包/清单变更，或 Docker 冒烟 job 会覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面的拉取请求运行。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会预留 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行智能体删除共享工作区 CLI 冒烟测试，运行容器 Gateway 网关网络 e2e，验证内置插件构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker 配置文件（每个场景的 Docker 运行会单独封顶）。
- **完整路径**保留 QR 包安装以及安装器 Docker/更新覆盖，用于夜间定时运行、手动派发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的拉取请求。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟、安装器/更新冒烟，以及快速内置插件 Docker E2E 作为独立 job 运行，这样安装器工作不会排在根镜像冒烟之后等待。

`main` 推送（包括 merge commit）不会强制走完整路径；当变更范围逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker 冒烟，并将完整安装冒烟留给夜间运行或发布验证。

较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独控制。它会在夜间计划和发布检查工作流中运行，手动 `Install Smoke` 派发也可以选择启用它，但拉取请求和 `main` 推送不会运行。QR 和安装器 Docker 测试保留各自聚焦安装的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享的实时测试镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 用于安装器/更新/插件依赖 lane 的裸 Node/Git runner；
- 将同一个 tarball 安装到 `/app` 的功能镜像，用于普通功能 lane。

Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选中的计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 lane。

### 可调参数

| 变量                                   | 默认值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 普通 lane 的主池槽位数。                                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 对提供商敏感的尾池槽位数。                                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发实时 lane 上限，避免提供商限流。                                                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 并发 npm 安装 lane 上限。                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务 lane 上限。                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 启动之间的错峰间隔，避免 Docker daemon 创建风暴；设为 `0` 表示不做错峰。                 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每个 lane 的回退超时（120 分钟）；选定的实时/尾部 lane 使用更严格的上限。                     |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未设置  | `1` 会打印调度器计划而不运行 lane。                                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未设置  | 逗号分隔的精确 lane 列表；跳过清理冒烟测试，以便智能体复现某个失败 lane。                    |

重于其有效上限的 lane 仍可从空池启动，然后独自运行，直到它释放容量。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活跃 lane 状态，持久化 lane 耗时以进行最长优先排序，并默认在第一次失败后停止调度新的池化 lane。

### 可复用实时/E2E 工作流

可复用实时/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像种类、实时镜像、lane 和凭证覆盖。`scripts/docker-e2e.mjs` 随后将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包工件，或从 `package_artifact_run_id` 下载包工件；验证 tarball 清单；当计划需要已安装包的 lane 时，通过 Blacksmith 的 Docker layer cache 构建并推送带包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有的包摘要镜像，而不是重新构建。Docker 镜像拉取会使用有界的每次尝试 180 秒超时进行重试，这样卡住的 registry/cache 流会快速重试，而不是消耗 CI 关键路径的大部分时间。

### 发布路径分块

发布 Docker 覆盖会用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行更小的分块 job，因此每个分块只拉取它需要的镜像种类，并通过同一个加权调度器执行多个 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

当前发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及从 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合插件/运行时别名。`install-e2e` lane 别名仍是两个提供商安装器 lane 的聚合手动重新运行别名。

当完整发布路径覆盖请求 OpenWebUI 时，它会并入 `plugins-runtime-services`，并且仅为仅 OpenWebUI 的派发保留独立的 `openwebui` 分块。内置渠道更新 lane 会针对临时 npm 网络失败重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢 lane 表，以及每个 lane 的重新运行命令。工作流的 `docker_lanes` 输入会针对已准备的镜像运行选定 lane，而不是运行分块 job，这样失败 lane 调试会被限制在一个定向 Docker job 内，并为该次运行准备、下载或复用包工件；如果选定 lane 是实时 Docker lane，定向 job 会为该次重新运行在本地构建实时测试镜像。生成的每个 lane GitHub 重新运行命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败的 lane 可以复用失败运行中的精确包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

计划的实时/E2E 工作流每天运行完整发布路径 Docker 套件。

## 插件预发布

`Plugin Prerelease` 是更昂贵的产品/包覆盖，因此它是一个独立工作流，由 `Full Release Validation` 或显式操作员派发。普通拉取请求、`main` 推送和独立的手动 CI 派发会保持该套件关闭。它会在八个插件 worker 之间平衡内置插件测试；这些插件分片 job 每次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node heap，这样导入量大的插件批次不会创建额外的 CI job。仅发布的 Docker 预发布路径会将定向 Docker lane 按小组批处理，以避免为一到三分钟的 job 预留数十个 runner。

## QA Lab

QA Lab 在主智能范围工作流之外有专用 CI lane。Agentic parity 嵌套在广泛 QA 和发布 harness 下，而不是独立的 PR 工作流。当 parity 应随广泛验证运行一起执行时，使用带 `rerun_group=qa-parity` 的 `Full Release Validation`。

- `QA-Lab - All Lanes` 工作流会在 `main` 上夜间运行，并可手动派发；它会将 mock parity lane、实时 Matrix lane，以及实时 Telegram 和 Discord lane 扇出为并行 job。实时 job 使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex leases。

发布检查使用确定性的 mock 提供商和 mock 限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输 lane，因此渠道契约会与实时模型延迟和普通提供商插件启动隔离开。实时传输 Gateway 网关会禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；提供商连接性由独立的实时模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 在计划和发布门禁中使用 `--profile fast`，仅当检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 派发始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` job。

`OpenClaw Release Checks` 还会在发布批准前运行发布关键的 QA Lab lane；其 QA parity 门禁会将候选包和基线包作为并行 lane job 运行，然后将两个工件下载到一个小型报告 job 中，用于最终 parity 比较。

对于普通 PR，遵循有范围的 CI/检查证据，而不是将 parity 视为必需状态。

## CodeQL

`CodeQL` 工作流有意作为范围较窄的首轮安全扫描器，而不是完整的仓库扫描。每日、手动以及非草稿拉取请求守卫运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 表面，并使用高置信度安全查询，筛选高/严重 `security-severity`。

拉取请求守卫保持轻量：它只会在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下有变更时启动，并运行与定时工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不包含在拉取请求默认项中。

### 安全类别

| 类别                                              | 范围                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 认证、密钥、沙箱、cron 和 Gateway 网关基线                                                                                          |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥、审计接触点                                                       |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络防护、web-fetch 和插件 SDK SSRF 策略表面                                                                     |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助工具、出站投递，以及智能体工具执行门禁                                                                       |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、清单、注册表、包管理器安装、源加载，以及插件 SDK 包契约信任表面                                                    |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 定时 Android 安全分片。在工作流健全性接受的最小 Blacksmith Linux runner 上为 CodeQL 手动构建 Android 应用。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并上传到 `/codeql-critical-security/macos` 下。它保持在每日默认项之外，因为即使结果干净，macOS 构建也会主导运行时长。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它只在较小的 Blacksmith Linux runner 上，对范围较窄的高价值表面运行错误严重级别、非安全的 JavaScript/TypeScript 质量查询。它的拉取请求守卫有意小于定时配置：非草稿拉取请求只会针对智能体命令/模型/工具执行和回复分发代码、配置架构/迁移/IO 代码、认证/密钥/沙箱/安全代码、核心渠道和内置渠道插件运行时、Gateway 网关协议/服务器方法、记忆运行时/SDK 粘合代码、MCP/进程/出站投递、提供商运行时/模型目录、会话诊断/投递队列、插件加载器、插件 SDK/包契约，或插件 SDK 回复运行时变更，运行匹配的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 配置和质量工作流变更会运行全部十二个拉取请求质量分片。

手动调度接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

这些窄配置是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 范围                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 认证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                                |
| `/codeql-critical-quality/config-boundary`              | 配置架构、迁移、规范化和 IO 契约                                                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议架构和服务器方法契约                                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商调度、自动回复分发和队列，以及 ACP 控制平面运行时契约                                                                                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥接、进程监督辅助工具，以及出站投递契约                                                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆宿主 SDK、记忆运行时门面、记忆插件 SDK 别名、记忆运行时激活粘合代码，以及记忆 Doctor 命令                                                                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递辅助工具、诊断事件/日志包表面，以及会话 Doctor CLI 契约                                                         |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复载荷/分块/运行时辅助工具、渠道回复选项、投递队列，以及会话/线程绑定辅助工具                                                           |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商认证和设备发现、提供商运行时注册、提供商默认项/目录，以及 Web/搜索/获取/嵌入注册表                                                         |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 引导、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 Web 获取/搜索、媒体 IO、媒体理解、图像生成，以及媒体生成运行时契约                                                                                           |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公开表面，以及插件 SDK 入口点契约                                                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧插件 SDK 源代码和插件包契约辅助工具                                                                                                                     |

质量与安全保持分离，这样质量发现就可以在不遮蔽安全信号的情况下被定时运行、度量、禁用或扩展。Swift、Python 和内置插件 CodeQL 扩展，应只在窄配置拥有稳定运行时和稳定信号之后，作为有范围或分片的后续工作加回。

## 维护工作流

### Docs Agent

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时计划：`main` 上成功的非机器人 push CI 运行可以触发它，手动调度也可以直接运行它。通过 workflow-run 调用时，如果 `main` 已继续前进，或过去一小时内已经创建过另一个未跳过的 Docs Agent 运行，则会跳过。运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档处理以来累积的所有 main 变更。

### Test Performance Agent

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上成功的非机器人 push CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动调度会绕过这个每日活动门禁。该通道会构建完整套件分组 Vitest 性能报告，让 Codex 只做小型、保留覆盖率的测试性能修复，而不是大范围重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显失败项，并且 agent 之后的完整套件报告必须通过，才会提交任何内容。当 `main` 在机器人 push 落地前前进时，该通道会 rebase 已验证补丁，重新运行 `pnpm check:changed`，并重试 push；有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能保持与 docs agent 相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于落地后的重复项清理。它默认 dry-run，只有在 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会验证已落地 PR 已合并，并验证每个重复项要么共享引用的问题，要么有重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门禁和变更路由

本地变更通道路由逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁在架构边界方面比宽泛的 CI 平台范围更严格：

- 核心生产变更运行核心生产和核心测试类型检查，以及核心 lint/guard；
- 仅核心测试变更只运行核心测试类型检查和核心 lint；
- 插件生产变更运行插件生产和插件测试类型检查，以及插件 lint；
- 仅插件测试变更运行插件测试类型检查和插件 lint；
- 公开插件 SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约（Vitest 插件扫描仍然是显式测试工作）；
- 仅发布元数据版本 bump 会运行定向版本/配置/根依赖检查；
- 未知根/配置变更会以失败安全方式进入全部检查通道。

本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更便宜：直接测试编辑运行它们自己，源代码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置是显式映射之一：对群组可见回复配置、源回复投递模式或消息工具系统提示词的变更，会路由到核心回复测试，以及 Discord 和 Slack 投递回归测试，这样共享默认项变更会在首次 PR push 前失败。只有当变更的范围足够覆盖整个 harness，以至于廉价映射集合不是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

从仓库根目录运行 Testbox，并优先使用新预热的 box 来进行广泛验证。在把慢速门禁消耗在复用过、已过期或刚报告了意外大规模同步的 box 上之前，先在该 box 内运行 `pnpm testbox:sanity`。

当 `pnpm-lock.yaml` 等必需的根文件消失，或 `git status --short` 显示至少 200 个已跟踪删除项时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本；应停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意进行大量删除的 PR，请为该完整性检查运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

如果本地 Blacksmith CLI 调用停留在同步阶段超过五分钟且没有同步后输出，`pnpm testbox:run` 也会终止该调用。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该保护；对于异常大的本地差异，也可以使用更大的毫秒值。

当 Blacksmith 不可用，或更适合使用自有云容量时，Crabbox 是仓库自有的第二条远程 box 路径，用于 Linux 验证。预热一个 box，通过项目工作流对其进行填充，然后通过 Crabbox CLI 运行命令：

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` 负责提供商、同步和 GitHub Actions 填充默认值。它会排除本地 `.git`，让填充后的 Actions checkout 保留自己的远程 Git 元数据，而不是同步维护者本地的远程仓库和对象存储；它还会排除绝不应传输的本地运行时/构建产物。`.github/workflows/crabbox-hydrate.yml` 负责 checkout、Node/pnpm 设置、`origin/main` 拉取，以及后续 `crabbox run --id <cbx_id>` 命令所加载的非密钥环境交接。

## 相关内容

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
