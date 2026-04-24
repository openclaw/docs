---
read_when:
    - 你需要了解为什么某个 CI 作业会运行或不会运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-24T23:09:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: bfcd687e6555b15ddebe3c061a814911d4f8a49c0db1c42aff357976a82bbbd5
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围控制，在仅更改了无关区域时跳过开销较大的作业。

QA Lab 在主智能范围工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更以及手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也支持手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业扇出执行。实时作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布批准前运行同样的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并后进行重复项清理的手动工作流。它默认以 dry-run 模式运行，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并确认每个重复 PR 要么共享同一个被引用的问题，要么存在重叠的变更代码块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已合并的更改保持一致。它没有纯定时调度：当 `main` 上成功完成一次非机器人触发的 push CI 运行后，可以触发它；也可以通过手动触发直接运行。通过 workflow-run 调用时，如果 `main` 已经继续前进，或最近一小时内已经创建了另一个未被跳过的 Docs Agent 运行，它就会跳过。当它运行时，会审查从上一次未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时的一次运行可以覆盖自上次文档处理以来累计在 `main` 上的所有更改。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：当 `main` 上成功完成一次非机器人触发的 push CI 运行后，可以触发它，但如果当天 UTC 时间内已有另一个 workflow-run 调用已经运行或正在运行，它就会跳过。手动触发会绕过这个按天的活动门禁。该通道会构建一个完整测试套件分组的 Vitest 性能报告，让 Codex 只进行小范围、保持覆盖率不变的测试性能修复，而不是做大范围重构，然后再次运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的更改。如果基线本身存在失败测试，Codex 只能修复明显的失败项，而且在提交任何内容之前，agent 处理后的完整测试套件报告必须通过。当 `main` 在机器人推送落地之前继续前进时，该通道会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，以便 Codex action 能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅更改文档、已更改范围、已更改扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无依赖的生产 lockfile 审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、内置产物检查，以及可复用的下游产物 | 与 Node 相关的更改 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的更改 |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的更改 |
| `checks-node-extensions` | 覆盖整个扩展套件的完整内置插件测试分片 | 与 Node 相关的更改 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的更改 |
| `extension-fast` | 仅针对已更改的内置插件执行聚焦测试 | 具有扩展更改的拉取请求 |
| `check` | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的更改 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的更改 |
| `build-smoke` | 内置 CLI smoke 测试和启动内存 smoke 测试 | 与 Node 相关的更改 |
| `checks` | 用于内置产物渠道测试以及仅 push 的 Node 22 兼容性的校验器 | 与 Node 相关的更改 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档有更改时 |
| `skills-python` | 针对 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的更改 |
| `checks-windows` | Windows 特定测试通道 | 与 Windows 相关的更改 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的更改 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的更改 |
| `android` | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的更改 |
| `test-performance-agent` | 在可信活动之后进行每日 Codex 慢测试优化 | 主 CI 成功后或手动触发 |

## 快速失败顺序

作业的排序方式是让低成本检查先失败，避免高成本作业启动：

