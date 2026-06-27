---
read_when:
    - 运行或重新运行完整发布验证
    - 稳定版和完整发布验证配置文件的比较
    - 调试发布验证阶段失败
summary: 完整发布验证阶段、子工作流、发布配置文件、重新运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-06-27T03:15:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布总入口。它是预发布证明的唯一手动入口点，但大多数工作发生在子工作流中，因此失败的机器可以重新运行，而无需重启整个发布。

从受信任的工作流 ref 运行它，通常是 `main`，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流使用受信任的工作流 ref 作为测试框架，并使用输入的 `ref` 作为待测候选版本。这样在验证较旧的发布分支或标签时，仍可使用新的验证逻辑。

`release_profile=stable` 和 `release_profile=full` 始终运行详尽的 live/Docker 浸泡测试。传入 `run_release_soak=true` 可在 beta 配置中包含相同的浸泡测试通道。稳定版发布会拒绝缺少此浸泡测试和阻塞型产品性能证据的验证清单。

包验收通常会从解析后的 `ref` 构建候选 tarball，包括通过 `pnpm ci:full-release` 分派的完整 SHA 运行。beta 发布后，传入 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` 可在发布检查、包验收、跨操作系统、发布路径 Docker 和包 Telegram 中复用已发布的 npm 包。仅当包验收需要有意证明不同的包时，才使用 `package_acceptance_package_spec`。Codex 插件 live 包通道遵循相同状态：已发布的 `release_package_spec` 值会派生出 `codex_plugin_spec=npm:@openclaw/codex@<version>`；SHA/工件运行会从所选 ref 打包 `extensions/codex`；操作员也可以直接为 `npm:`、`npm-pack:` 或 `git:` 插件来源设置 `codex_plugin_spec`。该通道会授予此插件所需的显式 Codex CLI 安装审批，然后运行 Codex CLI 预检和同一会话的 OpenAI 智能体轮次。

## 顶层阶段

| 阶段                 | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 目标解析             | **作业：** `Resolve target ref`<br />**子工作流：** 无<br />**证明：** 解析发布分支、标签或完整提交 SHA，并记录所选输入。<br />**重新运行：** 如果此步骤失败，重新运行总工作流。                                                                                                                                                                                                                                             |
| Vitest 和常规 CI     | **作业：** `Run normal full CI`<br />**子工作流：** `CI`<br />**证明：** 针对目标 ref 的手动完整 CI 图，包括 Linux Node 通道、内置插件分片、插件和渠道契约分片、Node 22 兼容性、`check-*`、`check-additional-*`、构建工件冒烟检查、文档检查、Python Skills、Windows、macOS、Control UI i18n，以及通过总工作流运行的 Android。<br />**重新运行：** `rerun_group=ci`。                           |
| 插件预发布           | **作业：** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**证明：** 仅发布使用的插件静态检查、智能体式插件覆盖率、完整扩展批次分片、插件预发布 Docker 通道，以及用于兼容性分诊的非阻塞 `plugin-inspector-advisory` 工件。<br />**重新运行：** `rerun_group=plugin-prerelease`。                                                                                        |
| 发布检查             | **作业：** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**证明：** 安装冒烟、跨操作系统包检查、包验收、QA Lab 对等性、live Matrix 和 live Telegram。stable 和 full 配置还会运行详尽的 live/E2E 套件和 Docker 发布路径分块；beta 可通过 `run_release_soak=true` 选择加入。<br />**重新运行：** `rerun_group=release-checks` 或更窄的 release-checks 句柄。 |
| 包 Telegram          | **作业：** `Run package Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**证明：** 当设置了 `release_package_spec` 或 `npm_telegram_package_spec` 时，运行聚焦于已发布包的 Telegram E2E。完整候选验证改用规范的包验收 Telegram E2E。<br />**重新运行：** 使用 `release_package_spec` 或 `npm_telegram_package_spec` 的 `rerun_group=npm-telegram`。                                               |
| 总验证器             | **作业：** `Verify full validation`<br />**子工作流：** 无<br />**证明：** 重新检查已记录的子运行结论，并追加来自子工作流的最慢作业表。<br />**重新运行：** 在重新运行失败子项并变绿后，仅重新运行此作业。                                                                                                                                                                                                  |

对于 `ref=main` 和 `rerun_group=all`，较新的总工作流会取代较旧的总工作流。当父工作流被取消时，它的监控器会取消已分派的任何子工作流。发布分支和标签验证运行默认不会相互取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它会一次性解析目标，并在包或面向 Docker 的阶段需要时准备共享的 `release-package-under-test` 工件。

