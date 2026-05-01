---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版和完整版发布验证配置文件
    - 调试发布验证阶段失败
summary: 完整发布验证阶段、子工作流、发布配置档案、重新运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-05-01T02:24:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef87c4b54ed8e4834d5417f8be80b99e7d9c9476caefe0581b0864b07bcc4e1a
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布验证总入口。它是预发布验证的唯一手动入口点，但大多数工作发生在子工作流中，因此失败的机器可以在不重新启动整个发布流程的情况下重跑。

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

## 顶层阶段

| 阶段                  | 工作流作业名称                          | 子工作流                  | 证明内容                                                                                                                                                                                                                                                                                | 重跑句柄                                                         |
| --------------------- | --------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 目标解析              | `Resolve target ref`                    | 无                        | 解析发布分支、标签或完整提交 SHA，并记录所选输入。                                                                                                                                                                                                                                      | 如果此项失败，重跑总入口。                                      |
| Vitest 和常规 CI      | `Run normal full CI`                    | `CI`                      | 针对目标引用的手动完整 CI 图，包括 Linux Node 通道、内置插件分片、渠道合约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Control UI i18n，以及通过总入口运行的 Android。 | `rerun_group=ci`                                                 |
| 插件预发布            | `Run plugin prerelease validation`      | `Plugin Prerelease`       | 仅发布时运行的插件静态检查、智能体式插件覆盖、完整扩展批量分片，以及插件预发布 Docker 通道。                                                                                                                                                                                            | `rerun_group=plugin-prerelease`                                  |
| 发布检查              | `Run release/live/Docker/QA validation` | `OpenClaw Release Checks` | 安装 smoke、跨 OS 包检查、live/E2E 套件、Docker 发布路径分块、Package Acceptance、QA Lab parity、live Matrix，以及 live Telegram。                                                                                                                                                        | `rerun_group=release-checks` 或更窄的 release-checks 句柄        |
| 发布后 Telegram       | `Run post-publish Telegram E2E`         | `NPM Telegram Beta E2E`   | 当设置了 `npm_telegram_package_spec` 时，可选的已发布包 Telegram 验证。                                                                                                                                                                                                                  | `rerun_group=npm-telegram`                                       |
| 总入口验证器          | `Verify full validation`                | 无                        | 重新检查已记录的子运行结论，并附加来自子工作流的最慢作业表。                                                                                                                                                                                                                            | 在重跑失败子项并转绿后，仅重跑此作业。                          |

对于 `ref=main` 和 `rerun_group=all`，较新的总入口会取代较旧的总入口。当父级被取消时，它的监控器会取消已经分派的任何子工作流。发布分支和标签验证运行默认不会互相取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它会解析一次目标，并在包或面向 Docker 的阶段需要时准备共享的 `release-package-under-test` artifact。

| 阶段                | 工作流作业名称                                          | 后端工作流或作业                              | 测试内容                                                                                                                                                                                                                 | 重跑句柄                                                   |
| ------------------- | ------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| 发布目标            | `Resolve target ref`                                    | 无                                            | 验证所选引用、可选的预期 SHA、profile、重跑组，以及聚焦的 live 套件过滤器。                                                                                                                                              | 重跑 `release-checks`。                                    |
| 包 artifact         | `Prepare release package artifact`                      | 无                                            | 打包或解析一个候选 tarball，并上传 `release-package-under-test`，供下游面向包的检查使用。                                                                                                                                | 重跑受影响的包、跨 OS 或 live/E2E 组。                    |
| 安装 smoke          | `Run install smoke`                                     | `Install Smoke`                               | 完整安装路径，包含根 Dockerfile smoke 镜像复用、QR 包安装、根和 Gateway 网关 Docker smoke、安装器 Docker 测试、Bun 全局安装 image-provider smoke，以及快速内置插件 Docker E2E。                                         | `rerun_group=install-smoke`                                |
| 跨 OS               | `cross_os_release_checks`                               | `OpenClaw Cross-OS Release Checks (Reusable)` | 在 Linux、Windows 和 macOS 上，针对所选提供商和模式运行全新安装与升级通道，使用候选 tarball 加基线包。                                                                                                                   | `rerun_group=cross-os`                                     |
| 仓库和 live E2E     | `Run repo/live E2E validation`                          | `OpenClaw Live And E2E Checks (Reusable)`     | 由 `release_profile` 选择的仓库 E2E、live 缓存、OpenAI websocket 流式传输、原生 live 提供商和插件分片，以及 Docker 支持的 live 模型、后端和 Gateway 网关 harness。                                                        | `rerun_group=live-e2e`，可选搭配 `live_suite_filter`       |
| Docker 发布路径     | `Run Docker release-path validation`                    | `OpenClaw Live And E2E Checks (Reusable)`     | 针对共享包 artifact 运行发布路径 Docker 分块。                                                                                                                                                                           | `rerun_group=live-e2e`                                     |
| Package Acceptance  | `Run package acceptance`                                | `Package Acceptance`                          | artifact 原生内置渠道依赖兼容性、离线插件包 fixture，以及针对同一 tarball 的 mock-OpenAI Telegram 包验收。                                                                                                               | `rerun_group=package`                                      |
| QA parity           | `Run QA Lab parity lane` 和 `Run QA Lab parity report`  | 直接作业                                      | 候选版本和基线的智能体式 parity 包，然后生成 parity 报告。                                                                                                                                                               | `rerun_group=qa-parity` 或 `rerun_group=qa`                |
| QA live Matrix      | `Run QA Lab live Matrix lane`                           | 直接作业                                      | `qa-live-shared` 环境中的快速 live Matrix QA profile。                                                                                                                                                                   | `rerun_group=qa-live` 或 `rerun_group=qa`                  |
| QA live Telegram    | `Run QA Lab live Telegram lane`                         | 直接作业                                      | 使用 Convex CI 凭证租约的 live Telegram QA。                                                                                                                                                                             | `rerun_group=qa-live` 或 `rerun_group=qa`                  |
| 发布验证器          | `Verify release checks`                                 | 无                                            | 验证所选重跑组所需的 release-check 作业。                                                                                                                                                                                | 在聚焦的子作业通过后重跑。                               |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段会运行这些分块：

