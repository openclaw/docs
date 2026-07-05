---
read_when:
    - 設定長時間執行的聊天回合可見進度更新
    - 在 partial、block 與 progress 串流模式之間選擇
    - 說明 OpenClaw 如何在工作進行中更新一則頻道訊息
    - 疑難排解進度草稿、獨立進度訊息或完成處理後備機制
summary: 進度草稿：在代理程式執行時更新的一則可見進行中訊息
title: 進度草稿
x-i18n:
    generated_at: "2026-07-05T11:15:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e284f9a7895ac9111608899ba8a4b4824a10159bc38b4158928bdf7fd3c45cd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

進度草稿會在代理程式工作時，將一則頻道訊息變成即時狀態列，而不是堆疊一串暫時性的「仍在工作」回覆。設定 `channels.<channel>.streaming.mode: "progress"` 後，OpenClaw 會在真正工作開始時建立訊息，在代理程式讀取、規劃、呼叫工具或等待核准時編輯它，然後將它轉為最終答案。

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

<Note>
  當 `channels.discord.streaming.mode`/`streamMode` 未設定時，Discord 已預設使用 `streaming.mode: "progress"`，因此不需任何設定就會顯示進度草稿。其他所有頻道預設為 `partial` 或 `off`；完整的各頻道預設表請參閱[串流與分塊](/zh-TW/concepts/streaming#channel-mapping)。
</Note>

## 快速開始

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

從這裡開始的預設值：自動單字標籤、5 秒的開始延遲（或在第二個工作事件發生時立即開始）、在有實際工作進行時顯示精簡的進度列，並抑制該回合較舊的獨立進度訊息。

本頁說明進度草稿體驗及其設定旋鈕。如需完整的串流模式矩陣、各頻道執行階段備註，以及舊鍵遷移，請參閱[串流與分塊](/zh-TW/concepts/streaming)。

## 使用者會看到什麼

| 部分           | 用途                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| 標籤          | 短的起始/狀態列，例如 `Working` 或 `Shelling`。                        |
| 進度列 | 使用與 `/verbose` 相同的工具圖示和詳細資訊格式化器，顯示精簡的執行更新。 |

當代理程式開始有意義的工作並在初始延遲期間保持忙碌，或第二個工作事件立即觸發時，標籤就會出現。它位於滾動進度列清單的頂端，因此在出現足夠多的具體工作列後會被捲走。只有純文字的回覆永遠不會顯示進度草稿；只有真正的工作更新才會出現一列，例如 `🛠️ Bash: run tests`、`🔎 Web Search: for "discord edit message"`，或 `✍️ Write: to /tmp/file`。

當頻道可以安全地這麼做時，最終答案會就地取代草稿；否則 OpenClaw 會透過一般傳送流程送出最終答案，並清理草稿或停止更新草稿（請參閱[完成處理](#finalization)）。

## 選擇模式

`channels.<channel>.streaming.mode` 控制可見的進行中行為：

| 模式       | 最適合                         | 聊天中會出現什麼                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | 安靜的頻道                   | 只有最終答案。                            |
| `partial`  | 觀看答案文字出現      | 一則草稿會以最新答案文字編輯。     |
| `block`    | 較大的答案預覽區塊     | 一則預覽會以較大的區塊更新或附加。 |
| `progress` | 工具密集或長時間執行的回合 | 一則狀態草稿，接著是最終答案。          |

當使用者更關心「正在發生什麼」而不是逐一權杖觀看答案文字串流時，選擇 `progress`；當答案文字本身就是進度訊號時，選擇 `partial`；較大的預覽區塊則使用 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍然是預覽串流，而不是一般的區塊回覆傳送 — 如需該功能，請使用 `streaming.block.enabled`（或舊版 `blockStreaming`）。

## 設定標籤

進度標籤位於 `channels.<channel>.streaming.progress` 底下。預設的 `label` 是 `"auto"`，會從 OpenClaw 內建的單字標籤池挑選：

```text
Working, Shelling, Scuttling, Clawing, Pinching, Molting, Bubbling, Tiding,
Reefing, Cracking, Sifting, Brining, Nautiling, Krilling, Barnacling,
Lobstering, Tidepooling, Pearling, Snapping, Surfacing
```

使用固定標籤：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

使用你自己的標籤池（當 `label: "auto"` 時仍會隨機/依種子挑選）：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

隱藏標籤，只顯示進度列：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## 控制進度列

進度列來自真正的執行事件：工具開始、項目更新、任務計畫、核准、命令輸出、修補摘要，以及類似的代理程式活動。它們預設啟用（`progress.toolProgress`，預設為 `true`）。

工具也可以在單次呼叫仍在執行時發出型別化進度。這就是緩慢擷取或搜尋在工具回傳最終結果之前，更新可見草稿的方式。進度更新是一個部分工具結果，包含空的模型內容與明確的公開頻道中繼資料：

```json
{
  "content": [],
  "progress": {
    "text": "Fetching page content...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw 只會在頻道進度介面中呈現 `progress.text`。一般工具結果仍會稍後以 `content`/`details` 抵達，且只有那一部分會回傳給模型。

為工具加入進度時，請發出簡短、通用的訊息，並延遲到作業已待處理足夠久、顯示它有實用價值時才發出。`web_fetch` 正是以 5 秒延遲這麼做：

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Fetching page content...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

快速呼叫不會顯示進度列；長時間呼叫會在仍待處理時顯示一列；已取消的呼叫會在過期進度可能出現前清除計時器。進度文字是公開的介面側頻道，因此絕不可包含秘密、原始引數、擷取內容、命令輸出或頁面文字。

### 詳細模式

OpenClaw 對進度草稿和 `/verbose` 使用相同的格式化器：

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` 是預設值，會用精簡標籤讓草稿保持穩定。`"raw"` 會在可用時附加底層命令，這在除錯時很有用，但在聊天中較嘈雜。例如，`node --check /tmp/app.js` 呼叫會依模式呈現不同內容：

| 模式      | 進度列                                                   |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### 命令/執行文字

`streaming.progress.commandText`（預設 `"raw"`）控制 exec/bash 進度列旁顯示多少命令細節，獨立於上方的詳細模式。將它設為 `"status"` 可保留可見的工具進度列，同時完全隱藏命令文字：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### commentary 通道

`streaming.progress.commentary`（預設 `false`）會將模型在工具前的 commentary/preamble 敘述（💬，例如「I'll check... then ...」）與工具列交錯顯示在草稿中。請參閱[串流與分塊](/zh-TW/concepts/streaming#commentary-progress-lane)，了解跨頻道共用的設定形狀。

### 列數限制

限制保持可見的列數（預設 8）：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

進度列會自動壓縮，以在草稿被編輯時減少聊天泡泡重新排版，且 OpenClaw 會截斷長列，避免重複草稿編輯在每次更新時以不同方式換行。預設的每列預算為 120 個字元；散文會在單字邊界裁切，而路徑或原始命令等長細節會以中間省略號縮短，讓後綴保持可見。

調整每列預算：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

### 豐富呈現（Slack）

Slack 可以將進度列呈現為結構化的 Block Kit 欄位，而不是純文字：

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

豐富呈現一律會在 Block Kit 欄位旁一併傳送相同的純文字本文，因此無法呈現較豐富形狀的用戶端仍會顯示精簡進度文字。

### 隱藏工具/任務列

保留單一進度草稿，但隱藏工具和任務列：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

使用 `toolProgress: false` 時，OpenClaw 仍會抑制該回合較舊的獨立工具進度訊息 — 除非已設定標籤，否則頻道會在視覺上保持安靜，直到最終答案出現。

## 頻道行為

| 頻道         | 進度傳輸                     | 備註                                                                                                                                                     |
| --------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 傳送一則訊息，然後編輯它。        | 預設為 `progress` 模式；當最終文字可放入一則安全預覽訊息時，會就地編輯。                                                             |
| Matrix          | 傳送一個事件，然後編輯它。          | 帳戶層級的串流設定會控制帳戶層級的草稿。                                                                                             |
| Microsoft Teams | 個人聊天中的原生 Teams 串流。 | `streaming.mode: "block"` 會改為對應到 Teams 區塊傳送。                                                                                           |
| Slack           | 原生串流或可編輯的草稿貼文。  | 需要回覆討論串目標；沒有目標的頂層私訊仍會取得草稿預覽貼文與編輯。                                                           |
| Telegram        | 傳送一則訊息，然後編輯它。        | 如果有訊息落在進度草稿和答案之間，草稿會重新張貼到該訊息下方（先張貼新的再刪除舊的），而不是讓用戶端跳動捲動。 |
| Mattermost      | 可編輯的草稿貼文。                   | 工具活動會折疊進同一則草稿樣式貼文。                                                                                                       |

沒有安全編輯支援的頻道會退回到輸入指示器或僅最終傳送。各頻道完整的執行階段行為拆解，請參閱[串流與分塊](/zh-TW/concepts/streaming)。

## 完成處理

當最終答案就緒時，OpenClaw 會嘗試保持聊天乾淨：

- 如果草稿可以安全地成為最終答案，OpenClaw 會就地編輯它。
- 如果頻道使用原生進度串流，OpenClaw 會在原生傳輸接受最終文字時完成該串流。
- 否則（媒體、核准提示、明確回覆目標、分塊過多，或編輯/傳送失敗），OpenClaw 會改透過一般頻道傳遞路徑傳送最終答案，而不是覆寫草稿。

這個備援是刻意設計的：傳送新的最終答案，勝過遺失文字、將回覆串錯討論串，或用頻道無法安全表示的酬載覆寫草稿。

## 疑難排解

**我只看到最終答案。**

請確認處理該訊息的帳號或頻道，其 `channels.<channel>.streaming.mode` 是 `progress`。某些群組或引用回覆路徑會在頻道無法安全編輯正確訊息時，於該回合停用草稿預覽。

**我看到標籤，但沒有工具行。**

請檢查 `streaming.progress.toolProgress`。如果它是 `false`，OpenClaw 會保留單一草稿行為，但隱藏工具與任務進度行。

**我看到新的最終訊息，而不是已編輯的草稿。**

這就是 [最終定稿](#finalization) 中描述的安全備援。它可能發生於媒體回覆、長答案、明確回覆目標、舊的 Telegram 草稿、遺失 Slack 討論串目標、已刪除的預覽訊息，或原生串流最終定稿失敗。

**我仍然看到獨立的進度訊息。**

只要草稿處於作用中，進度模式就會抑制預設的獨立工具進度訊息。如果仍然出現獨立訊息，請確認該回合實際上使用的是 `progress` 模式，而不是 `streaming.mode: "off"`，也不是無法為該訊息建立草稿的頻道路徑。

**Teams 的行為與 Discord 或 Telegram 不同。**

Microsoft Teams 在個人聊天中使用原生串流，而不是通用的傳送後編輯預覽傳輸，並且會將 `streaming.mode: "block"` 對應到 Teams 區塊傳遞，因為它沒有像 Discord 和 Telegram 那樣的草稿預覽區塊模式。

## 相關

- [串流與分塊](/zh-TW/concepts/streaming)
- [訊息](/zh-TW/concepts/messages)
- [頻道設定](/zh-TW/gateway/config-channels)
- [Discord](/zh-TW/channels/discord)
- [Matrix](/zh-TW/channels/matrix)
- [Microsoft Teams](/zh-TW/channels/msteams)
- [Slack](/zh-TW/channels/slack)
- [Telegram](/zh-TW/channels/telegram)
- [Mattermost](/zh-TW/channels/mattermost)
