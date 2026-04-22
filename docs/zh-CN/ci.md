---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T13:55:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a5b4da72c831d6fc643bf171fde9f3a83304f581a9d444fef372d04be996f1d
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围控制，在只改动了无关区域时跳过高开销作业。

## 作业概览

| 作业                              | 用途                                                                                      | 运行时机                          |
| -------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | 检测是否仅有文档改动、改动范围、改动的扩展，并构建 CI 清单                               | 所有非草稿推送和 PR 都会运行      |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                   | 所有非草稿推送和 PR 都会运行      |
| `security-dependency-audit`      | 针对 npm 安全公告执行不依赖安装的生产锁文件审计                                          | 所有非草稿推送和 PR 都会运行      |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                               | 所有非草稿推送和 PR 都会运行      |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传可供下游作业复用的产物                            | 与 Node 相关的改动                |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置插件 / 插件契约 / 协议检查                                | 与 Node 相关的改动                |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                             | 与 Node 相关的改动                |
| `checks-node-extensions`         | 针对整个扩展套件执行完整的内置插件测试分片                                               | 与 Node 相关的改动                |
| `checks-node-core-test`          | Core Node 测试分片，不包含渠道、内置插件、契约和扩展通道                                 | 与 Node 相关的改动                |
| `extension-fast`                 | 仅针对发生改动的内置插件执行聚焦测试                                                     | 检测到扩展改动时                  |
| `check`                          | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke                      | 与 Node 相关的改动                |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界，以及 Gateway 网关 watch 分片                            | 与 Node 相关的改动                |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                 | 与 Node 相关的改动                |
| `checks`                         | 剩余的 Linux Node 通道：渠道测试，以及仅在 push 时运行的 Node 22 兼容性检查               | 与 Node 相关的改动                |
| `check-docs`                     | 文档格式化、lint 和失效链接检查                                                           | 文档发生改动时                    |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                             | 与 Python Skills 相关的改动       |
| `checks-windows`                 | Windows 特定测试通道                                                                      | 与 Windows 相关的改动             |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                             | 与 macOS 相关的改动               |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                       | 与 macOS 相关的改动               |
| `android`                        | Android 构建和测试矩阵                                                                    | 与 Android 相关的改动             |

## 快速失败顺序

作业按顺序排列，以便让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，这样下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。  
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker / 安装 smoke 只会在安装、打包和容器相关改动时运行。

本地的 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：core 生产改动会运行 core 生产 typecheck 加 core 测试，core 仅测试改动只运行 core 测试 typecheck / tests，扩展生产改动会运行扩展生产 typecheck 加扩展测试，而扩展仅测试改动只运行扩展测试 typecheck / tests。公共 Plugin SDK 或插件契约的改动会扩展到扩展验证，因为扩展依赖这些 core 契约。仅包含发布元数据的版本升级会运行定向的版本 / 配置 / 根依赖检查。未知的根目录 / 配置改动会以安全方式退回到所有通道。

在 push 上，`checks` 矩阵会添加仅在 push 时运行的 `compat-node22` 通道。在拉取请求中，该通道会被跳过，矩阵保持聚焦于常规测试 / 渠道通道。

最慢的 Node 测试家族会拆分为 include-file 分片，以保证每个作业都足够小：渠道契约将 registry 和 core 覆盖各自拆成八个按权重分配的分片，auto-reply reply command 测试拆成四个 include-pattern 分片，其他大型 auto-reply reply prefix 组则各拆成两个分片。`check-additional` 也会将 package-boundary compile / canary 工作与 runtime topology Gateway 网关 / 架构工作分开。

当同一个 PR 或 `main` 引用上有较新的推送到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用上的最新一次运行也失败，否则应将其视为 CI 噪声。聚合分片检查会明确指出这种取消情况，以便更容易与测试失败区分。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、聚合验证作业（`security-fast`、`check`、`check-additional`、`checks-node-core`、`checks-node-extensions`、`checks-fast-contracts-channels`）；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `security-scm-fast`、`security-dependency-audit`、`build-artifacts`、Linux 检查、文档检查、Python Skills、`android`                                                                                                                                                    |
| `blacksmith-8vcpu-windows-2025`  | `checks-windows`                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                    |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行改动相关的 typecheck/lint/tests
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 与上述门禁相同，但带每个阶段的耗时统计
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档 format + lint + 失效链接检查
pnpm build          # 当 CI 的 artifact/build-smoke 通道相关时，构建 dist
```
