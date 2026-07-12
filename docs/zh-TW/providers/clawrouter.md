---
read_when:
    - 你想要使用一個受管理的金鑰來存取多個模型提供者
    - 你需要在 OpenClaw 中使用 ClawRouter 模型探索或配額報告功能
summary: 透過 ClawRouter 路由認證資訊範圍限定的模型，並顯示受管理的配額
title: ClawRouter
x-i18n:
    generated_at: "2026-07-12T14:45:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter 讓 OpenClaw 能以一組受政策範圍限制的金鑰使用多個上游模型
供應商。內建的 `clawrouter` 外掛只會探索該金鑰獲准使用的模型，
依各模型宣告的通訊協定進行路由，並在 OpenClaw 的用量介面上回報
該金鑰的預算與彙總用量。

上游認證資訊與供應商專屬的轉送作業都留在 ClawRouter 中，因此
你不必在 OpenClaw 主機上安裝或驗證每個上游供應商外掛。
此外掛隨 OpenClaw 內建提供（`enabledByDefault: true`）；
你只需要一組已核發的 ClawRouter 認證資訊。

| 屬性          | 值                                       |
| ------------- | ---------------------------------------- |
| 供應商        | `clawrouter`                             |
| 外掛          | 內建（包含於 OpenClaw）                  |
| 驗證          | `CLAWROUTER_API_KEY`                     |
| 預設 URL      | `https://clawrouter.openclaw.ai`         |
| 模型目錄      | 透過 `/v1/catalog` 依認證資訊範圍提供    |
| 配額          | 透過 `/v1/usage` 提供每月預算與用量      |

## 開始使用

<Steps>
  <Step title="取得限定範圍的認證資訊">
    向你的 ClawRouter 管理員索取認證資訊，其政策應包含
    你應使用的供應商、模型與每月預算。認證資訊核發時只會顯示一次。
  </Step>
  <Step title="設定 OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` 已內建並預設啟用。如果你的設定指定了
    `plugins.allow`，請先將 `clawrouter` 加入該清單，再啟用此外掛。
    若為自訂部署，請將 `models.providers.clawrouter.baseUrl` 設為
    ClawRouter 的來源位址；預設值為 `https://clawrouter.openclaw.ai`。

  </Step>
  <Step title="列出獲准使用的模型">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    請完全依照回傳結果使用模型參照。這些參照會保留上游
    命名空間，例如 `clawrouter/openai/gpt-5.5`、
    `clawrouter/anthropic/claude-sonnet-4-6` 或
    `clawrouter/google/gemini-3.5-flash`。如果你的設定將
    `agents.defaults.models` 作為允許清單，請將每個選定的
    ClawRouter 參照加入其中。

  </Step>
  <Step title="選取模型">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    你也可以使用
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`
    為單次執行選取回傳的模型。

  </Step>
</Steps>

## 受管理的非互動式部署

請將代理金鑰保存在工作負載的密鑰注入機制中，並只在
`openclaw.json` 中儲存 SecretRef。標準的受管理欄位如下：

| 用途          | 設定或環境欄位                                                           |
| ------------- | ------------------------------------------------------------------------ |
| 路由器來源    | `models.providers.clawrouter.baseUrl`                                    |
| 認證資訊      | `models.providers.clawrouter.apiKey` -> env SecretRef                    |
| 密鑰值        | 閘道程序環境中的 `CLAWROUTER_API_KEY`                                    |
| 預設模型      | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| 工作負載標籤  | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id`（選用）    |

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

如果部署設定了 `plugins.allow`，請保留其中現有的項目並加入
`clawrouter`。不使用互動式精靈即可驗證並套用：

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

試執行會解析 SecretRef，但絕不會印出其值。若要輪替
認證資訊，請更新提供 `CLAWROUTER_API_KEY` 的外部 Secret，並
重新啟動閘道工作負載，以載入新的程序環境。設定檔與模型參照
都不需要變更。

