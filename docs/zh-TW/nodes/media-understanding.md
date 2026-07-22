---
read_when:
    - 設計或重構媒體理解功能
    - 調校傳入音訊／視訊／影像的預處理
sidebarTitle: Media understanding
summary: 使用提供者與命令列介面備援的傳入圖片／音訊／影片理解功能（選用）
title: 媒體理解
x-i18n:
    generated_at: "2026-07-22T10:38:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0948e9b4b59d1006a126a598ced38a9edc2902a01e4dd150717044f91ef57049
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw 可在回覆流水線執行前摘要傳入的媒體（圖片／音訊／影片），讓命令解析與路由使用簡短文字，而非原始位元組。理解功能會自動偵測本機工具或供應商金鑰，你也可以設定明確的模型。原始媒體一律會照常傳送給模型；理解失敗或遭停用時，回覆流程會維持不變並繼續執行。

供應商外掛會註冊能力中繼資料（哪個供應商支援哪種媒體類型、預設模型、優先順序）。OpenClaw 核心負責共用的 `tools.media` 設定、備援順序，以及回覆流水線整合。

## 運作方式

<Steps>
  <Step title="收集附件">
    收集傳入的附件（`MediaPaths`、`MediaUrls`、`MediaTypes`）。
  </Step>
  <Step title="依能力選取">
    對於每項已啟用的能力（圖片／音訊／影片），依照 `attachments` 政策選取附件（預設：僅第一個附件）。
  </Step>
  <Step title="選擇模型">
    選取第一個符合條件的模型項目（大小、能力及可用的驗證）。
  </Step>
  <Step title="失敗時備援">
    如果模型發生錯誤、逾時，或媒體超過 `maxBytes`，則嘗試下一個項目。
  </Step>
  <Step title="成功時套用">
    `Body` 會成為 `[Image]`、`[Audio]` 或 `[Video]` 區塊。音訊也會設定 `{{Transcript}}`；有字幕文字時，命令解析會使用字幕文字，否則使用轉錄文字。字幕會在區塊內保留為 `User text:`。
  </Step>
</Steps>

## 設定

`tools.media` 包含一份以能力標記的模型清單，以及少量依能力區分的控制項：

```json5
{
  tools: {
    media: {
      concurrency: 2, // 同時執行能力作業的上限（預設）
      models: [
        { provider: "openai", model: "gpt-4o-mini-transcribe", capabilities: ["audio"] },
        { provider: "google", model: "gemini-3-flash-preview", capabilities: ["image", "video"] },
      ],
      image: { preferredModel: "google/gemini-3-flash-preview" },
      audio: { enabled: true },
      video: { enabled: true },
    },
  },
}
```

各能力（`image`/`audio`/`video`）的索引鍵：

| 索引鍵              | 類型      | 預設值                                | 備註                                                                |
| ---------------- | --------- | -------------------------------------- | -------------------------------------------------------------------- |
| `enabled`        | `boolean` | 自動（`false` 會停用）                | 設為 `false` 可關閉此能力的自動偵測              |
| `preferredModel` | `string`  | 第一個相容的項目                 | 優先使用 `provider/model`、模型 ID、`provider:<id>` 或 `cli:command` |
| `prompt`         | `string`  | 能力預設值                     | 項目未覆寫時使用的預設提示詞                    |
| `maxChars`       | `number`  | 圖片／影片為 `500`，音訊未設定         | 預設輸出限制                                                 |
| `maxBytes`       | `number`  | 圖片 10MB、音訊 20MB、影片 50MB     | 預設輸入限制                                                  |
| `timeoutSeconds` | `number`  | 圖片／音訊為 `60`，影片為 `120`          | 預設請求逾時                                              |
| `language`       | `string`  | 未設定                                  | 音訊轉錄提示                                             |
| `scope`          | 物件    | 未設定                                  | 依頻道／聊天類型／來源索引鍵設定閘門                                 |
| `attachments`    | 物件    | `{ mode: "first", maxAttachments: 1 }` | 選取要處理的相符附件                      |
| `echoTranscript` | `boolean` | `false`                                | 僅限音訊：在代理程式處理前回顯轉錄文字              |
| `echoFormat`     | `string`  | `'📝 "{transcript}"'`                  | 僅限音訊：回顯轉錄文字的格式                         |

