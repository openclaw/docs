---
read_when:
    - 變更音訊轉錄或媒體處理
summary: 傳入音訊/語音備忘錄如何下載、轉錄，並注入回覆中
title: 音訊與語音留言
x-i18n:
    generated_at: "2026-07-05T11:25:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8203660ec2a09e69d5e1369a62d88170a9226dc8c9bb609964addfd4822419fc
    source_path: nodes/audio.md
    workflow: 16
---

## 功能

啟用音訊理解（或自動偵測）時，OpenClaw 會：

1. 找出第一個音訊附件（本機路徑或 URL），並在需要時下載。
2. 在傳送到每個模型項目前強制套用 `maxBytes`。
3. 依序執行第一個符合資格的模型項目（提供者或命令列介面）；如果某個項目失敗或略過（大小/逾時），就會嘗試下一個項目。
4. 成功時，將 `Body` 替換為 `[Audio]` 區塊，並設定 `{{Transcript}}`。

轉錄成功時，`CommandBody`/`RawBody` 也會設定為轉錄稿，因此斜線命令仍可運作。使用 `--verbose` 時，記錄會顯示轉錄執行的時間，以及它替換本文的時間。

## 自動偵測（預設）

如果你尚未設定模型，且 `tools.media.audio.enabled` 不是 `false`，OpenClaw 會依下列順序自動偵測，並在第一個可用選項停止：

1. **作用中的回覆模型**，當其提供者支援音訊理解時。
2. **已設定的提供者驗證** — 任何 `models.providers.*` 項目，只要其提供者支援音訊轉錄且有可用驗證。這會在本機命令列介面之前檢查，因此已設定的 API 金鑰永遠優先於 `PATH` 上的本機二進位檔。
   多個提供者皆已設定時的提供者優先順序：Groq、OpenAI、xAI、Deepgram、Google、SenseAudio、ElevenLabs、Mistral。
