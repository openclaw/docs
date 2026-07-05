---
read_when:
    - 理解 QA 栈如何协同工作
    - 扩展 qa-lab、qa-channel 或传输适配器
    - 添加仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化
summary: QA 栈概览：qa-lab、qa-channel、仓库支持的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-07-05T11:13:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fba58c5d3b1b2a5d57facfd77cdbf5c684d118633b4c73cfd3212ceda02bc36a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 栈以真实、类似频道的方式运行 OpenClaw，这是单元测试无法覆盖的。

组成部分：

- `extensions/qa-channel`：合成消息频道，提供私信、频道、线程、表情回应、编辑和删除等表面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察 transcript、注入入站消息，以及导出 Markdown 报告。
- `extensions/qa-matrix`：实时传输适配器，在子 QA Gateway 网关内驱动真实 Matrix 插件。
- `qa/`：由仓库支持的种子资产，用于 kickoff 任务和基线 QA 场景。
- [Mantis](/zh-CN/concepts/mantis)：针对需要真实传输、浏览器截图、VM 状态和 PR 证据的 bug，进行前后对比实时验证。

## 命令表面

每个 QA 流程都在 `pnpm openclaw qa <subcommand>` 下运行。许多流程有 `pnpm qa:*`
脚本别名；两种形式都可用。

