---
read_when:
    - 你需要了解为什么某个 CI 作业会运行或不会运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T01:05:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03c982cae6268add8db5f03a5de8d73658c23f7bb734cea8ba0a894f78c7ad72
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围判定，在只有不相关区域发生变更时跳过高开销作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能范围判定，并展开完整的常规 CI 作业图，用于候选发布或大范围验证。

`Full Release Validation` 是一个手动总控工作流，用于“在发布前运行所有内容”。它接受分支、标签或完整提交 SHA，使用该目标派发手动 `CI` 工作流，并派发 `OpenClaw Release Checks`，以运行安装冒烟测试、Docker 发布路径测试套件、live/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 通道。提供已发布的软件包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

QA Lab 在主智能范围工作流之外有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动派发时运行；它构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 agentic pack。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动派发；它会将模拟 parity gate、live Matrix 通道和 live Telegram 通道作为并行作业展开。live 作业使用 `qa-live-shared` 环境，Telegram 通道使用 Convex lease。`OpenClaw Release Checks` 也会在发布审批前运行相同的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复 PR 清理。它默认采用 dry-run，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并且每个重复 PR 都具有共享的被引用 issue 或重叠的变更 hunk。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时计划：`main` 上一次成功的非机器人 push CI 运行可以触发它，手动派发也可以直接运行它。workflow-run 调用会在 `main` 已继续前进，或最近一小时内已创建另一个未跳过的 Docs Agent 运行时跳过。运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次运行就可以覆盖自上次文档处理以来积累的全部 `main` 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上一次成功的非机器人 push CI 运行可以触发它，但如果当天 UTC 已有另一个 workflow-run 调用正在运行或已经运行过，它就会跳过。手动派发会绕过这一每日活动门禁。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 只做小范围、保留覆盖率的测试性能修复，而不是大范围重构，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显的失败；且在提交任何内容之前，智能体运行后的完整测试套件报告必须通过。当 `main` 在机器人推送落地前继续前进时，该通道会变基已验证补丁、重新运行 `pnpm check:changed`，并重试推送；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，以便 Codex action 能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| Job                              | 目的                                                                                         | 运行时机                          |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更的扩展，并构建 CI 清单                                         | 所有非草稿 push 和 PR 都会运行    |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                      | 所有非草稿 push 和 PR 都会运行    |
| `security-dependency-audit`      | 针对 npm advisory 进行无依赖的生产 lockfile 审计                                             | 所有非草稿 push 和 PR 都会运行    |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                   | 所有非草稿 push 和 PR 都会运行    |
| `build-artifacts`                | 构建 `dist/`、Control UI、内置产物检查，以及可复用的下游产物                                  | 与 Node 相关的变更                |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置 / plugin-contract / protocol 检查                            | 与 Node 相关的变更                |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                 | 与 Node 相关的变更                |
| `checks-node-extensions`         | 针对整个扩展套件的完整内置插件测试分片                                                       | 与 Node 相关的变更                |
| `checks-node-core-test`          | Node 核心测试分片，不包括渠道、内置、契约和扩展通道                                          | 与 Node 相关的变更                |
| `check`                          | 分片的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格冒烟测试                         | 与 Node 相关的变更                |
| `check-additional`               | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片                                      | 与 Node 相关的变更                |
| `build-smoke`                    | 已构建 CLI 冒烟测试和启动内存冒烟测试                                                        | 与 Node 相关的变更                |
| `checks`                         | 已构建产物渠道测试的验证器                                                                   | 与 Node 相关的变更                |
| `checks-node-compat-node22`      | Node 22 兼容性构建与冒烟测试通道                                                             | 用于发布的手动 CI 派发            |
| `check-docs`                     | 文档格式、lint 和坏链检查                                                                    | 文档发生变更时                    |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                   | 与 Python Skills 相关的变更       |
| `checks-windows`                 | Windows 专用测试通道                                                                         | 与 Windows 相关的变更             |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                 | 与 macOS 相关的变更               |
| `macos-swift`                    | macOS 应用的 Swift lint、构建与测试                                                          | 与 macOS 相关的变更               |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建                                     | 与 Android 相关的变更             |
| `test-performance-agent`         | 在可信活动之后每日运行的 Codex 慢测试优化                                                    | `main` CI 成功后或手动派发        |

