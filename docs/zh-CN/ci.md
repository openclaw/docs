---
read_when:
    - 你需要了解某个 CI 作业为何运行或未运行
    - 你正在调试一个失败的 GitHub Actions 检查
    - 你正在协调一次发布验证的运行或重新运行
    - 你正在更改 ClawSweeper 调度或 GitHub 活动转发
summary: CI 作业图、范围门禁、发布总括流程和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-05-02T04:47:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2da3014e67b8d2d4bb4c1c9d4c6134eed29309bb176544864df568809ae3ac7
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 会在每次推送到 `main` 以及每个拉取请求时运行。`preflight` 作业会对 diff 进行分类，并在仅有无关区域发生变更时关闭高成本的执行分支。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为发布候选版本和广泛验证展开完整图。Android 分支通过 `include_android` 保持可选。仅发布使用的插件覆盖位于单独的 [`Plugin Prerelease`](#plugin-prerelease) 工作流中，并且只会从 [`Full Release Validation`](#full-release-validation) 或显式手动调度运行。

## 流水线概览

| 作业                              | 用途                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更插件，并构建 CI 清单      | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm advisories 进行不依赖外部依赖的生产 lockfile 审计                             | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合                                                | 始终在非草稿推送和 PR 上运行 |
| `check-dependencies`             | 生产 Knip 仅依赖检查，以及未使用文件 allowlist 防护                    | Node 相关变更              |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性分支，例如内置插件、插件合约和协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片的渠道合约检查，并提供稳定的聚合检查结果                         | Node 相关变更              |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置插件、合约和插件分支             | Node 相关变更              |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、防护、测试类型和严格 smoke   | Node 相关变更              |
| `check-additional`               | 架构、边界、插件表面防护、包边界和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 构建后的 CLI smoke 测试和启动内存 smoke                                               | Node 相关变更              |
| `checks`                         | 构建产物渠道测试的验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 分支                                                   | 发布用手动 CI 调度    |
| `check-docs`                     | 文档格式化、lint 和断链检查                                                | 文档变更                       |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                       | Python Skill 相关变更      |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时导入说明符回归检查         | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试分支                                  | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 可信活动之后的每日 Codex 慢测试优化                                    | Main CI 成功或手动调度 |

## 快速失败顺序

1. `preflight` 决定哪些分支会实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 分支重叠运行，因此下游使用方可在共享构建准备就绪后立即开始。
4. 更重的平台和运行时分支随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

当同一 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被取代后继续排队。自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 端旧队列组中的僵尸项无法无限期阻塞较新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消进行中的运行。

## 范围与路由

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动调度会跳过变更范围检测，并让 preflight 清单表现得像每个限定区域都发生了变更。

- **CI 工作流编辑**会验证 Node CI 图和工作流 lint，但本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台分支仍限定在平台源代码变更范围内。
- **仅 CI 路由编辑、选定的低成本核心测试 fixture 编辑，以及窄范围插件合约 helper/test-routing 编辑**使用快速 Node-only 清单路径：`preflight`、安全检查，以及单个 `checks-fast-core` 任务。当变更仅限于该快速任务直接覆盖的路由或 helper 表面时，此路径会跳过构建产物、Node 22 兼容性、渠道合约、完整核心分片、内置插件分片和额外防护矩阵。
- **Windows Node 检查**限定在 Windows 特定的进程/路径包装器、npm/pnpm/UI runner helper、包管理器配置，以及执行该分支的 CI 工作流表面；无关源代码、插件、安装 smoke 和仅测试变更仍保留在 Linux Node 分支上。

最慢的 Node 测试族会被拆分或平衡，使每个作业保持较小规模而不超额预留 runner：渠道合约作为三个加权分片运行，小型核心单元分支会配对，auto-reply 作为四个平衡 worker 运行（reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片），agentic gateway/plugin 配置分散到现有的仅源代码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和其他杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件 catch-all。include-pattern 分片会使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional` 将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界防护分片会在一个作业内并发运行其小型独立防护。Gateway watch、渠道测试和核心支持边界分片会在 `dist/` 与 `dist-runtime/` 已经构建完成后，于 `build-artifacts` 内并发运行。

Android CI 会运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，随后构建 Play debug APK。third-party flavor 没有单独的源集或 manifest；它的单元测试分支仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每个 Android 相关推送上重复执行 debug APK 打包作业。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`（生产 Knip 仅依赖检查，固定到最新 Knip 版本，并为 `dlx` 安装禁用 pnpm 的最低发布年龄限制）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 添加新的未经审核未使用文件，或留下过期 allowlist 条目时，未使用文件防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成文件、构建、实时测试和包桥接表面。

## ClawSweeper 活动转发

`.github/workflows/clawsweeper-dispatch.yml` 是从 OpenClaw 仓库活动到 ClawSweeper 的目标端桥接。它不会检出或执行不受信任的拉取请求代码。该工作流会从 `CLAWSWEEPER_APP_PRIVATE_KEY` 创建 GitHub App token，然后向 `openclaw/clawsweeper` 调度紧凑的 `repository_dispatch` payload。

该工作流有四个分支：

- `clawsweeper_item` 用于精确的问题和拉取请求评审请求；
- `clawsweeper_comment` 用于 issue comment 中的显式 ClawSweeper 命令；
- `clawsweeper_commit_review` 用于 `main` 推送上的 commit 级评审请求；
- `github_activity` 用于 ClawSweeper 智能体可能检查的一般 GitHub 活动。

`github_activity` 分支仅转发标准化元数据：event type、action、actor、repository、item number、URL、title、state，以及存在评论或评审时的短摘录。它有意避免转发完整 webhook body。`openclaw/clawsweeper` 中的接收工作流是 `.github/workflows/github-activity.yml`，它会将标准化事件发布到 ClawSweeper 智能体的 OpenClaw Gateway 网关 hook。

一般活动是观察，而不是默认投递。ClawSweeper 智能体会在提示中收到 Discord 目标，并且只应在事件令人意外、可执行、有风险或对运维有用时发布到 `#clawsweeper`。常规打开、编辑、bot 变动、重复 webhook 噪声和正常评审流量应产生 `NO_REPLY`。

在整条路径中，将 GitHub 标题、评论、正文、评审文本、分支名称和 commit message 都视为不受信任的数据。它们是用于摘要和分诊的输入，不是工作流或智能体运行时的指令。

## 手动调度

手动 CI 调度运行与普通 CI 相同的作业图，但会强制开启每个非 Android 范围分支：Linux Node 分片、内置插件分片、渠道合约、Node 22 兼容性、`check`、`check-additional`、build smoke、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立的手动 CI 调度仅在 `include_android=true` 时运行 Android；完整发布总工作流会通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件批量扫描以及插件预发布 Docker 分支都不包含在 CI 中。Docker 预发布套件只会在 `Full Release Validation` 调度单独的 `Plugin Prerelease` 工作流并启用 release-validation 门禁时运行。

手动运行使用唯一并发组，因此发布候选版本的全套件不会被同一 ref 上的另一次推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方使用所选调度 ref 中的工作流文件，针对分支、标签或完整 commit SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 预检也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（对 CPU 足够敏感，8 vCPU 的成本高于节省的成本）；install-smoke Docker 构建（32-vCPU 队列时间成本高于节省的成本）                                                                                                                                                                                                                                                                                                                     |
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
```

## 完整发布验证

`Full Release Validation` 是用于“在发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标分发手动 `CI` 工作流，分发 `Plugin Prerelease` 以提供仅发布所需的插件/包/静态/Docker 证明，并分发 `OpenClaw Release Checks` 以覆盖安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab 奇偶校验、Matrix 和 Telegram 通道。使用 `rerun_group=all` 和 `release_profile=full` 时，它还会针对来自发布检查的 `release-package-under-test` 制品运行 `NPM Telegram Beta E2E`。发布后，传入 `npm_telegram_package_spec` 可针对已发布的 npm 包重新运行同一个 Telegram 包通道。

请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解阶段矩阵、确切的工作流作业名称、配置差异、制品和定向重跑句柄。

对于快速变化分支上的固定提交证明，请使用辅助命令，而不是
`gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流分发 ref 必须是分支或标签，不能是原始提交 SHA。该辅助命令会在目标 SHA 上推送一个临时 `release-ci/<sha>-...` 分支，从该固定 ref 分发 `Full Release Validation`，验证每个子工作流的 `headSha` 都与目标匹配，并在运行完成后删除临时分支。如果任何子工作流在不同的 SHA 上运行，总控验证器也会失败。

`release_profile` 控制传入发布检查的 live/provider 覆盖范围。手动发布工作流默认使用 `stable`；只有在你有意需要广泛的建议 provider/媒体矩阵时才使用 `full`。

- `minimum` 保留最快的 OpenAI/core 发布关键通道。
- `stable` 添加稳定的提供商/后端集合。
- `full` 运行广泛的建议提供商/媒体矩阵。

总控会记录已分发的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流被重新运行并变为绿色，只需重新运行父验证器作业即可刷新总控结果和时间摘要。

恢复时，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对发布候选使用 `all`，仅对普通完整 CI 子项使用 `ci`，仅对插件预发布子项使用 `plugin-prerelease`，对每个发布子项使用 `release-checks`，或在总控中使用更窄的组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这会让失败的发布环境在定向修复后保持重跑范围受限。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将所选 ref 解析一次为 `release-package-under-test` tarball，然后将该制品同时传给 live/E2E 发布路径 Docker 工作流和包验收分片。这样可以让发布环境之间的包字节保持一致，并避免在多个子作业中重新打包同一个候选版本。

对于 `ref=main` 且 `rerun_group=all` 的重复 `Full Release Validation` 运行，较新的总控会取代较旧的总控。父监控器在父项被取消时会取消它已经分发的任何子工作流，因此较新的 main 验证不会排在过期的两小时发布检查运行之后。发布分支/标签验证和定向重跑组保持 `cancel-in-progress: false`。

## Live 和 E2E 分片

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行，而不是一个串行作业：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider 过滤的 `native-live-src-gateway-profiles` 作业
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分的媒体音频/视频分片和 provider 过滤的音乐分片

这样可以保持相同的文件覆盖，同时让缓慢的 live provider 失败更容易重跑和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称对于手动一次性重跑仍然有效。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预安装 `ffmpeg` 和 `ffprobe`；媒体作业只在设置前验证这些二进制文件。将 Docker 支持的 live 套件保留在普通 Blacksmith 运行器上，容器作业不是启动嵌套 Docker 测试的合适位置。

Docker 支持的 live 模型/后端分片会为每个所选提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live 发布工作流会构建并推送该镜像一次，然后 Docker live 模型、provider 分片的 Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway 网关 Docker 分片会携带显式的脚本级 `timeout` 上限，低于工作流作业超时，因此卡住的容器或清理路径会快速失败，而不是消耗整个发布检查预算。如果这些分片独立重建完整源 Docker 目标，则说明发布运行配置错误，并会在重复镜像构建上浪费实际耗时。

## 包验收

当问题是“这个可安装的 OpenClaw 包能否作为产品正常工作？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证源码树，而 package acceptance 会通过用户安装或更新后使用的同一套 Docker E2E harness 验证单个 tarball。

### 作业

1. `resolve_package` 会检出 `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` artifact 上传，并在 GitHub 步骤摘要中打印来源、workflow ref、package ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 会用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。这个可复用 workflow 会下载该 artifact，验证 tarball inventory，在需要时准备 package-digest Docker 镜像，并针对该包运行所选 Docker lanes，而不是打包 workflow checkout。当一个 profile 选择多个目标 `docker_lanes` 时，可复用 workflow 会先准备一次包和共享镜像，然后将这些 lanes 分发为并行的目标 Docker jobs，并使用唯一 artifacts。
3. `package_telegram` 可选地调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果 Package Acceptance 已解析出一个包，它会安装同一个 `package-under-test` artifact；独立 Telegram dispatch 仍可安装已发布的 npm spec。
4. `summary` 会在包解析、Docker acceptance 或可选 Telegram lane 失败时使 workflow 失败。

### 候选来源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将它用于已发布 beta/stable 的 acceptance。
- `source=ref` 会打包受信任的 `package_ref` 分支、tag 或完整 commit SHA。resolver 会获取 OpenClaw 分支/tag，验证所选 commit 可从仓库分支历史或 release tag 到达，在 detached worktree 中安装依赖，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 会下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact` 会从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享的 artifacts 应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任 workflow/harness 代码。`package_ref` 是在 `source=ref` 时会被打包的源 commit。这样当前测试 harness 就能验证较旧的受信任源 commit，而不运行旧 workflow 逻辑。

### 套件 profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` 加上 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — 包含 OpenWebUI 的完整 Docker release-path chunks
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

`package` profile 使用离线插件覆盖，因此已发布包验证不会被实时 ClawHub 可用性阻塞。可选 Telegram lane 会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` artifact，同时为独立 dispatch 保留已发布 npm spec 路径。

关于专门的更新和插件测试策略，包括本地命令、Docker lanes、Package Acceptance 输入、release 默认值和失败分诊，请参阅[更新和插件测试](/zh-CN/help/testing-updates-plugins)。

Release checks 会使用 `source=artifact`、已准备好的 release package artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=release-history`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。这样可以让包迁移、更新、陈旧插件依赖清理、离线插件、plugin-update 和 Telegram 证明都基于同一个已解析的包 tarball。Cross-OS release checks 仍覆盖特定于 OS 的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。`published-upgrade-survivor` Docker lane 每次运行会验证一个已发布包基线。在 Package Acceptance 中，解析出的 `package-under-test` tarball 始终是候选包，而 `published_upgrade_survivor_baseline` 选择回退的已发布基线，默认是 `openclaw@latest`；失败 lane 的重跑命令会保留该基线。设置 `published_upgrade_survivor_baselines=release-history` 可将该 lane 扩展到一个去重历史矩阵：最新六个 stable releases、`2026.4.23`，以及 `2026-03-15` 之前的最新 stable release。设置 `published_upgrade_survivor_scenarios=reported-issues` 可将同一组 baselines 扩展到面向 issue 的 fixtures，覆盖 Feishu 配置、保留的 bootstrap/persona 文件、tilde 日志路径，以及陈旧旧版插件依赖根。单独的 `Update Migration` workflow 会使用 `update-migration` Docker lane，并在问题是彻底的已发布更新清理而不是普通 Full Release CI 广度时使用 `all-since-2026.4.23` 和 `plugin-deps-cleanup`。本地聚合运行可以用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传入精确包 specs，也可以用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持单个 lane，例如 `openclaw@2026.4.15`，或设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 来生成场景矩阵。published lane 会用内置的 `openclaw config set` 命令 recipe 配置基线，在 `summary.json` 中记录 recipe 步骤，并在 Gateway 网关启动后探测 `/healthz`、`/readyz` 以及 RPC status。Windows packaged 和 installer fresh lanes 还会验证已安装的包可以从原始 Windows 绝对路径导入 browser-control override。OpenAI cross-OS agent-turn smoke 在设置 `OPENCLAW_CROSS_OS_OPENAI_MODEL` 时默认使用它，否则使用 `openai/gpt-5.5`，因此安装和 Gateway 网关证明会保持在首选 GPT-5 测试模型上。

### 旧版兼容窗口

Package Acceptance 对已发布包有有限的旧版兼容窗口。到 `2026.4.25` 为止的包，包括 `2026.4.25-beta.*`，可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA entries 可以指向 tarball 中省略的文件；
- 当包未暴露该 flag 时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；
- `update-channel-switch` 可以从 tarball 派生的 fake git fixture 中修剪缺失的 `pnpm.patchedDependencies`，也可以记录缺失的持久化 `update.channel`；
- plugin smokes 可以读取旧版 install-record 位置，或接受缺失的 marketplace install-record 持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求 install record 和 no-reinstall 行为保持不变。

已发布的 `2026.4.26` 包也可能对已经发布的本地构建元数据 stamp 文件发出警告。之后的包必须满足现代 contracts；相同条件会失败，而不是警告或跳过。

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

调试失败的 package acceptance 运行时，从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker artifacts：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane logs、phase timings 和重跑命令。优先重跑失败的 package profile 或精确 Docker lanes，而不是重跑完整 release validation。

## 安装冒烟测试

单独的 `Install Smoke` workflow 会通过自己的 `preflight` job 复用同一个 scope 脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径** 会在 pull requests 触及 Docker/package surfaces、内置插件 package/manifest 变更，或 Docker smoke jobs 会执行的 core plugin/channel/gateway/插件 SDK surfaces 时运行。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会预留 Docker workers。快速路径会构建一次 root Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行 container gateway-network e2e，验证内置扩展 build arg，并在 240 秒聚合命令超时内运行有界的 bundled-plugin Docker profile（每个场景的 Docker run 会单独封顶）。
- **完整路径** 会为夜间定时运行、手动 dispatches、workflow-call release checks，以及确实触及 installer/package/Docker surfaces 的 pull requests 保留 QR package install 和 installer Docker/update 覆盖。在 full mode 下，install-smoke 会准备或复用一个 target-SHA GHCR root Dockerfile smoke 镜像，然后将 QR package install、root Dockerfile/gateway smokes、installer/update smokes，以及快速 bundled-plugin Docker E2E 作为单独 jobs 运行，以便 installer 工作不会被 root image smokes 阻塞。

`main` pushes（包括 merge commits）不会强制执行完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，workflow 会保留快速 Docker smoke，并将完整 install smoke 留给夜间或 release validation。

较慢的 Bun global install image-provider smoke 由 `run_bun_global_install_smoke` 单独 gate。它会在夜间 schedule 和 release checks workflow 中运行，手动 `Install Smoke` dispatches 可以选择加入，但 pull requests 和 `main` pushes 不会运行。QR 和 installer Docker tests 保留各自专注于安装的 Dockerfiles。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 用于 installer/update/plugin-dependency lanes 的裸 Node/Git runner；
- 一个会将同一 tarball 安装到 `/app` 中的功能镜像，用于普通功能 lanes。

Docker lane definitions 位于 `scripts/lib/docker-e2e-scenarios.mjs`，planner 逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行所选 plan。scheduler 会用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 lanes。

### 可调参数

| 变量                                   | 默认值  | 用途                                                                                                   |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 普通执行线的主池槽位数。                                                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 对提供商敏感的尾部池槽位数。                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发 live 执行线上限，避免提供商限流。                                                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 并发 npm install 执行线上限。                                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务执行线上限。                                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 执行线启动之间的错峰间隔，用于避免 Docker 守护进程创建风暴；设为 `0` 表示不错峰。                     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每条执行线的回退超时（120 分钟）；选定的 live/尾部执行线会使用更严格的上限。                          |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 会打印调度器计划而不运行执行线。                                                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 以逗号分隔的精确执行线列表；会跳过清理 smoke，以便智能体复现某一条失败的执行线。                      |

比有效上限更重的执行线仍可从空池启动，然后会独占运行，直到释放容量。本地聚合会预检 Docker、移除陈旧的 OpenClaw E2E 容器、输出活跃执行线状态、持久化执行线耗时以支持最长优先排序，并且默认在第一次失败后停止调度新的池化执行线。

### 可复用的 live/E2E 工作流

可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些 package、镜像类型、live 镜像、执行线和凭证覆盖范围。随后 `scripts/docker-e2e.mjs` 会把该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的 package 构件，或从 `package_artifact_run_id` 下载 package 构件；验证 tarball 清单；当计划需要已安装 package 的执行线时，通过 Blacksmith 的 Docker layer cache 构建并推送带 package digest 标签的 bare/functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有 package digest 镜像，而不是重新构建。Docker 镜像拉取会使用每次尝试 180 秒的有界超时重试，因此卡住的 registry/cache 流会快速重试，而不会消耗 CI 关键路径的大部分时间。

### 发布路径分块

发布 Docker 覆盖会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行更小的分块任务，因此每个分块只拉取自己需要的镜像类型，并通过同一个加权调度器执行多条执行线：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

当前发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及从 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合插件/运行时别名。`install-e2e` 执行线别名仍是两个提供商安装器执行线的聚合手动重跑别名。

当完整发布路径覆盖请求 OpenWebUI 时，它会被并入 `plugins-runtime-services`；只有 OpenWebUI 专用调度才保留独立的 `openwebui` 分块。内置渠道更新执行线会针对临时 npm 网络失败重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含执行线日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢执行线表，以及逐执行线重跑命令。工作流的 `docker_lanes` 输入会针对准备好的镜像运行选定执行线，而不是运行分块任务，这能把失败执行线调试限制在一个有针对性的 Docker 任务内，并为该次运行准备、下载或复用 package 构件；如果选定执行线是 live Docker 执行线，定向任务会为该次重跑在本地构建 live-test 镜像。生成的逐执行线 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败执行线可以复用失败运行中的确切 package 和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

定时 live/E2E 工作流每天运行完整的发布路径 Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/package 覆盖，因此它是一个独立工作流，由 `Full Release Validation` 或明确的操作员调度。普通 pull request、`main` 推送和独立的手动 CI 调度都会关闭该套件。它会在八个扩展 worker 之间均衡内置插件测试；这些扩展分片任务每次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node heap，这样导入密集型插件批次就不会创建额外 CI 任务。仅发布的 Docker 预发布路径会把定向 Docker 执行线按小组批处理，避免为一到三分钟的任务预留数十个 runner。

## QA Lab

QA Lab 在主智能作用域工作流之外拥有专用 CI 执行线。

- `Parity gate` 工作流会在匹配的 PR 变更和手动调度时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 agentic packs。
- `QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也会在手动调度时运行；它会把 mock parity gate、live Matrix 执行线，以及 live Telegram 和 Discord 执行线并行展开为任务。Live 任务使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex leases。

发布检查会使用确定性的 mock 提供商和 mock 限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram live 传输执行线，因此渠道契约会与 live 模型延迟和普通提供商插件启动隔离。live 传输 Gateway 网关会禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；提供商连通性由独立的 live 模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 对定时和发布门禁使用 `--profile fast`，并且只有在检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 调度始终会把完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 任务。

`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 执行线；它的 QA parity gate 会把候选包和基线包作为并行执行线任务运行，然后把两个构件下载到一个小型报告任务中，用于最终 parity 比较。

不要把 PR 落地路径放在 `Parity gate` 后面，除非变更确实触及 QA 运行时、模型包 parity，或 parity 工作流拥有的表面。对于普通渠道、配置、文档或单元测试修复，应把它视为可选信号，并遵循作用域化的 CI/检查证据。

## CodeQL

`CodeQL` 工作流是有意保持狭窄的第一轮安全扫描器，而不是完整仓库扫描。每日、手动和非草稿 pull request 保护运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 表面，并使用过滤到高/严重 `security-severity` 的高置信度安全查询。

pull request 保护保持轻量：它只会针对 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的变更启动，并运行与定时工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不包含在 PR 默认项中。

### 安全类别

| 类别                                              | 表面                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth、secrets、沙箱、cron 和 gateway baseline                                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，加上渠道插件运行时、Gateway 网关、插件 SDK、secrets、audit 触点                                                   |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP parsing、network guard、web-fetch，以及插件 SDK SSRF policy 表面                                                     |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers、process execution helpers、outbound delivery，以及智能体工具执行门禁                                                   |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、loader、manifest、registry、package-manager install、source-loading，以及插件 SDK package contract trust 表面             |

### 特定平台安全分片

- `CodeQL Android Critical Security` — 定时 Android 安全分片。在 workflow sanity 接受的最小 Blacksmith Linux runner 上手动构建 Android app，用于 CodeQL。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上手动构建 macOS app，用于 CodeQL，从上传的 SARIF 中过滤 dependency build 结果，并上传到 `/codeql-critical-security/macos` 下。它保留在每日默认项之外，因为即使干净时，macOS build 也会主导运行时间。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它只会在较小的 Blacksmith Linux runner 上，对狭窄的高价值表面运行 error-severity、非安全 JavaScript/TypeScript 质量查询。它的 pull request 保护有意小于定时 profile：非草稿 PR 只会针对智能体命令/模型/工具执行和回复分发代码、配置 schema/迁移/IO 代码、auth/secrets/沙箱/security 代码、核心渠道和内置渠道插件运行时、Gateway 网关 protocol/server-method、记忆运行时/SDK glue、MCP/process/outbound delivery、提供商运行时/模型目录、会话 diagnostics/delivery queues、插件 loader、插件 SDK/package-contract，或插件 SDK reply runtime 变更，运行匹配的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 配置和质量工作流变更会运行全部十二个 PR 质量分片。

手动调度接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭窄 profile 是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 范围                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | 身份验证、机密、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | 配置 schema、迁移、规范化和 IO 契约                                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议 schema 和服务器方法契约                                                                                                                    |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分发、自动回复分发与队列，以及 ACP 控制平面运行时契约                                                                                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥接、进程监控 helper，以及出站投递契约                                                                                                     |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆宿主 SDK、记忆运行时 facade、记忆插件 SDK 别名、记忆运行时激活粘合逻辑，以及记忆 Doctor 命令                                                           |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递 helper、诊断事件/日志 bundle 接口，以及会话 Doctor CLI 契约                                              |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复 payload/分块/运行时 helper、渠道回复选项、投递队列，以及会话/thread 绑定 helper                                                |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商身份验证与设备发现、提供商运行时注册、提供商默认值/目录，以及 web/search/fetch/embedding 注册表                                      |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 启动、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、媒体 IO、媒体理解、图像生成和媒体生成运行时契约                                                                                      |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公开接口和插件 SDK 入口点契约                                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布 package 侧插件 SDK 源码和插件 package 契约 helper                                                                                                    |

质量与安全保持分离，这样质量发现可以被排期、度量、禁用或扩展，而不会遮蔽安全信号。Swift、Python 和内置插件 CodeQL 扩展应仅在窄配置文件具备稳定运行时和稳定信号后，作为有作用域或分片的后续工作加回。

## 维护工作流

### 文档智能体

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的更改保持一致。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，手动分发也可以直接运行它。当 `main` 已经向前移动，或过去一小时内已经创建过另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一次未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次运行可以覆盖自上次文档检查以来累积的所有 main 更改。

### 测试性能智能体

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动分发会绕过这个每日活动门禁。该通道会构建一个全套分组 Vitest 性能报告，让 Codex 只做保留覆盖率的小型测试性能修复，而不是大范围重构，然后重新运行全套报告，并拒绝会降低通过基线测试数量的更改。如果基线存在失败测试，Codex 只能修复明显失败，并且 after-agent 全套报告必须在提交任何内容前通过。当 `main` 在 bot push 落地前前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，然后重试 push；有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于落地后的重复项清理。它默认 dry-run，并且只有在 `apply=true` 时才会关闭显式列出的 PR。在变更 GitHub 之前，它会验证落地 PR 已合并，并验证每个重复项要么有共享的引用 issue，要么有重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门禁和变更路由

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁在架构边界上比宽泛的 CI 平台范围更严格：

- 核心生产更改会运行核心 prod 和核心 test 类型检查，加上核心 lint/guard；
- 仅核心测试的更改只运行核心 test 类型检查，加上核心 lint；
- 插件生产更改会运行插件 prod 和插件 test 类型检查，加上插件 lint；
- 仅插件测试的更改会运行插件 test 类型检查，加上插件 lint；
- 公开插件 SDK 或插件契约更改会扩展到插件类型检查，因为插件依赖这些核心契约（Vitest 插件 sweep 仍然是显式测试工作）；
- 仅发布元数据的版本 bump 会运行定向版本/配置/root-dependency 检查；
- 未知 root/配置更改会 fail safe 到所有检查通道。

本地 changed-test 路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更轻量：直接测试编辑会运行自身，源代码编辑优先使用显式映射，然后是 sibling 测试和 import-graph 依赖项。共享 group-room 投递配置是显式映射之一：对 group 可见回复配置、源回复投递模式或 message-tool 系统提示词的更改，会经过核心回复测试以及 Discord 和 Slack 投递回归，因此共享默认值更改会在第一次 PR push 前失败。仅当更改足够覆盖整个 harness，以至于低成本映射集不是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

从 repo root 运行 Testbox，并且对宽泛证明优先使用一个新的 warmed box。在把慢门禁花到一个被复用、已过期或刚刚报告了异常大同步的 box 上之前，先在 box 内运行 `pnpm testbox:sanity`。

当必需的 root 文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本；停止该 box 并 warm 一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，为那次 sanity 运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也会终止本地 Blacksmith CLI 调用，如果它在同步阶段停留超过五分钟且没有同步后输出。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该 guard，或者对异常大的本地 diff 使用更大的毫秒值。

当 Blacksmith 不可用或更适合使用自有云容量时，Crabbox 是 repo 拥有的第二条远程 box Linux 证明路径。Warm 一个 box，通过项目工作流 hydrate 它，然后通过 Crabbox CLI 运行命令：

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` 管理提供商、同步和 GitHub Actions hydration 默认值。它会排除本地 `.git`，因此 hydrated Actions checkout 会保留自身的远程 Git 元数据，而不是同步维护者本地的 remote 和 object store；它还会排除绝不应传输的本地运行时/构建产物。`.github/workflows/crabbox-hydrate.yml` 管理 checkout、Node/pnpm 设置、`origin/main` fetch，以及后续 `crabbox run --id <cbx_id>` 命令会 source 的非机密环境交接。

## 相关

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
