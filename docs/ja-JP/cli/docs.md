---
read_when:
    - ターミナルからライブの OpenClaw ドキュメントを検索したい場合
summary: '`openclaw docs` のCLIリファレンス（ライブドキュメントインデックスを検索）'
title: ドキュメント
x-i18n:
    generated_at: "2026-04-24T04:50:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

ライブのドキュメントインデックスを検索します。

引数:

- `[query...]`: ライブのドキュメントインデックスに送信する検索語

例:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

注:

- クエリなしの場合、`openclaw docs` はライブドキュメント検索のエントリーポイントを開きます。
- 複数語のクエリは、1 つの検索リクエストとしてそのまま渡されます。

## 関連

- [CLI reference](/ja-JP/cli)
