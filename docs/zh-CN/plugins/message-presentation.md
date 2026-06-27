---
read_when:
    - 添加或修改消息卡片、按钮或选择控件渲染
    - 构建支持丰富出站消息的渠道插件
    - 更改消息工具呈现或递送能力
    - 调试提供商特定的卡片/区块/组件渲染回归
summary: 用于渠道插件的语义化消息卡片、按钮、选择控件、回退文本和递送提示
title: 消息呈现
x-i18n:
    generated_at: "2026-06-27T02:43:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

消息呈现是 OpenClaw 用于丰富出站聊天 UI 的共享契约。
它让智能体、CLI 命令、审批流程和插件只描述一次消息意图，同时每个渠道插件都能渲染它可以支持的最佳原生形态。

将呈现用于可移植的消息 UI：

- 文本分区
- 小号上下文/页脚文本
- 分隔线
- 按钮
- 选择菜单
- 卡片标题和语气

不要向共享消息工具添加新的提供商原生字段，例如 Discord `components`、Slack
`blocks`、Telegram `buttons`、Teams `card` 或 Feishu `card`。这些是由渠道插件拥有的渲染器输出。

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

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
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

- `action.type: "command"` 通过核心的命令路径运行原生斜杠命令。将其用于内置命令按钮和菜单。
- `action.type: "callback"` 通过渠道的交互路径携带不透明的插件数据。渠道插件不得将回调数据重新解释为斜杠命令。
- `value` 是旧版不透明回调值。新控件应使用 `action`，这样渠道插件无需根据文本猜测即可映射命令和回调。
- `url` 是链接按钮。它可以不带 `value` 单独存在。
- `webApp` 描述渠道原生 Web 应用按钮。Telegram 会将其渲染为 `web_app`，并且仅在私聊中支持它。为兼容起见，宽松 JSON 载荷中仍接受 `web_app`，但 TypeScript 生产者应使用 `webApp`。
- `label` 是必需的，也会用于文本回退。
- `style` 是建议性的。渲染器应将不支持的样式映射到安全默认值，而不是导致发送失败。
- `priority` 是可选的。当渠道声明了操作限制且必须丢弃控件时，核心会优先保留较高优先级的按钮，并在优先级相同时保留原始顺序。当所有控件都能容纳时，会保留作者给出的顺序。
- `disabled` 是可选的。渠道必须通过 `supportsDisabled` 显式选择支持；否则核心会将禁用控件降级为非交互式回退文本。
- `reusable` 是可选的。支持可复用原生回调的渠道可在成功交互后保持该操作可用。将其用于可重复或幂等的操作，例如刷新、检查或查看更多详情；对于普通的一次性审批和破坏性操作，请保留未设置状态。

选择语义：

- `options[].action` 与按钮 `action` 具有相同的命令/回调含义。
- `options[].value` 是旧版选中的应用值。
- `placeholder` 是建议性的，没有原生选择支持的渠道可能会忽略它。
- 如果渠道不支持选择，回退文本会列出标签。

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

Telegram Mini App 按钮：

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
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

使用显式 JSON 的置顶投递：

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
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
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

