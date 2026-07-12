---
read_when:
    - 設計或重構媒體理解功能
    - 調整傳入音訊／視訊／影像的預處理
sidebarTitle: Media understanding
summary: 透過提供者與命令列介面備援，理解傳入的圖片、音訊與影片（選用）
title: 媒體理解
x-i18n:
    generated_at: "2026-07-11T21:29:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw 可在回覆管線執行前摘要傳入媒體（影像／音訊／影片），讓命令剖析與路由依據簡短文字運作，而非原始位元組。理解功能會自動偵測本機工具或供應商金鑰，您也可以明確設定模型。原始媒體一律會照常傳送給模型；當理解失敗或停用時，回覆流程會維持不變並繼續執行。

供應商外掛會註冊能力中繼資料（哪些供應商支援哪些媒體類型、預設模型、優先順序）。OpenClaw 核心負責共用的 `tools.media` 設定、備援順序，以及回覆管線整合。

## 運作方式

<Steps>
  <Step title="收集附件">
    收集傳入附件（`MediaPaths`、`MediaUrls`、`MediaTypes`）。
  </Step>
  <Step title="依能力選取">
    對每項已啟用的能力（影像／音訊／影片），依照 `attachments` 政策選取附件（預設：僅第一個附件）。
  </Step>
  <Step title="選擇模型">
    選取第一個符合資格的模型項目（大小、能力及可用的驗證資訊）。
  </Step>
  <Step title="失敗時備援">
    若模型發生錯誤、逾時，或媒體超過 `maxBytes`，則嘗試下一個項目。
  </Step>
  <Step title="成功時套用">
    `Body` 會成為 `[Image]`、`[Audio]` 或 `[Video]` 區塊。音訊也會設定 `{{Transcript}}`；若有字幕文字，命令剖析會使用該文字，否則使用轉錄內容。字幕會在區塊內以 `User text:` 保留。
  </Step>
</Steps>

## 設定

