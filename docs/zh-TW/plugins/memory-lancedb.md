---
read_when:
    - 你正在設定 memory-lancedb 外掛
    - 你想要使用 LanceDB 支援、具備自動回想或自動擷取功能的長期記憶體
    - 你正在使用與 OpenAI 相容的本機嵌入模型，例如 Ollama
sidebarTitle: Memory LanceDB
summary: 設定官方外部 LanceDB 記憶體外掛，包括本機與 Ollama 相容的嵌入模型
title: 記憶 LanceDB
x-i18n:
    generated_at: "2026-07-22T10:39:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bdb7208925ac6c76430ee36dfcd9733041530e0f2ee175950b3cdb8010d67b24
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` 是官方外部外掛，會將長期記憶儲存在
LanceDB 中，並支援向量搜尋。它可在模型輪次前自動召回相關記憶，
並在回應後自動擷取重要事實。

可將它用於本機向量資料庫、OpenAI 相容的嵌入端點，或
預設內建記憶後端以外的記憶儲存區。

## 安裝

```bash
openclaw plugins install @openclaw/memory-lancedb
```

此外掛已發布至 npm；不會內建於 OpenClaw 執行階段
映像中。安裝時會寫入外掛項目、啟用此外掛，並將
`plugins.slots.memory` 切換為 `memory-lancedb`。如果目前由其他外掛占用
記憶插槽，該外掛會停用並顯示警告。

<Note>
`memory-wiki` 等配套外掛可與 `memory-lancedb` 同時執行，
但同一時間只能有一個外掛占用作用中的記憶插槽。
</Note>

<Note>
LanceDB 的 `memory_recall` 不會收到 `memory.search.rememberAcrossConversations`
所使用、受保護的私人逐字記錄授權。請透過
[進階主動記憶](/zh-TW/concepts/active-memory#lancedb-memory)使用 LanceDB 的
`autoRecall` 或其 `memory_recall` 工具。
當目前的記憶提供者無法使用「跨對話記住」時，
`openclaw doctor` 會回報此情況。
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

變更外掛設定後，請重新啟動閘道，然後確認外掛已載入：

```bash
openclaw gateway restart
openclaw plugins list
```

## 嵌入設定

`embedding` 為必填，且必須至少包含一個欄位。`provider`
預設為 `openai`；`model` 預設為 `text-embedding-3-small`。

| 欄位                   | 類型           | 備註                                                                     |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | 字串          | 轉接器 ID，例如 `openai`、`github-copilot`、`ollama`。預設為 `openai`。 |
| `embedding.model`      | 字串          | 預設為 `text-embedding-3-small`。                                        |
| `embedding.apiKey`     | 字串          | 選用；支援 `${ENV_VAR}` 展開。                               |
| `embedding.baseUrl`    | 字串          | 選用；支援 `${ENV_VAR}` 展開。                               |
| `embedding.dimensions` | 整數 (>=1) | 內建表格中未列出的模型必須設定（請參閱下文）。               |

共有兩種請求路徑：

- **提供者轉接器路徑**（預設）：設定 `embedding.provider` 並省略
  `embedding.apiKey`/`embedding.baseUrl`。此外掛會透過 `memory-core`
  使用的相同記憶嵌入轉接器，解析提供者已設定的驗證設定檔、
  環境變數或 `models.providers.<provider>.apiKey`。此路徑適用於 `github-copilot`、`ollama`
  及任何其他內建且支援嵌入的提供者。
- **直接 OpenAI 相容用戶端路徑**：讓 `embedding.provider` 保持未設定
  （或設為 `"openai"`），並設定 `embedding.apiKey` 與 `embedding.baseUrl`。此路徑
  適用於沒有內建提供者轉接器的原始 OpenAI 相容嵌入端點。

OpenAI Codex / ChatGPT OAuth 並非 OpenAI Platform 嵌入的認證資訊。
若要使用 OpenAI 嵌入，請使用 OpenAI API 金鑰驗證設定檔、`OPENAI_API_KEY` 或
`models.providers.openai.apiKey`。僅使用 OAuth 的使用者應選擇其他
支援嵌入的提供者，例如 `github-copilot` 或 `ollama`。

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

有些 OpenAI 相容的嵌入端點會拒絕 `encoding_format`
參數；其他端點則會忽略它，並一律傳回 `number[]`。`memory-lancedb`
會在請求中省略 `encoding_format`，且同時接受浮點數陣列或
Base64 編碼的 float32 回應，因此兩種回應格式都不需額外設定即可使用。

### 維度

OpenClaw 只內建 `text-embedding-3-small`（1536）和
`text-embedding-3-large`（3072）的維度。其他模型都需要明確設定
`embedding.dimensions`，LanceDB 才能建立向量欄位，例如
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

請使用內建的 Ollama 提供者轉接器路徑（`embedding.provider: "ollama"`）。
它會呼叫 Ollama 的原生 `/api/embed` 端點，並遵循與
[Ollama](/zh-TW/providers/ollama) 提供者相同的驗證與基底 URL 規則。

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

`mxbai-embed-large` 不在內建維度表中，因此必須設定 `dimensions`。
若使用小型本機嵌入模型，且本機伺服器傳回內容長度錯誤，請降低
`recallMaxChars`。

## 召回與擷取限制

| 設定              | 預設值 | 範圍                         | 適用範圍                                                   |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | 召回時傳送至嵌入 API 的文字。                 |
| `captureMaxChars` | `500`   | 100-10000                    | 符合自動擷取資格的訊息長度。                  |
| `customTriggers`  | `[]`    | 0-50 個項目，每個 <=100 個字元 | 使自動擷取考慮某則訊息的常值詞組。 |

`recallMaxChars` 會限制 `before_prompt_build` 自動召回查詢、
`memory_recall` 工具、`memory_forget` 查詢路徑及 `openclaw ltm
search`。自動召回會嵌入該輪次最新的使用者訊息，只有在沒有使用者訊息時
才會改用完整提示詞，以免將頻道中繼資料和大型提示詞區塊納入嵌入請求。

`captureMaxChars` 會判斷該輪次 `agent_end`
事件中的使用者訊息是否夠短，可納入自動擷取考量；它不影響
召回查詢。

`customTriggers` 會新增不含規則運算式的自動擷取常值詞組。內建
觸發條件涵蓋常見的英文、捷克文、中文、日文及韓文記憶
詞組（`remember`、`prefer`、`记住`、`覚えて`、`기억해` 等）。

自動擷取也會拒絕看似信封／傳輸中繼資料、
提示詞注入承載內容或已注入的 `<relevant-memories>` 上下文之文字，
且每個代理程式輪次最多擷取 3 筆記憶。

每筆記憶皆由一個代理程式擁有。召回、重複偵測、擷取、
列出、原始查詢及刪除，都會在傳回或修改資料列之前強制檢查該擁有者。
若代理程式的 `agents.entries.*` 項目中有 `memory.search.enabled: false`，
或繼承了已停用的頂層搜尋設定，也不會取得任何 `memory_recall`、`memory_store`
或 `memory_forget` 工具，且不會參與自動召回或
擷取，即使外掛層級的 `autoRecall`/`autoCapture` 旗標已開啟亦然。

## 命令

安裝 `memory-lancedb` 後，一律會註冊 `ltm` 命令列介面命名空間
（不僅限於它占用作用中記憶插槽時）：

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` 會直接對 LanceDB 表格執行非向量查詢：

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| 旗標                              | 預設值                                  | 備註                                                                                                                                      |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | 已設定的預設代理程式                | 選取私人代理程式命名空間。可用於 `list`、`search`、`query` 及 `stats`。                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | 以逗號分隔的欄位允許清單。                                                                                                         |
| `--filter <condition>`            | 無                                    | 對輸出欄位進行一次比較，例如 `category = 'preference'` 或 `importance >= 0.8`。字串值必須加上引號。             |
| `--limit <n>`                     | `10`                                    | 正整數。                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | 無                                    | 篩選完成後在記憶體中排序；排序欄位會自動加入投影，若未要求該欄位，則會從輸出中移除。 |

