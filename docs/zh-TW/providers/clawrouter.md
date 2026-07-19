---
read_when:
    - 你想用一組受管理的金鑰存取多個模型供應商
    - 你需要在 OpenClaw 中使用 ClawRouter 模型探索或配額報告功能
summary: 透過 ClawRouter 路由認證資訊範圍限定的模型，並顯示受管理的配額
title: ClawRouter
x-i18n:
    generated_at: "2026-07-19T14:04:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 929a93e8d1d003e21f792d0fdab9542553ffab374f59d4d0505819b0f719591f
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter 為 OpenClaw 提供一組受政策範圍限制的金鑰，以供多個上游模型供應商使用。隨附的 `clawrouter` 外掛只會探索該金鑰允許的模型，依各模型宣告的通訊協定路由模型，並在 OpenClaw 的用量介面上回報該金鑰的預算與彙總用量。

上游認證資訊與供應商特定的轉送作業都留在 ClawRouter 中，因此你不必在 OpenClaw 主機上安裝各個上游供應商外掛，也不必逐一進行驗證。此��掛隨 OpenClaw 一併提供（`enabledByDefault: true`）；你只需要已核發的 ClawRouter 認證資訊。

| 屬性          | 值                                       |
| ------------- | ---------------------------------------- |
| 供應商        | `clawrouter`                       |
| 外掛          | 隨附（包含在 OpenClaw 中）               |
| 驗證          | `CLAWROUTER_API_KEY`                       |
| 預設 URL      | `https://clawrouter.openclaw.ai`                       |
| 模型目錄      | 透過 `/v1/catalog` 依認證資訊限定範圍 |
| 配額          | 透過 `/v1/usage` 取得每月預算與用量 |

## 開始使用

<Steps>
  <Step title="取得限定範圍的認證資訊">
    向 ClawRouter 管理員索取認證資訊，其政策應包含你應使用的供應商、模型和每月預算。認證資訊核發時只會顯示一次。
  </Step>
  <Step title="設定 OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` 已隨附且預設啟用。如果你的設定包含 `plugins.allow`，請先將 `clawrouter` 加入該清單，再啟用它。若是自訂部署，請將 `models.providers.clawrouter.baseUrl` 設為 ClawRouter 來源；預設值為 `https://clawrouter.openclaw.ai`。

  </Step>
  <Step title="列出已授權的模型">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    請完全依照傳回結果使用模型參照。這些參照會保留上游命名空間，例如 `clawrouter/openai/gpt-5.5`、`clawrouter/anthropic/claude-sonnet-4-6` 或 `clawrouter/google/gemini-3.5-flash`。如果已設定 `agents.defaults.modelPolicy.allow`，請將每個選取的 ClawRouter 參照加入其中。

  </Step>
  <Step title="選取模型">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    你也可以使用 `openclaw agent --model clawrouter/<provider>/<model> --message "..."`，為單次執行選取傳回的模型。

  </Step>
</Steps>

## 受管理的非互動式部署

將 Proxy 金鑰保留在工作負載的祕密注入機制中，並僅在 `openclaw.json` 中儲存 SecretRef。標準的受管理欄位如下：

| 用途          | 設定或環境欄位                                                           |
| ------------- | ------------------------------------------------------------------------ |
| 路由器來源    | `models.providers.clawrouter.baseUrl`                                                       |
| 認證資訊      | `models.providers.clawrouter.apiKey` -> 環境變數 SecretRef                                 |
| 祕密值        | 閘道處理程序環境中的 `CLAWROUTER_API_KEY`                                  |
| 預設模型      | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`                                 |
| 工作負載標籤  | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id`（選用）                                               |

例如，部署控制器可以管理以下 JSON5 修補檔：

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

如果部署設定了 `plugins.allow`，請保留其現有項目並加入 `clawrouter`。不使用互動式精靈即可驗證並套用：

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

試執行會解析 SecretRef，但絕不會列印其值。若要輪替認證資訊，請更新提供 `CLAWROUTER_API_KEY` 的外部 Secret，並重新啟動閘道工作負載，使新的處理程序環境載入。設定檔和模型參照不會變更。

