---
read_when:
    - 你需要了解某个 CI 作业为什么运行了，或者为什么没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-26T23:09:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: b84dd1e40ca04120d8a4a9c53e1c2cca682920e89f4f6f181d6720be7a731b91
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围门控，在只有不相关区域发生变更时跳过高开销作业。

QA Lab 在主智能范围工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更以及手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上每夜运行，并支持手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业扇出执行。实时作业使用 `qa-live-shared` environment，而 Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布批准之前运行同样的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于落地后的重复 PR 清理。它默认以 dry-run 模式运行，只有在设置 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并且验证每个重复 PR 都具有共享的引用 issue，或存在重叠的变更代码块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已落地的更改保持一致。它没有纯定时调度：在 `main` 上成功完成的一次非机器人 push CI 运行可以触发它，也可以通过手动触发直接运行。对于 workflow-run 调用，如果 `main` 已继续前进，或在最近一小时内已经创建了另一个未被跳过的 Docs Agent 运行，则会跳过。当它运行时，会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来积累在 `main` 上的所有更改。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：在 `main` 上成功完成的一次非机器人 push CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用运行过或正在运行，则会跳过。手动触发会绕过这个按天的活动门控。该通道会构建一个完整测试套件的分组 Vitest 性能报告，让 Codex 只进行小范围、保留覆盖率的测试性能修复，而不是做大范围重构；随后重新运行完整测试套件报告，并拒绝任何会降低基线通过测试数量的更改。如果基线中存在失败测试，Codex 只能修复明显的失败，而且在提交任何内容之前，智能体执行后的完整测试套件报告必须通过。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证补丁进行 rebase，重新运行 `pnpm check:changed`，并重试推送；有冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | 检测是否仅文档变更、变更范围、变更的扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisories 执行无依赖的生产 lockfile 审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、内置产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | 核心 Node 测试分片，不包含渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `extension-fast` | 仅针对已更改内置插件的聚焦测试 | 带有扩展变更的拉取请求 |
| `check` | 分片的主本地门控等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 内置 CLI smoke 测试和启动内存 smoke | 与 Node 相关的变更 |
| `checks` | 用于内置产物渠道测试以及仅 push 的 Node 22 兼容性的校验器 | 与 Node 相关的变更 |
| `check-docs` | 文档格式、lint 和坏链检查 | 文档发生变更 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享内置产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动之后进行每日 Codex 慢测试优化 | `main` CI 成功后或手动触发 |

## 快速失败顺序

作业顺序经过设计，使廉价检查能够在高开销作业运行前先失败：

