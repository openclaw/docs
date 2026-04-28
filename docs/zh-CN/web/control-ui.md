---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你希望在不使用 SSH 隧道的情况下获得 Tailnet 访问权限
sidebarTitle: Control UI
summary: 用于 Gateway 网关的基于浏览器的控制 UI（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-27T17:27:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5c92e7f5e2f21145cfa2a2b8ba5e8d90db1b4dac9f475b88cf4604d1fa1d0a6
    source_path: web/control-ui.md
    workflow: 15
---

Control UI 是一个由 Gateway 网关提供的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接连接到 Gateway WebSocket**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台计算机上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时，使用 Tailscale Serve 身份头
- 当 `gateway.auth.mode: "trusted-proxy"` 时，使用受信任代理身份头

仪表板设置面板会为当前浏览器标签页会话和所选 Gateway 网关 URL 保存一个令牌；密码不会被持久化。新手引导通常会在首次连接时为共享密钥认证生成一个 gateway 令牌，但当 `gateway.auth.mode` 为 `"password"` 时，也可以使用密码认证。

## 设备配对（首次连接）

当你使用新的浏览器或设备连接到 Control UI 时，Gateway 网关通常会要求进行**一次性配对批准**。这是一项安全措施，用于防止未经授权的访问。

**你会看到：** “disconnected (1008): pairing required”

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

如果浏览器在认证详细信息发生变化后重试配对（角色 / 作用域 / 公钥），之前的待处理请求会被替代，并创建一个新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已完成配对，而你将其权限从只读改为写入 / 管理员访问，这会被视为批准升级，而不是静默重连。OpenClaw 会保持旧批准仍然有效，阻止更高权限的重连，并要求你显式批准新的作用域集合。

批准完成后，设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则不需要再次批准。有关令牌轮换和撤销，请参阅 [Devices CLI](/zh-CN/cli/devices)。

<Note>
- 直接的本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会被自动批准。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份验证通过且浏览器提供其设备身份时，Tailscale Serve 可以跳过 Control UI 操作员会话的配对往返流程。
- 直接 Tailnet 绑定、LAN 浏览器连接以及没有设备身份的浏览器配置文件，仍然需要显式批准。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据都需要重新配对。

</Note>

## 个人身份（浏览器本地）

Control UI 支持为每个浏览器设置个人身份（显示名称和头像），并将其附加到发出的消息中，以便在共享会话中进行归属标记。它存储在浏览器存储中，作用域仅限当前浏览器配置文件，不会同步到其他设备，也不会在服务端持久化，除了你实际发送的消息中正常的转录作者元数据。清除站点数据或切换浏览器后，它会重置为空。

同样的浏览器本地模式也适用于助手头像覆盖。上传的助手头像只会在本地浏览器中覆盖 gateway 解析出的身份，绝不会通过 `config.patch` 往返传输。共享的 `ui.assistant.avatar` 配置字段仍可供直接写入该字段的非 UI 客户端使用（例如脚本化 gateway 或自定义仪表板）。

## 运行时配置端点

Control UI 会从 `/__openclaw/control-ui-config.json` 获取其运行时设置。该端点受到与其余 HTTP 接口相同的 gateway 认证保护：未认证的浏览器无法获取它，而成功获取需要以下之一：已有效的 gateway 令牌 / 密码、Tailscale Serve 身份，或受信任代理身份。

## 语言支持

Control UI 可在首次加载时根据你的浏览器语言环境进行本地化。若要稍后覆盖它，请打开**概览 -> Gateway Access -> 语言**。语言选择器位于 Gateway Access 卡片中，而不是“外观”下。

- 支持的语言环境：`en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 非英语翻译会在浏览器中按需延迟加载。
- 所选语言环境会保存在浏览器存储中，并在今后的访问中复用。
- 缺失的翻译键会回退到英文。

## 外观主题

外观面板保留内置的 Claw、Knot 和 Dash 主题，另外还提供一个浏览器本地 tweakcn 导入槽位。要导入主题，请打开 [tweakcn themes](https://tweakcn.com/themes)，选择或创建一个主题，点击**分享**，然后将复制的主题链接粘贴到外观中。导入器还接受 `https://tweakcn.com/r/themes/<id>` 注册表 URL、类似 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 的编辑器 URL、相对 `/themes/<id>` 路径、原始主题 ID，以及像 `amethyst-haze` 这样的默认主题名称。

