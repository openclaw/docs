---
read_when:
    - ターミナルからワークスペース内のファイルの末端要素を読み書きしたい場合
    - ワークスペースの状態を対象にスクリプトを作成しており、種類に依存しない安定したアドレス指定方式が必要な場合
    - '`oc://` パスをデバッグしている（構文を検証し、何に解決されるかを確認する）'
summary: '`openclaw path` の CLI リファレンス（`oc://` アドレス指定方式でワークスペースのファイルを確認・編集）'
title: パス
x-i18n:
    generated_at: "2026-07-11T22:08:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

`oc://` アドレス指定方式へのシェルアクセスです。アドレス指定可能なワークスペースファイル（markdown、jsonc、jsonl、yaml/yml/lobster）を調査および編集するための、種類ごとに処理を振り分ける単一のパス構文を提供します。セルフホスト運用者、Plugin 作成者、エディター拡張機能は、ファイル形式ごとのパーサーを独自実装せずに、限定された場所の読み取り、検索、更新に使用できます。

`path` は、同梱のオプション `oc-path` Plugin によって提供されます。初回使用前に有効化してください。

```bash
openclaw plugins enable oc-path
```

CLI の動詞はアドレス指定モデルに対応しています。

- `resolve` は具体的な単一一致を扱います。
- `find` は、ワイルドカード、ユニオン、述語、位置展開による複数一致を扱う動詞です。
- `set` は具体的なパスまたは挿入マーカーのみを受け付けます。ワイルドカードパターンは書き込み前に拒否されます。
- `validate` はファイルシステムへアクセスせずにパスを解析します。
- `emit` はファイルを解析して出力し直します（バイト忠実性の診断）。

## 使用する理由

OpenClaw の状態は、人が編集する markdown、コメント付き JSONC 設定、追記専用 JSONL ログ、YAML ワークフロー／仕様ファイルに分散しています。スクリプト、フック、エージェントがこれらのファイルから必要とするのは、多くの場合、frontmatter のキー、Plugin 設定、ログレコードのフィールド、YAML のステップ、名前付きセクション配下の箇条書き項目など、1つの小さな値だけです。

`openclaw path` は、ファイル形式ごとに一度限りの grep、正規表現、パーサーを用意する代わりに、呼び出し元へ安定したアドレスを提供します。同じ `oc://` パスをターミナルから検証、解決、検索、ドライラン、書き込みできるため、限定的な自動化をレビューおよび再実行しやすくなります。ファイルの残りの部分は保持されるため、1つの末端を書き換えても、コメント、改行コード、周辺の書式は乱れません。

必要な対象に論理アドレスがあり、ファイルの形式が異なる場合に使用します。

- フックがコメント付き JSONC から1つの設定を読み取り、値を書き戻す際にもコメントを失いません。
- メンテナンススクリプトが、ログ全体を独自パーサーへ読み込まずに、JSONL ログ内の一致するすべてのイベントフィールドを検索します。
- エディターが行番号ではなくスラッグで markdown のセクションまたは箇条書き項目へ移動し、解決された正確な行を表示します。
- エージェントが小規模なワークスペース編集を適用前にドライランし、変更されるバイトをレビューで確認できます。

通常のファイル全体の編集、高度な設定移行、メモリ固有の書き込みには `openclaw path` を使用しないでください。これらには所有元のコマンドまたは Plugin を使用します。`path` は、独自パーサーを新たに作るよりも再現可能なターミナルコマンドが適している、小規模でアドレス指定可能なファイル操作用です。

## 使用方法

人が編集する設定ファイルから1つの値を読み取ります。

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

ディスクに触れずに書き込みをプレビューします。

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

追記専用 JSONL ログから一致するレコードを検索します。

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

markdown 内の指示を、行番号ではなくセクションと項目で指定します。

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

CI または事前確認スクリプトで、スクリプトが読み書きする前にパスを検証します。

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

これらのコマンドはシェルスクリプトへそのままコピーできることを想定しています。呼び出し元が構造化出力を必要とする場合は `--json`、人が結果を確認する場合は `--human` を使用します。

## 仕組み

1. `oc://` アドレスを、ファイル、セクション、項目、フィールド、およびオプションのセッションクエリの各スロットへ解析します。
2. 対象の拡張子（`.md`、`.jsonc`、`.json`、`.jsonl`、`.ndjson`、`.yaml`、`.yml`、`.lobster`）からファイル形式アダプターを選択します。
3. そのファイル形式の構造に対してスロットを解決します。対象は、markdown の見出し／項目、JSONC のオブジェクトキー／配列インデックス、JSONL の行レコード、YAML のマップ／シーケンスノードです。
4. `set` では、同じアダプターを通じて編集済みバイトを出力するため、その形式が対応している場合、変更されていない部分のコメント、改行コード、周辺の書式が保持されます。

