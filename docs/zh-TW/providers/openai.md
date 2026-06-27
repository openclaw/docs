---
read_when:
    - 您想在 OpenClaw 中使用 OpenAI 模型
    - 你想要使用 Codex 訂閱驗證，而不是 API 金鑰
    - 你需要更嚴格的 GPT-5 代理程式執行行為
summary: 在 OpenClaw 中透過 API 金鑰或 Codex 訂閱使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-06-27T19:56:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI 提供 GPT 模型的開發者 API，而 Codex 也可透過 OpenAI 的 Codex 用戶端，作為 ChatGPT 方案的程式碼代理使用。OpenClaw 對兩種驗證形式都使用同一個提供者 ID：`openai`。

OpenClaw 使用 `openai/*` 作為標準 OpenAI 模型路由。嵌入式代理在 OpenAI 模型上的回合，預設會透過原生 Codex app-server 執行階段執行；直接 OpenAI API 金鑰驗證仍可用於非代理 OpenAI 介面，例如圖片、嵌入、語音與即時功能。

- **代理模型** - 透過 Codex 執行階段使用 `openai/*` 模型；若要使用 ChatGPT/Codex 訂閱，請使用 Codex 驗證登入，或在你刻意要使用 API 金鑰驗證時，設定與 Codex 相容的 OpenAI API 金鑰備援。
- **非代理 OpenAI API** - 透過 `OPENAI_API_KEY` 或 OpenAI API 金鑰導引流程，直接存取 OpenAI Platform，並採用依用量計費。
- **舊版設定** - 舊版 Codex 模型參照會由 `openclaw doctor --fix` 修復為 `openai/*` 加上 Codex 執行階段。

OpenAI 明確支援在 OpenClaw 這類外部工具與工作流程中使用訂閱 OAuth。

提供者、模型、執行階段與頻道是分開的層。如果這些標籤被混在一起，請先閱讀[代理執行階段](/zh-TW/concepts/agent-runtimes)，再變更設定。

## 快速選擇

| 目標                                                 | 使用                                                     | 備註                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| 搭配原生 Codex 執行階段的 ChatGPT/Codex 訂閱 | `openai/gpt-5.5`                                         | 預設 OpenAI 代理設定。使用 Codex 驗證登入。                  |
| 代理模型的直接 API 金鑰計費              | `openai/gpt-5.5` 加上與 Codex 相容的 API 金鑰設定檔 | 使用 `auth.order.openai` 將備援放在訂閱驗證之後。  |
| 透過明確 OpenClaw 的直接 API 金鑰計費     | `openai/gpt-5.5` 加上提供者/模型執行階段 `openclaw`  | 選取一般的 `openai` API 金鑰設定檔。                             |
| 最新 ChatGPT Instant API 別名                     | `openai/chat-latest`                                     | 僅限直接 API 金鑰。供實驗使用的移動別名，不是預設值。   |
| 透過 OpenClaw 使用 ChatGPT/Codex 訂閱驗證     | `openai/gpt-5.5` 加上提供者/模型執行階段 `openclaw`  | 為相容性路由選取 `openai` OAuth 設定檔。         |
| 圖片產生或編輯                          | `openai/gpt-image-2`                                     | 可搭配 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。             |
| 透明背景圖片                        | `openai/gpt-image-1.5`                                   | 使用 `outputFormat=png` 或 `webp`，以及 `openai.background=transparent`。 |

## 命名對照

這些名稱相似，但不能互換：

| 你看到的名稱                            | 層             | 意義                                                                                           |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | 提供者前綴   | 標準 OpenAI 模型路由；代理回合使用 Codex 執行階段。                                  |
| 舊版 OpenAI Codex 前綴              | 舊版前綴     | 較舊的模型/設定檔命名空間。`openclaw doctor --fix` 會將其遷移到 `openai`。                   |
| `codex` 外掛                          | 外掛            | 內建 OpenClaw 外掛，提供原生 Codex app-server 執行階段與 `/codex` 聊天控制。 |
| 提供者/模型 `agentRuntime.id: codex` | 代理執行階段     | 強制相符的嵌入式回合使用原生 Codex app-server harness。                            |
| `/codex ...`                            | 聊天命令集  | 從對話繫結/控制 Codex app-server 執行緒。                                        |
| `runtime: "acp", agentId: "codex"`      | ACP 工作階段路由 | 透過 ACP/acpx 執行 Codex 的明確備援路徑。                                          |

這表示設定可以刻意包含 `openai/*` 模型參照，而驗證設定檔則指向 API 金鑰或 ChatGPT/Codex OAuth 憑證。設定請使用 `auth.order.openai`；`openclaw doctor --fix` 會將舊版 Codex 模型參照、舊版 Codex 驗證設定檔 ID，以及舊版 Codex 驗證順序重寫為標準 OpenAI 路由。