导入的主题仅存储在当前浏览器配置文件中。它们不会写入 gateway 配置，也不会在设备间同步。替换导入的主题会更新这一个本地槽位；如果当前选中的是导入主题，则清除它会将活动主题切换回 Claw。

## 它目前能做什么

<AccordionGroup>
  <Accordion title="聊天和通话">
    - 通过 Gateway WS 与模型聊天（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）。
    - 通过浏览器实时会话进行通话。OpenAI 使用直接 WebRTC，Google Live 通过 WebSocket 使用受限的一次性浏览器令牌，而仅后端的实时语音插件使用 Gateway 网关中继传输。中继会将提供商凭证保留在 Gateway 网关上，同时浏览器通过 `talk.realtime.relay*` RPC 流式传输麦克风 PCM，并通过 `chat.send` 将 `openclaw_agent_consult` 工具调用发送回去，以供更大的已配置 OpenClaw 模型使用。
    - 在聊天中流式显示工具调用 + 实时工具输出卡片（智能体事件）。

  </Accordion>
  <Accordion title="渠道、实例、会话、Dreaming">
    - 渠道：内置以及内置 / 外部插件渠道状态、QR 登录和每渠道配置（`channels.status`, `web.login.*`, `config.patch`）。
    - 实例：在线状态列表 + 刷新（`system-presence`）。
    - 会话：列表 + 每会话模型 / thinking / fast / verbose / trace / reasoning 覆盖（`sessions.list`, `sessions.patch`）。
    - Dreaming：dreaming 状态、启用 / 禁用切换，以及 Dream Diary 阅读器（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、节点、exec 批准">
    - Cron 作业：列出 / 添加 / 编辑 / 运行 / 启用 / 禁用 + 运行历史（`cron.*`）。
    - Skills：状态、启用 / 禁用、安装、API 密钥更新（`skills.*`）。
    - 节点：列表 + 能力上限（`node.list`）。
    - Exec 批准：编辑 gateway 或节点允许列表 + 针对 `exec host=gateway/node` 的询问策略（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="配置">
    - 查看 / 编辑 `~/.openclaw/openclaw.json`（`config.get`, `config.set`）。
    - 应用 + 重启并进行验证（`config.apply`），然后唤醒最近活跃的会话。
    - 写入包含 base-hash 保护，以防覆盖并发编辑。
    - 写入（`config.set` / `config.apply` / `config.patch`）会对提交的配置负载中的活动 SecretRef 解析执行预检；未解析的活动已提交引用会在写入前被拒绝。
    - Schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象 / 通配符 / 数组 / 组合节点上的文档元数据，以及可用时的插件 + 渠道 schema）；仅当快照可以安全地进行原始往返时，Raw JSON 编辑器才可用。
    - 如果快照无法安全地进行原始往返，Control UI 会强制使用表单模式，并为该快照禁用原始模式。
    - Raw JSON 编辑器中的“Reset to saved”会保留原始编写的结构（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照可以安全地进行原始往返时，外部编辑在重置后仍会保留。
    - 结构化的 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防止意外将对象破坏为字符串。

  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态 / 健康 / Models 快照 + 事件日志 + 手动 RPC 调用（`status`, `health`, `models.list`）。
    - 日志：带过滤 / 导出的 gateway 文件日志实时尾部查看（`logs.tail`）。
    - 更新：运行 package / git 更新 + 重启（`update.run`）并生成重启报告，然后在重新连接后轮询 `update.status`，以验证正在运行的 gateway 版本。

  </Accordion>
  <Accordion title="Cron 作业面板说明">
    - 对于隔离作业，投递默认是公告摘要。如果你只想进行内部运行，可以切换为 none。
    - 选择 announce 后会显示渠道 / 目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
    - 对于主会话作业，可用的投递模式包括 webhook 和 none。
    - 高级编辑控件包括 run 后删除、清除智能体覆盖、cron 精确 / 错开选项、智能体模型 / thinking 覆盖，以及尽力投递切换。
    - 表单验证以内联方式进行，并提供字段级错误；在修复无效值之前，保存按钮会被禁用。
    - 设置 `cron.webhookToken` 以发送专用 bearer token；如果省略，则 webhook 将在不带认证头的情况下发送。
    - 已弃用的回退：存储的旧版作业若带有 `notify: true`，在迁移前仍可使用 `cron.webhook`。

  </Accordion>
