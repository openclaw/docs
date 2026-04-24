---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-24T04:00:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 768f942c9624ba2339f31945dea73dea9488ac37c814b72d50c3485efe12596b
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围判定，在只有不相关区域发生变更时跳过高开销作业。

QA Lab 在主智能范围工作流之外拥有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更以及手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上按夜间计划运行，并且也可手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业扇出运行。实时作业使用 `qa-live-shared` environment，而 Telegram 通道使用 Convex leases。`OpenClaw Release Checks` 也会在发布审批前运行同样的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复 PR 清理。它默认使用 dry-run，只有在 `apply=true` 时才会关闭被明确列出的 PR。在修改 GitHub 之前，它会验证已合并的 PR 确实已合并，并确认每个重复 PR 要么共享被引用的问题，要么存在重叠的变更代码块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已合并的变更保持一致。它没有纯粹的定时计划：在 `main` 上成功的、非机器人触发的 push CI 运行可以触发它，手动触发也可以直接运行它。workflow-run 调用会在 `main` 已经继续前进，或者在过去一小时内已经创建了另一个未被跳过的 Docs Agent 运行时跳过。当它运行时，它会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累计到 `main` 的所有变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢速测试。它没有纯粹的定时计划：在 `main` 上成功的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用运行过或正在运行，它就会跳过。手动触发会绕过这个按日活动门控。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 只进行小范围且不降低覆盖率的测试性能修复，而不是进行大范围重构，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的变更。如果基线中存在失败测试，Codex 只能修复明显的失败，并且 agent 处理后的完整测试套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| Job                              | 用途                                                                                         | 运行时机                             |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | 检测是否仅为文档变更、已变更范围、已变更扩展，并构建 CI 清单                                  | 总是在非草稿 push 和 PR 上运行       |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 总是在非草稿 push 和 PR 上运行       |
| `security-dependency-audit`      | 针对 npm advisories 执行不依赖安装的生产 lockfile 审计                                       | 总是在非草稿 push 和 PR 上运行       |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                   | 总是在非草稿 push 和 PR 上运行       |
| `build-artifacts`                | 构建 `dist/`、Control UI、内置产物检查，以及可复用的下游产物                                 | Node 相关变更                        |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                            | Node 相关变更                        |
| `checks-fast-contracts-channels` | 分片的 channel contract 检查，并提供稳定的聚合检查结果                                       | Node 相关变更                        |
| `checks-node-extensions`         | 覆盖整个扩展套件的完整内置插件测试分片                                                       | Node 相关变更                        |
| `checks-node-core-test`          | Core Node 测试分片，不包含 channel、bundled、contract 和 extension 通道                      | Node 相关变更                        |
| `extension-fast`                 | 仅针对已变更内置插件的聚焦测试                                                               | 具有扩展变更的拉取请求               |
| `check`                          | 分片后的主本地门控等效项：生产类型、lint、guard、测试类型和严格 smoke                        | Node 相关变更                        |
| `check-additional`               | 架构、边界、扩展表面 guard、包边界以及 gateway-watch 分片                                    | Node 相关变更                        |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试以及启动内存 smoke                                                   | Node 相关变更                        |
| `checks`                         | 用于已构建产物 channel 测试以及仅 push 的 Node 22 兼容性的校验器                             | Node 相关变更                        |
| `check-docs`                     | 文档格式化、lint 和失效链接检查                                                              | 文档发生变更时                       |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                   | Python Skills 相关变更               |
| `checks-windows`                 | Windows 专用测试通道                                                                         | Windows 相关变更                     |
| `macos-node`                     | 使用共享已构建产物的 macOS TypeScript 测试通道                                               | macOS 相关变更                       |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | macOS 相关变更                       |
| `android`                        | 两种 flavor 的 Android 单元测试外加一个 debug APK 构建                                       | Android 相关变更                     |
| `test-performance-agent`         | 在可信活动之后按日运行的 Codex 慢测优化                                                     | 主 CI 成功或手动触发                 |

## 快速失败顺序

作业按顺序排列，以便低成本检查能在高成本作业运行前先失败：

