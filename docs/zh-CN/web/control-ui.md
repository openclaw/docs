---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你想在不使用 SSH 隧道的情况下访问 Tailnet
sidebarTitle: Control UI
summary: 基于浏览器的 Gateway 网关控制 UI（聊天、活动、节点、配置）
title: Control UI
x-i18n:
    generated_at: "2026-07-06T21:54:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: faa16914b33348ae5bc194936453ce822d740c6369e005c1a16c0de399ed45a5
    source_path: web/control-ui.md
    workflow: 16
---

Control UI 是一个由 Gateway 网关提供服务的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它会在同一端口上**直接连接 Gateway 网关 WebSocket**。

## 快速打开（本地）

如果 Gateway 网关正在同一台计算机上运行，请打开 [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）。

如果页面无法加载，请先启动 Gateway 网关：`openclaw gateway`。

<Note>
在原生 Windows 局域网绑定上，即使 `127.0.0.1` 能在 Gateway 网关主机上工作，Windows 防火墙或组织管理的组策略仍可能阻止已公布的局域网 URL。在 Windows 主机上运行 `openclaw gateway status --deep`；它会报告可能被阻止的端口、配置文件不匹配以及策略可能忽略的本地防火墙规则。
</Note>

身份验证会在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时的 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时的受信代理身份标头

仪表板设置面板会为当前浏览器标签页会话和所选 Gateway 网关 URL 保留一个令牌；密码不会持久保存。新手引导通常会在首次连接时为共享密钥身份验证生成 Gateway 网关令牌，但当 `gateway.auth.mode` 为 `"password"` 时，密码身份验证也可使用。

## 设备配对（首次连接）

从新的浏览器或设备连接通常需要**一次性配对审批**，显示为 `disconnected (1008): pairing required`。

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

如果浏览器使用已更改的身份验证详情（角色/权限范围/公钥）重试配对，之前的待处理请求会被取代，并创建新的 `requestId`；批准前请重新运行 `openclaw devices list`。

将已配对浏览器从读取访问切换到写入/管理员访问会被视为审批升级，而不是静默重新连接：OpenClaw 会保留旧审批的活动状态，阻止更广的重新连接，并要求你明确批准新的权限范围集合。

批准后，设备会被记住，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则无需重新批准。有关令牌轮换、撤销以及 Paperclip / `openclaw_gateway` 首次运行审批流程，请参阅 [设备 CLI](/zh-CN/cli/devices)。

<Note>
- 直接 local loopback 浏览器连接（`127.0.0.1` / `localhost`）会自动批准。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份验证通过且浏览器提供其设备身份时，Tailscale Serve 可为 Control UI 操作员会话跳过配对往返。无设备浏览器和节点角色连接仍遵循正常设备检查。
- 直接 Tailnet 绑定、局域网浏览器连接以及没有设备身份的浏览器配置文件仍需要显式批准。
- 每个浏览器配置文件都会生成唯一设备 ID，因此切换浏览器或清除浏览器数据需要重新配对。

</Note>

## 配对移动设备

已配对的管理员可以在不打开终端的情况下创建 iOS/Android 连接二维码：

<Steps>
  <Step title="打开移动端配对">
    选择**节点**，然后点击**设备**卡片中的**配对移动设备**。
  </Step>
  <Step title="连接手机">
    在 OpenClaw 移动应用中，打开**设置** → **Gateway 网关**并扫描二维码。你也可以改为复制并粘贴设置代码。
  </Step>
  <Step title="确认连接">
    官方 iOS/Android 应用会自动连接。如果**设备**显示待处理请求，请先检查其角色和权限范围，再批准它。
  </Step>
</Steps>

创建设置代码需要 `operator.admin`；没有该权限的会话会禁用按钮。设置代码包含短期有效的引导凭证，因此在二维码和复制的代码有效期间，请像对待密码一样处理它们。远程配对时，Gateway 网关必须解析为 `wss://`（例如通过 Tailscale Serve/Funnel）；纯 `ws://` 仅限于 loopback 和私有局域网地址。完整的安全和回退详情请参阅[配对](/zh-CN/channels/pairing#pair-from-the-control-ui-recommended)。

## 个人身份（浏览器本地）

Control UI 支持按浏览器设置个人身份（显示名称和头像），并将其附加到传出消息上，用于共享会话中的归属标识。它位于浏览器存储中，作用域限定为当前浏览器配置文件，不会同步到其他设备，也不会在服务器端持久保存，除了你发送的消息上正常的转录作者元数据。清除站点数据或切换浏览器会将其重置为空。

助手头像覆盖遵循相同的浏览器本地模式：上传的覆盖会在本地叠加到 Gateway 网关解析出的身份上，并且绝不会通过 `config.patch` 往返传输。共享的 `ui.assistant.avatar` 配置字段仍可供直接写入该字段的非 UI 客户端使用。

## 运行时配置端点

Control UI 会从 `/control-ui-config.json` 获取其运行时设置，该路径相对于 Gateway 网关的 Control UI 基础路径解析（例如在基础路径 `/__openclaw__/` 下为 `/__openclaw__/control-ui-config.json`）。该端点受与其余 HTTP 表面相同的 Gateway 网关身份验证保护：未经身份验证的浏览器无法获取它，成功获取需要有效的 Gateway 网关令牌/密码、Tailscale Serve 身份或受信代理身份。

## Gateway 网关主机状态

在简单视图中打开**设置**，可查看 **Gateway 网关主机**卡片，其中包含 Gateway 网关机器、局域网地址、操作系统、运行时、运行时间、CPU 负载、内存和状态卷磁盘空间。该卡片可见时会每 10 秒通过 `system.info` Gateway 网关 RPC 刷新一次，该 RPC 需要 `operator.read` 权限范围。较旧的 Gateway 网关和没有该权限范围的连接会省略此卡片。

## 语言支持

Control UI 会在首次加载时根据你的浏览器语言区域设置进行本地化。若要稍后覆盖它，请打开**概览 -> Gateway 网关访问 -> 语言**（选择器位于 Gateway 网关访问卡片中，而不在外观下）。

- 支持的语言区域：`en`、`ar`、`de`、`es`、`fa`、`fr`、`hi`、`id`、`it`、`ja-JP`、`ko`、`nl`、`pl`、`pt-BR`、`ru`、`th`、`tr`、`uk`、`vi`、`zh-CN`、`zh-TW`
- 非英语翻译会在浏览器中延迟加载。
- 所选语言区域会保存在浏览器存储中，并在未来访问时复用。
- 缺失的翻译键会回退到英语。

文档翻译会为同一组非英语语言区域生成，但文档站点内置的 Mintlify 语言选择器只列出 Mintlify 接受的语言区域代码。泰语（`th`）和波斯语（`fa`）文档仍会在发布仓库中生成；在 Mintlify 支持这些代码之前，它们可能不会出现在该选择器中。

## 外观主题

外观面板包含内置的 Claw、Knot 和 Dash 主题（Claw 为默认），以及一个浏览器本地的 tweakcn 导入槽。若要导入主题，请打开 [tweakcn 编辑器](https://tweakcn.com/editor/theme)，选择或创建一个主题，点击**分享**，然后将复制的链接粘贴到外观中。导入器也接受 `https://tweakcn.com/r/themes/<id>` 注册表 URL、类似 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 的编辑器 URL、相对 `/themes/<id>` 路径、原始主题 ID，以及 `amethyst-haze` 等默认主题名称。

导入的主题只存储在当前浏览器配置文件中；它们不会写入 Gateway 网关配置，也不会跨设备同步。替换导入主题会更新唯一的本地槽；如果导入主题处于活动状态，清除它会切换回 Claw。

外观还提供浏览器本地的文本大小设置，与其余 Control UI 偏好设置一起存储。它适用于聊天文本、编辑器文本、工具卡片和聊天侧边栏，并将文本输入保持至少 16px，这样移动端 Safari 在聚焦时不会自动缩放。

## 侧边栏导航

侧边栏将导航固定在可滚动的最近会话列表上方，该列表分为**已固定**、每个自定义分组一个分区（会话 `category`，按字母排序），以及其余会话的**未分组**。每个已固定会话都会保持可见，而未固定会话会保留独立的九项最近记录预算。打开可见会话会移动选择高亮，而不会重新排序行；列表外的深层链接会显示在顶部。自上次读取后有新活动的会话会显示未读圆点，打开后会标记为已读。每个会话行都有一个上下文菜单（烤肉串按钮或右键点击），其中包含固定/取消固定、标记为未读/已读、重命名、Fork、移动到分组（包括新建分组和从分组移除）、归档和删除；触控布局会保持直接固定和菜单控件可见。多 Agent 设置会在未分组标题中显示紧凑的作用域控件。**概览**是唯一默认固定的目标；展开**更多**可访问所有其他目标。在更多下选择**自定义侧边栏**，或右键点击导航区域，即可固定或取消固定目标并恢复默认值。固定集合和更多展开状态会存储在当前浏览器配置文件中，并在重新加载后保留。

紧凑页脚将连接状态、**设置**、**文档**、移动端配对以及侧边栏折叠开关放在一起。折叠后，侧边栏会缩小为图标栏，展开按钮位于页脚堆栈顶部。在抽屉断点处，顶部栏汉堡按钮会替代该控件。

## 它能做什么（当前）

<AccordionGroup>
  <Accordion title="聊天和 Talk">
    - 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 聊天历史刷新会请求带有单条消息文本上限的有界最近窗口，因此大型会话不会在聊天可用前强制浏览器渲染完整转录负载。
    - 将鼠标悬停在公开 GitHub issue 或 pull request 链接上，或用键盘聚焦该链接时，会显示其状态、标题、作者、最近活动、评论和变更统计信息。已连接的 Gateway 网关会获取并缓存公开元数据，而不会更改链接目标，包括 UI 使用远程 Gateway 网关时也是如此。Gateway 网关会在确认仓库为公开后优先使用可用的 `GH_TOKEN` 或 `GITHUB_TOKEN`；否则使用 GitHub 的匿名 API，并配合更长缓存。
    - 通过浏览器实时会话进行 Talk。OpenAI 使用直接 WebRTC，Google Live 通过 WebSocket 使用受限的一次性浏览器令牌，而仅后端实时语音插件使用 Gateway 网关中继传输。客户端拥有的提供商会话以 `talk.client.create` 开始；Gateway 网关中继会话以 `talk.session.create` 开始。中继会将提供商凭证保留在 Gateway 网关上，同时浏览器通过 `talk.session.appendAudio` 流式传输麦克风 PCM，通过 `talk.client.toolCall` 将 `openclaw_agent_consult` 提供商工具调用转发到 Gateway 网关，以应用 Gateway 网关策略和配置的更大 OpenClaw 模型，并通过 `talk.client.steer` 或 `talk.session.steer` 路由活动运行的语音 Steer。
    - 在聊天中流式传输工具调用和实时工具输出卡片（智能体事件）。
    - 活动标签页提供浏览器本地、优先脱敏的实时工具活动摘要，来自现有 `session.tool` / 工具事件投递。

  </Accordion>
  <Accordion title="渠道、实例、会话、Dreaming">
    - 渠道：内置以及捆绑/外部插件渠道状态、二维码登录和按渠道配置（`channels.status`、`web.login.*`、`config.patch`）。
    - 渠道探测刷新会在较慢的提供商检查完成期间保持上一份快照可见，并在探测或审计超过其 UI 预算时标记部分快照。
    - 实例：在线列表和刷新（`system-presence`）。
    - 会话：默认列出已配置 Agent 的会话，置顶常用会话，重命名会话，归档或恢复非活跃会话，从陈旧的未配置 Agent 会话键回退，并应用按会话的模型/thinking/fast/verbose/trace/reasoning 覆盖（`sessions.list`、`sessions.patch`）。置顶会话排序在最近的未置顶会话之上；已归档会话位于 Sessions 页面的归档视图中，并保留其转录记录。对于自上次读取后有活动的会话，行会显示未读圆点，并提供标记未读/标记已读操作（`sessions.patch { unread }`），以及将转录记录分支为新会话的 Fork 操作（`sessions.create { parentSessionKey, fork: true }`）。
    - 会话分组：Group by 控件会按自定义分组、渠道、类型、Agent 或日期将会话表组织成多个分区。自定义分组通过 `sessions.patch`（`category`）按会话持久保存，因此从消息渠道（Discord、Telegram、WhatsApp，...）启动的会话也可以分类；可将行拖到某个分区上来分配分组，也可以使用每行的分组选择器，并通过 New group 操作创建分组。
    - Dreaming：Dreaming 状态、启用/禁用开关和 Dream Diary 阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、任务、Skills、节点、Exec 审批">
    - Cron 作业：列出/添加/编辑/运行/启用/禁用以及运行历史（`cron.*`）。
    - 任务：带有关联会话和取消功能的实时活跃及近期后台任务台账（`tasks.*`）。
    - Skills：状态、启用/禁用、安装、API key 更新（`skills.*`）。
    - 节点：列表以及能力上限（`node.list`）、创建移动端设置代码，并批准设备配对（`device.pair.*`）。
    - Exec 审批：编辑 Gateway 网关或节点 allowlist，并为 `exec host=gateway/node` 询问策略（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - MCP 为已配置的服务器、启用状态、OAuth/filter/parallel 摘要、常用操作员命令以及限定范围的 `mcp` 配置编辑器提供专用设置页面。
    - 通过验证应用并重启（`config.apply`），然后唤醒最后一个活跃会话。
    - 写入包含 base-hash 防护，防止覆盖并发编辑。
    - 写入（`config.set`/`config.apply`/`config.patch`）会为提交的配置载荷中的引用预检活跃 SecretRef 解析；未解析的活跃已提交引用会在写入前被拒绝。
    - 表单保存会丢弃无法从已保存配置恢复的陈旧脱敏占位符，同时保留仍映射到已保存密钥的脱敏值。
    - Schema 和表单渲染来自 `config.schema` / `config.schema.lookup`，包括字段 `title`/`description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及可用时的插件和渠道 schema。仅当快照具备安全的原始往返能力时，原始 JSON 编辑器才可用；否则 Control UI 会强制使用表单模式。
    - 原始 JSON 编辑器的“重置为已保存”会保留原始编写的形状（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照可以安全往返时，外部编辑会在重置后保留下来。
    - 结构化 SecretRef 对象值在表单文本输入中以只读方式渲染，以防止意外的对象到字符串损坏。

  </Accordion>
  <Accordion title="用量">
    - 基于会话推导的 token 和预估成本分析会与提供商账单保持分离。
    - 提供商卡片会调用 `usage.status`，并显示由已配置提供商插件报告的实时计划名称、配额窗口、余额、支出和预算。
    - 提供商用量失败不会阻塞会话/成本仪表板；不可用的提供商卡片会显示自己的错误状态。

  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态/健康/Models 快照、事件日志和手动 RPC 调用（`status`、`health`、`models.list`）。
    - 事件日志包括 Control UI 刷新/RPC 计时、慢聊天/配置渲染计时，以及当浏览器暴露这些 PerformanceObserver 条目类型时用于长动画帧或长任务的浏览器响应性条目。
    - 日志：带过滤/导出的 Gateway 网关文件日志实时 tail（`logs.tail`）。
    - 更新：运行包/git 更新并重启（`update.run`），附带重启报告，然后在重新连接后轮询 `update.status` 以验证正在运行的 Gateway 网关版本。

  </Accordion>
  <Accordion title="Cron 作业面板说明">
    - 对于隔离作业，delivery 默认使用 announce summary；对于仅内部运行，切换为 none。
    - 选择 announce 时会显示渠道/目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设为有效的 HTTP(S) webhook URL。
    - 对于主会话作业，webhook 和 none delivery 模式可用。
    - 高级编辑控件包括 delete-after-run、清除 Agent 覆盖、cron exact/stagger 选项、Agent 模型/thinking 覆盖，以及尽力 delivery 开关。
    - 表单验证以内联方式显示字段级错误；无效值会禁用保存按钮，直到修复为止。
    - 设置 `cron.webhookToken` 以发送专用 bearer token；如果省略，webhook 发送时不会带 auth header。
    - `cron.webhook` 是已弃用的旧版回退：运行 `openclaw doctor --fix`，将仍使用 `notify: true` 的已存储作业迁移为显式的按作业 webhook 或完成 delivery。

  </Accordion>
</AccordionGroup>

## MCP 页面

专用 MCP 页面是面向 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器的操作员视图。它本身不会启动 MCP 传输；使用它来检查和编辑已保存配置，然后在需要实时服务器证明时使用 `openclaw mcp doctor --probe`。

典型工作流：

1. 从侧边栏打开 **MCP**。
2. 检查总数、已启用、OAuth 和已过滤服务器数量的摘要卡片。
3. 查看每个服务器行的传输、启用状态、认证、过滤器、超时和命令提示。
4. 当服务器应保持已配置但不参与运行时发现时，切换启用状态。
5. 编辑限定范围的 `mcp` 配置段，用于服务器定义、header、TLS/mTLS 路径、OAuth 元数据、工具过滤器和 Codex 投影元数据。
6. 使用 **保存** 执行配置写入，或在正在运行的 Gateway 网关应应用已更改配置时使用 **保存并发布**。
7. 从终端运行 `openclaw mcp status --verbose`、`openclaw mcp doctor --probe` 或 `openclaw mcp reload`，分别用于静态诊断、实时证明或缓存运行时释放。

该页面会在渲染前脱敏带凭据的类 URL 值，并在命令片段中引用服务器名称，因此复制的命令即使包含空格或 shell 元字符也仍能工作。完整 CLI 和配置参考：[MCP](/zh-CN/cli/mcp)。

## Activity 标签页

Activity 标签页是一个临时的浏览器本地观察器，用于观察实时工具活动，派生自为聊天工具卡片提供能力的同一 Gateway 网关 `session.tool` / 工具事件流。它不会添加另一个 Gateway 网关事件族、端点、持久活动存储、指标 feed 或外部观察器流。

Activity 条目只保留已清理的摘要和已脱敏、截断的输出预览。工具参数值不会存储在 Activity 状态中；UI 会显示参数已隐藏，并且只记录参数字段数量。内存中的列表跟随当前浏览器标签页，在 Control UI 内导航时保留，并在页面重新加载、会话切换或 **清除** 时重置。

## 操作员终端

可停靠的操作员终端默认禁用。要启用它，请设置 `gateway.terminal.enabled: true` 并重启 Gateway 网关。终端需要 `operator.admin` 连接，并在活跃 Agent 工作区中打开主机 PTY。新标签页会跟随当前选中的聊天 Agent。

<Warning>
终端是一个不受限制的主机 shell，并继承 Gateway 网关进程环境。仅在受信任的操作员部署中启用它。OpenClaw 会拒绝 `sandbox.mode: "all"` 的 Agent 的终端会话；将活跃 Agent 更改为该模式会关闭其现有和正在进行的终端会话。
</Warning>

使用 **Ctrl + 反引号** 切换停靠面板。布局支持底部和右侧停靠，会随浏览器视口调整大小，并保留多个 shell 标签页。有关 `gateway.terminal.enabled` 和可选的 `gateway.terminal.shell` 覆盖，请参阅 [Gateway 配置](/zh-CN/gateway/configuration-reference#gateway)。

会话会在断开连接后保留：页面重新加载、笔记本电脑休眠或网络短暂中断会在 Gateway 网关上分离会话，而不是杀死它；同一浏览器标签页会在重新连接时重新附加，并回放近期输出。分离的会话会在 `gateway.terminal.detachedSessionTimeoutSeconds` 后被杀死（默认 300 秒；`0` 恢复为断开即杀死）。`terminal.list` 显示可附加的会话，`terminal.attach` 接管其中一个（tmux 风格接管），`terminal.text` 以纯文本读取会话的近期输出而不附加，这是为 Agent/工具提供的便利能力。

终端也可作为全屏、仅终端文档在 `/?view=terminal` 使用。iOS 和 Android 应用会在其 Terminal 屏幕中嵌入此页面，并复用已存储的 Gateway 网关凭据；可用性遵循相同的 `gateway.terminal.enabled` 和 `operator.admin` 门控，并且当已连接的 Gateway 网关未提供终端时，该页面会显示通知。

## 聊天行为

<AccordionGroup>
  <Accordion title="发送和历史语义">
    - `chat.send` 是**非阻塞**的：它会立即以 `{ runId, status: "started" }` 确认，响应通过 `chat` 事件流式传输。受信任的 Control UI 客户端也可能收到可选的 ACK 计时元数据，用于本地诊断。
    - 聊天上传接受图片以及非视频文件。图片保留原生图片路径；其他文件会存储为托管媒体，并在历史中显示为附件链接。
    - 使用相同的 `idempotencyKey` 重新发送时，运行期间返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
    - 为了 UI 安全，`chat.history` 响应有大小限制。当转录条目过大时，Gateway 网关可能会截断长文本字段、省略较重的元数据块，并用占位符（`[chat.history omitted: message too large]`）替换超大的消息。
    - 当可见的助手消息在 `chat.history` 中被截断时，侧边阅读器可以按需通过 `chat.message.get` 拉取完整的、显示规范化后的转录条目，需要使用 `sessionKey`、必要时的活跃 `agentId`，以及转录 `messageId`。如果 Gateway 网关仍然无法返回更多内容，阅读器会显示明确的不可用状态，而不是静默重复截断预览。
    - 助手/生成的图片会持久化为托管媒体引用，并通过已认证的 Gateway 网关媒体 URL 返回，因此重新加载不依赖原始 base64 图片载荷继续留在聊天历史响应中。
    - 渲染 `chat.history` 时，Control UI 会从可见助手文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截断的工具调用块），以及泄漏的 ASCII/全角模型控制令牌。它会省略整个可见文本仅为精确静默令牌 `NO_REPLY` / `no_reply` 或 Heartbeat 确认令牌 `HEARTBEAT_OK` 的助手条目。
    - 在活跃发送期间以及最终历史刷新期间，如果 `chat.history` 短暂返回较旧的快照，聊天视图会继续显示本地乐观的用户/助手消息；一旦 Gateway 网关历史追上，规范转录会替换这些本地消息。
    - 实时 `chat` 事件是投递状态，而 `chat.history` 是从持久会话转录重建的。在工具最终事件之后，Control UI 会重新加载历史，并且只合并一小段乐观尾部；转录边界记录在[网页聊天](/zh-CN/web/webchat)中。
    - `chat.inject` 会向会话转录追加一条助手备注，并广播一个 `chat` 事件用于仅 UI 更新（无智能体运行，无渠道投递）。
    - 侧边栏按已固定/自定义/未分组分区列出最近会话，并提供“新建会话”操作和“所有会话”链接。固定会话始终可见；未固定会话保持九项预算和稳定的最近顺序，因此打开一个可见行只会移动高亮。新的仪表板会话会异步从第一条非命令消息生成简短标题；显式名称绝不会被替换。设置 `agents.defaults.utilityModel`（或 `agents.list[].utilityModel`），可将这个独立的模型调用路由到成本更低的模型。切换紧凑 Agent 作用域时，只显示与该智能体关联的会话；如果该智能体还没有保存的仪表板会话，则回退到该智能体的主会话。
    - 会话搜索位于命令面板中（⌘K，或顶部栏中的搜索按钮）：输入查询会跨智能体跟随有限数量的匹配页面，过滤内部子行/cron 行，并在导航命令旁列出可见匹配项。“所有会话”页面保留带筛选器的完整可搜索列表。
    - 每个侧边栏行都保留直接固定入口，并提供完整的上下文菜单，用于未读状态、重命名、fork、分组、归档和删除。活跃运行和智能体的主会话不能归档。归档或删除当前选中的会话会将聊天切回该智能体的主会话。
    - 在 macOS 应用中，OpenClaw 标记使用窗口控件旁原本为空的原生标题栏条，而不是占用侧边栏行。
    - 在桌面宽度下，聊天控件保持在一行紧凑布局中，并在向下滚动转录时折叠；向上滚动、返回顶部或到达底部会恢复控件。
    - 连续重复的纯文本消息会渲染为一个气泡，并带有计数徽章。携带图片、附件、工具输出或画布预览的消息不会折叠。
    - 聊天标题中的模型和思考选择器会通过 `sessions.patch` 立即修补活跃会话；它们是持久的会话覆盖项，而不是仅限单轮的发送选项。
    - **拆分视图：**从编辑器控件打开它，然后根据可容纳数量向右或向下拆分任意窗格。每个窗格都有自己的会话、转录、编辑器和工具流。
    - 活跃拆分窗格驱动侧边栏选择和 URL。分隔条可调整列和堆叠窗格大小，浏览器会在本地跨重新加载存储布局。
    - 在窄屏上，拆分视图保留布局，但只渲染活跃窗格；其窗格标题仍提供会话切换和关闭控件。
    - 如果你在同一会话的模型选择器更改仍在保存时发送消息，编辑器会先等待该会话补丁完成，再调用 `chat.send`，以便发送使用所选模型。
    - 输入 `/new` 会创建并切换到与“新建聊天”相同的全新仪表板会话，除非已配置 `session.dmScope: "main"` 且当前父级是该智能体的主会话；此时它会就地重置主会话。输入 `/reset` 会保留 Gateway 网关对当前会话的显式就地重置。
    - 聊天模型选择器请求 Gateway 网关配置的模型视图。如果存在 `agents.defaults.models`，该允许列表会驱动选择器，包括保持提供商作用域目录动态的 `provider/*` 条目。否则，选择器会显示显式的 `models.providers.*.models` 条目以及具有可用凭证的提供商。完整目录仍可通过调试 `models.list` RPC 使用 `view: "all"` 获取。
    - 当新的 Gateway 网关会话用量报告包含当前上下文令牌时，聊天编辑器工具栏会显示一个小型上下文用量环，标出已用百分比。打开该环可查看当前上下文窗口、最新运行令牌计数和估算总成本、提供商/模型标识，以及报告时最新提供商响应的输入/输出/缓存成本明细。该环会在上下文压力较高时切换为警告样式，并在推荐的压缩级别显示一个紧凑按钮，用于运行正常的会话压缩路径。陈旧的令牌快照会被隐藏，直到 Gateway 网关再次报告新的用量。

  </Accordion>
  <Accordion title="Talk 模式（浏览器实时）">
    Talk 模式使用已注册的实时语音提供商。配置 OpenAI 时，使用 `talk.realtime.provider: "openai"` 加上 `openai` API-key/OAuth 配置文件、外部 Codex 登录、`talk.realtime.providers.openai.apiKey` 或 `OPENAI_API_KEY`。已配置的 API-key 来源优先，Codex OAuth 是自动回退。配置 Google 时，使用 `talk.realtime.provider: "google"` 加上 `talk.realtime.providers.google.apiKey`。浏览器绝不会收到标准提供商 API key 或 OAuth 令牌：OpenAI 会收到用于 WebRTC 的临时 Realtime 客户端密钥，Google Live 会收到一次性受限的 Live API 认证令牌，用于浏览器 WebSocket 会话，指令和工具声明由 Gateway 网关锁定到令牌中。仅暴露后端实时桥接的提供商会通过 Gateway 网关中继传输运行，因此凭证和供应商套接字保留在服务器端，而浏览器音频通过已认证的 Gateway 网关 RPC 移动。Realtime 会话提示词由 Gateway 网关组装；`talk.client.create` 不接受调用方提供的指令覆盖。

    持久提供商、模型、语音、传输、推理力度、精确 VAD 阈值、静默时长和前缀填充默认值位于**设置 → 通信 → Talk**；更改它们需要 `operator.admin` 访问权限。配置 Gateway 网关中继会强制使用后端中继路径；配置 WebRTC 会保持会话由客户端拥有，并且如果提供商无法创建浏览器会话，则会失败，而不是静默回退到中继。

    Talk 控件本身是编辑器工具栏中的麦克风按钮。它的插入符列表包含**系统默认**以及浏览器暴露的每个麦克风，包括 USB、Bluetooth 和虚拟输入。所选设备 ID 保持在浏览器本地，绝不会发送到 Gateway 网关；如果该精确设备消失，Talk 会要求你选择另一个输入，而不是静默从不同麦克风录音。Talk 启动时，编辑器状态行会显示 `Connecting Talk...`，然后在音频连接时显示 `Talk live`，或在实时工具调用通过 `talk.client.toolCall` 咨询已配置的更大模型时显示 `Asking OpenClaw...`。

    维护者实时冒烟测试：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 会验证 OpenAI 后端 WebSocket 桥接、OpenAI 浏览器 WebRTC SDP 交换、Google Live 受限令牌浏览器 WebSocket 设置，以及带假麦克风媒体的 Gateway 网关中继浏览器适配器。该命令只打印提供商状态，不记录密钥。

  </Accordion>
  <Accordion title="停止和中止">
    - 点击**停止**（调用 `chat.abort`）。
    - 运行处于活跃状态时，普通后续消息会排队。点击排队消息上的 **Steer**，可将该后续消息注入正在运行的轮次。
    - 输入 `/stop`（或独立的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）可带外中止。
    - `chat.abort` 支持 `{ sessionKey }`（无 `runId`），用于中止该会话的所有活跃运行。

  </Accordion>
  <Accordion title="中止部分内容保留">
    - 当运行被中止时，部分助手文本仍可显示在 UI 中。
    - 当存在已缓冲输出时，Gateway 网关会将中止的部分助手文本持久化到转录历史中。
    - 持久化条目包含中止元数据，因此转录消费者可以区分中止部分内容和正常完成输出。

  </Accordion>
</AccordionGroup>

## 连接丢失和重新连接

一旦会话建立，Gateway 网关连接断开不会让你登出。客户端自动使用退避重试（800 ms 到 15 s）期间，仪表板会保持可见，并显示琥珀色的“Gateway 网关连接丢失 — 正在重新连接…”横幅。实时更新和操作会暂停，直到连接恢复；横幅中的**立即重试**会强制立即尝试。

登录门槛只会在尚未建立会话（首次打开、连接前页面重新加载）或 Gateway 网关主动拒绝凭证（错误令牌/密码、已撤销配对）时出现，这些状态需要你的输入，而不是等待。

## PWA 安装和 Web Push

Control UI 随附 `manifest.webmanifest` 和 service worker，因此现代浏览器可以将其安装为独立 PWA。Web Push 允许 Gateway 网关通过通知唤醒已安装的 PWA，即使标签页或浏览器窗口未打开。

如果页面在 OpenClaw 更新后立即显示**协议不匹配**，先用 `openclaw dashboard` 重新打开仪表板并强制刷新。如果仍然失败，请清除仪表板源的站点数据，或在私密浏览器窗口中测试；旧标签页或浏览器 service-worker 缓存可能会让更新前的 Control UI 包继续针对更新后的 Gateway 网关运行。

| Surface                                               | 作用                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 清单。浏览器在它可访问后会提供“安装应用”。   |
| `ui/public/sw.js`                                     | 处理 `push` 事件和通知点击的 Service worker。 |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下） | 自动生成的 VAPID 密钥对，用于签名 Web Push 载荷。       |
| `push/web-push-subscriptions.json`                    | 持久化的浏览器订阅端点。                          |

当你想固定密钥（多主机部署、密钥轮换或测试）时，通过 Gateway 网关进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认值为 `https://openclaw.ai`）

Control UI 使用这些受权限范围限制的 Gateway 网关方法来注册和测试浏览器订阅：

- `push.web.vapidPublicKey` 获取当前生效的 VAPID 公钥。
- `push.web.subscribe` 注册一个 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` 移除已注册的端点。
- `push.web.test` 向调用方的订阅发送一条测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（有关基于中继的推送，请参阅[配置](/zh-CN/gateway/configuration)）和 `push.test` 方法，后者面向原生移动端配对。
</Note>

## 托管嵌入

助手消息可以通过 `[embed ...]` 短代码内联渲染托管 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

<Tabs>
  <Tab title="strict">
    禁用托管嵌入中的脚本执行。
  </Tab>
  <Tab title="scripts (default)">
    允许交互式嵌入，同时保持来源隔离；通常足以用于自包含的浏览器游戏/小组件。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 之上添加 `allow-same-origin`，用于确实需要更强权限的同站点文档。
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
仅当嵌入文档确实需要同源行为时才使用 `trusted`。对于大多数智能体生成的游戏和交互式画布，`scripts` 是更安全的选择。
</Warning>

默认仍会阻止绝对外部 `http(s)` 嵌入 URL。若要允许 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天消息宽度

分组聊天消息使用易读的默认最大宽度。宽屏显示器部署可以通过设置 `gateway.controlUi.chatMessageMaxWidth` 覆盖该值，而无需修补内置 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

该值在到达浏览器之前会被验证。支持的形式包括纯长度和百分比，例如 `960px` 或 `82%`，以及受约束的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 宽度表达式。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    将 Gateway 网关保持在 loopback 上，并让 Tailscale Serve 通过 HTTPS 代理它：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开 `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）。

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行认证。OpenClaw 会通过 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该标头匹配来验证身份，并且只有当请求命中 loopback 且带有 Tailscale 的 `x-forwarded-*` 标头时才接受这些身份。对于带有浏览器设备身份的 Control UI 操作员会话，这条已验证的 Serve 路径也会跳过设备配对往返；无设备浏览器和节点角色连接仍会走正常的设备检查。如果你希望即使对 Serve 流量也要求显式共享密钥凭据，请设置 `gateway.auth.allowTailscale: false`，然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于这条异步 Serve 身份路径，同一客户端 IP 和认证范围的失败认证尝试会在写入速率限制之前被串行化。因此，来自同一浏览器的并发错误重试可能会在第二个请求上显示 `retry later`，而不是两个普通不匹配并行竞争。

    <Warning>
    无令牌 Serve 认证假定 Gateway 网关主机是可信的。如果不受信任的本地代码可能在该主机上运行，请要求令牌/密码认证。
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    打开 `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）。

    将匹配的共享密钥粘贴到 UI 设置中（作为 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果你通过明文 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）打开仪表盘，浏览器会在**非安全上下文**中运行并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

已记录的例外：

- 使用 `gateway.controlUi.allowInsecureAuth=true` 的仅 localhost 不安全 HTTP 兼容性
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成操作员 Control UI 认证
- 应急 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复：**使用 HTTPS（Tailscale Serve），或在本地通过 `https://<magicdns>/`（Serve）或 `http://127.0.0.1:18789/`（在 Gateway 网关主机上）打开 UI。

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

    `allowInsecureAuth` 只是一个本地兼容性开关：

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
    `dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，是严重的安全降级。应急使用后请尽快还原。
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - 成功的 trusted-proxy 认证可以允许**操作员** Control UI 会话无需设备身份进入。
    - 这**不会**扩展到节点角色 Control UI 会话。
    - 同主机 loopback 反向代理仍不满足 trusted-proxy 认证；请参阅[受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

有关 HTTPS 设置指导，请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 附带严格的 `img-src` 策略：仅允许**同源**资源、`data:` URL 和本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且永远不会发起网络请求。

实际表现：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍会渲染，包括 UI 获取并转换为本地 `blob:` URL 的已认证头像路由。
- 内联 `data:image/...` URL 仍会渲染。
- Control UI 创建的本地 `blob:` URL 仍会渲染。
- GitHub 链接预览头像由 Gateway 网关从 GitHub 固定头像主机获取，并作为有界 `data:` URL 返回；操作员浏览器永远不会联系远程头像主机。
- 频道元数据发出的远程头像 URL 会在 Control UI 的头像辅助逻辑中被剥离，并替换为内置 logo/徽章，因此被攻陷或恶意的频道无法强制操作员浏览器获取任意远程图片。

此策略始终启用，且不可配置。

## 头像路由认证

配置 Gateway 网关认证后，Control UI 头像端点要求使用与 API 其余部分相同的 Gateway 网关令牌：

- `GET /avatar/<agentId>` 仅向已认证调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 按同一规则返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与相邻的 assistant-media 路由一致），因此头像路由无法在其他方面受保护的主机上泄露智能体身份。
- Control UI 在获取头像时将 Gateway 网关令牌作为 bearer 标头转发，并使用已认证的 blob URL，因此图片仍会在仪表盘中渲染。

如果你禁用 Gateway 网关认证（不建议在共享主机上这样做），头像路由也会变为未认证，与 Gateway 网关其余部分保持一致。

## 助手媒体路由认证

配置 Gateway 网关认证后，助手本地媒体预览会使用两步路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 要求正常的 Control UI 操作员认证；浏览器在检查可用性时会将 Gateway 网关令牌作为 bearer 标头发送。
- 成功的元数据响应包含一个短期 `mediaTicket`，其权限范围限定为该确切源路径。
- 浏览器渲染的图片、音频、视频和文档 URL 使用 `mediaTicket=<ticket>`，而不是当前 Gateway 网关令牌或密码。该票据会很快过期，并且不能授权其他源。

这让媒体渲染能够兼容浏览器原生媒体元素，同时避免把可复用的 Gateway 网关凭据放入可见的媒体 URL 中。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件：

```bash
pnpm ui:build
```

可选绝对基路径（固定资源 URL）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本地开发（单独的开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 空白 Control UI 页面

如果浏览器加载空白仪表盘且 DevTools 没有显示有用错误，某个扩展或早期内容脚本可能阻止了 JavaScript 模块应用执行。静态页面包含一个纯 HTML 恢复面板，当 `<openclaw-app>` 在启动后未注册时会显示。

更改浏览器环境后，使用面板的**重试**操作，或在完成以下检查后手动重新加载：

- 禁用会注入所有页面的扩展，尤其是带有 `<all_urls>` 内容脚本的扩展。
- 尝试使用隐私窗口、干净的浏览器配置文件或其他浏览器。
- 保持 Gateway 网关运行，并在更改浏览器后验证同一个仪表盘 URL。

## 调试/测试：开发服务器 + 远程 Gateway 网关

Control UI 是静态文件；WebSocket 目标可配置，并且可以不同于 HTTP 来源。当你想在本地使用 Vite 开发服务器、但 Gateway 网关在其他位置运行时，这很方便。

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
  <Accordion title="说明">
    - `gatewayUrl` 会在加载后存储在 localStorage 中，并从 URL 中移除。
    - 如果你通过 `gatewayUrl` 传入完整的 `ws://` 或 `wss://` 端点，请对该值进行 URL 编码，以便浏览器正确解析查询字符串。
    - 应尽可能通过 URL 片段（`#token=...`）传入 `token`。片段不会发送到服务器，这可以避免请求日志和 Referer 泄漏。旧版 `?token=` 查询参数仍会为了兼容性导入一次，但仅作为回退，并且会在引导完成后立即移除。
    - `password` 仅保存在内存中。
    - 设置 `gatewayUrl` 后，UI 不会回退到配置或环境凭证。请显式提供 `token`（或 `password`）；缺少显式凭证会报错。
    - 当 Gateway 网关位于 TLS 后方时（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。
    - `gatewayUrl` 仅在顶层窗口中接受（不可嵌入），以防止点击劫持。
    - 公共非 local loopback 的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整源）。来自 loopback、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主机的私有同源 LAN/Tailnet 加载无需启用 Host-header 回退即可接受。
    - Gateway 网关启动时可能会根据有效运行时绑定和端口填充本地源，例如 `http://localhost:<port>` 和 `http://127.0.0.1:<port>`，但远程浏览器源仍需要显式条目。
    - 除非用于严格受控的本地测试，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`；它表示允许任何浏览器源，而不是“匹配我正在使用的任何主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host-header 源回退模式，但这是一种危险的安全模式。

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
