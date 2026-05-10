---
read_when:
    - 添加或修改消息卡片、按钮或选择控件的渲染
    - 构建支持富格式出站消息的渠道插件
    - 更改消息工具的呈现或递送能力
    - 调试提供商特定的卡片/块/组件渲染回归问题
summary: 面向渠道插件的语义化消息卡片、按钮、选择器、回退文本和投递提示
title: 消息呈现
x-i18n:
    generated_at: "2026-05-10T19:41:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

消息呈现是 OpenClaw 面向丰富出站聊天 UI 的共享契约。
它让智能体、CLI 命令、审批流程和插件只描述一次消息意图，
而每个渠道插件都能渲染其可支持的最佳原生形态。

将呈现用于可移植的消息 UI：

- 文本区段
- 小型上下文/页脚文本
- 分隔线
- 按钮
- 选择菜单
- 卡片标题和语气

不要向共享消息工具添加新的提供商原生字段，例如 Discord `components`、Slack
`blocks`、Telegram `buttons`、Teams `card` 或 Feishu `card`。
这些是渠道插件拥有的渲染器输出。

## 契约

插件作者从以下位置导入公共契约：

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

形状：

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

按钮语义：

- `value` 是应用操作值；当渠道支持可点击控件时，它会通过该渠道现有的交互路径路由回来。
- `url` 是链接按钮。它可以在没有 `value` 的情况下存在。
- `label` 是必需的，也会用于文本降级。
- `style` 是建议性的。渲染器应将不支持的样式映射到安全默认值，而不是让发送失败。

选择语义：

- `options[].value` 是所选的应用值。
- `placeholder` 是建议性的，可能会被没有原生选择支持的渠道忽略。
- 如果渠道不支持选择，降级文本会列出标签。

## 生产者示例

简单卡片：

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

仅 URL 的链接按钮：

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

选择菜单：

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

CLI 发送：

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

置顶投递：

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

带显式 JSON 的置顶投递：

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## 渲染器契约

渠道插件在其出站适配器上声明渲染支持：

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

能力字段刻意保持为简单布尔值。它们描述渲染器可以让什么变成可交互的，
而不是描述每个原生平台限制。渲染器仍然拥有平台特定限制，
例如最大按钮数量、块数量和卡片大小。

## 核心渲染流程

当 `ReplyPayload` 或消息操作包含 `presentation` 时，核心会：

1. 规范化呈现载荷。
2. 解析目标渠道的出站适配器。
3. 读取 `presentationCapabilities`。
4. 当适配器可以渲染载荷时，调用 `renderPresentation`。
5. 当适配器不存在或无法渲染时，降级为保守文本。
6. 通过常规渠道投递路径发送生成的载荷。
7. 在第一条成功发送的消息后，应用 `delivery.pin` 等投递元数据。

核心拥有降级行为，因此生产者可以保持渠道无关。渠道插件拥有原生渲染和交互处理。

## 降级规则

呈现必须能够安全地发送到能力受限的渠道。

降级文本包括：

- `title` 作为第一行
- `text` 块作为普通段落
- `context` 块作为紧凑上下文行
- `divider` 块作为视觉分隔符
- 按钮标签，包括链接按钮的 URL
- 选择选项标签

不支持的原生控件应降级，而不是让整个发送失败。
示例：

- 禁用内联按钮的 Telegram 会发送文本降级。
- 没有选择支持的渠道会将选择选项列为文本。
- 仅 URL 的按钮会变成原生链接按钮或降级 URL 行。
- 可选置顶失败不会让已投递消息失败。

主要例外是 `delivery.pin.required: true`；如果请求将置顶设为必需，
而渠道无法置顶已发送的消息，则投递会报告失败。

## 提供商映射

当前内置渲染器：

| 渠道 | 原生渲染目标 | 备注 |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord | 组件和组件容器 | 为现有提供商原生载荷生产者保留旧版 `channelData.discord.components`，但新的共享发送应使用 `presentation`。 |
| Slack | Block Kit | 为现有提供商原生载荷生产者保留旧版 `channelData.slack.blocks`，但新的共享发送应使用 `presentation`。 |
| Telegram | 文本加内联键盘 | 按钮/选择要求目标表面具备内联按钮能力；否则使用文本降级。 |
| Mattermost | 文本加交互属性 | 其他块降级为文本。 |
| Microsoft Teams | Adaptive Cards | 当同时提供普通 `message` 文本和卡片时，文本会随卡片一起包含。 |
| Feishu | 交互式卡片 | 卡片标题可以使用 `title`；正文避免重复该标题。 |
| 普通渠道 | 文本降级 | 没有渲染器的渠道仍会得到可读输出。 |

提供商原生载荷兼容性是为现有回复生产者提供的过渡便利。
这不是添加新的共享原生字段的理由。

## Presentation 与 InteractiveReply

`InteractiveReply` 是审批和交互助手使用的较旧内部子集。
它支持：

- 文本
- 按钮
- 选择

`MessagePresentation` 是规范的共享发送契约。它添加了：

- 标题
- 语气
- 上下文
- 分隔线
- 仅 URL 按钮
- 通过 `ReplyPayload.delivery` 提供的通用投递元数据

在桥接旧代码时，使用 `openclaw/plugin-sdk/interactive-runtime` 中的助手：

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新代码应直接接受或生成 `MessagePresentation`。

`presentationToInteractiveReply(...)` 会将标题、文本、上下文、按钮和选择映射到较旧的
`InteractiveReply` 形状，从而保留可见的呈现文本。已经以原生方式绘制标题、文本、
上下文和分隔线块的组件渲染器应改用
`presentationToInteractiveControlsReply(...)`，然后只追加按钮和选择控件。

`renderMessagePresentationFallbackText(...)` 会在呈现块没有文本降级时返回空字符串，
例如仅包含分隔线的呈现。要求发送正文非空的传输协议可以传入
`emptyFallback`，以选择使用最小正文，而不改变默认降级契约。

## 投递置顶

置顶是投递行为，不是呈现。使用 `delivery.pin`，而不是
`channelData.telegram.pin` 等提供商原生字段。

语义：

- `pin: true` 会置顶第一条成功投递的消息。
- `pin.notify` 默认为 `false`。
- `pin.required` 默认为 `false`。
- 可选置顶失败会降级，并保持已发送消息不变。
- 必需置顶失败会让投递失败。
- 分块消息会置顶第一条已投递分块，而不是尾部分块。

对于提供商支持这些操作的现有消息，手动 `pin`、`unpin` 和 `pins` 消息操作仍然存在。

## 插件作者清单

- 当渠道可以渲染或安全降级语义呈现时，从 `describeMessageTool(...)` 声明 `presentation`。
- 将 `presentationCapabilities` 添加到运行时出站适配器。
- 在运行时代码中实现 `renderPresentation`，而不是在控制平面插件设置代码中实现。
- 让原生 UI 库远离热设置/目录路径。
- 在渲染器和测试中保留平台限制。
- 为不支持的按钮、选择、URL 按钮、标题/文本重复，以及混合 `message` 加 `presentation` 发送添加降级测试。
- 只有当提供商可以置顶已发送的消息 ID 时，才通过 `deliveryCapabilities.pin` 和
  `pinDeliveredMessage` 添加投递置顶支持。
- 不要通过共享消息操作架构暴露新的提供商原生卡片/块/组件/按钮字段。

## 相关文档

- [消息 CLI](/zh-CN/cli/message)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件架构](/zh-CN/plugins/architecture-internals#message-tool-schemas)
- [渠道呈现重构计划](/zh-CN/plan/ui-channels)
