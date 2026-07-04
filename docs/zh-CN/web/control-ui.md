---
read_when:
    - 你想从浏览器操作 Gateway 网关
    - 你想要无需 SSH 隧道的 Tailnet 访问
sidebarTitle: Control UI
summary: 基于浏览器的 Gateway 网关 Control UI（聊天、活动、节点、配置）
title: Control UI
x-i18n:
    generated_at: "2026-07-04T20:25:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 883e951b304a104a5cb2d0197199d06e372b1b8a25efdfd082ae190575bf409d
    source_path: web/control-ui.md
    workflow: 16
---

Control UI 是由 Gateway 网关提供服务的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它在同一端口上**直接与 Gateway 网关 WebSocket** 通信。

## 快速打开（本地）

如果 Gateway 网关运行在同一台计算机上，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

<Note>
在原生 Windows LAN 绑定上，即使 `127.0.0.1` 可在 Gateway 网关主机上正常工作，Windows Firewall 或组织管理的 Group Policy 仍可能阻止公布的 LAN URL。在 Windows 主机上运行 `openclaw gateway status --deep`；它会报告可能被阻止的端口、配置文件不匹配，以及策略可能忽略的本地防火墙规则。
</Note>

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时，使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时，使用受信代理身份标头

仪表盘设置面板会为当前浏览器标签页会话和选定的 Gateway 网关 URL 保留一个 token；密码不会被持久化。新手引导通常会在首次连接时为共享密钥认证生成 Gateway 网关 token，但当 `gateway.auth.mode` 为 `"password"` 时，密码认证也可用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关通常需要**一次性配对审批**。这是一项防止未授权访问的安全措施。

**你会看到：** "disconnected (1008): pairing required"

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

如果浏览器使用已更改的认证详情（角色/范围/公钥）重试配对，之前的待处理请求会被取代，并创建新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已配对，而你将其从只读访问改为写入/管理员访问，这会被视为一次审批升级，而不是静默重新连接。OpenClaw 会保留旧审批有效，阻止更宽泛权限的重新连接，并要求你明确批准新的范围集合。

批准后，该设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则无需重新批准。有关 token 轮换和撤销，请参阅 [设备 CLI](/zh-CN/cli/devices)。

通过 `openclaw_gateway` 适配器连接的 Paperclip 智能体使用同一个首次运行审批流程。初次连接尝试后，运行 `openclaw devices approve --latest` 预览待处理请求，然后重新运行打印出的 `openclaw devices approve <requestId>` 命令来批准它。为远程 Gateway 网关传入明确的 `--url` 和 `--token` 值。若要在重启之间保持审批稳定，请在 Paperclip 中配置持久的 `adapterConfig.devicePrivateKeyPem`，而不是让它在每次运行时生成新的临时设备身份。

<Note>
- 直接的 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动获批。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份验证通过且浏览器提供其设备身份时，Tailscale Serve 可以为 Control UI 操作员会话跳过配对往返。
- 直接 Tailnet 绑定、LAN 浏览器连接，以及没有设备身份的浏览器配置文件仍需要明确审批。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据将需要重新配对。

</Note>

## 配对移动设备

已配对的管理员可以创建 iOS/Android 连接二维码，而无需
打开终端：

<Steps>
  <Step title="打开移动端配对">
    选择 **节点**，然后点击 **设备** 卡片中的 **配对移动设备**。
  </Step>
  <Step title="连接手机">
    在 OpenClaw 移动应用中，打开 **设置** → **Gateway 网关** 并扫描二维码。
    你也可以改为复制并粘贴设置码。
  </Step>
  <Step title="确认连接">
    官方 iOS/Android 应用会自动连接。如果 **设备** 显示
    待处理请求，请在批准前检查其角色和范围。
  </Step>
</Steps>

