---
read_when:
    - 變更輸入中指示器的行為或預設值
summary: OpenClaw 何時顯示輸入中指示，以及如何調整其設定
title: 輸入狀態指示器
x-i18n:
    generated_at: "2026-07-12T14:29:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 55e5ec38f47e0612b25b5561790e9b8a17ea4e215c4038bb89af83f861089e03
    source_path: concepts/typing-indicators.md
    workflow: 16
---

執行進行期間，系統會向聊天頻道傳送輸入指示器。使用 `agents.defaults.typingMode` 控制輸入**何時**開始，並使用 `typingIntervalSeconds` 控制其重新整理的**頻率**（保活節奏，預設為 6 秒）。

## 預設值

當 `agents.defaults.typingMode` **未設定**時：

- **直接聊天**：模型迴圈開始後，立即開始顯示輸入狀態。
- **含提及的群組聊天**：立即開始顯示輸入狀態。
- **不含提及的群組聊天**：獲准的執行出現使用者可見的活動時，開始顯示輸入狀態，例如工具執行環境活動或訊息文字。
- **心跳偵測執行**：心跳偵測執行開始時，若解析出的心跳偵測目標是支援輸入狀態的聊天，且輸入狀態未停用，則開始顯示輸入狀態。

## 模式

將 `agents.defaults.typingMode` 設為下列其中之一：

- `never` - 永遠不顯示輸入指示器。
- `instant` - 模型迴圈**一開始就**顯示輸入狀態，即使執行最後只傳回靜默回覆權杖亦同。
- `thinking` - 在出現**第一個推理增量**時，或輪次獲接受後開始主動執行工具環境時，開始顯示輸入狀態。
- `message` - 在出現**第一個使用者可見的回覆活動**時開始顯示輸入狀態，例如主動執行工具環境或非靜默文字增量。`NO_REPLY` 等靜默回覆權杖不算文字活動。

依「觸發時間由晚到早」排序：`never` -> `message`/`thinking` -> `instant`。

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

針對個別工作階段覆寫模式或節奏：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注意事項

- `message` 模式不會因靜默回覆權杖而開始顯示輸入狀態，但在任何助理文字可用之前，主動執行仍可能顯示輸入狀態。
- `thinking` 仍會回應串流推理（`reasoningLevel: "stream"`），也可能在推理增量抵達前因主動執行而開始顯示輸入狀態。
- 心跳偵測的輸入狀態是解析後傳遞目標的存活訊號。它會在心跳偵測執行開始時啟動，而不會遵循 `message` 或 `thinking` 的串流時序。設定 `typingMode: "never"` 可將其停用。
- 當心跳偵測目標為 `"none"`、無法解析目標、心跳偵測的聊天傳遞已停用，或頻道不支援輸入狀態時，心跳偵測不會顯示輸入狀態。
- `typingIntervalSeconds` 控制的是**重新整理節奏**，而非開始時間。預設值：6 秒。

## 相關內容

<CardGroup cols={2}>
  <Card title="在線狀態" href="/zh-TW/concepts/presence" icon="signal">
    閘道如何追蹤已連線的用戶端，以供控制介面的「裝置」頁面與 macOS 的「執行個體」分頁使用。
  </Card>
  <Card title="串流與分塊" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    輸出串流行為、區塊邊界，以及各頻道特有的傳遞方式。
  </Card>
</CardGroup>
