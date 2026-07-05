---
read_when:
    - ターミナルからワークスペースファイル内の単一のリーフを確認または編集したい場合
    - ワークスペース状態に対してスクリプトを実行しており、種類に依存しない安定したアドレス指定方式が必要です
    - セルフホストの Gateway で任意の `oc-path` Plugin を有効にするかどうかを判断しています
summary: 'バンドルされた `oc-path` プラグイン: `oc://` ワークスペースファイルのアドレス指定方式向けに `openclaw path` CLI を同梱'
title: OC Path プラグイン
x-i18n:
    generated_at: "2026-07-05T11:35:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

バンドルされている `oc-path` Plugin は、`oc://` ワークスペースファイルアドレス指定スキーム用の [`openclaw path`](/ja-JP/cli/path) CLI を追加します。これは OpenClaw リポジトリの `extensions/oc-path/` に含まれていますが、オプトインです。インストールやビルド後も、有効化するまでは休止状態のままです。

`oc://` アドレスは、ワークスペースファイル内の単一のリーフ（またはリーフのワイルドカード集合）を指します。この Plugin は 4 種類のファイルを理解します。

- **markdown** (`.md`): frontmatter、セクション、項目、フィールド
- **jsonc** (`.jsonc`, `.json`): コメントとフォーマットを保持
- **jsonl** (`.jsonl`, `.ndjson`): 行指向のレコード
- **yaml** (`.yaml`, `.yml`, `.lobster`): `yaml` パッケージの `Document` API によるマップ/シーケンス/スカラーノード

セルフホスト利用者やエディタ拡張は、SDK に直接スクリプトを書くことなく単一のリーフを読み書きするために CLI を使います。エージェントとフックは、バイト忠実なラウンドトリップと墨消しセンチネルガードをファイル種別全体で一貫して適用できるよう、これを決定的な基盤として扱います。完全な文法、動詞ごとのフラグ一覧、ファイル種別ごとの実例については [CLI リファレンス](/ja-JP/cli/path) を参照してください。このページでは、この Plugin を有効化する理由と方法を扱います。

## 有効化する理由

スクリプト、フック、またはローカルエージェントツールが、ファイル形状ごとの専用パーサーなしでワークスペース状態の正確な一部分を指す必要がある場合に `oc-path` を有効化します。単一の `oc://` アドレスで、Markdown の frontmatter キー、セクション項目、JSONC 設定リーフ、JSONL イベントフィールド、YAML ワークフローステップを指定できます。

これは、変更を小さく、監査可能で、再現可能に保つ必要があるメンテナーワークフローで重要です。1 つの値を検査し、一致するレコードを見つけ、書き込みをドライランし、コメント、行末、周辺フォーマットをそのまま残してそのリーフだけを適用できます。

有効化する一般的な理由:

- **ローカル自動化**: シェルスクリプトが Markdown、JSONC、JSONL、YAML それぞれの解析コードを持つ代わりに、`openclaw path … --json` でワークスペース値を 1 つ解決または更新します。
- **エージェントに見える編集**: エージェントが書き込み前に、アドレス指定された 1 つのリーフのドライラン差分を表示します。これは自由形式のファイル書き換えよりレビューしやすくなります。
- **エディタ統合**: エディタが `oc://AGENTS.md/tools/gh` を、見出しテキストから推測せずに正確な Markdown ノードと行番号へマッピングします。
- **診断**: `emit` はファイルをパーサーとエミッターに通してラウンドトリップするため、自動編集に依存する前に、そのファイル種別がバイト安定かどうかを確認できます。

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` は、意図的に高レベルのセマンティクスの所有者ではありません。メモリ Plugin は引き続きメモリ書き込みを所有し、設定コマンドは引き続き完全な設定管理を所有し、last-known-good (LKG) 設定復旧は引き続き復元/昇格を所有します。`oc-path` は、そうした高レベルツールが周囲に構築できる、狭いアドレス指定とバイト保持ファイル操作のレイヤーです。

## 実行される場所

この Plugin は、コマンドを呼び出したホスト上で **`openclaw` CLI 内のインプロセス** として実行されます。実行中の Gateway は不要で、ネットワークソケットも開きません。すべての動詞は、指定したファイルに対する純粋な変換です。

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

`onStartup: false` は、この Plugin を Gateway の起動パスから外します。`commandAliases` と `activation.onCommands` は、初めて `openclaw path …` を実行したときに CLI が Plugin を遅延ロードするよう指示するため、この動詞を使わないインストールではコストがかかりません。

## 有効化

```bash
openclaw plugins enable oc-path
```

Gateway を実行している場合は再起動し、マニフェストスナップショットが新しい状態を取り込むようにします。素の `openclaw path` 呼び出しは同じホスト上ですぐに動作します。CLI は必要に応じて Plugin をロードします。

無効化するには:

```bash
openclaw plugins disable oc-path
```

## 依存関係

すべてのパーサー依存関係は Plugin ローカルです。`oc-path` を有効化しても、新しいパッケージがコアランタイムに取り込まれることはありません。

| 依存関係       | 目的                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | `resolve`、`find`、`set`、`validate`、`emit` のサブコマンド配線。      |
| `jsonc-parser` | コメントと末尾カンマを保った JSONC 解析とリーフ編集。                 |
| `markdown-it`  | セクション / 項目 / フィールドモデル用の Markdown トークン化。         |
| `yaml`         | コメントとフロースタイルを保った YAML `Document` の解析 / 出力 / 編集。 |

JSONL は手書きのままです。行指向の解析はどの依存関係よりも単純であり、行ごとの解析はすでに `jsonc-parser` を通っています。

## 提供するもの

| サーフェス                     | 提供元                                                  |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` パーサー / フォーマッター | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| 種別ごとの解析 / 出力 / 編集   | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| 汎用 resolve / find / set      | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| 墨消しセンチネルガード         | `extensions/oc-path/src/oc-path/sentinel.ts`            |

現在の公開サーフェスは CLI のみです。基盤の動詞は Plugin のプライベートなものです。利用者は CLI を使うか、SDK に対して独自の Plugin を構築します。

## 他の Plugin との関係

- **`memory-*`**: メモリ書き込みは `oc-path` ではなくメモリ Plugin を通ります。`oc-path` は汎用ファイル基盤であり、メモリ Plugin はその上に独自のセマンティクスを重ねます。
- **LKG**: `path` は last-known-good 設定復元について認識しません。`path` を通じて編集したファイルが LKG でも追跡されている場合、次の設定監視サイクルが昇格するか復旧するかを決定します。`path` 編集は、そのファイルへの他の直接書き込みと同じように扱ってください。

## 安全性

`set` は基盤の出力パスを通じて生バイトを書き込み、その過程で墨消しセンチネルガードが自動的に適用されます。`__OPENCLAW_REDACTED__` を持つリーフ（逐語的または部分文字列として）は、書き込み時に `OC_EMIT_SENTINEL` で拒否されます。CLI はまた、人間向けまたは JSON 出力に出力するリテラルのセンチネルをスクラブし、`[REDACTED]` に置き換えるため、端末キャプチャやパイプラインがそのマーカーを漏らすことはありません。

## 関連

- [`openclaw path` CLI リファレンス](/ja-JP/cli/path)
- [Plugin を管理する](/ja-JP/plugins/manage-plugins)
- [Plugin を構築する](/ja-JP/plugins/building-plugins)
