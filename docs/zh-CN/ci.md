---
read_when:
    - 你需要了解某个 CI 作业为什么运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T00:40:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d2003fd1c7c09b32e6b677b3b4037ab5b75f3be8984d8dfc1116f5b2aaaa408
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围门控，在只有不相关区域发生变更时跳过高开销作业。手动 `workflow_dispatch` 运行会有意绕过智能范围门控，并展开完整的 CI 作业图，以用于候选发布版本或广泛验证。

QA Lab 在主智能范围工作流之外有专用的 CI 分支。`Parity gate` 工作流会在匹配的 PR 变更和手动派发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上每夜运行，并在手动派发时运行；它会将模拟 parity gate、实时 Matrix 分支和实时 Telegram 分支作为并行作业展开。实时作业使用 `qa-live-shared` environment，而 Telegram 分支使用 Convex 租约。`OpenClaw Release Checks` 也会在发布审批前运行相同的 QA Lab 分支。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复项清理。它默认以 dry-run 模式运行，只有当 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 是否已合并，并验证每个重复 PR 是否具有共享的引用 issue 或重叠的变更代码块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护分支，用于让现有文档与最近已落地的更改保持一致。它没有纯定时调度：在 `main` 上成功完成的一次非机器人推送 CI 运行可以触发它，手动派发也可以直接运行它。workflow-run 调用会在 `main` 已继续前进，或最近一小时内已创建了另一次未被跳过的 Docs Agent 运行时跳过。当它运行时，它会审查从上一次未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次运行可以覆盖自上次文档处理以来积累的所有 main 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护分支，用于处理慢速测试。它没有纯定时调度：在 `main` 上成功完成的一次非机器人推送 CI 运行可以触发它，但如果当个 UTC 日已有另一次 workflow-run 调用已经运行或正在运行，它就会跳过。手动派发会绕过这个按日活动门控。该分支会构建完整测试套件的分组 Vitest 性能报告，让 Codex 仅做小范围且保留覆盖率的测试性能修复，而不是进行大规模重构，然后重新运行完整测试套件报告，并拒绝那些降低通过基线测试数量的更改。如果基线存在失败测试，Codex 只能修复明显失败项，并且智能体处理后的完整测试套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该分支会对已验证补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；发生冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅文档变更、变更范围、变更的扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 执行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 安全通告执行无依赖的生产 lockfile 审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性分支，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并产出稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置插件、契约和扩展分支 | 与 Node 相关的变更 |
| `check` | 分片后的主本地门控等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke 测试 | 与 Node 相关的变更 |
| `checks` | 已构建产物渠道测试的验证器 | 与 Node 相关的变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和 smoke 分支 | `main` push 和手动 CI 派发 |
| `check-docs` | 文档格式化、lint 和失效链接检查 | 文档发生变更时 |
| `skills-python` | 针对 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试分支 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试分支 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动之后按日运行的 Codex 慢测试优化 | 主 CI 成功后或手动派发 |

