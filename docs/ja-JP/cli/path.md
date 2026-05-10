---
read_when:
    - ワークスペースファイル内のリーフをターミナルから読み書きしたい
    - ワークスペース状態に対してスクリプトを書いており、種類に依存しない安定したアドレッシング方式が必要な場合
    - '`oc://` パスをデバッグしている（構文を検証し、解決先を確認する）'
summary: '`openclaw path` の CLI リファレンス（`oc://` アドレス指定方式を介してワークスペースファイルを確認および編集する）'
title: パス
x-i18n:
    generated_at: "2026-05-10T19:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

`oc://` アドレッシング基盤への、Plugin が提供するシェルアクセス: アドレス指定可能なワークスペースファイル (markdown、jsonc、jsonl) を検査および編集するための、種類に応じてディスパッチされる 1 つのパススキームです。セルフホスト運用者、Plugin 作者、エディター拡張機能は、ファイルごとのパーサーを手作りせずに、狭い場所を読み取り、検索し、更新するためにこれを使用します。

CLI は、基盤の公開動詞を反映しています。

- `resolve` は具体的で、単一一致です。
- `find` はワイルドカード、ユニオン、述語、位置展開のための複数一致動詞です。
- `set` は具体的なパスまたは挿入マーカーだけを受け付けます。ワイルドカードパターンは書き込み前に拒否されます。

`path` は、バンドルされた任意の `oc-path` Plugin によって提供されます。初回使用前に有効化してください。

```bash
openclaw plugins enable oc-path
```

## 使用する理由

OpenClaw の状態は、人が編集する markdown、コメント付き JSONC 設定、追記専用 JSONL ログに分散しています。シェルスクリプト、フック、エージェントは多くの場合、これらのファイルから 1 つの小さな値を必要とします。frontmatter キー、Plugin 設定、ログレコードフィールド、または名前付きセクション配下の箇条書き項目などです。

`openclaw path` は、呼び出し側に、ファイル種類ごとの一回限りの grep、正規表現、パーサーではなく、安定したアドレスを提供します。同じ `oc://` パスをターミナルから検証、解決、検索、ドライラン、書き込みできるため、狭い自動化をレビューしやすく、再実行しやすくなります。ファイルのコメント、改行、周辺の整形を保ったまま 1 つのリーフを更新したい場合に特に有用です。

目的のものに論理アドレスがあるが、物理ファイルの形が異なる場合に使用します。

- フックが、値を書き戻すときにコメントを失わずに、コメント付き JSONC から 1 つの設定を読み取りたい。
- メンテナンススクリプトが、ログ全体をカスタムパーサーに読み込まずに、JSONL ログ内の一致するすべてのイベントフィールドを検索したい。
- エディター拡張機能が、slug によって markdown セクションまたは箇条書き項目へジャンプし、その後、解決先の正確な行をレンダリングしたい。
- エージェントが、小さなワークスペース編集を適用する前にドライランし、変更されたバイトをレビューで確認したい。

通常のファイル全体の編集、充実した設定移行、メモリー固有の書き込みには、おそらく `openclaw path` は必要ありません。それらは所有者コマンドまたは Plugin を使用するべきです。`path` は、再現可能なターミナルコマンドのほうが別の専用パーサーより明確な、小さくアドレス指定可能なファイル操作のためのものです。

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

markdown 内の指示を、行番号ではなくセクションと項目でアドレス指定します。

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

スクリプトが読み取りまたは書き込みを行う前に、CI または事前確認スクリプトでパスを検証します。

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

これらのコマンドは、シェルスクリプトにコピーできることを意図しています。呼び出し側が構造化出力を必要とする場合は `--json` を、人が結果を検査する場合は `--human` を使用します。

## 仕組み

`openclaw path` は 4 つのことを行います。

1. `oc://` アドレスを、file、section、item、field、任意の session のスロットに解析します。
2. 対象拡張子 (`.md`、`.jsonc`、`.jsonl`、および関連エイリアス) からファイル種類アダプターを選択します。
3. そのファイル種類の AST に対してスロットを解決します。markdown 見出し/項目、JSONC オブジェクトキー/配列インデックス、または JSONL 行レコードです。
4. `set` では、同じアダプターを通じて編集済みバイトを出力し、その種類が対応する範囲で、ファイルの未変更部分がコメント、改行、近くの整形を保つようにします。

`resolve` と `set` には、1 つの具体的な対象が必要です。`find` は探索用の動詞です。ワイルドカード、ユニオン、述語、序数を具体的な一致へ展開し、書き込み先を選ぶ前に検査できます。

## サブコマンド

