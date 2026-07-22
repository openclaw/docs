---
read_when:
    - 你想要透過 Ollama 使用雲端或本機模型執行 OpenClaw
    - 你需要 Ollama 的設定與配置指南
    - 你想使用 Ollama 視覺模型來理解圖片
summary: 使用 Ollama 執行 OpenClaw（雲端與本機模型）
title: Ollama
x-i18n:
    generated_at: "2026-07-22T10:45:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 80ae833d006ce307406fac11fe3457809165035a38b7e0a970777baf126cc9cb
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw 會與 Ollama 的原生 API（`/api/chat`）通訊，而非與 OpenAI 相容的
`/v1` 端點。支援三種模式：

| 模式          | 使用方式                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| 雲端 + 本機 | 可連線的 Ollama 主機，用於提供本機模型，以及（若已登入）`:cloud` 模型 |
| 僅雲端    | 直接使用 `https://ollama.com`，不使用本機常駐程式                                   |
| 僅本機    | 可連線的 Ollama 主機，僅使用本機模型                                       |

若要使用專用的 `ollama-cloud` 提供者 ID 進行僅雲端設定，請參閱
[Ollama Cloud](/zh-TW/providers/ollama-cloud)。若要將雲端路由與本機 `ollama` 提供者
分開，請使用 `ollama-cloud/<model>` 參照。

<Warning>
請勿使用 `/v1` 與 OpenAI 相容的 URL（`http://host:11434/v1`）。這會破壞工具呼叫，且模型可能會將原始工具呼叫 JSON 以純文字輸出。請使用原生 URL：`baseUrl: "http://host:11434"`（不含 `/v1`）。
</Warning>

標準設定鍵為 `baseUrl`。OpenAI SDK 風格的範例也接受
`baseURL`，但新設定應使用 `baseUrl`。

## 驗證規則

<AccordionGroup>
  <Accordion title="本機與區域網路主機">
    回送、私人網路、`.local` 與純主機名稱的 Ollama URL 不需要真正的持有人權杖。OpenClaw 會對這些主機使用 `ollama-local` 標記。
  </Accordion>
  <Accordion title="遠端與 Ollama Cloud 主機">
    公開遠端主機與 `https://ollama.com` 需要真正的認證資訊：`OLLAMA_API_KEY`、驗證設定檔或提供者的 `apiKey`。若要直接使用託管服務，建議使用 `ollama-cloud` 提供者。
  </Accordion>
  <Accordion title="自訂提供者 ID">
    具有 `api: "ollama"` 的自訂提供者遵循相同規則。例如，指向私人區域網路主機的 `ollama-remote` 提供者可以使用 `apiKey: "ollama-local"`；子代理會透過 Ollama 提供者掛鉤解析該標記，而不會將其視為缺少認證資訊。`memory.search.provider` 也可指向自訂提供者 ID，讓嵌入使用該 Ollama 端點。
  </Accordion>
  <Accordion title="驗證設定檔">
    `auth-profiles.json` 會儲存提供者 ID 的認證資訊；請將端點設定（`baseUrl`、`api`、模型、標頭、逾時）放在 `models.providers.<id>` 中。`{ "ollama-windows": { "apiKey": "ollama-local" } }` 等舊版扁平檔案不是執行階段格式；`openclaw doctor --fix` 會將它們重寫為標準的 `ollama-windows:default` API 金鑰設定檔，並建立備份。該舊版檔案中的 `baseUrl` 值是雜訊，應移至提供者設定。
  </Accordion>
  <Accordion title="記憶嵌入範圍">
    Ollama 記憶嵌入的持有人驗證僅適用於宣告它的主機：

    - 提供者層級的金鑰只會傳送至該提供者的主機。
    - `memory.search.remote.apiKey` 與各代理覆寫只會傳送至其遠端嵌入主機。
    - 單獨的 `OLLAMA_API_KEY` 環境變數值會被視為 Ollama Cloud 慣例，預設不會傳送至本機／自行託管的主機。

  </Accordion>
</AccordionGroup>

## 開始使用

