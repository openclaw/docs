---
read_when:
    - 您想透過 Ollama 使用雲端或本機模型執行 OpenClaw
    - 你需要 Ollama 的安裝與設定指引
    - 你想使用 Ollama 視覺模型進行影像理解
summary: 使用 Ollama 執行 OpenClaw（雲端與本機模型）
title: Ollama
x-i18n:
    generated_at: "2026-04-30T03:32:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eeaebc0ba72f72a0dee842f7d983a552c86cfa23271322d4740641124f57cfb
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw 會與 Ollama 的原生 API（`/api/chat`）整合，可用於託管的雲端模型，以及本機/自行託管的 Ollama 伺服器。你可以用三種模式使用 Ollama：透過可連線的 Ollama 主機使用 `Cloud + Local`、針對 `https://ollama.com` 使用 `Cloud only`，或針對可連線的 Ollama 主機使用 `Local only`。

<Warning>
**遠端 Ollama 使用者**：請勿在 OpenClaw 中使用 `/v1` OpenAI 相容 URL（`http://host:11434/v1`）。這會破壞工具呼叫，且模型可能會把原始工具 JSON 當成純文字輸出。請改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（沒有 `/v1`）。
</Warning>

Ollama 提供者設定使用 `baseUrl` 作為標準鍵。OpenClaw 也接受 `baseURL`，以相容 OpenAI SDK 風格的範例，但新的設定應優先使用 `baseUrl`。

## 驗證規則

<AccordionGroup>
  <Accordion title="本機與 LAN 主機">
    本機與 LAN Ollama 主機不需要真正的 bearer 權杖。OpenClaw 只會對回送、私有網路、`.local` 與裸主機名稱的 Ollama 基礎 URL 使用本機 `ollama-local` 標記。
  </Accordion>
  <Accordion title="遠端與 Ollama Cloud 主機">
    遠端公開主機與 Ollama Cloud（`https://ollama.com`）需要透過 `OLLAMA_API_KEY`、驗證設定檔或提供者的 `apiKey` 提供真正的憑證。
  </Accordion>
  <Accordion title="自訂提供者 ID">
    設定 `api: "ollama"` 的自訂提供者 ID 會遵循相同規則。例如，指向私有 LAN Ollama 主機的 `ollama-remote` 提供者可以使用 `apiKey: "ollama-local"`，子代理程式會透過 Ollama 提供者掛鉤解析該標記，而不是把它視為遺失的憑證。記憶體搜尋也可以將 `agents.defaults.memorySearch.provider` 設為該自訂提供者 ID，讓嵌入使用相符的 Ollama 端點。
  </Accordion>
  <Accordion title="驗證設定檔">
    `auth-profiles.json` 會儲存提供者 ID 的憑證。請將端點設定（`baseUrl`、`api`、模型 ID、標頭、逾時）放在 `models.providers.<id>`。較舊的扁平驗證設定檔，例如 `{ "ollama-windows": { "apiKey": "ollama-local" } }`，不是執行階段格式；請執行 `openclaw doctor --fix`，將它們改寫為標準的 `ollama-windows:default` API 金鑰設定檔並建立備份。該檔案中的 `baseUrl` 是相容性雜訊，應移到提供者設定中。
  </Accordion>
  <Accordion title="記憶體嵌入範圍">
    當 Ollama 用於記憶體嵌入時，bearer 驗證會限定在宣告它的主機：

    - 提供者層級金鑰只會傳送到該提供者的 Ollama 主機。
    - `agents.*.memorySearch.remote.apiKey` 只會傳送到其遠端嵌入主機。
    - 純 `OLLAMA_API_KEY` 環境值會被視為 Ollama Cloud 慣例，預設不會傳送到本機或自行託管的主機。

  </Accordion>
</AccordionGroup>

## 開始使用

選擇你偏好的設定方法與模式。

