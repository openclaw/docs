---
read_when:
    - 你需要了解某个 CI 作业为什么运行了，或者为什么没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T16:27:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: e815d95ff3a5b4cabea76f9f5799e6240c86cc63a653d212b043c21f0d6644bf
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围判定，在仅有不相关区域发生变更时跳过高开销作业。

## 作业概览

| 作业                              | 用途                                                                                  | 运行时机                       |
| --------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------ |
| `preflight`                      | 检测是否仅有文档变更、变更范围、变更的扩展，并构建 CI 清单                            | 所有非草稿推送和 PR 都会运行   |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                | 所有非草稿推送和 PR 都会运行   |
| `security-dependency-audit`      | 针对 npm 安全通告执行无需安装依赖的生产锁文件审计                                     | 所有非草稿推送和 PR 都会运行   |
| `security-fast`                  | 快速安全作业所需的聚合作业                                                            | 所有非草稿推送和 PR 都会运行   |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的制品                           | 与 Node 相关的变更            |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                     | 与 Node 相关的变更            |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                          | 与 Node 相关的变更            |
| `checks-node-extensions`         | 覆盖整个扩展套件的完整内置插件测试分片                                                | 与 Node 相关的变更            |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置项、契约和扩展通道                                | 与 Node 相关的变更            |
| `extension-fast`                 | 仅针对已变更内置插件的聚焦测试                                                        | 检测到扩展变更时              |
| `check`                          | 分片后的主本地门控等效项：生产类型、lint、守卫、测试类型和严格 smoke                  | 与 Node 相关的变更            |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片                               | 与 Node 相关的变更            |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke 测试                                         | 与 Node 相关的变更            |
| `checks`                         | 剩余的 Linux Node 通道：渠道测试以及仅在 push 时运行的 Node 22 兼容性检查             | 与 Node 相关的变更            |
| `check-docs`                     | 文档格式、lint 和断链检查                                                              | 文档发生变更时                |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                            | 与 Python Skills 相关的变更   |
| `checks-windows`                 | Windows 专用测试通道                                                                   | 与 Windows 相关的变更         |
| `macos-node`                     | 使用共享构建制品的 macOS TypeScript 测试通道                                          | 与 macOS 相关的变更           |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                    | 与 macOS 相关的变更           |
| `android`                        | Android 构建与测试矩阵                                                                 | 与 Android 相关的变更         |

## 快速失败顺序

作业的排序方式是：让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不必等待更重的制品和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游使用方可以在共享构建准备好后立刻开始。
4. 之后再展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。  
单独的 `install-smoke` 工作流通过自己的 `preflight` 作业复用同一个范围脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 仅会在与安装、打包和容器相关的变更中运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门控相比广义的 CI 平台范围更严格地检查架构边界：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只会运行 core 测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只会运行扩展测试 typecheck/测试。公共 Plugin SDK 或 plugin-contract 的变更会扩展到扩展验证，因为扩展依赖这些 core 契约。仅有发布元数据的版本号变更会运行定向的版本/配置/root 依赖检查。未知的 root/配置变更会以安全优先方式触发所有通道。

在 push 时，`checks` 矩阵会增加仅在 push 时运行的 `compat-node22` 通道。在拉取请求中，该通道会被跳过，矩阵将专注于常规测试/渠道通道。

最慢的 Node 测试族会被拆分或均衡，以便每个作业都保持较小规模：渠道契约将 registry 和 core 覆盖各自拆成八个加权分片，auto-reply reply command 测试拆成四个 include-pattern 分片，其他大型 auto-reply reply prefix 分组各拆成两个分片，而 agentic gateway/plugin configs 会分布到现有的仅源码 agentic Node 作业中，而不是等待构建制品。`check-additional` 还会把 package-boundary 的 compile/canary 工作与运行时拓扑 gateway/架构工作分离开来。

当同一个 PR 或 `main` 引用上有更新的推送到来时，GitHub 可能会将已被取代的作业标记为 `cancelled`。除非同一引用的最新运行也在失败，否则这应被视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个工作流已经被更新运行取代后不会继续排队。  
CI 并发键已做版本化处理（`CI-v2-*`），因此 GitHub 端旧队列组中的僵尸任务不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、分片的渠道契约检查、简短的聚合校验作业（`check`、`check-additional`、`checks-fast-contracts-channels`）、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管 Ubuntu，以便 Blacksmith 矩阵更早进入排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、除 `check-lint` 和渠道契约之外的 Linux 检查、长矩阵聚合校验作业、文档检查、Python Skills、`android`                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然足够依赖 CPU，以至于 8 vCPU 的成本高于其带来的收益                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                          |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界通道运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门控，但带各阶段耗时统计
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI 的 artifact/build-smoke 通道相关时，构建 dist
```
