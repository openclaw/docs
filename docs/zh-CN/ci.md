---
read_when:
    - 你需要了解某个 CI 作业为何运行或未运行
    - 你正在调试一个失败的 GitHub Actions 检查
    - 你正在协调发布验证运行或重跑
summary: CI 作业图、范围门禁、发布总括和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-30T05:47:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cdbf803e7a6c7ad75cd499234a58443e2a36557c34972f59ea144e0ebd3a6f4
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 在每次 push 到 `main` 以及每个 pull request 时运行。`preflight` 作业会对 diff 分类，并在只有无关区域变更时关闭高成本的 lane。手动 `workflow_dispatch` 运行会有意绕过智能作用域划分，并展开完整图，用于候选发布版本和广泛验证。Android lane 通过 `include_android` 保持可选启用。仅发布用的插件覆盖率位于单独的 [`插件预发布`](#plugin-prerelease) workflow 中，并且只会从 [`完整发布验证`](#full-release-validation) 或显式手动 dispatch 运行。

## 流水线概览

| 作业                             | 用途                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、已变更作用域、已变更插件，并构建 CI manifest                                 | 始终在非草稿 push 和 PR 上运行     |
| `security-scm-fast`              | 通过 `zizmor` 检测私钥并审计 workflow                                                        | 始终在非草稿 push 和 PR 上运行     |
| `security-dependency-audit`      | 针对 npm advisories 执行无依赖的生产 lockfile 审计                                           | 始终在非草稿 push 和 PR 上运行     |
| `security-fast`                  | 快速安全作业的必需聚合                                                                       | 始终在非草稿 push 和 PR 上运行     |
| `check-dependencies`             | 生产 Knip 仅依赖检查，以及未使用文件 allowlist guard                                         | Node 相关变更                      |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物                                 | Node 相关变更                      |
| `checks-fast-core`               | 快速 Linux 正确性 lane，例如内置/插件契约/协议检查                                           | Node 相关变更                      |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果                                                   | Node 相关变更                      |
| `checks-node-core-test`          | 核心 Node 测试分片，排除渠道、内置、契约和插件 lane                                          | Node 相关变更                      |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、guard、测试类型和严格 smoke                         | Node 相关变更                      |
| `check-additional`               | 架构、边界、插件表面 guard、包边界和 gateway-watch 分片                                      | Node 相关变更                      |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                                        | Node 相关变更                      |
| `checks`                         | 已构建产物渠道测试的验证器                                                                   | Node 相关变更                      |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke lane                                                              | 发布用手动 CI dispatch             |
| `check-docs`                     | 文档格式、lint 和损坏链接检查                                                                | 文档已变更                         |
| `skills-python`                  | 针对 Python 支持的 Skills 执行 Ruff + pytest                                                 | Python skill 相关变更              |
| `checks-windows`                 | Windows 特定进程/路径测试，以及共享运行时 import specifier 回归测试                         | Windows 相关变更                   |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试 lane                                                | macOS 相关变更                     |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | macOS 相关变更                     |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建                                     | Android 相关变更                   |
| `test-performance-agent`         | 可信活动后的每日 Codex 慢测试优化                                                            | 主 CI 成功或手动 dispatch          |

## 失败快速顺序

1. `preflight` 决定哪些 lane 会存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux lane 重叠运行，因此下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时 lane 会随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

当同一 PR 或 `main` ref 上有较新的 push 落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个 workflow 已经被取代后不会继续排队。自动 CI 并发键带版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸运行无法无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，且不会取消正在进行的运行。

## 作用域和路由

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动 dispatch 会跳过 changed-scope 检测，并让 preflight manifest 表现得像每个作用域区域都已变更。

- **CI workflow 编辑**会验证 Node CI 图和 workflow linting，但本身不会强制 Windows、Android 或 macOS 原生构建；这些平台 lane 仍然只针对平台源码变更划分作用域。
- **仅 CI 路由编辑、选定的低成本核心测试 fixture 编辑，以及窄范围插件契约 helper/测试路由编辑**会使用快速的仅 Node manifest 路径：`preflight`、security，以及单个 `checks-fast-core` 任务。当变更仅限于该快速任务直接覆盖的路由或 helper 表面时，该路径会跳过构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外 guard 矩阵。
- **Windows Node 检查**的作用域限定为 Windows 特定的进程/路径 wrapper、npm/pnpm/UI runner helper、包管理器配置，以及执行该 lane 的 CI workflow 表面；无关源码、插件、install-smoke 和仅测试变更仍留在 Linux Node lane 上。

最慢的 Node 测试族会被拆分或均衡，以便每个作业保持较小规模且不过度预留 runner：渠道契约作为三个加权分片运行，小型核心单元 lane 会配对，auto-reply 作为四个均衡 worker 运行（reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片），而 agentic gateway/插件配置会分布到现有的仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试会使用各自专用的 Vitest 配置，而不是共享的插件 catch-all。include-pattern 分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与过滤后的分片。`check-additional` 将包边界编译/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界 guard 分片会在一个作业内并发运行其小型独立 guard。Gateway watch、渠道测试和核心支持边界分片会在 `dist/` 与 `dist-runtime/` 已构建后，在 `build-artifacts` 内部并发运行。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试 lane 仍会使用 SMS/call-log BuildConfig flag 编译该 flavor，同时避免在每次 Android 相关 push 时重复执行 debug APK 打包作业。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`（生产 Knip 仅依赖检查，固定到最新 Knip 版本，并在 `dlx` 安装时禁用 pnpm 的最低发布年龄）和 `pnpm deadcode:unused-files`，后者会将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 对比。当 PR 添加新的未审查未使用文件，或留下过期 allowlist 条目时，未使用文件 guard 会失败，同时保留 Knip 无法静态解析的有意动态插件、生成产物、构建、实时测试和包桥接表面。

## 手动 dispatch

手动 CI dispatch 运行与普通 CI 相同的作业图，但会强制启用每个非 Android 作用域 lane：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立手动 CI dispatch 只有在 `include_android=true` 时才运行 Android；完整发布总控会通过传递 `include_android=true` 启用 Android。插件预发布静态检查、仅发布用的 `agentic-plugins` 分片、完整插件批量扫描和插件预发布 Docker lane 均排除在 CI 之外。Docker 预发布套件只会在 `Full Release Validation` 使用启用的 release-validation 门禁 dispatch 单独的 `Plugin Prerelease` workflow 时运行。

手动运行使用唯一并发组，因此候选发布版本完整套件不会被同一 ref 上的另一条 push 或 PR 运行取消。可选的 `target_ref` 输入允许可信调用方在使用所选 dispatch ref 的 workflow 文件时，针对分支、tag 或完整 commit SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 预检也使用 GitHub 托管的 Ubuntu，因此 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（对 CPU 足够敏感，8 vCPU 的成本高于节省的成本）；install-smoke Docker 构建（32-vCPU 的排队时间成本高于节省的成本）                                                                                                                                                                                                                                                                                                                     |
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

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，调度 `Plugin Prerelease` 以进行仅发布相关的插件/包/静态/Docker 验证，并调度 `OpenClaw Release Checks` 以进行安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab 对等、Matrix 和 Telegram 车道。提供已发布包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

`release_profile` 控制传入发布检查的 live/provider 覆盖范围：

- `minimum` 保留最快的 OpenAI/核心发布关键车道。
- `stable` 添加稳定的提供商/后端集合。
- `full` 运行宽范围的咨询性提供商/媒体矩阵。

总控会记录被调度的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流重新运行后变绿，只需重新运行父级验证器作业，即可刷新总控结果和耗时摘要。

为了恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对发布候选版本使用 `all`，只针对普通完整 CI 子项使用 `ci`，针对每个发布子项使用 `release-checks`，也可以在总控上使用更窄的组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样在聚焦修复后，失败发布箱的重新运行范围会保持受限。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将选定 ref 一次性解析为 `release-package-under-test` tarball，然后将该产物传给 live/E2E 发布路径 Docker 工作流和包验收分片。这样可以保持发布箱之间的包字节一致，并避免在多个子作业中重复打包同一候选版本。

## Live 和 E2E 分片

发布 live/E2E 子项保留宽范围的原生 `pnpm test:live` 覆盖，但它会通过 `scripts/test-live-shard.mjs` 以命名分片运行，而不是单个串行作业：

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
- 拆分后的媒体音频/视频分片，以及按提供商过滤的音乐分片

这会保持相同的文件覆盖范围，同时让较慢的 live 提供商失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍然可用于手动一次性重新运行。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装了 `ffmpeg` 和 `ffprobe`；媒体作业只在设置前验证二进制文件。将 Docker 支持的 live 套件保留在普通 Blacksmith 运行器上，容器作业并不适合启动嵌套 Docker 测试。

Docker 支持的 live 模型/后端分片会为每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live 发布工作流会构建并推送该镜像一次，然后 Docker live 模型、Gateway 网关、CLI 后端、ACP bind 和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重建完整源码 Docker 目标，说明发布运行配置错误，并会在重复镜像构建上浪费总耗时。

## 包验收

当问题是“这个可安装的 OpenClaw 包是否作为产品可用？”时，使用 `Package Acceptance`。它不同于普通 CI：普通 CI 验证源码树，而包验收通过用户安装或更新后会使用的同一套 Docker E2E harness 来验证单个 tarball。

### 作业

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 产物上传，并在 GitHub 步骤摘要中打印来源、工作流 ref、包 ref、版本、SHA-256 和配置档案。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该产物，验证 tarball 清单，在需要时准备包摘要 Docker 镜像，并针对该包运行选定的 Docker 车道，而不是打包工作流检出内容。当某个配置档案选择多个定向 `docker_lanes` 时，可复用工作流会准备包和共享镜像一次，然后将这些车道展开为并行定向 Docker 作业，并使用唯一产物。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时，它会运行，并在 Package Acceptance 已解析出包时安装同一个 `package-under-test` 产物；独立 Telegram 调度仍然可以安装已发布的 npm 规格。
4. 如果包解析、Docker 验收或可选 Telegram 车道失败，`summary` 会让工作流失败。

### 候选来源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布 beta/稳定版验收。
- `source=ref` 会打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离的工作树中安装依赖，然后使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact` 从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对外共享的产物应提供它。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/测试框架代码。`package_ref` 是 `source=ref` 时会被打包的源提交。这样当前测试框架可以验证较旧的受信任源提交，而无需运行旧的工作流逻辑。

### 套件配置文件

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 带 OpenWebUI 的完整 Docker 发布路径分块
- `custom` — 精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

`package` 配置文件使用离线插件覆盖，因此已发布包验证不会受实时 ClawHub 可用性限制。可选的 Telegram 车道会在 `NPM Telegram Beta E2E` 中复用 `package-under-test` 产物，并保留已发布 npm 规范路径用于独立调度。

发布检查会使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖重叠的包/更新/插件车道；Package Acceptance 针对同一个已解析包 tarball 保留产物原生的内置渠道兼容性、离线插件和 Telegram 证明。跨 OS 发布检查仍覆盖 OS 特定的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包和安装器全新车道还会验证已安装包可以从原始绝对 Windows 路径导入浏览器控制覆盖项。OpenAI 跨 OS 智能体回合冒烟默认使用已设置的 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，这样安装和 Gateway 网关证明可以保持快速且确定。

### 旧版兼容窗口

Package Acceptance 对已经发布的包有有界的旧版兼容窗口。直到 `2026.4.25` 的包，包括 `2026.4.25-beta.*`，可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可以指向 tarball 省略的文件；
- 当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过该持久化子用例；
- `update-channel-switch` 可以从 tarball 派生的伪 git fixture 中剪除缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；
- 插件冒烟可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。

已发布的 `2026.4.26` 包也可能对已经发布的本地构建元数据戳文件发出警告。之后的包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 产物：`.artifacts/docker-tests/**/summary.json`、`failures.json`、车道日志、阶段耗时和重新运行命令。优先重新运行失败的包配置文件或精确 Docker 车道，而不是重新运行完整发布验证。

## 安装冒烟

单独的 `Install Smoke` 工作流通过自己的 `preflight` 作业复用同一作用域脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路径** 会在拉取请求触及 Docker/包表面、内置插件包/manifest 变更，或 Docker 冒烟作业会执行的核心插件/渠道/Gateway 网关/插件 SDK 表面时运行。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会预留 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟，运行容器 gateway-network e2e，验证内置 extension 构建参数，并在 240 秒聚合命令超时下运行有界的内置插件 Docker 配置文件（每个场景的 Docker 运行单独封顶）。
- **完整路径** 保留 QR 包安装和安装器 Docker/更新覆盖，用于夜间定时运行、手动调度、workflow-call 发布检查，以及确实触及安装器/包/Docker 表面的拉取请求。在完整模式下，install-smoke 会准备或复用一个目标 SHA GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟、安装器/更新冒烟，以及快速内置插件 Docker E2E 作为独立作业运行，使安装器工作无需等待根镜像冒烟之后。

`main` 推送（包括合并提交）不会强制完整路径；当变更作用域逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker 冒烟，并将完整安装冒烟留给夜间或发布验证。

慢速 Bun 全局安装 image-provider 冒烟由 `run_bun_global_install_smoke` 单独控制。它会在夜间计划和发布检查工作流中运行，手动 `Install Smoke` 调度也可以选择加入，但拉取请求和 `main` 推送不会运行。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享实时测试镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 用于安装器/更新/插件依赖车道的裸 Node/Git runner；
- 将同一个 tarball 安装到 `/app` 的功能镜像，用于常规功能车道。

Docker 车道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选定计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个车道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行车道。

### 可调项

| 变量                                   | 默认值  | 目的                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 常规车道的主池槽位数。                                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 提供商敏感尾部池槽位数。                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 并发实时车道上限，避免提供商限流。                                                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 并发 npm 安装车道上限。                                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 并发多服务车道上限。                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 车道启动之间的错峰，避免 Docker 守护进程创建风暴；设为 `0` 表示不使用错峰。                  |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每车道回退超时（120 分钟）；选定的实时/尾部车道使用更严格的上限。                             |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未设置  | `1` 会打印调度器计划而不运行车道。                                                            |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未设置  | 逗号分隔的精确车道列表；跳过清理冒烟，以便智能体复现一个失败车道。                            |

重于其有效上限的车道仍可从空池启动，然后独占运行，直到释放容量。本地聚合会预检 Docker，移除过期的 OpenClaw E2E 容器，输出活动车道 Status，持久化车道耗时用于最长优先排序，并默认在第一次失败后停止调度新的池化车道。

### 可复用实时/E2E 工作流

可复用实时/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪个包、镜像种类、实时镜像、车道和凭证覆盖。随后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要已安装包车道时，通过 Blacksmith 的 Docker layer cache 构建并推送带包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用已提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有的包摘要镜像，而不是重新构建。Docker 镜像拉取会以有界的每次尝试 180 秒超时重试，因此卡住的 registry/cache 流会快速重试，而不是消耗 CI 关键路径的大部分时间。

### 发布路径分块

发布 Docker 覆盖会使用更小的分块作业并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只拉取所需的镜像种类，并通过同一个加权调度器执行多个车道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

当前发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 到 `plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍保留为聚合插件/运行时别名。`install-e2e` 通道别名仍是两个提供商安装器通道的聚合手动重跑别名。`bundled-channels` 分块会运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。

当完整发布路径覆盖率请求需要时，OpenWebUI 会并入 `plugins-runtime-services`，并且仅为只调度 OpenWebUI 的情况保留独立的 `openwebui` 分块。内置渠道更新通道会针对临时 npm 网络故障重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及每个通道的重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选定通道，而不是运行分块作业，这会把失败通道调试限定在一个目标 Docker 作业内，并为该次运行准备、下载或复用 package 工件；如果选定通道是实时 Docker 通道，目标作业会在本地构建实时测试镜像以执行该次重跑。生成的逐通道 GitHub 重跑命令在这些值存在时会包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败通道可以复用失败运行中的精确 package 和镜像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

定时实时/E2E 工作流每天运行完整发布路径 Docker 套件。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/package 覆盖率检查，因此它是一个单独的工作流，由 `Full Release Validation` 调度或由明确的操作员调度。普通拉取请求、`main` 推送和独立手动 CI 调度会关闭该套件。它会在八个插件工作器之间均衡内置插件测试；这些插件分片作业每次最多运行两个插件配置组，每组使用一个 Vitest 工作器和更大的 Node 堆，因此导入密集型插件批次不会产生额外 CI 作业。

## QA 实验室

QA 实验室在主智能范围工作流之外有专用 CI 通道。

- `Parity gate` 工作流会在匹配的 PR 变更和手动调度时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6 智能体包。
- `QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，并在手动调度时运行；它会将模拟一致性门禁、实时 Matrix 通道以及实时 Telegram 和 Discord 通道作为并行作业展开。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。

发布检查会使用确定性模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，因此渠道契约会与实时模型延迟和普通提供商插件启动隔离开来。实时传输 Gateway 网关会禁用记忆搜索，因为 QA 一致性会单独覆盖记忆行为；提供商连通性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 在定时门禁和发布门禁中使用 `--profile fast`，仅当检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 调度始终会将完整 Matrix 覆盖率分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 还会在发布批准前运行发布关键的 QA 实验室通道；其 QA 一致性门禁会将候选包和基线包作为并行通道作业运行，然后把两个工件下载到一个小型报告作业中，用于最终一致性比较。

除非变更实际触及 QA 运行时、模型包一致性，或一致性工作流拥有的表面，否则不要把 PR 合并路径放在 `Parity gate` 后面。对于普通渠道、配置、文档或单元测试修复，将它视为可选信号，并遵循范围化 CI/检查证据。

## CodeQL

`CodeQL` 工作流有意作为一个范围较窄的首轮安全扫描器，而不是完整仓库扫描。每日、手动和非草稿拉取请求守卫运行会扫描 Actions 工作流代码以及风险最高的 JavaScript/TypeScript 表面，并使用高置信度安全查询，筛选高/关键 `security-severity`。

拉取请求守卫保持轻量：它只会针对 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的变更启动，并运行与定时工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不包含在 PR 默认值中。

### 安全类别

| 类别                                              | 表面                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 认证、密钥、沙箱、cron 和 Gateway 网关基线                                                                                             |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥、审计触点                                                          |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络防护、网页抓取，以及插件 SDK SSRF 策略表面                                                                     |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助工具、出站投递，以及智能体工具执行门禁                                                                         |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、清单、注册表、运行时依赖暂存、源码加载，以及插件 SDK package 契约信任表面                                           |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 定时 Android 安全分片。在工作流完整性检查接受的最小 Blacksmith Linux runner 上为 CodeQL 手动构建 Android 应用。上传到 `/codeql-critical-security/android` 下。
- `CodeQL macOS Critical Security` — 每周/手动 macOS 安全分片。在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤依赖构建结果，并上传到 `/codeql-critical-security/macos` 下。它保持在每日默认值之外，因为即使干净时，macOS 构建也会主导运行时长。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它只在较小的 Blacksmith Linux runner 上，对范围较窄的高价值表面运行错误严重级别的非安全 JavaScript/TypeScript 质量查询。它的拉取请求守卫有意小于定时配置文件：非草稿 PR 仅针对渠道运行时、Gateway 网关协议/服务器方法、MCP/进程/出站投递、提供商运行时/模型目录、会话诊断/投递队列、插件加载器、插件 SDK/package 契约，或插件 SDK 回复运行时变更，运行匹配的 `channel-runtime-boundary`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 配置和质量工作流变更会运行全部八个 PR 质量分片。

手动调度接受：

```
profile=all|channel-runtime-boundary|gateway-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

这些窄配置文件是用于单独运行一个质量分片的教学/迭代钩子。

| 类别                                                    | 涉及范围                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 凭证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                                |
| `/codeql-critical-quality/config-boundary`              | 配置 schema、迁移、规范化和 IO 契约                                                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议 schema 和服务器方法契约                                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道实现契约                                                                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约                                                                                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥接、进程监管辅助工具，以及出站投递契约                                                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆宿主 SDK、记忆运行时 facade、记忆插件 SDK alias、记忆运行时激活胶水代码，以及记忆 doctor 命令                                                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递辅助工具、诊断事件/日志包表面，以及会话 doctor CLI 契约                                                         |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分发、回复载荷/分块/运行时辅助工具、渠道回复选项、投递队列，以及会话/thread 绑定辅助工具                                                        |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商凭证和设备发现、提供商运行时注册、提供商默认值/目录，以及 web/search/fetch/embedding 注册表                                                |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 启动、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、媒体 IO、媒体理解、图像生成和媒体生成运行时契约                                                                                            |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公开表面，以及插件 SDK 入口点契约                                                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧插件 SDK 源码和插件包契约辅助工具                                                                                                                       |

质量与安全保持分离，这样质量发现就可以被排期、度量、禁用或扩展，而不会掩盖安全信号。Swift、Python 和内置插件 CodeQL 扩展只有在窄配置文件具备稳定运行时和稳定信号后，才应作为有范围限定或分片的后续工作重新加入。

## 维护工作流

### Docs Agent

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于保持现有文档与最近落地的变更一致。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，也可以通过手动分发直接运行。工作流运行调用会在 `main` 已前进，或过去一小时内已创建另一次未跳过的 Docs Agent 运行时跳过。运行时，它会审查从上一次未跳过 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上一次文档处理以来累积的所有 main 变更。

### Test Performance Agent

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，但如果该 UTC 日已有另一次 workflow-run 调用已经运行或正在运行，它会跳过。手动分发会绕过这个每日活动门禁。该通道会构建完整套件分组 Vitest 性能报告，让 Codex 只做小范围且保留覆盖率的测试性能修复，而不是大范围重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显失败，并且 agent 之后的完整套件报告必须通过，才会提交任何内容。当 `main` 在 bot push 落地前前进时，该通道会 rebase 已验证补丁，重新运行 `pnpm check:changed`，并重试 push；有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以与 docs agent 保持相同的 drop-sudo 安全姿态。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于落地后的重复项清理。它默认 dry-run，并且只有在 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会验证已落地 PR 已合并，并验证每个重复项要么共享被引用的 issue，要么存在重叠的变更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门禁和变更路由

本地变更通道路由逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更严格：

- 核心生产代码变更会运行核心生产代码和核心测试 typecheck，以及核心 lint/guard；
- 仅核心测试变更只运行核心测试 typecheck 和核心 lint；
- 插件生产代码变更会运行插件生产代码和插件测试 typecheck，以及插件 lint；
- 仅插件测试变更会运行插件测试 typecheck 和插件 lint；
- 公开插件 SDK 或插件契约变更会扩展到插件 typecheck，因为插件依赖这些核心契约（Vitest 插件 sweep 仍然是显式测试工作）；
- 仅发布元数据的版本提升会运行有针对性的版本/配置/根依赖检查；
- 未知根目录/配置变更会 fail safe 到所有检查通道。

本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且刻意比 `check:changed` 更低成本：直接测试编辑会运行自身，源码编辑优先使用显式映射，然后是同级测试和导入图依赖方。共享群组房间投递配置是其中一个显式映射：对群组可见回复配置、源回复投递模式或 message-tool 系统提示词的变更，会经过核心回复测试以及 Discord 和 Slack 投递回归测试，这样共享默认值变更会在第一次 PR push 之前失败。只有当变更在 harness 范围内足够广，以至于低成本映射集不能作为可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

从仓库根目录运行 Testbox，并优先为宽泛证明使用一个新预热的 box。在把慢门禁花到一个复用过、已过期或刚报告意外大规模同步的 box 上之前，先在 box 内运行 `pnpm testbox:sanity`。

当所需根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常表示远程同步状态不是 PR 的可信副本；停止该 box，并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，为该完整性运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

如果本地 Blacksmith CLI 调用在同步阶段停留超过五分钟且没有同步后输出，`pnpm testbox:run` 也会终止它。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该保护；对于异常大的本地 diff，也可以使用更大的毫秒值。

## 相关

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
