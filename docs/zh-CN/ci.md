---
read_when:
    - 你需要了解某个 CI 作业为什么运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-24T19:56:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8407768803b8d92e03a7fb453307a64cb4f2342ba3894b51d4c928dd434fede6
    source_path: ci.md
    workflow: 15
---

CI 会在每次向 `main` 推送以及每个拉取请求时运行。它使用智能范围界定，在仅更改了无关区域时跳过高开销作业。

QA Lab 在主智能范围界定工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 agentic pack。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道拆分为并行作业。实时作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布审批前运行同样的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复 PR 清理。它默认以 dry-run 模式运行，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 是否已合并，以及每个重复 PR 是否具有共享的引用 issue 或重叠的变更块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已落地的更改保持一致。它没有纯定时调度：当 `main` 上一次成功的、非机器人触发的 push CI 运行完成后，可以触发它；也可以通过手动触发直接运行。对于由 workflow-run 触发的调用，如果 `main` 已经继续前进，或者在最近一小时内已经创建了另一个未被跳过的 Docs Agent 运行，则会跳过。当它运行时，会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时的一次运行可以覆盖自上次文档处理以来累计到 `main` 的所有更改。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：当 `main` 上一次成功的、非机器人触发的 push CI 运行完成后，可以触发它，但如果当天 UTC 内已有另一个 workflow-run 调用已经运行或正在运行，则会跳过。手动触发会绕过这个每日活动门控。该通道会构建完整测试套件分组的 Vitest 性能报告，让 Codex 仅进行小范围、保留覆盖率的测试性能修复，而不是大范围重构，然后重新运行完整测试套件报告，并拒绝会降低通过基线测试数量的更改。如果基线中存在失败测试，Codex 只能修复明显的失败项，并且在提交任何内容之前，agent 处理后的完整测试套件报告必须通过。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅为文档更改、已更改范围、已更改扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisories 执行无依赖的生产 lockfile 审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建产物检查，以及可复用的下游产物 | 与 Node 相关的更改 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的更改 |
| `checks-fast-contracts-channels` | 分片的 channel contract 检查，并提供稳定的聚合检查结果 | 与 Node 相关的更改 |
| `checks-node-extensions` | 面向整个扩展套件的完整 bundled plugin 测试分片 | 与 Node 相关的更改 |
| `checks-node-core-test` | 核心 Node 测试分片，不包括 channel、bundled、contract 和 extension 通道 | 与 Node 相关的更改 |
| `extension-fast` | 仅针对已更改 bundled plugin 的聚焦测试 | 带有扩展更改的拉取请求 |
| `check` | 分片的主本地门控等效项：生产类型、lint、guards、测试类型和严格 smoke | 与 Node 相关的更改 |
| `check-additional` | 架构、边界、扩展表面保护、package-boundary 和 gateway-watch 分片 | 与 Node 相关的更改 |
| `build-smoke` | 已构建 CLI smoke 测试和启动内存 smoke | 与 Node 相关的更改 |
| `checks` | 已构建产物 channel 测试以及仅 push 时的 Node 22 兼容性验证器 | 与 Node 相关的更改 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生更改 |
| `skills-python` | 面向 Python 支持 Skills 的 Ruff + pytest | 与 Python Skills 相关的更改 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的更改 |
| `macos-node` | 使用共享已构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的更改 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的更改 |
| `android` | 两种 flavor 的 Android 单元测试，加上一次 debug APK 构建 | 与 Android 相关的更改 |
| `test-performance-agent` | 在可信活动后每日进行的 Codex 慢测试优化 | `main` CI 成功后或手动触发 |

## 快速失败顺序

