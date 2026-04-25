---
read_when:
    - 你想从浏览器中操作 Gateway 网关
    - 你希望在无需 SSH 隧道的情况下获得 Tailnet 访问能力
summary: Gateway 网关的基于浏览器的控制 UI（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-25T09:51:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: d63d2e6a33fe87103c6265532a8742e08b3dd15124ce8b876ed280aea5f55a9d
    source_path: web/control-ui.md
    workflow: 15
---

Control UI 是一个由 Gateway 网关提供服务的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接连接到 Gateway WebSocket**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台计算机上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面无法加载，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时，使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时，使用 trusted-proxy 身份标头

仪表板设置面板会为当前浏览器标签页会话保存一个 token
以及所选的 Gateway 网关 URL；密码不会被持久化。新手引导通常会在首次连接时
为共享密钥认证生成一个 gateway token，但当 `gateway.auth.mode` 为 `"password"` 时，
密码认证也可以使用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关
需要进行**一次性配对批准**——即使你位于同一个 Tailnet 中，
并且设置了 `gateway.auth.allowTailscale: true` 也是如此。这是一项安全措施，
用于防止未授权访问。

**你会看到：**“已断开连接（1008）：需要配对”

**批准设备的方法：**

```bash
# 列出待处理请求
openclaw devices list

# 按请求 ID 批准
openclaw devices approve <requestId>
```

如果浏览器在重试配对时更改了认证详情（角色 / scopes / 公钥），
之前的待处理请求会被替代，并创建一个新的 `requestId`。
批准前请重新运行 `openclaw devices list`。

如果浏览器已经完成配对，而你将其访问权限从只读更改为
写入 / 管理员访问，这会被视为批准升级，而不是静默重新连接。
OpenClaw 会保持旧批准继续有效，阻止更高权限的重新连接，
并要求你明确批准新的作用域集合。

批准完成后，系统会记住该设备，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，
否则无需再次批准。有关 token 轮换和撤销，请参见
[Devices CLI](/zh-CN/cli/devices)。

**注意：**

- 直接的本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）
  会被自动批准。
- Tailnet 和 LAN 浏览器连接仍然需要显式批准，即使
  它们来自同一台机器。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或
  清除浏览器数据都需要重新配对。

## 个人身份（浏览器本地）

Control UI 支持按浏览器保存个人身份（显示名称和头像），
它会附加到发出的消息中，用于在共享会话中标注来源。该信息
存储在浏览器存储中，仅限当前浏览器配置文件，不会同步到其他设备，
也不会在服务端持久化，除非是你实际发送的消息中所包含的
常规消息作者元数据。清除站点数据或切换浏览器会将其重置为空。

## 运行时配置端点

Control UI 会从
`/__openclaw/control-ui-config.json` 获取其运行时设置。该端点
受到与其余 Gateway 网关 HTTP 接口相同的网关认证保护：未认证的浏览器无法获取它，
而成功获取则要求具备以下任一条件：已有有效的 gateway token / password、
Tailscale Serve 身份，或 trusted-proxy 身份。

## 语言支持

Control UI 可以在首次加载时根据你的浏览器语言环境进行本地化。
若要稍后覆盖它，请打开 **概览 -> Gateway Access -> 语言**。语言选择器
位于 Gateway Access 卡片中，而不是在外观设置下。

