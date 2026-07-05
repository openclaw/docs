---
read_when:
    - ターミナルからワークスペースファイル内のリーフを読み書きしたい
    - ワークスペース状態に対してスクリプトを実行しており、種類に依存しない安定したアドレス指定スキームが必要な場合
    - '`oc://` パスをデバッグしている（構文を検証し、何に解決されるかを確認する）'
summary: '`openclaw path` のCLIリファレンス（`oc://` アドレス指定方式を介してワークスペースファイルを検査および編集）'
title: パス
x-i18n:
    generated_at: "2026-07-05T11:10:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

`oc://` アドレス指定スキームへのシェルアクセスです。アドレス指定可能なワークスペースファイル（markdown、jsonc、jsonl、yaml/yml/lobster）を検査および編集するための、種類ごとにディスパッチされる単一のパス構文です。セルフホスト運用者、Plugin 作者、エディター拡張は、ファイルごとのパーサーを自作せずに、狭い位置を読み取り、検索、更新するためにこれを使用します。

`path` はバンドル済みの任意 `oc-path` plugin によって提供されます。初回使用前に有効化してください。

```bash
openclaw plugins enable oc-path
```

CLI 動詞はアドレス指定モデルに対応しています。

- `resolve` は具体的で単一一致です。
- `find` はワイルドカード、ユニオン、述語、位置展開のための複数一致動詞です。
- `set` は具体的なパスまたは挿入マーカーのみを受け付けます。ワイルドカードパターンは書き込み前に拒否されます。
- `validate` はファイルシステムへアクセスせずにパスを解析します。
- `emit` はファイルを解析 + 出力で往復させます（バイト忠実性の診断）。

## 使用する理由

OpenClaw の状態は、人が編集する markdown、コメント付き JSONC 設定、追記専用 JSONL ログ、YAML ワークフロー/仕様ファイルに分散しています。スクリプト、フック、エージェントは多くの場合、それらのファイルから frontmatter キー、Plugin 設定、ログレコードフィールド、YAML ステップ、名前付きセクション配下の箇条書き項目など、1 つの小さな値だけを必要とします。

`openclaw path` は、ファイル種類ごとの場当たり的な grep、正規表現、パーサーの代わりに、そうした呼び出し元へ安定したアドレスを提供します。同じ `oc://` パスをターミナルから検証、解決、検索、ドライラン、書き込みできるため、狭い自動化をレビュー可能かつ再実行可能に保てます。ファイルの残りの部分は保持されるため、1 つのリーフを書き込んでも、そのコメント、改行コード、周辺のフォーマットは乱されません。

欲しいものに論理アドレスがあるが、ファイルの形がさまざまな場合に使用してください。

- フックが、値を書き戻すときにコメントを失わず、コメント付き JSONC から 1 つの設定を読み取る。
- メンテナンススクリプトが、JSONL ログ全体をカスタムパーサーに読み込まず、すべての一致するイベントフィールドを見つける。
- エディターが slug によって markdown セクションまたは箇条書き項目へジャンプし、解決先の正確な行をレンダリングする。
- エージェントが小さなワークスペース編集を適用前にドライランし、変更バイトをレビューで確認できるようにする。

通常のファイル全体編集、高度な設定移行、メモリ固有の書き込みには `openclaw path` を使わないでください。それらは所有者コマンドまたは Plugin を使用するべきです。`path` は、繰り返し可能なターミナルコマンドが別の専用パーサーより適している、小さくアドレス指定可能なファイル操作のためのものです。

## 使用方法

人が編集する設定ファイルから 1 つの値を読み取ります。

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

ディスクに触れずに書き込みをプレビューします。

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

追記専用 JSONL ログで一致するレコードを見つけます。

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

行番号ではなく、セクションと項目で markdown 内の指示を指定します。

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

スクリプトが読み取りまたは書き込みを行う前に、CI または事前確認スクリプトでパスを検証します。

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

これらのコマンドはシェルスクリプトへコピーできることを意図しています。呼び出し元が構造化出力を必要とする場合は `--json` を使い、人が結果を検査する場合は `--human` を使います。

## 仕組み

