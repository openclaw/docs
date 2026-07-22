---
read_when:
    - 你想要瞭解自動壓縮和 /compact
    - 你正在偵錯因達到上下文限制而出問題的長時間工作階段
summary: OpenClaw 如何摘要長篇對話以維持在模型限制範圍內
title: 壓縮
x-i18n:
    generated_at: "2026-07-22T10:30:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb1f794fa60affd602378bcff8b07786bfeca55ab3fa09d5fa7214a05fa48806
    source_path: concepts/compaction.md
    workflow: 16
---

每個模型都有一個上下文視窗：也就是它可處理的最大權杖數。當對話接近此限制時，OpenClaw 會將較舊的訊息**壓縮**為摘要，讓聊天得以繼續。

## 運作方式

1. 較舊的對話回合會彙整成精簡項目。
2. 摘要會儲存在工作階段逐字稿中。
3. 近期訊息會完整保留。

OpenClaw 選擇壓縮分割點時，會讓助理工具呼叫與其對應的 `toolResult` 項目保持配對。如果分割點落在工具區塊內，OpenClaw 會移動邊界，確保配對項目保持在一起，並保留目前尚未摘要的尾端內容。

完整的對話歷程仍會保留在磁碟上。壓縮只會變更模型在下一個回合中看到的內容。

<Note>
新設定預設將 `agents.defaults.compaction.mode` 設為 `"safeguard"`（更嚴格的防護措施、摘要品質稽核）。若要退出，請明確設定 `mode: "default"`。
</Note>

## 自動壓縮

自動壓縮預設為啟用。當工作階段接近上下文限制，或模型傳回上下文溢位錯誤時，就會執行自動壓縮（在後者情況下，OpenClaw 會先壓縮再重試）。

你會看到：

- 一般閘道記錄中的 `embedded run auto-compaction start` / `complete`。
- 詳細模式中的 `🧹 Auto-compaction complete`。
- 顯示 `🧹 Compactions: <count>` 的 `/status`。

<Info>
壓縮之前，OpenClaw 會自動提醒代理程式將重要筆記儲存至[記憶](/zh-TW/concepts/memory)檔案。這可避免上下文遺失。
</Info>

