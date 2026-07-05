---
read_when:
    - 新增或修改 `openclaw infer` 命令
    - 設計穩定的無頭能力自動化
summary: 推理優先的命令列介面，適用於由供應商支援的模型、影像、音訊、TTS、影片、網頁與嵌入工作流程
title: 推論命令列介面
x-i18n:
    generated_at: "2026-07-05T11:11:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d2835d278be996aa1ae536ae7c2a4e8b2b093ba22e06358574e0180772d9b6e
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` 是由提供者支援推論的標準無頭介面。它公開的是能力系列（`model`、`image`、`audio`、`tts`、`video`、`web`、`embedding`），而不是原始閘道 RPC 名稱或代理工具 ID。`openclaw capability ...` 是相同命令樹的別名。

相較於一次性的提供者包裝器，偏好使用它的原因：

- 重複使用已在 OpenClaw 中設定的提供者和模型。
- 為指令碼和代理驅動的自動化提供穩定的 `--json` 封套（請參閱 [JSON 輸出](#json-output)）。
- 多數子命令會執行正常的本機路徑，而不經過閘道。
- 對於端對端提供者檢查，它會先演練已發布的命令列介面、設定載入、預設代理解析、內建外掛啟用，以及共用能力執行階段，才送出提供者請求。

## 將 infer 變成技能

將這段複製並貼給代理：

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

一個好的 infer 型技能會將常見使用者意圖對應到正確的子命令，為每個工作流程包含幾個標準範例，偏好使用 `openclaw infer ...` 而不是較低階的替代方案，並且不會在技能本文中重新記錄整個 infer 介面。

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
    personas
    status
    enable
    disable
    set-provider
    set-persona

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

`infer list` / `infer inspect --name <capability>` 會以資料形式顯示這棵樹（能力 ID、傳輸、描述）。

## 常見工作

| 工作                          | 命令                                                                                       | 注意事項                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 執行文字/模型提示       | `openclaw infer model run --prompt "..." --json`                                              | 預設為本機                                      |
| 對圖片執行模型提示  | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 多張圖片可重複使用 `--file`                   |
| 產生圖片             | `openclaw infer image generate --prompt "..." --json`                                         | 從現有檔案開始時使用 `image edit`  |
| 描述圖片檔案或 URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` 必須是支援圖片的 `<provider/model>` |
| 轉錄音訊              | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` 必須是 `<provider/model>`                  |
| 合成語音             | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` 只會透過閘道執行            |
| 產生影片              | `openclaw infer video generate --prompt "..." --json`                                         | 支援如 `--resolution` 等提供者提示        |
| 描述影片檔案         | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` 必須是 `<provider/model>`                  |
| 搜尋網頁                | `openclaw infer web search --query "..." --json`                                              |                                                       |
| 擷取網頁              | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| 建立嵌入             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## 行為

- 當輸出會餵給另一個命令或指令碼時使用 `--json`；否則使用文字輸出。
- 使用 `--provider` 或 `--model provider/model` 來固定特定後端。
- 使用 `model run --thinking <level>` 進行一次性的思考/推理覆寫：`off`、`minimal`、`low`、`medium`、`high`、`adaptive`、`xhigh` 或 `max`。
- 對於 `image describe`、`audio transcribe` 和 `video describe`，`--model` 必須使用 `<provider/model>` 形式。
- 對於 `image describe`，`--file` 接受本機路徑和 HTTP(S) URL；遠端 URL 會通過正常的媒體擷取 SSRF 政策。
- 無狀態執行命令（`model run`、`image *`、`audio *`、`video *`、`web *`、`embedding *`）預設為本機。由閘道管理狀態的命令（`tts status`）預設使用閘道。
- 本機路徑永遠不需要閘道正在執行。
- 本機 `model run` 是精簡的一次性提供者補全：它會解析已設定的代理模型和驗證，但不會啟動聊天代理回合、載入工具，或開啟內建 MCP 伺服器。
- `model run --file` 會將圖片檔案（自動偵測 MIME 類型）附加到提示；多張圖片可重複使用 `--file`。非圖片檔案會被拒絕 — 請改用 `infer audio transcribe` 或 `infer video describe`。
- `model run --gateway` 會演練閘道路由、已儲存的驗證、提供者選擇，以及嵌入式執行階段，但仍維持原始模型探測：沒有先前的工作階段逐字稿、bootstrap/AGENTS 內容、工具或內建 MCP 伺服器。
- `model run --gateway --model <provider/model>` 需要受信任操作者的閘道憑證，因為它要求閘道執行一次性的提供者/模型覆寫。

## 模型

文字推論與模型/提供者檢查。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.5 --json
```

搭配 `--local` 使用完整的 `<provider/model>` 參照，即可在不啟動閘道或載入代理工具介面的情況下，對單一提供者進行煙霧測試：

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

注意事項：

