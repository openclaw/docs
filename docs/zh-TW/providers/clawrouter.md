---
read_when:
    - 你想要使用一個受管理的金鑰來存取多個模型供應商
    - 你需要在 OpenClaw 中使用 ClawRouter 模型探索或配額報告功能
summary: 透過 ClawRouter 路由認證資訊範圍限定的模型，並顯示受管理的配額
title: ClawRouter
x-i18n:
    generated_at: "2026-07-16T11:54:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 684405818b701448b37431302b0c2cc66e106c2c6d482545569d9dfc7f7fe8e5
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter 為 OpenClaw 提供一個受原則範圍限制的金鑰，以使用多個上游模型
供應商。隨附的 `clawrouter` 外掛只會探索該金鑰允許的模型，
透過各模型宣告的通訊協定路由模型，並在 OpenClaw 的用量介面上回報
該金鑰的預算與彙總用量。

上游認證資訊與供應商專屬的轉送作業都保留在 ClawRouter 中，因此
你不必在 OpenClaw 主機上安裝每個上游供應商的外掛，也不必逐一進行
驗證。此 外掛隨 OpenClaw 一併提供（`enabledByDefault: true`）；
你只需要取得 ClawRouter 核發的認證資訊。

| 屬性          | 值                                       |
| ------------- | ---------------------------------------- |
| 供應商        | `clawrouter`                       |
| 外掛          | 隨附（包含在 OpenClaw 中）               |
| 驗證          | `CLAWROUTER_API_KEY`                       |
| 預設 URL      | `https://clawrouter.openclaw.ai`                       |
| 模型目錄      | 透過 `/v1/catalog` 限定於認證資訊範圍 |
| 配額          | 透過 `/v1/usage` 提供每月預算與用量 |

## 開始使用

<Steps>
  <Step title="取得範圍受限的認證資訊">
    請向 ClawRouter 管理員索取認證資訊，其原則應包含
    你要使用的供應商、模型及每月預算。認證資訊核發時只會
    顯示一次。
  </Step>
  <Step title="設定 OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` 已隨附且預設啟用。如果你的設定中有
    `plugins.allow`，請先將 `clawrouter` 加入該清單，再啟用它。若為
    自訂部署，請將 `models.providers.clawrouter.baseUrl` 設為
    ClawRouter 來源；預設值為 `https://clawrouter.openclaw.ai`。

  </Step>
  <Step title="列出獲准使用的模型">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    請完全按照傳回內容使用模型參照。它們會保留上游
    命名空間，例如 `clawrouter/openai/gpt-5.5`、
    `clawrouter/anthropic/claude-sonnet-4-6` 或
    `clawrouter/google/gemini-3.5-flash`。如果 `agents.defaults.models` 在你的
    設定中是允許清單，請將每個選定的 ClawRouter 參照加入其中。

  </Step>
  <Step title="選取模型">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    你也可以使用 `openclaw agent --model clawrouter/<provider>/<model> --message "..."`
    為單次執行選取傳回的模型。

  </Step>
</Steps>

## 受管理的非互動式部署

將 Proxy 金鑰保留在工作負載的密鑰注入機制中，並且只在
`openclaw.json` 中儲存 SecretRef。標準的受管理欄位如下：

| 用途          | 設定或環境欄位                                                           |
| ------------- | ------------------------------------------------------------------------ |
| 路由器來源    | `models.providers.clawrouter.baseUrl`                                                       |
| 認證資訊      | `models.providers.clawrouter.apiKey` -> 環境 SecretRef                                     |
| 密鑰值        | 閘道程序環境中的 `CLAWROUTER_API_KEY`                                      |
| 預設模型      | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`                                 |
| 工作負載標記  | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id`（選用）                                               |

例如，部署控制器可以管理此 JSON5 修補：

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

如果部署設定了 `plugins.allow`，請保留其現有項目並加入
`clawrouter`。不使用互動式精靈即可驗證並套用：

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

試執行會解析 SecretRef，但絕不會輸出其值。若要輪替
認證資訊，請更新提供 `CLAWROUTER_API_KEY` 的外部 Secret，並
重新啟動閘道工作負載，以載入新的程序環境。
設定檔與模型參照不會變更。