`tools.media` 包含共用模型清單及各能力的覆寫設定：

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [/* shared list, gate with capabilities */],
      image: {/* optional overrides */},
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* optional overrides */},
    },
  },
}
```

各能力（`image`／`audio`／`video`）的鍵：

| 鍵                                              | 類型      | 預設值                                               | 備註                                                                                |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | 自動（`false` 會停用）                               | 設為 `false` 可關閉此能力的自動偵測                                                 |
| `models`                                        | 陣列      | 無                                                   | 優先於共用的 `tools.media.models` 清單                                              |
| `prompt`                                        | `string`  | `"Describe the {media}."`（加上 maxChars 指引）      | 預設僅用於影像／影片                                                               |
| `maxChars`                                      | `number`  | `500`（影像／影片），音訊未設定                      | 若模型回傳更多內容，輸出會被截短                                                   |
| `maxBytes`                                      | `number`  | 影像 `10485760`、音訊 `20971520`、影片 `52428800`    | 過大的媒體會跳至下一個模型                                                         |
| `timeoutSeconds`                                | `number`  | `60`（影像／音訊）、`120`（影片）                    |                                                                                     |
| `language`                                      | `string`  | 未設定                                               | 音訊轉錄提示                                                                        |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | 供應商請求覆寫；請參閱[工具與自訂供應商](/zh-TW/gateway/config-tools)                    |
| `attachments`                                   | 物件      | `{ mode: "first", maxAttachments: 1 }`               | 請參閱[附件政策](#attachment-policy)                                                |
| `scope`                                         | 物件      | 未設定                                               | 依頻道／chatType／keyPrefix 限制                                                    |
| `echoTranscript`                                | `boolean` | `false`                                              | 僅限音訊：在代理處理前將轉錄內容回傳至聊天                                         |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | 僅限音訊：`{transcript}` 預留位置                                                   |

Deepgram 專用選項放在 `providerOptions.deepgram` 下（頂層的 `deepgram: { detectLanguage, punctuate, smartFormat }` 欄位已棄用，但仍會讀取）。

### 模型項目

每個 `models[]` 項目都是**供應商**項目（預設）或**命令列介面**項目：

<Tabs>
  <Tab title="供應商項目">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.6-sol",
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

    命令列介面範本也可使用 `{{MediaDir}}`（包含媒體檔案的目錄）、`{{OutputDir}}`（為此次執行建立的暫存目錄），以及 `{{OutputBase}}`（暫存檔案的基礎路徑，不含副檔名）。

  </Tab>
</Tabs>

### 供應商憑證

供應商媒體理解功能使用與一般模型呼叫相同的驗證解析順序：驗證設定檔、環境變數，接著是 `models.providers.<providerId>.apiKey`。`tools.media.*.models[]` 項目不接受行內 `apiKey` 欄位。

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

如需設定檔、環境變數及自訂基礎 URL 的資訊，請參閱[工具與自訂供應商](/zh-TW/gateway/config-tools)。

## 規則與行為

- 超過 `maxBytes` 的媒體會跳過該模型並嘗試下一個。
- 小於 1024 位元組的音訊檔案會被視為空白／損毀，並在轉錄前跳過；代理會改為取得確定性的預留轉錄內容。
- 若目前主要影像模型已原生支援視覺，OpenClaw 會略過 `[Image]` 摘要區塊，並將原始影像直接傳入模型。MiniMax 是例外：即使舊版 MiniMax M2.x 聊天中繼資料宣稱支援影像輸入，`minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 一律會透過外掛所擁有的 `MiniMax-VL-01` 媒體供應商路由影像理解（僅 `MiniMax-M3` 及更新版本會被視為原生支援視覺）。
- 若閘道／WebChat 的主要模型僅支援文字，影像附件會保留為已卸載的 `media://inbound/*` 參照，讓影像／PDF 工具或已設定的影像模型仍可檢查附件，而不會遺失附件。
- 明確執行 `openclaw infer image describe --file <path> --model <provider/model>`（別名：`openclaw capability image describe`）會直接執行該支援影像的供應商／模型；若在 `models.providers.ollama.models[]` 下設定了相符且支援影像的模型，也包括如 `ollama/qwen2.5vl:7b` 的 Ollama 參照。
- 若 `<capability>.enabled` 並非 `false`，但未設定任何模型，OpenClaw 會在目前回覆模型的供應商支援該能力時嘗試使用該模型。

### 自動偵測（預設）

當 `tools.media.<capability>.enabled` 並非 `false` 且未設定任何模型時，OpenClaw 會依序嘗試下列選項，並在第一個可用選項處停止：

