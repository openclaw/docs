---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你想在不使用 SSH 隧道的情况下通过 Tailnet 访问
summary: Gateway 网关的基于浏览器的 Control UI（聊天、节点、配置）
title: Control UI
x-i18n:
    generated_at: "2026-04-25T05:57:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c41605af9972b2ec0a8f23724f0279c1890740b150b37814d2f879a466d36b0
    source_path: web/control-ui.md
    workflow: 15
---

Control UI 是一个由 Gateway 网关提供的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接与 Gateway 网关 WebSocket 通信**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台计算机上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面无法加载，请先启动 Gateway 网关：`openclaw gateway`。

认证信息会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用 trusted-proxy 身份头

仪表板设置面板会为当前浏览器标签页会话和所选网关 URL 保留一个 token；password 不会被持久化。新手引导通常会在首次连接时为共享密钥认证生成一个网关 token，但当 `gateway.auth.mode` 为 `"password"` 时，也可以使用 password 认证。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关要求进行**一次性配对批准**——即使你位于同一个 Tailnet 中，且 `gateway.auth.allowTailscale: true` 也是如此。这是一项安全措施，用于防止未授权访问。

**你会看到的内容：**“已断开连接（1008）：需要配对”

**批准设备的方法：**

```bash
# List pending requests
openclaw devices list

# Approve by request ID
openclaw devices approve <requestId>
```

如果浏览器在认证详情（角色/作用域/公钥）发生变化后重试配对，之前待处理的请求会被替代，并创建新的 `requestId`。
请在批准前重新运行 `openclaw devices list`。

如果浏览器已经配对，而你又将其从只读访问改为写入/管理员访问，这会被视为批准升级，而不是静默重连。OpenClaw 会保持旧批准继续有效，阻止更高权限的重连，并要求你显式批准新的作用域集合。

一旦获得批准，设备就会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则无需再次批准。有关 token 轮换和撤销，请参见 [Devices CLI](/zh-CN/cli/devices)。

**说明：**

- 直接的本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会被自动批准。
- Tailnet 和局域网浏览器连接即使来自同一台机器，仍然需要显式批准。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据都会需要重新配对。

## 个人身份（浏览器本地）

Control UI 支持按浏览器设置个人身份（显示名称和头像），用于在共享会话中为发送的消息附加归属信息。它存储在浏览器存储中，作用域限定为当前浏览器配置文件，不会同步到其他设备，也不会在服务器端持久化，除了你实际发送消息所附带的常规转录作者元数据之外。清除站点数据或切换浏览器后，它会重置为空。

## 运行时配置端点

Control UI 会从 ` /__openclaw/control-ui-config.json` 获取其运行时设置。该端点受与其余 HTTP 能力面相同的网关认证保护：未认证的浏览器无法获取它，而成功获取需要满足以下之一：已有有效的网关 token/password、Tailscale Serve 身份，或 trusted-proxy 身份。

## 语言支持

Control UI 可以在首次加载时根据你的浏览器语言环境进行本地化。若要之后覆盖它，请打开 **概览 -> Gateway Access -> Language**。语言选择器位于 Gateway Access 卡片中，而不是在外观设置下。

- 支持的语言环境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`tr`、`uk`、`id`、`pl`、`th`
- 非英文翻译会在浏览器中按需懒加载。
- 所选语言环境会保存到浏览器存储中，并在之后访问时复用。
- 缺失的翻译键会回退到英文。

## 它目前可以做什么

