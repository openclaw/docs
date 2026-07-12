---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版与完整发布验证配置文件
    - 调试发布验证阶段失败问题
summary: 完整发布验证阶段、子工作流、发布配置、重新运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-07-12T14:44:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布验证的总入口：用于发布前验证的唯一手动入口点。
大多数工作在子工作流中完成，因此某个环境失败后可以重新运行，而无需重新启动整个发布流程。

请从受信任的工作流引用（通常为 `main`）运行，并将发布分支、
标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

对于跨操作系统新手引导和端到端智能体轮次，`provider` 还接受 `anthropic` 或
`minimax`。可复用的子作业通过 `job.workflow_repository` 和
`job.workflow_sha` 解析被调用工作流的执行框架，而输入 `ref`
用于选择待测试的候选版本。这样，在验证较旧的发布分支或标签时，
仍可使用当前受信任的验证逻辑。

每个已分派的子工作流所报告的工作流 SHA 必须与父级
`Full Release Validation` 运行相同。如果在父级与子级分派之间
`main` 发生变化，即使子工作流本身成功，总入口也会以失败关闭。若要对
不可变的确切提交进行验证，请使用
`pnpm ci:full-release --sha <target-sha>`。该辅助工具会创建一个临时
`release-ci/*` 引用，将其固定到当前受信任的 `origin/main`，仅将目标
SHA 作为候选 `ref` 传入，在可用时复用严格的确切目标证据，并在
验证后删除该引用。传入
`-f reuse_evidence=false` 可强制执行全新运行，或传入
`--workflow-sha <trusted-main-sha>` 选择当前 `origin/main` 仍可到达的
较旧工作流提交。工作流本身绝不会创建或更新仓库引用。

`release_profile=stable` 和 `release_profile=full` 始终运行详尽的
实时/Docker 浸泡测试。传入 `run_release_soak=true` 可在 `beta`
配置中包含相同的浸泡测试通道。如果验证清单不包含此浸泡测试和阻塞式
产品性能证据，则稳定版发布会被拒绝。