`resolve` と `set` には1つの具体的な対象が必要です。`find` は探索用の動詞であり、ワイルドカード、ユニオン、述語、序数を具体的な一致へ展開します。書き込み対象を選択する前に、それらを確認できます。

## サブコマンド

| サブコマンド            | 用途                                                                        |
| ----------------------- | --------------------------------------------------------------------------- |
| `resolve <oc-path>`     | パスにある具体的な一致（または「見つかりません」）を出力します。            |
| `find <pattern>`        | ワイルドカード／ユニオン／述語パスの一致を列挙します。                      |
| `set <oc-path> <value>` | 具体的なパスにある末端または挿入対象へ書き込みます。`--dry-run` 対応です。   |
| `validate <oc-path>`    | 解析のみを行い、構造の内訳（ファイル／セクション／項目／フィールド）を出力します。 |
| `emit <file>`           | ファイルを解析して出力し直します（バイト忠実性の診断）。                    |

## グローバルフラグ

| フラグ          | 適用先                           | 用途                                                                       |
| --------------- | -------------------------------- | -------------------------------------------------------------------------- |
| `--cwd <dir>`   | `resolve`、`find`、`set`、`emit` | このディレクトリを基準にファイルスロットを解決します（既定値: `process.cwd()`）。 |
| `--file <path>` | `resolve`、`find`、`set`、`emit` | ファイルスロットから解決されたパスを上書きします（絶対パスアクセス）。      |
| `--json`        | すべて                           | JSON 出力を強制します（stdout が TTY でない場合の既定値）。                 |
| `--human`       | すべて                           | 人向け出力を強制します（stdout が TTY の場合の既定値）。                    |
| `--value-json`  | `set`                            | JSON/JSONC/JSONL の末端置換で `<value>` を JSON として解析します。          |
| `--dry-run`     | `set`                            | 書き込まずに、書き込まれる予定のバイトを出力します。                       |
| `--diff`        | `set`（`--dry-run` が必要）      | 完全なバイト列の代わりに unified diff を出力します。                        |

`validate` が受け付けるのは `--json` / `--human` のみです。ファイルシステムへアクセスしないため、`--cwd` と `--file` は適用されません。

## `oc://` 構文

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

スロットの規則として、`field` には `item` が必要であり、`item` には `section` が必要です。4つのスロットすべてに次が適用されます。

- **引用符付きセグメント** — `"a/b.c"` では `/` と `.` の区切りを無効化できます。内容はバイト単位のリテラルです。引用符内に `"` と `\` は使用できません。ファイルスロットも引用符を認識します。`oc://"skills/email-drafter"/Tools/$last` は `skills/email-drafter` を単一のファイルパスとして扱います。
- **述語** — `[k=v]`、`[k!=v]`、`[k<v]`、`[k<=v]`、`[k>v]`、`[k>=v]`。数値演算子では両辺を有限数へ変換できる必要があります。
- **ユニオン** — `{a,b,c}` は選択肢のいずれかに一致します。
- **ワイルドカード** — `*`（単一のサブセグメント）と `**`（0個以上、再帰的）。`find` はこれらを受け付けますが、`resolve` と `set` は曖昧として拒否します。
- **位置指定** — `$first` / `$last` は、最初／最後のインデックスまたは宣言済みキーへ解決されます。
- **序数** — `#N` は文書順で N 番目の一致を表します。
- **挿入マーカー** — `+`、`+key`、`+nnn` はキー／インデックス指定の挿入に使用します（`set` と併用）。
- **セッションスコープ** — `?session=cron-daily` など。スロットの入れ子とは独立しています。セッション値は未加工であり、パーセントデコードされません。制御文字または予約済みクエリ区切り文字（`?`、`&`、`%`）を含めることはできません。

引用符付き、述語、ユニオンの各セグメント外にある予約文字（`?`、`&`、`%`）は拒否されます。制御文字（U+0000-U+001F、U+007F）は、`session` クエリ値を含むすべての場所で拒否されます。

正規パスでは `formatOcPath(parseOcPath(path)) === path` が保証されます。非正規のクエリパラメーターは、最初の空でない `session=` 値を除いて無視されます。

