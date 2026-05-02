---
read_when:
    - 您想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 訂閱驗證，而不是 API 金鑰
    - 你需要更嚴格的 GPT-5 代理執行行為
summary: 在 OpenClaw 中透過 API 金鑰或 Codex 訂閱使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-05-02T21:02:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0caf43895c1bc8494b1a0d4aeef98e575bb31aca047430a63156875bed3bb112
    source_path: providers/openai.md
    workflow: 16
---

OpenAI 提供 GPT 模型的開發者 API，而 Codex 也可透過 OpenAI 的 Codex 用戶端，以 ChatGPT 方案的程式碼代理形式使用。OpenClaw 會將這些介面分開，讓設定保持可預期。

OpenClaw 支援三種 OpenAI 系列路由。大多數想要 Codex 行為的 ChatGPT/Codex 訂閱者，應使用原生 Codex 應用程式伺服器執行階段。模型前綴會選取提供者/模型名稱；另一個獨立的執行階段設定則會選取由誰執行內嵌代理迴圈：

- **API 金鑰** - 使用依用量計費的直接 OpenAI Platform 存取 (`openai/*` models)
- **搭配原生 Codex 執行階段的 Codex 訂閱** - ChatGPT/Codex 登入加上 Codex 應用程式伺服器執行 (`openai/*` models plus `agents.defaults.agentRuntime.id: "codex"`)
- **透過 PI 使用 Codex 訂閱** - 使用一般 OpenClaw PI 執行器的 ChatGPT/Codex 登入 (`openai-codex/*` models)

OpenAI 明確支援在 OpenClaw 這類外部工具與工作流程中使用訂閱 OAuth。

提供者、模型、執行階段與頻道是分離的層級。如果這些標籤被混在一起，請先閱讀 [代理執行階段](/zh-TW/concepts/agent-runtimes)，再變更設定。

## 快速選擇

| 目標                                                 | 使用                                             | 備註                                                                      |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| 搭配原生 Codex 執行階段的 ChatGPT/Codex 訂閱        | `openai/gpt-5.5` 加上 `agentRuntime.id: "codex"` | 多數使用者建議的 Codex 設定。使用 `openai-codex` 驗證登入。              |
| 直接 API 金鑰計費                                   | `openai/gpt-5.5`                                 | 設定 `OPENAI_API_KEY` 或執行 OpenAI API 金鑰導覽設定。                   |
| 透過 PI 使用 ChatGPT/Codex 訂閱驗證                 | `openai-codex/gpt-5.5`                           | 只在你有意使用一般 PI 執行器時使用。                                     |
| 產生或編輯圖片                                      | `openai/gpt-image-2`                             | 可搭配 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。                      |
| 透明背景圖片                                        | `openai/gpt-image-1.5`                           | 使用 `outputFormat=png` 或 `webp`，以及 `openai.background=transparent`。 |

## 命名對照

這些名稱相似，但不能互換：

| 你看到的名稱                       | 層級             | 意義                                                                                              |
| ---------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | 提供者前綴       | 直接 OpenAI Platform API 路由。                                                                   |
| `openai-codex`                     | 提供者前綴       | 透過一般 OpenClaw PI 執行器使用的 OpenAI Codex OAuth/訂閱路由。                                  |
| `codex` plugin                     | Plugin           | 內建的 OpenClaw Plugin，提供原生 Codex 應用程式伺服器執行階段與 `/codex` 聊天控制。             |
| `agentRuntime.id: codex`           | 代理執行階段     | 強制內嵌回合使用原生 Codex 應用程式伺服器控制框架。                                             |
| `/codex ...`                       | 聊天命令集       | 從對話中繫結/控制 Codex 應用程式伺服器執行緒。                                                  |
| `runtime: "acp", agentId: "codex"` | ACP 工作階段路由 | 明確的後援路徑，透過 ACP/acpx 執行 Codex。                                                       |

