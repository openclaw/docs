---
read_when:
    - 你想要在 Control UI 中看到 Dayflow 风格的一日时间线
    - 你正在启用或配置内置的 Logbook 插件
    - 你想要基于屏幕活动的站会摘要或日程回顾
summary: 基于定期屏幕快照构建的可选自动工作日志
title: Logbook 插件
x-i18n:
    generated_at: "2026-07-05T20:18:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d15a6e0835d6916c1ad5d203d6d85d6a7946b2bcb9c2985ce53a803d471c389
    source_path: plugins/logbook.md
    workflow: 16
---

Logbook 插件会将屏幕活动转成自动工作日志。它会从已配对节点定期捕获屏幕快照，将其总结为带时间戳的观察记录，并在
[Control UI](/zh-CN/web/control-ui) 中构建时间线卡片。它还可以生成每日站会笔记，并回答关于某个已跟踪日期的问题。

OpenClaw 拥有的状态保留在 Gateway 网关上的 `<state-dir>/logbook/` 下，但模型处理不一定在本地进行。采样的截图会发送到已配置的视觉路由；观察记录和时间线文本会发送到默认智能体模型。如果屏幕内容和派生的活动文本必须留在本机，请为两个阶段都使用本地模型路由。

Logbook 是内置插件，默认禁用。启用该插件会让 Gateway 网关选择启用屏幕捕获，因为 `captureEnabled` 默认值为 `true`。

## 开始之前

你需要：

- 一个已连接的节点，并且它暴露 `screen.snapshot` 或 `logbook.snapshot`。macOS 应用节点需要屏幕录制权限。无头 macOS 节点主机（`openclaw node host run`）会获得插件提供的 `logbook.snapshot` 命令，该命令由系统 `screencapture` 工具支持。
- 已启用并完成身份验证的内置 Codex 插件。Codex 目前提供 Logbook 所需的结构化图像提取契约。使用 `openclaw models auth login --provider openai` 登录；其他身份验证路径见
  [Codex harness](/zh-CN/plugins/codex-harness)。
- 一个可用的默认智能体模型。Logbook 会在视觉处理之后用它来合成卡片、站会笔记和日期问答。

## 快速开始

启用 Codex 和 Logbook 插件：

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

配置显式视觉模型，以获得确定性的启动行为：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.5",
        },
      },
    },
  },
}
```

如果你使用 `plugins.allow`，请同时包含 `codex` 和 `logbook`。更改插件配置后重启 Gateway 网关，然后检查注册信息并打开仪表盘：

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

节点描述必须包含 `screen.snapshot` 或 `logbook.snapshot`。无头节点只有在插件处于活动状态后才会通告 `logbook.snapshot`。如果缺少该命令，请参阅[节点故障排查](/zh-CN/nodes/troubleshooting)。

Logbook 标签页只会在插件已启用且 Control UI 会话具有 `operator.write` 时出现。状态行应显示 **正在捕获** 且没有错误。分析窗口关闭后会出现时间线卡片；或者你也可以在已捕获活动后选择 **立即分析**。

## 工作原理

1. **捕获**：每隔 `captureIntervalSeconds`（默认 30 秒），Logbook 会调用所选节点的捕获命令，并存储一帧缩放后的 JPEG 图像。连续相同的帧会被标记为空闲，并从分析中排除。
2. **观察**：当一个分析窗口（默认 15 分钟）结束后，插件最多采样 16 帧活动画面并发送给视觉模型，模型会返回带时间戳的活动观察记录（“VS Code：正在编辑 store.ts，修复一个类型错误”）。超过两分钟的捕获间隔或本地午夜也会关闭当前窗口。
3. **合成**：观察记录加上最近 45 分钟的现有卡片会被修订为时间线卡片（每张 10-60 分钟），包含标题、摘要、类别、主要应用，以及任何简短的分心项。
4. **清理**：早于 `retentionDays`（默认 14）的帧会被删除。卡片、观察记录和缓存的站会内容会保留。

日期边界和时间线时钟使用 Gateway 网关的本地时区，而不是浏览器时区。帧和 SQLite 时间线数据库位于 `<state-dir>/logbook/` 下。

## 模型和数据流

Logbook 使用两个独立的模型路由：

| 阶段 | 发送的数据 | 模型路由 |
| ---------------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| 观察 | 最多 16 帧采样 JPEG 图像及其捕获时间 | `visionModel`，或一个兼容的借用 `tools.media` Codex 条目 |
| 合成卡片 | 带时间戳的观察记录和最近的时间线卡片 | 通过插件 LLM 运行时使用默认智能体模型 |
| 生成站会 | 所选日期和前一天的卡片 | 通过插件 LLM 运行时使用默认智能体模型 |
| 询问你的一天 | 问题、所选日期的卡片和最近观察记录 | 通过插件 LLM 运行时使用默认智能体模型 |

完整 SQLite 数据库不会发送给任一模型。原始截图只会进入观察阶段；卡片合成、站会和问答接收的是派生文本。

## 配置

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.5",
          retentionDays: 14,
        },
      },
    },
  },
}
```

