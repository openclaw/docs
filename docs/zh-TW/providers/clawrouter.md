---
read_when:
    - 您想使用一個受管理的金鑰來存取多個模型供應商
    - 您需要在 OpenClaw 中使用 ClawRouter 模型探索或配額報告功能
summary: 透過 ClawRouter 路由憑證限定範圍的模型，並顯示受管理的配額
title: ClawRouter
x-i18n:
    generated_at: "2026-07-11T21:42:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter 為 OpenClaw 提供一個受原則範圍限制的金鑰，用於多個上游模型
供應商。內建的 `clawrouter` 外掛只會探索該金鑰允許使用的模型，
透過每個模型宣告的協定進行路由，並在 OpenClaw 的用量介面上回報
該金鑰的預算與彙總用量。

上游憑證與供應商特定的轉送作業均保留在 ClawRouter 中，因此
您不必在 OpenClaw 主機上安裝或驗證每個上游供應商的外掛。
此外掛隨 OpenClaw 內建提供（`enabledByDefault: true`）；
您只需要一組已核發的 ClawRouter 憑證。

| 屬性          | 值                                       |
| ------------- | ---------------------------------------- |
| 供應商        | `clawrouter`                             |
| 外掛          | 內建（包含於 OpenClaw）                  |
| 驗證          | `CLAWROUTER_API_KEY`                     |
| 預設網址      | `https://clawrouter.openclaw.ai`         |
| 模型目錄      | 透過 `/v1/catalog` 依憑證範圍提供        |
| 配額          | 透過 `/v1/usage` 提供每月預算與用量      |

## 開始使用

<Steps>
  <Step title="取得限定範圍的憑證">
    請向您的 ClawRouter 管理員索取憑證，其原則應包含
    您應使用的供應商、模型與每月預算。憑證核發時只會顯示一次。
  </Step>
  <Step title="設定 OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` 是內建外掛，且預設啟用。如果您的設定包含
    `plugins.allow`，請先將 `clawrouter` 加入該清單，再啟用它。若為
    自訂部署，請將 `models.providers.clawrouter.baseUrl` 設為
    ClawRouter 的來源網址；預設值為 `https://clawrouter.openclaw.ai`。

  </Step>
  <Step title="列出已授權的模型">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    請完全依照傳回內容使用模型參照。這些參照會保留上游
    命名空間，例如 `clawrouter/openai/gpt-5.5`、
    `clawrouter/anthropic/claude-sonnet-4-6` 或
    `clawrouter/google/gemini-3.5-flash`。如果設定中的
    `agents.defaults.models` 是允許清單，請將每個選取的 ClawRouter
    參照加入其中。

  </Step>
  <Step title="選取模型">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    您也可以使用
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`
    為單次執行選取傳回的模型。

  </Step>
</Steps>

## 受管理的非互動式部署

請將代理金鑰保留在工作負載的祕密注入機制中，並僅在
`openclaw.json` 儲存 SecretRef。標準的受管理欄位如下：

| 用途          | 設定或環境欄位                                                           |
| ------------- | ------------------------------------------------------------------------ |
| 路由器來源    | `models.providers.clawrouter.baseUrl`                                    |
| 憑證          | `models.providers.clawrouter.apiKey` -> 環境變數 SecretRef               |
| 祕密值        | 閘道程序環境中的 `CLAWROUTER_API_KEY`                                   |
| 預設模型      | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| 工作負載標記  | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id`（選用）    |

例如，部署控制器可以管理此 JSON5 修補內容：

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

如果部署設定了 `plugins.allow`，請保留其中現有的項目，並加入
`clawrouter`。無須互動式精靈即可驗證並套用：

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

試執行會解析 SecretRef，但絕不會輸出其值。若要輪替
憑證，請更新提供 `CLAWROUTER_API_KEY` 的外部 Secret，並
重新啟動閘道工作負載，以載入新的程序環境。設定檔與模型參照
不需要變更。

