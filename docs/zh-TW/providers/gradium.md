---
read_when:
    - 你想要使用 Gradium 進行文字轉語音
    - 你需要 Gradium API 金鑰、語音或指令權杖設定
summary: 在 OpenClaw 中使用 Gradium 文字轉語音
title: Gradium
x-i18n:
    generated_at: "2026-06-27T19:54:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) 是 OpenClaw 的文字轉語音供應商。此外掛可以產生一般音訊回覆 (WAV)、與語音備忘相容的 Opus 輸出，以及用於電話介面的 8 kHz u-law 音訊。

| 屬性          | 值                                   |
| ------------- | ------------------------------------ |
| 供應商 ID     | `gradium`                            |
| 身分驗證      | `GRADIUM_API_KEY` 或設定 `apiKey`    |
| 基底 URL      | `https://api.gradium.ai`（預設）     |
| 預設語音      | `Emma` (`YTpq7expH9539ERJ`)          |

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## 設定

建立 Gradium API 金鑰，然後透過環境變數或設定鍵將它提供給 OpenClaw。

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

此外掛會先檢查解析後的 `apiKey`，並在沒有時退回使用 `GRADIUM_API_KEY` 環境變數。

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

| 鍵                                              | 類型   | 說明                                                                                          |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | 解析後的 API 金鑰。支援 `${ENV}` 和密鑰參照。                                                 |
| `messages.tts.providers.gradium.baseUrl`        | string | 覆寫 API 來源。會移除尾端斜線。預設為 `https://api.gradium.ai`。                              |
| `messages.tts.providers.gradium.speakerVoiceId` | string | 沒有指令覆寫時使用的預設語音 ID。                                                            |

輸出音訊格式會由執行階段根據目標介面自動選擇，無法從 `openclaw.json` 設定。請參閱下方的[輸出](#output)。

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

### 逐則訊息覆寫語音

當啟用中的語音政策允許語音覆寫時，你可以使用指令權杖在行內切換語音。對於供應商原生語音 ID，請使用 `speakerVoiceId`。

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

如果語音政策停用語音覆寫，指令會被消耗但忽略。

## 輸出

執行階段會依目標介面選擇輸出格式。供應商目前不會合成其他格式。

| 目標           | 格式        | 檔案副檔名 | 取樣率 | 語音相容旗標 |
| -------------- | ----------- | ---------- | ------ | ------------ |
| 標準音訊       | `wav`       | `.wav`     | 供應商 | 否           |
| 語音備忘       | `opus`      | `.opus`    | 供應商 | 是           |
| 電話           | `ulaw_8000` | 不適用     | 8 kHz  | 不適用       |

## 自動選擇順序

在已設定的 TTS 供應商中，Gradium 的自動選擇順序是 `30`。若要了解當 `messages.tts.provider` 未固定時 OpenClaw 如何選擇啟用中的供應商，請參閱[文字轉語音](/zh-TW/tools/tts)。

## 相關

- [文字轉語音](/zh-TW/tools/tts)
- [媒體概觀](/zh-TW/tools/media-overview)
