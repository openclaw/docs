---
read_when:
    - 您正在設定隨附的 memory-lancedb Plugin
    - 你想要由 LanceDB 支援、具備自動召回或自動擷取功能的長期記憶
    - 您正在使用本機 OpenAI 相容嵌入模型，例如 Ollama
sidebarTitle: Memory LanceDB
summary: 設定隨附的 LanceDB 記憶 Plugin，包括本機 Ollama 相容嵌入
title: 記憶 LanceDB
x-i18n:
    generated_at: "2026-05-02T02:56:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 671daa20e4f070f9beb0187ff76db9368297b3bc78873ebf3f09ac7ccffa00a2
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` 是內建的記憶體 Plugin，會將長期記憶儲存在
LanceDB，並使用嵌入向量進行回憶。它可以在模型回合前自動回憶相關
記憶，並在回應後擷取重要事實。

當你想要用於記憶的本機向量資料庫、需要 OpenAI 相容的嵌入端點，或想要將記憶資料庫保留在
預設內建記憶儲存區之外時，請使用它。

<Note>
`memory-lancedb` 是 Active Memory Plugin。請透過選取記憶
插槽並設定 `plugins.slots.memory = "memory-lancedb"` 來啟用它。像是
`memory-wiki` 這類搭配使用的 Plugin 可以與它並行，但只有一個 Plugin 擁有 Active Memory 插槽。
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

接著確認 Plugin 已載入：

```bash
openclaw plugins list
```

## Provider 支援的嵌入向量

`memory-lancedb` 可以使用與 `memory-core` 相同的記憶嵌入 Provider 轉接器。
設定 `embedding.provider` 並省略 `embedding.apiKey`，即可使用
Provider 已設定的驗證設定檔、環境變數，或
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

此路徑可搭配公開嵌入認證的 Provider 驗證設定檔使用。
例如，當 Copilot 設定檔/方案支援嵌入向量時，可以使用 GitHub Copilot：

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
嵌入向量認證。若要使用 OpenAI 嵌入向量，請使用 OpenAI API key 驗證設定檔、
`OPENAI_API_KEY`，或 `models.providers.openai.apiKey`。僅使用 OAuth 的使用者可以使用
其他具備嵌入能力的 Provider，例如 GitHub Copilot 或 Ollama。

## Ollama 嵌入向量

若要使用 Ollama 嵌入向量，請優先使用內建的 Ollama 嵌入 Provider。它使用
原生 Ollama `/api/embed` 端點，並遵循 [Ollama](/zh-TW/providers/ollama) 中記錄的
相同驗證/Base URL 規則。

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
`text-embedding-3-small` 和 `text-embedding-3-large` 的
維度；自訂模型需要在設定中提供該值，讓 LanceDB 可以建立向量欄位。

對於較小的本機嵌入模型，如果你看到來自本機伺服器的內容長度錯誤，
請降低 `recallMaxChars`。

## OpenAI 相容 Provider

有些 OpenAI 相容嵌入 Provider 會拒絕 `encoding_format`
參數，而其他 Provider 會忽略它並一律回傳 `number[]` 向量。
因此，`memory-lancedb` 在嵌入請求中會省略 `encoding_format`，
並接受浮點數陣列回應或 base64 編碼的 float32 回應。

如果你有未內建 Provider 轉接器的原始 OpenAI 相容嵌入端點，請省略
`embedding.provider`（或保留為 `openai`），並設定 `embedding.apiKey`
加上 `embedding.baseUrl`。這會保留直接的 OpenAI 相容用戶端路徑。

對於模型維度並非內建的 Provider，請設定 `embedding.dimensions`。
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

## 回憶和擷取限制

`memory-lancedb` 有兩個獨立的文字限制：

| 設定              | 預設值  | 範圍      | 套用至                                        |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | 傳送至嵌入 API 用於回憶的文字                |
| `captureMaxChars` | `500`   | 100-10000 | 可納入擷取的助理訊息長度                    |

`recallMaxChars` 控制自動回憶、`memory_recall` 工具、
`memory_forget` 查詢路徑，以及 `openclaw ltm search`。自動回憶會優先使用該回合最新的
使用者訊息，只有在沒有可用的使用者訊息時才會退回使用完整提示。這會讓頻道中繼資料和大型提示區塊
不會進入嵌入請求。

`captureMaxChars` 控制回應是否短到足以納入自動擷取考量。
它不會限制回憶查詢嵌入。

## 指令

當 `memory-lancedb` 是 Active Memory Plugin 時，它會註冊 `ltm` CLI
命名空間：

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Plugin 也會擴充 `openclaw memory`，加入非向量的 `query` 子指令，
直接對 LanceDB 資料表執行：

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`：逗號分隔的欄位允許清單（預設為 `id`、`text`、`importance`、`category`、`createdAt`）。
- `--filter <condition>`：SQL 風格的 WHERE 子句；上限為 200 個字元，並限制只能使用英數字元、比較運算子、引號、括號，以及少量安全標點符號。
- `--limit <n>`：正整數；預設為 `10`。
- `--order-by <column>:<asc|desc>`：篩選後套用的記憶體內排序；排序欄位會自動包含在投影中。

Agent 也會從 Active Memory Plugin 取得 LanceDB 記憶工具：

- `memory_recall` 用於由 LanceDB 支援的回憶
- `memory_store` 用於儲存重要事實、偏好、決策和實體
- `memory_forget` 用於移除相符的記憶

## 儲存

預設情況下，LanceDB 資料位於 `~/.openclaw/memory/lancedb` 底下。可使用
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

## 執行階段相依性

`memory-lancedb` 依賴原生 `@lancedb/lancedb` 套件。封裝版
OpenClaw 會將該套件視為 Plugin 套件的一部分。Gateway 啟動
不會修復 Plugin 相依性；如果缺少相依性，請重新安裝或
更新 Plugin 套件，然後重新啟動 Gateway。

如果較舊的安裝在 Plugin 載入期間記錄缺少 `dist/package.json` 或缺少
`@lancedb/lancedb` 的錯誤，請升級 OpenClaw 並重新啟動
Gateway。

如果 Plugin 記錄顯示 LanceDB 在 `darwin-x64` 上無法使用，請在該機器上使用預設
記憶後端、將 Gateway 移至支援的平台，或
停用 `memory-lancedb`。

## 疑難排解

### 輸入長度超過內容長度

這通常表示嵌入模型拒絕了回憶查詢：

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

對於 Ollama，也請確認嵌入伺服器可從 Gateway 主機連線：

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不支援的嵌入模型

若未設定 `dimensions`，只會知道內建的 OpenAI 嵌入維度。
對於本機或自訂嵌入模型，請將 `embedding.dimensions` 設為該模型回報的向量
大小。

### Plugin 載入但沒有記憶出現

檢查 `plugins.slots.memory` 是否指向 `memory-lancedb`，然後執行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

如果 `autoCapture` 已停用，Plugin 會回憶現有記憶，但不會
自動儲存新的記憶。如果你想要自動擷取，請使用 `memory_store` 工具或啟用
`autoCapture`。

## 相關

- [記憶概觀](/zh-TW/concepts/memory)
- [Active Memory](/zh-TW/concepts/active-memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [Memory Wiki](/zh-TW/plugins/memory-wiki)
- [Ollama](/zh-TW/providers/ollama)
