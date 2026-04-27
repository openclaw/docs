---
read_when:
    - 你希望通过浏览器操作 Gateway 网关
    - 你希望无需 SSH 隧道即可获得 Tailnet 访问能力
sidebarTitle: Control UI
summary: Gateway 网关 的基于浏览器的控制 UI（聊天、节点、配置）
title: 控制 UI
x-i18n:
    generated_at: "2026-04-27T07:13:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0960e5030a26d24035e26e44c1cd35f17c43eeba92e4e98e803aab5d8b51ca9
    source_path: web/control-ui.md
    workflow: 15
---

Control UI 是一个由 Gateway 网关提供服务的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接连接到 Gateway 网关 WebSocket**。

## 快速打开（本地）

如果 Gateway 网关 运行在同一台计算机上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面无法加载，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时，使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时，使用 trusted-proxy 身份标头

仪表板设置面板会为当前浏览器标签页会话和所选 Gateway 网关 URL 保存一个令牌；不会持久保存密码。新手引导通常会在首次连接时为共享密钥认证生成一个 Gateway 网关 令牌，但当 `gateway.auth.mode` 为 `"password"` 时，也可以使用密码认证。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关 通常会要求进行**一次性配对批准**。这是一项安全措施，用于防止未授权访问。

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

如果浏览器在配对重试时更改了认证详情（角色/作用域/公钥），先前的待处理请求会被替代，并创建新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已经配对，而你将其从只读权限更改为写入/管理员权限，这会被视为一次权限升级批准，而不是静默重连。OpenClaw 会保留旧的批准状态，阻止更高权限的重连，并要求你显式批准新的作用域集合。

一旦获批，该设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销，否则无需再次批准。有关令牌轮换和撤销，参见 [Devices CLI](/zh-CN/cli/devices)。

<Note>
- 直接使用 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会被自动批准。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份验证通过且浏览器提供其设备身份时，Tailscale Serve 可跳过 Control UI 操作员会话的配对往返流程。
- 直接绑定 Tailnet、LAN 浏览器连接，以及没有设备身份的浏览器配置文件，仍然需要显式批准。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据都需要重新配对。
</Note>

## 个人身份（浏览器本地）

Control UI 支持每个浏览器一个个人身份（显示名称和头像），它会附加到传出消息中，用于在共享会话中标注归属。它存储在浏览器本地，限定于当前浏览器配置文件，不会同步到其他设备，也不会在服务器端持久保存，除了你实际发送的消息中常规的转录作者元数据。清除站点数据或切换浏览器后，它会重置为空。

同样的浏览器本地模式也适用于助手头像覆盖。上传的助手头像只会在本地浏览器中覆盖 Gateway 网关 解析出的身份，绝不会通过 `config.patch` 往返传输。共享的 `ui.assistant.avatar` 配置字段仍然可供直接写入该字段的非 UI 客户端使用（例如脚本化 Gateway 网关 或自定义仪表板）。

## 运行时配置端点

Control UI 会从 `/__openclaw/control-ui-config.json` 获取其运行时设置。该端点受与其他 HTTP 接口相同的 gateway 认证保护：未认证浏览器无法获取；成功获取需要已有效的 Gateway 网关 令牌/密码、Tailscale Serve 身份或 trusted-proxy 身份之一。

## 语言支持

Control UI 可以在首次加载时根据你的浏览器语言环境进行本地化。如需之后覆盖，请打开 **Overview -> Gateway Access -> Language**。语言选择器位于 Gateway Access 卡片中，而不在外观设置下。

- 支持的语言环境：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`tr`、`uk`、`id`、`pl`、`th`
- 非英语翻译会在浏览器中按需懒加载。
- 所选语言环境会保存在浏览器存储中，并在后续访问时复用。
- 缺失的翻译键会回退为英语。

## 它目前能做什么

