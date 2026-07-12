---
read_when:
    - 重构渠道消息 UI、交互式载荷或原生渠道渲染器
    - 更改消息工具能力、投递提示或跨上下文标记
    - 调试 Discord Carbon 导入扇出或渠道插件运行时的惰性加载
summary: 将语义化消息呈现与渠道原生 UI 渲染器解耦。
title: 频道呈现重构计划
x-i18n:
    generated_at: "2026-07-11T20:38:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## 状态

已在共享智能体、CLI、插件能力和出站投递界面中实现：

- `ReplyPayload.presentation` 承载语义化消息 UI。
- `ReplyPayload.delivery.pin` 承载已发送消息的置顶请求。
- 共享消息操作公开 `presentation`、`delivery` 和 `pin`，而非提供商原生的 `components`、`blocks`、`buttons` 或 `card`。
- 核心通过插件声明的出站能力渲染呈现内容，或自动进行降级。
- Discord、Slack、Telegram、Mattermost、MS Teams 和 Feishu 渲染器使用通用契约。
- Discord 渠道控制平面代码不再导入由 Carbon 支持的 UI 容器。

规范文档现位于[消息呈现](/zh-CN/plugins/message-presentation)。
保留此计划作为历史实现背景；如有契约、渲染器或回退行为变更，
请更新规范指南。

## 问题

渠道 UI 目前分散在多个不兼容的界面中：

- 核心通过 `buildCrossContextComponents` 持有一个采用 Discord 形态的跨上下文渲染器钩子。
- Discord 的 `channel.ts` 可以通过 `DiscordUiContainer` 导入原生 Carbon UI，从而将运行时 UI 依赖引入渠道插件控制平面。
- 智能体和 CLI 暴露了原生负载逃生通道，例如 Discord 的 `components`、Slack 的 `blocks`、Telegram 或 Mattermost 的 `buttons`，以及 Teams 或 Feishu 的 `card`。
- `ReplyPayload.channelData` 同时承载传输提示和原生 UI 信封。
- 通用 `interactive` 模型已经存在，但其能力比 Discord、Slack、Teams、Feishu、LINE、Telegram 和 Mattermost 已使用的丰富布局更有限。

这会使核心感知原生 UI 形态，削弱插件运行时的惰性加载，并让智能体可以通过过多提供商特定方式表达相同的消息意图。

## 目标

- 核心根据声明的能力，为消息选择最佳语义化呈现方式。
- 扩展声明能力，并将语义化呈现渲染为原生传输负载。
- Web Control UI 与聊天原生 UI 保持分离。
- 不通过共享智能体或 CLI 消息界面暴露原生渠道负载。
- 不支持的呈现功能自动降级为最佳文本表示。
- 置顶已发送消息等投递行为属于通用投递元数据，而非呈现内容。

## 非目标

- 不为 `buildCrossContextComponents` 提供向后兼容垫片。
- 不公开 `components`、`blocks`、`buttons` 或 `card` 的原生逃生通道。
- 核心不导入渠道原生 UI 库。
- 不为内置渠道提供特定于提供商的 SDK 接口。

## 目标模型

向 `ReplyPayload` 添加由核心持有的 `presentation` 字段。

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

迁移期间，`interactive` 将成为 `presentation` 的子集：

- `interactive` 文本块映射到 `presentation.blocks[].type = "text"`。
- `interactive` 按钮块映射到 `presentation.blocks[].type = "buttons"`。
- `interactive` 选择块映射到 `presentation.blocks[].type = "select"`。

外部智能体和 CLI 模式现在使用 `presentation`；`interactive` 仍作为内部遗留解析器和渲染辅助工具，供现有回复生成方使用。
面向公共生成方的 API 将 `interactive` 视为已弃用。运行时
仍予以支持，以便现有审批辅助工具和旧版插件继续
工作，而新代码则生成 `presentation`。

## 投递元数据

为非 UI 的发送行为添加由核心持有的 `delivery` 字段。

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

- `delivery.pin = true` 表示置顶第一条成功投递的消息。
- `notify` 默认为 `false`。
- `required` 默认为 `false`；对于不支持的渠道或置顶失败的情况，通过继续投递实现自动降级。
- 现有消息仍可使用手动 `pin`、`unpin` 和 `list-pins` 消息操作。

当前 Telegram ACP 话题绑定应从 `channelData.telegram.pin = true` 迁移到 `delivery.pin = true`。

## 运行时能力契约

将呈现和投递渲染钩子添加到运行时出站适配器，而非控制平面渠道插件。

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
- 查询呈现能力。
- 在渲染前降级不支持的块，并应用通用能力限制。
- 调用 `renderPresentation`。
- 如果不存在渲染器，则将呈现内容转换为文本回退。
- 成功发送后，如果请求了 `delivery.pin` 且渠道支持，则调用 `pinDeliveredMessage`。

