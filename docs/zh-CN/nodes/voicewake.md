---
read_when:
    - 更改语音唤醒词的行为或默认值
    - 添加需要同步唤醒词的新节点平台
summary: 全局语音唤醒词（由 Gateway 网关管理）及其在节点间的同步方式
title: 语音唤醒
x-i18n:
    generated_at: "2026-07-12T14:35:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8a8c7a8bb2ee5bbc57d9141cd8f2176246cc61952b0ed42257f83af2c777427
    source_path: nodes/voicewake.md
    workflow: 16
---

唤醒词是**由 Gateway 网关管理的一份全局列表**——不存在按节点自定义的列表。任何节点或应用界面都可以编辑该列表；Gateway 网关会持久化更改，并将其广播给每个已连接的客户端。

- **macOS**：本地 Voice Wake 启用/禁用开关。需要 macOS 26+；有关运行时/PTT 的详细信息，请参阅[语音唤醒（macOS）](/zh-CN/platforms/mac/voicewake)。
- **iOS**：Settings 中的本地 Voice Wake 启用/禁用开关。
- **Android**：未实现 Voice Wake。Voice 选项卡使用手动麦克风采集，而不是唤醒词触发。

## 存储

唤醒词和路由规则存储在 Gateway 网关状态数据库中，默认路径为 `~/.openclaw/state/openclaw.sqlite`（可使用 `OPENCLAW_STATE_DIR` 覆盖），使用的表为 `voicewake_triggers`、`voicewake_routing_config`、`voicewake_routing_routes`。旧版 `settings/voicewake.json` 和 `settings/voicewake-routing.json` 仅作为 `openclaw doctor --fix` 的迁移输入——运行时绝不会读取它们。

## 协议

### 触发词列表

| 方法            | 参数                     | 结果                     |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | 无                       | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` 会规范化输入：去除首尾空白、丢弃空条目、最多保留 32 个触发词，并将每个触发词截断为 64 个 UTF-16 代码单元且不拆分代理对。如果结果为空，则回退到内置默认值（`openclaw`、`claude`、`computer`）。

### 路由（从触发词到目标）

| 方法                    | 参数                                 | 结果                                 |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | 无                                   | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

每条路由的 `target` 仅支持以下一种形式：

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

限制：最多 32 条路由，触发词文本最多 64 个字符。为了进行匹配和重复检测，路由触发词会经过规范化：转换为小写、去除每个单词首尾的标点符号，并合并空白（`"Hey, Bot!!"` 和 `"hey bot"` 会匹配并被视为重复项）——这比上方全局触发词列表仅去除首尾空白的规范化方式更严格。

### 事件

| 事件                        | 载荷                                 |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

两者都会广播给每个具有读取权限范围的 WebSocket 客户端（macOS 应用、WebChat 等）以及每个已连接的节点。节点连接后，还会立即收到两者的初始快照推送。

## 客户端行为

- **macOS**：调用 `voicewake.set`/`voicewake.get`，并监听 `voicewake.changed`，以便与其他客户端保持同步。
- **iOS**：调用 `voicewake.set`/`voicewake.get`，并监听 `voicewake.changed`，以保持本地唤醒词检测及时响应。
- **Android**：不声明 `voiceWake` 能力，也不接收唤醒词更新。

## 相关内容

- [Talk 模式](/zh-CN/nodes/talk)
- [音频和语音备注](/zh-CN/nodes/audio)
- [媒体理解](/zh-CN/nodes/media-understanding)
