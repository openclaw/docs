---
read_when:
    - 新增 BOOT.md 檢查清單
summary: BOOT.md 的工作區範本
title: BOOT.md 範本
x-i18n:
    generated_at: "2026-07-11T21:49:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

請在此加入簡短、明確的啟動指示。如果此檔案存在且包含非空白內容，內建的 `boot-md` 鉤子會在每次閘道啟動時，針對每個代理程式工作區執行此檔案一次。共用同一工作區的多個代理程式只會觸發一次執行。

此鉤子預設停用。請先啟用：

```bash
openclaw hooks enable boot-md
```

如果檢查清單項目會傳送訊息，請使用訊息工具，然後以完全相同的靜默權杖 `NO_REPLY` 回覆（不區分大小寫）。

## 相關內容

- [代理程式工作區](/zh-TW/concepts/agent-workspace)
- [鉤子](/zh-TW/automation/hooks#boot-md)
