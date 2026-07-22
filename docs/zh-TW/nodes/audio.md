---
read_when:
    - 變更音訊轉錄或媒體處理方式
summary: 如何下載、轉錄傳入的音訊／語音訊息，並將其注入回覆中
title: 音訊與語音備忘錄
x-i18n:
    generated_at: "2026-07-22T10:37:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9303b2bb84c81f3a8c9f27fee6b84a1295022af96327c097987af56776487644
    source_path: nodes/audio.md
    workflow: 16
---

## 功能說明

啟用音訊理解功能（或自動偵測到此功能）時，OpenClaw 會：

1. 找出第一個音訊附件（本機路徑或 URL），並視需要下載。
2. 傳送至每個模型項目之前，強制套用 `maxBytes`。
3. 依序執行第一個符合資格的模型項目（供應商或命令列介面）；如果某個項目失敗或略過（大小／逾時），則嘗試下一個項目。
4. 成功時，將 `Body` 取代為 `[Audio]` 區塊，並設定 `{{Transcript}}`。

轉錄成功時，也會將 `CommandBody`/`RawBody` 設為轉錄文字，讓斜線命令仍可運作。使用 `--verbose` 時，日誌會顯示轉錄執行及其取代本文的時機。

## 自動偵測（預設）

如果你尚未設定模型，且 `tools.media.audio.enabled` 不是 `false`，OpenClaw 會依下列順序自動偵測，並在找到第一個可用選項時停止：

1. **目前的回覆模型**，前提是其供應商支援音訊理解。
2. **已設定的供應商驗證** — 任何具備認證資訊，且供應商支援音訊轉錄的 `models.providers.*` 項目。此項會在本機命令列介面之前檢查，因此已設定的 API 金鑰一律優先於 `PATH` 上的本機二進位檔。
   設定多個供應商時的優先順序：Groq、OpenAI、xAI、Deepgram、Google、SenseAudio、ElevenLabs、Mistral。
3. **本機命令列介面**（僅限未解析出供應商認證資訊時）。OpenClaw 會建立依序排列的備援清單：
   - `whisper-cli`，僅在目前程序中較早的模型叫用曾觀察到 Metal 或 CUDA 時，才排在 CPU 預設選項之前
   - `sherpa-onnx-offline` 使用其預設 CPU 供應商（需要具備 `tokens.txt`、`encoder.onnx`、`decoder.onnx` 與 `joiner.onnx` 的 `SHERPA_ONNX_MODEL_DIR`）
   - 當 Metal/CUDA 僅具備建置能力，或所選後端尚未透過其他方式觀察到時，使用 `whisper-cli`
   - 在 Apple Silicon 上使用 `parakeet-mlx`（支援 MLX；裝置使用情況仍未觀察到）
   - `whisper`（Python 命令列介面；自動下載模型）

安裝／連結來源是能力證據，而非執行證據。它本身絕不會讓候選項目的優先順序高於 CPU sherpa。OpenClaw 不會僅為了探測後端，就在設定或狀態檢查期間載入模型。
自動偵測到的 whisper.cpp 會維持啟用其一般模型執行日誌，讓 OpenClaw 能記錄上游的 `using … backend` 行。明確設定的命令列介面項目則維持其已設定的輸出旗標。

用於媒體理解的 Gemini CLI 自動偵測已由沙箱化的 Antigravity CLI（`agy`）影像／視訊備援取代；除了上述本機二進位檔之外，音訊不使用命令列介面備援。

若要停用自動偵測，請設定 `tools.media.audio.enabled: false`。若要自訂，請將帶有能力標籤的項目新增至 `tools.media.models`。

<Note>
在 macOS/Linux/Windows 上，二進位檔偵測採盡力而為的方式。請確保命令列介面位於 `PATH`（會展開 `~`），或使用完整命令路徑設定明確的命令列介面模型。
</Note>

在不轉錄音訊的情況下檢查本機選擇：

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

