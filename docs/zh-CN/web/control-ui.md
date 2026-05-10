---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你想要无需 SSH 隧道即可访问 Tailnet
sidebarTitle: Control UI
summary: 基于浏览器的 Gateway 网关控制 UI（聊天、节点、配置）
title: 控制界面
x-i18n:
    generated_at: "2026-05-10T19:53:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb158d1b6b92b7097fe7ba8d61aee5d6c6e67a8d45fc2cb2514c555ef3e52d81
    source_path: web/control-ui.md
    workflow: 16
---

Control UI 是一个小型 **Vite + Lit** 单页应用，由 Gateway 网关提供服务：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接与 Gateway 网关 WebSocket** 通信。

## 快速打开（本地）

如果 Gateway 网关运行在同一台计算机上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

身份验证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用受信任代理身份标头

仪表板设置面板会为当前浏览器标签页会话和所选 Gateway 网关 URL 保留一个令牌；密码不会持久保存。新手引导通常会在首次连接时为共享密钥身份验证生成 Gateway 网关令牌，但当 `gateway.auth.mode` 为 `"password"` 时，密码身份验证也可用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关通常需要**一次性配对批准**。这是一项安全措施，用于防止未经授权的访问。

**你会看到：**“已断开连接 (1008)：需要配对”

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

如果浏览器使用变更后的身份验证详情（角色/作用域/公钥）重试配对，之前的待处理请求会被取代，并创建新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已经配对，而你将它从读取访问改为写入/管理员访问，这会被视为批准升级，而不是静默重新连接。OpenClaw 会保持旧批准有效，阻止权限更广的重新连接，并要求你显式批准新的作用域集合。

批准后，设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则无需重新批准。请参阅 [设备 CLI](/zh-CN/cli/devices) 了解令牌轮换和撤销。

<Note>
- 直接 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动批准。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份验证通过，并且浏览器提供其设备身份时，Tailscale Serve 可以为 Control UI 操作者会话跳过配对往返。
- 直接 Tailnet 绑定、LAN 浏览器连接，以及没有设备身份的浏览器配置文件仍需要显式批准。
- 每个浏览器配置文件都会生成一个唯一设备 ID，因此切换浏览器或清除浏览器数据将需要重新配对。

</Note>

## 个人身份（浏览器本地）

Control UI 支持按浏览器设置的个人身份（显示名称和头像），并将其附加到外发消息上，用于在共享会话中标注归属。它保存在浏览器存储中，作用域限定为当前浏览器配置文件，不会同步到其他设备，也不会在服务端持久保存，除了你实际发送的消息上正常的转录作者元数据。清除站点数据或切换浏览器会将其重置为空。

同样的浏览器本地模式也适用于助手头像覆盖。上传的助手头像只会在本地浏览器中覆盖 Gateway 网关解析出的身份，并且绝不会通过 `config.patch` 往返传输。共享的 `ui.assistant.avatar` 配置字段仍可供直接写入该字段的非 UI 客户端使用（例如脚本化 Gateway 网关或自定义仪表板）。

## 运行时配置端点

Control UI 会从 `/__openclaw/control-ui-config.json` 获取其运行时设置。该端点与其他 HTTP 表面一样受同一 Gateway 网关身份验证保护：未认证的浏览器无法获取它，成功获取需要已有有效的 Gateway 网关令牌/密码、Tailscale Serve 身份，或受信任代理身份。

## 语言支持

Control UI 可以在首次加载时根据你的浏览器区域设置本地化自身。要稍后覆盖它，请打开 **概览 -> Gateway 网关访问 -> 语言**。区域设置选择器位于 Gateway 网关访问卡片中，而不是外观下。

- 支持的区域设置：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英语翻译会在浏览器中延迟加载。
- 所选区域设置会保存在浏览器存储中，并在后续访问时复用。
- 缺失的翻译键会回退到英语。

文档翻译也会为同一组非英语区域设置生成，但文档站点内置的 Mintlify 语言选择器仅限于 Mintlify 接受的区域设置代码。泰语（`th`）和波斯语（`fa`）文档仍会在发布仓库中生成；在 Mintlify 支持这些代码之前，它们可能不会出现在该选择器中。

## 外观主题

