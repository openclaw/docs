---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T23:39:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ada7a931acf451ef2dd3d132f701f3a87b6976fb476ed4f4f52ecc09c4191b12
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围判定，在只修改了无关区域时跳过昂贵作业。

QA Lab 在主智能范围工作流之外有专用的 CI 通道。  
`Parity gate` 工作流会在匹配的 PR 变更和手动派发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可通过手动派发运行；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道拆分为并行作业。实时作业使用 `qa-live-shared` 环境，Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布批准前运行同样的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复 PR 清理。它默认使用 dry-run，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并且每个重复 PR 都具有共享的引用 issue，或存在重叠的变更代码块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时调度：当 `main` 上一次成功的非机器人推送 CI 运行完成后，可以触发它；也可以通过手动派发直接运行。基于 workflow-run 的调用会在 `main` 已继续前进，或过去一小时内已创建过另一个未跳过的 Docs Agent 运行时跳过。当它运行时，会审查从上一次未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行即可覆盖自上次文档处理以来累积到 `main` 的所有变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：当 `main` 上一次成功的非机器人推送 CI 运行完成后，可以触发它，但如果当天 UTC 已有另一个基于 workflow-run 的调用已经运行或正在运行，它就会跳过。手动派发会绕过这个按天活动门禁。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 只进行小范围、保持覆盖率的测试性能修复，而不是大规模重构，然后重新运行完整测试套件报告，并拒绝任何降低通过基线测试数量的变更。如果基线中有失败测试，Codex 只能修复明显失败的问题，并且在提交任何内容前，智能体处理后的完整测试套件报告必须通过。当机器人推送落地前 `main` 又有新提交时，该通道会对已验证补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                             | 用途                                                                                         | 运行时机                             |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | 检测仅文档变更、变更范围、已变更扩展，并构建 CI 清单                                         | 所有非草稿推送和 PR 都会运行         |
| `security-scm-fast`              | 通过 `zizmor` 执行私钥检测和工作流审计                                                       | 所有非草稿推送和 PR 都会运行         |
| `security-dependency-audit`      | 针对 npm advisory 执行无依赖的生产 lockfile 审计                                             | 所有非草稿推送和 PR 都会运行         |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                   | 所有非草稿推送和 PR 都会运行         |
| `build-artifacts`                | 构建 `dist/`、Control UI、已构建产物检查，以及可复用的下游产物                               | 与 Node 相关的变更                   |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                            | 与 Node 相关的变更                   |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                 | 与 Node 相关的变更                   |
| `checks-node-extensions`         | 覆盖整个扩展套件的完整 bundled-plugin 测试分片                                               | 与 Node 相关的变更                   |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、bundled、契约和扩展通道                                      | 与 Node 相关的变更                   |
| `extension-fast`                 | 仅针对已变更 bundled plugin 的聚焦测试                                                       | 具有扩展变更的拉取请求               |
| `check`                          | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke                         | 与 Node 相关的变更                   |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片                                        | 与 Node 相关的变更                   |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                                        | 与 Node 相关的变更                   |
| `checks`                         | 已构建产物渠道测试的验证器，以及仅在 push 时运行的 Node 22 兼容性检查                        | 与 Node 相关的变更                   |
| `check-docs`                     | 文档格式化、lint 和失效链接检查                                                              | 文档发生变更                         |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                   | 与 Python Skills 相关的变更          |
| `checks-windows`                 | Windows 专用测试通道                                                                         | 与 Windows 相关的变更                |
| `macos-node`                     | 使用共享已构建产物的 macOS TypeScript 测试通道                                               | 与 macOS 相关的变更                  |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | 与 macOS 相关的变更                  |
| `android`                        | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建                                     | 与 Android 相关的变更                |
| `test-performance-agent`         | 在可信活动之后，每日执行一次由 Codex 驱动的慢测试优化                                        | `main` CI 成功后或手动派发           |

## 快速失败顺序

