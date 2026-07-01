---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 訂閱驗證，而不是 API 金鑰
    - 你需要更嚴格的 GPT-5 代理執行行為
summary: 在 OpenClaw 中透過 API 金鑰或 Codex 訂閱使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T07:51:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI 提供 GPT 模型的開發者 API，而 Codex 也可透過 OpenAI 的 Codex 用戶端，作為
ChatGPT 方案的程式碼代理使用。OpenClaw 對兩種驗證形式都使用同一個
供應商 ID：`openai`。

OpenClaw 使用 `openai/*` 作為標準 OpenAI 模型路由。OpenAI 模型上的嵌入式代理
回合預設會透過原生 Codex app-server 執行階段執行；直接 OpenAI API 金鑰驗證仍可用於非代理 OpenAI
介面，例如圖片、嵌入、語音和即時功能。

- **代理模型** - 透過 Codex 執行階段使用 `openai/*` 模型；若要使用 ChatGPT/Codex 訂閱，請使用
  Codex 驗證登入，或在你明確想使用 API 金鑰驗證時設定相容 Codex 的
  OpenAI API 金鑰備援。
- **非代理 OpenAI API** - 透過 `OPENAI_API_KEY` 或 OpenAI API 金鑰入門設定，直接存取 OpenAI Platform 並採用按用量計費。
- **舊版設定** - 舊版 Codex 模型參照會由
  `openclaw doctor --fix` 修復為 `openai/*` 加上 Codex 執行階段。

OpenAI 明確支援在 OpenClaw 這類外部工具和工作流程中使用訂閱 OAuth。

供應商、模型、執行階段和頻道是分開的層。如果這些標籤
混在一起，請先閱讀[代理執行階段](/zh-TW/concepts/agent-runtimes)，再
變更設定。

## 快速選擇

| 目標                                                 | 使用                                                      | 備註                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| 搭配原生 Codex 執行階段的 ChatGPT/Codex 訂閱 | `openai/gpt-5.5`                                         | 預設 OpenAI 代理設定。使用 Codex 驗證登入。                  |
| GPT-5.6 限量預覽                              | `openai/gpt-5.6-sol`, `-terra`, 或 `-luna`               | 需要 OpenAI 核准的 API 組織或 Codex 工作區。      |
| 代理模型的直接 API 金鑰計費              | `openai/gpt-5.5` 加上相容 Codex 的 API 金鑰設定檔 | 使用 `auth.order.openai` 將備援放在訂閱驗證之後。  |
| 透過明確 OpenClaw 的直接 API 金鑰計費     | `openai/gpt-5.5` 加上供應商/模型執行階段 `openclaw`  | 選擇一般的 `openai` API 金鑰設定檔。                             |
| 最新 ChatGPT Instant API 別名                     | `openai/chat-latest`                                     | 僅限直接 API 金鑰。供實驗使用的移動別名，不是預設值。   |
| 透過 OpenClaw 使用 ChatGPT/Codex 訂閱驗證     | `openai/gpt-5.5` 加上供應商/模型執行階段 `openclaw`  | 為相容路由選擇 `openai` OAuth 設定檔。         |
| 圖片生成或編輯                          | `openai/gpt-image-2`                                     | 可搭配 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。             |
| 透明背景圖片                        | `openai/gpt-image-1.5`                                   | 使用 `outputFormat=png` 或 `webp`，以及 `openai.background=transparent`。 |

## 命名對照

這些名稱相似，但不可互換：

| 你看到的名稱                            | 層級             | 意義                                                                                           |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | 供應商前綴   | 標準 OpenAI 模型路由；代理回合使用 Codex 執行階段。                                  |
| 舊版 OpenAI Codex 前綴              | 舊版前綴     | 較舊的模型/設定檔命名空間。`openclaw doctor --fix` 會將其遷移至 `openai`。                   |
| `codex` 外掛                          | 外掛            | 隨附的 OpenClaw 外掛，提供原生 Codex app-server 執行階段和 `/codex` 聊天控制。 |
| 供應商/模型 `agentRuntime.id: codex` | 代理執行階段     | 對相符的嵌入式回合強制使用原生 Codex app-server harness。                            |
| `/codex ...`                            | 聊天命令集  | 從對話中繫結/控制 Codex app-server 執行緒。                                        |
| `runtime: "acp", agentId: "codex"`      | ACP 工作階段路由 | 透過 ACP/acpx 執行 Codex 的明確備援路徑。                                          |

這表示設定可以刻意包含 `openai/*` 模型參照，而驗證
設定檔可以指向 API 金鑰或 ChatGPT/Codex OAuth 認證。設定請使用
`auth.order.openai`；`openclaw doctor --fix` 會將舊版
Codex 模型參照、舊版 Codex 驗證設定檔 ID，以及
舊版 Codex 驗證順序重寫為標準 OpenAI 路由。

