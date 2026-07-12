---
read_when:
    - 添加或修改消息卡片、图表、表格、按钮或选择器的呈现方式
    - 构建支持富出站消息的渠道插件
    - 更改消息工具的呈现或投递能力
    - 调试特定提供商的卡片、区块和组件渲染回归问题
summary: 用于渠道插件的语义化消息卡片、图表、表格、控件、回退文本和投递提示
title: 消息呈现
x-i18n:
    generated_at: "2026-07-12T14:39:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 400841f6fd1817350bffdfca15c7154bc98811fbe984056416d86d7fe990b5b5
    source_path: plugins/message-presentation.md
    workflow: 16
---

消息呈现是 OpenClaw 用于丰富出站聊天 UI 的共享契约。
它让智能体、CLI 命令、审批流程和插件只需描述一次消息意图，
而每个渠道插件都可以将其渲染为自身所能提供的最佳原生形式。

使用消息呈现来实现可移植的消息 UI：文本区块、小型上下文/页脚
文本、分隔线、图表、表格、按钮、选择菜单，以及卡片标题/语气。

不要向共享消息工具添加新的提供商原生字段，例如 Discord `components`、Slack
`blocks`、Telegram `buttons`、Teams `card` 或 Feishu `card`。
这些是由渠道插件所有的渲染器输出。

## 契约

插件作者从以下位置导入公共契约：

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

结构：

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
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] }
  | {
      type: "chart";
      chartType: "pie";
      title: string;
      segments: Array<{ label: string; value: number }>;
    }
  | {
      type: "chart";
      chartType: "bar" | "area" | "line";
      title: string;
      categories: string[];
      series: Array<{ name: string; values: number[] }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "table";
      caption: string;
      headers: string[];
      rows: Array<Array<string | number>>;
      rowHeaderColumnIndex?: number;
    };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: "allow-once" | "allow-always" | "deny";
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** 旧版回调值。新控件应优先使用 action。 */
  value?: string;
  /** @deprecated 请使用 type 为 "url" 的 action。 */
  url?: string;
  /** @deprecated 请使用 type 为 "web-app" 的 action。 */
  webApp?: { url: string };
  /** @deprecated 请使用 type 为 "web-app" 的 action。 */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: Extract<MessagePresentationAction, { type: "command" | "callback" }>;
  /** 旧版回调值。新控件应优先使用 action。 */
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

- `action.type: "command"` 通过核心的命令路径运行原生斜杠命令。
  将其用于内置命令按钮和菜单。
- `action.type: "callback"` 通过渠道的交互路径传递不透明的插件数据。
  渠道插件不得将回调数据重新解释为斜杠命令。
- `action.type: "approval"` 标识一项持久的操作员审批、其明确的 `exec`
  或 `plugin` 类型，以及请求的决定。渠道插件将该操作编码为传输层私有的
  回调，并通过审批服务解析它；它们不得解析 `/approve` 命令文本，也不得
  根据 ID 推断类型。
- `action.type: "url"` 打开普通链接。
- `action.type: "web-app"` 启动渠道原生 Web 应用。
- `value` 是旧版不透明回调值。新控件应使用 `action`，
  以便渠道插件无需根据文本猜测即可映射命令和回调。
- `url`、`webApp` 和 `web_app` 仍作为已弃用的边界输入被接受。
  规范化器会保留这些字段，以便渲染器区分已发布的旧版语义与显式类型化操作。
  新的生产方应使用 `action`。
- `label` 为必填项，也用于文本回退。
- `style` 仅为建议。渲染器应将不支持的样式映射为安全的
  默认样式，而不是导致发送失败。
- `priority` 为可选项。当渠道声明了操作数量限制且必须丢弃部分控件时，
  核心会优先保留优先级较高的按钮，并在优先级相同时保留原始顺序。
  当所有控件都能容纳时，将保留创作顺序。