<Tabs>
  <Tab title="導覽設定（建議）">
    **最適合：**最快完成可運作的 Ollama 雲端或本機設定。

    <Steps>
      <Step title="執行導覽設定">
        ```bash
        openclaw onboard
        ```

        從提供者清單選取 **Ollama**。
      </Step>
      <Step title="選擇你的模式">
        - **雲端 + 本機** — 本機 Ollama 主機，加上透過該主機路由的雲端模型
        - **僅雲端** — 透過 `https://ollama.com` 使用託管的 Ollama 模型
        - **僅本機** — 僅使用本機模型

      </Step>
      <Step title="選取模型">
        `Cloud only` 會提示輸入 `OLLAMA_API_KEY`，並建議託管雲端預設值。`Cloud + Local` 與 `Local only` 會要求輸入 Ollama 基礎 URL、探索可用模型，並在選取的本機模型尚不可用時自動拉取。當 Ollama 回報已安裝的 `:latest` 標籤，例如 `gemma4:latest`，設定只會顯示該已安裝模型一次，而不是同時顯示 `gemma4` 與 `gemma4:latest`，或再次拉取裸別名。`Cloud + Local` 也會檢查該 Ollama 主機是否已登入以取得雲端存取權。
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

    也可以指定自訂基礎 URL 或模型：

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
        對於 `Cloud only`，請使用你真正的 `OLLAMA_API_KEY`。對於由主機支援的設定，任何預留位置值都可使用：

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

        或在設定中指定預設值：

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
    `Cloud + Local` 會使用可連線的 Ollama 主機作為本機與雲端模型的控制點。這是 Ollama 偏好的混合流程。

    設定期間使用 **雲端 + 本機**。OpenClaw 會提示輸入 Ollama 基礎 URL、從該主機探索本機模型，並檢查主機是否已透過 `ollama signin` 登入以取得雲端存取權。主機已登入時，OpenClaw 也會建議託管雲端預設值，例如 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 與 `glm-5.1:cloud`。

    如果主機尚未登入，OpenClaw 會讓設定維持僅本機，直到你執行 `ollama signin`。

  </Tab>

  <Tab title="僅雲端">
    `Cloud only` 會針對 Ollama 在 `https://ollama.com` 的託管 API 執行。

    設定期間使用 **僅雲端**。OpenClaw 會提示輸入 `OLLAMA_API_KEY`、設定 `baseUrl: "https://ollama.com"`，並植入託管雲端模型清單。此路徑不需要本機 Ollama 伺服器或 `ollama signin`。

    `openclaw onboard` 期間顯示的雲端模型清單會即時從 `https://ollama.com/api/tags` 填入，上限為 500 筆，因此選擇器會反映目前的託管目錄，而不是靜態種子。如果設定時無法連線到 `ollama.com` 或未回傳任何模型，OpenClaw 會退回先前的硬編碼建議，讓導覽設定仍能完成。

  </Tab>

  <Tab title="僅本機">
    在僅本機模式中，OpenClaw 會從已設定的 Ollama 執行個體探索模型。此路徑適用於本機或自行託管的 Ollama 伺服器。

    OpenClaw 目前建議 `gemma4` 作為本機預設值。

  </Tab>
</Tabs>

## 模型探索（隱含提供者）

當你設定 `OLLAMA_API_KEY`（或驗證設定檔），且**未**定義 `models.providers.ollama` 或另一個帶有 `api: "ollama"` 的自訂遠端提供者時，OpenClaw 會從 `http://127.0.0.1:11434` 的本機 Ollama 執行個體探索模型。

| 行為                 | 詳細資訊                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目錄查詢             | 查詢 `/api/tags`                                                                                                                                                     |
| 能力偵測             | 使用盡力而為的 `/api/show` 查找，以讀取 `contextWindow`、展開的 `num_ctx` Modelfile 參數，以及包含視覺/工具在內的能力                                                |
| 視覺模型             | `/api/show` 回報具有 `vision` 能力的模型會標記為可處理圖片（`input: ["text", "image"]`），因此 OpenClaw 會自動將圖片注入提示中                                      |
| 推理偵測             | 可用時會使用 `/api/show` 能力，包括 `thinking`；當 Ollama 省略能力時，會退回模型名稱啟發式規則（`r1`、`reasoning`、`think`）                                         |
| 權杖限制             | 將 `maxTokens` 設為 OpenClaw 使用的預設 Ollama 最大權杖上限                                                                                                          |
| 成本                 | 將所有成本設為 `0`                                                                                                                                                   |

