---
read_when:
    - 更改语音唤醒词的行为或默认值
    - 添加需要唤醒词同步的新节点平台
summary: 全局语音唤醒词（由 Gateway 网关拥有）及其跨节点同步方式
title: 语音唤醒
x-i18n:
    generated_at: "2026-05-06T06:16:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a284cbe3e12784a8d7a3eab6ba8ae230123557bca7593c956111199b94b91b73
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw 将**唤醒词视为一个全局列表**，由 **Gateway 网关**管理。

- **没有按节点自定义的唤醒词**。
- **任何节点/应用 UI 都可以编辑**该列表；更改由 Gateway 网关持久化，并广播给所有人。
- macOS 和 iOS 保留本地**语音唤醒启用/禁用**开关（本地 UX + 权限不同）。
- Android 当前保持语音唤醒关闭，并在语音标签页中使用手动麦克风流程。

## 存储（Gateway 网关主机）

唤醒词存储在网关机器上的：

- `~/.openclaw/settings/voicewake.json`

结构：

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## 协议

### 方法

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set`，参数为 `{ triggers: string[] }` → `{ triggers: string[] }`

说明：

- 触发词会被规范化（去除首尾空格，丢弃空值）。空列表会回退到默认值。
- 出于安全考虑会强制执行限制（数量/长度上限）。

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

路由目标必须且只能支持以下一种：

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### 事件

- `voicewake.changed` 载荷 `{ triggers: string[] }`
- `voicewake.routing.changed` 载荷 `{ config: VoiceWakeRoutingConfig }`

接收者：

- 所有 WebSocket 客户端（macOS 应用、WebChat 等）
- 所有已连接节点（iOS/Android），并且在节点连接时也会推送一次初始“当前状态”。

## 客户端行为

### macOS 应用

- 使用全局列表来限定 `VoiceWakeRuntime` 触发词。
- 在语音唤醒设置中编辑“触发词”会调用 `voicewake.set`，然后依赖广播让其他客户端保持同步。

### iOS 节点

- 使用全局列表进行 `VoiceWakeManager` 触发词检测。
- 在设置中编辑唤醒词会调用 `voicewake.set`（通过 Gateway 网关 WS），同时也会保持本地唤醒词检测响应及时。

### Android 节点

- 语音唤醒当前在 Android 运行时/设置中处于禁用状态。
- Android 语音使用语音标签页中的手动麦克风捕获，而不是唤醒词触发。

## 相关

- [Talk 模式](/zh-CN/nodes/talk)
- [音频和语音笔记](/zh-CN/nodes/audio)
- [媒体理解](/zh-CN/nodes/media-understanding)
