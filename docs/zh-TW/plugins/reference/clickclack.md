---
read_when:
    - 你正在安裝、設定或稽核 ClickClack 外掛
summary: 新增 ClickClack 頻道介面，用於傳送和接收 OpenClaw 訊息。
title: ClickClack 外掛
x-i18n:
    generated_at: "2026-07-20T00:52:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e59a11826dfc14a7c6945930547804b10e9cb5144d9cdb75657be9f8f4e9129f
    source_path: plugins/reference/clickclack.md
    workflow: 16
---

# ClickClack 外掛

新增 ClickClack 頻道介面，用於傳送及接收 OpenClaw 訊息。

## 發佈

- 套件：`@openclaw/clickclack`
- 安裝途徑：npm；ClawHub：`clawhub:@openclaw/clickclack`

## 介面

頻道：`clickclack`

此外掛可選擇為每個 OpenClaw 工作階段建立與生命週期同步的 ClickClack 頻道。受管理的討論頻道使用同一代理程式的側邊工作階段進行觀察與轉送，而附加的主要工作階段則會收到僅供提取的 `discussion` 工具。如需設定與工作階段工具可見性要求，請參閱 [ClickClack 工作階段討論](/zh-TW/channels/clickclack#session-discussions)。

## 相關文件

- [clickclack](/zh-TW/channels/clickclack)
