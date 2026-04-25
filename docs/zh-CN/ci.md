---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-25T17:30:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 841b8036e59b5b03620b301918549670870842cc42681321a9b8f9d01792d950
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围控制，在只修改了无关区域时跳过开销较大的作业。

QA Lab 在主智能范围工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道拆分为并行作业。实时作业使用 `qa-live-shared` environment，而 Telegram 通道使用 Convex leases。`OpenClaw Release Checks` 也会在发布批准前运行同样的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并后清理重复 PR 的手动工作流。它默认以 dry-run 模式运行，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已合并的 PR 确实已经合并，并确认每个重复 PR 都具有共享的引用 issue，或存在重叠的变更 hunk。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已合并的变更保持一致。它没有纯定时调度：在 `main` 上成功完成的、非机器人触发的 push CI 运行可以触发它，手动触发也可以直接运行它。workflow-run 调用会在 `main` 已经继续前进，或过去一小时内已经创建了另一个未被跳过的 Docs Agent 运行时跳过。实际运行时，它会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累积在 main 上的所有变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：在 `main` 上成功完成的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用正在运行或已经运行过，它就会跳过。手动触发会绕过这个按天统计的活动门禁。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 只做小范围、保持覆盖率不变的测试性能修复，而不是进行大范围重构；随后它会重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的更改。如果基线中本身存在失败测试，Codex 只能修复明显的失败项，并且 agent 处理后的完整测试套件报告必须通过，之后才允许提交任何内容。当 `main` 在机器人推送落地之前继续前进时，该通道会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅有文档变更、变更范围、已变更扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisories 执行无需依赖安装的生产 lockfile 审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道 contract 检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 对整个扩展套件执行完整 bundled-plugin 测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包含渠道、bundled、contract 和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已变更 bundled plugins 的聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主本地门禁等效项：生产类型、lint、guard、测试类型和严格 smoke 检查 | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面 guard、包边界以及 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke 测试 | 与 Node 相关的变更 |
| `checks` | 用于已构建产物渠道测试的验证器，以及仅在 push 时运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和损坏链接检查 | 文档发生变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动后执行的每日 Codex 慢测试优化 | main CI 成功后或手动触发 |

## 快速失败顺序

作业的排序方式是让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不必等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行，这样下游消费者可以在共享构建准备完成后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但仅凭这些编辑本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只会根据对应平台源码变更来决定是否运行。
仅涉及 CI 路由的编辑、特定廉价 core-test fixture 编辑，以及狭窄的 plugin contract helper/test-routing 编辑，会使用快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当前更改文件仅限于该快速任务可直接覆盖的路由或 helper 表面时，这一路径会避开构建产物、Node 22 兼容性、渠道 contract、完整 core 分片、bundled-plugin 分片，以及额外的 guard 矩阵。
Windows Node 检查的范围限定为 Windows 专用的进程/路径包装器、npm/pnpm/UI runner helpers、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、plugin、install-smoke 和仅测试变更会继续留在 Linux Node 通道上，这样就不会为已经由常规测试分片覆盖的内容占用 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过其自身的 `preflight` 作业复用相同的范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker/包表面、bundled plugin package/manifest 变更，以及 Docker smoke 作业所覆盖的 core plugin/channel/gateway/Plugin SDK 表面会运行快速路径。仅源码级的 bundled plugin 变更、仅测试编辑和仅文档编辑不会占用 Docker workers。快速路径会构建一次根 Dockerfile 镜像、检查 CLI、运行 agents delete shared-workspace CLI smoke、运行容器 gateway-network e2e、验证一个 bundled extension build arg，并在 240 秒的总命令超时限制下运行有边界的 bundled-plugin Docker profile，同时每个场景的 Docker run 也各自有单独上限。完整路径会为夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的拉取请求保留 QR package install 和 installer Docker/update 覆盖。推送到 `main`，包括合并提交，不会强制走完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，工作流仍然只保留快速 Docker smoke，而把完整 install smoke 留给夜间任务或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独控制；它会在夜间计划任务和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但拉取请求和 `main` 推送都不会运行它。QR 和 installer Docker 测试保留各自专注于安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后使用加权调度器和 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 live/E2E smoke 通道；默认主池槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对 provider 敏感的尾部池槽位数默认也是 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，以避免 npm install 和多服务通道过度占用 Docker，同时让较轻的通道仍能填满可用槽位。默认情况下，各通道启动会错开 2 秒，以避免本地 Docker daemon 出现 create 风暴；可使用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合流程会预先检查 Docker、移除过时的 OpenClaw E2E 容器、输出当前活跃通道状态、持久化通道耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于检查调度器。默认情况下，它会在首次失败后停止调度新的池化通道，并且每个通道都有 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分 live/tail 通道使用更严格的单通道上限。可复用的 live/E2E 工作流也采用相同的共享镜像模式：它会在 Docker 矩阵之前先构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行矩阵。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。bundled update 矩阵按 update target 拆分，以便重复的 npm update 和 doctor repair 过程可以与其他 bundled 检查一起分片运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只运行 core 测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只运行扩展测试 typecheck/测试。公开的 Plugin SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些 core contract。仅发布元数据的版本提升会运行定向的版本/配置/根依赖检查。未知的根目录/配置变更会以保守方式回退到所有通道。

