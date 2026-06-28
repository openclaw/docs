---
read_when:
    - 你將群組聊天路由至專用代理
    - 你想要並行工作，而不是讓一個長時間任務阻塞每個對話
    - 您正在設計多代理作業設定
sidebarTitle: Specialist lanes
status: active
summary: 並行執行專門代理，而不阻塞共享的模型與工具容量
title: 平行專家工作線
x-i18n:
    generated_at: "2026-05-10T19:32:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8721056fbe08822ac92d4bc14c8c2b0977e93eaa58c2849f83b3c0f310992f93
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
    postprocess_version: locale-links-v1
---

平行專門通道讓同一個 Gateway 能將不同聊天或聊天室路由到
不同代理，同時保持快速的使用者體驗。訣竅是把平行化視為稀缺資源的
設計問題，而不只是「更多代理」。

## 第一原則

只有在專門通道能降低真實瓶頸的競爭時，才會提升吞吐量：

- **工作階段鎖定**：同一時間只應有一個執行可變更指定工作階段。
- **全域模型容量**：所有可見的聊天執行仍會共享供應商限制。
- **工具容量**：shell、瀏覽器、網路和儲存庫作業可能比模型回合本身更慢。
- **情境預算**：冗長的逐字稿會讓未來每個回合更慢且更不聚焦。
- **擁有權模糊**：重複的代理執行相同工作會浪費容量。

OpenClaw 已經按工作階段序列化執行，並透過[命令佇列](/zh-TW/concepts/queue)限制全域平行度。
專門通道會在其上加入策略：哪個代理擁有哪些工作、哪些留在聊天中，以及哪些變成背景工作。

## 建議推出方式

### 第 1 階段：通道合約 + 背景重型工作

在每個通道的工作區和系統提示中提供書面合約：

- **目的**：此通道負責的工作。
- **非目標**：它應該交接而不是嘗試處理的工作。
- **聊天預算**：快速回答留在聊天中；長任務應先簡短確認，
  然後在背景子代理或任務中執行。
- **交接規則**：當另一個通道擁有該工作時，說明應移往何處，
  並提供精簡的交接摘要。
- **工具風險規則**：偏好可完成工作的最小工具介面。

這是成本最低的階段，也能解決多數壅塞：一個程式開發工作不再讓研究通道變得遲鈍，
而且每個聊天都能保持自己的情境整潔。

### 第 2 階段：優先順序與並行控制

依每個通道的業務價值調整佇列與模型容量：

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8, delegationMode: "prefer" },
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

將直接/個人聊天與生產營運代理用於高優先工作。當系統繁忙時，讓研究、草擬和批次程式開發移到背景任務。

### 第 3 階段：協調器 / 流量控制器

在多個通道啟用後，加入小型協調器模式：

- 追蹤作用中的通道任務與擁有者。
- 偵測跨群組的重複請求。
- 在通道之間路由交接摘要。
- 只浮現阻礙因素、已完成結果，以及人類必須做出的決策。

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

- [多代理路由](/zh-TW/concepts/multi-agent)
- [命令佇列](/zh-TW/concepts/queue)
- [子代理](/zh-TW/tools/subagents)
