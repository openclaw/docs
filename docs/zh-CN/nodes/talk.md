---
read_when:
    - 在 macOS/iOS/Android 上实现 Talk 模式
    - 更改语音/TTS/中断行为
summary: Talk 模式：跨本地 STT/TTS 和实时语音的连续语音对话
title: Talk 模式
x-i18n:
    generated_at: "2026-06-27T02:25:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

Talk 模式有两种运行时形态：

- 原生 macOS/iOS/Android Talk 使用本地语音识别、Gateway 网关聊天和 `talk.speak` TTS。节点会公布 `talk` 能力，并声明它们支持的 `talk.*` 命令。
- 浏览器 Talk 使用 `talk.client.create` 创建由客户端拥有的 `webrtc` 和 `provider-websocket` 会话，或使用 `talk.session.create` 创建由 Gateway 网关拥有的 `gateway-relay` 会话。`managed-room` 保留用于 Gateway 网关移交和对讲房间。
- Android Talk 可以通过 `talk.realtime.mode: "realtime"` 和 `talk.realtime.transport: "gateway-relay"` 选择启用由 Gateway 网关拥有的实时中继会话。否则它会继续使用原生语音识别、Gateway 网关聊天和 `talk.speak`。
- 仅转写客户端使用 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`，随后在需要字幕或听写且不需要助手语音回复时，使用 `talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`。

原生 Talk 是一个连续语音对话循环：

1. 监听语音
2. 通过当前会话将转写文本发送给模型
3. 等待响应
4. 通过配置的 Talk 提供商（`talk.speak`）朗读

浏览器实时 Talk 通过 `talk.client.toolCall` 转发提供商工具调用；浏览器客户端不会直接调用 `chat.send` 来进行实时咨询。
当实时咨询处于活动状态时，Talk 客户端可以使用 `talk.client.steer` 或
`talk.session.steer` 将语音输入分类为 `status`、`steer`、`cancel` 或
`followup`。被接受的 Steer 会排入当前嵌入式运行；被拒绝的
Steer 会返回结构化原因，例如 `no_active_run`、`not_streaming`
或 `compacting`。

仅转写 Talk 会发出与实时和 STT/TTS 会话相同的通用 Talk 事件信封，但使用 `mode: "transcription"` 和 `brain: "none"`。它用于字幕、听写和仅观察的语音捕获；一次性上传的语音备注仍使用媒体/音频路径。

## 行为（macOS）

- 启用 Talk 模式时显示**常驻叠加层**。
- **Listening → Thinking → Speaking** 阶段转换。
- 在**短暂停顿**（静音窗口）后，会发送当前转写文本。
- 回复会**写入 WebChat**（与键入相同）。
- **语音打断**（默认开启）：如果用户在助手朗读时开始说话，我们会停止播放，并为下一个提示记录打断时间戳。

## 回复中的语音指令

助手可以在回复前加上**单行 JSON** 来控制语音：

```json
{ "voice": "<voice-id>", "once": true }
```

规则：

- 仅第一行非空行有效。
- 未知键会被忽略。
- `once: true` 仅应用于当前回复。
- 如果没有 `once`，该语音会成为 Talk 模式的新默认语音。
- 在 TTS 播放前会移除该 JSON 行。

支持的键：

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`、`rate`（WPM）、`stability`、`similarity`、`style`、`speakerBoost`
- `seed`、`normalize`、`lang`、`output_format`、`latency_tier`
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

