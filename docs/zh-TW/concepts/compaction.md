---
read_when:
    - 你想了解自動壓縮和 /compact
    - 你正在偵錯觸及上下文限制的長時間工作階段
summary: OpenClaw 如何摘要長對話以維持在模型限制內
title: 壓縮
x-i18n:
    generated_at: "2026-07-06T10:48:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cfa0d3aec36ae38c04b76f37a2ddf9d6bf81ac6598296096a4c24b349738aaa
    source_path: concepts/compaction.md
    workflow: 16
---

每個模型都有一個上下文視窗：也就是它能處理的最大 Token 數。當對話接近該限制時，OpenClaw 會將較舊的訊息**壓縮**成摘要，讓聊天能繼續進行。

## 運作方式

1. 較舊的對話輪次會被摘要成一個精簡項目。
2. 摘要會儲存在工作階段逐字稿中。
3. 近期訊息會保持完整。

OpenClaw 在選擇壓縮分割點時，會讓助理工具呼叫與其對應的 `toolResult` 項目保持成對。如果該點落在工具區塊內，OpenClaw 會移動邊界，讓配對保持在一起，並保留目前未摘要的尾端。

完整對話歷史仍會保留在磁碟上。壓縮只會改變模型在下一輪看到的內容。

<Note>
新設定預設會將 `agents.defaults.compaction.mode` 設為 `"safeguard"`（更嚴格的防護機制、摘要品質稽核）。若要退出，請明確設定 `mode: "default"`。
</Note>

## 自動壓縮

自動壓縮預設開啟。當工作階段接近上下文限制，或模型回傳上下文溢位錯誤時（此時 OpenClaw 會壓縮並重試），它會執行。

你會看到：

- 一般閘道記錄中的 `embedded run auto-compaction start` / `complete`。
- 詳細模式中的 `🧹 Auto-compaction complete`。
- `/status` 顯示 `🧹 Compactions: <count>`。

<Info>
壓縮前，OpenClaw 會自動提醒代理程式將重要筆記儲存到 [記憶](/zh-TW/concepts/memory) 檔案。這可防止上下文遺失。
</Info>