<Note>
GPT-5.5 可透過直接 OpenAI Platform API 金鑰存取與訂閱/OAuth 路由使用。若要使用 ChatGPT/Codex 訂閱加上原生 Codex 執行，請使用 `openai/gpt-5.5`；目前未設定執行階段時，OpenAI 代理回合會選取 Codex harness。只有在你想要對 OpenAI 代理模型使用直接 API 金鑰驗證時，才使用 OpenAI API 金鑰設定檔。
</Note>

<Note>
OpenAI 代理模型回合需要內建 Codex app-server 外掛。明確 OpenClaw 執行階段設定仍可作為選用的相容性路由。當使用 `openai` OAuth 設定檔明確選取 OpenClaw 時，OpenClaw 會將公開模型參照保留為 `openai/*`，並在內部透過 Codex 驗證傳輸路由。執行 `openclaw doctor --fix` 以修復過時的舊版 Codex 模型參照、`codex-cli/*`，或不是來自明確執行階段設定的舊執行階段工作階段釘選。
</Note>

## OpenClaw 功能涵蓋範圍

| OpenAI 能力         | OpenClaw 介面                                                                              | 狀態                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 聊天 / Responses          | `openai/<model>` 模型提供者                                                               | 是                                                                    |
| Codex 訂閱模型 | 搭配 OpenAI OAuth 的 `openai/<model>`                                                            | 是                                                                    |
| 舊版 Codex 模型參照   | 舊版 Codex 模型參照或 `codex-cli/<model>`                                                | 由 doctor 修復為 `openai/<model>`                                 |
| Codex app-server harness  | 省略執行階段的 `openai/<model>`，或提供者/模型 `agentRuntime.id: codex`              | 是                                                                    |
| 伺服器端網路搜尋    | 原生 OpenAI Responses 工具                                                                  | 是，在已啟用網路搜尋且未釘選提供者時                 |
| 圖片                    | `image_generate`                                                                              | 是                                                                    |
| 影片                    | `video_generate`                                                                              | 是                                                                    |
| 文字轉語音            | `messages.tts.provider: "openai"` / `tts`                                                     | 是                                                                    |
| 批次語音轉文字      | `tools.media.audio` / 媒體理解                                                     | 是                                                                    |
| 串流語音轉文字  | Voice Call `streaming.provider: "openai"`                                                     | 是                                                                    |
| 即時語音            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | 是（需要 OpenAI Platform 額度，而不是 Codex/ChatGPT 訂閱） |
| 嵌入                | 記憶嵌入提供者                                                                     | 是                                                                    |

<Note>
  OpenAI Realtime 語音（由 Voice Call 的 `realtime.provider: "openai"` 和
  使用 `talk.realtime.provider: "openai"` 的 Control UI Talk 使用）會透過
  公開的 **OpenAI Platform Realtime API**，其費用會從 OpenAI
  Platform 額度扣款，而不是 Codex/ChatGPT 訂閱配額。即使帳戶
  具備正常的 OpenAI OAuth，且可順利執行 Codex 支援的聊天模型，
  Realtime 語音仍需要 OpenAI API 金鑰驗證設定檔，或具備已儲值
  Platform 計費的 Platform API 金鑰。

修正方式：在
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
為支援你的即時憑證的組織儲值 Platform 額度。Realtime 語音接受
由 `openclaw onboard --auth-choice openai-api-key` 建立的 `openai` API 金鑰驗證設定檔、
透過 `talk.realtime.providers.openai.apiKey`
為 Control UI Talk 設定的 Platform `OPENAI_API_KEY`、透過
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
為 Voice Call 設定的 Platform `OPENAI_API_KEY`，或 `OPENAI_API_KEY` 環境變數。OpenAI OAuth
設定檔仍可在同一個 OpenClaw 安裝中執行 Codex 支援的 `openai/*` 聊天模型，
但它們不會設定 Realtime 語音。
</Note>

## 記憶嵌入

OpenClaw 可以使用 OpenAI，或與 OpenAI 相容的嵌入端點，來進行
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

