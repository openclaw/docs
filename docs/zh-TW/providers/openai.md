---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 訂閱驗證，而不是 API 金鑰
    - 你需要更嚴格的 GPT-5 代理執行行為
summary: 在 OpenClaw 中透過 API 金鑰或 Codex 訂閱使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-07-06T21:54:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70d1f583ce1ddaed9a4f394847e697a0b1ff21d5fd90ba7e0b837206db52659b
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw 使用單一提供者 ID `openai`，同時支援直接 API 金鑰驗證與
ChatGPT/Codex 訂閱驗證。`openai/*` 是標準模型路由。
嵌入式代理回合在 `openai/*` 上預設會透過內建的 Codex 應用程式伺服器
執行階段執行；直接 API 金鑰驗證仍可用於非代理 OpenAI
介面（影像、影片、嵌入、語音、即時），並作為代理回合的明確
相容性路由。

- **代理模型** - `openai/*` 透過 Codex 執行階段。使用 Codex
  驗證登入以使用 ChatGPT/Codex 訂閱，或在需要以金鑰計費時設定 API 金鑰驗證
  設定檔。
- **非代理 OpenAI API** - 直接存取 OpenAI Platform，按用量計費，
  透過 `OPENAI_API_KEY` 或 `openai` API 金鑰驗證設定檔。
- **舊版設定** - 舊的 Codex 模型參照與設定檔 ID 會由
  `openclaw doctor --fix` 修復為 `openai/*`。

OpenAI 明確支援在 OpenClaw 這類外部工具與
工作流程中使用訂閱 OAuth。

## 使用量與成本追蹤

OpenClaw 將訂閱配額與 Platform API 計費分開處理：

- ChatGPT/Codex OAuth 會顯示訂閱方案、配額週期與點數餘額。
- `OPENAI_ADMIN_KEY` 會在 Control UI **使用量** 中顯示提供者回報的 30 天組織成本與完成使用量，包括每日支出、請求/權杖總計、熱門模型與成本類別。
- `OPENAI_PROJECT_ID` 可選擇性地將 Admin API 歷史紀錄限定於單一專案。
- OpenClaw 絕不會將 `OPENAI_API_KEY` 或 `openai` 推論設定檔傳送至組織 API；這些憑證可能屬於自訂、Azure 或代理本機端點。

明確設定的 Admin 金鑰優先於 OAuth。提供者回報的歷史紀錄不會與 OpenClaw 從工作階段推導出的估算成本合併；它可能包含其他用戶端的 API 活動與提供者端的計費調整。