外观面板保留了内置的 Claw、Knot 和 Dash 主题，另有一个浏览器本地 tweakcn 导入槽。要导入主题，请打开 [tweakcn editor](https://tweakcn.com/editor/theme)，选择或创建一个主题，点击**分享**，然后将复制的主题链接粘贴到外观中。导入器还接受 `https://tweakcn.com/r/themes/<id>` 注册表 URL、类似 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 的编辑器 URL、相对 `/themes/<id>` 路径、原始主题 ID，以及 `amethyst-haze` 等默认主题名称。

导入的主题只存储在当前浏览器配置文件中。它们不会写入 Gateway 网关配置，也不会跨设备同步。替换导入的主题会更新这个本地槽；如果当前选中了导入主题，清除它会将活动主题切回 Claw。

## 它目前能做什么

<AccordionGroup>
  <Accordion title="聊天和 Talk">
    - 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 聊天历史刷新会请求一个有界的近期窗口，并为每条消息设置文本上限，这样大型会话不会迫使浏览器在聊天变得可用前渲染完整转录负载。
    - 通过浏览器实时会话进行 Talk。OpenAI 使用直接 WebRTC，Google Live 使用通过 WebSocket 传输的受限一次性浏览器令牌，而仅后端实时语音插件使用 Gateway 网关中继传输。客户端拥有的提供商会话以 `talk.client.create` 开始；Gateway 网关中继会话以 `talk.session.create` 开始。中继会将提供商凭证保留在 Gateway 网关上，同时浏览器通过 `talk.session.appendAudio` 流式传输麦克风 PCM，并通过 `talk.client.toolCall` 转发 `openclaw_agent_consult` 提供商工具调用，以便执行 Gateway 网关策略并使用配置的更大 OpenClaw 模型。
    - 在聊天中流式传输工具调用和实时工具输出卡片（智能体事件）。

  </Accordion>
  <Accordion title="渠道、实例、会话、梦境">
    - 渠道：内置渠道以及捆绑/外部插件渠道状态、二维码登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）。
    - 渠道探测刷新会在缓慢的提供商检查完成前保持上一份快照可见，并在探测或审计超出其 UI 预算时标记部分快照。
    - 实例：在线列表 + 刷新（`system-presence`）。
    - 会话：默认列出已配置智能体会话，从过时的未配置智能体会话键回退，并应用按会话的模型/thinking/fast/verbose/trace/reasoning 覆盖（`sessions.list`、`sessions.patch`）。
    - 梦境：Dreaming 状态、启用/禁用开关，以及 Dream Diary 阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、节点、exec 批准">
    - Cron 作业：列出/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）。
    - Skills：状态、启用/禁用、安装、API key 更新（`skills.*`）。
    - 节点：列表 + 能力（`node.list`）。
    - Exec 批准：编辑 Gateway 网关或节点 allowlist + `exec host=gateway/node` 的询问策略（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 通过验证应用 + 重启（`config.apply`），并唤醒上一个活动会话。
    - 写入包含 base-hash 保护，以防覆盖并发编辑。
    - 写入（`config.set`/`config.apply`/`config.patch`）会对提交的配置负载中的引用预检活动 SecretRef 解析；未解析的活动提交引用会在写入前被拒绝。
    - Schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及可用时的插件 + 渠道 schema）；只有当快照具备安全的原始往返能力时，才可使用 Raw JSON 编辑器。
    - 如果快照无法安全往返原始文本，Control UI 会为该快照强制使用表单模式，并禁用 Raw 模式。
    - Raw JSON 编辑器的“重置为已保存”会保留原始编写的形状（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此在快照可以安全往返时，外部编辑会在重置后保留下来。
    - 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防意外发生对象到字符串的损坏。

  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）。
    - 事件日志包括 Control UI 刷新/RPC 耗时、较慢的聊天/配置渲染耗时，以及当浏览器暴露相关 PerformanceObserver 条目类型时的长动画帧或长任务浏览器响应性条目。
    - 日志：Gateway 网关文件日志的实时 tail，支持过滤/导出（`logs.tail`）。
    - 更新：运行 package/git 更新 + 重启（`update.run`）并生成重启报告，然后在重新连接后轮询 `update.status`，以验证正在运行的 Gateway 网关版本。

  </Accordion>
  <Accordion title="Cron 作业面板说明">
    - 对于隔离作业，交付默认会发布摘要。如果你想要仅内部运行，可以切换为无。
    - 选择发布时会显示渠道/目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
    - 对于主会话作业，可使用 webhook 和无交付模式。
    - 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确/错峰选项、智能体模型/thinking 覆盖，以及尽力交付开关。
    - 表单验证以内联方式显示字段级错误；无效值会禁用保存按钮，直到修复。
    - 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，webhook 会在没有身份验证标头的情况下发送。
    - 已弃用的回退：存储的旧版作业如果带有 `notify: true`，在迁移前仍可使用 `cron.webhook`。

  </Accordion>
</AccordionGroup>

## 聊天行为

<AccordionGroup>
  <Accordion title="发送和历史语义">
    - `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，响应则通过 `chat` 事件进行流式传输。
    - 聊天上传接受图片以及非视频文件。图片保留原生图片路径；其他文件会存储为托管媒体，并在历史中显示为附件链接。
    - 使用相同的 `idempotencyKey` 重新发送时，运行期间会返回 `{ status: "in_flight" }`，完成后会返回 `{ status: "ok" }`。
    - 为了 UI 安全，`chat.history` 响应有大小限制。当转录条目过大时，Gateway 网关可能会截断长文本字段、省略较重的元数据块，并用占位符（`[chat.history omitted: message too large]`）替换超大的消息。
    - 助手/生成的图片会持久化为托管媒体引用，并通过经过认证的 Gateway 网关媒体 URL 返回，因此重新加载不依赖原始 base64 图片负载继续保留在聊天历史响应中。
    - 渲染 `chat.history` 时，Control UI 会从可见的助手文本中剥离仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），以及泄漏的 ASCII/全角模型控制 token，并省略可见文本全部只等于精确静默 token `NO_REPLY` / `no_reply` 或 Heartbeat 确认 token `HEARTBEAT_OK` 的助手条目。
    - 在活跃发送期间以及最终历史刷新期间，如果 `chat.history` 短暂返回较旧的快照，聊天视图会保持本地乐观用户/助手消息可见；当 Gateway 网关历史追上后，规范转录会替换这些本地消息。
    - 实时 `chat` 事件表示投递状态，而 `chat.history` 会从持久会话转录中重建。在工具最终事件之后，Control UI 会重新加载历史，并且只合并一小段乐观尾部；转录边界记录在 [WebChat](/zh-CN/web/webchat) 中。
    - `chat.inject` 会向会话转录追加一条助手备注，并广播一个 `chat` 事件用于仅 UI 更新（没有 agent 运行，也没有 channel 投递）。
    - 聊天标题栏会先显示 agent 过滤器，再显示会话选择器，并且会话选择器会按所选 agent 限定范围。切换 agent 时，只显示与该 agent 关联的会话；如果该 agent 尚无已保存的仪表板会话，则回退到该 agent 的主会话。
    - 在桌面宽度下，聊天控件保持在一行紧凑布局中，并在向下滚动转录时折叠；向上滚动、返回顶部或到达底部会恢复这些控件。
    - 连续重复的纯文本消息会渲染为一个带计数徽章的气泡。携带图片、附件、工具输出或画布预览的消息不会折叠。
    - 聊天标题栏中的模型和思考选择器会通过 `sessions.patch` 立即修补活跃会话；它们是持久的会话级覆盖项，而不是仅限单轮的发送选项。
    - 如果你在同一会话的模型选择器更改仍在保存时发送消息，编辑器会先等待该会话补丁完成，再调用 `chat.send`，以便发送使用所选模型。
    - 在 Control UI 中输入 `/new` 会创建并切换到与 New Chat 相同的全新仪表板会话，除非配置了 `session.dmScope: "main"` 且当前父级是该 agent 的主会话；在这种情况下，它会原地重置主会话。输入 `/reset` 会保留 Gateway 网关对当前会话的显式原地重置。
    - 聊天模型选择器会请求 Gateway 网关配置的模型视图。如果存在 `agents.defaults.models`，该允许列表会驱动选择器，包括让提供商作用域目录保持动态的 `provider/*` 条目。否则，选择器会显示显式的 `models.providers.*.models` 条目以及具备可用认证的提供商。完整目录仍可通过调试 `models.list` RPC 并使用 `view: "all"` 获取。
    - 当新的 Gateway 网关会话用量报告包含当前上下文 token 时，聊天编辑器区域会显示一个紧凑的上下文用量指示器。它会在上下文压力较高时切换为警告样式，并在达到建议压缩级别时显示一个紧凑按钮，用于运行正常的会话压缩路径。过期的 token 快照会隐藏，直到 Gateway 网关再次报告新的用量。

  </Accordion>
  <Accordion title="Talk 模式（浏览器实时）">
    Talk 模式使用已注册的实时语音提供商。配置 OpenAI 时，使用 `talk.realtime.provider: "openai"`，并加上 `talk.realtime.providers.openai.apiKey`、`OPENAI_API_KEY` 或 `openai-codex` OAuth 配置文件之一；配置 Google 时，使用 `talk.realtime.provider: "google"`，并加上 `talk.realtime.providers.google.apiKey`。浏览器永远不会收到标准提供商 API key。OpenAI 会收到用于 WebRTC 的临时 Realtime 客户端密钥。Google Live 会收到用于浏览器 WebSocket 会话的一次性受限 Live API 认证 token，其中指令和工具声明由 Gateway 网关锁定到 token 中。只暴露后端实时桥接的提供商会通过 Gateway 网关中继传输运行，因此凭证和供应商 socket 会留在服务器端，而浏览器音频通过经过认证的 Gateway 网关 RPC 移动。Realtime 会话提示词由 Gateway 网关组装；`talk.client.create` 不接受调用方提供的指令覆盖。

    Chat 编辑器在 Talk 开始/停止按钮旁包含一个 Talk 选项按钮。这些选项适用于下一个 Talk 会话，并可覆盖提供商、传输、模型、语音、推理强度、VAD 阈值、静音时长和前缀填充。当某个选项为空时，Gateway 网关会在可用时使用已配置的默认值，否则使用提供商默认值。选择 Gateway 网关中继会强制使用后端中继路径；选择 WebRTC 会保持会话由客户端拥有，如果提供商无法创建浏览器会话，则会失败，而不是静默回退到中继。

    在 Chat 编辑器中，Talk 控件是麦克风听写按钮旁的波形按钮。Talk 启动时，编辑器状态行会先显示 `Connecting Talk...`，随后在音频已连接时显示 `Talk live`，或在实时工具调用通过 `talk.client.toolCall` 咨询已配置的更大模型时显示 `Asking OpenClaw...`。

    维护者实时冒烟测试：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 会验证 OpenAI 后端 WebSocket 桥接、OpenAI 浏览器 WebRTC SDP 交换、Google Live 受限 token 浏览器 WebSocket 设置，以及使用模拟麦克风媒体的 Gateway 网关中继浏览器适配器。该命令只打印提供商状态，不记录密钥。

  </Accordion>
  <Accordion title="停止和中止">
    - 点击 **Stop**（调用 `chat.abort`）。
    - 当某个运行处于活跃状态时，普通后续消息会排队。点击已排队消息上的 **Steer**，可将该后续消息注入正在运行的轮次中。
    - 输入 `/stop`（或独立的中止短语，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以带外中止。
    - `chat.abort` 支持使用 `{ sessionKey }`（无 `runId`）来中止该会话的所有活跃运行。

  </Accordion>
  <Accordion title="中止部分内容保留">
    - 当某次运行被中止时，部分助手文本仍可显示在 UI 中。
    - 当存在已缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到转录历史中。
    - 持久化条目包含中止元数据，因此转录消费者可以区分中止部分内容与正常完成输出。

  </Accordion>
</AccordionGroup>

## PWA 安装和 Web Push

Control UI 随附 `manifest.webmanifest` 和 service worker，因此现代浏览器可以将其安装为独立 PWA。Web Push 允许 Gateway 网关通过通知唤醒已安装的 PWA，即使标签页或浏览器窗口未打开。

| 表面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 清单。浏览器在它可访问后会提供“安装应用”。                    |
| `ui/public/sw.js`                                     | 处理 `push` 事件和通知点击的 service worker。                      |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下）    | 自动生成的 VAPID 密钥对，用于签名 Web Push 负载。                  |
| `push/web-push-subscriptions.json`                    | 持久化的浏览器订阅端点。                                           |

当你想固定密钥时（用于多主机部署、密钥轮换或测试），可以通过 Gateway 网关进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认为 `mailto:openclaw@localhost`）

Control UI 使用这些受作用域限制的 Gateway 网关方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` — 获取活跃的 VAPID 公钥。
- `push.web.subscribe` — 注册一个 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已注册的端点。
- `push.web.test` — 向调用方的订阅发送测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（有关中继支持的推送，请参阅[配置](/zh-CN/gateway/configuration)）以及现有的 `push.test` 方法，后者面向原生移动端配对。
</Note>

## 托管嵌入

助手消息可以使用 `[embed ...]` 短代码内联渲染托管的 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    禁用托管嵌入内的脚本执行。
  </Tab>
  <Tab title="scripts（默认）">
    允许交互式嵌入，同时保持源隔离；这是默认设置，通常足以支持自包含的浏览器游戏/小组件。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上添加 `allow-same-origin`，用于有意需要更强权限的同站文档。
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
只有在嵌入文档确实需要同源行为时，才使用 `trusted`。对于大多数 agent 生成的游戏和交互式画布，`scripts` 是更安全的选择。
</Warning>

默认情况下，绝对外部 `http(s)` 嵌入 URL 仍会被阻止。如果你确实希望 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天消息宽度

分组聊天消息使用易读的默认最大宽度。宽屏显示器部署可以通过设置 `gateway.controlUi.chatMessageMaxWidth` 来覆盖它，而无需修补内置 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

该值会在到达浏览器之前进行验证。支持的值包括普通长度和百分比，例如 `960px` 或 `82%`，以及受约束的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 宽度表达式。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="集成式 Tailscale Serve（首选）">
    将 Gateway 网关 保持在 loopback 上，并让 Tailscale Serve 通过 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开：

    - `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行身份验证。OpenClaw 会通过 `tailscale whois` 解析 `x-forwarded-for` 地址，并将其与该标头匹配来验证身份；只有当请求通过 local loopback 命中并带有 Tailscale 的 `x-forwarded-*` 标头时，才会接受这些身份。对于带有浏览器设备身份的 Control UI 操作者会话，这条已验证的 Serve 路径还会跳过设备配对往返；无设备浏览器和节点角色连接仍会遵循正常的设备检查。如果你希望即使对 Serve 流量也要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于该异步 Serve 身份路径，同一客户端 IP 和身份验证范围的失败身份验证尝试会在写入速率限制前被串行化。因此，来自同一浏览器的并发错误重试可能会让第二个请求显示 `retry later`，而不是两个普通不匹配并行竞争。

    <Warning>
    无令牌 Serve 身份验证假设 Gateway 网关主机可信。如果不可信的本地代码可能在该主机上运行，请要求令牌/密码身份验证。
    </Warning>

  </Tab>
  <Tab title="绑定到 tailnet + 令牌">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然后打开：

    - `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

    将匹配的共享密钥粘贴到 UI 设置中（作为 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你通过明文 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）打开仪表板，浏览器会在**非安全上下文**中运行，并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

已记录的例外：

- 通过 `gateway.controlUi.allowInsecureAuth=true` 提供的仅限 localhost 的不安全 HTTP 兼容性
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作者 Control UI 身份验证
- 紧急例外 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**建议修复：**使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 Gateway 网关主机上）

<AccordionGroup>
  <Accordion title="不安全身份验证开关行为">
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

    - 它允许 localhost Control UI 会话在非安全 HTTP 上下文中没有设备身份也继续进行。
    - 它不会绕过配对检查。
    - 它不会放宽远程（非 localhost）设备身份要求。

  </Accordion>
  <Accordion title="仅限紧急例外">
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
    `dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，这是严重的安全降级。紧急使用后请尽快恢复。
    </Warning>

  </Accordion>
  <Accordion title="trusted-proxy 注意事项">
    - 成功的 trusted-proxy 身份验证可以允许没有设备身份的**操作者** Control UI 会话进入。
    - 这**不会**扩展到节点角色 Control UI 会话。
    - 同主机 local loopback 反向代理仍不满足 trusted-proxy 身份验证；请参阅 [Trusted proxy auth](/zh-CN/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

有关 HTTPS 设置指导，请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 自带严格的 `img-src` 策略：只允许**同源**资源、`data:` URL，以及本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且不会发起网络获取。

这在实践中意味着：

- 在相对路径下提供的头像和图片（例如 `/avatars/<id>`）仍会渲染，包括 UI 获取并转换为本地 `blob:` URL 的已认证头像路由。
- 内联 `data:image/...` URL 仍会渲染（适用于协议内载荷）。
- Control UI 创建的本地 `blob:` URL 仍会渲染。
- 渠道元数据发出的远程头像 URL 会在 Control UI 的头像辅助逻辑中被剥离，并替换为内置徽标/徽章，因此被攻陷或恶意的渠道无法强制操作者浏览器获取任意远程图片。

你无需更改任何内容即可获得此行为，它始终启用且不可配置。

## 头像路由身份验证

配置 Gateway 网关身份验证后，Control UI 头像端点需要与 API 其他部分相同的 Gateway 网关令牌：

- `GET /avatar/<agentId>` 只向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 会在相同规则下返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与同级 assistant-media 路由一致）。这可防止头像路由在其他方面已受保护的主机上泄露 agent 身份。
- Control UI 本身在获取头像时会将 Gateway 网关令牌作为 bearer 标头转发，并使用已认证的 blob URL，因此图片仍会在仪表板中渲染。

如果你禁用 Gateway 网关身份验证（不建议在共享主机上这样做），头像路由也会变为未认证，与 Gateway 网关的其他部分保持一致。

## 助手媒体路由身份验证

配置 Gateway 网关身份验证后，助手本地媒体预览会使用两步路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要正常的 Control UI 操作者身份验证。浏览器在检查可用性时会将 Gateway 网关令牌作为 bearer 标头发送。
- 成功的元数据响应会包含一个短期 `mediaTicket`，其范围限定为该确切源路径。
- 浏览器渲染的图片、音频、视频和文档 URL 使用 `mediaTicket=<ticket>`，而不是活动 Gateway 网关令牌或密码。该票据会很快过期，并且不能授权其他源。

这让普通媒体渲染能兼容浏览器原生媒体元素，同时不会把可复用的 Gateway 网关凭证放入可见媒体 URL 中。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对基路径（当你想要固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本地开发（独立开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试/测试：开发服务器 + 远程 Gateway 网关

Control UI 是静态文件；WebSocket 目标可配置，并且可以不同于 HTTP 来源。当你希望本地使用 Vite 开发服务器，而 Gateway 网关在其他地方运行时，这会很方便。

<Steps>
  <Step title="启动 UI 开发服务器">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="使用 gatewayUrl 打开">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    可选的一次性身份验证（如需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="备注">
    - `gatewayUrl` 在加载后存储到 localStorage，并从 URL 中移除。
    - 如果你通过 `gatewayUrl` 传入完整的 `ws://` 或 `wss://` 端点，请对 `gatewayUrl` 值进行 URL 编码，以便浏览器正确解析查询字符串。
    - 只要可能，`token` 就应通过 URL 片段（`#token=...`）传递。片段不会发送到服务器，这可避免请求日志和 Referer 泄露。旧版 `?token=` 查询参数仍会为了兼容性导入一次，但仅作为回退，并会在引导后立即剥离。
    - `password` 只保存在内存中。
    - 设置 `gatewayUrl` 后，UI 不会回退到配置或环境凭证。请显式提供 `token`（或 `password`）。缺少显式凭证是错误。
    - 当 Gateway 网关位于 TLS 后方时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
    - `gatewayUrl` 只在顶层窗口中接受（不接受嵌入式窗口），以防止点击劫持。
    - 非 loopback Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整来源）。这包括远程开发设置。
    - Gateway 网关启动时可能会根据有效运行时绑定和端口播种本地来源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但远程浏览器来源仍需要显式条目。
    - 除非是严格受控的本地测试，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允许任何浏览器来源，而不是“匹配我正在使用的任何主机”。
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

## 相关内容

- [仪表板](/zh-CN/web/dashboard) — Gateway 网关仪表板
- [健康检查](/zh-CN/gateway/health) — Gateway 网关健康监控
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
