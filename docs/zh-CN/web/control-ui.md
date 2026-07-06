---
read_when:
    - 你想从浏览器操作 Gateway 网关
    - 你想要无需 SSH 隧道的 Tailnet 访问
sidebarTitle: Control UI
summary: 基于浏览器的 Gateway 网关 Control UI（聊天、活动、节点、配置）
title: Control UI
x-i18n:
    generated_at: "2026-07-06T10:56:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c17497942b55a1b886948f7c3f0685b4fac29da0b755530f18230e59eb2b412
    source_path: web/control-ui.md
    workflow: 16
---

Control UI 是一个由 Gateway 网关提供服务的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它在同一端口上**直接与 Gateway 网关 WebSocket** 通信。

## 快速打开（本地）

如果 Gateway 网关在同一台计算机上运行，请打开 [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）。

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

<Note>
在原生 Windows LAN 绑定上，即使 `127.0.0.1` 可在 Gateway 网关主机上正常工作，Windows 防火墙或组织管理的组策略仍可能阻止已公布的 LAN URL。在 Windows 主机上运行 `openclaw gateway status --deep`；它会报告可能被阻止的端口、配置文件不匹配，以及策略可能忽略的本地防火墙规则。
</Note>

认证在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用受信任代理身份标头

仪表板设置面板会为当前浏览器标签页会话和所选 Gateway 网关 URL 保留一个令牌；密码不会被持久保存。新手引导通常会在首次连接时为共享密钥认证生成一个 Gateway 网关令牌，但当 `gateway.auth.mode` 为 `"password"` 时，密码认证也可使用。

## 设备配对（首次连接）

从新浏览器或设备连接通常需要**一次性配对审批**，显示为 `disconnected (1008): pairing required`。

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

如果浏览器使用已更改的认证详情（角色/权限范围/公钥）重试配对，之前的待处理请求会被取代，并创建新的 `requestId`；批准前请重新运行 `openclaw devices list`。

将已配对的浏览器从读取访问切换到写入/管理员访问，会被视为审批升级，而不是静默重新连接：OpenClaw 会保持旧审批有效，阻止更广的重新连接，并要求你明确批准新的权限范围集合。

批准后，设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则不需要重新批准。有关令牌轮换、撤销，以及 Paperclip / `openclaw_gateway` 首次运行审批流程，请参阅 [Devices CLI](/zh-CN/cli/devices)。

<Note>
- 直接的 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动批准。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份验证通过且浏览器呈现其设备身份时，Tailscale Serve 可以为 Control UI 操作员会话跳过配对往返。无设备浏览器和节点角色连接仍遵循正常设备检查。
- 直接 Tailnet 绑定、LAN 浏览器连接，以及没有设备身份的浏览器配置文件仍需要明确批准。
- 每个浏览器配置文件都会生成唯一设备 ID，因此切换浏览器或清除浏览器数据需要重新配对。

</Note>

## 配对移动设备

已配对的管理员无需打开终端即可创建 iOS/Android 连接二维码：

<Steps>
  <Step title="打开移动设备配对">
    选择 **Nodes**，然后在 **Devices** 卡片中点击 **Pair mobile device**。
  </Step>
  <Step title="连接手机">
    在 OpenClaw 移动应用中，打开 **Settings** → **Gateway 网关** 并扫描二维码。你也可以改为复制并粘贴设置代码。
  </Step>
  <Step title="确认连接">
    官方 iOS/Android 应用会自动连接。如果 **Devices** 显示待处理请求，请先检查其角色和权限范围，再批准。
  </Step>
</Steps>

创建设置代码需要 `operator.admin`；没有该权限的会话会禁用此按钮。设置代码包含短期有效的引导凭证，因此在二维码和复制的代码有效期间，应像对待密码一样对待它们。对于远程配对，Gateway 网关必须解析为 `wss://`（例如通过 Tailscale Serve/Funnel）；普通 `ws://` 仅限于回环和私有 LAN 地址。有关完整安全性和回退细节，请参阅 [配对](/zh-CN/channels/pairing#pair-from-the-control-ui-recommended)。

## 个人身份（浏览器本地）

Control UI 支持按浏览器设置个人身份（显示名称和头像），并附加到外发消息，用于共享会话中的归属标识。它位于浏览器存储中，限定在当前浏览器配置文件内，不会同步到其他设备，也不会在服务器端持久保存，除了你发送消息上的常规转录作者元数据。清除站点数据或切换浏览器会将其重置为空。

助手头像覆盖遵循相同的浏览器本地模式：上传的覆盖会在本地叠加到 Gateway 网关解析出的身份上，且绝不会通过 `config.patch` 往返传输。共享的 `ui.assistant.avatar` 配置字段仍可供直接写入该字段的非 UI 客户端使用。

## 运行时配置端点

Control UI 从 `/control-ui-config.json` 获取其运行时设置，该路径相对于 Gateway 网关的 Control UI 基础路径解析（例如在基础路径 `/__openclaw__/` 下为 `/__openclaw__/control-ui-config.json`）。该端点受与其余 HTTP 表面相同的 Gateway 网关认证保护：未认证的浏览器无法获取它，成功获取需要有效的 Gateway 网关令牌/密码、Tailscale Serve 身份，或受信任代理身份。

## Gateway 网关主机状态

在 Simple 视图中打开 **Settings**，可查看包含 Gateway 网关机器、LAN 地址、操作系统、运行时、正常运行时间、CPU 负载、内存和状态卷磁盘空间的 **Gateway Host** 卡片。该卡片在可见时会每 10 秒通过 `system.info` Gateway RPC 刷新一次，这需要 `operator.read` 权限范围。较旧的 Gateway 网关以及没有该权限范围的连接会省略该卡片。

## 语言支持

Control UI 会在首次加载时根据你的浏览器区域设置进行本地化。要稍后覆盖它，请打开 **Overview -> Gateway Access -> Language**（选择器位于 Gateway Access 卡片中，而不在 Appearance 下）。

- 支持的区域设置：`en`、`ar`、`de`、`es`、`fa`、`fr`、`hi`、`id`、`it`、`ja-JP`、`ko`、`nl`、`pl`、`pt-BR`、`ru`、`th`、`tr`、`uk`、`vi`、`zh-CN`、`zh-TW`
- 非英文翻译会在浏览器中延迟加载。
- 所选区域设置会保存在浏览器存储中，并在未来访问时复用。
- 缺失的翻译键会回退到英文。

文档翻译会为同一组非英文区域设置生成，但文档站点内置的 Mintlify 语言选择器只列出 Mintlify 接受的区域设置代码。泰语（`th`）和波斯语（`fa`）文档仍会生成到发布仓库；在 Mintlify 支持这些代码之前，它们可能不会出现在该选择器中。

## 外观主题

Appearance 面板包含内置的 Claw、Knot 和 Dash 主题（默认是 Claw），以及一个浏览器本地 tweakcn 导入槽位。要导入主题，请打开 [tweakcn editor](https://tweakcn.com/editor/theme)，选择或创建一个主题，点击 **Share**，然后将复制的链接粘贴到 Appearance 中。导入器还接受 `https://tweakcn.com/r/themes/<id>` 注册表 URL、类似 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 的编辑器 URL、相对 `/themes/<id>` 路径、原始主题 ID，以及 `amethyst-haze` 等默认主题名称。

导入的主题仅存储在当前浏览器配置文件中；它们不会写入 Gateway 网关配置，也不会跨设备同步。替换导入的主题会更新这一个本地槽位；如果导入的主题处于活动状态，清除它会切回 Claw。

Appearance 还提供浏览器本地的 Text size 设置，该设置与其他 Control UI 偏好一起存储。它适用于聊天文本、编辑器文本、工具卡片和聊天侧边栏，并会让文本输入保持至少 16px，以避免移动版 Safari 在聚焦时自动缩放。

## 侧边栏导航

侧边栏会优先显示会话，并拆分为 **Pinned** 和 **Sessions** 组。每个固定会话都会保持可见，而未固定会话拥有独立的九项最近项目预算。**Overview** 是默认唯一固定的目标；展开 **More** 可访问所有其他目标。选择 More 下的 **Customize sidebar**，或右键点击导航区域，即可固定或取消固定目标并恢复默认值。固定集合和 More 展开状态会存储在当前浏览器配置文件中，并在重新加载后保留。

紧凑页脚将连接状态、**Settings**、**Docs** 和移动设备配对放在一起。在桌面端，使用终端控件旁边的顶栏按钮折叠或展开侧边栏。在抽屉断点下，汉堡按钮会替代该控件。

## 它能做什么（今天）

<AccordionGroup>
  <Accordion title="聊天和 Talk">
    - 通过 Gateway 网关 WS（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）与模型聊天。
    - 聊天历史刷新会请求一个有界的最近窗口，并对每条消息设置文本上限，因此大型会话不会迫使浏览器在聊天可用前渲染完整转录负载。
    - 将鼠标悬停在公开 GitHub issue 或拉取请求链接上，或通过键盘聚焦该链接时，会显示其状态、标题、作者、近期活动、评论和变更统计信息。已连接的 Gateway 网关会获取并缓存公开元数据，且不会改变链接目标，包括 UI 使用远程 Gateway 网关时也是如此。Gateway 网关会在可用时使用 `GH_TOKEN` 或 `GITHUB_TOKEN`，并先确认仓库是公开的；否则它会使用 GitHub 的匿名 API，并采用更长缓存。
    - 通过浏览器实时会话进行 Talk。OpenAI 使用直接 WebRTC，Google Live 通过 WebSocket 使用受限的一次性浏览器令牌，纯后端实时语音插件使用 Gateway 网关中继传输。客户端拥有的提供商会话以 `talk.client.create` 启动；Gateway 网关中继会话以 `talk.session.create` 启动。中继会将提供商凭证保留在 Gateway 网关上，同时浏览器通过 `talk.session.appendAudio` 流式传输麦克风 PCM，通过 `talk.client.toolCall` 转发 `openclaw_agent_consult` 提供商工具调用，以便执行 Gateway 网关策略并使用更大的已配置 OpenClaw 模型，并通过 `talk.client.steer` 或 `talk.session.steer` 路由活动运行的语音 Steering。
    - 在 Chat 中流式传输工具调用和实时工具输出卡片（智能体事件）。
    - Activity 标签页会基于现有 `session.tool` / 工具事件投递，为实时工具活动提供浏览器本地、优先脱敏的摘要。

  </Accordion>
  <Accordion title="渠道、实例、会话、梦境">
    - 渠道：内置渠道以及内置/外部插件渠道状态、二维码登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）。
    - 渠道探测刷新会在慢速提供商检查完成前保持上一份快照可见，并在探测或审计超出其 UI 预算时标记部分快照。
    - 实例：在线状态列表和刷新（`system-presence`）。
    - 会话：默认列出已配置 Agent 的会话，固定常用会话、重命名会话、归档或恢复非活跃会话，从过期的未配置 Agent 会话键回退，并应用按会话的模型/thinking/fast/verbose/trace/reasoning 覆盖（`sessions.list`、`sessions.patch`）。固定会话排在最近未固定会话之上；已归档会话位于会话页面的归档视图中，并保留其转录记录。
    - 会话分组：Group by 控件按自定义分组、渠道、类型、Agent 或日期将会话表组织为分区。自定义分组通过 `sessions.patch`（`category`）按会话持久化，因此从消息渠道（Discord、Telegram、WhatsApp，...）启动的会话也可以分类；可以通过将行拖到某个分区上，或使用每行的分组选择器来分配分组，并通过 New group 操作创建分组。
    - 梦境：dreaming 状态、启用/禁用开关和 Dream Diary 阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、节点、Exec 审批">
    - Cron 作业：列出/添加/编辑/运行/启用/禁用以及运行历史（`cron.*`）。
    - Skills：状态、启用/禁用、安装、API key 更新（`skills.*`）。
    - 节点：列表以及能力上限（`node.list`）、创建移动端设置码，并批准设备配对（`device.pair.*`）。
    - Exec 审批：编辑 Gateway 网关或节点允许列表，并为 `exec host=gateway/node` 询问策略（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - MCP 有一个专用设置页面，用于已配置的服务器、启用状态、OAuth/过滤器/并行摘要、常用操作员命令，以及限定作用域的 `mcp` 配置编辑器。
    - 通过验证应用并重启（`config.apply`），然后唤醒最后一个活跃会话。
    - 写入包含 base-hash 保护，防止覆盖并发编辑。
    - 写入（`config.set`/`config.apply`/`config.patch`）会对提交配置载荷中的引用预检活跃 SecretRef 解析；未解析的活跃已提交引用会在写入前被拒绝。
    - 表单保存会丢弃无法从已保存配置恢复的过期脱敏占位符，同时保留仍映射到已保存密钥的脱敏值。
    - Schema 和表单渲染来自 `config.schema` / `config.schema.lookup`，包括字段 `title`/`description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及可用时的插件和渠道 schema。仅当快照具有安全的原始往返能力时，原始 JSON 编辑器才可用；否则 Control UI 会强制使用表单模式。
    - 原始 JSON 编辑器的 “Reset to saved” 会保留原始编写的形状（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照可以安全往返时，外部编辑在重置后仍会保留。
    - 结构化 SecretRef 对象值在表单文本输入中以只读方式渲染，以防止意外的对象到字符串损坏。

  </Accordion>
  <Accordion title="使用情况">
    - 基于会话得出的 token 和估算成本分析会与提供商计费保持分离。
    - 提供商卡片调用 `usage.status`，并显示由已配置提供商插件报告的实时计划名称、配额窗口、余额、支出和预算。
    - 提供商使用情况失败不会阻塞会话/成本仪表板；不可用的提供商卡片会显示自己的错误状态。

  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态/健康/模型快照、事件日志和手动 RPC 调用（`status`、`health`、`models.list`）。
    - 事件日志包括 Control UI 刷新/RPC 计时、慢速聊天/配置渲染计时，以及当浏览器公开这些 PerformanceObserver 条目类型时，用于长动画帧或长任务的浏览器响应性条目。
    - 日志：Gateway 网关文件日志的实时 tail，支持过滤/导出（`logs.tail`）。
    - 更新：运行包/git 更新并重启（`update.run`），附带重启报告，然后在重新连接后轮询 `update.status` 以验证正在运行的 Gateway 网关版本。

  </Accordion>
  <Accordion title="Cron 作业面板说明">
    - 对于隔离作业，交付默认公告摘要；对于仅内部运行，切换为 none。
    - 选择公告时会显示渠道/目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
    - 对于主会话作业，可使用 webhook 和 none 交付模式。
    - 高级编辑控件包括运行后删除、清除 Agent 覆盖、cron 精确/错峰选项、Agent 模型/thinking 覆盖，以及尽力而为交付开关。
    - 表单验证以内联方式显示字段级错误；无效值会禁用保存按钮，直到修复。
    - 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，webhook 将在没有 auth header 的情况下发送。
    - `cron.webhook` 是已弃用的旧版回退：运行 `openclaw doctor --fix`，将仍使用 `notify: true` 的已存储作业迁移为显式的按作业 webhook 或完成交付。

  </Accordion>
</AccordionGroup>

## MCP 页面

专用 MCP 页面是针对 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器的操作员视图。它本身不会启动 MCP 传输；可用它检查和编辑已保存配置，然后在需要实时服务器证明时使用 `openclaw mcp doctor --probe`。

典型工作流：

1. 从侧边栏打开 **MCP**。
2. 检查摘要卡片中的总数、已启用、OAuth 和已过滤服务器数量。
3. 查看每个服务器行的传输、启用状态、auth、过滤器、超时和命令提示。
4. 当某个服务器应保持配置但不参与运行时设备发现时，切换启用状态。
5. 编辑限定作用域的 `mcp` 配置部分，用于服务器定义、headers、TLS/mTLS 路径、OAuth 元数据、工具过滤器和 Codex 投影元数据。
6. 使用 **保存** 写入配置，或在正在运行的 Gateway 网关应应用已更改配置时使用 **保存并发布**。
7. 从终端运行 `openclaw mcp status --verbose`、`openclaw mcp doctor --probe` 或 `openclaw mcp reload`，用于静态诊断、实时证明或清除缓存运行时。

该页面会在渲染前脱敏包含凭证的 URL 类值，并在命令片段中引用服务器名称，因此复制的命令在包含空格或 shell 元字符时仍可工作。完整 CLI 和配置参考：[MCP](/zh-CN/cli/mcp)。

## Activity 标签页

Activity 标签页是一个短暂的浏览器本地实时工具活动观察器，派生自为聊天工具卡片提供支持的同一个 Gateway 网关 `session.tool` / 工具事件流。它不会添加另一个 Gateway 网关事件族、端点、持久活动存储、指标 feed 或外部观察器流。

Activity 条目只保留已清理的摘要和已脱敏、截断的输出预览。工具参数值不会存储在 Activity 状态中；UI 会显示参数已隐藏，并且只记录参数字段数量。内存中的列表跟随当前浏览器标签页，在 Control UI 内导航时保留，并在页面重新加载、会话切换或 **Clear** 时重置。

## 操作员终端

可停靠的操作员终端默认禁用。要启用它，请设置 `gateway.terminal.enabled: true` 并重启 Gateway 网关。终端需要 `operator.admin` 连接，并在活跃 Agent 工作区中打开主机 PTY。新标签页跟随当前选中的聊天 Agent。

<Warning>
终端是一个不受限制的主机 shell，并继承 Gateway 网关进程环境。仅在可信操作员部署中启用它。OpenClaw 会拒绝 `sandbox.mode: "all"` 的 Agent 终端会话；将活跃 Agent 更改为该模式会关闭其现有和进行中的终端会话。
</Warning>

使用 **Ctrl + 反引号** 切换停靠栏。布局支持底部和右侧停靠，会随浏览器视口调整大小，并保留多个 shell 标签页。参见 [Gateway 配置](/zh-CN/gateway/configuration-reference#gateway) 了解 `gateway.terminal.enabled` 和可选的 `gateway.terminal.shell` 覆盖。

会话可在断开连接后继续存在：页面重新加载、笔记本睡眠或网络短暂中断会在 Gateway 网关上分离会话，而不是终止会话，并且同一个浏览器标签页会在重新连接时重新附加并重放最近输出。分离的会话会在 `gateway.terminal.detachedSessionTimeoutSeconds` 后被终止（默认 300 秒；`0` 恢复为断开即终止）。`terminal.list` 显示可附加会话，`terminal.attach` 接管一个会话（tmux 风格接管），而 `terminal.text` 以纯文本读取会话的最近输出且不附加，这是面向 Agent/工具的便利功能。

终端还可作为全屏、仅终端文档在 `/?view=terminal` 使用。iOS 和 Android 应用会在其终端屏幕中嵌入此页面，并复用已存储的 Gateway 网关凭证；可用性遵循相同的 `gateway.terminal.enabled` 和 `operator.admin` 门禁，当已连接的 Gateway 网关不提供终端时，该页面会显示通知。

## 聊天行为

<AccordionGroup>
  <Accordion title="发送与历史语义">
    - `chat.send` 是**非阻塞**的：它会立即以 `{ runId, status: "started" }` 确认，响应通过 `chat` 事件流式传输。受信任的 Control UI 客户端也可能收到可选的 ACK 计时元数据，用于本地诊断。
    - 聊天上传接受图片和非视频文件。图片保留原生图片路径；其他文件会存储为托管媒体，并在历史记录中显示为附件链接。
    - 使用相同的 `idempotencyKey` 重新发送时，运行期间返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
    - 为了 UI 安全，`chat.history` 响应有大小限制。当转录条目过大时，Gateway 网关可能会截断长文本字段、省略较重的元数据块，并用占位符（`[chat.history omitted: message too large]`）替换超大的消息。
    - 当可见的助手消息在 `chat.history` 中被截断时，侧边阅读器可以按需通过 `chat.message.get` 获取完整的显示归一化转录条目，需要提供 `sessionKey`、必要时的活动 `agentId`，以及转录 `messageId`。如果 Gateway 网关仍然无法返回更多内容，阅读器会显示明确的不可用状态，而不是静默重复截断后的预览。
    - 助手/生成的图片会持久化为托管媒体引用，并通过经过身份验证的 Gateway 网关媒体 URL 回传，因此重新加载不依赖原始 base64 图片载荷继续留在聊天历史响应中。
    - 渲染 `chat.history` 时，Control UI 会从可见助手文本中剥离仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和被截断的工具调用块），以及泄漏的 ASCII/全角模型控制令牌。它会省略整个可见文本只包含精确静默令牌 `NO_REPLY` / `no_reply` 或 Heartbeat 确认令牌 `HEARTBEAT_OK` 的助手条目。
    - 在活动发送期间和最终历史刷新期间，如果 `chat.history` 短暂返回较旧的快照，聊天视图会保持本地乐观用户/助手消息可见；一旦 Gateway 网关历史追上，规范转录就会替换这些本地消息。
    - 实时 `chat` 事件是投递状态，而 `chat.history` 是从持久会话转录重建的。工具最终事件之后，Control UI 会重新加载历史记录，并只合并一小段乐观尾部；转录边界记录在 [WebChat](/zh-CN/web/webchat) 中。
    - `chat.inject` 会向会话转录追加一条助手备注，并广播一个 `chat` 事件用于仅 UI 更新（无 Agent 运行，无渠道投递）。
    - 侧边栏会列出最近会话，并提供新会话操作、全部会话链接，以及一个会打开完整会话选择器的会话搜索按钮（按所选 Agent 限定范围，支持搜索和分页）。新的仪表盘会话会从其第一条非命令消息异步获得一个简洁的生成标题；显式名称永远不会被替换。设置 `agents.defaults.utilityModel`（或 `agents.list[].utilityModel`）可将这个单独的模型调用路由到成本更低的模型。切换 Agent 时只显示绑定到该 Agent 的会话；如果该 Agent 尚无已保存的仪表盘会话，则回退到该 Agent 的主会话。
    - 每个会话选择器行都可以重命名、固定或归档会话。活动运行和 Agent 的主会话不能归档。归档当前选中的会话会将聊天切回该 Agent 的主会话。
    - 在桌面宽度下，聊天控件保持在一条紧凑行上，并在向下滚动转录时收起；向上滚动、返回顶部或到达底部时会恢复控件。
    - 连续重复的纯文本消息会渲染为一个气泡，并带有计数徽章。带有图片、附件、工具输出或画布预览的消息不会折叠。
    - 聊天标题中的模型和思考选择器会通过 `sessions.patch` 立即修补活动会话；它们是持久的会话覆盖项，而不是仅限单轮的发送选项。
    - 如果你在同一会话的模型选择器变更仍在保存时发送消息，撰写器会等待该会话补丁完成后再调用 `chat.send`，以便发送使用所选模型。
    - 输入 `/new` 会创建并切换到与新聊天相同的全新仪表盘会话；但如果配置了 `session.dmScope: "main"` 且当前父级是 Agent 的主会话，则会在原位重置主会话。输入 `/reset` 会保留 Gateway 网关对当前会话的显式原位重置。
    - 聊天模型选择器会请求 Gateway 网关配置的模型视图。如果存在 `agents.defaults.models`，该允许列表会驱动选择器，包括能让提供商范围目录保持动态的 `provider/*` 条目。否则，选择器会显示显式的 `models.providers.*.models` 条目，以及具备可用凭证的提供商。完整目录仍可通过调试 `models.list` RPC 使用 `view: "all"` 获取。
    - 当新的 Gateway 网关会话用量报告包含当前上下文令牌时，聊天撰写器工具栏会显示一个小型上下文用量环，展示已用百分比。打开该环可查看当前上下文窗口、最新运行的令牌计数和估算总成本、提供商/模型身份，以及报告时最新提供商响应的输入/输出/缓存成本明细。在上下文压力较高时，该环会切换为警告样式；在推荐压缩级别时，会显示一个紧凑按钮来运行正常的会话压缩路径。过期令牌快照会被隐藏，直到 Gateway 网关再次报告新鲜用量。

  </Accordion>
  <Accordion title="Talk 模式（浏览器实时）">
    Talk 模式使用已注册的实时语音提供商。使用 `talk.realtime.provider: "openai"` 加上 `openai` API key/OAuth 配置文件、外部 Codex 登录、`talk.realtime.providers.openai.apiKey` 或 `OPENAI_API_KEY` 来配置 OpenAI。已配置的 API key 来源优先，Codex OAuth 是自动回退。使用 `talk.realtime.provider: "google"` 加上 `talk.realtime.providers.google.apiKey` 来配置 Google。浏览器永远不会收到标准提供商 API key 或 OAuth 令牌：OpenAI 会收到用于 WebRTC 的临时 Realtime 客户端密钥，Google Live 会收到一次性、受约束的 Live API 认证令牌，用于浏览器 WebSocket 会话，并且指令和工具声明会由 Gateway 网关锁定到该令牌中。只暴露后端实时桥接的提供商会通过 Gateway 网关中继传输运行，因此凭证和供应商套接字保留在服务端，而浏览器音频通过经过身份验证的 Gateway 网关 RPC 传输。Realtime 会话提示由 Gateway 网关组装；`talk.client.create` 不接受调用方提供的指令覆盖项。

    聊天撰写器在 Talk 启动/停止按钮旁包含一个 Talk 选项插入符。它的紧凑面板只保留下一次 Talk 会话的语音、模型和灵敏度。**设置中的更多选项**会打开**设置 → 通信 → Talk**，其中保存持久的提供商、传输、推理强度、精确 VAD 阈值、静默持续时间和前缀填充默认值；更改这些默认值需要 `operator.admin` 访问权限。空白撰写器值会回退到这些已配置默认值或提供商默认值。配置 Gateway 网关中继会强制使用后端中继路径；配置 WebRTC 会让会话由客户端拥有，并且如果提供商无法创建浏览器会话，则会失败，而不是静默回退到中继。

    Talk 控件本身是撰写器工具栏中的麦克风按钮，旁边有一个小插入符用于打开 Talk 选项。Talk 启动时，撰写器状态行先显示 `Connecting Talk...`，音频连接后显示 `Talk live`，或者当实时工具调用正在通过 `talk.client.toolCall` 咨询已配置的更大模型时显示 `Asking OpenClaw...`。

    维护者实时冒烟测试：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 会验证 OpenAI 后端 WebSocket 桥接、OpenAI 浏览器 WebRTC SDP 交换、Google Live 受约束令牌浏览器 WebSocket 设置，以及带有假麦克风媒体的 Gateway 网关中继浏览器适配器。该命令只打印提供商状态，不记录密钥。

  </Accordion>
  <Accordion title="停止和中止">
    - 点击**停止**（调用 `chat.abort`）。
    - 运行处于活动状态时，普通跟进会排队。点击已排队消息上的 **Steer**，可将该跟进注入正在运行的轮次。
    - 输入 `/stop`（或独立的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）进行带外中止。
    - `chat.abort` 支持使用 `{ sessionKey }`（无 `runId`）中止该会话的所有活动运行。

  </Accordion>
  <Accordion title="保留中止部分内容">
    - 当运行被中止时，部分助手文本仍可显示在 UI 中。
    - 当存在已缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到转录历史中。
    - 持久化条目包含中止元数据，因此转录消费者可以区分中止部分和正常完成输出。

  </Accordion>
</AccordionGroup>

## 连接丢失和重新连接

一旦会话建立，Gateway 网关连接断开不会让你退出登录。客户端自动使用退避（800 ms 到 15 s）重试时，仪表盘会保持可见，并显示琥珀色的“Gateway 网关连接丢失 — 正在重新连接…”横幅。实时更新和操作会暂停，直到连接恢复；横幅中的**立即重试**会强制立即尝试。

登录门禁只会在尚未建立会话（首次打开、连接前页面重新加载）或 Gateway 网关主动拒绝凭证（令牌/密码错误、配对被撤销）时出现，这些状态需要你输入，而不是等待。

## PWA 安装和 Web Push

Control UI 随附 `manifest.webmanifest` 和 service worker，因此现代浏览器可以将其安装为独立 PWA。Web Push 允许 Gateway 网关用通知唤醒已安装的 PWA，即使标签页或浏览器窗口未打开。

如果页面在 OpenClaw 更新后立即显示**协议不匹配**，请先用 `openclaw dashboard` 重新打开仪表盘并强制刷新。如果仍然失败，请清除仪表盘来源的站点数据，或在私密浏览器窗口中测试；旧标签页或浏览器 service worker 缓存可能会继续运行更新前的 Control UI 包，并连接到更新后的 Gateway 网关。

| 表面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 清单。可访问后，浏览器会提供“安装应用”。                      |
| `ui/public/sw.js`                                     | 处理 `push` 事件和通知点击的 service worker。                      |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下）    | 自动生成的 VAPID 密钥对，用于签名 Web Push 载荷。                  |
| `push/web-push-subscriptions.json`                    | 持久化的浏览器订阅端点。                                           |

当你想固定密钥（多主机部署、密钥轮换或测试）时，可通过 Gateway 网关进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认为 `https://openclaw.ai`）

Control UI 使用这些带范围门控的 Gateway 网关方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` 获取当前有效的 VAPID 公钥。
- `push.web.subscribe` 注册一个 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` 移除已注册的端点。
- `push.web.test` 向调用方的订阅发送测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（参见 [配置](/zh-CN/gateway/configuration) 了解由中继支持的推送）和面向原生移动端配对的 `push.test` 方法。
</Note>

## 托管嵌入

助手消息可以使用 `[embed ...]` 短代码内联渲染托管的 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    禁用托管嵌入内的脚本执行。
  </Tab>
  <Tab title="scripts (default)">
    允许交互式嵌入，同时保持来源隔离；通常足够用于自包含的浏览器游戏/小组件。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上为有意需要更高权限的同站点文档添加 `allow-same-origin`。
  </Tab>
</Tabs>

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
仅在嵌入文档确实需要同源行为时使用 `trusted`。对于大多数由智能体生成的游戏和交互式画布，`scripts` 是更安全的选择。
</Warning>

绝对外部 `http(s)` 嵌入 URL 默认保持被阻止。若要允许 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天消息宽度

分组聊天消息使用可读性较好的默认最大宽度。宽屏显示器部署可以通过设置 `gateway.controlUi.chatMessageMaxWidth` 覆盖它，而无需修补内置 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

该值会在到达浏览器前进行验证。支持的形式包括普通长度和百分比，例如 `960px` 或 `82%`，以及受约束的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 宽度表达式。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="集成 Tailscale Serve（首选）">
    将 Gateway 网关 保持在回环地址上，并让 Tailscale Serve 通过 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开 `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）。

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行认证。OpenClaw 通过使用 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该标头匹配来验证身份，并且仅在请求命中回环地址且带有 Tailscale 的 `x-forwarded-*` 标头时接受这些请求。对于带有浏览器设备身份的 Control UI 操作员会话，这条经过验证的 Serve 路径还会跳过设备配对往返；无设备浏览器和节点角色连接仍遵循常规设备检查。如果你想即使对 Serve 流量也要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`，然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于该异步 Serve 身份路径，同一客户端 IP 和认证范围的认证失败尝试会在写入速率限制前被串行化。因此，来自同一浏览器的并发错误重试可能会在第二个请求上显示 `retry later`，而不是两个普通不匹配并行竞争。

    <Warning>
    无令牌 Serve 认证假定网关主机是可信的。如果不可信的本地代码可能在该主机上运行，请要求令牌/密码认证。
    </Warning>

  </Tab>
  <Tab title="绑定到 tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    打开 `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）。

    将匹配的共享密钥粘贴到 UI 设置中（作为 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你通过纯 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）打开仪表板，浏览器会运行在**非安全上下文**中并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

已记录的例外：

- 仅限 localhost 的不安全 HTTP 兼容性，使用 `gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作员 Control UI 认证
- 紧急兜底 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复：**使用 HTTPS（Tailscale Serve），或在本地通过 `https://<magicdns>/`（Serve）或 `http://127.0.0.1:18789/`（在网关主机上）打开 UI。

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

    - 它允许 localhost Control UI 会话在非安全 HTTP 上下文中无需设备身份即可继续。
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
    `dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，是严重的安全降级。紧急使用后请尽快恢复。
    </Warning>

  </Accordion>
  <Accordion title="可信代理说明">
    - 成功的可信代理认证可以允许没有设备身份的**操作员** Control UI 会话进入。
    - 这**不会**扩展到节点角色 Control UI 会话。
    - 同主机 local loopback 反向代理仍不满足可信代理认证；参见 [可信代理认证](/zh-CN/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

参见 [Tailscale](/zh-CN/gateway/tailscale) 获取 HTTPS 设置指南。

## 内容安全策略

Control UI 附带严格的 `img-src` 策略：只允许**同源**资产、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且永远不会发起网络抓取。

实践中：

- 在相对路径下提供的头像和图片（例如 `/avatars/<id>`）仍会渲染，包括 UI 抓取并转换为本地 `blob:` URL 的认证头像路由。
- 内联 `data:image/...` URL 仍会渲染。
- Control UI 创建的本地 `blob:` URL 仍会渲染。
- GitHub 链接预览头像由 Gateway 网关 从 GitHub 的固定头像主机抓取，并作为有界 `data:` URL 返回；操作员浏览器永远不会联系远程头像主机。
- 渠道元数据发出的远程头像 URL 会在 Control UI 的头像辅助函数中被剥离，并替换为内置 logo/徽章，因此受损或恶意渠道无法强制操作员浏览器进行任意远程图片抓取。

此策略始终启用且不可配置。

## 头像路由认证

配置了网关认证时，Control UI 头像端点要求与 API 其余部分相同的网关令牌：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在相同规则下返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与相邻的 assistant-media 路由一致），因此在其他方面受保护的主机上，头像路由不会泄露智能体身份。
- Control UI 在抓取头像时将网关令牌作为 bearer 标头转发，并使用已认证的 blob URL，以便图片仍能在仪表板中渲染。

如果你禁用网关认证（不建议在共享主机上这样做），头像路由也会变为未认证，这与网关其余部分保持一致。

## 助手媒体路由认证

配置了网关认证时，助手本地媒体预览使用两步路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 要求常规 Control UI 操作员认证；浏览器在检查可用性时会将网关令牌作为 bearer 标头发送。
- 成功的元数据响应包含一个短生命周期的 `mediaTicket`，其范围限定为该确切源路径。
- 浏览器渲染的图片、音频、视频和文档 URL 使用 `mediaTicket=<ticket>`，而不是活动网关令牌或密码。票据会快速过期，且无法授权不同的源。

这能让媒体渲染与浏览器原生媒体元素兼容，同时避免将可复用的网关凭证放入可见的媒体 URL。

## 构建 UI

Gateway 网关 从 `dist/control-ui` 提供静态文件：

```bash
pnpm ui:build
```

可选的绝对基路径（固定资产 URL）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本地开发（独立开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 空白 Control UI 页面

如果浏览器加载了空白仪表板，且 DevTools 没有显示有用错误，某个扩展或早期内容脚本可能阻止了 JavaScript 模块应用求值。静态页面包含一个纯 HTML 恢复面板，会在启动后未注册 `<openclaw-app>` 时显示。

更改浏览器环境后使用面板的**重试**操作，或在完成以下检查后手动重新加载：

- 禁用会注入到所有页面的扩展，尤其是带有 `<all_urls>` 内容脚本的扩展。
- 尝试使用隐私窗口、干净的浏览器配置文件或其他浏览器。
- 保持 Gateway 网关 运行，并在浏览器更改后验证同一个仪表板 URL。

## 调试/测试：开发服务器 + 远程 Gateway 网关

Control UI 是静态文件；WebSocket 目标可配置，并且可以不同于 HTTP 来源。当你想在本地使用 Vite 开发服务器，而 Gateway 网关 在其他位置运行时，这很方便。

<Steps>
  <Step title="启动 UI 开发服务器">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="使用 gatewayUrl 打开">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    可选的一次性认证（如需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` 在加载后存储在 localStorage 中，并会从 URL 中移除。
    - 如果你通过 `gatewayUrl` 传入完整的 `ws://` 或 `wss://` 端点，请对该值进行 URL 编码，以便浏览器正确解析查询字符串。
    - 只要可能，`token` 应通过 URL 片段（`#token=...`）传入。片段不会发送到服务器，这可以避免请求日志和 Referer 泄露。旧版 `?token=` 查询参数仍会为兼容性导入一次，但仅作为后备，并会在引导启动后立即剥离。
    - `password` 仅保存在内存中。
    - 设置 `gatewayUrl` 时，UI 不会回退到配置或环境凭据。请显式提供 `token`（或 `password`）；缺少显式凭据会报错。
    - 当 Gateway 网关位于 TLS 后方（Tailscale Serve、HTTPS 代理等）时，请使用 `wss://`。
    - `gatewayUrl` 只会在顶层窗口中接受（不接受嵌入式窗口），以防止点击劫持。
    - 公开的非 loopback Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整源）。来自 loopback、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主机的私有同源 LAN/Tailnet 加载无需启用 Host-header 后备即可接受。
    - Gateway 网关启动时可能会根据有效的运行时绑定和端口播种本地源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但远程浏览器源仍需要显式条目。
    - 除非用于严格受控的本地测试，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`；它表示允许任何浏览器源，而不是“匹配我正在使用的任何主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host-header 源后备模式，但这是危险的安全模式。

  </Accordion>
</AccordionGroup>

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

- [仪表板](/zh-CN/web/dashboard) — Gateway 网关仪表板
- [健康检查](/zh-CN/gateway/health) — Gateway 网关健康监控
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
