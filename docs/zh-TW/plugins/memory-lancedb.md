---
read_when:
    - 你正在設定隨附的 memory-lancedb Plugin
    - 你想要由 LanceDB 支援、具備自動召回或自動擷取功能的長期記憶
    - 你正在使用本機 OpenAI 相容的嵌入，例如 Ollama
sidebarTitle: Memory LanceDB
summary: 設定隨附的 LanceDB 記憶 Plugin，包括本機 Ollama 相容嵌入
title: 記憶 LanceDB
x-i18n:
    generated_at: "2026-04-30T03:24:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` 是內建的記憶體 Plugin，會將長期記憶儲存在
LanceDB，並使用嵌入進行召回。它可以在模型回合前自動召回相關
記憶，並在回應後擷取重要事實。

當你想要用於記憶體的本機向量資料庫、需要
OpenAI 相容的嵌入端點，或想將記憶體資料庫保留在
預設內建記憶體儲存之外時，請使用它。

<Note>
`memory-lancedb` 是 Active Memory Plugin。透過選取記憶體
插槽 `plugins.slots.memory = "memory-lancedb"` 來啟用它。像
`memory-wiki` 這樣的配套 Plugin 可以與它並行，但只有一個 Plugin 會擁有 Active Memory 插槽。
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

變更 Plugin 設定後，重新啟動 Gateway：

```bash
openclaw gateway restart
```

然後確認 Plugin 已載入：

```bash
openclaw plugins list
```

## 由提供者支援的嵌入

`memory-lancedb` 可以使用與 `memory-core` 相同的記憶體嵌入提供者
配接器。設定 `embedding.provider`，並省略 `embedding.apiKey`，即可使用
提供者已設定的驗證設定檔、環境變數，或
`models.providers.<provider>.apiKey`。

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
        },
      },
    },
  },
}
```

此路徑可搭配公開嵌入憑證的提供者驗證設定檔使用。
例如，當 Copilot 設定檔/方案支援嵌入時，可以使用 GitHub Copilot：

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
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth (`openai-codex`) 不是 OpenAI Platform
嵌入憑證。若要使用 OpenAI 嵌入，請使用 OpenAI API 金鑰驗證設定檔、
`OPENAI_API_KEY`，或 `models.providers.openai.apiKey`。僅使用 OAuth 的使用者可以使用
其他具備嵌入能力的提供者，例如 GitHub Copilot 或 Ollama。

## Ollama 嵌入

若要使用 Ollama 嵌入，建議使用內建的 Ollama 嵌入提供者。它會使用
原生 Ollama `/api/embed` 端點，並遵循 [Ollama](/zh-TW/providers/ollama)
中記載的相同驗證/base URL 規則。

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

請為非標準嵌入模型設定 `dimensions`。OpenClaw 已知
`text-embedding-3-small` 和 `text-embedding-3-large` 的維度；自訂
模型需要在設定中提供該值，LanceDB 才能建立向量欄位。

對於小型本機嵌入模型，如果你看到本機伺服器回傳內容
長度錯誤，請降低 `recallMaxChars`。

## OpenAI 相容提供者

某些 OpenAI 相容的嵌入提供者會拒絕 `encoding_format`
參數，而其他提供者會忽略它並一律回傳 `number[]` 向量。
因此，`memory-lancedb` 會在嵌入請求中省略 `encoding_format`，
並接受浮點陣列回應或 base64 編碼的 float32 回應。

如果你有未提供內建提供者配接器的原始 OpenAI 相容嵌入端點，
請省略 `embedding.provider`（或保留為 `openai`），並設定
`embedding.apiKey` 加上 `embedding.baseUrl`。這會保留直接
OpenAI 相容用戶端路徑。

對於模型維度未內建的提供者，請設定 `embedding.dimensions`。
例如，ZhiPu `embedding-3` 使用 `2048` 維度：

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

## 召回與擷取限制

`memory-lancedb` 有兩個獨立的文字限制：

| 設定              | 預設值  | 範圍      | 適用於                                      |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | 送往嵌入 API 以進行召回的文字     |
| `captureMaxChars` | `500`   | 100-10000 | 可被擷取的助理訊息長度 |

`recallMaxChars` 會控制自動召回、`memory_recall` 工具、
`memory_forget` 查詢路徑，以及 `openclaw ltm search`。自動召回會優先使用
該回合最新的使用者訊息，只有在沒有可用的使用者訊息時才會退回到完整提示。
這可避免頻道中繼資料和大型提示區塊進入嵌入請求。

`captureMaxChars` 會控制回應是否足夠短，因而可被考慮
自動擷取。它不會限制召回查詢嵌入。

## 指令

當 `memory-lancedb` 是 Active Memory Plugin 時，它會註冊 `ltm` CLI
命名空間：

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

此 Plugin 也會擴充 `openclaw memory`，加入非向量的 `query` 子指令，
直接針對 LanceDB 表格執行：

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`：逗號分隔的欄位允許清單（預設為 `id`、`text`、`importance`、`category`、`createdAt`）。
- `--filter <condition>`：SQL 風格的 WHERE 子句；上限為 200 個字元，並限制為英數字元、比較運算子、引號、括號，以及少量安全標點符號。
- `--limit <n>`：正整數；預設為 `10`。
- `--order-by <column>:<asc|desc>`：套用於篩選後的記憶體內排序；排序欄位會自動納入投影。

