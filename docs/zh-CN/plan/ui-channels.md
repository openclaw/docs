---
read_when:
    - 重构渠道消息 UI、交互式载荷或原生渠道渲染器
    - 更改消息工具能力、递送提示或跨上下文标记
    - 调试 Discord Carbon 导入扇出或渠道插件运行时惰性加载
summary: 将语义消息呈现与渠道原生 UI 渲染器解耦。
title: 渠道呈现重构计划
x-i18n:
    generated_at: "2026-06-27T02:27:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## 状态

已针对共享智能体、CLI、插件能力和出站交付表面实现：

- `ReplyPayload.presentation` 携带语义化消息 UI。
- `ReplyPayload.delivery.pin` 携带已发送消息的置顶请求。
- 共享消息操作公开 `presentation`、`delivery` 和 `pin`，而不是提供商原生的 `components`、`blocks`、`buttons` 或 `card`。
- 核心会通过插件声明的出站能力渲染呈现，或自动降级呈现。
- Discord、Slack、Telegram、Mattermost、MS Teams 和 Feishu 渲染器使用通用契约。
- Discord 渠道控制平面代码不再导入 Carbon 支持的 UI 容器。

规范文档现在位于 [消息呈现](/zh-CN/plugins/message-presentation)。
将此计划保留为历史实现背景；如有契约、渲染器或回退行为变更，请更新规范指南。

## 问题

渠道 UI 当前拆分在几个不兼容的表面中：

- 核心通过 `buildCrossContextComponents` 拥有一个 Discord 形状的跨上下文渲染器钩子。
- Discord `channel.ts` 可以通过 `DiscordUiContainer` 导入原生 Carbon UI，这会把运行时 UI 依赖拉入渠道插件控制平面。
- 智能体和 CLI 暴露原生载荷逃生口，例如 Discord `components`、Slack `blocks`、Telegram 或 Mattermost `buttons`，以及 Teams 或 Feishu `card`。
- `ReplyPayload.channelData` 同时携带传输提示和原生 UI 信封。
- 通用 `interactive` 模型已经存在，但它比 Discord、Slack、Teams、Feishu、LINE、Telegram 和 Mattermost 已经使用的更丰富布局更窄。

这会让核心感知原生 UI 形状，削弱插件运行时惰性，并让智能体拥有过多提供商特定的方式来表达同一种消息意图。

## 目标

- 核心根据声明的能力决定消息的最佳语义呈现。
- 插件声明能力，并将语义呈现渲染为原生传输载荷。
- Web Control UI 与聊天原生 UI 保持分离。
- 不通过共享智能体或 CLI 消息表面暴露原生渠道载荷。
- 不支持的呈现功能自动降级为最佳文本表示。
- 置顶已发送消息等交付行为是通用交付元数据，而不是呈现。

## 非目标

- 不为 `buildCrossContextComponents` 提供向后兼容 shim。
- 不为 `components`、`blocks`、`buttons` 或 `card` 提供公开原生逃生口。
- 核心不导入渠道原生 UI 库。
- 不为内置渠道提供提供商特定 SDK 接缝。

## 目标模型

向核心拥有的 `ReplyPayload` 添加 `presentation` 字段。

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
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
```

迁移期间，`interactive` 会成为 `presentation` 的子集：

- `interactive` 文本块映射到 `presentation.blocks[].type = "text"`。
- `interactive` 按钮块映射到 `presentation.blocks[].type = "buttons"`。
- `interactive` 选择块映射到 `presentation.blocks[].type = "select"`。

外部智能体和 CLI schema 现在使用 `presentation`；`interactive` 仍作为内部遗留解析器/渲染辅助工具，用于现有回复生产者。
面向公开生产者的 API 将 `interactive` 视为已弃用。运行时支持会保留，以便现有审批辅助工具和旧插件继续工作，而新代码则发出 `presentation`。

## 交付元数据

添加核心拥有的 `delivery` 字段，用于非 UI 的发送行为。

```ts
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

语义：

- `delivery.pin = true` 表示置顶第一条成功交付的消息。
- `notify` 默认值为 `false`。
- `required` 默认值为 `false`；不支持的渠道或置顶失败会通过继续交付自动降级。
- 手动 `pin`、`unpin` 和 `list-pins` 消息操作会为现有消息保留。

当前 Telegram ACP 话题绑定应从 `channelData.telegram.pin = true` 迁移到 `delivery.pin = true`。

## 运行时能力契约

向运行时出站适配器添加呈现和交付渲染钩子，而不是添加到控制平面渠道插件。

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

核心行为：

- 解析目标渠道和运行时适配器。
- 请求呈现能力。
- 在渲染前降级不支持的块，并应用通用能力限制。
- 调用 `renderPresentation`。
- 如果不存在渲染器，则将呈现转换为文本回退。
- 成功发送后，当请求了 `delivery.pin` 且支持时，调用 `pinDeliveredMessage`。