供應商清單會分別回報本機備援的勝出者與全域供應商選擇，以及具備能力、要求和觀察到的後端欄位。轉錄執行後，`/status` 會在媒體行中回報要求或觀察到的後端。明確支援音訊的 `tools.media.models` 命令列介面項目仍會略過自動選擇；請使用其後端專用旗標，例如 sherpa 的 `--provider=cuda`，或 whisper.cpp 的 `--no-gpu`/`--device`。

## 設定範例

### 供應商 + 命令列介面備援（OpenAI + Whisper CLI）

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-4o-transcribe", capabilities: ["audio"] },
        {
          type: "cli",
          command: "whisper",
          args: ["--model", "base", "{{MediaPath}}"],
          timeoutSeconds: 45,
          capabilities: ["audio"],
        },
      ],
      audio: { enabled: true, preferredModel: "openai/gpt-4o-transcribe" },
    },
  },
}
```

### 僅限供應商（Deepgram）

```json5
{
  tools: {
    media: {
      models: [{ provider: "deepgram", model: "nova-3", capabilities: ["audio"] }],
      audio: { enabled: true },
    },
  },
}
```

### 僅限供應商（Mistral Voxtral）

```json5
{
  tools: {
    media: {
      models: [{ provider: "mistral", model: "voxtral-mini-latest", capabilities: ["audio"] }],
      audio: { enabled: true },
    },
  },
}
```

### 僅限供應商（SenseAudio）

```json5
{
  tools: {
    media: {
      models: [
        {
          provider: "senseaudio",
          model: "senseaudio-asr-pro-1.5-260319",
          capabilities: ["audio"],
        },
      ],
      audio: { enabled: true },
    },
  },
}
```

### 將轉錄文字回顯至聊天（選用）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
    },
  },
}
```

## 注意事項與限制

- 供應商驗證遵循標準模型驗證順序（驗證設定檔、環境變數、`models.providers.*.apiKey`）。
- Groq 設定詳細資訊：[Groq](/zh-TW/providers/groq)。
- 使用 `provider: "deepgram"` 時，Deepgram 會取得 `DEEPGRAM_API_KEY`。設定詳細資訊：[Deepgram](/zh-TW/providers/deepgram)。
- Mistral 設定詳細資訊：[Mistral](/zh-TW/providers/mistral)。
- 使用 `provider: "senseaudio"` 時，SenseAudio 會取得 `SENSEAUDIO_API_KEY`。設定詳細資訊：[SenseAudio](/zh-TW/providers/senseaudio)。
- 音訊供應商可使用 `tools.media.audio` 下的預設值，或在其 `tools.media.models[]` 項目上覆寫 `baseUrl`、`headers`、`providerOptions` 和限制。
- 內建音訊大小上限為 20MB。項目層級的 `maxBytes` 覆寫可變更此限制；對該模型而言，超過大小限制的音訊會被略過，並嘗試下一個項目。
- 小於 1024 位元組的音訊檔案會在供應商／命令列介面轉錄之前略過。
- 音訊的預設 `maxChars` 為**未設定**（完整轉錄文字）。設定 `tools.media.audio.maxChars` 或各項目的 `maxChars` 以裁減輸出。
- OpenAI 自動偵測的預設值為 `gpt-4o-transcribe`；若要使用更便宜／更快速的選項，請設定 `model: "gpt-4o-mini-transcribe"`。
- 範本可透過 `{{Transcript}}` 使用轉錄文字。
- `tools.media.audio.echoTranscript` 預設為關閉；`echoFormat` 接受 `{transcript}` 預留位置。
- 命令列介面 stdout 上限為 5MB；請保持命令列介面輸出簡潔。
- 命令列介面 `args` 應使用 `{{MediaPath}}` 作為本機音訊檔案路徑。執行 `openclaw doctor --fix`，以移轉舊版 `audio.transcription.command` 設定中已淘汰的 `{input}` 預留位置（已停用的鍵：`audio.transcription`，由 `tools.media.models` 取代）。
- `tools.media.concurrency` 會限制媒體工作；它不是 GPU 排程器。