- `disabled` 为可选项。渠道必须通过 `supportsDisabled` 明确选择支持；否则，
  核心会将禁用的控件降级为非交互式回退文本。禁用按钮在回退文本中始终仅渲染
  标签，即使它携带 `command` 操作也是如此。
- `reusable` 为可选项。支持可复用原生回调的渠道可以在成功交互后
  继续保留该操作。将其用于刷新、检查或查看更多详情等可重复或幂等操作；
  对于普通的一次性审批和破坏性操作，请不要设置该字段。

选择菜单语义：

- `options[].action` 仅接受 `command` 或 `callback`；审批和链接操作仅适用于按钮。
- `options[].value` 是旧版选定应用值。
- `placeholder` 仅为建议，不支持原生选择菜单的渠道可能会忽略它。
- 如果渠道不支持选择菜单，回退文本会列出各个标签。

图表语义：

- `pie` 要求分段值为正数。
- `bar`、`area` 和 `line` 使用一个有序的 `categories` 数组。每个系列
  必须按相同顺序为每个类别提供且仅提供一个有限值。
- 类别标签和系列名称必须唯一。无效或不完整的图表
  区块会在规范化期间被丢弃，而不会静默更改数据。
- 原生图表渲染需要通过 `presentationCapabilities.charts` 明确选择启用。
  其他渠道会以确定性文本形式接收图表标题、坐标轴、类别、系列和值。
  这同时也是无障碍回退形式。

表格语义：

- `caption` 是必填的简短标题。`headers` 必须至少包含一个
  唯一且非空的列标签。
- `rows` 必须至少包含一行。每行的单元格数量必须与表头数量完全一致，
  且每个单元格必须是非空字符串或有限数值。
- `rowHeaderColumnIndex` 是可选的从零开始的索引，用于标识原生渲染器
  应将其单元格公开为行标题的列。
- 表格规范化是原子操作。无效的标题、表头、行宽、单元格
  或行标题索引会导致整个表格区块被丢弃，而不是截断或修复其数据。
- 原生表格渲染需要通过 `presentationCapabilities.tables` 明确选择启用。
  其他渠道会以确定性的线性文本形式接收标题和每一行，
  并折叠内部空白：

  ```text
  待处理的销售管线（表格）
  - 客户：Acme；阶段：已赢单；ARR：125000
  - 客户：Globex；阶段：审核；ARR：82000
  ```

不存在单独的 `report` 判别字段。请使用 `title`、`tone`、`text`、`context`、
`chart`、`table` 和操作区块来组合报告。这样可以让每个区块都能独立渲染，
并让完整报告具有相同的确定性文本回退形式。

## 生产方示例

简单卡片：

```json
{
  "title": "部署审批",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "金丝雀版本已准备好升级。" },
    { "type": "context", "text": "构建 1234，预发布环境已通过。" },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "批准",
          "action": { "type": "callback", "value": "deploy:approve" },
          "style": "success"
        },
        {
          "label": "拒绝",
          "action": { "type": "callback", "value": "deploy:decline" },
          "style": "danger"
        }
      ]
    }
  ]
}
```

仅 URL 的链接按钮：

```json
{
  "blocks": [
    { "type": "text", "text": "发布说明已准备就绪。" },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "打开说明",
          "action": { "type": "url", "url": "https://example.com/release" }
        }
      ]
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
      "buttons": [
        {
          "label": "启动",
          "action": { "type": "web-app", "url": "https://example.com/app" }
        }
      ]
    }
  ]
}
```

选择菜单：

```json
{
  "title": "选择环境",
  "blocks": [
    {
      "type": "select",
      "placeholder": "环境",
      "options": [
        { "label": "金丝雀", "value": "env:canary" },
        { "label": "生产环境", "value": "env:prod" }
      ]
    }
  ]
}
```

