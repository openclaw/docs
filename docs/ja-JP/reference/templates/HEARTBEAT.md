---
read_when:
    - ワークスペースを手動で初期構築する
summary: HEARTBEAT.md のワークスペーステンプレート
title: HEARTBEAT.md テンプレート
x-i18n:
    generated_at: "2026-07-11T22:40:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md テンプレート

`HEARTBEAT.md` はエージェントのワークスペースに置かれ、定期的な Heartbeat のチェックリストを保持します。ファイルを空にするか、空白、Markdown コメント、ATX 見出し、空のリスト項目（`- `、`* [ ]`）、またはフェンスマーカーのみを含めると、OpenClaw は Heartbeat のモデル呼び出しを完全にスキップします（`reason=empty-heartbeat-file`）。

同梱されるデフォルトの内容：

```markdown
<!-- Heartbeat テンプレート。コメントのみの内容にすると、スケジュールされた Heartbeat API 呼び出しを防止できます。 -->

# Heartbeat API 呼び出しをスキップするには、このファイルを空にするか、コメントのみを含めてください。

# エージェントに定期的に確認させたいことがある場合は、以下にタスクを追加してください。
```

定期的な確認が必要な場合にのみ、コメント行の下へ短いタスクを追加してください。内容は簡潔に保ってください。Heartbeat の実行ではティックごと（デフォルトでは 30 分ごと）にこのファイルが読み込まれるため、指示が肥大化すると、起動のたびにトークンを消費します。

単純なチェックリストではなく、期限が来たタスクのみを確認するには、タスクごとの `interval` フィールドと `prompt` フィールドを持つ構造化された `tasks:` ブロックを使用してください。形式と動作については、[HEARTBEAT.md](/ja-JP/gateway/heartbeat#heartbeatmd-optional) を参照してください。

## 関連項目

- [Heartbeat](/ja-JP/gateway/heartbeat)
- [Heartbeat の設定](/ja-JP/gateway/config-agents)
