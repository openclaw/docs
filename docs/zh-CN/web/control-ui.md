---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你想要无需 SSH 隧道的 Tailnet 访问
sidebarTitle: Control UI
summary: 基于浏览器的 Gateway 网关控制界面（聊天、节点、配置）
title: 控制界面
x-i18n:
    generated_at: "2026-05-11T20:36:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0033b2666fe76bd23d5585d05b39fdd33f8d15d4e7c16561b5cfd0e75b8d22e
    source_path: web/control-ui.md
    workflow: 16
---

Control UI 是由 Gateway 网关提供服务的一个小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接与 Gateway 网关 WebSocket** 通信。

## 快速打开（本地）

如果 Gateway 网关在同一台电脑上运行，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时的 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时的可信代理身份标头

仪表板设置面板会为当前浏览器标签页会话和所选 Gateway 网关 URL 保留一个令牌；密码不会被持久化。新手引导通常会在首次连接时为共享密钥认证生成一个 Gateway 网关令牌，但当 `gateway.auth.mode` 为 `"password"` 时，密码认证也可用。

## 设备配对（首次连接）

当你从新浏览器或设备连接到 Control UI 时，Gateway 网关通常会要求进行**一次性配对批准**。这是一项安全措施，用于防止未授权访问。

**你会看到：** “已断开连接 (1008)：需要配对”

<Steps>
  <Step title="列出待处理请求">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="按请求 ID 批准">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

如果浏览器使用已更改的认证详情（角色/作用域/公钥）重试配对，之前的待处理请求会被取代，并创建新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已经配对，而你将其从读取访问改为写入/admin 访问，这会被视为批准升级，而不是静默重连。OpenClaw 会保持旧批准处于活动状态，阻止更宽泛的重连，并要求你明确批准新的作用域集合。

批准后，该设备会被记住，不会要求重新批准，除非你用 `openclaw devices revoke --device <id> --role <role>` 撤销它。请参阅 [Devices CLI](/zh-CN/cli/devices) 了解令牌轮换和撤销。

<Note>
- 直接 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动批准。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份验证通过，并且浏览器提供其设备身份时，Tailscale Serve 可以为 Control UI 操作员会话跳过配对往返。
- 直接 Tailnet 绑定、LAN 浏览器连接，以及没有设备身份的浏览器配置文件仍需要明确批准。
- 每个浏览器配置文件都会生成唯一设备 ID，因此切换浏览器或清除浏览器数据将需要重新配对。

</Note>

## 个人身份（浏览器本地）

Control UI 支持按浏览器设置的个人身份（显示名称和头像），会附加到传出消息，用于在共享会话中归因。它存储在浏览器存储中，限定于当前浏览器配置文件，不会同步到其他设备，也不会在服务器端持久化，除了你实际发送的消息上正常的 transcript 作者元数据。清除站点数据或切换浏览器会将其重置为空。

同样的浏览器本地模式也适用于 assistant 头像覆盖。上传的 assistant 头像只会在本地浏览器中覆盖 Gateway 网关解析出的身份，并且绝不会通过 `config.patch` 往返传输。共享的 `ui.assistant.avatar` 配置字段仍可供直接写入该字段的非 UI 客户端使用（例如脚本化 Gateway 网关或自定义仪表板）。

## 运行时配置端点

Control UI 会从 `/__openclaw/control-ui-config.json` 获取其运行时设置。该端点与 HTTP 表面的其余部分一样，受同一 Gateway 网关认证保护：未认证的浏览器无法获取它，成功获取需要已有效的 Gateway 网关令牌/密码、Tailscale Serve 身份，或可信代理身份。

## 语言支持

Control UI 可以在首次加载时根据你的浏览器区域设置进行本地化。若稍后要覆盖它，请打开 **Overview -> Gateway Access -> Language**。区域设置选择器位于 Gateway Access 卡片中，而不是 Appearance 下。

- 支持的区域设置：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英语翻译会在浏览器中延迟加载。
- 所选区域设置会保存到浏览器存储中，并在未来访问时复用。
- 缺失的翻译键会回退到英语。

文档翻译会为同一组非英语区域设置生成，但文档站点内置的 Mintlify 语言选择器受限于 Mintlify 接受的区域设置代码。泰语（`th`）和波斯语（`fa`）文档仍会在发布仓库中生成；在 Mintlify 支持这些代码之前，它们可能不会出现在该选择器中。

