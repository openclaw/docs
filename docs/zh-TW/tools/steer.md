---
read_when:
    - 在代理程式已在執行時使用 /steer 或 /tell
    - 比較 /steer 與 /queue 模式
    - 決定要引導目前執行還是 ACP 工作階段
sidebarTitle: Steer
summary: 引導執行中的作業而不變更佇列模式
title: 引導
x-i18n:
    generated_at: "2026-06-27T20:10:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` 會先嘗試將指引傳送給已在作用中的執行。它適用於「在這次執行仍在工作時調整它」的情境。如果目前的執行階段無法接受導引，OpenClaw 會改將訊息作為一般提示傳送，而不是丟棄它。

## 目前工作階段

使用頂層 `/steer` 以目前工作階段的作用中執行為目標：

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

行為：

- 僅以目前工作階段的作用中執行為目標。
- 獨立於工作階段的 `/queue` 模式運作。
- 當工作階段閒置，或作用中執行無法接受導引時，會用相同訊息開始一般回合。
- 使用作用中執行階段的導引路徑，因此模型會在下一個受支援的執行階段邊界看到該指引。

## 導引與佇列

`/queue steer` 會讓一般傳入訊息在執行作用中抵達時，嘗試導引作用中執行。`/steer <message>` 是明確命令，會嘗試在下一個受支援的執行階段邊界，將該命令的訊息注入作用中執行，不論已儲存的 `/queue` 設定為何。當無法進行該注入時，命令前綴會被移除，且 `<message>` 會作為一般提示繼續。

使用方式：

- 當你想要立即引導作用中執行時，使用 `/steer <message>`。
- 當你希望未來的一般訊息預設導引作用中執行時，使用 `/queue steer`。
- 當未來的一般訊息應等待稍後回合，而不是導引作用中執行時，使用 `/queue collect` 或 `/queue followup`。
- 當最新訊息應取代作用中執行，而不是導引它時，使用 `/queue interrupt`。

如需佇列模式與導引邊界，請參閱[命令佇列](/zh-TW/concepts/queue)和[導引佇列](/zh-TW/concepts/queue-steering)。

## 子代理

頂層 `/steer` 會以目前工作階段的作用中執行為目標。子代理會回報給其父層／請求者工作階段；`/subagents` 僅供檢視使用。

## ACP 工作階段

當目標是 ACP 控制框架工作階段時，使用 `/acp steer`：

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

如需 ACP 工作階段選取與執行階段行為，請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

## 相關

- [斜線命令](/zh-TW/tools/slash-commands)
- [命令佇列](/zh-TW/concepts/queue)
- [導引佇列](/zh-TW/concepts/queue-steering)
- [子代理](/zh-TW/tools/subagents)
