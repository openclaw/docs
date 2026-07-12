---
read_when:
    - 變更音訊轉錄或媒體處理方式
summary: 如何下載、轉錄傳入的音訊／語音訊息，並將其注入回覆中
title: 音訊與語音訊息
x-i18n:
    generated_at: "2026-07-11T21:28:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## 功能說明

啟用音訊理解（或自動偵測）時，OpenClaw 會：

1. 找出第一個音訊附件（本機路徑或 URL），並視需要下載。
2. 在傳送至每個模型項目之前強制套用 `maxBytes`。
3. 依序執行第一個符合資格的模型項目（提供者或命令列介面）；如果某個項目失敗或遭略過（大小／逾時），則嘗試下一個項目。
4. 成功時，將 `Body` 替換為 `[Audio]` 區塊，並設定 `{{Transcript}}`。

轉錄成功時，`CommandBody`/`RawBody` 也會設為轉錄文字，因此斜線命令仍可運作。使用 `--verbose` 時，日誌會顯示何時執行轉錄，以及何時替換本文。

## 自動偵測（預設）

如果尚未設定模型，且 `tools.media.audio.enabled` 不是 `false`，OpenClaw 會依下列順序自動偵測，並在找到第一個可用選項時停止：

1. **目前的回覆模型**，前提是其提供者支援音訊理解。
2. **已設定的提供者驗證** — 任何具備可用驗證資訊，且提供者支援音訊轉錄的 `models.providers.*` 項目。此項會在本機命令列介面之前檢查，因此已設定的 API 金鑰一律優先於 `PATH` 中的本機二進位檔。
   設定多個提供者時的優先順序：Groq、OpenAI、xAI、Deepgram、Google、SenseAudio、ElevenLabs、Mistral。
3. **本機命令列介面**（僅限未解析出提供者驗證時）。OpenClaw 會建立依序排列的備援清單：
   - `whisper-cli`，僅當目前程序中較早的模型呼叫觀察到 Metal 或 CUDA 時，才會排在 CPU 預設選項之前
   - 使用預設 CPU 提供者的 `sherpa-onnx-offline`（需要 `SHERPA_ONNX_MODEL_DIR`，其中包含 `tokens.txt`、`encoder.onnx`、`decoder.onnx` 和 `joiner.onnx`）
   - 當 Metal/CUDA 僅具備建置能力，或所選後端尚未被觀察到時，使用 `whisper-cli`
   - Apple Silicon 上的 `parakeet-mlx`（具備 MLX 能力；裝置使用情況仍未被觀察）
   - `whisper`（Python 命令列介面；會自動下載模型）

安裝／連結來源是能力證據，而非執行證據。它本身絕不會讓候選項目排到 CPU sherpa 之前。OpenClaw 不會只為了探測後端，就在設定或狀態檢查期間載入模型。
自動偵測的 whisper.cpp 會維持啟用其一般模型執行日誌，讓 OpenClaw 能記錄上游的 `using … backend` 行。明確設定的命令列介面項目則保留其設定的輸出旗標。

用於媒體理解的 Gemini CLI 自動偵測，已由沙箱化的 Antigravity CLI（`agy`）影像／影片備援取代；音訊除了上述本機二進位檔之外，不使用其他命令列介面備援。

若要停用自動偵測，請設定 `tools.media.audio.enabled: false`。若要自訂，請設定 `tools.media.audio.models`。

<Note>
在 macOS/Linux/Windows 上，二進位檔偵測採盡力而為。請確保命令列介面位於 `PATH` 中（會展開 `~`），或以完整命令路徑設定明確的命令列介面模型。
</Note>

在不轉錄音訊的情況下檢查本機選擇：

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

提供者清單會將本機備援勝出項目與全域提供者選擇分開回報，並列出具備能力、要求及已觀察到的後端欄位。執行轉錄後，`/status` 會在媒體行中回報要求或觀察到的後端。明確設定的 `tools.media.audio.models` 命令列介面項目仍會略過自動選擇；請使用其後端專用旗標，例如 sherpa 的 `--provider=cuda`，或 whisper.cpp 的 `--no-gpu`/`--device`。

## 設定範例

### 提供者 + 命令列介面備援（OpenAI + Whisper CLI）

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

### 僅限提供者，並使用範圍閘控

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

### 僅限提供者（Deepgram）

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

### 僅限提供者（Mistral Voxtral）

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

### 僅限提供者（SenseAudio）

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

