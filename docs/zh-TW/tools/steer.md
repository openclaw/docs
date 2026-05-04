---
read_when:
    - 在代理程式已在執行時使用 /steer 或 /tell
    - 比較 /steer 與 /queue steer
    - 判斷要引導目前的執行、子代理，還是 ACP 工作階段
sidebarTitle: Steer
summary: 在不變更佇列模式的情況下引導進行中的執行
title: 引導
x-i18n:
    generated_at: "2026-05-04T02:46:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71e1c80c0eea86d5c3c29513d3ed0675c04779fc9c6ee3b8a76c4bedaa264d22
    source_path: tools/steer.md
    workflow: 16
---

`/steer` 會將指引傳送給已在作用中的執行。它用於「在這次執行仍在工作時調整它」的情境，而不是用來開始新的回合。

## 目前工作階段

使用頂層 `/steer` 來指定目前工作階段的作用中執行：

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

行為：

- 只指定目前工作階段的作用中執行。
- 獨立於工作階段的 `/queue` 模式運作。
- 當工作階段閒置時，不會開始新的執行。
- 當沒有可引導的作用中執行時，會回覆警告。
- 使用作用中 runtime 的引導路徑，因此模型會在下一個支援的 runtime 邊界看到該指引。

## 引導與佇列

`/queue steer` 會變更一般傳入訊息在執行作用中時到達的行為。`/steer <message>` 是明確命令，會嘗試在下一個支援的 runtime 邊界，將該命令的訊息注入作用中執行，不受已儲存的 `/queue` 設定影響。

使用：

- 當你想立即引導作用中執行時，使用 `/steer <message>`。
- 當你想讓未來的一般訊息預設引導作用中執行時，使用 `/queue steer`。
- 當新訊息應等待稍後回合，而不是引導作用中執行時，使用 `/queue collect` 或 `/queue followup`。

如需佇列模式與備援行為，請參閱[命令佇列](/zh-TW/concepts/queue)和[引導佇列](/zh-TW/concepts/queue-steering)。

## 子代理

當目標是子執行時，使用 `/subagents steer`：

```text
/subagents steer 2 focus only on the API surface
```

頂層 `/steer` 不會依 id 或清單索引選取子代理。它一律指定目前工作階段的作用中執行。請參閱[子代理](/zh-TW/tools/subagents)，了解子代理 id、標籤與控制命令。

## ACP 工作階段

當目標是 ACP harness 工作階段時，使用 `/acp steer`：

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

請參閱 [ACP 代理](/zh-TW/tools/acp-agents)，了解 ACP 工作階段選取與 runtime 行為。

## 相關

- [斜線命令](/zh-TW/tools/slash-commands)
- [命令佇列](/zh-TW/concepts/queue)
- [引導佇列](/zh-TW/concepts/queue-steering)
- [子代理](/zh-TW/tools/subagents)
