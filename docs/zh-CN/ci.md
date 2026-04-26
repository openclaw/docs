---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-26T21:31:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b60445c01b9cc30be075c37c04ae827f68f9b08550abc3bfde498f8660c6fc2
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围控制，在仅有不相关区域发生变更时跳过昂贵作业。

QA Lab 在主智能范围控制工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动触发；它会将 mock parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业扇出运行。实时作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex leases。`OpenClaw Release Checks` 也会在发布批准前运行同样的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并落地后进行重复 PR 清理的手动工作流。它默认采用 dry-run，仅当 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并检查每个重复 PR 是否具有共享的引用 issue，或存在重叠的变更代码块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时调度：在 `main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，手动触发也可以直接运行它。workflow-run 调用会在 `main` 已继续前进，或者过去一小时内已创建了另一个未被跳过的 Docs Agent 运行时跳过。当它运行时，会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时运行一次即可覆盖自上次文档处理以来积累的所有 main 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：在 `main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 已有另一个 workflow-run 调用已经运行或正在运行，它就会跳过。手动触发会绕过这个按天的活动门控。该通道会构建一个全量测试套件的分组 Vitest 性能报告，让 Codex 只做小范围且不降低覆盖率的测试性能修复，而不是进行大范围重构，然后重新运行全量测试套件报告，并拒绝任何会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显失败的问题，并且只有在智能体处理后的全量测试套件报告通过后，才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅为文档变更、变更范围、变更的扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisories 执行无依赖的生产 lockfile 审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建产物检查，以及供下游复用的产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对发生变更的内置插件执行聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片后的主本地门控等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI smoke 测试和启动内存 smoke 测试 | 与 Node 相关的变更 |
| `checks` | 已构建产物渠道测试的验证器，以及仅在 push 上运行的 Node 22 兼容性检查 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和损坏链接检查 | 文档发生变更 |
| `skills-python` | 针对 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享已构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动后，每日执行一次 Codex 慢测试优化 | 主 CI 成功后或手动触发 |

## 快速失败顺序

作业的顺序经过安排，以便让低成本检查先失败，再决定是否运行昂贵作业：

