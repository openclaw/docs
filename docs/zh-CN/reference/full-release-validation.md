---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版和完整发布验证配置
    - 调试发布验证阶段失败
summary: 完整发布验证阶段、子工作流、发布配置、重新运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-05-02T18:56:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布总控流程。它是预发布验证的唯一手动入口点，但大多数工作都在子工作流中完成，因此失败的运行单元可以重跑，而无需重新启动整个发布流程。

从受信任的工作流 ref 运行它，通常是 `main`，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流使用受信任的工作流 ref 作为 harness，并使用输入 `ref` 作为待测候选版本。这样，在验证较旧的发布分支或标签时，新的验证逻辑仍然可用。

Package Acceptance 通常会从解析后的 `ref` 构建候选 tarball，包括通过 `pnpm ci:full-release` 分发的完整 SHA 运行。发布后，传入 `package_acceptance_package_spec=openclaw@YYYY.M.D`（或 `openclaw@beta`/`openclaw@latest`），改为针对已发布的 npm 包运行相同的包/更新矩阵。

## 顶层阶段

| 阶段                 | 详情                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目标解析             | **Job:** `Resolve target ref`<br />**子工作流：** 无<br />**证明内容：** 解析发布分支、标签或完整提交 SHA，并记录选定输入。<br />**重跑：** 如果此项失败，重跑总控流程。                                                                                                                                                         |
| Vitest 和常规 CI     | **Job:** `Run normal full CI`<br />**子工作流：** `CI`<br />**证明内容：** 针对目标 ref 的手动完整 CI 图，包括 Linux Node lanes、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Control UI i18n，以及通过总控流程运行的 Android。<br />**重跑：** `rerun_group=ci`。 |
| 插件预发布           | **Job:** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**证明内容：** 仅发布时运行的插件静态检查、agentic 插件覆盖率、完整插件批量分片，以及插件预发布 Docker lanes。<br />**重跑：** `rerun_group=plugin-prerelease`。                                                                                  |
| 发布检查             | **Job:** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**证明内容：** 安装冒烟、跨操作系统包检查、live/E2E 套件、Docker 发布路径分块、Package Acceptance、QA Lab parity、live Matrix，以及 live Telegram。<br />**重跑：** `rerun_group=release-checks` 或更窄的 release-checks 句柄。          |
| Package Telegram     | **Job:** `Run package Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**证明内容：** 在 `rerun_group=all` 且 `release_profile=full` 时提供基于工件的 Telegram 包验证；或在设置 `npm_telegram_package_spec` 时提供已发布包的 Telegram 验证。<br />**重跑：** 使用 `npm_telegram_package_spec` 的 `rerun_group=npm-telegram`。  |
| 总控验证器           | **Job:** `Verify full validation`<br />**子工作流：** 无<br />**证明内容：** 重新检查已记录的子运行结论，并附加来自子工作流的最慢 Job 表格。<br />**重跑：** 在重跑失败子项并转绿后，仅重跑此 Job。                                                                                                                                     |

对于 `ref=main` 和 `rerun_group=all`，较新的总控流程会取代较旧的总控流程。当父级被取消时，它的监控器会取消任何已经分发的子工作流。默认情况下，发布分支和标签验证运行不会互相取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它只解析一次目标，并在面向包或 Docker 的阶段需要时准备共享的 `release-package-under-test` 工件。

| 阶段                 | 详情                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 发布目标             | **Job:** `Resolve target ref`<br />**底层工作流：** 无<br />**测试内容：** 选定的 ref、可选的预期 SHA、profile、重跑组，以及聚焦的 live 套件过滤器。<br />**重跑：** `rerun_group=release-checks`。                                                                                                                                       |
| 包工件               | **Job:** `Prepare release package artifact`<br />**底层工作流：** 无<br />**测试内容：** 打包或解析一个候选 tarball，并上传 `release-package-under-test`，供下游面向包的检查使用。<br />**重跑：** 受影响的包、跨操作系统或 live/E2E 组。                                                                                                        |
| 安装冒烟             | **Job:** `Run install smoke`<br />**底层工作流：** `Install Smoke`<br />**测试内容：** 完整安装路径，复用根 Dockerfile 冒烟镜像、QR 包安装、根和 Gateway 网关 Docker 冒烟、安装器 Docker 测试、Bun 全局安装 image-provider 冒烟，以及快速内置插件安装/卸载 E2E。<br />**重跑：** `rerun_group=install-smoke`。                     |
| 跨操作系统           | **Job:** `cross_os_release_checks`<br />**底层工作流：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试内容：** 针对选定提供商和模式，在 Linux、Windows 和 macOS 上运行全新安装与升级 lanes，使用候选 tarball 加基线包。<br />**重跑：** `rerun_group=cross-os`。                                                                  |
| 仓库和 live E2E      | **Job:** `Run repo/live E2E validation`<br />**底层工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试内容：** 仓库 E2E、live cache、OpenAI websocket streaming、原生 live 提供商和插件分片，以及由 `release_profile` 选择的 Docker 支持的 live 模型/backend/gateway harnesses。<br />**重跑：** `rerun_group=live-e2e`，可选附带 `live_suite_filter`。 |
| Docker 发布路径      | **Job:** `Run Docker release-path validation`<br />**底层工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试内容：** 针对共享包工件运行 release-path Docker 分块。<br />**重跑：** `rerun_group=live-e2e`。                                                                                                                      |
| Package Acceptance   | **Job:** `Run package acceptance`<br />**底层工作流：** `Package Acceptance`<br />**测试内容：** 离线插件包 fixtures、插件更新、mock-OpenAI Telegram 包验收，以及从 `2026.4.23` 或之后的每个稳定 npm 发布版本到同一 tarball 的已发布升级幸存检查。<br />**重跑：** `rerun_group=package`。                                                     |
| QA parity            | **Job:** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**底层工作流：** 直接 Job<br />**测试内容：** 候选版本和基线的 agentic parity packs，然后生成 parity report。<br />**重跑：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                              |
| QA live Matrix       | **Job:** `Run QA Lab live Matrix lane`<br />**底层工作流：** 直接 Job<br />**测试内容：** 在 `qa-live-shared` 环境中运行快速 live Matrix QA profile。<br />**重跑：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                            |
| QA live Telegram     | **Job:** `Run QA Lab live Telegram lane`<br />**底层工作流：** 直接 Job<br />**测试内容：** 使用 Convex CI 凭证租约的 live Telegram QA。<br />**重跑：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                          |
| 发布验证器           | **Job:** `Verify release checks`<br />**底层工作流：** 无<br />**测试内容：** 选定重跑组所需的 release-check Job。<br />**重跑：** 聚焦的子 Job 通过后重跑。                                                                                                                                                                                  |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段会运行这些分块：

| 分块                                                            | 覆盖范围                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core Docker 发布路径冒烟 lanes。                                        |
| `package-update-openai`                                         | OpenAI 包安装和更新行为。                                               |
| `package-update-anthropic`                                      | Anthropic 包安装和更新行为。                                            |
| `package-update-core`                                           | 提供商中立的包和更新行为。                                              |
| `plugins-runtime-plugins`                                       | 运行插件行为的插件运行时 lanes。                                        |
| `plugins-runtime-services`                                      | 服务支持的插件运行时 lanes；在请求时包含 OpenWebUI。                    |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 为并行发布验证拆分的插件安装/运行时批次。                               |

当只有一个 Docker lane 失败时，在可复用 live/E2E 工作流上使用定向的 `docker_lanes=<lane[,lane]>`。发布工件包含按 lane 划分的重跑命令，并在可用时包含包工件和镜像复用输入。

## 发布 profiles

`release_profile` 主要控制发布检查中的实时/提供商覆盖广度。
它不会移除正常的完整 CI、插件预发布、安装冒烟测试、包
验收、QA Lab 或 Docker 发布路径分块。`full` 还会让
总控运行在 `rerun_group=all` 时针对发布包产物执行 Telegram 包 E2E，因此完整的预发布候选版本不会静默跳过该
Telegram 包通道。

| Profile   | 预期用途                      | 包含的实时/提供商覆盖范围                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的发布关键冒烟测试。   | OpenAI/核心实时路径、用于 OpenAI 的 Docker 实时模型、原生 Gateway 网关核心、原生 OpenAI Gateway 网关配置文件、原生 OpenAI 插件，以及 Docker 实时 Gateway 网关 OpenAI。               |
| `stable`  | 默认发布批准配置文件。 | `minimum` 加上 Anthropic、Google、MiniMax、后端、原生实时测试 harness、Docker 实时 CLI 后端、Docker ACP 绑定、Docker Codex harness，以及一个 OpenCode Go 冒烟分片。 |
| `full`    | 广泛的建议性扫描。             | `stable` 加上建议性提供商、插件实时分片和媒体实时分片。                                                                                                  |

## 仅 full 增加项

这些套件会被 `stable` 跳过，并由 `full` 包含：

| 区域                             | 仅 full 覆盖范围                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker 实时模型               | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                              |
| Docker 实时 Gateway 网关              | 用于 DeepSeek、Fireworks、OpenCode Go、OpenRouter、xAI 和 Z.ai 的建议性分片。 |
| 原生 Gateway 网关提供商配置文件 | Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。  |
| 原生插件实时分片        | 插件 A-K、L-N、O-Z 其他、Moonshot 和 xAI。                                 |
| 原生媒体实时分片         | 音频、Google 音乐、MiniMax 音乐和视频组 A-D。                       |

`stable` 包含 `native-live-src-gateway-profiles-opencode-go-smoke`；`full`
则使用更广泛的 OpenCode Go 模型分片。

## 聚焦重跑

使用 `rerun_group` 以避免重复运行无关的发布盒子：

| 句柄              | 范围                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | 所有完整发布验证阶段。                                   |
| `ci`                | 仅手动完整 CI 子项。                                            |
| `plugin-prerelease` | 仅插件预发布子项。                                         |
| `release-checks`    | 所有 OpenClaw 发布检查阶段。                                   |
| `install-smoke`     | 通过发布检查执行安装冒烟测试。                                 |
| `cross-os`          | 跨 OS 发布检查。                                              |
| `live-e2e`          | 仓库/实时 E2E 和 Docker 发布路径验证。                     |
| `package`           | 包验收。                                                   |
| `qa`                | QA 奇偶校验加 QA 实时通道。                                         |
| `qa-parity`         | 仅 QA 奇偶校验通道和报告。                                      |
| `qa-live`           | 仅 QA 实时 Matrix 和 Telegram。                                     |
| `npm-telegram`      | 已发布包 Telegram E2E；需要 `npm_telegram_package_spec`。 |

当某个实时套件失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 一起使用。
有效的过滤器 ID 定义在可复用实时/E2E 工作流中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker` 和
`live-codex-harness-docker`。

## 需要保留的证据

保留 `Full Release Validation` 摘要作为发布级索引。它会链接
子运行 ID，并包含最慢任务表。对于失败，先检查子
工作流，然后重跑上面匹配的最小句柄。

有用的产物：

- 来自 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径产物
- 包验收 `package-under-test` 和 Docker 验收产物
- 每个 OS 和套件的跨 OS 发布检查产物
- QA 奇偶校验、Matrix 和 Telegram 产物

## 工作流文件

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
