---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版与完整发布验证配置文件
    - 调试发布验证阶段失败问题
summary: 完整发布验证阶段、子工作流、发布配置、重新运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-07-11T20:56:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布验证的总入口：用于发布前验证的唯一手动入口点。大部分工作在子工作流中完成，因此某个执行环境失败后可以单独重新运行，而无需重新启动整个发布验证。

请从可信的工作流引用运行它（通常为 `main`），并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

对于跨操作系统的新手引导和端到端智能体轮次，`provider` 也接受 `anthropic` 或 `minimax`。可复用的子作业通过 `job.workflow_repository` 和 `job.workflow_sha` 解析被调用的工作流执行框架，而输入 `ref` 用于选择待测试的候选版本。这样，在验证较旧的发布分支或标签时，仍可使用当前可信的验证逻辑。

每个已派发的子工作流都必须报告与父级 `Full Release Validation` 运行相同的工作流 SHA。如果在父级和子级派发之间 `main` 发生变化，即使子工作流本身成功，总入口也会以关闭方式失败。若要对不可变的精确提交进行验证，请使用 `pnpm ci:full-release --sha <target-sha>`。该辅助工具会创建一个固定到当前可信 `origin/main` 的临时 `release-ci/*` 引用，仅将目标 SHA 作为候选 `ref` 传递，在可用时复用严格的精确目标证据，并在验证后删除该引用。传入 `-f reuse_evidence=false` 可强制执行全新运行，或使用 `--workflow-sha <trusted-main-sha>` 选择当前 `origin/main` 仍可到达的较旧工作流提交。工作流本身绝不会创建或更新仓库引用。

`release_profile=stable` 和 `release_profile=full` 始终运行完整的实时/Docker 长时间验证。使用 `beta` 配置时，传入 `run_release_soak=true` 可包含相同的长时间验证通道。如果验证清单缺少此长时间验证和阻塞式产品性能证据，稳定版发布将被拒绝。

Package Acceptance 通常会从已解析的 `ref` 构建候选 tarball，其中包括通过 `pnpm ci:full-release` 派发的完整 SHA 运行。发布 beta 版本后，传入 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，可在发布检查、Package Acceptance、跨操作系统检查、发布路径 Docker 和软件包 Telegram 验证中复用已发布的 npm 软件包。仅当 Package Acceptance 需要有意验证另一个软件包时，才使用 `package_acceptance_package_spec`。Codex 插件的实时软件包通道遵循相同状态：已发布的 `release_package_spec` 值会派生出 `codex_plugin_spec=npm:@openclaw/codex@<version>`；SHA/制品运行会从所选引用打包 `extensions/codex`；操作员也可直接为 `npm:`、`npm-pack:` 或 `git:` 插件来源设置 `codex_plugin_spec`。该通道会授予此插件所需的明确 Codex CLI 安装审批，然后运行 Codex CLI 预检和同一会话中的 OpenAI 智能体轮次。

## 顶层阶段

对于 `rerun_group=all`，首先运行 `Check for reusable validation evidence` 作业：它会查找目标 SHA、发布配置、实际长时间验证设置和验证输入完全相同的最新历史绿色完整验证。如果存在此类证据，所有通道都会跳过，总入口验证器会重新检查不可变的父级制品、子运行和派发日志。这仅用于同一候选版本的重新运行恢复，不授权跨 SHA 复用。候选版本发生变化时，应重新运行受该差异影响的每个软件包、制品、安装、Docker 或提供商门禁。传入 `reuse_evidence=false` 可强制执行全新的完整运行。证据复用仅允许从 `main` 或规范的 SHA 固定 `release-ci/*` 引用运行，并且其工作流提交必须仍位于可信的 `main` 沿袭中；其他工作流引用会重新运行所选通道。

同样对于 `rerun_group=all`，`Verify Docker runtime image assets` 作业会使用 `OPENCLAW_EXTENSIONS=diagnostics-otel,codex` 构建 `runtime-assets` Docker 目标。它与其他阶段并行运行，并由总入口验证器强制检查；各通道不再需要等待它完成后才派发。更窄的 `rerun_group` 会跳过此预检。

