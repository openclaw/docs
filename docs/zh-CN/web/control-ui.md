---
read_when:
    - 你想从浏览器操作 Gateway 网关
    - 你希望无需 SSH 隧道即可通过 Tailnet 访问
sidebarTitle: Control UI
summary: Gateway 网关的浏览器端 Control UI（聊天、活动、节点、配置）
title: Control UI
x-i18n:
    generated_at: "2026-07-14T13:59:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 4974d8b0e6f2db068632b2aa31c3712d6a86d52516653f2c311c6cdf856e8989
    source_path: web/control-ui.md
    workflow: 16
---

Control UI 是一个由 Gateway 网关提供服务的小型 **Vite + Lit** 单页应用：

- 默认值：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它通过同一端口**直接连接 Gateway 网关 WebSocket**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台计算机上，请打开 [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）。

如果页面加载失败，请先启动 Gateway 网关：`openclaw gateway`。

<Note>
在原生 Windows LAN 绑定中，即使 `127.0.0.1` 可在 Gateway 网关主机上正常工作，Windows 防火墙或组织管理的组策略仍可能阻止所公布的 LAN URL。在 Windows 主机上运行 `openclaw gateway status --deep`；它会报告可能被阻止的端口、配置文件不匹配，以及策略可能忽略的本地防火墙规则。
</Note>

身份验证在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用受信任代理身份标头

仪表板设置面板会为当前浏览器标签页会话和所选 Gateway 网关 URL 保留令牌；密码不会持久化。新手引导通常会在首次连接时生成用于共享密钥身份验证的 Gateway 网关令牌，但当 `gateway.auth.mode` 为 `"password"` 时，也可使用密码身份验证。

## 设备配对（首次连接）

从新浏览器或设备连接通常需要进行**一次性配对审批**，显示为 `disconnected (1008): pairing required`。

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

如果浏览器使用已更改的身份验证详情（角色/权限范围/公钥）重试配对，之前的待处理请求将被取代，并创建新的 `requestId`；请在批准前重新运行 `openclaw devices list`。

将已配对浏览器从读取权限切换为写入/管理员权限会被视为审批升级，而不是静默重新连接：OpenClaw 会保持旧审批有效、阻止权限更广的重新连接，并要求你明确批准新的权限范围集合。

批准后，系统会记住该设备；除非使用 `openclaw devices revoke --device <id> --role <role>` 将其撤销，否则无需再次批准。有关令牌轮换、撤销以及 Paperclip / `openclaw_gateway` 首次运行审批流程，请参阅[设备 CLI](/zh-CN/cli/devices)。

<Note>
- 直接通过 local loopback 的浏览器连接（`127.0.0.1` / `localhost`）会自动获批。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份验证通过且浏览器提供其设备身份时，Tailscale Serve 可跳过 Control UI 操作员会话的配对往返过程。没有设备身份的浏览器和节点角色连接仍会执行常规设备检查。
- 直接 Tailnet 绑定、LAN 浏览器连接以及没有设备身份的浏览器配置文件仍需明确批准。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据后需要重新配对。

</Note>

## 配对移动设备

已配对的管理员无需打开终端即可创建 iOS/Android 连接二维码：

<Steps>
  <Step title="打开移动设备配对">
    选择 **设备**，然后点击 **设备** 卡片中的 **配对移动设备**。
  </Step>
  <Step title="连接手机">
    在 OpenClaw 移动应用中，打开 **设置** → **Gateway 网关** 并扫描二维码。也可以改为复制并粘贴设置代码。
  </Step>
  <Step title="确认连接">
    官方 iOS/Android 应用会自动连接。如果 **待批准** 显示了请求，请在批准前检查其角色和权限范围。
  </Step>
</Steps>

创建设置代码需要 `operator.admin`；没有该权限的会话中，此按钮会被禁用。设置代码包含短期有效的引导凭据，因此在二维码和复制的代码有效期间，应像对待密码一样保护它们。进行远程配对时，Gateway 网关必须解析为 `wss://`（例如通过 Tailscale Serve/Funnel）；普通的 `ws://` 仅限 local loopback 和私有 LAN 地址。有关完整的安全和回退详情，请参阅[配对](/zh-CN/channels/pairing#pair-from-the-control-ui-recommended)。

## 个人身份（浏览器本地）

Control UI 支持为每个浏览器设置个人身份（显示名称和头像），并将其附加到传出的消息中，以便在共享会话中注明归属。该身份存储在浏览器中，作用域限定为当前浏览器配置文件，不会同步到其他设备，也不会在服务器端持久化，但你发送的消息所含常规对话记录作者元数据除外。清除站点数据或切换浏览器会将其重置为空。

智能体头像覆盖项采用相同的浏览器本地模式：上传的覆盖项会在本地覆盖由 Gateway 网关解析的身份，且绝不会通过 `config.patch` 往返传输。共享的 `ui.assistant.avatar` 配置字段仍可供直接写入该字段的非 UI 客户端使用。

## 运行时配置端点

Control UI 从 `/control-ui-config.json` 获取其运行时设置，该路径相对于 Gateway 网关的 Control UI 基础路径解析（例如，基础路径为 `/__openclaw__/` 时使用 `/__openclaw__/control-ui-config.json`）。该端点受到与 HTTP 表面其余部分相同的 Gateway 网关身份验证保护：未经身份验证的浏览器无法获取该端点，成功获取需要有效的 Gateway 网关令牌/密码、Tailscale Serve 身份或受信任代理身份。

## Gateway 网关主机状态

在简单视图中打开 **设置**，即可查看 **Gateway 网关主机** 卡片，其中包含 Gateway 网关计算机、LAN 地址、操作系统、运行时、运行时间、CPU 负载、内存和状态卷磁盘空间。此卡片可见时，每 10 秒通过 `system.info` Gateway RPC 刷新一次，该 RPC 需要 `operator.read` 权限范围。旧版 Gateway 网关以及没有该权限范围的连接不会显示此卡片。

## 语言支持

Control UI 首次加载时会根据浏览器区域设置自行本地化。若要稍后覆盖此设置，请打开 **Settings -> General -> Language**（选择器位于 General 快速设置卡片中，而不在 Appearance 下）。

- 支持的区域设置：`en`、`ar`、`de`、`es`、`fa`、`fr`、`hi`、`id`、`it`、`ja-JP`、`ko`、`nl`、`pl`、`pt-BR`、`ru`、`th`、`tr`、`uk`、`vi`、`zh-CN`、`zh-TW`
- 非英语翻译会在浏览器中延迟加载。
- 所选区域设置会保存在浏览器存储中，并在以后访问时复用。
- 缺失的翻译键会回退到英语。

文档翻译会针对同一组非英语区域设置生成，但文档站点内置的 Mintlify 语言选择器只列出 Mintlify 接受的区域设置代码。泰语（`th`）和波斯语（`fa`）文档仍会在发布仓库中生成；在 Mintlify 支持这些代码之前，它们可能不会出现在该选择器中。

## 外观主题

外观面板包含内置的 Claw、Knot 和 Dash 主题（默认为 Claw），另有一个浏览器本地 tweakcn 导入槽位。要导入主题，请打开 [tweakcn 编辑器](https://tweakcn.com/editor/theme)，选择或创建主题，点击 **Share**，然后将复制的链接粘贴到外观面板中。导入器还接受 `https://tweakcn.com/r/themes/<id>` 注册表 URL、类似 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 的编辑器 URL、相对 `/themes/<id>` 路径、原始主题 ID，以及 `amethyst-haze` 等默认主题名称。

导入的主题仅存储在当前浏览器配置文件中；不会写入 Gateway 网关配置，也不会跨设备同步。替换导入的主题会更新这一个本地槽位；如果导入的主题处于启用状态，清除后会切换回 Claw。

外观面板还提供浏览器本地的文本大小设置，该设置与 Control UI 的其他偏好设置一同存储。它适用于聊天文本、编辑器文本、工具卡片和聊天侧边栏，并确保文本输入框的字号至少为 16px，以防移动版 Safari 在聚焦时自动缩放。

## 管理插件

打开侧边栏中的 **插件**，或使用相对于
所配置 Control UI 基础路径的 `/settings/plugins`，即可在不离开
Control UI 的情况下浏览和管理插件。例如，基础路径 `/openclaw`
使用 `/openclaw/settings/plugins`。即使所有可选插件均被禁用，该页面也始终
可用。

插件页面是一个包含四个标签页的中心：**已安装** 和 **发现** 在
`/settings/plugins` 管理插件代码，**Skills** 在 `/skills`
提供按智能体管理的技能管理器，**工作坊** 在 `/skills/workshop`
提供 Skill Workshop 提案审核。每个标签页都有自己的 URL，侧边栏则为
所有这些标签页显示单一的插件入口。

**已安装** 标签页按类别分组显示完整的本地清单，并提供概览计数。
每一行都可打开详情视图；其溢出（`…`）菜单可启用
或禁用插件，并为外部安装的插件提供 **移除**。该页面还会列出已配置的
[MCP 服务器](/zh-CN/cli/mcp)，并支持内联添加、禁用和移除。**发现**
标签页是商店：其中包含 OpenClaw 内置的精选插件、官方外部插件，
以及适用于热门服务的一键式 MCP 连接器。在搜索框中输入内容会内联查询
[ClawHub](https://clawhub.ai/plugins)，并追加一个 **来自 ClawHub**
分区，其中包含下载次数和来源验证徽章。深层链接可使用
`/settings/plugins?tab=discover` 直接指向商店。

**Skills** 标签页保留技能状态报告、启用/禁用开关、API
密钥输入和内联 ClawHub 技能搜索，其作用域限定为所选智能体。
**工作坊** 标签页保留 Skill Workshop 看板和今日
[技能提案](/zh-CN/tools/skill-workshop)审核流程。**查找技能创意** 会按从新到旧的顺序审核
数量有限且内容充分的会话窗口，并将所有结果保留为待处理提案。面板会显示累计覆盖情况；**扫描更早的工作**
会从持久化游标处继续，然后在较早的历史记录全部扫描完毕后变为 **扫描新工作**。
禁用自主自我学习时仍可进行手动历史记录审核，并使用所选智能体配置的模型。

内置插件已存在于 Gateway 网关上，并显示 **启用** 或
**禁用**，而非 **安装**。例如，Workboard 内置于
OpenClaw 中，但默认处于禁用状态，因此其操作是 **启用**。内置插件
无法移除，只能禁用。

读取目录和搜索 ClawHub 需要 `operator.read`。安装、
启用、禁用或移除插件以及更改 MCP 服务器需要
`operator.admin`；对于只读操作员，这些操作会保持禁用状态。

ClawHub 安装通过 Gateway 网关运行，并沿用其他由 Gateway 网关中介的安装所采用的
相同信任、完整性和插件安装策略检查。安装
或移除插件代码需要重启 Gateway 网关。当插件和当前
Gateway 网关运行时支持时，启用或禁用已安装的插件无需重启即可生效；
否则，UI 会报告需要重启。使用 OAuth 的 MCP 连接器在添加后需要通过 CLI
执行一次 `openclaw mcp login <name>`。

该页面特意专注于清单、发现、安装、启用
和移除。对于任意 npm、git 或
本地路径来源、更新以及高级插件配置，请使用 [`openclaw plugins`](/zh-CN/cli/plugins)。

## 侧边栏导航

侧边栏将导航固定在可滚动的会话列表上方。在多 Agent 设置中，每个 Agent 都显示为可折叠的顶级区段；展开某个 Agent 可浏览其会话，而无需离开当前打开的聊天，折叠的 Agent 会显示未读指示器。在一个 Agent 内，列表分为 **已固定**、每个已连接渠道（Telegram、Slack、WhatsApp 等）对应的内置区段、用于绑定到托管工作树或 Exec 节点的会话的内置 **工作** 区段（行中显示 `repo ⎇ branch` 行及节点主机）、自定义组（会话 `category`），以及容纳其余会话的 **聊天**。渠道和工作区段会自动对行进行分类；将会话分配到自定义组始终具有最高优先级。打开会话时，选择高亮会随之移动，但不会重新排列各行。自上次读取后出现新活动的会话会显示未读圆点，打开后即标记为已读。每个会话行都有一个上下文菜单（烤肉串按钮或右键单击），其中包含固定/取消固定、标记为未读/已读、重命名、派生、移至组（包括新建组和从组中移除）、归档和删除；触控布局会始终显示直接固定按钮和菜单控件。按住 Cmd/Ctrl 单击可切换行的多选状态，按住 Shift 单击可按当前可见顺序扩展选择；随后在已选行上打开菜单，会提供批量操作（将 N 个标记为未读/已读、将 N 个移至组、归档 N 个、删除 N 个），并应用于所有已选会话；批量删除只需确认一次。将会话拖到自定义组或 **聊天** 即可移动。自定义组标题可折叠、展开或通过拖动重新排序；组名及其顺序保存在 Gateway 网关中（`sessions.groups.*`），因此可跨浏览器同步，而折叠状态保存在浏览器配置文件中。组标题也有一个菜单（烤肉串按钮或右键单击），其中包含重命名组、新建组和删除组；重命名或删除组会在服务器端更新其所有成员会话，包括已归档的会话；删除组会保留其中的会话，并将其移回聊天。会话列表标题中的唯一 **+** 会打开新建会话页面（见下文）。排序控件还提供“分组方式”切换项：分组（默认）或无，以显示单个扁平列表（已固定仍单独显示）；该选择保存在当前浏览器配置文件中。**用量**、**自动化**和**插件**默认固定；**更多**行会打开一个包含其他所有目标位置的菜单，其中包括插件提供的标签页。在该菜单中选择 **编辑固定项目**，或右键单击导航区域，即可固定或取消固定目标位置，并恢复默认设置。固定项目集保存在当前浏览器配置文件中，并在重新加载后继续保留。

## 新建会话页面

侧边栏会话列表标题中的 **+** 会在 `/new` 打开全页面草稿：在发送第一条消息之前不会创建任何内容。消息框上方的目标行用于选择会话的工作位置：Agent（多 Agent 设置）、Exec 的运行位置（**Gateway 网关 · 本地**，或公开 `system.run` 的已配对节点；需要 `operator.admin`）、文件夹（默认为 Agent 工作区；其他 Gateway 网关绝对路径需要 `operator.admin` 和工作树），以及可选的 **工作树** 开关和基础分支选择器（由 `worktrees.branches` 提供支持，因此不会执行 fetch），还可指定工作树名称（分支将变为 `openclaw/<name>`）。文件夹标签上的浏览按钮会打开一个内联目录选择器，由仅限管理员使用的 `fs.listDir` 方法提供支持。其顶层会显示 Gateway 网关和所有已知节点；离线节点以及不支持目录浏览的节点仍会显示，但处于禁用状态。选择 Gateway 网关后，会从当前文件夹或 Gateway 网关主目录开始浏览。选择具备相应能力的节点后，会浏览该节点的主机文件系统，将 Exec 绑定到该节点，并直接使用所选节点的绝对路径（托管工作树仍仅限 Gateway 网关）。提交时会使用第一条消息调用 `sessions.create`，因此运行会在同一次往返中启动，UI 也会跳转到新会话的聊天。如果 Gateway 网关创建了会话，但拒绝发送第一条消息，聊天会在重新加载后保留提示词和错误；**重试**会通过已创建的会话发送消息，而不会再创建一个会话。

在 **设置** 中，专用侧边栏顶部提供 **搜索设置** 字段，用于快速查找设置区段。

侧边栏顶部的 **搜索** 字段会打开命令面板（⌘K）。单击侧边栏标题中的 OpenClaw 品牌标识，会打开简洁的新建会话起始屏幕。当有事项需要处理时——例如失败或逾期的 cron 作业、即将过期或已经过期的模型身份验证——侧边栏页脚上方会显示紧凑的提醒标签，单击后会跳转到负责该事项的页面。页脚以标签形式显示当前 Agent，包括头像（身份图像或表情符号）、名称、连接状态圆点和实时副标题，并提供用于新建会话的 **+**。单击该标签会打开 Agent 菜单，其中包含 Agent 切换器（多 Agent 设置）、“此 Agent 能做什么？”、**Agent 设置**、**设置**、移动端配对、**文档**、构建标签和颜色模式切换项。Agent 名单超过十个时会显示筛选字段，并优先列出已固定的 Agent；可在智能体设置页面固定或取消固定 Agent，固定项目集保存在浏览器配置文件中。选择 Agent 后，聊天、用量、自动化、任务、Workboard 和会话的范围都会限定到该 Agent。每个限定范围的页面都提供 **Agent** 控件，并可通过 **所有 Agent** 退出限定范围；这会扩大共享页面的范围，但不会更改具体的聊天 Agent，而直接会话链接仍会打开其目标会话。智能体设置页面会保留自己的 `?agent=` 选择，不会跟随共享页面范围。当 Gateway 网关从源代码检出目录中运行，且所在分支不是 `main` 时，页脚还会以红色显示该分支名称，以便一眼看出这是非发布版 Gateway 网关（发布版安装永远不会显示）。按 Shift-Command-Comma 可打开 **设置**，且不会覆盖浏览器的 Command-Comma 快捷键。侧边栏标题中还包含折叠开关（⌘B）；折叠后会完全隐藏侧边栏，提供全宽工作区，使用浮动展开控件（或 ⌘B）可将其恢复；在 macOS 应用中，该开关改由标题栏原生承载。侧边栏是桌面端唯一的导航框架，不设顶部栏。较窄的视口会将侧边栏替换为滑出式抽屉，并显示紧凑的标题行，其中包含抽屉开关、品牌标识和命令面板搜索；在 macOS 应用中，该标题行会将标题栏留白整合为窗口控件旁的一条紧凑栏。导航使用常规浏览器历史记录，因此可通过浏览器的后退/前进按钮进行切换；macOS 应用还会在窗口控件旁添加原生侧边栏开关并支持触控板轻扫手势，侧边栏展开时，其右侧边缘会显示后退/前进按钮；侧边栏折叠时，则会显示原生搜索（命令面板）和新建会话按钮。

## 当前功能

<AccordionGroup>
  <Accordion title="聊天与 Talk">
    - 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 刷新聊天历史记录时，会请求一个有界的近期窗口，并限制每条消息的文本长度，因此大型会话不会迫使浏览器在聊天可用前渲染完整的会话记录负载。
    - 将鼠标悬停在公开 GitHub Issue 或拉取请求链接上，或使用键盘将焦点移至该链接时，会显示其状态、标题、作者、近期活动、评论和变更统计信息。已连接的 Gateway 网关会获取并缓存公开元数据，且不会更改链接目标；UI 使用远程 Gateway 网关时也是如此。Gateway 网关会先确认仓库是公开的，然后在可用时使用 `GH_TOKEN` 或 `GITHUB_TOKEN`；否则，它会使用 GitHub 的匿名 API，并采用更长的缓存时间。
    - 通过浏览器实时会话进行 Talk。OpenAI 使用直接 WebRTC，Google Live 通过 WebSocket 使用受限的一次性浏览器令牌，而仅限后端的实时语音插件则使用 Gateway 网关中继传输。客户端所有的提供商会话通过 `talk.client.create` 启动；Gateway 网关中继会话通过 `talk.session.create` 启动。中继会将提供商凭据保留在 Gateway 网关上，同时浏览器通过 `talk.session.appendAudio` 流式传输麦克风 PCM；中继还会通过 `talk.client.toolCall` 转发 `openclaw_agent_consult` 提供商工具调用，以应用 Gateway 网关策略并使用配置的更大 OpenClaw 模型，同时通过 `talk.client.steer` 或 `talk.session.steer` 路由活动运行中的语音引导。
    - 在聊天中流式显示工具调用和实时工具输出卡片（Agent 事件）。工具活动会呈现为按类型区分的行：shell 命令会显示带语法高亮的命令和终端风格输出；受支持的编辑和写入调用会显示有界的内联 Diffs、可用时显示行号，以及 `+added -removed` 统计信息；连续调用会折叠为类似“运行了 13 条命令，读取了 6 个文件，编辑了 9 个文件”的摘要。运行进行期间，最新的运行中调用名称会作为组标题。展开某一行可检查其余参数和原始输出。
    - 复杂工具调用（较长的 shell 命令、参数较多的插件工具）可选择使用 AI 生成的用途标题，通过 `gateway.controlUi.toolTitles: true` 启用（默认关闭）。标题由批处理的 `chat.toolTitles` 方法通过标准实用模型路由生成——优先使用显式配置的 `utilityModel`（由操作员选择的提供商，与其他实用任务相同），否则使用会话提供商声明的默认小模型——并按 Agent 缓存在 Gateway 网关端。如果未启用此选项，或没有可用的低成本模型，各行会保留其确定性标签，并且不会进行模型调用。
    - 启动或忽略模型临时建议的后续任务；接受建议后，会使用建议的提示词打开一个新的托管工作树会话。
    - 活动标签页使用浏览器本地、优先脱敏的摘要，显示由现有 `session.tool` / 工具事件传递的实时工具活动。

  </Accordion>
  <Accordion title="渠道、会话、记忆">
    - 渠道：内置渠道以及内置/外部插件渠道的状态、二维码登录和各渠道配置（`channels.status`、`web.login.*`、`config.patch`）。
    - 渠道探测刷新会在较慢的提供商检查完成期间继续显示之前的快照，并在探测或审计超过其 UI 时间预算时标记部分快照。
    - 会话（**智能体和工具**下的设置页面，`/settings/sessions`）：默认列出已配置智能体的会话，可固定常用会话、重命名会话、归档或恢复非活跃会话、从已失效的未配置智能体会话键回退，以及应用每个会话的模型/思考/快速/详细/跟踪/推理覆盖设置（`sessions.list`、`sessions.patch`）。已固定会话排在最近的未固定会话之前；已归档会话位于会话页面的归档视图中，并保留其对话记录。对于自上次读取后有活动的会话，相应行会显示未读圆点，并提供标记为未读/标记为已读操作（`sessions.patch { unread }`）；还提供分叉操作，可将对话记录分支到新会话中（`sessions.create { parentSessionKey, fork: true }`）。表格上方的概览卡片汇总已加载的列表（会话数、实时运行数、未读会话数、Token 总数）；每行带有类型图标和实时运行圆点，状态以普通圆点加标签呈现；当会话报告 Token 数和上下文大小时，Token 列会显示上下文窗口使用量计量条。行管理操作位于每行的菜单中（竖向三点按钮或右键单击），与侧边栏的会话菜单一致；行抽屉除其他会话详情外，还会显示智能体运行时和运行时长。
    - 会话分组：分组依据控件可按自定义组、渠道、类型、智能体或日期将会话表格整理为多个分区。自定义组通过 `sessions.patch` 按会话持久保存（`category`），因此从消息渠道（Discord、Telegram、WhatsApp 等）启动的会话也可以分类；可通过将行拖到某个分区，或使用每行的组选择器来分配组，并通过新建组操作创建组。
    - 记忆（智能体页面上的一个选项卡，作用域为所选智能体）：Dreaming 状态、启用/禁用开关和梦境日记阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。
    - 导入记忆（**智能体和工具**下的设置页面，`/settings/memory-import`）：预览本地 Codex 整合记忆或 Claude Code 自动记忆，并将其复制到所选 Agent 工作区（`migrations.memory.plan`、`migrations.memory.apply`）。

  </Accordion>
  <Accordion title="Cron、任务、插件、Skills、设备、Exec 审批">
    - 自动化（cron 作业）：自动化/运行历史记录选项卡切换器上方显示统计卡片（自动化数量、失败数量、调度器状态、下次唤醒时间）；自动化选项卡在可筛选表格中列出作业（全部/活跃/已暂停、搜索、计划和上次运行筛选器、每行操作菜单），下方提供入门建议；运行历史记录选项卡显示所有自动化最近的运行记录（`cron.*`）。
    - 任务：实时显示活跃和最近后台任务的台账，并包含关联会话和取消功能（`tasks.*`）。
    - 插件：浏览已安装清单和精选商店、搜索 ClawHub、安装和移除插件代码，以及启用或禁用已安装的插件（`plugins.*`）；MCP 服务器行通过配置方法编辑 `mcp.servers`。
    - Skills：状态、启用/禁用、安装、API key 更新（`skills.*`）。
    - 设备：一个清单整合已配对设备记录、节点目录和实时在线状态（`device.pair.list`、`node.list`、`system-presence`）。Gateway 网关主机固定显示在首位；已配对客户端显示连接状态、角色、Token、能力和命令。重复配对项会折叠为可展开的组，**清理 N 个过期项**会批量移除经管理员确认已离线、曾自动批准（无提示的本地、受信任 CIDR 或经 SSH 验证）或早于审批来源记录的重复项。可以移除条目（`node.pair.remove`、`device.pair.remove`），可以内联处理设备配对和节点重新审批（`device.pair.*`、`node.pair.approve`/`reject`），还可以通过同一卡片创建移动端设置代码。
    - Exec 审批：编辑 Gateway 网关或节点的允许列表，以及 `exec host=gateway/node` 的询问策略（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 智能体：一个设置页面（**设置 → 智能体**，`/settings/agents`），包含每个智能体的选项卡（概览、文件、工具、Skills、渠道、自动化、记忆）。概览选项卡用于编辑智能体的身份信息——显示名称、表情符号和头像图片；在 `agents.update` 之前，浏览器会缩小头像并限制其大小。保存操作会存储已配置的身份字段，并将其同步到工作区 `IDENTITY.md`；对于同一文件字段，配置值优先于手动编辑的值。
    - 个人资料：一个设置页面，显示默认智能体的身份信息和全时段使用统计数据——生命周期 Token 数、峰值日期、最长会话、连续活跃记录、全年 Token 热力图、常用工具和渠道亮点（`usage.cost`、`sessions.usage`）。
    - MCP 有专用的设置页面，其中包含只读服务器行（传输方式、启用状态、OAuth/筛选器/并行摘要）、常用操作员命令和限定作用域的 `mcp` 配置编辑器；服务器的添加、启用/禁用和移除操作在插件页面进行。
    - 模型提供商：一个设置页面，列出所有已配置的模型提供商及其品牌图标、身份验证状态（`models.authStatus`）、模型可用性（`models.list`）、提供商所报告的实时方案/配额/计费数据（`usage.status`），以及过去 30 天的本地会话支出（`sessions.usage`）。刷新操作会重新读取凭据状态和提供商用量。
    - 连接：一个设置页面（位于**连接**下），负责仪表盘自身的 Gateway 网关连接——WebSocket URL、Gateway 网关 Token、密码和默认会话键——并显示最新的握手快照（状态、运行时间、tick 间隔、上次渠道刷新时间）。离线登录关卡用于处理断开连接的情况；此页面用于在已连接时编辑连接。
    - 经过验证后应用并重启（`config.apply`），然后唤醒上次活跃的会话。
    - 写入操作包含基础哈希保护，以防覆盖并发编辑。
    - 写入操作（`config.set`/`config.apply`/`config.patch`）会预检所提交配置载荷中引用项的活跃 SecretRef 解析；未解析的活跃已提交引用项会在写入前被拒绝。
    - 表单保存时会丢弃无法从已保存配置中恢复的过期脱敏占位符，同时保留仍映射到已保存密钥的脱敏值。
    - Schema 和表单渲染来自 `config.schema` / `config.schema.lookup`，包括字段 `title`/`description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及可用时的插件和渠道 Schema。仅当快照能够安全地进行原始数据往返转换时，原始 JSON 编辑器才可用；否则 Control UI 会强制使用表单模式。
    - 原始 JSON 编辑器的“重置为已保存内容”会保留以原始方式编写的结构（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此在快照能够安全往返转换时，外部编辑可以在重置后保留下来。
    - 结构化 SecretRef 对象值在表单文本输入框中以只读方式呈现，以防对象意外损坏为字符串。

  </Accordion>
  <Accordion title="用量">
    - 基于会话的 Token 和预估成本分析与提供商计费保持分离。
    - 提供商卡片调用 `usage.status`，并显示已配置提供商插件所报告的实时方案名称、配额周期、余额、支出和预算。
    - 提供商用量获取失败不会阻塞会话/成本仪表盘；不可用的提供商卡片会显示各自的错误状态。

  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态/健康/模型快照、事件日志和手动 RPC 调用（`status`、`health`、`models.list`）。
    - 事件日志包含 Control UI 刷新/RPC 耗时、缓慢的聊天/配置渲染耗时，以及当浏览器公开相应 PerformanceObserver 条目类型时，针对长动画帧或长任务的浏览器响应性条目。
    - 日志：实时跟踪 Gateway 网关文件日志，并支持筛选/导出（`logs.tail`）。
    - 更新：运行软件包/git 更新并重启（`update.run`），附带重启报告；重新连接后轮询 `update.status`，以验证正在运行的 Gateway 网关版本。

  </Accordion>
  <Accordion title="自动化面板说明">
    - 选择一行会打开整页详情视图，页眉中包含活跃/已暂停开关和立即运行（其菜单中包含到期时运行、克隆和移除）；设置选项卡可内联编辑自动化（提示词、详情、频率、高级覆盖设置），运行历史记录选项卡则显示该自动化的运行记录。
    - 表格下方的自动化入门项会使用可编辑的提示词和计划预填创建表单。
    - 对于隔离任务，交付方式默认为发布摘要；仅供内部运行时切换为无。
    - 选择发布时会显示渠道/目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
    - 对于主会话任务，可以使用 webhook 和无交付模式。
    - 高级编辑控件包括运行后删除、清除智能体覆盖设置、cron 精确/错峰选项、智能体模型/思考覆盖设置，以及尽力交付开关。
    - 表单验证以内联形式显示字段级错误；无效值会禁用保存按钮，直至修正。
    - 设置 `cron.webhookToken` 以发送专用 bearer Token；如果省略，则发送 webhook 时不包含身份验证标头。
    - `cron.webhook` 是已弃用的旧版回退机制：运行 `openclaw doctor --fix`，将仍使用 `notify: true` 的已存储作业迁移为明确的每作业 webhook 或完成交付。

  </Accordion>
</AccordionGroup>

## 导入智能体记忆

打开**设置** → **导入记忆**，将本地 Codex 或 Claude Code 记忆导入
OpenClaw 智能体。Gateway 网关会自行发现其所在主机上支持的本地记忆，
因此远程 Control UI 会从 Gateway 网关所在计算机导入，而不是从
浏览器所在计算机导入。

1. 选择目标智能体。
2. 检查检测到的源集合和 Markdown 文件名。文件内容
   不会在计划响应中发送，也不会显示在页面上。
3. 选择要导入的集合并确认。应用操作会在写入前重新构建计划，
   以便过期选择安全地失败。
4. 如果文件已存在，请启用**替换现有导入内容**，刷新
   预览，然后确认替换。

Codex 仅导入其整合后的 `MEMORY.md` 和 `memory_summary.md`。Claude
Code 会从项目自动记忆目录和已配置的
`autoMemoryDirectory` 导入 Markdown；它不会通过此页面导入会话、设置、指令或
凭据。文件会复制到所选工作区的 `memory/imports/` 下，
活跃的记忆插件可以在此为其建立索引。源文件
绝不会被更改。

规划和应用需要 `operator.admin`。只要存在状态，每次应用都会创建经过验证的
OpenClaw 备份、写入经过脱敏的迁移报告，并在替换现有目标文件前保留
项目级备份。有关路径和
回忆行为，请参阅[记忆概览](/zh-CN/concepts/memory#import-from-coding-assistants)。

## MCP 页面

专用的 MCP 页面是用于查看 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器的操作员视图。它本身不会启动 MCP 传输；可以使用它检查和编辑已保存的配置，需要实时服务器验证时再使用 `openclaw mcp doctor --probe`。

典型工作流：

1. 从侧边栏打开 **MCP**。
2. 检查摘要卡片中的服务器总数、已启用、OAuth 和已过滤服务器数量。
3. 检查每个服务器行中的传输、启用状态、身份验证、过滤器、超时和命令提示。
4. 在**插件**页面上管理服务器（添加、启用/禁用、移除）。该页面是 `mcp.servers` 唯一的交互式写入方；此处的行列表会链接到该页面。
5. 编辑限定范围的 `mcp` 配置部分，以设置服务器定义、请求头、TLS/mTLS 路径、OAuth 元数据、工具过滤器和 Codex 投影元数据。
6. 使用**保存**写入配置；如果需要让正在运行的 Gateway 网关应用更改后的配置，则使用**保存并发布**。
7. 从终端运行 `openclaw mcp status --verbose`、`openclaw mcp doctor --probe` 或 `openclaw mcp reload`，分别执行静态诊断、实时验证或清除缓存的运行时。

该页面会在渲染前对包含凭据的类 URL 值进行脱敏，并在命令片段中引用服务器名称，以确保复制的命令在名称包含空格或 shell 元字符时仍能正常运行。完整的 CLI 和配置参考：[MCP](/zh-CN/cli/mcp)。

## 活动选项卡

活动选项卡位于**设置 › 系统**中，紧邻日志和调试。它是一个临时的浏览器本地实时工具活动观察器，数据来自为聊天工具卡片提供支持的同一个 Gateway 网关 `session.tool` / 工具事件流。它不会添加其他 Gateway 网关事件系列、端点、持久活动存储、指标数据源或外部观察器流。

活动条目仅保留经过净化的摘要以及经过脱敏和截断的输出预览。工具参数值不会存储在活动状态中；UI 会显示参数已隐藏，并且只记录参数字段数量。内存中的列表随当前浏览器选项卡存在，在 Control UI 内导航时保留，并在页面重新加载、切换会话或点击**清除**时重置。

## 操作员终端

可停靠的操作员终端默认禁用。要启用它，请设置 `gateway.terminal.enabled: true` 并重启 Gateway 网关。终端需要 `operator.admin` 连接，并在活动 Agent 工作区中打开主机 PTY。新选项卡跟随当前选定的聊天智能体。

<Warning>
终端是一个不受限制的主机 shell，并继承 Gateway 网关进程环境。请仅在可信的操作员部署中启用它。OpenClaw 会拒绝为使用 `sandbox.mode: "all"` 的智能体创建终端会话；将活动智能体切换到该模式会关闭其现有和正在处理的终端会话。
</Warning>

使用 **Ctrl + 反引号** 切换停靠面板。布局支持停靠在底部或右侧，可随浏览器视口调整大小，并可保留多个 shell 选项卡。有关 `gateway.terminal.enabled` 和可选的 `gateway.terminal.shell` 覆盖项，请参阅 [Gateway 配置](/zh-CN/gateway/configuration-reference#gateway)。

在会话侧边栏中发现的 Codex 和 Claude Code 会话可以在同一个终端面板内通过其原生 CLI 打开。在**设置 › 聊天**中，将 **Codex/Claude 会话打开方式**设置为**终端**，这样正常点击某一行时便会打开 `codex resume` 或 `claude --resume`；默认仍使用只读的 OpenClaw 查看器。行的右键菜单或三点菜单始终提供这两个选项；符合条件的会话还会在查看器标题栏中显示**在终端中打开**。

资格按会话和主机分别判定。Gateway 网关本地会话会在 Gateway 网关主机上启动由提供商负责的恢复命令。已配对节点上的会话会在所属节点上启动已加入允许列表的提供商命令，并且仅中继该 PTY 的输出、输入和调整大小事件；这不会暴露通用节点 shell，也不会接受浏览器提供的命令。未公布匹配的终端恢复命令的节点（包括不支持双工流式传输的嵌入式工作节点桥接器）仍可使用查看器，但会显示终端打开功能不可用。

会话在断开连接后仍会保留：页面重新加载、笔记本电脑休眠或网络短暂中断时，会话将在 Gateway 网关上分离而不是被终止；重新连接后，同一浏览器选项卡会重新附加，并重放最近的输出。已分离的会话会在 `gateway.terminal.detachedSessionTimeoutSeconds` 后终止（默认 300 秒；`0` 可恢复为断开连接时终止）。`terminal.list` 显示可附加的会话，`terminal.attach` 接管其中一个会话（类似 tmux 的接管），而 `terminal.text` 可在不附加的情况下以纯文本形式读取会话的最近输出，这是为智能体和工具提供的功能。

终端还可以通过 `/?view=terminal` 以全屏、仅包含终端的文档形式使用。iOS 和 Android 应用会将此页面嵌入其终端屏幕，并复用已存储的 Gateway 网关凭据；可用性受相同的 `gateway.terminal.enabled` 和 `operator.admin` 条件控制，当所连接的 Gateway 网关不提供终端时，该页面会显示通知。

## 浏览器面板

Control UI 提供了一个可停靠的浏览器面板，可在任何普通网页浏览器中呈现由 Gateway 网关控制的浏览器（即智能体通过[浏览器工具](/zh-CN/tools/browser-control)操控的同一个浏览器），无需原生 WebView。当连接的 Gateway 网关向 `operator.admin` 连接公布 `browser.request` 时，该面板就会出现；会话工作区栏中的地球按钮可切换其显示状态。该面板显示实时页面快照，并提供选项卡、可编辑的 URL 栏、后退/前进/重新加载以及在你的浏览器中打开功能；可停靠在右侧或底部，并将点击、滚轮滚动和基本键盘输入转发到远程页面。

两种捕获模式可为智能体打包页面上下文：

- **标注（铅笔）**：在页面上自由绘制标记。点击**发送到聊天**会将笔画合成到截图中，把图像附加到活动聊天编辑器，并预填一段提示词，其中描述页面 URL、标题以及每个标记区域，使智能体准确了解你圈出了哪些内容。
- **检查（指针）**：悬停时查看光标下的元素（选择器、无障碍名称、角色、尺寸）；点击后会通过同一个编辑器流程发送该元素的详细信息以及突出显示后的截图。检查、滚轮滚动以及后退/前进功能需要 `browser.evaluateEnabled`（默认启用）。

macOS 应用会为在仪表板中点击的链接保留其原生链接浏览器侧边栏；浏览器面板也可在其中使用，并且是在其他所有平台上标注页面的方式。

## 聊天行为

<AccordionGroup>
  <Accordion title="发送与历史记录语义">
    - `chat.send` 是**非阻塞式**的：它会立即通过 `{ runId, status: "started" }` 进行确认，响应则通过 `chat` 事件流式传输。受信任的 Control UI 客户端还可能收到可选的 ACK 计时元数据，用于本地诊断。
    - 聊天上传支持图片和非视频文件。图片保留原生图片路径；其他文件则存储为托管媒体，并在历史记录中显示为附件链接。
    - 使用相同的 `idempotencyKey` 重新发送时，运行期间返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
    - 为保障 UI 安全，`chat.history` 响应具有大小限制。当转录条目过大时，Gateway 网关可能截断过长的文本字段、省略庞大的元数据块，并用占位符（`[chat.history omitted: message too large]`）替换超大消息。
    - 当可见的助手消息在 `chat.history` 中被截断时，侧边阅读器可以根据需要，通过 `chat.message.get`，使用 `sessionKey`、必要时的活动 `agentId` 以及转录 `messageId`，按需获取完整的、经过显示规范化的转录条目。如果 Gateway 网关仍无法返回更多内容，阅读器会显示明确的不可用状态，而不是静默重复被截断的预览。
    - 助手生成的图片会持久化为托管媒体引用，并通过经过身份验证的 Gateway 网关媒体 URL 提供，因此重新加载时不依赖聊天历史记录响应中继续保留原始 base64 图片载荷。
    - 渲染 `chat.history` 时，Control UI 会从可见的助手文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），以及泄漏的 ASCII/全角模型控制令牌。如果助手条目的全部可见文本仅为精确的静默令牌 `NO_REPLY` / `no_reply` 或 Heartbeat 确认令牌 `HEARTBEAT_OK`，则会省略该条目。
    - 在发送进行期间以及最终刷新历史记录时，如果 `chat.history` 短暂返回较旧的快照，聊天视图会继续显示本地乐观添加的用户/助手消息；Gateway 网关历史记录追上后，规范转录将替换这些本地消息。
    - 实时 `chat` 事件表示交付状态，而 `chat.history` 则根据持久会话转录重建。工具最终事件结束后，Control UI 会重新加载历史记录，并仅合并一小段乐观添加的尾部内容；转录边界记录在 [WebChat](/zh-CN/web/webchat) 中。
    - `chat.inject` 会将助手备注附加到会话转录，并广播 `chat` 事件以仅更新 UI（不运行智能体，也不交付到渠道）。
    - 侧边栏按智能体分区以及已固定/渠道/工作/自定义/聊天分组，列出所有已加载的活动会话，并提供单一的“新建会话”操作来打开草稿对话框。打开可见行只会移动高亮。自定义分组可以折叠并通过拖动重新排序，会话可以拖放到某个分组或“聊天”中；分组名称和顺序通过 Gateway 网关同步，而折叠状态保留在浏览器中。新的仪表板会话会根据其第一条非命令消息异步生成一个简洁标题；明确指定的名称绝不会被替换。设置 `agents.defaults.utilityModel`（或 `agents.list[].utilityModel`）可将这次独立的模型调用路由到成本较低的模型。展开其他智能体分区可以浏览该智能体的会话，而无需离开当前打开的聊天。
    - 会话搜索位于命令面板中（⌘K，或侧边栏顶部的“搜索”字段）：输入查询后，它会在智能体之间遍历数量有限的匹配页面，过滤内部子会话/cron 行，并将可见的匹配项列在导航命令旁边。“会话”页面仍保留带筛选条件的完整可搜索列表。
    - 每个侧边栏行都保留直接固定入口，以及用于未读状态、重命名、派生、分组、归档和删除的完整上下文菜单。多选行（Cmd/Ctrl 单击，Shift 单击选择范围）会显示批量菜单，涵盖未读状态、分组、归档和删除；除非每个选中的会话都可归档，否则批量归档/删除保持禁用。活动运行和智能体的主会话无法归档。归档或删除当前选中的会话后，聊天会切回该智能体的主会话。
    - 在 macOS 应用中，OpenClaw 标志会使用窗口控件旁原本为空的原生标题栏区域，而不会占用侧边栏的一行。
    - 在桌面宽度下，聊天控件保持在一个紧凑行中，并在向下滚动转录时收起；向上滚动、返回顶部或到达底部时，控件会恢复显示。
    - 连续重复的纯文本消息会呈现为一个气泡，并带有数量徽标。包含图片、附件、工具输出或 Canvas 预览的消息不会折叠。
    - 当会话的检出目录位于 GitHub 仓库的非默认分支时，聊天视图会在编辑器上方固定拉取请求信息块：PR 编号、仓库、分支、差异计数、CI 状态胶囊，以及草稿/已合并/已关闭状态，每项均链接到该 PR。该行最多显示两个信息块——优先显示活动的（开放/草稿）PR——并通过“显示更多”按钮展开被折叠的已合并/已关闭历史记录。CI 状态胶囊会打开一个小型 CI 监控弹出框，其中包含已通过/失败/运行中/已跳过的检查数量，以及指向 PR 检查页面的链接。检测通过 `controlUi.sessionPullRequests` 在服务端运行，并在已设置时复用 Gateway 网关的 `GH_TOKEN`/`GITHUB_TOKEN`。触发 GitHub API 速率限制时，信息块会保留最后已知状态，并显示状态可能已过期的警告；关闭某个信息块会在当前浏览器配置文件中针对该会话将其隐藏。在任何 PR 存在之前，该行会显示分支本身——仓库、分支名称，以及相对于默认分支合并基点的差异 +/− 大小（包括已提交和未提交的工作）。推送的分支拥有可供比较的提交后，该行会添加“创建 PR”按钮，用于打开 GitHub 的新建拉取请求页面；在此之前，只要会话中存在已更改文件（已提交、未提交或未跟踪），仍会显示该行，但不显示按钮。当存在开放或草稿 PR 时，该行会自动隐藏。分支行仅来自本地 git，因此在 GitHub 受到速率限制时仍然可用，并会显示相同的状态过期警告，因为在限制重置之前，无法确信“未找到 PR”的结果。
    - 会话 Diffs 面板显示会话检出目录实际发生的更改：分支按钮（位于工作区栏标题、分栏标题或单栏聊天中的浮动按钮）会打开详情面板，按文件显示相对于检出目录默认分支合并基点的分支、未提交和未跟踪工作差异——包括状态点、重命名箭头、每个文件的 +/− 计数、可折叠文件，以及差异块之间的“N 行未修改”标记。Diffs 通过 `sessions.diff` Gateway 网关方法（`operator.read` 权限范围）在服务端计算；二进制文件和超大文件会降级为仅显示统计信息的条目，并且仅当已连接的 Gateway 网关声明 `sessions.diff` 时才显示该按钮。
    - 每个聊天窗格中的会话工作区栏会列出会话文件、项目文件和工件。默认停靠在窗格右侧；拖动其标题（或使用停靠按钮）可将其移到底部，该选择会存储在当前浏览器配置文件中。折叠后的栏完全不占空间：可使用 ⇧⌘B、分栏标题中的文件开关或单栏聊天中的浮动文件按钮重新打开（后两者都会显示已更改文件数量徽标）。独立的文件、工具和 Canvas 详情面板不受影响。
    - 点击聊天中的文件引用、展开的读取/编辑/写入工具卡片中的文件路径，或工作区栏中的文件行，会打开文件详情面板：基于 CodeMirror 的代码视图，具备语法高亮、行号、跳转到指定行、文件内搜索、复制操作和在外部编辑器中打开的菜单。当 Gateway 网关向 `operator.admin` 连接声明 `sessions.files.set` 时，面板会增加编辑模式，支持脏状态跟踪和 Cmd/Ctrl-S 保存；在当前浏览器标签页中，未保存的草稿会在文件、面板和会话导航后继续保留，直到明确保存或丢弃。保存操作基于 `sessions.files.get` 返回的内容哈希执行比较并交换：如果文件自加载后已在磁盘上发生更改（例如智能体仍在继续工作），面板会显示冲突通知，并提供“重新加载”（采用最新内容）和“覆盖”（保留本地编辑）操作。写入操作与读取操作使用相同的 fs-safe 工作区防护——路径限制、拒绝符号链接/硬链接，以及 256 KB UTF-8 上限——并且只能覆盖现有文件；编辑器绝不会创建或删除文件。
    - 每个聊天窗格中的后台任务栏会列出当前智能体的后台任务和子智能体（`tasks.list` 按智能体限定范围，并通过 `task` 事件保持实时更新）：运行中的工作会显示实时已用时计时器、工具使用次数、当前正在使用的工具以及停止控件；可折叠的已完成分区会补充运行时长；“查看转录”链接会在窗格中打开任务的子会话。可通过分栏标题中的活动开关或单栏聊天中的浮动活动按钮打开它——任务快照会预先加载，因此两者无需先打开任务栏即可显示运行中任务数量徽标。“任务”页面仍是完整的跨智能体记录。
    - 工作区栏、后台任务栏和详情面板会根据各自窗格的宽度而非窗口宽度进行调整：在窄窗格或紧凑窗口中，两种栏都显示为底部条带（侧边停靠控件会隐藏，直到窗格变宽；当只能容纳一列时，工作区栏优先占用侧边位置），详情面板则堆叠在线程下方，通过水平调整大小手柄调整，而不是与线程并排显示。手机尺寸的视口仍会以全屏方式打开详情面板。
    - 聊天标题中的模型和思考选择器会通过 `sessions.patch` 立即修补活动会话；它们是持久的会话覆盖设置，而不是仅对单次发送有效的选项。
    - **分栏视图：**从右上角的浮动开关行（位于会话 Diffs、后台任务和会话文件开关旁边）打开，然后将活动窗格向右或向下拆分，直到容纳尽可能多的窗格。每个窗格都有自己的会话、转录、编辑器和工具流。
    - 将会话从侧边栏拖入聊天，即可在窗格中打开。带动画效果的放置预览会在区域间平滑移动并标示结果——在新窗格将占据的精确半区上显示“拆分”，在整个窗格上显示“在此打开”——单栏模式也支持拖放。
    - 活动分栏窗格决定侧边栏选择和 URL。每个窗格都有自己的标题行，其中包含会话标题以及工作区栏、拆分和关闭控件；分隔线可以调整列和上下堆叠窗格的大小，浏览器会在本地存储布局，并在重新加载后保留。
    - 在窄屏幕上，分栏视图会保留布局，但只呈现活动窗格，包括带关闭控件的标题。
    - 如果在同一会话的模型选择器更改仍在保存时发送消息，编辑器会等待该会话修补完成，然后再调用 `chat.send`，以确保发送时使用所选模型。
    - 输入 `/new` 会创建并切换到与 New Chat 相同的全新仪表板会话，但有一种例外：当已配置 `session.dmScope: "main"`，且当前父会话是智能体的主会话时，它会原地重置主会话。输入 `/reset` 会保留 Gateway 网关对当前会话的显式原地重置行为。
    - 聊天模型选择器会请求 Gateway 网关中已配置的模型视图。如果存在 `agents.defaults.models`，该允许列表将决定选择器内容，其中包括让提供商范围的目录保持动态的 `provider/*` 条目。否则，选择器会显示显式的 `models.providers.*.models` 条目，以及具有可用身份验证的提供商。完整目录仍可通过调试用 `models.list` RPC 配合 `view: "all"` 获取。
    - 当 Gateway 网关的新会话用量报告包含当前上下文 token 数时，聊天编辑器工具栏会显示一个小型上下文用量环，并标示已使用百分比。打开该环可查看当前上下文窗口、最近一次运行的 token 计数和估算总成本、提供商/模型标识，以及最近一次提供商响应所报告的输入、输出和缓存成本明细。当上下文压力较高时，该环会切换为警告样式；达到建议的压缩级别时，还会显示一个紧凑按钮，用于执行常规会话压缩流程。在 Gateway 网关再次报告最新用量之前，过期的 token 快照会被隐藏。

  </Accordion>
  <Accordion title="Talk 模式（浏览器实时）">
    Talk 模式使用已注册的实时语音提供商。使用 `talk.realtime.provider: "openai"` 以及 `openai` API 密钥配置文件、`talk.realtime.providers.openai.apiKey` 或 `OPENAI_API_KEY` 配置 OpenAI。OpenAI Realtime 使用公共 Platform API，并且需要 Platform API 密钥；Codex OAuth 登录无法满足此接口的要求。使用 `talk.realtime.provider: "google"` 以及 `talk.realtime.providers.google.apiKey` 配置 Google。浏览器绝不会收到标准的提供商 API 密钥：OpenAI 会收到用于 WebRTC 的临时 Realtime 客户端密钥，而 Google Live 会收到用于浏览器 WebSocket 会话的一次性受限 Live API 身份验证令牌，其指令和工具声明由 Gateway 网关锁定在令牌中。仅公开后端实时桥接的提供商通过 Gateway 网关中继传输运行，因此凭据和供应商套接字保留在服务器端，而浏览器音频则通过经过身份验证的 Gateway RPC 传输。Realtime 会话提示词由 Gateway 网关组装；`talk.client.create` 不接受调用方提供的指令覆盖。

    持久化的提供商、模型、语音、传输、推理强度、精确 VAD 阈值、静默持续时间和前缀填充默认值位于 **Settings → Communications → Talk**；更改这些设置需要 `operator.admin` 访问权限。配置 Gateway 网关中继会强制使用后端中继路径；配置 WebRTC 则让会话由客户端掌控，如果提供商无法创建浏览器会话，会直接失败，而不会静默回退到中继。

    Talk 控件本身是编辑器工具栏中的麦克风按钮。其插入符菜单会列出 **System default** 以及浏览器公开的所有麦克风，包括 USB、Bluetooth 和虚拟输入设备。所选设备 ID 仅保留在浏览器本地，绝不会发送到 Gateway 网关；如果该设备消失，Talk 会要求你选择其他输入设备，而不会静默改用另一个麦克风录音。Talk 处于实时状态时，麦克风按钮会变成显示实时输入电平表的胶囊按钮；单击它会停止语音输入，将鼠标悬停在其上会显示停止图标。当实时工具调用通过 `talk.client.toolCall` 查询已配置的更大模型时，屏幕阅读器会播报 `Connecting voice input...`、`Listening...` 或 `Asking OpenClaw...`。停止正在运行的智能体响应仍使用胶囊按钮旁边单独的方形 **停止** 控件。

    维护者实时冒烟测试：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 使用模拟麦克风媒体验证 OpenAI 后端 WebSocket 桥接、OpenAI 浏览器 WebRTC SDP 交换、Google Live 受限令牌浏览器 WebSocket 设置，以及 Gateway 网关中继浏览器适配器。该命令仅输出提供商状态，不记录密钥。

  </Accordion>
  <Accordion title="停止和中止">
    - 单击 **停止**（调用 `chat.abort`）。
    - 运行处于活动状态时，普通的后续消息会进入队列。单击队列消息上的 **Steer**，将该后续消息注入正在运行的轮次。
    - 输入 `/stop`（或 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` 等独立中止短语）以带外中止。
    - `chat.abort` 支持使用 `{ sessionKey }`（不带 `runId`）中止该会话的所有活动运行。

  </Accordion>
  <Accordion title="保留中止时的部分内容">
    - 运行中止后，UI 中仍可显示部分助手文本。
    - 存在已缓冲输出时，Gateway 网关会将中止时的部分助手文本持久化到转录历史记录中。
    - 持久化条目包含中止元数据，以便转录使用方区分中止时的部分内容和正常完成输出。

  </Accordion>
</AccordionGroup>

## 连接丢失和重新连接

会话建立后，Gateway 网关连接中断不会将你登出。客户端使用退避机制（从 800 ms 到最长 15 s）自动重试期间，仪表板仍保持可见，顶部栏下方会显示一个浮动的琥珀色“Gateway 网关连接已丢失 — 正在重新连接…”胶囊提示。连接恢复前，实时更新以及实时/会话操作会暂停；胶囊提示中的 **立即重试** 会强制立即尝试连接。聊天内容仍可编辑：普通文本和附件发送内容会保存在当前标签页按 Gateway 网关/会话限定的浏览器存储中，显示为等待重新连接，并在 Gateway 网关恢复后自动发送。离线时，实时控件和斜杠命令仍不可用。

如果此浏览器已有凭据（已配置的令牌/密码或已批准的设备令牌），首次打开和重新加载时会在连接建立期间显示一个小型 OpenClaw 动画标志，而不会短暂显示登录门禁。仅当尚未存储凭据，或 Gateway 网关主动拒绝凭据（令牌/密码错误、配对已撤销）时，才会显示登录门禁——这些状态需要你提供输入，而不是继续等待。

## PWA 安装和 Web Push

Control UI 提供 `manifest.webmanifest` 和 Service Worker，因此现代浏览器可以将其安装为独立 PWA。借助 Web Push，即使标签页或浏览器窗口未打开，Gateway 网关也能唤醒已安装的 PWA 并发送通知。

如果 OpenClaw 更新后页面立即显示 **协议不匹配**，请先使用 `openclaw dashboard` 重新打开仪表板并执行强制刷新。如果仍然失败，请清除仪表板来源的站点数据，或在浏览器无痕窗口中测试；旧标签页或浏览器 Service Worker 缓存可能继续运行更新前的 Control UI 软件包，并连接到较新的 Gateway 网关。

| 接口                                                  | 功能                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 清单。浏览器在其可访问后会提供“Install app”选项。              |
| `ui/public/sw.js`                                     | 处理 `push` 事件和通知点击的 Service Worker。 |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下） | 用于签署 Web Push 载荷的自动生成 VAPID 密钥对。                    |
| `push/web-push-subscriptions.json`                    | 持久化的浏览器订阅端点。                                           |

如需固定密钥（多主机部署、密钥轮换或测试），可通过 Gateway 网关进程上的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认为 `https://openclaw.ai`）

Control UI 使用以下受权限范围限制的 Gateway 网关方法注册和测试浏览器订阅：

- `push.web.vapidPublicKey` 获取当前 VAPID 公钥。
- `push.web.subscribe` 注册一个 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` 移除已注册的端点。
- `push.web.test` 向调用方的订阅发送测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（有关中继支持的推送，请参阅[配置](/zh-CN/gateway/configuration)）和 `push.test` 方法，后者以原生移动设备配对为目标。
</Note>

## 托管嵌入内容

助手消息可以使用 `[embed ...]` 短代码内联渲染托管的 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

内置 Canvas 插件还提供 [`show_widget`](/zh-CN/tools/show-widget)，用于直接通过工具调用渲染自包含 SVG 或 HTML。浏览器会声明 `inline-widgets` Gateway 网关能力，聊天历史记录重新加载后，生成的 Canvas 文档仍然可用。来自渠道的运行不会获得此工具。

<Tabs>
  <Tab title="strict">
    禁止在托管嵌入内容中执行脚本。
  </Tab>
  <Tab title="scripts (default)">
    在保持来源隔离的同时允许交互式嵌入内容；通常足以支持自包含的浏览器游戏/小组件。
  </Tab>
  <Tab title="trusted">
    在 `allow-scripts` 的基础上添加 `allow-same-origin`，用于有意需要更高权限的同站点文档。
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
仅当嵌入文档确实需要同源行为时才使用 `trusted`。对于大多数由智能体生成的游戏和交互式画布，`scripts` 是更安全的选择。
</Warning>

默认情况下，绝对外部 `http(s)` 嵌入 URL 仍会被阻止。要允许 `[embed url="https://..."]` 加载第三方页面，请设置 `gateway.controlUi.allowExternalEmbedUrls: true`。

## 聊天消息宽度

聊天转录使用与编辑器对齐、居中且易于阅读的框架。助手和工具输出在该框架内保持左对齐，而用户气泡保持右对齐。宽屏显示器部署可以通过设置 `gateway.controlUi.chatMessageMaxWidth` 覆盖转录宽度，无需修改内置 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

该值会在传入浏览器前进行验证。支持的形式包括 `960px` 或 `82%` 等普通长度和百分比，以及受约束的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 宽度表达式。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="集成式 Tailscale Serve（首选）">
    让 Gateway 网关保持监听 local loopback，并由 Tailscale Serve 使用 HTTPS 代理：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开 `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）。

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行身份验证。OpenClaw 会使用 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与标头匹配，以验证身份，并且仅当请求通过 local loopback 传入且带有 Tailscale 的 `x-forwarded-*` 标头时才接受这些身份。对于具有浏览器设备身份的 Control UI 操作员会话，这条经过验证的 Serve 路径还会跳过设备配对往返过程；没有设备身份的浏览器和节点角色连接仍会执行常规设备检查。如果希望即使对 Serve 流量也要求显式共享密钥凭据，请设置 `gateway.auth.allowTailscale: false`，然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于该异步 Serve 身份路径，在写入速率限制之前，会按相同客户端 IP 和身份验证权限范围串行处理失败的身份验证尝试。因此，来自同一浏览器的并发错误重试可能会使第二个请求显示 `retry later`，而不是让两个普通不匹配错误并行竞态。

    <Warning>
    无令牌 Serve 身份验证假定 Gateway 网关主机可信。如果该主机上可能运行不受信任的本地代码，请要求使用令牌/密码进行身份验证。
    </Warning>

  </Tab>
  <Tab title="绑定到 tailnet + 令牌">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    打开 `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）。

    将匹配的共享密钥粘贴到 UI 设置中（以 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果通过普通 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）打开仪表板，浏览器会在**非安全上下文**中运行并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

已记录的例外情况：

- 仅限 localhost 的不安全 HTTP 兼容模式，使用 `gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成操作员 Control UI 身份验证
- 应急使用的 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**建议的修复方法：**使用 HTTPS（Tailscale Serve），或在本地通过 `https://<magicdns>/`（Serve）或 `http://127.0.0.1:18789/`（在 Gateway 网关主机上）打开 UI。

<AccordionGroup>
  <Accordion title="不安全身份验证开关行为">
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

    - 它允许 localhost Control UI 会话在非安全 HTTP 上下文中无需设备身份即可继续。
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
    `dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，并会严重降低安全性。紧急使用后请尽快恢复。
    </Warning>

  </Accordion>
  <Accordion title="可信代理说明">
    - 可信代理身份验证成功后，可以允许没有设备身份的 **operator** Control UI 会话进入。
    - 这**不**适用于节点角色的 Control UI 会话。
    - 同一主机上的 loopback 反向代理仍不满足可信代理身份验证要求；请参阅[可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

有关 HTTPS 设置指南，请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 附带严格的 `img-src` 策略：仅允许**同源**资源、`data:` URL，以及本地生成的 `blob:` URL。远程 `http(s)` 和协议相对图片 URL 会被浏览器拒绝，并且绝不会发起网络获取请求。

实际行为如下：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍可正常呈现，包括 UI 获取并转换为本地 `blob:` URL 的已认证头像路由。
- 内联 `data:image/...` URL 仍可正常呈现。
- 由 Control UI 创建的本地 `blob:` URL 仍可正常呈现。
- GitHub 链接预览头像由 Gateway 网关从 GitHub 的固定头像主机获取，并以受限的 `data:` URL 返回；操作员的浏览器绝不会联系远程头像主机。
- 渠道元数据发出的远程头像 URL 会在 Control UI 的头像辅助函数中被移除，并替换为内置徽标/徽章，因此受到入侵或存在恶意行为的渠道无法强制操作员浏览器从任意远程地址获取图片。

此功能始终启用，且不可配置。

## 头像路由身份验证

配置 Gateway 网关身份验证后，Control UI 头像端点需要使用与 API 其余部分相同的 Gateway 网关令牌：

- `GET /avatar/<agentId>` 仅向已认证的调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 按照相同规则返回头像元数据。
- 对任一路由的未认证请求都会被拒绝（与同级智能体媒体路由一致），因此头像路由不会在其他部分受到保护的主机上泄露智能体身份。
- Control UI 获取头像时会将 Gateway 网关令牌作为 bearer 标头转发，并使用经过身份验证的 blob URL，使图片仍能在仪表板中呈现。

如果禁用 Gateway 网关身份验证（不建议在共享主机上这样做），头像路由也会与 Gateway 网关的其余部分一样变为无需身份验证。

## 智能体媒体路由身份验证

配置 Gateway 网关身份验证后，智能体本地媒体预览使用两步路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要常规的 Control UI 操作员身份验证；浏览器检查可用性时会将 Gateway 网关令牌作为 bearer 标头发送。
- 成功的元数据响应包含一个短期有效的 `mediaTicket`，其作用域仅限于该确切源路径。
- 浏览器呈现的图片、音频、视频和文档 URL 使用 `mediaTicket=<ticket>`，而不是有效的 Gateway 网关令牌或密码。该票据会很快过期，且无法授权其他源。

这样既能使媒体呈现与浏览器原生媒体元素兼容，又不会在可见的媒体 URL 中放入可重复使用的 Gateway 网关凭据。

## 审批链接

操作员审批通知可深度链接到保留的 `${controlUiBasePath}/approve/{approvalId}` 命名空间下提供的独立审批文档（例如 `/approve/<approvalId>`，或配置基础路径时的 `/openclaw/approve/<approvalId>`）。该 URL 在审批的整个生命周期内保持稳定，并可安全地在你自己的设备之间转发：它仅标识审批，绝不会为审批授权。

- 单段 `/approve/<approvalId>` 命名空间由 Gateway 网关在插件 HTTP 路由之前为**所有** HTTP 方法保留，因此插件路由绝不能遮蔽或截获审批文档。
- 打开审批文档需要使用与 Control UI 其余部分相同的 Gateway 网关身份验证（令牌/密码、Tailscale Serve 身份或可信代理身份）；凭据绝不会成为审批 URL 的一部分。
- 禁用 Control UI 服务时，对该命名空间的请求会返回 `404`，而不会回退到插件处理程序。
- 在审批文档中登录仅对该页面临时有效：它不会覆盖同一浏览器中完整 Control UI 保存的 Gateway 网关选择或设置。

Gateway 网关从 `dist/control-ui` 提供静态文件：

```bash
pnpm ui:build
```

可选的绝对基础路径（固定资源 URL）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

本地开发（独立开发服务器）：

```bash
pnpm ui:dev
```

然后将 UI 指向你的 Gateway 网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## Control UI 空白页面

如果浏览器加载了空白仪表板，并且开发者工具未显示有用的错误，则可能是某个扩展程序或早期内容脚本阻止了 JavaScript 模块应用求值。静态页面包含一个纯 HTML 恢复面板；当启动后未注册 `<openclaw-app>` 时，该面板会显示。

更改浏览器环境后，使用面板中的**重试**操作；也可以在完成以下检查后手动重新加载：

- 禁用会向所有页面注入内容的扩展程序，尤其是带有 `<all_urls>` 内容脚本的扩展程序。
- 尝试使用隐私窗口、全新的浏览器配置文件或其他浏览器。
- 保持 Gateway 网关运行，并在更换浏览器后验证同一仪表板 URL。

## 调试/测试：开发服务器 + 远程 Gateway 网关

Control UI 由静态文件组成；WebSocket 目标可配置，并且可以与 HTTP 来源不同。当需要在本地运行 Vite 开发服务器，而 Gateway 网关在其他位置运行时，这会很方便。

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

    可选的一次性身份验证（如需要）：

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="说明">
    - `gatewayUrl` 会在加载后存储到 localStorage 中，并从 URL 中移除。
    - 如果通过 `gatewayUrl` 传入完整的 `ws://` 或 `wss://` 端点，请对该值进行 URL 编码，以便浏览器正确解析查询字符串。
    - 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，从而避免请求日志和 Referer 泄露。为保持兼容性，旧版 `?token=` 查询参数仍会导入一次，但仅作为回退，并会在引导启动后立即移除。
    - `password` 仅保留在内存中。
    - 设置 `gatewayUrl` 后，UI 不会回退使用配置或环境凭据。请显式提供 `token`（或 `password`）；缺少显式凭据属于错误。
    - 当 Gateway 网关位于 TLS（Tailscale Serve、HTTPS 代理等）后方时，请使用 `wss://`。
    - `gatewayUrl` 仅在顶层窗口中接受（不能嵌入），以防止点击劫持。
    - 公开的非 loopback Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整来源）。对于来自 loopback、RFC1918/链路本地、`.local`、`.ts.net` 或 Tailscale CGNAT 主机的同源私有 LAN/Tailnet 加载，无需启用 Host 标头回退即可接受。
    - Gateway 网关启动时可能根据实际运行时绑定地址和端口填充 `http://localhost:<port>` 和 `http://127.0.0.1:<port>` 等本地来源，但远程浏览器来源仍需显式添加。
    - 除严格受控的本地测试外，请勿使用 `gateway.controlUi.allowedOrigins: ["*"]`；它表示允许任何浏览器来源，而不是“匹配我正在使用的任意主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 标头来源回退模式，但这是一种危险的安全模式。

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
- [健康检查](/zh-CN/gateway/health) — Gateway 健康监控
- [TUI](/zh-CN/web/tui) — 终端用户界面
- [WebChat](/zh-CN/web/webchat) — 基于浏览器的聊天界面
