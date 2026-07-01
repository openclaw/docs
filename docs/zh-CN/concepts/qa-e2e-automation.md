---
read_when:
    - 了解 QA 技术栈如何协同工作
    - 扩展 qa-lab、qa-channel 或传输适配器
    - 添加仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化
summary: QA 栈概览：qa-lab、qa-channel、仓库支持的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-07-01T05:28:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 栈用于以比单个单元测试更真实、更贴近渠道形态的方式测试 OpenClaw。

当前组成：

- `extensions/qa-channel`：合成消息渠道，包含私信、频道、话题串、回应、编辑和删除表面。
- `extensions/qa-lab`：用于观察转录、注入入站消息和导出 Markdown 报告的调试器 UI 和 QA 总线。
- `extensions/qa-matrix`、未来的 runner 插件：在子 QA Gateway 网关内驱动真实渠道的实时传输适配器。
- `qa/`：由仓库支持的启动任务种子资产和基线 QA 场景。
- [Mantis](/zh-CN/concepts/mantis)：针对需要真实传输、浏览器截图、VM 状态和 PR 证据的 bug，进行前后实时验证。

## 命令表面

每个 QA 流都在 `pnpm openclaw qa <subcommand>` 下运行。许多都有 `pnpm qa:*` 脚本别名；两种形式都受支持。