代理程式會從作用中的記憶外掛取得三項工具：

- `memory_recall`：對已儲存的記憶執行向量搜尋。
- `memory_store`：儲存事實、偏好、決策或實體（會拒絕看似
  提示詞注入承載內容的文字；略過近似重複的儲存項目）。
- `memory_forget`：依 `memoryId` 或 `query` 刪除（若單一
  相符項目的分數高於 90%，則自動刪除；否則列出候選 ID 以釐清）。

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

此外掛會維護一個 LanceDB 表格，並在每個資料列儲存正規化的代理程式擁有者。
這是儲存邊界，而非搜尋後篩選器：代理程式擁有權會在向量排名前
套用，且會納入列出、查詢、計數及刪除的述詞。`ltm query --filter`
可接受一項對公開輸出欄位進行、且已驗證的比較。儲存區會將該比較
與強制的擁有者述詞分開建構，因此篩選器無法將查詢範圍擴大至其他
代理程式。

在導入每個代理程式擁有權之前建立的資料庫，沒有可靠的資料列來源資訊。
升級時，`openclaw doctor --fix` 會將這些舊版資料列一次性指派給
已設定的預設代理程式。在該遷移完成之前，執行階段存取會採取失敗關閉；
其他代理程式絕不會繼承舊有的共用資料列。

`storageOptions` 接受用於 LanceDB 儲存後端（例如相容 S3 的物件儲存空間）的字串鍵值配對，並支援 `${ENV_VAR}` 展開：

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

`memory-lancedb` 依賴由外掛套件擁有的原生 `@lancedb/lancedb` 套件（而非 OpenClaw 核心發行版）。閘道啟動時不會修復外掛相依套件；若原生相依套件遺失或載入失敗，請重新安裝或更新外掛套件，然後重新啟動閘道。

`@lancedb/lancedb` 未針對 `darwin-x64`（Intel Mac）發布原生建置。在該平台上，外掛會在載入時記錄 LanceDB 無法使用；請改用預設記憶後端、在受支援的平台／架構上執行閘道，或停用 `memory-lancedb`。

## 疑難排解

### 輸入長度超過上下文長度

嵌入模型拒絕了回憶查詢：

```text
memory-lancedb: 回憶失敗：錯誤：400 輸入長度超過上下文長度
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

若使用 Ollama，亦請透過其原生嵌入端點，確認閘道主機能夠連線至嵌入伺服器：

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不受支援的嵌入模型

若未設定 `embedding.dimensions`，系統只知道內建 OpenAI 嵌入模型的維度（`text-embedding-3-small`、`text-embedding-3-large`）。對於任何其他模型，請將 `embedding.dimensions` 設為該模型回報的向量大小。

### 外掛已載入但未顯示任何記憶

確認 `plugins.slots.memory` 指向 `memory-lancedb`，然後執行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

若停用 `autoCapture`，外掛仍會回憶現有記憶，但不會自動儲存新記憶。請使用 `memory_store` 工具，或啟用 `autoCapture`。

## 相關內容

- [記憶概覽](/zh-TW/concepts/memory)
- [主動記憶](/zh-TW/concepts/active-memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [記憶 Wiki](/zh-TW/plugins/memory-wiki)
- [Ollama](/zh-TW/providers/ollama)
