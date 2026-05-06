---
read_when:
    - 變更音訊轉錄或媒體處理方式
summary: 傳入音訊/語音訊息如何下載、轉錄並注入回覆中
title: 音訊與語音備註
x-i18n:
    generated_at: "2026-05-06T09:12:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520620da5a643bb8e17318d7304ae4be3bd2586b0866614ad741685de5b8ef05
    source_path: nodes/audio.md
    workflow: 16
---

# 音訊 / 語音訊息 (2026-01-17)

## 可用功能

- **媒體理解（音訊）**：如果音訊理解已啟用（或自動偵測到），OpenClaw 會：
  1. 找出第一個音訊附件（本機路徑或 URL），並在需要時下載。
  2. 在傳送給每個模型項目前強制套用 `maxBytes`。
  3. 依序執行第一個符合資格的模型項目（提供者或 CLI）。
  4. 如果失敗或略過（大小/逾時），會嘗試下一個項目。
  5. 成功時，會將 `Body` 替換為 `[Audio]` 區塊並設定 `{{Transcript}}`。
- **指令剖析**：轉錄成功時，`CommandBody`/`RawBody` 會設定為逐字稿，讓斜線指令仍可運作。
- **詳細記錄**：在 `--verbose` 中，我們會記錄轉錄何時執行，以及何時替換本文。

## 自動偵測（預設）

如果你**沒有設定模型**，且 `tools.media.audio.enabled` **未**設為 `false`，
OpenClaw 會依下列順序自動偵測，並在第一個可用選項停止：