</AccordionGroup>

## 聊天行为

<AccordionGroup>
  <Accordion title="发送和历史记录语义">
    - `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，随后响应通过 `chat` 事件流式传输。
    - 聊天上传支持图片以及非视频文件。图片会保留原生图片路径；其他文件会存储为托管媒体，并在历史记录中显示为附件链接。
    - 使用相同的 `idempotencyKey` 重新发送时，运行中会返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
    - 出于 UI 安全考虑，`chat.history` 响应有大小限制。当转录条目过大时，Gateway 网关可能会截断长文本字段、省略较重的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
    - 助手 / 生成的图片会作为托管媒体引用持久化，并通过已认证的 Gateway 网关媒体 URL 返回，因此重新加载不依赖聊天历史响应中保留原始 base64 图片负载。
    - `chat.history` 还会从可见的助手文本中去除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），以及泄漏的 ASCII / 全角模型控制令牌；并省略那些整个可见文本仅为精确静默令牌 `NO_REPLY` / `no_reply` 的助手条目。
    - 在发送进行中以及最终历史记录刷新期间，如果 `chat.history` 短暂返回较旧快照，聊天视图会保持本地乐观的用户 / 助手消息可见；一旦 Gateway 网关历史记录赶上，本地消息就会被规范转录替换。
    - `chat.inject` 会向会话转录追加一条助手备注，并广播一个 `chat` 事件用于仅 UI 更新（不触发智能体运行，也不进行渠道投递）。
    - 聊天头部的模型和 thinking 选择器会通过 `sessions.patch` 立即修补当前活动会话；它们是持久的会话覆盖项，而不是仅对单轮发送生效的选项。
    - 当最新的 Gateway 网关会话使用情况报告显示上下文压力较高时，聊天编辑区会显示上下文提示；在建议压缩级别下，还会显示一个 compact 按钮，用于运行正常的会话压缩流程。过时的令牌快照会被隐藏，直到 Gateway 网关再次报告新的使用情况。

  </Accordion>
  <Accordion title="Talk 模式（浏览器实时）">
    Talk 模式使用已注册的实时语音提供商。为 OpenAI 配置 `talk.provider: "openai"` 以及 `talk.providers.openai.apiKey`，或为 Google 配置 `talk.provider: "google"` 以及 `talk.providers.google.apiKey`；Voice Call 实时提供商配置仍可复用为回退方案。浏览器永远不会收到标准提供商 API 密钥。OpenAI 会收到用于 WebRTC 的临时 Realtime 客户端密钥。Google Live 会收到用于浏览器 WebSocket 会话的一次性受限 Live API 认证令牌，说明和工具声明由 Gateway 网关锁定在该令牌中。对于仅暴露后端实时桥接的提供商，则通过 Gateway 网关中继传输运行，因此凭证和供应商套接字保留在服务端，而浏览器音频通过已认证的 Gateway 网关 RPC 传输。Realtime 会话提示词由 Gateway 网关组装；`talk.realtime.session` 不接受调用方提供的指令覆盖。

    在聊天编辑器中，Talk 控件是麦克风听写按钮旁边的波形按钮。Talk 启动时，编辑器状态行会显示 `Connecting Talk...`，音频连接后显示 `Talk live`，或者当实时工具调用正通过 `chat.send` 咨询已配置的更大 OpenClaw 模型时显示 `Asking OpenClaw...`。

    维护者在线冒烟测试：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 会验证 OpenAI 浏览器 WebRTC SDP 交换、Google Live 受限令牌浏览器 WebSocket 设置，以及带有伪造麦克风媒体的 Gateway 网关中继浏览器适配器。该命令只打印提供商状态，不会记录密钥。

  </Accordion>
  <Accordion title="停止和中止">
    - 点击**停止**（调用 `chat.abort`）。
    - 当某次运行处于活动状态时，普通后续消息会进入队列。点击排队消息上的 **Steer**，可将该后续消息注入当前运行轮次。
    - 输入 `/stop`（或独立的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）可进行带外中止。
    - `chat.abort` 支持 `{ sessionKey }`（不需要 `runId`）来中止该会话的所有活动运行。

  </Accordion>
  <Accordion title="中止后的部分内容保留">
    - 当某次运行被中止时，部分助手文本仍可能显示在 UI 中。
    - 当存在缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到转录历史中。
    - 持久化条目包含中止元数据，以便转录消费者区分中止后的部分内容与正常完成输出。

  </Accordion>
</AccordionGroup>

## PWA 安装和 Web Push

Control UI 附带 `manifest.webmanifest` 和 service worker，因此现代浏览器可以将其安装为独立 PWA。即使标签页或浏览器窗口未打开，Web Push 也能让 Gateway 网关通过通知唤醒已安装的 PWA。

| 界面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 清单。一旦可访问，浏览器就会提供“安装应用”。                  |
| `ui/public/sw.js`                                     | 处理 `push` 事件和通知点击的 service worker。                     |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下）    | 自动生成的 VAPID 密钥对，用于签署 Web Push 负载。                 |
| `push/web-push-subscriptions.json`                    | 持久化的浏览器订阅端点。                                           |

如果你想固定 VAPID 密钥对（用于多主机部署、密钥轮换或测试），可以通过 Gateway 网关进程上的环境变量覆盖它：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认为 `mailto:openclaw@localhost`）

Control UI 使用以下受作用域控制的 Gateway 网关方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` — 获取当前活动的 VAPID 公钥。
- `push.web.subscribe` — 注册一个 `endpoint` 以及 `keys.p256dh` / `keys.auth`。
- `push.web.unsubscribe` — 删除一个已注册端点。
- `push.web.test` — 向调用方的订阅发送一条测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（有关基于中继的推送，请参阅 [Configuration](/zh-CN/gateway/configuration)），也独立于现有的 `push.test` 方法，后者面向原生移动端配对。
</Note>