手动 CI 派发会运行与常规 CI 相同的作业图，但会强制开启所有按范围控制的通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此候选发布的完整测试套件不会因同一 ref 上的其他 push 或 PR 运行而被取消。可选的 `target_ref` 输入允许受信任的调用方针对某个分支、标签或完整提交 SHA 运行该作业图，同时使用所选派发 ref 对应的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，以便廉价检查先失败，避免昂贵作业启动：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，因此下游使用方可以在共享构建就绪后立即启动。
4. 之后会展开更重的平台与运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动派发会跳过 changed-scope 检测，并让 preflight 清单表现得像所有按范围控制的区域都已发生变更。

CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅凭这些改动就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只根据平台源代码变更来决定是否运行。

仅涉及 CI 路由的编辑、部分精选的低成本 core-test fixture 编辑，以及窄范围的 plugin contract helper / test-routing 编辑，会使用快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当前变更文件仅限于快速任务可直接覆盖的路由或 helper 表面时，这一路径会避开构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片以及附加守卫矩阵。

Windows Node 检查的范围限定在 Windows 专用的进程 / 路径包装器、npm / pnpm / UI runner helper、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源代码、插件、install-smoke 和仅测试改动会保留在 Linux Node 通道中，这样就不会为了已由常规测试分片覆盖的内容而占用一个 16 vCPU 的 Windows worker。

单独的 `install-smoke` 工作流通过其自己的 `preflight` 作业复用同一个范围脚本。它将冒烟测试覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于 PR，如果变更涉及 Docker / package 表面、内置插件 package / manifest 变更，以及 Docker 冒烟作业所覆盖的核心 plugin / channel / Gateway 网关 / 插件 SDK 表面，就会运行快速路径。仅源代码的内置插件改动、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟测试，运行容器 `gateway-network` e2e，验证内置扩展 build arg，并在总命令超时 240 秒限制下运行有界的内置插件 Docker profile，同时每个场景的 Docker 运行还有各自的独立上限。完整路径则保留 QR package 安装和 installer Docker / 更新覆盖，用于夜间定时运行、手动派发、workflow-call 发布检查，以及真正触及 installer / package / Docker 表面的 PR。推送到 `main`，包括合并提交，不会强制完整路径；当 changed-scope 逻辑会在 push 中请求完整覆盖时，工作流仍保留快速 Docker 冒烟测试，而将完整安装冒烟测试留给夜间运行或发布验证。较慢的 Bun 全局安装 image-provider 冒烟测试由单独的 `run_bun_global_install_smoke` 门禁控制；它会在夜间计划任务和发布检查工作流中运行，手动 `install-smoke` 派发也可以选择启用，但 PR 和 `main` push 不会运行它。QR 和 installer Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于 installer / update / plugin-dependency 通道的基础 Node / Git runner，另一个是功能镜像，会把同一个 tarball 安装到 `/app` 中，用于常规功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，而 runner 只执行选定的计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行各通道；默认 main-pool 槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对 provider 敏感的 tail-pool 槽位数默认也为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道的默认上限分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，以避免 npm install 和多服务通道过度占用 Docker，同时让较轻的通道继续填满可用槽位。默认情况下，各通道启动会错开 2 秒，以避免本地 Docker daemon 出现 create 风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合运行会先检查 Docker，移除陈旧的 OpenClaw Docker E2E 容器，输出活动通道状态，持久化通道耗时以支持最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 以便检查调度器。默认情况下，它会在首次失败后停止调度新的池化通道，并且每个通道都有 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分选定的 live / tail 通道使用更严格的每通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布使用的通道，如 `install-e2e`，以及拆分后的内置更新通道，如 `bundled-channel-update-acpx`，同时跳过 cleanup smoke，以便智能体复现某一条失败通道。可复用的 live/E2E 工作流会先通过 `scripts/test-docker-all.mjs --plan-json` 询问需要哪些 package、镜像类型、live 镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，验证 tarball 清单；当计划需要 install / update / plugin-dependency 通道时，会构建并推送一个以 SHA 标记的 bare GHCR Docker E2E 镜像；当计划需要 package-installed 功能通道时，会构建一个以 SHA 标记的 functional GHCR Docker E2E 镜像；如果任一以 SHA 标记的镜像已存在，工作流会跳过该镜像的重建，但仍会创建定向重跑所需的新 tarball 产物。发布路径 Docker 套件最多会作为三个分块作业运行，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取自身所需的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON，以及每通道重跑命令。工作流输入 `docker_lanes` 会让所选通道针对已准备好的镜像运行，而不是运行那三个分块作业，这样就能把失败通道的调试限制在一个定向 Docker 作业内，并为所选 ref 准备新的 npm tarball；如果所选通道是 live Docker 通道，那么该定向作业会在本地为这次重跑构建 live-test 镜像。使用 `pnpm test:docker:rerun <run-id>` 可以从某个 GitHub 运行下载 Docker 产物，并打印合并后的 / 每通道的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可以查看慢通道和阶段关键路径摘要。若在发布路径套件中请求 Open WebUI，它会在 plugins/integrations 分块内运行，而不会额外占用第四个 Docker worker；Open WebUI 仅在 openwebui-only 派发时保留独立作业。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵会按更新目标拆分，以便重复的 npm update 和 doctor repair 过程可以与其他内置检查分片并行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地检查门禁在架构边界方面比宽泛的 CI 平台范围更严格：核心生产改动会运行 core prod 和 core test typecheck，以及 core lint / guards；仅 core test 改动只会运行 core test typecheck 和 core lint；扩展生产改动会运行 extension prod 和 extension test typecheck，以及 extension lint；仅扩展测试改动会运行 extension test typecheck 和 extension lint。公共插件 SDK 或 plugin-contract 变更会扩展到 extension typecheck，因为扩展依赖这些核心契约，但 Vitest 扩展全量测试属于显式的测试工作。仅发布元数据的版本号提升会运行定向的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先的方式退回到所有检查通道。

