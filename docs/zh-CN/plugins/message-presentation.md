---
read_when:
    - 添加或修改消息卡片、按钮或选择渲染
    - 构建支持丰富出站消息的渠道插件
    - 更改消息工具呈现或递送能力
    - 调试特定提供商的卡片/块/组件渲染回归
summary: 语义化消息卡片、按钮、选择菜单、回退文本，以及面向渠道插件的投递提示
title: 消息呈现
x-i18n:
    generated_at: "2026-07-05T11:30:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49e9a4657d27b90d12fb921bb4c9f0e7f0ae70d9dc452c8365626c9fdb5adcc8
    source_path: plugins/message-presentation.md
    workflow: 16
---

消息呈现是 OpenClaw 用于丰富出站聊天 UI 的共享契约。
它让智能体、CLI 命令、审批流程和插件只需描述一次消息意图，而每个渠道插件都能渲染其可支持的最佳原生形态。

将呈现用于可移植的消息 UI：文本段落、小号上下文/页脚文本、分隔线、按钮、选择菜单，以及卡片标题/语气。

不要向共享消息工具添加新的提供商原生字段，例如 Discord `components`、Slack `blocks`、Telegram `buttons`、Teams `card` 或 Feishu `card`。这些是由渠道插件拥有的渲染器输出。

## 契约

插件作者从以下位置导入公开契约：

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

- `action.type: "command"` 通过核心的命令路径运行原生斜杠命令。将它用于内置命令按钮和菜单。
- `action.type: "callback"` 通过渠道的交互路径携带不透明插件数据。渠道插件不得将回调数据重新解释为斜杠命令。
- `value` 是旧版不透明回调值。新控件应使用 `action`，这样渠道插件就能映射命令和回调，而无需从文本猜测。
- `url` 是链接按钮。它可以在没有 `value` 的情况下存在。
- `webApp` 描述渠道原生 Web App 按钮。Telegram 会将它渲染为 `web_app`，并且只在私聊中支持它。为了兼容性，宽松 JSON 负载中仍接受 `web_app`，但 TypeScript 生成方应使用 `webApp`。
- `label` 是必需的，也会用于文本回退。
- `style` 是建议性的。渲染器应将不支持的样式映射为安全默认值，而不是让发送失败。
- `priority` 是可选的。当渠道声明操作限制且必须丢弃控件时，核心会优先保留较高优先级的按钮，并在相同优先级的按钮之间保留原始顺序。当所有控件都能放下时，会保留作者定义的顺序。
- `disabled` 是可选的。渠道必须通过 `supportsDisabled` 显式选择支持；否则核心会将禁用控件降级为非交互式回退文本。禁用按钮在回退文本中始终只渲染标签，即使它携带 `command` 操作也是如此。
- `reusable` 是可选的。支持可复用原生回调的渠道可在一次成功交互后继续保留该操作可用。将它用于可重复或幂等的操作，例如刷新、检查或查看更多详情；对于普通的一次性审批和破坏性操作，保持未设置。

选择语义：

- `options[].action` 与按钮 `action` 具有相同的命令/回调含义。
- `options[].value` 是旧版选中的应用值。
- `placeholder` 是建议性的，可能会被没有原生选择支持的渠道忽略。
- 如果渠道不支持选择，回退文本会列出标签。

## 生成方示例

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

能力布尔值描述渲染器可以让哪些内容具备交互能力。可选的 `limits` 描述核心在调用渲染器之前可以适配的通用信封：

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

核心会在渲染前将通用限制应用到语义控件。渲染器仍拥有最终的提供商特定验证和裁剪，包括原生块数量、卡片大小、URL 限制，以及无法在通用契约中表达的提供商特殊行为。如果限制移除了某个块中的所有控件，核心会将标签保留为非交互式上下文文本，这样投递的消息仍有可见回退。

## 核心渲染流程

当 `ReplyPayload` 或消息操作包含 `presentation` 时，核心会：

