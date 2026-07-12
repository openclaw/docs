---
read_when:
    - 變更音訊轉錄或媒體處理
summary: 如何下載、轉錄傳入的音訊／語音留言，並將其注入回覆中
title: 音訊與語音訊息
x-i18n:
    generated_at: "2026-07-12T14:35:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## 功能說明

啟用音訊理解（或自動偵測）時，OpenClaw 會：

1. 找出第一個音訊附件（本機路徑或 URL），並視需要下載。
2. 在傳送至每個模型項目之前，強制套用 `maxBytes` 限制。
3. 依序執行第一個符合條件的模型項目（供應商或命令列介面）；若某個項目失敗或遭略過（大小／逾時），則嘗試下一個項目。
4. 成功時，以 `[Audio]` 區塊取代 `Body`，並設定 `{{Transcript}}`。

轉錄成功時，`CommandBody`/`RawBody` 也會設為逐字稿，因此斜線指令仍可運作。使用 `--verbose` 時，日誌會顯示何時執行轉錄，以及何時取代本文。

## 自動偵測（預設）

如果你尚未設定模型，且 `tools.media.audio.enabled` 不為 `false`，OpenClaw 會依下列順序自動偵測，並在找到第一個可用選項時停止：

1. **目前回覆模型**，前提是其供應商支援音訊理解。
2. **已設定的供應商驗證** — 任何具有可用驗證，且供應商支援音訊轉錄的 `models.providers.*` 項目。系統會在本機命令列介面之前檢查此項，因此已設定的 API 金鑰一律優先於 `PATH` 上的本機執行檔。
   設定多個供應商時的優先順序：Groq、OpenAI、xAI、Deepgram、Google、SenseAudio、ElevenLabs、Mistral。
3. **本機命令列介面**（僅在未解析到供應商驗證時）。OpenClaw 會建立依序排列的備援清單：
   - `whisper-cli`，僅當目前程序中較早的模型呼叫已觀察到 Metal 或 CUDA 時，才排在 CPU 預設選項之前
   - 使用預設 CPU 供應商的 `sherpa-onnx-offline`（需要 `SHERPA_ONNX_MODEL_DIR`，其中包含 `tokens.txt`、`encoder.onnx`、`decoder.onnx` 和 `joiner.onnx`）
   - 當 Metal/CUDA 僅具備建置能力，或所選後端尚未以其他方式觀察到時，使用 `whisper-cli`
   - Apple Silicon 上的 `parakeet-mlx`（支援 MLX；裝置使用情況仍未觀察）
   - `whisper`（Python 命令列介面；會自動下載模型）

安裝／連結來源可作為能力證據，而非執行證據。僅憑這項資訊，絕不會讓候選項目的順位超越 CPU sherpa。OpenClaw 不會僅為了探測後端，而在設定或狀態檢查期間載入模型。
自動偵測的 whisper.cpp 會維持其一般模型執行日誌為啟用狀態，讓 OpenClaw 能記錄上游的 `using … backend` 行。明確設定的命令列介面項目則會保留其已設定的輸出旗標。

用於媒體理解的 Gemini CLI 自動偵測已由沙箱化的 Antigravity CLI（`agy`）影像／影片備援取代；除上述本機執行檔外，音訊不使用其他命令列介面備援。

若要停用自動偵測，請設定 `tools.media.audio.enabled: false`。若要自訂，請設定 `tools.media.audio.models`。

<Note>
在 macOS/Linux/Windows 上，執行檔偵測採盡力而為。請確認命令列介面位於 `PATH` 上（會展開 `~`），或使用完整指令路徑明確設定命令列介面模型。
</Note>

無須轉錄音訊即可檢查本機選擇：

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

供應商清單會將本機備援的勝出項目與全域供應商選擇分開報告，並列出具備能力、要求使用及已觀察到的後端欄位。轉錄執行後，`/status` 會在媒體行中報告要求使用或已觀察到的後端。明確設定的 `tools.media.audio.models` 命令列介面項目仍會略過自動選擇；請使用其後端專用旗標，例如 sherpa 的 `--provider=cuda`，或 whisper.cpp 的 `--no-gpu`/`--device`。

## 設定範例

### 供應商 + 命令列介面備援（OpenAI + Whisper CLI）

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

### 僅供應商並套用範圍限制

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

### 僅供應商（Deepgram）

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

### 僅供應商（Mistral Voxtral）

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

### 僅供應商（SenseAudio）

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

### 將逐字稿回傳至聊天（選用）

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

