---
read_when:
    - 你正在安裝、設定或稽核 codex-supervisor 外掛
summary: 從 OpenClaw 監督 Codex app-server 工作階段。
title: Codex Supervisor 外掛
x-i18n:
    generated_at: "2026-06-27T19:41:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Codex Supervisor 外掛

從 OpenClaw 監督 Codex app-server 工作階段。

## 發行

- 套件：`@openclaw/codex-supervisor`
- 安裝途徑：包含於 OpenClaw

## 介面

合約：工具

<!-- openclaw-plugin-reference:manual-start -->

## 工作階段列表

`codex_sessions_list` 預設只列出已載入的 Codex 工作階段。設定 `include_stored` 可包含已儲存的歷史記錄；此外掛會使用 Codex app-server 僅限狀態資料庫的列表路徑，並預設將已儲存結果上限設為 200。傳入 `max_stored_sessions` 可降低或提高該上限，最高可達 1000。

<!-- openclaw-plugin-reference:manual-end -->