| 分块                                                                                        | 覆盖范围                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | 核心 Docker 发布路径冒烟运行线。                                        |
| `package-update-openai`                                                                     | OpenAI 包安装和更新行为。                                               |
| `package-update-anthropic`                                                                  | Anthropic 包安装和更新行为。                                            |
| `package-update-core`                                                                       | 提供商中立的包和更新行为。                                              |
| `plugins-runtime-plugins`                                                                   | 覆盖插件行为的插件运行时运行线。                                        |
| `plugins-runtime-services`                                                                  | 由服务支持的插件运行时运行线；按请求包含 OpenWebUI。                    |
| `plugins-runtime-install-a` through `plugins-runtime-install-h`                             | 为并行发布验证拆分的插件安装/运行时批次。                               |
| `bundled-channels-core`                                                                     | 内置渠道 Docker 行为。                                                  |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | 内置渠道更新行为。                                                      |
| `bundled-channels-contracts`                                                                | Docker 发布路径中的内置渠道契约检查。                                   |

当只有一个 Docker 运行线失败时，在可复用的 live/E2E 工作流上使用有针对性的 `docker_lanes=<lane[,lane]>`。发布工件会在可用时包含按运行线划分的重跑命令，并带有包工件和镜像复用输入。

## 发布配置档案

`release_profile` 只控制发布检查中的 live/提供商覆盖广度。它不会移除常规完整 CI、插件预发布、安装冒烟、包验收、QA Lab 或 Docker 发布路径分块。

| 配置档案  | 预期用途                          | 包含的 live/提供商覆盖范围                                                                                                                                                    |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的发布关键冒烟检查。          | OpenAI/核心 live 路径、OpenAI 的 Docker live 模型、原生 Gateway 网关核心、原生 OpenAI Gateway 网关配置档案、原生 OpenAI 插件，以及 Docker live Gateway 网关 OpenAI。          |
| `stable`  | 默认发布批准配置档案。            | `minimum` 加上 Anthropic、Google、MiniMax、后端、原生 live 测试工具集、Docker live CLI 后端、Docker ACP 绑定、Docker Codex harness，以及一个 OpenCode Go 冒烟分片。           |
| `full`    | 广泛的咨询性扫描。                | `stable` 加上咨询性提供商、插件 live 分片，以及媒体 live 分片。                                                                                                               |

## 仅 full 包含的补充项

这些套件会被 `stable` 跳过，并由 `full` 包含：

| 区域                             | 仅 full 覆盖范围                                                              |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Docker live 模型                 | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                             |
| Docker live Gateway 网关         | DeepSeek、Fireworks、OpenCode Go、OpenRouter、xAI 和 Z.ai 的咨询性分片。      |
| 原生 Gateway 网关提供商配置档案  | Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。     |
| 原生插件 live 分片               | 插件 A-K、L-N、O-Z 其他、Moonshot 和 xAI。                                    |
| 原生媒体 live 分片               | 音频、Google 音乐、MiniMax 音乐，以及视频组 A-D。                             |

`stable` 包含 `native-live-src-gateway-profiles-opencode-go-smoke`；`full` 则使用更广泛的 OpenCode Go 模型分片。

## 聚焦重跑

使用 `rerun_group` 避免重复运行无关的发布环境：

| 句柄                | 范围                                              |
| ------------------- | ------------------------------------------------- |
| `all`               | 所有完整发布验证阶段。                            |
| `ci`                | 仅手动完整 CI 子项。                              |
| `plugin-prerelease` | 仅插件预发布子项。                                |
| `release-checks`    | 所有 OpenClaw 发布检查阶段。                      |
| `install-smoke`     | 从安装冒烟到发布检查。                            |
| `cross-os`          | 跨 OS 发布检查。                                  |
| `live-e2e`          | 仓库/live E2E 和 Docker 发布路径验证。            |
| `package`           | 包验收。                                          |
| `qa`                | QA 奇偶性加 QA live 运行线。                      |
| `qa-parity`         | 仅 QA 奇偶性运行线和报告。                        |
| `qa-live`           | 仅 QA live Matrix 和 Telegram。                   |
| `npm-telegram`      | 仅可选的发布后 Telegram E2E。                     |

当一个 live 套件失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 搭配使用。有效的过滤器 ID 定义在可复用的 live/E2E 工作流中，包括 `docker-live-models`、`live-gateway-docker`、`live-gateway-anthropic-docker`、`live-gateway-google-docker`、`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、`live-cli-backend-docker`、`live-acp-bind-docker` 和 `live-codex-harness-docker`。

## 需要保留的证据

保留 `Full Release Validation` 摘要作为发布级索引。它链接子运行 ID，并包含最慢作业表。遇到失败时，先检查子工作流，然后重跑上方最小的匹配句柄。

有用的工件：

- 来自 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径工件
- 包验收的 `package-under-test` 和 Docker 验收工件
- 每个 OS 和套件的跨 OS 发布检查工件
- QA 奇偶性、Matrix 和 Telegram 工件

## 工作流文件

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
