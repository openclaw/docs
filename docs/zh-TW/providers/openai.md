---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 訂閱驗證，而不是 API 金鑰
    - 你需要更嚴格的 GPT-5 代理執行行為
summary: 在 OpenClaw 中透過 API 金鑰或 Codex 訂閱使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:34:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

OpenAI 提供 GPT 模型的開發者 API，而 Codex 也可透過 OpenAI 的 Codex 用戶端，作為 ChatGPT 方案的程式碼代理使用。OpenClaw 將這些介面分開，讓設定保持可預期。

OpenClaw 使用 `openai/*` 作為標準 OpenAI 模型路由。OpenAI 模型上的內嵌代理回合預設會透過原生 Codex 應用程式伺服器執行階段執行；直接 OpenAI API 金鑰驗證仍可用於非代理的 OpenAI 介面，例如影像、嵌入、語音和即時功能。

- **代理模型** - 透過 Codex 執行階段使用 `openai/*` 模型；若要使用 ChatGPT/Codex 訂閱，請使用 Codex 驗證登入；若你刻意想使用 API 金鑰驗證，則設定 Codex 相容的 OpenAI API 金鑰備援。
- **非代理 OpenAI API** - 透過 `OPENAI_API_KEY` 或 OpenAI API 金鑰導入，直接存取 OpenAI Platform 並採用依使用量計費。
- **舊版設定** - `openai-codex/*` 模型參照會由 `openclaw doctor --fix` 修復為 `openai/*` 加上 Codex 執行階段。

OpenAI 明確支援在 OpenClaw 這類外部工具和工作流程中使用訂閱 OAuth。

Provider、模型、執行階段和 channel 是分離的層。如果這些標籤混在一起，請先閱讀 [Agent runtimes](/zh-TW/concepts/agent-runtimes)，再變更設定。

## 快速選擇

| 目標                                                 | 使用                                                     | 備註                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| 搭配原生 Codex 執行階段的 ChatGPT/Codex 訂閱         | `openai/gpt-5.5`                                         | 預設 OpenAI 代理設定。使用 Codex 驗證登入。                           |
| 代理模型的直接 API 金鑰計費                          | `openai/gpt-5.5` 加上 Codex 相容的 API 金鑰設定檔        | 使用 `auth.order.openai` 將備援排在訂閱驗證之後。                     |
| 透過明確 PI 的直接 API 金鑰計費                      | `openai/gpt-5.5` 加上 provider/model 執行階段 `pi`       | 選取一般的 `openai` API 金鑰設定檔。                                  |
| 最新 ChatGPT Instant API 別名                        | `openai/chat-latest`                                     | 僅限直接 API 金鑰。用於實驗的移動別名，不是預設值。                  |
| 透過明確 PI 的 ChatGPT/Codex 訂閱驗證                | `openai/gpt-5.5` 加上 provider/model 執行階段 `pi`       | 為相容性路由選取 `openai-codex` 驗證設定檔。                         |
| 影像生成或編輯                                       | `openai/gpt-image-2`                                     | 可搭配 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。                  |
| 透明背景影像                                         | `openai/gpt-image-1.5`                                   | 使用 `outputFormat=png` 或 `webp`，並設定 `openai.background=transparent`。 |

## 命名對照

這些名稱相似，但不可互換：

