---
read_when:
    - 调整语音叠加层行为
summary: 唤醒词与按住说话重叠时的语音浮层生命周期
title: 语音浮层
x-i18n:
    generated_at: "2026-07-11T20:41:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# 语音浮层生命周期（macOS）

受众：macOS 应用贡献者。目标：当唤醒词和按住说话功能重叠时，确保语音浮层行为可预测。

## 行为

- 如果浮层已因唤醒词而显示，并且用户按下热键，则热键会话会接管现有文本，而不是将其重置。按住热键期间，浮层会保持显示。松开时：如果存在去除首尾空白后的文本，则发送；否则关闭浮层。
- 仅使用唤醒词时，仍会在静默后自动发送；按住说话则会在松开按键时立即发送。

## 实现

- `VoiceSessionCoordinator`（`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`）是活动语音会话的唯一所有者。它是一个 `@MainActor @Observable` 单例，而不是 actor。API：`startSession`、`updatePartial`、`finalize`、`sendNow`、`dismiss`、`updateLevel`、`snapshot`。每个会话都携带一个 `UUID` 令牌；使用过期或不匹配令牌的调用会被丢弃。
- `VoiceWakeOverlayController`（`VoiceWakeOverlayController+Session.swift`）负责渲染浮层，并通过会话令牌将用户操作（`requestSend`、`dismiss`）转发回协调器。它自身从不持有会话状态。
- 按住说话功能（`VoicePushToTalk.begin()`）会将任何可见的浮层文本接管为 `adoptedPrefix`（通过 `VoiceSessionCoordinator.shared.snapshot()`），因此在唤醒浮层显示时按下热键会保留现有文本，并在其后追加新的语音内容。松开时，它会等待最终转录文本，最长 1.5 秒；如果未收到，则回退到当前文本。
- 执行 `dismiss` 时，浮层会调用 `VoiceSessionCoordinator.overlayDidDismiss`，进而触发 `VoiceWakeRuntime.refresh(state:)`，确保通过 X 手动关闭、因文本为空而关闭以及发送后关闭时，都会恢复唤醒词监听。
- 统一发送路径：如果去除首尾空白后的文本为空，则关闭浮层；否则，`sendNow` 会播放一次发送提示音，通过 `VoiceWakeForwarder` 转发内容，然后关闭浮层。

## 日志

语音子系统为 `ai.openclaw`；每个组件使用各自的类别记录日志：

| 类别                    | 组件                                            |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | 按住说话热键和音频采集                          |
| `voicewake.runtime`     | 唤醒词运行时                                    |
| `voicewake.chime`       | 提示音播放                                      |
| `voicewake.sync`        | 全局设置同步                                    |
| `voicewake.forward`     | 转录文本转发                                    |
| `voicewake.meter`       | 麦克风音量监视器                                |

## 调试检查清单

- 复现浮层无法关闭的问题时，流式查看日志：

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- 验证仅存在一个活动会话令牌；过期的回调会被协调器丢弃。
- 确认松开按住说话热键时，始终使用活动令牌调用 `end()`；如果文本为空，应关闭浮层，且不会播放提示音或发送内容。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [语音唤醒（macOS）](/zh-CN/platforms/mac/voicewake)
- [Talk 模式](/zh-CN/nodes/talk)
