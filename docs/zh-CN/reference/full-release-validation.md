---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版和完整发布验证配置文件
    - 调试发布验证阶段失败
summary: 完整发布验证阶段、子工作流、发布配置、重运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-07-05T11:41:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5ece97d1f12e6a097cf9314acd47614f0f80cee704b1b48c0cedfe5e39ff064
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布验证的总入口：用于发布前证明的单一手动入口点。大多数工作发生在子工作流中，因此某个执行环境失败后可以重新运行，而无需重启整个发布流程。

从受信任的工作流引用运行它，通常是 `main`，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` 也接受 `anthropic` 或 `minimax`，用于跨操作系统新手引导和端到端智能体轮次。子工作流使用受信任的工作流引用作为测试框架，并使用输入 `ref` 作为待测候选版本，因此在验证较旧的发布分支或标签时，新的验证逻辑仍可用。

`release_profile=stable` 和 `release_profile=full` 始终运行完整的实时/Docker soak。传入 `run_release_soak=true` 可在 `beta` 配置文件中包含相同的 soak 通道。稳定版发布会拒绝缺少此 soak 和阻塞性产品性能证据的验证清单。

Package Acceptance 通常会从解析后的 `ref` 构建候选 tarball，包括通过 `pnpm ci:full-release` 分派的完整 SHA 运行。beta 发布后，传入 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` 可在发布检查、Package Acceptance、跨操作系统、发布路径 Docker 和 package Telegram 中复用已发布的 npm 包。仅当 Package Acceptance 需要有意证明不同包时，才使用 `package_acceptance_package_spec`。Codex 插件实时包通道遵循相同状态：已发布的 `release_package_spec` 值会派生 `codex_plugin_spec=npm:@openclaw/codex@<version>`；SHA/产物运行会从所选 ref 打包 `extensions/codex`；操作员也可以直接为 `npm:`、`npm-pack:` 或 `git:` 插件来源设置 `codex_plugin_spec`。该通道授予此插件所需的显式 Codex CLI 安装审批，然后运行 Codex CLI 预检和同一会话中的 OpenAI 智能体轮次。

## 顶层阶段

对于 `rerun_group=all`，`Verify Docker runtime image assets` 作业会阻塞所有其他阶段：它会先使用 `OPENCLAW_EXTENSIONS=diagnostics-otel,codex` 构建 `runtime-assets` Docker 目标，然后才分派其他任何内容。更窄的 `rerun_group` 会跳过此预检。

