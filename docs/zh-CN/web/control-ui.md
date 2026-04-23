---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你希望在不使用 SSH 隧道的情况下获得 Tailnet 访问权限
summary: 用于 Gateway 网关的基于浏览器的控制 UI（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-23T19:21:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: b03ccc9de2a46c386955f6038a3bb590d7d51f988134b9980ff8489582cb2273
    source_path: web/control-ui.md
    workflow: 15
---

# 控制 UI（浏览器）

控制 UI 是一个由 Gateway 网关提供的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接连接到 Gateway 网关 WebSocket**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台电脑上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

身份验证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用受信任代理身份标头

仪表板设置面板会为当前浏览器标签页会话保存一个令牌和所选的 Gateway 网关 URL；密码不会被持久化。新手引导通常会在首次连接时为共享密钥身份验证生成一个 gateway token，但当 `gateway.auth.mode` 为 `"password"` 时，密码身份验证也可正常使用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到控制 UI 时，Gateway 网关会要求进行**一次性配对批准**——即使你已在同一个 Tailnet 中，且 `gateway.auth.allowTailscale: true`。这是为了防止未经授权访问的安全措施。

**你将看到：** “已断开连接（1008）：需要配对”

**批准设备的方法：**

```bash
# 列出待处理请求
openclaw devices list

# 按请求 ID 批准
openclaw devices approve <requestId>
```

如果浏览器在身份验证详情发生变化后重试配对（角色 / 范围 / 公钥），之前待处理的请求会被替代，并创建新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已经完成配对，而你将其从只读访问改为写入 / 管理员访问，这会被视为批准升级，而不是静默重连。OpenClaw 会保留旧批准有效，阻止更高权限的重连，并要求你显式批准新的范围集合。

一旦获批，该设备就会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则无需再次批准。有关令牌轮换和撤销，请参阅 [Devices CLI](/zh-CN/cli/devices)。

**说明：**

- 直接通过本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动获批。
- Tailnet 和 LAN 浏览器连接仍然需要显式批准，即使它们来自同一台机器。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据都需要重新配对。

## 个人身份（浏览器本地）

控制 UI 支持按浏览器设置个人身份（显示名称和头像），它会附加到发出的消息中，以便在共享会话中标注来源。它存储在浏览器中，作用域仅限于当前浏览器配置文件，不会同步到其他设备，也不会在服务器端持久化，除了你实际发送的消息中正常的对话记录作者元数据。清除站点数据或切换浏览器后，它会重置为空。

## 运行时配置端点

控制 UI 会从 ` /__openclaw/control-ui-config.json` 获取其运行时设置。该端点与其他 HTTP 接口一样受相同的 gateway auth 保护：未认证的浏览器无法获取它，而成功获取需要具备以下之一：已经有效的 gateway token / password、Tailscale Serve 身份，或受信任代理身份。

## 语言支持

控制 UI 可以在首次加载时根据你的浏览器语言环境进行本地化。若要稍后覆盖，请打开**概览 -> Gateway 访问 -> 语言**。语言选择器位于 Gateway 访问卡片中，而不在外观设置下。

