---
read_when:
    - 你需要了解某个 CI 作业为什么会运行，或者为什么没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T16:20:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: f98b197d68ed7991ca42b062026dc49d478b3d809c4660db7c698a587ee42523
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围判定，在仅修改了不相关区域时跳过昂贵的作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight` | 检测是否仅有文档变更、已变更范围、已变更的内置插件，并构建 CI 清单 | 在所有非草稿推送和拉取请求中始终运行 |
| `security-scm-fast` | 通过 `zizmor` 检测私钥并审计工作流 | 在所有非草稿推送和拉取请求中始终运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无依赖的生产 lockfile 审计 | 在所有非草稿推送和拉取请求中始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿推送和拉取请求中始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传可供下游作业复用的制品 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性分支，例如内置 / 插件契约 / 协议检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并带有稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展套件执行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包含渠道、内置、契约和扩展分支 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更的内置插件执行聚焦测试 | 检测到扩展变更时 |
| `check` | 分片的主要本地门控等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界，以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 剩余的 Linux Node 分支：渠道测试和仅在推送时运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs` | 文档格式化、lint 和失效链接检查 | 文档发生变更 |
| `skills-python` | 针对 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试分支 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建制品的 macOS TypeScript 测试分支 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业按顺序排列，以便让廉价检查先失败，避免昂贵作业继续运行：

1. `preflight` 决定究竟存在哪些分支。`docs-scope` 和 `changed-scope` 逻辑是此作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的制品和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 分支并行运行，这样下游消费者就能在共享构建就绪后立即开始。
4. 更重的平台和运行时分支随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。  
单独的 `install-smoke` 工作流通过其自己的 `preflight` 作业复用同一份范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker / 安装 smoke 仅会在安装、打包和容器相关变更时运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门控比广义的 CI 平台范围更严格地约束架构边界：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只运行 core 测试 typecheck / tests，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只运行扩展测试 typecheck / tests。公共插件 SDK 或插件契约变更会扩展到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本号变更会运行定向的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式触发所有分支。

在推送时，`checks` 矩阵会添加仅在推送时运行的 `compat-node22` 分支。在拉取请求中，该分支会被跳过，矩阵将专注于常规的测试 / 渠道分支。

最慢的 Node 测试族已被拆分或平衡，以便每个作业保持较小规模：渠道契约将 registry 和 core 覆盖拆分为各八个加权分片，auto-reply reply command 测试拆分为四个 include-pattern 分片，其他大型 auto-reply reply prefix 组各拆分为两个分片，而 agentic gateway 配置则分散到现有的 agentic Node 作业中，而不是作为单个串行尾部运行。`check-additional` 还将 package-boundary compile / canary 工作与运行时拓扑 gateway / architecture 工作分离开来。

当同一 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，这样它们仍会报告正常的分片失败，但不会在整个工作流已经被取代后继续排队。  
CI 并发键已版本化（`CI-v2-*`），因此 GitHub 侧旧队列组中的僵尸任务不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、短聚合验证作业（`security-fast`、`check`、`check-additional`、`checks-fast-contracts-channels`）、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `security-scm-fast`、`security-dependency-audit`、`build-artifacts`、除 `check-lint` 之外的 Linux 检查、长矩阵聚合验证器、文档检查、Python Skills、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，因为它对 CPU 仍足够敏感，以至于 8 vCPU 的成本高于其节省的时间 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界分支运行变更后的 typecheck/lint/tests
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门控，但带每个阶段的耗时统计
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 失效链接检查
pnpm build          # 当 CI 制品 / build-smoke 分支相关时，构建 dist
```
