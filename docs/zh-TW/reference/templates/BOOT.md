---
read_when:
    - 新增 BOOT.md 檢查清單
summary: BOOT.md 的工作區範本
title: BOOT.md 範本
x-i18n:
    generated_at: "2026-07-05T11:45:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

在這裡加入簡短、明確的啟動指示。隨附的 `boot-md` 鉤子會在每次閘道啟動時，針對每個代理工作區執行此檔案一次，前提是檔案存在且包含非空白內容。多個代理共用同一個工作區只會觸發一次執行。

此鉤子預設為停用。請先啟用它：

```bash
openclaw hooks enable boot-md
```

如果檢查清單項目會傳送訊息，請使用訊息工具，然後回覆確切的靜默權杖 `NO_REPLY`（不區分大小寫）。

## 相關

- [代理工作區](/zh-TW/concepts/agent-workspace)
- [鉤子](/zh-TW/automation/hooks#boot-md)
