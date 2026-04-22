---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T21:27:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2694946964fdd44e7a22b62214a0c0da41b055a87622bdfad4f1fda5d2ac465a
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围控制，在只有不相关区域发生变更时跳过高成本作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | 检测是否仅有文档变更、变更范围、已变更的扩展，并构建 CI 清单 | 在非草稿推送和 PR 中始终运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计 | 在非草稿推送和 PR 中始终运行 |
| `security-dependency-audit`      | 针对 npm 安全通告执行无依赖的生产锁文件审计 | 在非草稿推送和 PR 中始终运行 |
| `security-fast`                  | 快速安全作业的必需聚合作业 | 在非草稿推送和 PR 中始终运行 |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传供下游作业复用的产物 | 与 Node 相关的变更 |
| `checks-fast-core`               | 快速 Linux 正确性分片，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions`         | 针对整个扩展套件运行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test`          | Core Node 测试分片，不包含渠道、内置、契约和扩展分片 | 与 Node 相关的变更 |
| `extension-fast`                 | 仅针对已变更的内置插件运行聚焦测试 | 检测到扩展变更时 |
| `check`                          | 分片后的主本地门控等效项：生产类型、lint、守卫、测试类型和严格 smoke 检查 | 与 Node 相关的变更 |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke 检查 | 与 Node 相关的变更 |
| `checks`                         | 其余 Linux Node 分片：渠道测试和仅在 push 时运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs`                     | 文档格式、lint 和坏链检查 | 文档有变更时 |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows`                 | Windows 专用测试分片 | 与 Windows 相关的变更 |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试分片 | 与 macOS 相关的变更 |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android`                        | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业按顺序排列，以便低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定哪些分片实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 分片并行运行，这样下游消费者一旦共享构建就绪即可立即开始。
4. 更重的平台和运行时分片随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图和工作流 lint，但不会仅因这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台分片仍然只针对平台源码变更。
Windows Node 检查的范围限定在 Windows 专用的进程/路径包装器、npm/pnpm/UI runner 帮助器、包管理器配置，以及执行该分片的 CI 工作流表面；不相关的源码、插件、install-smoke 和仅测试类变更仍保留在 Linux Node 分片中，这样就不会为已有常规测试分片覆盖的内容占用 16 vCPU 的 Windows worker。
单独的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/install smoke 只会在与安装、打包和容器相关的变更时运行。它的 QR 包 smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此仍然会覆盖安装流程，而不必在每次运行时重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建的运行时镜像，因此在不增加额外 Docker 构建的情况下，加入了真实的容器到容器 WebSocket 覆盖。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比宽泛的 CI 平台范围更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只运行 core 测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只运行扩展测试 typecheck/测试。公共插件 SDK 或 plugin-contract 的变更会扩展到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本号变更会运行有针对性的版本/配置/root dependency 检查。未知的 root/config 变更会以安全优先方式回退到所有分片。

在 push 上，`checks` 矩阵会加入仅在 push 时运行的 `compat-node22` 分片。在拉取请求中，这个分片会被跳过，矩阵会保持聚焦于常规测试/渠道分片。

最慢的 Node 测试家族会被拆分或重新平衡，以确保每个作业都足够小：渠道契约将 registry 和 core 覆盖拆为总计六个加权分片，内置插件测试会在六个扩展 worker 之间做平衡，自动回复以三个平衡 worker 运行而不是六个很小的 worker，而 agentic Gateway 网关/插件配置则分布到现有仅源码的 agentic Node 作业中，而不是等待已构建产物。广泛的浏览器、QA、媒体和杂项插件测试会使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。广泛的 agents 分片使用共享的 Vitest 文件级并行调度器，因为它主要受导入/调度开销主导，而不是由单个慢测试文件决定。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独自承担尾部耗时。`check-additional` 会将 package-boundary 的编译/canary 工作放在一起，并与运行时拓扑、Gateway 网关/架构相关工作分离；边界守卫分片会在一个作业内部并发运行其小型独立守卫，而 gateway watch 回归则使用最小的 `gatewayWatch` 构建配置，而不是重新构建完整的 CI 产物 sidecar 集合。

当同一个 PR 或 `main` 引用上有更新的推送到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键带有版本号（`CI-v6-*`），因此 GitHub 端旧队列组中的僵尸任务不会无限期阻塞更新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、自动响应；`install-smoke` 的 preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵能够更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余依赖已构建产物的消费者、`android` |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 的成本高于节省；`install-smoke` Docker 构建，其中 32 vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界分片运行变更范围内的 typecheck/lint/测试
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门控，并附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链检查
pnpm build          # 当 CI 的 artifact/build-smoke 分片相关时构建 dist
node scripts/ci-run-timings.mjs <run-id>  # 汇总总耗时、排队时间和最慢的作业
```
