---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版和完整版发布验证配置文件
    - 调试发布验证阶段失败
summary: 完整发布验证的阶段、子工作流、发布配置文件、重新运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-05-01T23:10:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布验证总控。它是预发布证明的单一手动入口点，但大部分工作发生在子工作流中，因此失败的执行环境可以重新运行，而不必重启整个发布流程。

从受信任的工作流 ref 运行它，通常是 `main`，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流使用受信任的工作流 ref 作为 harness，并使用输入
`ref` 作为被测候选版本。这样在验证较旧的发布分支或标签时，也能使用新的验证逻辑。

## 顶层阶段

| 阶段                | 详情                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目标解析    | **作业：** `Resolve target ref`<br />**子工作流：** 无<br />**验证：** 解析发布分支、标签或完整提交 SHA，并记录选定的输入。<br />**重新运行：** 如果这里失败，重新运行总控工作流。                                                                                                                                                                              |
| Vitest 和普通 CI | **作业：** `Run normal full CI`<br />**子工作流：** `CI`<br />**验证：** 针对目标 ref 的手动完整 CI 图，包括 Linux Node 通道、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Control UI i18n，以及通过总控工作流运行的 Android。<br />**重新运行：** `rerun_group=ci`。 |
| 插件预发布    | **作业：** `Run plugin prerelease validation`<br />**子工作流：** `Plugin Prerelease`<br />**验证：** 仅发布使用的插件静态检查、智能体式插件覆盖、完整插件批次分片，以及插件预发布 Docker 通道。<br />**重新运行：** `rerun_group=plugin-prerelease`。                                                                                                       |
| 发布检查       | **作业：** `Run release/live/Docker/QA validation`<br />**子工作流：** `OpenClaw Release Checks`<br />**验证：** 安装冒烟、跨 OS 包检查、live/E2E 套件、Docker 发布路径分块、Package Acceptance、QA Lab 对等性、live Matrix 和 live Telegram。<br />**重新运行：** `rerun_group=release-checks` 或更窄的 release-checks 句柄。                                |
| Telegram 包     | **作业：** `Run package Telegram E2E`<br />**子工作流：** `NPM Telegram Beta E2E`<br />**验证：** 当 `rerun_group=all` 且 `release_profile=full` 时，进行基于构件的 Telegram 包证明；或当设置了 `npm_telegram_package_spec` 时，进行已发布包的 Telegram 证明。<br />**重新运行：** 使用 `npm_telegram_package_spec` 的 `rerun_group=npm-telegram`。                                     |
| 总控验证器    | **作业：** `Verify full validation`<br />**子工作流：** 无<br />**验证：** 重新检查已记录的子运行结论，并从子工作流附加最慢作业表。<br />**重新运行：** 在重新运行失败的子工作流并变绿后，只重新运行此作业。                                                                                                                                   |

对于 `ref=main` 和 `rerun_group=all`，较新的总控工作流会取代较旧的总控工作流。当父工作流被取消时，它的监视器会取消已分派的所有子工作流。发布分支和标签验证运行默认不会相互取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它会解析一次目标，并在面向包或 Docker 的阶段需要时，准备共享的 `release-package-under-test` 构件。

