---
read_when:
    - 你想瞭解自動壓縮和 `/compact`
    - 你正在偵錯因達到上下文限制而發生問題的長時間工作階段
summary: OpenClaw 如何摘要冗長對話以保持在模型限制內
title: 壓縮
x-i18n:
    generated_at: "2026-07-12T14:24:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f00fb0cf59184ef450f1fc4d39a21a40ee4e8327d872766bca7f3642c0145514
    source_path: concepts/compaction.md
    workflow: 16
---

每個模型都有上下文視窗：也就是它最多能處理的權杖數量。當對話接近此限制時，OpenClaw 會將較舊的訊息**壓縮**成摘要，讓聊天可以繼續進行。

## 運作方式

1. 將較舊的對話輪次摘要成精簡項目。
2. 將摘要儲存在工作階段逐字記錄中。
3. 保留近期訊息的完整內容。

OpenClaw 選擇壓縮分割點時，會讓助理工具呼叫與相符的 `toolResult` 項目保持配對。如果分割點落在工具區塊內，OpenClaw 會移動邊界，確保這一對項目保持在一起，並保留目前尚未摘要的尾端內容。

完整的對話記錄仍會保留在磁碟上。壓縮只會變更模型在下一輪看到的內容。

<Note>
新設定預設會將 `agents.defaults.compaction.mode` 設為 `"safeguard"`（更嚴格的防護措施與摘要品質稽核）。若要停用，請明確設定 `mode: "default"`。
</Note>

## 自動壓縮

自動壓縮預設為啟用。它會在工作階段接近上下文限制時執行，或在模型傳回上下文溢位錯誤時執行（在此情況下，OpenClaw 會先壓縮再重試）。

你會看到：

- 一般閘道記錄中的 `embedded run auto-compaction start` / `complete`。
- 詳細模式中的 `🧹 Auto-compaction complete`。
- `/status` 顯示 `🧹 Compactions: <count>`。

<Info>
壓縮前，OpenClaw 會自動提醒代理將重要筆記儲存至[記憶](/zh-TW/concepts/memory)檔案，以避免上下文遺失。
</Info>

