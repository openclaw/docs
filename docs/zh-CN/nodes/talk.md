---
read_when:
    - 在 macOS/iOS/Android 上实现 Talk 模式
    - 更改语音/文本转语音/中断行为
summary: Talk 模式：跨本地 STT/TTS 和实时语音的连续语音对话
title: Talk 模式
x-i18n:
    generated_at: "2026-05-06T01:51:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

Talk 模式有两种运行时形态：

- 原生 macOS/iOS/Android Talk 使用本地语音识别、Gateway 网关聊天和 `talk.speak` TTS。节点会通告 `talk` 能力，并声明它们支持的 `talk.*` 命令。
- 浏览器 Talk 使用 `talk.client.create` 创建由客户端拥有的 `webrtc` 和 `provider-websocket` 会话，或使用 `talk.session.create` 创建由 Gateway 网关拥有的 `gateway-relay` 会话。`managed-room` 保留用于 Gateway 网关交接和对讲房间。
- 仅转写客户端使用 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`，然后在需要字幕或听写且不需要助手语音回复时使用 `talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`。

原生 Talk 是一个连续的语音对话循环：

1. 监听语音
2. 通过活动会话将转写文本发送给模型
3. 等待回复
4. 通过配置的 Talk 提供商（`talk.speak`）朗读回复

浏览器实时 Talk 通过 `talk.client.toolCall` 转发提供商工具调用；浏览器客户端不会直接调用 `chat.send` 进行实时咨询。

仅转写 Talk 会发出与实时和 STT/TTS 会话相同的通用 Talk 事件信封，但使用 `mode: "transcription"` 和 `brain: "none"`。它用于字幕、听写和仅观察式语音采集；一次性上传的语音留言仍然使用媒体/音频路径。

## 行为（macOS）

- 启用 Talk 模式时显示**始终置顶叠层**。
- **监听 → 思考 → 朗读**阶段转换。
- 在**短暂停顿**（静音窗口）后，会发送当前转写文本。
- 回复会**写入 WebChat**（与输入相同）。
- **说话时打断**（默认开启）：如果用户在助手朗读时开始说话，我们会停止播放，并记录打断时间戳供下一次提示使用。

## 回复中的语音指令

助手可以在回复前加上**单个 JSON 行**来控制语音：

```json
{ "voice": "<voice-id>", "once": true }
```

规则：

- 仅限第一个非空行。
- 未知键会被忽略。
- `once: true` 仅应用于当前回复。
- 如果没有 `once`，该语音会成为 Talk 模式的新默认语音。
- JSON 行会在 TTS 播放前被移除。

支持的键：

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## 配置（`~/.openclaw/openclaw.json`）

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

默认值：

- `interruptOnSpeech`：true
- `silenceTimeoutMs`：未设置时，Talk 会在发送转写文本前保留平台默认停顿窗口（`macOS 和 Android 上为 700 ms，iOS 上为 900 ms`）
- `provider`：选择活动的 Talk 提供商。对 macOS 本地播放路径使用 `elevenlabs`、`mlx` 或 `system`。
- `providers.<provider>.voiceId`：ElevenLabs 会回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或在 API key 可用时使用第一个 ElevenLabs 语音）。
- `providers.elevenlabs.modelId`：未设置时默认为 `eleven_v3`。
- `providers.mlx.modelId`：未设置时默认为 `mlx-community/Soprano-80M-bf16`。
- `providers.elevenlabs.apiKey`：回退到 `ELEVENLABS_API_KEY`（或可用时使用 Gateway 网关 shell profile）。
- `realtime.provider`：选择活动的浏览器/服务器实时语音提供商。WebRTC 使用 `openai`，提供商 WebSocket 使用 `google`，或通过 Gateway 网关 relay 使用仅桥接提供商。
- `realtime.providers.<provider>` 存储由提供商拥有的实时配置。浏览器只会接收临时或受约束的会话凭据，绝不会接收标准 API key。
- `realtime.brain`：`agent-consult` 通过 Gateway 网关策略路由实时工具调用；`direct-tools` 是仅所有者使用的兼容行为；`none` 用于转写或外部编排。
- `talk.catalog` 暴露每个提供商的有效模式、传输协议、brain 策略、实时音频格式和能力标志，以便第一方 Talk 客户端避免不受支持的组合。
- 流式转写提供商通过 `talk.catalog.transcription` 发现。在添加专用 Talk 转写配置界面之前，当前 Gateway 网关 relay 使用 Voice Call 流式提供商配置。
- `speechLocale`：可选的 BCP 47 语言区域 ID，用于 iOS/macOS 上的设备端 Talk 语音识别。留空则使用设备默认值。
- `outputFormat`：macOS/iOS 上默认为 `pcm_44100`，Android 上默认为 `pcm_24000`（设置 `mp3_*` 可强制 MP3 流式传输）

## macOS 界面

- 菜单栏开关：**Talk**
- 配置标签页：**Talk 模式**组（语音 ID + 打断开关）
- 叠层：
  - **监听**：云朵随麦克风电平脉动
  - **思考**：下沉动画
  - **朗读**：向外扩散的圆环
  - 点击云朵：停止朗读
  - 点击 X：退出 Talk 模式

## Android 界面

- 语音标签页开关：**Talk**
- 手动 **Mic** 和 **Talk** 是互斥的运行时采集模式。
- 当应用离开前台或用户离开语音标签页时，手动 Mic 会停止。
- Talk 模式会持续运行，直到被关闭或 Android 节点断开连接，并在活动期间使用 Android 的麦克风前台服务类型。

## 注意事项

- 需要语音 + 麦克风权限。
- 原生 Talk 使用活动的 Gateway 网关会话，并且仅在响应事件不可用时回退到历史轮询。
- 浏览器实时 Talk 对 `openclaw_agent_consult` 使用 `talk.client.toolCall`，而不是向由提供商拥有的浏览器会话暴露 `chat.send`。
- 仅转写 Talk 使用 `talk.session.create`、`talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`；客户端订阅 `talk.event` 来接收部分/最终转写更新。
- Gateway 网关使用活动 Talk 提供商通过 `talk.speak` 解析 Talk 播放。Android 仅在该 RPC 不可用时回退到本地系统 TTS。
- macOS 本地 MLX 播放会在存在时使用内置的 `openclaw-mlx-tts` helper，或使用 `PATH` 上的可执行文件。开发期间可设置 `OPENCLAW_MLX_TTS_BIN` 指向自定义 helper 二进制文件。
- `eleven_v3` 的 `stability` 会被校验为 `0.0`、`0.5` 或 `1.0`；其他模型接受 `0..1`。
- 设置 `latency_tier` 时会校验为 `0..4`。
- Android 支持 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 输出格式，用于低延迟 AudioTrack 流式传输。

## 相关内容

- [语音唤醒](/zh-CN/nodes/voicewake)
- [音频和语音留言](/zh-CN/nodes/audio)
- [媒体理解](/zh-CN/nodes/media-understanding)
