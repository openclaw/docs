---
read_when:
    - 在 macOS/iOS/Android 上实现 Talk 模式
    - 更改语音/TTS/中断行为
summary: Talk 模式：跨本地 STT/TTS 和实时语音的连续语音对话
title: Talk 模式
x-i18n:
    generated_at: "2026-07-05T11:25:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fd8976b29ad6618337886aa58473c8459c4c5f7e67162f19cfbe1a61e4e4b65
    source_path: nodes/talk.md
    workflow: 16
---

Talk 模式涵盖五种运行时形态：

- **原生 macOS/iOS/Android Talk**：本地语音识别、Gateway 网关聊天和 `talk.speak` TTS。节点会公布 `talk` 能力，并声明它们支持哪些 `talk.*` 命令。
- **iOS Talk（实时）**：客户端自有的 WebRTC，用于选择 `webrtc` 传输或省略传输的 OpenAI 实时配置。显式的 `gateway-relay`、`provider-websocket` 和非 OpenAI 实时配置仍使用 Gateway 网关自有的中继；非实时配置使用原生语音循环。
- **浏览器 Talk**：对于客户端自有的 `webrtc`/`provider-websocket` 会话使用 `talk.client.create`，或者对于 Gateway 网关自有的 `gateway-relay` 会话使用 `talk.session.create`。`managed-room` 保留给 Gateway 网关交接和对讲机房间。
- **Android Talk（实时）**：通过 `talk.realtime.mode: "realtime"` 和 `talk.realtime.transport: "gateway-relay"` 选择启用。否则 Android 仍使用原生语音识别、Gateway 网关聊天和 `talk.speak`。
- **仅转写客户端**：`talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`，然后使用 `talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close` 进行字幕/听写，不产生助手语音响应。一次性上传的语音便笺仍使用[媒体理解](/zh-CN/nodes/media-understanding)音频路径。

原生 Talk 是一个连续循环：监听语音，通过活动会话将转写文本发送给模型，等待响应，然后通过配置的 Talk 提供商（`talk.speak`）朗读响应。

客户端自有的实时 Talk 通过 `talk.client.toolCall` 转发提供商工具调用，而不是直接调用 `chat.send`。实时咨询处于活动状态时，客户端可以调用 `talk.client.steer` 或 `talk.session.steer`，将语音输入分类为 `status`、`steer`、`cancel` 或 `followup`。被接受的 Steer 会进入活动的嵌入式运行队列；被拒绝的 Steer 会返回原因，例如 `no_active_run`、`not_streaming` 或 `compacting`。

仅转写 Talk 发出与实时和 STT/TTS 会话相同的 Talk 事件封套，但使用 `mode: "transcription"` 和 `brain: "none"`。所有 Talk 会话都会在 `talk.event` 频道上广播事件；客户端订阅该频道以接收部分/最终转写更新（`transcript.delta`/`transcript.done`）和其他会话遥测。

## 行为（macOS）

- Talk 模式启用时始终显示覆盖层。
- **聆听 &rarr; 思考 &rarr; 朗读** 阶段转换。
- 短暂停顿（静音窗口）后，会发送当前转写文本。
- 回复会写入 WebChat（与键入相同）。
- **语音打断**（默认开启）：如果用户在助手朗读时说话，播放会停止，并记录打断时间戳用于下一个提示。

## 回复中的语音指令

助手可以在回复前加一行 JSON 来控制语音：

```json
{ "voice": "<voice-id>", "once": true }
```

规则：

- 仅第一行非空行有效；TTS 播放前会剥离该 JSON 行。
- 未知键会被忽略。
- `once: true` 仅应用于当前回复；如果没有它，该语音会成为新的 Talk 模式默认值。

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
          model: "gpt-realtime-2",
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

