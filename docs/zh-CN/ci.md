---
read_when:
    - 你需要了解 CI 作业为什么运行或未运行
    - 你正在调试一个失败的 GitHub Actions 检查
    - 你正在协调发布验证运行或重新运行
summary: CI 作业图、范围门禁、发布总括流程和本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-05-01T23:10:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4475dd906e2a7b7675a01ec72e7782f75ccbb4769bd0333c3f56acea9f343893
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 会在每次推送到 `main` 以及每个拉取请求上运行。`preflight` 作业会对差异进行分类，并在仅不相关区域发生变化时关闭高成本流水线。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为发布候选和广泛验证展开完整图。Android 流水线通过 `include_android` 保持选择性启用。仅发布使用的插件覆盖位于单独的 [`Plugin Prerelease`](#plugin-prerelease) 工作流中，并且只会从 [`Full Release Validation`](#full-release-validation) 或显式手动调度运行。

## 流水线概览

| 作业                              | 目的                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更的扩展，并构建 CI 清单      | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm 公告执行无需安装依赖的生产 lockfile 审计                             | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全作业所需的聚合项                                                | 始终在非草稿推送和 PR 上运行 |
| `check-dependencies`             | 生产 Knip 仅依赖检查，以及未使用文件 allowlist 保护                    | Node 相关变更              |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用下游产物          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性流水线，例如内置/插件契约/协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 带稳定聚合检查结果的分片渠道契约检查                         | Node 相关变更              |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和扩展流水线             | Node 相关变更              |
| `check`                          | 分片主本地门禁等效项：生产类型、lint、保护、测试类型和严格冒烟   | Node 相关变更              |
| `check-additional`               | 架构、边界、扩展表面保护、包边界和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI 冒烟测试和启动内存冒烟                                               | Node 相关变更              |
| `checks`                         | 构建产物渠道测试验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和冒烟流水线                                                   | 发布用手动 CI 调度    |
| `check-docs`                     | 文档格式化、lint 和断链检查                                                | 文档变更                       |
| `skills-python`                  | Python 支持的 Skills 的 Ruff + pytest                                                       | Python Skill 相关变更      |
| `checks-windows`                 | Windows 专属进程/路径测试，以及共享运行时导入说明符回归         | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试流水线                                  | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 在可信活动之后每日进行 Codex 慢测试优化                                    | Main CI 成功或手动调度 |

## 快速失败顺序

1. `preflight` 决定哪些流水线会存在。`docs-scope` 和 `changed-scope` 逻辑是此作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 流水线重叠运行，以便下游消费者可在共享构建就绪后立即开始。
4. 更重的平台和运行时流水线随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

当同一 PR 或 `main` ref 上有较新的推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已被取代后继续排队。自动 CI 并发键带版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸项无法无限期阻塞较新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 范围和路由

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动调度会跳过 changed-scope 检测，并使 preflight 清单表现得像每个已限定范围的区域都发生了变化。

- **CI 工作流编辑**会验证 Node CI 图以及工作流 lint，但不会自行强制运行 Windows、Android 或 macOS 原生构建；这些平台流水线仍限定于平台源代码变更。
- **仅 CI 路由编辑、选定的低成本 core-test fixture 编辑，以及窄范围插件契约辅助/测试路由编辑**使用快速 Node-only 清单路径：`preflight`、安全检查和单个 `checks-fast-core` 任务。当变更仅限于该快速任务直接覆盖的路由或辅助表面时，此路径会跳过构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片和附加保护矩阵。
- **Windows Node 检查**限定于 Windows 专属进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该流水线的 CI 工作流表面；不相关的源代码、插件、install-smoke 和仅测试变更仍保留在 Linux Node 流水线上。

最慢的 Node 测试族会被拆分或平衡，使每个作业保持较小规模而不过度预留运行器：渠道契约作为三个加权分片运行，小型 core 单元流水线成对运行，auto-reply 作为四个平衡 worker 运行（reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片），agentic gateway/plugin 配置分布在现有仅源代码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用其专用 Vitest 配置，而不是共享插件总括项。include-pattern 分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和经过过滤的分片。`check-additional` 将 package-boundary 编译/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖分离；边界保护分片会在一个作业内并发运行其小型独立保护。Gateway watch、渠道测试和 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建后，在 `build-artifacts` 内并发运行。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。third-party flavor 没有单独的 source set 或 manifest；其单元测试流水线仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包作业。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`（生产 Knip 仅依赖检查，固定到最新 Knip 版本，并在 `dlx` 安装时禁用 pnpm 的最低发布年龄限制）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 比较。当 PR 添加新的未经审查的未使用文件，或留下过期 allowlist 条目时，未使用文件保护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、live-test 和包桥接表面。

## 手动调度

手动 CI 调度运行与普通 CI 相同的作业图，但会强制启用每个非 Android 范围流水线：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立手动 CI 调度只有在 `include_android=true` 时才运行 Android；完整发布总控通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布的 `agentic-plugins` 分片、完整扩展批量扫查，以及插件预发布 Docker 流水线均不包含在 CI 中。Docker 预发布套件仅在 `Full Release Validation` 调度单独的 `Plugin Prerelease` 工作流并启用 release-validation 门禁时运行。

手动运行使用唯一的并发组，因此发布候选全套件不会被同一 ref 上的另一次推送或 PR 运行取消。可选的 `target_ref` 输入允许可信调用者在使用所选调度 ref 的工作流文件时，针对分支、标签或完整提交 SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 运行器

| 运行器                           | 任务                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全任务和聚合任务（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 以外的 `check` 分片、`check-additional` 分片和聚合任务、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，因此 Blacksmith 矩阵可以更早排队 |
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

`Full Release Validation` 是用于“在发布前运行所有内容”的手动总括工作流。它接受分支、标签或完整 commit SHA，使用该目标分派手动 `CI` 工作流，分派 `Plugin Prerelease` 以进行仅发布相关的插件/包/静态/Docker 验证，并分派 `OpenClaw Release Checks` 以进行安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 通道。使用 `rerun_group=all` 和 `release_profile=full` 时，它还会针对发布检查中的 `release-package-under-test` 工件运行 `NPM Telegram Beta E2E`。发布后，传入 `npm_telegram_package_spec`，即可针对已发布的 npm 包重新运行同一个 Telegram 包通道。

请参阅[完整发布验证](/zh-CN/reference/full-release-validation)，了解阶段矩阵、确切工作流任务名称、配置文件差异、工件和聚焦重跑句柄。

`release_profile` 控制传入发布检查的 live/提供商 覆盖范围。手动发布工作流默认使用 `stable`；只有在你有意需要更广的咨询型提供商/媒体矩阵时才使用 `full`。

- `minimum` 保留最快的 OpenAI/核心发布关键通道。
- `stable` 添加稳定的提供商/后端集合。
- `full` 运行更广的咨询型提供商/媒体矩阵。

总括工作流会记录已分派的子运行 ID，最终的 `Verify full validation` 任务会重新检查当前子运行结论，并为每个子运行追加最慢任务表。如果某个子工作流被重跑并变为绿色，只需重跑父级验证器任务，即可刷新总括结果和耗时摘要。

恢复时，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对发布候选版本使用 `all`，仅对普通完整 CI 子流程使用 `ci`，仅对插件预发布子流程使用 `plugin-prerelease`，对每个发布子流程使用 `release-checks`，或在总括工作流中使用更窄的组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样在进行聚焦修复后，失败的发布环境重跑会保持边界明确。

`OpenClaw Release Checks` 使用受信任的工作流 ref，将所选 ref 解析一次为 `release-package-under-test` tarball，然后把该工件传给 live/E2E 发布路径 Docker 工作流和包验收分片。这能让发布环境之间的包字节保持一致，并避免在多个子任务中重复打包同一个候选版本。

对于 `ref=main` 和 `rerun_group=all` 的重复 `Full Release Validation` 运行，会由较新的总括工作流取代较旧的总括工作流。父级监视器在父级被取消时，会取消它已经分派的任何子工作流，因此新的 main 验证不会被陈旧的两小时发布检查运行阻塞。发布分支/标签验证和聚焦重跑组会保持 `cancel-in-progress: false`。

## Live 和 E2E 分片

发布 live/E2E 子流程保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行，而不是作为一个串行任务运行：

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
- 拆分的媒体音频/视频分片，以及提供商过滤的音乐分片

这会保持相同的文件覆盖，同时让较慢的 live 提供商失败更容易重跑和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重跑。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预安装了 `ffmpeg` 和 `ffprobe`；媒体任务只会在设置前验证这些二进制文件。让 Docker 支撑的 live 套件继续在普通 Blacksmith 运行器上运行，容器任务并不适合启动嵌套 Docker 测试。

Docker 支撑的 live 模型/后端分片会按所选 commit 使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live 发布工作流会构建并推送该镜像一次，然后 Docker live 模型、按提供商分片的 Gateway 网关、CLI 后端、ACP bind 和 Codex harness 分片会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway 网关 Docker 分片在脚本级携带显式 `timeout` 上限，低于工作流任务超时，因此卡住的容器或清理路径会快速失败，而不是耗尽整个发布检查预算。如果这些分片独立重建完整源码 Docker 目标，则说明发布运行配置错误，并会在重复镜像构建上浪费总耗时。

## 包验收

当问题是“这个可安装的 OpenClaw 包是否能作为产品正常工作？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证源码树，而包验收会通过用户安装或更新后实际使用的同一 Docker E2E harness 来验证单个 tarball。

### 任务

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` artifact 上传，并在 GitHub 步骤摘要中打印来源、工作流 ref、包 ref、版本、SHA-256 和配置文件。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。可复用工作流会下载该 artifact，验证 tarball 清单，在需要时准备包摘要 Docker 镜像，并针对该包运行所选 Docker lane，而不是打包工作流检出内容。当某个配置文件选择多个定向 `docker_lanes` 时，可复用工作流会先准备一次包和共享镜像，然后将这些 lane 扇出为并行定向 Docker 作业，并使用唯一 artifact。
3. `package_telegram` 可选择性调用 `NPM Telegram Beta E2E`。它会在 `telegram_mode` 不是 `none` 时运行，并在包验收已解析出包时安装相同的 `package-under-test` artifact；独立 Telegram 分发仍可安装已发布的 npm 规格。
4. 如果包解析、Docker 验收或可选 Telegram lane 失败，`summary` 会使工作流失败。

### 候选来源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将它用于已发布 beta/稳定版验收。
- `source=ref` 会打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签访问，在分离 worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact` 从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选项，但对于外部共享 artifact 应提供它。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/测试框架代码。`package_ref` 是 `source=ref` 时会被打包的源提交。这样当前测试框架就可以验证较旧的受信任源提交，而无需运行旧的工作流逻辑。

### 套件配置文件

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 包含 OpenWebUI 的完整 Docker 发布路径分块
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必填

`package` 配置文件使用离线插件覆盖，因此已发布包验证不会被实时 ClawHub 可用性阻塞。可选 Telegram lane 会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` artifact，并保留已发布 npm 规格路径用于独立分发。

有关专用的更新和插件测试策略，包括本地命令、Docker lane、包验收输入、发布默认值和失败分类，请参阅[更新和插件测试](/zh-CN/help/testing-updates-plugins)。

发布检查会使用 `source=artifact`、准备好的发布包 artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=release-history`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai` 调用包验收。这会让包迁移、更新、过期插件依赖清理、离线插件、插件更新和 Telegram 证明都基于同一个已解析的包 tarball。跨 OS 发布检查仍会覆盖特定 OS 的新手引导、安装器和平台行为；包/更新产品验证应从包验收开始。`published-upgrade-survivor` Docker lane 每次运行验证一个已发布包基线。在包验收中，已解析的 `package-under-test` tarball 始终是候选项，而 `published_upgrade_survivor_baseline` 选择回退的已发布基线，默认值为 `openclaw@latest`；失败 lane 的重跑命令会保留该基线。设置 `published_upgrade_survivor_baselines=release-history` 可将该 lane 扩展到去重后的历史矩阵：最新六个稳定版本、`2026.4.23`，以及 `2026-03-15` 之前的最新稳定版本。设置 `published_upgrade_survivor_scenarios=reported-issues` 可将相同基线扩展到面向 issue 形态的 fixture，覆盖 Feishu 配置、保留的 bootstrap/persona 文件、波浪号日志路径，以及过期旧版插件依赖根。本地聚合运行可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传入精确包规格，也可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持单个 lane，例如 `openclaw@2026.4.15`，或设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以使用场景矩阵。已发布 lane 会使用内置的 `openclaw config set` 命令配方配置基线，在 `summary.json` 中记录配方步骤，并在 Gateway 网关启动后探测 `/healthz`、`/readyz` 以及 RPC Status。Windows 打包和安装器全新 lane 还会验证已安装的包可以从原始绝对 Windows 路径导入 browser-control override。OpenAI 跨 OS agent-turn 冒烟测试在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.5`，因此安装和 Gateway 网关证明会保持在首选的 GPT-5 测试模型上。

### 旧版兼容窗口

包验收为已发布包设置了有界旧版兼容窗口。直到 `2026.4.25` 的包，包括 `2026.4.25-beta.*`，都可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可以指向 tarball 省略的文件；
- 当包没有公开 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过其持久化子用例；
- `update-channel-switch` 可以从 tarball 派生的假 git fixture 中剪除缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；
- 插件冒烟测试可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。

已发布的 `2026.4.26` 包也可能对已经发布的本地构建元数据戳文件发出警告。更晚的包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，请从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker artifact：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段耗时和重跑命令。优先重跑失败的包配置文件或精确 Docker lane，而不是重跑完整发布验证。

## 安装冒烟测试

独立的 `Install Smoke` 工作流通过自己的 `preflight` 作业复用相同的范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径**会在 pull request 触及 Docker/包表面、内置插件包/清单变更，或 Docker 冒烟作业会覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面时运行。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟测试，运行容器 gateway-network e2e，验证内置 extension 构建参数，并在 240 秒聚合命令超时下运行有界内置插件 Docker 配置文件（每个场景的 Docker 运行分别设置上限）。
- **完整路径**会为夜间计划运行、手动分发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的 pull request 保留 QR 包安装和安装器 Docker/更新覆盖。在完整模式中，install-smoke 会准备或复用一个目标 SHA GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟测试、安装器/更新冒烟测试，以及快速内置插件 Docker E2E 作为单独作业运行，这样安装器工作就不会被根镜像冒烟测试阻塞。

`main` 推送（包括合并提交）不会强制使用完整路径；当变更范围逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker 冒烟测试，并将完整安装冒烟测试留给夜间或发布验证。

较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独控制。它会在夜间计划和发布检查工作流中运行，手动 `Install Smoke` 分发也可以选择加入它，但 pull request 和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享实时测试镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 用于安装器/更新/插件依赖 lane 的裸 Node/Git runner；
- 将相同 tarball 安装到 `/app` 的功能镜像，用于正常功能 lane。

Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行所选计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后通过 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 lane。

### 可调参数

| 变量                                   | 默认值 | 用途                                                                                           |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | 普通执行通道的主池槽位数量。                                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | 对提供商敏感的尾池槽位数量。                                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | 并发实时执行通道上限，避免提供商限流。                                                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10     | 并发 npm install 执行通道上限。                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | 并发多服务执行通道上限。                                                                       |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | 执行通道启动之间的错峰间隔，用于避免 Docker 守护进程创建风暴；设置为 `0` 表示不使用错峰。      |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每个执行通道的兜底超时（120 分钟）；选定的实时/尾部执行通道使用更严格的上限。                  |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未设置 | `1` 会打印调度器计划而不运行执行通道。                                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未设置 | 逗号分隔的精确执行通道列表；跳过清理冒烟测试，以便智能体复现单个失败的执行通道。               |

比其有效上限更重的执行通道仍可从空池启动，然后独占运行直到释放容量。本地聚合流程会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活动执行通道 Status，持久化执行通道耗时以便按最长优先排序，并且默认在第一次失败后停止调度新的池化执行通道。

### 可复用的实时/E2E 工作流

可复用的实时/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像种类、实时镜像、执行通道和凭证覆盖范围。随后 `scripts/docker-e2e.mjs` 会把该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包构件，或从 `package_artifact_run_id` 下载包构件；校验 tarball 清单；当计划需要已安装包的执行通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带有包摘要标签的 bare/functional GHCR Docker E2E 镜像；并且在提供了 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或已有包摘要镜像时复用它们，而不是重新构建。Docker 镜像拉取会使用每次尝试 180 秒的有界超时进行重试，因此卡住的 registry/cache 流会快速重试，而不是消耗 CI 关键路径的大部分时间。

### 发布路径分块

发布 Docker 覆盖使用更小的分块任务运行，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取它需要的镜像种类，并通过同一个加权调度器执行多个执行通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

当前发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及从 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍然是聚合的插件/运行时别名。`install-e2e` 执行通道别名仍然是两个提供商安装器执行通道的聚合手动重跑别名。

当完整发布路径覆盖请求 OpenWebUI 时，OpenWebUI 会折入 `plugins-runtime-services`，并且仅在只调度 OpenWebUI 时保留独立的 `openwebui` 分块。内置渠道更新执行通道会对临时 npm 网络失败重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含执行通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢执行通道表，以及每个执行通道的重跑命令。工作流 `docker_lanes` 输入会针对已准备好的镜像运行选定执行通道，而不是运行分块任务，这样可以把失败执行通道的调试限制在一个有针对性的 Docker 任务中，并为该次运行准备、下载或复用包构件；如果选定执行通道是实时 Docker 执行通道，则有针对性的任务会为该次重跑在本地构建实时测试镜像。生成的每个执行通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备好的镜像输入，因此失败的执行通道可以复用失败运行中的精确包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

计划的实时/E2E 工作流每天运行完整发布路径 Docker 套件。

## 插件预发布

`Plugin Prerelease` 是更昂贵的产品/包覆盖，因此它是由 `Full Release Validation` 或显式操作员调度的独立工作流。普通拉取请求、`main` 推送和单独的手动 CI 调度都会关闭该套件。它会在八个扩展 worker 之间平衡内置插件测试；这些扩展分片任务一次最多运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node 堆，因此导入密集型插件批次不会创建额外的 CI 任务。仅用于发布的 Docker 预发布路径会以小组批处理有针对性的 Docker 执行通道，避免为一到三分钟的任务预留几十个 runner。

## QA Lab

QA Lab 在主智能作用域工作流之外有专用 CI 执行通道。

- `Parity gate` 工作流会在匹配的 PR 变更和手动调度时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 与 Opus 4.6 智能体包。
- `QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动调度；它会将模拟 parity gate、实时 Matrix 执行通道，以及实时 Telegram 和 Discord 执行通道展开为并行任务。实时任务使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex leases。

发布检查会使用确定性模拟提供商和符合模拟要求的模型（`mock-openai/gpt-5.5` 与 `mock-openai/gpt-5.5-alt`）运行 Matrix 与 Telegram 实时传输执行通道，从而将渠道契约与实时模型延迟和普通提供商插件启动隔离。实时传输 Gateway 网关会禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；提供商连接性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 在计划任务和发布门禁中使用 `--profile fast`，并且仅在检出的 CLI 支持时添加 `--fail-fast`。CLI 默认值和手动工作流输入仍然是 `all`；手动 `matrix_profile=all` 调度始终会把完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 任务。

`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 执行通道；它的 QA parity gate 会把候选包和基线包作为并行执行通道任务运行，然后把两个构件下载到一个小型报告任务中，用于最终 parity 比较。

除非变更确实触及 QA 运行时、模型包 parity，或 parity 工作流拥有的表面，否则不要把 PR 落地路径置于 `Parity gate` 之后。对于普通渠道、配置、文档或单元测试修复，将其视为可选信号，并遵循作用域内 CI/检查证据。

## CodeQL

`CodeQL` 工作流有意作为狭窄的第一轮安全扫描器，而不是完整仓库扫描。每日、手动和非草稿拉取请求守护运行会扫描 Actions 工作流代码，以及最高风险的 JavaScript/TypeScript 表面，并使用过滤到高/严重 `security-severity` 的高置信安全查询。

拉取请求守护保持轻量：它只会在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下发生变更时启动，并运行与计划工作流相同的高置信安全矩阵。Android 和 macOS CodeQL 不包含在 PR 默认项中。

### 安全类别

| 类别                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 认证、密钥、沙箱、cron 和 Gateway 网关基线                                                                                          |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥、审计触点                                                        |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络防护、web-fetch，以及插件 SDK SSRF 策略表面                                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行 helper、出站投递，以及智能体工具执行门禁                                                                       |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、manifest、registry、包管理器安装、源码加载，以及插件 SDK 包契约信任表面                                           |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 计划运行的 Android 安全分片。在 workflow sanity 接受的最小 Blacksmith Linux runner 上为 CodeQL 手动构建 Android 应用。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并上传到 `/codeql-critical-security/macos` 下。它保留在每日默认项之外，因为即使干净时，macOS 构建也会主导运行时间。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它只在较小的 Blacksmith Linux runner 上，对狭窄的高价值表面运行错误严重级别、非安全的 JavaScript/TypeScript 质量查询。它的拉取请求守护刻意小于计划配置文件：非草稿 PR 只会针对智能体命令/模型/工具执行和回复分发代码、配置 schema/迁移/IO 代码、认证/密钥/沙箱/安全代码、核心渠道和内置渠道插件运行时、Gateway 网关协议/服务器方法、记忆运行时/SDK 胶水、MCP/进程/出站投递、提供商运行时/模型目录、会话诊断/投递队列、插件加载器、插件 SDK/包契约，或插件 SDK 回复运行时变更，运行匹配的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 配置和质量工作流变更会运行全部十二个 PR 质量分片。

手动调度接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭窄配置文件是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 涉及范围                                                                                                                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 认证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                               |
| `/codeql-critical-quality/config-boundary`              | 配置 schema、迁移、规范化和 IO 契约                                                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议 schema 和服务器方法契约                                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约                                                                                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥接、进程监督辅助工具，以及出站投递契约                                                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆宿主 SDK、记忆运行时门面、记忆插件 SDK 别名、记忆运行时激活胶合代码，以及记忆 Doctor 命令                                                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递辅助工具、诊断事件/日志包表面，以及会话 Doctor CLI 契约                                                       |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复载荷/分块/运行时辅助工具、渠道回复选项、投递队列，以及会话/线程绑定辅助工具                                                         |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商认证和设备发现、提供商运行时注册、提供商默认值/目录，以及 Web/搜索/获取/嵌入注册表                                                       |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 引导、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 Web 获取/搜索、媒体 IO、媒体理解、图像生成，以及媒体生成运行时契约                                                                                          |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公共表面，以及插件 SDK 入口点契约                                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧插件 SDK 源码和插件包契约辅助工具                                                                                                                      |

质量与安全保持分离，这样质量发现项可以被排期、度量、禁用或扩展，而不会掩盖安全信号。只有在窄配置文件具备稳定的运行时和信号之后，才应将 Swift、Python 和内置插件 CodeQL 扩展作为有范围或分片的后续工作加回。

## 维护工作流

### Docs Agent

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的更改保持一致。它没有纯定时计划：`main` 上成功的非 bot 推送 CI 运行可以触发它，手动调度也可以直接运行它。当 `main` 已经前进，或过去一小时内创建了另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一个未跳过的 Docs Agent 来源 SHA 到当前 `main` 的提交范围，因此每小时运行一次即可覆盖自上次文档检查以来累积的所有 main 更改。

### Test Performance Agent

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上成功的非 bot 推送 CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动调度会绕过该每日活动门槛。该通道会构建完整套件分组 Vitest 性能报告，让 Codex 只做小范围且保持覆盖率的测试性能修复，而不是大规模重构；随后重新运行完整套件报告，并拒绝会降低通过基线测试数量的更改。如果基线存在失败测试，Codex 只能修复明显失败项，并且 agent 之后的完整套件报告必须通过，才会提交任何内容。当 `main` 在 bot 推送落地前前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试推送；有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以与文档 agent 保持相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于落地后的重复项清理。它默认 dry-run，并且仅在 `apply=true` 时关闭显式列出的 PR。在变更 GitHub 之前，它会验证已落地 PR 已合并，并且每个重复项要么共享引用的 issue，要么有重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门禁和变更路由

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。与宽泛 CI 平台范围相比，该本地检查门禁对架构边界更严格：

- 核心生产更改运行核心生产和核心测试 typecheck，加上核心 lint/guard；
- 仅核心测试更改只运行核心测试 typecheck，加上核心 lint；
- 插件生产更改运行插件生产和插件测试 typecheck，加上插件 lint；
- 仅插件测试更改运行插件测试 typecheck，加上插件 lint；
- 公共插件 SDK 或插件契约更改会扩展到插件 typecheck，因为插件依赖这些核心契约（Vitest 插件扫查仍然是显式测试工作）；
- 仅发布元数据的版本号 bump 运行定向版本/配置/根依赖检查；
- 未知根目录/配置更改会安全失败到所有检查通道。

本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更低成本：直接测试编辑会运行自身，源码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享 group-room 投递配置是显式映射之一：对群组可见回复配置、来源回复投递模式或 message-tool 系统提示词的更改，会通过核心回复测试加上 Discord 和 Slack 投递回归测试，因此共享默认值更改会在首次 PR 推送前失败。只有当更改影响整个 harness，以至于低成本映射集合不是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

从仓库根目录运行 Testbox，并优先为宽泛证明使用新预热的 box。在把慢门禁花到一个被复用、已过期或刚报告异常大同步的 box 上之前，先在 box 内运行 `pnpm testbox:sanity`。

当必需的根文件（如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本；应停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，在该完整性运行中设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也会终止本地 Blacksmith CLI 调用：如果它在同步阶段停留超过五分钟且没有同步后输出。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该防护，或为异常大的本地 diff 使用更大的毫秒值。

当 Blacksmith 不可用，或更适合使用自有云容量时，Crabbox 是仓库自有的第二条远程 box Linux 证明路径。预热一个 box，通过项目工作流 hydrate 它，然后通过 Crabbox CLI 运行命令：

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` 负责提供商、同步和 GitHub Actions hydrate 默认值。它排除本地 `.git`，因此 hydrate 后的 Actions checkout 会保留自身的远程 Git 元数据，而不是同步维护者本地的 remote 和对象存储；它还排除永远不应传输的本地运行时/构建产物。`.github/workflows/crabbox-hydrate.yml` 负责 checkout、Node/pnpm 设置、`origin/main` 获取，以及后续 `crabbox run --id <cbx_id>` 命令会 source 的非密钥环境交接。

## 相关

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
