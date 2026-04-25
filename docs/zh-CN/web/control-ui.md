---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你想在不使用 SSH 隧道的情况下通过 Tailnet 访问
summary: Gateway 网关的浏览器控制 UI（聊天、节点、配置）
title: Control UI
x-i18n:
    generated_at: "2026-04-25T00:45:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 827c4faec9e3e76b7956c2e5e6d882db09f5fa7495b236ac95062476d4c51235
    source_path: web/control-ui.md
    workflow: 15
---

Control UI 是一个由 Gateway 网关提供服务的小型 **Vite + Lit** 单页应用：

- 默认地址：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会**直接连接到同一端口上的 Gateway 网关 WebSocket**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台计算机上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面无法加载，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用受信任代理身份标头

仪表板设置面板会为当前浏览器标签页会话保存一个 token
以及所选的 Gateway 网关 URL；密码不会被持久化。新手引导通常会在首次连接时为共享密钥认证生成一个 gateway token，但当 `gateway.auth.mode` 为 `"password"` 时，也可以使用密码认证。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关
需要进行**一次性配对批准**——即使你已经位于同一个 Tailnet 中，并启用了 `gateway.auth.allowTailscale: true`。这是防止未经授权访问的安全措施。

**你会看到：** “disconnected (1008): pairing required”

**要批准该设备：**

```bash
# List pending requests
openclaw devices list

# Approve by request ID
openclaw devices approve <requestId>
```

如果浏览器在认证详情（角色 / scope / 公钥）变更后重试配对，
之前的待处理请求会被取代，并创建一个新的 `requestId`。
批准前请重新运行 `openclaw devices list`。

如果浏览器已经完成配对，而你又将其从只读访问改为
写入 / 管理员访问，这会被视为一次审批升级，而不是静默重连。
OpenClaw 会保持旧审批继续有效，阻止更高权限的重连，
并要求你显式批准新的 scope 集合。

一旦批准，该设备就会被记住，除非你通过 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则不会再次要求批准。有关 token 轮换和撤销，请参见
[Devices CLI](/zh-CN/cli/devices)。

**说明：**

- 直接的本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会
  自动批准。
- Tailnet 和 LAN 浏览器连接即使来自同一台机器，
  仍然需要显式批准。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或
  清除浏览器数据都需要重新配对。

## 个人身份（浏览器本地）

Control UI 支持按浏览器存储的个人身份（显示名称和
头像），用于为共享会话中的出站消息附加归属信息。它
存储在浏览器存储中，作用域仅限当前浏览器配置文件，不会
同步到其他设备，也不会在服务端持久化，除了你实际发送消息时
消息上正常的转录作者元数据。清除站点数据或切换浏览器后，
它会重置为空。

## 运行时配置端点

Control UI 会从
`/__openclaw/control-ui-config.json` 获取其运行时设置。该端点受与其余 HTTP 界面相同的 gateway 认证保护：未认证的浏览器无法获取它，而成功获取则要求已经具备有效的 gateway
token / password、Tailscale Serve 身份，或受信任代理身份。

## 语言支持

Control UI 可以在首次加载时根据你的浏览器语言环境进行本地化。
如果你之后想覆盖它，请打开 **Overview -> Gateway Access -> Language**。语言选择器位于 Gateway Access 卡片中，而不在外观设置下。