创建设置码需要 `operator.admin`；没有该权限的
会话中按钮会被禁用。设置码包含一个短期有效的引导凭证，
因此在有效期内请像对待密码一样对待二维码和复制的代码。对于远程
配对，Gateway 网关必须解析为 `wss://`（例如通过 Tailscale
Serve/Funnel）；纯 `ws://` 仅限于 loopback 和私有 LAN 地址。
完整的安全和回退详情请参阅 [配对](/zh-CN/channels/pairing#pair-from-the-control-ui-recommended)。

## 个人身份（浏览器本地）

Control UI 支持按浏览器设置个人身份（显示名称和头像），并将其附加到传出消息，用于在共享会话中标明来源。它位于浏览器存储中，作用域限定为当前浏览器配置文件，不会同步到其他设备，也不会在服务端持久化，除了你实际发送消息上的正常转录作者元数据。清除站点数据或切换浏览器会将其重置为空。

同样的浏览器本地模式也适用于助手头像覆盖。上传的助手头像只会在本地浏览器中覆盖 Gateway 网关解析出的身份，绝不会通过 `config.patch` 往返传输。共享的 `ui.assistant.avatar` 配置字段仍可供直接写入该字段的非 UI 客户端使用（例如脚本化 Gateway 网关或自定义仪表盘）。

## 运行时配置端点

Control UI 会从 `/control-ui-config.json` 获取其运行时设置，该路径相对于 Gateway 网关的 Control UI base path 解析（例如，当 UI 在 `/__openclaw__/` 下提供服务时为 `/__openclaw__/control-ui-config.json`）。该端点与其余 HTTP 表面受同一 Gateway 网关认证保护：未认证的浏览器无法获取它，成功获取需要已有有效的 Gateway 网关 token/密码、Tailscale Serve 身份，或受信代理身份。

## 语言支持

Control UI 可在首次加载时根据你的浏览器语言区域进行本地化。若之后要覆盖它，请打开 **概览 -> Gateway 网关访问 -> 语言**。语言区域选择器位于 Gateway 网关访问卡片中，而不是外观下。

- 支持的语言区域：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英语翻译会在浏览器中延迟加载。
- 选定的语言区域会保存在浏览器存储中，并在以后访问时复用。
- 缺失的翻译键会回退到英语。

文档翻译会为同一组非英语语言区域生成，但文档站点内置的 Mintlify 语言选择器仅限于 Mintlify 接受的语言区域代码。泰语（`th`）和波斯语（`fa`）文档仍会在发布仓库中生成；在 Mintlify 支持这些代码之前，它们可能不会出现在该选择器中。

## 外观主题

外观面板保留内置的 Claw、Knot 和 Dash 主题，另加一个浏览器本地 tweakcn 导入槽。若要导入主题，请打开 [tweakcn 编辑器](https://tweakcn.com/editor/theme)，选择或创建一个主题，点击 **分享**，然后将复制的主题链接粘贴到外观中。导入器也接受 `https://tweakcn.com/r/themes/<id>` 注册表 URL、类似 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 的编辑器 URL、相对 `/themes/<id>` 路径、原始主题 ID，以及 `amethyst-haze` 这类默认主题名称。

外观还包含一个浏览器本地的文本大小设置。该设置与其余 Control UI 偏好一起存储，应用于聊天文本、编辑器文本、工具卡片和聊天侧边栏，并保持文本输入至少为 16px，以便移动端 Safari 在聚焦时不会自动缩放。

导入的主题仅存储在当前浏览器配置文件中。它们不会写入 Gateway 网关配置，也不会跨设备同步。替换导入的主题会更新这一个本地槽；如果当前选中的是导入主题，清除它会将活动主题切回 Claw。

## 它能做什么（目前）

<AccordionGroup>
  <Accordion title="聊天和 Talk">
    - 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 聊天历史刷新会请求一个有界的近期窗口，并对每条消息设置文本上限，因此大型会话不会在聊天可用前迫使浏览器渲染完整转录载荷。
    - 通过浏览器实时会话进行 Talk。OpenAI 使用直接 WebRTC，Google Live 通过 WebSocket 使用受约束的一次性浏览器 token，而仅后端实时语音插件使用 Gateway 网关中继传输。客户端拥有的提供商会话以 `talk.client.create` 开始；Gateway 网关中继会话以 `talk.session.create` 开始。中继会将提供商凭证保留在 Gateway 网关上，同时浏览器通过 `talk.session.appendAudio` 流式传输麦克风 PCM，通过 `talk.client.toolCall` 将 `openclaw_agent_consult` 提供商工具调用转发给 Gateway 网关策略和更大的已配置 OpenClaw 模型，并通过 `talk.client.steer` 或 `talk.session.steer` 路由活动运行的语音 steering。
    - 在聊天中流式传输工具调用 + 实时工具输出卡片（智能体事件）。
    - 活动标签页提供浏览器本地、以脱敏优先的现有 `session.tool` / 工具事件传递实时工具活动摘要。

  </Accordion>
  <Accordion title="渠道、实例、会话、梦境">
    - 渠道：内置以及内置/外部插件渠道状态、二维码登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）。
    - 渠道探测刷新会在较慢的提供商检查完成期间保持之前的快照可见，并在探测或审计超出其 UI 预算时标记部分快照。
    - 实例：在线列表 + 刷新（`system-presence`）。
    - 会话：默认列出已配置智能体会话，固定常用会话，重命名它们，归档或恢复非活动会话，从陈旧的未配置智能体会话键回退，并应用按会话的模型/thinking/fast/verbose/trace/reasoning 覆盖（`sessions.list`、`sessions.patch`）。固定会话排在近期未固定会话之上；归档会话位于会话页面的归档视图中，并保留其转录。
    - 梦境：Dreaming 状态、启用/禁用切换，以及 Dream Diary 阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、节点、Exec 审批">
    - Cron 作业：列出/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）。
    - Skills：状态、启用/禁用、安装、API key 更新（`skills.*`）。
    - 节点：列出 + 能力（`node.list`）、创建移动端设置码，以及批准设备配对（`device.pair.*`）。
    - Exec 审批：编辑 Gateway 网关或节点 allowlist + 为 `exec host=gateway/node` 设置询问策略（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - MCP 为已配置的服务器、启用状态、OAuth/过滤器/并行摘要、常用运维命令，以及作用域限定的 `mcp` 配置编辑器提供专用设置页面。
    - 通过校验后应用 + 重启（`config.apply`），并唤醒最后一个活跃会话。
    - 写入包含基础哈希防护，防止覆盖并发编辑。
    - 写入（`config.set`/`config.apply`/`config.patch`）会对提交的配置载荷中的引用预检活跃 SecretRef 解析；未解析的活跃提交引用会在写入前被拒绝。
    - 表单保存会丢弃无法从已保存配置恢复的陈旧脱敏占位符，同时保留仍映射到已保存密钥的脱敏值。
    - Schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及可用时的插件 + 渠道 schema）；仅当快照具备安全的原始往返能力时，才可使用原始 JSON 编辑器。
    - 如果快照无法安全往返原始文本，Control UI 会强制使用表单模式，并为该快照禁用原始模式。
    - 原始 JSON 编辑器“重置为已保存内容”会保留原始编写的形状（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照可以安全往返时，外部编辑能在重置后保留。
    - 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，防止意外的对象到字符串损坏。

  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）。
    - 事件日志包含 Control UI 刷新/RPC 耗时、慢聊天/配置渲染耗时，以及浏览器暴露这些 PerformanceObserver 条目类型时的长动画帧或长任务浏览器响应性条目。
    - 日志：带过滤/导出的 Gateway 网关文件日志实时尾随（`logs.tail`）。
    - 更新：运行包/git 更新 + 重启（`update.run`）并生成重启报告，然后在重连后轮询 `update.status` 以验证正在运行的 Gateway 网关版本。

  </Accordion>
  <Accordion title="Cron 任务面板说明">
    - 对于隔离任务，投递默认是公告摘要。如果你希望仅内部运行，可以切换为无。
    - 选择公告时会显示渠道/目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
    - 对于主会话任务，可使用 webhook 和无投递模式。
    - 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确/错峰选项、智能体模型/思考覆盖，以及尽力投递开关。
    - 表单校验以内联方式显示字段级错误；无效值会禁用保存按钮，直到修复。
    - 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，webhook 会在没有 auth 标头的情况下发送。
    - 已弃用的回退：运行 `openclaw doctor --fix`，将存储的带有 `notify: true` 的旧版任务从 `cron.webhook` 迁移到显式的按任务 webhook 或完成投递。

  </Accordion>
</AccordionGroup>

## MCP 页面

专用 MCP 页面是针对 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器的运维视图。它本身不会启动 MCP 传输；可用它检查和编辑已保存配置，然后在需要实时服务器证明时使用 `openclaw mcp doctor --probe`。

典型工作流：

1. 从侧边栏打开 **MCP**。
2. 检查摘要卡片中的总数、已启用、OAuth 和已过滤服务器数量。
3. 查看每个服务器行的传输、启用状态、认证、过滤器、超时和命令提示。
4. 当某个服务器应保留配置但不参与运行时设备发现时，切换启用状态。
5. 编辑作用域限定的 `mcp` 配置分区，用于服务器定义、标头、TLS/mTLS 路径、OAuth 元数据、工具过滤器和 Codex 投影元数据。
6. 使用 **保存** 写入配置，或在正在运行的 Gateway 网关应应用已更改配置时使用 **保存并发布**。
7. 当已编辑的进程需要静态诊断、实时证明或缓存运行时释放时，从终端运行 `openclaw mcp status --verbose`、`openclaw mcp doctor --probe` 或 `openclaw mcp reload`。

该页面会在渲染前脱敏带凭据的类 URL 值，并在命令片段中引用服务器名称，因此复制的命令在包含空格或 shell 元字符时仍可工作。完整 CLI 和配置参考位于 [MCP](/zh-CN/cli/mcp)。

## 活动标签页

活动标签页是一个临时的浏览器本地观察器，用于实时工具活动。它派生自与聊天工具卡片相同的 Gateway 网关 `session.tool` / 工具事件流；它不会添加另一个 Gateway 网关事件族、端点、持久活动存储、指标源或外部观察器流。

活动条目只保留已清理的摘要和脱敏、截断的输出预览。工具参数值不会存储在活动状态中；UI 会显示参数已隐藏，并只记录参数字段数量。内存列表跟随当前浏览器标签页，在 Control UI 内导航时保留，并在页面重新加载、会话切换或点击 **清除** 时重置。

## 聊天行为

<AccordionGroup>
  <Accordion title="发送和历史语义">
    - `chat.send` 是**非阻塞**的：它会立即以 `{ runId, status: "started" }` 确认，响应通过 `chat` 事件流式传输。受信任的 Control UI 客户端也可能收到可选 ACK 耗时元数据，用于本地诊断。
    - 聊天上传接受图片和非视频文件。图片保留原生图片路径；其他文件会存储为托管媒体，并在历史记录中显示为附件链接。
    - 使用相同 `idempotencyKey` 重新发送时，运行期间返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
    - 为了 UI 安全，`chat.history` 响应有大小限制。当转录条目过大时，Gateway 网关可能会截断长文本字段、省略大型元数据块，并用占位符（`[chat.history omitted: message too large]`）替换超大消息。
    - 当可见助手消息在 `chat.history` 中被截断时，侧边阅读器可以通过 `sessionKey`、需要时的活跃 `agentId`，以及转录 `messageId`，按需通过 `chat.message.get` 获取完整的显示规范化转录条目。如果 Gateway 网关仍无法返回更多内容，阅读器会显示明确的不可用状态，而不是静默重复截断预览。
    - 助手/生成的图片会持久化为托管媒体引用，并通过已认证的 Gateway 网关媒体 URL 返回，因此重新加载不依赖原始 base64 图片载荷继续保留在聊天历史响应中。
    - 渲染 `chat.history` 时，Control UI 会从可见助手文本中剥离仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和被截断的工具调用块），以及泄漏的 ASCII/全角模型控制 token，并省略整个可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 或 Heartbeat 确认 token `HEARTBEAT_OK` 的助手条目。
    - 在活跃发送期间以及最终历史刷新期间，如果 `chat.history` 短暂返回较旧快照，聊天视图会继续显示本地乐观用户/助手消息；一旦 Gateway 网关历史追上，规范转录会替换这些本地消息。
    - 实时 `chat` 事件是投递状态，而 `chat.history` 从持久会话转录重建。工具最终事件之后，Control UI 会重新加载历史记录，并只合并一个很小的乐观尾部；转录边界在 [WebChat](/zh-CN/web/webchat) 中有文档说明。
    - `chat.inject` 会向会话转录追加一条助手备注，并广播一个 `chat` 事件用于仅 UI 更新（无智能体运行，无渠道投递）。
    - 侧边栏会列出最近会话，并包含“新建会话”操作、“所有会话”链接，以及打开完整会话选择器的会话搜索按钮（按所选智能体限定作用域，带搜索和分页）。切换智能体时，仅显示绑定到该智能体的会话；如果该智能体尚无已保存的仪表盘会话，则回退到该智能体的主会话。
    - 每个会话选择器行都可以重命名、置顶或归档会话。活跃运行和智能体的主会话不能归档。归档当前选中的会话会将聊天切回该智能体的主会话。
    - 在桌面宽度下，聊天控件保持在一行紧凑布局中，并在向下滚动转录时折叠；向上滚动、返回顶部或到达底部会恢复控件。
    - 连续重复的纯文本消息会渲染为一个气泡，并带有计数徽章。携带图片、附件、工具输出或画布预览的消息不会折叠。
    - 聊天标题中的模型和思考选择器会通过 `sessions.patch` 立即修补活跃会话；它们是持久会话覆盖，而不是仅限单轮的发送选项。
    - 如果你在同一会话的模型选择器更改仍在保存时发送消息，编写器会等待该会话修补完成后再调用 `chat.send`，以便发送使用所选模型。
    - 在 Control UI 中输入 `/new` 会创建并切换到与“新建聊天”相同的全新仪表盘会话，除非已配置 `session.dmScope: "main"` 且当前父级是智能体的主会话；在这种情况下，它会就地重置主会话。输入 `/reset` 会保留 Gateway 网关对当前会话的显式就地重置。
    - 聊天模型选择器会请求 Gateway 网关的已配置模型视图。如果存在 `agents.defaults.models`，该允许列表会驱动选择器，包括保持提供商作用域目录动态的 `provider/*` 条目。否则，选择器会显示显式的 `models.providers.*.models` 条目以及具备可用认证的提供商。完整目录仍可通过调试 `models.list` RPC 使用 `view: "all"` 获取。
    - 当新的 Gateway 网关会话用量报告包含当前上下文 token 时，聊天编写器工具栏会显示一个小型上下文用量环和已用百分比；完整 token 详情位于其工具提示中。该环在高上下文压力下切换为警告样式，并在建议压缩级别显示一个紧凑按钮，用于运行常规会话压缩路径。陈旧 token 快照会被隐藏，直到 Gateway 网关再次报告新的用量。

  </Accordion>
  <Accordion title="Talk 模式（浏览器实时）">
    Talk 模式使用已注册的实时语音提供商。配置 OpenAI 时，使用 `talk.realtime.provider: "openai"` 加上 `openai` API key 认证配置文件、`talk.realtime.providers.openai.apiKey` 或 `OPENAI_API_KEY`；OpenAI OAuth 配置文件不会配置 Realtime 语音。配置 Google 时，使用 `talk.realtime.provider: "google"` 加上 `talk.realtime.providers.google.apiKey`。浏览器永远不会收到标准提供商 API key。OpenAI 会收到一个用于 WebRTC 的临时 Realtime 客户端密钥。Google Live 会收到一个用于浏览器 WebSocket 会话的一次性受限 Live API 认证 token，其说明和工具声明由 Gateway 网关锁定到该 token 中。仅暴露后端实时桥接的提供商会通过 Gateway 网关中继传输运行，因此凭据和供应商套接字保留在服务器端，而浏览器音频通过已认证的 Gateway 网关 RPC 移动。Realtime 会话提示由 Gateway 网关组装；`talk.client.create` 不接受调用方提供的指令覆盖。

    聊天输入区在 Talk 开始/停止按钮旁边包含一个 Talk 选项按钮。这些选项会应用于下一个 Talk 会话，并且可以覆盖提供商、传输、模型、语音、推理强度、VAD 阈值、静默时长和前缀填充。当某个选项为空时，Gateway 网关会使用已配置的默认值（如果可用）或提供商默认值。选择 Gateway 网关中继会强制使用后端中继路径；选择 WebRTC 会让会话由客户端拥有，并且如果提供商无法创建浏览器会话，则会失败，而不是静默回退到中继。

    在聊天输入区中，Talk 控件是麦克风听写按钮旁边的波形按钮。Talk 启动后，输入区状态行会显示 `Connecting Talk...`，音频连接后显示 `Talk live`，或者在实时工具调用通过 `talk.client.toolCall` 咨询已配置的更大模型时显示 `Asking OpenClaw...`。

    维护者实时冒烟测试：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 会验证 OpenAI 后端 WebSocket 桥接、OpenAI 浏览器 WebRTC SDP 交换、Google Live 受限令牌浏览器 WebSocket 设置，以及带有伪麦克风媒体的 Gateway 网关中继浏览器适配器。该命令只打印提供商状态，不会记录密钥。

  </Accordion>
  <Accordion title="停止和中止">
    - 点击 **停止**（调用 `chat.abort`）。
    - 当运行处于活动状态时，普通的后续消息会排队。点击排队消息上的 **Steer**，可将该后续消息注入正在运行的轮次。
    - 输入 `/stop`（或独立的中止短语，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以带外中止。
    - `chat.abort` 支持 `{ sessionKey }`（无 `runId`），用于中止该会话的所有活动运行。

  </Accordion>
  <Accordion title="中止时保留部分内容">
    - 当运行被中止时，部分助手文本仍可显示在 UI 中。
    - 当存在已缓冲输出时，Gateway 网关会将中止时的部分助手文本持久化到转录历史中。
    - 持久化条目包含中止元数据，因此转录消费者可以区分中止部分与正常完成输出。

  </Accordion>
</AccordionGroup>

## PWA 安装和 Web Push

Control UI 随附一个 `manifest.webmanifest` 和一个 service worker，因此现代浏览器可以将其安装为独立 PWA。Web Push 让 Gateway 网关即使在标签页或浏览器窗口未打开时，也可以通过通知唤醒已安装的 PWA。

如果页面在 OpenClaw 更新后立即显示 **协议不匹配**，请先用 `openclaw dashboard` 重新打开仪表盘并强制刷新页面。如果仍然失败，请清除仪表盘源的站点数据，或在隐私浏览器窗口中测试；旧标签页或浏览器 service-worker 缓存可能会让更新前的 Control UI 包继续对接更新后的 Gateway 网关。

| 表面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 清单。浏览器在可访问后会提供“安装应用”。                      |
| `ui/public/sw.js`                                     | 处理 `push` 事件和通知点击的 service worker。                     |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下）    | 自动生成的 VAPID 密钥对，用于签名 Web Push 载荷。                  |
| `push/web-push-subscriptions.json`                    | 持久化的浏览器订阅端点。                                           |

当你想固定密钥（用于多主机部署、密钥轮换或测试）时，可通过 Gateway 网关进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认为 `https://openclaw.ai`）

Control UI 使用这些按范围限制的 Gateway 网关方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` — 获取当前有效的 VAPID 公钥。
- `push.web.subscribe` — 注册一个 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已注册端点。
- `push.web.test` — 向调用方的订阅发送测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（有关中继支持的推送，请参阅 [配置](/zh-CN/gateway/configuration)）以及现有的 `push.test` 方法，后者面向原生移动配对。
</Note>

## 托管嵌入

助手消息可以使用 `[embed ...]` 短代码内联渲染托管的 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    禁用托管嵌入内的脚本执行。
  </Tab>
  <Tab title="scripts（默认）">
    允许交互式嵌入，同时保持源隔离；这是默认值，通常足以用于自包含的浏览器游戏/小组件。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上添加 `allow-same-origin`，用于有意需要更强权限的同站点文档。
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
只有当嵌入文档确实需要同源行为时，才使用 `trusted`。对于大多数 Agent 生成的游戏和交互式画布，`scripts` 是更安全的选择。
</Warning>

默认情况下，绝对外部 `http(s)` 嵌入 URL 仍会被阻止。如果你确实希望 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天消息宽度

分组聊天消息使用易读的默认最大宽度。宽屏显示器部署可以通过设置 `gateway.controlUi.chatMessageMaxWidth` 覆盖它，而无需修补内置 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

该值会在到达浏览器前进行验证。支持的值包括普通长度和百分比，例如 `960px` 或 `82%`，以及受约束的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 宽度表达式。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="集成式 Tailscale Serve（首选）">
    将 Gateway 网关保留在 loopback 上，并让 Tailscale Serve 通过 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开：

    - `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行认证。OpenClaw 会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该标头匹配来验证身份，而且只有当请求通过 loopback 携带 Tailscale 的 `x-forwarded-*` 标头进入时才接受这些标头。对于带有浏览器设备身份的 Control UI 操作员会话，这条已验证的 Serve 路径也会跳过设备配对往返；无设备浏览器和节点角色连接仍会遵循普通设备检查。如果你希望即使是 Serve 流量也必须使用显式共享密钥凭据，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于这条异步 Serve 身份路径，同一客户端 IP 和认证范围的失败认证尝试会在写入速率限制前串行化。因此，来自同一浏览器的并发错误重试可能会在第二个请求上显示 `retry later`，而不是两个普通不匹配并行竞速。

    <Warning>
    无令牌 Serve 认证假设网关主机可信。如果不可信的本地代码可能在该主机上运行，请要求 token/password 认证。
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

## 不安全 HTTP

如果你通过明文 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）打开仪表盘，浏览器会在 **非安全上下文** 中运行并阻止 WebCrypto。默认情况下，OpenClaw 会 **阻止** 没有设备身份的 Control UI 连接。

已记录的例外：

- 仅 localhost 的不安全 HTTP 兼容性，使用 `gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成操作员 Control UI 认证
- 应急 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复：**使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在网关主机上）

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

    - 它允许 localhost Control UI 会话在非安全 HTTP 上下文中不带设备身份继续进行。
    - 它不会绕过配对检查。
    - 它不会放宽远程（非 localhost）设备身份要求。

  </Accordion>
  <Accordion title="仅限应急">
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
    `dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，是严重的安全降级。应急使用后请尽快恢复。
    </Warning>

  </Accordion>
  <Accordion title="可信代理说明">
    - 成功的 trusted-proxy 认证可以允许没有设备身份的 **操作员** Control UI 会话进入。
    - 这 **不会** 扩展到节点角色 Control UI 会话。
    - 同主机 loopback 反向代理仍不满足 trusted-proxy 认证；请参阅 [可信代理认证](/zh-CN/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

有关 HTTPS 设置指导，请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 随附严格的 `img-src` 策略：只允许 **同源** 资产、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且不会发起网络获取。

这在实践中意味着：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍会渲染，包括 UI 获取并转换为本地 `blob:` URL 的已认证头像路由。
- 内联 `data:image/...` URL 仍会渲染（适用于协议内载荷）。
- Control UI 创建的本地 `blob:` URL 仍会渲染。
- 频道元数据发出的远程头像 URL 会在 Control UI 的头像辅助函数中被剥离，并替换为内置标志/徽章，因此被攻陷或恶意的渠道无法强制操作员浏览器获取任意远程图片。

你无需更改任何内容即可获得此行为，它始终启用且不可配置。

## 头像路由认证

当配置了网关认证时，Control UI 头像端点要求使用与 API 其余部分相同的网关 token：

- `GET /avatar/<agentId>` 只向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 会在同一规则下返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与相邻的 assistant-media 路由一致）。这可以防止头像路由在其他方面受保护的主机上泄露 Agent 身份。
- Control UI 本身在获取头像时会将网关 token 作为 bearer 标头转发，并使用已认证的 blob URL，因此图片仍会在仪表盘中渲染。

如果你禁用 Gateway 网关认证（不建议在共享主机上这样做），头像路由也会变为未认证状态，与 Gateway 网关的其余部分保持一致。

## 助手媒体路由认证

配置 Gateway 网关认证后，助手本地媒体预览会使用两步路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要正常的 Control UI 操作者认证。浏览器在检查可用性时，会以 bearer 标头发送 Gateway 网关令牌。
- 成功的元数据响应会包含一个短期有效的 `mediaTicket`，其作用域限定为该精确源路径。
- 浏览器渲染的图片、音频、视频和文档 URL 使用 `mediaTicket=<ticket>`，而不是活动的 Gateway 网关令牌或密码。该票据会很快过期，并且不能授权其他源。

这样可以让普通媒体渲染继续兼容浏览器原生媒体元素，同时不会把可复用的 Gateway 网关凭证放进可见的媒体 URL 中。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build
```

可选的绝对 base（当你想使用固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本地开发（单独的开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 空白的 Control UI 页面

如果浏览器加载出空白仪表盘，并且 DevTools 没有显示有用错误，某个扩展或早期内容脚本可能阻止了 JavaScript 模块应用的求值。静态页面包含一个普通 HTML 恢复面板，当启动后 `<openclaw-app>` 未注册时会显示。

更改浏览器环境后，使用面板中的 **重试** 操作，或在完成以下检查后手动重新加载：

- 禁用会注入所有页面的扩展，尤其是带有 `<all_urls>` 内容脚本的扩展。
- 尝试使用隐私窗口、干净的浏览器配置文件或其他浏览器。
- 保持 Gateway 网关运行，并在浏览器更改后验证同一个仪表盘 URL。

## 调试/测试：开发服务器 + 远程 Gateway 网关

Control UI 是静态文件；WebSocket 目标可配置，并且可以不同于 HTTP 源。当你想在本地使用 Vite 开发服务器，但 Gateway 网关在其他位置运行时，这很有用。

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    可选的一次性认证（如果需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` 会在加载后存储到 localStorage，并从 URL 中移除。
    - 如果你通过 `gatewayUrl` 传入完整的 `ws://` 或 `wss://` 端点，请对 `gatewayUrl` 值进行 URL 编码，以便浏览器正确解析查询字符串。
    - 只要可行，`token` 都应通过 URL 片段（`#token=...`）传递。片段不会发送到服务器，这可以避免请求日志和 Referer 泄漏。旧版 `?token=` 查询参数仍会为了兼容性导入一次，但仅作为回退，并会在引导后立即剥离。
    - `password` 仅保存在内存中。
    - 设置 `gatewayUrl` 后，UI 不会回退到配置或环境凭证。请显式提供 `token`（或 `password`）。缺少显式凭证是错误。
    - 当 Gateway 网关位于 TLS 后方（Tailscale Serve、HTTPS 代理等）时，请使用 `wss://`。
    - `gatewayUrl` 只会在顶级窗口中接受（不接受嵌入式窗口），以防止点击劫持。
    - 公共非 local loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整源）。来自 local loopback、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主机的私有同源 LAN/Tailnet 加载，无需启用 Host-header 回退即可接受。
    - Gateway 网关启动可能会根据有效运行时绑定和端口植入本地源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但远程浏览器源仍需要显式条目。
    - 除非是严格受控的本地测试，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允许任何浏览器源，而不是“匹配我正在使用的任意主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host-header 源回退模式，但这是危险的安全模式。

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

远程访问设置详情：[远程访问](/zh-CN/gateway/remote)。

## 相关

- [仪表盘](/zh-CN/web/dashboard) — Gateway 网关仪表盘
- [健康检查](/zh-CN/gateway/health) — Gateway 网关健康监控
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
