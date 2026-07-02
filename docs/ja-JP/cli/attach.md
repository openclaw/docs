---
read_when:
    - Claude Code に OpenClaw Gateway MCP ツールを使用させたい
    - 外部ハーネス用の一時的なセッション限定 MCP 許可が必要です
summary: 'CLI リファレンス: `openclaw attach` (スコープ付き Gateway MCP 許可で Claude Code を起動)'
title: CLI を接続
x-i18n:
    generated_at: "2026-07-02T00:43:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` は、1 つの Gateway セッションにバインドされた厳格な一時 MCP 設定で Claude Code を起動します。

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

オプション:

- `--session <key>` はグラントを Gateway セッションにバインドします。デフォルトはメインセッションです。
- `--ttl <ms>` はミリ秒単位で正のグラント TTL を要求します。Gateway は独自の上限を適用します。
- `--bin <path>` は Claude Code バイナリを選択します。デフォルトは `claude` です。
- `--print-config` は一時的な `.mcp.json` を書き込み、起動コマンドと env を出力し、TTL が期限切れになるまでグラントを有効なままにします。

ベアラートークンは argv ではなく、環境変数を通じて渡されます。OpenClaw は `--strict-mcp-config --mcp-config <path>` で Claude Code を起動するため、周囲の Claude MCP サーバーはアタッチされたセッションに参加しません。通常の起動では、Claude Code プロセスが終了するとグラントが取り消されます。

関連項目: [Gateway CLI](/ja-JP/cli/gateway)、[MCP CLI](/ja-JP/cli/mcp)、[ACP CLI](/ja-JP/cli/acp)。
