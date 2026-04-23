---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T02:17:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5ba3c27be0b27e90ab490170be2570ab746f3c4805cf08726fe501300887e4d
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围判定，在只改动了不相关区域时跳过高开销作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅有文档改动、变更范围、发生变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无依赖的生产 lockfile 审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、Gateway 网关 watch，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性分片，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 覆盖整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展分片 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对发生变更的内置插件运行聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主本地门控等价项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界，以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 剩余的 Linux Node 分片：渠道测试，以及仅在 push 上运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs` | 文档格式化、lint 和坏链检查 | 文档发生变更 |
| `skills-python` | 针对 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试分片 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试分片 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |

## 快速失败顺序

作业按顺序排列，以便在高开销作业运行前先让低成本检查失败：

1. `preflight` 决定哪些分片实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 分片并行，这样下游消费者可以在共享构建完成后立刻开始。
4. 更重的平台和运行时分片会在此之后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。  
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台分片仍然只针对平台源代码变更。  
Windows Node 检查的范围限定在 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该分片的 CI 工作流表面；不相关的源代码、插件、install-smoke 和仅测试改动会继续留在 Linux Node 分片中，这样就不会为已由常规测试分片覆盖的内容占用一个 16 vCPU 的 Windows worker。  
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 会针对安装、打包、容器相关变更、内置扩展生产代码变更，以及 Docker smoke 作业所覆盖的 core plugin/channel/gateway/插件 SDK 表面运行。仅测试和仅文档的编辑不会占用 Docker worker。它的 QR 包 smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store 缓存，因此仍能覆盖安装流程，而不会在每次运行时都重新下载依赖。它的 gateway-network e2e 会复用该作业前面已构建的运行时镜像，因此在不增加额外 Docker 构建的情况下，增加了真实的容器到容器 WebSocket 覆盖。独立的 `docker-e2e-fast` 作业会在 120 秒命令超时限制下运行有界的内置插件 Docker 配置：setup-entry 依赖修复加上合成的 bundled-loader 故障隔离。完整的内置更新/渠道矩阵仍然保留为手动/完整套件，因为它会重复执行真实的 npm update 和 doctor 修复流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界上比宽泛的 CI 平台范围更严格：core 生产代码变更会运行 core 生产类型检查加 core 测试，core 仅测试变更只运行 core 测试类型检查/测试，扩展生产代码变更会运行扩展生产类型检查加扩展测试，而扩展仅测试变更只运行扩展测试类型检查/测试。公共插件 SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本号变更会运行定向的版本/配置/root 依赖检查。未知的根目录/配置变更会以安全优先的方式回退到所有分片。

在 push 上，`checks` 矩阵会添加仅 push 的 `compat-node22` 分片。在拉取请求上，该分片会被跳过，矩阵会保持聚焦于常规测试/渠道分片。

最慢的 Node 测试族已被拆分或平衡，以便每个作业都保持较小：渠道契约将 registry 和 core 覆盖拆成总共六个带权分片，内置插件测试在六个扩展 worker 之间做平衡，自动回复以三个平衡 worker 运行，而不是六个很小的 worker，agentic gateway/plugin 配置则分布到现有的仅源代码 agentic Node 作业中，而不是等待构建产物。宽泛的浏览器、QA、媒体和杂项插件测试使用它们专用的 Vitest 配置，而不是共享的插件兜底配置。宽泛的 agents 分片使用共享的 Vitest 文件并行调度器，因为它主要受 import/调度影响，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独占尾部时间。`check-additional` 将包边界 compile/canary 工作放在一起，同时把运行时拓扑架构与 gateway watch 覆盖拆开；边界守卫分片会在一个作业内并发运行其小型独立守卫，而 gateway watch 回归则在 `build-artifacts` 中、于 `dist/` 和 `dist-runtime/` 已构建完成之后运行，这样它就能在不额外占用 runner 或重新构建运行时产物的前提下衡量 watch 稳定性。  
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有独立的 source set 或 manifest；它的单元测试分片仍会使用 SMS/通话记录 BuildConfig 标志来编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。  
`extension-fast` 仅在 PR 上运行，因为 push 已经会执行完整的内置插件分片。这样可以为代码评审提供已变更插件的反馈，同时避免在 `main` 上为 `checks-node-extensions` 已覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` 引用上有更新的 push 到来时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。  
CI 并发键是带版本的（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸任务不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余构建产物消费者、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；`install-smoke` 的 Docker 构建，其中 32 vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等价项

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界分片运行变更类型检查/lint/测试
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门控，但带有各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 坏链检查
pnpm build          # 当 CI 产物/build-smoke 分片相关时构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间和最慢作业
```
