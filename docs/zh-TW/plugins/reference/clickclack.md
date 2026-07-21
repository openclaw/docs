---
read_when:
    - 你正在安裝、設定或稽核 ClickClack 外掛
summary: 新增 ClickClack 頻道介面，用於傳送及接收 OpenClaw 訊息。
title: ClickClack 外掛
x-i18n:
    generated_at: "2026-07-21T09:02:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fcb39341009946dc38a12cc24496e65fd704ed3f2f9aff44bb2dd29fdedaef26
    source_path: plugins/reference/clickclack.md
    workflow: 16
---

# ClickClack 外掛

新增 ClickClack 頻道介面，用於傳送及接收 OpenClaw 訊息。

## 發布

- 套件：`@openclaw/clickclack`
- 安裝途徑：npm；ClawHub：`clawhub:@openclaw/clickclack`

## 介面

頻道：`clickclack`；合約：`tools`

<!-- openclaw-plugin-reference:manual-start -->

此外掛可選擇為每個 OpenClaw 工作階段建立一個與生命週期同步的 ClickClack 頻道。受管理的討論頻道會使用同一代理程式的側邊工作階段進行觀察與轉送，而附加的主要工作階段則會收到一個僅供提取的 `discussion` 工具。請參閱 [ClickClack 工作階段討論](/zh-TW/channels/clickclack#session-discussions)，以瞭解設定及工作階段工具可見性的需求。

<!-- openclaw-plugin-reference:manual-end -->

## 相關文件

- [clickclack](/zh-TW/channels/clickclack)
