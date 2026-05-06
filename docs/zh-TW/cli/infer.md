---
read_when:
    - 新增或修改 `openclaw infer` 命令
    - 設計穩定的無頭式能力自動化
summary: 推論優先的 CLI，用於由供應商支援的模型、影像、音訊、TTS、影片、網頁與嵌入工作流程
title: 推論 CLI
x-i18n:
    generated_at: "2026-05-06T09:04:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 232bf8165ff74b19aaf84431519d9f9f99f20831420b73935f73ffd9412bd04a
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` 是供應商支援推論工作流程的標準無頭介面。

它刻意公開能力系列，而不是原始 gateway RPC 名稱，也不是原始 agent 工具 ID。

## 將 infer 轉成技能

將這段複製並貼給 agent：

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

良好的 infer 型技能應該：

- 將常見使用者意圖對應到正確的 infer 子命令
- 為其涵蓋的工作流程包含幾個標準 infer 範例
- 在範例和建議中優先使用 `openclaw infer ...`
- 避免在技能內容中重新記錄整個 infer 介面

典型的 infer 導向技能涵蓋範圍：

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## 為什麼使用 infer

`openclaw infer` 在 OpenClaw 內為供應商支援的推論任務提供一致的 CLI。

優點：

- 使用 OpenClaw 中已設定的供應商和模型，而不是為每個後端連接一次性的包裝器。
- 將模型、圖片、音訊轉錄、TTS、影片、網頁和嵌入工作流程集中在一個命令樹下。
- 為指令碼、自動化和 agent 驅動的工作流程使用穩定的 `--json` 輸出形狀。
- 當任務本質上是「執行推論」時，優先使用 OpenClaw 第一方介面。
- 對大多數 infer 命令使用一般本機路徑，不需要 Gateway。

對於端到端供應商檢查，請在較低層級的供應商測試通過後，優先使用 `openclaw infer ...`。它會在發出供應商請求之前，演練已發行的 CLI、設定載入、預設 agent 解析、內建 Plugin 啟用，以及共用能力執行階段。

## 命令樹

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## 常見任務

此表將常見推論任務對應到相應的 infer 命令。

| 任務                         | 命令                                                                                       | 備註                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 執行文字/模型提示      | `openclaw infer model run --prompt "..." --json`                                              | 預設使用一般本機路徑                 |
| 對圖片執行模型提示 | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 對多個圖片輸入重複使用 `--file`             |
| 產生圖片            | `openclaw infer image generate --prompt "..." --json`                                         | 從既有檔案開始時使用 `image edit`  |
| 描述圖片檔案       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` 必須是具備圖片能力的 `<provider/model>` |
| 轉錄音訊             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` 必須是 `<provider/model>`                  |
| 合成語音            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` 以 Gateway 為導向                      |
| 產生影片             | `openclaw infer video generate --prompt "..." --json`                                         | 支援 `--resolution` 等供應商提示        |
| 描述影片檔案        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` 必須是 `<provider/model>`                  |
| 搜尋網頁               | `openclaw infer web search --query "..." --json`                                              |                                                       |
| 擷取網頁             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| 建立嵌入            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## 行為

- `openclaw infer ...` 是這些工作流程的主要 CLI 介面。
- 當輸出會由另一個命令或指令碼取用時，請使用 `--json`。
- 需要特定後端時，請使用 `--provider` 或 `--model provider/model`。
- 對於 `image describe`、`audio transcribe` 和 `video describe`，`--model` 必須使用 `<provider/model>` 形式。
- 對於 `image describe`，明確的 `--model` 會直接執行該供應商/模型。模型必須在模型目錄或供應商設定中具備圖片能力。`codex/<model>` 會執行有界的 Codex app-server 圖片理解回合；`openai-codex/<model>` 則使用 OpenAI Codex OAuth 供應商路徑。
- 無狀態執行命令預設為本機。
- Gateway 管理狀態命令預設為 Gateway。
- 一般本機路徑不需要 Gateway 正在執行。
- 本機 `model run` 是精簡的一次性供應商補全。它會解析已設定的 agent 模型和驗證，但不會啟動 chat-agent 回合、載入工具，或開啟內建 MCP 伺服器。
- `model run --file` 接受圖片檔案、偵測其 MIME 類型，並將它們連同提供的提示傳送到所選模型。對多張圖片重複使用 `--file`。
- `model run --file` 會拒絕非圖片輸入。音訊檔案請使用 `infer audio transcribe`，影片檔案請使用 `infer video describe`。
- `model run --gateway` 會演練 Gateway 路由、已儲存的驗證、供應商選擇和嵌入式執行階段，但仍會作為原始模型探測執行：它會傳送提供的提示和任何圖片附件，不包含先前的工作階段逐字稿、bootstrap/AGENTS 脈絡、context-engine 組裝、工具或內建 MCP 伺服器。
- `model run --gateway --model <provider/model>` 需要受信任的操作員 gateway 認證，因為該請求會要求 Gateway 執行一次性的供應商/模型覆寫。

## 模型

使用 `model` 進行供應商支援的文字推論，以及模型/供應商檢查。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

使用完整的 `<provider/model>` 參照來煙霧測試特定供應商，而不啟動 Gateway 或載入完整的 agent 工具介面：

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

備註：

- 本機 `model run` 是檢查供應商/模型/驗證健康狀態時範圍最窄的 CLI 煙霧測試，因為對非 Codex 供應商而言，它只會將提供的提示傳送到所選模型。
- `openai-codex/*` 本機探測是狹窄例外：OpenClaw 會加入最小系統指示，讓 Codex Responses 傳輸可填入其必要的 `instructions` 欄位，而不加入完整 agent 脈絡、工具、記憶或工作階段逐字稿。
- 本機 `model run --file` 會保留該精簡路徑，並將圖片內容直接附加到單一使用者訊息。當 PNG、JPEG 和 WebP 等常見圖片檔案的 MIME 類型被偵測為 `image/*` 時即可使用；不支援或無法辨識的檔案會在呼叫供應商前失敗。
- 當你想直接測試所選的多模態文字模型時，`model run --file` 最合適。當你想使用 OpenClaw 的圖片理解供應商選擇和預設圖片模型路由時，請使用 `infer image describe`。
- 所選模型必須支援圖片輸入；純文字模型可能會在供應商層拒絕請求。
- `model run --prompt` 必須包含非空白文字；空提示會在呼叫本機供應商或 Gateway 前被拒絕。
- 當供應商沒有回傳文字輸出時，本機 `model run` 會以非零狀態結束，因此無法連線的本機供應商和空補全不會看起來像成功的探測。
- 當你需要測試 Gateway 路由、agent-runtime 設定或 Gateway 管理的供應商狀態，同時保持原始模型輸入時，請使用 `model run --gateway`。當你需要完整 agent 脈絡、工具、記憶和工作階段逐字稿時，請使用 `openclaw agent` 或聊天介面。
- `model auth login`、`model auth logout` 和 `model auth status` 管理已儲存的供應商驗證狀態。

## 圖片

使用 `image` 進行產生、編輯和描述。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

備註：

- 從現有輸入檔案開始時，請使用 `image edit`。
- 對於支援參考圖片編輯幾何提示的提供者/模型，請搭配 `image edit` 使用 `--size`、`--aspect-ratio` 或 `--resolution`。
- 若要輸出透明背景的 OpenAI PNG，請搭配 `--model openai/gpt-image-1.5` 使用 `--output-format png --background transparent`；`--openai-background` 仍可作為 OpenAI 專用別名。未宣告支援背景的提供者會將該提示回報為已忽略的覆寫。
- 使用 `image providers --json` 確認哪些內建圖片提供者可被探索、已設定、已選取，以及每個提供者公開哪些生成/編輯功能。
- 使用 `image generate --model <provider/model> --json` 作為圖片生成變更最精準的即時 CLI 煙霧測試。範例：

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON 回應會回報 `ok`、`provider`、`model`、`attempts`，以及已寫入的輸出路徑。設定 `--output` 時，最終副檔名可能會依照提供者回傳的 MIME 類型而定。

- 對於 `image describe` 和 `image describe-many`，使用 `--prompt` 給視覺模型任務專用指示，例如 OCR、比較、UI 檢查或精簡描述。
- 對於速度較慢的本機視覺模型或冷啟動的 Ollama，請使用 `--timeout-ms`。
- 對於 `image describe`，`--model` 必須是具備圖片能力的 `<provider/model>`。
- 對於本機 Ollama 視覺模型，請先拉取模型，並將 `OLLAMA_API_KEY` 設為任意佔位值，例如 `ollama-local`。請參閱 [Ollama](/zh-TW/providers/ollama#vision-and-image-description)。

## 音訊

使用 `audio` 進行檔案轉錄。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

注意事項：

- `audio transcribe` 用於檔案轉錄，不是即時工作階段管理。
- `--model` 必須是 `<provider/model>`。

## TTS

使用 `tts` 進行語音合成和 TTS 提供者狀態查詢。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

注意事項：

- `tts status` 預設使用 Gateway，因為它反映由 Gateway 管理的 TTS 狀態。
- 使用 `tts providers`、`tts voices` 和 `tts set-provider` 檢查並設定 TTS 行為。

## 影片

使用 `video` 進行生成和描述。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

注意事項：

- `video generate` 接受 `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark` 和 `--timeout-ms`，並將它們轉送給影片生成執行階段。
- 對於 `video describe`，`--model` 必須是 `<provider/model>`。

## 網頁

使用 `web` 進行搜尋和擷取工作流程。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

注意事項：

- 使用 `web providers` 檢查可用、已設定和已選取的提供者。

## 嵌入

使用 `embedding` 建立向量並檢查嵌入提供者。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 輸出

推論命令會在共用封套下正規化 JSON 輸出：

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

頂層欄位是穩定的：

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

對於生成媒體命令，`outputs` 會包含 OpenClaw 寫入的檔案。自動化時，請使用該陣列中的 `path`、`mimeType`、`size`，以及任何媒體專用尺寸，而不是解析供人閱讀的標準輸出。

## 常見陷阱

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## 注意事項

- `openclaw capability ...` 是 `openclaw infer ...` 的別名。

## 相關內容

- [CLI 參考](/zh-TW/cli)
- [模型](/zh-TW/concepts/models)
