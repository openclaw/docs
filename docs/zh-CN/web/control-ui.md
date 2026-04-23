---
read_when:
    - 你想要通过浏览器操作 Gateway 网关
    - 你想要无需 SSH 隧道即可通过 Tailnet 访问
summary: Gateway 网关的基于浏览器的控制 UI（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-23T06:18:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e3dbba6b05a5e00499fbe75e6a66a89e0b6b3d9d66e69143068e087f517b8a
    source_path: web/control-ui.md
    workflow: 15
---

# 控制 UI（浏览器）

控制 UI 是一个由 Gateway 网关提供的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接与 Gateway 网关 WebSocket 通信**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台电脑上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面无法加载，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用 trusted-proxy 身份标头

仪表板设置面板会为当前浏览器标签页会话
和所选 gateway URL 保存一个 token；密码不会持久化。新手引导通常会在首次连接时
生成一个用于共享密钥认证的 gateway token，但当 `gateway.auth.mode` 为 `"password"` 时，
密码认证也同样可用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到控制 UI 时，Gateway 网关
会要求进行**一次性配对批准**——即使你位于同一个 Tailnet 上，
且 `gateway.auth.allowTailscale: true` 也是如此。这是一项安全措施，
用于防止未经授权的访问。

**你会看到：** “disconnected (1008): pairing required”

**批准设备：**

```bash
# 列出待处理请求
openclaw devices list

# 按请求 ID 批准
openclaw devices approve <requestId>
```

如果浏览器在配对重试时更改了认证详情（role / scopes / public
key），之前的待处理请求会被替换，并创建新的 `requestId`。
请在批准前重新运行 `openclaw devices list`。

如果浏览器已经完成配对，而你将其从只读访问更改为
写入 / 管理访问，这会被视为批准升级，而不是静默重连。
OpenClaw 会保持原有批准继续生效，阻止更宽泛权限的重连，
并要求你显式批准新的作用域集合。

一旦批准，设备就会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，
否则无需再次批准。关于 token 轮换和撤销，请参见
[Devices CLI](/zh-CN/cli/devices)。

**说明：**

- 直接的本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会
  自动批准。
- Tailnet 和 LAN 浏览器连接仍然需要显式批准，即使
  它们来自同一台机器。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或
  清除浏览器数据都需要重新配对。

## 语言支持

控制 UI 可以在首次加载时根据你的浏览器语言环境进行本地化。
如果之后想覆盖它，请打开 **Overview -> Gateway Access -> Language**。该
语言选择器位于 Gateway Access 卡片中，而不在 Appearance 下。

- 支持的语言环境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`tr`、`uk`、`id`、`pl`
- 非英语翻译会在浏览器中按需延迟加载。
- 所选语言环境会保存在浏览器存储中，并在后续访问时复用。
- 缺失的翻译键会回退为英语。

## 当前可执行的操作

- 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）
- 在聊天中流式显示工具调用 + 实时工具输出卡片（智能体事件）
- 渠道：内置渠道以及内置 / 外部渠道插件的状态、QR 登录和每渠道配置（`channels.status`、`web.login.*`、`config.patch`）
- 实例：在线列表 + 刷新（`system-presence`）
- 会话：列表 + 每会话模型 / thinking / fast / verbose / trace / reasoning 覆盖（`sessions.list`、`sessions.patch`）
- Dreams：dreaming 状态、启用 / 禁用切换和 Dream Diary 阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）
- Cron 作业：列出 / 添加 / 编辑 / 运行 / 启用 / 禁用 + 运行历史（`cron.*`）
- Skills：状态、启用 / 禁用、安装、API key 更新（`skills.*`）
- 节点：列表 + 能力（`node.list`）
- 执行批准权限：编辑 gateway 或节点允许列表 + `exec host=gateway/node` 的询问策略（`exec.approvals.*`）
- 配置：查看 / 编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）
- 配置：带验证的应用 + 重启（`config.apply`），并唤醒上次活动的会话
- 配置写入包含 base-hash 保护，以防覆盖并发编辑
- 配置写入（`config.set` / `config.apply` / `config.patch`）还会对所提交配置负载中的活跃 SecretRef 解析进行预检；无法解析的活跃已提交引用会在写入前被拒绝
- 配置 schema + 表单渲染（`config.schema` / `config.schema.lookup`，
  包括字段 `title` / `description`、匹配的 UI 提示、直接子项
  摘要、嵌套对象 / 通配符 / 数组 / 组合节点上的文档元数据，
  以及可用时的 plugin + 渠道 schema）；仅当快照具备安全的原始往返能力时，
  才提供 Raw JSON 编辑器
