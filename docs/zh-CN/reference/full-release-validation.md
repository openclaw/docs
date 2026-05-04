---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版和完整发布验证配置文件
    - 调试发布验证阶段失败
summary: 完整发布验证阶段、子工作流、发布配置档、重跑句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-05-04T22:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d67b7f9d413aa0f367b71f03d5325ff73591ee1ee6c77623712ebd15d295ca8b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布总控流程。它是预发布验证的单一手动入口点，但大部分工作发生在子工作流中，因此失败的执行单元可以重新运行，而不必重启整个发布流程。

从受信任的工作流引用运行它，通常是 `main`，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流使用受信任的工作流引用作为 harness，并使用输入 `ref` 作为待测候选版本。这样在验证较旧的发布分支或标签时，也能使用新的验证逻辑。

默认情况下，`release_profile=stable` 会运行阻塞发布的通道，并跳过完整的实时/Docker 长时间浸泡测试。传入 `run_release_soak=true` 可在稳定版运行中包含浸泡测试通道。`release_profile=full` 始终启用浸泡测试通道，因此广泛的 advisory 配置不会悄悄降低覆盖范围。

Package Acceptance 通常会从解析后的 `ref` 构建候选 tarball，包括通过 `pnpm ci:full-release` 调度的完整 SHA 运行。发布后，传入 `package_acceptance_package_spec=openclaw@YYYY.M.D`（或 `openclaw@beta`/`openclaw@latest`），即可改为针对已发布的 npm 包运行同一套包/更新矩阵。

## 顶层阶段