對於從原始碼建置的獨立 Docker 閘道，ClawRouter 已包含在根執行階段中。只需選取需要個別封裝的頻道外掛，例如 `OPENCLAW_EXTENSIONS=clickclack`、`slack` 或 `msteams`；請參閱[包含所選外掛的原始碼建置映像](/zh-TW/install/docker#source-built-images-with-selected-plugins)。封存檔／設備部署必須透過各自的成品流水線封裝相同的已合併原始碼，而不能使用 OCI 映像。

## 就緒狀態與實際驗證

這些檢查會驗證不同的邊界；請勿互相替代：

```bash
# 僅檢查 ClawRouter 處理程序健康狀態；不會使用認證資訊或上游模型。
curl -fsS https://clawrouter.internal.example/v1/health

# 僅檢查 OpenClaw 閘道啟動就緒狀態；不會進行模型呼叫。
curl -fsS http://127.0.0.1:18789/readyz

# 依認證資訊範圍探索目錄。
openclaw models list --all --provider clawrouter --json

# 透過已設定的 ClawRouter 供應商執行最小的實際推論探測。
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# 使用已明確授權的模型參照執行工作負載金絲雀測試。
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "請精確回覆：CLAWROUTER_CANARY_OK" \
  --json
```

請使用受範圍限制的目錄所傳回的模型，不要直接照搬範例模型。成功的 `/readyz` 回應表示閘道可提供要求服務；這並不代表 ClawRouter、其認證資訊或上游供應商已就緒。模型探測和代理程式金絲雀測試才是推論驗證。

若要進行即時診斷，請發出金絲雀測試，並檢查閘道的標準日誌。現有僅含中繼資料的模型傳輸診斷會產生如下格式的行：

```text
[model-fetch] 啟動 provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] 回應 provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

當這些識別碼可用時，外掛會傳送有長度限制的 `X-ClawRouter-Client`、`X-ClawRouter-Agent-Id` 和 `X-ClawRouter-Session-Id` 標頭。它也會將模型呼叫的診斷 `callId`（`<run-id>:model:<n>`）對應至 `X-Request-ID`，因此 OpenClaw 模型呼叫事件可以與 ClawRouter 僅含中繼資料的稽核軌跡關聯。位於 128 字元要求 ID 限制內的值會完全相同。較長的值會保留 `:model:<n>` 後綴和確定性雜湊，使不同呼叫仍維持有界且可關聯。你可以在供應商的 `headers` 對應表中設定靜態部署中繼資料，例如 `X-ClawRouter-Project-Id`。代理程式和工作階段的歸屬標頭仍各自維持 256 字元限制。若自動要求 ID 包含 ClawRouter ASCII 識別碼集合以外的字元，則會使用相同的確定性有界格式。明確設定的標頭（包括 `X-Request-ID` 的任何大小寫變體）優先於自動值。傳輸診斷會記錄路由和回應中繼資料；不會記錄認證資訊、要求 ID、提示詞或完成內容。ClawRouter 自身的稽核事件會提供選取的上游供應商和內容保留狀態。

## 模型探索

`GET /v1/catalog` 會傳回 `{ providers: [...] }`，其中每個供應商項目都會列出各自的 `models[]`（包含上游 ID、功能和定價）及其支援的要求路由。OpenClaw 不會另行提供第二份固定的 ClawRouter 模型清單。目錄模型會在符合下列條件時公布為 OpenClaw 模型：

- 認證資訊的政策已授權其供應商；
- 目錄模型宣告支援的 LLM 功能（`llm.responses`、`llm.chat`、`llm.messages`，或具備相符串流路由的 `llm.stream`）；且
- 供應商公開下列其中一種傳輸方式的相符路由。

將模型加入受支援的 ClawRouter 供應商不需要發布新版 OpenClaw：下一次目錄重新整理（每個認證資訊範圍快取 60 秒）就會探索到該模型。需要新線路通訊協定的模型，則必須先由外掛提供支援。

## 通訊協定與供應商外掛

ClawRouter 管理上游認證資訊；其目錄會告知 OpenClaw 應使用哪種傳輸方式，因此你不必安裝每家上游公司的驗證外掛。

| 目錄功能／路由                                           | OpenClaw 傳輸方式      |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses`（OpenAI 相容供應商）                  | `openai-responses`     |
| `llm.chat`（OpenAI 相容供應商）                  | `openai-completions`     |
| `llm.messages` + `anthropic.messages` 路由             | `anthropic-messages`     |
| `llm.stream` + 串流 `google.generate_content` 路由        | `google-generative-ai`     |

此外，外掛也會套用符合這些系列的重播和工具結構描述政策（OpenAI／DeepSeek／Gemini／Perplexity 工具結構描述相容性；原生 Anthropic 和 Google Gemini 重播政策）。Perplexity 模型會進行嚴格的結構描述重寫：移除 `patternProperties` 和 `additionalProperties`，且每個物件結構描述都會宣告 `properties`，因為 Perplexity 會拒絕缺少這些項目的工具結構描述。若目錄供應商只公開不受支援的要求格式，系統會刻意不將其公布為 OpenClaw 文字模型。請在 ClawRouter 中將這些供應商正規化為其中一種受支援的合約，而不要傳送不相容的承載資料。

## 配額與用量

ClawRouter 的 `/v1/usage` 回應會供應一般的 OpenClaw 供應商用量介面：要求、Token 和支出總計；若金鑰設有限制，還會提供每月預算期間。未計量的金鑰仍會顯示彙總用量，但不會顯示百分比期間。

配額查詢會使用與模型探索相同的受範圍限制金鑰。配額查詢失敗不會阻止模型執行。

使用下列命令檢查即時快照：

```bash
openclaw status --usage
openclaw models status
```

聊天中的 `/status` 和 OpenClaw 用量 UI 也可使用相同的供應商快照。預算適用於整個政策，因此使用相同 ClawRouter 政策的其他用戶端所提出的要求，可能會改變剩餘百分比。

## 疑難排解

| 症狀                                     | 檢查                                                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 沒有 ClawRouter 模型                     | 確認外掛已啟用且獲 `plugins.allow` 允許，然後檢查認證資訊是否有效，且至少授權一個已就緒的供應商。                                              |
| 找不到已設定的 ClawRouter 模型           | 檢查其 `/v1/catalog` 功能和路由支援。系統會刻意篩除不受支援的傳輸合約。                                                                     |
| 模型覆寫遭政策拒絕                       | 將確切的目錄參照或 `clawrouter/*` 加入 `agents.defaults.modelPolicy.allow`。                                                                                 |
| 目錄或用量傳回 `401` 或 `403` | 重新核發 ClawRouter 認證資訊或調整其範圍；OpenClaw 不會改用上游供應商金鑰作為備援。                                                              |
| 模型探索後呼叫失敗                       | 檢查 ClawRouter 中的供應商連線和上游健康狀態，待其就緒狀態恢復後再重試。                                                                         |
| 用量有總計但沒有百分比                   | 該政策未計量；請在 ClawRouter 中加入每月預算，以顯示百分比期間。                                                                                 |

## 安全性行為

- 目錄探索範圍限於已設定的代理金鑰，並依每個認證資訊範圍（代理程式目錄、工作區目錄、驗證設定檔 ID 及基底 URL）快取。
- 代理金鑰僅在分派要求時附加；不會儲存在模型中繼資料中。
- 自動歸屬和要求關聯值會在分派前去除首尾空白，並拒絕控制字元。歸屬值上限為 256 個字元；要求 ID 上限為 128 個字元。
- 模型傳輸診斷僅包含中繼資料，絕不包含代理金鑰或模型內容。
- 原生 Anthropic 和 Gemini 模型 ID 僅在分派時改寫為其上游 ID。
- 不支援或未獲授權的目錄列會採封閉式失敗，且無法選取。

## 相關內容

<CardGroup cols={2}>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers" icon="layers">
    供應商設定與模型選擇。
  </Card>
  <Card title="用量追蹤" href="/zh-TW/concepts/usage-tracking" icon="chart-line">
    OpenClaw 用量與狀態介面。
  </Card>
</CardGroup>