<AccordionGroup>
  <Accordion title="OpenClaw 可辨識的溢位錯誤模式">
    OpenClaw 可比對數十種供應商特有的溢位錯誤字串（Anthropic、OpenAI、Bedrock、Gemini、Ollama、OpenRouter 等）。常見範例如下：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`（Bedrock）
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手動壓縮

在任何聊天中輸入 `/compact` 即可強制執行壓縮。你可以加入指示來引導摘要內容：

```text
/compact 著重於 API 設計決策
```

設定 `agents.defaults.compaction.keepRecentTokens` 時（預設值：20,000），手動壓縮會遵循該切分點，並在重建的上下文中保留近期尾端內容。若未明確設定保留預算，手動壓縮會作為硬性檢查點，且僅從新的摘要繼續。

## 設定

請在 `openclaw.json` 的 `agents.defaults.compaction` 下設定壓縮。以下列出最常用的選項；如需完整參考資料，請參閱[工作階段管理深入解析](/zh-TW/reference/session-management-compaction)。

### 使用不同的模型

壓縮預設使用代理的主要模型。設定 `agents.defaults.compaction.model`，即可將摘要委派給功能更強大或專門用途的模型。覆寫值可接受 `provider/model-id` 字串，或在 `agents.defaults.models` 下設定的純別名：

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

壓縮開始前，已設定的純別名會解析為其標準供應商和模型。如果純值同時符合別名與已設定的字面模型 ID，會優先使用字面模型 ID。未符合的純值仍會作為目前供應商上的模型 ID。

此功能也適用於本機模型，例如專門用於摘要的第二個 Ollama 模型：

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

未設定時，壓縮會從目前工作階段模型開始。如果摘要因符合模型備援條件的供應商錯誤而失敗，OpenClaw 會透過工作階段現有的模型備援鏈重試該次壓縮。備援選擇是暫時的，不會寫回工作階段狀態。明確設定的 `agents.defaults.compaction.model` 覆寫值會維持精確指定，不會繼承工作階段備援鏈。

### 識別碼保留

壓縮摘要預設會保留不透明識別碼（`identifierPolicy: "strict"`）。你可以使用 `identifierPolicy: "off"` 停用，或使用 `identifierPolicy: "custom"` 搭配 `identifierInstructions` 提供自訂指引。

### 作用中逐字記錄位元組防護

設定 `agents.defaults.compaction.maxActiveTranscriptBytes` 後，如果逐字記錄歷史達到該大小，OpenClaw
會在執行前觸發一般本機壓縮。這對長時間執行的工作階段很有幫助，因為供應商端的上下文
管理可能讓模型上下文保持正常，但持久保存的逐字記錄歷史仍會
持續增長。它不會分割原始位元組，而是要求一般壓縮
管線建立語意摘要。

<Warning>
位元組防護適用於作用中的 SQLite 逐字記錄歷史。舊版 JSONL
檢查點成品不是作用中的壓縮目標。
</Warning>

### 後繼逐字記錄

啟用 `agents.defaults.compaction.truncateAfterCompaction` 後，OpenClaw 不會就地重寫現有的逐字記錄。它會根據壓縮摘要、保留的狀態和尚未摘要的尾端內容建立新的作用中後繼逐字記錄，然後記錄檢查點中繼資料，將分支／還原流程指向該壓縮後的後繼逐字記錄。
後繼逐字記錄也會捨棄在短暫重試時間範圍內送達且內容完全相同的冗長使用者輪次，因此壓縮後的下一份作用中逐字記錄不會帶入頻道重試風暴。

對於新的壓縮，OpenClaw 不再寫入獨立的 `.checkpoint.*.jsonl` 副本。現有的舊版檢查點檔案只要仍被參照就可以繼續使用，並會由一般工作階段清理程序移除。

### 壓縮通知

壓縮預設會以靜默方式執行。設定 `notifyUser` 後，壓縮開始和完成時會顯示簡短狀態訊息；若壓縮前的記憶清理已用盡重試機會但回覆仍繼續，也會顯示降級通知：

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

### 記憶清理

壓縮前，OpenClaw 可以執行一次**靜默記憶清理**輪次，將持久性筆記儲存至磁碟。如果你希望這個維護輪次使用本機模型，而非目前對話模型，請設定 `agents.defaults.compaction.memoryFlush.model`：

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

記憶清理模型覆寫值會精確套用，且不會繼承作用中工作階段的備援鏈。如需詳細資訊與設定，請參閱[記憶](/zh-TW/concepts/memory)。

## 可插拔的壓縮供應商

外掛可以透過外掛 API 上的 `registerCompactionProvider()` 註冊自訂壓縮供應商。註冊並設定供應商後，OpenClaw 會將摘要委派給該供應商，而非使用內建的 LLM 管線。

若要使用已註冊的供應商，請在設定中指定其 ID：

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

設定 `provider` 會自動強制使用 `mode: "safeguard"`。供應商會收到與內建路徑相同的壓縮指示和識別碼保留原則；在供應商輸出後，OpenClaw 仍會保留近期輪次和分割輪次的後綴上下文。

<Note>
如果供應商失敗或傳回空白結果，OpenClaw 會改用內建的 LLM 摘要功能。
</Note>

## 壓縮與修剪的比較

|                  | 壓縮                          | 修剪                           |
| ---------------- | ----------------------------- | ------------------------------ |
| **功能**         | 摘要較舊的對話                | 刪減舊的工具結果               |
| **是否儲存？**   | 是（儲存於工作階段逐字記錄）  | 否（僅在記憶體中，依請求處理） |
| **範圍**         | 整段對話                      | 僅限工具結果                   |

[工作階段修剪](/zh-TW/concepts/session-pruning)是一項較輕量的補充功能，可在不進行摘要的情況下刪減工具輸出。

## 疑難排解

**壓縮太頻繁？** 模型的上下文視窗可能較小，或工具輸出可能過大。請嘗試啟用[工作階段修剪](/zh-TW/concepts/session-pruning)。

**壓縮後覺得上下文過時？** 使用 `/compact Focus on <topic>` 引導摘要，或啟用[記憶清理](/zh-TW/concepts/memory)以保留筆記。

**需要重新開始？** `/new` 會啟動全新的工作階段，不進行壓縮。

如需進階設定（保留權杖、識別碼保留、自訂上下文引擎、OpenAI 伺服器端壓縮），請參閱[工作階段管理深入解析](/zh-TW/reference/session-management-compaction)。

## 相關內容

- [工作階段](/zh-TW/concepts/session)：工作階段管理與生命週期。
- [工作階段修剪](/zh-TW/concepts/session-pruning)：刪減工具結果。
- [上下文](/zh-TW/concepts/context)：如何為代理輪次建立上下文。
- [掛鉤](/zh-TW/automation/hooks)：壓縮生命週期掛鉤（`before_compaction`、`after_compaction`）。
