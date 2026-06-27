---
read_when:
    - ターミナルからワークスペースファイル内のリーフを読み書きしたい
    - ワークスペース状態に対してスクリプトを作成しており、安定した、種類に依存しないアドレス指定方式が必要な場合
    - '`oc://` パスをデバッグしています（構文を検証し、何に解決されるかを確認します）'
summary: '`openclaw path` の CLI リファレンス（`oc://` アドレッシング方式でワークスペースファイルを検査および編集）'
title: パス
x-i18n:
    generated_at: "2026-06-27T10:59:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Plugin が提供する、`oc://` アドレッシング基盤へのシェルアクセスです。アドレス指定可能なワークスペースファイル（markdown、jsonc、jsonl、yaml/yml/lobster）を検査および編集するための、種類に応じてディスパッチされる単一のパススキームです。セルフホスト運用者、Plugin 作者、エディター拡張は、ファイル種別ごとのパーサーを手作りせずに、狭い場所を読み取り、検索、更新するために使用します。

CLI は、この基盤の公開動詞を反映しています。

- `resolve` は具体的で、単一一致です。
- `find` はワイルドカード、ユニオン、述語、位置展開のための複数一致動詞です。
- `set` は具体的なパスまたは挿入マーカーだけを受け付けます。ワイルドカードパターンは書き込み前に拒否されます。

`path` は、バンドルされた任意の `oc-path` Plugin によって提供されます。初回使用前に有効化してください。

```bash
openclaw plugins enable oc-path
```

## 使用する理由

OpenClaw の状態は、人が編集する markdown、コメント付き JSONC 設定、追記専用 JSONL ログ、YAML ワークフロー/仕様ファイルに分散しています。シェルスクリプト、フック、エージェントは、これらのファイルから小さな値を 1 つだけ必要とすることがよくあります。frontmatter キー、Plugin 設定、ログレコードのフィールド、YAML ステップ、または名前付きセクション配下の箇条書き項目です。

`openclaw path` は、ファイル種別ごとに一回限りの grep、正規表現、パーサーを用意する代わりに、呼び出し元に安定したアドレスを提供します。同じ `oc://` パスをターミナルから検証、解決、検索、ドライラン、書き込みできるため、狭い自動化をレビューしやすく、再実行しやすくなります。ファイルの残りのコメント、改行、周辺フォーマットを保持しながら 1 つのリーフだけを更新したい場合に特に有用です。

欲しいものに論理アドレスがあるが、物理ファイルの形が異なる場合に使用します。

- フックが、コメント付き JSONC から 1 つの設定を読み取り、値を書き戻すときにコメントを失わないようにしたい。
- メンテナンススクリプトが、JSONL ログ全体をカスタムパーサーに読み込まずに、一致するイベントフィールドをすべて見つけたい。
- エディター拡張が、slug によって markdown のセクションまたは箇条書き項目へジャンプし、解決先の正確な行を表示したい。
- エージェントが、小さなワークスペース編集を適用する前にドライランし、変更されたバイトをレビューで見えるようにしたい。

通常のファイル全体の編集、複雑な設定移行、またはメモリ固有の書き込みには、おそらく `openclaw path` は不要です。それらには所有者のコマンドまたは Plugin を使用してください。`path` は、別の専用パーサーよりも再現可能なターミナルコマンドのほうが明確な、小さくアドレス指定可能なファイル操作のためのものです。

## 使用方法

人が編集する設定ファイルから 1 つの値を読み取ります。

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

ディスクに触れずに書き込みをプレビューします。

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

追記専用 JSONL ログ内の一致するレコードを検索します。

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

markdown 内の指示を、行番号ではなくセクションと項目で指定します。

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

スクリプトが読み取りまたは書き込みを行う前に、CI または事前確認スクリプトでパスを検証します。

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

これらのコマンドはシェルスクリプトへコピーできることを意図しています。呼び出し元が構造化出力を必要とする場合は `--json` を使い、人が結果を確認する場合は `--human` を使います。

