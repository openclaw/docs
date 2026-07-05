---
read_when:
    - 更改语音唤醒词行为或默认值
    - 添加需要唤醒词同步的新节点平台
summary: 全局语音唤醒词（归 Gateway 网关所有）及其如何跨节点同步
title: 语音唤醒
x-i18n:
    generated_at: "2026-07-05T11:27:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ec1980dd69a041e7dfeaa9d74e370e3279b22aa7ed19b72067ee56f3f696899
    source_path: nodes/voicewake.md
    workflow: 16
---

唤醒词是**由 Gateway 网关拥有的一份全局列表**，没有按节点区分的自定义列表。任何节点或应用 UI 都可以编辑该列表；Gateway 网关会持久化更改并广播给每个已连接的客户端。

- **macOS**：本地 Voice Wake 启用/停用开关。需要 macOS 26+；运行时/PTT 详情见 [Voice wake (macOS)](/zh-CN/platforms/mac/voicewake)。
- **iOS**：Settings 中的本地 Voice Wake 启用/停用开关。
- **Android**：Voice Wake 在运行时被强制停用。Voice 标签页使用手动麦克风采集，而不是唤醒词触发。

## 存储

唤醒词和路由规则位于 Gateway 网关状态数据库中，默认是 `~/.openclaw/state/openclaw.sqlite`（可用 `OPENCLAW_STATE_DIR` 覆盖），表为 `voicewake_triggers`、`voicewake_routing_config`、`voicewake_routing_routes`。旧版 `settings/voicewake.json` 和 `settings/voicewake-routing.json` 仅作为 `openclaw doctor --fix` 的迁移输入，运行时绝不会读取它们。

## 协议

### 触发词列表

| 方法            | 参数                     | 结果                     |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | 无                       | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` 会规范化输入：去除首尾空白、丢弃空条目、最多保留 32 个触发词，并将每个触发词截断到 64 个字符。空结果会回退到内置默认值（`openclaw`、`claude`、`computer`）。

### 路由（触发词到目标）

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

每条路由的 `target` 仅支持以下一种：

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

限制：最多 32 条路由，触发词文本最多 64 个字符。路由触发词在匹配和重复检测时会被规范化：转为小写、去除每个词首尾的标点，并折叠空白（`"Hey, Bot!!"` 和 `"hey bot"` 会匹配并计为重复）——这比上面全局触发词列表只做普通 trim 的规范化更严格。

### 事件

| 事件                        | 载荷                                 |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

两者都会广播给每个具有读取权限范围的 WebSocket 客户端（macOS 应用、WebChat 及类似客户端），以及每个已连接的节点。节点连接后也会立即收到这两者的初始快照推送。

## 客户端行为

- **macOS**：调用 `voicewake.set`/`voicewake.get`，并监听 `voicewake.changed` 以与其他客户端保持同步。
- **iOS**：调用 `voicewake.set`/`voicewake.get`，并监听 `voicewake.changed` 以保持本地唤醒词检测响应及时。
- **Android**：`VoiceWakeMode`（`Off`/`Foreground`/`Always`）和 Gateway 网关同步代码存在，但应用会在启动时强制将模式设为 `Off`，因此 Android Settings 当前无法访问 Voice Wake。

## 相关

- [Talk 模式](/zh-CN/nodes/talk)
- [音频和语音笔记](/zh-CN/nodes/audio)
- [媒体理解](/zh-CN/nodes/media-understanding)
