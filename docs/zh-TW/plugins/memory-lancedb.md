---
read_when:
    - 你正在設定 memory-lancedb 外掛
    - 你想要以 LanceDB 為後端的長期記憶，並具備自動回想或自動擷取
    - 你正在使用本機 OpenAI 相容的嵌入模型，例如 Ollama
sidebarTitle: Memory LanceDB
summary: 設定官方外部 LanceDB 記憶體外掛，包括本機 Ollama 相容嵌入
title: 記憶 LanceDB
x-i18n:
    generated_at: "2026-06-27T19:38:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` 是官方外部記憶外掛，會將長期記憶儲存在
LanceDB 中，並使用嵌入進行回憶。它可以在模型回合前自動回憶相關
記憶，並在回應後擷取重要事實。

當你想要為記憶使用本機向量資料庫、需要
OpenAI 相容的嵌入端點，或想將記憶資料庫保存在預設內建記憶儲存之外時，請使用它。

## 安裝

在設定 `plugins.slots.memory = "memory-lancedb"` 前，先安裝 `memory-lancedb`：

```bash
openclaw plugins install @openclaw/memory-lancedb
```

此外掛已發布至 npm，並未內建於 OpenClaw 執行階段映像中。
安裝程式會寫入外掛項目，並在沒有其他外掛擁有記憶槽位時切換該槽位。

<Note>
`memory-lancedb` 是主動記憶外掛。透過選取記憶
槽位 `plugins.slots.memory = "memory-lancedb"` 來啟用它。像
`memory-wiki` 這類配套外掛可以與它並行，但只有一個外掛會擁有主動記憶槽位。
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

變更外掛設定後，重新啟動閘道：

```bash
openclaw gateway restart
```

接著確認外掛已載入：

```bash
openclaw plugins list
```

## 由供應商支援的嵌入

`memory-lancedb` 可以使用與 `memory-core` 相同的記憶嵌入供應商配接器。設定 `embedding.provider` 並省略 `embedding.apiKey`，即可使用該供應商已設定的驗證設定檔、環境變數，或
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

此路徑可搭配會公開嵌入憑證的供應商驗證設定檔使用。
例如，當 Copilot 設定檔/方案支援
嵌入時，可以使用 GitHub Copilot：

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

OpenAI Codex / ChatGPT OAuth 不是 OpenAI Platform 嵌入憑證。
若要使用 OpenAI 嵌入，請使用 OpenAI API key 驗證設定檔、
`OPENAI_API_KEY`，或 `models.providers.openai.apiKey`。僅使用 OAuth 的使用者可以使用其他具備嵌入能力的供應商，例如 GitHub Copilot 或 Ollama。

## Ollama 嵌入

對於 Ollama 嵌入，建議使用內建的 Ollama 嵌入供應商。它使用原生
Ollama `/api/embed` 端點，並遵循 [Ollama](/zh-TW/providers/ollama) 中記載的相同驗證/base URL 規則。

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

為非標準嵌入模型設定 `dimensions`。OpenClaw 知道
`text-embedding-3-small` 和 `text-embedding-3-large` 的
維度；自訂模型需要在設定中提供該值，讓 LanceDB 可以建立向量欄位。

對於小型本機嵌入模型，如果你看到來自本機伺服器的 context
length 錯誤，請降低 `recallMaxChars`。

## OpenAI 相容供應商

某些 OpenAI 相容嵌入供應商會拒絕 `encoding_format`
參數，而其他供應商會忽略它並一律回傳 `number[]` 向量。
因此，`memory-lancedb` 會在嵌入請求中省略 `encoding_format`，
並接受浮點陣列回應或 base64 編碼的 float32 回應。

如果你有尚未具備內建供應商配接器的原始 OpenAI 相容嵌入端點，請省略 `embedding.provider`（或將其保留為 `openai`），並設定 `embedding.apiKey` 加上 `embedding.baseUrl`。這會保留直接的 OpenAI 相容用戶端路徑。

對於模型維度未內建的供應商，請設定 `embedding.dimensions`。
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

## 回憶與擷取限制

`memory-lancedb` 有兩個獨立的文字限制：

