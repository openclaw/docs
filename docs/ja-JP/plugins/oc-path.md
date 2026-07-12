---
read_when:
    - ターミナルからワークスペース内のファイルにある単一の末端要素を確認または編集したい場合
    - ワークスペースの状態を対象にスクリプトを作成しており、種類に依存しない安定したアドレス指定方式が必要である
    - セルフホスト型 Gateway でオプションの `oc-path` Plugin を有効にするかどうかを判断しています
summary: 同梱の `oc-path` Plugin：`oc://` ワークスペースファイル指定方式用の `openclaw path` CLI を提供します
title: OC Path Plugin
x-i18n:
    generated_at: "2026-07-11T22:28:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

バンドルされている `oc-path` Plugin は、`oc://` ワークスペースファイルアドレス指定方式のための [`openclaw path`](/ja-JP/cli/path) CLI を追加します。OpenClaw リポジトリの `extensions/oc-path/` に同梱されていますが、オプトイン方式です。インストールやビルドを行っても、有効にするまでは休止状態のままです。

`oc://` アドレスは、ワークスペースファイル内の単一の末端要素（またはワイルドカードで指定された末端要素の集合）を指します。この Plugin は、次の4種類のファイルを認識します。

- **markdown** (`.md`): frontmatter、セクション、項目、フィールド
- **jsonc** (`.jsonc`, `.json`): コメントと書式を保持
- **jsonl** (`.jsonl`, `.ndjson`): 行指向レコード
- **yaml** (`.yaml`, `.yml`, `.lobster`): `yaml` パッケージの `Document` API を介したマップ、シーケンス、スカラーノード

セルフホスト環境の運用者やエディター拡張機能は、SDK を直接操作するスクリプトを作成せずに単一の末端要素を読み書きするために、この CLI を使用します。エージェントやフックはこれを決定論的な基盤として扱うため、バイト単位の忠実性を保つラウンドトリップと秘匿化センチネルのガードが、すべての種類に一貫して適用されます。完全な文法、動詞ごとのフラグ一覧、ファイル種類ごとの実例については、[CLI リファレンス](/ja-JP/cli/path)を参照してください。このページでは、Plugin を有効にする理由と方法を説明します。

## 有効にする理由

スクリプト、フック、またはローカルのエージェントツールが、ファイル形式ごとに専用パーサーを用意せず、ワークスペース状態の正確な一部分を指す必要がある場合に `oc-path` を有効にします。単一の `oc://` アドレスで、Markdown の frontmatter キー、セクション項目、JSONC 設定の末端要素、JSONL イベントのフィールド、または YAML ワークフローのステップを指定できます。

これは、変更を小さく、監査可能かつ再現可能に保つ必要があるメンテナーワークフローで重要です。1つの値を調査し、一致するレコードを検索し、書き込みをドライランしてから、コメント、改行コード、周辺の書式を変更せずに、その末端要素だけを適用できます。

有効にする一般的な理由は次のとおりです。

- **ローカル自動化**: シェルスクリプトは、Markdown、JSONC、JSONL、YAML それぞれの解析コードを持つ代わりに、`openclaw path … --json` を使用してワークスペース内の1つの値を解決または更新できます。
- **エージェントから確認できる編集**: エージェントは書き込む前に、アドレス指定された1つの末端要素のドライラン差分を表示します。自由形式でファイル全体を書き換える場合よりレビューしやすくなります。
- **エディター統合**: エディターは見出しテキストから推測することなく、`oc://AGENTS.md/tools/gh` を正確な Markdown ノードと行番号に対応付けられます。
- **診断**: `emit` はパーサーとエミッターを介してファイルをラウンドトリップするため、自動編集を利用する前に、そのファイル種類がバイト単位で安定しているか確認できます。

