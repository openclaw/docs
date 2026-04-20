---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-20T14:13:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd4ffb6986739ee6f4fca6e8b1f40baee7e47a8387e8d06c722881ebe78b4766
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能作用域判断，在仅有无关区域变更时跳过高开销作业。

## 作业概览

| 作业                      | 用途                                                                                     | 运行时机                 |
| ------------------------ | ---------------------------------------------------------------------------------------- | ------------------------ |
| `preflight`              | 检测是否仅为文档变更、变更的作用域、变更的扩展，并构建 CI 清单                           | 在所有非草稿推送和 PR 中始终运行 |
| `security-fast`          | 私钥检测、通过 `zizmor` 进行工作流审计、生产依赖审计                                     | 在所有非草稿推送和 PR 中始终运行 |
| `build-artifacts`        | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的构建产物                          | 与 Node 相关的变更       |
| `checks-fast-core`       | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                        | 与 Node 相关的变更       |
| `checks-node-extensions` | 针对整个扩展套件运行完整的 bundled-plugin 测试分片                                       | 与 Node 相关的变更       |
| `checks-node-core-test`  | 核心 Node 测试分片，不包括渠道、bundled、contract 和扩展通道                             | 与 Node 相关的变更       |
| `extension-fast`         | 仅针对已变更 bundled 插件的聚焦测试                                                      | 检测到扩展变更时         |
| `check`                  | CI 中的主要本地门禁：`pnpm check`、`pnpm check:test-types` 和 `pnpm build:strict-smoke` | 与 Node 相关的变更       |
| `check-additional`       | 架构、边界、导入环守卫，以及 Gateway 监视回归测试 harness                                | 与 Node 相关的变更       |
| `build-smoke`            | 已构建 CLI 的 smoke 测试以及启动内存 smoke 测试                                          | 与 Node 相关的变更       |
| `checks`                 | 剩余的 Linux Node 通道：渠道测试和仅在推送时运行的 Node 22 兼容性                        | 与 Node 相关的变更       |
| `check-docs`             | 文档格式、lint 和失效链接检查                                                             | 文档发生变更             |
| `skills-python`          | 面向 Python 支持 Skills 的 Ruff + pytest                                                 | 与 Python Skills 相关的变更 |
| `checks-windows`         | Windows 专用测试通道                                                                      | 与 Windows 相关的变更    |
| `macos-node`             | 使用共享构建产物的 macOS TypeScript 测试通道                                             | 与 macOS 相关的变更      |
| `macos-swift`            | macOS 应用的 Swift lint、构建和测试                                                       | 与 macOS 相关的变更      |
| `android`                | Android 构建和测试矩阵                                                                    | 与 Android 相关的变更    |

## 快速失败顺序

作业的排序方式是让低成本检查先失败，再运行高成本作业：

1. `preflight` 决定究竟存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，不是独立作业。
2. `security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
独立的 `install-smoke` 工作流通过其自己的 `preflight` 作业复用同一个作用域脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 仅会在与安装、打包和容器相关的变更时运行。

在推送时，`checks` 矩阵会增加仅在推送时运行的 `compat-node22` 通道。在拉取请求中，该通道会被跳过，矩阵会聚焦于常规测试/渠道通道。

## 运行器

| 运行器                           | 作业                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`、`security-fast`、`build-artifacts`、Linux 检查、文档检查、Python Skills、`android`     |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`、`macos-swift`                                                                          |

## 本地等效命令

```bash
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但带有各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 构建产物 / build-smoke 通道相关时，构建 dist
```
