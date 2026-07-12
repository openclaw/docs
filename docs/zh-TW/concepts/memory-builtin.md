---
read_when:
    - 你想瞭解預設的記憶體後端
    - 您想要設定嵌入向量提供者或混合搜尋
summary: 預設的 SQLite 記憶體後端，支援關鍵字、向量與混合搜尋
title: 內建記憶引擎
x-i18n:
    generated_at: "2026-07-11T21:17:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

內建引擎是預設的記憶後端。它會將記憶索引儲存在每個代理程式各自的 SQLite 資料庫中，且不需要額外相依套件即可開始使用。

## 提供的功能

- 透過 FTS5 全文索引進行**關鍵字搜尋**（BM25 評分）。
- 使用任何支援供應商所提供的嵌入向量進行**向量搜尋**。
- 結合兩者以獲得最佳結果的**混合搜尋**。
- 透過三元組詞元化支援中文、日文和韓文的 **CJK 支援**。
- 使用 **sqlite-vec 加速**資料庫內的向量查詢（選用）。

## 開始使用

根據預設，內建引擎使用 OpenAI 嵌入向量。如果已設定 `OPENAI_API_KEY` 或 `models.providers.openai.apiKey`，則無須額外設定記憶功能即可使用向量搜尋。

若要明確設定供應商：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

若沒有嵌入向量供應商，則只能使用關鍵字搜尋。

若要強制使用本機 GGUF 嵌入向量，請安裝官方 llama.cpp 供應商外掛，然後將 `local.modelPath` 指向 GGUF 檔案：

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## 支援的嵌入向量供應商

| 供應商            | ID                  | 備註                                |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | 使用 AWS 憑證鏈                     |
| DeepInfra         | `deepinfra`         | 預設：`BAAI/bge-m3`                 |
| Gemini            | `gemini`            | 支援多模態（圖片 + 音訊）           |
| GitHub Copilot    | `github-copilot`    | 使用您的 Copilot 訂閱               |
| LM Studio         | `lmstudio`          | 本機／自行託管                      |
| 本機              | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | 本機／自行託管                      |
| OpenAI            | `openai`            | 預設：`text-embedding-3-small`      |
| OpenAI 相容       | `openai-compatible` | 通用 `/v1/embeddings` 端點          |
| Voyage            | `voyage`            |                                     |

設定 `memorySearch.provider` 即可改用 OpenAI 以外的供應商。

## 索引的運作方式

OpenClaw 會將 `MEMORY.md` 和 `memory/*.md` 索引為區塊（預設為 400 個詞元，重疊 80 個詞元），並將其儲存在每個代理程式各自的 SQLite 資料庫中。

- **索引位置：**所屬代理程式的資料庫：
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **儲存維護：**透過定期檢查點和關閉時檢查點，限制 SQLite WAL 附屬檔案的大小。
- **檔案監看：**記憶檔案的變更會觸發經過防抖處理的重新索引（預設 1.5 秒）。
- **自動重新索引：**當嵌入向量供應商、模型、分塊設定、已設定的來源或範圍變更時，索引會自動重建。
- **隨需重新索引：**`openclaw memory index --force`

<Info>
您也可以使用 `memorySearch.extraPaths` 索引工作區之外的 Markdown 檔案。請參閱[設定參考](/zh-TW/reference/memory-config#additional-memory-paths)。
</Info>

## 適用時機

內建引擎是大多數使用者的合適選擇：

- 無須額外相依套件，開箱即可使用。
- 能妥善處理關鍵字搜尋和向量搜尋。
- 支援所有嵌入向量供應商。
- 混合搜尋結合了兩種擷取方式的優點。

如果您需要重新排序、查詢擴展，或想要索引工作區之外的目錄，請考慮改用 [QMD](/zh-TW/concepts/memory-qmd)。

如果您想要具備自動使用者建模功能的跨工作階段記憶，請考慮使用 [Honcho](/zh-TW/concepts/memory-honcho)。

## 疑難排解

**記憶搜尋已停用？**請檢查 `openclaw memory status`。如果未偵測到供應商，請明確設定一個供應商或新增 API 金鑰。

**未偵測到本機供應商？**請確認本機路徑存在，然後執行：

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

獨立的命令列介面命令和閘道都使用相同的 `local` 供應商 ID。若要使用本機嵌入向量，請設定 `memorySearch.provider: "local"`。

**結果已過時？**執行 `openclaw memory index --force` 以重建索引。在少數邊界情況下，監看器可能會遺漏變更。

**sqlite-vec 無法載入？**OpenClaw 會自動改用程序內餘弦相似度。`openclaw memory status --deep` 會分別回報本機向量儲存區與嵌入向量供應商的狀態，因此 `Vector store:
unavailable` 表示 sqlite-vec 載入問題，而 `Embeddings: unavailable` 則表示供應商／驗證或模型就緒狀態有問題。請檢查日誌以取得具體的載入錯誤。

## 設定

如需嵌入向量供應商設定、混合搜尋調校（權重、MMR、時間衰減）、批次索引、多模態記憶、sqlite-vec、額外路徑及所有其他設定選項，請參閱[記憶設定參考](/zh-TW/reference/memory-config)。

## 相關內容

- [記憶概覽](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [主動記憶](/zh-TW/concepts/active-memory)