提示詞、限制、語言提示、請求覆寫及供應商選項，都可設為能力預設值，或在個別 `tools.media.models[]` 項目中覆寫。未設定明確模型時，能力預設值也會套用至自動偵測到的供應商。

### 模型項目

每個 `models[]` 項目都是**供應商**項目（預設）或**命令列介面**項目：

<Tabs>
  <Tab title="供應商項目">
    ```json5
    {
      type: "provider", // 省略時的預設值
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "請使用不超過 500 個字元描述圖片。",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"],
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="命令列介面項目">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "讀取 {{MediaPath}} 的媒體，並使用不超過 {{MaxChars}} 個字元描述。",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    命令列介面範本也可使用 `{{MediaDir}}`（包含媒體檔案的目錄）、`{{OutputDir}}`（為此次執行建立的暫存目錄），以及 `{{OutputBase}}`（暫存檔案的基本路徑，不含副檔名）。

  </Tab>
</Tabs>

### 供應商認證資訊

供應商媒體理解功能使用與一般模型呼叫相同的驗證解析順序：驗證設定檔、環境變數，接著是 `models.providers.<providerId>.apiKey`。`tools.media.models[]` 項目不接受行內 `apiKey` 欄位。

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

關於設定檔、環境變數和自訂基底 URL，請參閱[工具與自訂供應商](/zh-TW/gateway/config-tools)。

## 規則與行為

- 超過 `maxBytes` 的媒體會略過該模型，並嘗試下一個模型。
- 小於 1024 位元組的音訊檔案會被視為空白／損毀，並在轉錄前略過；代理程式會改為取得確定性的預留位置轉錄文字。
- 如果目前使用中的主要圖片模型已原生支援視覺，OpenClaw 會略過 `[Image]` 摘要區塊，並將原始圖片直接傳入模型。MiniMax 是例外：`minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 一律透過外掛所擁有的 `MiniMax-VL-01` 媒體供應商路由圖片理解，即使舊版 MiniMax M2.x 聊天中繼資料宣稱支援圖片輸入亦然（只有 `MiniMax-M3` 及更新版本會被視為原生支援視覺）。
- 如果閘道／WebChat 的主要模型僅支援文字，圖片附件會保留為已卸載的 `media://inbound/*` 參照，讓圖片／PDF 工具或已設定的圖片模型仍可檢查附件，而不會遺失附件。
- 明確設定的 `openclaw infer image describe --file <path> --model <provider/model>`（別名：`openclaw capability image describe`）會直接執行該支援圖片的供應商／模型；若 `models.providers.ollama.models[]` 下已設定相符且支援圖片的模型，這也包括 `ollama/qwen2.5vl:7b` 等 Ollama 參照。
- 如果 `<capability>.enabled` 不是 `false`，但未設定任何模型，當目前使用中的回覆模型供應商支援該能力時，OpenClaw 會嘗試使用該模型。

### 自動偵測（預設）

當 `tools.media.<capability>.enabled` 不是 `false`，且未設定任何模型時，OpenClaw 會依序嘗試下列選項，並在第一個可用選項處停止：

