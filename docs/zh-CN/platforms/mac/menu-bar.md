---
read_when:
    - 调整 mac 菜单 UI 或状态逻辑
summary: 菜单栏状态逻辑以及向用户呈现的内容
title: 菜单栏
x-i18n:
    generated_at: "2026-07-05T11:30:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## 显示内容

- 当前 Agent 工作状态会显示在菜单栏图标和菜单的第一行状态中。
- 工作处于活动状态时会隐藏健康状态；所有会话空闲后会恢复显示。
- 根级“上下文”项会打开一个包含最近会话的子菜单，而不是在根菜单中展开它们。
- 根菜单中的“节点”块只列出已配对的**设备**（来自 `node.list`），不列出客户端/在线状态条目。
- 当提供商用量快照可用时，根级“用量”部分会显示在上下文下方；如有可用成本详情，则随后显示。

## 状态模型

- 来源：`WorkActivityStore`（`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`）。
- 事件以带有 `runId` 的 `ControlAgentEvent` 到达；处理器（`ControlChannel.routeWorkActivity`）从事件载荷读取 `sessionKey`，如果缺失则默认为 `"main"`。
- 优先级：主会话（默认 `sessionKey == "main"`）始终优先。如果主会话处于活动状态，它的状态会立即显示。如果主会话空闲，则改为显示最近活动的非主会话。存储不会在活动中途切换；只有当前会话变为空闲或主会话变为活动状态时才会切换。
- 活动类型：
  - `job`：高级命令执行（`state: started|streaming|done|error|...`）。
  - `tool`：带有 `name`、可选 `meta`/`args` 的 `phase: start|result`。

## IconState 枚举（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（调试覆盖）

### ActivityKind -> 徽章符号

`ActivityKind` 包装一个 `ToolKind`（`bash`、`read`、`write`、`edit`、`attach`、`other`）或一个裸 `job`。每种类型都会映射到绘制在小角色图标上的 SF Symbol 徽章（`IconState.badgeSymbolName`）：

| 类型            | 符号                               |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### 视觉映射

- `idle`：普通小角色，无徽章。
- `workingMain`：带符号的徽章，完整色调（`.primary` 强调级别），腿部“工作中”动画。
- `workingOther`：带符号的徽章，弱化色调（`.secondary` 强调级别），无快速移动。
- `overridden`：无论真实活动如何，都使用所选符号/色调。

## 上下文子菜单

- 根菜单显示一行“上下文”，带会话数量/状态；它会打开一个子菜单（`MenuSessionsInjector`）。
- 子菜单标题显示过去 24 小时内的活动会话数量。
- 每个会话行都会保留其令牌条、时间、预览、思考/详细开关、重置、压缩和删除操作。
- 加载中、已断开连接和会话加载错误消息会在上下文子菜单内渲染。
- 用量和成本部分保持在上下文下方的根级，因此无需打开子菜单也能快速查看。

## 状态行文本（菜单）

- 工作处于活动状态时：`<Session role> · <activity label>`（`MenuContentView` 中的 `"\(roleLabel) · \(activity.label)"`），其中角色标签为“主会话”或“其他”。
- 空闲时：回退到健康摘要。

## 事件摄取

- 来源：control-channel `agent` 事件，由 `ControlChannel.routeWorkActivity(from:)` 路由。
- 解析字段：
  - `stream: "job"`，带有用于启动/停止的 `data.state`。
  - `stream: "tool"`，带有 `data.phase`、`data.name`、可选 `data.meta`/`data.args`。
- 工具标签来自 `ToolDisplayRegistry.resolve(name:args:meta:)`；无法解析的名称会回退为原始工具名称。

## 调试覆盖

- 设置 > 调试 > “图标覆盖”选择器：
  - `System (auto)`（默认）
  - `Working: main` / `Working: other`（按工具类型：bash、read、write、edit、other）
  - `Idle`
- 存储在 `UserDefaults` 键 `openclaw.iconOverride` 下；映射到 `IconState.overridden`。

## 测试清单

- 触发主会话任务：图标立即切换，状态行显示主会话标签。
- 主会话空闲时触发非主会话任务：图标/状态显示非主会话；保持稳定直到它完成。
- 另一个会话处于活动状态时启动主会话：图标立即切换到主会话。
- 快速工具突发：徽章不会闪烁（已完成工具清除前有 2 秒宽限窗口，`WorkActivityStore.toolResultGrace`）。
- 所有会话空闲后，健康行会重新出现。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [菜单栏图标](/zh-CN/platforms/mac/icon)
