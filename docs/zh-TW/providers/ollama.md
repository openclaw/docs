---
read_when:
    - 您想透過 Ollama 使用雲端或本機模型執行 OpenClaw
    - 你需要 Ollama 設定與組態指引
    - 你想要使用 Ollama 視覺模型進行影像理解
summary: 使用 Ollama 執行 OpenClaw（雲端和本機模型）
title: Ollama
x-i18n:
    generated_at: "2026-07-06T10:51:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw 會與 Ollama 的原生 API（`/api/chat`）通訊，而不是 OpenAI 相容的
`/v1` 端點。支援三種模式：

| 模式          | 使用內容                                                                         |
| ------------- | -------------------------------------------------------------------------------- |
| 雲端 + 本機 | 可連線的 Ollama 主機，提供本機模型，以及（若已登入）`:cloud` 模型 |
| 僅雲端    | 直接使用 `https://ollama.com`，不需要本機 daemon                                   |
| 僅本機    | 可連線的 Ollama 主機，僅限本機模型                                       |

若要使用專用 `ollama-cloud` provider id 進行僅雲端設定，請參閱
[Ollama Cloud](/zh-TW/providers/ollama-cloud)。當你想將雲端路由與本機 `ollama` provider
分開時，請使用 `ollama-cloud/<model>` refs。

<Warning>
請勿使用 `/v1` OpenAI 相容 URL（`http://host:11434/v1`）。它會破壞工具呼叫，且模型可能會將原始工具呼叫 JSON 作為純文字輸出。請使用原生 URL：`baseUrl: "http://host:11434"`（沒有 `/v1`）。
</Warning>

標準設定鍵是 `baseUrl`。為了支援 OpenAI-SDK 風格範例，也接受 `baseURL`，
但新的設定應使用 `baseUrl`。

## 驗證規則

<AccordionGroup>
  <Accordion title="本機與 LAN 主機">
    Loopback、私人網路、`.local` 和裸主機名稱的 Ollama URL 不需要真實 bearer token。OpenClaw 會對這些使用 `ollama-local` 標記。
  </Accordion>
  <Accordion title="遠端與 Ollama Cloud 主機">
    公開遠端主機和 `https://ollama.com` 需要真實憑證：`OLLAMA_API_KEY`、驗證設定檔，或 provider 的 `apiKey`。若要直接使用託管服務，建議使用 `ollama-cloud` provider。
  </Accordion>
  <Accordion title="自訂 provider id">
    帶有 `api: "ollama"` 的自訂 provider 遵循相同規則。例如，指向私人 LAN 主機的 `ollama-remote` provider 可以使用 `apiKey: "ollama-local"`；子代理會透過 Ollama provider hook 解析該標記，而不是將其視為缺少憑證。`agents.defaults.memorySearch.provider` 也可以指向自訂 provider id，讓 embeddings 使用該 Ollama 端點。
  </Accordion>
  <Accordion title="驗證設定檔">
    `auth-profiles.json` 會儲存 provider id 的憑證；請將端點設定（`baseUrl`、`api`、models、headers、timeouts）放在 `models.providers.<id>`。較舊的扁平檔案，例如 `{ "ollama-windows": { "apiKey": "ollama-local" } }` 不是 runtime 格式；`openclaw doctor --fix` 會將它們重寫為標準 `ollama-windows:default` API-key 設定檔並建立備份。該 legacy 檔案中的 `baseUrl` 值是雜訊，應移到 provider 設定。
  </Accordion>
  <Accordion title="記憶 embedding 範圍">
    Ollama 記憶 embeddings 的 bearer 驗證範圍限於其宣告的主機：

    - provider 層級金鑰只會傳送到該 provider 的主機。
    - `agents.*.memorySearch.remote.apiKey` 只會傳送到其遠端 embedding 主機。
    - 純 `OLLAMA_API_KEY` env 值會被視為 Ollama Cloud 慣例，預設不會傳送到本機/自架主機。

  </Accordion>