## 仕組み

`openclaw path` は 4 つのことを行います。

1. `oc://` アドレスをスロットに解析します。ファイル、セクション、項目、フィールド、および任意のセッションです。
2. 対象の拡張子（`.md`、`.jsonc`、`.jsonl`、`.yaml`、`.yml`、`.lobster`、および関連するエイリアス）からファイル種別アダプターを選択します。
3. そのファイル種別の AST に対してスロットを解決します。markdown の見出し/項目、JSONC のオブジェクトキー/配列インデックス、JSONL の行レコード、または YAML のマップ/シーケンスノードです。
4. `set` では、同じアダプターを通じて編集後のバイトを出力し、種別が対応している場合は、未変更部分のコメント、改行、近くのフォーマットを保持します。

`resolve` と `set` は 1 つの具体的な対象を必要とします。`find` は探索用の動詞です。ワイルドカード、ユニオン、述語、序数を、書き込み先として 1 つを選ぶ前に検査できる具体的な一致へ展開します。

## サブコマンド

| サブコマンド            | 目的                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | パス上の具体的な一致を出力します（または「見つかりません」）。              |
| `find <pattern>`        | ワイルドカード / ユニオン / 述語パスの一致を列挙します。                    |
| `set <oc-path> <value>` | 具体的なパスにリーフまたは挿入対象を書き込みます。`--dry-run` に対応します。 |
| `validate <oc-path>`    | 解析のみ行い、構造分解（ファイル / セクション / 項目 / フィールド）を出力します。 |
| `emit <file>`           | `parseXxx` + `emitXxx` を通じてファイルをラウンドトリップします（バイト忠実度診断）。 |

## グローバルフラグ

| フラグ          | 目的                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | ファイルスロットをこのディレクトリに対して解決します（デフォルト: `process.cwd()`）。 |
| `--file <path>` | ファイルスロットの解決済みパスを上書きします（絶対アクセス）。          |
| `--json`        | JSON 出力を強制します（stdout が TTY でない場合のデフォルト）。          |
| `--human`       | 人間向け出力を強制します（stdout が TTY の場合のデフォルト）。           |
| `--dry-run`     | （`set` のみ）書き込まずに、書き込まれる予定のバイトを出力します。       |
| `--diff`        | （`set --dry-run` と併用）完全なバイトではなく unified diff を出力します。 |

## `oc://` 構文

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

スロットの規則: `field` には `item` が必要で、`item` には `section` が必要です。4 つのスロットすべてに共通します。

- **引用符付きセグメント** — `"a/b.c"` は `/` と `.` 区切りを保持します。
  内容はバイトリテラルです。引用符内では `"` と `\` は許可されません。
  ファイルスロットも引用符を認識します。`oc://"skills/email-drafter"/Tools/$last` は `skills/email-drafter` を単一のファイルパスとして扱います。
- **述語** — `[k=v]`、`[k!=v]`、`[k<v]`、`[k<=v]`、`[k>v]`、
  `[k>=v]`。数値演算では両辺が有限数へ強制変換できる必要があります。
- **ユニオン** — `{a,b,c}` は代替候補のいずれにも一致します。
- **ワイルドカード** — `*`（単一サブセグメント）と `**`（ゼロ個以上、
  再帰）。`find` はこれらを受け付けます。`resolve` と `set` はあいまいなため拒否します。
- **位置指定** — `$first` / `$last` は最初 / 最後のインデックスまたは宣言済みキーへ解決されます。
- **序数** — ドキュメント順で N 番目の一致を表す `#N`。
- **挿入マーカー** — キー付き / インデックス付き挿入のための `+`、`+key`、`+nnn`
  （`set` と併用）。
- **セッションスコープ** — `?session=cron-daily` など。スロットのネストとは直交します。セッション値は生の値であり、パーセントデコードされません。制御文字または予約済みクエリ区切り文字（`?`、`&`、`%`）を含めることはできません。

