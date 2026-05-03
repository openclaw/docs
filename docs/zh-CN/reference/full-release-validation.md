---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版和完整发布验证配置文件
    - 调试发布验证阶段失败
summary: 完整发布验证的阶段、子工作流、发布配置、重新运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-05-03T12:05:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布总控流程。它是发布前验证的唯一手动入口点，但大多数工作都在子工作流中进行，因此失败的运行环境可以重新运行，而无需重新启动整个发布流程。

从受信任的工作流 ref 运行它，通常是 `main`，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流使用受信任的工作流 ref 作为 harness，并使用输入的 `ref` 作为待测候选版本。这样在验证较旧的发布分支或标签时，也能使用新的验证逻辑。

包验收通常会从解析后的 `ref` 构建候选 tarball，包括使用 `pnpm ci:full-release` 分发的完整 SHA 运行。发布后，传入 `package_acceptance_package_spec=openclaw@YYYY.M.D`（或 `openclaw@beta`/`openclaw@latest`），即可改为针对已发布的 npm 包运行相同的包/更新矩阵。

## 顶层阶段

| 阶段                 | 详情                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目标解析             | **作业：** `Resolve target ref`<br />**子工作流：** 无<br />**证明：** 解析发布分支、标签或完整提交 SHA，并记录选定输入。<br />**重新运行：** 如果此处失败，请重新运行总控流程。                                                                                                                                                                                                                 |
| Vitest 和常规 CI     | **作业：** `Run normal full CI`<br />**子工作流：** `CI`<br />**证明：** 针对目标 ref 运行手动完整 CI 图，包括 Linux Node lanes、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python skills、Windows、macOS、Control UI i18n，以及通过总控流程运行的 Android。<br />**重新运行：** `rerun_group=ci`。 |
| 插件预发布           | **作业：** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**证明：** 仅发布时运行的插件静态检查、agentic 插件覆盖、完整扩展批量分片，以及插件预发布 Docker lanes。<br />**重新运行：** `rerun_group=plugin-prerelease`。                                                                                                                                          |
| 发布检查             | **作业：** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**证明：** 安装 smoke、跨操作系统包检查、live/E2E 套件、Docker 发布路径分块、包验收、QA Lab parity、live Matrix 和 live Telegram。<br />**重新运行：** `rerun_group=release-checks` 或更窄的 release-checks 句柄。                       |
| 包产物               | **作业：** `Prepare release package artifact`<br />**子工作流：** 无<br />**证明：** 足够早地创建父级 `release-package-under-test` tarball，以供不需要等待 `OpenClaw Release Checks` 的面向包的检查使用。<br />**重新运行：** 重新运行总控流程，或为 `rerun_group=npm-telegram` 提供 `npm_telegram_package_spec`。                    |
| Package Telegram     | **作业：** `Run package Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**证明：** 在 `rerun_group=all` 且 `release_profile=full` 时，提供由父级产物支持的 Telegram 包验证；或在设置 `npm_telegram_package_spec` 时，提供已发布包的 Telegram 验证。<br />**重新运行：** 使用 `npm_telegram_package_spec` 运行 `rerun_group=npm-telegram`。 |
| 总控验证器           | **作业：** `Verify full validation`<br />**子工作流：** 无<br />**证明：** 重新检查已记录的子运行结论，并追加来自子工作流的最慢作业表。<br />**重新运行：** 在重新运行失败的子流程并转绿后，只重新运行此作业。                                                                                                                                                                                   |

对于 `ref=main` 和 `rerun_group=all`，较新的总控流程会取代较旧的总控流程。当父流程被取消时，它的监视器会取消任何已经分发的子工作流。发布分支和标签验证运行默认不会互相取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它只解析一次目标，并在面向包或 Docker 的阶段需要时准备共享的 `release-package-under-test` 产物。

| 阶段                | 详情                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 发布目标            | **作业：** `Resolve target ref`<br />**支撑工作流：** 无<br />**测试：** 选定的 ref、可选的预期 SHA、profile、重新运行组，以及聚焦的 live 套件过滤器。<br />**重新运行：** `rerun_group=release-checks`。                                                                                                                                                                                      |
| 包产物              | **作业：** `Prepare release package artifact`<br />**支撑工作流：** 无<br />**测试：** 打包或解析一个候选 tarball，并上传 `release-package-under-test` 供下游面向包的检查使用。<br />**重新运行：** 受影响的包、跨操作系统或 live/E2E 组。                                                                                                                                                    |
| 安装 smoke          | **作业：** `Run install smoke`<br />**支撑工作流：** `Install Smoke`<br />**测试：** 完整安装路径，包括根 Dockerfile smoke 镜像复用、QR 包安装、根和 Gateway 网关 Docker smokes、安装器 Docker 测试、Bun 全局安装 image-provider smoke，以及快速的内置插件安装/卸载 E2E。<br />**重新运行：** `rerun_group=install-smoke`。                                                               |
| 跨操作系统          | **作业：** `cross_os_release_checks`<br />**支撑工作流：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：** 使用候选 tarball 加基线包，针对选定的提供商和模式，在 Linux、Windows 和 macOS 上运行全新安装与升级 lanes。<br />**重新运行：** `rerun_group=cross-os`。                                                                                                            |
| 仓库和 live E2E     | **作业：** `Run repo/live E2E validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 仓库 E2E、live cache、OpenAI websocket streaming、原生 live 提供商和插件分片，以及由 `release_profile` 选择的 Docker 支持 live model/backend/gateway harnesses。<br />**重新运行：** `rerun_group=live-e2e`，可选搭配 `live_suite_filter`。 |
| Docker 发布路径     | **作业：** `Run Docker release-path validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 针对共享包产物运行 release-path Docker 分块。<br />**重新运行：** `rerun_group=live-e2e`。                                                                                                                                                                      |
| 包验收              | **作业：** `Run package acceptance`<br />**支撑工作流：** `Package Acceptance`<br />**测试：** 离线插件包 fixture、插件更新、mock-OpenAI Telegram 包验收，以及从 `2026.4.23` 或之后每个稳定 npm 发布版本到同一 tarball 的已发布升级 survivor 检查。<br />**重新运行：** `rerun_group=package`。                                                                                              |
| QA parity           | **作业：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支撑工作流：** 直接作业<br />**测试：** 候选版本和基线 agentic parity packs，然后运行 parity 报告。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                 |
| QA live Matrix      | **作业：** `Run QA Lab live Matrix lane`<br />**支撑工作流：** 直接作业<br />**测试：** 在 `qa-live-shared` 环境中运行快速 live Matrix QA profile。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                           |
| QA live Telegram    | **作业：** `Run QA Lab live Telegram lane`<br />**支撑工作流：** 直接作业<br />**测试：** 使用 Convex CI 凭证租约运行 live Telegram QA。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                        |
| 发布验证器          | **作业：** `Verify release checks`<br />**支撑工作流：** 无<br />**测试：** 选定重新运行组所需的 release-check 作业。<br />**重新运行：** 在聚焦的子作业通过后重新运行。                                                                                                                                                                                                                       |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段会运行这些分块：

| 分块                                                            | 覆盖范围                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `core`                                                          | Core Docker 发布路径 smoke lanes。                                       |
| `package-update-openai`                                         | OpenAI 包安装和更新行为。                                                |
| `package-update-anthropic`                                      | Anthropic 包安装和更新行为。                                             |
| `package-update-core`                                           | 提供商无关的包和更新行为。                                               |
| `plugins-runtime-plugins`                                       | 覆盖插件行为的插件运行时 lanes。                                         |
| `plugins-runtime-services`                                      | 由服务支持的插件运行时 lanes；按需包含 OpenWebUI。                       |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 为并行发布验证而拆分的插件安装/运行时批次。                              |

使用可复用 live/E2E 工作流上的目标 `docker_lanes=<lane[,lane]>`，当且仅当一个 Docker lane 失败时。发布产物会在可用时包含每个 lane 的重跑命令，并带有包产物和镜像复用输入。

## 发布配置档

`release_profile` 主要控制发布检查中的 live/提供商覆盖范围。它不会移除常规完整 CI、插件预发布、安装冒烟测试、包验收、QA Lab 或 Docker 发布路径分块。`full` 还会在 `rerun_group=all` 时，让总控运行针对父级发布包产物的包 Telegram E2E，因此完整的预发布候选不会静默跳过该 Telegram 包 lane。

| 配置档    | 预期用途                          | 包含的 live/提供商覆盖范围                                                                                                                                                          |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的发布关键冒烟测试。          | OpenAI/core live 路径、OpenAI 的 Docker live 模型、原生 gateway core、原生 OpenAI gateway 配置档、原生 OpenAI 插件，以及 Docker live gateway OpenAI。                              |
| `stable`  | 默认发布批准配置档。              | `minimum` 加上 Anthropic 冒烟测试、Google、MiniMax、后端、原生 live test harness、Docker live CLI 后端、Docker ACP bind、Docker Codex harness，以及一个 OpenCode Go 冒烟分片。 |
| `full`    | 广泛的 advisory 扫描。            | `stable` 加上 advisory 提供商、插件 live 分片和媒体 live 分片。                                                                                                                     |

## 仅 full 包含的新增项

这些套件会被 `stable` 跳过，并由 `full` 包含：

| 区域                             | 仅 full 覆盖范围                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live 模型                 | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                                                                           |
| Docker live gateway              | advisory 提供商拆分为 DeepSeek/Fireworks、OpenCode Go/OpenRouter 和 xAI/Z.ai 分片。                                        |
| 原生 gateway 提供商配置档        | 完整 Anthropic Opus 和 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。        |
| 原生插件 live 分片               | 插件 A-K、L-N、O-Z other、Moonshot 和 xAI。                                                                                 |
| 原生媒体 live 分片               | Audio、Google music、MiniMax music 和 video groups A-D。                                                                    |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和 `native-live-src-gateway-profiles-opencode-go-smoke`；`full` 改用更广的 Anthropic 和 OpenCode Go 模型分片。聚焦重跑仍可使用聚合的 `native-live-src-gateway-profiles-anthropic` 或 `native-live-src-gateway-profiles-opencode-go` 句柄。

## 聚焦重跑

使用 `rerun_group` 以避免重复运行无关的发布盒：

| 句柄                | 范围                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | 所有完整发布验证阶段。                                                |
| `ci`                | 仅手动完整 CI 子项。                                                  |
| `plugin-prerelease` | 仅插件预发布子项。                                                    |
| `release-checks`    | 所有 OpenClaw 发布检查阶段。                                          |
| `install-smoke`     | 通过发布检查进行安装冒烟测试。                                        |
| `cross-os`          | 跨操作系统发布检查。                                                  |
| `live-e2e`          | 仓库/live E2E 和 Docker 发布路径验证。                                |
| `package`           | 包验收。                                                              |
| `qa`                | QA parity 加 QA live lane。                                           |
| `qa-parity`         | 仅 QA parity lane 和报告。                                            |
| `qa-live`           | 仅 QA live Matrix 和 Telegram。                                       |
| `npm-telegram`      | 已发布包 Telegram E2E；需要 `npm_telegram_package_spec`。             |

当一个 live 套件失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 搭配使用。有效的筛选器 ID 在可复用 live/E2E 工作流中定义，包括 `docker-live-models`、`live-gateway-docker`、`live-gateway-anthropic-docker`、`live-gateway-google-docker`、`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、`live-cli-backend-docker`、`live-acp-bind-docker` 和 `live-codex-harness-docker`。

`live-gateway-advisory-docker` 句柄是其三个提供商分片的聚合重跑句柄，因此它仍会展开到所有 advisory Docker gateway 作业。

## 要保留的证据

将 `Full Release Validation` 摘要保留为发布级索引。它链接子运行 ID，并包含最慢作业表。对于失败，先检查子工作流，然后重跑上方最小匹配句柄。

有用的产物：

- 来自完整发布验证父项和 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径产物
- 包验收 `package-under-test` 和 Docker 验收产物
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