能力布尔值描述渲染器可以将哪些内容做成交互式。可选的 `limits` 描述核心可在调用渲染器前适配的通用包络：

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};
```

核心会在渲染前将通用限制应用到语义控件。对于原生块数量、卡片大小、URL 限制以及无法在通用契约中表达的提供商特性，渲染器仍然拥有最终的提供商特定验证和裁剪权。如果限制从某个块中移除了所有控件，核心会将标签保留为非交互式上下文文本，使投递的消息仍具有可见回退。

## 核心渲染流程

当 `ReplyPayload` 或消息操作包含 `presentation` 时，核心会：

1. 规范化呈现载荷。
2. 解析目标渠道的出站适配器。
3. 读取 `presentationCapabilities`。
4. 当适配器声明了限制时，应用通用能力限制，例如操作数量、标签长度和选择选项数量。
5. 当适配器可以渲染载荷时，调用 `renderPresentation`。
6. 当适配器缺失或无法渲染时，回退到保守文本。
7. 通过正常的渠道投递路径发送生成的载荷。
8. 在第一条消息成功发送后应用投递元数据，例如 `delivery.pin`。

核心拥有回退行为，因此生产者可以保持渠道无关。渠道插件拥有原生渲染和交互处理。

## 降级规则

呈现必须能够安全发送到能力有限的渠道。

回退文本包括：

- `title` 作为第一行
- `text` 块作为普通段落
- `context` 块作为紧凑上下文行
- `divider` 块作为视觉分隔线
- 按钮标签，包括链接按钮的 URL
- 选择选项标签

不支持的原生控件应降级，而不是导致整个发送失败。
示例：

- 禁用内联按钮的 Telegram 会发送文本回退。
- 不支持选择的渠道会将选择选项列为文本。
- 仅 URL 按钮会变成原生链接按钮或回退 URL 行。
- 可选的置顶失败不会导致已投递消息失败。

主要例外是 `delivery.pin.required: true`；如果请求将置顶作为必需操作，而渠道无法置顶已发送消息，则投递会报告失败。

## 提供商映射

当前内置渲染器：

| 渠道            | 原生渲染目标                        | 说明                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 组件和组件容器                      | 为现有提供商原生载荷生产者保留旧版 `channelData.discord.components`，但新的共享发送应使用 `presentation`。 |
| Slack           | Block Kit                           | 为现有提供商原生载荷生产者保留旧版 `channelData.slack.blocks`，但新的共享发送应使用 `presentation`。       |
| Telegram        | 文本加内联键盘                      | 按钮/选择需要目标表面具备内联按钮能力；否则会使用文本回退。                                         |
| Mattermost      | 文本加交互式属性                    | 其他块会降级为文本。                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | 当同时提供普通 `message` 文本和卡片时，卡片中会包含该文本。                                                                            |
| Feishu          | 交互式卡片                          | 卡片头部可以使用 `title`；正文会避免重复该标题。                                                                                  |
| 普通渠道        | 文本回退                            | 没有渲染器的渠道仍会获得可读输出。                                                                                            |

Provider-native payload 兼容性是为现有回复生成方提供的过渡便利，并不是添加新的共享原生字段的理由。

## 呈现与 InteractiveReply

`InteractiveReply` 是审批和交互辅助函数使用的较旧内部子集。它支持：

- 文本
- 按钮
- 选择器

`MessagePresentation` 是规范的共享发送契约。它新增了：

- 标题
- 语气
- 上下文
- 分隔线
- 仅 URL 按钮
- 通过 `ReplyPayload.delivery` 提供的通用投递元数据

在桥接较旧代码时，使用 `openclaw/plugin-sdk/interactive-runtime` 中的辅助函数：

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新代码应直接接受或生成 `MessagePresentation`。现有 `interactive` payload 是 `presentation` 的已弃用子集；运行时仍支持较旧的生成方。

旧版 `InteractiveReply*` 类型和转换辅助函数在 SDK 中已标记为 `@deprecated`：

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, 和
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` 和
`presentationToInteractiveControlsReply(...)` 仍可作为旧版渠道实现的渲染器桥接使用。新的生成方代码不应调用它们；应发送 `presentation`，并让核心/渠道适配处理渲染。

审批辅助函数也有 presentation 优先的替代项：

- 使用 `buildApprovalPresentationFromActionDescriptors(...)`，而不是
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- 使用 `buildApprovalPresentation(...)`，而不是
  `buildApprovalInteractiveReply(...)`
- 使用 `buildExecApprovalPresentation(...)`，而不是
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` 对没有文本后备的呈现块返回空字符串，例如仅包含分隔线的呈现。需要非空发送正文的传输协议可以传入 `emptyFallback`，以选择使用最小正文，而不改变默认后备契约。

## 投递置顶

置顶是投递行为，不是呈现。使用 `delivery.pin`，而不是 `channelData.telegram.pin` 等 provider-native 字段。

语义：

- `pin: true` 会置顶第一条成功投递的消息。
- `pin.notify` 默认为 `false`。
- `pin.required` 默认为 `false`。
- 可选置顶失败会降级，并保持已发送消息不变。
- 必需置顶失败会使投递失败。
- 分块消息会置顶第一个已投递分块，而不是末尾分块。

当提供商支持相关操作时，现有消息仍可使用手动 `pin`、`unpin` 和 `pins` 消息操作。

## 插件作者检查清单

- 当渠道可以渲染语义呈现或安全降级时，从 `describeMessageTool(...)` 声明 `presentation`。
- 将 `presentationCapabilities` 添加到运行时出站适配器。
- 在运行时代码中实现 `renderPresentation`，不要在控制平面插件设置代码中实现。
- 不要把原生 UI 库放入热设置/目录路径。
- 已知限制时，在 `presentationCapabilities.limits` 上声明通用能力限制。
- 在渲染器和测试中保留最终平台限制。
- 为不支持的按钮、选择器、URL 按钮、标题/文本重复，以及混合 `message` 加 `presentation` 发送添加后备测试。
- 仅当提供商可以置顶已发送消息 ID 时，才通过 `deliveryCapabilities.pin` 和
  `pinDeliveredMessage` 添加投递置顶支持。
- 不要通过共享消息操作 schema 暴露新的 provider-native 卡片/块/组件/按钮字段。

## 相关文档

- [消息 CLI](/zh-CN/cli/message)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件架构](/zh-CN/plugins/architecture-internals#message-tool-schemas)
- [频道呈现重构计划](/zh-CN/plan/ui-channels)
