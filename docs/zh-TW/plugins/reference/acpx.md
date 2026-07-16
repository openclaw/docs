---
read_when:
    - 你正在安裝、設定或稽核 acpx 外掛
summary: 具備由外掛管理工作階段與傳輸的 OpenClaw ACP 執行階段後端。
title: ACPx 外掛
x-i18n:
    generated_at: "2026-07-16T11:51:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# ACPx 外掛

OpenClaw ACP 執行階段後端，由外掛自行管理工作階段與傳輸。

## 發布

- 套件：`@openclaw/acpx`
- 安裝管道：npm；ClawHub

## 介面

Skills

<!-- openclaw-plugin-reference:manual-start -->

## Pi 原生工作階段

隨附的執行階段會自動偵測閘道與已配對節點上的 Pi 工作階段儲存區。已儲存的工作階段會顯示在工作階段側邊欄的 **Pi** 群組中，並可依據 Pi 所記載的 JSONL 工作階段格式，以唯讀方式瀏覽對話記錄。目錄會涵蓋專案與全域 `settings.json` 工作階段目錄，以及 `PI_CODING_AGENT_DIR` 和 `PI_CODING_AGENT_SESSION_DIR`。相對路徑會從包含其 `settings.json` 檔案的目錄開始解析。

若要停用探索功能，請在 **Config > Plugins > ACPX Runtime** 下關閉 **Pi Session Catalog**。此功能預設為啟用。

<!-- openclaw-plugin-reference:manual-end -->

## 相關文件

- [acpx](/zh-TW/tools/acp-agents-setup)
