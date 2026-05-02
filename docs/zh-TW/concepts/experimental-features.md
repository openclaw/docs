---
read_when:
    - 你看到一個 `.experimental` 設定鍵，並想知道它是否穩定
    - 你想試用預覽版執行階段功能，但不想將其與一般預設值混淆
    - 你想要有一個地方可以找到目前文件記載的實驗性旗標
summary: OpenClaw 中實驗性旗標的含義，以及目前已記錄於文件的項目
title: 實驗性功能
x-i18n:
    generated_at: "2026-05-02T22:18:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 066efa297bac995597f1092ed6473d9cff28c01d7e28fa1382d7997f8f83a346
    source_path: concepts/experimental-features.md
    workflow: 16
---

OpenClaw 中的實驗性功能是**需自行選擇啟用的預覽介面**。它們位於明確旗標之後，因為它們仍需要真實世界的使用驗證，才值得成為穩定預設值或長期公開合約。

請以不同於一般設定的方式看待它們：

- 除非相關文件告訴你可以試用，否則請保持**預設關閉**。
- 預期**形狀與行為變更**會比穩定設定更快。
- 當已有穩定路徑時，請優先使用穩定路徑。
- 如果你正在大規模導入 OpenClaw，請先在較小的環境中測試實驗性旗標，再將它們納入共用基準。

## 目前已記錄的旗標

| 介面                     | 鍵                                                        | 使用時機                                                                                                       | 更多資訊                                                                                      |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本機模型執行環境         | `agents.defaults.experimental.localModelLean`             | 較小或較嚴格的本機後端無法處理 OpenClaw 完整的預設工具介面                                                     | [本機模型](/zh-TW/gateway/local-models)                                                             |
| 記憶搜尋                 | `agents.defaults.memorySearch.experimental.sessionMemory` | 你想讓 `memory_search` 索引先前的工作階段逐字稿，並接受額外的儲存與索引成本                                   | [記憶設定參考](/zh-TW/reference/memory-config#session-memory-search-experimental)                   |
| 結構化規劃工具           | `tools.experimental.planTool`                             | 你想在相容的執行環境與 UI 中公開結構化的 `update_plan` 工具，用於追蹤多步驟工作                               | [Gateway 設定參考](/zh-TW/gateway/config-tools#toolsexperimental)                                   |

## 本機模型精簡模式

`agents.defaults.experimental.localModelLean: true` 是較弱本機模型設定的壓力釋放閥。啟用時，OpenClaw 會在每一輪中，從代理的工具介面移除三個預設工具：`browser`、`cron` 和 `message`。其他部分不會改變。

### 為什麼是這三個工具

在預設 OpenClaw 執行環境中，這三個工具擁有最長的描述和最多的參數形狀。對於小上下文或較嚴格的 OpenAI 相容後端而言，這會造成以下差異：

- 工具結構描述能乾淨地放入提示中，而不是擠掉對話歷史。
- 模型能選擇正確工具，而不是因為有太多外觀相似的結構描述而輸出格式錯誤的工具呼叫。
- Chat Completions 轉接器能留在伺服器的結構化輸出限制內，而不是因工具呼叫承載大小觸發 400。

移除它們不會悄悄重接 OpenClaw，只是讓工具清單更短。模型仍然可用 `read`、`write`、`edit`、`exec`、`apply_patch`、網頁搜尋/擷取（設定後）、記憶，以及工作階段/代理工具。

### 何時啟用

當你已經證明模型可以與 Gateway 溝通，但完整代理輪次行為異常時，請啟用精簡模式。典型的訊號鏈如下：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 一般代理輪次因格式錯誤的工具呼叫、過大的提示，或模型忽略工具而失敗。
3. 切換 `localModelLean: true` 後排除失敗。

### 何時保持關閉

如果你的後端能乾淨處理完整的預設執行環境，請保持關閉。精簡模式是因應措施，不是預設值。它存在是因為某些本機堆疊需要較小的工具介面才能正常運作；託管模型與資源充足的本機設備不需要它。

精簡模式也不會取代 `tools.profile`、`tools.allow`/`tools.deny`，或模型的 `compat.supportsTools: false` 逃生閥。如果你需要為特定代理永久縮小工具介面，請優先使用那些穩定旋鈕，而不是實驗性旗標。

### 啟用

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

變更旗標後重新啟動 Gateway，然後使用以下命令確認修剪後的工具清單：

```bash
openclaw status --deep
```

深度狀態輸出會列出啟用中的代理工具；啟用精簡模式時，`browser`、`cron` 和 `message` 應不存在。

## 實驗性不代表隱藏

如果某項功能是實驗性的，OpenClaw 應該在文件和設定路徑本身中清楚說明。不應該做的是把預覽行為偷塞進看起來穩定的預設旋鈕，然後假裝那是正常的。那正是設定介面變得混亂的原因。

## 相關

- [功能](/zh-TW/concepts/features)
- [發布通道](/zh-TW/install/development-channels)
