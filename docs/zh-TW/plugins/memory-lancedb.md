---
read_when:
    - 你正在設定 memory-lancedb 外掛
    - 你想要由 LanceDB 支援、具備自動回憶或自動擷取功能的長期記憶體
    - 你正在使用與 OpenAI 相容的本機嵌入模型，例如 Ollama
sidebarTitle: Memory LanceDB
summary: 設定官方外部 LanceDB 記憶外掛，包括本機 Ollama 相容的嵌入模型
title: 記憶 LanceDB
x-i18n:
    generated_at: "2026-07-19T13:58:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 771b28b9775175f53d3e6543e66618a56dd40ef95598c00c7abf9b62fb261e47
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` 是官方外部外掛，使用 LanceDB 搭配向量搜尋來儲存長期記憶。它可以在模型
輪次開始前自動回想相關記憶，並在回應後自動擷取重要事實。

適用於本機向量資料庫、OpenAI 相容的嵌入端點，或預設內建記憶後端以外的
記憶儲存區。

## 安裝

```bash
openclaw plugins install @openclaw/memory-lancedb
```

此外掛已發佈至 npm；不會綑綁於 OpenClaw 執行階段
映像檔中。安裝時會寫入外掛項目、啟用外掛，並將
`plugins.slots.memory` 切換為 `memory-lancedb`。若記憶插槽目前由其他外掛擁有，
該外掛會停用並顯示警告。

<Note>
`memory-wiki` 等配套外掛可與 `memory-lancedb` 同時執行，
但同一時間只有一個外掛能擁有作用中的記憶插槽。
</Note>

<Note>
LanceDB 的 `memory_recall` 不會收到 `memorySearch.rememberAcrossConversations` 所使用的受保護私人逐字稿
授權。請透過
[進階主動記憶](/zh-TW/concepts/active-memory#lancedb-memory)使用 LanceDB 的
`autoRecall` 或其 `memory_recall` 工具。
當目前的記憶提供者無法使用「跨對話記住」功能時，`openclaw doctor` 會回報此情況。
</Note>

## 快速開始

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

變更外掛設定後，重新啟動閘道，然後確認外掛已載入：

```bash
openclaw gateway restart
openclaw plugins list
```

## 嵌入設定

`embedding` 為必要項目，且必須至少包含一個欄位。`provider`
預設為 `openai`；`model` 預設為 `text-embedding-3-small`。

| 欄位                  | 類型          | 備註                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | 字串        | 轉接器 ID，例如 `openai`、`github-copilot`、`ollama`。預設為 `openai`。 |
| `embedding.model`      | 字串        | 預設為 `text-embedding-3-small`。                                        |
| `embedding.apiKey`     | 字串        | 選用；支援 `${ENV_VAR}` 展開。                               |
| `embedding.baseUrl`    | 字串        | 選用；支援 `${ENV_VAR}` 展開。                               |
| `embedding.dimensions` | 整數 (>=1) | 不在內建表格中的模型必須設定（請見下文）。               |

有兩種請求路徑：

- **提供者轉接器路徑**（預設）：設定 `embedding.provider` 並省略
  `embedding.apiKey`/`embedding.baseUrl`。此外掛會透過與 `memory-core` 相同的記憶嵌入
  轉接器，解析提供者已設定的驗證設定檔、環境變數或
  `models.providers.<provider>.apiKey`。這是 `github-copilot`、`ollama`
  以及任何其他支援嵌入的綑綁提供者所使用的路徑。
- **直接 OpenAI 相容用戶端路徑**：不要設定 `embedding.provider`
  （或 `"openai"`），並設定 `embedding.apiKey` 和 `embedding.baseUrl`。此路徑
  適用於沒有綑綁提供者轉接器的原始 OpenAI 相容嵌入端點。

OpenAI Codex / ChatGPT OAuth 並非 OpenAI Platform 的嵌入認證資訊。
若要使用 OpenAI 嵌入，請使用 OpenAI API 金鑰驗證設定檔、`OPENAI_API_KEY` 或
`models.providers.openai.apiKey`。僅使用 OAuth 的使用者應選擇其他支援
嵌入的提供者，例如 `github-copilot` 或 `ollama`。

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

部分 OpenAI 相容嵌入端點會拒絕 `encoding_format`
參數；其他端點則會忽略它，並一律傳回 `number[]`。`memory-lancedb`
會在請求中省略 `encoding_format`，並接受浮點數陣列或
Base64 編碼的 float32 回應，因此兩種回應格式皆無須額外設定即可運作。

### 維度

OpenClaw 僅為 `text-embedding-3-small` (1536) 和
`text-embedding-3-large` (3072) 提供內建維度。其他模型皆須明確設定
`embedding.dimensions`，讓 LanceDB 能建立向量欄，例如
維度為 2048 的 ZhiPu `embedding-3`：

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Ollama 嵌入

使用綑綁的 Ollama 提供者轉接器路徑（`embedding.provider: "ollama"`）。
此路徑會呼叫 Ollama 原生的 `/api/embed` 端點，並遵循與
[Ollama](/zh-TW/providers/ollama) 提供者相同的驗證／基底 URL 規則。

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

`mxbai-embed-large` 不在內建維度表中，因此
必須設定 `dimensions`。對於小型本機嵌入模型，若本機伺服器傳回
內容長度錯誤，請降低 `recallMaxChars`。

## 回想與擷取限制

| 設定           | 預設值 | 範圍                        | 適用範圍                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | 為了回想而傳送至嵌入 API 的文字。                 |
| `captureMaxChars` | `500`   | 100-10000                    | 符合自動擷取資格的訊息長度。                  |
| `customTriggers`  | `[]`    | 0-50 個項目，每個 <=100 個字元 | 使自動擷取考慮某則訊息的字面詞組。 |

`recallMaxChars` 會限制 `before_prompt_build` 自動回想查詢、
`memory_recall` 工具、`memory_forget` 查詢路徑以及 `openclaw ltm
search`。自動回想會嵌入該輪次中最新的使用者訊息，只有在不存在使用者訊息時
才會改用完整提示詞，以免將頻道中繼資料和大型提示詞區塊納入嵌入請求。

`captureMaxChars` 會判斷該輪次 `agent_end`
事件中的使用者訊息是否足夠短，可納入自動擷取考量；不影響
回想查詢。

`customTriggers` 可新增不使用正規表示式的字面自動擷取詞組。內建
觸發詞涵蓋常見的英文、捷克文、中文、日文及韓文記憶
詞組（`remember`、`prefer`、`记住`、`覚えて`、`기억해` 等）。

自動擷取也會拒絕看似信封／傳輸中繼資料、
提示詞注入酬載或已注入的 `<relevant-memories>` 內容的文字，
並將每個代理輪次擷取的記憶數量限制為最多 3 筆。

每筆記憶皆由一個代理擁有。回想、重複偵測、擷取、
列出、原始查詢及刪除，都會在傳回或修改資料列前強制檢查該擁有者。
具有 `memorySearch.enabled: false`（位於 `agents.list[]`
或透過 `agents.defaults` 設定）的代理，也不會取得任何 `memory_recall`、`memory_store`
或 `memory_forget` 工具，且即使外掛層級的 `autoRecall`/`autoCapture`
旗標已開啟，也不會參與自動回想或擷取。

## 命令

只要已安裝 `memory-lancedb`，就會註冊 `ltm` 命令列介面命名空間
（不只限於它擁有作用中記憶插槽時）：

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` 會直接對 LanceDB 資料表執行非向量查詢：

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| 旗標                              | 預設值                                 | 備註                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | 已設定的預設代理                | 選取私人代理命名空間。可用於 `list`、`search`、`query` 和 `stats`。                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | 以逗號分隔的欄允許清單。                                                                                                         |
| `--filter <condition>`            | 無                                    | 對輸出欄進行一次比較，例如 `category = 'preference'` 或 `importance >= 0.8`。字串值必須加上引號。             |
| `--limit <n>`                     | `10`                                    | 正整數。                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | 無                                    | 篩選執行後在記憶體中排序；排序欄會自動加入投影，若未要求該欄，則會從輸出中移除。 |

