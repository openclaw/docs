---
read_when:
    - 你正在安装、配置或审计 codex-supervisor 插件
summary: 从 OpenClaw 监督 Codex app-server 会话。
title: Codex Supervisor 插件
x-i18n:
    generated_at: "2026-06-27T02:46:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Codex Supervisor 插件

从 OpenClaw 监督 Codex app-server 会话。

## 分发

- 软件包：`@openclaw/codex-supervisor`
- 安装方式：包含在 OpenClaw 中

## 表面

contracts: tools

<!-- openclaw-plugin-reference:manual-start -->

## 会话列表

`codex_sessions_list` 默认仅返回已加载的 Codex 会话。设置 `include_stored` 可包含已存储的历史记录；该插件使用 Codex app-server 的仅 state-DB 列表路径，并默认将已存储结果限制为 200 条。传入 `max_stored_sessions` 可降低或提高该上限，最高为 1000。

<!-- openclaw-plugin-reference:manual-end -->
