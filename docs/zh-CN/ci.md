---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T20:07:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: d619a217c6352919defa20206eacef48fa19926c9f1b912f07896ab6b7041526
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域划分，在仅有不相关区域变更时跳过开销较大的作业。

## 作业概览

| 作业                              | 用途                                                                                      | 运行时机                        |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | 检测是否仅文档变更、变更的作用域、变更的扩展，并构建 CI 清单      | 所有非草稿推送和 PR 都会运行  |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 所有非草稿推送和 PR 都会运行  |
| `security-dependency-audit`      | 针对 npm 安全通告执行无需依赖安装的生产锁文件审计                             | 所有非草稿推送和 PR 都会运行  |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                | 所有非草稿推送和 PR 都会运行  |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物         | 与 Node 相关的变更               |
| `checks-fast-core`               | 快速 Linux 正确性分线，例如内置 / 插件契约 / 协议检查                 | 与 Node 相关的变更               |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                         | 与 Node 相关的变更               |
| `checks-node-extensions`         | 针对整个扩展套件执行完整的内置插件测试分片                                   | 与 Node 相关的变更               |
| `checks-node-core-test`          | Core Node 测试分片，不包含渠道、内置、契约和扩展分线             | 与 Node 相关的变更               |
| `extension-fast`                 | 仅针对已变更的内置插件执行聚焦测试                                           | 检测到扩展变更时 |
| `check`                          | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke   | 与 Node 相关的变更               |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更               |
| `build-smoke`                    | 基于已构建 CLI 的 smoke 测试和启动内存 smoke                                               | 与 Node 相关的变更               |
| `checks`                         | 剩余的 Linux Node 分线：渠道测试以及仅在推送时运行的 Node 22 兼容性检查                | 与 Node 相关的变更               |
| `check-docs`                     | 文档格式化、lint 和失效链接检查                                                | 文档发生变更                        |
| `skills-python`                  | 针对 Python 支持的 Skills 执行 Ruff + pytest                                                       | 与 Python Skills 相关的变更       |
| `checks-windows`                 | Windows 专用测试分线                                                                  | 与 Windows 相关的变更            |
| `macos-node`                     | 使用共享已构建产物的 macOS TypeScript 测试分线                                  | 与 macOS 相关的变更              |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | 与 macOS 相关的变更              |
| `android`                        | Android 构建和测试矩阵                                                                | 与 Android 相关的变更            |

## 快速失败顺序

作业按顺序排列，以便低成本检查能在高成本作业运行前先失败：

1. `preflight` 决定究竟存在哪些分线。`docs-scope` 和 `changed-scope` 逻辑是该作业内的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物构建和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 分线并行运行，这样下游消费者可以在共享构建准备好后立即开始。
4. 随后再展开较重的平台和运行时分线：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台分线仍然只对平台源码变更生效。
Windows Node 检查的作用域仅限于 Windows 专用的进程 / 路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该分线的 CI 工作流表面；不相关的源码、插件、安装 smoke 和纯测试变更仍然保留在 Linux Node 分线中，因此不会为了已由常规测试分片覆盖的内容占用一个 16 vCPU 的 Windows worker。
单独的 `install-smoke` 工作流也通过其自身的 `preflight` 作业复用同一个作用域脚本。它基于更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker / 安装 smoke 仅会在安装、打包和容器相关变更时运行。它的二维码包 smoke 会强制 Docker 的 `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此仍能验证安装过程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面已构建的运行时镜像，因此在不额外增加一次 Docker 构建的前提下，加入了真实的容器到容器 WebSocket 覆盖。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台作用域更严格：core 生产变更会运行 core 生产类型检查加 core 测试，core 仅测试变更只运行 core 测试类型检查 / 测试，扩展生产变更会运行扩展生产类型检查加扩展测试，而扩展仅测试变更只运行扩展测试类型检查 / 测试。公共插件 SDK 或插件契约变更会扩大到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本提升会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式回退到所有分线。

在推送时，`checks` 矩阵会增加仅在推送时运行的 `compat-node22` 分线。在拉取请求中，该分线会被跳过，矩阵会聚焦于常规测试 / 渠道分线。

最慢的 Node 测试家族会被拆分或平衡，以使每个作业都保持较小：渠道契约将 registry 和 core 覆盖各自拆分成八个按权重分配的分片，内置插件测试在六个扩展 worker 之间做负载均衡，自动回复以三个平衡 worker 运行，而不是六个很小的 worker，agentic gateway / 插件配置则分布在现有的仅源码 agentic Node 作业中，而不是等待已构建产物。`check-additional` 将包边界 compile/canary 工作集中在一起，并将其与运行时拓扑 gateway / 架构工作分开；边界守卫分片会在一个作业内并发运行其较小且独立的守卫，而 gateway watch 回归则使用最小化的 `gatewayWatch` 构建配置，而不是重新构建整套 CI 产物 sidecar 集合。

当同一个 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个工作流已被更新运行替代后不会继续排队。
CI 并发键已版本化为 `CI-v5-*`，因此 GitHub 端旧队列组中的僵尸任务无法无限期阻塞较新的 `main` 运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议 / 契约 / 内置检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合作业、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、自动响应；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余已构建产物消费者、`android`                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍足够敏感，以至于 8 vCPU 的成本高于节省；`install-smoke` 的 Docker 构建也是如此，因为 32 vCPU 的排队时间成本高于节省                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界分线运行变更相关的类型检查 / lint / 测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但带有每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 失效链接检查
pnpm build          # 当 CI 产物 / build-smoke 分线相关时，构建 dist
```
