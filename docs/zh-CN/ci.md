---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或不会运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T03:28:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60f5d91f151cde13442e09341f75de6f3a2a325d467527e1f4aa33bad894a2b5
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围界定，在仅更改了不相关区域时跳过昂贵的作业。手动 `workflow_dispatch` 运行会有意绕过智能范围界定，并展开完整的常规 CI 作业图，用于候选发布或大范围验证。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标分发手动 `CI` 工作流，并分发 `OpenClaw Release Checks`，用于安装冒烟测试、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 通道。提供已发布的软件包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

`Package Acceptance` 是一个旁路运行工作流，用于验证软件包产物，而不会阻塞发布工作流。它会从受信任的 ref、已发布的 npm 规格、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball 产物中解析出一个候选项，将其作为 `package-under-test` 上传，然后复用 Docker 发布/E2E 调度器，对该 tarball 进行测试，而不是打包所选 ref。配置档涵盖 smoke、package、product、full 以及自定义 Docker 通道选择。可选的 Telegram 通道仅支持已发布的 npm，并复用 `NPM Telegram Beta E2E` 工作流。

QA Lab 在主智能范围工作流之外拥有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 更改和手动分发时运行；它构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动分发；它以并行作业方式展开模拟一致性门、live Matrix 通道和 live Telegram 通道。live 作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex leases。`OpenClaw Release Checks` 也会在发布审批前运行相同的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复 PR 清理。它默认是 dry-run，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已合并的 PR 确实已合并，并且每个重复 PR 都具有共享的引用 issue 或重叠的更改代码块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于使现有文档与最近合并的更改保持一致。它没有纯定时计划：`main` 上成功的、非机器人触发的 push CI 运行可以触发它，手动分发也可以直接运行它。工作流运行触发的调用会在 `main` 已继续前进，或过去一小时内已创建另一个未跳过的 Docs Agent 运行时跳过。当它运行时，会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累积到 `main` 的所有更改。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上成功的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 已有另一个工作流运行触发的调用已经运行或正在运行，它就会跳过。手动分发会绕过这个按天活动门控。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 仅进行小范围、保持覆盖率不变的测试性能修复，而不是进行大规模重构，然后重新运行完整测试套件报告，并拒绝会降低通过基线测试数量的更改。如果基线中存在失败测试，Codex 只能修复明显失败的问题，并且智能体执行后的完整测试套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证补丁进行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅改动文档、已更改的范围、已更改的扩展，并构建 CI 清单 | 始终在非草稿 push 和 PR 上运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 始终在非草稿 push 和 PR 上运行 |
| `security-dependency-audit` | 针对 npm advisories 执行无依赖的生产 lockfile 审计 | 始终在非草稿 push 和 PR 上运行 |
| `security-fast` | 快速安全作业的必需聚合项 | 始终在非草稿 push 和 PR 上运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建产物检查，以及可复用的下游产物 | 与 Node 相关的更改 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的更改 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的更改 |
| `checks-node-extensions` | 针对扩展套件的完整内置插件测试分片 | 与 Node 相关的更改 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置插件、契约和扩展通道 | 与 Node 相关的更改 |
| `check` | 分片后的主本地门控等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的更改 |
| `check-additional` | 架构、边界、扩展表面守卫、软件包边界和 gateway-watch 分片 | 与 Node 相关的更改 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟测试 | 与 Node 相关的更改 |
| `checks` | 已构建产物渠道测试的验证器 | 与 Node 相关的更改 |
| `checks-node-compat-node22` | Node 22 兼容性构建和冒烟通道 | 用于发布的手动 CI 分发 |
| `check-docs` | 文档格式化、lint 和失效链接检查 | 文档发生更改时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的更改 |
| `checks-windows` | Windows 专用测试通道 | 与 Windows 相关的更改 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的更改 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的更改 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的更改 |
| `test-performance-agent` | 在受信任活动后每日执行的 Codex 慢测试优化 | main CI 成功后或手动分发 |