<Tabs>
  <Tab title="引導設定（建議）">
    <Steps>
      <Step title="執行引導設定">
        ```bash
        openclaw onboard
        ```

        選取 **Ollama**，然後選擇模式：**雲端 + 本機**、**僅雲端** 或 **僅本機**。

        在全新的引導式設定中，OpenClaw 會先檢查預設或已設定的
        Ollama 主機。只有當 `/api/show` 確認支援工具，且上下文視窗至少為 16K 時，
        才會自動提供已安裝的模型；若缺少上下文中繼資料或視窗較小，
        則會繼續使用手動設定流程。共用的命令列介面／macOS 設定階段
        仍會在儲存前透過一次真實的補全來驗證所選路由。此自動檢查
        絕不會提取模型；如果沒有適用的已安裝模型，引導設定會繼續
        進入一般的 Ollama 選擇器。
      </Step>
      <Step title="選取模型">
        `Cloud only` 會提示輸入 `OLLAMA_API_KEY`，並建議託管雲端的預設選項。`Cloud + Local` 與 `Local only` 會提示輸入 Ollama 基底 URL、探索可用模型，並在缺少所選本機模型時自動提取。`gemma4:latest` 等已安裝的 `:latest` 標籤只會顯示一次，而不會重複 `gemma4`。`Cloud + Local` 也會檢查主機是否已登入以使用雲端存取。
      </Step>
      <Step title="驗證">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    非互動式：

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` 與 `--custom-model-id` 為選用項目；省略它們會使用本機預設主機與 `gemma4` 建議模型。

  </Tab>

  <Tab title="手動設定">
    <Steps>
      <Step title="安裝並啟動 Ollama">
        從 [ollama.com/download](https://ollama.com/download) 取得，然後提取模型：

        ```bash
        ollama pull gemma4
        ```

        若要使用混合雲端存取，請在同一台主機上執行 `ollama signin`。
      </Step>
      <Step title="設定認證資訊">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # 本機／區域網路主機，任何值皆可
        export OLLAMA_API_KEY="your-real-key"   # 僅適用於 https://ollama.com
        ```

        或在設定中使用：`openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`。
      </Step>
      <Step title="選取模型">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        或在設定中使用：

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 透過本機主機使用雲端模型

`Cloud + Local` 會透過一台可連線的 Ollama 主機路由本機與
`:cloud` 模型。這是 Ollama 的混合流程；若兩者都要使用，
請在設定期間選擇此模式。

OpenClaw 會提示輸入基底 URL、探索本機模型，並檢查
`ollama signin` 狀態。已登入時，它會建議託管服務的預設選項
（`kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`、`glm-5.2:cloud`）。
若未登入，設定會維持僅本機模式，直到你執行 `ollama signin`。

若要在沒有本機常駐程式的情況下使用僅雲端存取，請使用 `openclaw onboard --auth-choice ollama-cloud` 並參閱 [Ollama Cloud](/zh-TW/providers/ollama-cloud)；該路徑不需要 `ollama signin` 或執行中的伺服器：

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

`openclaw onboard` 期間顯示的雲端模型清單會即時從
`https://ollama.com/api/tags` 填入，最多 500 個項目，因此選擇器會反映
目前的託管目錄。如果 `ollama.com` 無法連線，或在設定時未傳回任何
模型，OpenClaw 會退回使用其硬編碼的建議清單，讓
引導設定仍可完成。

## 模型探索（隱含提供者）

當已設定 `OLLAMA_API_KEY`（或驗證設定檔），且未定義
`models.providers.ollama`，也未定義其他具有 `api: "ollama"` 的自訂提供者時，
OpenClaw 會從 `http://127.0.0.1:11434` 探索模型：

| 行為             | 詳細資訊                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目錄查詢        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| 能力偵測 | 盡力透過 `/api/show` 讀取 `contextWindow`、`num_ctx` Modelfile 參數與能力（視覺／工具／思考）                                                                                                                                                                       |
| 視覺模型        | `/api/show` 中的 `vision` 能力會將模型標記為支援影像（`input: ["text", "image"]`）                                                                                                                                                                                             |
| 推理偵測  | 可用時使用 `/api/show` 中的 `thinking` 能力；當 Ollama 省略能力時，則退回使用名稱啟發法（`r1`、`reason`、`reasoning`、`think`）。無論回報的能力為何，`glm-5.2:cloud` 與 `deepseek-v4-flash\|pro:cloud` 一律視為推理模型。 |
| 權杖限制         | `maxTokens` 預設為 OpenClaw 的 Ollama 最大權杖上限                                                                                                                                                                                                                                       |
| 費用                | 所有費用皆為 `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

設定具有明確 `models` 陣列的 `models.providers.ollama`，或設定具有
`api: "ollama"` 與非回送 `baseUrl` 的自訂提供者，會停用
自動探索；此後必須手動定義模型（請參閱
[設定](#configuration)）。指向託管 `https://ollama.com` 的
`models.providers.ollama` 項目也會略過探索，因為 Ollama Cloud 模型
由提供者管理。`http://127.0.0.2:11434` 等回送自訂提供者仍視為本機，
並保留自動探索。