图表：

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "line",
      "title": "季度收入",
      "categories": ["第一季度", "第二季度", "第三季度"],
      "series": [
        { "name": "产品", "values": [120, 145, 138] },
        { "name": "服务", "values": [80, 95, 104] }
      ],
      "xLabel": "季度",
      "yLabel": "收入"
    }
  ]
}
```

表格报告：

```json
{
  "title": "销售管线报告",
  "tone": "info",
  "blocks": [
    { "type": "text", "text": "按阶段列出的当前商机。" },
    {
      "type": "table",
      "caption": "待处理的销售管线",
      "headers": ["客户", "阶段", "ARR"],
      "rows": [
        ["Acme", "已赢单", 125000],
        ["Globex", "审核", 82000]
      ],
      "rowHeaderColumnIndex": 0
    },
    { "type": "context", "text": "已根据 CRM 快照更新。" }
  ]
}
```

CLI 发送：

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "部署审批" \
  --presentation '{"title":"部署审批","tone":"warning","blocks":[{"type":"text","text":"金丝雀版本已准备就绪。"},{"type":"buttons","buttons":[{"label":"批准","value":"deploy:approve","style":"success"},{"label":"拒绝","value":"deploy:decline","style":"danger"}]}]}'
```

置顶投递：

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "主题已打开" \
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
    charts: false,
    tables: false,
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

能力布尔值描述渲染器可以使哪些内容具备交互性。可选的
`limits` 描述核心在调用渲染器之前可进行适配的通用边界：

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  charts?: boolean;
  tables?: boolean;
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

核心在渲染前对语义控件应用通用限制。渲染器仍负责最终的提供商特定验证和裁剪，以处理原生区块数量、卡片大小、URL 限制，以及无法在通用契约中表达的提供商特殊行为。如果限制移除了某个区块中的所有控件，核心会将标签保留为非交互式上下文文本，使已送达的消息仍具有可见的后备内容。

## 核心渲染流程

在 CLI 和标准消息操作所使用的规范出站路径中，核心会：

1. 规范化呈现载荷。
2. 解析目标渠道的出站适配器。
3. 读取 `presentationCapabilities`。
4. 当适配器声明相应限制时，应用操作数量、标签长度和选择选项数量等通用能力限制。除非适配器分别明确声明 `charts: true` 或 `tables: true`，否则图表和表格区块会转换为确定性文本。
5. 当适配器能够渲染载荷时，调用 `renderPresentation`。
6. 当适配器不存在或无法渲染时，回退为保守的文本。
7. 通过常规渠道投递路径发送生成的载荷。
8. 在成功发送第一条消息后，应用 `delivery.pin` 等投递元数据。

直接使用 `ReplyPayload` 的渠道本地回复或预览汇聚流程，必须进入该规范路径，或者在将载荷投影为纯文本/媒体之前，具体化相同的呈现后备内容。

核心负责后备行为，使生成方可以保持与渠道无关。渠道插件负责原生渲染和交互处理。

## 降级规则

呈现内容必须能够安全地发送到能力受限的渠道。

后备文本包括：

- 第一行使用 `title`
- 将 `text` 块作为普通段落
- 将 `context` 块作为紧凑的上下文行
- 将 `divider` 块作为视觉分隔符
- 按钮标签，包括链接按钮的 URL
- 选择选项标签
- 图表标题、类型、坐标轴、类别、数据系列和值
- 表格标题、表头和每一行的值

### 按钮值回退的可见性

当渠道无法呈现交互式控件时，按钮和选择项的值会回退为纯文本。此回退行为在保持可用性的同时，也会确保不透明的回调数据不被公开：

- **`command` 类型的操作**呈现为 `label: \`command\`` so users can
  copy the command and run it manually in the channel input.
- **`callback`-typed actions** and legacy **`value`** fields render as
  label-only. The opaque callback value is not exposed in fallback text.
- **`approval`-typed actions** render label-only. Approval IDs and decisions are
  transport data and are not exposed through generic scalar helpers or fallback
  text.
- **`url` / `web-app` actions** and deprecated **`url` / `webApp` / `web_app`**
  输入会在按钮标签旁呈现 URL 文本，因为该 URL
  面向用户显示。
