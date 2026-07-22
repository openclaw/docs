---
read_when:
    - 變更輸入指示器的行為或預設值
summary: OpenClaw 何時顯示輸入中指示器，以及如何調整其設定
title: 輸入狀態指示器
x-i18n:
    generated_at: "2026-07-22T10:32:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 507f0f3f964c4ec8b7ef369975538388aa7d1c35dcbfcd6c87c0c37248e01c99
    source_path: concepts/typing-indicators.md
    workflow: 16
---

執行進行期間，會將輸入指示傳送至聊天頻道。使用 `agents.defaults.typingMode` 控制輸入指示**何時**開始，並使用 `typingIntervalSeconds` 控制其重新整理**頻率**（保活週期，預設為 6 秒）。

## 預設值

當 `agents.defaults.typingMode` **未設定**時：

- **直接聊天**：模型迴圈開始後，立即顯示輸入指示。
- **包含提及的群組聊天**：立即顯示輸入指示。
- **不包含提及的群組聊天**：當已准入的執行出現使用者可見的活動時顯示輸入指示，例如框架執行活動或訊息文字。
- **心跳偵測執行**：心跳偵測執行開始時顯示輸入指示，前提是解析後的心跳偵測目標是支援輸入指示的聊天，且輸入指示未停用。

## 模式

將 `agents.defaults.typingMode` 設為下列其中一項：

- `never` - 永遠不顯示輸入指示。
- `instant` - **模型迴圈一開始**便顯示輸入指示，即使該次執行最終只傳回靜默回覆權杖也一樣。
- `thinking` - 在出現**第一個推理增量**時，或回合獲接受後開始主動執行框架時顯示輸入指示。
- `message` - 在出現**第一個使用者可見的回覆活動**時顯示輸入指示，例如主動執行框架或非靜默文字增量。`NO_REPLY` 等靜默回覆權杖不算文字活動。

依「觸發時間由早至晚」排序：`never` -> `message`/`thinking` -> `instant`。

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

覆寫單一代理程式的原則：

```json5
{
  agents: {
    entries: {
      support: {
        typingMode: "message",
        typingIntervalSeconds: 8,
      },
    },
  },
}
```

## 注意事項

- `message` 模式不會因靜默回覆權杖而開始顯示輸入指示，但主動執行仍可能在任何助理文字可用前顯示輸入指示。
- `thinking` 仍會回應串流推理（`reasoningLevel: "stream"`），也可以在推理增量到達前因主動執行而開始顯示輸入指示。
- 心跳偵測輸入指示是解析後傳遞目標的存活訊號。它會在心跳偵測執行開始時啟動，而非依循 `message` 或 `thinking` 的串流時機。將 `typingMode: "never"` 設為停用即可關閉。
- 當心跳偵測目標為 `"none"`、無法解析目標、心跳偵測的聊天傳遞已停用，或頻道不支援輸入指示時，心跳偵測不會顯示輸入指示。
- `agents.defaults.typingIntervalSeconds` 控制的是**重新整理週期**，而非開始時間。預設值：6 秒。`agents.entries.*.typingIntervalSeconds` 可依代理程式覆寫此設定。

## 相關內容

<CardGroup cols={2}>
  <Card title="在線狀態" href="/zh-TW/concepts/presence" icon="signal">
    閘道如何追蹤已連線的用戶端，以供控制介面的「裝置」頁面與 macOS 的「執行個體」分頁使用。
  </Card>
  <Card title="串流與分塊" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    輸出串流行為、分塊邊界，以及各頻道特有的傳遞方式。
  </Card>
</CardGroup>
