---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版和完整发布验证配置
    - 调试发布验证阶段失败
summary: 完整发布验证的阶段、子工作流、发布配置文件、重新运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-05-11T20:33:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d83d15272e4f7cff82ef791c8dbeb6adc447626ada8ae221d074ee16b2cadd5
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布总控流程。它是发布前验证证明的单一手动入口点，但大多数工作发生在子工作流中，因此失败的任务组可以重新运行，而不必重启整个发布流程。

请从受信任的工作流引用运行它，通常是 `main`，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流使用受信任的工作流引用作为验证工具链，并使用输入的 `ref` 作为待测候选版本。这样在验证较旧的发布分支或标签时，新的验证逻辑仍然可用。

默认情况下，`release_profile=stable` 会运行发布阻断检查通道，并跳过详尽的实时/Docker 长时间运行检查。在稳定版运行中传入 `run_release_soak=true` 可包含长时间运行检查通道。`release_profile=full` 始终启用长时间运行检查通道，因此广覆盖咨询配置不会静默降低覆盖率。

软件包验收通常会从解析后的 `ref` 构建候选 tarball，包括使用 `pnpm ci:full-release` 分派的完整 SHA 运行。beta 发布后，传入 `release_package_spec=openclaw@YYYY.M.D-beta.N` 可在发布检查、软件包验收、跨操作系统、发布路径 Docker 和软件包 Telegram 中复用已发布的 npm 软件包。仅当软件包验收应有意验证另一个软件包时，才使用 `package_acceptance_package_spec`。

## 顶层阶段