- 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）
- 通过 WebRTC 直接在浏览器中与 OpenAI Realtime 通信。Gateway 网关会通过 `talk.realtime.session` 签发短期有效的 Realtime 客户端密钥；浏览器会将麦克风音频直接发送给 OpenAI，并通过 `chat.send` 将 `openclaw_agent_consult` 工具调用中继回已配置的更大 OpenClaw 模型。
- 在聊天中流式显示工具调用 + 实时工具输出卡片（智能体事件）
- 渠道：内置以及内置/外部插件渠道的状态、二维码登录和每渠道配置（`channels.status`、`web.login.*`、`config.patch`）
- 实例：在线状态列表 + 刷新（`system-presence`）
- 会话：列表 + 每会话模型/thinking/fast/verbose/trace/reasoning 覆盖（`sessions.list`、`sessions.patch`）
- Dreams：Dreaming 状态、启用/禁用开关，以及 Dream Diary 读取器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）
- Cron 作业：列表/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）
- Skills：状态、启用/禁用、安装、API 密钥更新（`skills.*`）
- 节点：列表 + 能力（`node.list`）
- Exec 审批：编辑 Gateway 网关或节点允许列表 + 为 `exec host=gateway/node` 询问策略（`exec.approvals.*`）
- 配置：查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）
- 配置：带验证的应用 + 重启（`config.apply`），并唤醒最近活跃的会话
- 配置写入包含 base-hash 保护，以防覆盖并发编辑
- 配置写入（`config.set`/`config.apply`/`config.patch`）还会对提交的配置载荷中的活动 SecretRef 解析进行预检；未解析的活动已提交引用会在写入前被拒绝
- 配置 schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及在可用时的插件 + 渠道 schema）；仅当快照支持安全的原始往返时，才提供 Raw JSON 编辑器
- 如果某个快照无法安全地进行原始往返，Control UI 会强制使用表单模式，并为该快照禁用原始模式
- Raw JSON 编辑器中的“重置为已保存”会保留原始编写的结构（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照可以安全往返时，外部编辑在重置后仍会保留
- 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防止对象被意外损坏为字符串
- 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）
- 日志：带过滤/导出的 Gateway 网关文件日志实时 tail（`logs.tail`）
- 更新：运行 package/git 更新 + 重启（`update.run`），并附带重启报告

Cron 作业面板说明：

- 对于独立作业，投递默认是 announce 摘要。如果你只想进行内部运行，可以切换为 none。
- 选择 announce 后会显示渠道/目标字段。
- Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
- 对于主会话作业，可用的投递模式有 webhook 和 none。
- 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确/错峰选项、智能体模型/thinking 覆盖，以及尽力投递切换。
- 表单验证为内联字段级错误；在修复前，无效值会禁用保存按钮。
- 设置 `cron.webhookToken` 可发送专用 bearer token；若省略，则 webhook 会在不带认证头的情况下发送。
- 已弃用的回退：已存储的旧版作业使用 `notify: true` 时，在迁移前仍可使用 `cron.webhook`。

## 聊天行为

