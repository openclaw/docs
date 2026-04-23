---
read_when:
    - 你需要了解某个 CI 作业为什么运行了，或者为什么没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、作用域门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T02:26:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 57d0979f7b6667b023b1ee4887003a8408cd0028a856abc02eb3ad684e9a8235
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域控制，在只有不相关区域发生变更时跳过高开销作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅有文档变更、变更的作用域、变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 执行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 公告执行无依赖的生产 lockfile 审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、内置产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性作业，例如内置 / 插件契约 / 协议检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展套件运行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包含渠道、内置、契约和扩展作业 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对发生变更的内置插件执行聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主要本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 内置 CLI smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 用于内置产物渠道测试的校验器，以及仅在 push 上运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和坏链检查 | 文档发生变更 |
| `skills-python` | 针对 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试作业 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享内置产物的 macOS TypeScript 测试作业 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建 | 与 Android 相关的变更 |

## 快速失败顺序

作业按顺序排列，这样廉价检查会先失败，避免高开销作业继续运行：

1. `preflight` 决定哪些作业实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 作业并行，以便下游消费者在共享构建完成后立即开始。
4. 之后会展开更重的平台和运行时作业：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 运行的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
CI 工作流编辑会验证 Node CI 作业图和工作流 lint，但不会仅因这些改动就强制运行 Windows、Android 或 macOS 原生构建；这些平台作业仍然只根据平台源码变更来决定是否运行。
Windows Node 检查的作用域限定在 Windows 特定的进程 / 路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该作业的 CI 工作流表面；不相关的源码、插件、安装 smoke 和仅测试变更仍然留在 Linux Node 作业中，因此不会为了已由常规测试分片覆盖的内容占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个作用域脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker / 安装 smoke 会在安装、打包、与容器相关的变更、内置扩展生产变更，以及 Docker smoke 作业所覆盖的 core 插件 / 渠道 / Gateway 网关 / 插件 SDK 表面变更时运行。仅测试和仅文档编辑不会占用 Docker worker。它的 QR 包 smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store 缓存，因此仍能覆盖安装流程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建好的运行时镜像，因此在不新增另一次 Docker 构建的前提下，增加了真实的容器到容器 WebSocket 覆盖。独立的 `docker-e2e-fast` 作业会在 120 秒命令超时下运行有界的内置插件 Docker 配置：setup-entry 依赖修复以及合成的内置加载器失败隔离。完整的内置更新 / 渠道矩阵仍然保留为手动 / 全套件运行，因为它会重复执行真实的 npm update 和 doctor 修复过程。

本地变更作业逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界上的要求比宽泛的 CI 平台作用域更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只会运行 core 测试 typecheck / 测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，扩展仅测试变更只会运行扩展测试 typecheck / 测试。公开的插件 SDK 或插件契约变更会扩展到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本号变更会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先的方式回退到所有作业。

在 push 上，`checks` 矩阵会加入仅在 push 上运行的 `compat-node22` 作业。在拉取请求上，该作业会被跳过，矩阵会继续聚焦于常规测试 / 渠道作业。

最慢的 Node 测试族会被拆分或平衡，以保持每个作业都足够小：渠道契约将 registry 和 core 覆盖拆分为总共六个带权重的分片，内置插件测试会在六个扩展 worker 之间做负载平衡，auto-reply 以三个平衡 worker 运行，而不是六个很小的 worker，agentic Gateway 网关 / 插件配置则会分布到现有的仅源码 agentic Node 作业中，而不是等待内置产物。广泛的浏览器、QA、媒体和杂项插件测试使用它们专用的 Vitest 配置，而不是共享的插件兜底配置。广泛的 agents 作业使用共享的 Vitest 文件级并行调度器，因为它主要受 import / 调度影响，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片单独承担长尾。`check-additional` 会把包边界 compile / canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖拆开；边界守卫分片会在一个作业内并发运行其较小且相互独立的守卫。Gateway 网关 watch、渠道测试以及 core support-boundary 分片会在 `build-artifacts` 中于 `dist/` 和 `dist-runtime/` 构建完成后并发运行，在保留其旧检查名作为轻量校验作业的同时，避免再占用两个额外的 Blacksmith worker 和第二条产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有独立的源码集或 manifest；它的单元测试作业仍然会在启用 SMS / 通话记录 BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行一个 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为 push 已经会执行完整的内置插件分片。这样既能为代码评审提供已变更插件的反馈，又不会在 `main` 上为已经被 `checks-node-extensions` 覆盖的内容额外占用一个 Blacksmith worker。

当同一 PR 或 `main` 引用上有新的 push 到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新一次运行也失败了，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 侧旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议 / 契约 / 内置检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及其聚合作业、Node 测试聚合校验器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早进入排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 的敏感度仍然足够高，以至于 8 vCPU 的成本高于它节省的收益；`install-smoke` Docker 构建，在这里 32 vCPU 的排队时间成本高于它节省的收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 查看 origin/main...HEAD 的本地变更作业分类器
pnpm check:changed   # 智能本地门禁：按边界作业运行变更的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但带有各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链检查
pnpm build          # 当 CI 的产物 / build-smoke 作业相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间和最慢的作业
```