代理會從作用中的記憶外掛取得三個工具：

- `memory_recall`：對已儲存的記憶進行向量搜尋。
- `memory_store`：儲存事實、偏好、決策或實體（拒絕看似
  提示詞注入酬載的文字；略過近乎重複的儲存項目）。
- `memory_forget`：依 `memoryId` 或 `query` 刪除（若單一
  相符項目的分數超過 90%，便自動刪除；否則列出候選 ID 以釐清目標）。

## 儲存空間

LanceDB 資料預設位於 `~/.openclaw/memory/lancedb`。可使用 `dbPath` 覆寫：

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

此外掛會保留一個 LanceDB 資料表，並在每個
資料列中儲存正規化的代理擁有者。這是儲存邊界，而非搜尋後篩選：代理擁有權會在
向量排名前套用，並納入列出、查詢、計數及刪除
述詞中。`ltm query --filter` 可對
公開輸出欄接受一項經驗證的比較。儲存區會將該比較與
必要的擁有者述詞分開建立，因此篩選條件無法將查詢範圍擴大至其他
代理。

在導入各代理擁有權之前建立的資料庫，沒有可靠的資料列來源資訊。
升級時，`openclaw doctor --fix` 會一次性地將這些舊版資料列指派給
已設定的預設代理。在該遷移完成前，執行階段存取會採取失敗即關閉策略；
其他代理永遠不會繼承舊有的共用資料列。

