---
read_when:
    - 你正在設定 memory-lancedb 外掛
    - 你想要由 LanceDB 支援、具備自動回想或自動擷取功能的長期記憶
    - 你正在使用本機的 OpenAI 相容嵌入模型，例如 Ollama
sidebarTitle: Memory LanceDB
summary: 設定官方外部 LanceDB 記憶外掛，包括本機 Ollama 相容的嵌入模型
title: 記憶 LanceDB
x-i18n:
    generated_at: "2026-07-16T11:49:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 786b511da4fbfd90f4c3e5be5a1aeddf5daa59036247552bd671f4bab89319f6
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` 是官方外部外掛，使用 LanceDB 搭配向量搜尋儲存長期記憶。它可以在模型開始一輪互動前自動回想相關記憶，並在回應後自動擷取重要事實。

適用於本機向量資料庫、與 OpenAI 相容的嵌入端點，或預設內建記憶後端以外的記憶儲存區。

## 安裝

```bash
openclaw plugins install @openclaw/memory-lancedb
```

此外掛已發布至 npm；未隨附於 OpenClaw 執行階段映像中。安裝時會寫入外掛項目、啟用外掛，並將 `plugins.slots.memory` 切換為 `memory-lancedb`。如果目前由另一個外掛占用記憶插槽，該外掛會停用並顯示警告。

<Note>
`memory-wiki` 等配套外掛可以與 `memory-lancedb` 同時執行，但同一時間只能有一個外掛占用作用中的記憶插槽。
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

變更外掛設定後重新啟動閘道，然後確認外掛已載入：

```bash
openclaw gateway restart
openclaw plugins list
```

## 嵌入設定

`embedding` 為必填，且必須包含至少一個欄位。`provider` 預設為 `openai`；`model` 預設為 `text-embedding-3-small`。

| 欄位                  | 類型          | 說明                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | 字串        | 介接器 ID，例如 `openai`、`github-copilot`、`ollama`。預設為 `openai`。 |
| `embedding.model`      | 字串        | 預設為 `text-embedding-3-small`。                                        |
| `embedding.apiKey`     | 字串        | 選填；支援 `${ENV_VAR}` 展開。                               |
| `embedding.baseUrl`    | 字串        | 選填；支援 `${ENV_VAR}` 展開。                               |
| `embedding.dimensions` | 整數 (>=1) | 不在內建表格中的模型必填（見下文）。               |

有兩種請求路徑：

- **供應商介接器路徑**（預設）：設定 `embedding.provider`，並省略
  `embedding.apiKey`/`embedding.baseUrl`。此外掛會透過 `memory-core` 使用的相同記憶嵌入介接器，解析供應商已設定的驗證設定檔、環境變數或
  `models.providers.<provider>.apiKey`。此路徑適用於 `github-copilot`、`ollama`，以及任何其他支援嵌入的隨附供應商。
- **直接使用與 OpenAI 相容的用戶端路徑**：不設定 `embedding.provider`
  （或設為 `"openai"`），並設定 `embedding.apiKey` 與 `embedding.baseUrl`。此路徑適用於沒有隨附供應商介接器的原始 OpenAI 相容嵌入端點。

OpenAI Codex / ChatGPT OAuth 並非 OpenAI Platform 的嵌入認證資訊。
若要使用 OpenAI 嵌入，請使用 OpenAI API 金鑰驗證設定檔、`OPENAI_API_KEY` 或
`models.providers.openai.apiKey`。僅使用 OAuth 的使用者應選擇其他支援嵌入的供應商，例如 `github-copilot` 或 `ollama`。

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

部分與 OpenAI 相容的嵌入端點會拒絕 `encoding_format`
參數；其他端點則會忽略該參數，並一律傳回 `number[]`。`memory-lancedb`
會在請求中省略 `encoding_format`，並接受浮點數陣列或以 base64 編碼的 float32 回應，因此兩種回應格式皆無須設定即可運作。

### 維度

OpenClaw 僅為 `text-embedding-3-small` (1536) 與
`text-embedding-3-large` (3072) 內建維度。任何其他模型都需要明確設定
`embedding.dimensions`，LanceDB 才能建立向量欄，例如
2048 維的 ZhiPu `embedding-3`：

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

使用隨附的 Ollama 供應商介接器路徑（`embedding.provider: "ollama"`）。
它會呼叫 Ollama 的原生 `/api/embed` 端點，並遵循與 [Ollama](/zh-TW/providers/ollama) 供應商相同的驗證與基底 URL 規則。

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
`dimensions` 為必填。若使用小型本機嵌入模型，而本機伺服器傳回上下文長度錯誤，請降低 `recallMaxChars`。

## 回想與擷取限制

| 設定           | 預設值 | 範圍                        | 適用範圍                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | 傳送至嵌入 API 以供回想的文字。                 |
| `captureMaxChars` | `500`   | 100-10000                    | 符合自動擷取資格的訊息長度。                  |
| `customTriggers`  | `[]`    | 0-50 個項目，每個 <=100 個字元 | 使自動擷取考慮某則訊息的字面詞組。 |

`recallMaxChars` 會限制 `before_prompt_build` 自動回想查詢、`memory_recall` 工具、`memory_forget` 查詢路徑與 `openclaw ltm
search`。自動回想會嵌入該輪互動中最新的使用者訊息，只有在沒有使用者訊息時才改用完整提示，避免將頻道中繼資料與大型提示區塊納入嵌入請求。

`captureMaxChars` 會判斷該輪 `agent_end` 事件中的使用者訊息是否夠短，可供自動擷取考量；不影響回想查詢。

`customTriggers` 會新增不使用規則運算式的字面自動擷取詞組。內建觸發詞涵蓋常見的英文、捷克文、中文、日文與韓文記憶詞組（`remember`、`prefer`、`记住`、`覚えて`、`기억해` 等）。

自動擷取也會拒絕看似信封／傳輸中繼資料、提示注入酬載或已注入 `<relevant-memories>` 上下文的文字，且每一輪代理互動最多擷取 3 筆記憶。

每筆記憶都由一個代理擁有。回想、重複偵測、擷取、列出、原始查詢與刪除，都會先強制檢查該擁有者，再傳回或修改資料列。在 `agents.list[]` 中或透過 `agents.defaults` 設有 `memorySearch.enabled: false` 的代理，也不會取得 `memory_recall`、`memory_store` 或 `memory_forget` 工具，而且即使外掛層級的 `autoRecall`/`autoCapture` 旗標已開啟，也不會參與自動回想或擷取。

## 命令

只要已安裝 `memory-lancedb`，它便會註冊 `ltm` 命令列介面命名空間（不僅限於占用作用中記憶插槽時）：

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

| 旗標                              | 預設值                                 | 說明                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | 已設定的預設代理                | 選取私有代理命名空間。可用於 `list`、`search`、`query` 與 `stats`。                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | 以逗號分隔的欄允許清單。                                                                                                         |
| `--filter <condition>`            | 無                                    | 對輸出欄進行一次比較，例如 `category = 'preference'` 或 `importance >= 0.8`。字串值必須加上引號。             |
| `--limit <n>`                     | `10`                                    | 正整數。                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | 無                                    | 篩選器執行後在記憶體中排序；排序欄會自動加入投影，若未要求輸出該欄，則會從輸出中移除。 |

代理會從作用中的記憶外掛取得三個工具：

- `memory_recall`：對已儲存的記憶進行向量搜尋。
- `memory_store`：儲存事實、偏好、決策或實體（拒絕看似提示注入酬載的文字；略過近似重複的儲存項目）。
- `memory_forget`：依 `memoryId` 或 `query` 刪除（若只有一個相符項目的分數超過 90%，則自動刪除；否則列出候選 ID 以消除歧義）。

## 儲存空間

LanceDB 資料預設儲存於 `~/.openclaw/memory/lancedb`。可使用 `dbPath` 覆寫：

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

此外掛會維護一個 LanceDB 資料表，並在每個資料列中儲存正規化的代理擁有者。這是儲存邊界，而非搜尋後篩選器：在進行向量排名前便會套用代理擁有權，且列出、查詢、計數與刪除的述詞中也會包含代理擁有權。`ltm query --filter` 接受對公開輸出欄位進行一次經驗證的比較。儲存區會將該比較與必要的擁有者述詞分開建構，因此篩選器無法將查詢範圍擴大到其他代理。

在引入個別代理擁有權之前建立的資料庫，沒有可靠的資料列來源資訊。升級時，`openclaw doctor --fix` 會將這些舊版資料列一次性指派給已設定的預設代理。在完成該遷移前，執行階段存取會採取封閉式失敗；其他代理永遠不會繼承舊有的共用資料列。

`storageOptions` 接受 LanceDB 儲存後端（例如與 S3 相容的物件儲存空間）所需的字串鍵值配對，並支援 `${ENV_VAR}` 展開：

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

`memory-lancedb` 相依於原生 `@lancedb/lancedb` 套件，該套件由外掛套件擁有（而非 OpenClaw 核心發行版）。閘道啟動時不會修復外掛相依套件；如果缺少原生相依套件或載入失敗，請重新安裝或更新外掛套件，然後重新啟動閘道。

`@lancedb/lancedb` 未針對 `darwin-x64`（Intel Mac）發布原生版本。在該平台上，外掛會在載入時記錄 LanceDB 無法使用；請使用預設記憶體後端、在受支援的平台／架構上執行閘道，或停用 `memory-lancedb`。

## 疑難排解

### 輸入長度超過脈絡長度

嵌入模型拒絕了回憶查詢：

```text
memory-lancedb: 回憶失敗：錯誤：400 輸入長度超過脈絡長度
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

若使用 Ollama，還要使用其原生嵌入端點，確認可從閘道主機連線至嵌入伺服器：

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不支援的嵌入模型

若未設定 `embedding.dimensions`，系統只知道內建 OpenAI 嵌入模型的維度（`text-embedding-3-small`、`text-embedding-3-large`）。若使用任何其他模型，請將 `embedding.dimensions` 設為該模型回報的向量大小。

### 外掛已載入，但未顯示任何記憶

確認 `plugins.slots.memory` 指向 `memory-lancedb`，然後執行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

如果已停用 `autoCapture`，外掛仍會回憶現有記憶，但不會自動儲存新記憶。請使用 `memory_store` 工具，或啟用 `autoCapture`。

## 相關內容

- [記憶概觀](/zh-TW/concepts/memory)
- [主動記憶](/zh-TW/concepts/active-memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [記憶 Wiki](/zh-TW/plugins/memory-wiki)
- [Ollama](/zh-TW/providers/ollama)