上限として、パスは4096バイト、最大4スロット（ファイル／セクション／項目／フィールド）、スロットごとに最大64個のドット区切りサブセグメント、深い JSON パスでは最大256段階の入れ子走査に制限されます。これとは別に、16 MiB を超える JSONC/JSON ファイル入力は、そのファイルを読み込むすべての動詞で解析されず、解析診断とともに拒否されます。

## ファイル形式別のアドレス指定

| 形式          | ファイル拡張子                | アドレス指定モデル                                                                                     |
| ------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| Markdown      | `.md`                         | スラッグによる H2 セクション、スラッグまたは `#N` による箇条書き項目、`[frontmatter]` による frontmatter。 |
| JSONC/JSON    | `.jsonc`、`.json`             | オブジェクトキーと配列インデックス。引用符で囲まれていない限り、ドットで入れ子のサブセグメントを分割します。 |
| JSONL         | `.jsonl`、`.ndjson`           | 最上位の行アドレス（`L1`、`L2`、`$first`、`$last`）の後に、行内を JSONC 方式で降下します。             |
| YAML/.lobster | `.yaml`、`.yml`、`.lobster`   | マップキーとシーケンスインデックス。コメントとフロースタイルは YAML 文書 API で処理されます。         |

`resolve` は、1始まりの行番号とともに、`root`、`node`、`leaf`、`insertion-point` のいずれかの構造化された一致を返します。末端値はテキストと `leafType` として公開されるため、Plugin 作成者は形式ごとの AST 形状に依存せずにプレビューを表示できます。

## 変更契約

`set` は1つの具体的な対象へ書き込みます。

- Markdown の frontmatter 値と `- key: value` 項目フィールドは文字列の末端です。Markdown の挿入では、セクション、frontmatter キー、セクション項目を末尾へ追加し、変更後のファイルを正規化された markdown 形式で出力します。セクション本文全体を `set` で書き込むことはできません。
- JSONC の末端書き込みでは、文字列値を既存の末端型（`string`、有限の `number`、`true`/`false`、`null`）へ型変換します。JSONC/JSON/JSONL の末端置換で `<value>` を JSON として解析し、文字列形式の secret-ref 省略表記をオブジェクトへ置換する場合など、形状を変更できるようにするには `--value-json` を使用します。JSONC のオブジェクトと配列への挿入では `<value>` を JSON として解析し、通常の末端書き込みには `jsonc-parser` の編集パスを使用して、コメントと周辺の書式を保持します。
- JSONL の末端書き込みでは、行内で JSONC と同様に型変換します。行全体の置換と追記では `<value>` を JSON として解析します。出力された JSONL は、ファイルで優勢な LF/CRLF 改行規則を保持します（ファイル内の改行を多数決で判定するため、ほとんどが CRLF のファイルは、少数の LF が混在していても CRLF のままです）。
- YAML の末端書き込みでは、既存のスカラー型（`string`、有限の `number`、`true`/`false`、`null`）へ型変換します。YAML の挿入では、同梱の `yaml` パッケージの文書 API を使用してマップ／シーケンスを更新します。パーサーエラーのある不正な YAML 文書は、変更前に `parse-error` として拒否されます。

正確なバイト列が重要なユーザー表示対象への書き込み前には、`--dry-run` を使用してください。JSONC と YAML の編集では既存文書へパッチを適用するため（`jsonc-parser` または `yaml` 文書 API を使用）、変更されていないバイトは通常保持されます。markdown は編集のたびに解析済み構造からファイルを再構築するため、変更した末端以外の付随的な書式が正規化される場合があります。完全に出力されたファイルではなく、変更前後に絞ったパッチとしてプレビューする場合は `--diff` を追加します。

## 例

```bash
# パスを検証（ファイルシステムへのアクセスなし）
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# 末端を読み取り
openclaw path resolve 'oc://gateway.jsonc/version'

# ワイルドカード検索
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# 書き込みをドライラン
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# unified diff として書き込みをドライラン
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# 書き込みを適用
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# バイト忠実性を確認するラウンドトリップ（診断）
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

同じ5つの動詞をすべての種別で使用できます。アドレス指定方式は
ファイル拡張子に応じて処理を振り分けます。

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

`[frontmatter]`述語はYAMLフロントマターのブロックを指定します。`tools`は
スラッグを介して`## Tools`見出しに一致し、項目のリーフは、ソースで
アンダースコアが使われている場合でもスラッグ形式を維持します
（`send_email`は`send-email`になります）。

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

