---
read_when:
    - 你想要透過 Ollama 使用雲端或本機模型執行 OpenClaw
    - 你需要 Ollama 的設定與配置指南
    - 你想要使用 Ollama 視覺模型來理解影像
summary: 使用 Ollama（雲端與本機模型）執行 OpenClaw
title: Ollama
x-i18n:
    generated_at: "2026-07-11T21:43:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw 會與 Ollama 的原生 API（`/api/chat`）通訊，而非與 OpenAI 相容的
`/v1` 端點。支援三種模式：

| 模式          | 使用方式                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| 雲端 + 本機 | 可連線的 Ollama 主機，提供本機模型，以及（若已登入）`:cloud` 模型 |
| 僅雲端    | 直接使用 `https://ollama.com`，不需要本機常駐程式                                   |
| 僅本機    | 可連線的 Ollama 主機，僅提供本機模型                                       |

若要使用專用的 `ollama-cloud` 提供者 ID 進行僅雲端設定，請參閱
[Ollama Cloud](/zh-TW/providers/ollama-cloud)。當你想讓雲端路由與本機 `ollama`
提供者保持分離時，請使用 `ollama-cloud/<model>` 參照。

<Warning>
請勿使用與 OpenAI 相容的 `/v1` URL（`http://host:11434/v1`）。這會導致工具呼叫失效，且模型可能將原始工具呼叫 JSON 當成純文字輸出。請使用原生 URL：`baseUrl: "http://host:11434"`（不含 `/v1`）。
</Warning>

標準設定鍵為 `baseUrl`。為了相容 OpenAI SDK 風格的範例，也接受
`baseURL`，但新設定應使用 `baseUrl`。

## 驗證規則

<AccordionGroup>
  <Accordion title="本機與區域網路主機">
    local loopback、私人網路、`.local` 與不含網域的主機名稱 Ollama URL 不需要真正的 Bearer 權杖。OpenClaw 對這些主機使用 `ollama-local` 標記。
  </Accordion>
  <Accordion title="遠端與 Ollama Cloud 主機">
    公開遠端主機與 `https://ollama.com` 需要真正的憑證：`OLLAMA_API_KEY`、驗證設定檔或提供者的 `apiKey`。若要直接使用託管服務，建議使用 `ollama-cloud` 提供者。
  </Accordion>
  <Accordion title="自訂提供者 ID">
    使用 `api: "ollama"` 的自訂提供者遵循相同規則。例如，指向私人區域網路主機的 `ollama-remote` 提供者可以使用 `apiKey: "ollama-local"`；子代理會透過 Ollama 提供者掛鉤解析該標記，而不會將其視為缺少憑證。`agents.defaults.memorySearch.provider` 也可以指向自訂提供者 ID，讓嵌入使用該 Ollama 端點。
  </Accordion>
  <Accordion title="驗證設定檔">
    `auth-profiles.json` 儲存提供者 ID 的憑證；請將端點設定（`baseUrl`、`api`、模型、標頭、逾時）放在 `models.providers.<id>` 中。較舊的扁平檔案（例如 `{ "ollama-windows": { "apiKey": "ollama-local" } }`）不是執行階段格式；`openclaw doctor --fix` 會將其重寫為標準的 `ollama-windows:default` API 金鑰設定檔，並建立備份。該舊版檔案中的 `baseUrl` 值是雜訊，應移至提供者設定。
  </Accordion>
  <Accordion title="記憶嵌入範圍">
    Ollama 記憶嵌入的 Bearer 驗證僅限於宣告它的主機：

    - 提供者層級的金鑰只會傳送至該提供者的主機。
    - `agents.*.memorySearch.remote.apiKey` 只會傳送至其遠端嵌入主機。
    - 單獨的 `OLLAMA_API_KEY` 環境變數值會被視為 Ollama Cloud 慣例，預設不會傳送至本機／自行託管的主機。

  </Accordion>
</AccordionGroup>

## 開始使用