| 阶段                    | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目标解析                | **作业：** `Resolve target ref`<br />**子工作流：** 无<br />**验证内容：** 解析发布分支、标签或完整提交 SHA，并记录所选输入。<br />**重新运行：** 如果此阶段失败，请重新运行总入口。                                                                                                                                                                                                                                                                                                                                      |
| Docker 制品预检         | **作业：** `Verify Docker runtime image assets`<br />**子工作流：** 无<br />**验证内容：** 在派发任何其他阶段之前，确认 `runtime-assets` Docker 构建目标仍能成功。仅在 `rerun_group=all` 时运行。<br />**重新运行：** 使用 `rerun_group=all` 重新运行总入口。                                                                                                                                                                                                                                                               |
| Vitest 和常规 CI        | **作业：** `Run normal full CI`<br />**子工作流：** `CI`<br />**验证内容：** 针对目标引用运行手动完整 CI 图，包括 Linux Node 通道、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建制品冒烟检查、文档检查、Python Skills、Windows、macOS、Control UI 国际化，以及通过总入口运行的 Android 检查。<br />**重新运行：** `rerun_group=ci`。                                                                                                                                            |
| 插件预发布              | **作业：** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**验证内容：** 仅限发布的插件静态检查、智能体式插件覆盖、完整插件批次分片、插件预发布 Docker 通道，以及用于兼容性分诊的非阻塞 `plugin-inspector-advisory` 制品。<br />**重新运行：** `rerun_group=plugin-prerelease`。                                                                                                                                                                                                               |
| 发布检查                | **作业：** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**验证内容：** 安装冒烟测试、跨操作系统软件包检查、Package Acceptance、QA Lab 一致性、实时 Matrix 和实时 Telegram。稳定版和完整配置还会运行全面的实时/E2E 套件及 Docker 发布路径分块；beta 可通过 `run_release_soak=true` 选择加入。<br />**重新运行：** `rerun_group=release-checks` 或更窄的发布检查句柄。                                                                                                             |
| 软件包 Telegram         | **作业：** `Run package Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**验证内容：** 设置 `release_package_spec` 或 `npm_telegram_package_spec` 时，针对已发布软件包运行聚焦的 Telegram E2E。完整候选版本验证则使用规范的 Package Acceptance Telegram E2E。<br />**重新运行：** 使用 `rerun_group=npm-telegram`，并设置 `release_package_spec` 或 `npm_telegram_package_spec`。                                                                                                                               |
| 产品性能                | **作业：** `Run product performance evidence`<br />**子工作流：** `OpenClaw Performance`<br />**验证内容：** 针对目标 SHA 运行发布配置性能测试（`profile=release`、`repeat=3`、`fail_on_regression=true`、`publish_reports=false`）。Kova 输出保留在工作流制品中，且子工作流必须证明其报告发布器已跳过。仅在 `rerun_group=all` 或 `rerun_group=performance` 时为必需项（阻塞）；对于更窄的重新运行组则不作要求。<br />**重新运行：** `rerun_group=performance`。 |
| 总入口验证器            | **作业：** `Verify full validation`<br />**子工作流：** 无<br />**验证内容：** 重新检查已记录的子运行结论，并附加来自子工作流的最慢作业表格。<br />**重新运行：** 将失败的子工作流重新运行至绿色后，仅重新运行此作业。                                                                                                                                                                                                                                                                                                  |

总入口始终以仅制品模式派发产品性能测试。`OpenClaw Performance` 仅允许定时运行或明确设置 `publish_reports=true` 的手动派发发布报告。仅制品防护必须成功完成，以证明发布器作业保持跳过状态。全新和复用的证据都会记录 `controls.performanceReportPublication=artifact-only`；如果缺少匹配的规范化性能子工作流证明，验证器和复用选择器将拒绝该证据。

验证器会将规范清单上传为 `full-release-validation-<run-id>-<run-attempt>`。证据工具在下载该精确制品 ID 之前，会验证其制品 ID、摘要、生产者运行和尝试次数。它会限制下载的 ZIP 大小，使用 REST `sha256:` 摘要验证其字节，并以流式方式读取唯一允许且大小受限的清单条目，而不解压归档。为兼容较旧的发布使用方，暂时保留稳定名称别名。验证器始终优先使用包含尝试次数的制品；作为过渡措施，仅对尝试次数为 1 的清单 v2 生产者接受稳定名称。对于后续尝试和清单 v3，它会拒绝该旧名称。

对于 `ref=main` 且 `rerun_group=all` 的运行、`release/*` 引用以及 Tideclaw alpha 引用，如果存在具有相同引用和重新运行组的较新总入口运行，较旧运行将被取代。父级被取消时，其监控器会取消已经派发的所有子工作流。标签和固定 SHA 验证运行不会相互取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它会解析目标一次，并在面向软件包或 Docker 的阶段需要时准备共享的 `release-package-under-test` 制品。

| 阶段                     | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 发布目标                 | **作业：** `Resolve target ref`<br />**支持工作流：** 无<br />**测试：** 选定的引用、可选的预期 SHA、配置档案、重运行组和聚焦的实时套件筛选器。<br />**重运行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                                                                                                             |
| 软件包产物               | **作业：** `Prepare release package artifact`<br />**支持工作流：** 无<br />**测试：** 打包或解析一个候选 tarball，并上传 `release-package-under-test`，供下游面向软件包的检查使用。<br />**重运行：** 受影响的软件包、跨操作系统或实时/E2E 组。                                                                                                                                                                                                                                                                                             |
| 安装冒烟测试             | **作业：** `Run install smoke`<br />**支持工作流：** `Install Smoke`<br />**测试：** 完整安装路径，包括复用根 Dockerfile 冒烟镜像、QR 软件包安装、根目录和 Gateway 网关 Docker 冒烟测试、安装程序 Docker 测试，以及 Bun 全局安装的图像提供商冒烟测试。<br />**重运行：** `rerun_group=install-smoke`。                                                                                                                                                                                                                                                           |
| 跨操作系统               | **作业：** `cross_os_release_checks`<br />**支持工作流：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：** 在 Linux、Windows 和 macOS 上，针对选定的提供商和模式运行全新安装与升级通道，使用候选 tarball 和一个基线软件包。<br />**重运行：** `rerun_group=cross-os`。                                                                                                                                                                                                                                                                 |
| 仓库和实时 E2E           | **作业：** `Run repo/live E2E validation`<br />**支持工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 仓库 E2E、实时缓存、OpenAI websocket 流式传输、原生实时提供商和插件分片，以及由 `release_profile` 选择、以 Docker 为后端的实时模型/后端/Gateway 网关测试框架。<br />**运行条件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重运行：** `rerun_group=live-e2e`，可选择搭配 `live_suite_filter`。                                                                                |
| Docker 发布路径          | **作业：** `Run Docker release-path validation`<br />**支持工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 针对共享软件包产物运行发布路径 Docker 分块。<br />**运行条件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重运行：** `rerun_group=live-e2e`。                                                                                                                                                                                                                                     |
| 软件包验收               | **作业：** `Run package acceptance`<br />**支持工作流：** `Package Acceptance`<br />**测试：** 离线插件软件包固件、插件更新、规范的模拟 OpenAI Telegram 软件包 E2E，以及针对同一 tarball 的已发布版本升级存续检查。阻塞式发布检查默认使用最新的已发布基线；浸泡检查（`run_release_soak=true`）扩展到最近 4 个稳定 npm 版本和 3 个固定的历史版本（`2026.4.23`、`2026.5.2`、`2026.4.15`），并针对已报告问题的升级固件运行。<br />**重运行：** `rerun_group=package`。 |
| 成熟度评分卡             | **作业：** `Render maturity scorecard release docs`<br />**支持工作流：** `maturity-scorecard.yml`<br />**测试：** 针对目标引用渲染建议性质的成熟度评分卡文档。仅在传入 `run_maturity_scorecard=true` 时运行。<br />**重运行：** 使用 `rerun_group=qa`，并设置 `run_maturity_scorecard=true`。                                                                                                                                                                                                                                                           |
| QA 对等性                | **作业：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支持工作流：** 直接作业<br />**测试：** 候选版本与基线版本的智能体对等性包，然后生成对等性报告。<br />**重运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                         |
| QA 运行时对等性          | **作业：** `Run QA Lab runtime parity lane`<br />**支持工作流：** 直接作业<br />**测试：** 一个 `openclaw`/`codex` 运行时配对的智能体对等性通道（`pnpm openclaw qa suite --runtime-pair openclaw,codex`），包括标准层级，以及在 `run_release_soak=true` 时运行的浸泡层级。建议性质：单项失败不会阻塞发布检查验证器。<br />**重运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                    |
| QA 运行时工具覆盖率      | **作业：** `Enforce QA Lab runtime tool coverage`<br />**支持工作流：** 直接作业<br />**测试：** 使用 QA 运行时对等性通道的输出，在标准运行时对等性层级中检查 `openclaw` 与 `codex` 之间的动态工具漂移（`pnpm openclaw qa coverage --tools`）。阻塞式：此作业不能通过建议性质的覆盖机制跳过。<br />**重运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                        |
| QA 实时 Matrix           | **作业：** `Run QA Lab live Matrix lane`<br />**支持工作流：** 直接作业<br />**测试：** 在 `qa-live-shared` 环境中运行快速实时 Matrix QA 配置档案。<br />**重运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                          |
| QA 实时 Telegram         | **作业：** `Run QA Lab live Telegram lane`<br />**支持工作流：** 直接作业<br />**测试：** 使用 Convex CI 凭据租约运行实时 Telegram QA。<br />**重运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                                      |
| 发布验证器               | **作业：** `Verify release checks`<br />**支持工作流：** 无<br />**测试：** 选定重运行组所需的发布检查作业。<br />**重运行：** 在聚焦的子作业通过后重新运行。                                                                                                                                                                                                                                                                                                                                                                                   |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段运行以下分块：

| 分块                                                            | 覆盖范围                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 发布路径冒烟测试通道。                                                                                      |
| `package-update-openai`                                         | OpenAI 软件包安装/更新行为、Codex 按需安装、Codex 插件实时轮次，以及 Chat Completions 工具调用。 |
| `package-update-anthropic`                                      | Anthropic 软件包安装和更新行为。                                                                             |
| `package-update-core`                                           | 与提供商无关的软件包和更新行为。                                                                              |
| `plugins-runtime-plugins`                                       | 验证插件行为的插件运行时通道。                                                                        |
| `plugins-runtime-services`                                      | 由服务支持的实时插件运行时通道。                                                                              |
| `plugins-runtime-install-a` 到 `plugins-runtime-install-h`      | 为并行发布验证而拆分的插件安装/运行时批次。                                                      |
| `openwebui`                                                     | 请求时，在专用大磁盘运行器上隔离运行 OpenWebUI 兼容性冒烟测试。                                    |

当只有一个 Docker 通道失败时，请在可复用的实时/E2E 工作流中使用定向的 `docker_lanes=<lane[,lane]>`。如果可用，发布产物会包含每个通道的重运行命令，以及软件包产物和镜像复用输入。

## 发布配置档案

`release_profile` 主要控制发布检查中的实时测试/提供商覆盖广度。
它不会移除常规完整 CI、插件预发布、安装冒烟测试、软件包
验收或 QA Lab。`stable` 和 `full` 配置始终运行全面的仓库/实时
E2E 以及 Docker 发布路径浸泡测试。`beta` 配置可通过
`run_release_soak=true` 选择启用。软件包验收为每个完整候选版本提供规范的
软件包 Telegram E2E，因此总括流程不会重复运行该
实时轮询器。

| 配置      | 预期用途                         | 包含的实时测试/提供商覆盖范围                                                                                                                                                                              |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | 最快的发布关键冒烟测试。          | OpenAI/核心实时路径、OpenAI 的 Docker 实时模型、原生 Gateway 网关核心、原生 OpenAI Gateway 网关配置、原生 OpenAI 插件，以及 Docker 实时 Gateway 网关 OpenAI。                                            |
| `stable` | 默认发布审批配置。                | `beta`，外加 Anthropic 冒烟测试、Google、MiniMax、后端、原生实时测试框架、Docker 实时 CLI 后端、Docker ACP 绑定、Docker Codex harness、Docker 子智能体公告，以及一个 OpenCode Go 冒烟测试分片。 |
| `full`   | 广泛的建议性扫描。                | `stable`，外加建议性提供商、插件实时测试分片和媒体实时测试分片。                                                                                                                                             |

## 仅 `full` 包含的附加项

以下测试套件会被 `stable` 跳过，并由 `full` 包含：

| 范围                             | 仅 `full` 包含的覆盖范围                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker 实时模型                  | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                                                                          |
| Docker 实时 Gateway 网关         | 建议性提供商拆分为 DeepSeek/Fireworks、OpenCode Go/OpenRouter 和 xAI/Z.ai 分片。                                            |
| 原生 Gateway 网关提供商配置     | 完整的 Anthropic Opus 和 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整的 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。 |
| 原生插件实时测试分片             | 插件 A-K、L-N、O-Z 其他插件、Moonshot 和 xAI。                                                                             |
| 原生媒体实时测试分片             | 音频、Google 音乐、MiniMax 音乐和视频组 A-D。                                                                              |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和
`native-live-src-gateway-profiles-opencode-go-smoke`；`full` 则改用覆盖范围更广的
Anthropic 和 OpenCode Go 模型分片。聚焦重跑仍可使用聚合
句柄 `native-live-src-gateway-profiles-anthropic` 或
`native-live-src-gateway-profiles-opencode-go`。

## 聚焦重跑

使用 `rerun_group` 避免重复运行无关的发布执行环境：

| 句柄                | 范围                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 完整发布验证的所有阶段。                                                                        |
| `ci`                | 仅手动完整 CI 子工作流。                                                                        |
| `plugin-prerelease` | 仅插件预发布子工作流。                                                                          |
| `release-checks`    | 所有 OpenClaw 发布检查阶段。                                                                    |
| `install-smoke`     | 从安装冒烟测试到发布检查。                                                                      |
| `cross-os`          | 跨操作系统发布检查。                                                                            |
| `live-e2e`          | 仓库/实时 E2E 和 Docker 发布路径验证。                                                          |
| `package`           | 软件包验收。                                                                                    |
| `qa`                | QA 一致性检查和 QA 实时测试通道。                                                               |
| `qa-parity`         | 仅 QA 一致性检查通道和报告。                                                                    |
| `qa-live`           | QA 实时 Matrix/Telegram，以及启用时受门控的 Discord、WhatsApp 和 Slack 通道。                    |
| `npm-telegram`      | 已发布软件包的 Telegram E2E；需要 `release_package_spec` 或 `npm_telegram_package_spec`。       |
| `performance`       | 仅产品性能证据。                                                                                |

当某个实时测试套件失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 搭配使用。
有效的过滤器 ID 在可复用实时测试/E2E 工作流中定义，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker` 和
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 句柄是其三个
提供商分片的聚合重跑句柄，因此仍会扇出至所有建议性 Docker Gateway 网关作业。

当某个跨操作系统通道失败时，将 `cross_os_suite_filter` 与 `rerun_group=cross-os`
搭配使用。该过滤器接受操作系统 ID、测试套件 ID 或操作系统/测试套件组合，例如
`windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨操作系统
摘要包含软件包升级通道各阶段的耗时，长时间运行的
命令会输出 Heartbeat 行，以便在作业
超时前发现卡住的更新。

QA 发布检查失败会阻止常规发布验证。QA 运行时工具
覆盖检查（标准层级中 `openclaw` 与 `codex` 之间的动态工具漂移）
也会阻止发布检查验证器，即使底层
QA 运行时一致性检查通道属于建议性检查。Tideclaw Alpha 运行仍可
将不涉及软件包安全性的发布检查通道视为建议性检查。使用
`release_profile=beta` 时，`Run repo/live E2E validation` 实时提供商测试套件
属于建议性检查：第三方模型部署会在发布过程中发生变化，因此
`beta` 会将其失败显示为警告，而 `stable` 和 `full` 配置仍会
让这些失败阻止发布。当
`live_suite_filter` 明确请求受门控的 QA 实时测试通道（例如 Discord、
WhatsApp 或 Slack）时，必须启用对应的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 仓库
变量；否则输入捕获会失败，而不是静默跳过该通道。
需要最新 QA 证据时，重跑 `rerun_group=qa`、`qa-parity` 或 `qa-live`。

## 需要保留的证据

保留 `Full Release Validation` 摘要，作为发布级索引。它会链接
子工作流运行 ID，并包含最慢作业表。遇到失败时，先检查子
工作流，然后重跑上方范围最小的匹配句柄。

有用的产物：

- `OpenClaw Release Checks` 中的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径产物
- 软件包验收的 `package-under-test` 和 Docker 验收产物
- 每个操作系统和测试套件的跨操作系统发布检查产物
- QA 一致性检查、运行时一致性检查、Matrix 和 Telegram 产物

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
