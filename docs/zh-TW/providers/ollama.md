---
read_when:
    - 你想透過 Ollama 使用雲端或本機模型執行 OpenClaw
    - 您需要 Ollama 設定與配置指南
    - 你想要使用 Ollama 視覺模型進行影像理解
summary: 使用 Ollama 執行 OpenClaw（雲端和本機模型）
title: Ollama
x-i18n:
    generated_at: "2026-07-05T11:42:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11984ebca98d7b98f1c89e6820fd29524ec41a38ca4a403260e322dbf55a75e2
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw 會與 Ollama 的原生 API (`/api/chat`) 通訊，而不是 OpenAI 相容的
`/v1` 端點。支援三種模式：

| 模式          | 使用內容                                                                         |
| ------------- | -------------------------------------------------------------------------------- |
| 雲端 + 本機 | 可連線的 Ollama 主機，提供本機模型以及（若已登入）`:cloud` 模型 |
| 僅雲端    | 直接使用 `https://ollama.com`，不使用本機常駐程式                                   |
| 僅本機    | 可連線的 Ollama 主機，僅使用本機模型                                       |

若要使用專用 `ollama-cloud` 供應商 ID 進行僅雲端設定，請參閱
[Ollama Cloud](/zh-TW/providers/ollama-cloud)。當你想讓雲端路由與本機 `ollama` 供應商分開時，請使用 `ollama-cloud/<model>` 參照。

<Warning>
不要使用 `/v1` OpenAI 相容 URL (`http://host:11434/v1`)。它會破壞工具呼叫，且模型可能會把原始工具呼叫 JSON 當作純文字輸出。請使用原生 URL：`baseUrl: "http://host:11434"`（沒有 `/v1`）。
</Warning>

標準設定鍵是 `baseUrl`。也接受 `baseURL` 以支援
OpenAI SDK 風格的範例，但新的設定應使用 `baseUrl`。

## 驗證規則

<AccordionGroup>
  <Accordion title="本機與 LAN 主機">
    回環、私有網路、`.local` 和裸主機名稱的 Ollama URL 不需要真正的 bearer 權杖。OpenClaw 會對這些使用 `ollama-local` 標記。
  </Accordion>
  <Accordion title="遠端與 Ollama Cloud 主機">
    公開遠端主機和 `https://ollama.com` 需要真正的憑證：`OLLAMA_API_KEY`、驗證設定檔，或供應商的 `apiKey`。若要直接使用託管服務，建議使用 `ollama-cloud` 供應商。
  </Accordion>
  <Accordion title="自訂供應商 ID">
    具有 `api: "ollama"` 的自訂供應商會遵循相同規則。例如，指向私有 LAN 主機的 `ollama-remote` 供應商可以使用 `apiKey: "ollama-local"`；子代理會透過 Ollama 供應商鉤子解析該標記，而不是將其視為缺少憑證。`agents.defaults.memorySearch.provider` 也可以指向自訂供應商 ID，讓嵌入使用該 Ollama 端點。
  </Accordion>
  <Accordion title="驗證設定檔">
    `auth-profiles.json` 會儲存供應商 ID 的憑證；請將端點設定（`baseUrl`、`api`、模型、標頭、逾時）放在 `models.providers.<id>`。較舊的扁平檔案，例如 `{ "ollama-windows": { "apiKey": "ollama-local" } }`，不是執行階段格式；`openclaw doctor --fix` 會將它們重寫成標準的 `ollama-windows:default` API 金鑰設定檔並建立備份。該舊檔案中的 `baseUrl` 值是雜訊，應移至供應商設定。
  </Accordion>
  <Accordion title="記憶嵌入範圍">
    Ollama 記憶嵌入的 bearer 驗證範圍限於其宣告所在的主機：

    - 供應商層級金鑰只會傳送到該供應商的主機。
    - `agents.*.memorySearch.remote.apiKey` 只會傳送到其遠端嵌入主機。
    - 純 `OLLAMA_API_KEY` 環境值會被視為 Ollama Cloud 慣例，預設不會傳送到本機／自行託管主機。

  </Accordion>
</AccordionGroup>

## 開始使用

