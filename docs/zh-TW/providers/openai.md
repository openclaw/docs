---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 訂閱驗證，而不是 API 金鑰
    - 你需要更嚴格的 GPT-5 代理程式執行行為
summary: 在 OpenClaw 中透過 API 金鑰或 Codex 訂閱使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-07-19T14:02:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f06ea8a31ac079232090f34232d520677afdf08d5ef5525b908229d2bce90bfd
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw 使用單一提供者 ID `openai`，同時支援直接 API 金鑰驗證與
ChatGPT/Codex 訂閱驗證。`openai/*` 是標準模型路由。
對於執行階段原則未設定或為 `auto` 的嵌入式代理程式回合，OpenAI 的路由
資訊會決定 OpenClaw 是否可隱式選取隨附的 Codex app-server 執行階段。
僅有 `openai/*` 前綴不會選取執行階段。

- **代理程式模型** - 透過明確的
  `agentRuntime` 設定或 OpenAI 隱式路由原則所選取的執行階段使用 `openai/*`。若要使用 ChatGPT/Codex 訂閱，請以 Codex
  驗證登入；若要採用金鑰計費，請設定 API 金鑰驗證
  設定檔。
- **非代理程式 OpenAI API** - 透過 `OPENAI_API_KEY` 或 `openai` API 金鑰驗證設定檔，
  直接存取按使用量計費的 OpenAI Platform。
- **舊版設定** - `openclaw doctor --fix` 會將 `codex/*` 與 `openai-codex/*` 參照修復為
  `openai/*`，並加入模型範圍的 `agentRuntime.id: "codex"`。

OpenAI 明確支援在 OpenClaw 等外部工具與工作流程中使用訂閱 OAuth。

## 使用量與成本追蹤

OpenClaw 會分開處理訂閱配額與 Platform API 計費：

- ChatGPT/Codex OAuth 會顯示訂閱方案、配額期間與點數餘額。
- `OPENAI_ADMIN_KEY` 會在 Control UI 的 **使用量** 中顯示提供者回報的 30 天組織成本與 completions 使用量，包括每日支出、請求／權杖總數、熱門模型及成本類別。
- `OPENAI_PROJECT_ID` 可選擇性地將 Admin API 歷程記錄限定於單一專案。
- OpenClaw 絕不會將 `OPENAI_API_KEY` 或 `openai` 推論設定檔傳送至組織 API；這些認證資訊可能屬於自訂、Azure 或代理程式本機端點。

明確的 Admin 金鑰優先於 OAuth。提供者回報的歷程記錄不會與 OpenClaw 根據工作階段推算的預估成本合併；其中可能包含其他用戶端的 API 活動及提供者端的帳務調整。

