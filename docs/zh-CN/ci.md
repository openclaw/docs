---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或不会运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-24T00:54:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43550d4c57343a35eb8b725936a50963cb5886e589eaebcec2168c25ae2891ac
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围划分，在只有不相关区域发生变更时跳过高开销作业。

QA Lab 在主智能范围工作流之外拥有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道拆分为并行作业。实时作业使用 `qa-live-shared` 环境，Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布批准前运行相同的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并后清理重复 PR 的手动工作流。它默认以 dry-run 模式运行，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并检查每个重复 PR 是否具有共享的被引用 issue，或存在重叠的变更代码块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已落地的变更保持一致。它没有纯定时计划：在 `main` 上成功完成的非机器人 push CI 运行可以触发它，也可以通过手动触发直接运行。workflow-run 调用会在 `main` 已继续前进，或最近一小时内已经创建了另一个未被跳过的 Docs Agent 运行时跳过。当它运行时，它会检查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次运行就可以覆盖自上次文档处理以来积累的所有 `main` 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：在 `main` 上成功完成的非机器人 push CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用运行过或正在运行，它就会跳过。手动触发会绕过这个按天的活动门禁。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 仅进行小范围、保留覆盖率的测试性能修复，而不是进行大规模重构，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的变更。如果基线中存在失败测试，Codex 只能修复明显的问题，并且 agent 运行后的完整测试套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会重新变基已验证的补丁，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅有文档变更、变更范围、已变更扩展，并构建 CI 清单 | 始终在非草稿 push 和 PR 上运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 始终在非草稿 push 和 PR 上运行 |
| `security-dependency-audit` | 针对 npm advisories 执行无依赖的生产 lockfile 审计 | 始终在非草稿 push 和 PR 上运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 始终在非草稿 push 和 PR 上运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及供下游复用的构建产物 | Node 相关变更时 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | Node 相关变更时 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | Node 相关变更时 |
| `checks-node-extensions` | 在整个扩展套件上运行完整的 bundled-plugin 测试分片 | Node 相关变更时 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、bundled、contract 和扩展通道 | Node 相关变更时 |
| `extension-fast` | 仅针对已变更 bundled plugins 的聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 主本地门禁的分片等效项：生产类型、lint、guards、测试类型和严格 smoke | Node 相关变更时 |
| `check-additional` | 架构、边界、扩展表面 guards、package-boundary 和 gateway-watch 分片 | Node 相关变更时 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke | Node 相关变更时 |
| `checks` | 已构建产物渠道测试的验证器，以及仅在 push 时运行的 Node 22 兼容性检查 | Node 相关变更时 |
| `check-docs` | 文档格式、lint 和坏链接检查 | 文档发生变更时 |
| `skills-python` | 面向 Python 支持 Skills 的 Ruff + pytest | Python Skills 相关变更时 |
| `checks-windows` | Windows 专用测试通道 | Windows 相关变更时 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | macOS 相关变更时 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | macOS 相关变更时 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | Android 相关变更时 |
| `test-performance-agent` | 在可信活动之后每日运行的 Codex 慢测试优化 | 主 CI 成功后或手动触发 |

## 快速失败顺序

作业的排列顺序经过设计，使便宜的检查会先失败，再决定是否运行昂贵的检查：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不必等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行进行，这样下游使用方可以在共享构建准备好后立即开始。
4. 更重的平台和运行时通道会在之后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 图和工作流 lint，但不会仅因自身变更就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只对对应平台源代码变更生效。
Windows Node 检查的范围仅限于 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源代码、plugin、install-smoke 和仅测试变更仍然保留在 Linux Node 通道中，因此不会为了已由常规测试分片覆盖的内容占用 16-vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker/package 表面、bundled plugin package/manifest 变更，以及 Docker smoke 作业会覆盖到的 core plugin/channel/gateway/插件 SDK 表面，会运行快速路径。仅源码的 bundled plugin 变更、仅测试编辑以及仅文档编辑不会占用 Docker workers。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行容器 gateway-network e2e，验证 bundled extension build arg，并在 120 秒命令超时限制下运行有界的 bundled-plugin Docker profile。完整路径则会为 `main` push、每晚定时运行、手动触发、workflow-call 发布检查，以及真正的 installer/package/Docker 变更保留 QR package 安装和 installer Docker/update 覆盖。较慢的 Bun global install image-provider smoke 由 `run_bun_global_install_smoke` 单独门控；它会在每晚计划和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但拉取请求不会运行它。QR 和 installer Docker 测试保留它们各自专注于安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下并行运行 live/E2E smoke 通道；默认并发数为 4，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整。默认情况下，本地聚合作业会在首次失败后停止调度新的池化通道，并且每个通道都有一个 120 分钟的超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动或 provider 敏感的通道会在并行池之后以独占方式运行。可复用的 live/E2E 工作流也遵循共享镜像模式：它会在 Docker 矩阵之前构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下运行矩阵。定时的 live/E2E 工作流会每天运行完整的发布路径 Docker 套件。完整的 bundled update/channel 矩阵仍然保留为手动/完整套件，因为它会执行重复的真实 npm update 和 doctor 修复流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界上比宽泛的 CI 平台范围更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只会运行 core 测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只会运行扩展测试 typecheck/测试。公开的插件 SDK 或 plugin-contract 变更会扩大到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本提升会运行有针对性的版本/配置/根依赖检查。未知的根目录/配置变更会以安全优先方式落到所有通道。

在 push 上，`checks` 矩阵会添加仅在 push 时运行的 `compat-node22` 通道。在拉取请求上，这个通道会被跳过，矩阵会继续专注于常规测试/渠道通道。

最慢的 Node 测试族会被拆分或平衡处理，以便每个作业都保持较小规模，同时避免过度预留运行器：渠道契约以三个加权分片运行，bundled plugin 测试在六个扩展 worker 间平衡分配，小型 core 单元通道会成对组合，auto-reply 使用三个平衡 worker 而不是六个很小的 worker，agentic gateway/plugin 配置会分散到现有仅源码的 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项 plugin 测试使用各自专用的 Vitest 配置，而不是共享的 plugin 通用兜底配置。扩展分片作业会以串行方式运行 plugin 配置组，使用一个 Vitest worker 和更大的 Node heap，这样导入密集型的 plugin 批次就不会让小型 CI 运行器超额提交。广泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受导入和调度影响，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独自承担长尾。`check-additional` 将 package-boundary 的 compile/canary 工作保留在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；boundary guard 分片会在一个作业内部并发运行其小型独立 guards。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内部并发运行；这样既保留了它们旧有的检查名称作为轻量验证作业，又避免了额外两个 Blacksmith worker 和第二条 artifact-consumer 队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/call-log 的 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关 push 上重复执行 debug APK 打包作业。

`extension-fast` 仅在 PR 上运行，因为 push 运行已经会执行完整的 bundled plugin 分片。这样既能为评审提供已变更 plugin 的反馈，又不会在 `main` 上额外占用一个 Blacksmith worker 去覆盖 `checks-node-extensions` 中已经存在的内容。

当同一个 PR 或 `main` 引用上有更新的 push 落地时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新一次运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键是带版本的（`CI-v7-*`），这样 GitHub 端旧队列组中的 zombie 就不会无限期阻塞较新的 `main` 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及其聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、bundled plugin 测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 带来的成本高于节省；install-smoke Docker 构建也是如此，因为 32 vCPU 的排队时间成本高于它带来的收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更后的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门禁，并带有每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链接
pnpm build          # 当 CI artifact/build-smoke 通道相关时构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢的作业
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```
