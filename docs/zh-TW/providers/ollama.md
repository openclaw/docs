---
read_when:
    - 你想透過 Ollama 使用雲端或本機模型執行 OpenClaw
    - 你需要 Ollama 設定與組態指引
    - 你想要使用 Ollama 視覺模型來理解圖片
summary: 使用 Ollama 執行 OpenClaw（雲端與本機模型）
title: Ollama
x-i18n:
    generated_at: "2026-07-01T05:28:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e047ee6c0531d1d0231d5ccad00f9af0889039d527cd1247c9b802bc406eadf
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw 與 Ollama 的原生 API（`/api/chat`）整合，可用於託管雲端模型以及本機/自行託管的 Ollama 伺服器。你可以透過三種模式使用 Ollama：透過可連線的 Ollama 主機使用 `Cloud + Local`、針對 `https://ollama.com` 使用 `Cloud only`，或針對可連線的 Ollama 主機使用 `Local only`。

OpenClaw 也會將 `ollama-cloud` 註冊為第一級託管提供者 id，以便直接使用 Ollama Cloud。當你想要僅雲端路由、而不共用本機 `ollama` 提供者 id 時，請使用像 `ollama-cloud/kimi-k2.5:cloud` 這樣的參照。

如需專用的僅雲端設定頁面，請參閱 [Ollama Cloud](/zh-TW/providers/ollama-cloud)。

<Warning>
**遠端 Ollama 使用者**：請勿搭配 OpenClaw 使用 `/v1` OpenAI 相容 URL（`http://host:11434/v1`）。這會破壞工具呼叫，且模型可能會將原始工具 JSON 以純文字輸出。請改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（沒有 `/v1`）。
</Warning>

Ollama 提供者設定使用 `baseUrl` 作為標準鍵。OpenClaw 也接受 `baseURL`，以相容於 OpenAI SDK 風格的範例，但新設定應優先使用 `baseUrl`。

