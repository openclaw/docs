---
read_when:
    - 你想从浏览器操作 Gateway 网关
    - 你想在不使用 SSH 隧道的情况下通过 Tailnet 访问
summary: Gateway 网关的基于浏览器的控制 UI（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-05T10:13:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1568680a07907343352dbb3a2e6a1b896826404a7d8baba62512f03eac28e3d7
    source_path: web/control-ui.md
    workflow: 15
---

# 控制 UI（浏览器）

控制 UI 是一个由 Gateway 网关提供的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会**直接连接到同一端口上的 Gateway 网关 WebSocket**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台电脑上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面无法加载，请先启动 Gateway 网关：`openclaw gateway`。

鉴权会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用 trusted-proxy 身份头

控制面板设置面板会为当前浏览器标签页会话保留 token 和所选 Gateway 网关 URL；不会持久化密码。新手引导通常会在首次连接时为共享密钥鉴权生成一个 gateway token，但当 `gateway.auth.mode` 为 `"password"` 时，密码鉴权同样可用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到控制 UI 时，Gateway 网关会要求进行**一次性配对批准**——即使你位于同一个 Tailnet 中并且设置了 `gateway.auth.allowTailscale: true`。这是一项安全措施，用于防止未授权访问。

**你会看到：** “disconnected (1008): pairing required”

**批准设备的方法：**

```bash
# 列出待处理请求
openclaw devices list

# 按请求 ID 批准
openclaw devices approve <requestId>
```

如果浏览器使用变更后的鉴权信息（角色/作用域/公钥）重试配对，之前的待处理请求会被新的请求取代，并创建新的 `requestId`。批准前请重新运行 `openclaw devices list`。

一旦获得批准，该设备就会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则无需再次批准。有关 token 轮换和撤销，请参阅 [Devices CLI](/cli/devices)。

**说明：**

- 直接本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会被自动批准。
- Tailnet 和 LAN 浏览器连接仍然需要显式批准，即使它们来自同一台机器。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据会需要重新配对。

## 语言支持

控制 UI 可在首次加载时根据你的浏览器语言环境进行本地化，你也可以稍后通过 Access 卡片中的语言选择器进行覆盖。

- 支持的语言环境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`
- 非英文翻译会在浏览器中按需懒加载。
- 所选语言环境会保存在浏览器存储中，并在未来访问时复用。
- 缺失的翻译键会回退为英文。

## 它今天可以做什么

- 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）
- 在聊天中流式显示工具调用和实时工具输出卡片（智能体事件）
- 渠道：内置以及内置/外部插件渠道的状态、QR 登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）
- 实例：在线列表 + 刷新（`system-presence`）
- 会话：列表 + 按会话设置 model/thinking/fast/verbose/reasoning 覆盖（`sessions.list`、`sessions.patch`）
- Cron 作业：列出/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）
- Skills：状态、启用/禁用、安装、API 密钥更新（`skills.*`）
- 节点：列表 + 能力（`node.list`）
- Exec 批准：编辑 gateway 或 node 的允许列表 + `exec host=gateway/node` 的询问策略（`exec.approvals.*`）
- 配置：查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）
- 配置：带校验地应用 + 重启（`config.apply`），并唤醒最后活跃会话
- 配置写入包含基于哈希的保护，以防覆盖并发编辑
- 配置写入（`config.set`/`config.apply`/`config.patch`）还会对提交的配置负载中的活跃 SecretRef 引用进行预检解析；如果提交中的活跃引用无法解析，会在写入前被拒绝
- 配置模式 + 表单渲染（`config.schema` / `config.schema.lookup`，
  包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及可用时的插件 + 渠道模式）；仅当快照具备安全的原始文本往返能力时，才提供 Raw JSON 编辑器
- 如果某个快照无法安全地往返原始文本，控制 UI 会强制使用 Form 模式，并为该快照禁用 Raw 模式
- 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防意外将对象损坏为字符串
- 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）
- 日志：带过滤/导出的 gateway 文件日志实时尾随（`logs.tail`）
- 更新：运行 package/git 更新 + 重启（`update.run`），并生成重启报告

Cron 作业面板说明：

- 对于隔离作业，投递默认会公告摘要。若你只想进行内部运行，可切换为 none。
- 选择 announce 时会显示 channel/target 字段。
- Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
- 对于主会话作业，支持 webhook 和 none 投递模式。
- 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确/错峰选项、
  智能体 model/thinking 覆盖，以及 best-effort 投递开关。
- 表单校验为内联并带有字段级错误；在修复前，无效值会禁用保存按钮。
- 设置 `cron.webhookToken` 可发送专用 bearer token；如省略，则 webhook 将在不带鉴权头的情况下发送。
- 已弃用的回退：在迁移前，带有 `notify: true` 的旧版已存储作业仍可使用 `cron.webhook`。

## 聊天行为

- `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，响应会通过 `chat` 事件流式传回。
- 使用相同的 `idempotencyKey` 重新发送时，运行中会返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
- 出于 UI 安全考虑，`chat.history` 响应有大小限制。当转录条目过大时，Gateway 网关可能会截断较长文本字段、省略较重的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
- `chat.history` 还会从可见助手文本中去除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和被截断的工具调用块），以及泄露的 ASCII/全角模型控制 token，并省略那些其全部可见文本仅为精确静默令牌 `NO_REPLY` / `no_reply` 的助手条目。
- `chat.inject` 会向会话转录追加一条助手注释，并广播一个 `chat` 事件以进行仅 UI 更新（不运行智能体，不进行渠道投递）。
- 聊天头部的 model 和 thinking 选择器会通过 `sessions.patch` 立即修补当前活跃会话；它们是持久化的会话覆盖，而不是仅一次发送选项。
- 停止：
  - 点击 **Stop**（调用 `chat.abort`）
  - 输入 `/stop`（或独立的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）进行带外中止
  - `chat.abort` 支持 `{ sessionKey }`（无需 `runId`）以中止该会话的所有活跃运行
