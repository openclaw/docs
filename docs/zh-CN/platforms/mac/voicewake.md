---
read_when:
    - 处理语音唤醒或 PTT 路径
summary: 语音唤醒和按键通话模式，以及 Mac 应用中的路由详情
title: 语音唤醒（macOS）
x-i18n:
    generated_at: "2026-07-05T11:28:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# 语音唤醒与按键通话

## 要求

语音唤醒和按键通话需要 macOS 26 或更新版本。在旧版 macOS 上，这些控件会从语音设置页面隐藏，该页面会改为显示 macOS 26 要求。

## 模式

- **唤醒词模式**（默认）：一个始终开启的 Speech 识别器会等待触发词元（`swabbleTriggerWords`）。匹配后，它会开始采集，显示带有部分文本的浮层，并在静音后自动发送。
- **按键通话（按住右 Option）**：按住右 Option 键即可立即采集，不需要触发词。按住期间会显示浮层；松开后会最终确定并在短暂延迟后转发，以便你编辑文本。

## 运行时行为（唤醒词）

- 识别器位于 `VoiceWakeRuntime`。
- 只有当唤醒词和下一个词之间存在有意义的停顿时才会触发（`triggerPauseWindow` = 0.55s）。即使命令尚未开始，浮层/提示音也可以在停顿时启动。
- 静音窗口：语音连续时为 2.0s（`silenceWindow`），如果只听到触发词则为 5.0s（`triggerOnlySilenceWindow`）。
- 硬停止：120s（`captureHardStop`），用于防止会话失控。
- 会话之间的防抖：发送后 350ms（`debounceAfterSend`）。
- 浮层通过 `VoiceWakeOverlayController` 驱动，并使用已提交/易变文本着色。
- 发送后，识别器会干净地重启以监听下一个触发词。

## 生命周期不变量

- 如果启用了语音唤醒并且已授予权限，唤醒词识别器会持续监听，除非正在进行按键通话采集。
- 浮层关闭（包括通过 X 按钮手动关闭）总是会恢复识别器：`VoiceSessionCoordinator.overlayDidDismiss` 会在每条关闭路径上调用 `VoiceWakeRuntime.refresh(state:)`。有关会话/令牌模型，请参阅[语音浮层](/zh-CN/platforms/mac/voice-overlay)。

## 按键通话细节

- 热键检测使用全局 `.flagsChanged` 监视器监听右 Option（`keyCode 61` + `.option`）。它只观察事件，绝不吞掉事件。
- 采集位于 `VoicePushToTalk`：立即启动 Speech，将部分结果流式传输到浮层，并在松开时调用 `VoiceWakeForwarder`。
- 启动按键通话会暂停唤醒词运行时，以避免音频 tap 互相竞争；松开后会自动重启。
- 权限：需要麦克风 + Speech；接收按键事件需要辅助功能/输入监控批准。
- 外接键盘：有些外接键盘不会按预期暴露右 Option。如果用户报告漏检，请提供备用快捷键。

## 面向用户的设置

- **语音唤醒**开关：启用唤醒词运行时。
- **按住右 Option 说话**：启用按键通话监视器。
- 语言和麦克风选择器、实时电平表、触发词表，以及测试器（仅本地，绝不转发）。
- 如果设备断开连接，麦克风选择器会保留上次选择，显示断开连接提示，并临时回退到系统默认设备，直到该设备恢复。
- **声音**：在检测到触发词和发送时播放提示音，默认使用 macOS “Glass”系统声音。可为每个事件选择任何可由 `NSSound` 加载的文件（例如 MP3/WAV/AIFF），或选择**无声音**。

## 转发行为

- 转发时，如果已设置活动 WebChat 会话键，`VoiceWakeForwarder.selectedSessionOptions` 会选择它；否则选择 Gateway 网关的主会话键。
- 它会通过 `sessions.list` 查找该会话，并从会话的投递上下文派生投递渠道和目标（回退到其上次使用的渠道/目标，然后回退到解析后的会话键）；如果无法解析任何内容，则默认使用 WebChat。
- 如果投递失败，错误会被记录（`voicewake.forward` 类别），并且该运行仍可通过 WebChat/会话日志看到。

## 转发载荷

- `VoiceWakeForwarder.prefixedTranscript(_:)` 会在转录文本前添加一行机器提示（解析出的主机名，回退为 “this Mac”），唤醒词和按键通话路径共用该逻辑。

## 快速验证

- 打开按键通话开关，按住右 Option，说话，然后松开：浮层应显示部分结果，然后发送。
- 按住期间，菜单栏耳朵图标应保持放大（`triggerVoiceEars(ttl: nil)`）；松开后恢复。

## 相关

- [语音唤醒](/zh-CN/nodes/voicewake)
- [语音浮层](/zh-CN/platforms/mac/voice-overlay)
- [macOS 应用](/zh-CN/platforms/macos)
