---
read_when:
    - 你想了解自動 Compaction 和 /compact
    - 你正在偵錯達到上下文限制的長時間工作階段
summary: OpenClaw 如何摘要長對話以維持在模型限制內
title: Compaction
x-i18n:
    generated_at: "2026-04-30T02:58:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9beac513a8226a7dd107cdc3a7bfd7550d87e98648004c80487db968c57742d4
    source_path: concepts/compaction.md
    workflow: 16
---

每個模型都有一個內容視窗：它能處理的最大 token 數。當對話接近該限制時，OpenClaw 會將較舊的訊息 **Compaction** 成摘要，讓聊天可以繼續。

## 運作方式

1. 較舊的對話回合會被摘要成一個精簡項目。
2. 摘要會儲存在工作階段轉錄中。
3. 近期訊息會保持完整。

當 OpenClaw 將歷史記錄切分為 Compaction 區塊時，會讓 assistant 工具呼叫與其對應的 `toolResult` 項目保持配對。如果切分點落在工具區塊內，OpenClaw 會移動邊界，讓配對保持在一起，並保留目前未摘要的尾端內容。

完整對話歷史會保留在磁碟上。Compaction 只會改變模型在下一回合看到的內容。

## 自動 Compaction

自動 Compaction 預設為開啟。它會在工作階段接近內容限制時執行，或在模型回傳內容溢位錯誤時執行（此時 OpenClaw 會進行 Compaction 並重試）。

你會看到：

- verbose 模式中的 `🧹 Auto-compaction complete`。
- `/status` 顯示 `🧹 Compactions: <count>`。

<Info>
進行 Compaction 前，OpenClaw 會自動提醒 agent 將重要筆記儲存到 [memory](/zh-TW/concepts/memory) 檔案。這可避免內容遺失。
</Info>

<AccordionGroup>
  <Accordion title="Recognized overflow signatures">
    OpenClaw 會從這些提供者錯誤模式偵測內容溢位：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手動 Compaction

在任何聊天中輸入 `/compact` 以強制進行 Compaction。加入指示來引導摘要：

```
/compact Focus on the API design decisions
```

設定 `agents.defaults.compaction.keepRecentTokens` 時，手動 Compaction 會遵循該 Pi 切分點，並在重建內容中保留近期尾端。若沒有明確的保留預算，手動 Compaction 會作為硬性檢查點，並僅從新的摘要繼續。

## 設定

在你的 `openclaw.json` 中，於 `agents.defaults.compaction` 下設定 Compaction。最常用的調整項列於下方；完整參考請見[工作階段管理深入說明](/zh-TW/reference/session-management-compaction)。

### 使用不同的模型

預設情況下，Compaction 會使用 agent 的主要模型。設定 `agents.defaults.compaction.model` 可將摘要委派給更有能力或更專門的模型。覆寫值接受任何 `provider/model-id` 字串：

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

未設定時，Compaction 會使用 agent 的主要模型。

### 識別碼保留

Compaction 摘要預設會保留不透明識別碼（`identifierPolicy: "strict"`）。可用 `identifierPolicy: "off"` 停用，或使用 `identifierPolicy: "custom"` 加上 `identifierInstructions` 提供自訂指引。

### 作用中轉錄位元組保護

設定 `agents.defaults.compaction.maxActiveTranscriptBytes` 時，如果作用中的 JSONL 達到該大小，OpenClaw 會在執行前觸發一般本機 Compaction。這對長時間執行的工作階段很有用，因為提供者端內容管理可能讓模型內容保持健康，但本機轉錄會持續成長。它不會切分原始 JSONL 位元組；它會要求一般 Compaction 管線建立語意摘要。

<Warning>
位元組保護需要 `truncateAfterCompaction: true`。若沒有轉錄輪替，作用中文件不會縮小，保護也會維持停用。
</Warning>

### 後續轉錄

啟用 `agents.defaults.compaction.truncateAfterCompaction` 時，OpenClaw 不會在原處重寫既有轉錄。它會從 Compaction 摘要、保留狀態與未摘要尾端建立新的作用中後續轉錄，然後將先前的 JSONL 保留為封存檢查點來源。
後續轉錄也會捨棄在短暫重試視窗內抵達的完全重複長篇使用者回合，因此通道重試風暴不會在 Compaction 後被帶入下一個作用中轉錄。

Compaction 前檢查點只會在低於 OpenClaw 的檢查點大小上限時保留；過大的作用中轉錄仍會進行 Compaction，但 OpenClaw 會略過大型除錯快照，而不是讓磁碟用量加倍。

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

### 記憶體清理

在 Compaction 前，OpenClaw 可以執行一個 **靜默記憶體清理** 回合，將持久筆記儲存到磁碟。當這個內務回合應使用本機模型而非作用中對話模型時，請設定 `agents.defaults.compaction.memoryFlush.model`：

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

記憶體清理模型覆寫是精確的，且不會繼承作用中工作階段的備援鏈。詳細資訊與設定請見 [Memory](/zh-TW/concepts/memory)。

## 可插拔的 Compaction 提供者

Plugin 可以透過 Plugin API 上的 `registerCompactionProvider()` 註冊自訂 Compaction 提供者。當提供者已註冊並設定時，OpenClaw 會將摘要委派給它，而不是使用內建 LLM 管線。

若要使用已註冊的提供者，請在設定中指定其 id：

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

設定 `provider` 會自動強制 `mode: "safeguard"`。提供者會收到與內建路徑相同的 Compaction 指示與識別碼保留政策，而 OpenClaw 在提供者輸出後仍會保留近期回合與切分回合的後綴內容。

<Note>
如果提供者失敗或回傳空結果，OpenClaw 會退回使用內建 LLM 摘要。
</Note>

## Compaction 與剪除

|                  | Compaction                    | 剪除                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **作用**         | 摘要較舊的對話                | 修剪舊工具結果                   |
| **是否儲存？**   | 是（在工作階段轉錄中）        | 否（僅在記憶體中，逐請求）       |
| **範圍**         | 整個對話                      | 僅工具結果                       |

[工作階段剪除](/zh-TW/concepts/session-pruning)是較輕量的補充功能，會在不摘要的情況下修剪工具輸出。

## 疑難排解

**太常進行 Compaction？** 模型的內容視窗可能太小，或工具輸出可能太大。請嘗試啟用[工作階段剪除](/zh-TW/concepts/session-pruning)。

**Compaction 後覺得內容陳舊？** 使用 `/compact Focus on <topic>` 引導摘要，或啟用[記憶體清理](/zh-TW/concepts/memory)，讓筆記得以保留。

**需要乾淨起點？** `/new` 會在不進行 Compaction 的情況下開始新的工作階段。

如需進階設定（保留 token、識別碼保留、自訂內容引擎、OpenAI 伺服器端 Compaction），請參閱[工作階段管理深入說明](/zh-TW/reference/session-management-compaction)。

## 相關

- [工作階段](/zh-TW/concepts/session)：工作階段管理與生命週期。
- [工作階段剪除](/zh-TW/concepts/session-pruning)：修剪工具結果。
- [內容](/zh-TW/concepts/context)：如何為 agent 回合建立內容。
- [Hooks](/zh-TW/automation/hooks)：Compaction 生命週期 hooks（`before_compaction`、`after_compaction`）。
