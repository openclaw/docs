---
read_when:
    - 變更輸入指示器的行為或預設值
summary: OpenClaw 顯示輸入中指示器的時機，以及如何調整它們
title: 輸入中指示器
x-i18n:
    generated_at: "2026-04-30T03:03:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 80f5c3bb79cf87f79db5336978b877f4a01025f59c9e822ab66198f00907123f
    source_path: concepts/typing-indicators.md
    workflow: 16
---

輸入狀態指示器會在執行處於作用中時傳送到聊天頻道。使用
`agents.defaults.typingMode` 控制輸入狀態**何時**開始，並使用 `typingIntervalSeconds`
控制它**多久**重新整理一次。

## 預設值

當 `agents.defaults.typingMode` **未設定**時，OpenClaw 會保留舊有行為：

- **直接聊天**：模型迴圈一開始，輸入狀態就會立即開始。
- **有提及的群組聊天**：輸入狀態會立即開始。
- **沒有提及的群組聊天**：只有在訊息文字開始串流時，輸入狀態才會開始。
- **Heartbeat 執行**：如果解析出的 heartbeat 目標是支援輸入狀態的聊天，且輸入狀態未停用，則輸入狀態會在 heartbeat 執行開始時啟動。

## 模式

將 `agents.defaults.typingMode` 設為下列其中之一：

- `never` — 永遠不顯示輸入狀態指示器。
- `instant` — **模型迴圈一開始就**開始輸入狀態，即使該執行稍後只傳回靜默回覆詞元。
- `thinking` — 在**第一個推理增量**時開始輸入狀態（該執行需要
  `reasoningLevel: "stream"`）。
- `message` — 在**第一個非靜默文字增量**時開始輸入狀態（忽略
  `NO_REPLY` 靜默詞元）。

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

你可以針對每個工作階段覆寫模式或節奏：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注意事項

- `message` 模式在整個有效負載正好是靜默詞元時（例如 `NO_REPLY` / `no_reply`，
  以不區分大小寫的方式比對），不會為純靜默回覆顯示輸入狀態。
- `thinking` 只有在執行串流推理時才會觸發（`reasoningLevel: "stream"`）。
  如果模型沒有發出推理增量，輸入狀態就不會開始。
- Heartbeat 輸入狀態是針對解析出的遞送目標的存活訊號。它會在 heartbeat 執行開始時啟動，而不是遵循 `message` 或 `thinking` 的串流時機。設定 `typingMode: "never"` 可停用它。
- 當 `target: "none"`、目標無法解析、heartbeat 的聊天遞送已停用，或頻道不支援輸入狀態時，Heartbeats 不會顯示輸入狀態。
- `typingIntervalSeconds` 控制的是**重新整理節奏**，不是開始時間。
  預設值為 6 秒。

## 相關內容

- [Presence](/zh-TW/concepts/presence)
- [串流與分塊](/zh-TW/concepts/streaming)
