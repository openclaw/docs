---
read_when:
    - 你想了解自動 Compaction 和 /compact
    - 你正在偵錯長時間工作階段達到上下文限制的問題
summary: OpenClaw 如何摘要長對話以維持在模型限制內
title: Compaction
x-i18n:
    generated_at: "2026-05-02T02:47:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f8e6f372508a0f5421654d3e2a694695eb8a7fda4e3928159bf8f08b2a2156b
    source_path: concepts/compaction.md
    workflow: 16
---

每個模型都有一個上下文視窗：也就是它可以處理的 token 最大數量。當對話接近該限制時，OpenClaw 會將較早的訊息 **Compaction** 成摘要，讓聊天可以繼續。

## 運作方式

1. 較早的對話回合會被摘要成一個精簡項目。
2. 摘要會儲存在工作階段逐字稿中。
3. 最近的訊息會保持完整。

當 OpenClaw 將歷史分割成 Compaction 區塊時，會讓 assistant 工具呼叫與其對應的 `toolResult` 項目保持成對。如果分割點落在工具區塊內，OpenClaw 會移動邊界，讓這一對保持在一起，並保留目前未摘要的尾端內容。

完整的對話歷史會保留在磁碟上。Compaction 只會改變模型在下一回合看到的內容。

## 自動 Compaction

自動 Compaction 預設為開啟。它會在工作階段接近上下文限制時執行，或在模型回傳上下文溢位錯誤時執行（在這種情況下，OpenClaw 會執行 Compaction 並重試）。

你會看到：

- 詳細模式中的 `🧹 Auto-compaction complete`。
- `/status` 顯示 `🧹 Compactions: <count>`。

<Info>
在執行 Compaction 前，OpenClaw 會自動提醒 agent 將重要筆記儲存到 [memory](/zh-TW/concepts/memory) 檔案。這可避免上下文遺失。
</Info>

<AccordionGroup>
  <Accordion title="可辨識的溢位特徵">
    OpenClaw 會從這些 provider 錯誤模式偵測上下文溢位：

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

當設定 `agents.defaults.compaction.keepRecentTokens` 時，手動 Compaction 會遵循該 Pi 切點，並在重建的上下文中保留最近的尾端內容。若沒有明確的保留預算，手動 Compaction 會作為硬性檢查點，並只從新的摘要繼續。

## 設定

請在 `openclaw.json` 的 `agents.defaults.compaction` 下設定 Compaction。以下列出最常用的控制項；完整參考請參閱[工作階段管理深度解析](/zh-TW/reference/session-management-compaction)。

### 使用不同模型

預設情況下，Compaction 會使用 agent 的主要模型。設定 `agents.defaults.compaction.model` 可將摘要工作委派給能力更強或更專門的模型。此覆寫接受任何 `provider/model-id` 字串：

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

未設定時，Compaction 會從作用中工作階段模型開始。如果摘要因符合模型備援條件的 provider 錯誤而失敗，OpenClaw 會透過該工作階段現有的模型備援鏈重試該次 Compaction。備援選擇是暫時性的，不會寫回工作階段狀態。明確的 `agents.defaults.compaction.model` 覆寫會保持精確，且不會繼承工作階段備援鏈。

### 識別碼保留

Compaction 摘要預設會保留不透明識別碼（`identifierPolicy: "strict"`）。可用 `identifierPolicy: "off"` 停用，或使用 `identifierPolicy: "custom"` 搭配 `identifierInstructions` 進行自訂指引。

### 作用中逐字稿位元組保護

設定 `agents.defaults.compaction.maxActiveTranscriptBytes` 時，如果作用中的 JSONL 達到該大小，OpenClaw 會在執行前觸發一般本機 Compaction。這對長時間執行的工作階段很有用，因為 provider 端的上下文管理可能讓模型上下文維持健康，而本機逐字稿仍持續成長。它不會分割原始 JSONL 位元組；它會要求一般 Compaction 管線建立語意摘要。

