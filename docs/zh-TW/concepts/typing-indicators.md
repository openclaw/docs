---
read_when:
    - 變更輸入狀態指示器的行為或預設值
summary: OpenClaw 何時顯示輸入中指示器，以及如何調整它們
title: 輸入狀態指示器
x-i18n:
    generated_at: "2026-05-10T19:32:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: e26b4008f165527098ffcbf9c39ee7179149063842cc5c6aacb5b7c606eedc26
    source_path: concepts/typing-indicators.md
    workflow: 16
---

正在輸入指示器會在執行處於作用中時傳送到聊天通道。使用
`agents.defaults.typingMode` 控制正在輸入**何時**開始，並使用 `typingIntervalSeconds`
控制**多久**重新整理一次。

## 預設值

當 `agents.defaults.typingMode` **未設定**時，OpenClaw 會保留舊有行為：

- **直接聊天**：模型迴圈開始後，正在輸入會立即開始。
- **有提及的群組聊天**：正在輸入會立即開始。
- **沒有提及的群組聊天**：只有在訊息文字開始串流時，正在輸入才會開始。
- **Heartbeat 執行**：如果解析後的 heartbeat 目標是支援正在輸入的聊天，且正在輸入未被停用，則正在輸入會在 heartbeat 執行開始時啟動。

## 模式

將 `agents.defaults.typingMode` 設為下列其中之一：

- `never` - 永遠不顯示正在輸入指示器。
- `instant` - **模型迴圈一開始就**開始顯示正在輸入，即使該執行稍後只回傳靜默回覆權杖。
- `thinking` - 在**第一個推理 delta** 時開始顯示正在輸入（該執行需要 `reasoningLevel: "stream"`）。
- `message` - 在**第一個非靜默文字 delta** 時開始顯示正在輸入（忽略 `NO_REPLY` 靜默權杖）。

「觸發得多早」的順序：
`never` → `message` → `thinking` → `instant`

## 設定

設定代理層級的預設值：

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

針對每個工作階段覆寫模式或節奏：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 備註

- 當整個負載是確切的靜默權杖（例如 `NO_REPLY` / `no_reply`，不區分大小寫比對）時，`message` 模式不會對純靜默回覆顯示正在輸入。
- `thinking` 只會在執行串流推理（`reasoningLevel: "stream"`）時觸發。
  如果模型未發出推理 delta，正在輸入不會開始。
- Heartbeat 正在輸入是解析後傳遞目標的活躍訊號。它會在 heartbeat 執行開始時啟動，而不是依循 `message` 或 `thinking` 的串流時機。設定 `typingMode: "never"` 可停用。
- 當 `target: "none"`、無法解析目標、heartbeat 的聊天傳遞已停用，或通道不支援正在輸入時，Heartbeat 不會顯示正在輸入。
- `typingIntervalSeconds` 控制的是**重新整理節奏**，不是開始時間。
  預設值是 6 秒。

## 相關

<CardGroup cols={2}>
  <Card title="狀態" href="/zh-TW/concepts/presence" icon="signal">
    Gateway 如何追蹤已連線的用戶端，並在 macOS Instances 分頁中顯示它們。
  </Card>
  <Card title="串流與分塊" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    對外串流行為、分塊邊界，以及通道特定的傳遞。
  </Card>
</CardGroup>
