---
read_when:
    - 你正在安裝、設定或稽核 acpx 外掛
summary: 由外掛管理工作階段與傳輸的 OpenClaw ACP 執行階段後端。
title: ACPx 外掛
x-i18n:
    generated_at: "2026-07-14T14:00:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c0e4333157a0519474e2be77a6cc1f86c1626769bc58fe752ad53eab3c1808f5
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# ACPx 外掛

OpenClaw ACP 執行階段後端，由外掛管理工作階段與傳輸。

## 發行方式

- 套件：`@openclaw/acpx`
- 安裝管道：npm；ClawHub

## 介面

Skills；工作階段目錄：pi

## Pi 原生工作階段

隨附的執行階段會在閘道與已配對的節點上自動偵測 Pi 的工作階段儲存區。已儲存的工作階段會顯示在工作階段側邊欄的 **Pi** 群組中，並可透過 Pi 記載的 JSONL 工作階段格式，以唯讀方式瀏覽逐字稿。此目錄支援專案與全域 `settings.json` 工作階段目錄，以及 `PI_CODING_AGENT_DIR` 和 `PI_CODING_AGENT_SESSION_DIR`。相對路徑會以包含其 `settings.json` 檔案的目錄為基準解析。

在 **Config > Plugins > ACPX Runtime** 下關閉 **Pi Session Catalog**，即可停用探索功能。此功能預設為啟用。

## 相關文件

- [acpx](/zh-TW/tools/acp-agents-setup)