- 中止部分保留：
  - 当某个运行被中止时，UI 中仍可能显示部分助手文本
  - 当存在缓冲输出时，Gateway 网关会将被中止的部分助手文本持久化到转录历史中
  - 持久化条目会包含中止元数据，以便转录消费者区分中止的部分输出和正常完成输出

## Tailnet 访问（推荐）

### 集成式 Tailscale Serve（首选）

让 Gateway 网关保持在 loopback 上，并由 Tailscale Serve 使用 HTTPS 代理它：

```bash
openclaw gateway --tailscale serve
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，控制 UI/WebSocket Serve 请求可通过 Tailscale 身份头
（`tailscale-user-login`）进行鉴权。OpenClaw
会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并与该头匹配来验证身份，并且只有当请求命中 loopback 且带有 Tailscale 的 `x-forwarded-*` 头时才会接受这些头。如果你希望即使对于 Serve 流量也要求显式共享密钥凭证，请设置
`gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或
`"password"`。
对于这个异步 Serve 身份路径，来自同一客户端 IP 和鉴权范围的失败鉴权尝试会在写入速率限制之前进行串行化。因此，来自同一浏览器的并发错误重试在第二次请求时可能会显示 `retry later`，而不是两个普通不匹配并行竞争。
无 token 的 Serve 鉴权假设 gateway host 是受信任的。如果该主机上可能运行不受信任的本地代码，请要求 token/password 鉴权。

### 绑定到 tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

然后打开：

- `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

将匹配的共享密钥粘贴到 UI 设置中（作为
`connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

## 不安全的 HTTP

如果你通过明文 HTTP 打开控制面板（`http://<lan-ip>` 或 `http://<tailscale-ip>`），
浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，
OpenClaw 会**阻止**没有设备身份的控制 UI 连接。

文档化的例外情况：

- 通过 `gateway.controlUi.allowInsecureAuth=true` 启用的仅 localhost 不安全 HTTP 兼容模式
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功进行的 operator 控制 UI 鉴权
- 紧急放行 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方式：** 使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 gateway host 上）

**不安全鉴权开关行为：**

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

- 它允许 localhost 控制 UI 会话在非安全 HTTP 上下文中没有设备身份也能继续。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

**仅限紧急放行：**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` 会禁用控制 UI 设备身份检查，这是严重的安全降级。应在紧急使用后尽快恢复。

Trusted-proxy 说明：

- 成功的 trusted-proxy 鉴权可以允许**operator** 控制 UI 会话在没有设备身份的情况下进入
- 这**不**适用于 node 角色的控制 UI 会话
- 同主机 loopback 反向代理仍然不能满足 trusted-proxy 鉴权；请参阅
  [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)

有关 HTTPS 设置指南，请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build # auto-installs UI deps on first run
```

可选的绝对基础路径（当你想使用固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立 dev server）：

```bash
pnpm ui:dev # auto-installs UI deps on first run
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试/测试：dev server + 远程 Gateway

控制 UI 是静态文件；WebSocket 目标可配置，并且可以与 HTTP 来源不同。当你希望本地运行 Vite dev server，但 Gateway 网关运行在其他地方时，这非常有用。

1. 启动 UI dev server：`pnpm ui:dev`
2. 打开如下 URL：

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

可选的一次性鉴权（如有需要）：

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

说明：

- `gatewayUrl` 会在加载后存储到 localStorage 中，并从 URL 中移除。
- `token` 应尽可能通过 URL 片段（`#token=...`）传递。片段不会发送到服务器，这可以避免请求日志和 Referer 泄露。出于兼容性，旧版 `?token=` 查询参数仍会作为回退被一次性导入，但仅作为备用方案，并会在引导后立即移除。
- `password` 只保存在内存中。
- 当设置了 `gatewayUrl` 时，UI 不会回退到配置或环境凭证。
  请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
- 当 Gateway 网关位于 TLS 后面时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
- `gatewayUrl` 仅在顶级窗口中被接受（不能嵌入），以防点击劫持。
- 非 loopback 的控制 UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`
  （完整 origin）。这也包括远程开发设置。
- 除了严格受控的本地测试外，请不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。
  它的含义是允许任意浏览器 origin，而不是“匹配我正在使用的任何主机”。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用
  Host 头 origin 回退模式，但这是危险的安全模式。

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

远程访问设置细节：[远程访问](/zh-CN/gateway/remote)。

## 相关内容

- [控制面板](/web/dashboard) — gateway 控制面板
- [WebChat](/web/webchat) — 基于浏览器的聊天界面
- [TUI](/web/tui) — 终端用户界面
- [健康检查](/zh-CN/gateway/health) — gateway 健康监控
