---
read_when:
    - 變更輸入中指示器的行為或預設值
summary: OpenClaw 何時顯示輸入中指示器，以及如何調整其設定
title: 輸入狀態指示器
x-i18n:
    generated_at: "2026-07-20T00:48:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cdaad6345ebf20ff3142020e584985c2dcc04e25f2ae4f11585e30903c9e4729
    source_path: concepts/typing-indicators.md
    workflow: 16
---

執行進行期間，系統會將輸入中指示器傳送至聊天頻道。使用 `agents.defaults.typingMode` 控制輸入**何時**開始，並使用 `typingIntervalSeconds` 控制其重新整理的**頻率**（保持連線間隔，預設為 6 秒）。

## 預設值

未設定 `agents.defaults.typingMode` 時：

- **直接聊天**：模型迴圈開始後立即開始顯示輸入中。
- **含提及的群組聊天**：立即開始顯示輸入中。
- **不含提及的群組聊天**：獲准執行出現使用者可見的活動時，開始顯示輸入中，例如執行框架的執行活動或訊息文字。
- **心跳偵測執行**：心跳偵測執行開始時，若解析出的心跳偵測目標是支援輸入中狀態的聊天，且未停用輸入中狀態，便開始顯示輸入中。

## 模式

將 `agents.defaults.typingMode` 設為下列其中一項：

- `never` - 永不顯示輸入中指示器。
- `instant` - 模型迴圈**一開始便**開始顯示輸入中，即使該次執行稍後只傳回靜默回覆權杖也一樣。
- `thinking` - 在出現**第一個推理增量**時，或回合獲接受後執行框架開始主動執行時，開始顯示輸入中。
- `message` - 在出現**第一個使用者可見的回覆活動**時，開始顯示輸入中，例如執行框架主動執行或非靜默文字增量。`NO_REPLY` 等靜默回覆權杖不算文字活動。

「觸發時間有多早」的順序：`never` -> `message`/`thinking` -> `instant`。

## 設定

設定代理程式層級的預設值：

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

依工作階段覆寫模式：

```json5
{
  session: {
    typingMode: "message",
  },
}
```

## 注意事項

- `message` 模式不會因靜默回覆權杖而開始顯示輸入中，但即使尚無任何助理文字可用，主動執行仍可能顯示輸入中。
- `thinking` 仍會對串流推理（`reasoningLevel: "stream"`）作出反應，也可能在推理增量抵達前，因主動執行而開始顯示輸入中。
- 心跳偵測輸入中狀態是解析後傳遞目標的存活訊號。它會在心跳偵測執行開始時啟動，而不是依循 `message` 或 `thinking` 的串流時序。將 `typingMode: "never"` 設為停用它。
- 當心跳偵測目標為 `"none"`、無法解析目標、已停用該心跳偵測的聊天傳遞，或頻道不支援輸入中狀態時，心跳偵測不會顯示輸入中。
- `agents.defaults.typingIntervalSeconds` 控制的是**重新整理間隔**，而非開始時間。預設值：6 秒。

## 相關內容

<CardGroup cols={2}>
  <Card title="在線狀態" href="/zh-TW/concepts/presence" icon="signal">
    閘道如何追蹤已連線的用戶端，以供 Control UI 的 Devices 頁面與 macOS 的 Instances 分頁使用。
  </Card>
  <Card title="串流與分塊" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    輸出串流行為、區塊邊界，以及頻道特定的傳遞方式。
  </Card>
</CardGroup>
