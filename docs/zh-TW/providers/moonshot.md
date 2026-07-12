---
read_when:
    - 你想設定 Moonshot K2（Moonshot Open Platform）還是 Kimi Coding
    - 你需要瞭解彼此獨立的端點、金鑰和模型參照。
    - 你想要任一供應商都能直接複製貼上的設定
summary: 設定 Moonshot K2 與 Kimi Coding（分開的提供者與金鑰）
title: 月之暗面 AI
x-i18n:
    generated_at: "2026-07-11T21:45:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot 提供具有 OpenAI 相容端點的 Kimi API。若使用 Moonshot Open Platform，請將預設模型設為 `moonshot/kimi-k2.6`；若使用 Kimi Coding，則設為 `kimi/kimi-for-coding`。

<Warning>
Moonshot 與 Kimi Coding 是**不同的提供者**，各自以獨立的外部外掛提供。金鑰無法互換、端點不同，模型參照也不同（`moonshot/...` 與 `kimi/...`）。
</Warning>

## 內建模型目錄

[//]: # "moonshot-kimi-k2-ids:start"

| 模型參照                          | 名稱                   | 推理       | 輸入       | 上下文  | 最大輸出   |
| --------------------------------- | ---------------------- | ---------- | ---------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | 否         | 文字、圖片 | 262,144 | 262,144    |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | 永遠啟用   | 文字、圖片 | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | 否         | 文字、圖片 | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | 是         | 文字       | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | 是         | 文字       | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | 否         | 文字       | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

目錄中的成本估算採用 Moonshot 公布的隨用隨付費率：Kimi K2.7 Code 的快取命中費用為每百萬權杖 $0.19、輸入為每百萬權杖 $0.95、輸出為每百萬權杖 $4.00；Kimi K2.6 的快取命中費用為每百萬權杖 $0.16、輸入為每百萬權杖 $0.95、輸出為每百萬權杖 $4.00；Kimi K2.5 的快取命中費用為每百萬權杖 $0.10、輸入為每百萬權杖 $0.60、輸出為每百萬權杖 $3.00。除非你在設定中覆寫，否則目錄中的其他項目會保留零成本預留值。

Kimi K2.7 Code 一律使用原生思考。依照 Moonshot 的要求，OpenClaw 對此模型只公開 `on` 思考狀態，且不會送出 `thinking` 與 `reasoning_effort` 欄位。它也會省略取樣覆寫值（`temperature`、`top_p`、`n`、`presence_penalty`、`frequency_penalty`），因為 K2.7 會將這些值固定為提供者的預設值。Kimi K2.6 仍是初始設定流程的預設模型。

## 開始使用

Moonshot 與 Kimi Coding 都是外部外掛，請先安裝其中一個，再進行初始設定。

<Tabs>
  <Tab title="Moonshot API">
    **最適合：**透過 Moonshot Open Platform 使用 Kimi K2 模型。

    <Steps>
      <Step title="Install the plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Choose your endpoint region">
        | 驗證選項               | 端點                           | 區域     |
        | ---------------------- | ------------------------------ | -------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 國際     |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 中國     |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        或使用中國端點：

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Run a live smoke test">
        若要在不影響一般工作階段的情況下驗證模型存取權與成本追蹤，請使用隔離的狀態目錄：

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON 回應應回報 `provider: "moonshot"` 與 `model: "kimi-k2.6"`。當 Moonshot 傳回使用量中繼資料時，助理逐字稿項目會在 `usage.cost` 下儲存正規化後的權杖使用量與預估成本。
      </Step>
    </Steps>

    ### 設定範例

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **最適合：**透過 Kimi Coding 端點執行以程式碼為主的工作。

    <Note>
    Kimi Coding 使用的 API 金鑰與提供者前綴（`kimi/...`）不同於 Moonshot（`moonshot/...`）。穩定的模型參照為 `kimi/kimi-for-coding`；舊版參照 `kimi/kimi-code` 與 `kimi/k2p5` 仍可使用，並會正規化為該模型 ID。
    </Note>

    <Steps>
      <Step title="Install the plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### 設定範例

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi 網路搜尋

Moonshot 外掛也會將由 Moonshot 網路搜尋支援的 **Kimi** 註冊為 `web_search` 提供者。

<Steps>
  <Step title="Run interactive web search setup">
    ```bash
    openclaw configure --section web
    ```

    在網路搜尋區段中選擇 **Kimi**，以儲存 `plugins.entries.moonshot.config.webSearch.*`。

  </Step>
  <Step title="Configure the web search region and model">
    互動式設定會提示你選擇：

    | 設定                | 選項                                                                           |
    | ------------------- | ------------------------------------------------------------------------------ |
    | API 區域            | `https://api.moonshot.ai/v1`（國際）或 `https://api.moonshot.cn/v1`（中國）    |
    | 網路搜尋模型        | 預設為 `kimi-k2.6`                                                             |

  </Step>
</Steps>

設定位於 `plugins.entries.moonshot.config.webSearch` 下：

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## 進階設定

<AccordionGroup>
  <Accordion title="Native thinking mode">
    Kimi K2.7 Code 一律使用原生思考。Moonshot 要求用戶端對此模型省略 `thinking` 欄位，因此 OpenClaw 只公開 `on`，並忽略過時的 `off` 設定。K2.7 也會固定 `temperature`、`top_p`、`n`、`presence_penalty` 與 `frequency_penalty`；OpenClaw 會省略這些欄位的已設定覆寫值。

    其他 Moonshot Kimi 模型支援二元原生思考模式：

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    可透過 `agents.defaults.models.<provider/model>.params` 為各模型設定：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw 會為這些模型對應執行階段的 `/think` 層級：

    | `/think` 層級        | Moonshot 行為              |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | 任何非關閉層級       | `thinking.type=enabled`    |

    <Warning>
    啟用 Moonshot 思考模式時，`tool_choice` 必須為 `auto` 或 `none`。固定的工具選擇（`type: "tool"` 或 `type: "function"`）會改為強制將思考模式設回 `disabled`，讓要求的工具仍能執行；`tool_choice: "required"` 則會正規化為 `auto`。這適用於 Kimi K2.7 Code 以外的所有 Moonshot 模型；Kimi K2.7 Code 的思考模式無法停用，因此當其 `tool_choice` 不相容時，會正規化為 `auto`。
    </Warning>

    Kimi K2.6 也接受選用的 `thinking.keep` 欄位，用於控制多輪對話中 `reasoning_content` 的保留方式。將其設為 `"all"` 可在各輪對話間保留完整推理內容；省略此欄位（或保留為 `null`）則使用伺服器的預設策略。OpenClaw 僅會為 `moonshot/kimi-k2.6` 轉送 `thinking.keep`，並從其他模型中移除此欄位。Kimi K2.7 Code 預設會保留完整的推理記錄，而 OpenClaw 會省略整個 `thinking` 欄位。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="工具呼叫 ID 清理">
    Moonshot Kimi 提供的原生 tool_call ID 格式為 `functions.<name>:<index>`。OpenClaw 會保留每個原生 Kimi ID 第一次出現的值，並將後續重複項目改寫為確定性的 OpenAI 風格 `call_*` ID。相符的工具結果會使用相同 ID 重新對應，因此重播時仍能維持唯一性，同時不移除 Kimi 首次出現的原生 ID。此行為已整合至隨附的 Moonshot 提供者，並非使用者可設定的選項。
  </Accordion>

  <Accordion title="串流用量相容性">
    原生 Moonshot 端點（`https://api.moonshot.ai/v1` 和
    `https://api.moonshot.cn/v1`）會宣告串流用量相容性。
    OpenClaw 會根據端點主機而非提供者 ID 判定此行為，因此指向相同
    Moonshot 原生主機的自訂提供者 ID 也會沿用相同的串流用量行為。

    使用目錄中的 K2.6 定價時，若串流用量包含輸入、輸出和快取讀取
    權杖，系統也會將其轉換為本機估算的美元成本，供 `/status`、
    `/usage full`、`/usage cost` 以及以逐字記錄為依據的工作階段
    計費使用。

  </Accordion>

  <Accordion title="端點與模型參照">
    | 提供者     | 模型參照前綴   | 端點                           | 驗證環境變數        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding 端點               | `KIMI_API_KEY`      |
    | 網頁搜尋   | 不適用           | 與 Moonshot API 區域相同       | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY` |

    - Kimi 網頁搜尋使用 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，預設端點為 `https://api.moonshot.ai/v1`，模型為 `kimi-k2.6`。
    - 如有需要，請在 `models.providers` 中覆寫定價和內容脈絡中繼資料。
    - 如果 Moonshot 為某個模型公布不同的內容脈絡限制，請相應調整 `contextWindow`。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="網頁搜尋" href="/zh-TW/tools/web" icon="magnifying-glass">
    設定包括 Kimi 在內的網頁搜尋提供者。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    提供者、模型和外掛的完整設定結構描述。
  </Card>
  <Card title="Moonshot 開放平台" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API 金鑰管理與文件。
  </Card>
</CardGroup>
