---
read_when:
    - ターミナルからワークスペースファイル内の単一のリーフを確認または編集したい場合
    - ワークスペース状態に対してスクリプトを実行しており、種類に依存しない安定したアドレス指定方式が必要です
    - セルフホストの Gateway で任意の `oc-path` Plugin を有効にするかどうかを判断しています
summary: 'バンドル済み `oc-path` Plugin: `oc://` ワークスペースファイルアドレス指定スキーム向けに `openclaw path` CLI を同梱'
title: OC Pathプラグイン
x-i18n:
    generated_at: "2026-06-27T12:19:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

バンドルされた `oc-path` Plugin は、`oc://` ワークスペースファイルアドレス指定スキーム用の [`openclaw path`](/ja-JP/cli/path) CLI を追加します。OpenClaw リポジトリ内の `extensions/oc-path/` として同梱されていますが、オプトインです。インストールやビルドをしても、有効化するまでは休止状態のままです。

`oc://` アドレスは、ワークスペースファイル内の単一のリーフ、またはワイルドカードによるリーフ集合を指します。現在、この Plugin は 4 種類のファイルを理解します。

- **markdown** (`.md`, `.mdx`): frontmatter、セクション、項目、フィールド
- **jsonc** (`.jsonc`, `.json5`, `.json`): コメントと整形を保持
- **jsonl** (`.jsonl`, `.ndjson`): 行指向レコード
- **yaml** (`.yaml`, `.yml`, `.lobster`): YAML ドキュメント API 経由のマップ、シーケンス、スカラーのノード

セルフホスト運用者やエディター拡張は、SDK に直接スクリプトを書くことなく単一のリーフを読み書きするために CLI を使います。エージェントやフックはこれを決定論的な基盤として扱うため、バイト忠実なラウンドトリップと墨消しセンチネルガードが種類をまたいで一貫して適用されます。

## 有効化する理由

ファイル形状ごとにパーサーを作らずに、スクリプト、フック、またはローカルエージェントツールからワークスペース状態の正確な一部を指したい場合は、`oc-path` を有効化します。単一の `oc://` アドレスで、markdown frontmatter のキー、セクション項目、JSONC 設定リーフ、JSONL イベントフィールド、または YAML ワークフロー手順を指定できます。

これは、変更を小さく、監査可能で、再現可能にしたいメンテナーワークフローで重要です。1 つの値を検査し、一致するレコードを見つけ、書き込みをドライランし、コメント、改行コード、近くの整形をそのまま残してそのリーフだけを適用できます。これをオプトイン Plugin として維持することで、それを必要としないインストール環境のコアにパーサー依存関係や CLI サーフェスを入れず、パワーユーザーにアドレス指定基盤を提供できます。

有効化する一般的な理由:

- **ローカル自動化**: シェルスクリプトは、個別の markdown、JSONC、JSONL、YAML 解析コードを持たずに、`openclaw path … --json` で 1 つのワークスペース値を解決または更新できます。
- **エージェントに見える編集**: エージェントは書き込み前に、指定された 1 つのリーフのドライラン差分を表示できます。これは自由形式のファイル書き換えよりレビューしやすくなります。
- **エディター統合**: エディターは見出しテキストから推測せずに、`oc://AGENTS.md/tools/gh` を正確な markdown ノードと行番号にマッピングできます。
- **診断**: `emit` はファイルをパーサーとエミッターに通してラウンドトリップするため、自動編集に頼る前にそのファイル種類がバイト安定かどうかを確認できます。

具体例:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

この Plugin は意図的に、より高レベルなセマンティクスの所有者ではありません。メモリの書き込みは引き続き memory Plugin が所有し、設定コマンドは引き続き設定管理全体を所有し、LKG ロジックは引き続き復元と昇格を所有します。`oc-path` は、それらの高レベルツールが周囲に構築できる、狭いアドレス指定とバイト保持ファイル操作のレイヤーです。

## 実行場所

この Plugin は、コマンドを実行したホスト上の **`openclaw` CLI プロセス内** で実行されます。実行中の Gateway は不要で、ネットワークソケットも開きません。すべての動詞は、指定したファイルに対する純粋な変換です。

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

`onStartup: false` は Plugin を Gateway のホットパスから外します。`onCommands:
["path"]` は、`openclaw path …` を初めて実行したときに CLI が Plugin を遅延ロードするよう指示するため、この動詞を使わないインストール環境ではコストがかかりません。

## 有効化

```bash
openclaw plugins enable oc-path
```

Gateway を実行している場合は、マニフェストスナップショットが新しい状態を取得するよう再起動します。同じホスト上での素の `openclaw path` 呼び出しはすぐに動作します。CLI がオンデマンドで Plugin をロードします。

無効化するには:

```bash
openclaw plugins disable oc-path
```

## 依存関係

すべてのパーサー依存関係は Plugin ローカルです。`oc-path` を有効化しても、新しいパッケージはコアランタイムに取り込まれません。

| 依存関係       | 目的                                                                |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | `resolve`、`find`、`set`、`validate`、`emit` のサブコマンド配線。    |
| `jsonc-parser` | コメントと末尾カンマを保持した JSONC 解析 + リーフ編集。       |
| `markdown-it`  | セクション / 項目 / フィールドモデル用の Markdown トークン化。            |
| `yaml`         | コメントとフロースタイルを保持した YAML `Document` の解析 / 出力 / 編集。 |

JSONL は手書きのままです。行指向の解析はどの依存関係よりも単純で、行ごとの JSONC 解析はすでに `jsonc-parser` を経由しています。

## 提供内容

| サーフェス                        | 提供元                                             |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` パーサー / フォーマッター     | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| 種類ごとの解析 / 出力 / 編集   | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| 汎用 resolve / find / set | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| 墨消しセンチネルガード       | `extensions/oc-path/src/oc-path/sentinel.ts`            |

現在の公開サーフェスは CLI のみです。基盤の動詞は Plugin 内部のプライベートなものです。利用者は CLI を使うか、SDK に対して独自の Plugin を構築します。

## 他の Plugin との関係

- **`memory-*`**: メモリ書き込みは `oc-path` ではなく memory Plugin を経由します。
  `oc-path` は汎用ファイル基盤であり、memory Plugin はその上に独自のセマンティクスを重ねます。
- **LKG**: `path` は Last-Known-Good 設定復元について知りません。ファイルが LKG で追跡されている場合、次の `observe` 呼び出しが昇格するか復旧するかを決定します。LKG の昇格 / 復旧ライフサイクルを通じたアトミックな複数 set 用の `set --batch` は、LKG 復旧基盤と並行して計画されています。

## 安全性

`set` は基盤の emit パスを通して生バイトを書き込み、そのパスは墨消しセンチネルガードを自動的に適用します。`__OPENCLAW_REDACTED__` をそのまま、または部分文字列として含むリーフは、書き込み時に `OC_EMIT_SENTINEL` で拒否されます。CLI はまた、出力する人間向けまたは JSON 出力からリテラルのセンチネルを除去し、`[REDACTED]` に置き換えるため、端末キャプチャやパイプラインでマーカーが漏れることはありません。

## 関連

- [`openclaw path` CLI リファレンス](/ja-JP/cli/path)
- [Plugin を管理する](/ja-JP/plugins/manage-plugins)
- [Plugin を構築する](/ja-JP/plugins/building-plugins)