| サブコマンド              | 目的                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | パス上の具体的な一致を出力します (または「見つからない」)。                       |
| `find <pattern>`        | ワイルドカード / ユニオン / 述語パスの一致を列挙します。                   |
| `set <oc-path> <value>` | 具体的なパスにリーフまたは挿入対象を書き込みます。`--dry-run` に対応します。   |
| `validate <oc-path>`    | 解析のみを行い、構造分解 (file / section / item / field) を出力します。      |
| `emit <file>`           | ファイルを `parseXxx` + `emitXxx` に通します (バイト忠実性診断)。 |

## グローバルフラグ

| フラグ            | 目的                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | このディレクトリを基準に file スロットを解決します (デフォルト: `process.cwd()`)。 |
| `--file <path>` | file スロットの解決済みパスを上書きします (絶対アクセス)。                |
| `--json`        | JSON 出力を強制します (stdout が TTY でない場合のデフォルト)。                    |
| `--human`       | 人間向け出力を強制します (stdout が TTY の場合のデフォルト)。                       |
| `--dry-run`     | (`set` のみ) 書き込まずに、書き込まれるはずのバイトを出力します。   |

## `oc://` 構文

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

スロット規則: `field` には `item` が必要で、`item` には `section` が必要です。4 つすべてのスロットに共通します。

- **引用セグメント** — `"a/b.c"` は `/` と `.` 区切りをまたいで保持されます。
  内容はバイトリテラルです。引用符内では `"` と `\` は許可されません。
  file スロットも引用を認識します。`oc://"skills/email-drafter"/Tools/$last` は `skills/email-drafter` を単一のファイルパスとして扱います。
- **述語** — `[k=v]`、`[k!=v]`、`[k<v]`、`[k<=v]`、`[k>v]`、
  `[k>=v]`。数値演算では、両辺が有限数へ強制変換できる必要があります。
- **ユニオン** — `{a,b,c}` はいずれかの選択肢に一致します。
- **ワイルドカード** — `*` (単一サブセグメント) と `**` (0 個以上、
  再帰)。`find` はこれらを受け付けます。`resolve` と `set` は曖昧として拒否します。
- **位置指定** — `$last` は最後のインデックス / 最後に宣言されたキーに解決されます。
- **序数** — ドキュメント順で N 番目の一致を表す `#N`。
- **挿入マーカー** — キー付き / インデックス付き挿入のための `+`、`+key`、`+nnn` (`set` と併用)。
- **セッションスコープ** — `?session=cron-daily` など。スロットのネストとは直交します。セッション値は生の値であり、パーセントデコードされません。制御文字または予約済みクエリ区切り文字 (`?`、`&`、`%`) を含めることはできません。

引用、述語、ユニオンのセグメント外にある予約文字 (`?`、`&`、`%`) は拒否されます。制御文字 (U+0000-U+001F、U+007F) は、`session` クエリ値を含め、どこにあっても拒否されます。

正規パスでは `formatOcPath(parseOcPath(path)) === path` が保証されます。非正規のクエリパラメーターは、最初の空でない `session=` 値を除いて無視されます。

## ファイル種類ごとのアドレス指定

| 種類       | アドレス指定モデル                                                                          |
| ---------- | ----------------------------------------------------------------------------------------- |
| Markdown   | slug による H2 セクション、slug または `#N` による箇条書き項目、`[frontmatter]` による frontmatter。       |
| JSONC/JSON | オブジェクトキーと配列インデックス。引用されていない限り、ドットはネストしたサブセグメントを分割します。              |
| JSONL      | トップレベルの行アドレス (`L1`、`L2`、`$last`) の後、行内で JSONC 形式の降下を行います。 |

`resolve` は構造化された一致を返します。`root`、`node`、`leaf`、または `insertion-point` と、1 始まりの行番号です。リーフ値はテキストと `leafType` として表面化されるため、Plugin 作者はファイル種類ごとの AST 形状に依存せずにプレビューをレンダリングできます。

## 変更契約

`set` は 1 つの具体的な対象を書き込みます。

- Markdown frontmatter 値と `- key: value` 項目フィールドは文字列リーフです。
  Markdown 挿入はセクション、frontmatter キー、またはセクション項目を追加し、変更されたファイルに対して正規 markdown 形状をレンダリングします。
- JSONC リーフ書き込みは、文字列値を既存のリーフ型 (`string`、有限 `number`、`true`/`false`、または `null`) に強制変換します。JSONC オブジェクトと配列の挿入は `<value>` を JSON として解析し、通常のリーフ書き込みには `jsonc-parser` 編集パスを使用して、コメントと近くの整形を保持します。
- JSONL リーフ書き込みは、行内で JSONC と同様に強制変換します。行全体の置換と追加は `<value>` を JSON として解析します。レンダリングされた JSONL は、ファイルの主要な LF/CRLF 改行規約を保持します。

