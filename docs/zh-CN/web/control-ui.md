---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你想要无需 SSH 隧道的 Tailnet 访问
sidebarTitle: Control UI
summary: 基于浏览器的 Gateway 网关控制 UI（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-27T13:32:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8a438d96e3df280d72106f4d48b5989afb1675a6c075e0688c4b2f4363433d3d
    source_path: web/control-ui.md
    workflow: 15
---

Control UI 是一个小型的 **Vite + Lit** 单页应用，由 Gateway 网关提供服务：

- 默认地址：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接连接到 Gateway 网关 WebSocket**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台电脑上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面无法加载，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用 trusted-proxy 身份头

仪表板设置面板会为当前浏览器标签页会话和所选 Gateway 网关 URL 保存一个令牌；密码不会被持久化。新手引导通常会在首次连接时为共享密钥认证生成一个 Gateway 网关令牌，但当 `gateway.auth.mode` 为 `"password"` 时，密码认证同样可用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关通常会要求进行**一次性配对批准**。这是一项安全措施，用于防止未授权访问。

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

如果浏览器在认证详情变更后（角色 / 范围 / 公钥）重试配对，之前待处理的请求会被替代，并创建新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已经配对，而你将其权限从只读更改为写入 / 管理员访问，这会被视为批准升级，而不是静默重连。OpenClaw 会保持旧批准有效，阻止更广泛权限的重连，并要求你显式批准新的范围集合。

一旦获得批准，该设备就会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则无需再次批准。有关令牌轮换和撤销，请参见 [Devices CLI](/zh-CN/cli/devices)。

<Note>
- 直接本地 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会被自动批准。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份验证通过且浏览器提供其设备身份时，Tailscale Serve 可为 Control UI 操作员会话跳过配对往返流程。
- 直接 Tailnet 绑定、LAN 浏览器连接，以及没有设备身份的浏览器配置文件，仍然需要显式批准。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据都需要重新配对。
</Note>

## 个人身份（浏览器本地）

Control UI 支持每个浏览器独立的个人身份（显示名称和头像），会附加到发出的消息上，以便在共享会话中进行归属标识。它保存在浏览器存储中，仅限当前浏览器配置文件使用，不会同步到其他设备，也不会在服务端持久化，除了你实际发送的消息所附带的常规转录作者元数据。清除站点数据或切换浏览器会将其重置为空。

同样的浏览器本地模式也适用于助手头像覆盖。上传的助手头像只会在本地浏览器中覆盖 Gateway 网关解析出的身份，绝不会通过 `config.patch` 往返传输。共享的 `ui.assistant.avatar` 配置字段仍可用于直接写入该字段的非 UI 客户端（例如脚本化 Gateway 网关或自定义仪表板）。

## 运行时配置端点

Control UI 会从 `/__openclaw/control-ui-config.json` 获取其运行时设置。该端点与其余 HTTP 接口一样受相同的 Gateway 网关认证保护：未认证的浏览器无法获取它，而成功获取需要已有有效的 Gateway 网关令牌 / 密码、Tailscale Serve 身份，或 trusted-proxy 身份。

## 语言支持

Control UI 可以在首次加载时根据你的浏览器语言环境进行本地化。若之后要覆盖它，请打开 **概览 -> Gateway Access -> Language**。语言选择器位于 Gateway Access 卡片中，而不是在 Appearance 下。

- 支持的语言环境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`tr`、`uk`、`id`、`pl`、`th`
- 非英文翻译会在浏览器中按需延迟加载。
- 所选语言环境会保存在浏览器存储中，并在之后访问时复用。
- 缺失的翻译键会回退到英文。

## 它目前能做什么

