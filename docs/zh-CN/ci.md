---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-26T22:14:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: bad9dde51020fc3833d3848955a01af36e38e281a4c9de128b36b9553f66665e
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能作用域划分，在只有无关区域发生变更时跳过昂贵的作业。

QA Lab 在主智能作用域工作流之外有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更以及手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可以手动触发；它会并行扇出模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道。实时作业使用 `qa-live-shared` environment，Telegram 通道使用 Convex leases。`OpenClaw Release Checks` 也会在发布批准前运行相同的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后清理重复 PR。它默认使用 dry-run，只有在 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会验证已合并的 PR 确实已合并，并且每个重复 PR 要么具有共同引用的问题，要么存在重叠的变更代码块。

`Docs Agent` 工作流是一个由事件驱动的 Codex 维护通道，用于让现有文档与最近已合并的变更保持一致。它没有纯定时调度：在 `main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，也可以通过手动触发直接运行。如果 `main` 已经继续前进，或者在过去一小时内已经创建了另一个未被跳过的 Docs Agent 运行，则 workflow-run 调用会跳过。当它运行时，会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累积的所有 main 变更。

`Test Performance Agent` 工作流是一个由事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：在 `main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，但如果该 UTC 日期内另一个 workflow-run 调用已经运行或正在运行，它就会跳过。手动触发会绕过这个按日活动门禁。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 只做小范围、保留覆盖率的测试性能修复，而不是进行大范围重构，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的变更。如果基线中存在失败测试，Codex 只能修复明显失败的问题，并且智能体处理后的完整测试套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅文档变更、变更的作用域、变更的扩展，并构建 CI 清单 | 在所有非 draft 的 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非 draft 的 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisories 执行无需安装依赖的生产 lockfile 审计 | 在所有非 draft 的 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合项 | 在所有非 draft 的 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | 核心 Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对发生变更的内置插件进行聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主要本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke 测试 | 与 Node 相关的变更 |
| `checks` | 已构建产物的渠道测试验证器，以及仅在 push 上运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生变更 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一次 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动之后每日运行的 Codex 慢测试优化 | main CI 成功后或手动触发 |

## 快速失败顺序

