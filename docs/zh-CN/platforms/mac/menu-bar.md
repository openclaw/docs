---
read_when:
    - 调整 Mac 菜单 UI 或状态逻辑
summary: 菜单栏状态逻辑以及向用户呈现的内容
title: 菜单栏
x-i18n:
    generated_at: "2026-05-06T02:39:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## 显示内容

- 我们会在菜单栏图标和菜单的第一行状态中显示当前智能体工作状态。
- 工作处于活动状态时隐藏健康状态；当所有会话都空闲时恢复显示。
- 根级“上下文”子菜单包含最近的会话，而不是直接在根菜单中展开它们。
- 根菜单中的“节点”区块仅列出**设备**（通过 `node.list` 配对的节点），不列出客户端/在线状态条目。
- 当提供商用量快照可用时，根级“用量”分区会显示在上下文下方；如果可用，随后显示用量成本详情。

## 状态模型

- 会话：事件会携带 `runId`（每次运行）以及负载中的 `sessionKey`。`main` 会话是键 `main`；如果缺失，则回退到最近更新的会话。
- 优先级：main 始终优先。如果 main 处于活动状态，会立即显示其状态。如果 main 空闲，则显示最近活跃的非 main 会话。我们不会在活动过程中来回切换；只有当前会话进入空闲或 main 变为活动时才会切换。
- 活动类型：
  - `job`：高级命令执行（`state: started|streaming|done|error`）。
  - `tool`：`phase: start|result`，带有 `toolName` 和 `meta/args`。

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

- `idle`：普通小动物。
- `workingMain`：带字形的徽章、完整着色、腿部“工作中”动画。
- `workingOther`：带字形的徽章、弱化着色、无疾走动画。
- `overridden`：无论活动如何，都使用选定的字形/着色。

## 上下文子菜单

- 根菜单显示一行“上下文”，带有会话数量/状态，并打开一个子菜单。
- 上下文子菜单标题显示过去 24 小时内的活动会话数量。
- 每个会话行都会保留其令牌条、时间、预览、思考/详细、重置、压缩和删除操作。
- 加载中、已断开连接和会话加载错误消息会显示在上下文子菜单内。
- 提供商用量和用量成本详情保持在上下文下方的根级位置，这样无需打开子菜单也能快速查看。

## 状态行文本（菜单）

- 工作处于活动状态时：`<Session role> · <activity label>`
  - 示例：`Main · exec: pnpm test`、`Other · read: apps/macos/Sources/OpenClaw/AppState.swift`。
- 空闲时：回退到健康摘要。

## 事件摄取

- 来源：控制频道 `agent` 事件（`ControlChannel.handleAgentEvent`）。
- 解析字段：
  - `stream: "job"`，带有用于开始/停止的 `data.state`。
  - `stream: "tool"`，带有 `data.phase`、`name`，以及可选的 `meta`/`args`。
- 标签：
  - `exec`：`args.command` 的第一行。
  - `read`/`write`：缩短后的路径。
  - `edit`：路径加上从 `meta`/diff 计数推断出的变更类型。
  - 回退：工具名称。

## 调试覆盖

- 设置 ▸ 调试 ▸ “图标覆盖”选择器：
  - `System (auto)`（默认）
  - `Working: main`（按工具类型）
  - `Working: other`（按工具类型）
  - `Idle`
- 通过 `@AppStorage("iconOverride")` 存储；映射到 `IconState.overridden`。

## 测试检查清单

- 触发 main 会话任务：验证图标立即切换，且状态行显示 main 标签。
- main 空闲时触发非 main 会话任务：图标/状态显示非 main；保持稳定直到其完成。
- 其他会话活动时启动 main：图标立即切换到 main。
- 快速工具突发：确保徽章不闪烁（工具结果上有 TTL 宽限）。
- 所有会话空闲后，健康行重新出现。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [菜单栏图标](/zh-CN/platforms/mac/icon)