| 阶段                    | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 目标解析                | **作业：** `Resolve target ref`<br />**子工作流：** 无<br />**证明内容：** 解析发布分支、标签或完整提交 SHA，并记录所选输入。<br />**重新运行：** 如果此项失败，重新运行总工作流。                                                                                                                                                                                                               |
| Docker 资产预检         | **作业：** `Verify Docker runtime image assets`<br />**子工作流：** 无<br />**证明内容：** 在分派任何其他阶段之前，证明 `runtime-assets` Docker 构建目标仍然成功。仅在 `rerun_group=all` 时运行。<br />**重新运行：** 使用 `rerun_group=all` 重新运行总工作流。                                                                                                                                  |
| Vitest 和常规 CI        | **作业：** `Run normal full CI`<br />**子工作流：** `CI`<br />**证明内容：** 针对目标 ref 的手动完整 CI 图，包括 Linux Node 通道、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建产物冒烟检查、文档检查、Python Skills、Windows、macOS、Control UI i18n，以及通过总工作流运行的 Android。<br />**重新运行：** `rerun_group=ci`。 |
| 插件预发布              | **作业：** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**证明内容：** 仅发布时运行的插件静态检查、智能体式插件覆盖、完整插件批次分片、插件预发布 Docker 通道，以及用于兼容性分流的非阻塞 `plugin-inspector-advisory` 产物。<br />**重新运行：** `rerun_group=plugin-prerelease`。                                                        |
| 发布检查                | **作业：** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**证明内容：** 安装冒烟检查、跨操作系统包检查、Package Acceptance、QA Lab parity、实时 Matrix 和实时 Telegram。稳定版和完整配置文件还会运行完整的实时/E2E 套件以及 Docker 发布路径分块；beta 可通过 `run_release_soak=true` 选择加入。<br />**重新运行：** `rerun_group=release-checks` 或更窄的 release-checks 句柄。 |
| Package Telegram        | **作业：** `Run package Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**证明内容：** 在设置了 `release_package_spec` 或 `npm_telegram_package_spec` 时，运行聚焦于已发布包的 Telegram E2E。完整候选验证改用规范的 Package Acceptance Telegram E2E。<br />**重新运行：** 使用 `release_package_spec` 或 `npm_telegram_package_spec` 的 `rerun_group=npm-telegram`。                 |
| 产品性能                | **作业：** `Run product performance evidence`<br />**子工作流：** `OpenClaw Performance`<br />**证明内容：** 针对目标 SHA 的发布配置文件性能运行（`profile=release`、`repeat=3`、`fail_on_regression=true`）。仅对 `rerun_group=all` 或 `rerun_group=performance` 是必需（阻塞）的；更窄的重新运行组不需要。<br />**重新运行：** `rerun_group=performance`。                                      |
| 总验证器                | **作业：** `Verify full validation`<br />**子工作流：** 无<br />**证明内容：** 重新检查记录的子运行结论，并追加来自子工作流的最慢作业表。<br />**重新运行：** 在将失败的子工作流重新运行至绿色后，只重新运行此作业。                                                                                                                                                                                   |

对于 `ref=main` 和 `rerun_group=all`，较新的总工作流会取代较旧的总工作流。当父工作流被取消时，它的监视器会取消它已分派的任何子工作流。发布分支和标签验证运行默认不会相互取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它只解析一次目标，并在包或面向 Docker 的阶段需要时准备共享的 `release-package-under-test` 产物。

| 阶段                     | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 发布目标                 | **作业：** `Resolve target ref`<br />**支撑工作流：** 无<br />**测试：** 所选 ref、可选预期 SHA、profile、重新运行组，以及聚焦的实时套件过滤器。<br />**重新运行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                                                                                 |
| 包制品                   | **作业：** `Prepare release package artifact`<br />**支撑工作流：** 无<br />**测试：** 打包或解析一个候选 tarball，并上传 `release-package-under-test`，供下游面向包的检查使用。<br />**重新运行：** 受影响的包、跨 OS 或实时/E2E 组。                                                                                                                                                                                                                                                                                         |
| 安装冒烟测试             | **作业：** `Run install smoke`<br />**支撑工作流：** `Install Smoke`<br />**测试：** 完整安装路径，复用根 Dockerfile 冒烟镜像、QR 包安装、根与 Gateway 网关 Docker 冒烟测试、安装器 Docker 测试，以及 Bun 全局安装图像提供商冒烟测试。<br />**重新运行：** `rerun_group=install-smoke`。                                                                                                                                                                                                                                      |
| 跨 OS                    | **作业：** `cross_os_release_checks`<br />**支撑工作流：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：** 针对所选提供商和模式，在 Linux、Windows 和 macOS 上运行全新安装与升级通道，使用候选 tarball 加基线包。<br />**重新运行：** `rerun_group=cross-os`。                                                                                                                                                                                                                                             |
| 仓库和实时 E2E           | **作业：** `Run repo/live E2E validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 仓库 E2E、实时缓存、OpenAI websocket 流式传输、原生实时提供商和插件分片，以及由 `release_profile` 选择的 Docker 支持的实时模型/后端/Gateway 网关 harness。<br />**运行条件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新运行：** `rerun_group=live-e2e`，可选择搭配 `live_suite_filter`。 |
| Docker 发布路径          | **作业：** `Run Docker release-path validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 针对共享包制品运行发布路径 Docker 分块。<br />**运行条件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新运行：** `rerun_group=live-e2e`。                                                                                                                                                                                      |
| Package Acceptance       | **作业：** `Run package acceptance`<br />**支撑工作流：** `Package Acceptance`<br />**测试：** 离线插件包夹具、插件更新、规范的模拟 OpenAI Telegram 包 E2E，以及针对同一 tarball 的已发布升级存活检查。阻塞式发布检查使用默认的最新已发布基线；长稳检查（`run_release_soak=true`）扩展到最近 4 个稳定 npm 版本加 3 个固定历史版本（`2026.4.23`、`2026.5.2`、`2026.4.15`），并针对已报告问题的升级夹具运行。<br />**重新运行：** `rerun_group=package`。 |
| 成熟度评分卡             | **作业：** `Render maturity scorecard release docs`<br />**支撑工作流：** `maturity-scorecard.yml`<br />**测试：** 针对目标 ref 渲染建议性的成熟度评分卡文档。仅在传入 `run_maturity_scorecard=true` 时运行。<br />**重新运行：** `rerun_group=qa`，并带上 `run_maturity_scorecard=true`。                                                                                                                                                                                                 |
| QA 一致性                | **作业：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支撑工作流：** 直接作业<br />**测试：** 候选与基线的智能体式一致性包，然后生成一致性报告。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                       |
| QA 运行时一致性          | **作业：** `Run QA Lab runtime parity lane`<br />**支撑工作流：** 直接作业<br />**测试：** 一个 `openclaw`/`codex` 运行时配对的智能体式一致性通道（`pnpm openclaw qa suite --runtime-pair openclaw,codex`），包括标准层级，并在 `run_release_soak=true` 时包括长稳层级。建议性说明：单个失败不会阻塞发布检查验证器。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                               |
| QA 运行时工具覆盖率      | **作业：** `Enforce QA Lab runtime tool coverage`<br />**支撑工作流：** 直接作业<br />**测试：** 使用 QA 运行时一致性通道的输出，在标准运行时一致性层级中检查 `openclaw` 与 `codex` 之间的动态工具漂移（`pnpm openclaw qa coverage --tools`）。阻塞：此作业不能通过建议性覆盖解除。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                            |
| QA 实时 Matrix           | **作业：** `Run QA Lab live Matrix lane`<br />**支撑工作流：** 直接作业<br />**测试：** 在 `qa-live-shared` 环境中运行快速实时 Matrix QA profile。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                           |
| QA 实时 Telegram         | **作业：** `Run QA Lab live Telegram lane`<br />**支撑工作流：** 直接作业<br />**测试：** 使用 Convex CI 凭证租约运行实时 Telegram QA。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                      |
| 发布验证器               | **作业：** `Verify release checks`<br />**支撑工作流：** 无<br />**测试：** 所选重新运行组所需的发布检查作业。<br />**重新运行：** 在聚焦的子作业通过后重新运行。                                                                                                                                                                                                                                                                                                                                                  |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段会运行这些分块：

| 分块                                                            | 覆盖范围                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 发布路径冒烟通道。                                                                                             |
| `package-update-openai`                                         | OpenAI 包安装/更新行为、Codex 按需安装、Codex 插件实时轮次，以及 Chat Completions 工具调用。                              |
| `package-update-anthropic`                                      | Anthropic 包安装和更新行为。                                                                                               |
| `package-update-core`                                           | 提供商中立的包与更新行为。                                                                                                 |
| `plugins-runtime-plugins`                                       | 运行插件行为的插件运行时通道。                                                                                             |
| `plugins-runtime-services`                                      | 服务支持和实时插件运行时通道；按请求包含 OpenWebUI。                                                                       |
| `plugins-runtime-install-a` 到 `plugins-runtime-install-h`      | 为并行发布验证拆分的插件安装/运行时批次。                                                                                  |

当只有一个 Docker 通道失败时，在可复用的实时/E2E 工作流上使用定向的 `docker_lanes=<lane[,lane]>`。发布制品会在可用时包含每个通道的重新运行命令，并带有包制品和镜像复用输入。

## 发布 profile

`release_profile` 主要控制发布检查中的实时/提供商覆盖广度。
它不会移除常规完整 CI、插件预发布、安装冒烟、软件包
验收或 QA Lab。`stable` 和 `full` 配置档始终运行完整的仓库/实时
E2E 以及 Docker 发布路径浸泡覆盖。`beta` 配置档可以通过
`run_release_soak=true` 选择启用。软件包验收为每个完整候选版本提供规范的软件包
Telegram E2E，因此总控流程不会重复该
实时轮询器。

| 配置档  | 预期用途                      | 包含的实时/提供商覆盖范围                                                                                                                                                                            |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | 最快的发布关键冒烟测试。   | OpenAI/核心实时路径、OpenAI 的 Docker 实时模型、原生 Gateway 网关核心、原生 OpenAI Gateway 网关配置档、原生 OpenAI 插件，以及 Docker 实时 Gateway 网关 OpenAI。                                            |
| `stable` | 默认发布审批配置档。 | `beta` 加上 Anthropic 冒烟测试、Google、MiniMax、后端、原生实时测试 harness、Docker 实时 CLI 后端、Docker ACP 绑定、Docker Codex harness、Docker 子智能体公告，以及一个 OpenCode Go 冒烟分片。 |
| `full`   | 广泛的建议性扫描。             | `stable` 加上建议性提供商、插件实时分片，以及媒体实时分片。                                                                                                                               |

## 仅限完整配置档的新增项

这些套件会被 `stable` 跳过，并由 `full` 包含：

| 区域                             | 仅限完整配置档的覆盖范围                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker 实时模型               | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                                                                          |
| Docker 实时 Gateway 网关              | 建议性提供商拆分为 DeepSeek/Fireworks、OpenCode Go/OpenRouter 和 xAI/Z.ai 分片。                              |
| 原生 Gateway 网关提供商配置档 | 完整 Anthropic Opus 和 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。 |
| 原生插件实时分片        | 插件 A-K、L-N、O-Z 其他、Moonshot 和 xAI。                                                                             |
| 原生媒体实时分片         | 音频、Google 音乐、MiniMax 音乐，以及视频组 A-D。                                                                   |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和
`native-live-src-gateway-profiles-opencode-go-smoke`；`full` 改用覆盖更广的
Anthropic 和 OpenCode Go 模型分片。定向重跑仍可使用
聚合的 `native-live-src-gateway-profiles-anthropic` 或
`native-live-src-gateway-profiles-opencode-go` 句柄。

## 定向重跑

使用 `rerun_group` 避免重复运行无关的发布任务盒：

| 句柄              | 范围                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 所有完整发布验证阶段。                                                             |
| `ci`                | 仅手动完整 CI 子流程。                                                                      |
| `plugin-prerelease` | 仅插件预发布子流程。                                                                   |
| `release-checks`    | 所有 OpenClaw 发布检查阶段。                                                             |
| `install-smoke`     | 从安装冒烟到发布检查。                                                           |
| `cross-os`          | 跨 OS 发布检查。                                                                        |
| `live-e2e`          | 仓库/实时 E2E 和 Docker 发布路径验证。                                               |
| `package`           | 软件包验收。                                                                             |
| `qa`                | QA 对等性加 QA 实时通道。                                                                   |
| `qa-parity`         | 仅 QA 对等性通道和报告。                                                                |
| `qa-live`           | QA 实时 Matrix/Telegram，以及启用时受门控的 Discord、WhatsApp 和 Slack 通道。             |
| `npm-telegram`      | 已发布软件包的 Telegram E2E；需要 `release_package_spec` 或 `npm_telegram_package_spec`。 |
| `performance`       | 仅产品性能证据。                                                              |

当某个实时套件失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 搭配使用。
有效的过滤器 ID 在可复用实时/E2E 工作流中定义，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker` 和
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 句柄是其
三个提供商分片的聚合重跑句柄，因此它仍会扇出到所有建议性 Docker Gateway 网关作业。

