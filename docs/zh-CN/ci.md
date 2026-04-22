---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或为什么没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-22T17:22:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8a41e29b4b656aef96947510e00ced6bf59860c9baa2afad1d71fb253eafb1
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围控制，在仅修改了无关区域时跳过高开销作业。

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | 检测是否仅有文档变更、变更范围、变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit`      | 针对 npm 漏洞通告执行不依赖安装的生产锁文件审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast`                  | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts`                | 构建 `dist/` 和 Control UI 一次，并上传可供下游作业复用的产物 | 与 Node 相关的变更 |
| `checks-fast-core`               | 快速 Linux 正确性任务，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions`         | 针对整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test`          | Core Node 测试分片，不含渠道、内置、契约和扩展任务 | 与 Node 相关的变更 |
| `extension-fast`                 | 仅针对已变更内置插件的聚焦测试 | 检测到扩展变更时 |
| `check`                          | 分片的主本地门控等价项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks`                         | 剩余的 Linux Node 任务：渠道测试和仅在推送时运行的 Node 22 兼容性 | 与 Node 相关的变更 |
| `check-docs`                     | 文档格式化、lint 和失效链接检查 | 文档发生变更时 |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows`                 | Windows 专用测试任务 | 与 Windows 相关的变更 |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试任务 | 与 macOS 相关的变更 |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android`                        | Android 构建和测试矩阵 | 与 Android 相关的变更 |

## 快速失败顺序

作业的排序方式是让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定哪些任务实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 任务并行执行，这样下游消费者可以在共享构建准备好后立即开始。
4. 随后再扇出更重的平台和运行时任务：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 的原生构建；这些平台任务仍然仅由平台源代码变更触发。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 只会在安装、打包和容器相关的变更时运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门控比宽泛的 CI 平台范围在架构边界上更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试；仅 core 测试变更只运行 core 测试 typecheck/测试；扩展生产变更会运行扩展生产 typecheck 加扩展测试；仅扩展测试变更只运行扩展测试 typecheck/测试。公共 Plugin SDK 或 plugin-contract 的变更会扩展到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本号变更会运行有针对性的版本/配置/根依赖检查。未知的根目录/配置变更会以安全优先方式退回到所有任务。

在 push 上，`checks` 矩阵会增加一个仅在 push 时运行的 `compat-node22` 任务。在拉取请求中，这个任务会被跳过，矩阵仅关注常规测试/渠道任务。

最慢的 Node 测试族已被拆分或做了均衡，以便每个作业都保持较小：渠道契约把 registry 和 core 覆盖拆成各自八个加权分片；auto-reply reply 测试按前缀组拆分；而 agentic gateway/plugin 配置分布到现有仅源码的 agentic Node 作业中，而不是等待构建产物。`check-additional` 会把 package-boundary 的编译/canary 工作放在一起，并把它与运行时拓扑的 gateway/architecture 工作分离；边界守卫分片会在一个作业内并发运行其小型独立守卫，而 gateway watch 回归使用最小的 `gatewayWatch` 构建配置，而不是重新构建完整的 CI 产物 sidecar 集合。

当同一个 PR 或 `main` 引用上有更新的 push 到达时，GitHub 可能会将已被替代的作业标记为 `cancelled`。除非同一引用的最新一次运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代之后继续排队。
CI 并发键带有版本号（`CI-v2-*`），因此 GitHub 侧旧队列组中的僵尸任务不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 以外的 `check` 分片、`check-additional` 分片及其聚合、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、其余构建产物消费者、`android` |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍然足够敏感，以至于使用 8 vCPU 的成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等价命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界任务运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 同一门控，但附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 失效链接检查
pnpm build          # 当 CI 产物/build-smoke 任务相关时，构建 dist
```