所有 Logbook 配置键都是可选的。数值会四舍五入为整数，并限制在支持的范围内。

| 键 | 默认值 | 范围或值 | 行为 |
| ------------------------- | ------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| `captureEnabled` | `true` | boolean | 新快照的持久主开关；为 `false` 时，时间线仍然可用 |
| `captureIntervalSeconds` | `30` | `5`-`600` | 捕获尝试之间的延迟 |
| `analysisIntervalMinutes` | `15` | `3`-`120` | 目标观察窗口；间隔和午夜可能会提前关闭它 |
| `nodeId` | 未设置 | 节点 id 或显示名称 | 将捕获固定到一个已连接节点；匹配不区分大小写 |
| `screenIndex` | `0` | `0`-`16` | 从零开始的显示器索引 |
| `maxWidth` | `1440` | `480`-`3840` | 请求的捕获尺寸上限；无头 macOS 会将其应用到最大尺寸 |
| `visionModel` | 未设置 | `provider/model` | 显式结构化路由；格式错误的引用会暂停分析，不受支持的提供商会使批次失败 |
| `retentionDays` | `14` | `1`-`365` | 删除旧帧；卡片、观察记录和站会内容会保留 |

如果没有 `nodeId`，Logbook 会优先选择暴露 `screen.snapshot` 的已连接应用节点，然后回退到暴露 `logbook.snapshot` 的无头节点。在未固定节点的设置中，失败节点会轮转到其他符合条件的节点之后。仪表盘暂停开关仅限会话，并会在 Gateway 网关重启时重置；如需持久停止，请使用 `captureEnabled: false`。

### 视觉模型选择

Logbook 按以下顺序解析观察模型：

1. `plugins.entries.logbook.config.visionModel`
2. `tools.media.image.models` 下第一个支持图像的 Codex 条目
3. `tools.media.models` 下第一个支持图像的 Codex 条目

其他媒体提供商会被跳过，因为它们目前不暴露 Logbook 所需的结构化提取契约。设置
`tools.media.image.enabled: false` 会禁用借用的媒体默认值，但显式 Logbook `visionModel` 仍然生效。

## 仪表盘标签页

- **时间线**：按活动展示可展开卡片，包含类别颜色、主要应用、分心芯片和快照关键帧。
- **每日概览**：专注比例、类别分解、热门应用。
- **每日站会**：将昨天和今天整理成可直接粘贴的更新。
- **询问你的一天**：基于已跟踪时间线回答自然语言问题（“我什么时候审阅了 gateway PR？”）。
- **立即分析**：立即关闭当前捕获窗口，而不是等待分析间隔结束。

## Gateway 网关方法

Logbook 注册这些 Gateway 网关 RPC 方法：

