---
read_when:
    - 处理语音唤醒或 PTT 路径
summary: Mac 应用中的语音唤醒和按键说话模式及路由详情
title: 语音唤醒（macOS）
x-i18n:
    generated_at: "2026-07-11T20:39:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# 语音唤醒与按住说话

## 要求

语音唤醒和按住说话需要 macOS 26 或更高版本。在较旧的 macOS 上，相关控件会从语音设置页面隐藏，页面会改为显示 macOS 26 的版本要求。

## 模式

- **唤醒词模式**（默认）：始终开启的语音识别器等待触发词（`swabbleTriggerWords`）。匹配后，它会开始采集，显示包含部分识别文本的浮层，并在检测到静音后自动发送。
- **按住说话（按住右 Option 键）**：按住右侧 Option 键即可立即采集，无需触发词。按住期间会显示浮层；松开后会完成识别，并在短暂延迟后转发，让你可以编辑文本。

## 运行时行为（唤醒词）

- 识别器位于 `VoiceWakeRuntime` 中。
- 仅当唤醒词与下一个词之间存在明显停顿时才会触发（`triggerPauseWindow` = 0.55 秒）。即使指令尚未开始，浮层或提示音也可以在停顿时启动。
- 静音窗口：语音持续输入时为 2.0 秒（`silenceWindow`）；如果只听到触发词，则为 5.0 秒（`triggerOnlySilenceWindow`）。
- 强制停止：120 秒（`captureHardStop`），用于防止会话失控。
- 会话间防抖：发送后等待 350 毫秒（`debounceAfterSend`）。
- 浮层由 `VoiceWakeOverlayController` 驱动，并以不同颜色显示已确认和临时文本。
- 发送后，识别器会干净地重新启动，以监听下一个触发词。

## 生命周期不变量

- 如果语音唤醒已启用且已授予权限，唤醒词识别器会持续监听，但正在进行按住说话采集时除外。
- 关闭浮层（包括通过 X 按钮手动关闭）始终会恢复识别器：`VoiceSessionCoordinator.overlayDidDismiss` 会在每条关闭路径上调用 `VoiceWakeRuntime.refresh(state:)`。有关会话/令牌模型，请参阅[语音浮层](/zh-CN/platforms/mac/voice-overlay)。

## 按住说话的具体行为

- 热键检测使用针对右侧 Option 键（`keyCode 61` + `.option`）的全局 `.flagsChanged` 监视器。它只观察事件，绝不会拦截事件。
- 采集位于 `VoicePushToTalk` 中：立即启动语音识别，将部分识别结果流式传输到浮层，并在松开按键时调用 `VoiceWakeForwarder`。
- 启动按住说话会暂停唤醒词运行时，以避免音频采集冲突；松开后会自动重新启动。
- 权限：需要麦克风和语音识别权限；接收按键事件需要辅助功能/输入监控授权。
- 外接键盘：部分键盘不会按预期提供右侧 Option 键。如果用户报告无法触发，请提供备用快捷键。

## 面向用户的设置

- **语音唤醒**开关：启用唤醒词运行时。
- **按住右 Option 键说话**：启用按住说话监视器。
- 语言和麦克风选择器、实时音量表、触发词表格，以及测试器（仅在本地运行，绝不转发）。
- 如果设备断开连接，麦克风选择器会保留上次选择，显示断开连接提示，并暂时回退到系统默认设备，直到该设备恢复连接。
- **声音**：检测到触发词和发送时播放提示音，默认使用 macOS 的“Glass”系统声音。可以为每个事件选择任何可由 `NSSound` 加载的文件（例如 MP3/WAV/AIFF），也可以选择 **No Sound**。

## 转发行为

- 转发时，如果已设置活跃的 WebChat 会话键，`VoiceWakeForwarder.selectedSessionOptions` 会选择该键；否则选择 Gateway 网关的主会话键。
- 它会通过 `sessions.list` 查找该会话，并从会话的投递上下文推导投递渠道和目标（依次回退到其最后使用的渠道/目标，再回退到解析后的会话键）；如果均无法解析，则默认为 WebChat。
- 如果投递失败，错误会记录到日志（`voicewake.forward` 类别），并且仍可通过 WebChat/会话日志查看该次运行。

## 转发载荷

- `VoiceWakeForwarder.prefixedTranscript(_:)` 会在转录文本前添加一行机器提示（解析出的主机名，无法解析时回退为“这台 Mac”）；唤醒词和按住说话路径共用此行为。

## 快速验证

- 开启按住说话，按住右侧 Option 键并讲话，然后松开：浮层应先显示部分识别结果，随后发送。
- 按住期间，菜单栏中的耳朵图标应保持放大（`triggerVoiceEars(ttl: nil)`）；松开后恢复原状。

## 相关内容

- [语音唤醒](/zh-CN/nodes/voicewake)
- [语音浮层](/zh-CN/platforms/mac/voice-overlay)
- [macOS 应用](/zh-CN/platforms/macos)
