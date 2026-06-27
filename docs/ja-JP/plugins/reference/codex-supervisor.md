---
read_when:
    - codex-supervisor プラグインをインストール、設定、または監査している
summary: OpenClaw から Codex app-server セッションを監督する。
title: Codex Supervisor Plugin
x-i18n:
    generated_at: "2026-06-27T12:22:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Codex Supervisor Plugin

OpenClaw から Codex app-server セッションを監督します。

## 配布

- パッケージ: `@openclaw/codex-supervisor`
- インストール経路: OpenClaw に含まれます

## サーフェス

contracts: tools

<!-- openclaw-plugin-reference:manual-start -->

## セッション一覧

`codex_sessions_list` は既定で、読み込まれた Codex セッションのみを対象にします。保存済み履歴を含めるには `include_stored` を設定します。この Plugin は Codex app-server の state DB のみの一覧取得パスを使用し、保存済み結果の上限を既定で 200 件にします。その上限を下げる、または最大 1000 件まで上げるには、`max_stored_sessions` を渡します。

<!-- openclaw-plugin-reference:manual-end -->
