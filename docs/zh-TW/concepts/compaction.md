---
read_when:
    - 你想了解自動壓縮與 /compact
    - 你正在偵錯觸及上下文限制的長時間工作階段
summary: OpenClaw 如何摘要長對話以維持在模型限制內
title: 壓縮
x-i18n:
    generated_at: "2026-06-27T19:10:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

每個模型都有一個脈絡視窗：它能處理的最大 token 數。當對話接近該限制時，OpenClaw 會將較舊的訊息**壓縮**成摘要，讓聊天可以繼續。

## 運作方式

1. 較舊的對話回合會被摘要成一個精簡項目。
2. 摘要會儲存在工作階段對話記錄中。
3. 最近的訊息會保持完整。

當 OpenClaw 將歷史切分為壓縮區塊時，它會讓助理工具呼叫與其對應的 `toolResult` 項目保持配對。如果切分點落在工具區塊內，OpenClaw 會移動邊界，讓配對留在一起，並保留目前尚未摘要的尾端內容。

完整的對話歷史會保留在磁碟上。壓縮只會變更模型在下一回合看到的內容。

## 自動壓縮

自動壓縮預設為開啟。它會在工作階段接近脈絡限制時執行，或在模型傳回脈絡溢位錯誤時執行（此時 OpenClaw 會壓縮並重試）。

你會看到：

- 一般閘道記錄中的 `embedded run auto-compaction start` / `complete`。
- 詳細模式中的 `🧹 自動壓縮完成`。
- `/status` 顯示 `🧹 壓縮次數：<count>`。

<Info>
壓縮前，OpenClaw 會自動提醒代理將重要筆記儲存到 [memory](/zh-TW/concepts/memory) 檔案。這可避免脈絡遺失。
</Info>

<AccordionGroup>
  <Accordion title="Recognized overflow signatures">
    OpenClaw 會從這些提供者錯誤模式偵測脈絡溢位：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手動壓縮

在任何聊天中輸入 `/compact` 以強制壓縮。加入指示來引導摘要：

```
/compact Focus on the API design decisions
```

設定 `agents.defaults.compaction.keepRecentTokens` 時，手動壓縮會遵循該 OpenClaw 切分點，並在重建的脈絡中保留最近尾端內容。若沒有明確的保留預算，手動壓縮會作為硬檢查點，並僅從新的摘要繼續。

## 設定

在你的 `openclaw.json` 中，於 `agents.defaults.compaction` 下設定壓縮。最常用的調整項列在下方；完整參考請見[工作階段管理深入說明](/zh-TW/reference/session-management-compaction)。

### 使用不同模型

預設情況下，壓縮會使用代理的主要模型。設定 `agents.defaults.compaction.model` 可將摘要委派給更強大或更專門的模型。覆寫值接受 `provider/model-id` 字串，或是在 `agents.defaults.models` 下設定的裸別名：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

裸設定別名會在壓縮開始前解析為其標準提供者與模型。如果裸值同時符合別名與已設定的字面模型 ID，字面模型 ID 優先。未符合的裸值會保留為作用中提供者上的模型 ID。

這也適用於本機模型，例如專門用於摘要的第二個 Ollama 模型：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

未設定時，壓縮會從作用中工作階段模型開始。如果摘要因符合模型備援資格的提供者錯誤而失敗，OpenClaw 會透過工作階段現有的模型備援鏈重試該次壓縮嘗試。備援選擇是暫時的，不會寫回工作階段狀態。明確的 `agents.defaults.compaction.model` 覆寫會保持精確，且不會繼承工作階段備援鏈。

### 識別碼保留

壓縮摘要預設會保留不透明識別碼（`identifierPolicy: "strict"`）。使用 `identifierPolicy: "off"` 可停用，或使用 `identifierPolicy: "custom"` 加上 `identifierInstructions` 來提供自訂指引。

### 作用中對話記錄位元組防護

