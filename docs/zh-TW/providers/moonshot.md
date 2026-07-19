---
read_when:
    - 你想設定 Moonshot Kimi K3/K2（Moonshot Open Platform）還是 Kimi Coding？
    - 你需要瞭解各自獨立的端點、金鑰和模型參照
    - 你想要任一供應商可直接複製貼上的設定內容
summary: 設定 Moonshot Kimi 模型與 Kimi Coding（使用不同的供應商與金鑰）
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-19T14:05:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a9c60d2ec13c1de48e037b6cfe7b35b2133328ba852143134521e9d56edbba8e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot 透過與 OpenAI 相容的端點提供 Kimi API。選擇
`moonshot/kimi-k3` 以使用 Kimi K3、保留初始設定的預設值
`moonshot/kimi-k2.6`，或使用 `kimi/kimi-for-coding` 以使用 Kimi Coding。

<Warning>
Moonshot 和 Kimi Coding 是**不同的供應商**，各自以獨立的外部外掛提供。兩者的金鑰無法互換、端點不同，模型參照也不同（`moonshot/...` 與 `kimi/...`）。
</Warning>

## 內建模型目錄

[//]: # "moonshot-kimi-k2-ids:start"

| 模型參照                            | 名稱                     | 推理       | 輸入         | 上下文    | 最大輸出量 |
| ----------------------------------- | ------------------------ | ---------- | ------------ | --------- | ---------- |
| `moonshot/kimi-k2.6`                | Kimi K2.6                | 否         | 文字、圖片   | 262,144   | 262,144    |
| `moonshot/kimi-k3`                  | Kimi K3                  | 永遠為最大 | 文字、圖片   | 1,048,576 | 1,048,576  |
| `moonshot/kimi-k2.7-code`           | Kimi K2.7 Code           | 永遠開啟   | 文字、圖片   | 262,144   | 262,144    |
| `moonshot/kimi-k2.7-code-highspeed` | Kimi K2.7 Code HighSpeed | 永遠開啟   | 文字、圖片   | 262,144   | 262,144    |
| `moonshot/kimi-k2.5`                | Kimi K2.5                | 否         | 文字、圖片   | 262,144   | 262,144    |

[//]: # "moonshot-kimi-k2-ids:end"

目錄中的成本估算採用 Moonshot 公布的隨用隨付費率。在做出成本
決策前，請查看供應商目前的 [Kimi K3](https://platform.kimi.ai/docs/pricing/chat-k3)、
[Kimi K2.7 Code](https://platform.kimi.ai/docs/pricing/chat-k27-code)、
[Kimi K2.6](https://platform.kimi.ai/docs/pricing/chat-k26) 和
[Kimi K2.5](https://platform.kimi.ai/docs/pricing/chat-k25) 頁面。

Kimi K3 一律以 `reasoning_effort: "max"` 進行推理。OpenClaw 僅公開
`/think max`、省略僅適用於 K2 的 `thinking` 欄位，並移除 K3
固定採用供應商預設值的取樣覆寫設定（`temperature`、`top_p`、`n`、`presence_penalty` 和
`frequency_penalty`）。Kimi K2.7 Code 也一律使用原生思考，但要求省略
`thinking` 和 `reasoning_effort`；HighSpeed 變體採用相同的合約。
Kimi K2.6 仍是初始設定的預設值。
請參閱 Moonshot 的 [Kimi K3 快速入門](https://platform.kimi.ai/docs/guide/kimi-k3-quickstart)。

## 開始使用

Moonshot 和 Kimi Coding 都是外部外掛，請先安裝其中之一，
再執行初始設定。

<Tabs>
  <Tab title="Moonshot API">
    **最適合：**透過 Moonshot Open Platform 使用 Kimi K3 和 K2 模型。

    <Steps>
      <Step title="安裝外掛">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="選擇端點區域">
        | 驗證選項               | 端點                           | 區域     |
        | ---------------------- | ------------------------------ | -------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 國際     |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 中國     |
      </Step>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        若要使用中國端點：

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="將 Kimi K3 設為預設模型">
        初始設定會保留 Kimi K2.6 作為初始預設值。需要使用 Kimi K3
        時，請明確切換：

        ```bash
        openclaw models set moonshot/kimi-k3
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="執行即時冒煙測試">
        若要驗證模型存取權和成本追蹤，而不影響一般工作階段，
        請使用隔離的狀態目錄：

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message '請完全照此回覆：KIMI_LIVE_OK' \
          --thinking max \
          --json
        ```

        JSON 回應應回報 `provider: "moonshot"` 和
        `model: "kimi-k3"`。當 Moonshot 傳回用量中繼資料時，助理逐字稿項目會在
        `usage.cost` 下儲存正規化的權杖用量與估算成本。
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
            "moonshot/kimi-k3": { alias: "Kimi K3" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.7-code-highspeed": { alias: "Kimi K2.7 Code HighSpeed" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
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
                id: "kimi-k3",
                name: "Kimi K3",
                reasoning: true,
                thinkingLevelMap: {
                  off: null,
                  minimal: null,
                  low: null,
                  medium: null,
                  high: null,
                  xhigh: "max",
                  max: "max",
                },
                input: ["text", "image"],
                cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 },
                contextWindow: 1048576,
                maxTokens: 1048576,
                compat: {
                  supportsReasoningEffort: true,
                  supportedReasoningEfforts: ["max"],
                },
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
                id: "kimi-k2.7-code-highspeed",
                name: "Kimi K2.7 Code HighSpeed",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 1.9, output: 8, cacheRead: 0.38, cacheWrite: 0 },
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
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **最適合：**透過 Kimi Coding 端點執行以程式碼為主的任務。

    <Note>
    Kimi Coding 使用與 Moonshot（`moonshot/...`）不同的 API 金鑰和供應商前綴（`kimi/...`）。目前的參照包括提供 256K 上下文的 `kimi/k3`、提供 1M 等級的 `kimi/k3[1m]`、`kimi/kimi-for-coding` 和 `kimi/kimi-for-coding-highspeed`。舊版參照 `kimi/kimi-code` 和 `kimi/k2p5` 仍可使用，並會正規化為 `kimi/kimi-for-coding`。
    </Note>

    此程式設計服務同時接受與 OpenAI 相容的
    `https://api.kimi.com/coding/v1` 和與 Anthropic 相容的
    `https://api.kimi.com/coding/` 用戶端。此外掛使用 Anthropic Messages。
    請在 [Kimi Code Console](https://www.kimi.com/code/console)
    建立會員金鑰；目前的會員價格請見 [Kimi 的價格頁面](https://www.kimi.com/membership/pricing)。

    <Steps>
      <Step title="安裝外掛">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="執行初始設定">
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

    Kimi Code K3 預設在 `max` 使用深度思考。`/think off` 會傳送
    `thinking.type: "disabled"`；`/think max` 會以最大推理強度傳送 K3 的自適應思考
    請求。過時的較低思考等級會解析為受支援的 `max` 等級。
    1M 模型需要 Allegretto 或更高等級的 Kimi 會員資格；使用 Moderato 時請使用
    `kimi/k3`。

    如需目前方案的可用性資訊，請參閱官方的 [Kimi Code 模型表](https://www.kimi.com/code/docs/en/kimi-code/models.html)。

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

Moonshot 外掛也會將 **Kimi** 註冊為 `web_search` 供應商，並由 Moonshot 網頁搜尋提供支援。

<Steps>
  <Step title="執行互動式網頁搜尋設定">
    ```bash
    openclaw configure --section web
    ```

    在網頁搜尋區段中選擇 **Kimi**，以儲存
    `plugins.entries.moonshot.config.webSearch.*`。

  </Step>
  <Step title="設定網頁搜尋區域和模型">
    互動式設定會提示以下項目：

    | 設定                | 選項                                                                 |
    | ------------------- | -------------------------------------------------------------------- |
    | API 區域            | `https://api.moonshot.ai/v1`（國際）或 `https://api.moonshot.cn/v1`（中國） |
    | 網頁搜尋模型        | 預設為 `kimi-k2.6`                                             |

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
            apiKey: "sk-...", // 或使用 KIMI_API_KEY / MOONSHOT_API_KEY
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
    Moonshot API Kimi K3 一律以最大推理強度進行推理。OpenClaw 僅公開
    `/think max`、傳送 `reasoning_effort: "max"`，並忽略過時的較低等級或
    `off` 設定。

    Kimi Code K3 公開 `/think off|max`。其 Anthropic 相容端點
    會接收 `thinking.type: "disabled"` 以關閉思考，或接收搭配
    `output_config.effort: "max"` 的自適應思考以設為最大值。這同時適用於 `kimi/k3` 與
    `kimi/k3[1m]`。
    Moonshot API K3 支援 `auto`、`none`、`required` 及固定的工具選擇，
    因此 OpenClaw 會保留所要求的 `tool_choice`。對於多輪工具使用，
    OpenClaw 會保留 Moonshot 重播合約所要求的助理推理內容。

    Kimi K2.7 Code 一律使用原生思考。Moonshot 要求用戶端針對此模型
    省略 `thinking` 欄位，因此 OpenClaw 僅公開 `on`，並
    忽略過時的 `off` 設定。K2.7 也會固定 `temperature`、`top_p`、`n`、
    `presence_penalty` 與 `frequency_penalty`；OpenClaw 會省略這些欄位已設定的
    覆寫值。

    其他 Moonshot Kimi 模型支援二元原生思考：

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    透過 `agents.defaults.models.<provider/model>.params` 為各模型進行設定：

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

    OpenClaw 會對這些模型對應執行階段的 `/think` 層級：

    | `/think` 層級       | Moonshot 行為          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | 任何非關閉層級    | `thinking.type=enabled`    |

    <Warning>
    啟用 Moonshot K2 思考時，`tool_choice` 必須是 `auto` 或 `none`。固定的工具選擇（`type: "tool"` 或 `type: "function"`）會改為強制將思考設回 `disabled`，讓所要求的工具仍會執行；`tool_choice: "required"` 則會正規化為 `auto`。Kimi K2.7 Code 無法停用思考，因此其不相容的 `tool_choice` 會正規化為 `auto`。Kimi K3 使用其獨立的推理強度合約，並保留支援的工具選擇。
    </Warning>

    Kimi K2.6 也接受選用的 `thinking.keep` 欄位，用於控制
    跨多輪保留 `reasoning_content` 的方式。將其設為 `"all"` 可跨輪保留完整
    推理；省略該欄位（或維持為 `null`）則使用伺服器的
    預設策略。OpenClaw 僅會為
    `moonshot/kimi-k2.6` 轉送 `thinking.keep`，並從其他模型中移除該欄位。Kimi K2.7 Code
    預設會保留完整的推理歷史記錄，而 OpenClaw 會省略整個
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
    Moonshot Kimi 提供形如 `functions.<name>:<index>` 的原生 tool_call ID。OpenClaw 會保留每個 Kimi 原生 ID 的首次出現，並將之後的重複項目改寫為確定性的 OpenAI 風格 `call_*` ID。相符的工具結果會使用相同 ID 重新對應，使重播內容保持唯一，同時不移除 Kimi 的第一個原生 ID。此行為已整合至隨附的 Moonshot 提供者，並非使用者可設定的選項。
  </Accordion>

  <Accordion title="串流用量相容性">
    原生 Moonshot 端點（`https://api.moonshot.ai/v1` 與
    `https://api.moonshot.cn/v1`）宣告支援串流用量相容性。
    OpenClaw 會依據端點主機而非提供者 ID 判定此行為，因此指向相同
    Moonshot 原生主機的自訂提供者 ID 會繼承相同的
    串流用量行為。

    使用目錄中的 K2.6 定價時，包含輸入、輸出
    與快取讀取權杖的串流用量，也會轉換為本機預估美元成本，以供
    `/status`、`/usage full`、`/usage cost` 及由文字記錄支援的工作階段
    計費使用。

  </Accordion>

  <Accordion title="端點與模型參照參考">
    | 提供者   | 模型參照前綴 | 端點                      | 驗證環境變數        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding 端點           | `KIMI_API_KEY`      |
    | 網頁搜尋 | 不適用              | 與 Moonshot API 區域相同    | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY` |

    - Kimi 網頁搜尋使用 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，並預設使用 `https://api.moonshot.ai/v1` 與模型 `kimi-k2.6`。
    - 如有需要，請在 `models.providers` 中覆寫定價與上下文中繼資料。
    - 若 Moonshot 為某模型發布不同的上下文限制，請相應調整 `contextWindow`。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照及容錯移轉行為。
  </Card>
  <Card title="網頁搜尋" href="/zh-TW/tools/web" icon="magnifying-glass">
    設定包括 Kimi 在內的網頁搜尋提供者。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    提供者、模型與外掛的完整設定結構描述。
  </Card>
  <Card title="Moonshot 開放平台" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API 金鑰管理與文件。
  </Card>
</CardGroup>
