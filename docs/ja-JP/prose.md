---
read_when:
    - '`.prose` ワークフローを実行または作成したい場合'
    - OpenProse Plugin を有効にしたい場合
    - state ストレージを理解する必要がある場合
summary: 'OpenProse: OpenClaw における `.prose` ワークフロー、スラッシュコマンド、state'
title: OpenProse
x-i18n:
    generated_at: "2026-04-24T05:13:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 15
---

OpenProse は、AI セッションをオーケストレーションするための、ポータブルで Markdown ファーストなワークフローフォーマットです。OpenClaw では、OpenProse Skill pack と `/prose` スラッシュコマンドをインストールする Plugin として提供されます。プログラムは `.prose` ファイル内にあり、明示的な制御フローで複数のサブエージェントを起動できます。

公式サイト: [https://www.prose.md](https://www.prose.md)

## できること

- 明示的な並列性を持つマルチエージェント調査 + 統合。
- 再現可能で承認安全なワークフロー（コードレビュー、インシデントトリアージ、コンテンツパイプライン）。
- サポートされるエージェントランタイムをまたいで実行できる再利用可能な `.prose` プログラム。

## インストール + 有効化

bundled Plugins はデフォルトで無効です。OpenProse を有効化するには:

```bash
openclaw plugins enable open-prose
```

Plugin を有効化した後、Gateway を再起動してください。

開発/ローカル checkout: `openclaw plugins install ./path/to/local/open-prose-plugin`

関連ドキュメント: [Plugins](/ja-JP/tools/plugin), [Plugin manifest](/ja-JP/plugins/manifest), [Skills](/ja-JP/tools/skills)。

## スラッシュコマンド

OpenProse は、ユーザーが呼び出せる Skill コマンドとして `/prose` を登録します。これは OpenProse VM 命令にルーティングされ、内部では OpenClaw tools を使います。

一般的なコマンド:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## 例: シンプルな `.prose` ファイル

```prose
# 2 つのエージェントを並列実行する調査 + 統合。

input topic: "何を調査すべきでしょうか？"

agent researcher:
  model: sonnet
  prompt: "徹底的に調査し、出典を明記してください。"

agent writer:
  model: opus
  prompt: "簡潔な要約を書いてください。"

parallel:
  findings = session: researcher
    prompt: "{topic} を調査してください。"
  draft = session: writer
    prompt: "{topic} を要約してください。"

session "findings と draft を統合して最終回答にしてください。"
context: { findings, draft }
```

## ファイルの保存場所

OpenProse は workspace の `.prose/` 配下に state を保持します。

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

ユーザーレベルの永続エージェントは次に保存されます。

```
~/.prose/agents/
```

## State モード

OpenProse は複数の state backend をサポートします。

- **filesystem**（デフォルト）: `.prose/runs/...`
- **in-context**: 小さなプログラム向けの一時的なもの
- **sqlite**（実験的）: `sqlite3` バイナリが必要
- **postgres**（実験的）: `psql` と接続文字列が必要

注意:

- sqlite/postgres はオプトインで、実験的です。
- postgres 認証情報はサブエージェントログへ流れ込みます。専用の、最小権限の DB を使ってください。

## リモートプログラム

`/prose run <handle/slug>` は `https://p.prose.md/<handle>/<slug>` に解決されます。
直接 URL はそのまま取得されます。これは `web_fetch` tool（または POST では `exec`）を使います。

## OpenClaw ランタイムへのマッピング

OpenProse プログラムは OpenClaw のプリミティブにマッピングされます。

| OpenProse の概念           | OpenClaw tool    |
| -------------------------- | ---------------- |
| セッション起動 / Task tool | `sessions_spawn` |
| ファイル読み書き           | `read` / `write` |
| Web 取得                   | `web_fetch`      |

tool allowlist がこれらの tools をブロックしている場合、OpenProse プログラムは失敗します。[Skills config](/ja-JP/tools/skills-config) を参照してください。

## セキュリティ + 承認

`.prose` ファイルはコードとして扱ってください。実行前に確認してください。副作用を制御するには、OpenClaw の tool allowlist と承認ゲートを使ってください。

決定論的で承認ゲート付きのワークフローについては、[Lobster](/ja-JP/tools/lobster) と比較してください。

## 関連

- [Text-to-speech](/ja-JP/tools/tts)
- [Markdown formatting](/ja-JP/concepts/markdown-formatting)