<Tabs>
  <Tab title="初始設定（建議）">
    <Steps>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard
        ```

        選取 **Ollama**，然後選擇模式：**雲端 + 本機**、**僅雲端** 或 **僅本機**。
      </Step>
      <Step title="選取模型">
        `Cloud only` 會提示輸入 `OLLAMA_API_KEY`，並建議託管的雲端預設值。`Cloud + Local` 與 `Local only` 會提示輸入 Ollama 基礎 URL、探索可用模型，若所選本機模型尚未存在，則自動下載該模型。已安裝的 `:latest` 標籤（例如 `gemma4:latest`）只會顯示一次，不會重複顯示 `gemma4`。`Cloud + Local` 也會檢查主機是否已登入以取得雲端存取權。
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

    `--custom-base-url` 與 `--custom-model-id` 為選用；省略時會使用本機預設主機與建議模型 `gemma4`。

  </Tab>

  <Tab title="手動設定">
    <Steps>
      <Step title="安裝並啟動 Ollama">
        從 [ollama.com/download](https://ollama.com/download) 取得，然後下載模型：

        ```bash
        ollama pull gemma4
        ```

        若要使用混合雲端存取，請在同一主機上執行 `ollama signin`。
      </Step>
      <Step title="設定憑證">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # 本機／區域網路主機，任何值皆可
        export OLLAMA_API_KEY="your-real-key"   # 僅適用於 https://ollama.com
        ```

        或在設定中執行：`openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`。
      </Step>
      <Step title="選取模型">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        或在設定中：

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

`Cloud + Local` 會透過同一個可連線的 Ollama 主機路由本機模型與
`:cloud` 模型——這是 Ollama 的混合流程；若你同時需要兩者，請在設定時
選擇此模式。

OpenClaw 會提示輸入基礎 URL、探索本機模型，並檢查
`ollama signin` 狀態。登入後，它會建議託管的預設模型
（`kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`、`glm-5.2:cloud`）。
若尚未登入，設定會維持僅限本機，直到你執行 `ollama signin`。

若要在沒有本機常駐程式的情況下僅使用雲端存取，請執行 `openclaw onboard --auth-choice ollama-cloud` 並參閱 [Ollama Cloud](/zh-TW/providers/ollama-cloud)——此路徑不需要 `ollama signin` 或執行中的伺服器：

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

`openclaw onboard` 期間顯示的雲端模型清單會即時從
`https://ollama.com/api/tags` 載入，上限為 500 個項目，因此選擇器會反映
目前的託管目錄。若設定時無法連線至 `ollama.com` 或它未傳回任何模型，
OpenClaw 會退回使用內建的建議清單，讓初始設定仍可完成。

## 模型探索（隱含提供者）

設定 `OLLAMA_API_KEY`（或驗證設定檔）後，若既未定義
`models.providers.ollama`，也未定義另一個使用 `api: "ollama"` 的自訂提供者，
OpenClaw 會從 `http://127.0.0.1:11434` 探索模型：

| 行為             | 詳細資訊                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目錄查詢        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| 功能偵測 | 盡力透過 `/api/show` 讀取 `contextWindow`、`num_ctx` Modelfile 參數與功能（視覺／工具／思考）                                                                                                                                                                       |
| 視覺模型        | `/api/show` 傳回的 `vision` 功能會將模型標記為可處理影像（`input: ["text", "image"]`）                                                                                                                                                                                             |
| 推理偵測  | 可用時使用 `/api/show` 傳回的 `thinking` 功能；當 Ollama 省略功能資訊時，則退回使用名稱啟發式判斷（`r1`、`reason`、`reasoning`、`think`）。無論回報的功能為何，`glm-5.2:cloud` 與 `deepseek-v4-flash\|pro:cloud` 一律視為推理模型。 |
| 權杖限制         | `maxTokens` 預設為 OpenClaw 的 Ollama 權杖上限                                                                                                                                                                                                                                       |
| 成本                | 所有成本皆為 `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

若設定含有明確 `models` 陣列的 `models.providers.ollama`，或設定使用
`api: "ollama"` 且 `baseUrl` 非 local loopback 的自訂提供者，將停用
自動探索；之後必須手動定義模型（請參閱
[設定](#configuration)）。指向託管 `https://ollama.com` 的
`models.providers.ollama` 項目也會略過探索，因為 Ollama Cloud 模型
由提供者管理。local loopback 自訂提供者（例如
`http://127.0.0.2:11434`）仍視為本機並保留自動探索。

