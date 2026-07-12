---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试一项失败的 GitHub Actions 检查
    - 你正在协调一次发布验证运行或重新运行
    - 你正在更改 ClawSweeper 调度或 GitHub 活动转发
summary: CI 作业图、范围门禁、发布总括任务和对应的本地命令
title: CI 流水线
x-i18n:
    generated_at: "2026-07-12T14:20:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8ff447c56fabf3148d4368567c2365e6940f00aded8b7212ae3d232a777d92a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 在推送到 `main` 时运行（Markdown 和 `docs/**` 路径在触发阶段会被忽略），也会针对非草稿拉取请求运行（仅包含 CHANGELOG 的差异会被忽略），并支持手动触发。规范的 `main` 推送首先经过 90 秒的托管运行器准入窗口；当有较新的提交进入时，`CI` 并发组会取消该等待中的运行，因此连续合并不会各自注册完整的 Blacksmith 矩阵。拉取请求和手动触发会跳过等待。随后，`preflight` 作业会对差异进行分类，并在仅有不相关区域发生更改时关闭高开销的执行通道。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，为候选版本和广泛验证展开完整的任务图。Android 执行通道仍通过 `include_android`（或 `release_gate` 输入）选择性启用。仅限发布的插件覆盖位于单独的 [`Plugin Prerelease`](#plugin-prerelease) 工作流中，并且仅从 [`Full Release Validation`](#full-release-validation) 或显式手动触发运行。

## 流水线概览

| 作业                                | 用途                                                                                                                                                                                                               | 运行时机                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 检测仅文档变更、变更的范围、变更的扩展，并构建 CI 清单                                                                                                                               | 非草稿推送和 PR 始终运行                  |
| `runner-admission`                 | 在注册 Blacksmith 工作之前，对规范 `main` 推送执行由托管运行器完成的 90 秒防抖                                                                                                                            | 每次 CI 运行；仅对规范 `main` 推送休眠 |
| `security-fast`                    | 检测私钥、通过 `zizmor` 审计变更的工作流，以及审计生产环境锁文件                                                                                                                             | 非草稿推送和 PR 始终运行                  |
| `pnpm-store-warmup`                | 预热由锁文件固定版本的 pnpm 存储缓存，同时不阻塞 Linux Node 分片                                                                                                                                          | 选中 Node 或文档检查通道                   |
| `build-artifacts`                  | 构建 `dist/`、Control UI，执行已构建 CLI 的冒烟检查、启动内存检查和嵌入式构建工件检查                                                                                                                 | Node 相关变更                               |
| `control-ui-i18n`                  | 验证生成的 Control UI 语言区域包、元数据和翻译记忆库；自动运行时仅提供建议，在手动发布 CI 中则为阻塞项                                                                               | Control UI i18n 相关变更和手动 CI      |
| `checks-fast-core`                 | 快速 Linux 正确性通道：内置组件 + 协议、Bun 启动器和 CI 路由快速任务                                                                                                                          | Node 相关变更                               |
| `qa-smoke-ci-profile`              | 有界自动 QA 冒烟代表性集合的两个自包含均衡部分；完整分类覆盖仍可通过显式 QA 配置使用                                                         | Node 相关变更                               |
| `checks-fast-contracts-plugins-*`  | 两个加权插件契约分片                                                                                                                                                                                   | Node 相关变更                               |
| `checks-fast-contracts-channels-*` | 两个加权渠道契约分片                                                                                                                                                                                  | Node 相关变更                               |
| `checks-node-*`                    | 核心 Node 测试分片，不包括渠道、内置组件、契约和扩展通道                                                                                                                                      | Node 相关变更                               |
| `check-*`                          | 分片的主要本地门禁等效项：防护检查、shrinkwrap、内置渠道配置元数据、生产类型、lint、依赖项、测试类型                                                                                   | Node 相关变更                               |
| `check-additional-*`               | 边界检查分带（包括提示词快照漂移）、会话访问器/转录读取器/SQLite 事务边界、扩展 lint 组、包边界编译/金丝雀测试和运行时拓扑架构 | Node 相关变更                               |
| `checks-node-compat-node22`        | Node 22 兼容性构建和冒烟通道                                                                                                                                                                            | 为发布手动分派 CI                     |
| `check-docs`                       | 文档格式、lint 和失效链接检查                                                                                                                                                                         | 文档发生变更（PR 和手动分派）              |
| `native-i18n`                      | 原生应用、Android 和 Apple i18n 清单检查                                                                                                                                                                  | 原生 i18n 相关变更                        |
| `skills-python`                    | 对 Python 支持的 Skills 运行 Ruff + pytest                                                                                                                                                                                | Python Skills 相关变更                       |
| `checks-windows`                   | Windows 专用进程/路径测试，以及共享运行时导入说明符回归测试                                                                                                                                  | Windows 相关变更                            |
| `macos-node`                       | 聚焦的 macOS TypeScript 测试：launchd、Homebrew、运行时路径、打包脚本、进程组包装器                                                                                                            | macOS 相关变更                              |
| `macos-swift`                      | macOS 应用的 Swift lint、构建和测试                                                                                                                                                                        | macOS 相关变更                              |
| `ios-build`                        | 生成 Xcode 项目并构建 iOS 应用模拟器版本                                                                                                                                                             | iOS 应用、共享应用工具包或 Swabble 变更         |
| `android`                          | 两种 flavor 的 Android 单元测试，以及一次调试 APK 构建                                                                                                                                                          | Android 相关变更                            |
| `test-performance-agent`           | 独立工作流：可信活动后每日进行 Codex 慢速测试优化                                                                                                                                          | 主 CI 成功或手动分派                  |
| `openclaw-performance`             | 独立工作流：每日/按需生成 Kova 运行时性能报告，包含模拟提供商、深度性能分析和 GPT 5.6 实时通道                                                                                          | 定时和手动分派                       |

## 快速失败顺序

1. `runner-admission` 仅等待规范的 `main` 推送；新的推送会在 Blacksmith 注册前取消该运行。
2. `preflight` 决定实际存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是此作业中的步骤，而不是独立作业。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 会快速失败，无需等待更繁重的工件和平台矩阵作业。
4. `build-artifacts` 和建议性的 `control-ui-i18n` 检查会与快速 Linux 通道并行运行。生成的区域设置漂移会保持可见，同时独立的刷新工作流会在后台修复它。
5. 随后会扇出更繁重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。

