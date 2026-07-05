---
read_when:
    - BOOT.md チェックリストの追加
summary: BOOT.md のワークスペーステンプレート
title: BOOT.md テンプレート
x-i18n:
    generated_at: "2026-07-05T11:49:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

ここに短く明示的な起動手順を追加します。バンドルされている `boot-md` フックは、ファイルが存在し、空白以外の内容がある場合、Gateway が起動するたびにエージェントワークスペースごとにこのファイルを一度実行します。複数のエージェントがワークスペースを共有している場合でも、実行は一度だけトリガーされます。

このフックは無効化された状態で同梱されています。まず有効化してください。

```bash
openclaw hooks enable boot-md
```

チェックリスト項目がメッセージを送信する場合は、メッセージツールを使用し、その後、正確なサイレントトークン `NO_REPLY`（大文字と小文字は区別されません）で返信してください。

## 関連

- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [フック](/ja-JP/automation/hooks#boot-md)