JSONCの編集は`jsonc-parser`を介して行われるため、`set`を実行しても
コメントと空白は維持されます。確定する前に、まず`--dry-run`を付けて実行し、
書き込まれるバイト列を確認してください。`.json`ファイルでは`.jsonc`と
同じアダプターおよび編集パスを使用します。

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

各行が1つのレコードです。行番号が不明な場合は述語
（`[event=action]`）で指定し、既知の場合は正規の`LN`セグメントで指定します。
`.ndjson`ファイルでは`.jsonl`と同じアダプターを使用します。

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

YAMLでは自作パーサーではなく`yaml`パッケージの`Document` APIを使用します。
そのため、通常の解析と出力の往復処理ではコメントと記述形式が維持され、
解決されたパスではJSONCと同じマップキー／シーケンスインデックスのモデルが
使用されます。同じアダプターが`.yaml`、`.yml`、`.lobster`ファイルを処理します。

## サブコマンドリファレンス

### `resolve <oc-path>`

単一のリーフまたはノードを読み取ります。ワイルドカードは拒否されるため、
ワイルドカードには`find`を使用してください。一致した場合は`0`、正常に
一致しなかった場合は`1`、解析エラーまたは拒否されたパターンの場合は`2`で
終了します。

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

ワイルドカード／述語／ユニオンパターンに一致するすべての項目を列挙します。
1件以上一致した場合は`0`、一致件数が0の場合は`1`で終了します。
ファイルスロットのワイルドカードは`OC_PATH_FILE_WILDCARD_UNSUPPORTED`として
拒否されます。具体的なファイルを渡してください（複数ファイルのグロブ対応は
今後追加予定の機能です）。

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

リーフを書き込みます。`--dry-run`と組み合わせると、ファイルに触れることなく
書き込まれるバイト列をプレビューできます。統合形式の差分をプレビューするには
`--diff`を追加します。書き込みに成功した場合は`0`、基盤によって拒否された場合
（たとえばセンチネルガードに該当した場合）は`1`、解析エラーの場合は`2`で
終了します。

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

`+key`挿入マーカーは、指定された子がまだ存在しない場合に作成します。
`+nnn`と単独の`+`は、それぞれインデックス指定の挿入と末尾への追加に使用します。

### `validate <oc-path>`

解析のみを行う検査です。ファイルシステムにはアクセスしません。変数を代入する
前にテンプレートパスが正しい形式であることを確認したい場合や、デバッグのために
構造の内訳を確認したい場合に便利です。

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

有効な場合は`0`、無効な場合は`1`（構造化された`code`と`message`を伴う）、
引数エラーの場合は`2`で終了します。

### `emit <file>`

ファイル種別ごとのパーサーとエミッターを介してファイルを往復処理します。
正常なファイルでは、出力は入力とバイト単位で同一になるはずです。相違がある場合は、
パーサーのバグまたはセンチネルへの該当を示します。実際の入力に対する基盤の動作を
デバッグする際に便利です。

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 終了コード

| コード | 意味                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| `0`    | 成功。（`resolve`／`find`：1件以上一致。`set`：書き込み成功。）                               |
| `1`    | 一致なし、または`set`が基盤によって拒否された（システムレベルのエラーではない）。             |
| `2`    | 引数または解析エラー。                                                                        |

## 出力モード

`openclaw path`はTTYを認識します。ターミナルでは人間が読みやすい形式で出力し、
標準出力がパイプまたはリダイレクトされている場合はJSONを出力します。`--json`と
`--human`は自動判定を上書きします。

## 注記

- `set`は基盤の出力パスを介してバイト列を書き込みます。このパスでは秘匿化
  センチネルガードが自動的に適用されます。`__OPENCLAW_REDACTED__`を含むリーフ
  （完全一致または部分文字列として含む場合）は、書き込み時に拒否されます。
- JSONCの解析とリーフ編集ではPluginローカルの`jsonc-parser`依存関係を使用します。
  そのため、自作パーサーによる再レンダリングパスを介さず、通常のリーフ書き込みで
  コメントと書式が維持されます。
- `path`は最終正常状態（LKG）の設定追跡や復旧を認識しません。そのライフサイクルは
  別の場所が所有します。`path`で編集したファイルがLKG追跡の対象でもある場合、
  次回の設定読み取り時に昇格するか復旧するかが決定されます。`path`による編集は、
  そのファイルへの他の直接書き込みと同様に扱ってください。

## 関連項目

- [CLIリファレンス](/ja-JP/cli)
