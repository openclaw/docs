---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试一个失败的 GitHub Actions 检查
    - 你正在协调发布验证的运行或重新运行
    - 你正在更改 ClawSweeper 调度或 GitHub 活动转发
summary: CI 作业图、范围门禁、发布总括流程和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-05-02T06:28:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03258176c6672355abf335bfcb2a962c0ddc62605aaeaba1f60f513d03bce2d4
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 会在每次推送到 `main` 以及每个拉取请求时运行。`preflight` 作业会对差异进行分类，并在只有无关区域发生变更时关闭昂贵的执行线。手动 `workflow_dispatch` 运行会有意绕过智能作用域限定，并为候选发布和广泛验证展开完整图。Android 执行线通过 `include_android` 保持选择加入。仅发布使用的插件覆盖率位于单独的 [`Plugin Prerelease`](#plugin-prerelease) 工作流中，并且只会从 [`Full Release Validation`](#full-release-validation) 或显式手动调度运行。

## 流水线概览

| 作业                              | 目的                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、已变更作用域、已变更插件，并构建 CI 清单      | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm 公告对生产锁文件进行无依赖审计                             | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全作业所需的聚合检查                                                | 始终在非草稿推送和 PR 上运行 |
| `check-dependencies`             | 生产 Knip 依赖专用检查，以及未使用文件允许列表防护                    | Node 相关变更              |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查和可复用的下游产物          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性执行线，例如内置/插件契约/协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果                         | Node 相关变更              |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和插件执行线             | Node 相关变更              |
| `check`                          | 分片的主要本地门禁等价项：生产类型、lint、防护、测试类型和严格冒烟   | Node 相关变更              |
| `check-additional`               | 架构、边界、插件表面防护、包边界和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI 冒烟测试和启动内存冒烟                                               | Node 相关变更              |
| `checks`                         | 构建产物渠道测试的验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和冒烟执行线                                                   | 用于发布的手动 CI 调度    |
| `check-docs`                     | 文档格式、lint 和坏链接检查                                                | 文档已变更                       |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                                       | Python Skill 相关变更      |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时导入说明符回归测试         | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试执行线                                  | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 可信活动后的每日 Codex 慢测试优化                                    | 主 CI 成功或手动调度 |

## 快速失败顺序

1. `preflight` 决定哪些执行线实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 执行线重叠运行，因此下游消费者可以在共享构建就绪后立即启动。
4. 更重的平台和运行时执行线随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

当同一个 PR 或 `main` ref 上有较新的推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已被取代后继续排队。自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸任务无法无限期阻塞较新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，且不会取消正在进行的运行。

## 作用域和路由

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动调度会跳过变更作用域检测，并让 preflight 清单表现得像每个有作用域的区域都已变更。

- **CI 工作流编辑**会验证 Node CI 图和工作流 lint，但本身不会强制 Windows、Android 或 macOS 原生构建；这些平台执行线仍限定在平台源代码变更范围内。
- **仅 CI 路由编辑、选定的廉价核心测试 fixture 编辑，以及窄范围插件契约辅助/测试路由编辑**使用快速 Node 专用清单路径：`preflight`、安全检查和单个 `checks-fast-core` 任务。当变更仅限于该快速任务直接覆盖的路由或辅助表面时，该路径会跳过构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外防护矩阵。
- **Windows Node 检查**限定在 Windows 特定的进程/路径包装器、npm/pnpm/UI runner 辅助、包管理器配置，以及执行该执行线的 CI 工作流表面；无关源代码、插件、安装冒烟和仅测试变更会继续留在 Linux Node 执行线上。

最慢的 Node 测试族会被拆分或均衡，以便每个作业保持较小规模且不会过度预留 runner：渠道契约作为三个加权分片运行，小型核心单元执行线会成对运行，自动回复作为四个均衡 worker 运行（其中 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片），而 agentic Gateway 网关/插件配置会分散到现有的仅源代码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。包含模式分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和过滤后的分片。`check-additional` 将包边界编译/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界防护分片会在一个作业内并发运行其小型独立防护。Gateway watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内并发运行。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源集或清单；其单元测试执行线仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包作业。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`（生产 Knip 依赖专用检查，固定到最新 Knip 版本，并在 `dlx` 安装时禁用 pnpm 的最小发布年龄）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 新增未审查的未使用文件或留下过期允许列表条目时，未使用文件防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成文件、构建、实时测试和包桥接表面。

## ClawSweeper 活动转发

`.github/workflows/clawsweeper-dispatch.yml` 是从 OpenClaw 仓库活动到 ClawSweeper 的目标侧桥接。它不会检出或执行不可信的拉取请求代码。该工作流会从 `CLAWSWEEPER_APP_PRIVATE_KEY` 创建 GitHub App 令牌，然后向 `openclaw/clawsweeper` 调度紧凑的 `repository_dispatch` 载荷。

该工作流有四条执行线：

- `clawsweeper_item` 用于精确的问题和拉取请求审查请求；
- `clawsweeper_comment` 用于问题评论中的显式 ClawSweeper 命令；
- `clawsweeper_commit_review` 用于 `main` 推送上的提交级审查请求；
- `github_activity` 用于 ClawSweeper 智能体可能检查的一般 GitHub 活动。

`github_activity` 执行线仅转发规范化元数据：事件类型、动作、参与者、仓库、条目编号、URL、标题、状态，以及存在评论或审查时的短摘录。它有意避免转发完整 webhook 正文。`openclaw/clawsweeper` 中的接收工作流是 `.github/workflows/github-activity.yml`，它会将规范化事件发布到 ClawSweeper 智能体的 OpenClaw Gateway 网关钩子。

一般活动是观察，而不是默认投递。ClawSweeper 智能体会在提示中收到 Discord 目标，并且只有当事件令人意外、可操作、有风险或对运维有用时，才应发布到 `#clawsweeper`。常规打开、编辑、bot churn、重复 webhook 噪声和正常审查流量应产生 `NO_REPLY`。

在整个路径中，将 GitHub 标题、评论、正文、审查文本、分支名称和提交消息视为不可信数据。它们是用于摘要和分诊的输入，而不是工作流或智能体运行时的指令。

## 手动调度

手动 CI 调度运行与普通 CI 相同的作业图，但会强制开启所有非 Android 作用域执行线：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立的手动 CI 调度仅在 `include_android=true` 时运行 Android；完整发布总入口通过传递 `include_android=true` 启用 Android。插件预发布静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件批量扫描和插件预发布 Docker 执行线都被排除在 CI 之外。Docker 预发布套件只会在 `Full Release Validation` 使用启用 release-validation 门禁的方式调度单独的 `Plugin Prerelease` 工作流时运行。

手动运行使用唯一的并发组，因此候选发布全套件不会被同一 ref 上的另一个推送或 PR 运行取消。可选的 `target_ref` 输入允许可信调用者使用所选调度 ref 中的工作流文件，针对分支、标签或完整提交 SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 以外的 `check` 分片、`check-additional` 分片和聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 预检也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较轻量的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（对 CPU 足够敏感，8 vCPU 的成本高于节省的时间）；install-smoke Docker 构建（32-vCPU 的排队时间成本高于节省的时间）                                                                                                                                                                                                                                                                                                                     |
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

`Full Release Validation` 是用于“在发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标分发手动 `CI` 工作流，为仅发布使用的插件/包/静态/Docker 验证分发 `Plugin Prerelease`，并为安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 车道分发 `OpenClaw Release Checks`。使用 `rerun_group=all` 和 `release_profile=full` 时，它还会针对来自 release checks 的 `release-package-under-test` 构件运行 `NPM Telegram Beta E2E`。发布后，传入 `npm_telegram_package_spec` 可针对已发布的 npm 包重新运行同一个 Telegram 包车道。

有关阶段矩阵、精确的工作流作业名称、配置档差异、构件以及聚焦重跑句柄，请参阅[完整发布验证](/zh-CN/reference/full-release-validation)。

`OpenClaw Release Publish` 是会修改状态的手动发布工作流。在发布标签存在且 OpenClaw npm 预检成功后，从 `release/YYYY.M.D` 或 `main` 分发它。它会验证 `pnpm plugins:sync:check`，为所有可发布插件包分发 `Plugin NPM Release`，为同一个发布 SHA 分发 `Plugin ClawHub Release`，然后才使用保存的 `preflight_run_id` 分发 `OpenClaw NPM Release`。

若要在快速移动的分支上证明固定提交，请使用辅助命令，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流分发 ref 必须是分支或标签，不能是原始提交 SHA。该辅助命令会在目标 SHA 处推送一个临时 `release-ci/<sha>-...` 分支，从该固定 ref 分发 `Full Release Validation`，验证每个子工作流的 `headSha` 都与目标匹配，并在运行完成后删除临时分支。如果任何子工作流在不同 SHA 上运行，总控验证器也会失败。

`release_profile` 控制传入 release checks 的 live/provider 覆盖范围。手动发布工作流默认使用 `stable`；仅在你明确需要广泛的 advisory provider/media 矩阵时才使用 `full`。

- `minimum` 保留最快的 OpenAI/core 发布关键车道。
- `stable` 添加稳定的 provider/backend 集合。
- `full` 运行广泛的 advisory provider/media 矩阵。

总控会记录已分发的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流被重跑并变绿，只需重跑父级验证器作业即可刷新总控结果和计时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`，仅普通完整 CI 子项使用 `ci`，仅插件预发布子项使用 `plugin-prerelease`，每个发布子项使用 `release-checks`，或在总控上使用更窄的分组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样，在聚焦修复后，失败的发布环境重跑会保持有界。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将所选 ref 一次性解析为 `release-package-under-test` tarball，然后将该构件传递给 live/E2E 发布路径 Docker 工作流和包验收分片。这会让发布环境之间的包字节保持一致，并避免在多个子作业中重新打包同一个候选版本。

`ref=main` 和 `rerun_group=all` 的重复 `Full Release Validation` 运行会取代较旧的总控运行。父级监视器会在父级被取消时取消它已经分发的任何子工作流，因此较新的 main 验证不会被滞后的两小时 release-check 运行阻塞。发布分支/标签验证和聚焦重跑分组会保持 `cancel-in-progress: false`。

## Live 和 E2E 分片

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以具名分片运行，而不是作为一个串行作业运行：

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
- 拆分后的媒体音频/视频分片，以及按 provider 过滤的音乐分片

这会保持相同的文件覆盖，同时让较慢的 live provider 失败更容易重跑和诊断。聚合 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重跑。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预安装了 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证这些二进制文件。将 Docker 支持的 live 套件保持在普通 Blacksmith 运行器上，容器作业不是启动嵌套 Docker 测试的合适位置。

Docker 支持的实时模型/后端分片会为每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布 workflow 只构建并推送该镜像一次，随后 Docker 实时模型、按提供商分片的 Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片都会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway 网关 Docker 分片在 workflow 作业超时之前带有明确的脚本级 `timeout` 上限，这样卡住的容器或清理路径会快速失败，而不是耗尽整个发布检查预算。如果这些分片各自独立重建完整源码 Docker 目标，则表示发布运行配置错误，并且会在重复镜像构建上浪费实际时间。

## 包验收

当问题是“这个可安装的 OpenClaw 包是否能作为产品正常工作？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证源码树，而包验收会通过用户在安装或更新后实际使用的同一个 Docker E2E harness 验证单个 tarball。

### 作业

1. `resolve_package` 会检出 `workflow_ref`，解析一个候选包，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` artifact 上传，并在 GitHub 步骤摘要中打印来源、workflow ref、package ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用 workflow 会下载该 artifact，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包运行选定的 Docker lane，而不是打包 workflow checkout。当某个 profile 选择多个目标 `docker_lanes` 时，可复用 workflow 会准备一次包和共享镜像，然后将这些 lane 扇出为并行的目标 Docker 作业，并使用唯一 artifact。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时它会运行，并在包验收解析出包时安装同一个 `package-under-test` artifact；独立 Telegram dispatch 仍然可以安装已发布的 npm spec。
4. `summary` 会在包解析、Docker 验收或可选 Telegram lane 失败时使 workflow 失败。

### 候选来源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将它用于已发布 beta/stable 的验收。
- `source=ref` 会打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在 detached worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 会下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact` 会从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但应为外部共享的 artifact 提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任 workflow/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样当前测试 harness 可以验证较旧的受信任源提交，而不运行旧的 workflow 逻辑。

### 套件 profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 带 OpenWebUI 的完整 Docker 发布路径分块
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

`package` profile 使用离线插件覆盖，因此已发布包验证不会被实时 ClawHub 可用性阻塞。可选 Telegram lane 会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` artifact，同时为独立 dispatch 保留已发布 npm spec 路径。

有关专用更新和插件测试策略，包括本地命令、Docker lane、包验收输入、发布默认值和失败分诊，请参阅[更新和插件测试](/zh-CN/help/testing-updates-plugins)。

发布检查会使用 `source=artifact`、准备好的发布包 artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=release-history`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai` 调用包验收。这样可以让包迁移、更新、陈旧插件依赖清理、离线插件、插件更新和 Telegram 证明使用同一个已解析的包 tarball。跨 OS 发布检查仍然覆盖特定于 OS 的新手引导、安装器和平台行为；包/更新产品验证应从包验收开始。`published-upgrade-survivor` Docker lane 每次运行验证一个已发布包基线。在包验收中，解析出的 `package-under-test` tarball 始终是候选包，`published_upgrade_survivor_baseline` 选择回退的已发布基线，默认是 `openclaw@latest`；失败 lane 的重新运行命令会保留该基线。设置 `published_upgrade_survivor_baselines=release-history` 可将该 lane 扩展为去重历史矩阵：最新六个 stable 版本、`2026.4.23`，以及 `2026-03-15` 之前的最新 stable 版本。设置 `published_upgrade_survivor_scenarios=reported-issues` 可将同一批基线扩展到按 issue 形态构建的夹具，覆盖 Feishu 配置、保留的 bootstrap/persona 文件、波浪号日志路径，以及陈旧旧版插件依赖根。单独的 `Update Migration` workflow 在问题是穷尽式已发布更新清理，而不是普通完整发布 CI 广度时，会使用 `update-migration` Docker lane，并带上 `all-since-2026.4.23` 和 `plugin-deps-cleanup`。本地聚合运行可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传入精确包 spec，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持单个 lane，例如 `openclaw@2026.4.15`，或者设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以启用场景矩阵。已发布 lane 会使用内置的 `openclaw config set` 命令配方配置基线，在 `summary.json` 中记录配方步骤，并在 Gateway 网关启动后探测 `/healthz`、`/readyz` 以及 RPC Status。Windows 打包和安装器全新安装 lane 还会验证已安装的包可以从原始绝对 Windows 路径导入 browser-control 覆盖项。OpenAI 跨 OS Agent-turn smoke 在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.5`，因此安装和 Gateway 网关证明会保持在首选 GPT-5 测试模型上。

### 旧版兼容窗口

包验收对已发布包有有界的旧版兼容窗口。到 `2026.4.25` 为止的包（包括 `2026.4.25-beta.*`）可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可以指向 tarball 省略的文件；
- 当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过该持久化子用例；
- `update-channel-switch` 可以从 tarball 派生的假 git 夹具中裁剪缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；
- 插件 smoke 可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。

已发布的 `2026.4.26` 包也可能对已经发布的本地构建元数据戳文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

### 示例

```bash
# 使用产品级覆盖验证当前 beta 包。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# 使用当前 harness 打包并验证发布分支。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# 验证 tarball URL。source=url 必须提供 SHA-256。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 复用另一个 Actions 运行上传的 tarball。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

调试失败的包验收运行时，先查看 `resolve_package` 摘要，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker artifact：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段耗时和重新运行命令。优先重新运行失败的包 profile 或精确 Docker lane，而不是重新运行完整发布验证。

## 安装 smoke

单独的 `Install Smoke` workflow 会通过自己的 `preflight` 作业复用同一个 scope 脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径**会在 pull request 触及 Docker/包表面、内置插件包/manifest 变更，或 Docker smoke 作业会执行的核心插件/渠道/Gateway 网关/插件 SDK 表面时运行。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会预留 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 gateway-network e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile（每个场景的 Docker 运行单独设置上限）。
- **完整路径**会为夜间计划运行、手动 dispatch、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的 pull request 保留 QR 包安装和安装器 Docker/更新覆盖。在完整模式下，install-smoke 会准备或复用一个目标 SHA GHCR 根 Dockerfile smoke 镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关 smoke、安装器/更新 smoke，以及快速内置插件 Docker E2E 作为单独作业运行，使安装器工作不会被根镜像 smoke 阻塞。

`main` push（包括 merge commit）不会强制完整路径；当变更范围逻辑会在 push 上请求完整覆盖时，workflow 会保留快速 Docker smoke，并将完整安装 smoke 留给夜间或发布验证。

较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独控制。它会在夜间计划和发布检查 workflow 中运行，手动 `Install Smoke` dispatch 可以选择启用它，但 pull request 和 `main` push 不会运行。QR 和安装器 Docker 测试会保留各自面向安装的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 用于安装器/更新/插件依赖 lane 的裸 Node/Git runner；
- 一个将同一 tarball 安装到 `/app` 的功能镜像，用于普通功能 lane。

Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行选定的计划。调度器会按通道通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道。

### 可调参数

| 变量                                   | 默认值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 普通通道的主池槽位数量。                                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 对提供商敏感的尾部池槽位数量。                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发实时通道上限，避免提供商限流。                                                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 并发 npm 安装通道上限。                                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务通道上限。                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 通道启动之间的错峰时间，用于避免 Docker 守护进程创建风暴；设为 `0` 表示不做错峰。            |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每个通道的兜底超时（120 分钟）；选定的实时/尾部通道使用更严格的上限。                        |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 会打印调度器计划而不运行通道。                                                            |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 逗号分隔的精确通道列表；会跳过清理冒烟测试，以便智能体复现某个失败通道。                    |

重于其有效上限的通道仍可从空池启动，然后独占运行，直到释放容量。此本地聚合流程会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活动通道状态，持久化通道耗时以便按最长优先排序，并且默认在首次失败后停止调度新的池化通道。

### 可复用的实时/E2E 工作流

可复用的实时/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪个包、镜像类型、实时镜像、通道和凭证覆盖范围。随后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，或下载当前运行的包构件，或从 `package_artifact_run_id` 下载包构件；校验 tarball 清单；当计划需要已安装包的通道时，通过 Blacksmith 的 Docker 层缓存构建并推送以包摘要标记的 bare/functional GHCR Docker E2E 镜像；并在提供了 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或已有包摘要镜像时复用它们，而不是重新构建。Docker 镜像拉取会在每次尝试设置有界的 180 秒超时后重试，因此卡住的 registry/cache 流会快速重试，而不是消耗 CI 关键路径的大部分时间。

### 发布路径分片

发布 Docker 覆盖会用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行较小的分片作业，因此每个分片只拉取所需的镜像类型，并通过同一个加权调度器执行多个通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

当前发布 Docker 分片包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及从 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合插件/运行时别名。`install-e2e` 通道别名仍是两个提供商安装器通道的聚合手动重跑别名。

当完整发布路径覆盖请求它时，OpenWebUI 会并入 `plugins-runtime-services`，并且仅在只调度 OpenWebUI 时保留独立的 `openwebui` 分片。内置渠道更新通道会针对临时 npm 网络故障重试一次。

每个分片都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及每个通道的重跑命令。工作流的 `docker_lanes` 输入会针对准备好的镜像运行选定通道，而不是运行分片作业，这会将失败通道调试限制在一个定向 Docker 作业内，并为该运行准备、下载或复用包构件；如果选定通道是实时 Docker 通道，定向作业会为该重跑在本地构建实时测试镜像。生成的每通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败通道可以复用失败运行中的精确包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

计划的实时/E2E 工作流每天运行完整的发布路径 Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个由 `Full Release Validation` 或明确的操作员单独调度的工作流。普通拉取请求、`main` 推送和独立的手动 CI 调度都会关闭该套件。它会在八个扩展 worker 之间平衡内置插件测试；这些扩展分片作业一次最多运行两个插件配置组，每个组使用一个 Vitest worker 和更大的 Node 堆，因此导入负载较高的插件批次不会创建额外的 CI 作业。仅发布的 Docker 预发布路径会以小组批处理定向 Docker 通道，避免为一到三分钟的作业预留数十个 runner。

## QA 实验室

QA 实验室在主智能作用域工作流之外有专用 CI 通道。

- `Parity gate` 工作流会在匹配的 PR 变更和手动调度时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6 的智能体包。
- `QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动调度；它会将模拟一致性门禁、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道扇出为并行作业。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。

发布检查会使用确定性的模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，因此渠道契约会与实时模型延迟和常规提供商插件启动隔离。实时传输 Gateway 网关会禁用记忆搜索，因为 QA 一致性会单独覆盖记忆行为；提供商连接性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 会在计划和发布门禁中使用 `--profile fast`，并且仅当检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 调度始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 还会在发布审批前运行发布关键的 QA 实验室通道；其 QA 一致性门禁会将候选包和基线包作为并行通道作业运行，然后把两个构件下载到一个小型报告作业中，用于最终一致性比较。

不要把 PR 合入路径置于 `Parity gate` 之后，除非变更确实触及 QA 运行时、模型包一致性，或一致性工作流拥有的表面。对于常规渠道、配置、文档或单元测试修复，请将其视为可选信号，并遵循有作用域的 CI/检查证据。

## CodeQL

`CodeQL` 工作流有意作为窄范围的第一轮安全扫描器，而不是完整仓库扫描。每日、手动和非草稿拉取请求保护运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 表面，并使用过滤到高/严重 `security-severity` 的高置信度安全查询。

拉取请求保护保持轻量：它只会针对 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的变更启动，并运行与计划工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不包含在 PR 默认项中。

### 安全类别

| 类别                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 认证、密钥、沙箱、cron 和 gateway 基线                                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥、审计触点                                                         |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络保护、web-fetch，以及插件 SDK SSRF 策略表面                                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助工具、出站投递，以及智能体工具执行门禁                                                                      |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、manifest、registry、包管理器安装、源码加载，以及插件 SDK 包契约信任表面                                          |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 计划的 Android 安全分片。在工作流完整性检查接受的最小 Blacksmith Linux runner 上为 CodeQL 手动构建 Android 应用。上传到 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF中过滤掉依赖构建结果，并上传到 `/codeql-critical-security/macos`。由于即使干净运行时 macOS 构建也占主导耗时，因此保持在每日默认项之外。

### 关键质量类别

`CodeQL Critical Quality` 是匹配的非安全分片。它只在较小的 Blacksmith Linux runner 上，对窄范围高价值表面运行错误严重级别、非安全 JavaScript/TypeScript 质量查询。它的拉取请求保护有意小于计划配置：非草稿 PR 只会针对智能体命令/模型/工具执行和回复分发代码、配置 schema/迁移/IO 代码、认证/密钥/沙箱/安全代码、核心渠道和内置渠道插件运行时、Gateway 网关协议/服务器方法、记忆运行时/SDK 胶水、MCP/进程/出站投递、提供商运行时/模型目录、会话诊断/投递队列、插件加载器、插件 SDK/包契约，或插件 SDK 回复运行时变更，运行匹配的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 配置和质量工作流变更会运行全部十二个 PR 质量分片。

手动调度接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

这些窄范围 profile 是教学/迭代钩子，用于隔离运行一个质量分片。

| 类别                                                    | 范围                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 凭证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                                |
| `/codeql-critical-quality/config-boundary`              | 配置架构、迁移、规范化和 IO 契约                                                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议架构和服务器方法契约                                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分发、自动回复分发与队列，以及 ACP 控制平面运行时契约                                                                                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥接、进程监管辅助函数，以及出站交付契约                                                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆主机 SDK、记忆运行时门面、记忆插件 SDK 别名、记忆运行时激活胶水代码，以及记忆 Doctor 命令                                                                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话交付队列、出站会话绑定/交付辅助函数、诊断事件/日志包表面，以及会话 Doctor CLI 契约                                                         |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复载荷/分块/运行时辅助函数、渠道回复选项、交付队列，以及会话/thread 绑定辅助函数                                                        |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商凭证和设备发现、提供商运行时注册、提供商默认值/目录，以及 web/search/fetch/embedding 注册表                                                |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 启动、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、媒体 IO、媒体理解、图像生成和媒体生成运行时契约                                                                                            |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公开表面和插件 SDK 入口点契约                                                                                                                     |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧插件 SDK 源代码和插件包契约辅助函数                                                                                                                     |

质量与安全保持分离，这样质量发现就可以被排期、度量、禁用或扩展，而不会遮蔽安全信号。只有在窄范围 profile 拥有稳定的运行时和信号之后，才应将 Swift、Python 和内置插件 CodeQL 扩展作为有范围或分片的后续工作加回。

## 维护工作流

### Docs Agent

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，手动派发也可以直接运行它。当 `main` 已经前进，或最近一小时内已创建另一次未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一次未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档处理以来积累的所有 main 变更。

### Test Performance Agent

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，但如果同一个 UTC 日已有另一次 workflow-run 调用已运行或正在运行，它会跳过。手动派发会绕过这个每日活动门控。该通道会构建一次全套件分组 Vitest 性能报告，让 Codex 只做小型、保覆盖率的测试性能修复，而不是大范围重构；然后重新运行全套件报告，并拒绝会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显的失败，并且 agent 后的全套件报告必须通过，才会提交任何内容。当 bot push 落地前 `main` 前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；存在冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是一个面向维护者的手动工作流，用于落地后的重复项清理。它默认 dry-run，并且只有在 `apply=true` 时才会关闭显式列出的 PR。在变更 GitHub 之前，它会验证已落地的 PR 已合并，并且每个重复项要么共享引用的 issue，要么存在重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门禁和变更路由

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁在架构边界方面比宽泛的 CI 平台范围更严格：

- 核心生产代码变更会运行核心生产和核心测试 typecheck，加上核心 lint/guard；
- 仅核心测试的变更只运行核心测试 typecheck，加上核心 lint；
- 插件生产代码变更会运行插件生产和插件测试 typecheck，加上插件 lint；
- 仅插件测试的变更会运行插件测试 typecheck，加上插件 lint；
- 公开插件 SDK 或插件契约变更会扩展到插件 typecheck，因为插件依赖这些核心契约（Vitest 插件扫测仍是显式测试工作）；
- 仅发布元数据的版本提升会运行定向版本/配置/root-dependency 检查；
- 未知的 root/config 变更会安全失败到所有检查通道。

本地 changed-test 路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更便宜：直接测试编辑会运行自身，源码编辑优先使用显式映射，然后是兄弟测试和导入图依赖项。共享 group-room 交付配置是显式映射之一：对群组可见回复配置、源回复交付模式或 message-tool 系统 prompt 的变更，会路由到核心回复测试以及 Discord 和 Slack 交付回归测试，因此共享默认值变更会在第一次 PR push 前失败。仅当变更足够 harness-wide，以至于便宜的映射集合不是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

从仓库根目录运行 Testbox，并优先使用一个新预热的 box 来做宽范围证明。在把慢门禁时间花在一个被复用、已过期或刚报告异常大同步量的 box 上之前，先在 box 内运行 `pnpm testbox:sanity`。

当所需 root 文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个 tracked deletion 时，完整性检查会快速失败。这通常意味着远端同步状态不是 PR 的可信副本；应停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意的大量删除 PR，请为那次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

如果本地 Blacksmith CLI 调用停留在同步阶段超过五分钟且没有同步后输出，`pnpm testbox:run` 也会终止它。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该 guard，或为异常大的本地 diff 使用更大的毫秒值。

当 Blacksmith 不可用，或更适合使用自有云容量时，Crabbox 是仓库自有的第二条远端 box Linux 证明路径。预热一个 box，通过项目工作流 hydrate 它，然后通过 Crabbox CLI 运行命令：

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` 负责提供商、同步和 GitHub Actions hydrate 默认值。它会排除本地 `.git`，因此 hydrated Actions checkout 会保留自己的远端 Git 元数据，而不是同步维护者本地的 remote 和 object store；它还会排除绝不应传输的本地运行时/构建产物。`.github/workflows/crabbox-hydrate.yml` 负责 checkout、Node/pnpm 设置、`origin/main` fetch，以及后续 `crabbox run --id <cbx_id>` 命令会 source 的非 secret 环境移交。

## 相关

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
