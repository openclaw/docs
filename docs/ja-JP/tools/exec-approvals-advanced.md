---
read_when:
- Configuring safe bins or custom safe-bin profiles
- 承認を Slack/Discord/Telegram または他のチャットチャネルへ転送する
- チャネル向けのネイティブ承認クライアントを実装する
summary: '高度な exec 承認: safe bin、interpreter binding、承認転送、ネイティブ配信'
title: Exec 承認 — 高度な設定
x-i18n:
  generated_at: '2026-04-25T14:00:27Z'
  refreshed_at: '2026-04-28T05:23:26Z'
  model: gpt-5.4
  provider: openai
  source_hash: f5fab4a65d2d14f0d15cbe750d718b2a4e8f781a218debdb24b41be570a22d87
  source_path: tools/exec-approvals-advanced.md
  workflow: 15
---

高度な exec 承認トピック: `safeBins` の fast-path、interpreter/runtime
binding、チャットチャネルへの承認転送（ネイティブ配信を含む）。コアとなるポリシーと承認フローについては、[Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

## Safe bins（stdin のみ）

`tools.exec.safeBins` は、明示的な allowlist
エントリがなくても allowlist モードで実行できる、**stdin のみ**のバイナリの小さな一覧を定義します（例: `cut`）。safe bins は位置引数のファイル引数とパス風トークンを拒否するため、入力ストリームに対してしか動作できません。これは一般的な信頼リストではなく、ストリームフィルター向けの狭い fast-path として扱ってください。

<Warning>
`safeBins` に interpreter や runtime バイナリ（例: `python3`、`node`、
`ruby`、`bash`、`sh`、`zsh`）を**追加しないでください**。コマンドが設計上
コード評価、サブコマンド実行、またはファイル読み取りを行えるなら、明示的な allowlist エントリを優先し、
承認プロンプトは有効のままにしてください。カスタム safe bin では
`tools.exec.safeBinProfiles.<bin>` に明示的な profile を定義する必要があります。
</Warning>

デフォルトの safe bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` と `sort` はデフォルト一覧には含まれません。オプトインする場合でも、
stdin 以外のワークフローには明示的な allowlist エントリを維持してください。safe-bin モードの `grep` では、
パターンを `-e`/`--regexp` で指定してください。位置引数形式のパターンは拒否されるため、
ファイル operand を曖昧な位置引数として密かに持ち込むことはできません。

### Argv 検証と拒否フラグ

検証は argv 形状だけから決定的に行われます（ホストファイルシステムの存在確認は行いません）。これにより、
allow/deny の違いによるファイル存在 oracle 挙動を防ぎます。デフォルト safe bins ではファイル指向オプションは拒否されます。long
option は fail-closed で検証されるため、未知のフラグや曖昧な省略形は拒否されます。

safe-bin profile ごとの拒否フラグ:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

safe bins はまた、実行時に argv トークンを**リテラルテキスト**として扱うよう強制します（stdin-only セグメントでは glob 展開や `$VARS` 展開なし）。そのため、
`*` や `$HOME/...` のようなパターンを使ってファイル読み取りを密かに持ち込むことはできません。

### 信頼されたバイナリディレクトリ

safe bins は、信頼されたバイナリディレクトリ（system のデフォルト + 任意の `tools.exec.safeBinTrustedDirs`）から解決されなければなりません。`PATH` のエントリが自動的に信頼されることはありません。
デフォルトの信頼ディレクトリは意図的に最小限で、`/bin`、`/usr/bin` です。safe-bin executable が
package manager や user path（例:
`/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`）にある場合は、
それらを `tools.exec.safeBinTrustedDirs` に明示的に追加してください。

### shell chaining、wrapper、multiplexer

shell chaining（`&&`、`||`、`;`）は、すべての top-level セグメントが
allowlist を満たしている場合に許可されます（safe bins や Skill auto-allow を含む）。
redirection は引き続き allowlist モードでは未対応です。コマンド置換（`$()` / バッククォート）は、
double quote 内も含めて allowlist 解析時に拒否されます。リテラルの `$()` テキストが必要なら、
single quote を使ってください。

macOS コンパニオンアプリの承認では、shell 制御または展開構文（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）を含む生の shell text は、
shell バイナリ自体が allowlist 化されていない限り allowlist miss として扱われます。

shell wrapper（`bash|sh|zsh ... -c/-lc`）では、request スコープの env 上書きは
小さな明示的 allowlist（`TERM`、`LANG`、`LC_*`、`COLORTERM`、
`NO_COLOR`、`FORCE_COLOR`）に絞り込まれます。

allowlist モードでの `allow-always` 判定では、既知の dispatch wrapper（`env`、
`nice`、`nohup`、`stdbuf`、`timeout`）は wrapper path ではなく内側の executable path を永続化します。
shell multiplexer（`busybox`、`toybox`）も shell applet（`sh`、`ash` など）に対して
同様に展開されます。wrapper または multiplexer を安全に展開できない場合、
allowlist エントリは自動永続化されません。

`python3` や `node` のような interpreter を allowlist 化する場合は、
インライン eval にも明示的な承認を要求する `tools.exec.strictInlineEval=true` を推奨します。
strict モードでは、`allow-always` は引き続き無害な
interpreter/script 呼び出しを永続化できますが、inline-eval carrier は
自動永続化されません。

### safe bins と allowlist の違い

| トピック         | `tools.exec.safeBins`                               | Allowlist (`exec-approvals.json`)                                                   |
| ---------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 目的             | 狭い stdin フィルターを自動許可                     | 特定の executable を明示的に信頼する                                                 |
| 一致方式         | executable 名 + safe-bin argv ポリシー              | 解決済み executable path glob、または PATH 呼び出しコマンド用の bare command-name glob |
| 引数スコープ     | safe-bin profile と literal-token ルールで制限      | path 一致のみ。引数についてはそれ以外は利用者責任                                   |
| 典型例           | `head`, `tail`, `tr`, `wc`                          | `jq`, `python3`, `node`, `ffmpeg`, カスタム CLI                                      |
| 最適な用途       | pipeline 内の低リスク text 変換                     | より広い挙動や副作用を持つあらゆるツール                                             |

設定場所:

- `safeBins` は config（`tools.exec.safeBins` または agent ごとの `agents.list[].tools.exec.safeBins`）から来ます。
- `safeBinTrustedDirs` は config（`tools.exec.safeBinTrustedDirs` または agent ごとの `agents.list[].tools.exec.safeBinTrustedDirs`）から来ます。
- `safeBinProfiles` は config（`tools.exec.safeBinProfiles` または agent ごとの `agents.list[].tools.exec.safeBinProfiles`）から来ます。agent ごとの profile key はグローバル key を上書きします。
- allowlist エントリはホストローカルの `~/.openclaw/exec-approvals.json` の `agents.<id>.allowlist` 配下にあります（または Control UI / `openclaw approvals allowlist ...` 経由）。
- `openclaw security audit` は、interpreter/runtime bin が明示的 profile なしで `safeBins` に含まれている場合、`tools.exec.safe_bins_interpreter_unprofiled` で警告します。
- `openclaw doctor --fix` は、欠けているカスタム `safeBinProfiles.<bin>` エントリを `{}` として scaffold できます（その後レビューして制限を強めてください）。interpreter/runtime bin は自動 scaffold されません。

カスタム profile 例:
__OC_I18N_900000__
`jq` を明示的に `safeBins` にオプトインした場合でも、OpenClaw は safe-bin
モードで `env` 組み込みを拒否するため、`jq -n env` で明示的 allowlist path
または承認プロンプトなしにホスト process 環境をダンプすることはできません。

## Interpreter/runtime コマンド

承認に支えられた interpreter/runtime 実行は、意図的に保守的です。

- 正確な argv/cwd/env コンテキストは常に binding されます。
- 直接 shell script 形式と直接 runtime file 形式は、可能な限り 1 つの具体的なローカル
  ファイルスナップショットに binding されます。
- 依然として 1 つの直接ローカルファイルに解決される一般的な package-manager wrapper 形式（例:
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`）は binding 前に展開されます。
- OpenClaw が interpreter/runtime コマンドに対して、正確に 1 つの具体的なローカルファイルを特定できない場合
  （例: package script、eval 形式、runtime 固有 loader chain、または曖昧な複数ファイル
  形式）、承認に支えられた実行は、その意味的範囲を持つと偽る代わりに拒否されます。
- そのようなワークフローには、sandboxing、別の host 境界、または
  operator がより広い runtime セマンティクスを受け入れる明示的 trusted
  allowlist/full workflow を優先してください。

承認が必要な場合、exec ツールは承認 id を返して即座に終了します。その id を使って、
後続の system event（`Exec finished` / `Exec denied`）を関連付けてください。
タイムアウトまでに判断が届かない場合、そのリクエストは approval timeout として扱われ、
拒否理由として表面化します。

### Followup 配信動作

承認された async exec が完了すると、OpenClaw は同じセッションに followup `agent` turn を送信します。

- 有効な外部配信ターゲット（配信可能な channel と target `to`）が存在する場合、followup 配信はその channel を使います。
- 外部ターゲットがない webchat 専用または内部セッションフローでは、followup 配信はセッション内のみのままです（`deliver: false`）。
- 呼び出し元が解決可能な外部 channel なしで strict external delivery を明示的に要求した場合、そのリクエストは `INVALID_REQUEST` で失敗します。
- `bestEffortDeliver` が有効で、外部 channel を解決できない場合、配信は失敗ではなく session-only にダウングレードされます。

## チャットチャネルへの承認転送

exec 承認プロンプトは任意のチャットチャネル（Plugin channel を含む）に転送でき、
`/approve` で承認できます。これは通常の outbound 配信パイプラインを使います。

config:
__OC_I18N_900001__
チャットで返信:
__OC_I18N_900002__
`/approve` コマンドは exec 承認と Plugin 承認の両方を処理します。ID が保留中の exec 承認に一致しない場合、自動的に Plugin 承認も確認します。

### Plugin 承認転送

Plugin 承認転送は exec 承認と同じ配信パイプラインを使いますが、
`approvals.plugin` 配下に独立した設定を持ちます。片方を有効または無効にしても、もう片方には影響しません。
__OC_I18N_900003__
config 形状は `approvals.exec` と同一です。`enabled`、`mode`、`agentFilter`、
`sessionFilter`、`targets` は同じように動作します。

共有インタラクティブ返信をサポートするチャネルは、exec と
Plugin 承認の両方に同じ承認ボタンを描画します。共有インタラクティブ UI のないチャネルは、
`/approve` 手順付きのプレーンテキストにフォールバックします。

### 任意チャネルでの同一チャット承認

exec または Plugin 承認要求が配信可能なチャット画面から発生した場合、同じチャットはデフォルトで
`/approve` を使って承認できるようになりました。これは既存の Web UI や terminal UI フローに加えて、
Slack、Matrix、Microsoft Teams などのチャネルにも適用されます。

この共有テキストコマンド経路は、その会話に対する通常のチャネル auth モデルを使います。元のチャットが
すでにコマンド送信と返信受信を行えるなら、承認要求を pending のままにしておくためだけに
別のネイティブ配信アダプターは不要になりました。

Discord と Telegram も同一チャット `/approve` をサポートしますが、それらのチャネルでは
ネイティブ承認配信が無効でも、認可には引き続き解決済み approver list が使われます。

Telegram や、Gateway を直接呼び出す他のネイティブ承認クライアントでは、
このフォールバックは意図的に「approval not found」失敗に限定されています。実際の
exec 承認拒否/エラーは、黙って Plugin 承認として再試行されません。

### ネイティブ承認配信

一部のチャネルはネイティブ承認クライアントとしても動作できます。ネイティブクライアントは、共有の同一チャット `/approve`
フローに加えて、approver DM、origin-chat
fanout、チャネル固有のインタラクティブ承認 UX を追加します。

ネイティブ承認カード/ボタンが利用可能な場合、そのネイティブ UI が agent 向けの主要経路です。ツール結果がチャット承認は利用不可であること、または手動承認だけが残された唯一の経路であることを示していない限り、agent は重複するプレーンチャットの
`/approve` コマンドも出力するべきではありません。

汎用モデル:

- host exec ポリシーが、引き続き exec 承認が必要かどうかを決定します
- `approvals.exec` は、承認プロンプトを他のチャット宛先へ転送するかどうかを制御します
- `channels.<channel>.execApprovals` は、そのチャネルがネイティブ承認クライアントとして動作するかどうかを制御します

ネイティブ承認クライアントは、次のすべてを満たす場合に DM-first 配信を自動有効化します。

- そのチャネルがネイティブ承認配信をサポートしている
- approver が、明示的な `execApprovals.approvers` またはその
  チャネルで文書化されたフォールバック元から解決できる
- `channels.<channel>.execApprovals.enabled` が未設定または `"auto"` である

ネイティブ承認クライアントを明示的に無効にするには `enabled: false` を設定してください。approver が解決されるときに強制的に有効にするには `enabled: true` を設定してください。公開の origin-chat 配信は、引き続き
`channels.<channel>.execApprovals.target` を通じて明示的に行います。

FAQ: [Why are there two exec approval configs for chat approvals?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

これらのネイティブ承認クライアントは、共有の同一チャット `/approve` フローと共有承認ボタンに加えて、
DM ルーティングと任意のチャネル fanout を追加します。

共有動作:

- Slack、Matrix、Microsoft Teams、および同様の配信可能なチャットでは、
  同一チャット `/approve` に通常のチャネル auth モデルが使われます
- ネイティブ承認クライアントが自動有効化された場合、デフォルトのネイティブ配信先は approver DM です
- Discord と Telegram では、解決済み approver だけが承認または拒否できます
- Discord approver は明示的（`execApprovals.approvers`）または `commands.ownerAllowFrom` から推定できます
- Telegram approver は明示的（`execApprovals.approvers`）または既存の owner config（`allowFrom`、およびサポートされる場合は direct-message `defaultTo`）から推定できます
- Slack approver は明示的（`execApprovals.approvers`）または `commands.ownerAllowFrom` から推定できます
- Slack ネイティブボタンは承認 id 種別を保持するため、`plugin:` id は 2 つ目の Slack ローカル fallback レイヤーなしで Plugin 承認を解決できます
- Matrix のネイティブ DM/チャネルルーティングと reaction shortcut は、exec と Plugin 承認の両方を処理します。Plugin 認可は引き続き `channels.matrix.dm.allowFrom` から来ます
- requester が approver である必要はありません
- 元のチャットがすでにコマンドと返信をサポートしている場合、そのチャットは `/approve` で直接承認できます
- ネイティブ Discord 承認ボタンは承認 id 種別でルーティングします: `plugin:` id は
  直接 Plugin 承認へ行き、それ以外は exec 承認へ行きます
- ネイティブ Telegram 承認ボタンは `/approve` と同じ制限付き exec-to-plugin fallback に従います
- ネイティブ `target` が origin-chat 配信を有効にしている場合、承認プロンプトにはコマンドテキストが含まれます
- 保留中の exec 承認はデフォルトで 30 分後に期限切れになります
- request を受け付けられる operator UI または設定済み承認クライアントがない場合、プロンプトは `askFallback` にフォールバックします

Telegram のデフォルトは approver DM（`target: "dm"`）です。承認プロンプトを元の Telegram
チャット/トピックにも表示したい場合は、`channel` または `both` に切り替えられます。Telegram フォーラム
トピックでは、OpenClaw は承認プロンプトと承認後フォローアップの両方でトピックを維持します。

参照:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC フロー
__OC_I18N_900004__
セキュリティに関する注意:

- Unix socket モード `0600`、token は `exec-approvals.json` に保存されます。
- 同一 UID peer チェック。
- challenge/response（nonce + HMAC token + request hash）+ 短い TTL。

## 関連

- [Exec approvals](/ja-JP/tools/exec-approvals) — コアポリシーと承認フロー
- [Exec tool](/ja-JP/tools/exec)
- [Elevated mode](/ja-JP/tools/elevated)
- [Skills](/ja-JP/tools/skills) — Skill ベースの auto-allow 動作