對於從原始碼建置的獨立 Docker 閘道，ClawRouter 已包含在
根執行階段中。只需選取需要個別封裝的頻道外掛，
例如 `OPENCLAW_EXTENSIONS=clickclack`、`slack` 或 `msteams`；請參閱
[使用所選外掛從原始碼建置映像檔](/zh-TW/install/docker#source-built-images-with-selected-plugins)。
封存檔／設備部署必須透過其自身的成品管線封裝相同的已合併原始碼，
而不是使用 OCI 映像檔。

## 就緒狀態與實際驗證

這些檢查驗證的是不同邊界；不可互相取代：

```bash
# 僅檢查 ClawRouter 程序健康狀態；不會使用認證資訊或上游模型。
curl -fsS https://clawrouter.internal.example/v1/health

# 僅檢查 OpenClaw 閘道啟動就緒狀態；不會呼叫模型。
curl -fsS http://127.0.0.1:18789/readyz

# 限定於認證資訊範圍的目錄探索。
openclaw models list --all --provider clawrouter --json

# 透過已設定的 ClawRouter 供應商執行最小的實際推論探測。
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# 使用確切獲准模型參照的工作負載金絲雀測試。
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "請只回覆：CLAWROUTER_CANARY_OK" \
  --json
```

請使用受範圍限制的目錄傳回的模型，而不要直接照抄範例
模型。成功的 `/readyz` 回應表示閘道能夠處理
要求；這不代表 ClawRouter、其認證資訊或上游
供應商已就緒。模型探測與代理程式金絲雀測試才是推論驗證。

若要進行實際診斷，請發出金絲雀測試並檢查閘道的標準日誌。
現有僅包含中繼資料的模型傳輸診斷會輸出如下格式的行：

```text
[model-fetch] 開始 provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] 回應 provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

當這些識別碼可用時，外掛會傳送長度受限的 `X-ClawRouter-Client`、`X-ClawRouter-Agent-Id` 和
`X-ClawRouter-Session-Id` 標頭。它也會將模型呼叫的診斷 `callId`（`<run-id>:model:<n>`）對應至
`X-Request-ID`，因此 OpenClaw 模型呼叫事件可與 ClawRouter 的
僅含中繼資料稽核軌跡相互關聯。未超過 128 字元要求 ID 預算的值會
完全相同。較長的值會保留 `:model:<n>` 後綴與確定性
雜湊，讓不同呼叫保持在長度限制內且仍可相互關聯。靜態部署中繼資料
（例如 `X-ClawRouter-Project-Id`）可以在供應商的 `headers` 對應表中設定。
代理程式與工作階段歸屬標頭各自保留 256 字元的
限制。若自動產生的要求 ID 含有 ClawRouter ASCII
識別碼集合以外的字元，也會使用相同的確定性限長格式。
明確設定的標頭（包括 `X-Request-ID` 的任何大小寫變體）優先於
自動值。傳輸診斷會記錄路由與回應
中繼資料；不會記錄認證資訊、要求 ID、提示詞或完成內容。
ClawRouter 自身的稽核事件會提供選取的上游供應商與
內容保留狀態。

## 模型探索

`GET /v1/catalog` 會傳回 `{ providers: [...] }`，其中每個供應商項目
都會列出自己的 `models[]`（包含上游 ID、能力與定價）及其
支援的要求路由。OpenClaw 不會提供第二份固定的
ClawRouter 模型清單。當符合以下條件時，目錄模型會公布為 OpenClaw 模型：

- 認證資訊的原則授予其供應商；
- 目錄模型公布受支援的 LLM 能力（`llm.responses`、
  `llm.chat`、`llm.messages` 或 `llm.stream`，且有相符的串流
  路由）；以及
- 供應商為下列其中一種傳輸方式公開相符的路由。

將模型加入受支援的 ClawRouter 供應商不需要發布新版 OpenClaw：
下一次目錄重新整理（依認證資訊範圍快取 60 秒）就會探索到
該模型。需要新線路通訊協定的模型，必須先獲得外掛支援。

## 通訊協定與供應商外掛

ClawRouter 管理上游認證資訊；其目錄會告訴 OpenClaw 要使用哪種
傳輸方式，因此你不必安裝每一家上游公司的驗證外掛。

| 目錄能力／路由                                           | OpenClaw 傳輸方式      |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses`（OpenAI 相容供應商）                  | `openai-responses`     |
| `llm.chat`（OpenAI 相容供應商）                  | `openai-completions`     |
| `llm.messages` + `anthropic.messages` 路由             | `anthropic-messages`     |
| `llm.stream` + 串流 `google.generate_content` 路由        | `google-generative-ai`     |

此外，外掛也會對這些系列套用相符的重播與工具結構描述原則
（OpenAI／DeepSeek／Gemini／Perplexity 工具結構描述相容性；原生
Anthropic 與 Google Gemini 重播原則）。Perplexity 模型會套用嚴格的
結構描述重寫：移除 `patternProperties` 和 `additionalProperties`，且
每個物件結構描述都會宣告 `properties`，因為 Perplexity 會拒絕
缺少這些宣告的工具結構描述。若目錄供應商只公開
不受支援的要求格式，便會刻意不將其公布為 OpenClaw
文字模型。請在 ClawRouter 中將這些供應商正規化為其中一種受支援的合約，
而不是傳送不相容的承載資料。

## 配額與用量

ClawRouter 的 `/v1/usage` 回應會提供給標準的 OpenClaw 供應商用量
介面：要求、權杖與支出總計；若金鑰設有限額，還會提供每月預算期間。
未計量金鑰仍會顯示彙總用量，但不會顯示百分比期間。

配額查詢會使用與模型探索相同的範圍受限金鑰。配額
查詢失敗不會阻止模型執行。

使用以下指令檢查即時快照：

```bash
openclaw status --usage
openclaw models status
```

相同的供應商快照也可供聊天中的 `/status` 與 OpenClaw
用量 UI 使用。預算適用於整個原則，因此另一個使用
相同 ClawRouter 原則的用戶端所發出的要求，可能會改變剩餘百分比。

## 疑難排解

| 症狀                                     | 檢查                                                                                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 沒有 ClawRouter 模型                     | 確認外掛已啟用且受 `plugins.allow` 允許，接著檢查認證資訊是否有效，並授予至少一個已就緒的供應商。                                               |
| 已設定的 ClawRouter 模型遺失             | 檢查其 `/v1/catalog` 能力與路由支援。系統會刻意篩除不受支援的傳輸合約。                                                                       |
| `Unknown model: clawrouter/...`                       | 當該設定對應表作為允許清單使用時，請將確切的目錄參照加入 `agents.defaults.models`。                                                                      |
| 目錄或用量傳回 `401` 或 `403` | 重新核發 ClawRouter 認證資訊或調整其範圍；OpenClaw 不會改用上游供應商金鑰。                                                          |
| 探索後模型呼叫失敗                       | 檢查 ClawRouter 中的供應商連線與上游健康狀態，並在其就緒狀態恢復後重試。                                                                           |
| 用量有總計但沒有百分比                   | 該原則未計量；請在 ClawRouter 中新增每月預算，以顯示百分比期間。                                                                                    |

## 安全性行為

- 目錄探索範圍僅限於已設定的 Proxy Key，並依各認證資訊範圍（代理程式目錄、工作區目錄、驗證設定檔 ID 和基礎 URL）分別快取。
- Proxy Key 僅在分派請求時附加；不會儲存在模型中繼資料中。
- 自動歸屬與請求關聯值會在分派前移除前後空白，並拒絕控制字元。歸屬值上限為 256 個字元；請求 ID 上限為 128 個字元。
- 模型傳輸診斷僅包含中繼資料，絕不包含 Proxy Key 或模型內容。
- 原生 Anthropic 和 Gemini 模型 ID 僅在分派時重寫為其上游 ID。
- 不支援或未獲授權的目錄資料列會採取封閉式失敗，且無法選取。

## 相關內容

<CardGroup cols={2}>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers" icon="layers">
    供應商設定與模型選擇。
  </Card>
  <Card title="用量追蹤" href="/zh-TW/concepts/usage-tracking" icon="chart-line">
    OpenClaw 用量與狀態介面。
  </Card>
</CardGroup>