你可以使用完整參照（例如 `ollama/<pulled-model>:latest`），而不需要
手動撰寫 `models.json` 項目；OpenClaw 會即時解析它。對於已登入的
主機，選取未列出的 `ollama/<model>:cloud` 參照時，會透過 `/api/show`
驗證該特定模型，且只有在 Ollama 確認中繼資料後，才會將其加入執行階段
目錄——拼字錯誤仍會因未知模型而失敗。

### 冒煙測試

若要執行略過完整代理工具介面的精簡文字探測：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

加入附帶影像的 `--file`，即可精簡探測視覺模型（接受 PNG／JPEG／WebP；
非影像檔案會在呼叫 Ollama 前遭拒——音訊請使用
`openclaw infer audio transcribe`）：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

這兩種路徑都不會載入聊天工具、記憶或工作階段內容。若此探測成功，
但一般代理回覆失敗，問題可能出在模型的工具／代理能力，而不是端點。

使用 `/model ollama/<model>` 選取模型屬於使用者的精確選擇：若設定的
`baseUrl` 無法連線，下一則回覆會傳回提供者錯誤，而不會無聲地退回至
另一個已設定的模型。

隔離的排程工作在開始代理回合前會增加一項本機安全檢查：
若所選模型解析至本機／私人網路／`.local` Ollama 提供者，且無法連線至
`/api/tags`，OpenClaw 會將該次執行記錄為 `skipped`，錯誤文字中會包含模型。
此端點檢查會依主機快取 5 分鐘，因此對已停止的常駐程式重複執行排程工作時，
不會全部啟動注定失敗的請求。

即時驗證：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

若使用 Ollama Cloud，請將相同的即時測試指向託管端點（預設會略過嵌入；由於雲端金鑰可能無權存取 `/api/embed`，可設定 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` 強制測試）：

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

若要新增模型，請先拉取該模型，系統便會自動探索：

```bash
ollama pull mistral
```

## 節點本機推論

代理程式可以將短任務委派給已配對桌面裝置或伺服器節點上的 Ollama 模型。提示詞與回應會透過現有且已驗證的閘道／節點連線傳輸；請求會在節點自身的 local loopback Ollama 端點（`http://127.0.0.1:11434`）上執行。

<Steps>
  <Step title="Start Ollama on the node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Connect the node host">
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

    首次連線或新增 Ollama 命令的升級可能會觸發節點命令核准。如果節點連線時未公布 `ollama.models` 與 `ollama.chat`，請再次檢查 `openclaw nodes pending`。

  </Step>
  <Step title="Use it from an agent">
    隨附的 Ollama 外掛會公開 `node_inference` 工具。代理程式會先呼叫 `action: "discover"`，接著使用該結果中的節點與模型呼叫 `action: "run"`（如果只連線了一個具備相應能力的節點，`run` 可以省略節點）。例如：「探索我的節點上的 Ollama 模型，然後使用已載入且速度最快的模型摘要這段文字。」
  </Step>
</Steps>

探索程序會讀取 `/api/tags`、檢查 `/api/show` 的能力，並在可用時使用 `/api/ps`，優先排列已載入的模型。它只會傳回 Ollama 回報為具備聊天能力（`completion` 能力）的本機模型，而不包含 Ollama Cloud 項目與僅支援嵌入的模型。除非工具呼叫要求不同的 `maxTokens`，否則每次執行都會停用模型思考，並將輸出預設為 512 個權杖（硬性上限為 8192）；部分模型（例如 GPT-OSS）不支援停用思考，因此仍可能輸出推理權杖。

