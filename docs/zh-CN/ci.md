---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、作用域门禁，以及本地命令对应项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T21:01:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba5e620ed273ff8532186081c7876590a816e31d8e27571a2871f1de48436bfe
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域划分，在仅有不相关区域发生变更时跳过高开销作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | 检测是否仅有文档变更、变更的作用域、变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit`      | 针对 npm 安全通告执行无依赖的生产 lockfile 审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast`                  | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物 | 与 Node 相关的变更 |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions`         | 针对整个扩展套件运行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast`                 | 仅针对已变更内置插件的定向测试 | 检测到扩展变更时 |
| `check`                          | 分片后的主本地门禁等价项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke 测试 | 与 Node 相关的变更 |
| `checks`                         | 剩余的 Linux Node 通道：渠道测试以及仅在推送时运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs`                     | 文档格式、lint 和失效链接检查 | 文档发生变更时 |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows`                 | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node`                     | 使用共享已构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android`                        | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业按顺序排列，以便廉价检查先失败，再决定是否运行高开销作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，这样下游使用方可以在共享构建准备好后立即开始。
4. 之后再展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
对 CI 工作流的编辑会校验 Node CI 作业图以及工作流 lint，但不会仅因这些编辑就强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只根据平台源码变更来决定是否运行。
Windows Node 检查的作用域限定在 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、plugin、install-smoke 和仅测试变更仍然保留在 Linux Node 通道中，这样它们就不会为了已经由常规测试分片覆盖的内容而占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过其自己的 `preflight` 作业复用同一个作用域脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 仅在安装、打包和与容器相关的变更时运行。它的 QR 包 smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit pnpm store 缓存，因此它仍能验证安装过程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建的运行时镜像，因此它能增加真实的容器到容器 WebSocket 覆盖，而无需再增加一次 Docker 构建。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁相比宽泛的 CI 平台作用域，对架构边界更加严格：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只运行 core 测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只运行扩展测试 typecheck/测试。公共 Plugin SDK 或 plugin-contract 变更会扩大到扩展校验，因为扩展依赖这些 core 契约。仅发布元数据的版本提升会运行定向的版本/配置/根依赖检查。未知的根目录/配置变更会安全地回退到所有通道。

在推送时，`checks` 矩阵会增加仅在推送时运行的 `compat-node22` 通道。在拉取请求中，该通道会被跳过，矩阵保持聚焦于常规测试/渠道通道。

最慢的 Node 测试家族已经拆分或均衡，以便每个作业都保持较小规模：渠道契约将 registry 和 core 覆盖各自拆成八个加权分片，内置插件测试在六个扩展 worker 之间均衡分配，自动回复以三个均衡 worker 运行而不是六个很小的 worker，而 agentic gateway/plugin 配置则分散到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。`check-additional` 将包边界编译/canary 工作放在一起，并将其与运行时拓扑 gateway/架构工作分开；边界守卫分片会在一个作业内并发运行其小型独立守卫，而 gateway watch 回归则使用最小化的 `gatewayWatch` 构建配置，而不是重建完整的 CI 产物 sidecar 集合。

当同一 PR 或 `main` ref 上有较新的推送到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被新的运行取代后继续排队。
CI 并发键已进行版本化（`CI-v6-*`），因此 GitHub 端旧队列组中的僵尸任务无法无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合校验器、文档检查、Python Skills、workflow-sanity、labeler、自动响应；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早进入排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置 plugin 测试分片、其余已构建产物使用方、`android` |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；`install-smoke` Docker 构建，在这里 32 vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地对应项

```bash
pnpm changed:lanes   # 检查 `origin/main...HEAD` 的本地变更通道分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 `tsgo` + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同的门禁，但带有每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI artifact/build-smoke 通道相关时，构建 dist
```