### 將轉錄文字回傳至聊天（選用）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // 預設為 false
        echoFormat: '📝 "{transcript}"', // 選用，支援 {transcript}
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
- 音訊提供者可透過 `tools.media.audio` 覆寫 `baseUrl`、`headers` 和 `providerOptions`。
- 預設大小上限為 20MB（`tools.media.audio.maxBytes`）。超過大小的音訊會針對該模型略過，並嘗試下一個項目。
- 小於 1024 位元組的音訊檔案，會在提供者／命令列介面轉錄前略過。
- 音訊的預設 `maxChars` **未設定**（完整轉錄文字）。設定 `tools.media.audio.maxChars` 或各項目的 `maxChars` 以截短輸出。
- OpenAI 自動偵測的預設值為 `gpt-4o-transcribe`；如需更便宜／快速的選項，請設定 `model: "gpt-4o-mini-transcribe"`。
- 使用 `tools.media.audio.attachments` 處理多則語音留言（`mode: "all"` 搭配 `maxAttachments`，預設為 1）。
- 範本可透過 `{{Transcript}}` 取得轉錄文字。
- `tools.media.audio.echoTranscript` 預設為關閉；啟用後，會在代理處理之前將轉錄確認傳回原始聊天。
- `tools.media.audio.echoFormat` 可自訂回傳文字（預留位置：`{transcript}`；預設為 `📝 "{transcript}"`）。
- 命令列介面標準輸出的上限為 5MB；請保持命令列介面輸出簡潔。
- 命令列介面的 `args` 應使用 `{{MediaPath}}` 表示本機音訊檔案路徑。執行 `openclaw doctor --fix`，可遷移舊版 `audio.transcription.command` 設定中已淘汰的 `{input}` 預留位置（已淘汰的鍵：`audio.transcription`，由 `tools.media.audio.models` 取代）。
- `tools.media.concurrency` 會限制媒體工作；它不是 GPU 排程器。

### 常駐本機 STT

自動偵測的本機 STT 仍採每個請求一個程序。OpenClaw 目前不管理常駐 whisper.cpp 伺服器，因為標準 Homebrew `whisper-cpp` 套件會停用該伺服器，而上游範例並未設定有界限的接納佇列。由外掛擁有的常駐生命週期，需要具備受維護的封裝工作程序，包含健康狀態／啟動、模型常駐、有界限的佇列、取消／逾時、僅 local loopback 且無驗證的操作，以及不使用雲端備援，之後才能安全啟用。

### Proxy 環境支援

以提供者為基礎的音訊轉錄遵循標準對外 Proxy 環境變數，與 undici 的 `EnvHttpProxyAgent` 語意一致：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

小寫變數優先於大寫；`NO_PROXY`/`no_proxy` 項目（主機名稱、`*.suffix` 或 `host:port`）會略過 Proxy。如果未設定 Proxy 環境變數，則使用直接對外連線。如果 Proxy 設定失敗（URL 格式錯誤），OpenClaw 會記錄警告並退回直接擷取。

## 群組中的提及偵測

在支援音訊預檢的頻道上，當群組聊天設定 `requireMention: true` 時，OpenClaw 會在檢查提及之前轉錄音訊。如此一來，沒有說明文字的語音留言，只要轉錄文字包含已設定的提及模式，就能通過提及閘控。頻道專用文件會說明哪些傳輸方式需要輸入文字形式的提及。

**運作方式：**

1. 如果語音訊息沒有文字本文，且群組要求提及，OpenClaw 會對第一個音訊附件執行預檢轉錄。
2. 系統會檢查轉錄文字中的提及模式（例如 `@BotName`、表情符號觸發條件）。
3. 如果找到提及，訊息會繼續進入完整的回覆流程。

**備援行為：**如果預檢轉錄失敗（逾時、API 錯誤等），訊息會退回僅文字的提及偵測，因此混合訊息（文字 + 音訊）絕不會遭到捨棄。

**針對各 Telegram 群組／主題停用：**

- 設定 `channels.telegram.groups.<chatId>.disableAudioPreflight: true`，可略過該群組的預檢轉錄提及檢查。
- 設定 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`，可針對各主題覆寫（`true` 表示略過，`false` 表示強制啟用）。
- 預設值為 `false`（符合提及閘控條件時啟用預檢）。

**範例：**使用者在設定 `requireMention: true` 的 Telegram 群組中傳送一則語音留言，內容為「嗨，@Claude，天氣如何？」。該語音留言會被轉錄、偵測到提及，然後代理會回覆。

## 注意陷阱

- 範圍規則採第一個符合者優先；`chatType` 會正規化為 `direct`、`group` 或 `channel`。
- 請確保命令列介面以 0 結束並輸出純文字；JSON 輸出需要透過 `jq -r .text` 處理。
- 已知的檔案輸出模式具有權威性：推斷出的轉錄檔案若為空或不存在，就不會產生轉錄文字，也不會退回命令列介面的進度輸出。
- 對於 `parakeet-mlx`，請搭配 `--output-dir` 和預設的 `{filename}` 輸出範本使用 `--output-format txt`（或 `all`）。上游的 `PARAKEET_OUTPUT_FORMAT` 和 `PARAKEET_OUTPUT_TEMPLATE` 環境變數也會受到支援。OpenClaw 會讀取 `<output-dir>/<media-basename>.txt`；預設的 `srt` 格式、其他格式以及自訂輸出範本會繼續使用標準輸出。
- 請設定合理的逾時時間（`timeoutSeconds`，預設為 60 秒），以免阻塞回覆佇列。
- 預檢轉錄只會處理**第一個**音訊附件以進行提及偵測。其他音訊附件會在主要媒體理解階段處理。

## 相關內容

- [媒體理解](/zh-TW/nodes/media-understanding)
- [對話模式](/zh-TW/nodes/talk)
- [語音喚醒](/zh-TW/nodes/voicewake)
