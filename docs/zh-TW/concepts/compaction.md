---
read_when:
    - 你想了解自動壓縮和 /compact
    - 您正在偵錯觸及上下文限制的長時間工作階段
summary: OpenClaw 如何摘要長對話以維持在模型限制內
title: 壓縮
x-i18n:
    generated_at: "2026-07-05T11:14:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c28a6b7c34872d23fa302ca42310928b862637ce7af4d742411a26dd868637fa
    source_path: concepts/compaction.md
    workflow: 16
---

每個模型都有一個上下文視窗：也就是它能處理的最大 token 數。當對話接近該限制時，OpenClaw 會將較舊的訊息**壓縮**成摘要，讓聊天可以繼續。

## 運作方式

1. 較舊的對話輪次會被摘要成一個精簡項目。
2. 摘要會儲存在工作階段逐字稿中。
3. 近期訊息會保持完整。

OpenClaw 選擇壓縮分割點時，會讓助理工具呼叫與其對應的 `toolResult` 項目保持配對。如果分割點落在工具區塊內，OpenClaw 會移動邊界，讓配對保持在一起，並保留目前未摘要的尾端內容。

完整對話歷史會保留在磁碟上。壓縮只會改變模型在下一輪看到的內容。

<Note>
新設定預設將 `agents.defaults.compaction.mode` 設為 `"safeguard"`（更嚴格的防護機制、摘要品質稽核）。明確設定 `mode: "default"` 可選擇退出。
</Note>

## 自動壓縮

自動壓縮預設為開啟。它會在工作階段接近上下文限制時執行，或在模型回傳上下文溢位錯誤時執行（此時 OpenClaw 會壓縮並重試）。

你會看到：

- 一般閘道記錄中的 `embedded run auto-compaction start` / `complete`。
- 詳細模式中的 `🧹 Auto-compaction complete`。
- `/status` 顯示 `🧹 Compactions: <count>`。

<Info>
壓縮前，OpenClaw 會自動提醒代理將重要筆記儲存到[記憶](/zh-TW/concepts/memory)檔案。這可防止上下文遺失。
</Info>

