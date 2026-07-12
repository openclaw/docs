---
read_when:
    - 调整 Mac 菜单 UI 或状态逻辑
summary: 菜单栏状态逻辑及向用户呈现的内容
title: 菜单栏
x-i18n:
    generated_at: "2026-07-11T20:40:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## 显示内容

- 当前智能体的工作状态会显示在菜单栏图标和菜单的第一行状态中。
- 工作处于活动状态时会隐藏健康状态；所有会话进入空闲状态后，健康状态会重新显示。
- 根菜单中的“上下文”项会打开一个包含最近会话的子菜单，而不是直接在根菜单中展开这些会话。
- 根菜单中的“节点”区块仅列出已配对的**设备**（来自 `node.list`），不包含客户端/在线状态条目。
- 当提供商使用量快照可用时，根菜单会在“上下文”下方显示“用量”部分；如果费用详情可用，则继续显示费用详情。

## 状态模型

- 来源：`WorkActivityStore`（`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`）。
- 事件以包含 `runId` 的 `ControlAgentEvent` 形式到达；处理程序（`ControlChannel.routeWorkActivity`）从事件载荷中读取 `sessionKey`，如果不存在则默认为 `"main"`。
- 优先级：主会话（默认情况下 `sessionKey == "main"`）始终优先。如果主会话处于活动状态，则立即显示其状态。如果主会话处于空闲状态，则改为显示最近处于活动状态的非主会话。存储不会在活动期间切换；只有当前会话进入空闲状态或主会话变为活动状态时才会切换。
- 活动类型：
  - `job`：高级命令执行（`state: started|streaming|done|error|...`）。
  - `tool`：`phase: start|result`，包含 `name`，以及可选的 `meta`/`args`。

## IconState 枚举（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（调试覆盖）

### ActivityKind -> 徽标符号

`ActivityKind` 封装一个 `ToolKind`（`bash`、`read`、`write`、`edit`、`attach`、`other`）或单独的 `job`。每种类型都会映射到一个绘制在小动物图标上的 SF Symbols 徽标（`IconState.badgeSymbolName`）：

| 类型            | 符号                               |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### 视觉映射

- `idle`：正常的小动物图标，无徽标。
- `workingMain`：带符号的徽标，完整着色（`.primary` 显著度），播放腿部“工作中”动画。
- `workingOther`：带符号的徽标，柔和着色（`.secondary` 显著度），不播放快速移动动画。
- `overridden`：无论实际活动如何，均使用所选的符号/着色。

## 上下文子菜单

- 根菜单显示一行“上下文”及会话数量/状态；点击后会打开子菜单（`MenuSessionsInjector`）。
- 子菜单标题显示过去 24 小时内的活跃会话数量。
- 每个会话行保留其令牌进度条、已存在时长、预览、思考/详细模式切换、重置、压缩和删除操作。
- 加载中、连接已断开和会话加载错误消息显示在“上下文”子菜单内。
- 用量和费用部分仍位于“上下文”下方的根菜单层级，因此无需打开子菜单即可一目了然。

## 状态行文本（菜单）

- 工作进行期间：`<Session role> · <activity label>`（`MenuContentView` 中的 `"\(roleLabel) · \(activity.label)"`），其中角色标签为 `Main` 或 `Other`。
- 空闲时：回退到健康摘要。

## 事件摄取

- 来源：控制渠道的 `agent` 事件，由 `ControlChannel.routeWorkActivity(from:)` 路由。
- 解析的字段：
  - `stream: "job"`，使用 `data.state` 表示开始/停止。
  - `stream: "tool"`，包含 `data.phase`、`data.name`，以及可选的 `data.meta`/`data.args`。
- 工具标签来自 `ToolDisplayRegistry.resolve(name:args:meta:)`；无法解析的名称会回退为原始工具名称。

## 调试覆盖

- Settings > Debug > “Icon override” 选择器：
  - `System (auto)`（默认）
  - `Working: main` / `Working: other`（按工具类型：bash、读取、写入、编辑、其他）
  - `Idle`
- 存储在 `UserDefaults` 键 `openclaw.iconOverride` 下；映射到 `IconState.overridden`。

## 测试检查清单

- 触发主会话任务：图标立即切换，状态行显示主会话标签。
- 在主会话空闲时触发非主会话任务：图标/状态显示该非主会话；在任务完成前保持稳定。
- 在另一个会话处于活动状态时启动主会话：图标立即切换到主会话。
- 快速连续调用工具：徽章不会闪烁（已完成工具在清除前有 2 秒宽限期，`WorkActivityStore.toolResultGrace`）。
- 所有会话都进入空闲状态后，健康状态行重新出现。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [菜单栏图标](/zh-CN/platforms/mac/icon)
