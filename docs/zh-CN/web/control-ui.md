---
read_when:
    - 你想从浏览器操作 Gateway 网关
    - 你希望无需 SSH 隧道即可访问 Tailnet
sidebarTitle: Control UI
summary: 用于 Gateway 网关的基于浏览器的控制 UI（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-28T12:07:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ebfb9ade82821cfb1fbbb15cea95e23581856d8eafa87bd43883ebf699819c9
    source_path: web/control-ui.md
    workflow: 16
---

控制 UI 是一个小型 **Vite + Lit** 单页应用，由 Gateway 网关提供服务：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它在同一端口上**直接与 Gateway 网关 WebSocket** 通信。

## 快速打开（本地）

如果 Gateway 网关在同一台电脑上运行，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面无法加载，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时的 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时的 trusted-proxy 身份标头

仪表板设置面板会为当前浏览器标签页会话和选中的 Gateway 网关 URL 保存一个令牌；密码不会被持久化。新手引导通常会在首次连接时为共享密钥认证生成 Gateway 网关令牌，但当 `gateway.auth.mode` 为 `"password"` 时，密码认证也可用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到控制 UI 时，Gateway 网关通常会要求**一次性配对批准**。这是一项安全措施，用于防止未经授权的访问。

**你会看到：**“disconnected (1008): pairing required”

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

如果浏览器使用变更后的认证详情（角色/作用域/公钥）重试配对，之前的待处理请求会被取代，并创建新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已经配对，而你将它从读取访问改为写入/管理员访问，这会被视为批准升级，而不是静默重新连接。OpenClaw 会保留旧批准处于活动状态，阻止范围更广的重新连接，并要求你明确批准新的作用域集合。

批准后，设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则无需重新批准。有关令牌轮换和撤销，请参阅[设备 CLI](/zh-CN/cli/devices)。

<Note>
- 直接的 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动批准。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份验证通过且浏览器出示其设备身份时，Tailscale Serve 可以为控制 UI 操作员会话跳过配对往返。
- 直接 Tailnet 绑定、LAN 浏览器连接，以及没有设备身份的浏览器配置文件仍然需要明确批准。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据将需要重新配对。

</Note>

## 个人身份（浏览器本地）

控制 UI 支持按浏览器设置的个人身份（显示名称和头像），该身份会附加到传出消息上，用于在共享会话中归属发言。它存储在浏览器存储中，作用域限定于当前浏览器配置文件，不会同步到其他设备，也不会在服务端持久化，除了你实际发送的消息上正常的转录作者元数据。清除站点数据或切换浏览器会将其重置为空。

同样的浏览器本地模式也适用于助手头像覆盖。上传的助手头像只会在本地浏览器中覆盖 Gateway 网关解析出的身份，绝不会通过 `config.patch` 往返传输。共享的 `ui.assistant.avatar` 配置字段仍然可供直接写入该字段的非 UI 客户端使用（例如脚本化 Gateway 网关或自定义仪表板）。

## 运行时配置端点

控制 UI 会从 `/__openclaw/control-ui-config.json` 获取其运行时设置。该端点与 HTTP 表面的其余部分一样受同一 Gateway 网关认证保护：未经认证的浏览器无法获取它；成功获取需要已有有效的 Gateway 网关令牌/密码、Tailscale Serve 身份，或 trusted-proxy 身份。

## 语言支持

控制 UI 可以在首次加载时根据你的浏览器区域设置进行本地化。若要之后覆盖设置，请打开 **Overview -> Gateway Access -> Language**。区域设置选择器位于 Gateway Access 卡片中，而不是 Appearance 下。

- 支持的区域设置：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`tr`、`uk`、`id`、`pl`、`th`
- 非英语翻译会在浏览器中延迟加载。
- 选中的区域设置会保存在浏览器存储中，并在以后访问时复用。
- 缺失的翻译键会回退到英语。

## 外观主题