- `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，随后响应通过 `chat` 事件流式传输。
- 使用相同的 `idempotencyKey` 重发时，如果仍在运行中会返回 `{ status: "in_flight" }`，完成后则返回 `{ status: "ok" }`。
- 出于 UI 安全考虑，`chat.history` 响应有大小限制。当转录条目过大时，Gateway 网关可能会截断长文本字段、省略较重的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
- 助手/生成的图像会作为受管媒体引用持久化，并通过已认证的 Gateway 网关媒体 URL 提供，因此页面重新加载不依赖于聊天历史响应中仍保留原始 base64 图像载荷。
- `chat.history` 还会从可见助手文本中剥离仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及截断的工具调用块），以及泄露的 ASCII/全角模型控制 token，并省略那些其全部可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 的助手条目。
- 在活跃发送期间以及最终历史刷新期间，如果 `chat.history` 短暂返回较旧快照，聊天视图会保留本地乐观显示的用户/助手消息；一旦 Gateway 网关历史记录追上，这些本地消息就会被规范转录替换。
- `chat.inject` 会向会话转录追加一条助手说明，并广播一个 `chat` 事件以进行仅 UI 更新（不触发智能体运行，也不投递到渠道）。
- 聊天头部中的模型和 thinking 选择器会立即通过 `sessions.patch` 修补当前活动会话；它们是持久的会话覆盖，而不是单轮发送选项。
- 当新的 Gateway 网关会话用量报告显示上下文压力较高时，聊天输入区会显示上下文提示；在建议的压缩级别下，还会显示一个 compact 按钮，用于运行正常的会话压缩路径。过期的 token 快照会被隐藏，直到 Gateway 网关再次报告新鲜用量。
- Talk 模式使用一个已注册的 realtime 语音 provider，该 provider 支持浏览器 WebRTC 会话。可配置 OpenAI：`talk.provider: "openai"` 加 `talk.providers.openai.apiKey`，或复用 Voice Call realtime provider 配置。浏览器永远不会收到标准 OpenAI API 密钥；它只会收到临时 Realtime 客户端密钥。Google Live realtime 语音支持后端 Voice Call 和 Google Meet 桥接，但尚不支持此浏览器 WebRTC 路径。Realtime 会话提示由 Gateway 网关组装；`talk.realtime.session` 不接受调用方提供的指令覆盖。
- 在聊天输入区中，Talk 控件是位于麦克风听写按钮旁边的波形按钮。Talk 启动时，输入区状态行会显示 `Connecting Talk...`，音频连接后显示 `Talk live`，或者当 realtime 工具调用正通过 `chat.send` 查询已配置的更大模型时显示 `Asking OpenClaw...`。
- 停止：
  - 点击 **Stop**（调用 `chat.abort`）
  - 当某次运行处于活跃状态时，普通后续消息会排队。点击排队消息上的 **Steer** 可将该后续消息注入到当前运行轮次中。
  - 输入 `/stop`（或独立中止短语，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）可进行带外中止
  - `chat.abort` 支持 `{ sessionKey }`（无 `runId`），可中止该会话的所有活动运行
- 中止后的部分保留：
  - 当某次运行被中止时，部分助手文本仍可能显示在 UI 中
  - 当存在缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到转录历史中
  - 持久化条目包含中止元数据，以便转录使用方区分中止的部分输出与正常完成输出

## 托管嵌入

助手消息可以使用 `[embed ...]` 短代码以内联方式渲染托管 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

- `strict`：禁用托管嵌入中的脚本执行
- `scripts`：允许交互式嵌入，同时保持源隔离；这是默认值，通常已足够支持自包含的浏览器游戏/小组件
- `trusted`：在 `allow-scripts` 之上再添加 `allow-same-origin`，用于有意需要更高权限的同站点文档

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

仅当嵌入文档确实需要 same-origin 行为时才使用 `trusted`。
对于大多数由智能体生成的游戏和交互式 canvas，`scripts` 是更安全的选择。

默认情况下，绝对外部 `http(s)` embed URL 仍会被阻止。如果你确实希望 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

### 集成式 Tailscale Serve（首选）

让 Gateway 网关保持绑定到 loopback，并通过 Tailscale Serve 使用 HTTPS 进行代理：

```bash
openclaw gateway --tailscale serve
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份头（`tailscale-user-login`）进行认证。OpenClaw 会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该头进行匹配来验证身份，并且仅在请求命中 loopback 且带有 Tailscale 的 `x-forwarded-*` 头时接受这些头。如果你希望即使对 Serve 流量也要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。
对于该异步 Serve 身份路径，来自同一客户端 IP 和认证作用域的失败认证尝试会在写入速率限制之前进行串行化。因此，同一浏览器的并发错误重试中，第二个请求可能会显示 `retry later`，而不是两个普通不匹配请求并行竞争。
无 token 的 Serve 认证假定网关主机是受信任的。如果该主机上可能运行不受信任的本地代码，请要求使用 token/password 认证。

### 绑定到 tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

然后打开：

- `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

将匹配的共享密钥粘贴到 UI 设置中（作为 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

## 不安全的 HTTP

如果你通过纯 HTTP 打开仪表板（`http://<lan-ip>` 或 `http://<tailscale-ip>`），浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

