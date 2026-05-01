---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试一个失败的 GitHub Actions 检查
    - 你正在协调一次发布验证运行或重新运行
summary: CI 作业图、范围门禁、发布总括项和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-05-01T22:37:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6d284871bfc5f8c4740bd729563070baf396c60a2769f49c521c44dd709addf
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 会在每次推送到 `main` 和每个拉取请求上运行。`preflight` 作业会对差异进行分类，并在只有不相关区域发生变更时关闭昂贵的检查线。手动 `workflow_dispatch` 运行会有意绕过智能作用域限定，并为发布候选版本和广泛验证展开完整图。Android 检查线通过 `include_android` 保持选择加入。仅发布使用的插件覆盖位于单独的 [`Plugin Prerelease`](#plugin-prerelease) 工作流中，并且只会从 [`Full Release Validation`](#full-release-validation) 或显式手动调度运行。

## 流水线概览

| 作业                              | 用途                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更作用域、变更插件，并构建 CI 清单      | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm 公告执行无依赖的生产 lockfile 审计                             | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合结果                                                | 始终在非草稿推送和 PR 上运行 |
| `check-dependencies`             | 生产 Knip 仅依赖检查，以及未使用文件允许列表防护                    | Node 相关变更              |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查和可复用下游产物          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性检查线，例如内置/插件合约/协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片的渠道合约检查，并提供稳定的聚合检查结果                         | Node 相关变更              |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、合约和插件检查线             | Node 相关变更              |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、防护、测试类型和严格 smoke   | Node 相关变更              |
| `check-additional`               | 架构、边界、插件表面防护、包边界和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                               | Node 相关变更              |
| `checks`                         | 已构建产物渠道测试的验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 检查线                                                   | 发布用手动 CI 调度    |
| `check-docs`                     | 文档格式、lint 和断链检查                                                | 文档已变更                       |
| `skills-python`                  | 对 Python 支持的 Skills 运行 Ruff + pytest                                                       | Python Skills 相关变更      |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时导入说明符回归         | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试检查线                                  | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 受信任活动之后的每日 Codex 慢测试优化                                    | 主 CI 成功或手动调度 |

## 快速失败顺序

1. `preflight` 决定哪些检查线实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 检查线重叠运行，这样下游使用方就能在共享构建就绪后立即开始。
4. 更重的平台和运行时检查线随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

当同一个 PR 或 `main` ref 上有更新的推送落地时，GitHub 可能会把被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也在失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个工作流已经被取代后不会继续排队。自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 端旧队列组中的僵尸项不能无限期阻塞更新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消进行中的运行。

## 作用域和路由

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动调度会跳过变更作用域检测，并让 preflight 清单表现得像每个受作用域限定的区域都发生了变更。

- **CI 工作流编辑** 会验证 Node CI 图以及工作流 lint，但不会单独强制 Windows、Android 或 macOS 原生构建；这些平台检查线仍然限定为平台源码变更。
- **仅 CI 路由编辑、选定的廉价核心测试 fixture 编辑，以及窄范围插件合约 helper/测试路由编辑** 会使用快速 Node-only 清单路径：`preflight`、安全检查和单个 `checks-fast-core` 任务。当变更仅限于该快速任务直接执行的路由或 helper 表面时，该路径会跳过构建产物、Node 22 兼容性、渠道合约、完整核心分片、内置插件分片和额外防护矩阵。
- **Windows Node 检查** 限定为 Windows 特定的进程/路径包装器、npm/pnpm/UI runner helper、包管理器配置，以及执行该检查线的 CI 工作流表面；不相关的源码、插件、install-smoke 和仅测试变更会留在 Linux Node 检查线上。

最慢的 Node 测试族会被拆分或均衡，以便每个作业保持较小规模且不过度占用 runner：渠道合约作为三个加权分片运行，小型核心单元检查线会配对，auto-reply 作为四个均衡 worker 运行（reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片），agentic gateway/插件配置分散到现有的仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用它们专用的 Vitest 配置，而不是共享插件 catch-all。include-pattern 分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和经过筛选的分片。`check-additional` 将 package-boundary 编译/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界防护分片会在一个作业内并发运行其小型独立防护。Gateway watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已构建后，在 `build-artifacts` 内并发运行。

Android CI 会运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。third-party flavor 没有单独的源码集或 manifest；它的单元测试检查线仍会使用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每个 Android 相关推送上重复执行 debug APK 打包作业。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`（固定到最新 Knip 版本的生产 Knip 仅依赖检查，并在 `dlx` 安装中禁用 pnpm 的最低发布时间限制）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 添加新的未经审核的未使用文件或留下过期的允许列表条目时，未使用文件防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、实时测试和包桥接表面。

## 手动调度

手动 CI 调度会运行与普通 CI 相同的作业图，但强制开启每个非 Android 作用域检查线：Linux Node 分片、内置插件分片、渠道合约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立的手动 CI 调度只有在 `include_android=true` 时才会运行 Android；完整发布总控通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布用的 `agentic-plugins` 分片、完整插件批量扫描和插件预发布 Docker 检查线都不包含在 CI 中。Docker 预发布套件只会在 `Full Release Validation` 以启用 release-validation 门禁的方式调度单独的 `Plugin Prerelease` 工作流时运行。

手动运行使用唯一的并发组，因此发布候选版本完整套件不会被同一 ref 上的另一个推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方在使用所选调度 ref 的工作流文件时，针对分支、标签或完整提交 SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 预检也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较轻量的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（对 CPU 足够敏感，8 vCPU 节省的时间不抵成本）；install-smoke Docker 构建（32-vCPU 排队时间的成本不抵节省的时间）                                                                                                                                                                                                                                                                                                                     |
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

`Full Release Validation` 是“在发布前运行所有内容”的手动总括工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，为仅发布使用的插件/包/静态/Docker 证明调度 `Plugin Prerelease`，并为安装冒烟测试、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道调度 `OpenClaw Release Checks`。提供已发布的包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解阶段矩阵、精确的工作流作业名称、配置差异、产物以及定向重跑入口。

`release_profile` 控制传入发布检查的 live/provider 覆盖范围。手动发布工作流默认使用 `stable`；仅当你有意需要广泛的参考 provider/media 矩阵时，才使用 `full`。

- `minimum` 保留最快的 OpenAI/核心发布关键通道。
- `stable` 添加稳定的 provider/backend 集合。
- `full` 运行广泛的参考 provider/media 矩阵。

总括工作流会记录已调度的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流重跑后转绿，只需重跑父验证器作业，以刷新总括结果和时间摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`，仅普通完整 CI 子项使用 `ci`，仅插件预发布子项使用 `plugin-prerelease`，每个发布子项使用 `release-checks`，或在总括工作流上使用更窄的组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这会在定向修复后，将失败发布环境的重跑范围控制在边界内。

`OpenClaw Release Checks` 使用受信任的工作流 ref，将选定的 ref 一次解析为 `release-package-under-test` tarball，然后将该产物传递给 live/E2E 发布路径 Docker 工作流和包验收分片。这样可以确保发布环境之间的包字节一致，并避免在多个子作业中重新打包同一个候选版本。

`ref=main` 且 `rerun_group=all` 的重复 `Full Release Validation` 运行会取代较旧的总括运行。父监视器在父运行被取消时，会取消其已调度的任何子工作流，因此较新的 main 验证不会排在过时的两小时 release-check 运行之后。发布分支/标签验证和定向重跑组保持 `cancel-in-progress: false`。

## Live 和 E2E 分片

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它会通过 `scripts/test-live-shard.mjs` 以命名分片运行，而不是作为一个串行作业运行：

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

这样可以保持相同的文件覆盖，同时让缓慢的 live provider 故障更容易重跑和诊断。聚合分片名称 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 仍然可用于手动一次性重跑。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证二进制文件。将 Docker 支持的 live 套件保留在普通 Blacksmith 运行器上，容器作业不适合启动嵌套 Docker 测试。

Docker 支持的 live 模型/backend 分片会针对选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live 发布工作流会构建并推送该镜像一次，然后 Docker live 模型、provider 分片的 Gateway 网关、CLI backend、ACP bind 和 Codex harness 分片会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway 网关 Docker 分片在脚本层带有显式 `timeout` 上限，低于工作流作业超时，因此卡住的容器或清理路径会快速失败，而不是消耗整个 release-check 预算。如果这些分片独立重建完整源 Docker 目标，说明发布运行配置错误，并会在重复镜像构建上浪费实际耗时。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证源码树，而包验收通过用户安装或更新后实际使用的同一个 Docker E2E harness，验证单个 tarball。

### 作业

1. `resolve_package` 检出 `workflow_ref`，解析一个候选包，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中打印来源、workflow ref、package ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该工件，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包运行选定的 Docker lanes，而不是打包工作流检出内容。当某个 profile 选择多个目标 `docker_lanes` 时，可复用工作流会先准备一次包和共享镜像，然后将这些 lanes 扇出为并行的目标 Docker 作业，并使用唯一工件。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行，并且在 Package Acceptance 解析出包时安装同一个 `package-under-test` 工件；独立 Telegram 调度仍可安装已发布的 npm spec。
4. 如果包解析、Docker acceptance 或可选 Telegram lane 失败，`summary` 会让工作流失败。

### 候选来源

- `source=npm` 仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/稳定版 acceptance。
- `source=ref` 打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签访问，在分离 worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载一个 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact` 从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但外部共享工件应提供。

请将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样当前测试 harness 就能验证较旧的受信任源提交，而无需运行旧的工作流逻辑。

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 带 OpenWebUI 的完整 Docker release-path 分块
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

`package` profile 使用离线插件覆盖，因此已发布包验证不会受实时 ClawHub 可用性阻塞。可选 Telegram lane 会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` 工件，同时为独立调度保留已发布 npm spec 路径。

关于专用的更新和插件测试策略，包括本地命令、Docker lanes、Package Acceptance 输入、发布默认值和失败分流，请参阅 [更新和插件测试](/zh-CN/help/testing-updates-plugins)。

发布检查会调用 Package Acceptance，并使用 `source=artifact`、准备好的发布包工件、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=release-history`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai`。这会让包迁移、更新、陈旧插件依赖清理、离线插件、插件更新和 Telegram 证明都基于同一个已解析的包 tarball。跨 OS 发布检查仍覆盖特定 OS 的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。`published-upgrade-survivor` Docker lane 每次运行验证一个已发布包基线。在 Package Acceptance 中，解析出的 `package-under-test` tarball 始终是候选包，而 `published_upgrade_survivor_baseline` 选择回退的已发布基线，默认是 `openclaw@latest`；失败 lane 的重跑命令会保留该基线。设置 `published_upgrade_survivor_baselines=release-history` 可将该 lane 扩展到去重后的历史矩阵：最新六个稳定版本、`2026.4.23`，以及 `2026-03-15` 之前的最新稳定版本。设置 `published_upgrade_survivor_scenarios=reported-issues` 可将同一组基线扩展到按问题形状构造的 fixtures，覆盖 Feishu 配置、保留的 bootstrap/persona 文件、波浪号日志路径，以及陈旧旧版插件依赖根。本地聚合运行可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传入精确包 spec，也可以使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持单个 lane，例如 `openclaw@2026.4.15`，或设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 使用场景矩阵。已发布 lane 使用内置的 `openclaw config set` 命令配方配置基线，在 `summary.json` 中记录配方步骤，并在 Gateway 网关启动后探测 `/healthz`、`/readyz` 以及 RPC 状态。Windows 打包版和安装器全新安装 lanes 还会验证已安装包可以从原始绝对 Windows 路径导入 browser-control 覆盖。OpenAI 跨 OS agent-turn 冒烟测试在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.5`，因此安装和 Gateway 网关证明会保持使用首选 GPT-5 测试模型。

### 旧版兼容窗口

Package Acceptance 对已经发布的包有有界的旧版兼容窗口。直到 `2026.4.25` 的包，包括 `2026.4.25-beta.*`，都可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可能指向 tarball 中省略的文件；
- 当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可能会跳过其持久化子用例；
- `update-channel-switch` 可能会从 tarball 派生的伪 git fixture 中修剪缺失的 `pnpm.patchedDependencies`，并可能记录缺失的已持久化 `update.channel`；
- 插件冒烟测试可能读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；
- `plugin-update` 可能允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。

已发布的 `2026.4.26` 包也可能针对已经发布的本地构建元数据 stamp 文件给出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的 package acceptance 运行时，先查看 `resolve_package` 摘要，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段计时和重跑命令。优先重跑失败的包 profile 或精确 Docker lanes，而不是重跑完整发布验证。

## 安装冒烟测试

单独的 `Install Smoke` 工作流会通过自己的 `preflight` 作业复用同一个 scope 脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径** 针对触及 Docker/包表面、内置插件包/manifest 变更，或 Docker 冒烟作业会覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面的拉取请求运行。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟测试，运行容器 gateway-network e2e，验证内置 extension build arg，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile（每个场景的 Docker 运行分别设上限）。
- **完整路径** 为夜间定时运行、手动调度、workflow-call 发布检查，以及确实触及安装器/包/Docker 表面的拉取请求保留 QR 包安装和安装器 Docker/更新覆盖。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟测试、安装器/更新冒烟测试，以及快速内置插件 Docker E2E 作为独立作业运行，这样安装器工作不会等待根镜像冒烟测试完成。

`main` 推送（包括合并提交）不会强制完整路径；当变更范围逻辑会在推送上请求完整覆盖时，该工作流会保留快速 Docker 冒烟测试，并将完整安装冒烟测试留给夜间或发布验证。

慢速 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独控制。它会在夜间计划和发布检查工作流中运行，手动 `Install Smoke` 调度也可以选择启用它，但拉取请求和 `main` 推送不会运行。QR 和安装器 Docker 测试保留各自聚焦安装的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享实时测试镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享 `scripts/e2e/Dockerfile` 镜像：

- 用于安装器/更新/插件依赖 lanes 的裸 Node/Git runner；
- 将同一个 tarball 安装到 `/app` 的功能镜像，用于正常功能 lanes。

Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，planner 逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选定计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 lanes。

### 可调项

| 变量                                   | 默认值 | 用途                                                                                         |
| -------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 普通通道的主池槽位数。                                                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 对提供商敏感的尾池槽位数。                                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发实时通道上限，避免提供商限流。                                                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 并发 npm install 通道上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务通道上限。                                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 通道启动之间的错峰间隔，用于避免 Docker daemon 创建风暴；设为 `0` 表示不做错峰。             |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每通道兜底超时（120 分钟）；选定的实时/尾部通道使用更严格的上限。                            |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未设置  | `1` 会打印调度器计划而不运行通道。                                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未设置  | 逗号分隔的精确通道列表；跳过清理烟测，以便智能体复现单个失败通道。                           |

比其有效上限更重的通道仍可从空池启动，然后独占运行，直到释放容量。local 聚合流程会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活跃通道状态，持久化通道耗时以便按最长优先排序，并默认在第一次失败后停止调度新的池化通道。

### 可复用实时/E2E 工作流

可复用实时/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、实时镜像、通道和凭据覆盖。随后 `scripts/docker-e2e.mjs` 会把该计划转换成 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包构件，或从 `package_artifact_run_id` 下载包构件；校验 tarball 清单；当计划需要安装包后的通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带包摘要标签的 bare/functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或已有的包摘要镜像，而不是重新构建。Docker 镜像拉取会使用有界的每次尝试 180 秒超时进行重试，因此卡住的 registry/cache 流会快速重试，而不是消耗 CI 关键路径的大部分时间。

### 发布路径分块

发布 Docker 覆盖会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行更小的分块作业，因此每个分块只拉取它需要的镜像类型，并通过同一个加权调度器执行多个通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

当前发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及从 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍然是聚合插件/运行时别名。`install-e2e` 通道别名仍是两个提供商安装器通道的聚合手动重跑别名。

当完整 release-path 覆盖请求 OpenWebUI 时，OpenWebUI 会合并到 `plugins-runtime-services` 中，并且仅为只调度 OpenWebUI 的场景保留独立的 `openwebui` 分块。内置渠道更新通道会针对临时 npm 网络失败重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及每通道重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选定通道，而不是运行分块作业，这会把失败通道调试限定在一个目标 Docker 作业内，并为该次运行准备、下载或复用包构件；如果选定通道是实时 Docker 通道，目标作业会为该次重跑在本地构建实时测试镜像。生成的每通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败通道可以复用失败运行中的精确包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # 下载 Docker 构件并打印组合/每通道的目标重跑命令
pnpm test:docker:timings <summary>   # 慢通道和阶段关键路径摘要
```

定时实时/E2E 工作流每天运行完整的 release-path Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是由 `Full Release Validation` 或显式操作员调度的独立工作流。普通 pull request、`main` 推送和独立手动 CI 调度会保持该套件关闭。它会在八个插件工作器之间平衡内置插件测试；这些插件分片作业每次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node 堆，因此导入繁重的插件批次不会创建额外的 CI 作业。仅发布的 Docker 预发布路径会把目标 Docker 通道分成小组批处理，以避免为一到三分钟的作业预留数十个 runner。

## QA Lab

QA Lab 有位于主智能作用域工作流之外的专用 CI 通道。

- `Parity gate` 工作流会在匹配的 PR 更改和手动调度时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6 智能体包。
- `QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动调度；它会把模拟一致性门、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道作为并行作业展开。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex leases。

发布检查会使用确定性的模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 与 `mock-openai/gpt-5.5-alt`）运行 Matrix 与 Telegram 实时传输通道，因此渠道契约会与实时模型延迟和普通提供商插件启动隔离。实时传输 Gateway 网关会禁用记忆搜索，因为 QA 一致性会单独覆盖记忆行为；提供商连通性由独立的实时模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 对定时和发布门使用 `--profile fast`，仅在检出的 CLI 支持时添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 调度始终会把完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 还会在发布批准前运行发布关键的 QA Lab 通道；其 QA 一致性门会把候选包和基线包作为并行通道作业运行，然后把两个构件下载到一个小型报告作业中，用于最终一致性比较。

不要把 PR 落地路径置于 `Parity gate` 之后，除非更改确实触及 QA 运行时、模型包一致性或一致性工作流拥有的表面。对于普通渠道、配置、文档或单元测试修复，应将其视为可选信号，并遵循有作用域的 CI/检查证据。

## CodeQL

`CodeQL` 工作流有意作为窄范围的第一轮安全扫描器，而不是完整仓库扫描。每日、手动和非草稿 pull request 保护运行会扫描 Actions 工作流代码，以及最高风险的 JavaScript/TypeScript 表面，并使用高置信度安全查询，过滤到 high/critical `security-severity`。

pull request 保护保持轻量：它只会针对 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的更改启动，并运行与定时工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不包含在 PR 默认项中。

### 安全类别

| 类别                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 认证、密钥、沙箱、cron 和 gateway 基线                                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、gateway、插件 SDK、密钥、审计触点                                                             |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络保护、web-fetch 和插件 SDK SSRF 策略表面                                                                     |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助工具、出站交付和智能体工具执行门                                                                             |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、manifest、registry、包管理器安装、source-loading 和插件 SDK 包契约信任表面                                        |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 定时 Android 安全分片。在工作流完整性检查接受的最小 Blacksmith Linux runner 上为 CodeQL 手动构建 Android 应用。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并上传到 `/codeql-critical-security/macos` 下。由于 macOS 构建即使干净时也主导运行时间，因此保留在每日默认项之外。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它只在较小的 Blacksmith Linux runner 上，对窄范围高价值表面运行 error-severity、非安全 JavaScript/TypeScript 质量查询。其 pull request 保护有意小于定时配置：非草稿 PR 只会为智能体命令/模型/工具执行和回复调度代码、配置 schema/迁移/IO 代码、认证/密钥/沙箱/安全代码、核心渠道和内置渠道插件运行时、gateway 协议/服务器方法、记忆运行时/SDK glue、MCP/进程/出站交付、提供商运行时/模型目录、会话诊断/交付队列、插件加载器、插件 SDK/包契约，或插件 SDK 回复运行时更改，运行匹配的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 配置和质量工作流更改会运行全部十二个 PR 质量分片。

手动调度接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

窄配置是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 范围                                                                                                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 凭证、机密、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                               |
| `/codeql-critical-quality/config-boundary`              | 配置 schema、迁移、规范化和 IO 契约                                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议 schema 和服务器方法契约                                                                                                                        |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约                                                                                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥、进程监督辅助工具，以及出站投递契约                                                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory 宿主 SDK、Memory 运行时 facade、Memory 插件 SDK 别名、Memory 运行时激活胶水代码，以及 Memory doctor 命令                                                |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递辅助工具、诊断事件/日志包界面，以及会话 doctor CLI 契约                                                       |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复载荷/分块/运行时辅助工具、渠道回复选项、投递队列，以及会话/线程绑定辅助工具                                                        |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商凭证和设备发现、提供商运行时注册、提供商默认值/目录，以及 web/搜索/fetch/embedding 注册表                                               |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI bootstrap、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/搜索、媒体 IO、媒体理解、图像生成和媒体生成运行时契约                                                                                            |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公共界面和插件 SDK 入口点契约                                                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧插件 SDK 源码和插件包契约辅助工具                                                                                                                     |

质量与安全保持分离，这样质量发现就可以被排期、度量、禁用或扩展，而不会遮蔽安全信号。只有在窄配置文件具备稳定运行时和信号之后，才应将 Swift、Python 和内置插件 CodeQL 扩展作为有范围或分片的后续工作加回。

## 维护工作流

### Docs Agent

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时计划：`main` 上一次成功的非机器人 push CI 运行可以触发它，也可以通过手动 dispatch 直接运行它。当 `main` 已经前进，或过去一小时内已创建过另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次运行可以覆盖自上次文档检查以来累计的所有 main 变更。

### Test Performance Agent

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上一次成功的非机器人 push CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动 dispatch 会绕过这个每日活动门禁。该通道会生成一份完整套件分组 Vitest 性能报告，让 Codex 只做小范围且保持覆盖率的测试性能修复，而不是大规模重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显失败，并且 agent 之后的完整套件报告必须通过，才能提交任何内容。当 `main` 在机器人 push 落地前前进时，该通道会 rebase 已验证补丁，重新运行 `pnpm check:changed`，并重试 push；有冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于落地后的重复项清理。默认是 dry-run，且只有在 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会验证已落地 PR 已合并，并且每个重复项都有共享的引用 issue 或重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门禁和变更路由

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁在架构边界上比广泛的 CI 平台范围更严格：

- 核心生产变更会运行核心生产和核心测试类型检查，加上核心 lint/guard；
- 仅核心测试变更只运行核心测试类型检查，加上核心 lint；
- 插件生产变更会运行插件生产和插件测试类型检查，加上插件 lint；
- 仅插件测试变更会运行插件测试类型检查，加上插件 lint；
- 公共插件 SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约（Vitest 插件扫描仍然是显式测试工作）；
- 仅发布元数据版本 bump 会运行有针对性的版本/配置/root-dependency 检查；
- 未知的 root/config 变更会故障安全地进入所有检查通道。

本地 changed-test 路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更便宜：直接测试编辑运行自身，源码编辑优先使用显式映射，然后是 sibling 测试和 import-graph 依赖项。共享 group-room 投递配置是显式映射之一：对 group 可见回复配置、源回复投递模式或 message-tool 系统提示词的变更，会通过核心回复测试加上 Discord 和 Slack 投递回归，因此共享默认值变更会在第一次 PR push 前失败。只有当变更覆盖整个 harness，导致廉价映射集无法作为可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

从仓库根目录运行 Testbox，并优先为广泛证明使用新预热的 box。在一个被复用、已过期或刚报告异常大同步的 box 上花时间运行慢门禁之前，先在 box 内运行 `pnpm testbox:sanity`。

当所需根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本；停止该 box，并预热一个新的，而不是调试产品测试失败。对于有意的大删除 PR，请为该完整性运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 还会终止在同步阶段停留超过五分钟且没有同步后输出的本地 Blacksmith CLI 调用。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该保护，或者为异常大的本地 diff 使用更大的毫秒值。

当 Blacksmith 不可用，或更适合使用自有云容量时，Crabbox 是仓库自有的第二条远程 box Linux 证明路径。预热一个 box，通过项目工作流 hydrate 它，然后通过 Crabbox CLI 运行命令：

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` 负责提供商、同步和 GitHub Actions hydrate 默认值。它会排除本地 `.git`，这样 hydrate 后的 Actions checkout 会保留自己的远程 Git 元数据，而不是同步维护者本地 remotes 和 object stores；它还会排除绝不应传输的本地运行时/构建产物。`.github/workflows/crabbox-hydrate.yml` 负责 checkout、Node/pnpm 设置、`origin/main` fetch，以及后续 `crabbox run --id <cbx_id>` 命令所 source 的非机密环境交接。

## 相关

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