| 阶段                | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 发布目标            | **作业：** `Resolve target ref`<br />**支撑工作流：** 无<br />**测试：** 选定的 ref、可选的预期 SHA、配置档、重新运行组，以及聚焦的 live 套件过滤器。<br />**重新运行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                              |
| 包构件              | **作业：** `Prepare release package artifact`<br />**支撑工作流：** 无<br />**测试：** 打包或解析一个候选 tarball，并上传 `release-package-under-test`，供下游面向包的检查使用。<br />**重新运行：** 受影响的包、跨 OS 或 live/E2E 组。                                                                                                                                                                                                 |
| 安装冒烟            | **作业：** `Run install smoke`<br />**支撑工作流：** `Install Smoke`<br />**测试：** 完整安装路径，包括复用根 Dockerfile 冒烟镜像、QR 包安装、根和 Gateway 网关 Docker 冒烟、安装器 Docker 测试、Bun 全局安装镜像提供商冒烟，以及快速内置插件安装/卸载 E2E。<br />**重新运行：** `rerun_group=install-smoke`。                                                                                                      |
| 跨 OS               | **作业：** `cross_os_release_checks`<br />**支撑工作流：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：** 在 Linux、Windows 和 macOS 上，针对所选提供商和模式运行全新安装与升级路径，使用候选 tarball 加基线包。<br />**重新运行：** `rerun_group=cross-os`。                                                                                                                                                       |
| 仓库和 live E2E     | **作业：** `Run repo/live E2E validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 仓库 E2E、live 缓存、OpenAI websocket 流式传输、原生 live 提供商和插件分片，以及由 `release_profile` 选择的 Docker 支撑 live 模型/后端/Gateway 网关 harness。<br />**运行条件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新运行：** `rerun_group=live-e2e`，可选择带上 `live_suite_filter`。 |
| Docker 发布路径     | **作业：** `Run Docker release-path validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 针对共享包构件运行发布路径 Docker 分块。<br />**运行条件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新运行：** `rerun_group=live-e2e`。                                                                                                                                                      |
| 包验收              | **作业：** `Run package acceptance`<br />**支撑工作流：** `Package Acceptance`<br />**测试：** 离线插件包 fixture、插件更新、规范的 mock-OpenAI Telegram 包 E2E，以及针对同一 tarball 的已发布升级存活检查。阻塞性发布检查使用默认的最新已发布基线；浸泡检查扩展到 `2026.4.23` 及之后的每个稳定 npm 版本，并包含已报告问题的 fixture。<br />**重新运行：** `rerun_group=package`。                   |
| QA 对等性           | **作业：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支撑工作流：** 直接作业<br />**测试：** 候选与基线智能体对等性包，然后生成对等性报告。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                          |
| QA live Matrix      | **作业：** `Run QA Lab live Matrix lane`<br />**支撑工作流：** 直接作业<br />**测试：** 在 `qa-live-shared` 环境中运行快速 live Matrix QA 配置档。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                           |
| QA live Telegram    | **作业：** `Run QA Lab live Telegram lane`<br />**支撑工作流：** 直接作业<br />**测试：** 使用 Convex CI 凭证租约运行 live Telegram QA。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                       |
| 发布验证器          | **作业：** `Verify release checks`<br />**支撑工作流：** 无<br />**测试：** 所选重新运行组所需的发布检查作业。<br />**重新运行：** 在聚焦子作业通过后重新运行。                                                                                                                                                                                                                                                                                                    |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段会运行这些分块：

| 分块                                                            | 覆盖范围                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 发布路径冒烟路径。                                                                                             |
| `package-update-openai`                                         | OpenAI 包安装/更新行为、Codex 按需安装、Codex 插件 live 轮次，以及 Chat Completions 工具调用。 |
| `package-update-anthropic`                                      | Anthropic 包安装和更新行为。                                                                             |
| `package-update-core`                                           | 提供商无关的包和更新行为。                                                                              |
| `plugins-runtime-plugins`                                       | 覆盖插件行为的插件运行时路径。                                                                        |
| `plugins-runtime-services`                                      | 服务支撑和 live 插件运行时路径；按请求包含 OpenWebUI。                                           |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 为并行发布验证拆分的插件安装/运行时批次。                                                      |

当只有一个 Docker 路径失败时，请在可复用 live/E2E 工作流上使用定向的 `docker_lanes=<lane[,lane]>`。发布构件会在可用时包含每个路径的重新运行命令，并带有包构件和镜像复用输入。

## 发布配置档

`release_profile` 主要控制发布检查内的 live/提供商覆盖广度。它不会移除常规完整 CI、Plugin Prerelease、安装冒烟、包验收或 QA Lab。稳定版和完整配置档始终运行详尽的仓库/live E2E 和 Docker 发布路径浸泡覆盖。Beta 配置档可以通过 `run_release_soak=true` 选择启用。Package Acceptance 会为每个完整候选提供规范的包 Telegram E2E，因此总控流程不会重复该 live 轮询器。

