---
read_when:
    - 變更輸入中指示器的行為或預設值
summary: OpenClaw 何時顯示輸入中指示器，以及如何調整它們
title: 輸入指示器
x-i18n:
    generated_at: "2026-07-05T11:17:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1be9429a6a5be0dd754e6a088f3afe3681def05be68db3e62c3a2a3ac4b4463
    source_path: concepts/typing-indicators.md
    workflow: 16
---

執行作用中時，輸入指示器會傳送到聊天頻道。使用 `agents.defaults.typingMode` 控制輸入狀態**何時**開始，並使用 `typingIntervalSeconds` 控制它**多久**重新整理一次（keepalive 節奏，預設 6 秒）。

## 預設值

當 `agents.defaults.typingMode` **未設定**時：

- **直接聊天**：模型迴圈開始後，輸入狀態會立即開始。
- **含提及的群組聊天**：輸入狀態會立即開始。
- **不含提及的群組聊天**：當已准入的執行有使用者可見活動時，輸入狀態會開始，例如 harness 執行活動或訊息文字。
- **心跳偵測執行**：如果解析出的心跳偵測目標是支援輸入狀態的聊天，且輸入狀態未停用，輸入狀態會在心跳偵測執行開始時開始。

## 模式

將 `agents.defaults.typingMode` 設為下列其中之一：

- `never` - 永遠不顯示輸入指示器。
- `instant` - **模型迴圈一開始**就開始輸入狀態，即使該執行稍後只回傳靜默回覆權杖。
- `thinking` - 在**第一個推理增量**時開始輸入狀態，或在該輪次被接受後的作用中 harness 執行時開始。
- `message` - 在**第一個使用者可見的回覆活動**時開始輸入狀態，例如作用中 harness 執行或非靜默文字增量。像 `NO_REPLY` 這類靜默回覆權杖不算文字活動。

「觸發得多早」的順序：`never` -> `message`/`thinking` -> `instant`。

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

依工作階段覆寫模式或節奏：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注意事項

- `message` 模式不會從靜默回覆權杖開始，但作用中執行仍可能在任何助理文字可用前顯示輸入狀態。
- `thinking` 仍會回應串流推理（`reasoningLevel: "stream"`），也可以在推理增量抵達前，從作用中執行開始。
- 心跳偵測輸入狀態是解析出的傳遞目標的存活訊號。它會在心跳偵測執行開始時開始，而不是遵循 `message` 或 `thinking` 的串流時機。設定 `typingMode: "never"` 可停用它。
- 當心跳偵測目標是 `"none"`、目標無法解析、該心跳偵測的聊天傳遞已停用，或頻道不支援輸入狀態時，心跳偵測不會顯示輸入狀態。
- `typingIntervalSeconds` 控制的是**重新整理節奏**，不是開始時間。預設：6 秒。

## 相關

<CardGroup cols={2}>
  <Card title="Presence" href="/zh-TW/concepts/presence" icon="signal">
    閘道如何追蹤已連線的用戶端，並在 macOS Instances 分頁中顯示它們。
  </Card>
  <Card title="Streaming and chunking" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    傳出串流行為、區塊邊界，以及特定頻道的傳遞。
  </Card>
</CardGroup>