1. `oc://` アドレスを、ファイル、セクション、項目、フィールド、および任意のセッションクエリのスロットへ解析します。
2. 対象拡張子（`.md`、`.jsonc`、`.json`、`.jsonl`、`.ndjson`、`.yaml`、`.yml`、`.lobster`）からファイル種類アダプターを選択します。
3. そのファイル種類の構造に対してスロットを解決します。markdown の見出し/項目、JSONC のオブジェクトキー/配列インデックス、JSONL の行レコード、または YAML のマップ/シーケンスノードです。
4. `set` の場合は、同じアダプターを通して編集済みバイトを出力し、その種類が対応している範囲で、ファイルの未変更部分のコメント、改行コード、周辺フォーマットを保持します。

`resolve` と `set` は 1 つの具体的な対象を必要とします。`find` は探索用の動詞です。ワイルドカード、ユニオン、述語、序数を、書き込み先を選ぶ前に検査できる具体的な一致へ展開します。

## サブコマンド

| サブコマンド          | 目的                                                                        |
| ----------------------- | --------------------------------------------------------------------------- |
| `resolve <oc-path>`     | パスの具体的な一致を表示します（または「見つかりません」）。                |
| `find <pattern>`        | ワイルドカード / ユニオン / 述語パスの一致を列挙します。                    |
| `set <oc-path> <value>` | 具体的なパスでリーフまたは挿入対象を書き込みます。`--dry-run` に対応します。 |
| `validate <oc-path>`    | 解析のみ。構造分解（file / section / item / field）を表示します。            |
| `emit <file>`           | ファイルを解析 + 出力で往復させます（バイト忠実性の診断）。                 |

## グローバルフラグ

| フラグ          | 適用先                           | 目的                                                                       |
| --------------- | -------------------------------- | -------------------------------------------------------------------------- |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit` | このディレクトリを基準に file スロットを解決します（デフォルト: `process.cwd()`）。 |
| `--file <path>` | `resolve`, `find`, `set`, `emit` | file スロットの解決済みパスを上書きします（絶対アクセス）。                |
| `--json`        | すべて                           | JSON 出力を強制します（stdout が TTY でない場合のデフォルト）。             |
| `--human`       | すべて                           | 人向け出力を強制します（stdout が TTY の場合のデフォルト）。                |
| `--value-json`  | `set`                            | JSON/JSONC/JSONL リーフ置換のために `<value>` を JSON として解析します。    |
| `--dry-run`     | `set`                            | 書き込まずに、書き込まれるはずのバイトを表示します。                       |
| `--diff`        | `set`（`--dry-run` が必要）       | 完全なバイト列の代わりに unified diff を表示します。                        |

`validate` は `--json` / `--human` のみを受け付けます。ファイルシステムアクセスを行わないため、`--cwd` と `--file` は適用されません。

## `oc://` 構文

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

スロット規則: `field` には `item` が必要で、`item` には `section` が必要です。4 つすべてのスロットに共通します。

- **引用符付きセグメント** — `"a/b.c"` は `/` と `.` 区切りをそのまま保持します。内容はバイトリテラルです。引用符内で `"` と `\` は許可されません。file スロットも引用符を認識します。`oc://"skills/email-drafter"/Tools/$last` は `skills/email-drafter` を単一のファイルパスとして扱います。
- **述語** — `[k=v]`、`[k!=v]`、`[k<v]`、`[k<=v]`、`[k>v]`、`[k>=v]`。数値演算子では、両辺が有限数へ強制変換できる必要があります。
- **ユニオン** — `{a,b,c}` はいずれかの代替に一致します。
- **ワイルドカード** — `*`（単一サブセグメント）と `**`（0 個以上、再帰）。`find` はこれらを受け付けます。`resolve` と `set` は曖昧なため拒否します。
- **位置指定** — `$first` / `$last` は最初 / 最後のインデックスまたは宣言済みキーへ解決されます。
- **序数** — 文書順で N 番目の一致を表す `#N`。
- **挿入マーカー** — キー付き / インデックス付き挿入のための `+`、`+key`、`+nnn`（`set` と一緒に使用）。
- **セッションスコープ** — `?session=cron-daily` など。スロットの入れ子とは独立しています。セッション値は生の値で、パーセントデコードされません。制御文字または予約済みクエリ区切り文字（`?`、`&`、`%`）を含めることはできません。

引用符付き、述語、ユニオンの各セグメントの外にある予約文字（`?`、`&`、`%`）は拒否されます。制御文字（U+0000-U+001F、U+007F）は、`session` クエリ値を含め、どこにあっても拒否されます。

