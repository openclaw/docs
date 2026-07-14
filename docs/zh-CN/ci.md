---
read_when:
    - 你需要了解 CI 作业为何运行或未运行
    - 你正在调试一项失败的 GitHub Actions 检查
    - 你正在协调一次发布验证运行或重新运行
    - 你正在更改 ClawSweeper 分派或 GitHub 活动转发
summary: CI 作业图、范围门禁、发布统筹任务和本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-07-14T13:30:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 56332874183aa0cdf2bdf60f68324aef3b5a81bd87510dc75f195cdefe3313b4
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 在推送到 `main`（触发时会忽略 Markdown 和 `docs/**` 路径）、每个非草稿拉取请求以及手动调度时运行。
规范 `main` 推送首先经过 90 秒的托管运行器准入窗口；当有更新的提交进入时，`CI` 并发组会取消正在等待的运行，因此连续合并不会各自注册完整的 Blacksmith 矩阵。拉取请求和手动调度会跳过等待。随后，`preflight` 作业会对差异进行分类，并在仅有无关区域发生变化时关闭高开销通道。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为候选版本和广泛验证展开完整任务图。Android 通道仍需通过 `include_android`（或 `release_gate` 输入）选择启用。仅用于发布的插件覆盖位于单独的 [`Plugin Prerelease`](#plugin-prerelease) 工作流中，并且仅从 [`Full Release Validation`](#full-release-validation) 或显式手动调度运行。

## 流水线概览

| 作业                                | 用途                                                                                                                                                                                                               | 运行时机                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 检测仅文档变更、变更的范围、变更的扩展，并构建 CI 清单                                                                                                                               | 始终在非草稿推送和拉取请求时运行                  |
| `runner-admission`                 | 在注册 Blacksmith 工作前，对规范 `main` 推送进行托管的 90 秒防抖                                                                                                                            | 每次 CI 运行；仅在规范 `main` 推送时休眠 |
| `security-fast`                    | 私钥检测、通过 `zizmor` 审计变更的工作流，以及生产锁文件审计                                                                                                                             | 始终在非草稿推送和拉取请求时运行                  |
| `pnpm-store-warmup`                | 预热由锁文件固定版本的 pnpm 存储缓存，同时不阻塞 Linux Node 分片                                                                                                                                          | 选择 Node 或文档检查通道时                   |
| `build-artifacts`                  | 构建 `dist/`、Control UI、执行已构建 CLI 冒烟检查、启动内存检查和嵌入式构建工件检查                                                                                                                 | Node 相关变更                               |
| `control-ui-i18n`                  | 验证生成的 Control UI 区域设置包、元数据和翻译记忆库；自动运行时仅提示，手动发布 CI 时阻塞                                                                               | Control UI i18n 相关变更和手动 CI      |
| `checks-fast-core`                 | 快速 Linux 正确性通道：变更文件的 TypeScript LOC 棘轮、内置组件 + 协议、Bun 启动器，以及 CI 路由快速任务                                                                                     | Node 相关或生产 TypeScript 变更      |
| `qa-smoke-ci-profile`              | 有界自动化 QA 冒烟代表集的两个自包含均衡部分；通过显式 QA 配置文件仍可获得完整分类覆盖                                                         | Node 相关变更                               |
| `checks-fast-contracts-plugins-*`  | 两个加权插件契约分片                                                                                                                                                                                   | Node 相关变更                               |
| `checks-fast-contracts-channels-*` | 两个加权渠道契约分片                                                                                                                                                                                  | Node 相关变更                               |
| `checks-node-*`                    | 拉取请求上针对变更目标的 Node 测试；在 `main`、手动、发布和广泛回退运行中执行完整核心分片                                                                                                      | Node 相关变更                               |
| `check-*`                          | 分片化的主本地门禁等效项：防护检查、shrinkwrap、内置渠道配置元数据、生产类型、lint、依赖项、测试类型                                                                                   | Node 相关变更                               |
| `check-additional-*`               | 边界检查条带（包括提示词快照漂移）、会话访问器/转录读取器/SQLite 事务边界、扩展 lint 组、包边界编译/金丝雀测试，以及运行时拓扑架构 | Node 相关变更                               |
| `checks-node-compat-node22`        | Node 22 兼容性构建和冒烟通道                                                                                                                                                                            | 用于发布的手动 CI 调度                     |
| `check-docs`                       | 文档格式、lint 和失效链接检查                                                                                                                                                                         | 文档发生变更（拉取请求和手动调度）              |
| `native-i18n`                      | 原生应用、Android 和 Apple i18n 清单检查                                                                                                                                                                  | 原生 i18n 相关变更                        |
| `skills-python`                    | 对 Python 支持的 Skills 执行 Ruff + pytest                                                                                                                                                                                | Python Skill 相关变更                       |
| `checks-windows`                   | Windows 特定的进程/路径测试，以及共享运行时导入说明符回归测试                                                                                                                                  | Windows 相关变更                            |
| `macos-node`                       | 聚焦的 macOS TypeScript 测试：launchd、Homebrew、运行时路径、打包脚本、进程组封装器                                                                                                            | macOS 相关变更                              |
| `macos-swift`                      | macOS 应用的 Swift lint、构建和测试                                                                                                                                                                        | macOS 相关变更                              |
| `ios-build`                        | 生成 Xcode 项目并执行 iOS 应用模拟器构建                                                                                                                                                             | iOS 应用、共享应用工具包或 Swabble 变更         |
| `android`                          | 两种变体的 Android 单元测试，以及一次调试 APK 构建                                                                                                                                                          | Android 相关变更                            |
| `openclaw/ci-gate`                 | 最终汇总：要求准入、预检和安全检查通过；仅当清单禁用下游通道时才接受跳过                                                                                               | 每次非草稿 CI 运行                              |
| `test-performance-agent`           | 单独工作流：可信活动后每日执行 Codex 慢速测试优化                                                                                                                                          | 主 CI 成功或手动调度                  |
| `openclaw-performance`             | 单独工作流：按日/按需生成 Kova 运行时性能报告，包含模拟提供商、深度分析和 GPT 5.6 实时通道                                                                                          | 定时和手动调度                       |

独立的 Periphery 工作流要求 iOS 和 macOS 应用的无用代码发现数为零。共享 OpenClawKit 工作流并行扫描两个使用方，并且仅当 Periphery 从两个构建中发出相同的 Swift USR 时才报告声明。其生成的 `OpenClawProtocol/GatewayModels.swift` 架构契约作为生成器所有的代码保留，而不会被视为应用本地无用代码。

## 快速失败顺序

1. `runner-admission` 仅等待规范 `main` 推送；更新的推送会在 Blacksmith 注册前取消该运行。
2. `preflight` 决定实际存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是此作业中的步骤，而不是独立作业。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 会快速失败，无需等待开销更大的工件和平台矩阵作业。
4. `build-artifacts` 和仅提示的 `control-ui-i18n` 检查与快速 Linux 通道重叠运行。生成的区域设置漂移保持可见，同时独立刷新工作流在后台修复它。
5. 随后会展开开销更大的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。
6. `openclaw/ci-gate` 会等待每个选定的通道。准入、预检和安全检查必须成功；只有当清单未选择下游作业时，才可以跳过这些作业。选定通道失败或被取消都会导致汇总失败。

对于同一拉取请求头，合并协调器可以复用经过身份验证且成功的 `openclaw/ci-gate`，最长可达 24 小时。这避免了因无关的 `main` 变更而重写贡献者分支。可复用结果不会取代针对当前 `main` 的单独严格、由应用所有的测试合并检查。在新鲜度窗口内，对于该未变更的请求头，后续处于待处理状态或失败的重新运行不会抹除更早的成功结果。

GitHub 可能会将已被取代的作业标记为 `cancelled`，这种情况会在同一 PR 或 `main` 引用上出现较新的推送时发生。除非同一引用的最新运行也失败，否则应将其视为 CI 噪声。矩阵作业使用 `fail-fast: false`，而 `build-artifacts` 会直接报告内嵌的渠道、核心支持边界和 Gateway 网关监视故障，而不是将微型验证作业加入队列。自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 端旧队列组中的僵尸作业无法无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，且不会取消正在进行的运行。插件列表启动内存防护在自托管 Blacksmith Linux 上保持 350 MiB 上限，在 GitHub 托管的 Linux 上则允许 425 MiB；对于相同的已构建 CLI，后者的 RSS 基线更高。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>` 汇总 GitHub Actions 的实际耗时、排队时间、最慢作业、故障以及 `pnpm-store-warmup` 扇出屏障。工作流内的 `ci-timings-summary` 作业存在于 `ci.yml` 中，但目前已禁用（`if: false`）；请改为在本地运行计时辅助程序。若要查看构建计时，请检查 `build-artifacts` 作业的 `Build dist` 步骤：`pnpm build:ci-artifacts` 会输出 `[build-all] phase timings:` 并包含 `ui:build`；该作业还会上传 `startup-memory` 工件。

## PR 上下文和证据

外部贡献者 PR 会通过
`.github/workflows/real-behavior-proof.yml` 运行 PR 上下文和证据门禁。该工作流检出
受信任的工作流修订版（`github.workflow_sha`），且仅评估 PR 正文；
它不会执行贡献者分支中的代码。

该门禁适用于并非仓库所有者、成员、协作者或机器人的 PR 作者。当 PR 正文包含作者撰写的
`What Problem This Solves` 和 `Evidence` 章节时，门禁通过。证据可以是聚焦测试、CI 结果、屏幕截图、录屏、终端输出、实时观察、脱敏日志或工件链接。正文用于说明意图并提供有用的验证信息；
审阅者则检查代码、测试和 CI，以评估正确性。

检查失败时，请更新 PR 正文，而不是再推送一个代码提交。

## 范围和路由

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动调度会跳过变更范围检测，并使预检清单表现得如同每个受范围约束的区域都发生了变更。

独立的 iOS 和 macOS Periphery 工作流会强制执行零发现项的死代码策略。每个工作流仅在非草稿拉取请求触及其原生扫描范围时运行，或通过手动调度运行。

- **CI 工作流编辑**会验证 Node CI 图、工作流 lint 和 Windows 通道（由 `ci.yml` 执行），但本身不会强制执行 iOS、Android 或 macOS 原生构建；这些平台通道仍仅限于平台源代码变更。
- **工作流完整性检查**会针对所有工作流 YAML 文件运行 `actionlint`、`zizmor`，以及复合操作插值防护和冲突标记防护。PR 范围内的 `security-fast` 作业还会针对发生变更的工作流文件运行 `zizmor`，从而让工作流安全发现项在主 CI 图中尽早失败。
- **推送至 `main` 时的文档**由独立的 `Docs` 工作流检查，并使用与 CI 相同的 ClawHub 文档镜像，因此同时包含代码和文档的推送不会再将 CI 的 `check-docs` 分片加入队列。当文档发生变更时，拉取请求和手动 CI 仍会从 CI 运行 `check-docs`。
- **TUI PTY**会在 TUI 发生变更时于 `checks-node-core-runtime-tui-pty` Linux Node 分片中运行。该分片使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 运行 `test/vitest/vitest.tui-pty.config.ts`，因此同时覆盖确定性的 `TuiBackend` 固件通道，以及速度较慢、仅模拟外部模型端点的 `tui --local` 冒烟测试。
- **仅涉及 CI 路由的编辑、快速任务直接运行的少量核心测试固件，以及范围狭窄的插件契约辅助程序编辑**会使用快速的仅 Node 清单路径：`preflight`、`security-fast`，以及变更所触及的快速通道——单个 `checks-fast-core` CI 路由任务、两个插件契约分片，或两者。该路径会跳过构建工件、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片以及其他防护矩阵。
- **Windows Node 检查**的范围仅限于 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助程序、包管理器配置，以及执行该通道的 CI 工作流界面；无关的源代码、插件、安装冒烟测试和仅测试变更仍保留在 Linux Node 通道上。

最慢的 Node 测试族会被拆分或均衡分配，使每个作业保持较小规模，同时避免过度预留运行器：

- 插件契约和渠道契约各自作为两个由 Blacksmith 支持的加权分片运行，并使用标准 GitHub 运行器作为回退。
- 核心单元快速/支持通道分别运行；核心运行时基础设施拆分为进程、共享、钩子、密钥以及三个 cron 领域分片。
- 自动回复以均衡工作进程运行，其中 reply 子树拆分为 agent-runner、命令、分发、会话和状态路由分片。
- 智能体式 Gateway 网关/服务器（控制平面）配置拆分到聊天、身份验证、模型、HTTP/插件、运行时和启动通道，而不是等待构建工件。
- 常规 CI 仅将隔离的基础设施 include-pattern 分片打包为确定性捆绑包，每个最多包含 64 个测试文件，从而在不合并非隔离的命令/cron、有状态 agents-core 或 Gateway 网关/服务器套件的情况下缩减 Node 矩阵。重型固定套件继续使用 8 vCPU，而捆绑通道和权重较低的通道使用 4 vCPU。
- 规范仓库上的拉取请求会针对合成合并树差异复用变更测试解析器。精确变更会运行一个定向 Node 作业；每个选定测试文件都使用独立进程，因此有状态套件仍保持隔离。规划器会将同级测试与导入图中的依赖方组合起来；对于工作区包、包/锁文件、共享测试框架、拆分配置、重命名或删除的变更、公共扩展契约变更、具有特殊分片设置的测试、部分解析或空目标、路径或目标计划过大，以及规划器错误，则回退到现有的 14 作业紧凑完整套件计划。定向计划始终保留完整的构建工件边界门禁，因为其仓库扫描器无法从导入关系推导得出。`main` 推送、手动调度和发布门禁会保留完整矩阵，因为已取消的被取代 `main` 运行会使单次推送差异不足以作为集成证据。
- 完整 Node 矩阵会优先接纳持续缓慢的串行工具和自动回复命令分片。这样既能保持 28 个作业的上限，又能防止较短的按字母排序分组将关键路径工作推迟到后续波次。
- 范围较广的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。include-pattern 分片会使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和经过筛选的分片。
- `check-additional-*` 会将补充边界防护列表（`scripts/run-additional-boundary-checks.mjs`）划分为一个提示词密集型分片（`check-additional-boundaries-a`，其中包含 Codex 提示词快照漂移检查）和一个用于其余条带的组合分片（`check-additional-boundaries-bcd`）；每个分片都会并发运行独立防护，并输出各项检查的计时。包边界编译/金丝雀工作保留在一起，而运行时拓扑架构会与内嵌在 `build-artifacts` 中的 Gateway 网关监视覆盖分开运行。
- 在 `dist/` 和 `dist-runtime/` 已经构建完成后，Gateway 网关监视、渠道测试和核心支持边界分片会在 `build-artifacts` 内并发运行。

获得接纳后，规范 Linux CI 最多允许 28 个 Node 测试作业并发运行，
规模较小的快速/检查通道最多允许 12 个；Windows 和 Android 保持为两个，因为
这些运行器池规模较小。紧凑的全配置批次采用
120 分钟的批次超时，而 include-pattern 分组共享相同的有界作业预算。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play 调试 APK。第三方变体没有单独的源集或清单；其单元测试通道仍会使用 SMS/通话记录 BuildConfig 标志编译该变体，同时避免在每次与 Android 相关的推送中重复执行调试 APK 打包作业。

`check-dependencies` 分片会运行生产级 Knip 依赖项、未使用文件和未使用导出检查。当 PR 添加未经审阅的新未使用文件或留下过期的允许列表条目时，未使用文件防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、实时测试和包桥接界面。未使用导出防护会排除测试支持文件，然后在出现新发现项或必需基线中存在过期条目时失败；删除无用导出后，使用 `pnpm deadcode:exports:update` 重新生成只允许缩减的基线。历史目标在提供导出防护时会运行该防护，否则保留其较旧的死代码回退机制。

## ClawSweeper 活动转发

`.github/workflows/clawsweeper-dispatch.yml` 是将 OpenClaw 仓库活动传入 ClawSweeper 的目标端桥接器。它不会检出或执行不受信任的拉取请求代码。该工作流使用 `CLAWSWEEPER_APP_PRIVATE_KEY` 创建 GitHub App 令牌，然后将紧凑的 `repository_dispatch` 负载调度至 `openclaw/clawsweeper`。

该工作流有四个通道：

- `clawsweeper_item`，用于精确的议题和拉取请求审阅请求；
- `clawsweeper_comment`，用于议题评论中的显式 ClawSweeper 命令；
- `clawsweeper_commit_review`，用于 `main` 推送上的提交级审阅请求；
- `github_activity`，用于 ClawSweeper 智能体可能检查的一般 GitHub 活动。

`github_activity` 通道仅转发规范化元数据：事件类型、操作、操作者、仓库、条目编号、URL、标题、状态，以及存在评论或审阅时的简短摘录。它有意避免转发完整的 webhook 正文。`openclaw/clawsweeper` 中的接收工作流为 `.github/workflows/github-activity.yml`，它会将规范化事件发布到供 ClawSweeper 智能体使用的 OpenClaw Gateway 网关钩子。

一般活动仅用于观察，默认不进行投递。ClawSweeper 智能体会在其提示词中接收 Discord 目标，并且仅当事件出人意料、可采取行动、存在风险或对运维有用时，才应发布至 `#clawsweeper`。常规的新建、编辑、机器人扰动、重复 webhook 噪声和正常审阅流量应产生 `NO_REPLY`。

在整个路径中，应将 GitHub 标题、评论、正文、审阅文本、分支名称和提交消息视为不受信任的数据。它们是用于汇总和分流的输入，而不是工作流或智能体运行时的指令。

## 手动调度

手动触发的 CI 会运行与常规 CI 相同的作业图，但会强制启用所有非 Android 范围的通道：Linux Node 分片、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建产物冒烟检查、文档检查、Python Skills、Windows、macOS、iOS 构建和 Control UI i18n。在自动 PR 和 `main` 运行中，Control UI 区域设置一致性仅提供建议，因为独立的刷新工作流会在后台修复生成内容的偏差；在手动 CI 中，它是阻塞项，因此也是完整发布验证的阻塞项。独立手动 CI 触发仅通过 `include_android=true` 运行 Android（`release_gate` 输入也会强制启用 Android）；完整发布总流程通过传递 `include_android=true` 来启用 Android。CI 不包括插件预发布静态检查、仅限发布的 `agentic-plugins` 分片、完整扩展批量扫描和插件预发布 Docker 通道。仅当 `Full Release Validation` 在启用发布验证门禁的情况下触发单独的 `Plugin Prerelease` 工作流时，才会运行 Docker 预发布套件。

手动运行使用唯一的并发组，因此候选版本的完整套件不会被同一 ref 上的其他推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任的调用方针对分支、标签或完整提交 SHA 运行该作业图，同时使用所选触发 ref 中的工作流文件。可选的 `loc_base_ref` 为独立手动运行提供精确的比较 SHA。`release_gate` 输入是供维护者在 PR CI 因容量停滞时使用的精确 SHA 后备方案：它要求 `target_ref` 是与所触发分支头匹配的完整提交 SHA，并要求 `pr_number` 标识打开的拉取请求。工作流会验证该 PR 的当前头和基准，等待 GitHub 完成可合并性计算，固定所报告的测试合并提交，获取 GitHub 的合成拉取请求合并 ref，验证其 SHA 和两个父提交，然后在安装依赖项并运行已更改文件的 TypeScript LOC 棘轮检查之前检出该树。这与自动 PR CI 的合并树和策略实现一致。不包含 `pr_number` 的目标所有工作流修订版无法提供等效的合并树证据；应将 PR 头更新到当前工作流并重新启动精确头验证，而不是使用该后备方案。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

每月仅 npm 的扩展稳定版路径是例外：从精确的
`extended-stable/YYYY.M.33` 分支同时触发 `OpenClaw NPM
Release` 预检和 `Full Release Validation`，保留它们的运行 ID，并将这两个 ID
传递给直接 npm 发布运行。有关命令、精确身份要求、注册表回读和选择器修复流程，请参阅[每月仅 npm 的扩展稳定版
发布](/zh-CN/reference/RELEASING#monthly-npm-only-extended-stable-publication)。此路径不会触发插件、macOS、Windows、GitHub
Release、私有 dist-tag 或其他平台发布。

## 运行器

| 运行器                          | 作业                                                                                                                                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | `runner-admission`、`security-fast`、手动 CI 触发和非规范仓库后备方案、QA 冒烟测试汇总、CodeQL 安全和质量扫描、工作流完整性检查、标签器、自动响应、独立文档工作流以及整个安装冒烟测试工作流            |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`pnpm-store-warmup`、`native-i18n`、除 QA 冒烟 CI 之外的 `checks-fast-core`、插件/渠道契约分片、大多数内置/较轻量的 Linux Node 分片、除 `check-lint` 之外的 `check-*` 通道、选定的 `check-additional-*` 分片、`check-docs` 和 `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的重型 Linux Node 套件、边界/扩展密集型 `check-additional-*` 分片和 `android`                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404` | 自动 QA 冒烟 CI 分片、CI 和 Testbox 中的 `build-artifacts`，以及 `check-lint`（对 CPU 足够敏感，使用 8 个 vCPU 的成本高于其节省的成本）                                                                                                                                  |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；复刻仓库回退到 `macos-15`                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 和 `ios-build`；复刻仓库回退到 `macos-26`                                                                                                                                                                                               |

## 运行器注册预算

OpenClaw 当前的 GitHub 运行器注册配额在 `ghx api rate_limit` 中报告为每 5 分钟 10,000 次自托管
运行器注册。每次调整前请重新检查
`actions_runner_registration`，因为 GitHub 可能会更改
此配额。该限制由 `openclaw` 组织中的所有 Blacksmith 运行器注册共享，因此再添加一个 Blacksmith 安装并不会增加
新的配额。

应将 Blacksmith 标签视为控制突发流量的稀缺资源。仅执行路由、通知、汇总、选择分片或运行短时 CodeQL 扫描的作业
应继续使用 GitHub 托管的运行器，除非它们有经测量确认的 Blacksmith 特定需求。任何新的 Blacksmith 矩阵、更大的 `max-parallel` 或高频
工作流都必须说明其最坏情况下的注册数量，并将组织级目标保持在实时配额的大约 60% 以下。使用当前 10,000 次注册的
配额时，这意味着运行目标为 6,000 次注册，为并发仓库、重试和突发重叠
留出余量。

变更目标 PR 计划将常见 Node 测试突发从 14 次 Blacksmith 注册减少到 1 次。高风险范围较广的 PR 保留 14 次注册的紧凑后备方案，因此最坏情况不会增加。

规范仓库 CI 继续将 Blacksmith 作为常规推送和拉取请求运行的默认运行器路径。`workflow_dispatch` 和非规范仓库运行使用 GitHub 托管的运行器，但常规范仓库运行目前不会探测 Blacksmith 队列健康状况，也不会在 Blacksmith 不可用时自动回退到 GitHub 托管的标签。

## 本地等效命令

```bash
pnpm changed:lanes                            # 检查 origin/main...HEAD 的本地变更通道分类器
pnpm check:changed                            # 智能本地检查门禁：按边界通道检查变更的格式、类型检查、lint 和防护项
pnpm check                                    # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速防护项
pnpm check:test-types
pnpm check:timed                              # 相同门禁，并包含各阶段计时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest 测试
pnpm test:changed                             # 低成本智能变更 Vitest 目标
pnpm test:ui                                  # Control UI 单元/浏览器套件
pnpm ui:i18n:check                            # 生成的 Control UI 区域设置一致性（发布门禁）
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # 文档格式 + lint + 失效链接
pnpm build                                    # 当 CI 产物/冒烟检查很重要时构建 dist
pnpm ios:build                                # 生成并构建 iOS 应用项目
pnpm ci:timings                               # 汇总最新的 origin/main 推送 CI 运行
pnpm ci:timings:recent                        # 比较近期成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略议题/评论干扰并选择 origin/main 推送 CI
node scripts/ci-run-timings.mjs --recent 10   # 比较近期成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw 性能

`OpenClaw Performance` 是产品/运行时性能工作流。它每天在 `main` 上运行，也可以手动触发：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手动触发通常会对工作流 ref 进行基准测试。设置 `target_ref` 可使用当前工作流实现对发布标签或其他分支进行基准测试。已发布的报告路径和 latest 指针以被测试的 ref 为键，每个 `index.md` 都会记录被测试的 ref/SHA、工作流 ref/SHA、Kova ref、配置文件、通道身份验证模式、模型、重复次数和场景筛选器。

该工作流从固定版本安装 OCM，并在固定的 `kova_ref` 输入处从 `openclaw/Kova` 安装 Kova，然后运行三个通道：

- `mock-provider`：使用确定性的伪 OpenAI 兼容身份验证，针对本地构建运行时执行 Kova 诊断场景。
- `mock-deep-profile`：针对启动、Gateway 网关和智能体轮次热点执行 CPU/堆/跟踪分析。按计划运行，或在使用 `deep_profile=true` 触发时运行。
- `live-openai-candidate`：执行一次真实的 OpenAI `openai/gpt-5.6-luna` 智能体轮次，在 `OPENAI_API_KEY` 不可用时跳过。按计划运行，或在使用 `live_openai_candidate=true` 触发时运行。

模拟提供商通道在 Kova 测试通过后还会运行 OpenClaw 原生源码探针：覆盖默认、跳过渠道、内部钩子和五十插件启动场景的 Gateway 网关启动耗时与内存；内置插件导入 RSS、重复的模拟 OpenAI `channel-chat-baseline` hello 循环、针对已启动 Gateway 网关的 CLI 启动命令，以及 SQLite 状态冒烟性能探针。当被测引用存在此前发布的模拟提供商源码报告时，源码摘要会将当前 RSS 和堆值与该基线比较，并将较大的 RSS 增幅标记为 `watch`。源码探针 Markdown 摘要位于报告包中的 `source/index.md`，原始 JSON 位于其旁边。

每个通道都会上传完整的 GitHub 工件，包括 CPU、堆、跟踪记录和压缩诊断包。单独的发布作业会下载并验证这些工件，然后生成一个短期有效的 ClawSweeper GitHub App 令牌，其权限范围仅限于 `openclaw/clawgrit-reports` 内容，并且只将其传递给 Git 推送步骤。它会在 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 下提交 `report.json`、`report.md`、`index.md`、源码探针工件以及包元数据/校验和；完整诊断归档仍保留在关联的 Actions 工件中。发布器会在尝试推送前拒绝任何超过 50 MB 的报告文件。当前被测引用指针为 `openclaw-performance/<tested-ref>/latest-<lane>.json`。如果应用令牌创建或报告发布失败，定时运行和 `profile=release` 调度都会失败。手动非发布调度仍将发布视为建议性步骤，并在身份验证或发布失败时保留 GitHub 工件。此前的源码基线会从公共报告仓库匿名获取，因此成功获取基线并不能证明发布器身份验证成功。

## 完整发布验证

`Full Release Validation` 是用于“发布前运行全部检查”的手动总控工作流。它接受分支、标签或完整提交 SHA，并使用该目标调度手动 `CI` 工作流（包括 Android），调度 `Plugin Prerelease` 以执行仅限发布的插件/软件包/静态/Docker 验证，针对目标 SHA 调度 `OpenClaw Performance`，并调度 `OpenClaw Release Checks` 以运行安装冒烟测试、软件包验收、跨操作系统软件包检查、QA Lab 一致性、Matrix 和 Telegram 通道（建议性的成熟度评分卡渲染可通过 `run_maturity_scorecard` 选择启用）。稳定版和完整配置始终包含详尽的实时/E2E 和 Docker 发布路径耐久测试覆盖；测试版配置可通过 `run_release_soak=true` 选择启用。规范的软件包 Telegram E2E 在软件包验收内运行，因此完整候选版本不会启动重复的实时轮询器。发布后，传入 `release_package_spec` 即可在发布检查、软件包验收、Docker、跨操作系统和 Telegram 中复用已发布的 npm 软件包，而无需重新构建。仅在集中重新运行已发布软件包的 Telegram 测试时使用 `npm_telegram_package_spec`。Codex 插件实时软件包通道默认使用同一选定状态：已发布的 `release_package_spec=openclaw@<tag>` 会派生 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA/工件运行会从选定引用打包 `extensions/codex`。对于 `npm:`、`npm-pack:` 或 `git:` 规范等自定义插件源，请显式设置 `codex_plugin_spec`。

有关阶段矩阵、确切的工作流作业名称、配置差异、工件和集中重新运行入口，请参阅[完整发布验证](/zh-CN/reference/full-release-validation)。

`OpenClaw Release Publish` 是手动执行变更的发布工作流。在发布标签存在且 OpenClaw npm 预检成功后，从可信的 `main` 调度常规测试版和稳定版发布（预检会运行 `pnpm plugins:sync:check` 等检查）。标签仍会选择确切的发布提交，包括 `release/YYYY.M.PATCH` 上的提交；Tideclaw alpha 发布继续使用其对应的 alpha 分支。它要求已保存的 `preflight_run_id`、成功的 `full_release_validation_run_id` 及其确切的 `full_release_validation_run_attempt`，会为所有可发布插件软件包调度 `Plugin NPM Release`，为同一发布 SHA 调度 `Plugin ClawHub Release`，然后才调度 `OpenClaw NPM Release`。稳定版发布还要求确切的 `windows_node_tag`；在启动任何发布子工作流之前，该工作流会验证 Windows 源码版本，并将其 x64/ARM64 安装程序与候选版本已批准的 `windows_node_installer_digests` 输入进行比较，然后提升并验证这些相同的固定安装程序摘要，以及确切的配套资源和校验和契约，之后才发布 GitHub 发布草稿。仅修复插件的集中处理使用 `plugin_publish_scope=selected`，并需提供非空软件包列表。仅插件的 `all-publishable` 运行需要与核心发布相同的不可变 npm 预检和完整发布验证证据。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

要在快速变动的分支上验证固定提交，请使用辅助程序，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流调度引用必须是分支或标签，不能是原始提交 SHA。该辅助程序会在可信的 `main` 工作流 SHA 上推送临时 `release-ci/<sha>-...` 分支，通过工作流的 `ref` 输入传递请求的目标 SHA，在可用时复用严格的精确目标证据，验证每个子工作流的 `headSha` 是否与可信工作流 SHA 匹配，并在运行完成后删除临时分支。传入 `-f reuse_evidence=false` 可强制进行全新验证。如果任何子工作流运行时使用了不同的工作流 SHA，总控验证器也会失败。

`release_profile` 控制传递给发布检查的实时测试/提供商覆盖范围。手动发布工作流默认为 `stable`；仅当你有意运行广泛的建议性提供商/媒体矩阵时才使用 `full`。稳定版和完整发布检查始终运行详尽的实时/E2E 和 Docker 发布路径耐久测试；测试版配置可通过 `run_release_soak=true` 选择启用。

- `minimum` 保留速度最快且对 OpenAI/核心发布至关重要的通道。
- `stable` 添加稳定的提供商/后端集合。
- `full` 运行广泛的建议性提供商/媒体矩阵。

总控工作流会记录已调度子运行的 ID，最终的 `Verify full validation` 作业会重新检查子运行的当前结论，并为每个子运行附加最慢作业表。如果某个子工作流重新运行后变为绿色，只需重新运行父级验证器作业，即可刷新总控结果和耗时摘要。

为便于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。在总控工作流中，可使用 `all` 运行发布候选版本，使用 `ci` 仅运行常规完整 CI 子工作流，使用 `plugin-prerelease` 仅运行插件预发布子工作流，使用 `performance` 仅运行 OpenClaw Performance 子工作流，使用 `release-checks` 运行所有发布子工作流，或使用范围更窄的组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样，在进行集中修复后，可以将失败发布环境的重新运行限制在明确范围内。对于单个失败的跨操作系统通道，可将 `rerun_group=cross-os` 与 `cross_os_suite_filter` 组合使用，例如 `windows/packaged-upgrade`；耗时较长的跨操作系统命令会输出心跳行，软件包升级摘要则包含各阶段耗时。QA 发布检查通道均为建议性检查，但标准运行时工具覆盖门禁除外；如果必需的 OpenClaw 动态工具在标准层级摘要中发生偏移或消失，该门禁会阻止发布。

`OpenClaw Release Checks` 使用可信工作流引用将选定引用一次性解析为 `release-package-under-test` tarball，然后将该工件传递给跨操作系统检查和软件包验收；运行耐久测试覆盖时，还会传递给实时/E2E 发布路径 Docker 工作流。这样可以确保各发布环境中的软件包字节一致，并避免多个子作业重复打包同一候选版本。对于 Codex npm 插件实时通道，发布检查要么传递从 `release_package_spec` 派生的匹配已发布插件规范，要么传递操作员提供的 `codex_plugin_spec`，要么将输入留空，以便 Docker 脚本打包选定检出的 Codex 插件。

针对 `ref=main` 和 `rerun_group=all` 的重复 `Full Release Validation` 运行会取代较旧的总控工作流。父级监控器会在父级取消时取消其已调度的所有子工作流，因此更新的 main 验证不会排在过期的两小时发布检查运行之后。发布分支/标签验证和集中重新运行组会保留 `cancel-in-progress: false`。

## 实时和 E2E 分片

发布实时/E2E 子工作流保留广泛的原生 `pnpm test:live` 覆盖，但会通过 `scripts/test-live-shard.mjs` 将其作为命名分片运行，而不是使用单个串行作业：

- `native-live-src-agents` 和 `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- 按提供商筛选的 `native-live-src-gateway-profiles` 作业
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分后的媒体音频/视频分片和按提供商筛选的音乐分片

这会保持相同的文件覆盖范围，同时让缓慢的实时提供商故障更易于重新运行和诊断。聚合的 `native-live-src-gateway`、`native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动单次重新运行。

原生实时媒体分片在由 `Live Media Runner Image` 工作流构建的 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行。该镜像预安装了 `ffmpeg` 和 `ffprobe`；媒体作业在设置前只需验证二进制文件。应让基于 Docker 的实时测试套件继续在普通 Blacksmith 运行器上运行——容器作业并不适合启动嵌套 Docker 测试。

基于 Docker 的实时模型/后端分片会为每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` 镜像。实时发布工作流仅构建并推送该镜像一次，随后 Docker 实时模型、按提供商分片的 Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。Gateway 网关 Docker 分片设置了明确的脚本级 `timeout` 上限，低于工作流作业超时，因此卡住的容器或清理路径会快速失败，而不是耗尽整个发布检查预算。如果这些分片各自独立重新构建完整的源码 Docker 目标，则说明发布运行配置错误，并会因重复镜像构建浪费实际耗时。

## 软件包验收

当问题是“这个可安装的 OpenClaw 软件包作为产品是否可用？”时，使用 `Package Acceptance`。它与常规 CI 不同：常规 CI 验证源码树，而软件包验收则通过用户安装或更新后使用的同一 Docker E2E 测试框架来验证单个 tarball。

### 作业

1. `resolve_package` 检出 `workflow_ref`，解析一个候选包，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中输出来源、工作流引用、包引用、版本、SHA-256 和配置文件。
2. `package_integrity` 下载 `package-under-test` 工件，并使用 `scripts/check-openclaw-package-tarball.mjs` 强制执行公开包 tarball 契约。
3. `docker_acceptance` 使用解析出的包源 SHA（回退到 `workflow_ref`）和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该工件、验证 tarball 清单、按需准备基于包摘要的 Docker 镜像，并针对该包运行选定的 Docker 通道，而不是打包工作流检出的内容。当某个配置文件选择多个目标 `docker_lanes` 时，可复用工作流只准备一次包和共享镜像，然后将这些通道扇出为并行的定向 Docker 作业，并生成唯一工件。
4. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果包验收解析出了 `package-under-test` 工件，则安装同一工件；独立的 Telegram 调度仍可安装已发布的 npm 规格。
5. `summary` 会在包解析、完整性检查、Docker 验收或可选 Telegram 通道失败时使工作流失败。对于仅提供建议的调用方，`advisory` 输入会将验收失败降级为警告。

### 候选来源

- `source=npm` 仅接受 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest` 或 OpenClaw 的精确发布版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布的扩展稳定版、预发布版或稳定版验收。
- `source=ref` 打包可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支和标签，验证所选提交可从仓库分支历史或发布标签访问，在分离的工作树中安装依赖项，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载公开 HTTPS `.tgz`；必须提供 `package_sha256`。此路径拒绝 URL 凭据、非默认 HTTPS 端口、私有/内部/特殊用途主机名或解析后的 IP，以及不符合相同公开安全策略的重定向。
- `source=trusted-url` 从 `.github/package-trusted-sources.json` 中具名的可信来源策略下载 HTTPS `.tgz`；必须提供 `package_sha256` 和 `trusted_source_id`。仅将其用于由维护者拥有的企业镜像或私有包仓库，这些来源需要配置主机、端口、路径前缀、重定向主机或私有网络解析。如果策略声明了 bearer 身份验证，工作流将使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 密钥；仍会拒绝嵌入 URL 的凭据。
- `source=artifact` 从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但对于对外共享的工件应提供该值。

将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的可信工作流/测试框架代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样，当前测试框架便可验证较旧的可信源提交，而无需运行旧工作流逻辑。

### 套件配置文件

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`root-managed-vps-upgrade`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `package` 集合，但以实时 `plugins` 覆盖取代 `plugins-offline`，并加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 包含 OpenWebUI 的完整 Docker 发布路径分块
- `custom` — 精确的 `docker_lanes`；在 `suite_profile=custom` 时必须提供

`package` 配置文件使用离线插件覆盖，因此已发布包的验证不受 ClawHub 实时可用性的制约。可选 Telegram 通道会复用 `NPM Telegram Beta E2E` 中的 `package-under-test` 工件，同时保留已发布 npm 规格路径供独立调度使用。

有关专门的更新和插件测试策略，包括本地命令、
Docker 通道、包验收输入、发布默认值和失败分类排查，
请参阅[更新和插件测试](/zh-CN/help/testing-updates-plugins)。

发布检查会使用 `source=artifact`、准备好的发布包工件、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` 和 `telegram_mode=mock-openai` 调用包验收。这样，包迁移、更新、实时 ClawHub 技能安装、过期插件依赖项清理、已配置插件安装修复、离线插件、插件更新和 Telegram 验证都会使用同一个已解析的包 tarball。在发布 beta 版本后，可在完整发布验证或 OpenClaw 发布检查中设置 `release_package_spec`，以针对已发布的 npm 包运行相同矩阵而无需重新构建；仅当包验收需要使用不同于其余发布验证的包时，才设置 `package_acceptance_package_spec`。跨操作系统发布检查仍会覆盖操作系统特定的新手引导、安装程序和平台行为；包/更新产品验证应从包验收开始。

`published-upgrade-survivor` Docker 通道会在阻塞式发布路径的每次运行中验证一个已发布包基线。在包验收中，解析出的 `package-under-test` tarball 始终是候选包，`published_upgrade_survivor_baseline` 选择作为回退的已发布基线，默认为 `openclaw@latest`；失败通道的重新运行命令会保留该基线。使用 `run_release_soak=true` 或 `release_profile=full` 的完整发布验证会设置 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以扩展覆盖最近四个稳定 npm 版本、固定的插件兼容性边界版本，以及针对 Feishu 配置、保留的引导/角色文件、已配置的 OpenClaw 插件安装、波浪号日志路径和过期旧版插件依赖根目录的按问题构造测试夹具。多基线已发布升级存留项选择会按基线分片为独立的定向 Docker 运行器作业。当问题是全面验证已发布更新的清理行为，而不是常规完整发布 CI 的覆盖广度时，单独的 `Update Migration` 工作流会使用带有 `all-since-2026.4.23` 基线和 `plugin-deps-cleanup` 场景的 `update-migration` Docker 通道。本地聚合运行可使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传入精确的包规格，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`（例如 `openclaw@2026.4.15`）仅保留单个通道，或设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以运行场景矩阵。已发布包通道会使用内置的 `openclaw config set` 命令配方配置基线，将配方步骤记录在 `summary.json` 中，并在 Gateway 网关启动后探测 `/healthz`、`/readyz` 以及 RPC 状态。Windows 打包包和安装程序全新安装通道还会验证已安装的包能否从原始 Windows 绝对路径导入浏览器控制覆盖项。跨操作系统 OpenAI 智能体轮次冒烟测试在设置 `OPENCLAW_CROSS_OS_OPENAI_MODEL` 时默认使用该值，否则使用 `openai/gpt-5.6-luna`，以便安装和 Gateway 网关验证使用成本较低的 GPT-5.6 测试层级。

### 旧版兼容窗口

包验收为已发布的包提供有限的旧版兼容窗口。直到 `2026.4.25`（包括 `2026.4.25-beta.*`）的包可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可以指向 tarball 中省略的文件；
- 当包未公开该标志时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；
- `update-channel-switch` 可以从基于 tarball 派生的伪 git 测试夹具中移除缺失的 pnpm `patchedDependencies`，并可以记录缺失的持久化 `update.channel`；
- 插件冒烟测试可以读取旧版安装记录位置，或接受缺少应用市场安装记录持久化；
- `plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。

已发布的 `2026.4.26` 包还可以对已发布的本地构建元数据戳文件发出警告，直到 `2026.5.20` 的包在缺少 `npm-shrinkwrap.json` 时也可以警告而非失败。后续包必须满足现代契约；相同条件将导致失败，而不是警告或跳过。

### 示例

```bash
# 使用产品级覆盖验证当前 beta 包。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# 使用包级覆盖验证已发布的扩展稳定版包。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# 使用当前测试框架打包并验证发布分支。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# 验证 tarball URL。source=url 时必须提供 SHA-256。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 验证来自具名可信私有镜像策略的 tarball。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 复用另一次 Actions 运行上传的 tarball。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

调试失败的包验收运行时，先查看 `resolve_package` 摘要，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重新运行命令。应优先重新运行失败的包配置文件或精确的 Docker 通道，而不是重新运行完整发布验证。

## 安装冒烟测试

`Install Smoke` 工作流不再针对拉取请求或 `main` 推送运行。它的夜间/手动包装工作流和发布验证都会调用只读的 `install-smoke-reusable.yml` 核心，并且每次运行都会在 GitHub 托管的运行器上执行完整的安装冒烟测试路径：

- 根 Dockerfile 冒烟镜像针对每个目标 SHA 构建一次，绑定到工作流修订版本和生成方尝试次数并存储在不可变工件中，然后由 CLI 冒烟测试、智能体删除共享工作区的 CLI 冒烟测试、容器 Gateway 网关网络 E2E，以及内置 `matrix` 插件构建参数冒烟测试加载。插件冒烟测试会验证运行时依赖项安装镜像行为，以及插件加载时不会出现入口逸出诊断。
- QR 包安装和安装程序/更新 Docker 冒烟测试（包括 Rocky Linux 安装程序通道以及针对可配置 `update_baseline_version` npm 基线的更新通道）会作为单独作业运行，因此安装程序工作无需等待根镜像冒烟测试完成。

慢速的 Bun 全局安装镜像提供商冒烟测试由 `run_bun_global_install_smoke` 单独控制。它按夜间计划运行，在发布检查调用工作流时默认启用，手动 `Install Smoke` 调度也可以选择启用。常规 PR CI 仍会针对与 Node 相关的更改运行快速 Bun 启动器回归通道。二维码和安装程序 Docker 测试继续使用各自专注于安装的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预构建一个共享的实时测试镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 用于安装程序、更新和插件依赖通道的纯 Node/Git 运行器；
- 将同一个 tarball 安装到 `/app` 中、用于常规功能通道的功能镜像。

Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器仅执行选定的计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道。

### 可调参数

| 变量                               | 默认值 | 用途                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 常规通道的主池槽位数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 对提供商敏感的尾部池槽位数。                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 实时通道并发上限，避免提供商限流。                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | npm 安装通道并发上限。                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 多服务通道并发上限。                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 通道启动之间的错峰间隔，用于避免 Docker 守护进程创建风暴；设为 `0` 可取消错峰。     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每个通道的后备超时（120 分钟）；选定的实时/尾部通道使用更严格的上限。           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未设置   | `1` 会打印调度器计划而不运行通道。                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未设置   | 以逗号分隔的精确通道列表；跳过清理冒烟测试，以便智能体复现单个失败通道。 |

超出其有效上限的通道仍可从空池启动，随后会独占运行，直到释放容量。本地聚合流程会预检 Docker、移除陈旧的 OpenClaw E2E 容器、输出活动通道状态、持久化通道耗时以按最长优先排序，并且默认在首次失败后停止调度新的池化通道。

### 可复用的实时/E2E 工作流

可复用的实时/E2E 工作流通过 `scripts/test-docker-all.mjs --plan-json` 确定所需的软件包、镜像类型、实时镜像、通道和凭据覆盖范围。随后，`scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的软件包工件，或从 `package_artifact_run_id` 下载软件包工件，然后验证 tarball 清单。默认的 `no-push-artifact` 路径通过 Blacksmith 的 Docker 层缓存构建以软件包摘要为标签的纯基础/功能镜像，将精确的镜像字节打包为不可变工作流工件，并让每个使用方验证和加载该工件。`existing-only` 则要求显式提供 `docker_e2e_bare_image`/`docker_e2e_functional_image` GHCR 引用，并且绝不构建或推送。这些注册表拉取操作的每次尝试超时限制为 180 秒，使卡住的数据流能够快速重试，而不会占用 CI 关键路径的大部分时间。计划验证成功后，`openclaw-scheduled-live-checks.yml` 会将不可变的已测试镜像清单传递给独立的软件包写入发布器；只读的发布和预发布调用方绝不会经过该写入器。

### 发布路径分块

发布 Docker 覆盖使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行较小的分块作业，因此每个分块仅验证和加载自身所需的、由工件支持的镜像类型（或在显式 `existing-only` 复用模式下拉取该镜像），并通过同一个加权调度器执行多个通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

当前发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、从 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`，以及 `openwebui`。`package-update-openai` 包含实时 Codex 插件软件包通道，该通道会安装候选 OpenClaw 软件包，从 `codex_plugin_spec` 安装 Codex 插件，或在明确批准安装 Codex CLI 的情况下安装同一引用的 tarball，运行 Codex CLI 预检，然后针对 OpenAI 运行同一会话中的多个 OpenClaw 智能体轮次。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合的插件/运行时别名。`install-e2e` 通道别名仍是两个提供商安装程序通道的聚合手动重运行别名。

每当稳定版或完整发布路径覆盖请求 OpenWebUI 时，它都会作为独立的 `openwebui` 分块运行在专用的大磁盘 Blacksmith 运行器上，即使可复用工作流将受支持的作业路由到 GitHub 托管的运行器也是如此。将外部镜像拉取保持独立，可防止大型镜像与 `plugins-runtime-services` 中的共享软件包和插件镜像争用资源；旧版聚合插件/运行时分块仍包含 OpenWebUI，以支持兼容的手动重运行。内置渠道更新通道会针对短暂的 npm 网络故障重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢速通道表和各通道的重运行命令。工作流的 `docker_lanes` 输入会针对为该次运行准备的镜像执行选定通道，而不是运行分块作业，从而将失败通道调试限制在一个有针对性的 Docker 作业内；如果选定通道是实时 Docker 通道，该定向作业会在本地为此次重运行构建实时测试镜像。重运行辅助程序会验证失败工件中精确选定的目标 SHA，手动调度则会重新打包该引用，因为内部可复用工作流的软件包元组不属于 `workflow_dispatch` 模式。生成的命令仅在准备好的镜像输入由 GHCR 支持时才包含这些输入和 `shared_image_policy=existing-only`；运行器本地工件标签会被省略，以便新运行器重新构建它们。显式目标覆盖会丢弃恢复的 GHCR 镜像引用，除非工件能证明它们与覆盖目标匹配。由工件生成的工作流定义引用也会被省略，因为完整发布临时分支会被删除；除非操作员显式覆盖，否则调度使用仓库默认分支。

```bash
pnpm test:docker:rerun <run-id>      # 下载 Docker 工件，并打印组合式/按通道定向重运行命令
pnpm test:docker:timings <summary>   # 慢速通道和阶段关键路径摘要
```

计划运行的实时/E2E 工作流每天运行完整的发布路径 Docker 套件，并在成功后为精确的已测试镜像工件调用显式发布器。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/软件包覆盖，因此它是由 `Full Release Validation` 或显式操作员调度的独立工作流。常规拉取请求、`main` 推送和独立的手动 CI 调度都不会启用该套件。它会在八个扩展工作器之间均衡分配内置插件测试；这些扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest 工作器和更大的 Node 堆，避免导入密集型插件批次产生额外的 CI 作业。仅限发布的 Docker 预发布路径（由 `full_release_validation` 输入启用）会将目标 Docker 通道按四个一组进行批处理，避免为耗时一至三分钟的作业预留数十个运行器。该工作流还会从 `@openclaw/plugin-inspector` 上传一个仅供参考的 `plugin-inspector-advisory` 工件；检查器发现仅作为分类处置的输入，不会改变具有阻断作用的插件预发布门禁。

## QA Lab

QA Lab 在主要智能范围工作流之外设有专用 CI 通道。智能体功能对等性嵌套在广泛的 QA 和发布工具链中，而不是独立的 PR 工作流。当对等性应随广泛验证运行一起执行时，请使用 `Full Release Validation` 和 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流会在 `main` 上夜间运行，也可手动调度；它将模拟对等性通道、实时 Matrix 通道以及实时 Telegram 和 Discord 通道作为并行作业分发执行。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。

发布检查使用确定性模拟提供商和符合模拟条件的模型（`mock-openai/gpt-5.6-luna` 和 `mock-openai/gpt-5.6-luna-alt`）运行 Matrix 和 Telegram 实时传输通道，从而将渠道契约与实时模型延迟及常规提供商插件启动隔离。实时传输 Gateway 网关会禁用记忆搜索，因为 QA 对等性会单独覆盖记忆行为；提供商连接由独立的实时模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 在计划运行和发布门禁中使用 `--profile fast`，仅当检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 调度始终将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 还会在批准发布前运行发布关键型 QA Lab 通道；其 QA 对等性门禁会将候选包和基线包作为并行通道作业运行，然后将两个工件下载到一个小型报告作业中，完成最终对等性比较。

对于常规 PR，应遵循限定范围的 CI/检查证据，而不要将对等性视为必需状态。

## CodeQL

`CodeQL` 工作流有意设计为范围较窄的首轮安全扫描器，而非完整的仓库扫描。每日运行、手动运行、`main` 推送以及非草稿拉取请求防护运行会扫描 Actions 工作流代码和风险最高的 JavaScript/TypeScript 表面，使用高置信度安全查询，并筛选出高危/严重级别的 `security-severity`。

拉取请求防护保持轻量：仅当 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src` 下的内容或负责进程的内置插件运行时路径发生更改时才会启动，并运行与计划工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不包含在 PR 默认检查中。

### 安全类别

| 类别                                              | 范围                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 身份验证、机密、沙箱、cron 和 Gateway 网关基线                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、机密和审计接触点                                                     |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络防护、Web 获取和插件 SDK SSRF 策略范围                                                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助工具、出站投递和智能体工具执行门禁                                                                          |
| `/codeql-security-high/process-exec-boundary`     | 本地 shell、进程生成辅助工具、拥有子进程的内置插件运行时，以及工作流脚本粘合逻辑                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、清单、注册表、包管理器安装、源代码加载和插件 SDK 包契约信任范围                                                 |

### 平台专用安全分片

- `CodeQL Android Critical Security` — 定时运行的 Android 安全分片。在工作流完整性检查所接受的最小 Blacksmith Linux 运行器上，手动构建 Android 应用以供 CodeQL 分析。上传到 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每周/手动运行的 macOS 安全分片。在 Blacksmith macOS 上手动构建 macOS 应用以供 CodeQL 分析，从上传的 SARIF 中滤除依赖项构建结果，并上传到 `/codeql-critical-security/macos`。此分片不纳入每日默认任务，因为即使构建干净，macOS 构建也会占据大部分运行时间。

### 关键质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它仅在 GitHub 托管的 Linux 运行器上，针对狭窄的高价值范围运行错误严重级别的非安全 JavaScript/TypeScript 质量查询，因此质量扫描不会消耗 Blacksmith 运行器注册预算。其拉取请求门禁刻意小于定时运行配置：非草稿 PR 只运行与其所触及范围相匹配的分片，共有十三个可按 PR 路由的分片——`agent-runtime-boundary`、`channel-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`memory-runtime-boundary`、`network-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime`、`provider-runtime-boundary` 和 `session-diagnostics-boundary`。`ui-control-plane` 和 `web-media-runtime-boundary` 不在 PR 运行范围内。CodeQL 配置和质量工作流变更会运行完整的 PR 分片集（网络运行时分片根据其自身的 CodeQL 配置文件和负责网络的源代码路径触发）。

手动调度接受：

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

这些狭窄配置是用于单独运行某个质量分片的教学和迭代入口。

| 类别                                                    | 范围                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 身份验证、机密、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                           |
| `/codeql-critical-quality/config-boundary`              | 配置架构、迁移、规范化和 IO 契约                                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议架构和服务器方法契约                                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分派、自动回复分派与队列，以及 ACP 控制平面运行时契约                                                                                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器和工具桥接、进程监管辅助工具，以及出站投递契约                                                                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆宿主 SDK、记忆运行时外观、记忆插件 SDK 别名、记忆运行时激活粘合逻辑，以及记忆 Doctor 命令                                                                  |
| `/codeql-critical-quality/network-runtime-boundary`     | 网络策略包、原始套接字和代理捕获运行时、SSH 隧道、Gateway 网关锁、JSONL 套接字，以及推送传输范围                                                               |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话投递队列、出站会话绑定/投递辅助工具、诊断事件/日志包范围，以及会话 Doctor CLI 契约                                                         |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分派、回复载荷/分块/运行时辅助工具、渠道回复选项、投递队列，以及会话/线程绑定辅助工具                                                          |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商身份验证与发现、提供商运行时注册、提供商默认值/目录，以及 Web/搜索/获取/嵌入注册表                                                        |
| `/codeql-critical-quality/ui-control-plane`             | Control UI 引导启动、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 Web 获取/搜索、媒体 IO、媒体理解、图像生成，以及媒体生成运行时契约                                                                                           |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公共接口和插件 SDK 入口点契约                                                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧的插件 SDK 源代码和插件包契约辅助工具                                                                                                                    |

质量检查与安全检查保持分离，因此可以独立调度、衡量、禁用或扩展质量发现，而不会掩盖安全信号。只有在这些狭窄配置具备稳定的运行时间和信号后，才应将 Swift、Python 和内置插件的 CodeQL 扩展作为有范围限定或分片的后续工作重新加入。

## 维护工作流

### 文档智能体

`Docs Agent` 工作流是一条事件驱动的 Codex 维护通道，用于使现有文档与最近落地的变更保持一致。它没有单纯的定时计划：`main` 上由非机器人推送触发的 CI 成功运行可以触发它，也可以通过手动调度直接运行。通过工作流运行触发时，如果 `main` 已经推进，或者过去一小时内已创建另一个未跳过的文档智能体运行，则会跳过。运行时，它会审查从上一个未跳过的文档智能体源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档检查以来累积的所有主分支变更。

### 测试性能智能体

`Test Performance Agent` 工作流是一条面向慢速测试的事件驱动 Codex 维护通道。它没有单纯的定时计划：`main` 上由非机器人推送触发的 CI 成功运行可以触发它，但如果当天 UTC 日期内另一个工作流运行调用已经运行或正在运行，它就会跳过。手动调度会绕过此每日活动门禁。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 仅进行保留覆盖率的小型测试性能修复，而不是大范围重构；随后重新运行完整测试套件报告，并拒绝会减少基线通过测试数量的变更。分组报告会记录 Linux 和 macOS 上各配置的实际耗时与最大 RSS，因此前后对比会在持续时间变化旁展示测试内存变化。如果基线存在失败测试，Codex 只能修复明显的失败，而且智能体处理后的完整测试套件报告必须通过，才能提交任何内容。当 `main` 在机器人推送落地前推进时，该通道会变基已验证的补丁，重新运行 `pnpm check:changed`，并重试推送；存在冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以维持与文档智能体相同的移除 sudo 安全策略。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是供维护者在变更落地后清理重复项的手动工作流。它默认采用试运行模式，并且仅在 `apply=true` 时关闭明确列出的 PR。在修改 GitHub 前，它会验证已落地的 PR 确实已经合并，并验证每个重复 PR 是否存在共同引用的问题或重叠的变更块。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门禁和变更路由

本地变更通道路由逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更加严格：

- 核心生产代码变更运行核心生产代码和核心测试类型检查，以及核心 lint/防护检查；
- 仅核心测试变更只运行核心测试类型检查和核心 lint；
- 扩展生产代码变更运行扩展生产代码和扩展测试类型检查，以及扩展 lint；
- 仅扩展测试变更运行扩展测试类型检查和扩展 lint；
- 公共插件 SDK 或插件契约变更会扩展到扩展类型检查，因为扩展依赖这些核心契约（Vitest 扩展全面检查仍属于显式测试工作）；
- 仅发布元数据的版本号更新运行有针对性的版本/配置/根依赖检查；
- 未知的根目录/配置变更会以安全方式回退到所有检查通道。

本地变更测试路由逻辑位于 `scripts/test-projects.test-support.mjs`，并且刻意比 `check:changed` 成本更低：直接修改的测试会运行自身；源代码变更优先采用显式映射，然后运行同级测试和导入图依赖项。共享群组房间投递配置是显式映射之一：对群组可见回复配置、源回复投递模式或消息工具系统提示词的变更，会路由到核心回复测试以及 Discord 和 Slack 投递回归测试，从而确保共享默认值变更在首次推送 PR 前失败。仅当变更在测试工具层面的影响足够广泛，以至于低成本映射集无法作为可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

Crabbox 是由仓库维护的远程运行环境封装器，用于维护者在 Linux 上进行验证。仅当源代码可信且现有依赖已安装就绪时，Agent 会话才会在本地运行一个或少量聚焦测试以及低成本静态检查。对于较大的测试套件和计算密集型工作，包括构建、类型检查、lint 扇出、Docker、软件包测试通道、E2E、实时验证和 CI 一致性验证，则使用 Crabbox。可信维护者的重型验证默认使用 `blacksmith-testbox`，而 `.crabbox.yaml` 现在也默认使用它。其配置的工作流会注入提供商和 Agent 凭据，因此不可信的贡献者或 fork 代码必须改用无密钥的 fork CI 或经过净化的 AWS 直连 Crabbox。经过净化的 AWS 运行会设置 `CRABBOX_ENV_ALLOW=CI`、传递 `--no-hydrate`，并使用全新的临时远程 `HOME`；这可防止仓库的 `OPENCLAW_*` 允许列表和现有身份验证配置文件接触不可信代码。它们使用专用于该不可信源的新预热租约，绝不使用可信租约或此前已注入凭据的租约。从干净、可信的 `main` 检出中启动已安装的可信 Crabbox 二进制文件，并仅使用 `--fresh-pr` 获取远程 PR；绝不要在本地执行不可信检出的封装器或配置。取消设置 `CRABBOX_AWS_INSTANCE_PROFILE`，除非解析后的 `aws.instanceProfile` 为空，否则采取失败关闭策略。在任何安装或测试之前，使用具有绝对路径的可信工具强制要求 IMDSv2 令牌，证明 IAM 凭据端点返回 404，并将远程 `git rev-parse HEAD` 与已审核 PR 头部的完整 SHA 进行比较。将租约绑定到该 SHA，并在头部发生变化时停止并重新预热。将干净 `main` 中的可信 `scripts/crabbox-untrusted-bootstrap.sh` 与 `--fresh-pr` 一起上传；它会安装固定版本的 Node/pnpm、验证 SHA 和软件包管理器版本约束、隔离 `HOME`、安装依赖项，然后执行所请求的测试。
取消设置所有 `CRABBOX_TAILSCALE*` 覆盖项，强制使用 `--network public
--tailscale=false`，清除出口节点/LAN 标志，并要求 `crabbox inspect` 在上传任何脚本之前报告使用公共网络且不存在 Tailscale 状态。
自有 AWS/Hetzner 容量仍作为 Blacksmith 服务中断、配额问题或明确要求使用自有容量进行测试时的后备方案。

Agent 不会为预计的工作提前预热。第一个重型命令准备就绪时再按需获取 Testbox，为后续重型命令复用返回的 `tbx_...` ID，每次运行时同步当前检出，并在交接前停止它。

由 Crabbox 支持的 Blacksmith 运行会对一次性 Testbox 执行预热、认领、同步、运行、报告和清理。当同步环境中的 `git status --short` 显示至少删除了 200 个受跟踪文件时，内置同步完整性检查会快速失败，从而发现 `pnpm-lock.yaml` 等根目录文件消失的问题。对于有意大量删除文件的 PR，请为远程命令设置 `CRABBOX_ALLOW_MASS_DELETIONS=1`。

如果本地 Blacksmith CLI 调用停留在同步阶段超过五分钟且没有同步后的输出，Crabbox 也会终止该调用。设置 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可禁用此保护，或者针对异常庞大的本地差异使用更大的毫秒值。

首次运行前，请从仓库根目录检查封装器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

仓库封装器会拒绝未声明支持所选提供商的过期 Crabbox 二进制文件；由 Blacksmith 支持的运行要求 Crabbox 0.22.0 或更高版本，以便封装器获得当前的 Testbox 同步、排队和清理行为。在 Codex 工作树或链接/稀疏检出中，请避免使用本地 `pnpm crabbox:run` 脚本，因为 pnpm 可能会在 Crabbox 启动前协调依赖项；请改为直接调用 Node 封装器：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

使用同级检出时，请在计时或验证工作前重新构建被忽略的本地二进制文件：

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

`.crabbox.yaml` 中的 `blacksmith:` 块已经固定组织、工作流、作业和引用的默认值，因此下方的显式标志是可选的。变更检查：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

当本地依赖项不可用或目标会产生扇出时，在 Testbox 上重新运行聚焦测试：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

完整测试套件：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

读取最终的 JSON 摘要。有用的字段是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。对于委派的 Blacksmith Testbox 运行，Crabbox 封装器的退出码和 JSON 摘要就是命令结果。关联的 GitHub Actions 运行负责凭据注入和保活；如果 SSH 命令已经返回后 Testbox 被外部停止，它可能会以 `cancelled` 结束。除非封装器的 `exitCode` 非零或命令输出显示测试失败，否则应将其视为清理/状态工件。由 Blacksmith 支持的一次性 Crabbox 运行应自动停止 Testbox；如果运行被中断或清理状态不明确，请检查正在运行的环境，并且只停止由你创建的环境：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

仅当你确实需要在同一个已注入凭据的环境中运行多个命令时，才使用复用：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

复用租约，而不是过期的源代码。省略 `--no-sync`，以便每次运行都上传当前检出；仅当有意重新运行未更改且已同步的工作树时才使用它。不可信的贡献者/fork 代码必须为每个命令使用 `CRABBOX_ENV_ALLOW=CI`、`--provider aws --no-hydrate` 和全新的临时远程 `HOME`；在该净化命令内安装依赖项，然后再进行测试。只能复用专用于同一个不可信源的新预热租约；绝不能使用可信租约或此前已注入凭据的租约。绝不要在本地执行不可信检出的封装器或配置：从干净、可信的 `main` 启动已安装的可信 Crabbox 二进制文件，并在每次运行时传递 `--fresh-pr`。保持 `CRABBOX_AWS_INSTANCE_PROFILE` 未设置，拒绝解析后非空的实例配置文件，要求提供可信的远程 IMDS 无角色证明，并在安装或测试前验证已审核的头部 SHA。将租约绑定到该 SHA；任何头部变化后都应停止并重新预热。如果不存在远程 PR，请使用无密钥的 fork CI。绝不要为不可信源选择 `hydrate-github` 或会注入凭据的 Blacksmith 工作流。

如果损坏的是 Crabbox 层而 Blacksmith 本身正常，则仅将直接使用 Blacksmith 用于 `list`、`status` 和清理等诊断。在将 Blacksmith 直连运行视为维护者验证之前，应先修复 Crabbox 路径。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 正常工作，但新预热任务在几分钟后仍处于 `queued` 状态，且没有 IP 或 Actions 运行 URL，应将其视为 Blacksmith 提供商、队列、计费或组织限制压力。停止你创建的已排队 ID，避免启动更多 Testbox，并将验证迁移到下方的自有 Crabbox 容量路径，同时由相关人员检查 Blacksmith 控制面板、计费和组织限制。

仅当 Blacksmith 服务中断、受配额限制、缺少所需环境，或明确以自有容量为目标时，才升级到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

在 AWS 容量紧张时，应避免使用 `class=beast`，除非任务确实需要 48xlarge 级 CPU。`beast` 请求从 192 个 vCPU 起步，最容易触发区域 EC2 Spot 或 On-Demand Standard 配额。仓库维护的 `.crabbox.yaml` 默认使用 `class: standard`、按需市场和 `capacity.hints: true`，使经代理分配的 AWS 租约能够输出所选区域/市场、配额压力、Spot 后备以及高压力规格警告。较重的大范围检查使用 `fast`；仅当 standard/fast 不足时才使用 `large`；仅对完整测试套件或全插件 Docker 矩阵、明确的发布/阻塞项验证或高核心数性能分析等特殊 CPU 密集型通道使用 `beast`。不要将 `beast` 用于 `pnpm check:changed`、聚焦测试、仅文档工作、常规 lint/类型检查、小型 E2E 复现或 Blacksmith 服务中断分诊。使用 `--market on-demand` 进行容量诊断，以免 Spot 市场波动混入信号。

`.crabbox.yaml` 负责提供商、同步和 GitHub Actions 凭据注入默认值。Crabbox 同步绝不会传输 `.git`，因此已注入凭据的 Actions 检出会保留自己的远程 Git 元数据，而不会同步维护者本地的远程配置和对象存储；此外，仓库配置还会排除绝不应传输的本地运行时/构建工件，例如 `.artifacts` 和测试报告。`.github/workflows/crabbox-hydrate.yml` 负责检出、Node/pnpm 设置、`origin/main` 获取，以及自有云 `crabbox run --id <cbx_id>` 命令的非密钥环境交接。

## 相关内容

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
