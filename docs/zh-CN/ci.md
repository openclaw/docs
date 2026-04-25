---
read_when:
    - 你需要了解某个 CI 作业为什么会运行，或者为什么没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-25T05:53:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc363efb98c9f82b585161a017ba1c599344a4e38c3fe683d81b0997d1d2fd4d
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围界定，在仅更改了不相关区域时跳过高成本作业。

QA Lab 在主智能范围工作流之外有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 agentic 包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并且也支持手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业扇出执行。实时作业使用 `qa-live-shared` environment，Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布批准前运行相同的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并后清理重复 PR 的手动工作流。它默认采用 dry-run，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并检查每个重复 PR 是否具有共享的被引用 issue，或存在重叠的变更 hunk。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已落地的变更保持一致。它没有纯定时计划：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，手动触发也可以直接运行它。基于 workflow-run 的调用会在 `main` 已继续前进，或最近一小时内已创建了另一个未被跳过的 Docs Agent 运行时跳过。运行时，它会审查从上一次未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累积的所有 `main` 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 时间内另一个基于 workflow-run 的调用已经运行或正在运行，它就会跳过。手动触发会绕过这一每日活动门控。该通道会构建一份全套件分组的 Vitest 性能报告，让 Codex 只进行小范围且保持覆盖率的测试性能修复，而不是进行大规模重构；然后重新运行全套件报告，并拒绝任何导致通过基线测试数量减少的更改。如果基线中存在失败测试，Codex 只能修复明显的失败，并且在提交任何内容之前，agent 运行后的全套件报告必须通过。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 目的 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅有文档变更、已变更的范围、已变更的扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisories 执行无依赖的生产 lockfile 审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 覆盖整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | 核心 Node 测试分片，不包括渠道、内置插件、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已更改的内置插件运行聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片的主要本地门控等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke 测试 | 与 Node 相关的变更 |
| `checks` | 用于已构建产物渠道测试的验证器，以及仅在 push 上运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和断链检查 | 文档有变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在受信任活动之后，每日执行一次由 Codex 驱动的慢测试优化 | `main` CI 成功后或手动触发 |

## 快速失败顺序

作业的排列顺序经过设计，以便让低成本检查先失败，从而避免高成本作业运行：

1. `preflight` 决定到底有哪些通道会存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行进行，这样下游消费者可以在共享构建准备好后立即启动。
4. 更重的平台和运行时通道会在之后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 运行的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只由对应平台源码变更来决定是否运行。
仅涉及 CI 路由的编辑、部分低成本的核心测试夹具编辑，以及窄范围的插件契约辅助函数/测试路由编辑，会使用一个快速的仅 Node 清单路径：preflight、安全检查，以及一个单独的 `checks-fast-core` 任务。当前变更文件仅限于该快速任务直接覆盖的路由或辅助表面时，此路径会避免构建产物、Node 22 兼容性检查、渠道契约、完整核心分片、内置插件分片，以及额外的守卫矩阵。
Windows Node 检查仅限于 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助函数、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、install-smoke 和仅测试变更会保留在 Linux Node 通道上，这样它们就不会为了正常测试分片已经覆盖的内容而占用一个 16-vCPU 的 Windows worker。
单独的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker/包相关表面、内置插件包/清单变更，以及 Docker smoke 作业所覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面会运行快速路径。仅源码级的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents 删除共享工作区 CLI smoke，运行容器 gateway-network e2e，验证一个内置扩展 build arg，并在总命令超时 240 秒的限制下运行有界的内置插件 Docker 配置文件，同时每个场景的 Docker run 也各自有单独上限。完整路径会保留 QR 包安装以及安装器 Docker/更新覆盖，用于每晚的定时运行、手动触发、workflow-call 发布检查，以及确实触及安装器/包/Docker 表面的拉取请求。推送到 `main`，包括合并提交，不会强制走完整路径；当 changed-scope 逻辑在 push 上会请求完整覆盖时，工作流会保留快速 Docker smoke，并将完整 install smoke 留给每夜运行或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控；它会在每夜计划和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自专用、以安装为重点的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后使用加权调度器和 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 live/E2E smoke 通道；默认主池槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对 provider 敏感的尾池槽位数默认为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm 安装和多服务通道就不会过度占用 Docker，而较轻的通道仍能填满可用槽位。默认情况下，各通道启动会错开 2 秒，以避免本地 Docker 守护进程出现 create storm；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。这个本地聚合器会先对 Docker 做 preflight，移除过期的 OpenClaw E2E 容器，输出活动通道状态，持久化通道耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于检查调度器。默认情况下，它会在首次失败后停止调度新的池化通道；每个通道都有一个 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分 live/tail 通道使用更严格的单通道上限。可复用的 live/E2E 工作流也遵循共享镜像模式：在 Docker 矩阵之前先构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行矩阵。定时的 live/E2E 工作流每天运行一次完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，以便重复的 npm update 和 doctor repair 过程可以与其他内置检查一起分片运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产 typecheck 加核心测试，核心仅测试变更只运行核心测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只运行扩展测试 typecheck/测试。公开的插件 SDK 或插件契约变更会扩展到扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本号提升会运行有针对性的版本/配置/根依赖检查。未知的根目录/配置变更会以安全优先方式退回到所有通道。

在 push 上，`checks` 矩阵会增加一个仅在 push 时运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵会继续聚焦于常规测试/渠道通道。

最慢的 Node 测试家族会被拆分或重新平衡，以便每个作业都保持较小规模，同时不过度预留 runner：渠道契约作为 3 个加权分片运行，内置插件测试会在 6 个扩展 worker 间平衡，小型核心单元通道会成对组合，auto-reply 改为 3 个平衡 worker 而不是 6 个过小 worker，而 agentic Gateway 网关/插件配置会分散到现有的仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用它们专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组只用一个 Vitest worker，并使用更大的 Node 堆，这样以导入为重的插件批次就不会产生额外的 CI 作业。广泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它更受导入/调度主导，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以防共享运行时分片承担拖尾负担。`check-additional` 会将包边界 compile/canary 工作保留在一起，并把运行时拓扑架构与 gateway watch 覆盖分开；边界守卫分片会在一个作业内部并发运行它的小型独立守卫。Gateway 网关 watch、渠道测试和核心 support-boundary 分片会在 `build-artifacts` 内部并发运行，此时 `dist/` 和 `dist-runtime/` 已构建完成；这样既能将它们原有的检查名称保留为轻量验证作业，又能避免额外的两个 Blacksmith worker 和第二条产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；其单元测试通道仍会在启用 SMS/call-log BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的 push 上重复进行一次 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为 push 运行已经执行了完整的内置插件分片。这样既能为代码评审提供已变更插件的快速反馈，又不会在 `main` 上为 `checks-node-extensions` 中已经存在的覆盖而额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` 引用上有新的 push 到来时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用上的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键是带版本的（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及其聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于其节省；install-smoke Docker 构建，其中 32-vCPU 的排队时间成本高于其节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界通道执行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门控，但带每个阶段的耗时统计
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI 产物/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢的作业
node scripts/ci-run-timings.mjs --recent 10   # 对比最近成功的 10 次 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
