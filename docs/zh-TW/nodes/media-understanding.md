---
read_when:
    - 設計或重構媒體理解
    - 調校傳入音訊/影片/圖片預處理
sidebarTitle: Media understanding
summary: 傳入影像/音訊/影片理解（選用），具備供應商 + 命令列介面後援
title: 媒體理解
x-i18n:
    generated_at: "2026-07-05T11:28:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aabf40780d3528fe8ee3e28782b9e19f624009f5f8684a015357bb27458150ef
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw 可以在回覆管線執行前摘要傳入媒體（圖片/音訊/影片），讓命令解析與路由能依據短文字而不是原始位元組運作。理解功能會自動偵測本機工具或提供者金鑰，或者你也可以設定明確的模型。原始媒體一律照常傳送給模型；當理解失敗或停用時，回覆流程會維持不變繼續執行。

供應商外掛會註冊能力中繼資料（哪個提供者支援哪種媒體類型、預設模型、優先順序）。OpenClaw 核心負責共用的 `tools.media` 設定、備援順序，以及回覆管線整合。

## 運作方式

<Steps>
  <Step title="收集附件">
    收集傳入附件（`MediaPaths`、`MediaUrls`、`MediaTypes`）。
  </Step>
  <Step title="依能力選取">
    對每個已啟用的能力（圖片/音訊/影片），依 `attachments` 政策選取附件（預設：僅第一個附件）。
  </Step>
  <Step title="選擇模型">
    選取第一個符合資格的模型項目（大小 + 能力 + 可用驗證）。
  </Step>
  <Step title="失敗時備援">
    如果模型發生錯誤、逾時，或媒體超過 `maxBytes`，就嘗試下一個項目。
  </Step>
  <Step title="成功時套用">
    `Body` 會變成 `[Image]`、`[Audio]` 或 `[Video]` 區塊。音訊也會設定 `{{Transcript}}`；命令解析會在有字幕文字時使用字幕，否則使用逐字稿。字幕會以區塊內的 `User text:` 保留下來。
  </Step>
</Steps>

## 設定