這可避免手動建立模型項目，同時讓目錄與本機 Ollama 執行個體保持一致。你可以在本機 `infer model run` 中使用完整參照，例如 `ollama/<pulled-model>:latest`；OpenClaw 會從 Ollama 的即時目錄解析該已安裝模型，而不需要手寫的 `models.json` 項目。

對於已登入的 Ollama 主機，某些 `:cloud` 模型可能會先透過 `/api/chat`
與 `/api/show` 可用，然後才出現在 `/api/tags`。當你明確選取完整的
`ollama/<model>:cloud` 參照時，OpenClaw 會使用 `/api/show` 驗證該確切缺漏模型，
並且只有在 Ollama 確認模型中繼資料時，才會將它加入執行階段目錄。
拼字錯誤仍會以未知模型失敗，而不是被自動建立。

```bash
# See what models are available
ollama list
openclaw models list
```

若要執行窄範圍文字生成冒煙測試，並避開完整代理程式工具介面，
請搭配完整 Ollama 模型參照使用本機 `infer model run`：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

該路徑仍會使用 OpenClaw 已設定的提供者、驗證與原生 Ollama
傳輸，但不會啟動聊天代理程式回合，也不會載入 MCP/工具內容。如果
這成功但一般代理程式回覆失敗，接著請疑難排解模型的代理程式
提示/工具容量。

若要在相同精簡路徑上執行窄範圍視覺模型冒煙測試，請將一或多個
圖片檔案加入 `infer model run`。這會直接將提示與圖片傳送到
所選的 Ollama 視覺模型，而不載入聊天工具、記憶體或先前的
工作階段內容：

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
JPEG 與 WebP 輸入。非圖片檔案會在呼叫 Ollama 前遭到拒絕。
若要進行語音辨識，請改用 `openclaw infer audio transcribe`。

當你使用 `/model ollama/<model>` 切換對話時，OpenClaw 會將
它視為精確的使用者選擇。如果已設定的 Ollama `baseUrl`
無法連線，下一則回覆會以提供者錯誤失敗，而不是悄悄
改由另一個已設定的備援模型回答。

隔離的 cron 作業會在啟動 agent turn 前多做一次本機安全檢查。如果選取的模型解析為本機、私人網路或 `.local` Ollama provider，而 `/api/tags` 無法連線，OpenClaw 會將該 cron 執行記錄為 `skipped`，並在錯誤文字中包含選取的 `ollama/<model>`。端點預檢會快取 5 分鐘，因此多個指向同一個已停止 Ollama daemon 的 cron 作業，不會全部都啟動失敗的模型請求。

使用以下指令針對本機 Ollama 即時驗證本機文字路徑、原生串流路徑與 embeddings：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

若要新增模型，只要用 Ollama pull 它：

```bash
ollama pull mistral
```

新模型會自動被探索並可供使用。

<Note>
如果你明確設定 `models.providers.ollama`，或設定自訂遠端 provider，例如使用 `api: "ollama"` 的 `models.providers.ollama-cloud`，自動探索會被略過，你必須手動定義模型。像 `http://127.0.0.2:11434` 這類 loopback 自訂 provider 仍會被視為本機。請參閱下方的明確設定章節。
</Note>

## 視覺與影像描述

內建的 Ollama Plugin 會將 Ollama 註冊為具備影像能力的媒體理解 provider。這讓 OpenClaw 可以透過本機或託管的 Ollama 視覺模型，路由明確的影像描述請求與已設定的影像模型預設值。

若要使用本機視覺，請 pull 一個支援影像的模型：

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