1. 规范化呈现负载。
2. 解析目标渠道的出站适配器。
3. 读取 `presentationCapabilities`。
4. 在适配器声明时应用通用能力限制，例如操作数量、标签长度和选择选项数量。
5. 当适配器能够渲染负载时调用 `renderPresentation`。
6. 当适配器不存在或无法渲染时回退到保守文本。
7. 通过正常渠道投递路径发送生成的负载。
8. 在第一条消息成功发送后应用投递元数据，例如 `delivery.pin`。

核心拥有回退行为，因此生成方可以保持渠道无关。渠道插件拥有原生渲染和交互处理。

## 降级规则

呈现必须能安全发送到能力受限的渠道。

回退文本包括：

- `title` 作为第一行
- `text` 块作为普通段落
- `context` 块作为紧凑上下文行
- `divider` 块作为视觉分隔符
- 按钮标签，包括链接按钮的 URL
- 选择选项标签

### 按钮值回退可见性

当渠道无法渲染交互式控件时，按钮和选择值会回退为纯文本。回退行为在保持可用性的同时，也会让不透明回调数据保持私密：

- **`command` 类型的操作**渲染为 `label: \`command\``，这样用户可以复制命令并在渠道输入中手动运行。
- **`callback` 类型的操作**和旧版 **`value`** 字段仅渲染为标签。不透明回调值不会暴露在回退文本中。
- **`url` / `webApp`** 按钮会在按钮标签旁边渲染 URL 文本，因为 URL 面向用户。
- **选择选项**仅渲染为标签。底层选项值不会暴露在回退文本中。

在回退 UI 中添加手动命令指引的渠道适配器（例如 Feishu 文档评论说明），必须从回退渲染器使用的同一组呈现块中派生命令存在性检查，这样指引文本只会在实际显示手动命令时出现。

不支持的原生控件应降级，而不是让整个发送失败。示例：

- 禁用内联按钮的 Telegram 会发送文本回退。
- 没有选择支持的渠道会将选择选项列为文本。
- 仅 URL 的按钮会变为原生链接按钮或回退 URL 行。
- 可选的置顶失败不会让已投递消息失败。

主要例外是 `delivery.pin.required: true`；如果置顶被请求为必需，而渠道无法置顶已发送消息，投递会报告失败。

## 提供商映射

当前内置渲染器：

| 渠道            | 原生渲染目标                              | 说明                                                                                                                                                                                                                 |
| --------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 组件和组件容器                            | 为现有提供商原生 payload 生成器保留旧版 `channelData.discord.components`，但新的共享发送应使用 `presentation`。                                                                                                      |
| Feishu          | 交互式卡片                                | 卡片标题可以使用 `title`；正文避免重复该标题。                                                                                                                                                                       |
| Matrix          | 文本回退加结构化事件字段                  | 按钮/选择器会声明为受支持，但目前每个块都会渲染为 `renderMessagePresentationFallbackText` 输出，并放在 `com.openclaw.presentation` 事件字段中，而不是原生交互式小部件。                                                |
| Mattermost      | 文本加交互式 props                        | 不支持选择器和分隔线；这些块会降级为文本。                                                                                                                                                                           |
| Microsoft Teams | Adaptive Cards                            | 如果同时提供普通 `message` 文本和卡片，文本会随卡片一起包含。不支持选择器、样式和禁用状态。                                                                                                                         |
| Slack           | Block Kit                                 | 为现有提供商原生 payload 生成器保留旧版 `channelData.slack.blocks`，但新的共享发送应使用 `presentation`。                                                                                                            |
| Telegram        | 文本加内联键盘                            | 按钮/选择器要求目标表面具备内联按钮能力；否则会使用文本回退。                                                                                                                                                        |
| 普通渠道        | 文本回退                                  | 没有渲染器的渠道仍会获得可读输出。                                                                                                                                                                                   |

提供商原生 payload 兼容性是面向现有回复生成器的过渡便利能力。
它不是新增共享原生字段的理由。

