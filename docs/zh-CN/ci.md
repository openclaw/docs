---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及对应的本地命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T19:15:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8a64acddb097a2d4b7fbba5c79c1fdf1ad3dd67d37bdd623ece82fc5e6fda670
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每次拉取请求时运行。它使用智能范围控制，在仅有不相关区域发生变更时跳过高开销作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight` | 检测仅文档变更、变更范围、变更的扩展插件，并构建 CI 清单 | 在非草稿状态的推送和 PR 中始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在非草稿状态的推送和 PR 中始终运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无依赖的生产锁文件审计 | 在非草稿状态的推送和 PR 中始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在非草稿状态的推送和 PR 中始终运行 |
| `build-artifacts` | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展插件套件的完整 bundled-plugin 测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不含渠道、bundled、contract 和扩展插件通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对发生变更的 bundled 插件运行聚焦测试 | 检测到扩展插件变更时 |
| `check` | 分片后的主本地门禁等价项：生产类型、lint、guard、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展插件表面 guard、package-boundary 和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 基于已构建 CLI 的 smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 剩余的 Linux Node 通道：渠道测试以及仅在 push 时运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和断链检查 | 文档发生变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业按顺序排列，以便廉价检查先失败，再决定是否运行高开销作业：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，这样下游消费者可以在共享构建准备好后立即开始。
4. 之后再扇出更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。  
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只对平台源代码变更生效。  
Windows Node 检查的范围仅限于 Windows 特定的进程/路径包装器、npm/pnpm/UI runner 辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、插件、install-smoke 和仅测试变更仍保留在 Linux Node 通道中，这样就不会为了已由常规测试分片覆盖的内容占用一个 16 vCPU 的 Windows worker。  
单独的 `install-smoke` 工作流通过其自己的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 只会在安装、打包和容器相关变更时运行。它的 QR package smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此仍能覆盖安装流程，而不需要在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建好的运行时镜像，因此在不增加额外 Docker 构建的情况下，增加了真实的容器到容器 WebSocket 覆盖。

本地的 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。与宽泛的 CI 平台范围相比，这个本地门禁在架构边界上更严格：core 生产代码变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只运行 core 测试 typecheck/测试，扩展插件生产代码变更会运行扩展插件生产 typecheck 加扩展插件测试，而扩展插件仅测试变更只运行扩展插件测试 typecheck/测试。公共 Plugin SDK 或 plugin-contract 变更会扩展到扩展插件验证，因为扩展插件依赖这些 core 契约。仅发布元数据的版本号变更会运行定向的 version/config/root-dependency 检查。未知的根目录/配置变更会安全地退回到所有通道。

在 push 上，`checks` 矩阵会添加仅在 push 时运行的 `compat-node22` 通道。在拉取请求中，该通道会被跳过，矩阵只聚焦于常规测试/渠道通道。

最慢的 Node 测试家族会被拆分或均衡，以便每个作业都保持较小规模：渠道契约会把 registry 和 core 覆盖分别拆成八个加权分片，auto-reply reply 测试按前缀组拆分，而 agentic Gateway 网关/plugin 配置会分散到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。`check-additional` 会把 package-boundary compile/canary 工作聚合在一起，并将其与运行时拓扑 Gateway 网关/架构工作分开；boundary guard 分片会在一个作业内并发运行其小型独立 guard，而 gateway watch 回归则使用最小化的 `gatewayWatch` 构建配置，而不是重新构建整套 CI 产物 sidecar。

当同一个 PR 或 `main` 引用上有更新的 push 到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用上的最新一次运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，这样它们仍会正常报告分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键是带版本的（`CI-v3-*`），这样 GitHub 侧旧队列组中的僵尸任务就无法无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、bundled plugin 测试分片、其余基于构建产物的消费者、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于收益；以及 install-smoke Docker 构建，在这里 32 vCPU 的排队时间成本高于收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 对应的本地命令

```bash
pnpm changed:lanes   # 查看 `origin/main...HEAD` 的本地变更通道分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 `tsgo` + 分片 lint + 并行快速 guard
pnpm check:test-types
pnpm check:timed    # 与上述门禁相同，但包含各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # `vitest` 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI 产物 / build-smoke 通道相关时，构建 `dist`
```
