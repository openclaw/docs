---
read_when:
    - 你想了解自動 Compaction 和 /compact
    - 你正在偵錯觸及上下文限制的長時間工作階段
summary: OpenClaw 如何摘要長對話以維持在模型限制範圍內
title: Compaction
x-i18n:
    generated_at: "2026-05-11T20:26:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: edef60498a1e91405bd42d5e6eb4883719487f6d6f40936c4168e8bc5f40a39a
    source_path: concepts/compaction.md
    workflow: 16
---

每個模型都有一個上下文視窗：也就是它能處理的最大詞元數。當對話接近該限制時，OpenClaw 會將較舊的訊息 **Compaction** 成摘要，讓聊天可以繼續。

## 運作方式

1. 較舊的對話回合會被摘要成一個精簡項目。
2. 摘要會儲存在工作階段逐字稿中。
3. 近期訊息會保持完整。

當 OpenClaw 將歷史記錄拆分為 Compaction 區塊時，會讓助理工具呼叫與其對應的 `toolResult` 項目保持配對。如果拆分點落在工具區塊內，OpenClaw 會移動邊界，讓配對保持在一起，並保留目前未摘要的尾端內容。

完整的對話歷史記錄會留在磁碟上。Compaction 只會改變模型在下一回合看到的內容。

## 自動 Compaction

自動 Compaction 預設為開啟。它會在工作階段接近上下文限制時執行，或在模型回傳上下文溢位錯誤時執行（此時 OpenClaw 會執行 Compaction 並重試）。

你會看到：

- 一般 Gateway 記錄中的 `embedded run auto-compaction start` / `complete`。
- 詳細模式中的 `🧹 Auto-compaction complete`。
- `/status` 顯示 `🧹 Compactions: <count>`。

<Info>
在執行 Compaction 之前，OpenClaw 會自動提醒代理程式將重要筆記儲存到 [memory](/zh-TW/concepts/memory) 檔案。這可防止上下文遺失。
</Info>

<AccordionGroup>
  <Accordion title="已辨識的溢位特徵">
    OpenClaw 會從這些提供者錯誤模式偵測上下文溢位：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手動 Compaction

在任何聊天中輸入 `/compact` 以強制執行 Compaction。加入指示來引導摘要：

```
/compact Focus on the API design decisions
```

設定 `agents.defaults.compaction.keepRecentTokens` 時，手動 Compaction 會遵循該 Pi 切分點，並在重建的上下文中保留近期尾端內容。若沒有明確的保留預算，手動 Compaction 會作為硬性檢查點，並只從新的摘要繼續。

## 設定

請在 `openclaw.json` 的 `agents.defaults.compaction` 下設定 Compaction。以下列出最常用的調整項目；完整參考請見 [工作階段管理深入說明](/zh-TW/reference/session-management-compaction)。

### 使用不同模型

預設情況下，Compaction 會使用代理程式的主要模型。設定 `agents.defaults.compaction.model` 可將摘要委派給能力更強或更專門的模型。覆寫值接受任何 `provider/model-id` 字串：

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

未設定時，Compaction 會從作用中的工作階段模型開始。如果摘要因符合模型備援條件的提供者錯誤而失敗，OpenClaw 會透過工作階段現有的模型備援鏈重試該次 Compaction。備援選擇是暫時的，不會寫回工作階段狀態。明確的 `agents.defaults.compaction.model` 覆寫會保持精確，且不會繼承工作階段備援鏈。

### 識別碼保留

Compaction 摘要預設會保留不透明識別碼（`identifierPolicy: "strict"`）。可用 `identifierPolicy: "off"` 停用，或使用 `identifierPolicy: "custom"` 搭配 `identifierInstructions` 提供自訂指引。

### 作用中逐字稿位元組防護

設定 `agents.defaults.compaction.maxActiveTranscriptBytes` 時，如果作用中的 JSONL 達到該大小，OpenClaw 會在執行前觸發一般本機 Compaction。這對長時間執行的工作階段很有用，因為提供者端的上下文管理可能讓模型上下文保持健康，但本機逐字稿仍持續增長。它不會直接拆分原始 JSONL 位元組；它會要求一般 Compaction 管線建立語意摘要。

