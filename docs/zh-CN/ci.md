---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试一个失败的 GitHub Actions 检查
    - 你正在协调一次发布验证运行或重新运行
summary: CI 作业图、范围门禁、发布总括和本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-30T23:44:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67bfe0245e2d78e88357f7068cc9bf9b99559655f87f9b65ffa89649b39bec44
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 会在每次推送到 `main` 以及每个拉取请求时运行。`preflight` 任务会对差异进行分类，并在只有无关区域变更时关闭昂贵的任务通道。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为候选发布版本和广泛验证展开完整图。Android 通道通过 `include_android` 保持选择加入。仅发布的插件覆盖位于单独的 [`Plugin Prerelease`](#plugin-prerelease) 工作流中，并且只会从 [`Full Release Validation`](#full-release-validation) 或显式手动触发运行。

## 流水线概览

| 任务                              | 目的                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更插件，并构建 CI 清单      | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm 公告执行无依赖的生产 lockfile 审计                             | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全任务的必需聚合项                                                | 始终在非草稿推送和 PR 上运行 |
| `check-dependencies`             | 生产 Knip 仅依赖检查，以及未使用文件 allowlist 防护                    | Node 相关变更              |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用下游产物          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果                         | Node 相关变更              |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和插件通道             | Node 相关变更              |
| `check`                          | 分片主本地门禁等价项：生产类型、lint、防护、测试类型和严格 smoke   | Node 相关变更              |
| `check-additional`               | 架构、边界、插件表面防护、包边界和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                               | Node 相关变更              |
| `checks`                         | 已构建产物渠道测试的验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                   | 用于发布的手动 CI 触发    |
| `check-docs`                     | 文档格式化、lint 和断链检查                                                | 文档已变更                       |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                       | Python Skill 相关变更      |
| `checks-windows`                 | Windows 特定进程/路径测试，以及共享运行时导入说明符回归         | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                  | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 受信任活动之后的每日 Codex 慢测试优化                                    | 主 CI 成功或手动触发 |

## 快速失败顺序

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此任务内的步骤，而不是独立任务。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵任务。
3. `build-artifacts` 会与快速 Linux 通道重叠执行，因此下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

当同一 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的任务标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被取代后继续排队。自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸任务无法无限阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 范围和路由

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动触发会跳过变更范围检测，并让 preflight 清单表现得像每个限定范围区域都已变更。

- **CI 工作流编辑**会验证 Node CI 图以及工作流 lint，但本身不会强制执行 Windows、Android 或 macOS 原生构建；这些平台通道仍限定于平台源代码变更。
- **仅 CI 路由编辑、选定的廉价核心测试 fixture 编辑，以及窄范围插件契约 helper/测试路由编辑**会使用快速的仅 Node 清单路径：`preflight`、security，以及单个 `checks-fast-core` 任务。当变更仅限于该快速任务直接覆盖的路由或 helper 表面时，此路径会跳过构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外防护矩阵。
- **Windows Node 检查**限定于 Windows 特定进程/路径包装器、npm/pnpm/UI runner helper、包管理器配置，以及执行该通道的 CI 工作流表面；无关源代码、插件、install-smoke 和仅测试变更会留在 Linux Node 通道上。

最慢的 Node 测试族会被拆分或均衡，让每个任务保持较小规模而不过度预留 runner：渠道契约作为三个加权分片运行，小型核心单元通道会配对，auto-reply 作为四个均衡 worker 运行（其中 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片），agentic gateway/插件配置会分散到现有的仅源代码 agentic Node 任务中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。include-pattern 分片会使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和经过过滤的分片。`check-additional` 会将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界防护分片会在一个任务内并发运行其小型独立防护。Gateway watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，于 `build-artifacts` 内并发运行。

Android CI 会运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，随后构建 Play debug APK。third-party flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包任务。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`（生产 Knip 仅依赖检查，固定到最新 Knip 版本，并为 `dlx` 安装禁用 pnpm 的最低发布年龄）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 对比。当 PR 添加新的未经审查未使用文件，或留下过期 allowlist 条目时，未使用文件防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成产物、构建、live-test 和包桥接表面。

## 手动触发

手动 CI 触发运行与普通 CI 相同的任务图，但会强制开启每个非 Android 限定范围通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立手动 CI 触发仅在 `include_android=true` 时运行 Android；完整发布总入口会通过传递 `include_android=true` 启用 Android。插件预发布静态检查、仅发布的 `agentic-plugins` 分片、完整插件批量扫描和插件预发布 Docker 通道不包含在 CI 中。Docker 预发布套件仅在 `Full Release Validation` 使用已启用的 release-validation 门禁触发单独的 `Plugin Prerelease` 工作流时运行。

手动运行使用唯一并发组，因此候选发布版本完整套件不会被同一 ref 上的另一次推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方在使用所选触发 ref 中工作流文件的同时，针对分支、标签或完整提交 SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片的渠道契约检查、除 lint 以外的 `check` 分片、`check-additional` 分片和聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 预检也使用 GitHub 托管的 Ubuntu，因此 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低负载的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（对 CPU 足够敏感，8 vCPU 增加的成本超过了节省的成本）；install-smoke Docker 构建（32-vCPU 队列时间增加的成本超过了节省的成本）                                                                                                                                                                                                                                                                                                                     |
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

`Full Release Validation` 是用于“发布前运行所有内容”的手动总括工作流。它接受分支、标签或完整提交 SHA，使用该目标分派手动 `CI` 工作流，为仅发布相关的插件/包/静态/Docker 证明分派 `Plugin Prerelease`，并为安装烟测、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram lane 分派 `OpenClaw Release Checks`。当提供已发布包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

`release_profile` 控制传入发布检查的 live/提供商覆盖范围：

- `minimum` 保留最快的 OpenAI/core 发布关键 lane。
- `stable` 添加稳定提供商/后端集合。
- `full` 运行广泛的建议提供商/媒体矩阵。

总括工作流会记录已分派的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流重新运行后变绿，只需重新运行父验证器作业，即可刷新总括结果和时间摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`，仅普通完整 CI 子项使用 `ci`，每个发布子项使用 `release-checks`，也可以在总括工作流上使用更窄的分组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在聚焦修复后将失败发布箱的重新运行限制在边界内。

`OpenClaw Release Checks` 使用可信工作流引用将所选引用解析一次为 `release-package-under-test` tarball，然后将该构件传递给 live/E2E 发布路径 Docker 工作流和包验收分片。这样可以让发布箱之间的包字节保持一致，并避免在多个子作业中重复打包同一个候选版本。

## Live 和 E2E 分片

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖范围，但它通过 `scripts/test-live-shard.mjs` 作为命名分片运行，而不是一个串行作业：

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

这在保持相同文件覆盖范围的同时，让较慢的 live 提供商失败更容易重新运行和诊断。聚合 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍然可用于手动一次性重新运行。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装 `ffmpeg` 和 `ffprobe`；媒体作业只在设置前验证二进制文件。将 Docker 支撑的 live 套件保留在普通 Blacksmith 运行器上，容器作业并不适合启动嵌套 Docker 测试。

Docker 支撑的 live 模型/后端分片会为每个所选提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live 发布工作流会构建并推送该镜像一次，然后 Docker live 模型、Gateway 网关、CLI 后端、ACP bind 和 Codex harness 分片会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片各自独立重新构建完整源 Docker 目标，则说明发布运行配置错误，并会在重复镜像构建上浪费墙钟时间。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证源代码树，而包验收通过用户在安装或更新后执行的同一个 Docker E2E harness 来验证单个 tarball。

### 作业

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 构件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和 profile。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该构件，验证 tarball 清单，在需要时准备包摘要 Docker 镜像，并针对该包运行所选 Docker lane，而不是打包工作流检出内容。当某个 profile 选择多个目标 `docker_lanes` 时，可复用工作流会先准备一次包和共享镜像，然后将这些 lane 扇出为并行的目标 Docker 作业，并使用唯一构件。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果 Package Acceptance 解析了包，则安装同一个 `package-under-test` 构件；独立 Telegram 分派仍可安装已发布的 npm 规范。
4. `summary` 会在包解析、Docker 验收或可选 Telegram lane 失败时使工作流失败。

### 候选来源

- `source=npm` 仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用它执行已发布 beta/稳定版验收。
- `source=ref` 会打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签到达，在分离的工作树中安装依赖，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact` 从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对外共享的构件应提供它。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/测试框架代码。`package_ref` 是 `source=ref` 时会被打包的源提交。这样，当前测试框架就能验证较旧的受信任源提交，而不运行旧的工作流逻辑。

### 套件配置

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 带 OpenWebUI 的完整 Docker 发布路径分块
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

`package` 配置使用离线插件覆盖范围，因此已发布包验证不会受实时 ClawHub 可用性约束。可选的 Telegram 车道会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` 构件，同时保留已发布 npm 规格路径用于独立调度。

发布检查使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖重叠的包/更新/插件车道；Package Acceptance 保留基于构件原生的内置渠道兼容、离线插件和 Telegram 证明，并针对同一个已解析的包 tarball。跨 OS 发布检查仍覆盖特定 OS 的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包和安装器全新车道还会验证已安装包能从原始绝对 Windows 路径导入浏览器控制覆盖。OpenAI 跨 OS agent-turn 冒烟测试在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明保持快速且确定。

### 旧版兼容窗口

Package Acceptance 对已发布包有有界的旧版兼容窗口。到 `2026.4.25` 为止的包，包括 `2026.4.25-beta.*`，可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可以指向 tarball 省略的文件；
- 当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过其持久化子用例；
- `update-channel-switch` 可以从 tarball 派生的假 git 夹具中修剪缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；
- 插件冒烟测试可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重装行为保持不变。

已发布的 `2026.4.26` 包也可以对已经发货的本地构建元数据戳文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 构件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、车道日志、阶段计时和重新运行命令。优先重新运行失败的包配置或精确 Docker 车道，而不是重新运行完整发布验证。

## 安装冒烟测试

独立的 `Install Smoke` 工作流通过自己的 `preflight` 作业复用同一个范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径**会在拉取请求触及 Docker/包表面、内置插件包/manifest 变更，或 Docker 冒烟作业覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面时运行。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会预留 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟测试，运行容器 gateway-network e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时内运行有界内置插件 Docker 配置（每个场景的 Docker 运行单独限时）。
- **完整路径**为夜间计划运行、手动调度、workflow-call 发布检查，以及确实触及安装器/包/Docker 表面的拉取请求保留 QR 包安装和安装器 Docker/更新覆盖。在完整模式下，install-smoke 会准备或复用一个目标 SHA GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟测试、安装器/更新冒烟测试，以及快速内置插件 Docker E2E 作为独立作业运行，避免安装器工作被阻塞在根镜像冒烟测试之后。

`main` 推送（包括合并提交）不会强制完整路径；当变更范围逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker 冒烟测试，并将完整安装冒烟测试留给夜间或发布验证。

慢速 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独控制。它会在夜间计划和发布检查工作流中运行，手动 `Install Smoke` 调度也可以选择启用它，但拉取请求和 `main` 推送不会运行。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享实时测试镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享 `scripts/e2e/Dockerfile` 镜像：

- 用于安装器/更新/插件依赖车道的裸 Node/Git runner；
- 一个功能镜像，将同一个 tarball 安装到 `/app`，用于普通功能车道。

Docker 车道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选定计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每条车道选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行车道。

### 可调参数

| 变量                                   | 默认值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 普通车道的主池槽位数。                                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 提供商敏感尾池槽位数。                                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发实时车道上限，避免提供商限流。                                                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 并发 npm 安装车道上限。                                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务车道上限。                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 车道启动之间的错峰，避免 Docker daemon 创建风暴；设为 `0` 表示不交错。                        |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每条车道的兜底超时（120 分钟）；选定实时/尾部车道使用更紧的上限。                            |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未设置  | `1` 会打印调度器计划而不运行车道。                                                            |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未设置  | 逗号分隔的精确车道列表；跳过清理冒烟测试，以便智能体复现单个失败车道。                       |

比其有效上限更重的车道仍可从空池启动，然后独占运行，直到释放容量。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活跃车道 Status，持久化车道计时以用于最长优先排序，并默认在首次失败后停止调度新的池化车道。

### 可复用实时/E2E 工作流

可复用实时/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪个包、镜像类型、实时镜像、车道和凭证覆盖。`scripts/docker-e2e.mjs` 随后将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包构件，或从 `package_artifact_run_id` 下载包构件；验证 tarball 清单；在计划需要已安装包车道时，通过 Blacksmith 的 Docker 层缓存构建并推送带包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有的包摘要镜像，而不是重新构建。Docker 镜像拉取会使用有界的 180 秒单次尝试超时进行重试，因此卡住的 registry/cache 流会快速重试，而不是消耗大部分 CI 关键路径。

### 发布路径分块

发布 Docker 覆盖会使用较小的分块作业并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取所需的镜像类型，并通过同一个加权调度器执行多条车道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

当前发布版 Docker 分块为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 到 `plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合的 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合的插件/运行时别名。`install-e2e` 通道别名仍是两个提供商安装器通道的聚合手动重跑别名。`bundled-channels` 分块运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。

当完整发布路径覆盖请求需要时，OpenWebUI 会并入 `plugins-runtime-services`，并且只有在仅 OpenWebUI 的调度中才保留独立的 `openwebui` 分块。内置渠道更新通道会针对临时 npm 网络故障重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及逐通道重跑命令。工作流 `docker_lanes` 输入会针对已准备好的镜像运行所选通道，而不是运行分块作业，这让失败通道调试被限制在一个有针对性的 Docker 作业内，并为该运行准备、下载或复用包工件；如果所选通道是实时 Docker 通道，则目标作业会在本地构建实时测试镜像以用于该次重跑。生成的逐通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败通道可以复用失败运行中的确切包和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

定时的实时/E2E 工作流每天运行完整发布路径 Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个由 `Full Release Validation` 或显式操作员调度的独立工作流。普通拉取请求、`main` 推送以及独立的手动 CI 调度会保持该套件关闭。它会在八个扩展工作器之间均衡内置插件测试；这些扩展分片作业一次最多运行两个插件配置组，每个组使用一个 Vitest 工作器和更大的 Node 堆，因此导入密集型插件批次不会创建额外的 CI 作业。

## QA Lab

QA Lab 在主智能作用域工作流之外有专用 CI 通道。

- `Parity gate` 工作流会在匹配的 PR 变更和手动调度时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 智能体包。
- `QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动调度；它会将模拟一致性门、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道作为并行作业展开。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。

发布检查使用确定性的模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，因此渠道契约会与实时模型延迟和常规提供商插件启动隔离。实时传输 Gateway 网关会禁用记忆搜索，因为 QA 一致性会单独覆盖记忆行为；提供商连通性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 在定时和发布门中使用 `--profile fast`，只有在检出的 CLI 支持时才额外添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 调度始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 还会在发布批准前运行发布关键的 QA Lab 通道；其 QA 一致性门会将候选包和基线包作为并行通道作业运行，然后将两个工件下载到一个小型报告作业中，用于最终一致性比较。

不要把 PR 落地路径放到 `Parity gate` 后面，除非变更确实触及 QA 运行时、模型包一致性，或一致性工作流拥有的表面。对于常规渠道、配置、文档或单元测试修复，应将其视为可选信号，并遵循作用域化 CI/检查证据。

## CodeQL

`CodeQL` 工作流有意作为窄范围的第一遍安全扫描器，而不是完整仓库扫描。每日、手动和非草稿拉取请求守护运行会扫描 Actions 工作流代码以及风险最高的 JavaScript/TypeScript 表面，并使用高置信度安全查询，筛选高/严重 `security-severity`。

拉取请求守护保持轻量：它只会针对 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的变更启动，并运行与定时工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不包含在 PR 默认项中。

### 安全类别

| 类别                                              | 表面                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 认证、密钥、沙箱、cron 和 Gateway 网关基线                                                                                             |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥、审计触点                                                           |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络守卫、web-fetch 和插件 SDK SSRF 策略表面                                                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行帮助器、出站投递和智能体工具执行门                                                                                 |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、清单、注册表、运行时依赖暂存、源码加载和插件 SDK 包契约信任表面                                                      |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 定时 Android 安全分片。在工作流完整性检查接受的最小 Blacksmith Linux 运行器上手动构建 Android 应用以供 CodeQL 使用。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上手动构建 macOS 应用以供 CodeQL 使用，从上传的 SARIF 中过滤掉依赖构建结果，并上传到 `/codeql-critical-security/macos` 下。它保持在每日默认项之外，因为即使在干净状态下，macOS 构建也会主导运行时间。

### Critical Quality 类别

`CodeQL Critical Quality` 是对应的非安全分片。它只在较小的 Blacksmith Linux 运行器上，对窄范围高价值表面运行错误严重性、非安全 JavaScript/TypeScript 质量查询。它的拉取请求守护有意小于定时配置：非草稿 PR 只会针对智能体命令/模型/工具执行与回复调度代码、配置架构/迁移/IO 代码、认证/密钥/沙箱/安全代码、核心渠道与内置渠道插件运行时、Gateway 网关协议/服务器方法、记忆运行时/SDK 粘合层、MCP/进程/出站投递、提供商运行时/模型目录、会话诊断/投递队列、插件加载器、插件 SDK/包契约，或插件 SDK 回复运行时变更，运行匹配的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 配置和质量工作流变更会运行全部十二个 PR 质量分片。

手动调度接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

窄配置是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 表面                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 凭证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 配置 schema、迁移、规范化和 IO 契约                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议 schema 和服务器方法契约                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分发、自动回复分发与队列，以及 ACP 控制平面运行时契约                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥接、进程监管辅助工具，以及出站投递契约                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory 主机 SDK、memory 运行时门面、memory 插件 SDK 别名、memory 运行时激活粘合层，以及 memory doctor 命令                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递辅助工具、诊断事件/日志包表面，以及会话 doctor CLI 契约 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复载荷/分块/运行时辅助工具、渠道回复选项、投递队列，以及会话/线程绑定辅助工具             |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商凭证和设备发现、提供商运行时注册、提供商默认值/目录，以及 web/search/fetch/embedding 注册表    |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 启动、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 Web 抓取/搜索、媒体 IO、媒体理解、图像生成，以及媒体生成运行时契约                                                    |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公共表面，以及插件 SDK 入口点契约                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧插件 SDK 源码和插件包契约辅助工具                                                                                      |

质量与安全保持分离，这样质量发现就可以被排期、度量、禁用或扩展，而不会掩盖安全信号。只有在窄配置文件具备稳定运行时和稳定信号之后，才应将 Swift、Python 和内置插件 CodeQL 扩展作为有作用域或分片的后续工作加回。

## 维护工作流

### 文档智能体

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，手动分发也可以直接运行它。当 `main` 已经前移，或者过去一小时内已经创建过另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档处理以来累积的所有 main 变更。

### 测试性能智能体

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动分发会绕过这个每日活动门禁。该通道会构建完整套件分组 Vitest 性能报告，让 Codex 只做保留覆盖率的小型测试性能修复，而不是大范围重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显失败，并且 agent 后的完整套件报告必须通过，之后才会提交任何内容。当 `main` 在 bot push 落地前前移时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于落地后的重复项清理。它默认 dry-run，并且只有在 `apply=true` 时才会关闭明确列出的 PR。在变更 GitHub 之前，它会验证已落地 PR 已合并，并且每个重复项都有共享的引用 issue 或重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门禁和变更路由

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁在架构边界方面比宽泛的 CI 平台范围更严格：

- 核心生产变更会运行核心生产和核心测试 typecheck，以及核心 lint/guard；
- 仅核心测试变更只运行核心测试 typecheck 和核心 lint；
- 插件生产变更会运行插件生产和插件测试 typecheck，以及插件 lint；
- 仅插件测试变更会运行插件测试 typecheck 和插件 lint；
- 公共插件 SDK 或插件契约变更会扩展到插件 typecheck，因为插件依赖这些核心契约（Vitest 插件扫描仍然是显式测试工作）；
- 仅发布元数据的版本号提升会运行定向版本/配置/根依赖检查；
- 未知根目录/配置变更会故障安全地进入所有检查通道。

本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更便宜：直接测试编辑会运行自身，源码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享群组聊天室投递配置是显式映射之一：对群组可见回复配置、源回复投递模式或消息工具系统提示词的变更，会通过核心回复测试以及 Discord 和 Slack 投递回归测试路由，这样共享默认值变更会在第一次 PR push 前失败。只有当变更足够 harness-wide，以至于廉价映射集合不是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

从仓库根目录运行 Testbox，并且对宽泛证明优先使用新预热的 box。在复用、过期或刚刚报告异常大同步的 box 上花费慢门禁之前，先在 box 内运行 `pnpm testbox:sanity`。

当所需根文件（例如 `pnpm-lock.yaml`）消失，或者 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本；停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，请为该完整性运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也会终止在同步阶段停留超过五分钟且没有同步后输出的本地 Blacksmith CLI 调用。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该保护，或者为异常大的本地 diff 使用更大的毫秒值。

## 相关

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