<Steps>
  <Step title="已設定的影像模型（僅限影像）">
    `agents.defaults.imageModel` 的主要／備援參照，但目前回覆模型已原生支援視覺時除外。優先使用 `provider/model` 參照；只有在相符項目唯一時，才會從已設定且支援影像的供應商模型項目補全不含供應商的參照。
  </Step>
  <Step title="目前回覆模型">
    當其供應商支援該能力時，使用目前回覆模型。
  </Step>
  <Step title="供應商驗證資訊（僅限音訊，優先於本機命令列介面）">
    支援音訊且已設定的 `models.providers.*` 項目會優先於本機命令列介面嘗試。內建供應商優先順序（相同優先級依供應商 ID 字母排序）：Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral。
  </Step>
  <Step title="本機命令列介面（僅限音訊）">
    已就緒的本機執行檔會成為依序排列的備援清單：
    - 僅在目前處理程序中較早的模型呼叫曾偵測到 Metal 或 CUDA 後，才會優先使用 `whisper-cli`
    - 預設使用 CPU 的 `sherpa-onnx-offline`（需要 `SHERPA_ONNX_MODEL_DIR`，且其中須包含 `tokens.txt`／`encoder.onnx`／`decoder.onnx`／`joiner.onnx`）
    - 當加速能力僅存在於建置中或尚未觀察到時，使用 `whisper-cli`
    - 在 Apple Silicon 上使用 `parakeet-mlx`（具備 MLX 能力，但尚未觀察到裝置使用情形）
    - `whisper`（Python 命令列介面；預設使用 `turbo` 模型，並會自動下載）

    後端能力檢查結果會被快取，且不會載入模型。建置能力、要求的後端旗標，以及從實際呼叫觀察到的後端會維持分開。自動偵測到的 whisper.cpp 會保持啟用模型執行日誌，以便記錄上游所選後端的行。明確設定的命令列介面項目會保留其設定順序、後端旗標及輸出旗標。

  </Step>
  <Step title="供應商驗證資訊（影像／影片）">
    支援該能力且已設定的 `models.providers.*` 項目會優先於內建備援順序嘗試。若僅設定影像的供應商具有支援影像的模型，即使它不是內建供應商外掛，也會自動註冊至媒體理解功能。

    內建供應商優先順序（相同優先級依供應商 ID 字母排序）：
    - 影像：Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - 影片：Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="Antigravity 命令列介面（僅限影像／影片）">
    使用第一個已安裝的 `agy` 或 `antigravity` 執行檔（可透過 `OPENCLAW_ANTIGRAVITY_CLI` 覆寫），並以媒體所在目錄作為沙箱範圍。
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
在 macOS／Linux／Windows 上，執行檔偵測採盡力而為的方式；請確保命令列介面位於 `PATH`（會展開 `~`），或使用完整命令路徑設定明確的命令列介面模型項目。
</Note>

### Proxy 支援（音訊／影片供應商呼叫）

以供應商為基礎的**音訊**和**影片**理解功能會遵循標準輸出 Proxy 環境變數，包括 `NO_PROXY`／`no_proxy` 略過規則：`HTTPS_PROXY`、`HTTP_PROXY`、`ALL_PROXY`、`https_proxy`、`http_proxy`、`all_proxy`。小寫變數的優先順序高於大寫變數。若皆未設定，媒體理解功能會直接連出；若 Proxy 值格式錯誤，OpenClaw 會記錄警告並改用直接擷取。影像理解不會經過此 Proxy 路徑。

## 能力

在 `models[]` 項目上設定 `capabilities`，可將其限制為特定媒體類型。對於共用清單，OpenClaw 會依各內建供應商推斷預設值：

| 提供者                                                                   | 功能                 |
| ------------------------------------------------------------------------ | -------------------- |
| `openai`, `anthropic`, `minimax`                                         | 圖片                 |
| `minimax-portal`                                                         | 圖片                 |
| `moonshot`                                                               | 圖片 + 影片          |
| `openrouter`                                                             | 圖片 + 音訊          |
| `google`（Gemini API）                                                   | 圖片 + 音訊 + 影片   |
| `qwen`                                                                   | 圖片 + 影片          |
| `deepinfra`                                                              | 圖片 + 音訊          |
| `mistral`                                                                | 音訊                 |
| `zai`                                                                    | 圖片                 |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | 音訊                 |
| 任何包含支援圖片模型的 `models.providers.<id>.models[]` 目錄             | 圖片                 |

對於命令列介面項目，請明確設定 `capabilities`，以避免意外比對；若省略，該項目可用於其出現的每個功能清單。

## 提供者支援矩陣

| 功能 | 提供者                                                                                                                                                  | 備註                                                                                                                                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 圖片 | Anthropic、Codex app-server、Deepinfra、Google、MiniMax、MiniMax Portal、Moonshot、OpenAI、OpenAI Codex OAuth、OpenRouter、Qwen、Z.AI、設定提供者         | 廠商外掛會註冊圖片支援；`openai/*` 可使用 API 金鑰或 Codex OAuth 路由；`codex/*` 使用有界限的 Codex app-server 回合；支援圖片的設定提供者會自動註冊。                                          |
| 音訊 | Deepgram、Deepinfra、ElevenLabs、Google、Groq、Mistral、OpenAI、OpenRouter、SenseAudio、xAI                                                              | 提供者轉錄（Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral）。                                                                                                    |
| 影片 | Google、Moonshot、Qwen                                                                                                                                  | 透過廠商外掛提供影片理解功能；Qwen 影片理解使用標準 DashScope 端點。                                                                                                                         |