- **选择选项**仅呈现标签。底层选项值不会
  在回退文本中公开。

在其回退 UI 中添加手动命令指引的渠道适配器（例如
Feishu 文档评论说明）必须基于回退渲染器所使用的同一组呈现块
来检查是否存在命令，从而仅在实际显示手动命令时
才显示指引文本。

不受支持的原生控件应降级处理，而不是导致整个发送操作失败。
示例：

- 禁用内联按钮时，Telegram 会发送文本后备内容。
- 不支持选择控件的渠道会以文本形式列出选择选项。
- 不支持原生图表的渠道会以文本形式列出图表数据。
- 不支持原生表格的渠道会以文本形式列出表格的每一行。
- 仅包含 URL 的按钮会转换为原生链接按钮或后备 URL 文本行。
- 可选的置顶操作失败不会导致已送达的消息失败。

主要例外是 `delivery.pin.required: true`；如果请求将置顶作为
必需操作，而渠道无法置顶已发送的消息，则送达操作会报告失败。

## 提供商映射

当前内置的渲染器：

| 渠道            | 原生渲染目标                              | 说明                                                                                                                                                                                                                  |
| --------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 组件和组件容器                            | 为现有的提供商原生载荷生成方保留旧版 `channelData.discord.components`，但新的共享发送应使用 `presentation`。                                                                                                            |
| Feishu          | 交互式卡片                                | 卡片标题栏可以使用 `title`；正文会避免重复该标题。                                                                                                                                                                    |
| Matrix          | 文本回退加结构化事件字段                  | 按钮/选择框会声明为受支持，但目前每个块都会渲染为 `renderMessagePresentationFallbackText` 输出，并承载在 `com.openclaw.presentation` 事件字段中，而不是原生交互式微件。                                                   |
| Mattermost      | 文本加交互式属性                          | 不支持选择框和分隔线；这些块会降级为文本。                                                                                                                                                                            |
| Microsoft Teams | Adaptive Cards                            | 同时提供卡片和纯 `message` 文本时，卡片中会包含该文本。不支持选择框、样式和禁用状态。                                                                                                                                 |
| Slack           | Block Kit                                 | 将 `chart` 渲染为原生 `data_visualization`，将 `table` 渲染为原生 `data_table`；保留旧版 `channelData.slack.blocks`，但新的共享发送应使用 `presentation`。                                                               |
| Telegram        | 文本加内联键盘                            | 按钮/选择框要求目标界面具备内联按钮能力；否则使用文本回退。                                                                                                                                                           |
| 纯文本渠道      | 文本回退                                  | 没有渲染器的渠道仍会获得可读输出。                                                                                                                                                                                    |

提供商原生载荷兼容性是一项过渡措施，供现有的
回复生成方使用。不能以此为由添加新的共享原生字段。

## 呈现与 InteractiveReply

`InteractiveReply` 是审批和交互
辅助函数使用的旧版内部子集。它支持：

- 文本
- 按钮
- 选择框

`MessagePresentation` 是规范的共享发送契约。它新增：

- 标题
- 语气
- 上下文
- 分隔线
- 图表
- 表格
- 仅 URL 按钮
- 通过 `ReplyPayload.delivery` 提供的通用投递元数据

桥接旧代码时，请使用
`openclaw/plugin-sdk/interactive-runtime` 中的辅助函数：
__OC_I18N_900014__
新代码应直接接受或生成 `MessagePresentation`。现有
`interactive` 载荷是 `presentation` 的已弃用子集；运行时
仍支持旧版生成方。

值得了解的非弃用辅助函数：

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  会验证未指定类型的载荷并将其强制转换为 `MessagePresentation`（例如来自 CLI
  `--presentation` 标志的 JSON）。
- `isMessagePresentationInteractiveBlock(block)` 将块的类型收窄到
  `buttons` | `select` 联合类型。