- 支持的语言环境：`en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 非英文翻译会在浏览器中按需懒加载。
- 所选语言环境会保存在浏览器存储中，并在之后的访问中复用。
- 缺失的翻译键会回退为英文。

## 它目前可以做什么

- 通过 Gateway WS 与模型聊天（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）
- 在聊天中流式显示工具调用和实时工具输出卡片（智能体事件）
- 渠道：内置以及内置 / 外部渠道插件状态、二维码登录、以及按渠道配置（`channels.status`, `web.login.*`, `config.patch`）
- 实例：在线列表 + 刷新（`system-presence`）
- 会话：列出会话 + 按会话设置 model / thinking / fast / verbose / trace / reasoning 覆盖项（`sessions.list`, `sessions.patch`）
- 梦境：Dreaming 状态、启用 / 禁用切换，以及 Dream Diary 读取器（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）
- Cron 作业：列出 / 添加 / 编辑 / 运行 / 启用 / 禁用 + 运行历史（`cron.*`）
- Skills：状态、启用 / 禁用、安装、API 密钥更新（`skills.*`）
- 节点：列出 + 能力上限（`node.list`）
- Exec 批准：编辑 gateway 或节点允许列表 + 为 `exec host=gateway/node` 设置询问策略（`exec.approvals.*`）
- 配置：查看 / 编辑 `~/.openclaw/openclaw.json`（`config.get`, `config.set`）
- 配置：应用并重启且带验证（`config.apply`），并唤醒最后一个活跃会话
- 配置写入包含 base-hash 保护，以防覆盖并发编辑
- 配置写入（`config.set` / `config.apply` / `config.patch`）还会对提交配置负载中的 ref 预先执行活跃 SecretRef 解析检查；无法解析的已提交活跃 ref 会在写入前被拒绝
- 配置 schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象 / 通配符 / 数组 / 组合节点上的文档元数据，以及可用时的插件 + 渠道 schema）；仅当快照可以安全进行原始往返时，才提供原始 JSON 编辑器
- 如果快照无法安全地进行原始文本往返，控制 UI 会强制使用表单模式，并为该快照禁用原始模式
- 原始 JSON 编辑器中的“重置为已保存”会保留原始编写的结构（格式、注释、`$include` 布局），而不是重新渲染展平后的快照，因此当快照可以安全往返时，外部编辑在重置后也能保留下来
- 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防止意外将对象损坏为字符串
- 调试：状态 / 健康 / 模型快照 + 事件日志 + 手动 RPC 调用（`status`, `health`, `models.list`）
- 日志：实时跟踪 Gateway 网关文件日志，并支持筛选 / 导出（`logs.tail`）
- 更新：运行 package / git 更新并重启（`update.run`），同时提供重启报告

Cron 作业面板说明：

- 对于隔离作业，投递方式默认是公告摘要。如果你只想内部运行，可以切换为 none。
- 选择 announce 后，会显示渠道 / 目标字段。
- Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
- 对于主会话作业，可以使用 webhook 和 none 投递模式。
- 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确 / 错开选项、智能体 model / thinking 覆盖，以及尽力投递切换。
- 表单验证是内联的，并带有字段级错误；在修复前，无效值会禁用保存按钮。
- 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，webhook 会在不带身份验证标头的情况下发送。
- 已弃用的回退方式：已存储的旧版作业若带有 `notify: true`，在迁移前仍可使用 `cron.webhook`。

## 聊天行为

- `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，响应则通过 `chat` 事件流式传输。
- 使用相同的 `idempotencyKey` 重新发送时，运行中会返回 `{ status: "in_flight" }`，完成后会返回 `{ status: "ok" }`。
- 出于 UI 安全考虑，`chat.history` 响应有大小限制。当对话记录条目过大时，Gateway 网关可能会截断长文本字段、省略体积较大的元数据块，并用占位符替换过大的消息（`[chat.history omitted: message too large]`）。
- 助手 / 生成的图像会作为受管媒体引用持久化，并通过经过认证的 Gateway 网关媒体 URL 返回，因此重新加载时不依赖聊天历史响应中保留原始 base64 图像负载。
- `chat.history` 还会从可见的助手文本中去除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块）、以及泄露的 ASCII / 全角模型控制令牌，并省略那些其全部可见文本仅为精确静默令牌 `NO_REPLY` / `no_reply` 的助手条目。
- `chat.inject` 会向会话对话记录附加一条助手备注，并广播一个 `chat` 事件用于仅 UI 更新（不运行智能体，不投递到渠道）。
- 聊天头部中的 model 和 thinking 选择器会立即通过 `sessions.patch` 修补活跃会话；它们是持久的会话覆盖项，而不是仅单轮发送选项。
- 停止：
  - 点击**停止**（调用 `chat.abort`）
  - 输入 `/stop`（或独立的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以进行带外中止
  - `chat.abort` 支持 `{ sessionKey }`（不带 `runId`），用于中止该会话的所有活跃运行
- 中止后的部分保留：
  - 当某次运行被中止时，UI 中仍可显示部分助手文本
  - 当存在缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到对话记录历史中
  - 持久化条目包含中止元数据，以便对话记录使用方区分中止产生的部分内容与正常完成输出

## 托管嵌入

助手消息可以通过 `[embed ...]`
短代码内联渲染托管的网页内容。iframe 沙箱策略由
`gateway.controlUi.embedSandbox` 控制：

- `strict`：禁用托管嵌入中的脚本执行
- `scripts`：允许交互式嵌入，同时保持源隔离；这是默认值，通常足以支持自包含的浏览器游戏 / 小组件
- `trusted`：在 `allow-scripts` 的基础上额外添加 `allow-same-origin`，用于有意需要更强权限的同站文档

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

仅当嵌入文档确实需要同源行为时，才使用 `trusted`。对于大多数由智能体生成的游戏和交互式画布，`scripts` 是更安全的选择。

绝对外部 `http(s)` 嵌入 URL 默认仍会被阻止。如果你明确希望加载 `[embed url="https://..."]` 的第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

### 集成的 Tailscale Serve（首选）

让 Gateway 网关保持在 loopback 上，并让 Tailscale Serve 通过 HTTPS 代理它：