```bash
# この設定では GitHub Plugin が有効か？
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# このセッションログにはどのツール呼び出し名が現れるか？
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# この小さな設定編集ではどのバイトが書き込まれるか？
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` は、意図的に上位レベルのセマンティクスを所有しません。メモリー Plugin は引き続きメモリーへの書き込みを所有し、設定コマンドは引き続き設定全体の管理を所有し、最終正常状態（LKG）の設定復旧は引き続き復元と昇格を所有します。`oc-path` は、これらの上位レベルのツールが利用できる、限定的なアドレス指定およびバイト保持ファイル操作レイヤーです。

## 実行場所

この Plugin は、コマンドを実行したホスト上の **`openclaw` CLI プロセス内**で動作します。稼働中の Gateway は不要で、ネットワークソケットも開きません。すべての動詞は、指定したファイルに対する純粋な変換です。

Plugin のメタデータは `extensions/oc-path/openclaw.plugin.json` にあります。

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

`onStartup: false` により、この Plugin は Gateway の起動経路から除外されます。`commandAliases` と `activation.onCommands` は、初めて `openclaw path …` を実行したときに Plugin を遅延読み込みするよう CLI に指示します。そのため、この動詞を使用しないインストール環境にはコストが発生しません。

## 有効化

```bash
openclaw plugins enable oc-path
```

Gateway を実行している場合は再起動し、マニフェストのスナップショットに新しい状態を反映させます。同じホスト上での単独の `openclaw path` 呼び出しは、直ちに機能します。CLI が必要に応じて Plugin を読み込みます。

無効にするには、次を実行します。

```bash
openclaw plugins disable oc-path
```

## 依存関係

すべてのパーサー依存関係は Plugin 内に限定されています。`oc-path` を有効にしても、コアランタイムに新しいパッケージは追加されません。

| 依存関係       | 目的                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | `resolve`、`find`、`set`、`validate`、`emit` のサブコマンド接続。      |
| `jsonc-parser` | コメントと末尾のカンマを保持した JSONC の解析と末端要素の編集。       |
| `markdown-it`  | セクション、項目、フィールドモデルのための Markdown トークン化。      |
| `yaml`         | コメントとフロースタイルを保持した YAML `Document` の解析、出力、編集。 |

JSONL は引き続き独自実装です。行指向の解析は依存関係を使用するより単純であり、各行の解析にはすでに `jsonc-parser` が使用されています。

## 提供される機能

| サーフェス                     | 提供元                                                  |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` パーサー／フォーマッター | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| 種類ごとの解析／出力／編集     | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| 汎用の解決／検索／設定         | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| 秘匿化センチネルのガード       | `extensions/oc-path/src/oc-path/sentinel.ts`            |

現在、CLI が唯一の公開サーフェスです。基盤の動詞は Plugin 内で非公開です。利用側は CLI を使用するか、SDK に対して独自の Plugin を構築します。

## 他の Plugin との関係

- **`memory-*`**: メモリーへの書き込みは `oc-path` ではなく、メモリー Plugin を介して行われます。`oc-path` は汎用ファイル基盤であり、メモリー Plugin はその上に独自のセマンティクスを重ねます。
- **LKG**: `path` は最終正常状態の設定復元を認識しません。`path` を介して編集したファイルが LKG の追跡対象でもある場合、次回の設定監視サイクルで、そのファイルを昇格するか復旧するかが決まります。`path` による編集は、そのファイルに対する他の直接書き込みと同様に扱ってください。

## 安全性

`set` は基盤の出力経路を介して生のバイトを書き込みます。この経路では、秘匿化センチネルのガードが自動的に適用されます。`__OPENCLAW_REDACTED__` をそのまま、または部分文字列として含む末端要素は、書き込み時に `OC_EMIT_SENTINEL` で拒否されます。また CLI は、出力する人間向けまたは JSON のすべての出力からリテラルのセンチネルを除去し、`[REDACTED]` に置き換えます。そのため、端末のキャプチャーやパイプラインからこのマーカーが漏れることはありません。

## 関連項目

- [`openclaw path` CLI リファレンス](/ja-JP/cli/path)
- [Plugin の管理](/ja-JP/plugins/manage-plugins)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
