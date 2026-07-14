---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版和完整发布验证配置文件
    - 调试发布验证阶段故障
summary: 完整发布验证阶段、子工作流、发布配置、重新运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-07-14T14:03:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: f4dad526111a514392a6a0108e88ed276461155ac6768444458eb44ad8c0ee35
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布产品验证的总控工作流。大部分工作
在子工作流中进行，因此某个执行环境失败后可以重新运行，而无需重新启动
整个发布流程。

将产品完成、生成变更日志前的提交冻结为 **Code SHA**，然后运行：

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

`provider` 还接受 `anthropic` 或 `minimax`，用于跨操作系统新手引导和
端到端智能体轮次。该辅助工具会根据 alpha/beta
软件包版本推断 `beta` 配置文件，其他情况下则推断 `stable`。使用
`-f key=value` 传递其他工作流输入；仅在执行广泛的安全公告扫描时使用 `-f release_profile=full`。

该辅助工具会创建一个临时 `release-ci/*` 引用，将其固定到一个可信的
`origin/main` 工作流 SHA，仅将目标 SHA 作为候选 `ref` 传递，
并在验证后删除临时引用。每个已分派的子工作流都必须
报告相同的工作流 SHA。传递
`-f reuse_evidence=false` 以强制执行全新运行，或传递
`--workflow-sha <trusted-main-sha>` 以选择仍可从当前 `origin/main` 访问的较早工作流提交。
该工作流本身绝不会创建或更新仓库引用。

当 Code SHA 全部通过后，仅生成并提交 `CHANGELOG.md`。这个新
提交就是 **Release SHA**。针对 Release SHA 运行同一辅助工具。仅当
GitHub 证明 Release SHA 派生自 Code SHA，且完整的变更路径集合恰好为
`CHANGELOG.md` 时，才会复用产品证据；npm
预检和软件包/安装验收仍会针对 Release SHA 运行。

`release_profile=stable` 和 `release_profile=full` 始终运行全面的
实时/Docker 浸泡测试。传递 `run_release_soak=true`，以使用
`beta` 配置文件包含相同的浸泡测试通道。如果验证清单
不包含此浸泡测试和阻塞性的产品性能证据，稳定版发布将被拒绝。

Package Acceptance 通常会从解析得到的
`ref` 构建候选 tarball，包括使用 `pnpm ci:full-release` 分派的完整 SHA 运行。发布
beta 版后，传递 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，以便在发布检查、Package Acceptance、跨操作系统、
发布路径 Docker 和软件包 Telegram 中复用
已发布的 npm 软件包。仅当 Package Acceptance 应有意验证其他软件包时，
才使用 `package_acceptance_package_spec`。
Codex 插件的实时软件包通道遵循相同状态：已发布的
`release_package_spec` 值派生出 `codex_plugin_spec=npm:@openclaw/codex@<version>`；
SHA/工件运行会从所选引用打包 `extensions/codex`；操作员还可以直接设置
`codex_plugin_spec`，以使用 `npm:`、`npm-pack:` 或 `git:` 插件
来源。该通道会授予此插件所需的明确 Codex CLI 安装审批，
然后运行 Codex CLI 预检以及同一会话中的 OpenAI 智能体轮次。

## 顶层阶段

对于 `rerun_group=all`，首先运行
`Check for reusable validation evidence` 作业。它会查找此前最新且成功的完整验证，该验证须具有相同的发布
配置文件、实际浸泡测试设置和验证输入。对完全相同目标的重新运行使用
`exact-target-full-validation-v1`。如果某个后代提交的完整差异恰好为
`CHANGELOG.md`，则使用 `changelog-only-release-v1`；所有产品通道都会被跳过，
验证器会独立重新检查 GitHub 提交比较、不可变父工件、
子运行和分派日志。其他任何目标变更都需要
全新的 Code SHA 验证。传递 `reuse_evidence=false` 以强制执行全新的完整
运行。仅当工作流来自 `main`，或来自规范的、固定到 SHA 的
`release-ci/*` 引用，并且其工作流提交仍位于可信的 `main` 谱系上时，
才会复用证据；其他工作流引用会重新运行所选通道。