文档中记录的例外情况：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 的仅 localhost 不安全 HTTP 兼容模式
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功进行的 operator Control UI 认证
- 紧急破窗选项 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方式：**使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在网关主机上）

**不安全认证开关行为：**

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

- 它允许 localhost Control UI 会话在非安全 HTTP 上下文中无需设备身份继续进行。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

**仅限紧急破窗：**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，这是严重的安全降级。紧急使用后请尽快恢复。

trusted-proxy 说明：

- 成功的 trusted-proxy 认证可以允许**operator** Control UI 会话在没有设备身份的情况下进入
- 这**不**适用于 node 角色的 Control UI 会话
- 同主机 loopback 反向代理仍然不能满足 trusted-proxy 认证；参见
  [Trusted proxy auth](/zh-CN/gateway/trusted-proxy-auth)

HTTPS 设置指导请参见 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 采用严格的 `img-src` 策略：只允许**同源**资源和 `data:` URL。远程 `http(s)` 和协议相对的图像 URL 会被浏览器拒绝，并且不会发起网络获取请求。

这在实践中的含义是：

- 在相对路径下提供的头像和图像（例如 `/avatars/<id>`）仍然可以渲染。
- 内联 `data:image/...` URL 仍然可以渲染（适用于协议内载荷）。
- 由渠道元数据发出的远程头像 URL 会在 Control UI 的头像辅助工具中被剥离，并替换为内置 logo/badge，因此被攻破或恶意的渠道无法强迫 operator 浏览器发起任意远程图像请求。

你无需做任何更改即可获得此行为——它始终启用，且不可配置。

## 头像路由认证

配置了网关认证后，Control UI 头像端点需要与其余 API 相同的网关 token：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图像。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对这两个路由的未认证请求都会被拒绝（与相邻的助手媒体路由一致）。这可防止头像路由在其他方面受保护的主机上泄露智能体身份。
- Control UI 本身会在获取头像时以 bearer 头转发网关 token，并使用已认证的 blob URL，因此图像仍可在仪表板中渲染。

如果你禁用了网关认证（不建议在共享主机上这样做），头像路由也会变为未认证状态，这与网关其余部分保持一致。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。构建方式如下：

```bash
pnpm ui:build
```

可选的绝对 base（当你希望使用固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立 dev 服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试/测试：dev 服务器 + 远程 Gateway 网关

Control UI 是静态文件；WebSocket 目标可配置，并且可以与 HTTP 来源不同。当你希望在本地运行 Vite dev 服务器，而 Gateway 网关运行在其他地方时，这非常有用。

1. 启动 UI dev 服务器：`pnpm ui:dev`
2. 打开类似以下的 URL：

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

可选的一次性认证（如有需要）：

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

说明：

- `gatewayUrl` 会在加载后存储到 localStorage 中，并从 URL 中移除。
- 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，这可避免请求日志和 Referer 泄露。旧版 `?token=` 查询参数仍会出于兼容性被导入一次，但仅作为回退，并会在启动后立即移除。
- `password` 仅保存在内存中。
- 设置了 `gatewayUrl` 后，UI 不会回退到配置或环境凭证。
  请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
- 当 Gateway 网关位于 TLS 后面时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
- `gatewayUrl` 仅在顶层窗口中接受（不能嵌入），以防止点击劫持。
- 非 loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整 origin）。这也包括远程开发设置。
- 除非是严格受控的本地测试，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。
  这表示允许任意浏览器 origin，而不是“匹配我正在使用的任何主机”。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 头 origin 回退模式，但这是危险的安全模式。

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

远程访问设置详情：参见 [远程访问](/zh-CN/gateway/remote)。

## 相关内容

- [Dashboard](/zh-CN/web/dashboard) — 网关仪表板
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [Health Checks](/zh-CN/gateway/health) — 网关健康监控
