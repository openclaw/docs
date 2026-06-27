---
read_when:
    - ワークスペースを手動でブートストラップする
summary: HEARTBEAT.md 用のワークスペーステンプレート
title: HEARTBEAT.md テンプレート
x-i18n:
    generated_at: "2026-06-27T13:02:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md テンプレート

`HEARTBEAT.md` はエージェントワークスペースにあります。OpenClaw に Heartbeat モデル呼び出しをスキップさせたい場合は、このファイルを空にするか、Markdown コメントと見出しだけにします。

デフォルトのランタイムテンプレートは次のとおりです。

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

エージェントに何かを定期的に確認させたい場合にのみ、コメントの下に短いタスクを追加します。Heartbeat 指示は定期的な起床時に読み込まれるため、小さく保ってください。

## 関連

- [Heartbeat 設定](/ja-JP/gateway/config-agents)