正規パスでは `formatOcPath(parseOcPath(path)) === path` が保証されます。非正規のクエリパラメーターは、最初の空でない `session=` 値を除いて無視されます。

ハードリミット: パスは 4096 バイトまで、最大 4 スロット（file/section/item/field）、スロットごとに最大 64 個のドット区切りサブセグメント、深い JSON パスでは最大 256 レベルのネスト走査に制限されます。別途、16 MiB を超える JSONC/JSON ファイル入力は、そのファイルを読み込むどの動詞でも、解析する代わりに解析診断付きで拒否されます。

## ファイル種類ごとのアドレス指定

| 種類          | ファイル拡張子              | アドレス指定モデル                                                                                  |
| ------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                       | slug による H2 セクション、slug または `#N` による箇条書き項目、`[frontmatter]` 経由の frontmatter。 |
| JSONC/JSON    | `.jsonc`, `.json`           | オブジェクトキーと配列インデックス。引用符付きでない限り、ドットはネストしたサブセグメントを分割します。 |
| JSONL         | `.jsonl`, `.ndjson`         | トップレベルの行アドレス（`L1`、`L2`、`$first`、`$last`）の後、行の中で JSONC 形式の下降。          |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster` | マップキーとシーケンスインデックス。コメントとフロースタイルは YAML ドキュメント API によって処理されます。 |

`resolve` は、1 始まりの行番号を持つ `root`、`node`、`leaf`、または `insertion-point` として構造化された一致を返します。リーフ値はテキストと `leafType` として表面化されるため、Plugin 作者はファイル種類ごとの AST 形状に依存せずにプレビューをレンダリングできます。

## 変更契約

`set` は 1 つの具体的な対象を書き込みます。

- Markdown frontmatter 値と `- key: value` 項目フィールドは文字列リーフです。Markdown 挿入はセクション、frontmatter キー、またはセクション項目を追加し、変更後ファイルのために正規 markdown 形状をレンダリングします。セクション本文全体は `set` を通して書き込めません。
- JSONC リーフ書き込みは、文字列値を既存のリーフ型（`string`、有限 `number`、`true`/`false`、または `null`）へ強制変換します。JSONC/JSON/JSONL リーフ置換で `<value>` を JSON として解析し、文字列 secret-ref 省略形をオブジェクトへ置き換えるように形状を変更する可能性がある場合は、`--value-json` を使用してください。JSONC オブジェクトおよび配列挿入は `<value>` を JSON として解析し、通常のリーフ書き込みには `jsonc-parser` の編集パスを使用して、コメントと周辺フォーマットを保持します。
- JSONL リーフ書き込みは、行内で JSONC と同じように強制変換します。行全体の置換と追記は `<value>` を JSON として解析します。レンダリングされた JSONL は、ファイルの主要な LF/CRLF 改行規則（ファイル内改行の多数決）を保持するため、ほとんどが CRLF のファイルは、少数の LF が混ざっていても CRLF のままです。
- YAML リーフ書き込みは、既存のスカラー型（`string`、有限 `number`、`true`/`false`、または `null`）へ強制変換します。YAML 挿入は、バンドルされた `yaml` パッケージのドキュメント API をマップ/シーケンス更新に使用します。パーサーエラーがある不正な YAML ドキュメントは、変更前に `parse-error` で拒否されます。

正確なバイトが重要なユーザー可視の書き込み前には、`--dry-run` を使用してください。JSONC と YAML の編集は既存ドキュメントにパッチを当てるため（`jsonc-parser` または `yaml` ドキュメント API 経由）、通常、未変更バイトは維持されます。markdown はどの編集でも解析済み構造からファイルを再構築するため、変更されたリーフ以外の偶発的なフォーマットが正規化される場合があります。プレビューを完全なレンダリング済みファイルではなく、焦点を絞った前後パッチとして見たい場合は `--diff` を追加してください。

## 例

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

その他の文法例:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## ファイル種別ごとのレシピ

同じ 5 つの動詞が種別をまたいで機能します。アドレス指定スキームは
ファイル拡張子に基づいてディスパッチします。

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

`[frontmatter]` 述語は YAML frontmatter ブロックを指定します。`tools`
は slug を介して `## Tools` 見出しに一致し、項目リーフはソースでアンダースコアが使われている場合でも
slug 形式を保持します（`send_email` は `send-email` になります）。

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