<Warning>
位元組保護需要 `truncateAfterCompaction: true`。如果沒有逐字稿輪替，作用中檔案不會縮小，保護機制也會維持停用。
</Warning>

### 後繼逐字稿

啟用 `agents.defaults.compaction.truncateAfterCompaction` 時，OpenClaw 不會就地重寫現有逐字稿。它會從 Compaction 摘要、保留狀態和未摘要尾端內容建立新的作用中後繼逐字稿，然後將先前的 JSONL 保留為封存的檢查點來源。
後繼逐字稿也會移除在短重試視窗內送達的完全重複長篇使用者回合，因此通道重試風暴不會在 Compaction 後被帶入下一個作用中逐字稿。

Compaction 前檢查點只會在低於 OpenClaw 的檢查點大小上限時保留；過大的作用中逐字稿仍會進行 Compaction，但 OpenClaw 會略過大型除錯快照，而不是讓磁碟用量加倍。

### Compaction 通知

預設情況下，Compaction 會安靜執行。設定 `notifyUser` 可在 Compaction 開始和完成時顯示簡短狀態訊息：

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

在 Compaction 前，OpenClaw 可以執行一次**靜默記憶體清除**回合，將可持久保存的筆記儲存到磁碟。當這個內務處理回合應使用本機模型，而不是作用中對話模型時，請設定 `agents.defaults.compaction.memoryFlush.model`：

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

記憶體清除模型覆寫是精確的，且不會繼承作用中工作階段備援鏈。詳細資訊與設定請參閱 [Memory](/zh-TW/concepts/memory)。

## 可插拔 Compaction provider

Plugin 可以透過 plugin API 上的 `registerCompactionProvider()` 註冊自訂 Compaction provider。註冊並設定 provider 後，OpenClaw 會將摘要工作委派給它，而不是使用內建 LLM 管線。

若要使用已註冊的 provider，請在設定中指定其 id：

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

設定 `provider` 會自動強制 `mode: "safeguard"`。Provider 會收到與內建路徑相同的 Compaction 指示和識別碼保留策略，而 OpenClaw 仍會在 provider 輸出後保留最近回合與分割回合的後綴上下文。

<Note>
如果 provider 失敗或回傳空結果，OpenClaw 會退回使用內建 LLM 摘要。
</Note>

## Compaction 與修剪

|                  | Compaction                    | 修剪                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **作用**         | 摘要較早的對話                | 修剪舊工具結果                   |
| **是否儲存？**   | 是（在工作階段逐字稿中）      | 否（僅記憶體內，每個請求各自處理） |
| **範圍**         | 整個對話                      | 僅工具結果                       |

[工作階段修剪](/zh-TW/concepts/session-pruning)是一個較輕量的補充功能，可在不進行摘要的情況下修剪工具輸出。

## 疑難排解

**Compaction 太頻繁？** 模型的上下文視窗可能太小，或工具輸出可能太大。請嘗試啟用[工作階段修剪](/zh-TW/concepts/session-pruning)。

**Compaction 後上下文感覺過時？** 使用 `/compact Focus on <topic>` 引導摘要，或啟用 [memory flush](/zh-TW/concepts/memory)，讓筆記得以保留。

**需要乾淨的新開始？** `/new` 會啟動全新的工作階段，而不執行 Compaction。

如需進階設定（保留 token、識別碼保留、自訂上下文引擎、OpenAI 伺服器端 Compaction），請參閱[工作階段管理深度解析](/zh-TW/reference/session-management-compaction)。

## 相關

- [Session](/zh-TW/concepts/session)：工作階段管理與生命週期。
- [Session pruning](/zh-TW/concepts/session-pruning)：修剪工具結果。
- [Context](/zh-TW/concepts/context)：如何為 agent 回合建立上下文。
- [Hooks](/zh-TW/automation/hooks)：Compaction 生命週期 hooks（`before_compaction`、`after_compaction`）。