## 托管嵌入

助手消息可以使用 `[embed ...]` 短代码内联渲染托管网页内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    禁止在托管嵌入中执行脚本。
  </Tab>
  <Tab title="scripts (default)">
    允许交互式嵌入，同时保持源隔离；这是默认值，通常足以支持自包含的浏览器游戏 / 小组件。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 的基础上增加 `allow-same-origin`，用于有意需要更高权限的同站点文档。
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
仅当嵌入文档确实需要 same-origin 行为时才使用 `trusted`。对于大多数由智能体生成的游戏和交互式画布，`scripts` 是更安全的选择。
</Warning>

绝对外部 `http(s)` 嵌入 URL 默认仍会被阻止。如果你确实希望 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="集成式 Tailscale Serve（首选）">
    让 Gateway 网关保持在 loopback 上，并使用 Tailscale Serve 通过 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开：

    - `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI / WebSocket Serve 请求可以通过 Tailscale 身份头（`tailscale-user-login`）进行认证。OpenClaw 会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该头进行匹配来验证身份，并且仅当请求命中 loopback 且带有 Tailscale 的 `x-forwarded-*` 头时才接受这些头。对于带有浏览器设备身份的 Control UI 操作员会话，这条已验证的 Serve 路径还会跳过设备配对往返流程；没有设备身份的浏览器和节点角色连接仍会遵循正常的设备检查。如果你希望即使对于 Serve 流量也要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于该异步 Serve 身份路径，来自同一客户端 IP 和认证作用域的失败认证尝试会在速率限制写入前串行化。因此，同一浏览器的并发错误重试可能会在第二个请求上显示 `retry later`，而不是两个普通不匹配并行竞争。

    <Warning>
    无令牌的 Serve 认证假设 gateway 主机是可信的。如果该主机上可能运行不受信任的本地代码，请要求 token / password 认证。
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

## 不安全的 HTTP

如果你通过纯 HTTP 打开仪表板（`http://<lan-ip>` 或 `http://<tailscale-ip>`），浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**不带设备身份的 Control UI 连接。