1. `preflight` 决定哪些通道会存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，这样下游消费者可以在共享构建准备好后立即启动。
4. 更重的平台和运行时通道随后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对平台源代码变更进行范围判定。
Windows Node 检查的范围限定在 Windows 专用的 process/path wrapper、npm/pnpm/UI runner helper、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源代码、plugin、install-smoke 和仅测试变更会继续留在 Linux Node 通道中，这样它们就不会为了已由常规测试分片覆盖的内容占用一个 16-vCPU 的 Windows worker。
独立的 `install-smoke` 工作流不是 PR 或 `main` push 的门控项。它每天按计划运行一次，可以手动启动，也可通过 `workflow_call` 被发布检查复用。按计划和 release-call 运行会执行完整的安装 smoke 路径：QR package import、root Dockerfile CLI smoke、gateway-network e2e、内置扩展 build-arg smoke、installer Docker/update 覆盖、受限的内置插件 Docker profile，以及在启用时执行的 Bun 全局安装 image-provider smoke。拉取请求应使用主 CI 通道和有针对性的本地 Docker 证明，而不是等待 `install-smoke`。QR 和 installer Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下并行运行 live/E2E smoke 通道；默认并发数为 4，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整。本地聚合作业默认会在首次失败后停止安排新的池化通道，并且每个通道都有 120 分钟超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动或 provider 敏感的通道会在并行池之后独占运行。可复用的 live/E2E 工作流也遵循共享镜像模式：在 Docker 矩阵之前先构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下运行矩阵。按计划的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。完整的 bundled update/channel 矩阵仍然保持为手动/完整套件，因为它会重复执行真实的 npm update 和 doctor repair 流程。

本地已变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比宽泛的 CI 平台范围更严格：core 生产变更会运行 core prod typecheck 加 core tests，core 仅测试变更只运行 core test typecheck/tests，extension 生产变更会运行 extension prod typecheck 加 extension tests，而 extension 仅测试变更只运行 extension test typecheck/tests。公共 Plugin SDK 或 plugin-contract 变更会扩展到 extension 验证，因为扩展依赖这些 core contract。仅发布元数据的版本提升会运行有针对性的 version/config/root-dependency 检查。未知的 root/config 变更会以安全优先方式退回到所有通道。

在 push 上，`checks` 矩阵会添加仅 push 的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵会继续聚焦于常规的 test/channel 通道。

最慢的 Node 测试族会被拆分或均衡处理，这样每个作业都能保持较小规模，同时不会过度预留 runner：channel contracts 以三个加权分片运行，内置 plugin 测试在六个扩展 worker 之间均衡分配，小型 core 单元通道会成对组合，auto-reply 以三个均衡 worker 运行而不是六个过小的 worker，而 agentic Gateway 网关 /plugin 配置会分布到现有的仅源代码 agentic Node 作业中，而不是等待已构建产物。广泛的 browser、QA、media 和杂项 plugin 测试使用它们各自专用的 Vitest 配置，而不是共享的 plugin 通用兜底配置。扩展分片作业会以单个 Vitest worker 串行运行 plugin 配置组，并分配更大的 Node 堆内存，这样导入密集型的 plugin 批次就不会让较小的 CI runner 过载。广泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它受导入/调度主导，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独自承担尾部耗时。`check-additional` 将 package-boundary compile/canary 工作保持在一起，并把 runtime topology architecture 与 gateway watch 覆盖分开；boundary guard 分片会在一个作业内部并发运行其较小且彼此独立的 guard。Gateway watch、channel 测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内部并发运行；这样既保留了它们原有的检查名称作为轻量级验证作业，又避免了额外占用两个 Blacksmith worker 和第二条 artifact-consumer 队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会在启用 SMS/call-log BuildConfig 标志的情况下编译该 flavor，同时避免在每次 Android 相关 push 时重复执行 debug APK 打包作业。

`extension-fast` 仅在 PR 上运行，因为 push 运行已经会执行完整的内置 plugin 分片。这样既能为评审提供已变更 plugin 的反馈，又不会在 `main` 上为 `checks-node-extensions` 已经覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` 引用上有新的 push 到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新一次运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个工作流已经被替代时不会继续排队。

CI 并发键采用版本化方式（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。

## Runner

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的 channel contract 检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置 plugin 测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 的敏感度仍然足够高，以至于 8 vCPU 的成本高于其节省的成本；install-smoke Docker 构建，在那里 32-vCPU 的排队时间成本高于其节省的成本                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地已变更通道分类器
pnpm check:changed   # 智能本地门控：按边界通道运行已变更的 typecheck/lint/tests
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速 guard
pnpm check:test-types
pnpm check:timed    # 同样的门控，但带有各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 失效链接检查
pnpm build          # 当 CI artifact/build-smoke 通道相关时构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
