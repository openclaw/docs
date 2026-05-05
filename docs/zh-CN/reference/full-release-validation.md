---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版和完整版发布验证配置文件
    - 调试发布验证阶段失败
summary: 完整发布验证阶段、子工作流、发布配置文件、重新运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-05-05T01:33:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布总入口。它是发布前证明的唯一手动入口点，但大部分工作发生在子工作流中，因此失败的运行环境可以重新运行，而无需重启整个发布流程。

从受信任的工作流 ref 运行它，通常是 `main`，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流使用受信任的工作流 ref 作为执行框架，并使用输入的 `ref` 作为待测试候选版本。这样在验证较旧的发布分支或标签时，仍可使用新的验证逻辑。

默认情况下，`release_profile=stable` 会运行发布阻断通道，并跳过详尽的实时/Docker 长时间浸泡测试。在稳定版运行中传入 `run_release_soak=true` 可包含浸泡测试通道。`release_profile=full` 始终启用浸泡测试通道，因此广覆盖咨询配置不会静默丢失覆盖范围。

Package Acceptance 通常会从解析后的 `ref` 构建候选 tarball，包括通过 `pnpm ci:full-release` 分发的完整 SHA 运行。发布后，传入 `package_acceptance_package_spec=openclaw@YYYY.M.D`（或 `openclaw@beta`/`openclaw@latest`）即可改为针对已发布的 npm 包运行同一套包/更新矩阵。

## 顶层阶段

