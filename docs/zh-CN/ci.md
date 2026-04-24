---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-24T03:38:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27f0244013dac350b60f05b1c96bf51a61ff15be5151759f39f5adb287f6caf7
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围判定，在只有不相关区域发生变更时跳过高开销作业。

QA Lab 在主智能范围工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每夜运行，并支持手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道拆分为并行作业。实时作业使用 `qa-live-shared` environment，Telegram 通道使用 Convex leases。`OpenClaw Release Checks` 也会在发布批准前运行相同的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复项清理。它默认以 dry-run 模式运行，只有在设置 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并验证每个重复 PR 要么引用了同一个 issue，要么具有重叠的变更 hunk。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已落地的变更保持一致。它没有纯定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，手动触发也可以直接运行它。基于 workflow-run 的调用会在 `main` 已继续前进，或过去一小时内已经创建了另一个未被跳过的 Docs Agent 运行时跳过。实际运行时，它会审查从上一次未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时的一次运行可以覆盖自上次文档处理以来累积到 `main` 的所有变更。

`Test Performance Agent` 工作流是一个面向慢测试的事件驱动 Codex 维护通道。它没有纯定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 已经有另一个基于 workflow-run 的调用正在运行或已经运行过，则会跳过。手动触发会绕过这个按日活动门禁。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 只进行小范围、保留覆盖率的测试性能修复，而不是做大范围重构，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的变更。如果基线本身存在失败测试，Codex 只能修复明显错误，并且 agent 运行后的完整测试套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就可以与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| Job                              | 用途                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测是否仅变更文档、变更的范围、变更的 extensions，并构建 CI 清单                            | 所有非 draft 的 push 和 PR         |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 所有非 draft 的 push 和 PR         |
| `security-dependency-audit`      | 针对 npm advisories 进行无依赖的生产 lockfile 审计                                           | 所有非 draft 的 push 和 PR         |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                   | 所有非 draft 的 push 和 PR         |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物                                 | 与 Node 相关的变更                 |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                            | 与 Node 相关的变更                 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                 | 与 Node 相关的变更                 |
| `checks-node-extensions`         | 针对整个 extension 套件的完整 bundled plugin 测试分片                                        | 与 Node 相关的变更                 |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、bundled、contract 和 extension 通道                          | 与 Node 相关的变更                 |
| `extension-fast`                 | 仅针对已变更 bundled plugins 的聚焦测试                                                      | 含 extension 变更的拉取请求        |
| `check`                          | 分片的主本地门禁等效项：生产类型、lint、guards、测试类型和严格 smoke                         | 与 Node 相关的变更                 |
| `check-additional`               | 架构、边界、extension surface guards、package-boundary 和 gateway-watch 分片                 | 与 Node 相关的变更                 |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                     | 与 Node 相关的变更                 |
| `checks`                         | 已构建产物渠道测试的校验器，以及仅在 push 时运行的 Node 22 兼容性检查                        | 与 Node 相关的变更                 |
| `check-docs`                     | 文档格式、lint 和失效链接检查                                                                | 文档发生变更时                     |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                   | 与 Python Skills 相关的变更        |
| `checks-windows`                 | Windows 专用测试通道                                                                         | 与 Windows 相关的变更              |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                 | 与 macOS 相关的变更                |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | 与 macOS 相关的变更                |
| `android`                        | 两个 flavor 的 Android 单元测试以及一个 debug APK 构建                                       | 与 Android 相关的变更              |
| `test-performance-agent`         | 在可信活动之后，按日运行的 Codex 慢测试优化                                                  | Main CI 成功后或手动触发           |

## Fail-Fast 顺序

作业按顺序排列，以便便宜的检查先失败，再决定是否运行高开销作业：

