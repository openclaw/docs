---
read_when:
    - ターミナルからワークスペースファイル内の単一のリーフを確認または編集したい場合
    - ワークスペースの状態に対してスクリプトを実行しており、種別に依存しない安定したアドレス指定方式が必要な場合
    - 自己ホスト型 Gateway で任意の `oc-path` Plugin を有効にするかどうかを判断している
summary: '同梱の `oc-path` Plugin: `oc://` ワークスペースファイル指定方式向けに `openclaw path` CLI を提供'
title: OC Path Plugin
x-i18n:
    generated_at: "2026-05-10T19:44:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

バンドルされた `oc-path` Plugin は、`oc://` ワークスペースファイルアドレス指定スキーム用の [`openclaw path`](/ja-JP/cli/path) CLI を追加します。これは OpenClaw リポジトリの `extensions/oc-path/` 配下に同梱されていますが、オプトインです。インストールやビルドをしても、有効化するまでは休止状態のままです。

`oc://` アドレスは、ワークスペースファイル内の単一の葉（または葉のワイルドカード集合）を指します。現在、この Plugin は 3 種類のファイルを理解します。

- **Markdown** (`.md`, `.mdx`): frontmatter、セクション、項目、フィールド
- **jsonc** (`.jsonc`, `.json5`, `.json`): コメントと書式を保持
- **jsonl** (`.jsonl`, `.ndjson`): 行指向のレコード

セルフホスト運用者やエディタ拡張は、SDK に直接スクリプトを書くことなく単一の葉を読み書きするために CLI を使用します。エージェントとフックは、これを決定的な基盤として扱うため、バイト忠実な往復変換と墨消し sentinel ガードが種類を問わず一貫して適用されます。

## 有効化する理由

ファイル形状ごとにパーサーを作らずに、スクリプト、フック、またはローカルエージェントツールからワークスペース状態の正確な一部を指したい場合は、`oc-path` を有効化します。単一の `oc://` アドレスで、Markdown frontmatter キー、セクション項目、JSONC 設定の葉、または JSONL イベントフィールドを指定できます。

これは、変更を小さく、監査可能で、再現可能にする必要があるメンテナーのワークフローで重要です。つまり、1 つの値を検査し、一致するレコードを見つけ、書き込みをドライランし、その葉だけを適用しつつ、コメント、行末、周辺の書式はそのままにできます。これをオプトイン Plugin として維持することで、必要のないインストールの core にパーサー依存関係や CLI サーフェスを入れずに、パワーユーザーへアドレス指定基盤を提供できます。

有効化する一般的な理由:

- **ローカル自動化**: シェルスクリプトは、Markdown、JSONC、JSONL それぞれの解析コードを持たずに、`openclaw path … --json` で 1 つのワークスペース値を解決または更新できます。
- **エージェントから見える編集**: エージェントは書き込み前に、アドレス指定された 1 つの葉に対するドライラン差分を表示できます。これは自由形式のファイル書き換えよりレビューしやすくなります。
- **エディタ統合**: エディタは、見出しテキストから推測せずに、`oc://AGENTS.md/tools/gh` を正確な Markdown ノードと行番号に対応付けられます。
- **診断**: `emit` はファイルをパーサーとエミッターに通して往復変換するため、自動編集に依存する前に、そのファイル種類がバイト安定かどうかを確認できます。

具体例:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

この Plugin は、意図的に高レベルなセマンティクスの所有者ではありません。メモリ Plugin は引き続きメモリ書き込みを所有し、設定コマンドは引き続き完全な設定管理を所有し、LKG ロジックは引き続き復元と昇格を所有します。`oc-path` は、それらの高レベルツールが周辺に構築できる、狭いアドレス指定とバイト保持ファイル操作のレイヤーです。

## 実行される場所

この Plugin は、コマンドを実行するホスト上の **`openclaw` CLI 内でインプロセス** 実行されます。実行中の Gateway は不要で、ネットワークソケットも開きません。すべての動詞は、指定したファイルに対する純粋な変換です。

Plugin メタデータは `extensions/oc-path/openclaw.plugin.json` にあります。

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` は、この Plugin を Gateway のホットパスから外します。`onCommands: ["path"]` は、初めて `openclaw path …` を実行したときに CLI が Plugin を遅延読み込みするよう指示します。そのため、この動詞を使わないインストールではコストがかかりません。

## 有効化

```bash
openclaw plugins enable oc-path
```

Gateway を実行している場合は、マニフェストスナップショットが新しい状態を取り込むように Gateway を再起動します。素の `openclaw path` 呼び出しは同じホスト上ですぐに動作します。CLI が必要に応じて Plugin を読み込みます。

無効化するには:

```bash
openclaw plugins disable oc-path
```

## 依存関係

すべてのパーサー依存関係は Plugin ローカルです。`oc-path` を有効化しても、core ランタイムに新しいパッケージは取り込まれません。

| 依存関係       | 目的                                                                  |
| -------------- | --------------------------------------------------------------------- |
| `commander`    | `resolve`、`find`、`set`、`validate`、`emit` のサブコマンド配線。       |
| `jsonc-parser` | コメントと末尾カンマを保持した JSONC 解析および葉編集。                |
| `markdown-it`  | セクション / 項目 / フィールドモデル用の Markdown トークン化。          |

JSONL は手書きのままです。行指向の解析はどの依存関係よりも単純であり、行ごとの JSONC 解析はすでに `jsonc-parser` を通ります。

## 提供するもの

| サーフェス                     | 提供元                                                  |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` パーサー / フォーマッター | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| 種類ごとの解析 / 出力 / 編集   | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| 汎用 resolve / find / set      | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| 墨消し sentinel ガード         | `extensions/oc-path/src/oc-path/sentinel.ts`            |

CLI は現在唯一の公開サーフェスです。基盤の動詞は Plugin に対して非公開です。利用者は CLI を使うか、SDK に対して独自の Plugin を構築します。

## 他の Plugin との関係

- **`memory-*`**: メモリ書き込みは `oc-path` ではなく、メモリ Plugin を通ります。`oc-path` は汎用ファイル基盤であり、メモリ Plugin はその上に独自のセマンティクスを重ねます。
- **LKG**: `path` は Last-Known-Good 設定復元について知りません。ファイルが LKG で追跡されている場合、次の `observe` 呼び出しが昇格するか復旧するかを決定します。LKG 昇格 / 復旧ライフサイクルを通したアトミックな複数 set 用の `set --batch` は、LKG 復旧基盤と並行して計画されています。

## 安全性

`set` は、基盤の emit パスを通じて生のバイトを書き込みます。このパスでは墨消し sentinel ガードが自動的に適用されます。`__OPENCLAW_REDACTED__` を含む葉（そのまま、または部分文字列として）は、書き込み時に `OC_EMIT_SENTINEL` で拒否されます。CLI はさらに、人間向け出力または JSON 出力に出力するリテラル sentinel をすべてスクラブし、`[REDACTED]` に置き換えます。そのため、端末キャプチャやパイプラインからマーカーが漏れることはありません。

## 関連

- [`openclaw path` CLI リファレンス](/ja-JP/cli/path)
- [Plugin を管理する](/ja-JP/plugins/manage-plugins)
- [Plugin を構築する](/ja-JP/plugins/building-plugins)