<Tabs>
  <Tab title="導覽設定（建議）">
    <Steps>
      <Step title="執行導覽設定">
        ```bash
        openclaw onboard
        ```

        選取 **Ollama**，然後選擇模式：**雲端 + 本機**、**僅雲端** 或 **僅本機**。
      </Step>
      <Step title="選取模型">
        `Cloud only` 會提示輸入 `OLLAMA_API_KEY`，並建議託管雲端預設值。`Cloud + Local` 和 `Local only` 會提示輸入 Ollama 基底 URL、探索可用模型，並在缺少所選本機模型時自動拉取。已安裝的 `:latest` 標籤（例如 `gemma4:latest`）只會顯示一次，而不是重複顯示 `gemma4`。`Cloud + Local` 也會檢查主機是否已登入以取得雲端存取權。
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

    `--custom-base-url` 和 `--custom-model-id` 是選用項目；省略它們時會使用本機預設主機和建議的 `gemma4` 模型。

  </Tab>

  <Tab title="手動設定">
    <Steps>
      <Step title="安裝並啟動 Ollama">
        從 [ollama.com/download](https://ollama.com/download) 取得，然後拉取模型：

        ```bash
        ollama pull gemma4
        ```

        若要使用混合雲端存取，請在同一部主機上執行 `ollama signin`。
      </Step>
      <Step title="設定憑證">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # local/LAN host, any value works
        export OLLAMA_API_KEY="your-real-key"   # https://ollama.com only
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

`Cloud + Local` 會透過一個可連線的 Ollama 主機路由本機與 `:cloud` 模型，這是 Ollama 的混合流程，也是你想同時使用兩者時應在設定期間選擇的模式。

OpenClaw 會提示輸入基底 URL、探索本機模型，並檢查
`ollama signin` 狀態。登入後，它會建議託管預設值
（`kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`、`glm-5.2:cloud`）。若未登入，設定會保持僅本機，直到你執行 `ollama signin`。

若要在沒有本機常駐程式的情況下使用僅雲端存取，請使用 `openclaw onboard --auth-choice ollama-cloud` 並參閱 [Ollama Cloud](/zh-TW/providers/ollama-cloud)；該路徑不需要 `ollama signin` 或執行中的伺服器：

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

`openclaw onboard` 期間顯示的雲端模型清單會即時從
`https://ollama.com/api/tags` 填入，最多 500 筆，因此選擇器會反映目前的託管目錄。若 `ollama.com` 無法連線或在設定時未傳回模型，OpenClaw 會退回使用其硬編碼建議清單，讓導覽設定仍可完成。

## 模型探索（隱含供應商）

當已設定 `OLLAMA_API_KEY`（或驗證設定檔），且未定義
`models.providers.ollama` 或其他具有 `api: "ollama"` 的自訂供應商時，OpenClaw 會從 `http://127.0.0.1:11434` 探索模型：

| 行為             | 詳細資訊                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目錄查詢        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| 能力偵測 | 盡力讀取 `/api/show` 的 `contextWindow`、`num_ctx` Modelfile 參數與能力（視覺／工具／思考）                                                                                                                                                                       |
| 視覺模型        | 來自 `/api/show` 的 `vision` 能力會將模型標記為可處理圖片（`input: ["text", "image"]`）                                                                                                                                                                                             |
| 推理偵測  | 可用時會使用 `/api/show` 的 `thinking` 能力；當 Ollama 省略能力時，會退回名稱啟發式判斷（`r1`、`reason`、`reasoning`、`think`）。不論回報的能力為何，`glm-5.2:cloud` 和 `deepseek-v4-flash\|pro:cloud` 一律視為推理模型。 |
| 權杖限制         | `maxTokens` 預設為 OpenClaw 的 Ollama 最大權杖上限                                                                                                                                                                                                                                       |
| 成本                | 所有成本皆為 `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

使用明確 `models` 陣列設定 `models.providers.ollama`，或設定具有 `api: "ollama"` 且 `baseUrl` 非回環的自訂供應商，會停用自動探索；之後必須手動定義模型（請參閱
[設定](#configuration)）。指向託管 `https://ollama.com` 的 `models.providers.ollama` 項目也會略過探索，因為 Ollama Cloud 模型由供應商管理。回環自訂供應商（例如
`http://127.0.0.2:11434`）仍會被視為本機並保留自動探索。

你可以使用完整參照，例如 `ollama/<pulled-model>:latest`，而不需要手寫
`models.json` 項目；OpenClaw 會即時解析它。對於已登入的主機，選取未列出的 `ollama/<model>:cloud` 參照時，會使用 `/api/show` 驗證該確切模型，且只有在 Ollama 確認中繼資料時才將其加入執行階段目錄；拼字錯誤仍會因未知模型而失敗。

### 煙霧測試

若要進行略過完整代理工具表面的狹窄文字探測：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

為精簡的視覺模型探測加入帶有圖片的 `--file`（接受 PNG/JPEG/WebP；
非圖片檔案會在呼叫 Ollama 前被拒絕；音訊請使用
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

這兩條路徑都不會載入聊天工具、記憶或工作階段內容。如果它成功但一般代理回覆失敗，問題很可能是模型的工具／代理能力，而不是端點。

使用 `/model ollama/<model>` 選取模型是精確的使用者選擇：如果設定的 `baseUrl` 無法連線，下一則回覆會因供應商錯誤而失敗，而不是默默退回到另一個已設定模型。

隔離的排程工作會在啟動代理回合前加入一項本機安全檢查：如果所選模型解析為本機／私有網路／`.local` Ollama 供應商，且 `/api/tags` 無法連線，OpenClaw 會將該次執行記錄為
`skipped`，並在錯誤文字中包含模型。此端點檢查會依每個主機快取 5 分鐘，因此針對已停止常駐程式的重複排程工作不會全都啟動失敗請求。

即時驗證：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

針對 Ollama Cloud，將相同的即時測試指向託管端點（預設會略過
embeddings；若要強制執行，請使用 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`，因為
雲端金鑰可能未授權 `/api/embed`）：

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

若要新增模型，請拉取它，它就會自動被探索到：

```bash
ollama pull mistral
```

## 節點本機推論

代理可以將短任務委派給配對桌面或
伺服器節點上的 Ollama 模型。提示與回應會經過現有已驗證的
閘道/節點連線；請求會在該節點自己的 loopback Ollama
端點（`http://127.0.0.1:11434`）上執行。

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
      --display-name "本機推論"
    ```

    在閘道主機上核准裝置及其節點命令，然後驗證：

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    首次連線，或新增 Ollama 命令的升級，可能會觸發
    節點命令核准。如果節點連線時未宣告
    `ollama.models` 和 `ollama.chat`，請再次檢查 `openclaw nodes pending`。

  </Step>
  <Step title="從代理使用它">
    內建的 Ollama 外掛會公開 `node_inference` 工具。代理會先呼叫
    `action: "discover"`，然後使用該結果中的節點與模型呼叫
    `action: "run"`（當剛好只有一個具備能力的節點已連線時，`run` 可以省略節點）。
    例如：「探索我節點上的 Ollama 模型，然後使用最快已載入的模型來摘要這段文字。」
  </Step>
</Steps>

探索會讀取 `/api/tags`、檢查 `/api/show` 能力，並在可用時使用
`/api/ps`，以優先排序已載入的模型。它只會傳回
Ollama 回報為具備聊天能力（`completion` 能力）的本機模型 —
Ollama Cloud 列與僅限 embedding 的模型會被排除。每次執行都會停用
模型思考，並預設輸出 512 個 token（硬上限 8192），除非
工具呼叫要求不同的 `maxTokens`；部分模型（例如 GPT-OSS）
不支援停用思考，仍可能輸出推理 token。

若要讓 Ollama 在節點上持續執行但不暴露給代理：

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

重新啟動節點（`openclaw node restart`，或針對前景工作階段停止/重新執行 `openclaw node run`）。
節點會停止宣告 `ollama.models` 和
`ollama.chat`；Ollama 本身與閘道的 Ollama 提供者不受影響。
將值設回 `true` 並重新啟動即可重新啟用；變更後的命令
介面在重新連線後可能需要再次透過 `openclaw nodes pending` 核准。

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

`--invoke-timeout` 會限制節點執行命令的時間；
`--timeout` 會限制整體閘道呼叫，且應該設定得更大。

節點本機推論一律使用節點自己的 loopback 端點 — 它不會
重用已設定的遠端/雲端 `models.providers.ollama.baseUrl`。這些
節點命令預設可在 macOS、Linux 和 Windows 節點
主機上使用，且仍受一般節點配對/命令政策約束。

## 視覺與影像描述

內建的 Ollama 外掛會將 Ollama 註冊為具備影像能力的
媒體理解提供者，因此 OpenClaw 可以透過本機或託管的 Ollama
視覺模型，路由明確的影像描述請求與已設定的影像模型預設值。

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` 必須是完整的 `<provider/model>` 參照；設定後，`infer image
describe` 會先嘗試該模型，而不是因為模型已支援原生視覺就略過描述。
如果呼叫失敗，OpenClaw 可以透過
`agents.defaults.imageModel.fallbacks` 繼續；檔案/URL 準備錯誤
會在嘗試 fallback 前失敗。請使用 `infer image describe` 來執行 OpenClaw 的
影像理解流程與已設定的 `imageModel`；使用 `infer model run
--file` 搭配自訂提示進行原始多模態探測。

若要讓 Ollama 成為入站媒體的預設影像理解提供者：

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

偏好使用完整的 `ollama/<model>` 參照。像
`qwen2.5vl:7b` 這樣的裸 `imageModel` 參照，只有在該精確模型
列於 `models.providers.ollama.models` 且具有
`input: ["text", "image"]`，並且沒有其他已設定的影像提供者公開
相同裸 id 時，才會正規化為 `ollama/qwen2.5vl:7b`；否則請明確使用提供者前綴。

緩慢的本機視覺模型可能需要比雲端模型更長的影像理解逾時，
且如果 Ollama 嘗試配置模型完整宣告的視覺脈絡，可能會在受限硬體上當機。
請設定能力逾時並限制 `num_ctx`：

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

此逾時會套用於入站影像理解與明確的
`image` 工具。`models.providers.ollama.timeoutSeconds` 仍控制
一般模型呼叫的底層 Ollama HTTP 請求保護。

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
具備影像能力模型的影像描述請求。使用隱式探索時，這會來自 `/api/show` 的視覺
能力。

## 設定

<Tabs>
  <Tab title="基本（隱式探索）">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果已設定 `OLLAMA_API_KEY`，你可以省略提供者項目中的 `apiKey`；OpenClaw 會填入它以進行可用性檢查。
    </Tip>

  </Tab>

  <Tab title="明確（手動模型）">
    針對託管雲端設定、非預設主機/連接埠、強制
    脈絡視窗，或完全手動的模型清單，請使用明確設定：

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
    請勿新增 `/v1`。該路徑會選取 OpenAI 相容模式，其中工具呼叫並不可靠。
    </Warning>

  </Tab>
</Tabs>

## 常見範例

請將模型 ID 替換為來自 `ollama list` 或
`openclaw models list --provider ollama` 的精確名稱。

<AccordionGroup>
  <Accordion title="具備自動探索的本機模型">
    與閘道在同一台機器上的 Ollama，會自動被探索到：

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    除非你需要手動模型，否則不要新增 `models.providers.ollama` 區塊。

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

    `contextWindow` 是 OpenClaw 的脈絡預算；`params.num_ctx` 會傳送給
    Ollama。當硬體無法執行模型完整宣告的脈絡時，請保持兩者一致。

  </Accordion>

  <Accordion title="僅使用 Ollama Cloud">
    沒有本機 daemon，直接使用託管模型：

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

    若要使用專用的 `ollama-cloud` 提供者 id 而不是此形狀，請參閱
    [Ollama Cloud](/zh-TW/providers/ollama-cloud)。

  </Accordion>

  <Accordion title="透過已登入 daemon 同時使用雲端與本機">
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
    執行多個 Ollama 伺服器時可使用自訂供應商 ID；每個供應商都有自己的主機、模型、驗證和逾時設定。

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

    OpenClaw 會先移除作用中供應商前綴（並退回使用裸露的
    `ollama/` 前綴），再呼叫 Ollama，因此 `ollama-large/qwen3.5:27b`
    會以 `qwen3.5:27b` 的形式送達 Ollama。

  </Accordion>

  <Accordion title="精簡本機模型設定檔">
    有些本機模型可以處理簡單提示，但難以應付完整的代理工具介面。請先限制工具和上下文，再調整全域執行階段設定：

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

    只有在模型或伺服器確實會在工具結構描述上失敗時，才使用
    `compat.supportsTools: false` —— 這會以代理能力換取穩定性。
    `localModelLean` 會從直接代理介面移除瀏覽器、排程和訊息工具
    （如果執行需要直接訊息傳遞語義，訊息工具會保留），並將較大的目錄放到工具搜尋後方，
    但不會變更 Ollama 的執行階段上下文或思考模式。對於會循環或把預算花在隱藏推理上的小型 Qwen 風格思考模型，
    請搭配 `params.num_ctx` 和 `params.thinking: false` 使用。

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

自訂供應商 ID 的運作方式相同：對於使用作用中供應商前綴的參照，
例如 `ollama-spark/qwen3:32b`，OpenClaw 會在呼叫 Ollama 前移除該前綴，
並送出 `qwen3:32b`。

對於速度較慢的本機模型，請先採用供應商範圍的調校，再提高整個代理執行階段逾時：

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

`timeoutSeconds` 涵蓋模型 HTTP 請求：連線建立、標頭、主體串流，以及整體受保護擷取的中止。
`params.keep_alive` 會在原生 `/api/chat` 請求中作為最上層 `keep_alive` 轉送；
當首輪載入時間是瓶頸時，請按模型設定。

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

對於遠端主機，請將 `127.0.0.1` 替換為 `baseUrl` 主機。如果 `curl`
可以運作但 OpenClaw 不行，請檢查閘道是否在不同的機器、容器或服務帳戶上執行。

## Ollama 網頁搜尋

OpenClaw 將 **Ollama 網頁搜尋** 內建為 `web_search` 供應商。

| 屬性        | 詳細資訊                                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主機        | 設定時使用 `models.providers.ollama.baseUrl`，否則使用 `http://127.0.0.1:11434`；`https://ollama.com` 會直接使用託管 API                              |
| 驗證        | 已登入的本機主機不需要金鑰；直接使用 `https://ollama.com` 搜尋或受驗證保護的主機時，使用 `OLLAMA_API_KEY` 或已設定的供應商驗證                           |
| 需求        | 本機/自託管主機必須正在執行並已用 `ollama signin` 登入；直接託管搜尋需要 `baseUrl: "https://ollama.com"` 加上真實 API 金鑰                              |

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

對於自託管主機，OpenClaw 會先嘗試本機 `/api/experimental/web_search`
代理，接著退回到同一主機上的託管 `/api/web_search` 路徑；已登入的本機常駐程式通常會透過本機代理回應。
直接呼叫 `https://ollama.com` 時一律使用託管的 `/api/web_search` 端點。

<Note>
如需完整設定和行為，請參閱 [Ollama 網頁搜尋](/zh-TW/tools/ollama-search)。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="舊版 OpenAI 相容模式">
    <Warning>
    **此模式中的工具呼叫不可靠。** 只有在代理需要 OpenAI 格式，且你不依賴原生工具呼叫時才使用。
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

    此模式可能無法同時支援串流和工具呼叫；你可能需要在模型上設定
    `params: { streaming: false }`。

    OpenClaw 在此模式中預設會注入 `options.num_ctx`，讓 Ollama 不會靜默退回
    4096-token 上下文。如果你的代理拒絕未知的 `options` 欄位，請停用它：

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
    對於自動探索的模型，OpenClaw 會使用 `/api/show` 回報的上下文視窗，
    包括來自自訂 Modelfile 的較大 `PARAMETER num_ctx` 值；否則會退回使用 OpenClaw
    的預設 Ollama 上下文視窗。

    供應商層級的 `contextWindow`、`contextTokens` 和 `maxTokens`
    會為該供應商下的每個模型設定預設值，且可按模型覆寫。`contextWindow`
    是 OpenClaw 自己的提示/壓縮預算。原生 `/api/chat` 請求會讓
    `options.num_ctx` 保持未設定，除非你明確設定 `params.num_ctx`，
    因此 Ollama 會套用自己的模型、`OLLAMA_CONTEXT_LENGTH` 或以 VRAM 為基礎的預設值；
    無效、零、負數或非有限的 `params.num_ctx` 值會被忽略。如果較舊的設定只使用
    `contextWindow`/`maxTokens` 來強制原生請求上下文，請執行
    `openclaw doctor --fix`，將它們複製到 `params.num_ctx`。OpenAI 相容配接器仍會依預設從已設定的
    `params.num_ctx` 或 `contextWindow` 注入 `options.num_ctx`；如果上游拒絕
    `options`，請用 `injectNumCtxForOpenAICompat: false` 停用。

    原生模型項目也接受 `params` 下的常見 Ollama 執行階段選項，並作為原生
    `/api/chat` 的 `options` 轉送：`num_keep`、`seed`、`num_predict`、`top_k`、
    `top_p`、`min_p`、`typical_p`、`repeat_last_n`、`temperature`、
    `repeat_penalty`、`presence_penalty`、`frequency_penalty`、`stop`、
    `num_batch`、`num_gpu`、`main_gpu`、`use_mmap` 和 `num_thread`。
    少數鍵（`format`、`keep_alive`、`truncate`、`shift`）會作為最上層請求欄位轉送，
    而不是巢狀的 `options`。OpenClaw 只會轉送這些 Ollama 請求鍵，
    因此像 `streaming` 這類僅限執行階段的參數絕不會送到 Ollama。使用
    `params.think`（或 `params.thinking`）設定最上層的 `think`；`false`
    會停用 Qwen 風格思考模型的 API 層級思考。

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

    按模型設定的 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也可使用；
    如果兩者都設定，明確的供應商模型項目優先。

  </Accordion>

  <Accordion title="思考控制">
    OpenClaw 會依照 Ollama 預期的方式轉送思考設定：最上層 `think`，而不是
    `options.think`。當自動探索模型的 `/api/show` 回報具備 `thinking`
    能力時，會公開 `/think low`、`/think medium`、`/think high` 和 `/think max`；
    非思考模型只會公開 `/think off`。

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

    每個模型的 `params.think`/`params.thinking` 可以針對特定模型停用或強制 API
    thinking。當作用中的執行只有隱含的 `off` 預設值時，OpenClaw 會保留該明確設定；
    非 off 的執行階段命令（例如 `/think medium`）仍會覆寫它。Truthy 的
    thinking 請求絕不會傳送到明確標記為 `reasoning: false` 的模型；
    `think: false` 請求則一律會傳送。

  </Accordion>

  <Accordion title="推理模型">
    名稱為 `deepseek-r1`、`reasoning`、`reason` 或 `think` 的模型預設會被視為
    具備推理能力，不需要額外設定：

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="模型成本">
    Ollama 在本機執行且免費，因此自動探索與手動定義的模型成本皆為 `0`。
  </Accordion>

  <Accordion title="記憶嵌入">
    內建的 Ollama 外掛會為
    [記憶搜尋](/zh-TW/concepts/memory)註冊記憶嵌入提供者。它會使用已設定的 Ollama base URL
    與 API key、呼叫 `/api/embed`，並在可行時將多個記憶片段批次成一個 `input` 請求。

    當 `proxy.enabled=true` 時，傳送到從已設定 `baseUrl` 衍生出的確切主機本機
    loopback origin 的嵌入請求，會使用 OpenClaw 的受保護直接路徑，而不是受管理的轉送 proxy。
    已設定的主機名稱本身必須是 `localhost` 或 loopback IP 字面值；僅解析到 loopback 的
    DNS 名稱仍會使用受管理的 proxy 路徑。LAN、tailnet、private-network 與公開 Ollama
    主機一律維持在受管理的 proxy 路徑上，重新導向到其他主機/連接埠也不會繼承信任。
    `proxy.loopbackMode: "proxy"` 仍會透過 proxy 路由 loopback 流量；
    `proxy.loopbackMode: "block"` 則會在連線前拒絕它；請參閱
    [受管理的 proxy](/zh-TW/security/network-proxy#gateway-loopback-mode)。

    | 屬性 | 值 |
    | --- | --- |
    | 預設模型 | `nomic-embed-text` |
    | 自動 pull | 是，若本機不存在 |
    | 預設 inline 並行數 | 1（其他提供者預設較高；若主機可承受，請用 `nonBatchConcurrency` 提高） |

    查詢時嵌入會對需要或建議使用擷取前綴的模型使用前綴：`nomic-embed-text`、`qwen3-embedding`
    與 `mxbai-embed-large`。文件批次會保持原始格式，因此現有索引不需要格式遷移。

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

    對於遠端嵌入主機，請讓驗證範圍限定在該主機：

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
    Ollama 預設使用**原生 API**（`/api/chat`），可同時支援串流與工具呼叫，不需要特殊設定。

    對於原生請求，thinking 控制會直接轉送：`/think off` 與 `openclaw agent --thinking off`
    會傳送頂層 `think: false`，除非已設定明確的 `params.think`/`params.thinking`；
    `/think low|medium|high` 會傳送對應的 effort 字串；`/think max` 會對應到 Ollama
    最高 effort：`think: "high"`。

    <Tip>
    若要改用 OpenAI-compatible 端點，請參閱上方的「舊版 OpenAI-compatible 模式」；在該模式中，串流與工具呼叫可能無法一起運作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="WSL2 當機迴圈（重複重新啟動）">
    在搭配 NVIDIA/CUDA 的 WSL2 上，官方 Ollama Linux 安裝程式會建立一個
    `Restart=always` 的 `ollama.service` systemd unit。若該服務自動啟動，並在 WSL2
    開機期間載入 GPU-backed 模型，Ollama 可能會在載入時占住主機記憶體；Hyper-V
    記憶體回收不一定能回收那些頁面，因此 Windows 可能會終止 WSL2 VM，systemd 重新啟動
    Ollama，然後迴圈重複發生。

    證據：WSL2 重複重新啟動/終止、WSL2 啟動後 `app.slice` 或 `ollama.service`
    CPU 使用率很高，以及來自 systemd 的 SIGTERM，而不是 Linux OOM killer。

    OpenClaw 在偵測到 WSL2、啟用且 `Restart=always` 的 `ollama.service`，以及可見的
    CUDA 標記時，會記錄啟動警告。

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
    確認 Ollama 正在執行、已設定 `OLLAMA_API_KEY`（或驗證 profile），且
    `models.providers.ollama` **未**明確定義：

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="沒有可用模型">
    在本機 pull 模型，或在 `models.providers.ollama` 中明確定義：

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

  <Accordion title="遠端主機可用 curl 連線，但 OpenClaw 不行">
    請從執行閘道的同一台機器與同一個執行階段驗證：

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    常見原因：

    - `baseUrl` 指向 `localhost`，但閘道在 Docker 中或另一台主機上執行。
    - URL 使用 `/v1`，選用了 OpenAI-compatible 行為，而不是原生 Ollama。
    - 遠端主機需要調整防火牆或 LAN 綁定。
    - 模型在你筆電的 daemon 上，但不在遠端 daemon 上。

  </Accordion>

  <Accordion title="模型將工具 JSON 輸出為文字">
    通常是提供者處於 OpenAI-compatible 模式，或模型無法處理工具 schema。建議使用原生模式：

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

    如果小型本機模型仍無法處理工具 schema，請在該模型項目上設定
    `compat.supportsTools: false`，然後重新測試。

  </Accordion>

  <Accordion title="Kimi 或 GLM 回傳亂碼符號">
    Hosted Kimi/GLM 回應若是很長、非語言的符號序列，會被視為失敗的提供者呼叫，而非成功回覆，
    因此一般的重試/fallback/錯誤處理會接手，而不會將損毀文字保存到 session 中。

    如果再次發生，請擷取模型名稱、目前的 session 檔案，以及該次執行使用的是 `Cloud + Local`
    還是 `Cloud only`，然後嘗試新的 session 與 fallback 模型：

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="冷啟動本機模型逾時">
    大型本機模型可能需要很長的首次載入時間。請將逾時範圍限定在 Ollama 提供者，並可選擇讓模型在回合之間維持載入：

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

    如果主機本身接受連線很慢，`timeoutSeconds` 也會延長此提供者受保護的連線逾時。

  </Accordion>

  <Accordion title="大型內容模型太慢或記憶體不足">
    許多模型宣告的內容長度超過你的硬體能舒適執行的範圍。原生 Ollama 會使用自己的執行階段預設值，
    除非已設定 `params.num_ctx`。請同時限制 OpenClaw 的預算與 Ollama 的請求內容長度，
    以取得可預測的首個 token 延遲：

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

    如果 OpenClaw 傳送太多 prompt，請降低 `contextWindow`。如果 Ollama 的執行階段內容長度對該機器過大，
    請降低 `params.num_ctx`。如果生成執行太久，請降低 `maxTokens`。

  </Accordion>
</AccordionGroup>

<Note>
更多說明：[疑難排解](/zh-TW/help/troubleshooting)與 [FAQ](/zh-TW/help/faq)。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/zh-TW/providers/ollama-cloud" icon="cloud">
    使用專用 `ollama-cloud` 提供者的純雲端設定。
  </Card>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型 refs 與 failover 行為的概覽。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/models" icon="brain">
    如何選擇與設定模型。
  </Card>
  <Card title="Ollama Web Search" href="/zh-TW/tools/ollama-search" icon="magnifying-glass">
    Ollama 驅動的 web search 完整設定與行為細節。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考。
  </Card>
</CardGroup>
