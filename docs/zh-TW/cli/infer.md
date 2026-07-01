---
read_when:
    - 新增或修改 `openclaw infer` 命令
    - 設計穩定的無頭能力自動化
summary: 推論優先的命令列介面，用於由提供者支援的模型、影像、音訊、TTS、影片、網頁與嵌入工作流程
title: 推論命令列介面
x-i18n:
    generated_at: "2026-07-01T05:28:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb63996dd1364bffba58d4b132849ac4157fb612555c009da795c963142f9368
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` 是提供者支援推論工作流程的標準無頭介面。

它刻意公開能力家族，而不是原始閘道 RPC 名稱，也不是原始代理工具 ID。

## 將 infer 轉換成技能

將這段複製並貼給代理：

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

良好的 infer 型技能應該：

- 將常見使用者意圖對應到正確的 infer 子命令
- 包含幾個其涵蓋工作流程的標準 infer 範例
- 在範例與建議中偏好使用 `openclaw infer ...`
- 避免在技能本文內重新記錄整個 infer 介面

典型的 infer 重點技能涵蓋範圍：

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## 為什麼使用 infer

`openclaw infer` 為 OpenClaw 內由提供者支援的推論工作提供一致的命令列介面。

優點：

- 使用已在 OpenClaw 中設定的提供者與模型，而不是為每個後端接上一組一次性包裝器。
- 將模型、圖片、音訊轉錄、TTS、影片、網頁與嵌入工作流程放在同一個命令樹下。
- 為指令碼、自動化與代理驅動的工作流程使用穩定的 `--json` 輸出形狀。
- 當任務本質上是「執行推論」時，偏好使用 OpenClaw 第一方介面。
- 對多數 infer 命令使用一般本機路徑，不需要閘道。

對於端到端提供者檢查，請在較低層級的
提供者測試通過後，偏好使用 `openclaw infer ...`。它會在提出提供者請求前，
演練已出貨的命令列介面、設定載入、
預設代理解析、內建外掛啟用，以及共享能力
執行階段。

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

此表格將常見推論任務對應到相應的 infer 命令。

| 任務                          | 命令                                                                                       | 備註                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 執行文字/模型提示       | `openclaw infer model run --prompt "..." --json`                                              | 預設使用一般本機路徑                 |
| 對圖片執行模型提示  | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 對多個圖片輸入重複使用 `--file`             |
| 產生圖片             | `openclaw infer image generate --prompt "..." --json`                                         | 從現有檔案開始時使用 `image edit`  |
| 描述圖片檔案或 URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` 必須是具備圖片能力的 `<provider/model>` |
| 轉錄音訊              | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` 必須是 `<provider/model>`                  |
| 合成語音             | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` 以閘道為導向                      |
| 產生影片              | `openclaw infer video generate --prompt "..." --json`                                         | 支援提供者提示，例如 `--resolution`        |
| 描述影片檔案         | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` 必須是 `<provider/model>`                  |
| 搜尋網頁                | `openclaw infer web search --query "..." --json`                                              |                                                       |
| 擷取網頁              | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| 建立嵌入             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## 行為

- `openclaw infer ...` 是這些工作流程的主要命令列介面。
- 當輸出會被另一個命令或指令碼消費時，請使用 `--json`。
- 當需要特定後端時，請使用 `--provider` 或 `--model provider/model`。
- 使用 `model run --thinking <level>` 傳遞一次性的思考/推理層級（`off`、`minimal`、`low`、`medium`、`high`、`adaptive`、`xhigh` 或 `max`），同時保持執行為原始模式。
- 對於 `image describe`、`audio transcribe` 和 `video describe`，`--model` 必須使用 `<provider/model>` 形式。
- 對於 `image describe`，`--file` 接受本機路徑與 HTTP(S) 圖片 URL。遠端 URL 使用一般媒體擷取 SSRF 政策。
- 對於 `image describe`，明確的 `--model` 會先執行該提供者/模型，然後在模型呼叫失敗時嘗試已設定的 `agents.defaults.imageModel.fallbacks`。輸入準備錯誤，例如缺少檔案或不支援的 URL，會在嘗試備援前失敗。該模型必須在模型目錄或提供者設定中具備圖片能力。`codex/<model>` 會執行受限的 Codex 應用程式伺服器圖片理解回合；`openai/<model>` 使用 OpenAI 提供者路徑，並採用 API 金鑰或 ChatGPT/Codex OAuth 驗證。
- 無狀態執行命令預設為本機。
- 閘道管理的狀態命令預設為閘道。
- 一般本機路徑不需要閘道正在執行。
- 本機 `model run` 是精簡的一次性提供者補全。它會解析已設定的代理模型與驗證，但不會啟動聊天代理回合、載入工具，或開啟內建 MCP 伺服器。
- `model run --file` 接受圖片檔案、偵測其 MIME 類型，並將其連同提供的提示傳送到選定模型。對多張圖片重複使用 `--file`。
- `model run --file` 會拒絕非圖片輸入。音訊檔案請使用 `infer audio transcribe`，影片檔案請使用 `infer video describe`。
- `model run --gateway` 會演練閘道路由、已儲存驗證、提供者選擇與嵌入式執行階段，但仍以原始模型探測方式執行：它會傳送提供的提示與任何圖片附件，不包含先前的工作階段逐字稿、bootstrap/AGENTS 情境、情境引擎組裝、工具或內建 MCP 伺服器。
- `model run --gateway --model <provider/model>` 需要可信任的操作者閘道憑證，因為該請求要求閘道執行一次性的提供者/模型覆寫。
- 本機 `model run --thinking` 使用精簡的提供者補全路徑；提供者專屬層級（例如 `adaptive` 和 `max`）會對應到最接近的可攜簡單補全層級。

## 模型

使用 `model` 進行提供者支援的文字推論與模型/提供者檢查。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

使用完整 `<provider/model>` 參照來煙霧測試特定提供者，而不需
啟動閘道或載入完整代理工具介面：

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

備註：

- 本機 `model run` 是提供者/模型/驗證健康狀態最窄的命令列介面煙霧測試，因為對於非 Codex 提供者，它只會將提供的提示傳送給選定模型。
- 本機 `model run --model <provider/model>` 可在該提供者寫入設定前，使用 `models list --all` 中精確的內建靜態目錄列。仍然需要提供者驗證；缺少憑證會以驗證錯誤失敗，而不是 `Unknown model`。
- 對於 Mistral Medium 3.5 推理探測，請讓 temperature 保持未設定/預設。Mistral 會拒絕 `reasoning_effort="high"` 加上 `temperature: 0`；請使用預設 temperature 的 `mistral/mistral-medium-3-5`，或使用非零推理模式值，例如 `0.7`。
- Codex Responses 本機探測是少數例外：OpenClaw 會加入最小系統指示，讓傳輸層可以填入其必要的 `instructions` 欄位，而不加入完整代理情境、工具、記憶或工作階段逐字稿。
- 本機 `model run --file` 保持該精簡路徑，並將圖片內容直接附加到單一使用者訊息。當 PNG、JPEG 和 WebP 等常見圖片檔案的 MIME 類型被偵測為 `image/*` 時即可使用；不支援或無法辨識的檔案會在呼叫提供者前失敗。
- 當你想直接測試選定的多模態文字模型時，`model run --file` 最合適。當你想使用 OpenClaw 的圖片理解提供者選擇與預設圖片模型路由時，請使用 `infer image describe`。
- 選定模型必須支援圖片輸入；純文字模型可能會在提供者層拒絕該請求。
- `model run --prompt` 必須包含非空白文字；空提示會在呼叫本機提供者或閘道前被拒絕。
- 當提供者未回傳文字輸出時，本機 `model run` 會以非零狀態結束，因此無法連線的本機提供者與空補全不會看起來像成功探測。
- 當你需要測試閘道路由、代理執行階段設定或閘道管理的提供者狀態，同時保持模型輸入為原始內容時，請使用 `model run --gateway`。當你想要完整代理情境、工具、記憶與工作階段逐字稿時，請使用 `openclaw agent` 或聊天介面。
- `model auth login`、`model auth logout` 和 `model auth status` 會管理已儲存的提供者驗證狀態。

## 圖片

使用 `image` 進行產生、編輯與描述。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

注意事項：

- 從既有輸入檔案開始時，請使用 `image edit`。
- 對於支援參考圖片編輯幾何提示的供應商/模型，請搭配 `image edit` 使用 `--size`、`--aspect-ratio` 或 `--resolution`。
- 若要輸出透明背景的 OpenAI PNG，請搭配 `--model openai/gpt-image-1.5` 使用 `--output-format png --background transparent`；`--openai-background` 仍可作為 OpenAI 專用別名使用。未宣告支援背景的供應商會將該提示回報為已忽略的覆寫。
- 對於支援圖片品質提示的供應商（包含 OpenAI），請使用 `--quality low|medium|high|auto`。OpenAI 也接受 `--openai-moderation low|auto` 作為供應商專用的審核提示。
- 使用 `image providers --json` 驗證哪些內建圖片供應商可被發現、已設定、已選取，以及每個供應商公開哪些生成/編輯能力。
- 使用 `image generate --model <provider/model> --json` 作為圖片生成變更最窄範圍的即時命令列介面煙霧測試。例如：

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON 回應會回報 `ok`、`provider`、`model`、`attempts` 與已寫入的輸出路徑。設定 `--output` 時，最終副檔名可能會依照供應商傳回的 MIME 類型。

- 對於 `image describe` 與 `image describe-many`，請使用 `--prompt` 給視覺模型任務專用指令，例如 OCR、比較、UI 檢查或精簡說明文字。
- 對於較慢的本機視覺模型或冷啟動的 Ollama，請使用 `--timeout-ms`。
- 對於 `image describe`，`--model` 必須是具備圖片能力的 `<provider/model>`。設定時，OpenClaw 會先嘗試該明確模型，若模型呼叫失敗，則再嘗試已設定的圖片模型備援。
- 對於本機 Ollama 視覺模型，請先拉取模型，並將 `OLLAMA_API_KEY` 設為任意佔位值，例如 `ollama-local`。請參閱 [Ollama](/zh-TW/providers/ollama#vision-and-image-description)。

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

使用 `tts` 進行語音合成與 TTS 供應商狀態檢查。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

注意事項：

- `tts status` 預設使用閘道，因為它反映由閘道管理的 TTS 狀態。
- 使用 `tts providers`、`tts voices` 與 `tts set-provider` 來檢查並設定 TTS 行為。

## 影片

使用 `video` 進行生成與描述。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

注意事項：

- `video generate` 接受 `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark` 與 `--timeout-ms`，並將它們轉送至影片生成執行階段。
- 對於 `video describe`，`--model` 必須是 `<provider/model>`。

## Web

使用 `web` 進行搜尋與擷取工作流程。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

注意事項：

- 使用 `web providers` 檢查可用、已設定與已選取的供應商。

## 嵌入

使用 `embedding` 進行向量建立與嵌入供應商檢查。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 輸出

Infer 命令會將 JSON 輸出正規化到共用封套下：

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

對於生成媒體命令，`outputs` 會包含 OpenClaw 寫入的檔案。進行自動化時，請使用該陣列中的 `path`、`mimeType`、`size` 以及任何媒體專用尺寸，而不是解析人類可讀的 stdout。

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

- [命令列介面參考](/zh-TW/cli)
- [模型](/zh-TW/concepts/models)
