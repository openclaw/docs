---
read_when:
    - 變更音訊轉錄或媒體處理
summary: 傳入音訊/語音訊息如何下載、轉錄並注入回覆中
title: 音訊與語音訊息
x-i18n:
    generated_at: "2026-05-02T23:38:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91cd6951f80c6137061a7d4e82415b0872bc92c6d6ad136273a2e9ad7ec00ac1
    source_path: nodes/audio.md
    workflow: 16
---

# 音訊 / 語音訊息 (2026-01-17)

## 可運作項目

- **媒體理解（音訊）**：如果已啟用音訊理解（或已自動偵測），OpenClaw 會：
  1. 找到第一個音訊附件（本機路徑或 URL），並視需要下載。
  2. 在傳送到每個模型項目之前套用 `maxBytes` 限制。
  3. 依序執行第一個符合資格的模型項目（提供者或 CLI）。
  4. 如果失敗或略過（大小/逾時），就嘗試下一個項目。
  5. 成功時，會將 `Body` 取代為 `[Audio]` 區塊，並設定 `{{Transcript}}`。
- **命令解析**：轉錄成功時，`CommandBody`/`RawBody` 會設為逐字稿，讓斜線命令仍可運作。
- **詳細記錄**：在 `--verbose` 中，我們會記錄轉錄何時執行，以及何時取代本文。
- **控制 UI 聽寫**：聊天撰寫器可以將瀏覽器錄製的麥克風片段傳送到 `chat.transcribeAudio`。該 Gateway RPC 會將片段寫入暫存本機檔案、執行相同的音訊轉錄管線、將草稿文字傳回瀏覽器，並刪除暫存檔。它本身不會建立代理執行。

## 自動偵測（預設）

如果你**未設定模型**，且 `tools.media.audio.enabled` **未**設為 `false`，
OpenClaw 會依下列順序自動偵測，並在第一個可運作的選項停止：

