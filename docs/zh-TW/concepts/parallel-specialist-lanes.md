---
read_when:
    - 你將群組聊天路由到專用代理
    - 你希望並行處理工作，而不讓一個長時間任務阻塞每段對話
    - 你正在設計多代理作業設定
sidebarTitle: Specialist lanes
status: active
summary: 執行平行的專門代理，而不佔滿共享模型與工具容量
title: 並行專家工作線
x-i18n:
    generated_at: "2026-05-02T20:46:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09f10ce4fbd79954a7196fbedb23f9b3f34b459b98eb7a5480f7eeb0bb6be98
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

平行專家通道讓一個 Gateway 能將不同聊天或聊天室路由到不同代理程式，同時維持快速的使用者體驗。關鍵是將平行處理視為稀缺資源的設計問題，而不只是「更多代理程式」。

## 基本原則

只有在專家通道能減少對真正瓶頸的爭用時，才會提升吞吐量：

- **工作階段鎖定**：同一時間只應有一個執行可變更指定工作階段。
- **全域模型容量**：所有可見聊天執行仍會共用提供者限制。
- **工具容量**：shell、瀏覽器、網路與儲存庫工作可能比模型回合本身更慢。
- **上下文預算**：冗長轉錄會讓未來每個回合都更慢且更難聚焦。
- **所有權不明確**：重複代理程式做同一份工作會浪費容量。

OpenClaw 已經依工作階段序列化執行，並透過[命令佇列](/zh-TW/concepts/queue)限制全域平行度。專家通道會在其上加入政策：哪個代理程式擁有哪項工作、哪些留在聊天中，以及哪些變成背景工作。

## 建議推出方式

### 階段 1：通道合約 + 背景重型工作

在每個通道的工作區與系統提示中提供書面合約：

- **用途**：此通道負責的工作。
- **非目標**：它應交接而非嘗試處理的工作。
- **聊天預算**：快速回答留在聊天中；長任務應簡短確認，然後在背景子代理程式或任務中執行。
- **交接規則**：當另一個通道擁有該工作時，說明應交給哪裡，並提供精簡的交接摘要。
- **工具風險規則**：偏好能完成工作的最小工具介面。

這是成本最低的階段，也能解決大多數阻塞：一個編碼工作不再讓研究通道變得遲緩，每個聊天也能保持自身上下文乾淨。

### 階段 2：優先順序與並行控制

依照每個通道的商業價值調整佇列與模型容量：

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8 },
    },
  },
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
    },
  },
}
```

將直接/個人聊天與生產營運代理程式用於高優先順序工作。當系統忙碌時，讓研究、草擬與批次編碼轉移到背景任務。

### 階段 3：協調器 / 流量控制器

當多個通道啟用後，加入一個小型協調器模式：

- 追蹤作用中的通道任務與擁有者。
- 偵測群組之間的重複請求。
- 在通道之間路由交接摘要。
- 只呈現阻塞項目、完成結果，以及人類必須做出的決策。

不要從這裡開始。沒有通道合約的協調器只是在協調混亂。

## 最小通道合約範本

```md
# Lane contract

## Owns

- <job this lane is responsible for>

## Does not own

- <work to hand off>

## Chat budget

- Answer quick questions directly.
- For multi-step, slow, or tool-heavy work: acknowledge briefly, spawn/background
  the work, then return the result when complete.

## Handoff

If another lane owns the request, reply with:

- target lane
- objective
- relevant context
- exact next action

## Tool posture

Use the smallest tool surface that can complete the task. Avoid broad shell or
network work unless this lane explicitly owns it.
```

## 相關

- [多代理程式路由](/zh-TW/concepts/multi-agent)
- [命令佇列](/zh-TW/concepts/queue)
- [子代理程式](/zh-TW/tools/subagents)
