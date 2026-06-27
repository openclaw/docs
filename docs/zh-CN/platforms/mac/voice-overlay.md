---
read_when:
    - 调整语音叠加层行为
summary: 唤醒词和按键说话重叠时的语音浮层生命周期
title: 语音叠加层
x-i18n:
    generated_at: "2026-05-06T06:16:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b30f50512e557bd5a50f0e4e8b7955a847b3b554694347d56638581fcda9514
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# 语音浮层生命周期（macOS）

受众：macOS 应用贡献者。目标：在唤醒词和按住说话重叠时，让语音浮层保持可预测。

## 当前意图

- 如果浮层已经因唤醒词而可见，且用户按下热键，热键会话会_接管_现有文本，而不是重置它。按住热键期间，浮层保持显示。用户松开时：如果有裁剪后的文本则发送，否则关闭。
- 仅唤醒词仍会在静音时自动发送；按住说话会在松开时立即发送。

## 已实现（2025 年 12 月 9 日）

- 浮层会话现在为每次捕获（唤醒词或按住说话）携带一个 token。当 token 不匹配时，会丢弃 partial/final/send/dismiss/level 更新，避免过期回调。
- 按住说话会接管任何可见浮层文本作为前缀（因此在唤醒浮层显示时按下热键会保留文本并追加新的语音）。它最多等待 1.5 秒获取最终转录，然后回退到当前文本。
- 铃声/浮层日志会以 `info` 级别输出到 `voicewake.overlay`、`voicewake.ptt` 和 `voicewake.chime` 类别（会话开始、partial、final、send、dismiss、铃声原因）。

## 后续步骤

1. **VoiceSessionCoordinator（actor）**
   - 同一时间仅拥有一个 `VoiceSession`。
   - API（基于 token）：`beginWakeCapture`、`beginPushToTalk`、`updatePartial`、`endCapture`、`cancel`、`applyCooldown`。
   - 丢弃携带过期 token 的回调（防止旧识别器重新打开浮层）。
2. **VoiceSession（模型）**
   - 字段：`token`、`source`（wakeWord|pushToTalk）、已提交/易变文本、铃声标志、定时器（自动发送、空闲）、`overlayMode`（display|editing|sending）、冷却截止时间。
3. **浮层绑定**
   - `VoiceSessionPublisher`（`ObservableObject`）将活跃会话镜像到 SwiftUI。
   - `VoiceWakeOverlayView` 只通过发布器渲染；它绝不直接修改全局单例。
   - 浮层用户操作（`sendNow`、`dismiss`、`edit`）会携带会话 token 回调到协调器。
4. **统一发送路径**
   - 在 `endCapture` 时：如果裁剪后的文本为空 → 关闭；否则 `performSend(session:)`（仅播放一次发送铃声、转发、关闭）。
   - 按住说话：无延迟；唤醒词：可选择延迟以便自动发送。
   - 按住说话结束后，对唤醒运行时应用短暂冷却，避免唤醒词立即再次触发。
5. **日志**
   - 协调器在子系统 `ai.openclaw`、类别 `voicewake.overlay` 和 `voicewake.chime` 中输出 `.info` 日志。
   - 关键事件：`session_started`、`adopted_by_push_to_talk`、`partial`、`finalized`、`send`、`dismiss`、`cancel`、`cooldown`。

## 调试检查清单

- 复现粘滞浮层时流式查看日志：

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- 验证只有一个活跃会话 token；过期回调应由协调器丢弃。
- 确保按住说话松开时始终使用活跃 token 调用 `endCapture`；如果文本为空，预期会 `dismiss`，且不会播放铃声或发送。

## 迁移步骤（建议）

1. 添加 `VoiceSessionCoordinator`、`VoiceSession` 和 `VoiceSessionPublisher`。
2. 重构 `VoiceWakeRuntime`，改为创建/更新/结束会话，而不是直接触碰 `VoiceWakeOverlayController`。
3. 重构 `VoicePushToTalk`，以接管现有会话并在松开时调用 `endCapture`；应用运行时冷却。
4. 将 `VoiceWakeOverlayController` 接线到发布器；移除运行时/PTT 的直接调用。
5. 为会话接管、冷却和空文本关闭添加集成测试。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [语音唤醒（macOS）](/zh-CN/platforms/mac/voicewake)
- [Talk 模式](/zh-CN/nodes/talk)