| 阶段                 | 详细信息                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目标解析             | **作业：** `Resolve target ref`<br />**子工作流：** 无<br />**证明：** 解析发布分支、标签或完整提交 SHA，并记录所选输入。<br />**重新运行：** 如果此项失败，请重新运行总入口。                                                                                                                                                                                                  |
| Vitest 和常规 CI     | **作业：** `Run normal full CI`<br />**子工作流：** `CI`<br />**证明：** 针对目标 ref 的手动完整 CI 图，包括 Linux Node 通道、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Control UI i18n，以及通过总入口运行的 Android。<br />**重新运行：** `rerun_group=ci`。 |
| 插件预发布           | **作业：** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**证明：** 仅发布时的插件静态检查、智能体式插件覆盖、完整插件批量分片，以及插件预发布 Docker 通道。<br />**重新运行：** `rerun_group=plugin-prerelease`。                                                                                                                            |
| 发布检查             | **作业：** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**证明：** 安装冒烟、跨操作系统包检查、Package Acceptance、QA Lab 一致性、实时 Matrix，以及实时 Telegram。使用 `run_release_soak=true` 或 `release_profile=full` 时，还会运行详尽的实时/E2E 套件和 Docker 发布路径分块。<br />**重新运行：** `rerun_group=release-checks` 或更窄的 release-checks 句柄。 |
| 包产物               | **作业：** `Prepare release package artifact`<br />**子工作流：** 无<br />**证明：** 足够早地创建父级 `release-package-under-test` tarball，以便面向包的检查无需等待 `OpenClaw Release Checks`。<br />**重新运行：** 重新运行总入口，或为 `rerun_group=npm-telegram` 提供 `npm_telegram_package_spec`。                                                                              |
| 包 Telegram          | **作业：** `Run package Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**证明：** 对 `rerun_group=all` 且 `release_profile=full` 的运行提供基于父级产物的 Telegram 包证明，或在设置 `npm_telegram_package_spec` 时提供已发布包的 Telegram 证明。<br />**重新运行：** 使用 `npm_telegram_package_spec` 重新运行 `rerun_group=npm-telegram`。 |
| 总入口验证器         | **作业：** `Verify full validation`<br />**子工作流：** 无<br />**证明：** 重新检查已记录的子运行结论，并追加来自子工作流的最慢作业表。<br />**重新运行：** 在重新运行失败子项并变为绿色后，只重新运行此作业。                                                                                                                                                                       |

对于 `ref=main` 和 `rerun_group=all`，较新的总入口会取代较旧的总入口。当父级被取消时，它的监视器会取消任何已分发的子工作流。发布分支和标签验证运行默认不会相互取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它只解析一次目标，并在面向包或 Docker 的阶段需要时准备一个共享的 `release-package-under-test` 产物。

| 阶段                | 详情                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 发布目标            | **任务：** `Resolve target ref`<br />**支撑工作流：** 无<br />**测试：** 选定的 ref、可选的预期 SHA、配置文件、重跑组和聚焦的 live 套件过滤器。<br />**重跑：** `rerun_group=release-checks`。                                                                                                                                                                                                                                         |
| 包制品              | **任务：** `Prepare release package artifact`<br />**支撑工作流：** 无<br />**测试：** 打包或解析一个候选 tarball，并上传 `release-package-under-test`，供下游面向包的检查使用。<br />**重跑：** 受影响的包、跨 OS 或 live/E2E 组。                                                                                                                                                                                                   |
| 安装冒烟            | **任务：** `Run install smoke`<br />**支撑工作流：** `Install Smoke`<br />**测试：** 完整安装路径，包括复用根 Dockerfile 冒烟镜像、QR 包安装、根和 Gateway 网关 Docker 冒烟、安装器 Docker 测试、Bun 全局安装镜像提供商冒烟，以及快速内置插件安装/卸载 E2E。<br />**重跑：** `rerun_group=install-smoke`。                                                                                                                         |
| 跨 OS               | **任务：** `cross_os_release_checks`<br />**支撑工作流：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：** 对选定的提供商和模式，在 Linux、Windows 和 macOS 上运行全新安装和升级通道，使用候选 tarball 以及基线包。<br />**重跑：** `rerun_group=cross-os`。                                                                                                                                                            |
| 仓库和 live E2E     | **任务：** `Run repo/live E2E validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 仓库 E2E、live 缓存、OpenAI websocket 流式传输、原生 live 提供商和插件分片，以及由 `release_profile` 选择的 Docker 后端 live 模型/后端/Gateway 网关 harness。<br />**运行：** `run_release_soak=true`、`release_profile=full` 或聚焦的 `rerun_group=live-e2e`。<br />**重跑：** `rerun_group=live-e2e`，可选附带 `live_suite_filter`。 |
| Docker 发布路径     | **任务：** `Run Docker release-path validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 针对共享包制品的发布路径 Docker 分块。<br />**运行：** `run_release_soak=true`、`release_profile=full` 或聚焦的 `rerun_group=live-e2e`。<br />**重跑：** `rerun_group=live-e2e`。                                                                                                                     |
| 包验收              | **任务：** `Run package acceptance`<br />**支撑工作流：** `Package Acceptance`<br />**测试：** 离线插件包夹具、插件更新、模拟 OpenAI Telegram 包验收，以及针对同一 tarball 的已发布升级存活检查。阻塞发布检查使用默认的最新已发布基线；浸泡检查扩展到 `2026.4.23` 或之后的每个稳定 npm 发布版本，并包含已报告问题的夹具。<br />**重跑：** `rerun_group=package`。                                                               |
| QA 对等性           | **任务：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支撑工作流：** 直接任务<br />**测试：** 候选和基线智能体式对等性包，然后生成对等性报告。<br />**重跑：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                        |
| QA live Matrix      | **任务：** `Run QA Lab live Matrix lane`<br />**支撑工作流：** 直接任务<br />**测试：** `qa-live-shared` 环境中的快速 live Matrix QA 配置文件。<br />**重跑：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                         |
| QA live Telegram    | **任务：** `Run QA Lab live Telegram lane`<br />**支撑工作流：** 直接任务<br />**测试：** 使用 Convex CI 凭证租约的 live Telegram QA。<br />**重跑：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                  |
| 发布验证器          | **任务：** `Verify release checks`<br />**支撑工作流：** 无<br />**测试：** 所选重跑组必需的发布检查任务。<br />**重跑：** 聚焦的子任务通过后重跑。                                                                                                                                                                                                                                                                                  |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段会运行这些分块：

| 分块                                                            | 覆盖范围                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 发布路径冒烟通道。                                          |
| `package-update-openai`                                         | OpenAI 包安装和更新行为。                                               |
| `package-update-anthropic`                                      | Anthropic 包安装和更新行为。                                            |
| `package-update-core`                                           | 提供商中立的包和更新行为。                                              |
| `plugins-runtime-plugins`                                       | 用于执行插件行为的插件运行时通道。                                      |
| `plugins-runtime-services`                                      | 服务支撑的插件运行时通道；请求时包含 OpenWebUI。                        |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 为并行发布验证拆分的插件安装/运行时批次。                               |

当只有一个 Docker 通道失败时，在可复用 live/E2E 工作流上使用定向 `docker_lanes=<lane[,lane]>`。发布制品包含按通道提供的重跑命令，在可用时会带有包制品和镜像复用输入。

## 发布配置文件

`release_profile` 主要控制发布检查中的 live/提供商覆盖广度。它不会移除常规完整 CI、插件预发布、安装冒烟、包验收或 QA Lab。对于 `stable`，穷尽式仓库/live E2E 和 Docker 发布路径分块是浸泡覆盖，并在 `run_release_soak=true` 时运行。`full` 会强制开启浸泡覆盖，并且在 `rerun_group=all` 时还会让总括运行针对父发布包制品执行包 Telegram E2E，因此完整的预发布候选不会静默跳过该 Telegram 包通道。

| 配置文件  | 预期用途                          | 包含的 live/提供商覆盖范围                                                                                                                                                         |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的发布关键冒烟。              | OpenAI/核心 live 路径、用于 OpenAI 的 Docker live 模型、原生 Gateway 网关核心、原生 OpenAI Gateway 网关配置文件、原生 OpenAI 插件，以及 Docker live Gateway 网关 OpenAI。          |
| `stable`  | 默认发布批准配置文件。            | `minimum` 加 Anthropic 冒烟、Google、MiniMax、后端、原生 live 测试 harness、Docker live CLI 后端、Docker ACP 绑定、Docker Codex harness，以及一个 OpenCode Go 冒烟分片。           |
| `full`    | 广泛的 advisory 扫描。            | `stable` 加 advisory 提供商、插件 live 分片和媒体 live 分片。                                                                                                                      |

## 仅 full 添加项

这些套件会被 `stable` 跳过，并由 `full` 包含：

| 领域                             | 仅 full 覆盖范围                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live 模型                 | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                                                                           |
| Docker live Gateway 网关         | advisory 提供商拆分为 DeepSeek/Fireworks、OpenCode Go/OpenRouter 和 xAI/Z.ai 分片。                                         |
| 原生 Gateway 网关提供商配置文件  | 完整 Anthropic Opus 和 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。          |
| 原生插件 live 分片               | 插件 A-K、L-N、O-Z 其他、Moonshot 和 xAI。                                                                                  |
| 原生媒体 live 分片               | 音频、Google 音乐、MiniMax 音乐和视频组 A-D。                                                                               |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和 `native-live-src-gateway-profiles-opencode-go-smoke`；`full` 改用更广的 Anthropic 和 OpenCode Go 模型分片。聚焦重跑仍可使用聚合的 `native-live-src-gateway-profiles-anthropic` 或 `native-live-src-gateway-profiles-opencode-go` 句柄。

## 聚焦重跑

使用 `rerun_group` 避免重复运行无关的发布机器：

| 句柄                | 范围                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | 所有完整发布验证阶段。                                                |
| `ci`                | 仅手动完整 CI 子项。                                                  |
| `plugin-prerelease` | 仅插件预发布子项。                                                    |
| `release-checks`    | 所有 OpenClaw 发布检查阶段。                                          |
| `install-smoke`     | 从安装冒烟到发布检查。                                                |
| `cross-os`          | 跨操作系统发布检查。                                                  |
| `live-e2e`          | 仓库/实时 E2E 和 Docker 发布路径验证。                                |
| `package`           | 包验收。                                                              |
| `qa`                | QA 对等性以及 QA 实时通道。                                           |
| `qa-parity`         | 仅 QA 对等性通道和报告。                                              |
| `qa-live`           | 仅 QA 实时 Matrix 和 Telegram。                                       |
| `npm-telegram`      | 已发布包的 Telegram E2E；需要 `npm_telegram_package_spec`。           |

当一个实时套件失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 一起使用。
有效的过滤器 ID 定义在可复用的实时/E2E 工作流中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`，以及
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 句柄是其三个提供商分片的聚合重跑句柄，
因此它仍会展开到所有 advisory Docker Gateway 网关作业。

当一个跨操作系统通道失败时，将 `cross_os_suite_filter` 与 `rerun_group=cross-os` 一起使用。该过滤器接受操作系统 ID、套件 ID，或操作系统/套件对，例如 `windows/packaged-upgrade`、`windows`，或 `packaged-fresh`。跨操作系统摘要包含打包升级通道的各阶段耗时，长时间运行的命令会打印 heartbeat 行，因此卡住的 Windows 更新会在作业超时前可见。

QA 发布检查通道是参考性的。仅 QA 失败会报告为警告，不会阻塞发布检查验证器；当你需要新的 QA 证据时，重跑 `rerun_group=qa`、`qa-parity` 或 `qa-live`。

## 要保留的证据

保留 `Full Release Validation` 摘要作为发布级索引。它链接子运行 ID，并包含最慢作业表。对于失败项，先检查子工作流，然后重跑上面最小匹配的句柄。

有用的构件：

- 来自完整发布验证父项和 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径构件
- 包验收 `package-under-test` 和 Docker 验收构件
- 每个操作系统和套件的跨操作系统发布检查构件
- QA 对等性、Matrix 和 Telegram 构件

## 工作流文件

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
