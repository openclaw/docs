---
read_when:
    - 你想了解 memory_search 的運作方式
    - 你想要選擇嵌入向量提供者
    - 你想要調整搜尋品質
summary: 記憶搜尋如何使用嵌入向量與混合檢索來尋找相關筆記
title: 記憶搜尋
x-i18n:
    generated_at: "2026-07-19T13:44:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7be013665593c82890d3e0586136385f9b17e8d76f18e85abeab7304f34264d
    source_path: concepts/memory-search.md
    workflow: 16
---

`memory_search` 會從你的記憶檔案中找出相關筆記，即使其
措辭與原文不同。它會將記憶切分成小片段，並使用嵌入、關鍵字或兩者
進行搜尋。

## 快速開始

OpenClaw 預設使用 OpenAI 嵌入。若要使用其他提供者，請明確
設定：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai", // 或 "gemini"、"voyage"、"mistral"、"bedrock"、"local"、"ollama"、"lmstudio"、"github-copilot"、"openai-compatible"
      },
    },
  },
}
```

`provider` 也可以參照自訂的 `models.providers.<id>` 項目（例如
`ollama-5080`），前提是該項目將 `api` 設為 `"ollama"` 或
其他具有記憶嵌入轉接器的提供者 ID。

若要使用不需要 API 金鑰的本機嵌入，請安裝官方 llama.cpp 提供者
外掛並設定 `provider: "local"`：

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

原始碼簽出仍需核准原生建置：`pnpm approve-builds`，然後
`pnpm rebuild node-llama-cpp`。

某些 OpenAI 相容的嵌入端點需要非對稱的 `input_type`
標籤，例如搜尋使用 `"query"`，建立索引的
片段則使用 `"document"`/`"passage"`。請透過 `queryInputType` 和 `documentInputType` 設定；請參閱
[記憶設定參考](/zh-TW/reference/memory-config#provider-specific-config)。

## 支援的提供者

| 提供者            | ID                  | 需要 API 金鑰 | 備註                              |
| ----------------- | ------------------- | ------------- | --------------------------------- |
| Bedrock           | `bedrock`           | 否            | 使用 AWS 認證資訊鏈               |
| DeepInfra         | `deepinfra`         | 是            | 預設模型 `BAAI/bge-m3`       |
| Gemini            | `gemini`            | 是            | 支援影像／音訊索引                 |
| GitHub Copilot    | `github-copilot`    | 否            | 使用你的 Copilot 訂閱              |
| 本機              | `local`             | 否            | GGUF 模型，自動下載約 0.6 GB       |
| LM Studio         | `lmstudio`          | 否            | 本機／自行託管的伺服器             |
| Mistral           | `mistral`           | 是            |                                   |
| Ollama            | `ollama`            | 否            | 本機／自行託管的伺服器             |
| OpenAI            | `openai`            | 是            | 預設                              |
| OpenAI 相容       | `openai-compatible` | 通常需要      | 通用 `/v1/embeddings` 端點       |
| Voyage            | `voyage`            | 是            |                                   |

## 搜尋運作方式

OpenClaw 會平行執行兩條擷取路徑，並合併結果：

```mermaid
flowchart LR
    Q["查詢"] --> E["嵌入"]
    Q --> T["權杖化"]
    E --> VS["向量搜尋"]
    T --> BM["BM25 搜尋"]
    VS --> M["加權合併"]
    BM --> M
    M --> R["最佳結果"]
