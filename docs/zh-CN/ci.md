---
read_when:
    - 你需要了解某个 CI 作业为何运行或未运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-24T01:35:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: a20e4e679ce5f1d0406f34255ac2de55011210fdb60fe42eb355b5351685c56a
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围界定，在只改动无关区域时跳过昂贵作业。

QA Lab 在主智能范围工作流之外有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 改动和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业扇出执行。实时作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布批准前运行相同的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复 PR 清理。它默认使用 dry-run，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 是否已合并，并确认每个重复 PR 都具有共享的引用 issue，或存在重叠的改动 hunk。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已落地的改动保持一致。它没有纯定时调度：当 `main` 上一次成功的非机器人推送 CI 运行完成后，可以触发它；也可以直接通过手动触发运行。workflow-run 调用会在 `main` 已继续前进，或者过去一小时内已创建过另一个未跳过的 Docs Agent 运行时跳过。当它运行时，会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累积到 `main` 的所有更改。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：当 `main` 上一次成功的非机器人推送 CI 运行完成后，可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用运行过或正在运行，它就会跳过。手动触发会绕过这个按天限制的活动门控。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 只做小范围且不降低覆盖率的测试性能修复，而不是进行大范围重构，然后重新运行完整测试套件报告，并拒绝会降低通过基线测试数量的改动。如果基线中存在失败测试，Codex 只能修复明显失败的问题，并且 agent 处理后的完整测试套件报告必须通过，之后才能提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试推送；发生冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                             | 目的                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测是否仅改动文档、变更范围、变更的扩展，并构建 CI 清单                                    | 所有非草稿 push 和 PR              |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 所有非草稿 push 和 PR              |
| `security-dependency-audit`      | 针对 npm 安全通告执行无依赖的生产 lockfile 审计                                              | 所有非草稿 push 和 PR              |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                   | 所有非草稿 push 和 PR              |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物                                 | 与 Node 相关的变更                 |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                            | 与 Node 相关的变更                 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                 | 与 Node 相关的变更                 |
| `checks-node-extensions`         | 覆盖整个扩展套件的完整内置插件测试分片                                                       | 与 Node 相关的变更                 |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和扩展通道                                         | 与 Node 相关的变更                 |
| `extension-fast`                 | 仅针对已变更内置插件的聚焦测试                                                               | 带有扩展改动的拉取请求             |
| `check`                          | 分片的主本地门控等效项：生产类型、lint、守卫、测试类型和严格 smoke                           | 与 Node 相关的变更                 |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界，以及 gateway-watch 分片                                    | 与 Node 相关的变更                 |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                     | 与 Node 相关的变更                 |
| `checks`                         | 已构建产物渠道测试的验证器，以及仅 push 时运行的 Node 22 兼容性检查                          | 与 Node 相关的变更                 |
| `check-docs`                     | 文档格式化、lint 和坏链检查                                                                  | 文档发生变更时                     |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                                 | 与 Python Skills 相关的变更        |
| `checks-windows`                 | Windows 专用测试通道                                                                         | 与 Windows 相关的变更              |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                 | 与 macOS 相关的变更                |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | 与 macOS 相关的变更                |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建                                     | 与 Android 相关的变更              |
| `test-performance-agent`         | 在受信任活动之后每日运行的 Codex 慢测试优化                                                  | `main` CI 成功后或手动触发         |

## 快速失败顺序