<AccordionGroup>
  <Accordion title="聊天和通话">
    - 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 通过浏览器实时会话进行通话。OpenAI 使用直接 WebRTC，Google Live 通过 WebSocket 使用受限的一次性浏览器令牌，而仅后端实时语音插件则使用 Gateway 网关中继传输。中继会将提供商凭证保留在 Gateway 网关上，同时浏览器通过 `talk.realtime.relay*` RPC 流式传输麦克风 PCM，并通过 `chat.send` 将 `openclaw_agent_consult` 工具调用发回，以供配置好的更大型 OpenClaw 模型使用。
    - 在聊天中流式显示工具调用和实时工具输出卡片（智能体事件）。
  </Accordion>
  <Accordion title="渠道、实例、会话、Dreaming">
    - 渠道：内置渠道以及内置 / 外部插件渠道状态、QR 登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）。
    - 实例：在线状态列表和刷新（`system-presence`）。
    - 会话：列表和按会话设置的模型 / 思考 / 快速 / 详细 / 跟踪 / 推理覆盖（`sessions.list`、`sessions.patch`）。
    - Dreaming：Dreaming 状态、启用 / 禁用切换和 Dream Diary 读取器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。
  </Accordion>
  <Accordion title="Cron、Skills、节点、exec 批准">
    - Cron 任务：列表 / 添加 / 编辑 / 运行 / 启用 / 禁用 + 运行历史（`cron.*`）。
    - Skills：状态、启用 / 禁用、安装、API 密钥更新（`skills.*`）。
    - 节点：列表 + 能力（`node.list`）。
    - exec 批准：编辑 Gateway 网关或节点允许列表 + 为 `exec host=gateway/node` 设置询问策略（`exec.approvals.*`）。
  </Accordion>
  <Accordion title="配置">
    - 查看 / 编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 带验证的应用并重启（`config.apply`），并唤醒最后一个活动会话。
    - 写入时包含 base-hash 保护，以防覆盖并发编辑。
    - 写入（`config.set` / `config.apply` / `config.patch`）会对提交配置负载中的 SecretRef 进行预检活动解析；无法解析的活动提交引用会在写入前被拒绝。
    - Schema 和表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象 / 通配符 / 数组 / 组合节点上的文档元数据，以及可用时的插件 + 渠道 schema）；仅当快照支持安全的原始往返时，才提供 Raw JSON 编辑器。
    - 如果某个快照无法安全地进行原始往返，Control UI 会强制使用表单模式，并对该快照禁用 Raw 模式。
    - Raw JSON 编辑器中的“重置为已保存”会保留原始编写的形状（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照可安全往返时，外部编辑在重置后仍能保留。
    - 结构化 SecretRef 对象值会在表单文本输入中以只读方式呈现，以防意外将对象破坏性地转换为字符串。
  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态 / 健康 / 模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）。
    - 日志：带过滤 / 导出的 Gateway 网关文件日志实时 tail（`logs.tail`）。
    - 更新：运行包 / git 更新 + 重启（`update.run`），附带重启报告，然后在重新连接后轮询 `update.status` 以确认正在运行的 Gateway 网关版本。
  </Accordion>
  <Accordion title="Cron 任务面板说明">
    - 对于隔离任务，投递默认是发布摘要。如果你希望仅内部运行，可以切换为 none。
    - 选择 announce 时会显示渠道 / 目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
    - 对于主会话任务，可用 webhook 和 none 投递模式。
    - 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确 / 错开选项、智能体模型 / 思考覆盖，以及尽力投递切换。
    - 表单验证为内联显示，并提供字段级错误；无效值会禁用保存按钮，直到修复为止。
    - 设置 `cron.webhookToken` 可发送专用 bearer 令牌；如果省略，则 webhook 在发送时不会带认证头。
    - 已弃用的回退方式：存储的旧版任务在 `notify: true` 时，迁移前仍可使用 `cron.webhook`。
  </Accordion>
</AccordionGroup>

## 聊天行为

