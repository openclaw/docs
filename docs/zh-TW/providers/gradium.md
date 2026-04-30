---
read_when:
    - 你想使用 Gradium 進行文字轉語音
    - 你需要 Gradium API 金鑰或語音設定
summary: 在 OpenClaw 中使用 Gradium 文字轉語音
title: Gradium
x-i18n:
    generated_at: "2026-04-30T03:31:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 16
---

Gradium 是 OpenClaw 內建的文字轉語音提供者。它可以產生一般音訊回覆、與語音訊息相容的 Opus 輸出，以及用於電話通訊介面的 8 kHz u-law 音訊。

## 設定

建立 Gradium API 金鑰，然後提供給 OpenClaw：

```bash
export GRADIUM_API_KEY="gsk_..."
```

你也可以將金鑰儲存在設定的 `messages.tts.providers.gradium.apiKey` 底下。

## 設定檔

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

## 輸出

- 音訊檔回覆使用 WAV。
- 語音訊息回覆使用 Opus，並標記為與語音相容。
- 電話語音合成使用 8 kHz 的 `ulaw_8000`。

## 相關

- [文字轉語音](/zh-TW/tools/tts)
- [媒體概覽](/zh-TW/tools/media-overview)
