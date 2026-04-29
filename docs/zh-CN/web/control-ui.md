---
read_when:
    - 你想从浏览器操作 Gateway 网关
    - 你想要无需 SSH 隧道的 Tailnet 访问
sidebarTitle: Control UI
summary: 基于浏览器的 Gateway 网关控制界面（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-29T20:46:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d440cb80ae194f1994fde90e58b65e6194d2f4f87534696818e3f92b2969265d
    source_path: web/control-ui.md
    workflow: 16
---

控制 UI 是由 Gateway 网关提供服务的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接与 Gateway 网关 WebSocket** 通信。

## 快速打开（本地）

如果 Gateway 网关在同一台计算机上运行，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

认证信息会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时的 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时的 trusted-proxy 身份标头

仪表板设置面板会为当前浏览器标签页会话和所选 Gateway 网关 URL 保留一个令牌；密码不会持久保存。新手引导通常会在首次连接时为共享密钥认证生成 Gateway 网关令牌，但当 `gateway.auth.mode` 为 `"password"` 时，密码认证也可使用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到控制 UI 时，Gateway 网关通常需要**一次性配对批准**。这是一项安全措施，用于防止未经授权的访问。

**你会看到：** "disconnected (1008): pairing required"

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

如果浏览器使用更改后的认证详细信息（角色/作用域/公钥）重试配对，先前的待处理请求会被取代，并创建新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已配对，而你将其从读取访问改为写入/管理员访问，这会被视为批准升级，而不是静默重连。OpenClaw 会保持旧批准处于活动状态，阻止更广的重连，并要求你明确批准新的作用域集。

批准后，设备会被记住，并且不会要求重新批准，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它。有关令牌轮换和撤销，请参阅 [设备 CLI](/zh-CN/cli/devices)。

<Note>
- 直接的 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动批准。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份验证通过，并且浏览器提供其设备身份时，Tailscale Serve 可以为控制 UI 操作员会话跳过配对往返流程。
- 直接 Tailnet 绑定、局域网浏览器连接，以及没有设备身份的浏览器配置文件仍需要显式批准。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据都需要重新配对。

</Note>

## 个人身份（浏览器本地）

控制 UI 支持每个浏览器的个人身份（显示名称和头像），该身份会附加到外发消息，用于在共享会话中标识归属。它保存在浏览器存储中，作用域限定为当前浏览器配置文件，不会同步到其他设备，也不会在服务器端持久保存，除了你实际发送的消息上正常的会话记录作者元数据。清除站点数据或切换浏览器会将其重置为空。

同样的浏览器本地模式也适用于助手头像覆盖设置。上传的助手头像只会在本地浏览器中覆盖 Gateway 网关解析出的身份，绝不会通过 `config.patch` 往返传递。共享的 `ui.assistant.avatar` 配置字段仍可供直接写入该字段的非 UI 客户端使用，例如脚本化 Gateway 网关或自定义仪表板。

## 运行时配置端点

控制 UI 会从 `/__openclaw/control-ui-config.json` 获取其运行时设置。该端点受与其余 HTTP 接口面相同的 Gateway 网关认证保护：未认证的浏览器无法获取它，成功获取需要已有效的 Gateway 网关令牌/密码、Tailscale Serve 身份，或 trusted-proxy 身份。

## 语言支持

控制 UI 可以在首次加载时根据你的浏览器区域设置进行本地化。之后若要覆盖它，请打开 **概览 -> Gateway 网关访问 -> 语言**。区域设置选择器位于 Gateway 网关访问卡片中，而不是外观下。

- 支持的区域设置：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英语翻译会在浏览器中懒加载。
- 所选区域设置会保存在浏览器存储中，并在未来访问时复用。
- 缺失的翻译键会回退到英语。

## 外观主题

