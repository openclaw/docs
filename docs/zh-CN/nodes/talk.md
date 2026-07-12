---
read_when:
    - 在 macOS/iOS/Android 上实现 Talk 模式
    - 更改语音/TTS/打断行为
summary: Talk 模式：通过本地 STT/TTS 和实时语音进行连续语音对话
title: Talk 模式
x-i18n:
    generated_at: "2026-07-12T14:33:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

Talk 模式涵盖五种运行时形态：

- **原生 macOS/iOS/Android Talk**：本地语音识别、Gateway 网关聊天和 `talk.speak` TTS。节点会公布 `talk` 能力，并声明其支持的 `talk.*` 命令。
- **iOS Talk（实时）**：对于选择 `webrtc` 传输或省略传输的 OpenAI 实时配置，由客户端负责 WebRTC。显式指定 `gateway-relay`、`provider-websocket` 的配置以及非 OpenAI 实时配置仍使用由 Gateway 网关负责的中继；非实时配置使用原生语音循环。
- **浏览器 Talk**：由客户端负责的 `webrtc`/`provider-websocket` 会话使用 `talk.client.create`，由 Gateway 网关负责的 `gateway-relay` 会话使用 `talk.session.create`。`managed-room` 保留用于 Gateway 网关移交和对讲机房间。
- **Android Talk（实时）**：通过 `talk.realtime.mode: "realtime"` 和 `talk.realtime.transport: "gateway-relay"` 选择启用。否则，Android 仍使用原生语音识别、Gateway 网关聊天和 `talk.speak`。
- **仅转录客户端**：使用 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`，然后使用 `talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close` 实现不含助手语音回复的字幕/听写。一次性上传的语音留言仍使用[媒体理解](/zh-CN/nodes/media-understanding)音频路径。

原生 Talk 是一个持续循环：监听语音，通过活动会话将转录文本发送给模型，等待回复，然后通过配置的 Talk 提供商（`talk.speak`）将其朗读出来。

由客户端负责的实时 Talk 会通过 `talk.client.toolCall` 转发提供商工具调用，而不是直接调用 `chat.send`。实时问询处于活动状态时，客户端可以调用 `talk.client.steer` 或 `talk.session.steer`，将语音输入分类为 `status`、`steer`、`cancel` 或 `followup`。接受的引导会排入活动的嵌入式运行队列；拒绝的引导会返回原因，例如 `no_active_run`、`not_streaming` 或 `compacting`。

仅转录 Talk 会发出与实时会话和 STT/TTS 会话相同的 Talk 事件信封，但使用 `mode: "transcription"` 和 `brain: "none"`。所有 Talk 会话都会在 `talk.event` 渠道上广播事件；客户端订阅该渠道，以接收部分/最终转录更新（`transcript.delta`/`transcript.done`）和其他会话遥测数据。

## 行为（macOS）

- 启用 Talk 模式时始终显示悬浮层。
- **聆听 &rarr; 思考 &rarr; 朗读**阶段转换。
- 短暂停顿（静音窗口）后，会发送当前转录文本。
- 回复会写入 WebChat（与键入消息相同）。
- **语音打断**（默认开启）：如果用户在助手朗读时说话，播放会停止，并记录打断时间戳以用于下一个提示词。

## 回复中的语音指令

助手可以在回复开头添加一行 JSON 来控制语音：

```json
{ "voice": "<voice-id>", "once": true }
```

规则：

- 仅限第一个非空行；TTS 播放前会移除该 JSON 行。
- 未知键会被忽略。
- `once: true` 仅应用于当前回复；如果不指定，所选语音会成为新的 Talk 模式默认语音。

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
      instructions: "温暖地说话，并保持回答简短。",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| 键                                       | 默认值                                     | 说明                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | 当前使用的 Talk TTS 提供商。macOS 本地播放路径可使用 `elevenlabs`、`mlx` 或 `system`。                                                                                                                                                                                      |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs 会回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`，或在存在 API key 时使用第一个可用语音。                                                                                                                                                                        |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | 回退到 `ELEVENLABS_API_KEY`（如果可用，也可使用 Gateway 网关 shell 配置文件）。                                                                                                                                                                                            |