同样，对于 `rerun_group=all`，`Verify Docker runtime image assets` 作业会使用
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex` 构建
`runtime-assets` Docker 目标。它与
其他阶段并行运行，并由总控验证器强制检查；各通道分派前不再等待
它完成。范围更窄的 `rerun_group` 会跳过此预检。

| 阶段                    | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目标解析                | **作业：** `Resolve target ref`<br />**子工作流：** 无<br />**验证内容：** 解析发布分支、标签或完整提交 SHA，并记录所选输入。<br />**重新运行：** 如果此阶段失败，请重新运行总控工作流。                                                                                                                                                                                                                                                                                                                                         |
| Docker 资产预检         | **作业：** `Verify Docker runtime image assets`<br />**子工作流：** 无<br />**验证内容：** 在分派任何其他阶段之前，确认 `runtime-assets` Docker 构建目标仍能成功构建。仅针对 `rerun_group=all` 运行。<br />**重新运行：** 使用 `rerun_group=all` 重新运行总控工作流。                                                                                                                                                                                                                                                                                |
| Vitest 和常规 CI        | **作业：** `Run normal full CI`<br />**子工作流：** `CI`<br />**验证内容：** 针对目标引用手动运行完整 CI 图，包括 Linux Node 通道、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建工件冒烟检查、文档检查、Python Skills、Windows、macOS、Control UI 国际化，以及通过总控工作流运行的 Android。<br />**重新运行：** `rerun_group=ci`。                                                                                                                      |
| 插件预发布              | **作业：** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**验证内容：** 仅发布时执行的插件静态检查、智能体式插件覆盖、完整插件批次分片、插件预发布 Docker 通道，以及用于兼容性分诊的非阻塞 `plugin-inspector-advisory` 工件。<br />**重新运行：** `rerun_group=plugin-prerelease`。                                                                                                                                                                                           |
| 发布检查                | **作业：** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**验证内容：** 安装冒烟测试、跨操作系统软件包检查、Package Acceptance、QA Lab 一致性、实时 Matrix 和实时 Telegram。稳定版和完整配置文件还会运行全面的实时/E2E 套件以及 Docker 发布路径分块；beta 可通过 `run_release_soak=true` 选择加入。<br />**重新运行：** `rerun_group=release-checks` 或范围更窄的发布检查句柄。                                                                                       |
| 软件包 Telegram         | **作业：** `Run package Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**验证内容：** 设置 `release_package_spec` 或 `npm_telegram_package_spec` 时，针对已发布软件包运行聚焦的 Telegram E2E。完整候选版本验证改用规范的 Package Acceptance Telegram E2E。<br />**重新运行：** 使用 `release_package_spec` 或 `npm_telegram_package_spec` 运行 `rerun_group=npm-telegram`。                                                                                                                             |
| 产品性能                | **作业：** `Run product performance evidence`<br />**子工作流：** `OpenClaw Performance`<br />**验证内容：** 针对目标 SHA 运行发布配置文件性能测试（`profile=release`、`repeat=3`、`fail_on_regression=true`、`publish_reports=false`）。Kova 输出保留在工作流工件中，且子工作流必须证明其报告发布器已被跳过。仅对 `rerun_group=all` 或 `rerun_group=performance` 为必需项（阻塞项）；范围更窄的重新运行组不要求此项。<br />**重新运行：** `rerun_group=performance`。 |
| 总控验证器              | **作业：** `Verify full validation`<br />**子工作流：** 无<br />**验证内容：** 重新检查记录的子运行结论，并附加各子工作流中耗时最久的作业表格。<br />**重新运行：** 将失败的子工作流重新运行至成功后，仅重新运行此作业。                                                                                                                                                                                                                                                                                                                            |

总控工作流始终以仅生成工件模式分派产品性能测试。
`OpenClaw Performance` 仅允许定时运行或明确设置
`publish_reports=true` 的手动分派发布报告。仅生成工件的
防护检查必须成功完成，以证明发布器作业始终处于跳过状态。
全新证据和复用证据都会记录
`controls.performanceReportPublication=artifact-only`；如果证据不包含匹配的规范化性能子工作流
证明，验证器和复用选择器将拒绝该证据。

验证器将规范清单上传为
`full-release-validation-<run-id>-<run-attempt>`。证据工具在按该确切
工件 ID 下载之前，会验证其工件 ID、摘要、生成者运行和尝试次数。
它会限制下载 ZIP 的大小，根据 REST
`sha256:` 摘要验证其字节，并以流式方式读取唯一允许且大小受限的清单条目，而不
解压归档。为兼容较早的发布使用方，会暂时保留一个稳定名称别名。
验证器始终优先使用带尝试次数限定的工件；在过渡期间，它仅对
尝试次数为 1 的清单 v2 生成者接受稳定名称。对于后续尝试和清单 v3，
它会拒绝该旧名称。

