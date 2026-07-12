---
read_when:
    - 你希望 OpenClaw 识别当前活跃的 Mac
    - 你正在调试最近输入活动或活跃节点选择
    - 你想了解节点连接通知路由
summary: 检测你最近使用的 Mac，并将节点提醒路由到那里
title: 活跃的计算机状态
x-i18n:
    generated_at: "2026-07-12T14:35:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2a4ec4607e1e4ef8d989d3c4ece0ee6e0730908a1df76ff52c1898b4307d979b
    source_path: nodes/presence.md
    workflow: 16
---

活跃计算机存在状态会告知 Gateway 网关：哪个已连接的 macOS 节点最近接收了
鼠标或键盘的物理输入。OpenClaw 使用此信号将一台 Mac 标记为 `active`，
为智能体提供稳定的活跃节点提示，并将节点连接提醒路由到你最可能正在使用的
计算机。

这不同于[系统存在状态](/zh-CN/concepts/presence)（即 Gateway 网关客户端的实时
列表），也不同于持久化的 `node.presence.alive` 信标；后者记录移动节点上次
唤醒的时间，但不会将其视为已连接。

## 要求

- OpenClaw macOS 应用已配对，并以节点模式连接。
- 已向签名的 OpenClaw 应用授予 **Accessibility** 权限。
- 对于连接提醒，还需授予 **Notifications** 权限，并且 Mac 节点需公开
  `system.notify`。

活动报告目前由原生 macOS 节点实现。iOS、Android、watchOS 和无头节点主机
可以报告连接状态或后台最近在线状态，但不会参与活跃计算机身份的竞争。

## 检查活跃计算机

1. 在 macOS 应用中，打开 **Settings -> Permissions**，然后在 macOS 系统设置中授予
   **Accessibility** 权限。
2. 确认 Mac 节点已连接：

   ```bash
   openclaw nodes status --connected
   ```

3. 在该 Mac 上移动鼠标或按下一个按键，然后运行：

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

最新的符合条件的 Mac 会被标记为 `active`。状态输出会显示其距离上次输入的
时长；`describe` 会公开 `active`、`lastActiveAtMs` 和 `presenceUpdatedAtMs`。
系统会有意合并活动报告，因此在近期报告后再次输入，显示内容最多可能需要约 15
秒才能反映该输入。

## 活动如何转化为存在状态

macOS 报告器每两秒采样一次 HID 系统空闲时钟。节点连接就绪时，它会报告一次，
之后对于更新的物理活动，每 15 秒最多报告一次。处于空闲状态时，它每三分钟发送
一次保活信号。空闲时长上限为 30 天，避免非常旧的样本随时间向前漂移，并被错误地
视为最新的计算机。

仅当以下所有条件均满足时，Gateway 网关才会接受活动：

- 事件属于该节点 ID 当前经过身份验证的连接；
- 节点具有有效的 `accessibility: true` 权限；
- 载荷包含有界整数 `idleSeconds` 值。

Gateway 网关从自身的观测时间中减去 `idleSeconds`，以推导出
`lastActiveAtMs`。它绝不会信任节点提供的挂钟时间戳。在已连接且符合条件的 Mac
中，`lastActiveAtMs` 最新者胜出；若时间相同，则采用最近更新存在状态的 Mac。

存在状态仅属于当前进程，并绑定到连接。断开当前会话、使用相同节点 ID 的另一会话
替换当前会话，或撤销 Accessibility 权限，都会清除该节点的活动状态并重新计算
活跃 Mac。

## 隐私和模型上下文

OpenClaw 发送的是空闲时长，而非输入内容。它不会发送按键值、鼠标坐标、应用程序
名称、窗口标题或原始输入事件。macOS 报告器读取硬件 HID 状态，因此合成的计算机
控制事件不会让自动化 Mac 看起来像是你实际使用的计算机。

持续活动不会创建面向模型的系统事件。动态运行时行仅包含经过身份验证的节点 ID：

```text
active_node=<node-id>
```

精确时间戳和由节点控制的显示名称不会进入提示词，以避免提示词注入和缓存抖动。
当智能体需要当前详情时，可以改用 `nodes` 工具读取 `node.list` 或
`node.describe`。

## 连接提醒的路由方式

节点完成 Gateway 网关握手后，OpenClaw 会等待 750 毫秒，让正在连接的 Mac
提交其第一个活动样本。随后，它会尝试向活动最新且支持通知的已连接 Mac 发送提醒。

- 如果主投递成功，其他 Mac 都不会收到提醒。
- 如果没有可用的活跃 Mac，或主投递失败，OpenClaw 会等待五秒，然后尝试所有其余
  已连接且公开 `system.notify` 的 Mac。
- 对于同一节点，在实际尝试投递后的五分钟内会抑制重连提醒，防止反复重连产生
  通知风暴。

提醒绑定到确切的节点连接。已断开或被替换的源会话无法完成旧的计划提醒，而替换后的
目标连接仍可参与回退投递。

## 故障排查

| 症状 | 检查 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 没有任何行被标记为 `active` | 确认原生 macOS 节点已连接，并且 `openclaw nodes describe --node <id>` 显示 `permissions.accessibility: true`。 |
| 错误的 Mac 仍保持活跃 | 实际操作该 Mac，等待活动合并窗口结束，然后重新运行 `openclaw nodes status`。合成的计算机控制操作不计入活动。 |
| 上次输入数据消失 | 检查该 Mac 是否已断开连接、其节点会话是否已被替换，或 Accessibility 权限是否已撤销。每种情况都会有意清除活动状态。 |
| 提醒出现在多台 Mac 上 | 主投递不可用或失败，因此运行了延迟回退。请确认活跃 Mac 已连接、允许通知并公开 `system.notify`。 |
| 智能体未提及活跃 Mac | 活动发生变化后开始一个新轮次。运行时提示保持稳定且紧凑；如需精确的当前元数据，请使用 `nodes` 工具。 |

有关 TCC 恢复，请参阅 [macOS 权限](/zh-CN/platforms/mac/permissions)。有关节点连接和
命令失败，请参阅[节点故障排查](/zh-CN/nodes/troubleshooting)。

## 相关内容

- [节点](/zh-CN/nodes)
- [节点 CLI](/zh-CN/cli/nodes)
- [系统存在状态](/zh-CN/concepts/presence)
- [Gateway 网关协议](/zh-CN/gateway/protocol#presence)
- [macOS 应用](/zh-CN/platforms/macos)