1. 當其提供者支援音訊理解時，使用**作用中的回覆模型**。
2. **本機 CLI**（若已安裝）
   - `sherpa-onnx-offline`（需要 `SHERPA_ONNX_MODEL_DIR`，並包含 encoder/decoder/joiner/tokens）
   - `whisper-cli`（來自 `whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或內建的 tiny 模型）
   - `whisper`（Python CLI；會自動下載模型）
3. 使用 `read_many_files` 的 **Gemini CLI** (`gemini`)
4. **提供者身分驗證**
   - 會先嘗試已設定且支援音訊的 `models.providers.*` 項目
   - 內建備援順序：OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

若要停用自動偵測，請設定 `tools.media.audio.enabled: false`。
若要自訂，請設定 `tools.media.audio.models`。
注意：二進位檔偵測會盡力支援 macOS/Linux/Windows；請確認 CLI 位於 `PATH`（我們會展開 `~`），或設定含完整命令路徑的明確 CLI 模型。

## 設定範例

### 提供者 + CLI 備援（OpenAI + Whisper CLI）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### 僅使用提供者並以範圍控管

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### 僅使用提供者（Deepgram）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### 僅使用提供者（Mistral Voxtral）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### 僅使用提供者（SenseAudio）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### 將逐字稿回傳到聊天（選擇啟用）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## 注意事項與限制

- 提供者身分驗證遵循標準模型驗證順序（驗證設定檔、環境變數、`models.providers.*.apiKey`）。
- Groq 設定詳細資訊：[Groq](/zh-TW/providers/groq)。
- 使用 `provider: "deepgram"` 時，Deepgram 會讀取 `DEEPGRAM_API_KEY`。
- Deepgram 設定詳細資訊：[Deepgram（音訊轉錄）](/zh-TW/providers/deepgram)。
- Mistral 設定詳細資訊：[Mistral](/zh-TW/providers/mistral)。
- 使用 `provider: "senseaudio"` 時，SenseAudio 會讀取 `SENSEAUDIO_API_KEY`。
- SenseAudio 設定詳細資訊：[SenseAudio](/zh-TW/providers/senseaudio)。
- 音訊提供者可以透過 `tools.media.audio` 覆寫 `baseUrl`、`headers` 和 `providerOptions`。
- 預設大小上限為 20MB（`tools.media.audio.maxBytes`）。超過大小的音訊會針對該模型略過，並嘗試下一個項目。
- 小於 1024 位元組的極小/空白音訊檔，會在提供者/CLI 轉錄前略過。
- 音訊的預設 `maxChars` **未設定**（完整逐字稿）。設定 `tools.media.audio.maxChars` 或每個項目的 `maxChars` 以修剪輸出。
- OpenAI 自動預設值為 `gpt-4o-mini-transcribe`；若要更高準確度，請設定 `model: "gpt-4o-transcribe"`。
- 使用 `tools.media.audio.attachments` 處理多個語音訊息（`mode: "all"` + `maxAttachments`）。
- 逐字稿可在範本中作為 `{{Transcript}}` 使用。
- `tools.media.audio.echoTranscript` 預設為關閉；啟用後會在代理處理前，將逐字稿確認傳回原始聊天。
- `tools.media.audio.echoFormat` 會自訂回傳文字（預留位置：`{transcript}`）。
- CLI stdout 會有上限（5MB）；請保持 CLI 輸出精簡。
- CLI `args` 應使用 `{{MediaPath}}` 作為本機音訊檔路徑。執行 `openclaw doctor --fix`，將較舊 `audio.transcription.command` 設定中已棄用的 `{input}` 預留位置遷移。

### Proxy 環境支援

以提供者為基礎的音訊轉錄會遵循標準輸出 Proxy 環境變數：

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

如果未設定 Proxy 環境變數，會使用直接對外連線。如果 Proxy 設定格式錯誤，OpenClaw 會記錄警告並退回直接擷取。

## 群組中的提及偵測

當群組聊天設定 `requireMention: true` 時，OpenClaw 現在會在檢查提及**之前**轉錄音訊。這讓語音訊息即使包含提及也能被處理。

**運作方式：**

1. 如果語音訊息沒有文字本文，且群組需要提及，OpenClaw 會執行「預檢」轉錄。
2. 逐字稿會檢查提及模式（例如 `@BotName`、表情符號觸發）。
3. 如果找到提及，訊息會進入完整回覆管線。
4. 逐字稿會用於提及偵測，讓語音訊息能通過提及門檻。

**備援行為：**

- 如果預檢期間轉錄失敗（逾時、API 錯誤等），訊息會根據純文字提及偵測來處理。
- 這可確保混合訊息（文字 + 音訊）永遠不會被錯誤丟棄。

**每個 Telegram 群組/主題可選擇停用：**

- 設定 `channels.telegram.groups.<chatId>.disableAudioPreflight: true`，以略過該群組的預檢逐字稿提及檢查。
- 設定 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`，以針對每個主題覆寫（`true` 表示略過，`false` 表示強制啟用）。
- 預設為 `false`（符合提及門控條件時啟用預檢）。

**範例：** 使用者在設定 `requireMention: true` 的 Telegram 群組中傳送語音訊息，內容是「Hey @Claude, what's the weather?」。語音訊息會被轉錄、偵測到提及，然後代理回覆。

## 注意陷阱

- 範圍規則採用第一個符合者優先。`chatType` 會標準化為 `direct`、`group` 或 `room`。
- 確認你的 CLI 以 0 結束並列印純文字；JSON 需要透過 `jq -r .text` 處理。
- 對於 `parakeet-mlx`，如果你傳入 `--output-dir`，當 `--output-format` 為 `txt`（或省略）時，OpenClaw 會讀取 `<output-dir>/<media-basename>.txt`；非 `txt` 輸出格式會退回 stdout 解析。
- 保持合理的逾時設定（`timeoutSeconds`，預設 60 秒），以避免阻塞回覆佇列。
- 預檢轉錄只會處理**第一個**音訊附件以進行提及偵測。其他音訊會在主要媒體理解階段處理。

## 相關

- [媒體理解](/zh-TW/nodes/media-understanding)
- [對話模式](/zh-TW/nodes/talk)
- [語音喚醒](/zh-TW/nodes/voicewake)
