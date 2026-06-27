---
read_when:
    - 設計或重構媒體理解
    - 調校傳入音訊／影片／影像的預處理
sidebarTitle: Media understanding
summary: 傳入影像／音訊／影片理解（選用），並具備提供者 + 命令列介面備援
title: 媒體理解
x-i18n:
    generated_at: "2026-06-27T19:29:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4724578632b0210290d1b32077d2c0ccf7fdfa6b96160f76bf3eff591df7b92e
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw 可以在回覆管線執行前**摘要傳入媒體**（圖片/音訊/影片）。它會在本機工具或提供者金鑰可用時自動偵測，也可以停用或自訂。如果理解功能關閉，模型仍會照常收到原始檔案/URL。

供應商特定的媒體行為由供應商外掛註冊，而 OpenClaw core 則負責共用的 `tools.media` 設定、備援順序與回覆管線整合。

## 目標

- 選用：將傳入媒體預先消化為短文字，以加快路由並改善命令解析。
- 保留原始媒體傳送給模型（永遠）。
- 支援**提供者 API** 與**命令列介面備援**。
- 允許多個模型搭配有序備援（錯誤/大小/逾時）。

## 高階行為

<Steps>
  <Step title="收集附件">
    收集傳入附件（`MediaPaths`、`MediaUrls`、`MediaTypes`）。
  </Step>
  <Step title="依能力選取">
    針對每個已啟用能力（圖片/音訊/影片），依政策選取附件（預設：**第一個**）。
  </Step>
  <Step title="選擇模型">
    選擇第一個符合資格的模型項目（大小 + 能力 + 驗證）。
  </Step>
  <Step title="失敗時備援">
    如果模型失敗或媒體太大，**退回到下一個項目**。
  </Step>
  <Step title="套用成功區塊">
    成功時：

    - `Body` 會變成 `[Image]`、`[Audio]` 或 `[Video]` 區塊。
    - 音訊會設定 `{{Transcript}}`；命令解析會在有說明文字時使用說明文字，否則使用逐字稿。
    - 說明文字會以區塊內的 `User text:` 保留。

  </Step>
</Steps>

如果理解失敗或已停用，**回覆流程會繼續**使用原始 body + 附件。

## 設定概觀

`tools.media` 支援**共用模型**加上每項能力的覆寫：

<AccordionGroup>
  <Accordion title="頂層鍵">
    - `tools.media.models`：共用模型清單（使用 `capabilities` 進行限制）。
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`：
      - 預設值（`prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`）
      - 提供者覆寫（`baseUrl`、`headers`、`providerOptions`）
      - 透過 `tools.media.audio.providerOptions.deepgram` 設定 Deepgram 音訊選項
      - 音訊逐字稿回顯控制（`echoTranscript`，預設 `false`；`echoFormat`）
      - 選用的**每項能力 `models` 清單**（優先於共用模型）
      - `attachments` 政策（`mode`、`maxAttachments`、`prefer`）
      - `scope`（依 channel/chatType/session key 選用限制）
    - `tools.media.concurrency`：最大並行能力執行數（預設 **2**）。

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
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

### 模型項目

每個 `models[]` 項目可以是**提供者**或**命令列介面**：

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
      capabilities: ["image"], // optional, used for multi-modal entries
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

    命令列介面範本也可以使用：

    - `{{MediaDir}}`（包含媒體檔案的目錄）
    - `{{OutputDir}}`（為這次執行建立的暫存目錄）
    - `{{OutputBase}}`（暫存檔案基底路徑，無副檔名）

  </Tab>
</Tabs>

### 提供者憑證（`apiKey`）

提供者媒體理解使用與一般模型呼叫相同的提供者驗證解析：驗證設定檔、環境變數，接著是 `models.providers.<providerId>.apiKey`。

`tools.media.*.models[]` 項目不接受內嵌 `apiKey` 欄位。媒體模型項目中的 `provider` 值，例如 `openai` 或 `moonshot`，必須可透過其中一個標準提供者驗證來源取得憑證。

最小範例：

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

如需完整提供者驗證參考，包括設定檔、環境變數與自訂 base URL，請參閱[工具與自訂提供者](/zh-TW/gateway/config-tools)。

## 預設值與限制

建議預設值：

- `maxChars`：圖片/影片為 **500**（短且適合命令）
- `maxChars`：音訊為**未設定**（完整逐字稿，除非你設定限制）
- `maxBytes`：
  - 圖片：**10MB**
  - 音訊：**20MB**
  - 影片：**50MB**

<AccordionGroup>
  <Accordion title="規則">
    - 如果媒體超過 `maxBytes`，會略過該模型並**嘗試下一個模型**。
    - 小於 **1024 位元組**的音訊檔案會被視為空白/毀損，並在提供者/命令列介面轉錄前略過；傳入回覆脈絡會收到決定性的佔位逐字稿，讓代理知道該語音訊息太小。
    - 如果模型回傳超過 `maxChars`，輸出會被截斷。
    - `prompt` 預設為簡單的「Describe the {media}.」加上 `maxChars` 指引（僅圖片/影片）。
    - 如果作用中的主要圖片模型已原生支援視覺，OpenClaw 會略過 `[Image]` 摘要區塊，改為將原始圖片傳入模型。
    - 如果 Gateway/WebChat 主要模型是純文字，圖片附件會保留為卸載的 `media://inbound/*` refs，讓圖片/PDF 工具或已設定圖片模型仍可檢查它們，而不是遺失附件。
    - 明確的 `openclaw infer image describe --model <provider/model>` 請求不同：它們會直接執行該支援圖片的提供者/模型，包括 `ollama/qwen2.5vl:7b` 等 Ollama refs。
    - 如果 `<capability>.enabled: true` 但沒有設定模型，OpenClaw 會在其提供者支援該能力時嘗試**作用中的回覆模型**。

  </Accordion>