| 键                                      | 默认值                                    | 说明                                                                                                                                                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`                               | -                                          | 活动的 Talk TTS 提供商。对于 macOS 本地播放路径，使用 `elevenlabs`、`mlx` 或 `system`。                                                                                                                                                                           |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs 会回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`，或在有 API key 时回退到第一个可用语音。                                                                                                                                                           |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                          |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                          |
| `providers.elevenlabs.apiKey`            | -                                          | 回退到 `ELEVENLABS_API_KEY`（或可用时使用 Gateway 网关 shell 配置文件）。                                                                                                                                                                                              |
| `speechLocale`                           | 设备默认值                             | 用于 iOS/macOS 上设备端 Talk 语音识别的 BCP 47 locale id。                                                                                                                                                                                                     |
| `silenceTimeoutMs`                       | `700` ms macOS/Android，`900` ms iOS       | Talk 发送转写文本前的停顿窗口。                                                                                                                                                                                                                           |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                          |
| `outputFormat`                           | `pcm_44100` macOS/iOS，`pcm_24000` Android | 设置 `mp3_*` 可强制 MP3 流式传输。                                                                                                                                                                                                                                      |
| `consultThinkingLevel`                   | 未设置                                      | 实时 `openclaw_agent_consult` 调用背后的 Agent 运行思考级别覆盖值。                                                                                                                                                                                |
| `consultFastMode`                        | 未设置                                      | 实时 `openclaw_agent_consult` 调用的快速模式覆盖值。                                                                                                                                                                                                          |
| `realtime.provider`                      | -                                          | `openai` 用于 WebRTC，`google` 用于提供商 WebSocket，或通过 Gateway 网关中继使用仅桥接提供商。                                                                                                                                                                   |
| `realtime.providers.<id>`                | -                                          | 提供商自有的实时配置。浏览器只接收临时/受限的会话凭证，绝不会接收标准 API key。                                                                                                                                               |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | 内置 OpenAI Realtime 语音 id（较旧的 `voice` 键仍可用但已弃用）。当前 `gpt-realtime-2` 语音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`marin`、`sage`、`shimmer`、`verse`；建议使用 `marin` 和 `cedar` 以获得最佳质量。 |
| `realtime.transport`                     | -                                          | `webrtc`：iOS 和浏览器中的客户端自有 OpenAI WebRTC。`provider-websocket`：浏览器自有，在 iOS 上仍使用 Gateway 网关中继。`gateway-relay`：将提供商音频保留在 Gateway 网关上；Android 仅通过此传输使用实时模式。                                |
| `realtime.brain`                         | -                                          | `agent-consult` 通过 Gateway 网关策略路由实时工具调用；`direct-tools` 是旧版直接工具兼容性；`none` 用于转写/外部编排。                                                                                               |
| `realtime.consultRouting`                | -                                          | `provider-direct` 会在提供商跳过 `openclaw_agent_consult` 时保留提供商的直接回复；`force-agent-consult` 改为通过 OpenClaw 路由最终用户转写文本。                                                                                        |
| `realtime.instructions`                  | -                                          | 将面向提供商的系统指令附加到 OpenClaw 内置实时提示（语音风格/语气）；默认的 `openclaw_agent_consult` 指引保持不变。                                                                                                              |

`talk.catalog` 暴露规范提供商 id 和注册表别名、每个提供商的有效模式/传输/brain 策略/实时音频格式/能力标志，以及运行时选择的就绪结果。第一方 Talk 客户端应读取该目录，而不是在本地维护提供商别名；对于省略群组就绪状态的旧版 Gateway 网关，应将其视为未验证，而不是明确未配置。流式转写提供商通过 `talk.catalog.transcription` 发现；在专用 Talk 转写配置表面发布之前，当前 Gateway 网关中继会使用 Voice Call 流式提供商配置。

## macOS UI

- 菜单栏开关：**Talk**
- 配置标签页：**Talk 模式**分组（语音 ID + 打断开关）
- 浮层：正在聆听（云朵随麦克风音量脉动）&rarr; 正在思考（下沉动画）&rarr; 正在说话（辐射环）。点击云朵可停止说话，点击 X 可退出 Talk 模式。

## Android UI

- 语音标签页开关：**Talk**
- 手动 **Mic** 和 **Talk** 是互斥的采集模式。
- 手动 Mic 和实时 Talk 优先使用已连接的 Bluetooth Classic 或 BLE 耳机麦克风；如果断开连接，应用会请求另一个耳机输入，或回退到默认麦克风，并在采集停止后恢复默认偏好。
- 当应用离开前台或用户离开语音标签页时，手动 Mic 会停止。
- Talk 模式会持续运行，直到被关闭或节点断开连接；活跃时使用 Android 的麦克风前台服务类型。
- Android 支持 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 输出格式，用于低延迟 `AudioTrack` 流式传输。

## 说明

- 需要语音 + 麦克风权限。
- 原生 Talk 使用活跃的 Gateway 网关会话，并且仅在响应事件不可用时回退到历史轮询。
- Gateway 网关通过 `talk.speak` 使用活跃的 Talk 提供商解析 Talk 播放。仅当该 RPC 不可用时，Android 才会回退到本地系统 TTS。
- macOS 本地 MLX 播放会在存在时使用内置的 `openclaw-mlx-tts` 辅助程序，或使用 `PATH` 上的可执行文件。开发期间设置 `OPENCLAW_MLX_TTS_BIN`，使其指向自定义辅助程序二进制文件。
- 语音指令值范围（ElevenLabs）：`stability`、`similarity` 和 `style` 接受 `0..1`；`speed` 接受 `0.5..2`；`latency_tier` 接受 `0..4`。

## 相关内容

- [语音唤醒](/zh-CN/nodes/voicewake)
- [音频和语音笔记](/zh-CN/nodes/audio)
- [媒体理解](/zh-CN/nodes/media-understanding)
