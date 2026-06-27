---
read_when:
    - 你想从浏览器操作 Gateway 网关
    - 你想要无需 SSH 隧道的 Tailnet 访问
sidebarTitle: Control UI
summary: 基于浏览器的 Gateway 网关 Control UI（聊天、活动、节点、配置）
title: Control UI
x-i18n:
    generated_at: "2026-06-27T03:37:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

Control UI 是一个由 Gateway 网关提供服务的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接连接 Gateway 网关 WebSocket**。

## 快速打开（本地）

如果 Gateway 网关在同一台计算机上运行，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用受信任代理身份标头

仪表板设置面板会为当前浏览器标签页会话和选中的 Gateway 网关 URL 保留一个 token；密码不会被持久化。新手引导通常会在首次连接时为共享密钥认证生成一个 Gateway 网关 token，但当 `gateway.auth.mode` 为 `"password"` 时，密码认证也可使用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关通常需要**一次性配对审批**。这是一项安全措施，用于防止未授权访问。

**你会看到：**“disconnected (1008): pairing required”

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

如果浏览器使用已更改的认证详情（角色/范围/公钥）重试配对，之前待处理的请求会被取代，并创建新的 `requestId`。请在批准前重新运行 `openclaw devices list`。

如果浏览器已经配对，而你将其从只读访问更改为写入/管理员访问，这会被视为一次审批升级，而不是静默重新连接。OpenClaw 会保留旧审批有效，阻止权限更大的重新连接，并要求你明确批准新的范围集合。

批准后，该设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则不需要重新批准。有关 token 轮换和撤销，请参阅 [Devices CLI](/zh-CN/cli/devices)。

通过 `openclaw_gateway` 适配器连接的 Paperclip 智能体使用相同的首次运行审批流程。初次尝试连接后，运行 `openclaw devices approve --latest` 预览待处理请求，然后重新运行打印出的 `openclaw devices approve <requestId>` 命令以批准它。对于远程 Gateway 网关，请传入显式的 `--url` 和 `--token` 值。若要让审批在重启后保持稳定，请在 Paperclip 中配置持久化的 `adapterConfig.devicePrivateKeyPem`，而不是让它在每次运行时生成新的临时设备身份。

<Note>
- 直接的 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动批准。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份验证通过，并且浏览器提供其设备身份时，Tailscale Serve 可以为 Control UI 操作员会话跳过配对往返。
- 直接 Tailnet 绑定、LAN 浏览器连接，以及没有设备身份的浏览器配置文件仍需要显式批准。
- 每个浏览器配置文件都会生成唯一设备 ID，因此切换浏览器或清除浏览器数据将需要重新配对。

</Note>

## 个人身份（浏览器本地）

Control UI 支持每个浏览器的个人身份（显示名称和头像），并将其附加到发出的消息上，用于共享会话中的归属标识。它存储在浏览器存储中，作用域限定为当前浏览器配置文件，不会同步到其他设备，也不会在服务器端持久化，除了你实际发送的消息上的常规转录作者元数据。清除站点数据或切换浏览器会将其重置为空。

同样的浏览器本地模式也适用于助手头像覆盖。上传的助手头像只会在本地浏览器中覆盖由 Gateway 网关解析的身份，绝不会通过 `config.patch` 往返传输。共享的 `ui.assistant.avatar` 配置字段仍可供直接写入该字段的非 UI 客户端使用（例如脚本化 Gateway 网关或自定义仪表板）。

## 运行时配置端点

Control UI 会从 `/control-ui-config.json` 获取其运行时设置，该路径相对于 Gateway 网关的 Control UI 基础路径解析（例如，当 UI 在 `/__openclaw__/` 下提供服务时，为 `/__openclaw__/control-ui-config.json`）。该端点与其他 HTTP 表面一样受同一 Gateway 网关认证保护：未认证的浏览器无法获取它，成功获取需要已有有效的 Gateway 网关 token/密码、Tailscale Serve 身份，或受信任代理身份。

## 语言支持

Control UI 可以在首次加载时根据你的浏览器区域设置进行本地化。若要稍后覆盖它，请打开 **概览 -> Gateway 网关访问 -> 语言**。区域设置选择器位于 Gateway 网关访问卡片中，而不是外观下。