| 方法 | 参数 | 权限范围 | 结果 |
| --------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------ |
| `logbook.status` | 无 | `operator.read` | 捕获、分析、模型、节点、Gateway 网关日期和 Gateway 网关时区状态 |
| `logbook.days` | 无 | `operator.read` | 包含时间线卡片数量和卡片时间边界的日期 |
| `logbook.timeline` | `{ day?: "YYYY-MM-DD" }` | `operator.read` | 派生卡片和日期统计；默认使用 Gateway 网关当前日期 |
| `logbook.frames` | `{ startMs, endMs }` | `operator.write` | 请求的 epoch 毫秒范围内的帧元数据 |
| `logbook.frame` | `{ frameId }` | `operator.write` | 一个以 base64 表示的原始 JPEG 帧 |
| `logbook.standup` | `{ day?, refresh? }` | `operator.write` | 某天的缓存或重新生成的站会文本 |
| `logbook.ask` | `{ day?, question }` | `operator.write` | 基于时间线的某天回答 |
| `logbook.capture.set` | `{ paused }` | `operator.write` | 仅限会话的暂停状态和更新后的状态 |
| `logbook.analyze.now` | 无 | `operator.write` | 开始待处理分析，或返回无法开始的原因 |

读取方法返回运行状态或派生文本。原始截图像素、会产生模型费用的操作和运行时变更需要 `operator.write`。Control UI 标签页也需要 `operator.write`，因为它暴露这些操作和原始帧预览；只读客户端仍可直接调用派生文本方法。

## 隐私说明

- 快照可能包含屏幕上的任何内容，包括机密信息。帧不会离开机器，除非作为采样输入发送给已配置的观察模型。
- 在卡片合成、站会生成或问答过程中，观察记录、最近卡片和问题可能会通过默认智能体模型离开机器。请将提供商的数据处理策略应用到两个模型路由。
- 当你需要完全本地的流水线时，请为结构化观察模型和默认智能体模型都使用本地路由。
- 帧、时间线数据库和临时捕获会以仅所有者可访问的文件权限写入。
- 将 `screen.snapshot` 添加到 `gateway.nodes.denyCommands` 是屏幕捕获终止开关：它会同时阻止应用节点捕获和 Logbook 自己的 `logbook.snapshot` 命令。
- 设置 `tools.media.image.enabled: false` 也会阻止 Logbook 借用媒体图像模型进行分析；此时只会使用插件配置中显式的 `visionModel`。

## 故障排查

### Logbook 标签页缺失

检查全部三个门槛：

1. `openclaw plugins list --enabled` 包含 `logbook`。
2. Gateway 网关已在插件或允许列表更改后重启。
3. Control UI 连接具有 `operator.write`；只读会话不会收到交互式标签页描述符。

如果设置了 `plugins.allow`，则推荐配置必须同时包含 `logbook` 和 `codex`。

### 捕获报告错误

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- 确认节点暴露了 `screen.snapshot` 或 `logbook.snapshot`。
- 在捕获用 Mac 上授予屏幕录制权限。
- 如果配置了 `nodeId`，确认它与节点 ID 或显示名称匹配。
- 检查 `gateway.nodes.denyCommands` 未包含
  `screen.snapshot`。

连续三次失败后，Logbook 会退避十个捕获周期，然后重试。未固定的设置可以轮换到另一个符合条件的节点。

### 捕获成功但没有卡片出现

- **模型缺失**状态表示未找到兼容的结构化视觉路由。启用并认证 Codex 插件，或设置有效的显式 `visionModel`。模型缺失时，已捕获的帧会保持待处理状态，并可在修复配置后进行分析。
- 等待 `analysisIntervalMinutes`，或在捕获到活动后选择 **立即分析**。
- 连续相同的帧属于空闲证据，不会进入分析批次。测试前请更改可见屏幕内容。
- 如果最新批次显示错误，请修复模型或凭证问题，然后选择 **立即分析**。失败的批次只会在该显式操作后重试，以避免重复产生模型开销。

## 相关

- [管理插件](/zh-CN/plugins/manage-plugins)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [媒体理解](/zh-CN/nodes/media-understanding)
- [节点](/zh-CN/nodes)
- [节点故障排查](/zh-CN/nodes/troubleshooting)
- [Control UI](/zh-CN/web/control-ui)