若要讓 Ollama 持續在節點上執行，但不向代理程式公開：

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

重新啟動節點（`openclaw node restart`；若為前景工作階段，則停止並重新執行 `openclaw node run`）。節點將停止公布 `ollama.models` 與 `ollama.chat`；Ollama 本身以及閘道的 Ollama 提供者不受影響。將值設回 `true` 並重新啟動即可重新啟用；重新連線後，變更過的命令介面可能需要再次透過 `openclaw nodes pending` 核准。

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

`--invoke-timeout` 限制節點可執行命令的時間；`--timeout` 限制整體閘道呼叫的時間，因此應設定得更長。

節點本機推論一律使用節點自身的 local loopback 端點，不會重複使用已設定的遠端／雲端 `models.providers.ollama.baseUrl`。節點命令預設可在 macOS、Linux 與 Windows 節點主機上使用，且仍受一般節點配對／命令政策約束。

## 視覺與影像描述

隨附的 Ollama 外掛會將 Ollama 註冊為支援影像的媒體理解提供者，因此 OpenClaw 可以將明確的影像描述請求與已設定的影像模型預設值，路由至本機或託管的 Ollama 視覺模型。

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` 必須是完整的 `<provider/model>` 參照；設定後，`infer image describe` 會優先嘗試該模型，而不會因模型已原生支援視覺而略過描述。如果呼叫失敗，OpenClaw 可以繼續依序嘗試 `agents.defaults.imageModel.fallbacks`；檔案／URL 準備錯誤會在嘗試備援前失敗。若要使用 OpenClaw 的影像理解流程與已設定的 `imageModel`，請使用 `infer image describe`；若要以自訂提示詞進行原始多模態探測，請使用 `infer model run --file`。

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

建議使用完整的 `ollama/<model>` 參照。只有在 `models.providers.ollama.models` 下列出完全相符的模型、其設定為 `input: ["text", "image"]`，且沒有其他已設定的影像提供者公開相同的裸露 ID 時，像 `qwen2.5vl:7b` 這樣不含提供者的 `imageModel` 參照才會正規化為 `ollama/qwen2.5vl:7b`；否則請明確使用提供者前綴。

相較於雲端模型，速度較慢的本機視覺模型可能需要更長的影像理解逾時；如果 Ollama 嘗試配置模型所公布的完整視覺上下文，還可能在資源受限的硬體上崩潰。請設定能力逾時並限制 `num_ctx`：

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

此逾時適用於傳入影像理解與明確的 `image` 工具。`models.providers.ollama.timeoutSeconds` 仍會控制一般模型呼叫之底層 Ollama HTTP 請求的防護逾時。

即時驗證：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

如果手動定義 `models.providers.ollama.models`，請明確標示視覺模型：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 會拒絕未標示為支援影像之模型的影像描述請求。使用隱式探索時，此資訊來自 `/api/show` 的視覺能力。

## 設定

<Tabs>
  <Tab title="Basic (implicit discovery)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果已設定 `OLLAMA_API_KEY`，可以在提供者項目中省略 `apiKey`；OpenClaw 會自動填入該值以執行可用性檢查。
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    若使用託管雲端設定、非預設主機／連接埠、強制指定上下文視窗，或完全手動維護模型清單，請使用明確設定：

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

  <Tab title="Custom base URL">
    明確設定會停用自動探索，因此必須列出模型：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - native Ollama API URL
            api: "ollama", // Explicit: guarantees native tool-calling behavior
            timeoutSeconds: 300, // Optional: longer connect/stream budget for cold local models
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    請勿新增 `/v1`。該路徑會選用 OpenAI 相容模式，而此模式下的工具呼叫並不可靠。
    </Warning>

  </Tab>
</Tabs>

## 常見做法

請將模型 ID 替換為 `ollama list` 或 `openclaw models list --provider ollama` 顯示的確切名稱。

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    與閘道位於同一部機器上的 Ollama，會自動探索：

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    除非需要手動設定模型，否則請勿新增 `models.providers.ollama` 區塊。

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
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

    `contextWindow` 是 OpenClaw 的上下文預算；`params.num_ctx` 會傳送給 Ollama。當硬體無法執行模型所公布的完整上下文時，請讓兩者保持一致。

  </Accordion>

  <Accordion title="Ollama Cloud only">
    不使用本機常駐程式，直接使用託管模型：

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

    若要使用專用的 `ollama-cloud` 提供者 ID，而非上述設定形式，請參閱 [Ollama Cloud](/zh-TW/providers/ollama-cloud)。

  </Accordion>

  <Accordion title="Cloud plus local through a signed-in daemon">
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

  <Accordion title="Multiple Ollama hosts">
    執行多個 Ollama 伺服器時，請使用自訂提供者 ID；每個提供者都有各自的
    主機、模型、驗證與逾時設定。

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

    OpenClaw 在呼叫 Ollama 前會移除目前使用的提供者前綴（若無法判定，則改用單純的
    `ollama/` 前綴），因此 `ollama-large/qwen3.5:27b`
    傳送至 Ollama 時會是 `qwen3.5:27b`。

  </Accordion>

  <Accordion title="Lean local model profile">
    有些本機模型能處理簡單提示，但難以應付完整的代理工具介面。
    在調整全域執行階段設定前，請先限制工具與上下文：

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

    僅當模型或伺服器在處理工具結構描述時會穩定地失敗，才使用
    `compat.supportsTools: false`——這會以代理能力換取穩定性。
    除非明確要求，`localModelLean` 會從代理的直接介面移除資源需求較高的瀏覽器、排程、訊息、媒體生成、
    語音及 PDF 工具，並將較大的目錄置於工具搜尋之後。它不會變更 Ollama 的
    執行階段上下文或思考模式。對於會陷入迴圈或將額度耗費在隱藏推理上的小型 Qwen 類思考模型，
    請搭配 `params.num_ctx` 與
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

自訂提供者 ID 的運作方式相同：對於使用目前提供者前綴的參照，
例如 `ollama-spark/qwen3:32b`，OpenClaw 會在呼叫 Ollama 前移除該前綴，
並傳送 `qwen3:32b`。

對於速度較慢的本機模型，請優先調整提供者範圍的設定，而不是提高整個
代理執行階段的逾時：

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

`timeoutSeconds` 涵蓋模型的 HTTP 請求：連線建立、標頭、
本文串流，以及受防護擷取的整體中止逾時。原生 `/api/chat` 請求會將
`params.keep_alive` 轉送為頂層的 `keep_alive`；若首次回合的載入時間是瓶頸，
請針對各模型分別設定。

### 快速驗證

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

對於遠端主機，請將 `127.0.0.1` 替換為 `baseUrl` 的主機。若 `curl`
可正常運作，但 OpenClaw 無法運作，請檢查閘道是否執行於不同的
機器、容器或服務帳戶下。

## Ollama 網頁搜尋

OpenClaw 內建 **Ollama 網頁搜尋**，作為 `web_search` 提供者。

| 屬性        | 詳細資訊                                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主機        | 設定時使用 `models.providers.ollama.baseUrl`，否則使用 `http://127.0.0.1:11434`；`https://ollama.com` 會直接使用託管 API                                   |
| 驗證        | 已登入的本機主機不需要金鑰；直接搜尋 `https://ollama.com` 或使用受驗證保護的主機時，需使用 `OLLAMA_API_KEY` 或已設定的提供者驗證                            |
| 需求        | 本機／自行託管的主機必須正在執行，且已透過 `ollama signin` 登入；直接使用託管搜尋時，需要 `baseUrl: "https://ollama.com"` 以及真實的 API 金鑰              |