</AccordionGroup>

## 開始使用

<Tabs>
  <Tab title="Onboarding（建議）">
    <Steps>
      <Step title="執行 onboarding">
        ```bash
        openclaw onboard
        ```

        選取 **Ollama**，然後選擇模式：**雲端 + 本機**、**僅雲端** 或 **僅本機**。
      </Step>
      <Step title="選取模型">
        `Cloud only` 會提示輸入 `OLLAMA_API_KEY` 並建議託管雲端預設值。`Cloud + Local` 和 `Local only` 會提示輸入 Ollama base URL、探索可用模型，並在所選本機模型缺少時自動 pull。已安裝的 `:latest` tag（例如 `gemma4:latest`）只會顯示一次，而不會重複顯示 `gemma4`。`Cloud + Local` 也會檢查主機是否已登入以取得雲端存取權。
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

    `--custom-base-url` 和 `--custom-model-id` 為選用；省略時會使用本機預設主機與 `gemma4` 建議模型。

  </Tab>

  <Tab title="手動設定">
    <Steps>
      <Step title="安裝並啟動 Ollama">
        從 [ollama.com/download](https://ollama.com/download) 取得，然後 pull 模型：

        ```bash
        ollama pull gemma4
        ```

        若要使用混合雲端存取，請在同一台主機上執行 `ollama signin`。
      </Step>
      <Step title="設定憑證">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # 本機/LAN 主機，任何值都可用
        export OLLAMA_API_KEY="your-real-key"   # 僅限 https://ollama.com
        ```

        或在設定中：`openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`。
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

`Cloud + Local` 會透過單一可連線的 Ollama 主機路由本機與 `:cloud` 模型，
這是 Ollama 的混合流程，也是你想同時使用兩者時在設定期間應選的模式。

OpenClaw 會提示輸入 base URL、探索本機模型，並檢查 `ollama signin`
狀態。登入後，它會建議託管預設值（`kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`、`glm-5.2:cloud`）。若未登入，設定會保持僅本機，直到你執行 `ollama signin`。

若要在沒有本機 daemon 的情況下進行僅雲端存取，請使用 `openclaw onboard --auth-choice ollama-cloud` 並參閱 [Ollama Cloud](/zh-TW/providers/ollama-cloud)；該路徑不需要 `ollama signin` 或執行中的伺服器：

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

`openclaw onboard` 期間顯示的雲端模型清單會從
`https://ollama.com/api/tags` 即時填入，上限為 500 個項目，因此 picker 會反映目前託管 catalog。如果 `ollama.com` 無法連線或在設定時沒有傳回模型，OpenClaw 會退回到其硬編碼的建議清單，讓 onboarding 仍可完成。

## 模型探索（隱含 provider）

當已設定 `OLLAMA_API_KEY`（或驗證設定檔），且既未定義
`models.providers.ollama`，也未定義其他帶有 `api: "ollama"` 的自訂 provider
時，OpenClaw 會從 `http://127.0.0.1:11434` 探索模型：

| 行為             | 詳細資訊                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog 查詢        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| 能力偵測 | 盡力透過 `/api/show` 讀取 `contextWindow`、`num_ctx` Modelfile 參數，以及能力（vision/tools/thinking）                                                                                                                                                                       |
| Vision 模型        | 來自 `/api/show` 的 `vision` 能力會將模型標記為支援影像（`input: ["text", "image"]`）                                                                                                                                                                                             |
| Reasoning 偵測  | 可用時使用 `/api/show` 的 `thinking` 能力；當 Ollama 省略能力時，退回到名稱啟發式（`r1`、`reason`、`reasoning`、`think`）。無論回報的能力為何，`glm-5.2:cloud` 和 `deepseek-v4-flash\|pro:cloud` 一律視為 reasoning。 |
| Token 限制         | `maxTokens` 預設為 OpenClaw 的 Ollama max-token 上限                                                                                                                                                                                                                                       |
| 成本                | 所有成本皆為 `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

使用明確 `models` array 設定 `models.providers.ollama`，或使用帶有
`api: "ollama"` 且非 loopback `baseUrl` 的自訂 provider，會停用自動探索；之後必須手動定義模型（請參閱
[Configuration](#configuration)）。指向託管 `https://ollama.com` 的 `models.providers.ollama` 項目也會略過探索，因為 Ollama Cloud 模型由 provider 管理。Loopback 自訂 provider（例如
`http://127.0.0.2:11434`）仍會視為本機並保留自動探索。

你可以使用完整 ref，例如 `ollama/<pulled-model>:latest`，而不需要手寫
`models.json` 項目；OpenClaw 會即時解析它。對於已登入的主機，選取未列出的 `ollama/<model>:cloud` ref 會使用 `/api/show` 驗證該確切模型，且只有在 Ollama 確認 metadata 時才會將它加入 runtime catalog；拼字錯誤仍會因 unknown models 而失敗。

### Smoke tests

若要執行略過完整 agent 工具表面的窄文字探測：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

為精簡 vision-model 探測加入帶有影像的 `--file`（接受 PNG/JPEG/WebP；
非影像檔會在呼叫 Ollama 之前被拒絕；音訊請使用
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

這兩個路徑都不會載入 chat tools、memory 或 session context。如果它成功，
但一般 agent 回覆失敗，問題可能是模型的 tool/agent 能力，而不是端點。

使用 `/model ollama/<model>` 選取模型是精確的使用者選擇：如果設定的
`baseUrl` 無法連線，下一則回覆會因 provider 錯誤而失敗，而不會靜默退回到另一個已設定模型。

隔離的 cron jobs 會在開始 agent turn 前加入一項本機安全檢查：
如果所選模型解析為本機/私人網路/`.local` Ollama provider，且 `/api/tags`
無法連線，OpenClaw 會將該次 run 記錄為 `skipped`，並在錯誤文字中包含模型。此端點檢查會依主機快取 5 分鐘，因此針對已停止 daemon 的重複 cron jobs 不會全部啟動失敗請求。

即時驗證：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

對於 Ollama Cloud，將相同的即時測試指向託管端點（預設略過
嵌入；若要強制執行，請使用 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`，因為
雲端金鑰可能未授權 `/api/embed`）：

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

若要新增模型，拉取它後就會自動探索到：

```bash
ollama pull mistral
```

## 節點本機推論

代理可以將短任務委派給配對桌面或伺服器節點上的 Ollama 模型。
提示和回應會透過既有已驗證的閘道/節點連線傳遞；請求會在該節點自己的 loopback Ollama
端點 (`http://127.0.0.1:11434`) 上執行。

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

    在閘道主機上核准裝置及其節點命令，然後驗證：

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    第一次連線，或新增 Ollama 命令的升級，可能會觸發
    節點命令核准。如果節點連線時未宣告
    `ollama.models` 和 `ollama.chat`，請再次檢查 `openclaw nodes pending`。

  </Step>
  <Step title="從代理使用它">
    內建的 Ollama 外掛會公開 `node_inference` 工具。代理會先呼叫
    `action: "discover"`，再使用該結果中的節點和模型呼叫 `action: "run"`
    （當剛好只有一個具備能力的節點已連線時，`run` 可以省略節點）。例如：「探索我節點上的 Ollama 模型，然後使用
    載入速度最快的模型來摘要這段文字。」
  </Step>
</Steps>

探索會讀取 `/api/tags`、檢查 `/api/show` 能力，並在可用時使用
`/api/ps` 來優先排序已載入的模型。它只會回傳 Ollama 回報為具備聊天能力（`completion` 能力）的
本機模型，排除 Ollama Cloud 列和僅嵌入模型。每次執行都會停用
模型思考，並預設將輸出設為 512 個權杖（硬性上限 8192），除非
工具呼叫請求不同的 `maxTokens`；某些模型（例如 GPT-OSS）
不支援停用思考，仍可能發出推理權杖。

若要讓 Ollama 在節點上保持執行但不暴露給代理：

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

重新啟動節點（`openclaw node restart`，或對前景工作階段停止/重新執行 `openclaw node run`）。
節點會停止宣告 `ollama.models` 和
`ollama.chat`；Ollama 本身以及閘道的 Ollama 提供者不受影響。
將值設回 `true` 並重新啟動即可重新啟用；變更後的命令
介面可能需要在重新連線後再次透過 `openclaw nodes pending` 核准。

不經過代理回合，直接驗證節點命令：

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

`--invoke-timeout` 限制節點可執行命令的時間；
`--timeout` 限制整體閘道呼叫，且應該更大。

節點本機推論一律使用節點自己的 loopback 端點，而不會
重用已設定的遠端/雲端 `models.providers.ollama.baseUrl`。這些
節點命令預設可在 macOS、Linux 和 Windows 節點
主機上使用，並仍受一般節點配對/命令政策約束。

## 視覺和圖片描述

內建的 Ollama 外掛會將 Ollama 註冊為具備圖片能力的
媒體理解提供者，因此 OpenClaw 可以將明確的圖片描述
請求和已設定的圖片模型預設值路由到本機或託管的 Ollama
視覺模型。

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` 必須是完整的 `<provider/model>` 參照；設定後，`infer image
describe` 會先嘗試該模型，而不是因模型已支援原生視覺就略過描述。
如果呼叫失敗，OpenClaw 可以繼續嘗試
`agents.defaults.imageModel.fallbacks`；檔案/URL 準備錯誤
會在嘗試後援前失敗。請使用 `infer image describe` 進行 OpenClaw 的
圖片理解流程和已設定的 `imageModel`；使用 `infer model run
--file` 搭配自訂提示進行原始多模態探測。

若要讓 Ollama 成為傳入媒體的預設圖片理解提供者：

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

建議使用完整的 `ollama/<model>` 參照。裸 `imageModel` 參照，例如
`qwen2.5vl:7b`，只有在該確切模型列於
`models.providers.ollama.models` 並包含
`input: ["text", "image"]`，且沒有其他已設定的圖片提供者公開
相同裸 id 時，才會正規化為 `ollama/qwen2.5vl:7b`；否則請明確使用提供者前綴。

速度較慢的本機視覺模型可能需要比雲端模型更長的圖片理解逾時，
而且如果 Ollama 嘗試配置模型完整宣告的視覺上下文，可能會在資源受限的硬體上當機。
請設定能力
逾時並限制 `num_ctx`：

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

此逾時會套用到傳入圖片理解和明確的
`image` 工具。`models.providers.ollama.timeoutSeconds` 仍會控制
一般模型呼叫底層 Ollama HTTP 請求的保護時間。

即時驗證：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

如果你手動定義 `models.providers.ollama.models`，請明確標記視覺模型：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 會拒絕未標記為
具備圖片能力之模型的圖片描述請求。透過隱式探索時，這來自 `/api/show` 的視覺
能力。

## 設定

<Tabs>
  <Tab title="基本（隱式探索）">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果已設定 `OLLAMA_API_KEY`，你可以在提供者項目中省略 `apiKey`；OpenClaw 會為可用性檢查填入它。
    </Tip>

  </Tab>

  <Tab title="明確（手動模型）">
    對於託管雲端設定、非預設主機/連接埠、強制
    上下文視窗，或完全手動的模型清單，請使用明確設定：

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
    請勿加入 `/v1`。該路徑會選取 OpenAI 相容模式，而工具呼叫在此模式下並不可靠。
    </Warning>

  </Tab>
</Tabs>

## 常見配方

請將模型 ID 替換為 `ollama list` 或
`openclaw models list --provider ollama` 中的確切名稱。

<AccordionGroup>
  <Accordion title="使用自動探索的本機模型">
    Ollama 與閘道在同一台機器上，並自動探索：

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    除非需要手動模型，否則不要加入 `models.providers.ollama` 區塊。

  </Accordion>

  <Accordion title="使用手動模型的 LAN Ollama 主機">
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

    `contextWindow` 是 OpenClaw 的上下文預算；`params.num_ctx` 會傳送給
    Ollama。當硬體無法執行模型完整宣告的上下文時，請讓兩者保持一致。

  </Accordion>

  <Accordion title="僅使用 Ollama Cloud">
    不需要本機守護程序，直接使用託管模型：

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

    若要使用專用的 `ollama-cloud` 提供者 id，而不是此形態，請參閱
    [Ollama Cloud](/zh-TW/providers/ollama-cloud)。

  </Accordion>

  <Accordion title="透過已登入的守護程序同時使用雲端與本機">
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
    執行多個 Ollama 伺服器時可使用自訂提供者 ID；每個提供者都有自己的主機、模型、驗證和逾時設定。

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

    OpenClaw 會先移除作用中提供者前綴（退回使用裸 `ollama/` 前綴），再呼叫 Ollama，因此 `ollama-large/qwen3.5:27b`
    會以 `qwen3.5:27b` 傳到 Ollama。

  </Accordion>

  <Accordion title="精簡本機模型設定檔">
    有些本機模型可以處理簡單提示，但難以應付完整的代理工具介面。在調整全域執行階段設定之前，請先限制工具和脈絡：

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

    只有在模型或伺服器會穩定地於工具結構描述上失敗時，才使用 `compat.supportsTools: false`，這會以代理能力換取穩定性。
    除非明確需要，`localModelLean` 會從直接代理介面中移除重量級的瀏覽器、排程、訊息、媒體生成、語音和 PDF 工具，並將較大的目錄放在工具搜尋之後。它不會變更 Ollama 的執行階段脈絡或思考模式。對於會迴圈或把預算花在隱藏推理上的小型 Qwen 風格思考模型，請搭配 `params.num_ctx` 和 `params.thinking: false` 使用。

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

自訂提供者 ID 的運作方式相同：對於使用作用中提供者前綴的參照，例如 `ollama-spark/qwen3:32b`，OpenClaw 會在呼叫 Ollama 前移除該前綴，送出 `qwen3:32b`。

對於速度較慢的本機模型，請優先使用提供者範圍的調校，再提高整個代理執行階段逾時：

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

`timeoutSeconds` 涵蓋模型 HTTP 請求：連線設定、標頭、本文串流，以及受保護擷取的總中止時間。`params.keep_alive` 會在原生 `/api/chat` 請求中作為頂層 `keep_alive` 轉送；當首次回合載入時間是瓶頸時，請按模型設定。

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

對於遠端主機，請將 `127.0.0.1` 替換為 `baseUrl` 主機。如果 `curl` 可以運作但 OpenClaw 不行，請檢查閘道是否在不同機器、容器或服務帳戶上執行。

## Ollama 網頁搜尋

OpenClaw 將 **Ollama 網頁搜尋** 作為 `web_search` 提供者隨附提供。

| 屬性        | 詳細資訊                                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主機        | 設定時使用 `models.providers.ollama.baseUrl`，否則使用 `http://127.0.0.1:11434`；`https://ollama.com` 會直接使用託管 API                          |
| 驗證        | 已登入的本機主機不需要金鑰；直接 `https://ollama.com` 搜尋或受驗證保護的主機，使用 `OLLAMA_API_KEY` 或已設定的提供者驗證           |
| 需求        | 本機/自架主機必須正在執行並以 `ollama signin` 登入；直接託管搜尋需要 `baseUrl: "https://ollama.com"` 加上真實 API 金鑰 |

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

若要透過 Ollama Cloud 進行直接託管搜尋：

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

對於自架主機，OpenClaw 會先嘗試本機 `/api/experimental/web_search`
代理，接著退回同一主機上的託管 `/api/web_search` 路徑；已登入的本機守護程式通常會透過本機代理回應。直接
`https://ollama.com` 呼叫一律使用託管 `/api/web_search` 端點。

<Note>
如需完整設定與行為，請參閱 [Ollama 網頁搜尋](/zh-TW/tools/ollama-search)。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="舊版 OpenAI 相容模式">
    <Warning>
    **此模式下工具呼叫並不可靠。** 僅在代理需要 OpenAI 格式，且你不依賴原生工具呼叫時使用。
    </Warning>

    對於位於 `/v1/chat/completions` 後方的代理，請明確設定 `api: "openai-completions"`：

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

    此模式可能無法同時支援串流和工具呼叫；你可能需要在模型上設定 `params: { streaming: false }`。

    在此模式中，OpenClaw 預設會注入 `options.num_ctx`，讓 Ollama 不會悄悄退回 4096-token 脈絡。如果你的代理拒絕未知的 `options` 欄位，請停用它：

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

  <Accordion title="脈絡視窗">
    對於自動探索的模型，OpenClaw 會使用 `/api/show` 回報的脈絡視窗，包括自訂 Modelfile 中較大的 `PARAMETER num_ctx` 值；否則會退回 OpenClaw 的預設 Ollama 脈絡視窗。

    提供者層級的 `contextWindow`、`contextTokens` 和 `maxTokens` 會為該提供者下的每個模型設定預設值，並且可按模型覆寫。`contextWindow` 是 OpenClaw 自身的提示/壓縮預算。原生
    `/api/chat` 請求會保留 `options.num_ctx` 未設定，除非你明確設定 `params.num_ctx`，因此 Ollama 會套用自己的模型、`OLLAMA_CONTEXT_LENGTH`，或基於 VRAM 的預設值；無效、零、負數或非有限的 `params.num_ctx` 值會被忽略。如果較舊的設定僅使用 `contextWindow`/`maxTokens` 來強制原生請求脈絡，請執行 `openclaw doctor --fix` 將它們複製到 `params.num_ctx`。OpenAI 相容配接器仍會預設從已設定的 `params.num_ctx` 或 `contextWindow` 注入 `options.num_ctx`；如果上游拒絕 `options`，請使用 `injectNumCtxForOpenAICompat: false` 停用。

    原生模型項目也接受 `params` 下常見的 Ollama 執行階段選項，並作為原生 `/api/chat` `options` 轉送：`num_keep`、`seed`、
    `num_predict`、`top_k`、`top_p`、`min_p`、`typical_p`、`repeat_last_n`、
    `temperature`、`repeat_penalty`、`presence_penalty`、`frequency_penalty`、
    `stop`、`num_batch`、`num_gpu`、`main_gpu`、`use_mmap` 和 `num_thread`。
    少數鍵（`format`、`keep_alive`、`truncate`、`shift`）會作為頂層請求欄位轉送，而不是巢狀 `options`。OpenClaw 只會轉送這些 Ollama 請求鍵，因此像 `streaming` 這類僅限執行階段的參數永遠不會傳送到 Ollama。使用 `params.think`（或
    `params.thinking`）設定頂層 `think`；`false` 會停用 Qwen 風格思考模型的 API 層級思考。

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

    按模型設定的 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也可使用；如果兩者都已設定，明確的提供者模型項目優先。

  </Accordion>

  <Accordion title="思考控制">
    OpenClaw 會依 Ollama 預期的方式轉送思考：頂層 `think`，而不是
    `options.think`。其 `/api/show` 回報 `thinking` 能力的自動探索模型會公開 `/think low`、`/think medium`、`/think high`
    和 `/think max`；非思考模型只會公開 `/think off`。

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

    每個模型的 `params.think`/`params.thinking` 可以針對特定模型停用或強制使用 API
    thinking。當作用中的執行只有隱含的 `off` 預設值時，OpenClaw 會保留該明確設定；
    非 off 的執行階段命令，例如 `/think medium`，仍會覆寫它。truthy 的
    thinking 請求絕不會送往明確標示為 `reasoning: false` 的模型；
    `think: false` 請求則一律會送出。

  </Accordion>

  <Accordion title="推理模型">
    名稱為 `deepseek-r1`、`reasoning`、`reason` 或 `think` 的模型，
    預設會視為具備推理能力，無需額外設定：

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="模型成本">
    Ollama 在本機執行且免費，因此自動探索和手動定義的模型成本
    都是 `0`。
  </Accordion>

  <Accordion title="記憶嵌入">
    內建的 Ollama 外掛會為
    [記憶搜尋](/zh-TW/concepts/memory)註冊記憶嵌入提供者。它會使用設定的 Ollama 基底 URL
    和 API 金鑰，呼叫 `/api/embed`，並在可能時將多個記憶區塊批次合併到
    一個 `input` 請求中。

    當 `proxy.enabled=true` 時，傳送到從設定的 `baseUrl` 推導出的精確主機本機
    loopback 來源的嵌入請求，會使用 OpenClaw 的受保護直連路徑，而不是受管理的轉送代理。
    設定的主機名稱本身必須是 `localhost` 或 loopback IP 字面值，僅解析到
    loopback 的 DNS 名稱仍會使用受管理代理路徑。LAN、tailnet、私人網路和公開
    Ollama 主機一律維持在受管理代理路徑上，重新導向到另一個主機/連接埠也不會繼承信任。
    `proxy.loopbackMode: "proxy"` 仍會透過代理路由 loopback 流量；
    `proxy.loopbackMode: "block"` 會在連線前拒絕它，請參閱
    [受管理代理](/zh-TW/security/network-proxy#gateway-loopback-mode)。

    | 屬性 | 值 |
    | --- | --- |
    | 預設模型 | `nomic-embed-text` |
    | 自動拉取 | 是，如果本機不存在 |
    | 預設內聯並行 | 1（其他提供者的預設值較高；如果主機能承受，可用 `nonBatchConcurrency` 提高） |

    查詢時嵌入會針對需要或建議使用擷取前綴的模型使用這些前綴：
    `nomic-embed-text`、`qwen3-embedding` 和
    `mxbai-embed-large`。文件批次會保持原始格式，因此現有索引不需要格式遷移。

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

    若是遠端嵌入主機，請將驗證範圍限制在該主機：

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
    Ollama 預設使用**原生 API**（`/api/chat`），它同時支援串流和工具呼叫，
    無需特殊設定。

    對於原生請求，thinking 控制會直接轉送：除非明確設定了
    `params.think`/`params.thinking`，否則 `/think off`
    和 `openclaw agent --thinking off` 會送出頂層 `think: false`；
    `/think low|medium|high` 會送出對應的 effort 字串；`/think max`
    會對應到 Ollama 的最高 effort，`think: "high"`。

    <Tip>
    若要改用 OpenAI 相容端點，請參閱上方的「舊版 OpenAI 相容模式」，該模式下串流和工具呼叫可能無法同時運作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="WSL2 當機迴圈（重複重新啟動）">
    在搭配 NVIDIA/CUDA 的 WSL2 上，官方 Ollama Linux 安裝程式會建立
    一個帶有 `Restart=always` 的 `ollama.service` systemd 單元。如果該服務
    自動啟動，並在 WSL2 開機期間載入 GPU 支援的模型，Ollama 可能會在載入時固定占用
    主機記憶體；Hyper-V 記憶體回收不一定能回收這些頁面，因此 Windows 可能會終止
    WSL2 VM，systemd 重新啟動 Ollama，然後迴圈重複。

    證據：WSL2 重複重新啟動/終止、WSL2 啟動後 `app.slice` 或
    `ollama.service` 中 CPU 使用率很高，以及來自 systemd 的 SIGTERM，
    而不是 Linux OOM killer。

    當 OpenClaw 偵測到 WSL2、已啟用且帶有 `Restart=always` 的
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

    或縮短 keep-alive / 僅在需要時手動啟動 Ollama：

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    請參閱 [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)。

  </Accordion>

  <Accordion title="偵測不到 Ollama">
    確認 Ollama 正在執行、已設定 `OLLAMA_API_KEY`（或驗證設定檔），
    且未明確定義 `models.providers.ollama`：

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="沒有可用模型">
    在本機拉取模型，或在 `models.providers.ollama` 中明確定義它：

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

  <Accordion title="遠端主機可用 curl 運作，但 OpenClaw 不行">
    從執行閘道的同一台機器與執行階段驗證：

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    常見原因：

    - `baseUrl` 指向 `localhost`，但閘道在 Docker 中或另一台主機上執行。
    - URL 使用 `/v1`，選擇了 OpenAI 相容行為，而不是原生 Ollama。
    - 遠端主機需要變更防火牆或 LAN 綁定。
    - 模型位於你筆電的 daemon 上，但不在遠端主機上。

  </Accordion>

  <Accordion title="模型將工具 JSON 輸出為文字">
    通常是提供者處於 OpenAI 相容模式，或模型無法處理工具 schema。
    請優先使用原生模式：

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

    如果小型本機模型仍然在工具 schema 上失敗，請在該模型項目上設定
    `compat.supportsTools: false`，然後重新測試。

  </Accordion>

  <Accordion title="Kimi 或 GLM 回傳亂碼符號">
    Hosted Kimi/GLM 回應如果是冗長、非語言性的符號連續串，
    會被視為提供者呼叫失敗，而不是成功回覆，因此會接手正常的
    重試/備援/錯誤處理，而不會將損壞文字保存在工作階段中。

    如果再次發生，請擷取模型名稱、目前的工作階段檔案，以及該次執行使用的是
    `Cloud + Local` 還是 `Cloud only`，然後嘗試新的工作階段和備援模型：

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="冷啟動本機模型逾時">
    大型本機模型可能需要較長的首次載入時間。請將逾時範圍限定到
    Ollama 提供者，並可選擇在回合之間保持模型載入：

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

    如果主機本身接受連線很慢，`timeoutSeconds` 也會延長此提供者的受保護連線逾時。

  </Accordion>

  <Accordion title="大型內容模型太慢或記憶體不足">
    許多模型宣告的內容長度大於你的硬體可舒適執行的範圍。
    原生 Ollama 會使用自己的執行階段預設值，除非設定了
    `params.num_ctx`。限制 OpenClaw 的預算和 Ollama 的請求內容，
    可取得可預測的首 token 延遲：

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

    如果 OpenClaw 傳送太多 prompt，請降低 `contextWindow`。
    如果 Ollama 的執行階段內容對該機器而言太大，請降低 `params.num_ctx`。
    如果生成執行太久，請降低 `maxTokens`。

  </Accordion>
</AccordionGroup>

<Note>
更多說明：[疑難排解](/zh-TW/help/troubleshooting)和[常見問題](/zh-TW/help/faq)。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/zh-TW/providers/ollama-cloud" icon="cloud">
    使用專用 `ollama-cloud` 提供者進行純雲端設定。
  </Card>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型參照和容錯移轉行為的概覽。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/models" icon="brain">
    如何選擇和設定模型。
  </Card>
  <Card title="Ollama 網頁搜尋" href="/zh-TW/tools/ollama-search" icon="magnifying-glass">
    Ollama 支援的網頁搜尋完整設定和行為詳細資訊。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考。
  </Card>
</CardGroup>
