---
read_when:
    - 你想使用 Gradium 进行文本转语音
    - 你需要配置 Gradium API 密钥、语音或指令令牌
summary: 在 OpenClaw 中使用 Gradium 文本转语音
title: Gradium
x-i18n:
    generated_at: "2026-05-10T19:46:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c79da6ec63532061a8112965a679f1113bbefcc91ee00def8153dd39b5b5e58
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) 是 OpenClaw 内置的文本转语音提供商。该插件可以渲染普通音频回复（WAV）、兼容语音便笺的 Opus 输出，以及用于电话场景的 8 kHz u-law 音频。

| 属性          | 值                                   |
| ------------- | ------------------------------------ |
| 提供商 ID     | `gradium`                            |
| 认证          | `GRADIUM_API_KEY` 或配置 `apiKey`    |
| 基础 URL      | `https://api.gradium.ai`（默认）     |
| 默认语音      | `Emma` (`YTpq7expH9539ERJ`)          |

## 设置

创建一个 Gradium API key，然后通过环境变量或配置键将其提供给 OpenClaw。

<Tabs>
  <Tab title="Env var">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Config key">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

插件会先检查解析后的 `apiKey`，并在没有解析到时回退到 `GRADIUM_API_KEY` 环境变量。

## 配置

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| 键                                       | 类型   | 描述                                                                                          |
| ---------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`  | string | 解析后的 API key。支持 `${ENV}` 和 secret refs。                                              |
| `messages.tts.providers.gradium.baseUrl` | string | 覆盖 API 源站。会移除尾部斜杠。默认值为 `https://api.gradium.ai`。                           |
| `messages.tts.providers.gradium.voiceId` | string | 没有指令覆盖时使用的默认语音 ID。                                                            |

输出音频格式由运行时根据目标场景自动选择，无法通过 `openclaw.json` 配置。见下方的[输出](#output)。

## 语音

| 名称      | 语音 ID            |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

默认语音：Emma。

### 单条消息的语音覆盖

当当前语音策略允许语音覆盖时，你可以使用指令令牌在行内切换语音。以下所有写法都会解析为相同的 `voiceId` 覆盖：

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

如果语音策略禁用了语音覆盖，该指令会被消费但会被忽略。

## 输出

运行时会根据目标场景选择输出格式。该提供商目前不会合成其他格式。

| 目标         | 格式        | 文件扩展名 | 采样率    | 语音兼容标志 |
| ------------ | ----------- | ---------- | --------- | ------------ |
| 标准音频     | `wav`       | `.wav`     | 提供商    | 否           |
| 语音便笺     | `opus`      | `.opus`    | 提供商    | 是           |
| 电话         | `ulaw_8000` | n/a        | 8 kHz     | n/a          |

## 自动选择顺序

在已配置的 TTS 提供商中，Gradium 的自动选择顺序是 `30`。当未固定 `messages.tts.provider` 时，OpenClaw 如何选择当前提供商，见[文本转语音](/zh-CN/tools/tts)。

## 相关

- [文本转语音](/zh-CN/tools/tts)
- [媒体概览](/zh-CN/tools/media-overview)