| 阶段               | 详情                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 发布目标      | **作业：** `Resolve target ref`<br />**支撑工作流：** 无<br />**测试：** 选定 ref、可选的预期 SHA、profile、rerun group，以及聚焦的 live 套件过滤器。<br />**重新运行：** `rerun_group=release-checks`。                                                                                                                                                                           |
| 包构件    | **作业：** `Prepare release package artifact`<br />**支撑工作流：** 无<br />**测试：** 打包或解析一个候选 tarball，并上传 `release-package-under-test`，供下游面向包的检查使用。<br />**重新运行：** 受影响的包、跨 OS 或 live/E2E 组。                                                                                                           |
| 安装冒烟       | **作业：** `Run install smoke`<br />**支撑工作流：** `Install Smoke`<br />**测试：** 完整安装路径，包括根 Dockerfile 冒烟镜像复用、QR 包安装、根和 Gateway 网关 Docker 冒烟、安装器 Docker 测试、Bun 全局安装 image-provider 冒烟，以及快速内置插件安装/卸载 E2E。<br />**重新运行：** `rerun_group=install-smoke`。                              |
| 跨 OS            | **作业：** `cross_os_release_checks`<br />**支撑工作流：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：** 在 Linux、Windows 和 macOS 上针对选定提供商和模式运行全新安装与升级通道，使用候选 tarball 加基线包。<br />**重新运行：** `rerun_group=cross-os`。                                                                               |
| 仓库和 live E2E   | **作业：** `Run repo/live E2E validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 仓库 E2E、live 缓存、OpenAI websocket 流式传输、原生 live 提供商和插件分片，以及由 `release_profile` 选择的 Docker 支撑 live 模型/后端/Gateway 网关 harness。<br />**重新运行：** `rerun_group=live-e2e`，可选搭配 `live_suite_filter`。 |
| Docker 发布路径 | **作业：** `Run Docker release-path validation`<br />**支撑工作流：** `OpenClaw Live And E2E Checks (Reusable)`<br />**测试：** 针对共享包构件的发布路径 Docker 分块。<br />**重新运行：** `rerun_group=live-e2e`。                                                                                                                                                      |
| Package Acceptance  | **作业：** `Run package acceptance`<br />**支撑工作流：** `Package Acceptance`<br />**测试：** 离线插件包夹具、插件更新，以及针对同一 tarball 的模拟 OpenAI Telegram 包验收。<br />**重新运行：** `rerun_group=package`。                                                                                                                                  |
| QA 对等性           | **作业：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支撑工作流：** 直接作业<br />**测试：** 候选版本和基线的智能体式对等包，然后生成对等性报告。<br />**重新运行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                       |
| QA live Matrix      | **作业：** `Run QA Lab live Matrix lane`<br />**支撑工作流：** 直接作业<br />**测试：** `qa-live-shared` 环境中的快速 live Matrix QA profile。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                        |
| QA live Telegram    | **作业：** `Run QA Lab live Telegram lane`<br />**支撑工作流：** 直接作业<br />**测试：** 使用 Convex CI 凭证租约的 live Telegram QA。<br />**重新运行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                    |
| 发布验证器    | **作业：** `Verify release checks`<br />**支撑工作流：** 无<br />**测试：** 选定 rerun group 所需的 release-check 作业。<br />**重新运行：** 在聚焦的子作业通过后重新运行。                                                                                                                                                                                                 |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段会运行这些分块：

| 分块                                                           | 覆盖范围                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 发布路径冒烟通道。                                   |
| `package-update-openai`                                         | OpenAI 包安装和更新行为。                             |
| `package-update-anthropic`                                      | Anthropic 包安装和更新行为。                          |
| `package-update-core`                                           | 与提供商无关的包和更新行为。                           |
| `plugins-runtime-plugins`                                       | 运行插件行为的插件运行时通道。                     |
| `plugins-runtime-services`                                      | 服务支撑的插件运行时通道；按请求包含 OpenWebUI。 |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 为并行发布验证而拆分的插件安装/运行时批次。   |

当只有一个 Docker 通道失败时，在可复用 live/E2E 工作流上使用定向的 `docker_lanes=<lane[,lane]>`。发布构件包含每个通道的重新运行命令，并在可用时带有包构件和镜像复用输入。

## 发布 profile

`release_profile` 主要控制发布检查中的 live/提供商覆盖广度。它不会移除普通完整 CI、Plugin Prerelease、安装冒烟、包验收、QA Lab 或 Docker 发布路径分块。`full` 还会让总控工作流在 `rerun_group=all` 时针对发布包构件运行 Telegram 包 E2E，因此完整的发布前候选版本不会默默跳过该 Telegram 包通道。

| 配置档案 | 预期用途 | 包含的实时/提供商覆盖范围 |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的发布关键冒烟测试。 | OpenAI/核心实时路径、OpenAI 的 Docker 实时模型、原生 Gateway 网关核心、原生 OpenAI Gateway 网关配置档案、原生 OpenAI 插件，以及 Docker 实时 Gateway 网关 OpenAI。 |
| `stable`  | 默认发布批准配置档案。 | `minimum` 加上 Anthropic、Google、MiniMax、后端、原生实时测试工具、Docker 实时 CLI 后端、Docker ACP 绑定、Docker Codex harness，以及一个 OpenCode Go 冒烟分片。 |
| `full`    | 广泛的建议性扫描。 | `stable` 加上建议性提供商、插件实时分片和媒体实时分片。 |

## 仅 Full 的新增项

这些套件会被 `stable` 跳过，并由 `full` 包含：

| 区域 | 仅 Full 的覆盖范围 |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker 实时模型 | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。 |
| Docker 实时 Gateway 网关 | DeepSeek、Fireworks、OpenCode Go、OpenRouter、xAI 和 Z.ai 的建议性分片。 |
| 原生 Gateway 网关提供商配置档案 | Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。 |
| 原生插件实时分片 | 插件 A-K、L-N、O-Z 其他、Moonshot 和 xAI。 |
| 原生媒体实时分片 | 音频、Google 音乐、MiniMax 音乐，以及视频组 A-D。 |

`stable` 包含 `native-live-src-gateway-profiles-opencode-go-smoke`；`full`
改用范围更广的 OpenCode Go 模型分片。

## 聚焦重跑

使用 `rerun_group` 避免重复运行无关的发布盒：

| 句柄 | 范围 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | 所有 Full Release Validation 阶段。 |
| `ci`                | 仅手动完整 CI 子项。 |
| `plugin-prerelease` | 仅插件预发布子项。 |
| `release-checks`    | 所有 OpenClaw Release Checks 阶段。 |
| `install-smoke`     | 安装冒烟到发布检查。 |
| `cross-os`          | 跨操作系统发布检查。 |
| `live-e2e`          | 仓库/实时 E2E 和 Docker 发布路径验证。 |
| `package`           | Package Acceptance。 |
| `qa`                | QA 对等性加 QA 实时通道。 |
| `qa-parity`         | 仅 QA 对等性通道和报告。 |
| `qa-live`           | 仅 QA 实时 Matrix 和 Telegram。 |
| `npm-telegram`      | 已发布包的 Telegram E2E；需要 `npm_telegram_package_spec`。 |

当某个实时套件失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 一起使用。
有效的过滤器 ID 在可复用实时/E2E 工作流中定义，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker` 和
`live-codex-harness-docker`。

## 需要保留的证据

保留 `Full Release Validation` 摘要作为发布级索引。它会链接
子运行 ID，并包含最慢作业表。对于失败，先检查子
工作流，然后重跑上方匹配范围最小的句柄。

有用的工件：

- 来自 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径工件
- Package Acceptance 的 `package-under-test` 和 Docker 验收工件
- 每个操作系统和套件的跨操作系统发布检查工件
- QA 对等性、Matrix 和 Telegram 工件

## 工作流文件

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
