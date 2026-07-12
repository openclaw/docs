---
read_when:
    - 让 Gateway 网关智能体查看并控制 Mac 桌面
    - 计算机使用的启用、权限或安全措施
    - 扩展 `computer.act` 节点命令或其执行器
summary: 通过计算机工具和 `computer.act` 节点命令，在已配对的 macOS 节点上实现智能体驱动的桌面控制
title: 计算机使用
x-i18n:
    generated_at: "2026-07-11T20:41:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

计算机使用功能让 Gateway 网关智能体能够查看并控制已配对的 **macOS** 桌面：它使用现有的 `screen.snapshot` 节点命令捕获屏幕截图，并通过单个危险节点命令 `computer.act` 控制指针和键盘。操作集遵循 Anthropic 核心计算机使用操作；不公开可选的 `computer_20251124` 缩放功能。具备视觉能力的模型通过内置的 `computer` 智能体工具来驱动它。

智能体只发出一种统一命令 `computer.act`；它无法得知节点如何执行该命令。macOS 节点使用嵌入式 Peekaboo 服务以及有限的 CoreGraphics 原语在进程内执行 `computer.act`（需要正确的 TCC 权限，不会启动额外进程）。未来其他平台也可以执行相同命令，而无需更改面向智能体的契约。

## 要求

- 一个已配对的 **macOS** 节点（以节点模式运行的 OpenClaw macOS 应用）。
- 已启用 macOS 应用设置 **允许计算机控制**（默认：关闭）。
- 已向 OpenClaw 授予 macOS **Accessibility** 权限（用于注入指针和键盘输入）以及 **Screen Recording** 权限（用于 `screen.snapshot`）。
- 已在 Gateway 网关上启用 `computer.act` 命令（该命令具有危险性，默认未启用）。
- 具备视觉能力的智能体模型。
- 公开 `computer` 的工具策略。默认 `coding` 配置文件不公开该工具。将 `computer` 添加到 `tools.alsoAllow`；沙箱隔离的智能体还需要将其添加到 `tools.sandbox.tools.alsoAllow`。

## `computer` 智能体工具

内置的 `computer` 工具每次调用接受一个操作。坐标是最近一次屏幕截图中的非负整数像素值；节点会将其映射为显示器坐标点。坐标操作必须回传屏幕截图结果的 `frameId`，并且显式指定的 `screenIndex` 必须与该帧匹配。OpenClaw 还会将节点在屏幕截图中提供的显示器身份传递给操作，因此显示器重新连接或几何布局发生变化时，操作会以拒绝方式安全失败，而不会悄悄改为定位到相同的索引。这些检查会拒绝猜测出的令牌，以及来自其他已传送帧或显示器的令牌。令牌并不保证画面仍是最新状态：应用可能在捕获后更改同一显示器上的像素，因此只要场景可能发生变化，就应重新截取屏幕截图。

- 读取：`screenshot`。
- 指针：`left_click`、`right_click`、`middle_click`、`double_click`、`triple_click`、`mouse_move`、`left_click_drag`（使用 `startCoordinate`）、`left_mouse_down`、`left_mouse_up`。
- 滚动：`scroll`，包含 `scrollDirection`（`up|down|left|right`）和 `scrollAmount`（滚轮刻度数）。
- 键盘：`type`（文本）、`key`（组合键，例如 `cmd+shift+t` 或 `Return`）、`hold_key`（将 `text` 组合键按住 `duration` 秒）。
- 节奏控制：`wait`（`duration` 秒）。

点击和滚动操作通过 `text` 字段携带修饰键（`shift`、`ctrl`、`alt`、`cmd`）。执行输入操作后，工具会返回新的屏幕截图，以便模型观察结果。如果连接了多个具备计算机控制能力的节点，请显式传入 `node`。

屏幕截图仅供**模型使用**：它们绝不会自动发送到聊天渠道。应将所有屏幕内容视为不可信输入；工具会警告模型，不要遵循与用户请求相冲突的屏幕指令。

## `computer.act` 节点命令

`computer.act` 是该工具用于路由输入的唯一节点命令（通过 `node.invoke`，并设置 `command: "computer.act"`）。它具有以下特性：

- **默认具有危险性**：它被列入内置危险节点命令，并且在显式启用前不包含在运行时允许列表中。macOS 节点仍可在配对时声明该命令，以便一次性批准该能力表面。
- 目前**仅限 macOS**：只有启用了 **允许计算机控制** 的 macOS 节点才会公布该命令。

读取操作复用 `screen.snapshot`；不存在第二条捕获路径。有关共享捕获命令，请参阅[摄像头和屏幕节点](/zh-CN/nodes/camera)。

## 启用和授权

1. 在 macOS 应用中启用**设置 → 允许计算机控制**。然后打开**设置 → 权限**，并在 macOS 系统设置中授予 **Accessibility** 和 **Screen Recording** 权限。
2. 在 Gateway 网关上批准配对更新（新增命令会强制重新配对）。
3. 向具备视觉能力的智能体公开该工具。对于默认 `coding` 配置文件：

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // 沙箱隔离的智能体还需要通过第二道门控：
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. 在有限的时间窗口内启用 `computer.act`。`phone-control` 插件提供了一个 `computer` 组：

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   启用操作需要 `operator.admin` 权限（或由所有者执行），并且会自动过期。旧版 `/phone arm all` 组有意排除桌面控制；请使用显式的 `computer` 组。启用操作只切换 Gateway 网关可以调用哪些命令；macOS 应用仍会强制执行其**允许计算机控制**设置和操作系统权限。

如需持久授权，请将 `computer.act` 添加到 `gateway.nodes.allowCommands`，并将其**从** `gateway.nodes.denyCommands` **中移除**；拒绝列表优先。持久授权不会自动过期。在执行 `/phone arm` 前已经存在的条目会在 `/phone disarm` 后继续保留；临时授权处于启用状态时，不要将其转换为持久授权。

授权被有意拆分为启用能力和使用能力两个环节。启用或持久配置 `computer.act` 需要管理权限。启用后，拥有 `operator.write` 权限且已通过身份验证的操作员可以通过 `node.invoke` 调用 `computer.act`，直至授权过期或被停用；系统不会对每个操作单独检查管理员权限。批准声明 `computer.act` 的节点只会记录该能力表面，以便稍后启用，并不会自行允许调用。

## 安全性

- 授权前，每一层（工具策略、Gateway 网关命令策略、macOS 设置、Accessibility 和 Screen Recording）都必须同意。启用后，操作将在没有逐项确认的情况下执行，直至授权过期或执行 `/phone disarm`。
- 文本输入按字素逐个发送。取消、断开连接、暂停、禁用或端点替换会在发送下一个字素前停止输入，避免过期的剩余文本继续发送。
- 屏幕截图仅供模型使用，绝不会自动发送到聊天渠道（问题 [#44759](https://github.com/openclaw/openclaw/issues/44759)）。
- 将屏幕内容视为不可信输入；其中可能包含提示词注入。

## 与其他桌面控制路径的关系

这是由智能体驱动的路径。有关它与 PeekabooBridge 主机、Codex Computer Use 以及直接使用 `cua-driver` MCP 之间的关系，请参阅 [Peekaboo 桥接](/zh-CN/platforms/mac/peekaboo)。