Appearance 面板保留内置的 Claw、Knot 和 Dash 主题，外加一个浏览器本地 tweakcn 导入槽。要导入主题，请打开 [tweakcn 主题](https://tweakcn.com/themes)，选择或创建一个主题，点击 **Share**，然后将复制的主题链接粘贴到 Appearance 中。导入器也接受 `https://tweakcn.com/r/themes/<id>` 注册表 URL、类似 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 的编辑器 URL、相对 `/themes/<id>` 路径、原始主题 ID，以及 `amethyst-haze` 等默认主题名称。

导入的主题只会存储在当前浏览器配置文件中。它们不会写入 Gateway 网关配置，也不会跨设备同步。替换导入的主题会更新这一个本地槽；清除它会在导入主题已被选中时将活动主题切回 Claw。

## 目前能做什么

<AccordionGroup>
  <Accordion title="聊天和语音">
    - 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 通过浏览器实时会话进行语音对话。OpenAI 使用直接 WebRTC，Google Live 通过 WebSocket 使用受限的一次性浏览器令牌，而仅后端实时语音插件使用 Gateway 网关中继传输。中继会将提供商凭据保留在 Gateway 网关上，同时浏览器通过 `talk.realtime.relay*` RPC 流式传输麦克风 PCM，并通过 `chat.send` 将 `openclaw_agent_consult` 工具调用发回给配置的更大的 OpenClaw 模型。
    - 在聊天中流式传输工具调用和实时工具输出卡片（智能体事件）。

  </Accordion>
  <Accordion title="渠道、实例、会话、梦境">
    - 渠道：内置渠道以及内置/外部插件渠道的状态、二维码登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）。
    - 实例：在线列表 + 刷新（`system-presence`）。
    - 会话：列表 + 按会话设置模型/thinking/fast/verbose/trace/reasoning 覆盖（`sessions.list`、`sessions.patch`）。
    - 梦境：Dreaming 状态、启用/禁用开关，以及 Dream Diary 阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、节点、执行批准">
    - Cron 作业：列出/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）。
    - Skills：状态、启用/禁用、安装、API 密钥更新（`skills.*`）。
    - 节点：列表 + 能力（`node.list`）。
    - 执行批准：编辑 Gateway 网关或节点允许列表 + `exec host=gateway/node` 的询问策略（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 通过验证应用 + 重启（`config.apply`），并唤醒最后一个活动会话。
    - 写入包含 base-hash 防护，以防覆盖并发编辑。
    - 写入（`config.set`/`config.apply`/`config.patch`）会对提交的配置载荷中的引用预检活动 SecretRef 解析；未解析的活动提交引用会在写入前被拒绝。
    - Schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及可用时的插件 + 渠道 schema）；只有当快照可以安全进行原始往返时，Raw JSON 编辑器才可用。
    - 如果快照无法安全地往返原始文本，控制 UI 会强制使用表单模式，并对该快照禁用原始模式。
    - Raw JSON 编辑器的“Reset to saved”会保留原始编写的形态（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照可以安全往返时，外部编辑会在重置后保留下来。
    - 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防意外发生对象到字符串的损坏。

  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）。
    - 日志：实时跟踪 Gateway 网关文件日志，支持过滤/导出（`logs.tail`）。
    - 更新：运行包/git 更新 + 重启（`update.run`）并生成重启报告，然后在重新连接后轮询 `update.status`，以验证正在运行的 Gateway 网关版本。

  </Accordion>
  <Accordion title="Cron 作业面板说明">
    - 对于隔离作业，投递默认会公告摘要。如果你想要仅内部运行，可以切换为无。
    - 选择公告后，会显示渠道/目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
    - 对于主会话作业，webhook 和无投递模式均可用。
    - 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确/错峰选项、智能体模型/thinking 覆盖，以及尽力而为投递开关。
    - 表单验证以内联方式显示字段级错误；无效值会禁用保存按钮，直到修复为止。
    - 设置 `cron.webhookToken` 可发送专用 bearer 令牌；如果省略，webhook 会在没有认证标头的情况下发送。
    - 已弃用回退：存储的旧版作业若带有 `notify: true`，在迁移前仍可使用 `cron.webhook`。

  </Accordion>
</AccordionGroup>

## 聊天行为

<AccordionGroup>
  <Accordion title="发送和历史语义">
    - `chat.send` 是**非阻塞**的：它会立即以 `{ runId, status: "started" }` 确认，响应通过 `chat` 事件流式传输。
    - 聊天上传接受图片以及非视频文件。图片保留原生图片路径；其他文件会作为托管媒体存储，并在历史中显示为附件链接。
    - 使用相同的 `idempotencyKey` 重新发送时，运行期间返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
    - 出于 UI 安全考虑，`chat.history` 响应有大小限制。当转录条目过大时，Gateway 网关可能会截断长文本字段、省略较重的元数据块，并用占位符（`[chat.history omitted: message too large]`）替换超大的消息。
    - 助手/生成的图片会作为托管媒体引用持久化，并通过经过身份验证的 Gateway 网关媒体 URL 返回，因此重新加载不依赖原始 base64 图片载荷继续保留在聊天历史响应中。
    - `chat.history` 还会从可见的助手文本中剥离仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），以及泄漏的 ASCII/全角模型控制令牌，并省略整个可见文本仅为精确静默令牌 `NO_REPLY` / `no_reply` 的助手条目。
    - 在活跃发送期间以及最终历史刷新时，如果 `chat.history` 短暂返回较旧的快照，聊天视图会继续显示本地乐观用户/助手消息；一旦 Gateway 网关历史追上，规范转录就会替换这些本地消息。
    - `chat.inject` 会向会话转录追加一条助手注记，并广播一个 `chat` 事件用于仅 UI 更新（无智能体运行，无渠道投递）。
    - 聊天头部的模型和 thinking 选择器会立即通过 `sessions.patch` 修补活跃会话；它们是持久会话覆盖项，而不是仅单轮的发送选项。
    - 聊天模型选择器会请求 Gateway 网关配置的模型视图。如果存在 `agents.defaults.models`，该允许列表会驱动选择器。否则，选择器会先显示显式的 `models.providers.*.models` 条目，然后再为全新安装回退到完整目录。
    - 当新的 Gateway 网关会话用量报告显示上下文压力较高时，聊天输入区域会显示上下文提示；在建议的压缩级别，会显示一个紧凑按钮，用于运行正常的会话压缩路径。过期的令牌快照会被隐藏，直到 Gateway 网关再次报告新的用量。

  </Accordion>
  <Accordion title="Talk 模式（浏览器实时）">
    Talk 模式使用已注册的实时语音提供商。使用 `talk.provider: "openai"` 加 `talk.providers.openai.apiKey` 配置 OpenAI，或使用 `talk.provider: "google"` 加 `talk.providers.google.apiKey` 配置 Google；Voice Call 实时提供商配置仍可作为回退复用。浏览器永远不会收到标准提供商 API key。OpenAI 会收到一个用于 WebRTC 的临时 Realtime 客户端密钥。Google Live 会收到一个用于浏览器 WebSocket 会话的一次性受限 Live API 认证令牌，指令和工具声明由 Gateway 网关锁定到该令牌中。只公开后端实时桥接的提供商会通过 Gateway 网关中继传输运行，因此凭证和供应商套接字会保留在服务器端，而浏览器音频会通过经过身份验证的 Gateway 网关 RPC 传输。Realtime 会话提示词由 Gateway 网关组装；`talk.realtime.session` 不接受调用方提供的指令覆盖。

    在聊天输入框中，Talk 控件是麦克风听写按钮旁边的波形按钮。Talk 启动时，输入框状态行会显示 `Connecting Talk...`，音频连接后显示 `Talk live`，或在实时工具调用通过 `chat.send` 咨询配置的更大模型时显示 `Asking OpenClaw...`。

    维护者实时冒烟测试：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 会验证 OpenAI 浏览器 WebRTC SDP 交换、Google Live 受限令牌浏览器 WebSocket 设置，以及带有假麦克风媒体的 Gateway 网关中继浏览器适配器。该命令只打印提供商状态，不记录密钥。

  </Accordion>
  <Accordion title="停止和中止">
    - 点击**停止**（调用 `chat.abort`）。
    - 运行处于活跃状态时，普通后续消息会排队。点击排队消息上的**引导**，可将该后续消息注入正在运行的轮次。
    - 输入 `/stop`（或独立的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以带外中止。
    - `chat.abort` 支持 `{ sessionKey }`（无 `runId`），用于中止该会话的所有活跃运行。

  </Accordion>
  <Accordion title="中止部分内容保留">
    - 运行被中止时，部分助手文本仍可显示在 UI 中。
    - 当存在已缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到转录历史中。
    - 持久化条目包含中止元数据，因此转录消费者可以区分中止部分内容和正常完成输出。

  </Accordion>
</AccordionGroup>

## PWA 安装和 Web Push

Control UI 随附一个 `manifest.webmanifest` 和一个 service worker，因此现代浏览器可以将其安装为独立 PWA。Web Push 允许 Gateway 网关通过通知唤醒已安装的 PWA，即使标签页或浏览器窗口未打开也是如此。

| 表面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 清单。浏览器在可访问后会提供“安装应用”。                      |
| `ui/public/sw.js`                                     | 处理 `push` 事件和通知点击的 service worker。                      |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下）    | 自动生成的 VAPID 密钥对，用于签名 Web Push 载荷。                  |
| `push/web-push-subscriptions.json`                    | 持久化的浏览器订阅端点。                                           |

当你想固定密钥（用于多主机部署、密钥轮换或测试）时，可通过 Gateway 网关进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认为 `mailto:openclaw@localhost`）

Control UI 使用这些受作用域限制的 Gateway 网关方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` — 获取活跃的 VAPID 公钥。
- `push.web.subscribe` — 注册一个 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已注册的端点。
- `push.web.test` — 向调用方的订阅发送测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（有关中继支持的推送，请参阅[配置](/zh-CN/gateway/configuration)）以及现有的 `push.test` 方法，后者面向原生移动配对。
</Note>

## 托管嵌入

助手消息可以使用 `[embed ...]` 短代码以内联方式渲染托管 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    禁用托管嵌入内的脚本执行。
  </Tab>
  <Tab title="scripts（默认）">
    允许交互式嵌入，同时保持来源隔离；这是默认值，通常足以用于自包含的浏览器游戏/小组件。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上为有意需要更强权限的同站点文档添加 `allow-same-origin`。
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
  <Tab title="集成 Tailscale Serve（首选）">
    将 Gateway 网关保留在 loopback 上，并让 Tailscale Serve 通过 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开：

    - `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行身份验证。OpenClaw 通过使用 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该标头匹配来验证身份，并且只在请求命中 loopback 且带有 Tailscale 的 `x-forwarded-*` 标头时接受这些身份。对于带有浏览器设备身份的 Control UI 操作者会话，这条经过验证的 Serve 路径还会跳过设备配对往返；无设备浏览器和节点角色连接仍会遵循正常设备检查。如果你希望即使对 Serve 流量也要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于该异步 Serve 身份路径，在写入速率限制之前，同一客户端 IP 和认证作用域的失败认证尝试会被串行化。因此，来自同一浏览器的并发错误重试可能会在第二个请求上显示 `retry later`，而不是两个普通不匹配并行竞争。

    <Warning>
    无令牌 Serve 认证假定网关主机是可信的。如果不可信的本地代码可能在该主机上运行，请要求 token/password 认证。
    </Warning>

  </Tab>
  <Tab title="绑定到 tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然后打开：

    - `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

    将匹配的共享密钥粘贴到 UI 设置中（作为 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

  </Tab>
</Tabs>

## 不安全 HTTP

如果你通过纯 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）打开仪表板，浏览器会在**非安全上下文**中运行并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

已记录的例外：

- 仅限 localhost 的不安全 HTTP 兼容性，使用 `gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作者 Control UI 认证
- 紧急破窗 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复：**使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在网关主机上）

<AccordionGroup>
  <Accordion title="不安全认证开关行为">
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

    - 它允许 localhost Control UI 会话在非安全 HTTP 上下文中无需设备身份继续进行。
    - 它不会绕过配对检查。
    - 它不会放宽远程（非 localhost）设备身份要求。

  </Accordion>
  <Accordion title="仅限紧急破窗">
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
    `dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，是严重的安全降级。紧急使用后请迅速恢复。
    </Warning>

  </Accordion>
  <Accordion title="可信代理说明">
    - 成功的可信代理认证可以允许没有设备身份的 **operator** 控制 UI 会话进入。
    - 这**不**适用于节点角色控制 UI 会话。
    - 同主机 loopback 反向代理仍不满足可信代理认证；请参阅[可信代理认证](/zh-CN/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

有关 HTTPS 设置指导，请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

控制 UI 附带严格的 `img-src` 策略：只允许**同源**资源、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且不会发起网络请求。

这在实践中意味着：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍会渲染，包括 UI 获取并转换为本地 `blob:` URL 的已认证头像路由。
- 内联 `data:image/...` URL 仍会渲染（适用于协议内载荷）。
- 控制 UI 创建的本地 `blob:` URL 仍会渲染。
- 渠道元数据发出的远程头像 URL 会在控制 UI 的头像辅助函数中被剥离，并替换为内置标志/徽章，因此被入侵或恶意的渠道无法强制操作员浏览器发起任意远程图片请求。

你无需更改任何内容即可获得此行为 —— 它始终启用且不可配置。

## 头像路由认证

配置 Gateway 网关认证后，控制 UI 头像端点需要与 API 其余部分相同的 Gateway 网关令牌：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与相邻的助手媒体路由一致）。这可以防止头像路由在其他方面受保护的主机上泄露智能体身份。
- 控制 UI 自身在获取头像时会以 bearer 头转发 Gateway 网关令牌，并使用已认证的 blob URL，因此图片仍会在仪表盘中渲染。

如果你禁用 Gateway 网关认证（不建议在共享主机上这样做），头像路由也会变为未认证状态，与 Gateway 网关的其余部分保持一致。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对基路径（当你需要固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本地开发（独立开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试/测试：开发服务器 + 远程 Gateway 网关

控制 UI 是静态文件；WebSocket 目标可配置，并且可以不同于 HTTP 源。当你想在本地使用 Vite 开发服务器、但 Gateway 网关在其他位置运行时，这很方便。

<Steps>
  <Step title="启动 UI 开发服务器">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="使用 gatewayUrl 打开">
    ```text
    http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
    ```

    可选的一次性认证（如果需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="说明">
    - `gatewayUrl` 会在加载后存储在 localStorage 中，并从 URL 中移除。
    - 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，这可以避免请求日志和 Referer 泄露。旧版 `?token=` 查询参数仍会为了兼容性导入一次，但仅作为回退，并且会在引导后立即剥离。
    - `password` 仅保存在内存中。
    - 设置 `gatewayUrl` 后，UI 不会回退到配置或环境凭证。请显式提供 `token`（或 `password`）。缺少显式凭证会被视为错误。
    - 当 Gateway 网关位于 TLS 后方（Tailscale Serve、HTTPS 代理等）时，请使用 `wss://`。
    - `gatewayUrl` 只会在顶层窗口中被接受（不能嵌入），以防止点击劫持。
    - 非 loopback 控制 UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整源）。这包括远程开发设置。
    - Gateway 网关启动可能会根据有效运行时绑定和端口播种本地源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但远程浏览器源仍需要显式条目。
    - 除了严格受控的本地测试，不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允许任何浏览器源，而不是“匹配我正在使用的任何主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 头源回退模式，但这是一种危险的安全模式。

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

- [仪表盘](/zh-CN/web/dashboard) — Gateway 网关仪表盘
- [健康检查](/zh-CN/gateway/health) — Gateway 网关健康监控
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
