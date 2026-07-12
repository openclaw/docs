---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 訂閱驗證，而不是 API 金鑰
    - 你需要更嚴格的 GPT-5 代理執行行為
summary: 在 OpenClaw 中透過 API 金鑰或 Codex 訂閱使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-07-12T14:45:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bc433abdf4fb8984430054acecdda3ba01b9795ad52cc89b19e10b09c6bcc8c3
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw 對直接 API 金鑰驗證與 ChatGPT/Codex 訂閱驗證使用同一個提供者 ID：`openai`。`openai/*` 是標準模型路由。
對於執行階段政策未設定或設為 `auto` 的嵌入式代理程式回合，OpenAI 的路由
資訊會決定 OpenClaw 是否可隱含選取內建的 Codex app-server 執行階段。
僅有 `openai/*` 前綴並不會選取執行階段。

- **代理程式模型** - `openai/*` 會透過明確的 `agentRuntime` 設定或
  OpenAI 隱含路由政策所選取的執行階段執行。若要使用 ChatGPT/Codex
  訂閱，請以 Codex 驗證登入；若要採用金鑰計費，則設定 API 金鑰驗證
  設定檔。
- **非代理程式 OpenAI API** - 透過 `OPENAI_API_KEY` 或 `openai` API
  金鑰驗證設定檔直接存取 OpenAI Platform，並按用量計費。
- **舊版設定** - `openclaw doctor --fix` 會將舊的 Codex 模型參照和設定檔
  ID 修復為 `openai/*`。

OpenAI 明確支援在外部工具以及 OpenClaw 這類工作流程中使用訂閱 OAuth。

## 用量與成本追蹤

OpenClaw 會區分訂閱配額與 Platform API 計費：

- ChatGPT/Codex OAuth 會顯示訂閱方案、配額週期和點數餘額。
- `OPENAI_ADMIN_KEY` 會在控制介面的 **用量** 中顯示提供者回報的 30 天組織成本與 completions 用量，包括每日支出、請求／權杖總數、熱門模型和成本類別。
- `OPENAI_PROJECT_ID` 可選擇將 Admin API 歷史記錄限制在單一專案。
- OpenClaw 絕不會將 `OPENAI_API_KEY` 或 `openai` 推論設定檔傳送至組織 API；這些認證資訊可能屬於自訂、Azure 或代理程式本機端點。

明確設定的 Admin 金鑰優先於 OAuth。提供者回報的歷史記錄不會與 OpenClaw 根據工作階段推算的成本合併；其中可能包含其他用戶端的 API 活動和提供者端的帳務調整。

