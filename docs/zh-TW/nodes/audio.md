---
read_when:
    - 變更音訊轉錄或媒體處理
summary: 傳入音訊／語音訊息的下載、轉錄與注入回覆方式
title: 音訊與語音訊息
x-i18n:
    generated_at: "2026-04-30T03:17:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# 音訊 / 語音備忘錄（2026-01-17）

## 可用功能

- **媒體理解（音訊）**：如果啟用（或自動偵測到）音訊理解，OpenClaw 會：
  1. 找出第一個音訊附件（本機路徑或 URL），並視需要下載。
  2. 在傳送到每個模型項目之前強制套用 `maxBytes`。
  3. 依序執行第一個符合資格的模型項目（provider 或 CLI）。
  4. 如果失敗或略過（大小/逾時），會嘗試下一個項目。
  5. 成功時，會以 `[Audio]` 區塊取代 `Body`，並設定 `{{Transcript}}`。
- **指令解析**：轉錄成功時，`CommandBody`/`RawBody` 會設定為逐字稿，因此斜線指令仍可運作。
- **詳細記錄**：在 `--verbose` 中，我們會記錄轉錄何時執行，以及何時取代本文。

## 自動偵測（預設）

如果你**未設定模型**，且 `tools.media.audio.enabled` **沒有**設為 `false`，
OpenClaw 會依照下列順序自動偵測，並在找到第一個可用選項時停止：

