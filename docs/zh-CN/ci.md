---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及对应的本地命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-24T07:42:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 489ac05725a316b25f56f7f754d6a8652abbd60481fbe6e692572b81581fe405
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围界定，在只改动无关区域时跳过高开销作业。

QA Lab 在主智能范围工作流之外有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道并行扇出为多个作业。实时作业使用 `qa-live-shared` environment，Telegram 通道使用 Convex leases。`OpenClaw Release Checks` 也会在发布批准前运行相同的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复 PR 清理。它默认以 dry-run 方式运行，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并确认每个重复 PR 要么引用了相同的问题，要么存在重叠的变更 hunk。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的更改保持一致。它没有纯定时调度：当 `main` 上一次成功的非机器人推送 CI 运行完成后，可以触发它；也可以通过手动触发直接运行。由 workflow-run 触发的调用会在 `main` 已继续前进，或过去一小时内已创建过另一个未跳过的 Docs Agent 运行时跳过。当它运行时，会审查从上一次未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来积累的所有 `main` 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢速测试。它没有纯定时调度：当 `main` 上一次成功的非机器人推送 CI 运行完成后，可以触发它，但如果该 UTC 日期内已有另一个 workflow-run 调用已经运行或仍在运行，它就会跳过。手动触发会绕过这个按天计的活动门禁。该通道会构建一个完整测试套件的分组 Vitest 性能报告，让 Codex 只进行小范围、保持覆盖率的测试性能修复，而不是大规模重构；然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的更改。如果基线中已有失败测试，Codex 只能修复明显失败的问题，并且 agent 处理后的完整测试套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就可以与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| Job                              | 用途                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测是否仅改动 docs、变更范围、已变更 extensions，并构建 CI manifest                         | 所有非草稿 push 和 PR 都会运行     |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 所有非草稿 push 和 PR 都会运行     |
| `security-dependency-audit`      | 针对 npm advisories 的无依赖生产 lockfile 审计                                               | 所有非草稿 push 和 PR 都会运行     |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                   | 所有非草稿 push 和 PR 都会运行     |
| `build-artifacts`                | 构建 `dist/`、Control UI、内置产物检查以及可复用的下游产物                                   | 与 Node 相关的变更                 |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                            | 与 Node 相关的变更                 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                 | 与 Node 相关的变更                 |
| `checks-node-extensions`         | 对整个 extension 套件运行完整的内置插件测试分片                                              | 与 Node 相关的变更                 |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和 extension 通道                                  | 与 Node 相关的变更                 |
| `extension-fast`                 | 仅针对已变更内置插件的聚焦测试                                                               | 带有 extension 变更的拉取请求      |
| `check`                          | 分片后的主本地门禁等价项：生产类型、lint、guard、测试类型和严格 smoke                        | 与 Node 相关的变更                 |
| `check-additional`               | 架构、边界、extension-surface guard、package-boundary 和 gateway-watch 分片                  | 与 Node 相关的变更                 |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                     | 与 Node 相关的变更                 |
| `checks`                         | 已构建产物渠道测试的验证器，以及仅 push 时运行的 Node 22 兼容性检查                          | 与 Node 相关的变更                 |
| `check-docs`                     | docs 格式、lint 和损坏链接检查                                                               | docs 有变更时                      |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                                 | 与 Python Skills 相关的变更        |
| `checks-windows`                 | Windows 专用测试通道                                                                         | 与 Windows 相关的变更              |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                 | 与 macOS 相关的变更                |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | 与 macOS 相关的变更                |
| `android`                        | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建                                     | 与 Android 相关的变更              |
| `test-performance-agent`         | 在可信活动之后每日运行的 Codex 慢速测试优化                                                  | 主 CI 成功后或手动触发             |

## 快速失败顺序