你可以使用 `ollama/<pulled-model>:latest` 等完整參照，而不必
手動撰寫 `models.json` 項目；OpenClaw 會即時解析。對於已登入的
主機，選取未列出的 `ollama/<model>:cloud` 參照時，系統會使用
`/api/show` 驗證該確切模型，而且只有在 Ollama 確認中繼資料時，
才會將其加入執行階段目錄；拼字錯誤仍會因模型未知而失敗。

### 煙霧測試

若要執行略過完整代理工具介面的精簡文字探測：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "請完全依照以下內容回覆：pong" \
    --json
```

加入 `--file` 與影像，即可進行精簡的視覺模型探測（接受 PNG／JPEG／WebP；
非影像檔案會在呼叫 Ollama 前遭到拒絕；音訊請使用
`openclaw infer audio transcribe`）：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "請用一句話描述這張影像。" \
    --file ./photo.jpg \
    --json
```

這兩種路徑都不會載入聊天工具、記憶或工作階段上下文。如果這些路徑成功，
但一般代理回覆失敗，問題很可能出在模型的工具／代理能力，
而不是端點。

使用 `/model ollama/<model>` 選取模型是使用者的明確選擇：如果已設定的
`baseUrl` 無法連線，下一則回覆會因提供者錯誤而失敗，
不會無聲地回退至另一個已設定的模型。

獨立排程工作會在開始代理程式回合前加入一項本機安全檢查：
如果所選模型解析為本機／私人網路／`.local` Ollama
提供者，且 `/api/tags` 無法連線，OpenClaw 會將該次執行記錄為
`skipped`，並在錯誤文字中包含模型。此端點檢查會依主機快取
5 分鐘，因此針對已停止守護程式重複執行的排程工作不會全都
發出注定失敗的請求。

即時驗證：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

若使用 Ollama Cloud，請將相同的即時測試指向託管端點（預設會略過
嵌入；由於雲端金鑰可能未獲授權使用 `/api/embed`，
可透過 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` 強制啟用）：

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

若要新增模型，請拉取該模型，系統便會自動探索：

```bash
ollama pull mistral
```

## 節點本機推論

代理程式可將短任務委派給配對桌面電腦或伺服器節點上的 Ollama 模型。
提示與回應會透過現有且已驗證的閘道／節點連線傳輸；請求會在節點本身的
回送 Ollama 端點（`http://127.0.0.1:11434`）上執行。

<Steps>
  <Step title="在節點上啟動 Ollama">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="連線節點主機">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    在閘道主機上核准裝置及其節點命令，然後進行驗證：

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    首次連線或新增 Ollama 命令的升級，可能會觸發節點命令核准。
    如果節點連線時未公告 `ollama.models` 和 `ollama.chat`，
    請再次檢查 `openclaw nodes pending`。

  </Step>
  <Step title="從代理程式使用它">
    隨附的 Ollama 外掛會公開 `node_inference` 工具。代理程式會先呼叫
    `action: "discover"`，接著以該結果中的節點與模型呼叫
    `action: "run"`（若只連線一個具備能力的節點，
    `run` 可省略節點）。例如：“探索我的節點上的 Ollama
    模型，然後使用已載入且速度最快的模型摘要此文字。”
  </Step>
</Steps>

探索會讀取 `/api/tags`、檢查 `/api/show` 能力，並在可用時
使用 `/api/ps`，優先排列已載入的模型。它只會傳回 Ollama
回報為支援聊天的本機模型（`completion` 能力）——不包含 Ollama Cloud
項目和僅限嵌入的模型。除非工具呼叫要求不同的 `maxTokens`，
否則每次執行都會停用模型思考，並將輸出預設為 512 個權杖（硬性上限為
8192）；某些模型（例如 GPT-OSS）不支援停用思考，因此仍可能輸出推理權杖。