引用符付き、述語、ユニオンのセグメント外にある予約文字（`?`、`&`、`%`）は拒否されます。制御文字（U+0000-U+001F、U+007F）は、`session` クエリ値を含め、どこにあっても拒否されます。

正規パスでは `formatOcPath(parseOcPath(path)) === path` が保証されます。非正規のクエリパラメーターは、最初の空でない `session=` 値を除いて無視されます。

## ファイル種別ごとのアドレス指定

| 種別              | アドレス指定モデル                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | slug による H2 セクション、slug または `#N` による箇条書き項目、`[frontmatter]` による frontmatter。 |
| JSONC/JSON        | オブジェクトキーと配列インデックス。引用符付きでない限り、ドットはネストしたサブセグメントを分割します。 |
| JSONL             | 最上位の行アドレス（`L1`、`L2`、`$first`、`$last`）に続き、行内で JSONC 形式の降下を行います。 |
| YAML/YML/.lobster | マップキーとシーケンスインデックス。コメントとフロースタイルは YAML document API によって扱われます。 |

`resolve` は構造化された一致を返します。`root`、`node`、`leaf`、または `insertion-point` で、1 始まりの行番号が付きます。リーフ値はテキストと `leafType` として表出されるため、Plugin 作者は種別ごとの AST 形状に依存せずにプレビューを描画できます。

## ミューテーション契約

`set` は 1 つの具体的な対象を書き込みます。

- Markdown の frontmatter 値と `- key: value` 項目フィールドは文字列リーフです。
  Markdown 挿入は、セクション、frontmatter キー、またはセクション項目を追加し、変更後ファイルに対して正規の markdown 形状を描画します。
- JSONC リーフ書き込みは、文字列値を既存リーフ型（`string`、有限の `number`、`true`/`false`、または `null`）へ強制変換します。JSONC/JSON/JSONL リーフ置換で `<value>` を JSON として解析し、文字列の SecretRef 省略形をオブジェクトに置き換えるように形状が変わる可能性がある場合は、`--value-json` を使用します。JSONC オブジェクトと配列の挿入は `<value>` を JSON として解析し、通常のリーフ書き込みには `jsonc-parser` の編集パスを使用して、コメントと近くのフォーマットを保持します。
- JSONL リーフ書き込みは、行内で JSONC と同様に強制変換します。行全体の置換と追加は `<value>` を JSON として解析します。描画された JSONL は、ファイルの支配的な LF/CRLF 改行規約を保持します。
- YAML リーフ書き込みは、既存のスカラー型（`string`、有限の `number`、`true`/`false`、または `null`）へ強制変換します。YAML 挿入は、バンドルされた `yaml` パッケージの document API を使用してマップ/シーケンスを更新します。パーサーエラーのある不正な YAML ドキュメントは、ミューテーション前に `parse-error` で拒否されます。

正確なバイトが重要なユーザー可視の書き込み前には `--dry-run` を使用してください。この基盤は、parse/emit ラウンドトリップではバイト同一の出力を保持しますが、ミューテーションでは種別に応じて編集領域またはファイルが正規化される場合があります。
完全に描画されたファイルではなく、焦点を絞った before/after パッチとしてプレビューしたい場合は `--diff` を追加します。

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

同じ 5 つの動詞が種別をまたいで機能します。アドレス指定スキームはファイル拡張子に基づいて振り分けます。以下の例では、PR 説明のフィクスチャを使用します。

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

`[frontmatter]` 述語は YAML frontmatter ブロックを指定します。`tools` はスラッグを介して `## Tools` 見出しに一致し、項目のリーフは、ソースでアンダースコアが使われている場合でもスラッグ形式を維持します（`send_email` → `send-email`）。

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

JSONC の編集は `jsonc-parser` を通るため、コメントと空白は `set` 後も維持されます。コミットする前にバイト列を確認するには、まず `--dry-run` 付きで実行してください。

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