- 如果某个快照无法安全地往返原始文本，控制 UI 会强制使用 Form 模式，并为该快照禁用 Raw 模式
- 结构化 SecretRef 对象值会在表单文本输入中以只读方式呈现，以防意外将对象损坏为字符串
- 调试：status / health / models 快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）
- 日志：带筛选 / 导出的 gateway 文件日志实时 tail（`logs.tail`）
- 更新：运行 package / git 更新 + 重启（`update.run`），并附带重启报告

Cron 作业面板说明：

- 对于隔离作业，投递默认是播报摘要。如果你希望仅供内部运行，可以切换为 none。
- 选择 announce 时，会显示 channel / target 字段。
- Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
- 对于主会话作业，可使用 webhook 和 none 投递模式。
- 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确 / 错峰选项、
  智能体 model / thinking 覆盖，以及尽力投递切换。
- 表单验证为内联字段级错误；在修复前，无效值会禁用保存按钮。
- 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，webhook 将在无 auth 标头的情况下发送。
- 已弃用的回退：已存储的旧版作业若带有 `notify: true`，在迁移前仍可使用 `cron.webhook`。

## 聊天行为

- `chat.send` 是**非阻塞**的：它会立即以 `{ runId, status: "started" }` 确认，响应则通过 `chat` 事件流式返回。
- 使用相同的 `idempotencyKey` 重新发送时，运行中会返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
- `chat.history` 响应有大小上限，以确保 UI 安全。当转录条目过大时，Gateway 网关可能会截断长文本字段、省略重量级元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
- `chat.history` 还会从可见的助手文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块）、以及泄露的 ASCII / 全角模型控制 token，并省略那些其全部可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 的助手条目。
- `chat.inject` 会向会话转录追加一条助手备注，并广播 `chat` 事件用于仅 UI 更新（不会触发智能体运行，也不会向渠道投递）。
- 聊天头部的 model 和 thinking 选择器会立即通过 `sessions.patch` 修改当前活动会话；它们是持久化的会话覆盖，而不是只针对单轮发送的选项。
- 停止：
  - 点击 **Stop**（调用 `chat.abort`）
  - 输入 `/stop`（或独立的中止短语，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以进行带外中止
  - `chat.abort` 支持 `{ sessionKey }`（无需 `runId`）来中止该会话的所有活动运行
- 中止后的部分保留：
  - 当某次运行被中止时，部分助手文本仍然可以在 UI 中显示
  - 当存在缓冲输出时，Gateway 网关会将中止时的部分助手文本持久化到转录历史中
  - 持久化条目包含中止元数据，以便转录消费者能够区分中止的部分输出和正常完成输出

## 托管嵌入

助手消息可以通过 `[embed ...]`
短代码以内联方式渲染托管的网页内容。iframe 沙箱策略由
`gateway.controlUi.embedSandbox` 控制：

- `strict`：禁用托管嵌入中的脚本执行
- `scripts`：允许交互式嵌入，同时保持源隔离；这是
  默认值，通常足以支持自包含的浏览器游戏 / 小部件
- `trusted`：在 `allow-scripts` 之上额外添加 `allow-same-origin`，用于同站点
  且确实需要更高权限的文档

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

仅当被嵌入文档确实需要 same-origin
行为时才使用 `trusted`。对于大多数智能体生成的游戏和交互式画布，`scripts` 是
更安全的选择。

绝对外部 `http(s)` 嵌入 URL 默认仍会被阻止。如果你
确实希望加载第三方页面形式的 `[embed url="https://..."]`，请设置
`gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

### 集成的 Tailscale Serve（首选）

让 Gateway 网关保持在 loopback 上，并让 Tailscale Serve 使用 HTTPS 代理它：

```bash
openclaw gateway --tailscale serve
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，控制 UI / WebSocket Serve 请求
可以通过 Tailscale 身份标头
（`tailscale-user-login`）进行认证。OpenClaw
会通过使用 `tailscale whois` 解析 `x-forwarded-for` 地址
并将其与该标头进行匹配来验证身份，而且只有当
请求携带 Tailscale 的 `x-forwarded-*` 标头并命中 loopback 时才会接受这些身份。设置
`gateway.auth.allowTailscale: false` 可在 Serve 流量场景下也强制要求显式共享密钥
凭证。然后使用 `gateway.auth.mode: "token"` 或
`"password"`。
对于该异步 Serve 身份路径，来自同一客户端 IP
和同一 auth 作用域的失败认证尝试会在写入速率限制前被串行化处理。
因此，同一浏览器的并发错误重试在第二次请求时可能会显示 `retry later`，
而不是两个普通不匹配并行竞争。
无 token 的 Serve 认证假定 gateway 主机是可信的。如果该主机上
可能运行不受信任的本地代码，请要求使用 token / password 认证。