<Note>
GPT-5.5 可透過直接 OpenAI Platform API 金鑰存取和
訂閱/OAuth 路由使用。若要使用 ChatGPT/Codex 訂閱加上原生 Codex
執行，請使用 `openai/gpt-5.5`；現在未設定執行階段設定時，會為 OpenAI
代理回合選擇 Codex harness。只有在你想對 OpenAI 代理模型使用
直接 API 金鑰驗證時，才使用 OpenAI API 金鑰設定檔。
</Note>

## GPT-5.6 限量預覽

OpenClaw 可辨識三個公開 GPT-5.6 模型 ID：

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

目前 Codex app-server 目錄中，三者都公開 `max` 推理。OpenAI
發布公告將 Sol 描述為旗艦層級，Terra 為平衡層級，
Luna 為快速、較低成本層級。請參閱
[GPT-5.6 發布公告](https://openai.com/index/previewing-gpt-5-6-sol/)
和[預覽存取指南](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna)。

預覽期間存取採允許清單，且 API 與 Codex 可分別授權。
只有付費 ChatGPT 方案並不會授予存取權。OpenClaw 保持
`openai/gpt-5.5` 作為預設值；選擇 GPT-5.6 參照但沒有存取權時，會回傳
上游存取錯誤，而不是靜默退回。

<Note>
OpenAI 代理模型回合需要隨附的 Codex app-server 外掛。明確
OpenClaw 執行階段設定仍可作為選擇性相容路由使用。當 OpenClaw
搭配 `openai` OAuth 設定檔被明確選取時，OpenClaw 會保留
公開模型參照為 `openai/*`，並在內部透過 Codex 驗證
傳輸路由。執行 `openclaw doctor --fix` 以修復過時的
舊版 Codex 模型參照、`codex-cli/*`，或不是來自
明確執行階段設定的舊執行階段工作階段固定設定。
</Note>

## OpenClaw 功能涵蓋範圍

| OpenAI 能力         | OpenClaw 介面                                                                              | 狀態                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 聊天 / Responses          | `openai/<model>` 模型供應商                                                               | 是                                                                    |
| Codex 訂閱模型 | 搭配 OpenAI OAuth 的 `openai/<model>`                                                            | 是                                                                    |
| 舊版 Codex 模型參照   | 舊版 Codex 模型參照或 `codex-cli/<model>`                                                | 由 doctor 修復為 `openai/<model>`                                 |
| Codex app-server harness  | 省略執行階段或使用供應商/模型 `agentRuntime.id: codex` 的 `openai/<model>`              | 是                                                                    |
| 伺服器端網頁搜尋    | 原生 OpenAI Responses 工具                                                                  | 是，當網頁搜尋已啟用且未固定供應商時                 |
| 圖片                    | `image_generate`                                                                              | 是                                                                    |
| 影片                    | `video_generate`                                                                              | 是                                                                    |
| 文字轉語音            | `messages.tts.provider: "openai"` / `tts`                                                     | 是                                                                    |
| 批次語音轉文字      | `tools.media.audio` / 媒體理解                                                     | 是                                                                    |
| 串流語音轉文字  | Voice Call `streaming.provider: "openai"`                                                     | 是                                                                    |
| 即時語音            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | 是（需要 OpenAI Platform 點數，而不是 Codex/ChatGPT 訂閱） |
| 嵌入                | 記憶嵌入供應商                                                                     | 是                                                                    |

<Note>
  OpenAI 即時語音（由 Voice Call 的 `realtime.provider: "openai"` 和
  搭配 `talk.realtime.provider: "openai"` 的 Control UI Talk 使用）會透過
  公開的 **OpenAI Platform Realtime API**，並向 OpenAI
  Platform 點數計費，而不是使用 Codex/ChatGPT 訂閱配額。即使帳戶
  具備正常的 OpenAI OAuth，且可順利執行 Codex 支援的聊天模型，
  仍需要 OpenAI API 金鑰驗證設定檔，或具有已儲值
  Platform 計費的 Platform API 金鑰，才能使用即時語音。

修正：請在
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
為支援你即時認證的組織儲值 Platform 點數。即時語音接受
由 `openclaw onboard --auth-choice openai-api-key` 建立的 `openai` API 金鑰驗證設定檔、
透過 Control UI Talk 的 `talk.realtime.providers.openai.apiKey`
設定的 Platform `OPENAI_API_KEY`、Voice Call 的 `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`，
或 `OPENAI_API_KEY` 環境變數。OpenAI OAuth
設定檔仍可在同一個 OpenClaw 安裝中執行 Codex 支援的 `openai/*` 聊天模型，
但不會設定即時語音。
</Note>

## 記憶嵌入

OpenClaw 可以使用 OpenAI，或相容 OpenAI 的嵌入端點，來處理
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

對於需要非對稱嵌入標籤的相容 OpenAI 端點，請在
`memorySearch` 下設定 `queryInputType` 和 `documentInputType`。OpenClaw 會將
它們轉送為供應商特定的 `input_type` 請求欄位：查詢嵌入使用
`queryInputType`；已索引的記憶片段和批次索引使用
`documentInputType`。完整範例請參閱[記憶設定參考](/zh-TW/reference/memory-config#provider-specific-config)。

## 開始使用

選擇偏好的驗證方式，並依照設定步驟操作。

<Tabs>
  <Tab title="API 金鑰 (OpenAI Platform)">
    **最適合：** 直接 API 存取和按用量計費。

    <Steps>
      <Step title="取得你的 API 金鑰">
        從 [OpenAI Platform 儀表板](https://platform.openai.com/api-keys) 建立或複製 API 金鑰。
      </Step>
      <Step title="執行入門設定">
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
    | `openai/gpt-5.5`      | 省略 / provider/model `agentRuntime.id: "codex"` | Codex app-server harness | Codex 相容的 OpenAI 設定檔 |
    | `openai/gpt-5.4-mini` | 省略 / provider/model `agentRuntime.id: "codex"` | Codex app-server harness | Codex 相容的 OpenAI 設定檔 |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | OpenClaw 內嵌執行階段      | 已選取的 `openai` 設定檔 |

    <Note>
    `openai/*` 代理模型會使用 Codex app-server harness。若要對代理模型使用 API 金鑰
    驗證，請建立 Codex 相容的 API 金鑰設定檔，並用
    `auth.order.openai` 排序；`OPENAI_API_KEY` 仍是
    非代理 OpenAI API 介面的直接備援。執行 `openclaw doctor --fix` 以遷移較舊的
    舊版 Codex 驗證順序項目。
    </Note>

    ### 設定範例

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    若要從 OpenAI API 試用 ChatGPT 目前的 Instant 模型，請將模型
    設為 `openai/chat-latest`：

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` 是會變動的別名。OpenAI 文件將其描述為 ChatGPT 中使用的最新 Instant
    模型，並建議生產環境 API 使用 `gpt-5.5`，因此除非你明確需要該
    別名行為，否則請保留 `openai/gpt-5.5` 作為穩定預設值。此別名目前只接受 `medium` 文字詳細程度，因此
    OpenClaw 會為此模型正規化不相容的 OpenAI 文字詳細程度覆寫。

    <Warning>
    OpenClaw 不會在直接 OpenAI API 金鑰路由上公開 `gpt-5.3-codex-spark`。只有當你的已登入帳號公開該模型時，它才可透過 Codex 訂閱目錄項目使用。
    </Warning>

  </Tab>

  <Tab title="Codex 訂閱">
    **最適合：** 使用你的 ChatGPT/Codex 訂閱搭配原生 Codex app-server 執行，而不是使用獨立 API 金鑰。Codex 雲端需要 ChatGPT 登入。

    <Steps>
      <Step title="執行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        或直接執行 OAuth：

        ```bash
        openclaw models auth login --provider openai
        ```

        對於無頭或不適合回呼的設定，加入 `--device-code`，以 ChatGPT 裝置碼流程登入，而不是使用 localhost 瀏覽器回呼：

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="使用標準 OpenAI 模型路由">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        預設路徑不需要執行階段設定。OpenAI 代理回合
        會自動選取原生 Codex app-server 執行階段，且 OpenClaw
        會在選擇此路由時安裝或修復隨附的 Codex 外掛。
      </Step>
      <Step title="確認 Codex 驗證可用">
        ```bash
        openclaw models list --provider openai
        ```

        閘道執行後，在聊天中傳送 `/codex status` 或 `/codex models`
        以確認原生 app-server 執行階段。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照 | 執行階段設定 | 路由 | 驗證 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | 省略 / provider/model `agentRuntime.id: "codex"` | 原生 Codex app-server harness | Codex 登入或已排序的 `openai` 驗證設定檔 |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | 使用內部 Codex 驗證傳輸的 OpenClaw 內嵌執行階段 | 已選取的 `openai` OAuth 設定檔 |
    | 舊版 Codex GPT-5.5 參照 | 由 doctor 修復 | 舊版路由重寫為 `openai/gpt-5.5` | 已遷移的 OpenAI OAuth 設定檔 |
    | `codex-cli/gpt-5.5` | 由 doctor 修復 | 舊版命令列介面路由重寫為 `openai/gpt-5.5` | Codex app-server 驗證 |

    <Warning>
    新的訂閱支援代理設定請優先使用 `openai/gpt-5.5`。較舊的
    舊版 Codex GPT 參照是舊版 OpenClaw 路由，不是原生 Codex 執行階段
    路徑；當你想將它們遷移到標準
    `openai/*` 參照時，請執行 `openclaw doctor --fix`。`gpt-5.3-codex-spark` 仍僅限其
    Codex 訂閱目錄宣告該模型的帳號使用；直接 OpenAI API 金鑰和
    Azure 對它的參照仍會被隱藏。
    </Warning>

    <Note>
    舊版 Codex 模型前綴是由 doctor 修復的舊版設定。對於
    常見的訂閱加原生執行階段設定，請使用 Codex 驗證登入，
    但將模型參照保持為 `openai/gpt-5.5`。新的設定應將 OpenAI
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

    若有 API 金鑰備援，請將模型保留在 `openai/gpt-5.5`，並將
    驗證順序放在 `openai` 之下。OpenClaw 會先嘗試訂閱，接著
    嘗試 API 金鑰，同時維持在 Codex harness：

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
    入門設定不再從 `~/.codex` 匯入 OAuth 資料。請使用瀏覽器 OAuth（預設）或上述裝置碼流程登入，OpenClaw 會在自己的代理驗證儲存區中管理產生的憑證。
    </Note>

    ### 檢查並復原 Codex OAuth 路由

    使用這些命令查看你的預設
    代理正在使用哪個模型、執行階段和驗證路由：

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    對於特定代理，加入 `--agent <id>`：

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    如果較舊的設定仍有舊版 Codex GPT 參照，或沒有明確執行階段設定的過時 OpenAI 執行階段
    工作階段固定，請修復它：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai` 沒有顯示可用設定檔，請重新
    登入：

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    當你希望同一個
    代理中有多個 Codex OAuth 登入，並稍後透過驗證排序或 `/model ...@<profileId>` 控制它們時，請使用 `--profile-id`：

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` 是透過 Codex 進行 OpenAI 代理回合的模型路由。執行
    `openclaw doctor --fix` 以遷移較舊的舊版 OpenAI Codex 前綴設定檔 ID 和
    順序項目，然後再依賴設定檔排序。

    ### 狀態指示器

    聊天 `/status` 會顯示目前工作階段啟用的模型執行階段。
    對於 OpenAI 代理模型回合，隨附的 Codex app-server harness 會顯示為 `Runtime: OpenAI Codex`。過時的 OpenAI 執行階段工作階段固定會修復為 Codex，除非
    設定明確固定為 OpenClaw。

    ### Doctor 警告

    如果設定或工作階段狀態中仍有舊版 Codex 模型參照或過時的 OpenAI 執行階段固定，`openclaw doctor --fix` 會將它們重寫為使用
    Codex 執行階段的 `openai/*`，除非明確設定 OpenClaw。

    ### 上下文視窗上限

    OpenClaw 會將模型中繼資料和執行階段上下文上限視為不同值。

    對於透過 Codex OAuth 目錄使用的 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 預設執行階段 `contextTokens` 上限：`272000`

    較小的預設上限在實務上具有較佳的延遲和品質特性。使用 `contextTokens` 覆寫它：

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

    OpenClaw 會在上游 Codex 目錄中繼資料存在時，將其用於 `gpt-5.5`。如果即時 Codex 探索在帳號已驗證時省略 `gpt-5.5` 列，OpenClaw 會合成該 OAuth 模型列，使
    排程、子代理和已設定的預設模型執行不會因
    `Unknown model` 而失敗。

  </Tab>
</Tabs>

## 原生 Codex app-server 驗證

原生 Codex app-server harness 使用 `openai/*` 模型參照加上省略的
執行階段設定，或 provider/model `agentRuntime.id: "codex"`，但其驗證
仍以帳號為基礎。OpenClaw 會依下列順序選取驗證：

1. 代理的已排序 OpenAI 驗證設定檔，最好位於
   `auth.order.openai` 下。執行 `openclaw doctor --fix` 以遷移較舊的
   舊版 Codex 驗證設定檔 ID 和舊版 Codex 驗證順序。
2. app-server 現有帳號，例如本機 Codex 命令列介面 ChatGPT 登入。
3. 僅限本機 stdio app-server 啟動，當 app-server 回報沒有帳號且仍需要
   OpenAI 驗證時，依序使用 `CODEX_API_KEY`、再使用
   `OPENAI_API_KEY`。

這表示本機 ChatGPT/Codex 訂閱登入不會只是因為
閘道處理程序也有用於直接 OpenAI 模型
或嵌入的 `OPENAI_API_KEY` 而被取代。環境 API 金鑰備援僅是本機 stdio 無帳號路徑；它
不會傳送到 WebSocket app-server 連線。當選取訂閱形式的 Codex
設定檔時，OpenClaw 也會讓 `CODEX_API_KEY` 和 `OPENAI_API_KEY`
不進入產生的 stdio app-server 子程序，並透過 app-server 登入 RPC 傳送選取的憑證。當該訂閱設定檔受到
Codex 使用限制阻擋時，OpenClaw 可以輪換到下一個已排序的 `openai:*` API 金鑰
設定檔，而不變更選取的模型，也不離開 Codex
harness。訂閱重設時間過後，訂閱設定檔會再次符合資格。

## 圖像生成

隨附的 `openai` 外掛會透過 `image_generate` 工具註冊圖像生成。
它支援 OpenAI API 金鑰圖像生成，以及透過相同 `openai/gpt-image-2` 模型參照進行的 Codex OAuth 圖像
生成。

| 功能                      | OpenAI API 金鑰                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型參照                  | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 驗證                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登入              |
| 傳輸                      | OpenAI Images API                  | Codex Responses 後端                 |
| 每次請求最大圖片數        | 4                                  | 4                                    |
| 編輯模式                  | 已啟用（最多 5 張參考圖片）        | 已啟用（最多 5 張參考圖片）          |
| 大小覆寫                  | 支援，包含 2K/4K 大小              | 支援，包含 2K/4K 大小                |
| 長寬比 / 解析度           | 不轉送至 OpenAI Images API         | 安全時對應到支援的大小               |

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
請參閱[圖片生成](/zh-TW/tools/image-generation)，了解共用工具參數、供應商選擇與容錯移轉行為。
</Note>

`gpt-image-2` 是 OpenAI 文字轉圖片生成與圖片編輯的預設值。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作為明確的模型覆寫使用。若要輸出透明背景 PNG/WebP，請使用 `openai/gpt-image-1.5`；目前的 `gpt-image-2` API 會拒絕 `background: "transparent"`。

對於透明背景請求，代理應呼叫 `image_generate`，並使用 `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及 `background: "transparent"`；較舊的 `openai.background` 供應商選項仍會被接受。OpenClaw 也會保護公開 OpenAI 與 OpenAI Codex OAuth 路由，將預設的 `openai/gpt-image-2` 透明背景請求重寫為 `gpt-image-1.5`；Azure 與自訂 OpenAI 相容端點會保留其已設定的部署/模型名稱。

相同設定也會公開給無介面命令列介面執行使用：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

從輸入檔開始時，請搭配 `openclaw infer image edit` 使用相同的 `--output-format` 與 `--background` 旗標。`--openai-background` 仍可作為 OpenAI 專用別名使用。需要控制 OpenAI Images 品質與成本時，請使用 `--quality low|medium|high|auto`。請使用 `--openai-moderation low|auto`，從 `image generate` 或 `image edit` 傳遞 OpenAI 的供應商專用審核提示。

對於 ChatGPT/Codex OAuth 安裝，請保留相同的 `openai/gpt-image-2` 參照。設定 `openai` OAuth 設定檔時，OpenClaw 會解析儲存的 OAuth 存取權杖，並透過 Codex Responses 後端傳送圖片請求。它不會先嘗試 `OPENAI_API_KEY`，也不會為該請求靜默退回使用 API 金鑰。當你想改用直接的 OpenAI Images API 路由時，請使用 API 金鑰、自訂基底 URL 或 Azure 端點明確設定 `models.providers.openai`。
如果該自訂圖片端點位於受信任的 LAN/私人位址，也請設定 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在此選擇啟用設定，OpenClaw 會持續封鎖私人/內部 OpenAI 相容圖片端點。

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

內建的 `openai` 外掛會透過 `video_generate` 工具註冊影片生成。

| 功能           | 值                                                                                |
| -------------- | --------------------------------------------------------------------------------- |
| 預設模型       | `openai/sora-2`                                                                   |
| 模式           | 文字轉影片、圖片轉影片、單一影片編輯                                             |
| 參考輸入       | 1 張圖片或 1 部影片                                                               |
| 大小覆寫       | 支援文字轉影片與圖片轉影片                                                       |
| 其他覆寫       | `aspectRatio`、`resolution`、`audio`、`watermark` 會被忽略並顯示工具警告          |

OpenAI 圖片轉影片請求會使用 `POST /v1/videos` 搭配圖片 `input_reference`。單一影片編輯會使用 `POST /v1/videos/edits`，並將上傳的影片放在 `video` 欄位中。

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
請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、供應商選擇與容錯移轉行為。
</Note>

## GPT-5 提示詞貢獻

OpenClaw 會為 OpenClaw 組裝提示詞介面上的 GPT-5 系列執行加入共用的 GPT-5 提示詞貢獻。它會依模型 ID 套用，因此 OpenClaw/供應商路由，例如舊版修復前參照（舊版 Codex GPT-5.5 參照）、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 與其他相容 GPT-5 參照，都會收到相同覆蓋層。較舊的 GPT-4.x 模型不會。

內建原生 Codex harness 不會透過 Codex app-server 開發者指示收到這個 OpenClaw GPT-5 覆蓋層。原生 Codex 會保留 Codex 擁有的基礎、模型與專案文件行為，而 OpenClaw 會停用 Codex 對原生執行緒的內建人格，讓代理工作區人格檔案維持權威性。OpenClaw 只貢獻執行階段情境，例如頻道傳遞、OpenClaw 動態工具、ACP 委派、工作區情境與 OpenClaw Skills。

GPT-5 貢獻會為相符的 OpenClaw 組裝提示詞新增已標記的行為契約，涵蓋人格持續性、執行安全、工具紀律、輸出形狀、完成檢查與驗證。頻道專用回覆與靜默訊息行為仍保留在共用 OpenClaw 系統提示詞與輸出傳遞政策中。友善互動風格層是分開且可設定的。

| 值                     | 效果                         |
| ---------------------- | ---------------------------- |
| `"friendly"`（預設）   | 啟用友善互動風格層           |
| `"on"`                 | `"friendly"` 的別名          |
| `"off"`                | 只停用友善風格層             |

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
執行階段的值不區分大小寫，因此 `"Off"` 和 `"off"` 都會停用友善風格層。
</Tip>

<Note>
當未設定共用的 `agents.defaults.promptOverlays.gpt5.personality` 設定時，仍會讀取舊版 `plugins.entries.openai.config.personality` 作為相容性備援。
</Note>

## 語音與語音辨識

<AccordionGroup>
  <Accordion title="語音合成 (TTS)">
    內建的 `openai` 外掛會為 `messages.tts` 介面註冊語音合成。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 語音 | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未設定） |
    | 指示 | `messages.tts.providers.openai.instructions` | （未設定，僅 `gpt-4o-mini-tts`） |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 語音便條使用 `opus`，檔案使用 `mp3` |
    | API 金鑰 | `messages.tts.providers.openai.apiKey` | 退回使用 `OPENAI_API_KEY` |
    | 基底 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 額外本文 | `messages.tts.providers.openai.extraBody` / `extra_body` | （未設定） |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用語音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 會在 OpenClaw 生成的欄位之後合併到 `/audio/speech` 請求 JSON，因此可將它用於需要額外鍵（例如 `lang`）的 OpenAI 相容端點。原型鍵會被忽略。

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
    設定 `OPENAI_TTS_BASE_URL` 可覆寫 TTS 基底 URL，而不影響聊天 API 端點。OpenAI TTS 與 Realtime 語音都透過 OpenAI Platform API 金鑰設定；僅 OAuth 的安裝仍可使用 Codex 後端支援的聊天模型，但不能使用 OpenAI 即時語音回話。
    </Note>

  </Accordion>

  <Accordion title="語音轉文字">
    內建的 `openai` 外掛會透過 OpenClaw 的媒體理解轉錄介面註冊批次語音轉文字。

    - 預設模型：`gpt-4o-transcribe`
    - 端點：OpenAI REST `/v1/audio/transcriptions`
    - 輸入路徑：multipart 音訊檔案上傳
    - OpenClaw 在任何使用 `tools.media.audio` 進行傳入音訊轉錄的位置都支援，包括 Discord 語音頻道片段與頻道音訊附件

    若要強制使用 OpenAI 進行傳入音訊轉錄：

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

    當共用音訊媒體設定或每次呼叫的轉錄請求提供語言與提示詞提示時，這些提示會轉送至 OpenAI。

  </Accordion>

  <Accordion title="即時轉錄">
    內建的 `openai` 外掛會為 Voice Call 外掛註冊即時轉錄。

    | 設定 | 設定路徑 | 預設值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 語言 | `...openai.language` | （未設定） |
    | 提示詞 | `...openai.prompt` | （未設定） |
    | 靜音持續時間 | `...openai.silenceDurationMs` | `800` |
    | VAD 閾值 | `...openai.vadThreshold` | `0.5` |
    | 驗證 | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai` OAuth | API 金鑰會直接連線；OAuth 會鑄發 Realtime 轉錄用戶端密鑰 |

    <Note>
    使用 WebSocket 連線至 `wss://api.openai.com/v1/realtime`，並使用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音訊。當只設定 `openai` OAuth 時，閘道會在開啟 WebSocket 前鑄發短暫有效的 Realtime 轉錄用戶端密鑰。此串流供應商用於 Voice Call 的即時轉錄路徑；Discord 語音目前會錄製短片段，並改用批次 `tools.media.audio` 轉錄路徑。
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
    | 推理投入程度 | `...openai.reasoningEffort` | (未設定) |
    | 驗證 | `openai` API 金鑰驗證設定檔、`...openai.apiKey` 或 `OPENAI_API_KEY` | 需要 OpenAI Platform API 金鑰；OpenAI OAuth 不會設定即時語音 |

    `gpt-realtime-2` 可用的內建即時語音：`alloy`、`ash`、
    `ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI 建議使用 `marin` 和 `cedar` 以取得最佳即時品質。這
    與上方的文字轉語音語音是不同集合；不要假設 `fable`、
    `nova` 或 `onyx` 等 TTS 語音可用於即時工作階段。

    <Note>
    後端 OpenAI 即時橋接使用 GA Realtime WebSocket 工作階段形狀，不接受 `session.temperature`。Azure OpenAI 部署仍可透過 `azureEndpoint` 和 `azureDeployment` 使用，並保留與部署相容的工作階段形狀。支援雙向工具呼叫和 G.711 u-law 音訊。
    </Note>

    <Note>
    即時語音會在建立工作階段時選取。OpenAI 允許大多數
    工作階段欄位稍後變更，但在該工作階段中模型已輸出音訊後，
    語音就無法變更。OpenClaw 目前將內建即時語音 ID 以字串公開。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 瀏覽器即時工作階段，搭配由閘道鑄發的
    臨時用戶端密鑰，並針對 OpenAI Realtime API 進行直接瀏覽器 WebRTC SDP 交換。
    閘道會使用所選的 `openai` API 金鑰驗證設定檔或已設定的 OpenAI Platform API 金鑰
    來鑄發該用戶端密鑰。閘道轉送與 Voice Call 後端即時 WebSocket 橋接
    會針對原生 OpenAI 端點使用相同的僅 API 金鑰驗證路徑。維護者即時
    驗證可使用
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`；
    OpenAI 路徑會在不記錄密鑰的情況下，同時驗證後端 WebSocket 橋接和瀏覽器
    WebRTC SDP 交換。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端點

內建的 `openai` 提供者可透過覆寫基底 URL，將影像
產生目標指向 Azure OpenAI 資源。在影像產生路徑上，OpenClaw
會偵測 `models.providers.openai.baseUrl` 上的 Azure 主機名稱，並自動切換至
Azure 的請求形狀。

<Note>
即時語音使用獨立的設定路徑
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)，
不受 `models.providers.openai.baseUrl` 影響。請參閱 [語音與語音功能](#voice-and-speech) 下
**即時語音** 手風琴中的 Azure 設定。
</Note>

在以下情況使用 Azure OpenAI：

- 你已擁有 Azure OpenAI 訂閱、配額或企業協議
- 你需要 Azure 提供的區域資料駐留或合規控制
- 你想讓流量留在現有 Azure 租用戶內

### 設定

若要透過內建 `openai` 提供者使用 Azure 影像產生，請將
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

OpenClaw 會辨識以下 Azure 主機尾碼，用於 Azure 影像產生
路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

針對已辨識 Azure 主機上的影像產生請求，OpenClaw 會：

- 傳送 `api-key` 標頭，而不是 `Authorization: Bearer`
- 使用部署範圍路徑（`/openai/deployments/{deployment}/...`）
- 對每個請求附加 `?api-version=...`
- 對 Azure 影像產生呼叫使用 600 秒的預設請求逾時。
  每次呼叫的 `timeoutMs` 值仍會覆寫此預設值。

其他基底 URL（公用 OpenAI、OpenAI 相容代理）會保留標準
OpenAI 影像請求形狀。

<Note>
`openai` 提供者影像產生路徑的 Azure 路由需要
OpenClaw 2026.4.22 或更新版本。較早版本會將任何自訂
`openai.baseUrl` 視為公用 OpenAI 端點，並且在 Azure
影像部署上失敗。
</Note>

### API 版本

設定 `AZURE_OPENAI_API_VERSION` 以釘選 Azure 影像產生路徑的特定 Azure 預覽版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未設定變數時，預設值為 `2024-12-01-preview`。

### 模型名稱就是部署名稱

Azure OpenAI 會將模型繫結至部署。對於透過內建 `openai` 提供者
路由的 Azure 影像產生請求，OpenClaw 中的 `model` 欄位
必須是你在 Azure 入口網站中設定的 **Azure 部署名稱**，而不是
公用 OpenAI 模型 ID。

如果你建立名為 `gpt-image-2-prod`、提供 `gpt-image-2` 的部署：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

相同的部署名稱規則適用於透過內建 `openai` 提供者路由的
影像產生呼叫。

### 區域可用性

Azure 影像產生目前僅在部分區域可用
（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。建立部署前，請檢查 Microsoft 目前的區域清單，
並確認你的區域提供該特定模型。

### 參數差異

Azure OpenAI 和公用 OpenAI 並不總是接受相同的影像參數。
Azure 可能會拒絕公用 OpenAI 允許的選項（例如 `gpt-image-2` 上的某些
`background` 值），或僅在特定模型版本上公開這些選項。
這些差異來自 Azure 和底層模型，而不是 OpenClaw。
如果 Azure 請求因驗證錯誤而失敗，請在 Azure 入口網站中檢查
你的特定部署和 API 版本支援的參數集。

<Note>
Azure OpenAI 使用原生傳輸和相容行為，但不會接收
OpenClaw 的隱藏歸因標頭 — 請參閱 [進階設定](#advanced-configuration) 下的
**原生與 OpenAI 相容路由** 手風琴。

對於 Azure 上的聊天或 Responses 流量（影像產生以外），請使用
上手流程或專用 Azure 提供者設定 — 單靠 `openai.baseUrl`
不會套用 Azure API/驗證形狀。另有一個
`azure-openai-responses/*` 提供者；請參閱下方的伺服器端壓縮手風琴。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="傳輸（WebSocket 與 SSE）">
    OpenClaw 對 `openai/*` 使用 WebSocket 優先，並以 SSE 後援（`"auto"`）。

    在 `"auto"` 模式中，OpenClaw 會：
    - 在後援至 SSE 前，重試一次早期 WebSocket 失敗
    - 失敗後，將 WebSocket 標記為降級約 60 秒，並在冷卻期間使用 SSE
    - 為重試和重新連線附加穩定的工作階段與回合身分標頭
    - 在傳輸變體之間正規化用量計數器（`input_tokens` / `prompt_tokens`）

    | 值 | 行為 |
    |-------|----------|
    | `"auto"`（預設） | WebSocket 優先，SSE 後援 |
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
          },
        },
      },
    }
    ```

    相關 OpenAI 文件：
    - [使用 WebSocket 的 Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [串流 API 回應（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="快速模式">
    OpenClaw 為 `openai/*` 公開共用的快速模式切換：

    - **聊天/UI：** `/fast status|auto|on|off`
    - **設定：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    啟用後，OpenClaw 會將快速模式對應至 OpenAI 優先處理（`service_tier = "priority"`）。既有的 `service_tier` 值會保留，且快速模式不會重寫 `reasoning` 或 `text.verbosity`。`fastMode: "auto"` 會讓新的模型呼叫在自動截止前以快速模式開始，之後的重試、後援、工具結果或延續呼叫則不使用快速模式。截止時間預設為 60 秒；在作用中模型上設定 `params.fastAutoOnSeconds` 可變更此值。

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
    工作階段覆寫優先於設定。在 Sessions UI 中清除工作階段覆寫，會讓工作階段回到已設定的預設值。
    </Note>

  </Accordion>

  <Accordion title="優先處理（service_tier）">
    OpenAI 的 API 透過 `service_tier` 公開優先處理。在 OpenClaw 中按模型設定：

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

  <Accordion title="伺服器端壓縮（Responses API）">
    對於直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI 外掛的 OpenClaw 串流包裝器會自動啟用伺服器端壓縮：

    - 強制 `store: true`（除非模型相容性設定 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 預設 `compact_threshold`：`contextWindow` 的 70%（不可用時為 `80000`）

    這適用於內建 OpenClaw 執行階段路徑，以及嵌入式執行使用的 OpenAI 提供者掛鉤。原生 Codex 應用伺服器操作框架會透過 Codex 管理自己的上下文，並由 OpenAI 的預設代理路由或提供者/模型執行階段政策設定。

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
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    使用 `strict-agentic` 時，OpenClaw 會：
    - 對實質工作自動啟用 `update_plan`
    - 以可見答案續接，重試結構上空白或僅含推理的回合
    - 在所選執行框架提供時使用明確的執行框架計畫事件

    OpenClaw 不會分類助理文字來判斷某個回合是計畫、進度更新或最終答案。

    <Note>
    僅限 OpenAI 和 Codex GPT-5 系列執行。其他供應商和較舊的模型系列會保留預設行為。
    </Note>

  </Accordion>

  <Accordion title="原生與 OpenAI 相容路由">
    OpenClaw 對直接 OpenAI、Codex 和 Azure OpenAI 端點的處理，不同於通用 OpenAI 相容 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 只對支援 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 對會拒絕 `reasoning.effort: "none"` 的模型或代理省略已停用的推理
    - 預設將工具結構描述設為嚴格模式
    - 只在已驗證的原生主機上附加隱藏歸因標頭
    - 保留僅限 OpenAI 的請求成形（`service_tier`、`store`、推理相容性、提示快取提示）

    **代理/相容路由：**
    - 使用較寬鬆的相容行為
    - 從非原生 `openai-completions` 酬載中移除 Completions `store`
    - 接受進階 `params.extra_body`/`params.extraBody` 直通 JSON，用於 OpenAI 相容的 Completions 代理
    - 接受 `params.chat_template_kwargs`，用於 vLLM 等 OpenAI 相容的 Completions 代理
    - 不強制使用嚴格工具結構描述或僅限原生的標頭

    Azure OpenAI 使用原生傳輸與相容行為，但不會接收隱藏歸因標頭。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="圖片生成" href="/zh-TW/tools/image-generation" icon="image">
    共用圖片工具參數與供應商選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與供應商選擇。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資料與憑證重複使用規則。
  </Card>
</CardGroup>
