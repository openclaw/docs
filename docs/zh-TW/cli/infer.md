---
read_when:
    - 新增或修改 `openclaw infer` 命令
    - 設計穩定的無頭功能自動化
summary: 推斷優先的命令列介面，適用於由供應商支援的模型、圖片、音訊、TTS、影片、網頁與嵌入工作流程
title: 推論命令列介面
x-i18n:
    generated_at: "2026-07-12T14:22:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` 是由供應商支援的推論功能之標準無介面操作介面。它公開的是能力家族（`model`、`image`、`audio`、`tts`、`video`、`web`、`embedding`），而非原始閘道 RPC 名稱或代理程式工具 ID。`openclaw capability ...` 是相同命令樹的別名。

相較於一次性的供應商包裝器，建議優先使用它，原因如下：

- 重複使用已在 OpenClaw 中設定的供應商與模型。
- 為指令碼與代理程式驅動的自動化提供穩定的 `--json` 封裝格式（請參閱 [JSON 輸出](#json-output)）。
- 大多數子命令會透過一般本機路徑執行，不經過閘道。
- 進行端對端供應商檢查時，它會在送出供應商請求前，實際執行已發布的命令列介面、設定載入、預設代理程式解析、內建外掛啟用，以及共用能力執行階段。

## 將 infer 轉換成 Skill

將以下內容複製並貼給代理程式：

```text
閱讀 https://docs.openclaw.ai/cli/infer，然後建立一個 Skill，將我的常用工作流程導向 `openclaw infer`。
聚焦於模型執行、圖片生成、影片生成、音訊轉錄、TTS、網頁搜尋和嵌入。
```

良好的 infer 型 Skill 會將常見使用者意圖對應至正確的子命令，為每個工作流程提供幾個標準範例，優先使用 `openclaw infer ...` 而非較低階的替代方案，且不會在 Skill 本文中重新記錄整個 infer 介面。

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

`infer list` / `infer inspect --name <capability>` 會以資料形式顯示此命令樹（能力 ID、傳輸方式、說明）。

## 常見工作

| 工作                          | 命令                                                                                          | 備註                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 執行文字／模型提示            | `openclaw infer model run --prompt "..." --json`                                              | 預設在本機執行                                         |
| 對圖片執行模型提示            | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 多張圖片可重複使用 `--file`                            |
| 生成圖片                      | `openclaw infer image generate --prompt "..." --json`                                         | 從現有檔案開始時請使用 `image edit`                    |
| 描述圖片檔案或 URL            | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` 必須是支援圖片的 `<provider/model>`          |
| 轉錄音訊                      | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` 必須是 `<provider/model>`                    |
| 合成語音                      | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` 只會透過閘道執行                          |
| 生成影片                      | `openclaw infer video generate --prompt "..." --json`                                         | 支援 `--resolution` 等供應商提示                       |
| 描述影片檔案                  | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` 必須是 `<provider/model>`                    |
| 搜尋網頁                      | `openclaw infer web search --query "..." --json`                                              |                                                        |
| 擷取網頁                      | `openclaw infer web fetch --url https://example.com --json`                                   |                                                        |
| 建立嵌入                      | `openclaw infer embedding create --text "..." --json`                                         |                                                        |

## 行為

- 輸出會提供給另一個命令或指令碼時使用 `--json`；其他情況使用文字輸出。
- 使用 `--provider` 或 `--model provider/model` 鎖定特定後端。
- 使用 `model run --thinking <level>` 進行單次思考／推理覆寫：`off`、`minimal`、`low`、`medium`、`high`、`adaptive`、`xhigh` 或 `max`。
- 對於 `image describe`、`audio transcribe` 和 `video describe`，`--model` 必須使用 `<provider/model>` 格式。
- 對於 `image describe`，`--file` 接受本機路徑與 HTTP(S) URL；遠端 URL 會經過一般的媒體擷取 SSRF 政策。
- 無狀態執行命令（`model run`、`image *`、`audio *`、`video *`、`web *`、`embedding *`）預設在本機執行。由閘道管理狀態的命令（`tts status`）預設透過閘道執行。
- 本機路徑絕不要求閘道正在執行。
- 本機 `model run` 是精簡的單次供應商補全：它會解析已設定的代理程式模型與驗證，但不會啟動聊天代理程式回合、載入工具或開啟內建 MCP 伺服器。
- `model run --file` 會將圖片檔案（自動偵測 MIME 類型）附加至提示；多張圖片可重複使用 `--file`。非圖片檔案會遭到拒絕——請改用 `infer audio transcribe` 或 `infer video describe`。
- `model run --gateway` 會測試閘道路由、已儲存的驗證、供應商選擇與嵌入式執行階段，但仍是原始模型探測：不包含先前的工作階段逐字稿、啟動／AGENTS 情境、工具或內建 MCP 伺服器。
- `model run --gateway --model <provider/model>` 需要受信任操作員的閘道認證資訊，因為它要求閘道執行一次性的供應商／模型覆寫。

## 模型

文字推論及模型／供應商檢查。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

搭配 `--local` 使用完整的 `<provider/model>` 參照，可在不啟動閘道或載入代理程式工具介面的情況下，對單一供應商進行冒煙測試：

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

備註：

- 本機 `model run` 是檢查供應商／模型／驗證健康狀態最精簡的命令列介面冒煙測試：對於非 ChatGPT-Codex 供應商，它只會傳送提供的提示。
- 在該供應商寫入設定之前，本機 `model run --model <provider/model>` 就能解析內建靜態目錄中的精確資料列（與 `openclaw models list --all` 顯示的資料列相同）。仍然需要供應商驗證；缺少認證資訊時會以驗證錯誤失敗，而不是 `Unknown model`。
- 對 Mistral Medium 3.5 進行推理探測時，請不要設定溫度，使用預設值。Mistral 會拒絕搭配 `temperature: 0` 的 `reasoning_effort="high"`；請使用預設溫度或 `0.7` 等非零值。
- OpenAI ChatGPT/Codex OAuth（`openai-chatgpt-responses` API）本機探測會加入最少量的系統指示，讓傳輸層可填入其必要的 `instructions` 欄位——不包含完整的代理程式情境、工具、記憶或工作階段逐字稿。
- `model run --file` 會將圖片內容直接附加至單一使用者訊息。偵測到的 MIME 類型為 `image/*` 時，常見格式（PNG、JPEG、WebP）皆可使用；不支援或無法辨識的檔案會在呼叫供應商前失敗。若你想使用 OpenClaw 的圖片模型路由與備援，而非直接探測多模態模型，請改用 `infer image describe`。
- 選取的模型必須支援圖片輸入；純文字模型可能會在供應商層拒絕請求。
- `model run --prompt` 必須包含非空白文字；空白提示會在任何供應商或閘道呼叫前遭到拒絕。
- 供應商未傳回任何文字輸出時，本機 `model run` 會以非零狀態結束，因此無法連線的供應商與空白補全不會看起來像成功的探測。
- 使用 `model run --gateway` 測試閘道路由或代理程式執行階段設定，同時保持模型輸入為原始形式。如需完整的代理程式情境、工具、記憶及工作階段逐字稿，請使用 `openclaw agent` 或聊天介面。
- `--thinking adaptive` 會對應至補全執行階段層級 `medium`；對於支援原生最高投入程度的 OpenAI 模型，`--thinking max` 會對應至 `max`，否則會對應至 `xhigh`。
- `model auth login`、`model auth logout` 和 `model auth status` 會管理已儲存的供應商驗證狀態。

## 圖片

生成、編輯與描述。

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

備註：

- 從現有輸入檔案開始時，請使用 `image edit`；對於支援的提供者／模型，`--size`、`--aspect-ratio` 或 `--resolution` 會加入幾何提示。
- 搭配 `--model openai/gpt-image-1.5` 使用 `--output-format png --background transparent`，可取得透明背景的 OpenAI PNG 輸出；`--openai-background` 是相同提示的 OpenAI 專用別名。未宣告支援背景的提供者會將其回報為已忽略的覆寫（請參閱 [JSON 封裝](#json-output)中的 `ignoredOverrides`）。
- `--quality low|medium|high|auto` 適用於支援影像品質提示的提供者，包括 OpenAI。OpenAI 也接受 `--openai-moderation low|auto`。
- `image providers --json` 會列出哪些內建影像提供者可被探索、已設定、已選取，以及各自公開哪些生成／編輯功能。
- `image generate --model <provider/model> --json` 是針對影像生成變更最精簡的即時冒煙測試：

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "最小化的扁平測試影像：白色背景上有一個藍色正方形，沒有文字。" \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  回應會回報 `ok`、`provider`、`model`、`attempts`，以及寫入的輸出路徑。設定 `--output` 時，最終副檔名可能會依照提供者傳回的 MIME 類型。

- 對於 `image describe` 和 `image describe-many`，請使用 `--prompt` 提供特定任務的指示（OCR、比較、UI 檢查、簡潔圖說）。
- 對於速度較慢的本機視覺模型或冷啟動的 Ollama，請使用 `--timeout-ms`。
- 對於 `image describe`，明確指定的 `--model`（必須是具備影像能力的 `<provider/model>`）會先執行；若該呼叫失敗，則嘗試已設定的 `agents.defaults.imageModel.fallbacks`。輸入準備錯誤（檔案不存在、不支援的 URL）會在任何備援嘗試前失敗，而且模型必須在模型目錄或提供者設定中具備影像能力。
- 對於本機 Ollama 視覺模型，請先提取模型，並將 `OLLAMA_API_KEY` 設為任意預留位置值，例如 `ollama-local`。請參閱 [Ollama](/zh-TW/providers/ollama#vision-and-image-description)。

## 音訊

檔案轉錄（不包含即時工作階段管理）。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "著重於姓名和行動項目" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` 必須是 `<provider/model>`。

## TTS

語音合成，以及 TTS 提供者／角色狀態。

```bash
openclaw infer tts convert --text "來自 openclaw 的問候" --output ./hello.mp3 --json
openclaw infer tts convert --text "你的建置已完成" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

注意事項：

- `tts status` 僅支援 `--gateway`（它會反映由閘道管理的 TTS 狀態）。
- 使用 `tts providers`、`tts voices`、`tts personas`、`tts set-provider` 和 `tts set-persona` 來檢查及設定 TTS 行為。

## 影片

生成與描述。

```bash
openclaw infer video generate --prompt "海上電影感日落" --json
openclaw infer video generate --prompt "緩慢飛越森林湖泊的無人機鏡頭" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

注意事項：

- `video generate` 接受 `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark` 和 `--timeout-ms`，並將其轉送至影片生成執行階段。
- 對於 `video describe`，`--model` 必須是 `<provider/model>`。

## 網頁

搜尋與擷取。

```bash
openclaw infer web search --query "OpenClaw 文件" --json
openclaw infer web search --query "OpenClaw infer web 提供者" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` 會列出搜尋與擷取功能可用、已設定及已選取的提供者。

## 嵌入

向量建立與嵌入提供者檢查。

```bash
openclaw infer embedding create --text "友善的龍蝦" --json
openclaw infer embedding create --text "客戶支援工單：出貨延遲" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 輸出

Infer 命令會將 JSON 輸出正規化至共用封裝：

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
- `inputs`（適用時，隨要求傳送的影像附件）
- `outputs`
- `ignoredOverrides`（適用時，提供者不支援的提示鍵）
- `error`

對於生成媒體的命令，`outputs` 包含 OpenClaw 寫入的檔案。進行自動化時，請使用該陣列中的 `path`、`mimeType`、`size` 和任何媒體特定尺寸，而非剖析供人閱讀的標準輸出。

## 常見陷阱

```bash
# 錯誤
openclaw infer media image generate --prompt "友善的龍蝦"

# 正確
openclaw infer image generate --prompt "友善的龍蝦"
```

```bash
# 錯誤
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# 正確
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [模型](/zh-TW/concepts/models)
