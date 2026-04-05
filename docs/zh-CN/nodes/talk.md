---
read_when:
    - 在 macOS/iOS/Android 上实现 Talk 模式
    - 更改语音/TTS/打断行为
summary: Talk 模式：使用 ElevenLabs TTS 的连续语音对话
title: Talk 模式
x-i18n:
    generated_at: "2026-04-05T08:29:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f10a3e9ee8fc2b4f7a89771d6e7b7373166a51ef9e9aa2d8c5ea67fc0729f9d
    source_path: nodes/talk.md
    workflow: 15
---

# Talk 模式

Talk 模式是一个连续的语音对话循环：

1. 监听语音
2. 将转录文本发送给模型（主会话，`chat.send`）
3. 等待回复
4. 通过已配置的 Talk 提供商（`talk.speak`）将回复播报出来

## 行为（macOS）

- 启用 Talk 模式时显示**常驻覆盖层**。
- **Listening → Thinking → Speaking** 阶段切换。
- 在**短暂停顿**时（静默窗口），发送当前转录文本。
- 回复会被**写入 WebChat**（与手动输入相同）。
- **语音打断**（默认开启）：如果用户在 assistant 播报时开始讲话，我们会停止播放，并为下一次提示记录打断时间戳。

## 回复中的语音指令

assistant 可以在回复前加上一行**单独的 JSON 行**来控制语音：

```json
{ "voice": "<voice-id>", "once": true }
```

规则：

- 仅第一行非空行有效。
- 未知键会被忽略。
- `once: true` 仅作用于当前回复。
- 如果没有 `once`，该语音会成为 Talk 模式的新默认值。
- 该 JSON 行会在 TTS 播放前被移除。

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
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

默认值：

- `interruptOnSpeech`：true
- `silenceTimeoutMs`：未设置时，Talk 会在发送转录文本前保持平台默认暂停窗口（`macOS 和 Android 为 700 ms，iOS 为 900 ms`）
- `voiceId`：回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或者在 API key 可用时使用第一个 ElevenLabs 声音）
- `modelId`：未设置时默认使用 `eleven_v3`
- `apiKey`：回退到 `ELEVENLABS_API_KEY`（或者在可用时使用 gateway shell 配置文件中的值）
- `outputFormat`：macOS/iOS 默认为 `pcm_44100`，Android 默认为 `pcm_24000`（设置 `mp3_*` 可强制使用 MP3 流式传输）

## macOS UI

- 菜单栏开关：**Talk**
- 配置标签页：**Talk 模式**组（voice id + 打断开关）
- 覆盖层：
  - **Listening**：云朵随麦克风音量脉动
  - **Thinking**：下沉动画
  - **Speaking**：向外扩散的环
  - 点击云朵：停止播报
  - 点击 X：退出 Talk 模式

## 说明

- 需要语音识别 + 麦克风权限。
- 使用针对会话键 `main` 的 `chat.send`。
- gateway 会通过活动的 Talk 提供商使用 `talk.speak` 来解析 Talk 播放。仅当该 RPC 不可用时，Android 才会回退到本地系统 TTS。
- 对于 `eleven_v3`，`stability` 会被校验为 `0.0`、`0.5` 或 `1.0`；其他模型接受 `0..1`。
- 设置 `latency_tier` 时，会校验其范围为 `0..4`。
- Android 支持 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 输出格式，以用于低延迟 AudioTrack 流式传输。
