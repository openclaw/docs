---
read_when:
    - 您想了解預設的記憶後端
    - 您想要設定嵌入提供者或混合搜尋
summary: 預設的 SQLite 型記憶後端，支援關鍵字、向量與混合搜尋
title: 內建記憶引擎
x-i18n:
    generated_at: "2026-05-03T21:30:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72f5d1fee02bff0962bd012575b62846c1f11c030fd1174fdb2af1e81909f52a
    source_path: concepts/memory-builtin.md
    workflow: 16
---

內建引擎是預設的記憶後端。它會將你的記憶索引儲存在
每個代理程式的 SQLite 資料庫中，開始使用時不需要額外相依項。

## 它提供的功能

- 透過 FTS5 全文索引（BM25 評分）進行**關鍵字搜尋**。
- 透過任何受支援提供者的嵌入進行**向量搜尋**。
- **混合搜尋**會結合兩者以取得最佳結果。
- 透過三元組分詞支援中文、日文和韓文的 **CJK 支援**。
- 透過 **sqlite-vec 加速**進行資料庫內向量查詢（選用）。

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

如果沒有嵌入提供者，則只能使用關鍵字搜尋。

若要強制使用內建的本機嵌入提供者，請在 OpenClaw 旁安裝選用的
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

## 受支援的嵌入提供者

| 提供者    | ID          | 自動偵測 | 備註                                |
| --------- | ----------- | -------- | ----------------------------------- |
| OpenAI    | `openai`    | 是       | 預設：`text-embedding-3-small`      |
| Gemini    | `gemini`    | 是       | 支援多模態（圖片 + 音訊）           |
| Voyage    | `voyage`    | 是       |                                     |
| Mistral   | `mistral`   | 是       |                                     |
| DeepInfra | `deepinfra` | 是       | 預設：`BAAI/bge-m3`                 |
| Ollama    | `ollama`    | 否       | 本機，需明確設定                    |
| 本機      | `local`     | 是（第一個） | 選用的 `node-llama-cpp` 執行階段 |

自動偵測會依照顯示的順序，選取第一個可解析 API 金鑰的提供者。
設定 `memorySearch.provider` 可覆寫。

## 索引如何運作

OpenClaw 會將 `MEMORY.md` 和 `memory/*.md` 索引為區塊（約 400 個 token，
重疊 80 個 token），並儲存在每個代理程式的 SQLite 資料庫中。

- **索引位置：** `~/.openclaw/memory/<agentId>.sqlite`
- **儲存維護：** SQLite WAL sidecar 會透過定期與
  關閉時 checkpoint 控制大小。
- **檔案監看：** 記憶檔案的變更會觸發防抖後重新索引（1.5 秒）。
- **自動重新索引：** 當嵌入提供者、模型或區塊設定
  變更時，整個索引會自動重建。
- **依需求重新索引：** `openclaw memory index --force`

<Info>
你也可以使用 `memorySearch.extraPaths` 索引工作區外的 Markdown 檔案。請參閱
[設定參考](/zh-TW/reference/memory-config#additional-memory-paths)。
</Info>

## 使用時機

內建引擎是大多數使用者的正確選擇：

- 無需額外相依項即可開箱即用。
- 能妥善處理關鍵字和向量搜尋。
- 支援所有嵌入提供者。
- 混合搜尋結合兩種擷取方式的優點。

如果你需要重新排序、查詢擴展，或想索引工作區外的目錄，
請考慮切換到 [QMD](/zh-TW/concepts/memory-qmd)。

如果你想要具備自動使用者建模的跨工作階段記憶，
請考慮 [Honcho](/zh-TW/concepts/memory-honcho)。

## 疑難排解

**記憶搜尋停用了？** 檢查 `openclaw memory status`。如果未偵測到提供者，
請明確設定一個，或加入 API 金鑰。

**未偵測到本機提供者？** 確認本機路徑存在並執行：

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

獨立 CLI 命令和 Gateway 都使用相同的 `local` 提供者 ID。
如果提供者設定為 `auto`，只有當 `memorySearch.local.modelPath`
指向現有本機檔案時，才會優先考慮本機嵌入。

**結果過舊？** 執行 `openclaw memory index --force` 以重建。監看器
在少數邊緣情況下可能會漏掉變更。

**sqlite-vec 無法載入？** OpenClaw 會自動退回使用處理程序內的餘弦相似度。
`openclaw memory status --deep` 會將本機向量儲存區與嵌入提供者分開回報，
因此 `Vector store: unavailable` 指向 sqlite-vec 載入問題，而 `Embeddings: unavailable`
則指向提供者/驗證或模型就緒狀態。請檢查記錄以取得具體載入錯誤。

## 設定

如需嵌入提供者設定、混合搜尋調整（權重、MMR、時間
衰減）、批次索引、多模態記憶、sqlite-vec、額外路徑，以及所有
其他設定旋鈕，請參閱
[記憶設定參考](/zh-TW/reference/memory-config)。

## 相關

- [記憶概觀](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [Active Memory](/zh-TW/concepts/active-memory)
