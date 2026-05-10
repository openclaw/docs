---
read_when:
    - 您想在 OpenClaw 中使用 OpenAI 模型
    - 您想使用 Codex 訂閱驗證，而不是 API 金鑰
    - 你需要更嚴格的 GPT-5 代理執行行為
summary: 在 OpenClaw 中透過 API 金鑰或 Codex 訂閱使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-05-10T19:49:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5022874c9517e670b70ba90fb400f99f850746c341cb6e967c2abc96d8255548
    source_path: providers/openai.md
    workflow: 16
---

OpenAI 為 GPT 模型提供開發者 API，Codex 也可透過 OpenAI 的 Codex 用戶端作為
ChatGPT 方案的程式設計代理使用。OpenClaw 將這些介面分開，以保持設定可預測。

OpenClaw 使用 `openai/*` 作為標準 OpenAI 模型路由。OpenAI 模型上的嵌入式代理
回合預設會透過原生 Codex app-server 執行環境執行；直接 OpenAI API 金鑰驗證仍可用於
非代理 OpenAI 介面，例如影像、嵌入、語音和即時功能。

- **代理模型** - 透過 Codex 執行環境使用 `openai/*` 模型；使用
  `openai-codex` 驗證登入以使用 ChatGPT/Codex 訂閱，或在你明確想使用 API 金鑰驗證時設定
  `openai-codex` API 金鑰設定檔。
- **非代理 OpenAI API** - 透過 `OPENAI_API_KEY` 或 OpenAI API 金鑰引導流程，
  以用量計費方式直接存取 OpenAI Platform。
- **舊版設定** - `openai-codex/*` 模型參照會由
  `openclaw doctor --fix` 修復為 `openai/*` 加上 Codex 執行環境。

OpenAI 明確支援在 OpenClaw 這類外部工具和工作流程中使用訂閱 OAuth。

供應商、模型、執行環境和頻道是分離的層級。如果這些標籤被混在一起，
請先閱讀 [代理執行環境](/zh-TW/concepts/agent-runtimes)，再變更設定。

## 快速選擇

| 目標                                                 | 使用                                                     | 備註                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| 使用原生 Codex 執行環境的 ChatGPT/Codex 訂閱 | `openai/gpt-5.5`                                        | 預設 OpenAI 代理設定。使用 `openai-codex` 驗證登入。         |
| 代理模型的直接 API 金鑰計費              | `openai/gpt-5.5` 加上 `openai-codex` API 金鑰設定檔 | 使用 `auth.order.openai-codex` 優先選用該設定檔。                 |
| 透過明確 PI 進行直接 API 金鑰計費           | `openai/gpt-5.5` 加上供應商/模型執行環境 `pi`       | 選取一般的 `openai` API 金鑰設定檔。                             |
| 最新 ChatGPT Instant API 別名                     | `openai/chat-latest`                                    | 僅限直接 API 金鑰。用於實驗的浮動別名，不是預設值。   |
| 透過明確 PI 使用 ChatGPT/Codex 訂閱驗證  | `openai/gpt-5.5` 加上供應商/模型執行環境 `pi`       | 為相容性路由選取 `openai-codex` 驗證設定檔。    |
| 影像生成或編輯                          | `openai/gpt-image-2`                                    | 可搭配 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。             |
| 透明背景影像                        | `openai/gpt-image-1.5`                                  | 使用 `outputFormat=png` 或 `webp`，並設定 `openai.background=transparent`。 |

## 命名對照

這些名稱相似，但不能互換：

| 你看到的名稱                            | 層級               | 意義                                                                                           |
| --------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | 供應商前綴     | 標準 OpenAI 模型路由；代理回合使用 Codex 執行環境。                                  |
| `openai-codex`                          | 驗證/設定檔前綴 | OpenAI Codex OAuth/訂閱驗證設定檔供應商。                                            |
| `codex` plugin                          | Plugin              | 內建 OpenClaw Plugin，提供原生 Codex app-server 執行環境和 `/codex` 聊天控制。 |
| provider/model `agentRuntime.id: codex` | 代理執行環境       | 對符合條件的嵌入式回合強制使用原生 Codex app-server harness。                            |
| `/codex ...`                            | 聊天命令集    | 從對話中繫結/控制 Codex app-server 執行緒。                                        |
| `runtime: "acp", agentId: "codex"`      | ACP 工作階段路由   | 透過 ACP/acpx 執行 Codex 的明確備援路徑。                                          |

