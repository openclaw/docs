---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地命令对应项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T14:54:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b119ade4cd0f7459ac38dda0eaff949585b803ce573a54b9a62b8638b5fbdf98
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域划分，在仅有无关区域发生变更时跳过高成本作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | 检测是否仅有文档变更、变更的作用域、变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit`      | 针对 npm 通告执行无需依赖安装的生产 lockfile 审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast`                  | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传可供下游作业复用的构建产物 | 与 Node 相关的变更 |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions`         | 针对整个扩展套件运行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast`                 | 仅针对发生变更的内置插件运行聚焦测试 | 检测到扩展变更时 |
| `check`                          | 分片后的主要本地门禁对应项：生产类型、lint、守卫、测试类型以及严格 smoke 测试 | 与 Node 相关的变更 |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke 测试 | 与 Node 相关的变更 |
| `checks`                         | 其余 Linux Node 通道：渠道测试，以及仅在 push 上运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs`                     | 文档格式、lint 和失效链接检查 | 文档发生变更 |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows`                 | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android`                        | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业的排序经过设计，使得低成本检查会在高成本作业启动前先失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游使用方可以在共享构建就绪后尽快启动。
4. 更重的平台和运行时通道会在之后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
独立的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个作用域脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 仅会在与安装、打包和容器相关的变更时运行。

本地的 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台作用域更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试；仅 core 测试变更只运行 core 测试 typecheck/测试；扩展生产变更会运行扩展生产 typecheck 加扩展测试；仅扩展测试变更只运行扩展测试 typecheck/测试。公共 Plugin SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本号变更会运行有针对性的版本/配置/root 依赖检查。未知的 root/配置变更会采用安全优先策略，落到所有通道。

在 push 上，`checks` 矩阵会添加仅在 push 上运行的 `compat-node22` 通道。在拉取请求上，这个通道会被跳过，矩阵会继续聚焦于常规测试/渠道通道。

最慢的 Node 测试族被拆分为 include-file 分片，以便每个作业都保持较小规模：渠道契约将 registry 和 core 覆盖各自拆成八个带权重的分片，auto-reply reply command 测试拆成四个 include-pattern 分片，其他大型 auto-reply reply prefix 组则各自拆成两个分片。`check-additional` 也会把 package-boundary compile/canary 工作，与 runtime topology gateway/architecture 工作分开。

当同一个 PR 或 `main` 引用上有新的推送到来时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用的最新一次运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被更新提交取代后继续排队。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、简短的聚合验证作业（`security-fast`、`check`、`check-additional`、`checks-fast-contracts-channels`）、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `security-scm-fast`、`security-dependency-audit`、`build-artifacts`、除 `check-lint` 外的 Linux 检查、长矩阵聚合验证作业、文档检查、Python Skills、`android` |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest`  | `macos-node`，在 `openclaw/openclaw` 上使用；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `macos-swift`，在 `openclaw/openclaw` 上使用；fork 会回退到 `macos-latest` |

## 本地对应项

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 构建产物 / build-smoke 通道相关时，构建 dist
```
