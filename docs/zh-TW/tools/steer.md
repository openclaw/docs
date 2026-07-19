---
read_when:
    - 在代理程式已執行時使用 /steer 或 /tell
    - 比較 /steer 與 /queue 模式
    - 決定要引導目前的執行，還是 ACP 工作階段
sidebarTitle: Steer
summary: 在不變更佇列模式的情況下引導進行中的執行作業
title: 引導
x-i18n:
    generated_at: "2026-07-19T14:07:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d420e14982d52520e415103ffa6d86923fad6f13c43ff7741ebbd8dde0d0073f
    source_path: tools/steer.md
    workflow: 16
---

`/steer` 會先嘗試將指引傳送給已在執行中的作業。它適用於
「趁這次執行仍在運作時進行調整」的情況。如果目前的執行階段
無法接受引導，OpenClaw 會改為將訊息當作一般提示傳送，
而不會將其丟棄。

## 目前的工作階段

使用頂層 `/steer`，以目前工作階段中正在執行的作業為目標：

```text
/steer 優先採用較小的修補，並讓測試聚焦
/tell 在進行下一次工具呼叫之前先摘要
```

行為：

- 僅以目前工作階段中正在執行的作業為目標。
- 不受工作階段的 `/queue` 模式影響，可獨立運作。
- 當工作階段閒置，或正在執行的作業無法接受引導時，
  會使用相同訊息開始一般回合。
- 使用目前執行階段的引導路徑，因此模型會在下一個受支援的執行階段邊界
  看到該指引。

## 引導與佇列

當有作業正在執行時，`/queue steer` 會讓此時抵達的一般傳入訊息
嘗試引導正在執行的作業。`/steer <message>` 是明確命令，
無論儲存的 `/queue` 設定為何，都會嘗試在下一個
受支援的執行階段邊界，將該命令的訊息注入正在執行的作業。當
無法進行該注入時，命令前綴會被移除，而 `<message>`
會繼續作為一般提示。

明確的 `/steer`（以及 `/tell`）命令由閘道支援。在
`openclaw chat` 或 `openclaw tui --local` 中，選取 `/queue steer`，並以
一般訊息傳送指引；內嵌執行階段會套用相同的引導原則，
而不會轉送閘道命令。

使用方式：

- `/steer <message>`：想要立即引導正在執行的作業時使用。
- `/queue steer`：希望未來的一般訊息預設會引導正在執行的作業時
  使用。
- `/queue collect` 或 `/queue followup`：希望未來的一般訊息等待
  後續回合，而不是引導正在執行的作業時使用。
- `/queue interrupt`：希望最新訊息取代正在執行的作業，
  而不是引導它時使用。

如需瞭解佇列模式和引導邊界，請參閱[命令佇列](/zh-TW/concepts/queue)和
[引導佇列](/zh-TW/concepts/queue-steering)。

## 子代理程式

頂層 `/steer` 以目前工作階段中正在執行的作業為目標。子代理程式會向
其父工作階段／請求者工作階段回報；`/subagents` 僅供查看狀態。

## ACP 工作階段

當目標是 ACP 控制框架工作階段時，使用 `/acp steer`：

```text
/acp steer --session agent:main:acp:codex 收緊重現步驟
```

如需瞭解 ACP 工作階段選取和執行階段
行為，請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

## 相關內容

- [斜線命令](/zh-TW/tools/slash-commands)
- [命令佇列](/zh-TW/concepts/queue)
- [引導佇列](/zh-TW/concepts/queue-steering)
- [子代理程式](/zh-TW/tools/subagents)