作业按顺序排列，以便廉价检查先失败，避免昂贵作业运行：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不必等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行进行，这样下游使用者一旦共享构建准备好就能立刻开始。
4. 更重的平台和运行时通道会在之后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 图和工作流 lint，但不会仅因这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍仅在相关平台源码变更时才运行。
Windows Node 检查的范围限定在 Windows 专用的 process/path wrappers、npm/pnpm/UI runner helpers、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、install-smoke 和仅测试变更仍停留在 Linux Node 通道中，因此不会为了已由常规测试分片覆盖的内容而占用一个 16 vCPU 的 Windows worker。
单独的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker/包表面、内置插件包/manifest 改动，以及 Docker smoke 作业所覆盖的 core plugin/channel/Gateway 网关/插件 SDK 表面，会运行快速路径。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建根 Dockerfile 镜像一次，检查 CLI，运行容器 gateway-network e2e，验证一个内置扩展 build arg，并在 120 秒命令超时限制下运行有边界的内置插件 Docker profile。完整路径则保留 QR 包安装以及 installer Docker/update 覆盖，用于每晚定时运行、手动触发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的拉取请求。对 `main` 的 push，包括 merge commit，不会强制完整路径；当 changed-scope 逻辑在 push 上要求完整覆盖时，工作流会保留快速 Docker smoke，并将完整安装 smoke 留给 nightly 或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控；它会在 nightly 调度和发布检查工作流中运行，手动触发 `install-smoke` 时也可选择启用，但拉取请求和 `main` push 不会运行它。QR 和 installer Docker 测试保留各自专注安装场景的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下并行运行 live/E2E smoke 通道；默认并发数为 4，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整。本地聚合作业默认会在首次失败后停止调度新的池化通道，并且每个通道都有 120 分钟超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动或 provider 敏感的通道会在并行池之后以独占方式运行。可复用的 live/E2E 工作流也采用共享镜像模式：在 Docker 矩阵前先构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后在矩阵中使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。完整的内置更新/渠道矩阵仍然仅限手动/完整套件，因为它会重复执行真实的 npm update 和 doctor repair 过程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比宽泛的 CI 平台范围更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试，core 仅测试变更只运行 core 测试 typecheck/测试，扩展生产变更会运行扩展生产 typecheck 加扩展测试，而扩展仅测试变更只运行扩展测试 typecheck/测试。公开的插件 SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本号变更会运行有针对性的版本/配置/根依赖检查。未知的根目录/配置变更会以安全优先方式退回到所有通道。

在 push 时，`checks` 矩阵会增加一个仅在 push 时运行的 `compat-node22` 通道。在拉取请求中，这个通道会被跳过，矩阵将专注于常规测试/渠道通道。

最慢的 Node 测试家族会被拆分或做负载均衡，这样每个作业都能保持较小规模，同时避免过度预留 runner：渠道契约按权重拆成三个分片，内置插件测试在六个扩展 worker 之间做负载均衡，小型 core 单元通道会成对组合，auto-reply 改为三个负载均衡 worker 而不是六个很小的 worker，而 agentic Gateway 网关/插件配置则分布到现有仅源码的 agentic Node 作业中，而不是等待构建产物完成。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业会以单个 Vitest worker 和更大的 Node 堆串行运行插件配置组，这样导入密集型的插件批次就不会让小型 CI runner 过度提交。广泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它的瓶颈主要在导入/调度，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独自承担长尾。`check-additional` 将 package-boundary compile/canary 工作保留在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；boundary guard 分片会在一个作业内部并发运行其体量较小且相互独立的守卫。Gateway 网关 watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内部并发运行，保留它们原有的检查名称作为轻量验证器作业，同时避免额外占用两个 Blacksmith worker 和第二条 artifact-consumer 队列。

Android CI 会运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。

`extension-fast` 仅在 PR 上运行，因为 push 运行已经会执行完整的内置插件分片。这能在评审期间保留对已更改插件的快速反馈，同时避免在 `main` 上为 `checks-node-extensions` 已经覆盖的内容额外预留一个 Blacksmith worker。

当同一个 PR 或 `main` ref 上有更新的 push 到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新一次运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被更新运行取代后继续排队。
CI 并发键使用版本化形式（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞更新的 `main` 运行。

## Runner

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片与聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建也是如此，因为 32 vCPU 的排队时间成本高于收益                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界通道运行变更范围内的 typecheck/lint/tests
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 与上述门控相同，但附带每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链检查
pnpm build          # 当 CI artifact/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --recent 10   # 对比最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```