代理程式也會從 Active Memory Plugin 取得 LanceDB 記憶體工具：

- `memory_recall` 用於由 LanceDB 支援的召回
- `memory_store` 用於儲存重要事實、偏好、決策和實體
- `memory_forget` 用於移除相符的記憶

## 儲存

預設情況下，LanceDB 資料位於 `~/.openclaw/memory/lancedb`。使用
`dbPath` 覆寫路徑：

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

`storageOptions` 接受 LanceDB 儲存後端的字串鍵/值配對，並
支援 `${ENV_VAR}` 展開：

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

## 執行階段依賴項

`memory-lancedb` 依賴原生 `@lancedb/lancedb` 套件。封裝的
OpenClaw 安裝會先嘗試使用內建執行階段依賴項；當內建匯入不可用時，
可以在 OpenClaw 狀態下修復 Plugin 執行階段依賴項。

如果較舊的安裝在 Plugin 載入期間記錄缺少 `dist/package.json` 或缺少
`@lancedb/lancedb` 錯誤，請升級 OpenClaw 並重新啟動
Gateway。

如果 Plugin 記錄 LanceDB 在 `darwin-x64` 上不可用，請在該機器上使用預設
記憶體後端、將 Gateway 移至受支援的平台，或
停用 `memory-lancedb`。

## 疑難排解

### 輸入長度超過內容長度

這通常表示嵌入模型拒絕了召回查詢：

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

設定較低的 `recallMaxChars`，然後重新啟動 Gateway：

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

對於 Ollama，也請確認嵌入伺服器可從 Gateway 主機存取：

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不支援的嵌入模型

若未設定 `dimensions`，只會知道內建的 OpenAI 嵌入維度。
對於本機或自訂嵌入模型，請將 `embedding.dimensions` 設定為該模型
回報的向量大小。

### Plugin 已載入但沒有出現任何記憶

確認 `plugins.slots.memory` 指向 `memory-lancedb`，然後執行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

如果停用 `autoCapture`，Plugin 會召回現有記憶，但不會
自動儲存新的記憶。如果你想要自動擷取，請使用 `memory_store` 工具或啟用
`autoCapture`。

## 相關

- [記憶體概觀](/zh-TW/concepts/memory)
- [Active Memory](/zh-TW/concepts/active-memory)
- [記憶體搜尋](/zh-TW/concepts/memory-search)
- [Memory Wiki](/zh-TW/plugins/memory-wiki)
- [Ollama](/zh-TW/providers/ollama)
