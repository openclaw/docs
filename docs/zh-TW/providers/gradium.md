---
read_when:
    - 你想要使用 Gradium 進行文字轉語音
    - 你需要 Gradium API 金鑰、語音或指令權杖設定
summary: 在 OpenClaw 中使用 Gradium 文字轉語音
title: Gradium
x-i18n:
    generated_at: "2026-07-05T11:36:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eee8cbdeeb1cbc24bca20036c475a656e7aeab222699ae05931f07d2a635bbc6
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) 是 OpenClaw 的文字轉語音提供者。它可產生標準音訊回覆 (WAV)、相容語音備忘的 Opus 輸出，以及供電話語音介面使用的 8 kHz u-law 音訊。

| 屬性          | 值                                   |
| ------------- | ------------------------------------ |
| 提供者 ID     | `gradium`                            |
| 驗證          | `GRADIUM_API_KEY` 或設定 `apiKey`    |
| 基礎 URL      | `https://api.gradium.ai` (預設)      |
| 預設語音      | `Emma` (`YTpq7expH9539ERJ`)          |

## 安裝外掛

Gradium 是官方外部外掛。安裝它，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## 設定

建立 Gradium API 金鑰，然後透過環境變數或設定鍵公開它。設定會優先於環境變數。

<Tabs>
  <Tab title="環境變數">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="設定鍵">
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

## 設定

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

| 鍵                                              | 類型   | 說明                                                                              |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | 已解析的 API 金鑰。支援 `${ENV}` 與秘密參照。                                     |
| `messages.tts.providers.gradium.baseUrl`        | string | API 來源覆寫。會移除結尾斜線。預設為 `https://api.gradium.ai`。                   |
| `messages.tts.providers.gradium.speakerVoiceId` | string | 沒有指令覆寫時使用的預設語音 ID。                                                 |

輸出格式會依目標介面自動選擇 (請參閱[輸出](#output))，且無法在 `openclaw.json` 中設定。

## 語音

| 名稱               | 語音 ID            |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(預設)**    | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### 單則訊息的語音覆寫

當作用中的語音政策允許語音覆寫時，可使用指令權杖在行內切換語音 (以下任一形式都等效，且都接受提供者原生的語音 ID)：

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

如果語音政策停用語音覆寫，該指令會被消耗但忽略。

## 輸出

輸出格式會依目標介面選擇；提供者不會合成其他格式。

| 目標           | 格式        | 檔案副檔名 | 取樣率      | 語音相容旗標 |
| -------------- | ----------- | ---------- | ----------- | ------------ |
| 標準音訊       | `wav`       | `.wav`     | 提供者      | 否           |
| 語音備忘       | `opus`      | `.opus`    | 提供者      | 是           |
| 電話語音       | `ulaw_8000` | n/a        | 8 kHz       | n/a          |

## 自動選擇順序

在已設定的 TTS 提供者中，Gradium 的自動選擇順序是 `30`。若要了解在未固定 `messages.tts.provider` 時 OpenClaw 如何選擇作用中的提供者，請參閱[文字轉語音](/zh-TW/tools/tts)。

## 相關

- [文字轉語音](/zh-TW/tools/tts)
- [媒體概觀](/zh-TW/tools/media-overview)
