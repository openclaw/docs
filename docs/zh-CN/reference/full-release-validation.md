---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版和完整版发布验证配置方案
    - 调试发布验证阶段失败
summary: 完整发布验证阶段、子工作流、发布配置文件、重新运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-05-03T11:28:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5ebe41b7f1fdd019bf7d4adc64648e7aa7ff1691314bc19ba78008e9e6858f2
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布总控流程。它是发布前验证的唯一手动入口点，但大多数工作会在子工作流中完成，因此失败的验证任务可以重新运行，而不必重启整个发布流程。

请从受信任的工作流 ref 运行它，通常是 `main`，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流使用受信任的工作流 ref 作为执行框架，并使用输入的 `ref` 作为被测候选版本。这样在验证较旧的发布分支或标签时，也能使用新的验证逻辑。

Package Acceptance 通常会从解析后的 `ref` 构建候选 tarball，包括通过 `pnpm ci:full-release` 分派的完整 SHA 运行。发布后，传入 `package_acceptance_package_spec=openclaw@YYYY.M.D`（或 `openclaw@beta`/`openclaw@latest`），即可改为针对已发布的 npm 包运行相同的包/更新矩阵。

## 顶层阶段

| 阶段                 | 详情                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 目标解析             | **任务：** `Resolve target ref`<br />**子工作流：** 无<br />**证明：** 解析发布分支、标签或完整提交 SHA，并记录选定输入。<br />**重新运行：** 如果此项失败，重新运行总控流程。                                                                                                                                             |
| Vitest 和常规 CI     | **任务：** `Run normal full CI`<br />**子工作流：** `CI`<br />**证明：** 针对目标 ref 的手动完整 CI 图，包括 Linux Node 通道、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Control UI i18n，以及通过总控流程运行的 Android。<br />**重新运行：** `rerun_group=ci`。 |
| 插件预发布           | **任务：** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**证明：** 仅发布时运行的插件静态检查、智能体化插件覆盖、完整插件批次分片，以及插件预发布 Docker 通道。<br />**重新运行：** `rerun_group=plugin-prerelease`。                                                                     |
| 发布检查             | **任务：** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**证明：** 安装冒烟、跨 OS 包检查、live/E2E 套件、Docker 发布路径分块、Package Acceptance、QA Lab parity、live Matrix 和 live Telegram。<br />**重新运行：** `rerun_group=release-checks` 或更窄的 release-checks 句柄。      |
| 包产物               | **任务：** `Prepare release package artifact`<br />**子工作流：** 无<br />**证明：** 提前创建父级 `release-package-under-test` tarball，使不需要等待 `OpenClaw Release Checks` 的面向包检查可以使用。<br />**重新运行：** 重新运行总控流程，或为 `rerun_group=npm-telegram` 提供 `npm_telegram_package_spec`。                 |
| 包 Telegram          | **任务：** `Run package Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**证明：** 在 `rerun_group=all` 且 `release_profile=full` 时，提供基于父级产物的 Telegram 包验证；或在设置 `npm_telegram_package_spec` 时，提供已发布包的 Telegram 验证。<br />**重新运行：** 使用 `npm_telegram_package_spec` 运行 `rerun_group=npm-telegram`。 |
| 总控验证器           | **任务：** `Verify full validation`<br />**子工作流：** 无<br />**证明：** 重新检查已记录的子运行结论，并追加来自子工作流的最慢任务表。<br />**重新运行：** 在重新运行失败的子流程并转绿后，只重新运行此任务。                                                                                                                   |

对于 `ref=main` 和 `rerun_group=all`，较新的总控流程会取代较旧的总控流程。当父流程被取消时，它的监控器会取消所有已分派的子工作流。默认情况下，发布分支和标签验证运行不会相互取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它会解析一次目标，并在面向包或 Docker 的阶段需要时准备共享的 `release-package-under-test` 产物。

| 阶段                | 详情                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 发布目标            | **任务：** `Resolve target ref`<br />**支撑工作流：** 无<br />**测试：** 选定的 ref、可选的预期 SHA、配置文件、重新运行组，以及聚焦的 live 套件过滤器。<br />**重新运行：** `rerun_group=release-checks`。                                                                                                                  |
| 包产物              | **任务：** `Prepare release package artifact`<br />**支撑工作流：** 无<br />**测试：** 打包或解析一个候选 tarball，并上传 `release-package-under-test`，供下游面向包的检查使用。<br />**重新运行：** 受影响的包、跨 OS 或 live/E2E 组。                                                                                       |
| 安装冒烟            | **任务：** `Run install smoke`<br />**支撑工作流：** `Install Smoke`<br />**测试：** 完整安装路径，包括复用根 Dockerfile 冒烟镜像、QR 包安装、根和 Gateway 网关 Docker 冒烟、安装器 Docker 测试、Bun 全局安装 image-provider 冒烟，以及快速内置插件安装/卸载 E2E。<br />**重新运行：** `rerun_group=install-smoke`。        |
| 跨 OS               | **任务：** `cross_os_release_checks`<br />**支撑工作流：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：** 在 Linux、Windows 和 macOS 上，针对选定提供商和模式运行全新安装和升级通道，使用候选 tarball 加基线包。<br />**重新运行：** `rerun_group=cross-os`。                                                   |
| 仓库和 live E2E     | **任务：** `Run repo/live E2E validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 仓库 E2E、live 缓存、OpenAI websocket 流式传输、原生 live 提供商和插件分片，以及由 `release_profile` 选择的 Docker 支撑 live 模型/后端/Gateway 网关执行框架。<br />**重新运行：** `rerun_group=live-e2e`，可选配 `live_suite_filter`。 |
| Docker 发布路径     | **任务：** `Run Docker release-path validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 针对共享包产物运行发布路径 Docker 分块。<br />**重新运行：** `rerun_group=live-e2e`。                                                                                                           |
| Package Acceptance  | **任务：** `Run package acceptance`<br />**支撑工作流：** `Package Acceptance`<br />**测试：** 离线插件包夹具、插件更新、mock-OpenAI Telegram 包验收，以及从 `2026.4.23` 或之后每个稳定 npm 发布版本到同一个 tarball 的已发布升级存活检查。<br />**重新运行：** `rerun_group=package`。                                      |
| QA parity           | **任务：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支撑工作流：** 直接任务<br />**测试：** 候选版本和基线的智能体化 parity 包，然后生成 parity 报告。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                 |
| QA live Matrix      | **任务：** `Run QA Lab live Matrix lane`<br />**支撑工作流：** 直接任务<br />**测试：** 在 `qa-live-shared` 环境中运行快速 live Matrix QA 配置。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                              |
| QA live Telegram    | **任务：** `Run QA Lab live Telegram lane`<br />**支撑工作流：** 直接任务<br />**测试：** 使用 Convex CI 凭证租约运行 live Telegram QA。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                      |
| 发布验证器          | **任务：** `Verify release checks`<br />**支撑工作流：** 无<br />**测试：** 针对选定重新运行组所需的发布检查任务。<br />**重新运行：** 在聚焦的子任务通过后重新运行。                                                                                                                                                         |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段会运行这些分块：

| 分块                                                            | 覆盖范围                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core Docker 发布路径冒烟通道。                                          |
| `package-update-openai`                                         | OpenAI 包安装和更新行为。                                               |
| `package-update-anthropic`                                      | Anthropic 包安装和更新行为。                                            |
| `package-update-core`                                           | 提供商中立的包和更新行为。                                              |
| `plugins-runtime-plugins`                                       | 执行插件行为的插件运行时通道。                                          |
| `plugins-runtime-services`                                      | 服务支撑的插件运行时通道；按请求包含 OpenWebUI。                        |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 为并行发布验证而拆分的插件安装/运行时批次。                             |

在可复用的 live/E2E 工作流中，当只有一个 Docker lane 失败时，使用有针对性的 `docker_lanes=<lane[,lane]>`。发布工件会在可用时包含每个 lane 的重跑命令，并带有 package artifact 和 image reuse 输入。

## 发布配置文件

`release_profile` 主要控制发布检查中的 live/provider 覆盖范围。它不会移除正常的完整 CI、插件预发布、安装冒烟测试、package acceptance、QA Lab 或 Docker release-path 分块。`full` 还会在 `rerun_group=all` 时，让总控运行针对父级 release package artifact 的 package Telegram E2E，因此完整的预发布候选不会静默跳过该 Telegram package lane。

| 配置文件  | 预期用途                          | 包含的 live/provider 覆盖范围                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的发布关键冒烟测试。   | OpenAI/core live 路径、OpenAI 的 Docker live 模型、原生 Gateway 网关 core、原生 OpenAI Gateway 网关配置文件、原生 OpenAI 插件，以及 Docker live Gateway 网关 OpenAI。                     |
| `stable`  | 默认发布审批配置文件。 | `minimum` 加上 Anthropic 冒烟测试、Google、MiniMax、backend、原生 live 测试 harness、Docker live CLI backend、Docker ACP bind、Docker Codex harness，以及一个 OpenCode Go 冒烟 shard。 |
| `full`    | 广泛的 advisory sweep。             | `stable` 加上 advisory providers、插件 live shards 和 media live shards。                                                                                                        |

## 仅 full 包含的附加项

这些套件会被 `stable` 跳过，并由 `full` 包含：

| 区域                             | 仅 full 覆盖范围                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live models               | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                                                                          |
| Docker live gateway              | DeepSeek、Fireworks、OpenCode Go、OpenRouter、xAI 和 Z.ai 的 advisory shard。                                             |
| 原生 Gateway 网关 provider 配置文件 | 完整 Anthropic Opus 和 Sonnet/Haiku shards、Fireworks、DeepSeek、完整 OpenCode Go model shards、OpenRouter、xAI 和 Z.ai。 |
| 原生插件 live shards        | Plugins A-K、L-N、O-Z other、Moonshot 和 xAI。                                                                             |
| 原生 media live shards         | Audio、Google music、MiniMax music 和 video groups A-D。                                                                   |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和 `native-live-src-gateway-profiles-opencode-go-smoke`；`full` 则使用更广泛的 Anthropic 和 OpenCode Go model shards。定向重跑仍可使用聚合的 `native-live-src-gateway-profiles-anthropic` 或 `native-live-src-gateway-profiles-opencode-go` 句柄。

## 定向重跑

使用 `rerun_group` 避免重复运行无关的发布 boxes：

| 句柄              | 范围                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | 所有完整发布验证阶段。                                   |
| `ci`                | 仅手动完整 CI 子项。                                            |
| `plugin-prerelease` | 仅插件预发布子项。                                         |
| `release-checks`    | 所有 OpenClaw 发布检查阶段。                                   |
| `install-smoke`     | 安装冒烟测试到发布检查。                                 |
| `cross-os`          | 跨操作系统发布检查。                                              |
| `live-e2e`          | Repo/live E2E 和 Docker release-path 验证。                     |
| `package`           | Package Acceptance。                                                   |
| `qa`                | QA parity 加 QA live lanes。                                         |
| `qa-parity`         | 仅 QA parity lanes 和报告。                                      |
| `qa-live`           | 仅 QA live Matrix 和 Telegram。                                     |
| `npm-telegram`      | 已发布 package Telegram E2E；需要 `npm_telegram_package_spec`。 |

当一个 live suite 失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 配合使用。有效的 filter ids 定义在可复用 live/E2E 工作流中，包括 `docker-live-models`、`live-gateway-docker`、`live-gateway-anthropic-docker`、`live-gateway-google-docker`、`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、`live-cli-backend-docker`、`live-acp-bind-docker` 和 `live-codex-harness-docker`。

## 要保留的证据

保留 `Full Release Validation` 摘要作为发布级索引。它会链接子运行 id，并包含最慢作业表。对于失败项，先检查子工作流，然后重跑上方匹配范围最小的句柄。

有用的工件：

- 来自 Full Release Validation 父项和 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker release-path 工件
- Package Acceptance `package-under-test` 和 Docker acceptance 工件
- 每个 OS 和套件的 Cross-OS release-check 工件
- QA parity、Matrix 和 Telegram 工件

## 工作流文件

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
