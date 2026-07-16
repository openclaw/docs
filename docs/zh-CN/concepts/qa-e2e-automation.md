---
doc-schema-version: 1
read_when:
    - 了解 QA 技术栈如何协同工作
    - 扩展 qa-lab、qa-channel 或传输适配器
    - 添加由仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高保真度的 QA 自动化
summary: QA 技术栈概览：qa-lab、qa-channel、由仓库支持的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-07-16T11:30:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dcb506cedb57289f29938eb55b5f11ceedfaabba88364dce8249116010ce859
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 栈以贴近真实、符合渠道形态的方式测试 OpenClaw，这是单元测试无法做到的。

组成部分：

- `extensions/qa-channel`：具有私信、频道、线程、表情回应、编辑和删除功能面的合成消息渠道。
- `extensions/qa-lab`：调试器 UI、QA 总线、场景配置文件和实时传输适配器，用于观察对话记录、注入入站消息并导出 Markdown 报告。
- `qa/`：由仓库提供的启动任务种子资源和基线 QA 场景。
- [Mantis](/zh-CN/concepts/mantis)：针对需要真实传输协议、浏览器截图、虚拟机状态和 PR 证据的错误进行修复前后实时验证。

## 命令入口

每个 QA 流程都在 `pnpm openclaw qa <subcommand>` 下运行。许多流程都有 `pnpm qa:*` 脚本别名；两种形式均可使用。