這表示設定可以有意同時包含 `openai-codex/*` 與 `codex` plugin。當你想要透過 PI 使用 Codex OAuth，同時也希望可用原生 `/codex` 聊天控制時，這是有效的。`openclaw doctor` 會對該組合發出警告，讓你確認這是有意為之；它不會重寫設定。

<Note>
GPT-5.5 可透過直接 OpenAI Platform API 金鑰存取與訂閱/OAuth 路由使用。若要使用 ChatGPT/Codex 訂閱加上原生 Codex 執行，請使用 `openai/gpt-5.5` 搭配 `agentRuntime.id: "codex"`。只有在透過 PI 使用 Codex OAuth 時才使用 `openai-codex/gpt-5.5`；若要直接使用 `OPENAI_API_KEY` 流量，則使用未覆寫 Codex 執行階段的 `openai/gpt-5.5`。
</Note>

<Note>
啟用 OpenAI plugin，或選取 `openai-codex/*` 模型，並不會啟用內建的 Codex 應用程式伺服器 plugin。OpenClaw 只有在你以 `agentRuntime.id: "codex"` 明確選取原生 Codex 控制框架，或使用舊版 `codex/*` 模型參照時，才會啟用該 plugin。
如果內建的 `codex` plugin 已啟用，但 `openai-codex/*` 仍透過 PI 解析，`openclaw doctor` 會發出警告並讓路由保持不變。
</Note>

## OpenClaw 功能涵蓋範圍

| OpenAI 能力              | OpenClaw 介面                                             | 狀態                                                   |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------ |
| 聊天 / Responses         | `openai/<model>` 模型提供者                               | 是                                                     |
| Codex 訂閱模型           | 使用 `openai-codex` OAuth 的 `openai-codex/<model>`       | 是                                                     |
| Codex 應用程式伺服器控制框架 | 使用 `agentRuntime.id: codex` 的 `openai/<model>`          | 是                                                     |
| 伺服器端網頁搜尋         | 原生 OpenAI Responses 工具                                | 是，當已啟用網頁搜尋且未釘選提供者時                  |
| 圖片                     | `image_generate`                                           | 是                                                     |
| 影片                     | `video_generate`                                           | 是                                                     |
| 文字轉語音               | `messages.tts.provider: "openai"` / `tts`                  | 是                                                     |
| 批次語音轉文字           | `tools.media.audio` / 媒體理解                            | 是                                                     |
| 串流語音轉文字           | Voice Call `streaming.provider: "openai"`                  | 是                                                     |
| 即時語音                 | Voice Call `realtime.provider: "openai"` / Control UI Talk | 是                                                     |
| 嵌入                     | 記憶嵌入提供者                                             | 是                                                     |

## 記憶嵌入

OpenClaw 可將 OpenAI 或 OpenAI 相容的嵌入端點用於 `memory_search` 索引與查詢嵌入：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