這表示設定可以有意同時包含 `openai/*` 模型參照和
`openai-codex` 驗證設定檔。`openclaw doctor --fix` 會將舊版
`openai-codex/*` 模型參照重寫為標準 OpenAI 模型路由。

<Note>
GPT-5.5 可透過直接 OpenAI Platform API 金鑰存取和
訂閱/OAuth 路由使用。若要使用 ChatGPT/Codex 訂閱加上原生 Codex
執行，請使用 `openai/gpt-5.5`；未設定執行環境設定時，現在會為 OpenAI
代理回合選取 Codex harness。只有在你想對 OpenAI 代理模型使用
直接 API 金鑰驗證時，才使用 OpenAI API 金鑰設定檔。
</Note>

<Note>
OpenAI 代理模型回合需要內建 Codex app-server Plugin。明確的
PI 執行環境設定仍可作為選用相容性路由使用。當 PI 搭配
`openai-codex` 驗證設定檔明確選取時，OpenClaw 會將公開模型參照保留為
`openai/*`，並在內部透過舊版 Codex 驗證傳輸路由 PI。執行
`openclaw doctor --fix` 以修復過時的 `openai-codex/*` 模型參照，或未來自
明確執行環境設定的舊 PI 工作階段固定值。
</Note>

## OpenClaw 功能涵蓋範圍

