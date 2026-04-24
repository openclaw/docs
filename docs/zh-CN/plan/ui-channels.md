---
read_when:
    - 重构渠道消息 UI、交互式负载或原生渠道渲染器
    - 更改消息工具能力、投递提示或跨上下文标记
    - 调试 Discord Carbon 导入扇出或渠道插件运行时懒加载
summary: 将语义消息呈现与渠道原生 UI 渲染器解耦。
title: 渠道呈现重构计划
x-i18n:
    generated_at: "2026-04-24T04:04:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: f983c4d14580e8a66744c7e5f23dd9846c11e926181a8441d60f346cec6d1eea
    source_path: plan/ui-channels.md
    workflow: 15
---

## 状态

已为共享智能体、CLI、插件能力以及出站投递界面实现：

- `ReplyPayload.presentation` 用于承载语义化消息 UI。
- `ReplyPayload.delivery.pin` 用于承载已发送消息的置顶请求。
- 共享消息操作现在暴露 `presentation`、`delivery` 和 `pin`，而不是提供商原生的 `components`、`blocks`、`buttons` 或 `card`。
- 核心通过插件声明的出站能力来渲染或自动降级消息呈现。
- Discord、Slack、Telegram、Mattermost、Microsoft Teams 和 Feishu 渲染器均已接入通用契约。
- Discord 渠道控制平面代码不再导入基于 Carbon 的 UI 容器。

规范文档现位于 [Message Presentation](/zh-CN/plugins/message-presentation)。
请将本计划保留为历史实现背景；如果契约、渲染器或回退行为发生变化，
请更新该规范指南。

## 问题

当前的渠道 UI 分散在多个不兼容的界面中：

- 核心通过 `buildCrossContextComponents` 拥有一个偏向 Discord 形态的跨上下文渲染钩子。
- Discord `channel.ts` 可以导入原生 Carbon UI，例如 `DiscordUiContainer`，这会将运行时 UI 依赖拉入渠道插件控制平面。
- 智能体和 CLI 暴露了原生负载逃逸口，例如 Discord `components`、Slack `blocks`、Telegram 或 Mattermost `buttons`，以及 Teams 或 Feishu `card`。
- `ReplyPayload.channelData` 同时承载传输提示和原生 UI 封装。
- 通用 `interactive` 模型已经存在，但它比 Discord、Slack、Teams、Feishu、LINE、Telegram 和 Mattermost 已经使用的更丰富布局要窄。

这使核心感知了原生 UI 形态，削弱了插件运行时懒加载能力，也让智能体拥有了过多提供商专属方式来表达相同的消息意图。

## 目标

- 核心根据声明的能力决定消息的最佳语义呈现方式。
- 扩展声明能力，并将语义化呈现渲染为原生传输负载。
- Web 控制 UI 与聊天原生 UI 保持分离。
- 共享智能体或 CLI 消息界面不暴露原生渠道负载。
- 不受支持的呈现功能自动降级为最佳文本表示。
- 诸如置顶已发送消息之类的投递行为应属于通用投递元数据，而不是呈现。

## 非目标

- 不为 `buildCrossContextComponents` 提供向后兼容 shim。
- 不公开 `components`、`blocks`、`buttons` 或 `card` 这类原生逃逸口。
- 核心不导入渠道原生 UI 库。
- 不为内置渠道提供提供商专属 SDK 接缝。

## 目标模型

向 `ReplyPayload` 添加一个由核心拥有的 `presentation` 字段。

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

在迁移过程中，`interactive` 会变成 `presentation` 的一个子集：

- `interactive` 文本块映射到 `presentation.blocks[].type = "text"`。
- `interactive` 按钮块映射到 `presentation.blocks[].type = "buttons"`。
- `interactive` 选择块映射到 `presentation.blocks[].type = "select"`。

外部智能体和 CLI schema 现在使用 `presentation`；`interactive` 仍作为现有回复生成器的内部遗留解析 / 渲染辅助器保留。

## 投递元数据

为非 UI 的发送行为添加一个由核心拥有的 `delivery` 字段。

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
- `notify` 默认值为 `false`。
- `required` 默认值为 `false`；对于不支持的渠道或置顶失败的情况，会自动降级并继续投递。
- 手动 `pin`、`unpin` 和 `list-pins` 消息操作仍用于现有消息。

当前的 Telegram ACP 话题绑定应从 `channelData.telegram.pin = true` 移至 `delivery.pin = true`。

## 运行时能力契约

将呈现和投递渲染钩子添加到运行时出站适配器中，而不是控制平面渠道插件中。

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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
- 查询其呈现能力。
- 在渲染前对不受支持的块进行降级。
- 调用 `renderPresentation`。
- 如果没有渲染器，则将呈现转换为文本回退。
- 成功发送后，当请求了 `delivery.pin` 且渠道支持时，调用 `pinDeliveredMessage`。

