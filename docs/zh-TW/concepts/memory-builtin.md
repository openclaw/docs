---
read_when:
    - 你想了解預設記憶體後端
    - 您想設定嵌入提供者或混合搜尋
summary: 預設的 SQLite 型記憶後端，支援關鍵字、向量與混合搜尋
title: 內建記憶引擎
x-i18n:
    generated_at: "2026-07-05T11:14:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

內建引擎是預設的記憶後端。它會將你的記憶索引儲存在每個代理程式各自的 SQLite 資料庫中，開始使用不需要額外依賴項。

## 它提供什麼

- **關鍵字搜尋**，透過 FTS5 全文索引（BM25 評分）。
- **向量搜尋**，透過任何支援提供者的嵌入。
- **混合搜尋**，結合兩者以取得最佳結果。
- **CJK 支援**，透過三元語法切詞支援中文、日文和韓文。
- **sqlite-vec 加速**，用於資料庫內向量查詢（選用）。

## 開始使用

預設情況下，內建引擎會使用 OpenAI 嵌入。如果已設定 `OPENAI_API_KEY` 或 `models.providers.openai.apiKey`，向量搜尋不需要額外的記憶設定即可運作。

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

沒有嵌入提供者時，只有關鍵字搜尋可用。

若要強制使用本機 GGUF 嵌入，請安裝官方 llama.cpp 提供者外掛，然後將 `local.modelPath` 指向 GGUF 檔案：

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

## 支援的嵌入提供者

| 提供者            | ID                  | 備註                                |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | 使用 AWS 憑證鏈                     |
| DeepInfra         | `deepinfra`         | 預設：`BAAI/bge-m3`                 |
| Gemini            | `gemini`            | 支援多模態（影像 + 音訊）           |
| GitHub Copilot    | `github-copilot`    | 使用你的 Copilot 訂閱               |
| LM Studio         | `lmstudio`          | 本機／自行託管                      |
| 本機              | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | 本機／自行託管                      |
| OpenAI            | `openai`            | 預設：`text-embedding-3-small`      |
| OpenAI 相容       | `openai-compatible` | 通用 `/v1/embeddings` 端點          |
| Voyage            | `voyage`            |                                     |

設定 `memorySearch.provider` 以改用 OpenAI 以外的提供者。

## 索引如何運作

OpenClaw 會將 `MEMORY.md` 和 `memory/*.md` 索引為區塊（預設為 400 個 token，重疊 80 個 token），並將其儲存在每個代理程式各自的 SQLite 資料庫中。

- **索引位置：** 所屬代理程式資料庫，位於
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **儲存維護：** SQLite WAL sidecar 會透過定期和關閉時的 checkpoint 維持在有界範圍內。
- **檔案監看：** 記憶檔案變更會觸發防抖重新索引（預設 1.5 秒）。
- **自動重新索引：** 當嵌入提供者、模型、區塊設定、已設定來源或範圍變更時，索引會自動重建。
- **隨需重新索引：** `openclaw memory index --force`

<Info>
你也可以使用 `memorySearch.extraPaths` 索引工作區外的 Markdown 檔案。請參閱
[設定參考](/zh-TW/reference/memory-config#additional-memory-paths)。
</Info>

## 何時使用

內建引擎是大多數使用者的正確選擇：

- 開箱即用，不需要額外依賴項。
- 能妥善處理關鍵字與向量搜尋。
- 支援所有嵌入提供者。
- 混合搜尋結合兩種檢索方法的優點。

如果你需要重新排序、查詢擴展，或想索引工作區外的目錄，請考慮改用 [QMD](/zh-TW/concepts/memory-qmd)。

如果你想要具備自動使用者建模的跨工作階段記憶，請考慮使用 [Honcho](/zh-TW/concepts/memory-honcho)。

## 疑難排解

**記憶搜尋已停用？** 檢查 `openclaw memory status`。如果未偵測到提供者，請明確設定一個提供者或新增 API 金鑰。

**未偵測到本機提供者？** 確認本機路徑存在並執行：

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

獨立命令列介面命令和閘道都使用相同的 `local` 提供者 ID。當你想使用本機嵌入時，請設定 `memorySearch.provider: "local"`。

**結果過舊？** 執行 `openclaw memory index --force` 以重建。監看器在罕見邊界情況下可能會漏掉變更。

**sqlite-vec 未載入？** OpenClaw 會自動退回至處理程序內的餘弦相似度。`openclaw memory status --deep` 會將本機向量儲存與嵌入提供者分開回報，因此 `Vector store: unavailable` 指向 sqlite-vec 載入問題，而 `Embeddings: unavailable` 指向提供者／驗證或模型就緒狀態。請查看記錄以取得具體的載入錯誤。

## 設定

如需嵌入提供者設定、混合搜尋調校（權重、MMR、時間衰減）、批次索引、多模態記憶、sqlite-vec、額外路徑和所有其他設定旋鈕，請參閱
[記憶設定參考](/zh-TW/reference/memory-config)。

## 相關

- [記憶總覽](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [主動記憶](/zh-TW/concepts/active-memory)