已记录的例外情况：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 的仅 localhost 不安全 HTTP 兼容模式
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作员 Control UI 认证
- 紧急兜底 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方式：** 使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 gateway 主机上）

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

    `allowInsecureAuth` 只是一个本地兼容性开关：

    - 它允许 localhost Control UI 会话在非安全 HTTP 上下文中在没有设备身份的情况下继续进行。
    - 它不会绕过配对检查。
    - 它不会放宽远程（非 localhost）设备身份要求。

  </Accordion>
  <Accordion title="仅限紧急兜底">
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
  <Accordion title="受信任代理说明">
    - 成功的 trusted-proxy 认证可以允许**操作员** Control UI 会话在没有设备身份的情况下接入。
    - 这**不**适用于节点角色的 Control UI 会话。
    - 同一主机上的 loopback 反向代理仍然不满足 trusted-proxy 认证；请参阅 [Trusted proxy auth](/zh-CN/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

有关 HTTPS 设置指导，请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 附带严格的 `img-src` 策略：只允许**同源**资源、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且不会发起网络请求。

这在实际中的含义是：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍会渲染，包括 UI 获取并转换为本地 `blob:` URL 的已认证头像路由。
- 内联 `data:image/...` URL 仍会渲染（这对协议内负载很有用）。
- 由 Control UI 创建的本地 `blob:` URL 仍会渲染。
- 由渠道元数据发出的远程头像 URL 会在 Control UI 的头像辅助函数中被剥离，并替换为内置 logo / badge，因此受损或恶意的渠道无法强迫操作员浏览器发起任意远程图片请求。

你无需进行任何更改即可获得此行为——它始终启用，且不可配置。

## 头像路由认证

配置 gateway 认证后，Control UI 头像端点需要与 API 其余部分相同的 gateway 令牌：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 也在相同规则下返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与同级 assistant-media 路由一致）。这可以防止头像路由在其他方面已受保护的主机上泄露智能体身份。
- Control UI 本身会在获取头像时以前置 bearer 头转发 gateway 令牌，并使用已认证的 blob URL，因此图片仍能在仪表板中渲染。

如果你禁用了 gateway 认证（不建议在共享主机上这样做），头像路由也会和 gateway 的其余部分一样变为无需认证。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对 base（当你想使用固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立 dev server）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway WebSocket URL（例如 `ws://127.0.0.1:18789`）。

## 调试 / 测试：dev server + 远程 Gateway

Control UI 是静态文件；WebSocket 目标可配置，并且可以不同于 HTTP 源。当你希望在本地运行 Vite dev server，而 Gateway 网关运行在其他地方时，这会很方便。

<Steps>
  <Step title="启动 UI dev server">
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
    - `gatewayUrl` 会在加载后存储到 localStorage 中，并从 URL 中移除。
    - `token` 应尽可能通过 URL 片段（`#token=...`）传递。片段不会发送到服务器，这样可以避免请求日志和 Referer 泄露。旧版 `?token=` 查询参数仍会为了兼容性导入一次，但仅作为回退，并会在引导后立即剥离。
    - `password` 仅保存在内存中。
    - 设置了 `gatewayUrl` 后，UI 不会回退到配置或环境变量凭证。请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
    - 当 Gateway 网关位于 TLS 之后时，请使用 `wss://`（Tailscale Serve、HTTPS 代理等）。
    - `gatewayUrl` 仅在顶层窗口中接受（不可嵌入），以防止点击劫持。
    - 非 loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整源）。这也包括远程开发设置。
    - Gateway 网关启动时，可能会根据实际运行时 bind 和端口预填充本地源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但远程浏览器源仍然需要显式条目。
    - 除了严格受控的本地测试外，不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它的含义是允许任何浏览器源，而不是“匹配我正在使用的任意主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 头源回退模式，但这是危险的安全模式。

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

远程访问设置详情： [Remote access](/zh-CN/gateway/remote)。

## 相关内容

- [Dashboard](/zh-CN/web/dashboard) — gateway 仪表板
- [Health Checks](/zh-CN/gateway/health) — gateway 健康监控
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