## 外观主题

Appearance 面板保留内置的 Claw、Knot 和 Dash 主题，另加一个浏览器本地 tweakcn 导入槽。要导入主题，请打开 [tweakcn 编辑器](https://tweakcn.com/editor/theme)，选择或创建一个主题，点击 **Share**，然后将复制的主题链接粘贴到 Appearance。导入器还接受 `https://tweakcn.com/r/themes/<id>` 注册表 URL、类似 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 的编辑器 URL、相对 `/themes/<id>` 路径、原始主题 ID，以及默认主题名称（例如 `amethyst-haze`）。

导入的主题只存储在当前浏览器配置文件中。它们不会写入 Gateway 网关配置，也不会跨设备同步。替换导入的主题会更新这一个本地槽；如果已选中导入主题，清除它会将活动主题切回 Claw。

## 它现在能做什么

<AccordionGroup>
  <Accordion title="聊天和 Talk">
    - 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 聊天历史刷新会请求一个有界的近期窗口，并对每条消息设置文本上限，这样大型会话不会在聊天可用前强制浏览器渲染完整 transcript 负载。
    - 通过浏览器实时会话进行 Talk。OpenAI 使用直接 WebRTC，Google Live 通过 WebSocket 使用受限的一次性浏览器令牌，而仅后端实时语音插件使用 Gateway 网关中继传输。客户端拥有的提供商会话以 `talk.client.create` 开始；Gateway 网关中继会话以 `talk.session.create` 开始。中继会将提供商凭证保留在 Gateway 网关上，同时浏览器通过 `talk.session.appendAudio` 流式传输麦克风 PCM，并通过 `talk.client.toolCall` 转发 `openclaw_agent_consult` 提供商工具调用，以应用 Gateway 网关策略和更大的已配置 OpenClaw 模型。
    - 在聊天中流式传输工具调用和实时工具输出卡片（智能体事件）。

  </Accordion>
  <Accordion title="渠道、实例、会话、dreams">
    - 渠道：内置渠道加上内置/外部插件渠道的状态、二维码登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）。
    - 渠道探测刷新会在较慢的提供商检查完成期间保持上一份快照可见；当探测或审核超过其 UI 预算时，会标记部分快照。
    - 实例：在线状态列表 + 刷新（`system-presence`）。
    - 会话：默认列出已配置智能体会话，从陈旧的未配置智能体会话键回退，并应用按会话的模型/thinking/fast/verbose/trace/reasoning 覆盖（`sessions.list`、`sessions.patch`）。
    - Dreams：Dreaming 状态、启用/禁用开关，以及 Dream Diary 阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、节点、exec 批准">
    - Cron 作业：列出/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）。
    - Skills：状态、启用/禁用、安装、API key 更新（`skills.*`）。
    - 节点：列表 + 能力（`node.list`）。
    - Exec 批准：编辑 Gateway 网关或节点 allowlist + `exec host=gateway/node` 的询问策略（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 通过验证应用 + 重启（`config.apply`），并唤醒最后一个活动会话。
    - 写入包含 base-hash 防护，以防覆盖并发编辑。
    - 写入（`config.set`/`config.apply`/`config.patch`）会对提交的配置负载中的引用预检活动 SecretRef 解析；未解析的活动提交引用会在写入前被拒绝。
    - Schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及可用时的插件 + 渠道 schema）；Raw JSON 编辑器只有在快照具备安全原始往返能力时才可用。
    - 如果快照无法安全往返原始文本，Control UI 会强制使用 Form 模式，并对该快照禁用 Raw 模式。
    - Raw JSON 编辑器的 “Reset to saved” 会保留原始作者形态（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照可以安全往返时，外部编辑能在重置后保留。
    - 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防意外发生对象到字符串的破坏性转换。

  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）。
    - 事件日志包含 Control UI 刷新/RPC 耗时、慢聊天/配置渲染耗时，以及当浏览器公开相关 PerformanceObserver 条目类型时记录的长动画帧或长任务浏览器响应性条目。
    - 日志：带过滤/导出的 Gateway 网关文件日志实时 tail（`logs.tail`）。
    - 更新：运行 package/git 更新 + 重启（`update.run`）并生成重启报告，然后在重新连接后轮询 `update.status` 以验证正在运行的 Gateway 网关版本。

  </Accordion>
  <Accordion title="Cron 作业面板说明">
    - 对于隔离作业，投递默认会公告摘要。如果你想要仅内部运行，可以切换为 none。
    - 当选择公告时，会显示渠道/目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
    - 对于主会话作业，webhook 和 none 投递模式可用。
    - 高级编辑控件包括运行后删除、清除智能体覆盖、cron exact/stagger 选项、智能体模型/thinking 覆盖，以及尽力而为投递开关。
    - 表单验证以内联方式显示字段级错误；无效值会禁用保存按钮，直到修复。
    - 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，webhook 发送时不会带认证标头。
    - 已弃用的回退：存储的旧作业如果带有 `notify: true`，在迁移前仍可使用 `cron.webhook`。

  </Accordion>
</AccordionGroup>

## 聊天行为

<AccordionGroup>
  <Accordion title="发送和历史语义">
    - `chat.send` 是**非阻塞**的：它会立即以 `{ runId, status: "started" }` 确认，响应则通过 `chat` 事件流式传输。
    - Chat 上传接受图片以及非视频文件。图片保留原生图片路径；其他文件会存储为托管媒体，并在历史记录中显示为附件链接。
    - 使用相同的 `idempotencyKey` 重新发送时，运行期间会返回 `{ status: "in_flight" }`，完成后会返回 `{ status: "ok" }`。
    - `chat.history` 响应会限制大小以保证 UI 安全。当转录条目过大时，Gateway 网关可能会截断长文本字段，省略较重的元数据块，并用占位符（`[chat.history omitted: message too large]`）替换过大的消息。
    - 助手/生成的图片会持久化为托管媒体引用，并通过经过认证的 Gateway 网关媒体 URL 返回，因此重新加载不依赖原始 base64 图片载荷继续保留在聊天历史响应中。
    - 渲染 `chat.history` 时，Control UI 会从可见助手文本中剥离仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），以及泄漏的 ASCII/全角模型控制令牌，并省略其全部可见文本仅为精确静默令牌 `NO_REPLY` / `no_reply` 或 Heartbeat 确认令牌 `HEARTBEAT_OK` 的助手条目。
    - 在活跃发送期间以及最终历史刷新期间，如果 `chat.history` 短暂返回较旧的快照，聊天视图会继续显示本地乐观用户/助手消息；一旦 Gateway 网关历史追上，规范转录会替换这些本地消息。
    - 实时 `chat` 事件表示投递状态，而 `chat.history` 是从持久会话转录重建的。工具最终事件之后，Control UI 会重新加载历史，并只合并一小段乐观尾部；转录边界记录在 [WebChat](/zh-CN/web/webchat) 中。
    - `chat.inject` 会向会话转录追加一条助手注记，并广播一个 `chat` 事件用于仅 UI 更新（无 agent 运行，无 channel 投递）。
    - 聊天标题会先显示 agent 筛选器，再显示会话选择器，且会话选择器受所选 agent 限定。切换 agent 时，只显示与该 agent 绑定的会话；如果它还没有保存的仪表板会话，则回退到该 agent 的主会话。
    - 在桌面宽度下，聊天控件会保持在一行紧凑排列，并在向下滚动转录时收起；向上滚动、回到顶部或到达底部时会恢复控件。
    - 连续重复的纯文本消息会渲染为一个气泡并带有计数徽章。携带图片、附件、工具输出或画布预览的消息不会被折叠。
    - 聊天标题中的模型和思考选择器会通过 `sessions.patch` 立即修补活跃会话；它们是持久会话覆盖项，而不是仅限单轮的发送选项。
    - 如果你在同一会话的模型选择器更改仍在保存时发送消息，编辑器会先等待该会话补丁完成，再调用 `chat.send`，这样发送会使用所选模型。
    - 在 Control UI 中输入 `/new` 会创建并切换到与 New Chat 相同的全新仪表板会话，但当配置了 `session.dmScope: "main"` 且当前父级是该 agent 的主会话时除外；在这种情况下，它会就地重置主会话。输入 `/reset` 会保留 Gateway 网关对当前会话的显式就地重置。
    - 聊天模型选择器会请求 Gateway 网关配置的模型视图。如果存在 `agents.defaults.models`，该允许列表会驱动选择器，包括保持提供商范围目录动态的 `provider/*` 条目。否则，选择器会显示显式的 `models.providers.*.models` 条目以及具有可用认证的提供商。完整目录仍可通过调试 `models.list` RPC 并使用 `view: "all"` 获得。
    - 当新的 Gateway 网关会话用量报告包含当前上下文令牌时，聊天编辑器区域会显示一个紧凑的上下文用量指示器。它会在上下文压力较高时切换为警告样式，并在达到建议压缩级别时显示一个紧凑按钮，用于运行常规会话压缩路径。过期的令牌快照会隐藏，直到 Gateway 网关再次报告新的用量。

  </Accordion>
  <Accordion title="Talk 模式（浏览器实时）">
    Talk 模式使用已注册的实时语音提供商。配置 OpenAI 时，使用 `talk.realtime.provider: "openai"` 加上 `talk.realtime.providers.openai.apiKey`、`OPENAI_API_KEY` 或 `openai-codex` OAuth 配置文件之一；配置 Google 时，使用 `talk.realtime.provider: "google"` 加上 `talk.realtime.providers.google.apiKey`。浏览器绝不会收到标准提供商 API key。OpenAI 会收到一个用于 WebRTC 的临时 Realtime 客户端密钥。Google Live 会收到一个一次性受限 Live API 认证令牌，用于浏览器 WebSocket 会话，其中指令和工具声明由 Gateway 网关锁定到令牌中。只暴露后端实时桥接的提供商会通过 Gateway 网关中继传输运行，因此凭证和供应商套接字保留在服务器端，而浏览器音频会通过经过认证的 Gateway 网关 RPC 传输。Realtime 会话提示词由 Gateway 网关组装；`talk.client.create` 不接受调用方提供的指令覆盖。

    Chat 编辑器在 Talk 开始/停止按钮旁包含一个 Talk 选项按钮。这些选项会应用于下一个 Talk 会话，并可覆盖提供商、传输、模型、语音、推理强度、VAD 阈值、静默时长和前缀填充。当某个选项为空时，Gateway 网关会在可用时使用配置的默认值，否则使用提供商默认值。选择 Gateway 网关中继会强制使用后端中继路径；选择 WebRTC 会保持会话由客户端拥有，如果提供商无法创建浏览器会话，则失败，而不是静默回退到中继。

    在 Chat 编辑器中，Talk 控件是麦克风听写按钮旁的波形按钮。Talk 启动时，编辑器状态行先显示 `Connecting Talk...`，音频连接后显示 `Talk live`，或者当实时工具调用正在通过 `talk.client.toolCall` 咨询配置的更大模型时显示 `Asking OpenClaw...`。

    维护者实时冒烟测试：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 会验证 OpenAI 后端 WebSocket 桥接、OpenAI 浏览器 WebRTC SDP 交换、Google Live 受限令牌浏览器 WebSocket 设置，以及带有模拟麦克风媒体的 Gateway 网关中继浏览器适配器。该命令只打印提供商状态，不记录密钥。

  </Accordion>
  <Accordion title="停止和中止">
    - 点击 **Stop**（调用 `chat.abort`）。
    - 运行处于活跃状态时，普通后续消息会排队。点击排队消息上的 **Steer**，可将该后续消息注入正在运行的轮次。
    - 输入 `/stop`（或独立的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以带外中止。
    - `chat.abort` 支持 `{ sessionKey }`（无 `runId`）来中止该会话的所有活跃运行。

  </Accordion>
  <Accordion title="中止部分保留">
    - 当运行被中止时，部分助手文本仍可显示在 UI 中。
    - 当存在缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到转录历史中。
    - 持久化条目包含中止元数据，使转录消费者可以区分中止部分和正常完成输出。

  </Accordion>
</AccordionGroup>

## PWA 安装和 Web Push

Control UI 随附 `manifest.webmanifest` 和 service worker，因此现代浏览器可以将其安装为独立 PWA。Web Push 允许 Gateway 网关通过通知唤醒已安装的 PWA，即使标签页或浏览器窗口未打开。

| 表面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest。可访问后，浏览器会提供 “Install app”。               |
| `ui/public/sw.js`                                     | 处理 `push` 事件和通知点击的 service worker。                      |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下）    | 自动生成的 VAPID 密钥对，用于签名 Web Push 载荷。                  |
| `push/web-push-subscriptions.json`                    | 持久化的浏览器订阅端点。                                           |

当你想固定密钥（用于多主机部署、密钥轮换或测试）时，可在 Gateway 网关进程上通过环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认为 `mailto:openclaw@localhost`）

Control UI 使用这些受 scope 限制的 Gateway 网关方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` — 获取活跃的 VAPID 公钥。
- `push.web.subscribe` — 注册一个 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已注册的端点。
- `push.web.test` — 向调用方的订阅发送测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（参见 [配置](/zh-CN/gateway/configuration) 了解由中继支持的推送）以及现有的 `push.test` 方法，后者面向原生移动配对。
</Note>

## 托管嵌入

助手消息可以使用 `[embed ...]` shortcode 内联渲染托管 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    禁用托管嵌入中的脚本执行。
  </Tab>
  <Tab title="scripts（默认）">
    允许交互式嵌入，同时保持来源隔离；这是默认值，通常足够用于自包含的浏览器游戏/小组件。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上添加 `allow-same-origin`，用于有意需要更强权限的同站点文档。
  </Tab>
</Tabs>

示例：

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
仅当嵌入文档确实需要同源行为时才使用 `trusted`。对于大多数 agent 生成的游戏和交互式画布，`scripts` 是更安全的选择。
</Warning>

默认会继续阻止绝对外部 `http(s)` 嵌入 URL。如果你有意希望 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天消息宽度

分组聊天消息使用可读的默认最大宽度。宽屏部署可以通过设置 `gateway.controlUi.chatMessageMaxWidth` 来覆盖它，而无需修补内置 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

该值在到达浏览器之前会先被验证。支持的值包括普通长度和百分比，例如 `960px` 或 `82%`，以及受约束的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 宽度表达式。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="集成 Tailscale Serve（首选）">
    将 Gateway 网关保持在 loopback 上，并让 Tailscale Serve 通过 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开：

    - `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行身份验证。OpenClaw 会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该标头匹配来验证身份，并且只有当请求通过 local loopback 且带有 Tailscale 的 `x-forwarded-*` 标头命中时才接受这些请求。对于带有浏览器设备身份的 Control UI 操作员会话，这条已验证的 Serve 路径也会跳过设备配对往返；无设备浏览器和节点角色连接仍会遵循正常的设备检查。如果你希望即使对 Serve 流量也要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于这条异步 Serve 身份路径，来自同一客户端 IP 和身份验证作用域的失败身份验证尝试，会在写入速率限制之前被串行化。因此，来自同一浏览器的并发错误重试可能会在第二个请求上显示 `retry later`，而不是两个普通不匹配请求并行竞争。

    <Warning>
    无令牌 Serve 身份验证假定 Gateway 网关主机可信。如果不受信任的本地代码可能在该主机上运行，请要求令牌/密码身份验证。
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然后打开：

    - `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

    将匹配的共享密钥粘贴到 UI 设置中（作为 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你通过普通 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）打开仪表板，浏览器会在**非安全上下文**中运行并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

已记录的例外：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 的仅限 localhost 的不安全 HTTP 兼容性
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成操作员 Control UI 身份验证
- 紧急兜底 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复：**使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 Gateway 网关主机上）

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` 只是本地兼容性开关：

    - 它允许 localhost Control UI 会话在非安全 HTTP 上下文中无设备身份继续进行。
    - 它不会绕过配对检查。
    - 它不会放宽远程（非 localhost）设备身份要求。

  </Accordion>
  <Accordion title="Break-glass only">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，是严重的安全降级。紧急使用后请尽快恢复。
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - 成功的可信代理身份验证可以允许**操作员** Control UI 会话无设备身份进入。
    - 这**不会**扩展到节点角色 Control UI 会话。
    - 同主机 local loopback 反向代理仍然不满足可信代理身份验证；请参阅[可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

有关 HTTPS 设置指南，请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 附带严格的 `img-src` 策略：只允许**同源**资源、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且不会发起网络获取。

这在实践中意味着：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍会渲染，包括 UI 获取并转换为本地 `blob:` URL 的已认证头像路由。
- 内联 `data:image/...` URL 仍会渲染（适用于协议内载荷）。
- Control UI 创建的本地 `blob:` URL 仍会渲染。
- 渠道元数据发出的远程头像 URL 会在 Control UI 的头像助手中被剥离，并替换为内置徽标/徽章，因此被攻陷或恶意的渠道无法强制操作员浏览器发起任意远程图片获取。

你无需更改任何内容即可获得此行为，它始终启用且不可配置。

## 头像路由身份验证

配置 Gateway 网关身份验证后，Control UI 头像端点需要与 API 其余部分相同的 Gateway 网关令牌：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 按同一规则返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与同级 assistant-media 路由一致）。这可以防止头像路由在原本受保护的主机上泄漏智能体身份。
- Control UI 自身在获取头像时会将 Gateway 网关令牌作为 bearer 标头转发，并使用已认证的 blob URL，以便图片仍可在仪表板中渲染。

如果你禁用 Gateway 网关身份验证（不建议在共享主机上这样做），头像路由也会变为未认证，这与 Gateway 网关其余部分保持一致。

## 助手媒体路由身份验证

配置 Gateway 网关身份验证后，助手本地媒体预览会使用两步路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要正常的 Control UI 操作员身份验证。浏览器在检查可用性时会将 Gateway 网关令牌作为 bearer 标头发送。
- 成功的元数据响应包含一个短生命周期的 `mediaTicket`，其作用域限定为该确切源路径。
- 浏览器渲染的图片、音频、视频和文档 URL 使用 `mediaTicket=<ticket>`，而不是活动的 Gateway 网关令牌或密码。该票据会很快过期，并且无法授权其他源。

这让常规媒体渲染与浏览器原生媒体元素保持兼容，同时避免将可复用的 Gateway 网关凭证放入可见媒体 URL 中。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对基路径（当你需要固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 空白的 Control UI 页面

如果浏览器加载空白仪表板且 DevTools 没有显示有用错误，某个扩展或早期内容脚本可能阻止了 JavaScript 模块应用求值。静态页面包含一个纯 HTML 恢复面板，当 `<openclaw-app>` 在启动后未注册时会显示。

更改浏览器环境后，使用面板的**重试**操作，或在完成以下检查后手动重新加载：

- 禁用会注入所有页面的扩展，尤其是带有 `<all_urls>` 内容脚本的扩展。
- 尝试使用隐私窗口、干净的浏览器配置文件或其他浏览器。
- 保持 Gateway 网关运行，并在更改浏览器后验证同一个仪表板 URL。

## 调试/测试：开发服务器 + 远程 Gateway 网关

Control UI 是静态文件；WebSocket 目标可配置，并且可以不同于 HTTP 来源。当你希望在本地使用 Vite 开发服务器、而 Gateway 网关在其他地方运行时，这很方便。

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    可选的一次性身份验证（如果需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` 会在加载后存储到 localStorage，并从 URL 中移除。
    - 如果你通过 `gatewayUrl` 传入完整的 `ws://` 或 `wss://` 端点，请对 `gatewayUrl` 值进行 URL 编码，以便浏览器正确解析查询字符串。
    - 只要可能，`token` 应通过 URL 片段（`#token=...`）传入。片段不会发送到服务器，从而避免请求日志和 Referer 泄漏。旧版 `?token=` 查询参数仍会为兼容性导入一次，但只作为兜底，并且会在引导后立即剥离。
    - `password` 仅保存在内存中。
    - 设置 `gatewayUrl` 后，UI 不会回退到配置或环境凭证。请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
    - 当 Gateway 网关位于 TLS 后方时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
    - `gatewayUrl` 只在顶层窗口中接受（不接受嵌入式窗口），以防止点击劫持。
    - 非 local loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整来源）。这包括远程开发设置。
    - Gateway 网关启动可能会根据有效运行时绑定和端口填充本地来源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但远程浏览器来源仍需要显式条目。
    - 除非是严格受控的本地测试，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允许任意浏览器来源，而不是“匹配我正在使用的任何主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 标头来源回退模式，但这是危险的安全模式。

  </Accordion>
</AccordionGroup>

示例：

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

远程访问设置详情：[远程访问](/zh-CN/gateway/remote)。

## 相关

- [仪表板](/zh-CN/web/dashboard) — Gateway 网关仪表板
- [健康检查](/zh-CN/gateway/health) — Gateway 网关健康监控
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