| 配置档    | 预期用途                          | 包含的 live/提供商覆盖范围                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的发布关键冒烟。              | OpenAI/核心 live 路径、OpenAI 的 Docker live 模型、原生 Gateway 网关核心、原生 OpenAI Gateway 网关配置档、原生 OpenAI 插件，以及 Docker live Gateway 网关 OpenAI。                     |
| `stable`  | 默认发布审批配置档。              | `minimum` 加上 Anthropic 冒烟、Google、MiniMax、后端、原生 live 测试 harness、Docker live CLI 后端、Docker ACP 绑定、Docker Codex harness，以及一个 OpenCode Go 冒烟分片。 |
| `full`    | 广泛咨询性扫描。                  | `stable` 加上咨询性提供商、插件 live 分片和媒体 live 分片。                                                                                                        |

## 仅完整配置档新增项

这些套件会被 `stable` 跳过，并由 `full` 包含：

| 区域                             | 仅完整配置档覆盖范围                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live 模型                 | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                                                                          |
| Docker live Gateway 网关         | 咨询性提供商拆分为 DeepSeek/Fireworks、OpenCode Go/OpenRouter 和 xAI/Z.ai 分片。                              |
| 原生 Gateway 网关提供商配置档    | 完整 Anthropic Opus 和 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。 |
| 原生插件 live 分片               | Plugins A-K、L-N、O-Z 其他、Moonshot 和 xAI。                                                                             |
| 原生媒体 live 分片               | 音频、Google 音乐、MiniMax 音乐，以及视频组 A-D。                                                                   |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和
`native-live-src-gateway-profiles-opencode-go-smoke`；`full` 改用更广的
Anthropic 和 OpenCode Go 模型分片。聚焦重新运行仍可使用聚合
`native-live-src-gateway-profiles-anthropic` 或
`native-live-src-gateway-profiles-opencode-go` 句柄。

## 聚焦重新运行

使用 `rerun_group` 来避免重复运行无关的发布框：

| 句柄                | 范围                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 所有完整发布验证阶段。                                                                          |
| `ci`                | 仅手动完整 CI 子项。                                                                            |
| `plugin-prerelease` | 仅插件预发布子项。                                                                              |
| `release-checks`    | 所有 OpenClaw 发布检查阶段。                                                                    |
| `install-smoke`     | 安装冒烟到发布检查。                                                                            |
| `cross-os`          | 跨 OS 发布检查。                                                                                |
| `live-e2e`          | 仓库/live E2E 和 Docker 发布路径验证。                                                          |
| `package`           | 软件包验收。                                                                                    |
| `qa`                | QA 一致性以及 QA live 通道。                                                                    |
| `qa-parity`         | 仅 QA 一致性通道和报告。                                                                        |
| `qa-live`           | QA live Matrix/Telegram，以及启用时受门控的 Discord、WhatsApp 和 Slack 通道。                   |
| `npm-telegram`      | 已发布软件包 Telegram E2E；需要 `release_package_spec` 或 `npm_telegram_package_spec`。         |

当某个 live 套件失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 配合使用。
有效的过滤器 id 定义在可复用的 live/E2E 工作流中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker` 和
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 句柄是其三个提供商分片的聚合重跑句柄，
因此它仍会展开到所有 advisory Docker Gateway 网关作业。

当某个跨 OS 通道失败时，将 `cross_os_suite_filter` 与 `rerun_group=cross-os` 配合使用。该过滤器接受 OS id、套件 id，或 OS/套件组合，例如 `windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨 OS 摘要包含打包升级通道的分阶段耗时，长时间运行的命令会打印 Heartbeat 行，因此卡住的 Windows 更新会在作业超时前可见。

QA 发布检查失败会阻塞正常发布验证。标准层级中必需的 OpenClaw 动态工具漂移也会阻塞发布检查验证器。Tideclaw alpha 运行仍可将非软件包安全发布检查通道视为 advisory。当 `live_suite_filter` 显式请求受门控的 QA live 通道（例如 Discord、WhatsApp 或 Slack）时，必须启用匹配的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 仓库变量；否则输入捕获会失败，而不是静默跳过该通道。当你需要新的 QA 证据时，重跑 `rerun_group=qa`、`qa-parity` 或 `qa-live`。

## 要保留的证据

保留 `Full Release Validation` 摘要作为发布级索引。它链接子运行 id，并包含最慢作业表。对于失败，先检查子工作流，然后重跑上方匹配的最小句柄。

有用的工件：

- 来自 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径工件
- 软件包验收 `package-under-test` 和 Docker 验收工件
- 每个 OS 和套件的跨 OS 发布检查工件
- QA 一致性、Matrix 和 Telegram 工件

## 工作流文件

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