<AccordionGroup>
  <Accordion title="OpenClaw 可辨識的溢位錯誤模式">
    OpenClaw 會比對數十種供應商特定的溢位錯誤字串（Anthropic、OpenAI、Bedrock、Gemini、Ollama、OpenRouter 等）。常見範例：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens` (Bedrock)
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手動壓縮

在任何聊天中輸入 `/compact` 以強制壓縮。加入指示來引導摘要：

```text
/compact Focus on the API design decisions
```

當已設定 `agents.defaults.compaction.keepRecentTokens`（預設：20,000）時，手動壓縮會遵循該切分點，並在重建的上下文中保留近期尾端。若沒有明確的保留預算，手動壓縮會作為硬性檢查點，並僅從新的摘要繼續。

## 設定

請在 `openclaw.json` 的 `agents.defaults.compaction` 下設定壓縮。最常見的調整項如下；完整參考請見[工作階段管理深入解析](/zh-TW/reference/session-management-compaction)。

### 使用不同模型

預設情況下，壓縮會使用代理程式的主要模型。設定 `agents.defaults.compaction.model`，即可將摘要工作委派給能力更強或更專門的模型。覆寫值可接受 `provider/model-id` 字串，或在 `agents.defaults.models` 下設定的裸別名：

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

裸設定別名會在壓縮開始前解析為其標準供應商和模型。如果裸值同時符合別名與已設定的字面模型 ID，則字面模型 ID 優先。未符合的裸值會保留為作用中供應商上的模型 ID。

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

未設定時，壓縮會從作用中的工作階段模型開始。若摘要因符合模型備援資格的供應商錯誤而失敗，OpenClaw 會透過工作階段現有的模型備援鏈重試該次壓縮。備援選擇是暫時的，不會寫回工作階段狀態。明確的 `agents.defaults.compaction.model` 覆寫會保持精確，不會繼承工作階段備援鏈。

### 識別碼保留

壓縮摘要預設會保留不透明識別碼（`identifierPolicy: "strict"`）。使用 `identifierPolicy: "off"` 覆寫可停用，或使用 `identifierPolicy: "custom"` 搭配 `identifierInstructions` 提供自訂指引。

### 作用中逐字稿位元組防護

設定 `agents.defaults.compaction.maxActiveTranscriptBytes` 時，如果作用中的 JSONL 達到該大小，OpenClaw 會在執行前觸發一般本機壓縮。這對長時間執行的工作階段很有用，因為供應商端上下文管理可能會讓模型上下文保持健康，但本機逐字稿仍會持續成長。它不會分割原始 JSONL 位元組；它會要求一般壓縮管線建立語意摘要。

<Warning>
位元組防護需要 `truncateAfterCompaction: true`。若沒有逐字稿輪替，作用中檔案不會縮小，防護也會維持不作用。
</Warning>

### 後續逐字稿

啟用 `agents.defaults.compaction.truncateAfterCompaction` 時，OpenClaw 不會就地重寫現有逐字稿。它會從壓縮摘要、保留狀態和未摘要尾端建立新的作用中後續逐字稿，然後記錄檢查點中繼資料，將分支/還原流程指向該已壓縮的後續逐字稿。
後續逐字稿也會捨棄在短重試視窗內抵達的完全重複長使用者輪次，因此通道重試風暴不會在壓縮後被帶入下一個作用中逐字稿。

OpenClaw 不再為新的壓縮寫入個別 `.checkpoint.*.jsonl` 副本。既有舊版檢查點檔案在被參照時仍可使用，並會由一般工作階段清理修剪。

### 壓縮通知

壓縮預設會靜默執行。設定 `notifyUser` 可在壓縮開始和完成時顯示簡短狀態訊息，並在壓縮前記憶排清耗盡但回覆仍繼續時顯示降級通知：

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

### 記憶排清

壓縮前，OpenClaw 可以執行一輪**靜默記憶排清**，將持久筆記儲存到磁碟。當這個整理輪次應使用本機模型而非作用中的對話模型時，請設定 `agents.defaults.compaction.memoryFlush.model`：

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

記憶排清模型覆寫是精確的，不會繼承作用中工作階段備援鏈。詳情與設定請見[記憶](/zh-TW/concepts/memory)。

## 可插拔壓縮供應商

外掛可以透過外掛 API 上的 `registerCompactionProvider()` 註冊自訂壓縮供應商。註冊並設定供應商後，OpenClaw 會將摘要工作委派給它，而不是使用內建 LLM 管線。

若要使用已註冊的供應商，請在設定中設定其 ID：

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

設定 `provider` 會自動強制 `mode: "safeguard"`。供應商會收到與內建路徑相同的壓縮指示和識別碼保留政策，且 OpenClaw 仍會在供應商輸出後保留近期輪次與分割輪次尾碼上下文。

<Note>
如果供應商失敗或回傳空結果，OpenClaw 會退回使用內建 LLM 摘要。
</Note>

## 壓縮與修剪

|                  | 壓縮                         | 修剪                              |
| ---------------- | ----------------------------- | -------------------------------- |
| **作用**         | 摘要較舊的對話               | 修剪舊工具結果                   |
| **已儲存？**     | 是（在工作階段逐字稿中）     | 否（僅記憶體中，依每次請求）     |
| **範圍**         | 整個對話                     | 僅工具結果                       |

[工作階段修剪](/zh-TW/concepts/session-pruning)是一個較輕量的補充功能，可在不摘要的情況下修剪工具輸出。

## 疑難排解

**壓縮太頻繁？** 模型的上下文視窗可能較小，或工具輸出可能很大。請嘗試啟用[工作階段修剪](/zh-TW/concepts/session-pruning)。

**壓縮後上下文感覺過時？** 使用 `/compact Focus on <topic>` 引導摘要，或啟用[記憶排清](/zh-TW/concepts/memory)，讓筆記得以保留。

**需要乾淨的起點？** `/new` 會開始新的工作階段，不進行壓縮。

進階設定（保留 Token、識別碼保留、自訂上下文引擎、OpenAI 伺服器端壓縮）請見[工作階段管理深入解析](/zh-TW/reference/session-management-compaction)。

## 相關

- [工作階段](/zh-TW/concepts/session)：工作階段管理與生命週期。
- [工作階段修剪](/zh-TW/concepts/session-pruning)：修剪工具結果。
- [上下文](/zh-TW/concepts/context)：如何為代理程式輪次建構上下文。
- [鉤子](/zh-TW/automation/hooks)：壓縮生命週期鉤子（`before_compaction`、`after_compaction`）。