1. `preflight` 决定究竟存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游消费者一旦共享构建准备就绪就可以立即开始。
4. 更重的平台和运行时通道随后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只对平台源码变更生效。
仅涉及 CI 路由的编辑、部分选定的低成本核心测试 fixture 编辑，以及狭义的插件契约 helper/测试路由编辑，会使用快速 Node-only 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当前更改仅限于该快速任务直接覆盖的路由或 helper 表面时，这一路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片以及额外守卫矩阵。
Windows Node 检查的范围限定在 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器 helper、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、插件、install-smoke 和仅测试类更改会保留在 Linux Node 通道中，从而避免为已由常规测试分片覆盖的内容占用 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker/包表面、内置插件包/manifest 变更，以及 Docker smoke 作业会覆盖到的核心插件/渠道/Gateway 网关/插件 SDK 表面，会走快速路径。仅源码层面的内置插件更改、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 gateway-network e2e，验证一个内置扩展构建参数，并在 240 秒的聚合命令超时限制下运行受限的内置插件 Docker 配置文件，同时对每个场景的 Docker 运行分别设置上限。完整路径会为夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的拉取请求保留 QR 包安装和 installer Docker/update 覆盖。推送到 `main`，包括合并提交，不会强制走完整路径；当 changed-scope 逻辑在 push 上请求完整覆盖时，工作流仍会保留快速 Docker smoke，并把完整 install smoke 留给夜间或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控；它会在夜间调度和发布检查工作流中运行，手动触发 `install-smoke` 也可以选择启用，但拉取请求和推送到 `main` 不会运行它。QR 和 installer Docker 测试保留各自专注于安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于 installer/update/plugin-dependency 通道的纯 Node/Git 运行器，另一个是功能镜像，它会把相同的 tarball 安装到 `/app` 中，用于常规功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行选定的计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整主池默认 10 个槽位，通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对 provider 敏感的尾部池默认 10 个槽位。重型通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道不会让 Docker 超额承载，而较轻的通道仍能填满可用槽位。默认情况下，通道启动会错开 2 秒，以避免本地 Docker daemon 出现 create 风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合器会先检查 Docker、移除陈旧的 OpenClaw E2E 容器、输出活动通道状态、持久化通道耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于检查调度器。默认情况下，它会在首次失败后停止调度新的池化通道，并且每个通道都有 120 分钟的后备超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分选定的 live/tail 通道使用更严格的单通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布使用的通道，例如 `install-e2e`，以及拆分后的内置更新通道，例如 `bundled-channel-update-acpx`，同时跳过 cleanup smoke，以便智能体复现单个失败通道。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些 package、镜像类型、live 镜像、通道和凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub outputs 和摘要。它通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，验证 tarball 清单，并在计划需要 install/update/plugin-dependency 通道时构建并推送一个带 SHA 标签的 bare GHCR Docker E2E 镜像；在计划需要 package-installed 功能通道时构建一个带 SHA 标签的 functional GHCR Docker E2E 镜像；如果这两类带 SHA 标签的镜像任一已存在，工作流会跳过该镜像的重建，但仍会创建定向重跑所需的新 tarball 产物。发布路径 Docker 套件最多以三个分块作业运行，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取自己需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON 以及每个通道的重跑命令。工作流输入 `docker_lanes` 会让所选通道针对已准备好的镜像运行，而不是运行这三个分块作业，这样就能把失败通道调试限制在一个定向 Docker 作业中，并为选定的 ref 准备新的 npm tarball；如果选定通道是一个 live Docker 通道，则该定向作业会为该次重跑在本地构建 live-test 镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub 某次运行下载 Docker 产物，并打印组合后的/按通道划分的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢通道与阶段关键路径摘要。当在发布路径套件中请求 Open WebUI 时，它会在 plugins/integrations 分块中运行，而不是占用第四个 Docker worker；只有 openwebui-only 触发时，Open WebUI 才保留独立作业。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵会按更新目标拆分，这样重复的 npm update 和 doctor repair 过程就能与其他内置检查并行分片。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地检查门控在架构边界方面比宽泛的 CI 平台范围更严格：核心生产更改会运行核心生产和核心测试 typecheck，以及核心 lint/guards；核心仅测试更改只运行核心测试 typecheck 加核心 lint；扩展生产更改会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展仅测试更改会运行扩展测试 typecheck 加扩展 lint。公共插件 SDK 或插件契约更改会扩展到扩展 typecheck，因为扩展依赖这些核心契约，但 Vitest 扩展全量测试属于显式测试工作。仅发布元数据的版本号提升会运行定向的版本/配置/根依赖检查。未知的根目录/配置变更会以安全优先的方式退回到所有检查通道。

在 push 时，`checks` 矩阵会增加仅 push 运行的 `compat-node22` 通道。在拉取请求中，该通道会被跳过，矩阵会继续聚焦于常规测试/渠道通道。

最慢的 Node 测试族会被拆分或均衡，以便每个作业都保持较小规模，同时不过度占用运行器：渠道契约作为三个加权分片运行，内置插件测试在六个扩展 worker 之间均衡，小型核心单元通道会成对组合，auto-reply 作为四个均衡 worker 运行，并把 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，而 agentic Gateway 网关/插件配置则分布到现有的仅源码 agentic Node 作业中，而不是等待内置产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并分配更大的 Node heap，这样导入密集型插件批次就不会额外创建更多 CI 作业。广泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度支配，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片成为尾部瓶颈。包含模式分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 能区分整个配置与经过过滤的分片。`check-additional` 会把 package-boundary 的编译/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖分离；boundary guard 分片会在一个作业内部并发运行其小型独立守卫。Gateway watch、渠道测试和核心 support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内部并发运行，从而保持它们原有的检查名称作为轻量级校验作业，同时避免再占用两个额外的 Blacksmith worker 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上重复进行 debug APK 打包作业。
`extension-fast` 仅用于 PR，因为 push 运行已经执行完整的内置插件分片。这样可以在评审期间提供已变更插件的反馈，同时不会在 `main` 上为 `checks-node-extensions` 已经覆盖的内容额外占用一个 Blacksmith worker。

当同一个 PR 或 `main` ref 上有较新的 push 到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一 ref 的最新一次运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。
CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸任务不会无限期阻塞较新的 `main` 运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合、Node 测试聚合校验器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然足够依赖 CPU，以至于 8 vCPU 节省下来的成本反而不划算；install-smoke Docker 构建，在那里 32 vCPU 的排队时间成本高于它带来的收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门控：按边界通道执行变更相关的 typecheck/lint/guards
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 同样的门控，但附带每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:changed   # 低成本的智能变更 Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链检查
pnpm build          # 当 CI 产物/build-smoke 通道相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢的作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪音，并选择 origin/main 的 push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
