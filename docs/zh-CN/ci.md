---
read_when:
    - 你需要了解为什么 CI 作业运行了或没有运行
    - 你正在调试一个失败的 GitHub Actions 检查项
    - 你正在协调发布验证的运行或重新运行
summary: 持续集成作业图、范围门禁、发布总括流程以及本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-30T18:11:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 在每次推送到 `main` 以及每个拉取请求上运行。`preflight` 作业会分类差异，并在只有无关区域发生变化时关闭昂贵的验证线。手动 `workflow_dispatch` 运行会有意绕过智能作用域划分，并为发布候选版本和广泛验证展开完整图。Android 验证线通过 `include_android` 保持选择加入。仅发布使用的插件覆盖率位于单独的 [`插件预发布`](#plugin-prerelease) 工作流中，并且只会从 [`完整发布验证`](#full-release-validation) 或显式手动分发运行。

## 流水线概览

| 作业                              | 用途                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、已变更作用域、已变更插件，并构建 CI 清单      | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm advisories 进行无需依赖安装的生产 lockfile 审计                             | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合项                                                | 始终在非草稿推送和 PR 上运行 |
| `check-dependencies`             | 生产 Knip 仅依赖检查，以及未使用文件 allowlist 防护                    | Node 相关变更              |
| `build-artifacts`                | 构建 `dist/`、Control UI、内置产物检查，以及可复用的下游产物          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性验证线，例如内置/插件契约/协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果                         | Node 相关变更              |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和插件验证线             | Node 相关变更              |
| `check`                          | 分片主本地门禁等价项：生产类型、lint、防护、测试类型和严格 smoke   | Node 相关变更              |
| `check-additional`               | 架构、边界、插件表面防护、包边界，以及 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                               | Node 相关变更              |
| `checks`                         | 已构建产物渠道测试的验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 验证线                                                   | 发布用手动 CI 分发    |
| `check-docs`                     | 文档格式、lint 和断链检查                                                | 文档已变更                       |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                                       | Python Skills 相关变更      |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时导入说明符回归         | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试验证线                                  | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 受信任活动后的每日 Codex 慢测试优化                                    | 主 CI 成功或手动分发 |

## 快速失败顺序

1. `preflight` 决定哪些验证线实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 验证线重叠运行，因此下游消费者可在共享构建就绪后立即开始。
4. 更重的平台和运行时验证线随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

当同一 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已被取代后继续排队。自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 端旧队列组中的僵尸任务无法无限期阻塞更新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，且不会取消进行中的运行。

## 作用域和路由

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动分发会跳过变更作用域检测，并让 preflight 清单表现得像每个作用域区域都发生了变化。

- **CI 工作流编辑**会验证 Node CI 图和工作流 lint，但本身不会强制运行 Windows、Android 或 macOS 原生构建；这些平台验证线仍限定于平台源代码变更。
- **仅 CI 路由编辑、选定的低成本核心测试 fixture 编辑，以及窄范围插件契约辅助/测试路由编辑**会使用快速的仅 Node 清单路径：`preflight`、安全检查，以及单个 `checks-fast-core` 任务。当变更仅限于该快速任务直接覆盖的路由或辅助表面时，该路径会跳过构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片以及额外防护矩阵。
- **Windows Node 检查**的作用域限定于 Windows 特定的进程/路径包装器、npm/pnpm/UI runner 辅助、包管理器配置，以及执行该验证线的 CI 工作流表面；无关源代码、插件、install-smoke 和仅测试变更会保留在 Linux Node 验证线上。

最慢的 Node 测试族会拆分或平衡，使每个作业保持较小规模而不过度预留 runner：渠道契约作为三个加权分片运行，小型核心单元验证线会配对，auto-reply 作为四个平衡 worker 运行（reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片），智能体式 Gateway 网关/插件配置会分布到现有的仅源代码智能体式 Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用其专用 Vitest 配置，而不是共享插件兜底配置。包含模式分片会使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和过滤后的分片。`check-additional` 会将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖率分离；边界防护分片会在一个作业内并发运行其小型独立防护。Gateway watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已构建后，在 `build-artifacts` 内并发运行。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。third-party flavor 没有单独的源集或清单；其单元测试验证线仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包作业。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`（生产 Knip 仅依赖检查，固定到最新 Knip 版本，并在 `dlx` 安装时禁用 pnpm 的最小发布年龄）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 添加新的未经审查的未使用文件，或留下过期 allowlist 条目时，未使用文件防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建内容、实时测试和包桥接表面。

## 手动分发

手动 CI 分发运行与普通 CI 相同的作业图，但会强制开启每个非 Android 作用域验证线：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、build smoke、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立手动 CI 分发只有在 `include_android=true` 时才运行 Android；完整发布总入口会通过传递 `include_android=true` 来启用 Android。插件预发布静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件批量扫描，以及插件预发布 Docker 验证线都排除在 CI 之外。Docker 预发布套件只会在 `Full Release Validation` 启用发布验证门禁并分发单独的 `Plugin Prerelease` 工作流时运行。

手动运行使用唯一并发组，因此发布候选完整套件不会被同一 ref 上的其他推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用者在使用所选分发 ref 的工作流文件时，针对分支、标签或完整提交 SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 预检也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（对 CPU 足够敏感，8 vCPU 节省的成本不抵其开销）；install-smoke Docker 构建（32-vCPU 的排队时间成本不抵其节省）                                                                                                                                                                                                                                                                                                                     |
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

`Full Release Validation` 是用于“发布前运行所有内容”的手动总括工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，调度 `Plugin Prerelease` 以提供仅发布所需的插件/包/静态/Docker 证明，并调度 `OpenClaw Release Checks` 以运行安装烟测、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 线路。当提供已发布的包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

`release_profile` 控制传入发布检查的 live/提供商覆盖范围：

- `minimum` 保留最快的 OpenAI/核心发布关键线路。
- `stable` 添加稳定的提供商/后端集合。
- `full` 运行广泛的 advisory 提供商/媒体矩阵。

总括工作流会记录已调度的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果子工作流被重新运行并变绿，只需重新运行父验证器作业，以刷新总括结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对发布候选版本使用 `all`，只针对常规完整 CI 子项使用 `ci`，针对每个发布子项使用 `release-checks`，或在总括工作流上使用更窄的组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样，在聚焦修复之后，失败的发布环境重跑会保持有界。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将所选 ref 解析一次为 `release-package-under-test` tarball，然后将该产物传递给 live/E2E 发布路径 Docker 工作流和包验收分片。这样可以让包字节在各个发布环境中保持一致，并避免在多个子作业中重新打包同一个候选版本。

## Live 和 E2E 分片

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖范围，但它通过 `scripts/test-live-shard.mjs` 作为命名分片运行，而不是一个串行作业：

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
- 拆分的媒体音频/视频分片和按提供商过滤的音乐分片

这会保持相同的文件覆盖范围，同时让缓慢的 live 提供商故障更容易重跑和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍然可用于手动一次性重跑。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预安装了 `ffmpeg` 和 `ffprobe`；媒体作业只在设置前验证这些二进制文件。将 Docker 支持的 live 套件保持在普通 Blacksmith 运行器上，容器作业不适合启动嵌套 Docker 测试。

Docker 支持的 live 模型/后端分片为每个所选提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live 发布工作流会构建并推送该镜像一次，然后 Docker live 模型、Gateway 网关、CLI 后端、ACP bind 和 Codex harness 分片会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片各自独立重建完整源 Docker 目标，则说明发布运行配置错误，并会在重复镜像构建上浪费墙钟时间。

## 包验收

当问题是“这个可安装的 OpenClaw 包能否作为产品正常工作？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证源码树，而包验收通过用户在安装或更新后会使用的同一个 Docker E2E harness 来验证单个 tarball。

### 作业

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 产物上传，并在 GitHub 步骤摘要中打印来源、工作流 ref、包 ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该产物，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包运行所选 Docker 线路，而不是打包工作流检出内容。当 profile 选择多个目标 `docker_lanes` 时，可复用工作流会准备一次包和共享镜像，然后将这些线路分发为并行的目标 Docker 作业，并使用唯一产物。
3. `package_telegram` 可选地调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果 Package Acceptance 解析了包，它会安装同一个 `package-under-test` 产物；独立的 Telegram 调度仍可安装已发布的 npm 规范。
4. 如果包解析、Docker 验收或可选 Telegram 线路失败，`summary` 会使工作流失败。

### 候选来源

- `source=npm` 仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将它用于已发布 beta/稳定版的验收。
- `source=ref` 会打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离的工作树中安装依赖，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact` 从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但应为对外共享的构件提供。

将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时会被打包的源提交。这让当前测试 harness 能验证较旧的受信任源提交，而不运行旧工作流逻辑。

### 套件配置档

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 带 OpenWebUI 的完整 Docker 发布路径分块
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

`package` 配置档使用离线插件覆盖，因此已发布包验证不会受实时 ClawHub 可用性限制。可选的 Telegram 通道会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` 构件，同时为独立分发保留已发布 npm 规格路径。

发布检查会调用 Package Acceptance，并设置 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai`。发布路径 Docker 分块覆盖重叠的包/更新/插件通道；Package Acceptance 保留针对同一已解析包 tarball 的构件原生内置渠道兼容性、离线插件和 Telegram 证明。跨 OS 发布检查仍覆盖 OS 特定的新手引导、安装程序和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包和安装程序全新通道还会验证已安装包可以从原始绝对 Windows 路径导入浏览器控制覆盖。OpenAI 跨 OS 智能体回合冒烟测试在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明保持快速且确定。

### 旧版兼容窗口

Package Acceptance 对已发布包有有界的旧版兼容窗口。直到 `2026.4.25` 的包（包括 `2026.4.25-beta.*`）可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可以指向 tarball 省略的文件；
- 当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过其持久化子用例；
- `update-channel-switch` 可以从 tarball 派生的假 git fixture 中修剪缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；
- 插件冒烟测试可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。

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

调试失败的包验收运行时，先查看 `resolve_package` 摘要，以确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 构件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段计时和重新运行命令。优先重新运行失败的包配置档或精确 Docker 通道，而不是重新运行完整发布验证。

## 安装冒烟测试

单独的 `Install Smoke` 工作流通过自己的 `preflight` 作业复用相同的范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径** 会针对触及 Docker/包表面、内置插件包/manifest 更改，或 Docker 冒烟作业会运行到的核心插件/渠道/Gateway 网关/插件 SDK 表面的拉取请求运行。仅源代码的内置插件更改、仅测试编辑和仅文档编辑不会预留 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟测试，运行容器 gateway-network e2e，验证内置 extension 构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker 配置档（每个场景的 Docker 运行分别设置上限）。
- **完整路径** 为夜间定时运行、手动分发、workflow-call 发布检查，以及真正触及安装程序/包/Docker 表面的拉取请求保留 QR 包安装和安装程序 Docker/更新覆盖。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟测试、安装程序/更新冒烟测试和快速内置插件 Docker E2E 作为单独作业运行，因此安装程序工作不会排在根镜像冒烟测试之后等待。

`main` 推送（包括合并提交）不会强制完整路径；当变更范围逻辑会在推送时请求完整覆盖时，工作流会保留快速 Docker 冒烟测试，并将完整安装冒烟测试留给夜间或发布验证。

较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独控制。它会在夜间计划和发布检查工作流中运行，手动 `Install Smoke` 分发可以选择加入，但拉取请求和 `main` 推送不会运行它。QR 和安装程序 Docker 测试保留自己的安装专用 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享实时测试镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 用于安装程序/更新/插件依赖通道的裸 Node/Git 运行器；
- 一个功能镜像，将同一个 tarball 安装到 `/app`，用于普通功能通道。

Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行所选计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道。

### 可调参数

| 变量                                   | 默认值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 普通通道的主池槽位数。                                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 对提供商敏感的尾部池槽位数。                                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发实时通道上限，避免提供商限流。                                                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 并发 npm 安装通道上限。                                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务通道上限。                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 通道启动之间的错峰间隔，用于避免 Docker daemon 创建风暴；设为 `0` 表示不错峰。                |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每通道回退超时（120 分钟）；选定的实时/尾部通道使用更严格的上限。                             |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 会打印调度器计划而不运行通道。                                                            |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 逗号分隔的精确通道列表；跳过清理冒烟测试，使智能体可以复现一个失败通道。                      |

比其有效上限更重的通道仍可以从空池启动，然后独自运行直到释放容量。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活动通道状态，持久化通道计时以进行最长优先排序，并默认在第一次失败后停止调度新的池化通道。

### 可复用的实时/E2E 工作流

可复用的实时/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪种包、镜像类型、实时镜像、通道和凭证覆盖。随后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它要么通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，要么下载当前运行的包构件，或从 `package_artifact_run_id` 下载包构件；验证 tarball inventory；当计划需要已安装包通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。Docker 镜像拉取会用有界的每次 180 秒超时重试，因此卡住的 registry/cache 流会快速重试，而不是消耗大部分 CI 关键路径时间。

### 发布路径分块

发布 Docker 覆盖会用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行更小的分块作业，因此每个分块只拉取所需的镜像类型，并通过同一个加权调度器执行多个通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

当前发布版 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 到 `plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合的 `bundled-channels` 分块仍可用于手动一次性重新运行，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍作为聚合的插件/运行时别名保留。`install-e2e` 通道别名仍是两个提供商安装器通道的聚合手动重新运行别名。`bundled-channels` 分块运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的全量一体式 `bundled-channel-deps` 通道。

当完整发布路径覆盖率请求它时，OpenWebUI 会合入 `plugins-runtime-services`，并且仅为只针对 OpenWebUI 的分发保留独立的 `openwebui` 分块。内置渠道更新通道会针对临时 npm 网络故障重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、计时、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON、慢通道表，以及每个通道的重新运行命令。工作流 `docker_lanes` 输入会针对已准备的镜像运行所选通道，而不是运行分块作业，这会把失败通道调试限制在一个有针对性的 Docker 作业内，并为该次运行准备、下载或复用包构件；如果所选通道是实时 Docker 通道，目标作业会在本地为该次重新运行构建实时测试镜像。生成的每通道 GitHub 重新运行命令在这些值存在时会包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败通道可以复用失败运行中的确切包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

定时实时/E2E 工作流每天运行完整发布路径 Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/包覆盖率检查，因此它是一个独立工作流，由 `Full Release Validation` 分发或由明确的操作员分发。普通拉取请求、`main` 推送和独立的手动 CI 分发会保持该套件关闭。它会把内置插件测试均衡分配到八个扩展工作器；这些扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest 工作器和更大的 Node 堆，因此导入密集的插件批次不会创建额外的 CI 作业。

## QA Lab

QA Lab 在主智能作用域工作流之外有专用 CI 通道。

- `Parity gate` 工作流会在匹配的 PR 变更和手动分发时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6 智能体包。
- `QA-Lab - All Lanes` 工作流会每晚在 `main` 上运行，也会在手动分发时运行；它会把模拟一致性门禁、实时 Matrix 通道、实时 Telegram 和 Discord 通道展开为并行作业。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。

发布检查会使用确定性的模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 与 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，因此渠道契约会与实时模型延迟和常规提供商插件启动隔离。实时传输 Gateway 网关会禁用记忆搜索，因为 QA 一致性会单独覆盖记忆行为；提供商连通性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 在定时门禁和发布门禁中使用 `--profile fast`，仅当检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍是 `all`；手动 `matrix_profile=all` 分发始终会把完整 Matrix 覆盖率分片成 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 还会在发布批准之前运行发布关键的 QA Lab 通道；它的 QA 一致性门禁会把候选包和基线包作为并行通道作业运行，然后把两个构件下载到一个小型报告作业中，用于最终一致性比较。

不要把 PR 合并路径放在 `Parity gate` 后面，除非该变更确实触及 QA 运行时、模型包一致性，或一致性工作流拥有的表面。对于普通渠道、配置、文档或单元测试修复，把它视为可选信号，并遵循作用域 CI/检查证据。

## CodeQL

`CodeQL` 工作流有意作为窄范围的一次性安全扫描器，而不是完整仓库扫描。每日、手动和非草稿拉取请求保护运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 表面，并使用高置信度安全查询，过滤到高/关键 `security-severity`。

拉取请求保护保持轻量：它只会因 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的变更启动，并且运行与定时工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不纳入 PR 默认项。

### 安全类别

| 类别                                              | 表面                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 认证、密钥、沙箱、cron 和网关基线                                                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥、审计触点                                                           |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络防护、web-fetch 和插件 SDK SSRF 策略表面                                                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助工具、出站投递和智能体工具执行门禁                                                                             |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、manifest、注册表、运行时依赖暂存、源码加载和插件 SDK 包契约信任表面                                                  |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 定时 Android 安全分片。在工作流完整性检查接受的最小 Blacksmith Linux 运行器上为 CodeQL 手动构建 Android 应用。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并上传到 `/codeql-critical-security/macos` 下。它保持在每日默认项之外，因为即使干净运行，macOS 构建也会主导运行时间。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它只在较小的 Blacksmith Linux 运行器上，对窄范围高价值表面运行错误严重级别的非安全 JavaScript/TypeScript 质量查询。它的拉取请求保护有意比定时配置更小：非草稿 PR 只会为智能体命令/模型/工具执行和回复分发代码、配置 schema/迁移/IO 代码、认证/密钥/沙箱/安全代码、核心渠道和内置渠道插件运行时、Gateway 网关协议/服务器方法、记忆运行时/SDK 粘合代码、MCP/进程/出站投递、提供商运行时/模型目录、会话诊断/投递队列、插件加载器、插件 SDK/包契约或插件 SDK 回复运行时变更，运行匹配的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 配置和质量工作流变更会运行全部十二个 PR 质量分片。

手动分发接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

窄范围配置是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 表面                                                                                                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 认证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                              |
| `/codeql-critical-quality/config-boundary`              | 配置 schema、迁移、规范化和 IO 契约                                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议 schema 和服务器方法契约                                                                                                                        |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分发、自动回复分发与队列，以及 ACP 控制平面运行时契约                                                                                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥接、进程监控帮助函数，以及出站投递契约                                                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆主机 SDK、记忆运行时 facade、记忆插件 SDK 别名、记忆运行时激活胶水代码，以及记忆 Doctor 命令                                                               |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递帮助函数、诊断事件/日志包表面，以及会话 Doctor CLI 契约                                                       |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复 payload/分块/运行时帮助函数、渠道回复选项、投递队列，以及会话/thread 绑定帮助函数                                                  |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商认证和设备发现、提供商运行时注册、提供商默认值/目录，以及 web/search/fetch/embedding 注册表                                              |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 引导、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                        |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、媒体 IO、媒体理解、图像生成，以及媒体生成运行时契约                                                                                      |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公开表面，以及插件 SDK 入口点契约                                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布的包侧插件 SDK 源码和插件包契约帮助函数                                                                                                                   |

质量与安全保持分离，这样质量发现就可以被排期、度量、禁用或扩展，而不会遮蔽安全信号。Swift、Python 和内置插件 CodeQL 扩展只应在窄范围 profile 具有稳定运行时和信号之后，作为有作用域或分片的后续工作再加回来。

## 维护工作流

### Docs Agent

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，手动 dispatch 也可以直接运行它。当 `main` 已经向前移动，或过去一小时内已经创建过另一次未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一次未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档检查以来累积的所有 main 变更。

### Test Performance Agent

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，但如果当天 UTC 已经有另一次 workflow-run 调用运行过或正在运行，它会跳过。手动 dispatch 会绕过这个每日活动门禁。该通道会构建完整套件分组 Vitest 性能报告，让 Codex 只做小范围、保留覆盖率的测试性能修复，而不是大规模重构，然后重新运行完整套件报告，并拒绝会减少通过基线测试数量的变更。如果基线有失败测试，Codex 只能修复明显的失败，并且 agent 后的完整套件报告必须通过，才会提交任何内容。当 `main` 在 bot push 落地前前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于落地后的重复项清理。它默认 dry-run，并且只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地 PR 已合并，并验证每个重复 PR 要么有共享引用的 issue，要么有重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门禁和变更路由

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁在架构边界方面比宽泛的 CI 平台范围更严格：

- 核心生产变更会运行核心 prod 和核心测试类型检查，以及核心 lint/guard；
- 仅核心测试变更只运行核心测试类型检查和核心 lint；
- 插件生产变更会运行插件 prod 和插件测试类型检查，以及插件 lint；
- 仅插件测试变更会运行插件测试类型检查和插件 lint；
- 公开插件 SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约（Vitest 插件 sweep 仍然是显式测试工作）；
- 仅发布元数据的版本号 bump 会运行定向版本/config/root-dependency 检查；
- 未知 root/config 变更会安全失败到所有检查通道。

本地 changed-test 路由位于 `scripts/test-projects.test-support.mjs`，并且刻意比 `check:changed` 更便宜：直接测试编辑会运行自身，源码编辑优先使用显式映射，然后是同级测试和 import-graph 依赖项。共享 group-room 投递配置是显式映射之一：对 group visible-reply 配置、源回复投递模式或 message-tool 系统提示词的变更，会通过核心回复测试以及 Discord 和 Slack 投递回归测试进行路由，从而让共享默认值变更在第一次 PR push 之前失败。只有当变更足够 harness-wide，以至于廉价映射集合不是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

从仓库根目录运行 Testbox，并优先为宽范围证明使用新预热的 box。在一个复用、过期或刚报告异常大同步的 box 上投入慢门禁之前，先在该 box 内运行 `pnpm testbox:sanity`。

当所需根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本；应停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意的大量删除 PR，为该完整性检查运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

如果本地 Blacksmith CLI 调用在同步阶段停留超过五分钟且没有同步后输出，`pnpm testbox:run` 也会终止它。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该保护，或为异常大的本地 diff 使用更大的毫秒值。

## 相关

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