OpenAI 的 [API 使用量儀表板](https://help.openai.com/en/articles/10478918)文件說明了存取使用量資料所需的組織擁有者身分，以及明確的 Usage Dashboard 權限要求。

提供者、模型、執行階段與管道是不同層級。如果這些標籤
混淆在一起，請先閱讀[代理程式執行階段](/zh-TW/concepts/agent-runtimes)，再
變更設定。

## 快速選擇

| 目標                                              | 使用                                                                | 備註                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| ChatGPT/Codex 訂閱、原生 Codex 執行階段  | `openai/gpt-5.6-sol`                                               | 全新訂閱設定；使用 Codex 驗證登入。                  |
| 代理程式回合採用直接 API 金鑰計費            | `openai/gpt-5.6` 加上排序過的 API 金鑰驗證設定檔              | 全新 API 金鑰設定；不含限定詞的直接 API ID 會解析為 Sol。        |
| 選擇確切的 GPT-5.6 層級                      | `openai/gpt-5.6-sol`、`-terra` 或 `-luna`                         | 查看 `models list`，確認此帳戶可用的層級。        |
| 無法存取 GPT-5.6 的帳戶                    | `openai/gpt-5.5`                                                   | 明確的復原選擇；OpenClaw 不會靜默降級。     |
| 直接 API 金鑰計費、明確指定 OpenClaw 執行階段 | `openai/gpt-5.6` 加上提供者／模型 `agentRuntime.id: "openclaw"` | 選取一般的 `openai` API 金鑰設定檔。                           |
| 最新的 ChatGPT Instant 模型別名                | `openai/chat-latest`                                               | 僅限直接 API 金鑰；此為浮動別名，並非穩定預設值。          |
| 產生或編輯影像                       | `openai/gpt-image-2`                                               | 可搭配 `OPENAI_API_KEY` 或 Codex OAuth 使用。                         |
| 透明背景影像                     | `openai/gpt-image-1.5`                                             | 將 `outputFormat` 設為 `png` 或 `webp`，並設定 `background=transparent`。 |

## 名稱對照表

| 顯示的名稱                            | 層級             | 意義                                                                                  |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | 提供者前綴   | 標準 OpenAI 模型路由；路由資訊決定隱式執行階段。                |
| `codex` 外掛                          | 外掛            | 提供原生 Codex app-server 執行階段及 `/codex` 聊天控制項的隨附外掛。 |
| 提供者／模型 `agentRuntime.id: codex` | 代理程式執行階段     | 對相符的嵌入式回合強制使用原生 Codex app-server 控制框架。                   |
| `/codex ...`                            | 聊天命令集  | 從對話中繫結／控制 Codex app-server 執行緒。                               |
| `runtime: "acp", agentId: "codex"`      | ACP 工作階段路由 | 透過 ACP/acpx 執行 Codex 的明確備援路徑。                                 |

## 隱式代理程式執行階段

當提供者／模型 `agentRuntime` 原則未設定或為 `auto` 時，OpenAI
由提供者擁有的路由原則會依據有效
端點與配接器選擇隱式執行階段：

| 有效路由資訊                                                                                                                                                  | 隱式執行階段      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 使用 `openai-responses` 的確切官方 Platform HTTPS 端點，或使用 `openai-chatgpt-responses` 的確切官方 ChatGPT HTTPS 端點；沒有自行設定的請求覆寫 | 可選取 Codex |
| 自行設定的 `openai-completions` 配接器                                                                                                                                  | OpenClaw              |
| 自訂端點                                                                                                                                                        | OpenClaw              |
| 明確使用 HTTP 的確切官方端點                                                                                                                            | 拒絕              |
| 包含自行設定之提供者／模型請求覆寫的路由                                                                                                                 | OpenClaw              |

明確且非預設的提供者／模型 `agentRuntime.id` 仍具有最終決定權。
例如，`agentRuntime.id: "openclaw"` 會讓原本符合 Codex 資格的
路由繼續使用 OpenClaw，而 `agentRuntime.id: "codex"` 則要求使用 Codex，且當有效路由未宣告與 Codex 相容時
採取封閉式失敗。
執行階段選擇不會變更認證資訊類型或計費方式：Platform API 金鑰
驗證與 ChatGPT/Codex 訂閱驗證仍彼此分離。

`openclaw doctor --fix` 會將舊版 `codex/*` 與 `openai-codex/*` 模型
參照、舊版 Codex 驗證設定檔 ID，以及舊版 Codex 驗證順序項目遷移至
標準 `openai` 路由。遷移後的模型參照會取得模型範圍的
`agentRuntime.id: "codex"`；新的驗證順序設定請使用 `auth.order.openai`。

<Note>
只有在未設定主要模型時，全新的 OpenAI 設定才會套用 GPT-5.6 主要模型。
新增或重新整理 OpenAI 驗證會保留現有的明確
選擇，包括 `openai/gpt-5.5`，除非你明確使用
`models auth login --set-default` 或 `models set`。只有當你希望代理程式模型使用 API 金鑰驗證時，
才使用 API 金鑰驗證設定檔。
</Note>

## GPT-5.6 限量預覽

OpenClaw 可辨識確切的 `openai/gpt-5.6-sol`、
`openai/gpt-5.6-terra` 與 `openai/gpt-5.6-luna` 模型 ID。目前的目錄中，三者皆提供
`xhigh` 與 `max` 推理。OpenAI 將 Sol 描述為旗艦層級、Terra 為均衡層級，而 Luna 則為快速、
低成本層級。請參閱
[GPT-5.6 發表公告](https://openai.com/index/previewing-gpt-5-6-sol/)
及[存取指南](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna)。

使用直接 OpenAI API 金鑰驗證時，不含限定詞的 `openai/gpt-5.6` ID 是 Sol 的別名，
也是全新設定的預設值。原生 Codex 目錄不會在用戶端套用該直接 API 別名；依工作區存取權限而定，其中可能會顯示
確切的 Sol、Terra 與 Luna ID。因此，全新的 ChatGPT/Codex OAuth 設定
會使用 `openai/gpt-5.6-sol`。使用下列命令查看目前帳戶：

```bash
openclaw models list --provider openai
```

API 組織與 Codex 工作區的存取權限可能不同。如果 GPT-5.6
無法使用，請明確選取 GPT-5.5：

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw 會顯示上游存取錯誤，且不會靜默地將
GPT-5.6 選擇替換為 GPT-5.5。

<Note>
當執行階段原則未設定或為 `auto` 時，符合資格的確切官方 HTTPS 路由可能會選取隨附的 Codex app-server
外掛；自行設定的 Completions 路由、
自訂端點及請求傳輸覆寫仍會使用 OpenClaw。純文字
官方 HTTP 端點會遭到拒絕。明確的提供者／模型執行階段設定仍
具有最終決定權。執行 `openclaw doctor --fix`，以修復過時的舊版 Codex 模型
參照、`codex-cli/*` 參照，或並非由
明確執行階段設定所設置的舊執行階段工作階段固定項目。
</Note>

## OpenClaw 功能涵蓋範圍

| OpenAI 功能         | OpenClaw 介面                                                                              | 狀態                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 聊天 / Responses          | `openai/<model>` 模型供應商                                                               | 是                                                             |
| Codex 訂閱模型 | 搭配 OpenAI OAuth 的 `openai/<model>`                                                            | 是                                                             |
| 舊版 Codex 模型參照   | 舊版 Codex 模型參照、`codex-cli/<model>`                                                     | 由 doctor 修復為 `openai/<model>`                          |
| Codex app-server 執行框架  | 執行階段未設定 / `auto` 的 Codex 相容 HTTPS 路由，或明確指定 `agentRuntime.id: codex`  | 是                                                             |
| 伺服器端網頁搜尋    | 原生 OpenAI Responses 工具                                                                  | 是，前提是已啟用網頁搜尋且未固定其他供應商 |
| 圖片                    | `image_generate`                                                                              | 是                                                             |
| 影片                    | `video_generate`                                                                              | 是                                                             |
| 文字轉語音            | `messages.tts.provider: "openai"` / `tts`                                                     | 是                                                             |
| 批次語音轉文字      | `tools.media.audio` / 媒體理解                                                     | 是                                                             |
| 串流語音轉文字  | 語音通話 `streaming.provider: "openai"`                                                     | 是                                                             |
| 即時語音            | 語音通話 `realtime.provider: "openai"` / 控制介面通話 `talk.realtime.provider: "openai"` | 是（OpenAI Platform API 金鑰）                                   |
| 嵌入                | 記憶嵌入供應商                                                                     | 是                                                             |

<Note>
OpenAI 即時語音會透過公開的 **OpenAI Platform Realtime
API**，且需要 Platform API 金鑰。Codex OAuth 權杖則用於驗證
ChatGPT Codex 後端；兩者無法互相替代，Codex OAuth 權杖不能作為公開 Realtime 端點的 Platform API
金鑰。

若使用 API 金鑰驗證時回報缺少帳務額度，請至
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
為支援你的即時認證資訊所屬組織儲值 Platform 額度。
即時語音接受由 `openclaw onboard --auth-choice openai-api-key` 建立的 `openai` API 金鑰驗證設定檔、
透過 `talk.realtime.providers.openai.apiKey` 為控制介面通話設定的 Platform API 金鑰、
用於語音通話的 `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`，
或 `OPENAI_API_KEY` 環境變數。

在控制介面視訊通話中，OpenAI WebRTC 會視需要接收攝影機情境：
當模型呼叫 `describe_view` 時，瀏覽器會透過即時資料通道傳送一張有大小限制的 JPEG。
OpenClaw 不會將連續的攝影機軌道附加至 OpenAI 工作階段。
</Note>

## 記憶嵌入

OpenClaw 可使用 OpenAI 或 OpenAI 相容的嵌入端點，
為 `memory_search` 建立索引及查詢嵌入：

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

若 OpenAI 相容端點需要非對稱嵌入標籤，請在 `memorySearch` 下設定
`queryInputType` 與 `documentInputType`。OpenClaw
會將這些值作為供應商特定的 `input_type` 請求欄位轉送：查詢
嵌入使用 `queryInputType`；已建立索引的記憶區塊與批次索引則使用
`documentInputType`。完整範例請參閱
[記憶體設定參考](/zh-TW/reference/memory-config#provider-specific-config)。

## 開始使用

<Tabs>
  <Tab title="API 金鑰（OpenAI Platform）">
    **最適合：**直接存取 API 並依用量計費。

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

    | 模型參照        | 執行階段原則或路由資訊                                 | 路由                     | 驗證                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | 未設定 / `auto`、完全相符的官方 HTTPS 原生路由、無請求覆寫 | 可選用 Codex     | 依序使用 API 金鑰驗證設定檔      |
    | `openai/gpt-5.6` | 供應商 / 模型 `agentRuntime.id: "openclaw"`                  | OpenClaw 內嵌執行階段 | 已選取的 `openai` API 金鑰設定檔 |
    | `openai/gpt-5.5` | 明確指定供應商 / 模型 `agentRuntime.id`                     | 已選取的代理程式執行階段    | 已選取的 OpenAI API 金鑰設定檔   |
    | `openai/*`       | 自訂的 Completions、自訂路由或請求覆寫 | OpenClaw 內嵌執行階段 | 認證資訊類型維持不變 |
    | `openai/*`       | 明文的官方 HTTP 端點                  | 拒絕                 | 不會傳送認證資訊             |

    <Note>
    當執行階段未設定或設為 `auto` 時，只有符合資格且完全相符的官方 HTTPS 原生
    路由才能隱式選取 Codex app-server 執行框架。若要對代理程式模型使用 API 金鑰驗證，
    請建立 `openai` API 金鑰驗證設定檔，並使用
    `auth.order.openai` 排定其順序；`OPENAI_API_KEY` 仍是
    非代理程式 OpenAI API 介面的直接備援。執行 `openclaw doctor --fix` 以遷移較舊的
    舊版 Codex 驗證順序項目。
    </Note>

    ### 設定範例

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    純直接 API 的 `gpt-5.6` ID 會解析為 Sol 層級。如果此 API
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

    `chat-latest` 是會變動的別名。新的 OpenAI API 金鑰設定會改用
    `openai/gpt-5.6`，其純直接 API ID 會解析為 Sol。現有
    明確指定的主要模型（包括 `openai/gpt-5.5`）維持不變。
    `chat-latest` 別名僅接受 `medium` 文字詳盡度；對此模型，
    OpenClaw 會將任何其他要求的詳盡度強制設為 `medium`。

    <Warning>
    OpenClaw **不會**在直接 OpenAI
    API 金鑰路由上提供 `gpt-5.3-codex-spark`。只有當你登入的帳戶有提供時，
    才能透過 Codex 訂閱目錄項目使用。
    </Warning>

  </Tab>

  <Tab title="Codex 訂閱">
    **最適合：**使用你的 ChatGPT/Codex 訂閱，透過原生 Codex
    app-server 執行，而非使用獨立的 API 金鑰。Codex 雲端服務需要
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

        對於無頭環境或不適合回呼的設定，加入 `--device-code`，
        改用 ChatGPT 裝置代碼流程登入，而非 localhost 瀏覽器
        回呼：

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="使用標準 OpenAI 模型路由">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        此完全相符的官方 HTTPS 原生路由不需要執行階段設定。
        它可以自動選取 Codex app-server 執行階段，且選用該執行階段時，
        OpenClaw 會安裝或修復內建的 Codex 外掛。
      </Step>
      <Step title="確認 Codex 驗證可用">
        ```bash
        openclaw models list --provider openai
        ```

        閘道開始執行後，請在聊天中傳送 `/codex status` 或 `/codex models`，
        以確認原生 app-server 執行階段。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型參照                | 執行階段原則或路由資訊                                 | 路由                                                    | 驗證                                               |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | 未設定 / `auto`、完全相符的官方 HTTPS 原生路由、無請求覆寫 | 可選用 Codex                                    | Codex 登入，或依序使用 `openai` 驗證設定檔 |
    | `openai/gpt-5.6-terra`   | 未設定 / `auto`、完全相符的官方 HTTPS 原生路由、無請求覆寫 | 可選用 Codex                                    | 當目錄提供 Terra 時使用 Codex 登入       |
    | `openai/gpt-5.6-luna`    | 未設定 / `auto`、完全相符的官方 HTTPS 原生路由、無請求覆寫 | 可選用 Codex                                    | 當目錄提供 Luna 時使用 Codex 登入        |
    | `openai/gpt-5.6-sol`     | 供應商 / 模型 `agentRuntime.id: "openclaw"`                  | OpenClaw 內嵌執行階段、內部 Codex 驗證傳輸 | 已選取的 `openai` OAuth 設定檔                    |
    | `openai/gpt-5.5`         | 明確指定供應商 / 模型 `agentRuntime.id`                     | 已選取的代理程式執行階段                                   | 已選取的 OpenAI 驗證設定檔                       |
    | `openai/*`               | 自訂的 Completions、自訂路由或請求覆寫 | OpenClaw 內嵌執行階段                                | 認證資訊需求仍依路由而定      |
    | `openai/*`               | 明文的官方 HTTP 端點                  | 拒絕                                                 | 不會傳送認證資訊                              |
    | 舊版 Codex GPT-5.5 參照 | 由 doctor 修復                                            | 改寫為 `openai/gpt-5.5`                            | 已遷移的 OpenAI OAuth 設定檔                      |
    | `codex-cli/gpt-5.5`      | 由 doctor 修復                                            | 改寫為 `openai/gpt-5.5`                            | Codex app-server 驗證                              |

    <Warning>
    全新的訂閱支援設定會使用確切的 `openai/gpt-5.6-sol`；原生
    Codex 目錄也可能公開確切的 Terra 或 Luna 參照。如果
    帳戶未公開 GPT-5.6，請明確選取 `openai/gpt-5.5`。較舊的
    Codex GPT 參照是舊版 OpenClaw 路由，而非原生 Codex 執行階段
    路徑；執行 `openclaw doctor --fix` 即可遷移它們，且不會升級
    現有明確選取的 GPT-5.5。`gpt-5.3-codex-spark` 仍僅限於
    Codex 訂閱目錄有列出該模型的帳戶；其直接 OpenAI
    API 金鑰與 Azure 參照仍會隱藏。
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
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    若使用 API 金鑰作為備援，請將所選模型保留在 `openai/*` 下，並將
    驗證順序放在 `openai` 下。OpenClaw 會先嘗試訂閱，再嘗試
    API 金鑰，同時繼續使用 Codex 控制框架：

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
    新手引導不再從 `~/.codex` 匯入 OAuth 資料。請使用
    瀏覽器 OAuth（預設）或上述裝置代碼流程登入；OpenClaw 會在
    自己的代理程式驗證儲存區中管理產生的認證資訊。
    </Note>

    ### 檢查並復原 Codex OAuth 路由

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    若要指定代理程式，請加上 `--agent <id>`：

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    如果較舊的設定仍含有舊版 Codex GPT 參照，或有未明確設定執行階段的
    過時 OpenAI 執行階段工作階段固定項目，請進行修復：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai` 顯示沒有可用的設定檔，請
    重新登入：

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    若要在同一個代理程式中使用多個 Codex OAuth 登入，請使用 `--profile-id`，然後
    透過驗證順序或 `/model ...@<profileId>` 控制它們：

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    在依賴設定檔順序之前，請執行 `openclaw doctor --fix`，以遷移較舊的舊版 OpenAI Codex 前綴
    設定檔 ID 與順序項目。

    ### 狀態指示器

    聊天中的 `/status` 會顯示目前工作階段啟用的是哪個模型執行階段。
    當符合資格的隱含路由或明確的供應商／模型執行階段原則選取隨附的
    Codex app-server 控制框架時，它會顯示為
    `Runtime: OpenAI Codex`。

    ### Doctor 警告

    如果設定或工作階段狀態中仍有舊版 Codex 模型參照或過時的 OpenAI 執行階段固定項目，
    除非 OpenClaw 已明確設定，否則 `openclaw doctor --fix` 會將它們改寫為
    使用 Codex 執行階段的 `openai/*`。

    ### 上下文視窗上限

    OpenClaw 會將模型中繼資料與執行階段上下文上限視為
    彼此獨立的值。對於透過 Codex OAuth 目錄使用的 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`400000`
    - 預設執行階段 `contextTokens` 上限：`272000`

    實務上，較小的預設上限具有較佳的延遲與品質特性。
    可使用 `contextTokens` 覆寫：

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
    限制執行階段上下文預算。對於 `gpt-5.5`，直接 OpenAI API 金鑰路由
    會回報較大的原生 `contextWindow`（`1000000`）；由於上游目錄不同，
    這兩種路由會分別追蹤。
    </Note>

    ### 目錄復原

    OpenClaw 會在上游 Codex 目錄中繼資料存在時，將其用於
    `gpt-5.5`。如果帳戶已通過驗證，但即時 Codex 探索省略
    `gpt-5.5` 資料列，OpenClaw 會合成該 OAuth 模型資料列，避免排程、
    子代理程式及設定的預設模型執行因
    `Unknown model` 而失敗。

  </Tab>
</Tabs>

## 原生 Codex app-server 驗證

當符合資格的確切官方 HTTPS 路由隱含選取原生 Codex app-server 控制框架，
或供應商／模型 `agentRuntime.id: "codex"` 明確選取它時，該控制框架會使用
`openai/*` 模型參照。其驗證仍以帳戶為基礎。OpenClaw 會依下列順序選取驗證：

1. 代理程式已排序的 OpenAI 驗證設定檔，最好位於
   `auth.order.openai` 下。執行 `openclaw doctor --fix` 以遷移較舊的舊版
   Codex 驗證設定檔 ID 與驗證順序。
2. app-server 的現有帳戶，例如本機 Codex 命令列介面的 ChatGPT
   登入。對於預設的隔離代理程式主目錄，OpenClaw 會透過其登入 RPC 將該原生
   命令列介面帳戶橋接至 app-server；它不會共用命令列介面的設定、外掛或討論串儲存區。
3. 僅限本機 stdio app-server 啟動，且僅當 app-server
   回報沒有帳戶時：`CODEX_API_KEY`，接著是 `OPENAI_API_KEY`。

即使閘道程序也有供直接 OpenAI 模型或嵌入使用的 `OPENAI_API_KEY`，
本機 ChatGPT/Codex 訂閱登入也不會因此被取代。環境變數 API 金鑰備援
僅適用於本機 stdio 無帳戶路徑；它絕不會透過 WebSocket app-server
連線傳送。選取訂閱型 Codex 設定檔時，OpenClaw 也不會將
`CODEX_API_KEY` 和 `OPENAI_API_KEY` 傳入產生的 stdio app-server 子程序，
而是透過 app-server 登入 RPC 傳送所選的認證資訊。

當該訂閱設定檔因 Codex 使用量限制而遭封鎖時，OpenClaw 會將此設定檔標記為
封鎖，直到 Codex 公告的重設時間，並允許驗證順序輪替至下一個
`openai:*` 設定檔，而不變更所選模型或離開 Codex 控制框架。
重設時間過後，該訂閱設定檔即可再次使用。

## 圖片生成

隨附的 `openai` 外掛會透過
`image_generate` 工具註冊圖片生成功能。它透過相同的
`openai/gpt-image-2` 模型參照，同時支援 OpenAI API 金鑰與 Codex OAuth 圖片生成。

| 功能                      | OpenAI API 金鑰                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型參照                  | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 驗證                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登入               |
| 傳輸                      | OpenAI Images API                  | Codex Responses 後端                  |
| 每次要求的圖片數上限      | 4                                  | 4                                    |
| 編輯模式                  | 已啟用（最多 5 張參考圖片）        | 已啟用（最多 5 張參考圖片）          |
| 尺寸覆寫                  | 支援，包括 2K/4K 尺寸              | 支援，包括 2K/4K 尺寸                |
| 長寬比／解析度            | 不轉送至 OpenAI Images API         | 在安全時對應至支援的尺寸             |

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
請參閱[圖片生成](/zh-TW/tools/image-generation)，瞭解共用工具參數、
供應商選取與容錯移轉行為。
</Note>

`gpt-image-2` 是 OpenAI 文字轉圖片生成與圖片編輯的預設值。
`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作為
明確的模型覆寫使用。若要輸出透明背景 PNG/WebP，請使用
`openai/gpt-image-1.5`；目前的 `gpt-image-2` API 會拒絕
`background: "transparent"`。

若要提出透明背景要求，請使用 `model: "openai/gpt-image-1.5"`、
`outputFormat: "png"` 或 `"webp"`，以及
`background: "transparent"` 呼叫 `image_generate`；較舊的
`openai.background` 供應商選項仍可接受。OpenClaw 也會將預設的
`openai/gpt-image-2` 透明要求改寫為 `gpt-image-1.5`，以保護公開的
OpenAI 與 OpenAI Codex OAuth 路由；Azure 和自訂 OpenAI 相容端點
則保留其設定的部署／模型名稱。

無頭命令列介面執行也會公開相同的設定：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

從輸入檔案開始時，請搭配 `openclaw infer image edit` 使用相同的
`--output-format` 和 `--background` 旗標。
`--openai-background` 仍可作為 OpenAI 專用別名使用。使用
`--quality low|medium|high|auto` 控制 OpenAI Images 的品質與成本。
使用 `--openai-moderation low|auto`，從 `image generate` 或
`image edit` 傳遞 OpenAI 的內容審核提示。

對於 ChatGPT/Codex OAuth 安裝，請保留相同的 `openai/gpt-image-2` 參照。
設定 `openai` OAuth 設定檔時，OpenClaw 會解析該儲存的 OAuth
存取權杖，並透過 Codex Responses 後端傳送圖片要求；它不會先嘗試
`OPENAI_API_KEY`，也不會無提示地回退至 API 金鑰。若要改用直接
OpenAI Images API 路由，請明確使用 API 金鑰、自訂基礎 URL 或 Azure
端點設定 `models.providers.openai`。如果該自訂圖片端點位於受信任的
LAN／私人位址，還要設定 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；除非有此選擇性啟用設定，
否則 OpenClaw 會封鎖私人／內部 OpenAI 相容圖片端點。

生成：

```
/tool image_generate model=openai/gpt-image-2 prompt="為 macOS 上的 OpenClaw 製作精緻的發表海報" size=3840x2160 count=1
```

生成透明 PNG：

```
/tool image_generate model=openai/gpt-image-1.5 prompt="透明背景上的簡單紅色圓形貼紙" outputFormat=png background=transparent
```

編輯：

```
/tool image_generate model=openai/gpt-image-2 prompt="保留物件形狀，將材質改為半透明玻璃" image=/path/to/reference.png size=1024x1536
```

## 影片生成

隨附的 `openai` 外掛會透過
`video_generate` 工具註冊影片生成功能。

| 功能             | 值                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------- |
| 預設模型         | `openai/sora-2`                                                                    |
| 模式             | 文字轉影片、圖片轉影片、單一影片編輯                                               |
| 參考輸入         | 1 張圖片或 1 部影片                                                                |
| 尺寸覆寫         | 支援文字轉影片與圖片轉影片                                                         |
| 長寬比           | 轉換為最接近的支援尺寸，不直接轉送原始值                                           |
| 其他覆寫         | 不支援 `resolution`、`audio`、`watermark`，並會捨棄且顯示工具警告 |

OpenAI 圖片轉影片請求會使用 `POST /v1/videos` 搭配圖片
`input_reference`。單一影片編輯會使用 `POST /v1/videos/edits`，並將上傳的影片放在
`video` 欄位中。

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
如需共用工具參數、提供者選擇與容錯移轉行為，請參閱[影片生成](/zh-TW/tools/video-generation)。

OpenAI 提供者宣告了 `supportsSize`，但未宣告 `supportsAspectRatio` 或
`supportsResolution`。OpenClaw 的共用正規化層會在請求送達提供者之前，將要求的
`aspectRatio` 轉換為最接近的 OpenAI `size`，因此長寬比請求通常仍可正常運作。
`resolution` 沒有尺寸備援值，因此會被捨棄，並以
`Ignored unsupported overrides for openai/<model>: resolution=<value>` 呈現給呼叫端。
</Note>

## GPT-5 提示貢獻

OpenClaw 會為 `openai` 提供者上的 GPT-5 系列模型新增共用的 GPT-5 提示貢獻
（包括會正規化為 `openai/*` 的修復前舊版 Codex 參照）。
其他同樣提供 GPT-5 系列模型 ID 的提供者（例如 OpenRouter 或 opencode 路由）不會收到此覆疊；
此功能以提供者 ID `openai` 為門檻，而非僅依據模型 ID。較舊的 GPT-4.x 模型絕不會收到此覆疊。

原生 Codex app-server 測試框架不會透過開發者指示接收角色／工具紀律行為契約或友善互動風格覆疊；
原生 Codex 會保留由 Codex 管理的基礎、模型及專案文件行為，而 OpenClaw 會停用原生執行緒中
Codex 的內建人格，確保代理工作區的人格檔案仍具有最終決定權。
OpenClaw 僅向原生 Codex 執行緒提供執行階段情境：頻道遞送、OpenClaw 動態工具、ACP 委派、
工作區情境及 OpenClaw Skills。此相同貢獻中的心跳偵測指引文字是唯一例外：
原生 Codex 的心跳偵測回合確實會取得該文字，但它會作為專用協作指示注入，而非透過共用提示貢獻掛鉤。

GPT-5 貢獻會為相符且由 OpenClaw 組合的提示新增帶標籤的行為契約，涵蓋角色持續性、
執行安全性、工具紀律、輸出形式、完成檢查及驗證。頻道特定的回覆與靜默訊息行為仍位於
OpenClaw 共用系統提示及對外遞送政策中。友善互動風格層是獨立且可設定的。

| 值                  | 效果                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"`（預設） | 啟用友善互動風格層 |
| `"on"`                 | `"friendly"` 的別名                      |
| `"off"`                | 僅停用友善風格層       |

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
執行階段不區分值的大小寫，因此 `"Off"` 和 `"off"` 都會停用
友善風格層。
</Tip>

<Note>
當共用的 `agents.defaults.promptOverlays.gpt5.personality` 設定未設定時，仍會讀取舊版
`plugins.entries.openai.config.personality` 作為相容性備援。
</Note>

## 語音與言語

<AccordionGroup>
  <Accordion title="語音合成（TTS）">
    隨附的 `openai` 外掛會為 `messages.tts` 介面註冊語音合成功能。

    | 設定      | 設定路徑                                            | 預設值                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | 模型        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | 語音        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | 速度        | `messages.tts.providers.openai.speed`                  | （未設定）                          |
    | 指示 | `messages.tts.providers.openai.instructions`           | （未設定，僅限 `gpt-4o-mini-tts`）  |
    | 格式       | `messages.tts.providers.openai.responseFormat`         | 語音留言使用 `opus`，檔案使用 `mp3` |
    | API 金鑰      | `messages.tts.providers.openai.apiKey`                 | 備援至 `OPENAI_API_KEY`   |
    | 基礎 URL     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | 額外本文   | `messages.tts.providers.openai.extraBody` / `extra_body` | （未設定）                        |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用語音：
    `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、
    `marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 會在 OpenClaw 產生的欄位之後合併至 `/audio/speech` 請求 JSON，
    因此可將其用於需要 `lang` 等額外金鑰的 OpenAI 相容端點。原型鏈金鑰會被忽略。

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
    設定 `OPENAI_TTS_BASE_URL` 可覆寫 TTS 基礎 URL，而不影響聊天 API 端點。
    OpenAI TTS 與 Realtime 語音皆透過 OpenAI Platform API 金鑰設定；
    僅安裝 OAuth 的環境仍可使用由 Codex 支援的聊天模型，但無法使用 OpenAI 即時語音回應。
    </Note>

  </Accordion>

  <Accordion title="語音轉文字">
    隨附的 `openai` 外掛會透過 OpenClaw 的媒體理解轉錄介面註冊批次語音轉文字功能。

    - 預設模型：`gpt-4o-transcribe`
    - 端點：OpenAI REST `/v1/audio/transcriptions`
    - 輸入路徑：多部分音訊檔案上傳
    - 用於所有讀取 `tools.media.audio` 的傳入音訊轉錄位置，
      包括 Discord 語音頻道片段及頻道音訊附件

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

    若共用音訊媒體設定或每次呼叫的轉錄請求提供語言與提示線索，這些資訊會轉送至 OpenAI。

  </Accordion>

  <Accordion title="即時轉錄">
    隨附的 `openai` 外掛會為 Voice Call 外掛註冊即時轉錄功能。

    | 設定          | 設定路徑                                                          | 預設值 |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | 模型            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 語言         | `...openai.language`                                                 | （未設定） |
    | 提示           | `...openai.prompt`                                                   | （未設定） |
    | 靜音持續時間 | `...openai.silenceDurationMs`                                        | `800`   |
    | VAD 閾值    | `...openai.vadThreshold`                                             | `0.5`   |
    | 驗證方式             | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai` API 金鑰設定檔    | 需要 Platform API 金鑰 |

    <Note>
    使用 WebSocket 連線至 `wss://api.openai.com/v1/realtime`，並採用 G.711 u-law
    （`g711_ulaw` / `audio/pcmu`）音訊。若使用 `openai` API 金鑰設定檔，
    閘道會在開啟 WebSocket 前鑄造暫時性的 Realtime 轉錄用戶端密鑰。
    此串流提供者用於 Voice Call 的即時轉錄路徑；Discord 語音目前會錄製短片段，
    並改用批次 `tools.media.audio` 轉錄路徑。
    </Note>

  </Accordion>

  <Accordion title="即時語音">
    隨附的 `openai` 外掛會為 Voice Call 外掛註冊即時語音功能。

    | 設定                               | 設定路徑                                                              | 預設值             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | 模型                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | 語音                                  | `...openai.voice`                                                       | `alloy`             |
    | 溫度（Azure 部署橋接）  | `...openai.temperature`                                                 | `0.8`               |
    | VAD 閾值                          | `...openai.vadThreshold`                                                | `0.5`                |
    | 靜音持續時間                       | `...openai.silenceDurationMs`                                           | `500`                |
    | 前置填補                          | `...openai.prefixPaddingMs`                                             | `300`                |
    | 推理強度                       | `...openai.reasoningEffort`                                             | （未設定）              |
    | 驗證方式                                   | `openai` API 金鑰設定檔、`...openai.apiKey` 或 `OPENAI_API_KEY` | 需要 OpenAI Platform API 金鑰 |

    `gpt-realtime-2.1` 可用的內建 Realtime 語音：`alloy`、`ash`、
    `ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。
    OpenAI 建議使用 `marin` 和 `cedar`，以獲得最佳 Realtime 品質。
    這組語音與上方的文字轉語音語音不同；僅限 TTS 的語音（例如 `fable`、
    `nova` 或 `onyx`）不適用於 Realtime 工作階段。
    若偏好更小型、成本更低的 Realtime 2.1 變體，請將模型明確設定為 `gpt-realtime-2.1-mini`。

    <Note>
    **GPT-Live（即將推出）。** OpenAI 的全雙工 `gpt-live-1` 和
    `gpt-live-1-mini` 模型已於 2026 年 7 月取代 ChatGPT 語音模式；
    開發者 API 正逐步開放給搶先體驗組織。OpenClaw 能辨識此模型系列，但目前尚未執行：
    GPT-Live 工作階段僅支援 WebRTC、自行管理對話輪替（不使用 VAD），並透過交接事件協定
    委派代理工作，而 OpenClaw 的即時傳輸目前尚未實作該協定。設定 `gpt-live-*` 模型時，
    系統會採取安全失敗，針對 WebSocket 橋接與 Talk 瀏覽器工作階段提供指引，
    而不會在代理無法存取的情況下默默連接音訊。搶先體驗期間，API 存取權也會依
    OpenAI 組織設限。在 GPT-Live 支援推出前，請繼續使用 `gpt-realtime-2.1`（預設值）。
    </Note>

    <Note>
    後端 OpenAI 即時橋接使用正式版 Realtime WebSocket 工作階段格式，
    該格式不接受 `session.temperature`。Azure OpenAI 部署仍可透過
    `azureEndpoint` 和 `azureDeployment` 使用，並保留與部署相容的工作階段格式
    （包括 `temperature`）。支援雙向工具呼叫及 G.711 u-law 音訊。
    </Note>

    <Note>
    建立工作階段時會選定即時語音。OpenAI 允許稍後變更大多數
    工作階段欄位，但模型在該工作階段中輸出音訊後，就無法再
    變更語音。OpenClaw 目前將內建的即時語音 ID 公開為字串。
    </Note>

    <Note>
    Control UI 對話功能使用 OpenAI 瀏覽器即時工作階段，搭配由閘道
    核發的暫時性用戶端密鑰，並由瀏覽器直接與 OpenAI Realtime API
    進行 WebRTC SDP 交換。閘道會使用所選的 `openai` 認證資訊
    核發該用戶端密鑰。已設定的金鑰、API 金鑰設定檔和
    `OPENAI_API_KEY` 優先使用；`openai` OAuth 設定檔或外部
    Codex 登入則作為備援。閘道轉送和 Voice Call 後端即時
    WebSocket 橋接，對原生 OpenAI 端點使用相同的認證資訊優先順序。
    維護者可使用
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`
    進行即時驗證；OpenAI 部分會同時驗證後端 WebSocket 橋接和瀏覽器
    WebRTC SDP 交換，且不會記錄密鑰。
    傳入 `--openai-only`，即可在沒有 Google 認證資訊的情況下執行這兩個部分。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端點

內建的 `openai` 提供者可透過覆寫基底 URL，將影像
生成導向 Azure OpenAI 資源。在影像生成路徑上，OpenClaw
會偵測 `models.providers.openai.baseUrl` 上的 Azure 主機名稱，並自動切換為
Azure 的要求格式。

<Note>
即時語音使用獨立的設定路徑
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），
不受 `models.providers.openai.baseUrl` 影響。如需 Azure
設定，請參閱[語音與語音輸出](#voice-and-speech)下的**即時
語音**折疊區段。
</Note>

適合使用 Azure OpenAI 的情況：

- 你已有 Azure OpenAI 訂閱、配額或企業
  合約
- 你需要 Azure 提供的區域資料落地或合規控制
- 你想將流量保留在現有的 Azure 租用戶內

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

OpenClaw 會辨識以下 Azure 主機尾碼，並使用 Azure 影像生成
路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

對辨識出的 Azure 主機提出影像生成要求時，OpenClaw 會：

- 傳送 `api-key` 標頭，而非 `Authorization: Bearer`
- 使用部署範圍路徑（`/openai/deployments/{deployment}/...`）
- 在每個要求附加 `?api-version=...`
- 對 Azure 影像生成呼叫使用預設 600 秒的要求逾時。
  每次呼叫的 `timeoutMs` 值仍會覆寫此預設值。

其他基底 URL（公用 OpenAI、OpenAI 相容 Proxy）仍使用標準
OpenAI 影像要求格式。

<Note>
`openai` 提供者的影像生成路徑若要使用 Azure 路由，
需要 OpenClaw 2026.4.22 或更新版本。較舊版本會將任何自訂
`openai.baseUrl` 視為公用 OpenAI 端點，因而無法搭配 Azure 影像
部署使用。
</Note>

### API 版本

設定 `AZURE_OPENAI_API_VERSION`，可將 Azure 影像生成路徑固定至特定的
Azure 預覽版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未設定此變數時，預設值為 `2024-12-01-preview`。

### 模型名稱即部署名稱

Azure OpenAI 會將模型繫結至部署。對於透過內建
`openai` 提供者路由的 Azure 影像生成要求，OpenClaw 中的
`model` 欄位必須是你在 Azure 入口網站中設定的 **Azure 部署名稱**，
而不是公用 OpenAI 模型 ID。

如果你建立名為 `gpt-image-2-prod`、用來提供 `gpt-image-2` 的部署：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

相同的部署名稱規則適用於透過內建 `openai` 提供者路由的
任何影像生成呼叫。

### 區域可用性

Azure 影像生成目前僅在部分區域提供
（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。建立部署前，請查看 Microsoft 目前的區域清單，
並確認你的區域有提供特定模型。

### 參數差異

Azure OpenAI 與公用 OpenAI 不一定接受相同的影像參數。
Azure 可能會拒絕公用 OpenAI 允許的選項（例如 `gpt-image-2` 上的某些
`background` 值），或僅在特定模型版本上提供這些選項。
這些差異來自 Azure 和底層模型，而非 OpenClaw。如果 Azure 要求因
驗證錯誤而失敗，請在 Azure 入口網站中查看你的特定部署和 API 版本
支援的參數集合。

<Note>
Azure OpenAI 使用原生傳輸和相容行為，但不會收到
OpenClaw 的隱藏歸因標頭——請參閱[進階設定](#advanced-configuration)下的
**原生路由與 OpenAI 相容路由**折疊區段。

若要在 Azure 上使用聊天或 Responses 流量（不只影像生成），請使用
新手引導流程或專用的 Azure 提供者設定；僅設定 `openai.baseUrl`
不會採用 Azure API／驗證格式。另有獨立的
`azure-openai-responses/*` 提供者；請參閱下方的伺服器端壓縮
折疊區段。
</Note>

## 進階設定

下方每個模型的 `params` 範例會塑造 OpenClaw 內嵌提供者的
要求。設定這些項目屬於明確定義的要求行為，因此原本符合資格的
`auto` 路由仍會留在 OpenClaw，而不會隱含地選取 Codex。原生
Codex app-server 控制框架擁有自己的傳輸和要求設定；若有效路由未宣告為
與 Codex 相容，明確設定 `agentRuntime.id: "codex"` 會以封閉方式失敗。

<AccordionGroup>
  <Accordion title="傳輸（WebSocket 與 SSE）">
    OpenClaw 對 `openai/*` 優先使用 WebSocket，並以 SSE 作為備援（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw 會：
    - 在改用 SSE 前，重試一次早期 WebSocket 失敗
    - 失敗後，將 WebSocket 標記為降級 60 秒，並在
      冷卻期間使用 SSE
    - 為重試和重新連線附加穩定的工作階段與回合識別
      標頭
    - 在不同傳輸方式間正規化用量計數器（`input_tokens`／`prompt_tokens`）

    | 值                | 行為                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"`（預設）   | 優先使用 WebSocket，以 SSE 作為備援     |
    | `"sse"`              | 僅強制使用 SSE                    |
    | `"websocket"`        | 僅強制使用 WebSocket              |

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
    OpenClaw 為 `openai/*` 提供共用的快速模式切換選項：

    - **聊天／UI：** `/fast status|auto|on|off`
    - **設定：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    啟用後，OpenClaw 會將快速模式對應至 OpenAI 優先處理
    （`service_tier = "priority"`）。現有的 `service_tier` 值會保留，
    且快速模式不會重寫 `reasoning` 或
    `text.verbosity`。`fastMode: "auto"` 會讓新的模型呼叫以快速模式開始，
    直到自動截止時間為止；之後開始的重試、備援、工具結果或
    延續呼叫則不使用快速模式。截止時間預設為 60 秒；
    在作用中的模型上設定 `params.fastAutoOnSeconds` 即可變更。

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
    工作階段覆寫值的優先順序高於設定。在工作階段 UI 中清除工作階段
    覆寫值後，工作階段會恢復使用設定的預設值。
    </Note>

  </Accordion>

  <Accordion title="優先處理（service_tier）">
    OpenAI API 透過 `service_tier` 提供優先處理。請在 OpenClaw 中
    針對每個模型設定：

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
    `serviceTier` 僅會轉送至原生 OpenAI 端點
    （`api.openai.com`）和原生 Codex 端點（`chatgpt.com/backend-api`）。
    如果你透過 Proxy 路由任一提供者，OpenClaw 會讓
    `service_tier` 保持不變。
    </Warning>

  </Accordion>

  <Accordion title="伺服器端壓縮（Responses API）">
    對於直接使用 OpenAI Responses 的模型（`api.openai.com` 上的 `openai/*`），
    OpenAI 外掛的 OpenClaw 串流包裝函式會自動啟用伺服器端
    壓縮：

    - 強制使用 `store: true`（除非模型相容性設定了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 預設 `compact_threshold`：`contextWindow` 的 70%（無法取得時則為 `80000`）

    這適用於內建 OpenClaw 執行階段路徑，以及內嵌執行所使用的
    OpenAI 提供者掛鉤。原生 Codex app-server 控制框架透過 Codex
    管理自己的上下文，因此不受此設定影響。

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
      <Tab title="自訂門檻">
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
    `responsesServerCompaction` 僅控制 `context_management` 的注入。
    直接使用 OpenAI Responses 的模型仍會強制使用 `store: true`，
    除非相容性設定了 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="嚴格代理式 GPT 模式">
    對於透過 OpenClaw 內嵌執行階段執行的 `openai` 提供者
    GPT-5 系列模型，OpenClaw 已預設採用名為
    `strict-agentic` 的較嚴格執行契約。只要解析後的提供者為
    `openai`，且模型 ID 符合 GPT-5 系列，就會自動啟用，
    除非設定明確選擇退出：

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    在支援的管道上明確設定 `"strict-agentic"` 不會有任何作用（它
    已經是預設值），在不支援的供應商／模型組合上也不會生效。

    啟用 `strict-agentic` 後，OpenClaw 會：
    - 針對大量工作自動啟用 `update_plan`
    - 若回合在結構上為空或僅含推理內容，則以產生可見答案的
      接續回合重試
    - 當選取的執行框架提供明確的執行框架計畫事件時，
      使用這些事件

    OpenClaw 不會對助理的文字內容進行分類，以判斷某個回合是
    計畫、進度更新還是最終答案。

    <Note>
    此合約完全存在於 OpenClaw 的內嵌代理執行器中。它不適用於
    原生 Codex app-server 執行框架，後者會自行管理回合與計畫
    行為；對原生 Codex 執行而言，執行框架的選擇比執行合約
    設定更為重要。
    </Note>

  </Accordion>

  <Accordion title="原生路由與 OpenAI 相容路由">
    OpenClaw 對直接 OpenAI、Codex 和 Azure OpenAI 端點的處理方式，
    不同於一般的 OpenAI 相容 `/v1` Proxy：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 僅為支援 OpenAI `none` 強度的模型
      保留 `reasoning: { effort: "none" }`
    - 對於會拒絕 `reasoning.effort: "none"` 的模型或 Proxy，
      省略已停用的推理設定
    - 工具結構描述預設使用嚴格模式
    - 僅在經驗證的原生主機上附加隱藏的歸屬標頭（即使 Azure
      OpenAI 屬於原生路由，也不會取得這些標頭）
    - 保留僅限 OpenAI 的請求塑形（`service_tier`、`store`、
      推理相容性、提示快取提示）

    **Proxy／相容路由：**
    - 使用較寬鬆的相容行為
    - 從非原生 `openai-completions` 承載資料中移除 Completions `store`
    - 接受用於 OpenAI 相容 Completions Proxy 的進階
      `params.extra_body`/`params.extraBody` 透傳 JSON
    - 接受供 vLLM 等 OpenAI 相容 Completions
      Proxy 使用的 `params.chat_template_kwargs`
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