若要讓 Ollama 持續在節點上執行，但不向代理程式公開：

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

重新啟動節點（`openclaw node restart`；若為前景工作階段，則停止並重新執行
`openclaw node run`）。節點會停止公告 `ollama.models` 和
`ollama.chat`；Ollama 本身及閘道的 Ollama 提供者不受影響。
將值設回 `true` 並重新啟動即可重新啟用；重新連線後，
變更過的命令介面可能需要再次核准 `openclaw nodes pending`。

不經過代理程式回合，直接驗證節點命令：

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

`--invoke-timeout` 限制節點執行命令的時間；
`--timeout` 限制整體閘道呼叫的時間，且應設定得更長。

節點本機推論一律使用節點本身的回送端點——不會重複使用已設定的遠端／雲端
`models.providers.ollama.baseUrl`。節點命令預設可在 macOS、Linux 和 Windows
節點主機上使用，且仍受一般節點配對／命令原則約束。

## 視覺與影像描述

隨附的 Ollama 外掛會將 Ollama 註冊為具備影像能力的媒體理解提供者，
因此 OpenClaw 可透過本機或託管的 Ollama 視覺模型，路由明確的影像描述
請求及已設定的影像模型預設值。

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` 必須是完整的 `<provider/model>` 參照；設定後，
`infer image
describe` 會先嘗試該模型，而不會因模型已原生支援視覺功能而略過描述。
如果呼叫失敗，OpenClaw 可繼續執行 `agents.defaults.imageModel.fallbacks`；檔案／URL
準備錯誤會在嘗試回退前失敗。OpenClaw 的影像理解流程及已設定的
`imageModel` 請使用 `infer image describe`；若要使用自訂提示進行原始
多模態探測，請使用 `infer model run
--file`。

若要將 Ollama 設為傳入媒體的預設影像理解提供者：

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

建議使用完整的 `ollama/<model>` 參照。只有當 `imageModel`
之類的裸參照（例如 `qwen2.5vl:7b`）以 `input: ["text", "image"]`
列於 `models.providers.ollama.models` 下，且沒有其他已設定的影像提供者公開相同的裸 ID 時，
才會正規化為 `ollama/qwen2.5vl:7b`；否則請明確使用提供者前綴。

相較於雲端模型，速度較慢的本機視覺模型可能需要更長的影像理解逾時；
若 Ollama 嘗試配置模型所公告的完整視覺上下文，在資源受限的硬體上可能會當機。
請設定能力逾時，並限制 `num_ctx`：

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

此逾時適用於傳入影像理解及明確的 `image` 工具。
`models.providers.ollama.timeoutSeconds` 仍會控制一般模型呼叫底層 Ollama HTTP 請求的防護限制。

即時驗證：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

如果手動定義 `models.providers.ollama.models`，請明確標記視覺模型：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 會拒絕對未標記為具備影像能力的模型提出影像描述請求。
使用隱式探索時，此資訊來自 `/api/show` 的視覺能力。

## 設定

<Tabs>
  <Tab title="基本設定（隱式探索）">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    若已設定 `OLLAMA_API_KEY`，即可在提供者項目中省略 `apiKey`；OpenClaw 會為可用性檢查填入該值。
    </Tip>

  </Tab>

  <Tab title="明確設定（手動模型）">
    對於託管雲端設定、非預設主機／連接埠、強制上下文視窗或完全手動的模型清單，
    請使用明確設定：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="自訂基礎 URL">
    明確設定會停用自動探索，因此必須列出模型：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // 不要加 /v1——原生 Ollama API URL
            api: "ollama", // 明確指定：確保使用原生工具呼叫行為
            timeoutSeconds: 300, // 選用：為冷啟動的本機模型提供更長的連線／串流時間預算
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // 選用：在回合之間保持模型載入
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    請勿加入 `/v1`。該路徑會選取 OpenAI 相容模式，而此模式的工具呼叫並不可靠。
    </Warning>

  </Tab>
</Tabs>

## 常見做法

請使用 `ollama list` 或 `openclaw models list --provider ollama` 中的確切名稱取代模型 ID。

<AccordionGroup>
  <Accordion title="使用自動探索的本機模型">
    Ollama 與閘道位於同一部機器上，並自動探索：

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    除非需要手動模型，否則請勿加入 `models.providers.ollama` 區塊。

  </Accordion>

  <Accordion title="使用手動模型的區域網路 Ollama 主機">
    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` 是 OpenClaw 的上下文預算；`params.num_ctx` 會傳送至
    Ollama。當硬體無法執行模型公告的完整上下文時，請讓兩者保持一致。

  </Accordion>

  <Accordion title="僅使用 Ollama Cloud">
    不使用本機守護程式，直接使用託管模型：

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

    若要使用專用的 `ollama-cloud` 提供者 ID，而非此結構，請參閱
    [Ollama Cloud](/zh-TW/providers/ollama-cloud)。

  </Accordion>

  <Accordion title="透過已登入的常駐程式使用雲端與本機模型">
    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="多個 Ollama 主機">
    執行多個 Ollama 伺服器時，請使用自訂提供者 ID；每個提供者都有各自的
    主機、模型、驗證及逾時設定。

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    OpenClaw 會在呼叫 Ollama 前移除作用中提供者的前綴（若無法判定，則退回使用不含限定資訊的
    `ollama/` 前綴），因此 `ollama-large/qwen3.5:27b`
    傳送到 Ollama 時會變成 `qwen3.5:27b`。

  </Accordion>

  <Accordion title="精簡的本機模型設定檔">
    部分本機模型能處理簡單提示，但難以應付完整的代理程式
    工具介面。調整全域執行階段設定前，請先限制工具與上下文：

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    僅當模型或伺服器在處理工具結構描述時一再可靠地
    失敗，才使用 `compat.supportsTools: false`，因為它會犧牲代理程式能力以換取穩定性。
    除非明確要求，`localModelLean` 會從代理程式的直接介面移除資源密集的瀏覽器、排程、訊息、媒體生成、
    語音及 PDF 工具，並將較大型的目錄置於工具搜尋之後。它不會變更 Ollama 的
    執行階段上下文或思考模式。對於會陷入循環或
    將額度耗費在隱藏推理上的小型 Qwen 類思考模型，請搭配 `params.num_ctx` 與
    `params.thinking: false` 使用。

  </Accordion>