### 常駐本機 STT

自動偵測的本機 STT 仍採用每個要求一個程序的方式。OpenClaw 目前不管理常駐 whisper.cpp 伺服器，因為標準 Homebrew `whisper-cpp` 套件會停用該伺服器，而上游範例並未設定具有限制的准入佇列。外掛所擁有的常駐生命週期必須具備受維護的封裝工作程序，包含健康狀態／啟動、模型常駐、有限佇列、取消／逾時、僅限回送且不需驗證的運作方式，以及不得使用雲端備援，才能安全啟用。

### Proxy 環境支援

供應商型音訊轉錄支援標準輸出 Proxy 環境變數，並符合 undici 的 `EnvHttpProxyAgent` 語意：

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

小寫變數的優先順序高於大寫；`NO_PROXY`/`no_proxy` 項目（主機名稱、`*.suffix` 或 `host:port`）會略過 Proxy。若未設定 Proxy 環境變數，則使用直接對外連線。若 Proxy 設定失敗（URL 格式錯誤），OpenClaw 會記錄警告並退回直接擷取。

## 群組中的提及偵測

在支援音訊預檢的頻道上，若群組聊天已設定 `requireMention: true`，OpenClaw 會在檢查提及之前轉錄音訊。如此一來，沒有說明文字的語音訊息，只要其轉錄文字包含已設定的提及模式，就能通過提及閘門。需要輸入文字提及的傳輸方式會在各頻道專屬文件中說明。

**運作方式：**

1. 如果語音訊息沒有文字本文，且群組要求提及，OpenClaw 會對第一個音訊附件執行預檢轉錄。
2. 檢查轉錄文字是否符合提及模式（例如 `@BotName`、表情符號觸發條件）。
3. 如果找到提及，訊息就會繼續通過完整回覆流水線。

**備援行為：**如果預檢轉錄失敗（逾時、API 錯誤等），訊息會退回僅限文字的提及偵測，因此混合訊息（文字 + 音訊）絕不會遭到捨棄。

**依 Telegram 群組／主題選擇停用：**

- 設定 `channels.telegram.groups.<chatId>.disableAudioPreflight: true`，以略過該群組的預檢轉錄文字提及檢查。
- 設定 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`，以依主題覆寫（`true` 表示略過，`false` 表示強制啟用）。
- 預設值為 `false`（符合提及閘門條件時啟用預檢）。

**範例：**使用者在已設定 `requireMention: true` 的 Telegram 群組中傳送一則語音訊息，內容為「嘿，@Claude，天氣如何？」。系統會轉錄該語音訊息、偵測到提及，然後代理程式會回覆。

## 注意事項

- 範圍規則採用第一個相符項目優先；`chatType` 會正規化為 `direct`、`group` 或 `channel`。
- 請確保你的命令列介面以 0 結束並輸出純文字；JSON 輸出需要透過 `jq -r .text` 進行調整。
- 已知的檔案輸出模式具有決定性：推斷出的轉錄檔案若為空或不存在，就不會產生轉錄文字，而不會退回命令列介面進度輸出。
- 針對 `parakeet-mlx`，請搭配 `--output-dir` 與預設的 `{filename}` 輸出範本，使用 `--output-format txt`（或 `all`）。也支援上游的 `PARAKEET_OUTPUT_FORMAT` 與 `PARAKEET_OUTPUT_TEMPLATE` 環境變數。OpenClaw 會讀取 `<output-dir>/<media-basename>.txt`；預設的 `srt` 格式、其他格式與自訂輸出範本仍會使用 stdout。
- 請將逾時設為合理值（`timeoutSeconds`，預設 60s），以避免阻塞回覆佇列。
- 預檢轉錄僅處理**第一個**音訊附件以進行提及偵測。其他音訊附件會在主要媒體理解階段處理。

## 相關內容

- [媒體理解](/zh-TW/nodes/media-understanding)
- [對話模式](/zh-TW/nodes/talk)
- [語音喚醒](/zh-TW/nodes/voicewake)