| 你看到的名稱                            | 層級                       | 含義                                                                                                                 |
| --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openai`                                | Provider 前綴              | 標準 OpenAI 模型路由；代理回合使用 Codex 執行階段。                                                                 |
| `openai-codex`                          | 舊版驗證/設定檔前綴        | 較舊的 OpenAI Codex OAuth/訂閱設定檔命名空間。既有設定檔和 `auth.order.openai-codex` 仍可運作。                    |
| `codex` plugin                          | Plugin                     | 內建的 OpenClaw Plugin，提供原生 Codex 應用程式伺服器執行階段和 `/codex` 聊天控制。                               |
| provider/model `agentRuntime.id: codex` | 代理執行階段               | 強制為符合條件的內嵌回合使用原生 Codex 應用程式伺服器 harness。                                                    |
| `/codex ...`                            | 聊天命令集                 | 從對話中繫結/控制 Codex 應用程式伺服器執行緒。                                                                     |
| `runtime: "acp", agentId: "codex"`      | ACP 工作階段路由           | 明確的備援路徑，會透過 ACP/acpx 執行 Codex。                                                                       |

這表示設定可以刻意包含 `openai/*` 模型參照，同時驗證設定檔仍指向 Codex 相容的憑證。新設定請優先使用 `auth.order.openai`；既有的 `openai-codex:*` 設定檔和 `auth.order.openai-codex` 仍受支援。`openclaw doctor --fix` 會將舊版 `openai-codex/*` 模型參照改寫為標準 OpenAI 模型路由。

<Note>
GPT-5.5 可透過直接 OpenAI Platform API 金鑰存取和訂閱/OAuth 路由使用。若要使用 ChatGPT/Codex 訂閱加上原生 Codex 執行，請使用 `openai/gpt-5.5`；未設定執行階段時，現在會為 OpenAI 代理回合選取 Codex harness。只有在你想為 OpenAI 代理模型使用直接 API 金鑰驗證時，才使用 OpenAI API 金鑰設定檔。
</Note>

<Note>
OpenAI 代理模型回合需要內建的 Codex 應用程式伺服器 Plugin。明確 PI 執行階段設定仍可作為選用的相容性路由。當 PI 搭配 `openai-codex` 驗證設定檔明確選取時，OpenClaw 會將公開模型參照保留為 `openai/*`，並在內部透過舊版 Codex 驗證傳輸路由 PI。執行 `openclaw doctor --fix` 以修復過期的 `openai-codex/*` 模型參照，或不是來自明確執行階段設定的舊 PI 工作階段釘選。
</Note>

## OpenClaw 功能涵蓋範圍

| OpenAI 能力              | OpenClaw 介面                                                                   | 狀態                                                   |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>` 模型 Provider                                                   | 是                                                     |
| Codex 訂閱模型            | 搭配 `openai-codex` OAuth 的 `openai/<model>`                                    | 是                                                     |
| 舊版 Codex 模型參照       | `openai-codex/<model>`                                                           | 由 doctor 修復為 `openai/<model>`                     |
| Codex 應用程式伺服器 harness | 未指定執行階段或 provider/model `agentRuntime.id: codex` 的 `openai/<model>` | 是                                                     |
| 伺服器端網頁搜尋          | 原生 OpenAI Responses 工具                                                       | 是，當網頁搜尋已啟用且未釘選 Provider 時              |
| 影像                      | `image_generate`                                                                 | 是                                                     |
| 影片                      | `video_generate`                                                                 | 是                                                     |
| 文字轉語音                | `messages.tts.provider: "openai"` / `tts`                                        | 是                                                     |
| 批次語音轉文字            | `tools.media.audio` / 媒體理解                                                   | 是                                                     |
| 串流語音轉文字            | Voice Call `streaming.provider: "openai"`                                        | 是                                                     |
| 即時語音                  | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | 是                                                     |
| 嵌入                      | 記憶嵌入 Provider                                                                | 是                                                     |

## 記憶嵌入

OpenClaw 可使用 OpenAI 或 OpenAI 相容的嵌入端點，為 `memory_search` 建立索引和查詢嵌入：

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

對於需要非對稱嵌入標籤的 OpenAI 相容端點，請在 `memorySearch` 底下設定 `queryInputType` 和 `documentInputType`。OpenClaw 會將它們作為 Provider 專屬的 `input_type` 請求欄位轉送：查詢嵌入使用 `queryInputType`；已建立索引的記憶片段和批次索引使用 `documentInputType`。完整範例請參閱[記憶設定參考](/zh-TW/reference/memory-config#provider-specific-config)。

## 開始使用

選擇你偏好的驗證方式，並依照設定步驟操作。

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **最適合：** 直接 API 存取和依使用量計費。

    <Steps>
      <Step title="Get your API key">
        從 [OpenAI Platform dashboard](https://platform.openai.com/api-keys) 建立或複製 API 金鑰。
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        或直接傳入金鑰：

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照              | 執行階段設定             | 路由                       | 驗證             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omitted / provider/model `agentRuntime.id: "codex"` | Codex 應用程式伺服器 harness | Codex 相容的 OpenAI 設定檔 |
    | `openai/gpt-5.4-mini` | omitted / provider/model `agentRuntime.id: "codex"` | Codex 應用程式伺服器 harness | Codex 相容的 OpenAI 設定檔 |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "pi"`              | PI 內嵌執行階段      | `openai` 設定檔或所選的 `openai-codex` 設定檔 |

    <Note>
    `openai/*` 代理模型使用 Codex 應用程式伺服器 harness。若要為代理模型使用 API 金鑰驗證，請建立 Codex 相容的 API 金鑰設定檔，並用 `auth.order.openai` 排序；`OPENAI_API_KEY` 仍是非代理 OpenAI API 介面的直接備援。較舊的 `auth.order.openai-codex` 項目仍可運作。
    </Note>

    ### 設定範例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    若要從 OpenAI API 試用 ChatGPT 目前的 Instant 模型，請將模型設為 `openai/chat-latest`：

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` 是移動別名。OpenAI 文件將其描述為 ChatGPT 使用的最新 Instant 模型，並建議生產 API 用途使用 `gpt-5.5`，因此除非你明確想要該別名行為，否則請保留 `openai/gpt-5.5` 作為穩定預設值。該別名目前只接受 `medium` 文字詳細程度，因此 OpenClaw 會針對此模型正規化不相容的 OpenAI 文字詳細程度覆寫。

    <Warning>
    OpenClaw **不會**公開 `openai/gpt-5.3-codex-spark`。即時 OpenAI API 請求會拒絕該模型，目前的 Codex 目錄也不會公開它。
    </Warning>

  </Tab>

  <Tab title="Codex 訂閱">
    **最適合：** 使用你的 ChatGPT/Codex 訂閱搭配原生 Codex 應用程式伺服器執行，而不是使用獨立的 API 金鑰。Codex 雲端需要 ChatGPT 登入。

    <Steps>
      <Step title="執行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接執行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        對於無頭或不適合回呼的設定，加入 `--device-code`，即可使用 ChatGPT 裝置代碼流程登入，而不是 localhost 瀏覽器回呼：

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="使用標準 OpenAI 模型路由">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        預設路徑不需要執行階段設定。OpenAI Agent 回合會自動選取原生 Codex 應用程式伺服器執行階段，而 OpenClaw 會在選擇此路由時安裝或修復內建的 Codex Plugin。
      </Step>
      <Step title="確認 Codex 驗證可用">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway 執行後，在聊天中傳送 `/codex status` 或 `/codex models`，以確認原生應用程式伺服器執行階段。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照 | 執行階段設定 | 路由 | 驗證 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | 省略 / provider/model `agentRuntime.id: "codex"` | 原生 Codex 應用程式伺服器執行框架 | Codex 登入或排序後的 `openai` 驗證設定檔 |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "pi"` | 具備內部 Codex 驗證傳輸的 PI 內嵌執行階段 | 已選取的 `openai-codex` 設定檔 |
    | `openai-codex/gpt-5.5` | 由 doctor 修復 | 舊版路由重寫為 `openai/gpt-5.5` | 現有 `openai-codex` 設定檔 |

    <Warning>
    請勿設定較舊的 `openai-codex/gpt-5.1*`、`openai-codex/gpt-5.2*` 或 `openai-codex/gpt-5.3*` 模型參照。ChatGPT/Codex OAuth 帳戶現在會拒絕這些模型。請使用 `openai/gpt-5.5`；OpenAI Agent 回合現在預設會選取 Codex 執行階段。
    </Warning>

    <Note>
    `openai-codex/*` 模型前綴是由 doctor 修復的舊版設定。對於常見的訂閱加原生執行階段設定，請使用 Codex 驗證登入，但將模型參照保持為 `openai/gpt-5.5`。新設定應將 OpenAI Agent 驗證順序放在 `auth.order.openai` 底下；較舊的 `auth.order.openai-codex` 項目仍然有效。
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

    若有 API 金鑰備援，請將模型保持在 `openai/gpt-5.5`，並將驗證順序放在 `openai` 底下。OpenClaw 會先嘗試訂閱，然後嘗試 API 金鑰，同時維持在 Codex 執行框架上：

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding 不再從 `~/.codex` 匯入 OAuth 材料。請使用瀏覽器 OAuth（預設）或上述裝置代碼流程登入；OpenClaw 會在自己的 Agent 驗證儲存中管理產生的憑證。
    </Note>

    ### 檢查並復原 Codex OAuth 路由

    使用這些命令查看你的預設 Agent 正在使用哪個模型、執行階段與驗證路由：

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    對於特定 Agent，加入 `--agent <id>`：

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    如果較舊的設定仍有 `openai-codex/gpt-*`，或沒有明確執行階段設定的過時 OpenAI PI 工作階段釘選，請修復它：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai-codex` 顯示沒有可用的設定檔，請重新登入：

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai/*` 是 OpenAI Agent 回合透過 Codex 使用的模型路由。`openai-codex` 驗證/設定檔提供者 ID 仍接受用於現有設定檔與 CLI 列表。

    ### 狀態指示器

    聊天 `/status` 會顯示目前工作階段中啟用的模型執行階段。對於 OpenAI Agent 模型回合，內建的 Codex 應用程式伺服器執行框架會顯示為 `Runtime: OpenAI Codex`。除非設定明確釘選 PI，否則過時的 PI 工作階段釘選會修復為 Codex。

    ### Doctor 警告

    如果 `openai-codex/*` 路由或過時的 OpenAI PI 釘選仍留在設定或工作階段狀態中，`openclaw doctor --fix` 會將它們重寫為具備 Codex 執行階段的 `openai/*`，除非已明確設定 PI。

    ### Context window 上限

    OpenClaw 會將模型中繼資料與執行階段內容上限視為不同的值。

    對於透過 Codex OAuth 目錄使用的 `openai/gpt-5.5`：

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
    使用 `contextWindow` 宣告原生模型中繼資料。使用 `contextTokens` 限制執行階段內容預算。
    </Note>

    ### 目錄復原

    當存在 `gpt-5.5` 時，OpenClaw 會使用上游 Codex 目錄中繼資料。如果即時 Codex 探索在帳戶已驗證時省略 `gpt-5.5` 列，OpenClaw 會合成該 OAuth 模型列，讓 cron、子 Agent 與已設定的預設模型執行不會因 `Unknown model` 而失敗。

  </Tab>
</Tabs>

## 原生 Codex 應用程式伺服器驗證

原生 Codex 應用程式伺服器執行框架使用 `openai/*` 模型參照，加上省略的執行階段設定或 provider/model `agentRuntime.id: "codex"`，但其驗證仍以帳戶為基礎。OpenClaw 依下列順序選取驗證：

1. Agent 的已排序 OpenAI 驗證設定檔，最好位於 `auth.order.openai` 底下。現有的 `openai-codex:*` 設定檔與 `auth.order.openai-codex` 對較舊安裝仍然有效。
2. 應用程式伺服器的現有帳戶，例如本機 Codex CLI ChatGPT 登入。
3. 僅限本機 stdio 應用程式伺服器啟動時，在應用程式伺服器回報沒有帳戶且仍需要 OpenAI 驗證時，使用 `CODEX_API_KEY`，接著使用 `OPENAI_API_KEY`。

這表示本機 ChatGPT/Codex 訂閱登入不會只因為 Gateway 程序也有用於直接 OpenAI 模型或嵌入的 `OPENAI_API_KEY` 而被取代。Env API 金鑰備援只適用於本機 stdio 無帳戶路徑；它不會傳送到 WebSocket 應用程式伺服器連線。選取訂閱樣式的 Codex 設定檔時，OpenClaw 也會將 `CODEX_API_KEY` 與 `OPENAI_API_KEY` 排除在衍生的 stdio 應用程式伺服器子程序之外，並透過應用程式伺服器登入 RPC 傳送選取的憑證。當該訂閱設定檔受到 Codex 使用量限制封鎖時，OpenClaw 可以輪替到下一個排序後的 `openai:*` API 金鑰設定檔，而不變更選取的模型，也不離開 Codex 執行框架。訂閱重設時間過後，訂閱設定檔會再次符合資格。

## 圖像生成

內建的 `openai` Plugin 透過 `image_generate` 工具註冊圖像生成。它透過相同的 `openai/gpt-image-2` 模型參照，同時支援 OpenAI API 金鑰圖像生成與 Codex OAuth 圖像生成。

| 能力                | OpenAI API 金鑰                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型參照                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 驗證                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登入           |
| 傳輸                 | OpenAI Images API                  | Codex Responses 後端              |
| 每個請求的最大圖像數    | 4                                  | 4                                    |
| 編輯模式                 | 已啟用（最多 5 張參考圖像） | 已啟用（最多 5 張參考圖像）   |
| 尺寸覆寫            | 支援，包含 2K/4K 尺寸   | 支援，包含 2K/4K 尺寸     |
| 長寬比 / 解析度 | 不轉送至 OpenAI Images API | 安全時對應至支援的尺寸 |

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
請參閱[圖像生成](/zh-TW/tools/image-generation)，了解共用工具參數、提供者選取與容錯移轉行為。
</Note>

`gpt-image-2` 是 OpenAI 文字轉圖像生成與圖像編輯的預設值。`gpt-image-1.5`、`gpt-image-1` 與 `gpt-image-1-mini` 仍可用作明確模型覆寫。若要輸出透明背景 PNG/WebP，請使用 `openai/gpt-image-1.5`；目前的 `gpt-image-2` API 會拒絕 `background: "transparent"`。

對於透明背景請求，Agent 應呼叫 `image_generate`，並使用 `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及 `background: "transparent"`；較舊的 `openai.background` 提供者選項仍受支援。OpenClaw 也會保護公開 OpenAI 與 OpenAI Codex OAuth 路由，將預設的 `openai/gpt-image-2` 透明請求重寫為 `gpt-image-1.5`；Azure 與自訂 OpenAI 相容端點會保留其已設定的部署/模型名稱。

相同設定也公開給無頭 CLI 執行使用：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

從輸入檔開始時，請搭配 `openclaw infer image edit` 使用相同的 `--output-format` 與 `--background` 旗標。`--openai-background` 仍可作為 OpenAI 專屬別名使用。

對於 Codex OAuth 安裝，請保持相同的 `openai/gpt-image-2` 參照。設定 `openai-codex` OAuth 設定檔時，OpenClaw 會解析該儲存的 OAuth 存取權杖，並透過 Codex Responses 後端傳送圖像請求。它不會先嘗試 `OPENAI_API_KEY`，也不會為該請求靜默退回 API 金鑰。若要改用直接 OpenAI Images API 路由，請使用 API 金鑰、自訂基礎 URL 或 Azure 端點明確設定 `models.providers.openai`。
如果該自訂圖像端點位於受信任的 LAN/私人位址，也請設定 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在此選擇加入，否則 OpenClaw 會持續封鎖私人/內部 OpenAI 相容圖像端點。

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

內建的 `openai` Plugin 會透過 `video_generate` tool 註冊影片生成。

| 能力             | 值                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| 預設模型         | `openai/sora-2`                                                                   |
| 模式             | 文字轉影片、圖片轉影片、單一影片編輯                                             |
| 參考輸入         | 1 張圖片或 1 支影片                                                               |
| 尺寸覆寫         | 支援                                                                              |
| 其他覆寫         | `aspectRatio`、`resolution`、`audio`、`watermark` 會被忽略並產生 tool 警告        |

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
請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用 tool 參數、提供者選擇與故障轉移行為。
</Note>

## GPT-5 提示貢獻

OpenClaw 會為跨提供者的 GPT-5 系列執行新增共用的 GPT-5 提示貢獻。它會依模型 ID 套用，因此 `openai/gpt-5.5`、舊版修復前參照例如 `openai-codex/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`，以及其他相容的 GPT-5 參照都會收到相同的覆蓋層。較舊的 GPT-4.x 模型不會套用。

內建的原生 Codex harness 會透過 Codex app-server 開發者指示使用相同的 GPT-5 行為與 Heartbeat 覆蓋層，因此透過 Codex 路由的 `openai/gpt-5.x` 工作階段，即使 Codex 擁有其餘 harness 提示，仍會保留相同的後續執行與主動 Heartbeat 指引。

GPT-5 貢獻會新增帶標籤的行為合約，涵蓋人格持續性、執行安全、tool 紀律、輸出形狀、完成檢查與驗證。通道特定的回覆與靜默訊息行為會留在共用 OpenClaw 系統提示與出站傳遞政策中。GPT-5 指引一律會對相符模型啟用。友善互動風格層是獨立且可設定的。

| 值                     | 效果                         |
| ---------------------- | ---------------------------- |
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
值在執行階段不區分大小寫，因此 `"Off"` 和 `"off"` 都會停用友善風格層。
</Tip>

<Note>
當共用的 `agents.defaults.promptOverlays.gpt5.personality` 設定未設定時，仍會讀取舊版 `plugins.entries.openai.config.personality` 作為相容性後援。
</Note>

## 語音與 speech

<AccordionGroup>
  <Accordion title="語音合成 (TTS)">
    內建的 `openai` Plugin 會為 `messages.tts` 介面註冊語音合成。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 語音 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未設定） |
    | 指示 | `messages.tts.providers.openai.instructions` | （未設定，僅限 `gpt-4o-mini-tts`） |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 語音備註使用 `opus`，檔案使用 `mp3` |
    | API 金鑰 | `messages.tts.providers.openai.apiKey` | 後援至 `OPENAI_API_KEY` |
    | 基底 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 額外主體 | `messages.tts.providers.openai.extraBody` / `extra_body` | （未設定） |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用語音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 會在 OpenClaw 產生的欄位之後合併到 `/audio/speech` 請求 JSON，因此可將它用於需要額外鍵（例如 `lang`）的 OpenAI 相容端點。Prototype 鍵會被忽略。

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
    設定 `OPENAI_TTS_BASE_URL` 可覆寫 TTS 基底 URL，且不影響聊天 API 端點。OpenAI TTS 仍透過 API 金鑰設定；若要使用僅 OAuth 的即時語音回覆，請使用 Realtime 語音路徑，而不是 agent 模式的 STT -> TTS speech。
    </Note>

  </Accordion>

  <Accordion title="語音轉文字">
    內建的 `openai` Plugin 會透過
    OpenClaw 的媒體理解轉錄介面註冊批次語音轉文字。

    - 預設模型：`gpt-4o-transcribe`
    - 端點：OpenAI REST `/v1/audio/transcriptions`
    - 輸入路徑：multipart 音訊檔案上傳
    - OpenClaw 中任何使用入站音訊轉錄的地方都支援，
      包含 Discord 語音通道片段和通道
      音訊附件，且會使用 `tools.media.audio`

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

    當共用音訊媒體設定或每次呼叫的轉錄請求提供語言和提示提示時，這些內容會轉送給 OpenAI。

  </Accordion>

  <Accordion title="即時轉錄">
    內建的 `openai` Plugin 會為 Voice Call Plugin 註冊即時轉錄。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 語言 | `...openai.language` | (未設定) |
    | 提示 | `...openai.prompt` | (未設定) |
    | 靜音持續時間 | `...openai.silenceDurationMs` | `800` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | 驗證 | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai-codex` OAuth | API 金鑰會直接連線；OAuth 會鑄造 Realtime 轉錄用戶端密鑰 |

    <Note>
    使用 WebSocket 連線至 `wss://api.openai.com/v1/realtime`，並採用 G.711 u-law (`g711_ulaw` / `audio/pcmu`) 音訊。當只設定了 `openai-codex` OAuth 時，Gateway 會先鑄造暫時性的 Realtime 轉錄用戶端密鑰，再開啟 WebSocket。這個串流提供者用於 Voice Call 的即時轉錄路徑；Discord 語音目前會錄製短片段，並改用批次 `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="即時語音">
    內建的 `openai` Plugin 會為 Voice Call Plugin 註冊即時語音。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | 語音 | `...openai.voice` | `alloy` |
    | 溫度 (Azure 部署橋接) | `...openai.temperature` | `0.8` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | 靜音持續時間 | `...openai.silenceDurationMs` | `500` |
    | 前綴填補 | `...openai.prefixPaddingMs` | `300` |
    | 推理強度 | `...openai.reasoningEffort` | (未設定) |
    | 驗證 | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai-codex` OAuth | Browser Talk 和非 Azure 後端橋接可以使用 Codex OAuth |

    `gpt-realtime-2` 可用的內建 Realtime 語音：`alloy`、`ash`、
    `ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI 建議使用 `marin` 和 `cedar` 以取得最佳 Realtime 品質。這
    與上方的文字轉語音語音是不同集合；不要假設像 `fable`、
    `nova` 或 `onyx` 這類 TTS 語音可用於 Realtime 工作階段。

    <Note>
    後端 OpenAI 即時橋接使用 GA Realtime WebSocket 工作階段形態，不接受 `session.temperature`。Azure OpenAI 部署仍可透過 `azureEndpoint` 和 `azureDeployment` 使用，並保留與部署相容的工作階段形態。支援雙向工具呼叫和 G.711 u-law 音訊。
    </Note>

    <Note>
    即時語音會在建立工作階段時選取。OpenAI 允許多數
    工作階段欄位稍後變更，但模型在該工作階段中發出音訊後，
    語音就無法再變更。OpenClaw 目前將內建 Realtime 語音 ID
    以字串公開。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 瀏覽器即時工作階段，搭配 Gateway 鑄造的
    暫時性用戶端密鑰，以及瀏覽器直接對 OpenAI Realtime API
    進行的 WebRTC SDP 交換。未設定直接 OpenAI API 金鑰時，
    Gateway 可以使用所選的 `openai-codex` OAuth
    設定檔鑄造該用戶端密鑰。Gateway 中繼和 Voice Call 後端即時 WebSocket 橋接
    對原生 OpenAI 端點使用相同的 OAuth 後備。維護者可透過
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    進行即時驗證；OpenAI 分支會驗證後端 WebSocket 橋接和瀏覽器
    WebRTC SDP 交換，且不記錄密鑰。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端點

內建的 `openai` 提供者可以透過覆寫基底 URL，將影像
生成導向 Azure OpenAI 資源。在影像生成路徑上，OpenClaw
會偵測 `models.providers.openai.baseUrl` 上的 Azure 主機名稱，並自動切換為
Azure 的請求形態。

<Note>
即時語音使用獨立的設定路徑
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)，
且不受 `models.providers.openai.baseUrl` 影響。其 Azure
設定請參閱 [語音與語音功能](#voice-and-speech) 下方的**即時
語音**摺疊區塊。
</Note>

在下列情況使用 Azure OpenAI：

- 你已經有 Azure OpenAI 訂閱、配額或企業合約
- 你需要 Azure 提供的區域資料駐留或合規控制
- 你想將流量保留在既有的 Azure 租用戶內

### 設定

若要透過內建的 `openai` 提供者使用 Azure 影像生成，請將
`models.providers.openai.baseUrl` 指向你的 Azure 資源，並將 `apiKey` 設為
Azure OpenAI 金鑰 (不是 OpenAI Platform 金鑰)：

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

OpenClaw 會針對 Azure 影像生成路由辨識以下 Azure 主機尾碼：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

對於辨識出的 Azure 主機上的影像生成請求，OpenClaw 會：

- 傳送 `api-key` 標頭，而不是 `Authorization: Bearer`
- 使用部署範圍路徑 (`/openai/deployments/{deployment}/...`)
- 將 `?api-version=...` 附加至每個請求
- 對 Azure 影像生成呼叫使用 600 秒的預設請求逾時。
  每次呼叫的 `timeoutMs` 值仍會覆寫此預設值。

其他基底 URL (公開 OpenAI、OpenAI 相容代理) 會保留標準的
OpenAI 影像請求形態。

<Note>
`openai` 提供者影像生成路徑的 Azure 路由需要
OpenClaw 2026.4.22 或更新版本。較早版本會將任何自訂
`openai.baseUrl` 視為公開 OpenAI 端點，並且在對 Azure
影像部署使用時失敗。
</Note>

  ### API 版本

  設定 `AZURE_OPENAI_API_VERSION`，為 Azure 圖片生成路徑釘選特定的 Azure 預覽版或 GA 版本：

  ```bash
  export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
  ```

  未設定此變數時，預設值為 `2024-12-01-preview`。

  ### 模型名稱就是部署名稱

  Azure OpenAI 會將模型繫結到部署。對於透過內建 `openai` provider 路由的 Azure 圖片生成請求，OpenClaw 中的 `model` 欄位必須是你在 Azure 入口網站中設定的 **Azure 部署名稱**，而不是公開的 OpenAI 模型 ID。

  如果你建立了一個名為 `gpt-image-2-prod`、提供 `gpt-image-2` 服務的部署：

  ```
  /tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
  ```

  相同的部署名稱規則也適用於透過內建 `openai` provider 路由的圖片生成呼叫。

  ### 區域可用性

  Azure 圖片生成目前僅在部分區域可用（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、`uaenorth`）。建立部署前，請查看 Microsoft 目前的區域清單，並確認你的區域提供該特定模型。

  ### 參數差異

  Azure OpenAI 和公開 OpenAI 並不一定接受相同的圖片參數。Azure 可能會拒絕公開 OpenAI 允許的選項（例如 `gpt-image-2` 上的某些 `background` 值），或僅在特定模型版本上公開這些選項。這些差異來自 Azure 和底層模型，而不是 OpenClaw。如果 Azure 請求因驗證錯誤而失敗，請在 Azure 入口網站中查看你的特定部署和 API 版本所支援的參數集合。

  <Note>
  Azure OpenAI 使用原生傳輸與相容行為，但不會收到 OpenClaw 的隱藏歸因標頭 — 請參閱 [進階設定](#advanced-configuration) 下的 **原生與 OpenAI 相容路由** 手風琴區塊。

  對於 Azure 上的聊天或 Responses 流量（圖片生成以外），請使用上線流程或專用的 Azure provider 設定 — 單獨設定 `openai.baseUrl` 不會套用 Azure API/驗證形式。另有一個獨立的 `azure-openai-responses/*` provider；請參閱下方的伺服器端 Compaction 手風琴區塊。
  </Note>

  ## 進階設定

  <AccordionGroup>
  <Accordion title="傳輸（WebSocket 與 SSE）">
    OpenClaw 對 `openai/*` 採用 WebSocket 優先，並以 SSE 作為備援（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw：
    - 在回退到 SSE 之前，會重試一次早期 WebSocket 失敗
    - 失敗後，將 WebSocket 標記為降級約 60 秒，並在冷卻期間使用 SSE
    - 為重試與重新連線附加穩定的工作階段與回合識別標頭
    - 在不同傳輸變體之間正規化用量計數器（`input_tokens` / `prompt_tokens`）

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
    - [使用 WebSocket 的 Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API 回應（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="快速模式">
    OpenClaw 為 `openai/*` 公開共用的快速模式切換：

    - **聊天/UI：** `/fast status|on|off`
    - **設定：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    啟用後，OpenClaw 會將快速模式對應到 OpenAI 優先處理（`service_tier = "priority"`）。現有的 `service_tier` 值會保留，且快速模式不會改寫 `reasoning` 或 `text.verbosity`。

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
    工作階段覆寫會優先於設定。清除工作階段 UI 中的工作階段覆寫後，工作階段會回到已設定的預設值。
    </Note>

  </Accordion>

  <Accordion title="優先處理 (service_tier)">
    OpenAI 的 API 透過 `service_tier` 提供優先處理。在 OpenClaw 中為每個模型設定：

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
    `serviceTier` 只會轉送到原生 OpenAI 端點 (`api.openai.com`) 和原生 Codex 端點 (`chatgpt.com/backend-api`)。如果你透過代理路由任一提供者，OpenClaw 會讓 `service_tier` 保持不變。
    </Warning>

  </Accordion>

  <Accordion title="伺服器端 Compaction (Responses API)">
    對於直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI Plugin 的 Pi-harness 串流包裝器會自動啟用伺服器端 Compaction：

    - 強制 `store: true`（除非模型相容性設定 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 預設 `compact_threshold`：`contextWindow` 的 70%（無法取得時為 `80000`）

    這適用於內建 Pi harness 路徑，以及嵌入式執行所使用的 OpenAI 提供者掛鉤。原生 Codex 應用程式伺服器 harness 會透過 Codex 管理自己的上下文，並由 OpenAI 的預設代理路由或提供者/模型執行階段政策設定。

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
    `responsesServerCompaction` 只控制 `context_management` 注入。直接 OpenAI Responses 模型仍會強制 `store: true`，除非相容性設定 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="嚴格代理式 GPT 模式">
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
    - 當工具動作可用時，不再將僅有計畫的回合視為成功進展
    - 以立即行動引導重試該回合
    - 對大量工作自動啟用 `update_plan`
    - 如果模型持續規劃而不行動，顯示明確的受阻狀態

    <Note>
    僅限於 OpenAI 和 Codex GPT-5 系列執行。其他提供者和較舊的模型系列維持預設行為。
    </Note>

  </Accordion>

  <Accordion title="原生與 OpenAI 相容路由">
    OpenClaw 對直接 OpenAI、Codex 和 Azure OpenAI 端點的處理方式，不同於通用 OpenAI 相容的 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 只對支援 OpenAI `none` 推理 effort 的模型保留 `reasoning: { effort: "none" }`
    - 對拒絕 `reasoning.effort: "none"` 的模型或代理省略已停用的推理
    - 預設將工具結構描述設為嚴格模式
    - 只在已驗證的原生主機上附加隱藏的歸因標頭
    - 保留 OpenAI 專用的請求塑形（`service_tier`、`store`、推理相容性、提示快取提示）

    **代理/相容路由：**
    - 使用較寬鬆的相容行為
    - 從非原生 `openai-completions` 酬載中移除 Completions `store`
    - 接受進階 `params.extra_body`/`params.extraBody` 直通 JSON，用於 OpenAI 相容的 Completions 代理
    - 接受 `params.chat_template_kwargs`，用於 vLLM 等 OpenAI 相容的 Completions 代理
    - 不強制使用嚴格工具結構描述或僅限原生的標頭

    Azure OpenAI 使用原生傳輸和相容行為，但不會接收隱藏的歸因標頭。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="影像生成" href="/zh-TW/tools/image-generation" icon="image">
    共用影像工具參數和提供者選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數和提供者選擇。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資料和憑證重複使用規則。
  </Card>
</CardGroup>