对于带有 `rerun_group=all` 的 `ref=main`、`release/*` 引用以及 Tideclaw
alpha 引用，较新的总控运行会取代具有相同引用和
重新运行组的较早运行。父运行被取消时，其监控器会取消它已经分派的所有
子工作流。标签验证运行与固定 SHA 验证运行不会
相互取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它只解析一次目标，
并在面向软件包或 Docker 的阶段需要时准备共享的
`release-package-under-test` 工件。

| 阶段                    | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 发布目标           | **作业：** `Resolve target ref`<br />**支撑工作流：** 无<br />**测试：** 选定的引用、可选的预期 SHA、配置文件、重新运行组和聚焦的实时测试套件筛选器。<br />**重新运行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                                                                                                             |
| 软件包工件         | **作业：** `Prepare release package artifact`<br />**支撑工作流：** 无<br />**测试：** 打包或解析一个候选 tarball，并上传 `release-package-under-test`，供下游面向软件包的检查使用。<br />**重新运行：** 受影响的软件包、跨操作系统或实时/E2E 组。                                                                                                                                                                                                                                                                                             |
| 安装冒烟测试            | **作业：** `Run install smoke`<br />**支撑工作流：** `Install Smoke`<br />**测试：** 完整安装路径，包括复用根 Dockerfile 冒烟镜像、QR 软件包安装、根和 Gateway 网关 Docker 冒烟测试、安装程序 Docker 测试，以及 Bun 全局安装镜像提供商冒烟测试。<br />**重新运行：** `rerun_group=install-smoke`。                                                                                                                                                                                                                                                           |
| 跨操作系统                 | **作业：** `cross_os_release_checks`<br />**支撑工作流：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：** 针对选定的提供商和模式，使用候选 tarball 和一个基线软件包，在 Linux、Windows 和 macOS 上运行全新安装和升级通道。<br />**重新运行：** `rerun_group=cross-os`。                                                                                                                                                                                                                                                                 |
| 仓库和实时 E2E        | **作业：** `Run repo/live E2E validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 仓库 E2E、实时缓存、OpenAI WebSocket 流式传输、原生实时提供商和插件分片，以及由 `release_profile` 选择的 Docker 支撑实时模型/后端/Gateway 网关测试框架。<br />**运行：** `run_release_soak=true`、`release_profile=full` 或聚焦的 `rerun_group=live-e2e`。<br />**重新运行：** `rerun_group=live-e2e`，可选择搭配 `live_suite_filter`。                                                                                |
| Docker 发布路径      | **作业：** `Run Docker release-path validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 针对共享软件包工件运行发布路径 Docker 分块。<br />**运行：** `run_release_soak=true`、`release_profile=full` 或聚焦的 `rerun_group=live-e2e`。<br />**重新运行：** `rerun_group=live-e2e`。                                                                                                                                                                                                                                     |
| 软件包验收       | **作业：** `Run package acceptance`<br />**支撑工作流：** `Package Acceptance`<br />**测试：** 离线插件软件包夹具、插件更新、规范的模拟 OpenAI Telegram 软件包 E2E，以及针对同一 tarball 的已发布版本升级存续检查。阻塞性发布检查使用默认的最新已发布基线；浸泡检查（`run_release_soak=true`）扩展至最近 4 个稳定 npm 版本及 3 个固定的历史版本（`2026.4.23`、`2026.5.2`、`2026.4.15`），并针对已报告问题的升级夹具运行。<br />**重新运行：** `rerun_group=package`。 |
| 成熟度评分卡       | **作业：** `Render maturity scorecard release docs`<br />**支撑工作流：** `maturity-scorecard.yml`<br />**测试：** 针对目标引用渲染建议性的成熟度评分卡文档。仅在传入 `run_maturity_scorecard=true` 时运行。<br />**重新运行：** 使用 `run_maturity_scorecard=true` 重新运行 `rerun_group=qa`。                                                                                                                                                                                                                                                           |
| QA 对等性                | **作业：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支撑工作流：** 直接作业<br />**测试：** 候选和基线智能体对等性包，然后生成对等性报告。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                         |
| QA 运行时对等性        | **作业：** `Run QA Lab runtime parity lane`<br />**支撑工作流：** 直接作业<br />**测试：** `openclaw`/`codex` 运行时对智能体对等性通道（`pnpm openclaw qa suite --runtime-pair openclaw,codex`），包括标准层级，并在使用 `run_release_soak=true` 时包括浸泡层级。建议性检查：单项失败不会阻塞发布检查验证器。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                    |
| QA 运行时工具覆盖范围 | **作业：** `Enforce QA Lab runtime tool coverage`<br />**支撑工作流：** 直接作业<br />**测试：** 使用 QA 运行时对等性通道的输出，在标准运行时对等性层级（`pnpm openclaw qa coverage --tools`）中检测 `openclaw` 与 `codex` 之间的动态工具漂移。阻塞性检查：此作业不可通过建议性覆盖进行忽略。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                        |
| QA 实时 Matrix           | **作业：** `Run QA Lab live Matrix lane`<br />**支撑工作流：** 直接作业<br />**测试：** `qa-live-shared` 环境中的快速实时 Matrix QA 配置文件。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                          |
| QA 实时 Telegram         | **作业：** `Run QA Lab live Telegram lane`<br />**支撑工作流：** 直接作业<br />**测试：** 使用 Convex CI 凭据租约的实时 Telegram QA。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                                      |
| 发布验证器         | **作业：** `Verify release checks`<br />**支撑工作流：** 无<br />**测试：** 选定重新运行组所需的发布检查作业。<br />**重新运行：** 在聚焦的子作业通过后重新运行。                                                                                                                                                                                                                                                                                                                                                                                   |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段运行以下分块：

