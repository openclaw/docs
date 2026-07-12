---
read_when:
    - 在 macOS/iOS/Android 上实现 Talk 模式
    - 更改语音/TTS/打断行为
summary: Talk 模式：通过本地 STT/TTS 和实时语音进行连续语音对话
title: Talk 模式
x-i18n:
    generated_at: "2026-07-11T20:37:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

Talk 模式涵盖五种运行时形态：

- **原生 macOS/iOS/Android Talk**：本地语音识别、Gateway 网关聊天和 `talk.speak` TTS。节点会公布 `talk` 能力，并声明其支持的 `talk.*` 命令。
- **iOS Talk（实时）**：对于选择 `webrtc` 传输或省略传输设置的 OpenAI 实时配置，由客户端负责 WebRTC。显式使用 `gateway-relay`、`provider-websocket` 以及非 OpenAI 的实时配置仍使用 Gateway 网关负责的中继；非实时配置使用原生语音循环。
- **浏览器 Talk**：客户端负责的 `webrtc`/`provider-websocket` 会话使用 `talk.client.create`，Gateway 网关负责的 `gateway-relay` 会话使用 `talk.session.create`。`managed-room` 保留用于 Gateway 网关移交和对讲机房间。
- **Android Talk（实时）**：通过 `talk.realtime.mode: "realtime"` 和 `talk.realtime.transport: "gateway-relay"` 选择启用。否则，Android 继续使用原生语音识别、Gateway 网关聊天和 `talk.speak`。
- **仅转录客户端**：调用 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`，然后使用 `talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`，在没有智能体语音响应的情况下提供字幕或听写。一次性上传的语音留言仍使用[媒体理解](/zh-CN/nodes/media-understanding)音频路径。

原生 Talk 是一个连续循环：监听语音，通过活动会话将转录文本发送给模型，等待响应，然后通过配置的 Talk 提供商（`talk.speak`）朗读响应。

客户端负责的实时 Talk 通过 `talk.client.toolCall` 转发提供商工具调用，而不是直接调用 `chat.send`。实时咨询处于活动状态时，客户端可以调用 `talk.client.steer` 或 `talk.session.steer`，将语音输入分类为 `status`、`steer`、`cancel` 或 `followup`。接受的引导会排入活动的嵌入式运行队列；被拒绝的引导会返回 `no_active_run`、`not_streaming` 或 `compacting` 等原因。

仅转录 Talk 发出的 Talk 事件封装与实时会话和 STT/TTS 会话相同，但使用 `mode: "transcription"` 和 `brain: "none"`。所有 Talk 会话都在 `talk.event` 渠道上广播事件；客户端订阅该渠道，以接收部分/最终转录更新（`transcript.delta`/`transcript.done`）和其他会话遥测数据。

## 行为（macOS）

- 启用 Talk 模式时始终显示浮层。
- **聆听 &rarr; 思考 &rarr; 朗读**阶段转换。
- 短暂停顿（静音窗口）后，发送当前转录文本。
- 回复会写入 WebChat（与输入文字相同）。
- **语音打断**（默认开启）：如果用户在智能体朗读时说话，播放会停止，并记录打断时间戳，供下一条提示使用。

## 回复中的语音指令

智能体可以在回复开头添加一行 JSON 来控制语音：

```json
{ "voice": "<voice-id>", "once": true }
```

规则：

- 仅处理第一个非空行；在 TTS 播放前会移除该 JSON 行。
- 未知键会被忽略。
- `once: true` 仅应用于当前回复；如果不设置，所选语音会成为新的 Talk 模式默认值。

支持的键：`voice` / `voice_id` / `voiceId`、`model` / `model_id` / `modelId`、`speed`、`rate`（WPM）、`stability`、`similarity`、`style`、`speakerBoost`、`seed`、`normalize`、`lang`、`output_format`、`latency_tier`、`once`。

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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
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

| 键                                       | 默认值                                     | 说明                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | 活动的 Talk TTS 提供商。对于 macOS 本地播放路径，请使用 `elevenlabs`、`mlx` 或 `system`。                                                                                                                                                                                  |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs 会回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`，或在有 API key 时使用第一个可用语音。                                                                                                                                                                          |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | 回退到 `ELEVENLABS_API_KEY`（如果可用，也可使用 Gateway 网关 shell 配置文件）。                                                                                                                                                                                            |
| `speechLocale`                           | 设备默认值                                 | iOS/macOS 设备端 Talk 语音识别使用的 BCP 47 区域设置 ID。                                                                                                                                                                                                                  |
| `silenceTimeoutMs`                       | macOS/Android 为 `700` 毫秒，iOS 为 `900` 毫秒 | Talk 发送转录文本前的停顿窗口。                                                                                                                                                                                                                                            |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | macOS/iOS 为 `pcm_44100`，Android 为 `pcm_24000` | 设置为 `mp3_*` 可强制使用 MP3 流式传输。                                                                                                                                                                                                                                   |
| `consultThinkingLevel`                   | 未设置                                     | 覆盖实时 `openclaw_agent_consult` 调用背后的智能体运行思考级别。                                                                                                                                                                                                           |
| `consultFastMode`                        | 未设置                                     | 覆盖实时 `openclaw_agent_consult` 调用的快速模式。                                                                                                                                                                                                                         |
| `realtime.provider`                      | -                                          | WebRTC 使用 `openai`，提供商 WebSocket 使用 `google`，或通过 Gateway 网关中继使用仅支持桥接的提供商。                                                                                                                                                                      |
| `realtime.providers.<id>`                | -                                          | 由提供商负责的实时配置。浏览器只会收到临时的、受限的会话凭据，绝不会收到标准 API key。                                                                                                                                                                                      |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | 内置 OpenAI Realtime 语音 ID（较旧的 `voice` 键仍可使用，但已弃用）。当前 `gpt-realtime-2.1` 语音包括：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`marin`、`sage`、`shimmer`、`verse`；建议使用 `marin` 和 `cedar` 以获得最佳质量。 |
| `realtime.transport`                     | -                                          | `webrtc`：在 iOS 和浏览器中由客户端负责 OpenAI WebRTC。`provider-websocket`：在浏览器中由客户端负责，在 iOS 上仍使用 Gateway 网关中继。`gateway-relay`：将提供商音频保留在 Gateway 网关上；Android 仅在使用此传输方式时启用实时模式。                                          |
| `realtime.brain`                         | -                                          | `agent-consult` 通过 Gateway 网关策略路由实时工具调用；`direct-tools` 是旧版直接工具兼容模式；`none` 用于转录或外部编排。                                                                                                                                                    |
| `realtime.consultRouting`                | -                                          | 当提供商跳过 `openclaw_agent_consult` 时，`provider-direct` 会保留提供商的直接回复；`force-agent-consult` 则会通过 OpenClaw 路由已定稿的用户转录文本。                                                                                                                       |
| `realtime.instructions`                  | -                                          | 将面向提供商的系统指令附加到 OpenClaw 的内置实时提示中（语音风格/语气）；默认的 `openclaw_agent_consult` 指引保持不变。                                                                                                                                                    |

