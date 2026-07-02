---
read_when:
    - 你想从浏览器操作 Gateway 网关
    - 你想要无需 SSH 隧道的 Tailnet 访问权限
sidebarTitle: Control UI
summary: 基于浏览器的 Gateway 网关控制 UI（聊天、活动、节点、配置）
title: Control UI
x-i18n:
    generated_at: "2026-07-02T00:44:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 643249e6857cc1a32302f5139fcf89d46e01127f741f31efd36db4a6c60ef7b7
    source_path: web/control-ui.md
    workflow: 16
---

Control UI 是由 Gateway 网关提供服务的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它在同一端口上**直接与 Gateway 网关 WebSocket** 通信。

## 快速打开（本地）

如果 Gateway 网关在同一台计算机上运行，请打开：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

<Note>
在原生 Windows LAN 绑定中，即使 `127.0.0.1` 在 Gateway 网关主机上可用，Windows 防火墙或组织管理的组策略仍可能阻止通告的 LAN URL。在 Windows 主机上运行 `openclaw gateway status --deep`；它会报告可能被阻止的端口、配置文件不匹配以及策略可能忽略的本地防火墙规则。
</Note>

认证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时的 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时的可信代理身份标头

仪表盘设置面板会为当前浏览器标签页会话和所选 Gateway 网关 URL 保留一个令牌；密码不会被持久化。新手引导通常会在首次连接时为共享密钥认证生成一个 Gateway 网关令牌，但当 `gateway.auth.mode` 为 `"password"` 时，密码认证也可用。

## 设备配对（首次连接）

当你从新的浏览器或设备连接到 Control UI 时，Gateway 网关通常需要**一次性配对批准**。这是一项用于防止未授权访问的安全措施。

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

如果浏览器使用变更后的认证详细信息（角色/范围/公钥）重试配对，之前的待处理请求会被取代，并创建新的 `requestId`。批准前请重新运行 `openclaw devices list`。

如果浏览器已经配对，而你将其从读取访问权限改为写入/管理员访问权限，这会被视为一次批准升级，而不是静默重连。OpenClaw 会保持旧批准有效，阻止更大范围的重连，并要求你显式批准新的范围集合。

批准后，设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则不需要重新批准。请参阅 [Devices CLI](/zh-CN/cli/devices) 了解令牌轮换和撤销。

通过 `openclaw_gateway` 适配器连接的 Paperclip 智能体使用相同的首次运行批准流程。初始连接尝试后，运行 `openclaw devices approve --latest` 预览待处理请求，然后重新运行打印出的 `openclaw devices approve <requestId>` 命令来批准它。对于远程 Gateway 网关，请传入显式的 `--url` 和 `--token` 值。若要让批准在重启后保持稳定，请在 Paperclip 中配置持久的 `adapterConfig.devicePrivateKeyPem`，而不是让它每次运行都生成新的临时设备身份。

<Note>
- 直接的 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动批准。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份验证通过，并且浏览器提供其设备身份时，Tailscale Serve 可以为 Control UI 操作者会话跳过配对往返。
- 直接 Tailnet 绑定、LAN 浏览器连接，以及没有设备身份的浏览器配置文件仍需要显式批准。
- 每个浏览器配置文件都会生成唯一设备 ID，因此切换浏览器或清除浏览器数据将需要重新配对。

</Note>

## 个人身份（浏览器本地）

Control UI 支持按浏览器设置的个人身份（显示名称和头像），会附加到发出的消息上，用于在共享会话中归属作者。它存储在浏览器存储中，作用域限定为当前浏览器配置文件，不会同步到其他设备，也不会在服务端持久化，除了你实际发送的消息上常规的转录作者元数据。清除站点数据或切换浏览器会将其重置为空。