- 支持的区域设置：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英语翻译会在浏览器中懒加载。
- 选中的区域设置会保存在浏览器存储中，并在未来访问时复用。
- 缺失的翻译键会回退到英语。

文档翻译会为同一组非英语区域设置生成，但文档站点内置的 Mintlify 语言选择器仅限于 Mintlify 接受的区域设置代码。泰语（`th`）和波斯语（`fa`）文档仍会在发布仓库中生成；在 Mintlify 支持这些代码之前，它们可能不会出现在该选择器中。

## 外观主题

外观面板保留内置的 Claw、Knot 和 Dash 主题，外加一个浏览器本地的 tweakcn 导入槽。若要导入主题，请打开 [tweakcn 编辑器](https://tweakcn.com/editor/theme)，选择或创建一个主题，点击**分享**，然后将复制的主题链接粘贴到外观中。导入器也接受 `https://tweakcn.com/r/themes/<id>` 注册表 URL、类似 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 的编辑器 URL、相对 `/themes/<id>` 路径、原始主题 ID，以及诸如 `amethyst-haze` 的默认主题名称。

外观还包含浏览器本地的文本大小设置。该设置会与其他 Control UI 偏好一起存储，应用于聊天文本、输入框文本、工具卡片和聊天侧边栏，并保持文本输入至少为 16px，这样移动端 Safari 在聚焦时不会自动缩放。

导入的主题只存储在当前浏览器配置文件中。它们不会写入 Gateway 网关配置，也不会跨设备同步。替换导入的主题会更新唯一的本地槽；如果已选择导入的主题，清除它会将活动主题切回 Claw。

## 它现在能做什么

<AccordionGroup>
  <Accordion title="聊天和 Talk">
    - 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 聊天历史刷新会请求一个有界的近期窗口，并为每条消息设置文本上限，这样大型会话不会在聊天可用前强制浏览器渲染完整转录 payload。
    - 通过浏览器实时会话进行 Talk。OpenAI 使用直接 WebRTC，Google Live 通过 WebSocket 使用受限的一次性浏览器 token，而仅后端实时语音插件使用 Gateway 网关中继传输。客户端拥有的提供商会话以 `talk.client.create` 开始；Gateway 网关中继会话以 `talk.session.create` 开始。中继会将提供商凭证保留在 Gateway 网关上，同时浏览器通过 `talk.session.appendAudio` 流式传输麦克风 PCM，通过 `talk.client.toolCall` 将 `openclaw_agent_consult` 提供商工具调用转发给 Gateway 网关策略和配置的更大 OpenClaw 模型，并通过 `talk.client.steer` 或 `talk.session.steer` 路由活跃运行的语音引导。
    - 在聊天中流式传输工具调用和实时工具输出卡片（智能体事件）。
    - 活动标签页提供浏览器本地、优先脱敏的实时工具活动摘要，来源于现有 `session.tool` / 工具事件投递。

  </Accordion>
  <Accordion title="渠道、实例、会话、梦境">
    - 渠道：内置以及内置/外部插件渠道状态、二维码登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）。
    - 渠道探测刷新会在慢速提供商检查完成前保持之前的快照可见，并在探测或审计超出其 UI 预算时标记部分快照。
    - 实例：在线状态列表和刷新（`system-presence`）。
    - 会话：默认列出已配置智能体会话，从陈旧的未配置智能体会话键回退，并应用按会话的模型/thinking/fast/verbose/trace/reasoning 覆盖（`sessions.list`、`sessions.patch`）。
    - 梦境：Dreaming 状态、启用/停用开关，以及 Dream Diary 阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、节点、Exec 审批">
    - Cron 作业：列出/添加/编辑/运行/启用/停用，以及运行历史（`cron.*`）。
    - Skills：状态、启用/停用、安装、API key 更新（`skills.*`）。
    - 节点：列表和能力上限（`node.list`）。
    - Exec 审批：编辑 Gateway 网关或节点 allowlist，以及针对 `exec host=gateway/node` 的询问策略（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - MCP 为已配置服务器、启用状态、OAuth/过滤器/并行摘要、常用操作员命令，以及限定作用域的 `mcp` 配置编辑器提供专用设置页面。
    - 使用验证应用并重启（`config.apply`），并唤醒最后一个活跃会话。
    - 写入包含 base-hash 保护，以防止覆盖并发编辑。
    - 写入（`config.set`/`config.apply`/`config.patch`）会预检提交配置 payload 中 refs 的活动 SecretRef 解析；未解析的活动提交 refs 会在写入前被拒绝。
    - 表单保存会丢弃无法从已保存配置恢复的陈旧脱敏占位符，同时保留仍映射到已保存密钥的脱敏值。
    - Schema 和表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子级摘要、嵌套 object/wildcard/array/composition 节点上的文档元数据，以及可用时的插件和渠道 schema）；仅当快照具备安全的原始往返能力时，Raw JSON 编辑器才可用。
    - 如果快照无法安全地往返原始文本，Control UI 会强制使用表单模式，并为该快照禁用 Raw 模式。
    - Raw JSON 编辑器的“重置为已保存”会保留原始编写形态（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照可以安全往返时，外部编辑会在重置后保留下来。
    - 结构化 SecretRef object 值会在表单文本输入中以只读方式渲染，以防止意外的对象到字符串损坏。

  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态/健康/模型快照、事件日志，以及手动 RPC 调用（`status`、`health`、`models.list`）。
    - 事件日志包括 Control UI 刷新/RPC 计时、慢速聊天/配置渲染计时，以及当浏览器暴露这些 PerformanceObserver entry 类型时的长动画帧或长任务浏览器响应性条目。
    - 日志：带过滤/导出的 Gateway 网关文件日志实时尾随（`logs.tail`）。
    - 更新：运行 package/git 更新并重启（`update.run`），包含重启报告，然后在重新连接后轮询 `update.status` 以验证正在运行的 Gateway 网关版本。

  </Accordion>
  <Accordion title="Cron 作业面板说明">
    - 对于隔离作业，投递默认会公告摘要。如果你想要仅内部运行，可以切换为 none。
    - 选择 announce 时会显示渠道/目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
    - 对于主会话作业，可以使用 webhook 和 none 投递模式。
    - 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确/错峰选项、智能体模型/thinking 覆盖，以及尽力投递开关。
    - 表单校验以内联方式显示字段级错误；无效值会禁用保存按钮，直到修复为止。
    - 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，则 webhook 发送时不带 auth header。
    - 已弃用的回退：运行 `openclaw doctor --fix`，将存储的带有 `notify: true` 的旧作业从 `cron.webhook` 迁移到显式的逐作业 webhook 或完成投递。

  </Accordion>
</AccordionGroup>

## MCP 页面

专用 MCP 页面是 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器的操作员视图。它本身不会启动 MCP 传输；使用它来检查和编辑已保存的配置，然后在需要实时服务器证明时使用 `openclaw mcp doctor --probe`。

典型工作流：

1. 从侧边栏打开 **MCP**。
2. 检查摘要卡片中的总数、已启用、OAuth 和已过滤服务器数量。
3. 查看每个服务器行的传输、启用状态、认证、过滤器、超时和命令提示。
4. 当某个服务器应保留配置但不参与运行时设备发现时，切换其启用状态。
5. 编辑限定范围的 `mcp` 配置部分，用于服务器定义、headers、TLS/mTLS 路径、OAuth 元数据、工具过滤器和 Codex 投影元数据。
6. 使用 **保存** 写入配置，或在运行中的 Gateway 网关应应用已更改配置时使用 **保存并发布**。
7. 当已编辑的进程需要静态诊断、实时证明或清除缓存运行时时，在终端中运行 `openclaw mcp status --verbose`、`openclaw mcp doctor --probe` 或 `openclaw mcp reload`。

该页面会在渲染前遮盖带凭证的类 URL 值，并在命令片段中为服务器名称加引号，因此复制的命令即使包含空格或 shell 元字符也仍可工作。完整的 CLI 和配置参考位于 [MCP](/zh-CN/cli/mcp)。

## Activity 标签页

Activity 标签页是一个临时的浏览器本地观察器，用于查看实时工具活动。它派生自驱动 Chat 工具卡片的同一个 Gateway 网关 `session.tool` / 工具事件流；它不会添加另一个 Gateway 网关事件族、端点、持久活动存储、指标 feed 或外部观察器流。

Activity 条目只保留已净化的摘要以及已遮盖、截断的输出预览。工具参数值不会存储在 Activity 状态中；UI 会显示参数已隐藏，并且只记录参数字段数量。内存中的列表跟随当前浏览器标签页，在 Control UI 内导航时保留，并在页面重新加载、切换会话或点击 **清除** 时重置。

## Chat 行为

<AccordionGroup>
  <Accordion title="发送和历史语义">
    - `chat.send` 是**非阻塞**的：它会立即以 `{ runId, status: "started" }` 确认，响应则通过 `chat` 事件流式传输。受信任的 Control UI 客户端也可以接收可选的 ACK 计时元数据，用于本地诊断。
    - Chat 上传接受图片和非视频文件。图片保留原生图片路径；其他文件会存储为托管媒体，并在历史中显示为附件链接。
    - 使用相同的 `idempotencyKey` 重新发送时，运行中会返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
    - 为了 UI 安全，`chat.history` 响应有大小限制。当 transcript 条目过大时，Gateway 网关可能会截断长文本字段，省略较重的元数据块，并用占位符（`[chat.history omitted: message too large]`）替换超大消息。
    - 当可见的助手消息在 `chat.history` 中被截断时，侧边阅读器可以按需通过 `chat.message.get` 获取完整的显示规范化 transcript 条目，需要提供 `sessionKey`、必要时的活动 `agentId` 以及 transcript `messageId`。如果 Gateway 网关仍然无法返回更多内容，阅读器会显示明确的不可用状态，而不是静默重复截断后的预览。
    - 助手/生成的图片会作为托管媒体引用持久化，并通过已认证的 Gateway 网关媒体 URL 返回，因此重新加载不依赖原始 base64 图片载荷继续留在 Chat 历史响应中。
    - 渲染 `chat.history` 时，Control UI 会从可见助手文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和截断的工具调用块），以及泄漏的 ASCII/全角模型控制 token，并省略整个可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 或 Heartbeat 确认 token `HEARTBEAT_OK` 的助手条目。
    - 在活动发送期间和最终历史刷新期间，如果 `chat.history` 短暂返回较旧的快照，Chat 视图会继续显示本地乐观用户/助手消息；一旦 Gateway 网关历史追上，规范 transcript 会替换这些本地消息。
    - 实时 `chat` 事件是投递状态，而 `chat.history` 会从持久会话 transcript 重建。工具最终事件之后，Control UI 会重新加载历史，并且只合并一小段乐观尾部；transcript 边界记录在 [WebChat](/zh-CN/web/webchat) 中。
    - `chat.inject` 会向会话 transcript 追加一条助手备注，并广播一个 `chat` 事件用于仅 UI 更新（无智能体运行，无渠道投递）。
    - Chat 头部会在会话选择器之前显示智能体过滤器，并且会话选择器受所选智能体限定。切换智能体时，只显示与该智能体关联的会话；当该智能体尚无已保存的仪表板会话时，会回退到该智能体的主会话。
    - 在桌面宽度下，Chat 控件保持在一条紧凑行内，并在向下滚动 transcript 时折叠；向上滚动、返回顶部或到达底部会恢复控件。
    - 连续重复的纯文本消息会渲染为一个带计数徽章的气泡。携带图片、附件、工具输出或画布预览的消息不会折叠。
    - Chat 头部的模型和 thinking 选择器会立即通过 `sessions.patch` 修补活动会话；它们是持久会话覆盖，而不是仅单轮发送选项。
    - 如果你在同一会话的模型选择器更改仍在保存时发送消息，composer 会先等待该会话补丁完成，再调用 `chat.send`，以确保发送使用所选模型。
    - 在 Control UI 中输入 `/new` 会创建并切换到与 New Chat 相同的全新仪表板会话，除非已配置 `session.dmScope: "main"` 且当前父级是该智能体的主会话；在这种情况下，它会就地重置主会话。输入 `/reset` 会保留 Gateway 网关对当前会话的显式就地重置。
    - Chat 模型选择器会请求 Gateway 网关已配置的模型视图。如果存在 `agents.defaults.models`，该 allowlist 会驱动选择器，包括保持按提供商限定目录动态的 `provider/*` 条目。否则，选择器会显示显式的 `models.providers.*.models` 条目以及具有可用认证的提供商。完整目录仍可通过调试 `models.list` RPC 并使用 `view: "all"` 获取。
    - 当新的 Gateway 网关会话用量报告包含当前上下文 token 时，Chat composer 区域会显示紧凑的上下文用量指示器。在高上下文压力下，它会切换为警告样式；在推荐的压缩级别下，它会显示一个紧凑按钮，用于运行常规会话压缩路径。过期的 token 快照会隐藏，直到 Gateway 网关再次报告新用量。

  </Accordion>
  <Accordion title="Talk 模式（浏览器实时）">
    Talk 模式使用已注册的实时语音提供商。配置 OpenAI 时，使用 `talk.realtime.provider: "openai"` 加上 `openai` API-key auth profile、`talk.realtime.providers.openai.apiKey` 或 `OPENAI_API_KEY`；OpenAI OAuth profiles 不会配置 Realtime 语音。配置 Google 时，使用 `talk.realtime.provider: "google"` 加上 `talk.realtime.providers.google.apiKey`。浏览器永远不会接收标准提供商 API key。OpenAI 会接收用于 WebRTC 的临时 Realtime client secret。Google Live 会接收一个一次性受限的 Live API auth token，用于浏览器 WebSocket 会话，并且指令和工具声明会由 Gateway 网关锁定到该 token 中。只暴露后端实时桥接的提供商会通过 Gateway 网关 relay 传输运行，因此凭证和供应商 socket 保持在服务器端，而浏览器音频则通过已认证的 Gateway 网关 RPC 移动。Realtime 会话 prompt 由 Gateway 网关组装；`talk.client.create` 不接受调用方提供的 instruction 覆盖。

    Chat composer 在 Talk 开始/停止按钮旁包含一个 Talk 选项按钮。这些选项会应用于下一个 Talk 会话，并可以覆盖提供商、传输、模型、语音、reasoning effort、VAD threshold、silence duration 和 prefix padding。当某个选项为空时，Gateway 网关会在可用时使用已配置默认值，否则使用提供商默认值。选择 Gateway 网关 relay 会强制使用后端 relay 路径；选择 WebRTC 会保持会话由客户端拥有，并且如果提供商无法创建浏览器会话，会失败而不是静默回退到 relay。

    在 Chat composer 中，Talk 控件是麦克风听写按钮旁的波形按钮。Talk 启动时，composer 状态行先显示 `Connecting Talk...`，音频连接后显示 `Talk live`，或者当实时工具调用正在通过 `talk.client.toolCall` 咨询已配置的更大模型时显示 `Asking OpenClaw...`。

    维护者实时冒烟测试：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 会验证 OpenAI 后端 WebSocket 桥接、OpenAI 浏览器 WebRTC SDP 交换、Google Live 受限 token 浏览器 WebSocket 设置，以及使用假麦克风媒体的 Gateway 网关 relay 浏览器适配器。该命令只打印提供商状态，不记录秘密。

  </Accordion>
  <Accordion title="停止和中止">
    - 点击 **停止**（调用 `chat.abort`）。
    - 运行处于活动状态时，普通后续消息会排队。点击排队消息上的 **Steer**，可将该后续消息注入正在运行的轮次。
    - 输入 `/stop`（或单独的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）可带外中止。
    - `chat.abort` 支持 `{ sessionKey }`（无 `runId`），用于中止该会话的所有活动运行。

  </Accordion>
  <Accordion title="中止后的部分内容保留">
    - 当运行被中止时，部分助手文本仍可显示在 UI 中。
    - 当存在已缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到 transcript 历史中。
    - 持久化条目包含中止元数据，因此 transcript 消费方可以区分中止部分和正常完成输出。

  </Accordion>
</AccordionGroup>

## PWA 安装和 Web Push

Control UI 随附 `manifest.webmanifest` 和 service worker，因此现代浏览器可以将其安装为独立 PWA。Web Push 允许 Gateway 网关通过通知唤醒已安装的 PWA，即使标签页或浏览器窗口未打开。

如果页面在 OpenClaw 更新后立即显示 **协议不匹配**，请先使用 `openclaw dashboard` 重新打开仪表板并强制刷新页面。如果仍然失败，请清除仪表板来源的站点数据，或在私密浏览器窗口中测试；旧标签页或浏览器 service worker 缓存可能会让更新前的 Control UI bundle 继续针对较新的 Gateway 网关运行。

| 表面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 清单。一旦可访问，浏览器会提供“安装应用”。                    |
| `ui/public/sw.js`                                     | 处理 `push` 事件和通知点击的 Service Worker。                      |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下）    | 自动生成的 VAPID 密钥对，用于签署 Web Push 载荷。                  |
| `push/web-push-subscriptions.json`                    | 持久化的浏览器订阅端点。                                           |

当你想固定密钥时（用于多主机部署、密钥轮换或测试），可以通过 Gateway 网关进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认为 `https://openclaw.ai`）

Control UI 使用这些按作用域限制的 Gateway 网关方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` — 获取当前生效的 VAPID 公钥。
- `push.web.subscribe` — 注册一个 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已注册的端点。
- `push.web.test` — 向调用方的订阅发送测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（请参阅 [配置](/zh-CN/gateway/configuration) 了解由中继支持的推送）以及现有的 `push.test` 方法；后者面向原生移动端配对。
</Note>

## 托管嵌入

助手消息可以使用 `[embed ...]` 短代码以内联方式呈现托管的 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    禁用托管嵌入中的脚本执行。
  </Tab>
  <Tab title="scripts (default)">
    在保持来源隔离的同时允许交互式嵌入；这是默认值，通常足以满足自包含的浏览器游戏/小组件。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上为有意需要更强权限的同站点文档添加 `allow-same-origin`。
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
仅当嵌入的文档确实需要同源行为时才使用 `trusted`。对于大多数由 agent 生成的游戏和交互式画布，`scripts` 是更安全的选择。
</Warning>

默认情况下，绝对外部 `http(s)` 嵌入 URL 仍会被阻止。如果你有意允许 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天消息宽度

分组聊天消息使用可读性较好的默认最大宽度。宽屏部署可以通过设置 `gateway.controlUi.chatMessageMaxWidth` 覆盖它，而无需修补内置 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

该值会先经过验证，然后才到达浏览器。支持的值包括普通长度和百分比，例如 `960px` 或 `82%`，以及受约束的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 宽度表达式。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    将 Gateway 网关保留在环回地址上，并让 Tailscale Serve 通过 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开：

    - `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行认证。OpenClaw 会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该标头匹配，以验证身份；只有当请求通过环回地址进入，并带有 Tailscale 的 `x-forwarded-*` 标头时才会接受。对于带有浏览器设备身份的 Control UI 操作员会话，这条已验证的 Serve 路径还会跳过设备配对往返；无设备浏览器和节点角色连接仍会遵循正常的设备检查。如果你想即使对 Serve 流量也要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于这条异步 Serve 身份路径，同一客户端 IP 和认证作用域的失败认证尝试会在写入速率限制之前被串行化。因此，同一浏览器的并发错误重试可能会在第二个请求上显示 `retry later`，而不是两个普通不匹配并行竞争。

    <Warning>
    无令牌 Serve 认证假定 gateway 主机是可信的。如果不可信的本地代码可能在该主机上运行，请要求 token/password 认证。
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    然后打开：

    - `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

    将匹配的共享密钥粘贴到 UI 设置中（作为 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

  </Tab>
</Tabs>

## 不安全 HTTP

如果你通过普通 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）打开仪表板，浏览器会运行在**非安全上下文**中并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

已记录的例外：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 的仅限 localhost 的不安全 HTTP 兼容性
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成操作员 Control UI 认证
- 紧急开关 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复：**使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 gateway 主机上）

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
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

    - 它允许 localhost Control UI 会话在非安全 HTTP 上下文中无需设备身份即可继续。
    - 它不会绕过配对检查。
    - 它不会放宽远程（非 localhost）设备身份要求。

  </Accordion>
  <Accordion title="Break-glass only">
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
  <Accordion title="Trusted-proxy note">
    - 成功的 trusted-proxy 认证可以允许**操作员** Control UI 会话在没有设备身份的情况下进入。
    - 这**不会**扩展到节点角色 Control UI 会话。
    - 同主机 local loopback 反向代理仍不满足 trusted-proxy 认证；请参阅 [可信代理认证](/zh-CN/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

请参阅 [Tailscale](/zh-CN/gateway/tailscale) 获取 HTTPS 设置指南。

## 内容安全策略

Control UI 附带严格的 `img-src` 策略：只允许**同源**资产、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且不会发起网络抓取。

这在实践中意味着：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍会渲染，包括 UI 抓取并转换为本地 `blob:` URL 的已认证头像路由。
- 内联 `data:image/...` URL 仍会渲染（对协议内载荷很有用）。
- Control UI 创建的本地 `blob:` URL 仍会渲染。
- 频道元数据发出的远程头像 URL 会在 Control UI 的头像辅助逻辑中被剥离，并替换为内置徽标/徽章，因此被入侵或恶意的渠道无法强制操作员浏览器抓取任意远程图片。

你无需更改任何内容即可获得此行为；它始终启用且不可配置。

## 头像路由认证

配置 gateway 认证后，Control UI 头像端点要求与 API 其他部分相同的 gateway 令牌：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在同一规则下返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与相邻的 assistant-media 路由保持一致）。这可以防止头像路由在其他方面受保护的主机上泄露 agent 身份。
- Control UI 本身在抓取头像时会将 gateway 令牌作为 bearer 标头转发，并使用已认证的 blob URL，因此图片仍会在仪表板中渲染。

如果你禁用 gateway 认证（不建议在共享主机上这样做），头像路由也会变为未认证，这与 gateway 的其余部分一致。

## 助手媒体路由认证

配置 gateway 认证后，助手本地媒体预览使用两步路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 要求正常的 Control UI 操作员认证。浏览器在检查可用性时会将 gateway 令牌作为 bearer 标头发送。
- 成功的元数据响应包含一个短期有效的 `mediaTicket`，其作用域限定为该确切源路径。
- 浏览器渲染的图片、音频、视频和文档 URL 使用 `mediaTicket=<ticket>`，而不是当前 gateway 令牌或密码。该票据会很快过期，且不能授权不同的源。

这使普通媒体渲染能够兼容浏览器原生媒体元素，同时不会把可重复使用的 gateway 凭证放入可见媒体 URL 中。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。使用以下命令构建它们：

```bash
pnpm ui:build
```

可选的绝对基路径（当你想要固定资产 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 空白 Control UI 页面

如果浏览器加载了空白仪表板，而 DevTools 没有显示有用错误，某个扩展或早期内容脚本可能阻止了 JavaScript 模块应用求值。静态页面包含一个普通 HTML 恢复面板，当启动后 `<openclaw-app>` 未注册时会显示。

更改浏览器环境后，使用面板的**重试**操作，或在完成以下检查后手动重新加载：

- 禁用会注入所有页面的扩展，尤其是带有 `<all_urls>` 内容脚本的扩展。
- 尝试隐私窗口、干净的浏览器配置文件或其他浏览器。
- 保持 Gateway 网关运行，并在更改浏览器后验证同一个仪表板 URL。

## 调试/测试：开发服务器 + 远程 Gateway 网关

Control UI 是静态文件；WebSocket 目标可配置，并且可以不同于 HTTP 来源。当你想在本地运行 Vite 开发服务器，而 Gateway 网关在其他地方运行时，这很方便。

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
    - 应尽可能通过 URL 片段（`#token=...`）传入 `token`。片段不会发送到服务器，这可以避免请求日志和 Referer 泄漏。旧版 `?token=` 查询参数仍会为了兼容性导入一次，但仅作为回退，并且会在启动引导后立即剥离。
    - `password` 仅保存在内存中。
    - 设置 `gatewayUrl` 后，UI 不会回退到配置或环境凭证。请显式提供 `token`（或 `password`）。缺少显式凭证是错误。
    - 当 Gateway 网关位于 TLS 后方时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
    - `gatewayUrl` 仅在顶层窗口中接受（不允许嵌入），以防止点击劫持。
    - 公开的非 loopback Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整源）。来自 loopback、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主机的私有同源 LAN/Tailnet 加载无需启用 Host 标头回退即可接受。
    - Gateway 网关启动时可能会根据有效运行时绑定和端口播种本地源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但远程浏览器源仍需要显式条目。
    - 除了严格受控的本地测试，不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允许任意浏览器源，而不是“匹配我正在使用的任何主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 标头源回退模式，但这是一种危险的安全模式。

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

## 相关内容

- [仪表板](/zh-CN/web/dashboard) — Gateway 网关仪表板
- [健康检查](/zh-CN/gateway/health) — Gateway 网关健康监控
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
