---
read_when:
    - 新增或修改 `openclaw infer` 命令
    - 設計穩定的無介面能力自動化
summary: 推論優先的 CLI，用於供應商支援的模型、影像、音訊、文字轉語音、影片、網頁和嵌入工作流程
title: 推論 CLI
x-i18n:
    generated_at: "2026-04-30T02:54:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a154cf11a09f6c60117740f42937da3a0e6942931dde6eee6d902fb6e0ba461
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` 是供提供者支援之推論工作流程使用的標準無頭介面。

它刻意公開功能系列，而不是原始 Gateway RPC 名稱，也不是原始代理程式工具 ID。

## 將 infer 轉換為 Skills

將此內容複製並貼給代理程式：

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

良好的 infer 型 Skills 應該：

- 將常見使用者意圖對應到正確的 infer 子命令
- 為其涵蓋的工作流程包含幾個標準 infer 範例
- 在範例和建議中優先使用 `openclaw infer ...`
- 避免在 Skills 內容中重新記錄整個 infer 介面

典型的 infer 聚焦 Skills 涵蓋範圍：

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## 為何使用 infer

`openclaw infer` 為 OpenClaw 內由提供者支援的推論任務提供一致的 CLI。

優點：

- 使用 OpenClaw 中已設定的提供者和模型，而不是為每個後端接線一次性的包裝器。
- 將模型、影像、音訊轉錄、TTS、影片、網頁和嵌入工作流程集中在一個命令樹下。
- 為指令碼、自動化和代理程式驅動的工作流程使用穩定的 `--json` 輸出形狀。
- 當任務本質上是「執行推論」時，優先使用第一方 OpenClaw 介面。
- 大多數 infer 命令使用一般本機路徑，不需要 Gateway。

對於端對端提供者檢查，當較低層級的
提供者測試通過後，優先使用 `openclaw infer ...`。它會在提出提供者請求前，演練已發布的 CLI、設定載入、
預設代理程式解析、內建 Plugin 啟用、執行階段相依性修復，
以及共用功能執行階段。

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
| 對影像執行模型提示 | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 對多個影像輸入重複使用 `--file`             |
| 產生影像            | `openclaw infer image generate --prompt "..." --json`                                         | 從現有檔案開始時使用 `image edit`  |
| 描述影像檔案       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` 必須是支援影像的 `<provider/model>` |
| 轉錄音訊             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` 必須是 `<provider/model>`                  |
| 合成語音            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` 以 Gateway 為導向                      |
| 產生影片             | `openclaw infer video generate --prompt "..." --json`                                         | 支援例如 `--resolution` 的提供者提示        |
| 描述影片檔案        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` 必須是 `<provider/model>`                  |
| 搜尋網頁               | `openclaw infer web search --query "..." --json`                                              |                                                       |
| 擷取網頁             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| 建立嵌入            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## 行為

- `openclaw infer ...` 是這些工作流程的主要 CLI 介面。
- 當輸出會由另一個命令或指令碼使用時，請使用 `--json`。
- 需要特定後端時，請使用 `--provider` 或 `--model provider/model`。
- 對於 `image describe`、`audio transcribe` 和 `video describe`，`--model` 必須使用 `<provider/model>` 形式。
- 對於 `image describe`，明確的 `--model` 會直接執行該提供者/模型。模型必須在模型目錄或提供者設定中具備影像能力。`codex/<model>` 會執行有界限的 Codex 應用程式伺服器影像理解回合；`openai-codex/<model>` 使用 OpenAI Codex OAuth 提供者路徑。
- 無狀態執行命令預設為本機。
- Gateway 管理的狀態命令預設為 Gateway。
- 一般本機路徑不需要 Gateway 正在執行。
- 本機 `model run` 是精簡的一次性提供者補全。它會解析已設定的代理程式模型和驗證，但不會啟動聊天代理程式回合、載入工具，或開啟內建 MCP 伺服器。
- `model run --file` 接受影像檔案、偵測其 MIME 類型，並將它們連同提供的提示傳送至所選模型。對多張影像重複使用 `--file`。
- `model run --file` 會拒絕非影像輸入。音訊檔案請使用 `infer audio transcribe`，影片檔案請使用 `infer video describe`。
- `model run --gateway` 會演練 Gateway 路由、已儲存的驗證、提供者選擇，以及嵌入式執行階段，但仍會以原始模型探測方式執行：它會傳送提供的提示和任何影像附件，不含先前的工作階段逐字稿、bootstrap/AGENTS 上下文、上下文引擎組裝、工具或內建 MCP 伺服器。
- `model run --gateway --model <provider/model>` 需要可信任的操作者 Gateway 認證，因為該請求要求 Gateway 執行一次性的提供者/模型覆寫。

## 模型

使用 `model` 進行由提供者支援的文字推論，以及模型/提供者檢查。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

使用完整 `<provider/model>` 參照來對特定提供者進行煙霧測試，而不需
啟動 Gateway 或載入完整代理程式工具介面：

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

- 本機 `model run` 是提供者/模型/驗證健康狀態最窄的 CLI 煙霧測試，因為它只會將提供的提示傳送給所選模型。
- 本機 `model run --file` 保持該精簡路徑，並將影像內容直接附加到單一使用者訊息。當 PNG、JPEG 和 WebP 等常見影像檔案的 MIME 類型被偵測為 `image/*` 時即可運作；不支援或無法辨識的檔案會在呼叫提供者前失敗。
- 當你想直接測試所選多模態文字模型時，`model run --file` 最適合。當你想使用 OpenClaw 的影像理解提供者選擇和預設影像模型路由時，請使用 `infer image describe`。
- 所選模型必須支援影像輸入；純文字模型可能會在提供者層拒絕該請求。
- `model run --prompt` 必須包含非空白文字；空提示會在呼叫本機提供者或 Gateway 前被拒絕。
- 當提供者沒有傳回文字輸出時，本機 `model run` 會以非零狀態結束，因此無法連線的本機提供者和空補全不會看起來像成功的探測。
- 當你需要測試 Gateway 路由、代理程式執行階段設定，或 Gateway 管理的提供者狀態，同時保持模型輸入為原始內容時，請使用 `model run --gateway`。當你想要完整的代理程式上下文、工具、記憶體和工作階段逐字稿時，請使用 `openclaw agent` 或聊天介面。
- `model auth login`、`model auth logout` 和 `model auth status` 管理已儲存的提供者驗證狀態。

## 影像

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
- 對於支援參考影像編輯幾何提示的
  提供者/模型，請搭配 `image edit` 使用 `--size`、`--aspect-ratio` 或 `--resolution`。
- 使用 `--output-format png --background transparent` 搭配
  `--model openai/gpt-image-1.5` 以取得透明背景的 OpenAI PNG 輸出；
  `--openai-background` 仍可作為 OpenAI 專用別名使用。未宣告背景支援的提供者
  會將該提示回報為已忽略的覆寫。
- 使用 `image providers --json` 驗證哪些內建影像提供者
  可被發現、已設定、已選取，以及每個提供者公開哪些產生/編輯能力。
- 使用 `image generate --model <provider/model> --json` 作為影像產生變更最窄的即時
  CLI 煙霧測試。範例：

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON 回應會回報 `ok`、`provider`、`model`、`attempts`，以及已寫入的
  輸出路徑。設定 `--output` 時，最終副檔名可能會依照
  提供者回傳的 MIME 類型。

- 對於 `image describe` 和 `image describe-many`，使用 `--prompt` 為視覺模型提供特定任務指示，例如 OCR、比較、UI 檢查或精簡字幕。
- 搭配緩慢的本機視覺模型或冷啟動的 Ollama 使用 `--timeout-ms`。
- 對於 `image describe`，`--model` 必須是具備影像能力的 `<provider/model>`。
- 對於本機 Ollama 視覺模型，請先拉取模型，並將 `OLLAMA_API_KEY` 設為任何佔位值，例如 `ollama-local`。請參閱 [Ollama](/zh-TW/providers/ollama#vision-and-image-description)。

## 音訊

使用 `audio` 進行檔案轉錄。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

注意事項：

- `audio transcribe` 用於檔案轉錄，而非即時工作階段管理。
- `--model` 必須是 `<provider/model>`。

## TTS

使用 `tts` 進行語音合成與 TTS 提供者狀態查詢。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

注意事項：

- `tts status` 預設使用 Gateway，因為它反映由 Gateway 管理的 TTS 狀態。
- 使用 `tts providers`、`tts voices` 和 `tts set-provider` 來檢查並設定 TTS 行為。

## 影片

使用 `video` 進行生成與描述。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

注意事項：

- `video generate` 接受 `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark` 和 `--timeout-ms`，並將它們轉送至影片生成執行階段。
- `--model` 對於 `video describe` 必須是 `<provider/model>`。

## Web

使用 `web` 進行搜尋與擷取工作流程。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

注意事項：

- 使用 `web providers` 來檢查可用、已設定及已選取的提供者。

## 嵌入

使用 `embedding` 進行向量建立與嵌入提供者檢查。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 輸出

`infer` 命令會將 JSON 輸出正規化到共用封套下：

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

對於生成媒體命令，`outputs` 包含 OpenClaw 寫入的檔案。請使用
該陣列中的 `path`、`mimeType`、`size` 以及任何媒體專屬尺寸
進行自動化，而不是剖析人類可讀的 stdout。

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

## 相關

- [CLI 參考](/zh-TW/cli)
- [模型](/zh-TW/concepts/models)