同样的浏览器本地模式也适用于助手头像覆盖。上传的助手头像只会在本地浏览器上覆盖 Gateway 网关解析出的身份，绝不会通过 `config.patch` 往返传输。共享的 `ui.assistant.avatar` 配置字段仍可供直接写入该字段的非 UI 客户端使用（例如脚本化 Gateway 网关或自定义仪表盘）。

## 运行时配置端点

Control UI 从 `/control-ui-config.json` 获取其运行时设置，该路径会相对于 Gateway 网关的 Control UI 基础路径解析（例如，当 UI 在 `/__openclaw__/` 下提供服务时，为 `/__openclaw__/control-ui-config.json`）。该端点受与其余 HTTP 表面相同的 Gateway 网关认证保护：未认证的浏览器无法获取它，成功获取需要已经有效的 Gateway 网关令牌/密码、Tailscale Serve 身份，或可信代理身份。

## 语言支持

Control UI 可在首次加载时根据你的浏览器区域设置进行本地化。若要之后覆盖它，请打开 **概览 -> Gateway 访问 -> 语言**。区域设置选择器位于 Gateway 访问卡片中，而不是位于外观下。

- 支持的区域设置：`en`、`zh-CN`、`zh-TW`、`pt-BR`、`de`、`es`、`ja-JP`、`ko`、`fr`、`ar`、`it`、`tr`、`uk`、`id`、`pl`、`th`、`vi`、`nl`、`fa`
- 非英语翻译会在浏览器中延迟加载。
- 所选区域设置会保存在浏览器存储中，并在后续访问时复用。
- 缺失的翻译键会回退到英语。

文档翻译会针对同一组非英语区域设置生成，但文档站点内置的 Mintlify 语言选择器受限于 Mintlify 接受的区域设置代码。泰语（`th`）和波斯语（`fa`）文档仍会在发布仓库中生成；在 Mintlify 支持这些代码之前，它们可能不会出现在该选择器中。

## 外观主题