`storageOptions` 接受用於 LanceDB 儲存後端（例如 S3 相容物件儲存空間）的字串鍵值配對，並支援 `${ENV_VAR}` 展開：

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## 執行階段相依套件與平台支援

`memory-lancedb` 相依於原生 `@lancedb/lancedb` 套件，該套件由外掛套件擁有（不屬於 OpenClaw 核心發行版）。閘道啟動時不會修復外掛相依套件；如果原生相依套件遺失或載入失敗，請重新安裝或更新外掛套件，然後重新啟動閘道。

`@lancedb/lancedb` 未針對 `darwin-x64`（Intel Mac）發布原生組建。在該平台上，外掛會在載入時記錄 LanceDB 無法使用；請使用預設記憶後端、在支援的平台／架構上執行閘道，或停用 `memory-lancedb`。

## 疑難排解

### 輸入長度超過內容長度

嵌入模型拒絕了回憶查詢：

```text
memory-lancedb: 回憶失敗：錯誤：400 輸入長度超過內容長度
```

降低 `recallMaxChars`，然後重新啟動閘道：

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

若使用 Ollama，也請使用其原生嵌入端點，確認閘道主機可連線至嵌入伺服器：

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不支援的嵌入模型

若未設定 `embedding.dimensions`，系統只知道內建 OpenAI 嵌入模型的維度（`text-embedding-3-small`、`text-embedding-3-large`）。對於任何其他模型，請將 `embedding.dimensions` 設為該模型回報的向量大小。

### 外掛已載入，但未顯示任何記憶

確認 `plugins.slots.memory` 指向 `memory-lancedb`，然後執行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

如果 `autoCapture` 已停用，外掛仍會回憶現有記憶，但不會自動儲存新記憶。請使用 `memory_store` 工具，或啟用 `autoCapture`。

## 相關內容

- [記憶概覽](/zh-TW/concepts/memory)
- [主動記憶](/zh-TW/concepts/active-memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [記憶 Wiki](/zh-TW/plugins/memory-wiki)
- [Ollama](/zh-TW/providers/ollama)
