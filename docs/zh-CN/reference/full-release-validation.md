---
read_when:
    - 运行或重新运行完整发布验证
    - 比较稳定版和完整发布验证配置文件
    - 调试发布验证阶段失败
summary: 完整发布验证阶段、子工作流、发布配置、重新运行句柄和证据
title: 完整发布验证
x-i18n:
    generated_at: "2026-05-01T20:40:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 032cf35578bc56187cdf3776dada58ccbde9a24183896bc71c3a782e85fc834f
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是发布总控工作流。它是预发布验证的唯一手动入口点，但大多数工作在子工作流中完成，因此失败的运行环境可以重新运行，而无需重启整个发布流程。

请从受信任的工作流 ref 运行，通常是 `main`，并将发布分支、标签或完整提交 SHA 作为 `ref` 传入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流使用受信任的工作流 ref 作为 harness，并使用输入 `ref` 作为待测候选版本。这样在验证较旧的发布分支或标签时，也能使用新的验证逻辑。

## 顶层阶段

| 阶段                  | 详情                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目标解析              | **Job:** `Resolve target ref`<br />**子工作流：**无<br />**证明：**解析发布分支、标签或完整提交 SHA，并记录所选输入。<br />**重新运行：**如果此阶段失败，请重新运行总控工作流。                                                                                                                                                                                                                       |
| Vitest 和普通 CI      | **Job:** `Run normal full CI`<br />**子工作流：**`CI`<br />**证明：**针对目标 ref 的手动完整 CI 图，包括 Linux Node lanes、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Control UI i18n，以及通过总控工作流运行的 Android。<br />**重新运行：**`rerun_group=ci`。 |
| 插件预发布            | **Job:** `Run plugin prerelease validation`<br />**子工作流：**`Plugin Prerelease`<br />**证明：**仅发布使用的插件静态检查、智能体式插件覆盖、完整插件批量分片，以及插件预发布 Docker lanes。<br />**重新运行：**`rerun_group=plugin-prerelease`。                                                                                                             |
| 发布检查              | **Job:** `Run release/live/Docker/QA validation`<br />**子工作流：**`OpenClaw Release Checks`<br />**证明：**安装 smoke、跨操作系统包检查、live/E2E 套件、Docker 发布路径分块、Package Acceptance、QA Lab parity、live Matrix 和 live Telegram。<br />**重新运行：**`rerun_group=release-checks` 或更窄的 release-checks handle。           |
| 发布后 Telegram       | **Job:** `Run post-publish Telegram E2E`<br />**子工作流：**`NPM Telegram Beta E2E`<br />**证明：**当设置 `npm_telegram_package_spec` 时，提供可选的已发布包 Telegram 验证。<br />**重新运行：**`rerun_group=npm-telegram`。                                                                                                                                  |
| 总控验证器            | **Job:** `Verify full validation`<br />**子工作流：**无<br />**证明：**重新检查记录的子工作流运行结论，并追加来自子工作流的最慢 job 表。<br />**重新运行：**在重新运行失败的子工作流并通过后，仅重新运行此 job 以转为绿色。                                                                                                                                         |

对于 `ref=main` 和 `rerun_group=all`，较新的总控工作流会取代较旧的总控工作流。当父工作流被取消时，它的监控器会取消任何已经派发的子工作流。默认情况下，发布分支和标签验证运行不会相互取消。

## 发布检查阶段

`OpenClaw Release Checks` 是最大的子工作流。它会一次性解析目标，并在包或面向 Docker 的阶段需要时，准备共享的 `release-package-under-test` 构件。