接著使用 infer CLI 驗證：

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` 必須是完整的 `<provider/model>` 參照。設定後，`openclaw infer image describe` 會直接執行該模型，而不是因為模型支援原生視覺而略過描述。

當你想使用 OpenClaw 的影像理解 provider 流程、已設定的 `agents.defaults.imageModel`，以及影像描述輸出形狀時，請使用 `infer image describe`。當你想用自訂提示與一張或多張影像進行原始多模態模型探測時，請使用 `infer model run --file`。

若要讓 Ollama 成為傳入媒體的預設影像理解模型，請設定 `agents.defaults.imageModel`：

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

建議使用完整的 `ollama/<model>` 參照。如果同一個模型列在 `models.providers.ollama.models` 下，並帶有 `input: ["text", "image"]`，且沒有其他已設定的影像 provider 暴露相同的裸模型 ID，OpenClaw 也會將像 `qwen2.5vl:7b` 這樣的裸 `imageModel` 參照正規化為 `ollama/qwen2.5vl:7b`。如果有多個已設定的影像 provider 具有相同的裸 ID，請明確使用 provider 前綴。

緩慢的本機視覺模型可能需要比雲端模型更長的影像理解逾時時間。當 Ollama 嘗試在受限硬體上配置完整宣告的視覺 context 時，它們也可能當機或停止。當你只需要一般影像描述 turn 時，請設定 capability 逾時，並在模型項目上限制 `num_ctx`：

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

這個逾時會套用到傳入影像理解，以及 agent 在 turn 期間可呼叫的明確 `image` tool。provider 層級的 `models.providers.ollama.timeoutSeconds` 仍會控制一般模型呼叫底層 Ollama HTTP 請求的保護時間。

使用以下指令針對本機 Ollama 即時驗證明確的影像 tool：

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

OpenClaw 會拒絕對未標記為具備影像能力模型的影像描述請求。使用隱含探索時，當 `/api/show` 回報視覺 capability，OpenClaw 會從 Ollama 讀取這項資訊。

## 設定

<Tabs>
  <Tab title="Basic (implicit discovery)">
    最簡單的純本機啟用路徑是透過環境變數：

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果已設定 `OLLAMA_API_KEY`，你可以在 provider 項目中省略 `apiKey`，OpenClaw 會為可用性檢查填入它。
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    當你想要託管雲端設定、Ollama 在另一個主機或連接埠執行、想強制指定特定 context windows 或模型清單，或想要完全手動的模型定義時，請使用明確設定。

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
    如果 Ollama 正在不同主機或連接埠執行（明確設定會停用自動探索，因此請手動定義模型）：

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
    請勿在 URL 加上 `/v1`。`/v1` 路徑會使用 OpenAI 相容模式，在該模式中 tool calling 並不可靠。請使用不含路徑尾綴的 Ollama 基礎 URL。
    </Warning>

  </Tab>
</Tabs>

## 常見配方

請將這些作為起點，並用 `ollama list` 或 `openclaw models list --provider ollama` 中的確切名稱取代模型 ID。

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    當 Ollama 與 Gateway 在同一台機器上執行，且你希望 OpenClaw 自動探索已安裝模型時，請使用此方式。

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    這個路徑會讓設定維持最小。除非你想手動定義模型，否則不要加入 `models.providers.ollama` 區塊。

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
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

    `contextWindow` 是 OpenClaw 端的 context 預算。`params.num_ctx` 會隨請求送到 Ollama。當你的硬體無法執行模型完整宣告的 context 時，請讓兩者保持一致。

  </Accordion>

  <Accordion title="Ollama Cloud only">
    當你不執行本機 daemon，而想直接使用託管的 Ollama 模型時，請使用此方式。

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

  <Accordion title="Cloud plus local through a signed-in daemon">
    當本機或 LAN Ollama daemon 已透過 `ollama signin` 登入，並應同時提供本機模型與 `:cloud` 模型時，請使用此方式。

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
    當你有多個 Ollama 伺服器時，請使用自訂 provider ID。每個 provider 都有自己的主機、模型、驗證、逾時與模型參照。

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

    當 OpenClaw 傳送請求時，會移除作用中的 provider 前綴，因此 `ollama-large/qwen3.5:27b` 會以 `qwen3.5:27b` 送達 Ollama。

  </Accordion>

  <Accordion title="Lean local model profile">
    有些本機模型可以回答簡單提示，但難以處理完整的 agent tool 表面。請先限制 tools 與 context，再變更全域 runtime 設定。

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
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

    只有在模型或伺服器穩定地無法處理工具結構描述時，才使用 `compat.supportsTools: false`。它會以代理能力換取穩定性。
    `localModelLean` 會從代理介面移除瀏覽器、cron 和訊息工具，但不會變更 Ollama 的執行階段上下文或思考模式。對於會循環或把回應預算花在隱藏推理上的小型 Qwen 風格思考模型，請搭配明確的 `params.num_ctx` 和 `params.thinking: false`。

  </Accordion>
</AccordionGroup>

### 模型選擇

設定完成後，所有 Ollama 模型都可使用：

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
提供者前置詞，例如 `ollama-spark/qwen3:32b`，OpenClaw 只會在呼叫
Ollama 前移除該前置詞，因此伺服器會收到 `qwen3:32b`。

對於較慢的本機模型，請優先使用提供者範圍的請求調校，再提高
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
標頭、本文串流，以及整體受保護擷取中止。`params.keep_alive`
會在原生 `/api/chat` 請求中作為頂層 `keep_alive` 轉送給 Ollama；
當首輪載入時間是瓶頸時，請依模型設定。

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

對於遠端主機，請將 `127.0.0.1` 替換為 `baseUrl` 中使用的主機。如果 `curl` 可用但 OpenClaw 不可用，請檢查 Gateway 是否在不同機器、容器或服務帳戶上執行。

## Ollama Web Search

OpenClaw 支援 **Ollama Web Search** 作為內建的 `web_search` 提供者。

| 屬性        | 詳細資訊                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主機        | 使用你設定的 Ollama 主機（已設定時為 `models.providers.ollama.baseUrl`，否則為 `http://127.0.0.1:11434`）；`https://ollama.com` 會直接使用託管 API |
| 驗證        | 已登入的本機 Ollama 主機免金鑰；直接使用 `https://ollama.com` 搜尋或受驗證保護的主機時，使用 `OLLAMA_API_KEY` 或已設定的提供者驗證               |
| 需求 | 本機／自行託管主機必須正在執行並已透過 `ollama signin` 登入；直接託管搜尋需要 `baseUrl: "https://ollama.com"` 加上真實的 Ollama API 金鑰 |