手动 CI 分发运行与常规 CI 相同的作业图，但会强制开启所有按范围控制的通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此候选发布的完整套件不会因为同一 ref 上的另一次 push 或 PR 运行而被取消。可选的 `target_ref` 输入允许受信任调用方针对某个分支、标签或完整提交 SHA 运行该作业图，同时使用所选分发 ref 的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，以便让低成本检查先失败，再运行高成本作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，这样下游消费者一旦共享构建准备就绪即可开始。
4. 之后会展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
手动分发会跳过 changed-scope 检测，并让 preflight 清单表现得如同每个按范围控制的区域都发生了更改。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只在对应平台源码发生更改时运行。
仅涉及 CI 路由的编辑、部分选定的低成本 core-test fixture 编辑，以及狭义的插件契约辅助函数/测试路由编辑，会使用快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当前更改文件仅限于该快速任务可直接覆盖的路由或辅助表面时，这一路径会跳过构建产物、Node 22 兼容性、渠道契约、完整 Core 分片、内置插件分片和额外守卫矩阵。
Windows Node 检查的范围仅限于 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助函数、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、插件、install-smoke 和仅测试更改仍保留在 Linux Node 通道中，这样就不会为正常测试分片已经覆盖的内容占用一个 16 vCPU 的 Windows worker。
单独的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用同一个范围脚本。它将冒烟测试覆盖范围拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker/软件包表面、内置插件软件包/manifest 更改，以及 Docker smoke 作业会覆盖到的 Core 插件/渠道/Gateway 网关/插件 SDK 表面，会走快速路径。仅源码的内置插件更改、仅测试编辑和仅文档编辑不会占用 Docker workers。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents 删除共享工作区的 CLI smoke，运行容器 gateway-network e2e，验证一个内置扩展 build arg，并在 240 秒总命令超时内运行有界的内置插件 Docker 配置，同时每个场景的 Docker 运行各自有单独上限。完整路径会为夜间定时运行、手动分发、workflow-call 发布检查，以及真正触及安装器/软件包/Docker 表面的拉取请求保留 QR 软件包安装和安装器 Docker/更新覆盖。`main` 推送（包括合并提交）不会强制走完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，工作流会保留快速 Docker smoke，并将完整安装 smoke 留给夜间运行或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控；它在夜间计划和发布检查工作流中运行，手动 `install-smoke` 分发也可以选择启用它，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自以安装为重点的 Dockerfile。本地 `test:docker:all` 会预先构建一个共享 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于安装器/更新/插件依赖通道的基础 Node/Git 运行器，另一个是将同一个 tarball 安装到 `/app` 的功能镜像，用于常规功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，而运行器只执行所选计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下运行各通道；默认主池槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对 provider 敏感的尾池槽位数也默认为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm 安装和多服务通道就不会让 Docker 过度提交，而较轻通道仍可填满可用槽位。通道启动默认错开 2 秒，以避免本地 Docker 守护进程出现创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合运行会先对 Docker 做预检，移除过时的 OpenClaw E2E 容器，输出活动通道状态，持久化通道耗时以支持最长优先排序，并支持使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 检查调度器。默认情况下，在首次失败后它会停止调度新的池化通道，并且每个通道都有 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分选定的 live/tail 通道使用更严格的单通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布使用的通道，如 `install-e2e`，以及拆分后的内置更新通道，如 `bundled-channel-update-acpx`，同时跳过 cleanup smoke，以便智能体复现某个失败通道。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪种软件包、镜像类型、live 镜像、通道以及凭证覆盖范围，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub outputs 和摘要。它要么通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，要么下载调用方提供的软件包产物，验证 tarball 清单，在计划需要软件包安装型通道时构建并推送基于软件包摘要标签的 bare/functional GHCR Docker E2E 镜像，并在相同软件包摘要已准备好时复用这些镜像。发布路径 Docker 套件最多以三个分块作业运行，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取其所需的镜像类型，并通过相同的加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON，以及每个通道的重跑命令。工作流的 `docker_lanes` 输入会让所选通道针对已准备好的镜像运行，而不是运行这三个分块作业，这样失败通道的调试就限制在一个目标 Docker 作业内，并会为该次运行准备或下载软件包产物；如果所选通道是 live Docker 通道，目标作业会为该次重跑在本地构建 live-test 镜像。使用 `pnpm test:docker:rerun <run-id>` 可从某个 GitHub 运行下载 Docker 产物，并输出合并后的/按通道划分的目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢通道和阶段关键路径摘要。当发布路径套件请求 Open WebUI 时，它会在 plugins/integrations 分块内运行，而不是额外占用第四个 Docker worker；只有 openwebui-only 分发时，Open WebUI 才会保留独立作业。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵会按更新目标拆分，这样重复的 npm update 和 doctor repair 过程就可以与其他内置检查一起分片。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地检查门控在架构边界方面比宽泛的 CI 平台范围更严格：Core 生产更改会运行 core prod 和 core test 类型检查，以及 core lint/guards；Core 仅测试更改只会运行 core test 类型检查以及 core lint；扩展生产更改会运行 extension prod 和 extension test 类型检查，以及 extension lint；扩展仅测试更改会运行 extension test 类型检查以及 extension lint。公开的插件 SDK 或 plugin-contract 更改会扩展到扩展类型检查，因为扩展依赖这些 Core 契约，但 Vitest 扩展全量扫描属于显式测试工作。仅发布元数据的版本号提升会运行针对版本/配置/根依赖的定向检查。未知的根目录/配置更改会以安全优先的方式回退到所有检查通道。

手动 CI 分发会运行 `checks-node-compat-node22`，作为候选发布的兼容性覆盖。普通拉取请求和 `main` 推送会跳过该通道，并将矩阵聚焦在 Node 24 测试/渠道通道上。

最慢的 Node 测试族已被拆分或平衡，因此每个作业都保持较小规模，同时不会过度预留运行器：渠道契约以三个加权分片运行，内置插件测试在六个扩展 workers 之间平衡，小型 Core 单元通道会成对组合，auto-reply 以四个平衡 workers 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，而 agentic Gateway 网关/插件配置则分布在现有的仅源码 agentic Node 作业中，而不是等待已构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用它们各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两组插件配置，每组只用一个 Vitest worker，并提供更大的 Node heap，这样导入密集型的插件批次就不会产生额外的 CI 作业。宽泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度支配，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片拖尾。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和被过滤的分片。`check-additional` 会将 package-boundary 编译/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界守卫分片会在一个作业内部并发运行其小型独立守卫。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内并发运行，这样既保留了旧的检查名称作为轻量验证器作业，又避免了额外两个 Blacksmith workers 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的推送中重复执行 debug APK 打包作业。
当同一 PR 或 `main` ref 上有较新的推送到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被更新运行取代后继续排队。
自动 CI 并发键采用版本化形式（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消进行中的运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早进入队列 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 节省下来的成本还不如带来的额外开销；以及 install-smoke Docker 构建，在那里 32 vCPU 的排队时间成本超过其节省收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门控：按边界通道运行 changed typecheck/lint/guards
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 与上面相同的门控，但带每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:changed   # 低成本的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 失效链接检查
pnpm build          # 当 CI artifact/build-smoke 通道相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪音并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