```

- **向量搜尋**會比對相近語意（「閘道主機」可比對到「執行
  OpenClaw 的機器」）。
- **BM25 關鍵字搜尋**會比對完全相符的詞彙（ID、錯誤字串、設定
  鍵）。
- **檔名搜尋**會將路徑與筆記本文分開建立索引。完全相符的完整
  路徑、基本檔名和檔名主幹的排名會高於部分路徑比對，
  而程式碼片段與本文關鍵字分數仍來自筆記內容。

如果只有一條路徑可用，另一條會單獨執行。

**僅 FTS 模式。** 將 `provider: "none"` 設定為刻意停用嵌入，
並且僅使用關鍵字搜尋。若未設定 `provider` 或將其設為 `"auto"`，
在未設定嵌入驗證資訊時，也會退回僅使用關鍵字的排名，
且不會回報錯誤；`provider: "local"`（GGUF/llama.cpp
提供者）失敗時也同樣如此。

**明確指定的提供者無法使用。** 如果你明確指定任何其他提供者
（例如 `openai`、`ollama`、`gemini`），而該提供者在
請求時無法使用（驗證資訊錯誤、網路故障），`memory_search` 會將記憶回報為
無法使用，而不會無聲降級為僅 FTS 的結果。這可讓設定有誤的
提供者問題保持可見。若要刻意僅使用 FTS 進行召回，請設定 `provider: "none"`；
若要恢復語意排名，請修正提供者／驗證設定。

## 改善搜尋品質

兩項選用功能可協助處理大量筆記歷史記錄。

### 時間衰減

舊筆記的排名權重會逐漸降低，讓近期資訊優先浮現。
使用預設的 30 天半衰期時，上個月的筆記分數會是其
原始權重的 50%。`MEMORY.md` 以及 `memory/` 下其他未標示日期的檔案
屬於常青內容，永不衰減；只有有日期的 `memory/YYYY-MM-DD.md` 檔案會衰減。

<Tip>
如果你的代理程式已有數個月的每日筆記，而且過時資訊
持續排在近期內容之前，請啟用此功能。
</Tip>

### MMR（多樣性）

減少重複結果。如果五則筆記都提到相同的路由器設定，
MMR 會確保最佳結果涵蓋不同主題，而非重複相同內容。

<Tip>
如果 `memory_search` 持續從不同的每日筆記傳回幾乎重複的片段，
請啟用此功能。
</Tip>

### 同時啟用兩者

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            mmr: { enabled: true },
            temporalDecay: { enabled: true },
          },
        },
      },
    },
  },
}
```

## 多模態記憶

使用 `gemini-embedding-2-preview` 時，你可以將影像和音訊與
Markdown 一併建立索引。這僅適用於 `memorySearch.extraPaths` 下的檔案；預設
記憶根目錄（`MEMORY.md`、`memory/*.md`）仍僅支援 Markdown。搜尋查詢
仍為文字，但可以比對視覺與音訊內容。設定方式請參閱
[記憶設定參考](/zh-TW/reference/memory-config#multimodal-memory-gemini)。

## 工作階段記憶搜尋

若要從工作階段逐字記錄中進行精確的全文召回，請使用 [`sessions_search`](/zh-TW/concepts/session-search)，
然後使用 `sessions_history` 開啟結果。工作階段記憶搜尋仍是語意式的
實驗性補充功能。

你也可以選擇為工作階段逐字記錄建立索引，讓 `memory_search` 能召回先前的
對話。此功能需自行啟用：設定 `experimental.sessionMemory: true`，並將
`"sessions"` 加入 `sources`（預設 `sources` 為 `["memory"]`）。

工作階段命中結果遵循 `tools.sessions.visibility`：預設的 `"tree"` 會公開
目前的工作階段、由其衍生的工作階段，以及透過環境群組感知所監看
且屬於相同代理程式的群組工作階段。使用 `session.dmScope: "main"` 時，多使用者
私訊設定會共用該主要工作階段，因此路由至該處的使用者可以召回
其監看群組中的內容。若要隔離私訊，請為每個對象使用 `dmScope`；或將
可見性設定為 `"self"`，以停用環境監看工作階段的讀取。其他
不相關且屬於相同代理程式的工作階段仍需要 `"agent"` 可見性。

使用 QMD 後端時，也請設定 `memory.qmd.sessions.enabled: true`，讓
逐字記錄匯出至 QMD 集合；僅設定 `experimental.sessionMemory`
和 `sources` 不會將逐字記錄匯出至 QMD。請參閱
[設定參考](/zh-TW/reference/memory-config#session-memory-search-experimental)。

## 疑難排解

**沒有結果？** 執行 `openclaw memory status` 檢查索引。如果索引為空，請執行
`openclaw memory index --force`。

**只有關鍵字比對？** 你的嵌入提供者可能尚未設定。請檢查
`openclaw memory status --deep`。

**本機嵌入逾時？** `ollama`、`lmstudio` 和 `local` 預設使用較長的
內嵌批次逾時時間。如果只是主機速度較慢，請設定
`agents.defaults.memorySearch.sync.embeddingBatchTimeoutSeconds`，然後重新執行
`openclaw memory index --force`。

**找不到 CJK 文字？** 請使用
`openclaw memory index --force` 重建 FTS 索引。

## 相關內容

- [記憶概觀](/zh-TW/concepts/memory)
- [主動記憶](/zh-TW/concepts/active-memory)
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)
- [記憶設定參考](/zh-TW/reference/memory-config)