</AccordionGroup>

### 自動偵測媒體理解（預設）

如果 `tools.media.<capability>.enabled` **未**設為 `false`，且你尚未設定模型，OpenClaw 會依此順序自動偵測並**在第一個可用選項停止**：

<Steps>
  <Step title="作用中的回覆模型">
    作用中的回覆模型，前提是其提供者支援該能力。
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` 主要/備援 refs（僅圖片）。
    優先使用 `provider/model` refs。裸 refs 只有在符合項目唯一時，才會從已設定的支援圖片提供者模型項目補齊資格。
  </Step>
  <Step title="本機命令列介面（僅音訊）">
    本機命令列介面（若已安裝）：

    - `sherpa-onnx-offline`（需要含 encoder/decoder/joiner/tokens 的 `SHERPA_ONNX_MODEL_DIR`）
    - `whisper-cli`（`whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或隨附 tiny 模型）
    - `whisper`（Python 命令列介面；自動下載模型）

  </Step>
  <Step title="Gemini 命令列介面">
    使用 `read_many_files` 的 `gemini`。
  </Step>
  <Step title="提供者驗證">
    - 支援該能力的已設定 `models.providers.*` 項目，會在隨附備援順序前先嘗試。
    - 只設定圖片且有支援圖片模型的設定提供者，即使不是隨附供應商外掛，也會自動註冊為媒體理解。
    - Ollama 圖片理解在明確選取時可用，例如透過 `agents.defaults.imageModel` 或 `openclaw infer image describe --model ollama/<vision-model>`。

    隨附備援順序：

    - 音訊：OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - 圖片：OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - 影片：Google → Qwen → Moonshot

  </Step>
</Steps>

若要停用自動偵測，請設定：

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
二進位偵測在 macOS/Linux/Windows 上是盡力而為；請確保命令列介面位於 `PATH`（我們會展開 `~`），或設定具完整命令路徑的明確命令列介面模型。
</Note>

### Proxy 環境支援（提供者模型）

啟用以提供者為基礎的**音訊**與**影片**媒體理解時，OpenClaw 會針對提供者 HTTP 呼叫遵循標準輸出 proxy 環境變數：

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

如果未設定 proxy 環境變數，媒體理解會使用直接對外連線。如果 proxy 值格式錯誤，OpenClaw 會記錄警告並退回直接擷取。

## 能力（選用）

如果你設定 `capabilities`，該項目只會針對那些媒體類型執行。對於共用清單，OpenClaw 可以推斷預設值：