| 阶段                 | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目标解析             | **任务：** `Resolve target ref`<br />**子工作流：** 无<br />**证明：** 解析发布分支、标签或完整提交 SHA，并记录所选输入。<br />**重新运行：** 如果此项失败，请重新运行总控流程。                                                                                                                                                                                                 |
| Vitest 和常规 CI     | **任务：** `Run normal full CI`<br />**子工作流：** `CI`<br />**证明：** 针对目标 ref 的手动完整 CI 图，包括 Linux Node 通道、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Control UI i18n，以及通过总控流程运行的 Android。<br />**重新运行：** `rerun_group=ci`。 |
| 插件预发布           | **任务：** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**证明：** 仅发布阶段的插件静态检查、智能体式插件覆盖、完整插件批次分片、插件预发布 Docker 通道，以及用于兼容性分流的非阻断 `plugin-inspector-advisory` 工件。<br />**重新运行：** `rerun_group=plugin-prerelease`。                                      |
| 发布检查             | **任务：** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**证明：** 安装冒烟、跨操作系统软件包检查、软件包验收、QA Lab 对等性、实时 Matrix 和实时 Telegram。使用 `run_release_soak=true` 或 `release_profile=full` 时，还会运行详尽的实时/E2E 套件和 Docker 发布路径分块。<br />**重新运行：** `rerun_group=release-checks` 或更窄的 release-checks 句柄。 |
| 软件包工件           | **任务：** `Prepare release package artifact`<br />**子工作流：** 无<br />**证明：** 提前创建父级 `release-package-under-test` tarball，以便面向软件包的检查无需等待 `OpenClaw Release Checks` 即可运行。<br />**重新运行：** 重新运行总控流程，或为已发布软件包的重新运行提供 `release_package_spec`。                                                                 |
| 软件包 Telegram      | **任务：** `Run package Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**证明：** 在 `rerun_group=all` 且 `release_profile=full` 时，提供由父级工件支持的 Telegram 软件包证明；或在设置 `release_package_spec` 或 `npm_telegram_package_spec` 时，提供已发布软件包的 Telegram 证明。<br />**重新运行：** 使用 `release_package_spec` 或 `npm_telegram_package_spec` 运行 `rerun_group=npm-telegram`。 |
| 总控验证器           | **任务：** `Verify full validation`<br />**子工作流：** 无<br />**证明：** 重新检查已记录的子运行结论，并追加子工作流中最慢任务的表格。<br />**重新运行：** 在将失败的子项重新运行到绿色后，仅重新运行此任务。                                                                                                                                                              |

对于 `ref=main` 和 `rerun_group=all`，较新的总控流程会取代较旧的总控流程。当父流程被取消时，它的监视器会取消它已经分派的所有子工作流。默认情况下，发布分支和标签验证运行不会相互取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它会解析一次目标，并在面向软件包或 Docker 的阶段需要时准备共享的 `release-package-under-test` 工件。

| 阶段                | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 发布目标            | **任务：** `Resolve target ref`<br />**支撑工作流：** 无<br />**测试：** 选定的 ref、可选的预期 SHA、profile、rerun group，以及聚焦的 live suite filter。<br />**重新运行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                                        |
| 包构件              | **任务：** `Prepare release package artifact`<br />**支撑工作流：** 无<br />**测试：** 打包或解析一个候选 tarball，并上传 `release-package-under-test`，供下游面向包的检查使用。<br />**重新运行：** 受影响的包、跨 OS 或 live/E2E 组。                                                                                                                                                                                                                                                               |
| 安装冒烟测试        | **任务：** `Run install smoke`<br />**支撑工作流：** `Install Smoke`<br />**测试：** 完整安装路径，包括复用根 Dockerfile 冒烟镜像、QR 包安装、根和 Gateway 网关 Docker 冒烟测试、安装器 Docker 测试、Bun 全局安装 image-provider 冒烟测试，以及快速内置插件安装/卸载 E2E。<br />**重新运行：** `rerun_group=install-smoke`。                                                                                                             |
| 跨 OS               | **任务：** `cross_os_release_checks`<br />**支撑工作流：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：** 在 Linux、Windows 和 macOS 上，针对选定的提供商和模式运行全新安装与升级通道，使用候选 tarball 以及一个基线包。<br />**重新运行：** `rerun_group=cross-os`。                                                                                                                                                  |
| 仓库和 live E2E     | **任务：** `Run repo/live E2E validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 仓库 E2E、live 缓存、OpenAI websocket 流式传输、原生 live 提供商和插件分片，以及由 `release_profile` 选择的 Docker 支撑 live model/backend/gateway harness。<br />**运行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新运行：** `rerun_group=live-e2e`，可选配 `live_suite_filter`。 |
| Docker 发布路径     | **任务：** `Run Docker release-path validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 针对共享包构件运行发布路径 Docker 分块。<br />**运行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新运行：** `rerun_group=live-e2e`。                                                                                                                   |
| 包验收              | **任务：** `Run package acceptance`<br />**支撑工作流：** `Package Acceptance`<br />**测试：** 离线插件包 fixture、插件更新、mock-OpenAI Telegram 包验收，以及针对同一 tarball 的已发布升级幸存者检查。阻塞发布检查使用默认的最新已发布基线；soak 检查会扩展到 `2026.4.23` 当日或之后的每个稳定 npm 发布版本，以及已报告问题的 fixture。<br />**重新运行：** `rerun_group=package`。                          |
| QA 一致性           | **任务：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支撑工作流：** 直接任务<br />**测试：** 候选和基线 agentic 一致性包，然后生成一致性报告。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                  |
| QA live Matrix      | **任务：** `Run QA Lab live Matrix lane`<br />**支撑工作流：** 直接任务<br />**测试：** 在 `qa-live-shared` 环境中运行快速 live Matrix QA profile。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                   |
| QA live Telegram    | **任务：** `Run QA Lab live Telegram lane`<br />**支撑工作流：** 直接任务<br />**测试：** 使用 Convex CI 凭证租约运行 live Telegram QA。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                              |
| 发布验证器          | **任务：** `Verify release checks`<br />**支撑工作流：** 无<br />**测试：** 选定重新运行组所需的 release-check 任务。<br />**重新运行：** 在聚焦的子任务通过后重新运行。                                                                                                                                                                                                                                                              |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段会运行这些分块：

| 分块                                                            | 覆盖范围                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `core`                                                          | Core Docker 发布路径冒烟通道。                                                                    |
| `package-update-openai`                                         | OpenAI 包安装/更新行为、Codex 按需安装，以及 Chat Completions 工具调用。                         |
| `package-update-anthropic`                                      | Anthropic 包安装和更新行为。                                                                      |
| `package-update-core`                                           | 与提供商无关的包和更新行为。                                                                      |
| `plugins-runtime-plugins`                                       | 覆盖插件行为的插件运行时通道。                                                                    |
| `plugins-runtime-services`                                      | 服务支撑和 live 插件运行时通道；按请求包含 OpenWebUI。                                           |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 为并行发布验证拆分的插件安装/运行时批次。                                                        |

当只有一个 Docker 通道失败时，在可复用 live/E2E 工作流上使用有针对性的 `docker_lanes=<lane[,lane]>`。发布构件会包含按通道划分的重新运行命令，并在可用时带有包构件和镜像复用输入。

## 发布 profile

`release_profile` 主要控制发布检查中的 live/提供商覆盖广度。
它不会移除正常的完整 CI、Plugin Prerelease、安装冒烟测试、包验收或 QA Lab。对于 `stable`，详尽的仓库/live E2E 和 Docker 发布路径分块属于 soak 覆盖范围，并在 `run_release_soak=true` 时运行。
`full` 会强制启用 soak 覆盖，并且当 `rerun_group=all` 时，还会让 umbrella 运行针对父发布包构件的包 Telegram E2E，因此完整的预发布候选不会静默跳过该 Telegram 包通道。

| Profile   | 预期用途                          | 包含的 live/提供商覆盖范围                                                                                                                                                      |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的发布关键冒烟测试。          | OpenAI/core live 路径、OpenAI 的 Docker live 模型、原生 Gateway 网关核心、原生 OpenAI Gateway 网关 profile、原生 OpenAI 插件，以及 Docker live Gateway 网关 OpenAI。              |
| `stable`  | 默认发布批准 profile。            | `minimum` 加上 Anthropic 冒烟测试、Google、MiniMax、backend、原生 live test harness、Docker live CLI backend、Docker ACP bind、Docker Codex harness，以及一个 OpenCode Go 冒烟分片。 |
| `full`    | 广泛的 advisory 扫描。            | `stable` 加上 advisory 提供商、插件 live 分片，以及媒体 live 分片。                                                                                                                |

## 仅 full 包含的新增项

这些套件会被 `stable` 跳过，并由 `full` 包含：

| 区域                             | 仅 full 覆盖范围                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live 模型                 | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                                                                          |
| Docker live Gateway 网关         | advisory 提供商拆分为 DeepSeek/Fireworks、OpenCode Go/OpenRouter 和 xAI/Z.ai 分片。                                       |
| 原生 Gateway 网关提供商 profile  | 完整 Anthropic Opus 和 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。       |
| 原生插件 live 分片               | 插件 A-K、L-N、O-Z 其他、Moonshot 和 xAI。                                                                                 |
| 原生媒体 live 分片               | Audio、Google music、MiniMax music 和 video groups A-D。                                                                   |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和
`native-live-src-gateway-profiles-opencode-go-smoke`；`full` 改用更广泛的
Anthropic 和 OpenCode Go 模型分片。聚焦重新运行仍可使用聚合
`native-live-src-gateway-profiles-anthropic` 或
`native-live-src-gateway-profiles-opencode-go` 句柄。

## 聚焦重新运行

使用 `rerun_group` 避免重复运行无关的发布检查框：

| 句柄                | 范围                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 所有完整发布验证阶段。                                                                          |
| `ci`                | 仅手动完整 CI 子项。                                                                            |
| `plugin-prerelease` | 仅插件预发布子项。                                                                              |
| `release-checks`    | 所有 OpenClaw 发布检查阶段。                                                                    |
| `install-smoke`     | 安装冒烟测试到发布检查。                                                                        |
| `cross-os`          | 跨操作系统发布检查。                                                                            |
| `live-e2e`          | 仓库/live E2E 和 Docker 发布路径验证。                                                          |
| `package`           | 软件包验收。                                                                                    |
| `qa`                | QA 对等性加 QA live 通道。                                                                      |
| `qa-parity`         | 仅 QA 对等性通道和报告。                                                                        |
| `qa-live`           | 仅 QA live Matrix 和 Telegram。                                                                 |
| `npm-telegram`      | 已发布软件包的 Telegram E2E；需要 `release_package_spec` 或 `npm_telegram_package_spec`。        |

当某个 live 套件失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 配合使用。
有效的筛选器 ID 定义在可复用的 live/E2E 工作流中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker` 和
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 句柄是其三个提供商分片的聚合重跑句柄，因此它仍会扇出到所有 advisory Docker Gateway 网关作业。

当某个跨操作系统通道失败时，将 `cross_os_suite_filter` 与 `rerun_group=cross-os` 配合使用。筛选器接受 OS ID、套件 ID 或 OS/套件组合，例如 `windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨操作系统摘要会包含打包升级通道的各阶段耗时，长时间运行的命令会打印 Heartbeat 行，这样在作业超时前就能看到卡住的 Windows 更新。

QA 发布检查通道是 advisory。仅 QA 失败会报告为警告，不会阻塞发布检查验证器；当你需要新的 QA 证据时，重跑 `rerun_group=qa`、`qa-parity` 或 `qa-live`。

## 需要保留的证据

将 `Full Release Validation` 摘要保留为发布级索引。它链接子运行 ID，并包含最慢作业表。对于失败，先检查子工作流，然后重跑上方最小的匹配句柄。

有用的构件：

- 来自完整发布验证父项和 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径构件
- 软件包验收的 `package-under-test` 和 Docker 验收构件
- 每个 OS 和套件的跨操作系统发布检查构件
- QA 对等性、Matrix 和 Telegram 构件

## 工作流文件

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
