---
read_when:
    - 了解 QA 技术栈如何协同工作
    - 扩展 qa-lab、qa-channel 或传输适配器
    - 添加由仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化
summary: QA 栈概览：qa-lab、qa-channel、仓库支持的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-07-06T21:47:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 593069626405668b3691717dd361f3310e148e60fdd5d9b5ac7b5c4898b2c3fd
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 栈以逼近真实渠道形态的方式测试 OpenClaw，这是单元测试无法做到的。

组成部分：

- `extensions/qa-channel`：合成消息渠道，包含私信、频道、线程、表情回应、编辑和删除表面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察转录、注入入站消息，并导出 Markdown 报告。
- `extensions/qa-matrix`：实时传输适配器，在子 QA Gateway 网关内驱动真实的 Matrix 插件。
- `qa/`：由仓库提供的启动任务种子资产和基线 QA 场景。
- [Mantis](/zh-CN/concepts/mantis)：针对需要真实传输协议、浏览器截图、VM 状态和 PR 证据的错误，提供前后对比实时验证。

## 命令界面

每个 QA 流程都在 `pnpm openclaw qa <subcommand>` 下运行。许多流程有 `pnpm qa:*` 脚本别名；两种形式都可用。

| 命令                                                | 用途                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 不带 `--qa-profile` 时运行内置 QA 自检；带 `--qa-profile smoke-ci`、`--qa-profile release` 或 `--qa-profile all` 时运行由分类法支持的成熟度 profile runner。                                                                                                       |
| `qa suite`                                          | 针对 QA Gateway 网关 lane 运行仓库支持的场景。`--runner multipass` 使用一次性 Linux VM，而不是主机。                                                                                                                                                                |
| `qa coverage`                                       | 打印 YAML 场景覆盖率清单（`--json` 用于机器输出；`--match <query>` 用于查找某个被触及行为的场景；`--tools` 用于运行时工具 fixture 覆盖率）。                                                                                                                        |
| `qa parity-report`                                  | 比较两个 `qa-suite-summary.json` 文件以进行模型轴一致性 gate，或使用 `--runtime-axis --token-efficiency` 写入 Codex 与 OpenClaw 的运行时一致性和 token 效率报告。                                                                                                   |
| `qa confidence-report`                              | 根据清单对 QA 证据工件进行分类，生成零未知项的置信度报告。                                                                                                                                                                                                         |
| `qa confidence-self-test`                           | 写入带种子的负控 canary，证明置信度 gate 能检测漂移。                                                                                                                                                                                                              |
| `qa jsonl-replay`                                   | 通过运行时一致性回放 harness 回放精选 JSONL 转录。                                                                                                                                                                                                                 |
| `qa character-eval`                                 | 跨多个实时模型运行角色 QA 场景，并生成评审报告。见[报告](#reporting)。                                                                                                                                                                                             |
| `qa manual`                                         | 针对所选提供商/模型 lane 运行一次性 prompt。                                                                                                                                                                                                                       |
| `qa ui`                                             | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                       |
| `qa docker-build-image`                             | 构建预制 QA Docker 镜像。                                                                                                                                                                                                                                          |
| `qa docker-scaffold`                                | 为 QA dashboard + Gateway 网关 lane 写入 docker-compose scaffold。                                                                                                                                                                                                  |
| `qa up`                                             | 构建 QA 站点，启动 Docker 支持的栈，并打印 URL（别名：`pnpm qa:lab:up`；`:fast` 变体会添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                                |
| `qa aimock`                                         | 仅启动 AIMock 提供商服务器。                                                                                                                                                                                                                                       |
| `qa mock-openai`                                    | 仅启动感知场景的 `mock-openai` 提供商服务器。                                                                                                                                                                                                                      |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享 Convex 凭证池。                                                                                                                                                                                                                                           |
| `qa discord`                                        | 针对真实私有 Discord 公会频道的实时传输 lane。                                                                                                                                                                                                                     |
| `qa matrix`                                         | 针对一次性 Tuwunel homeserver 的实时传输 lane。见 [Matrix QA](/zh-CN/concepts/qa-matrix)。                                                                                                                                                                                |
| `qa slack`                                          | 针对真实私有 Slack 频道的实时传输 lane。                                                                                                                                                                                                                           |
| `qa telegram`                                       | 针对真实私有 Telegram 群组的实时传输 lane。                                                                                                                                                                                                                        |
| `qa whatsapp`                                       | 针对真实 WhatsApp Web 账号的实时传输 lane。                                                                                                                                                                                                                        |
| `qa mantis`                                         | 面向实时传输错误的前后对比验证 runner，包含 Discord 状态表情回应证据、Crabbox 桌面/浏览器 smoke，以及 Slack-in-VNC smoke。见 [Mantis](/zh-CN/concepts/mantis) 和 [Mantis Slack Desktop Runbook](/zh-CN/concepts/mantis-slack-desktop-runbook)。 |

`qa matrix` 注册为 runner 插件（`extensions/qa-matrix`）；上面的其他所有 lane 都直接内置在 `qa-lab` 中。

### 由 profile 支持的 `qa run`

由 profile 支持的 `qa run` 从 `taxonomy.yaml` 读取成员关系，然后通过 `qa suite` 分发解析出的场景。`--surface` 和 `--category` 会过滤所选 profile，而不是定义单独的 lane。生成的 `qa-evidence.json` 包含一个 profile 评分卡摘要，其中有已选类别计数和缺失覆盖率 ID；单个证据条目仍然是测试、覆盖率角色和结果的事实来源。分类法功能覆盖率 ID 是精确的证明目标，而不是别名：主场景覆盖率会满足匹配 ID，次要覆盖率保持建议性质。覆盖率 ID 使用带点的 `namespace.behavior` 形式，片段为小写字母数字/短横线；profile、surface 和 category ID 仍可使用现有的短横线或点分分类法 ID。

精简证据会省略每个条目的 `execution`，并设置 `evidenceMode: "slim"`；`smoke-ci` 默认使用精简模式，`--evidence-mode full` 会恢复完整条目：

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

使用 `smoke-ci` 配合 mock 模型提供商和 Crabline 本地提供商服务器，获取确定性的 profile 证明。使用 `release` 针对实时渠道进行 Stable/LTS 证明。仅在明确需要完整分类法证据运行时使用 `all`；它会选择每个活跃成熟度类别，并可通过 `QA Profile Evidence` GitHub Actions workflow 以 `qa_profile=all` 分发。当命令还需要 OpenClaw 根 profile 时，将根 profile 放在 QA 命令之前：

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 操作员流程

当前 QA 操作员流程是一个双栏 QA 站点：

- 左侧：带有智能体的 Gateway 网关 dashboard（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的转录和场景计划。

运行方式：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动 Docker 支持的 Gateway 网关 lane，并公开 QA Lab 页面。在该页面中，操作员或自动化循环可以给智能体分配 QA 任务，观察真实渠道行为，并记录哪些有效、失败或仍然受阻。

为了在不每次重建 Docker 镜像的情况下更快迭代 QA Lab UI，请使用绑定挂载的 QA Lab bundle 启动栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，当 QA Lab 资产哈希变化时，浏览器会自动重新加载。

### 可观测性 smoke

<Note>
可观测性 QA 仅保留在源码 checkout 中。npm tarball 有意省略 QA Lab（以及 `qa-channel`/`qa-matrix`），因此包 Docker 发布 lane 不会运行 `qa` 命令。修改诊断插桩时，请从已构建的源码 checkout 运行这些命令。
</Note>

| 别名                                    | 运行内容                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | 本地 OpenTelemetry 接收器，以及启用 `diagnostics-otel` 的 `otel-trace-smoke` 场景。                                      |
| `pnpm qa:otel:collector-smoke`          | 在真实 OpenTelemetry Collector Docker 容器后运行的同一验证通道。更改端点接线或 collector/OTLP 兼容性时使用它。 |
| `pnpm qa:prometheus:smoke`              | 启用 `diagnostics-prometheus` 的 `docker-prometheus-smoke` 场景。                                                           |
| `pnpm qa:observability:smoke`           | 先运行 `qa:otel:smoke`，再运行 `qa:prometheus:smoke`。                                                                                      |
| `pnpm qa:observability:collector-smoke` | 先运行 `qa:otel:collector-smoke`，再运行 `qa:prometheus:smoke`。                                                                            |

`qa:otel:smoke` 会启动本地 OTLP/HTTP 接收器，运行一个最小化的 QA-channel
智能体轮次，然后断言 traces、metrics 和日志已导出。它会解码
导出的 protobuf trace spans，并检查发布关键形状：
`openclaw.run`、`openclaw.harness.run`、一个最新 GenAI 语义约定的
模型调用 span、`openclaw.context.assembled` 和 `openclaw.message.delivery`
都必须存在。该 smoke 会强制设置
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，因此模型调用
span 必须使用 `{gen_ai.operation.name} {gen_ai.request.model}` 名称；模型
调用在成功轮次中不得导出 `StreamAbandoned`；原始诊断
ID 和 `openclaw.content.*` 属性必须留在 trace 之外。该场景
prompt 要求模型回复一个固定标记，并隐藏一个固定
secret 字符串；原始 OTLP payload 不得包含其中任何一个，也不得包含从场景 id 派生的 QA
会话键。它会在 QA suite artifacts 旁写入 `otel-smoke-summary.json`。

`qa:prometheus:smoke` 会验证未认证的 scrape 被拒绝，然后
检查认证后的 scrape 是否包含发布关键 metric families，
且不含 prompt 内容、response 内容、原始诊断标识符、auth
tokens 或本地路径。

### Matrix smoke 验证通道

对于不需要模型提供商
凭据的真实传输 Matrix smoke 验证通道，请使用确定性 mock OpenAI provider 运行 fast profile：

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

对于 live-frontier provider 验证通道，请显式提供 OpenAI 兼容凭据：

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

此验证通道的完整 CLI 参考、profile/scenario 目录、环境变量和 artifact
布局见 [Matrix QA](/zh-CN/concepts/qa-matrix)。概览：它会
在 Docker 中预置一个一次性 Tuwunel homeserver，注册临时的
driver/SUT/observer 用户，在限定到该传输协议的子 QA
gateway 中运行真实 Matrix 插件（不使用 `qa-channel`），然后在
`.artifacts/qa-e2e/matrix-<timestamp>/` 下写入 Markdown
报告、JSON 摘要、observed-events artifact 和合并输出日志。

这些场景覆盖单元测试无法端到端证明的传输行为：
mention gating、allow-bot policies、allowlists、顶层和 threaded
replies、私信路由、reaction handling、inbound edit suppression、restart
replay dedupe、homeserver interruption recovery、approval metadata delivery、
media handling，以及 Matrix E2EE bootstrap/recovery/verification flows。E2EE
CLI profile 还会通过同一个一次性 homeserver 驱动 `openclaw matrix encryption setup` 和
verification 命令，然后再检查
gateway 回复。

CI 在
`.github/workflows/qa-live-transports-convex.yml` 中使用同一命令 surface。计划任务和默认
手动运行会使用 QA 提供的 live-frontier
凭据、`--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`
执行 fast Matrix profile。手动 `matrix_profile=all` 会 fan out 到五个 profile shards：`transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli`。

### Discord Mantis 场景

Discord 也有仅限 Mantis 的 opt-in 场景，用于 bug 复现。使用
`--scenario discord-status-reactions-tool-only` 可运行显式状态
reaction timeline，或使用 `--scenario discord-thread-reply-filepath-attachment`
创建真实 Discord thread，并验证 `message.thread-reply`
保留 `filePath` attachment。这些场景不在默认
live Discord 验证通道中，因为它们是前后对照复现探针，而不是
广泛的 smoke 覆盖。thread-attachment Mantis 工作流还可以在 QA
环境中配置了
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 时添加一个
已登录 Discord Web witness 视频。该 viewer profile 仅用于视觉捕获；pass/fail
判定仍来自 Discord REST oracle。

对于真实传输 Discord、Slack、Telegram 和 WhatsApp smoke 验证通道：

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

它们会面向一个预先存在的真实渠道，使用两个 bot 或账号（driver +
SUT）。必需环境变量、scenario 列表、输出 artifacts 和 Convex
凭据池记录在下方的
[Discord、Slack、Telegram 和 WhatsApp QA 参考](#discord-slack-telegram-and-whatsapp-qa-reference)
中。

### Mantis Slack 桌面和视觉任务运行器

要使用 VNC rescue 运行完整 Slack 桌面 VM，请运行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

该命令会租用一台 Crabbox desktop/browser 机器，在 VM 内运行 Slack live
验证通道，在 VNC 浏览器中打开 Slack Web，捕获桌面，
并将 `slack-qa/`、`slack-desktop-smoke.png` 和
`slack-desktop-smoke.mp4`（当视频捕获可用时）复制回
Mantis artifact 目录。Crabbox desktop/browser 租约会预先提供捕获
工具和 browser/native-build helper packages，因此该场景
只应在较旧租约上安装 fallback。Mantis 会在 `mantis-slack-desktop-smoke-report.md` 中报告总耗时和
各阶段耗时，因此慢速运行会显示时间花在 lease warmup、credential acquisition、remote setup 还是
artifact copy 上。通过 VNC 手动登录 Slack Web 后，可复用 `--lease-id <cbx_...>`；
复用的租约也会保持 Crabbox 的 pnpm store cache
热态。默认 `--hydrate-mode source` 会从 source checkout 验证，并在 VM 中运行 install/build。仅当
复用的远程工作区已经有 `node_modules` 和已构建的 `dist/` 时，
才使用 `--hydrate-mode prehydrated`；该模式会跳过昂贵的 install/build 步骤，并在
工作区未就绪时 fail closed。使用 `--gateway-setup` 时，Mantis 会在 VM 内端口 `38973` 上保留一个持久
OpenClaw Slack gateway 运行；不使用时，该
命令会运行正常的 bot-to-bot Slack QA 验证通道，并在 artifact
捕获后退出。

要用桌面证据证明原生 Slack approval UI，请运行 Mantis
approval checkpoint 模式：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

此模式与 `--gateway-setup` 互斥。它会运行 Slack
approval 场景，拒绝非 approval scenario ids，在每个 pending
和 resolved approval 状态等待，将观察到的 Slack API 消息渲染为
`approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`，然后在任何 checkpoint、
message evidence、acknowledgement 或渲染截图缺失或
为空时失败。冷 CI 租约可能仍会在
`slack-desktop-smoke.png` 中显示 Slack sign-in；approval checkpoint 图片是此验证通道的视觉
证明。

默认 checkpoint run 会保留两个标准 Slack approval 场景。
要捕获任一 opt-in Codex approval route，请用
`--scenario slack-codex-approval-exec-native` 或
`--scenario slack-codex-approval-plugin-native` 显式选择；Mantis 会接受两者并发出
相同的 pending/resolved 截图对。运行器会为每个选定的 Codex route 扩展其 checkpoint
和 remote-command deadlines，以便完整的
approval、智能体完成和 resolved-update sequence 可以结束。

operator checklist、GitHub workflow dispatch 命令、evidence-comment
contract、hydrate-mode decision table、timing interpretation 和 failure
handling steps 见
[Mantis Slack Desktop Runbook](/zh-CN/concepts/mantis-slack-desktop-runbook)。

对于 agent/CV 风格的桌面任务，请运行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` 会租用或复用一台 Crabbox desktop/browser 机器，启动
`crabbox record --while`，通过嵌套
`visual-driver` 驱动可见浏览器，捕获 `visual-task.png`，在选择 `--vision-mode image-describe` 时
针对截图运行 `openclaw infer image
describe`，并写入 `visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json` 和
`mantis-visual-task-report.md`。设置 `--expect-text` 时，vision
prompt 会要求结构化 JSON verdict（`visible`、`evidence`、`reason`），并且只有当模型报告 `visible: true` 且 evidence
引用预期文本时才通过；仅引用目标文本的 `visible: false` 响应仍会使断言失败。使用 `--vision-mode metadata` 可运行一个
不调用 image-understanding provider 的 no-model smoke，用于证明桌面、浏览器、截图和视频
plumbing。Recording 是 `visual-task` 的必需 artifact；如果 Crabbox 没有录制到非空
`visual-task.mp4`，即使 visual driver 已通过，任务也会失败。失败时，Mantis 会为 VNC 保留租约，除非任务已经通过
且未设置 `--keep-lease`。

### 凭据池健康检查

使用池化 live credentials 前，请运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker env（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`），验证 endpoint settings，仅报告
`OPENCLAW_QA_CONVEX_SECRET_CI` 和
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 的 set/missing 状态，并在 maintainer secret 存在时验证 admin/list 可达性。

## Live transport 覆盖

Live transport 验证通道共享一个 contract，而不是各自发明
scenario list shape。`qa-channel` 是广泛的合成 product-behavior
suite，不属于 live transport coverage matrix。

Live transport 运行器会从
`openclaw/plugin-sdk/qa-live-transport-scenarios`
导入共享 scenario ids、baseline coverage
helpers 和 scenario-selection helper。

| 线路     | 金丝雀 | 提及门控 | 机器人到机器人 | 允许名单拦截 | 顶层回复 | 引用回复 | 重启恢复 | 线程跟进 | 线程隔离 | 表情回应观察 | 帮助命令 | 原生命令注册 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

这让 `qa-channel` 保持为覆盖面广的产品行为套件，同时 Matrix、
Telegram 和其他实时传输协议共享一份明确的传输协议契约
检查清单。

如需一个一次性的 Linux VM 线路，且不把 Docker 带入 QA 路径，请运行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass 客户机，安装依赖，在客户机内构建 OpenClaw，
运行 `qa suite`，然后把常规 QA 报告和
摘要复制回主机上的 `.artifacts/qa-e2e/...`。它复用与主机上 `qa suite`
相同的场景选择行为。

主机和 Multipass 套件运行默认会通过隔离的 Gateway 网关 worker 并行执行多个选定场景。
`qa-channel` 默认并发数为
4，并受选定场景数量限制。使用 `--concurrency
<count>` 调整 worker 数量，或使用 `--concurrency 1` 串行执行。
使用 `--pack personal-agent` 运行个人助理基准包（10
个场景）。包选择器会与重复的 `--scenario` 标志叠加：
显式场景先运行，然后包场景按包顺序运行，并移除
重复项。当自定义 QA runner 已经提供 OpenTelemetry 收集器设置时，
使用 `--pack observability` 一并选择
`otel-trace-smoke` 和 `docker-prometheus-smoke` 场景。

当任何场景失败时，该命令会以非零状态退出。如果你想获得 artifacts
但不希望退出码失败，请使用 `--allow-failures`。

实时运行会转发客户机可实际使用的受支持 QA 凭证输入：
基于环境变量的提供商密钥、QA 实时提供商配置路径，以及
存在时的 `CODEX_HOME`。请将 `--output-dir` 放在 repo 根目录下，这样
客户机才能通过挂载的工作区写回。

## Discord、Slack、Telegram 和 WhatsApp QA 参考

Matrix 有一个[专用页面](/zh-CN/concepts/qa-matrix)，因为它的场景
数量较多，并且需要基于 Docker 的 homeserver 供应。Discord、Slack、Telegram
和 WhatsApp 针对预先存在的真实传输协议运行，因此它们的参考
放在这里。

### 共享 CLI 标志

这些线路通过
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，并
接受相同的标志：

| 标志                                  | 默认值                                            | 描述                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 只运行此场景。可重复。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 写入报告、摘要、证据、传输协议特定 artifacts 和输出日志的位置。相对路径基于 `--repo-root` 解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 从中立 cwd 调用时的仓库根目录。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA Gateway 网关配置中的临时账户 ID。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` 或 `live-frontier`（旧版 `live-openai` 仍然可用）。                                                                            |
| `--model <ref>` / `--alt-model <ref>` | 提供商默认值                                   | 主/备模型引用。                                                                                                                   |
| `--fast`                              | 关闭                                                | 受支持时的提供商快速模式。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | 参见 [Convex 凭证池](#convex-credential-pool)。                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI 中为 `ci`，否则为 `maintainer`                 | `--credential-source convex` 时使用的角色。                                                                                                    |

任何场景失败时，每条线路都会以非零状态退出。`--allow-failures` 会写入
artifacts，但不会设置失败退出码。Telegram 还接受
`--list-scenarios` 来打印可用场景 ID 并退出；其他线路
不暴露该标志。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目标是一个真实的私有 Telegram 群组，其中有两个不同的 bot（driver +
SUT）。SUT bot 必须有 Telegram 用户名；当两个 bot 都在
`@BotFather` 中启用 **Bot-to-Bot Communication Mode** 时，机器人到机器人观察效果
最佳。

使用 `--credential-source env` 时所需环境变量：

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

隐式默认集合始终覆盖金丝雀、提及门控、原生命令
回复、命令寻址，以及机器人到机器人群组回复。`mock-openai`
默认值还包括确定性的回复链和最终消息流式传输
检查。`telegram-current-session-status-tool` 和
`telegram-tool-only-usage-footer` 仍然是选择加入：前者只有在
直接接在金丝雀之后按线程运行时才稳定，后者是真实 Telegram 中
工具专用回复上 `/usage` 页脚的证明。使用 `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` 打印当前
默认/可选拆分以及回归引用。

输出 artifacts：

- `telegram-qa-report.md`
- `qa-evidence.json` - 实时传输协议检查的证据条目，
  包括 profile、coverage、provider、channel、artifacts、result 和 RTT
  字段。

包级 Telegram 运行使用相同的 Telegram 凭证契约。重复 RTT
测量是常规包级 Telegram 实时线路的一部分；RTT
分布会折叠进所选 RTT 检查的 `qa-evidence.json` 中的 `result.timing`。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 时，包级实时 wrapper
会租用一个 `kind: "telegram"` 凭证，将租用的群组/driver/SUT
bot 环境变量导出到已安装包运行中，对租约发送 heartbeat，并在
关闭时释放它。选择 Convex 时，包级 wrapper 在 CI 外默认执行 20 次
`telegram-mentioned-message-reply` 的 RTT 检查、30 秒 RTT 超时，以及 Convex 角色
`maintainer`。覆盖
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
或 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`，即可调整 RTT 测量，而无需
创建单独的 RTT 命令或 Telegram 专用摘要格式。

### Discord QA

```bash
pnpm openclaw qa discord
```

目标是一个真实的私有 Discord guild 渠道，其中有两个 bot：由 harness
控制的 driver bot，以及由子 OpenClaw Gateway 网关
通过内置 Discord 插件启动的 SUT bot。它会验证频道提及处理、
SUT bot 已向 Discord 注册原生 `/help` 命令，以及
选择加入的 Mantis 证据场景。

使用 `--credential-source env` 时所需环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必须匹配 Discord 返回的 SUT bot 用户 ID
  （否则该线路会快速失败）。

可选：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 会在
  observed-message artifacts 中保留消息正文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 为
  `discord-voice-autojoin` 选择语音/舞台频道；如果未设置，场景会为 SUT bot 选择第一个可见的
  语音/舞台频道。

场景（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 选择加入的语音场景。单独运行，
  启用 `channels.discord.voice.autoJoin`，并验证 SUT bot 当前的
  Discord 语音状态是目标语音/舞台频道。Convex Discord
  凭证可以包含可选的 `voiceChannelId`；否则 runner
  会发现 guild 中第一个可见的语音/舞台频道。
- `discord-status-reactions-tool-only` - 选择加入的 Mantis 场景。它会
  单独运行，因为它会将 SUT 切换为始终开启的、仅工具 guild 回复，
  并设置 `messages.statusReactions.enabled=true`，然后捕获 REST
  表情回应时间线以及 HTML/PNG 视觉 artifacts。Mantis 前/后
  报告还会将场景提供的 MP4 artifacts 保留为 `baseline.mp4`
  和 `candidate.mp4`。
- `discord-thread-reply-filepath-attachment` - 选择加入的 Mantis 场景；参见
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
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

输出产物：

- `discord-qa-report.md`
- `qa-evidence.json` - 实时传输检查的证据条目。
- `discord-qa-observed-messages.json` - 正文会被遮盖，除非设置
  `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`。
- `discord-qa-reaction-timelines.json` 和
  `discord-status-reactions-tool-only-timeline.png`，在状态表情回应场景运行时生成。

### Slack QA

```bash
pnpm openclaw qa slack
```

目标是一个真实的私有 Slack 渠道，使用两个不同的 Bot：一个由 harness 控制的驱动 Bot，以及一个由子 OpenClaw Gateway 网关通过内置 Slack 插件启动的 SUT Bot。

使用 `--credential-source env` 时需要的环境变量：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

可选：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 会在 observed-message 产物中保留消息正文。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 会为 Mantis 启用可视化审批检查点。运行器会写入 `<scenario>.pending.json` 和
  `<scenario>.resolved.json`，然后等待匹配的 `.ack.json` 文件。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` 会覆盖检查点确认超时。默认值是 `120000`。

场景（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-reaction-glyph-native` - 选择启用的实时消息工具表情回应场景。指示智能体传入精确的 `✅` 字形，并确认 Slack 为目标消息上的 SUT Bot 存储了 `white_check_mark`。
- `slack-approval-exec-native` - 选择启用的原生 Slack Exec 审批场景。通过 Gateway 网关请求一次 Exec 审批，验证 Slack 消息包含原生审批按钮，完成审批，并验证已完成的 Slack 更新。
- `slack-approval-plugin-native` - 选择启用的原生 Slack 插件审批场景。同时启用 Exec 和插件审批转发，以便插件事件不会被 Exec 审批路由抑制，然后验证同一条待处理/已完成的原生 Slack UI 路径。
- `slack-codex-approval-exec-native` - 选择启用的 Codex Guardian 命令审批场景。在 Guardian 模式下启用 Codex 插件，将源自 Slack 的 Gateway 网关智能体轮次通过 Codex app-server harness 路由，等待 `openclaw-codex-app-server` 的原生 Slack 插件审批提示，完成审批，并验证 Codex 轮次以预期的命令输出和 Assistant 标记结束。
- `slack-codex-approval-plugin-native` - 选择启用的 Codex Guardian 文件审批场景。使用工作区外的 `apply_patch` 指令，使 Codex 发出 app-server 文件变更审批路由，然后在清理前验证同一条原生 Slack 待处理/已完成审批路径、最终 Assistant 标记和精确文件内容。

Codex 审批场景需要一个 `openai/*` 或 `codex/*` `--model`、常规实时模型凭证，以及 Codex 插件接受的 Codex 凭证或 API-key 凭证。Slack 报告会包含 Codex app-server 方法、选定的 Codex 模型键、最终 Codex 轮次状态，以及操作标记验证，并附带已遮盖的 Slack 审批元数据。

输出产物：

- `slack-qa-report.md`
- `qa-evidence.json` - 实时传输检查的证据条目。
- `slack-qa-observed-messages.json` - 正文会被遮盖，除非设置
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`。
- `approval-checkpoints/` - 仅在 Mantis 设置
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 时生成；包含检查点 JSON、确认 JSON，以及待处理/已完成截图。

#### 设置 Slack 工作区

该通道需要同一工作区中的两个不同 Slack 应用，以及一个两个 Bot 都是成员的频道：

- `channelId` - 两个 Bot 都已受邀加入的频道的 `Cxxxxxxxxxx` ID。请使用专用频道；该通道每次运行都会发帖。
- `driverBotToken` - **Driver** 应用的 Bot Token（`xoxb-...`）。
- `sutBotToken` - **SUT** 应用的 Bot Token（`xoxb-...`），它必须是不同于 Driver 的单独 Slack 应用，以便其 Bot 用户 ID 不同。
- `sutAppToken` - SUT 应用的应用级 Token（`xapp-...`），带有 `connections:write`，供 Socket Mode 使用，以便 SUT 应用可以接收事件。

优先使用专用于 QA 的 Slack 工作区，而不是复用生产工作区。

下面的 SUT 清单有意将内置 Slack 插件的生产安装（`extensions/slack/src/setup-shared.ts:12`）缩小到实时 Slack QA 套件覆盖的权限和事件。对于用户看到的生产频道设置，请参阅
[Slack 频道快速设置](/zh-CN/channels/slack#quick-setup)；QA Driver/SUT 对有意保持独立，因为该通道需要同一工作区中的两个不同 Bot 用户 ID。

**1. 创建 Driver 应用**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → 选择 QA 工作区，粘贴以下清单，然后 _Install to Workspace_：

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

复制 _Bot User OAuth Token_（`xoxb-...`）- 它会成为 `driverBotToken`。Driver 只需要发布消息并识别自身；不需要事件，也不需要 Socket Mode。

**2. 创建 SUT 应用**

在同一工作区重复 _Create New App → From a manifest_。这个 QA 应用有意使用内置 Slack 插件生产清单（`extensions/slack/src/setup-shared.ts:12`）的更窄版本：省略了表情回应权限和事件，因为实时 Slack QA 套件尚未覆盖表情回应处理。

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

Slack 创建应用后，在其设置页执行两件事：

- _Install to Workspace_ → 复制 _Bot User OAuth Token_ → 它会成为
  `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 添加
  scope `connections:write` → 保存 → 复制 `xapp-...` 值 → 它会成为
  `sutAppToken`。

通过分别对每个 Token 调用 `auth.test`，验证两个 Bot 具有不同的用户 ID。运行时通过用户 ID 区分 Driver 和 SUT；对二者复用同一个应用会立刻导致 mention-gating 失败。

**3. 创建频道**

在 QA 工作区中创建一个频道（例如 `#openclaw-qa`），并在频道内邀请两个 Bot：

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

从 _channel info → About → Channel ID_ 复制 `Cxxxxxxxxxx` ID - 它会成为 `channelId`。公共频道可以使用；如果你使用私有频道，两个应用已经拥有 `groups:history`，因此 harness 的历史读取仍会成功。

**4. 注册凭证**

有两种选项。使用环境变量进行单机调试（设置四个 `OPENCLAW_QA_SLACK_*` 变量并传入 `--credential-source env`），或填充共享 Convex 池，以便 CI 和其他维护者可以租用它们。

对于 Convex 池，将四个字段写入一个 JSON 文件：

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

预期结果为 `count: 1`、`status: "active"`，没有 `lease` 字段。

**5. 端到端验证**

在本地运行该通道，确认两个 Bot 可以通过 broker 彼此通信：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

一次绿色运行会在远低于 30 秒内完成，并且 `slack-qa-report.md` 显示 `slack-canary` 和 `slack-mention-gating` 的状态均为 `pass`。如果该通道挂起约 90 秒并以 `Convex credential pool exhausted for kind "slack"` 退出，要么池为空，要么每一行都已被租用 - `qa credentials list --kind slack --status all --json` 会告诉你是哪一种。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

目标是两个专用 WhatsApp Web 账号：一个由 harness 控制的驱动账号，以及一个由子 OpenClaw Gateway 网关通过内置 WhatsApp 插件启动的 SUT 账号。

使用 `--credential-source env` 时需要的环境变量：

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

可选：

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` 启用群组场景，例如
  `whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-broadcast-group-fanout`、`whatsapp-group-activation-always`、
  `whatsapp-group-reply-to-bot-triggers`、群组动作/媒体/投票场景，以及
  `whatsapp-group-allowlist-block`。
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` 会在 observed-message 产物中保留消息正文。

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
- 用户路径消息操作：`whatsapp-agent-message-action-react` 从真实驱动私信开始，
  让模型调用 `message` 工具，并观察原生 WhatsApp 表情回应。`whatsapp-agent-message-action-upload-file`
  对 `message(action=upload-file)` 使用相同姿态，并观察原生 WhatsApp 媒体。
  `whatsapp-group-agent-message-action-react` 和
  `whatsapp-group-agent-message-action-upload-file` 在真实 WhatsApp 群组中证明相同的
  用户可见操作。
- 群组扇出：`whatsapp-broadcast-group-fanout` 从一条被提及的
  WhatsApp 群组消息开始，并验证来自 `main` 和 `qa-second` 的不同可见回复。
- 群组激活：`whatsapp-group-activation-always` 将真实群组会话改为
  `/activation always`，证明未提及的群组消息会唤醒智能体，然后恢复
  `/activation mention`。
  `whatsapp-group-reply-to-bot-triggers` 先播种一条 Bot 回复，再向它发送一条没有显式提及的原生引用回复，
  并验证智能体会从该回复上下文中唤醒。
- 入站媒体和结构化消息：`whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。
  这些场景会通过驱动发送真实 WhatsApp 图片、音频、文档、位置、联系人、
  贴纸和表情回应事件。
- 直接 Gateway 网关契约探针：`whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-outbound-send-serialization`、
  `whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、
  `whatsapp-message-actions`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`。这些有意绕过模型提示，
  并证明确定性的 Gateway 网关/渠道 `send`、`poll` 和
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

目录当前包含 52 个场景。`live-frontier` 默认通道保持较小规模，为 10 个场景，
用于快速冒烟覆盖。`mock-openai` 默认通道通过真实 WhatsApp 传输确定性地运行 45 个场景，
只模拟模型输出；审批场景和少数较重/阻塞型检查仍需通过场景 ID 显式运行。

WhatsApp QA 驱动会观察结构化实时事件（`text`、`media`、
`location`、`reaction` 和 `poll`），并且可以主动发送媒体、投票、
联系人、位置和贴纸。QA Lab 通过 `@openclaw/whatsapp/api.js` 包表面导入该驱动，
而不是访问私有 WhatsApp 运行时文件。对于群组观察，`fromJid` 是群组 JID，
而 `participantJid` 和 `fromPhoneE164` 标识参与者发送者。
消息内容默认会被编辑隐藏。直接 Gateway 网关投票、upload-file、
媒体、群组投票、群组媒体和回复形状探针是传输/API 契约检查；
它们不会被视为用户提示让智能体选择相同操作的证明。用户路径操作证明来自
`whatsapp-agent-message-action-react` 和
`whatsapp-group-agent-message-action-react` 等场景，在这些场景中，驱动会发送普通
WhatsApp 消息，QA Lab 会观察由此产生的原生 WhatsApp 工件。
WhatsApp 报告包含每个场景的姿态（`user-path`、
`direct-gateway` 或 `native-approval`），因此证据不会被误认为证明了比实际更强的契约。

输出工件：

- `whatsapp-qa-report.md`
- `qa-evidence.json` - 实时传输检查的证据条目。
- `whatsapp-qa-observed-messages.json` - 正文会被编辑隐藏，除非设置
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`。

### Convex 凭据池

Discord、Slack、Telegram 和 WhatsApp 通道可以从共享 Convex 池租用凭据，
而不是读取上述环境变量。传入 `--credential-source convex`（或设置
`OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 会获取独占租约，在运行期间为其发送心跳，
并在关闭时释放它。池类型为 `"discord"`、`"slack"`、
`"telegram"` 和 `"whatsapp"`。

代理在 `admin/add` 上验证的负载形状：

- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` 必须是数字聊天 ID 字符串。
- Telegram 真实用户（`kind: "telegram-user"`）：`{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  仅限 Mantis Telegram Desktop 证明。通用 QA Lab 通道不得获取此类型。
- WhatsApp（`kind: "whatsapp"`）：`{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - 电话号码必须是不同的 E.164 字符串。

Mantis Telegram Desktop 证明工作流会为 TDLib CLI 驱动和 Telegram Desktop 见证者持有一个独占 Convex
`telegram-user` 租约，然后在发布证明后释放它。

当 PR 需要确定性视觉差异时，Mantis 可以在 `main` 和 PR head 上使用相同的模拟模型回复，
同时更改 Telegram 格式化器或交付层。捕获默认值针对 PR 评论进行了调优：标准
Crabbox 类、24fps 桌面录制、24fps 运动 GIF 和 1920px 预览宽度。
前后对比评论应发布一个干净的包，其中只包含预期 GIF。

Slack 通道也可以使用该池。Slack 负载形状检查目前位于 Slack QA runner 中，
而不是代理中；请使用 `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`，并使用类似
`Cxxxxxxxxxx` 的 Slack 频道 ID。有关应用和权限范围配置，请参阅
[设置 Slack 工作区](#setting-up-the-slack-workspace)。

运行环境变量和 Convex 代理端点契约位于
[测试 → 通过 Convex 共享 Telegram 凭据](/zh-CN/help/testing#shared-telegram-credentials-via-convex-v1)
（该小节名称早于多渠道池；租约语义在各类型之间共享）。

## 仓库支持的种子

种子资产位于 `qa/`：

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

这些内容有意放在 git 中，因此 QA 计划对人类和智能体都可见。

`qa-lab` 保持为通用 YAML 场景运行器。每个场景 YAML 文件都是一次测试运行的事实来源，
并应定义：

- 顶层 `title`
- `scenario` 元数据
- `scenario` 中可选的类别、能力、通道和风险元数据
- `scenario` 中的文档和代码引用
- `scenario` 中可选的插件要求
- `scenario` 中可选的 Gateway 网关配置补丁
- 用于流程场景的可执行顶层 `flow`，或用于 Vitest 和
  Playwright 场景的 `scenario.execution.kind` / `scenario.execution.path`

支撑 `flow` 的可复用运行时表面保持通用且跨领域。例如，YAML 场景可以组合传输侧辅助工具与浏览器侧辅助工具，
通过 Gateway 网关 `browser.request` 接缝驱动嵌入式 Control UI，而无需添加特殊情况 runner。

场景文件应按产品能力分组，而不是按源代码树文件夹分组。文件移动时保持场景 ID 稳定；
使用 `docsRefs` 和 `codeRefs` 实现实现可追溯性。

基线列表应保持足够宽，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆回忆
- 模型切换
- 子智能体交接
- 仓库读取和文档读取
- 一个小型构建任务，例如 Lobster Invaders

## 提供商模拟通道

`qa suite` 有两个本地提供商模拟通道：

- `mock-openai` 是感知场景的 OpenClaw 模拟。它仍然是仓库支持的 QA 和一致性门控的默认确定性模拟通道。
- `aimock` 会启动由 AIMock 支撑的提供商服务器，用于实验性协议、fixture、录制/回放和混沌覆盖。
  它是增量能力，不会替代 `mock-openai` 场景调度器。

提供商通道实现位于 `extensions/qa-lab/src/providers/` 下。
每个提供商拥有自己的默认值、本地服务器启动、Gateway 网关模型配置、
auth-profile 暂存需求以及实时/模拟能力标志。共享套件和 Gateway 网关代码通过提供商注册表路由，
而不是按提供商名称分支。

## 传输适配器

`qa-lab` 为 YAML QA 场景拥有通用传输接缝。`qa-channel` 是合成默认值。
`crabline` 会启动本地提供商形状的服务器，并让 OpenClaw 的常规渠道插件与它们一起运行。
`live` 预留给真实提供商凭据和外部渠道。

在架构层面，划分如下：

- `qa-lab` 拥有通用场景执行、工作器并发、工件写入和报告。
- 传输适配器拥有 Gateway 网关配置、就绪检查、入站和出站观察、传输操作以及规范化传输状态。
- `qa/scenarios/` 下的 YAML 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时表面。

### 添加渠道

向 YAML QA 系统添加渠道需要渠道实现，以及一个用于覆盖渠道契约的场景包。对于冒烟 CI 覆盖，
请添加匹配的 Crabline 本地提供商服务器，并通过 `crabline` 驱动暴露它。

当共享 `qa-lab` 主机可以拥有该流程时，不要添加新的顶层 QA 命令根。

`qa-lab` 拥有共享主机机制：

- `openclaw qa` 命令根
- 套件启动和拆除
- 工作器并发
- 工件写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容别名

Runner 插件拥有传输契约：

- `openclaw qa <runner>` 如何挂载到共享 `qa` 根下面
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露转录和规范化传输状态
- 如何执行由传输支撑的操作
- 如何处理传输特定的重置或清理

新渠道的最低采用门槛：

1. 保持 `qa-lab` 作为共享 `qa` 根命令的所有者。
2. 在共享的 `qa-lab` 主机接缝上实现传输运行器。
3. 将传输专属机制保留在运行器插件或渠道 harness 内。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；延迟 CLI 和运行器执行应放在单独的入口点后面。可选的 `adapterFactory` 会向共享场景暴露传输，而不改变命令现有的场景目录。
5. 在主题化的 `qa/scenarios/` 目录下编写或改编 YAML 场景。
6. 为新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意迁移，否则保持现有兼容别名可用。

决策规则很严格：

- 如果行为可以在 `qa-lab` 中表达一次，就把它放在 `qa-lab`。
- 如果行为依赖某个渠道传输，就把它保留在该运行器插件或插件 harness 中。
- 如果某个场景需要多个渠道都能使用的新能力，请添加通用辅助函数，而不是在 `suite.ts` 中添加渠道专属分支。
- 如果某个行为只对一种传输有意义，就保持场景传输专属，并在场景契约中明确说明。

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

兼容别名仍可用于现有场景 -
`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、
`formatConversationTranscript`、`resetBus` - 但新场景编写应使用通用名称。这些别名的存在是为了避免一次性强制迁移，而不是作为未来的模型。

## 报告

`qa-lab` 会从观测到的总线时间线导出一份 Markdown 协议报告。
报告应回答：

- 哪些工作正常
- 哪些失败了
- 哪些仍被阻塞
- 哪些后续场景值得添加

如需查看可用场景清单（在评估后续工作规模或接入新传输时很有用），请运行 `pnpm openclaw qa coverage`（添加 `--json` 可获得机器可读输出）。为被触及的行为或文件路径选择聚焦证明时，运行 `pnpm openclaw qa coverage --match <query>`。匹配报告会搜索场景元数据、文档引用、代码引用、覆盖 ID、插件和提供商要求，然后打印匹配的 `qa suite --scenario ...` 目标。

每次 `qa suite` 运行都会为选定的场景集写入顶层 `qa-evidence.json`、`qa-suite-summary.json` 和 `qa-suite-report.md` 工件。声明 `execution.kind: vitest` 或 `execution.kind: playwright` 的场景会运行匹配的测试路径，并且也会写入逐场景日志。声明 `execution.kind: script` 的场景会通过 `node --import tsx` 运行 `execution.path` 处的证据生产器（会在 `execution.args` 中展开 `${outputDir}` 和 `${scenarioId}`）；生产器会写入自己的 `qa-evidence.json`，其条目会被导入套件输出，其工件路径会相对于该生产器的 `qa-evidence.json` 解析。当通过 `qa run --qa-profile` 进入 `qa suite` 时，同一个 `qa-evidence.json` 还会包含所选分类法类别的 profile 评分卡摘要。

将覆盖输出视为发现辅助，而不是门禁替代；所选场景仍需要适合被测行为的提供商模式、实时传输、Multipass、Testbox 或发布通道。评分卡上下文请参阅[成熟度评分卡](/zh-CN/maturity/scorecard)。

对于角色和风格检查，请在多个实时模型引用上运行同一场景，并写入经评审的 Markdown 报告：

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

该命令运行本地 QA Gateway 网关子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置人格，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。候选模型不应被告知它正在接受评估。该命令会保留每个完整转录，记录基本运行统计，然后在支持的情况下使用带 `xhigh` 推理的 fast 模式询问评审模型，按自然度、气质和幽默感对运行进行排名。比较提供商时使用 `--blind-judge-models`：评审提示仍会获得每份转录和运行状态，但候选引用会被替换为 `candidate-01` 等中性标签；报告会在解析后将排名映射回真实引用。

候选运行默认使用 `high` thinking，GPT-5.5 使用 `medium`，支持它的较旧 OpenAI 评估引用使用 `xhigh`。用 `--model provider/model,thinking=<level>` 内联覆盖特定候选；内联选项也支持 `fast`、`no-fast` 和 `fast=<bool>`。`--thinking <level>` 仍会设置全局回退，而较旧的 `--model-thinking <provider/model=level>` 形式会保留用于兼容。OpenAI 候选引用默认使用 fast 模式，以便在提供商支持时使用优先处理。仅当你想为每个候选模型强制启用 fast 模式时，才传入 `--fast`。候选和评审耗时会记录在报告中，用于基准分析，但评审提示会明确说明不要按速度排名。候选和评审模型运行默认并发均为 16。当提供商限制或本地 Gateway 网关压力让运行噪声过大时，降低 `--concurrency` 或 `--judge-concurrency`。

未传入候选 `--model` 时，角色评估默认使用 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。未传入 `--judge-model` 时，评审默认使用 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-8,thinking=high`。

## 相关文档

- [Matrix QA](/zh-CN/concepts/qa-matrix)
- [成熟度评分卡](/zh-CN/maturity/scorecard)
- [个人智能体基准包](/zh-CN/concepts/personal-agent-benchmark-pack)
- [QA 渠道](/zh-CN/channels/qa-channel)
- [测试](/zh-CN/help/testing)
- [仪表板](/zh-CN/web/dashboard)