## 渠道映射

Discord：

- 在仅运行时模块中将 `presentation` 渲染为 components v2 和 Carbon 容器。
- 将强调色辅助工具保留在轻量模块中。
- 从渠道插件控制平面代码移除 `DiscordUiContainer` 导入。

Slack：

- 将 `presentation` 渲染为 Block Kit。
- 移除智能体和 CLI 的 `blocks` 输入。

Telegram：

- 将文本、上下文和分隔线渲染为文本。
- 在为目标表面配置并允许时，将操作和选择渲染为内联键盘。
- 内联按钮被禁用时使用文本回退。
- 将 ACP 话题置顶迁移到 `delivery.pin`。

Mattermost：

- 在配置后将操作渲染为交互式按钮。
- 将其他块渲染为文本回退。

MS Teams：

- 将 `presentation` 渲染为 Adaptive Cards。
- 保留手动 pin/unpin/list-pins 操作。
- 如果 Graph 对目标会话的支持可靠，可以选择实现 `pinDeliveredMessage`。

Feishu：

- 将 `presentation` 渲染为交互式卡片。
- 保留手动 pin/unpin/list-pins 操作。
- 如果 API 行为可靠，可以选择为已发送消息置顶实现 `pinDeliveredMessage`。

LINE：

- 尽可能将 `presentation` 渲染为 Flex 或模板消息。
- 对不支持的块回退到文本。
- 从 `channelData` 中移除 LINE UI 载荷。

普通或受限渠道：

- 使用保守格式将呈现转换为文本。

## 重构步骤

1. 重新应用 Discord 发布修复，将 `ui-colors.ts` 从 Carbon 支持的 UI 中拆分出来，并从 `extensions/discord/src/channel.ts` 移除 `DiscordUiContainer`。
2. 向 `ReplyPayload`、出站载荷规范化、交付摘要和钩子载荷添加 `presentation` 和 `delivery`。
3. 在窄 SDK/运行时子路径中添加 `MessagePresentation` schema 和解析器辅助工具。
4. 将消息能力 `buttons`、`cards`、`components` 和 `blocks` 替换为语义呈现能力。
5. 为呈现渲染和交付置顶添加运行时出站适配器钩子。
6. 用 `buildCrossContextPresentation` 替换跨上下文组件构造。
7. 删除 `src/infra/outbound/channel-adapters.ts`，并从渠道插件类型中移除 `buildCrossContextComponents`。
8. 更改 `maybeApplyCrossContextMarker`，使其附加 `presentation` 而不是原生参数。
9. 更新插件分派发送路径，使其仅使用语义呈现和交付元数据。
10. 移除智能体和 CLI 原生载荷参数：`components`、`blocks`、`buttons` 和 `card`。
11. 移除创建原生消息工具 schema 的 SDK 辅助工具，并以呈现 schema 辅助工具替换。
12. 从 `channelData` 中移除 UI/原生信封；在每个剩余字段经过审查前，仅保留传输元数据。
13. 迁移 Discord、Slack、Telegram、Mattermost、MS Teams、Feishu 和 LINE 渲染器。
14. 更新消息 CLI、渠道页面、插件 SDK 和能力扩展手册的文档。
15. 对 Discord 和受影响的渠道入口点运行导入扇出分析。

步骤 1-11 和 13-14 已在此重构中针对共享智能体、CLI、插件能力和出站适配器契约实现。步骤 12 仍然是针对提供商私有 `channelData` 传输信封的更深入内部清理轮次。步骤 15 仍是后续验证，如果我们想获得类型/测试门禁之外的量化导入扇出数字。

## 测试

添加或更新：

- 呈现规范化测试。
- 针对不支持块的呈现自动降级测试。
- 针对插件分派和核心交付路径的跨上下文标记测试。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE 和文本回退的渠道渲染矩阵测试。
- 证明原生字段已移除的消息工具 schema 测试。
- 证明原生标志已移除的 CLI 测试。
- 覆盖 Carbon 的 Discord 入口点导入惰性回归测试。
- 覆盖 Telegram 和通用回退的交付置顶测试。

## 待解决问题

- `delivery.pin` 应在第一轮为 Discord、Slack、MS Teams 和 Feishu 实现，还是先只实现 Telegram？
- `delivery` 最终是否应吸收现有字段，例如 `replyToId`、`replyToCurrent`、`silent` 和 `audioAsVoice`，还是继续专注于发送后行为？
- 呈现是否应直接支持图片或文件引用，还是媒体目前应继续与 UI 布局分离？

## 相关

- [渠道概览](/zh-CN/channels)
- [消息呈现](/zh-CN/plugins/message-presentation)