1. `preflight` 决定究竟有哪些通道存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，以便下游消费者在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后扇出运行：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然仅针对平台源代码变更进行范围控制。
仅涉及 CI 路由的编辑、部分低成本 core-test fixture 编辑，以及狭窄的插件契约辅助工具/测试路由编辑，会使用快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。对于仅限于该快速任务可直接覆盖的路由或辅助工具表面的变更，这一路径会跳过构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片以及附加守卫矩阵。
Windows Node 检查仅针对 Windows 特有的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面进行范围控制；不相关的源代码、插件、install-smoke 和仅测试变更仍保留在 Linux Node 通道上，因此不会为了已经由常规测试分片覆盖的内容而占用一个 16-vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于 Docker/包表面、内置插件包/manifest 变更，以及 Docker smoke 作业会覆盖的 core 插件/渠道/Gateway 网关/插件 SDK 表面，拉取请求会运行快速路径。仅源代码级别的内置插件变更、仅测试编辑以及仅文档编辑不会占用 Docker worker。快速路径会构建根 Dockerfile 镜像一次，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行 container gateway-network e2e，验证一个内置扩展 build arg，并在 240 秒的总命令超时内运行有界的内置插件 Docker profile，其中每个场景的 Docker run 都有单独的上限。完整路径则保留 QR 包安装和安装器 Docker/update 覆盖，用于每夜定时运行、手动触发、workflow-call 发布检查，以及确实触及安装器/包/Docker 表面的拉取请求。推送到 `main`，包括 merge commit，不会强制走完整路径；当 changed-scope 逻辑在 push 上请求完整覆盖时，工作流会保留快速 Docker smoke，并将完整 install smoke 留给夜间或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控；它会在夜间调度和发布检查工作流中运行，手动触发 `install-smoke` 时也可选择启用，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自专注于安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后使用加权调度器和 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 live/E2E smoke 通道；默认主池插槽数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对提供商更敏感的尾池插槽数也默认为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道就不会过度占用 Docker，而较轻的通道仍能填满可用插槽。默认情况下，各通道启动会错开 2 秒，以避免本地 Docker 守护进程在创建时发生风暴；可使用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合预检会检查 Docker，移除过期的 OpenClaw E2E 容器，输出活动通道状态，持久化通道耗时以供最长优先排序，并支持使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 检查调度器。默认情况下，它会在首次失败后停止调度新的池化通道，并且每个通道都有一个 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分 live/tail 通道使用更严格的单通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行调度器中的精确通道，包括仅发布时使用的通道，如 `install-e2e`，以及拆分后的内置更新通道，如 `bundled-channel-update-acpx`，同时跳过 cleanup smoke，以便智能体复现某个失败通道。可复用的 live/E2E 工作流会构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后以最多三个分块作业运行发布路径 Docker 套件，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只需拉取一次共享镜像，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json` 以及每个通道的重跑命令。工作流的 `docker_lanes` 输入会针对准备好的镜像运行选定通道，而不是运行这三个分块作业；这样可以把失败通道调试限制在一个有针对性的 Docker 作业中；如果选定通道是 live Docker 通道，则该定向作业会为这次重跑在本地构建 live-test 镜像。当在发布路径套件中请求 Open WebUI 时，它会在 plugins/integrations 分块内运行，而不是额外占用第四个 Docker worker；只有 openwebui-only 触发时，Open WebUI 才保留独立作业。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm update 和 doctor repair 过程可以与其他内置检查一起分片运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比宽泛的 CI 平台范围更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只运行 core 测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只运行扩展测试 typecheck/测试。公开的插件 SDK 或插件契约变更会扩展到扩展验证，因为扩展依赖这些 core 契约。仅发布元数据的版本号变更会运行有针对性的 version/config/root-dependency 检查。未知的根目录/配置变更会以安全优先方式落到所有通道。

在 push 上，`checks` 矩阵会增加仅 push 运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵保持聚焦于常规测试/渠道通道。

最慢的 Node 测试族已被拆分或重新平衡，以便每个作业都保持较小规模，同时不会过度占用 runner：渠道契约作为三个加权分片运行，内置插件测试在六个扩展 worker 之间平衡分布，小型 core 单元通道会成对组合，auto-reply 作为四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 以及 commands/state-routing 分片，而 agentic Gateway 网关/插件配置则分散到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用它们各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两组插件配置，每组只使用一个 Vitest worker，并分配更大的 Node heap，这样导入开销大的插件批次就不会产生额外的 CI 作业。广泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受导入/调度影响，而不是由某个单独缓慢的测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片承担尾部耗时。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional` 将 package-boundary compile/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖拆开；boundary guard 分片会在一个作业内部并发运行其小型独立守卫。Gateway watch、渠道测试以及 core support-boundary 分片会在 `build-artifacts` 内部并发运行，此时 `dist/` 和 `dist-runtime/` 已经构建完成，这样既保留了它们原有的检查名称作为轻量验证作业，又避免了额外两个 Blacksmith worker 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行一个 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为 push 已经会执行完整的内置插件分片。这样既能为评审提供已变更插件的反馈，又不会在 `main` 上为了 `checks-node-extensions` 已经覆盖的内容额外占用一个 Blacksmith worker。

当同一 PR 或 `main` 引用上有更新的 push 落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被更新运行取代后继续排队。
CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸任务不会无限期阻塞较新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合作业、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵就能更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然足够依赖 CPU，使用 8 vCPU 的成本高于节省；install-smoke Docker 构建中，32-vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `macos-node`，用于 `openclaw/openclaw`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `macos-swift`，用于 `openclaw/openclaw`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界通道运行变更对应的 typecheck/lint/测试
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门控，但带每个阶段的耗时统计
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 损坏链接
pnpm build          # 当 CI 的 artifact/build-smoke 通道相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪声，并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
