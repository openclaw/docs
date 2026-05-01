---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版与完整版发布验证配置方案
    - 调试发布验证阶段失败
summary: 完整发布验证阶段、子工作流、发布配置、重新运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-05-01T02:43:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布总工作流。它是预发布验证的单一手动入口点，但大多数工作发生在子工作流中，因此失败的检查块可以重新运行，而无需重启整个发布流程。

从受信任的工作流引用运行它，通常是 `main`，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流使用受信任的工作流引用作为 harness，并使用输入
`ref` 作为待测试候选版本。这样在验证较旧的发布分支或标签时，也能使用新的验证逻辑。

## 顶层阶段

| 阶段                  | 详情                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 目标解析              | **作业：** `Resolve target ref`<br />**子工作流：** 无<br />**验证：** 解析发布分支、标签或完整提交 SHA，并记录所选输入。<br />**重新运行：** 如果这里失败，重新运行总工作流。                                                                                                                                                                                                                                      |
| Vitest 和普通 CI      | **作业：** `Run normal full CI`<br />**子工作流：** `CI`<br />**验证：** 针对目标引用的手动完整 CI 图，包括 Linux Node 线路、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python skills、Windows、macOS、Control UI i18n，以及通过总工作流运行的 Android。<br />**重新运行：** `rerun_group=ci`。 |
| 插件预发布            | **作业：** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**验证：** 仅发布使用的插件静态检查、agentic 插件覆盖率、完整插件批量分片，以及插件预发布 Docker 线路。<br />**重新运行：** `rerun_group=plugin-prerelease`。                                                                                                                      |
| 发布检查              | **作业：** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**验证：** 安装 smoke、跨 OS 包检查、live/E2E 套件、Docker 发布路径分块、Package Acceptance、QA Lab parity、live Matrix 和 live Telegram。<br />**重新运行：** `rerun_group=release-checks` 或更窄的 release-checks 句柄。                    |
| 发布后 Telegram       | **作业：** `Run post-publish Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**验证：** 设置 `npm_telegram_package_spec` 时，可选的已发布包 Telegram 验证。<br />**重新运行：** `rerun_group=npm-telegram`。                                                                                                                                 |
| 总工作流验证器        | **作业：** `Verify full validation`<br />**子工作流：** 无<br />**验证：** 重新检查已记录的子运行结论，并附加来自子工作流的最慢作业表。<br />**重新运行：** 在重新运行失败的子工作流并变绿后，仅重新运行此作业。                                                                                                                                                                    |

对于 `ref=main` 和 `rerun_group=all`，较新的总工作流会取代较旧的总工作流。
当父工作流被取消时，它的监视器会取消所有已调度的子工作流。发布分支和标签验证运行默认不会互相取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它会解析一次目标，并在包或面向 Docker 的阶段需要时，准备共享的 `release-package-under-test` 构件。

| 阶段                  | 详情                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 发布目标              | **作业：** `Resolve target ref`<br />**支撑工作流：** 无<br />**测试：** 所选引用、可选的预期 SHA、profile、重新运行组和聚焦的 live 套件过滤器。<br />**重新运行：** `rerun_group=release-checks`。                                                                                                                                                                   |
| 包构件                | **作业：** `Prepare release package artifact`<br />**支撑工作流：** 无<br />**测试：** 打包或解析一个候选 tarball，并上传 `release-package-under-test`，供下游面向包的检查使用。<br />**重新运行：** 受影响的包、跨 OS 或 live/E2E 组。                                                                                                                               |
| 安装 smoke            | **作业：** `Run install smoke`<br />**支撑工作流：** `Install Smoke`<br />**测试：** 完整安装路径，包括复用根 Dockerfile smoke 镜像、QR 包安装、根和 Gateway 网关 Docker smoke、安装器 Docker 测试、Bun 全局安装 image-provider smoke，以及快速内置插件 Docker E2E。<br />**重新运行：** `rerun_group=install-smoke`。                                      |
| 跨 OS                 | **作业：** `cross_os_release_checks`<br />**支撑工作流：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：** 在 Linux、Windows 和 macOS 上，对所选提供商和模式运行全新安装与升级线路，使用候选 tarball 加一个基线包。<br />**重新运行：** `rerun_group=cross-os`。                                                                                |
| 仓库和 live E2E       | **作业：** `Run repo/live E2E validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 仓库 E2E、live cache、OpenAI websocket 流式传输、原生 live 提供商和插件分片，以及由 `release_profile` 选择的 Docker 支撑 live 模型、后端和 Gateway 网关 harness。<br />**重新运行：** `rerun_group=live-e2e`，可选配 `live_suite_filter`。 |
| Docker 发布路径       | **作业：** `Run Docker release-path validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 针对共享包构件运行发布路径 Docker 分块。<br />**重新运行：** `rerun_group=live-e2e`。                                                                                                                                                 |
| Package Acceptance    | **作业：** `Run package acceptance`<br />**支撑工作流：** `Package Acceptance`<br />**测试：** 构件原生的内置渠道依赖兼容性、离线插件包 fixture，以及针对同一个 tarball 的 mock-OpenAI Telegram 包验收。<br />**重新运行：** `rerun_group=package`。                                                                                                           |
| QA parity             | **作业：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支撑工作流：** 直接作业<br />**测试：** 候选和基线 agentic parity 包，然后生成 parity 报告。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                        |
| QA live Matrix        | **作业：** `Run QA Lab live Matrix lane`<br />**支撑工作流：** 直接作业<br />**测试：** `qa-live-shared` 环境中的快速 live Matrix QA profile。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                     |
| QA live Telegram      | **作业：** `Run QA Lab live Telegram lane`<br />**支撑工作流：** 直接作业<br />**测试：** 使用 Convex CI 凭证租约的 live Telegram QA。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                             |
| 发布验证器            | **作业：** `Verify release checks`<br />**支撑工作流：** 无<br />**测试：** 所选重新运行组所需的发布检查作业。<br />**重新运行：** 在聚焦的子作业通过后重新运行。                                                                                                                                                                                               |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段会运行这些分块：

| 分块                                                                                        | 覆盖范围                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | 核心 Docker 发布路径 smoke 线路。                                       |
| `package-update-openai`                                                                     | OpenAI 包安装和更新行为。                                               |
| `package-update-anthropic`                                                                  | Anthropic 包安装和更新行为。                                            |
| `package-update-core`                                                                       | 提供商中立的包和更新行为。                                              |
| `plugins-runtime-plugins`                                                                   | 覆盖插件行为的插件运行时线路。                                          |
| `plugins-runtime-services`                                                                  | 服务支撑的插件运行时线路；按需包含 OpenWebUI。                          |
| `plugins-runtime-install-a` 到 `plugins-runtime-install-h`                                  | 为并行发布验证拆分的插件安装/运行时批次。                               |
| `bundled-channels-core`                                                                     | 内置渠道 Docker 行为。                                                  |
| `bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` | 内置渠道更新行为。                                                      |
| `bundled-channels-contracts`                                                                | Docker 发布路径中的内置渠道契约检查。                                   |

当只有一个 Docker 分支失败时，在可复用的 live/E2E 工作流上使用定向的 `docker_lanes=<lane[,lane]>`。发布产物会在可用时包含每个分支的重新运行命令，并带有包产物和镜像复用输入。

## 发布配置

`release_profile` 只控制发布检查中的 live/provider 覆盖广度。它不会移除正常的完整 CI、插件预发布、安装冒烟、包验收、QA Lab 或 Docker 发布路径分块。

| 配置      | 预期用途                      | 包含的 live/provider 覆盖范围                                                                                                                                                 |
| --------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的发布关键冒烟测试。      | OpenAI/核心 live 路径、OpenAI 的 Docker live 模型、原生 Gateway 网关核心、原生 OpenAI Gateway 网关配置、原生 OpenAI 插件，以及 Docker live Gateway 网关 OpenAI。             |
| `stable`  | 默认发布批准配置。            | `minimum` 加上 Anthropic、Google、MiniMax、backend、原生 live 测试 harness、Docker live CLI backend、Docker ACP bind、Docker Codex harness，以及一个 OpenCode Go 冒烟分片。 |
| `full`    | 广泛的顾问式扫描。            | `stable` 加上顾问提供商、插件 live 分片和媒体 live 分片。                                                                                                                    |

## 仅 full 包含的新增项

这些套件会被 `stable` 跳过，并由 `full` 包含：

| 领域                             | 仅 full 覆盖范围                                                               |
| -------------------------------- | ------------------------------------------------------------------------------ |
| Docker live 模型                 | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                              |
| Docker live Gateway 网关         | DeepSeek、Fireworks、OpenCode Go、OpenRouter、xAI 和 Z.ai 的顾问分片。         |
| 原生 Gateway 网关提供商配置      | Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。      |
| 原生插件 live 分片               | 插件 A-K、L-N、O-Z 其他项、Moonshot 和 xAI。                                   |
| 原生媒体 live 分片               | Audio、Google music、MiniMax music，以及 video groups A-D。                    |

`stable` 包含 `native-live-src-gateway-profiles-opencode-go-smoke`；`full` 则使用更广泛的 OpenCode Go 模型分片。

## 聚焦重新运行

使用 `rerun_group` 以避免重复运行无关的发布盒：

| 句柄                | 范围                                             |
| ------------------- | ------------------------------------------------ |
| `all`               | 所有完整发布验证阶段。                           |
| `ci`                | 仅手动完整 CI 子项。                             |
| `plugin-prerelease` | 仅插件预发布子项。                               |
| `release-checks`    | 所有 OpenClaw 发布检查阶段。                     |
| `install-smoke`     | 从安装冒烟到发布检查。                           |
| `cross-os`          | 跨操作系统发布检查。                             |
| `live-e2e`          | 仓库/live E2E 和 Docker 发布路径验证。           |
| `package`           | 包验收。                                         |
| `qa`                | QA parity 加 QA live 分支。                      |
| `qa-parity`         | 仅 QA parity 分支和报告。                        |
| `qa-live`           | 仅 QA live Matrix 和 Telegram。                  |
| `npm-telegram`      | 仅可选的发布后 Telegram E2E。                    |

当一个 live 套件失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 搭配使用。有效的过滤器 ID 定义在可复用的 live/E2E 工作流中，包括 `docker-live-models`、`live-gateway-docker`、`live-gateway-anthropic-docker`、`live-gateway-google-docker`、`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、`live-cli-backend-docker`、`live-acp-bind-docker` 和 `live-codex-harness-docker`。

## 要保留的证据

保留 `Full Release Validation` 摘要作为发布级索引。它会链接子运行 ID，并包含最慢任务表。对于失败，请先检查子工作流，然后重新运行上方最小的匹配句柄。

有用的产物：

- 来自 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径产物
- 包验收的 `package-under-test` 和 Docker 验收产物
- 每个操作系统和套件的跨操作系统发布检查产物
- QA parity、Matrix 和 Telegram 产物

## 工作流文件

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