在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 **Ollama Web Search**，或設定：

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

對於已登入的本機 daemon，OpenClaw 會使用 daemon 的 `/api/experimental/web_search` 代理。對於 `https://ollama.com`，它會直接呼叫託管的 `/api/web_search` 端點。

<Note>
完整設定與行為詳細資訊，請參閱 [Ollama Web Search](/zh-TW/tools/ollama-search)。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="舊版 OpenAI 相容模式">
    <Warning>
    **在 OpenAI 相容模式中，工具呼叫並不可靠。** 只有在你需要透過代理使用 OpenAI 格式，且不依賴原生工具呼叫行為時，才使用此模式。
    </Warning>

    如果你需要改用 OpenAI 相容端點（例如在只支援 OpenAI 格式的代理後方），請明確設定 `api: "openai-completions"`：

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

    此模式可能不支援同時進行串流和工具呼叫。你可能需要在模型設定中使用 `params: { streaming: false }` 停用串流。

    當 `api: "openai-completions"` 與 Ollama 搭配使用時，OpenClaw 預設會注入 `options.num_ctx`，因此 Ollama 不會默默退回到 4096 的上下文視窗。如果你的代理／上游拒絕未知的 `options` 欄位，請停用此行為：

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
    對於自動探索到的模型，OpenClaw 會在可用時使用 Ollama 回報的上下文視窗，包括來自自訂 Modelfile 的較大 `PARAMETER num_ctx` 值。否則，它會退回到 OpenClaw 使用的預設 Ollama 上下文視窗。

    你可以為該 Ollama 提供者底下的每個模型設定提供者層級的 `contextWindow`、`contextTokens` 和 `maxTokens` 預設值，然後在需要時逐一覆寫模型。`contextWindow` 是 OpenClaw 的提示和 Compaction 預算。除非你明確設定 `params.num_ctx`，否則原生 Ollama 請求會讓 `options.num_ctx` 保持未設定，讓 Ollama 可套用自己的模型、`OLLAMA_CONTEXT_LENGTH` 或以 VRAM 為基礎的預設值。若要在不重建 Modelfile 的情況下限制或強制 Ollama 的每次請求執行階段上下文，請設定 `params.num_ctx`；無效、零、負數和非有限值會被忽略。OpenAI 相容的 Ollama 配接器仍會預設從已設定的 `params.num_ctx` 或 `contextWindow` 注入 `options.num_ctx`；如果你的上游拒絕 `options`，請使用 `injectNumCtxForOpenAICompat: false` 停用。

    原生 Ollama 模型項目也接受 `params` 底下常見的 Ollama 執行階段選項，包括 `temperature`、`top_p`、`top_k`、`min_p`、`num_predict`、`stop`、`repeat_penalty`、`num_batch`、`num_thread` 和 `use_mmap`。OpenClaw 只會轉送 Ollama 請求鍵，因此 OpenClaw 執行階段參數（例如 `streaming`）不會外洩給 Ollama。使用 `params.think` 或 `params.thinking` 傳送頂層 Ollama `think`；`false` 會停用 Qwen 風格思考模型的 API 層級思考。

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

    逐模型的 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也可使用。如果兩者都已設定，明確的提供者模型項目會優先於代理預設值。

  </Accordion>

  <Accordion title="思考控制">
    對於原生 Ollama 模型，OpenClaw 會依照 Ollama 預期的方式轉送思考控制：頂層 `think`，而不是 `options.think`。自動探索到且其 `/api/show` 回應包含 `thinking` 能力的模型，會公開 `/think low`、`/think medium`、`/think high` 和 `/think max`；非思考模型只會公開 `/think off`。

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

    逐模型的 `params.think` 或 `params.thinking` 可以針對特定已設定模型停用或強制 Ollama API 思考。當作用中執行只有隱含預設 `off` 時，OpenClaw 會保留那些明確的模型參數；非 off 的執行階段命令（例如 `/think medium`）仍會覆寫作用中執行。

  </Accordion>

  <Accordion title="推理模型">
    OpenClaw 預設會將名稱包含 `deepseek-r1`、`reasoning` 或 `think` 的模型視為具備推理能力。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    不需要額外設定。OpenClaw 會自動標記它們。

  </Accordion>

  <Accordion title="模型成本">
    Ollama 免費且在本機執行，因此所有模型成本都設定為 $0。這同時適用於自動探索和手動定義的模型。
  </Accordion>

  <Accordion title="記憶體嵌入">
    內建的 Ollama Plugin 會為
    [記憶體搜尋](/zh-TW/concepts/memory) 註冊記憶體嵌入提供者。它使用已設定的 Ollama 基礎 URL
    和 API 金鑰，呼叫 Ollama 目前的 `/api/embed` 端點，並在可能時將
    多個記憶體區塊批次合併成一個 `input` 請求。

    | 屬性      | 值               |
    | ------------- | ------------------- |
    | 預設模型 | `nomic-embed-text`  |
    | 自動 pull     | 是 — 如果本機不存在嵌入模型，會自動 pull |

    查詢時嵌入會針對需要或建議使用擷取前置詞的模型使用這些前置詞，包括 `nomic-embed-text`、`qwen3-embedding` 和 `mxbai-embed-large`。記憶體文件批次會保持原始格式，因此現有索引不需要格式遷移。

    若要選擇 Ollama 作為記憶體搜尋嵌入提供者：

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

    對於遠端嵌入主機，請將驗證限定在該主機範圍內：

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
    OpenClaw 的 Ollama 整合預設使用**原生 Ollama API**（`/api/chat`），完整支援串流與工具呼叫同時運作。不需要特殊設定。

    對於原生 `/api/chat` 請求，OpenClaw 也會直接將思考控制轉發給 Ollama：`/think off` 和 `openclaw agent --thinking off` 會傳送頂層 `think: false`，除非已設定明確的模型 `params.think`/`params.thinking` 值；而 `/think low|medium|high` 會傳送相符的頂層 `think` effort 字串。`/think max` 會對應到 Ollama 最高的原生 effort，`think: "high"`。

    <Tip>
    如果你需要使用 OpenAI 相容端點，請參閱上方的「舊版 OpenAI 相容模式」章節。在該模式中，串流與工具呼叫可能無法同時運作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="WSL2 當機迴圈（反覆重新啟動）">
    在搭配 NVIDIA/CUDA 的 WSL2 上，官方 Ollama Linux 安裝程式會建立一個包含 `Restart=always` 的 `ollama.service` systemd 單元。如果該服務自動啟動，並在 WSL2 開機期間載入 GPU 支援的模型，Ollama 可能會在模型載入時釘選主機記憶體。Hyper-V 記憶體回收不一定能回收那些被釘選的頁面，因此 Windows 可能會終止 WSL2 VM，systemd 再次啟動 Ollama，然後迴圈重複。

    常見證據：

    - Windows 端反覆出現 WSL2 重新啟動或終止
    - WSL2 啟動後不久，`app.slice` 或 `ollama.service` 出現高 CPU 使用率
    - 來自 systemd 的 SIGTERM，而不是 Linux OOM-killer 事件

    OpenClaw 偵測到 WSL2、已啟用且含有 `Restart=always` 的 `ollama.service`，以及可見的 CUDA 標記時，會記錄啟動警告。

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
    請確認 Ollama 正在執行，且你已設定 `OLLAMA_API_KEY`（或 auth profile），並且你**沒有**定義明確的 `models.providers.ollama` 項目：

    ```bash
    ollama serve
    ```

    驗證 API 是否可存取：

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="沒有可用模型">
    如果未列出你的模型，請在本機拉取模型，或在 `models.providers.ollama` 中明確定義它。

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

  <Accordion title="遠端主機可透過 curl 運作，但 OpenClaw 不行">
    請從執行 Gateway 的同一台機器與 runtime 驗證：

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    常見原因：

    - `baseUrl` 指向 `localhost`，但 Gateway 在 Docker 中或另一台主機上執行。
    - URL 使用 `/v1`，這會選擇 OpenAI 相容行為，而不是原生 Ollama。
    - 遠端主機需要在 Ollama 端調整防火牆或 LAN 繫結。
    - 模型存在於你筆電的 daemon 上，但不在遠端 daemon 上。

  </Accordion>

  <Accordion title="模型將工具 JSON 輸出為文字">
    這通常表示 provider 正在使用 OpenAI 相容模式，或模型無法處理工具 schema。

    建議使用原生 Ollama 模式：

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

    如果小型本機模型仍在工具 schema 上失敗，請在該模型項目上設定 `compat.supportsTools: false`，然後重新測試。

  </Accordion>

  <Accordion title="Kimi 或 GLM 回傳亂碼符號">
    Hosted Kimi/GLM 回應若是長串非語言符號，會被視為失敗的 provider 輸出，而不是成功的 assistant 答覆。這可讓一般重試、fallback 或錯誤處理接手，而不會將損毀的文字持久化到 session 中。

    如果反覆發生，請擷取原始模型名稱、目前的 session 檔案，以及該次執行使用的是 `Cloud + Local` 還是 `Cloud only`，然後嘗試新的 session 和 fallback 模型：

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="冷啟動本機模型逾時">
    大型本機模型在串流開始前，首次載入可能需要很長時間。請將逾時範圍限定在 Ollama provider，並可選擇要求 Ollama 在回合之間保持模型載入：

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

    如果主機本身接受連線的速度很慢，`timeoutSeconds` 也會延長此 provider 受保護的 Undici 連線逾時。

  </Accordion>

  <Accordion title="大型上下文模型太慢或記憶體不足">
    許多 Ollama 模型宣告的上下文大小，超過你的硬體能舒適執行的範圍。原生 Ollama 會使用 Ollama 自身的 runtime 上下文預設值，除非你設定 `params.num_ctx`。若你想要可預測的首 token 延遲，請同時限制 OpenClaw 的預算與 Ollama 的請求上下文：

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

    如果 OpenClaw 傳送了過多 prompt，請先降低 `contextWindow`。如果 Ollama 載入的 runtime 上下文對該機器而言過大，請降低 `params.num_ctx`。如果生成時間過長，請降低 `maxTokens`。

  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting) 和 [FAQ](/zh-TW/help/faq)。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型 provider" href="/zh-TW/concepts/model-providers" icon="layers">
    所有 provider、模型參照與 failover 行為的概覽。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/models" icon="brain">
    如何選擇和設定模型。
  </Card>
  <Card title="Ollama Web Search" href="/zh-TW/tools/ollama-search" icon="magnifying-glass">
    Ollama 驅動的網頁搜尋完整設定與行為細節。
  </Card>
  <Card title="Configuration" href="/zh-TW/gateway/configuration" icon="gear">
    完整 config 參考。
  </Card>
</CardGroup>