</AccordionGroup>

### 模型選擇

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

自訂提供者 ID 的運作方式相同：若模型參照使用作用中提供者的
前綴（例如 `ollama-spark/qwen3:32b`），OpenClaw 會在
呼叫 Ollama 前移除該前綴，並傳送 `qwen3:32b`。

對於速度較慢的本機模型，請優先調整提供者範圍的設定，而非提高整個
代理程式執行階段的逾時時間：

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` 涵蓋模型的 HTTP 要求：連線建立、標頭、
本文串流，以及受防護擷取的整體中止時間。`params.keep_alive` 會在原生 `/api/chat` 要求中
以頂層 `keep_alive` 的形式轉送；若首次回合的載入時間是瓶頸，請針對各模型設定此值。

### 快速驗證

```bash
# 此機器可連線至 Ollama 常駐程式
curl http://127.0.0.1:11434/api/tags

# OpenClaw 目錄與所選模型
openclaw models list --provider ollama
openclaw models status

# 直接進行模型冒煙測試
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "請只回覆：ok"
```

若使用遠端主機，請將 `127.0.0.1` 替換為 `baseUrl` 主機。如果 `curl`
可運作，但 OpenClaw 無法運作，請檢查閘道是否在不同的
機器、容器或服務帳號下執行。

## Ollama 網頁搜尋

OpenClaw 內建 **Ollama 網頁搜尋**，作為 `web_search` 提供者。

| 屬性        | 詳細資訊                                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主機        | 設定時使用 `models.providers.ollama.baseUrl`，否則使用 `http://127.0.0.1:11434`；`https://ollama.com` 會直接使用託管 API                          |
| 驗證        | 已登入的本機主機無須金鑰；直接進行 `https://ollama.com` 搜尋或使用受驗證保護的主機時，使用 `OLLAMA_API_KEY` 或已設定的提供者驗證資訊           |
| 要求        | 本機／自行託管的主機必須正在執行，並已使用 `ollama signin` 登入；直接託管搜尋需要 `baseUrl: "https://ollama.com"` 與有效的 API 金鑰 |

在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇它，或設定：

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