<AccordionGroup>
  <Accordion title="发送和历史记录语义">
    - `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，响应则通过 `chat` 事件流式传输。
    - 聊天上传支持图片以及非视频文件。图片保留原生图片路径；其他文件会存储为受管媒体，并在历史记录中显示为附件链接。
    - 使用相同的 `idempotencyKey` 重新发送时，如果仍在运行中会返回 `{ status: "in_flight" }`，完成后则返回 `{ status: "ok" }`。
    - `chat.history` 响应会受到大小限制，以保证 UI 安全。当转录条目过大时，Gateway 网关可能会截断长文本字段、省略较重的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
    - 助手 / 生成的图片会作为受管媒体引用持久化，并通过已认证的 Gateway 网关媒体 URL 返回，因此页面重新加载不依赖聊天历史响应中保留原始 base64 图片负载。
    - `chat.history` 还会从可见的助手文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），以及泄露的 ASCII / 全角模型控制标记，并省略那些其全部可见文本仅为精确静默标记 `NO_REPLY` / `no_reply` 的助手条目。
    - 在发送进行中以及最终刷新历史记录时，如果 `chat.history` 暂时返回较旧的快照，聊天视图会保留本地乐观显示的用户 / 助手消息；一旦 Gateway 网关历史记录追上，这些本地消息就会被规范转录替换。
    - `chat.inject` 会向会话转录追加一条助手备注，并广播 `chat` 事件用于仅 UI 更新（不运行智能体，也不投递到渠道）。
    - 聊天头部的模型和思考选择器会通过 `sessions.patch` 立即修补活动会话；它们是持久的会话覆盖，而不是仅单轮发送选项。
    - 当最新的 Gateway 网关会话用量报告显示上下文压力较高时，聊天编辑区会显示上下文提示；在建议进行压缩的级别下，还会显示一个 compact 按钮，用于执行常规会话压缩流程。过期的令牌快照会被隐藏，直到 Gateway 网关再次报告新的用量信息。
  </Accordion>
  <Accordion title="通话模式（浏览器实时）">
    通话模式使用已注册的实时语音提供商。可使用 `talk.provider: "openai"` 加 `talk.providers.openai.apiKey` 配置 OpenAI，或使用 `talk.provider: "google"` 加 `talk.providers.google.apiKey` 配置 Google；Voice Call 实时提供商配置仍可复用为回退方案。浏览器绝不会收到标准提供商 API 密钥。OpenAI 会收到用于 WebRTC 的临时 Realtime 客户端密钥。Google Live 会收到一个一次性、受约束的 Live API 认证令牌，用于浏览器 WebSocket 会话；说明和工具声明会由 Gateway 网关锁定到该令牌中。仅暴露后端实时桥接的提供商会通过 Gateway 网关中继传输运行，因此凭证和厂商套接字会保留在服务端，而浏览器音频则通过已认证的 Gateway 网关 RPC 传输。Realtime 会话提示词由 Gateway 网关组装；`talk.realtime.session` 不接受调用方提供的指令覆盖。

    在聊天编辑器中，通话控件是麦克风听写按钮旁边的波形按钮。通话开始时，编辑器状态行会显示 `Connecting Talk...`，然后在音频连接期间显示 `Talk live`，或在实时工具调用通过 `chat.send` 咨询已配置的更大 OpenClaw 模型时显示 `Asking OpenClaw...`。

    维护者在线冒烟测试：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 会验证 OpenAI 浏览器 WebRTC SDP 交换、Google Live 受约束令牌浏览器 WebSocket 设置，以及使用虚拟麦克风媒体的 Gateway 网关中继浏览器适配器。该命令只输出提供商状态，不会记录任何密钥。

  </Accordion>
  <Accordion title="停止和中止">
    - 点击**停止**（调用 `chat.abort`）。
    - 当某个运行处于活动状态时，普通后续消息会进入队列。点击排队消息上的**Steer** 可将该后续消息注入当前运行轮次。
    - 输入 `/stop`（或独立的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）可进行带外中止。
    - `chat.abort` 支持 `{ sessionKey }`（无需 `runId`）以中止该会话的所有活动运行。
  </Accordion>
  <Accordion title="中止后的部分保留">
    - 当某个运行被中止时，部分助手文本仍可能显示在 UI 中。
    - 当存在缓冲输出时，Gateway 网关会将中止时的部分助手文本持久化到转录历史中。
    - 持久化条目会包含中止元数据，以便转录消费者区分中止部分内容和正常完成输出。
  </Accordion>
</AccordionGroup>

## PWA 安装和 Web Push

Control UI 附带 `manifest.webmanifest` 和 service worker，因此现代浏览器可将其安装为独立的 PWA。Web Push 允许 Gateway 网关即使在标签页或浏览器窗口未打开时，也能通过通知唤醒已安装的 PWA。

| 界面 | 作用 |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest` | PWA 清单。浏览器在其可访问后会提供“安装应用”选项。 |
| `ui/public/sw.js` | 处理 `push` 事件和通知点击的 service worker。 |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下） | 自动生成的 VAPID 密钥对，用于对 Web Push 负载进行签名。 |
| `push/web-push-subscriptions.json` | 持久化的浏览器订阅端点。 |

