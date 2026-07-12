---
read_when:
    - 您正在設定 memory-lancedb 外掛
    - 你想要由 LanceDB 支援、具備自動回憶或自動擷取功能的長期記憶
    - 你正在使用本機的 OpenAI 相容嵌入模型，例如 Ollama
sidebarTitle: Memory LanceDB
summary: 設定官方外部 LanceDB 記憶體外掛，包括本機 Ollama 相容的嵌入模型
title: 記憶 LanceDB
x-i18n:
    generated_at: "2026-07-11T21:33:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` 是官方的外部外掛，可將長期記憶儲存在
LanceDB 中，並支援向量搜尋。它可以在模型每輪互動前自動回想相關記憶，
並在回應後自動擷取重要事實。

適合用於本機向量資料庫、相容 OpenAI 的嵌入端點，或
預設內建記憶後端以外的記憶儲存區。

## 安裝

```bash
openclaw plugins install @openclaw/memory-lancedb
```

此外掛已發布至 npm；它未內建於 OpenClaw 執行階段
映像檔中。安裝時會寫入外掛項目、啟用此外掛，並將
`plugins.slots.memory` 切換為 `memory-lancedb`。如果目前有其他外掛占用
記憶插槽，該外掛會停用並顯示警告。

<Note>
`memory-wiki` 等配套外掛可以與 `memory-lancedb` 同時執行，
但同一時間只能有一個外掛占用作用中的記憶插槽。
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

變更外掛設定後重新啟動閘道，接著確認外掛已載入：

```bash
openclaw gateway restart
openclaw plugins list
```

## 嵌入設定

`embedding` 為必填，且必須至少包含一個欄位。`provider`
預設為 `openai`；`model` 預設為 `text-embedding-3-small`。

| 欄位                   | 類型          | 說明                                                                     |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | 字串          | 介面卡 ID，例如 `openai`、`github-copilot`、`ollama`。預設為 `openai`。 |
| `embedding.model`      | 字串          | 預設為 `text-embedding-3-small`。                                        |
| `embedding.apiKey`     | 字串          | 選填；支援展開 `${ENV_VAR}`。                                            |
| `embedding.baseUrl`    | 字串          | 選填；支援展開 `${ENV_VAR}`。                                            |
| `embedding.dimensions` | 整數（>=1）   | 不在內建表格中的模型必須設定（見下文）。                                 |

有兩種請求路徑：

- **提供者介面卡路徑**（預設）：設定 `embedding.provider`，並省略
  `embedding.apiKey`/`embedding.baseUrl`。此外掛會透過 `memory-core`
  使用的相同記憶嵌入介面卡，解析提供者已設定的驗證設定檔、環境變數或
  `models.providers.<provider>.apiKey`。`github-copilot`、`ollama`
  及任何其他支援嵌入的內建提供者皆使用此路徑。
- **直接使用相容 OpenAI 的用戶端路徑**：不設定
  `embedding.provider`（或設為 `"openai"`），並設定 `embedding.apiKey`
  與 `embedding.baseUrl`。此路徑適用於沒有內建提供者介面卡的原始
  相容 OpenAI 嵌入端點。

OpenAI Codex / ChatGPT OAuth 並不是 OpenAI Platform 的嵌入憑證。
若要使用 OpenAI 嵌入，請使用 OpenAI API 金鑰驗證設定檔、`OPENAI_API_KEY`
或 `models.providers.openai.apiKey`。僅使用 OAuth 的使用者應選擇其他
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

部分相容 OpenAI 的嵌入端點會拒絕 `encoding_format`
參數；其他端點則會忽略該參數，並一律傳回 `number[]`。`memory-lancedb`
在請求中省略 `encoding_format`，並接受浮點數陣列或
以 base64 編碼的 float32 回應，因此兩種回應格式皆無須額外設定即可使用。

### 維度

OpenClaw 僅內建 `text-embedding-3-small`（1536）與
`text-embedding-3-large`（3072）的維度。其他模型都必須明確設定
`embedding.dimensions`，LanceDB 才能建立向量欄位。例如
ZhiPu `embedding-3` 使用 2048 維：

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

使用內建的 Ollama 提供者介面卡路徑（`embedding.provider: "ollama"`）。
此路徑會呼叫 Ollama 原生的 `/api/embed` 端點，並遵循與
[Ollama](/zh-TW/providers/ollama) 提供者相同的驗證與基礎 URL 規則。

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

`mxbai-embed-large` 不在內建維度表格中，因此必須設定 `dimensions`。
若使用小型本機嵌入模型，且本機伺服器傳回內容長度錯誤，請降低
`recallMaxChars`。

## 回想與擷取限制