設定 `agents.defaults.compaction.maxActiveTranscriptBytes` 時，如果作用中的 JSONL 達到該大小，OpenClaw 會在執行前觸發一般本機壓縮。這適用於長時間執行的工作階段，其中提供者端脈絡管理可能讓模型脈絡保持健康，但本機對話記錄持續成長。它不會切分原始 JSONL 位元組；它會要求一般壓縮管線建立語意摘要。

<Warning>
位元組防護需要 `truncateAfterCompaction: true`。若沒有對話記錄輪替，作用中檔案不會縮小，防護也會保持停用。
</Warning>

### 後繼對話記錄

啟用 `agents.defaults.compaction.truncateAfterCompaction` 時，OpenClaw 不會就地重寫現有對話記錄。它會從壓縮摘要、保留的狀態與尚未摘要的尾端內容建立新的作用中後繼對話記錄，然後記錄檢查點中繼資料，將分支/還原流程指向該已壓縮的後繼記錄。
後繼對話記錄也會移除在短暫重試視窗內抵達的完全重複長使用者回合，因此通道重試風暴不會在壓縮後被帶入下一個作用中對話記錄。

OpenClaw 不再為新的壓縮寫入獨立的 `.checkpoint.*.jsonl` 副本。現有舊版檢查點檔案在仍被參照時仍可使用，並會由一般工作階段清理進行修剪。

### 壓縮通知

預設情況下，壓縮會靜默執行。設定 `notifyUser` 可在壓縮開始與完成時顯示簡短狀態訊息：

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

### 記憶體清理

壓縮前，OpenClaw 可以執行一個**靜默記憶體清理**回合，將持久筆記儲存到磁碟。當這個維護回合應使用本機模型而非作用中對話模型時，請設定 `agents.defaults.compaction.memoryFlush.model`：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

記憶體清理模型覆寫是精確的，且不會繼承作用中工作階段備援鏈。詳細資料與設定請見[記憶體](/zh-TW/concepts/memory)。

## 可插拔壓縮提供者

外掛可以透過外掛 API 上的 `registerCompactionProvider()` 註冊自訂壓縮提供者。當提供者已註冊並設定時，OpenClaw 會將摘要委派給它，而不是使用內建 LLM 管線。

若要使用已註冊的提供者，請在設定中指定其 ID：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

設定 `provider` 會自動強制 `mode: "safeguard"`。提供者會收到與內建路徑相同的壓縮指示與識別碼保留政策，且 OpenClaw 仍會在提供者輸出後保留最近回合與分割回合的尾碼脈絡。

<Note>
如果提供者失敗或傳回空結果，OpenClaw 會退回使用內建 LLM 摘要。
</Note>

## 壓縮與修剪

|                  | 壓縮                          | 修剪                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **作用**         | 摘要較舊的對話                | 修剪舊的工具結果                 |
| **是否儲存？**   | 是（在工作階段對話記錄中）    | 否（僅記憶體中，每次請求）       |
| **範圍**         | 整個對話                      | 僅工具結果                       |

[工作階段修剪](/zh-TW/concepts/session-pruning)是較輕量的補充功能，可在不摘要的情況下修剪工具輸出。

## 疑難排解

**壓縮太頻繁？** 模型的脈絡視窗可能很小，或工具輸出可能很大。請嘗試啟用[工作階段修剪](/zh-TW/concepts/session-pruning)。

**壓縮後脈絡感覺過時？** 使用 `/compact Focus on <topic>` 來引導摘要，或啟用[記憶體清理](/zh-TW/concepts/memory)，讓筆記得以保留。

**需要全新開始？** `/new` 會啟動新的工作階段而不進行壓縮。

進階設定（保留 token、識別碼保留、自訂脈絡引擎、OpenAI 伺服器端壓縮）請見[工作階段管理深入說明](/zh-TW/reference/session-management-compaction)。

## 相關

- [工作階段](/zh-TW/concepts/session)：工作階段管理與生命週期。
- [工作階段修剪](/zh-TW/concepts/session-pruning)：修剪工具結果。
- [脈絡](/zh-TW/concepts/context)：如何為代理回合建立脈絡。
- [鉤子](/zh-TW/automation/hooks)：壓縮生命週期鉤子（`before_compaction`、`after_compaction`）。