### 绑定到 tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

然后打开：

- `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

将匹配的共享密钥粘贴到 UI 设置中（作为
`connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

## 不安全的 HTTP

如果你通过普通 HTTP 打开仪表板（`http://<lan-ip>` 或 `http://<tailscale-ip>`），
浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，
OpenClaw 会**阻止**没有设备身份的控制 UI 连接。

有文档说明的例外情况：

- 仅 localhost 的不安全 HTTP 兼容模式，使用 `gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成 operator 控制 UI 认证
- 应急开关 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方式：** 使用 HTTPS（Tailscale Serve）或在本地打开 UI：

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

`allowInsecureAuth` 只是本地兼容性开关：

- 它允许 localhost 控制 UI 会话在非安全 HTTP 上下文中
  无需设备身份即可继续。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

**仅限应急使用：**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` 会禁用控制 UI 的设备身份检查，这是一次
严重的安全降级。请在紧急使用后尽快恢复。

trusted-proxy 说明：

- 成功的 trusted-proxy 认证可以允许**operator** 控制 UI 会话在无
  设备身份的情况下接入
- 这**不**适用于 node 角色的控制 UI 会话
- 同一主机上的 loopback 反向代理仍然不能满足 trusted-proxy 认证；参见
  [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)

有关 HTTPS 设置指南，请参见 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

控制 UI 内置了严格的 `img-src` 策略：仅允许**同源**资源和 `data:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且不会发起网络请求。

这在实践中的含义是：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍可正常渲染。
- 内联 `data:image/...` URL 仍可正常渲染（这对协议内负载很有用）。
- 渠道元数据输出的远程头像 URL 会在控制 UI 的头像辅助函数中被剥离，并替换为内置 logo / badge，因此即使某个渠道被攻破或存在恶意行为，也无法强制 operator 浏览器任意抓取远程图片。

你无需做任何改动即可获得该行为——它始终启用，且不可配置。

## 头像路由认证

当 gateway 认证已配置时，控制 UI 头像端点需要与其余 API 相同的 gateway token：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在同样规则下返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与同级 assistant-media 路由保持一致）。这可防止头像路由在本应受到保护的主机上泄露智能体身份。
- 控制 UI 本身在拉取头像时会将 gateway token 作为 bearer 标头转发，并使用已认证的 blob URL，因此图片仍可在仪表板中渲染。

如果你禁用了 gateway 认证（不建议在共享主机上这样做），则头像路由也会与 gateway 其余部分保持一致，变为无需认证。

## 构建 UI

Gateway 网关会从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对 base（当你希望使用固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试 / 测试：开发服务器 + 远程 Gateway 网关

控制 UI 是静态文件；WebSocket 目标可配置，并且可以
不同于 HTTP 源。当你希望在本地运行 Vite 开发服务器、
而 Gateway 网关运行在其他位置时，这会非常方便。

1. 启动 UI 开发服务器：`pnpm ui:dev`
2. 打开如下 URL：

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

可选的一次性认证（如果需要）：

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

说明：

- `gatewayUrl` 会在加载后存储到 localStorage 中，并从 URL 中移除。
- `token` 应尽可能通过 URL 片段（`#token=...`）传递。片段不会发送到服务器，因此可避免请求日志和 Referer 泄露。旧版 `?token=` 查询参数仍会出于兼容性被一次性导入，但仅作为回退，并会在引导后立即移除。
- `password` 仅保存在内存中。
- 设置 `gatewayUrl` 后，UI 不会回退到配置或环境变量凭证。
  请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
- 当 Gateway 网关位于 TLS 后方时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
- `gatewayUrl` 仅在顶层窗口中接受（不能嵌入），以防止点击劫持。
- 非 loopback 的控制 UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`
  （完整 origin）。这也包括远程开发环境设置。
- 除非是受到严格控制的
  本地测试，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允许任意浏览器源，而不是“匹配我
  当前使用的任意主机”。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用
  Host 标头 origin 回退模式，但这是一种危险的安全模式。

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

远程访问设置详情：[Remote access](/zh-CN/gateway/remote)。

## 相关内容

- [Dashboard](/zh-CN/web/dashboard) —— gateway 仪表板
- [WebChat](/zh-CN/web/webchat) —— 基于浏览器的聊天界面
- [TUI](/zh-CN/web/tui) —— 终端用户界面
- [Health Checks](/zh-CN/gateway/health) —— gateway 健康监控