- 支持的语言环境：`en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 非英语翻译会在浏览器中延迟加载。
- 所选语言环境会保存在浏览器存储中，并在将来访问时复用。
- 缺失的翻译键会回退到英语。

## 当前可执行的功能

- 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）
- 通过 WebRTC 直接从浏览器连接到 OpenAI Realtime。Gateway 网关
  通过 `talk.realtime.session` 生成一个短期 Realtime 客户端密钥；浏览器将麦克风音频直接发送到 OpenAI，并通过 `chat.send` 将
  `openclaw_agent_consult` 工具调用中继回去，以供配置的更大 OpenClaw 模型使用。
- 在聊天中流式显示工具调用和实时工具输出卡片（智能体事件）
- 渠道：内置渠道以及内置 / 外部插件渠道的状态、QR 登录和每渠道配置（`channels.status`、`web.login.*`、`config.patch`）
- 实例：在线列表与刷新（`system-presence`）
- 会话：列表以及按会话设置 model / thinking / fast / verbose / trace / reasoning 覆盖（`sessions.list`、`sessions.patch`）
- Dreams：Dreaming 状态、启用 / 禁用开关，以及 Dream Diary 读取器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）
- Cron 作业：列出 / 添加 / 编辑 / 运行 / 启用 / 禁用 + 运行历史（`cron.*`）
- Skills：状态、启用 / 禁用、安装、API key 更新（`skills.*`）
- 节点：列表 + 能力（`node.list`）
- Exec 审批：编辑 gateway 或节点 allowlist + 为 `exec host=gateway/node` 设置 ask 策略（`exec.approvals.*`）
- 配置：查看 / 编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）
- 配置：带校验地应用 + 重启（`config.apply`），并唤醒最近活跃的会话
- 配置写入包含 base-hash 保护，以防覆盖并发编辑
- 配置写入（`config.set` / `config.apply` / `config.patch`）还会在写入前对提交配置负载中的活动 SecretRef 执行预检解析；无法解析的活动已提交引用会在写入前被拒绝
- 配置 schema + 表单渲染（`config.schema` / `config.schema.lookup`，
  包括字段 `title` / `description`、匹配的 UI 提示、直接子项
  摘要、嵌套对象 / 通配符 / 数组 / 组合节点上的文档元数据，
  以及在可用时的插件 + 渠道 schema）；仅当快照支持安全的原始 round-trip 时，
  才提供 Raw JSON 编辑器
- 如果某个快照无法安全地进行原始 round-trip，Control UI 会强制使用表单模式，并对该快照禁用 Raw 模式
- Raw JSON 编辑器中的“Reset to saved”会保留原始编写形态（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照可以安全 round-trip 时，外部编辑在重置后仍会保留
- 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防对象到字符串的意外损坏
- 调试：状态 / 健康 / 模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）
- 日志：带过滤 / 导出的 gateway 文件日志实时 tail（`logs.tail`）
- 更新：执行 package / git 更新 + 重启（`update.run`），并附带重启报告

Cron 作业面板说明：

- 对于隔离作业，投递默认是 announce 摘要。如果你希望仅内部运行，可以切换为 none。
- 选择 announce 时会出现渠道 / 目标字段。
- Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设为有效的 HTTP(S) webhook URL。
- 对于主会话作业，webhook 和 none 投递模式都可用。
- 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确 / 错开选项、
  智能体 model / thinking 覆盖，以及尽力而为投递开关。
- 表单校验以内联方式显示字段级错误；在修复前，无效值会禁用保存按钮。
- 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，webhook 将不会带认证标头。
- 已弃用回退：带有 `notify: true` 的旧存储作业在迁移前仍可使用 `cron.webhook`。

## 聊天行为

- `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，响应则通过 `chat` 事件流式传输。
- 使用相同的 `idempotencyKey` 重发时，运行中会返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
- 出于 UI 安全考虑，`chat.history` 响应有大小限制。当转录条目过大时，Gateway 网关可能会截断较长文本字段、省略较重的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
- 助手 / 生成的图像会以托管媒体引用形式持久化，并通过已认证的 Gateway 网关媒体 URL 返回，因此重新加载时不依赖聊天历史响应中仍保留原始 base64 图像负载。
- `chat.history` 还会从可见助手文本中去除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），以及泄露的 ASCII / 全角模型控制 token，并省略其全部可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 的助手条目。
- `chat.inject` 会向会话转录追加一条助手备注，并广播一个 `chat` 事件用于仅 UI 更新（不触发智能体运行，也不进行渠道投递）。
- 聊天头部的 model 和 thinking 选择器会立即通过 `sessions.patch` 修补活动会话；它们是持久的会话覆盖，不是单轮发送选项。
- 当最新的 Gateway 网关会话用量报告显示上下文压力较高时，聊天
  编辑器区域会显示上下文提示，并且在建议压缩级别下，
  会显示一个 compact 按钮，用于运行正常的会话压缩流程。过期的 token
  快照会被隐藏，直到 Gateway 网关再次报告新的用量。