外观面板保留内置的 Claw、Knot 和 Dash 主题，外加一个浏览器本地的 tweakcn 导入槽。若要导入主题，请打开 [tweakcn editor](https://tweakcn.com/editor/theme)，选择或创建主题，点击**分享**，并将复制的主题链接粘贴到外观中。导入器也接受 `https://tweakcn.com/r/themes/<id>` 注册表 URL、类似 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 的编辑器 URL、相对 `/themes/<id>` 路径、原始主题 ID，以及默认主题名称，例如 `amethyst-haze`。

外观还包含浏览器本地的文本大小设置。该设置会与其余 Control UI 偏好设置一起存储，应用于聊天文本、编辑器文本、工具卡片和聊天侧边栏，并让文本输入至少保持 16px，避免移动端 Safari 在聚焦时自动缩放。

导入的主题只存储在当前浏览器配置文件中。它们不会写入 Gateway 网关配置，也不会跨设备同步。替换导入主题会更新这一个本地槽；如果已选择导入主题，清除它会将活动主题切回 Claw。

## 它今天能做什么

<AccordionGroup>
  <Accordion title="聊天和 Talk">
    - 通过 Gateway 网关 WS（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）与模型聊天。
    - 聊天历史刷新会请求一个有边界的近期窗口，并带有按消息设置的文本上限，因此大型会话不会在聊天变得可用前强迫浏览器渲染完整转录载荷。
    - 通过浏览器实时会话进行 Talk。OpenAI 使用直接 WebRTC，Google Live 通过 WebSocket 使用受约束的一次性浏览器令牌，而仅后端的实时语音插件使用 Gateway 网关中继传输。客户端所有的提供商会话以 `talk.client.create` 开始；Gateway 网关中继会话以 `talk.session.create` 开始。中继会将提供商凭证保留在 Gateway 网关上，同时浏览器通过 `talk.session.appendAudio` 流式传输麦克风 PCM，通过 `talk.client.toolCall` 转发 `openclaw_agent_consult` 提供商工具调用以应用 Gateway 网关策略和更大的已配置 OpenClaw 模型，并通过 `talk.client.steer` 或 `talk.session.steer` 路由活动运行的语音 Steering。
    - 在聊天中流式传输工具调用 + 实时工具输出卡片（智能体事件）。
    - 活动标签页提供来自现有 `session.tool` / 工具事件投递的实时工具活动摘要；这些摘要为浏览器本地、优先脱敏。

  </Accordion>
  <Accordion title="渠道、实例、会话、梦境">
    - 渠道：内置以及内置/外部插件渠道状态、二维码登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）。
    - 渠道探测刷新会在慢速提供商检查完成时保持上一份快照可见，并在探测或审计超出其 UI 预算时标记部分快照。
    - 实例：在线列表 + 刷新（`system-presence`）。
    - 会话：默认列出已配置智能体会话，从陈旧的未配置智能体会话键回退，并应用按会话的模型/思考/快速/详细/跟踪/推理覆盖（`sessions.list`、`sessions.patch`）。
    - Dreaming：Dreaming 状态、启用/禁用开关，以及 Dream Diary 阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、Skills、节点、Exec 审批">
    - Cron 作业：列出/添加/编辑/运行/启用/禁用 + 运行历史（`cron.*`）。
    - Skills：状态、启用/禁用、安装、API key 更新（`skills.*`）。
    - 节点：列表 + 能力（`node.list`）。
    - Exec 审批：编辑 Gateway 网关或节点允许列表 + 针对 `exec host=gateway/node` 的询问策略（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - MCP 为已配置服务器、启用状态、OAuth/过滤器/并行摘要、常用操作者命令，以及限定作用域的 `mcp` 配置编辑器提供专用设置页面。
    - 应用 + 使用验证重启（`config.apply`），并唤醒最后一个活动会话。
    - 写入包含 base-hash 保护，以防止覆盖并发编辑。
    - 写入（`config.set`/`config.apply`/`config.patch`）会对提交的配置载荷中的引用预检活动 SecretRef 解析；未解析的活动提交引用会在写入前被拒绝。
    - 表单保存会丢弃无法从已保存配置中恢复的陈旧脱敏占位符，同时保留仍映射到已保存密钥的脱敏值。
    - Schema + 表单渲染（`config.schema` / `config.schema.lookup`，包括字段 `title` / `description`、匹配的 UI 提示、直接子级摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及可用时的插件 + 渠道 schema）；仅当快照有安全的原始往返能力时，Raw JSON 编辑器才可用。
    - 如果快照无法安全往返原始文本，Control UI 会强制使用表单模式，并对该快照禁用原始模式。
    - Raw JSON 编辑器的“重置为已保存”会保留原始编写的形状（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照可以安全往返时，外部编辑会在重置后保留。
    - 结构化 SecretRef 对象值会在表单文本输入中以只读方式渲染，以防止意外的对象到字符串损坏。

  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）。
    - 事件日志包含 Control UI 刷新/RPC 耗时、慢速聊天/配置渲染耗时，以及在浏览器暴露这些 PerformanceObserver 条目类型时的长动画帧或长任务浏览器响应性条目。
    - 日志：带过滤/导出的 Gateway 网关文件日志实时尾随（`logs.tail`）。
    - 更新：运行 package/git 更新 + 重启（`update.run`）并生成重启报告，然后在重连后轮询 `update.status` 以验证正在运行的 Gateway 网关版本。

  </Accordion>
  <Accordion title="Cron 作业面板说明">
    - 对于隔离作业，投递默认会公布摘要。如果你想要仅内部运行，可以切换为 none。
    - 选择 announce 时会显示渠道/目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设为有效的 HTTP(S) webhook URL。
    - 对于主会话作业，可以使用 webhook 和 none 投递模式。
    - 高级编辑控件包括运行后删除、清除智能体覆盖、cron 精确/错峰选项、智能体模型/thinking 覆盖，以及尽力投递开关。
    - 表单验证以内联方式显示字段级错误；无效值会禁用保存按钮，直到修复为止。
    - 设置 `cron.webhookToken` 可发送专用 bearer token；如果省略，webhook 发送时不会带 auth 标头。
    - 已弃用的回退：运行 `openclaw doctor --fix`，将存储的旧版 `notify: true` 作业从 `cron.webhook` 迁移到显式的逐作业 webhook 或 completion 投递。

  </Accordion>
</AccordionGroup>

## MCP 页面

专用 MCP 页面是 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器的运维视图。它本身不会启动 MCP 传输；用它检查和编辑已保存的配置，然后在需要实时服务器证明时使用 `openclaw mcp doctor --probe`。

典型工作流：

1. 从侧边栏打开 **MCP**。
2. 检查摘要卡片中的总数、已启用、OAuth 和已过滤服务器数量。
3. 查看每个服务器行的传输、启用状态、auth、过滤器、超时和命令提示。
4. 当服务器应保留配置但不参与运行时发现时，切换启用状态。
5. 编辑作用域内的 `mcp` 配置部分，用于服务器定义、标头、TLS/mTLS 路径、OAuth 元数据、工具过滤器和 Codex 投影元数据。
6. 使用 **保存** 写入配置，或在运行中的 Gateway 网关应应用已更改配置时使用 **保存并发布**。
7. 当已编辑的进程需要静态诊断、实时证明或清理缓存运行时时，从终端运行 `openclaw mcp status --verbose`、`openclaw mcp doctor --probe` 或 `openclaw mcp reload`。

页面在渲染前会遮盖带凭据的类 URL 值，并在命令片段中引用服务器名称，因此复制的命令即使包含空格或 shell 元字符也仍可正常工作。完整 CLI 和配置参考位于 [MCP](/zh-CN/cli/mcp)。

## Activity 标签页

Activity 标签页是一个临时的浏览器本地观察器，用于查看实时工具活动。它派生自为 Chat 工具卡片提供能力的同一个 Gateway 网关 `session.tool` / 工具事件流；它不会添加另一个 Gateway 网关事件族、端点、持久活动存储、指标源或外部观察器流。

Activity 条目只保留已清理的摘要和已遮盖、截断的输出预览。工具参数值不会存储在 Activity 状态中；UI 会显示参数已隐藏，并且只记录参数字段数量。内存中的列表跟随当前浏览器标签页，在 Control UI 内导航时保留，并会在页面重新加载、切换会话或点击 **清除** 时重置。

## Chat 行为

<AccordionGroup>
  <Accordion title="发送和历史语义">
    - `chat.send` 是**非阻塞**的：它会立即以 `{ runId, status: "started" }` 确认，响应则通过 `chat` 事件流式传输。受信任的 Control UI 客户端也可以接收可选的 ACK 时序元数据，用于本地诊断。
    - Chat 上传接受图片以及非视频文件。图片保留原生图片路径；其他文件会作为托管媒体存储，并在历史中显示为附件链接。
    - 使用相同 `idempotencyKey` 重新发送时，运行期间返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
    - 为了 UI 安全，`chat.history` 响应有大小限制。当 transcript 条目过大时，Gateway 网关可能会截断长文本字段、省略较重的元数据块，并用占位符（`[chat.history omitted: message too large]`）替换超大消息。
    - 当可见的助手消息在 `chat.history` 中被截断时，侧边阅读器可以按需通过 `chat.message.get` 获取完整的显示规范化 transcript 条目，参数包括 `sessionKey`、需要时的活动 `agentId`，以及 transcript `messageId`。如果 Gateway 网关仍无法返回更多内容，阅读器会显示明确的不可用状态，而不是静默重复截断预览。
    - 助手/生成的图片会持久化为托管媒体引用，并通过经过身份验证的 Gateway 网关媒体 URL 返回，因此重新加载不依赖原始 base64 图片载荷保留在 chat history 响应中。
    - 渲染 `chat.history` 时，Control UI 会从可见的助手文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和被截断的工具调用块），以及泄漏的 ASCII/全角模型控制 token，并省略那些整个可见文本仅为精确静默 token `NO_REPLY` / `no_reply` 或 Heartbeat 确认 token `HEARTBEAT_OK` 的助手条目。
    - 在活动发送期间以及最终历史刷新期间，如果 `chat.history` 短暂返回较旧的快照，chat 视图会保持本地乐观用户/助手消息可见；一旦 Gateway 网关历史追上，规范 transcript 会替换这些本地消息。
    - 实时 `chat` 事件是投递状态，而 `chat.history` 是从持久会话 transcript 重建的。工具最终事件之后，Control UI 会重新加载历史，并且只合并一小段乐观尾部；transcript 边界记录在 [WebChat](/zh-CN/web/webchat) 中。
    - `chat.inject` 会向会话 transcript 追加一条助手注释，并广播一个 `chat` 事件用于仅 UI 更新（无智能体运行，无渠道投递）。
    - chat 标头会先显示智能体过滤器，再显示会话选择器，并且会话选择器按所选智能体限定作用域。切换智能体时只显示绑定到该智能体的会话；如果该智能体还没有已保存的 dashboard 会话，则回退到该智能体的主会话。
    - 在桌面宽度下，chat 控件保持在一行紧凑布局中，并在向下滚动 transcript 时折叠；向上滚动、返回顶部或到达底部会恢复这些控件。
    - 连续重复的纯文本消息会渲染为一个带计数徽标的气泡。携带图片、附件、工具输出或画布预览的消息不会被折叠。
    - chat 标头中的模型和 thinking 选择器会通过 `sessions.patch` 立即修补活动会话；它们是持久会话覆盖，而不是仅单轮发送选项。
    - 如果你在同一会话的模型选择器更改仍在保存时发送消息，composer 会等待该会话补丁完成后再调用 `chat.send`，以便发送使用选中的模型。
    - 在 Control UI 中输入 `/new` 会创建并切换到与 New Chat 相同的全新 dashboard 会话，除非配置了 `session.dmScope: "main"` 且当前父级是智能体的主会话；在这种情况下，它会就地重置主会话。输入 `/reset` 会保留 Gateway 网关对当前会话的显式就地重置。
    - chat 模型选择器会请求 Gateway 网关配置的模型视图。如果存在 `agents.defaults.models`，该 allowlist 会驱动选择器，包括保持提供商作用域目录动态的 `provider/*` 条目。否则，选择器会显示显式的 `models.providers.*.models` 条目，以及具有可用 auth 的提供商。完整目录仍可通过 debug `models.list` RPC 使用 `view: "all"` 获取。
    - 当新的 Gateway 网关会话使用情况报告包含当前上下文 token 时，chat composer 区域会显示紧凑的上下文使用情况指示器。它会在上下文压力较高时切换到警告样式，并在达到建议压缩级别时显示一个紧凑按钮，用于运行正常的会话压缩路径。过期的 token 快照会被隐藏，直到 Gateway 网关再次报告新的使用情况。

  </Accordion>
  <Accordion title="Talk 模式（浏览器实时）">
    Talk 模式使用已注册的实时语音提供商。配置 OpenAI 时，使用 `talk.realtime.provider: "openai"` 加上 `openai` API-key auth profile、`talk.realtime.providers.openai.apiKey` 或 `OPENAI_API_KEY`；OpenAI OAuth profile 不会配置 Realtime 语音。配置 Google 时，使用 `talk.realtime.provider: "google"` 加上 `talk.realtime.providers.google.apiKey`。浏览器永远不会收到标准提供商 API key。OpenAI 会收到用于 WebRTC 的临时 Realtime client secret。Google Live 会收到一个一次性受限 Live API auth token，用于浏览器 WebSocket 会话，并且指令和工具声明由 Gateway 网关锁定到 token 中。仅公开后端实时桥接的提供商会通过 Gateway 网关 relay 传输运行，因此凭据和供应商 socket 保持在服务端，而浏览器音频通过已认证的 Gateway 网关 RPC 移动。Realtime 会话 prompt 由 Gateway 网关组装；`talk.client.create` 不接受调用方提供的 instruction 覆盖。

    Chat composer 在 Talk 启动/停止按钮旁包含一个 Talk 选项按钮。这些选项会应用于下一个 Talk 会话，并且可以覆盖提供商、传输、模型、语音、reasoning effort、VAD 阈值、静默时长和前缀填充。当某个选项为空时，Gateway 网关会使用可用的已配置默认值或提供商默认值。选择 Gateway 网关 relay 会强制使用后端 relay 路径；选择 WebRTC 会保持会话由客户端拥有，如果提供商无法创建浏览器会话，则失败，而不是静默回退到 relay。

    在 Chat composer 中，Talk 控件是麦克风听写按钮旁的波形按钮。Talk 启动时，composer 状态行先显示 `Connecting Talk...`，音频连接后显示 `Talk live`，或者在实时工具调用通过 `talk.client.toolCall` 咨询已配置的更大模型时显示 `Asking OpenClaw...`。

    维护者实时 smoke：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 会验证 OpenAI 后端 WebSocket 桥、OpenAI 浏览器 WebRTC SDP 交换、Google Live 受限 token 浏览器 WebSocket 设置，以及带假麦克风媒体的 Gateway 网关 relay 浏览器适配器。该命令只打印提供商状态，不记录 secrets。

  </Accordion>
  <Accordion title="停止和中止">
    - 点击 **停止**（调用 `chat.abort`）。
    - 运行处于活动状态时，普通后续消息会排队。点击排队消息上的 **Steer**，将该后续消息注入正在运行的轮次。
    - 输入 `/stop`（或独立的中止短语，例如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以带外中止。
    - `chat.abort` 支持 `{ sessionKey }`（无 `runId`）来中止该会话的所有活动运行。

  </Accordion>
  <Accordion title="中止部分保留">
    - 当运行被中止时，部分助手文本仍可显示在 UI 中。
    - 当存在已缓冲输出时，Gateway 网关会将被中止的部分助手文本持久化到 transcript 历史中。
    - 持久化条目包含中止元数据，因此 transcript 消费方可以区分中止部分和正常完成输出。

  </Accordion>
</AccordionGroup>

## PWA 安装和 Web push

Control UI 随附 `manifest.webmanifest` 和 service worker，因此现代浏览器可以将其安装为独立 PWA。Web Push 允许 Gateway 网关通过通知唤醒已安装的 PWA，即使标签页或浏览器窗口没有打开也是如此。

如果页面在 OpenClaw 更新后立即显示 **协议不匹配**，请先使用 `openclaw dashboard` 重新打开 dashboard 并强制刷新页面。如果仍然失败，请清除 dashboard origin 的站点数据，或在私密浏览器窗口中测试；旧标签页或浏览器 service-worker 缓存可能会让更新前的 Control UI bundle 继续对接更新后的 Gateway 网关。

| 表面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 清单。可访问后，浏览器会提供“安装应用”。                      |
| `ui/public/sw.js`                                     | 处理 `push` 事件和通知点击的 Service Worker。                      |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下）   | 自动生成的 VAPID 密钥对，用于签名 Web Push 载荷。                  |
| `push/web-push-subscriptions.json`                    | 持久化的浏览器订阅端点。                                          |

当你想固定密钥时（用于多主机部署、密钥轮换或测试），请通过 Gateway 网关进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认值为 `https://openclaw.ai`）

Control UI 使用这些按作用域限制的 Gateway 网关方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` — 获取当前生效的 VAPID 公钥。
- `push.web.subscribe` — 注册一个 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` — 移除已注册的端点。
- `push.web.test` — 向调用方的订阅发送测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（参见 [配置](/zh-CN/gateway/configuration) 了解中继支持的推送）以及现有的 `push.test` 方法，后者面向原生移动端配对。
</Note>

## 托管嵌入

助手消息可以使用 `[embed ...]` 短代码内联渲染托管的 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    禁用托管嵌入内的脚本执行。
  </Tab>
  <Tab title="scripts (default)">
    允许交互式嵌入，同时保持源隔离；这是默认值，通常足以支持自包含的浏览器游戏/小组件。
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
只有当嵌入文档确实需要同源行为时，才使用 `trusted`。对于大多数智能体生成的游戏和交互式画布，`scripts` 是更安全的选择。
</Warning>

绝对外部 `http(s)` 嵌入 URL 默认保持阻止。如果你有意希望 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天消息宽度

分组聊天消息使用易读的默认最大宽度。宽屏部署可以通过设置 `gateway.controlUi.chatMessageMaxWidth` 覆盖该值，而无需修补内置 CSS：

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
  <Tab title="Integrated Tailscale Serve (preferred)">
    将 Gateway 网关保持在回环地址上，并让 Tailscale Serve 通过 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开：

    - `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行认证。OpenClaw 会使用 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该标头匹配来验证身份，并且只在请求命中回环地址且带有 Tailscale 的 `x-forwarded-*` 标头时接受这些身份。对于带有浏览器设备身份的 Control UI 操作员会话，此已验证的 Serve 路径还会跳过设备配对往返；无设备浏览器和节点角色连接仍会遵循正常的设备检查。如果你希望即使是 Serve 流量也必须使用显式共享密钥凭据，请设置 `gateway.auth.allowTailscale: false`。然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于该异步 Serve 身份路径，同一客户端 IP 和认证作用域的失败认证尝试会在写入速率限制前被串行化。因此，来自同一浏览器的并发错误重试可能会让第二个请求显示 `retry later`，而不是两个普通不匹配并行竞争。

    <Warning>
    无令牌 Serve 认证假定 Gateway 网关主机可信。如果不可信的本地代码可能在该主机上运行，请要求令牌/密码认证。
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

- 仅限 localhost 的不安全 HTTP 兼容性，可使用 `gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成的操作员 Control UI 认证
- 紧急破窗选项 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复：**使用 HTTPS（Tailscale Serve）或在本地打开 UI：

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在 Gateway 网关主机上）

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

    - 它允许 localhost Control UI 会话在非安全 HTTP 上下文中无需设备身份继续进行。
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
    - 成功的 trusted-proxy 认证可以允许**操作员** Control UI 会话无需设备身份进入。
    - 这**不会**扩展到节点角色 Control UI 会话。
    - 同主机回环反向代理仍然不满足 trusted-proxy 认证；参见 [可信代理认证](/zh-CN/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

参见 [Tailscale](/zh-CN/gateway/tailscale) 了解 HTTPS 设置指导。

## 内容安全策略

Control UI 附带严格的 `img-src` 策略：只允许**同源**资源、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，且不会发起网络获取。

实际含义：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍会渲染，包括 UI 获取并转换为本地 `blob:` URL 的已认证头像路由。
- 内联 `data:image/...` URL 仍会渲染（适用于协议内载荷）。
- Control UI 创建的本地 `blob:` URL 仍会渲染。
- 频道元数据发出的远程头像 URL 会在 Control UI 的头像辅助函数中被剥离，并替换为内置徽标/徽章，因此受攻陷或恶意频道无法强制操作员浏览器获取任意远程图片。

你无需更改任何内容即可获得此行为 — 它始终启用且不可配置。

## 头像路由认证

配置 Gateway 网关认证后，Control UI 头像端点需要与 API 其余部分相同的 Gateway 网关令牌：

- `GET /avatar/<agentId>` 只向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 在同一规则下返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与相邻的 assistant-media 路由一致）。这可以防止头像路由在其他方面受保护的主机上泄露智能体身份。
- Control UI 本身在获取头像时会将 Gateway 网关令牌作为 bearer 标头转发，并使用已认证的 blob URL，因此图片仍会在仪表板中渲染。

如果你禁用 Gateway 网关认证（不建议在共享主机上这样做），头像路由也会变为未认证，与 Gateway 网关的其余部分保持一致。

## 助手媒体路由认证

配置 Gateway 网关认证后，助手本地媒体预览使用两步路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要正常的 Control UI 操作员认证。浏览器在检查可用性时会将 Gateway 网关令牌作为 bearer 标头发送。
- 成功的元数据响应会包含一个短期 `mediaTicket`，其作用域限定为该确切源路径。
- 浏览器渲染的图片、音频、视频和文档 URL 使用 `mediaTicket=<ticket>`，而不是当前 Gateway 网关令牌或密码。票据很快过期，且不能授权其他源。

这使正常媒体渲染能与浏览器原生媒体元素兼容，同时不会把可复用的 Gateway 网关凭据放入可见媒体 URL 中。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。使用以下命令构建它们：

```bash
pnpm ui:build
```

可选的绝对基路径（当你想要固定资源 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（独立开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 空白 Control UI 页面

如果浏览器加载了空白仪表板，且 DevTools 没有显示有用错误，某个扩展或早期内容脚本可能阻止了 JavaScript 模块应用求值。静态页面包含一个纯 HTML 恢复面板，会在启动后 `<openclaw-app>` 未注册时出现。

在更改浏览器环境后使用该面板的**重试**操作，或在完成以下检查后手动重新加载：

- 禁用会注入所有页面的扩展，尤其是带有 `<all_urls>` 内容脚本的扩展。
- 尝试无痕窗口、干净的浏览器配置文件或其他浏览器。
- 保持 Gateway 网关运行，并在更换浏览器后验证同一个仪表板 URL。

## 调试/测试：开发服务器 + 远程 Gateway 网关

Control UI 是静态文件；WebSocket 目标可配置，并且可以不同于 HTTP 源。当你希望本地运行 Vite 开发服务器，而 Gateway 网关在其他位置运行时，这很有用。

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

    可选的一次性认证（如需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` 在加载后存储到 localStorage，并从 URL 中移除。
    - 如果你通过 `gatewayUrl` 传入完整的 `ws://` 或 `wss://` 端点，请对 `gatewayUrl` 值进行 URL 编码，确保浏览器能正确解析查询字符串。
    - 只要可行，`token` 应通过 URL 片段（`#token=...`）传入。片段不会发送到服务器，这可以避免请求日志和 Referer 泄漏。旧版 `?token=` 查询参数仍会为兼容性导入一次，但仅作为回退，并会在引导后立即移除。
    - `password` 仅保存在内存中。
    - 设置 `gatewayUrl` 后，UI 不会回退到配置或环境凭据。请显式提供 `token`（或 `password`）。缺少显式凭据会报错。
    - 当 Gateway 网关位于 TLS 后方时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
    - `gatewayUrl` 只在顶层窗口中接受（不允许嵌入），以防止点击劫持。
    - 公共非回环 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整源）。来自回环、RFC1918/链路本地、`.local`、`.ts.net` 或 Tailscale CGNAT 主机的私有同源 LAN/Tailnet 加载可以在不启用 Host-header 回退的情况下接受。
    - Gateway 网关启动时可以根据有效的运行时绑定地址和端口注入本地源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但远程浏览器源仍需要显式条目。
    - 除非是严格受控的本地测试，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`。它表示允许任何浏览器源，而不是“匹配我正在使用的任何主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host-header 源回退模式，但这是一种危险的安全模式。

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