1. `preflight` 决定到底有哪些通道会存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行，这样下游消费者一旦共享构建准备好就可以开始。
4. 更重的平台和运行时通道会在此之后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只在平台源码发生更改时才会运行。
Windows Node 检查的范围限定在 Windows 特有的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、install-smoke 和仅测试更改仍然保留在 Linux Node 通道中，因此不会为了已经由常规测试分片覆盖的内容而占用一个 16 vCPU 的 Windows worker。
单独的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker/包表面、内置插件包/manifest 更改，以及 Docker smoke 作业会覆盖到的核心插件/渠道/Gateway 网关/插件 SDK 表面，会运行快速路径。仅源码级的内置插件更改、仅测试更改和仅文档更改不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行容器 gateway-network e2e，验证一个内置扩展 build arg，并在 120 秒命令超时限制下运行受限的 bundled-plugin Docker 配置。完整路径则保留 QR 包安装以及 installer Docker/update 覆盖，用于每晚定时运行、手动触发、workflow-call 发布检查，以及确实涉及 installer/package/Docker 表面的拉取请求。推送到 `main`，包括合并提交，不会强制走完整路径；当 changed-scope 逻辑在一次 push 中本应请求完整覆盖时，该工作流仍只保留快速 Docker smoke，而将完整 install smoke 留给夜间运行或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独控制；它会在夜间调度和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但拉取请求和推送到 `main` 时不会运行。QR 和 installer Docker 测试保留它们各自专注于安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后使用加权调度器和 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 live/E2E smoke 通道；默认的主池槽位数 10 可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整，provider 敏感的尾池槽位数 10 可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=5`，以便 npm install 和多服务通道不会让 Docker 过载，同时较轻的通道仍能填满可用槽位。默认情况下，各通道启动会错开 2 秒，以避免本地 Docker 守护进程在创建阶段出现风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合器会预先检查 Docker，移除过期的 OpenClaw E2E 容器，输出活动通道状态，持久化通道耗时以支持按最长优先排序，并支持使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在第一次失败后停止调度新的池化通道，并且每个通道都有一个 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 通道使用更严格的单通道限制。可复用的 live/E2E 工作流也遵循共享镜像模式：它会在 Docker 矩阵开始前先构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后在矩阵中使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，这样重复的 npm update 和 doctor repair 流程就可以与其他内置检查一起分片执行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比广义的 CI 平台范围更严格：核心生产代码更改会运行 core prod typecheck 加上 core tests，核心仅测试更改只运行 core test typecheck/tests，扩展生产代码更改会运行 extension prod typecheck 加上 extension tests，而扩展仅测试更改只运行 extension test typecheck/tests。公开的插件 SDK 或 plugin-contract 更改会扩大为扩展验证，因为扩展依赖这些核心契约。仅发布元数据的版本号变更会运行有针对性的 version/config/root-dependency 检查。未知的 root/config 更改会以安全优先方式落到所有通道。

在 push 上，`checks` 矩阵会增加仅在 push 上运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵仍聚焦于常规的测试/渠道通道。

最慢的 Node 测试族会被拆分或重新平衡，以便每个作业都保持较小规模而不会过度占用运行器：渠道契约会作为三个加权分片运行，内置插件测试会在六个扩展 worker 之间平衡分配，小型核心单元测试通道会配对执行，自动回复以三个平衡 worker 运行而不是六个很小的 worker，agentic Gateway 网关/插件配置则分散到现有的仅源码 agentic Node 作业中，而不是等待内置产物。广义的浏览器、QA、媒体和杂项插件测试使用它们各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业每次最多运行两组插件配置，每组使用一个 Vitest worker，并分配更大的 Node 堆内存，这样导入负载较重的插件批次就不会制造额外的 CI 作业。广义的 agents 通道使用共享的 Vitest 文件并行调度器，因为它的瓶颈主要在导入/调度，而不是某个单独特别慢的测试文件。`runtime-config` 会和 infra core-runtime 分片一起运行，以避免共享运行时分片独自拖尾。`check-additional` 会将 package-boundary compile/canary 工作保持在一起，并把运行时拓扑架构与 gateway watch 覆盖拆开；boundary guard 分片会在一个作业内部并发运行其小型独立守卫。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内部并发运行，同时保留它们原有的检查名称作为轻量校验作业，从而避免额外占用两个 Blacksmith worker 和第二条产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/call-log `BuildConfig` 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。
`extension-fast` 仅在 PR 上运行，因为 push 运行已经会执行完整的内置插件分片。这样既能为代码审查保留已更改插件的反馈，又不会在 `main` 上为 `checks-node-extensions` 已经覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` 引用上有新的 push 落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用上的最新运行也在失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被更新运行取代后继续排队。
CI 并发键采用带版本号的形式（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞更新的 main 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合项、Node 测试聚合校验器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 的敏感度仍然高到使用 8 vCPU 的成本高于收益；install-smoke Docker 构建，在这里 32 vCPU 的排队时间成本高于收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的 typecheck/lint/tests
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 同样的门禁，但附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 的 artifact/build-smoke 通道相关时构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队耗时和最慢的作业
node scripts/ci-run-timings.mjs --recent 10   # 对比最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布通道](/zh-CN/install/development-channels)