- Talk 模式使用已注册的实时语音提供商，该提供商支持浏览器
  WebRTC 会话。请配置 OpenAI：`talk.provider: "openai"` 并设置
  `talk.providers.openai.apiKey`，或复用 Voice Call 的实时提供商配置。浏览器绝不会接收到标准 OpenAI API key；它只会收到短期 Realtime 客户端密钥。Google Live 实时语音支持后端 Voice Call 和 Google Meet bridge，但暂不支持此浏览器
  WebRTC 路径。Realtime 会话提示词由 Gateway 网关组装；
  `talk.realtime.session` 不接受调用方提供的指令覆盖。
- 在聊天编辑器中，Talk 控件是麦克风听写按钮旁边的
  波纹按钮。当 Talk 启动时，编辑器状态行会显示
  `Connecting Talk...`，音频连接后显示
  `Talk live`，或者当实时工具调用通过 `chat.send` 咨询已配置的
  更大模型时显示 `Asking OpenClaw...`。
- 停止：
  - 点击 **Stop**（调用 `chat.abort`）
  - 当某个运行处于活动状态时，普通后续消息会排队。点击已排队消息上的 **Steer** 可将该后续消息注入到当前运行轮次中。
  - 输入 `/stop`（或独立中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）进行带外中止
  - `chat.abort` 支持 `{ sessionKey }`（无需 `runId`）以中止该会话的所有活动运行
- 中止后的部分保留：
  - 当某个运行被中止时，部分助手文本仍可能显示在 UI 中
  - 当存在缓冲输出时，Gateway 网关会将中止的部分助手文本持久化到转录历史中
  - 持久化条目包含中止元数据，以便转录消费者区分中止的部分输出与正常完成输出

## 托管嵌入

助手消息可以通过 `[embed ...]`
短代码以内联方式渲染托管的网页内容。iframe 沙箱策略由
`gateway.controlUi.embedSandbox` 控制：

- `strict`：禁用托管嵌入中的脚本执行
- `scripts`：允许交互式嵌入，同时保持源隔离；这是
  默认值，通常足以支持自包含的浏览器游戏 / 小部件
- `trusted`：在 `allow-scripts` 的基础上再添加 `allow-same-origin`，用于同站点
  文档有意需要更高权限的场景

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

仅当嵌入的文档确实需要同源
行为时才使用 `trusted`。对于大多数由智能体生成的游戏和交互式画布，`scripts` 是
更安全的选择。

默认情况下，绝对外部 `http(s)` 嵌入 URL 仍会被阻止。如果你
确实想让 `[embed url="https://..."]` 加载第三方页面，请设置
`gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

### 集成式 Tailscale Serve（首选）

将 Gateway 网关保留在 local loopback 上，并让 Tailscale Serve 通过 HTTPS 代理它：

```bash
openclaw gateway --tailscale serve
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI / WebSocket Serve 请求可以通过 Tailscale 身份标头
（`tailscale-user-login`）进行认证。OpenClaw
会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并与标头匹配来验证身份，并且仅当
请求到达 local loopback 且带有 Tailscale 的 `x-forwarded-*` 标头时才接受这些身份。若你希望即使对于 Serve 流量也要求显式共享密钥
凭证，请设置
`gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或
`"password"`。
对于该异步 Serve 身份路径，来自同一客户端 IP
和认证 scope 的失败认证尝试会在速率限制写入前被串行化。因此，同一浏览器的并发错误重试
在第二个请求上可能会显示 `retry later`，而不是两个普通不匹配并行竞争。
无 token 的 Serve 认证假设 gateway 主机是可信的。如果该主机上可能运行不受信任的本地代码，请要求使用 token / password 认证。

### 绑定到 tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

然后打开：

- `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