- 本機 `model run` 是提供者/模型/驗證健康狀態最窄範圍的命令列介面煙霧測試：對於非 ChatGPT-Codex 提供者，它只會送出提供的提示。
- 本機 `model run --model <provider/model>` 可以在該提供者寫入設定之前，解析精確的內建靜態目錄列（也就是 `openclaw models list --all` 顯示的相同列）。仍然需要提供者驗證；缺少憑證會以驗證錯誤失敗，而不是 `Unknown model`。
- 對於 Mistral Medium 3.5 推理探測，請將 temperature 保持未設定/預設。Mistral 會拒絕 `reasoning_effort="high"` 搭配 `temperature: 0`；請使用預設 temperature，或如 `0.7` 的非零值。
- OpenAI ChatGPT/Codex OAuth（`openai-chatgpt-responses` API）本機探測會加入最小系統指示，讓傳輸可以填入其必要的 `instructions` 欄位 — 不含完整代理內容、工具、記憶或工作階段逐字稿。
- `model run --file` 會將圖片內容直接附加到單一使用者訊息。當 MIME 類型偵測為 `image/*` 時，常見格式（PNG、JPEG、WebP）可運作；不支援或無法辨識的檔案會在呼叫提供者前失敗。當你想要 OpenClaw 的圖片模型路由和備援，而不是直接的多模態模型探測時，請改用 `infer image describe`。
- 所選模型必須支援圖片輸入；純文字模型可能會在提供者層拒絕請求。
- `model run --prompt` 必須包含非空白文字；空提示會在任何提供者或閘道呼叫前遭到拒絕。
- 當提供者沒有回傳文字輸出時，本機 `model run` 會以非零代碼結束，因此無法連線的提供者和空補全不會看起來像成功探測。
- 使用 `model run --gateway` 測試閘道路由或代理執行階段設定，同時保持模型輸入為原始形式。若要取得完整代理內容、工具、記憶和工作階段逐字稿，請使用 `openclaw agent` 或聊天介面。
- `--thinking adaptive` 會對應到補全執行階段層級 `medium`；對於支援原生最大 effort 的 OpenAI 模型，`--thinking max` 會對應到 `max`，否則對應到 `xhigh`。
- `model auth login`、`model auth logout` 和 `model auth status` 會管理已儲存的提供者驗證狀態。

## 圖片

產生、編輯與描述。

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

- 從現有輸入檔案開始時，請使用 `image edit`；`--size`、`--aspect-ratio` 或 `--resolution` 會在支援它們的供應商/模型上加入幾何提示。
- `--output-format png --background transparent` 搭配 `--model openai/gpt-image-1.5` 會產生透明背景的 OpenAI PNG 輸出；`--openai-background` 是同一提示的 OpenAI 專用別名。未宣告背景支援的供應商會將其回報為被忽略的覆寫（請參閱 [JSON 信封](#json-output)中的 `ignoredOverrides`）。
- `--quality low|medium|high|auto` 適用於支援影像品質提示的供應商，包括 OpenAI。OpenAI 也接受 `--openai-moderation low|auto`。
- `image providers --json` 會列出哪些內建影像供應商可被探索、已設定、已選取，以及各自公開哪些生成/編輯能力。
- `image generate --model <provider/model> --json` 是影像生成變更最窄的即時冒煙測試：

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  回應會回報 `ok`、`provider`、`model`、`attempts`，以及寫入的輸出路徑。設定 `--output` 時，最終副檔名可能會依照供應商傳回的 MIME 類型而定。

- 對於 `image describe` 和 `image describe-many`，請使用 `--prompt` 提供任務專用指令（OCR、比較、使用者介面檢查、精簡圖說）。
- 對於較慢的本機視覺模型或冷啟動的 Ollama，請使用 `--timeout-ms`。
- 對於 `image describe`，明確的 `--model`（必須是具影像能力的 `<provider/model>`）會先執行，若該呼叫失敗，再嘗試已設定的 `agents.defaults.imageModel.fallbacks`。輸入準備錯誤（缺少檔案、不支援的 URL）會在任何後援嘗試前失敗，且模型必須在模型目錄或供應商設定中具備影像能力。
- 對於本機 Ollama 視覺模型，請先拉取模型，並將 `OLLAMA_API_KEY` 設為任意佔位值，例如 `ollama-local`。請參閱 [Ollama](/zh-TW/providers/ollama#vision-and-image-description)。

## 音訊

檔案轉錄（非即時工作階段管理）。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` 必須是 `<provider/model>`。

## TTS

語音合成與 TTS 供應商/角色狀態。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

注意事項：

- `tts status` 僅支援 `--gateway`（它反映由閘道管理的 TTS 狀態）。
- 使用 `tts providers`、`tts voices`、`tts personas`、`tts set-provider` 和 `tts set-persona` 來檢查與設定 TTS 行為。

## 影片

生成與描述。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

注意事項：

- `video generate` 接受 `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark` 和 `--timeout-ms`，並轉送至影片生成執行階段。
- 對於 `video describe`，`--model` 必須是 `<provider/model>`。

## 網頁

搜尋與擷取。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` 會列出搜尋與擷取可用、已設定和已選取的供應商。

## 嵌入

向量建立與嵌入供應商檢查。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 輸出

推論命令會在共用信封下正規化 JSON 輸出：

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

穩定的頂層欄位：

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs`（隨請求傳送的影像附件，適用時）
- `outputs`
- `ignoredOverrides`（供應商不支援的提示鍵，適用時）
- `error`

對於生成媒體命令，`outputs` 包含 OpenClaw 寫入的檔案。自動化時，請使用該陣列中的 `path`、`mimeType`、`size` 以及任何媒體專用尺寸，而不是剖析供人閱讀的標準輸出。

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

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [模型](/zh-TW/concepts/models)