Package Acceptance 通常从解析后的 `ref` 构建候选 tarball，包括通过
`pnpm ci:full-release` 分派的完整 SHA 运行。发布 beta 版本后，传入
`release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，可在发布检查、
Package Acceptance、跨操作系统、发布路径 Docker 和包 Telegram
测试中复用已发布的 npm 包。仅当 Package Acceptance 有意验证不同的包时，
才使用 `package_acceptance_package_spec`。Codex 插件实时包通道遵循相同状态：
已发布的 `release_package_spec` 值会派生出
`codex_plugin_spec=npm:@openclaw/codex@<version>`；SHA/工件运行会从所选
引用打包 `extensions/codex`；操作员也可以直接为 `npm:`、`npm-pack:`
或 `git:` 插件来源设置 `codex_plugin_spec`。该通道会授予此插件所需的
显式 Codex CLI 安装审批，然后运行 Codex CLI 预检和同一会话中的 OpenAI
智能体轮次。

## 顶层阶段

对于 `rerun_group=all`，首先运行 `Check for reusable validation evidence`
作业：它会查找针对完全相同的目标 SHA、发布配置、实际浸泡测试设置和验证输入，
最近一次成功的完整验证。如果存在此类证据，则跳过所有通道，并由总入口验证器
重新检查不可变的父级工件、子运行和分派日志。这仅用于同一候选版本的重新运行恢复；
不授权跨 SHA 复用。对于已变更的候选版本，应重新运行受该差异影响的每个包、工件、
安装、Docker 或提供商门禁。传入 `reuse_evidence=false` 可强制执行全新的完整运行。
只有从 `main` 或标准的 SHA 固定 `release-ci/*` 引用运行时，才会复用证据，
且该引用的工作流提交必须仍位于受信任的 `main` 谱系中；其他工作流引用会全新运行
所选通道。

同样对于 `rerun_group=all`，`Verify Docker runtime image assets` 作业会使用
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex` 构建 `runtime-assets`
Docker 目标。它与其他阶段并行运行，并由总入口验证器强制检查；各通道在分派前
不再等待它完成。更窄的 `rerun_group` 会跳过此预检。

| 阶段                    | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目标解析                | **作业：** `Resolve target ref`<br />**子工作流：** 无<br />**验证内容：** 解析发布分支、标签或完整提交 SHA，并记录所选输入。<br />**重新运行：** 如果失败，请重新运行总入口。                                                                                                                                                                                                                                                                                                            |
| Docker 资产预检         | **作业：** `Verify Docker runtime image assets`<br />**子工作流：** 无<br />**验证内容：** 在分派任何其他阶段之前，确认 `runtime-assets` Docker 构建目标仍可成功构建。仅在 `rerun_group=all` 时运行。<br />**重新运行：** 使用 `rerun_group=all` 重新运行总入口。                                                                                                                                                                                                                                         |
| Vitest 和常规 CI        | **作业：** `Run normal full CI`<br />**子工作流：** `CI`<br />**验证内容：** 针对目标引用运行手动完整 CI 图，包括 Linux Node 通道、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建工件冒烟检查、文档检查、Python Skills、Windows、macOS、Control UI i18n，以及通过总入口运行的 Android。<br />**重新运行：** `rerun_group=ci`。                                                                                          |
| 插件预发布验证          | **作业：** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**验证内容：** 仅发布阶段运行的插件静态检查、智能体式插件覆盖、完整插件批次分片、插件预发布 Docker 通道，以及用于兼容性分类的非阻塞 `plugin-inspector-advisory` 工件。<br />**重新运行：** `rerun_group=plugin-prerelease`。                                                                                                                                                          |
| 发布检查                | **作业：** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**验证内容：** 安装冒烟测试、跨操作系统包检查、Package Acceptance、QA Lab 一致性、实时 Matrix 和实时 Telegram。稳定版和完整配置还会运行详尽的实时/E2E 套件与 Docker 发布路径分块；beta 可通过 `run_release_soak=true` 选择加入。<br />**重新运行：** `rerun_group=release-checks` 或更窄的 release-checks 句柄。                                                                |
| 包 Telegram             | **作业：** `Run package Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**验证内容：** 设置 `release_package_spec` 或 `npm_telegram_package_spec` 时，针对已发布包运行专门的 Telegram E2E。完整候选版本验证改用标准的 Package Acceptance Telegram E2E。<br />**重新运行：** 使用 `rerun_group=npm-telegram`，并设置 `release_package_spec` 或 `npm_telegram_package_spec`。                                                                                                              |
| 产品性能                | **作业：** `Run product performance evidence`<br />**子工作流：** `OpenClaw Performance`<br />**验证内容：** 针对目标 SHA 运行发布配置性能测试（`profile=release`、`repeat=3`、`fail_on_regression=true`、`publish_reports=false`）。Kova 输出保留在工作流工件中，子工作流必须证明其报告发布程序已跳过。仅在 `rerun_group=all` 或 `rerun_group=performance` 时为必需（阻塞）；对于更窄的重新运行组则不是必需项。<br />**重新运行：** `rerun_group=performance`。 |
| 总入口验证器            | **作业：** `Verify full validation`<br />**子工作流：** 无<br />**验证内容：** 重新检查记录的子运行结论，并附加子工作流中最慢作业的表格。<br />**重新运行：** 将失败的子工作流重新运行至成功后，仅重新运行此作业。                                                                                                                                                                                                                                                                 |

总入口始终以仅工件模式分派产品性能测试。
`OpenClaw Performance` 仅允许定时运行或显式设置
`publish_reports=true` 的手动分派发布报告。仅工件防护必须成功完成，
以证明发布程序作业一直处于跳过状态。全新证据和复用证据均记录
`controls.performanceReportPublication=artifact-only`；如果没有匹配的
标准化性能子工作流验证，验证器和复用选择器将拒绝该证据。

验证器将标准清单上传为
`full-release-validation-<run-id>-<run-attempt>`。证据工具会在下载该确切
工件 ID 之前，验证其工件 ID、摘要、生成方运行和尝试次数。它会限制下载的 ZIP
大小，根据 REST `sha256:` 摘要验证其字节，并以流式方式读取唯一允许的有界清单条目，
而不解压归档。为兼容较旧的发布使用方，暂时保留稳定名称别名。验证器始终优先使用
包含尝试次数的工件；作为过渡，它仅接受由第 1 次尝试的清单 v2 生成方所产生的稳定名称。
对于后续尝试和清单 v3，它会拒绝该旧名称。

对于 `ref=main` 且 `rerun_group=all` 的运行、`release/*` 引用以及 Tideclaw
alpha 引用，具有相同引用和重新运行组的较新总入口运行会取代较旧运行。父级被取消时，
其监控程序会取消所有已分派的子工作流。标签和固定 SHA 验证运行不会相互取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它只解析目标一次，并在面向包或
Docker 的阶段需要时准备共享的 `release-package-under-test` 工件。

| 阶段                     | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 发布目标                 | **作业：** `Resolve target ref`<br />**支撑工作流：** 无<br />**测试：** 选定的引用、可选的预期 SHA、配置文件、重新运行组和聚焦的实时套件过滤器。<br />**重新运行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                                                                                                                          |
| 软件包工件               | **作业：** `Prepare release package artifact`<br />**支撑工作流：** 无<br />**测试：** 打包或解析一个候选 tarball，并上传 `release-package-under-test`，供下游面向软件包的检查使用。<br />**重新运行：** 受影响的软件包、跨操作系统或实时/E2E 组。                                                                                                                                                                                                                                                                                                                                  |
| 安装冒烟测试             | **作业：** `Run install smoke`<br />**支撑工作流：** `Install Smoke`<br />**测试：** 完整安装路径，包括复用根 Dockerfile 冒烟镜像、QR 软件包安装、根 Docker 和 Gateway 网关 Docker 冒烟测试、安装程序 Docker 测试，以及 Bun 全局安装镜像提供商冒烟测试。<br />**重新运行：** `rerun_group=install-smoke`。                                                                                                                                                                                                                                                                    |
| 跨操作系统               | **作业：** `cross_os_release_checks`<br />**支撑工作流：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：** 针对选定的提供商和模式，在 Linux、Windows 和 macOS 上运行全新安装和升级通道，使用候选 tarball 以及一个基线软件包。<br />**重新运行：** `rerun_group=cross-os`。                                                                                                                                                                                                                                                                                        |
| 仓库和实时 E2E           | **作业：** `Run repo/live E2E validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 仓库 E2E、实时缓存、OpenAI WebSocket 流式传输、原生实时提供商和插件分片，以及由 `release_profile` 选择的 Docker 支撑实时模型/后端/Gateway 网关测试框架。<br />**运行条件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新运行：** `rerun_group=live-e2e`，可选择同时指定 `live_suite_filter`。                                                                               |
| Docker 发布路径          | **作业：** `Run Docker release-path validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 针对共享软件包工件运行发布路径 Docker 分块。<br />**运行条件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新运行：** `rerun_group=live-e2e`。                                                                                                                                                                                                                                                  |
| 软件包验收               | **作业：** `Run package acceptance`<br />**支撑工作流：** `Package Acceptance`<br />**测试：** 离线插件软件包夹具、插件更新、规范的模拟 OpenAI Telegram 软件包 E2E，以及针对同一 tarball 的已发布版本升级存活检查。阻塞式发布检查使用默认的最新已发布基线；浸泡检查（`run_release_soak=true`）扩展至最近 4 个稳定版 npm 版本以及 3 个固定的历史版本（`2026.4.23`、`2026.5.2`、`2026.4.15`），并针对已报告问题的升级夹具运行。<br />**重新运行：** `rerun_group=package`。 |
| 成熟度评分卡             | **作业：** `Render maturity scorecard release docs`<br />**支撑工作流：** `maturity-scorecard.yml`<br />**测试：** 针对目标引用渲染建议性质的成熟度评分卡文档。仅在传入 `run_maturity_scorecard=true` 时运行。<br />**重新运行：** `rerun_group=qa`，同时指定 `run_maturity_scorecard=true`。                                                                                                                                                                                                                                                                                |
| QA 一致性                | **作业：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支撑工作流：** 直接作业<br />**测试：** 候选版本和基线智能体一致性包，随后生成一致性报告。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                            |
| QA 运行时一致性          | **作业：** `Run QA Lab runtime parity lane`<br />**支撑工作流：** 直接作业<br />**测试：** 一个 `openclaw`/`codex` 运行时配对的智能体一致性通道（`pnpm openclaw qa suite --runtime-pair openclaw,codex`），包括标准层级，以及在 `run_release_soak=true` 时运行的浸泡层级。建议性质：单项失败不会阻塞发布检查验证器。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                 |
| QA 运行时工具覆盖率      | **作业：** `Enforce QA Lab runtime tool coverage`<br />**支撑工作流：** 直接作业<br />**测试：** 使用 QA 运行时一致性通道的输出，检测标准运行时一致性层级中 `openclaw` 与 `codex` 之间的动态工具漂移（`pnpm openclaw qa coverage --tools`）。阻塞式：此作业不能通过建议性质的覆盖机制绕过。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                           |
| QA 实时 Matrix           | **作业：** `Run QA Lab live Matrix lane`<br />**支撑工作流：** 直接作业<br />**测试：** 在 `qa-live-shared` 环境中运行快速实时 Matrix QA 配置文件。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                         |
| QA 实时 Telegram         | **作业：** `Run QA Lab live Telegram lane`<br />**支撑工作流：** 直接作业<br />**测试：** 使用 Convex CI 凭据租约的实时 Telegram QA。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                                             |
| 发布验证器               | **作业：** `Verify release checks`<br />**支撑工作流：** 无<br />**测试：** 选定重新运行组所需的发布检查作业。<br />**重新运行：** 聚焦的子作业通过后重新运行。                                                                                                                                                                                                                                                                                                                                                                                                                  |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段运行以下分块：

| 分块                                                            | 覆盖范围                                                                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 发布路径冒烟测试通道。                                                                                      |
| `package-update-openai`                                         | OpenAI 软件包安装/更新行为、Codex 按需安装、Codex 插件实时轮次以及 Chat Completions 工具调用。                           |
| `package-update-anthropic`                                      | Anthropic 软件包安装和更新行为。                                                                                        |
| `package-update-core`                                           | 与提供商无关的软件包和更新行为。                                                                                        |
| `plugins-runtime-plugins`                                       | 验证插件行为的插件运行时通道。                                                                                          |
| `plugins-runtime-services`                                      | 由服务支撑的插件运行时通道和实时插件运行时通道。                                                                        |
| `plugins-runtime-install-a` 到 `plugins-runtime-install-h`      | 拆分为并行发布验证的插件安装/运行时批次。                                                                                |
| `openwebui`                                                     | 请求时，在专用的大磁盘运行器上隔离运行 OpenWebUI 兼容性冒烟测试。                                                       |

当仅有一个 Docker 通道失败时，请在可复用的实时/E2E 工作流中使用定向的 `docker_lanes=<lane[,lane]>`。如果可用，发布工件会包含每个通道的重新运行命令，以及软件包工件和镜像复用输入。

## 发布配置文件

`release_profile` 主要控制发布检查中的实时测试/提供商覆盖范围。
它不会移除常规的完整 CI、插件预发布、安装冒烟测试、软件包
验收或 QA Lab。稳定版和完整配置始终会运行全面的仓库/实时
E2E 测试，以及 Docker 发布路径浸泡测试。测试版配置可通过
`run_release_soak=true` 选择启用这些测试。软件包验收为每个完整候选版本提供规范的
软件包 Telegram E2E，因此总括检查不会重复运行该
实时轮询器。

| 配置 | 预期用途 | 包含的实时测试/提供商覆盖范围 |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | 最快速的发布关键冒烟测试。 | OpenAI/核心实时路径、OpenAI 的 Docker 实时模型、原生 Gateway 网关核心、原生 OpenAI Gateway 网关配置、原生 OpenAI 插件，以及 Docker 实时 Gateway 网关 OpenAI。 |
| `stable` | 默认的发布审批配置。 | `beta` 加上 Anthropic 冒烟测试、Google、MiniMax、后端、原生实时测试工具、Docker 实时 CLI 后端、Docker ACP 绑定、Docker Codex harness、Docker 子智能体通知，以及一个 OpenCode Go 冒烟测试分片。 |
| `full`   | 广泛的建议性扫描。 | `stable` 加上建议性提供商、插件实时测试分片和媒体实时测试分片。 |

## 仅完整配置包含的附加项

以下测试套件会被 `stable` 跳过，并包含在 `full` 中：

| 区域                             | 仅完整验证覆盖范围                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker 实时模型                  | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                                                                           |
| Docker 实时 Gateway 网关         | 建议性提供商拆分为 DeepSeek/Fireworks、OpenCode Go/OpenRouter 和 xAI/Z.ai 分片。                                             |
| 原生 Gateway 网关提供商配置文件 | 完整的 Anthropic Opus 和 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整的 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。     |
| 原生插件实时分片                 | 插件 A-K、L-N、O-Z 其他、Moonshot 和 xAI。                                                                                  |
| 原生媒体实时分片                 | 音频、Google 音乐、MiniMax 音乐和视频组 A-D。                                                                               |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和
`native-live-src-gateway-profiles-opencode-go-smoke`；`full` 则使用覆盖范围更广的
Anthropic 和 OpenCode Go 模型分片。针对性重新运行仍可使用聚合句柄
`native-live-src-gateway-profiles-anthropic` 或
`native-live-src-gateway-profiles-opencode-go`。

## 针对性重新运行

使用 `rerun_group` 可避免重复运行无关的发布执行环境：

| 句柄                | 范围                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 所有完整发布验证阶段。                                                                          |
| `ci`                | 仅手动完整 CI 子任务。                                                                          |
| `plugin-prerelease` | 仅插件预发布子任务。                                                                            |
| `release-checks`    | 所有 OpenClaw 发布检查阶段。                                                                    |
| `install-smoke`     | 从安装冒烟测试到发布检查。                                                                      |
| `cross-os`          | 跨操作系统发布检查。                                                                            |
| `live-e2e`          | 仓库/实时 E2E 和 Docker 发布路径验证。                                                          |
| `package`           | 软件包验收。                                                                                    |
| `qa`                | QA 一致性以及 QA 实时通道。                                                                     |
| `qa-parity`         | 仅 QA 一致性通道和报告。                                                                        |
| `qa-live`           | QA 实时 Matrix/Telegram，以及启用时受门控的 Discord、WhatsApp 和 Slack 通道。                   |
| `npm-telegram`      | 已发布软件包的 Telegram E2E；需要 `release_package_spec` 或 `npm_telegram_package_spec`。       |
| `performance`       | 仅产品性能证据。                                                                                |

当某个实时套件失败时，请使用 `live_suite_filter` 并设置 `rerun_group=live-e2e`。
有效的筛选器 ID 定义在可复用的实时/E2E 工作流中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker` 和
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 句柄是其三个提供商分片的聚合重运行句柄，
因此它仍会扇出到所有建议性 Docker Gateway 网关作业。

当某个跨操作系统通道失败时，请使用 `cross_os_suite_filter` 并设置
`rerun_group=cross-os`。该筛选器接受操作系统 ID、套件 ID 或操作系统/套件组合，
例如 `windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨操作系统
摘要包含打包升级通道各阶段的耗时，长时间运行的命令还会输出心跳行，
以便在作业超时前发现卡住的更新。

QA 发布检查失败会阻止正常的发布验证。QA 运行时工具
覆盖检查（标准层级中 `openclaw` 与 `codex` 之间的动态工具偏差）
也会阻止发布检查验证器，尽管底层 QA 运行时一致性通道属于建议性检查。
Tideclaw alpha 运行仍可将不涉及软件包安全性的发布检查通道视为建议性检查。
当设置 `release_profile=beta` 时，`Run repo/live E2E validation` 实时提供商套件
属于建议性检查：第三方模型部署会在发布期间发生变化，因此 beta 配置会将其
失败显示为警告，而 stable 和 full 配置仍会将其作为阻塞项。当
`live_suite_filter` 明确请求有门控的 QA 实时通道（例如 Discord、
WhatsApp 或 Slack）时，必须启用对应的
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 仓库变量；否则输入捕获会失败，
而不是静默跳过该通道。
当你需要新的 QA 证据时，请使用 `rerun_group=qa`、`qa-parity` 或
`qa-live` 重运行。

## 需要保留的证据

保留 `Full Release Validation` 摘要，将其作为发布级索引。它链接
子运行 ID，并包含最慢作业表。发生失败时，先检查子工作流，
然后使用上面最小的匹配句柄重运行。

有用的工件：

- 来自 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径工件
- Package Acceptance 的 `package-under-test` 和 Docker 验收工件
- 每个操作系统和套件的跨操作系统发布检查工件
- QA 一致性、运行时一致性、Matrix 和 Telegram 工件

## 工作流文件

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/install-smoke-reusable.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
