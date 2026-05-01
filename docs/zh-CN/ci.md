---
read_when:
    - 你需要了解某个 CI 作业为什么运行或未运行
    - 你正在调试一个失败的 GitHub Actions 检查
    - 你正在协调一次发布验证运行或重新运行
summary: CI 作业图、范围门禁、发布总括项和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-05-01T02:24:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c2ee36f96ccf86d4adb739f5f7efb82c05f733e7693571ce391269d2538fec7
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 会在每次推送到 `main` 以及每个拉取请求时运行。`preflight` 作业会分类差异，并在只有无关区域发生变化时关闭昂贵的执行通道。手动 `workflow_dispatch` 运行会有意绕过智能作用域划分，并为候选版本和广泛验证展开完整图。Android 通道通过 `include_android` 保持可选启用。仅发布用的插件覆盖率位于单独的 [`Plugin Prerelease`](#plugin-prerelease) 工作流中，并且只会从 [`Full Release Validation`](#full-release-validation) 或显式手动分发运行。

## 流水线概览

| 作业                             | 用途                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更作用域、变更插件，并构建 CI 清单                                         | 始终在非草稿推送和 PR 上运行       |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 始终在非草稿推送和 PR 上运行       |
| `security-dependency-audit`      | 针对 npm 公告进行无依赖的生产锁文件审计                                                      | 始终在非草稿推送和 PR 上运行       |
| `security-fast`                  | 快速安全作业所需的聚合项                                                                     | 始终在非草稿推送和 PR 上运行       |
| `check-dependencies`             | 生产 Knip 仅依赖检查，加上未使用文件允许列表防护                                             | Node 相关变更                      |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物                                 | Node 相关变更                      |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                                            | Node 相关变更                      |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                 | Node 相关变更                      |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和插件通道                                         | Node 相关变更                      |
| `check`                          | 分片的主要本地门禁等价项：生产类型、lint、防护、测试类型和严格冒烟                           | Node 相关变更                      |
| `check-additional`               | 架构、边界、插件表面防护、包边界和 Gateway 网关 watch 分片                                   | Node 相关变更                      |
| `build-smoke`                    | 已构建 CLI 冒烟测试和启动内存冒烟                                                           | Node 相关变更                      |
| `checks`                         | 构建产物渠道测试的验证器                                                                     | Node 相关变更                      |
| `checks-node-compat-node22`      | Node 22 兼容性构建和冒烟通道                                                                 | 用于发布的手动 CI 分发             |
| `check-docs`                     | 文档格式、lint 和断链检查                                                                    | 文档变更                           |
| `skills-python`                  | 面向 Python 支撑的 Skills 的 Ruff + pytest                                                   | Python Skill 相关变更              |
| `checks-windows`                 | Windows 专用进程/路径测试，加上共享运行时导入说明符回归                                     | Windows 相关变更                   |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                 | macOS 相关变更                     |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | macOS 相关变更                     |
| `android`                        | 两种 flavor 的 Android 单元测试，加上一次调试 APK 构建                                      | Android 相关变更                   |
| `test-performance-agent`         | 受信任活动后的每日 Codex 慢测试优化                                                         | 主 CI 成功或手动分发               |

## 快速失败顺序

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道重叠运行，以便共享构建就绪后下游消费者可以立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

当较新的推送落在同一个 PR 或 `main` ref 上时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被取代后继续排队。自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸项无法无限阻塞新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 作用域和路由

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动分发会跳过变更作用域检测，并让 preflight 清单表现得像每个有作用域的区域都发生了变化。

- **CI 工作流编辑**会验证 Node CI 图和工作流 linting，但不会单独强制 Windows、Android 或 macOS 原生构建；这些平台通道仍限定为平台源代码变更。
- **仅 CI 路由编辑、选定的低成本核心测试 fixture 编辑，以及窄范围插件契约 helper/测试路由编辑**使用快速的仅 Node 清单路径：`preflight`、security，以及单个 `checks-fast-core` 任务。当变更仅限于该快速任务直接覆盖的路由或 helper 表面时，此路径会跳过构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外防护矩阵。
- **Windows Node 检查**限定于 Windows 专用进程/路径包装器、npm/pnpm/UI 运行器 helper、包管理器配置，以及执行该通道的 CI 工作流表面；无关源代码、插件、安装冒烟和仅测试变更仍停留在 Linux Node 通道上。

最慢的 Node 测试族会被拆分或平衡，使每个作业保持较小规模且不过度预留运行器：渠道契约作为三个加权分片运行，小型核心单元通道会配对，auto-reply 作为四个均衡 worker 运行（reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片），agentic gateway/插件配置则分散到现有的仅源代码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用其专用 Vitest 配置，而不是共享插件兜底项。include-pattern 分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和过滤后的分片。`check-additional` 将包边界编译/canary 工作保持在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分离；边界防护分片会在一个作业内并发运行其小型独立防护。Gateway 网关 watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内并发运行。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play 调试 APK。第三方 flavor 没有单独的源码集或清单；其单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送中重复执行调试 APK 打包作业。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`（生产 Knip 仅依赖检查，固定到最新 Knip 版本，并为 `dlx` 安装禁用 pnpm 的最低发布时间限制）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 新增未经审查的未使用文件或留下过期的允许列表条目时，未使用文件防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、实时测试和包桥接表面。

## 手动分发

手动 CI 分发运行与普通 CI 相同的作业图，但会强制开启每个非 Android 作用域通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立手动 CI 分发只有在 `include_android=true` 时才运行 Android；完整发布总控通过传递 `include_android=true` 启用 Android。插件预发布静态检查、仅发布用的 `agentic-plugins` 分片、完整插件批量扫描以及插件预发布 Docker 通道都不包含在 CI 中。Docker 预发布套件只在 `Full Release Validation` 以启用 release-validation 门禁的方式分发单独的 `Plugin Prerelease` 工作流时运行。

手动运行使用唯一并发组，因此候选版本完整套件不会被同一 ref 上的另一个推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方针对分支、标签或完整提交 SHA 运行该图，同时使用所选分发 ref 中的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 以外的 `check` 分片、`check-additional` 分片和聚合作业、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 预检也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（对 CPU 足够敏感，8 vCPU 的成本高于节省的时间）；install-smoke Docker 构建（32-vCPU 排队时间成本高于节省的时间）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；分叉仓库回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；分叉仓库回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`Full Release Validation` 是“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，调度 `Plugin Prerelease` 以提供仅发布所需的插件/软件包/静态/Docker 证明，并调度 `OpenClaw Release Checks` 以执行安装冒烟、软件包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。当提供已发布的软件包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

参见[完整发布验证](/zh-CN/reference/full-release-validation)，了解阶段矩阵、精确的工作流作业名称、配置差异、构件和聚焦重跑句柄。

`release_profile` 控制传入发布检查的 live/提供商覆盖范围。手动发布工作流默认使用 `stable`；仅在你明确需要宽泛的建议性提供商/媒体矩阵时才使用 `full`。

- `minimum` 保留最快的 OpenAI/核心发布关键通道。
- `stable` 添加稳定的提供商/后端集合。
- `full` 运行宽泛的建议性提供商/媒体矩阵。

总控会记录已调度的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流重跑后变绿，只需重跑父验证器作业来刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版使用 `all`，仅普通完整 CI 子项使用 `ci`，仅插件预发布子项使用 `plugin-prerelease`，每个发布子项使用 `release-checks`，或在总控上使用更窄的组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样在聚焦修复后，失败的发布盒子重跑可以保持有界。

`OpenClaw Release Checks` 使用受信任的工作流 ref，将所选 ref 一次性解析为 `release-package-under-test` tarball，然后将该构件传给 live/E2E 发布路径 Docker 工作流和软件包验收分片。这会让各发布盒子使用一致的软件包字节，并避免在多个子作业中重新打包同一个候选项。

针对 `ref=main` 和 `rerun_group=all` 的重复 `Full Release Validation` 运行会取代较旧的总控。父监视器在父项被取消时，会取消它已经调度的任何子工作流，因此较新的 main 验证不会排在陈旧的两小时发布检查运行后面。发布分支/标签验证和聚焦重跑组保持 `cancel-in-progress: false`。

## Live 和 E2E 分片

发布 live/E2E 子项保留宽泛的原生 `pnpm test:live` 覆盖范围，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行，而不是一个串行作业：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 提供商过滤的 `native-live-src-gateway-profiles` 作业
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分的媒体音频/视频分片和提供商过滤的音乐分片

这样在保持相同文件覆盖范围的同时，也让缓慢的 live 提供商失败更容易重跑和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重跑。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证这些二进制文件。将 Docker 支持的 live 套件保留在普通 Blacksmith 运行器上，容器作业不是启动嵌套 Docker 测试的合适位置。

Docker 支持的 live 模型/后端分片会为每个所选提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live 发布工作流会构建并推送该镜像一次，然后 Docker live 模型、按提供商分片的 Gateway 网关、CLI 后端、ACP bind 和 Codex harness 分片会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway 网关 Docker 分片携带显式的脚本级 `timeout` 上限，低于工作流作业超时，因此卡住的容器或清理路径会快速失败，而不是消耗整个发布检查预算。如果这些分片独立重建完整源码 Docker 目标，则说明发布运行配置错误，并会在重复镜像构建上浪费实际时间。

## 软件包验收

当问题是“这个可安装的 OpenClaw 软件包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证源码树，而软件包验收通过用户安装或更新后会执行的同一套 Docker E2E harness 来验证单个 tarball。

### 作业

1. `resolve_package` 会检出 `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中打印来源、工作流 ref、包 ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 会以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该工件，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包运行选定的 Docker lane，而不是打包工作流检出内容。当某个 profile 选择了多个目标 `docker_lanes` 时，可复用工作流会先准备一次包和共享镜像，然后将这些 lane 扇出为并行的目标 Docker 作业，并使用唯一工件。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时它会运行；如果包验收已解析出一个包，它会安装同一个 `package-under-test` 工件；独立的 Telegram 分发仍可安装已发布的 npm spec。
4. 如果包解析、Docker 验收或可选 Telegram lane 失败，`summary` 会使工作流失败。

### 候选来源

- `source=npm` 仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将它用于已发布 beta/稳定版验收。
- `source=ref` 会打包受信任的 `package_ref` 分支、标签或完整 commit SHA。解析器会获取 OpenClaw 分支/标签，验证所选 commit 可从仓库分支历史或发布标签到达，在分离 worktree 中安装依赖，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 会下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact` 会从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但对于外部共享的工件应提供。

请将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源 commit。这样，当前测试 harness 就能验证较旧的受信任源 commit，而无需运行旧的工作流逻辑。

### 套件 profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 带 OpenWebUI 的完整 Docker 发布路径分块
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必填

`package` profile 使用离线插件覆盖，因此已发布包验证不会被实时 ClawHub 可用性阻塞。可选 Telegram lane 会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` 工件，同时为独立分发保留已发布 npm spec 路径。

发布检查会以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用包验收。发布路径 Docker 分块会覆盖重叠的包/更新/插件 lane；包验收则针对同一个已解析包 tarball 保留原生工件的内置渠道兼容、离线插件和 Telegram 证明。跨 OS 发布检查仍会覆盖特定于 OS 的新手引导、安装器和平台行为；包/更新产品验证应从包验收开始。Windows 打包版和安装器全新 lane 还会验证已安装包可以从原始 Windows 绝对路径导入 browser-control override。OpenAI 跨 OS 智能体回合 smoke 在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明保持快速且确定。

### 旧版兼容窗口

包验收为已发布包提供有界的旧版兼容窗口。直到 `2026.4.25` 的包（包括 `2026.4.25-beta.*`）可以使用兼容路径：

- `dist/postinstall-inventory.json` 中的已知私有 QA 条目可能指向 tarball 省略的文件；
- 当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过该持久化子用例；
- `update-channel-switch` 可以从 tarball 派生的 fake git fixture 中剪除缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；
- 插件 smoke 可以读取旧版安装记录位置，或接受缺少 marketplace 安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。

已发布的 `2026.4.26` 包也可能对已发货的本地构建元数据 stamp 文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，先查看 `resolve_package` 摘要，以确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段计时和重运行命令。优先重运行失败的包 profile 或精确 Docker lane，而不是重运行完整发布验证。

## 安装 smoke

独立的 `Install Smoke` 工作流会通过自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径**会在拉取请求触及 Docker/包表面、内置插件包/manifest 变更，或 Docker smoke 作业会执行的核心插件/渠道/Gateway 网关/插件 SDK 表面时运行。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会预留 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行智能体删除共享工作区 CLI smoke，运行容器 `gateway-network` e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时下运行有界的内置插件 Docker profile（每个场景的 Docker 运行单独设置上限）。
- **完整路径**会为夜间定时运行、手动分发、workflow-call 发布检查，以及确实触及安装器/包/Docker 表面的拉取请求保留 QR 包安装和安装器 Docker/更新覆盖。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile smoke 镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关 smoke、安装器/更新 smoke，以及快速内置插件 Docker E2E 作为独立作业运行，这样安装器工作不会排在根镜像 smoke 之后等待。

`main` 推送（包括 merge commit）不会强制走完整路径；当变更范围逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker smoke，并把完整安装 smoke 留给夜间或发布验证。

较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控。它会在夜间计划和发布检查工作流中运行，手动 `Install Smoke` 分发可以选择启用它，但拉取请求和 `main` 推送不会运行。QR 和安装器 Docker 测试保留各自以安装为重点的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 一个裸 Node/Git runner，用于安装器/更新/插件依赖 lane；
- 一个功能镜像，将同一个 tarball 安装到 `/app`，用于常规功能 lane。

Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，planner 逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行所选 plan。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 lane。

### 可调参数

| 变量                                   | 默认值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 普通 lane 的主池 slot 数。                                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 对提供商敏感的 tail-pool slot 数。                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发 live lane 上限，避免提供商限流。                                                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 并发 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务 lane 上限。                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 启动之间的错峰时间，以避免 Docker daemon 创建风暴；设为 `0` 表示不做错峰。              |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每个 lane 的兜底超时（120 分钟）；选定的 live/tail lane 使用更严格的上限。                   |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 会打印调度器 plan，而不运行 lane。                                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 逗号分隔的精确 lane 列表；跳过清理 smoke，以便智能体复现一个失败 lane。                      |

重于其有效上限的 lane 仍可从空池启动，然后独占运行直到释放容量。本地聚合会预检查 Docker，移除陈旧的 OpenClaw E2E 容器，输出活跃 lane Status，持久化 lane 计时以进行最长优先排序，并且默认在首次失败后停止调度新的池化 lane。

### 可复用 live/E2E 工作流

可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、lane 和凭据覆盖范围。随后 `scripts/docker-e2e.mjs` 会把该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包构件，或从 `package_artifact_run_id` 下载包构件；验证 tarball 清单；在计划需要包安装 lane 时，通过 Blacksmith 的 Docker 层缓存构建并推送带有包摘要标签的 bare/functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或已有的包摘要镜像，而不是重新构建。Docker 镜像拉取会按每次尝试 180 秒的有界超时重试，因此卡住的 registry/cache 流会快速重试，而不是消耗 CI 关键路径的大部分时间。

### 发布路径分块

发布 Docker 覆盖范围会运行更小的分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只拉取它需要的镜像类型，并通过同一个加权调度器执行多个 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

当前发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、从 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合的 `bundled-channels` 分块仍可用于手动一次性重新运行，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 也仍作为聚合的插件/运行时别名。`install-e2e` lane 别名仍是两个提供商安装器 lane 的聚合手动重新运行别名。`bundled-channels` 分块运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` lane，而不是串行的全合一 `bundled-channel-deps` lane。

当完整发布路径覆盖范围请求 OpenWebUI 时，OpenWebUI 会并入 `plugins-runtime-services`，并且只为仅 OpenWebUI 的调度保留独立的 `openwebui` 分块。内置渠道更新 lane 会针对临时 npm 网络失败重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、计时、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON、慢 lane 表以及每个 lane 的重新运行命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行所选 lane，而不是运行分块作业，这会把失败 lane 调试限定在一个有针对性的 Docker 作业内，并为该次运行准备、下载或复用包构件；如果所选 lane 是 live Docker lane，则有针对性的作业会为该次重新运行在本地构建 live-test 镜像。生成的每个 lane GitHub 重新运行命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败的 lane 可以复用失败运行中的确切包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

定时 live/E2E 工作流每天运行完整的发布路径 Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/包覆盖范围，因此它是一个独立工作流，由 `Full Release Validation` 或显式操作员调度。普通拉取请求、`main` 推送和独立手动 CI 调度不会开启该套件。它会在八个插件工作器之间均衡内置插件测试；这些插件分片作业一次最多运行两个插件配置组，每组一个 Vitest 工作器，并使用更大的 Node 堆，因此导入负载较重的插件批次不会创建额外的 CI 作业。仅发布 Docker 预发布路径会把有针对性的 Docker lane 分成小组批处理，以避免为一到三分钟的作业保留数十个运行器。

## QA 实验室

QA 实验室在主智能范围化工作流之外有专用 CI lane。

- `Parity gate` 工作流会在匹配的 PR 更改和手动调度时运行；它构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 agentic 包。
- `QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也会在手动调度时运行；它会把 mock parity gate、live Matrix lane，以及 live Telegram 和 Discord lane 作为并行作业展开。Live 作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。

发布检查会使用确定性的 mock 提供商和 mock 限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram live 传输 lane，因此渠道契约会与 live 模型延迟和普通提供商插件启动隔离开。Live 传输 Gateway 网关会禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；提供商连接性由单独的 live 模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 在定时和发布门禁中使用 `--profile fast`，并且只在检出的 CLI 支持时添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 调度始终会把完整 Matrix 覆盖范围分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA 实验室 lane；它的 QA parity gate 会把候选包和基线包作为并行 lane 作业运行，然后把两个构件下载到一个小型报告作业中进行最终 parity 比较。

不要把 PR 落地路径置于 `Parity gate` 之后，除非更改确实触及 QA 运行时、模型包 parity，或 parity 工作流拥有的表面。对于普通渠道、配置、文档或单元测试修复，请将其视为可选信号，并遵循范围化 CI/检查证据。

## CodeQL

`CodeQL` 工作流有意作为狭窄的第一轮安全扫描器，而不是完整仓库扫描。每日、手动和非草稿拉取请求守护运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 表面，并使用筛选到高/严重 `security-severity` 的高置信度安全查询。

拉取请求守护保持轻量：它只会在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下发生更改时启动，并运行与定时工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不属于 PR 默认项。

### 安全类别

| 类别                                              | 表面                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 认证、密钥、沙箱、cron 和 gateway 基线                                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥、审计触点                                                           |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络防护、web-fetch 和插件 SDK SSRF 策略表面                                                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助工具、出站投递和智能体工具执行门禁                                                                             |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、清单、registry、运行时依赖暂存、源码加载和插件 SDK 包契约信任表面                                                    |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 定时 Android 安全分片。在 workflow sanity 接受的最小 Blacksmith Linux 运行器上为 CodeQL 手动构建 Android 应用。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并上传到 `/codeql-critical-security/macos` 下。它保留在每日默认项之外，因为即使在干净状态下，macOS 构建也会主导运行时间。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它只在较小的 Blacksmith Linux 运行器上，对狭窄的高价值表面运行错误严重级别、非安全 JavaScript/TypeScript 质量查询。它的拉取请求守护有意小于定时配置：非草稿 PR 只会为智能体命令/模型/工具执行和回复调度代码、配置 schema/迁移/IO 代码、认证/密钥/沙箱/安全代码、核心渠道和内置渠道插件运行时、gateway 协议/服务器方法、记忆运行时/SDK 胶水、MCP/进程/出站投递、提供商运行时/模型目录、会话诊断/投递队列、插件加载器、插件 SDK/包契约，或插件 SDK 回复运行时更改运行匹配的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 配置和质量工作流更改会运行全部十二个 PR 质量分片。

手动调度接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭窄配置是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 表面                                                                                                                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | 凭证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                                |
| `/codeql-critical-quality/config-boundary`              | 配置架构、迁移、规范化和 IO 契约                                                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议架构和服务器方法契约                                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约                                                                                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥接、进程监督辅助工具，以及出站投递契约                                                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆宿主 SDK、记忆运行时门面、记忆插件 SDK 别名、记忆运行时激活粘合代码，以及记忆 Doctor 命令                                                                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递辅助工具、诊断事件/日志包表面，以及会话 Doctor CLI 契约                                                        |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复载荷/分块/运行时辅助工具、渠道回复选项、投递队列，以及会话/线程绑定辅助工具                                                          |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商凭证和设备发现、提供商运行时注册、提供商默认值/目录，以及 Web/搜索/抓取/嵌入注册表                                                        |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 引导、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 Web 抓取/搜索、媒体 IO、媒体理解、图像生成和媒体生成运行时契约                                                                                               |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公共表面和插件 SDK 入口点契约                                                                                                                     |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧插件 SDK 源码和插件包契约辅助工具                                                                                                                       |

质量与安全保持分离，这样质量发现项可以被调度、度量、禁用或扩展，而不会模糊安全信号。Swift、Python 和内置插件 CodeQL 扩展只应在窄配置文件具备稳定运行时和信号后，作为有范围或分片的后续工作加回。

## 维护工作流

### 文档智能体

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的更改保持一致。它没有纯定时计划：`main` 上成功的非机器人 push CI 运行可以触发它，手动分发也可以直接运行它。当 `main` 已经继续推进，或过去一小时内已经创建了另一个未跳过的 Docs Agent 运行时，工作流运行调用会跳过。运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档处理以来积累的所有 main 更改。

### 测试性能智能体

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢速测试。它没有纯定时计划：`main` 上成功的非机器人 push CI 运行可以触发它，但如果当天 UTC 已经有另一个工作流运行调用已运行或正在运行，它会跳过。手动分发会绕过该每日活动门禁。该通道会构建全套分组 Vitest 性能报告，让 Codex 只做小型且保持覆盖率的测试性能修复，而不是大范围重构，然后重新运行全套报告，并拒绝会减少通过基线测试数量的更改。如果基线存在失败测试，Codex 只能修复显而易见的失败，并且智能体后的全套报告必须通过后才会提交任何内容。当机器人 push 落地前 `main` 前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与文档智能体相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是用于落地后重复项清理的手动维护者工作流。它默认 dry-run，并且只有在 `apply=true` 时才会关闭明确列出的 PR。在变更 GitHub 之前，它会验证已落地 PR 已合并，并且每个重复项要么有共享的引用 issue，要么有重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门禁和变更路由

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更严格：

- 核心生产更改运行核心生产和核心测试类型检查，以及核心 lint/guard；
- 仅核心测试更改只运行核心测试类型检查以及核心 lint；
- 插件生产更改运行插件生产和插件测试类型检查，以及插件 lint；
- 仅插件测试更改运行插件测试类型检查以及插件 lint；
- 公共插件 SDK 或插件契约更改会扩展到插件类型检查，因为插件依赖这些核心契约（Vitest 插件扫测仍然是显式测试工作）；
- 仅发布元数据的版本 bump 运行有针对性的版本/配置/根依赖检查；
- 未知的根/配置更改会故障安全地进入所有检查通道。

本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更便宜：直接测试编辑会运行自身，源码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置是显式映射之一：对群组可见回复配置、源回复投递模式或消息工具系统提示的更改，会通过核心回复测试以及 Discord 和 Slack 投递回归，因此共享默认值更改会在第一个 PR push 前失败。只有当更改涉及足够广的 harness 范围，导致廉价映射集不再是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

从仓库根目录运行 Testbox，并优先为宽泛证明使用新预热的 box。在把慢速门禁花到一个复用、过期或刚报告异常大同步的 box 上之前，先在该 box 内运行 `pnpm testbox:sanity`。

当所需根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本；停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，请为该次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 还会终止本地 Blacksmith CLI 调用，如果它在同步阶段停留超过五分钟且没有同步后输出。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该 guard，或者为异常大的本地 diff 使用更大的毫秒值。

## 相关

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