`talk.catalog` 会公开规范提供商 ID 和注册表别名，以及各提供商的有效模式、传输协议、brain 策略、实时音频格式、能力标志和运行时选定的就绪结果。第一方 Talk 客户端应读取该目录，而不是在本地维护提供商别名；对于未提供分组就绪状态的旧版 Gateway 网关，应视为未经验证，而不是明确判定为未配置。流式转录提供商通过 `talk.catalog.transcription` 发现；在专用 Talk 转录配置界面发布之前，当前 Gateway 网关中继使用 Voice Call 流式提供商配置。

## macOS UI

- 菜单栏开关：**Talk**
- 配置选项卡：**Talk 模式**组（语音 ID + 打断开关）
- 浮层：圆球会呈现通用 Talk 波形（与 iOS、watchOS 和 Android 共享）。聆听状态跟随实时麦克风音量，说话状态跟随实际 TTS 播放包络，思考状态则轻柔呼吸。单击圆球可暂停/继续，双击可停止说话，单击 X 可退出 Talk 模式。

## Android UI

- 语音选项卡开关：**Talk**
- 手动 **Mic** 和 **Talk** 是互斥的采集模式。
- 手动 Mic 和实时 Talk 优先使用已连接的 Bluetooth Classic 或 BLE 耳机麦克风；如果连接断开，应用会请求其他耳机输入，或回退到默认麦克风，并在采集停止后恢复默认偏好设置。
- 当应用离开前台或用户离开语音选项卡时，手动 Mic 会停止。
- Talk 模式会持续运行，直到关闭开关或节点断开连接；处于活动状态时使用 Android 的麦克风前台服务类型。
- Android 支持 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 输出格式，可用于低延迟 `AudioTrack` 流式传输。

## 注意事项

- 需要语音识别和麦克风权限。
- 原生 Talk 使用当前 Gateway 网关会话，只有在响应事件不可用时才回退到历史记录轮询。
- Gateway 网关使用当前 Talk 提供商，通过 `talk.speak` 解析 Talk 播放。Android 仅在该 RPC 不可用时回退到本地系统 TTS。
- macOS 本地 MLX 播放会使用内置的 `openclaw-mlx-tts` 辅助程序（如果存在），否则使用 `PATH` 中的可执行文件。开发期间，可设置 `OPENCLAW_MLX_TTS_BIN` 以指向自定义辅助程序二进制文件。
- 语音指令值范围（ElevenLabs）：`stability`、`similarity` 和 `style` 接受 `0..1`；`speed` 接受 `0.5..2`；`latency_tier` 接受 `0..4`。

## 相关内容

- [语音唤醒](/zh-CN/nodes/voicewake)
- [音频和语音备注](/zh-CN/nodes/audio)
- [媒体理解](/zh-CN/nodes/media-understanding)