各行は 1 つのレコードです。行番号がわからない場合は述語（`[event=action]`）で指定し、わかっている場合は正規の `LN` セグメントで指定します。

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

YAML は手製のパーサーではなく `yaml` パッケージの `Document` API を使用します。そのため、通常の parse/emit ラウンドトリップではコメントと作成時の形が維持され、解決済みパスでは JSONC と同じマップキー / シーケンスインデックスモデルが使用されます。同じアダプターが `.yaml`、`.yml`、`.lobster` ファイルを扱います。

## サブコマンドリファレンス

### `resolve <oc-path>`

単一のリーフまたはノードを読み取ります。ワイルドカードは拒否されます。それらには `find` を使用してください。一致した場合は `0`、クリーンな未一致では `1`、パースエラーまたは拒否されたパターンでは `2` で終了します。

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

ワイルドカード / 述語 / ユニオンパターンに一致するすべての項目を列挙します。少なくとも 1 件一致した場合は `0`、0 件の場合は `1` で終了します。ファイルスロットのワイルドカードは `OC_PATH_FILE_WILDCARD_UNSUPPORTED` で拒否されます。具体的なファイルを渡してください（複数ファイルのグロブは今後の機能です）。

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

リーフを書き込みます。`--dry-run` と組み合わせると、ファイルに触れずに書き込まれるバイト列をプレビューできます。統合 diff プレビューには `--diff` を追加します。書き込みが成功した場合は `0`、基盤が拒否した場合（たとえばセンチネルガードに当たった場合）は `1`、パースエラーでは `2` で終了します。

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

`+key` 挿入マーカーは、まだ存在しない場合に指定名の子を作成します。`+nnn` と裸の `+` は、それぞれインデックス指定の挿入と末尾追加の挿入に機能します。

### `validate <oc-path>`

パースのみのチェックです。ファイルシステムにはアクセスしません。変数を代入する前にテンプレートパスが整形式であることを確認したい場合や、デバッグ用に構造の内訳を確認したい場合に便利です。

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

有効な場合は `0`、無効な場合は `1`（構造化された `code` と `message` 付き）、引数エラーでは `2` で終了します。

### `emit <file>`

種別ごとのパーサーとエミッターを通してファイルをラウンドトリップします。正常なファイルでは、出力は入力とバイト単位で一致するはずです。差異がある場合は、パーサーのバグまたはセンチネルへのヒットを示します。実際の入力に対する基盤の動作をデバッグする際に便利です。

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 終了コード

| コード | 意味                                                                            |
| ---- | -------------------------------------------------------------------------- |
| `0`  | 成功。 （`resolve` / `find`: 少なくとも 1 件一致。`set`: 書き込み成功。） |
| `1`  | 一致なし、または `set` が基盤に拒否された（システムレベルのエラーなし）。      |
| `2`  | 引数またはパースエラー。                                                   |

## 出力モード

`openclaw path` は TTY を認識します。端末では人間向けの出力になり、stdout がパイプまたはリダイレクトされている場合は JSON になります。`--json` と `--human` は自動検出を上書きします。

## 注記

- `set` は基盤の emit パスを通してバイト列を書き込み、その過程で redaction-sentinel ガードが自動的に適用されます。`__OPENCLAW_REDACTED__` を（そのまま、または部分文字列として）含むリーフは、書き込み時に拒否されます。
- JSONC のパースとリーフ編集は Plugin ローカルの `jsonc-parser` 依存関係を使用するため、通常のリーフ書き込みでは、手製のパーサー / 再レンダリング経路を通らずにコメントとフォーマットが維持されます。
- `path` は LKG を認識しません。ファイルが LKG で追跡されている場合、次の observe 呼び出しが promote / recover するかどうかを決定します。LKG-recovery 基盤と並行して、LKG の promote/recover ライフサイクルを通したアトミックな複数 `set` 用の `set --batch` が計画されています。

## 関連

- [CLI リファレンス](/ja-JP/cli)