3. **本機命令列介面**（只有在未解析到提供者驗證時），依下列順序檢查：
   - `sherpa-onnx-offline`（需要 `SHERPA_ONNX_MODEL_DIR`，其中包含 `tokens.txt`、`encoder.onnx`、`decoder.onnx` 和 `joiner.onnx`）
   - `whisper-cli`（來自 `whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或內建的 tiny 模型）
   - `whisper`（Python 命令列介面；會自動下載模型）

用於媒體理解的 Gemini CLI 自動偵測已由沙盒化的 Antigravity CLI（`agy`）後援取代，用於圖片/影片；音訊除了上述本機二進位檔之外，不使用命令列介面後援。

若要停用自動偵測，請設定 `tools.media.audio.enabled: false`。若要自訂，請設定 `tools.media.audio.models`。

<Note>
二進位檔偵測在 macOS/Linux/Windows 上是盡力而為。請確認命令列介面位於 `PATH` 上（`~` 會被展開），或使用完整命令路徑設定明確的命令列介面模型。
</Note>

## 設定範例

### 提供者 + 命令列介面後援（OpenAI + Whisper CLI）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
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

### 僅提供者並使用範圍控管

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
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
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

### 將轉錄稿回覆到聊天（選擇啟用）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## 注意事項與限制

- 提供者驗證遵循標準模型驗證順序（驗證設定檔、環境變數、`models.providers.*.apiKey`）。
- Groq 設定詳細資料：[Groq](/zh-TW/providers/groq)。
- 使用 `provider: "deepgram"` 時，Deepgram 會讀取 `DEEPGRAM_API_KEY`。設定詳細資料：[Deepgram](/zh-TW/providers/deepgram)。
- Mistral 設定詳細資料：[Mistral](/zh-TW/providers/mistral)。
- 使用 `provider: "senseaudio"` 時，SenseAudio 會讀取 `SENSEAUDIO_API_KEY`。設定詳細資料：[SenseAudio](/zh-TW/providers/senseaudio)。
- 音訊提供者可以透過 `tools.media.audio` 覆寫 `baseUrl`、`headers` 和 `providerOptions`。
- 預設大小上限是 20MB（`tools.media.audio.maxBytes`）。過大的音訊會略過該模型，並嘗試下一個項目。
- 小於 1024 位元組的音訊檔會在提供者/命令列介面轉錄之前略過。
- 音訊的預設 `maxChars` 為**未設定**（完整轉錄稿）。設定 `tools.media.audio.maxChars` 或每個項目的 `maxChars` 以裁切輸出。
- OpenAI 自動偵測預設值是 `gpt-4o-transcribe`；設定 `model: "gpt-4o-mini-transcribe"` 可使用較便宜/較快速的選項。
- 使用 `tools.media.audio.attachments` 處理多個語音訊息（`mode: "all"` 加上 `maxAttachments`，預設為 1）。
- 範本可透過 `{{Transcript}}` 取得轉錄稿。
- `tools.media.audio.echoTranscript` 預設為關閉；啟用後會在代理程式處理前，將轉錄確認送回原始聊天。
- `tools.media.audio.echoFormat` 可自訂回覆文字（預留位置：`{transcript}`；預設 `📝 "{transcript}"`）。
- 命令列介面 stdout 上限為 5MB；請保持命令列介面輸出簡潔。
- 命令列介面 `args` 應使用 `{{MediaPath}}` 表示本機音訊檔路徑。執行 `openclaw doctor --fix`，可從較舊的 `audio.transcription.command` 設定遷移已淘汰的 `{input}` 預留位置（已淘汰鍵：`audio.transcription`，由 `tools.media.audio.models` 取代）。

### 代理環境支援

以提供者為基礎的音訊轉錄會遵循標準輸出代理環境變數，符合 undici 的 `EnvHttpProxyAgent` 語意：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

小寫變數優先於大寫；`NO_PROXY`/`no_proxy` 項目（主機名稱、`*.suffix` 或 `host:port`）會略過代理。如果未設定代理環境變數，則使用直接輸出連線。如果代理設定失敗（URL 格式錯誤），OpenClaw 會記錄警告並退回直接擷取。

## 群組中的提及偵測

為群組聊天設定 `requireMention: true` 時，OpenClaw 會在檢查提及之前**先**轉錄音訊。這讓語音訊息即使沒有文字本文，也能通過提及閘門。

**運作方式：**

1. 如果語音訊息沒有文字本文，且群組需要提及，OpenClaw 會對第一個音訊附件執行預檢轉錄。
2. 轉錄稿會檢查提及模式（例如 `@BotName`、表情符號觸發）。
3. 如果找到提及，訊息會繼續進入完整回覆管線。

**後援行為：**如果預檢轉錄失敗（逾時、API 錯誤等），訊息會退回純文字提及偵測，因此混合訊息（文字 + 音訊）永遠不會被丟棄。

**依 Telegram 群組/主題選擇退出：**

- 設定 `channels.telegram.groups.<chatId>.disableAudioPreflight: true`，可略過該群組的預檢轉錄提及檢查。
- 設定 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`，可依主題覆寫（`true` 表示略過，`false` 表示強制啟用）。
- 預設為 `false`（當符合提及閘門條件時啟用預檢）。

**範例：**使用者在設定 `requireMention: true` 的 Telegram 群組中傳送語音訊息，內容說「Hey @Claude, what's the weather?」。語音訊息會被轉錄，提及會被偵測到，代理程式會回覆。

## 注意事項

- 範圍規則使用第一個符合者勝出；`chatType` 會正規化為 `direct`、`group` 或 `channel`。
- 確保你的命令列介面以 0 結束並輸出純文字；JSON 輸出需要透過 `jq -r .text` 處理。
- 對於 `parakeet-mlx`，如果你傳入 `--output-dir`，當 `--output-format` 為 `txt`（或省略）時，OpenClaw 會讀取 `<output-dir>/<media-basename>.txt`；非 `txt` 輸出格式會退回解析 stdout。
- 保持逾時合理（`timeoutSeconds`，預設 60 秒），避免阻塞回覆佇列。
- 預檢轉錄只會處理**第一個**音訊附件來進行提及偵測。其他音訊附件會在主要媒體理解階段處理。

## 相關

- [媒體理解](/zh-TW/nodes/media-understanding)
- [對話模式](/zh-TW/nodes/talk)
- [語音喚醒](/zh-TW/nodes/voicewake)
