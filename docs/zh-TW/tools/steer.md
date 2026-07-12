---
read_when:
    - 在代理程式已執行時使用 /steer 或 /tell
    - 比較 /steer 與 /queue 模式
    - 判斷要引導目前的執行作業還是 ACP 工作階段
sidebarTitle: Steer
summary: 在不變更佇列模式的情況下引導進行中的執行工作
title: 引導
x-i18n:
    generated_at: "2026-07-11T21:55:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` 會先嘗試將指引傳送至已在執行中的執行程序。它適用於
「在這次執行仍在進行時調整它」的情況。如果目前的執行階段
無法接受引導，OpenClaw 會改為將訊息作為一般提示傳送，
而不會將其丟棄。

## 目前工作階段

使用頂層 `/steer`，以目前工作階段的執行中程序為目標：

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

行為：

- 僅以目前工作階段的執行中程序為目標。
- 獨立於工作階段的 `/queue` 模式運作。
- 當工作階段閒置，或執行中程序無法接受引導時，會使用相同訊息開始一般回合。
- 使用執行中執行階段的引導路徑，因此模型會在下一個支援的執行階段邊界看到該指引。

## 引導與佇列

`/queue steer` 會讓一般傳入訊息在執行程序進行中抵達時，嘗試引導該執行中程序。`/steer <message>` 則是一個明確命令，無論儲存的 `/queue` 設定為何，都會嘗試在下一個支援的執行階段邊界，將該命令的訊息注入執行中程序。若無法進行該注入，命令前綴會被移除，而 `<message>`
會繼續作為一般提示。

使用方式：

- 若要立即引導執行中程序，請使用 `/steer <message>`。
- 若要讓未來的一般訊息預設引導執行中程序，請使用 `/queue steer`。
- 若未來的一般訊息應等待後續回合，而非引導執行中程序，請使用 `/queue collect` 或 `/queue followup`。
- 若最新訊息應取代執行中程序，而非引導它，請使用 `/queue interrupt`。

如需瞭解佇列模式與引導邊界，請參閱[命令佇列](/zh-TW/concepts/queue)與
[引導佇列](/zh-TW/concepts/queue-steering)。

## 子代理程式

頂層 `/steer` 以目前工作階段的執行中程序為目標。子代理程式會
回報給其父工作階段／要求者工作階段；`/subagents` 僅供查看。

## ACP 工作階段

當目標是 ACP 控制框架工作階段時，請使用 `/acp steer`：

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

如需 ACP 工作階段選擇與執行階段行為的相關資訊，請參閱
[ACP 代理程式](/zh-TW/tools/acp-agents)。

## 相關內容

- [斜線命令](/zh-TW/tools/slash-commands)
- [命令佇列](/zh-TW/concepts/queue)
- [引導佇列](/zh-TW/concepts/queue-steering)
- [子代理程式](/zh-TW/tools/subagents)