| 阶段                | 详情                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 发布目标            | **Job:** `Resolve target ref`<br />**支撑工作流：**无<br />**测试：**所选 ref、可选的预期 SHA、配置档、重新运行组，以及聚焦的 live 套件过滤器。<br />**重新运行：**`rerun_group=release-checks`。                                                                                                                                                                           |
| 包构件              | **Job:** `Prepare release package artifact`<br />**支撑工作流：**无<br />**测试：**打包或解析一个候选 tarball，并上传 `release-package-under-test`，供下游面向包的检查使用。<br />**重新运行：**受影响的包、跨操作系统或 live/E2E 组。                                                                                                              |
| 安装 smoke          | **Job:** `Run install smoke`<br />**支撑工作流：**`Install Smoke`<br />**测试：**完整安装路径，包括复用根 Dockerfile smoke 镜像、QR 包安装、根和 Gateway 网关 Docker smoke、安装器 Docker 测试、Bun 全局安装 image-provider smoke，以及快速内置插件安装/卸载 E2E。<br />**重新运行：**`rerun_group=install-smoke`。 |
| 跨操作系统          | **Job:** `cross_os_release_checks`<br />**支撑工作流：**`OpenClaw Cross-OS Release Checks (Reusable)`<br />**测试：**在 Linux、Windows 和 macOS 上针对所选提供商和模式运行全新安装与升级 lanes，使用候选 tarball 加基线包。<br />**重新运行：**`rerun_group=cross-os`。                                                                     |
| 仓库和 live E2E     | **Job:** `Run repo/live E2E validation`<br />**支撑工作流：**`OpenClaw Live And E2E Checks (Reusable)`<br />**测试：**仓库 E2E、live cache、OpenAI websocket streaming、原生 live 提供商和插件分片，以及由 `release_profile` 选择的 Docker 支撑的 live 模型/backend/gateway harnesses。<br />**重新运行：**`rerun_group=live-e2e`，可选配 `live_suite_filter`。 |
| Docker 发布路径     | **Job:** `Run Docker release-path validation`<br />**支撑工作流：**`OpenClaw Live And E2E Checks (Reusable)`<br />**测试：**针对共享包构件运行发布路径 Docker 分块。<br />**重新运行：**`rerun_group=live-e2e`。                                                                                                                                                |
| 包验收              | **Job:** `Run package acceptance`<br />**支撑工作流：**`Package Acceptance`<br />**测试：**离线插件包 fixtures、插件更新，以及针对同一 tarball 的 mock-OpenAI Telegram 包验收。<br />**重新运行：**`rerun_group=package`。                                                                                                                        |
| QA 对等性           | **Job:** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支撑工作流：**直接 jobs<br />**测试：**候选版本和基线智能体式对等包，然后生成对等性报告。<br />**重新运行：**`rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                |
| QA live Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**支撑工作流：**直接 job<br />**测试：**在 `qa-live-shared` 环境中运行快速 live Matrix QA 配置档。<br />**重新运行：**`rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                              |
| QA live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**支撑工作流：**直接 job<br />**测试：**使用 Convex CI 凭据租约运行 live Telegram QA。<br />**重新运行：**`rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                           |
| 发布验证器          | **Job:** `Verify release checks`<br />**支撑工作流：**无<br />**测试：**所选重新运行组所需的 release-check jobs。<br />**重新运行：**在聚焦的子 jobs 通过后重新运行。                                                                                                                                                                                          |

## Docker 发布路径分块

当 `live_suite_filter` 为空时，Docker 发布路径阶段会运行这些分块：

| 分块                                                            | 覆盖范围                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `core`                                                          | Core Docker 发布路径 smoke lanes。                                       |
| `package-update-openai`                                         | OpenAI 包安装和更新行为。                                                |
| `package-update-anthropic`                                      | Anthropic 包安装和更新行为。                                             |
| `package-update-core`                                           | 提供商中立的包和更新行为。                                               |
| `plugins-runtime-plugins`                                       | 执行插件行为的插件运行时 lanes。                                         |
| `plugins-runtime-services`                                      | 服务支撑的插件运行时 lanes；按需包含 OpenWebUI。                         |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 为并行发布验证拆分的插件安装/运行时批次。                                |

当只有一个 Docker lane 失败时，请在可复用的 live/E2E 工作流上使用定向 `docker_lanes=<lane[,lane]>`。发布构件包含按 lane 的重新运行命令，并在可用时带有包构件和镜像复用输入。

## 发布配置档

`release_profile` 只控制发布检查内部的 live/提供商覆盖范围。它不会移除普通完整 CI、Plugin Prerelease、安装 smoke、包验收、QA Lab 或 Docker 发布路径分块。

| 配置档   | 预期用途                      | 包含的实时/提供商覆盖范围                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的发布关键冒烟测试。   | OpenAI/核心实时路径、OpenAI 的 Docker 实时模型、原生 Gateway 网关核心、原生 OpenAI Gateway 网关配置档、原生 OpenAI 插件，以及 Docker 实时 Gateway 网关 OpenAI。               |
| `stable`  | 默认发布批准配置档。 | `minimum` 加上 Anthropic、Google、MiniMax、后端、原生实时测试框架、Docker 实时 CLI 后端、Docker ACP 绑定、Docker Codex harness，以及一个 OpenCode Go 冒烟分片。 |
| `full`    | 广泛的咨询性扫描。             | `stable` 加上咨询性提供商、插件实时分片和媒体实时分片。                                                                                                  |

## 仅 full 添加项

这些套件会被 `stable` 跳过，并由 `full` 包含：

| 区域                             | 仅 full 覆盖范围                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker 实时模型               | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                              |
| Docker 实时 Gateway 网关              | DeepSeek、Fireworks、OpenCode Go、OpenRouter、xAI 和 Z.ai 的咨询性分片。 |
| 原生 Gateway 网关提供商配置档 | Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。  |
| 原生插件实时分片        | 插件 A-K、L-N、O-Z 其他、Moonshot 和 xAI。                                 |
| 原生媒体实时分片         | 音频、Google 音乐、MiniMax 音乐，以及视频组 A-D。                       |

`stable` 包含 `native-live-src-gateway-profiles-opencode-go-smoke`；`full`
改用更广泛的 OpenCode Go 模型分片。

## 聚焦重跑

使用 `rerun_group`，避免重复运行无关的发布盒：

| 句柄              | 范围                                             |
| ------------------- | ------------------------------------------------- |
| `all`               | 所有 Full Release Validation 阶段。               |
| `ci`                | 仅手动完整 CI 子项。                        |
| `plugin-prerelease` | 仅 Plugin Prerelease 子项。                     |
| `release-checks`    | 所有 OpenClaw Release Checks 阶段。               |
| `install-smoke`     | 从 Install Smoke 到发布检查。             |
| `cross-os`          | 跨操作系统发布检查。                          |
| `live-e2e`          | 仓库/实时 E2E 和 Docker 发布路径验证。 |
| `package`           | Package Acceptance。                               |
| `qa`                | QA parity 加上 QA 实时通道。                     |
| `qa-parity`         | 仅 QA parity 通道和报告。                  |
| `qa-live`           | 仅 QA 实时 Matrix 和 Telegram。                 |
| `npm-telegram`      | 仅可选的发布后 Telegram E2E。          |

当某个实时套件失败时，将 `live_suite_filter` 与 `rerun_group=live-e2e` 一起使用。
有效的过滤器 ID 定义在可复用的实时/E2E workflow 中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker` 和
`live-codex-harness-docker`。

## 需要保留的证据

保留 `Full Release Validation` 摘要作为发布级索引。它链接
子运行 ID，并包含最慢作业表。对于失败项，先检查子
workflow，然后重跑上面最小匹配的句柄。

有用的工件：

- 来自 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 发布路径工件
- Package Acceptance `package-under-test` 和 Docker 验收工件
- 每个操作系统和套件的跨操作系统发布检查工件
- QA parity、Matrix 和 Telegram 工件

## Workflow 文件

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