| `speechLocale`                           | 设备默认值                                 | iOS/macOS 上设备端 Talk 语音识别所使用的 BCP 47 区域设置 ID。                                                                                                                                                                                                              |
| `silenceTimeoutMs`                       | macOS/Android 为 `700` ms，iOS 为 `900` ms | Talk 发送转录文本前的停顿窗口。                                                                                                                                                                                                                                            |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | macOS/iOS 为 `pcm_44100`，Android 为 `pcm_24000` | 设置为 `mp3_*` 可强制使用 MP3 流式传输。                                                                                                                                                                                                                                   |
| `consultThinkingLevel`                   | 未设置                                     | 对实时 `openclaw_agent_consult` 调用背后的智能体运行覆盖思考级别。                                                                                                                                                                                                         |
| `consultFastMode`                        | 未设置                                     | 对实时 `openclaw_agent_consult` 调用覆盖快速模式。                                                                                                                                                                                                                         |
| `realtime.provider`                      | -                                          | WebRTC 使用 `openai`，提供商 WebSocket 使用 `google`，或通过 Gateway 网关中继使用仅支持桥接的提供商。                                                                                                                                                                      |
| `realtime.providers.<id>`                | -                                          | 由提供商负责的实时配置。浏览器只会收到临时的/受约束的会话凭据，绝不会收到标准 API key。                                                                                                                                                                                    |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | 内置 OpenAI Realtime 语音 ID（旧版 `voice` 键仍然有效，但已弃用）。当前 `gpt-realtime-2.1` 语音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`marin`、`sage`、`shimmer`、`verse`；建议使用 `marin` 和 `cedar` 以获得最佳质量。 |
| `realtime.transport`                     | -                                          | `webrtc`：iOS 和浏览器中由客户端负责的 OpenAI WebRTC。`provider-websocket`：在浏览器中由客户端负责，在 iOS 上仍使用 Gateway 网关中继。`gateway-relay`：使提供商音频保留在 Gateway 网关上；Android 仅在使用此传输时启用实时模式。 |
| `realtime.brain`                         | -                                          | `agent-consult` 通过 Gateway 网关策略路由实时工具调用；`direct-tools` 是旧版直接工具兼容模式；`none` 用于转录/外部编排。                                                                                                                                                     |
| `realtime.consultRouting`                | -                                          | 当提供商跳过 `openclaw_agent_consult` 时，`provider-direct` 会保留提供商的直接回复；`force-agent-consult` 则会改为通过 OpenClaw 路由已定稿的用户转录文本。                                                                                                                    |
| `realtime.instructions`                  | -                                          | 将面向提供商的系统指令附加到 OpenClaw 内置实时提示词（语音风格/语调）中；默认的 `openclaw_agent_consult` 指引保持不变。                                                                                                                                                      |

`talk.catalog` 会公开规范提供商 ID 和注册表别名，以及各提供商的有效模式、传输方式、brain 策略、实时音频格式、能力标志和运行时选定的就绪状态结果。第一方 Talk 客户端应读取该目录，而不是在本地维护提供商别名；对于未提供分组就绪状态的旧版 Gateway 网关，应将其视为未经验证，而不是明确判定为未配置。流式转录提供商通过 `talk.catalog.transcription` 发现；在专用 Talk 转录配置界面发布之前，当前 Gateway 网关中继使用 Voice Call 流式提供商配置。

## macOS UI

- 菜单栏开关：**Talk**
- 配置标签页：**Talk Mode** 组（语音 ID + 打断开关）
- 浮层：圆球会呈现通用 Talk 波形（与 iOS、watchOS 和 Android 共用）。监听时跟随实时麦克风音量，朗读时跟随实际 TTS 播放包络，思考时轻柔呼吸。单击圆球可暂停/继续，双击可停止朗读，单击 X 可退出 Talk 模式。

## Android UI

- Voice 标签页开关：**Talk**
- 手动 **Mic** 和 **Talk** 是互斥的采集模式。
- 手动 Mic 和实时 Talk 会优先使用已连接的 Bluetooth Classic 或 BLE 耳机麦克风；如果连接断开，应用会请求另一个耳机输入，或回退到默认麦克风，并在采集停止后恢复默认偏好设置。
- 当应用离开前台或用户离开 Voice 标签页时，手动 Mic 会停止。
- Talk 模式会持续运行，直至关闭开关或节点断开连接；运行期间使用 Android 的麦克风前台服务类型。
- Android 支持 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 输出格式，以进行低延迟 `AudioTrack` 流式传输。

## 注意事项

- 需要语音和麦克风权限。
- 原生 Talk 使用当前 Gateway 网关会话，并且仅在响应事件不可用时才回退到轮询历史记录。
- Gateway 网关使用当前 Talk 提供商，通过 `talk.speak` 解析 Talk 播放。仅当该 RPC 不可用时，Android 才会回退到本地系统 TTS。
- macOS 本地 MLX 播放会使用内置的 `openclaw-mlx-tts` 辅助程序（如果存在），或使用 `PATH` 中的可执行文件。开发期间可设置 `OPENCLAW_MLX_TTS_BIN`，使其指向自定义辅助程序二进制文件。
- 语音指令值范围（ElevenLabs）：`stability`、`similarity` 和 `style` 接受 `0..1`；`speed` 接受 `0.5..2`；`latency_tier` 接受 `0..4`。

## 相关内容

- [语音唤醒](/zh-CN/nodes/voicewake)
- [音频和语音消息](/zh-CN/nodes/audio)
- [媒体理解](/zh-CN/nodes/media-understanding)
