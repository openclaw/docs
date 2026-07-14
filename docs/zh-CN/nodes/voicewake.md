---
read_when:
    - 更改语音唤醒词的行为或默认设置
    - 添加需要唤醒词同步的新节点平台
summary: 全局语音唤醒词（由 Gateway 网关管理）及其在节点间的同步方式
title: 语音唤醒
x-i18n:
    generated_at: "2026-07-14T13:47:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

唤醒词是**由 Gateway 网关管理的全局列表**——不存在按节点划分的自定义列表。任何节点或应用界面都可以编辑此列表；Gateway 网关会持久保存更改，并将其广播给所有已连接的客户端。

- **macOS**：本地语音唤醒启用/禁用开关。需要 macOS 26+；有关运行时/PTT 的详细信息，请参阅[语音唤醒（macOS）](/zh-CN/platforms/mac/voicewake)。
- **iOS**：Settings 中的本地语音唤醒启用/禁用开关。
- **Android**：Settings → Voice 中的本地语音唤醒启用/禁用开关和唤醒词编辑器。需要使用 Android 设备端语音识别。

## 存储

唤醒词和路由规则存储在 Gateway 网关状态数据库中，默认位于 `~/.openclaw/state/openclaw.sqlite`（可使用 `OPENCLAW_STATE_DIR` 覆盖），对应的表为 `voicewake_triggers`、`voicewake_routing_config`、`voicewake_routing_routes`。旧版 `settings/voicewake.json` 和 `settings/voicewake-routing.json` 仅作为 `openclaw doctor --fix` 迁移输入——运行时绝不会读取它们。

## 协议

### 触发词列表

| 方法          | 参数                   | 结果                   |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | 无                     | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` 会规范化输入：去除首尾空白、丢弃空条目、最多保留 32 个触发词，并将每个触发词截断为 64 个 UTF-16 代码单元且不拆分代理项对。若结果为空，则回退到内置默认值（`openclaw`、`claude`、`computer`）。

### 路由（从触发词到目标）

| 方法                  | 参数                               | 结果                               |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | 无                                 | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

每条路由的 `target` 仅支持以下选项之一：

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

限制：最多 32 条路由，触发词文本最多 64 个字符。为进行匹配和重复检测，路由触发词会通过以下方式规范化：转换为小写、去除每个单词首尾的标点，并合并空白（`"Hey, Bot!!"` 和 `"hey bot"` 会匹配并被视为重复项）——这种规范化比上方全局触发词列表所使用的简单去除首尾空白更严格。

### 事件

| 事件                       | 载荷                              |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

两者都会广播给所有具有读取权限范围的 WebSocket 客户端（macOS 应用、WebChat 等）以及所有已连接的节点。节点连接后，还会立即收到这两个事件作为初始快照推送。

## 客户端行为

- **macOS**：调用 `voicewake.set`/`voicewake.get`，并监听 `voicewake.changed`，以与其他客户端保持同步。
- **iOS**：调用 `voicewake.set`/`voicewake.get`，并监听 `voicewake.changed`，以确保本地唤醒词检测及时响应。
- **Android**：调用 `voicewake.set`/`voicewake.get`，监听 `voicewake.changed`，并在启用时通告 `voiceWake`。识别始终在设备端进行，且仅限前台运行；当 Talk、手动听写、语音留言录制或消息语音功能占用音频时，识别会暂停。

## 相关内容

- [Talk 模式](/zh-CN/nodes/talk)
- [音频和语音留言](/zh-CN/nodes/audio)
- [媒体理解](/zh-CN/nodes/media-understanding)
