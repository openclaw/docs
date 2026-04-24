---
read_when:
    - 调整 mac 菜单 UI 或状态逻辑
summary: 菜单栏状态逻辑以及向用户展示的内容
title: 菜单栏
x-i18n:
    generated_at: "2026-04-24T04:05:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# 菜单栏状态逻辑

## 显示内容

- 我们会在菜单栏图标和菜单第一行状态中展示当前智能体的工作状态。
- 工作处于活动状态时，健康状态会被隐藏；当所有会话都空闲后，它会重新显示。
- 菜单中的 “Nodes” 区块仅列出**设备**（通过 `node.list` 配对的节点），不包括客户端/在线状态条目。
- 当 provider 使用量快照可用时，“Context” 下方会出现一个 “Usage” 区块。

## 状态模型

- 会话：事件会携带 `runId`（每次运行唯一）以及负载中的 `sessionKey`。`main` 会话的键为 `main`；如果不存在，则回退到最近一次更新的会话。
- 优先级：始终以 main 为最高优先级。如果 main 处于活动状态，就立即显示它的状态。如果 main 空闲，则显示最近一次活动的非 main 会话。我们不会在活动中途来回切换；只有当当前会话变为空闲或 main 变为活动时才切换。
- 活动类型：
  - `job`：高层级命令执行（`state: started|streaming|done|error`）。
  - `tool`：`phase: start|result`，带有 `toolName` 和 `meta/args`。

## `IconState` 枚举（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（调试覆盖）

### `ActivityKind` → 图标符号

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- 默认 → 🛠️

### 视觉映射

- `idle`：普通小动物图标。
- `workingMain`：显示带图标符号的徽章、完整着色和腿部“工作中”动画。
- `workingOther`：显示带图标符号的徽章、柔和着色，不进行快速移动动画。
- `overridden`：无论实际活动如何，都使用选定的图标符号/着色。

## 状态行文本（菜单中）

- 工作处于活动状态时：`<Session role> · <activity label>`
  - 示例：`Main · exec: pnpm test`、`Other · read: apps/macos/Sources/OpenClaw/AppState.swift`。
- 空闲时：回退为健康状态摘要。

## 事件摄取

- 来源：控制通道 `agent` 事件（`ControlChannel.handleAgentEvent`）。
- 解析字段：
  - `stream: "job"`，使用 `data.state` 表示开始/停止。
  - `stream: "tool"`，使用 `data.phase`、`name` 和可选的 `meta`/`args`。
- 标签：
  - `exec`：`args.command` 的第一行。
  - `read`/`write`：缩短后的路径。
  - `edit`：路径加上根据 `meta`/diff 计数推断出的更改类型。
  - 回退：工具名称。

## 调试覆盖

- 设置 ▸ 调试 ▸ “Icon override” 选择器：
  - `System (auto)`（默认）
  - `Working: main`（按工具类型）
  - `Working: other`（按工具类型）
  - `Idle`
- 通过 `@AppStorage("iconOverride")` 存储；映射到 `IconState.overridden`。

## 测试检查清单

- 触发 main 会话任务：验证图标立即切换，并且状态行显示 main 标签。
- 当 main 空闲时触发非 main 会话任务：图标/状态应显示非 main；并在其完成前保持稳定。
- 当其他会话活跃时启动 main：图标应立即切换到 main。
- 快速工具突发：确保徽章不闪烁（工具结果有 TTL 宽限）。
- 当所有会话都空闲时，健康状态行会重新出现。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [菜单栏图标](/zh-CN/platforms/mac/icon)