## Presentation 与 InteractiveReply

`InteractiveReply` 是审批和交互辅助函数使用的较旧内部子集。它支持：

- 文本
- 按钮
- 选择器

`MessagePresentation` 是规范的共享发送契约。它新增：

- 标题
- 语气
- 上下文
- 分隔线
- 仅 URL 按钮
- 通过 `ReplyPayload.delivery` 提供通用投递元数据

桥接较旧代码时，请使用 `openclaw/plugin-sdk/interactive-runtime` 中的辅助函数：
__OC_I18N_900011__
新代码应直接接受或生成 `MessagePresentation`。现有 `interactive` payload 是 `presentation` 的已弃用子集；运行时仍支持较旧的生成器。

值得了解的未弃用辅助函数：

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  会验证并强制转换无类型 payload（例如来自 CLI `--presentation` 标志的 JSON）
  为 `MessagePresentation`。
- `isMessagePresentationInteractiveBlock(block)` 会将块收窄为
  `buttons` | `select` 联合类型。
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` 会读取 `action` 上的有效
  command/callback 值，并且 `resolveMessagePresentationControlValue` 会回退到旧版 `value`
  字段。

旧版 `InteractiveReply*` 类型和转换辅助函数在 SDK 中标记为
`@deprecated`：

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
`presentationToInteractiveControlsReply(...)` 仍可作为旧版渠道实现的渲染器桥接使用。
新的生成器代码不应调用它们；发送 `presentation`，并让核心/渠道适配处理渲染。

审批辅助函数也有 presentation 优先的替代项：

- 使用 `buildApprovalPresentationFromActionDescriptors(...)`，而不是
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- 使用 `buildApprovalPresentation(...)`，而不是
  `buildApprovalInteractiveReply(...)`
- 使用 `buildExecApprovalPresentation(...)`，而不是
  `buildExecApprovalInteractiveReply(...)`

对于没有文本回退的 presentation 块（例如仅分隔线的 presentation），
`renderMessagePresentationFallbackText(...)` 会返回空字符串。需要非空发送正文的传输协议可以传入
`emptyFallback`，以选择使用最小正文，而不改变默认回退契约。

## 投递置顶

置顶是投递行为，不是呈现。使用 `delivery.pin`，而不是
`channelData.telegram.pin` 等提供商原生字段。

语义：

- `pin: true` 会置顶第一条成功投递的消息。
- `pin.notify` 默认为 `false`。
- `pin.required` 默认为 `false`。
- 可选置顶失败会降级，并保留已发送消息不变。
- 必需置顶失败会导致投递失败。
- 分块消息会置顶第一个已投递分块，而不是最后一个分块。

对于提供商支持这些操作的现有消息，手动 `pin`、`unpin` 和 `pins` 消息操作仍然存在。

## 插件作者检查清单

- 当渠道可以渲染语义化 presentation 或安全降级时，从 `describeMessageTool(...)` 声明 `presentation`。
- 将 `presentationCapabilities` 添加到运行时出站适配器。
- 在运行时代码中实现 `renderPresentation`，而不是在控制平面插件设置代码中实现。
- 不要把原生 UI 库放入热设置/catalog 路径。
- 已知时，在 `presentationCapabilities.limits` 上声明通用能力限制。
- 在渲染器和测试中保留最终平台限制。
- 为不受支持的按钮、选择器、URL 按钮、标题/文本重复，以及混合 `message` 加 `presentation` 发送添加回退测试。
- 仅在提供商可以置顶已发送消息 ID 时，通过 `deliveryCapabilities.pin` 和
  `pinDeliveredMessage` 添加投递置顶支持。
- 不要通过共享消息操作 schema 暴露新的提供商原生卡片/块/组件/按钮字段。

## 相关文档

- [消息 CLI](/zh-CN/cli/message)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件架构](/zh-CN/plugins/architecture-internals#message-tool-schemas)
- [渠道呈现重构计划](/zh-CN/plan/ui-channels)