## 渠道映射

Discord：

- 在仅限运行时的模块中，将 `presentation` 渲染为 v2 组件和 Carbon 容器。
- 将强调色辅助工具保留在轻量模块中。
- 从渠道插件控制平面代码中移除 `DiscordUiContainer` 导入。

Slack：

- 将 `presentation` 渲染为 Block Kit。
- 移除智能体和 CLI 的 `blocks` 输入。

Telegram：

- 将文本、上下文和分隔线渲染为文本。
- 在已配置且目标界面允许的情况下，将操作和选择项渲染为内联键盘。
- 禁用内联按钮时使用文本回退。
- 将 ACP 话题置顶迁移到 `delivery.pin`。

Mattermost：

- 在已配置的情况下，将操作渲染为交互式按钮。
- 将其他块渲染为文本回退。

MS Teams：

- 将 `presentation` 渲染为 Adaptive Cards。
- 保留手动置顶、取消置顶和列出置顶项的操作。
- 如果 Graph 对目标对话的支持足够可靠，可选择实现 `pinDeliveredMessage`。

Feishu：

- 将 `presentation` 渲染为交互式卡片。
- 保留手动置顶、取消置顶和列出置顶项的操作。
- 如果 API 行为可靠，可选择实现 `pinDeliveredMessage`，用于置顶已发送的消息。

LINE：

- 尽可能将 `presentation` 渲染为 Flex 或模板消息。
- 对不支持的块回退为文本。
- 从 `channelData` 中移除 LINE UI 负载。

纯文本或能力受限的渠道：

- 使用保守格式将呈现内容转换为文本。

## 重构步骤

1. 重新应用 Discord 发布修复：将 `ui-colors.ts` 与由 Carbon 支持的 UI 分离，并从 `extensions/discord/src/channel.ts` 中移除 `DiscordUiContainer`。
2. 将 `presentation` 和 `delivery` 添加到 `ReplyPayload`、出站负载规范化、投递摘要和钩子负载中。
3. 在范围有限的 SDK/运行时子路径中添加 `MessagePresentation` 模式和解析器辅助工具。
4. 使用语义化呈现能力替换消息能力中的 `buttons`、`cards`、`components` 和 `blocks`。
5. 为呈现渲染和投递置顶添加运行时出站适配器钩子。
6. 使用 `buildCrossContextPresentation` 替换跨上下文组件构建。
7. 删除 `src/infra/outbound/channel-adapters.ts`，并从渠道插件类型中移除 `buildCrossContextComponents`。
8. 更改 `maybeApplyCrossContextMarker`，使其附加 `presentation` 而非原生参数。
9. 更新插件分发发送路径，使其仅使用语义化呈现和投递元数据。
10. 移除智能体和 CLI 的原生负载参数：`components`、`blocks`、`buttons` 和 `card`。
11. 移除创建原生消息工具模式的 SDK 辅助工具，改用呈现模式辅助工具。
12. 从 `channelData` 中移除 UI/原生信封；在审查其余各字段之前，仅保留传输元数据。
13. 迁移 Discord、Slack、Telegram、Mattermost、MS Teams、Feishu 和 LINE 渲染器。
14. 更新消息 CLI、渠道页面、插件 SDK 和能力扩展手册的文档。
15. 对 Discord 和受影响的渠道入口点运行导入扇出分析。

本次重构已在共享智能体、CLI、插件能力和出站适配器契约中实现步骤 1-11 和 13-14。步骤 12 仍需进行更深入的内部清理，以处理提供商私有的 `channelData` 传输信封。如果需要获得超出类型/测试门禁的量化导入扇出数据，步骤 15 仍作为后续验证工作保留。

## 测试

添加或更新：

- 呈现规范化测试。
- 不支持块的呈现自动降级测试。
- 插件分发和核心投递路径的跨上下文标记测试。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE 和文本回退的渠道渲染矩阵测试。
- 证明原生字段已移除的消息工具模式测试。
- 证明原生标志已移除的 CLI 测试。
- 覆盖 Carbon 的 Discord 入口点导入惰性回归测试。
- 覆盖 Telegram 和通用回退的投递置顶测试。

## 待决问题

- 第一轮是否应为 Discord、Slack、MS Teams 和 Feishu 实现 `delivery.pin`，还是仅先为 Telegram 实现？
- `delivery` 最终是否应吸收 `replyToId`、`replyToCurrent`、`silent` 和 `audioAsVoice` 等现有字段，还是继续专注于发送后行为？
- 呈现是否应直接支持图片或文件引用，还是目前应让媒体与 UI 布局保持分离？

## 相关内容

- [渠道概览](/zh-CN/channels)
- [消息呈现](/zh-CN/plugins/message-presentation)
