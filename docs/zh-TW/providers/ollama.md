---
read_when:
    - 你想透過 Ollama 使用雲端或本機模型執行 OpenClaw
    - 你需要 Ollama 設定與組態指南
    - 你想要使用 Ollama 視覺模型進行影像理解
summary: 使用 Ollama 執行 OpenClaw（雲端和本機模型）
title: Ollama
x-i18n:
    generated_at: "2026-07-03T09:23:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d91871ef96c3bdc027fe7cfceecae7e1d050913d859e3c6840725002fdf57af
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw 透過 Ollama 的原生 API (`/api/chat`) 與託管雲端模型和本機/自託管 Ollama 伺服器整合。你可以用三種模式使用 Ollama：透過可連線的 Ollama 主機使用 `Cloud + Local`、針對 `https://ollama.com` 使用 `Cloud only`，或針對可連線的 Ollama 主機使用 `Local only`。

OpenClaw 也會將 `ollama-cloud` 註冊為一級託管提供者 ID，供直接使用 Ollama Cloud。當你想要僅雲端路由，而不共用本機 `ollama` 提供者 ID 時，請使用像 `ollama-cloud/kimi-k2.5:cloud` 這樣的參照。

如需專用的僅雲端設定頁面，請參閱 [Ollama Cloud](/zh-TW/providers/ollama-cloud)。

<Warning>
**遠端 Ollama 使用者**：請勿在 OpenClaw 中使用 `/v1` OpenAI 相容 URL (`http://host:11434/v1`)。這會破壞工具呼叫，且模型可能會將原始工具 JSON 作為純文字輸出。請改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（沒有 `/v1`）。
</Warning>

Ollama 提供者設定使用 `baseUrl` 作為標準鍵。OpenClaw 也接受 `baseURL`，以相容 OpenAI SDK 風格的範例，但新設定應優先使用 `baseUrl`。

## 驗證規則

<AccordionGroup>
  <Accordion title="本機與區域網路主機">
    本機和區域網路 Ollama 主機不需要真正的 bearer token。OpenClaw 只會對 local loopback、私人網路、`.local` 和裸主機名稱的 Ollama 基礎 URL 使用本機 `ollama-local` 標記。
  </Accordion>
  <Accordion title="遠端與 Ollama Cloud 主機">
    遠端公開主機和 Ollama Cloud (`https://ollama.com`) 需要透過 `OLLAMA_API_KEY`、驗證設定檔，或提供者的 `apiKey` 提供真實憑證。若要直接使用託管服務，請優先使用提供者 `ollama-cloud`。
  </Accordion>
  <Accordion title="自訂提供者 ID">
    設定 `api: "ollama"` 的自訂提供者 ID 會遵循相同規則。例如，指向私人區域網路 Ollama 主機的 `ollama-remote` 提供者可以使用 `apiKey: "ollama-local"`，而子代理會透過 Ollama 提供者掛鉤解析該標記，而不是將它視為遺失憑證。記憶搜尋也可以將 `agents.defaults.memorySearch.provider` 設為該自訂提供者 ID，讓嵌入使用相符的 Ollama 端點。
  </Accordion>
  <Accordion title="驗證設定檔">
    `auth-profiles.json` 會儲存提供者 ID 的憑證。請將端點設定（`baseUrl`、`api`、模型 ID、標頭、逾時）放在 `models.providers.<id>`。較舊的扁平驗證設定檔檔案，例如 `{ "ollama-windows": { "apiKey": "ollama-local" } }`，不是執行階段格式；請執行 `openclaw doctor --fix`，將它們改寫為標準的 `ollama-windows:default` API 金鑰設定檔並建立備份。該檔案中的 `baseUrl` 是相容性雜訊，應移至提供者設定。
  </Accordion>
  <Accordion title="記憶嵌入範圍">
    當 Ollama 用於記憶嵌入時，bearer 驗證會限定在宣告它的主機範圍內：

    - 提供者層級的金鑰只會傳送到該提供者的 Ollama 主機。
    - `agents.*.memorySearch.remote.apiKey` 只會傳送到其遠端嵌入主機。
    - 純 `OLLAMA_API_KEY` 環境值會被視為 Ollama Cloud 慣例，預設不會傳送到本機或自託管主機。

  </Accordion>
</AccordionGroup>

## 開始使用

選擇你偏好的設定方法和模式。

