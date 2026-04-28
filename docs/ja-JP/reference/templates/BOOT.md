---
read_when:
    - BOOT.mdチェックリストの追加
summary: BOOT.md用のworkspace template
title: BOOT.mdテンプレート
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T05:20:05Z"
  model: gpt-5.4
  provider: openai
  source_hash: 78c31ef770af20fee60c5d9998c7b2eefb0e2139076f26707ee4cf84502b59f8
  source_path: reference/templates/BOOT.md
  workflow: 15
---

# BOOT.md

起動時にOpenClawが何をすべきかについて、短く明確な指示を追加します（`hooks.internal.enabled` を有効にしてください）。
タスクがメッセージを送信する場合は、message toolを使用し、その後に正確な
silent token `NO_REPLY` / `no_reply` で応答してください。

## 関連

- [Agent workspace](/ja-JP/concepts/agent-workspace)
