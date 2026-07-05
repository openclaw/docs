---
read_when:
    - 调整语音浮层行为
summary: 当唤醒词和按键说话重叠时的语音浮层生命周期
title: 语音叠加层
x-i18n:
    generated_at: "2026-07-05T11:30:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# 语音浮层生命周期（macOS）

受众：macOS app 贡献者。目标：在唤醒词和按键通话重叠时，让语音浮层保持可预测。

## 行为

- 如果浮层已经因唤醒词而可见，并且用户按下热键，热键会话会采用现有文本，而不是重置文本。按住热键期间，浮层保持显示。释放时：如果存在修剪后的文本则发送，否则关闭。
- 仅使用唤醒词时，仍会在静音后自动发送；按键通话会在释放时立即发送。

## 实现

- `VoiceSessionCoordinator`（`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`）是活动语音会话的唯一所有者。它是一个 `@MainActor @Observable` 单例，而不是 actor。API：`startSession`、`updatePartial`、`finalize`、`sendNow`、`dismiss`、`updateLevel`、`snapshot`。每个会话都携带一个 `UUID` 令牌；带有过期或不匹配令牌的调用会被丢弃。
- `VoiceWakeOverlayController`（`VoiceWakeOverlayController+Session.swift`）负责渲染浮层，并通过会话令牌将用户操作（`requestSend`、`dismiss`）转发回协调器。它本身从不拥有会话状态。
- 按键通话（`VoicePushToTalk.begin()`）会将任何可见浮层文本采用为 `adoptedPrefix`（通过 `VoiceSessionCoordinator.shared.snapshot()`），因此在唤醒浮层显示时按下热键会保留文本并追加新的语音内容。释放时，它最多等待 1.5 秒获取最终转录，然后回退到当前文本。
- 在 `dismiss` 时，浮层会调用 `VoiceSessionCoordinator.overlayDidDismiss`，这会触发 `VoiceWakeRuntime.refresh(state:)`，因此手动点击 X 关闭、空文本关闭以及发送后关闭都会恢复唤醒词监听。
- 统一发送路径：如果修剪后的文本为空，则关闭；否则 `sendNow` 播放一次发送提示音，通过 `VoiceWakeForwarder` 转发，然后关闭。

## 日志

语音子系统是 `ai.openclaw`；每个组件都在自己的类别下记录日志：

| 类别                    | 组件                                            |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | 按键通话热键和捕获                              |
| `voicewake.runtime`     | 唤醒词运行时                                    |
| `voicewake.chime`       | 提示音播放                                      |
| `voicewake.sync`        | 全局设置同步                                    |
| `voicewake.forward`     | 转录转发                                        |
| `voicewake.meter`       | 麦克风电平监视器                                |

## 调试检查清单

- 在复现粘滞浮层时流式查看日志：

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- 验证只有一个活动会话令牌；过期回调会被协调器丢弃。
- 确认按键通话释放时始终使用活动令牌调用 `end()`；如果文本为空，预期会关闭，且不会播放提示音或发送。

## 相关

- [macOS app](/zh-CN/platforms/macos)
- [语音唤醒（macOS）](/zh-CN/platforms/mac/voicewake)
- [Talk 模式](/zh-CN/nodes/talk)