```bash
openclaw gateway --tailscale serve
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，控制 UI / WebSocket Serve 请求可以通过 Tailscale 身份标头
（`tailscale-user-login`）进行身份验证。OpenClaw
会通过使用 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该标头匹配来验证身份，并且仅当请求通过 Tailscale 的 `x-forwarded-*` 标头命中 loopback 时才接受这些标头。若你希望即使对于 Serve 流量也要求显式共享密钥凭证，请设置
`gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或
`"password"`。
对于该异步 Serve 身份路径，来自同一客户端 IP 和身份验证范围的失败身份验证尝试，会在写入速率限制记录前进行串行化处理。因此，同一浏览器发起的并发错误重试，在第二个请求上可能显示 `retry later`，而不是两个普通不匹配请求并行竞争。
无 token 的 Serve 身份验证假设 gateway 主机是可信的。如果该主机上可能运行不受信任的本地代码，请要求使用 token / password 身份验证。

### 绑定到 tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

然后打开：

- `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

将匹配的共享密钥粘贴到 UI 设置中（作为
`connect.params.auth.token` 或 `connect.params.auth.password`
发送）。

## 不安全的 HTTP

如果你通过明文 HTTP 打开仪表板（`http://<lan-ip>` 或 `http://<tailscale-ip>`），
浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，
OpenClaw 会**阻止**没有设备身份的控制 UI 连接。

文档说明的例外情况：

- 仅限 localhost 的不安全 HTTP 兼容模式，使用 `gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作员控制 UI 身份验证
- 应急开关 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方式：** 使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 gateway 主机上）

**不安全身份验证开关行为：**

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

- 它允许 localhost 控制 UI 会话在非安全 HTTP 上下文中无设备身份继续进行。
- 它不会绕过配对检查。
- 它不会放宽远程（非 localhost）设备身份要求。

**仅限应急：**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` 会禁用控制 UI 设备身份检查，这是严重的安全降级。紧急使用后应尽快恢复。

受信任代理说明：

- 成功的 trusted-proxy 身份验证可允许**操作员**控制 UI 会话在无设备身份的情况下接入
- 这**不适用于** node-role 控制 UI 会话
- 同主机的 loopback 反向代理仍然不能满足 trusted-proxy 身份验证；请参阅
  [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)

有关 HTTPS 设置指导，请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

控制 UI 内置了严格的 `img-src` 策略：只允许**同源**资源和 `data:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且不会发起网络请求。

这在实际中的含义：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍可正常渲染。
- 内联 `data:image/...` URL 仍可正常渲染（对协议内负载很有用）。
- 由渠道元数据输出的远程头像 URL 会在控制 UI 的头像辅助函数中被移除，并替换为内置 logo / badge，因此受损或恶意的渠道无法强制操作员浏览器发起任意远程图片请求。

你无需做任何更改即可获得此行为——它始终启用且不可配置。

## 头像路由身份验证

配置了 gateway auth 后，控制 UI 头像端点要求与其他 API 相同的 gateway token：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对这两个路由的未认证请求都会被拒绝（与同级的助手媒体路由一致）。这可防止头像路由在其他方面受保护的主机上泄露智能体身份。
- 控制 UI 本身在获取头像时会将 gateway token 作为 bearer 标头转发，并使用已认证的 blob URL，因此图像仍能在仪表板中渲染。

如果你禁用了 gateway auth（不建议在共享主机上这样做），头像路由也会与 gateway 的其他部分一样变为无需认证。

## 构建 UI

Gateway 网关会从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选绝对 base（当你想要固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（单独的开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试 / 测试：开发服务器 + 远程 Gateway 网关

控制 UI 是静态文件；WebSocket 目标可配置，并且可以
不同于 HTTP 来源。当你希望本地运行 Vite 开发服务器，
但 Gateway 网关运行在其他地方时，这非常方便。

1. 启动 UI 开发服务器：`pnpm ui:dev`
2. 打开如下 URL：

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

可选的一次性身份验证（如需要）：

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

说明：

- `gatewayUrl` 会在加载后存储到 localStorage 中，并从 URL 中移除。
- `token` 应尽可能通过 URL 片段（`#token=...`）传递。片段不会发送到服务器，这样可以避免请求日志和 Referer 泄露。旧版 `?token=` 查询参数仍会出于兼容性被一次性导入，但仅作为回退，并会在启动后立即移除。
- `password` 仅保存在内存中。
- 设置了 `gatewayUrl` 时，UI 不会回退到配置或环境凭证。
  请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
- 当 Gateway 网关位于 TLS 后面时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
- `gatewayUrl` 仅在顶层窗口中接受（非嵌入），以防止点击劫持。
- 非 loopback 的控制 UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`
  （完整 origin）。这也包括远程开发配置。
- 除严格受控的本地测试外，不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。
  这表示允许任意浏览器 origin，而不是“匹配我当前使用的任何主机”。
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

远程访问设置详情：[远程访问](/zh-CN/gateway/remote)。

## 相关内容

- [Dashboard](/zh-CN/web/dashboard) — gateway 仪表板
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [Health Checks](/zh-CN/gateway/health) — gateway 健康监控