<Warning>
位元組防護需要 `truncateAfterCompaction: true`。若沒有逐字稿輪替，作用中檔案不會縮小，防護也會維持停用。
</Warning>

### 後繼逐字稿

啟用 `agents.defaults.compaction.truncateAfterCompaction` 時，OpenClaw 不會就地重寫既有逐字稿。它會從 Compaction 摘要、保留狀態與未摘要尾端內容建立新的作用中後繼逐字稿，然後將先前的 JSONL 保留為已封存的檢查點來源。
後繼逐字稿也會移除在短重試視窗內抵達的完全重複長使用者回合，因此通道重試風暴不會在 Compaction 後被帶入下一個作用中逐字稿。

Compaction 前檢查點只會在低於 OpenClaw 的檢查點大小上限時保留；過大的作用中逐字稿仍會進行 Compaction，但 OpenClaw 會略過大型除錯快照，而不是讓磁碟用量倍增。

### Compaction 通知

預設情況下，Compaction 會靜默執行。設定 `notifyUser` 可在 Compaction 開始與完成時顯示簡短狀態訊息：

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

### 記憶體清除

在 Compaction 之前，OpenClaw 可以執行一次 **靜默記憶體清除** 回合，將持久筆記儲存到磁碟。當這個維護回合應使用本機模型而非作用中對話模型時，請設定 `agents.defaults.compaction.memoryFlush.model`：

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

記憶體清除模型覆寫是精確的，且不會繼承作用中工作階段備援鏈。詳細資訊與設定請見 [記憶體](/zh-TW/concepts/memory)。

## 可插拔 Compaction 提供者

Plugin 可以透過 Plugin API 上的 `registerCompactionProvider()` 註冊自訂 Compaction 提供者。當提供者已註冊並設定時，OpenClaw 會將摘要委派給它，而不是使用內建 LLM 管線。

若要使用已註冊的提供者，請在設定中設定其 ID：

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

設定 `provider` 會自動強制 `mode: "safeguard"`。提供者會收到與內建路徑相同的 Compaction 指示與識別碼保留政策，且 OpenClaw 仍會在提供者輸出後保留近期回合與拆分回合的後綴上下文。

<Note>
如果提供者失敗或回傳空結果，OpenClaw 會退回使用內建 LLM 摘要。
</Note>

## Compaction 與修剪

|                  | Compaction                    | 修剪                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **作用**         | 摘要較舊的對話                | 裁剪舊的工具結果                 |
| **是否儲存？**   | 是（在工作階段逐字稿中）      | 否（僅在記憶體中、每個請求各自處理） |
| **範圍**         | 整個對話                      | 僅工具結果                       |

[工作階段修剪](/zh-TW/concepts/session-pruning) 是較輕量的補充功能，可在不摘要的情況下裁剪工具輸出。

## 疑難排解

**Compaction 太頻繁？** 模型的上下文視窗可能很小，或工具輸出可能很大。請嘗試啟用 [工作階段修剪](/zh-TW/concepts/session-pruning)。

**Compaction 後上下文感覺過時？** 使用 `/compact Focus on <topic>` 來引導摘要，或啟用 [記憶體清除](/zh-TW/concepts/memory) 讓筆記保留下來。

**需要全新開始？** `/new` 會啟動新的工作階段，而不執行 Compaction。

進階設定（保留詞元、識別碼保留、自訂上下文引擎、OpenAI 伺服器端 Compaction）請見 [工作階段管理深入說明](/zh-TW/reference/session-management-compaction)。

## 相關

- [工作階段](/zh-TW/concepts/session)：工作階段管理與生命週期。
- [工作階段修剪](/zh-TW/concepts/session-pruning)：裁剪工具結果。
- [上下文](/zh-TW/concepts/context)：如何為代理程式回合建立上下文。
- [Hook](/zh-TW/automation/hooks)：Compaction 生命週期 Hook（`before_compaction`、`after_compaction`）。
