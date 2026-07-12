---
read_when:
    - 了解 QA 技术栈如何协同工作
    - 扩展 qa-lab、qa-channel 或传输适配器
    - 添加由仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表盘构建更高真实度的 QA 自动化
summary: QA 栈概览：qa-lab、qa-channel、仓库支持的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-07-12T21:23:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f82422737f5151bb971e93f830e3e7139c6f60887a33206d5d44259e4f5e51e7
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 栈以贴近真实渠道的方式对 OpenClaw 进行测试，这是单元测试无法做到的。

组成部分：

- `extensions/qa-channel`：合成消息渠道，涵盖私信、频道、线程、表情回应、编辑和删除。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察对话记录、注入入站消息并导出 Markdown 报告。
- `extensions/qa-matrix`：实时传输适配器，在子 QA Gateway 网关中驱动真正的 Matrix 插件。
- `qa/`：仓库支持的种子资源，用于启动任务和基线 QA 场景。
- [Mantis](/zh-CN/concepts/mantis)：针对需要真实传输协议、浏览器截图、虚拟机状态和 PR 证据的错误，进行修复前后的实时验证。

## 命令界面

每个 QA 流程都在 `pnpm openclaw qa <subcommand>` 下运行。许多流程都有 `pnpm qa:*` 脚本别名；两种形式均可使用。