<Note>
**MiniMax 備註**：`minimax`、`minimax-cn`、`minimax-portal` 和 `minimax-portal-cn` 的圖片理解一律由外掛擁有的 `MiniMax-VL-01` 媒體提供者提供，即使舊版 MiniMax M2.x 聊天中繼資料聲稱支援圖片輸入也是如此。
</Note>

## 模型選擇指南

- 當品質與安全性至關重要時，請為每項媒體功能優先選用目前最強的新一代模型。
- 對於處理不受信任輸入且啟用工具的代理，請避免使用較舊或較弱的媒體模型。
- 每項功能至少保留一個備援，以確保可用性（高品質模型 + 更快或更便宜的模型）。
- 當提供者 API 無法使用時，命令列介面備援（`whisper-cli`、`whisper`、`gemini`）可提供協助。
- 已知的檔案輸出模式具有最高判定權：若推斷出的轉錄檔案為空或不存在，則不會產生轉錄，也不會退回使用命令列介面的進度輸出。
- `parakeet-mlx`：搭配 `--output-dir` 與預設的 `{filename}` 輸出範本使用 `--output-format txt`（或 `all`）。也會遵循上游的 `PARAKEET_OUTPUT_FORMAT` 和 `PARAKEET_OUTPUT_TEMPLATE` 環境變數。OpenClaw 會讀取 `<output-dir>/<media-basename>.txt`；預設的 `srt` 格式、其他格式及自訂輸出範本仍會使用標準輸出。

## 附件政策

各功能的 `attachments` 控制要處理哪些附件：

<ParamField path="mode" type='"first" | "all"' default="first">
  僅處理第一個選取的附件，或處理所有附件。
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  限制處理的附件數量。
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  在候選附件之間的選取偏好。
</ParamField>

當 `mode: "all"` 時，輸出會標示為 `[圖片 1/2]`、`[音訊 2/2]` 等。

### 檔案附件擷取

- 擷取出的檔案文字在附加至媒體提示詞前，會包裝為不受信任的外部內容，並使用如 `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` 的邊界標記，以及一行 `Source: External` 中繼資料。
- 此路徑會刻意省略較長的 `SECURITY NOTICE:` 橫幅，以保持媒體提示詞簡短；邊界標記與中繼資料仍然適用。
- 無法擷取文字的檔案會得到 `[無可擷取的文字]`。
- 若 PDF 退回使用彩現的頁面圖片，OpenClaw 會將這些圖片轉送至支援視覺功能的回覆模型，並在檔案區塊中保留預留文字 `[PDF 內容已彩現為圖片]`。

## 設定範例

<Tabs>
  <Tab title="Shared models + overrides">
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
  <Tab title="Image only">
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

執行媒體理解時，`/status` 會包含一行各功能摘要：

```
📎 Media: image ok (openai/gpt-5.6-sol) · audio ok (whisper-cli observed=metal)
```

若要進行預檢清查，請執行 `openclaw capability audio providers`。本機資料列會將本機備援的勝出項目，與全域提供者選擇、就緒狀態，以及各自獨立的可用、請求和觀察到的後端欄位分開顯示。同一項本機選擇也會作為資訊性 doctor 發現項目提供：

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## 備註

- 理解功能採盡力而為。錯誤不會阻止回覆。
- 即使理解功能已停用，附件仍會傳遞給模型。
- 使用 `scope` 限制執行理解功能的位置（例如僅限私訊）。

## 相關內容

- [設定](/zh-TW/gateway/configuration)
- [圖片與媒體支援](/zh-TW/nodes/images)
