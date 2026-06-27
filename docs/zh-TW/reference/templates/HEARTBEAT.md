---
read_when:
    - 手動啟動工作區
summary: 用於 HEARTBEAT.md 的工作區範本
title: HEARTBEAT.md 範本
x-i18n:
    generated_at: "2026-06-27T20:01:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md 範本

`HEARTBEAT.md` 位於代理工作區中。當你希望 OpenClaw 略過心跳偵測模型呼叫時，請保持此檔案為空，或只包含 Markdown 註解與標題。

預設執行階段範本為：

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

只有在你希望代理定期檢查某些事項時，才在註解下方加入簡短任務。請讓心跳偵測指令保持精簡，因為它們會在週期性喚醒期間被讀取。

## 相關

- [心跳偵測設定](/zh-TW/gateway/config-agents)
