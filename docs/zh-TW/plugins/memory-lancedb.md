---
read_when:
    - 您正在設定 memory-lancedb 外掛
    - 你想要由 LanceDB 支援、具備自動回想或自動擷取的長期記憶
    - 您正在使用本機 OpenAI 相容嵌入，例如 Ollama
sidebarTitle: Memory LanceDB
summary: 設定官方外部 LanceDB 記憶外掛，包括本機 Ollama 相容嵌入
title: 記憶 LanceDB
x-i18n:
    generated_at: "2026-07-05T11:31:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` 是官方外部外掛，會將長期記憶儲存在
LanceDB 中並提供向量搜尋。它可以在模型回合前自動召回相關記憶，
並在回應後自動擷取重要事實。

可將它用於本機向量資料庫、OpenAI 相容的嵌入端點，或
預設內建記憶後端以外的記憶儲存。

## 安裝

```bash
openclaw plugins install @openclaw/memory-lancedb
```

此外掛發布到 npm；它未被打包進 OpenClaw 執行階段
映像。安裝它會寫入外掛項目、啟用外掛，並將
`plugins.slots.memory` 切換為 `memory-lancedb`。如果目前有另一個外掛
擁有記憶槽，該外掛會在警告後被停用。

<Note>
`memory-wiki` 等搭配外掛可以與 `memory-lancedb` 並行執行，
但同一時間只有一個外掛擁有主動記憶槽。
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

變更外掛設定後重新啟動閘道，然後確認它已載入：

```bash
openclaw gateway restart
openclaw plugins list
```

## 嵌入設定

`embedding` 是必要項目，且必須至少包含一個欄位。`provider`
預設為 `openai`；`model` 預設為 `text-embedding-3-small`。

| 欄位                   | 類型          | 備註                                                                     |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | string        | 轉接器 ID，例如 `openai`、`github-copilot`、`ollama`。預設 `openai`。 |
| `embedding.model`      | string        | 預設 `text-embedding-3-small`。                                        |
| `embedding.apiKey`     | string        | 選用；支援 `${ENV_VAR}` 展開。                               |
| `embedding.baseUrl`    | string        | 選用；支援 `${ENV_VAR}` 展開。                               |
| `embedding.dimensions` | integer (>=1) | 不在內建表格中的模型需要此項目（見下文）。               |

存在兩種請求路徑：

- **提供者轉接器路徑**（預設）：設定 `embedding.provider` 並省略
  `embedding.apiKey`/`embedding.baseUrl`。此外掛會透過 `memory-core`
  使用的相同記憶嵌入轉接器，解析該提供者已設定的
  驗證設定檔、環境變數，或 `models.providers.<provider>.apiKey`。
  這是 `github-copilot`、`ollama`，以及任何其他具備嵌入支援的
  內建提供者所使用的路徑。
- **直接 OpenAI 相容用戶端路徑**：不設定 `embedding.provider`
  （或設為 `"openai"`），並設定 `embedding.apiKey` 加上 `embedding.baseUrl`。
  將此用於沒有內建提供者轉接器的原始 OpenAI 相容嵌入端點。

OpenAI Codex / ChatGPT OAuth 不是 OpenAI Platform 嵌入憑證。
若要使用 OpenAI 嵌入，請使用 OpenAI API 金鑰驗證設定檔、
`OPENAI_API_KEY`，或 `models.providers.openai.apiKey`。僅使用 OAuth 的使用者應選擇另一個
具備嵌入能力的提供者，例如 `github-copilot` 或 `ollama`。

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

某些 OpenAI 相容嵌入端點會拒絕 `encoding_format`
參數；其他端點會忽略它並一律回傳 `number[]`。`memory-lancedb`
會在請求中省略 `encoding_format`，並接受浮點陣列或
base64 編碼的 float32 回應，因此兩種回應形狀都能在無需設定的情況下運作。

### 維度

OpenClaw 只內建 `text-embedding-3-small`（1536）和
`text-embedding-3-large`（3072）的維度。任何其他模型都需要明確設定
`embedding.dimensions`，讓 LanceDB 可以建立向量欄位，例如
2048 維的智譜 `embedding-3`：

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

使用內建 Ollama 提供者轉接器路徑（`embedding.provider: "ollama"`）。
它會呼叫 Ollama 原生 `/api/embed` 端點，並遵循與
[Ollama](/zh-TW/providers/ollama) 提供者相同的驗證/base URL 規則。

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

`mxbai-embed-large` 不在內建維度表中，因此需要 `dimensions`。
對於小型本機嵌入模型，如果本機伺服器回傳上下文長度錯誤，
請降低 `recallMaxChars`。

## 召回與擷取限制