若要透過 Ollama Cloud 直接進行託管搜尋：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

對於自行託管的主機，OpenClaw 會先嘗試本機 `/api/experimental/web_search`
Proxy，再退回至同一主機上的託管 `/api/web_search` 路徑；
已登入的本機常駐程式通常會透過本機 Proxy 回應。直接
呼叫 `https://ollama.com` 時，一律使用託管的 `/api/web_search` 端點。

<Note>
如需完整的設定與行為說明，請參閱 [Ollama 網頁搜尋](/zh-TW/tools/ollama-search)。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="舊版 OpenAI 相容模式">
    <Warning>
    **此模式下的工具呼叫並不可靠。** 僅在 Proxy 需要 OpenAI 格式，且你不依賴原生工具呼叫時使用。
    </Warning>

    若 `/v1/chat/completions` 後方有 Proxy，請明確設定
    `api: "openai-completions"`：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // 預設值：true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    此模式可能不支援同時進行串流與工具呼叫；你
    可能需要在模型上設定 `params: { streaming: false }`。

    在此模式下，OpenClaw 預設會注入 `options.num_ctx`，避免 Ollama
    在未告知的情況下退回至 4096 個權杖的上下文。如果你的 Proxy 會拒絕
    未知的 `options` 欄位，請停用此功能：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="上下文視窗">
    對於自動探索到的模型，OpenClaw 會使用 `/api/show`
    回報的上下文視窗，包括自訂 Modelfile 中較大的
    `PARAMETER num_ctx` 值；否則會退回使用 OpenClaw 的預設 Ollama 上下文
    視窗。

    提供者層級的 `contextWindow`、`contextTokens` 與 `maxTokens` 會為
    該提供者下的所有模型設定預設值，並可由個別模型覆寫。
    `contextWindow` 是 OpenClaw 本身的提示／壓縮額度。除非你明確設定
    `params.num_ctx`，否則原生 `/api/chat` 要求不會設定 `options.num_ctx`，
    因此 Ollama 會套用其自身的模型、`OLLAMA_CONTEXT_LENGTH` 或依 VRAM 決定的預設值；
    無效、零、負數或非有限的 `params.num_ctx` 值會被忽略。如果舊版設定僅使用
    `contextWindow`/`maxTokens` 強制指定原生要求的上下文，請執行
    `openclaw doctor --fix`，將這些值複製到 `params.num_ctx`。OpenAI 相容轉接器仍會
    預設根據已設定的 `params.num_ctx` 或 `contextWindow` 注入
    `options.num_ctx`；如果上游拒絕 `options`，請使用
    `injectNumCtxForOpenAICompat: false` 停用此功能。

    原生模型項目也接受 `params` 下常見的 Ollama 執行階段選項，
    並以原生 `/api/chat` `options` 轉送：`num_keep`、`seed`、
    `num_predict`、`top_k`、`top_p`、`min_p`、`typical_p`、`repeat_last_n`、
    `temperature`、`repeat_penalty`、`presence_penalty`、`frequency_penalty`、
    `stop`、`num_batch`、`num_gpu`、`main_gpu`、`use_mmap` 及 `num_thread`。
    少數鍵（`format`、`keep_alive`、`truncate`、`shift`）會以
    頂層要求欄位轉送，而非巢狀置於 `options` 下。OpenClaw 僅會
    轉送這些 Ollama 要求鍵，因此像 `streaming` 這類僅限執行階段的參數
    絕不會傳送至 Ollama。使用 `params.think`（或
    `params.thinking`）設定頂層 `think`；`false` 會停用
    Qwen 類思考模型的 API 層級思考功能。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    每個模型的 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也
    適用；若兩者皆已設定，明確的供應商模型項目優先。

  </Accordion>

  <Accordion title="思考控制">
    OpenClaw 會依 Ollama 預期的方式轉送思考設定：使用頂層 `think`，而非
    `options.think`。若自動探索模型的 `/api/show` 回報
    `thinking` 能力，便會公開 `/think low`、`/think medium`、`/think high`
    和 `/think max`；非思考模型則只公開 `/think off`。

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    或設定模型預設值：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    每個模型的 `params.think`/`params.thinking` 可針對特定模型停用或強制啟用 API
    思考。當作用中的執行只有隱含的 `off` 預設值時，OpenClaw 會保留該明確設定；
    但如 `/think medium` 之類非關閉狀態的執行階段命令仍會覆寫它。對於明確標示為
    `reasoning: false` 的模型，絕不會傳送真值的思考要求；無論如何都會傳送
    `think: false` 要求。

  </Accordion>

  <Accordion title="推理模型">
    名為 `deepseek-r1`、`reasoning`、`reason` 或 `think` 的模型，
    預設會視為具備推理能力，不需要額外設定：

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="模型成本">
    Ollama 在本機執行且免費，因此自動探索及手動定義模型的所有模型成本皆為
    `0`。
  </Accordion>

  <Accordion title="記憶嵌入">
    隨附的 Ollama 外掛會為[記憶搜尋](/zh-TW/concepts/memory)註冊記憶嵌入供應商。
    它會使用已設定的 Ollama 基底 URL 和 API 金鑰、呼叫 `/api/embed`，
    並在可能時將多個記憶區塊合併至單一 `input` 要求中。

    當 `proxy.enabled=true` 時，對於從已設定的 `baseUrl` 衍生出的確切主機本機
    迴路來源，嵌入要求會使用 OpenClaw 受防護的直接路徑，而非受管理的正向代理。
    設定的主機名稱本身必須是 `localhost` 或迴路 IP 常值；僅透過 DNS 解析至
    迴路的名稱仍會使用受管理的代理路徑。區域網路、tailnet、私人網路及公用 Ollama
    主機一律使用受管理的代理路徑，重新導向至其他主機／連接埠時也不會繼承信任。
    `proxy.loopbackMode: "proxy"` 仍會透過代理路由迴路流量；`proxy.loopbackMode: "block"` 則會在連線前拒絕；
    請參閱[受管理的代理](/zh-TW/security/network-proxy#gateway-loopback-mode)。

    | 屬性 | 值 |
    | --- | --- |
    | 預設模型 | `nomic-embed-text` |
    | 自動提取 | 是，若本機不存在 |
    | 預設行內並行數 | 1（其他供應商的預設值較高；若主機能夠承受，請使用 `nonBatchConcurrency` 提高此值） |

    查詢時嵌入會對需要或建議使用檢索前綴的模型套用前綴：
    `nomic-embed-text`、`qwen3-embedding` 和
    `mxbai-embed-large`。文件批次維持原始內容，因此現有索引不需要
    格式遷移。

    ```json5
    {
      memory: {
        search: {
          provider: "ollama",
          remote: {
            // Ollama 的預設值。若在較大型主機上重新建立索引太慢，請提高此值。
            nonBatchConcurrency: 1,
          },
        },
      },
    }
    ```

    對於遠端嵌入主機，請將驗證範圍限制於該主機：

    ```json5
    {
      memory: {
        search: {
          provider: "ollama",
          model: "nomic-embed-text",
          remote: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            nonBatchConcurrency: 2,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="串流設定">
    Ollama 預設使用**原生 API**（`/api/chat`），可同時支援
    串流與工具呼叫，不需要特殊設定。

    對於原生要求，思考控制會直接轉送：除非已設定明確的
    `params.think`/`params.thinking`，否則 `/think off`
    和 `openclaw agent --thinking off` 會傳送頂層 `think: false`；`/think
    low|medium|high` 會傳送相符的努力程度字串；
    `/think max` 會對應至 Ollama 的最高努力程度 `think: "high"`。

    <Tip>
    若要改用 OpenAI 相容端點，請參閱上方的「舊版 OpenAI 相容模式」；該模式可能無法同時使用串流與工具呼叫。
    </Tip>

  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="WSL2 當機循環（反覆重新啟動）">
    在使用 NVIDIA/CUDA 的 WSL2 上，Ollama 官方 Linux 安裝程式會建立
    一個具有 `Restart=always` 的 `ollama.service` systemd 單元。若該服務
    自動啟動並在 WSL2 開機期間載入由 GPU 支援的模型，Ollama 可能在載入時
    鎖定主機記憶體；Hyper-V 記憶體回收不一定能回收這些頁面，因此 Windows
    可能會終止 WSL2 VM，systemd 接著重新啟動 Ollama，導致循環反覆發生。

    證據：WSL2 反覆重新啟動／終止、WSL2 啟動後 `app.slice` 或
    `ollama.service` 立即出現高 CPU 使用率，以及 SIGTERM 來自 systemd，
    而非 Linux OOM 終止程式。

    當 OpenClaw 偵測到 WSL2、已使用 `Restart=always` 啟用
    `ollama.service`，且可見 CUDA 標記時，會記錄啟動警告。

    緩解方式：

    ```bash
    sudo systemctl disable ollama
    ```

    在 Windows 端，將以下內容新增至 `%USERPROFILE%\.wslconfig`，然後執行
    `wsl --shutdown`：

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    或縮短保持連線時間／僅在需要時手動啟動 Ollama：

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    請參閱 [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)。

  </Accordion>

  <Accordion title="未偵測到 Ollama">
    確認 Ollama 正在執行、已設定 `OLLAMA_API_KEY`（或驗證設定檔），
    且**未**明確定義 `models.providers.ollama`：

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="沒有可用的模型">
    在本機提取模型，或在 `models.providers.ollama`
    中明確定義模型：

    ```bash
    ollama list  # 查看已安裝的項目
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # 或其他模型
    ```

  </Accordion>

  <Accordion title="連線遭拒">
    ```bash
    # 檢查 Ollama 是否正在執行
    ps aux | grep ollama

    # 或重新啟動 Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="遠端主機可透過 curl 存取，但 OpenClaw 無法存取">
    請從執行閘道的同一台機器與執行階段進行驗證：

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    常見原因：

    - `baseUrl` 指向 `localhost`，但閘道在 Docker 或其他主機上執行。
    - 該 URL 使用 `/v1`，因此選用 OpenAI 相容行為，而非原生 Ollama。
    - 遠端主機需要變更防火牆或區域網路繫結。
    - 模型位於你筆記型電腦的常駐程式上，而非遠端常駐程式。

  </Accordion>

  <Accordion title="模型將工具 JSON 輸出為文字">
    通常是因為供應商處於 OpenAI 相容模式，或模型無法
    處理工具結構描述。請優先使用原生模式：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    若小型本機模型仍無法處理工具結構描述，請在該模型項目上設定
    `compat.supportsTools: false`，然後重新測試。

  </Accordion>

  <Accordion title="Kimi 或 GLM 傳回亂碼符號">
    若託管的 Kimi/GLM 回應由冗長、非語言性符號序列構成，會將其
    視為供應商呼叫失敗，而非成功回覆，因此會接手執行一般的
    重試／備援／錯誤處理，而不會將損毀文字保存至工作階段。

    若問題再次發生，請擷取模型名稱、目前的工作階段檔案，以及
    該次執行使用的是 `Cloud + Local` 還是 `Cloud only`，然後嘗試新的
    工作階段與備援模型：

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "請只回覆：ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="冷啟動的本機模型逾時">
    大型本機模型首次載入可能需要很長時間。將逾時範圍限制於
    Ollama 供應商，並可選擇讓模型在各輪之間保持載入：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    若主機本身接受連線的速度較慢，`timeoutSeconds` 也會
    延長此供應商受防護的連線逾時。

  </Accordion>

  <Accordion title="大型內容脈絡模型太慢或耗盡記憶體">
    許多模型宣告的內容脈絡大於硬體能順暢執行的範圍。
    除非設定 `params.num_ctx`，否則原生 Ollama 會使用自己的執行階段預設值。
    同時限制 OpenClaw 的預算與 Ollama 的要求內容脈絡，可讓首個 Token 延遲更可預測：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    若 OpenClaw 傳送過多提示詞，請降低 `contextWindow`。
    若 Ollama 的執行階段內容脈絡對該機器而言過大，請降低
    `params.num_ctx`。若生成執行時間過長，請降低 `maxTokens`。

  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting)和[常見問題](/zh-TW/help/faq)。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/zh-TW/providers/ollama-cloud" icon="cloud">
    使用專用 `ollama-cloud` 供應商的純雲端設定。
  </Card>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers" icon="layers">
    所有供應商、模型參照及容錯移轉行為的概觀。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/models" icon="brain">
    如何選擇及設定模型。
  </Card>
  <Card title="Ollama 網頁搜尋" href="/zh-TW/tools/ollama-search" icon="magnifying-glass">
    Ollama 驅動網頁搜尋的完整設定與行為詳細資訊。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考。
  </Card>
</CardGroup>