對於從原始碼建置的獨立 Docker 閘道，ClawRouter 已包含在
根執行環境中。只需選取需要獨立封裝的頻道外掛，
例如 `OPENCLAW_EXTENSIONS=clickclack`、`slack` 或 `msteams`；請參閱
[包含所選外掛的原始碼建置映像](/zh-TW/install/docker#source-built-images-with-selected-plugins)。
封存檔／設備部署必須透過自己的成品管線封裝同一份已合併的原始碼，
而非使用 OCI 映像。

## 就緒狀態與實際驗證

這些檢查分別驗證不同的邊界；不可彼此替代：

```bash
# 僅檢查 ClawRouter 程序健康狀態；不會使用憑證或上游模型。
curl -fsS https://clawrouter.internal.example/v1/health

# 僅檢查 OpenClaw 閘道啟動就緒狀態；不會呼叫模型。
curl -fsS http://127.0.0.1:18789/readyz

# 依憑證範圍探索目錄。
openclaw models list --all --provider clawrouter --json

# 透過已設定的 ClawRouter 供應商進行最小化的真實推論探測。
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# 使用已授權模型精確參照的工作負載金絲雀測試。
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Reply exactly: CLAWROUTER_CANARY_OK" \
  --json
```

請使用限定範圍的目錄所傳回的模型，不要直接照抄範例
模型。成功的 `/readyz` 回應表示閘道可以處理
請求；這並不代表 ClawRouter、其憑證或上游
供應商已就緒。模型探測與代理程式金絲雀測試才是推論驗證。

若要進行實際診斷，請執行金絲雀測試，並檢查閘道的標準日誌。
現有僅含中繼資料的模型傳輸診斷會輸出如下格式的行：

```text
[model-fetch] start provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] response provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

當這些識別碼可用時，外掛會傳送有長度限制的
`X-ClawRouter-Client`、`X-ClawRouter-Agent-Id` 與
`X-ClawRouter-Session-Id` 標頭。此外掛也會將模型呼叫的診斷
`callId`（`<run-id>:model:<n>`）對應至
`X-Request-ID`，以便將 OpenClaw 模型呼叫事件與 ClawRouter
僅含中繼資料的稽核軌跡建立關聯。位於 128 字元請求識別碼限制內的值
會完全相同。較長的值會保留 `:model:<n>` 後綴與確定性
雜湊，使不同呼叫仍維持在長度限制內且可建立關聯。靜態部署中繼資料
（例如 `X-ClawRouter-Project-Id`）可在供應商的 `headers` 對應中設定。
代理程式與工作階段歸屬標頭分別保有 256 字元的
限制。若自動請求識別碼包含 ClawRouter ASCII
識別碼集合以外的字元，則會使用相同的確定性限長格式。
明確設定的標頭，包括任何大小寫形式的 `X-Request-ID`，優先於
自動產生的值。傳輸診斷會記錄路由與回應
中繼資料；不會記錄憑證、請求識別碼、提示詞或完成內容。
ClawRouter 自身的稽核事件會提供所選的上游供應商與
內容保留狀態。

## 模型探索

`GET /v1/catalog` 會傳回 `{ providers: [...] }`，其中每個供應商項目
會列出自己的 `models[]`（包含上游識別碼、能力與定價）及其
支援的請求路由。OpenClaw 不會另行提供第二份固定的
ClawRouter 模型清單。符合以下條件時，目錄模型才會被公布為 OpenClaw 模型：

- 憑證的原則授權使用其供應商；
- 目錄模型宣告支援的 LLM 能力（`llm.responses`、
  `llm.chat`、`llm.messages`，或具有相符串流
  路由的 `llm.stream`）；以及
- 供應商為下列其中一種傳輸方式提供相符的路由。

將模型加入受支援的 ClawRouter 供應商不需要發布新版 OpenClaw：
下一次目錄重新整理（依各憑證範圍快取 60 秒）就會探索
該模型。需要新線路協定的模型，必須先由外掛提供支援。

## 協定與供應商外掛

ClawRouter 管理上游憑證；其目錄會告知 OpenClaw 應使用哪種
傳輸方式，因此您不必安裝每家上游公司的驗證外掛。

| 目錄能力／路由                                           | OpenClaw 傳輸方式       |
| -------------------------------------------------------- | ----------------------- |
| `llm.responses`（OpenAI 相容供應商）                     | `openai-responses`      |
| `llm.chat`（OpenAI 相容供應商）                          | `openai-completions`    |
| `llm.messages` + `anthropic.messages` 路由               | `anthropic-messages`    |
| `llm.stream` + 串流 `google.generate_content` 路由       | `google-generative-ai`  |

此外掛也會針對這些系列套用相符的重播與工具結構描述原則
（OpenAI／DeepSeek／Gemini 工具結構描述相容性；原生 Anthropic 與
Google Gemini 重播原則）。若目錄供應商僅提供
不支援的請求格式，則依設計不會將其公布為 OpenClaw
文字模型。請在 ClawRouter 中將這些供應商正規化為其中一種受支援的合約，
而非傳送不相容的承載資料。

## 配額與用量

ClawRouter 的 `/v1/usage` 回應會提供給一般 OpenClaw 供應商用量
介面：請求、權杖與支出總計；若金鑰設有限額，
也會提供每月預算期間。未計量的金鑰仍會顯示彙總用量，但不會顯示
百分比區間。

配額查詢會使用與模型探索相同的限定範圍金鑰。配額
查詢失敗不會阻止模型執行。

使用以下命令檢查即時快照：

```bash
openclaw status --usage
openclaw models status
```

相同的供應商快照也會提供給聊天中的 `/status` 以及 OpenClaw 的
用量介面。預算適用於整個原則，因此使用
相同 ClawRouter 原則的其他用戶端所提出的請求，可能會改變剩餘百分比。

## 疑難排解

| 症狀                                     | 檢查                                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 沒有 ClawRouter 模型                     | 確認外掛已啟用且獲 `plugins.allow` 允許，接著檢查憑證是否有效，並至少授權一個已就緒的供應商。                                                           |
| 已設定的 ClawRouter 模型遺失             | 檢查其 `/v1/catalog` 能力與路由支援。系統會依設計篩除不支援的傳輸合約。                                                                                  |
| `Unknown model: clawrouter/...`          | 當該設定對應被用作允許清單時，請將精確的目錄參照加入 `agents.defaults.models`。                                                                          |
| 目錄或用量傳回 `401` 或 `403`            | 重新核發 ClawRouter 憑證或調整其範圍；OpenClaw 不會改用上游供應商金鑰。                                                                                  |
| 探索後模型呼叫失敗                       | 在 ClawRouter 中檢查供應商連線與上游健康狀態，待其恢復就緒後再重試。                                                                                    |
| 用量有總計但沒有百分比                   | 該原則未計量；請在 ClawRouter 中新增每月預算，以顯示百分比區間。                                                                                        |

## 安全性行為

- 目錄探索的範圍限定於已設定的代理金鑰，並依憑證範圍（代理程式目錄、工作區目錄、驗證設定檔 ID 和基底 URL）分別快取。
- 代理金鑰僅在分派請求時附加；不會儲存於模型中繼資料中。
- 自動歸因值與請求關聯值會在分派前去除首尾空白，且拒絕包含控制字元。歸因值上限為 256 個字元；請求 ID 上限為 128 個字元。
- 模型傳輸診斷僅包含中繼資料，絕不包含代理金鑰或模型內容。
- 原生 Anthropic 與 Gemini 模型 ID 僅在分派時改寫為其上游 ID。
- 不支援或未獲授權的目錄項目會採取封閉式失敗，且無法選取。

## 相關內容

<CardGroup cols={2}>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers" icon="layers">
    供應商設定與模型選擇。
  </Card>
  <Card title="用量追蹤" href="/zh-TW/concepts/usage-tracking" icon="chart-line">
    OpenClaw 的用量與狀態介面。
  </Card>
</CardGroup>