- 支持的语言环境：`en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 非英语翻译会在浏览器中按需懒加载。
- 所选语言环境会保存到浏览器存储中，并在未来访问时复用。
- 缺失的翻译键会回退到英语。

## 它目前能做什么

- 通过 Gateway WS 与模型聊天（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）
- 通过 WebRTC 直接从浏览器连接到 OpenAI Realtime。Gateway 网关
  使用 `talk.realtime.session` 签发一个短期有效的 Realtime 客户端密钥；浏览器
  将麦克风音频直接发送给 OpenAI，并通过 `chat.send`
  将 `openclaw_agent_consult` 工具调用中继回更大规模、已配置的
  OpenClaw 模型。
- 在聊天中流式显示工具调用 + 实时工具输出卡片（智能体事件）
- 渠道：内置渠道以及内置 / 外部渠道插件的状态、二维码登录和按渠道配置（`channels.status`, `web.login.*`, `config.patch`）
- 实例：在线状态列表 + 刷新（`system-presence`）
- 会话：列表 + 每个会话的模型 / 思考 / 快速 / 详细 / 跟踪 / 推理覆盖设置（`sessions.list`, `sessions.patch`）
- Dreams：Dreaming 状态、启用 / 禁用切换，以及 Dream Diary 阅读器（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）
- Cron 作业：列出 / 添加 / 编辑 / 运行 / 启用 / 禁用 + 运行历史（`cron.*`）
- Skills：状态、启用 / 禁用、安装、API key 更新（`skills.*`）
- 节点：列表 + 能力（`node.list`）
- Exec 批准：编辑 gateway 或节点允许列表 + 为 `exec host=gateway/node` 设置询问策略（`exec.approvals.*`）
- 配置：查看 / 编辑 `~/.openclaw/openclaw.json`（`config.get`, `config.set`）
- 配置：带验证地应用 + 重启（`config.apply`），并唤醒最后一个活跃会话
- 配置写入包含 base-hash 保护，以防止覆盖并发编辑
- 配置写入（`config.set` / `config.apply` / `config.patch`）还会在写入前，
  对已提交配置负载中的引用执行活跃 `SecretRef` 解析预检查；无法解析的已提交活跃引用会在写入前被拒绝
- 配置 schema + 表单渲染（`config.schema` / `config.schema.lookup`，
  包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、
  嵌套对象 / 通配符 / 数组 / 组合节点上的文档元数据，
  以及在可用时的插件 + 渠道 schema）；仅当快照能够安全地进行原始往返时，
  才提供原始 JSON 编辑器
- 如果快照无法安全地进行原始往返，Control UI 会强制使用表单模式，并为该快照禁用原始模式
- 原始 JSON 编辑器中的“重置为已保存”会保留原始编写的结构（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此在快照能够安全原样往返时，外部编辑在重置后仍会保留
- 结构化 `SecretRef` 对象值会在表单文本输入中以只读方式呈现，以防止意外将对象损坏为字符串
- 调试：状态 / 健康 / 模型快照 + 事件日志 + 手动 RPC 调用（`status`, `health`, `models.list`）
- 日志：支持过滤 / 导出的 gateway 文件日志实时 tail（`logs.tail`）
- 更新：运行 package / git 更新 + 重启（`update.run`），并提供重启报告

Cron 作业面板说明：

- 对于隔离作业，默认投递方式为发送摘要公告。若你希望仅进行内部运行，可以切换为 none。
- 选择 announce 时会显示渠道 / 目标字段。
- Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
- 对于主会话作业，可用的投递模式包括 webhook 和 none。
- 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确 / 错峰选项、
  智能体模型 / 思考覆盖，以及尽力投递切换。
- 表单验证为内联形式，并带有字段级错误；在修复之前，无效值会禁用保存按钮。
- 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，则 webhook 将在没有认证标头的情况下发送。
- 已弃用的回退方式：已存储的旧版作业若带有 `notify: true`，在迁移前仍可使用 `cron.webhook`。

## 聊天行为

- `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，随后响应通过 `chat` 事件流式传输。
- 使用相同的 `idempotencyKey` 重新发送时，运行中会返回 `{ status: "in_flight" }`，完成后会返回 `{ status: "ok" }`。
- 出于 UI 安全考虑，`chat.history` 响应有大小限制。当会话记录条目过大时，Gateway 网关可能会截断较长文本字段、省略较重的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
- 助手 / 生成的图像会作为受管媒体引用持久化，并通过需要认证的 Gateway 网关媒体 URL 再次提供，因此重新加载不会依赖原始 base64 图像负载继续保留在聊天历史响应中。
- `chat.history` 还会从可见的助手文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 以及被截断的工具调用块），以及泄露的 ASCII / 全角模型控制 token，并省略那些整个可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 的助手条目。
- 在活动发送期间以及最终历史刷新时，如果 `chat.history` 短暂返回
  较旧的快照，聊天视图会保留本地乐观显示的用户 / 助手消息；
  一旦 Gateway 网关历史追上，这些本地消息就会被规范会话记录替换。