| 分块                                                           | 覆盖范围                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 发布路径冒烟测试通道。                                                                                      |
| `package-update-openai`                                         | OpenAI 软件包安装/更新行为、Codex 按需安装、Codex 插件实时轮次，以及 Chat Completions 工具调用。 |
| `package-update-anthropic`                                      | Anthropic 软件包安装和更新行为。                                                                             |
| `package-update-core`                                           | 提供商中立的软件包和更新行为。                                                                              |
| `plugins-runtime-plugins`                                       | 验证插件行为的插件运行时通道。                                                                        |
| `plugins-runtime-services`                                      | 由服务支撑的实时插件运行时通道。                                                                              |
| `plugins-runtime-install-a` 到 `plugins-runtime-install-h` | 为并行发布验证拆分的插件安装/运行时批次。                                                      |
| `openwebui`                                                     | 在请求时，将 OpenWebUI 兼容性冒烟测试隔离到专用的大磁盘运行器上。                                    |

当仅有一个 Docker 通道失败时，在可复用的实时/E2E 工作流中使用定向的 `docker_lanes=<lane[,lane]>`。如可用，发布工件会包括每个通道的重新运行命令，以及软件包工件和镜像复用输入。

## 发布配置文件

`release_profile` 主要控制发布检查中的实时/提供商覆盖广度。它不会移除常规完整 CI、插件预发布、安装冒烟测试、软件包验收或 QA Lab。稳定版和完整配置文件始终运行详尽的仓库/实时 E2E，以及 Docker 发布路径浸泡覆盖。Beta 配置文件可通过 `run_release_soak=true` 选择加入。软件包验收为每个完整候选版本提供规范的软件包 Telegram E2E，因此总括流程不会重复该实时轮询器。

| 配置档  | 预期用途                      | 包含的实时测试/提供商覆盖范围                                                                                                                                                                            |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | 最快的发布关键冒烟测试。   | OpenAI/核心实时路径、OpenAI 的 Docker 实时模型、原生 Gateway 网关核心、原生 OpenAI Gateway 网关配置档、原生 OpenAI 插件，以及 Docker 实时 Gateway 网关 OpenAI。                                            |
| `stable` | 默认发布审批配置档。 | `beta`，外加 Anthropic 冒烟测试、Google、MiniMax、后端、原生实时测试工具框架、Docker 实时 CLI 后端、Docker ACP 绑定、Docker Codex harness、Docker 子智能体公告，以及一个 OpenCode Go 冒烟分片。 |
| `full`   | 广泛的建议性扫描。             | `stable`，外加建议性提供商、插件实时分片和媒体实时分片。                                                                                                                               |

## 仅完整配置档包含的附加项

以下测试套件会被 `stable` 跳过，并由 `full` 包含：

