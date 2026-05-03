---
read_when:
    - 您想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 訂閱驗證，而不是 API 金鑰
    - 你需要更嚴格的 GPT-5 代理執行行為
summary: 在 OpenClaw 中透過 API 金鑰或 Codex 訂閱使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-05-03T21:42:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdffcdf53d9b17a19450c2ce47103db116e54a71a8dd432d981f5ece81cc38b3
    source_path: providers/openai.md
    workflow: 16
---

OpenAI 為 GPT 模型提供開發者 API，而 Codex 也可透過 OpenAI 的 Codex 用戶端，作為
ChatGPT 方案中的程式碼代理使用。OpenClaw 會將這些
介面分開，讓設定保持可預測。

OpenClaw 支援三種 OpenAI 系列路由。大多數想要 Codex 行為的 ChatGPT/Codex 訂閱者
應使用原生 Codex app-server 執行階段。
模型前綴會選擇提供者/模型名稱；另一個獨立的執行階段設定則會選擇
由誰執行嵌入式代理迴圈：

- **API 金鑰** - 使用依用量計費的直接 OpenAI Platform 存取（`openai/*` 模型）
- **搭配原生 Codex 執行階段的 Codex 訂閱** - ChatGPT/Codex 登入加上 Codex app-server 執行（`openai/*` 模型加上 `agents.defaults.agentRuntime.id: "codex"`）
- **透過 PI 的 Codex 訂閱** - 使用一般 OpenClaw PI 執行器的 ChatGPT/Codex 登入（`openai-codex/*` 模型）

OpenAI 明確支援在 OpenClaw 這類外部工具和工作流程中使用訂閱 OAuth。

提供者、模型、執行階段與通道是彼此分離的層級。如果這些標籤
被混在一起，請先閱讀[代理執行階段](/zh-TW/concepts/agent-runtimes)，再
變更設定。

## 快速選擇

| 目標                                                 | 使用                                             | 備註                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| 搭配原生 Codex 執行階段的 ChatGPT/Codex 訂閱 | `openai/gpt-5.5` 加上 `agentRuntime.id: "codex"` | 對大多數使用者建議的 Codex 設定。使用 `openai-codex` 驗證登入。 |
| 直接 API 金鑰計費                               | `openai/gpt-5.5`                                 | 設定 `OPENAI_API_KEY` 或執行 OpenAI API 金鑰導覽。                    |
| 透過 PI 的 ChatGPT/Codex 訂閱驗證           | `openai-codex/gpt-5.5`                           | 只有在你明確想使用一般 PI 執行器時才使用。                |
| 產生或編輯圖片                          | `openai/gpt-image-2`                             | 可搭配 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。                 |
| 透明背景圖片                        | `openai/gpt-image-1.5`                           | 使用 `outputFormat=png` 或 `webp`，並設定 `openai.background=transparent`。     |

## 命名對照

這些名稱相似，但不可互換：

| 你會看到的名稱                       | 層級             | 意義                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | 提供者前綴   | 直接 OpenAI Platform API 路由。                                                                 |
| `openai-codex`                     | 提供者前綴   | 透過一般 OpenClaw PI 執行器的 OpenAI Codex OAuth/訂閱路由。                      |
| `codex` plugin                     | Plugin            | 隨附的 OpenClaw Plugin，提供原生 Codex app-server 執行階段和 `/codex` 聊天控制。 |
| `agentRuntime.id: codex`           | 代理執行階段     | 強制嵌入式回合使用原生 Codex app-server 執行環境。                                     |
| `/codex ...`                       | 聊天命令集  | 從對話中綁定/控制 Codex app-server 執行緒。                                        |
| `runtime: "acp", agentId: "codex"` | ACP 工作階段路由 | 透過 ACP/acpx 執行 Codex 的明確後備路徑。                                          |