| 設定              | 預設值  | 範圍                         | 適用範圍                                                   |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | 傳送至嵌入 API 以進行回想的文字。                          |
| `captureMaxChars` | `500`   | 100-10000                    | 符合自動擷取資格的訊息長度。                               |
| `customTriggers`  | `[]`    | 0-50 個項目，每項 <=100 字元 | 讓自動擷取考慮某則訊息的常值詞句。                         |

`recallMaxChars` 會限制 `before_prompt_build` 自動回想查詢、
`memory_recall` 工具、`memory_forget` 查詢路徑及 `openclaw ltm
search`。自動回想會嵌入該輪互動中最新的使用者訊息，只有在沒有使用者訊息時
才會改用完整提示詞，避免將頻道中繼資料與大型提示詞區塊納入嵌入請求。

`captureMaxChars` 用於判斷該輪互動的 `agent_end`
事件中，使用者訊息是否足夠短而可考慮自動擷取；它不會影響
回想查詢。

`customTriggers` 可加入不使用規則運算式的常值自動擷取詞句。內建
觸發詞涵蓋常見的英文、捷克文、中文、日文及韓文記憶詞句
（`remember`、`prefer`、`记住`、`覚えて`、`기억해` 及類似詞句）。

自動擷取也會拒絕看似封裝／傳輸中繼資料、提示詞注入酬載或
已注入 `<relevant-memories>` 內容的文字，且每輪代理程式互動最多
擷取 3 筆記憶。

## 命令

只要已安裝 `memory-lancedb`，它就會註冊 `ltm` 命令列介面命名空間
（不限於它占用作用中記憶插槽時）：

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` 會直接對 LanceDB 資料表執行非向量查詢：

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| 旗標                              | 預設值                                  | 說明                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | 以逗號分隔的欄位允許清單。                                                                                                               |
| `--filter <condition>`            | 無                                      | SQL 風格的 WHERE 子句。最多 200 個字元；僅允許英數字元、`_-`、空白及 `='"<>!.,()%*`。                                                     |
| `--limit <n>`                     | `10`                                    | 正整數。                                                                                                                                 |
| `--order-by <column>:<asc\|desc>` | 無                                      | 篩選完成後在記憶體中排序；排序欄位會自動加入投影，如果未要求該欄位，則會從輸出中移除。                                                    |

代理程式會從作用中的記憶外掛取得三個工具：

- `memory_recall`：對已儲存的記憶進行向量搜尋。
- `memory_store`：儲存事實、偏好、決策或實體（拒絕看似提示詞注入酬載的
  文字；略過近似重複的儲存內容）。
- `memory_forget`：依 `memoryId` 或 `query` 刪除（分數超過 90% 且只有
  一筆符合項目時自動刪除，否則列出候選 ID 以釐清目標）。

## 儲存空間

LanceDB 資料預設儲存在 `~/.openclaw/memory/lancedb`。可使用 `dbPath` 覆寫：

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

`storageOptions` 接受 LanceDB 儲存後端的字串鍵／值組
（例如相容 S3 的物件儲存空間），並支援展開 `${ENV_VAR}`：

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

`memory-lancedb` 相依於原生 `@lancedb/lancedb` 套件，該套件由
外掛套件負責管理（不屬於 OpenClaw 核心發行版）。閘道啟動時不會修復
外掛相依套件；如果缺少原生相依套件或載入失敗，請重新安裝或更新
外掛套件，並重新啟動閘道。

`@lancedb/lancedb` 未提供適用於 `darwin-x64`（Intel
Mac）的原生建置版本。在該平台上，外掛載入時會記錄 LanceDB 不可用；
請使用預設記憶後端、在受支援的平台／架構上執行閘道，或停用
`memory-lancedb`。

## 疑難排解

### 輸入長度超過內容長度

嵌入模型拒絕了回想查詢：

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
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

使用 Ollama 時，也請透過其原生嵌入端點，確認閘道
主機可以連線至嵌入伺服器：

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不支援的嵌入模型

若未設定 `embedding.dimensions`，系統只知道內建 OpenAI 嵌入模型的維度
（`text-embedding-3-small`、`text-embedding-3-large`）。使用任何其他
模型時，請將 `embedding.dimensions` 設為該模型回報的向量大小。

### 外掛已載入，但未顯示任何記憶

確認 `plugins.slots.memory` 指向 `memory-lancedb`，然後執行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

如果已停用 `autoCapture`，此外掛仍會喚回現有記憶，但不會自動儲存新記憶。請使用 `memory_store` 工具，或啟用 `autoCapture`。

## 相關內容

- [記憶概覽](/zh-TW/concepts/memory)
- [主動記憶](/zh-TW/concepts/active-memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [記憶 Wiki](/zh-TW/plugins/memory-wiki)
- [Ollama](/zh-TW/providers/ollama)
