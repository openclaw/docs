---
read_when:
    - 开发语音唤醒或按住说话路径
summary: mac 应用中的语音唤醒与按住说话模式，以及路由细节
title: 语音唤醒（macOS）
x-i18n:
    generated_at: "2026-04-24T04:06:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0273c24764f0baf440a19f31435d6ee62ab040c1ec5a97d7733d3ec8b81b0641
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# 语音唤醒与按住说话

## 模式

- **唤醒词模式**（默认）：始终开启的 Speech 识别器会等待触发词（`swabbleTriggerWords`）。匹配后，它会开始采集、显示带有部分文本的覆盖层，并在静音后自动发送。
- **按住说话（按住右 Option 键）**：按住右侧 Option 键即可立即开始采集——无需触发词。按住期间会显示覆盖层；松开后会完成并在短暂延迟后转发，这样你可以微调文本。

## 运行时行为（唤醒词）

- Speech 识别器位于 `VoiceWakeRuntime` 中。
- 只有当唤醒词与下一个词之间存在**明显停顿**时，触发才会生效（约 `0.55s` 间隔）。覆盖层/提示音甚至可以在命令开始前的停顿阶段就启动。
- 静音窗口：当语音持续流动时为 2.0 秒；如果只听到触发词，则为 5.0 秒。
- 强制停止：120 秒，以防止会话失控。
- 会话间去抖动：350 毫秒。
- 覆盖层通过 `VoiceWakeOverlayController` 驱动，并带有已提交/易失着色。
- 发送后，识别器会干净地重新启动，以监听下一个触发词。

## 生命周期不变量

- 如果启用了 Voice Wake 且已授予权限，唤醒词识别器应处于监听状态（明确的按住说话采集期间除外）。
- 覆盖层可见性（包括通过 X 按钮手动关闭）绝不能阻止识别器恢复。

## 覆盖层卡住的故障模式（之前）

之前，如果覆盖层卡在可见状态，而你手动将其关闭，Voice Wake 可能会看起来“失效”，因为运行时的重启尝试可能会被覆盖层可见性阻止，并且之后不会安排新的重启。

加固措施：

- 唤醒运行时重启不再受覆盖层可见性阻塞。
- 覆盖层关闭完成会通过 `VoiceSessionCoordinator` 触发 `VoiceWakeRuntime.refresh(...)`，因此手动点击 X 关闭后始终会恢复监听。

## 按住说话细节

- 热键检测使用全局 `.flagsChanged` 监视器来监听**右侧 Option**（`keyCode 61` + `.option`）。我们只观察事件（不会拦截）。
- 采集流水线位于 `VoicePushToTalk`：立即启动 Speech，将部分内容流式传输到覆盖层，并在松开时调用 `VoiceWakeForwarder`。
- 当按住说话开始时，我们会暂停唤醒词运行时，以避免音频 tap 互相竞争；松开后会自动重启。
- 权限：需要 Microphone + Speech；要看到事件，还需要批准 Accessibility/Input Monitoring。
- 外接键盘：有些键盘可能无法按预期暴露右侧 Option——如果用户反馈漏检，请提供备用快捷键。

## 面向用户的设置

- **Voice Wake** 开关：启用唤醒词运行时。
- **按住 Cmd+Fn 说话**：启用按住说话监视器。在 macOS < 26 上禁用。
- 语言和麦克风选择器、实时电平表、触发词表、测试器（仅本地；不会转发）。
- 麦克风选择器会在设备断开连接时保留上次选择，显示断开提示，并在设备恢复前临时回退到系统默认设备。
- **声音**：在检测到触发词和发送时播放提示音；默认使用 macOS 的 “Glass” 系统声音。你可以为每个事件选择任意 `NSSound` 可加载的文件（例如 MP3/WAV/AIFF），或选择 **No Sound**。

## 转发行为

- 启用 Voice Wake 时，转录内容会被转发到当前活动的 Gateway 网关 /智能体（与 mac 应用其余部分使用的本地或远程模式相同）。
- 回复会投递到**最近使用的主 provider**（WhatsApp/Telegram/Discord/WebChat）。如果投递失败，会记录错误，且你仍可通过 WebChat/会话日志看到此次运行。

## 转发负载

- `VoiceWakeForwarder.prefixedTranscript(_:)` 会在发送前添加机器提示。由唤醒词和按住说话路径共享。

## 快速验证

- 打开按住说话，按住 Cmd+Fn，说话，然后松开：覆盖层应显示部分文本，然后发送。
- 按住期间，菜单栏中的耳朵图标应保持放大（使用 `triggerVoiceEars(ttl:nil)`）；松开后会恢复。

## 相关内容

- [语音唤醒](/zh-CN/nodes/voicewake)
- [语音覆盖层](/zh-CN/platforms/mac/voice-overlay)
- [macOS 应用](/zh-CN/platforms/macos)
