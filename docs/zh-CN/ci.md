---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或为什么没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-25T00:40:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03105fd06cf6a913ef0fb8cbe84c64ed89edbc09652f347b4508552a2f33bb71
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围控制，当只有不相关区域发生变更时，会跳过开销较大的作业。

QA Lab 在主智能范围工作流之外还有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更以及手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 智能体 pack。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业展开。实时作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex leases。`OpenClaw Release Checks` 也会在发布审批前运行相同的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复 PR 清理。它默认以 dry-run 模式运行，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并确认每个重复 PR 都具有共享的引用 issue，或有重叠的变更 hunk。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已落地的变更保持一致。它没有纯定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，手动触发也可以直接运行它。工作流运行触发的调用会在 `main` 已继续前进，或过去一小时内已经创建了另一个未跳过的 Docs Agent 运行时跳过。当它运行时，它会审查从上一次未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累积的所有 `main` 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用运行过或正在运行，它就会跳过。手动触发会绕过这个按日活动门禁。该通道会构建一个完整测试套件的分组 Vitest 性能报告，让 Codex 只进行小范围、保留覆盖率的测试性能修复，而不是大规模重构，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的变更。如果基线中存在失败测试，Codex 只能修复明显的失败；并且在提交任何内容之前，智能体处理后的完整测试套件报告必须通过。当 `main` 在机器人推送落地之前继续前进时，该通道会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，然后重试推送；发生冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就可以与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅有文档变更、变更范围、变更的扩展，并构建 CI 清单 | 所有非 draft 的 push 和 PR |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 所有非 draft 的 push 和 PR |
| `security-dependency-audit` | 针对 npm advisory 执行无依赖的生产 lockfile 审计 | 所有非 draft 的 push 和 PR |
| `security-fast` | 快速安全作业的必需聚合作业 | 所有非 draft 的 push 和 PR |
| `build-artifacts` | 构建 `dist/`、Control UI、内置产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道 contract 检查，并带有稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 对整个扩展套件执行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、contract 和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更的内置插件执行聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke 测试 | 与 Node 相关的变更 |
| `checks` | 已构建产物渠道测试的验证器，以及仅在 push 上运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档有变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享已构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在受信任活动之后每日运行的 Codex 慢测试优化 | 主 CI 成功后或手动触发 |

## Fail-Fast 顺序

作业按顺序排列，以便让廉价检查先失败，再运行昂贵作业：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是此作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游消费者可以在共享构建准备好后立即启动。
4. 之后会展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然仅针对对应平台源码变更进行范围控制。
Windows Node 检查的范围仅限于 Windows 专用的进程/路径包装器、npm/pnpm/UI runner 辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、插件、install-smoke 和仅测试变更会继续留在 Linux Node 通道中，因此不会为了已经由普通测试分片覆盖的内容去占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用了同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，快速路径会覆盖 Docker/包表面、内置插件包/manifest 变更，以及 Docker smoke 作业会涉及的 core plugin/channel/Gateway 网关/插件 SDK 表面。仅源码级的内置插件变更、仅测试编辑以及仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行容器 gateway-network e2e，验证一个内置扩展 build arg，并在 120 秒命令超时限制下运行受限的内置插件 Docker profile。完整路径则保留 QR 包安装以及 installer Docker/update 覆盖，用于每晚定时运行、手动触发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的拉取请求。推送到 `main`，包括 merge commit，不会强制走完整路径；当 changed-scope 逻辑在 push 上请求完整覆盖时，工作流仍只保留快速 Docker smoke，而将完整 install smoke 留给夜间或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独控制；它会在夜间计划任务和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但拉取请求和 `main` push 不会运行它。QR 和 installer Docker 测试保留它们各自以安装为重点的 Dockerfile。本地 `test:docker:all` 会预先构建一个共享的实时测试镜像，以及一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后使用加权调度器和 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 live/E2E smoke 通道；默认主池槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对 provider 敏感的尾池槽位数也默认为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道就不会过度占用 Docker，同时较轻的通道仍可填满可用槽位。默认情况下，各通道启动会错开 2 秒，以避免本地 Docker daemon 出现创建风暴；你可以用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。这个本地聚合器会先对 Docker 做预检，移除陈旧的 OpenClaw E2E 容器，输出活动通道状态，持久化通道耗时以便按最长优先排序，并支持使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 检查调度器。默认情况下，它会在第一次失败后停止调度新的池化通道；并且每个通道都有一个 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分选定的 live/tail 通道会使用更严格的单通道上限。可复用的 live/E2E 工作流采用相同的共享镜像模式：先在 Docker 矩阵之前构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行矩阵。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标进行拆分，以便重复的 npm update 和 doctor repair 轮次可以与其他内置检查一起分片运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：core 生产变更会运行 core prod typecheck 加 core tests，core 仅测试变更只运行 core test typecheck/tests，扩展生产变更会运行 extension prod typecheck 加 extension tests，而扩展仅测试变更只运行 extension test typecheck/tests。公开的插件 SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些 core contract。仅包含发布元数据的版本号提升会运行定向的版本/配置/root-dependency 检查。未知的 root/config 变更会以安全优先方式落到所有通道。

在 push 上，`checks` 矩阵会增加仅限 push 的 `compat-node22` 通道。在拉取请求上，这个通道会被跳过，矩阵会继续专注于常规测试/渠道通道。

最慢的 Node 测试族会被拆分或重新平衡，以便每个作业都保持较小规模而不会过度占用 runner：渠道 contract 会作为 3 个加权分片运行，内置插件测试会在 6 个扩展 worker 之间做平衡，小型 core 单元通道会成对组合，自动回复会作为 3 个平衡 worker 运行而不是 6 个微小 worker，而 agentic Gateway 网关/插件配置会分散到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。宽泛的浏览器、QA、媒体和杂项插件测试使用它们各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两组插件配置，每组使用一个 Vitest worker，并配备更大的 Node heap，这样导入密集型的插件批次就不会产生额外的 CI 作业。宽泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受导入/调度影响，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享 runtime 分片成为尾部瓶颈。`check-additional` 会将 package-boundary compile/canary 工作放在一起，并将 runtime topology 架构与 gateway watch 覆盖拆分开；boundary guard 分片会在一个作业内部并发运行其小型独立守卫。Gateway watch、渠道测试以及 core support-boundary 分片会在 `build-artifacts` 内部并发运行，此时 `dist/` 和 `dist-runtime/` 已经构建完成；这样就能保留它们旧有的检查名称作为轻量验证作业，同时避免额外两个 Blacksmith worker 和第二个产物消费者队列。

Android CI 会运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会在带有 SMS/call-log BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。
`extension-fast` 仅用于 PR，因为 push 运行已经会执行完整的内置插件分片。这样既能为评审保留变更插件的反馈，又不会在 `main` 上额外占用一个 Blacksmith worker 去覆盖 `checks-node-extensions` 中已经存在的内容。

当同一个 PR 或 `main` 引用上有更新的 push 落地时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键是带版本号的（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞更新的 `main` 运行。

## Runner

| Runner | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道 contract 检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于收益；install-smoke Docker 构建，其中 32 vCPU 的排队时间成本高于收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `macos-node`，用于 `openclaw/openclaw`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `macos-swift`，用于 `openclaw/openclaw`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更的 typecheck/lint/tests
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但带有各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 产物/build-smoke 通道相关时构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