<Tabs>
  <Tab title="導覽設定（建議）">
    **最適合：**最快完成可用的 Ollama 雲端或本機設定。

    <Steps>
      <Step title="執行導覽設定">
        ```bash
        openclaw onboard
        ```

        從提供者清單中選取 **Ollama**。
      </Step>
      <Step title="選擇模式">
        - **雲端 + 本機** — 本機 Ollama 主機加上透過該主機路由的雲端模型
        - **僅雲端** — 透過 `https://ollama.com` 使用託管 Ollama 模型
        - **僅本機** — 僅使用本機模型

      </Step>
      <Step title="選取模型">
        `Cloud only` 會提示輸入 `OLLAMA_API_KEY`，並建議託管雲端預設值。`Cloud + Local` 和 `Local only` 會要求 Ollama 基礎 URL、探索可用模型，並在所選本機模型尚不可用時自動拉取它。當 Ollama 回報已安裝的 `:latest` 標籤（例如 `gemma4:latest`）時，設定只會顯示該已安裝模型一次，而不是同時顯示 `gemma4` 和 `gemma4:latest`，或再次拉取裸別名。`Cloud + Local` 也會檢查該 Ollama 主機是否已登入以取得雲端存取權。
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### 非互動模式

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    可選擇指定自訂基礎 URL 或模型：

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="手動設定">
    **最適合：**完整控制雲端或本機設定。

    <Steps>
      <Step title="選擇雲端或本機">
        - **雲端 + 本機**：安裝 Ollama、使用 `ollama signin` 登入，並透過該主機路由雲端請求
        - **僅雲端**：搭配 `OLLAMA_API_KEY` 使用 `https://ollama.com`
        - **僅本機**：從 [ollama.com/download](https://ollama.com/download) 安裝 Ollama

      </Step>
      <Step title="拉取本機模型（僅本機）">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="為 OpenClaw 啟用 Ollama">
        對於 `Cloud only`，請使用真實的 `OLLAMA_API_KEY`。對於由主機支援的設定，任何佔位值都可使用：

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="檢查並設定你的模型">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        或在設定中設定預設值：

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

## 雲端模型

<Tabs>
  <Tab title="雲端 + 本機">
    `Cloud + Local` 使用可連線的 Ollama 主機作為本機和雲端模型的控制點。這是 Ollama 偏好的混合流程。

    設定期間請使用 **雲端 + 本機**。OpenClaw 會提示輸入 Ollama 基礎 URL、從該主機探索本機模型，並檢查主機是否已透過 `ollama signin` 登入以取得雲端存取權。當主機已登入時，OpenClaw 也會建議託管雲端預設值，例如 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 和 `glm-5.1:cloud`。

    如果主機尚未登入，OpenClaw 會保持僅本機設定，直到你執行 `ollama signin`。

  </Tab>

  <Tab title="僅雲端">
    `Cloud only` 會針對位於 `https://ollama.com` 的 Ollama 託管 API 執行。

    設定期間請使用 **僅雲端**。OpenClaw 會提示輸入 `OLLAMA_API_KEY`、設定 `baseUrl: "https://ollama.com"`，並植入託管雲端模型清單。此路徑**不**需要本機 Ollama 伺服器或 `ollama signin`。

    `openclaw onboard` 期間顯示的雲端模型清單會從 `https://ollama.com/api/tags` 即時填入，上限為 500 個項目，因此選擇器會反映目前的託管目錄，而不是靜態種子。如果 `ollama.com` 無法連線，或在設定時未回傳任何模型，OpenClaw 會退回先前硬編碼的建議，讓導覽設定仍能完成。

    你也可以直接設定一級雲端提供者：

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="僅本機">
    在僅本機模式中，OpenClaw 會從已設定的 Ollama 執行個體探索模型。此路徑適用於本機或自託管 Ollama 伺服器。

    OpenClaw 目前建議使用 `gemma4` 作為本機預設值。

  </Tab>
</Tabs>

## 模型探索（隱含提供者）

當你設定 `OLLAMA_API_KEY`（或驗證設定檔），且**沒有**定義 `models.providers.ollama` 或另一個帶有 `api: "ollama"` 的自訂遠端提供者時，OpenClaw 會從位於 `http://127.0.0.1:11434` 的本機 Ollama 執行個體探索模型。

| 行為                 | 詳細資訊                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目錄查詢             | 查詢 `/api/tags`                                                                                                                                                     |
| 能力偵測             | 使用盡力而為的 `/api/show` 查詢來讀取 `contextWindow`、展開的 `num_ctx` Modelfile 參數，以及包含視覺/工具的能力                                                     |
| 視覺模型             | 由 `/api/show` 回報具有 `vision` 能力的模型會標記為支援影像（`input: ["text", "image"]`），因此 OpenClaw 會自動將影像注入提示                                       |
| 推理偵測             | 可用時使用 `/api/show` 能力（包含 `thinking`）；當 Ollama 省略能力時，會退回模型名稱啟發式判斷（`r1`、`reasoning`、`think`）                                        |
| Token 限制           | 將 `maxTokens` 設為 OpenClaw 使用的預設 Ollama 最大 token 上限                                                                                                      |
| 成本                 | 將所有成本設為 `0`                                                                                                                                                   |

這可避免手動模型項目，同時讓目錄與本機 Ollama 執行個體保持一致。你可以在本機 `infer model run` 中使用完整參照，例如 `ollama/<pulled-model>:latest`；OpenClaw 會從 Ollama 的即時目錄解析該已安裝模型，而不需要手寫 `models.json` 項目。

對於已登入的 Ollama 主機，部分 `:cloud` 模型在出現在 `/api/tags` 之前，可能已可透過 `/api/chat` 和 `/api/show` 使用。當你明確選取完整的 `ollama/<model>:cloud` 參照時，OpenClaw 會使用 `/api/show` 驗證該確切缺失模型，並且只有在 Ollama 確認模型中繼資料時，才會將它加入執行階段目錄。拼字錯誤仍會作為未知模型失敗，而不會自動建立。

```bash
# See what models are available
ollama list
openclaw models list
```

若要進行狹窄的文字生成煙霧測試，避免完整代理工具表面，請搭配完整 Ollama 模型參照使用本機 `infer model run`：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

該路徑仍會使用 OpenClaw 已設定的提供者、驗證和原生 Ollama 傳輸，但不會啟動聊天代理回合或載入 MCP/工具情境。如果此操作成功但一般代理回覆失敗，接著請排查模型的代理提示/工具容量。

若要在相同精簡路徑上對視覺模型進行狹窄煙霧測試，請將一個或多個影像檔加入 `infer model run`。這會將提示和影像直接傳送到所選 Ollama 視覺模型，而不載入聊天工具、記憶或先前工作階段情境：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` 接受偵測為 `image/*` 的檔案，包括常見的 PNG、JPEG 與 WebP 輸入。非影像檔案會在呼叫 Ollama 前被拒絕。若要進行語音辨識，請改用 `openclaw infer audio transcribe`。

當你使用 `/model ollama/<model>` 切換對話時，OpenClaw 會將其視為精確的使用者選擇。如果設定的 Ollama `baseUrl` 無法連線，下一則回覆會因提供者錯誤而失敗，而不是靜默改由另一個已設定的備援模型回答。

隔離的排程工作會在啟動代理程式回合前多做一次本機安全檢查。如果選取的模型解析為本機、私人網路或 `.local` Ollama 提供者，且 `/api/tags` 無法連線，OpenClaw 會將該次排程執行記錄為 `skipped`，並在錯誤文字中包含選取的 `ollama/<model>`。端點預檢會快取 5 分鐘，因此指向同一個已停止 Ollama 常駐程式的多個排程工作，不會全部啟動會失敗的模型請求。

使用以下指令針對本機 Ollama 即時驗證本機文字路徑、原生串流路徑與 embeddings：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

若要進行 Ollama Cloud API 金鑰煙霧測試，請將即時測試指向 `https://ollama.com`，並從目前目錄選擇一個託管模型：

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

雲端煙霧測試會執行文字、原生串流與網頁搜尋。針對 `https://ollama.com`，它預設會略過 embeddings，因為 Ollama Cloud API 金鑰可能未授權 `/api/embed`。當你明確希望即時測試在已設定的雲端金鑰無法使用 embed 端點時失敗，請設定 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`。

若要新增模型，只要用 Ollama 拉取即可：

```bash
ollama pull mistral
```

新模型會自動被探索並可供使用。

<Note>
如果你明確設定 `models.providers.ollama`，或設定自訂遠端提供者，例如帶有 `api: "ollama"` 的 `models.providers.ollama-cloud`，自動探索會被略過，且你必須手動定義模型。像 `http://127.0.0.2:11434` 這類 loopback 自訂提供者仍會被視為本機。請參閱下方的明確設定章節。
</Note>

## 節點本機推論

代理程式可以將短任務委派給安裝在已配對桌面或伺服器節點上的 Ollama 模型。提示與回應會透過既有的已驗證閘道／節點連線傳遞；模型請求會在選取的節點上，針對其標準 loopback Ollama 端點（`http://127.0.0.1:11434`）執行。

<Steps>
  <Step title="Start Ollama on the node">
    拉取至少一個聊天模型，並保持 Ollama 執行：

    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```

  </Step>
  <Step title="Connect the node host">
    在與 Ollama 相同的機器上，將節點主機連線到閘道：

    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    在閘道主機上核准新裝置及其宣告的節點命令，然後驗證節點：

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    初次連線，以及新增 Ollama 命令的升級，都可能觸發節點命令核准。如果節點連線時未公告 `ollama.models` 和 `ollama.chat`，請再次檢查 `openclaw nodes pending`。

  </Step>
  <Step title="Ask an agent to use local inference">
    內建的 Ollama 外掛會公開 `node_inference` 工具。代理程式會先使用 `action: "discover"`，再使用 `action: "run"` 搭配回傳的節點與模型。如果剛好有一個具備能力的節點已連線，`run` 可以省略節點。

    例如：「探索我節點上的 Ollama 模型，然後使用最快且已載入的模型摘要這段文字。」

  </Step>
</Steps>

探索會讀取 `/api/tags`、檢查 `/api/show` 能力，並在可用時使用 `/api/ps` 來優先排序已載入的模型。它只會回傳本機、具備聊天能力的模型：Ollama Cloud 列與僅支援 embedding 的模型會被排除。每次執行都會要求 Ollama 停用模型思考，並將輸出上限設為 512 個 token，除非工具呼叫要求不同的 `maxTokens` 值。有些模型，例如 GPT-OSS，不支援停用思考，仍可能使用推理 token。

若要讓 Ollama 在節點上保持執行，但不提供給代理程式使用，請在該節點主機使用的設定中設置以下內容：

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

如果節點使用上方設定中的前景 `openclaw node run` 命令，請停止該程序並重新執行命令。如果它使用已安裝的節點服務，請執行 `openclaw node restart`。

該節點會停止公告 `ollama.models` 和 `ollama.chat`；Ollama 本身與閘道的 Ollama 提供者維持不變。將值設為 `true` 並重新啟動節點，即可再次公告本機推論。變更後的命令表面可能需要在重新連線後透過 `openclaw nodes pending` 核准。

你可以不經代理程式回合，直接驗證相同的節點命令：

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

節點本機推論刻意不重用遠端或雲端 `models.providers.ollama.baseUrl`。請在節點的標準 loopback 端點上啟動 Ollama。節點命令預設可在 macOS、Linux 與 Windows 節點主機上使用，並仍受一般節點配對與命令政策約束。

## 視覺與影像描述

內建的 Ollama 外掛會將 Ollama 註冊為具備影像能力的媒體理解提供者。這讓 OpenClaw 能將明確的影像描述請求，以及已設定的影像模型預設值，路由到本機或託管的 Ollama 視覺模型。

若要使用本機視覺，請拉取支援影像的模型：

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

然後使用 infer 命令列介面驗證：

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` 必須是完整的 `<provider/model>` 參照。設定後，`openclaw infer image describe` 會先嘗試該模型，而不是因為模型支援原生視覺而略過描述。如果模型呼叫失敗，OpenClaw 可以繼續嘗試已設定的 `agents.defaults.imageModel.fallbacks`；檔案或 URL 準備錯誤仍會在嘗試備援前失敗。

當你想要 OpenClaw 的影像理解提供者流程、已設定的 `agents.defaults.imageModel`，以及影像描述輸出形狀時，請使用 `infer image describe`。當你想要使用自訂提示與一張或多張影像進行原始多模態模型探測時，請使用 `infer model run --file`。

若要將 Ollama 設為傳入媒體的預設影像理解模型，請設定 `agents.defaults.imageModel`：

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

建議使用完整的 `ollama/<model>` 參照。如果相同模型列在 `models.providers.ollama.models` 下，帶有 `input: ["text", "image"]`，且沒有其他已設定影像提供者公開相同的裸模型 ID，OpenClaw 也會將像 `qwen2.5vl:7b` 這樣的裸 `imageModel` 參照正規化為 `ollama/qwen2.5vl:7b`。如果超過一個已設定影像提供者擁有相同裸 ID，請明確使用提供者前綴。

較慢的本機視覺模型可能需要比雲端模型更長的影像理解逾時。當 Ollama 嘗試在受限硬體上配置完整公告的視覺上下文時，它們也可能當機或停止。設定能力逾時，並在你只需要一般影像描述回合時，於模型項目上限制 `num_ctx`：

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

此逾時會套用於傳入影像理解，以及代理程式可在回合中呼叫的明確 `image` 工具。提供者層級的 `models.providers.ollama.timeoutSeconds` 仍會控制一般模型呼叫底層 Ollama HTTP 請求防護。

使用以下指令針對本機 Ollama 即時驗證明確影像工具：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

如果你手動定義 `models.providers.ollama.models`，請將視覺模型標記為支援影像輸入：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 會拒絕未標記為具備影像能力模型的影像描述請求。使用隱式探索時，當 `/api/show` 回報視覺能力，OpenClaw 會從 Ollama 讀取這項資訊。

## 設定

<Tabs>
  <Tab title="Basic (implicit discovery)">
    最簡單的僅本機啟用路徑是透過環境變數：

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果已設定 `OLLAMA_API_KEY`，你可以在提供者項目中省略 `apiKey`，OpenClaw 會為可用性檢查填入它。
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    當你想要託管雲端設定、Ollama 在另一個主機／連接埠上執行、想強制指定特定上下文視窗或模型清單，或想要完全手動的模型定義時，請使用明確設定。

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
    如果 Ollama 在不同主機或連接埠上執行（明確設定會停用自動探索，因此請手動定義模型）：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
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
    請勿在 URL 加上 `/v1`。`/v1` 路徑使用 OpenAI 相容模式，在該模式中工具呼叫並不可靠。請使用不帶路徑後綴的基礎 Ollama URL。
    </Warning>

  </Tab>
</Tabs>

## 常見配方

請以這些作為起點，並將模型 ID 替換為 `ollama list` 或 `openclaw models list --provider ollama` 中的確切名稱。

<AccordionGroup>
  <Accordion title="具備自動探索的本機模型">
    當 Ollama 與閘道在同一台機器上執行，且你想讓 OpenClaw 自動探索已安裝的模型時，請使用此方式。

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    此路徑可讓設定保持最小化。除非你想手動定義模型，否則不要加入 `models.providers.ollama` 區塊。

  </Accordion>

  <Accordion title="使用手動模型的區域網路 Ollama 主機">
    對於區域網路主機，請使用原生 Ollama URL。不要加入 `/v1`。

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

    `contextWindow` 是 OpenClaw 端的上下文預算。`params.num_ctx` 會隨請求傳送給 Ollama。當你的硬體無法執行模型宣稱的完整上下文時，請讓兩者保持一致。

  </Accordion>

  <Accordion title="僅使用 Ollama Cloud">
    當你不執行本機 daemon，且想直接使用託管的 Ollama 模型時，請使用此方式。

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

  </Accordion>

  <Accordion title="透過已登入 daemon 同時使用雲端與本機">
    當本機或區域網路 Ollama daemon 已使用 `ollama signin` 登入，且應同時提供本機模型與 `:cloud` 模型時，請使用此方式。

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
    當你有多於一台 Ollama 伺服器時，請使用自訂 provider ID。每個 provider 都有自己的主機、模型、驗證、逾時與模型參照。

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

    當 OpenClaw 傳送請求時，作用中的 provider 前綴會被移除，因此 `ollama-large/qwen3.5:27b` 會以 `qwen3.5:27b` 傳送至 Ollama。

  </Accordion>

  <Accordion title="精簡本機模型設定檔">
    有些本機模型可以回答簡單提示，但難以處理完整的代理工具介面。請先限制工具與上下文，再變更全域執行階段設定。

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

    只有在模型或伺服器於工具 schema 上可靠地失敗時，才使用 `compat.supportsTools: false`。這會以代理能力換取穩定性。
    `localModelLean` 會從直接代理介面移除瀏覽器、排程與訊息工具，並預設將較大的目錄放在結構化工具搜尋控制後方，除非某次執行必須保留直接訊息傳遞語意；但它不會變更 Ollama 的執行階段上下文或思考模式。對於會迴圈或將回應預算耗在隱藏推理上的小型 Qwen 風格思考模型，請搭配明確的 `params.num_ctx` 與 `params.thinking: false` 使用。

  </Accordion>
</AccordionGroup>

### 模型選擇

設定完成後，你的所有 Ollama 模型都可使用：

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

也支援自訂 Ollama provider ID。當模型參照使用作用中的
provider 前綴，例如 `ollama-spark/qwen3:32b` 時，OpenClaw 只會在呼叫 Ollama 前移除該
前綴，因此伺服器會收到 `qwen3:32b`。

對於較慢的本機模型，請先偏好 provider 範圍的請求調校，再提高
整個代理執行階段逾時：

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

`timeoutSeconds` 會套用至模型 HTTP 請求，包括連線設定、
標頭、主體串流，以及總體受保護抓取中止。`params.keep_alive`
會在原生 `/api/chat` 請求中作為頂層 `keep_alive` 轉送至 Ollama；
當首次回合載入時間是瓶頸時，請為每個模型設定它。

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

對於遠端主機，請將 `127.0.0.1` 替換為 `baseUrl` 中使用的主機。如果 `curl` 可運作但 OpenClaw 不行，請檢查閘道是否在不同機器、容器或服務帳戶下執行。

## Ollama 網頁搜尋

OpenClaw 支援 **Ollama 網頁搜尋** 作為內建的 `web_search` provider。

| 屬性        | 詳細資訊                                                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主機        | 使用你設定的 Ollama 主機（設定時為 `models.providers.ollama.baseUrl`，否則為 `http://127.0.0.1:11434`）；`https://ollama.com` 會直接使用託管 API |
| 驗證        | 已登入的本機 Ollama 主機無需金鑰；直接 `https://ollama.com` 搜尋或受驗證保護的主機使用 `OLLAMA_API_KEY` 或已設定的 provider 驗證               |
| 需求 | 本機/自行託管主機必須正在執行，且已使用 `ollama signin` 登入；直接託管搜尋需要 `baseUrl: "https://ollama.com"` 加上真正的 Ollama API 金鑰 |

在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 **Ollama 網頁搜尋**，或設定：

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

對於已登入的本機 daemon，OpenClaw 會使用 daemon 的 `/api/experimental/web_search` proxy。對於 `https://ollama.com`，它會直接呼叫託管的 `/api/web_search` 端點。

<Note>
如需完整設定與行為詳細資訊，請參閱 [Ollama 網頁搜尋](/zh-TW/tools/ollama-search)。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="舊版 OpenAI 相容模式">
    <Warning>
    **工具呼叫在 OpenAI 相容模式中不可靠。** 只有在你需要 proxy 的 OpenAI 格式，且不依賴原生工具呼叫行為時，才使用此模式。
    </Warning>

    如果你需要改用 OpenAI 相容端點（例如位於只支援 OpenAI 格式的 proxy 後方），請明確設定 `api: "openai-completions"`：

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

    此模式可能不支援同時使用串流與工具呼叫。你可能需要在模型設定中使用 `params: { streaming: false }` 停用串流。

    當 `api: "openai-completions"` 與 Ollama 搭配使用時，OpenClaw 預設會注入 `options.num_ctx`，因此 Ollama 不會靜默退回 4096 上下文視窗。如果你的 proxy/upstream 拒絕未知的 `options` 欄位，請停用此行為：

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
    對於自動探索的模型，OpenClaw 會在可用時使用 Ollama 回報的上下文視窗，包括來自自訂 Modelfile 的較大 `PARAMETER num_ctx` 值。否則會退回 OpenClaw 使用的預設 Ollama 上下文視窗。

    你可以為該 Ollama 提供者下的每個模型設定提供者層級的 `contextWindow`、`contextTokens` 和 `maxTokens` 預設值，然後在需要時依模型覆寫。`contextWindow` 是 OpenClaw 的提示與壓縮預算。除非你明確設定 `params.num_ctx`，否則原生 Ollama 請求會讓 `options.num_ctx` 保持未設定，讓 Ollama 可以套用自己的模型、`OLLAMA_CONTEXT_LENGTH`，或以 VRAM 為基礎的預設值。若要在不重建 Modelfile 的情況下限制或強制 Ollama 的每次請求執行期情境，請設定 `params.num_ctx`；無效、零、負數和非有限值會被忽略。如果你升級了較舊的設定，且該設定只使用 `contextWindow` 或 `maxTokens` 來強制原生 Ollama 請求情境，請執行 `openclaw doctor --fix`，將那些明確的提供者或模型預算複製到 `params.num_ctx`。OpenAI 相容的 Ollama 轉接器仍會依預設從已設定的 `params.num_ctx` 或 `contextWindow` 注入 `options.num_ctx`；如果你的上游拒絕 `options`，請使用 `injectNumCtxForOpenAICompat: false` 停用此行為。

    原生 Ollama 模型項目也接受 `params` 下的常見 Ollama 執行期選項，包括 `temperature`、`top_p`、`top_k`、`min_p`、`num_predict`、`stop`、`repeat_penalty`、`num_batch`、`num_thread` 和 `use_mmap`。OpenClaw 只會轉送 Ollama 請求鍵，因此 OpenClaw 執行期參數，例如 `streaming`，不會洩漏給 Ollama。使用 `params.think` 或 `params.thinking` 傳送頂層 Ollama `think`；`false` 會針對 Qwen 風格的思考模型停用 API 層級思考。

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

    依模型設定的 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也可使用。如果兩者都有設定，明確的提供者模型項目會優先於代理程式預設值。

  </Accordion>

  <Accordion title="思考控制">
    對於原生 Ollama 模型，OpenClaw 會依 Ollama 預期的方式轉送思考控制：頂層 `think`，而不是 `options.think`。自動探索的模型若其 `/api/show` 回應包含 `thinking` 能力，會公開 `/think low`、`/think medium`、`/think high` 和 `/think max`；非思考模型只會公開 `/think off`。

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    你也可以設定模型預設值：

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

    依模型設定的 `params.think` 或 `params.thinking` 可以停用或強制特定已設定模型的 Ollama API 思考。當作用中執行只有隱含預設 `off` 時，OpenClaw 會保留這些明確的模型參數；非 off 的執行期命令，例如 `/think medium`，仍會覆寫作用中執行。

  </Accordion>

  <Accordion title="推理模型">
    OpenClaw 預設會將名稱包含 `deepseek-r1`、`reasoning` 或 `think` 等字樣的模型視為具備推理能力。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    不需要額外設定。OpenClaw 會自動標記它們。

  </Accordion>

  <Accordion title="模型成本">
    Ollama 免費且在本機執行，因此所有模型成本都設為 $0。這同時適用於自動探索和手動定義的模型。
  </Accordion>

  <Accordion title="記憶嵌入">
    內建的 Ollama 外掛會為
    [記憶搜尋](/zh-TW/concepts/memory)註冊記憶嵌入提供者。它使用已設定的 Ollama 基礎 URL
    和 API 金鑰，呼叫 Ollama 目前的 `/api/embed` 端點，並在可能時將
    多個記憶區塊批次合併為一個 `input` 請求。

    當 `proxy.enabled=true` 時，傳送到從已設定 `baseUrl` 衍生出的精確
    主機 local loopback 來源的 Ollama 記憶嵌入請求，會使用
    OpenClaw 的受保護直接路徑，而不是受管理的轉送 Proxy。已設定的
    主機名稱本身必須是 `localhost` 或 loopback IP 字面值；
    僅解析到 loopback 的 DNS 名稱仍會使用受管理的 Proxy 路徑。
    LAN、tailnet、私有網路和公開 Ollama 主機也會維持在
    受管理的 Proxy 路徑上。重新導向到其他主機或連接埠不會繼承信任。
    操作者仍可設定全域 `proxy.loopbackMode: "proxy"` 設定，
    透過 Proxy 傳送 loopback 流量，或設定 `proxy.loopbackMode: "block"`
    在開啟連線前拒絕 loopback 連線；請參閱
    [受管理 Proxy](/zh-TW/security/network-proxy#gateway-loopback-mode)，了解此設定對
    整個處理程序的影響。

    | 屬性      | 值               |
    | ------------- | ------------------- |
    | 預設模型 | `nomic-embed-text`  |
    | 自動拉取     | 是 — 如果本機不存在，會自動拉取嵌入模型 |

    查詢時嵌入會針對需要或建議使用擷取前綴的模型使用擷取前綴，包括 `nomic-embed-text`、`qwen3-embedding` 和 `mxbai-embed-large`。記憶文件批次會保持原始格式，因此現有索引不需要格式遷移。

    若要選取 Ollama 作為記憶搜尋嵌入提供者：

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

    對於遠端嵌入主機，請將驗證範圍限定於該主機：

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
    OpenClaw 的 Ollama 整合預設使用**原生 Ollama API**（`/api/chat`），完整支援串流與工具呼叫同時使用。不需要特殊設定。

    對於原生 `/api/chat` 請求，OpenClaw 也會直接將思考控制轉送給 Ollama：`/think off` 和 `openclaw agent --thinking off` 會傳送頂層 `think: false`，除非已設定明確的模型 `params.think`/`params.thinking` 值，而 `/think low|medium|high` 會傳送相符的頂層 `think` 努力度字串。`/think max` 會對應到 Ollama 最高的原生努力度，`think: "high"`。

    <Tip>
    如果你需要使用 OpenAI 相容端點，請參閱上方的「舊版 OpenAI 相容模式」章節。在該模式下，串流和工具呼叫可能無法同時運作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="WSL2 當機迴圈（反覆重新啟動）">
    在搭配 NVIDIA/CUDA 的 WSL2 上，官方 Ollama Linux 安裝程式會建立含有 `Restart=always` 的 `ollama.service` systemd 單元。如果該服務自動啟動並在 WSL2 開機期間載入 GPU 支援的模型，Ollama 可能會在模型載入時鎖定主機記憶體。Hyper-V 記憶體回收不一定能回收這些已鎖定的頁面，因此 Windows 可能會終止 WSL2 VM，systemd 再次啟動 Ollama，迴圈便會重複。

    常見證據：

    - Windows 端出現反覆的 WSL2 重新啟動或終止
    - WSL2 啟動後不久，`app.slice` 或 `ollama.service` 中出現高 CPU 使用率
    - 來自 systemd 的 SIGTERM，而不是 Linux OOM-killer 事件

    OpenClaw 在偵測到 WSL2、已啟用且具有 `Restart=always` 的 `ollama.service`，以及可見的 CUDA 標記時，會記錄啟動警告。

    緩解方式：

    ```bash
    sudo systemctl disable ollama
    ```

    將此加入 Windows 端的 `%USERPROFILE%\.wslconfig`，然後執行 `wsl --shutdown`：

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    在 Ollama 服務環境中設定較短的 keep-alive，或只在需要時手動啟動 Ollama：

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    請參閱 [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)。

  </Accordion>

  <Accordion title="未偵測到 Ollama">
    請確認 Ollama 正在執行，且你已設定 `OLLAMA_API_KEY`（或驗證設定檔），並且你**沒有**定義明確的 `models.providers.ollama` 項目：

    ```bash
    ollama serve
    ```

    驗證 API 可存取：

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="沒有可用模型">
    如果你的模型未列出，請在本機拉取模型，或在 `models.providers.ollama` 中明確定義它。

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="連線遭拒">
    檢查 Ollama 是否正在正確的連接埠上執行：

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="遠端主機可透過 curl 使用，但 OpenClaw 無法使用">
    從執行閘道的同一台機器與執行期驗證：

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    常見原因：

    - `baseUrl` 指向 `localhost`，但閘道在 Docker 或另一台主機上執行。
    - URL 使用 `/v1`，這會選取 OpenAI 相容行為，而不是原生 Ollama。
    - 遠端主機需要在 Ollama 端變更防火牆或 LAN 綁定。
    - 模型存在於你筆記型電腦的常駐程式上，但不存在於遠端常駐程式上。

  </Accordion>

  <Accordion title="模型將工具 JSON 輸出為文字">
    這通常表示提供者使用 OpenAI 相容模式，或模型無法處理工具結構描述。

    優先使用原生 Ollama 模式：

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

    如果小型本機模型仍在工具結構描述上失敗，請在該模型項目上設定 `compat.supportsTools: false` 並重新測試。

  </Accordion>

  <Accordion title="Kimi 或 GLM 回傳亂碼符號">
    由託管 Kimi/GLM 回傳且內容很長、非語言符號連續輸出的回應，會被視為失敗的提供者輸出，而不是成功的助理答案。這可讓正常的重試、fallback 或錯誤處理接手，而不會將損毀文字持久保存到工作階段中。

    如果反覆發生，請擷取原始模型名稱、目前的工作階段檔案，以及該執行使用的是 `Cloud + Local` 還是 `Cloud only`，然後嘗試新的工作階段和 fallback 模型：

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="冷啟動本機模型逾時">
    大型本機模型可能需要很長的首次載入時間，串流才會開始。請將逾時範圍限定於 Ollama 提供者，並可選擇要求 Ollama 在回合之間保持模型載入：

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

    如果主機本身接受連線的速度很慢，`timeoutSeconds` 也會延長此提供者受保護的 Undici 連線逾時。

  </Accordion>

  <Accordion title="大型內容模型太慢或記憶體不足">
    許多 Ollama 模型宣稱的內容範圍大於你的硬體能夠舒適執行的範圍。原生 Ollama 會使用 Ollama 自己的執行階段內容預設值，除非你設定 `params.num_ctx`。如果你想要可預測的首個 token 延遲，請同時限制 OpenClaw 的預算和 Ollama 的請求內容：

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

    如果 OpenClaw 傳送的提示過多，請先降低 `contextWindow`。如果 Ollama 正在載入對該機器而言過大的執行階段內容，請降低 `params.num_ctx`。如果生成時間過長，請降低 `maxTokens`。

  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting) 和 [常見問題](/zh-TW/help/faq)。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型參照與容錯移轉行為的概覽。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/models" icon="brain">
    如何選擇與設定模型。
  </Card>
  <Card title="Ollama 網頁搜尋" href="/zh-TW/tools/ollama-search" icon="magnifying-glass">
    Ollama 驅動網頁搜尋的完整設定與行為細節。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考。
  </Card>
</CardGroup>
