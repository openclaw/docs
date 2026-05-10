---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版和完整版发布验证配置文件
    - 排查发布验证阶段失败
summary: 完整发布验证的阶段、子工作流、发布配置档、重新运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-05-10T19:47:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a479b2d79ae2710c501d583ad14f913a32382bba8dfd7ec9d25124357743e20
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布总控流程。它是发布前验证证据的唯一手动入口，但大多数工作都在子工作流中完成，因此某个执行环境失败后可以重新运行，而无需重启整个发布流程。

请从可信的工作流引用运行它，通常是 `main`，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流使用可信工作流引用作为测试框架，并使用输入 `ref` 作为被测候选版本。这样在验证较旧的发布分支或标签时，也可以使用新的验证逻辑。

默认情况下，`release_profile=stable` 会运行发布阻断型通道，并跳过详尽的实时/Docker soak。传入 `run_release_soak=true` 可在稳定版运行中包含 soak 通道。`release_profile=full` 始终启用 soak 通道，因此广泛的建议性配置不会静默丢失覆盖范围。

包验收通常会从解析后的 `ref` 构建候选 tarball，包括通过 `pnpm ci:full-release` 分发的完整 SHA 运行。发布后，传入 `package_acceptance_package_spec=openclaw@YYYY.M.D`（或 `openclaw@beta`/`openclaw@latest`）即可改为针对已发布的 npm 包运行相同的包/更新矩阵。

## 顶层阶段

