---
read_when:
    - Claude Code で OpenClaw Gateway の MCP ツールを使用する場合
    - 外部ハーネス用に、セッションに紐づく一時的な MCP 権限付与が必要です
summary: '`openclaw attach` の CLI リファレンス（スコープを限定した Gateway MCP 権限で Claude Code を起動）'
title: CLI を接続
x-i18n:
    generated_at: "2026-07-11T22:06:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` は、1つの Gateway セッションにバインドされた厳格な一時 MCP 設定を使用して Claude Code を起動します。

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

オプション:

- `--session <key>` は許可を Gateway セッションにバインドします。デフォルトはメインセッションです。
- `--ttl <ms>` は、ミリ秒単位の正の許可 TTL を要求します。Gateway は独自の上限を適用します。
- `--bin <path>` は Claude Code バイナリを選択します。デフォルト: `claude`。
- `--print-config` は一時的な `.mcp.json` を書き込み、起動コマンドと環境変数を出力し、TTL が期限切れになるまで許可を有効なままにします（Claude Code の起動も許可の取り消しも行いません）。

ベアラートークンは argv ではなく、環境変数を介して渡されます。OpenClaw は `--strict-mcp-config --mcp-config <path>` を指定して Claude Code を起動するため、環境に存在する Claude MCP サーバーが接続先セッションに加わることはありません。通常の起動（`--print-config` を使用しない場合）では、Claude Code プロセスの終了時に許可が取り消されます。

関連項目: [Gateway CLI](/ja-JP/cli/gateway)、[MCP CLI](/ja-JP/cli/mcp)、[ACP CLI](/ja-JP/cli/acp)。