当新的推送到达同一 PR 或 `main` 引用时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用的最新运行也失败，否则应将其视为 CI 噪声。矩阵作业使用 `fail-fast: false`，而 `build-artifacts` 会直接报告内嵌的渠道、核心支持边界和 gateway-watch 故障，而不是将小型验证作业加入队列。自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 端旧队列组中的僵尸任务无法无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，且不会取消正在进行的运行。插件列表启动内存防护在自托管 Blacksmith Linux 上将上限保持为 350 MiB，在 GitHub 托管的 Linux 上则允许 425 MiB，因为对于同一构建后的 CLI，后者的 RSS 基线更高。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>` 可汇总 GitHub Actions 的总耗时、排队时间、最慢作业、故障以及 `pnpm-store-warmup` 扇出屏障。工作流内的 `ci-timings-summary` 作业存在于 `ci.yml` 中，但目前已禁用（`if: false`）；请改为在本地运行计时辅助工具。要查看构建计时，请检查 `build-artifacts` 作业的 `Build dist` 步骤：`pnpm build:ci-artifacts` 会输出 `[build-all] phase timings:` 并包含 `ui:build`；该作业还会上传 `startup-memory` 工件。

## PR 上下文和证据

外部贡献者 PR 会运行来自
`.github/workflows/real-behavior-proof.yml` 的 PR 上下文和证据门禁。该工作流会检出
受信任的工作流修订版本（`github.workflow_sha`），并且仅评估 PR 正文；
它不会执行贡献者分支中的代码。

该门禁适用于既不是仓库所有者、成员、协作者，也不是机器人的 PR 作者。当 PR 正文包含作者撰写的 `What Problem This Solves` 和 `Evidence` 章节时，门禁通过。证据可以是聚焦测试、CI 结果、屏幕截图、录屏、终端输出、实时观察、脱敏日志或工件链接。正文用于说明意图并提供有用的验证信息；审阅者会检查代码、测试和 CI 以评估正确性。

检查失败时，请更新 PR 正文，而不是再推送一个代码提交。

## 范围和路由

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动触发会跳过变更范围检测，使预检清单按照每个受范围控制的区域均已发生变更来执行。

- **CI 工作流编辑**会验证 Node CI 图、工作流 lint 和 Windows 通道（由 `ci.yml` 执行），但这些编辑本身不会强制执行 iOS、Android 或 macOS 原生构建；这些平台通道仍仅限于平台源代码变更。
- **Workflow Sanity** 会对所有工作流 YAML 文件运行 `actionlint` 和 `zizmor`，并运行复合操作插值防护和冲突标记防护。限定于 PR 的 `security-fast` 作业还会对发生变更的工作流文件运行 `zizmor`，从而使工作流安全问题能在主 CI 图中尽早导致失败。
- **推送到 `main` 时的文档**由独立的 `Docs` 工作流使用与 CI 相同的 ClawHub 文档镜像进行检查，因此混合的代码与文档推送不会同时将 CI 的 `check-docs` 分片加入队列。文档发生变更时，拉取请求和手动 CI 仍会从 CI 运行 `check-docs`。
- **TUI PTY** 会在 TUI 变更时运行于 `checks-node-core-runtime-tui-pty` Linux Node 分片。该分片使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 运行 `test/vitest/vitest.tui-pty.config.ts`，因此既覆盖确定性的 `TuiBackend` 固件通道，也覆盖速度较慢、仅模拟外部模型端点的 `tui --local` 冒烟测试。
- **仅涉及 CI 路由的编辑、快速任务直接运行的少量核心测试固件，以及范围较窄的插件契约辅助程序编辑**会使用快速的纯 Node 清单路径：`preflight`、`security-fast`，以及仅由变更触及的快速通道——单个 `checks-fast-core` CI 路由任务、两个插件契约分片或二者。该路径会跳过构建工件、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和其他防护矩阵。
- **Windows Node 检查**仅限于 Windows 特有的进程/路径包装器、npm/pnpm/UI 运行器辅助程序、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源代码、插件、安装冒烟测试和纯测试变更仍在 Linux Node 通道上运行。

最慢的 Node 测试族会被拆分或平衡，使每个作业保持较小规模，同时避免预留过多运行器：

- 插件契约和渠道契约各自在两个由 Blacksmith 支持的加权分片中运行，并以标准 GitHub 运行器作为回退。
- 核心单元快速/支持通道分别运行；核心运行时基础设施拆分为进程、共享、钩子、密钥以及三个 cron 领域分片。
- 自动回复以平衡的工作节点运行，其中回复子树拆分为智能体运行器、命令、分派、会话和状态路由分片。
- Agentic Gateway 网关/服务器（控制平面）配置拆分到聊天、身份验证、模型、HTTP/插件、运行时和启动通道，而不是等待构建工件。
- 普通 CI 仅将隔离的基础设施包含模式分片打包为确定性组合，每个组合最多包含 64 个测试文件，从而在不合并非隔离的命令/cron、有状态的 agents-core 或 Gateway 网关/服务器测试套件的情况下缩减 Node 矩阵。固定的重型测试套件继续使用 8 vCPU，而打包后和权重较低的通道使用 4 vCPU。
- 规范仓库上的拉取请求使用紧凑的准入计划：相同的按配置分组在隔离的子进程中运行，目前使用 19 个 Node 测试作业，而不是包含 74 个作业的完整矩阵。单个完整配置批次会分散到现有的同运行器紧凑作业中，同时保留其 120 分钟超时；串行工具配置则在三个仅用于 PR 的分组中交错分配；推送到 `main`、手动触发和发布门禁仍保留完整矩阵。
- 广泛的浏览器、QA、媒体和其他插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。包含模式分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和经过筛选的分片。
- `check-additional-*` 将补充边界防护列表（`scripts/run-additional-boundary-checks.mjs`）交错分配到一个提示词密集型分片（`check-additional-boundaries-a`，其中包含 Codex 提示词快照漂移检查）和一个用于其余分组的组合分片（`check-additional-boundaries-bcd`）；每个分片都会并发运行独立防护并输出每项检查的计时。包边界编译/金丝雀工作保持在一起，而运行时拓扑架构检查则与嵌入 `build-artifacts` 的 Gateway 网关监视覆盖分开运行。
- 在 `dist/` 和 `dist-runtime/` 已构建完成后，Gateway 网关监视、渠道测试和核心支持边界分片会在 `build-artifacts` 内并发运行。

通过准入后，规范 Linux CI 最多允许 28 个 Node 测试作业并发运行，
较小的快速/检查通道最多允许 12 个；由于 Windows 和 Android 的
运行器池规模较小，两者仍保持为 2 个。紧凑的完整配置批次使用
120 分钟的批次超时，而包含模式分组共享相同的受限作业预算。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play 调试 APK。第三方变体没有单独的源集或清单；其单元测试通道仍会使用 SMS/通话记录 BuildConfig 标志编译该变体，同时避免在每次与 Android 相关的推送中重复执行调试 APK 打包作业。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`（仅检查生产依赖的 Knip 流程，固定使用确切的 Knip 版本，并在 `dlx` 安装时禁用 pnpm 的最短发布时限）和 `pnpm deadcode:unused-files`。后者会将 Knip 发现的生产环境未使用文件与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较；此外，还会生成建议性质的 `pnpm deadcode:report:ci:ts-unused` 报告，并将其作为 `deadcode-reports` 工件上传。当 PR 新增未经审阅的未使用文件或留下过时的允许列表条目时，未使用文件防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、实时测试和包桥接表面。

## ClawSweeper 活动转发

`.github/workflows/clawsweeper-dispatch.yml` 是将 OpenClaw 仓库活动传入 ClawSweeper 的目标侧桥接工作流。它不会检出或执行不受信任的拉取请求代码。该工作流使用 `CLAWSWEEPER_APP_PRIVATE_KEY` 创建 GitHub App 令牌，然后向 `openclaw/clawsweeper` 分派紧凑的 `repository_dispatch` 负载。

该工作流包含四条通道：

- `clawsweeper_item`，用于精确的议题和拉取请求审阅请求；
- `clawsweeper_comment`，用于议题评论中的显式 ClawSweeper 命令；
- `clawsweeper_commit_review`，用于推送到 `main` 时的提交级审阅请求；
- `github_activity`，用于 ClawSweeper 智能体可能检查的一般 GitHub 活动。

`github_activity` 通道仅转发规范化元数据：事件类型、操作、参与者、仓库、项目编号、URL、标题、状态，以及存在评论或审阅时的简短摘录。它有意避免转发完整的 webhook 正文。`openclaw/clawsweeper` 中接收事件的工作流是 `.github/workflows/github-activity.yml`，该工作流会将规范化事件发布到供 ClawSweeper 智能体使用的 OpenClaw Gateway 网关钩子。

一般活动用于观察，默认不进行投递。ClawSweeper 智能体会在其提示词中收到 Discord 目标，并且仅当事件出乎意料、可采取行动、存在风险或对运维有用时，才应发布到 `#clawsweeper`。常规的创建、编辑、机器人活动、重复的 webhook 噪声和正常审阅流量应返回 `NO_REPLY`。

在整个路径中，应将 GitHub 标题、评论、正文、审阅文本、分支名称和提交消息视为不受信任的数据。它们是摘要和分流的输入，而不是工作流或智能体运行时的指令。

## 手动触发

手动 CI 触发运行与普通 CI 相同的作业图，但会强制启用所有非 Android 的受范围控制通道：Linux Node 分片、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建工件冒烟检查、文档检查、Python Skills、Windows、macOS、iOS 构建和 Control UI i18n。Control UI 语言区域一致性在自动 PR 和 `main` 运行中属于建议性检查，因为独立的刷新工作流会在后台修复生成内容的漂移；在手动 CI 中，该检查为阻塞性检查，因此在完整发布验证中同样如此。独立的手动 CI 触发仅在 `include_android=true` 时运行 Android（`release_gate` 输入也会强制启用 Android）；完整发布总控工作流会通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅用于发布的 `agentic-plugins` 分片、完整扩展批量扫描和插件预发布 Docker 通道不包含在 CI 中。仅当 `Full Release Validation` 在启用发布验证门禁的情况下触发独立的 `Plugin Prerelease` 工作流时，才会运行 Docker 预发布测试套件。