| 命令                                                | 用途                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | 不带 `--qa-profile` 的内置 QA 自检；带 `--qa-profile smoke-ci`、`--qa-profile release` 或 `--qa-profile all` 的基于分类法的成熟度配置 runner。                                                                                                                          |
| `qa suite`                                          | 针对 QA Gateway 网关通道运行由仓库支持的场景。别名：`pnpm openclaw qa suite --runner multipass`，用于一次性 Linux VM。                                                                                                                                                  |
| `qa coverage`                                       | 打印 YAML 场景覆盖率清单（`--json` 用于机器输出）。                                                                                                                                                                                                                     |
| `qa parity-report`                                  | 比较两个 `qa-suite-summary.json` 文件并写入 agentic 对等报告，或使用 `--runtime-axis --token-efficiency` 从一个运行时对摘要写入 Codex 对 OpenClaw 运行时对等和 token 效率报告。                                                                                        |
| `qa character-eval`                                 | 在多个实时模型上运行角色 QA 场景，并生成带评审的报告。参见[报告](#reporting)。                                                                                                                                                                                          |
| `qa manual`                                         | 针对选定的提供商/模型通道运行一次性 prompt。                                                                                                                                                                                                                            |
| `qa ui`                                             | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                            |
| `qa docker-build-image`                             | 构建预制 QA Docker 镜像。                                                                                                                                                                                                                                               |
| `qa docker-scaffold`                                | 写入用于 QA 仪表板 + Gateway 网关通道的 docker-compose 脚手架。                                                                                                                                                                                                         |
| `qa up`                                             | 构建 QA 站点，启动 Docker 支持的栈，并打印 URL（别名：`pnpm qa:lab:up`；`:fast` 变体会添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                                    |
| `qa aimock`                                         | 仅启动 AIMock 提供商服务器。                                                                                                                                                                                                                                            |
| `qa mock-openai`                                    | 仅启动感知场景的 `mock-openai` 提供商服务器。                                                                                                                                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享 Convex 凭据池。                                                                                                                                                                                                                                                |
| `qa matrix`                                         | 针对一次性 Tuwunel homeserver 的实时传输通道。参见 [Matrix QA](/zh-CN/concepts/qa-matrix)。                                                                                                                                                                                   |
| `qa telegram`                                       | 针对真实私有 Telegram 群组的实时传输通道。                                                                                                                                                                                                                              |
| `qa discord`                                        | 针对真实私有 Discord guild 频道的实时传输通道。                                                                                                                                                                                                                         |
| `qa slack`                                          | 针对真实私有 Slack 频道的实时传输通道。                                                                                                                                                                                                                                 |
| `qa whatsapp`                                       | 针对真实 WhatsApp Web 账号的实时传输通道。                                                                                                                                                                                                                              |
| `qa mantis`                                         | 用于实时传输 bug 的前后验证 runner，包含 Discord 状态回应证据、Crabbox 桌面/浏览器冒烟测试和 Slack-in-VNC 冒烟测试。参见 [Mantis](/zh-CN/concepts/mantis) 和 [Mantis Slack Desktop Runbook](/zh-CN/concepts/mantis-slack-desktop-runbook)。 |

基于配置的 `qa run` 从 `taxonomy.yaml` 读取成员关系，然后通过 `qa suite` 分派解析出的场景。`--surface` 和 `--category` 会筛选所选配置，而不是定义单独的通道。生成的 `qa-evidence.json` 包含配置评分卡摘要，其中有已选类别计数和缺失覆盖率 ID；单个证据条目仍然是测试、覆盖角色和结果的事实来源。分类法功能覆盖率 ID 是精确的证明目标，不是别名。主场景覆盖满足匹配 ID；次要覆盖仍仅供参考。覆盖率 ID 使用带小写字母数字/短横线片段的点分 `namespace.behavior` 形式；配置、表面和类别 ID 仍可使用现有的短横线或点分分类法 ID。精简证据会省略每个条目的 `execution`，并设置 `evidenceMode: "slim"`；`smoke-ci` 默认使用精简模式，`--evidence-mode full` 会恢复完整条目：

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

使用 `smoke-ci` 通过 mock 模型提供商和 Crabline 本地提供商服务器获得确定性的配置证明。使用 `release` 针对实时渠道获取 Stable/LTS 证明。仅在显式需要完整分类法证据运行时使用 `all`；它会选择每个活跃成熟度类别，并可通过 `QA Profile Evidence` 工作流以 `qa_profile=all` 分派。当某个命令还需要 OpenClaw 根配置时，把根配置放在 QA 命令之前：

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 操作员流程

当前 QA 操作员流程是一个双栏 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的转录和场景计划。

运行方式：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动 Docker 支持的 Gateway 网关通道，并暴露 QA Lab 页面，操作员或自动化循环可在其中为智能体提供 QA 任务、观察真实渠道行为，并记录哪些成功、失败或仍处于阻塞状态。

为了在不每次重建 Docker 镜像的情况下更快迭代 QA Lab UI，请用绑定挂载的 QA Lab bundle 启动栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，并且当 QA Lab 资产哈希变化时浏览器会自动重载。

对于本地 OpenTelemetry 信号冒烟测试，运行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动本地 OTLP/HTTP 接收器，在启用 `diagnostics-otel` 插件的情况下运行 `otel-trace-smoke` QA 场景，然后断言 traces、metrics 和日志已导出。它会解码导出的 protobuf trace spans，并检查发布关键形状：必须存在 `openclaw.run`、`openclaw.harness.run`、最新 GenAI 语义约定的模型调用 span、`openclaw.context.assembled` 和 `openclaw.message.delivery`。该冒烟测试强制设置 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，因此模型调用 span 必须使用 `{gen_ai.operation.name} {gen_ai.request.model}` 名称；模型调用在成功轮次上不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性必须留在 trace 之外。原始 OTLP payload 不得包含 prompt sentinel、response sentinel 或 QA 会话键。它会在 QA suite 产物旁写入 `otel-smoke-summary.json`。

对于由 collector 支持的 OpenTelemetry 冒烟测试，运行：

```bash
pnpm qa:otel:collector-smoke
```

该通道会把一个真实的 OpenTelemetry Collector Docker 容器放在同一个本地接收器前面。在更改端点接线、collector 兼容性，或可能被进程内接收器掩盖的 OTLP 导出行为时使用它。

对于受保护的 Prometheus 抓取冒烟测试，运行：

```bash
pnpm qa:prometheus:smoke
```

该别名会在启用 `diagnostics-prometheus` 的情况下运行 `docker-prometheus-smoke` QA 场景，验证未认证的抓取会被拒绝，然后检查已认证的抓取包含发布关键的指标族，且不包含提示内容、响应内容、原始诊断标识符、认证 token 或本地路径。

要连续运行两个可观测性冒烟测试，请使用：

```bash
pnpm qa:observability:smoke
```

对于带收集器的 OpenTelemetry 通道以及受保护的 Prometheus 抓取冒烟测试，请使用：

```bash
pnpm qa:observability:collector-smoke
```

可观测性 QA 仅适用于源代码检出。npm tarball 会有意省略 QA Lab，因此包 Docker 发布通道不会运行 `qa` 命令。更改诊断插桩时，请在已构建的源代码检出中使用 `pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`。

对于不需要模型提供商凭证的真实传输 Matrix 冒烟通道，请使用确定性的 mock OpenAI 提供商运行快速配置：

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

对于 live-frontier 提供商通道，请显式提供 OpenAI 兼容凭证：

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

该通道的完整 CLI 参考、配置/场景目录、环境变量和 artifact 布局位于 [Matrix QA](/zh-CN/concepts/qa-matrix)。简要说明：它会在 Docker 中配置一个一次性 Tuwunel homeserver，注册临时的 driver/SUT/observer 用户，在限定到该传输协议的子 QA Gateway 网关内运行真实 Matrix 插件（不使用 `qa-channel`），然后在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下写入 Markdown 报告、JSON 摘要、observed-events artifact 和合并输出日志。

这些场景覆盖单元测试无法端到端证明的传输行为：提及门控、allow-bot 策略、allowlist、顶层回复和线程回复、私信路由、反应处理、入站编辑抑制、重启回放去重、homeserver 中断恢复、审批元数据投递、媒体处理，以及 Matrix E2EE 引导/恢复/验证流程。E2EE CLI 配置还会通过同一个一次性 homeserver 驱动 `openclaw matrix encryption setup` 和验证命令，然后检查 Gateway 网关回复。

Discord 也有仅 Mantis 的可选 bug 复现场景。使用 `--scenario discord-status-reactions-tool-only` 可运行显式状态反应时间线，或使用 `--scenario discord-thread-reply-filepath-attachment` 创建真实 Discord 线程，并验证 `message.thread-reply` 会保留 `filePath` 附件。这些场景不包含在默认 live Discord 通道中，因为它们是前后对比复现探针，而不是广泛的冒烟覆盖。当 QA 环境中配置了 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 时，线程附件 Mantis 工作流还可以添加已登录的 Discord Web 见证视频。该查看器配置仅用于视觉捕获；通过/失败决策仍来自 Discord REST oracle。

CI 在 `.github/workflows/qa-live-transports-convex.yml` 中使用同一命令表面。定时运行和默认手动运行会使用 QA 提供的 live-frontier 凭证、`--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` 执行快速 Matrix 配置。手动 `matrix_profile=all` 会扇出为五个配置分片。

对于真实传输 Telegram、Discord、Slack 和 WhatsApp 冒烟通道：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

它们面向预先存在的真实渠道，并使用两个 bot 或账号（driver + SUT）。必需的环境变量、场景列表、输出 artifact 和 Convex 凭证池在下方的 [Telegram、Discord、Slack 和 WhatsApp QA 参考](#telegram-discord-slack-and-whatsapp-qa-reference)中说明。

对于带 VNC 救援的完整 Slack 桌面 VM 运行，请运行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

该命令会租用一台 Crabbox 桌面/浏览器机器，在 VM 内运行 Slack live 通道，在 VNC 浏览器中打开 Slack Web，捕获桌面，并在视频捕获可用时将 `slack-qa/`、`slack-desktop-smoke.png` 和 `slack-desktop-smoke.mp4` 复制回 Mantis artifact 目录。Crabbox 桌面/浏览器租约会预先提供捕获工具和浏览器/原生构建辅助包，因此该场景只应在较旧租约上安装 fallback。Mantis 会在 `mantis-slack-desktop-smoke-report.md` 中报告总耗时和各阶段耗时，因此慢速运行可以显示时间是花在租约预热、凭证获取、远程设置还是 artifact 复制上。通过 VNC 手动登录 Slack Web 后，可使用 `--lease-id <cbx_...>` 复用租约；复用的租约也会保持 Crabbox 的 pnpm 存储缓存预热。默认的 `--hydrate-mode source` 会从源代码检出验证，并在 VM 内运行安装/构建。仅当复用的远程工作区已经有 `node_modules` 和已构建的 `dist/` 时，才使用 `--hydrate-mode prehydrated`；该模式会跳过昂贵的安装/构建步骤，并在工作区未就绪时关闭失败。使用 `--gateway-setup` 时，Mantis 会在 VM 内端口 `38973` 上保留一个持久运行的 OpenClaw Slack Gateway 网关；不使用该参数时，命令会运行普通的 bot 到 bot Slack QA 通道，并在 artifact 捕获后退出。

要用桌面证据证明原生 Slack 审批 UI，请运行 Mantis 审批检查点模式：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

该模式与 `--gateway-setup` 互斥。它会运行 Slack 审批场景，拒绝非审批场景 id，在每个待处理和已解决审批状态等待，将观察到的 Slack API 消息渲染到 `approval-checkpoints/<scenario>-pending.png` 和 `approval-checkpoints/<scenario>-resolved.png`，然后在任何检查点、消息证据、确认或渲染截图缺失或为空时失败。冷启动 CI 租约仍可能在 `slack-desktop-smoke.png` 中显示 Slack 登录；审批检查点图像才是该通道的视觉证明。

操作员检查清单、GitHub workflow dispatch 命令、证据评论契约、hydrate-mode 决策表、耗时解读和失败处理步骤位于 [Mantis Slack Desktop Runbook](/zh-CN/concepts/mantis-slack-desktop-runbook)。

对于 Agent/CV 风格的桌面任务，请运行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` 会租用或复用一台 Crabbox 桌面/浏览器机器，启动 `crabbox record --while`，通过嵌套的 `visual-driver` 驱动可见浏览器，捕获 `visual-task.png`，在选择 `--vision-mode image-describe` 时对截图运行 `openclaw infer image describe`，并写入 `visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json` 和 `mantis-visual-task-report.md`。设置 `--expect-text` 时，视觉提示会请求结构化 JSON 判定，并且只有当模型报告正向可见证据时才通过；仅引用目标文本的负面响应会使断言失败。使用 `--vision-mode metadata` 可进行不调用图像理解提供商的无模型冒烟测试，以证明桌面、浏览器、截图和视频管道。录制是 `visual-task` 的必需 artifact；如果 Crabbox 没有录制非空的 `visual-task.mp4`，即使视觉 driver 已通过，任务也会失败。失败时，除非任务已经通过且未设置 `--keep-lease`，Mantis 会为 VNC 保留租约。

使用池化 live 凭证之前，请运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境变量、验证 endpoint 设置，并在存在 maintainer secret 时验证 admin/list 可达性。它仅报告 secret 的已设置/缺失状态。

## Live 传输覆盖

Live 传输通道共享一个契约，而不是各自发明自己的场景列表形状。`qa-channel` 是广泛的合成产品行为套件，不属于 live 传输覆盖矩阵。

Live 传输 runner 应从 `openclaw/plugin-sdk/qa-live-transport-scenarios` 导入共享场景 id、基线覆盖辅助工具和场景选择辅助工具。

| 通道     | Canary | 提及门控 | Bot-to-bot | Allowlist 阻断 | 顶层回复 | 引用回复 | 重启恢复 | 线程跟进 | 线程隔离 | 反应观察 | 帮助命令 | 原生命令注册 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

这会保持 `qa-channel` 作为广泛的产品行为套件，同时让 Matrix、Telegram 和其他 live 传输共享一个显式传输契约检查清单。

对于不把 Docker 带入 QA 路径的一次性 Linux VM 通道，请运行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个新的 Multipass guest，安装依赖，在 guest 内构建 OpenClaw，运行 `qa suite`，然后将普通 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。
它会复用与主机上 `qa suite` 相同的场景选择行为。主机和 Multipass 套件运行默认会使用隔离的 Gateway 网关 worker 并行执行多个选定场景。`qa-channel` 默认并发数为 4，并受选定场景数量上限限制。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。
使用 `--pack personal-agent` 可运行个人助理基准包。包选择器会与重复的 `--scenario` 标志叠加：显式场景先运行，然后包场景按包顺序运行并移除重复项。
当自定义 QA runner 已提供 OpenTelemetry 收集器设置，并希望同时选择 OpenTelemetry 和 Prometheus 诊断冒烟场景时，请使用 `--pack observability`。
任何场景失败时，该命令都会以非零状态退出。当你希望获取 artifact 且不产生失败退出码时，请使用 `--allow-failures`。
Live 运行会转发适用于 guest 的受支持 QA 认证输入：基于环境变量的提供商 key、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便 guest 可以通过挂载的工作区写回。

## Telegram、Discord、Slack 和 WhatsApp QA 参考

Matrix 有一个[专用页面](/zh-CN/concepts/qa-matrix)，因为它的场景数量较多，并且需要基于 Docker 的 homeserver 预配。Telegram、Discord、Slack 和 WhatsApp 针对预先存在的真实传输协议运行，因此它们的参考内容位于此处。

### 共享 CLI 标志

这些通道通过 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，并接受相同的标志：

| 标志                                  | 默认值                                             | 描述                                                                                                                                            |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 仅运行此场景。可重复指定。                                                                                                                      |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 写入报告、摘要、证据、传输协议特定工件和输出日志的位置。相对路径会基于 `--repo-root` 解析。                                                    |
| `--repo-root <path>`                  | `process.cwd()`                                    | 从中立 cwd 调用时的仓库根目录。                                                                                                                 |
| `--sut-account <id>`                  | `sut`                                              | QA Gateway 网关配置中的临时账号 ID。                                                                                                            |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` 或 `live-frontier`（旧版 `live-openai` 仍可使用）。                                                                               |
| `--model <ref>` / `--alt-model <ref>` | provider 默认值                                    | 主/备用模型引用。                                                                                                                               |
| `--fast`                              | 关闭                                               | 支持时启用 provider 快速模式。                                                                                                                  |
| `--credential-source <env\|convex>`   | `env`                                              | 请参阅 [Convex 凭证池](#convex-credential-pool)。                                                                                               |
| `--credential-role <maintainer\|ci>`  | CI 中为 `ci`，否则为 `maintainer`                  | `--credential-source convex` 时使用的角色。                                                                                                     |

任一场景失败时，每个通道都会以非零状态退出。`--allow-failures` 会写入工件，但不会设置失败退出码。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目标是一个真实的私有 Telegram 群组，并使用两个不同的 bot（driver + SUT）。SUT bot 必须有 Telegram 用户名；当两个 bot 都在 `@BotFather` 中启用 **Bot-to-Bot Communication Mode** 时，bot 到 bot 的观察效果最佳。

使用 `--credential-source env` 时必需的环境变量：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数字聊天 ID（字符串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

场景（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`）：

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

隐式默认集合始终覆盖 canary、mention gating、原生命令回复、命令寻址，以及 bot 到 bot 群组回复。`mock-openai` 默认值还包括确定性的回复链和最终消息流式传输检查。`telegram-current-session-status-tool` 保持为选择启用，因为它仅在 canary 之后直接串接时稳定，而不是在任意原生命令回复之后稳定。使用 `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` 打印当前默认/可选拆分及回归引用。

输出工件：

- `telegram-qa-report.md`
- `qa-evidence.json` - 实时传输协议检查的证据条目，包括 profile、coverage、provider、channel、artifacts、result 和 RTT 字段。

包 Telegram 运行使用相同的 Telegram 凭证契约。重复 RTT
测量是常规包 Telegram 实时通道的一部分；RTT
分布会折叠进所选 RTT 检查的 `qa-evidence.json` 中的 `result.timing`。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 时，包实时包装器会租用一个 `kind: "telegram"` 凭证，将租用的群组/driver/SUT bot
环境变量导出到已安装包的运行中，对租约发送 Heartbeat，并在关闭时释放。选择 Convex 时，包包装器默认在 CI 外使用 Convex 角色
`maintainer`，并对 `telegram-mentioned-message-reply` 执行 20 次 RTT 检查，RTT 超时为 30 秒。覆盖
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
或 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` 可调整 RTT 测量，而无需创建单独的 RTT 命令或 Telegram 专用摘要格式。

### Discord QA

```bash
pnpm openclaw qa discord
```

目标是一个真实的私有 Discord guild channel，并使用两个 bot：一个由 harness 控制的 driver bot，以及一个由子 OpenClaw Gateway 网关通过内置 Discord 插件启动的 SUT bot。验证频道 mention 处理、SUT bot 是否已向 Discord 注册原生 `/help` 命令，以及选择启用的 Mantis 证据场景。

使用 `--credential-source env` 时必需的环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必须匹配 Discord 返回的 SUT bot 用户 ID（否则通道会快速失败）。

可选：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 会在 observed-message 工件中保留消息正文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 为 `discord-voice-autojoin` 选择语音/舞台频道；如果未设置，场景会选择 SUT bot 可见的第一个语音/舞台频道。

场景（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 选择启用的语音场景。单独运行，启用 `channels.discord.voice.autoJoin`，并验证 SUT bot 当前的 Discord 语音状态是目标语音/舞台频道。Convex Discord 凭证可以包含可选的 `voiceChannelId`；否则 runner 会发现 guild 中第一个可见的语音/舞台频道。
- `discord-status-reactions-tool-only` - 选择启用的 Mantis 场景。单独运行，因为它会将 SUT 切换为始终开启、仅工具的 guild 回复，并设置 `messages.statusReactions.enabled=true`，然后捕获 REST reaction 时间线以及 HTML/PNG 可视化工件。Mantis 前后报告也会将场景提供的 MP4 工件保留为 `baseline.mp4` 和 `candidate.mp4`。

显式运行 Discord 语音自动加入场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

显式运行 Mantis 状态 reaction 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

输出工件：

- `discord-qa-report.md`
- `qa-evidence.json` - 实时传输协议检查的证据条目。
- `discord-qa-observed-messages.json` - 除非设置 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否则正文会被遮盖。
- 运行状态 reaction 场景时生成 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目标是一个真实的私有 Slack 频道，并使用两个不同的 bot：一个由 harness 控制的 driver bot，以及一个由子 OpenClaw Gateway 网关通过内置 Slack 插件启动的 SUT bot。

使用 `--credential-source env` 时必需的环境变量：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

可选：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 会在 observed-message 工件中保留消息正文。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 为 Mantis 启用可视化审批
  检查点。runner 会写入 `<scenario>.pending.json` 和
  `<scenario>.resolved.json`，然后等待匹配的 `.ack.json` 文件。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` 覆盖检查点
  确认超时。默认值为 `120000`。

场景（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - 选择启用的原生 Slack exec 审批场景。
  通过 Gateway 网关请求 exec 审批，验证 Slack 消息包含
  原生审批按钮，解决它，并验证已解决的 Slack 更新。
- `slack-approval-plugin-native` - 选择启用的原生 Slack 插件审批场景。
  同时启用 exec 和插件审批转发，使插件事件不会被
  exec 审批路由抑制，然后验证相同的待处理/已解决
  原生 Slack UI 路径。

输出工件：

- `slack-qa-report.md`
- `qa-evidence.json` - 实时传输协议检查的证据条目。
- `slack-qa-observed-messages.json` - 除非设置 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否则正文会被遮盖。
- `approval-checkpoints/` - 仅当 Mantis 设置
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 时存在；包含检查点 JSON、
  确认 JSON，以及待处理/已解决截图。

#### 设置 Slack 工作区

该通道需要在一个工作区中有两个不同的 Slack app，以及一个两个 bot 都是成员的频道：

- `channelId` - 两个 bot 都已被邀请加入的频道的 `Cxxxxxxxxxx` ID。请使用专用频道；该通道每次运行都会发帖。
- `driverBotToken` - **Driver** app 的 bot token（`xoxb-...`）。
- `sutBotToken` - **SUT** app 的 bot token（`xoxb-...`），它必须是不同于 driver 的单独 Slack app，这样其 bot 用户 ID 才不同。
- `sutAppToken` - SUT app 的 app-level token（`xapp-...`），带有 `connections:write`，Socket Mode 使用它让 SUT app 能够接收事件。

建议使用专用于 QA 的 Slack 工作区，而不是复用生产工作区。

下面的 SUT manifest 有意将内置 Slack 插件的生产安装（`extensions/slack/src/setup-shared.ts:10`）缩窄到实时 Slack QA 套件覆盖的权限和事件。用户看到的生产频道设置请参阅 [Slack 频道快速设置](/zh-CN/channels/slack#quick-setup)；QA Driver/SUT 对有意分离，因为该通道需要在一个工作区中有两个不同的 bot 用户 ID。

**1. 创建 Driver app**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _创建新应用_ → _从清单创建_ → 选择 QA 工作区，粘贴以下清单，然后 _安装到工作区_：

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

复制 _Bot 用户 OAuth 令牌_（`xoxb-...`）- 它会成为 `driverBotToken`。驱动只需要发布消息并识别自身；不需要事件，也不需要 Socket Mode。

**2. 创建 SUT 应用**

在同一工作区中重复 _创建新应用 → 从清单创建_。这个 QA 应用有意使用内置 Slack 插件生产清单（`extensions/slack/src/setup-shared.ts:10`）的更窄版本：省略了 reaction 作用域和事件，因为实时 Slack QA 套件尚未覆盖 reaction 处理。

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Slack 创建应用后，在它的设置页面执行两件事：

- _安装到工作区_ → 复制 _Bot 用户 OAuth 令牌_ → 它会成为 `sutBotToken`。
- _基本信息 → 应用级令牌 → 生成令牌和作用域_ → 添加作用域 `connections:write` → 保存 → 复制 `xapp-...` 值 → 它会成为 `sutAppToken`。

分别在每个令牌上调用 `auth.test`，验证两个 bot 拥有不同的用户 ID。运行时通过用户 ID 区分驱动和 SUT；为两者复用同一个应用会立即导致提及门控失败。

**3. 创建渠道**

在 QA 工作区中创建一个渠道（例如 `#openclaw-qa`），并从渠道内部邀请两个 bot：

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

从 _渠道信息 → 关于 → 渠道 ID_ 复制 `Cxxxxxxxxxx` ID - 它会成为 `channelId`。公共渠道可以使用；如果你使用私有渠道，两个应用都已经拥有 `groups:history`，因此 harness 的历史读取仍会成功。

**4. 注册凭证**

有两个选项。单机调试使用环境变量（设置四个 `OPENCLAW_QA_SLACK_*` 变量并传入 `--credential-source env`），或填充共享 Convex 池，使 CI 和其他维护者可以租用它们。

对于 Convex 池，将四个字段写入 JSON 文件：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在你的 shell 中导出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 后，注册并验证：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

预期 `count: 1`、`status: "active"`，且没有 `lease` 字段。

**5. 端到端验证**

在本地运行该通道，确认两个 bot 可以通过代理彼此通信：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

绿色运行会在远少于 30 秒内完成，并且 `slack-qa-report.md` 会显示 `slack-canary` 和 `slack-mention-gating` 的状态均为 `pass`。如果该通道挂起约 90 秒并以 `Convex credential pool exhausted for kind "slack"` 退出，要么池为空，要么每一行都已被租用 - `qa credentials list --kind slack --status all --json` 会告诉你是哪种情况。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

目标是两个专用 WhatsApp Web 账号：一个由 harness 控制的驱动账号，以及一个由子 OpenClaw Gateway 网关通过内置 WhatsApp 插件启动的 SUT 账号。

使用 `--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

可选：

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` 启用群组场景，例如
  `whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-broadcast-group-fanout`、`whatsapp-group-activation-always`、
  `whatsapp-group-reply-to-bot-triggers`、群组操作/媒体/投票场景，以及
  `whatsapp-group-allowlist-block`。
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` 会在
  observed-message 工件中保留消息正文。

场景目录（`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`）：

- 基线和群组门控：`whatsapp-canary`、`whatsapp-pairing-block`、
  `whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-group-activation-always`、
  `whatsapp-group-reply-to-bot-triggers`、
  `whatsapp-top-level-reply-shape`、`whatsapp-restart-resume`、
  `whatsapp-group-allowlist-block`。
- 原生命令：`whatsapp-help-command`、`whatsapp-status-command`、
  `whatsapp-commands-command`、`whatsapp-tools-compact-command`、
  `whatsapp-whoami-command`、`whatsapp-context-command`、
  `whatsapp-native-new-command`。
- 回复和最终输出行为：`whatsapp-tool-only-usage-footer`、
  `whatsapp-reply-to-message`、`whatsapp-group-reply-to-message`、
  `whatsapp-reply-to-mode-batched`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`、`whatsapp-stream-final-message-accounting`。
- 用户路径消息操作：`whatsapp-agent-message-action-react` 从真实的驱动私信开始，
  让模型调用 `message` 工具，并观察原生 WhatsApp reaction。
  `whatsapp-agent-message-action-upload-file` 对 `message(action=upload-file)` 使用
  相同姿态，并观察原生 WhatsApp 媒体。`whatsapp-group-agent-message-action-react` 和
  `whatsapp-group-agent-message-action-upload-file` 在真实 WhatsApp 群组中证明相同的用户可见
  操作。
- 群组扇出：`whatsapp-broadcast-group-fanout` 从一条被提及的
  WhatsApp 群组消息开始，并验证来自 `main` 和
  `qa-second` 的不同可见回复。
- 群组激活：`whatsapp-group-activation-always` 将真实群组
  会话改为 `/activation always`，证明未提及的群组消息会唤醒
  智能体，然后恢复为 `/activation mention`。`whatsapp-group-reply-to-bot-triggers`
  预置一条 bot 回复，在没有显式
  提及的情况下发送对它的原生引用回复，并验证智能体会从该回复上下文中唤醒。
- 入站媒体和结构化消息：`whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。
  这些场景通过驱动发送真实的 WhatsApp 图片、音频、文档、位置、联系人、贴纸
  和 reaction 事件。
- 直接 Gateway 网关契约探针：
  `whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、
  `whatsapp-message-actions`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`。这些场景有意绕过模型提示，并
  证明确定性的 Gateway 网关/渠道 `send`、`poll` 和 `message.action`
  契约。
- 访问控制覆盖：`whatsapp-access-control-dm-open`、
  `whatsapp-access-control-dm-disabled`、`whatsapp-access-control-group-open`、
  `whatsapp-access-control-group-disabled`、`whatsapp-group-allowlist-block`。
- 原生审批：`whatsapp-approval-exec-deny-native`、
  `whatsapp-approval-exec-native`、`whatsapp-approval-exec-reaction-native`、
  `whatsapp-approval-exec-group-reaction-native`、
  `whatsapp-approval-plugin-native`。
- 状态 reaction：`whatsapp-status-reactions`、
  `whatsapp-status-reaction-lifecycle`。

该目录目前包含 50 个场景。`live-frontier` 默认通道保持较小规模，包含 10 个场景，用于快速冒烟覆盖。`mock-openai` 默认通道通过真实 WhatsApp 传输运行 44 个确定性场景，同时只模拟模型输出。审批场景和少数较重/阻塞的检查仍需按场景 ID 显式运行。

WhatsApp QA 驱动会观察结构化实时事件（`text`、`media`、`location`、`reaction` 和 `poll`），并且可以主动发送媒体、投票、联系人、位置和贴纸。QA Lab 通过 `@openclaw/whatsapp/api.js` 包表面导入该驱动，而不是进入私有 WhatsApp 运行时文件。对于群组观察，`fromJid` 是群组 JID，而 `participantJid` 和 `fromPhoneE164` 标识参与者发送者。默认会编辑隐藏消息内容。直接 Gateway 网关
投票、upload-file、媒体、群组投票、群组媒体和回复形状探针是传输/API 契约
检查；它们不会被视为用户提示让智能体选择
相同操作的证明。用户路径操作证明来自诸如
`whatsapp-agent-message-action-react` 和
`whatsapp-group-agent-message-action-react` 的场景，在这些场景中，驱动会发送普通
WhatsApp 消息，QA Lab 会观察生成的原生 WhatsApp 工件。
WhatsApp 报告包含每个场景的姿态（`user-path`、`direct-gateway`
或 `native-approval`），因此证据不会被误认为证明了比实际更强的契约。

输出工件：

- `whatsapp-qa-report.md`
- `qa-evidence.json` - 实时传输检查的证据条目。
- `whatsapp-qa-observed-messages.json` - 除非设置 `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`，否则正文会被编辑隐藏。

### Convex 凭证池

Telegram、Discord、Slack 和 WhatsApp 通道可以从共享 Convex 池租用凭证，而不是读取上面的环境变量。传入 `--credential-source convex`（或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 会获取独占租约，在运行期间对其发送 Heartbeat，并在关闭时释放它。池类型为 `"telegram"`、`"discord"`、`"slack"` 和 `"whatsapp"`。

代理在 `admin/add` 上验证的 payload 形状：

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` 必须是数字形式的 chat-id 字符串。
- Telegram 真实用户 (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - 仅用于 Mantis Telegram Desktop 证明。通用 QA Lab 通道不得获取此类型。
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - 电话号码必须是彼此不同的 E.164 字符串。

Mantis Telegram Desktop 证明工作流会为 TDLib CLI 驱动和 Telegram Desktop 见证程序持有一个独占的 Convex `telegram-user` 租约，然后在发布证明后释放它。

当 PR 需要确定性的视觉差异时，Mantis 可以在 `main` 和 PR 头部使用相同的模拟模型回复，同时 Telegram 格式化器或投递层发生变化。捕获默认值针对 PR 评论做了调优：标准 Crabbox 类别、24fps 桌面录制、24fps 动态 GIF，以及 1920px 预览宽度。前后对比评论应发布一个干净的包，其中只包含预期的 GIF。

Slack 通道也可以使用该池。Slack 载荷形状检查目前位于 Slack QA runner 中，而不是 broker 中；使用 `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`，并使用类似 `Cxxxxxxxxxx` 的 Slack 频道 ID。有关应用和 scope 预配，请参阅[设置 Slack 工作区](#setting-up-the-slack-workspace)。

操作性环境变量和 Convex broker 端点契约位于[测试 → 通过 Convex 共享 Telegram 凭据](/zh-CN/help/testing#shared-telegram-credentials-via-convex-v1)（该章节名称早于多频道池；租约语义在各类型之间共享）。

## 由仓库支持的种子数据

种子资产位于 `qa/`：

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

这些文件有意放在 git 中，以便 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为通用 YAML 场景 runner。每个场景 YAML 文件都是一次测试运行的事实来源，并应定义：

- 顶层 `title`
- `scenario` 元数据
- `scenario` 中可选的类别、能力、通道和风险元数据
- `scenario` 中的文档和代码引用
- `scenario` 中可选的插件要求
- `scenario` 中可选的 Gateway 网关配置补丁
- 用于 flow 场景的可执行顶层 `flow`，或用于 Vitest 和 Playwright 场景的 `scenario.execution.kind` / `scenario.execution.path`

支撑 `flow` 的可复用运行时表面可以保持通用和跨领域。例如，YAML 场景可以组合传输侧 helper 与浏览器侧 helper，后者通过 Gateway 网关 `browser.request` seam 驱动嵌入式 Control UI，而无需添加特例 runner。

场景文件应按产品能力分组，而不是按源代码树文件夹分组。文件移动时保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 实现实现可追溯性。

基线列表应保持足够广泛，以覆盖：

- 私信和频道聊天
- 线程行为
- 消息动作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体交接
- 仓库读取和文档读取
- 一个小型构建任务，例如 Lobster Invaders

## 提供商模拟通道

`qa suite` 有两个本地提供商模拟通道：

- `mock-openai` 是感知场景的 OpenClaw 模拟。它仍是由仓库支持的 QA 和一致性门控的默认确定性模拟通道。
- `aimock` 会启动一个由 AIMock 支撑的提供商服务器，用于实验性协议、fixture、录制/回放和 chaos 覆盖。它是增量能力，不会替代 `mock-openai` 场景调度器。

提供商通道实现位于 `extensions/qa-lab/src/providers/` 下。每个提供商拥有自己的默认值、本地服务器启动、Gateway 网关模型配置、auth-profile 暂存需求，以及 live/mock 能力标志。共享 suite 和 Gateway 网关代码应通过提供商注册表路由，而不是按提供商名称分支。

## 传输适配器

`qa-lab` 拥有用于 YAML QA 场景的通用传输 seam。`qa-channel` 是合成默认值。`crabline` 启动本地提供商形态的服务器，并让 OpenClaw 的常规渠道插件对其运行。`live` 保留给真实提供商凭据和外部渠道使用。

在架构层面，拆分如下：

- `qa-lab` 拥有通用场景执行、worker 并发、工件写入和报告。
- 传输适配器拥有 Gateway 网关配置、就绪状态、入站和出站观测、传输动作，以及规范化传输状态。
- `qa/scenarios/` 下的 YAML 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时表面。

### 添加渠道

向 YAML QA 系统添加渠道需要渠道实现，以及一个用于验证渠道契约的场景包。对于 smoke CI 覆盖，请添加匹配的 Crabline 本地提供商服务器，并通过 `crabline` 驱动公开它。

当共享 `qa-lab` 宿主可以拥有该 flow 时，不要添加新的顶层 QA 命令根。

`qa-lab` 拥有共享宿主机制：

- `openclaw qa` 命令根
- suite 启动和清理
- worker 并发
- 工件写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容别名

Runner 插件拥有传输契约：

- `openclaw qa <runner>` 如何挂载在共享 `qa` 根下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何公开 transcript 和规范化传输状态
- 如何执行由传输支撑的动作
- 如何处理特定于传输的重置或清理

新渠道的最低采用门槛：

1. 保持 `qa-lab` 作为共享 `qa` 根的所有者。
2. 在共享 `qa-lab` 宿主 seam 上实现传输 runner。
3. 将特定于传输的机制保留在 runner 插件或渠道 harness 内。
4. 将 runner 挂载为 `openclaw qa <runner>`，而不是注册竞争性的根命令。Runner 插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；懒加载 CLI 和 runner 执行应留在独立入口点之后。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或改编 YAML 场景。
6. 对新场景使用通用场景 helper。
7. 除非仓库正在进行有意迁移，否则保持现有兼容别名可用。

决策规则很严格：

- 如果行为可以在 `qa-lab` 中表达一次，就放在 `qa-lab` 中。
- 如果行为依赖某一个渠道传输，就将其保留在对应 runner 插件或插件 harness 中。
- 如果某个场景需要一种多个渠道都可使用的新能力，请添加通用 helper，而不是在 `suite.ts` 中添加特定于渠道的分支。
- 如果某个行为仅对一种传输有意义，请保持场景特定于传输，并在场景契约中明确说明。

### 场景 helper 名称

新场景首选的通用 helper：

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

兼容别名仍可用于现有场景 - `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` - 但新的场景编写应使用通用名称。这些别名的存在是为了避免一次性迁移，而不是作为后续模型。

## 报告

`qa-lab` 从观测到的 bus 时间线导出 Markdown 协议报告。该报告应回答：

- 哪些有效
- 哪些失败
- 哪些仍被阻塞
- 哪些后续场景值得添加

要查看可用场景清单，用于评估后续工作规模或接入新传输时，请运行 `pnpm openclaw qa coverage`（添加 `--json` 可获得机器可读输出）。
为受影响行为或文件路径选择聚焦证明时，请运行 `pnpm openclaw qa coverage --match <query>`。
匹配报告会搜索场景元数据、文档引用、代码引用、覆盖 ID、插件和提供商要求，然后打印匹配的 `qa suite --scenario ...` 目标。
每次 `qa suite` 运行都会为选定场景集写入顶层 `qa-evidence.json`、`qa-suite-summary.json` 和 `qa-suite-report.md` 工件。声明 `execution.kind: vitest` 或 `execution.kind: playwright` 的场景会运行匹配的测试路径，并且还会写入每个场景的日志。声明 `execution.kind: script` 的场景会通过 `node --import tsx` 运行位于 `execution.path` 的证据生成器（`execution.args` 中的 `${outputDir}` 和 `${scenarioId}` 会被展开）；生成器会写入自己的 `qa-evidence.json`，其条目会被导入 suite 输出，并且其工件路径会相对于该生成器的 `qa-evidence.json` 解析。当通过 `qa run --qa-profile` 到达 `qa suite` 时，同一个 `qa-evidence.json` 还会包含所选分类法类别的 profile 评分卡摘要。
把它视为发现辅助，而不是门控替代；所选场景仍然需要适合被测行为的提供商模式、live 传输、Multipass、Testbox 或发布通道。
有关评分卡上下文，请参阅[成熟度评分卡](/zh-CN/maturity/scorecard)。

对于字符和风格检查，请在多个 live 模型引用上运行同一场景，并写入经过评判的 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

该命令运行本地 QA Gateway 网关子进程，而不是 Docker。角色评测场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。不应告知候选模型它正在接受评测。该命令会保留每份完整 transcript，记录基本运行统计信息，然后以 fast 模式请求 judge 模型，并在支持时使用 `xhigh` reasoning，按自然度、氛围和幽默感对运行结果排序。比较提供商时使用 `--blind-judge-models`：judge prompt 仍会获得每份 transcript 和运行状态，但候选引用会替换为中性标签，例如 `candidate-01`；报告会在解析后将排名映射回真实引用。

候选运行默认使用 `high` thinking，GPT-5.5 使用 `medium`，支持它的旧版 OpenAI eval 引用使用 `xhigh`。使用 `--model provider/model,thinking=<level>` 内联覆盖特定候选。`--thinking <level>` 仍会设置全局 fallback，旧版 `--model-thinking <provider/model=level>` 形式会保留以兼容。

OpenAI 候选引用默认使用 fast 模式，以便在提供商支持时使用优先处理。当单个候选或 judge 需要覆盖时，内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅当你想为每个候选模型强制启用 fast 模式时，才传入 `--fast`。候选和 judge 的持续时间会记录在报告中用于基准分析，但 judge prompt 会明确说明不要按速度排名。

候选和 judge 模型运行默认并发数均为 16。当提供商限制或本地 Gateway 网关压力使运行噪声过大时，请降低 `--concurrency` 或 `--judge-concurrency`。

未传入候选 `--model` 时，角色评测默认使用 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。

未传入 `--judge-model` 时，judge 默认使用 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-8,thinking=high`。

## 相关文档

- [Matrix QA](/zh-CN/concepts/qa-matrix)
- [成熟度评分卡](/zh-CN/maturity/scorecard)
- [个人智能体基准测试包](/zh-CN/concepts/personal-agent-benchmark-pack)
- [QA Channel](/zh-CN/channels/qa-channel)
- [测试](/zh-CN/help/testing)
- [仪表盘](/zh-CN/web/dashboard)