| 命令                                                | 用途                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 不使用 `--qa-profile` 的内置 QA 自检；由分类法支持的成熟度配置文件运行器，可搭配 `--qa-profile smoke-ci`、`--qa-profile release` 或 `--qa-profile all` 使用。                                                                                                  |
| `qa suite`                                          | 针对 QA Gateway 网关通道运行由仓库提供的场景。`--runner multipass` 使用一次性 Linux 虚拟机，而非主机。                                                                                                                                         |
| `qa coverage`                                       | 输出 YAML 场景覆盖率清单（`--json` 用于机器输出；`--match <query>` 用于查找与所改行为相关的场景；`--tools` 用于查看运行时工具夹具覆盖率）。                                                                                  |
| `qa parity-report`                                  | 比较两个 `qa-suite-summary.json` 文件以执行模型轴一致性门禁，或使用 `--runtime-axis --token-efficiency` 写入 Codex 与 OpenClaw 的运行时一致性和令牌效率报告。                                                                          |
| `qa confidence-report`                              | 根据清单对 QA 证明工件进行分类，生成未知项为零的置信度报告。                                                                                                                                                                               |
| `qa confidence-self-test`                           | 写入带种子的负对照金丝雀，以证明置信度门禁能够检测漂移。                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | 通过运行时一致性重放工具重放精心整理的 JSONL 对话记录。                                                                                                                                                                                         |
| `qa character-eval`                                 | 在多个实时模型上运行角色 QA 场景，并生成经过评判的报告。请参阅[报告](#reporting)。                                                                                                                                                        |
| `qa manual`                                         | 针对所选提供商/模型通道运行一次性提示词。                                                                                                                                                                                                      |
| `qa ui`                                             | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                |
| `qa docker-build-image`                             | 构建预制的 QA Docker 镜像。                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | 为 QA 仪表板和 Gateway 网关通道写入 docker-compose 脚手架。                                                                                                                                                                                                |
| `qa up`                                             | 构建 QA 站点、启动基于 Docker 的栈并输出 URL（别名：`pnpm qa:lab:up`；`:fast` 变体会添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                              |
| `qa aimock`                                         | 仅启动 AIMock 提供商服务器。                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | 仅启动可感知场景的 `mock-openai` 提供商服务器。                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享的 Convex 凭据池。                                                                                                                                                                                                                           |
| `qa discord`                                        | 针对真实私有 Discord 服务器频道的实时传输通道。                                                                                                                                                                                                   |
| `qa matrix`                                         | 针对一次性 Tuwunel 主服务器运行 QA Lab Matrix 配置文件。请参阅 [Matrix 冒烟通道](#matrix-smoke-lanes)。                                                                                                                                                      |
| `qa slack`                                          | 针对真实私有 Slack 频道的实时传输通道。                                                                                                                                                                                                           |
| `qa telegram`                                       | 针对真实私有 Telegram 群组的实时传输通道。                                                                                                                                                                                                          |
| `qa whatsapp`                                       | 针对真实 WhatsApp Web 账户的实时传输通道。                                                                                                                                                                                                             |
| `qa mantis`                                         | 用于实时传输错误的修复前后验证运行器，包含 Discord 状态表情回应证据、Crabbox 桌面/浏览器冒烟测试和 VNC 中的 Slack 冒烟测试。请参阅 [Mantis](/zh-CN/concepts/mantis) 和 [Mantis Slack 桌面运行手册](/zh-CN/concepts/mantis-slack-desktop-runbook)。 |

### 基于配置文件的 `qa run`

基于配置文件的 `qa run` 从 `taxonomy.yaml` 读取成员关系，然后通过 `qa suite` 分派解析出的场景。`--surface` 和 `--category` 用于筛选所选配置文件，而不是定义单独的通道。生成的 `qa-evidence.json` 包含配置文件评分卡摘要，其中列出所选类别计数和缺失的覆盖率 ID；各个证据条目仍是测试、覆盖角色和结果的事实依据。分类法功能覆盖率 ID 是精确的证明目标，而非别名：主要场景覆盖会满足匹配的 ID，次要覆盖仅供参考。覆盖率 ID 使用点分隔的 `namespace.behavior` 形式，其中各段由小写字母、数字或连字符组成；配置文件、功能面和类别 ID 仍可使用现有的连字符或点分隔分类法 ID。

精简证据会省略每条记录中的 `execution`，并设置 `evidenceMode: "slim"`；`smoke-ci` 默认使用精简模式，`--evidence-mode full` 可恢复完整记录：

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

使用 `smoke-ci`，通过模拟模型提供商和 Crabline 本地提供商服务器生成确定性的配置文件证明。使用 `release`，针对实时渠道进行 Stable/LTS 证明。仅在明确需要完整分类法证据运行时使用 `all`；它会选择每个活跃的成熟度类别，并可通过 `QA
Profile Evidence` GitHub Actions 工作流搭配 `qa_profile=all` 进行分派。当命令还需要 OpenClaw 根配置文件时，请将根配置文件放在 QA 命令之前：

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 操作员流程

当前的 QA 操作员流程采用双窗格 QA 站点：

- 左侧：包含智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的对话记录和场景计划。

运行命令：

```bash
pnpm qa:lab:up
```

该命令会构建 QA 站点，启动基于 Docker 的 Gateway 网关通道，并开放 QA Lab 页面。操作员或自动化循环可在此向智能体分配 QA 任务、观察真实渠道行为，并记录哪些功能正常、失败或仍受阻。

为了更快地迭代 QA Lab UI，而无需每次都重新构建 Docker 镜像，请使用绑定挂载的 QA Lab 软件包启动栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 使 Docker 服务继续使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在发生更改时重新构建该软件包；当 QA Lab 资源哈希发生变化时，浏览器会自动重新加载。

### 可观测性冒烟测试

<Note>
可观测性 QA 仅限源代码检出环境。npm tarball 会有意省略 QA Lab（以及 `qa-channel`），因此软件包 Docker 发布通道不会运行 `qa` 命令。更改诊断插桩时，请从已构建的源代码检出环境运行这些命令。
</Note>

| 别名                                    | 运行内容                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | 本地 OpenTelemetry 接收器，以及启用了 `diagnostics-otel` 的 `otel-trace-smoke` 场景。                                      |
| `pnpm qa:otel:collector-smoke`          | 在真实 OpenTelemetry Collector Docker 容器后运行的相同通道。更改端点接线或 Collector/OTLP 兼容性时使用。 |
| `pnpm qa:prometheus:smoke`              | 启用了 `diagnostics-prometheus` 的 `docker-prometheus-smoke` 场景。                                                           |
| `pnpm qa:observability:smoke`           | 先运行 `qa:otel:smoke`，再运行 `qa:prometheus:smoke`。                                                                                      |
| `pnpm qa:observability:collector-smoke` | 先运行 `qa:otel:collector-smoke`，再运行 `qa:prometheus:smoke`。                                                                            |

`qa:otel:smoke` 会启动本地 OTLP/HTTP 接收器，运行最小化的 QA channel
智能体轮次，然后断言已导出跟踪、指标和日志。它会解码
导出的 protobuf 跟踪 span，并检查发布关键结构：
`openclaw.run`、`openclaw.harness.run`、采用最新 GenAI 语义约定的
模型调用 span、`openclaw.context.assembled` 和 `openclaw.message.delivery`
必须全部存在。该冒烟测试强制使用
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，因此模型调用
span 必须使用 `{gen_ai.operation.name} {gen_ai.request.model}` 名称；成功轮次中的模型
调用不得导出 `StreamAbandoned`；原始诊断
ID 和 `openclaw.content.*` 属性必须排除在跟踪之外。该场景的
提示词要求模型回复固定标记，并且不输出固定的
机密字符串；原始 OTLP 载荷不得包含这两者，也不得包含根据场景 ID
派生的 QA 会话键。它会在 QA 套件工件旁写入 `otel-smoke-summary.json`。

`qa:prometheus:smoke` 会验证未经身份验证的抓取请求遭到拒绝，然后
检查经过身份验证的抓取结果包含发布关键指标族，且不含提示词内容、
响应内容、原始诊断标识符、身份验证令牌或本地路径。

### Matrix 冒烟测试通道

如需运行不要求模型提供商凭据、使用真实传输的 Matrix 冒烟测试通道，请使用确定性模拟 OpenAI 提供商运行发布配置：

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

对于实时前沿模型提供商通道，请显式提供 OpenAI 兼容凭据：

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

直接运行 `pnpm openclaw qa matrix` 会执行完整的 `all` 配置，并在
场景失败后继续。使用 `--fail-fast` 可缩短反馈周期，或重复使用
`--scenario <id>` 选择单个场景；显式场景 ID 的优先级高于
`--profile`。

| 配置         | 场景数    | 用途                                                                                                                                     |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | 完整目录（默认）。                                                                                                              |
| `release`    | 2         | 发布关键渠道基线和实时允许列表重新加载。                                                                             |
| `fast`       | 12        | 聚焦于线程、表情回应、审批、策略、Bot 门控和加密回复覆盖。                                               |
| `transport`  | 50        | 线程、私信/房间路由、自动加入、审批、表情回应、重启、提及/允许列表策略、编辑和多参与者排序。         |
| `media`      | 7         | 图像、生成图像、语音、附件、不支持的媒体和加密媒体覆盖。                                              |
| `e2ee-smoke` | 8         | 最小化加密回复、线程、引导、恢复、重启、删改和失败覆盖。                                       |
| `e2ee-deep`  | 18        | 状态丢失、备份、密钥恢复、设备安全维护和 SAS/二维码/私信验证。                                                            |
| `e2ee-cli`   | 9         | 通过测试框架执行 `openclaw matrix encryption setup`、恢复密钥、多账户、Gateway 网关往返和自我验证命令。 |

配置成员关系和渠道要求与 `qa/scenarios/channels/` 下的声明式 Matrix
场景一同定义。运行时会选择渠道驱动程序。
其实时实现位于
`extensions/qa-lab/src/live-transports/matrix/scenarios/` 下。

适配器会在 Docker 中配置一个一次性 Tuwunel 主服务器（默认
镜像为 `ghcr.io/matrix-construct/tuwunel:v1.5.1`，服务器名称为 `matrix-qa.test`，
端口为 `28008`），注册临时驱动程序、SUT 和观察者用户，初始化
所需房间，并记录经过脱敏的请求/响应边界。然后，它会在限定于该传输的
子 QA Gateway 网关中运行真实 Matrix 插件
（不使用 `qa-channel`），最后拆除环境。

常用选项：

| 标志                     | 默认值            | 用途                                                                                 |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `--profile <profile>`    | `all`             | 选择上述配置之一。                                                    |
| `--scenario <id>`        | -                 | 选择一个场景；可重复使用。                                                     |
| `--fail-fast`            | 关闭              | 在首次检查或场景失败后停止。                                       |
| `--allow-failures`       | 关闭              | 写入工件，但不因场景失败而返回失败退出代码。         |
| `--provider-mode <mode>` | `live-frontier`   | 使用 `mock-openai` 进行确定性分派，或使用 `live-frontier` 调用实时提供商。 |
| `--model <ref>`          | 提供商默认值      | 设置主要 `provider/model` 引用。                                          |
| `--alt-model <ref>`      | 提供商默认值      | 设置切换模型的场景所使用的备用模型。                        |
| `--fast`                 | 关闭              | 在支持的情况下启用提供商快速模式。                                           |
| `--output-dir <path>`    | 自动生成          | 选择报告目录；相对路径基于 `--repo-root` 解析。           |
| `--repo-root <path>`     | 当前目录          | 从中性工作目录运行。                                                |
| `--sut-account <id>`     | `sut`             | 在子 Gateway 网关配置中选择 Matrix 账户 ID。                            |

Matrix QA 不会租用共享 Matrix 凭据：适配器会在本地创建
一次性用户，因此不接受 `--credential-source` 或
`--credential-role`。可使用
`OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖主服务器镜像；可使用
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` 调整否定性无回复断言（默认为 `8000`，
且上限为当前场景超时时间）。单次命令通常会在工件
刷新后强制彻底退出，因为 Matrix 加密原生句柄的生命周期可能超过清理过程；只有在需要
命令正常返回的直接测试框架中，才设置
`OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`。

每次运行都会在所选输出目录下写入常规 QA Lab 工件：
`qa-suite-report.md`、`qa-suite-summary.json`、`qa-evidence.json`
以及经过脱敏的 `matrix-harness-*/matrix-qa-harness.json` 清单。如果清理
失败，请运行输出的 `docker compose ... down --remove-orphans` 恢复
命令。在较慢的运行器上，请增大无回复时间窗口；在快速 CI 中，较小的
窗口可以缩短否定性断言时间。

这些场景覆盖单元测试无法端到端证明的传输行为：
提及门控、允许 Bot 策略、允许列表、顶层回复和线程回复、
私信路由、表情回应处理、入站编辑抑制、重启重放去重、
主服务器中断恢复、审批元数据交付、媒体处理，以及 Matrix E2EE
引导/恢复/验证流程。E2EE CLI 配置还会通过同一个一次性主服务器执行
`openclaw matrix encryption setup` 和验证命令，然后再检查
Gateway 网关回复。

`matrix-room-block-streaming` 和 `subagent-thread-spawn` 仍可通过
显式选择 `--scenario` 使用，但不包含在默认 `all` 配置中。

CI 在
`.github/workflows/qa-live-transports-convex.yml` 中使用相同的命令界面。定时和发布运行
会执行发布场景。手动 `matrix_profile=all` 分派会并行执行
`transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 配置；
聚焦分派会在一个作业中选择 `fast`、`release` 或 `transport`。

### Discord Mantis 场景

Discord 还提供仅限 Mantis 的可选场景，用于复现错误。使用
`--scenario discord-status-reactions-tool-only` 可测试显式状态
表情回应时间线，或使用 `--scenario discord-thread-reply-filepath-attachment`
创建真实 Discord 线程并验证 `message.thread-reply`
会保留 `filePath` 附件。这些场景不包含在默认
实时 Discord 通道中，因为它们是修复前后的复现探针，而不是
广泛的冒烟测试覆盖。配置
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 后，线程附件 Mantis 工作流还可以在 QA
环境中添加一段已登录 Discord Web 见证视频。
该查看器配置仅用于可视化捕获；通过/失败
判定仍来自 Discord REST 预期结果验证程序。

对于其他使用真实传输的冒烟测试通道：

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

它们以一个预先存在的真实渠道为目标，其中包含两个 Bot 或账户（驱动程序 +
SUT）。这四种传输所需的环境变量、场景列表、输出工件和 Convex
凭据池记录在下方的
[Discord、Slack、Telegram 和 WhatsApp QA 参考](#discord-slack-telegram-and-whatsapp-qa-reference)
中。

### Mantis Slack 桌面端和可视化任务运行器

如需运行支持 VNC 救援的完整 Slack 桌面虚拟机，请运行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

该命令会租用一台 Crabbox 桌面/浏览器计算机，在虚拟机内运行 Slack 实时通道，在 VNC 浏览器中打开 Slack Web，捕获桌面，并将 `slack-qa/`、`slack-desktop-smoke.png` 和
`slack-desktop-smoke.mp4`（视频捕获可用时）复制回
Mantis 工件目录。Crabbox 桌面/浏览器租约会预先提供捕获工具和浏览器/原生构建辅助软件包，因此该场景应仅在较旧的租约上安装后备项。Mantis 会在 `mantis-slack-desktop-smoke-report.md` 中报告总耗时和各阶段耗时，以便在运行缓慢时显示时间是花在租约预热、凭据获取、远程设置还是
工件复制上。通过 VNC 手动登录 Slack Web 后，复用 `--lease-id <cbx_...>`；复用的租约还会保持 Crabbox 的 pnpm 存储缓存处于预热状态。默认的 `--hydrate-mode source` 从源代码检出进行验证，并
在虚拟机内运行安装/构建。仅当复用的远程工作区已有 `node_modules` 和已构建的 `dist/` 时，才使用 `--hydrate-mode prehydrated`；
该模式会跳过成本高昂的安装/构建步骤，并在工作区未就绪时以失败关闭。设置 `--gateway-setup` 后，Mantis 会在虚拟机内的端口 `38973` 上持续运行
OpenClaw Slack Gateway 网关；未设置时，该命令会运行常规的 Bot 间 Slack QA 通道，并在捕获工件后退出。

要使用桌面证据验证原生 Slack 审批 UI，请运行 Mantis
审批检查点模式：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

此模式与 `--gateway-setup` 互斥。它会运行 Slack
审批场景，拒绝非审批场景 ID，在每个待处理和已解决的审批状态处等待，将观察到的 Slack API 消息渲染到
`approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`，然后在任何检查点、
消息证据、确认或渲染的屏幕截图缺失或为空时失败。冷启动 CI 租约仍可能在
`slack-desktop-smoke.png` 中显示 Slack 登录界面；审批检查点图像是该通道的视觉
证据。

默认检查点运行会保留两个标准 Slack 审批场景。
要捕获任一选择启用的 Codex 审批路由，请使用
`--scenario slack-codex-approval-exec-native` 或
`--scenario slack-codex-approval-plugin-native` 显式选择；Mantis 接受两者并生成
相同的待处理/已解决屏幕截图对。运行器会为每个选定的 Codex 路由延长检查点
和远程命令的截止时间，以便完整的
审批、智能体完成和已解决更新序列能够完成。

操作员检查清单、GitHub 工作流分派命令、证据评论
契约、hydrate 模式决策表、耗时解读和故障
处理步骤位于
[Mantis Slack 桌面运行手册](/zh-CN/concepts/mantis-slack-desktop-runbook)。

对于智能体/CV 风格的桌面任务，请运行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` 会租用或复用一台 Crabbox 桌面/浏览器计算机，启动
`crabbox record --while`，通过嵌套的
`visual-driver` 驱动可见浏览器，捕获 `visual-task.png`，在选择 `--vision-mode image-describe` 时针对屏幕截图运行 `openclaw infer image
describe`，并写入 `visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json` 和
`mantis-visual-task-report.md`。设置 `--expect-text` 后，视觉
提示会请求结构化 JSON 结论（`visible`、`evidence`、`reason`），
且仅当模型报告 `visible: true` 并提供引用预期文本的证据时才通过；仅引用
目标文本的 `visible: false` 响应仍无法通过断言。使用 `--vision-mode metadata` 可执行
不使用模型的冒烟测试，在不调用图像理解提供商的情况下验证桌面、浏览器、屏幕截图和视频
管线。录制内容是 `visual-task` 的必需工件；如果 Crabbox 未录制任何非空的
`visual-task.mp4`，即使视觉驱动程序已通过，任务也会失败。失败时，Mantis 会保留租约以供 VNC 使用，除非任务已经通过
且未设置 `--keep-lease`。

### 凭据池健康检查

使用池化实时凭据前，请运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex 代理环境（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`），验证端点设置，仅报告
`OPENCLAW_QA_CONVEX_SECRET_CI` 和
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 的已设置/缺失状态，并在存在维护者密钥时验证
管理员/列表可达性。

## 规范场景覆盖范围

根目录的 `taxonomy.yaml` 定义语义覆盖 ID。位于 `qa/scenarios/` 下的场景 YAML 文件
将每个场景映射到这些 ID，并拥有执行
元数据：`channel` 是唯一的渠道要求，`profiles` 声明
具名运行成员资格。渠道驱动程序是可互换的运行级
实现选择。TypeScript
运行器会查询该目录；它们不会维护并行的场景或覆盖范围
清单。

静态 `qa coverage` 输出会报告分类法到场景的映射。实际
证据来自 `qa-evidence.json`，其中记录了已执行的场景、
覆盖 ID、渠道、实际使用的驱动程序和结果。渠道和驱动程序是
报告维度，而不是额外的覆盖 ID 词汇表或场景
适用性维度。

要运行不将 Docker 引入 QA 路径的一次性 Linux 虚拟机通道，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass 客户机，安装依赖项，在客户机内构建 OpenClaw，
运行 `qa suite`，然后将常规 QA 报告和
摘要复制回主机上的 `.artifacts/qa-e2e/...`。它复用与主机上 `qa suite` 相同的
场景选择行为。

默认情况下，主机和 Multipass 套件运行会通过隔离的 Gateway 网关工作进程
并行执行多个选定场景。`qa-channel` 默认
并发数为 4，上限为所选场景数。使用 `--concurrency
<count>` 调整工作进程数，或使用 `--concurrency 1` 串行执行。
使用 `--pack personal-agent` 运行个人助理基准包（10 个
场景）。包选择器会与重复的 `--scenario` 标志叠加：
先运行显式场景，然后按包内顺序运行包场景，并
移除重复项。当自定义 QA 运行器已经提供 OpenTelemetry 收集器设置时，使用 `--pack observability` 同时选择
`otel-trace-smoke` 和 `docker-prometheus-smoke` 场景。

任何场景失败时，该命令都会以非零状态退出。当你希望获得工件而不返回失败退出代码时，请使用 `--allow-failures`。

实时运行会转发适合客户机使用的受支持 QA 身份验证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及
存在时的 `CODEX_HOME`。将 `--output-dir` 保留在仓库根目录下，以便
客户机可通过挂载的工作区写回。

## Discord、Slack、Telegram 和 WhatsApp QA 参考

Matrix 适配器使用上文记录的基于一次性 Docker 的通道。
Discord、Slack、Telegram 和 WhatsApp 针对预先存在的真实
传输运行，因此其参考信息位于此处。

### 共用 CLI 标志

这些通道通过
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，并
接受相同的标志：

| 标志                                  | 默认值                                            | 说明                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 仅运行此场景。可重复使用。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 写入报告、摘要、证据、传输专用工件和输出日志的位置。相对路径基于 `--repo-root` 解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 从中立的当前工作目录调用时的仓库根目录。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA Gateway 网关配置中的临时账户 ID。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai`、`aimock` 或 `live-frontier`。                                                                                                    |
| `--model <ref>` / `--alt-model <ref>` | 提供商默认值                                   | 主要/备用模型引用。                                                                                                                   |
| `--fast`                              | 关闭                                                | 在支持的情况下启用提供商快速模式。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | 请参阅 [Convex 凭据池](#convex-credential-pool)。                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI 中为 `ci`，其他情况下为 `maintainer`                 | 使用 `--credential-source convex` 时采用的角色。                                                                                                    |
| `--allow-failures`                    | 关闭                                                | 场景失败时写入工件，但不返回失败退出代码。                                                                      |

任何场景失败时，各通道都会以非零状态退出。`--allow-failures` 会写入
工件，但不设置失败退出代码。Telegram 还接受
`--list-scenarios`，用于打印可用场景 ID 并退出；其他通道
不提供该标志。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目标为一个真实的私有 Telegram 群组，其中包含两个不同的 Bot（驱动程序 +
被测系统）。被测系统 Bot 必须拥有 Telegram 用户名；当两个 Bot 都在
`@BotFather` 中启用 **Bot-to-Bot Communication Mode** 时，Bot 间观察的
效果最佳。

使用 `--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数字聊天 ID（字符串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

`release` 配置文件会选择受维护的 Telegram YAML 场景；`all`
会添加选择启用的会话、用量、回复链和流式压力检查。显式
`--scenario` 值会覆盖该配置文件。

- `channel-canary`
- `channel-mention-gating`
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

`release` 配置始终涵盖金丝雀测试、提及门控、原生命令
回复、命令寻址以及机器人间群组回复。`mock-openai`
还包括确定性的长最终回复预览检查。
`telegram-current-session-status-tool` 和
`telegram-tool-only-usage-footer` 仍为可选项：前者仅在紧接金丝雀测试后按线程运行时
才稳定，后者则通过真实 Telegram 验证仅含工具调用的回复上的
`/usage` 页脚。使用 `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` 输出当前默认/可选划分
及回归引用。每个 Telegram 实时适配器场景都使用 `--profile all`。

输出工件：

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - 实时传输检查的证据条目，
  包括配置、覆盖范围、提供商、渠道、工件、结果和 RTT
  字段。

软件包 Telegram 运行使用相同的 Telegram 凭据契约。重复 RTT
测量是常规软件包 Telegram 实时通道的一部分；所选 RTT 检查的
RTT 分布会归入 `qa-evidence.json` 中的 `result.timing`。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 后，软件包实时包装器会租用
`kind: "telegram"` 凭据，将所租用的群组/驱动程序/SUT
机器人环境变量导出到已安装软件包的运行中，维持租约心跳，并在关闭时
释放租约。软件包包装器默认对 `channel-canary` 执行 20 次 RTT 检查，
RTT 超时为 30s；选择 Convex 时，在 CI 之外默认使用 Convex 角色
`maintainer`。可通过覆盖
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
或 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` 来调整 RTT 测量，
无需创建单独的 RTT 命令或 Telegram 专用摘要格式。

### Discord QA

```bash
pnpm openclaw qa discord
```

目标是一个真实的 Discord 私有服务器频道，其中有两个机器人：由测试框架
控制的驱动机器人，以及由子 OpenClaw Gateway 网关通过内置 Discord 插件
启动的 SUT 机器人。验证频道提及处理、SUT 机器人已向 Discord 注册原生
`/help` 命令，以及可选的 Mantis 证据场景。

当 `--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必须与 Discord 返回的 SUT 机器人用户 ID
  匹配（否则该通道会快速失败）。

可选：

- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 为
  `discord-voice-autojoin` 选择语音/舞台频道；如果未设置，该场景会选择
  SUT 机器人可见的第一个语音/舞台频道。

Discord YAML 模块场景（`qa/scenarios/channels/discord-*.yaml`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 可选语音场景。单独运行，启用
  `channels.discord.voice.autoJoin`，并验证 SUT 机器人当前的
  Discord 语音状态是否为目标语音/舞台频道。Convex Discord
  凭据可以包含可选的 `voiceChannelId`；否则运行器
  适配器会发现服务器中第一个可见的语音/舞台频道。
- `discord-status-reactions-tool-only` - 可选 Mantis 场景。此场景会将 SUT
  切换为通过 `messages.statusReactions.enabled=true` 始终开启、仅含工具调用的服务器回复，
  因此单独运行；随后捕获 REST 表情回应时间线以及 HTML/PNG
  可视化工件。Mantis 前后报告还会将场景提供的 MP4 工件保留为
  `baseline.mp4` 和 `candidate.mp4`。
- `discord-thread-reply-filepath-attachment` - 可选 Mantis 场景；请参阅
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

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - 实时传输检查的证据条目。
- `discord-qa-reaction-timelines.json` 和
  `discord-status-reactions-tool-only-timeline.png`，在状态表情回应场景运行时生成。

### Slack QA

```bash
pnpm openclaw qa slack
```

目标是一个真实的 Slack 私有频道，其中有两个不同的机器人：由测试框架
控制的驱动机器人，以及由子 OpenClaw Gateway 网关通过内置 Slack 插件
启动的 SUT 机器人。

当 `--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

可选：

- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 为 Mantis 启用可视化审批
  检查点。适配器会写入 `<scenario>.pending.json` 和
  `<scenario>.resolved.json`，然后等待匹配的 `.ack.json` 文件。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` 覆盖检查点
  确认超时。默认值为 `120000`。

通过 Slack 实时适配器公开的规范 YAML 场景：

- `thread-follow-up`
- `thread-isolation`

Slack YAML 模块场景（`qa/scenarios/channels/slack-*.yaml`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` - 可选的真实 Slack 探测，用于确认
  已配置的禁用频道会发出结构化警告而不回复。
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`、`slack-progress-commentary-false`、
  `slack-progress-commentary-omitted` 和
  `slack-progress-commentary-verbose-dedupe` - 可选的真实 Slack 探测，用于验证
  独立的评论/工具进度控制、键缺失时的旧版默认行为，以及启用持久化详细进度时的
  单次投递行为。
- `slack-reaction-glyph-native` - 可选的实时消息工具表情回应场景。
  指示智能体传递准确的 `✅` 字形，并确认 Slack 已在目标消息上
  为 SUT 机器人存储 `white_check_mark`。
- `slack-chart-presentation-native` - 可选的可移植图表场景，
  验证原生 `data_visualization` 块及准确的无障碍文本。
- `slack-table-presentation-native` - 可选的可移植表格场景，
  验证原生 `data_table` 块、准确的行以及无障碍文本。
- `slack-table-invalid-blocks-fallback` - 可选的直接传输场景，
  通过生产 Slack 发送路径发送一个结构可读但超出限制的原始表格，其中包含
  101 个数据行及其表头，证明 Slack 自身返回 `invalid_blocks`，
  并验证所存储的禁用格式回退内容完整且不包含原生数据块。场景详情仅保留安全的
  错误代码、计数和布尔值证据。
- `slack-approval-exec-native` - 可选的原生 Slack Exec 审批场景。
  通过 Gateway 网关请求 Exec 审批，验证 Slack 消息包含原生审批按钮，
  完成处理，并验证处理后的 Slack 更新。
- `slack-approval-plugin-native` - 可选的原生 Slack 插件审批
  场景。同时启用 Exec 和插件审批转发，使插件事件不会被 Exec 审批路由
  抑制，然后验证相同的待处理/已处理原生 Slack UI 路径。
- `slack-codex-approval-exec-native` - 可选的 Codex Guardian 命令审批
  场景。以 Guardian 模式启用 Codex 插件，将源自 Slack 的 Gateway 网关
  智能体轮次通过 Codex app-server 测试框架路由，等待针对
  `openclaw-codex-app-server` 的原生 Slack 插件审批提示，
  完成审批，并验证 Codex 轮次以预期的命令输出和助手标记结束。
- `slack-codex-approval-plugin-native` - 可选的 Codex Guardian 文件审批
  场景。使用工作区外部的 `apply_patch` 指令，使 Codex 发出
  app-server 文件变更审批路由；随后验证相同的原生 Slack
  待处理/已处理审批路径、最终助手标记以及清理前的准确文件内容。

Codex 审批场景需要 `openai/*` 或 `codex/*` `--model`、
常规实时模型凭据，以及 Codex 插件接受的 Codex 身份验证或 API 密钥身份验证。
场景详情包括 Codex app-server 方法、所选 Codex 模型键、最终 Codex 轮次状态和
操作标记验证，以及经过脱敏的 Slack 审批元数据。

输出工件：

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - 实时传输检查的证据条目。
- `approval-checkpoints/` - 仅当 Mantis 设置
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 时生成；包含检查点 JSON、
  确认 JSON 以及待处理/已处理截图。

#### 设置 Slack 工作区

该通道需要同一工作区中的两个不同 Slack 应用，以及一个两个机器人均为成员的
频道：

- `channelId` - 两个机器人均已受邀加入的频道的
  `Cxxxxxxxxxx` ID。请使用专用频道；该通道每次运行都会发帖。
- `driverBotToken` - **Driver** 应用的机器人令牌
  （`xoxb-...`）。
- `sutBotToken` - **SUT** 应用的机器人令牌
  （`xoxb-...`）；它必须是与驱动程序不同的 Slack 应用，
  以确保其机器人用户 ID 不同。
- `sutAppToken` - SUT 应用的应用级令牌
  （`xapp-...`），具有 `connections:write`，
  供 Socket Mode 使用，以便 SUT 应用接收事件。

相比复用生产工作区，优先使用专用于 QA 的 Slack 工作区。

下面的 SUT 清单有意将内置 Slack 插件的生产安装
（`extensions/slack/src/setup-shared.ts:12`）限制为实时 Slack QA
套件所覆盖的权限和事件。有关用户所见的生产频道设置，请参阅
[Slack 频道快速设置](/zh-CN/channels/slack#quick-setup)；QA Driver/SUT
组合有意保持独立，因为该通道需要同一工作区中两个不同的机器人用户 ID。

**1. 创建 Driver 应用**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → 选择 QA 工作区，粘贴以下清单，
然后选择 _Install to Workspace_：

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "OpenClaw QA Slack 实时通道的测试驱动机器人"
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
`driverBotToken`。驱动程序只需发布消息并标识自身；不需要事件，
也不需要 Socket Mode。

**2. 创建 SUT 应用**

在同一工作区中再次执行 _Create New App → From a manifest_。此 QA 应用
有意使用内置 Slack 插件生产清单（`extensions/slack/src/setup-shared.ts:12`）的精简版本：
由于实时 Slack QA 套件尚未覆盖表情回应处理，因此省略表情回应
权限范围和事件。

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

Slack 创建应用后，在其设置页面执行以下两项操作：

- _Install to Workspace_ → 复制 _Bot User OAuth Token_ → 该值将成为
  `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 添加
  权限范围 `connections:write` → 保存 → 复制 `xapp-...` 的值 → 该值
  将成为 `sutAppToken`。

分别使用每个令牌调用 `auth.test`，验证两个 Bot 具有不同的用户 ID。
运行时通过用户 ID 区分驱动端和 SUT；两者复用同一个应用会立即导致提及门控失败。

**3. 创建频道**

在 QA 工作区中创建一个频道（例如 `#openclaw-qa`），然后从频道内邀请两个
Bot：

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

从 _channel info → About → Channel ID_ 复制 `Cxxxxxxxxxx` ID，该值
将成为 `channelId`。可以使用公开频道；如果使用私有频道，
两个应用都已具有 `groups:history`，因此测试框架读取历史记录仍会
成功。

**4. 注册凭据**

有两种方式。单机调试时使用环境变量（设置四个
`OPENCLAW_QA_SLACK_*` 变量并传入 `--credential-source env`），或者向共享
Convex 池写入初始数据，以便 CI 和其他维护者租用这些凭据。

对于 Convex 池，将四个字段写入 JSON 文件：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在 shell 中导出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
后，执行注册并验证：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack 池初始数据"

pnpm openclaw qa credentials list --kind slack --status all --json
```

预期结果为 `count: 1`、`status: "active"`，且没有 `lease` 字段。

**5. 端到端验证**

在本地运行该通道，确认两个 Bot 可以通过代理相互通信：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

正常运行会在远低于 30 秒的时间内完成，并且 `qa-suite-report.md`
会显示 `slack-canary` 和 `slack-mention-gating` 的状态均为 `pass`。如果该
通道挂起约 90 秒后以 `Convex credential pool exhausted
for kind "slack"` 退出，则池为空或所有记录均已租出——
`qa
credentials list --kind slack --status all --json` 会说明具体原因。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

目标是两个专用 WhatsApp Web 账户：一个由测试框架控制的驱动账户，
以及一个由子 OpenClaw Gateway 网关通过内置 WhatsApp 插件启动的 SUT 账户。

当使用 `--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

可选：

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` 可启用群组场景，例如
  `whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-broadcast-group-fanout`、`whatsapp-group-activation-always`、
  `whatsapp-group-reply-to-bot-triggers`、群组操作/媒体/投票场景，
  以及 `whatsapp-group-allowlist-block`。

WhatsApp YAML 场景（`qa/scenarios/channels/whatsapp-*.yaml`）：

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
- 用户路径消息操作：`whatsapp-agent-message-action-react` 从真实的驱动端私信开始，
  允许模型调用 `message` 工具，并观察原生 WhatsApp 表情回应。
  `whatsapp-agent-message-action-upload-file` 对 `message(action=upload-file)` 使用相同的验证方式，并观察
  原生 WhatsApp 媒体。`whatsapp-group-agent-message-action-react` 和
  `whatsapp-group-agent-message-action-upload-file` 在真实 WhatsApp 群组中验证相同的
  用户可见操作。
- 群组扇出：`whatsapp-broadcast-group-fanout` 从一条提及 Bot 的
  WhatsApp 群组消息开始，并验证来自 `main`
  和 `qa-second` 的不同可见回复。
- 群组激活：`whatsapp-group-activation-always` 将真实群组
  会话更改为 `/activation always`，验证未提及 Bot 的群组消息会唤醒
  智能体，然后恢复为 `/activation mention`。
  `whatsapp-group-reply-to-bot-triggers` 预先生成一条 Bot 回复，向其发送不含显式提及的
  原生引用回复，并验证智能体会被该回复上下文唤醒。
- 入站媒体和结构化消息：`whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。
  这些场景通过驱动端发送真实的 WhatsApp 图像、音频、文档、位置、联系人、
  贴纸和表情回应事件。
- 直接 Gateway 网关契约探测：`whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-outbound-send-serialization`、
  `whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、
  `whatsapp-message-actions`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`。这些场景有意绕过模型提示，
  用于验证确定性的 Gateway 网关/渠道 `send`、`poll` 和
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

目录目前包含 52 个场景。`live-frontier` 默认通道仅保留
8 个场景，以提供快速冒烟测试覆盖。`mock-openai`
默认通道通过真实 WhatsApp 传输确定性地运行 39 个场景，仅模拟模型输出；
审批场景以及少数开销较大或会阻塞的检查仍需通过场景 ID 显式运行。

WhatsApp QA 驱动端观察结构化实时事件（`text`、`media`、
`location`、`reaction` 和 `poll`），并可主动发送媒体、投票、
联系人、位置和贴纸。QA Lab 通过
`@openclaw/whatsapp/api.js` 包公开接口导入该驱动端，而不会访问私有的
WhatsApp 运行时文件。对于群组观察，`fromJid` 是群组 JID，
而 `participantJid` 和 `fromPhoneE164` 用于标识参与者发送者。
消息内容默认经过脱敏处理。直接 Gateway 网关投票、文件上传、
媒体、群组投票、群组媒体和回复结构探测属于传输/API
契约检查；它们不能证明用户提示会使智能体选择相同操作。用户路径操作证明
来自 `whatsapp-agent-message-action-react` 和
`whatsapp-group-agent-message-action-react` 等场景，其中驱动端发送普通
WhatsApp 消息，QA Lab 则观察由此产生的原生 WhatsApp 工件。
WhatsApp 场景详细信息包含每个场景的验证方式（`user-path`、
`direct-gateway` 或 `native-approval`），以免将证据误解为
比其实际证明内容更强的契约。

输出工件：

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json`——实时传输检查的证据条目。

### Convex 凭据池

Discord、Slack、Telegram 和 WhatsApp 通道可以从共享 Convex 池租用凭据，
而不是读取上述环境变量。传入
`--credential-source convex`（或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；
QA Lab 会获取独占租约，在运行期间持续发送心跳，并在关闭时释放租约。
池类型包括 `"discord"`、`"slack"`、
`"telegram"` 和 `"whatsapp"`。

代理在 `admin/add` 上验证的载荷结构：

- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string,
sutToken: string }`——`groupId` 必须是数字聊天 ID 字符串。
- Telegram 真实用户（`kind: "telegram-user"`）：`{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`——
  仅用于 Mantis Telegram Desktop 证明。通用 QA Lab 通道不得获取
  此类型。
- WhatsApp（`kind: "whatsapp"`）：`{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }`——电话号码必须是不同的 E.164 字符串。

Mantis Telegram Desktop 证明工作流会为 TDLib CLI 驱动端和 Telegram Desktop
见证端共同持有一个独占的 Convex `telegram-user` 租约，
然后在发布证明后释放该租约。

当 PR 需要确定性的视觉差异时，Mantis 可以在 `main` 和 PR 头部
使用相同的模拟模型回复，同时更改 Telegram 格式化程序或投递层。
捕获默认设置已针对 PR 评论优化：标准 Crabbox 规格、24fps 桌面录制、
24fps 动态 GIF 和 1920px 预览宽度。前后对比评论应发布一个整洁的软件包，
其中仅包含预期的 GIF。

Slack 通道也可以使用该池。Slack 载荷结构检查目前位于 Slack QA 运行程序中，
而非代理中；请使用 `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`，并采用类似 `Cxxxxxxxxxx` 的
Slack 频道 ID。有关应用和权限范围配置，请参阅
[设置 Slack 工作区](#setting-up-the-slack-workspace)。

运行所需的环境变量和 Convex 代理端点契约位于
[测试 → 通过 Convex 共享 Telegram 凭据](/zh-CN/help/testing#shared-telegram-credentials-via-convex-v1)
（该章节名称早于多渠道池；各种类型共享相同的租约语义）。

## 仓库中的初始数据

初始数据资源位于 `qa/`：

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

这些内容特意存放在 git 中，以便人类和智能体都能查看 QA 计划。

`qa-lab` 始终作为通用 YAML 场景运行程序。每个场景 YAML 文件都是
一次测试运行的事实来源，并应定义：

- 顶层 `title`
- `scenario` 元数据
- `scenario` 中可选的类别、能力、通道和风险元数据
- `scenario` 中的文档和代码引用
- `scenario` 中可选的插件要求
- `scenario` 中可选的 Gateway 网关配置补丁
- 流程场景使用可执行的顶层 `flow`，Vitest 和
  Playwright 场景则使用 `scenario.execution.kind` / `scenario.execution.path`

支撑 `flow` 的可复用运行时表面保持通用且
横跨多个领域。例如，YAML 场景可以将传输端
辅助程序与浏览器端辅助程序结合起来，后者通过
Gateway 网关的 `browser.request` 接缝驱动嵌入式 Control UI，而无需添加特殊用途的运行器。

场景文件应按产品能力分组，而不是按源代码树
文件夹分组。文件移动时应保持场景 ID 稳定；使用 `docsRefs` 和
`codeRefs` 实现可追溯性。

基线列表应足够广泛，以覆盖：

- 私信和渠道聊天
- 话题串行为
- 消息操作生命周期
- cron 回调
- 记忆检索
- 模型切换
- 子智能体交接
- 读取仓库和文档
- 一个小型构建任务，例如 Lobster Invaders

## 提供商模拟通道

`qa suite` 有两个本地提供商模拟通道：

- `mock-openai` 是可感知场景的 OpenClaw 模拟。它仍是
基于仓库的 QA 和一致性门禁所使用的默认确定性模拟通道。
- `aimock` 启动由 AIMock 支撑的提供商服务器，用于实验性的
协议、固件、录制/回放和混沌测试覆盖。它是附加功能，
不会取代 `mock-openai` 场景分派器。

提供商通道实现在 `extensions/qa-lab/src/providers/` 下。
每个提供商拥有自己的默认值、本地服务器启动逻辑、Gateway 网关模型配置、
身份验证配置文件暂存需求以及实时/模拟能力标志。共享套件和
Gateway 网关代码通过提供商注册表进行路由，而不是按
提供商名称进行分支。

## 传输适配器

`qa-lab` 为 YAML QA 场景提供通用传输接缝。`qa-channel` 是
默认的合成传输。`crabline` 启动具有本地提供商形态的服务器，并
针对这些服务器运行 OpenClaw 的常规渠道插件。`live` 保留用于
真实提供商凭证和外部渠道。

在架构层面，职责划分如下：

- `qa-lab` 负责通用场景执行、工作进程并发、工件
  写入和报告。
- 传输适配器负责 Gateway 网关配置、就绪检查、入站和出站
  观察、传输操作以及规范化的传输状态。
- `qa/scenarios/` 下的 YAML 场景文件定义测试运行；`qa-lab`
  提供执行这些场景的可复用运行时表面。

### 添加渠道

向 YAML QA 系统添加渠道时，需要提供渠道实现，
以及一个用于检验渠道契约的场景包。若要提供冒烟 CI
覆盖，请添加匹配的 Crabline 本地提供商服务器，并通过
`crabline` 驱动程序公开它。

当共享 `qa-lab` 主机可以负责该流程时，不要添加新的顶级 QA 命令根。

`qa-lab` 负责共享主机机制：

- `openclaw qa` 命令根
- 套件启动和拆卸
- 工作进程并发
- 工件写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容性别名

运行器插件负责传输契约：

- 如何在共享 `qa` 根下挂载 `openclaw qa <runner>`
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何公开对话记录和规范化传输状态
- 如何执行由传输支撑的操作
- 如何处理特定于传输的重置或清理

新渠道的最低采用标准：

1. 让 `qa-lab` 继续负责共享 `qa` 根。
2. 在共享 `qa-lab` 主机接缝上实现传输运行器。
3. 将特定于传输的机制保留在运行器插件或渠道
   测试框架中。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个
   竞争性的根命令。运行器插件应在
   `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations`
   数组。保持 `runtime-api.ts` 轻量；延迟加载的 CLI 和
   运行器执行应置于单独的入口点之后。可选的
   `adapterFactory` 可将传输公开给共享场景，而不更改
   命令的现有场景目录。
5. 在主题化的 `qa/scenarios/`
   目录下编写或调整 YAML 场景。
6. 新场景使用通用场景辅助程序。
7. 除非仓库正在进行有意迁移，否则应保持现有兼容性别名正常工作。

决策规则非常严格：

- 如果行为可以在 `qa-lab` 中统一表达，就将其放入 `qa-lab`。
- 如果行为依赖某个渠道传输，则将其保留在对应的运行器
  插件或插件测试框架中。
- 如果场景需要一项可供多个渠道使用的新能力，
  应添加通用辅助程序，而不是在 `suite.ts` 中添加特定于渠道的分支。
- 如果某项行为仅对一种传输有意义，则应让场景
  保持特定于该传输，并在场景契约中明确说明。

### 场景辅助程序名称

新场景首选的通用辅助程序：

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

现有场景仍可使用兼容性别名：
`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、
`formatConversationTranscript`、`resetBus`，但新场景的编写
应使用通用名称。这些别名是为了避免一次性
迁移而存在的，并不代表未来的发展模式。

## 报告

`qa-lab` 从观察到的总线时间线导出 Markdown 协议报告。
该报告应回答：

- 哪些功能正常工作
- 哪些功能失败
- 哪些功能仍被阻塞
- 哪些后续场景值得添加

若要查看可用场景清单——可用于估算后续工作
或接入新传输——请运行 `pnpm openclaw qa coverage`（添加 `--json`
可获得机器可读输出）。为所触及的
行为或文件路径选择聚焦验证时，请运行 `pnpm openclaw qa coverage --match <query>`。
匹配报告会搜索场景元数据、文档引用、代码引用、覆盖范围 ID、
插件和提供商要求，然后输出匹配的 `qa suite
--scenario ...` 目标。

每次 `qa suite` 运行都会为选定的
场景集写入顶级 `qa-evidence.json`、
`qa-suite-summary.json` 和 `qa-suite-report.md` 工件。声明了 `execution.kind: vitest` 或
`execution.kind: playwright` 的场景会运行匹配的测试路径，并同时写入
每场景日志。声明了 `execution.kind: script` 的场景会通过 `node --import tsx` 运行
位于 `execution.path` 的证据生成器（在 `execution.args` 中展开
`${outputDir}` 和 `${scenarioId}`）；该生成器会写入自己的
`qa-evidence.json`，其中的条目会导入套件输出，且工件路径
相对于该生成器的 `qa-evidence.json` 解析。当通过 `qa run
--qa-profile` 到达 `qa suite` 时，同一个 `qa-evidence.json` 还会包含所选分类法类别的配置文件
评分卡摘要。

应将覆盖范围输出视为发现辅助信息，而不是门禁的替代品；
所选场景仍需使用与被测行为相匹配的提供商模式、实时传输、
Multipass、Testbox 或发布通道。有关
评分卡的背景信息，请参阅[成熟度评分卡](/zh-CN/maturity/scorecard)。

若要检查角色特点和风格，请对多个实时
模型引用运行同一个场景，并编写经过评判的 Markdown 报告：

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

该命令运行本地 QA Gateway 网关子进程，而不是 Docker。角色
评估场景应通过 `SOUL.md` 设置角色设定，然后运行普通的
用户轮次，例如聊天、工作区帮助和小型文件任务。不得告知候选
模型其正在接受评估。该命令会保留
每份完整对话记录，记录基本运行统计信息，然后要求评判模型在
快速模式下进行排名，在支持的情况下使用 `xhigh` 推理，并按照
自然程度、整体感觉和幽默感对各次运行进行排序。比较
提供商时请使用 `--blind-judge-models`：评判提示仍会获得所有对话记录和运行状态，但
候选引用会被替换为 `candidate-01` 等中性标签；
报告会在解析后将排名映射回真实引用。

候选运行默认使用 `high` 思考级别；GPT-5.6 Luna 使用 `medium`，
而支持该模式的旧版 OpenAI 评估引用使用 `xhigh`。使用 `--model provider/model,thinking=<level>` 可内联覆盖特定
候选项；内联选项还支持 `fast`、`no-fast` 和 `fast=<bool>`。`--thinking
<level>` 仍用于设置全局回退值，而旧版 `--model-thinking
<provider/model=level>` 形式则为兼容性而保留。OpenAI 候选
引用默认使用快速模式，以便在提供商支持时使用优先处理。
仅当希望强制所有候选模型开启快速模式时，才传入 `--fast`。
报告会记录候选和评判运行的持续时间，以供基准分析，但评判
提示会明确要求不得按速度排名。候选和评判模型运行的默认
并发数均为 16。当提供商限制或本地
Gateway 网关压力导致运行干扰过大时，请降低 `--concurrency` 或 `--judge-concurrency`。

未传入候选 `--model` 时，角色评估默认使用
`openai/gpt-5.6-luna`、`openai/gpt-5.2`、`openai/gpt-5`、
`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。未传入
`--judge-model` 时，评判模型默认使用
`openai/gpt-5.6-sol,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-8,thinking=high`。

## 相关文档

- [成熟度评分卡](/zh-CN/maturity/scorecard)
- [个人智能体基准包](/zh-CN/concepts/personal-agent-benchmark-pack)
- [QA 渠道](/zh-CN/channels/qa-channel)
- [测试](/zh-CN/help/testing)
- [仪表板](/zh-CN/web/dashboard)
