---
read_when:
    - ワークスペースを手動でブートストラップする
summary: Workspace 用 HEARTBEAT.md テンプレート
title: HEARTBEAT.md テンプレート
x-i18n:
    generated_at: "2026-07-05T11:46:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md テンプレート

`HEARTBEAT.md` はエージェントのワークスペースにあり、定期 Heartbeat チェックリストを保持します。空、または空白、Markdown コメント、ATX 見出し、空のリストスタブ（`- `、`* [ ]`）、フェンスマーカーのみの状態にしておくと、OpenClaw は Heartbeat モデル呼び出しを完全にスキップします（`reason=empty-heartbeat-file`）。

出荷時のデフォルト内容:

```markdown
<!-- Heartbeat template; comments-only content prevents scheduled heartbeat API calls. -->

# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

定期チェックが必要な場合にのみ、コメント行の下に短いタスクを追加します。小さく保ってください。Heartbeat 実行はティックごと（デフォルトでは 30 分ごと）にこのファイルを読み取るため、肥大化した指示は起床のたびにトークンを消費します。

単純なチェックリストではなく期限到来時のみのチェックを行うには、タスクごとの `interval` と `prompt` フィールドを持つ構造化された `tasks:` ブロックを使用します。形式と動作については [HEARTBEAT.md](/ja-JP/gateway/heartbeat#heartbeatmd-optional) を参照してください。

## 関連

- [Heartbeat](/ja-JP/gateway/heartbeat)
- [Heartbeat 設定](/ja-JP/gateway/config-agents)
