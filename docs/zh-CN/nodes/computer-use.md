---
read_when:
    - 让 Gateway 网关智能体查看并控制 Mac 桌面
    - 计算机使用的启用、权限或安全性
    - 扩展 computer.act 节点命令或其执行器
summary: 通过计算机工具和 `computer.act` 节点命令，在已配对的 macOS 节点上进行智能体驱动的桌面控制
title: 计算机使用
x-i18n:
    generated_at: "2026-07-12T14:34:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

计算机使用功能让 Gateway 网关智能体能够查看和控制已配对的 **macOS** 桌面：它使用现有的 `screen.snapshot` 节点命令截取屏幕截图，并通过单个危险节点命令 `computer.act` 驱动指针和键盘。操作集遵循 Anthropic 核心计算机使用操作；不提供可选的 `computer_20251124` 缩放功能。支持视觉的模型通过内置的 `computer` 智能体工具驱动它。

智能体只会发出统一命令 `computer.act`；它无法得知节点如何执行该命令。macOS 节点使用嵌入式 Peekaboo 服务和有限的 CoreGraphics 原语在进程内执行 `computer.act`（需要正确的 TCC 权限，无额外进程）。其他平台以后可以执行相同命令，而无需更改面向智能体的契约。

## 要求

- 已配对的 **macOS** 节点（以节点模式运行的 OpenClaw macOS 应用）。
- 已启用 macOS 应用设置 **Allow Computer Control**（默认：关闭）。
- 已向 OpenClaw 授予 macOS **Accessibility** 权限（用于注入指针/键盘操作）和 **Screen Recording** 权限（用于 `screen.snapshot`）。
- 已在 Gateway 网关上启用 `computer.act` 命令（该命令很危险，默认未启用）。
- 支持视觉的智能体模型。
- 公开 `computer` 的工具策略。默认 `coding` 配置文件不公开该工具。将 `computer` 添加到 `tools.alsoAllow`；沙箱隔离的智能体还需将其添加到 `tools.sandbox.tools.alsoAllow`。

## `computer` 智能体工具

内置 `computer` 工具每次调用接受一个操作。坐标是最近一次屏幕截图中的非负整数像素；节点会将其映射为显示器点坐标。坐标操作必须回传屏幕截图结果的 `frameId`，显式指定的 `screenIndex` 必须与该帧匹配。OpenClaw 还会将节点在屏幕截图中提供的显示器标识传入操作，因此显示器重新连接或几何结构发生变化时，操作将以失败关闭方式处理，而不会静默地重新定位到相同索引。这些检查会拒绝猜测的令牌，以及来自其他已传递帧或显示器的令牌。令牌并不保证新鲜度：截取后，应用仍可能更改同一显示器上的像素，因此只要场景可能发生变化，就应截取新的屏幕截图。

- 读取：`screenshot`。
- 指针：`left_click`、`right_click`、`middle_click`、`double_click`、`triple_click`、`mouse_move`、`left_click_drag`（带 `startCoordinate`）、`left_mouse_down`、`left_mouse_up`。
- 滚动：`scroll`，带 `scrollDirection`（`up|down|left|right`）和 `scrollAmount`（滚轮刻度数）。
- 键盘：`type`（文本）、`key`（例如 `cmd+shift+t` 或 `Return` 的组合键）、`hold_key`（将 `text` 组合键按住 `duration` 秒）。
- 节奏控制：`wait`（`duration` 秒）。

修饰键通过点击和滚动操作的 `text` 字段传递（`shift`、`ctrl`、`alt`、`cmd`）。执行输入操作后，工具会返回新的屏幕截图，以便模型观察结果。如果连接了多个支持计算机操作的节点，请显式传入 `node`。

屏幕截图仅供**模型使用**：绝不会自动发送到聊天渠道。应将屏幕上的所有内容视为不可信输入；工具会警告模型不要遵循与用户请求冲突的屏幕指令。

## `computer.act` 节点命令

`computer.act` 是该工具用于路由输入的唯一节点命令（通过带有 `command: "computer.act"` 的 `node.invoke`）。它具有以下特性：

- **默认危险**：列于内置危险节点命令中，并且在显式启用前不包含在运行时允许列表中。macOS 节点仍可在配对时声明它，以便只需批准该能力一次。
- 目前**仅支持 macOS**：只有启用了 **Allow Computer Control** 的 macOS 节点才会公开该命令。

读取操作复用 `screen.snapshot`；不存在第二条捕获路径。有关共享捕获命令，请参阅[摄像头和屏幕节点](/zh-CN/nodes/camera)。

## 启用并授权

1. 在 macOS 应用中启用 **Settings → Allow Computer Control**。然后打开 **Settings → Permissions**，并在 macOS 系统设置中授予 **Accessibility** 和 **Screen Recording** 权限。
2. 在 Gateway 网关上批准配对更新（新增命令会强制重新配对）。
3. 向支持视觉的智能体公开该工具。对于默认 `coding` 配置文件：

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // 沙箱隔离的智能体也需要通过第二道门控：
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. 在限定时间窗口内启用 `computer.act`。`phone-control` 插件提供了 `computer` 组：

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   启用操作需要 `operator.admin`（或所有者）权限，并会自动过期。旧版 `/phone arm all` 组有意排除桌面控制；请使用显式的 `computer` 组。启用操作仅切换 Gateway 网关可以调用的命令；macOS 应用仍会强制执行其 **Allow Computer Control** 设置和操作系统权限。

如需永久授权，请将 `computer.act` 添加到 `gateway.nodes.allowCommands`，**并将其从** `gateway.nodes.denyCommands` **中移除**；拒绝列表优先。永久授权不会自动过期。执行 `/phone arm` 前已存在的条目会在 `/phone disarm` 后保留；临时授权处于启用状态时，请勿将其转换为永久授权。

授权被有意拆分为启用和使用两个环节。启用或
永久配置 `computer.act` 需要管理员权限。
启用后，具有 `operator.write` 权限且已通过身份验证的操作员可以通过
`node.invoke` 调用 `computer.act`，直到授权过期或被停用；
每个操作不会单独执行管理员权限检查。批准声明了
`computer.act` 的节点只会记录该能力，以便以后启用，
本身不会启用调用。

## 安全性

- 授权前，每一层（工具策略、Gateway 网关命令策略、macOS 设置、Accessibility 和 Screen Recording）都必须同意。启用后，操作会在没有逐项确认的情况下执行，直到授权过期或执行 `/phone disarm`。
- 文本输入按字素逐个发送。取消、断开连接、暂停、禁用或替换端点会使其在发送下一个字素前停止，而不会让过期的剩余内容继续发送。
- 屏幕截图仅供模型使用，绝不会自动发送到聊天渠道（问题 [#44759](https://github.com/openclaw/openclaw/issues/44759)）。
- 将屏幕内容视为不可信输入；其中可能包含提示词注入。

## 与其他桌面控制路径的关系

这是由智能体驱动的路径。有关它与 PeekabooBridge 主机、Codex Computer Use 和直接 `cua-driver` MCP 之间的关系，请参阅 [Peekaboo bridge](/zh-CN/platforms/mac/peekaboo)。