手动运行使用唯一的并发组，因此发布候选的完整测试套件不会被同一引用上的另一次推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任的调用方针对分支、标签或完整提交 SHA 运行该作业图，同时使用所选触发引用中的工作流文件。`release_gate` 输入是针对因容量不足而停滞的 PR CI 的精确 SHA 维护者回退方案：它要求 `target_ref` 是与所触发分支头匹配的完整提交 SHA。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

每月仅发布 npm 的扩展稳定版路径属于例外：从确切的
`extended-stable/YYYY.M.33` 分支同时触发 `OpenClaw NPM
Release` 预检和 `Full Release Validation`，保留它们的运行 ID，并将这两个 ID 传递给
直接 npm 发布运行。有关命令、确切身份要求、注册表回读和选择器
修复流程，请参阅[每月仅发布 npm 的扩展稳定版](/zh-CN/reference/RELEASING#monthly-npm-only-extended-stable-publication)。
该路径不会触发插件、macOS、Windows、GitHub
Release、私有 dist-tag 或其他平台发布。

## 运行器

| 运行器                          | 作业                                                                                                                                                                                                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手动触发 CI 和非规范仓库的回退作业、QA Smoke 聚合作业、CodeQL 安全与质量扫描、workflow-sanity、labeler、auto-response、独立的 Docs 工作流，以及整个 Install Smoke 工作流                                                                  |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、`pnpm-store-warmup`、`native-i18n`、除 QA Smoke CI 外的 `checks-fast-core`、插件/渠道契约分片、大多数内置/较轻量的 Linux Node 分片、除 `check-lint` 外的 `check-*` 通道、选定的 `check-additional-*` 分片、`check-docs` 和 `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的重型 Linux Node 测试套件、侧重边界/扩展的 `check-additional-*` 分片，以及 `android`                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404` | 自动 QA Smoke CI 分片、CI 和 Testbox 中的 `build-artifacts`，以及 `check-lint`（对 CPU 足够敏感，使用 8 vCPU 增加的成本高于节省的成本）                                                                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                   |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；分叉仓库回退到 `macos-15`                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 和 `ios-build`；分叉仓库回退到 `macos-26`                                                                                                                                                                                                                |

## 运行器注册预算

OpenClaw 当前的 GitHub 运行器注册配额桶在 `ghx api rate_limit` 中显示，每 5 分钟允许 10,000 次自托管
运行器注册。每次调优前都应重新检查
`actions_runner_registration`，因为 GitHub 可能会更改
此配额桶。该限制由 `openclaw` 组织中的所有 Blacksmith 运行器注册共享，
因此再添加一个 Blacksmith 安装实例并不会增加
新的配额桶。

将 Blacksmith 标签视为控制突发负载的稀缺资源。仅执行
路由、通知、汇总、选择分片或短时 CodeQL 扫描的作业应
继续使用 GitHub 托管的运行器，除非经测量证明确有 Blacksmith 特定
需求。任何新的 Blacksmith 矩阵、更大的 `max-parallel` 或高频
工作流都必须展示其最坏情况下的注册次数，并将组织级
目标保持在实时配额桶的大约 60% 以下。按照当前 10,000 次注册的
配额桶计算，这意味着运行目标为 6,000 次注册，从而为
并发仓库、重试和突发重叠预留余量。

规范仓库的 CI 在正常推送和拉取请求运行中仍默认使用 Blacksmith 运行器路径。`workflow_dispatch` 和非规范仓库运行使用 GitHub 托管的运行器，但正常的规范仓库运行目前不会探测 Blacksmith 队列健康状况，也不会在 Blacksmith 不可用时自动回退到 GitHub 托管的标签。

## 本地等效命令

```bash
pnpm changed:lanes                            # 检查 origin/main...HEAD 的本地变更通道分类器
pnpm check:changed                            # 智能本地检查门禁：按边界通道检查变更的格式、类型、lint 和守卫
pnpm check                                    # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed                              # 相同门禁，并显示各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest 测试
pnpm test:changed                             # 低成本的智能变更 Vitest 目标
pnpm test:ui                                  # Control UI 单元/浏览器测试套件
pnpm ui:i18n:check                            # 生成的 Control UI 区域设置一致性（发布门禁）
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # 文档格式 + lint + 失效链接
pnpm build                                    # 当 CI 工件/冒烟检查很重要时构建 dist
pnpm ios:build                                # 生成并构建 iOS 应用项目
pnpm ci:timings                               # 汇总最新的 origin/main 推送 CI 运行
pnpm ci:timings:recent                        # 比较近期成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略议题/评论噪声，并选择 origin/main 推送 CI
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

手动触发通常会对工作流引用进行基准测试。设置 `target_ref`，可使用当前工作流实现对某个发布标签或其他分支进行基准测试。已发布的报告路径和 latest 指针以被测引用为键，每个 `index.md` 都会记录被测引用/SHA、工作流引用/SHA、Kova 引用、配置文件、通道身份验证模式、模型、重复次数和场景筛选条件。

该工作流会从固定版本安装 OCM，并根据固定的 `kova_ref` 输入从 `openclaw/Kova` 安装 Kova，然后运行三个通道：

- `mock-provider`：使用确定性的虚假 OpenAI 兼容身份验证，针对本地构建的运行时运行 Kova 诊断场景。
- `mock-deep-profile`：针对启动、Gateway 网关和智能体轮次热点进行 CPU/堆/跟踪分析。按计划运行，或在使用 `deep_profile=true` 手动触发时运行。
- `live-openai-candidate`：执行一次使用真实 OpenAI `openai/gpt-5.6-luna` 的智能体轮次；当 `OPENAI_API_KEY` 不可用时跳过。按计划运行，或在使用 `live_openai_candidate=true` 手动触发时运行。

模拟提供商通道还会在 Kova 流程通过后运行 OpenClaw 原生源码探针：针对默认、跳过渠道、内部钩子和五十插件启动场景测量 Gateway 网关启动耗时与内存；测量内置插件导入 RSS；运行重复的模拟 OpenAI `channel-chat-baseline` hello 循环；针对已启动的 Gateway 网关运行 CLI 启动命令；以及运行 SQLite 状态冒烟性能探针。如果测试引用存在此前已发布的模拟提供商源码报告，源码摘要会将当前 RSS 和堆值与该基线进行比较，并将较大的 RSS 增幅标记为 `watch`。源码探针 Markdown 摘要位于报告包中的 `source/index.md`，原始 JSON 文件与其放在一起。

每个通道都会上传其完整的 GitHub 工件，包括 CPU、堆、跟踪和压缩诊断包。单独的发布作业会下载并验证这些工件，然后签发一个短期有效的 ClawSweeper GitHub App 令牌，其权限范围仅限 `openclaw/clawgrit-reports` 内容，并且只将该令牌传递给 Git 推送步骤。该作业会将 `report.json`、`report.md`、`index.md`、源码探针工件以及包元数据/校验和提交到 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`；完整诊断归档则保留在链接的 Actions 工件中。发布程序会在尝试推送之前拒绝任何超过 50 MB 的报告文件。当前测试引用指针为 `openclaw-performance/<tested-ref>/latest-<lane>.json`。如果 App 令牌创建或报告发布失败，定时运行和 `profile=release` 调度将失败。手动非发布调度仍将发布视为建议项，并在身份验证或发布失败时保留 GitHub 工件。此前的源码基线从公共报告仓库匿名获取，因此成功获取基线并不能证明发布程序已通过身份验证。

## 完整发布验证

`Full Release Validation` 是用于“发布前运行全部检查”的手动总括工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流（包括 Android），调度 `Plugin Prerelease` 以执行仅限发布的插件/软件包/静态/Docker 验证，针对目标 SHA 调度 `OpenClaw Performance`，并调度 `OpenClaw Release Checks` 以执行安装冒烟测试、软件包验收、跨操作系统软件包检查、QA Lab 一致性、Matrix 和 Telegram 通道（通过 `run_maturity_scorecard` 可选择启用建议性质的成熟度评分卡渲染）。稳定版和完整配置始终包含全面的实时/E2E 及 Docker 发布路径浸泡测试覆盖；Beta 配置可通过 `run_release_soak=true` 选择启用。规范的软件包 Telegram E2E 在 Package Acceptance 内运行，因此完整候选版本不会启动重复的实时轮询器。发布后，传入 `release_package_spec`，即可在发布检查、Package Acceptance、Docker、跨操作系统和 Telegram 流程中复用已发布的 npm 软件包，而无需重新构建。仅在针对已发布软件包进行专项 Telegram 重跑时使用 `npm_telegram_package_spec`。Codex 插件实时软件包通道默认使用同一选定状态：已发布的 `release_package_spec=openclaw@<tag>` 会派生出 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA/工件运行则从选定引用打包 `extensions/codex`。对于 `npm:`、`npm-pack:` 或 `git:` 规范等自定义插件来源，请显式设置 `codex_plugin_spec`。

有关阶段矩阵、确切的工作流作业名称、配置差异、工件和专项重跑入口，请参阅
[完整发布验证](/zh-CN/reference/full-release-validation)。

`OpenClaw Release Publish` 是手动执行、会产生变更的发布工作流。在发布标签
已存在且 OpenClaw npm 预检已成功后，从受信任的 `main` 分支分派
常规 beta 和 stable 发布（预检会在其检查项中运行
`pnpm plugins:sync:check`）。标签仍用于选择确切的
发布提交，包括 `release/YYYY.M.PATCH` 上的提交；Tideclaw alpha
发布继续使用与其匹配的 alpha 分支。该工作流要求提供已保存的
`preflight_run_id`、成功的
`full_release_validation_run_id` 及其确切的
`full_release_validation_run_attempt`，为所有可发布的插件包分派
`Plugin NPM Release`，为同一发布 SHA 分派 `Plugin ClawHub Release`，
之后才分派 `OpenClaw NPM Release`。Stable 发布还
要求提供确切的 `windows_node_tag`；在分派任何发布子工作流之前，该工作流会验证 Windows 源
发布，并将其 x64/ARM64 安装程序与候选版本已批准的
`windows_node_installer_digests` 输入进行比较，随后在发布 GitHub 发布草稿之前，
提升并验证这些固定的安装程序摘要以及确切的配套资源
和校验和契约。
仅修复特定插件时，使用 `plugin_publish_scope=selected`，并提供非空的
包列表。仅插件的 `all-publishable` 运行需要与核心发布相同的不可变 npm
预检和完整发布验证证据。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

若要在快速变动的分支上获取固定提交证明，请使用辅助命令，而不是
`gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流分派引用必须是分支或标签，不能是原始提交 SHA。该
辅助命令会基于受信任的 `main` 工作流 SHA 推送一个临时
`release-ci/<sha>-...` 分支，通过工作流的 `ref` 输入传递请求的目标 SHA，
在有可用证据时复用严格匹配确切目标的证据，验证每个子
工作流的 `headSha` 都与受信任的工作流 SHA 匹配，并在运行完成后删除临时
分支。传入 `-f reuse_evidence=false` 可强制执行全新的
验证。如果任何子工作流在不同的工作流 SHA 上运行，总验证器也会失败。

`release_profile` 控制传递给发布检查的实时/提供商覆盖范围。手动
发布工作流默认使用 `stable`；只有在有意运行广泛的建议性提供商/媒体矩阵时，
才使用 `full`。Stable 和 full
发布检查始终运行详尽的实时/E2E 以及 Docker 发布路径浸泡测试；
beta 配置可通过 `run_release_soak=true` 选择启用。

- `minimum` 保留最快的 OpenAI/核心发布关键通道。
- `stable` 添加 stable 提供商/后端集合。
- `full` 运行广泛的建议性提供商/媒体矩阵。

总工作流会记录已分派子工作流的运行 ID，最终的 `Verify full validation` 作业会重新检查当前子工作流的运行结论，并为每个子工作流运行附加最慢作业表。如果某个子工作流重新运行后变为绿色，只需重新运行父级验证器作业，即可刷新总工作流结果和耗时摘要。

在恢复场景中，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对于候选发布版本，使用 `all`；仅运行常规完整 CI 子工作流时，使用 `ci`；仅运行插件预发布子工作流时，使用 `plugin-prerelease`；仅运行 OpenClaw Performance 子工作流时，使用 `performance`；运行每个发布子工作流时，使用 `release-checks`；也可以在总工作流中使用更窄的组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样，在针对性修复后，失败发布环境的重新运行范围仍然可控。对于单个失败的跨操作系统通道，将 `rerun_group=cross-os` 与 `cross_os_suite_filter` 结合使用，例如 `windows/packaged-upgrade`；耗时较长的跨操作系统命令会输出心跳行，打包升级摘要则包含各阶段耗时。除标准运行时工具覆盖门禁外，QA 发布检查通道均为建议性质；当必需的 OpenClaw 动态工具发生偏移，或从标准层级摘要中消失时，该门禁会阻止发布。

`OpenClaw Release Checks` 使用受信任的工作流引用，将选定引用一次性解析为 `release-package-under-test` tarball，然后将该工件传递给跨操作系统检查和 Package Acceptance；运行浸泡测试覆盖时，还会将其传递给实时/E2E 发布路径 Docker 工作流。这样可以确保各发布环境中的包字节一致，并避免在多个子作业中重复打包同一候选版本。对于 Codex npm 插件实时通道，发布检查会传入从 `release_package_spec` 派生的匹配已发布插件规范，或传入操作员提供的 `codex_plugin_spec`；也可以将输入留空，由 Docker 脚本打包选定检出中的 Codex 插件。

对于 `ref=main` 且 `rerun_group=all` 的重复 `Full Release Validation` 运行，
较新的总工作流会取代较旧的总工作流。父级监控器被取消时，会取消其
已分派的所有子工作流，因此较新的 main 验证
不会排在过时的两小时发布检查运行之后等待。发布分支/标签
验证和针对性重新运行组仍保持 `cancel-in-progress: false`。

## 实时和 E2E 分片

发布实时/E2E 子工作流保留广泛的原生 `pnpm test:live` 覆盖，但会通过 `scripts/test-live-shard.mjs` 将其作为具名分片运行，而不是使用单个串行作业：

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
- 拆分的媒体音频/视频分片，以及按提供商筛选的音乐分片

这样既能保持相同的文件覆盖范围，又能让耗时较长的实时提供商故障更容易重新运行和诊断。聚合分片名称 `native-live-src-gateway`、`native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 仍可用于手动一次性重新运行。

原生实时媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装了 `ffmpeg` 和 `ffprobe`；媒体作业只需在设置前验证这些二进制文件。Docker 支持的实时套件应保留在常规 Blacksmith runner 上——容器作业不适合启动嵌套 Docker 测试。

Docker 支持的实时模型/后端分片针对每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` 镜像。实时发布工作流只构建并推送该镜像一次，随后 Docker 实时模型、按提供商分片的 Gateway 网关、CLI 后端、ACP bind 和 Codex harness 分片会在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行。Gateway 网关 Docker 分片在工作流作业超时之下设有明确的脚本级 `timeout` 上限，因此卡住的容器或清理路径会快速失败，而不会耗尽整个发布检查时间预算。如果这些分片各自重新构建完整源代码 Docker 目标，则说明发布运行配置有误，并会因重复构建镜像而浪费实际时间。

## Package Acceptance

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，使用 `Package Acceptance`。它与常规 CI 不同：常规 CI 验证源代码树，而包验收则通过用户安装或更新后使用的同一套 Docker E2E harness 来验证单个 tarball。

### 作业

1. `resolve_package` 检出 `workflow_ref`，解析一个候选包，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中输出来源、工作流引用、包引用、版本、SHA-256 和配置。
2. `package_integrity` 下载 `package-under-test` 工件，并使用 `scripts/check-openclaw-package-tarball.mjs` 强制执行公共包 tarball 契约。
3. `docker_acceptance` 使用解析出的包来源 SHA（回退为 `workflow_ref`）和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该工件、验证 tarball 清单、在需要时准备基于包摘要的 Docker 镜像，并针对该包运行选定的 Docker 通道，而不是打包工作流检出内容。当某个配置选择多个有针对性的 `docker_lanes` 时，可复用工作流会准备包和共享镜像一次，然后将这些通道扇出为并行的有针对性 Docker 作业，并使用唯一工件。
4. `package_telegram` 可选择调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时，它会运行；如果 Package Acceptance 已解析出包，则会安装同一个 `package-under-test` 工件。独立的 Telegram 分派仍可安装已发布的 npm 规范。
5. 如果包解析、完整性检查、Docker 验收或可选 Telegram 通道失败，`summary` 会使工作流失败。对于建议性调用方，`advisory` 输入会将验收失败降级为警告。

### 候选来源

- `source=npm` 仅接受 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest` 或确切的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于验收已发布的 extended-stable、预发布或 stable 版本。
- `source=ref` 打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签中访问，在分离的工作树中安装依赖项，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下载公开的 HTTPS `.tgz`；必须提供 `package_sha256`。此路径会拒绝 URL 凭据、非默认 HTTPS 端口、私有/内部/特殊用途主机名或解析出的 IP，以及不符合相同公共安全策略的重定向。
- `source=trusted-url` 从 `.github/package-trusted-sources.json` 中的具名受信任来源策略下载 HTTPS `.tgz`；必须提供 `package_sha256` 和 `trusted_source_id`。仅将其用于由维护者所有的企业镜像或私有包仓库，这类来源需要配置主机、端口、路径前缀、重定向主机或私有网络解析。如果策略声明了 bearer 身份验证，工作流会使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 密钥；仍会拒绝嵌入 URL 的凭据。
- `source=artifact` 从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享的工件，应提供该值。

将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样，当前测试 harness 就能验证较早的受信任源提交，而无需运行旧的工作流逻辑。

### 套件配置

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`root-managed-vps-upgrade`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `package` 集合，但以实时 `plugins` 覆盖替代 `plugins-offline`，并添加 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 包含 OpenWebUI 的完整 Docker 发布路径分块
- `custom` — 精确指定 `docker_lanes`；当 `suite_profile=custom` 时为必填项

`package` 配置档使用离线插件覆盖，因此已发布软件包的验证不受 ClawHub 实时可用性的制约。可选的 Telegram 通道在 `NPM Telegram Beta E2E` 中复用 `package-under-test` 工件，同时保留已发布 npm 规格路径供独立调度使用。

有关专门的更新和插件测试策略，包括本地命令、
Docker 通道、Package Acceptance 输入、发布默认值和故障分诊，
请参阅[更新和插件测试](/zh-CN/help/testing-updates-plugins)。

发布检查使用 `source=artifact`、准备好的发布软件包工件、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。这样可让软件包迁移、更新、实时 ClawHub Skill 安装、过时插件依赖清理、已配置插件安装修复、离线插件、插件更新和 Telegram 验证都使用同一个已解析的软件包 tarball。在发布 beta 版后，在 Full Release Validation 或 OpenClaw Release Checks 中设置 `release_package_spec`，即可针对已发布的 npm 软件包运行相同矩阵而无需重新构建；仅当 Package Acceptance 需要使用与其余发布验证不同的软件包时，才设置 `package_acceptance_package_spec`。跨操作系统发布检查仍覆盖特定于操作系统的新手引导、安装程序和平台行为；软件包/更新产品验证应从 Package Acceptance 开始。

`published-upgrade-survivor` Docker 通道会在阻塞发布路径中，每次运行验证一个已发布软件包基线。在 Package Acceptance 中，已解析的 `package-under-test` tarball 始终是候选版本，而 `published_upgrade_survivor_baseline` 选择回退的已发布基线，默认值为 `openclaw@latest`；失败通道的重新运行命令会保留该基线。使用 `run_release_soak=true` 或 `release_profile=full` 的 Full Release Validation 会设置 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，从而将范围扩展到最新的四个稳定 npm 版本，以及固定的插件兼容性边界版本和按问题形态构造的固件，这些固件涵盖 Feishu 配置、保留的 bootstrap/persona 文件、已配置的 OpenClaw 插件安装、波浪号日志路径和过时的旧版插件依赖根目录。多基线的已发布升级存续验证选择会按基线分片到不同的定向 Docker 运行器作业中。当需要回答的是全面清理已发布版本的更新问题，而不是常规 Full Release CI 的覆盖广度时，独立的 `Update Migration` 工作流会使用 `update-migration` Docker 通道，并采用 `all-since-2026.4.23` 基线和 `plugin-deps-cleanup` 场景。本地聚合运行可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 传入确切的软件包规格，也可以通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`（例如 `openclaw@2026.4.15`）保留单一通道，或设置 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 来指定场景矩阵。已发布版本通道使用内置的 `openclaw config set` 命令配方配置基线，在 `summary.json` 中记录配方步骤，并在 Gateway 网关启动后探测 `/healthz`、`/readyz` 以及 RPC 状态。Windows 软件包和安装程序全新安装通道还会验证：已安装的软件包可以从原始 Windows 绝对路径导入浏览器控制覆盖项。OpenAI 跨操作系统智能体轮次冒烟测试在设置了 `OPENCLAW_CROSS_OS_OPENAI_MODEL` 时默认使用该值，否则使用 `openai/gpt-5.6-luna`，因此安装和 Gateway 网关验证会使用成本较低的 GPT-5.6 测试层级。

### 旧版兼容性窗口

Package Acceptance 为已经发布的软件包提供有界的旧版兼容性窗口。直到 `2026.4.25`（包括 `2026.4.25-beta.*`）的软件包可以使用兼容路径：

- `dist/postinstall-inventory.json` 中已知的私有 QA 条目可以指向 tarball 中省略的文件；
- 当软件包未公开该标志时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；
- `update-channel-switch` 可以从由 tarball 派生的伪 git 固件中移除缺失的 pnpm `patchedDependencies`，并可以记录缺失的持久化 `update.channel`；
- 插件冒烟测试可以读取旧版安装记录位置，或接受未持久化 marketplace 安装记录；
- `plugin-update` 可以允许配置元数据迁移，但仍要求安装记录和不重新安装的行为保持不变。

已发布的 `2026.4.26` 软件包还可以针对已经随版本发布的本地构建元数据戳文件发出警告，直到 `2026.5.20` 的软件包在缺少 `npm-shrinkwrap.json` 时也可以警告而非失败。更晚的软件包必须满足现代契约；相同条件将导致失败，而不是警告或跳过。

### 示例

```bash
# 使用产品级覆盖验证当前 beta 软件包。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# 使用软件包覆盖验证已发布的扩展稳定版软件包。
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

# 验证来自已命名可信私有镜像策略的 tarball。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 复用另一个 Actions 运行上传的 tarball。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

调试失败的软件包验收运行时，先查看 `resolve_package` 摘要，以确认软件包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重新运行命令。应优先重新运行失败的软件包配置档或确切的 Docker 通道，而不是重新运行完整发布验证。

## 安装冒烟测试

`Install Smoke` 工作流不再针对拉取请求或 `main` 推送运行。它的每夜/手动包装器和发布验证都会调用只读的 `install-smoke-reusable.yml` 核心，并且每次运行都会在 GitHub 托管的运行器上执行完整的安装冒烟测试路径：

- 每个目标 SHA 只构建一次根 Dockerfile 冒烟测试镜像，将其绑定到工作流修订版和生产者尝试次数，并存入不可变工件；随后由 CLI 冒烟测试、智能体删除共享工作区 CLI 冒烟测试、容器 Gateway 网关网络 E2E，以及内置 `matrix` 插件构建参数冒烟测试加载。插件冒烟测试会验证运行时依赖安装镜像，以及插件加载时不会出现入口逃逸诊断。
- QR 软件包安装以及安装程序/更新 Docker 冒烟测试（包括 Rocky Linux 安装程序通道和一个针对可配置 `update_baseline_version` npm 基线的更新通道）作为独立作业运行，因此安装程序工作无需等待根镜像冒烟测试完成。

缓慢的 Bun 全局安装镜像提供商冒烟测试由 `run_bun_global_install_smoke` 单独控制。它按每夜计划运行，对于由发布检查调用的工作流默认启用，手动调度 `Install Smoke` 时也可以选择启用。常规 PR CI 仍会针对与 Node 相关的更改运行快速 Bun 启动器回归通道。QR 和安装程序 Docker 测试继续使用各自面向安装的 Dockerfile。

## 本地 Docker E2E

`pnpm test:docker:all` 会预先构建一个共享实时测试镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：

- 用于安装程序/更新/插件依赖通道的纯 Node/Git 运行器；
- 将同一 tarball 安装到 `/app` 中、用于常规功能通道的功能镜像。

Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行选定的计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行各通道。

### 可调参数

| 变量                                   | 默认值  | 用途                                                                                     |
| -------------------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 常规通道的主池槽位数。                                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 对提供商敏感的尾部池槽位数。                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 实时通道并发上限，防止提供商限流。                                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | npm 安装通道并发上限。                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 多服务通道并发上限。                                                                     |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 通道启动间隔，用于避免 Docker 守护进程出现创建风暴；设为 `0` 则不使用间隔。              |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每个通道的回退超时时间（120 分钟）；选定的实时/尾部通道使用更严格的上限。                |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未设置  | `1` 表示仅打印调度器计划，不运行通道。                                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未设置  | 以逗号分隔的确切通道列表；跳过清理冒烟测试，以便智能体可以复现单个失败通道。             |

比其有效上限更重的通道仍可从空池启动，随后独占运行，直到释放容量。本地聚合会预检 Docker、移除过时的 OpenClaw E2E 容器、输出活动通道状态、持久化通道耗时以便按最长优先排序，并且默认在首次失败后停止调度新的池化通道。

### 可复用的实时/E2E 工作流

可复用的 live/E2E 工作流通过 `scripts/test-docker-all.mjs --plan-json` 查询所需的软件包、镜像类型、live 镜像、通道和凭据覆盖范围。随后，`scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的软件包工件，或从 `package_artifact_run_id` 下载软件包工件，然后验证 tarball 清单。默认的 `no-push-artifact` 路径通过 Blacksmith 的 Docker 层缓存构建带软件包摘要标签的基础/功能镜像，将镜像的精确字节打包为不可变工作流工件，并让每个使用方验证并加载该工件。`existing-only` 则要求显式提供 `docker_e2e_bare_image`/`docker_e2e_functional_image` GHCR 引用，并且绝不构建或推送镜像。这些注册表拉取操作的每次尝试超时上限为 180 秒，因此卡住的数据流会快速重试，而不会占用 CI 关键路径的大部分时间。计划验证成功后，`openclaw-scheduled-live-checks.yml` 会将不可变的已测试镜像清单传递给独立的软件包写入发布器；只读的正式发布和预发布调用方绝不会经过该写入器。

### 发布路径分块

发布 Docker 覆盖使用较小的分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只验证并加载自身所需的、由工件支持的镜像类型（或在显式使用 `existing-only` 复用时拉取该镜像），并通过同一个加权调度器执行多个通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

当前发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、从 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`，以及 `openwebui`。`package-update-openai` 包含 live Codex 插件软件包通道：它安装候选 OpenClaw 软件包，从 `codex_plugin_spec` 或同一引用的 tarball 安装 Codex 插件并显式批准安装 Codex CLI，运行 Codex CLI 预检，然后针对 OpenAI 运行多个使用同一会话的 OpenClaw 智能体轮次。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是插件/运行时聚合别名。`install-e2e` 通道别名仍是两个提供商安装程序通道的聚合手动重跑别名。

每当稳定版或完整发布路径覆盖请求 OpenWebUI 时，它都会作为独立的 `openwebui` 分块，在专用的大磁盘 Blacksmith runner 上运行，即使可复用工作流将受支持的作业路由到 GitHub 托管的 runner 也是如此。将外部镜像拉取分离，可防止大型镜像与 `plugins-runtime-services` 中共享的软件包和插件镜像竞争；旧版插件/运行时聚合分块仍包含 OpenWebUI，以支持兼容的手动重跑。内置渠道更新通道会针对暂时性的 npm 网络故障重试一次。

每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、计时、`summary.json`、`failures.json`、阶段计时、调度器计划 JSON、慢通道表以及每个通道的重跑命令。工作流的 `docker_lanes` 输入会针对本次运行准备的镜像执行选定通道，而不是执行分块作业，从而将失败通道的调试范围限制在一个有针对性的 Docker 作业内；如果所选通道是 live Docker 通道，则该定向作业会在本地为此次重跑构建 live 测试镜像。重跑辅助程序会验证故障工件中精确选定的目标 SHA，手动分派则会重新打包该引用，因为内部可复用工作流的软件包元组不属于 `workflow_dispatch` 架构。仅当准备好的镜像输入由 GHCR 支持时，生成的命令才会包含这些输入和 `shared_image_policy=existing-only`；runner 本地工件标签会被省略，以便新的 runner 重新构建它们。显式目标覆盖会丢弃恢复的 GHCR 镜像引用，除非工件能够证明它们与覆盖目标匹配。工件生成的工作流定义引用也会被省略，因为完整发布的临时分支会被删除；除非操作员显式覆盖，否则分派使用仓库默认分支。

```bash
pnpm test:docker:rerun <run-id>      # 下载 Docker 工件并输出组合的/逐通道的定向重跑命令
pnpm test:docker:timings <summary>   # 慢通道和阶段关键路径摘要
```

计划 live/E2E 工作流每天运行完整的发布路径 Docker 套件，并在成功后，为经过精确测试的镜像工件调用显式发布器。

## 插件预发布

`Plugin Prerelease` 是成本更高的产品/软件包覆盖，因此它是由 `Full Release Validation` 或显式操作员分派的独立工作流。普通拉取请求、`main` 推送和独立的手动 CI 分派不会启用该套件。它在八个扩展 worker 之间均衡分配内置插件测试；这些扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并分配更大的 Node 堆，以避免导入密集型插件批次产生额外的 CI 作业。仅发布使用的 Docker 预发布路径（由 `full_release_validation` 输入启用）会以每组四个的方式批处理定向 Docker 通道，以避免为只需一到三分钟的作业占用数十个 runner。该工作流还会上传来自 `@openclaw/plugin-inspector` 的信息性 `plugin-inspector-advisory` 工件；检查器发现是分类处理的输入，不会改变具有阻断作用的插件预发布门禁。

## QA Lab

QA Lab 在主要的智能范围工作流之外拥有专用 CI 通道。智能体一致性嵌套在广泛的 QA 和发布测试框架下，而不是独立的 PR 工作流。如果一致性检查应随广泛的验证运行一起执行，请使用 `Full Release Validation` 并设置 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动分派；它会将模拟一致性通道、live Matrix 通道以及 live Telegram 和 Discord 通道作为并行作业展开。live 作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。

发布检查使用确定性模拟提供商和模拟限定模型（`mock-openai/gpt-5.6-luna` 和 `mock-openai/gpt-5.6-luna-alt`）运行 Matrix 和 Telegram live 传输通道，从而将渠道契约与 live 模型延迟及常规提供商插件启动隔离。live 传输 Gateway 网关会禁用记忆搜索，因为 QA 一致性会单独覆盖记忆行为；提供商连接性则由独立的 live 模型、原生提供商和 Docker 提供商套件覆盖。

Matrix 在计划运行和发布门禁中使用 `--profile fast`，仅当检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分派始终将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。

`OpenClaw Release Checks` 还会在批准发布前运行发布关键型 QA Lab 通道；其 QA 一致性门禁将候选包和基线包作为并行通道作业运行，然后将两个工件下载到一个小型报告作业中，进行最终的一致性比较。

对于普通 PR，请遵循限定范围的 CI/检查证据，而不要将一致性检查视为必需状态。

## CodeQL

`CodeQL` 工作流有意设计为范围较窄的第一轮安全扫描器，而不是完整的仓库扫描。每日运行、手动运行、`main` 推送和非草稿拉取请求保护运行会扫描 Actions 工作流代码以及风险最高的 JavaScript/TypeScript 表面，并使用高置信度安全查询，将结果筛选为高/严重 `security-severity`。

拉取请求保护保持轻量：它仅在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src` 或拥有进程的内置插件运行时路径发生更改时启动，并运行与计划工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不属于 PR 默认检查。

### 安全类别

| 类别                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 身份验证、机密、沙箱、cron 和 Gateway 网关基线                                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | 核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、机密和审计接触点                                                      |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、网络防护、Web 获取和插件 SDK SSRF 策略表面                                                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 服务器、进程执行辅助程序、出站交付和智能体工具执行门禁                                                                          |
| `/codeql-security-high/process-exec-boundary`     | 本地 shell、进程生成辅助程序、拥有子进程的内置插件运行时和工作流脚本粘合代码                                                        |
| `/codeql-security-high/plugin-trust-boundary`     | 插件安装、加载器、清单、注册表、软件包管理器安装、源代码加载和插件 SDK 软件包契约信任表面                                            |

### 特定平台安全分片

- `CodeQL Android Critical Security` — 计划运行的 Android 安全分片。在工作流完整性检查所接受的最小 Blacksmith Linux runner 上，手动为 CodeQL 构建 Android 应用。上传到 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每周/手动运行的 macOS 安全分片。在 Blacksmith macOS 上手动为 CodeQL 构建 macOS 应用，从上传的 SARIF 中过滤依赖项构建结果，并上传到 `/codeql-critical-security/macos`。它不包含在每日默认运行中，因为即使结果无问题，macOS 构建也会占据大部分运行时间。

### 严重质量类别

`CodeQL Critical Quality` 是对应的非安全分片。它仅在 GitHub 托管的 Linux runner 上，针对范围较窄的高价值表面运行错误严重级别的非安全 JavaScript/TypeScript 质量查询，因此质量扫描不会消耗 Blacksmith runner 注册预算。其拉取请求保护范围有意小于计划配置：非草稿 PR 仅针对其触及的表面运行匹配分片，这些分片来自十三个可由 PR 路由的分片——`agent-runtime-boundary`、`channel-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`memory-runtime-boundary`、`network-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime`、`provider-runtime-boundary` 和 `session-diagnostics-boundary`。`ui-control-plane` 和 `web-media-runtime-boundary` 不在 PR 运行范围内。CodeQL 配置和质量工作流更改会运行完整的 PR 分片集（网络运行时分片由其自身的 CodeQL 配置文件和负责网络的源代码路径触发）。

手动分派接受：

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

这些窄范围配置是用于单独运行某个质量分片的教学/迭代钩子。

| 类别                                                    | 范围                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 身份验证、密钥、沙箱、cron 和 Gateway 网关安全边界代码                                                                                                            |
| `/codeql-critical-quality/config-boundary`              | 配置架构、迁移、规范化和 IO 契约                                                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 网关协议架构和服务器方法契约                                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心渠道和内置渠道插件实现契约                                                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令执行、模型/提供商分派、自动回复分派与队列，以及 ACP 控制平面运行时契约                                                                                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 服务器与工具桥接、进程监督辅助程序，以及出站交付契约                                                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | 记忆宿主 SDK、记忆运行时外观、记忆插件 SDK 别名、记忆运行时激活粘合代码，以及记忆 Doctor 命令                                                                      |
| `/codeql-critical-quality/network-runtime-boundary`     | 网络策略包、原始套接字与代理捕获运行时、SSH 隧道、Gateway 网关锁、JSONL 套接字，以及推送传输范围                                                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回复队列内部机制、会话交付队列、出站会话绑定/交付辅助程序、诊断事件/日志包范围，以及会话 Doctor CLI 契约                                                          |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 插件 SDK 入站回复分派、回复负载/分块/运行时辅助程序、渠道回复选项、交付队列，以及会话/线程绑定辅助程序                                                             |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目录规范化、提供商身份验证与发现、提供商运行时注册、提供商默认值/目录，以及 Web/搜索/抓取/嵌入注册表                                                           |
| `/codeql-critical-quality/ui-control-plane`             | Control UI 引导启动、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约                                                                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 Web 抓取/搜索、媒体 IO、媒体理解、图像生成，以及媒体生成运行时契约                                                                                            |
| `/codeql-critical-quality/plugin-boundary`              | 加载器、注册表、公开范围和插件 SDK 入口点契约                                                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已发布包侧的插件 SDK 源代码和插件包契约辅助程序                                                                                                                    |

质量与安全保持分离，以便在不掩盖安全信号的情况下安排、衡量、禁用或扩展质量发现。只有在精简配置文件具备稳定的运行时和信号后，才应将 Swift、Python 和内置插件的 CodeQL 扩展作为限定范围或分片的后续工作重新加入。

## 维护工作流

### 文档 Agent

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于使现有文档与最近落地的更改保持一致。它没有纯定时计划：`main` 上成功的非 Bot 推送 CI 运行可以触发它，也可以通过手动分派直接运行。通过工作流运行触发时，如果 `main` 已继续前进，或者过去一小时内创建了另一个未跳过的 Docs Agent 运行，则会跳过。当它运行时，会审查从上一次未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档检查以来累积的所有 main 更改。

### 测试性能 Agent

`Test Performance Agent` 工作流是一个面向慢速测试的事件驱动 Codex 维护通道。它没有纯定时计划：`main` 上成功的非 Bot 推送 CI 运行可以触发它，但如果当天 UTC 日期内已有另一个工作流运行调用已运行或正在运行，则会跳过。手动分派会绕过这一每日活动门槛。该通道会生成完整测试套件的分组 Vitest 性能报告，仅允许 Codex 进行保持覆盖率的小型测试性能修复，而不是大范围重构；随后重新运行完整测试套件报告，并拒绝会减少通过基线测试数量的更改。分组报告会记录 Linux 和 macOS 上每个配置的实际耗时与最大 RSS，因此前后对比会在持续时间变化旁显示测试内存变化。如果基线存在失败测试，Codex 只能修复明显的失败，并且 Agent 处理后的完整测试套件报告必须通过，才能提交任何内容。如果 Bot 推送落地前 `main` 已前进，该通道会对已验证的补丁执行变基、重新运行 `pnpm check:changed` 并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与文档 Agent 相同的移除 sudo 安全策略。

### 合并后的重复 PR

`Duplicate PRs After Merge` 工作流是一个供维护者在落地后清理重复项的手动工作流。它默认为试运行，仅在 `apply=true` 时关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 已合并，并验证每个重复 PR 都存在共同引用的问题或重叠的更改代码块。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本地检查门槛和更改路由

本地更改通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。与宽泛的 CI 平台范围相比，该本地检查门槛对架构边界更为严格：

- 核心生产代码更改会运行核心生产代码和核心测试类型检查，以及核心 lint/防护检查；
- 仅核心测试的更改只运行核心测试类型检查和核心 lint；
- 扩展生产代码更改会运行扩展生产代码和扩展测试类型检查，以及扩展 lint；
- 仅扩展测试的更改会运行扩展测试类型检查和扩展 lint；
- 公开插件 SDK 或插件契约更改会扩展到扩展类型检查，因为扩展依赖这些核心契约（Vitest 扩展扫描仍属于明确的测试工作）；
- 仅发布元数据的版本号提升会运行针对性的版本/配置/根依赖检查；
- 未知的根目录/配置更改会安全失败并转到所有检查通道。

本地更改测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意设计得比 `check:changed` 成本更低：直接测试编辑会运行其自身测试，源代码编辑优先使用显式映射，然后运行同级测试和导入图依赖项。共享群组房间交付配置是其中一项显式映射：对群组可见回复配置、源回复交付模式或消息工具系统提示词的更改，会通过核心回复测试以及 Discord 和 Slack 交付回归测试进行路由，从而使共享默认值的更改在首次推送 PR 之前就失败。仅当更改影响整个测试框架，导致低成本映射集无法作为可靠的替代指标时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 验证

Crabbox 是仓库自有的远程机器封装器，用于维护者的 Linux 验证。Agent
会话默认使用它执行测试和计算密集型工作，
包括构建、类型检查、lint 扇出、Docker、包通道、E2E、实时
验证和 CI 一致性验证。受信任的维护者代码默认使用
`blacksmith-testbox`，`.crabbox.yaml` 现在也默认使用它。其配置的
工作流会注入提供商和 Agent 凭据，因此不受信任的贡献者或
分支代码必须改用无密钥的分支 CI 或经过净化的直接 AWS Crabbox。
经过净化的 AWS 运行会设置 `CRABBOX_ENV_ALLOW=CI`，传递
`--no-hydrate`，并使用一个全新的临时远程 `HOME`；这样可以防止仓库的
`OPENCLAW_*` 允许列表和现有身份验证配置文件进入不受信任的代码。
它们使用专用于该不受信任源的新预热租约，绝不使用
受信任或此前已注入凭据的租约。从干净且受信任的 `main` 检出中启动已安装的受信任 Crabbox
二进制文件，并仅通过
`--fresh-pr` 获取远程 PR；绝不要在本地执行不受信任检出的封装器或配置。
取消设置 `CRABBOX_AWS_INSTANCE_PROFILE`，并且除非解析后的
`aws.instanceProfile` 为空，否则安全失败。在任何安装/测试之前，使用受信任的
绝对路径工具要求获取 IMDSv2 令牌，证明 IAM 凭据
端点返回 404，并将远程 `git rev-parse HEAD` 与完整的
已审查 PR 头部 SHA 进行比较。将租约绑定到该 SHA，并在头部发生更改时停止并重新预热。
将干净 `main` 中受信任的 `scripts/crabbox-untrusted-bootstrap.sh`
与 `--fresh-pr` 一同上传；它会安装固定版本的 Node/pnpm、验证 SHA 和
包管理器固定版本、隔离 `HOME`、安装依赖项，然后执行
请求的测试。
取消设置所有 `CRABBOX_TAILSCALE*` 覆盖，强制使用 `--network public
--tailscale=false`，清除出口节点/LAN 标志，并要求 `crabbox inspect`
在上传任何脚本之前报告公共网络且无 Tailscale 状态。
自有 AWS/Hetzner 容量也继续作为 Blacksmith 服务中断、
配额问题或明确要求使用自有容量测试时的后备方案。

在可能需要测试或重度验证的受信任代码任务开始时，Agent
应立即在后台命令会话中预热，并在注入过程运行时继续
检查和编辑，复用返回的 `tbx_...` ID，
每次运行时同步当前检出，并在交接前停止它：

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

由 Crabbox 支持的 Blacksmith 运行会预热、声明、同步、运行、报告并清理
一次性 Testbox。当同步机器上的
`git status --short` 显示至少 200 个已跟踪文件被删除时，内置同步完整性检查会快速失败，
这可以捕获 `pnpm-lock.yaml` 等根目录文件消失的问题。对于有意进行
大规模删除的 PR，请为远程命令设置 `CRABBOX_ALLOW_MASS_DELETIONS=1`。

如果本地 Blacksmith CLI 调用停留在
同步阶段超过五分钟且没有同步后输出，Crabbox 也会终止该调用。设置
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可禁用该防护，或者针对异常大的
本地差异使用更大的毫秒值。

首次运行前，请从仓库根目录检查封装器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

仓库封装器会拒绝未声明支持所选提供商的过时 Crabbox 二进制文件；由 Blacksmith 支持的运行要求 Crabbox 0.22.0 或更高版本，以便封装器获得当前的 Testbox 同步、队列和清理行为。在 Codex 工作树或链接/稀疏检出中，请避免使用本地 `pnpm crabbox:run` 脚本，因为 pnpm 可能会在 Crabbox 启动前协调依赖项；请改为直接调用 Node 封装器：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

使用同级检出时，请在计时或验证工作前重新构建被忽略的本地二进制文件：

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

`.crabbox.yaml` 中的 `blacksmith:` 块已经固定了组织、工作流、作业和 ref 的默认值，因此下面的显式标志是可选的。变更检查：

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

重新运行聚焦测试：

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

阅读最终的 JSON 摘要。有用的字段包括 `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。对于委托执行的
Blacksmith Testbox 运行，Crabbox 包装器的退出代码和 JSON 摘要就是
命令结果。关联的 GitHub Actions 运行负责预热和保活；如果 SSH
命令已经返回后从外部停止 Testbox，它可能会以 `cancelled` 状态结束。
除非包装器的 `exitCode` 非零，或命令输出显示测试失败，否则应将其视为
清理/状态工件。由 Blacksmith 支持的一次性 Crabbox 运行应自动停止 Testbox；
如果运行中断或清理状态不明确，请检查在线的 Testbox，并且只停止
你创建的 Testbox：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

仅当你有意需要在同一个已预热的 Testbox 上运行多个命令时，才使用复用：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

复用租约，而不是过期的源代码。省略 `--no-sync`，以便每次运行都上传
当前检出内容；只有在你有意重新运行未更改且已同步的代码树时才使用它。
不受信任的贡献者/分支代码必须在每条命令中使用
`CRABBOX_ENV_ALLOW=CI`、`--provider aws --no-hydrate` 和全新的
临时远程 `HOME`；测试前须在该净化命令中安装依赖项。只能复用专用于
同一份不受信任源代码的新预热租约；绝不能复用受信任或此前已预热的租约。
绝不要在本地执行不受信任检出内容中的包装器或配置：应从干净且受信任的
`main` 启动已安装的受信任 Crabbox 二进制文件，并在每次运行时传递
`--fresh-pr`。确保未设置 `CRABBOX_AWS_INSTANCE_PROFILE`，拒绝解析出
非空实例配置文件的情况，要求受信任的远程 IMDS 无角色证明，并在安装/测试前
验证已审查的 head SHA。将租约绑定到该 SHA；head 发生任何更改后，都要停止并
重新预热。如果不存在远程 PR，请使用无密钥的分支 CI。对于不受信任的源代码，
绝不要选择 `hydrate-github` 或使用凭据预热的 Blacksmith 工作流。

如果 Crabbox 层发生故障，但 Blacksmith 本身可以工作，请仅将直接使用
Blacksmith 的方式用于 `list`、`status` 和清理等诊断。在将直接运行
Blacksmith 视为维护者证明之前，先修复 Crabbox 路径。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可以工作，
但新的预热在几分钟后仍处于 `queued` 状态，且没有 IP 或 Actions 运行 URL，
请将其视为 Blacksmith 提供商、队列、计费或组织限制压力。停止你创建的
排队 ID，避免启动更多 Testbox，并将证明转移到下方自有的 Crabbox 容量路径，
同时安排人员检查 Blacksmith 控制面板、计费和组织限制。

仅当 Blacksmith 宕机、配额受限、缺少所需环境，或明确以自有容量为目标时，才升级到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

在 AWS 容量紧张时，除非任务确实需要 48xlarge 级别的 CPU，否则避免使用 `class=beast`。一次 `beast` 请求从 192 个 vCPU 起步，最容易触发区域 EC2 Spot 或按需标准配额。仓库自有的 `.crabbox.yaml` 默认使用 `class: standard`、按需市场和 `capacity.hints: true`，因此通过代理获取的 AWS 租约会输出所选区域/市场、配额压力、Spot 回退以及高压力规格警告。对于负载更重的广泛检查，使用 `fast`；仅当 standard/fast 不够用时才使用 `large`；仅对完整测试套件或全插件 Docker 矩阵、明确的发布/阻塞项验证或高核心数性能分析等极特殊的 CPU 密集型通道使用 `beast`。不要对 `pnpm check:changed`、聚焦测试、仅文档工作、常规 lint/类型检查、小型 E2E 复现或 Blacksmith 中断诊断使用 `beast`。容量诊断时使用 `--market on-demand`，以免 Spot 市场波动干扰诊断信号。

`.crabbox.yaml` 负责提供商、同步和 GitHub Actions 预热默认值。Crabbox 同步绝不会传输 `.git`，因此由 Actions 预热的检出内容会保留其自身的远程 Git 元数据，而不是同步维护者本地的远程仓库和对象存储；仓库配置还会额外排除绝不应传输的本地运行时/构建工件（例如 `.artifacts` 和测试报告）。`.github/workflows/crabbox-hydrate.yml` 负责检出、Node/pnpm 设置、获取 `origin/main`，以及为自有云上的 `crabbox run --id <cbx_id>` 命令传递非密钥环境。

## 相关内容

- [安装概览](/zh-CN/install)
- [开发渠道](/zh-CN/install/development-channels)
