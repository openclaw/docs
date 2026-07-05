---
read_when:
    - 安全な bin またはカスタム安全 bin プロファイルの設定
    - 承認を Slack/Discord/Telegram またはその他のチャットチャネルに転送する
    - チャネル向けネイティブ承認クライアントの実装
summary: '高度な exec 承認: 安全なバイナリ、インタープリターのバインディング、承認の転送、ネイティブ配信'
title: Exec 承認 — 高度
x-i18n:
    generated_at: "2026-07-05T11:53:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c3a4934b87c7b20f27439239bd1e02e7bcbd137b72624720da6aeb25dadc952
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

exec 承認の高度なトピック: `safeBins` ファストパス、インタープリター/ランタイムの
バインド、チャットチャネルへの承認転送（ネイティブ配信を含む）。
中核ポリシーと承認フローについては、[exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

## セーフビン（stdin のみ）

`tools.exec.safeBins` は、明示的な許可リストエントリなしで許可リストモードで実行される
**stdin のみ**のバイナリ（例: `cut`）を指定します。セーフビンは位置指定のファイル引数と
パス風のトークンを拒否するため、入力ストリームに対してのみ動作できます。これはストリームフィルター用の
限定的なファストパスとして扱い、一般的な信頼リストとして扱わないでください。

<Warning>
インタープリターまたはランタイムのバイナリ（例: `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`）を `safeBins` に追加**しないでください**。コマンドがコードを評価したり、
サブコマンドを実行したり、設計上ファイルを読めたりする場合は、明示的な許可リストエントリを優先し、
承認プロンプトを有効のままにしてください。カスタムセーフビンは `tools.exec.safeBinProfiles.<bin>` に
明示的なプロファイルを定義する必要があります。
</Warning>

デフォルトのセーフビン:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` と `sort` はデフォルトリストに含まれていません。オプトインする場合は、stdin 以外のワークフローには
明示的な許可リストエントリを維持してください。セーフビンモードの `grep` では、
`-e`/`--regexp` でパターンを指定してください。位置指定パターン形式は拒否されるため、
ファイルオペランドを曖昧な位置指定として紛れ込ませることはできません。

### Argv 検証と拒否されるフラグ

検証は argv の形状のみから決定論的に行われます（ホストファイルシステムの存在チェックは行いません）。
これにより、許可/拒否の差異からファイル存在オラクルの挙動が生じることを防ぎます。
デフォルトのセーフビンではファイル指向オプションが拒否されます。長いオプションはフェイルクローズで検証されます
（不明なフラグと曖昧な省略形は拒否されます）。

セーフビンプロファイルごとに拒否されるフラグ:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

セーフビンは、stdin のみのセグメントでは実行時に argv トークンを**リテラルテキスト**として扱うことも強制します
（グロブ展開も `$VARS` 展開も行いません）。そのため、`*` や `$HOME/...` のようなパターンを使って
ファイル読み取りを紛れ込ませることはできません。`awk` と `sed` は常にセーフビンとして拒否されます
（それらの意味論を stdin のみに検証できないため）。`jq` はオプトインできますが、OpenClaw はセーフビンモードでも
`env` 形式のフィルター（例: `jq env` や `jq -n env`）を拒否するため、`jq` は明示的な許可リストパスまたは
承認プロンプトなしでホストプロセス環境をダンプできません。

### 信頼済みバイナリディレクトリ

セーフビンは、信頼済みバイナリディレクトリ（システムデフォルトに加え、任意の
`tools.exec.safeBinTrustedDirs`）から解決される必要があります。`PATH` エントリは自動的に信頼されません。
デフォルトの信頼済みディレクトリは意図的に最小限です: `/bin`, `/usr/bin`。セーフビン実行ファイルが
パッケージマネージャー/ユーザーパス（例: `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`）に
ある場合は、それらを `tools.exec.safeBinTrustedDirs` に明示的に追加してください。

### シェル連結、ラッパー、マルチプレクサ

すべてのトップレベルセグメントが許可リストを満たす場合（セーフビンまたは Skills の自動許可を含む）、
シェル連結（`&&`, `||`, `;`）は許可されます。リダイレクトは許可リストモードでは引き続きサポートされません。
コマンド置換（`$()` / バッククォート）は、二重引用符内を含め、許可リスト解析中に拒否されます。
リテラルの `$()` テキストが必要な場合は一重引用符を使用してください。

macOS コンパニオンアプリの承認では、シェル制御または展開構文（`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`）を
含む生のシェルテキストは、シェルバイナリ自体が許可リストに登録されていない限り、許可リスト不一致として扱われます。

シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの env オーバーライドは
小さな明示的許可リスト（`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`）に削減されます。

許可リストモードでの `allow-always` 決定では、透過的なディスパッチラッパー
（例: `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`）は
ラッパーパスではなく内部実行ファイルパスを永続化します。シェルマルチプレクサ
（`busybox`, `toybox`）は、シェルアプレット（`sh`, `ash` など）について同じ方法でアンラップされます。
ラッパーまたはマルチプレクサを安全にアンラップできない場合、許可リストエントリは自動的に永続化されません。

`python3` や `node` のようなインタープリターを許可リストに登録する場合は、
インライン eval に引き続き明示的な承認が必要になるよう `tools.exec.strictInlineEval=true` を優先してください。
厳格モードでは、`allow-always` は安全なインタープリター/スクリプト呼び出しを引き続き永続化できますが、
インライン eval の運搬手段は自動的には永続化されません。

### セーフビンと許可リスト

| トピック            | `tools.exec.safeBins`                                  | 許可リスト（`exec-approvals.json`）                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目的             | 限定的な stdin フィルターを自動許可                        | 特定の実行ファイルを明示的に信頼                                              |
| 一致タイプ       | 実行ファイル名 + セーフビン argv ポリシー                 | 解決済み実行ファイルパスの glob、または PATH 経由で呼び出されたコマンド用の裸のコマンド名 glob |
| 引数スコープ   | セーフビンプロファイルとリテラルトークンルールで制限 | デフォルトはパス一致。任意の `argPattern` で解析済み argv を制限可能              |
| 典型例 | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, カスタム CLI                                     |
| 最適な用途         | パイプライン内の低リスクなテキスト変換                  | より広い挙動または副作用を持つ任意のツール                                     |

設定場所:

- `safeBins` は設定（`tools.exec.safeBins` またはエージェントごとの `agents.list[].tools.exec.safeBins`）から取得されます。
- `safeBinTrustedDirs` は設定（`tools.exec.safeBinTrustedDirs` またはエージェントごとの `agents.list[].tools.exec.safeBinTrustedDirs`）から取得されます。
- `safeBinProfiles` は設定（`tools.exec.safeBinProfiles` またはエージェントごとの `agents.list[].tools.exec.safeBinProfiles`）から取得されます。エージェントごとのプロファイルキーはグローバルキーを上書きします。
- 許可リストエントリは、ホストローカルの承認ファイル内の `agents.<id>.allowlist`（または Control UI / `openclaw approvals allowlist ...` 経由）にあります。
- `safeBins` にインタープリター/ランタイムのビンが明示的なプロファイルなしで含まれる場合、`openclaw security audit` は `tools.exec.safe_bins_interpreter_unprofiled` で警告します。
- `openclaw doctor --fix` は、不足しているカスタム `safeBinProfiles.<bin>` エントリを `{}` としてスキャフォールドできます（その後レビューして厳格化してください）。インタープリター/ランタイムのビンは自動スキャフォールドされません。

カスタムプロファイルの例:
__OC_I18N_900000__
## インタープリター/ランタイムコマンド

承認に基づくインタープリター/ランタイム実行は、意図的に保守的です:

- 正確な argv/cwd/env コンテキストが常にバインドされます。
- 直接のシェルスクリプト形式と直接のランタイムファイル形式は、ベストエフォートで 1 つの具体的なローカルファイルスナップショットにバインドされます。
- それでも 1 つの直接ローカルファイルに解決される一般的なパッケージマネージャーラッパー形式（例:
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`）は、バインド前にアンラップされます。
- OpenClaw がインタープリター/ランタイムコマンドについて 1 つの具体的なローカルファイルを正確に識別できない場合
  （例: パッケージスクリプト、eval 形式、ランタイム固有のローダーチェーン、または曖昧な複数ファイル形式）、
  承認に基づく実行は、実際には持たない意味的カバレッジを主張する代わりに拒否されます。
- それらのワークフローでは、サンドボックス化、別のホスト境界、またはオペレーターがより広いランタイム意味論を受け入れる
  明示的な信頼済み許可リスト/完全ワークフローを優先してください。

承認が必要な場合、exec ツールは承認 ID とともに即座に返ります。その ID を使用して、後続の承認済み実行システムイベント
（`Exec finished`、および設定されている場合は `Exec running`）を関連付けてください。
タイムアウト前に決定が届かない場合、リクエストは承認タイムアウトとして扱われ、
端末的なホストコマンド拒否として表示されます。発信元セッションを持つメインエージェントの非同期承認では、
OpenClaw は内部フォローアップでそのセッションも再開するため、エージェントは後から不足した結果を修復するのではなく、
コマンドが実行されなかったことを観測できます。保留中の exec 承認はデフォルトで 30 分後に期限切れになります。

### フォローアップ配信の挙動

承認された非同期 exec が完了すると、OpenClaw は同じセッションにフォローアップの `agent` ターンを送信します。
拒否された非同期承認は、拒否ステータスについて同じメインセッションのフォローアップ経路を使用しますが、
昇格されたランタイムハンドオフを登録せず、コマンドも実行しません。再開可能なメインセッションがない拒否は、
抑制されるか、安全な直接経路が存在する場合はそれを通じて報告されます。

- 有効な外部配信ターゲット（配信可能なチャネルとターゲット `to`）が存在する場合、フォローアップ配信はそのチャネルを使用します。
- 外部ターゲットのない webchat のみ、または内部セッションのフローでは、フォローアップ配信はセッションのみ（`deliver: false`）に留まります。
- 呼び出し元が解決可能な外部チャネルなしで厳格な外部配信を明示的に要求した場合、リクエストは `INVALID_REQUEST` で失敗します。
- `bestEffortDeliver` が有効で外部チャネルを解決できない場合、配信は失敗する代わりにセッションのみへダウングレードされます。

## チャットチャネルへの承認転送

exec 承認プロンプトは任意のチャットチャネル（Plugin チャネルを含む）に転送でき、
`/approve` で承認できます。これは通常のアウトバウンド配信パイプラインを使用します。

設定:
__OC_I18N_900001__
チャットで返信:
__OC_I18N_900002__
`/approve` コマンドは exec 承認と Plugin 承認の両方を扱います。ID が保留中の exec 承認に一致しない場合、
自動的に Plugin 承認を代わりに確認します。このフォールバックは「承認が見つからない」失敗に限定されます。
実際の exec 承認の拒否/エラーが、黙って Plugin 承認として再試行されることはありません。

### Plugin 承認の転送

Plugin 承認の転送は exec 承認と同じ配信パイプラインを使用しますが、
`approvals.plugin` の下に独立した設定を持ちます。一方を有効化または無効化しても、もう一方には影響しません。
Plugin オーサリングの挙動、リクエストフィールド、決定の意味論については、
[Plugin 権限リクエスト](/plugins/plugin-permission-requests)を参照してください。
__OC_I18N_900003__
設定の形状は `approvals.exec` と同一です。`enabled`, `mode`, `agentFilter`,
`sessionFilter`, `targets` は同じように機能します。

共有インタラクティブ返信をサポートするチャネルは、exec と Plugin の両方の承認に同じ承認ボタンをレンダリングします。
共有インタラクティブ UI のないチャネルは、`/approve` 手順付きのプレーンテキストにフォールバックします。
Plugin 承認リクエストは、利用可能な決定を制限する場合があります。承認サーフェスはリクエストで宣言された決定セットを使用し、
Gateway は提示されなかった決定を送信しようとする試みを拒否します。

### 任意のチャネルでの同一チャット承認

exec または Plugin の承認リクエストが成果物を届けるチャットサーフェスから発生した場合、既定では同じチャットで `/approve` により承認できます。これは既存の Web UI と端末 UI のフローに加えて、Slack、Matrix、Microsoft Teams、および同様の成果物配信チャットに適用され、その会話の通常のチャネル認証モデルを使用します。発信元チャットがすでにコマンドを送信して返信を受け取れる場合、承認リクエストを保留状態にしておくだけのために、別個のネイティブ配信アダプターは不要になります。

Discord、Telegram、QQ bot も同一チャットの `/approve` をサポートしますが、これらのチャネルではネイティブ承認配信が無効な場合でも、認可には引き続き解決済みの承認者リストを使用します。

### ネイティブ承認配信

一部のチャネルはネイティブ承認クライアントとしても機能できます: Discord、Slack、Telegram、Matrix、QQ bot です。ネイティブクライアントは、共有の同一チャット `/approve` フローの上に、承認者 DM、発信元チャットへのファンアウト、チャネル固有の対話型承認 UX を追加します。

ネイティブ承認カード/ボタンが利用可能な場合、そのネイティブ UI がエージェント向けの主要な経路です。ツール結果がチャット承認を利用できない、または手動承認だけが残された経路であると示していない限り、エージェントは重複するプレーンなチャット `/approve` コマンドもエコーすべきではありません。

ネイティブ承認クライアントが設定されているものの、発信元チャネルでネイティブランタイムが有効でない場合、OpenClaw はローカルの決定的な `/approve` プロンプトを表示したままにします。ネイティブランタイムが有効で配信を試行したものの、どのターゲットにもカードが届かない場合、OpenClaw は同一チャットのフォールバック通知を送信し、リクエストを引き続き解決できるように正確な `/approve <id> <decision>` コマンドを含めます。

汎用モデル:

- ホストの exec ポリシーが、exec 承認が必要かどうかを引き続き決定する
- `approvals.exec` は、承認プロンプトを他のチャット宛先へ転送するかを制御する
- `channels.<channel>.execApprovals` は、Discord、Slack、Telegram、QQ bot、および同様のチャネル固有ネイティブクライアントを有効にするかを制御する
- Slack Plugin 承認は、リクエストが Slack から来ていて Slack Plugin 承認者が解決される場合に、Slack のネイティブ承認クライアントを使用できる。`approvals.plugin` は Slack exec 承認が無効な場合でも、Plugin 承認を Slack セッションまたはターゲットにルーティングできる
- Google Chat のネイティブ承認カードは、安定した `users/<id>` 承認者が `dm.allowFrom` または `defaultTo` から解決される場合、Google Chat のスペースまたはスレッドから発生した exec および Plugin 承認を扱う。決定にリアクションイベントは使用しない
- WhatsApp と Signal のリアクション承認配信は `approvals.exec` と `approvals.plugin` でゲートされる。`channels.<channel>.execApprovals` ブロックはない

ネイティブ承認クライアントは、以下がすべて true の場合、DM 優先配信を自動で有効化します:

- チャネルがネイティブ承認配信をサポートしている
- 明示的な `execApprovals.approvers` または `commands.ownerAllowFrom` などの所有者 ID から承認者を解決できる
- `channels.<channel>.execApprovals.enabled` が未設定、または `"auto"`

ネイティブ承認クライアントを明示的に無効化するには `enabled: false` を設定します。承認者が解決される場合に強制的に有効化するには `enabled: true` を設定します。公開の発信元チャット配信は、`channels.<channel>.execApprovals.target` を通じて明示的なままです。ネイティブの `target` が発信元チャット配信を有効にすると、承認プロンプトにはコマンドテキストが含まれます。

FAQ: [チャット承認に exec 承認設定が 2 つあるのはなぜですか?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- QQ bot: `channels.qqbot.execApprovals.*`
- Google Chat: `channels.googlechat.dm.allowFrom` または `channels.googlechat.defaultTo` で安定した承認者を設定する。`execApprovals` ブロックは不要
- WhatsApp: 承認プロンプトを WhatsApp にルーティングするには `approvals.exec` と `approvals.plugin` を使用する
- Signal: 承認プロンプトを Signal にルーティングするには `approvals.exec` と `approvals.plugin` を使用する

ネイティブクライアント固有のルーティング:

- Telegram は既定で承認者 DM (`target: "dm"`) に送ります。発信元の Telegram チャット/トピックにも承認プロンプトを表示するには、`channel` または `both` に切り替えます。Telegram のフォーラムトピックでは、OpenClaw は承認プロンプトと承認後のフォローアップにトピックを保持します。
- Discord と Telegram の承認者は、明示的 (`execApprovals.approvers`) に設定するか、`commands.ownerAllowFrom` から推論できます。解決済みの承認者だけが承認または拒否できます。
- Slack の承認者は、明示的 (`execApprovals.approvers`) に設定するか、`commands.ownerAllowFrom` から推論できます。Slack Plugin 承認 DM は、Slack exec 承認者ではなく、`allowFrom` とアカウントの既定ルーティングから得られる Slack Plugin 承認者を使用します。Slack のネイティブボタンは承認 ID の種類を保持するため、`plugin:` ID は 2 つ目の Slack ローカルフォールバック層なしで Plugin 承認を解決できます。
- Google Chat のネイティブカードは、メッセージテキスト内に手動 `/approve` フォールバックを保持しますが、カードボタンのコールバックは不透明なアクショントークンだけを運びます。承認 ID と決定は、サーバー側の保留状態から復元されます。
- WhatsApp 絵文字承認は、一致するトップレベル転送ファミリーが有効で WhatsApp にルーティングされる場合にのみ、exec と Plugin の両方のプロンプトを扱います。ターゲットのみの WhatsApp 転送は、同じネイティブ発信元ターゲットに一致しない限り、共有転送経路に留まります。
- Signal リアクション承認は、一致するトップレベル転送ファミリーが有効で Signal にルーティングされる場合にのみ、exec と Plugin の両方のプロンプトを扱います。直接の同一チャット Signal exec 承認は、明示的な承認者なしでローカル `/approve` フォールバックを抑制できます。Signal リアクション解決には、引き続き `channels.signal.allowFrom` または `defaultTo` からの明示的な Signal 承認者が必要です。
- Matrix のネイティブ DM/チャネルルーティングとリアクションショートカットは、exec と Plugin の両方の承認を扱います。Plugin 認可は引き続き `channels.matrix.dm.allowFrom` から得られます。Matrix ネイティブプロンプトは、最初のプロンプトイベントに `com.openclaw.approval` カスタムイベント内容を含めるため、OpenClaw 対応 Matrix クライアントは構造化された承認状態を読み取れ、標準クライアントはプレーンテキストの `/approve` フォールバックを維持できます。
- ネイティブ Discord 承認ボタンは、承認 ID の種類でルーティングします。`plugin:` ID は Plugin 承認へ直接進み、それ以外はすべて exec 承認へ進みます。ネイティブ Telegram 承認ボタンは、`/approve` と同じ範囲限定の exec から Plugin へのフォールバックに従います。
- リクエスト者が承認者である必要はありません。
- リクエストを受け付けられるオペレーター UI または設定済み承認クライアントがない場合、プロンプトは `askFallback` にフォールバックします。

`/diagnostics` や `/export-trajectory` などの機密性の高い所有者専用グループコマンドは、承認プロンプトと最終結果にプライベートな所有者ルーティングを使用します。OpenClaw はまず、所有者がコマンドを実行した同じサーフェス上のプライベートルートを試します。そのサーフェスにプライベート所有者ルートがない場合、`commands.ownerAllowFrom` から利用可能な最初の所有者ルートへフォールバックします。そのため、Telegram が設定済みの主要なプライベートインターフェイスであれば、Discord グループコマンドでも承認と結果を所有者の Telegram DM に送信できます。グループチャットには短い確認応答だけが届きます。

関連:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ bot](/channels/qqbot)

### macOS IPC フロー
__OC_I18N_900004__
セキュリティメモ:

- Unix ソケットモード `0600`、トークンは `exec-approvals.json` に保存。
- 同一 UID ピアチェック。
- チャレンジ/レスポンス (nonce + HMAC token + request hash) + 短い TTL。

## FAQ

### 承認ターゲットで `accountId` と `threadId` はいつ使用されますか?

チャネルに複数の設定済み ID があり、承認プロンプトを特定の 1 つのアカウントから送信する必要がある場合は `accountId` を使用します。宛先がトピックまたはスレッドをサポートし、プロンプトをトップレベルチャットではなくそのスレッド内に留める必要がある場合は `threadId` を使用します。

具体的な Telegram の例として、フォーラムトピックを持つ運用スーパグループと 2 つの Telegram ボットアカウントがあります。`to` 値はスーパグループを指定し、`accountId` はボットアカウントを選択し、`threadId` はフォーラムトピックを選択します:
__OC_I18N_900005__
この設定では、転送された exec 承認は `ops-bot` Telegram アカウントにより、チャット `-1001234567890` のトピック `77` に投稿されます。`accountId` のないターゲットはチャネルの既定アカウントを使用し、`threadId` のないターゲットはトップレベル宛先に投稿します。

### 承認がセッションに送信された場合、そのセッション内の誰でも承認できますか?

いいえ。セッション配信はプロンプトが表示される場所だけを制御します。それ自体によって、そのチャット内のすべての参加者が承認できるようになるわけではありません。

汎用の同一チャット `/approve` では、送信者がそのチャネルセッションでコマンドの認可をすでに受けている必要があります。チャネルが明示的な承認者を公開している場合、それらの承認者はそのセッションで他のコマンド認可を受けていなくても `/approve` アクションを認可できます。

一部のチャネルはより厳格です。Discord、Telegram、Matrix、Slack ネイティブ承認 DM、および同様のネイティブ承認クライアントは、承認認可に解決済みの承認者リストを使用します。たとえば、Telegram フォーラムトピックの承認プロンプトはトピック内の全員に見えても、`channels.telegram.execApprovals.approvers` または `commands.ownerAllowFrom` から解決された数値の Telegram ユーザー ID だけが承認または拒否できます。

## 関連

- [Exec 承認](/ja-JP/tools/exec-approvals) — コアポリシーと承認フロー
- [Exec ツール](/ja-JP/tools/exec)
- [昇格モード](/ja-JP/tools/elevated)
- [Skills](/ja-JP/tools/skills) — skill-backed auto-allow 動作
