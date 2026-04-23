---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T00:59:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d19801199a102291045bf2b2f7d9a66495c23785a1e89a953af8969e52fc0cb
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围判定，在仅有不相关区域发生变更时跳过昂贵作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅文档变更、变更范围、变更的内置插件，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 执行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无需依赖安装的生产 lockfile 审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的制品 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性作业，例如内置 / plugin-contract / protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对扩展套件执行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | 核心 Node 测试分片，不含渠道、内置、契约和扩展作业 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更内置插件的聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主要本地门控等效项：生产类型、lint、守卫、测试类型和严格冒烟测试 | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界，以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 剩余的 Linux Node 作业：渠道测试，以及仅推送时运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生变更 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试作业 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建制品的 macOS TypeScript 测试作业 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业按顺序排列，以便廉价检查先失败，再运行昂贵作业：

1. `preflight` 决定哪些作业根本会存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的制品和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 作业并行运行，这样下游使用方可以在共享构建就绪后立即开始。
4. 之后，更重的平台和运行时作业会展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图和工作流 lint，但不会仅因这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台作业仍然只针对平台源码变更。
Windows Node 检查的范围限定在 Windows 专用的进程 / 路径包装器、npm / pnpm / UI 运行器辅助工具、包管理器配置，以及执行该作业的 CI 工作流表面；不相关的源码、插件、install-smoke 和纯测试变更仍然保留在 Linux Node 作业中，因此不会为了已经由常规测试分片覆盖的内容而占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个范围脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker / install smoke 会在安装、打包、与容器相关的变更、内置扩展生产代码变更，以及 Docker smoke 作业所覆盖的核心插件 / 渠道 / Gateway 网关 / 插件 SDK 表面变更时运行。纯测试和纯文档编辑不会占用 Docker workers。它的 QR 包冒烟测试会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store 缓存，因此仍能覆盖安装流程，而不会在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建好的运行时镜像，因此增加了真实的容器到容器 WebSocket 覆盖，而无需再增加一次 Docker 构建。另有一个独立的 `docker-e2e-fast` 作业，会在 120 秒命令超时下运行受限的内置插件 Docker 配置：setup-entry 依赖修复加上合成的 bundled-loader 故障隔离。完整的内置更新 / 渠道矩阵仍保留为手动 / 完整套件，因为它会重复执行真实的 npm update 和 doctor 修复流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界上比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产 typecheck 加核心测试，核心纯测试变更只运行核心测试 typecheck / tests，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展纯测试变更只运行扩展测试 typecheck / tests。公共插件 SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本提升会运行定向的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式退回到所有作业。

在推送时，`checks` 矩阵会添加仅推送时运行的 `compat-node22` 作业。在拉取请求中，该作业会被跳过，矩阵会专注于常规测试 / 渠道作业。

最慢的 Node 测试族已被拆分或平衡，以便每个作业都保持较小：渠道契约把 registry 和 core 覆盖拆成总计六个加权分片，内置插件测试在六个扩展 workers 间平衡分布，自动回复以三个平衡 workers 运行而不是六个很小的 workers，而 agentic Gateway 网关 / 插件配置则分布在现有仅源码的 agentic Node 作业中，而不是等待构建制品。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。广泛的 agents 作业使用共享的 Vitest 文件并行调度器，因为它受 import / 调度影响更大，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片单独承担长尾。`check-additional` 会把包边界 compile / canary 工作放在一起，并将其与运行时拓扑 Gateway 网关 / 架构工作分离；边界守卫分片会在一个作业内部并发运行其小型独立守卫，而 gateway watch 回归则使用最小的 `gatewayWatch` 构建配置，而不是重新构建整套 CI 制品 sidecar。
`extension-fast` 仅限 PR，因为推送运行已经会执行完整的内置插件分片。这样能为代码评审保留已变更插件的反馈，同时避免在 `main` 上为已经由 `checks-node-extensions` 覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键是带版本的（`CI-v6-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol / contract / 内置检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合、Node 测试聚合校验器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余使用构建制品的消费者、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 仍足够敏感，以至于 8 vCPU 的成本高于节省；`install-smoke` Docker 构建，在这里 32 vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界作业执行变更范围内的 typecheck / lint / tests
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同的门控，但带有每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接检查
pnpm build          # 当 CI 制品 / build-smoke 作业相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队耗时和最慢的作业
```