對於需要非對稱嵌入標籤的 OpenAI 相容端點，請在 `memorySearch` 下設定 `queryInputType` 與 `documentInputType`。OpenClaw 會將它們作為提供者專屬的 `input_type` 請求欄位轉送：查詢嵌入使用 `queryInputType`；已索引的記憶片段與批次索引使用 `documentInputType`。完整範例請參閱[記憶設定參考](/zh-TW/reference/memory-config#provider-specific-config)。

## 開始使用

選擇偏好的驗證方式，並依照設定步驟操作。

<Tabs>
  <Tab title="API 金鑰 (OpenAI Platform)">
    **最適合：** 直接 API 存取與依用量計費。

    <Steps>
      <Step title="取得你的 API 金鑰">
        從 [OpenAI Platform dashboard](https://platform.openai.com/api-keys) 建立或複製 API 金鑰。
      </Step>
      <Step title="執行導覽設定">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        或直接傳入金鑰：

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="驗證模型可用">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照               | 執行階段設定                     | 路由                       | 驗證             |
    | ---------------------- | -------------------------------- | -------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API   | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API   | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex 應用程式伺服器控制框架 | Codex 應用程式伺服器 |

    <Note>
    `openai/*` 是直接 OpenAI API 金鑰路由，除非你明確強制使用 Codex 應用程式伺服器控制框架。若要透過預設 PI 執行器使用 Codex OAuth，請使用 `openai-codex/*`；若要原生 Codex 應用程式伺服器執行，請使用 `openai/gpt-5.5` 搭配 `agentRuntime.id: "codex"`。
    </Note>

    ### 設定範例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **不會**公開 `openai/gpt-5.3-codex-spark`。即時 OpenAI API 請求會拒絕該模型，目前的 Codex 目錄也未公開它。
    </Warning>

  </Tab>

  <Tab title="Codex 訂閱">
    **最適合：** 使用你的 ChatGPT/Codex 訂閱，搭配原生 Codex 應用程式伺服器執行，而不是使用個別 API 金鑰。Codex 雲端需要 ChatGPT 登入。

    <Steps>
      <Step title="執行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接執行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        對於無頭或不適合回呼的設定，請加入 `--device-code`，改用 ChatGPT 裝置碼流程登入，而不是 localhost 瀏覽器回呼：

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="使用原生 Codex 執行階段">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex","fallback":"none"}' --strict-json
        ```
      </Step>
      <Step title="驗證 Codex 驗證可用">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway 執行後，在聊天中傳送 `/codex status` 或 `/codex models`，以驗證原生應用程式伺服器執行階段。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照 | 執行階段設定 | 路由 | 驗證 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | 原生 Codex 應用程式伺服器控制框架 | Codex 登入或選取的 `openai-codex` 設定檔 |
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | 透過 PI 使用 ChatGPT/Codex OAuth | Codex 登入 |
    | `openai-codex/gpt-5.4-mini` | omitted / `runtime: "pi"` | 透過 PI 使用 ChatGPT/Codex OAuth | Codex 登入 |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | 仍為 PI，除非有 plugin 明確宣告 `openai-codex` | Codex 登入 |

    <Note>
    請繼續在 auth/profile 命令中使用 `openai-codex` 提供者 ID。
    `openai-codex/*` 模型前綴也是 Codex OAuth 的明確 PI 路由。
    它不會選取或自動啟用內建的 Codex app-server 執行架構。對於常見的訂閱加原生執行階段設定，請使用
    `openai-codex` 登入，但將模型參照保持為 `openai/gpt-5.5`，並設定
    `agentRuntime.id: "codex"`。
    </Note>

    ### 設定範例

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex", fallback: "none" },
        },
      },
    }
    ```

    若要改為讓 Codex OAuth 留在一般 PI runner 上，請使用
    `openai-codex/gpt-5.5`，並省略 Codex 執行階段覆寫。

    <Note>
    Onboarding 不再從 `~/.codex` 匯入 OAuth 材料。請使用瀏覽器 OAuth（預設）或上方的裝置碼流程登入；OpenClaw 會在自己的 agent auth store 中管理產生的憑證。
    </Note>

    ### 狀態指示器

    Chat `/status` 會顯示目前工作階段中啟用的模型執行階段。
    預設 PI 執行架構會顯示為 `Runtime: OpenClaw Pi Default`。選取內建 Codex app-server 執行架構時，`/status` 會顯示
    `Runtime: OpenAI Codex`。既有工作階段會保留其記錄的執行架構 ID，因此若你希望 `/status` 反映新的 PI/Codex 選擇，請在變更 `agentRuntime` 後使用
    `/new` 或 `/reset`。

    ### Doctor 警告

    如果內建的 `codex` Plugin 已啟用，同時選取了 `openai-codex/*` 路由，
    `openclaw doctor` 會警告該模型仍會透過 PI 解析。
    只有在刻意使用該 PI 訂閱驗證路由時，才保持設定不變。當你需要原生 Codex app-server 執行時，請切換為 `openai/<model>` 加上 `agentRuntime.id: "codex"`。

    ### 上下文視窗上限

    OpenClaw 會將模型中繼資料與執行階段上下文上限視為不同值。

    對於透過 Codex OAuth 使用的 `openai-codex/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 預設執行階段 `contextTokens` 上限：`272000`

    較小的預設上限在實務上具有更好的延遲與品質特性。可用 `contextTokens` 覆寫：

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    使用 `contextWindow` 宣告原生模型中繼資料。使用 `contextTokens` 限制執行階段上下文預算。
    </Note>

    ### 目錄復原

    當上游 Codex 目錄中繼資料包含 `gpt-5.5` 時，OpenClaw 會使用該中繼資料。
    如果即時 Codex 探索在帳戶已驗證時省略 `openai-codex/gpt-5.5` 列，
    OpenClaw 會合成該 OAuth 模型列，讓
    cron、sub-agent 與已設定預設模型的執行不會因
    `Unknown model` 而失敗。

  </Tab>
</Tabs>

## 原生 Codex app-server 驗證

原生 Codex app-server 執行架構使用 `openai/*` 模型參照加上
`agentRuntime.id: "codex"`，但其驗證仍以帳戶為基礎。OpenClaw
會依以下順序選取驗證：

1. 明確繫結到 agent 的 OpenClaw `openai-codex` auth profile。
2. app-server 的既有帳戶，例如本機 Codex CLI ChatGPT 登入。
3. 僅限本機 stdio app-server 啟動時，若 app-server 回報沒有帳戶且仍需要
   OpenAI 驗證，才使用 `CODEX_API_KEY`，接著使用
   `OPENAI_API_KEY`。

這表示本機 ChatGPT/Codex 訂閱登入不會只因 gateway 程序也有用於直接 OpenAI 模型或 embeddings 的 `OPENAI_API_KEY` 而被取代。Env API-key fallback 只適用於本機 stdio 無帳戶路徑；它不會被送到 WebSocket app-server 連線。選取訂閱樣式的 Codex profile 時，OpenClaw 也會避免把 `CODEX_API_KEY` 和 `OPENAI_API_KEY`
傳入產生的 stdio app-server 子程序，並透過 app-server login RPC 傳送選取的憑證。

## 圖片生成

內建的 `openai` Plugin 會透過 `image_generate` 工具註冊圖片生成。
它支援 OpenAI API-key 圖片生成，也支援透過相同 `openai/gpt-image-2` 模型參照進行 Codex OAuth 圖片生成。

| 能力                      | OpenAI API 金鑰                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型參照                  | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 驗證                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登入              |
| 傳輸                      | OpenAI Images API                  | Codex Responses 後端                 |
| 每次請求的最大圖片數      | 4                                  | 4                                    |
| 編輯模式                  | 已啟用（最多 5 張參考圖片）        | 已啟用（最多 5 張參考圖片）          |
| 尺寸覆寫                  | 支援，包括 2K/4K 尺寸              | 支援，包括 2K/4K 尺寸                |
| 長寬比 / 解析度           | 不轉送到 OpenAI Images API         | 安全時對應到支援的尺寸               |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
請參閱[圖片生成](/zh-TW/tools/image-generation)，了解共用工具參數、提供者選取與容錯移轉行為。
</Note>

`gpt-image-2` 是 OpenAI 文字轉圖片生成與圖片編輯的預設值。
`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作為明確的模型覆寫使用。
若要輸出透明背景 PNG/WebP，請使用 `openai/gpt-image-1.5`；目前的 `gpt-image-2` API 會拒絕
`background: "transparent"`。

對於透明背景請求，agent 應以
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及
`background: "transparent"` 呼叫 `image_generate`；較舊的 `openai.background` 提供者選項仍會被接受。OpenClaw 也會透過將預設 `openai/gpt-image-2` 透明請求改寫為 `gpt-image-1.5`，保護公開 OpenAI 與
OpenAI Codex OAuth 路由；Azure 與自訂 OpenAI 相容端點會保留其設定的部署/模型名稱。

相同設定也會暴露給 headless CLI 執行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

從輸入檔開始時，請對 `openclaw infer image edit` 使用相同的 `--output-format` 和 `--background` 旗標。
`--openai-background` 仍可作為 OpenAI 專用別名使用。

對於 Codex OAuth 安裝，請保留相同的 `openai/gpt-image-2` 參照。設定
`openai-codex` OAuth profile 時，OpenClaw 會解析該已儲存的 OAuth
access token，並透過 Codex Responses 後端傳送圖片請求。它不會先嘗試 `OPENAI_API_KEY`，也不會為該請求靜默 fallback 到 API 金鑰。當你需要直接 OpenAI Images API
路由時，請以 API 金鑰、自訂 base URL 或 Azure endpoint 明確設定 `models.providers.openai`。
如果該自訂圖片端點位於可信任的 LAN/私人位址，也請設定
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在此 opt-in，OpenClaw 會保持封鎖私人/內部 OpenAI 相容圖片端點。

生成：

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

生成透明 PNG：

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

編輯：

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 影片生成

內建的 `openai` Plugin 會透過 `video_generate` 工具註冊影片生成。

| 能力           | 值                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| 預設模型       | `openai/sora-2`                                                                   |
| 模式           | 文字轉影片、圖片轉影片、單一影片編輯                                             |
| 參考輸入       | 1 張圖片或 1 部影片                                                               |
| 尺寸覆寫       | 支援                                                                              |
| 其他覆寫       | `aspectRatio`、`resolution`、`audio`、`watermark` 會被忽略，並伴隨工具警告       |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、提供者選取與容錯移轉行為。
</Note>

## GPT-5 prompt 貢獻

OpenClaw 會為各提供者的 GPT-5 系列執行加入共用的 GPT-5 prompt 貢獻。它依模型 ID 套用，因此 `openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 與其他相容的 GPT-5 參照都會收到相同 overlay。較舊的 GPT-4.x 模型不會。

內建的原生 Codex 執行架構會透過 Codex app-server developer instructions 使用相同的 GPT-5 行為與 heartbeat overlay，因此透過 `agentRuntime.id: "codex"` 強制使用的 `openai/gpt-5.x` 工作階段，即使 Codex 擁有其餘執行架構 prompt，也會保留相同的後續執行與主動 heartbeat 指引。

GPT-5 貢獻會加入已標記的行為合約，涵蓋 persona 持續性、執行安全、工具紀律、輸出形態、完成檢查與驗證。特定 channel 的回覆與靜默訊息行為會保留在共用 OpenClaw system prompt 與 outbound delivery policy 中。GPT-5 指引會一律針對相符模型啟用。友善互動風格層是分開且可設定的。

| 值                     | 效果                         |
| ---------------------- | ------------------------------------------- |
| `"friendly"`（預設）   | 啟用友善互動風格層           |
| `"on"`                 | `"friendly"` 的別名          |
| `"off"`                | 僅停用友善風格層             |

<Tabs>
  <Tab title="設定">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
值在執行階段不分大小寫，因此 `"Off"` 和 `"off"` 都會停用友善風格層。
</Tip>

<Note>
當共用 `agents.defaults.promptOverlays.gpt5.personality` 設定未設定時，仍會讀取舊版 `plugins.entries.openai.config.personality` 作為相容性 fallback。
</Note>

## 語音與語音輸出

<AccordionGroup>
  <Accordion title="語音合成（TTS）">
    內建的 `openai` Plugin 會為 `messages.tts` surface 註冊語音合成。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 語音 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` |（未設定）|
    | 指示 | `messages.tts.providers.openai.instructions` |（未設定，僅 `gpt-4o-mini-tts`）|
    | 格式 | `messages.tts.providers.openai.responseFormat` | 語音記事使用 `opus`，檔案使用 `mp3` |
    | API 金鑰 | `messages.tts.providers.openai.apiKey` | 後援使用 `OPENAI_API_KEY` |
    | 基底 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 額外主體 | `messages.tts.providers.openai.extraBody` / `extra_body` |（未設定）|

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用語音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 會在 OpenClaw 產生的欄位之後合併到 `/audio/speech` 請求 JSON，因此可用於需要額外鍵（例如 `lang`）的 OpenAI 相容端點。原型鍵會被忽略。

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    設定 `OPENAI_TTS_BASE_URL` 可覆寫 TTS 基底 URL，而不影響聊天 API 端點。
    </Note>

  </Accordion>

  <Accordion title="語音轉文字">
    內建的 `openai` Plugin 會透過 OpenClaw 的媒體理解轉錄介面註冊批次語音轉文字。

    - 預設模型：`gpt-4o-transcribe`
    - 端點：OpenAI REST `/v1/audio/transcriptions`
    - 輸入路徑：多部分音訊檔案上傳
    - 在 OpenClaw 中，只要傳入音訊轉錄使用 `tools.media.audio`，即支援此功能，包括 Discord 語音頻道片段與頻道音訊附件

    若要強制對傳入音訊轉錄使用 OpenAI：

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    當共用音訊媒體設定或逐次呼叫的轉錄請求提供語言與提示提示時，這些資訊會轉送給 OpenAI。

  </Accordion>

  <Accordion title="即時轉錄">
    內建的 `openai` Plugin 會為 Voice Call Plugin 註冊即時轉錄。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 語言 | `...openai.language` |（未設定）|
    | 提示 | `...openai.prompt` |（未設定）|
    | 靜音持續時間 | `...openai.silenceDurationMs` | `800` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | API 金鑰 | `...openai.apiKey` | 後援使用 `OPENAI_API_KEY` |

    <Note>
    使用 WebSocket 連線至 `wss://api.openai.com/v1/realtime`，並搭配 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音訊。此串流提供者用於 Voice Call 的即時轉錄路徑；Discord 語音目前會錄製短片段，並改用批次 `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="即時語音">
    內建的 `openai` Plugin 會為 Voice Call Plugin 註冊即時語音。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 語音 | `...openai.voice` | `alloy` |
    | 溫度 | `...openai.temperature` | `0.8` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | 靜音持續時間 | `...openai.silenceDurationMs` | `500` |
    | API 金鑰 | `...openai.apiKey` | 後援使用 `OPENAI_API_KEY` |

    <Note>
    透過 `azureEndpoint` 和 `azureDeployment` 設定鍵支援 Azure OpenAI，用於後端即時橋接。支援雙向工具呼叫。使用 G.711 u-law 音訊格式。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 瀏覽器即時工作階段，搭配 Gateway 簽發的暫時用戶端密鑰，以及直接對 OpenAI Realtime API 進行的瀏覽器 WebRTC SDP 交換。維護者可使用 `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 進行即時驗證；OpenAI 端會在 Node 中簽發用戶端密鑰，使用假麥克風媒體產生瀏覽器 SDP offer，將其發送到 OpenAI，並套用 SDP answer，且不記錄密鑰。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端點

內建的 `openai` 提供者可透過覆寫基底 URL，將影像生成導向 Azure OpenAI 資源。在影像生成路徑上，OpenClaw 會偵測 `models.providers.openai.baseUrl` 上的 Azure 主機名稱，並自動切換為 Azure 的請求形狀。

<Note>
即時語音使用獨立的設定路徑（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），不受 `models.providers.openai.baseUrl` 影響。其 Azure 設定請參閱 [語音與語音合成](#voice-and-speech) 下的 **即時語音** 手風琴區塊。
</Note>

在以下情況使用 Azure OpenAI：

- 你已經有 Azure OpenAI 訂閱、配額或企業協議
- 你需要 Azure 提供的區域資料駐留或合規控制
- 你想將流量保留在既有 Azure 租用戶內

### 設定

若要透過內建的 `openai` 提供者使用 Azure 影像生成，請將 `models.providers.openai.baseUrl` 指向你的 Azure 資源，並將 `apiKey` 設定為 Azure OpenAI 金鑰（不是 OpenAI Platform 金鑰）：

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw 會識別下列 Azure 主機尾碼，用於 Azure 影像生成路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

對於已識別 Azure 主機上的影像生成請求，OpenClaw 會：

- 傳送 `api-key` 標頭，而不是 `Authorization: Bearer`
- 使用部署範圍路徑（`/openai/deployments/{deployment}/...`）
- 在每個請求附加 `?api-version=...`
- 對 Azure 影像生成呼叫使用 600 秒的預設請求逾時。逐次呼叫的 `timeoutMs` 值仍會覆寫此預設值。

其他基底 URL（公開 OpenAI、OpenAI 相容代理）會保留標準 OpenAI 影像請求形狀。

<Note>
`openai` 提供者影像生成路徑的 Azure 路由需要 OpenClaw 2026.4.22 或更新版本。較早版本會將任何自訂 `openai.baseUrl` 視為公開 OpenAI 端點，且會在對 Azure 影像部署呼叫時失敗。
</Note>

### API 版本

設定 `AZURE_OPENAI_API_VERSION`，可為 Azure 影像生成路徑固定特定 Azure preview 或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

變數未設定時，預設為 `2024-12-01-preview`。

### 模型名稱是部署名稱

Azure OpenAI 會將模型繫結到部署。對於透過內建 `openai` 提供者路由的 Azure 影像生成請求，OpenClaw 中的 `model` 欄位必須是你在 Azure 入口網站中設定的 **Azure 部署名稱**，而不是公開 OpenAI 模型 ID。

如果你建立名為 `gpt-image-2-prod`、提供 `gpt-image-2` 的部署：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

相同的部署名稱規則也適用於透過內建 `openai` 提供者路由的影像生成呼叫。

### 區域可用性

Azure 影像生成目前僅在部分區域可用（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、`uaenorth`）。建立部署前，請查看 Microsoft 目前的區域清單，並確認你的區域提供特定模型。

### 參數差異

Azure OpenAI 和公開 OpenAI 不一定總是接受相同的影像參數。Azure 可能會拒絕公開 OpenAI 允許的選項（例如 `gpt-image-2` 上某些 `background` 值），或只在特定模型版本上公開這些選項。這些差異來自 Azure 和底層模型，而不是 OpenClaw。如果 Azure 請求因驗證錯誤失敗，請在 Azure 入口網站中查看你的特定部署與 API 版本支援的參數集。

<Note>
Azure OpenAI 使用原生傳輸與相容行為，但不會收到 OpenClaw 的隱藏歸因標頭；請參閱 [進階設定](#advanced-configuration) 下的 **原生與 OpenAI 相容路由** 手風琴區塊。

對於 Azure 上的聊天或 Responses 流量（影像生成以外），請使用 onboarding 流程或專用 Azure 提供者設定，僅設定 `openai.baseUrl` 不會採用 Azure API/auth 形狀。另有獨立的 `azure-openai-responses/*` 提供者；請參閱下方的 Server-side compaction 手風琴區塊。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="傳輸（WebSocket 與 SSE）">
    OpenClaw 對 `openai/*` 和 `openai-codex/*` 都優先使用 WebSocket，並以 SSE 作為後援（`"auto"`）。

    在 `"auto"` 模式中，OpenClaw：
    - 在後援至 SSE 前，重試一次早期 WebSocket 失敗
    - 失敗後，將 WebSocket 標記為降級約 60 秒，並在冷卻期間使用 SSE
    - 為重試與重新連線附加穩定的工作階段與回合身分標頭
    - 在傳輸變體之間正規化用量計數器（`input_tokens` / `prompt_tokens`）

    | 值 | 行為 |
    |-------|----------|
    | `"auto"`（預設）| WebSocket 優先，SSE 後援 |
    | `"sse"` | 強制僅使用 SSE |
    | `"websocket"` | 強制僅使用 WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    相關 OpenAI 文件：
    - [透過 WebSocket 使用 Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [串流 API 回應（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket 預熱">
    OpenClaw 預設為 `openai/*` 和 `openai-codex/*` 啟用 WebSocket 預熱，以降低第一回合延遲。

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="快速模式">
    OpenClaw 為 `openai/*` 和 `openai-codex/*` 公開共用的快速模式切換：

    - **聊天/UI：** `/fast status|on|off`
    - **設定：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    啟用後，OpenClaw 會將快速模式對應到 OpenAI 優先處理（`service_tier = "priority"`）。既有的 `service_tier` 值會被保留，且快速模式不會重寫 `reasoning` 或 `text.verbosity`。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    工作階段覆寫優先於設定。在 Sessions UI 中清除工作階段覆寫，會讓工作階段回到設定的預設值。
    </Note>

  </Accordion>

  <Accordion title="優先處理（service_tier）">
    OpenAI 的 API 透過 `service_tier` 公開優先處理。請在 OpenClaw 中按模型設定：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    支援的值：`auto`、`default`、`flex`、`priority`。

    <Warning>
    `serviceTier` 只會轉送至原生 OpenAI 端點（`api.openai.com`）和原生 Codex 端點（`chatgpt.com/backend-api`）。如果你透過代理路由任一提供者，OpenClaw 會讓 `service_tier` 保持不變。
    </Warning>

  </Accordion>

  <Accordion title="伺服器端 Compaction（Responses API）">
    對於直接的 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI Plugin 的 Pi-harness 串流包裝器會自動啟用伺服器端 Compaction：

    - 強制 `store: true`（除非模型相容性設定了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 預設 `compact_threshold`：`contextWindow` 的 70%（或在無法取得時使用 `80000`）

    這適用於內建 Pi harness 路徑，以及嵌入式執行所使用的 OpenAI 提供者 hooks。原生 Codex 應用程式伺服器 harness 會透過 Codex 管理自己的內容脈絡，並使用 `agents.defaults.agentRuntime.id` 另行設定。

    <Tabs>
      <Tab title="明確啟用">
        適用於 Azure OpenAI Responses 等相容端點：

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="自訂閾值">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="停用">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` 只控制 `context_management` 注入。直接的 OpenAI Responses 模型仍會強制 `store: true`，除非相容性設定了 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT 模式">
    對於 `openai/*` 上的 GPT-5 系列執行，OpenClaw 可以使用更嚴格的嵌入式執行合約：

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    使用 `strict-agentic` 時，OpenClaw 會：
    - 當工具動作可用時，不再將只有計畫的回合視為成功進展
    - 使用立即執行引導重試該回合
    - 對實質工作自動啟用 `update_plan`
    - 如果模型持續只規劃而不行動，顯示明確的受阻狀態

    <Note>
    僅限 OpenAI 和 Codex GPT-5 系列執行。其他提供者和較舊的模型系列會保留預設行為。
    </Note>

  </Accordion>

  <Accordion title="原生路由與 OpenAI 相容路由">
    OpenClaw 會以不同方式處理直接的 OpenAI、Codex 和 Azure OpenAI 端點，以及通用 OpenAI 相容的 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 只對支援 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 對會拒絕 `reasoning.effort: "none"` 的模型或代理省略停用的推理
    - 預設將工具結構描述設為嚴格模式
    - 只在已驗證的原生主機上附加隱藏歸因標頭
    - 保留僅限 OpenAI 的請求塑形（`service_tier`、`store`、推理相容性、提示快取提示）

    **代理/相容路由：**
    - 使用較寬鬆的相容行為
    - 從非原生 `openai-completions` 酬載中移除 Completions `store`
    - 接受進階 `params.extra_body`/`params.extraBody` 傳遞 JSON，用於 OpenAI 相容的 Completions 代理
    - 接受 OpenAI 相容 Completions 代理（例如 vLLM）的 `params.chat_template_kwargs`
    - 不會強制使用嚴格工具結構描述或僅限原生的標頭

    Azure OpenAI 使用原生傳輸和相容行為，但不會收到隱藏歸因標頭。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和故障轉移行為。
  </Card>
  <Card title="圖片生成" href="/zh-TW/tools/image-generation" icon="image">
    共用圖片工具參數和提供者選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數和提供者選擇。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊和憑證重用規則。
  </Card>
</CardGroup>