<AccordionGroup>
  <Accordion title="OpenClaw 可辨識的溢位錯誤模式">
    OpenClaw 會比對數十種供應商特定的溢位錯誤字串（Anthropic、OpenAI、Bedrock、Gemini、Ollama、OpenRouter 等）。常見範例：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`（Bedrock）
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手動壓縮

在任何聊天中輸入 `/compact` 以強制壓縮。加入指示以引導摘要：

```text
/compact Focus on the API design decisions
```

設定 `agents.defaults.compaction.keepRecentTokens` 時（預設：20,000），手動壓縮會遵循該切分點，並在重建的上下文中保留近期尾端內容。若未明確設定保留預算，手動壓縮會以硬性檢查點的方式運作，並只從新的摘要繼續。

## 設定

在你的 `openclaw.json` 中透過 `agents.defaults.compaction` 設定壓縮。最常用的調整項如下；完整參考請見[工作階段管理深入解析](/zh-TW/reference/session-management-compaction)。

### 使用不同模型

預設情況下，壓縮會使用代理的主要模型。設定 `agents.defaults.compaction.model` 可將摘要委派給能力更強或更專門的模型。覆寫值接受 `provider/model-id` 字串，或在 `agents.defaults.models` 下設定的裸別名：

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

裸設定別名會在壓縮開始前解析為其標準供應商和模型。如果裸值同時符合別名與已設定的字面模型 ID，會以字面模型 ID 優先。未符合的裸值會保留為作用中供應商上的模型 ID。

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

未設定時，壓縮會從作用中工作階段模型開始。如果摘要因符合模型後援條件的供應商錯誤而失敗，OpenClaw 會透過該工作階段既有的模型後援鏈重試該次壓縮。後援選擇是暫時的，不會寫回工作階段狀態。明確的 `agents.defaults.compaction.model` 覆寫會保持精確，且不會繼承工作階段後援鏈。

### 識別碼保留

壓縮摘要預設會保留不透明識別碼（`identifierPolicy: "strict"`）。可用 `identifierPolicy: "off"` 覆寫以停用，或使用 `identifierPolicy: "custom"` 加上 `identifierInstructions` 提供自訂指引。

### 作用中逐字稿位元組防護

設定 `agents.defaults.compaction.maxActiveTranscriptBytes` 時，如果作用中的 JSONL 達到該大小，OpenClaw 會在執行前觸發一般本機壓縮。這對長時間執行的工作階段很有用，因為供應商端上下文管理可能讓模型上下文保持健康，但本機逐字稿仍持續成長。它不會切分原始 JSONL 位元組；它會要求一般壓縮管線建立語意摘要。

<Warning>
位元組防護需要 `truncateAfterCompaction: true`。若沒有逐字稿輪替，作用中檔案不會縮小，防護也會保持未啟用。
</Warning>

### 後繼逐字稿

啟用 `agents.defaults.compaction.truncateAfterCompaction` 時，OpenClaw 不會就地重寫既有逐字稿。它會從壓縮摘要、保留狀態和未摘要尾端內容建立新的作用中後繼逐字稿，然後記錄檢查點中繼資料，讓分支/還原流程指向該已壓縮的後繼項目。
後繼逐字稿也會移除在短重試視窗內到達的完全重複長使用者輪次，因此通道重試風暴不會在壓縮後被帶入下一個作用中逐字稿。

OpenClaw 不再為新的壓縮寫入獨立的 `.checkpoint.*.jsonl` 副本。既有的舊版檢查點檔案在仍被參照時仍可使用，並會由一般工作階段清理進行修剪。

### 壓縮通知

預設情況下，壓縮會靜默執行。設定 `notifyUser` 可在壓縮開始和完成時顯示簡短狀態訊息：

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

### 記憶清除

壓縮前，OpenClaw 可以執行一次**靜默記憶清除**輪次，將持久筆記儲存到磁碟。當這個整理輪次應使用本機模型，而不是作用中對話模型時，請設定 `agents.defaults.compaction.memoryFlush.model`：

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

記憶清除模型覆寫是精確的，且不會繼承作用中工作階段後援鏈。詳情與設定請見[記憶](/zh-TW/concepts/memory)。

## 可插拔壓縮供應商

外掛可以透過外掛 API 上的 `registerCompactionProvider()` 註冊自訂壓縮供應商。當供應商已註冊並設定時，OpenClaw 會將摘要委派給它，而不是使用內建 LLM 管線。

若要使用已註冊的供應商，請在設定中設置其 ID：

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

設定 `provider` 會自動強制 `mode: "safeguard"`。供應商會收到與內建路徑相同的壓縮指示和識別碼保留政策，且 OpenClaw 仍會在供應商輸出後保留近期輪次與分割輪次的後綴上下文。

<Note>
如果供應商失敗或回傳空結果，OpenClaw 會退回使用內建 LLM 摘要。
</Note>

## 壓縮與修剪

|                  | 壓縮                          | 修剪                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **作用**         | 摘要較舊的對話                | 修剪舊工具結果                   |
| **是否儲存？**   | 是（在工作階段逐字稿中）      | 否（僅在記憶體中，每次請求適用） |
| **範圍**         | 整個對話                      | 僅工具結果                       |

[工作階段修剪](/zh-TW/concepts/session-pruning)是一種更輕量的補充方式，可在不摘要的情況下修剪工具輸出。

## 疑難排解

**壓縮太頻繁？** 模型的上下文視窗可能較小，或工具輸出可能很大。請嘗試啟用[工作階段修剪](/zh-TW/concepts/session-pruning)。

**壓縮後覺得上下文過舊？** 使用 `/compact Focus on <topic>` 來引導摘要，或啟用[記憶清除](/zh-TW/concepts/memory)，讓筆記能保留下來。

**需要乾淨的起點？** `/new` 會在不壓縮的情況下開始新的工作階段。

進階設定（保留 token、識別碼保留、自訂上下文引擎、OpenAI 伺服器端壓縮）請見[工作階段管理深入解析](/zh-TW/reference/session-management-compaction)。

## 相關

- [工作階段](/zh-TW/concepts/session)：工作階段管理與生命週期。
- [工作階段修剪](/zh-TW/concepts/session-pruning)：修剪工具結果。
- [上下文](/zh-TW/concepts/context)：如何為代理輪次建立上下文。
- [鉤子](/zh-TW/automation/hooks)：壓縮生命週期鉤子（`before_compaction`、`after_compaction`）。
