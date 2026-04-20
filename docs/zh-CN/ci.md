---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-20T19:19:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2145c62257d4c2584677b97943304c9c76cfd5d77de29508e39931258cc71e89
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围判定，在只有不相关区域发生变更时跳过高开销作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | 检测是否仅有文档变更、变更范围、变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit`      | 针对 npm 安全公告执行无需安装依赖的生产锁文件审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast`                  | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传可供下游作业复用的构建产物 | 与 Node 相关的变更 |
| `checks-fast-core`               | 快速 Linux 正确性分支，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions`         | 针对整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test`          | Core Node 测试分片，不包含渠道、内置、契约和扩展分支 | 与 Node 相关的变更 |
| `extension-fast`                 | 仅针对发生变更的内置插件执行聚焦测试 | 检测到扩展变更时 |
| `check`                          | 分片后的主本地门控等效项：生产类型、lint、guard、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional`               | 架构、边界、扩展表面 guard、包边界以及 Gateway 监视分片 | 与 Node 相关的变更 |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks`                         | 剩余的 Linux Node 分支：渠道测试以及仅在推送时运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs`                     | 文档格式化、lint 和失效链接检查 | 文档发生变更 |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows`                 | Windows 专用测试分支 | 与 Windows 相关的变更 |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试分支 | 与 macOS 相关的变更 |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android`                        | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业的排序方式是让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定哪些分支实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 分支并行运行，这样下游消费者可以在共享构建就绪后立刻开始。
4. 之后再扇出更重的平台和运行时分支：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
单独的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 只会在与安装、打包和容器相关的变更时运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比 CI 的宽泛平台范围更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试；仅 core 测试变更只会运行 core 测试 typecheck/测试；扩展生产变更会运行扩展生产 typecheck 加扩展测试；仅扩展测试变更只会运行扩展测试 typecheck/测试。公开的 Plugin SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些核心契约。未知的根目录/配置变更会以安全优先的方式退回到所有分支。

在推送时，`checks` 矩阵会增加仅在推送时运行的 `compat-node22` 分支。在拉取请求中，这个分支会被跳过，矩阵会专注于常规测试/渠道分支。

最慢的 Node 测试家族会被拆分成 include-file 分片，以便每个作业都保持较小规模：渠道契约将 registry 和 core 覆盖各自拆分成八个负载均衡的分片，auto-reply reply command 测试拆分成四个 include-pattern 分片，其他大型 auto-reply reply prefix 分组则各自拆分成两个分片。`check-additional` 还会把 package-boundary compile/canary 工作与运行时拓扑 Gateway/架构工作分开。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`、`security-scm-fast`、`security-dependency-audit`、`security-fast`、`build-artifacts`、Linux 检查、文档检查、Python Skills、`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows` |
| `macos-latest`                   | `macos-node`、`macos-swift` |

## 本地等效命令

```bash
pnpm changed:lanes   # 查看 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界分支运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速 guard
pnpm check:test-types
pnpm check:timed    # 相同的门控，但附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm check:docs     # 文档格式化 + lint + 失效链接检查
pnpm build          # 当 CI 的 artifact/build-smoke 分支相关时，构建 dist
```
