---
read_when:
    - 變更輸入中指示器行為或預設值
summary: OpenClaw 何時顯示輸入狀態指示器，以及如何調整其設定
title: 輸入中指示器
x-i18n:
    generated_at: "2026-05-06T02:47:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59ee89a2f382b185e520fea178cf1860cbc4cfb8257c3b0ae7552fa4b1c79ef3
    source_path: concepts/typing-indicators.md
    workflow: 16
---

輸入指示器會在執行中的 run 作用期間傳送到聊天頻道。使用
`agents.defaults.typingMode` 控制輸入會在**何時**開始，並使用 `typingIntervalSeconds`
控制它**多久**重新整理一次。

## 預設值

當 **未設定** `agents.defaults.typingMode` 時，OpenClaw 會保留舊有行為：

- **直接聊天**：模型迴圈一開始，輸入就會立即開始。
- **有提及的群組聊天**：輸入會立即開始。
- **沒有提及的群組聊天**：只有在訊息文字開始串流時，輸入才會開始。
- **Heartbeat 執行**：如果解析後的 heartbeat 目標是支援輸入指示器的聊天，且輸入未停用，則會在 heartbeat 執行開始時開始輸入。

## 模式

將 `agents.defaults.typingMode` 設為下列其中之一：

- `never` - 永遠不顯示輸入指示器。
- `instant` - **模型迴圈一開始**就開始輸入，即使該執行稍後只回傳靜默回覆 token。
- `thinking` - 在**第一個推理差異**時開始輸入（該執行需要
  `reasoningLevel: "stream"`）。
- `message` - 在**第一個非靜默文字差異**時開始輸入（忽略
  `NO_REPLY` 靜默 token）。

「觸發得多早」的順序：
`never` → `message` → `thinking` → `instant`

## 設定

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

你可以依每個工作階段覆寫模式或節奏：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注意事項

- 當整個 payload 是精確的靜默 token（例如 `NO_REPLY` / `no_reply`，
  以不區分大小寫的方式比對）時，`message` 模式不會為只有靜默的回覆顯示輸入。
- `thinking` 只有在該執行串流推理時才會觸發（`reasoningLevel: "stream"`）。
  如果模型沒有發出推理差異，輸入就不會開始。
- Heartbeat 輸入是解析後傳遞目標的存活訊號。它會在 Heartbeat 執行開始時開始，而不是遵循 `message` 或 `thinking`
  串流時機。設定 `typingMode: "never"` 可停用它。
- 當 `target: "none"`、無法解析目標、該 Heartbeat 的聊天傳遞已停用，或頻道不支援輸入時，Heartbeat 不會顯示輸入。
- `typingIntervalSeconds` 控制的是**重新整理節奏**，不是開始時間。
  預設值為 6 秒。

## 相關內容

<CardGroup cols={2}>
  <Card title="上線狀態" href="/zh-TW/concepts/presence" icon="signal">
    Gateway 如何追蹤已連線的用戶端，並在 macOS Instances 分頁中呈現它們。
  </Card>
  <Card title="串流與分塊" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    輸出串流行為、區塊邊界，以及各頻道專屬的傳遞方式。
  </Card>
</CardGroup>
