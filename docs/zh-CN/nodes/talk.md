---
read_when:
    - 在 macOS / iOS / Android 上实现通话模式
    - 更改语音 / TTS / 打断行为
summary: 通话模式：使用已配置的 TTS 提供商进行连续语音对话
title: 通话模式
x-i18n:
    generated_at: "2026-04-25T20:12:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 15
---

通话模式是一个连续语音对话循环：

1. 监听语音
2. 将转录文本发送给模型（主会话，`chat.send`）
3. 等待响应
4. 通过已配置的通话提供商朗读响应（`talk.speak`）

## 行为（macOS）

- 启用通话模式时，显示**常驻悬浮层**。
- 在**监听 → 思考 → 朗读**阶段之间切换。
- 在**短暂停顿**（静音窗口）后，发送当前转录文本。
- 回复会**写入 WebChat**（与手动输入相同）。
- **语音打断**（默认开启）：如果智能体正在朗读时用户开始说话，我们会停止播放，并记录打断时间戳，以供下一个提示使用。

## 回复中的语音指令

智能体可以在回复前添加**单独一行 JSON** 来控制语音：

```json
{ "voice": "<voice-id>", "once": true }
```

规则：

- 仅第一条非空行有效。
- 未知键会被忽略。
- `once: true` 仅应用于当前这次回复。
- 如果没有 `once`，该语音会成为通话模式新的默认语音。
- 在 TTS 播放前，这一行 JSON 会被移除。

支持的键：

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate`（WPM）, `stability`, `similarity`, `style`, `speakerBoost`
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
  },
}
```

默认值：

- `interruptOnSpeech`：true
- `silenceTimeoutMs`：未设置时，通话模式会在发送转录文本前使用平台默认的停顿窗口（`macOS` 和 `Android` 为 `700 ms`，`iOS` 为 `900 ms`）
- `provider`：选择当前启用的通话提供商。对于 `macOS` 本地播放路径，可使用 `elevenlabs`、`mlx` 或 `system`。
- `providers.<provider>.voiceId`：对于 ElevenLabs，会回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或者在 API key 可用时使用第一个 ElevenLabs 语音）。
- `providers.elevenlabs.modelId`：未设置时默认为 `eleven_v3`。
- `providers.mlx.modelId`：未设置时默认为 `mlx-community/Soprano-80M-bf16`。
- `providers.elevenlabs.apiKey`：会回退到 `ELEVENLABS_API_KEY`（如果可用，也可使用 Gateway 网关 shell 配置文件中的值）。
- `speechLocale`：可选的 BCP 47 区域设置 ID，用于 `iOS` / `macOS` 上设备端通话语音识别。不设置则使用设备默认值。
- `outputFormat`：在 `macOS` / `iOS` 上默认是 `pcm_44100`，在 `Android` 上默认是 `pcm_24000`（设置 `mp3_*` 可强制使用 MP3 流式传输）

## macOS UI

- 菜单栏开关：**Talk**
- 配置标签页：**Talk Mode** 分组（voice id + 打断开关）
- 悬浮层：
  - **Listening**：云朵随麦克风音量脉动
  - **Thinking**：下沉动画
  - **Speaking**：向外辐射的圆环
  - 点击云朵：停止朗读
  - 点击 X：退出通话模式

## Android UI

- 语音标签页开关：**Talk**
- 手动 **Mic** 和 **Talk** 是互斥的运行时采集模式。
- 当应用离开前台或用户离开语音标签页时，手动 Mic 会停止。
- Talk Mode 会持续运行，直到被关闭或 Android 节点断开连接，并且在启用期间使用 Android 麦克风前台服务类型。

## 说明

- 需要语音和麦克风权限。
- 使用会话键 `main` 对 `chat.send` 发起调用。
- Gateway 网关会使用当前启用的通话提供商，通过 `talk.speak` 解析通话播放。只有在该 RPC 不可用时，Android 才会回退到本地系统 TTS。
- `macOS` 本地 MLX 播放会在可用时使用内置的 `openclaw-mlx-tts` helper，或者使用 `PATH` 上的可执行文件。开发时可设置 `OPENCLAW_MLX_TTS_BIN`，指向自定义 helper 二进制文件。
- `eleven_v3` 的 `stability` 会校验为 `0.0`、`0.5` 或 `1.0`；其他模型接受 `0..1`。
- 设置 `latency_tier` 时，会校验其范围为 `0..4`。
- Android 支持 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 输出格式，以实现低延迟 `AudioTrack` 流式传输。

## 相关内容

- [语音唤醒](/zh-CN/nodes/voicewake)
- [音频和语音笔记](/zh-CN/nodes/audio)
- [媒体理解](/zh-CN/nodes/media-understanding)
