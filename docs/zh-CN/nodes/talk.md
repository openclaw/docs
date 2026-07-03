---
read_when:
    - 在 macOS/iOS/Android 上实现 Talk 模式
    - 更改语音、TTS 和中断行为
summary: Talk 模式：通过本地 STT/TTS 和实时语音进行连续语音对话
title: Talk 模式
x-i18n:
    generated_at: "2026-07-03T09:22:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

Talk 模式有两种运行时形态：

- 原生 macOS/iOS/Android Talk 使用本地语音识别、Gateway 网关聊天和 `talk.speak` TTS。节点会通告 `talk` 能力，并声明它们支持的 `talk.*` 命令。
- iOS Talk 对选择 `webrtc` 或省略传输方式的 OpenAI realtime 配置，使用客户端拥有的 WebRTC。显式的 `gateway-relay`、`provider-websocket` 和非 OpenAI realtime 配置会继续使用 Gateway 网关拥有的中继；非 realtime 配置使用原生语音循环。
- 浏览器 Talk 使用 `talk.client.create` 创建客户端拥有的 `webrtc` 和 `provider-websocket` 会话，或使用 `talk.session.create` 创建 Gateway 网关拥有的 `gateway-relay` 会话。`managed-room` 保留给 Gateway 网关交接和对讲房间。
- Android Talk 可以通过 `talk.realtime.mode: "realtime"` 和 `talk.realtime.transport: "gateway-relay"` 选择加入 Gateway 网关拥有的 realtime 中继会话。否则它会继续使用原生语音识别、Gateway 网关聊天和 `talk.speak`。
- 仅转写客户端在需要无助手语音回复的字幕或听写时，使用 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`，然后使用 `talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`。

原生 Talk 是一个连续的语音对话循环：

1. 监听语音
2. 通过活动会话将转写发送给模型
3. 等待响应
4. 通过配置的 Talk 提供商（`talk.speak`）朗读

客户端拥有的 realtime Talk 通过 `talk.client.toolCall` 转发提供商工具调用；这些客户端不会直接调用 `chat.send` 来进行 realtime 咨询。
当 realtime 咨询处于活动状态时，Talk 客户端可以使用 `talk.client.steer` 或
`talk.session.steer` 将语音输入分类为 `status`、`steer`、`cancel` 或
`followup`。被接受的引导会排入活动的嵌入式运行；被拒绝的
引导会返回结构化原因，例如 `no_active_run`、`not_streaming`
或 `compacting`。

仅转写 Talk 会发出与 realtime 和 STT/TTS 会话相同的通用 Talk 事件信封，但使用 `mode: "transcription"` 和 `brain: "none"`。它用于字幕、听写和仅观察的语音捕获；一次性上传的语音备注仍然使用媒体/音频路径。

## 行为（macOS）

- 启用 Talk 模式时显示**常驻悬浮层**。
- **Listening → Thinking → Speaking** 阶段转换。
- 在**短暂停顿**（静音窗口）后，发送当前转写。
- 回复会**写入 WebChat**（与输入相同）。
- **语音打断**（默认开启）：如果用户在助手说话时开始说话，我们会停止播放，并为下一次提示记录打断时间戳。

## 回复中的语音指令

助手可以在回复前加上**单行 JSON** 来控制语音：

```json
{ "voice": "<voice-id>", "once": true }
```

规则：

- 仅第一行非空内容。
- 未知键会被忽略。
- `once: true` 仅应用于当前回复。
- 没有 `once` 时，该语音会成为 Talk 模式的新默认语音。
- JSON 行会在 TTS 播放前被剥离。

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
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

默认值：

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 未设置时，Talk 会在发送转写前保留平台默认暂停窗口（`macOS 和 Android 上为 700 ms，iOS 上为 900 ms`）
- `provider`: 选择活动的 Talk 提供商。对 macOS 本地播放路径使用 `elevenlabs`、`mlx` 或 `system`。
- `providers.<provider>.voiceId`: 对 ElevenLabs 回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或在 API key 可用时使用第一个 ElevenLabs 语音）。
- `providers.elevenlabs.modelId`: 未设置时默认为 `eleven_v3`。
- `providers.mlx.modelId`: 未设置时默认为 `mlx-community/Soprano-80M-bf16`。
- `providers.elevenlabs.apiKey`: 回退到 `ELEVENLABS_API_KEY`（或可用时的 Gateway 网关 shell 配置文件）。
- `consultThinkingLevel`: 对 realtime `openclaw_agent_consult` 调用背后的完整 OpenClaw 智能体运行，可选覆盖思考级别。
- `consultFastMode`: 对 realtime `openclaw_agent_consult` 调用，可选覆盖快速模式。
- `realtime.provider`: 选择活动的 realtime 语音提供商。对 WebRTC 使用 `openai`，对提供商 WebSocket 使用 `google`，或通过 Gateway 网关中继使用仅桥接的提供商。
- `realtime.providers.<provider>` 存储提供商拥有的 realtime 配置。浏览器只会收到临时或受约束的会话凭证，绝不会收到标准 API key。
- `realtime.providers.openai.voice`: 内置 OpenAI Realtime 语音 ID。当前 `gpt-realtime-2` 语音为 `alloy`、`ash`、`ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin` 和 `cedar`；推荐使用 `marin` 和 `cedar` 以获得最佳质量。
- `realtime.transport`: `webrtc` 在 iOS 和浏览器中使用客户端拥有的 OpenAI WebRTC。`provider-websocket` 由浏览器拥有，但在 iOS 上仍使用 Gateway 网关中继。`gateway-relay` 将提供商音频保留在 Gateway 网关上；Android 仅对此传输使用 realtime，否则保留其原生 STT/TTS 循环。
- `realtime.brain`: `agent-consult` 通过 Gateway 网关策略路由 realtime 工具调用；`direct-tools` 是旧版直接工具兼容行为；`none` 用于转写或外部编排。
- `realtime.consultRouting`: `provider-direct` 在提供商跳过 `openclaw_agent_consult` 时保留提供商的直接回复；`force-agent-consult` 让 Gateway 网关中继通过 OpenClaw 路由最终用户转写。
- `realtime.instructions`: 将面向提供商的系统指令追加到 OpenClaw 的内置 realtime 提示。用于语音风格和语气；OpenClaw 会保留默认的 `openclaw_agent_consult` 指引。
- `talk.catalog` 暴露规范提供商 ID 和注册表别名，并同时提供每个提供商的有效模式、传输方式、brain 策略、realtime 音频格式、能力标志和运行时选择的就绪结果。第一方 Talk 客户端应使用该目录，而不是在本地维护提供商别名；省略分组就绪状态的较旧 Gateway 网关会被视为未验证，而不是明确未配置。
- 流式转写提供商通过 `talk.catalog.transcription` 发现。在专用 Talk 转写配置表面加入之前，当前 Gateway 网关中继会使用 Voice Call 流式提供商配置。
- `speechLocale`: 用于 iOS/macOS 上设备端 Talk 语音识别的可选 BCP 47 语言区域 ID。保持未设置即可使用设备默认值。
- `outputFormat`: 在 macOS/iOS 上默认为 `pcm_44100`，在 Android 上默认为 `pcm_24000`（设置 `mp3_*` 可强制使用 MP3 流式传输）

## macOS UI

- 菜单栏开关：**Talk**
- 配置标签页：**Talk 模式**分组（语音 ID + 打断开关）
- 悬浮层：
  - **Listening**：云朵随麦克风音量脉动
  - **Thinking**：下沉动画
  - **Speaking**：辐射环
  - 点击云朵：停止说话
  - 点击 X：退出 Talk 模式

## Android UI

- 语音标签页开关：**Talk**
- 手动 **Mic** 和 **Talk** 是互斥的运行时捕获模式。
- 手动 Mic 和 realtime Talk 优先使用已连接的 Bluetooth Classic 或 BLE 耳机麦克风。如果连接断开，应用会请求另一个耳机输入，或让 Android 使用默认麦克风；停止捕获会恢复默认麦克风偏好。
- 当应用离开前台或用户离开语音标签页时，手动 Mic 会停止。
- Talk 模式会一直运行，直到被关闭或 Android 节点断开连接，并在活动期间使用 Android 的麦克风前台服务类型。

## 说明

- 需要语音 + 麦克风权限。
- 原生 Talk 使用活动的 Gateway 网关会话，并且仅在响应事件不可用时回退到历史轮询。
- 客户端拥有的 realtime Talk 对 `openclaw_agent_consult` 使用 `talk.client.toolCall`，而不是向提供商拥有的会话暴露 `chat.send`。
- 仅转写 Talk 使用 `talk.session.create`、`talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`；客户端订阅 `talk.event` 以获取部分/最终转写更新。
- Gateway 网关使用活动的 Talk 提供商通过 `talk.speak` 解析 Talk 播放。仅当该 RPC 不可用时，Android 才会回退到本地系统 TTS。
- macOS 本地 MLX 播放会在存在时使用内置的 `openclaw-mlx-tts` helper，或使用 `PATH` 上的可执行文件。在开发期间设置 `OPENCLAW_MLX_TTS_BIN`，使其指向自定义 helper 二进制文件。
- `eleven_v3` 的 `stability` 会被验证为 `0.0`、`0.5` 或 `1.0`；其他模型接受 `0..1`。
- 设置时，`latency_tier` 会被验证为 `0..4`。
- Android 支持 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 输出格式，用于低延迟 AudioTrack 流式传输。

## 相关

- [语音唤醒](/zh-CN/nodes/voicewake)
- [音频和语音备注](/zh-CN/nodes/audio)
- [媒体理解](/zh-CN/nodes/media-understanding)
