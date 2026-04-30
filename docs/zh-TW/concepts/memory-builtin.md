---
read_when:
    - 你想了解預設的記憶後端
    - 您想要設定嵌入提供者或混合搜尋
summary: 以 SQLite 為基礎的預設記憶後端，支援關鍵字、向量與混合搜尋
title: 內建記憶引擎
x-i18n:
    generated_at: "2026-04-30T02:59:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa1597a9a49a6f1124cedf49f6f5a4c336f76dd5998ced246affb9c2e8171f05
    source_path: concepts/memory-builtin.md
    workflow: 16
---

內建引擎是預設的記憶後端。它會將你的記憶索引儲存在
每個代理程式各自的 SQLite 資料庫中，開始使用不需要額外依賴。

## 它提供什麼

- **關鍵字搜尋**：透過 FTS5 全文索引（BM25 評分）。
- **向量搜尋**：透過任何支援提供者的 embeddings。
- **混合搜尋**：結合兩者以取得最佳結果。
- **CJK 支援**：透過 trigram 分詞支援中文、日文和韓文。
- **sqlite-vec 加速**：用於資料庫內向量查詢（選用）。

## 開始使用

如果你有 OpenAI、Gemini、Voyage、Mistral 或 DeepInfra 的 API 金鑰，內建
引擎會自動偵測並啟用向量搜尋。不需要設定。

若要明確設定提供者：

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

沒有 embedding 提供者時，只能使用關鍵字搜尋。

若要強制使用內建的本機 embedding 提供者，請在 OpenClaw 旁安裝選用的
`node-llama-cpp` 執行階段套件，然後將 `local.modelPath`
指向 GGUF 檔案：

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

## 支援的 embedding 提供者

| 提供者    | ID          | 自動偵測      | 備註                                |
| --------- | ----------- | ------------- | ----------------------------------- |
| OpenAI    | `openai`    | 是            | 預設值：`text-embedding-3-small`    |
| Gemini    | `gemini`    | 是            | 支援多模態（圖片 + 音訊）           |
| Voyage    | `voyage`    | 是            |                                     |
| Mistral   | `mistral`   | 是            |                                     |
| DeepInfra | `deepinfra` | 是            | 預設值：`BAAI/bge-m3`               |
| Ollama    | `ollama`    | 否            | 本機，請明確設定                    |
| Local     | `local`     | 是（優先）    | 選用的 `node-llama-cpp` 執行階段    |

自動偵測會依照上方顯示的順序，選擇第一個可解析 API 金鑰的提供者。
設定 `memorySearch.provider` 可覆寫。

## 索引如何運作

OpenClaw 會將 `MEMORY.md` 和 `memory/*.md` 索引成區塊（約 400 個 token，
重疊 80 個 token），並儲存在每個代理程式各自的 SQLite 資料庫中。

- **索引位置：** `~/.openclaw/memory/<agentId>.sqlite`
- **儲存維護：** SQLite WAL sidecar 會透過定期和關閉時的 checkpoint 加以限制。
- **檔案監看：** 記憶檔案的變更會觸發 debounce 後的重新索引（1.5 秒）。
- **自動重新索引：** 當 embedding 提供者、模型或區塊設定變更時，整個索引會自動重建。
- **依需求重新索引：** `openclaw memory index --force`

<Info>
你也可以使用 `memorySearch.extraPaths` 索引工作區外的 Markdown 檔案。請參閱
[設定參考](/zh-TW/reference/memory-config#additional-memory-paths)。
</Info>

## 何時使用

內建引擎是大多數使用者的正確選擇：

- 不需額外依賴即可直接使用。
- 能妥善處理關鍵字和向量搜尋。
- 支援所有 embedding 提供者。
- 混合搜尋結合兩種檢索方式的優點。

如果你需要 reranking、查詢擴展，或想索引工作區外的目錄，請考慮改用
[QMD](/zh-TW/concepts/memory-qmd)。

如果你想要具備自動使用者建模的跨工作階段記憶，請考慮
[Honcho](/zh-TW/concepts/memory-honcho)。

## 疑難排解

**記憶搜尋已停用？** 檢查 `openclaw memory status`。如果沒有偵測到提供者，
請明確設定一個提供者，或新增 API 金鑰。

**未偵測到本機提供者？** 確認本機路徑存在並執行：

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

獨立 CLI 命令和 Gateway 都使用相同的 `local` 提供者 ID。
如果提供者設定為 `auto`，只有在 `memorySearch.local.modelPath`
指向現有本機檔案時，才會優先考慮本機 embeddings。

**結果過時？** 執行 `openclaw memory index --force` 以重建。監看器在少數邊界情況下
可能會漏掉變更。

**sqlite-vec 無法載入？** OpenClaw 會自動退回使用進程內 cosine similarity。
請檢查記錄以取得特定的載入錯誤。

## 設定

如需 embedding 提供者設定、混合搜尋調校（權重、MMR、時間衰減）、
批次索引、多模態記憶、sqlite-vec、額外路徑，以及所有其他設定選項，
請參閱
[記憶設定參考](/zh-TW/reference/memory-config)。

## 相關

- [記憶概觀](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [Active Memory](/zh-TW/concepts/active-memory)
