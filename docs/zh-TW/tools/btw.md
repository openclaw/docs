---
read_when:
    - 你想詢問一個關於目前工作階段的快速附帶問題
    - 你正在跨用戶端實作或偵錯 BTW 行為
summary: 使用 /btw 的暫時性題外問題
title: 順帶一問的題外問題
x-i18n:
    generated_at: "2026-07-05T11:49:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c20220c037e4b6963b1708f75dc7f268a76b88b297363e9b65e6d3d8bfa6d26a
    source_path: tools/btw.md
    workflow: 16
---

`/btw`（別名 `/side`）會針對**目前工作階段**提出快速的旁支問題，而不將其加入對話歷史。它仿照 Claude Code 的 `/btw`，並針對 OpenClaw 的閘道與多通道架構進行調整。

```text
/btw what changed?
/side what does this error mean?
```

## 它會做什麼

1. 將目前工作階段快照為背景脈絡（包含任何進行中的主執行提示）。
2. 執行一個獨立的一次性旁支查詢，告訴模型只回答該旁支問題，不要恢復或導向主要任務。
3. 將答案作為即時旁支結果送出，而不是一般助理訊息。
4. 絕不將問題或答案寫入工作階段歷史或 `chat.history`。

如果有正在執行的主執行，它會保持不變。

對於 Codex harness 工作階段，BTW 會將作用中的 Codex app-server thread 分叉成一個暫時的子 thread，而不是執行獨立的供應商呼叫。這會保留 Codex OAuth 與原生工具/thread 行為，而分叉出的 thread 會保留父 thread 目前的核准政策、沙盒與原生工具介面。分叉出的 thread 會取得一段邊界提示，告訴模型在此之前的一切都是繼承的參考脈絡，而不是有效指令，且只有邊界之後的訊息是即時的。`/btw` 需要既有的 Codex thread；請先傳送一般訊息。

對於命令列介面執行階段別名，BTW 會以一次性旁支問題模式叫用所屬的命令列介面後端：它會將經過清理的對話脈絡植入新的命令列介面叫用，並停用工具綑綁與可重用工作階段狀態，且加入後端支援的任何 no-resume/no-tools 旗標。直接（非命令列介面）執行階段則改用直接的一次性供應商呼叫。

## 它不會做什麼

`/btw` 不會建立持久工作階段、不會繼續未完成的主要任務、不會將問題/答案資料保存到逐字稿歷史，也不會在重新載入後保留。

## 傳遞模型

一般助理聊天使用閘道 `chat` 事件。BTW 使用獨立的 `chat.side_result` 事件，因此用戶端不會將它誤認為一般對話歷史。因為它不會從 `chat.history` 重播，所以重新載入後會消失。

## 介面行為

| 介面              | 行為                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 終端介面          | 在聊天記錄中內嵌呈現，且明顯不同於一般回覆，可用 `Enter` 或 `Esc` 關閉。                                                                               |
| 外部通道          | 以清楚標示的一次性回覆傳遞（Telegram、WhatsApp、Discord 沒有本機暫時性覆蓋層）。                                                                        |
| Control UI / 網頁 | 閘道會正確發出 `chat.side_result`，且它會從 `chat.history` 排除，但 Control UI 目前尚無消費者可在瀏覽器中即時呈現它。                                  |

## 何時使用

使用 `/btw` 來快速釐清問題、在長時間執行仍在進行時取得事實性的旁支答案，或取得不應進入未來工作階段脈絡的暫時答案。

```text
/btw what file are we editing?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

如果你希望某件事成為工作階段未來工作脈絡的一部分，請改在主要工作階段中正常詢問。

## 相關

<CardGroup cols={2}>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    原生命令目錄與聊天指令。
  </Card>
  <Card title="思考層級" href="/zh-TW/tools/thinking" icon="brain">
    旁支問題模型呼叫的推理投入層級。
  </Card>
  <Card title="工作階段" href="/zh-TW/concepts/session" icon="comments">
    工作階段金鑰、歷史與持久化語意。
  </Card>
  <Card title="導向命令" href="/zh-TW/tools/steer" icon="arrow-right">
    將導向訊息注入作用中執行，而不結束它。
  </Card>
</CardGroup>
