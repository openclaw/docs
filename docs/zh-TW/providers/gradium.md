---
read_when:
    - 你想使用 Gradium 進行文字轉語音
    - 你需要設定 Gradium API 金鑰、語音或指令權杖
summary: 在 OpenClaw 中使用 Gradium 文字轉語音
title: Gradium
x-i18n:
    generated_at: "2026-07-12T14:48:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) 是 OpenClaw 的文字轉語音供應商。它可產生標準音訊回覆（WAV）、與語音留言相容的 Opus 輸出，以及供電話通訊介面使用的 8 kHz u-law 音訊。

| 屬性          | 值                                   |
| ------------- | ------------------------------------ |
| 供應商 ID     | `gradium`                            |
| 驗證          | `GRADIUM_API_KEY` 或設定 `apiKey`    |
| 基礎 URL      | `https://api.gradium.ai`（預設）     |
| 預設語音      | `Emma` (`YTpq7expH9539ERJ`)          |

## 安裝外掛

Gradium 是官方外部外掛。安裝後，重新啟動閘道：

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## 設定

建立 Gradium API 金鑰，然後透過環境變數或設定鍵提供。設定的優先順序高於環境變數。

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

| 鍵                                              | 類型   | 說明                                                                                                        |
| ----------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | 解析後的 API 金鑰。支援 `${ENV}` 和密鑰參照。                                                               |
| `messages.tts.providers.gradium.baseUrl`        | string | 位於 `api.gradium.ai` 的 HTTPS Gradium API URL。會移除結尾斜線。預設為 `https://api.gradium.ai`。             |
| `messages.tts.providers.gradium.speakerVoiceId` | string | 沒有指令覆寫時使用的預設語音 ID。                                                                            |

輸出格式會依目標介面自動選擇（請參閱[輸出](#output)），且無法在 `openclaw.json` 中設定。

## 語音

| 名稱               | 語音 ID            |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **（預設）**  | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### 逐訊息覆寫語音

當有效的語音政策允許覆寫語音時，可使用指令權杖在行內切換語音（下列寫法皆等效，且都接受供應商原生的語音 ID）：

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

如果語音政策停用語音覆寫，系統仍會取用該指令，但會忽略它。

## 輸出

輸出格式由目標介面決定；供應商不會合成其他格式。

| 目標         | 格式        | 副檔名   | 取樣率      | 語音相容旗標 |
| ------------ | ----------- | -------- | ----------- | ------------ |
| 標準音訊     | `wav`       | `.wav`   | 供應商      | 否           |
| 語音留言     | `opus`      | `.opus`  | 供應商      | 是           |
| 電話通訊     | `ulaw_8000` | 不適用   | 8 kHz       | 不適用       |

## 自動選擇順序

在已設定的 TTS 供應商中，Gradium 的自動選擇順序是 `30`。若未固定 `messages.tts.provider`，請參閱[文字轉語音](/zh-TW/tools/tts)，瞭解 OpenClaw 如何選擇有效的供應商。

## 相關內容

- [文字轉語音](/zh-TW/tools/tts)
- [媒體概覽](/zh-TW/tools/media-overview)