`tools.media` 會保存共用模型清單以及各能力的覆寫：

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [
        /* shared list, gate with capabilities */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

各能力（`image`/`audio`/`video`）鍵：

| 鍵                                             | 類型      | 預設值                                              | 備註                                                                               |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | 自動（`false` 會停用）                              | 設為 `false` 可關閉此能力的自動偵測                             |
| `models`                                        | array     | 無                                                 | 優先於共用的 `tools.media.models` 清單                               |
| `prompt`                                        | `string`  | `"Describe the {media}."`（+ maxChars 指引）      | 預設僅用於圖片/影片                                                         |
| `maxChars`                                      | `number`  | `500`（圖片/影片），未設定（音訊）                   | 如果模型回傳更多內容，輸出會被截斷                                         |
| `maxBytes`                                      | `number`  | 圖片 `10485760`，音訊 `20971520`，影片 `52428800` | 過大的媒體會跳到下一個模型                                             |
| `timeoutSeconds`                                | `number`  | `60`（圖片/音訊），`120`（影片）                    |                                                                                     |
| `language`                                      | `string`  | 未設定                                                | 音訊轉錄提示                                                            |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | 提供者請求覆寫；請參閱[工具與自訂提供者](/zh-TW/gateway/config-tools) |
| `attachments`                                   | object    | `{ mode: "first", maxAttachments: 1 }`               | 請參閱[附件政策](#attachment-policy)                                         |
| `scope`                                         | object    | 未設定                                                | 依 channel/chatType/keyPrefix 閘控                                                  |
| `echoTranscript`                                | `boolean` | `false`                                              | 僅音訊：在代理處理前將逐字稿回傳到聊天            |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | 僅音訊：`{transcript}` 佔位符                                              |

Deepgram 專屬選項放在 `providerOptions.deepgram` 底下（頂層 `deepgram: { detectLanguage, punctuate, smartFormat }` 欄位已棄用，但仍會讀取）。

### 模型項目

每個 `models[]` 項目都是 **provider** 項目（預設）或 **命令列介面** 項目：

<Tabs>
  <Tab title="提供者項目">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, for multi-modal shared entries
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
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    命令列介面樣板也可以使用 `{{MediaDir}}`（包含媒體檔案的目錄）、`{{OutputDir}}`（為這次執行建立的暫存目錄）和 `{{OutputBase}}`（暫存檔案基底路徑，無副檔名）。

  </Tab>
</Tabs>

### 提供者認證

提供者媒體理解會使用與一般模型呼叫相同的驗證解析：驗證設定檔、環境變數，接著是 `models.providers.<providerId>.apiKey`。`tools.media.*.models[]` 項目不接受行內 `apiKey` 欄位。

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

關於設定檔、環境變數和自訂基底 URL，請參閱[工具與自訂提供者](/zh-TW/gateway/config-tools)。

## 規則與行為

- 超過 `maxBytes` 的媒體會跳過該模型並嘗試下一個。
- 小於 1024 位元組的音訊檔案會在轉錄前被視為空白/損毀並略過；代理會改為取得確定性的佔位逐字稿。
- 如果作用中的主要圖片模型已原生支援視覺，OpenClaw 會略過 `[Image]` 摘要區塊，並直接將原始圖片傳入模型。MiniMax 是例外：`minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 一律透過外掛擁有的 `MiniMax-VL-01` 媒體提供者路由圖片理解，即使舊版 MiniMax M2.x 聊天中繼資料宣稱支援圖片輸入（只有 `MiniMax-M3` 及更新版本會被視為原生具備視覺能力）。
- 如果 Gateway/WebChat 主要模型僅支援文字，圖片附件會保留為卸載的 `media://inbound/*` 參照，讓圖片/PDF 工具或已設定的圖片模型仍可檢查它們，而不是遺失附件。
- 明確執行 `openclaw infer image describe --file <path> --model <provider/model>`（別名：`openclaw capability image describe`）會直接執行該具圖片能力的提供者/模型，包括像 `ollama/qwen2.5vl:7b` 這類 Ollama 參照，只要相符的具圖片能力模型已設定在 `models.providers.ollama.models[]` 底下。
- 如果 `<capability>.enabled` 不是 `false` 但沒有設定模型，OpenClaw 會在其提供者支援該能力時嘗試作用中的回覆模型。

### 自動偵測（預設）

當 `tools.media.<capability>.enabled` 不是 `false` 且未設定模型時，OpenClaw 會依序嘗試下列選項，並在第一個可用選項停止：

<Steps>
  <Step title="已設定的圖片模型（僅圖片）">
    `agents.defaults.imageModel` 主要/備援參照，除非作用中的回覆模型已原生支援視覺。優先使用 `provider/model` 參照；裸參照只有在相符項目唯一時，才會從已設定的具圖片能力提供者模型項目補齊限定。
  </Step>
  <Step title="作用中的回覆模型">
    當其提供者支援該能力時，使用作用中的回覆模型。
  </Step>
  <Step title="提供者驗證（僅音訊，優先於本機命令列介面）">
    支援音訊的已設定 `models.providers.*` 項目會在本機命令列介面前先嘗試。內建提供者優先順序（平手時依提供者 id 字母排序）：Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral。
  </Step>
  <Step title="本機命令列介面（僅音訊）">
    第一個已安裝的本機二進位檔，依下列順序：
    - `sherpa-onnx-offline`（需要含有 `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx` 的 `SHERPA_ONNX_MODEL_DIR`）
    - `whisper-cli`（`whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或內建的小型模型）
    - `whisper`（Python 命令列介面；預設使用 `turbo` 模型，會自動下載）

  </Step>
  <Step title="提供者驗證（圖片/影片）">
    支援該能力的已設定 `models.providers.*` 項目會在內建備援順序前先嘗試。僅圖片設定提供者若具備圖片能力模型，即使不是內建供應商外掛，也會自動註冊用於媒體理解。

    內建提供者優先順序（平手時依提供者 id 字母排序）：
    - 圖片：Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - 影片：Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="Antigravity 命令列介面（僅圖片/影片）">
    第一個已安裝的 `agy` 或 `antigravity` 二進位檔（可用 `OPENCLAW_ANTIGRAVITY_CLI` 覆寫），會以媒體所在目錄作為沙箱。
  </Step>
</Steps>

若要停用某個能力的自動偵測：

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
二進位檔偵測在 macOS/Linux/Windows 上是盡力而為；請確保命令列介面位於 `PATH` 上（`~` 會展開），或設定具有完整命令路徑的明確命令列介面模型項目。
</Note>

### 代理支援（音訊/影片提供者呼叫）

以提供者為基礎的 **音訊** 和 **影片** 理解會遵循標準外送代理環境變數，包括 `NO_PROXY`/`no_proxy` 略過規則：`HTTPS_PROXY`、`HTTP_PROXY`、`ALL_PROXY`、`https_proxy`、`http_proxy`、`all_proxy`。小寫變數優先於大寫。如果都未設定，媒體理解會使用直接對外連線；如果代理值格式錯誤，OpenClaw 會記錄警告並退回直接擷取。圖片理解不會經過這個代理路徑。

## 能力

在 `models[]` 項目上設定 `capabilities` 可將其限制為特定媒體類型。對於共用清單，OpenClaw 會依內建提供者推斷預設值：

| 提供者                                                                 | 功能                  |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | 圖像                  |
| `minimax-portal`                                                         | 圖像                  |
| `moonshot`                                                               | 圖像 + 影片           |
| `openrouter`                                                             | 圖像 + 音訊           |
| `google` (Gemini API)                                                    | 圖像 + 音訊 + 影片    |
| `qwen`                                                                   | 圖像 + 影片           |
| `deepinfra`                                                              | 圖像 + 音訊           |
| `mistral`                                                                | 音訊                  |
| `zai`                                                                    | 圖像                  |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | 音訊                  |
| 任何包含支援圖像模型的 `models.providers.<id>.models[]` 目錄             | 圖像                  |

對於命令列介面項目，請明確設定 `capabilities` 以避免意外匹配；若省略，該項目會符合其出現所在的每個功能清單。

## 提供者支援矩陣

| 功能 | 提供者                                                                                                                                               | 備註                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 圖像      | Anthropic, Codex app-server, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OpenAI Codex OAuth, OpenRouter, Qwen, Z.AI, 設定提供者 | 廠商外掛會註冊圖像支援；`openai/*` 可使用 API 金鑰或 Codex OAuth 路由；`codex/*` 使用有界的 Codex app-server 回合；支援圖像的設定提供者會自動註冊。 |
| 音訊      | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | 提供者轉錄 (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral)。                                                                                     |
| 影片      | Google, Moonshot, Qwen                                                                                                                                  | 透過廠商外掛進行提供者影片理解；Qwen 影片理解使用標準 DashScope 端點。                                                                        |

<Note>
**MiniMax 備註**：`minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 圖像理解一律來自外掛擁有的 `MiniMax-VL-01` 媒體提供者，即使舊版 MiniMax M2.x 聊天中繼資料聲稱支援圖像輸入。
</Note>

## 模型選擇指引

- 當品質與安全性很重要時，請為每項媒體功能優先選用目前世代最強的模型。
- 對於處理不受信任輸入且啟用工具的代理，請避免使用較舊或較弱的媒體模型。
- 為每項功能保留至少一個備援以確保可用性（高品質模型 + 較快或較便宜的模型）。
- 當提供者 API 無法使用時，命令列介面備援（`whisper-cli`、`whisper`、`gemini`）會有所幫助。
- `parakeet-mlx`：使用 `--output-dir` 時，若輸出格式為 `txt` 或未指定，OpenClaw 會讀取 `<output-dir>/<media-basename>.txt`；其他格式會回退到 stdout。

## 附件政策

每項功能的 `attachments` 會控制要處理哪些附件：

<ParamField path="mode" type='"first" | "all"' default="first">
  只處理第一個選取的附件，或處理全部附件。
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  限制處理的數量。
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  候選附件之間的選取偏好。
</ParamField>

當 `mode: "all"` 時，輸出會標示為 `[Image 1/2]`、`[Audio 2/2]` 等。

### 檔案附件擷取

- 擷取出的檔案文字會先包裝為不受信任的外部內容，再附加到媒體提示中，使用像 `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` 這類邊界標記，並加上一行 `Source: External` 中繼資料。
- 此路徑刻意省略較長的 `SECURITY NOTICE:` 橫幅，以保持媒體提示簡短；邊界標記與中繼資料仍然適用。
- 沒有可擷取文字的檔案會得到 `[No extractable text]`。
- 如果 PDF 回退到轉譯後的頁面圖像，OpenClaw 會將這些圖像轉送給具備視覺能力的回覆模型，並在檔案區塊中保留預留位置 `[PDF content rendered to images]`。

## 設定範例

<Tabs>
  <Tab title="共用模型 + 覆寫">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
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
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
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
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="僅圖像">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.5" },
              { provider: "anthropic", model: "claude-opus-4-8" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
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

當媒體理解執行時，`/status` 會包含每項功能的摘要行：

```
📎 Media: image ok (openai/gpt-5.5) · audio skipped (maxBytes)
```

## 備註

- 理解是盡力而為。錯誤不會阻擋回覆。
- 即使停用理解，附件仍會傳遞給模型。
- 使用 `scope` 限制理解執行的位置（例如只限私訊）。

## 相關

- [設定](/zh-TW/gateway/configuration)
- [圖像與媒體支援](/zh-TW/nodes/images)