- `resolveMessagePresentationButtonAction(button)` 和
  `resolveMessagePresentationOptionAction(option)` 在接受已弃用边界字段的同时返回规范的类型化
  操作。显式 `action`
  始终优先。
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` 仅读取命令/回调
  标量值。非标量的规范操作绝不会回退到旧版影子 `value`，
  因此审批 ID 和链接目标会保持类型信息。
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)` 将单个结构化
  数据块渲染为确定性文本，供渠道专用回退路径使用。

旧版 `InteractiveReply*` 类型和转换辅助函数在 SDK 中标记为
`@deprecated`：

- `InteractiveReply`、`InteractiveReplyBlock`、`InteractiveReplyButton`、
  `InteractiveReplyOption`、`InteractiveReplySelectBlock` 和
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` 和
`presentationToInteractiveControlsReply(...)` 仍可用作旧版渠道实现的渲染器
桥接。新的生成方代码不应调用
它们；应发送 `presentation`，并让核心/渠道适配处理渲染。

审批辅助函数也有以呈现为先的替代项：

- 使用 `buildApprovalPresentationFromActionDescriptors(...)`，而不是
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- 使用 `buildApprovalPresentation(...)`，而不是
  `buildApprovalInteractiveReply(...)`
- 使用 `buildExecApprovalPresentation(...)`，而不是
  `buildExecApprovalInteractiveReply(...)`

为保持插件兼容性，这些已发布的构建器仍以命令为后端。拥有持久审批类型的 Gateway 网关
和内置渠道代码应使用
`buildTypedApprovalPresentation(...)`、
`buildTypedExecApprovalPendingReplyPayload(...)` 或
`buildTypedPluginApprovalPendingReplyPayload(...)`，以便传输层接收显式
`approval` 操作，而不是从 `/approve` 文本中推断语义。

对于没有文本回退的呈现块，例如仅包含分隔线的
呈现，`renderMessagePresentationFallbackText(...)` 会返回空字符串。
要求发送正文非空的传输层可以传入
`emptyFallback`，以选择使用最小正文，同时不更改默认回退
契约。

## 投递固定项

置顶属于投递行为，而非呈现。请使用 `delivery.pin`，不要使用
`channelData.telegram.pin` 等提供商原生字段。

语义：

- `pin: true` 会置顶第一条成功投递的消息。
- `pin.notify` 默认为 `false`。
- `pin.required` 默认为 `false`。
- 可选置顶失败时会降级处理，并保留已发送的消息。
- 必需置顶失败时，投递失败。
- 对于分块消息，置顶第一个已投递的分块，而不是末尾分块。

对于已有消息，如果提供商支持相应操作，仍可使用手动 `pin`、`unpin` 和 `pins` 消息操作。

## 插件作者检查清单

- 当渠道能够渲染语义呈现或安全降级时，通过 `describeMessageTool(...)`
  声明 `presentation`。
- 将 `presentationCapabilities` 添加到运行时出站适配器。
- 在运行时代码中实现 `renderPresentation`，而不是在控制平面插件
  设置代码中实现。
- 避免在热路径的设置/目录路径中使用原生 UI 库。
- 如果已知通用能力限制，请在 `presentationCapabilities.limits` 中声明。
- 在渲染器和测试中保留最终平台限制。
- 为不受支持的图表、表格、按钮、选择器、URL 按钮、标题/文本重复，以及同时发送
  `message` 和 `presentation` 的情况添加回退测试。
- 仅当提供商能够置顶指定已发送消息 ID 时，才通过 `deliveryCapabilities.pin` 和
  `pinDeliveredMessage` 添加投递置顶支持。
- 不要通过共享消息操作 schema 暴露新的提供商原生卡片/区块/组件/按钮字段。

## 相关文档

- [消息 CLI](/zh-CN/cli/message)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件架构](/zh-CN/plugins/architecture-internals#message-tool-schemas)
- [渠道呈现重构计划](/zh-CN/plan/ui-channels)