對於需要非對稱嵌入標籤的 OpenAI 相容端點，請在 `memorySearch` 下設定
`queryInputType` 和 `documentInputType`。OpenClaw 會將它們作為提供者特定的
`input_type` 請求欄位轉送：查詢嵌入使用 `queryInputType`；已索引的記憶片段與批次索引使用
`documentInputType`。完整範例請參閱[記憶設定參考](/zh-TW/reference/memory-config#provider-specific-config)。

## 開始使用

選擇你偏好的驗證方式，並依照設定步驟操作。

<Tabs>
  <Tab title="API 金鑰（OpenAI Platform）">
    **最適合：** 直接 API 存取與依用量計費。

    <Steps>
      <Step title="取得你的 API 金鑰">
        從 [OpenAI Platform 儀表板](https://platform.openai.com/api-keys)建立或複製 API 金鑰。
      </Step>
      <Step title="執行導引流程">
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
    | `openai/gpt-5.5`      | 省略 / 提供者/模型 `agentRuntime.id: "codex"` | Codex app-server harness | 與 Codex 相容的 OpenAI 設定檔 |
    | `openai/gpt-5.4-mini` | 省略 / 提供者/模型 `agentRuntime.id: "codex"` | Codex app-server harness | 與 Codex 相容的 OpenAI 設定檔 |
    | `openai/gpt-5.5`      | 提供者/模型 `agentRuntime.id: "openclaw"`              | OpenClaw 嵌入式執行階段      | 已選取的 `openai` 設定檔 |

    <Note>
    `openai/*` 代理模型使用 Codex 應用伺服器 harness。若要對代理模型使用 API 金鑰
    驗證，請建立與 Codex 相容的 API 金鑰設定檔，並透過
    `auth.order.openai` 排序；`OPENAI_API_KEY` 仍是
    非代理 OpenAI API 介面的直接後援。執行 `openclaw doctor --fix` 以遷移較舊的
    舊版 Codex 驗證順序項目。
    </Note>

    ### 設定範例

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    若要從 OpenAI API 試用 ChatGPT 目前的 Instant 模型，請將模型設為
    `openai/chat-latest`：

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` 是會變動的別名。OpenAI 將其記載為 ChatGPT 使用的最新 Instant
    模型，並建議在生產 API 使用情境中使用 `gpt-5.5`，因此除非你明確需要該
    別名行為，否則請將 `openai/gpt-5.5` 保持為穩定預設值。此別名目前只接受
    `medium` 文字詳細程度，因此 OpenClaw 會為此模型正規化不相容的 OpenAI
    文字詳細程度覆寫。

    <Warning>
    OpenClaw **不會**在直接 OpenAI API 金鑰路由上公開 `gpt-5.3-codex-spark`。只有當你登入的帳號公開該模型時，才能透過 Codex 訂閱目錄項目使用它。
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **最適合：** 使用你的 ChatGPT/Codex 訂閱搭配原生 Codex 應用伺服器執行，而不是使用獨立 API 金鑰。Codex 雲端需要 ChatGPT 登入。

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        或直接執行 OAuth：

        ```bash
        openclaw models auth login --provider openai
        ```

        對於無頭或不適合回呼的設定，請加入 `--device-code`，改用 ChatGPT 裝置碼流程登入，而不是 localhost 瀏覽器回呼：

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        預設路徑不需要執行階段設定。OpenAI 代理回合會自動選擇原生 Codex
        應用伺服器執行階段，而 OpenClaw 會在選擇此路由時安裝或修復內建的 Codex 外掛。
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai
        ```

        閘道執行後，請在聊天中傳送 `/codex status` 或 `/codex models`
        以驗證原生應用伺服器執行階段。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照 | 執行階段設定 | 路由 | 驗證 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | 省略 / provider/model `agentRuntime.id: "codex"` | 原生 Codex 應用伺服器 harness | Codex 登入或已排序的 `openai` 驗證設定檔 |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | 具內部 Codex 驗證傳輸的 OpenClaw 內嵌執行階段 | 選取的 `openai` OAuth 設定檔 |
    | 舊版 Codex GPT-5.5 參照 | 由 doctor 修復 | 舊版路由改寫為 `openai/gpt-5.5` | 已遷移的 OpenAI OAuth 設定檔 |
    | `codex-cli/gpt-5.5` | 由 doctor 修復 | 舊版命令列介面路由改寫為 `openai/gpt-5.5` | Codex 應用伺服器驗證 |

    <Warning>
    新的訂閱支援代理設定請偏好使用 `openai/gpt-5.5`。較舊的
    舊版 Codex GPT 參照是舊版 OpenClaw 路由，而不是原生 Codex 執行階段
    路徑；當你想將它們遷移到標準 `openai/*` 參照時，請執行
    `openclaw doctor --fix`。`gpt-5.3-codex-spark` 仍限於其
    Codex 訂閱目錄宣告該模型的帳號；其直接 OpenAI API 金鑰和
    Azure 參照仍會被隱藏。
    </Warning>

    <Note>
    舊版 Codex 模型前綴是由 doctor 修復的舊版設定。對於常見的
    訂閱加原生執行階段設定，請使用 Codex 驗證登入，
    但將模型參照保持為 `openai/gpt-5.5`。新設定應將 OpenAI
    代理驗證順序放在 `auth.order.openai` 下；doctor 會遷移較舊的
    舊版 Codex 驗證順序項目。
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

    若有 API 金鑰備援，請將模型維持在 `openai/gpt-5.5`，並將
    驗證順序放在 `openai` 下。OpenClaw 會先嘗試訂閱，再嘗試
    API 金鑰，同時保持在 Codex harness 上：

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
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding 不再從 `~/.codex` 匯入 OAuth 資料。請使用瀏覽器 OAuth（預設）或上方的裝置碼流程登入 — OpenClaw 會在自己的代理驗證存放區中管理產生的憑證。
    </Note>

    ### 檢查並復原 Codex OAuth 路由

    使用這些命令查看你的預設代理正在使用哪個模型、執行階段和驗證路由：

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    對於特定代理，請加入 `--agent <id>`：

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    如果較舊的設定仍有舊版 Codex GPT 參照，或沒有明確執行階段設定的過時 OpenAI 執行階段
    工作階段釘選，請修復它：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai` 顯示沒有可用的設定檔，請重新
    登入：

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    當你想在同一個代理中使用多個 Codex OAuth 登入，並稍後想透過驗證排序或 `/model ...@<profileId>` 控制它們時，請使用 `--profile-id`：

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` 是 OpenAI 代理回合透過 Codex 使用的模型路由。請執行
    `openclaw doctor --fix`，在依賴設定檔排序前遷移較舊的舊版 OpenAI Codex 前綴設定檔 id 和
    順序項目。

    ### 狀態指示器

    聊天 `/status` 會顯示目前工作階段啟用的模型執行階段。
    內建的 Codex 應用伺服器 harness 會在 OpenAI 代理模型回合中顯示為
    `Runtime: OpenAI Codex`。過時的 OpenAI 執行階段工作階段釘選會被修復為 Codex，除非
    設定明確釘選 OpenClaw。

    ### Doctor 警告

    如果設定或工作階段狀態中仍保留舊版 Codex 模型參照或過時的 OpenAI 執行階段釘選，
    `openclaw doctor --fix` 會將它們改寫為搭配 Codex 執行階段的 `openai/*`，
    除非已明確設定 OpenClaw。

    ### 上下文視窗上限

    OpenClaw 會將模型中繼資料與執行階段上下文上限視為不同的值。

    對於透過 Codex OAuth 目錄使用的 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 預設執行階段 `contextTokens` 上限：`272000`

    較小的預設上限在實務上具有較佳的延遲和品質特性。請使用 `contextTokens` 覆寫它：

    ```json5
    {
      models: {
        providers: {
          openai: {
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

    當上游 Codex 目錄中繼資料存在時，OpenClaw 會將其用於 `gpt-5.5`。
    如果即時 Codex 探索在帳號已驗證時省略 `gpt-5.5` 列，
    OpenClaw 會合成該 OAuth 模型列，讓
    排程、子代理和已設定的預設模型執行不會因
    `Unknown model` 而失敗。

  </Tab>
</Tabs>

## 原生 Codex 應用伺服器驗證

原生 Codex 應用伺服器 harness 使用 `openai/*` 模型參照，加上省略的
執行階段設定或 provider/model `agentRuntime.id: "codex"`，但其驗證
仍是以帳號為基礎。OpenClaw 會依下列順序選擇驗證：

1. 代理的已排序 OpenAI 驗證設定檔，最好放在
   `auth.order.openai` 下。執行 `openclaw doctor --fix` 以遷移較舊的
   舊版 Codex 驗證設定檔 id 和舊版 Codex 驗證順序。
2. 應用伺服器的現有帳號，例如本機 Codex 命令列介面 ChatGPT 登入。
3. 僅限本機 stdio 應用伺服器啟動時，當應用伺服器回報沒有帳號但仍需要
   OpenAI 驗證時，使用 `CODEX_API_KEY`，再使用
   `OPENAI_API_KEY`。

這表示本機 ChatGPT/Codex 訂閱登入不會只因為閘道程序也有
`OPENAI_API_KEY` 可供直接 OpenAI 模型或 embeddings 使用就被取代。
環境 API 金鑰後援只適用於本機 stdio 無帳號路徑；它
不會傳送到 WebSocket 應用伺服器連線。選取訂閱式 Codex
設定檔時，OpenClaw 也會將 `CODEX_API_KEY` 和 `OPENAI_API_KEY`
排除於產生的 stdio 應用伺服器子程序之外，並透過應用伺服器登入 RPC 傳送選取的憑證。
當該訂閱設定檔因 Codex 使用限制而受阻時，OpenClaw 可以輪替到下一個已排序的 `openai:*` API 金鑰
設定檔，而不變更所選模型，也不離開 Codex
harness。一旦訂閱重設時間已過，該訂閱設定檔就會再次符合資格。

## 圖像生成

內建的 `openai` 外掛會透過 `image_generate` 工具註冊圖像生成。
它同時支援 OpenAI API 金鑰圖像生成，以及透過相同 `openai/gpt-image-2` 模型參照的 Codex OAuth 圖像
生成。

| 能力                | OpenAI API 金鑰                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型參照                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 驗證                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登入           |
| 傳輸                 | OpenAI Images API                  | Codex Responses 後端              |
| 每次請求最大圖像數    | 4                                  | 4                                    |
| 編輯模式                 | 已啟用（最多 5 張參考圖像） | 已啟用（最多 5 張參考圖像）   |
| 尺寸覆寫            | 支援，包含 2K/4K 尺寸   | 支援，包含 2K/4K 尺寸     |
| 長寬比 / 解析度 | 不轉送至 OpenAI Images API | 安全時對應到支援的尺寸 |

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
請參閱[圖像生成](/zh-TW/tools/image-generation)以了解共用工具參數、供應商選擇和容錯移轉行為。
</Note>

`gpt-image-2` 是 OpenAI 文字轉圖像生成和圖像
編輯的預設值。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作為
明確模型覆寫使用。請使用 `openai/gpt-image-1.5` 產生透明背景
PNG/WebP 輸出；目前的 `gpt-image-2` API 會拒絕
`background: "transparent"`。

對於透明背景請求，代理應該以 `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及 `background: "transparent"` 呼叫 `image_generate`；較舊的 `openai.background` 提供者選項仍會被接受。OpenClaw 也會透過將預設 `openai/gpt-image-2` 透明請求重寫為 `gpt-image-1.5`，保護公開 OpenAI 和 OpenAI Codex OAuth 路由；Azure 和自訂 OpenAI 相容端點會保留其設定的部署/模型名稱。

相同設定也公開給無頭命令列介面執行使用：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

從輸入檔案開始時，請將相同的 `--output-format` 和 `--background` 旗標搭配 `openclaw infer image edit` 使用。
`--openai-background` 仍可作為 OpenAI 專用別名使用。
需要控制 OpenAI Images 品質與成本時，請使用 `--quality low|medium|high|auto`。請使用 `--openai-moderation low|auto`，從 `image generate` 或 `image edit` 傳遞 OpenAI 的提供者專用審核提示。

對於 ChatGPT/Codex OAuth 安裝，請保留相同的 `openai/gpt-image-2` 參照。設定 `openai` OAuth 設定檔時，OpenClaw 會解析該已儲存的 OAuth 存取權杖，並透過 Codex Responses 後端傳送影像請求。它不會先嘗試 `OPENAI_API_KEY`，也不會對該請求靜默退回使用 API 金鑰。當你想改用直接的 OpenAI Images API 路由時，請明確以 API 金鑰、自訂基底 URL 或 Azure 端點設定 `models.providers.openai`。
如果該自訂影像端點位於受信任的 LAN/私人位址，也請設定 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在這項選擇加入，否則 OpenClaw 會持續封鎖私人/內部 OpenAI 相容影像端點。

產生：

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

產生透明 PNG：

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

編輯：

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 影片生成

內建的 `openai` 外掛會透過 `video_generate` 工具註冊影片生成。

| 功能 | 值 |
| ---------------- | --------------------------------------------------------------------------------- |
| 預設模型 | `openai/sora-2` |
| 模式 | 文字轉影片、影像轉影片、單一影片編輯 |
| 參考輸入 | 1 張影像或 1 部影片 |
| 尺寸覆寫 | 支援文字轉影片和影像轉影片 |
| 其他覆寫 | `aspectRatio`、`resolution`、`audio`、`watermark` 會被忽略並顯示工具警告 |

OpenAI 影像轉影片請求會使用帶有影像 `input_reference` 的 `POST /v1/videos`。單一影片編輯會使用 `POST /v1/videos/edits`，並將上傳的影片放在 `video` 欄位中。

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
請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、提供者選擇與故障轉移行為。
</Note>

## GPT-5 提示貢獻

OpenClaw 會為 OpenClaw 組裝的提示表面上的 GPT-5 系列執行新增共用 GPT-5 提示貢獻。它會依模型 ID 套用，因此 OpenClaw/提供者路由，例如舊版修復前參照（舊版 Codex GPT-5.5 參照）、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`，以及其他相容的 GPT-5 參照，都會收到相同的覆蓋層。較舊的 GPT-4.x 模型不會。

內建原生 Codex harness 不會透過 Codex app-server 開發者指令收到這個 OpenClaw GPT-5 覆蓋層。原生 Codex 會保留 Codex 擁有的基底、模型與專案文件行為，而 OpenClaw 會停用原生執行緒中 Codex 內建的人格，讓代理工作區人格檔案保持權威。OpenClaw 只貢獻執行階段脈絡，例如通道傳遞、OpenClaw 動態工具、ACP 委派、工作區脈絡與 OpenClaw skills。

GPT-5 貢獻會為人格持續性、執行安全、工具紀律、輸出形狀、完成檢查，以及相符 OpenClaw 組裝提示上的驗證新增帶標籤的行為契約。通道專屬回覆與靜默訊息行為會保留在共用 OpenClaw 系統提示和輸出傳遞政策中。友善互動風格層是獨立且可設定的。

| 值 | 效果 |
| ---------------------- | ------------------------------------------- |
| `"friendly"`（預設） | 啟用友善互動風格層 |
| `"on"` | `"friendly"` 的別名 |
| `"off"` | 僅停用友善風格層 |

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
  <Tab title="命令列介面">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
值在執行階段不區分大小寫，因此 `"Off"` 和 `"off"` 都會停用友善風格層。
</Tip>

<Note>
當共用的 `agents.defaults.promptOverlays.gpt5.personality` 設定未設定時，仍會讀取舊版 `plugins.entries.openai.config.personality` 作為相容性備援。
</Note>

## 語音與語音辨識

<AccordionGroup>
  <Accordion title="語音合成 (TTS)">
    內建的 `openai` 外掛會為 `messages.tts` 表面註冊語音合成。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 語音 | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` |（未設定）|
    | 指令 | `messages.tts.providers.openai.instructions` |（未設定，僅 `gpt-4o-mini-tts`）|
    | 格式 | `messages.tts.providers.openai.responseFormat` | 語音備註使用 `opus`，檔案使用 `mp3` |
    | API 金鑰 | `messages.tts.providers.openai.apiKey` | 退回使用 `OPENAI_API_KEY` |
    | 基底 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 額外主體 | `messages.tts.providers.openai.extraBody` / `extra_body` |（未設定）|

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用語音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 會在 OpenClaw 產生的欄位之後合併到 `/audio/speech` 請求 JSON 中，因此可將它用於需要額外鍵（例如 `lang`）的 OpenAI 相容端點。原型鍵會被忽略。

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    設定 `OPENAI_TTS_BASE_URL` 可覆寫 TTS 基底 URL，而不影響聊天 API 端點。OpenAI TTS 和 Realtime 語音都透過 OpenAI Platform API 金鑰設定；僅 OAuth 的安裝仍可使用 Codex 支援的聊天模型，但不能使用 OpenAI 即時語音回話。
    </Note>

  </Accordion>

  <Accordion title="語音轉文字">
    內建的 `openai` 外掛會透過 OpenClaw 的媒體理解轉錄表面註冊批次語音轉文字。

    - 預設模型：`gpt-4o-transcribe`
    - 端點：OpenAI REST `/v1/audio/transcriptions`
    - 輸入路徑：multipart 音訊檔案上傳
    - 在 OpenClaw 中，任何輸入音訊轉錄使用 `tools.media.audio` 的地方都支援，包括 Discord 語音頻道片段和通道音訊附件

    若要強制輸入音訊轉錄使用 OpenAI：

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

    語言和提示提示會在由共用音訊媒體設定或逐次呼叫轉錄請求提供時轉送給 OpenAI。

  </Accordion>

  <Accordion title="即時轉錄">
    內建的 `openai` 外掛會為 Voice Call 外掛註冊即時轉錄。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 語言 | `...openai.language` |（未設定）|
    | 提示 | `...openai.prompt` |（未設定）|
    | 靜音持續時間 | `...openai.silenceDurationMs` | `800` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | 驗證 | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai` OAuth | API 金鑰直接連線；OAuth 會鑄造 Realtime 轉錄用戶端密鑰 |

    <Note>
    使用 WebSocket 連線至 `wss://api.openai.com/v1/realtime`，並使用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音訊。當只設定 `openai` OAuth 時，閘道會在開啟 WebSocket 前鑄造一個臨時 Realtime 轉錄用戶端密鑰。此串流提供者用於 Voice Call 的即時轉錄路徑；Discord 語音目前會錄製短片段，並改用批次 `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="即時語音">
    內建的 `openai` 外掛會為 Voice Call 外掛註冊即時語音。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | 語音 | `...openai.voice` | `alloy` |
    | 溫度（Azure 部署橋接） | `...openai.temperature` | `0.8` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | 靜音持續時間 | `...openai.silenceDurationMs` | `500` |
    | 前綴填補 | `...openai.prefixPaddingMs` | `300` |
    | 推理努力程度 | `...openai.reasoningEffort` |（未設定）|
    | 驗證 | `openai` API 金鑰驗證設定檔、`...openai.apiKey` 或 `OPENAI_API_KEY` | 需要 OpenAI Platform API 金鑰；OpenAI OAuth 不會設定 Realtime 語音 |

    `gpt-realtime-2` 可用的內建 Realtime 語音：`alloy`、`ash`、`ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI 建議使用 `marin` 和 `cedar` 以取得最佳 Realtime 品質。這是與上述文字轉語音不同的一組語音；請勿假設 TTS 語音（例如 `fable`、`nova` 或 `onyx`）對 Realtime 工作階段有效。

    <Note>
    後端 OpenAI realtime 橋接使用 GA Realtime WebSocket 工作階段形狀，該形狀不接受 `session.temperature`。Azure OpenAI 部署仍可透過 `azureEndpoint` 和 `azureDeployment` 使用，並保留與部署相容的工作階段形狀。支援雙向工具呼叫和 G.711 u-law 音訊。
    </Note>

    <Note>
    即時語音會在建立工作階段時選取。OpenAI 允許稍後變更大多數工作階段欄位，但在模型於該工作階段中發出音訊後，便無法變更語音。OpenClaw 目前將內建 Realtime 語音 ID 公開為字串。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 瀏覽器即時工作階段，搭配由閘道簽發的
    臨時用戶端密鑰，並透過直接的瀏覽器 WebRTC SDP 交換連到
    OpenAI Realtime API。閘道會使用所選的
    `openai` API 金鑰驗證設定檔，或已設定的 OpenAI Platform API 金鑰來簽發該用戶端密鑰。閘道
    轉送與 Voice Call 後端即時 WebSocket 橋接，對原生 OpenAI 端點使用相同的
    僅 API 金鑰驗證路徑。維護者可用
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    進行即時驗證；OpenAI 端會驗證後端 WebSocket 橋接與瀏覽器
    WebRTC SDP 交換，且不記錄密鑰。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端點

內建的 `openai` 提供者可透過覆寫基底 URL，將影像
生成導向 Azure OpenAI 資源。在影像生成路徑上，OpenClaw
會偵測 `models.providers.openai.baseUrl` 上的 Azure 主機名稱，並自動切換為
Azure 的請求格式。

<Note>
即時語音使用獨立的設定路徑
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)，
不受 `models.providers.openai.baseUrl` 影響。請參閱 [Voice and speech](#voice-and-speech) 下方的 **Realtime
voice** 摺疊區，以了解其 Azure
設定。
</Note>

在以下情況使用 Azure OpenAI：

- 你已有 Azure OpenAI 訂閱、配額或企業合約
- 你需要 Azure 提供的區域資料落地或合規控制
- 你想讓流量保留在既有的 Azure 租用戶內

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

OpenClaw 會針對 Azure 影像生成
路由辨識下列 Azure 主機尾碼：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

對於辨識為 Azure 主機上的影像生成請求，OpenClaw 會：

- 傳送 `api-key` 標頭，而不是 `Authorization: Bearer`
- 使用部署範圍路徑 (`/openai/deployments/{deployment}/...`)
- 對每個請求附加 `?api-version=...`
- 對 Azure 影像生成呼叫使用 600 秒的預設請求逾時。
  每次呼叫的 `timeoutMs` 值仍會覆寫此預設值。

其他基底 URL（公開 OpenAI、OpenAI 相容代理）會保留標準的
OpenAI 影像請求格式。

<Note>
`openai` 提供者影像生成路徑的 Azure 路由需要
OpenClaw 2026.4.22 或更新版本。較早版本會將任何自訂
`openai.baseUrl` 視為公開 OpenAI 端點，並會在 Azure
影像部署上失敗。
</Note>

### API 版本

設定 `AZURE_OPENAI_API_VERSION`，為 Azure 影像生成路徑固定特定的 Azure 預覽版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未設定變數時，預設值為 `2024-12-01-preview`。

### 模型名稱就是部署名稱

Azure OpenAI 會將模型綁定到部署。對於透過內建 `openai` 提供者
路由的 Azure 影像生成請求，OpenClaw 中的 `model` 欄位
必須是你在 Azure 入口網站中設定的 **Azure 部署名稱**，而不是
公開 OpenAI 模型 ID。

如果你建立名為 `gpt-image-2-prod`、用來提供 `gpt-image-2` 的部署：

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

Azure OpenAI 與公開 OpenAI 不一定接受相同的影像參數。
Azure 可能會拒絕公開 OpenAI 允許的選項（例如
`gpt-image-2` 上的某些 `background` 值），或只在特定模型
版本上公開這些選項。這些差異來自 Azure 與底層模型，而不是
OpenClaw。如果 Azure 請求因驗證錯誤而失敗，請在
Azure 入口網站中檢查你的特定部署與 API 版本支援的
參數集合。

<Note>
Azure OpenAI 使用原生傳輸與相容行為，但不會接收
OpenClaw 的隱藏歸因標頭 — 請參閱 [Advanced configuration](#advanced-configuration) 下方的 **Native vs OpenAI-compatible
routes** 摺疊區。

對於 Azure 上的聊天或 Responses 流量（影像生成以外），請使用
導覽設定流程或專用的 Azure 提供者設定 — 單靠 `openai.baseUrl`
不會套用 Azure API/驗證格式。另有
`azure-openai-responses/*` 提供者；請參閱下方的伺服器端壓縮摺疊區。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw 對 `openai/*` 優先使用 WebSocket，並以 SSE 備援 (`"auto"`)。

    在 `"auto"` 模式中，OpenClaw 會：
    - 在回退至 SSE 前，重試一次早期 WebSocket 失敗
    - 失敗後，將 WebSocket 標記為降級約 60 秒，並在冷卻期間使用 SSE
    - 為重試與重新連線附加穩定的工作階段與回合身分標頭
    - 在不同傳輸變體間標準化用量計數器 (`input_tokens` / `prompt_tokens`)

    | 值 | 行為 |
    |-------|----------|
    | `"auto"`（預設） | 優先 WebSocket，SSE 備援 |
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
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Fast mode">
    OpenClaw 針對 `openai/*` 提供共用的快速模式切換：

    - **聊天/UI：** `/fast status|auto|on|off`
    - **設定：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    啟用後，OpenClaw 會將快速模式對應到 OpenAI 優先處理 (`service_tier = "priority"`)。既有的 `service_tier` 值會保留，快速模式不會改寫 `reasoning` 或 `text.verbosity`。`fastMode: "auto"` 會讓新的模型呼叫在自動截止前使用快速模式，之後的重試、備援、工具結果或接續呼叫則不使用快速模式。截止預設為 60 秒；可在作用中的模型上設定 `params.fastAutoOnSeconds` 來變更。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    工作階段覆寫優先於設定。在 Sessions UI 中清除工作階段覆寫後，工作階段會回到已設定的預設值。
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    OpenAI 的 API 透過 `service_tier` 提供優先處理。可在 OpenClaw 中按模型設定：

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
    `serviceTier` 只會轉送至原生 OpenAI 端點 (`api.openai.com`) 和原生 Codex 端點 (`chatgpt.com/backend-api`)。如果你透過代理路由任一提供者，OpenClaw 會讓 `service_tier` 保持不變。
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    對於直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI 外掛的 OpenClaw 串流包裝器會自動啟用伺服器端壓縮：

    - 強制 `store: true`（除非模型相容設定設為 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 預設 `compact_threshold`：`contextWindow` 的 70%（無法取得時為 `80000`）

    這會套用於內建 OpenClaw 執行階段路徑，以及嵌入式執行使用的 OpenAI 提供者掛鉤。原生 Codex 應用伺服器 harness 會透過 Codex 管理自己的脈絡，並由 OpenAI 的預設代理路由或提供者/模型執行階段策略設定。

    <Tabs>
      <Tab title="Enable explicitly">
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
      <Tab title="Custom threshold">
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
      <Tab title="Disable">
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
    `responsesServerCompaction` 只控制 `context_management` 注入。直接 OpenAI Responses 模型仍會強制 `store: true`，除非相容設定設為 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
    對於 `openai/*` 上的 GPT-5 系列執行，OpenClaw 可使用更嚴格的嵌入式執行合約：

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    使用 `strict-agentic` 時，OpenClaw 會：
    - 對實質工作自動啟用 `update_plan`
    - 對結構上空白或僅推理的回合，以可見答案接續重試
    - 在所選 harness 提供明確計畫事件時使用它們

    OpenClaw 不會分類助理文字來判斷某個回合是計畫、進度更新或最終答案。

    <Note>
    僅限 OpenAI 與 Codex GPT-5 系列執行。其他提供者與較舊模型系列會保留預設行為。
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw 會將直接 OpenAI、Codex 與 Azure OpenAI 端點，和通用 OpenAI 相容 `/v1` 代理做不同處理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 只對支援 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 對會拒絕 `reasoning.effort: "none"` 的模型或代理省略停用的推理
    - 預設將工具結構描述設為嚴格模式
    - 只在已驗證的原生主機上附加隱藏歸因標頭
    - 保留僅 OpenAI 使用的請求格式（`service_tier`、`store`、推理相容性、提示快取提示）

    **代理/相容路由：**
    - 使用較寬鬆的相容行為
    - 從非原生 `openai-completions` 承載中移除 Completions `store`
    - 接受用於 OpenAI 相容 Completions 代理的進階 `params.extra_body`/`params.extraBody` 透傳 JSON
    - 接受用於 OpenAI 相容 Completions 代理（例如 vLLM）的 `params.chat_template_kwargs`
    - 不強制使用嚴格的工具結構描述或僅限原生的標頭

    Azure OpenAI 使用原生傳輸與相容行為，但不會收到隱藏的歸因標頭。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="圖像生成" href="/zh-TW/tools/image-generation" icon="image">
    共用圖像工具參數與提供者選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與提供者選擇。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊與憑證重用規則。
  </Card>
</CardGroup>