在 push 上，`checks` 矩阵会额外加入仅在 push 时运行的 `compat-node22` 通道。在拉取请求中，这个通道会被跳过，矩阵会继续聚焦于常规测试/渠道通道。

最慢的 Node 测试族会被拆分或重新平衡，以便每个作业都保持较小规模而不会过度预留 runner：渠道 contract 以三个加权分片运行，bundled plugin 测试在六个扩展 worker 之间平衡分配，小型 core 单元通道会成对组合，auto-reply 以三个平衡 worker 运行而不是六个很小的 worker，而 agentic gateway/plugin configs 会分散到现有的仅源码 agentic Node 作业中，而不是等待构建产物。范围较广的 browser、QA、media 和杂项 plugin 测试使用各自专用的 Vitest 配置，而不是共享的 plugin 兜底配置。扩展分片作业一次最多运行两组 plugin config，每组使用一个 Vitest worker，并分配更大的 Node 堆，以避免导入密集型 plugin 批次产生额外的 CI 作业。广泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它受导入/调度影响更大，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以免共享运行时分片承担尾部长任务。`check-additional` 会把 package-boundary compile/canary 工作保留在一起，并把运行时拓扑架构与 gateway watch 覆盖分开；boundary guard 分片会在一个作业内部并发运行其几个较小且相互独立的 guards。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，于 `build-artifacts` 内部并发运行；这样既保留了它们原有的检查名称作为轻量验证作业，又避免再额外占用两个 Blacksmith workers 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；其单元测试通道仍会在带有 SMS/call-log BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为 push 运行已经会执行完整的 bundled plugin 分片。这样既能为评审提供已变更 plugin 的反馈，又不会在 `main` 上为 `checks-node-extensions` 已经覆盖的内容额外占用一个 Blacksmith worker。

当同一 PR 或 `main` 引用上有更新的 push 到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用的最新运行也失败了，否则应把这视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但不会在整个工作流已经被更新运行取代后继续排队。

CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 端旧队列组中的僵尸任务不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道 contract 检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、bundled plugin 测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然足够依赖 CPU，使用 8 vCPU 的成本高于节省；install-smoke Docker 构建也是如此，32 vCPU 的排队时间成本高于其节省效果 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门禁，但带每个阶段的耗时统计
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 损坏链接检查
pnpm build          # 当 CI 构建产物/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢的作业
node scripts/ci-run-timings.mjs --recent 10   # 对比最近成功的 10 次 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
