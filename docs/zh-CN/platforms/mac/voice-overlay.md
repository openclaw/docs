---
read_when:
    - 调整语音浮层行为
summary: 当唤醒词与按住说话重叠时的语音浮层生命周期
title: 语音浮层
x-i18n:
    generated_at: "2026-04-05T08:38:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1efcc26ec05d2f421cb2cf462077d002381995b338d00db77d5fdba9b8d938b6
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# 语音浮层生命周期（macOS）

受众：macOS 应用贡献者。目标：当唤醒词与按住说话重叠时，让语音浮层行为保持可预测。

## 当前意图

- 如果浮层已经因为唤醒词而可见，而用户按下热键，热键会 _接管_ 现有文本，而不是重置它。只要用户按住热键，浮层就会保持显示。用户松开时：如果存在去除首尾空白后的文本则发送，否则关闭。
- 单独使用唤醒词时仍会在静音后自动发送；按住说话则会在松开时立即发送。

## 已实现（2025 年 12 月 9 日）

- 浮层会话现在会为每次捕获（唤醒词或按住说话）携带一个 token。当 partial / final / send / dismiss / level 更新的 token 不匹配时，这些更新会被丢弃，从而避免过期回调。
- 按住说话会将任何当前可见的浮层文本作为前缀接管（因此当唤醒浮层显示时按下热键，会保留现有文本并追加新的语音）。它最多等待 1.5 秒以获取最终转写，然后才回退到当前文本。
- Chime / 浮层日志现在会以 `info` 级别输出到 `voicewake.overlay`、`voicewake.ptt` 和 `voicewake.chime` 分类中（会话开始、partial、final、send、dismiss、chime 原因）。

## 下一步

1. **VoiceSessionCoordinator（actor）**
   - 一次只管理一个 `VoiceSession`。
   - API（基于 token）：`beginWakeCapture`、`beginPushToTalk`、`updatePartial`、`endCapture`、`cancel`、`applyCooldown`。
   - 丢弃携带过期 token 的回调（防止旧识别器重新打开浮层）。
2. **VoiceSession（模型）**
   - 字段：`token`、`source`（wakeWord|pushToTalk）、已提交 / 易变文本、chime 标志、计时器（自动发送、空闲）、`overlayMode`（display|editing|sending）、冷却截止时间。
3. **浮层绑定**
   - `VoiceSessionPublisher`（`ObservableObject`）将活动会话镜像到 SwiftUI 中。
   - `VoiceWakeOverlayView` 仅通过 publisher 进行渲染；它绝不会直接修改全局单例。
   - 浮层用户操作（`sendNow`、`dismiss`、`edit`）会携带会话 token 回调到 coordinator。
4. **统一发送路径**
   - 在 `endCapture` 时：如果去除首尾空白后的文本为空 → 关闭；否则执行 `performSend(session:)`（播放一次发送 chime、转发、关闭）。
   - 按住说话：无延迟；唤醒词：可选延迟后自动发送。
   - 在按住说话结束后，对唤醒运行时施加一个短暂冷却期，以避免唤醒词立即再次触发。
5. **日志**
   - Coordinator 会在子系统 `ai.openclaw` 下，以 `voicewake.overlay` 和 `voicewake.chime` 分类输出 `.info` 日志。
   - 关键事件：`session_started`、`adopted_by_push_to_talk`、`partial`、`finalized`、`send`、`dismiss`、`cancel`、`cooldown`。

## 调试检查清单

- 在复现浮层卡住问题时流式查看日志：

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- 确认只有一个活动会话 token；过期回调应由 coordinator 丢弃。
- 确保按住说话释放时始终使用活动 token 调用 `endCapture`；如果文本为空，应预期 `dismiss`，且不会播放 chime 或发送。

## 迁移步骤（建议）

1. 添加 `VoiceSessionCoordinator`、`VoiceSession` 和 `VoiceSessionPublisher`。
2. 重构 `VoiceWakeRuntime`，让它通过创建 / 更新 / 结束会话来工作，而不是直接操作 `VoiceWakeOverlayController`。
3. 重构 `VoicePushToTalk`，使其能够接管现有会话，并在释放时调用 `endCapture`；同时应用运行时冷却。
4. 将 `VoiceWakeOverlayController` 接入 publisher；移除来自 runtime / PTT 的直接调用。
5. 为会话接管、冷却和空文本关闭添加集成测试。
