---
read_when:
    - 你需要 Gradium 來進行文字轉語音
    - 你需要設定 Gradium API 金鑰、語音或指令權杖
summary: 在 OpenClaw 中使用 Gradium 文字轉語音
title: Gradium
x-i18n:
    generated_at: "2026-05-10T19:48:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c79da6ec63532061a8112965a679f1113bbefcc91ee00def8153dd39b5b5e58
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) 是 OpenClaw 內建的文字轉語音提供者。此 Plugin 可產生一般音訊回覆（WAV）、相容語音訊息的 Opus 輸出，以及用於電話介面的 8 kHz u-law 音訊。

| 屬性          | 值                                   |
| ------------- | ------------------------------------ |
| 提供者 ID     | `gradium`                            |
| 驗證          | `GRADIUM_API_KEY` 或 config `apiKey` |
| 基底 URL      | `https://api.gradium.ai`（預設）     |
| 預設語音      | `Emma` (`YTpq7expH9539ERJ`)          |

## 設定

建立 Gradium API 金鑰，然後透過環境變數或 config 金鑰將它提供給 OpenClaw。

<Tabs>
  <Tab title="環境變數">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Config 金鑰">
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

此 Plugin 會先檢查已解析的 `apiKey`，再回退使用 `GRADIUM_API_KEY` 環境變數。

## Config

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

| 金鑰                                     | 類型   | 說明                                                                                          |
| ---------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`  | string | 已解析的 API 金鑰。支援 `${ENV}` 與 secret refs。                                             |
| `messages.tts.providers.gradium.baseUrl` | string | 覆寫 API 來源。會移除結尾斜線。預設為 `https://api.gradium.ai`。                              |
| `messages.tts.providers.gradium.voiceId` | string | 沒有 directive 覆寫時使用的預設語音 ID。                                                      |

輸出的音訊格式會由 runtime 根據目標介面自動選取，無法從 `openclaw.json` 設定。請參閱下方的[輸出](#output)。

## 語音

| 名稱      | 語音 ID            |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

預設語音：Emma。

### 每則訊息的語音覆寫

當使用中的語音政策允許語音覆寫時，你可以使用 directive token 在行內切換語音。以下全部都會解析為相同的 `voiceId` 覆寫：

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

如果語音政策停用語音覆寫，directive 會被消耗但會被忽略。

## 輸出

runtime 會從目標介面選擇輸出格式。此提供者目前不會合成其他格式。

| 目標     | 格式        | 副檔名  | 取樣率     | 語音相容旗標 |
| -------- | ----------- | ------- | ---------- | ------------ |
| 標準音訊 | `wav`       | `.wav`  | 提供者     | 否           |
| 語音訊息 | `opus`      | `.opus` | 提供者     | 是           |
| 電話     | `ulaw_8000` | n/a     | 8 kHz      | n/a          |

## 自動選取順序

在已設定的 TTS 提供者中，Gradium 的自動選取順序為 `30`。若要了解在未固定 `messages.tts.provider` 時 OpenClaw 如何選擇使用中的提供者，請參閱[文字轉語音](/zh-TW/tools/tts)。

## 相關

- [文字轉語音](/zh-TW/tools/tts)
- [媒體概覽](/zh-TW/tools/media-overview)