- `openai`、`anthropic`、`minimax`：**圖片**
- `minimax-portal`：**圖片**
- `moonshot`：**圖片 + 影片**
- `openrouter`：**圖片 + 音訊**
- `google`（Gemini API）：**圖片 + 音訊 + 影片**
- `qwen`：**圖片 + 影片**
- `mistral`：**音訊**
- `zai`：**圖片**
- `groq`：**音訊**
- `xai`：**音訊**
- `deepgram`：**音訊**
- 任何含有支援圖片模型的 `models.providers.<id>.models[]` 型錄：**圖片**

對於命令列介面項目，請**明確設定 `capabilities`** 以避免意外符合。如果省略 `capabilities`，該項目會符合其所在清單。

## 提供者支援矩陣（OpenClaw 整合）

| 能力 | 提供者整合                                                                                                         | 附註                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 圖片      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, 設定提供者 | 供應商外掛會註冊圖片支援；`openai/*` 可使用 API key 或 Codex OAuth 路由；`codex/*` 使用有界的 Codex app-server 回合；MiniMax 與 MiniMax OAuth 都使用 `MiniMax-VL-01`；支援圖片的設定提供者會自動註冊。 |
| 音訊      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | 提供者轉錄（Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral）。                                                                                                                                         |
| 影片      | Google, Qwen, Moonshot                                                                                                       | 透過供應商外掛提供的提供者影片理解；Qwen 影片理解使用 Standard DashScope 端點。                                                                                                                            |

<Note>
**MiniMax 附註**

- `minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 的圖片理解來自由外掛擁有的 `MiniMax-VL-01` 媒體提供者。
- 即使舊版 MiniMax M2.x 聊天中繼資料宣稱支援圖片輸入，自動圖片路由仍會繼續使用 `MiniMax-VL-01`。

</Note>

## 模型選擇指引

- 當品質與安全性很重要時，針對每種媒體能力，優先選用可用的最強最新世代模型。
- 對於處理不受信任輸入且啟用工具的代理，請避免使用較舊或較弱的媒體模型。
- 為了可用性，每種能力至少保留一個備援（高品質模型 + 較快或較便宜的模型）。
- 當提供者 API 無法使用時，命令列介面備援（`whisper-cli`、`whisper`、`gemini`）很有用。
- `parakeet-mlx` 注意事項：使用 `--output-dir` 時，如果輸出格式為 `txt`（或未指定），OpenClaw 會讀取 `<output-dir>/<media-basename>.txt`；非 `txt` 格式會退回使用 stdout。

## 附件政策

每種能力的 `attachments` 控制會處理哪些附件：

<ParamField path="mode" type='"first" | "all"' default="first">
  是否處理第一個選取的附件，或處理全部附件。
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  限制處理的數量。
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  候選附件之間的選取偏好。
</ParamField>

當 `mode: "all"` 時，輸出會標示為 `[Image 1/2]`、`[Audio 2/2]` 等。

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - 擷取出的檔案文字在附加到媒體提示之前，會包裝為**不受信任的外部內容**。
    - 注入的區塊會使用明確的邊界標記，例如 `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`，並包含一行 `Source: External` 中繼資料。
    - 此附件擷取路徑刻意省略較長的 `SECURITY NOTICE:` 橫幅，以避免媒體提示膨脹；邊界標記與中繼資料仍會保留。
    - 如果檔案沒有可擷取的文字，OpenClaw 會注入 `[No extractable text]`。
    - 如果 PDF 在此路徑中退回使用渲染頁面圖片，媒體提示會保留預留文字 `[PDF content rendered to images; images not forwarded to model]`，因為此附件擷取步驟轉送的是文字區塊，而不是渲染後的 PDF 圖片。

  </Accordion>
</AccordionGroup>

## 設定範例

<Tabs>
  <Tab title="Shared models + overrides">
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
  <Tab title="Audio + video only">
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
  <Tab title="Image-only">
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
              { provider: "anthropic", model: "claude-opus-4-6" },
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
  <Tab title="Multi-modal single entry">
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

媒體理解執行時，`/status` 會包含一行簡短摘要：

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

這會顯示每種能力的結果，以及適用時所選的提供者/模型。

## 注意事項

- 理解是**盡力而為**。錯誤不會阻擋回覆。
- 即使停用理解，附件仍會傳遞給模型。
- 使用 `scope` 限制理解執行的位置（例如僅限私訊）。

## 相關

- [設定](/zh-TW/gateway/configuration)
- [圖片與媒體支援](/zh-TW/nodes/images)