- `interruptOnSpeech`：true
- `silenceTimeoutMs`：未设置时，Talk 会在发送转写文本前保留平台默认的暂停窗口（`macOS 和 Android 上为 700 ms，iOS 上为 900 ms`）
- `provider`：选择当前 Talk 提供商。对于 macOS 本地播放路径，使用 `elevenlabs`、`mlx` 或 `system`。
- `providers.<provider>.voiceId`：对于 ElevenLabs，会回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或在 API key 可用时使用第一个 ElevenLabs 语音）。
- `providers.elevenlabs.modelId`：未设置时默认为 `eleven_v3`。
- `providers.mlx.modelId`：未设置时默认为 `mlx-community/Soprano-80M-bf16`。
- `providers.elevenlabs.apiKey`：回退到 `ELEVENLABS_API_KEY`（或可用时的 Gateway 网关 shell 配置文件）。
- `consultThinkingLevel`：实时 `openclaw_agent_consult` 调用背后的完整 OpenClaw 智能体运行的可选思考级别覆盖。
- `consultFastMode`：实时 `openclaw_agent_consult` 调用的可选快速模式覆盖。
- `realtime.provider`：选择当前浏览器/服务器实时语音提供商。使用 `openai` 进行 WebRTC，使用 `google` 进行提供商 WebSocket，或通过 Gateway 网关中继使用仅桥接的提供商。
- `realtime.providers.<provider>` 存储由提供商拥有的实时配置。浏览器只会收到临时或受限的会话凭证，永远不会收到标准 API key。
- `realtime.providers.openai.voice`：内置 OpenAI Realtime 语音 ID。当前 `gpt-realtime-2` 语音为 `alloy`、`ash`、`ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin` 和 `cedar`；推荐使用 `marin` 和 `cedar` 以获得最佳质量。
- `realtime.transport`：`webrtc` 和 `provider-websocket` 是浏览器实时传输协议。Android 仅当这里为 `gateway-relay` 时使用实时中继；否则 Android Talk 使用其原生 STT/TTS 循环。
- `realtime.brain`：`agent-consult` 通过 Gateway 网关策略路由实时工具调用；`direct-tools` 是旧版直接工具兼容行为；`none` 用于转写或外部编排。
- `realtime.consultRouting`：当提供商跳过 `openclaw_agent_consult` 时，`provider-direct` 会保留提供商的直接回复；`force-agent-consult` 会让 Gateway 网关中继改为通过 OpenClaw 路由已定稿的用户转写文本。
- `realtime.instructions`：将面向提供商的系统指令追加到 OpenClaw 内置实时提示中。将它用于语音风格和语气；OpenClaw 会保留默认的 `openclaw_agent_consult` 指引。
- `talk.catalog` 暴露每个提供商的有效模式、传输协议、brain 策略、实时音频格式和能力标志，以便第一方 Talk 客户端避免不受支持的组合。
- 流式转写提供商通过 `talk.catalog.transcription` 发现。在专用 Talk 转写配置表面添加前，当前 Gateway 网关中继会使用 Voice Call 流式提供商配置。
- `speechLocale`：用于 iOS/macOS 设备端 Talk 语音识别的可选 BCP 47 区域设置 ID。留空则使用设备默认值。
- `outputFormat`：macOS/iOS 上默认为 `pcm_44100`，Android 上默认为 `pcm_24000`（设置 `mp3_*` 可强制 MP3 流式传输）

## macOS 界面

- 菜单栏开关：**Talk**
- 配置标签页：**Talk Mode** 组（语音 ID + 打断开关）
- 叠加层：
  - **Listening**：云朵随麦克风音量脉动
  - **Thinking**：下沉动画
  - **Speaking**：辐射环
  - 点击云朵：停止朗读
  - 点击 X：退出 Talk 模式

## Android 界面

- 语音标签页开关：**Talk**
- 手动 **Mic** 和 **Talk** 是互斥的运行时捕获模式。
- 当应用离开前台或用户离开语音标签页时，手动 Mic 会停止。
- Talk Mode 会持续运行，直到被关闭或 Android 节点断开连接，并在活动期间使用 Android 的麦克风前台服务类型。

## 说明

- 需要语音 + 麦克风权限。
- 原生 Talk 使用当前 Gateway 网关会话，并且只有在响应事件不可用时才回退到历史轮询。
- 浏览器实时 Talk 对 `openclaw_agent_consult` 使用 `talk.client.toolCall`，而不是向由提供商拥有的浏览器会话暴露 `chat.send`。
- 仅转写 Talk 使用 `talk.session.create`、`talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`；客户端订阅 `talk.event` 以获取部分/最终转写更新。
- Gateway 网关使用当前 Talk 提供商通过 `talk.speak` 解析 Talk 播放。仅当该 RPC 不可用时，Android 才回退到本地系统 TTS。
- macOS 本地 MLX 播放会在存在时使用内置的 `openclaw-mlx-tts` 辅助程序，或使用 `PATH` 上的可执行文件。开发期间设置 `OPENCLAW_MLX_TTS_BIN` 指向自定义辅助二进制文件。
- `eleven_v3` 的 `stability` 会被校验为 `0.0`、`0.5` 或 `1.0`；其他模型接受 `0..1`。
- 设置 `latency_tier` 时，会校验为 `0..4`。
- Android 支持 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 输出格式，用于低延迟 AudioTrack 流式传输。

## 相关内容

- [语音唤醒](/zh-CN/nodes/voicewake)
- [音频和语音备注](/zh-CN/nodes/audio)
- [媒体理解](/zh-CN/nodes/media-understanding)
