---
read_when:
    - 你需要用 Gradium 做文本转语音
    - 你需要 Gradium API key、voice 或 directive token 配置
summary: 在 OpenClaw 中使用 Gradium 文本转语音
title: Gradium
x-i18n:
    generated_at: "2026-07-05T11:37:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eee8cbdeeb1cbc24bca20036c475a656e7aeab222699ae05931f07d2a635bbc6
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) 是 OpenClaw 的文本转语音提供商。它会渲染标准音频回复（WAV）、兼容语音便笺的 Opus 输出，以及用于电话通信界面的 8 kHz u-law 音频。

| 属性          | 值                                   |
| ------------- | ------------------------------------ |
| 提供商 id     | `gradium`                            |
| 凭证          | `GRADIUM_API_KEY` 或配置 `apiKey`    |
| 基础 URL      | `https://api.gradium.ai`（默认）     |
| 默认语音      | `Emma`（`YTpq7expH9539ERJ`）         |

## 安装插件

Gradium 是一个官方外部插件。安装它，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## 设置

创建一个 Gradium API key，然后通过环境变量或配置键公开它。配置优先于环境变量。

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

## 配置

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| 键                                              | 类型   | 描述                                                                              |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | 字符串 | 已解析的 API key。支持 `${ENV}` 和 secret refs。                                  |
| `messages.tts.providers.gradium.baseUrl`        | 字符串 | API 源覆盖。会去除尾随斜杠。默认值为 `https://api.gradium.ai`。                  |
| `messages.tts.providers.gradium.speakerVoiceId` | 字符串 | 未提供指令覆盖时使用的默认语音 id。                                               |

输出格式会由目标界面自动选择（参见[输出](#output)），不能在 `openclaw.json` 中配置。

## 语音

| 名称               | 语音 ID            |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **（默认）**  | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### 按消息覆盖语音

当当前语音策略允许语音覆盖时，可以使用指令令牌内联切换语音（以下任意形式等效，都采用提供商原生语音 id）：

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

如果语音策略禁用了语音覆盖，该指令会被消费但会被忽略。

## 输出

输出格式由目标界面选择；该提供商不会合成其他格式。

| 目标       | 格式        | 文件扩展名 | 采样率     | 语音兼容标志 |
| ---------- | ----------- | ---------- | ---------- | ------------ |
| 标准音频   | `wav`       | `.wav`     | 提供商     | 否           |
| 语音便笺   | `opus`      | `.opus`    | 提供商     | 是           |
| 电话通信   | `ulaw_8000` | 不适用     | 8 kHz      | 不适用       |

## 自动选择顺序

在已配置的 TTS 提供商中，Gradium 的自动选择顺序是 `30`。当未固定 `messages.tts.provider` 时，请参见[文本转语音](/zh-CN/tools/tts)，了解 OpenClaw 如何选择当前提供商。

## 相关内容

- [文本转语音](/zh-CN/tools/tts)
- [媒体概览](/zh-CN/tools/media-overview)