## 驗證規則

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    本機和 LAN Ollama 主機不需要真正的 bearer token。OpenClaw 只會針對 loopback、私人網路、`.local` 和裸主機名稱 Ollama base URL 使用本機 `ollama-local` 標記。
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    遠端公開主機和 Ollama Cloud（`https://ollama.com`）需要透過 `OLLAMA_API_KEY`、驗證設定檔，或提供者的 `apiKey` 提供真正的憑證。若要直接使用託管服務，建議使用提供者 `ollama-cloud`。
  </Accordion>
  <Accordion title="Custom provider ids">
    設定 `api: "ollama"` 的自訂提供者 id 會遵循相同規則。例如，指向私人 LAN Ollama 主機的 `ollama-remote` 提供者可以使用 `apiKey: "ollama-local"`，而子代理會透過 Ollama 提供者 hook 解析該標記，而不是將它視為缺少憑證。記憶搜尋也可以將 `agents.defaults.memorySearch.provider` 設為該自訂提供者 id，讓嵌入使用相符的 Ollama 端點。
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` 會儲存提供者 id 的憑證。請將端點設定（`baseUrl`、`api`、模型 id、標頭、逾時）放在 `models.providers.<id>` 中。較舊的扁平驗證設定檔，例如 `{ "ollama-windows": { "apiKey": "ollama-local" } }`，不是執行階段格式；請執行 `openclaw doctor --fix`，將它們重寫為標準 `ollama-windows:default` API 金鑰設定檔並建立備份。該檔案中的 `baseUrl` 是相容性雜訊，應移到提供者設定。
  </Accordion>
  <Accordion title="Memory embedding scope">
    當 Ollama 用於記憶嵌入時，bearer 驗證會限定在宣告它的主機範圍內：

    - 提供者層級的金鑰只會傳送到該提供者的 Ollama 主機。
    - `agents.*.memorySearch.remote.apiKey` 只會傳送到其遠端嵌入主機。
    - 純 `OLLAMA_API_KEY` 環境值會被視為 Ollama Cloud 慣例，預設不會傳送到本機或自行託管的主機。

  </Accordion>
</AccordionGroup>

## 開始使用

選擇你偏好的設定方法與模式。

<Tabs>
  <Tab title="Onboarding (recommended)">
    **最適合：**最快完成可運作的 Ollama 雲端或本機設定。

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        從提供者清單中選取 **Ollama**。
      </Step>
      <Step title="Choose your mode">
        - **Cloud + Local** — 本機 Ollama 主機，加上透過該主機路由的雲端模型
        - **Cloud only** — 透過 `https://ollama.com` 使用託管 Ollama 模型
        - **Local only** — 僅使用本機模型

      </Step>
      <Step title="Select a model">
        `Cloud only` 會提示輸入 `OLLAMA_API_KEY`，並建議託管雲端預設值。`Cloud + Local` 和 `Local only` 會要求 Ollama base URL、探索可用模型，並在所選本機模型尚不可用時自動拉取。當 Ollama 回報已安裝的 `:latest` 標籤，例如 `gemma4:latest` 時，設定只會顯示該已安裝模型一次，而不是同時顯示 `gemma4` 和 `gemma4:latest`，或再次拉取裸別名。`Cloud + Local` 也會檢查該 Ollama 主機是否已登入以存取雲端。
      </Step>
      <Step title="Verify the model is available">
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

    可選擇指定自訂 base URL 或模型：

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **最適合：**完整控制雲端或本機設定。

    <Steps>
      <Step title="Choose cloud or local">
        - **Cloud + Local**：安裝 Ollama、使用 `ollama signin` 登入，並透過該主機路由雲端要求
        - **Cloud only**：搭配 `OLLAMA_API_KEY` 使用 `https://ollama.com`
        - **Local only**：從 [ollama.com/download](https://ollama.com/download) 安裝 Ollama

      </Step>
      <Step title="Pull a local model (local only)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Enable Ollama for OpenClaw">
        對於 `Cloud only`，請使用你真正的 `OLLAMA_API_KEY`。對於以主機支援的設定，任何 placeholder 值都可使用：

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspect and set your model">
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
  <Tab title="Cloud + Local">
    `Cloud + Local` 使用可連線的 Ollama 主機作為本機和雲端模型的控制點。這是 Ollama 偏好的混合流程。

    設定期間使用 **Cloud + Local**。OpenClaw 會提示輸入 Ollama base URL、從該主機探索本機模型，並使用 `ollama signin` 檢查該主機是否已登入以存取雲端。當主機已登入時，OpenClaw 也會建議託管雲端預設值，例如 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 和 `glm-5.1:cloud`。

    如果主機尚未登入，OpenClaw 會讓設定維持僅本機，直到你執行 `ollama signin`。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` 會針對位於 `https://ollama.com` 的 Ollama 託管 API 執行。

    設定期間使用 **Cloud only**。OpenClaw 會提示輸入 `OLLAMA_API_KEY`、設定 `baseUrl: "https://ollama.com"`，並植入託管雲端模型清單。此路徑**不**需要本機 Ollama 伺服器或 `ollama signin`。

    `openclaw onboard` 期間顯示的雲端模型清單會即時從 `https://ollama.com/api/tags` 填入，最多 500 筆，因此選擇器會反映目前的託管目錄，而不是靜態種子。如果 `ollama.com` 無法連線或在設定時未傳回任何模型，OpenClaw 會回退到先前硬編碼的建議，讓 onboarding 仍可完成。

    你也可以直接設定第一級雲端提供者：

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    在僅本機模式中，OpenClaw 會從已設定的 Ollama 執行個體探索模型。此路徑適用於本機或自行託管的 Ollama 伺服器。

    OpenClaw 目前建議 `gemma4` 作為本機預設值。

  </Tab>
</Tabs>

## 模型探索（隱含提供者）

當你設定 `OLLAMA_API_KEY`（或驗證設定檔），且**沒有**定義 `models.providers.ollama` 或另一個含有 `api: "ollama"` 的自訂遠端提供者時，OpenClaw 會從 `http://127.0.0.1:11434` 的本機 Ollama 執行個體探索模型。

| 行為                 | 詳細資訊                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目錄查詢             | 查詢 `/api/tags`                                                                                                                                                     |
| 能力偵測             | 使用 best-effort `/api/show` 查詢來讀取 `contextWindow`、展開的 `num_ctx` Modelfile 參數，以及包含視覺/工具的能力                                                  |
| 視覺模型             | `/api/show` 回報具有 `vision` 能力的模型會標記為可處理影像（`input: ["text", "image"]`），因此 OpenClaw 會自動將影像注入 prompt                                    |
| 推理偵測             | 可用時使用 `/api/show` 能力，包括 `thinking`；當 Ollama 省略能力時，會回退到模型名稱啟發式規則（`r1`、`reasoning`、`think`）                                       |
| Token 限制           | 將 `maxTokens` 設為 OpenClaw 使用的預設 Ollama 最大 token 上限                                                                                                       |
| 成本                 | 將所有成本設為 `0`                                                                                                                                                   |

這可避免手動模型項目，同時讓目錄與本機 Ollama 執行個體保持一致。你可以在本機 `infer model run` 中使用完整參照，例如 `ollama/<pulled-model>:latest`；OpenClaw 會從 Ollama 的即時目錄解析該已安裝模型，而不需要手寫 `models.json` 項目。

對於已登入的 Ollama 主機，某些 `:cloud` 模型可能在出現在 `/api/tags` 之前，就已可透過 `/api/chat` 和 `/api/show` 使用。當你明確選取完整的 `ollama/<model>:cloud` 參照時，OpenClaw 會使用 `/api/show` 驗證該確切缺漏模型，且只有在 Ollama 確認模型中繼資料時，才會將它加入執行階段目錄。拼字錯誤仍會以未知模型失敗，而不是自動建立。

```bash
# See what models are available
ollama list
openclaw models list
```

若要進行避開完整代理工具介面的狹窄文字產生 smoke test，請搭配完整 Ollama 模型參照使用本機 `infer model run`：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

該路徑仍會使用 OpenClaw 已設定的提供者、驗證和原生 Ollama 傳輸，但不會啟動 chat-agent turn 或載入 MCP/工具內容脈絡。如果這成功但一般代理回覆失敗，接著請排查模型的代理 prompt/工具容量。

若要在相同精簡路徑上進行狹窄視覺模型 smoke test，請將一或多個影像檔案加入 `infer model run`。這會將 prompt 和影像直接傳送到所選 Ollama 視覺模型，而不載入聊天工具、記憶或先前 session 內容脈絡：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` 接受偵測為 `image/*` 的檔案，包括常見的 PNG、
JPEG 與 WebP 輸入。非圖片檔案會在呼叫 Ollama 之前遭到拒絕。
若要進行語音辨識，請改用 `openclaw infer audio transcribe`。

當你使用 `/model ollama/<model>` 切換對話時，OpenClaw 會將其視為
明確的使用者選擇。如果設定的 Ollama `baseUrl` 無法連線，下一則回覆會以提供者錯誤失敗，
而不會默默改由另一個已設定的備援模型回答。

隔離的排程工作會在啟動代理回合前多做一次本機安全檢查。
如果所選模型解析為本機、私有網路或 `.local`
Ollama 提供者，且 `/api/tags` 無法連線，OpenClaw 會將該次排程執行
記錄為 `skipped`，並在錯誤文字中包含所選的 `ollama/<model>`。端點
預檢會快取 5 分鐘，因此多個指向同一個已停止 Ollama 常駐程式的排程工作，
不會全部啟動會失敗的模型請求。

使用以下指令對本機 Ollama 即時驗證本機文字路徑、原生串流路徑與嵌入：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

若要進行 Ollama Cloud API 金鑰煙霧測試，請將即時測試指向 `https://ollama.com`
並從目前目錄選擇一個託管模型：

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

雲端煙霧測試會執行文字、原生串流與網頁搜尋。對於 `https://ollama.com`，
它預設會略過嵌入，因為 Ollama Cloud API 金鑰可能未授權
`/api/embed`。當你明確希望即時測試在設定的雲端金鑰無法使用嵌入端點時失敗，
請設定 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`。

若要新增模型，只要使用 Ollama 拉取即可：

```bash
ollama pull mistral
```

新模型會自動被探索並可供使用。

<Note>
如果你明確設定 `models.providers.ollama`，或設定自訂遠端提供者，例如帶有 `api: "ollama"` 的 `models.providers.ollama-cloud`，自動探索會被略過，你必須手動定義模型。像 `http://127.0.0.2:11434` 這類 Loopback 自訂提供者仍會被視為本機。請參閱下方的明確設定章節。
</Note>

## 視覺與圖片描述

內建的 Ollama 外掛會將 Ollama 註冊為具備圖片能力的媒體理解提供者。這讓 OpenClaw 能將明確的圖片描述請求與已設定的圖片模型預設值，路由到本機或託管的 Ollama 視覺模型。

若要使用本機視覺功能，請拉取支援圖片的模型：

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

`--model` 必須是完整的 `<provider/model>` 參照。設定後，`openclaw infer image describe` 會先嘗試該模型，而不是因為模型支援原生視覺就略過描述。如果模型呼叫失敗，OpenClaw 可以繼續嘗試已設定的 `agents.defaults.imageModel.fallbacks`；檔案或 URL 準備錯誤仍會在備援嘗試前失敗。

當你想使用 OpenClaw 的圖片理解提供者流程、已設定的 `agents.defaults.imageModel`，以及圖片描述輸出形狀時，請使用 `infer image describe`。當你想以自訂提示和一張或多張圖片進行原始多模態模型探測時，請使用 `infer model run --file`。

若要將 Ollama 設為入站媒體的預設圖片理解模型，請設定 `agents.defaults.imageModel`：

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

建議使用完整的 `ollama/<model>` 參照。如果同一個模型列在 `models.providers.ollama.models` 下，且帶有 `input: ["text", "image"]`，並且沒有其他已設定的圖片提供者公開相同的裸模型 ID，OpenClaw 也會將像 `qwen2.5vl:7b` 這樣的裸 `imageModel` 參照正規化為 `ollama/qwen2.5vl:7b`。如果多個已設定的圖片提供者具有相同的裸 ID，請明確使用提供者前綴。

較慢的本機視覺模型可能需要比雲端模型更長的圖片理解逾時時間。當 Ollama 嘗試在受限硬體上配置完整宣稱的視覺情境時，它們也可能崩潰或停止。當你只需要一般圖片描述回合時，請設定能力逾時，並在模型項目上限制 `num_ctx`：

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

此逾時適用於入站圖片理解，以及代理可在回合中呼叫的明確 `image` 工具。提供者層級的 `models.providers.ollama.timeoutSeconds` 仍會控制一般模型呼叫底層 Ollama HTTP 請求的防護逾時。

使用以下指令對本機 Ollama 即時驗證明確圖片工具：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

如果你手動定義 `models.providers.ollama.models`，請標記視覺模型支援圖片輸入：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 會拒絕未標記為具圖片能力模型的圖片描述請求。使用隱含探索時，當 `/api/show` 回報視覺能力時，OpenClaw 會從 Ollama 讀取此資訊。

## 設定

<Tabs>
  <Tab title="基本（隱含探索）">
    最簡單的純本機啟用路徑是透過環境變數：

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果已設定 `OLLAMA_API_KEY`，你可以在提供者項目中省略 `apiKey`，OpenClaw 會為可用性檢查填入它。
    </Tip>

  </Tab>

  <Tab title="明確（手動模型）">
    當你想要託管雲端設定、Ollama 執行在另一台主機或連接埠、想強制指定特定情境視窗或模型清單，或想要完全手動的模型定義時，請使用明確設定。

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

  <Tab title="自訂基底 URL">
    如果 Ollama 執行在不同主機或連接埠上（明確設定會停用自動探索，因此請手動定義模型）：

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
    不要在 URL 加上 `/v1`。`/v1` 路徑使用 OpenAI 相容模式，其中工具呼叫並不可靠。請使用不含路徑尾碼的 Ollama 基底 URL。
    </Warning>

  </Tab>
</Tabs>

## 常見配方

請將這些作為起點，並把模型 ID 替換成來自 `ollama list` 或 `openclaw models list --provider ollama` 的確切名稱。

<AccordionGroup>
  <Accordion title="使用自動探索的本機模型">
    當 Ollama 與閘道執行在同一台機器上，且你希望 OpenClaw 自動探索已安裝的模型時，請使用此方式。

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    此路徑會讓設定保持最少。除非你想手動定義模型，否則不要加入 `models.providers.ollama` 區塊。

  </Accordion>

  <Accordion title="使用手動模型的 LAN Ollama 主機">
    對 LAN 主機使用原生 Ollama URL。不要加入 `/v1`。

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

    `contextWindow` 是 OpenClaw 端的情境預算。`params.num_ctx` 會傳送給 Ollama 用於該請求。當你的硬體無法執行模型宣稱的完整情境時，請讓兩者保持一致。

  </Accordion>

  <Accordion title="僅使用 Ollama Cloud">
    當你不執行本機常駐程式，且想直接使用託管的 Ollama 模型時，請使用此方式。

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

  <Accordion title="透過已登入的常駐程式同時使用雲端與本機">
    當本機或 LAN Ollama 常駐程式已使用 `ollama signin` 登入，且應同時提供本機模型與 `:cloud` 模型時，請使用此方式。

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
    當你有多個 Ollama 伺服器時，請使用自訂提供者 ID。每個提供者都有自己的主機、模型、驗證、逾時與模型參照。

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

    OpenClaw 傳送請求時，會移除作用中的提供者前綴，因此 `ollama-large/qwen3.5:27b` 會以 `qwen3.5:27b` 傳到 Ollama。

  </Accordion>

  <Accordion title="精簡本機模型設定檔">
    有些本機模型可以回答簡單提示，但難以處理完整的代理工具介面。請先限制工具與脈絡，再變更全域執行階段設定。

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

    只有在模型或伺服器可靠地在工具結構描述上失敗時，才使用 `compat.supportsTools: false`。這會以代理能力換取穩定性。
    `localModelLean` 會從直接代理介面移除瀏覽器、排程與訊息工具，並預設將較大的目錄放在結構化工具搜尋控制項後方，除非某次執行必須保留直接訊息傳遞語意；但它不會變更 Ollama 的執行階段脈絡或思考模式。對於會迴圈或把回應預算花在隱藏推理上的小型 Qwen 風格思考模型，請搭配明確的 `params.num_ctx` 與 `params.thinking: false`。

  </Accordion>
</AccordionGroup>

### 模型選擇

設定完成後，你所有的 Ollama 模型都可以使用：

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

也支援自訂 Ollama 提供者 ID。當模型參照使用作用中的
提供者前綴，例如 `ollama-spark/qwen3:32b` 時，OpenClaw 只會在呼叫
Ollama 前移除該前綴，因此伺服器會收到 `qwen3:32b`。

對於速度較慢的本機模型，請先使用提供者範圍的請求調校，再提高
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

`timeoutSeconds` 會套用到模型 HTTP 請求，包括連線設定、
標頭、主體串流，以及整體受保護擷取的中止。`params.keep_alive`
會在原生 `/api/chat` 請求中作為頂層 `keep_alive` 轉送給 Ollama；
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

對於遠端主機，請將 `127.0.0.1` 替換為 `baseUrl` 中使用的主機。如果 `curl` 可用但 OpenClaw 不可用，請檢查閘道是否在不同的機器、容器或服務帳戶上執行。

## Ollama 網頁搜尋

OpenClaw 支援 **Ollama 網頁搜尋** 作為內建的 `web_search` 提供者。

| 屬性        | 詳細資料                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主機        | 使用你設定的 Ollama 主機（設定時為 `models.providers.ollama.baseUrl`，否則為 `http://127.0.0.1:11434`）；`https://ollama.com` 會直接使用託管 API |
| 驗證        | 已登入的本機 Ollama 主機免金鑰；直接 `https://ollama.com` 搜尋或受驗證保護的主機，使用 `OLLAMA_API_KEY` 或已設定的提供者驗證               |
| 需求 | 本機／自架主機必須正在執行，且已使用 `ollama signin` 登入；直接託管搜尋需要 `baseUrl: "https://ollama.com"` 加上真正的 Ollama API 金鑰 |

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

若要透過 Ollama Cloud 直接託管搜尋：

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

對於已登入的本機 daemon，OpenClaw 會使用 daemon 的 `/api/experimental/web_search` 代理。對於 `https://ollama.com`，它會直接呼叫託管的 `/api/web_search` 端點。

<Note>
完整設定與行為詳細資料，請參閱 [Ollama 網頁搜尋](/zh-TW/tools/ollama-search)。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="舊版 OpenAI 相容模式">
    <Warning>
    **工具呼叫在 OpenAI 相容模式中並不可靠。** 只有在你需要代理使用 OpenAI 格式，且不依賴原生工具呼叫行為時，才使用此模式。
    </Warning>

    如果你需要改用 OpenAI 相容端點（例如位於只支援 OpenAI 格式的代理後方），請明確設定 `api: "openai-completions"`：

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

    此模式可能無法同時支援串流與工具呼叫。你可能需要在模型設定中使用 `params: { streaming: false }` 停用串流。

    當 `api: "openai-completions"` 與 Ollama 搭配使用時，OpenClaw 預設會注入 `options.num_ctx`，因此 Ollama 不會靜默退回 4096 脈絡視窗。如果你的代理／上游拒絕未知的 `options` 欄位，請停用此行為：

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
    對於自動探索的模型，OpenClaw 會在可用時使用 Ollama 回報的脈絡視窗，包括自訂 Modelfile 中較大的 `PARAMETER num_ctx` 值。否則會退回 OpenClaw 使用的預設 Ollama 脈絡視窗。

    你可以為該 Ollama 提供者下的每個模型設定提供者層級的 `contextWindow`、`contextTokens` 與 `maxTokens` 預設值，然後在需要時按模型覆寫。`contextWindow` 是 OpenClaw 的提示與壓縮預算。原生 Ollama 請求會讓 `options.num_ctx` 保持未設定，除非你明確設定 `params.num_ctx`，因此 Ollama 可以套用自己的模型、`OLLAMA_CONTEXT_LENGTH` 或以 VRAM 為基礎的預設值。若要在不重建 Modelfile 的情況下限制或強制 Ollama 的每次請求執行階段脈絡，請設定 `params.num_ctx`；無效、零、負數與非有限值會被忽略。如果你升級了只使用 `contextWindow` 或 `maxTokens` 來強制原生 Ollama 請求脈絡的舊設定，請執行 `openclaw doctor --fix`，將那些明確的提供者或模型預算複製到 `params.num_ctx`。OpenAI 相容的 Ollama 配接器仍會預設從已設定的 `params.num_ctx` 或 `contextWindow` 注入 `options.num_ctx`；如果你的上游拒絕 `options`，請使用 `injectNumCtxForOpenAICompat: false` 停用該行為。

    原生 Ollama 模型項目也接受 `params` 下常見的 Ollama 執行階段選項，包括 `temperature`、`top_p`、`top_k`、`min_p`、`num_predict`、`stop`、`repeat_penalty`、`num_batch`、`num_thread` 與 `use_mmap`。OpenClaw 只會轉送 Ollama 請求鍵，因此像 `streaming` 這類 OpenClaw 執行階段參數不會洩漏給 Ollama。使用 `params.think` 或 `params.thinking` 傳送頂層 Ollama `think`；`false` 會停用 Qwen 風格思考模型的 API 層級思考。

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

    按模型設定的 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也可運作。如果兩者都已設定，明確的提供者模型項目會優先於代理預設值。

  </Accordion>

  <Accordion title="思考控制">
    對於原生 Ollama 模型，OpenClaw 會依照 Ollama 預期的方式轉送思考控制：頂層 `think`，而不是 `options.think`。若自動探索模型的 `/api/show` 回應包含 `thinking` 能力，會公開 `/think low`、`/think medium`、`/think high` 與 `/think max`；非思考模型只會公開 `/think off`。

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

    按模型設定的 `params.think` 或 `params.thinking` 可以針對特定已設定模型停用或強制 Ollama API 思考。當作用中的執行只有隱含預設 `off` 時，OpenClaw 會保留那些明確的模型參數；非 off 的執行階段命令（例如 `/think medium`）仍會覆寫作用中的執行。

  </Accordion>

  <Accordion title="推理模型">
    OpenClaw 預設會將名稱包含 `deepseek-r1`、`reasoning` 或 `think` 等字樣的模型視為具備推理能力。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    不需要額外設定。OpenClaw 會自動標記它們。

  </Accordion>

  <Accordion title="模型成本">
    Ollama 免費且在本機執行，因此所有模型成本都設定為 $0。這同時適用於自動探索和手動定義的模型。
  </Accordion>

  <Accordion title="記憶嵌入">
    隨附的 Ollama 外掛會為
    [記憶搜尋](/zh-TW/concepts/memory)註冊記憶嵌入提供者。它使用已設定的 Ollama 基底 URL
    和 API 金鑰，呼叫 Ollama 目前的 `/api/embed` 端點，並在可能時將
    多個記憶片段批次放入一個 `input` 請求。

    當 `proxy.enabled=true` 時，傳送至從已設定的 `baseUrl` 衍生出的精確
    主機 local loopback 來源的 Ollama 記憶嵌入請求，會使用
    OpenClaw 的受保護直接路徑，而不是受管理的轉送代理。
    已設定的主機名稱本身必須是 `localhost` 或 loopback IP 字面值；
    僅解析到 loopback 的 DNS 名稱仍會使用受管理的代理路徑。
    LAN、tailnet、私人網路和公開 Ollama 主機也仍會留在
    受管理的代理路徑上。重新導向到另一個主機或連接埠不會繼承信任。
    操作者仍可設定全域 `proxy.loopbackMode: "proxy"` 設定，將
    loopback 流量透過代理傳送，或設定 `proxy.loopbackMode: "block"`
    在開啟連線前拒絕 loopback 連線；請參閱
    [受管理的代理](/zh-TW/security/network-proxy#gateway-loopback-mode)，了解此設定
    對整個程序的影響。

    | 屬性      | 值               |
    | ------------- | ------------------- |
    | 預設模型 | `nomic-embed-text`  |
    | 自動拉取     | 是 — 如果本機不存在，會自動拉取嵌入模型 |

    查詢期間的嵌入會對需要或建議使用擷取前綴的模型使用擷取前綴，包括 `nomic-embed-text`、`qwen3-embedding` 和 `mxbai-embed-large`。記憶文件批次會保持原始格式，因此現有索引不需要格式遷移。

    若要選擇 Ollama 作為記憶搜尋嵌入提供者：

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

    對於遠端嵌入主機，請將驗證範圍限制在該主機：

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
    OpenClaw 的 Ollama 整合預設使用**原生 Ollama API**（`/api/chat`），完整支援串流和工具呼叫同時運作。不需要特殊設定。

    對於原生 `/api/chat` 請求，OpenClaw 也會將思考控制直接轉送給 Ollama：`/think off` 和 `openclaw agent --thinking off` 會傳送頂層 `think: false`，除非已設定明確的模型 `params.think`/`params.thinking` 值；而 `/think low|medium|high` 會傳送相符的頂層 `think` effort 字串。`/think max` 會對應至 Ollama 最高的原生 effort：`think: "high"`。

    <Tip>
    如果你需要使用 OpenAI 相容端點，請參閱上方的「舊版 OpenAI 相容模式」章節。在該模式中，串流和工具呼叫可能無法同時運作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="WSL2 當機循環（重複重新啟動）">
    在搭配 NVIDIA/CUDA 的 WSL2 上，官方 Ollama Linux 安裝程式會建立帶有 `Restart=always` 的 `ollama.service` systemd 單元。如果該服務自動啟動，並在 WSL2 開機期間載入 GPU 支援的模型，Ollama 可能會在模型載入時固定主機記憶體。Hyper-V 記憶體回收不一定能回收這些固定頁面，因此 Windows 可能會終止 WSL2 VM，systemd 再次啟動 Ollama，循環就會重複發生。

    常見證據：

    - 從 Windows 端看到重複的 WSL2 重新啟動或終止
    - WSL2 啟動後不久，`app.slice` 或 `ollama.service` 出現高 CPU 使用率
    - 來自 systemd 的 SIGTERM，而不是 Linux OOM-killer 事件

    當 OpenClaw 偵測到 WSL2、啟用且帶有 `Restart=always` 的 `ollama.service`，以及可見的 CUDA 標記時，會記錄啟動警告。

    緩解方式：

    ```bash
    sudo systemctl disable ollama
    ```

    將以下內容新增到 Windows 端的 `%USERPROFILE%\.wslconfig`，然後執行 `wsl --shutdown`：

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

  <Accordion title="連線被拒絕">
    檢查 Ollama 是否正在正確的連接埠上執行：

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="遠端主機可用 curl 連線，但 OpenClaw 無法連線">
    從執行閘道的同一台機器和執行環境進行驗證：

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    常見原因：

    - `baseUrl` 指向 `localhost`，但閘道在 Docker 中或另一台主機上執行。
    - URL 使用 `/v1`，這會選擇 OpenAI 相容行為，而不是原生 Ollama。
    - 遠端主機需要在 Ollama 端變更防火牆或 LAN 綁定。
    - 模型存在於你筆電的 daemon 上，但不在遠端 daemon 上。

  </Accordion>

  <Accordion title="模型將工具 JSON 輸出為文字">
    這通常表示提供者正在使用 OpenAI 相容模式，或模型無法處理工具結構描述。

    請優先使用原生 Ollama 模式：

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

    如果小型本機模型仍無法處理工具結構描述，請在該模型項目上設定 `compat.supportsTools: false`，然後重新測試。

  </Accordion>

  <Accordion title="Kimi 或 GLM 傳回亂碼符號">
    託管的 Kimi/GLM 回應如果是冗長、非語言的符號串，會被視為失敗的提供者輸出，而不是成功的助理回答。這可讓一般重試、備援或錯誤處理接手，而不會將損毀的文字持久保存到工作階段中。

    如果重複發生，請擷取原始模型名稱、目前的工作階段檔案，以及該執行使用的是 `Cloud + Local` 還是 `Cloud only`，然後嘗試新的工作階段和備援模型：

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="冷啟動的本機模型逾時">
    大型本機模型在開始串流前可能需要很長的首次載入時間。請將逾時範圍限制在 Ollama 提供者，並可選擇要求 Ollama 在多輪對話之間保持模型載入：

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

  <Accordion title="大型上下文模型太慢或記憶體不足">
    許多 Ollama 模型宣告的上下文大於你的硬體可舒適執行的範圍。除非你設定 `params.num_ctx`，否則原生 Ollama 會使用 Ollama 自身的執行階段上下文預設值。當你想要可預測的首個 token 延遲時，請同時限制 OpenClaw 的預算和 Ollama 的請求上下文：

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

    如果 OpenClaw 傳送太多提示，請先降低 `contextWindow`。如果 Ollama 載入的執行階段上下文對該機器來說太大，請降低 `params.num_ctx`。如果生成執行太久，請降低 `maxTokens`。

  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting)和[常見問題](/zh-TW/help/faq)。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型參照和故障轉移行為的概覽。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/models" icon="brain">
    如何選擇和設定模型。
  </Card>
  <Card title="Ollama 網頁搜尋" href="/zh-TW/tools/ollama-search" icon="magnifying-glass">
    Ollama 驅動的網頁搜尋完整設定與行為詳細資訊。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考。
  </Card>
</CardGroup>
