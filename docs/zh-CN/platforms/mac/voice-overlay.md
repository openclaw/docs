---
read_when:
    - 调整语音覆盖层行为
summary: 当唤醒词和按住说话重叠时的语音覆盖层生命周期
title: 语音覆盖层
x-i18n:
    generated_at: "2026-04-24T04:06:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# 语音覆盖层生命周期（macOS）

目标读者：macOS 应用贡献者。目标：当唤醒词和按住说话重叠时，保持语音覆盖层行为可预测。

## 当前意图

- 如果覆盖层已经因唤醒词而可见，而用户此时按下热键，则热键会话会_接管_现有文本，而不是重置它。只要用户持续按住热键，覆盖层就会保持显示。用户松开时：若存在去除首尾空白后的文本，则发送；否则关闭。
- 仅使用唤醒词时，静音后仍会自动发送；按住说话则在松开时立即发送。

## 已实现（2025 年 12 月 9 日）

- 覆盖层会话现在为每次捕获（唤醒词或按住说话）携带一个 token。当 partial / final / send / dismiss / level 更新的 token 不匹配时，这些更新会被丢弃，从而避免过期回调。
- 按住说话会将任何当前可见的覆盖层文本作为前缀接管（因此当唤醒覆盖层可见时按下热键，会保留文本并附加新的语音）。它最多等待 1.5 秒以获取最终转录，否则回退到当前文本。
- 铃声 / 覆盖层日志现在会在类别 `voicewake.overlay`、`voicewake.ptt` 和 `voicewake.chime` 下以 `info` 级别输出（会话开始、partial、final、send、dismiss、铃声原因）。

## 后续步骤

1. **VoiceSessionCoordinator（actor）**
   - 一次只拥有一个 `VoiceSession`。
   - API（基于 token）：`beginWakeCapture`、`beginPushToTalk`、`updatePartial`、`endCapture`、`cancel`、`applyCooldown`。
   - 丢弃携带过期 token 的回调（防止旧识别器重新打开覆盖层）。
2. **VoiceSession（模型）**
   - 字段：`token`、`source`（wakeWord | pushToTalk）、已提交 / 易变文本、铃声标志、计时器（自动发送、空闲）、`overlayMode`（display | editing | sending）、冷却截止时间。
3. **覆盖层绑定**
   - `VoiceSessionPublisher`（`ObservableObject`）将活动会话镜像到 SwiftUI 中。
   - `VoiceWakeOverlayView` 仅通过 publisher 进行渲染；它绝不直接修改全局单例。
   - 覆盖层用户操作（`sendNow`、`dismiss`、`edit`）会携带会话 token 回调到 coordinator。
4. **统一发送路径**
   - 在 `endCapture` 时：如果去除首尾空白后的文本为空 → 关闭；否则执行 `performSend(session:)`（只播放一次发送铃声、转发、关闭）。
   - 按住说话：无延迟；唤醒词：可选延迟后自动发送。
   - 在按住说话结束后，对唤醒运行时应用一个短暂冷却期，以避免唤醒词立即再次触发。
5. **日志**
   - Coordinator 在子系统 `ai.openclaw` 的类别 `voicewake.overlay` 和 `voicewake.chime` 下输出 `.info` 日志。
   - 关键事件：`session_started`、`adopted_by_push_to_talk`、`partial`、`finalized`、`send`、`dismiss`、`cancel`、`cooldown`。

## 调试检查清单

- 在复现粘滞覆盖层问题时流式查看日志：

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- 验证始终只有一个活动会话 token；过期回调应被 coordinator 丢弃。
- 确保按住说话释放时总是使用活动 token 调用 `endCapture`；如果文本为空，应预期发生 `dismiss`，且不会有铃声或发送。

## 迁移步骤（建议）

1. 添加 `VoiceSessionCoordinator`、`VoiceSession` 和 `VoiceSessionPublisher`。
2. 重构 `VoiceWakeRuntime`，使其通过创建 / 更新 / 结束会话来工作，而不是直接操作 `VoiceWakeOverlayController`。
3. 重构 `VoicePushToTalk`，使其接管现有会话，并在释放时调用 `endCapture`；同时应用运行时冷却。
4. 将 `VoiceWakeOverlayController` 连接到 publisher；移除来自 runtime / PTT 的直接调用。
5. 为会话接管、冷却和空文本关闭添加集成测试。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [语音唤醒（macOS）](/zh-CN/platforms/mac/voicewake)
- [Talk 模式](/zh-CN/nodes/talk)