手动 CI 派发会运行与普通 CI 相同的作业图，但会强制开启所有范围分支：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、build smoke、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此候选发布版本的完整套件不会因为同一引用上的另一次 push 或 PR 运行而被取消。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
```

## 快速失败顺序

作业的排序方式是让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定哪些分支实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 分支并行运行，这样下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时分支会在之后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
手动派发会跳过 changed-scope 检测，并让 preflight 清单表现得像每个范围区域都已发生变更。

CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台分支仍然只由平台源码变更触发。

纯 CI 路由编辑、选定的低成本 core-test fixture 编辑，以及狭义的插件契约辅助工具 / 测试路由编辑，会走快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。该路径会避开构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片，以及额外的守卫矩阵，前提是变更文件仅限于快速任务可直接覆盖的路由或辅助工具表面。

Windows Node 检查的范围限定在 Windows 专用的进程 / 路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该分支的 CI 工作流表面；不相关的源码、插件、install-smoke 和纯测试变更仍然留在 Linux Node 分支上，因此不会为了已由常规测试分片覆盖的内容占用 16 vCPU 的 Windows worker。

独立的 `install-smoke` 工作流通过其自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker/包表面、内置插件包 / manifest 变更，以及 Docker smoke 作业所覆盖的 core 插件 / 渠道 / Gateway 网关 / 插件 SDK 表面，会运行快速路径。仅源码的内置插件变更、纯测试编辑和纯文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 gateway-network e2e，验证一个内置扩展 build arg，并在总命令超时 240 秒的限制下运行受限的内置插件 Docker profile，同时每个场景的 Docker run 也有单独上限。完整路径则保留 QR 包安装以及 installer Docker/update 覆盖，用于每夜定时运行、手动派发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的拉取请求。`main` push（包括合并提交）不会强制完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，该工作流会保留快速 Docker smoke，并把完整 install smoke 留给每夜运行或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控；它会在每夜调度和发布检查工作流中运行，手动 `install-smoke` 派发也可以选择启用它，但拉取请求和 `main` push 不会运行它。QR 和 installer Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于 installer/update/plugin-dependency 分支的裸 Node/Git 运行器，另一个是功能镜像，它会将同一个 tarball 安装到 `/app` 中，供常规功能分支使用。Docker 分支定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行所选计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个分支选择镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行分支；可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整主池默认 10 个槽位，通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整 provider 敏感尾池默认 10 个槽位。重型分支上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务分支不会让 Docker 过度超载，同时较轻的分支仍能填满可用槽位。默认情况下，分支启动会错开 2 秒，以避免本地 Docker daemon 出现创建风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。该本地聚合命令会预检 Docker、移除过时的 OpenClaw E2E 容器、输出活跃分支状态、持久化分支耗时以供最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 以便检查调度器。默认情况下，它会在首次失败后停止调度新的池化分支，并且每个分支都有一个 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 分支使用更严格的每分支上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器分支，包括仅发布时运行的分支（如 `install-e2e`）以及拆分的内置更新分支（如 `bundled-channel-update-acpx`），同时跳过 cleanup smoke，以便智能体复现某一个失败分支。可复用的 live/E2E 工作流会通过 `scripts/test-docker-all.mjs --plan-json` 询问需要哪些包、镜像类型、live 镜像、分支和凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，验证 tarball 清单，并在计划需要 install/update/plugin-dependency 分支时构建并推送一个带 SHA 标签的裸 GHCR Docker E2E 镜像；在计划需要 package-installed 功能分支时，则构建一个带 SHA 标签的功能型 GHCR Docker E2E 镜像；如果任一带 SHA 标签的镜像已存在，工作流会跳过重建该镜像，但仍会创建目标重跑所需的最新 tarball 产物。发布路径 Docker 套件最多会作为三个分块作业运行，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只会拉取自身所需的镜像类型，并通过同一个加权调度器执行多个分支（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。每个分块都会上传 `.artifacts/docker-tests/`，其中包含分支日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON，以及每个分支的重跑命令。工作流的 `docker_lanes` 输入会针对已准备好的镜像运行所选分支，而不是运行三个分块作业，这样失败分支的调试就被限制在单个目标 Docker 作业内，并且会为所选引用准备一个新的 npm tarball；如果所选分支是 live Docker 分支，则该目标作业会为这次重跑在本地构建 live-test 镜像。使用 `pnpm test:docker:rerun <run-id>` 可以从某个 GitHub 运行下载 Docker 产物，并打印合并后的 / 每分支的目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可以查看慢速分支和阶段关键路径摘要。当发布路径套件请求 Open WebUI 时，它会在 plugins/integrations 分块中运行，而不会额外占用第四个 Docker worker；只有在 openwebui-only 派发时，Open WebUI 才保留独立作业。定时 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，这样重复的 npm update 和 doctor repair 过程可以与其他内置检查一起分片运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地检查门控在架构边界方面比广义的 CI 平台范围更严格：core 生产变更会运行 core 生产和 core 测试 typecheck，以及 core lint/guards；core 纯测试变更只运行 core 测试 typecheck 和 core lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展纯测试变更只运行扩展测试 typecheck 和扩展 lint。公开的插件 SDK 或插件契约变更会扩展到扩展 typecheck，因为扩展依赖这些 core 契约，但 Vitest 扩展全量扫描仍然属于显式测试工作。仅发布元数据的版本号提升会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式退回到所有检查分支。

在 push 和手动派发时，`checks-node-compat-node22` 会运行 Node 22 兼容性构建 / smoke 分支。在拉取请求中，该分支会被跳过，矩阵会专注于常规的 Node 24 测试 / 渠道分支。

最慢的 Node 测试族已被拆分或平衡，以便每个作业保持较小规模，同时又不会过度占用 runner：渠道契约作为三个加权分片运行，内置插件测试在六个扩展 worker 之间平衡，小型 core 单元分支成对组合，auto-reply 作为四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，而 agentic Gateway 网关 / 插件配置则分布到现有的仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用它们各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两组插件配置，每组使用一个 Vitest worker，并配备更大的 Node 堆，这样导入密集型插件批次就不会制造额外的 CI 作业。广泛的 agents 分支使用共享的 Vitest 文件并行调度器，因为它主要受导入 / 调度限制，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享 runtime 分片拖尾。包含模式的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与过滤后的分片。`check-additional` 会将包边界 compile/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖分离；边界守卫分片会在一个作业内并发运行其小型独立守卫。Gateway 网关 watch、渠道测试和 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内并发运行；这样既能保留它们原有的检查名称作为轻量验证器作业，又能避免额外两个 Blacksmith worker 和第二个产物消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试分支仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上重复进行 debug APK 打包作业。

当同一个 PR 或 `main` 引用上有新的 push 到来时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已被替代后继续排队。

自动 CI 并发键是带版本的（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行中的运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然足够依赖 CPU，以至于 8 vCPU 节省下来的成本不如其代价；install-smoke Docker 构建，其中 32 vCPU 的排队时间代价高于其节省效果 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门控：按边界分支运行变更相关的 typecheck/lint/guards
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 与上述相同的门控，但带有各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 低成本的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 失效链接
pnpm build          # 当 CI artifact/build-smoke 分支相关时，构建 dist
pnpm ci:timings                               # 汇总最新一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 对比最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪声，并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 对比最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