<AccordionGroup>
  <Accordion title="OpenClaw 可辨識的溢位錯誤模式">
    OpenClaw 會比對數十種供應商特有的溢位錯誤字串（Anthropic、OpenAI、Bedrock、Gemini、Ollama、OpenRouter 等）。常見範例：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`（Bedrock）
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手動壓縮

在任何聊天中輸入 `/compact`，即可強制執行壓縮。你可以加入指示來引導摘要：

```text
/compact 聚焦於 API 設計決策
```

設定 `agents.defaults.compaction.keepRecentTokens` 時（預設值：20,000），手動壓縮會遵循該切分點，並在重建的上下文中保留近期尾端內容。若未明確指定保留預算，手動壓縮會作為硬性檢查點，之後僅從新摘要繼續。

## 設定

在 `openclaw.json` 的 `agents.defaults.compaction` 下設定壓縮。下方列出最常用的選項；如需完整參考資料，請參閱[工作階段管理深入解析](/zh-TW/reference/session-management-compaction)。

### 使用不同的模型

壓縮預設使用代理程式的主要模型。設定 `agents.defaults.compaction.model`，可將摘要工作委派給功能更強或專門用途的模型。此覆寫接受 `provider/model-id` 字串，或在 `agents.defaults.models` 下設定的裸別名：

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

壓縮開始前，已設定的裸別名會解析為其標準供應商與模型。如果裸值同時符合別名與已設定的字面模型 ID，則以字面模型 ID 為準。未符合的裸值仍會作為使用中供應商的模型 ID。

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

未設定時，壓縮會從目前工作階段使用中的模型開始。如果摘要因符合模型備援資格的供應商錯誤而失敗，OpenClaw 會透過工作階段既有的模型備援鏈重試該次壓縮。備援選擇是暫時性的，不會寫回工作階段狀態。明確的 `agents.defaults.compaction.model` 覆寫會維持精確指定，且不會繼承工作階段備援鏈。

### 識別碼保留

壓縮摘要預設會保留不透明識別碼（`identifierPolicy: "strict"`）。可使用 `identifierPolicy: "off"` 覆寫以停用此功能。自訂指引應放在壓縮供應商的 `summarize()` 實作中。

### 使用中逐字稿位元組防護限制

設定 `agents.defaults.compaction.maxActiveTranscriptBytes` 時，如果逐字稿歷程達到該大小，OpenClaw 會在執行回合前觸發一般本機壓縮。這對長時間執行的工作階段很有幫助，因為供應商端的上下文管理可能讓模型上下文保持正常，但持久儲存的逐字稿歷程仍會持續增長。此功能不會直接分割原始位元組，而是要求一般壓縮流水線建立語意摘要。

<Warning>
位元組防護限制適用於使用中的 SQLite 逐字稿歷程。舊版 JSONL 檢查點成品不是使用中的壓縮目標。
</Warning>

### 後繼逐字稿

啟用 `agents.defaults.compaction.truncateAfterCompaction` 時，OpenClaw 不會就地重寫現有逐字稿。它會從壓縮摘要、保留的狀態和尚未摘要的尾端內容建立新的使用中後繼逐字稿，然後記錄檢查點中繼資料，讓分支／還原流程指向該壓縮後的後繼逐字稿。
後繼逐字稿也會捨棄在短暫重試時間範圍內抵達、內容完全相同的冗長使用者回合，因此頻道重試風暴不會在壓縮後被帶入下一份使用中逐字稿。

OpenClaw 不再為新的壓縮寫入個別的 `.checkpoint.*.jsonl` 副本。既有的舊版檢查點檔案在仍被參照時可以繼續使用，並由一般工作階段清理程序刪除。

### 壓縮通知

壓縮預設會靜默執行。設定 `notifyUser`，即可在壓縮開始和完成時顯示簡短的狀態訊息；當壓縮前的記憶清除已用盡但回覆仍繼續時，也會顯示降級通知：

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

壓縮前，OpenClaw 可以執行一次**靜默記憶清除**回合，將持久筆記儲存至磁碟。若此例行維護回合應使用本機模型，而非目前對話模型，請設定 `agents.defaults.compaction.memoryFlush.model`：

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

記憶清除模型覆寫會精確套用，且不會繼承使用中工作階段的備援鏈。如需詳細資訊與設定，請參閱[記憶](/zh-TW/concepts/memory)。

## 可插拔壓縮供應商

外掛可以透過外掛 API 上的 `registerCompactionProvider()` 註冊自訂壓縮供應商。註冊並設定供應商後，OpenClaw 會將摘要工作委派給該供應商，而非內建的 LLM 流水線。

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

設定 `provider` 會自動強制使用 `mode: "safeguard"`。供應商會收到與內建路徑相同的壓縮指示與識別碼保留政策，而在供應商輸出後，OpenClaw 仍會保留近期回合與分割回合的尾碼上下文。

<Note>
如果供應商失敗或傳回空白結果，OpenClaw 會改用內建的 LLM 摘要。
</Note>

## 壓縮與修剪的比較

|                  | 壓縮                          | 修剪                         |
| ---------------- | ----------------------------- | ---------------------------- |
| **作用**         | 摘要較舊的對話                | 修剪舊的工具結果             |
| **是否儲存？**   | 是（在工作階段逐字稿中）      | 否（僅在記憶體中、每次請求） |
| **範圍**         | 整段對話                      | 僅限工具結果                 |

[工作階段修剪](/zh-TW/concepts/session-pruning)是一種較輕量的輔助機制，可在不進行摘要的情況下修剪工具輸出。

## 疑難排解

**壓縮過於頻繁？** 模型的上下文視窗可能較小，或工具輸出可能過大。請嘗試啟用[工作階段修剪](/zh-TW/concepts/session-pruning)。

**壓縮後覺得上下文過時？** 使用 `/compact Focus on <topic>` 引導摘要，或啟用[記憶清除](/zh-TW/concepts/memory)，讓筆記得以保留。

**需要全新開始？** `/new` 會啟動新的工作階段，而不執行壓縮。

如需進階設定（保留權杖、識別碼保留、自訂上下文引擎、OpenAI 伺服器端壓縮），請參閱[工作階段管理深入解析](/zh-TW/reference/session-management-compaction)。

## 相關內容

- [工作階段](/zh-TW/concepts/session)：工作階段管理與生命週期。
- [工作階段修剪](/zh-TW/concepts/session-pruning)：修剪工具結果。
- [上下文](/zh-TW/concepts/context)：如何為代理程式回合建立上下文。
- [掛鉤](/zh-TW/automation/hooks)：壓縮生命週期掛鉤（`before_compaction`、`after_compaction`）。