對於從原始碼建置的獨立 Docker 閘道，ClawRouter 已包含在
根執行階段中。只需選取需要獨立封裝的頻道外掛，
例如 `OPENCLAW_EXTENSIONS=clickclack`、`slack` 或 `msteams`；請參閱
[含所選外掛的原始碼建置映像](/zh-TW/install/docker#source-built-images-with-selected-plugins)。
封存檔／設備式部署必須透過自身的成品管線封裝相同的已整合原始碼，
而不是使用 OCI 映像。

## 就緒狀態與即時證明

這些檢查會證明不同的邊界；請勿互相替代：

```bash
# 僅檢查 ClawRouter 程序健康狀態；不會使用認證資訊或上游模型。
curl -fsS https://clawrouter.internal.example/v1/health

# 僅檢查 OpenClaw 閘道啟動就緒狀態；不會呼叫模型。
curl -fsS http://127.0.0.1:18789/readyz

# 依認證資訊範圍探索目錄。
openclaw models list --all --provider clawrouter --json

# 透過已設定的 ClawRouter 供應商執行最小的真實推論探測。
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# 使用確切獲准模型參照的工作負載金絲雀測試。
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "請精確回覆：CLAWROUTER_CANARY_OK" \
  --json
```

請使用限定範圍的目錄所回傳的模型，而不要盲目複製範例
模型。成功的 `/readyz` 回應表示閘道可以處理
要求；這不代表 ClawRouter、其認證資訊或上游
供應商已就緒。模型探測與代理程式金絲雀測試才是推論證明。

進行即時診斷時，請發出金絲雀測試並檢查閘道的標準記錄。
現有僅含中繼資料的模型傳輸診斷會輸出如下形式的行：

```text
[model-fetch] 開始 provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] 回應 provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

當這些識別碼可用時，此外掛會傳送有長度限制的
`X-ClawRouter-Client`、`X-ClawRouter-Agent-Id` 和
`X-ClawRouter-Session-Id` 標頭。此外掛也會將模型呼叫的診斷
`callId`（`<run-id>:model:<n>`）對應至
`X-Request-ID`，讓 OpenClaw 模型呼叫事件可以與 ClawRouter
僅含中繼資料的稽核軌跡建立關聯。位於 128 個字元要求 ID 預算內的值
會完全相同。較長的值會保留 `:model:<n>` 後綴與確定性
雜湊，使不同呼叫仍能維持長度限制並可建立關聯。靜態部署中繼資料
（例如 `X-ClawRouter-Project-Id`）可在供應商的 `headers` 對應表中設定。
代理程式與工作階段歸屬標頭則保留各自的 256 個字元
限制。若自動要求 ID 包含 ClawRouter ASCII
識別碼集合以外的字元，會使用相同的確定性有界形式。
明確設定的標頭（包括任何大小寫形式的 `X-Request-ID`）優先於
自動值。傳輸診斷會記錄路由與回應
中繼資料；不會記錄認證資訊、要求 ID、提示詞或完成內容。
ClawRouter 自身的稽核事件會提供所選上游供應商與
內容保留狀態。

## 模型探索

`GET /v1/catalog` 會回傳 `{ providers: [...] }`，其中每個供應商項目
會列出自己的 `models[]`（包含上游 ID、功能與定價）及其
支援的要求路由。OpenClaw 不會另外提供一份固定的
ClawRouter 模型清單。目錄模型會在符合以下條件時公告為 OpenClaw 模型：

- 認證資訊的政策允許使用其供應商；
- 目錄模型公告支援的 LLM 功能（`llm.responses`、
  `llm.chat`、`llm.messages`，或具有相符串流
  路由的 `llm.stream`）；以及
- 供應商公開符合下列其中一種傳輸方式的路由。

將模型加入受支援的 ClawRouter 供應商不需要發布 OpenClaw 新版本：
下次目錄重新整理（每個認證資訊範圍快取 60 秒）就會探索到
該模型。需要新線路通訊協定的模型，必須先由外掛提供支援。

## 通訊協定與供應商外掛

ClawRouter 擁有上游認證資訊；其目錄會告知 OpenClaw 應使用哪種
傳輸方式，因此你不需要安裝每家上游公司的驗證外掛。

| 目錄功能／路由                                           | OpenClaw 傳輸方式      |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses`（OpenAI 相容供應商）                     | `openai-responses`     |
| `llm.chat`（OpenAI 相容供應商）                          | `openai-completions`   |
| `llm.messages` + `anthropic.messages` 路由               | `anthropic-messages`   |
| `llm.stream` + 串流 `google.generate_content` 路由       | `google-generative-ai` |

此外掛也會為這些系列套用相符的重播與工具結構描述政策
（OpenAI／DeepSeek／Gemini 工具結構描述相容性；原生 Anthropic 與
Google Gemini 重播政策）。若目錄供應商只公開
不受支援的要求格式，系統會刻意不將其公告為 OpenClaw
文字模型。請在 ClawRouter 中將這些供應商正規化為
其中一種受支援的合約，而不要傳送不相容的承載資料。

## 配額與用量

ClawRouter 的 `/v1/usage` 回應會提供給一般的 OpenClaw 供應商用量
介面：要求、權杖與花費總計，以及金鑰設有限額時的每月預算
期間。無計量金鑰仍會顯示彙總用量，但不會顯示
百分比期間。

配額查詢會使用與模型探索相同的限定範圍金鑰。配額
查詢失敗不會阻止模型執行。

使用以下命令查看即時快照：

```bash
openclaw status --usage
openclaw models status
```

相同的供應商快照也可用於聊天中的 `/status` 和 OpenClaw 的
用量 UI。預算適用於整個政策，因此另一個使用
相同 ClawRouter 政策的用戶端所發出的要求可能會改變剩餘百分比。

## 疑難排解

| 症狀                                     | 檢查                                                                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 沒有 ClawRouter 模型                     | 確認此外掛已啟用且獲 `plugins.allow` 允許，然後檢查認證資訊是否有效，並允許至少一個已就緒的供應商。                                                           |
| 已設定的 ClawRouter 模型遺失             | 檢查其 `/v1/catalog` 功能與路由支援情況。系統會刻意篩除不受支援的傳輸合約。                                                                                   |
| `Unknown model: clawrouter/...`          | 當該設定對應表被用作允許清單時，請將確切的目錄參照加入 `agents.defaults.models`。                                                                             |
| 目錄或用量回傳 `401` 或 `403`            | 重新核發 ClawRouter 認證資訊或調整其範圍；OpenClaw 不會改用上游供應商金鑰。                                                                                   |
| 探索後模型呼叫失敗                       | 檢查 ClawRouter 中的供應商連線與上游健康狀態，然後在其就緒狀態恢復後重試。                                                                                    |
| 用量有總計但沒有百分比                   | 此政策未計量；請在 ClawRouter 中加入每月預算，以顯示百分比期間。                                                                                             |

## 安全性行為

- 目錄探索範圍限定於已設定的代理金鑰，並依各認證資訊範圍（代理程式目錄、工作區目錄、驗證設定檔 ID 與基礎 URL）分別快取。
- 代理金鑰只會在分派請求時附加；不會儲存於模型中繼資料。
- 自動歸屬與請求關聯值會先去除前後空白，並拒絕控制字元，之後才進行分派。歸屬值上限為 256 個字元；請求 ID 上限為 128 個字元。
- 模型傳輸診斷僅包含中繼資料，絕不包含代理金鑰或模型內容。
- 原生 Anthropic 與 Gemini 模型 ID 只會在分派時改寫為其上游 ID。
- 不支援或未獲授權的目錄資料列會採取封閉式失敗，且不可選取。

## 相關內容

<CardGroup cols={2}>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers" icon="layers">
    供應商設定與模型選擇。
  </Card>
  <Card title="用量追蹤" href="/zh-TW/concepts/usage-tracking" icon="chart-line">
    OpenClaw 用量與狀態介面。
  </Card>
</CardGroup>
