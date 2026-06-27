---
read_when:
    - 變更輸入指示器行為或預設值
summary: OpenClaw 何時顯示輸入中指示器，以及如何調整它們
title: 輸入狀態指示器
x-i18n:
    generated_at: "2026-06-27T19:15:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa76889d0f6262f1092abefee02aee8fe944651dc89d3a697ccc86e16558ed60
    source_path: concepts/typing-indicators.md
    workflow: 16
---

輸入指示會在執行處於作用中時傳送到聊天頻道。使用
`agents.defaults.typingMode` 控制輸入 **何時** 開始，並使用 `typingIntervalSeconds`
控制其 **多久** 重新整理一次。

## 預設值

當 `agents.defaults.typingMode` **未設定** 時，OpenClaw 會保留舊有行為：

- **直接聊天**：模型迴圈一開始，輸入就會立即開始。
- **提及的群組聊天**：輸入會立即開始。
- **沒有提及的群組聊天**：當已接受的執行出現使用者可見活動時，輸入就會開始，例如 harness 執行活動或訊息文字。
- **心跳偵測執行**：如果解析出的心跳偵測目標是支援輸入的聊天，且輸入未停用，則輸入會在心跳偵測執行開始時開始。

## 模式

將 `agents.defaults.typingMode` 設為下列其中一項：

- `never` - 永遠不顯示輸入指示。
- `instant` - **模型迴圈一開始** 就開始輸入，即使該執行稍後只回傳靜默回覆權杖。
- `thinking` - 在**第一個推理增量**，或在回合被接受後的作用中 harness 執行時開始輸入。
- `message` - 在**第一個使用者可見的回覆活動**時開始輸入，例如作用中 harness 執行或非靜默文字增量。像 `NO_REPLY` 這類靜默回覆權杖不算文字活動。

「觸發多早」的順序：
`never` → `message`/`thinking` → `instant`

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

- `message` 模式不會因靜默回覆權杖而開始，但在有任何助理文字可用之前，作用中執行仍可能顯示輸入。
- `thinking` 仍會回應串流推理（`reasoningLevel: "stream"`），且也可能在推理增量抵達前因作用中執行而開始。
- 心跳偵測輸入是解析後傳遞目標的存活訊號。它會在心跳偵測執行開始時開始，而不是依循 `message` 或 `thinking` 的串流時機。設定 `typingMode: "never"` 可將其停用。
- 當 `target: "none"`、目標無法解析、心跳偵測的聊天傳遞已停用，或頻道不支援輸入時，心跳偵測不會顯示輸入。
- `typingIntervalSeconds` 控制的是**重新整理節奏**，而不是開始時間。預設值為 6 秒。

## 相關

<CardGroup cols={2}>
  <Card title="在線狀態" href="/zh-TW/concepts/presence" icon="signal">
    閘道如何追蹤已連線的用戶端，並在 macOS「執行個體」分頁中呈現它們。
  </Card>
  <Card title="串流與分塊" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    傳出串流行為、區塊邊界，以及頻道特定的傳遞。
  </Card>
</CardGroup>
