---
read_when:
    - 你將群組聊天路由到專用代理程式
    - 你想要平行處理工作，而不是讓一個長時間任務阻塞每個聊天
    - 你正在設計多代理作業設定
sidebarTitle: Specialist lanes
status: active
summary: 執行平行專家代理，而不佔用共用模型與工具容量
title: 平行專家通道
x-i18n:
    generated_at: "2026-07-05T11:14:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09852b6cf5a790e98fb5e0805b0df57b2f3719b1387ecfacfb4973bb6841abb4
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

平行專家通道讓同一個閘道能將不同聊天或房間路由到
不同代理，同時保持快速的使用者體驗。請把平行處理視為
稀缺資源的設計問題，而不只是「更多代理」。

## 第一原則

只有在專家通道能減少真正瓶頸的爭用時，才會提升吞吐量：

- **工作階段鎖定**：一次應該只有一個執行能修改指定工作階段。
- **全域模型容量**：所有可見的聊天執行仍會共用供應商限制。
- **工具容量**：shell、瀏覽器、網路與儲存庫作業可能比模型回合本身更慢。
- **上下文預算**：冗長逐字稿會讓每個未來回合更慢且更不聚焦。
- **擁有權不明確**：重複代理做同一份工作會浪費容量。

OpenClaw 已經會按工作階段序列化執行，並透過[命令佇列](/zh-TW/concepts/queue)
限制全域平行度。專家通道會在其上加入政策：哪個代理擁有哪些工作、
哪些留在聊天中，以及哪些成為背景工作。

## 建議推出方式

### 階段 1：通道契約 + 背景繁重工作

在每個通道的工作區與系統提示中提供書面契約：

- **目的**：此通道擁有的工作。
- **非目標**：它應該交接而非嘗試的工作。
- **聊天預算**：快速答案留在聊天中；長任務先簡短確認，
  然後在背景子代理或任務中執行。
- **交接規則**：當另一個通道擁有該工作時，說明應該送往何處，
  並提供精簡的交接摘要。
- **工具風險規則**：偏好能完成工作的最小工具介面。

這是成本最低的階段，並能解決大多數阻塞：一項程式碼工作不再
把研究通道拖得像糖漿一樣慢，而且每個聊天都能保持自己的上下文乾淨。

### 階段 2：優先順序與並行控制

圍繞每個通道的商業價值調整佇列與模型容量：

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

將直接/個人聊天與生產營運代理用於高優先順序工作。當系統忙碌時，讓
研究、起草與批次程式碼移到背景任務。

### 階段 3：協調器 / 流量控制器

在多個通道啟用後，加入小型協調器模式：

- 追蹤使用中的通道任務與擁有者。
- 偵測群組間的重複請求。
- 在通道之間路由交接摘要。
- 只呈現阻塞、完成結果，以及人類必須做出的決策。

不要從這裡開始。沒有通道契約的協調器只是在協調混亂。

## 最小通道契約範本

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
