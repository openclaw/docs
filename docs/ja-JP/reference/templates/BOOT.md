---
read_when:
    - BOOT.md チェックリストの追加
summary: BOOT.md のワークスペーステンプレート
title: BOOT.md テンプレート
x-i18n:
    generated_at: "2026-07-11T22:41:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

ここに短く明示的な起動手順を追加します。組み込みの `boot-md` フックは、このファイルが存在し、空白以外の内容が含まれている場合、Gateway が起動するたびに各エージェントワークスペースでこのファイルを1回実行します。複数のエージェントがワークスペースを共有している場合も、実行は1回だけです。

このフックは無効な状態で提供されます。まず有効にします。

```bash
openclaw hooks enable boot-md
```

チェックリスト項目でメッセージを送信する場合は、メッセージツールを使用してから、正確なサイレントトークン `NO_REPLY`（大文字と小文字は区別されません）で応答します。

## 関連項目

- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [フック](/ja-JP/automation/hooks#boot-md)
