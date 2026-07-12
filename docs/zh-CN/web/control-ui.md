---
read_when:
    - 你想通过浏览器操作 Gateway 网关
    - 你希望无需 SSH 隧道即可访问 Tailnet
sidebarTitle: Control UI
summary: Gateway 网关的浏览器端 Control UI（聊天、活动、节点、配置）
title: Control UI
x-i18n:
    generated_at: "2026-07-12T21:24:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b1da56979bd134ce0be8ab0a2fbee658952515db5e422fbe9eb685968de8a755
    source_path: web/control-ui.md
    workflow: 16
---

Control UI 是由 Gateway 网关提供服务的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它通过同一端口**直接连接 Gateway 网关 WebSocket**。

## 快速打开（本地）

如果 Gateway 网关运行在同一台计算机上，请打开 [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）。

如果页面无法加载，请先启动 Gateway 网关：`openclaw gateway`。

<Note>
在原生 Windows LAN 绑定中，即使 `127.0.0.1` 在 Gateway 网关主机上可以正常访问，Windows Firewall 或组织管理的 Group Policy 仍可能阻止广播的 LAN URL。在 Windows 主机上运行 `openclaw gateway status --deep`；它会报告可能被阻止的端口、配置文件不匹配，以及策略可能忽略的本地防火墙规则。
</Note>

身份验证在 WebSocket 握手期间通过以下方式提供：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时，使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时，使用受信任代理身份标头

仪表板设置面板会为当前浏览器标签页会话和所选 Gateway 网关 URL 保留令牌，但不会持久化密码。新手引导通常会在首次连接时生成用于共享密钥身份验证的 Gateway 网关令牌，但当 `gateway.auth.mode` 为 `"password"` 时，也可以使用密码身份验证。

## 设备配对（首次连接）

从新浏览器或设备连接通常需要**一次性配对批准**，显示为 `disconnected (1008): pairing required`。

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

如果浏览器使用已更改的身份验证详细信息（角色/权限范围/公钥）重试配对，之前的待处理请求会被取代，并创建新的 `requestId`；批准前请重新运行 `openclaw devices list`。

将已配对浏览器的读取访问权限切换为写入/管理员访问权限会被视为批准升级，而不是静默重新连接：OpenClaw 会保留旧批准的有效状态、阻止权限更广的重新连接，并要求你明确批准新的权限范围集。

批准后，系统会记住该设备，除非你使用 `openclaw devices revoke --device <id> --role <role>` 撤销它，否则无需重新批准。有关令牌轮换、撤销以及 Paperclip / `openclaw_gateway` 首次运行批准流程，请参阅[设备 CLI](/zh-CN/cli/devices)。

<Note>
- 直接通过 local loopback 进行的浏览器连接（`127.0.0.1` / `localhost`）会自动批准。
- 当 `gateway.auth.allowTailscale: true`、Tailscale 身份验证通过且浏览器提供其设备身份时，Tailscale Serve 可以让 Control UI 操作员会话跳过配对往返流程。没有设备身份的浏览器和节点角色连接仍会遵循常规设备检查。
- 直接 Tailnet 绑定、LAN 浏览器连接以及没有设备身份的浏览器配置文件仍需要明确批准。
- 每个浏览器配置文件都会生成唯一的设备 ID，因此切换浏览器或清除浏览器数据后需要重新配对。

</Note>

## 配对移动设备

已配对的管理员无需打开终端即可创建 iOS/Android 连接二维码：

<Steps>
  <Step title="打开移动设备配对">
    选择 **Devices**，然后在 **Devices** 卡片中点击 **Pair mobile device**。
  </Step>
  <Step title="连接手机">
    在 OpenClaw 移动应用中，打开 **Settings** → **Gateway** 并扫描二维码。你也可以改为复制并粘贴设置代码。
  </Step>
  <Step title="确认连接">
    官方 iOS/Android 应用会自动连接。如果 **Pending approval** 显示了请求，请在批准前检查其角色和权限范围。
  </Step>
</Steps>

创建设置代码需要 `operator.admin`；对于没有此权限的会话，该按钮处于禁用状态。设置代码包含短期有效的引导凭据，因此在有效期内，应像对待密码一样保护二维码和复制的代码。进行远程配对时，Gateway 网关必须解析为 `wss://`（例如通过 Tailscale Serve/Funnel）；普通 `ws://` 仅限 local loopback 和私有 LAN 地址。有关完整的安全和回退详情，请参阅[配对](/zh-CN/channels/pairing#pair-from-the-control-ui-recommended)。

## 个人身份（浏览器本地）

Control UI 支持为每个浏览器设置个人身份（显示名称和头像），该身份会附加到传出的消息中，以便在共享会话中标明消息归属。它存储在浏览器存储中，作用域限定为当前浏览器配置文件，不会同步到其他设备；除你发送的消息中常规的对话记录作者元数据外，也不会持久化到服务器端。清除站点数据或切换浏览器会将其重置为空。

助手头像覆盖遵循相同的浏览器本地模式：上传的覆盖头像会在本地叠加到由 Gateway 网关解析的身份上，且绝不会通过 `config.patch` 往返传输。对于直接写入该字段的非 UI 客户端，仍可使用共享的 `ui.assistant.avatar` 配置字段。

## 运行时配置端点

Control UI 从 `/control-ui-config.json` 获取其运行时设置，该路径相对于 Gateway 网关的 Control UI 基础路径解析（例如，基础路径为 `/__openclaw__/` 时，端点为 `/__openclaw__/control-ui-config.json`）。该端点受到与其余 HTTP 表面相同的 Gateway 网关身份验证保护：未经身份验证的浏览器无法获取该端点，成功获取需要有效的 Gateway 网关令牌/密码、Tailscale Serve 身份或受信任代理身份。

## Gateway 网关主机状态

在简单视图中打开 **Settings**，即可查看 **Gateway Host** 卡片，其中显示 Gateway 网关计算机、LAN 地址、操作系统、运行时、运行时间、CPU 负载、内存和状态卷磁盘空间。该卡片可见时，每 10 秒通过 `system.info` Gateway RPC 刷新一次，此 RPC 需要 `operator.read` 权限范围。较旧的 Gateway 网关以及没有此权限范围的连接不会显示该卡片。

## 语言支持

Control UI 首次加载时会根据浏览器区域设置进行本地化。要在之后覆盖此设置，请打开 **Settings -> General -> Language**（选择器位于 General 快速设置卡片中，而非 Appearance 下）。

- 支持的区域设置：`en`、`ar`、`de`、`es`、`fa`、`fr`、`hi`、`id`、`it`、`ja-JP`、`ko`、`nl`、`pl`、`pt-BR`、`ru`、`th`、`tr`、`uk`、`vi`、`zh-CN`、`zh-TW`
- 非英语翻译会在浏览器中延迟加载。
- 所选区域设置会保存在浏览器存储中，并在后续访问时重复使用。
- 缺失的翻译键会回退为英语。

文档翻译会针对相同的非英语区域设置集合生成，但文档站点内置的 Mintlify 语言选择器只列出 Mintlify 接受的区域设置代码。泰语（`th`）和波斯语（`fa`）文档仍会在发布仓库中生成；在 Mintlify 支持这些代码之前，它们可能不会显示在该选择器中。

## 外观主题

Appearance 面板包含内置的 Claw、Knot 和 Dash 主题（Claw 为默认主题），以及一个浏览器本地的 tweakcn 导入槽位。要导入主题，请打开 [tweakcn 编辑器](https://tweakcn.com/editor/theme)，选择或创建一个主题，点击 **Share**，然后将复制的链接粘贴到 Appearance 中。导入器还接受 `https://tweakcn.com/r/themes/<id>` 注册表 URL、类似 `https://tweakcn.com/editor/theme?theme=amethyst-haze` 的编辑器 URL、相对 `/themes/<id>` 路径、原始主题 ID，以及 `amethyst-haze` 等默认主题名称。

导入的主题仅存储在当前浏览器配置文件中；它们不会写入 Gateway 网关配置，也不会跨设备同步。替换导入的主题会更新这一个本地槽位；如果导入的主题当前处于启用状态，清除它会切换回 Claw。

Appearance 还提供浏览器本地的 Text size 设置，与其他 Control UI 偏好设置一起存储。它适用于聊天文本、编辑器文本、工具卡片和聊天侧边栏，并确保文本输入框至少为 16px，从而避免移动版 Safari 在聚焦时自动缩放。

## 管理插件

在侧边栏中打开**插件**，或使用相对于已配置 Control UI 基础路径的
`/settings/plugins`，即可在不离开 Control UI 的情况下浏览和管理插件。
例如，基础路径 `/openclaw` 使用 `/openclaw/settings/plugins`。即使所有
可选插件均已禁用，该页面也始终可用。

插件是一个包含四个标签页的中心：**Installed** 和 **Discover** 在
`/settings/plugins` 管理插件代码，**Skills** 在 `/skills` 托管按智能体
配置的技能管理器，**Workshop** 在 `/skills/workshop` 托管 Skill Workshop
提案审核。每个标签页均保留自己的 URL，侧边栏则为它们统一显示一个插件入口。

**Installed** 标签页按类别显示完整的本地清单，并提供概览计数。每一行都可打开
详细信息视图；其更多操作（`…`）菜单可启用或禁用插件，并为外部安装的插件提供
**Remove**。它还会列出已配置的 [MCP 服务器](/zh-CN/cli/mcp)，并支持直接添加、禁用
和移除。**Discover** 标签页是商店：其中包含 OpenClaw 内置的精选插件、官方外部
插件，以及适用于热门服务的一键式 MCP 连接器。在搜索框中输入内容会直接查询
[ClawHub](https://clawhub.ai/plugins)，并追加一个 **From ClawHub** 区域，其中
包含下载次数和来源验证徽章。深层链接可以使用
`/settings/plugins?tab=discover` 直接指向商店。

**Skills** 标签页保留技能状态报告、启用/禁用开关、API 密钥输入框和内联 ClawHub
技能搜索，其作用域限定为所选智能体。**Workshop** 标签页保留 Skill Workshop
看板和 Today 审核流程，用于审核[技能提案](/zh-CN/tools/skill-workshop)。

内置插件已存在于 Gateway 网关上，因此显示 **Enable** 或 **Disable**，而不是
**Install**。例如，Workboard 内置于 OpenClaw 中，但默认禁用，因此其操作为
**Enable**。内置插件无法移除，只能禁用。

读取目录和搜索 ClawHub 需要 `operator.read`。安装、启用、禁用或移除插件以及
更改 MCP 服务器需要 `operator.admin`；对于只读操作员，这些操作保持禁用状态。

ClawHub 安装通过 Gateway 网关运行，并采用与其他由 Gateway 网关中介的安装相同的
信任、完整性和插件安装策略检查。安装或移除插件代码需要重启 Gateway 网关。如果
插件和当前 Gateway 网关运行时支持，启用或禁用已安装插件可以在无需重启的情况下
生效；否则 UI 会报告需要重启。添加由 OAuth 支持的 MCP 连接器后，需要通过 CLI
一次性运行 `openclaw mcp login <name>`。

该页面有意专注于清单、发现、安装、启用和移除。对于任意 npm、git 或本地路径来源、
更新及高级插件配置，请使用 [`openclaw plugins`](/zh-CN/cli/plugins)。

## 侧边栏导航

  侧边栏将导航固定在可滚动的会话列表上方。在多 Agent 设置中，每个 Agent 都显示为可折叠的顶层分区；展开 Agent 可浏览其会话，而不会离开当前打开的聊天；折叠的 Agent 会显示未读指示器。在 Agent 内，列表分为 **已固定**、每个已连接渠道对应的一个内置分区（Telegram、Slack、WhatsApp 等）、用于绑定到托管工作树或 Exec 节点的会话的内置 **工作** 分区（行中显示 `repo ⎇ branch` 行以及节点主机）、自定义组（会话的 `category`），以及容纳其余会话的 **聊天**。渠道和工作分区会自动对行进行分类；将会话分配到自定义组始终具有最高优先级。打开会话会移动选择高亮，但不会重新排列行。自上次读取后有新活动的会话会显示未读圆点，打开后即标记为已读。每个会话行都有上下文菜单（三点按钮或右键单击），其中包含固定/取消固定、标记为未读/已读、重命名、分支、移动到组（包括新建组和从组中移除）、归档和删除；触控布局会让直接固定和菜单控件保持可见。按住 Cmd/Ctrl 单击可切换行的多选状态，按住 Shift 单击可按当前可见顺序扩展选择；随后在选中行上打开菜单，会提供批量操作（将 N 个标记为未读/已读、将 N 个移动到组、归档 N 个、删除 N 个），这些操作会应用于每个选中的会话，批量删除只需确认一次。将会话拖到自定义组或 **聊天** 即可移动它。自定义组标题可以折叠、展开或通过拖动重新排序；组名称及其顺序存储在 Gateway 网关中（`sessions.groups.*`），因此会跨浏览器同步，而折叠状态保留在浏览器配置文件中。组标题也有菜单（三点按钮或右键单击），其中包含重命名组、新建组和删除组；重命名或删除组会在服务器端更新每个成员会话，包括已归档的会话；删除组会保留其中的会话，并将它们移回聊天。会话列表标题中的唯一 **+** 会打开新建会话页面（见下文）。排序控件还有一个分组方式切换项：分组（默认）或无，以显示单个扁平列表（已固定仍保持独立）；此选择存储在当前浏览器配置文件中。**用量**、**自动化** 和 **插件** 默认固定；展开 **更多** 可访问其他所有目标页面。在更多下选择 **编辑固定项目**，或右键单击导航区域，即可固定或取消固定目标页面并恢复默认设置。固定项目集合和更多的展开状态存储在当前浏览器配置文件中，并会在重新加载后保留。

  ## 新建会话页面

  侧边栏会话列表标题中的 **+** 会在 `/new` 打开全页草稿：在你发送第一条消息之前，不会创建任何内容。消息框上方的目标行用于选择会话的工作位置：Agent（多 Agent 设置）、Exec 的运行位置（**Gateway 网关 · 本地**，或公开 `system.run` 的已配对节点；需要 `operator.admin`）、文件夹（默认为 Agent 工作区；其他 Gateway 网关绝对路径需要 `operator.admin` 和工作树），以及可选的 **工作树** 开关，其中包含基础分支选择器（由 `worktrees.branches` 提供数据，因此不会执行 fetch）和可选的工作树名称（分支将变为 `openclaw/<name>`）。文件夹标签的浏览按钮会打开由仅限管理员的 `fs.listDir` 方法支持的内联目录选择器。其顶层显示 Gateway 网关和每个已知节点；离线节点和不支持目录浏览的节点仍会显示，但处于禁用状态。选择 Gateway 网关后，将从当前文件夹或 Gateway 网关主目录开始浏览。选择功能完备的节点后，将浏览该节点的主机文件系统、把 Exec 绑定到该节点，并直接使用选中的节点绝对路径（托管工作树仍仅限 Gateway 网关）。提交时会使用第一条消息调用 `sessions.create`，因此运行会在同一次往返中启动，UI 随即跳转到新会话的聊天。如果 Gateway 网关创建了会话但拒绝首次发送，聊天会跨重新加载保留提示词和错误；**重试** 会通过已创建的会话发送，而不会再创建一个会话。

  在 **设置** 内，专用侧边栏顶部提供 **搜索设置** 字段，用于快速查找设置分区。

  侧边栏顶部的 **搜索** 字段会打开命令面板（⌘K）。单击侧边栏标题中的 OpenClaw 品牌会打开简洁的新建会话起始屏幕。当某些项目需要处理时（例如失败或逾期的 cron 作业、即将过期或已经过期的模型身份验证），紧凑的提醒标签会显示在侧边栏页脚上方，单击可跳转到对应页面。紧凑页脚将连接状态、**设置**、**文档**、移动端配对以及浅色/深色/系统颜色模式切换集中在一起；当 Gateway 网关从源代码检出运行，且所在分支不是 `main` 时，页脚还会以红色显示该分支名称，以便一眼识别非发布版 Gateway 网关（发布版安装永远不会显示该名称）。Shift-Command-Comma 可打开 **设置**，且不会覆盖浏览器的 Command-Comma 快捷键。侧边栏标题还包含折叠开关（⌘B）；折叠后会完全隐藏侧边栏，提供全宽工作区，使用浮动展开控件（或 ⌘B）即可恢复；macOS 应用则将该开关原生置于标题栏中。侧边栏是桌面端唯一的导航界面，不设顶栏。在窄视口中，侧边栏会替换为紧凑标题行后方的滑出式抽屉，该标题行包含抽屉开关、品牌和命令面板搜索；在 macOS 应用中，该标题行会将标题栏留白整合为窗口控件旁的一条紧凑栏。导航使用常规浏览器历史记录，因此浏览器的后退/前进按钮可在导航记录中移动；macOS 应用还会在窗口控件旁添加原生侧边栏开关并支持触控板滑动手势：侧边栏展开时，其右边缘显示后退/前进按钮；侧边栏折叠时，则显示原生搜索（命令面板）和新建会话按钮。

  ## 当前功能

  <AccordionGroup>
  <Accordion title="聊天和 Talk">
    - 通过 Gateway 网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）。
    - 刷新聊天历史记录时，会请求一个大小受限的近期窗口，并限制每条消息的文本长度，因此大型会话不会迫使浏览器先渲染完整的对话记录载荷，聊天才可使用。
    - 将鼠标悬停在公开 GitHub issue 或 pull request 链接上，或通过键盘将焦点移到该链接时，会显示其状态、标题、作者、近期活动、评论和变更统计信息。已连接的 Gateway 网关会获取并缓存公开元数据，而不会更改链接目标，即使 UI 使用远程 Gateway 网关也是如此。Gateway 网关会在确认仓库为公开仓库后使用可用的 `GH_TOKEN` 或 `GITHUB_TOKEN`；否则，它会使用 GitHub 的匿名 API，并采用更长的缓存时间。
    - 通过浏览器实时会话进行 Talk。OpenAI 使用直接 WebRTC，Google Live 使用通过 WebSocket 传输的受限一次性浏览器令牌，而仅限后端的实时语音插件使用 Gateway 网关中继传输。客户端拥有的提供商会话通过 `talk.client.create` 启动；Gateway 网关中继会话通过 `talk.session.create` 启动。浏览器通过 `talk.session.appendAudio` 流式传输麦克风 PCM 时，中继会将提供商凭据保留在 Gateway 网关上；它还会通过 `talk.client.toolCall` 转发 `openclaw_agent_consult` 提供商工具调用，以应用 Gateway 网关策略并使用配置的更大型 OpenClaw 模型；活动运行中的语音引导则通过 `talk.client.steer` 或 `talk.session.steer` 路由。
    - 在聊天中流式显示工具调用和实时工具输出卡片（Agent 事件）。工具活动会呈现为按类型区分的行：Shell 命令显示带语法高亮的命令和终端样式输出；支持的编辑和写入调用显示大小受限的内联 Diffs、可用时的行号以及 `+added -removed` 统计；连续调用会折叠为摘要，例如“运行了 13 条命令、读取了 6 个文件、编辑了 9 个文件”。运行进行期间，最新的运行中调用会用其名称作为组标题。展开某一行可检查其余参数和原始输出。
    - 可为复杂工具调用（长 Shell 命令、参数较多的插件工具）启用可选的 AI 用途标题，使用 `gateway.controlUi.toolTitles: true` 启用（默认关闭）。标题来自批处理的 `chat.toolTitles` 方法，并采用标准实用模型路由：优先使用显式 `utilityModel`（由操作员选择的提供商，与其他实用任务相同），否则使用会话提供商声明的默认小模型；结果按 Agent 缓存在 Gateway 网关端。未选择启用或没有可用的低成本模型时，各行会保留其确定性标签，且不会调用模型。
    - 启动或忽略模型临时建议的后续任务；接受建议后，会使用建议的提示词打开一个新的托管工作树会话。
    - 活动标签页使用浏览器本地、优先脱敏的摘要，显示来自现有 `session.tool` / 工具事件传递的实时工具活动。

  </Accordion>
  <Accordion title="渠道、会话和记忆">
    - 渠道：内置渠道以及内置/外部插件渠道的状态、二维码登录和每渠道配置（`channels.status`、`web.login.*`、`config.patch`）。
    - 渠道探测刷新会在缓慢的提供商检查完成期间保持上一份快照可见；当探测或审计超过其 UI 时间预算时，会将快照标记为部分完成。
    - 会话：默认列出已配置 Agent 的会话，可固定常用会话、重命名、归档或恢复不活跃会话，从已过期且未配置的 Agent 会话键回退，并应用每会话的模型/思考/快速/详细/跟踪/推理覆盖设置（`sessions.list`、`sessions.patch`）。已固定会话排在近期未固定会话之前；已归档会话位于会话页面的归档视图中，并保留其对话记录。自上次读取后有活动的会话行会显示未读圆点，并提供标记为未读/已读操作（`sessions.patch { unread }`）；分支操作则会将对话记录分支为新会话（`sessions.create { parentSessionKey, fork: true }`）。表格上方的概览磁贴会汇总已加载的会话清单（会话数、实时运行数、未读会话数、令牌总数）；每一行都有类型字形图标，实时运行时还会显示圆点；状态以普通圆点和标签呈现；当会话报告令牌数和上下文大小时，令牌列会显示上下文窗口用量计。行管理操作位于每行菜单中（三点按钮或右键单击），与侧边栏的会话菜单一致；行抽屉会将 Agent 运行时和运行持续时间与其他会话详细信息一并显示。
    - 会话分组：分组方式控件可按自定义组、渠道、类型、Agent 或日期将会话表格组织为多个分区。自定义组通过 `sessions.patch`（`category`）按会话持久保存，因此从消息渠道（Discord、Telegram、WhatsApp 等）启动的会话也可以分类；可通过将行拖到某个分区或使用每行的组选择器来分配组，并可通过新建组操作创建组。
    - 记忆（Agent 页面上的标签页，作用域为选中的 Agent）：Dreaming 状态、启用/禁用开关和梦境日记阅读器（`doctor.memory.status`、`doctor.memory.dreamDiary`、`config.patch`）。

  </Accordion>
  <Accordion title="Cron、任务、插件、Skills、设备、Exec 审批">
    - 自动化（cron 作业）：Automations/Run history 选项卡切换上方显示统计卡片（自动化数量、失败数量、调度器状态、下次唤醒时间）；Automations 选项卡在可筛选表格中列出作业（All/Active/Paused、搜索、计划和上次运行筛选器、每行操作菜单），下方提供入门建议；Run history 选项卡显示所有自动化最近的运行记录（`cron.*`）。
    - 任务：实时显示活动任务和最近后台任务的台账，并提供关联会话和取消功能（`tasks.*`）。
    - 插件：浏览已安装清单和精选商店，搜索 ClawHub，安装和移除插件代码，以及启用或禁用已安装插件（`plugins.*`）；MCP 服务器行通过配置方法编辑 `mcp.servers`。
    - Skills：状态、启用/禁用、安装、API key 更新（`skills.*`）。
    - 设备：一个清单整合已配对设备记录、节点目录和实时在线状态（`device.pair.list`、`node.list`、`system-presence`）。Gateway 网关主机固定显示在首位；已配对客户端显示连接状态、角色、令牌、能力和命令。重复配对会折叠为可展开的组，**Clean up N stale** 可批量移除经管理员确认离线且由系统自动批准（静默本地、受信任 CIDR 或经 SSH 验证），或早于审批来源记录的重复项。条目可被移除（`node.pair.remove`、`device.pair.remove`），设备配对和节点重新审批可在行内处理（`device.pair.*`、`node.pair.approve`/`reject`），还可从同一卡片创建移动端设置代码。
    - Exec 审批：编辑 Gateway 网关或节点允许列表，并为 `exec host=gateway/node` 设置询问策略（`exec.approvals.*`）。

  </Accordion>
  <Accordion title="配置">
    - 查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）。
    - 个人资料：一个设置页面，显示默认智能体的身份和全部历史使用统计数据——生命周期令牌数、峰值日、最长会话、连续活动记录、全年令牌热力图、最常用工具和渠道亮点（`usage.cost`、`sessions.usage`）。
    - MCP 有一个专用设置页面，其中包含只读服务器行（传输协议、启用状态、OAuth/筛选器/并行摘要）、常用操作员命令和限定范围的 `mcp` 配置编辑器；添加、启用/禁用和移除服务器需在插件页面完成。
    - 模型提供商：一个设置页面，列出每个已配置的模型提供商及其品牌图标、身份验证状态（`models.authStatus`）、模型可用性（`models.list`）、提供商所报告的实时套餐/配额/账单数据（`usage.status`），以及过去 30 天的本地会话支出（`sessions.usage`）。Refresh 操作会重新读取凭据状态和提供商使用情况。
    - 连接：位于 **Connections** 下的设置页面，负责仪表盘自身的 Gateway 网关连接——WebSocket URL、Gateway 网关令牌、密码和默认会话键——以及最新的握手快照（状态、运行时间、节拍间隔、上次渠道刷新时间）。离线登录门控处理断开连接的情况；连接后可在此页面编辑连接。
    - 经验证后应用并重启（`config.apply`），然后唤醒最后一个活动会话。
    - 写入操作包含基础哈希保护，以防覆盖并发编辑。
    - 写入操作（`config.set`/`config.apply`/`config.patch`）会预先检查所提交配置负载中引用的活动 SecretRef 是否可解析；无法解析且处于活动状态的已提交引用会在写入前被拒绝。
    - 表单保存时会丢弃无法从已保存配置中恢复的过期脱敏占位符，同时保留仍可映射到已保存密钥的脱敏值。
    - 架构和表单渲染来自 `config.schema` / `config.schema.lookup`，包括字段 `title`/`description`、匹配的 UI 提示、直接子项摘要、嵌套对象/通配符/数组/组合节点上的文档元数据，以及可用时的插件和渠道架构。仅当快照可安全进行原始往返转换时，原始 JSON 编辑器才可用；否则 Control UI 会强制使用 Form 模式。
    - 原始 JSON 编辑器的 “Reset to saved” 会保留原始编写的结构（格式、注释、`$include` 布局），而不是重新渲染扁平化快照，因此当快照能够安全往返转换时，重置后外部编辑仍会保留。
    - 结构化 SecretRef 对象值在表单文本输入框中以只读方式呈现，以防对象被意外转换为字符串而损坏。

  </Accordion>
  <Accordion title="使用情况">
    - 从会话派生的令牌和估算成本分析与提供商账单保持分离。
    - 提供商卡片调用 `usage.status`，并显示已配置提供商插件报告的实时套餐名称、配额周期、余额、支出和预算。
    - 提供商使用情况查询失败不会阻塞会话/成本仪表盘；不可用的提供商卡片会显示各自的错误状态。

  </Accordion>
  <Accordion title="调试、日志、更新">
    - 调试：状态/健康/模型快照、事件日志和手动 RPC 调用（`status`、`health`、`models.list`）。
    - 事件日志包含 Control UI 刷新/RPC 耗时、缓慢的聊天/配置渲染耗时，以及当浏览器提供相应 PerformanceObserver 条目类型时，针对长动画帧或长任务的浏览器响应性条目。
    - 日志：实时跟踪 Gateway 网关文件日志，并支持筛选/导出（`logs.tail`）。
    - 更新：执行软件包/git 更新并重启（`update.run`），生成重启报告，然后在重新连接后轮询 `update.status`，以验证正在运行的 Gateway 网关版本。

  </Accordion>
  <Accordion title="自动化面板说明">
    - 选择一行会打开全页详情视图，标题栏中包含 Active/Paused 开关和 Run now（其菜单中提供到期时运行、克隆和移除）；Settings 选项卡可行内编辑自动化（提示词、详情、频率、高级覆盖项），Run history 选项卡显示该自动化的运行记录。
    - 表格下方的入门自动化会使用可编辑的提示词和计划预填创建表单。
    - 对于隔离任务，交付默认采用公告摘要；仅限内部运行时切换为 none。
    - 选择 announce 时会显示渠道/目标字段。
    - Webhook 模式使用 `delivery.mode = "webhook"`，并将 `delivery.to` 设置为有效的 HTTP(S) webhook URL。
    - 对于主会话任务，可使用 webhook 和 none 交付模式。
    - 高级编辑控件包括运行后删除、清除智能体覆盖项、cron 精确/错峰选项、智能体模型/思考覆盖项，以及尽力交付开关。
    - 表单验证会在行内显示字段级错误；修复前，无效值会禁用保存按钮。
    - 设置 `cron.webhookToken` 可发送专用 bearer 令牌；如果省略，则发送 webhook 时不包含身份验证标头。
    - `cron.webhook` 是已弃用的旧版回退机制：运行 `openclaw doctor --fix`，将仍使用 `notify: true` 的已存储作业迁移为明确的逐作业 webhook 或完成交付。

  </Accordion>
</AccordionGroup>

## MCP 页面

专用 MCP 页面是一个操作员视图，用于管理 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器。它本身不会启动 MCP 传输协议；可使用它检查和编辑已保存的配置，需要实时服务器证明时，再使用 `openclaw mcp doctor --probe`。

典型工作流：

1. 从侧边栏打开 **MCP**。
2. 检查摘要卡片中的服务器总数、已启用、OAuth 和已筛选服务器数量。
3. 查看每个服务器行的传输协议、启用状态、身份验证、筛选器、超时和命令提示。
4. 在 **插件** 页面管理服务器（添加、启用/禁用、移除），该页面是 `mcp.servers` 唯一的交互式写入端；此处的行列表会链接到该页面。
5. 编辑限定范围的 `mcp` 配置部分，包括服务器定义、标头、TLS/mTLS 路径、OAuth 元数据、工具筛选器和 Codex 投影元数据。
6. 使用 **Save** 写入配置；当正在运行的 Gateway 网关需要应用变更后的配置时，使用 **Save & Publish**。
7. 在终端运行 `openclaw mcp status --verbose`、`openclaw mcp doctor --probe` 或 `openclaw mcp reload`，分别执行静态诊断、实时证明或清除缓存的运行时。

该页面会在渲染前对包含凭据的类 URL 值进行脱敏，并在命令片段中引用服务器名称，使复制的命令在名称包含空格或 shell 元字符时仍能正常工作。完整 CLI 和配置参考：[MCP](/zh-CN/cli/mcp)。

## 活动选项卡

活动选项卡位于 **Settings › System** 中，与 Logs 和 Debug 相邻。它是一个临时的浏览器本地观察器，用于观察实时工具活动，数据来自为聊天工具卡片提供支持的同一 Gateway 网关 `session.tool` / 工具事件流。它不会新增其他 Gateway 网关事件族、端点、持久活动存储、指标数据源或外部观察器流。

活动条目仅保留经过净化的摘要，以及经过脱敏和截断的输出预览。工具参数值不会存储在活动状态中；UI 会显示参数已隐藏，并且仅记录参数字段数量。内存列表跟随当前浏览器选项卡，在 Control UI 内导航时保持不变，并在页面重新加载、切换会话或点击 **Clear** 时重置。

## 操作员终端

可停靠的操作员终端默认禁用。要启用它，请设置 `gateway.terminal.enabled: true` 并重启 Gateway 网关。终端要求使用 `operator.admin` 连接，并在活动智能体工作区中打开主机 PTY。新选项卡会跟随当前选中的聊天智能体。

<Warning>
终端是一个不受限制的主机 shell，并会继承 Gateway 网关进程环境。仅应在受信任的操作员部署中启用。OpenClaw 拒绝为配置了 `sandbox.mode: "all"` 的智能体创建终端会话；将活动智能体更改为该模式会关闭其现有和正在建立的终端会话。
</Warning>

使用 **Ctrl + backtick** 切换停靠面板。布局支持停靠在底部或右侧，会随浏览器视口调整大小，并保留多个 shell 选项卡。有关 `gateway.terminal.enabled` 和可选的 `gateway.terminal.shell` 覆盖项，请参阅 [Gateway 配置](/zh-CN/gateway/configuration-reference#gateway)。

会话可在断开连接后继续存活：页面重新加载、笔记本电脑休眠或网络短暂中断时，Gateway 网关会分离会话而不是终止会话；重新连接后，同一浏览器选项卡会重新附加，并重放最近的输出。分离的会话会在 `gateway.terminal.detachedSessionTimeoutSeconds` 后被终止（默认 300 秒；`0` 会恢复为断开连接即终止）。`terminal.list` 显示可附加的会话，`terminal.attach` 接管其中一个会话（类似 tmux 的接管），`terminal.text` 则以纯文本读取会话的最近输出而无需附加——这是为智能体/工具提供的便利功能。

终端也可通过 `/?view=terminal` 作为全屏、仅终端的文档使用。iOS 和 Android 应用会在其 Terminal 屏幕中嵌入此页面，并复用已存储的 Gateway 网关凭据；可用性遵循相同的 `gateway.terminal.enabled` 和 `operator.admin` 门控，当连接的 Gateway 网关不提供终端时，页面会显示通知。

## 浏览器面板

Control UI 提供可停靠的浏览器面板，可在任何普通 Web 浏览器中呈现由 Gateway 网关控制的浏览器（即智能体通过 [浏览器工具](/zh-CN/tools/browser-control) 操作的同一浏览器），无需原生 webview。当连接的 Gateway 网关向 `operator.admin` 连接公布 `browser.request` 时，该面板会出现；会话工作区侧边栏中的地球按钮可切换该面板。面板显示实时页面快照，并提供选项卡、可编辑 URL 栏、后退/前进/重新加载和在你的浏览器中打开功能；它可停靠在右侧或底部，并会将点击、滚轮滚动和基本键入操作转发到远程页面。

两种捕获模式可为智能体打包页面上下文：

- **标注（铅笔）**：在页面上自由绘制标记。**发送到聊天**会将笔画合成到屏幕截图中，把图像附加到当前聊天输入框，并预填一条提示词，其中描述页面 URL、标题和每个标记区域，让智能体准确了解你圈出了什么。
- **检查（指针）**：悬停可查看光标下方的元素（选择器、无障碍名称、角色、尺寸）；点击可通过同一输入框流程发送该元素的详细信息以及带高亮的屏幕截图。检查、滚轮滚动以及后退/前进功能需要启用 `browser.evaluateEnabled`（默认启用）。

对于在仪表盘中点击的链接，macOS 应用会保留其原生链接浏览器侧边栏；浏览器面板也可在其中使用，并且是在所有其他平台上标注页面的方式。

## 聊天行为

  <AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` 是**非阻塞的**：它会立即以 `{ runId, status: "started" }` 确认，响应则通过 `chat` 事件流式传输。受信任的 Control UI 客户端还可接收可选的 ACK 计时元数据，用于本地诊断。
    - 聊天上传支持图片和非视频文件。图片保留原生图片路径；其他文件存储为托管媒体，并在历史记录中显示为附件链接。
    - 使用相同的 `idempotencyKey` 重新发送时，运行期间返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
    - 为确保 UI 安全，`chat.history` 响应有大小限制。当对话记录条目过大时，Gateway 网关可能会截断较长的文本字段、省略较大的元数据块，并用占位符（`[chat.history omitted: message too large]`）替换超大消息。
    - 当可见的助手消息在 `chat.history` 中被截断时，侧边阅读器可按需通过 `chat.message.get` 获取完整的、经过显示规范化的对话记录条目，具体依据为 `sessionKey`、必要时的活动 `agentId`，以及对话记录 `messageId`。如果 Gateway 网关仍无法返回更多内容，阅读器会显示明确的不可用状态，而不是静默地重复已截断的预览。
    - 助手生成的图片会持久化为托管媒体引用，并通过经过身份验证的 Gateway 网关媒体 URL 返回，因此重新加载不依赖聊天历史响应中继续保留原始 base64 图片载荷。
    - 渲染 `chat.history` 时，Control UI 会从可见的助手文本中移除仅用于显示的内联指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和被截断的工具调用块），以及泄漏的 ASCII/全角模型控制令牌。如果助手条目的全部可见文本仅为精确的静默令牌 `NO_REPLY` / `no_reply` 或 Heartbeat 确认令牌 `HEARTBEAT_OK`，则会省略该条目。
    - 在发送进行期间及最终刷新历史记录时，如果 `chat.history` 短暂返回较旧的快照，聊天视图会继续显示本地乐观更新的用户/助手消息；Gateway 网关历史记录追上后，规范对话记录会替换这些本地消息。
    - 实时 `chat` 事件表示投递状态，而 `chat.history` 根据持久化的会话对话记录重建。工具最终事件发生后，Control UI 会重新加载历史记录，并仅合并一小段乐观更新的尾部内容；对话记录边界记录在 [WebChat](/zh-CN/web/webchat) 中。
    - `chat.inject` 会向会话对话记录附加一条助手备注，并广播 `chat` 事件以实现仅限 UI 的更新（不运行智能体，也不进行渠道投递）。
    - 侧边栏按智能体分区，以及已固定/渠道/工作/自定义/聊天分组列出每个已加载的活动会话，并提供一个统一的“新建会话”操作来打开草稿对话框。打开可见行只会移动高亮。自定义组可折叠并可通过拖动重新排序，会话可拖放到某个组或聊天分组中；组名和顺序通过 Gateway 网关同步，而折叠状态保留在浏览器中。新的仪表板会话会异步根据其第一条非命令消息生成简洁标题；明确指定的名称绝不会被替换。设置 `agents.defaults.utilityModel`（或 `agents.list[].utilityModel`），可将这次独立的模型调用路由到成本更低的模型。展开另一个智能体分区可浏览该智能体的会话，而不会离开当前打开的聊天。
    - 会话搜索位于命令面板中（⌘K，或侧边栏顶部的“搜索”字段）：输入查询后，它会在各智能体之间遍历有限数量的匹配页面，过滤内部子会话/cron 行，并在导航命令旁列出可见的匹配项。“会话”页面仍提供包含筛选器的完整可搜索列表。
    - 每个侧边栏行都保留直接固定入口，以及用于未读状态、重命名、派生、分组、归档和删除的完整上下文菜单。多选行（按住 Cmd/Ctrl 单击，按住 Shift 单击可选择范围）会显示批量菜单，其中包含未读状态、分组、归档和删除；除非每个选中的会话都可归档，否则批量归档/删除保持禁用。活动运行和智能体的主会话无法归档。归档或删除当前选中的会话后，聊天会切回该智能体的主会话。
    - 在 macOS 应用中，OpenClaw 标志使用窗口控件旁原本为空的原生标题栏区域，而不会占用侧边栏的一行。
    - 在桌面宽度下，聊天控件保持在一个紧凑行中，并在向下滚动对话记录时收起；向上滚动、返回顶部或到达底部时，控件会恢复显示。
    - 连续重复的纯文本消息会渲染为一个气泡，并带有数量徽标。包含图片、附件、工具输出或 Canvas 预览的消息不会折叠。
    - 当会话的检出目录位于 GitHub 仓库的非默认分支上时，聊天视图会在编辑器上方固定拉取请求信息块：PR 编号、仓库、分支、差异计数、CI 状态胶囊，以及草稿/已合并/已关闭状态，每项均链接到该 PR。该行最多显示两个信息块，并优先显示活动（开放/草稿）PR；“显示更多”按钮可展开已折叠的已合并/已关闭历史记录。CI 状态胶囊会打开一个小型 CI 监控弹出窗口，其中显示已通过/失败/运行中/已跳过的检查数量，以及指向 PR 检查页面的链接。检测通过 `controlUi.sessionPullRequests` 在服务器端运行，并在已设置时复用 Gateway 网关的 `GH_TOKEN`/`GITHUB_TOKEN`。达到 GitHub API 速率限制时，信息块会保留最后已知状态，并显示状态可能已过期的警告；关闭某个信息块会在当前浏览器配置文件中为该会话隐藏它。在存在任何 PR 之前，该行会显示分支本身——仓库、分支名称，以及相对于默认分支合并基点的差异大小 +/−（包括已提交和未提交的工作）——并提供“创建 PR”按钮，用于打开 GitHub 的新建拉取请求页面。推送的分支拥有可比较的提交后，该行就会出现；存在开放或草稿 PR 时则自动隐藏。分支行仅来自本地 git，因此在 GitHub 受到速率限制时仍然可用；它也会显示相同的状态过期警告，因为在限制重置之前不能确信“未找到 PR”。
    - 会话差异面板显示会话检出目录实际发生的更改：分支按钮（位于工作区侧栏标题、拆分窗格标题或单窗格聊天中的浮动按钮）会打开详情面板，按文件显示相对于检出目录默认分支合并基点的分支、未提交和未跟踪工作差异——包括状态圆点、重命名箭头、每个文件的 +/− 计数、可折叠文件，以及代码块之间的“N 行未修改”标记。差异通过 `sessions.diff` Gateway 网关方法（`operator.read` 作用域）在服务器端计算；二进制文件和超大文件会降级为仅包含统计信息的条目，且仅当连接的 Gateway 网关声明支持 `sessions.diff` 时才显示该按钮。
    - 每个聊天窗格中的会话工作区侧栏会列出会话文件、项目文件和工件。默认停靠在窗格右侧；拖动其标题（或使用停靠按钮）可将其移到底部，该选择会存储在当前浏览器配置文件中。折叠后的侧栏完全不占空间：可使用 ⇧⌘B、拆分窗格标题中的文件切换按钮，或单窗格聊天中的浮动文件按钮重新打开它（后两者都带有已更改文件数量徽标）。独立的文件、工具和 Canvas 详情面板不受影响。
    - 单击聊天中的文件引用、展开的读取/编辑/写入工具卡片中的文件路径，或工作区侧栏中的文件行，会打开文件详情面板：这是一个基于 CodeMirror 的代码视图，提供语法高亮、行号、跳转到行、文件内搜索、复制操作，以及在外部编辑器中打开的菜单。当 Gateway 网关向 `operator.admin` 连接声明支持 `sessions.files.set` 时，面板会添加编辑模式，支持脏状态跟踪和使用 Cmd/Ctrl-S 保存；在当前浏览器标签页中，未保存的草稿会在文件、面板和会话导航之间保留，直到明确保存或丢弃。保存基于 `sessions.files.get` 返回的内容哈希执行比较并交换：如果文件自加载后在磁盘上发生变化（例如智能体仍在继续工作），面板会显示冲突通知，并提供“重新加载”（采用最新内容）和“覆盖”（保留本地编辑）操作。写入使用与读取相同的 fs-safe 工作区保护措施——路径包含检查、拒绝符号链接/硬链接，以及 256 KB UTF-8 上限——且只能覆盖现有文件；编辑器绝不会创建或删除文件。
    - 每个聊天窗格中的后台任务侧栏会列出当前智能体的后台任务和子智能体（`tasks.list` 按智能体限定作用域，并通过 `task` 事件保持实时更新）：运行中的工作会显示实时经过时间计时器、工具使用次数、当前正在使用的工具和停止控件；可折叠的已完成部分还会显示运行时长；“查看对话记录”链接则会在窗格中打开任务的子会话。可通过拆分窗格标题中的活动切换按钮或单窗格聊天中的浮动活动按钮打开它——任务快照会预先加载，因此两者无需先打开侧栏就能显示运行中任务数量徽标。“任务”页面仍然是跨智能体的完整记录。
    - 工作区侧栏、后台任务侧栏和详情面板会根据各窗格自身的宽度而非窗口宽度进行调整：在狭窄窗格或紧凑窗口中，两个侧栏都会显示为底部条带（窗格变宽前，侧边停靠控件会隐藏；当只能容纳一列时，工作区侧栏优先占用侧边位置），详情面板则会堆叠在线程下方，并使用水平调整大小手柄，而不是与线程共享同一行。手机尺寸的视口仍会全屏打开详情面板。
    - 聊天标题中的模型和思考选择器会通过 `sessions.patch` 立即修补活动会话；它们是持久化的会话覆盖设置，而非仅对单轮发送生效的选项。
    - **拆分视图：**从右上角的浮动切换按钮行（位于会话差异、后台任务和会话文件切换按钮旁）打开，然后向右或向下拆分活动窗格，创建布局可容纳的任意数量窗格。每个窗格都有自己的会话、对话记录、编辑器和工具流。
    - 将会话从侧边栏拖入聊天，可在窗格中将其打开。动态拖放预览会在各区域之间平滑移动并标注结果——在新窗格将占据的确切一半区域上显示“拆分”，在整个窗格上显示“在此处打开”——单窗格模式也支持拖放。
    - 活动拆分窗格决定侧边栏选择和 URL。每个窗格都有自己的标题行，其中包含会话标题，以及工作区侧栏、拆分和关闭控件；分隔线可调整列和堆叠窗格的大小，浏览器会将布局存储在本地并在重新加载后保留。
    - 在窄屏幕上，拆分视图会保留布局，但只渲染活动窗格，包括带关闭控件的标题。
    - 如果同一会话的模型选择器更改仍在保存时发送消息，编辑器会等待该会话修补完成，再调用 `chat.send`，以确保发送使用选定的模型。
    - 输入 `/new` 会创建并切换到与“新建聊天”相同的全新仪表板会话，但如果已配置 `session.dmScope: "main"` 且当前父会话是智能体的主会话，则会就地重置主会话。输入 `/reset` 会保留 Gateway 网关对当前会话的显式就地重置。
    - 聊天模型选择器会请求 Gateway 网关配置的模型视图。如果存在 `agents.defaults.models`，该允许列表会驱动选择器，其中包括保持提供商作用域目录动态更新的 `provider/*` 条目。否则，选择器会显示明确的 `models.providers.*.models` 条目，以及拥有可用身份验证的提供商。完整目录仍可通过调试用的 `models.list` RPC 和 `view: "all"` 获取。
    - 当最新的 Gateway 网关会话用量报告包含当前上下文 token 数时，聊天编辑器工具栏会显示一个小型上下文用量环，并标出已用百分比。打开该用量环可查看当前上下文窗口、最近一次运行的 token 数和估算总成本、提供商/模型标识，以及在提供商报告时显示其最新响应的输入/输出/缓存成本明细。当上下文压力较高时，该用量环会切换为警告样式；达到建议的压缩级别时，还会显示一个紧凑按钮，用于运行常规的会话压缩流程。过期的 token 快照会被隐藏，直到 Gateway 网关再次报告最新用量。

  </Accordion>
  <Accordion title="Talk 模式（浏览器实时语音）">
    Talk 模式使用已注册的实时语音提供商。配置 OpenAI 时，请使用 `talk.realtime.provider: "openai"`，并提供 `openai` API 密钥配置文件、`talk.realtime.providers.openai.apiKey` 或 `OPENAI_API_KEY`。OpenAI Realtime 使用公共 Platform API，并且需要 Platform API 密钥；Codex OAuth 登录无法满足此接口的要求。配置 Google 时，请使用 `talk.realtime.provider: "google"`，并提供 `talk.realtime.providers.google.apiKey`。浏览器永远不会收到标准的提供商 API 密钥：OpenAI 会收到用于 WebRTC 的临时 Realtime 客户端密钥；Google Live 会收到一个一次性、受约束的 Live API 身份验证令牌，用于浏览器 WebSocket 会话，其中的指令和工具声明由 Gateway 网关锁定在令牌中。仅提供后端实时桥接的提供商通过 Gateway 网关中继传输运行，因此凭据和供应商套接字保留在服务器端，而浏览器音频则通过经过身份验证的 Gateway RPC 传输。Realtime 会话提示词由 Gateway 网关组装；`talk.client.create` 不接受调用方提供的指令覆盖。

    持久化的提供商、模型、语音、传输方式、推理强度、精确的 VAD 阈值、静默时长和前缀填充默认值位于 **Settings → Communications → Talk**；更改这些设置需要 `operator.admin` 访问权限。配置 Gateway 网关中继会强制使用后端中继路径；配置 WebRTC 则会让会话归客户端所有，并且当提供商无法创建浏览器会话时直接失败，而不会静默回退到中继。

    Talk 控件本身是编辑器工具栏中的麦克风按钮。其插入符菜单会列出 **System default** 以及浏览器公开的每个麦克风，包括 USB、蓝牙和虚拟输入设备。所选设备 ID 仅保留在浏览器本地，绝不会发送到 Gateway 网关；如果该确切设备消失，Talk 会要求你选择其他输入设备，而不会静默改用另一个麦克风录音。Talk 处于活动状态时，麦克风按钮会变成一个显示实时输入电平表的胶囊按钮；单击它会停止语音输入，将鼠标悬停在其上会显示停止图标。当实时工具调用通过 `talk.client.toolCall` 使用已配置的更大模型进行查询时，屏幕阅读器会播报 `Connecting voice input...`、`Listening...` 或 `Asking OpenClaw...`。停止正在运行的智能体响应仍使用胶囊按钮旁边单独的方形 **Stop** 控件。

    维护者实时冒烟测试：`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 会验证 OpenAI 后端 WebSocket 桥接、OpenAI 浏览器 WebRTC SDP 交换、Google Live 受约束令牌的浏览器 WebSocket 设置，以及使用模拟麦克风媒体的 Gateway 网关中继浏览器适配器。该命令仅输出提供商状态，不会记录密钥。

  </Accordion>
  <Accordion title="停止和中止">
    - 单击 **Stop**（调用 `chat.abort`）。
    - 运行处于活动状态时，普通的后续消息会进入队列。单击队列中消息的 **Steer**，可将该后续消息注入正在运行的轮次。
    - 输入 `/stop`（或独立的中止短语，如 `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop`）以带外方式中止。
    - `chat.abort` 支持使用 `{ sessionKey }`（不含 `runId`）中止该会话的所有活动运行。

  </Accordion>
  <Accordion title="中止时保留部分内容">
    - 运行中止后，部分助手文本仍可显示在 UI 中。
    - 存在已缓冲输出时，Gateway 网关会将中止的部分助手文本持久化到对话记录历史中。
    - 持久化条目包含中止元数据，以便对话记录使用方区分中止的部分内容和正常完成的输出。

  </Accordion>
</AccordionGroup>

## 连接断开与重新连接

会话建立后，Gateway 网关连接断开不会将你注销。仪表板
仍保持可见，顶部栏下方会显示一个浮动的琥珀色“Gateway 网关连接已断开 — 正在重新连接…”胶囊提示，同时客户端会以退避策略自动重试（从 800 ms 到最长 15 s）。实时更新和
实时/会话操作会暂停，直到连接恢复；胶囊提示中的 **Retry now** 会强制
立即尝试。聊天内容仍可编辑：普通文本和附件发送会保存在
当前标签页中按 Gateway 网关/会话划分的浏览器存储中，并显示为等待重新连接，
Gateway 网关恢复后会自动发送。离线期间，实时控件和斜杠命令仍不可用。

当此浏览器已持有凭据（已配置的令牌/密码或已获批准的设备
令牌）时，首次打开和重新加载会在连接
建立期间显示一个小型动态 OpenClaw 标志，而不会短暂闪现登录界面。仅当尚未存储任何凭据，
或 Gateway 网关主动拒绝凭据（令牌/密码错误、配对已撤销）时，才会显示登录界面——
这些状态需要你进行操作，而不是继续等待。

## PWA 安装和 Web Push

Control UI 提供 `manifest.webmanifest` 和 Service Worker，因此现代浏览器可以将其安装为独立 PWA。通过 Web Push，即使标签页或浏览器窗口未打开，Gateway 网关也能唤醒已安装的 PWA 并发送通知。

如果 OpenClaw 更新后页面立即显示 **Protocol mismatch**，请先使用 `openclaw dashboard` 重新打开仪表板并进行强制刷新。如果仍然失败，请清除仪表板来源的站点数据，或在浏览器隐私窗口中进行测试；旧标签页或浏览器 Service Worker 缓存可能会继续运行更新前的 Control UI 软件包，并连接到较新的 Gateway 网关。

| 界面                                                  | 作用                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 清单。浏览器在其可访问后会提供“Install app”选项。               |
| `ui/public/sw.js`                                     | 处理 `push` 事件和通知点击的 Service Worker。                       |
| `push/vapid-keys.json`（位于 OpenClaw 状态目录下）    | 自动生成的 VAPID 密钥对，用于签署 Web Push 载荷。                   |
| `push/web-push-subscriptions.json`                    | 持久化的浏览器订阅端点。                                           |

如果需要固定密钥（用于多主机部署、密钥轮换或测试），可通过 Gateway 网关进程的环境变量覆盖 VAPID 密钥对：

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`（默认为 `https://openclaw.ai`）

Control UI 使用以下受权限范围限制的 Gateway 网关方法注册和测试浏览器订阅：

- `push.web.vapidPublicKey` 获取当前使用的 VAPID 公钥。
- `push.web.subscribe` 注册一个 `endpoint` 以及 `keys.p256dh`/`keys.auth`。
- `push.web.unsubscribe` 移除已注册的端点。
- `push.web.test` 向调用方的订阅发送测试通知。

<Note>
Web Push 独立于 iOS APNS 中继路径（有关中继支持的推送，请参阅[配置](/zh-CN/gateway/configuration)）以及面向原生移动设备配对的 `push.test` 方法。
</Note>

## 托管嵌入内容

助手消息可以使用 `[embed ...]` 短代码以内联方式呈现托管的 Web 内容。iframe 沙箱策略由 `gateway.controlUi.embedSandbox` 控制：

内置 Canvas 插件还提供 [`show_widget`](/zh-CN/tools/show-widget)，用于直接通过工具调用呈现自包含的 SVG 或 HTML。浏览器会声明 `inline-widgets` Gateway 网关能力，生成的 Canvas 文档在聊天历史重新加载后仍然可用。来自渠道的运行不会获得此工具。

<Tabs>
  <Tab title="严格">
    禁止在托管嵌入内容中执行脚本。
  </Tab>
  <Tab title="脚本（默认）">
    允许交互式嵌入内容，同时保持来源隔离；这通常足以支持自包含的浏览器游戏/微件。
  </Tab>
  <Tab title="可信">
    在 `allow-scripts` 的基础上为有意需要更高权限的同站点文档添加 `allow-same-origin`。
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

聊天记录使用与编辑器对齐、居中且易于阅读的框架。在该框架中，助手和工具输出保持左对齐，而用户气泡保持右对齐。宽屏显示器部署可以通过设置 `gateway.controlUi.chatMessageMaxWidth` 覆盖聊天记录宽度，而无需修改内置 CSS：

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

该值在到达浏览器前会经过验证。支持的形式包括普通长度和百分比，如 `960px` 或 `82%`，以及受约束的 `min(...)`、`max(...)`、`clamp(...)`、`calc(...)` 和 `fit-content(...)` 宽度表达式。

## Tailnet 访问（推荐）

<Tabs>
  <Tab title="集成式 Tailscale Serve（首选）">
    让 Gateway 网关保持在回环地址上，并由 Tailscale Serve 通过 HTTPS 进行代理：

    ```bash
    openclaw gateway --tailscale serve
    ```

    打开 `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）。

    默认情况下，当 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket Serve 请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行身份验证。OpenClaw 会使用 `tailscale whois` 解析 `x-forwarded-for` 地址并将其与该标头进行匹配，以验证身份；并且仅当请求通过回环地址到达且包含 Tailscale 的 `x-forwarded-*` 标头时才接受这些身份信息。对于具有浏览器设备身份的 Control UI 操作员会话，此经过验证的 Serve 路径还会跳过设备配对往返流程；没有设备身份的浏览器和节点角色连接仍遵循正常的设备检查。如果即使是 Serve 流量也要求使用显式共享密钥凭据，请设置 `gateway.auth.allowTailscale: false`，然后使用 `gateway.auth.mode: "token"` 或 `"password"`。

    对于该异步 Serve 身份路径，同一客户端 IP 和身份验证范围的失败身份验证尝试会在写入速率限制前串行处理。因此，同一浏览器并发发起的错误重试可能会在第二个请求上显示 `retry later`，而不是让两个普通的不匹配请求并行竞争。

    <Warning>
    无令牌的 Serve 身份验证假定 Gateway 网关主机可信。如果该主机上可能运行不受信任的本地代码，请要求使用令牌/密码身份验证。
    </Warning>

  </Tab>
  <Tab title="绑定到 tailnet + 令牌">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    打开 `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）。

    将匹配的共享密钥粘贴到 UI 设置中（作为 `connect.params.auth.token` 或 `connect.params.auth.password` 发送）。

  </Tab>
</Tabs>

## 不安全的 HTTP

如果通过普通 HTTP（`http://<lan-ip>` 或 `http://<tailscale-ip>`）打开仪表板，浏览器会在**非安全上下文**中运行并阻止 WebCrypto。默认情况下，OpenClaw 会**阻止**没有设备身份的 Control UI 连接。

已记录的例外情况：

- 仅限 localhost 的不安全 HTTP 兼容模式，需设置 `gateway.controlUi.allowInsecureAuth=true`
- 通过 `gateway.auth.mode: "trusted-proxy"` 成功完成操作员 Control UI 身份验证
- 紧急情况下使用 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推荐修复方法：**使用 HTTPS（Tailscale Serve），或在本地通过 `https://<magicdns>/`（Serve）或 `http://127.0.0.1:18789/`（在 Gateway 网关主机上）打开 UI。

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

    `allowInsecureAuth` 只是一个本地兼容性开关：

    - 它允许 localhost 上的 Control UI 会话在非安全 HTTP 上下文中无需设备身份即可继续。
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
    `dangerouslyDisableDeviceAuth` 会禁用 Control UI 设备身份检查，导致安全性严重降低。紧急使用后请尽快还原。
    </Warning>

  </Accordion>
  <Accordion title="可信代理说明">
    - 成功的可信代理身份验证可以允许没有设备身份的 **operator** Control UI 会话接入。
    - 这**不**适用于 node 角色的 Control UI 会话。
    - 同一主机上的环回反向代理仍不满足可信代理身份验证要求；请参阅[可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth)。

  </Accordion>
</AccordionGroup>

有关 HTTPS 设置指南，请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

## 内容安全策略

Control UI 提供严格的 `img-src` 策略：仅允许**同源**资源、`data:` URL 和本地生成的 `blob:` URL。浏览器会拒绝远程 `http(s)` 和协议相对图片 URL，且绝不会发起网络请求。

实际行为如下：

- 通过相对路径提供的头像和图片（例如 `/avatars/<id>`）仍可呈现，包括由 UI 获取并转换成本地 `blob:` URL 的需身份验证头像路由。
- 内联 `data:image/...` URL 仍可呈现。
- Control UI 创建的本地 `blob:` URL 仍可呈现。
- GitHub 链接预览头像由 Gateway 网关从 GitHub 的固定头像主机获取，并以大小受限的 `data:` URL 返回；操作员的浏览器绝不会连接远程头像主机。
- 渠道元数据提供的远程头像 URL 会在 Control UI 的头像辅助函数中被移除，并替换为内置徽标/徽章，因此遭到入侵或恶意的渠道无法强制操作员浏览器发起任意远程图片请求。

此策略始终启用，且不可配置。

## 头像路由身份验证

配置 Gateway 网关身份验证后，Control UI 头像端点需要使用与 API 其余部分相同的 Gateway 网关令牌：

- `GET /avatar/<agentId>` 仅向已通过身份验证的调用方返回头像图片。`GET /avatar/<agentId>?meta=1` 按照相同规则返回头像元数据。
- 对任一路由的未通过身份验证请求都会被拒绝（与同级的智能体助手媒体路由一致），因此头像路由不会在其他方面受到保护的主机上泄露智能体身份。
- Control UI 获取头像时会将 Gateway 网关令牌作为 bearer 请求头转发，并使用经过身份验证的 blob URL，使图片仍能在仪表板中呈现。

如果禁用 Gateway 网关身份验证（不建议在共享主机上这样做），头像路由也会与 Gateway 网关其余部分一样变为无需身份验证。

## 智能体助手媒体路由身份验证

配置 Gateway 网关身份验证后，智能体助手的本地媒体预览采用两步路由：

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` 需要常规的 Control UI 操作员身份验证；浏览器检查可用性时会将 Gateway 网关令牌作为 bearer 请求头发送。
- 成功的元数据响应包含一个仅适用于该确切源路径的短期 `mediaTicket`。
- 浏览器呈现的图片、音频、视频和文档 URL 使用 `mediaTicket=<ticket>`，而不是有效的 Gateway 网关令牌或密码。该票据会迅速过期，且无法授权访问其他来源。

这样既能保持媒体呈现与浏览器原生媒体元素兼容，又不会将可重复使用的 Gateway 网关凭据放入可见的媒体 URL 中。

## 审批链接

操作员审批通知可以深度链接到保留的 `${controlUiBasePath}/approve/{approvalId}` 命名空间下提供的独立审批文档（例如 `/approve/<approvalId>`；配置基础路径时则为 `/openclaw/approve/<approvalId>`）。该 URL 在审批的整个有效期内保持稳定，可以安全地在你自己的设备之间转发：它只标识审批，绝不会对审批进行授权。

- Gateway 网关会在插件 HTTP 路由之前为**所有** HTTP 方法保留单路径段的 `/approve/<approvalId>` 命名空间，因此插件路由绝不可能遮蔽或拦截审批文档。
- 打开审批文档需要与 Control UI 其余部分相同的 Gateway 网关身份验证（令牌/密码、Tailscale Serve 身份或可信代理身份）；凭据绝不会成为审批 URL 的一部分。
- 禁用 Control UI 服务后，对该命名空间的请求会返回 `404`，而不会继续交由插件处理程序处理。
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

如果浏览器加载了空白仪表板，且 DevTools 中没有显示有用的错误，可能是某个扩展或较早运行的内容脚本阻止了 JavaScript 模块应用执行。静态页面中包含一个纯 HTML 恢复面板；如果启动后未注册 `<openclaw-app>`，该面板便会出现。

更改浏览器环境后，使用面板中的 **Try again** 操作，或在完成以下检查后手动重新加载：

- 禁用会向所有页面注入内容的扩展，尤其是包含 `<all_urls>` 内容脚本的扩展。
- 尝试使用隐私窗口、全新的浏览器配置文件或其他浏览器。
- 保持 Gateway 网关运行，并在更换浏览器后验证同一个仪表板 URL。

## 调试/测试：开发服务器 + 远程 Gateway 网关

Control UI 由静态文件组成；WebSocket 目标可以配置，也可以与 HTTP 来源不同。当你希望在本地运行 Vite 开发服务器，而 Gateway 网关在其他位置运行时，这非常方便。

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
    - 加载后，`gatewayUrl` 会存储在 localStorage 中，并从 URL 中移除。
    - 如果通过 `gatewayUrl` 传递完整的 `ws://` 或 `wss://` 端点，请对值进行 URL 编码，以便浏览器正确解析查询字符串。
    - 应尽可能通过 URL 片段（`#token=...`）传递 `token`。片段不会发送到服务器，因此可以避免请求日志和 Referer 泄露。为了兼容，旧版 `?token=` 查询参数仍会被导入一次，但仅作为后备方案，并会在引导启动后立即移除。
    - `password` 仅保存在内存中。
    - 设置 `gatewayUrl` 后，UI 不会回退到配置或环境凭据。请显式提供 `token`（或 `password`）；缺少显式凭据会导致错误。
    - 当 Gateway 网关位于 TLS 后方（Tailscale Serve、HTTPS 代理等）时，请使用 `wss://`。
    - 为防止点击劫持，仅顶层窗口（非嵌入窗口）可以接受 `gatewayUrl`。
    - 面向公网且非环回地址的 Control UI 部署必须显式设置 `gateway.controlUi.allowedOrigins`（完整来源）。来自环回地址、RFC1918/链路本地地址、`.local`、`.ts.net` 或 Tailscale CGNAT 主机的私有同源 LAN/Tailnet 加载，无需启用 Host 请求头后备模式即可接受。
    - Gateway 网关启动时，可能会根据实际运行时绑定地址和端口填充 `http://localhost:<port>` 和 `http://127.0.0.1:<port>` 等本地来源，但远程浏览器来源仍需显式配置。
    - 除非进行严格受控的本地测试，否则不要使用 `gateway.controlUi.allowedOrigins: ["*"]`；它表示允许任何浏览器来源，而不是“匹配我正在使用的任意主机”。
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 请求头来源后备模式，但这是一种危险的安全模式。

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