## 渠道映射

Discord：

- 在仅运行时模块中将 `presentation` 渲染为 components v2 和 Carbon 容器。
- 将强调色辅助函数保留在轻量模块中。
- 从渠道插件控制平面代码中移除 `DiscordUiContainer` 导入。

Slack：

- 将 `presentation` 渲染为 Block Kit。
- 移除智能体和 CLI 的 `blocks` 输入。

Telegram：

- 将 text、context 和 dividers 渲染为文本。
- 在已配置且目标界面允许时，将 actions 和 select 渲染为内联键盘。
- 在禁用内联按钮时使用文本回退。
- 将 ACP 话题置顶迁移到 `delivery.pin`。

Mattermost：

- 在已配置时将 actions 渲染为交互按钮。
- 其他块使用文本回退。

Microsoft Teams：

- 将 `presentation` 渲染为 Adaptive Cards。
- 保留手动 pin / unpin / list-pins 操作。
- 如果 Graph 对目标会话的支持足够可靠，可选择实现 `pinDeliveredMessage`。

Feishu：

- 将 `presentation` 渲染为交互卡片。
- 保留手动 pin / unpin / list-pins 操作。
- 如果 API 行为足够可靠，可选择实现用于已发送消息置顶的 `pinDeliveredMessage`。

LINE：

- 尽可能将 `presentation` 渲染为 Flex 或模板消息。
- 对不支持的块回退为文本。
- 从 `channelData` 中移除 LINE UI 负载。

纯文本或能力受限的渠道：

- 使用保守格式将 presentation 转换为文本。

## 重构步骤

1. 重新应用 Discord 发布修复：从基于 Carbon 的 UI 中拆分 `ui-colors.ts`，并从 `extensions/discord/src/channel.ts` 中移除 `DiscordUiContainer`。
2. 向 `ReplyPayload`、出站负载规范化、投递摘要和 hook 负载中添加 `presentation` 和 `delivery`。
3. 在一个窄范围的 SDK / 运行时子路径中添加 `MessagePresentation` schema 和解析辅助函数。
4. 用语义化呈现能力替换消息能力中的 `buttons`、`cards`、`components` 和 `blocks`。
5. 为呈现渲染和投递置顶添加运行时出站适配器钩子。
6. 用 `buildCrossContextPresentation` 替换跨上下文组件构建逻辑。
7. 删除 `src/infra/outbound/channel-adapters.ts`，并从渠道插件类型中移除 `buildCrossContextComponents`。
8. 修改 `maybeApplyCrossContextMarker`，使其附加 `presentation` 而不是原生参数。
9. 更新插件分发发送路径，使其只消费语义化呈现和投递元数据。
10. 移除智能体和 CLI 的原生负载参数：`components`、`blocks`、`buttons` 和 `card`。
11. 移除创建原生 message-tool schema 的 SDK 辅助函数，替换为 presentation schema 辅助函数。
12. 从 `channelData` 中移除 UI / 原生封装；在审查每个剩余字段前，仅保留传输元数据。
13. 迁移 Discord、Slack、Telegram、Mattermost、Microsoft Teams、Feishu 和 LINE 渲染器。
14. 更新 message CLI、渠道页面、插件 SDK 和能力扩展手册文档。
15. 对 Discord 和受影响的渠道入口点运行导入扇出分析。

在本次重构中，第 1-11 步以及第 13-14 步已为共享智能体、CLI、插件能力和出站适配器契约完成实现。第 12 步仍是针对提供商私有 `channelData` 传输封装的更深层内部清理工作。第 15 步仍属于后续验证项，前提是我们希望获得超出类型 / 测试门禁之外的量化导入扇出数据。

## 测试

添加或更新：

- Presentation 规范化测试。
- 针对不受支持块的 presentation 自动降级测试。
- 针对插件分发和核心投递路径的跨上下文标记测试。
- 针对 Discord、Slack、Telegram、Mattermost、Microsoft Teams、Feishu、LINE 和文本回退的渠道渲染矩阵测试。
- 证明原生字段已移除的消息工具 schema 测试。
- 证明原生标志已移除的 CLI 测试。
- 覆盖 Carbon 的 Discord 入口点导入懒加载回归测试。
- 覆盖 Telegram 和通用回退的投递置顶测试。

## 未决问题

- `delivery.pin` 是否应在第一阶段就为 Discord、Slack、Microsoft Teams 和 Feishu 实现，还是先只做 Telegram？
- `delivery` 最终是否应吸收现有字段，例如 `replyToId`、`replyToCurrent`、`silent` 和 `audioAsVoice`，还是继续只聚焦于发送后的行为？
- presentation 是否应直接支持图片或文件引用，还是媒体暂时继续与 UI 布局分离？

## 相关内容

- [渠道概览](/zh-CN/channels)
- [消息呈现](/zh-CN/plugins/message-presentation)