将匹配的共享密钥粘贴到 UI 设置中（会作为
`connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

## 不安全的 HTTP

如果你通过纯 HTTP 打开仪表板（`http://<lan-ip>` 或 `http://<tailscale-ip>`），
浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，
OpenClaw **会阻止**没有设备身份的 Control UI 连接。

文档化的例外情况：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 的仅 localhost 不安全 HTTP 兼容模式
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作员 Control UI 认证
- 紧急兜底 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方法：** 使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 gateway 主机上）

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

`allowInsecureAuth` 仅是一个本地兼容性开关：

- 它允许 localhost Control UI 会话在
  非安全 HTTP 上下文中无需设备身份即可继续。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

**仅限紧急兜底：**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，并且是严重的安全降级。紧急使用后请尽快恢复。

受信任代理说明：

- 成功的受信任代理认证可以允许**操作员** Control UI 会话在
  无设备身份的情况下接入
- 这**不**适用于 node 角色的 Control UI 会话
- 同主机的 local loopback 反向代理仍然不能满足受信任代理认证；请参见
  [受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)

有关 HTTPS 设置指导，请参见 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 使用严格的 `img-src` 策略：仅允许**同源**资源和 `data:` URL。远程 `http(s)` 及协议相对图片 URL 会被浏览器拒绝，并且不会发起网络请求。

这在实际中的含义是：

- 在相对路径下提供的头像和图片（例如 `/avatars/<id>`）仍可正常渲染。
- 内联 `data:image/...` URL 仍可正常渲染（对协议内负载很有用）。
- 由渠道元数据发出的远程头像 URL 会在 Control UI 的头像辅助层中被剥离，并替换为内置 logo / badge，因此受损或恶意渠道无法强制操作员浏览器发起任意远程图片请求。

你无需做任何改动即可获得此行为——它始终启用且不可配置。

## 头像路由认证

当 gateway 认证已配置时，Control UI 头像端点需要与其余 API 相同的 gateway token：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与相邻的 assistant-media 路由保持一致）。这可防止头像路由在其他方面已受保护的主机上泄露智能体身份。
- Control UI 本身在获取头像时会以 bearer 标头形式转发 gateway token，并使用已认证的 blob URL，因此图像仍可在仪表板中渲染。

如果你禁用了 gateway 认证（不建议在共享主机上这样做），头像路由也会变为未认证状态，与 gateway 其余部分保持一致。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对 base（当你需要固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立 dev server）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试 / 测试：dev server + 远程 Gateway 网关

Control UI 是静态文件；WebSocket 目标可配置，并且可以
不同于 HTTP 源。当你希望在本地运行 Vite dev server，
但 Gateway 网关运行在其他地方时，这会很方便。

1. 启动 UI dev server：`pnpm ui:dev`
2. 打开如下 URL：

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

可选的一次性认证（如需要）：

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

说明：

- `gatewayUrl` 会在加载后存储到 `localStorage` 中，并从 URL 中移除。
- 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，这样可以避免请求日志和 Referer 泄露。出于兼容性，旧版 `?token=` 查询参数仍会被导入一次，但仅作为回退，并会在启动后立即剥离。
- `password` 仅保存在内存中。
- 设置了 `gatewayUrl` 时，UI 不会回退到配置或环境凭证。
  请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
- 当 Gateway 网关位于 TLS 后面时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
- `gatewayUrl` 仅在顶层窗口中接受（非嵌入式），以防止点击劫持。
- 非 local loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`
  （完整 origin）。这包括远程开发设置。
- 除了严格受控的本地测试外，不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。
  它表示允许任意浏览器 origin，而不是“匹配我正在
  使用的任意主机”。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用
  Host 标头 origin 回退模式，但这是危险的安全模式。

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

远程访问设置详情： [远程访问](/zh-CN/gateway/remote)。

## 相关内容

- [Dashboard](/zh-CN/web/dashboard) — Gateway 网关仪表板
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [健康检查](/zh-CN/gateway/health) — Gateway 网关健康监控