1. **作用中的回覆模型**，當其 provider 支援音訊理解時。
2. **本機 CLI**（若已安裝）
   - `sherpa-onnx-offline`（需要 `SHERPA_ONNX_MODEL_DIR`，其中包含 encoder/decoder/joiner/tokens）
   - `whisper-cli`（來自 `whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或內建的 tiny 模型）
   - `whisper`（Python CLI；自動下載模型）
3. **Gemini CLI**（`gemini`），使用 `read_many_files`
4. **Provider 驗證**
   - 會先嘗試已設定且支援音訊的 `models.providers.*` 項目
   - 內建後援順序：OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

若要停用自動偵測，請設定 `tools.media.audio.enabled: false`。
若要自訂，請設定 `tools.media.audio.models`。
注意：在 macOS/Linux/Windows 上，二進位檔偵測是盡力而為；請確認 CLI 位於 `PATH` 上（我們會展開 `~`），或設定明確的 CLI 模型並使用完整指令路徑。

## 設定範例

### Provider + CLI 後援（OpenAI + Whisper CLI）

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

### 僅 Provider 且具範圍控管

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

### 僅 Provider（Deepgram）

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

### 僅 Provider（Mistral Voxtral）

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

### 僅 Provider（SenseAudio）

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

### 將逐字稿回顯到聊天室（選擇啟用）

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

- Provider 驗證遵循標準模型驗證順序（驗證設定檔、環境變數、`models.providers.*.apiKey`）。
- Groq 設定詳細資訊：[Groq](/zh-TW/providers/groq)。
- 使用 `provider: "deepgram"` 時，Deepgram 會讀取 `DEEPGRAM_API_KEY`。
- Deepgram 設定詳細資訊：[Deepgram（音訊轉錄）](/zh-TW/providers/deepgram)。
- Mistral 設定詳細資訊：[Mistral](/zh-TW/providers/mistral)。
- 使用 `provider: "senseaudio"` 時，SenseAudio 會讀取 `SENSEAUDIO_API_KEY`。
- SenseAudio 設定詳細資訊：[SenseAudio](/zh-TW/providers/senseaudio)。
- 音訊 provider 可透過 `tools.media.audio` 覆寫 `baseUrl`、`headers` 和 `providerOptions`。
- 預設大小上限為 20MB（`tools.media.audio.maxBytes`）。超過大小的音訊會在該模型被略過，並嘗試下一個項目。
- 低於 1024 位元組的極小/空白音訊檔案，會在 provider/CLI 轉錄前被略過。
- 音訊的預設 `maxChars` **未設定**（完整逐字稿）。設定 `tools.media.audio.maxChars` 或各項目的 `maxChars` 以裁切輸出。
- OpenAI 自動預設值為 `gpt-4o-mini-transcribe`；若要更高準確度，請設定 `model: "gpt-4o-transcribe"`。
- 使用 `tools.media.audio.attachments` 處理多個語音備忘錄（`mode: "all"` + `maxAttachments`）。
- 範本可透過 `{{Transcript}}` 使用逐字稿。
- `tools.media.audio.echoTranscript` 預設關閉；啟用後，可在代理處理前將逐字稿確認傳回原始聊天室。
- `tools.media.audio.echoFormat` 會自訂回顯文字（預留位置：`{transcript}`）。
- CLI stdout 有上限（5MB）；請保持 CLI 輸出精簡。
- CLI `args` 應使用 `{{MediaPath}}` 代表本機音訊檔案路徑。執行 `openclaw doctor --fix`，可從較舊的 `audio.transcription.command` 設定遷移已棄用的 `{input}` 預留位置。

### Proxy 環境支援

以 provider 為基礎的音訊轉錄會遵循標準傳出 Proxy 環境變數：

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

如果沒有設定 Proxy 環境變數，會使用直接連線。如果 Proxy 設定格式錯誤，OpenClaw 會記錄警告並退回直接擷取。

## 群組中的提及偵測

當群組聊天設定 `requireMention: true` 時，OpenClaw 現在會在檢查提及之前**先**轉錄音訊。這讓語音備忘錄即使包含提及也能被處理。

**運作方式：**

1. 如果語音訊息沒有文字本文，且群組要求提及，OpenClaw 會執行「預檢」轉錄。
2. 逐字稿會檢查提及模式（例如 `@BotName`、表情符號觸發條件）。
3. 如果找到提及，訊息會進入完整回覆流程。
4. 逐字稿會用於提及偵測，因此語音備忘錄可以通過提及門檻。

**後援行為：**

- 如果預檢期間轉錄失敗（逾時、API 錯誤等），訊息會根據僅文字的提及偵測來處理。
- 這確保混合訊息（文字 + 音訊）絕不會被錯誤丟棄。

**針對每個 Telegram 群組/主題選擇退出：**

- 設定 `channels.telegram.groups.<chatId>.disableAudioPreflight: true`，即可略過該群組的預檢逐字稿提及檢查。
- 設定 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`，即可針對每個主題覆寫（`true` 代表略過，`false` 代表強制啟用）。
- 預設為 `false`（符合提及門檻條件時啟用預檢）。

**範例：** 使用者在設定 `requireMention: true` 的 Telegram 群組中傳送語音備忘錄，內容說「Hey @Claude, what's the weather?」。該語音備忘錄會被轉錄、偵測到提及，然後代理會回覆。

## 注意陷阱

- 範圍規則採用第一個符合項目勝出。`chatType` 會正規化為 `direct`、`group` 或 `room`。
- 確認你的 CLI 以 0 結束並列印純文字；JSON 需要透過 `jq -r .text` 進行處理。
- 對於 `parakeet-mlx`，如果你傳入 `--output-dir`，當 `--output-format` 為 `txt`（或省略）時，OpenClaw 會讀取 `<output-dir>/<media-basename>.txt`；非 `txt` 輸出格式會退回 stdout 解析。
- 保持合理逾時（`timeoutSeconds`，預設 60 秒），避免阻塞回覆佇列。
- 預檢轉錄只會處理**第一個**音訊附件以進行提及偵測。其他音訊會在主要媒體理解階段處理。

## 相關

- [媒體理解](/zh-TW/nodes/media-understanding)
- [Talk 模式](/zh-TW/nodes/talk)
- [語音喚醒](/zh-TW/nodes/voicewake)