請在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇它，或設定：

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

若要透過 Ollama Cloud 直接使用託管搜尋：

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
代理，接著回退至同一主機上的託管 `/api/web_search` 路徑；已登入的
本機常駐程式通常會透過本機代理回應。直接呼叫
`https://ollama.com` 時，一律使用託管的 `/api/web_search` 端點。

<Note>
如需完整設定與行為說明，請參閱 [Ollama 網頁搜尋](/zh-TW/tools/ollama-search)。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **此模式下的工具呼叫並不可靠。** 僅當代理需要 OpenAI 格式，且你不依賴原生工具呼叫時才使用。
    </Warning>

    對於位於 `/v1/chat/completions` 後方的代理，請明確設定
    `api: "openai-completions"`：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    此模式可能不支援同時使用串流與工具呼叫；你可能需要在模型上設定
    `params: { streaming: false }`。

    在此模式下，OpenClaw 預設會注入 `options.num_ctx`，讓 Ollama
    不會在未提示的情況下回退至 4096 個權杖的上下文。若你的代理拒絕
    未知的 `options` 欄位，請將其停用：

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

  <Accordion title="Context windows">
    對於自動探索到的模型，OpenClaw 會使用 `/api/show` 回報的上下文視窗，
    包括自訂 Modelfile 中較大的 `PARAMETER num_ctx` 值；否則會回退至
    OpenClaw 的預設 Ollama 上下文視窗。

    提供者層級的 `contextWindow`、`contextTokens` 與 `maxTokens` 會為
    該提供者下的每個模型設定預設值，且可由各模型覆寫。`contextWindow`
    是 OpenClaw 自身的提示／壓縮額度。除非你明確設定
    `params.num_ctx`，否則原生 `/api/chat` 請求不會設定 `options.num_ctx`，
    因此 Ollama 會套用自己的模型、`OLLAMA_CONTEXT_LENGTH` 或依 VRAM
    決定的預設值；無效、零、負數或非有限的 `params.num_ctx` 值會被忽略。
    若舊版設定僅使用 `contextWindow`／`maxTokens` 強制設定原生請求上下文，
    請執行 `openclaw doctor --fix`，將這些值複製至 `params.num_ctx`。
    OpenAI 相容轉接器仍會預設從已設定的 `params.num_ctx` 或
    `contextWindow` 注入 `options.num_ctx`；若上游拒絕 `options`，
    請使用 `injectNumCtxForOpenAICompat: false` 停用。

    原生模型項目也接受 `params` 下常見的 Ollama 執行階段選項，
    並將其作為原生 `/api/chat` 的 `options` 轉送：`num_keep`、`seed`、
    `num_predict`、`top_k`、`top_p`、`min_p`、`typical_p`、`repeat_last_n`、
    `temperature`、`repeat_penalty`、`presence_penalty`、`frequency_penalty`、
    `stop`、`num_batch`、`num_gpu`、`main_gpu`、`use_mmap` 與 `num_thread`。
    少數幾個鍵（`format`、`keep_alive`、`truncate`、`shift`）會作為
    頂層請求欄位轉送，而不是放在巢狀 `options` 中。OpenClaw 僅會
    轉送這些 Ollama 請求鍵，因此僅供執行階段使用的參數（例如
    `streaming`）絕不會傳送至 Ollama。使用 `params.think`（或
    `params.thinking`）設定頂層 `think`；`false` 會停用 Qwen 類思考模型
    在 API 層級的思考功能。

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

    各模型的 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也可使用；
    若兩者皆有設定，會以明確的提供者模型項目為準。

  </Accordion>

  <Accordion title="Thinking control">
    OpenClaw 會依照 Ollama 預期的方式轉送思考設定：使用頂層 `think`，
    而不是 `options.think`。若自動探索到的模型其 `/api/show` 回報具有
    `thinking` 能力，就會提供 `/think low`、`/think medium`、`/think high`
    與 `/think max`；非思考模型僅提供 `/think off`。

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

    每個模型的 `params.think`/`params.thinking` 都可停用或強制啟用特定模型的 API
    思考功能。當作用中的執行僅有隱含的 `off` 預設值時，OpenClaw 會保留該明確設定；
    但非關閉狀態的執行階段命令（例如 `/think medium`）仍會覆寫它。對於明確標記為
    `reasoning: false` 的模型，絕不會傳送真值的思考要求；無論情況如何，
    `think: false` 要求一律都會傳送。

  </Accordion>

  <Accordion title="推理模型">
    名稱為 `deepseek-r1`、`reasoning`、`reason` 或 `think` 的模型，預設會視為
    具備推理能力，不需要額外設定：

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="模型成本">
    Ollama 在本機執行且免費，因此自動探索和手動定義模型的所有模型成本均為 `0`。
  </Accordion>

  <Accordion title="記憶嵌入">
    內建的 Ollama 外掛會為[記憶搜尋](/zh-TW/concepts/memory)註冊記憶嵌入提供者。
    它使用已設定的 Ollama 基礎 URL 和 API 金鑰、呼叫 `/api/embed`，並在可行時
    將多個記憶區塊批次合併至單一 `input` 要求。

    當 `proxy.enabled=true` 時，若嵌入要求的目標是由已設定 `baseUrl` 衍生出的
    完全相符主機本機回送來源，便會使用 OpenClaw 受保護的直接路徑，而非受管理的
    正向 Proxy。設定的主機名稱本身必須是 `localhost` 或回送 IP 常值；僅透過
    DNS 解析至回送位址的名稱仍會使用受管理的 Proxy 路徑。區域網路、tailnet、
    私有網路及公開 Ollama 主機一律維持使用受管理的 Proxy 路徑，而且重新導向至
    其他主機或連接埠時不會繼承信任。`proxy.loopbackMode: "proxy"` 仍會將回送流量
    路由至 Proxy；`proxy.loopbackMode: "block"` 則會在連線前拒絕流量。請參閱
    [受管理的 Proxy](/zh-TW/security/network-proxy#gateway-loopback-mode)。

    | 屬性 | 值 |
    | --- | --- |
    | 預設模型 | `nomic-embed-text` |
    | 自動拉取 | 是，若本機尚未存在 |
    | 預設行內並行數 | 1（其他提供者的預設值較高；若主機能夠承受，可透過 `nonBatchConcurrency` 提高） |

    查詢時的嵌入會對需要或建議使用檢索前綴的模型套用此前綴：
    `nomic-embed-text`、`qwen3-embedding` 和 `mxbai-embed-large`。
    文件批次仍維持原始內容，因此現有索引不需要格式遷移。

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    對於遠端嵌入主機，請將驗證資訊的作用範圍限制在該主機：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="串流設定">
    Ollama 預設使用**原生 API**（`/api/chat`），可同時支援串流和工具呼叫，
    不需要特殊設定。

    對於原生要求，思考控制會直接轉送：除非已明確設定
    `params.think`/`params.thinking`，否則 `/think off` 和
    `openclaw agent --thinking off` 會傳送頂層的 `think: false`；
    `/think low|medium|high` 會傳送相符的投入程度字串；`/think max` 則會對應至
    Ollama 的最高投入程度 `think: "high"`。

    <Tip>
    若要改用 OpenAI 相容端點，請參閱上方的「舊版 OpenAI 相容模式」；在該模式中，串流和工具呼叫可能無法同時運作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="WSL2 當機迴圈（反覆重新啟動）">
    在使用 NVIDIA/CUDA 的 WSL2 上，官方 Ollama Linux 安裝程式會建立一個
    `Restart=always` 的 `ollama.service` systemd 單元。如果該服務在 WSL2
    開機期間自動啟動並載入由 GPU 支援的模型，Ollama 可能會在載入時鎖定主機記憶體；
    Hyper-V 記憶體回收不一定能回收這些頁面，因此 Windows 可能會終止 WSL2
    虛擬機器，systemd 隨後重新啟動 Ollama，導致迴圈不斷重複。

    證據包括：WSL2 反覆重新啟動或終止、WSL2 啟動後 `app.slice` 或
    `ollama.service` 立即出現高 CPU 使用率，以及 SIGTERM 來自 systemd
    而非 Linux OOM 終止器。

    當 OpenClaw 偵測到 WSL2、已啟用且設有 `Restart=always` 的
    `ollama.service`，以及可見的 CUDA 標記時，會記錄啟動警告。

    緩解方式：

    ```bash
    sudo systemctl disable ollama
    ```

    在 Windows 端，將以下內容加入 `%USERPROFILE%\.wslconfig`，然後執行
    `wsl --shutdown`：

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    或縮短存活時間，並僅在需要時手動啟動 Ollama：

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    請參閱 [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)。

  </Accordion>

  <Accordion title="未偵測到 Ollama">
    請確認 Ollama 正在執行、已設定 `OLLAMA_API_KEY`（或驗證設定檔），而且
    **未**明確定義 `models.providers.ollama`：

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="沒有可用的模型">
    請將模型拉取至本機，或在 `models.providers.ollama` 中明確定義：

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="連線遭拒">
    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="遠端主機可搭配 curl 運作，但無法搭配 OpenClaw 運作">
    請從執行閘道的相同機器和執行階段進行驗證：

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    常見原因：

    - `baseUrl` 指向 `localhost`，但閘道在 Docker 或其他主機上執行。
    - URL 使用 `/v1`，因此選用了 OpenAI 相容行為，而非原生 Ollama。
    - 遠端主機需要變更防火牆或區域網路繫結設定。
    - 模型位於您筆記型電腦的常駐程式中，而不在遠端常駐程式中。

  </Accordion>

  <Accordion title="模型將工具 JSON 輸出為文字">
    通常是因為提供者處於 OpenAI 相容模式，或模型無法處理工具結構描述。
    建議使用原生模式：

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

    如果小型本機模型仍無法處理工具結構描述，請在該模型項目上設定
    `compat.supportsTools: false`，然後重新測試。

  </Accordion>

  <Accordion title="Kimi 或 GLM 傳回亂碼符號">
    託管式 Kimi/GLM 回應若為冗長且不具語言意義的連續符號，會視為提供者呼叫失敗，
    而非成功回覆。因此系統會接手執行一般的重試、容錯移轉或錯誤處理，而不會將損毀的
    文字持久儲存至工作階段。

    如果問題再次發生，請擷取模型名稱、目前的工作階段檔案，以及該次執行使用的是
    `Cloud + Local` 還是 `Cloud only`，然後嘗試使用全新的工作階段和容錯模型：

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="冷啟動的本機模型逾時">
    大型本機模型首次載入可能需要很長時間。請將逾時設定限制於 Ollama 提供者，
    並可選擇讓模型在各輪對話之間保持載入：

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

    如果主機本身接受連線的速度較慢，`timeoutSeconds` 也會延長此提供者受保護的
    連線逾時時間。

  </Accordion>

  <Accordion title="大型上下文模型過慢或記憶體不足">
    許多模型宣告的上下文大小超出您的硬體可舒適執行的範圍。除非設定
    `params.num_ctx`，否則原生 Ollama 會使用其自身的執行階段預設值。
    同時限制 OpenClaw 的預算和 Ollama 的要求上下文，即可獲得可預測的首個
    詞元延遲：

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

    如果 OpenClaw 傳送過多提示詞，請降低 `contextWindow`。如果 Ollama 的
    執行階段上下文對該機器而言過大，請降低 `params.num_ctx`。如果生成時間過長，
    請降低 `maxTokens`。

  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting)和[常見問題](/zh-TW/help/faq)。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/zh-TW/providers/ollama-cloud" icon="cloud">
    使用專用 `ollama-cloud` 提供者的純雲端設定。
  </Card>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型參照及容錯移轉行為的概覽。
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
