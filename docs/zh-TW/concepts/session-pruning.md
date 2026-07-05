---
read_when:
    - 你想減少工具輸出造成的上下文增長
    - 你想了解 Anthropic 提示快取最佳化
summary: 修剪舊的工具結果，以保持上下文精簡並提升快取效率
title: 工作階段修剪
x-i18n:
    generated_at: "2026-07-05T11:15:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

工作階段修剪會在每次 LLM 呼叫前，從上下文中修剪**舊工具結果**。它會減少累積工具輸出（exec 結果、檔案讀取、搜尋結果）造成的上下文膨脹，而不會重寫一般對話文字。

<Info>
修剪只在記憶體中進行 -- 不會修改磁碟上的工作階段逐字稿。你的完整歷史一律會保留。
</Info>

## 為什麼重要

長工作階段會累積工具輸出，導致上下文視窗膨脹。這會增加成本，並可能迫使 [壓縮](/zh-TW/concepts/compaction) 比必要時間更早發生。

修剪對 **Anthropic 提示快取**特別有價值。快取 TTL 過期後，下一個請求會重新快取完整提示。修剪會減少快取寫入大小，直接降低成本。

## 運作方式

修剪以 `cache-ttl` 模式執行，並同時受時間檢查與上下文大小檢查控管：

1. 等待快取 TTL 過期（手動設定時預設為 5 分鐘；Anthropic 自動預設值請見[智慧預設值](#smart-defaults)）。TTL 尚未過期前，會完全略過修剪，以保留鄰近回合的提示快取重用。
2. TTL 過期後，根據模型的上下文視窗估算總上下文大小。如果比例低於 `softTrimRatio`（預設 0.3），則略過修剪並讓 TTL 時鐘繼續運作。
3. 對超過比例的工具結果進行**軟修剪**：保留開頭與結尾（預設各 1500 個字元，合計上限 4000 個字元），中間插入 `...`。
4. 如果比例仍大於或等於 `hardClearRatio`（預設 0.5），且仍有至少 `minPrunableToolChars`（預設 50,000）個字元的可修剪工具內容，則**硬清除**這些結果：將其內容替換為預留位置（預設 `[Old tool result content cleared]`）。
5. 只有在修剪實際改變上下文時，才重設 TTL 時鐘，因此後續請求可重用新的快取。

無論門檻為何，都會套用兩項安全規則：最近的 `keepLastAssistants` 個助理回合（預設 3）絕不修剪，且工作階段第一則使用者訊息之前的任何內容也絕不修剪（保護像 `SOUL.md`/`USER.md` 這類啟動讀取）。

只有 `toolResult` 訊息符合資格；一般對話文字不會被處理。使用 `agents.defaults.contextPruning.tools.{allow,deny}` 來限定哪些工具名稱可被修剪。

## 舊版圖片清理

OpenClaw 也會為在歷史中保存原始圖片區塊或提示補水媒體標記的工作階段，建立一個獨立的冪等重播檢視。

- 它會逐位元組保留**最近 3 個已完成回合**，讓近期後續請求的提示快取前綴保持穩定。此計數包含所有已完成回合，不只是含圖片的回合，因此純文字回合也會占用視窗。
- 在重播檢視中，來自 `user` 或 `toolResult` 歷史中較舊且已處理的圖片區塊，會被替換為 `[image data removed - already processed by model]`。
- 較舊的文字媒體參照，例如 `[media attached: ...]`、`[Image: source: ...]` 和 `media://inbound/...`，會被替換為 `[media reference removed - already processed by model]`。目前回合的附件標記會保持完整，讓視覺模型仍可補水新的圖片。
- 原始工作階段逐字稿不會被重寫，因此歷史檢視器仍可呈現原始訊息項目及其圖片。
- 這與上方一般的快取 TTL 修剪不同。它的存在是為了阻止重複圖片酬載或過期媒體參照在後續回合破壞提示快取。

## 智慧預設值

內建的 Anthropic 外掛第一次解析 Anthropic（或 Claude CLI）驗證設定檔時，會自動設定修剪與心跳偵測節奏，但只會設定你尚未明確設定的欄位：

| 驗證模式                                 | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| ---------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/token（包括 Claude CLI 重用）      | `cache-ttl`           | `1h`                 | `1h`              |
| API 金鑰                                 | `cache-ttl`           | `1h`                 | `30m`             |

如果你自行設定 `agents.defaults.contextPruning.mode` 或 `agents.defaults.heartbeat.every`，OpenClaw 不會覆寫它們。此自動預設值只會對 Anthropic 系列驗證觸發；其他提供者除非你自行設定，否則修剪會是 `off`。

## 啟用或停用

非 Anthropic 提供者預設會關閉修剪。若要啟用：

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

若要停用：設定 `mode: "off"`。

## 修剪與壓縮

|            | 修剪             | 壓縮                 |
| ---------- | ---------------- | -------------------- |
| **內容**   | 修剪工具結果     | 摘要對話             |
| **儲存？** | 否（逐請求）     | 是（在逐字稿中）     |
| **範圍**   | 僅工具結果       | 整個對話             |

兩者彼此互補 -- 修剪會讓壓縮週期之間的工具輸出保持精簡。

## 延伸閱讀

- [壓縮](/zh-TW/concepts/compaction)：以摘要為基礎的上下文縮減
- [閘道設定](/zh-TW/gateway/configuration)：所有修剪設定旋鈕（`contextPruning.*`）

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段工具](/zh-TW/concepts/session-tool)
- [上下文引擎](/zh-TW/concepts/context-engine)
