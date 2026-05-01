---
read_when:
    - 调整 mac 菜单 UI 或状态逻辑
summary: 菜单栏 Status 逻辑以及向用户显示的内容
title: 菜单栏
x-i18n:
    generated_at: "2026-05-01T07:26:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340b86a2e222fb1fe7fda4f0f0434127af1393a64348ea033ea284ba52866beb
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# 菜单栏 Status 逻辑

## 显示内容

- 我们会在菜单栏图标以及菜单的第一行 Status 行中显示当前智能体工作状态。
- 工作处于活动状态时会隐藏健康状态；当所有会话都空闲时，它会恢复显示。
- 根级“上下文”子菜单包含最近的会话，而不是直接在根菜单中展开它们。
- 根菜单中的“节点”区块只列出**设备**（通过 `node.list` 配对的节点），不列出客户端/在线状态条目。
- 当提供商用量快照可用时，根级“用量”部分会显示在上下文下方，随后在可用时显示用量成本详情。

## 状态模型

- 会话：事件随 `runId`（按每次运行）到达，并在载荷中包含 `sessionKey`。“主”会话是键 `main`；如果缺失，则回退到最近更新的会话。
- 优先级：主会话始终优先。如果主会话处于活动状态，会立即显示它的状态。如果主会话空闲，则显示最近处于活动状态的非主会话。我们不会在活动过程中来回切换；只有当当前会话变为空闲或主会话变为活动时才会切换。
- 活动类型：
  - `job`：高级命令执行（`state: started|streaming|done|error`）。
  - `tool`：带有 `toolName` 和 `meta/args` 的 `phase: start|result`。

## IconState 枚举（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（调试覆盖）

### ActivityKind → 字形

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- 默认 → 🛠️

### 视觉映射

- `idle`：正常小动物。
- `workingMain`：带字形的徽章、完整色调、腿部“工作中”动画。
- `workingOther`：带字形的徽章、弱化色调、不快速移动。
- `overridden`：无论活动如何，都使用所选字形/色调。

## 上下文子菜单

- 根菜单显示一行“上下文”，包含会话数量/Status，并打开一个子菜单。
- 上下文子菜单标题显示过去 24 小时内的活动会话数量。
- 每个会话行会保留其令牌条、年龄、预览、思考/详细、重置、压缩和删除操作。
- 加载中、已断开连接和会话加载错误消息会显示在上下文子菜单内。
- 提供商用量和用量成本详情保留在上下文下方的根级位置，便于无需打开子菜单即可快速查看。

## Status 行文本（菜单）

- 工作处于活动状态时：`<Session role> · <activity label>`
  - 示例：`Main · exec: pnpm test`、`Other · read: apps/macos/Sources/OpenClaw/AppState.swift`。
- 空闲时：回退到健康摘要。

## 事件摄取

- 来源：控制渠道 `agent` 事件（`ControlChannel.handleAgentEvent`）。
- 已解析字段：
  - `stream: "job"`，带有用于开始/停止的 `data.state`。
  - `stream: "tool"`，带有 `data.phase`、`name`，以及可选的 `meta`/`args`。
- 标签：
  - `exec`：`args.command` 的第一行。
  - `read`/`write`：缩短后的路径。
  - `edit`：路径加上从 `meta`/差异计数推断出的变更类型。
  - 回退：工具名称。

## 调试覆盖

- 设置 ▸ 调试 ▸ “图标覆盖”选择器：
  - `System (auto)`（默认）
  - `Working: main`（按工具类型）
  - `Working: other`（按工具类型）
  - `Idle`
- 通过 `@AppStorage("iconOverride")` 存储；映射到 `IconState.overridden`。

## 测试清单

- 触发主会话任务：验证图标会立即切换，并且 Status 行显示主标签。
- 在主会话空闲时触发非主会话任务：图标/Status 显示非主会话；在其完成前保持稳定。
- 当其他会话活动时启动主会话：图标会立即切换到主会话。
- 快速工具突发：确保徽章不闪烁（工具结果上有 TTL 宽限）。
- 所有会话空闲后，健康行会重新出现。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [菜单栏图标](/zh-CN/platforms/mac/icon)