- `chat.inject` 会向会话记录追加一条助手备注，并广播一个 `chat` 事件用于仅 UI 更新（不运行智能体，不进行渠道投递）。
- 聊天标题中的模型和思考选择器会通过 `sessions.patch` 立即修补当前活跃会话；它们是持久性的会话覆盖设置，而不是仅单轮发送选项。
- 当最新的 Gateway 网关会话用量报告显示上下文压力较高时，聊天
  输入区域会显示上下文提示，并且在建议压缩级别下会出现一个
  compact 按钮，用于运行正常的会话压缩路径。在 Gateway 网关再次报告最新用量之前，
  过期的 token 快照会被隐藏。
- Talk 模式使用支持浏览器 WebRTC 会话的已注册实时语音 provider。请使用
  `talk.provider: "openai"` 并配置 `talk.providers.openai.apiKey`，
  或复用 Voice Call 实时 provider 配置。浏览器永远不会收到标准的 OpenAI API key；
  它收到的只有临时 Realtime 客户端密钥。Google Live 实时语音
  支持后端 Voice Call 和 Google Meet bridge，但暂不支持此浏览器
  WebRTC 路径。Realtime 会话提示词由 Gateway 网关组装；
  `talk.realtime.session` 不接受调用方提供的指令覆盖。
- 在聊天输入区中，Talk 控件是麦克风听写按钮旁边的
  波形按钮。当 Talk 启动时，输入区状态行会显示
  `Connecting Talk...`，然后在音频连接时显示 `Talk live`，或在
  实时工具调用通过 `chat.send` 咨询已配置的大模型时显示
  `Asking OpenClaw...`。
- 停止：
  - 点击 **Stop**（调用 `chat.abort`）
  - 当某次运行处于活动状态时，普通后续消息会进入队列。点击排队消息上的 **Steer** 可将该后续消息注入当前运行轮次。
  - 输入 `/stop`（或单独的中止短语，如 `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`）即可进行带外中止
  - `chat.abort` 支持 `{ sessionKey }`（不带 `runId`），用于中止该会话的所有活动运行
- 中止后的部分保留：
  - 当一次运行被中止时，部分助手文本仍可能显示在 UI 中
  - 当存在缓冲输出时，Gateway 网关会将中止时的部分助手文本持久化到会话记录历史中
  - 持久化条目包含中止元数据，因此会话记录使用方可以区分中止部分内容与正常完成输出

## 托管嵌入

助手消息可以使用 `[embed ...]`
短代码内联渲染托管网页内容。iframe 沙箱策略由
`gateway.controlUi.embedSandbox` 控制：

- `strict`：禁用托管嵌入中的脚本执行
- `scripts`：允许交互式嵌入，同时保持源隔离；这是
  默认值，通常足以满足自包含的浏览器游戏 / 小部件
- `trusted`：在 `allow-scripts` 的基础上再添加 `allow-same-origin`，用于同站点
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

仅当嵌入文档确实需要同源
行为时才使用 `trusted`。对于大多数由智能体生成的游戏和交互式画布，`scripts` 是更安全的选择。

默认情况下，绝对外部 `http(s)` 嵌入 URL 仍会被阻止。如果你
确实希望 `[embed url="https://..."]` 加载第三方页面，请设置
`gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

### 集成式 Tailscale Serve（首选）

让 Gateway 网关保持在 loopback 上，并使用 Tailscale Serve 通过 HTTPS 代理它：

```bash
openclaw gateway --tailscale serve
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI / WebSocket Serve 请求可以通过 Tailscale 身份标头
（`tailscale-user-login`）进行认证。OpenClaw
会通过使用 `tailscale whois` 解析 `x-forwarded-for` 地址
并将其与该标头匹配来验证身份，并且仅当请求命中 loopback 且带有 Tailscale 的 `x-forwarded-*` 标头时才接受这些请求。若你希望即使对 Serve 流量
也要求显式共享密钥凭证，请设置
`gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或
`"password"`。
对于该异步 Serve 身份路径，同一客户端 IP
和认证作用域的失败认证尝试会在速率限制写入前被串行化。
因此，同一浏览器发起的并发错误重试在第二个请求上可能会显示 `retry later`，
而不是两个普通不匹配请求并行竞争。
无 token 的 Serve 认证假定 gateway 主机是可信的。如果该主机上可能运行不受信任的本地代码，请要求使用 token / password 认证。

### 绑定到 tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

然后打开：

- `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

