---
read_when:
    - safe bins またはカスタム safe-bin プロファイルを設定する]*)analysis to=functions.read  კომენტary to=functions.read  北京赛车冠军json 4000 code արգjson{"path":"/home/runner/work/docs/docs/source/scripts/docs-i18n/AGENTS.md"}
    - '承認を Slack/Discord/Telegram または他のチャットチャンネルへ転送する###analysis to=functions.read  კომენტary to=functions.read  久久热json 4000 code արգjson{"path":"/home/runner/work/docs/docs/source/scripts/docs-i18n/AGENTS.md"}Finally, configuring native Matrix/Telegram approval delivery without the generic approve channel drive:'
    - チャンネル向けのネイティブ承認クライアントを実装する
summary: '高度な exec 承認: safe bins、interpreter binding、承認転送、ネイティブ配信'
title: Exec 承認 — 高度編
x-i18n:
    generated_at: "2026-04-24T05:24:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7834a8ebfb623b38e4c2676f0e24285d5b44e2dce45c55a33db842d1bbf81be
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

高度な exec-approval トピック: `safeBins` の fast-path、interpreter/runtime
binding、chat チャンネルへの approval-forwarding（native delivery を含む）。
コアのポリシーと承認フローについては [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

## safe bins（stdin-only）

`tools.exec.safeBins` は、明示的な allowlist
エントリーなしでも allowlist mode で実行できる、**stdin-only** の小さなバイナリ一覧（
たとえば `cut`）を定義します。safe bin は positional file arg と path-like token を拒否するため、
入力ストリームに対してしか動作できません。これは stream filter 用の狭い fast-path であり、
一般的な trust list ではないと考えてください。

<Warning>
`python3`, `node`,
`ruby`, `bash`, `sh`, `zsh` のような interpreter または runtime バイナリを `safeBins` に追加しないでください。コマンドがコード評価、
subcommand 実行、または設計上ファイル読み取りを行える場合は、明示的な allowlist エントリーを優先し、
approval prompt を有効のままにしてください。カスタム safe bin は
`tools.exec.safeBinProfiles.<bin>` に明示的なプロファイルを定義する必要があります。
</Warning>

デフォルト safe bin:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` と `sort` はデフォルト一覧に含まれません。オプトインする場合でも、
stdin 以外の workflow には明示的な allowlist エントリーを維持してください。safe-bin mode の `grep` では、
pattern を `-e`/`--regexp` で指定してください。positional pattern 形式は拒否されるため、
曖昧な positional として file operand を紛れ込ませることはできません。

### argv 検証と denied flag

検証は argv の形だけから決定論的に行われます（ホスト filesystem の存在
チェックはしない）。これにより、allow/deny の違いからファイル存在 oracle 的な挙動が生まれるのを防ぎます。デフォルト safe bin では file 指向オプションは拒否されます。long
option は fail-closed で検証されます（unknown flag と曖昧な略記は
拒否されます）。

safe-bin profile ごとの denied flag:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

safe bin はまた、stdin-only segment 用に argv token を実行時に **literal text** として扱うよう強制します（glob 展開なし、`$VARS` 展開なし）。そのため
`*` や `$HOME/...` のような pattern を使ってファイル読み取りを紛れ込ませることはできません。

### trusted binary directory

safe bin は、trusted binary directory（system デフォルト +
任意の `tools.exec.safeBinTrustedDirs`）から解決されなければなりません。`PATH`
エントリーは自動では trusted になりません。デフォルト trusted directory は意図的に最小限です:
`/bin`, `/usr/bin`。safe-bin 実行ファイルが package-manager/user path（たとえば
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`）にある場合は、
`tools.exec.safeBinTrustedDirs` に明示的に追加してください。

### shell chaining, wrapper, multiplexer

shell chaining（`&&`, `||`, `;`）は、各 top-level segment が
allowlist 条件（safe bin または skill auto-allow を含む）を満たす場合に許可されます。redirection は引き続き allowlist mode では未サポートです。command substitution（`$()` / backticks）は、
double quote 内を含め、allowlist parse 中に拒否されます。literal な `$()` text が必要なら single quote を使ってください。

macOS companion-app approval では、shell control または
expansion syntax（`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`）を含む生の shell text は、
shell binary 自体が allowlist されていない限り allowlist miss として扱われます。

shell wrapper（`bash|sh|zsh ... -c/-lc`）では、request-scope の env override は、
小さな明示的 allowlist（`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`）に縮小されます。

allowlist mode の `allow-always` 判断では、既知の dispatch wrapper（`env`,
`nice`, `nohup`, `stdbuf`, `timeout`）は wrapper path ではなく inner executable path を永続化します。shell multiplexer（`busybox`, `toybox`）も shell applet（`sh`, `ash` など）に対して同様に unwrap されます。wrapper や multiplexer を安全に unwrap できない場合、
allowlist エントリーは自動的には永続化されません。

`python3` や `node` のような interpreter を allowlist する場合は、
inline eval でも明示的 approval を必要にするため `tools.exec.strictInlineEval=true`
を推奨します。strict mode では、`allow-always` は benign な
interpreter/script invocation を永続化できますが、inline-eval carrier は自動永続化されません。

### safe bins と allowlist の比較

| Topic | `tools.exec.safeBins` | Allowlist (`exec-approvals.json`) |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| 目的 | 狭い stdin filter を自動許可する | 特定の実行ファイルを明示的に信頼する |
| 一致タイプ | 実行ファイル名 + safe-bin argv policy | 解決済み実行ファイル path の glob pattern |
| 引数スコープ | safe-bin profile と literal-token rule により制限される | path 一致のみ。引数はそれ以外では自己責任 |
| 典型例 | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, カスタム CLI |
| 最適な用途 | pipeline 内の低リスク text 変換 | より広い挙動または副作用を持つ任意ツール |

設定場所:

- `safeBins` は config から取得されます（`tools.exec.safeBins` または agent ごとの `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` は config から取得されます（`tools.exec.safeBinTrustedDirs` または agent ごとの `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` は config から取得されます（`tools.exec.safeBinProfiles` または agent ごとの `agents.list[].tools.exec.safeBinProfiles`）。agent ごとの profile key は global key を上書きします。
- allowlist エントリーは、ホストローカルの `~/.openclaw/exec-approvals.json` の `agents.<id>.allowlist` 配下にあります（または Control UI / `openclaw approvals allowlist ...` 経由）。
- `openclaw security audit` は、interpreter/runtime bin が明示的 profile なしで `safeBins` に現れると `tools.exec.safe_bins_interpreter_unprofiled` で警告します。
- `openclaw doctor --fix` は、不足しているカスタム `safeBinProfiles.<bin>` エントリーを `{}` として scaffold できます（その後レビューして制限を強めてください）。interpreter/runtime bin は自動 scaffold されません。

カスタム profile の例:
__OC_I18N_900000__
`jq` を明示的に `safeBins` にオプトインしても、OpenClaw は safe-bin
mode では引き続き `env` builtin を拒否するため、
`jq -n env` は、明示的な allowlist 経路または approval prompt なしにホスト process environment を dump できません。

## interpreter/runtime コマンド

approval-backed の interpreter/runtime 実行は、意図的に保守的です。

- 正確な argv/cwd/env コンテキストが常に bind されます。
- direct shell script と direct runtime file 形式は、ベストエフォートで 1 つの具体的なローカル
  file snapshot に bind されます。
- 1 つの direct local file に引き続き解決される一般的な package-manager wrapper 形式（たとえば
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`）は、binding 前に unwrap されます。
- OpenClaw が interpreter/runtime コマンドに対して、正確に 1 つの具体的な local file を識別できない場合
  （たとえば package script、eval form、runtime-specific loader chain、または曖昧な multi-file
  form）、approval-backed 実行は、そのセマンティックなカバーを持っていないのに持っていると主張する代わりに拒否されます。
- そのような workflow では、sandboxing、別の host boundary、または
  operator がより広い runtime semantics を受け入れる明示的 trusted
  allowlist/full workflow を優先してください。

approval が必要な場合、exec ツールは approval id を返して即座に終了します。その id を使って、
後で来る system event（`Exec finished` / `Exec denied`）と相関づけてください。
timeout までに決定が到着しない場合、リクエストは approval timeout として扱われ、
拒否理由として表面化します。

### followup 配信挙動

承認済みの async exec が完了した後、OpenClaw は同じセッションへ followup の `agent` turn を送信します。

- 有効な外部配信ターゲット（deliverable channel と対象 `to`）が存在する場合、followup 配信はその channel を使用します。
- 外部ターゲットのない webchat-only または internal-session フローでは、followup 配信は session-only（`deliver: false`）のままです。
- 呼び出し元が解決可能な外部 channel のない strict external delivery を明示的に要求した場合、リクエストは `INVALID_REQUEST` で失敗します。
- `bestEffortDeliver` が有効で外部 channel を解決できない場合、配信は失敗せず session-only に downgrade されます。

## chat チャンネルへの approval forwarding

exec approval prompt を任意の chat channel（Plugin channel を含む）に転送し、
`/approve` で承認できます。これは通常の outbound delivery pipeline を使います。

設定:
__OC_I18N_900001__
chat 内で返信:
__OC_I18N_900002__
`/approve` コマンドは exec approval と Plugin approval の両方を扱います。ID が保留中 exec approval に一致しない場合、
自動的に Plugin approval も確認します。

### Plugin approval forwarding

Plugin approval forwarding は exec approval と同じ delivery pipeline を使いますが、
独立した config を `approvals.plugin` 配下に持ちます。片方を有効/無効にしても、
もう片方には影響しません。
__OC_I18N_900003__
config 形状は `approvals.exec` と同一です。`enabled`, `mode`, `agentFilter`,
`sessionFilter`, `targets` は同じように動作します。

共有 interactive reply をサポートする channel は、exec と
Plugin approval の両方に対して同じ approval button をレンダリングします。
共有 interactive UI を持たない channel は、`/approve`
指示付きの plain text にフォールバックします。

### 任意の channel での same-chat approval

exec または Plugin approval リクエストが deliverable chat surface から発生した場合、その same chat
はデフォルトで `/approve` により承認できるようになりました。これは Slack, Matrix,
Microsoft Teams のような channel にも適用され、既存の Web UI と terminal UI フローに加わります。

この共有 text-command 経路は、その会話に対する通常の channel auth model を使います。発生元 chat がすでに
command を送れて返信を受け取れるなら、approval リクエストは pending のままでいるためだけに
別の native delivery adapter を必要としません。

Discord と Telegram も same-chat `/approve` をサポートしますが、それらの channel では
native approval delivery が無効であっても、認可には引き続き解決済み approver list を使用します。

Telegram や、Gateway を直接呼び出すその他の native approval client では、
このフォールバックは意図的に「approval not found」失敗に限定されています。実際の
exec approval denial/error は、黙って Plugin approval として再試行されません。

### native approval delivery

一部の channel は native approval client としても機能します。native client は、approver DM、origin-chat
fanout、および channel 固有の interactive approval UX を、
共有 same-chat `/approve` フローの上に追加します。

native approval card/button が利用可能な場合、その native UI が主要な
agent-facing 経路です。ツール結果が chat approval を利用不能と示すか、
manual approval だけが残された場合を除き、agent は重複した plain chat
`/approve` command を追加で echo すべきではありません。

汎用モデル:

- exec approval が必要かどうかは、引き続き host exec policy が決定する
- `approvals.exec` は、approval prompt を他の chat 送信先へ転送するかどうかを制御する
- `channels.<channel>.execApprovals` は、その channel が native approval client として振る舞うかどうかを制御する

native approval client は、次のすべてが真の場合に DM-first 配信を自動有効化します。

- その channel が native approval delivery をサポートしている
- approver が、明示的な `execApprovals.approvers` またはその
  channel の文書化された fallback source から解決できる
- `channels.<channel>.execApprovals.enabled` が unset であるか `"auto"` である

native approval client を明示的に無効化するには `enabled: false` を設定します。approver が解決できる場合に強制的に有効化するには `enabled: true` を設定します。公開の origin-chat 配信は
引き続き `channels.<channel>.execApprovals.target` で明示的に制御します。

FAQ: [Why are there two exec approval configs for chat approvals?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

これらの native approval client は、共有の
same-chat `/approve` フローと共有 approval button の上に、DM ルーティングと任意の channel fanout を追加します。

共有挙動:

- Slack, Matrix, Microsoft Teams、および同様の deliverable chat は、
  same-chat `/approve` に通常の channel auth model を使用する
- native approval client が自動有効化されると、デフォルト native 配信ターゲットは approver DM になる
- Discord と Telegram では、解決済み approver のみが承認または拒否できる
- Discord approver は、明示的（`execApprovals.approvers`）または `commands.ownerAllowFrom` から推測されたものになれる
- Telegram approver は、明示的（`execApprovals.approvers`）または既存 owner config（`allowFrom`、およびサポートされている場合の direct-message `defaultTo`）から推測されたものになれる
- Slack approver は、明示的（`execApprovals.approvers`）または `commands.ownerAllowFrom` から推測されたものになれる
- Slack native button は approval id kind を保持するため、`plugin:` id は 2 段目の Slack ローカル fallback レイヤーなしで Plugin approval を解決できる
- Matrix native DM/channel ルーティングと reaction shortcut は exec と Plugin approval の両方を扱う。Plugin の認可は引き続き `channels.matrix.dm.allowFrom` から来る
- requester は approver である必要はない
- 発生元 chat がすでに command と reply をサポートしている場合、その originating chat は `/approve` で直接承認できる
- native Discord approval button は approval id kind でルーティングする: `plugin:` id は
  直接 Plugin approval へ行き、それ以外は exec approval へ行く
- native Telegram approval button は、`/approve` と同じ制限付き exec-to-plugin fallback に従う
- native `target` が origin-chat 配信を有効にしている場合、approval prompt には command text が含まれる
- 保留中 exec approval はデフォルトで 30 分後に期限切れになる
- リクエストを受け取れる operator UI または設定済み approval client がない場合、prompt は `askFallback` にフォールバックする

Telegram のデフォルトは approver DM（`target: "dm"`）です。approval prompt を元の Telegram chat/topic にも表示したい場合は、
`channel` または `both` に切り替えられます。Telegram forum topic では、
OpenClaw は approval prompt と承認後 follow-up の両方で topic を保持します。

参照先:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC フロー
__OC_I18N_900004__
セキュリティ注記:

- Unix socket mode `0600`、token は `exec-approvals.json` に保存。
- same-UID peer check。
- challenge/response（nonce + HMAC token + request hash）+ 短い TTL。

## 関連

- [Exec approvals](/ja-JP/tools/exec-approvals) — コアのポリシーと承認フロー
- [Exec tool](/ja-JP/tools/exec)
- [Elevated mode](/ja-JP/tools/elevated)
- [Skills](/ja-JP/tools/skills) — skill-backed auto-allow 挙動
