---
read_when:
    - 更改语音唤醒词行为或默认值
    - 添加需要唤醒词同步的新节点平台
summary: 全局语音唤醒词（由 Gateway 网关管理）及其如何跨节点同步
title: 语音唤醒
x-i18n:
    generated_at: "2026-06-27T02:25:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw 将**唤醒词视为一个全局列表**，由 **Gateway 网关**拥有。

- **没有按节点配置的自定义唤醒词**。
- **任何节点/应用 UI 都可以编辑**该列表；更改由 Gateway 网关持久化，并广播给所有人。
- macOS 和 iOS 保留本地的 **Voice Wake 启用/禁用**开关（本地 UX + 权限不同）。
- Android 目前保持 Voice Wake 关闭，并在 Voice 标签页中使用手动麦克风流程。

## 存储（Gateway 网关主机）

唤醒词和路由规则存储在 Gateway 网关状态数据库中：

- `~/.openclaw/state/openclaw.sqlite`

当前使用的表为：

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

旧版 `settings/voicewake.json` 和 `settings/voicewake-routing.json` 文件仅作为
Doctor 迁移输入；运行时读取和写入 SQLite 表。

## 协议

### 方法

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set`，参数为 `{ triggers: string[] }` → `{ triggers: string[] }`

说明：

- 触发词会被规范化（去除首尾空白，丢弃空值）。空列表会回退到默认值。
- 为安全起见会强制执行限制（数量/长度上限）。

### 路由方法（触发词 → 目标）

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set`，参数为 `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

`VoiceWakeRoutingConfig` 结构：

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

路由目标仅支持以下一种：

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### 事件

- `voicewake.changed` 载荷 `{ triggers: string[] }`
- `voicewake.routing.changed` 载荷 `{ config: VoiceWakeRoutingConfig }`

接收方：

- 所有 WebSocket 客户端（macOS 应用、WebChat 等）
- 所有已连接节点（iOS/Android），并且在节点连接时也会推送一次初始“当前状态”。

## 客户端行为

### macOS 应用

- 使用全局列表来控制 `VoiceWakeRuntime` 触发。
- 在 Voice Wake 设置中编辑 “Trigger words” 会调用 `voicewake.set`，然后依赖广播让其他客户端保持同步。

### iOS 节点

- 使用全局列表进行 `VoiceWakeManager` 触发检测。
- 在 Settings 中编辑 Wake Words 会调用 `voicewake.set`（通过 Gateway 网关 WS），同时也会让本地唤醒词检测保持响应。

### Android 节点

- Voice Wake 目前在 Android 运行时/Settings 中已禁用。
- Android 语音使用 Voice 标签页中的手动麦克风采集，而不是唤醒词触发。

## 相关

- [Talk 模式](/zh-CN/nodes/talk)
- [音频和语音笔记](/zh-CN/nodes/audio)
- [媒体理解](/zh-CN/nodes/media-understanding)