当你希望固定密钥对时（例如多主机部署、密钥轮换或测试），可通过 Gateway 网关进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认为 `mailto:openclaw@localhost`）

Control UI 使用以下受作用域限制的 Gateway 网关方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` —— 获取当前活动的 VAPID 公钥。
- `push.web.subscribe` —— 注册 `endpoint` 以及 `keys.p256dh` / `keys.auth`。
- `push.web.unsubscribe` —— 删除已注册的端点。
- `push.web.test` —— 向调用方的订阅发送测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（中继支持的推送请参见 [配置](/zh-CN/gateway/configuration)），也独立于现有的 `push.test` 方法，后者面向原生移动端配对。
</Note>

## 托管嵌入

助手消息可通过 `[embed ...]` shortcode 内联渲染托管网页内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    禁止在托管嵌入中执行脚本。
  </Tab>
  <Tab title="scripts (default)">
    允许交互式嵌入，同时保持源隔离；这是默认值，通常足以支持自包含的浏览器游戏 / 小部件。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 的基础上增加 `allow-same-origin`，用于那些有意需要更高权限的同站文档。
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
仅当嵌入文档确实需要同源行为时才使用 `trusted`。对于大多数由智能体生成的游戏和交互式画布，`scripts` 是更安全的选择。
</Warning>

绝对外部 `http(s)` 嵌入 URL 默认仍会被阻止。如果你确实希望加载第三方页面的 `[embed url="https://..."]`，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="集成 Tailscale Serve（首选）">
    让 Gateway 网关保持绑定在 loopback 上，并由 Tailscale Serve 通过 HTTPS 进行代理：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开：

    - `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI / WebSocket Serve 请求可通过 Tailscale 身份头（`tailscale-user-login`）进行认证。OpenClaw 会通过使用 `tailscale whois` 解析 `x-forwarded-for` 地址并与该头进行匹配来验证身份，且仅当请求命中 loopback 并带有 Tailscale 的 `x-forwarded-*` 头时才接受这些头。对于带有浏览器设备身份的 Control UI 操作员会话，这条经过验证的 Serve 路径还会跳过设备配对往返流程；无设备浏览器和节点角色连接仍会遵循正常的设备检查。如果你希望即使对 Serve 流量也要求显式共享密钥凭证，请将 `gateway.auth.allowTailscale` 设为 `false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于该异步 Serve 身份路径，来自同一客户端 IP 和认证范围的失败认证尝试会在写入速率限制前被串行化。因此，同一浏览器的并发错误重试在第二个请求上可能会显示 `retry later`，而不是两个普通不匹配并行竞争。

    <Warning>
    无令牌的 Serve 认证假定 gateway 主机是可信的。如果该主机上可能运行不受信任的本地代码，请要求使用 token / password 认证。
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

如果你通过明文 HTTP 打开仪表板（`http://<lan-ip>` 或 `http://<tailscale-ip>`），浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

有文档记录的例外情况：

