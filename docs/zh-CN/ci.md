---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T14:54:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9a03440ae28a15167fc08d9c66bb1fd719ddfa1517aaecb119c80f2ad826c0d
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域划分，在仅有无关区域发生变更时跳过高开销作业。

QA Lab 在主智能作用域工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上按夜间计划运行，也可手动触发；它会将模拟一致性门禁、实时 Matrix 通道和实时 Telegram 通道并行展开为多个作业。实时作业使用 `qa-live-shared` environment，Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布审批前运行同样的 QA Lab 通道。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅有文档变更、已变更作用域、已变更扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无依赖的生产 lockfile 审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并带有稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更的内置插件进行聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke 测试 | 与 Node 相关的变更 |
| `checks` | 针对已构建产物渠道测试的验证器，以及仅在 push 时运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式化、lint 和失效链接检查 | 文档发生变更 |
| `skills-python` | 面向 Python 支持 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |

## 快速失败顺序

作业按顺序排列，以便廉价检查先失败，再运行高开销作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行，这样下游使用方可以在共享构建准备好后立即开始。
4. 之后会展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因自身变更而强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对平台源码变更触发。
Windows Node 检查的作用域限定在 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、install-smoke 和仅测试类变更仍会留在 Linux Node 通道中，从而避免为已由常规测试分片覆盖的内容占用 16 vCPU 的 Windows runner。
独立的 `install-smoke` 工作流通过其自己的 `preflight` 作业复用同一份作用域脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 会在安装、打包、与容器相关的变更、内置扩展生产代码变更，以及 Docker smoke 作业会覆盖到的 core plugin/channel/Gateway 网关/插件 SDK 表面变更时运行。仅测试和仅文档编辑不会占用 Docker worker。其 QR 包 smoke 会强制重新运行 Docker `pnpm install` 层，同时保留 BuildKit pnpm store 缓存，因此仍能执行安装验证，而不必在每次运行时重新下载依赖。其 gateway-network e2e 会复用该作业前面已构建好的运行时镜像，因此可以增加真实的容器到容器 WebSocket 覆盖，而无需再增加一次 Docker 构建。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 并行运行 live/E2E smoke 通道；默认并发数为 4，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整。本地聚合作业默认会在首次失败后停止调度新的池化通道，并且每个通道都有 120 分钟超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动或 provider 敏感的通道会在并行池之后以独占方式运行。可复用的 live/E2E 工作流也遵循共享镜像模式：先在 Docker 矩阵之前构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行矩阵。计划执行的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。QR 和安装器 Docker 测试保留各自以安装为重点的 Dockerfile。另有一个独立的 `docker-e2e-fast` 作业会在 120 秒命令超时内运行受限的内置插件 Docker 配置：setup-entry 依赖修复加上合成的 bundled-loader 失败隔离。完整的内置更新/渠道矩阵仍然保留为手动/完整套件，因为它会重复执行真实的 npm 更新和 doctor 修复过程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比 CI 的宽泛平台作用域更严格：core 生产代码变更会运行 core 生产类型检查加 core 测试，core 仅测试类变更只运行 core 测试类型检查/测试，扩展生产代码变更会运行扩展生产类型检查加扩展测试，而扩展仅测试类变更只运行扩展测试类型检查/测试。公共插件 SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本提升会运行有针对性的版本/配置/根依赖检查。未知的根目录/配置变更会以安全优先方式退回到所有通道。

在 push 上，`checks` 矩阵会增加仅在 push 时运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵会专注于常规测试/渠道通道。

最慢的 Node 测试族会被拆分或平衡，以便每个作业都保持较小规模，同时不过度预留 runner：渠道契约以三个加权分片运行，内置插件测试会在六个扩展 worker 之间平衡分配，小型 core 单元通道会成对组合，自动回复会以三个平衡 worker 运行，而不是六个很小的 worker，智能体 Gateway 网关/插件配置会分散到现有仅源码的智能体 Node 作业中，而不是等待构建产物。广义浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。广义智能体通道使用共享的 Vitest 文件级并行调度器，因为它的瓶颈在于导入/调度，而不是某个单独的慢测试文件。`runtime-config` 会与 infra core-runtime 分片一起运行，以避免共享运行时分片独自承担尾部耗时。`check-additional` 会将 package-boundary 的编译/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界守卫分片会在一个作业内并发运行其规模较小、彼此独立的守卫。Gateway 网关 watch、渠道测试和 core support-boundary 分片会在 `build-artifacts` 中于 `dist/` 和 `dist-runtime/` 已构建完成后并发运行，保留它们原有的检查名称作为轻量验证作业，同时避免额外占用两个 Blacksmith worker 和第二条产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行一个 debug APK 打包作业。
`extension-fast` 仅用于 PR，因为 push 运行已经会执行完整的内置插件分片。这样可以在代码评审期间为已变更插件提供反馈，同时避免在 `main` 上为 `checks-node-extensions` 已经覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` ref 上有较新的 push 到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被更新运行替代后继续排队。
CI 并发键已做版本化处理（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及其聚合作业、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然足够依赖 CPU，以至于 8 vCPU 带来的成本高于节省；install-smoke Docker 构建也是如此，因为 32 vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 查看 origin/main...HEAD 的本地 changed-lane 分类结果
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的类型检查/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 同一套门禁，但附带每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 失效链接检查
pnpm build          # 当 CI 产物/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢的作业
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
```