| 命令                                                | 用途                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 不带 `--qa-profile` 时执行内置 QA 自检；带 `--qa-profile smoke-ci`、`--qa-profile release` 或 `--qa-profile all` 时运行由分类法支持的成熟度配置文件。                                                                                                                |
| `qa suite`                                          | 针对 QA Gateway 网关通道运行仓库支持的场景。`--runner multipass` 使用一次性 Linux 虚拟机，而非宿主机。                                                                                                                                                               |
| `qa coverage`                                       | 输出 YAML 场景覆盖清单（使用 `--json` 输出机器可读内容；使用 `--match <query>` 查找与所触及行为对应的场景；使用 `--tools` 查看运行时工具夹具覆盖情况）。                                                                                                             |
| `qa parity-report`                                  | 比较两个 `qa-suite-summary.json` 文件，以执行模型维度一致性门禁；或使用 `--runtime-axis --token-efficiency` 写入 Codex 与 OpenClaw 的运行时一致性和令牌效率报告。                                                                                                    |
| `qa confidence-report`                              | 根据清单对 QA 证明工件进行分类，生成未知项为零的置信度报告。                                                                                                                                                                                                        |
| `qa confidence-self-test`                           | 写入预置的负对照金丝雀，证明置信度门禁能够检测漂移。                                                                                                                                                                                                                |
| `qa jsonl-replay`                                   | 通过运行时一致性重放测试框架重放精选的 JSONL 对话记录。                                                                                                                                                                                                             |
| `qa character-eval`                                 | 跨多个实时模型运行角色 QA 场景，并生成经过评判的报告。参见[报告](#reporting)。                                                                                                                                                                                      |
| `qa manual`                                         | 针对所选提供商/模型通道运行一次性提示词。                                                                                                                                                                                                                           |
| `qa ui`                                             | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                        |
| `qa docker-build-image`                             | 构建预烘焙的 QA Docker 镜像。                                                                                                                                                                                                                                       |
| `qa docker-scaffold`                                | 为 QA 仪表板和 Gateway 网关通道写入 docker-compose 脚手架。                                                                                                                                                                                                         |
| `qa up`                                             | 构建 QA 站点、启动由 Docker 支持的栈并输出 URL（别名：`pnpm qa:lab:up`；`:fast` 变体添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                                   |
| `qa aimock`                                         | 仅启动 AIMock 提供商服务器。                                                                                                                                                                                                                                        |
| `qa mock-openai`                                    | 仅启动可感知场景的 `mock-openai` 提供商服务器。                                                                                                                                                                                                                     |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享的 Convex 凭据池。                                                                                                                                                                                                                                          |
| `qa discord`                                        | 针对真实私有 Discord 服务器频道的实时传输通道。                                                                                                                                                                                                                     |
| `qa matrix`                                         | 针对一次性 Tuwunel 主服务器的实时传输通道。参见 [Matrix QA](/zh-CN/concepts/qa-matrix)。                                                                                                                                                                                   |
| `qa slack`                                          | 针对真实私有 Slack 频道的实时传输通道。                                                                                                                                                                                                                             |
| `qa telegram`                                       | 针对真实私有 Telegram 群组的实时传输通道。                                                                                                                                                                                                                          |
| `qa whatsapp`                                       | 针对真实 WhatsApp Web 账户的实时传输通道。                                                                                                                                                                                                                          |
| `qa mantis`                                         | 用于实时传输错误的修复前后验证运行器，包含 Discord 状态表情回应证据、Crabbox 桌面/浏览器冒烟测试和 VNC 中的 Slack 冒烟测试。参见 [Mantis](/zh-CN/concepts/mantis) 和 [Mantis Slack 桌面运行手册](/zh-CN/concepts/mantis-slack-desktop-runbook)。 |

`qa matrix` 注册为运行器插件（`extensions/qa-matrix`）；以上其他通道均直接内置于 `qa-lab`。

### 由配置文件支持的 `qa run`

由配置文件支持的 `qa run` 从 `taxonomy.yaml` 读取成员关系，然后通过 `qa suite` 分派解析出的场景。`--surface` 和 `--category` 用于筛选所选配置文件，而不是定义单独的通道。生成的 `qa-evidence.json` 包含配置文件评分卡摘要，其中列出了所选类别的数量和缺失的覆盖 ID；各个证据条目仍然是测试、覆盖角色和结果的事实依据。分类法功能覆盖 ID 是精确的证明目标，而非别名：主要场景覆盖满足匹配的 ID，次要覆盖仅作为参考。覆盖 ID 采用点分隔的 `namespace.behavior` 形式，其中各段由小写字母数字字符或连字符组成；配置文件、表面和类别 ID 仍可使用现有的连字符或点分隔分类法 ID。

精简证据会省略每个条目的 `execution`，并设置 `evidenceMode: "slim"`；`smoke-ci` 默认使用精简模式，`--evidence-mode full` 可恢复完整条目：

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

使用 `smoke-ci` 搭配模拟模型提供商和 Crabline 本地提供商服务器，获得确定性的配置文件证明。使用 `release` 针对实时渠道执行 Stable/LTS 证明。仅在明确需要完整分类法证据运行时使用 `all`；它会选择每个活跃的成熟度类别，并可通过 `QA
Profile Evidence` GitHub Actions 工作流搭配 `qa_profile=all` 进行分派。当命令还需要 OpenClaw 根配置文件时，请将根配置文件放在 QA 命令之前：

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 操作员流程

当前 QA 操作员流程采用双窗格 QA 站点：

- 左侧：包含智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的对话记录和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

该命令会构建 QA 站点、启动由 Docker 支持的 Gateway 网关通道，并公开 QA Lab 页面；操作员或自动化循环可在该页面向智能体分配 QA 任务、观察真实渠道行为，并记录哪些内容正常工作、失败或仍被阻塞。

为了更快地迭代 QA Lab UI，而无需每次都重新构建 Docker 镜像，请使用绑定挂载的 QA Lab 软件包启动该栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 使用预构建镜像保持 Docker 服务运行，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在发生更改时重新构建该软件包，当 QA Lab 资源哈希发生变化时，浏览器会自动重新加载。

### 可观测性冒烟测试

<Note>
可观测性 QA 仅限源代码检出环境。npm tarball 会有意省略 QA Lab（以及 `qa-channel`/`qa-matrix`），因此软件包 Docker 发布通道不会运行 `qa` 命令。更改诊断插桩时，请从已构建的源代码检出环境运行这些命令。
</Note>

| 别名                                    | 运行内容                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | 本地 OpenTelemetry 接收器，以及启用了 `diagnostics-otel` 的 `otel-trace-smoke` 场景。                                                   |
| `pnpm qa:otel:collector-smoke`          | 在真实 OpenTelemetry Collector Docker 容器后运行相同测试通道。更改端点连接或收集器/OTLP 兼容性时使用。                                   |
| `pnpm qa:prometheus:smoke`              | 启用了 `diagnostics-prometheus` 的 `docker-prometheus-smoke` 场景。                                                                     |
| `pnpm qa:observability:smoke`           | 先运行 `qa:otel:smoke`，再运行 `qa:prometheus:smoke`。                                                                                  |
| `pnpm qa:observability:collector-smoke` | 先运行 `qa:otel:collector-smoke`，再运行 `qa:prometheus:smoke`。                                                                        |

`qa:otel:smoke` 会启动本地 OTLP/HTTP 接收器，运行一个最小的 QA 渠道
智能体轮次，然后断言跟踪、指标和日志均已导出。它会解码
导出的 protobuf 跟踪跨度，并检查发布关键结构：
`openclaw.run`、`openclaw.harness.run`、使用最新 GenAI 语义约定的
模型调用跨度、`openclaw.context.assembled` 和 `openclaw.message.delivery`
必须全部存在。该冒烟测试会强制设置
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，因此模型调用
跨度必须使用 `{gen_ai.operation.name} {gen_ai.request.model}` 名称；成功轮次中的模型
调用不得导出 `StreamAbandoned`；原始诊断
ID 和 `openclaw.content.*` 属性不得出现在跟踪中。该场景的
提示词要求模型回复固定标记，并且不输出固定的
密钥字符串；原始 OTLP 载荷不得包含其中任何一个，也不得包含从场景 ID
派生的 QA 会话密钥。它会在 QA 套件工件旁写入 `otel-smoke-summary.json`。

`qa:prometheus:smoke` 会验证未经身份验证的抓取被拒绝，然后
检查经过身份验证的抓取包含发布关键指标族，且不包含
提示词内容、响应内容、原始诊断标识符、身份验证
令牌或本地路径。

### Matrix 冒烟测试通道

如需运行不要求模型提供商凭据且使用真实传输的 Matrix 冒烟测试通道，
请使用确定性的模拟 OpenAI provider 运行快速配置：

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

对于实时前沿提供商测试通道，请显式提供 OpenAI 兼容凭据：

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

此测试通道的完整 CLI 参考、配置/场景目录、环境变量和工件
布局见 [Matrix QA](/zh-CN/concepts/qa-matrix)。简而言之：它会
在 Docker 中预配一个一次性 Tuwunel 主服务器，注册临时
驱动程序/SUT/观察者用户，在限定于该传输方式的子 QA
Gateway 网关内运行真实 Matrix 插件（不使用 `qa-channel`），然后在
`.artifacts/qa-e2e/matrix-<timestamp>/` 下写入 Markdown
报告、JSON 摘要、观察事件工件和合并输出日志。

这些场景涵盖单元测试无法端到端证明的传输行为：
提及门控、允许 Bot 策略、允许列表、顶层回复和话题串
回复、私信路由、表情回应处理、入站编辑抑制、重启后
重放去重、主服务器中断恢复、审批元数据传递、
媒体处理，以及 Matrix E2EE 引导/恢复/验证流程。
E2EE CLI 配置还会通过同一个一次性主服务器执行
`openclaw matrix encryption setup` 和验证命令，然后再检查
Gateway 网关回复。

CI 在
`.github/workflows/qa-live-transports-convex.yml` 中使用相同的命令接口。定时运行和默认
手动运行使用 QA 提供的实时前沿
凭据、`--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`
执行快速 Matrix 配置。
手动设置 `matrix_profile=all` 会分散为五个配置分片：`transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli`。

### Discord Mantis 场景

Discord 还提供仅限 Mantis 的可选场景，用于复现错误。使用
`--scenario discord-status-reactions-tool-only` 可运行明确的状态
表情回应时间线，或使用 `--scenario discord-thread-reply-filepath-attachment`
创建真实的 Discord 话题串，并验证 `message.thread-reply`
会保留 `filePath` 附件。这些场景不包含在默认
实时 Discord 测试通道中，因为它们是修复前后复现探针，而不是
广泛的冒烟测试覆盖。配置 QA
环境中的 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 后，话题串附件 Mantis 工作流还可以添加
已登录 Discord Web 的见证视频。该查看器配置仅用于视觉捕获；
通过/失败判定仍由 Discord REST 预言机作出。

对于使用真实传输的 Discord、Slack、Telegram 和 WhatsApp 冒烟测试通道：

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

它们以具有两个 Bot 或账号（驱动程序 +
SUT）的预先存在的真实渠道为目标。所需环境变量、场景列表、输出工件和 Convex
凭据池记录在下方的
[Discord、Slack、Telegram 和 WhatsApp QA 参考](#discord-slack-telegram-and-whatsapp-qa-reference)
中。

### Mantis Slack 桌面端和视觉任务运行器

要通过带 VNC 救援功能的完整 Slack 桌面虚拟机运行，请执行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

该命令会租用一台 Crabbox 桌面/浏览器机器，在虚拟机内运行 Slack 实时通道，在 VNC 浏览器中打开 Slack Web，捕获桌面，并将 `slack-qa/`、`slack-desktop-smoke.png` 和 `slack-desktop-smoke.mp4`（视频捕获可用时）复制回 Mantis 工件目录。Crabbox 桌面/浏览器租约会预先提供捕获工具以及浏览器/原生构建辅助软件包，因此场景只应在较旧的租约上安装后备项。Mantis 会在 `mantis-slack-desktop-smoke-report.md` 中报告总计和各阶段耗时，以便在运行缓慢时判断时间消耗在租约预热、凭据获取、远程设置还是工件复制上。通过 VNC 手动登录 Slack Web 后，可使用 `--lease-id <cbx_...>` 复用租约；复用的租约还会让 Crabbox 的 pnpm 存储缓存保持预热状态。默认的 `--hydrate-mode source` 会从源代码检出中进行验证，并在虚拟机内运行安装/构建。仅当复用的远程工作区已经包含 `node_modules` 和构建好的 `dist/` 时，才使用 `--hydrate-mode prehydrated`；该模式会跳过耗时的安装/构建步骤，并在工作区未准备就绪时以失败方式安全关闭。使用 `--gateway-setup` 时，Mantis 会在虚拟机内的端口 `38973` 上保留一个持续运行的 OpenClaw Slack Gateway 网关；不使用该参数时，命令会运行常规的机器人到机器人 Slack QA 通道，并在捕获工件后退出。

要使用桌面证据验证原生 Slack 审批 UI，请运行 Mantis 审批检查点模式：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

此模式与 `--gateway-setup` 互斥。它会运行 Slack 审批场景，拒绝非审批场景 ID，在每个待处理和已解决的审批状态暂停等待，将观察到的 Slack API 消息渲染为 `approval-checkpoints/<scenario>-pending.png` 和 `approval-checkpoints/<scenario>-resolved.png`；如果任何检查点、消息证据、确认或渲染后的屏幕截图缺失或为空，则运行失败。冷启动的 CI 租约在 `slack-desktop-smoke.png` 中仍可能显示 Slack 登录界面；审批检查点图像才是此通道的视觉证据。

默认检查点运行会保留两个标准 Slack 审批场景。要捕获任一需要显式选择的 Codex 审批路由，请使用 `--scenario slack-codex-approval-exec-native` 或 `--scenario slack-codex-approval-plugin-native` 明确选择；Mantis 接受这两个场景，并生成相同的待处理/已解决屏幕截图对。运行器会针对每条选定的 Codex 路由延长检查点和远程命令的截止时间，以便完整的审批、智能体完成和已解决更新序列能够完成。

操作员检查清单、GitHub 工作流分派命令、证据评论约定、hydrate 模式决策表、耗时解读和故障处理步骤，请参阅 [Mantis Slack 桌面运行手册](/zh-CN/concepts/mantis-slack-desktop-runbook)。

对于智能体/CV 风格的桌面任务，请运行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` 租用或复用一台 Crabbox 桌面/浏览器计算机，启动
`crabbox record --while`，通过嵌套的
`visual-driver` 驱动可见浏览器，捕获 `visual-task.png`，在选中 `--vision-mode image-describe` 时针对截图运行 `openclaw infer image
describe`，并写入 `visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json` 和
`mantis-visual-task-report.md`。设置 `--expect-text` 后，视觉提示会要求返回结构化 JSON 判定结果（`visible`、`evidence`、`reason`），并且仅当模型报告 `visible: true`，且证据引用了预期文本时才通过；仅引用目标文本的 `visible: false` 响应仍无法通过断言。使用 `--vision-mode metadata` 执行不调用模型的冒烟测试，以证明桌面、浏览器、截图和视频流程正常，而无需调用图像理解提供商。录制内容是 `visual-task` 的必需工件；如果 Crabbox 没有录制出非空的 `visual-task.mp4`，即使视觉驱动程序已通过，任务仍会失败。失败时，Mantis 会保留租约以供 VNC 使用，除非任务此前已通过且未设置 `--keep-lease`。

### 凭据池健康检查

使用池化的实时凭据之前，请运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境变量（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`），验证端点设置，仅报告
`OPENCLAW_QA_CONVEX_SECRET_CI` 和
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 的已设置/缺失状态，并在存在维护者密钥时验证管理和列表访问是否可达。

## 实时传输覆盖范围

实时传输测试通道共享同一份契约，而不是各自设计自己的场景列表结构。`qa-channel` 是覆盖广泛的合成产品行为测试套件，不属于实时传输覆盖矩阵。

实时传输运行器从
`openclaw/plugin-sdk/qa-live-transport-scenarios`
导入共享场景 ID、基线覆盖辅助函数和场景选择辅助函数。

| 通道     | 冒烟测试 | 提及门控 | Bot 间通信 | 允许列表阻止 | 顶层回复 | 引用回复 | 重启后恢复 | 线程后续回复 | 线程隔离 | 表情回应观察 | 帮助命令 | 原生命令注册 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

这使 `qa-channel` 保持为覆盖广泛产品行为的套件，同时 Matrix、
Telegram 和其他实时传输共用一份明确的传输契约
检查清单。

要运行不将 Docker 引入 QA 路径的一次性 Linux VM 通道，请运行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass 客机，安装依赖项，在客机内构建 OpenClaw，
运行 `qa suite`，然后将常规 QA 报告和
摘要复制回宿主机上的 `.artifacts/qa-e2e/...`。它复用宿主机上
`qa suite` 的相同场景选择行为。

宿主机和 Multipass 套件运行默认通过相互隔离的 Gateway 网关工作进程，
并行执行多个选定场景。`qa-channel` 默认
并发数为 4，上限为选定的场景数。使用 `--concurrency
<count>` 调整工作进程数，或使用 `--concurrency 1` 串行执行。
使用 `--pack personal-agent` 运行个人助理基准包（10
个场景）。包选择器可与重复的 `--scenario` 标志叠加：
先运行显式指定的场景，然后按包内顺序运行包场景，并
移除重复项。当自定义 QA 运行器已提供 OpenTelemetry 收集器设置时，
使用 `--pack observability` 同时选择
`otel-trace-smoke` 和 `docker-prometheus-smoke` 场景。

任何场景失败时，该命令都会以非零状态退出。如果你希望获取工件而
不产生失败退出码，请使用 `--allow-failures`。

实时运行会转发适合客机使用且受支持的 QA 身份验证输入：
基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的
`CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便
客机通过挂载的工作区写回内容。

## Discord、Slack、Telegram 和 WhatsApp QA 参考

由于 Matrix 的场景数量以及基于 Docker 的 homeserver 预配，它有一个[专用页面](/zh-CN/concepts/qa-matrix)。
Discord、Slack、Telegram 和 WhatsApp 针对预先存在的真实传输运行，因此它们的参考信息
位于此处。

### 共享 CLI 标志

这些通道通过
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，并
接受相同的标志：

| 标志                                  | 默认值                                            | 描述                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 仅运行此场景。可重复指定。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 写入报告、摘要、证据、传输专用工件和输出日志的位置。相对路径以 `--repo-root` 为基准解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 从中立的当前工作目录调用时使用的仓库根目录。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA Gateway 网关配置中的临时账户 ID。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` 或 `live-frontier`（旧版 `live-openai` 仍然有效）。                                                                            |
| `--model <ref>` / `--alt-model <ref>` | 提供商默认值                                   | 主要/备用模型引用。                                                                                                                   |
| `--fast`                              | 关闭                                                | 在受支持的提供商中启用快速模式。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | 请参阅 [Convex 凭据池](#convex-credential-pool)。                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI 中为 `ci`，其他情况下为 `maintainer`                 | 使用 `--credential-source convex` 时所用的角色。                                                                                                    |

任何场景失败时，每个通道都会以非零状态退出。`--allow-failures` 会写入
工件，但不会设置失败退出码。Telegram 还接受
`--list-scenarios`，用于输出可用场景 ID 并退出；其他通道
不提供该标志。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

以一个真实的私有 Telegram 群组为目标，其中有两个不同的 Bot（驱动程序 +
SUT）。SUT Bot 必须拥有 Telegram 用户名；当两个 Bot 都在
`@BotFather` 中启用 **Bot-to-Bot Communication Mode** 时，Bot 间观察的效果
最佳。

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
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

隐式默认集合始终覆盖冒烟测试、提及门控、原生命令
回复、命令寻址和 Bot 间群组回复。`mock-openai`
默认值还包括确定性的回复链和最终消息流式传输
检查。`telegram-current-session-status-tool` 和
`telegram-tool-only-usage-footer` 仍需选择启用：前者仅在
紧接冒烟测试之后按线程运行时才稳定，后者用于在真实 Telegram 中证明
仅含工具回复上的 `/usage` 页脚。使用 `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` 输出当前
默认/可选划分及回归引用。

输出工件：

- `telegram-qa-report.md`
- `qa-evidence.json` - 实时传输检查的证据条目，
  包括配置文件、覆盖范围、提供商、渠道、工件、结果和 RTT
  字段。

软件包 Telegram 运行使用相同的 Telegram 凭据契约。重复 RTT
测量是常规软件包 Telegram 实时通道的一部分；RTT
分布会写入 `qa-evidence.json` 中所选 RTT 检查的
`result.timing` 下。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 后，软件包实时包装器
会租用一个 `kind: "telegram"` 凭据，将租用的群组/驱动程序/SUT
Bot 环境变量导出到已安装软件包的运行环境中，维持租约心跳，并在关闭时
释放租约。选择 Convex 时，软件包包装器默认在 CI 外使用 Convex 角色
`maintainer`，对 `telegram-mentioned-message-reply` 执行 20 次 RTT 检查，
RTT 超时时间为 30s。覆盖
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
或 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`，可调整 RTT 测量，而无需
创建单独的 RTT 命令或 Telegram 专用摘要格式。

### Discord QA

```bash
pnpm openclaw qa discord
```

以一个真实的私有 Discord guild 渠道为目标，其中有两个 Bot：一个由
测试框架控制的驱动 Bot，以及一个由子 OpenClaw Gateway 网关通过内置
Discord 插件启动的 SUT Bot。验证渠道提及处理、SUT Bot 已在 Discord
注册原生 `/help` 命令，以及选择启用的 Mantis 证据场景。

使用 `--credential-source env` 时必需的环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必须与 Discord 返回的 SUT Bot 用户 ID
  匹配（否则该通道会快速失败）。

可选：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 在
  已观察消息工件中保留消息正文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 为
  `discord-voice-autojoin` 选择语音/舞台渠道；如果未设置，该场景会选择 SUT Bot
  可见的第一个语音/舞台渠道。

场景（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 选择启用的语音场景。单独运行，启用
  `channels.discord.voice.autoJoin`，并验证 SUT Bot 当前的
  Discord 语音状态是目标语音/舞台渠道。Convex Discord
  凭据可以包含可选的 `voiceChannelId`；否则运行器会
  查找 guild 中第一个可见的语音/舞台渠道。
- `discord-status-reactions-tool-only` - 选择启用的 Mantis 场景。单独
  运行，因为它会将 SUT 切换为始终开启、仅含工具的 guild 回复，
  并设置 `messages.statusReactions.enabled=true`，然后捕获 REST
  表情回应时间线以及 HTML/PNG 可视化工件。Mantis 前后对比
  报告还会将场景提供的 MP4 工件保留为 `baseline.mp4`
  和 `candidate.mp4`。
- `discord-thread-reply-filepath-attachment` - 选择启用的 Mantis 场景；请参阅
  [Discord Mantis 场景](#discord-mantis-scenarios)。

显式运行 Discord 语音自动加入场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

显式运行 Mantis 状态表情回应场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

输出工件：

- `discord-qa-report.md`
- `qa-evidence.json` - 实时传输检查的证据条目。
- `discord-qa-observed-messages.json` - 除非设置
  `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否则正文会被遮盖。
- 运行状态表情回应场景时，会生成 `discord-qa-reaction-timelines.json` 和
  `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目标为一个真实的 Slack 私有渠道，其中有两个不同的 Bot：一个由测试框架控制的驱动 Bot，
以及一个由子 OpenClaw Gateway 网关通过内置 Slack 插件启动的 SUT Bot。

使用 `--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

可选：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 会在
  已观察消息工件中保留消息正文。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 为 Mantis 启用可视化审批
  检查点。运行器会写入 `<scenario>.pending.json` 和
  `<scenario>.resolved.json`，然后等待匹配的 `.ack.json` 文件。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` 会覆盖检查点
  确认超时时间。默认值为 `120000`。

通过 Slack 实时适配器公开的规范 YAML 场景：

- `thread-follow-up`
- `thread-isolation`

命令式 Slack 场景（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`、`slack-progress-commentary-false`、
  `slack-progress-commentary-omitted` 和
  `slack-progress-commentary-verbose-dedupe` - 可选启用的真实 Slack 探针，用于验证
  独立的解说/工具进度控制、省略键时的旧版默认行为，以及启用持久化详细进度时的
  单次交付行为。
- `slack-reaction-glyph-native` - 可选启用的实时消息工具表情回应场景。
  指示智能体传入精确的 `✅` 字形，并确认 Slack 为目标消息上的 SUT Bot
  存储了 `white_check_mark`。
- `slack-chart-presentation-native` - 可选启用的可移植图表场景，
  用于验证原生 `data_visualization` 块和精确的无障碍文本。
- `slack-table-presentation-native` - 可选启用的可移植表格场景，
  用于验证原生 `data_table` 块、精确的行数据和无障碍文本。
- `slack-table-invalid-blocks-fallback` - 可选启用的直接传输场景，
  通过生产 Slack 发送路径发送一个结构上可读但超出限制的原始表格，其中包含 101 个数据行
  及其表头，证明 Slack 本身返回 `invalid_blocks`，
  并验证存储的已禁用格式回退内容完整且不含
  原生数据块。报告仅保留安全的错误代码、计数和布尔值
  证据；原始合成表格文本遵循
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT`。
- `slack-approval-exec-native` - 可选启用的原生 Slack Exec 审批场景。
  通过 Gateway 网关请求 Exec 审批，验证 Slack 消息
  包含原生审批按钮，完成审批，并验证审批完成后的 Slack
  更新。
- `slack-approval-plugin-native` - 可选启用的原生 Slack 插件审批
  场景。同时启用 Exec 和插件审批转发，以免插件
  事件被 Exec 审批路由抑制，然后验证相同的
  待处理/已完成原生 Slack UI 路径。
- `slack-codex-approval-exec-native` - 可选启用的 Codex Guardian 命令审批
  场景。以 Guardian 模式启用 Codex 插件，将
  源自 Slack 的 Gateway 网关智能体轮次通过 Codex app-server 测试框架进行路由，
  等待 `openclaw-codex-app-server` 的原生 Slack 插件审批提示，
  完成审批，并验证 Codex 轮次
  以预期的命令输出和助手标记结束。
- `slack-codex-approval-plugin-native` - 可选启用的 Codex Guardian 文件审批
  场景。使用工作区外部的 `apply_patch` 指令，使 Codex 发出
  app-server 文件变更审批路由，然后验证相同的原生
  Slack 待处理/已完成审批路径、最终助手标记，以及清理前精确的文件
  内容。

Codex 审批场景需要 `openai/*` 或 `codex/*` `--model`、
常规实时模型凭据，以及 Codex 插件接受的 Codex 身份验证或 API 密钥身份验证。
Slack 报告包含 Codex app-server 方法、选定的 Codex 模型键、
最终 Codex 轮次状态和操作标记验证，以及
经过遮盖的 Slack 审批元数据。

输出工件：

- `slack-qa-report.md`
- `qa-evidence.json` - 实时传输检查的证据条目。
- `slack-qa-observed-messages.json` - 除非设置
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否则正文会被遮盖。
- `approval-checkpoints/` - 仅当 Mantis 设置
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 时生成；包含检查点 JSON、
  确认 JSON，以及待处理/已完成状态的截图。

#### 设置 Slack 工作区

该测试通道需要同一工作区中的两个不同 Slack 应用，以及一个两个
Bot 都已加入的渠道：

- `channelId` - 两个 Bot 都已受邀加入的渠道的 `Cxxxxxxxxxx` ID。
  请使用专用渠道；该测试通道每次运行都会发帖。
- `driverBotToken` - **Driver** 应用的 Bot 令牌（`xoxb-...`）。
- `sutBotToken` - **SUT** 应用的 Bot 令牌（`xoxb-...`），它必须是
  与 Driver 不同的 Slack 应用，以确保其 Bot 用户 ID 不同。
- `sutAppToken` - SUT 应用具有 `connections:write` 的
  应用级令牌（`xapp-...`），Socket Mode 使用该令牌，使 SUT 应用能够接收事件。

建议使用专用于 QA 的 Slack 工作区，而不要复用生产
工作区。

下面的 SUT 清单有意将内置 Slack 插件的
生产安装（`extensions/slack/src/setup-shared.ts:12`）缩减为
实时 Slack QA 套件所覆盖的权限和事件。有关用户所见的
生产渠道设置，请参阅
[Slack 渠道快速设置](/zh-CN/channels/slack#quick-setup)；QA Driver/SUT
对有意独立设置，因为该测试通道需要同一工作区中的两个不同 Bot 用户
ID。

**1. 创建 Driver 应用**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → 选择 QA 工作区，粘贴以下清单，
然后点击 _Install to Workspace_：

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "用于 OpenClaw QA Slack 实时测试通道的测试驱动 Bot"
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

复制 _Bot User OAuth Token_（`xoxb-...`）——它将成为
`driverBotToken`。Driver 只需发布消息并标识
自身；不需要事件，也不需要 Socket Mode。

**2. 创建 SUT 应用**

在同一工作区中重复执行 _Create New App → From a manifest_。此 QA 应用
有意使用内置 Slack 插件生产清单
（`extensions/slack/src/setup-shared.ts:12`）的精简版本：省略了表情回应
权限范围和事件，因为实时 Slack QA 套件尚未覆盖
表情回应处理。

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "用于 OpenClaw 的 OpenClaw QA SUT 连接器"
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

Slack 创建应用后，在其设置页面上执行两项操作：

- _Install to Workspace_ → 复制 _Bot User OAuth Token_ → 它将成为
  `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 添加
  权限范围 `connections:write` → 保存 → 复制 `xapp-...` 值 → 它将
  成为 `sutAppToken`。

分别使用每个令牌调用 `auth.test`，验证两个 Bot 具有不同的用户 ID。
运行时通过用户 ID 区分 Driver 和 SUT；为两者复用同一个应用
会导致提及门控立即失败。

**3. 创建渠道**

在 QA 工作区中创建一个渠道（例如 `#openclaw-qa`），并在该渠道内邀请两个
Bot：

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

从 _channel info → About → Channel ID_ 复制 `Cxxxxxxxxxx` ID——它将
成为 `channelId`。公开渠道可正常使用；如果使用私有渠道，
两个应用都已有 `groups:history`，因此测试框架的历史记录读取仍会
成功。

**4. 注册凭据**

有两种选择。单机调试时使用环境变量（设置四个
`OPENCLAW_QA_SLACK_*` 变量并传入 `--credential-source env`），或者为
共享 Convex 池预置数据，以便 CI 和其他维护者可以租用这些凭据。

对于 Convex 池，将四个字段写入一个 JSON 文件：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在 shell 中导出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
后，进行注册和验证：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack 池预置"

pnpm openclaw qa credentials list --kind slack --status all --json
```

预期结果为 `count: 1`、`status: "active"`，且没有 `lease` 字段。

**5. 验证端到端流程**

在本地运行该测试通道，确认两个 Bot 可以通过代理相互通信：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功的运行会在远低于 30 秒的时间内完成，并且 `slack-qa-report.md`
显示 `slack-canary` 和 `slack-mention-gating` 的状态均为 `pass`。如果
测试通道挂起约 90 秒后退出，并显示 `Convex credential pool exhausted
for kind "slack"`，则说明凭据池为空或所有记录都已被租用——`qa
credentials list --kind slack --status all --json` 会告诉你具体是哪种情况。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

目标为两个专用 WhatsApp Web 账号：一个由测试框架控制的驱动账号，
以及一个由子 OpenClaw Gateway 网关通过内置 WhatsApp 插件启动的 SUT 账号。

使用 `--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

可选：

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` 启用群组场景，例如
  `whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-broadcast-group-fanout`、`whatsapp-group-activation-always`、
  `whatsapp-group-reply-to-bot-triggers`、群组操作/媒体/投票场景，
  以及 `whatsapp-group-allowlist-block`。
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` 在
  已观察消息工件中保留消息正文。

场景目录（`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`）：

- 基线和群组门控：`whatsapp-canary`、`whatsapp-pairing-block`、
  `whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-group-activation-always`、`whatsapp-group-reply-to-bot-triggers`、
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
- 用户路径消息操作：`whatsapp-agent-message-action-react` 从真实驱动程序私信开始，
  让模型调用 `message` 工具，并观察 WhatsApp 原生表情回应。
  `whatsapp-agent-message-action-upload-file` 对 `message(action=upload-file)`
  采用相同方式，并观察 WhatsApp 原生媒体。
  `whatsapp-group-agent-message-action-react` 和
  `whatsapp-group-agent-message-action-upload-file` 在真实 WhatsApp 群组中
  验证相同的用户可见操作。
- 群组扇出：`whatsapp-broadcast-group-fanout` 从一条提及机器人的
  WhatsApp 群组消息开始，并验证来自 `main` 和 `qa-second` 的不同可见回复。
- 群组激活：`whatsapp-group-activation-always` 将真实群组
  会话更改为 `/activation always`，验证未提及机器人的群组消息会唤醒
  智能体，然后恢复为 `/activation mention`。
  `whatsapp-group-reply-to-bot-triggers` 预置一条机器人回复，向其发送不含显式提及的
  原生引用回复，并验证智能体会因该回复上下文而被唤醒。
- 入站媒体和结构化消息：`whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。
  这些场景通过驱动程序发送真实 WhatsApp 图片、音频、文档、位置、联系人、
  贴纸和表情回应事件。
- 直接 Gateway 网关契约探测：`whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-outbound-send-serialization`、
  `whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、
  `whatsapp-message-actions`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`。这些场景有意绕过模型提示，
  并验证确定性的 Gateway 网关/渠道 `send`、`poll` 和
  `message.action` 契约。
- 访问控制覆盖：`whatsapp-access-control-dm-open`、
  `whatsapp-access-control-dm-disabled`、`whatsapp-access-control-group-open`、
  `whatsapp-access-control-group-disabled`、`whatsapp-group-allowlist-block`。
- 原生审批：`whatsapp-approval-exec-deny-native`、
  `whatsapp-approval-exec-native`、`whatsapp-approval-exec-reaction-native`、
  `whatsapp-approval-exec-group-reaction-native`、
  `whatsapp-approval-plugin-native`。
- 状态表情回应：`whatsapp-status-reactions`、
  `whatsapp-status-reaction-lifecycle`。

该目录目前包含 52 个场景。`live-frontier` 默认通道保持为较小规模，
仅包含 10 个场景，以实现快速冒烟覆盖。`mock-openai`
默认通道通过真实 WhatsApp 传输确定性地运行 45 个场景，同时仅模拟模型输出；
审批场景和少数开销较大/会阻塞的检查仍需通过场景 ID 显式运行。

WhatsApp QA 驱动程序观察结构化实时事件（`text`、`media`、
`location`、`reaction` 和 `poll`），并且可以主动发送媒体、投票、
联系人、位置和贴纸。QA Lab 通过
`@openclaw/whatsapp/api.js` 软件包公开接口导入该驱动程序，而不是访问私有
WhatsApp 运行时文件。对于群组观察，`fromJid` 是群组 JID，
而 `participantJid` 和 `fromPhoneE164` 标识参与者发送者。
默认情况下会遮盖消息内容。直接 Gateway 网关投票、upload-file、
媒体、群组投票、群组媒体和回复结构探测属于传输/API
契约检查；它们不能证明用户提示会使智能体选择相同操作。用户路径操作证明来自
`whatsapp-agent-message-action-react` 和
`whatsapp-group-agent-message-action-react` 等场景，其中驱动程序发送普通
WhatsApp 消息，QA Lab 则观察最终生成的 WhatsApp 原生工件。
WhatsApp 报告包含每个场景的验证方式（`user-path`、
`direct-gateway` 或 `native-approval`），以防将证据误认为其证明了
比实际更强的契约。

输出工件：

- `whatsapp-qa-report.md`
- `qa-evidence.json` - 实时传输检查的证据条目。
- `whatsapp-qa-observed-messages.json` - 除非设置
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`，否则正文会被遮盖。

### Convex 凭据池

Discord、Slack、Telegram 和 WhatsApp 通道可以从共享 Convex 池租用凭据，
而不是读取上述环境变量。传递 `--credential-source convex`
（或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；
QA Lab 获取独占租约，在运行期间持续发送心跳，并在关闭时释放租约。
池类型为 `"discord"`、`"slack"`、`"telegram"` 和 `"whatsapp"`。

代理在 `admin/add` 上验证的有效负载结构：

- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` 必须是数字聊天 ID 字符串。
- Telegram 真实用户（`kind: "telegram-user"`）：`{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  仅用于 Mantis Telegram Desktop 证明。通用 QA Lab 通道不得获取
  此类型。
- WhatsApp（`kind: "whatsapp"`）：`{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - 电话号码必须是不同的 E.164 字符串。

Mantis Telegram Desktop 证明工作流为 TDLib CLI 驱动程序和 Telegram Desktop
见证程序共同持有一个独占 Convex `telegram-user` 租约，然后在发布证明后释放该租约。

当 PR 需要确定性视觉差异时，Mantis 可以在 `main` 和 PR 头部使用相同的模拟
模型回复，同时更改 Telegram 格式化程序或传递层。捕获默认设置针对 PR 评论进行了优化：
标准 Crabbox 类别、24fps 桌面录制、24fps 动态 GIF 和 1920px 预览
宽度。前后对比评论应发布仅包含预期 GIF 的整洁工件包。

Slack 通道也可以使用该池。Slack 有效负载结构检查目前位于 Slack QA 运行器中，
而不是代理中；请使用 `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`，
其中 Slack 渠道 ID 类似 `Cxxxxxxxxxx`。有关应用和权限范围配置，请参阅
[设置 Slack 工作区](#setting-up-the-slack-workspace)。

运行环境变量和 Convex 代理端点契约位于
[测试 → 通过 Convex 共享 Telegram 凭据](/zh-CN/help/testing#shared-telegram-credentials-via-convex-v1)
（该章节名称早于多渠道池；各种类型共享相同的租约语义）。

## 由仓库支持的种子数据

种子资源位于 `qa/`：

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

这些资源有意保存在 git 中，使 QA 计划对人和
智能体都可见。

`qa-lab` 保持为通用 YAML 场景运行器。每个场景 YAML 文件都是一次测试运行的
事实来源，并且应定义：

- 顶层 `title`
- `scenario` 元数据
- `scenario` 中可选的类别、能力、通道和风险元数据
- `scenario` 中的文档和代码引用
- `scenario` 中可选的插件要求
- `scenario` 中可选的 Gateway 网关配置补丁
- 流程场景的可执行顶层 `flow`，或用于 Vitest 和
  Playwright 场景的 `scenario.execution.kind` / `scenario.execution.path`

支持 `flow` 的可复用运行时接口保持通用且支持跨领域组合。
例如，YAML 场景可以将传输侧辅助程序与浏览器侧辅助程序组合使用，
后者通过 Gateway 网关 `browser.request` 接缝驱动嵌入式 Control UI，
而无需添加特殊情况运行器。

场景文件应按产品能力分组，而不是按源代码树文件夹分组。
移动文件时保持场景 ID 稳定；使用 `docsRefs` 和
`codeRefs` 实现实现层面的可追溯性。

基线列表应保持足够广泛，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体交接
- 仓库读取和文档读取
- 一个小型构建任务，例如 Lobster Invaders

## 提供商模拟通道

`qa suite` 有两个本地提供商模拟通道：

- `mock-openai` 是可感知场景的 OpenClaw 模拟器。它仍是由仓库支持的 QA
  和一致性门禁的默认确定性模拟通道。
- `aimock` 启动由 AIMock 支持的提供商服务器，用于实验性的
  协议、夹具、录制/重放和混沌测试覆盖。它是增量补充，
  不会取代 `mock-openai` 场景分派器。

提供商通道实现在 `extensions/qa-lab/src/providers/` 下。
每个提供商拥有自己的默认值、本地服务器启动、Gateway 网关模型配置、
身份验证配置文件暂存需求和实时/模拟能力标志。共享套件和
Gateway 网关代码通过提供商注册表进行路由，而不是根据
提供商名称创建分支。

## 传输适配器

`qa-lab` 为 YAML QA 场景提供通用传输接缝。`qa-channel` 是
合成默认选项。`crabline` 启动具有本地提供商结构的服务器，并针对这些服务器
运行 OpenClaw 的普通渠道插件。`live` 保留用于
真实提供商凭据和外部渠道。

在架构层面，职责划分如下：

- `qa-lab` 负责通用场景执行、工作进程并发、工件
  写入和报告。
- 传输适配器负责 Gateway 网关配置、就绪状态、入站和出站
  观察、传输操作以及标准化的传输状态。
- `qa/scenarios/` 下的 YAML 场景文件定义测试运行；`qa-lab`
  提供执行这些场景的可复用运行时接口。

### 添加渠道

向 YAML QA 系统添加渠道时，需要提供渠道实现，
以及用于检验渠道契约的场景包。若要实现冒烟 CI
覆盖，请添加匹配的 Crabline 本地提供商服务器，并通过
`crabline` 驱动程序公开它。

当共享 `qa-lab` 主机能够承载该流程时，不要添加新的顶层 QA 命令根。

`qa-lab` 负责共享主机机制：

- `openclaw qa` 命令根
- 套件启动和拆除
- 工作进程并发
- 工件写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容性别名

运行器插件负责传输契约：

- 如何将 `openclaw qa <runner>` 挂载到共享的 `qa` 根命令下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何公开记录和规范化的传输状态
- 如何执行由传输支持的操作
- 如何处理特定于传输的重置或清理

采用新渠道的最低门槛：

1. 由 `qa-lab` 继续负责共享的 `qa` 根命令。
2. 在共享的 `qa-lab` 主机接缝上实现传输运行器。
3. 将特定于传输的机制保留在运行器插件或渠道测试框架中。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个相互竞争的根命令。运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；延迟加载的 CLI 和运行器执行应置于单独的入口点之后。可选的 `adapterFactory` 可将传输公开给共享场景，而不更改该命令现有的场景目录。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或调整 YAML 场景。
6. 对新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意的迁移，否则应保持现有兼容性别名可用。

决策规则很严格：

- 如果某项行为可以在 `qa-lab` 中只表达一次，就将其放在 `qa-lab` 中。
- 如果某项行为依赖单一渠道传输，请将其保留在该运行器插件或插件测试框架中。
- 如果某个场景需要一种可供多个渠道使用的新能力，请添加通用辅助函数，而不是在 `suite.ts` 中添加特定于渠道的分支。
- 如果某项行为仅对一种传输有意义，请保持该场景特定于传输，并在场景契约中明确说明这一点。

### 场景辅助函数名称

新场景首选的通用辅助函数：

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

现有场景仍可使用兼容性别名——`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus`——但编写新场景时应使用通用名称。这些别名用于避免一次性全面迁移，并不代表今后采用的模型。

## 报告

`qa-lab` 根据观察到的总线时间线导出 Markdown 协议报告。
该报告应回答：

- 哪些有效
- 哪些失败
- 哪些仍受阻
- 哪些后续场景值得添加

如需查看可用场景清单（这在评估后续工作量或接入新的传输协议时很有用），请运行 `pnpm openclaw qa coverage`（添加 `--json` 可获得机器可读的输出）。为被修改的行为或文件路径选择针对性验证时，请运行 `pnpm openclaw qa coverage --match <query>`。匹配报告会搜索场景元数据、文档引用、代码引用、覆盖范围 ID、插件和提供商要求，然后输出匹配的 `qa suite
--scenario ...` 目标。

每次运行 `qa suite`，都会为所选场景集写入顶层的 `qa-evidence.json`、`qa-suite-summary.json` 和 `qa-suite-report.md` 工件。声明了 `execution.kind: vitest` 或 `execution.kind: playwright` 的场景会运行对应的测试路径，并写入每个场景的日志。声明了 `execution.kind: script` 的场景会通过 `node --import tsx` 运行 `execution.path` 中的证据生成器（在 `execution.args` 中展开 `${outputDir}` 和 `${scenarioId}`）；生成器会写入自己的 `qa-evidence.json`，其中的条目会导入套件输出，而其工件路径则相对于该生成器的 `qa-evidence.json` 进行解析。当通过 `qa run
--qa-profile` 进入 `qa suite` 时，同一个 `qa-evidence.json` 还会包含所选分类法类别的配置文件评分卡摘要。

应将覆盖率输出视为辅助发现问题的手段，而不能替代门禁；所选场景仍需使用正确的提供商模式、实时传输协议、Multipass、Testbox 或发布通道，才能测试相应行为。有关评分卡的背景信息，请参阅[成熟度评分卡](/zh-CN/maturity/scorecard)。

对于角色和风格检查，请使用多个实时模型引用运行同一场景，并编写一份经过评审的 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

该命令运行本地 QA Gateway 网关子进程，而非 Docker。角色
评估场景应通过 `SOUL.md` 设置人设，然后执行聊天、工作区帮助和小型文件任务等普通
用户轮次。不应告知候选
模型它正在接受评估。该命令会保留
每份完整对话记录并记录基本运行统计信息，然后让评审模型以
快速模式运行，并在支持时使用 `xhigh` 推理，根据
自然度、氛围感和幽默感对各次运行进行排名。比较不同
提供商时，请使用 `--blind-judge-models`：评审提示词仍会获得每份对话记录和运行状态，但
候选引用会替换为 `candidate-01` 等中性标签；
解析后，报告会将排名映射回真实引用。

候选运行默认使用 `high` 思考级别；GPT-5.6 Luna 使用 `medium`，
而支持该级别的旧版 OpenAI 评估引用使用 `xhigh`。可使用 `--model provider/model,thinking=<level>` 内联覆盖特定
候选；内联
选项还支持 `fast`、`no-fast` 和 `fast=<bool>`。`--thinking
<level>` 仍用于设置全局回退值，同时保留旧版 `--model-thinking
<provider/model=level>` 形式以确保兼容性。OpenAI 候选
引用默认启用快速模式，以便在提供商
支持时使用优先处理。仅当你想为
所有候选模型强制启用快速模式时，才传入 `--fast`。报告会记录候选和评审的运行时长，
用于基准分析，但评审提示词会明确说明不得按
速度排名。候选和评审模型运行的默认并发数均为 16。
当提供商限制或本地
Gateway 网关压力导致运行噪声过大时，请降低 `--concurrency` 或 `--judge-concurrency`。

未传入候选 `--model` 时，角色评估默认使用
`openai/gpt-5.6-luna`、`openai/gpt-5.2`、`openai/gpt-5`、
`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。未传入
`--judge-model` 时，评审模型默认使用
`openai/gpt-5.6-sol,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-8,thinking=high`。

## 相关文档

- [Matrix QA](/zh-CN/concepts/qa-matrix)
- [成熟度评分卡](/zh-CN/maturity/scorecard)
- [个人智能体基准测试包](/zh-CN/concepts/personal-agent-benchmark-pack)
- [QA channel](/zh-CN/channels/qa-channel)
- [测试](/zh-CN/help/testing)
- [仪表板](/zh-CN/web/dashboard)