OpenAI 的 [API 使用量儀表板](https://help.openai.com/en/articles/10478918) 文件說明了使用量資料所需的組織擁有者與明確 Usage Dashboard 權限要求。

提供者、模型、執行階段與通道是分離的層。如果這些標籤
混在一起，請先閱讀[代理執行階段](/zh-TW/concepts/agent-runtimes)，再
變更設定。

## 快速選擇

| 目標                                              | 使用                                                               | 備註                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| ChatGPT/Codex 訂閱、原生 Codex 執行階段           | `openai/gpt-5.5`                                                   | 預設設定。使用 Codex 驗證登入。                                        |
| GPT-5.6 限量預覽                                  | `openai/gpt-5.6-sol`、`-terra` 或 `-luna`                          | 需要 OpenAI 核准的 API 組織，或 Codex 工作區允許清單項目。             |
| 代理回合的直接 API 金鑰計費                       | `openai/gpt-5.5` 加上排序過的 API 金鑰驗證設定檔                   | 設定 `auth.order.openai`，將金鑰設定檔放在訂閱驗證之後。               |
| 直接 API 金鑰計費、明確 OpenClaw 執行階段         | `openai/gpt-5.5` 加上提供者/模型 `agentRuntime.id: "openclaw"`     | 選取一般的 `openai` API 金鑰設定檔。                                   |
| 最新 ChatGPT Instant 模型別名                     | `openai/chat-latest`                                               | 僅限直接 API 金鑰；移動別名，不是穩定預設值。                          |
| 影像生成或編輯                                    | `openai/gpt-image-2`                                               | 可搭配 `OPENAI_API_KEY` 或 Codex OAuth 使用。                           |
| 透明背景影像                                      | `openai/gpt-image-1.5`                                             | 將 `outputFormat` 設為 `png` 或 `webp`，並設定 `background=transparent`。 |

## 命名對照

| 你看到的名稱                            | 層級             | 意義                                                                                     |
| --------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | 提供者前綴       | 標準 OpenAI 模型路由；代理回合預設使用 Codex 執行階段。                                  |
| `codex` 外掛                            | 外掛             | 內建外掛，提供原生 Codex 應用程式伺服器執行階段與 `/codex` 聊天控制。                   |
| 提供者/模型 `agentRuntime.id: codex`    | 代理執行階段     | 強制符合條件的嵌入式回合使用原生 Codex 應用程式伺服器工具鏈。                           |
| `/codex ...`                            | 聊天命令集       | 從對話中繫結/控制 Codex 應用程式伺服器執行緒。                                          |
| `runtime: "acp", agentId: "codex"`      | ACP 工作階段路由 | 明確備援路徑，透過 ACP/acpx 執行 Codex。                                                 |

`openclaw doctor --fix` 會將舊版 Codex 模型參照、舊版 Codex 驗證
設定檔 ID，以及舊版 Codex 驗證順序項目遷移到標準 `openai`
路由。新的驗證順序設定請使用 `auth.order.openai`。

<Note>
GPT-5.5 可透過直接 OpenAI Platform API 金鑰存取與
訂閱/OAuth 路由使用。若要以 ChatGPT/Codex 訂閱搭配原生 Codex
執行，請使用 `openai/gpt-5.5`，並保持執行階段設定未設定；這已經
會選取 Codex 工具鏈。只有在需要對代理模型使用
直接 API 金鑰驗證時，才使用 API 金鑰驗證設定檔。
</Note>

## GPT-5.6 限量預覽

OpenClaw 識別三個公開 GPT-5.6 模型 ID：`openai/gpt-5.6-sol`、
`openai/gpt-5.6-terra` 與 `openai/gpt-5.6-luna`。目前型錄中這三者都公開 `xhigh` 與
`max` reasoning。OpenAI 將 Sol 描述為旗艦
層級，Terra 為平衡層級，Luna 為快速、較低成本層級。請參閱
[GPT-5.6 發布公告](https://openai.com/index/previewing-gpt-5-6-sol/)
與[預覽存取指南](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna)。

預覽期間存取採允許清單制，且 API 與 Codex 可分別授權；僅有付費 ChatGPT 方案
並不會授予存取權。OpenClaw 仍以
`openai/gpt-5.5` 作為預設值，且不會對存取錯誤做特殊處理，因此
在沒有存取權的情況下選取 GPT-5.6 參照，會直接顯示上游錯誤，
而不是靜默備援。

<Note>
`openai/*` 上的代理模型回合預設需要內建的 Codex 應用程式伺服器外掛。
明確的 OpenClaw 執行階段設定仍可作為選用的
相容性路由：當使用 `openai` OAuth 設定檔明確選取 OpenClaw 時，
模型參照仍維持 `openai/*`，但請求會在內部透過
Codex 驗證傳輸路由。執行 `openclaw doctor --fix` 以修復過時的
舊版 Codex 模型參照、`codex-cli/*` 參照，或不是由明確執行階段設定
設下的舊執行階段工作階段釘選。
</Note>

## OpenClaw 功能涵蓋範圍

| OpenAI 功能               | OpenClaw 介面                                                                                 | 狀態                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 聊天 / Responses          | `openai/<model>` 模型提供者                                                                   | 是                                                              |
| Codex 訂閱模型            | `openai/<model>` 搭配 OpenAI OAuth                                                            | 是                                                              |
| 舊版 Codex 模型參照       | 舊的 Codex 模型參照、`codex-cli/<model>`                                                       | 由 doctor 修復為 `openai/<model>`                               |
| Codex 應用程式伺服器工具鏈 | `openai/<model>` 且執行階段未設定，或提供者/模型 `agentRuntime.id: codex`                     | 是                                                              |
| 伺服器端網頁搜尋          | 原生 OpenAI Responses 工具                                                                    | 是，當啟用網頁搜尋且沒有釘選其他提供者時                        |
| 影像                      | `image_generate`                                                                              | 是                                                              |
| 影片                      | `video_generate`                                                                              | 是                                                              |
| 文字轉語音                | `messages.tts.provider: "openai"` / `tts`                                                      | 是                                                              |
| 批次語音轉文字            | `tools.media.audio` / 媒體理解                                                                | 是                                                              |
| 串流語音轉文字            | Voice Call `streaming.provider: "openai"`                                                      | 是                                                              |
| 即時語音                  | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | 是（OpenAI API 金鑰或 Codex OAuth）                             |
| 嵌入                      | 記憶嵌入提供者                                                                                | 是                                                              |

<Note>
OpenAI 即時語音會透過公開的 **OpenAI Platform Realtime
API**。它接受 Platform API 金鑰或 `openai` OAuth 設定檔，
包括自動探索到的外部 Codex 登入。API 金鑰工作階段
使用該金鑰的 Platform 計費；OAuth 可用性與計費則依
已驗證帳戶的 Realtime 權益而定。

如果 API 金鑰驗證回報缺少計費，請在使用 API 金鑰
驗證時，前往 [platform.openai.com/account/billing](https://platform.openai.com/account/billing)
為支援你的即時憑證的組織儲值 Platform 點數。
即時語音接受由 `openclaw onboard --auth-choice openai-api-key` 建立的
`openai` API 金鑰驗證設定檔、`openai` OAuth 設定檔或
外部 Codex 登入、透過 `talk.realtime.providers.openai.apiKey` 為 Control UI Talk 設定的 Platform `OPENAI_API_KEY`，或
透過 `plugins.entries.voice-call.config.realtime.providers.openai.apiKey` 為 Voice
Call 設定的 Platform `OPENAI_API_KEY`，或 `OPENAI_API_KEY` 環境變數。
</Note>

## 記憶嵌入

OpenClaw 可使用 OpenAI，或 OpenAI 相容的嵌入端點，進行
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
`memorySearch` 下設定 `queryInputType` 與 `documentInputType`。OpenClaw
會將這些作為提供者特定的 `input_type` 請求欄位轉送：查詢
嵌入使用 `queryInputType`；已索引的記憶區塊與批次索引使用
`documentInputType`。完整範例請參閱
[記憶設定參考](/zh-TW/reference/memory-config#provider-specific-config)。

## 開始使用

<Tabs>
  <Tab title="API 金鑰（OpenAI Platform）">
    **最適合：** 直接 API 存取與依用量計費。

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
      <Step title="驗證模型可用">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照              | 執行階段設定                                       | 路由                     | 驗證                              |
    | ----------------------- | ------------------------------------------------------ | --------------------------- | ------------------------------------ |
    | `openai/gpt-5.5`       | 未設定，或提供者/模型 `agentRuntime.id: "codex"`   | Codex app-server 執行框架   | 已排序的 API 金鑰驗證設定檔       |
    | `openai/gpt-5.4-mini`  | 未設定，或提供者/模型 `agentRuntime.id: "codex"`   | Codex app-server 執行框架   | 已排序的 API 金鑰驗證設定檔       |
    | `openai/gpt-5.5`       | 提供者/模型 `agentRuntime.id: "openclaw"`          | OpenClaw 嵌入式執行階段  | 已選取的 `openai` API 金鑰設定檔  |

    <Note>
    `openai/*` 上的代理程式回合預設使用 Codex app-server 執行框架。若要在代理程式模型上使用
    API 金鑰驗證，請建立 `openai` API 金鑰驗證設定檔，並使用
    `auth.order.openai` 排序；`OPENAI_API_KEY` 仍是非代理程式 OpenAI API 介面的直接
    後備。執行 `openclaw doctor --fix` 以遷移較舊的舊版 Codex 驗證順序項目。
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

    `chat-latest` 是會變動的別名。OpenAI 建議在生產環境
    API 用途中使用 `gpt-5.5`，因此除非你想要該別名行為，否則請保留
    `openai/gpt-5.5` 作為穩定預設值。此別名只接受 `medium` 文字詳略程度；
    OpenClaw 會針對此模型將任何其他請求的詳略程度強制改為 `medium`。

    <Warning>
    OpenClaw **不會**在直接 OpenAI
    API 金鑰路由上公開 `gpt-5.3-codex-spark`。只有當你登入的帳戶公開它時，
    才能透過 Codex 訂閱目錄項目使用。
    </Warning>

  </Tab>

  <Tab title="Codex 訂閱">
    **最適合：** 使用你的 ChatGPT/Codex 訂閱搭配原生 Codex
    app-server 執行，而不是使用個別 API 金鑰。Codex 雲端需要
    ChatGPT 登入。

    <Steps>
      <Step title="執行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        或直接執行 OAuth：

        ```bash
        openclaw models auth login --provider openai
        ```

        對於無頭或不適合回呼的設定，加入 `--device-code`，改用
        ChatGPT 裝置碼流程登入，而不是 localhost 瀏覽器
        回呼：

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="使用標準 OpenAI 模型路由">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        預設路徑不需要執行階段設定。OpenAI 代理程式
        回合會自動選取原生 Codex app-server 執行階段，而且
        OpenClaw 會在選擇此路由時安裝或修復 bundled Codex 外掛。
      </Step>
      <Step title="驗證 Codex 驗證可用">
        ```bash
        openclaw models list --provider openai
        ```

        閘道執行後，在聊天中傳送 `/codex status` 或 `/codex models`
        以驗證原生 app-server 執行階段。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照                | 執行階段設定                                | 路由                                                  | 驗證                                            |
    | -------------------------- | ------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.5`         | 未設定，或提供者/模型 `agentRuntime.id: "codex"` | 原生 Codex app-server 執行框架                        | Codex 登入，或已排序的 `openai` 驗證設定檔 |
    | `openai/gpt-5.5`         | 提供者/模型 `agentRuntime.id: "openclaw"`  | OpenClaw 嵌入式執行階段，內部 Codex 驗證傳輸 | 已選取的 `openai` OAuth 設定檔                 |
    | 舊版 Codex GPT-5.5 參照 | 由 doctor 修復                            | 重寫為 `openai/gpt-5.5`                            | 已遷移的 OpenAI OAuth 設定檔                   |
    | `codex-cli/gpt-5.5`      | 由 doctor 修復                            | 重寫為 `openai/gpt-5.5`                            | Codex app-server 驗證                           |

    <Warning>
    新的訂閱支援代理程式設定請優先使用 `openai/gpt-5.5`。較舊的
    Codex GPT 參照是舊版 OpenClaw 路由，不是原生 Codex 執行階段
    路徑；執行 `openclaw doctor --fix` 以遷移它們。`gpt-5.3-codex-spark`
    仍僅限於其 Codex 訂閱目錄宣告該模型的帳戶；
    其直接 OpenAI API 金鑰和 Azure 參照仍會被抑制。
    </Warning>

    <Note>
    新設定應將 OpenAI 代理程式驗證順序放在 `auth.order.openai` 下；
    doctor 會遷移較舊的舊版 Codex 驗證順序項目。
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

    使用 API 金鑰備援時，將模型保留在 `openai/gpt-5.5`，並將
    驗證順序放在 `openai` 下。OpenClaw 會先嘗試訂閱，然後嘗試
    API 金鑰，同時保持在 Codex 執行框架上：

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
    入門設定不再從 `~/.codex` 匯入 OAuth 素材。使用
    瀏覽器 OAuth（預設）或上方的裝置碼流程登入；OpenClaw 會在自己的
    代理程式驗證儲存區中管理產生的憑證。
    </Note>

    ### 檢查並復原 Codex OAuth 路由

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    對於特定代理程式，加入 `--agent <id>`：

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    如果較舊的設定仍有舊版 Codex GPT 參照，或沒有明確執行階段設定的過時 OpenAI
    執行階段工作階段釘選，請修復它：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai` 沒有顯示可用設定檔，請再次登入：

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    對同一代理程式中的多個 Codex OAuth 登入使用 `--profile-id`，然後
    透過驗證排序或 `/model ...@<profileId>` 控制它們：

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    在依賴設定檔排序之前，執行 `openclaw doctor --fix` 以遷移較舊的舊版 OpenAI Codex 前綴
    設定檔 ID 和順序項目。

    ### 狀態指示器

    聊天 `/status` 會顯示目前工作階段啟用的模型執行階段。bundled Codex app-server 執行框架在
    `openai/*` 代理程式回合中會顯示為
    `Runtime: OpenAI Codex`。除非設定明確釘選 OpenClaw，否則過時的 OpenAI 執行階段
    工作階段釘選會修復為 Codex。

    ### Doctor 警告

    如果舊版 Codex 模型參照或過時的 OpenAI 執行階段釘選仍留在設定
    或工作階段狀態中，`openclaw doctor --fix` 會將它們重寫為 `openai/*` 並使用
    Codex 執行階段，除非已明確設定 OpenClaw。

    ### 上下文視窗上限

    OpenClaw 將模型中繼資料和執行階段上下文上限視為不同
    值。對於透過 Codex OAuth 目錄的 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`400000`
    - 預設執行階段 `contextTokens` 上限：`272000`

    較小的預設上限在實務上具有更好的延遲和品質特性。
    使用 `contextTokens` 覆寫它：

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
    使用 `contextWindow` 宣告原生模型中繼資料。使用 `contextTokens`
    限制執行階段上下文預算。直接 OpenAI API 金鑰路由
    會回報 `gpt-5.5` 較大的原生 `contextWindow`（`1000000`）；這兩個
    路由會分開追蹤，因為上游目錄不同。
    </Note>

    ### 目錄復原

    OpenClaw 會在存在 `gpt-5.5` 時使用其上游 Codex 目錄中繼資料。
    如果即時 Codex 探索在帳戶已驗證時省略 `gpt-5.5` 列，
    OpenClaw 會合成該 OAuth 模型列，讓排程、
    子代理程式和已設定的預設模型執行不會因
    `Unknown model` 而失敗。

  </Tab>
</Tabs>

## 原生 Codex app-server 驗證

原生 Codex app-server 執行框架會使用 `openai/*` 模型參照，且執行階段
設定未設定或提供者/模型 `agentRuntime.id: "codex"`，但其驗證
仍以帳戶為基礎。OpenClaw 會依下列順序選取驗證：

1. 代理程式的已排序 OpenAI 驗證設定檔，最好位於
   `auth.order.openai` 下。執行 `openclaw doctor --fix` 以遷移較舊的舊版
   Codex 驗證設定檔 ID 和驗證順序。
2. app-server 的既有帳戶，例如本機 Codex 命令列介面 ChatGPT
   登入。
3. 僅限本機 stdio app-server 啟動，且僅當 app-server
   回報沒有帳戶時：`CODEX_API_KEY`，然後是 `OPENAI_API_KEY`。

本機 ChatGPT/Codex 訂閱登入不會只因為
閘道程序也有用於直接 OpenAI 模型或
嵌入的 `OPENAI_API_KEY` 而被取代。環境 API 金鑰後備僅適用於本機 stdio 無帳戶
路徑；它絕不會透過 WebSocket app-server 連線傳送。當選取
訂閱式 Codex 設定檔時，OpenClaw 也會讓
`CODEX_API_KEY` 和 `OPENAI_API_KEY` 不進入衍生的 stdio app-server 子程序，
並改透過 app-server 登入 RPC 傳送選取的憑證。

當該訂閱設定檔因 Codex 用量限制而受阻時，OpenClaw
會將設定檔標記為受阻，直到 Codex 宣告的重設時間，並讓驗證
排序輪替到下一個 `openai:*` 設定檔，而不變更選取的
模型或離開 Codex 執行框架。重設時間過後，
該訂閱設定檔會再次符合資格。

## 圖片生成

bundled `openai` 外掛會透過
`image_generate` 工具註冊圖片生成。它透過相同的 `openai/gpt-image-2` 模型參照
同時支援 OpenAI API 金鑰和 Codex OAuth 圖片
生成。

| 功能                    | OpenAI API 金鑰                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型參照                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 驗證                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登入              |
| 傳輸                      | OpenAI Images API                  | Codex Responses 後端                 |
| 每次請求最多圖片數       | 4                                  | 4                                    |
| 編輯模式                 | 已啟用（最多 5 張參考圖片）       | 已啟用（最多 5 張參考圖片）         |
| 尺寸覆寫                 | 支援，包含 2K/4K 尺寸              | 支援，包含 2K/4K 尺寸                |
| 長寬比 / 解析度          | 不轉送至 OpenAI Images API         | 安全時對應到支援的尺寸              |

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
請參閱[圖片生成](/zh-TW/tools/image-generation)，了解共用工具參數、
提供者選擇，以及容錯移轉行為。
</Note>

`gpt-image-2` 是 OpenAI 文字轉圖片生成和圖片編輯的預設值。
`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作為明確的模型覆寫使用。
若要輸出透明背景的 PNG/WebP，請使用 `openai/gpt-image-1.5`；目前的 `gpt-image-2` API 會拒絕
`background: "transparent"`。

若要提出透明背景請求，請呼叫 `image_generate`，並使用
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及
`background: "transparent"`；較舊的 `openai.background` 提供者選項仍會被接受。OpenClaw 也會保護公開的 OpenAI 和 OpenAI Codex OAuth
路由，將預設的 `openai/gpt-image-2` 透明請求改寫為
`gpt-image-1.5`；Azure 和自訂 OpenAI 相容端點會保留其已設定的部署/模型名稱。

相同設定也會公開給無頭命令列介面執行使用：

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
`--openai-background` 仍可作為 OpenAI 專用別名使用。使用
`--quality low|medium|high|auto` 控制 OpenAI Images 品質和成本。
使用 `--openai-moderation low|auto` 從 `image generate` 或 `image edit` 傳遞 OpenAI 的審核提示。

對於 ChatGPT/Codex OAuth 安裝，請保留相同的 `openai/gpt-image-2` 參照。當設定了
`openai` OAuth 設定檔時，OpenClaw 會解析該儲存的 OAuth
存取權杖，並透過 Codex Responses 後端傳送圖片請求；它不會先嘗試
`OPENAI_API_KEY`，也不會悄悄退回使用 API 金鑰。
若要改用直接的 OpenAI Images API 路由，請使用 API 金鑰、自訂基礎
URL 或 Azure 端點明確設定 `models.providers.openai`。如果該自訂圖片端點位於受信任的 LAN/私人位址，
也請設定 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在此
選擇加入設定，OpenClaw 會持續封鎖私人/內部 OpenAI 相容圖片端點。

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

內建的 `openai` 外掛會透過
`video_generate` 工具註冊影片生成。

| 功能             | 值                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------- |
| 預設模型         | `openai/sora-2`                                                                    |
| 模式             | 文字轉影片、圖片轉影片、單一影片編輯                                               |
| 參考輸入         | 1 張圖片或 1 部影片                                                                 |
| 尺寸覆寫         | 支援文字轉影片和圖片轉影片                                                         |
| 長寬比           | 轉換為最接近的支援尺寸，不會原樣轉送                                               |
| 其他覆寫         | `resolution`、`audio`、`watermark` 不受支援，並會在工具警告中被捨棄                |

OpenAI 圖片轉影片請求會使用帶有圖片
`input_reference` 的 `POST /v1/videos`。單一影片編輯會使用
`POST /v1/videos/edits`，並將上傳的影片放在 `video` 欄位。

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
請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、
提供者選擇，以及容錯移轉行為。

OpenAI 提供者宣告 `supportsSize`，但未宣告 `supportsAspectRatio` 或
`supportsResolution`。OpenClaw 的共用正規化層會在請求到達提供者之前，將請求的
`aspectRatio` 轉換為最接近的 OpenAI `size`，因此長寬比請求通常仍可運作。
`resolution` 沒有尺寸備援，會被捨棄，並以
`Ignored unsupported overrides for openai/<model>: resolution=<value>` 呈現給呼叫端。
</Note>

## GPT-5 提示貢獻

OpenClaw 會為 `openai` 提供者上的 GPT-5 系列模型加入共用 GPT-5 提示貢獻
（包括會正規化為 `openai/*` 的舊版修復前 Codex 參照）。其他也提供 GPT-5 系列模型 ID 的提供者，
例如 OpenRouter 或 opencode 路由，不會收到這個覆蓋層；它會以
提供者 ID `openai` 作為門檻，而不是只看模型 ID。較舊的 GPT-4.x 模型永遠不會
收到它。

原生 Codex app-server 測試框架不會透過
開發者指令接收角色/工具紀律行為合約或友善互動風格覆蓋層；原生 Codex 會保留 Codex 所有的基礎、模型和
專案文件行為，而 OpenClaw 會停用 Codex 內建的原生執行緒個性，讓代理工作區個性檔案保持權威。
OpenClaw 只會向原生 Codex 執行緒貢獻執行階段脈絡：通道
傳遞、OpenClaw 動態工具、ACP 委派、工作區脈絡和
OpenClaw Skills。這項相同貢獻中的心跳偵測指引文字是
唯一例外：原生 Codex 心跳偵測回合確實會取得它，並以專用
協作指令注入，而不是透過共用提示貢獻
鉤子。

GPT-5 貢獻會為符合條件的 OpenClaw 組裝提示加入帶標籤的行為合約，涵蓋角色
持續性、執行安全性、工具紀律、輸出形狀、完成
檢查，以及驗證。通道
專用回覆與靜默訊息行為會保留在共用 OpenClaw 系統
提示和外送傳遞政策中。友善互動風格層是
獨立且可設定的。

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
執行階段的值不區分大小寫，因此 `"Off"` 和 `"off"` 都會停用
友善風格層。
</Tip>

<Note>
當共用的
`agents.defaults.promptOverlays.gpt5.personality` 設定未設定時，舊版
`plugins.entries.openai.config.personality` 仍會作為相容性備援讀取。
</Note>

## 語音與語音辨識

<AccordionGroup>
  <Accordion title="語音合成（TTS）">
    內建的 `openai` 外掛會為
    `messages.tts` 介面註冊語音合成。

    | 設定         | 設定路徑                                            | 預設值                              |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | 模型         | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | 語音         | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | 速度         | `messages.tts.providers.openai.speed`                  | （未設定）                       |
    | 指令         | `messages.tts.providers.openai.instructions`           | （未設定，僅限 `gpt-4o-mini-tts`） |
    | 格式         | `messages.tts.providers.openai.responseFormat`         | 語音備忘錄使用 `opus`，檔案使用 `mp3` |
    | API 金鑰     | `messages.tts.providers.openai.apiKey`                 | 退回使用 `OPENAI_API_KEY`        |
    | 基礎 URL     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | 額外主體     | `messages.tts.providers.openai.extraBody` / `extra_body` | （未設定）                       |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用語音：
    `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、
    `marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 會在 OpenClaw
    產生的欄位之後合併到 `/audio/speech` 請求 JSON，因此可用於需要
    `lang` 等額外鍵的 OpenAI 相容端點。原型鍵會被忽略。

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
    設定 `OPENAI_TTS_BASE_URL` 可覆寫 TTS 基礎 URL，而不影響
    聊天 API 端點。OpenAI TTS 和 Realtime 語音都會透過
    OpenAI Platform API 金鑰設定；僅 OAuth 安裝仍可使用
    Codex 支援的聊天模型，但不能使用 OpenAI 即時語音回覆。
    </Note>

  </Accordion>

  <Accordion title="語音轉文字">
    內建的 `openai` 外掛會透過
    OpenClaw 的媒體理解轉錄介面註冊批次語音轉文字。

    - 預設模型：`gpt-4o-transcribe`
    - 端點：OpenAI REST `/v1/audio/transcriptions`
    - 輸入路徑：multipart 音訊檔案上傳
    - 使用位置：任何讀取 `tools.media.audio` 的傳入音訊轉錄，
      包括 Discord 語音通道片段和通道音訊附件

    若要強制傳入音訊轉錄使用 OpenAI：

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

    當共用音訊媒體設定或逐次呼叫的轉錄請求提供語言和提示提示時，會轉送給 OpenAI。

  </Accordion>

  <Accordion title="即時轉錄">
    內建的 `openai` 外掛會為
    語音通話外掛註冊即時轉錄。

    | 設定          | 設定路徑                                                          | 預設值 |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | 模型            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 語言         | `...openai.language`                                                 |（未設定）|
    | 提示           | `...openai.prompt`                                                   |（未設定）|
    | 靜音持續時間 | `...openai.silenceDurationMs`                                        | `800`   |
    | VAD 閾值    | `...openai.vadThreshold`                                             | `0.5`   |
    | 驗證             | `...openai.apiKey`、`OPENAI_API_KEY`，或 `openai` OAuth              | API 金鑰會直接連線；OAuth 會鑄發 Realtime 轉錄用戶端密鑰 |

    <Note>
    使用 WebSocket 連線到 `wss://api.openai.com/v1/realtime`，並使用
    G.711 u-law（`g711_ulaw` / `audio/pcmu`）音訊。當只設定了 `openai` OAuth 時，
    閘道會在開啟 WebSocket 前鑄發一個短效 Realtime 轉錄用戶端密鑰。此串流提供者用於語音通話的即時轉錄路徑；Discord 語音目前會錄製短片段，並改用批次 `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="即時語音">
    內建的 `openai` 外掛會為語音通話外掛註冊即時語音。

    | 設定                               | 設定路徑                                                              | 預設值             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | 模型                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2`    |
    | 語音                                  | `...openai.voice`                                                       | `alloy`             |
    | 溫度（Azure 部署橋接）  | `...openai.temperature`                                                 | `0.8`               |
    | VAD 閾值                          | `...openai.vadThreshold`                                                | `0.5`                |
    | 靜音持續時間                       | `...openai.silenceDurationMs`                                           | `500`                |
    | 前綴填補                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | 推理強度                       | `...openai.reasoningEffort`                                             |（未設定）              |
    | 驗證                                   | `openai` API 金鑰/OAuth 設定檔、外部 Codex 登入、`...openai.apiKey`，或 `OPENAI_API_KEY` | API 金鑰來源優先；Codex OAuth 後援 |

    `gpt-realtime-2` 可用的內建 Realtime 語音：`alloy`、`ash`、
    `ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI 建議使用 `marin` 和 `cedar` 以獲得最佳 Realtime 品質。這與上方的文字轉語音語音是不同集合；僅適用於 TTS 的語音，例如 `fable`、`nova` 或 `onyx`，不適用於 Realtime 工作階段。

    <Note>
    後端 OpenAI 即時橋接使用 GA Realtime WebSocket 工作階段形狀，
    不接受 `session.temperature`。Azure OpenAI 部署仍可透過 `azureEndpoint` 和 `azureDeployment` 使用，並保留與部署相容的工作階段形狀（包括 `temperature`）。
    支援雙向工具呼叫和 G.711 u-law 音訊。
    </Note>

    <Note>
    建立工作階段時會選取即時語音。OpenAI 允許大多數工作階段欄位稍後變更，但模型在該工作階段發出音訊後，就不能再變更語音。OpenClaw 目前將內建 Realtime 語音 ID 以字串公開。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 瀏覽器即時工作階段，搭配由閘道鑄發的短效用戶端密鑰，並直接透過瀏覽器 WebRTC SDP 交換連到 OpenAI Realtime API。閘道會使用選取的 `openai` 認證鑄發該用戶端密鑰。已設定的金鑰、API 金鑰設定檔和 `OPENAI_API_KEY` 會優先；`openai` OAuth 設定檔或外部 Codex 登入是後援。閘道轉送和語音通話後端即時 WebSocket 橋接，在原生 OpenAI 端點上使用相同的認證順序。
    維護者可用
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    進行即時驗證；OpenAI 部分會在不記錄密鑰的情況下，同時驗證後端 WebSocket 橋接和瀏覽器 WebRTC SDP 交換。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端點

內建的 `openai` 提供者可以透過覆寫基底 URL，將影像生成指向 Azure OpenAI 資源。在影像生成路徑上，OpenClaw 會偵測 `models.providers.openai.baseUrl` 上的 Azure 主機名稱，並自動切換到 Azure 的請求形狀。

<Note>
即時語音使用獨立的設定路徑
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)，
不受 `models.providers.openai.baseUrl` 影響。請參閱 [語音和語音合成](#voice-and-speech) 下方的 **即時語音** 摺疊區塊，以了解其 Azure 設定。
</Note>

在以下情況使用 Azure OpenAI：

- 你已經有 Azure OpenAI 訂閱、配額或企業協議
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

OpenClaw 會辨識這些 Azure 主機尾碼，並用於 Azure 影像生成路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

針對可辨識 Azure 主機上的影像生成請求，OpenClaw 會：

- 傳送 `api-key` 標頭，而不是 `Authorization: Bearer`
- 使用部署範圍路徑（`/openai/deployments/{deployment}/...`）
- 將 `?api-version=...` 附加到每個請求
- 對 Azure 影像生成呼叫使用 600 秒的預設請求逾時。
  每次呼叫的 `timeoutMs` 值仍會覆寫此預設值。

其他基底 URL（公開 OpenAI、OpenAI 相容代理）會保留標準 OpenAI 影像請求形狀。

<Note>
`openai` 提供者影像生成路徑的 Azure 路由需要
OpenClaw 2026.4.22 或更新版本。較早版本會將任何自訂
`openai.baseUrl` 視為公開 OpenAI 端點，並在 Azure 影像部署上失敗。
</Note>

### API 版本

設定 `AZURE_OPENAI_API_VERSION`，為 Azure 影像生成路徑固定特定 Azure 預覽版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未設定變數時，預設值為 `2024-12-01-preview`。

### 模型名稱就是部署名稱

Azure OpenAI 會將模型繫結到部署。對於透過內建 `openai` 提供者路由的 Azure 影像生成請求，OpenClaw 中的 `model` 欄位必須是你在 Azure 入口網站中設定的 **Azure 部署名稱**，而不是公開 OpenAI 模型 ID。

如果你建立名為 `gpt-image-2-prod`、提供 `gpt-image-2` 的部署：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同樣的部署名稱規則適用於任何透過內建 `openai` 提供者路由的影像生成呼叫。

### 區域可用性

Azure 影像生成目前僅在部分區域可用
（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。建立部署前，請查看 Microsoft 目前的區域清單，並確認你的區域提供特定模型。

### 參數差異

Azure OpenAI 和公開 OpenAI 不一定接受相同的影像參數。
Azure 可能會拒絕公開 OpenAI 允許的選項（例如 `gpt-image-2` 上某些
`background` 值），或只在特定模型版本上公開這些選項。這些差異來自 Azure 和底層模型，而不是 OpenClaw。如果 Azure 請求因驗證錯誤失敗，請在 Azure 入口網站中檢查你的特定部署和 API 版本支援的參數集合。

<Note>
Azure OpenAI 使用原生傳輸和相容行為，但不會收到 OpenClaw 的隱藏歸因標頭 - 請參閱 [進階設定](#advanced-configuration) 下方的 **原生與 OpenAI 相容路由** 摺疊區塊。

對於 Azure 上的聊天或 Responses 流量（影像生成以外），請使用入門設定流程或專用 Azure 提供者設定；單靠 `openai.baseUrl` 不會採用 Azure API/驗證形狀。另有一個
`azure-openai-responses/*` 提供者；請參閱下方的伺服器端壓縮摺疊區塊。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="傳輸（WebSocket 與 SSE）">
    OpenClaw 對 `openai/*` 採用 WebSocket 優先並以 SSE 後援（`"auto"`）。

    在 `"auto"` 模式中，OpenClaw 會：
    - 在後援到 SSE 前重試一次早期 WebSocket 失敗
    - 失敗後將 WebSocket 標記為降級 60 秒，並在冷卻期間使用 SSE
    - 為重試和重新連線附加穩定的工作階段與回合身分標頭
    - 在傳輸變體之間正規化用量計數器（`input_tokens` / `prompt_tokens`）

    | 值                | 行為                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"`（預設）   | WebSocket 優先，SSE 後援     |
    | `"sse"`              | 只強制使用 SSE                    |
    | `"websocket"`        | 只強制使用 WebSocket              |

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

    啟用時，OpenClaw 會將快速模式對應到 OpenAI 優先處理
    （`service_tier = "priority"`）。現有的 `service_tier` 值會保留，且快速模式不會重寫 `reasoning` 或
    `text.verbosity`。`fastMode: "auto"` 會讓新的模型呼叫在自動截止時間前使用快速模式，然後讓後續重試、後援、工具結果或續接呼叫不使用快速模式。截止時間預設為 60 秒；在作用中的模型上設定 `params.fastAutoOnSeconds` 可變更它。

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
    OpenAI 的 API 透過 `service_tier` 公開優先處理。可在 OpenClaw 中逐模型設定：

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
    `serviceTier` 只會轉送到原生 OpenAI 端點
    (`api.openai.com`) 和原生 Codex 端點 (`chatgpt.com/backend-api`)。
    如果你透過 proxy 路由任一提供者，OpenClaw 會保持
    `service_tier` 不變。
    </Warning>

  </Accordion>

  <Accordion title="伺服器端壓縮 (Responses API)">
    對於直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），
    OpenAI 外掛的 OpenClaw 串流包裝器會自動啟用伺服器端
    壓縮：

    - 強制 `store: true`（除非模型相容性設定 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 預設 `compact_threshold`：`contextWindow` 的 70%（或在
      無法取得時使用 `80000`）

    這會套用到內建 OpenClaw 執行階段路徑，以及嵌入式執行使用的 OpenAI 提供者
    hooks。原生 Codex 應用程式伺服器 harness 會透過 Codex 管理
    自己的上下文，且不受此設定影響。

    <Tabs>
      <Tab title="明確啟用">
        適用於相容端點，例如 Azure OpenAI Responses：

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
    `responsesServerCompaction` 只控制 `context_management` 注入。
    直接 OpenAI Responses 模型仍會強制 `store: true`，除非相容性設定
    `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT 模式">
    對於透過 OpenClaw 嵌入式執行階段執行的 `openai` 提供者 GPT-5 系列模型，
    OpenClaw 已經預設採用更嚴格的執行合約，稱為
    `strict-agentic`。只要解析出的提供者是
    `openai`，且模型 id 符合 GPT-5 系列，它就會自動啟用，除非設定
    明確選擇退出：

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    明確設定 `"strict-agentic"` 在支援的路徑上是無操作（它
    已經是預設值），在不支援的提供者/模型配對上則無效。

    啟用 `strict-agentic` 時，OpenClaw 會：
    - 對實質工作自動啟用 `update_plan`
    - 對結構上空白或只有推理的回合，以可見答案
      延續重試
    - 當所選 harness 提供明確的計畫事件時使用它們

    OpenClaw 不會分類 assistant prose 來判斷某個回合是
    計畫、進度更新，還是最終答案。

    <Note>
    此合約完全位於 OpenClaw 的嵌入式 agent runner 中。它不會
    套用到原生 Codex 應用程式伺服器 harness；該 harness 會管理自己的
    回合與計畫行為；對原生 Codex 執行而言，harness 選擇比
    execution-contract 設定更重要。
    </Note>

  </Accordion>

  <Accordion title="原生與 OpenAI 相容路由">
    OpenClaw 會以不同方式處理直接 OpenAI、Codex 和 Azure OpenAI 端點，
    以及通用 OpenAI 相容 `/v1` proxy：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 只對支援 OpenAI `none` effort 的模型保留
      `reasoning: { effort: "none" }`
    - 對會拒絕 `reasoning.effort: "none"` 的模型或 proxy，
      省略已停用的 reasoning
    - 預設將工具 schema 設為嚴格模式
    - 只在已驗證的原生主機上附加隱藏 attribution headers（Azure
      OpenAI 不會取得這些 headers，即使它是原生路由）
    - 保留僅限 OpenAI 的請求塑形（`service_tier`、`store`、
      reasoning 相容性、prompt-cache hints）

    **Proxy/相容路由：**
    - 使用較寬鬆的相容行為
    - 從非原生 `openai-completions` payload 中移除 Completions `store`
    - 接受 OpenAI 相容 Completions proxy 的進階 `params.extra_body`/`params.extraBody` pass-through JSON
    - 接受 OpenAI 相容 Completions proxy（例如 vLLM）的
      `params.chat_template_kwargs`
    - 不強制使用嚴格工具 schema 或僅限原生的 headers

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="圖片生成" href="/zh-TW/tools/image-generation" icon="image">
    共用圖片工具參數與提供者選擇。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片工具參數與提供者選擇。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊與憑證重用規則。
  </Card>
</CardGroup>
