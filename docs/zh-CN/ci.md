---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地命令对应项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-20T16:32:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bb1eafb1f53a57f6bf5351d6f45be4f9759dcf6c61e87050a430455fdd0c4b0
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围判定，在只更改了无关区域时跳过高开销作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight` | 检测是否仅有文档变更、变更范围、已变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 私钥检测、通过 `zizmor` 进行工作流审计、生产依赖审计 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的制品 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性分片，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 对整个扩展套件执行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展分片 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更内置插件的聚焦测试 | 检测到扩展变更时 |
| `check` | 分片后的主本地门禁对应项：生产类型、lint、守卫、测试类型和严格冒烟测试 | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界，以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 剩余的 Linux Node 分片：渠道测试以及仅在 push 上运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs` | 文档格式化、lint 和失效链接检查 | 文档有变更时 |
| `skills-python` | 针对 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试分片 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建制品的 macOS TypeScript 测试分片 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业的排序方式是让便宜的检查先失败，再决定是否运行高开销作业：

1. `preflight` 决定哪些分片实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不需要等待更重的制品和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 分片并行，这样下游消费者可以在共享构建准备好后立即开始。
4. 然后再展开更重的平台和运行时分片：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。  
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装冒烟测试只会在与安装、打包和容器相关的变更时运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比 CI 的广义平台范围更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试；仅 core 测试变更只会运行 core 测试 typecheck/测试；扩展生产变更会运行扩展生产 typecheck 加扩展测试；仅扩展测试变更只会运行扩展测试 typecheck/测试。公共 Plugin SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些 core 契约。未知的根目录/配置变更会采取保守策略，落到所有分片。

在 push 上，`checks` 矩阵会增加仅在 push 上运行的 `compat-node22` 分片。在拉取请求上，这个分片会被跳过，矩阵只聚焦于常规测试/渠道分片。

最慢的 Node 测试族被拆分为 include-file 分片，以便每个作业都保持较小：渠道契约把 registry/core/extension 覆盖拆成聚焦分片，而 auto-reply reply 测试则把每个大型前缀组拆成两个 include-pattern 分片。`check-additional` 还会把 package-boundary 的 compile/canary 工作与 runtime topology gateway/architecture 工作分开。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404` | `preflight`、`security-fast`、`build-artifacts`、Linux 检查、文档检查、Python Skills、`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows` |
| `macos-latest` | `macos-node`、`macos-swift` |

## 本地对应命令

```bash
pnpm changed:lanes   # 查看本地针对 origin/main...HEAD 的 changed-lane 分类结果
pnpm check:changed   # 智能本地门禁：按边界分片运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 同一套门禁，但带每个阶段的耗时统计
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm check:docs     # 文档格式化 + lint + 失效链接检查
pnpm build          # 当 CI 的 artifact/build-smoke 分片相关时，构建 dist
```
