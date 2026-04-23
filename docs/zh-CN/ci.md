---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁以及本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T01:39:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: f50aec8600006363b3e84184d6ccafcfdcc2e68c5a078013795336972412b7b4
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围控制，在只更改了不相关区域时跳过高开销作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅有文档更改、已更改的范围、已更改的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 安全通告执行无依赖的生产 lockfile 审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物 | 与 Node 相关的更改 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的更改 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的更改 |
| `checks-node-extensions` | 对整个扩展套件执行完整的内置插件测试分片 | 与 Node 相关的更改 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的更改 |
| `extension-fast` | 仅针对已更改的内置插件执行聚焦测试 | 带有扩展更改的拉取请求 |
| `check` | 分片后的主要本地门禁等价项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的更改 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的更改 |
| `build-smoke` | 已构建 CLI 的 smoke 测试以及启动内存 smoke | 与 Node 相关的更改 |
| `checks` | 剩余的 Linux Node 通道：渠道测试和仅在 push 上运行的 Node 22 兼容性 | 与 Node 相关的更改 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档已更改 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的更改 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的更改 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的更改 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的更改 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的更改 |

## 快速失败顺序

作业按顺序排列，以便让低成本检查先失败，避免高成本作业继续运行：

1. `preflight` 决定实际存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行，这样下游使用方可以在共享构建准备好后立即开始。
4. 更重的平台和运行时通道随后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但它们本身不会强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只对平台源码更改生效。
Windows Node 检查的范围限定在 Windows 专用的进程/路径包装器、npm/pnpm/UI runner 辅助程序、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、plugin、install-smoke 和仅测试更改会保留在 Linux Node 通道上，因此不会为了已由常规测试分片覆盖的内容而占用 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 会在安装、打包、与容器相关的更改、内置扩展生产更改，以及 Docker smoke 作业会覆盖的核心 plugin/channel/Gateway 网关/插件 SDK 表面发生更改时运行。仅测试和仅文档编辑不会占用 Docker worker。它的 QR 包 smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store 缓存，因此仍然会覆盖安装流程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建的运行时镜像，因此能够增加真实的容器到容器 WebSocket 覆盖，而无需再增加一次 Docker 构建。独立的 `docker-e2e-fast` 作业会在 120 秒命令超时限制下运行有界的内置插件 Docker 配置：setup-entry 依赖修复以及合成的 bundled-loader 故障隔离。完整的内置更新/渠道矩阵仍然是手动/全套件，因为它会执行重复的真实 npm update 和 doctor 修复过程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：core 生产更改会运行 core 生产 typecheck 加 core 测试，core 仅测试更改只运行 core 测试 typecheck/测试，扩展生产更改会运行扩展生产 typecheck 加扩展测试，而扩展仅测试更改只运行扩展测试 typecheck/测试。公共插件 SDK 或 plugin-contract 更改会扩展到扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本号提升会运行有针对性的版本/配置/根依赖检查。未知的根目录/配置更改会以安全优先方式落到所有通道。

在 push 上，`checks` 矩阵会增加仅在 push 上运行的 `compat-node22` 通道。在拉取请求中，该通道会被跳过，矩阵将聚焦于常规测试/渠道通道。

最慢的 Node 测试族已被拆分或平衡，以便每个作业都保持较小：渠道契约将 registry 和 core 覆盖拆分为总共六个加权分片，内置插件测试在六个扩展 worker 之间平衡，自动回复以三个平衡 worker 运行而不是六个很小的 worker，agentic gateway/plugin 配置分布在现有的仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。广泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它受导入/调度主导，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片承担尾部耗时。`check-additional` 将包边界编译/canary 工作保留在一起，并将其与运行时拓扑 gateway/架构工作分离；边界守卫分片会在一个作业中并发运行其体量较小且相互独立的守卫，而 gateway watch 回归则使用最小的 `gatewayWatch` 构建配置，而不是重建完整的 CI 产物 sidecar 集合。
Android CI 会运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或清单；它的单元测试通道仍然会使用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上都重复执行一个 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为 push 运行已经会执行完整的内置插件分片。这样既能为代码审查提供已更改插件的反馈，又不会在 `main` 上为已由 `checks-node-extensions` 覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` 引用上有新的 push 到来时，GitHub 可能会将被新运行取代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则请将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被更新运行取代后继续排队。
CI 并发键带有版本号（`CI-v6-*`），这样 GitHub 侧旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余使用构建产物的消费者、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省的收益；install-smoke Docker 构建，在那里 32 vCPU 的排队时间成本高于节省的收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等价项

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但带有每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 的 artifact/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间和最慢的作业
```
