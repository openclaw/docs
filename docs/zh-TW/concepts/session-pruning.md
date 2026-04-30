---
read_when:
    - 您想減少工具輸出造成的上下文增長
    - 你想了解 Anthropic 提示快取最佳化
summary: 精簡舊的工具結果，以保持上下文精簡並提高快取效率
title: 工作階段修剪
x-i18n:
    generated_at: "2026-04-30T03:02:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ea07f0ae23076906e2ff0246ac75813572f98cffa50afddb6a6b0af8964c4a9
    source_path: concepts/session-pruning.md
    workflow: 16
---

工作階段修剪會在每次 LLM 呼叫前，從上下文中裁剪**舊的工具結果**。它會減少累積工具輸出（執行結果、檔案讀取、搜尋結果）造成的上下文膨脹，而不會重寫一般對話文字。

<Info>
修剪只在記憶體中進行 -- 它不會修改磁碟上的工作階段逐字稿。你的完整歷史記錄一律會保留。
</Info>

## 為何重要

長時間工作階段會累積工具輸出，使上下文視窗膨脹。這會增加成本，並可能比必要時更早觸發 [Compaction](/zh-TW/concepts/compaction)。

修剪對 **Anthropic 提示快取**特別有價值。快取 TTL 到期後，下一個請求會重新快取完整提示。修剪會減少快取寫入大小，直接降低成本。

## 運作方式

1. 等待快取 TTL 到期（預設 5 分鐘）。
2. 尋找舊的工具結果以進行一般修剪（對話文字保持不變）。
3. **軟修剪**過大的結果 -- 保留開頭和結尾，插入 `...`。
4. **硬清除**其餘內容 -- 以佔位符取代。
5. 重設 TTL，讓後續請求重用新的快取。

## 舊版圖片清理

OpenClaw 也會為在歷史記錄中保留原始圖片區塊或提示補水媒體標記的工作階段，建立獨立的冪等重播檢視。

- 它會逐位元組保留**最近 3 個已完成回合**，讓近期後續請求的提示快取前綴保持穩定。
- 在重播檢視中，來自 `user` 或 `toolResult` 歷史記錄中較舊且已處理的圖片區塊，可以替換為 `[image data removed - already processed by model]`。
- 較舊的文字媒體參照，例如 `[media attached: ...]`、`[Image: source: ...]` 和 `media://inbound/...`，可以替換為 `[media reference removed - already processed by model]`。目前回合的附件標記會保持完整，讓視覺模型仍可補水新的圖片。
- 原始工作階段逐字稿不會被重寫，因此歷史檢視器仍可呈現原始訊息項目及其圖片。
- 這與一般的快取 TTL 修剪不同。它的存在是為了阻止重複圖片酬載或過期媒體參照在後續回合破壞提示快取。

## 智慧預設值

OpenClaw 會為 Anthropic 設定檔自動啟用修剪：

| 設定檔類型                                            | 已啟用修剪 | Heartbeat |
| ------------------------------------------------------- | --------------- | --------- |
| Anthropic OAuth/權杖驗證（包括 Claude CLI 重用） | 是             | 1 小時    |
| API 金鑰                                                 | 是             | 30 分鐘    |

如果你設定了明確值，OpenClaw 不會覆寫它們。

## 啟用或停用

非 Anthropic 提供者預設會停用修剪。若要啟用：

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

## 修剪與 Compaction

|            | 修剪            | Compaction              |
| ---------- | ------------------ | ----------------------- |
| **內容**   | 裁剪工具結果 | 摘要對話 |
| **已儲存？** | 否（每個請求）   | 是（在逐字稿中）     |
| **範圍**  | 僅工具結果  | 整個對話     |

兩者相輔相成 -- 修剪能在 Compaction 週期之間讓工具輸出保持精簡。

## 延伸閱讀

- [Compaction](/zh-TW/concepts/compaction) -- 基於摘要的上下文縮減
- [Gateway 設定](/zh-TW/gateway/configuration) -- 所有修剪設定旋鈕
  (`contextPruning.*`)

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段工具](/zh-TW/concepts/session-tool)
- [上下文引擎](/zh-TW/concepts/context-engine)