外观面板保留内置的 Claw、Knot 和 Dash 主题，以及一个浏览器本地的 tweakcn 导入槽位。要导入主题，请打开 [tweakcn 主题](https://tweakcn.com/themes)，选择或创建主题，点击 **共享**，然后将复制的主题链接粘贴到外观中。导入器还接受 `https://tweakcn.com/r/themes/<id>` 注册表 URL、类似 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 的编辑器 URL、相对 `/themes/<id>` 路径、原始主题 ID，以及 `amethyst-haze` 等默认主题名称。

导入的主题只存储在当前浏览器配置文件中。它们不会写入 Gateway 网关配置，也不会跨设备同步。替换导入的主题会更新这一个本地槽位；如果当前选中了导入的主题，清除它会将活动主题切回 Claw。

## 它目前能做什么

<AccordionGroup>
  <Accordion title="聊天和语音对话">
    - 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 通过浏览器实时会话进行语音对话。OpenAI 使用直接 WebRTC，Google Live 通过 WebSocket 使用受限的一次性浏览器令牌，而仅后端的实时语音插件使用 Gateway 网关中继传输。该中继将提供商凭证保留在 Gateway 网关上，同时浏览器通过 `talk.realtime.relay*` RPC 流式传输麦克风 PCM，并通过 `chat.send` 将 `openclaw_agent_consult` 工具调用发回配置的更大 OpenClaw 模型。
    - 在聊天中流式传输工具调用 + 实时工具输出卡片（智能体事件）。

  </Accordion>
  <Accordion title="渠道、实例、会话、梦境">
    - 渠道：内置渠道以及内置/外部插件渠道的状态、二维码登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）。
    - 实例：在线状态列表 + 刷新（`system-presence`）。
    - 会话：列表 + 按会话的模型/思考/快速/详细/跟踪/推理覆盖项（`sessions.list`、`sessions.patch`）。
    - 梦境：Dreaming 状态、启用/禁用开关，以及梦境日记阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="定时任务、Skills、节点、执行审批">
    - 定时任务：列出/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）。
    - Skills：状态、启用/禁用、安装、API 密钥更新（`skills.*`）。
    - 节点：列表 + 能力（`node.list`）。
    - 执行审批：编辑 Gateway 网关或节点允许列表 + `exec host=gateway/node` 的询问策略（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 在验证后应用 + 重启（`config.apply`），并唤醒最后一个活跃会话。
    - 写入包含 base-hash 防护，以防覆盖并发编辑。
    - 写入（`config.set`/`config.apply`/`config.patch`）会对提交的配置 payload 中的引用预检活跃 SecretRef 解析；提交的未解析活跃引用会在写入前被拒绝。
    - 架构 + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及可用时的插件 + 渠道架构）；仅当快照具备安全的原始文本往返能力时，原始 JSON 编辑器才可用。
    - 如果快照无法安全往返原始文本，控制 UI 会强制使用表单模式，并为该快照禁用原始模式。
    - 原始 JSON 编辑器“重置为已保存状态”会保留以原始形式编写的结构（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照可以安全往返时，外部编辑在重置后仍会保留。
    - 结构化 SecretRef 对象值会在表单文本输入中以只读方式呈现，以防意外发生对象转字符串损坏。

  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）。
    - 日志：实时跟踪 Gateway 网关文件日志，可筛选/导出（`logs.tail`）。
    - 更新：运行软件包/git 更新 + 重启（`update.run`），生成重启报告，然后在重连后轮询 `update.status`，以验证正在运行的 Gateway 网关版本。

  </Accordion>
  <Accordion title="定时任务面板说明">
    - 对于独立任务，投递默认会发布摘要。如果你需要仅内部运行，可以切换为无。
    - 选择发布时会显示渠道/目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
    - 对于主会话任务，可使用 webhook 和无投递模式。
    - 高级编辑控件包括运行后删除、清除智能体覆盖项、cron 精确/错峰选项、智能体模型/思考覆盖项以及尽力而为投递开关。
    - 表单验证以内联方式显示字段级错误；无效值会禁用保存按钮，直到修复为止。
    - 设置 `cron.webhookToken` 可发送专用 Bearer 令牌；如果省略，则 webhook 会在没有认证标头的情况下发送。
    - 已弃用的回退：已存储的旧版任务如果带有 `notify: true`，在迁移前仍可使用 `cron.webhook`。

  </Accordion>
</AccordionGroup>

## 聊天行为

<AccordionGroup>
  <Accordion title="发送与历史语义">
    - `chat.send` 是**非阻塞**的：它会立即以 `{ runId, status: "started" }` 确认，响应通过 `chat` 事件流式传输。
    - Chat 上传接受图片以及非视频文件。图片保留原生图片路径；其他文件会作为托管媒体存储，并在历史记录中显示为附件链接。
    - 使用相同的 `idempotencyKey` 重新发送时，运行期间会返回 `{ status: "in_flight" }`，完成后会返回 `{ status: "ok" }`。
    - `chat.history` 响应会限制大小，以保证 UI 安全。当转录条目过大时，Gateway 网关可能会截断长文本字段、省略较大的元数据块，并用占位符（`[chat.history omitted: message too large]`）替换超大的消息。
    - 助手/生成的图片会作为托管媒体引用持久化，并通过经过身份验证的 Gateway 网关媒体 URL 返回，因此重新加载不依赖原始 base64 图片载荷继续保留在聊天历史响应中。
    - `chat.history` 还会从可见的助手文本中剥离仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块）和泄漏的 ASCII/全角模型控制标记，并省略整个可见文本仅为精确静默标记 `NO_REPLY` / `no_reply` 的助手条目。
    - 在活跃发送期间以及最终历史刷新期间，如果 `chat.history` 短暂返回较旧的快照，聊天视图会继续显示本地乐观的用户/助手消息；当 Gateway 网关历史追上后，规范转录会替换这些本地消息。
    - `chat.inject` 会向会话转录追加一条助手备注，并广播一个 `chat` 事件用于仅 UI 更新（没有智能体运行，没有渠道投递）。
    - 聊天标题中的模型和 thinking 选择器会通过 `sessions.patch` 立即修补活跃会话；它们是持久化的会话覆盖项，而不是仅一次回合的发送选项。
    - 聊天模型选择器会请求 Gateway 网关配置的模型视图。如果存在 `agents.defaults.models`，该允许列表会驱动选择器。否则，选择器会显示显式的 `models.providers.*.models` 条目以及具备可用凭证的提供商。完整目录仍可通过调试用 `models.list` RPC 以 `view: "all"` 获取。
    - 当新的 Gateway 网关会话用量报告显示上下文压力较高时，聊天编写区域会显示上下文提示，并且在推荐的压缩等级下显示一个 compact 按钮，用于运行常规会话压缩路径。过期的令牌快照会被隐藏，直到 Gateway 网关再次报告新的用量。

  </Accordion>
  <Accordion title="Talk 模式（浏览器实时）">
    Talk 模式使用已注册的实时语音提供商。配置 OpenAI 时使用 `talk.provider: "openai"` 加 `talk.providers.openai.apiKey`，或配置 Google 时使用 `talk.provider: "google"` 加 `talk.providers.google.apiKey`；Voice Call 实时提供商配置仍可作为回退复用。浏览器永远不会收到标准提供商 API key。OpenAI 会收到用于 WebRTC 的临时 Realtime 客户端密钥。Google Live 会收到一个一次性、受约束的 Live API 认证令牌，用于浏览器 WebSocket 会话，并且指令和工具声明会由 Gateway 网关锁定到令牌中。仅暴露后端实时桥接的提供商会通过 Gateway 网关中继传输运行，因此凭据和供应商 socket 留在服务端，而浏览器音频则通过经过身份验证的 Gateway 网关 RPC 传输。Realtime 会话提示由 Gateway 网关组装；`talk.realtime.session` 不接受调用方提供的指令覆盖。

    在 Chat 编写器中，Talk 控件是麦克风听写按钮旁边的波形按钮。Talk 启动时，编写器状态行会显示 `Connecting Talk...`，音频连接后显示 `Talk live`，或在实时工具调用通过 `chat.send` 咨询已配置的更大模型时显示 `Asking OpenClaw...`。

    维护者 live smoke：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 会验证 OpenAI 浏览器 WebRTC SDP 交换、Google Live 受约束令牌的浏览器 WebSocket 设置，以及带假麦克风媒体的 Gateway 网关中继浏览器适配器。该命令只打印提供商 Status，不会记录密钥。

  </Accordion>
  <Accordion title="停止与中止">
    - 点击**停止**（调用 `chat.abort`）。
    - 运行处于活跃状态时，普通后续消息会排队。点击排队消息上的**引导**，即可把该后续消息注入正在运行的回合。
    - 输入 `/stop`（或独立的中止短语，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以带外中止。
    - `chat.abort` 支持 `{ sessionKey }`（无 `runId`），用于中止该会话的所有活跃运行。

  </Accordion>
  <Accordion title="中止部分内容保留">
    - 运行被中止时，部分助手文本仍可显示在 UI 中。
    - 当存在已缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到转录历史中。
    - 持久化条目包含中止元数据，因此转录消费者可以区分中止部分和正常完成输出。

  </Accordion>
</AccordionGroup>

## PWA 安装与 Web Push

Control UI 提供 `manifest.webmanifest` 和 service worker，因此现代浏览器可以将其安装为独立 PWA。即使标签页或浏览器窗口未打开，Web Push 也允许 Gateway 网关通过通知唤醒已安装的 PWA。

| 表面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 清单。浏览器在可访问后会提供“安装应用”。                      |
| `ui/public/sw.js`                                     | 处理 `push` 事件和通知点击的 service worker。                      |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下）    | 自动生成的 VAPID 密钥对，用于签名 Web Push 载荷。                  |
| `push/web-push-subscriptions.json`                    | 持久化的浏览器订阅端点。                                           |

当你希望固定密钥（用于多主机部署、密钥轮换或测试）时，可以通过 Gateway 网关进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认为 `mailto:openclaw@localhost`）

Control UI 使用这些受作用域限制的 Gateway 网关方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` — 获取活跃的 VAPID 公钥。
- `push.web.subscribe` — 注册一个 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已注册的端点。
- `push.web.test` — 向调用方的订阅发送测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（参见[配置](/zh-CN/gateway/configuration)了解基于中继的推送）以及现有的 `push.test` 方法，后者面向原生移动配对。
</Note>

## 托管嵌入

助手消息可以使用 `[embed ...]` 短代码内联渲染托管 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    在托管嵌入内禁用脚本执行。
  </Tab>
  <Tab title="scripts (default)">
    允许交互式嵌入，同时保持来源隔离；这是默认值，通常足以用于自包含的浏览器游戏/小组件。
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
仅当嵌入文档确实需要同源行为时才使用 `trusted`。对于大多数智能体生成的游戏和交互式画布，`scripts` 是更安全的选择。
</Warning>

默认情况下，绝对外部 `http(s)` 嵌入 URL 仍会被阻止。如果你有意希望 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="集成的 Tailscale Serve（首选）">
    将 Gateway 网关保留在 loopback 上，并让 Tailscale Serve 通过 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开：

    - `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行身份验证。OpenClaw 会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该标头匹配来验证身份，并且只在请求命中 loopback 且带有 Tailscale 的 `x-forwarded-*` 标头时接受这些身份。对于带浏览器设备身份的 Control UI 操作员会话，这条经过验证的 Serve 路径还会跳过设备配对往返；无设备浏览器和节点角色连接仍遵循常规设备检查。如果你希望即使是 Serve 流量也必须提供显式共享密钥凭据，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于该异步 Serve 身份路径，相同客户端 IP 和身份验证作用域的失败身份验证尝试会在写入速率限制前串行化。因此，来自同一浏览器的并发错误重试可能会在第二个请求上显示 `retry later`，而不是两个普通不匹配并行竞争。

    <Warning>
    无令牌 Serve 身份验证假设 gateway 主机是可信的。如果不受信任的本地代码可能在该主机上运行，请要求 token/password 身份验证。
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

## 不安全 HTTP

如果你通过普通 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）打开仪表板，浏览器会在**非安全上下文**中运行并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

已记录的例外情况：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 的仅 localhost 不安全 HTTP 兼容性
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成操作员 Control UI 身份验证
- 应急用 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复：**使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 gateway 主机上）

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

    - 它允许 localhost Control UI 会话在非安全 HTTP 上下文中无需设备身份即可继续。
    - 它不会绕过配对检查。
    - 它不会放宽远程（非 localhost）设备身份要求。

  </Accordion>
  <Accordion title="仅限应急">
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
    `dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，是严重的安全降级。应急使用后请尽快还原。
    </Warning>

  </Accordion>
  <Accordion title="可信代理说明">
    - 成功的可信代理认证可以允许没有设备身份的 **operator** Control UI 会话进入。
    - 这**不会**扩展到 node-role Control UI 会话。
    - 同主机 loopback 反向代理仍然不满足可信代理认证；请参阅[可信代理认证](/zh-CN/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

有关 HTTPS 设置指导，请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 附带严格的 `img-src` 策略：只允许**同源**资产、`data:` URL，以及本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且不会发起网络获取。

这在实践中意味着：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍会渲染，包括 UI 获取并转换为本地 `blob:` URL 的已认证头像路由。
- 内联 `data:image/...` URL 仍会渲染（适用于协议内载荷）。
- Control UI 创建的本地 `blob:` URL 仍会渲染。
- 渠道元数据发出的远程头像 URL 会在 Control UI 的头像辅助逻辑中被剥离，并替换为内置徽标/徽章，因此被攻陷或恶意的渠道无法强制操作员浏览器获取任意远程图片。

你无需更改任何内容即可获得此行为——它始终启用，且不可配置。

## 头像路由认证

配置 Gateway 网关认证后，Control UI 头像端点需要与 API 其他部分相同的 Gateway 网关令牌：

- `GET /avatar/<agentId>` 只向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 按相同规则返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与同级 assistant-media 路由一致）。这可防止头像路由在其他方面受保护的主机上泄露智能体身份。
- Control UI 本身在获取头像时会将 Gateway 网关令牌作为 bearer 标头转发，并使用已认证的 blob URL，因此图片仍会在仪表板中渲染。

如果你禁用 Gateway 网关认证（不建议在共享主机上这样做），头像路由也会与 Gateway 网关其余部分一样变为未认证。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对基路径（当你需要固定资产 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（单独的开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试/测试：开发服务器 + 远程 Gateway 网关

Control UI 是静态文件；WebSocket 目标可配置，并且可以不同于 HTTP 源。当你希望本地使用 Vite 开发服务器，而 Gateway 网关在其他位置运行时，这很有用。

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

    可选的一次性认证（如需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="说明">
    - `gatewayUrl` 会在加载后存储到 localStorage 中，并从 URL 中移除。
    - 如果你通过 `gatewayUrl` 传递完整的 `ws://` 或 `wss://` 端点，请对 `gatewayUrl` 值进行 URL 编码，以便浏览器正确解析查询字符串。
    - 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，这可以避免请求日志和 Referer 泄露。旧版 `?token=` 查询参数仍会为兼容性导入一次，但仅作为后备，并会在 bootstrap 后立即剥离。
    - `password` 只保存在内存中。
    - 设置 `gatewayUrl` 后，UI 不会回退到配置或环境凭据。请显式提供 `token`（或 `password`）。缺少显式凭据是错误。
    - 当 Gateway 网关位于 TLS 后面（Tailscale Serve、HTTPS 代理等）时，请使用 `wss://`。
    - `gatewayUrl` 只在顶层窗口中被接受（不允许嵌入），以防止点击劫持。
    - 非 loopback Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整源）。这包括远程开发设置。
    - Gateway 网关启动时可能会从有效运行时绑定和端口播种本地源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但远程浏览器源仍需要显式条目。
    - 除了严格受控的本地测试，不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允许任何浏览器源，而不是“匹配我正在使用的任意主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host-header 源后备模式，但这是一种危险的安全模式。

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
