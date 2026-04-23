---
read_when:
    - 你需要了解某个 CI 作业为什么运行或为什么没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T14:40:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9ab8559ab9ac781ae87f94374840a21a0c588e7cd289c6bb8a8cd07e8df6083
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围判定，在仅有不相关区域发生变更时跳过高开销作业。

QA Lab 在主智能范围工作流之外有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 智能体式打包。`QA-Lab - All Lanes` 工作流会在 `main` 上按夜间计划运行，也可手动触发；它会并行展开模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道。实时作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布批准前运行相同的 QA Lab 通道。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅有文档变更、变更范围、已变更扩展，并构建 CI 清单 | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无依赖的生产锁文件审计 | 始终在非草稿推送和 PR 上运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 始终在非草稿推送和 PR 上运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建产物检查以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，带有稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对扩展套件运行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更内置插件的聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 Gateway 网关 watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 已构建产物渠道测试的验证器，加上仅在推送时运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档有变更 |
| `skills-python` | 针对 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享已构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两种 flavor 的 Android 单元测试，加上一个 debug APK 构建 | 与 Android 相关的变更 |

## 快速失败顺序

作业按顺序排列，以便让低成本检查先失败，避免高成本作业继续运行：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不需要等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行，这样下游消费者可以在共享构建就绪后尽快启动。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对对应平台源码变更进行范围判定。
Windows Node 检查的范围仅限于 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、插件、install-smoke 和仅测试类变更仍然留在 Linux Node 通道上，这样它们就不会为了已由常规测试分片覆盖的内容去占用一个 16-vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 会在安装、打包、与容器相关的变更、内置扩展生产变更，以及 Docker smoke 作业所覆盖的 core plugin/channel/Gateway 网关/插件 SDK 表面发生变更时运行。仅测试和仅文档编辑不会占用 Docker worker。它的 QR 包 smoke 会强制重新运行 Docker `pnpm install` 层，同时保留 BuildKit pnpm store 缓存，因此仍可验证安装过程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建的运行时镜像，因此在不增加额外 Docker 构建的情况下，增加了真实的容器到容器 WebSocket 覆盖。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后以并行方式运行 live/E2E smoke 通道，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`；可用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认并发数 4。本地聚合作业默认会在第一次失败后停止调度新的池化通道，并且每个通道都有一个 120 分钟的超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动或 provider 敏感的通道会在并行池之后以独占方式运行。可复用的 live/E2E 工作流也遵循共享镜像模式：在 Docker 矩阵之前先构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行矩阵。按计划运行的 live/E2E 工作流会每天运行完整的发布路径 Docker 套件。QR 和安装器 Docker 测试保留各自面向安装场景的 Dockerfile。另有一个独立的 `docker-e2e-fast` 作业，会在 120 秒命令超时下运行受限的内置插件 Docker 配置：包括 setup-entry 依赖修复以及合成的 bundled-loader 故障隔离。完整的内置更新/渠道矩阵仍然是手动/全套件，因为它会重复执行真实的 npm update 和 doctor 修复流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界上比广义的 CI 平台范围更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试类变更只运行 core 测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，扩展仅测试类变更只运行扩展测试 typecheck/测试。公开的 插件 SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些 core 契约。仅含发布元数据的版本变更会运行针对性的版本/配置/root-dependency 检查。未知的根目录/配置变更会以保守方式落到所有通道。

在推送时，`checks` 矩阵会额外加入仅推送时运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵保持聚焦于常规测试/渠道通道。

最慢的 Node 测试家族会被拆分或均衡，以确保每个作业保持较小规模，而不会过度占用运行器：渠道契约会作为 3 个加权分片运行，内置插件测试会在 6 个扩展 worker 之间均衡分配，小型 core 单元通道会成对组合，自动回复会以 3 个均衡 worker 而不是 6 个微小 worker 运行，智能体式 Gateway 网关/插件配置会分散到现有的仅源码智能体式 Node 作业中，而不是等待已构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。广泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它受导入/调度支配，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独自承担末尾长尾。`check-additional` 会将包边界 compile/canary 工作保持在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分开；边界守卫分片会在单个作业内部并发运行其小型独立守卫。Gateway 网关 watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内部并发运行，保留它们原有的检查名称作为轻量级验证器作业，同时避免额外两个 Blacksmith worker 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试通道仍会在启用 SMS/通话日志 BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的推送上重复执行 debug APK 打包作业。
`extension-fast` 仅限 PR，因为推送运行已经会执行完整的内置插件分片。这样可以为评审提供已变更插件的反馈，同时避免在 `main` 上为 `checks-node-extensions` 已覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则请将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被更新运行取代后继续排队。
CI 并发键已进行版本化（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合作业、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、自动响应；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵更早进入排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 的敏感度仍然足够高，以至于 8 vCPU 节省下来的成本还不如额外消耗的时间；install-smoke Docker 构建也是如此，在那里 32-vCPU 的排队时间成本高于它带来的收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更后的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 与上述相同的门禁，但带有每个阶段的耗时统计
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 产物/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间以及最慢的作业
```
