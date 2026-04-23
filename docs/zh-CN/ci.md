---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T13:33:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 730bba64e0867f41b47e4896f8255b6d23e6530bb91d349abb25b35a43152e9e
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能作用域划分，在只改动无关区域时跳过高开销作业。

QA Lab 在主智能作用域工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业展开。实时作业使用 `qa-live-shared` environment，Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布批准前运行相同的 QA Lab 通道。

## 作业概览

| 作业 | 目的 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅有文档变更、变更的作用域、变更的扩展，并构建 CI 清单 | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast` | 通过 `zizmor` 检测私钥和审计工作流 | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit` | 针对 npm advisory 执行无依赖的生产 lockfile 审计 | 始终在非草稿推送和 PR 上运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 始终在非草稿推送和 PR 上运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、内置产物检查，以及可供下游复用的产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包含渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更内置插件的聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主本地门禁等效项：生产类型、lint、防护、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面防护、包边界，以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 已构建产物渠道测试的校验器，以及仅在 push 时运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式化、lint 和失效链接检查 | 文档有变更时 |
| `skills-python` | 针对 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |

## 快速失败顺序

作业按顺序排列，以便让便宜的检查先失败，再运行昂贵的检查：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行，这样下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图和工作流 lint，但不会仅因这些改动就强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍只针对平台源码变更生效。
Windows Node 检查的作用域限定在 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、install-smoke 和仅测试变更仍保留在 Linux Node 通道中，这样就不会为了正常测试分片已经覆盖的内容而占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个作用域脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 会在安装、打包、与容器相关的变更、内置扩展生产变更，以及 Docker smoke 作业所覆盖的 core plugin/channel/Gateway 网关/Plugin SDK 表面变更时运行。仅测试和仅文档编辑不会占用 Docker worker。它的 QR 包 smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store cache，因此仍然会验证安装流程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面已构建的运行时镜像，因此在不增加另一轮 Docker 构建的情况下，增加了真实的容器到容器 WebSocket 覆盖。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，以及一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下并行运行 live/E2E smoke 通道；默认并发数为 4，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整。对启动或 provider 敏感的通道会在并行池之后独占运行。可复用的 live/E2E 工作流也遵循共享镜像模式：在 Docker 矩阵之前先构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后在矩阵中以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。QR 和安装器 Docker 测试保留各自以安装为重点的 Dockerfile。另有一个单独的 `docker-e2e-fast` 作业，会在 120 秒命令超时下运行受限的内置插件 Docker 配置：setup-entry 依赖修复，以及 synthetic bundled-loader 故障隔离。完整的 bundled update/channel 矩阵仍然是手动/完整套件，因为它会反复执行真实的 npm update 和 doctor 修复流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台作用域更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只会运行 core 测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只会运行扩展测试 typecheck/测试。公开的 Plugin SDK 或 plugin-contract 变更会扩大到扩展验证，因为扩展依赖这些 core 契约。仅有发布元数据的版本号变更会运行有针对性的版本/配置/root 依赖检查。未知的 root/配置变更会以安全优先方式落到所有通道。

在 push 上，`checks` 矩阵会增加仅 push 运行的 `compat-node22` 通道。在拉取请求中，该通道会被跳过，矩阵则保持聚焦于常规测试/渠道通道。

最慢的 Node 测试族已被拆分或平衡，以保持每个作业都足够小：渠道契约把 registry 和 core 覆盖拆成总共六个带权重的分片，内置插件测试在六个扩展 worker 之间平衡，自动回复以三个平衡 worker 运行而不是六个很小的 worker，而 agentic Gateway 网关/plugin 配置会分散到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。宽泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。宽泛的智能体通道使用共享的 Vitest 文件级并行调度器，因为它受导入/调度主导，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独自承担尾部耗时。`check-additional` 将 package-boundary compile/canary 工作放在一起，并把运行时拓扑架构与 gateway watch 覆盖分开；边界防护分片会在单个作业内部并发运行其小型独立防护。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内部并发运行；这样既保留了它们原有的检查名称作为轻量校验作业，又避免了额外两个 Blacksmith worker 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会带着 SMS/通话日志 BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行一个 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为 push 运行已经会执行完整的内置插件分片。这样可以为代码审查提供已变更插件的反馈，同时不会在 `main` 上为 `checks-node-extensions` 已经覆盖的内容额外占用一个 Blacksmith worker。

当同一 PR 或 `main` ref 上有更新的 push 到来时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则请将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键已版本化为 `CI-v7-*`，这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 以外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合校验器、文档检查、Python Skills、workflow-sanity、labeler、自动响应；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 的敏感度仍然高到使用 8 vCPU 反而得不偿失；`install-smoke` 的 Docker 构建，在这里 32 vCPU 的排队时间成本高于其收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速防护
pnpm check:test-types
pnpm check:timed    # 与上述相同的门禁，但包含各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 失效链接检查
pnpm build          # 当 CI 产物/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间和最慢的作业
```