| 区域                             | 仅完整配置档包含的覆盖范围                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker 实时模型               | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                                                                          |
| Docker 实时 Gateway 网关              | 建议性提供商拆分为 DeepSeek/Fireworks、OpenCode Go/OpenRouter 和 xAI/Z.ai 分片。                              |
| 原生 Gateway 网关提供商配置档 | 完整的 Anthropic Opus 和 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整的 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。 |
| 原生插件实时分片        | 插件 A-K、L-N、O-Z 其他插件、Moonshot 和 xAI。                                                                             |
| 原生媒体实时分片         | 音频、Google 音乐、MiniMax 音乐，以及视频组 A-D。                                                                   |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和
`native-live-src-gateway-profiles-opencode-go-smoke`；`full` 则使用范围更广的
Anthropic 和 OpenCode Go 模型分片。聚焦重跑仍可使用聚合
句柄 `native-live-src-gateway-profiles-anthropic` 或
`native-live-src-gateway-profiles-opencode-go`。

## 聚焦重跑

使用 `rerun_group`，以避免重复运行无关的发布环境：

| 句柄              | 范围                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 完整发布验证的所有阶段。                                                             |
| `ci`                | 仅手动完整 CI 子工作流。                                                                      |
| `plugin-prerelease` | 仅插件预发布子工作流。                                                                   |
| `release-checks`    | OpenClaw 发布检查的所有阶段。                                                             |
| `install-smoke`     | 从安装冒烟测试到发布检查。                                                           |
| `cross-os`          | 跨操作系统发布检查。                                                                        |
| `live-e2e`          | 仓库/实时 E2E 和 Docker 发布路径验证。                                               |
| `package`           | 软件包验收。                                                                             |
| `qa`                | QA 一致性加 QA 实时测试通道。                                                                   |
| `qa-parity`         | 仅 QA 一致性测试通道和报告。                                                                |
| `qa-live`           | QA 实时 Matrix/Telegram，以及启用时受门控的 Discord、WhatsApp 和 Slack 测试通道。             |
| `npm-telegram`      | 已发布软件包的 Telegram E2E；需要 `release_package_spec` 或 `npm_telegram_package_spec`。 |
| `performance`       | 仅产品性能证据。                                                              |

当某个实时测试套件失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 配合使用。
有效的筛选器 ID 定义在可复用的实时/E2E 工作流中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker` 和
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 句柄是其三个提供商分片的聚合重跑句柄，因此仍会扇出到所有建议性 Docker Gateway 网关作业。

当某个跨操作系统测试通道失败时，将 `cross_os_suite_filter` 与 `rerun_group=cross-os` 配合使用。
筛选器接受操作系统 ID、测试套件 ID 或操作系统/测试套件组合，例如
`windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨操作系统
摘要包含打包升级测试通道各阶段的耗时，长时间运行的命令还会打印 Heartbeat 行，
以便在作业超时前发现卡住的更新。

QA 发布检查失败会阻止正常的发布验证。QA 运行时工具
覆盖检查（标准层级中 `openclaw` 与 `codex` 之间的动态工具漂移）
也会阻止发布检查验证器，即使底层 QA 运行时一致性测试通道属于建议性检查。
Tideclaw alpha 运行仍可将不涉及软件包安全性的发布检查测试通道视为建议性检查。使用
`release_profile=beta` 时，`Run repo/live E2E validation` 实时提供商测试套件
属于建议性检查：第三方模型部署会在发布过程中发生变化，因此 beta 会将其失败显示为警告，
而 stable 和 full 配置档仍会将其视为阻断项。当
`live_suite_filter` 明确请求受门控的 QA 实时测试通道（例如 Discord、
WhatsApp 或 Slack）时，必须启用匹配的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 仓库
变量；否则输入捕获将失败，而不是静默跳过该测试通道。
需要最新 QA 证据时，请重跑 `rerun_group=qa`、`qa-parity` 或 `qa-live`。

## 需要保留的证据

保留 `Full Release Validation` 摘要作为发布级索引。它链接
子运行 ID，并包含最慢作业表。发生失败时，先检查子
工作流，然后重跑上方范围最小的匹配句柄。

记录 Code SHA 和 Release SHA、复用策略和变更路径集合、绿色的
Code SHA 父运行，以及轻量级 Release SHA 父运行。

有用的工件：

- `release-package-under-test`，来自 `OpenClaw Release Checks`
- `.artifacts/docker-tests/` 下的 Docker 发布路径工件
- 软件包验收 `package-under-test` 和 Docker 验收工件
- 各操作系统和测试套件的跨操作系统发布检查工件
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