<Steps>
  <Step title="已設定的圖片模型（僅限圖片）">
    `agents.defaults.imageModel` 的主要／備援參照，但目前使用中的回覆模型已原生支援視覺時除外。優先使用 `provider/model` 參照；只有在相符項目唯一時，才會使用已設定且支援圖片的供應商模型項目來限定裸參照。
  </Step>
  <Step title="目前使用中的回覆模型">
    當供應商支援該能力時，使用目前使用中的回覆模型。
  </Step>
  <Step title="供應商驗證（僅限音訊，優先於本機命令列介面）">
    在本機命令列介面之前，會先嘗試支援音訊且已設定的 `models.providers.*` 項目。內建供應商的優先順序（優先順序相同時，依供應商 ID 的字母順序決定）：Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral。
  </Step>
  <Step title="本機命令列介面（僅限音訊）">
    已就緒的本機二進位檔會成為有序的備援清單：
    - 只有在目前處理程序中的較早模型叫用觀察到 Metal 或 CUDA 後，才會優先使用 `whisper-cli`
    - 預設使用 CPU 的 `sherpa-onnx-offline`（需要具有 `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx` 的 `SHERPA_ONNX_MODEL_DIR`）
    - 加速僅為建置時可用或尚未觀察到時，使用 `whisper-cli`
    - 在 Apple Silicon 上使用 `parakeet-mlx`（支援 MLX，但尚未觀察到裝置使用情況）
    - `whisper`（Python 命令列介面；預設使用 `turbo` 模型，並自動下載）

    後端能力檢查會快取結果，且不會載入模型。建置能力、要求的後端旗標，以及從實際叫用中觀察到的後端，會保持各自獨立。自動偵測到的 whisper.cpp 會讓模型執行記錄保持啟用，以便記錄上游選取的後端行。明確的命令列介面項目會保留其設定的順序、後端旗標與輸出旗標。

  </Step>
  <Step title="供應商驗證（圖片／影片）">
    在內建備援順序之前，會先嘗試支援該能力且已設定的 `models.providers.*` 項目。只有圖片設定的供應商若具有支援圖片的模型，即使不是內建供應商外掛，也會自動註冊至媒體理解功能。

    內建供應商的優先順序（優先順序相同時，依供應商 ID 的字母順序決定）：
    - 圖片：Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - 影片：Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="Antigravity 命令列介面（僅限圖片／影片）">
    使用第一個已安裝的 `agy` 或 `antigravity` 二進位檔（可使用 `OPENCLAW_ANTIGRAVITY_CLI` 覆寫），並將其沙箱限制在媒體所在目錄。
  </Step>
</Steps>

若要停用某項能力的自動偵測：

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
在 macOS/Linux/Windows 上，二進位檔偵測採盡力而為；請確保命令列介面位於 `PATH`（會展開 `~`），或設定含完整命令路徑的明確命令列介面模型項目。
</Note>

### Proxy 支援（音訊／影片供應商呼叫）

以供應商為基礎的**音訊**和**影片**理解功能會遵循標準的對外 Proxy 環境變數，包括 `NO_PROXY`/`no_proxy` 略過規則：`HTTPS_PROXY`、`HTTP_PROXY`、`ALL_PROXY`、`https_proxy`、`http_proxy`、`all_proxy`。小寫變數的優先順序高於大寫變數。如果均未設定，媒體理解功能會使用直接對外連線；如果 Proxy 值格式錯誤，OpenClaw 會記錄警告並退回直接擷取。圖片理解功能不會經過此 Proxy 路徑。

## 能力

在 `models[]` 項目上設定 `capabilities`，以將其限制為特定媒體類型。對於共用清單，OpenClaw 會依各內建供應商推斷預設值：

| 提供者                                                                 | 功能                    |
| ------------------------------------------------------------------------ | ----------------------- |
| `openai`, `anthropic`, `minimax`                                         | 圖片                    |
| `minimax-portal`                                                         | 圖片                    |
| `moonshot`                                                               | 圖片 + 影片             |
| `openrouter`                                                             | 圖片 + 音訊             |
| `google` (Gemini API)                                                    | 圖片 + 音訊 + 影片      |
| `qwen`                                                                   | 圖片 + 影片             |
| `deepinfra`                                                              | 圖片 + 音訊             |
| `mistral`                                                                | 音訊                    |
| `zai`                                                                    | 圖片                    |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | 音訊                    |
| 任何包含支援圖片模型的 `models.providers.<id>.models[]` 目錄 | 圖片                    |

對於命令列介面項目，請明確設定 `capabilities`，以避免意外比對；若省略，該項目便符合其出現之每個功能清單的資格。

## 提供者支援矩陣

| 功能  | 提供者                                                                                                                                                  | 備註                                                                                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 圖片  | Anthropic, Codex app-server, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OpenAI Codex OAuth, OpenRouter, Qwen, Z.AI, 設定提供者       | 供應商外掛會註冊圖片支援；`openai/*` 可使用 API 金鑰或 Codex OAuth 路由；`codex/*` 使用有界限的 Codex app-server 回合；支援圖片的設定提供者會自動註冊。 |
| 音訊  | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | 提供者轉錄（Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral）。                                                                                                            |
| 影片  | Google, Moonshot, Qwen                                                                                                                                  | 透過供應商外掛提供影片理解；Qwen 影片理解使用標準 DashScope 端點。                                                                                                                                   |

