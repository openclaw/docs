---
read_when:
    - 你想設定 Moonshot K2（Moonshot Open Platform）與 Kimi Coding 的比較
    - 你需要了解各自獨立的端點、金鑰和模型參照
    - 你想要任一提供者皆可複製貼上的設定
summary: 設定 Moonshot K2 與 Kimi Coding（分開的提供者與金鑰）
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T19:56:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot 提供具備 OpenAI 相容端點的 Kimi API。設定該提供者，並將預設模型設為 `moonshot/kimi-k2.6`，或透過 `kimi/kimi-for-coding` 使用 Kimi Coding。

<Warning>
Moonshot 和 Kimi Coding 是**不同的提供者**。金鑰不可互換、端點不同，模型參照也不同（`moonshot/...` 與 `kimi/...`）。
</Warning>

## 內建模型目錄

[//]: # "moonshot-kimi-k2-ids:start"

| 模型參照                          | 名稱                   | 推理     | 輸入        | 上下文  | 最大輸出   |
| --------------------------------- | ---------------------- | -------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | 否       | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | 一律開啟 | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | 否       | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | 是       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | 是       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | 否       | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

目前由 Moonshot 託管的 K2 模型，其目錄成本估算使用 Moonshot 公布的按量付費費率：Kimi K2.7 Code 為 $0.19/MTok 快取命中、$0.95/MTok 輸入，以及 $4.00/MTok 輸出；Kimi K2.6 為 $0.16/MTok 快取命中、$0.95/MTok 輸入，以及 $4.00/MTok 輸出；Kimi K2.5 為 $0.10/MTok 快取命中、$0.60/MTok 輸入，以及 $3.00/MTok 輸出。其他舊版目錄項目會保留零成本佔位值，除非你在設定中覆寫它們。

Kimi K2.7 Code 一律使用原生 thinking。依 Moonshot 要求，OpenClaw 對此模型只公開 `on` thinking 狀態，並省略外送的 `thinking` 與 `reasoning_effort` 控制。OpenClaw 也會省略 K2.7 固定為提供者預設值的取樣覆寫。Kimi K2.6 仍是 onboarding 預設值。

## 開始使用

選擇你的提供者並依照設定步驟操作。

<Tabs>
  <Tab title="Moonshot API">
    **最適合：**透過 Moonshot Open Platform 使用 Kimi K2 模型。

    <Steps>
      <Step title="Choose your endpoint region">
        | 驗證選項               | 端點                           | 區域 |
        | ---------------------- | ------------------------------ | ---- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 國際 |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 中國 |
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
        若你想在不影響一般工作階段的情況下驗證模型存取與成本追蹤，請使用隔離的狀態目錄：

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON 回應應回報 `provider: "moonshot"` 與 `model: "kimi-k2.6"`。當 Moonshot 回傳用量中繼資料時，助理轉錄項目會在 `usage.cost` 下儲存正規化後的權杖用量與估算成本。
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
    安裝官方外掛，然後重新啟動閘道：

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **最適合：**透過 Kimi Coding 端點執行以程式碼為主的工作。

    <Note>
    Kimi Coding 使用的 API 金鑰與提供者前綴（`kimi/...`）不同於 Moonshot（`moonshot/...`）。穩定 API 模型參照為 `kimi/kimi-for-coding`；舊版參照 `kimi/kimi-code` 與 `kimi/k2p5` 仍會被接受，並正規化為該 API 模型 ID。
    </Note>

    <Steps>
      <Step title="Install the plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
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

## Kimi 網頁搜尋

Moonshot 外掛也會將 **Kimi** 註冊為 `web_search` 提供者，背後由 Moonshot 網頁搜尋支援。

<Steps>
  <Step title="Run interactive web search setup">
    ```bash
    openclaw configure --section web
    ```

    在網頁搜尋區段選擇 **Kimi**，以儲存 `plugins.entries.moonshot.config.webSearch.*`。

  </Step>
  <Step title="Configure the web search region and model">
    互動式設定會提示以下項目：

    | 設定                | 選項                                                                 |
    | ------------------- | -------------------------------------------------------------------- |
    | API 區域            | `https://api.moonshot.ai/v1`（國際）或 `https://api.moonshot.cn/v1`（中國） |
    | 網頁搜尋模型        | 預設為 `kimi-k2.6`                                                   |

  </Step>
</Steps>

設定位於 `plugins.entries.moonshot.config.webSearch`：

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
    Kimi K2.7 Code 一律使用原生 thinking。Moonshot 要求用戶端對此模型省略 `thinking` 欄位，因此 OpenClaw 只公開 `on`，並忽略過時的 `off` 設定。K2.7 也會固定 `temperature`、`top_p`、`n`、`presence_penalty` 與 `frequency_penalty`；OpenClaw 會省略這些欄位的已設定覆寫。

    其他 Moonshot Kimi 模型支援二元原生 thinking：

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    可透過 `agents.defaults.models.<provider/model>.params` 針對每個模型設定：

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

    OpenClaw 會為這些模型對應執行階段 `/think` 等級：

    | `/think` 等級       | Moonshot 行為             |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | 任何非 off 等級      | `thinking.type=enabled`    |

    <Warning>
    啟用 Moonshot thinking 時，`tool_choice` 必須是 `auto` 或 `none`。OpenClaw 會將不相容的值正規化為 `auto`。這包含 Kimi K2.7 Code，因為它的 thinking 模式無法停用來保留固定的工具選擇。
    </Warning>

    Kimi K2.6 也接受選用的 `thinking.keep` 欄位，用來控制
    `reasoning_content` 的多輪保留。將它設為 `"all"` 可跨回合保留完整
    推理；省略它（或保留為 `null`）則使用伺服器
    預設策略。OpenClaw 只會為
    `moonshot/kimi-k2.6` 轉送 `thinking.keep`，並會從其他模型中移除它。Kimi K2.7 Code
    預設會保留完整推理歷史，而 OpenClaw 會省略整個
    `thinking` 欄位。

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
    Moonshot Kimi 會提供形如 `functions.<name>:<index>` 的原生 tool_call ID。對於 OpenAI-completions 傳輸，OpenClaw 會保留每個原生 Kimi ID 的第一次出現，並將後續重複項改寫為確定性的 OpenAI 風格 `call_*` ID。相符的工具結果會以相同 ID 重新對應，因此重播仍保持唯一，而不會移除 Kimi 的第一個原生 ID。

    若要在自訂 OpenAI 相容提供者上強制嚴格清理，請設定 `sanitizeToolCallIds: true`：

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="串流用量相容性">
    原生 Moonshot 端點（`https://api.moonshot.ai/v1` 和
    `https://api.moonshot.cn/v1`）會在共用的
    `openai-completions` 傳輸上宣告串流用量相容性。OpenClaw 會依端點
    能力決定，因此以相同原生 Moonshot
    主機為目標的相容自訂提供者 ID 會繼承相同的串流用量行為。

    依目錄中的 K2.6 定價，包含輸入、輸出
    和快取讀取權杖的串流用量，也會轉換成本機估算的美元成本，用於
    `/status`、`/usage full`、`/usage cost`，以及由逐字稿支援的工作階段
    計費。

  </Accordion>

  <Accordion title="端點與模型參照參考">
    | 提供者   | 模型參照前綴 | 端點                      | 驗證環境變數        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding 端點          | `KIMI_API_KEY`      |
    | 網頁搜尋 | N/A              | 與 Moonshot API 區域相同   | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY` |

    - Kimi 網頁搜尋使用 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，並預設使用 `https://api.moonshot.ai/v1` 搭配模型 `kimi-k2.6`。
    - 如有需要，請在 `models.providers` 中覆寫定價與內容中繼資料。
    - 如果 Moonshot 為某個模型發布不同的內容限制，請相應調整 `contextWindow`。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="網頁搜尋" href="/zh-TW/tools/web" icon="magnifying-glass">
    設定包含 Kimi 在內的網頁搜尋提供者。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    提供者、模型與外掛的完整設定結構描述。
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API 金鑰管理與文件。
  </Card>
</CardGroup>
