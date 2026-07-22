---
read_when:
    - 你想設定 Moonshot Kimi K3/K2（Moonshot Open Platform）還是 Kimi Coding
    - 你需要瞭解不同的端點、金鑰和模型參照名稱
    - 你需要可複製貼上的任一提供者設定。
summary: 設定 Moonshot Kimi 模型與 Kimi Coding（分開的供應商與金鑰）
title: 月之暗面 AI
x-i18n:
    generated_at: "2026-07-22T10:46:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 213379bf88fec26b052184a920e112f0887d6485601bfb47f590cf37ef983e58
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot 透過與 OpenAI 相容的端點提供 Kimi API。為 Kimi K3 選擇
`moonshot/kimi-k3`，保留初始設定預設值
`moonshot/kimi-k2.6`，或為 Kimi Coding 使用 `kimi/kimi-for-coding`。

<Warning>
Moonshot 與 Kimi Coding 是**不同的供應商**，各自以獨立的外部外掛提供。金鑰不可互換、端點不同，且模型參照也不同（`moonshot/...` 與 `kimi/...`）。
</Warning>

## 內建模型目錄

[//]: # "moonshot-kimi-k2-ids:start"

| 模型參照                            | 名稱                     | 推理       | 輸入         | 上下文    | 最大輸出   |
| ----------------------------------- | ------------------------ | ---------- | ------------ | --------- | ---------- |
| `moonshot/kimi-k2.6`                | Kimi K2.6                | 否         | 文字、圖片   | 262,144   | 262,144    |
| `moonshot/kimi-k3`                  | Kimi K3                  | 一律最大   | 文字、圖片   | 1,048,576 | 1,048,576  |
| `moonshot/kimi-k2.7-code`           | Kimi K2.7 Code           | 一律開啟   | 文字、圖片   | 262,144   | 262,144    |
| `moonshot/kimi-k2.7-code-highspeed` | Kimi K2.7 Code HighSpeed | 一律開啟   | 文字、圖片   | 262,144   | 262,144    |
| `moonshot/kimi-k2.5`                | Kimi K2.5                | 否         | 文字、圖片   | 262,144   | 262,144    |

[//]: # "moonshot-kimi-k2-ids:end"

目錄成本估算採用 Moonshot 公布的隨用隨付費率。在進行成本
決策前，請查看供應商的即時頁面：[Kimi K3](https://platform.kimi.ai/docs/pricing/chat-k3)、
[Kimi K2.7 Code](https://platform.kimi.ai/docs/pricing/chat-k27-code)、
[Kimi K2.6](https://platform.kimi.ai/docs/pricing/chat-k26) 和
[Kimi K2.5](https://platform.kimi.ai/docs/pricing/chat-k25)。

Kimi K3 一律以 `reasoning_effort: "max"` 進行推理。OpenClaw 僅公開
`/think max`，省略僅適用於 K2 的 `thinking` 欄位，並移除 K3 固定為供應商預設值的取樣
覆寫（`temperature`、`top_p`、`n`、`presence_penalty` 和
`frequency_penalty`）。Kimi K2.7 Code 也一律使用原生思考，但要求同時省略
`thinking` 和 `reasoning_effort`；HighSpeed 變體採用相同合約。
Kimi K2.6 仍是初始設定預設值。
請參閱 Moonshot 的 [Kimi K3 快速入門](https://platform.kimi.ai/docs/guide/kimi-k3-quickstart)。

## 開始使用

Moonshot 和 Kimi Coding 都是外部外掛，請先安裝其中一個，
再進行初始設定。

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
        | 驗證選項               | 端點                           | 區域          |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 國際          |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 中國          |
      </Step>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        中國端點則使用：

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="將 Kimi K3 設為預設模型">
        初始設定會保留 Kimi K2.6 作為初始預設值。要使用 Kimi K3 時，
        請明確切換：

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
        若要在不影響一般工作階段的情況下驗證模型存取和成本
        追蹤，請使用隔離的狀態目錄：

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking max \
          --json
        ```

        JSON 回應應回報 `provider: "moonshot"` 和
        `model: "kimi-k3"`。當 Moonshot 傳回使用量中繼資料時，助理逐字稿項目會在
        `usage.cost` 下儲存正規化的權杖使用量和估算成本。
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
    **最適合：**透過 Kimi Coding 端點執行以程式碼為主的工作。

    <Note>
    Kimi Coding 使用與 Moonshot（`moonshot/...`）不同的 API 金鑰和供應商前綴（`kimi/...`）。目前的參照為：具備 256K 上下文的 `kimi/k3`、1M 層級的 `kimi/k3[1m]`、`kimi/kimi-for-coding` 和 `kimi/kimi-for-coding-highspeed`。舊版參照 `kimi/kimi-code` 和 `kimi/k2p5` 仍會被接受，並正規化為 `kimi/kimi-for-coding`。
    </Note>

    此程式設計服務同時接受與 OpenAI 相容的
    `https://api.kimi.com/coding/v1` 和與 Anthropic 相容的
    `https://api.kimi.com/coding/` 用戶端。此外掛使用 Anthropic Messages。
    請在
    [Kimi Code Console](https://www.kimi.com/code/console) 建立會員金鑰；目前的會員
    定價請見 [Kimi 定價頁面](https://www.kimi.com/membership/pricing)。

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

    Kimi Code K3 預設以 `max` 進行深度思考。`/think off` 會傳送
    `thinking.type: "disabled"`；`/think max` 會傳送 K3 的自適應思考
    請求，並使用最大投入程度。過時的較低思考層級會解析為支援的
    `max` 層級。1M 模型需要 Allegretto 或更高等級的 Kimi
    會員資格；Moderato 請使用 `kimi/k3`。

    如需目前方案可用性，請參閱官方的 [Kimi Code 模型表](https://www.kimi.com/code/docs/en/kimi-code/models.html)。

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

    在網頁搜尋區段選擇 **Kimi**，以儲存
    `plugins.entries.moonshot.config.webSearch.*`。

  </Step>
  <Step title="設定網頁搜尋區域和模型">
    互動式設定會提示輸入：

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
    Moonshot API Kimi K3 一律以最大投入程度進行推理。OpenClaw 僅公開
    `/think max`、傳送 `reasoning_effort: "max"`，並忽略過時的較低層級或
    `off` 設定。

    Kimi Code K3 提供 `/think off|max`。其 Anthropic 相容端點
    會接收用於關閉的 `thinking.type: "disabled"`，或使用
    `output_config.effort: "max"` 以達到最大值的自適應思考。這同時適用於 `kimi/k3` 和
    `kimi/k3[1m]`。
    Moonshot API K3 支援 `auto`、`none`、`required` 和固定的工具選擇，
    因此 OpenClaw 會保留所要求的 `tool_choice`。對於多輪工具使用，
    OpenClaw 會保留 Moonshot 重播合約所需的助理推理內容。

    Kimi K2.7 Code 一律使用原生思考。Moonshot 要求用戶端
    對此模型省略 `thinking` 欄位，因此 OpenClaw 僅提供 `on`，並
    忽略過時的 `off` 設定。K2.7 也固定了 `temperature`、`top_p`、`n`、
    `presence_penalty` 和 `frequency_penalty`；OpenClaw 會省略這些欄位已設定的
    覆寫值。

    其他 Moonshot Kimi 模型支援二元原生思考：

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    透過 `agents.defaults.models.<provider/model>.params` 針對各模型進行設定：

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
    啟用 Moonshot K2 思考時，`tool_choice` 必須是 `auto` 或 `none`。固定的工具選擇（`type: "tool"` 或 `type: "function"`）會改為強制將思考恢復為 `disabled`，因此所要求的工具仍會執行；`tool_choice: "required"` 則會改為正規化成 `auto`。Kimi K2.7 Code 無法停用思考，因此其不相容的 `tool_choice` 會正規化成 `auto`。Kimi K3 使用獨立的推理強度合約，並保留受支援的工具選擇。
    </Warning>

    Kimi K2.6 也接受選用的 `thinking.keep` 欄位，用於控制
    `reasoning_content` 的多輪保留。將其設為 `"all"`，可跨輪次保留完整
    推理；省略它（或保持為 `null`）則使用伺服器
    的預設策略。OpenClaw 僅會為
    `moonshot/kimi-k2.6` 轉送 `thinking.keep`，並從其他模型中移除。Kimi K2.7 Code
    預設會保留完整推理歷程，而 OpenClaw 會省略整個
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

  <Accordion title="工具呼叫 ID 淨化">
    Moonshot Kimi 提供的原生 tool_call ID 格式如 `functions.<name>:<index>`。OpenClaw 會保留每個原生 Kimi ID 第一次出現的項目，並將後續重複項目改寫成確定性的 OpenAI 風格 `call_*` ID。相符的工具結果會以相同 ID 重新對應，因此重播時仍能保持唯一性，而不會移除 Kimi 的第一個原生 ID。此行為已整合至隨附的 Moonshot 提供者，並非使用者可設定的選項。
  </Accordion>

  <Accordion title="串流用量相容性">
    原生 Moonshot 端點（`https://api.moonshot.ai/v1` 和
    `https://api.moonshot.cn/v1`）宣告支援串流用量相容性。
    OpenClaw 會依端點主機判斷，而非提供者 ID，因此指向相同
    Moonshot 原生主機的自訂提供者 ID 會繼承相同的
    串流用量行為。

    採用目錄中的 K2.6 定價時，包含輸入、輸出
    和快取讀取權杖的串流用量，也會轉換為本機預估的美元成本，用於
    `/status`、`/usage full`、`/usage cost` 和以逐字稿為依據的工作階段
    計費。

  </Accordion>

  <Accordion title="端點與模型參照參考">
    | 提供者   | 模型參照前置字串 | 端點                      | 驗證環境變數        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding 端點           | `KIMI_API_KEY`      |
    | 網頁搜尋 | 不適用              | 與 Moonshot API 區域相同    | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY` |

    - Kimi 網頁搜尋使用 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，並預設使用模型 `kimi-k2.6` 的 `https://api.moonshot.ai/v1`。
    - 如有需要，請在 `models.providers` 中覆寫定價與上下文中繼資料。
    - 如果 Moonshot 為某個模型發布不同的上下文限制，請相應調整 `contextWindow`。

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