作业的排序方式是让廉价检查先失败，避免昂贵作业继续运行：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，这样下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 运行的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会校验 Node CI 图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对平台源码变更进行范围界定。
Windows Node 检查的范围限定于 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、plugin、install-smoke 和仅测试变更仍然会留在 Linux Node 通道中，因此不会为了已经由常规测试分片覆盖的内容而占用 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。拉取请求会对 Docker/package 表面、内置 plugin package/manifest 变更，以及 Docker smoke 作业会覆盖到的 core plugin/channel/Gateway 网关/插件 SDK 表面运行快速路径。仅源码的内置插件变更、仅测试编辑以及仅 docs 编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像、检查 CLI、运行容器 gateway-network e2e、验证一个内置 extension build arg，并在 120 秒命令超时下运行受限的内置插件 Docker profile。完整路径保留 QR package install 以及 installer Docker/update 覆盖，用于每晚定时运行、手动触发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的拉取请求。推送到 `main`（包括 merge commit）不会强制走完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，该工作流仍只保留快速 Docker smoke，而将完整安装 smoke 留给夜间或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控；它会在夜间调度和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但拉取请求和推送到 `main` 时不会运行。QR 和 installer Docker 测试保留它们自己的安装专用 Dockerfile。本地 `test:docker:all` 会先构建一个共享 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下并行运行 live/E2E smoke 通道；默认主池并发数为 8，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；provider 敏感的尾池并发数默认为 8，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。默认情况下，各通道启动会错开 2 秒，以避免本地 Docker daemon 在创建时出现风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合器默认会在第一次失败后停止调度新的池化通道，并且每个通道都有一个 120 分钟的超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。可复用的 live/E2E 工作流也采用共享镜像模式：在 Docker 矩阵开始之前构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行矩阵。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。完整的内置 update/channel 矩阵仍然保持为手动/全套模式，因为它会重复执行真实的 npm update 和 doctor repair 过程。

本地已变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台范围更严格：core 生产变更会运行 core prod typecheck 加 core tests，core 仅测试变更只运行 core 测试 typecheck/tests，extension 生产变更会运行 extension prod typecheck 加 extension tests，而 extension 仅测试变更只运行 extension 测试 typecheck/tests。公开的插件 SDK 或 plugin-contract 变更会扩展到 extension 验证，因为 extensions 依赖这些 core 契约。仅包含发布元数据的版本号变更会运行有针对性的 version/config/root-dependency 检查。未知的 root/config 变更会以安全优先方式回退到所有通道。

在 push 时，`checks` 矩阵会增加仅 push 运行的 `compat-node22` 通道。在拉取请求中，该通道会被跳过，矩阵会保持聚焦于常规测试/渠道通道。

最慢的 Node 测试族已被拆分或做了均衡，以便每个作业都保持较小规模，同时不过度预留 runner：渠道契约按权重拆成三个分片，内置插件测试在六个 extension worker 之间均衡分配，小型 core 单元通道成对组合，auto-reply 改为三个均衡 worker 而不是六个很小的 worker，而 agentic Gateway 网关/plugin 配置则分散到现有仅源码的 agentic Node 作业中，而不是等待已构建产物。宽范围的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。Extension 分片作业会以串行方式运行 plugin 配置组，使用一个 Vitest worker 和更大的 Node heap，这样导入负载较重的插件批次就不会让小型 CI runner 过载。宽范围的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它的瓶颈主要是导入/调度，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享 runtime 分片独自承担尾部耗时。`check-additional` 将 package-boundary compile/canary 工作保持在一起，并将 runtime topology architecture 与 gateway watch 覆盖拆开；boundary guard 分片会在一个作业内部并发运行其小型、彼此独立的 guard。Gateway watch、渠道测试和 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，于 `build-artifacts` 内部并发运行；这样既保留了它们原有的 check 名称作为轻量验证作业，又避免了额外占用两个 Blacksmith worker 以及第二条 artifact-consumer 队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会在启用 SMS/call-log `BuildConfig` 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的推送中重复执行 debug APK 打包作业。
`extension-fast` 仅在 PR 中运行，因为 push 运行已经会执行完整的内置插件分片。这样既能为评审提供已变更插件的反馈，又不会在 `main` 上为了 `checks-node-extensions` 中已经存在的覆盖而额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` ref 上有更新的推送到达时，GitHub 可能会把被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败了，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，这样它们仍会报告正常的分片失败，但在整个工作流已经被更新运行取代后不会继续排队。
CI 并发键采用版本化形式（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 `main` 运行。

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然足够依赖 CPU，使用 8 vCPU 的成本高于节省的收益；install-smoke Docker 构建，在这里 32 vCPU 的排队时间成本高于节省的收益                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |

## 本地等价命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地已变更通道分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行已变更的 typecheck/lint/tests
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 同样的门禁，但包含各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs 格式 + lint + 损坏链接
pnpm build          # 当 CI artifact/build-smoke 通道相关时构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