| OpenAI 能力         | OpenClaw 介面                                                                 | 狀態                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>` 模型供應商                                                  | 是                                                    |
| Codex 訂閱模型 | 搭配 `openai-codex` OAuth 的 `openai/<model>`                                       | 是                                                    |
| 舊版 Codex 模型參照   | `openai-codex/<model>`                                                           | 由 doctor 修復為 `openai/<model>`                 |
| Codex app-server harness  | 省略執行環境或搭配供應商/模型 `agentRuntime.id: codex` 的 `openai/<model>` | 是                                                    |
| 伺服器端網頁搜尋    | 原生 OpenAI Responses 工具                                                     | 是，在啟用網頁搜尋且未固定供應商時 |
| 影像                    | `image_generate`                                                                 | 是                                                    |
| 影片                    | `video_generate`                                                                 | 是                                                    |
| 文字轉語音            | `messages.tts.provider: "openai"` / `tts`                                        | 是                                                    |
| 批次語音轉文字      | `tools.media.audio` / 媒體理解                                        | 是                                                    |
| 串流語音轉文字  | Voice Call `streaming.provider: "openai"`                                        | 是                                                    |
| 即時語音            | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | 是                                                    |
| 嵌入                | 記憶嵌入供應商                                                        | 是                                                    |

## 記憶嵌入

OpenClaw 可以使用 OpenAI，或與 OpenAI 相容的嵌入端點，來進行
`memory_search` 索引和查詢嵌入：

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
這些作為供應商特定的 `input_type` 請求欄位轉送：查詢嵌入使用
`queryInputType`；已索引的記憶片段和批次索引使用
`documentInputType`。完整範例請參閱[記憶設定參考](/zh-TW/reference/memory-config#provider-specific-config)。

## 開始使用

選擇你偏好的驗證方式並依照設定步驟操作。

<Tabs>
  <Tab title="API 金鑰 (OpenAI Platform)">
    **最適合：** 直接 API 存取和用量計費。

    <Steps>
      <Step title="取得你的 API 金鑰">
        從 [OpenAI Platform 儀表板](https://platform.openai.com/api-keys) 建立或複製 API 金鑰。
      </Step>
      <Step title="執行引導流程">
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

    | 模型參照              | 執行環境設定             | 路由                       | 驗證             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | 省略 / 供應商/模型 `agentRuntime.id: "codex"` | Codex app-server harness | `openai-codex` 設定檔 |
    | `openai/gpt-5.4-mini` | 省略 / 供應商/模型 `agentRuntime.id: "codex"` | Codex app-server harness | `openai-codex` 設定檔 |
    | `openai/gpt-5.5`      | 供應商/模型 `agentRuntime.id: "pi"`              | PI 嵌入式執行環境      | `openai` 設定檔或選取的 `openai-codex` 設定檔 |

    <Note>
    `openai/*` 代理模型使用 Codex app-server harness。若要對代理模型使用 API 金鑰
    驗證，請建立 `openai-codex` API 金鑰設定檔，並透過
    `auth.order.openai-codex` 排序；`OPENAI_API_KEY` 仍是非代理 OpenAI API 介面的
    直接備援。
    </Note>

    ### 設定範例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    若要從 OpenAI API 試用 ChatGPT 目前的 Instant 模型，請將模型
    設為 `openai/chat-latest`：

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` 是浮動別名。OpenAI 文件將它描述為 ChatGPT 使用的最新 Instant
    模型，並建議在正式 API 使用情境採用 `gpt-5.5`，因此除非你明確想要該
    別名行為，否則請將 `openai/gpt-5.5` 保持為穩定預設值。該別名目前只接受
    `medium` 文字詳細程度，因此 OpenClaw 會針對此模型正規化不相容的 OpenAI 文字詳細程度覆寫。

    <Warning>
    OpenClaw **不**公開 `openai/gpt-5.3-codex-spark`。即時 OpenAI API 請求會拒絕該模型，目前的 Codex 目錄也沒有公開它。
    </Warning>

  </Tab>

  <Tab title="Codex 訂閱">
    **最適合：** 使用你的 ChatGPT/Codex 訂閱搭配原生 Codex app-server 執行，而不是使用獨立 API 金鑰。Codex cloud 需要 ChatGPT 登入。

    <Steps>
      <Step title="執行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接執行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        對於無頭或不適合回呼的設定，加入 `--device-code`，以 ChatGPT 裝置代碼流程登入，而不是使用 localhost 瀏覽器回呼：

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="使用標準 OpenAI 模型路由">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        預設路徑不需要執行階段設定。OpenAI 代理程式回合會自動選取原生 Codex app-server 執行階段，且在選擇此路由時，OpenClaw 會安裝或修復隨附的 Codex Plugin。
      </Step>
      <Step title="確認 Codex 驗證可用">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway 執行後，在聊天中傳送 `/codex status` 或 `/codex models`，以確認原生 app-server 執行階段。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照 | 執行階段設定 | 路由 | 驗證 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | 省略 / 供應商/模型 `agentRuntime.id: "codex"` | 原生 Codex app-server harness | Codex 登入或選取的 `openai-codex` 設定檔 |
    | `openai/gpt-5.5` | 供應商/模型 `agentRuntime.id: "pi"` | 具備內部 Codex 驗證傳輸的 PI 嵌入式執行階段 | 選取的 `openai-codex` 設定檔 |
    | `openai-codex/gpt-5.5` | 由 doctor 修復 | 舊版路由重寫為 `openai/gpt-5.5` | 既有的 `openai-codex` 設定檔 |

    <Warning>
    請勿設定較舊的 `openai-codex/gpt-5.1*`、`openai-codex/gpt-5.2*` 或
    `openai-codex/gpt-5.3*` 模型參照。ChatGPT/Codex OAuth 帳戶現在會拒絕
    這些模型。請使用 `openai/gpt-5.5`；OpenAI 代理程式回合現在預設會選取 Codex
    執行階段。
    </Warning>

    <Note>
    驗證/設定檔命令請繼續使用 `openai-codex` 供應商 ID。
    `openai-codex/*` 模型前綴是由 doctor 修復的舊版設定。對於常見的訂閱加原生執行階段設定，請使用 `openai-codex`
    登入，但將模型參照保持為 `openai/gpt-5.5`。
    </Note>

    ### 設定範例

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    <Note>
    Onboarding 不再從 `~/.codex` 匯入 OAuth 材料。請使用瀏覽器 OAuth（預設）或上方的裝置碼流程登入；OpenClaw 會在自己的代理程式驗證存放區中管理產生的認證。
    </Note>

    ### 檢查並復原 Codex OAuth 路由

    使用這些命令查看預設代理程式正在使用哪個模型、執行階段和驗證路由：

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    對於特定代理程式，請加入 `--agent <id>`：

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    如果較舊的設定仍有 `openai-codex/gpt-*`，或沒有明確執行階段設定的過時 OpenAI PI
    工作階段釘選，請修復它：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai-codex` 顯示沒有可用的設定檔，請重新
    登入：

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` 仍是驗證/設定檔供應商 ID。`openai/*` 是 OpenAI 代理程式回合透過 Codex 的
    模型路由。

    ### 狀態指示器

    聊天 `/status` 會顯示目前工作階段中作用中的模型執行階段。
    隨附的 Codex app-server harness 會在 OpenAI 代理程式模型回合中顯示為 `Runtime: OpenAI Codex`。
    過時的 PI 工作階段釘選會修復為 Codex，除非設定明確釘選 PI。

    ### Doctor 警告

    如果 `openai-codex/*` 路由或過時的 OpenAI PI 釘選仍留在設定或
    工作階段狀態中，`openclaw doctor --fix` 會將其重寫為使用 Codex 執行階段的 `openai/*`，
    除非已明確設定 PI。

    ### 上下文視窗上限

    OpenClaw 會將模型中繼資料與執行階段上下文上限視為不同的值。

    對於透過 Codex OAuth 目錄的 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 預設執行階段 `contextTokens` 上限：`272000`

    較小的預設上限在實務上有更好的延遲與品質特性。使用 `contextTokens` 覆寫它：

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

    OpenClaw 會在 `gpt-5.5` 存在時使用上游 Codex 目錄中繼資料。
    如果即時 Codex 探索在帳戶已驗證時省略 `gpt-5.5` 列，OpenClaw 會合成該 OAuth 模型列，讓
    cron、子代理程式和設定的預設模型執行不會因 `Unknown model`
    而失敗。

  </Tab>
</Tabs>

## 原生 Codex app-server 驗證

原生 Codex app-server harness 使用 `openai/*` 模型參照加上省略的
執行階段設定，或供應商/模型 `agentRuntime.id: "codex"`，但其驗證仍以
帳戶為基礎。OpenClaw
會依下列順序選取驗證：

1. 明確繫結到代理程式的 OpenClaw `openai-codex` 驗證設定檔。
2. app-server 的既有帳戶，例如本機 Codex CLI ChatGPT 登入。
3. 僅限本機 stdio app-server 啟動，當 app-server 回報沒有帳戶且仍需要
   OpenAI 驗證時，依序使用 `CODEX_API_KEY`，然後
   `OPENAI_API_KEY`。

這表示本機 ChatGPT/Codex 訂閱登入不會只因為 gateway 程序也有用於直接 OpenAI 模型
或嵌入的 `OPENAI_API_KEY` 而被取代。環境 API 金鑰後援僅適用於本機 stdio 無帳戶路徑；它
不會傳送到 WebSocket app-server 連線。選取訂閱樣式的 Codex
設定檔時，OpenClaw 也會避免將 `CODEX_API_KEY` 和 `OPENAI_API_KEY`
放入產生的 stdio app-server 子程序，並透過 app-server 登入 RPC 傳送選取的認證。

## 影像生成

隨附的 `openai` Plugin 會透過 `image_generate` 工具註冊影像生成。
它同時支援 OpenAI API 金鑰影像生成，以及透過相同 `openai/gpt-image-2` 模型參照的 Codex OAuth 影像
生成。

| 功能                | OpenAI API 金鑰                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型參照                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 驗證                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登入           |
| 傳輸                 | OpenAI Images API                  | Codex Responses 後端              |
| 每個請求的影像上限    | 4                                  | 4                                    |
| 編輯模式                 | 已啟用（最多 5 張參考影像） | 已啟用（最多 5 張參考影像）   |
| 尺寸覆寫            | 支援，包含 2K/4K 尺寸   | 支援，包含 2K/4K 尺寸     |
| 長寬比 / 解析度 | 不轉送到 OpenAI Images API | 安全時對應到支援的尺寸 |

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
請參閱[影像生成](/zh-TW/tools/image-generation)，了解共用工具參數、供應商選取和故障轉移行為。
</Note>

`gpt-image-2` 是 OpenAI 文字轉影像生成與影像
編輯的預設值。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作為
明確模型覆寫使用。透明背景
PNG/WebP 輸出請使用 `openai/gpt-image-1.5`；目前的 `gpt-image-2` API 會拒絕
`background: "transparent"`。

對於透明背景請求，代理程式應呼叫 `image_generate`，並使用
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及
`background: "transparent"`；較舊的 `openai.background` 供應商選項
仍會被接受。OpenClaw 也會保護公開 OpenAI 和
OpenAI Codex OAuth 路由，方法是將預設 `openai/gpt-image-2` 透明
請求重寫為 `gpt-image-1.5`；Azure 與自訂 OpenAI 相容端點會保留
其設定的部署/模型名稱。

相同設定也會公開給無頭 CLI 執行使用：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

從輸入檔案開始時，請搭配
`openclaw infer image edit` 使用相同的 `--output-format` 和 `--background` 旗標。
`--openai-background` 仍可作為 OpenAI 專用別名使用。

對於 Codex OAuth 安裝，請保持相同的 `openai/gpt-image-2` 參照。設定
`openai-codex` OAuth 設定檔時，OpenClaw 會解析該已儲存的 OAuth
存取權杖，並透過 Codex Responses 後端傳送影像請求。它
不會先嘗試 `OPENAI_API_KEY`，也不會在該
請求中悄悄後援到 API 金鑰。當你想使用直接 OpenAI Images API
路由時，請明確設定 `models.providers.openai`，並提供 API 金鑰、
自訂基底 URL 或 Azure 端點。
如果該自訂影像端點位於受信任的 LAN/私人位址，也請設定
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；OpenClaw 會持續封鎖
私人/內部 OpenAI 相容影像端點，除非存在此選擇加入設定。

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

| 功能       | 值                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| 預設模型    | `openai/sora-2`                                                                   |
| 模式            | 文字轉影片、影像轉影片、單一影片編輯                                  |
| 參考輸入 | 1 張影像或 1 部影片                                                                |
| 尺寸覆寫   | 支援                                                                         |
| 其他覆寫  | `aspectRatio`、`resolution`、`audio`、`watermark` 會被忽略並產生工具警告 |

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
請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、供應商選取和故障轉移行為。
</Note>

## GPT-5 提示貢獻

OpenClaw 會為跨供應商的 GPT-5 系列執行加入共用 GPT-5 提示貢獻。它會依模型 ID 套用，因此 `openai/gpt-5.5`、舊版修復前參照（例如 `openai-codex/gpt-5.5`）、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`，以及其他相容的 GPT-5 參照都會收到相同的覆蓋。較舊的 GPT-4.x 模型不會。

隨附的原生 Codex harness 透過 Codex app-server 開發者指示使用相同的 GPT-5 行為與 Heartbeat 覆蓋，因此透過 Codex 路由的 `openai/gpt-5.x` 工作階段會保留相同的後續執行與主動 Heartbeat 指引，即使 Codex 擁有 harness 提示的其餘部分。

GPT-5 貢獻新增了帶標籤的行為合約，用於 persona 持久性、執行安全、工具紀律、輸出形狀、完成檢查與驗證。特定通道的回覆與靜默訊息行為會保留在共用的 OpenClaw 系統提示與輸出遞送政策中。GPT-5 指引一律會對相符模型啟用。友善互動風格層是獨立且可設定的。

| 值                     | 效果                       |
| ---------------------- | -------------------------- |
| `"friendly"`（預設）   | 啟用友善互動風格層         |
| `"on"`                 | `"friendly"` 的別名        |
| `"off"`                | 只停用友善風格層           |

<Tabs>
  <Tab title="Config">
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
值在執行階段不區分大小寫，因此 `"Off"` 和 `"off"` 都會停用友善風格層。
</Tip>

<Note>
當共用的 `agents.defaults.promptOverlays.gpt5.personality` 設定未設定時，仍會讀取舊版 `plugins.entries.openai.config.personality` 作為相容性後備。
</Note>

## 語音與語音輸入輸出

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    內建的 `openai` Plugin 會為 `messages.tts` surface 註冊語音合成。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 語音 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` |（未設定）|
    | 指令 | `messages.tts.providers.openai.instructions` |（未設定，僅限 `gpt-4o-mini-tts`）|
    | 格式 | `messages.tts.providers.openai.responseFormat` | 語音筆記為 `opus`，檔案為 `mp3` |
    | API 金鑰 | `messages.tts.providers.openai.apiKey` | 後備使用 `OPENAI_API_KEY` |
    | 基底 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 額外主體 | `messages.tts.providers.openai.extraBody` / `extra_body` |（未設定）|

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用語音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 會在 OpenClaw 產生的欄位之後合併到 `/audio/speech` 請求 JSON 中，因此可將它用於需要其他鍵（例如 `lang`）的 OpenAI 相容端點。原型鍵會被忽略。

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
    設定 `OPENAI_TTS_BASE_URL` 可覆寫 TTS 基底 URL，而不影響聊天 API 端點。OpenAI TTS 仍透過 API 金鑰設定；若要使用僅 OAuth 的即時語音回話，請使用 Realtime 語音路徑，而不是 agent 模式的 STT -> TTS 語音。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    內建的 `openai` Plugin 會透過
    OpenClaw 的媒體理解轉錄 surface 註冊批次語音轉文字。

    - 預設模型：`gpt-4o-transcribe`
    - 端點：OpenAI REST `/v1/audio/transcriptions`
    - 輸入路徑：multipart 音訊檔案上傳
    - 在 OpenClaw 中凡是入站音訊轉錄使用
      `tools.media.audio` 的地方皆受支援，包括 Discord 語音通道片段與通道
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

    當共用音訊媒體設定或逐次呼叫轉錄請求提供語言與提示提示時，
    會將其轉送給 OpenAI。

  </Accordion>

  <Accordion title="Realtime transcription">
    內建的 `openai` Plugin 會為語音通話 Plugin 註冊即時轉錄。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 語言 | `...openai.language` |（未設定）|
    | 提示 | `...openai.prompt` |（未設定）|
    | 靜音持續時間 | `...openai.silenceDurationMs` | `800` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | 驗證 | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai-codex` OAuth | API 金鑰會直接連線；OAuth 會鑄造 Realtime 轉錄用戶端密鑰 |

    <Note>
    使用 WebSocket 連線至 `wss://api.openai.com/v1/realtime`，並使用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音訊。若只設定了 `openai-codex` OAuth，Gateway 會在開啟 WebSocket 前鑄造暫時性 Realtime 轉錄用戶端密鑰。此串流供應器用於語音通話的即時轉錄路徑；Discord 語音目前會錄製短片段，並改用批次 `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    內建的 `openai` Plugin 會為語音通話 Plugin 註冊即時語音。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | 語音 | `...openai.voice` | `alloy` |
    | 溫度（Azure 部署橋接） | `...openai.temperature` | `0.8` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | 靜音持續時間 | `...openai.silenceDurationMs` | `500` |
    | 前置填補 | `...openai.prefixPaddingMs` | `300` |
    | 推理強度 | `...openai.reasoningEffort` |（未設定）|
    | 驗證 | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai-codex` OAuth | 瀏覽器 Talk 與非 Azure 後端橋接可使用 Codex OAuth |

    `gpt-realtime-2` 可用的內建 Realtime 語音：`alloy`、`ash`、
    `ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI 建議使用 `marin` 和 `cedar` 以取得最佳 Realtime 品質。這
    與上方文字轉語音的語音集合不同；請勿假設 TTS
    語音（例如 `fable`、`nova` 或 `onyx`）對 Realtime 工作階段有效。

    <Note>
    後端 OpenAI 即時橋接使用 GA Realtime WebSocket 工作階段形狀，不接受 `session.temperature`。Azure OpenAI 部署仍可透過 `azureEndpoint` 和 `azureDeployment` 使用，並保留與部署相容的工作階段形狀。支援雙向工具呼叫與 G.711 u-law 音訊。
    </Note>

    <Note>
    Realtime 語音會在建立工作階段時選取。OpenAI 允許多數
    工作階段欄位稍後變更，但該工作階段中的模型送出音訊後，
    語音就無法再變更。OpenClaw 目前會以字串形式公開
    內建 Realtime 語音 ID。
    </Note>

    <Note>
    控制 UI Talk 使用 OpenAI 瀏覽器即時工作階段，搭配由 Gateway 鑄造的
    暫時性用戶端密鑰，並直接對 OpenAI Realtime API 進行瀏覽器 WebRTC SDP 交換。
    當未設定直接 OpenAI API 金鑰時，
    Gateway 可以使用所選的 `openai-codex` OAuth
    profile 鑄造該用戶端密鑰。Gateway relay 與語音通話後端即時 WebSocket 橋接會對
    原生 OpenAI 端點使用相同的 OAuth 後備。維護者即時
    驗證可透過
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` 執行；
    OpenAI 分支會在不記錄密鑰的情況下，同時驗證後端 WebSocket 橋接與瀏覽器
    WebRTC SDP 交換。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端點

內建的 `openai` 供應器可透過覆寫基底 URL，將影像
生成指向 Azure OpenAI 資源。在影像生成路徑上，OpenClaw
會偵測 `models.providers.openai.baseUrl` 上的 Azure 主機名稱，並自動切換至
Azure 的請求形狀。

<Note>
Realtime 語音使用獨立的設定路徑
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），
且不受 `models.providers.openai.baseUrl` 影響。其 Azure
設定請參閱 [語音與語音輸入輸出](#voice-and-speech) 下的 **Realtime
voice** 摺疊區塊。
</Note>

在以下情況使用 Azure OpenAI：

- 你已有 Azure OpenAI 訂閱、配額或企業協議
- 你需要 Azure 提供的區域資料駐留或合規控制
- 你想讓流量留在既有 Azure 租用戶內

### 設定

若要透過內建的 `openai` 供應器使用 Azure 影像生成，請將
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

OpenClaw 會辨識下列 Azure 主機尾碼，以用於 Azure 影像生成
路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

對於辨識出的 Azure 主機上的影像生成請求，OpenClaw 會：

- 傳送 `api-key` 標頭，而不是 `Authorization: Bearer`
- 使用部署範圍路徑（`/openai/deployments/{deployment}/...`）
- 將 `?api-version=...` 附加至每個請求
- 對 Azure 影像生成呼叫使用 600 秒的預設請求逾時。
  逐次呼叫的 `timeoutMs` 值仍會覆寫此預設值。

其他基底 URL（公開 OpenAI、OpenAI 相容代理）會保留標準
OpenAI 影像請求形狀。

<Note>
`openai` 供應器影像生成路徑的 Azure 路由需要
OpenClaw 2026.4.22 或更新版本。較早版本會將任何自訂
`openai.baseUrl` 視為公開 OpenAI 端點，並且在對 Azure
影像部署使用時失敗。
</Note>

### API 版本

設定 `AZURE_OPENAI_API_VERSION` 可為 Azure 影像生成路徑釘選特定 Azure preview 或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未設定該變數時，預設值為 `2024-12-01-preview`。

### 模型名稱即部署名稱

Azure OpenAI 會將模型繫結到部署。對於透過內建 `openai` 供應器
路由的 Azure 影像生成請求，OpenClaw 中的 `model` 欄位
必須是你在 Azure 入口網站中設定的 **Azure 部署名稱**，而不是
公開 OpenAI 模型 ID。

如果你建立名為 `gpt-image-2-prod` 的部署，用於提供 `gpt-image-2`：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

相同的部署名稱規則也適用於透過
內建 `openai` 供應器路由的影像生成呼叫。

### 區域可用性

Azure 影像生成目前僅在部分區域可用
（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。建立部署前，請查看 Microsoft 目前的區域清單，
並確認你的區域提供該特定模型。

### 參數差異

Azure OpenAI 與公開 OpenAI 不一定接受相同的影像參數。
Azure 可能會拒絕公開 OpenAI 允許的選項（例如 `gpt-image-2` 上某些
`background` 值），或只在特定模型
版本上公開這些選項。這些差異來自 Azure 與底層模型，而不是
OpenClaw。如果 Azure 請求因驗證錯誤而失敗，請在
Azure 入口網站中檢查你的特定部署與 API 版本支援的
參數集合。

<Note>
Azure OpenAI 使用原生傳輸與相容行為，但不會接收
OpenClaw 的隱藏歸因標頭 — 請參閱 [Advanced configuration](#advanced-configuration)
下方的 **原生與 OpenAI 相容路由** 摺疊區塊。

對於 Azure 上的聊天或 Responses 流量（影像生成以外），請使用
導覽設定流程或專用的 Azure provider 設定 — 單獨設定 `openai.baseUrl`
不會套用 Azure API/驗證格式。另有一個
`azure-openai-responses/*` provider；請參閱下方的伺服器端 Compaction 摺疊區塊。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="傳輸（WebSocket 與 SSE）">
    OpenClaw 對 `openai/*` 採用 WebSocket 優先，並以 SSE 作為備援（`"auto"`）。

    在 `"auto"` 模式中，OpenClaw 會：
    - 在回退到 SSE 前，重試一次早期 WebSocket 失敗
    - 失敗後，將 WebSocket 標記為降級約 60 秒，並在冷卻期間使用 SSE
    - 為重試與重新連線附加穩定的工作階段與回合識別標頭
    - 在不同傳輸變體之間標準化使用量計數器（`input_tokens` / `prompt_tokens`）

    | 值 | 行為 |
    |-------|----------|
    | `"auto"`（預設） | WebSocket 優先，SSE 備援 |
    | `"sse"` | 僅強制使用 SSE |
    | `"websocket"` | 僅強制使用 WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
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

  <Accordion title="快速模式">
    OpenClaw 為 `openai/*` 提供共享的快速模式切換：

    - **聊天/UI：** `/fast status|on|off`
    - **設定：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    啟用後，OpenClaw 會將快速模式對應到 OpenAI 優先處理（`service_tier = "priority"`）。既有的 `service_tier` 值會保留，且快速模式不會改寫 `reasoning` 或 `text.verbosity`。

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
    工作階段覆寫優先於設定。在 Sessions UI 中清除工作階段覆寫後，工作階段會回到已設定的預設值。
    </Note>

  </Accordion>

  <Accordion title="優先處理（service_tier）">
    OpenAI 的 API 透過 `service_tier` 提供優先處理。可在 OpenClaw 中依模型設定：

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
    `serviceTier` 只會轉送到原生 OpenAI 端點（`api.openai.com`）與原生 Codex 端點（`chatgpt.com/backend-api`）。如果你將任一 provider 經由代理路由，OpenClaw 會讓 `service_tier` 保持不變。
    </Warning>

  </Accordion>

  <Accordion title="伺服器端 Compaction（Responses API）">
    對於直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI Plugin 的 Pi-harness 串流包裝器會自動啟用伺服器端 Compaction：

    - 強制 `store: true`（除非模型相容性設定 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 預設 `compact_threshold`：`contextWindow` 的 70%（無法取得時為 `80000`）

    這會套用於內建 Pi harness 路徑，以及嵌入式執行所使用的 OpenAI provider hook。原生 Codex app-server harness 會透過 Codex 管理自己的上下文，並由 OpenAI 的預設 agent 路由或 provider/model runtime policy 設定。

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
    `responsesServerCompaction` 只控制 `context_management` 注入。直接 OpenAI Responses 模型仍會強制 `store: true`，除非相容性設定 `supportsStore: false`。
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
    - 當有可用工具動作時，不再將僅有計畫的回合視為成功進展
    - 使用立即行動引導重試該回合
    - 對實質工作自動啟用 `update_plan`
    - 如果模型持續規劃而不行動，呈現明確的受阻狀態

    <Note>
    僅限 OpenAI 與 Codex GPT-5 系列執行。其他 provider 與較舊的模型系列會維持預設行為。
    </Note>

  </Accordion>

  <Accordion title="原生與 OpenAI 相容路由">
    OpenClaw 會將直接 OpenAI、Codex 與 Azure OpenAI 端點，和通用 OpenAI 相容 `/v1` 代理區分處理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 只對支援 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 對會拒絕 `reasoning.effort: "none"` 的模型或代理省略停用的 reasoning
    - 預設將工具 schema 設為 strict 模式
    - 只在已驗證的原生主機上附加隱藏歸因標頭
    - 保留 OpenAI 專用請求塑形（`service_tier`、`store`、reasoning 相容性、prompt-cache 提示）

    **代理/相容路由：**
    - 使用較寬鬆的相容行為
    - 從非原生 `openai-completions` payload 中移除 Completions `store`
    - 接受進階 `params.extra_body`/`params.extraBody` JSON 透傳，以供 OpenAI 相容 Completions 代理使用
    - 接受 `params.chat_template_kwargs`，以供 vLLM 等 OpenAI 相容 Completions 代理使用
    - 不強制使用 strict 工具 schema 或僅限原生的標頭

    Azure OpenAI 使用原生傳輸與相容行為，但不會接收隱藏歸因標頭。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇 provider、模型參照與容錯移轉行為。
  </Card>
  <Card title="影像生成" href="/zh-TW/tools/image-generation" icon="image">
    共享影像工具參數與 provider 選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共享影片工具參數與 provider 選擇。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊與憑證重用規則。
  </Card>
</CardGroup>
