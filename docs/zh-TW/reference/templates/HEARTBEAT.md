---
read_when:
    - 手動啟動工作區
summary: HEARTBEAT.md 的工作區範本
title: HEARTBEAT.md 範本
x-i18n:
    generated_at: "2026-07-05T11:42:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md 範本

`HEARTBEAT.md` 位於代理工作區，並保存定期心跳偵測檢查清單。保持其為空，或僅包含空白、Markdown 註解、ATX 標題、空清單佔位（`- `、`* [ ]`）或程式碼區塊標記，即可讓 OpenClaw 完全略過心跳偵測模型呼叫（`reason=empty-heartbeat-file`）。

隨附的預設內容：

```markdown
<!-- Heartbeat template; comments-only content prevents scheduled heartbeat API calls. -->

# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

只有在你想要定期檢查時，才在註解行下方加入簡短任務。保持精簡：心跳偵測執行會在每個週期讀取此檔案（預設每 30 分鐘一次），因此冗長的指示會在每次喚醒時消耗權杖。

若要使用僅到期檢查，而不是一般檢查清單，請使用結構化的 `tasks:` 區塊，並為每個任務設定 `interval` 和 `prompt` 欄位；格式與行為請參閱 [HEARTBEAT.md](/zh-TW/gateway/heartbeat#heartbeatmd-optional)。

## 相關

- [心跳偵測](/zh-TW/gateway/heartbeat)
- [心跳偵測設定](/zh-TW/gateway/config-agents)
