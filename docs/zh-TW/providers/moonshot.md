---
read_when:
    - 你想要 Moonshot K2（Moonshot Open Platform）與 Kimi Coding 設定比較
    - 你需要了解各自獨立的端點、金鑰和模型參照
    - 你想要任一提供者的可複製貼上設定
summary: 設定 Moonshot K2 與 Kimi Coding（不同提供者與金鑰）
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-10T19:49:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot 提供具有 OpenAI 相容端點的 Kimi API。請設定
provider，並將預設模型設為 `moonshot/kimi-k2.6`，或搭配
`kimi/kimi-for-coding` 使用 Kimi Coding。

<Warning>
Moonshot 與 Kimi Coding 是**不同的 provider**。金鑰不可互換、端點不同，model ref 也不同（`moonshot/...` 與 `kimi/...`）。
</Warning>

## 內建模型目錄

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | 名稱                   | 推理 | 輸入        | Context | 最大輸出 |
| --------------------------------- | ---------------------- | ---- | ----------- | ------- | -------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | 否   | 文字、圖片  | 262,144 | 262,144  |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | 否   | 文字、圖片  | 262,144 | 262,144  |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | 是   | 文字        | 262,144 | 262,144  |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | 是   | 文字        | 262,144 | 262,144  |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | 否   | 文字        | 256,000 | 16,384   |

[//]: # "moonshot-kimi-k2-ids:end"

目前 Moonshot 託管的 K2 模型所附的成本估算，使用 Moonshot
發布的隨用隨付費率：Kimi K2.6 為快取命中 $0.16/MTok、
輸入 $0.95/MTok、輸出 $4.00/MTok；Kimi K2.5 為快取命中 $0.10/MTok、
輸入 $0.60/MTok、輸出 $3.00/MTok。其他舊版目錄項目會保留
零成本預留值，除非你在設定中覆寫它們。

## 開始使用

選擇你的 provider，並依照設定步驟操作。

<Tabs>
  <Tab title="Moonshot API">
    **最適合：** 透過 Moonshot Open Platform 使用 Kimi K2 模型。

    <Steps>
      <Step title="選擇你的端點區域">
        | 驗證選項               | 端點                           | 區域          |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 國際          |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 中國          |
      </Step>
      <Step title="執行 onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        或針對中國端點：

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="設定預設模型">
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
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="執行即時煙霧測試">
        若要在不影響一般工作階段的情況下驗證模型存取與成本追蹤，
        請使用隔離的狀態目錄：

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON 回應應回報 `provider: "moonshot"` 與
        `model: "kimi-k2.6"`。當 Moonshot 回傳用量中繼資料時，assistant transcript 項目會在 `usage.cost`
        下儲存正規化的 token 用量與估算成本。
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
    **最適合：** 透過 Kimi Coding 端點執行以程式碼為核心的工作。

    <Note>
    Kimi Coding 使用的 API 金鑰與 provider prefix（`kimi/...`）不同於 Moonshot（`moonshot/...`）。穩定的 API model ref 是 `kimi/kimi-for-coding`；舊版 ref `kimi/kimi-code` 與 `kimi/k2p5` 仍會被接受，並正規化為該 API model id。
    </Note>

    <Steps>
      <Step title="執行 onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="設定預設模型">
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
      <Step title="確認模型可用">
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

OpenClaw 也隨附 **Kimi** 作為 `web_search` 提供者，由 Moonshot 網頁搜尋支援。

<Steps>
  <Step title="執行互動式網頁搜尋設定">
    ```bash
    openclaw configure --section web
    ```

    在網頁搜尋區段中選擇 **Kimi**，以儲存
    `plugins.entries.moonshot.config.webSearch.*`。

  </Step>
  <Step title="設定網頁搜尋區域和模型">
    互動式設定會提示：

    | 設定             | 選項                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | API 區域          | `https://api.moonshot.ai/v1`（國際）或 `https://api.moonshot.cn/v1`（中國） |
    | 網頁搜尋模型    | 預設為 `kimi-k2.6`                                             |

  </Step>
</Steps>

設定位於 `plugins.entries.moonshot.config.webSearch` 底下：

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
  <Accordion title="原生思考模式">
    Moonshot Kimi 支援二元原生思考：

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    透過 `agents.defaults.models.<provider/model>.params` 為每個模型設定：

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

    OpenClaw 也會為 Moonshot 對應執行階段的 `/think` 層級：

    | `/think` 層級       | Moonshot 行為              |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | 任何非 off 層級     | `thinking.type=enabled`    |

    <Warning>
    啟用 Moonshot 思考時，`tool_choice` 必須是 `auto` 或 `none`。OpenClaw 會將不相容的 `tool_choice` 值正規化為 `auto` 以確保相容性。
    </Warning>

    Kimi K2.6 也接受選用的 `thinking.keep` 欄位，用來控制
    `reasoning_content` 的多輪保留。將它設為 `"all"` 可跨輪次保留完整
    推理；省略它（或將它保留為 `null`）則會使用伺服器
    預設策略。OpenClaw 只會為
    `moonshot/kimi-k2.6` 轉送 `thinking.keep`，並會從其他模型中移除它。

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
    Moonshot Kimi 提供的 tool_call ID 形如 `functions.<name>:<index>`。OpenClaw 會原封不動保留它們，讓多輪工具呼叫持續運作。

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
    能力判斷，因此以相同原生
    Moonshot 主機為目標的相容自訂提供者 ID，會繼承相同的串流用量行為。

    使用內建的 K2.6 定價時，包含輸入、輸出
    和快取讀取權杖的串流用量，也會轉換為本機估算的美元成本，用於
    `/status`、`/usage full`、`/usage cost`，以及以轉錄為依據的工作階段
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
    - 如有需要，請在 `models.providers` 中覆寫定價與情境中繼資料。
    - 如果 Moonshot 為某個模型發布不同的情境限制，請相應調整 `contextWindow`。

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
    提供者、模型與 plugins 的完整設定架構。
  </Card>
  <Card title="Moonshot 開放平台" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API 金鑰管理與文件。
  </Card>
</CardGroup>