<Note>
**MiniMax 備註**：`minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 的圖片理解一律由外掛擁有的 `MiniMax-VL-01` 媒體提供者提供，即使舊版 MiniMax M2.x 聊天中繼資料宣稱支援圖片輸入亦然。
</Note>

## 模型選擇指南

- 當品質與安全性至關重要時，請為每項媒體功能優先選用目前最強的新一代模型。
- 對於處理不受信任輸入且已啟用工具的代理程式，請避免使用較舊或較弱的媒體模型。
- 每項功能至少保留一個備援，以確保可用性（高品質模型 + 較快或較便宜的模型）。
- 當提供者 API 無法使用時，命令列介面備援（`whisper-cli`、`whisper`、`gemini`）可提供協助。
- 已知的檔案輸出模式具有最終決定權：推斷出的逐字稿檔案若為空或不存在，便不會產生逐字稿，也不會退回使用命令列介面進度輸出。
- `parakeet-mlx`：搭配 `--output-dir` 使用 `--output-format txt`（或 `all`），並採用預設的 `{filename}` 輸出範本。也會遵循上游的 `PARAKEET_OUTPUT_FORMAT` 和 `PARAKEET_OUTPUT_TEMPLATE` 環境變數。OpenClaw 會讀取 `<output-dir>/<media-basename>.txt`；預設的 `srt` 格式、其他格式及自訂輸出範本仍會使用 stdout。

## 附件政策

各功能的 `attachments` 控制要處理哪些附件：

<ParamField path="mode" type='"first" | "all"' default="first">
  僅處理第一個選取的附件，或處理全部附件。
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  限制處理數量上限。
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  候選附件之間的選取偏好。
</ParamField>

當 `mode: "all"` 時，輸出會標示為 `[Image 1/2]`、`[Audio 2/2]` 等。

### 檔案附件擷取

- 擷取出的檔案文字在附加至媒體提示詞之前，會包裝為不受信任的外部內容，並使用 `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` 之類的邊界標記及一行 `Source: External` 中繼資料。
- 此路徑刻意省略冗長的 `SECURITY NOTICE:` 橫幅，以保持媒體提示詞精簡；邊界標記及中繼資料仍會套用。
- 沒有可擷取文字的檔案會取得 `[No extractable text]`。
- 若 PDF 退回使用算繪後的頁面圖片，OpenClaw 會將這些圖片轉送至具備視覺能力的回覆模型，並在檔案區塊中保留預留位置 `[PDF content rendered to images]`。

## 設定範例

<Tabs>
  <Tab title="共用模型 + 覆寫">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "讀取位於 {{MediaPath}} 的媒體，並以不超過 {{MaxChars}} 個字元描述它。",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="僅音訊 + 影片">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "讀取位於 {{MediaPath}} 的媒體，並以不超過 {{MaxChars}} 個字元描述它。",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="僅圖片">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.6-sol" },
              { provider: "anthropic", model: "claude-opus-4-8" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "讀取位於 {{MediaPath}} 的媒體，並以不超過 {{MaxChars}} 個字元描述它。",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="多模態單一項目">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## 狀態輸出

執行媒體理解時，`/status` 會包含一行各功能摘要：

```
📎 媒體：圖片成功（openai/gpt-5.6-sol）· 音訊成功（whisper-cli observed=metal）
```

若要進行預檢清查，請執行 `openclaw capability audio providers`。本機資料列會將本機備援勝出者與全域提供者選取、就緒狀態，以及個別的可用／要求／觀察到的後端欄位分開顯示。相同的本機選取也會作為資訊型 doctor 結果提供：

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## 備註

- 理解功能採盡力而為。錯誤不會阻止回覆。
- 即使停用理解功能，附件仍會傳遞給模型。
- 使用 `scope` 限制執行理解功能的位置（例如僅限私訊）。

## 相關內容

- [設定](/zh-TW/gateway/configuration)
- [圖片與媒體支援](/zh-TW/nodes/images)