1. `preflight` 决定究竟存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行，这样下游消费者可以在共享构建准备好后立即开始。
4. 然后才展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流的编辑会验证 Node CI 图和工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对对应平台源代码变更进行范围判定。
Windows Node 检查仅针对 Windows 专用的进程/路径包装器、npm/pnpm/UI runner helpers、包管理器配置，以及执行该通道的 CI 工作流 surface 进行范围判定；不相关的源代码、plugin、install-smoke 和纯测试变更会保留在 Linux Node 通道中，这样就不会为了已经由常规测试分片覆盖的内容而占用一个 16-vCPU 的 Windows worker。
单独的 `install-smoke` 工作流不是 PR 或 `main` push 的门禁。它每天按计划运行一次，可以手动启动，也可通过 `workflow_call` 被发布检查复用。定时运行和发布调用会执行完整的安装 smoke 路径：QR 包导入、root Dockerfile CLI smoke、gateway-network e2e、bundled extension build-arg smoke、installer Docker/update 覆盖、有界 bundled-plugin Docker profile，以及在启用时运行 Bun 全局安装 image-provider smoke。PR 应使用主 CI 通道和有针对性的本地 Docker 证明，而不是等待 `install-smoke`。QR 和 installer Docker 测试保留各自专用的、以安装为重点的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下并行运行 live/E2E smoke 通道；默认并发数为 4，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整。本地聚合器默认会在首次失败后停止调度新的池化通道，并且每个通道都有一个 120 分钟超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动或 provider 敏感的通道会在并行池之后独占运行。可复用的 live/E2E 工作流也遵循共享镜像模式：先在 Docker 矩阵之前构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后在矩阵中以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。完整的 bundled update/channel 矩阵仍然保持为手动/完整套件，因为它会反复执行真实的 npm update 和 doctor repair 流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：core 生产变更会运行 core 生产 typecheck 加 core 测试；仅 core 测试变更只运行 core 测试 typecheck/测试；extension 生产变更会运行 extension 生产 typecheck 加 extension 测试；仅 extension 测试变更只运行 extension 测试 typecheck/测试。公开的 Plugin SDK 或 plugin-contract 变更会扩展到 extension 校验，因为 extensions 依赖这些 core 契约。仅发布元数据的版本提升会运行有针对性的 version/config/root-dependency 检查。未知的根目录/配置变更会以安全优先的方式回退到所有通道。

在 push 上，`checks` 矩阵会额外加入仅在 push 时运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵会保持聚焦于常规测试/渠道通道。

最慢的 Node 测试家族会被拆分或平衡处理，这样每个作业都能保持较小规模，同时避免过度预留 runners：渠道契约被分为三个加权分片；bundled plugin 测试在六个 extension workers 间平衡；较小的 core 单元通道会成对组合；auto-reply 改为三个平衡 worker，而不是六个过小的 worker；agentic Gateway 网关/plugin 配置会分布到现有仅源码的 agentic Node 作业中，而不是等待已构建产物。广泛的浏览器、QA、媒体以及杂项 plugin 测试使用各自专用的 Vitest 配置，而不是共享的 plugin 兜底配置。Extension 分片作业会以单个 Vitest worker 和更大的 Node heap 串行运行 plugin 配置组，这样导入密集型的 plugin 批次就不会让较小的 CI runners 过载。广泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它的瓶颈在导入/调度，而不是某个单独缓慢的测试文件。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独自拖尾。`check-additional` 将 package-boundary compile/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；boundary guard 分片会在一个作业内并发运行其体量较小、彼此独立的 guards。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内并发运行；这样既保留了它们原有的 check 名称作为轻量校验作业，又避免了额外两个 Blacksmith workers 和第二条 artifact consumer 队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会在启用 SMS/通话记录 BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。

`extension-fast` 仅在 PR 上运行，因为 push 运行已经会执行完整的 bundled plugin 分片。这样可以在评审期间保留针对已变更 plugin 的反馈，同时不会在 `main` 上额外占用一个 Blacksmith worker 去覆盖 `checks-node-extensions` 中已经存在的内容。

当同一 PR 或 `main` 引用上有新的 push 到来时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发 key 采用了版本化形式（`CI-v7-*`），这样 GitHub 侧旧队列组中的僵尸任务就无法无限期阻塞较新的 main 运行。

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合校验器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、bundled plugin 测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 的敏感度仍然高到使用 8 vCPU 得不偿失；install-smoke Docker 构建同理，32 vCPU 带来的队列时间成本高于节省效果                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |

## 本地等效命令

```bash
pnpm changed:lanes   # 查看 origin/main...HEAD 的本地 changed-lane 分类结果
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/tests
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 同一套门禁，但附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接检查
pnpm build          # 当 CI artifact/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```