| 設定              | 預設值 | 範圍                         | 適用於                                                     |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | 傳送到嵌入 API 用於召回的文字。                 |
| `captureMaxChars` | `500`   | 100-10000                    | 符合自動擷取資格的訊息長度。                  |
| `customTriggers`  | `[]`    | 0-50 個項目，每個 <=100 字元 | 讓自動擷取考慮某則訊息的字面片語。 |

`recallMaxChars` 會限制 `before_prompt_build` 自動召回查詢、
`memory_recall` 工具、`memory_forget` 查詢路徑，以及 `openclaw ltm
search`。自動召回會嵌入該回合中最新的使用者訊息，只有在沒有使用者訊息時
才會退回使用完整提示，避免將通道中繼資料和大型提示區塊放入嵌入請求。

`captureMaxChars` 會控管該回合 `agent_end`
事件中的使用者訊息是否足夠短，能被納入自動擷取考量；它不會影響
召回查詢。

`customTriggers` 會加入不含 regex 的字面自動擷取片語。內建
觸發詞涵蓋常見的英文、捷克文、中文、日文和韓文記憶
片語（`remember`、`prefer`、`记住`、`覚えて`、`기억해`，以及類似片語）。

自動擷取也會拒絕看起來像封套/傳輸中繼資料、
提示注入 payload，或已注入的 `<relevant-memories>` 上下文的文字，
並將每個代理回合擷取的記憶上限設為 3 筆。

## 命令

只要安裝了 `memory-lancedb`，它就會註冊 `ltm` 命令列介面命名空間
（不只是當它擁有主動記憶槽時）：

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` 會直接對 LanceDB 表格執行非向量查詢：

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| 旗標                              | 預設值                                  | 備註                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | 以逗號分隔的欄位允許清單。                                                                                                         |
| `--filter <condition>`            | 無                                      | SQL 風格 WHERE 子句。最多 200 個字元；只允許英數字元、`_-`、空白，以及 `='"<>!.,()%*`。                              |
| `--limit <n>`                     | `10`                                    | 正整數。                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | 無                                      | 篩選執行後在記憶體中排序；排序欄位會自動加入投影，若未被要求輸出則會從輸出中移除。 |

代理會從主動記憶外掛取得三個工具：

- `memory_recall`：對已儲存的記憶進行向量搜尋。
- `memory_store`：儲存事實、偏好、決策或實體（拒絕看起來像提示注入 payload 的文字；略過近似重複的儲存）。
- `memory_forget`：依 `memoryId` 刪除，或依 `query` 刪除（自動刪除一個
  分數高於 90% 的相符項目，否則列出候選 ID 以便釐清）。

## 儲存空間

LanceDB 資料預設為 `~/.openclaw/memory/lancedb`。可用 `dbPath` 覆寫：

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

`storageOptions` 接受 LanceDB 儲存後端（例如 S3 相容物件儲存）
的字串鍵/值配對，並支援 `${ENV_VAR}` 展開：

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

## 執行階段相依性與平台支援

`memory-lancedb` 依賴原生 `@lancedb/lancedb` 套件，該套件由
外掛套件擁有（不是 OpenClaw 核心 dist）。閘道啟動時不會修復
外掛相依性；如果缺少原生相依性或載入失敗，
請重新安裝或更新外掛套件並重新啟動閘道。

`@lancedb/lancedb` 不發布 `darwin-x64`（Intel
Mac）的原生建置。在該平台上，外掛會在載入時記錄 LanceDB 不可用；
請使用預設記憶後端、在受支援的平台/架構上執行閘道，
或停用 `memory-lancedb`。

## 疑難排解

### 輸入長度超過上下文長度

嵌入模型拒絕了召回查詢：

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

對於 Ollama，也請使用其原生嵌入端點，確認閘道
主機可連到嵌入伺服器：

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不支援的嵌入模型

若沒有 `embedding.dimensions`，只會知道內建 OpenAI 嵌入維度
（`text-embedding-3-small`、`text-embedding-3-large`）。對於任何其他
模型，請將 `embedding.dimensions` 設為該模型回報的向量大小。

### 外掛已載入但沒有出現記憶

確認 `plugins.slots.memory` 指向 `memory-lancedb`，然後執行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

如果 `autoCapture` 已停用，此外掛仍會回想既有記憶，但
不會自動儲存新的記憶。請使用 `memory_store` 工具，或啟用
`autoCapture`。

## 相關

- [記憶概覽](/zh-TW/concepts/memory)
- [主動記憶](/zh-TW/concepts/active-memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [記憶 Wiki](/zh-TW/plugins/memory-wiki)
- [Ollama](/zh-TW/providers/ollama)