作业顺序经过安排，使便宜的检查先失败，而不是等昂贵作业启动后再失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不必等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行，这样下游消费者在共享构建就绪后即可立即启动。
4. 之后会展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围判定逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。  
CI 工作流编辑会验证 Node CI 图和工作流 lint，但仅凭这些编辑本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对平台源代码变更。  
Windows Node 检查的范围限定在 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助函数、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源代码、plugin、install-smoke 和仅测试类变更会继续留在 Linux Node 通道中，这样它们就不会为了已被常规测试分片覆盖的内容而占用 16 vCPU 的 Windows worker。  
单独的 `install-smoke` 工作流会通过其自身的 `preflight` 作业复用同一个范围脚本。它会根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 会针对安装、打包、容器相关变更、bundled extension 生产代码变更，以及 Docker smoke 作业覆盖的核心 plugin/channel/Gateway 网关/Plugin SDK 表面运行。仅测试和仅文档的编辑不会占用 Docker worker。它的 QR package smoke 会强制 Docker `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此它仍然会验证安装过程，而无需每次都重新下载依赖。它的 gateway-network e2e 会复用同一作业前面构建的运行时镜像，因此在不增加另一轮 Docker 构建的情况下，增加了真实的容器到容器 WebSocket 覆盖。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下并行运行 live/E2E smoke 通道；默认并发数为 4，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整。本地聚合作业默认会在首次失败后停止调度新的池化通道，并且每个通道都有 120 分钟超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动过程或 provider 敏感的通道会在并行池之后独占运行。可复用的 live/E2E 工作流也遵循共享镜像模式：它会在 Docker 矩阵之前构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下运行矩阵。定时的 live/E2E 工作流会每天运行完整发布路径的 Docker 套件。QR 和安装器 Docker 测试保留各自面向安装场景的 Dockerfile。另有一个独立的 `docker-e2e-fast` 作业，会在 120 秒命令超时限制下运行有边界的 bundled-plugin Docker 配置文件：包括 setup-entry 依赖修复和合成的 bundled-loader 失败隔离。完整的 bundled 更新/渠道矩阵仍然保留为手动/完整套件，因为它会重复执行真实的 npm update 和 doctor repair 流程。

本地已变更通道逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界上比宽泛的 CI 平台范围更严格：核心生产代码变更会运行核心生产类型检查加核心测试，核心仅测试变更只运行核心测试类型检查/测试，扩展生产代码变更会运行扩展生产类型检查加扩展测试，扩展仅测试变更只运行扩展测试类型检查/测试。公共 Plugin SDK 或 plugin-contract 变更会扩展到扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本升级会运行定向的版本/配置/根依赖检查。未知的根目录/配置变更会以安全优先方式落到所有通道。

在 push 上，`checks` 矩阵会添加仅在 push 时运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵则保持聚焦于常规测试/渠道通道。

最慢的 Node 测试族会被拆分或重新平衡，以便每个作业都保持较小规模，同时不过度预留 runner：渠道契约以三个加权分片运行，bundled plugin 测试会在六个扩展 worker 之间平衡分布，小型核心单元通道会两两配对，auto-reply 改为使用三个平衡 worker 而不是六个过小 worker，而智能体式 gateway/plugin 配置会分布到现有的仅源代码智能体 Node 作业中，而不是等待已构建产物。大范围的浏览器、QA、媒体和杂项 plugin 测试使用它们各自专用的 Vitest 配置，而不是共享的 plugin 兜底配置。扩展分片作业会串行运行 plugin 配置组，只使用一个 Vitest worker 和更大的 Node 堆，这样导入密集型 plugin 批次就不会让小型 CI runner 过载。广泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受导入/调度开销主导，而不是由某个单独的慢测试文件主导。`runtime-config` 会与 infra core-runtime 分片一起运行，以避免共享运行时分片独自拖尾。`check-additional` 会将 package-boundary compile/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖分离；boundary guard 分片会在单个作业内部并发运行其小型且彼此独立的守卫。Gateway watch、渠道测试以及核心 support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，于 `build-artifacts` 内并发运行；这样既保留了它们原有的检查名称作为轻量验证作业，又避免了额外两个 Blacksmith worker 和第二条产物消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源代码集或 manifest；它的单元测试通道仍会用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的推送上重复执行一次 debug APK 打包作业。  
`extension-fast` 仅在 PR 上运行，因为 push 运行已经会执行完整的 bundled plugin 分片。这样既能为代码评审保留已变更 plugin 的反馈，又不会在 `main` 上为 `checks-node-extensions` 已经覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` 引用上出现较新的推送时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但不会在整个工作流已经被替代后继续排队。  
CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 侧旧队列组中的僵尸任务就不会无限期阻塞较新的 `main` 运行。

## Runner

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早进入排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、bundled plugin 测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 的敏感度仍然高到使用 8 vCPU 的成本高于节省；install-smoke Docker 构建，在该场景下 32 vCPU 的排队时间成本高于节省                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地已变更通道分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更范围内的 typecheck/lint/tests
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 相同门禁，但包含每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI artifact/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```