這表示設定可以刻意同時包含 `openai-codex/*` 和
`codex` plugin。當你想要透過 PI 使用 Codex OAuth，同時也想要
原生 `/codex` 聊天控制可用時，這是有效的。`openclaw doctor` 會針對該
組合提出警告，讓你確認這是有意為之；它不會重寫設定。

<Note>
GPT-5.5 可透過直接 OpenAI Platform API 金鑰存取，以及
訂閱/OAuth 路由使用。若要使用 ChatGPT/Codex 訂閱加上原生 Codex
執行，請使用 `openai/gpt-5.5` 搭配 `agentRuntime.id: "codex"`。只有在透過 PI 使用 Codex OAuth 時才使用
`openai-codex/gpt-5.5`；或者在沒有 Codex 執行階段覆寫時使用 `openai/gpt-5.5`
來處理直接 `OPENAI_API_KEY` 流量。
</Note>

<Note>
啟用 OpenAI plugin，或選擇 `openai-codex/*` 模型，並不會
啟用隨附的 Codex app-server plugin。OpenClaw 只有在你以
`agentRuntime.id: "codex"` 明確選擇原生 Codex 執行環境，或使用舊版 `codex/*` 模型參照時，才會啟用該 plugin。
如果隨附的 `codex` plugin 已啟用，但 `openai-codex/*` 仍透過 PI 解析，
`openclaw doctor` 會提出警告並保持路由不變。
</Note>

## OpenClaw 功能涵蓋範圍

| OpenAI 能力         | OpenClaw 介面                                           | 狀態                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| 聊天 / Responses          | `openai/<model>` 模型提供者                            | 是                                                    |
| Codex 訂閱模型 | 使用 `openai-codex` OAuth 的 `openai-codex/<model>`           | 是                                                    |
| Codex app-server 執行環境  | 使用 `agentRuntime.id: codex` 的 `openai/<model>`             | 是                                                    |
| 伺服器端網頁搜尋    | 原生 OpenAI Responses 工具                               | 是，當網頁搜尋已啟用且未固定提供者時 |
| 圖片                    | `image_generate`                                           | 是                                                    |
| 影片                    | `video_generate`                                           | 是                                                    |
| 文字轉語音            | `messages.tts.provider: "openai"` / `tts`                  | 是                                                    |
| 批次語音轉文字      | `tools.media.audio` / 媒體理解                  | 是                                                    |
| 串流語音轉文字  | Voice Call `streaming.provider: "openai"`                  | 是                                                    |
| 即時語音            | Voice Call `realtime.provider: "openai"` / Control UI Talk | 是                                                    |
| 嵌入                | 記憶體嵌入提供者                                  | 是                                                    |

## 記憶體嵌入

OpenClaw 可使用 OpenAI，或 OpenAI 相容的嵌入端點，來處理
`memory_search` 索引與查詢嵌入：

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