当某个跨 OS 通道失败时，将 `cross_os_suite_filter` 与 `rerun_group=cross-os` 搭配使用。
该过滤器接受 OS ID、套件 ID，或 OS/套件组合，例如
`windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨 OS
摘要包含打包升级通道的分阶段耗时，长时间运行的
命令会打印 Heartbeat 行，以便在作业
超时前看出更新卡住。

QA 发布检查失败会阻止常规发布验证。QA 运行时工具
覆盖检查（标准层中 `openclaw` 和 `codex` 之间的动态工具漂移）
也会阻止发布检查验证器，即使
底层 QA 运行时对等性通道是建议性的。Tideclaw alpha 运行仍可
将非软件包安全的发布检查通道视为建议性通道。当
`live_suite_filter` 显式请求受门控的 QA 实时通道（例如 Discord、
WhatsApp 或 Slack）时，必须启用匹配的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 仓库
变量；否则输入捕获会失败，而不是静默跳过该通道。
当你需要新的 QA 证据时，重跑 `rerun_group=qa`、`qa-parity` 或 `qa-live`。

## 需要保留的证据

保留 `Full Release Validation` 摘要作为发布级索引。它会链接
子运行 ID，并包含最慢作业表。对于失败，先检查子
工作流，然后重跑上方最小的匹配句柄。

有用的工件：

- 来自 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径工件
- 软件包验收的 `package-under-test` 和 Docker 验收工件
- 每个 OS 和套件的跨 OS 发布检查工件
- QA 对等性、运行时对等性、Matrix 和 Telegram 工件

## 工作流文件

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