| 阶段                | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目标解析    | **作业：** `Resolve target ref`<br />**子工作流：** 无<br />**证明：** 解析发布分支、标签或完整提交 SHA，并记录选定输入。<br />**重新运行：** 如果此阶段失败，重新运行总控流程。                                                                                                                                                                                                                               |
| Vitest 和常规 CI | **作业：** `Run normal full CI`<br />**子工作流：** `CI`<br />**证明：** 针对目标 ref 的手动完整 CI 图，包括 Linux Node 通道、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python 技能、Windows、macOS、Control UI i18n，以及通过总控流程运行的 Android。<br />**重新运行：** `rerun_group=ci`。                                                  |
| 插件预发布    | **作业：** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**证明：** 仅发布时运行的插件静态检查、智能体式插件覆盖、完整扩展批处理分片，以及插件预发布 Docker 通道。<br />**重新运行：** `rerun_group=plugin-prerelease`。                                                                                                                                                        |
| 发布检查       | **作业：** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**证明：** 安装冒烟测试、跨操作系统包检查、包验收、QA Lab 一致性、实时 Matrix 和实时 Telegram。使用 `run_release_soak=true` 或 `release_profile=full` 时，还会运行详尽的实时/E2E 套件和 Docker 发布路径分块。<br />**重新运行：** `rerun_group=release-checks` 或更窄的发布检查句柄。 |
| 包制品     | **作业：** `Prepare release package artifact`<br />**子工作流：** 无<br />**证明：** 提前创建父级 `release-package-under-test` tarball，以供不需要等待 `OpenClaw Release Checks` 的面向包的检查使用。<br />**重新运行：** 重新运行总控流程，或为 `rerun_group=npm-telegram` 提供 `npm_telegram_package_spec`。                                                                                    |
| 包 Telegram     | **作业：** `Run package Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**证明：** 在 `rerun_group=all` 且 `release_profile=full` 时，提供由父级制品支持的 Telegram 包证明；设置 `npm_telegram_package_spec` 时，则提供已发布包的 Telegram 证明。<br />**重新运行：** 使用 `npm_telegram_package_spec` 运行 `rerun_group=npm-telegram`。                                                                               |
| 总控验证器    | **作业：** `Verify full validation`<br />**子工作流：** 无<br />**证明：** 重新检查已记录的子运行结论，并从子工作流追加最慢作业表。<br />**重新运行：** 在将失败的子工作流重新运行至通过后，仅重新运行此作业。                                                                                                                                                                                    |

对于 `ref=main` 和 `rerun_group=all`，较新的总控流程会取代较旧的总控流程。当父级被取消时，它的监控器会取消它已经分发的任何子工作流。发布分支和标签验证运行默认不会相互取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它只解析一次目标，并在面向包或 Docker 的阶段需要时准备共享的 `release-package-under-test` 制品。

| 阶段                | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 发布目标            | **任务：** `Resolve target ref`<br />**支撑工作流：** 无<br />**测试：** 选定 ref、可选的预期 SHA、配置文件、重新运行组，以及聚焦的 live 套件筛选器。<br />**重新运行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                              |
| 包构件              | **任务：** `Prepare release package artifact`<br />**支撑工作流：** 无<br />**测试：** 打包或解析一个候选 tarball，并上传 `release-package-under-test` 供下游面向包的检查使用。<br />**重新运行：** 受影响的包、跨 OS 或 live/E2E 组。                                                                                                                                                                                                              |
| 安装冒烟            | **任务：** `Run install smoke`<br />**支撑工作流：** `Install Smoke`<br />**测试：** 完整安装路径，复用根 Dockerfile 冒烟镜像、QR 包安装、根和 Gateway 网关 Docker 冒烟、安装器 Docker 测试、Bun 全局安装 image-provider 冒烟，以及快速内置插件安装/卸载 E2E。<br />**重新运行：** `rerun_group=install-smoke`。                                                                                                                                 |
| 跨 OS               | **任务：** `cross_os_release_checks`<br />**支撑工作流：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：** 针对选定的提供商和模式，在 Linux、Windows 和 macOS 上运行全新安装和升级通道，使用候选 tarball 加一个基线包。<br />**重新运行：** `rerun_group=cross-os`。                                                                                                                                                                                  |
| 仓库和 live E2E     | **任务：** `Run repo/live E2E validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 仓库 E2E、live 缓存、OpenAI websocket 流式传输、原生 live 提供商和插件分片，以及由 `release_profile` 选择的 Docker 支撑 live 模型/后端/Gateway 网关 harness。<br />**运行条件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新运行：** `rerun_group=live-e2e`，可选附带 `live_suite_filter`。 |
| Docker 发布路径     | **任务：** `Run Docker release-path validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 针对共享包构件的发布路径 Docker 分块。<br />**运行条件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新运行：** `rerun_group=live-e2e`。                                                                                                                                                      |
| 包验收              | **任务：** `Run package acceptance`<br />**支撑工作流：** `Package Acceptance`<br />**测试：** 离线插件包夹具、插件更新、模拟 OpenAI Telegram 包验收，以及针对同一个 tarball 的已发布升级存活检查。阻塞式发布检查使用默认最新已发布基线；soak 检查会扩展到 `2026.4.23` 或之后的每个稳定 npm 发布版本，并加上已报告问题的夹具。<br />**重新运行：** `rerun_group=package`。                          |
| QA parity           | **任务：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支撑工作流：** 直接任务<br />**测试：** 候选版和基线 agentic parity 包，然后生成 parity 报告。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                          |
| QA live Matrix      | **任务：** `Run QA Lab live Matrix lane`<br />**支撑工作流：** 直接任务<br />**测试：** `qa-live-shared` 环境中的快速 live Matrix QA 配置文件。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                           |
| QA live Telegram    | **任务：** `Run QA Lab live Telegram lane`<br />**支撑工作流：** 直接任务<br />**测试：** 使用 Convex CI 凭证租约的 live Telegram QA。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                       |
| 发布验证器          | **任务：** `Verify release checks`<br />**支撑工作流：** 无<br />**测试：** 选定重新运行组所需的发布检查任务。<br />**重新运行：** 在聚焦的子任务通过后重新运行。                                                                                                                                                                                                                                                                                                    |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段会运行这些分块：

| 分块                                                            | 覆盖范围                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `core`                                                          | Core Docker 发布路径冒烟通道。                                            |
| `package-update-openai`                                         | OpenAI 包安装/更新行为，包括 Codex 按需安装。       |
| `package-update-anthropic`                                      | Anthropic 包安装和更新行为。                                   |
| `package-update-core`                                           | 提供商中立的包和更新行为。                                    |
| `plugins-runtime-plugins`                                       | 演练插件行为的插件运行时通道。                              |
| `plugins-runtime-services`                                      | 服务支撑和 live 插件运行时通道；在请求时包括 OpenWebUI。 |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 为并行发布验证拆分的插件安装/运行时批次。            |

当只有一个 Docker 通道失败时，请在可复用 live/E2E 工作流上使用定向的 `docker_lanes=<lane[,lane]>`。发布构件会在可用时包含按通道的重新运行命令，并带有包构件和镜像复用输入。

## 发布配置文件

`release_profile` 主要控制发布检查中的 live/提供商覆盖广度。它不会移除正常的完整 CI、Plugin Prerelease、安装冒烟、包验收或 QA Lab。对于 `stable`，详尽的仓库/live E2E 和 Docker 发布路径分块属于 soak 覆盖，并在 `run_release_soak=true` 时运行。`full` 会强制开启 soak 覆盖，并且在 `rerun_group=all` 时，还会让 umbrella 运行针对父发布包构件的包 Telegram E2E，因此完整的预发布候选不会静默跳过该 Telegram 包通道。

| 配置文件  | 预期用途                          | 包含的 live/提供商覆盖范围                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的发布关键冒烟。   | OpenAI/core live 路径、OpenAI 的 Docker live 模型、原生 Gateway 网关 core、原生 OpenAI Gateway 网关配置文件、原生 OpenAI 插件，以及 Docker live Gateway 网关 OpenAI。                     |
| `stable`  | 默认发布审批配置文件。 | `minimum` 加上 Anthropic 冒烟、Google、MiniMax、后端、原生 live 测试 harness、Docker live CLI 后端、Docker ACP bind、Docker Codex harness，以及一个 OpenCode Go 冒烟分片。 |
| `full`    | 广泛的 advisory sweep。             | `stable` 加上 advisory providers、插件 live 分片和媒体 live 分片。                                                                                                        |

## 仅 full 附加项

这些套件会被 `stable` 跳过，并由 `full` 包含：

| 区域                             | 仅 full 覆盖范围                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live 模型                 | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                                                                          |
| Docker live Gateway 网关         | advisory providers，拆分为 DeepSeek/Fireworks、OpenCode Go/OpenRouter 和 xAI/Z.ai 分片。                              |
| 原生 Gateway 网关提供商配置文件  | 完整 Anthropic Opus 和 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。 |
| 原生插件 live 分片               | 插件 A-K、L-N、O-Z 其他、Moonshot 和 xAI。                                                                             |
| 原生媒体 live 分片               | Audio、Google music、MiniMax music，以及 video groups A-D。                                                                   |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和 `native-live-src-gateway-profiles-opencode-go-smoke`；`full` 则使用更广的 Anthropic 和 OpenCode Go 模型分片。聚焦重新运行仍可使用聚合的 `native-live-src-gateway-profiles-anthropic` 或 `native-live-src-gateway-profiles-opencode-go` 句柄。

## 聚焦重新运行

使用 `rerun_group` 避免重复运行无关的发布 boxes：

| 句柄              | 范围                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | 所有完整发布验证阶段。                                   |
| `ci`                | 仅手动完整 CI 子项。                                            |
| `plugin-prerelease` | 仅插件预发布子项。                                         |
| `release-checks`    | 所有 OpenClaw 发布检查阶段。                                   |
| `install-smoke`     | 安装冒烟测试到发布检查。                                 |
| `cross-os`          | 跨 OS 发布检查。                                              |
| `live-e2e`          | 仓库/实时 E2E 和 Docker 发布路径验证。                     |
| `package`           | 包验收。                                                   |
| `qa`                | QA 对等性加 QA 实时通道。                                         |
| `qa-parity`         | 仅 QA 对等性通道和报告。                                      |
| `qa-live`           | 仅 QA 实时 Matrix 和 Telegram。                                     |
| `npm-telegram`      | 已发布包的 Telegram E2E；需要 `npm_telegram_package_spec`。 |

当某个实时套件失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 一起使用。
有效的筛选器 ID 在可复用的实时/E2E 工作流中定义，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker` 和
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 句柄是其三个提供商分片的聚合重运行句柄，因此它仍会扇出到所有 advisory Docker Gateway 网关作业。

当某个跨 OS 通道失败时，将 `cross_os_suite_filter` 与 `rerun_group=cross-os` 一起使用。该筛选器接受 OS ID、套件 ID 或 OS/套件组合，例如 `windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨 OS 摘要包含打包升级通道的逐阶段耗时，长时间运行的命令会打印 heartbeat 行，因此在作业超时之前就能看到卡住的 Windows 更新。

QA 发布检查通道是建议性的。仅 QA 失败会报告为警告，不会阻塞发布检查验证器；当你需要新的 QA 证据时，重运行 `rerun_group=qa`、`qa-parity` 或 `qa-live`。

## 要保留的证据

将 `Full Release Validation` 摘要保留为发布级索引。它链接子运行 ID，并包含最慢作业表。对于失败，先检查子工作流，然后重运行上面最小的匹配句柄。

有用的构件：

- 来自完整发布验证父级和 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径构件
- 包验收 `package-under-test` 和 Docker 验收构件
- 每个 OS 和套件的跨 OS 发布检查构件
- QA 对等性、Matrix 和 Telegram 构件

## 工作流文件

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