對於需要非對稱嵌入標籤的 OpenAI 相容端點，請在
`memorySearch` 底下設定 `queryInputType` 和 `documentInputType`。OpenClaw 會將
這些值轉送為提供者專屬的 `input_type` 請求欄位：查詢嵌入使用
`queryInputType`；已索引的記憶體片段和批次索引使用
`documentInputType`。完整範例請參閱[記憶體設定參考](/zh-TW/reference/memory-config#provider-specific-config)。

## 開始使用

選擇偏好的驗證方式並依照設定步驟操作。

<Tabs>
  <Tab title="API 金鑰 (OpenAI Platform)">
    **最適合：**直接 API 存取與依用量計費。

    <Steps>
      <Step title="取得你的 API 金鑰">
        從 [OpenAI Platform dashboard](https://platform.openai.com/api-keys) 建立或複製 API 金鑰。
      </Step>
      <Step title="執行導覽">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        或直接傳入金鑰：

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照              | 執行階段設定             | 路由                       | 驗證             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex app-server 執行環境    | Codex app-server |

    <Note>
    除非你明確強制使用 Codex app-server 執行環境，否則 `openai/*`
    是直接 OpenAI API 金鑰路由。使用 `openai-codex/*` 可透過
    預設 PI 執行器使用 Codex OAuth；或使用 `openai/gpt-5.5` 搭配
    `agentRuntime.id: "codex"` 來進行原生 Codex app-server 執行。
    </Note>

    ### 設定範例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **不會**公開 `openai/gpt-5.3-codex-spark`。即時 OpenAI API 請求會拒絕該模型，而且目前的 Codex 目錄也未公開它。
    </Warning>

  </Tab>

  <Tab title="Codex 訂閱">
    **最適合：**使用你的 ChatGPT/Codex 訂閱，並搭配原生 Codex app-server 執行，而不是使用另一個 API 金鑰。Codex 雲端需要 ChatGPT 登入。

    <Steps>
      <Step title="執行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接執行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        對於無頭或不適合回呼的設定，加入 `--device-code`，改用 ChatGPT 裝置碼流程登入，而不是 localhost 瀏覽器回呼：

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="使用原生 Codex 執行階段">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="確認 Codex 驗證可用">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway 執行後，在聊天中傳送 `/codex status` 或 `/codex models`
        以確認原生 app-server 執行階段。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照 | 執行階段設定 | 路由 | 驗證 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | 原生 Codex app-server 執行環境 | Codex 登入或選取的 `openai-codex` 設定檔 |
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | 透過 PI 的 ChatGPT/Codex OAuth | Codex 登入 |
    | `openai-codex/gpt-5.4-mini` | omitted / `runtime: "pi"` | 透過 PI 的 ChatGPT/Codex OAuth | Codex 登入 |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | 仍為 PI，除非某個 plugin 明確宣告 `openai-codex` | Codex 登入 |

    <Note>
    請繼續將 `openai-codex` provider id 用於驗證/設定檔命令。
    `openai-codex/*` 模型前綴也是 Codex OAuth 的明確 PI 路由。
    它不會選取或自動啟用隨附的 Codex app-server 執行框架。對於
    常見的訂閱加原生執行環境設定，請使用 `openai-codex` 登入，
    但將模型 ref 保持為 `openai/gpt-5.5`，並設定
    `agentRuntime.id: "codex"`。
    </Note>

    ### 設定範例

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    若要改為讓 Codex OAuth 保持在一般 PI runner 上，請使用
    `openai-codex/gpt-5.5`，並省略 Codex 執行環境覆寫。

    <Note>
    Onboarding 不再從 `~/.codex` 匯入 OAuth 資料。請使用瀏覽器 OAuth（預設）或上述裝置碼流程登入；OpenClaw 會在自身的 agent 驗證儲存區中管理產生的憑證。
    </Note>

    ### 狀態指示器

    Chat `/status` 會顯示目前工作階段作用中的模型執行環境。
    預設 PI 執行框架會顯示為 `Runtime: OpenClaw Pi Default`。選取
    隨附的 Codex app-server 執行框架時，`/status` 會顯示
    `Runtime: OpenAI Codex`。既有工作階段會保留其記錄的執行框架 id，因此如果你想讓 `/status`
    反映新的 PI/Codex 選擇，請在變更 `agentRuntime` 後使用
    `/new` 或 `/reset`。

    ### Doctor 警告

    如果隨附的 `codex` Plugin 在已選取 `openai-codex/*` 路由時啟用，
    `openclaw doctor` 會警告模型仍會透過 PI 解析。
    只有在該 PI 訂閱驗證路由是刻意使用時，才保持設定不變。當你想要
    原生 Codex app-server 執行時，請切換為 `openai/<model>` 加上 `agentRuntime.id: "codex"`。

    ### 上下文視窗上限

    OpenClaw 會將模型中繼資料與執行環境上下文上限視為不同的值。

    對於透過 Codex OAuth 使用的 `openai-codex/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 預設執行環境 `contextTokens` 上限：`272000`

    較小的預設上限在實務上具備較佳的延遲與品質特性。請使用 `contextTokens` 覆寫它：

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
    使用 `contextWindow` 宣告原生模型中繼資料。使用 `contextTokens` 限制執行環境上下文預算。
    </Note>

    ### 目錄復原

    當上游 Codex 目錄中繼資料存在時，OpenClaw 會將其用於 `gpt-5.5`。
    如果即時 Codex 探索在帳戶已驗證時省略 `openai-codex/gpt-5.5` 列，
    OpenClaw 會合成該 OAuth 模型列，讓
    cron、sub-agent 與已設定的預設模型執行不會因
    `Unknown model` 而失敗。

  </Tab>
</Tabs>

## 原生 Codex app-server 驗證

原生 Codex app-server 執行框架使用 `openai/*` 模型 ref 加上
`agentRuntime.id: "codex"`，但其驗證仍以帳戶為基礎。OpenClaw
會依照以下順序選取驗證：

1. 明確繫結到 agent 的 OpenClaw `openai-codex` 驗證設定檔。
2. app-server 既有帳戶，例如本機 Codex CLI ChatGPT 登入。
3. 僅限本機 stdio app-server 啟動時，在 app-server 回報沒有帳戶且仍需要
   OpenAI 驗證時，依序使用 `CODEX_API_KEY`，再使用
   `OPENAI_API_KEY`。

這表示本機 ChatGPT/Codex 訂閱登入不會只因為 gateway 程序同時擁有用於直接 OpenAI 模型
或嵌入的 `OPENAI_API_KEY` 而被取代。Env API-key 後援只適用於本機 stdio 無帳戶路徑；它
不會傳送到 WebSocket app-server 連線。選取訂閱樣式的 Codex
設定檔時，OpenClaw 也會將 `CODEX_API_KEY` 和 `OPENAI_API_KEY`
排除在產生的 stdio app-server 子程序之外，並透過 app-server login RPC 傳送選定的憑證。

## 圖像生成

隨附的 `openai` Plugin 會透過 `image_generate` 工具註冊圖像生成。
它透過同一個 `openai/gpt-image-2` 模型 ref，同時支援 OpenAI API-key 圖像生成與 Codex OAuth 圖像生成。

| 能力                      | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型 ref                  | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 驗證                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登入              |
| 傳輸                      | OpenAI Images API                  | Codex Responses 後端                 |
| 每次請求的最大圖像數      | 4                                  | 4                                    |
| 編輯模式                  | 已啟用（最多 5 張參考圖像）        | 已啟用（最多 5 張參考圖像）          |
| 尺寸覆寫                  | 支援，包含 2K/4K 尺寸              | 支援，包含 2K/4K 尺寸                |
| 長寬比 / 解析度           | 不轉送至 OpenAI Images API         | 安全時會對應到受支援的尺寸           |

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
請參閱[圖像生成](/zh-TW/tools/image-generation)，了解共用工具參數、provider 選擇與故障轉移行為。
</Note>

`gpt-image-2` 是 OpenAI 文字轉圖像生成與圖像編輯的預設值。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作為
明確的模型覆寫使用。若要輸出透明背景 PNG/WebP，請使用 `openai/gpt-image-1.5`；目前的 `gpt-image-2` API 會拒絕
`background: "transparent"`。

對於透明背景請求，agent 應呼叫 `image_generate`，並使用
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及
`background: "transparent"`；較舊的 `openai.background` provider 選項
仍可接受。OpenClaw 也會保護公開 OpenAI 與
OpenAI Codex OAuth 路由，方式是將預設 `openai/gpt-image-2` 的透明
請求改寫為 `gpt-image-1.5`；Azure 與自訂 OpenAI 相容端點會保留
其設定的部署/模型名稱。

相同設定也會暴露給 headless CLI 執行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

從輸入檔案開始時，請對 `openclaw infer image edit` 使用相同的 `--output-format` 與 `--background` 旗標。
`--openai-background` 仍可作為 OpenAI 專用別名使用。

對於 Codex OAuth 安裝，請保持相同的 `openai/gpt-image-2` ref。當已設定
`openai-codex` OAuth 設定檔時，OpenClaw 會解析該儲存的 OAuth
存取權杖，並透過 Codex Responses 後端傳送圖像請求。它
不會先嘗試 `OPENAI_API_KEY`，也不會針對該請求悄悄後援到 API key。
當你想改用直接 OpenAI Images API
路由時，請明確使用 API key、自訂 base URL 或 Azure 端點設定 `models.providers.openai`。
如果該自訂圖像端點位於受信任的 LAN/私人位址上，還要設定
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在此 opt-in，
OpenClaw 會持續封鎖私人/內部 OpenAI 相容圖像端點。

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

隨附的 `openai` Plugin 會透過 `video_generate` 工具註冊影片生成。

| 能力           | 值                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| 預設模型       | `openai/sora-2`                                                                   |
| 模式           | 文字轉影片、圖像轉影片、單一影片編輯                                             |
| 參考輸入       | 1 張圖像或 1 部影片                                                               |
| 尺寸覆寫       | 支援                                                                              |
| 其他覆寫       | `aspectRatio`、`resolution`、`audio`、`watermark` 會被忽略並附帶工具警告          |

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
請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、provider 選擇與故障轉移行為。
</Note>

## GPT-5 prompt 貢獻

OpenClaw 會為跨 provider 的 GPT-5 系列執行加入共用 GPT-5 prompt 貢獻。它會依模型 id 套用，因此 `openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 與其他相容的 GPT-5 ref 都會收到相同的 overlay。較舊的 GPT-4.x 模型不會。

隨附的原生 Codex 執行框架會透過 Codex app-server developer instructions 使用相同的 GPT-5 行為與 heartbeat overlay，因此透過 `agentRuntime.id: "codex"` 強制使用的 `openai/gpt-5.x` 工作階段，仍會保留相同的後續跟進與主動 Heartbeat 指引，即使 Codex 擁有其餘的執行框架 prompt。

GPT-5 貢獻會為 persona 持續性、執行安全、工具紀律、輸出形態、完成檢查與驗證加入帶標籤的行為契約。特定 channel 的回覆與靜默訊息行為會保留在共用 OpenClaw 系統 prompt 與輸出傳遞政策中。GPT-5 指引永遠會對符合的模型啟用。友善互動風格層則是獨立且可設定的。

| 值                     | 效果                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"`（預設）   | 啟用友善互動風格層 |
| `"on"`                 | `"friendly"` 的別名                      |
| `"off"`                | 只停用友善風格層       |

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
值在執行時不區分大小寫，因此 `"Off"` 與 `"off"` 都會停用友善風格層。
</Tip>

<Note>
當共用的 `agents.defaults.promptOverlays.gpt5.personality` 設定未設定時，仍會讀取舊版 `plugins.entries.openai.config.personality` 作為相容性後援。
</Note>

## 語音與語音輸出

<AccordionGroup>
  <Accordion title="語音合成 (TTS)">
    隨附的 `openai` Plugin 會為 `messages.tts` 介面註冊語音合成。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 語音 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | (未設定) |
    | 指示 | `messages.tts.providers.openai.instructions` | (未設定，僅限 `gpt-4o-mini-tts`) |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 語音訊息使用 `opus`，檔案使用 `mp3` |
    | API 金鑰 | `messages.tts.providers.openai.apiKey` | 退回使用 `OPENAI_API_KEY` |
    | 基底 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 額外主體 | `messages.tts.providers.openai.extraBody` / `extra_body` | (未設定) |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用語音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 會在 OpenClaw 產生的欄位之後合併到 `/audio/speech` 請求 JSON 中，因此可將它用於需要額外鍵（例如 `lang`）的 OpenAI 相容端點。原型鍵會被忽略。

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

  <Accordion title="Speech-to-text">
    內建的 `openai` Plugin 會透過
    OpenClaw 的媒體理解轉錄介面註冊批次語音轉文字。

    - 預設模型：`gpt-4o-transcribe`
    - 端點：OpenAI REST `/v1/audio/transcriptions`
    - 輸入路徑：多部分音訊檔案上傳
    - 在 OpenClaw 中，凡是入站音訊轉錄使用
      `tools.media.audio` 的地方都支援，包括 Discord 語音頻道片段和頻道
      音訊附件

    若要強制入站音訊轉錄使用 OpenAI：

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

    語言和提示提示詞會在共用音訊媒體設定或每次呼叫的轉錄請求提供時轉送給 OpenAI。

  </Accordion>

  <Accordion title="Realtime transcription">
    內建的 `openai` Plugin 會為 Voice Call Plugin 註冊即時轉錄。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 語言 | `...openai.language` | (未設定) |
    | 提示詞 | `...openai.prompt` | (未設定) |
    | 靜音持續時間 | `...openai.silenceDurationMs` | `800` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | API 金鑰 | `...openai.apiKey` | 退回使用 `OPENAI_API_KEY` |

    <Note>
    使用 WebSocket 連線至 `wss://api.openai.com/v1/realtime`，並採用 G.711 u-law (`g711_ulaw` / `audio/pcmu`) 音訊。此串流提供者用於 Voice Call 的即時轉錄路徑；Discord 語音目前會錄製短片段，並改用批次 `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    內建的 `openai` Plugin 會為 Voice Call Plugin 註冊即時語音。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 語音 | `...openai.voice` | `alloy` |
    | 溫度 | `...openai.temperature` | `0.8` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | 靜音持續時間 | `...openai.silenceDurationMs` | `500` |
    | API 金鑰 | `...openai.apiKey` | 退回使用 `OPENAI_API_KEY` |

    <Note>
    透過 `azureEndpoint` 和 `azureDeployment` 設定鍵，支援 Azure OpenAI 用於後端即時橋接。支援雙向工具呼叫。使用 G.711 u-law 音訊格式。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 瀏覽器即時工作階段，搭配 Gateway 簽發的
    臨時用戶端秘密，以及瀏覽器對
    OpenAI Realtime API 的直接 WebRTC SDP 交換。維護者可使用
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    進行即時驗證；OpenAI 端會在 Node 中簽發用戶端秘密，使用假麥克風媒體產生瀏覽器 SDP offer，
    將其提交至 OpenAI，並套用 SDP answer，
    且不記錄秘密。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端點

內建的 `openai` 提供者可以透過覆寫基底 URL，將影像
生成導向 Azure OpenAI 資源。在影像生成路徑上，OpenClaw
會偵測 `models.providers.openai.baseUrl` 上的 Azure 主機名稱，並自動切換到
Azure 的請求形狀。

<Note>
即時語音使用獨立的設定路徑
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)，
不受 `models.providers.openai.baseUrl` 影響。請參閱 [Voice and speech](#voice-and-speech) 下方的 **Realtime
voice** 摺疊區塊以了解其 Azure
設定。
</Note>

在下列情況使用 Azure OpenAI：

- 你已經有 Azure OpenAI 訂閱、配額或企業合約
- 你需要 Azure 提供的區域資料駐留或合規控制
- 你想將流量保留在現有 Azure 租用戶內

### 設定

若要透過內建的 `openai` 提供者使用 Azure 影像生成，請將
`models.providers.openai.baseUrl` 指向你的 Azure 資源，並將 `apiKey` 設為
Azure OpenAI 金鑰（不是 OpenAI Platform 金鑰）：

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

OpenClaw 會將下列 Azure 主機尾碼辨識為 Azure 影像生成
路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

對於已辨識 Azure 主機上的影像生成請求，OpenClaw 會：

- 傳送 `api-key` 標頭，而不是 `Authorization: Bearer`
- 使用部署範圍路徑 (`/openai/deployments/{deployment}/...`)
- 將 `?api-version=...` 附加到每個請求
- 對 Azure 影像生成呼叫使用 600 秒的預設請求逾時。
  每次呼叫的 `timeoutMs` 值仍會覆寫此預設值。

其他基底 URL（公開 OpenAI、OpenAI 相容代理）會保留標準
OpenAI 影像請求形狀。

<Note>
`openai` 提供者影像生成路徑的 Azure 路由需要
OpenClaw 2026.4.22 或更新版本。較早版本會將任何自訂
`openai.baseUrl` 視為公開 OpenAI 端點，並在對 Azure
影像部署呼叫時失敗。
</Note>

### API 版本

設定 `AZURE_OPENAI_API_VERSION`，可為 Azure 影像生成路徑釘選特定 Azure 預覽版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未設定該變數時，預設值為 `2024-12-01-preview`。

### 模型名稱就是部署名稱

Azure OpenAI 會將模型繫結到部署。對於透過內建 `openai` 提供者
路由的 Azure 影像生成請求，OpenClaw 中的 `model` 欄位
必須是你在 Azure 入口網站設定的 **Azure 部署名稱**，而不是
公開 OpenAI 模型 ID。

如果你建立了一個名為 `gpt-image-2-prod`、提供 `gpt-image-2` 的部署：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同樣的部署名稱規則也適用於透過
內建 `openai` 提供者路由的影像生成呼叫。

### 區域可用性

Azure 影像生成目前僅在部分區域可用
（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。建立部署前，請查看 Microsoft 目前的區域清單，
並確認你的區域提供特定模型。

### 參數差異

Azure OpenAI 和公開 OpenAI 不一定總是接受相同的影像參數。
Azure 可能會拒絕公開 OpenAI 允許的選項（例如 `gpt-image-2` 上的某些
`background` 值），或只在特定模型
版本上公開這些選項。這些差異來自 Azure 和底層模型，而不是
OpenClaw。如果 Azure 請求因驗證錯誤而失敗，請在
Azure 入口網站中檢查你的特定部署和 API 版本所支援的
參數集。

<Note>
Azure OpenAI 使用原生傳輸和相容行為，但不會接收
OpenClaw 的隱藏歸因標頭；請參閱 [Advanced configuration](#advanced-configuration) 下方的 **Native vs OpenAI-compatible
routes** 摺疊區塊。

對於 Azure 上的聊天或 Responses 流量（影像生成以外），請使用
導覽流程或專用 Azure 提供者設定；單獨設定 `openai.baseUrl`
不會採用 Azure API/驗證形狀。另有一個
`azure-openai-responses/*` 提供者；請參閱下方的伺服器端 Compaction 摺疊區塊。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw 對 `openai/*` 和 `openai-codex/*` 都優先使用 WebSocket，並以 SSE 作為後援 (`"auto"`)。

    在 `"auto"` 模式中，OpenClaw 會：
    - 在退回到 SSE 前，重試一次早期 WebSocket 失敗
    - 失敗後，將 WebSocket 標記為降級約 60 秒，並在冷卻期間使用 SSE
    - 為重試和重新連線附加穩定的工作階段與回合識別標頭
    - 在傳輸變體之間正規化使用量計數器 (`input_tokens` / `prompt_tokens`)

    | 值 | 行為 |
    |-------|----------|
    | `"auto"` (預設) | WebSocket 優先，SSE 後援 |
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
    - [使用 WebSocket 的 Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [串流 API 回應 (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
    OpenClaw 預設會為 `openai/*` 和 `openai-codex/*` 啟用 WebSocket 暖機，以降低第一回合延遲。

    ```json5
    // 停用暖機
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

  <Accordion title="Fast mode">
    OpenClaw 為 `openai/*` 和 `openai-codex/*` 提供共用的快速模式切換：

    - **聊天/UI：** `/fast status|on|off`
    - **設定：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    啟用後，OpenClaw 會將快速模式對應到 OpenAI 優先處理 (`service_tier = "priority"`)。既有的 `service_tier` 值會保留，快速模式不會重寫 `reasoning` 或 `text.verbosity`。

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
    工作階段覆寫優先於設定。在 Sessions UI 中清除工作階段覆寫會讓工作階段回到已設定的預設值。
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    OpenAI 的 API 透過 `service_tier` 提供優先處理。請在 OpenClaw 中針對每個模型設定：

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
    `serviceTier` 只會轉送到原生 OpenAI 端點（`api.openai.com`）和原生 Codex 端點（`chatgpt.com/backend-api`）。如果你將任一提供者透過代理路由，OpenClaw 會保留 `service_tier` 不變。
    </Warning>

  </Accordion>

  <Accordion title="伺服器端 Compaction（Responses API）">
    對於直接的 OpenAI Responses 模型（`openai/*` 於 `api.openai.com`），OpenAI Plugin 的 Pi-harness 串流包裝器會自動啟用伺服器端 Compaction：

    - 強制 `store: true`（除非模型相容性設定了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 預設 `compact_threshold`：`contextWindow` 的 70%（無法取得時為 `80000`）

    這適用於內建 Pi harness 路徑，以及嵌入式執行使用的 OpenAI 提供者 hook。原生 Codex app-server harness 會透過 Codex 管理自己的上下文，並以 `agents.defaults.agentRuntime.id` 分開設定。

    <Tabs>
      <Tab title="明確啟用">
        適用於 Azure OpenAI Responses 這類相容端點：

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

  <Accordion title="嚴格代理式 GPT 模式">
    對於在 `openai/*` 上執行的 GPT-5 系列，OpenClaw 可以使用更嚴格的嵌入式執行合約：

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
    - 以立即行動的導引重試該回合
    - 對大量工作自動啟用 `update_plan`
    - 如果模型持續只規劃而不行動，顯示明確的受阻狀態

    <Note>
    僅限於 OpenAI 和 Codex GPT-5 系列執行。其他提供者和較舊的模型系列保留預設行為。
    </Note>

  </Accordion>

  <Accordion title="原生與 OpenAI 相容路由">
    OpenClaw 會以不同方式處理直接的 OpenAI、Codex 和 Azure OpenAI 端點，以及泛用的 OpenAI 相容 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 只有支援 OpenAI `none` effort 的模型，才保留 `reasoning: { effort: "none" }`
    - 對於會拒絕 `reasoning.effort: "none"` 的模型或代理，省略停用的 reasoning
    - 預設將工具 schema 設為嚴格模式
    - 只在已驗證的原生主機上附加隱藏的歸因標頭
    - 保留 OpenAI 專用的請求塑形（`service_tier`、`store`、reasoning 相容性、prompt-cache 提示）

    **代理／相容路由：**
    - 使用較寬鬆的相容行為
    - 從非原生 `openai-completions` 酬載中移除 Completions `store`
    - 接受進階 `params.extra_body`／`params.extraBody` 透傳 JSON，用於 OpenAI 相容的 Completions 代理
    - 接受 `params.chat_template_kwargs`，用於 vLLM 等 OpenAI 相容的 Completions 代理
    - 不強制使用嚴格工具 schema 或僅限原生的標頭

    Azure OpenAI 使用原生傳輸和相容行為，但不會收到隱藏的歸因標頭。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="圖片生成" href="/zh-TW/tools/image-generation" icon="image">
    共用圖片工具參數和提供者選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數和提供者選擇。
  </Card>
  <Card title="OAuth 和驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資料和憑證重用規則。
  </Card>
</CardGroup>