<AccordionGroup>
  <Accordion title="聊天与语音">
    - 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 通过 WebRTC 直接从浏览器连接到 OpenAI Realtime 进行语音交流。Gateway 网关 通过 `talk.realtime.session` 签发短期有效的 Realtime 客户端密钥；浏览器将麦克风音频直接发送给 OpenAI，并通过 `chat.send` 将 `openclaw_agent_consult` 工具调用中继回去，以调用已配置的更大 OpenClaw 模型。
    - 在聊天中流式显示工具调用 + 实时工具输出卡片（智能体事件）。
  </Accordion>
  <Accordion title="渠道、实例、会话、Dreaming">
    - 渠道：内置渠道以及内置/外部插件渠道的 Status、二维码登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）。
    - 实例：在线列表 + 刷新（`system-presence`）。
    - 会话：列表 + 按会话的模型/思考/快速/详细/追踪/推理覆盖（`sessions.list`、`sessions.patch`）。
    - Dreaming：Dreaming 状态、启用/禁用切换和 Dream Diary 阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。
  </Accordion>
  <Accordion title="Cron、Skills、节点、exec 批准">
    - Cron 作业：列出/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）。
    - Skills：Status、启用/禁用、安装、API 密钥更新（`skills.*`）。
    - 节点：列表 + 能力（`node.list`）。
    - exec 批准：编辑 gateway 或节点允许列表 + 针对 `exec host=gateway/node` 的询问策略（`exec.approvals.*`）。
  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 应用 + 重启并进行验证（`config.apply`），并唤醒最近活跃的会话。
    - 写入包含 base-hash 保护，以防覆盖并发编辑。
    - 写入（`config.set`/`config.apply`/`config.patch`）会在提交配置 payload 中，对活动 `SecretRef` 解析进行预检；若提交的活动引用无法解析，则会在写入前被拒绝。
    - schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及可用时的插件 + 渠道 schema）；仅当快照可安全进行原始往返时，才提供原始 JSON 编辑器。
    - 如果某个快照无法安全地进行原始往返，Control UI 会强制使用表单模式，并为该快照禁用原始模式。
    - 原始 JSON 编辑器的“Reset to saved”会保留原始编写形状（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此只要快照可以安全往返，外部编辑在重置后也能保留。
    - 结构化 `SecretRef` 对象值会在表单文本输入中以只读方式渲染，以防意外把对象损坏成字符串。
  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：status/health/models 快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）。
    - 日志：带筛选/导出的 gateway 文件日志实时 tail（`logs.tail`）。
    - 更新：运行 package/git 更新 + 重启（`update.run`），并附带重启报告。
  </Accordion>
  <Accordion title="Cron 作业面板说明">
    - 对于隔离作业，投递方式默认是公告摘要。若你只想内部运行，可以切换为 none。
    - 选择公告时，会显示渠道/目标字段。
    - webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
    - 对于主会话作业，可使用 webhook 和 none 投递模式。
    - 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确/错峰选项、智能体模型/思考覆盖以及尽力投递切换。
    - 表单验证为内联字段级错误；在修复前，无效值会禁用保存按钮。
    - 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，webhook 将在无认证标头的情况下发送。
    - 已弃用的回退：存储的旧版作业若带有 `notify: true`，在迁移前仍可使用 `cron.webhook`。
  </Accordion>
</AccordionGroup>

## 聊天行为

<AccordionGroup>
  <Accordion title="发送与历史语义">
    - `chat.send` 是**非阻塞**的：它会立即确认并返回 `{ runId, status: "started" }`，响应会通过 `chat` 事件流式传输。
    - 聊天上传支持图片和非视频文件。图片保留原生图片路径；其他文件存储为托管媒体，并在历史记录中显示为附件链接。
    - 使用相同 `idempotencyKey` 重新发送时，运行中返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
    - `chat.history` 响应有大小限制，以确保 UI 安全。当转录条目过大时，Gateway 网关 可能会截断长文本字段、省略较重的元数据块，并用占位符替换超大消息（`[chat.history omitted: message too large]`）。
    - 助手/生成的图片会作为托管媒体引用持久保存，并通过已认证的 Gateway 网关 媒体 URL 返回，因此重新加载时不依赖聊天历史响应中保留原始 base64 图片 payload。
    - `chat.history` 还会从可见的助手文本中剥离仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML payload（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），并去除泄露的 ASCII/全角模型控制令牌；如果某条助手条目的全部可见文本仅为精确的静默令牌 `NO_REPLY` / `no_reply`，则会被省略。
    - 在活跃发送期间以及最终历史刷新期间，如果 `chat.history` 短暂返回较旧快照，聊天视图会保持本地乐观用户/助手消息可见；一旦 Gateway 网关 历史追上，规范转录就会替换这些本地消息。
    - `chat.inject` 会向会话转录追加一条助手备注，并广播 `chat` 事件用于仅 UI 更新（不触发智能体运行，也不投递到渠道）。
    - 聊天头部中的模型和思考选择器会通过 `sessions.patch` 立即修改活跃会话；它们是持久性的会话覆盖，而不是单轮发送选项。
    - 当新的 Gateway 网关 会话用量报告显示上下文压力较高时，聊天输入区域会显示上下文提示，并在建议压缩级别时显示一个 compact 按钮，以运行常规会话压缩路径。在 Gateway 网关 再次报告新鲜用量前，陈旧的令牌快照会被隐藏。
  </Accordion>
  <Accordion title="语音模式（浏览器 WebRTC）">
    语音模式使用已注册、支持浏览器 WebRTC 会话的实时语音提供商。请配置 OpenAI：`talk.provider: "openai"` 加上 `talk.providers.openai.apiKey`，或复用 Voice Call 的实时 provider 配置。浏览器永远不会收到标准 OpenAI API 密钥；它只会收到临时 Realtime 客户端密钥。Google Live 实时语音支持后端 Voice Call 和 Google Meet 桥接，但暂不支持这个浏览器 WebRTC 路径。Realtime 会话提示由 Gateway 网关 组装；`talk.realtime.session` 不接受调用方提供的指令覆盖。

    在聊天输入框中，Talk 控件是麦克风听写按钮旁边的波形按钮。当 Talk 启动时，输入框状态行会显示 `Connecting Talk...`，音频连接后显示 `Talk live`，或者在实时工具调用通过 `chat.send` 咨询已配置的更大 OpenClaw 模型时显示 `Asking OpenClaw...`。

  </Accordion>
  <Accordion title="停止与中止">
    - 点击 **Stop**（调用 `chat.abort`）。
    - 当某次运行处于活跃状态时，普通后续消息会进入队列。点击队列消息上的 **Steer**，可将该后续消息注入到当前运行中的轮次。
    - 输入 `/stop`（或独立的中止短语，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）可进行带外中止。
    - `chat.abort` 支持 `{ sessionKey }`（不带 `runId`），用于中止该会话的所有活跃运行。
  </Accordion>
  <Accordion title="中止后的部分内容保留">
    - 当某次运行被中止时，部分助手文本仍可能显示在 UI 中。
    - 当存在缓冲输出时，Gateway 网关 会将中止时的部分助手文本持久保存到转录历史中。
    - 持久化条目包含中止元数据，因此转录消费者可以区分中止的部分内容与正常完成输出。
  </Accordion>
