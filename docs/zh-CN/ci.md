---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T02:06:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cdc69642539ec9f647f773c83ec17b0683259c6995d2f79794528929a9b65a1
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围划分，在只改动了无关区域时跳过高开销作业。

## 作业概览

| 作业 | 目的 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅为文档变更、已变更范围、已变更扩展，并构建 CI 清单 | 所有非草稿推送和 PR 都会运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 所有非草稿推送和 PR 都会运行 |
| `security-dependency-audit` | 针对 npm 安全通告执行无依赖的生产锁文件审计 | 所有非草稿推送和 PR 都会运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 所有非草稿推送和 PR 都会运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的构建产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如内置 / 插件契约 / 协议检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 覆盖整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | 核心 Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更内置插件的聚焦测试 | 含扩展变更的拉取请求 |
| `check` | 分片后的主本地门控等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 基于已构建 CLI 的 smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 剩余的 Linux Node 通道：渠道测试以及仅在推送时运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和断链检查 | 文档有变更 |
| `skills-python` | 面向 Python 支持 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专属测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个变体的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |

## 快速失败顺序

作业的排序方式是让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定究竟有哪些通道存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行，这样一旦共享构建完成，下游使用方就能立即开始。
4. 之后再扇出更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只根据平台源码变更来决定是否运行。
Windows Node 检查的范围限定在 Windows 专用的进程 / 路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、安装 smoke 以及纯测试变更仍保留在 Linux Node 通道中，这样它们就不会为已由常规测试分片覆盖的内容占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker / 安装 smoke 会在安装、打包、与容器相关的变更、内置扩展生产变更，以及 Docker smoke 作业实际覆盖到的核心插件 / 渠道 / Gateway 网关 / 插件 SDK 表面发生变更时运行。纯测试和纯文档编辑不会占用 Docker workers。它的 QR 包 smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store 缓存，因此仍然能覆盖安装过程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用此前在该作业中构建的运行时镜像，因此无需再增加一次 Docker 构建，就能补充真实的容器到容器 WebSocket 覆盖。另有一个独立的 `docker-e2e-fast` 作业，会在 120 秒命令超时限制下运行有边界的内置插件 Docker 配置：包括 setup-entry 依赖修复以及合成的内置加载器失败隔离。完整的内置更新 / 渠道矩阵仍然保持为手动 / 全量套件，因为它会反复执行真实的 npm update 和 doctor 修复流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产 typecheck 加核心测试，核心纯测试变更只运行核心测试 typecheck / tests，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展纯测试变更只运行扩展测试 typecheck / tests。公共插件 SDK 或插件契约变更会扩大到扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本号提升会运行定向的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式退回到所有通道。

在推送时，`checks` 矩阵会加入仅在推送时运行的 `compat-node22` 通道。在拉取请求中，该通道会被跳过，矩阵会保持聚焦于常规测试 / 渠道通道。

最慢的 Node 测试家族会被拆分或均衡，以保持每个作业都较小：渠道契约将 registry 和核心覆盖拆成总共六个带权分片，内置插件测试会在六个扩展 worker 之间均衡分配，auto-reply 以三个均衡 worker 运行而不是六个很小的 worker，而 agentic Gateway 网关 / 插件配置则分布在现有的仅源码 agentic Node 作业中，而不是等待已构建产物。宽范围的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。宽范围的 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受 import / 调度开销主导，而不是由某一个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独自拖尾。`check-additional` 会把 package-boundary compile / canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界守卫分片会在一个作业内部并发运行其小型独立守卫，而 gateway watch 回归会复用来自 `build-artifacts` 的同次运行构建出的 `dist/` 和 `dist-runtime/` tar 构建产物，因此它测量的是 watch 稳定性，而不是在自己的 worker 中重新构建运行时产物。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方变体没有单独的 source set 或 manifest；它的单元测试通道仍会在启用 SMS / call-log BuildConfig 标志的情况下编译该变体，同时避免在每次与 Android 相关的推送上重复执行一个 debug APK 打包作业。
`extension-fast` 仅用于 PR，因为推送运行已经会执行完整的内置插件分片。这样既能为代码评审提供已变更插件的反馈，又不会在 `main` 上为已由 `checks-node-extensions` 覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将已被替代的作业标记为 `cancelled`。除非同一引用上的最新一次运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞更新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议 / 契约 / 内置检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵就能更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余依赖构建产物的使用方、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 的成本高于节省的收益；install-smoke Docker 构建也是如此，因为 32 vCPU 的排队时间成本高于节省的收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界通道运行变更相关的 typecheck/lint/tests
pnpm check          # 快速本地门控：生产 `tsgo` + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门控，但带有各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # `vitest` 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI 构建产物 / build-smoke 通道相关时，构建 `dist`
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间和最慢的作业
```