作业的排序方式是让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时通道会在这之后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对平台源码变更进行作用域控制。
仅涉及 CI 路由的编辑、部分低成本的 core-test fixture 编辑，以及狭义的插件契约辅助工具 / 测试路由编辑，会走一条快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。该路径会避开构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片以及额外守卫矩阵，前提是变更文件仅限于快速任务可直接覆盖的路由或辅助工具表面。
Windows Node 检查的作用域限定在 Windows 专用的进程 / 路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、install-smoke 和仅测试变更仍保留在 Linux Node 通道中，这样就不会为了普通测试分片已经覆盖的内容而占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用了同一个作用域脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker / package 表面、内置插件 package/manifest 变更，以及 Docker smoke 作业所覆盖的 core 插件 / 渠道 / Gateway 网关 / 插件 SDK 表面，会运行快速路径。仅源码的内置插件变更、仅测试编辑以及仅文档编辑不会占用 Docker workers。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行 container gateway-network e2e，验证一个内置扩展构建参数，并在 240 秒的聚合命令超时内运行受限的内置插件 Docker profile，同时每个场景的 Docker run 也分别受限。完整路径则保留 QR package 安装以及 installer Docker/update 覆盖，用于夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的拉取请求。`main` 推送（包括 merge commits）不会强制走完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，该工作流仍然只保留快速 Docker smoke，而将完整 install smoke 留给夜间或发布验证。较慢的 Bun 全局安装 image-provider smoke 由单独的 `run_bun_global_install_smoke` 门禁控制；它会在夜间调度和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但拉取请求和 `main` 推送不会运行它。QR 和 installer Docker 测试保留各自专注于安装的 Dockerfiles。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是供 installer/update/plugin-dependency 通道使用的纯 Node/Git 运行器，另一个是功能镜像，它会把同一个 tarball 安装到 `/app` 中，供普通功能通道使用。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行这些通道；默认主池并发槽数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对提供商敏感的尾池并发槽数也为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道的默认上限分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，从而避免 npm install 和多服务通道让 Docker 过度承载，同时较轻的通道仍可填满可用槽位。默认情况下，通道启动会错开 2 秒，以避免本地 Docker daemon 出现 create 风暴；可以用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合器会先检查 Docker、移除陈旧的 OpenClaw E2E 容器、输出活动通道状态、持久化通道耗时以支持最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 以检查调度器。默认情况下，在首次失败后它会停止继续调度新的池化通道；每个通道都有一个 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分 live/tail 通道使用更严格的单通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确指定的调度器通道，包括仅发布使用的通道，例如 `install-e2e`，以及按更新目标拆分的内置更新通道，例如 `bundled-channel-update-acpx`，同时会跳过 cleanup smoke，以便智能体复现某个失败通道。可复用的 live/E2E 工作流会构建并推送一个带 SHA 标签的 bare GHCR Docker E2E 镜像和一个带 SHA 标签的 functional GHCR Docker E2E 镜像，然后以最多三个分块作业运行发布路径 Docker 套件，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块都只拉取自己需要的镜像类型，并通过相同的加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、阶段耗时以及每个通道的重新运行命令。工作流输入 `docker_lanes` 会针对已准备好的镜像运行所选通道，而不是运行这三个分块作业，这样失败通道的调试就能限制在一个有针对性的 Docker 作业中；如果所选通道是 live Docker 通道，则该定向作业会在本地为该次重跑构建 live-test 镜像。当发布路径套件请求 Open WebUI 时，它会在 plugins/integrations 分块内运行，而不是额外占用第四个 Docker worker；只有 openwebui-only 触发时，Open WebUI 才保留独立作业。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm update 和 doctor repair 轮次可以与其他内置检查分片并行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台作用域更严格：core 生产变更会运行 core prod 类型检查加 core 测试，core 仅测试变更只运行 core test 类型检查 / 测试，扩展生产变更会运行 extension prod 类型检查加 extension 测试，而扩展仅测试变更只运行 extension test 类型检查 / 测试。公开的插件 SDK 或插件契约变更会扩大为扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本号变更会运行定向的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式落入所有通道。

在 push 上，`checks` 矩阵会增加仅 push 运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵只保留普通测试 / 渠道通道。

最慢的 Node 测试家族会被拆分或平衡，以便每个作业都保持较小规模，同时避免过度占用 runners：渠道契约会作为三个加权分片运行，内置插件测试会在六个扩展 workers 之间平衡分布，小型 core 单元通道会成对组合，auto-reply 会以四个平衡 worker 运行，其中 reply 子树被拆分为 agent-runner、dispatch 和 commands/state-routing 分片，而 agentic Gateway 网关 / 插件配置则会分散到现有的仅源码 agentic Node 作业中，而不是等待构建产物。广义的浏览器、QA、媒体以及杂项插件测试使用它们各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并分配更大的 Node heap，这样导入密集型的插件批次就不会产生额外的 CI 作业。广义的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受导入 / 调度支配，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独占尾部耗时。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和经过过滤的分片。`check-additional` 会把 package-boundary compile/canary 工作保留在一起，并将运行时拓扑架构与 gateway watch 覆盖拆开；boundary guard 分片会在一个作业内部并发运行其小型且相互独立的守卫。Gateway 网关 watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内部并发运行，从而保留它们原有的检查名称，作为轻量级 verifier 作业，同时避免额外占用两个 Blacksmith workers 和第二条 artifact-consumer 队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试通道仍会在启用 SMS/call-log BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为 push 运行已经执行了完整的内置插件分片。这样既能为评审提供已变更插件的快速反馈，又不会在 `main` 上为了 `checks-node-extensions` 已经覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键是带版本号的（`CI-v7-*`），这样 GitHub 侧旧队列组中的僵尸任务就不会无限期阻塞更新的 main 运行。

## Runners

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及其聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早进入排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，因为它对 CPU 仍然足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建，因为 32 vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地变更通道分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/tests
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但带每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI artifact/build-smoke 通道相关时构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢的作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪声并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