</AccordionGroup>

## PWA 安装与 Web Push

Control UI 附带了一个 `manifest.webmanifest` 和一个 service worker，因此现代浏览器可以将其安装为独立的 PWA。Web Push 允许 Gateway 网关 通过通知唤醒已安装的 PWA，即使标签页或浏览器窗口未打开也是如此。

| 界面 | 作用 |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest` | PWA manifest。浏览器在它可访问后会提供“安装应用”。 |
| `ui/public/sw.js` | 处理 `push` 事件和通知点击的 service worker。 |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下） | 自动生成的 VAPID 密钥对，用于签名 Web Push payload。 |
| `push/web-push-subscriptions.json` | 持久化保存的浏览器订阅端点。 |

当你希望固定密钥对时（例如多主机部署、密钥轮换或测试），可通过 Gateway 网关 进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认值为 `mailto:openclaw@localhost`）

Control UI 使用以下带作用域控制的 Gateway 网关 方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` — 获取当前启用的 VAPID 公钥。
- `push.web.subscribe` — 注册 `endpoint` 以及 `keys.p256dh` / `keys.auth`。
- `push.web.unsubscribe` — 移除已注册端点。
- `push.web.test` — 向调用方的订阅发送一条测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（中继支持的推送参见[配置](/zh-CN/gateway/configuration)）以及现有的 `push.test` 方法，后者面向原生移动端配对。
</Note>

## 托管嵌入

助手消息可以使用 `[embed ...]` 短代码内联渲染托管网页内容。iframe 的沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    禁止在托管嵌入中执行脚本。
  </Tab>
  <Tab title="scripts (default)">
    允许交互式嵌入，同时保持源隔离；这是默认值，通常足以支持自包含的浏览器游戏/小组件。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 的基础上额外添加 `allow-same-origin`，用于有意需要更强权限的同站点文档。
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

绝对外部 `http(s)` 嵌入 URL 默认仍会被阻止。如果你有意让 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="集成的 Tailscale Serve（首选）">
    让 Gateway 网关 保持绑定在 loopback 上，并通过 Tailscale Serve 使用 HTTPS 进行代理：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开：

    - `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket 的 Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行认证。OpenClaw 会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该标头匹配来验证身份，并且只有当请求到达 loopback 且带有 Tailscale 的 `x-forwarded-*` 标头时才接受这些请求。对于带有浏览器设备身份的 Control UI 操作员会话，这条经过验证的 Serve 路径还会跳过设备配对往返；没有设备身份的浏览器以及 node 角色连接仍遵循正常设备检查。如果你希望即使对 Serve 流量也要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于该异步 Serve 身份路径，相同客户端 IP 和认证范围下的失败认证尝试会在写入限速前串行处理。因此，同一浏览器的并发错误重试在第二个请求上可能会显示 `retry later`，而不是两个普通不匹配并行竞争。

    <Warning>
    无令牌的 Serve 认证假定 gateway 主机是可信的。如果该主机上可能运行不可信的本地代码，请要求 token/password 认证。
    </Warning>

  </Tab>
  <Tab title="绑定到 tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然后打开：

    - `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

    将对应的共享密钥粘贴到 UI 设置中（作为 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你通过纯 HTTP 打开仪表板（`http://<lan-ip>` 或 `http://<tailscale-ip>`），浏览器会运行在**非安全上下文**中，并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