| 命令                                                | 用途                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 不带 `--qa-profile` 的内置 QA 自检；带 `--qa-profile smoke-ci`、`--qa-profile release` 或 `--qa-profile all` 的、由分类法支持的成熟度配置文件运行器。                                                                                                                  |
| `qa suite`                                          | 针对 QA Gateway 网关通道运行仓库支持的场景。`--runner multipass` 使用一次性 Linux VM，而不是主机。                                                                                                                                                                  |
| `qa coverage`                                       | 打印 YAML 场景覆盖率清单（`--json` 用于机器输出；`--match <query>` 用于查找触及行为的场景；`--tools` 用于运行时工具夹具覆盖率）。                                                                                                                                   |
| `qa parity-report`                                  | 比较两个 `qa-suite-summary.json` 文件以执行模型轴一致性门禁，或使用 `--runtime-axis --token-efficiency` 写入 Codex-vs-OpenClaw 运行时一致性和 token 效率报告。                                                                                                      |
| `qa confidence-report`                              | 根据清单对 QA 证据工件进行分类，生成零未知置信度报告。                                                                                                                                                                                                              |
| `qa confidence-self-test`                           | 写入带种子的负向对照 canary，证明置信度门禁可以检测漂移。                                                                                                                                                                                                           |
| `qa jsonl-replay`                                   | 通过运行时一致性重放 harness 重放精选 JSONL transcripts。                                                                                                                                                                                                           |
| `qa character-eval`                                 | 在多个实时模型上运行角色 QA 场景，并生成评审报告。请参阅[报告](#reporting)。                                                                                                                                                                                        |
| `qa manual`                                         | 针对所选提供商/模型通道运行一次性提示。                                                                                                                                                                                                                             |
| `qa ui`                                             | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                        |
| `qa docker-build-image`                             | 构建预制 QA Docker 镜像。                                                                                                                                                                                                                                           |
| `qa docker-scaffold`                                | 为 QA dashboard + Gateway 网关通道写入 docker-compose 脚手架。                                                                                                                                                                                                     |
| `qa up`                                             | 构建 QA 站点，启动由 Docker 支持的栈，并打印 URL（别名：`pnpm qa:lab:up`；`:fast` 变体会添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                             |
| `qa aimock`                                         | 仅启动 AIMock 提供商服务器。                                                                                                                                                                                                                                        |
| `qa mock-openai`                                    | 仅启动感知场景的 `mock-openai` 提供商服务器。                                                                                                                                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享的 Convex 凭据池。                                                                                                                                                                                                                                          |
| `qa discord`                                        | 针对真实私有 Discord guild 频道的实时传输通道。                                                                                                                                                                                                                     |
| `qa matrix`                                         | 针对一次性 Tuwunel homeserver 的实时传输通道。请参阅 [Matrix QA](/zh-CN/concepts/qa-matrix)。                                                                                                                                                                             |
| `qa slack`                                          | 针对真实私有 Slack 频道的实时传输通道。                                                                                                                                                                                                                             |
| `qa telegram`                                       | 针对真实私有 Telegram 群组的实时传输通道。                                                                                                                                                                                                                          |
| `qa whatsapp`                                       | 针对真实 WhatsApp Web 账号的实时传输通道。                                                                                                                                                                                                                          |
| `qa mantis`                                         | 用于实时传输 bug 的前后对比验证运行器，提供 Discord 状态表情回应证据、Crabbox 桌面/浏览器冒烟测试，以及 Slack-in-VNC 冒烟测试。请参阅 [Mantis](/zh-CN/concepts/mantis) 和 [Mantis Slack Desktop Runbook](/zh-CN/concepts/mantis-slack-desktop-runbook)。 |

`qa matrix` 注册为运行器插件（`extensions/qa-matrix`）；上面的其他所有通道都直接内置于 `qa-lab`。

### 由配置文件支持的 `qa run`

由配置文件支持的 `qa run` 从 `taxonomy.yaml` 读取成员关系，然后通过 `qa suite` 分发已解析的场景。`--surface` 和 `--category` 会筛选所选配置文件，而不是定义单独通道。生成的 `qa-evidence.json` 包含配置文件评分卡摘要，其中有已选类别计数和缺失覆盖率 ID；单条证据条目仍然是测试、覆盖角色和结果的事实来源。分类法功能覆盖率 ID 是精确的证明目标，不是别名：主要场景覆盖率满足匹配 ID，次要覆盖率保持为建议性。覆盖率 ID 使用带小写字母数字/短横线段的点分 `namespace.behavior` 形式；配置文件、表面和类别 ID 仍可使用现有的短横线或点分分类法 ID。

精简证据会省略每条目的 `execution`，并设置 `evidenceMode: "slim"`；
`smoke-ci` 默认使用精简模式，`--evidence-mode full` 会恢复完整条目：

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

使用 `smoke-ci` 通过模拟模型提供商和 Crabline 本地提供商服务器获得确定性的配置文件证明。使用 `release` 针对实时频道执行 Stable/LTS 证明。仅在明确需要完整分类法证据运行时使用 `all`；它会选择每个活跃成熟度类别，并可通过 `QA
Profile Evidence` GitHub Actions 工作流以 `qa_profile=all` 分发。当命令还需要 OpenClaw 根配置文件时，请将根配置文件放在 QA 命令之前：

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 操作员流程

当前 QA 操作员流程是一个双栏 QA 站点：

- 左侧：带有智能体的 Gateway 网关 dashboard（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的 transcript 和场景计划。

运行方式：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动由 Docker 支持的 Gateway 网关通道，并公开 QA Lab 页面，操作员或自动化循环可以在其中给智能体分配 QA 任务、观察真实频道行为，并记录哪些有效、失败或仍被阻塞。

为了更快地迭代 QA Lab UI，而不用每次都重新构建 Docker 镜像，请使用绑定挂载的 QA Lab bundle 启动栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。
`qa:lab:watch` 会在变更时重建该 bundle，且当 QA Lab 资产哈希变化时，浏览器会自动重新加载。

### 可观测性冒烟测试

<Note>
可观测性 QA 仅限源码 checkout。npm tarball 有意省略
QA Lab（以及 `qa-channel`/`qa-matrix`），因此包 Docker 发布通道不会运行 `qa` 命令。更改诊断 instrumentation 时，请从已构建的源码 checkout 运行这些命令。
</Note>

| 别名                                    | 运行内容                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | 本地 OpenTelemetry 接收器，加上启用 `diagnostics-otel` 的 `otel-trace-smoke` 场景。                                                     |
| `pnpm qa:otel:collector-smoke`          | 在真实 OpenTelemetry Collector Docker 容器后面的同一通道。更改端点接线或 Collector/OTLP 兼容性时使用它。                               |
| `pnpm qa:prometheus:smoke`              | 启用 `diagnostics-prometheus` 的 `docker-prometheus-smoke` 场景。                                                                       |
| `pnpm qa:observability:smoke`           | 先运行 `qa:otel:smoke`，再运行 `qa:prometheus:smoke`。                                                                                  |
| `pnpm qa:observability:collector-smoke` | 先运行 `qa:otel:collector-smoke`，再运行 `qa:prometheus:smoke`。                                                                        |

`qa:otel:smoke` 会启动一个本地 OTLP/HTTP 接收器，运行一个最小 QA-channel
智能体轮次，然后断言已导出 traces、metrics 和日志。它会解码导出的 protobuf trace
spans，并检查发布关键形状：`openclaw.run`、`openclaw.harness.run`、一个最新 GenAI
语义约定的模型调用 span、`openclaw.context.assembled` 和 `openclaw.message.delivery`
都必须存在。该 smoke 会强制设置
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，因此模型调用
span 必须使用 `{gen_ai.operation.name} {gen_ai.request.model}` 名称；成功轮次中的模型
调用不得导出 `StreamAbandoned`；原始诊断
ID 和 `openclaw.content.*` 属性必须留在 trace 之外。该场景
prompt 会要求模型用固定标记回复，并保留一个固定的
secret 字符串；原始 OTLP payloads 不得包含其中任何一个，也不得包含从场景 id 派生的 QA
会话密钥。它会在 QA suite artifacts 旁边写入 `otel-smoke-summary.json`。

`qa:prometheus:smoke` 会验证未认证 scrape 被拒绝，然后
检查已认证 scrape 包含发布关键 metric families，且不包含
prompt 内容、response 内容、原始诊断标识符、auth
tokens 或本地路径。

### Matrix smoke 通道

对于不需要模型提供商凭据的真实传输 Matrix smoke 通道，请使用确定性的 mock OpenAI 提供商运行 fast profile：

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

对于 live-frontier 提供商通道，请显式提供 OpenAI 兼容凭据：

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

此通道的完整 CLI 参考、profile/scenario 目录、环境变量和 artifact
布局位于 [Matrix QA](/zh-CN/concepts/qa-matrix)。概览：它会
在 Docker 中配置一个一次性 Tuwunel homeserver，注册临时
driver/SUT/observer 用户，在限定到该传输协议的子 QA
Gateway 网关中运行真实 Matrix 插件（没有 `qa-channel`），然后在
`.artifacts/qa-e2e/matrix-<timestamp>/` 下写入 Markdown
报告、JSON summary、observed-events artifact 和合并输出日志。

这些场景覆盖单元测试无法端到端证明的传输行为：
mention gating、allow-bot policies、allowlists、顶层和 threaded
replies、私信路由、reaction 处理、入站 edit suppression、restart
replay dedupe、homeserver interruption recovery、approval metadata delivery、
media handling，以及 Matrix E2EE bootstrap/recovery/verification flows。该
E2EE CLI profile 还会通过同一个一次性 homeserver 驱动 `openclaw matrix encryption setup` 和
verification commands，然后检查
Gateway 网关回复。

CI 在
`.github/workflows/qa-live-transports-convex.yml` 中使用同一命令表面。计划任务和默认
手动运行会使用 QA 提供的 live-frontier
凭据、`--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`
执行 fast Matrix profile。手动 `matrix_profile=all` 会扇出为五个 profile shards：`transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli`。

### Discord Mantis 场景

Discord 还提供仅 Mantis 的可选场景用于 bug 复现。使用
`--scenario discord-status-reactions-tool-only` 复现显式状态
reaction 时间线，或使用 `--scenario discord-thread-reply-filepath-attachment`
创建真实 Discord thread，并验证 `message.thread-reply`
保留 `filePath` attachment。这些场景不会进入默认
live Discord 通道，因为它们是 before/after 复现 probes，而不是
宽泛 smoke 覆盖。thread-attachment Mantis workflow 还可以在 QA
环境中配置
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 时，添加一个已登录的 Discord Web witness video。该 viewer profile 仅用于视觉捕获；pass/fail
决策仍来自 Discord REST oracle。

对于真实传输的 Discord、Slack、Telegram 和 WhatsApp smoke 通道：

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

它们面向已有的真实渠道，使用两个 bot 或账号（driver +
SUT）。必需环境变量、scenario lists、output artifacts 和 Convex
credential pool 记录在下面的
[Discord、Slack、Telegram 和 WhatsApp QA 参考](#discord-slack-telegram-and-whatsapp-qa-reference)
中。

### Mantis Slack desktop 和 visual-task runners

若要运行带 VNC rescue 的完整 Slack desktop VM，请运行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

该命令会租用一台 Crabbox desktop/browser 机器，在 VM 内运行 Slack live
通道，在 VNC browser 中打开 Slack Web，捕获 desktop，
并将 `slack-qa/`、`slack-desktop-smoke.png` 和
`slack-desktop-smoke.mp4`（当 video capture 可用时）复制回
Mantis artifact 目录。Crabbox desktop/browser leases 会预先提供 capture
tools 和 browser/native-build helper packages，因此该场景
应只在较旧 leases 上安装 fallbacks。Mantis 会在 `mantis-slack-desktop-smoke-report.md` 中报告总耗时和
各阶段耗时，因此慢速运行会显示时间是花在 lease warmup、credential acquisition、remote setup，还是
artifact copy 上。通过 VNC 手动登录 Slack Web 后，可复用 `--lease-id <cbx_...>`；
复用的 leases 也会保持 Crabbox 的 pnpm store cache
温热。默认 `--hydrate-mode source` 会从 source checkout 验证，并在 VM 内运行 install/build。仅当
复用的远程 workspace 已有 `node_modules` 和已构建的 `dist/` 时，才使用 `--hydrate-mode prehydrated`；
该模式会跳过昂贵的 install/build 步骤，并在
workspace 未就绪时 fail closed。使用 `--gateway-setup` 时，Mantis 会在 VM 内保留一个持久
OpenClaw Slack Gateway 网关，监听端口 `38973`；不使用它时，该
命令会运行常规 bot-to-bot Slack QA 通道，并在 artifact
capture 后退出。

若要用 desktop evidence 证明原生 Slack approval UI，请运行 Mantis
approval checkpoint 模式：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

此模式与 `--gateway-setup` 互斥。它会运行 Slack
approval scenarios，拒绝非 approval scenario ids，在每个 pending
和 resolved approval 状态等待，将观测到的 Slack API message 渲染到
`approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`，然后在任何 checkpoint、
message evidence、acknowledgement 或渲染 screenshot 缺失或
为空时失败。冷启动 CI leases 仍可能在
`slack-desktop-smoke.png` 中显示 Slack sign-in；approval checkpoint images 是此通道的视觉
证明。

operator checklist、GitHub workflow dispatch command、evidence-comment
contract、hydrate-mode decision table、timing interpretation 和 failure
handling 步骤位于
[Mantis Slack Desktop Runbook](/zh-CN/concepts/mantis-slack-desktop-runbook)。

对于 agent/CV 风格的 desktop task，请运行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` 会租用或复用一台 Crabbox desktop/browser 机器，启动
`crabbox record --while`，通过嵌套的
`visual-driver` 驱动可见 browser，捕获 `visual-task.png`，在选择 `--vision-mode image-describe` 时针对 screenshot 运行 `openclaw infer image
describe`，并写入 `visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json` 和
`mantis-visual-task-report.md`。当设置 `--expect-text` 时，vision
prompt 会要求结构化 JSON verdict（`visible`、`evidence`、`reason`），并且只有当模型报告 `visible: true`，且 evidence
引用了预期文本时才通过；仅仅引用目标文本的 `visible: false` response 仍会让断言失败。使用 `--vision-mode metadata` 可执行不调用图像理解提供商的
no-model smoke，用来证明 desktop、browser、screenshot 和 video
plumbing。Recording 是 `visual-task` 的必需 artifact；如果 Crabbox 没有记录非空
`visual-task.mp4`，即使 visual driver 已通过，该任务也会失败。失败时，Mantis 会为 VNC 保留 lease，除非任务已经通过
且未设置 `--keep-lease`。

### Credential pool 健康检查

使用 pooled live credentials 前，请运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境变量（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`），验证 endpoint settings，仅报告
`OPENCLAW_QA_CONVEX_SECRET_CI` 和
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 的已设置/缺失状态，并在存在 maintainer secret 时验证 admin/list 可达性。

## Live transport 覆盖

Live transport 通道共享一个 contract，而不是各自发明
scenario list shape。`qa-channel` 是宽泛的合成产品行为
suite，不属于 live transport coverage matrix。

Live transport runners 会从
`openclaw/plugin-sdk/qa-live-transport-scenarios`
导入共享 scenario ids、baseline coverage
helpers 和 scenario-selection helper。

| 测试道     | 金丝雀 | 提及门控 | 机器人到机器人 | 允许列表拦截 | 顶层回复 | 引用回复 | 重启恢复 | 线程跟进 | 线程隔离 | 表情回应观察 | 帮助命令 | 原生命令注册 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

这会将 `qa-channel` 保持为覆盖广泛产品行为的套件，同时 Matrix、
Telegram 和其他实时传输协议共享一份明确的传输协议契约
检查清单。

如果要在一次性 Linux VM 测试道中运行且不把 Docker 带入 QA 路径，请运行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，安装依赖，在 guest 内构建 OpenClaw，
运行 `qa suite`，然后把常规 QA 报告和摘要复制回主机上的
`.artifacts/qa-e2e/...`。它复用与主机上 `qa suite` 相同的
场景选择行为。

主机和 Multipass 套件运行默认会使用隔离的 Gateway 网关 worker 并行执行
多个已选择场景。`qa-channel` 默认并发数为 4，并受已选择场景数量限制。
使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1`
进行串行执行。使用 `--pack personal-agent` 运行个人助理基准包（10 个
场景）。包选择器会与重复的 `--scenario` 标志叠加：显式场景先运行，
然后包场景按包顺序运行，并移除重复项。当自定义 QA runner 已经提供
OpenTelemetry collector 设置时，使用 `--pack observability` 一起选择
`otel-trace-smoke` 和 `docker-prometheus-smoke` 场景。

任一场景失败时，该命令会以非零状态退出。当你需要产物但不希望退出码失败时，
使用 `--allow-failures`。

实时运行会转发 guest 实用可用的受支持 QA 凭证输入：基于环境变量的提供商键、
QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir`
放在仓库根目录下，这样 guest 才能通过挂载的工作区写回。

## Discord、Slack、Telegram 和 WhatsApp QA 参考

Matrix 有一个[专用页面](/zh-CN/concepts/qa-matrix)，因为它的场景数量和
基于 Docker 的 homeserver 配置较多。Discord、Slack、Telegram 和
WhatsApp 针对预先存在的真实传输协议运行，因此它们的参考信息放在这里。

### 共享 CLI 标志

这些测试道通过
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，
并接受相同的标志：

| 标志                                  | 默认值                                            | 描述                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 只运行此场景。可重复。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 写入报告、摘要、证据、传输协议专用产物和输出日志的位置。相对路径会基于 `--repo-root` 解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 从中立 cwd 调用时的仓库根目录。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA Gateway 网关配置中的临时账号 ID。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` 或 `live-frontier`（旧版 `live-openai` 仍可使用）。                                                                            |
| `--model <ref>` / `--alt-model <ref>` | 提供商默认值                                   | 主模型/备用模型引用。                                                                                                                   |
| `--fast`                              | 关闭                                                | 受支持时启用提供商快速模式。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | 参见 [Convex 凭证池](#convex-credential-pool)。                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI 中为 `ci`，否则为 `maintainer`                 | 使用 `--credential-source convex` 时使用的角色。                                                                                                    |

任一场景失败时，每个测试道都会以非零状态退出。`--allow-failures` 会写入
产物但不设置失败退出码。Telegram 还接受 `--list-scenarios`，用于打印
可用场景 ID 并退出；其他测试道不暴露该标志。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目标是一个真实的私有 Telegram 群组，包含两个不同的 bot（driver + SUT）。
SUT bot 必须有 Telegram 用户名；当两个 bot 都在 `@BotFather` 中启用
**Bot-to-Bot Communication Mode** 时，机器人到机器人观察效果最好。

当 `--credential-source env` 时需要的环境变量：

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

隐式默认集合始终覆盖金丝雀、提及门控、原生命令回复、命令寻址，以及
机器人到机器人群组回复。`mock-openai` 默认值还包括确定性的回复链和
最终消息流式传输检查。`telegram-current-session-status-tool` 和
`telegram-tool-only-usage-footer` 仍为可选项：前者只有在直接接在金丝雀
之后按线程运行时才稳定，后者是真实 Telegram 上工具专用回复中 `/usage`
页脚的证明。使用 `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`
打印当前默认/可选拆分及回归引用。

输出产物：

- `telegram-qa-report.md`
- `qa-evidence.json` - 实时传输协议检查的证据条目，
  包括 profile、覆盖范围、提供商、渠道、产物、结果和 RTT
  字段。

包级 Telegram 运行使用相同的 Telegram 凭证契约。重复 RTT 测量是常规
包级 Telegram 实时测试道的一部分；RTT 分布会在所选 RTT 检查的
`result.timing` 下合并进 `qa-evidence.json`。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

当设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 时，包级实时 wrapper
会租用一个 `kind: "telegram"` 凭证，将租用到的 group/driver/SUT bot
环境变量导出到已安装包运行中，对租约进行心跳，并在关闭时释放租约。
选择 Convex 时，包级 wrapper 在 CI 外默认对
`telegram-mentioned-message-reply` 进行 20 次 RTT 检查，RTT 超时为 30s，
Convex 角色为 `maintainer`。覆盖 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` 或
`OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` 即可调整 RTT 测量，而不需要创建
单独的 RTT 命令或 Telegram 专用摘要格式。

### Discord QA

```bash
pnpm openclaw qa discord
```

目标是一个真实的私有 Discord guild channel，包含两个 bot：一个由 harness
控制的 driver bot，以及一个由子 OpenClaw Gateway 网关通过内置 Discord
插件启动的 SUT bot。它会验证渠道提及处理、SUT bot 已向 Discord 注册原生
`/help` 命令，以及可选的 Mantis 证据场景。

当 `--credential-source env` 时需要的环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必须匹配 Discord 返回的
  SUT bot 用户 ID（否则该测试道会快速失败）。

可选：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 会在
  observed-message 产物中保留消息正文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 为
  `discord-voice-autojoin` 选择语音/stage channel；如果未设置，
  该场景会为 SUT bot 选择第一个可见的语音/stage channel。

场景（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 可选语音场景。单独运行，启用
  `channels.discord.voice.autoJoin`，并验证 SUT bot 当前的 Discord
  语音状态是目标语音/stage channel。Convex Discord 凭证可以包含可选的
  `voiceChannelId`；否则 runner 会发现 guild 中第一个可见的语音/stage channel。
- `discord-status-reactions-tool-only` - 可选 Mantis 场景。它会单独运行，
  因为它会将 SUT 切换为始终在线、仅工具的 guild 回复，并设置
  `messages.statusReactions.enabled=true`，然后捕获 REST 表情回应时间线
  以及 HTML/PNG 视觉产物。Mantis 前后对比报告也会将场景提供的 MP4 产物
  保留为 `baseline.mp4` 和 `candidate.mp4`。
- `discord-thread-reply-filepath-attachment` - 可选 Mantis 场景；参见
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
- `qa-evidence.json` - 实时传输协议检查的证据条目。
- `discord-qa-observed-messages.json` - 正文会被脱敏，除非设置
  `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`。
- 当状态表情回应场景运行时，会生成 `discord-qa-reaction-timelines.json` 和
  `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目标是一个真实的私有 Slack 频道，其中有两个不同的 Bot：一个由 harness 控制的驱动 Bot，以及一个由子 OpenClaw gateway 通过内置 Slack 插件启动的 SUT Bot。

使用 `--credential-source env` 时需要的环境变量：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

可选：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 会在 observed-message 产物中保留消息正文。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 会为 Mantis 启用可视化审批检查点。运行器会写入 `<scenario>.pending.json` 和
  `<scenario>.resolved.json`，然后等待匹配的 `.ack.json` 文件。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` 会覆盖检查点确认超时时间。默认值为 `120000`。

场景（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - 可选择启用的原生 Slack Exec 审批场景。通过 Gateway 网关请求 Exec 审批，验证 Slack 消息具有原生审批按钮，解决该审批，并验证已解决的 Slack 更新。
- `slack-approval-plugin-native` - 可选择启用的原生 Slack 插件审批场景。同时启用 Exec 和插件审批转发，使插件事件不会被 Exec 审批路由抑制，然后验证相同的待处理/已解决原生 Slack UI 路径。

输出产物：

- `slack-qa-report.md`
- `qa-evidence.json` - 实时传输协议检查的证据条目。
- `slack-qa-observed-messages.json` - 正文会被脱敏，除非设置
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`。
- `approval-checkpoints/` - 仅当 Mantis 设置
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 时生成；包含检查点 JSON、确认 JSON，以及待处理/已解决截图。

#### 设置 Slack 工作区

该通道需要同一个工作区中的两个不同 Slack 应用，以及一个两个 Bot 都属于其成员的频道：

- `channelId` - 两个 Bot 都已被邀请加入的频道的 `Cxxxxxxxxxx` id。请使用专用频道；该通道每次运行都会发帖。
- `driverBotToken` - **Driver** 应用的 Bot token（`xoxb-...`）。
- `sutBotToken` - **SUT** 应用的 Bot token（`xoxb-...`），它必须是与驱动不同的 Slack 应用，以便其 Bot 用户 id 不同。
- `sutAppToken` - SUT 应用的应用级 token（`xapp-...`），具有 `connections:write`，Socket Mode 会使用它让 SUT 应用接收事件。

建议使用专用于 QA 的 Slack 工作区，而不是复用生产工作区。

下面的 SUT manifest 有意将内置 Slack 插件的生产安装（`extensions/slack/src/setup-shared.ts:12`）收窄到实时 Slack QA 套件覆盖的权限和事件。对于用户看到的生产频道设置，请参阅
[Slack 频道快速设置](/zh-CN/channels/slack#quick-setup)；QA Driver/SUT 组合有意保持独立，因为该通道需要同一工作区中的两个不同 Bot 用户 id。

**1. 创建 Driver 应用**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → 选择 QA 工作区，粘贴以下 manifest，
然后 _Install to Workspace_：

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

复制 _Bot User OAuth Token_（`xoxb-...`）- 它会成为
`driverBotToken`。驱动只需要发布消息并识别自身；不需要事件，也不需要 Socket Mode。

**2. 创建 SUT 应用**

在同一工作区中重复 _Create New App → From a manifest_。这个 QA 应用有意使用内置 Slack 插件生产 manifest（`extensions/slack/src/setup-shared.ts:12`）的更窄版本：省略了表情回应权限范围和事件，因为实时 Slack QA 套件尚未覆盖表情回应处理。

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

Slack 创建应用后，在其设置页面完成两件事：

- _Install to Workspace_ → 复制 _Bot User OAuth Token_ → 它会成为
  `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 添加
  scope `connections:write` → 保存 → 复制 `xapp-...` 值 → 它会成为
  `sutAppToken`。

通过对每个 token 调用 `auth.test`，验证两个 Bot 具有不同的用户 id。运行时会通过用户 id 区分驱动和 SUT；复用一个应用会导致 mention-gating 立即失败。

**3. 创建频道**

在 QA 工作区中创建一个频道（例如 `#openclaw-qa`），并从频道内部邀请两个 Bot：

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

从 _channel info → About → Channel ID_ 复制 `Cxxxxxxxxxx` id - 它会成为 `channelId`。公共频道可以使用；如果你使用私有频道，两个应用已经具有 `groups:history`，因此 harness 的历史读取仍会成功。

**4. 注册凭据**

有两个选项。可使用环境变量进行单机调试（设置四个
`OPENCLAW_QA_SLACK_*` 变量并传入 `--credential-source env`），也可播种共享 Convex 池，以便 CI 和其他维护者租用它们。

对于 Convex 池，将这四个字段写入 JSON 文件：

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

预期为 `count: 1`、`status: "active"`，且没有 `lease` 字段。

**5. 端到端验证**

在本地运行该通道，以确认两个 Bot 可以通过 broker 相互通信：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

绿色运行会在远少于 30 秒内完成，且 `slack-qa-report.md` 显示 `slack-canary` 和 `slack-mention-gating` 的状态均为 `pass`。如果该通道挂起约 90 秒并以 `Convex credential pool exhausted
for kind "slack"` 退出，则池为空或每一行都已被租用 - `qa
credentials list --kind slack --status all --json` 会告诉你是哪种情况。

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

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` 会启用群组场景，例如
  `whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-broadcast-group-fanout`、`whatsapp-group-activation-always`、
  `whatsapp-group-reply-to-bot-triggers`、群组操作/媒体/投票场景，
  以及 `whatsapp-group-allowlist-block`。
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
  让模型调用 `message` 工具，并观察原生 WhatsApp 表情回应。
  `whatsapp-agent-message-action-upload-file` 对 `message(action=upload-file)`
  使用相同姿态，并观察原生 WhatsApp 媒体。
  `whatsapp-group-agent-message-action-react` 和
  `whatsapp-group-agent-message-action-upload-file` 证明真实 WhatsApp 群组中相同的
  用户可见操作。
- 群组扇出：`whatsapp-broadcast-group-fanout` 从一条提及的
  WhatsApp 群组消息开始，并验证来自 `main`
  和 `qa-second` 的不同可见回复。
- 群组激活：`whatsapp-group-activation-always` 将真实群组
  会话改为 `/activation always`，证明一条未提及的群组消息会唤醒
  智能体，然后恢复为 `/activation mention`。
  `whatsapp-group-reply-to-bot-triggers` 播种一条 Bot 回复，向它发送一条没有显式提及的原生
  引用回复，并验证智能体
  会从该回复上下文中唤醒。
- 入站媒体和结构化消息：`whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。
  这些场景会通过驱动发送真实的 WhatsApp 图片、音频、文档、位置、联系人、
  贴纸和表情回应事件。
- 直接 Gateway 网关合约探测：`whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-outbound-send-serialization`、
  `whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、
  `whatsapp-message-actions`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`。这些会有意绕过模型提示，
  并证明确定性的 Gateway 网关/渠道 `send`、`poll` 和
  `message.action` 合约。
- 访问控制覆盖：`whatsapp-access-control-dm-open`、
  `whatsapp-access-control-dm-disabled`、`whatsapp-access-control-group-open`、
  `whatsapp-access-control-group-disabled`、`whatsapp-group-allowlist-block`。
- 原生审批：`whatsapp-approval-exec-deny-native`、
  `whatsapp-approval-exec-native`、`whatsapp-approval-exec-reaction-native`、
  `whatsapp-approval-exec-group-reaction-native`、
  `whatsapp-approval-plugin-native`。
- 状态表情回应：`whatsapp-status-reactions`、
  `whatsapp-status-reaction-lifecycle`。

目录当前包含 52 个场景。`live-frontier` 默认通道
保持较小规模，为 10 个场景，用于快速冒烟覆盖。`mock-openai`
默认通道通过真实 WhatsApp
传输确定性运行 45 个场景，同时只模拟模型输出；审批场景和少数
较重/阻塞检查仍需按场景 ID 显式运行。

WhatsApp QA 驱动会观察结构化实时事件（`text`、`media`、
`location`、`reaction` 和 `poll`），并且可以主动发送媒体、投票、
联系人、位置和贴纸。QA Lab 通过
`@openclaw/whatsapp/api.js` 包表面导入该驱动，而不是触达私有的
WhatsApp 运行时文件。对于群组观察，`fromJid` 是群组 JID，
而 `participantJid` 和 `fromPhoneE164` 标识参与者发送者。
消息内容默认会被遮盖。直接 Gateway 网关投票、upload-file、
媒体、群组投票、群组媒体和回复形状探测属于传输/API
合约检查；它们不会被视为用户提示让
智能体选择相同操作的证明。用户路径操作证明来自
`whatsapp-agent-message-action-react` 和
`whatsapp-group-agent-message-action-react` 等场景，其中驱动发送普通
WhatsApp 消息，而 QA Lab 会观察生成的原生 WhatsApp 工件。
WhatsApp 报告包含每个场景的姿态（`user-path`、
`direct-gateway` 或 `native-approval`），因此证据不会被误认为证明了
比实际更强的合约。

输出工件：

- `whatsapp-qa-report.md`
- `qa-evidence.json` - 实时传输检查的证据条目。
- `whatsapp-qa-observed-messages.json` - 正文会被遮盖，除非设置
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`。

### Convex 凭证池

Discord、Slack、Telegram 和 WhatsApp 通道可以从
共享 Convex 池租用凭证，而不是读取上面的环境变量。传入
`--credential-source convex`（或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；
QA Lab 会获取一个独占租约，在运行期间为它发送心跳，
并在关闭时释放它。池类型为 `"discord"`、`"slack"`、
`"telegram"` 和 `"whatsapp"`。

代理在 `admin/add` 上验证的载荷形状：

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
  这种类型。
- WhatsApp（`kind: "whatsapp"`）：`{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - 电话号码必须是不同的 E.164 字符串。

Mantis Telegram Desktop 证明工作流会持有一个独占 Convex
`telegram-user` 租约，同时用于 TDLib CLI 驱动和 Telegram Desktop
见证器，然后在发布证明后释放它。

当 PR 需要确定性的视觉差异时，Mantis 可以在 `main` 和 PR head 上使用相同的模拟
模型回复，同时变更 Telegram 格式化器或
投递层。捕获默认值针对 PR 评论调优：标准
Crabbox 类别、24fps 桌面录制、24fps 动态 GIF，以及 1920px 预览
宽度。前后对比评论应发布一个干净的包，其中
只包含预期的 GIF。

Slack 通道也可以使用该池。Slack 载荷形状检查目前位于
Slack QA runner 中，而不是代理中；请使用 `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`，并使用类似
`Cxxxxxxxxxx` 的 Slack 渠道 ID。应用
和权限范围预配请参见
[设置 Slack 工作区](#setting-up-the-slack-workspace)。

操作环境变量和 Convex 代理端点合约位于
[测试 → 通过 Convex 共享 Telegram 凭证](/zh-CN/help/testing#shared-telegram-credentials-via-convex-v1)
（该章节名称早于多渠道池；租约语义
在各类型之间共享）。

## 仓库支持的种子

种子资产位于 `qa/`：

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

这些文件有意放在 git 中，以便 QA 计划对人类和
智能体都可见。

`qa-lab` 保持为通用 YAML 场景 runner。每个场景 YAML 文件都是
一次测试运行的事实来源，并应定义：

- 顶层 `title`
- `scenario` 元数据
- `scenario` 中的可选类别、能力、通道和风险元数据
- `scenario` 中的文档和代码引用
- `scenario` 中的可选插件要求
- `scenario` 中的可选 Gateway 网关配置补丁
- 用于流程场景的可执行顶层 `flow`，或用于 Vitest 和
  Playwright 场景的 `scenario.execution.kind` / `scenario.execution.path`

支撑 `flow` 的可复用运行时表面保持通用且
跨领域。例如，YAML 场景可以组合传输侧
帮助器和浏览器侧帮助器，后者通过
Gateway 网关 `browser.request` 接缝驱动嵌入式 Control UI，而无需添加特殊情况 runner。

场景文件应按产品能力分组，而不是按源码树
文件夹分组。文件移动时保持场景 ID 稳定；使用 `docsRefs` 和
`codeRefs` 提供实现可追溯性。

基线列表应保持足够宽，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体交接
- 仓库阅读和文档阅读
- 一个小型构建任务，例如 Lobster Invaders

## 提供商模拟通道

`qa suite` 有两个本地提供商模拟通道：

- `mock-openai` 是感知场景的 OpenClaw mock。它仍然是仓库支持的 QA 和一致性门禁的默认
  确定性 mock 通道。
- `aimock` 会启动一个由 AIMock 支撑的提供商服务器，用于实验性
  协议、fixture、录制/回放和混沌覆盖。它是增量能力，
  不会替代 `mock-openai` 场景调度器。

提供商通道实现位于 `extensions/qa-lab/src/providers/` 下。
每个提供商拥有自己的默认值、本地服务器启动、Gateway 网关模型配置、
认证配置文件暂存需求，以及实时/mock 能力标志。共享套件和
Gateway 网关代码会通过提供商注册表路由，而不是按
提供商名称分支。

## 传输适配器

`qa-lab` 为 YAML QA 场景拥有一个通用传输接缝。`qa-channel` 是
合成默认值。`crabline` 会启动本地的提供商形状服务器，并
让 OpenClaw 的普通渠道插件对其运行。`live` 保留给
真实提供商凭证和外部渠道。

在架构层面，拆分如下：

- `qa-lab` 拥有通用场景执行、worker 并发、工件
  写入和报告。
- 传输适配器拥有 Gateway 网关配置、就绪检查、入站和出站
  观察、传输操作，以及规范化传输状态。
- `qa/scenarios/` 下的 YAML 场景文件定义测试运行；`qa-lab`
  提供执行它们的可复用运行时表面。

### 添加渠道

向 YAML QA 系统添加渠道需要渠道实现
以及一个用于演练渠道合约的场景包。对于冒烟 CI
覆盖，请添加匹配的 Crabline 本地提供商服务器，并通过
`crabline` 驱动暴露它。

当共享 `qa-lab` 宿主可以拥有该流程时，不要添加新的顶层 QA 命令根。

`qa-lab` 拥有共享宿主机制：

- `openclaw qa` 命令根
- 套件启动和拆卸
- worker 并发
- 工件写入
- 报告生成
- 场景执行
- 较旧 `qa-channel` 场景的兼容性别名

Runner 插件拥有传输合约：

- `openclaw qa <runner>` 如何挂载到共享 `qa` 根下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露转录和规范化传输状态
- 如何执行由传输支撑的操作
- 如何处理传输特定的重置或清理

新渠道的最低采用门槛：

1. 保持 `qa-lab` 作为共享 `qa` 根命令的所有者。
2. 在共享 `qa-lab` 主机接口上实现传输运行器。
3. 将传输特定机制保留在运行器插件或渠道 harness 内。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；惰性 CLI 和运行器执行应放在单独的入口点之后。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或改编 YAML 场景。
6. 为新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意迁移，否则保持现有兼容性别名可用。

判定规则很严格：

- 如果行为可以在 `qa-lab` 中一次性表达，就放到 `qa-lab` 中。
- 如果行为依赖某一个渠道传输，就保留在该运行器插件或插件 harness 中。
- 如果某个场景需要多个渠道都能使用的新能力，就添加通用辅助函数，而不是在 `suite.ts` 中添加渠道特定分支。
- 如果某个行为只对一种传输有意义，就保持场景为传输特定，并在场景契约中明确说明。

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

现有场景仍可使用兼容性别名 -
`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、
`formatConversationTranscript`、`resetBus` - 但编写新场景时应使用通用名称。这些别名是为了避免一次性迁移，而不是未来的模型。

## 报告

`qa-lab` 会根据观测到的总线时间线导出 Markdown 协议报告。报告应回答：

- 哪些有效
- 哪些失败
- 哪些仍被阻塞
- 哪些后续场景值得添加

如需查看可用场景清单 - 在评估后续工作规模或接入新传输时很有用 - 运行 `pnpm openclaw qa coverage`（添加 `--json` 可获得机器可读输出）。为触及的行为或文件路径选择聚焦证明时，运行 `pnpm openclaw qa coverage --match <query>`。匹配报告会搜索场景元数据、文档引用、代码引用、覆盖率 ID、插件和提供商要求，然后打印匹配的 `qa suite --scenario ...` 目标。

每次 `qa suite` 运行都会为所选场景集写入顶层 `qa-evidence.json`、`qa-suite-summary.json` 和 `qa-suite-report.md` 工件。声明 `execution.kind: vitest` 或 `execution.kind: playwright` 的场景会运行匹配的测试路径，并同时写入每场景日志。声明 `execution.kind: script` 的场景会通过 `node --import tsx` 运行位于 `execution.path` 的证据生成器（在 `execution.args` 中展开 `${outputDir}` 和 `${scenarioId}`）；生成器会写入自己的 `qa-evidence.json`，其中的条目会导入到套件输出中，其工件路径会相对于该生成器的 `qa-evidence.json` 解析。当通过 `qa run --qa-profile` 到达 `qa suite` 时，同一个 `qa-evidence.json` 还会包含所选分类法类别的 profile 评分卡摘要。

将覆盖率输出视为发现辅助，而不是门禁替代；所选场景仍需要与被测行为匹配的正确提供商模式、实时传输、Multipass、Testbox 或发布通道。有关评分卡上下文，请参阅 [成熟度评分卡](/zh-CN/maturity/scorecard)。

对于角色和风格检查，请在多个实时模型引用上运行同一场景，并写入经过评审的 Markdown 报告：

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

该命令会运行本地 QA Gateway 网关子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置人格，然后运行普通用户轮次，例如聊天、工作区帮助和小文件任务。不应告知候选模型它正在接受评估。该命令会保留每个完整转录，记录基本运行统计信息，然后在提供商支持时，以快速模式和 `xhigh` 推理请求评审模型按自然度、氛围和幽默感对运行结果排序。比较提供商时使用 `--blind-judge-models`：评审提示仍会获得每份转录和运行状态，但候选引用会替换为 `candidate-01` 等中性标签；报告会在解析后将排名映射回真实引用。

候选运行默认使用 `high` thinking；GPT-5.5 使用 `medium`，支持它的较旧 OpenAI 评估引用使用 `xhigh`。用 `--model provider/model,thinking=<level>` 内联覆盖特定候选；内联选项也支持 `fast`、`no-fast` 和 `fast=<bool>`。`--thinking <level>` 仍会设置全局回退，较旧的 `--model-thinking <provider/model=level>` 形式会保留用于兼容。OpenAI 候选引用默认启用快速模式，以便在提供商支持时使用优先处理。仅当你想为每个候选模型强制启用快速模式时才传入 `--fast`。报告会记录候选和评审耗时用于基准分析，但评审提示会明确说明不要按速度排名。候选和评审模型运行默认并发数都是 16。当提供商限制或本地 Gateway 网关压力使运行噪声过大时，降低 `--concurrency` 或 `--judge-concurrency`。

未传入候选 `--model` 时，角色评估默认使用 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。未传入 `--judge-model` 时，评审默认使用 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-8,thinking=high`。

## 相关文档

- [Matrix QA](/zh-CN/concepts/qa-matrix)
- [成熟度评分卡](/zh-CN/maturity/scorecard)
- [个人智能体基准包](/zh-CN/concepts/personal-agent-benchmark-pack)
- [QA Channel](/zh-CN/channels/qa-channel)
- [测试](/zh-CN/help/testing)
- [仪表板](/zh-CN/web/dashboard)