| 阶段                 | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目标解析             | **作业：** `Resolve target ref`<br />**子工作流：** 无<br />**证明：** 解析发布分支、标签或完整提交 SHA，并记录选定的输入。<br />**重新运行：** 如果此项失败，重新运行总控流程。                                                                                                                                                                                                                    |
| Vitest 和常规 CI     | **作业：** `Run normal full CI`<br />**子工作流：** `CI`<br />**证明：** 针对目标 ref 的手动完整 CI 图，包括 Linux Node 通道、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Control UI 国际化，以及通过总控流程运行的 Android。<br />**重新运行：** `rerun_group=ci`。 |
| 插件预发布           | **作业：** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**证明：** 仅发布用插件静态检查、agentic 插件覆盖、完整扩展批次分片，以及插件预发布 Docker 通道。<br />**重新运行：** `rerun_group=plugin-prerelease`。                                                                                                                                                  |
| 发布检查             | **作业：** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**证明：** 安装冒烟测试、跨 OS 包检查、Package Acceptance、QA Lab parity、实时 Matrix 和实时 Telegram。使用 `run_release_soak=true` 或 `release_profile=full` 时，还会运行完整的实时/E2E 套件和 Docker 发布路径分块。<br />**重新运行：** `rerun_group=release-checks` 或更窄的 release-checks 句柄。 |
| 包产物               | **作业：** `Prepare release package artifact`<br />**子工作流：** 无<br />**证明：** 提前创建父级 `release-package-under-test` tarball，供不需要等待 `OpenClaw Release Checks` 的面向包检查使用。<br />**重新运行：** 重新运行总控流程，或为 `rerun_group=npm-telegram` 提供 `npm_telegram_package_spec`。                                                                                           |
| 包 Telegram          | **作业：** `Run package Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**证明：** 在 `rerun_group=all` 且 `release_profile=full` 时，提供基于父级产物的 Telegram 包验证；或在设置 `npm_telegram_package_spec` 时，提供已发布包的 Telegram 验证。<br />**重新运行：** 使用 `npm_telegram_package_spec` 运行 `rerun_group=npm-telegram`。                                             |
| 总控验证器           | **作业：** `Verify full validation`<br />**子工作流：** 无<br />**证明：** 重新检查已记录的子运行结论，并附加来自子工作流的最慢作业表。<br />**重新运行：** 重新运行失败的子工作流使其变绿后，只重新运行此作业。                                                                                                                                                                                     |

对于 `ref=main` 和 `rerun_group=all`，较新的总控流程会取代较旧的总控流程。当父级被取消时，它的监控器会取消任何已调度的子工作流。发布分支和标签验证运行默认不会互相取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它会解析一次目标，并在面向包或 Docker 的阶段需要时，准备共享的 `release-package-under-test` 产物。

| 阶段                | 详细信息                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 发布目标            | **作业：** `Resolve target ref`<br />**支撑 workflow：** 无<br />**测试：** 选定的 ref、可选的预期 SHA、配置档、重跑组以及聚焦的 live 套件过滤器。<br />**重跑：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                              |
| 包构件              | **作业：** `Prepare release package artifact`<br />**支撑 workflow：** 无<br />**测试：** 打包或解析一个候选 tarball，并上传 `release-package-under-test`，供下游面向包的检查使用。<br />**重跑：** 受影响的包、跨 OS 或 live/E2E 组。                                                                                                                                                                                                              |
| 安装冒烟测试        | **作业：** `Run install smoke`<br />**支撑 workflow：** `Install Smoke`<br />**测试：** 完整安装路径，包括复用根 Dockerfile 冒烟镜像、QR 包安装、根和 Gateway 网关 Docker 冒烟测试、安装器 Docker 测试、Bun 全局安装 image-provider 冒烟测试，以及快速内置插件安装/卸载 E2E。<br />**重跑：** `rerun_group=install-smoke`。                                                                                                                                 |
| 跨 OS               | **作业：** `cross_os_release_checks`<br />**支撑 workflow：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：** 在 Linux、Windows 和 macOS 上，针对选定的提供商和模式运行全新安装与升级通道，使用候选 tarball 加基线包。<br />**重跑：** `rerun_group=cross-os`。                                                                                                                                                                                  |
| 仓库和 live E2E     | **作业：** `Run repo/live E2E validation`<br />**支撑 workflow：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 仓库 E2E、live 缓存、OpenAI websocket 流式传输、原生 live 提供商和插件分片，以及由 `release_profile` 选择的 Docker 支撑 live 模型/backend/Gateway 网关 harness。<br />**运行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重跑：** `rerun_group=live-e2e`，可选带 `live_suite_filter`。 |
| Docker 发布路径     | **作业：** `Run Docker release-path validation`<br />**支撑 workflow：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 针对共享包构件运行发布路径 Docker 分块。<br />**运行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重跑：** `rerun_group=live-e2e`。                                                                                                                                                      |
| 包验收              | **作业：** `Run package acceptance`<br />**支撑 workflow：** `Package Acceptance`<br />**测试：** 离线插件包夹具、插件更新、mock-OpenAI Telegram 包验收，以及针对同一 tarball 的已发布升级存活检查。阻塞发布检查使用默认的最新已发布基线；soak 检查会扩展到 `2026.4.23` 及之后的每个稳定 npm 发布版本，以及已报告问题的夹具。<br />**重跑：** `rerun_group=package`。                          |
| QA parity           | **作业：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支撑 workflow：** 直接作业<br />**测试：** 候选和基线 agentic parity 包，然后生成 parity 报告。<br />**重跑：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                          |
| QA live Matrix      | **作业：** `Run QA Lab live Matrix lane`<br />**支撑 workflow：** 直接作业<br />**测试：** `qa-live-shared` 环境中的快速 live Matrix QA 配置档。<br />**重跑：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                           |
| QA live Telegram    | **作业：** `Run QA Lab live Telegram lane`<br />**支撑 workflow：** 直接作业<br />**测试：** 使用 Convex CI 凭证租约的 live Telegram QA。<br />**重跑：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                       |
| 发布验证器          | **作业：** `Verify release checks`<br />**支撑 workflow：** 无<br />**测试：** 所选重跑组所需的发布检查作业。<br />**重跑：** 在聚焦的子作业通过后重跑。                                                                                                                                                                                                                                                                                                    |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段会运行这些分块：

| 分块                                                            | 覆盖范围                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 发布路径冒烟通道。                                   |
| `package-update-openai`                                         | OpenAI 包安装和更新行为。                             |
| `package-update-anthropic`                                      | Anthropic 包安装和更新行为。                          |
| `package-update-core`                                           | 提供商中立的包和更新行为。                           |
| `plugins-runtime-plugins`                                       | 执行插件行为的插件运行时通道。                     |
| `plugins-runtime-services`                                      | 服务支撑的插件运行时通道；按需包含 OpenWebUI。 |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 为并行发布验证拆分的插件安装/运行时批次。   |

当只有一个 Docker 通道失败时，在可复用 live/E2E workflow 上使用定向的 `docker_lanes=<lane[,lane]>`。发布构件会在可用时包含按通道的重跑命令，并带有包构件和镜像复用输入。

## 发布配置档

`release_profile` 主要控制发布检查内的 live/提供商覆盖范围。它不会移除常规完整 CI、插件预发布、安装冒烟测试、包验收或 QA Lab。对于 `stable`，详尽的仓库/live E2E 和 Docker 发布路径分块属于 soak 覆盖范围，并在 `run_release_soak=true` 时运行。`full` 会强制启用 soak 覆盖范围，并且在 `rerun_group=all` 时还会让总控运行使用父发布包构件的包 Telegram E2E，因此完整的预发布候选不会静默跳过该 Telegram 包通道。

| 配置档    | 预期用途                          | 包含的 live/提供商覆盖范围                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的发布关键冒烟测试。   | OpenAI/core live 路径、OpenAI 的 Docker live 模型、原生 Gateway 网关 core、原生 OpenAI Gateway 网关配置档、原生 OpenAI 插件，以及 Docker live Gateway 网关 OpenAI。                     |
| `stable`  | 默认发布批准配置档。 | `minimum` 加上 Anthropic 冒烟测试、Google、MiniMax、backend、原生 live 测试 harness、Docker live CLI backend、Docker ACP bind、Docker Codex harness，以及一个 OpenCode Go 冒烟分片。 |
| `full`    | 广泛 advisory 扫描。             | `stable` 加上 advisory 提供商、插件 live 分片和媒体 live 分片。                                                                                                        |

## 仅 full 添加项

这些套件会被 `stable` 跳过，并由 `full` 包含：

| 领域                             | 仅 full 覆盖范围                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live 模型                 | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                                                                          |
| Docker live Gateway 网关         | advisory 提供商拆分为 DeepSeek/Fireworks、OpenCode Go/OpenRouter 和 xAI/Z.ai 分片。                              |
| 原生 Gateway 网关提供商配置档    | 完整 Anthropic Opus 和 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。 |
| 原生插件 live 分片               | 插件 A-K、L-N、O-Z 其他、Moonshot 和 xAI。                                                                             |
| 原生媒体 live 分片               | 音频、Google 音乐、MiniMax 音乐，以及视频组 A-D。                                                                   |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和 `native-live-src-gateway-profiles-opencode-go-smoke`；`full` 则使用更广的 Anthropic 和 OpenCode Go 模型分片。聚焦重跑仍可使用聚合的 `native-live-src-gateway-profiles-anthropic` 或 `native-live-src-gateway-profiles-opencode-go` 句柄。

## 聚焦重跑

使用 `rerun_group` 来避免重复运行无关的发布 box：

| Handle              | 范围                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | 所有完整发布验证阶段。                                                |
| `ci`                | 仅手动完整 CI 子项。                                                  |
| `plugin-prerelease` | 仅插件预发布子项。                                                    |
| `release-checks`    | 所有 OpenClaw 发布检查阶段。                                          |
| `install-smoke`     | 从安装冒烟测试到发布检查。                                            |
| `cross-os`          | 跨 OS 发布检查。                                                      |
| `live-e2e`          | 仓库/live E2E 和 Docker 发布路径验证。                                |
| `package`           | 包验收。                                                              |
| `qa`                | QA 一致性加 QA 实时通道。                                             |
| `qa-parity`         | 仅 QA 一致性通道和报告。                                              |
| `qa-live`           | 仅 QA 实时 Matrix 和 Telegram。                                       |
| `npm-telegram`      | 已发布包 Telegram E2E；需要 `npm_telegram_package_spec`。             |

当一个实时套件失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 一起使用。
有效的筛选器 ID 在可复用的实时/E2E 工作流中定义，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker` 和
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 句柄是其三个提供商分片的聚合重跑句柄，因此它仍会展开到所有 advisory Docker Gateway 网关作业。

## 要保留的证据

将 `Full Release Validation` 摘要保留为发布级索引。它会链接子运行 ID，并包含最慢作业表。对于失败，先检查子工作流，然后重跑上面匹配的最小句柄。

有用的构件：

- Full Release Validation 父级和 `OpenClaw Release Checks` 中的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径构件
- Package Acceptance 的 `package-under-test` 和 Docker 验收构件
- 每个 OS 和套件的跨 OS 发布检查构件
- QA 一致性、Matrix 和 Telegram 构件

## 工作流文件

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