| 設定              | 預設值  | 範圍      | 適用於                                                    |
| ----------------- | ------- | --------- | --------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | 傳送到嵌入 API 以進行回憶的文字                           |
| `captureMaxChars` | `500`   | 100-10000 | 符合自動擷取資格的訊息長度                                |
| `customTriggers`  | `[]`    | 0-50      | 讓自動擷取考慮某則訊息的字面片語                          |

`recallMaxChars` 控制自動回憶、`memory_recall` 工具、
`memory_forget` 查詢路徑，以及 `openclaw ltm search`。自動回憶會優先使用該回合中最新的使用者訊息，只有在沒有可用使用者訊息時才退回完整提示。這會讓通道中繼資料和大型提示區塊不進入嵌入請求。

`captureMaxChars` 控制回應是否足夠短，能被納入自動擷取考量。
它不會限制回憶查詢嵌入。

`customTriggers` 可讓你加入字面的自動擷取片語，而不必撰寫
正規表示式。內建觸發詞包含常見的英文、捷克文、
中文、日文和韓文記憶片語。

## 命令

當 `memory-lancedb` 是主動記憶外掛時，它會註冊 `ltm` 命令列介面
命名空間：

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

`query` 子命令會直接針對 LanceDB 資料表執行非向量查詢：

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`：以逗號分隔的欄位允許清單（預設為 `id`、`text`、`importance`、`category`、`createdAt`）。
- `--filter <condition>`：SQL 風格的 WHERE 子句；上限為 200 個字元，並限制為英數字元、比較運算子、引號、括號，以及少量安全標點符號。
- `--limit <n>`：正整數；預設為 `10`。
- `--order-by <column>:<asc|desc>`：在篩選後套用的記憶體內排序；排序欄位會自動包含在投影中。

代理程式也會從主動記憶外掛取得 LanceDB 記憶工具：

- `memory_recall` 用於 LanceDB 支援的回憶
- `memory_store` 用於儲存重要事實、偏好、決策和實體
- `memory_forget` 用於移除相符的記憶

## 儲存

依預設，LanceDB 資料位於 `~/.openclaw/memory/lancedb` 下。可使用
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

`storageOptions` 接受 LanceDB 儲存後端的字串鍵/值組，並支援
`${ENV_VAR}` 展開：

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

`memory-lancedb` 依賴原生 `@lancedb/lancedb` 套件。封裝後的
OpenClaw 會將該套件視為外掛套件的一部分。閘道啟動
不會修復外掛相依性；如果缺少相依性，請重新安裝或
更新外掛套件，並重新啟動閘道。

如果較舊的安裝在外掛載入期間記錄缺少 `dist/package.json` 或缺少
`@lancedb/lancedb` 錯誤，請升級 OpenClaw 並重新啟動
閘道。

如果外掛記錄 LanceDB 在 `darwin-x64` 上不可用，請在該機器上使用預設
記憶後端、將閘道移至受支援的平台，或
停用 `memory-lancedb`。

## 疑難排解

### 輸入長度超過 context length

這通常表示嵌入模型拒絕了回憶查詢：

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

設定較低的 `recallMaxChars`，然後重新啟動閘道：

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

對於 Ollama，也請確認嵌入伺服器可從閘道主機存取：

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不支援的嵌入模型

若未提供 `dimensions`，只會知道內建的 OpenAI 嵌入維度。
對於本機或自訂嵌入模型，請將 `embedding.dimensions` 設為該模型回報的向量
大小。

### 外掛已載入但沒有出現任何記憶

檢查 `plugins.slots.memory` 是否指向 `memory-lancedb`，然後執行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

如果 `autoCapture` 已停用，外掛會回憶既有記憶，但不會
自動儲存新的記憶。若你想要自動擷取，請使用 `memory_store` 工具或啟用
`autoCapture`。

## 相關

- [記憶概觀](/zh-TW/concepts/memory)
- [主動記憶](/zh-TW/concepts/active-memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [Memory Wiki](/zh-TW/plugins/memory-wiki)
- [Ollama](/zh-TW/providers/ollama)