正確なバイトが重要なユーザー可視の書き込みの前には、`--dry-run` を使用してください。この基盤は parse/emit ラウンドトリップでバイト同一の出力を保持しますが、変更では、種類に応じて編集領域またはファイルが正規化されることがあります。

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

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

その他の文法例:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

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

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## ファイル種類ごとのレシピ

同じ 5 つの動詞が種類をまたいで機能します。アドレス指定スキームはファイル拡張子に基づいてディスパッチします。以下の例では、PR 説明のフィクスチャを使用します。

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

`[frontmatter]` 述語は YAML frontmatter ブロックをアドレス指定します。`tools` は slug によって `## Tools` 見出しに一致し、項目リーフは、ソースでアンダースコアが使用されている場合でも slug 形式を保持します (`send_email` → `send-email`)。

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

JSONC の編集は `jsonc-parser` を経由するため、コメントと空白は
`set` 後も保持されます。コミットする前に、まず `--dry-run` 付きで実行してバイト列を確認してください。

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

各行が 1 つのレコードです。行番号がわからない場合は述語（`[event=action]`）で指定し、わかっている場合は正規の `LN` セグメントで指定します。

## サブコマンドリファレンス

### `resolve <oc-path>`

単一のリーフまたはノードを読み取ります。ワイルドカードは拒否されます。それらには `find` を使用してください。
一致した場合は `0`、正常な未検出の場合は `1`、パースエラーまたは拒否されたパターンの場合は `2` で終了します。

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

ワイルドカード / 述語 / union パターンに一致するすべての項目を列挙します。少なくとも 1 件一致した場合は `0`、0 件の場合は `1` で終了します。ファイルスロットのワイルドカードは `OC_PATH_FILE_WILDCARD_UNSUPPORTED` で拒否されます。具体的なファイルを渡してください（複数ファイルの glob はフォローアップ機能です）。

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

リーフを書き込みます。`--dry-run` と組み合わせると、ファイルに触れずに書き込まれるバイト列をプレビューできます。書き込みが成功した場合は `0`、基盤が拒否した場合（たとえば sentinel ガードに当たった場合）は `1`、パースエラーの場合は `2` で終了します。

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

`+key` 挿入マーカーは、まだ存在しない場合に名前付きの子を作成します。`+nnn` と単独の `+` は、それぞれインデックス指定の挿入と末尾への追加挿入に使えます。

### `validate <oc-path>`

パースのみのチェックです。ファイルシステムにはアクセスしません。変数を代入する前にテンプレートパスが正しい形式か確認したい場合や、デバッグ用に構造の内訳を確認したい場合に便利です。

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

有効な場合は `0`、無効な場合は（構造化された `code` と `message` とともに）`1`、引数エラーの場合は `2` で終了します。

### `emit <file>`

種類ごとのパーサーと emitter を通してファイルをラウンドトリップします。正常なファイルでは、出力は入力とバイト単位で同一になるはずです。不一致はパーサーのバグ、または sentinel への到達を示します。実際の入力に対する基盤の動作をデバッグする際に便利です。

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 終了コード

| コード | 意味                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | 成功。 （`resolve` / `find`: 少なくとも 1 件一致。`set`: 書き込み成功。） |
| `1`  | 一致なし、または `set` が基盤により拒否された（システムレベルのエラーなし）。      |
| `2`  | 引数エラーまたはパースエラー。                                                   |

## 出力モード

`openclaw path` は TTY を認識します。端末では人間が読みやすい出力になり、stdout がパイプまたはリダイレクトされている場合は JSON になります。`--json` と `--human` は自動検出を上書きします。

## メモ

- `set` は基盤の emit パスを通じてバイト列を書き込み、その過程で redaction-sentinel ガードが自動的に適用されます。
  `__OPENCLAW_REDACTED__` を持つリーフ（そのまま、または部分文字列として）は、書き込み時に拒否されます。
- JSONC のパースとリーフ編集には Pluginローカルの `jsonc-parser`
  依存関係を使用するため、通常のリーフ書き込みでは手製のパーサーや再レンダリング経路を通さず、コメントとフォーマットが保持されます。
- `path` は LKG を認識しません。ファイルが LKG で追跡されている場合、次の observe 呼び出しが promote / recover するかどうかを判断します。LKG promote/recover ライフサイクルを通じたアトミックな複数 `set` 用の `set --batch` は、LKG-recovery 基盤とあわせて計画されています。

## 関連

- [CLI リファレンス](/ja-JP/cli)