OpenAI 的 [API 用量儀表板](https://help.openai.com/en/articles/10478918)文件說明了存取用量資料所需的組織擁有者身分及明確的 Usage Dashboard 權限。

提供者、模型、執行階段和頻道是彼此獨立的層級。如果你混淆了這些標籤，
請先閱讀[代理程式執行階段](/zh-TW/concepts/agent-runtimes)，再變更設定。

## 快速選擇

| 目標                                              | 使用                                                               | 備註                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| ChatGPT/Codex 訂閱、原生 Codex 執行階段           | `openai/gpt-5.6-sol`                                               | 全新的訂閱設定；使用 Codex 驗證登入。                             |
| 代理程式回合採用直接 API 金鑰計費                 | `openai/gpt-5.6` 加上依序排列的 API 金鑰驗證設定檔                 | 全新的 API 金鑰設定；不含後綴的直接 API ID 會解析為 Sol。         |
| 選擇確切的 GPT-5.6 層級                           | `openai/gpt-5.6-sol`、`-terra` 或 `-luna`                          | 檢查 `models list` 以查看此帳號可用的層級。                       |
| 無 GPT-5.6 存取權的帳號                           | `openai/gpt-5.5`                                                   | 明確的復原選項；OpenClaw 不會無提示地降級。                       |
| 直接 API 金鑰計費、明確使用 OpenClaw 執行階段     | `openai/gpt-5.6` 加上提供者／模型 `agentRuntime.id: "openclaw"`    | 選取一般的 `openai` API 金鑰設定檔。                              |
| 最新 ChatGPT Instant 模型別名                     | `openai/chat-latest`                                               | 僅限直接 API 金鑰；這是浮動別名，而非穩定的預設值。               |
| 圖像生成或編輯                                    | `openai/gpt-image-2`                                               | 可搭配 `OPENAI_API_KEY` 或 Codex OAuth 使用。                     |
| 透明背景圖像                                      | `openai/gpt-image-1.5`                                             | 將 `outputFormat` 設為 `png` 或 `webp`，並設定 `background=transparent`。 |

## 名稱對照表

| 你看到的名稱                            | 層級              | 意義                                                                                      |
| --------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| `openai`                                | 提供者前綴        | 標準 OpenAI 模型路由；路由資訊會決定隱含執行階段。                                       |
| `codex` 外掛                            | 外掛              | 提供原生 Codex app-server 執行階段及 `/codex` 聊天控制功能的內建外掛。                    |
| 提供者／模型 `agentRuntime.id: codex`   | 代理程式執行階段  | 強制相符的嵌入式回合使用原生 Codex app-server 執行環境。                                  |
| `/codex ...`                            | 聊天命令集        | 從對話繫結／控制 Codex app-server 執行緒。                                                |
| `runtime: "acp", agentId: "codex"`      | ACP 工作階段路由  | 透過 ACP/acpx 執行 Codex 的明確備援路徑。                                                 |

## 隱含代理程式執行階段

當提供者／模型的 `agentRuntime` 政策未設定或設為 `auto` 時，OpenAI
自有的提供者路由政策會依有效端點和配接器選擇隱含執行階段：

| 有效路由資訊                                                                                                                                                            | 隱含執行階段          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 使用 `openai-responses` 的確切官方 Platform HTTPS 端點，或使用 `openai-chatgpt-responses` 的確切官方 ChatGPT HTTPS 端點；沒有自行設定的請求覆寫                                 | 可選取 Codex          |
| 自行設定的 `openai-completions` 配接器                                                                                                                                  | OpenClaw              |
| 自訂端點                                                                                                                                                                | OpenClaw              |
| 明確指定且完全相符、但使用 HTTP 的官方端點                                                                                                                              | 拒絕                  |
| 具有自行設定的提供者／模型請求覆寫之路由                                                                                                                                | OpenClaw              |

明確設定的非預設提供者／模型 `agentRuntime.id` 仍具有最終決定權。
例如，`agentRuntime.id: "openclaw"` 會讓原本符合 Codex 資格的路由
維持使用 OpenClaw；而 `agentRuntime.id: "codex"` 則要求使用 Codex，
且在有效路由未宣告為與 Codex 相容時採取封閉式失敗。
執行階段的選擇不會變更認證資訊類型或計費方式：Platform API 金鑰
驗證與 ChatGPT/Codex 訂閱驗證仍彼此獨立。

`openclaw doctor --fix` 會將舊版 Codex 模型參照、舊版 Codex 驗證
設定檔 ID 和舊版 Codex 驗證順序項目移轉至標準 `openai`
路由。新的驗證順序設定請使用 `auth.order.openai`。

<Note>
全新的 OpenAI 設定僅在尚未設定主要模型時，才會套用 GPT-5.6 主要模型。
新增或重新整理 OpenAI 驗證時，會保留既有的明確選擇，包括
`openai/gpt-5.5`，除非你明確使用 `models auth login --set-default`
或 `models set`。只有在代理程式模型需要 API 金鑰驗證時，才使用
API 金鑰驗證設定檔。
</Note>

## GPT-5.6 限量預覽

OpenClaw 可辨識確切的 `openai/gpt-5.6-sol`、
`openai/gpt-5.6-terra` 和 `openai/gpt-5.6-luna` 模型 ID。目前目錄中的
三者皆提供 `xhigh` 和 `max` 推理能力。OpenAI 將 Sol 描述為旗艦層級、
Terra 描述為均衡層級，Luna 則是快速且成本較低的層級。請參閱
[GPT-5.6 發布公告](https://openai.com/index/previewing-gpt-5-6-sol/)
和[存取指南](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna)。

使用直接 OpenAI API 金鑰驗證時，不含後綴的 `openai/gpt-5.6` ID 是
Sol 的別名，也是全新設定的預設值。原生 Codex 目錄不會在用戶端套用
該直接 API 別名；根據工作區存取權限，它可能會顯示確切的 Sol、Terra
和 Luna ID。因此，全新的 ChatGPT/Codex OAuth 設定會使用
`openai/gpt-5.6-sol`。使用以下命令檢查目前帳號：

```bash
openclaw models list --provider openai
```

API 組織與 Codex 工作區的存取權可能不同。如果無法使用 GPT-5.6，
請明確選取 GPT-5.5：

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw 會顯示上游存取錯誤，不會無提示地將 GPT-5.6 選項替換為
GPT-5.5。

<Note>
當執行階段政策未設定或設為 `auto` 時，符合資格且完全相符的官方 HTTPS
路由可能會選取內建的 Codex app-server 外掛；自行設定的 Completions 路由、
自訂端點和請求傳輸覆寫仍使用 OpenClaw。官方的純文字 HTTP 端點會遭到拒絕。
明確的提供者／模型執行階段設定仍具有最終決定權。執行
`openclaw doctor --fix` 可修復過時的舊版 Codex 模型參照、
`codex-cli/*` 參照，或並非由明確執行階段設定所設置的舊執行階段工作階段固定項目。
</Note>

## OpenClaw 功能涵蓋範圍

| OpenAI 功能         | OpenClaw 介面                                                                              | 狀態                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 聊天 / Responses          | `openai/<model>` 模型提供者                                                               | 是                                                             |
| Codex 訂閱模型 | 搭配 OpenAI OAuth 的 `openai/<model>`                                                            | 是                                                             |
| 舊版 Codex 模型參照   | 舊版 Codex 模型參照、`codex-cli/<model>`                                                     | 由 doctor 修復為 `openai/<model>`                          |
| Codex app-server 執行框架  | 執行階段未設定/設為 `auto` 的 Codex 相容 HTTPS 路由，或明確設定 `agentRuntime.id: codex`  | 是                                                             |
| 伺服器端網頁搜尋    | 原生 OpenAI Responses 工具                                                                  | 是，前提是已啟用網頁搜尋，且未鎖定其他提供者 |
| 圖片                    | `image_generate`                                                                              | 是                                                             |
| 影片                    | `video_generate`                                                                              | 是                                                             |
| 文字轉語音            | `messages.tts.provider: "openai"` / `tts`                                                     | 是                                                             |
| 批次語音轉文字      | `tools.media.audio` / 媒體理解                                                     | 是                                                             |
| 串流語音轉文字  | Voice Call `streaming.provider: "openai"`                                                     | 是                                                             |
| 即時語音            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | 是（OpenAI Platform API 金鑰）                                   |
| 嵌入                | 記憶嵌入提供者                                                                     | 是                                                             |

<Note>
OpenAI 即時語音會透過公開的 **OpenAI Platform Realtime
API**，並且需要 Platform API 金鑰。Codex OAuth 權杖則用於驗證
ChatGPT Codex 後端；兩者不能互相替代，Codex OAuth 權杖無法作為公開 Realtime 端點的 Platform API
金鑰。

若使用 API 金鑰驗證時回報缺少計費設定，請在
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
為即時語音認證資訊所屬的組織儲值 Platform 點數。即時語音可接受由
`openclaw onboard --auth-choice openai-api-key` 建立的 `openai` API 金鑰驗證設定檔、透過
`talk.realtime.providers.openai.apiKey` 為 Control UI Talk 設定的 Platform API 金鑰，或透過
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey` 為 Voice
Call 設定的 Platform API 金鑰，或 `OPENAI_API_KEY` 環境變數。
</Note>

## 記憶嵌入

OpenClaw 可使用 OpenAI 或 OpenAI 相容的嵌入端點，進行
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
會將其轉送為提供者特定的 `input_type` 請求欄位：查詢
嵌入使用 `queryInputType`；已建立索引的記憶區塊與批次索引則使用
`documentInputType`。完整範例請參閱
[記憶設定參考](/zh-TW/reference/memory-config#provider-specific-config)。

## 開始使用

<Tabs>
  <Tab title="API 金鑰（OpenAI Platform）">
    **最適合：**直接存取 API，並依用量計費。

    <Steps>
      <Step title="取得 API 金鑰">
        從 [OpenAI Platform 儀表板](https://platform.openai.com/api-keys)建立或複製 API 金鑰。
      </Step>
      <Step title="執行初始設定">
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

    | 模型參照        | 執行階段原則或路由條件                                 | 路由                     | 驗證                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | 未設定/`auto`、完全相符的官方 HTTPS 原生路由，且沒有請求覆寫 | 可選擇 Codex     | 已排序的 API 金鑰驗證設定檔      |
    | `openai/gpt-5.6` | 提供者/模型 `agentRuntime.id: "openclaw"`                  | OpenClaw 內嵌執行階段 | 選定的 `openai` API 金鑰設定檔 |
    | `openai/gpt-5.5` | 明確的提供者/模型 `agentRuntime.id`                     | 選定的代理程式執行階段    | 選定的 OpenAI API 金鑰設定檔   |
    | `openai/*`       | 自行定義的 Completions、自訂或請求覆寫 | OpenClaw 內嵌執行階段 | 認證資訊類型維持不變 |
    | `openai/*`       | 純文字官方 HTTP 端點                  | 已拒絕                 | 不會傳送認證資訊             |

    <Note>
    當執行階段未設定或設為 `auto` 時，只有符合資格且完全相符的官方 HTTPS 原生
    路由可以隱含選擇 Codex app-server 執行框架。若要在代理程式模型上使用 API 金鑰驗證，
    請建立 `openai` API 金鑰驗證設定檔，並使用
    `auth.order.openai` 排定其順序；對非代理程式的 OpenAI API 介面而言，
    `OPENAI_API_KEY` 仍是直接備援。執行 `openclaw doctor --fix` 以遷移較舊的
    舊版 Codex 驗證順序項目。
    </Note>

    ### 設定範例

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    裸的直接 API `gpt-5.6` ID 會解析至 Sol 層級。如果此 API
    組織未提供 GPT-5.6，請將主要模型明確設為
    `openai/gpt-5.5`。

    若要透過 OpenAI API 試用 ChatGPT 目前的 Instant 模型，請將模型
    設為 `openai/chat-latest`：

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` 是會變動的別名。全新的 OpenAI API 金鑰設定則使用
    `openai/gpt-5.6`，其裸的直接 API ID 會解析至 Sol。現有的
    明確主要模型（包括 `openai/gpt-5.5`）維持不變。
    `chat-latest` 別名只接受 `medium` 文字詳略程度；對此模型，OpenClaw 會將
    任何其他要求的詳略程度強制設為 `medium`。

    <Warning>
    OpenClaw **不會**在直接 OpenAI
    API 金鑰路由上公開 `gpt-5.3-codex-spark`。只有當你登入的帳號提供該模型時，
    才能透過 Codex 訂閱目錄項目使用。
    </Warning>

  </Tab>

  <Tab title="Codex 訂閱">
    **最適合：**使用你的 ChatGPT/Codex 訂閱搭配原生 Codex
    app-server 執行，而不使用個別的 API 金鑰。Codex 雲端需要
    登入 ChatGPT。

    <Steps>
      <Step title="執行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        或直接執行 OAuth：

        ```bash
        openclaw models auth login --provider openai
        ```

        對於無頭或不適合回呼的設定，請加入 `--device-code`，改用 ChatGPT 裝置代碼流程
        登入，而非使用 localhost 瀏覽器
        回呼：

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="使用標準 OpenAI 模型路由">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        這個完全相符的官方 HTTPS 原生
        路由不需要執行階段設定。它可能會自動選擇 Codex app-server 執行階段，且
        選擇該執行階段時，OpenClaw 會安裝或修復內建的 Codex 外掛。
      </Step>
      <Step title="確認 Codex 驗證可用">
        ```bash
        openclaw models list --provider openai
        ```

        閘道執行後，在聊天中傳送 `/codex status` 或 `/codex models`，
        以確認原生 app-server 執行階段。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照                | 執行階段原則或路由條件                                 | 路由                                                    | 驗證                                               |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | 未設定/`auto`、完全相符的官方 HTTPS 原生路由，且沒有請求覆寫 | 可選擇 Codex                                    | Codex 登入，或已排序的 `openai` 驗證設定檔 |
    | `openai/gpt-5.6-terra`   | 未設定/`auto`、完全相符的官方 HTTPS 原生路由，且沒有請求覆寫 | 可選擇 Codex                                    | 目錄提供 Terra 時使用 Codex 登入       |
    | `openai/gpt-5.6-luna`    | 未設定/`auto`、完全相符的官方 HTTPS 原生路由，且沒有請求覆寫 | 可選擇 Codex                                    | 目錄提供 Luna 時使用 Codex 登入        |
    | `openai/gpt-5.6-sol`     | 提供者/模型 `agentRuntime.id: "openclaw"`                  | OpenClaw 內嵌執行階段、內部 Codex 驗證傳輸 | 選定的 `openai` OAuth 設定檔                    |
    | `openai/gpt-5.5`         | 明確的提供者/模型 `agentRuntime.id`                     | 選定的代理程式執行階段                                   | 選定的 OpenAI 驗證設定檔                       |
    | `openai/*`               | 自行定義的 Completions、自訂或請求覆寫 | OpenClaw 內嵌執行階段                                | 認證資訊需求仍依路由而定      |
    | `openai/*`               | 純文字官方 HTTP 端點                  | 已拒絕                                                 | 不會傳送認證資訊                              |
    | 舊版 Codex GPT-5.5 參照 | 由 doctor 修復                                            | 改寫為 `openai/gpt-5.5`                            | 已遷移的 OpenAI OAuth 設定檔                      |
    | `codex-cli/gpt-5.5`      | 由 doctor 修復                                            | 改寫為 `openai/gpt-5.5`                            | Codex app-server 驗證                              |

    <Warning>
    全新的訂閱支援設定會使用確切的 `openai/gpt-5.6-sol`；原生 Codex 目錄也可能公開確切的 Terra 或 Luna 參照。如果帳戶未提供 GPT-5.6，請明確選取 `openai/gpt-5.5`。較舊的 Codex GPT 參照是 OpenClaw 的舊版路由，並非原生 Codex 執行階段路徑；執行 `openclaw doctor --fix` 可遷移這些參照，而不會升級現有明確選取的 GPT-5.5。`gpt-5.3-codex-spark` 仍僅限 Codex 訂閱目錄有列出該模型的帳戶使用；其直接 OpenAI API 金鑰與 Azure 參照仍會隱藏。
    </Warning>

    <Note>
    新設定應將 OpenAI 代理程式驗證順序放在 `auth.order.openai` 下；doctor 會遷移較舊的舊版 Codex 驗證順序項目。
    </Note>

    ### 設定範例

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    若使用 API 金鑰作為備援，請將所選模型保留在 `openai/*` 下，並將驗證順序放在 `openai` 下。OpenClaw 會先嘗試訂閱，再嘗試 API 金鑰，同時維持使用 Codex 控制框架：

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
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
    引導設定不再從 `~/.codex` 匯入 OAuth 資料。請使用瀏覽器 OAuth（預設）或上述裝置代碼流程登入；OpenClaw 會在自己的代理程式驗證儲存區中管理產生的認證資訊。
    </Note>

    ### 檢查並復原 Codex OAuth 路由

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    若要指定代理程式，請加入 `--agent <id>`：

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    如果較舊的設定仍含有舊版 Codex GPT 參照，或含有未明確設定執行階段的過時 OpenAI 執行階段工作階段釘選，請修復：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai` 未顯示任何可用的設定檔，請重新登入：

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    若同一代理程式中有多個 Codex OAuth 登入，請使用 `--profile-id`，再透過驗證順序或 `/model ...@<profileId>` 控制它們：

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    在依賴設定檔順序前，請執行 `openclaw doctor --fix`，以遷移較舊的舊版 OpenAI Codex 前綴設定檔 ID 與順序項目。

    ### 狀態指示器

    聊天中的 `/status` 會顯示目前工作階段正在使用哪個模型執行階段。當符合資格的隱含路由或明確的提供者／模型執行階段原則選取隨附的 Codex 應用程式伺服器控制框架時，它會顯示為 `Runtime: OpenAI Codex`。

    ### Doctor 警告

    如果設定或工作階段狀態中仍有舊版 Codex 模型參照或過時的 OpenAI 執行階段釘選，除非 OpenClaw 已明確設定，否則 `openclaw doctor --fix` 會將它們改寫為搭配 Codex 執行階段的 `openai/*`。

    ### 上下文視窗上限

    OpenClaw 將模型中繼資料與執行階段上下文上限視為不同的值。對於透過 Codex OAuth 目錄使用的 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`400000`
    - 預設執行階段 `contextTokens` 上限：`272000`

    實務上，較小的預設上限具有更佳的延遲與品質特性。可使用 `contextTokens` 覆寫：

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
    使用 `contextWindow` 宣告原生模型中繼資料。使用 `contextTokens` 限制執行階段上下文預算。對於 `gpt-5.5`，直接 OpenAI API 金鑰路由會回報更大的原生 `contextWindow`（`1000000`）；由於上游目錄不同，這兩條路由會分開追蹤。
    </Note>

    ### 目錄復原

    當上游 Codex 目錄中有 `gpt-5.5` 時，OpenClaw 會使用其目錄中繼資料。如果帳戶已通過驗證，但即時 Codex 探索省略了 `gpt-5.5` 資料列，OpenClaw 會合成該 OAuth 模型資料列，避免排程、子代理程式及已設定的預設模型執行因 `Unknown model` 而失敗。

  </Tab>
</Tabs>

## 原生 Codex 應用程式伺服器驗證

當符合資格的確切官方 HTTPS 路由隱含選取原生 Codex 應用程式伺服器控制框架，或提供者／模型的 `agentRuntime.id: "codex"` 明確選取它時，該控制框架會使用 `openai/*` 模型參照。其驗證仍以帳戶為基礎。OpenClaw 依下列順序選取驗證：

1. 代理程式的已排序 OpenAI 驗證設定檔，最好位於 `auth.order.openai` 下。執行 `openclaw doctor --fix` 可遷移較舊的舊版 Codex 驗證設定檔 ID 與驗證順序。
2. 應用程式伺服器的現有帳戶，例如本機 Codex 命令列介面的 ChatGPT 登入。對於預設的隔離代理程式主目錄，OpenClaw 會透過登入 RPC 將該原生命令列介面帳戶橋接至應用程式伺服器；它不會共用命令列介面的設定、外掛或對話串儲存區。
3. 僅限本機 stdio 應用程式伺服器啟動，且僅在應用程式伺服器回報沒有帳戶時：先使用 `CODEX_API_KEY`，再使用 `OPENAI_API_KEY`。

即使閘道程序也有供直接 OpenAI 模型或嵌入使用的 `OPENAI_API_KEY`，本機 ChatGPT/Codex 訂閱登入也不會因此被取代。環境變數 API 金鑰備援僅適用於本機 stdio 的無帳戶路徑；絕不會透過 WebSocket 應用程式伺服器連線傳送。選取訂閱型 Codex 設定檔時，OpenClaw 也不會將 `CODEX_API_KEY` 與 `OPENAI_API_KEY` 傳入所產生的 stdio 應用程式伺服器子程序，而是透過應用程式伺服器登入 RPC 傳送所選認證資訊。

當該訂閱設定檔因 Codex 使用量限制而受阻時，OpenClaw 會將設定檔標記為受阻，直到 Codex 公告的重設時間，並允許驗證順序輪替至下一個 `openai:*` 設定檔，而不變更所選模型或退出 Codex 控制框架。重設時間一過，該訂閱設定檔即可再次使用。

## 影像生成

隨附的 `openai` 外掛會透過 `image_generate` 工具註冊影像生成功能。它透過相同的 `openai/gpt-image-2` 模型參照，同時支援 OpenAI API 金鑰與 Codex OAuth 影像生成。

| 功能                      | OpenAI API 金鑰                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型參照                  | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 驗證                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登入              |
| 傳輸方式                  | OpenAI Images API                  | Codex Responses 後端                 |
| 每次要求的影像數量上限    | 4                                  | 4                                    |
| 編輯模式                  | 已啟用（最多 5 張參考影像）         | 已啟用（最多 5 張參考影像）           |
| 尺寸覆寫                  | 支援，包括 2K/4K 尺寸               | 支援，包括 2K/4K 尺寸                 |
| 長寬比／解析度            | 不轉送至 OpenAI Images API         | 可安全對應時，對應至支援的尺寸         |

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
請參閱[影像生成](/zh-TW/tools/image-generation)，瞭解共用工具參數、提供者選取及容錯移轉行為。
</Note>

`gpt-image-2` 是 OpenAI 文字轉影像生成與影像編輯的預設模型。`gpt-image-1.5`、`gpt-image-1` 及 `gpt-image-1-mini` 仍可作為明確的模型覆寫使用。若要輸出透明背景的 PNG/WebP，請使用 `openai/gpt-image-1.5`；目前的 `gpt-image-2` API 會拒絕 `background: "transparent"`。

若要提出透明背景要求，請呼叫 `image_generate`，並使用 `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及 `background: "transparent"`；較舊的 `openai.background` 提供者選項仍會接受。OpenClaw 也會將預設 `openai/gpt-image-2` 的透明要求改寫為 `gpt-image-1.5`，藉此保護公開 OpenAI 與 OpenAI Codex OAuth 路由；Azure 與自訂 OpenAI 相容端點則會保留其設定的部署／模型名稱。

相同設定也提供給無介面命令列介面執行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "透明背景上的簡潔紅色圓形貼紙" \
  --json
```

從輸入檔案開始時，請對 `openclaw infer image edit` 使用相同的 `--output-format` 與 `--background` 旗標。`--openai-background` 仍可作為 OpenAI 專用別名使用。使用 `--quality low|medium|high|auto` 控制 OpenAI Images 的品質與成本。使用 `--openai-moderation low|auto`，從 `image generate` 或 `image edit` 傳遞 OpenAI 的內容審核提示。

對於 ChatGPT/Codex OAuth 安裝，請保留相同的 `openai/gpt-image-2` 參照。設定 `openai` OAuth 設定檔後，OpenClaw 會解析該已儲存的 OAuth 存取權杖，並透過 Codex Responses 後端傳送影像要求；它不會先嘗試 `OPENAI_API_KEY`，也不會悄悄備援至 API 金鑰。若要改用直接 OpenAI Images API 路由，請使用 API 金鑰、自訂基底 URL 或 Azure 端點明確設定 `models.providers.openai`。如果該自訂影像端點位於受信任的區域網路／私人位址，也請設定 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非存在這項選擇性啟用設定，否則 OpenClaw 會持續封鎖私人／內部 OpenAI 相容影像端點。

生成：

```
/tool image_generate model=openai/gpt-image-2 prompt="適用於 macOS 上 OpenClaw 的精緻上市海報" size=3840x2160 count=1
```

生成透明 PNG：

```
/tool image_generate model=openai/gpt-image-1.5 prompt="透明背景上的簡潔紅色圓形貼紙" outputFormat=png background=transparent
```

編輯：

```
/tool image_generate model=openai/gpt-image-2 prompt="保留物件形狀，將材質變更為半透明玻璃" image=/path/to/reference.png size=1024x1536
```

## 影片生成

隨附的 `openai` 外掛會透過 `video_generate` 工具註冊影片生成功能。

| 功能             | 值                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------- |
| 預設模型         | `openai/sora-2`                                                                    |
| 模式             | 文字轉影片、影像轉影片、單一影片編輯                                               |
| 參考輸入         | 1 張影像或 1 部影片                                                                |
| 尺寸覆寫         | 支援文字轉影片與影像轉影片                                                         |
| 長寬比           | 轉換為最接近的支援尺寸，不會直接轉送原始值                                         |
| 其他覆寫         | 不支援 `resolution`、`audio`、`watermark`，且會捨棄並顯示工具警告                  |

OpenAI 影像轉影片要求會使用 `POST /v1/videos`，並將影像放在 `input_reference`。單一影片編輯會使用 `POST /v1/videos/edits`，並將上傳的影片放在 `video` 欄位中。

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

OpenAI 供應商宣告了 `supportsSize`，但未宣告 `supportsAspectRatio` 或
`supportsResolution`。OpenClaw 的共用正規化層會在要求送達供應商之前，將請求的
`aspectRatio` 轉換為最接近的 OpenAI `size`，因此長寬比請求通常仍可運作。
`resolution` 沒有尺寸備援機制，因此會被捨棄，並向呼叫端顯示
`Ignored unsupported overrides for openai/<model>: resolution=<value>`。
</Note>

## GPT-5 提示詞貢獻

OpenClaw 會為 `openai` 供應商上的 GPT-5 系列模型加入共用 GPT-5 提示詞貢獻
（包括修復前的舊版 Codex 參照，這些參照會正規化為 `openai/*`）。其他同樣提供
GPT-5 系列模型 ID 的供應商（例如 OpenRouter 或 opencode 路由）不會收到此疊加層；
其判定依據是供應商 ID `openai`，而非僅依據模型 ID。較舊的 GPT-4.x 模型絕不會
收到此貢獻。

原生 Codex app-server 測試框架不會透過開發者指示收到角色／工具紀律行為合約，
也不會收到友善互動風格疊加層；原生 Codex 會保留由 Codex 擁有的基礎、模型與
專案文件行為，而 OpenClaw 會針對原生執行緒停用 Codex 內建的人格設定，讓代理程式
工作區的人格檔案維持權威性。OpenClaw 只會向原生 Codex 執行緒提供執行階段情境：
頻道傳遞、OpenClaw 動態工具、ACP 委派、工作區情境與 OpenClaw Skills。同一貢獻中
的心跳偵測指引文字是唯一例外：原生 Codex 的心跳偵測回合會取得該文字，但會以
專用協作指示注入，而非透過共用提示詞貢獻鉤子。

GPT-5 貢獻會針對符合條件、由 OpenClaw 組裝的提示詞，加入帶有標籤的行為合約，
涵蓋人格持續性、執行安全、工具紀律、輸出形式、完成檢查與驗證。頻道特定的回覆與
靜默訊息行為仍保留在共用 OpenClaw 系統提示詞與對外傳遞政策中。友善互動風格層
是獨立且可設定的。

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
  <Tab title="命令列介面">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
執行階段的值不區分大小寫，因此 `"Off"` 與 `"off"` 都會停用友善風格層。
</Tip>

<Note>
當共用的 `agents.defaults.promptOverlays.gpt5.personality` 設定未設定時，仍會讀取
舊版 `plugins.entries.openai.config.personality` 作為相容性備援。
</Note>

## 語音與話音

<AccordionGroup>
  <Accordion title="語音合成 (TTS)">
    隨附的 `openai` 外掛會為 `messages.tts` 介面註冊語音合成功能。

    | 設定          | 設定路徑                                              | 預設值                                 |
    | ------------- | ----------------------------------------------------- | -------------------------------------- |
    | 模型          | `messages.tts.providers.openai.model`                 | `gpt-4o-mini-tts`                      |
    | 語音          | `messages.tts.providers.openai.speakerVoice`          | `coral`                                |
    | 速度          | `messages.tts.providers.openai.speed`                 | （未設定）                             |
    | 指示          | `messages.tts.providers.openai.instructions`          | （未設定，僅限 `gpt-4o-mini-tts`）     |
    | 格式          | `messages.tts.providers.openai.responseFormat`        | 語音留言使用 `opus`，檔案使用 `mp3`   |
    | API 金鑰      | `messages.tts.providers.openai.apiKey`                | 備援至 `OPENAI_API_KEY`                |
    | 基礎 URL      | `messages.tts.providers.openai.baseUrl`               | `https://api.openai.com/v1`            |
    | 額外主體      | `messages.tts.providers.openai.extraBody` / `extra_body` | （未設定）                          |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用語音：
    `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、
    `marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 會在 OpenClaw 生成的欄位之後合併至 `/audio/speech` 請求 JSON，
    因此可用於需要 `lang` 等額外索引鍵的 OpenAI 相容端點。原型鏈索引鍵會被忽略。

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
    設定 `OPENAI_TTS_BASE_URL`，即可覆寫 TTS 基礎 URL，而不影響聊天 API 端點。
    OpenAI TTS 與 Realtime 語音都透過 OpenAI Platform API 金鑰設定；僅使用 OAuth
    的安裝仍可使用由 Codex 支援的聊天模型，但無法使用 OpenAI 即時語音回應。
    </Note>

  </Accordion>

  <Accordion title="語音轉文字">
    隨附的 `openai` 外掛會透過 OpenClaw 的媒體理解轉錄介面註冊批次語音轉文字功能。

    - 預設模型：`gpt-4o-transcribe`
    - 端點：OpenAI REST `/v1/audio/transcriptions`
    - 輸入路徑：多部分音訊檔案上傳
    - 用於所有讀取 `tools.media.audio` 的傳入音訊轉錄，包括 Discord 語音頻道片段與頻道音訊附件

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

    若共用音訊媒體設定或個別呼叫的轉錄請求提供了語言與提示詞提示，系統會將其轉送至 OpenAI。

  </Accordion>

  <Accordion title="即時轉錄">
    隨附的 `openai` 外掛會為 Voice Call 外掛註冊即時轉錄功能。

    | 設定          | 設定路徑                                                          | 預設值 |
    | ------------- | ----------------------------------------------------------------- | ------ |
    | 模型          | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 語言          | `...openai.language`                                              | （未設定） |
    | 提示詞        | `...openai.prompt`                                                | （未設定） |
    | 靜默持續時間  | `...openai.silenceDurationMs`                                     | `800` |
    | VAD 閾值      | `...openai.vadThreshold`                                          | `0.5` |
    | 驗證          | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai` API 金鑰設定檔   | 需要 Platform API 金鑰 |

    <Note>
    使用 WebSocket 連線至 `wss://api.openai.com/v1/realtime`，並採用 G.711 u-law
    （`g711_ulaw` / `audio/pcmu`）音訊。若使用 `openai` API 金鑰設定檔，閘道會在
    開啟 WebSocket 前產生臨時 Realtime 轉錄用戶端密鑰。此串流供應商用於 Voice Call
    的即時轉錄路徑；Discord 語音目前會錄製短片段，並改用批次
    `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="即時語音">
    隨附的 `openai` 外掛會為 Voice Call 外掛註冊即時語音功能。

    | 設定                                  | 設定路徑                                                              | 預設值                        |
    | ------------------------------------- | --------------------------------------------------------------------- | ----------------------------- |
    | 模型                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`   | `gpt-realtime-2.1`            |
    | 語音                                  | `...openai.voice`                                                     | `alloy`                       |
    | 溫度（Azure 部署橋接）                | `...openai.temperature`                                               | `0.8`                         |
    | VAD 閾值                              | `...openai.vadThreshold`                                              | `0.5`                         |
    | 靜默持續時間                          | `...openai.silenceDurationMs`                                         | `500`                         |
    | 前置填補                              | `...openai.prefixPaddingMs`                                           | `300`                         |
    | 推理強度                              | `...openai.reasoningEffort`                                           | （未設定）                    |
    | 驗證                                  | `openai` API 金鑰設定檔、`...openai.apiKey` 或 `OPENAI_API_KEY`       | 需要 OpenAI Platform API 金鑰 |

    `gpt-realtime-2.1` 可用的內建 Realtime 語音：`alloy`、`ash`、
    `ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI 建議使用 `marin` 與 `cedar`，以取得最佳 Realtime 品質。這與上述的文字轉語音
    語音是不同的集合；僅限 TTS 的語音（例如 `fable`、`nova` 或 `onyx`）不適用於
    Realtime 工作階段。若偏好較小且成本較低的 Realtime 2.1 變體，請將模型明確設定為
    `gpt-realtime-2.1-mini`。

    <Note>
    **GPT-Live（即將推出）。** OpenAI 的全雙工 `gpt-live-1` 與
    `gpt-live-1-mini` 模型已於 2026 年 7 月取代 ChatGPT 語音模式；開發者 API
    正逐步向搶先體驗組織推出。OpenClaw 可辨識此模型系列，但尚未執行它：
    GPT-Live 工作階段僅支援 WebRTC、自行管理輪流發言（不使用 VAD），並透過
    OpenClaw 即時傳輸目前尚未實作的移交事件協定委派代理程式工作。設定
    `gpt-live-*` 模型時會採取封閉式失敗，並針對 WebSocket 橋接與 Talk 瀏覽器
    工作階段提供指引，而不會在代理程式無法存取的情況下靜默連接音訊。
    搶先體驗期間，API 存取權也會依 OpenAI 組織分別控管。在 GPT-Live 支援推出前，
    請繼續使用 `gpt-realtime-2.1`（預設值）。
    </Note>

    <Note>
    後端 OpenAI 即時橋接使用正式版 Realtime WebSocket 工作階段格式，該格式不接受
    `session.temperature`。Azure OpenAI 部署仍可透過 `azureEndpoint` 與
    `azureDeployment` 使用，並保留與部署相容的工作階段格式（包括 `temperature`）。
    支援雙向工具呼叫與 G.711 u-law 音訊。
    </Note>

    <Note>
    即時語音會在建立工作階段時選定。OpenAI 允許稍後變更大多數工作階段欄位，但在
    模型已於該工作階段輸出音訊後，便無法變更語音。OpenClaw 目前以字串形式公開
    內建 Realtime 語音 ID。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 瀏覽器即時工作階段，搭配由閘道
    簽發的暫時性用戶端密鑰，並由瀏覽器直接透過 WebRTC SDP 與
    OpenAI Realtime API 交換資料。閘道會使用所選的 `openai`
    認證資訊簽發該用戶端密鑰。已設定的金鑰、API 金鑰設定檔及
    `OPENAI_API_KEY` 具有優先權；`openai` OAuth 設定檔或外部
    Codex 登入則作為備援。閘道轉送與 Voice Call 後端即時
    WebSocket 橋接器對原生 OpenAI 端點採用相同的認證資訊順序。
    維護者可使用
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    進行即時驗證；OpenAI 測試流程會驗證後端 WebSocket 橋接器及瀏覽器
    WebRTC SDP 交換，且不會記錄密鑰。
    傳入 `--openai-only`，即可在沒有 Google 認證資訊的情況下執行這兩項測試流程。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端點

隨附的 `openai` 提供者可透過覆寫基礎 URL，將影像
生成導向 Azure OpenAI 資源。在影像生成路徑上，OpenClaw
會偵測 `models.providers.openai.baseUrl` 中的 Azure 主機名稱，並自動切換為
Azure 的要求格式。

<Note>
即時語音使用獨立的設定路徑
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），
不受 `models.providers.openai.baseUrl` 影響。其 Azure
設定請參閱[語音與語音輸出](#voice-and-speech)下的**即時
語音**摺疊區段。
</Note>

適合使用 Azure OpenAI 的情況：

- 你已有 Azure OpenAI 訂閱、配額或企業
  合約
- 你需要 Azure 提供的區域資料落地或合規控制
- 你希望流量維持在現有的 Azure 租用戶內

### 設定

若要透過隨附的 `openai` 提供者使用 Azure 影像生成，請將
`models.providers.openai.baseUrl` 指向你的 Azure 資源，並將 `apiKey` 設為
Azure OpenAI 金鑰（而非 OpenAI Platform 金鑰）：

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

OpenClaw 會辨識下列 Azure 主機尾碼，並將其用於 Azure 影像生成
路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

針對已辨識 Azure 主機上的影像生成要求，OpenClaw 會：

- 傳送 `api-key` 標頭，而非 `Authorization: Bearer`
- 使用部署範圍路徑（`/openai/deployments/{deployment}/...`）
- 在每個要求後附加 `?api-version=...`
- 對 Azure 影像生成呼叫使用 600s 的預設要求逾時。
  每次呼叫的 `timeoutMs` 值仍會覆寫此預設值。

其他基礎 URL（公開 OpenAI、OpenAI 相容代理）會維持標準
OpenAI 影像要求格式。

<Note>
`openai` 提供者影像生成路徑的 Azure 路由需要
OpenClaw 2026.4.22 或更新版本。更早的版本會將任何自訂
`openai.baseUrl` 視為公開 OpenAI 端點，因而無法搭配 Azure 影像
部署運作。
</Note>

### API 版本

設定 `AZURE_OPENAI_API_VERSION`，即可為 Azure 影像生成路徑固定使用特定的 Azure 預覽版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未設定此變數時，預設值為 `2024-12-01-preview`。

### 模型名稱即部署名稱

Azure OpenAI 會將模型繫結至部署。對於透過隨附的 `openai` 提供者
路由的 Azure 影像生成要求，OpenClaw 中的 `model` 欄位
必須是你在 Azure 入口網站設定的 **Azure 部署名稱**，而非
公開 OpenAI 模型 ID。

如果你建立名為 `gpt-image-2-prod`、提供 `gpt-image-2` 的部署：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="簡潔的海報" size=1024x1024 count=1
```

相同的部署名稱規則適用於透過隨附的 `openai` 提供者
路由的所有影像生成呼叫。

### 區域可用性

Azure 影像生成目前僅在部分區域提供
（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。建立部署前，請查看 Microsoft 目前的區域清單，
並確認你的區域有提供特定模型。

### 參數差異

Azure OpenAI 與公開 OpenAI 不一定接受相同的影像參數。
Azure 可能會拒絕公開 OpenAI 允許的選項（例如 `gpt-image-2` 的某些
`background` 值），或僅在特定模型
版本上提供這些選項。這些差異源自 Azure 及底層模型，而非
OpenClaw。若 Azure 要求因驗證錯誤而失敗，請在
Azure 入口網站中檢查你的特定部署與 API 版本支援的參數集。

<Note>
Azure OpenAI 使用原生傳輸與相容行為，但不會收到
OpenClaw 的隱藏歸因標頭——請參閱[進階設定](#advanced-configuration)下的**原生與 OpenAI 相容
路由**摺疊區段。

若要在 Azure 上使用聊天或 Responses 流量（影像生成以外），請使用
新手引導流程或專用的 Azure 提供者設定；僅設定 `openai.baseUrl`
不會套用 Azure API／驗證格式。另有獨立的
`azure-openai-responses/*` 提供者；請參閱下方的伺服器端壓縮
摺疊區段。
</Note>

## 進階設定

下方的個別模型 `params` 範例會調整 OpenClaw 內嵌提供者
要求。設定這些參數屬於明確編寫的要求行為，因此原本符合資格的
`auto` 路由會繼續使用 OpenClaw，而不會隱含選取 Codex。原生
Codex app-server 控制框架擁有自己的傳輸與要求設定；當有效路由未宣告為
Codex 相容時，明確設定 `agentRuntime.id: "codex"` 會採取封閉式失敗。

<AccordionGroup>
  <Accordion title="傳輸（WebSocket 與 SSE）">
    OpenClaw 對 `openai/*` 優先使用 WebSocket，並以 SSE 作為備援（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw 會：
    - 在切換至 SSE 備援前，重試一次早期 WebSocket 失敗
    - 發生失敗後，將 WebSocket 標記為降級 60 秒，並在冷卻期間使用 SSE
    - 為重試與重新連線附加穩定的工作階段及回合識別標頭
    - 在不同傳輸方式間正規化用量計數器（`input_tokens` / `prompt_tokens`）

    | 值                     | 行為                                 |
    | ---------------------- | ------------------------------------ |
    | `"auto"`（預設）       | WebSocket 優先，SSE 備援             |
    | `"sse"`                | 強制僅使用 SSE                       |
    | `"websocket"`          | 強制僅使用 WebSocket                 |

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
    - [搭配 WebSocket 使用 Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [串流 API 回應（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="快速模式">
    OpenClaw 為 `openai/*` 提供共用的快速模式切換：

    - **聊天／UI：** `/fast status|auto|on|off`
    - **設定：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    啟用後，OpenClaw 會將快速模式對應至 OpenAI 優先處理
    （`service_tier = "priority"`）。現有的 `service_tier` 值會
    保留，且快速模式不會重寫 `reasoning` 或
    `text.verbosity`。`fastMode: "auto"` 會讓新的模型呼叫維持快速模式，直到
    自動截止時間為止；之後啟動的重試、備援、工具結果或
    接續呼叫則不使用快速模式。截止時間預設為 60 秒；
    可在使用中的模型上設定 `params.fastAutoOnSeconds` 以變更此值。

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
    工作階段覆寫的優先權高於設定。在 Sessions UI 中清除工作階段覆寫，
    即可讓工作階段恢復為已設定的預設值。
    </Note>

  </Accordion>

  <Accordion title="優先處理（service_tier）">
    OpenAI API 透過 `service_tier` 提供優先處理。請在 OpenClaw 中為各模型設定：

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
    `serviceTier` 只會轉送至原生 OpenAI 端點
    （`api.openai.com`）及原生 Codex 端點（`chatgpt.com/backend-api`）。
    如果你透過代理路由任一提供者，OpenClaw 會讓
    `service_tier` 保持不變。
    </Warning>

  </Accordion>

  <Accordion title="伺服器端壓縮（Responses API）">
    對於直接使用 OpenAI Responses 的模型（`api.openai.com` 上的 `openai/*`），
    OpenAI 外掛的 OpenClaw 串流包裝器會自動啟用伺服器端
    壓縮：

    - 強制使用 `store: true`（除非模型相容設定指定 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 預設 `compact_threshold`：`contextWindow` 的 70%（無法取得時則為 `80000`）

    這適用於內建的 OpenClaw 執行階段路徑，以及內嵌執行所使用的 OpenAI 提供者
    鉤子。原生 Codex app-server 控制框架會透過 Codex 管理
    自己的內容，不受此設定影響。

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
    `responsesServerCompaction` 只控制 `context_management` 注入。
    直接使用 OpenAI Responses 的模型仍會強制使用 `store: true`，除非相容設定
    指定 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="嚴格代理式 GPT 模式">
    對於透過 OpenClaw 內嵌執行階段執行的 `openai` 提供者 GPT-5 系列模型，
    OpenClaw 已預設採用稱為
    `strict-agentic` 的更嚴格執行合約。只要解析後的提供者為
    `openai`，且模型 ID 符合 GPT-5 系列，就會自動啟用，除非設定
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

    在支援的執行路徑上明確設定 `"strict-agentic"` 不會產生任何變化（它
    已是預設值），在不支援的提供者／模型組合上則不會生效。

    啟用 `strict-agentic` 後，OpenClaw 會：
    - 對實質工作自動啟用 `update_plan`
    - 若回合結構為空或只有推理內容，會透過可見答案的接續回合重試
    - 當所選控制框架提供明確的計畫事件時，使用這些事件

    OpenClaw 不會對助理文字進行分類，以判斷某個輪次是
    計畫、進度更新或最終答案。

    <Note>
    此契約完全存在於 OpenClaw 的內嵌代理執行器中。它不適用於
    原生 Codex app-server 框架，後者會自行管理輪次與計畫行為；
    對原生 Codex 執行而言，框架選擇比執行契約設定更重要。
    </Note>

  </Accordion>

  <Accordion title="原生路由與 OpenAI 相容路由">
    OpenClaw 對直接 OpenAI、Codex 與 Azure OpenAI 端點的處理方式，
    不同於一般 OpenAI 相容的 `/v1` 代理：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 僅對支援 OpenAI `none` 推理強度的模型保留
      `reasoning: { effort: "none" }`
    - 對會拒絕 `reasoning.effort: "none"` 的模型或代理，
      省略已停用的推理設定
    - 工具結構描述預設使用嚴格模式
    - 僅在經驗證的原生主機上附加隱藏的出處標頭（Azure
      OpenAI 即使屬於原生路由，也不會收到這些標頭）
    - 保留僅適用於 OpenAI 的請求調整（`service_tier`、`store`、
      推理相容性、提示快取提示）

    **代理／相容路由：**
    - 使用較寬鬆的相容性行為
    - 從非原生 `openai-completions` 承載資料中移除 Completions `store`
    - 接受進階 `params.extra_body`／`params.extraBody` 傳遞 JSON，
      供 OpenAI 相容的 Completions 代理使用
    - 接受 `params.chat_template_kwargs`，供 vLLM 等 OpenAI 相容的
      Completions 代理使用
    - 不強制使用嚴格工具結構描述或僅限原生路由的標頭

  </Accordion>
</AccordionGroup>

## 相關內容

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
    驗證詳細資訊與認證資訊重複使用規則。
  </Card>
</CardGroup>
