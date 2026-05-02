---
read_when:
    - 新增或修改 `openclaw infer` 命令
    - 設計穩定的無頭能力自動化
summary: 推論優先的 CLI，適用於由提供者支援的模型、影像、音訊、TTS、影片、網頁與嵌入工作流程
title: 推論 CLI
x-i18n:
    generated_at: "2026-05-02T02:46:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 04f8b4aeb70e960835612eedcc0a22202957803ca4e5eeb3f1e107e8c736e458
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` 是 provider 支援的推論工作流程的標準無介面執行介面。

它刻意公開能力家族，而不是原始 Gateway RPC 名稱，也不是原始 agent 工具 ID。

## 將 infer 轉換成 skill

將以下內容複製並貼到 agent：

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

好的 infer 型 skill 應該：

- 將常見使用者意圖對應到正確的 infer 子命令
- 為它涵蓋的工作流程包含幾個標準 infer 範例
- 在範例與建議中優先使用 `openclaw infer ...`
- 避免在 skill 內容中重新記錄整個 infer 介面

典型的 infer 重點 skill 涵蓋範圍：

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## 為什麼使用 infer

`openclaw infer` 為 OpenClaw 內 provider 支援的推論工作提供一致的 CLI。

優點：

- 使用 OpenClaw 中已設定的 providers 和模型，而不是為每個後端串接一次性的包裝器。
- 將模型、影像、音訊轉錄、TTS、影片、網頁與 embedding 工作流程維持在同一個命令樹下。
- 為 scripts、自動化與 agent 驅動的工作流程使用穩定的 `--json` 輸出形狀。
- 當任務本質上是「執行推論」時，優先使用第一方 OpenClaw 介面。
- 對大多數 infer 命令使用一般本機路徑，而不需要 Gateway。

對於端對端 provider 檢查，在較低層級的 provider 測試通過後，優先使用 `openclaw infer ...`。它會在發出 provider 請求前，演練已發布的 CLI、設定載入、預設 agent 解析、內建 Plugin 啟用，以及共用能力執行階段。

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

| 任務                         | 命令                                                                                          | 備註                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 執行文字/模型提示            | `openclaw infer model run --prompt "..." --json`                                              | 預設使用一般本機路徑                                  |
| 對影像執行模型提示           | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 對多個影像輸入重複使用 `--file`                       |
| 產生影像                     | `openclaw infer image generate --prompt "..." --json`                                         | 從現有檔案開始時使用 `image edit`                     |
| 描述影像檔案                 | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` 必須是支援影像的 `<provider/model>`         |
| 轉錄音訊                     | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` 必須是 `<provider/model>`                   |
| 合成語音                     | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` 以 Gateway 為導向                        |
| 產生影片                     | `openclaw infer video generate --prompt "..." --json`                                         | 支援 provider 提示，例如 `--resolution`               |
| 描述影片檔案                 | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` 必須是 `<provider/model>`                   |
| 搜尋網頁                     | `openclaw infer web search --query "..." --json`                                              |                                                       |
| 擷取網頁                     | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| 建立 embeddings              | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## 行為

- `openclaw infer ...` 是這些工作流程的主要 CLI 介面。
- 當輸出會被另一個命令或 script 消耗時，使用 `--json`。
- 當需要特定後端時，使用 `--provider` 或 `--model provider/model`。
- 對於 `image describe`、`audio transcribe` 和 `video describe`，`--model` 必須使用 `<provider/model>` 形式。
- 對於 `image describe`，明確的 `--model` 會直接執行該 provider/model。模型必須在模型目錄或 provider 設定中具備影像能力。`codex/<model>` 會執行有界的 Codex app-server 影像理解回合；`openai-codex/<model>` 使用 OpenAI Codex OAuth provider 路徑。
- 無狀態執行命令預設為本機。
- Gateway 管理狀態的命令預設為 Gateway。
- 一般本機路徑不需要 Gateway 執行中。
- 本機 `model run` 是精簡的一次性 provider completion。它會解析已設定的 agent 模型與驗證，但不會啟動 chat-agent 回合、載入工具，或開啟內建 MCP servers。
- `model run --file` 接受影像檔案、偵測其 MIME 類型，並將它們與提供的提示一起傳送到所選模型。對多張影像重複使用 `--file`。
- `model run --file` 會拒絕非影像輸入。音訊檔案使用 `infer audio transcribe`，影片檔案使用 `infer video describe`。
- `model run --gateway` 會演練 Gateway 路由、已儲存驗證、provider 選擇與嵌入式執行階段，但仍作為原始模型探測執行：它會傳送提供的提示與任何影像附件，不包含先前的 session transcript、bootstrap/AGENTS 內容、context-engine 組裝、工具或內建 MCP servers。
- `model run --gateway --model <provider/model>` 需要受信任的 operator Gateway credential，因為請求要求 Gateway 執行一次性 provider/model 覆寫。

## 模型

使用 `model` 進行 provider 支援的文字推論與模型/provider 檢查。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

使用完整 `<provider/model>` refs 來 smoke-test 特定 provider，而不啟動 Gateway 或載入完整 agent 工具介面：

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

- 本機 `model run` 是 provider/model/auth 健康狀態最窄範圍的 CLI smoke，因為它只會將提供的提示傳送到所選模型。
- 本機 `model run --file` 保持該精簡路徑，並將影像內容直接附加到單一使用者訊息。當 MIME 類型被偵測為 `image/*` 時，PNG、JPEG 和 WebP 等常見影像檔案可以運作；不支援或無法識別的檔案會在呼叫 provider 前失敗。
- 當你想直接測試所選多模態文字模型時，`model run --file` 最合適。當你想使用 OpenClaw 的影像理解 provider 選擇與預設影像模型路由時，使用 `infer image describe`。
- 所選模型必須支援影像輸入；純文字模型可能會在 provider 層拒絕請求。
- `model run --prompt` 必須包含非空白文字；空提示會在呼叫本機 providers 或 Gateway 前被拒絕。
- 當 provider 沒有回傳文字輸出時，本機 `model run` 會以非零狀態結束，因此無法連線的本機 providers 和空 completions 不會看起來像成功的 probes。
- 當你需要測試 Gateway 路由、agent-runtime 設定或 Gateway 管理的 provider 狀態，同時保持模型輸入為原始形式時，使用 `model run --gateway`。當你想要完整 agent 內容、工具、記憶體和 session transcript 時，使用 `openclaw agent` 或聊天介面。
- `model auth login`、`model auth logout` 和 `model auth status` 管理已儲存的 provider 驗證狀態。

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

- 從現有輸入檔案開始時，使用 `image edit`。
- 對於支援 reference-image 編輯幾何提示的 providers/models，搭配 `image edit` 使用 `--size`、`--aspect-ratio` 或 `--resolution`。
- 對透明背景 OpenAI PNG 輸出，搭配 `--model openai/gpt-image-1.5` 使用 `--output-format png --background transparent`；`--openai-background` 仍可作為 OpenAI 專用別名使用。不宣告背景支援的 providers 會將該提示回報為被忽略的覆寫。
- 使用 `image providers --json` 驗證哪些內建影像 providers 可被探索、已設定、已選取，以及每個 provider 公開哪些產生/編輯能力。
- 使用 `image generate --model <provider/model> --json` 作為影像產生變更最窄範圍的 live CLI smoke。範例：

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON 回應會回報 `ok`、`provider`、`model`、`attempts` 和已寫入的
  輸出路徑。設定 `--output` 時，最終副檔名可能會依照
  供應商傳回的 MIME 類型。

- 對於 `image describe` 和 `image describe-many`，使用 `--prompt` 為視覺模型提供特定工作的指令，例如 OCR、比較、UI 檢查或簡短圖說。
- 對於速度較慢的本機視覺模型或冷啟動的 Ollama，請使用 `--timeout-ms`。
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

- `audio transcribe` 用於檔案轉錄，而不是即時工作階段管理。
- `--model` 必須是 `<provider/model>`。

## TTS

使用 `tts` 進行語音合成和 TTS 供應商狀態查詢。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

注意事項：

- `tts status` 預設使用 Gateway，因為它反映由 Gateway 管理的 TTS 狀態。
- 使用 `tts providers`、`tts voices` 和 `tts set-provider` 來檢查和設定 TTS 行為。

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

## Web

使用 `web` 進行搜尋和擷取工作流程。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

注意事項：

- 使用 `web providers` 來檢查可用、已設定和已選取的供應商。

## 嵌入

使用 `embedding` 建立向量並檢查嵌入供應商。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 輸出

Infer 命令會將 JSON 輸出正規化為共用封套：

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

對於生成媒體的命令，`outputs` 包含 OpenClaw 寫入的檔案。自動化時，請使用
該陣列中的 `path`、`mimeType`、`size` 和任何媒體特定的尺寸，
而不是剖析供人閱讀的 stdout。

## 常見問題

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

- [CLI reference](/zh-TW/cli)
- [Models](/zh-TW/concepts/models)