手动 CI 派发会运行 `checks-node-compat-node22`，作为候选发布的兼容性覆盖。普通 PR 和 `main` push 会跳过该通道，使矩阵聚焦于 Node 24 测试 / 渠道通道。

最慢的 Node 测试族会被拆分或均衡，以便每个作业都保持较小规模，同时又不会过度占用 runner：渠道契约会作为三个加权分片运行，内置插件测试会在六个扩展 worker 之间均衡，小型核心单元测试通道会成对组合，auto-reply 会作为四个均衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands / state-routing 分片，而 agentic Gateway 网关 / 插件配置则分散到现有的仅源代码 agentic Node 作业中，而不是等待已构建产物。广泛的 browser、QA、media 和杂项插件测试会使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并配备更大的 Node 堆，以避免导入密集型插件批次产生额外的 CI 作业。广泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入 / 调度主导，而不是被单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一同运行，以避免共享运行时分片承担尾部压力。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和筛选后的分片。`check-additional` 会将 package-boundary compile / canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；boundary guard 分片会在一个作业内并发运行其规模较小且彼此独立的守卫。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，于 `build-artifacts` 内并发运行，从而保留原有的检查名称作为轻量验证器作业，同时避免额外两个 Blacksmith worker 和第二条产物消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS / call-log `BuildConfig` 标志来编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。

当同一个 PR 或 `main` ref 上有更新的 push 到来时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被替代后继续排队。

自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就无法无限期阻塞较新的 `main` 运行。手动完整套件运行使用 `CI-manual-v1-*`，且不会取消正在进行中的运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol / contract / bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 的敏感度仍然很高，以至于 8 vCPU 节省下来的还不如它增加的成本；install-smoke 的 Docker 构建，在那里 32 vCPU 的排队时间成本高于其带来的收益                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门禁：按边界通道运行变更相关的 typecheck / lint / guards
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门禁，但包含每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 低成本的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链检查
pnpm build          # 当 CI 的产物 / build-smoke 通道相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 对比最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢的作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue / comment 噪声并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 对比最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)
