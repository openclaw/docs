---
read_when:
    - 新增或修改 `openclaw infer` 命令
    - 設計穩定的無頭能力自動化
summary: 推論優先的 CLI，用於供應商支援的模型、影像、音訊、TTS、影片、網頁和嵌入工作流程
title: 推論 CLI
x-i18n:
    generated_at: "2026-05-10T19:28:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05496c5278650c30e5a52dceba105b703258040765f0a3f75268bb514270f15d
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` 是 OpenClaw 中由提供者支援的推論工作流程的標準無頭介面。

它刻意公開的是能力家族，而不是原始 Gateway RPC 名稱，也不是原始代理工具 ID。

## 將 infer 轉換為 skill

將以下內容複製並貼到代理：

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

一個良好的 infer 型 skill 應該：

- 將常見使用者意圖對應到正確的 infer 子命令
- 包含一些其涵蓋工作流程的標準 infer 範例
- 在範例和建議中偏好使用 `openclaw infer ...`
- 避免在 skill 內文中重新記錄整個 infer 介面

典型以 infer 為核心的 skill 涵蓋範圍：

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## 為什麼使用 infer

`openclaw infer` 為 OpenClaw 內由提供者支援的推論任務提供一致的 CLI。

優點：

- 使用已在 OpenClaw 中設定的提供者和模型，而不是為每個後端串接一次性的包裝器。
- 將模型、影像、音訊轉錄、TTS、影片、Web 和嵌入工作流程保留在同一個命令樹下。
- 對腳本、自動化和代理驅動工作流程使用穩定的 `--json` 輸出形狀。
- 當任務本質上是「執行推論」時，偏好使用 OpenClaw 第一方介面。
- 對大多數 infer 命令使用一般本機路徑，而不需要 Gateway。

對於端到端提供者檢查，建議在較低層級的提供者測試通過後使用 `openclaw infer ...`。它會在提出提供者請求之前，演練已發布的 CLI、設定載入、預設代理解析、內建 Plugin 啟用，以及共享能力執行階段。

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

| 任務                         | 命令                                                                                       | 備註                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 執行文字/模型提示      | `openclaw infer model run --prompt "..." --json`                                              | 預設使用一般本機路徑                 |
| 在影像上執行模型提示 | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 對多個影像輸入重複使用 `--file`             |
| 產生影像            | `openclaw infer image generate --prompt "..." --json`                                         | 從現有檔案開始時使用 `image edit`  |
| 描述影像檔案       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` 必須是具備影像能力的 `<provider/model>` |
| 轉錄音訊             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` 必須是 `<provider/model>`                  |
| 合成語音            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` 以 Gateway 為導向                      |
| 產生影片             | `openclaw infer video generate --prompt "..." --json`                                         | 支援提供者提示，例如 `--resolution`        |
| 描述影片檔案        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` 必須是 `<provider/model>`                  |
| 搜尋 Web               | `openclaw infer web search --query "..." --json`                                              |                                                       |
| 擷取 Web 頁面             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| 建立嵌入            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## 行為

- `openclaw infer ...` 是這些工作流程的主要 CLI 介面。
- 當輸出會由另一個命令或腳本取用時，請使用 `--json`。
- 當需要特定後端時，請使用 `--provider` 或 `--model provider/model`。
- 使用 `model run --thinking <level>` 傳遞一次性的思考/推理層級（`off`、`minimal`、`low`、`medium`、`high`、`adaptive`、`xhigh` 或 `max`），同時保持執行為原始模式。
- 對於 `image describe`、`audio transcribe` 和 `video describe`，`--model` 必須使用 `<provider/model>` 形式。
- 對於 `image describe`，明確的 `--model` 會直接執行該提供者/模型。模型必須在模型目錄或提供者設定中具備影像能力。`codex/<model>` 會執行有界限的 Codex 應用伺服器影像理解回合；`openai-codex/<model>` 則使用 OpenAI Codex OAuth 提供者路徑。
- 無狀態執行命令預設為本機。
- Gateway 管理狀態的命令預設為 Gateway。
- 一般本機路徑不需要 Gateway 執行中。
- 本機 `model run` 是精簡的一次性提供者補全。它會解析已設定的代理模型和驗證，但不會啟動聊天代理回合、載入工具，或開啟內建 MCP 伺服器。
- `model run --file` 接受影像檔案、偵測其 MIME 類型，並將它們連同提供的提示傳送給所選模型。對多張影像重複使用 `--file`。
- `model run --file` 會拒絕非影像輸入。音訊檔案請使用 `infer audio transcribe`，影片檔案請使用 `infer video describe`。
- `model run --gateway` 會演練 Gateway 路由、已儲存驗證、提供者選擇和嵌入式執行階段，但仍以原始模型探測方式執行：它會傳送提供的提示和任何影像附件，而不包含先前的工作階段逐字稿、bootstrap/AGENTS 脈絡、context-engine 組裝、工具，或內建 MCP 伺服器。
- `model run --gateway --model <provider/model>` 需要受信任操作者的 Gateway 憑證，因為該請求要求 Gateway 執行一次性的提供者/模型覆寫。
- 本機 `model run --thinking` 使用精簡的提供者補全路徑；像 `adaptive` 和 `max` 這類提供者特定層級，會對應到最接近的可攜式簡易補全層級。

## 模型

使用 `model` 進行由提供者支援的文字推論，以及模型/提供者檢查。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

使用完整 `<provider/model>` 參照來 smoke-test 特定提供者，而不啟動 Gateway 或載入完整代理工具介面：

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

備註：

- 本機 `model run` 是最窄的提供者/模型/驗證健康狀態 CLI smoke，因為對非 Codex 提供者而言，它只會將提供的提示傳送給所選模型。
- 本機 `model run --model <provider/model>` 可在該提供者寫入設定之前，使用來自 `models list --all` 的精確內建靜態目錄列。仍然需要提供者驗證；缺少憑證會以驗證錯誤失敗，而不是 `Unknown model`。
- 對於 Mistral Medium 3.5 推理探測，請不要設定 temperature/使用預設值。Mistral 會拒絕 `reasoning_effort="high"` 加上 `temperature: 0`；請使用預設 temperature 的 `mistral/mistral-medium-3-5`，或非零的推理模式值，例如 `0.7`。
- `openai-codex/*` 本機探測是狹窄的例外：OpenClaw 會加入最小系統指令，讓 Codex Responses 傳輸可填入其必要的 `instructions` 欄位，而不加入完整代理脈絡、工具、記憶或工作階段逐字稿。
- 本機 `model run --file` 保持該精簡路徑，並將影像內容直接附加到單一使用者訊息。當 MIME 類型偵測為 `image/*` 時，PNG、JPEG 和 WebP 等常見影像檔案可正常運作；不支援或無法識別的檔案會在呼叫提供者之前失敗。
- 當你想直接測試所選多模態文字模型時，`model run --file` 最適合。當你想使用 OpenClaw 的影像理解提供者選擇和預設影像模型路由時，請使用 `infer image describe`。
- 所選模型必須支援影像輸入；純文字模型可能會在提供者層拒絕請求。
- `model run --prompt` 必須包含非空白文字；空提示會在呼叫本機提供者或 Gateway 之前遭到拒絕。
- 當提供者未傳回文字輸出時，本機 `model run` 會以非零狀態結束，因此無法連線的本機提供者和空補全不會看起來像成功的探測。
- 當你需要測試 Gateway 路由、代理執行階段設定，或 Gateway 管理的提供者狀態，同時保持模型輸入為原始狀態時，請使用 `model run --gateway`。當你想要完整代理脈絡、工具、記憶和工作階段逐字稿時，請使用 `openclaw agent` 或聊天介面。
- `model auth login`、`model auth logout` 和 `model auth status` 會管理已儲存的提供者驗證狀態。

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

注意事項：

- 從既有輸入檔案開始時，請使用 `image edit`。
- 對於支援參考圖片編輯幾何提示的提供者/模型，請搭配 `image edit` 使用 `--size`、`--aspect-ratio` 或 `--resolution`。
- 搭配 `--model openai/gpt-image-1.5` 使用 `--output-format png --background transparent`，可產生透明背景的 OpenAI PNG 輸出；`--openai-background` 仍可作為 OpenAI 專用別名使用。未宣告支援背景的提供者會將該提示回報為已忽略的覆寫。
- 使用 `image providers --json` 驗證哪些內建圖片提供者可探索、已設定、已選取，以及每個提供者公開哪些生成/編輯能力。
- 使用 `image generate --model <provider/model> --json` 作為圖片生成變更最窄範圍的即時 CLI 冒煙測試。範例：

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON 回應會回報 `ok`、`provider`、`model`、`attempts` 和已寫入的輸出路徑。設定 `--output` 時，最終副檔名可能會依照提供者回傳的 MIME 類型。

- 對於 `image describe` 和 `image describe-many`，使用 `--prompt` 給視覺模型任務專屬指示，例如 OCR、比較、UI 檢查或精簡圖說。
- 搭配速度較慢的本機視覺模型或冷啟動的 Ollama 使用 `--timeout-ms`。
- 對於 `image describe`，`--model` 必須是具備圖片能力的 `<provider/model>`。
- 對於本機 Ollama 視覺模型，請先拉取模型，並將 `OLLAMA_API_KEY` 設為任意預留位置值，例如 `ollama-local`。請參閱 [Ollama](/zh-TW/providers/ollama#vision-and-image-description)。

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

使用 `tts` 進行語音合成和 TTS 提供者狀態檢查。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

注意事項：

- `tts status` 預設使用 Gateway，因為它反映由 Gateway 管理的 TTS 狀態。
- 使用 `tts providers`、`tts voices` 和 `tts set-provider` 檢查與設定 TTS 行為。

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

Infer 命令會將 JSON 輸出正規化到共用封套中：

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

對於生成媒體命令，`outputs` 包含 OpenClaw 寫入的檔案。請使用該陣列中的 `path`、`mimeType`、`size` 和任何媒體專屬尺寸進行自動化，而不是剖析供人閱讀的 stdout。

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