1. **作用中的回覆模型**，當其提供者支援音訊理解時。
2. **本機 CLI**（如果已安裝）
   - `sherpa-onnx-offline`（需要含 encoder/decoder/joiner/tokens 的 `SHERPA_ONNX_MODEL_DIR`）
   - `whisper-cli`（來自 `whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或隨附的 tiny 模型）
   - `whisper`（Python CLI；自動下載模型）
3. **Gemini CLI** (`gemini`)，使用 `read_many_files`
4. **提供者驗證**
   - 會先嘗試支援音訊的已設定 `models.providers.*` 項目
   - 隨附的後援順序：OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

若要停用自動偵測，請設定 `tools.media.audio.enabled: false`。
若要自訂，請設定 `tools.media.audio.models`。
注意：二進位偵測在 macOS/Linux/Windows 上是盡力而為；請確保 CLI 位於 `PATH`（我們會展開 `~`），或設定使用完整指令路徑的明確 CLI 模型。

## 設定範例

### 提供者 + CLI 後援（OpenAI + Whisper CLI）

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

### 僅提供者並搭配範圍控管

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

### 僅提供者（Deepgram）

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

### 僅提供者（Mistral Voxtral）

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

### 僅提供者（SenseAudio）

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

### 將逐字稿回顯到聊天（選擇啟用）

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

- 提供者驗證遵循標準模型驗證順序（驗證設定檔、環境變數、`models.providers.*.apiKey`）。
- Groq 設定詳細資料：[Groq](/zh-TW/providers/groq)。
- 使用 `provider: "deepgram"` 時，Deepgram 會讀取 `DEEPGRAM_API_KEY`。
- Deepgram 設定詳細資料：[Deepgram（音訊轉錄）](/zh-TW/providers/deepgram)。
- Mistral 設定詳細資料：[Mistral](/zh-TW/providers/mistral)。
- 使用 `provider: "senseaudio"` 時，SenseAudio 會讀取 `SENSEAUDIO_API_KEY`。
- SenseAudio 設定詳細資料：[SenseAudio](/zh-TW/providers/senseaudio)。
- 音訊提供者可以透過 `tools.media.audio` 覆寫 `baseUrl`、`headers` 和 `providerOptions`。
- 預設大小上限為 20MB (`tools.media.audio.maxBytes`)。過大的音訊會針對該模型略過，並嘗試下一個項目。
- 小於 1024 位元組的 tiny/空音訊檔案會在提供者/CLI 轉錄前被略過。
- 音訊的預設 `maxChars` **未設定**（完整逐字稿）。設定 `tools.media.audio.maxChars` 或每個項目的 `maxChars` 以修剪輸出。
- OpenAI 自動預設為 `gpt-4o-mini-transcribe`；設定 `model: "gpt-4o-transcribe"` 可獲得更高準確度。
- 使用 `tools.media.audio.attachments` 處理多個語音訊息（`mode: "all"` + `maxAttachments`）。
- 逐字稿可在範本中以 `{{Transcript}}` 使用。
- `tools.media.audio.echoTranscript` 預設關閉；啟用後，會在代理處理前將逐字稿確認傳回原始聊天。
- `tools.media.audio.echoFormat` 可自訂回顯文字（預留位置：`{transcript}`）。
- CLI stdout 有上限（5MB）；請保持 CLI 輸出精簡。
- CLI `args` 應使用 `{{MediaPath}}` 表示本機音訊檔案路徑。執行 `openclaw doctor --fix`，以從較舊的 `audio.transcription.command` 設定遷移已棄用的 `{input}` 預留位置。

### Proxy 環境支援

基於提供者的音訊轉錄會遵循標準輸出 Proxy 環境變數：

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

如果未設定 Proxy 環境變數，會使用直接輸出。如果 Proxy 設定格式錯誤，OpenClaw 會記錄警告並回退到直接擷取。

## 群組中的提及偵測

當群組聊天設定 `requireMention: true` 時，OpenClaw 現在會在檢查提及**之前**轉錄音訊。這讓語音訊息即使包含提及也能被處理。

**運作方式：**

1. 如果語音訊息沒有文字本文，且群組需要提及，OpenClaw 會執行「預檢」轉錄。
2. 逐字稿會用來檢查提及模式（例如 `@BotName`、emoji 觸發條件）。
3. 如果找到提及，訊息會進入完整回覆管線。
4. 逐字稿會用於提及偵測，讓語音訊息能通過提及閘門。

**後援行為：**

- 如果預檢期間轉錄失敗（逾時、API 錯誤等），訊息會根據純文字提及偵測來處理。
- 這可確保混合訊息（文字 + 音訊）永遠不會被錯誤丟棄。

**每個 Telegram 群組/主題可選擇停用：**

- 設定 `channels.telegram.groups.<chatId>.disableAudioPreflight: true`，即可略過該群組的預檢逐字稿提及檢查。
- 設定 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`，即可依主題覆寫（`true` 表示略過，`false` 表示強制啟用）。
- 預設為 `false`（符合提及閘門條件時啟用預檢）。

**範例：** 使用者在設定 `requireMention: true` 的 Telegram 群組中，傳送語音訊息說「Hey @Claude, what's the weather?」。該語音訊息會被轉錄、提及會被偵測到，然後代理會回覆。

## 注意陷阱

- 範圍規則採用第一個符合者勝出。`chatType` 會正規化為 `direct`、`group` 或 `room`。
- 請確保你的 CLI 以 0 結束並印出純文字；JSON 需要透過 `jq -r .text` 處理。
- 對於 `parakeet-mlx`，如果你傳入 `--output-dir`，當 `--output-format` 為 `txt`（或省略）時，OpenClaw 會讀取 `<output-dir>/<media-basename>.txt`；非 `txt` 輸出格式會回退到剖析 stdout。
- 保持逾時設定合理（`timeoutSeconds`，預設 60 秒），以避免阻塞回覆佇列。
- 預檢轉錄只會處理**第一個**音訊附件以進行提及偵測。其他音訊會在主要媒體理解階段處理。

## 相關

- [媒體理解](/zh-TW/nodes/media-understanding)
- [交談模式](/zh-TW/nodes/talk)
- [語音喚醒](/zh-TW/nodes/voicewake)