文档说明的例外情况：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 的仅 localhost 不安全 HTTP 兼容模式
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作员 Control UI 认证
- 紧急开关 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    - 它允许 localhost 的 Control UI 会话在非安全 HTTP 上下文中无设备身份继续运行。
    - 它不会绕过配对检查。
    - 它不会放宽远程（非 localhost）设备身份要求。

  </Accordion>
  <Accordion title="仅限紧急情况">
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
  <Accordion title="trusted-proxy 说明">
    - 成功的 trusted-proxy 认证可以允许**操作员** Control UI 会话在无设备身份的情况下接入。
    - 这**不适用于** node 角色的 Control UI 会话。
    - 同主机 loopback 反向代理仍然不能满足 trusted-proxy 认证要求；参见[Trusted proxy auth](/zh-CN/gateway/trusted-proxy-auth)。
  </Accordion>
</AccordionGroup>

有关 HTTPS 设置指南，参见 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 附带严格的 `img-src` 策略：仅允许**同源**资源、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，且不会发起网络请求。

这在实践中的含义：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍可渲染，包括 UI 获取后转换为本地 `blob:` URL 的需要认证的头像路由。
- 内联 `data:image/...` URL 仍可渲染（这对协议内 payload 很有用）。
- Control UI 创建的本地 `blob:` URL 仍可渲染。
- 渠道元数据输出的远程头像 URL 会在 Control UI 的头像辅助层中被剥离，并替换为内置 logo/badge，因此受损或恶意渠道无法强制操作员浏览器发起任意远程图片请求。

你无需做任何修改即可获得此行为——它始终启用且不可配置。

## 头像路由认证

当配置了 gateway 认证时，Control UI 头像端点要求与其余 API 相同的 gateway token：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与相邻的助手媒体路由一致）。这可防止头像路由在原本受保护的主机上泄露智能体身份。
- Control UI 自身在获取头像时，会将 gateway token 作为 bearer 标头转发，并使用经认证的 blob URL，因此图片仍能在仪表板中渲染。

如果你禁用了 gateway 认证（不建议在共享主机上这样做），头像路由也会像 gateway 其余部分一样变为未认证。

## 构建 UI

Gateway 网关 从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对 base（当你希望固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立 dev server）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试/测试：dev server + 远程 Gateway

Control UI 是静态文件；WebSocket 目标可配置，并且可以不同于 HTTP 源。这在你希望本地运行 Vite dev server、但 Gateway 网关 运行在其他地方时非常有用。

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

    可选的一次性认证（如需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="注意事项">
    - `gatewayUrl` 会在加载后存储到 `localStorage` 中，并从 URL 中移除。
    - 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，因此可避免请求日志和 Referer 泄露。出于兼容性，旧版 `?token=` 查询参数仍会被一次性导入，但仅作为回退方案，并会在启动后立即移除。
    - `password` 仅保存在内存中。
    - 设置 `gatewayUrl` 后，UI 不会回退到配置或环境变量凭证。请显式提供 `token`（或 `password`）。如果缺少显式凭证，将报错。
    - 当 Gateway 网关 位于 TLS 之后时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
    - `gatewayUrl` 仅在顶层窗口中接受（不接受嵌入式场景），以防止点击劫持。
    - 非 loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整 origin）。这也包括远程开发设置。
    - Gateway 网关 启动时，可能会根据实际运行时绑定地址和端口预填充本地 origin，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但远程浏览器 origin 仍需要显式条目。
    - 除非是在严格受控的本地测试环境中，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允许任意浏览器 origin，而不是“匹配我当前使用的任何主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 标头 origin 回退模式，但这是危险的安全模式。
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

远程访问设置详情： [远程访问](/zh-CN/gateway/remote)。

## 相关内容

- [Dashboard](/zh-CN/web/dashboard) — Gateway 网关 仪表板
- [Health Checks](/zh-CN/gateway/health) — Gateway 网关 健康监控
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