- 供應商驗證遵循標準模型驗證順序（驗證設定檔、環境變數、`models.providers.*.apiKey`）。
- Groq 設定詳細資訊：[Groq](/zh-TW/providers/groq)。
- 使用 `provider: "deepgram"` 時，Deepgram 會讀取 `DEEPGRAM_API_KEY`。設定詳細資訊：[Deepgram](/zh-TW/providers/deepgram)。
- Mistral 設定詳細資訊：[Mistral](/zh-TW/providers/mistral)。
- 使用 `provider: "senseaudio"` 時，SenseAudio 會讀取 `SENSEAUDIO_API_KEY`。設定詳細資訊：[SenseAudio](/zh-TW/providers/senseaudio)。
- 音訊供應商可透過 `tools.media.audio` 覆寫 `baseUrl`、`headers` 和 `providerOptions`。
- 預設大小上限為 20MB（`tools.media.audio.maxBytes`）。超過大小限制的音訊會對該模型略過，並嘗試下一個項目。
- 小於 1024 位元組的音訊檔案會在供應商／命令列介面轉錄之前略過。
- 音訊的預設 `maxChars` **未設定**（完整逐字稿）。設定 `tools.media.audio.maxChars` 或各項目的 `maxChars` 以截短輸出。
- OpenAI 自動偵測的預設模型為 `gpt-4o-transcribe`；設定 `model: "gpt-4o-mini-transcribe"` 可使用更便宜／更快速的選項。
- 使用 `tools.media.audio.attachments` 處理多個語音訊息（`mode: "all"` 加上 `maxAttachments`，預設為 1）。
- 範本可透過 `{{Transcript}}` 取得逐字稿。
- `tools.media.audio.echoTranscript` 預設為關閉；啟用後，會在代理程式處理之前，將逐字稿確認訊息傳回原始聊天。
- `tools.media.audio.echoFormat` 可自訂回傳文字（預留位置：`{transcript}`；預設值為 `📝 "{transcript}"`）。
- 命令列介面的 stdout 上限為 5MB；請保持命令列介面輸出精簡。
- 命令列介面的 `args` 應使用 `{{MediaPath}}` 表示本機音訊檔案路徑。執行 `openclaw doctor --fix`，以移轉較舊 `audio.transcription.command` 設定中已淘汰的 `{input}` 預留位置（已淘汰的鍵：`audio.transcription`，由 `tools.media.audio.models` 取代）。
- `tools.media.concurrency` 會限制媒體工作數量；它不是 GPU 排程器。

### 常駐本機 STT

自動偵測的本機 STT 仍採每個要求一個程序的方式。OpenClaw 目前不管理常駐 whisper.cpp 伺服器，因為標準 Homebrew `whisper-cpp` 套件會停用該伺服器，而上游範例未設定具有限制的准入佇列。由外掛擁有的常駐生命週期必須具備持續維護的封裝工作程式，包含健康狀態／啟動、模型常駐、有限佇列、取消／逾時、僅限回送介面且無須驗證的運作方式，以及不使用雲端備援，才能安全啟用。

### Proxy 環境支援

以供應商為基礎的音訊轉錄會遵循標準輸出 Proxy 環境變數，與 undici 的 `EnvHttpProxyAgent` 語意一致：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

小寫變數的優先順序高於大寫變數；`NO_PROXY`/`no_proxy` 項目（主機名稱、`*.suffix` 或 `host:port`）會略過 Proxy。若未設定任何 Proxy 環境變數，則使用直接對外連線。若 Proxy 設定失敗（URL 格式錯誤），OpenClaw 會記錄警告並退回直接擷取。

## 群組中的提及偵測

在支援音訊預檢的頻道上，當群組聊天設定 `requireMention: true` 時，OpenClaw 會在檢查提及之前轉錄音訊。如此一來，沒有說明文字的語音訊息只要逐字稿包含已設定的提及模式，就能通過提及限制。特定頻道的文件會說明哪些傳輸方式改為要求輸入文字提及。

**運作方式：**

1. 如果語音訊息沒有文字本文，且群組要求提及，OpenClaw 會對第一個音訊附件執行預檢轉錄。
2. 系統會檢查逐字稿中的提及模式（例如 `@BotName`、表情符號觸發條件）。
3. 如果找到提及，訊息便會繼續進入完整回覆管線。

**備援行為：**若預檢轉錄失敗（逾時、API 錯誤等），訊息會退回僅文字的提及偵測，因此混合訊息（文字 + 音訊）絕不會遭到捨棄。

**依 Telegram 群組／主題選擇停用：**

- 設定 `channels.telegram.groups.<chatId>.disableAudioPreflight: true`，即可略過該群組的預檢逐字稿提及檢查。
- 設定 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`，即可依主題覆寫（`true` 表示略過，`false` 表示強制啟用）。
- 預設值為 `false`（符合提及限制條件時啟用預檢）。

**範例：**使用者在設定 `requireMention: true` 的 Telegram 群組中傳送語音訊息，內容為 “嗨，@Claude，天氣如何？”。系統會轉錄語音訊息、偵測到提及，然後代理程式便會回覆。

## 常見問題

- 範圍規則採用第一個相符項目優先；`chatType` 會正規化為 `direct`、`group` 或 `channel`。
- 確認你的命令列介面以代碼 0 結束並輸出純文字；JSON 輸出需要透過 `jq -r .text` 處理。
- 已知的檔案輸出模式具有最高判定權：若推斷出的逐字稿檔案為空或不存在，系統不會退回使用命令列介面的進度輸出，而是不產生逐字稿。
- 對於 `parakeet-mlx`，請搭配 `--output-dir` 使用 `--output-format txt`（或 `all`），並使用預設的 `{filename}` 輸出範本。也會遵循上游的 `PARAKEET_OUTPUT_FORMAT` 和 `PARAKEET_OUTPUT_TEMPLATE` 環境變數。OpenClaw 會讀取 `<output-dir>/<media-basename>.txt`；預設的 `srt` 格式、其他格式和自訂輸出範本仍會使用 stdout。
- 請設定合理的逾時時間（`timeoutSeconds`，預設 60s），避免阻塞回覆佇列。
- 預檢轉錄只會處理**第一個**音訊附件以進行提及偵測。其他音訊附件會在主要媒體理解階段處理。

## 相關內容

- [媒體理解](/zh-TW/nodes/media-understanding)
- [對話模式](/zh-TW/nodes/talk)
- [語音喚醒](/zh-TW/nodes/voicewake)