JSONC の編集は `jsonc-parser` を通るため、コメントと空白は
`set` 後も維持されます。コミットする前に、まず `--dry-run` を付けて実行し、バイト列を確認してください。
`.json` ファイルは `.jsonc` と同じアダプターと編集パスを使用します。

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

各行は 1 つのレコードです。行番号がわからない場合は述語（`[event=action]`）で指定し、
わかっている場合は正規の `LN` セグメントで指定します。
`.ndjson` ファイルは `.jsonl` と同じアダプターを使用します。

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML は手製のパーサーではなく `yaml` パッケージの `Document` API を使用します。
そのため、通常の parse/emit ラウンドトリップではコメントと記述形状が維持され、
解決済みパスは JSONC と同じ map-key / sequence-index モデルを使用します。
同じアダプターが `.yaml`、`.yml`、`.lobster` ファイルを処理します。

## サブコマンドリファレンス

### `resolve <oc-path>`

単一のリーフまたはノードを読み取ります。ワイルドカードは拒否されます。それらには `find` を使用してください。
一致した場合は `0`、正常な未一致の場合は `1`、parse エラーまたは拒否された
パターンの場合は `2` で終了します。

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

ワイルドカード / 述語 / union パターンに一致するすべてを列挙します。少なくとも 1 件一致した場合は `0`、
0 件の場合は `1` で終了します。ファイルスロットのワイルドカードは
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` で拒否されます。具体的なファイルを渡してください（複数ファイルの
グロブは今後の機能です）。

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

リーフを書き込みます。`--dry-run` と組み合わせると、ファイルに触れずに書き込まれるバイト列を
プレビューできます。統一 diff プレビューには `--diff` を追加します。
書き込みが成功した場合は `0`、基盤が拒否した場合（たとえば
センチネルガードに当たった場合）は `1`、parse エラーの場合は `2` で終了します。

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

`+key` 挿入マーカーは、指定された子がまだ存在しない場合に作成します。
`+nnn` と単独の `+` は、それぞれインデックス指定の挿入と末尾追加に使用できます。

### `validate <oc-path>`

parse のみのチェックです。ファイルシステムにはアクセスしません。変数を代入する前に
テンプレートパスが正しい形式か確認したい場合や、デバッグ用に構造の分解を確認したい場合に便利です。

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

有効な場合は `0`、無効な場合は `1`（構造化された `code` と
`message` 付き）、引数エラーの場合は `2` で終了します。

### `emit <file>`

ファイルを種別ごとのパーサーと emitter に通してラウンドトリップします。正常なファイルでは、出力は
入力とバイト単位で同一になるはずです。差異がある場合は、パーサーのバグまたは
センチネルへの到達を示します。実際の入力に対する基盤の挙動をデバッグするのに便利です。

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 終了コード

| コード | 意味                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | 成功。(`resolve` / `find`: 少なくとも 1 件一致。`set`: 書き込み成功。) |
| `1`  | 一致なし、または `set` が基盤に拒否された（システムレベルのエラーなし）。      |
| `2`  | 引数または parse エラー。                                                   |

## 出力モード

`openclaw path` は TTY を認識します。端末では人間が読める出力、stdout がパイプまたはリダイレクトされている場合は JSON になります。
`--json` と `--human` は自動検出を上書きします。

## 注記

- `set` は基盤の emit パスを通じてバイトを書き込みます。このパスでは
  redaction-sentinel ガードが自動的に適用されます。
  `__OPENCLAW_REDACTED__`（そのまま、または部分文字列として）を含むリーフは、書き込み時に拒否されます。
- JSONC の parsing とリーフ編集には Plugin ローカルの `jsonc-parser`
  依存関係を使用します。そのため、通常のリーフ書き込みでは、手製のパーサーや再レンダリングのパスを通るのではなく、
  コメントと書式が維持されます。
- `path` は last-known-good (LKG) config の追跡や復旧を認識しません。
  そのライフサイクルは別の場所が所有します。`path` で編集したファイルが
  LKG でも追跡されている場合、次回の config 読み取り時に昇格するか
  復旧するかが決まります。`path` による編集は、そのファイルへの他の直接書き込みと同じように扱ってください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