作业的排列方式是让廉价检查先失败，再运行高开销作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行，这样下游消费者可以在共享构建就绪后立即开始。
4. 之后会展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但仅凭这些编辑本身并不会强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然仅限于平台源码更改。
Windows Node 检查的范围仅限于 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、plugin、install-smoke 和纯测试更改会继续留在 Linux Node 通道中，因此不会为那些已经由常规测试分片覆盖的内容占用一台 16-vCPU 的 Windows worker。
单独的 `install-smoke` 工作流通过其自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。拉取请求会针对 Docker/package 表面、bundled plugin package/manifest 更改，以及 Docker smoke 作业会覆盖的核心 plugin/channel/gateway/插件 SDK 表面运行快速路径。仅源码的 bundled plugin 更改、纯测试编辑和纯文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行容器 gateway-network e2e，验证一个 bundled extension 构建参数，并在 120 秒命令超时限制下运行受限的 bundled plugin Docker 配置。完整路径会为每晚定时运行、手动触发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的拉取请求，保留 QR package 安装和 installer Docker/update 覆盖。对 `main` 的推送（包括 merge commit）不会强制走完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，工作流仍保留快速 Docker smoke，而将完整安装 smoke 留给每晚或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控；它会在每晚调度和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但拉取请求和对 `main` 的推送不会运行它。QR 和 installer Docker 测试继续保留各自专用的以安装为重点的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后使用加权调度器和 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 live/E2E smoke 通道；默认主池槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；provider 敏感的尾池槽位数默认为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=5`，这样 npm install 和多服务通道不会过度占用 Docker，而较轻的通道仍能填满可用槽位。默认会将通道启动错开 2 秒，以避免本地 Docker daemon 出现创建风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合器默认在首次失败后停止调度新的池化通道，并且每个通道都有一个 120 分钟的超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。可复用的 live/E2E 工作流也沿用了共享镜像模式：在 Docker 矩阵之前先构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行矩阵。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。完整的 bundled update/channel 矩阵仍然保持为手动/完整套件，因为它会反复执行真实的 npm update 和 Doctor 修复流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地门控在架构边界方面比宽泛的 CI 平台范围更严格：核心生产更改会运行核心生产 typecheck 加核心测试，核心仅测试更改只运行核心测试 typecheck/测试，扩展生产更改会运行扩展生产 typecheck 加扩展测试，而扩展仅测试更改只运行扩展测试 typecheck/测试。公共插件 SDK 或 plugin-contract 更改会扩展到扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本号提升会运行针对性的版本/配置/根依赖检查。未知的根目录/配置更改会以安全优先方式落到所有通道。

在 push 上，`checks` 矩阵会增加仅 push 的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵会继续聚焦于常规测试/channel 通道。

最慢的 Node 测试族会被拆分或平衡，以便每个作业都保持较小规模而不额外占用 runner：channel contracts 会作为三个加权分片运行，bundled plugin 测试会在六个扩展 worker 之间平衡，小型核心单元通道会成对组合，auto-reply 会作为三个平衡 worker 运行而不是六个过小的 worker，agentic Gateway 网关/plugin 配置会分布到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。广泛的浏览器、QA、媒体和杂项 plugin 测试会使用各自专用的 Vitest 配置，而不是共享的 plugin 通用兜底配置。扩展分片作业一次最多运行两个 plugin 配置组，每组使用一个 Vitest worker，并配备更大的 Node heap，这样导入开销大的 plugin 批次就不会产生额外的 CI 作业。宽泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受导入/调度支配，而不是由某个单独的慢测试文件主导。`runtime-config` 会与 infra core-runtime 分片一起运行，以避免共享运行时分片拖尾。`check-additional` 会将 package-boundary compile/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界保护分片会在一个作业内部并发运行其较小且彼此独立的保护项。Gateway watch、channel 测试以及核心 support-boundary 分片会在 `build-artifacts` 内部并发运行，此时 `dist/` 和 `dist-runtime/` 已经构建完成，从而在保留原有检查名称作为轻量验证作业的同时，避免额外占用两个 Blacksmith worker 和第二条产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试通道仍会使用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。
`extension-fast` 仅用于 PR，因为 push 运行已经会执行完整的 bundled plugin 分片。这样既能为代码审查提供已更改 plugin 的反馈，又不会在 `main` 上额外占用一个 Blacksmith worker 去覆盖 `checks-node-extensions` 中已经存在的内容。

当同一个 PR 或 `main` 引用上有新的 push 落地时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键是带版本号的（`CI-v7-*`），这样 GitHub 侧旧队列组中的僵尸任务就不会无限期阻塞较新的 `main` 运行。

## Runner

| Runner | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的 channel contract 检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；`install-smoke` preflight 也使用 GitHub 托管 Ubuntu，这样 Blacksmith 矩阵就能更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、bundled plugin 测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 的敏感度仍然足够高，以至于 8 vCPU 的成本高于节省；`install-smoke` Docker 构建也是如此，其中 32-vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效项

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门控：按边界通道运行变更相关的 typecheck/lint/测试
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门控，但带每个阶段的耗时统计
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 产物/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 `main` CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