- 通过 `gateway.controlUi.allowInsecureAuth=true` 实现仅限 localhost 的不安全 HTTP 兼容性
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作员 Control UI 认证
- 紧急破窗配置 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方法：** 使用 HTTPS（Tailscale Serve）或在本地打开 UI：

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

    - 它允许 localhost Control UI 会话在非安全 HTTP 上下文中，在没有设备身份的情况下继续进行。
    - 它不会绕过配对检查。
    - 它不会放宽远程（非 localhost）设备身份要求。

  </Accordion>
  <Accordion title="仅限破窗应急">
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
    `dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，这是严重的安全降级。仅在紧急使用后尽快恢复。
    </Warning>

  </Accordion>
  <Accordion title="trusted-proxy 说明">
    - 成功的 trusted-proxy 认证可以允许**操作员** Control UI 会话在没有设备身份的情况下接入。
    - 这**不**适用于节点角色的 Control UI 会话。
    - 同一主机上的 loopback 反向代理仍不满足 trusted-proxy 认证；参见 [Trusted proxy auth](/zh-CN/gateway/trusted-proxy-auth)。
  </Accordion>
</AccordionGroup>

有关 HTTPS 设置指导，请参见 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 采用了严格的 `img-src` 策略：仅允许**同源**资源、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且不会发起网络请求。

这在实践中意味着：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍可渲染，包括那些需要认证、由 UI 获取后转换为本地 `blob:` URL 的头像路由。
- 内联 `data:image/...` URL 仍可渲染（这对协议内负载很有用）。
- 由 Control UI 创建的本地 `blob:` URL 仍可渲染。
- 渠道元数据发出的远程头像 URL 会在 Control UI 的头像辅助函数中被剥离，并替换为内置 logo / 徽标，因此即使渠道遭到入侵或具有恶意，也无法强制操作员浏览器发起任意远程图片请求。

你无需做任何更改即可获得此行为 —— 它始终开启且不可配置。

## 头像路由认证

配置了 Gateway 网关认证后，Control UI 头像端点需要与其余 API 相同的 Gateway 网关令牌：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与同级的助手媒体路由一致）。这可防止头像路由在其他受保护的主机上泄露智能体身份。
- Control UI 本身在获取头像时会将 Gateway 网关令牌作为 bearer 头转发，并使用已认证的 blob URL，因此图片仍能在仪表板中渲染。

如果你禁用了 Gateway 网关认证（不建议在共享主机上这样做），头像路由也会变为未认证状态，与 Gateway 网关的其余部分保持一致。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。使用以下命令构建它们：

```bash
pnpm ui:build
```

可选绝对 base 路径（当你希望使用固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本地开发时（单独的开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试 / 测试：开发服务器 + 远程 Gateway

Control UI 是静态文件；WebSocket 目标可配置，并且可以不同于 HTTP 源。当你希望本地运行 Vite 开发服务器，而 Gateway 网关运行在其他地方时，这会很方便。

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

    可选的一次性认证（如有需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="说明">
    - `gatewayUrl` 会在加载后存储到 localStorage 中，并从 URL 中移除。
    - 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，因此可避免请求日志和 Referer 泄露。为兼容性起见，旧版 `?token=` 查询参数仍会被一次性导入，但仅作为回退方案，并会在引导后立即移除。
    - `password` 仅保存在内存中。
    - 设置了 `gatewayUrl` 时，UI 不会回退到配置或环境凭证。请显式提供 `token`（或 `password`）。缺少显式凭证会报错。
    - 当 Gateway 网关位于 TLS 之后时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
    - `gatewayUrl` 仅在顶级窗口中接受（不能嵌入），以防止点击劫持。
    - 非 loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整 origin）。这也包括远程开发设置。
    - Gateway 网关启动时可能会根据生效的运行时 bind 和端口，预填充诸如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>` 之类的本地 origin，但远程浏览器 origin 仍需要显式条目。
    - 除非是在严格受控的本地测试中，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允许任意浏览器 origin，而不是“匹配我当前使用的任何主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 头 origin 回退模式，但这是一个危险的安全模式。
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

- [Dashboard](/zh-CN/web/dashboard) — Gateway 网关仪表板
- [Health Checks](/zh-CN/gateway/health) — Gateway 网关健康监控
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