将匹配的共享密钥粘贴到 UI 设置中（作为
`connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

## 不安全的 HTTP

如果你通过纯 HTTP 打开仪表板（`http://<lan-ip>` 或 `http://<tailscale-ip>`），
浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，
OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

文档化的例外情况：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 的仅 localhost 不安全 HTTP 兼容模式
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作员 Control UI 认证
- 紧急兜底 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方式：**使用 HTTPS（Tailscale Serve）或在本地打开 UI：

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

`allowInsecureAuth` 只是一个本地兼容性开关：

- 它允许 localhost 的 Control UI 会话在
  非安全 HTTP 上下文中绕过设备身份继续进行。
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

`dangerouslyDisableDeviceAuth` 会禁用 Control UI 的设备身份检查，这是一次
严重的安全降级。紧急使用后请尽快恢复。

Trusted-proxy 说明：

- 成功的 trusted-proxy 认证可以允许**操作员** Control UI 会话在没有
  设备身份的情况下接入
- 这**不**适用于节点角色的 Control UI 会话
- 同主机 loopback 反向代理仍然不能满足 trusted-proxy 认证；请参见
  [Trusted proxy auth](/zh-CN/gateway/trusted-proxy-auth)

有关 HTTPS 设置指导，请参见 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 采用严格的 `img-src` 策略：仅允许**同源**资源、`data:` URL 以及本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且不会发起网络请求。

这在实际中的含义是：

- 仍然会渲染通过相对路径提供的头像和图片（例如 `/avatars/<id>`），包括需要认证的头像路由，因为 UI 会获取它们并将其转换为本地 `blob:` URL。
- 内联 `data:image/...` URL 仍然会渲染（这对协议内负载很有用）。
- Control UI 创建的本地 `blob:` URL 仍然会渲染。
- 渠道元数据输出的远程头像 URL 会在 Control UI 的头像辅助逻辑中被剥离，并替换为内置 logo / badge，因此被入侵或恶意的渠道无法强制操作员浏览器发起任意远程图片请求。

你无需做任何更改即可获得此行为——它始终启用，且不可配置。

## 头像路由认证

配置了 gateway 认证后，Control UI 头像端点要求使用与其余 API 相同的 gateway token：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图像。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对这两个路由的未认证请求都会被拒绝（与同级 assistant-media 路由一致）。这可防止头像路由在原本受保护的主机上泄露智能体身份。
- Control UI 在获取头像时会将 gateway token 作为 bearer 标头转发，并使用已认证的 blob URL，因此图像仍可在仪表板中渲染。

如果你禁用了 gateway 认证（不建议在共享主机上这样做），头像路由也会变为未认证状态，这与网关其余部分保持一致。

## 构建 UI

Gateway 网关会从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对 base 路径（当你希望使用固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立 dev server）：

```bash
pnpm ui:dev
```

然后让 UI 指向你的 Gateway WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试 / 测试：dev server + 远程 Gateway

Control UI 是静态文件；WebSocket 目标可配置，并且可以
与 HTTP 源不同。当你希望在本地运行 Vite dev server，
但 Gateway 网关运行在其他地方时，这会非常方便。

1. 启动 UI dev server：`pnpm ui:dev`
2. 打开类似下面的 URL：

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

可选的一次性认证（如有需要）：

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

说明：

- `gatewayUrl` 会在加载后存储到 localStorage 中，并从 URL 中移除。
- 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，这样可以避免请求日志和 Referer 泄露。旧版 `?token=` 查询参数仍会为了兼容性而导入一次，但仅作为回退方案，并会在启动后立即移除。
- `password` 仅保存在内存中。
- 设置了 `gatewayUrl` 后，UI 不会回退到配置或环境凭证。
  请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
- 当 Gateway 网关位于 TLS 后面时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
- `gatewayUrl` 仅在顶层窗口中被接受（不能嵌入），以防止点击劫持。
- 非 loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`
  （完整源）。这包括远程开发设置。
- 除了受严格控制的
  本地测试外，请不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。这表示允许任何浏览器源，而不是“匹配我
  正在使用的任意主机”。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用
  Host 标头源回退模式，但这是危险的安全模式。

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
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [Health Checks](/zh-CN/gateway/health) — gateway 健康监控
