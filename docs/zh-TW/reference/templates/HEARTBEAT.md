---
read_when:
    - 手動初始化工作區
summary: HEARTBEAT.md 的工作區範本
title: HEARTBEAT.md 範本
x-i18n:
    generated_at: "2026-07-11T21:47:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md 範本

`HEARTBEAT.md` 位於代理程式工作區中，用於保存定期心跳偵測檢查清單。將其保持空白，或僅包含空白字元、Markdown 註解、ATX 標題、空白清單項目（`- `、`* [ ]`）或程式碼圍欄標記，即可讓 OpenClaw 完全略過心跳偵測模型呼叫（`reason=empty-heartbeat-file`）。

隨附的預設內容：

```markdown
<!-- 心跳偵測範本；僅包含註解的內容可避免排程的心跳偵測 API 呼叫。 -->

# 將此檔案保持空白（或僅包含註解），以略過心跳偵測 API 呼叫。

# 若要讓代理程式定期檢查某些項目，請在下方新增任務。
```

只有在需要定期檢查時，才在註解行下方新增簡短任務。內容應保持精簡：每次心跳偵測觸發時都會讀取此檔案（預設每 30 分鐘一次），因此過度冗長的指示會在每次喚醒時消耗權杖。

若要進行僅在到期時執行的檢查，而不是使用一般檢查清單，請使用結構化的 `tasks:` 區塊，並為每項任務設定 `interval` 與 `prompt` 欄位；格式與行為請參閱 [HEARTBEAT.md](/zh-TW/gateway/heartbeat#heartbeatmd-optional)。

## 相關內容

- [心跳偵測](/zh-TW/gateway/heartbeat)
- [心跳偵測設定](/zh-TW/gateway/config-agents)
