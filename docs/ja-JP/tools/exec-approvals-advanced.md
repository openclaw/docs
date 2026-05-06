---
read_when:
    - セーフビンまたはカスタムセーフビンプロファイルの設定
    - 承認をSlack/Discord/Telegramまたはその他のチャットチャネルに転送する
    - チャネル向けネイティブ承認クライアントの実装
summary: '高度な exec 承認: 安全なバイナリ、インタープリターのバインディング、承認の転送、ネイティブ配信'
title: 実行承認 — 高度な設定
x-i18n:
    generated_at: "2026-05-06T05:20:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ffef41ccb6018c5d38e153d015e979d43a6fafbe37a4377c3fcb7c6f212186c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

exec 承認の高度なトピック: `safeBins` の高速パス、インタープリター/ランタイム
バインディング、チャットチャンネルへの承認転送（ネイティブ配信を含む）。
中核となるポリシーと承認フローについては、[exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

## 安全な bin（stdin のみ）

`tools.exec.safeBins` は、明示的な許可リスト
エントリ**なしで**許可リストモードで実行できる、**stdin のみ**のバイナリ（たとえば
`cut`）の小さなリストを定義します。安全な bin は位置指定のファイル引数とパスのようなトークンを拒否するため、
入力ストリームに対してのみ動作できます。これは汎用的な信頼リストではなく、
ストリームフィルター向けの狭い高速パスとして扱ってください。

<Warning>
インタープリターやランタイムのバイナリ（たとえば `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`）を `safeBins` に追加しないでください。コマンドがコードを評価したり、
サブコマンドを実行したり、設計上ファイルを読み取れたりする場合は、明示的な許可リストエントリを優先し、
承認プロンプトを有効にしたままにしてください。カスタムの安全な bin は、
`tools.exec.safeBinProfiles.<bin>` で明示的なプロファイルを定義する必要があります。
</Warning>

デフォルトの安全な bin:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` と `sort` はデフォルトリストに含まれていません。オプトインする場合は、それらの stdin 以外のワークフローに対して明示的な
許可リストエントリを維持してください。安全な bin モードの `grep` では、
パターンを `-e`/`--regexp` で指定してください。位置指定のパターン形式は拒否されるため、
ファイルオペランドを曖昧な位置指定として紛れ込ませることはできません。

### argv 検証と拒否されるフラグ

検証は argv の形状だけから決定的に行われます（ホストファイルシステムの存在確認は行いません）。
これにより、許可/拒否の差異からファイル存在オラクルの挙動が生じるのを防ぎます。
デフォルトの安全な bin ではファイル指向のオプションは拒否されます。long
オプションは fail-closed で検証されます（不明なフラグと曖昧な省略形は
拒否されます）。

安全な bin プロファイルごとに拒否されるフラグ:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全な bin は、stdin のみのセグメントについて、実行時に argv トークンを**リテラルテキスト**として扱うことも強制します
（glob 展開も `$VARS` 展開も行いません）。そのため、`*` や `$HOME/...` のようなパターンを使って
ファイル読み取りを紛れ込ませることはできません。

### 信頼されたバイナリディレクトリ

安全な bin は、信頼されたバイナリディレクトリ（システムデフォルトに加えて
任意の `tools.exec.safeBinTrustedDirs`）から解決される必要があります。`PATH` エントリが自動的に信頼されることはありません。
デフォルトの信頼済みディレクトリは意図的に最小限です: `/bin`, `/usr/bin`。安全な bin の実行可能ファイルが
パッケージマネージャー/ユーザーパス（たとえば
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`）にある場合は、
それらを `tools.exec.safeBinTrustedDirs` に明示的に追加してください。

### シェルチェーン、ラッパー、マルチプレクサー

シェルチェーン（`&&`, `||`, `;`）は、各トップレベルセグメントが
許可リスト（安全な bin または Skills 自動許可を含む）を満たしている場合に許可されます。リダイレクトは
許可リストモードでは引き続きサポートされません。コマンド置換（`$()` / バッククォート）は、
二重引用符の中も含めて、許可リスト解析中に拒否されます。リテラルの `$()` テキストが必要な場合は
単一引用符を使用してください。

macOS コンパニオンアプリの承認では、シェル制御または
展開構文（`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`）を含む生のシェルテキストは、
シェルバイナリ自体が許可リストに含まれていない限り、許可リストミスとして扱われます。

シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの env オーバーライドは
小さな明示的な許可リスト（`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`）に縮小されます。

許可リストモードでの `allow-always` 判断では、既知のディスパッチラッパー（`env`,
`nice`, `nohup`, `stdbuf`, `timeout`）について、ラッパーパスではなく内部の実行可能ファイルパスが保持されます。
シェルマルチプレクサー（`busybox`, `toybox`）は、シェルアプレット（`sh`, `ash` など）についても
同じ方法でアンラップされます。ラッパーやマルチプレクサーを安全にアンラップできない場合、
許可リストエントリは自動的には保持されません。

`python3` や `node` のようなインタープリターを許可リストに入れる場合は、
インライン eval に引き続き明示的な承認が必要になるように
`tools.exec.strictInlineEval=true` を推奨します。strict モードでは、`allow-always` は無害な
インタープリター/スクリプト呼び出しを保持できますが、インライン eval の搬送手段は
自動的には保持されません。

### 安全な bin と許可リスト

| トピック         | `tools.exec.safeBins`                                  | 許可リスト（`exec-approvals.json`）                                                |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目的             | 狭い stdin フィルターを自動許可                        | 特定の実行可能ファイルを明示的に信頼する                                           |
| マッチ種別       | 実行可能ファイル名 + 安全な bin の argv ポリシー       | 解決済み実行可能ファイルパスの glob、または PATH 経由で呼び出されたコマンド名の bare glob |
| 引数スコープ     | 安全な bin プロファイルとリテラルトークンルールで制限 | デフォルトではパスマッチ。任意の `argPattern` で解析済み argv を制限可能           |
| 典型例           | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, カスタム CLI                                     |
| 最適な用途       | パイプライン内の低リスクなテキスト変換                | より広い挙動や副作用を持つ任意のツール                                             |

設定場所:

- `safeBins` は設定（`tools.exec.safeBins` または agent ごとの `agents.list[].tools.exec.safeBins`）から取得されます。
- `safeBinTrustedDirs` は設定（`tools.exec.safeBinTrustedDirs` または agent ごとの `agents.list[].tools.exec.safeBinTrustedDirs`）から取得されます。
- `safeBinProfiles` は設定（`tools.exec.safeBinProfiles` または agent ごとの `agents.list[].tools.exec.safeBinProfiles`）から取得されます。agent ごとのプロファイルキーはグローバルキーを上書きします。
- 許可リストエントリは、ホストローカルの `~/.openclaw/exec-approvals.json` の `agents.<id>.allowlist`（または Control UI / `openclaw approvals allowlist ...` 経由）に保存されます。
- インタープリター/ランタイムの bin が明示的なプロファイルなしで `safeBins` に含まれている場合、`openclaw security audit` は `tools.exec.safe_bins_interpreter_unprofiled` で警告します。
- `openclaw doctor --fix` は、不足しているカスタム `safeBinProfiles.<bin>` エントリを `{}` としてひな形生成できます（後で確認して絞り込んでください）。インタープリター/ランタイムの bin は自動ひな形生成されません。

カスタムプロファイル例:
__OC_I18N_900000__
`jq` を `safeBins` に明示的にオプトインした場合でも、OpenClaw は安全な bin
モードで `env` ビルトインを拒否するため、`jq -n env` が明示的な許可リストパス
または承認プロンプトなしでホストプロセス環境をダンプすることはできません。

## インタープリター/ランタイムコマンド

承認に裏付けられたインタープリター/ランタイムの実行は、意図的に保守的です:

- 正確な argv/cwd/env コンテキストが常にバインドされます。
- 直接のシェルスクリプト形式と直接のランタイムファイル形式は、ベストエフォートで 1 つの具体的なローカル
  ファイルスナップショットにバインドされます。
- それでも 1 つの直接のローカルファイルに解決される一般的なパッケージマネージャーラッパー形式（たとえば
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`）は、バインド前にアンラップされます。
- OpenClaw がインタープリター/ランタイムコマンドについて、正確に 1 つの具体的なローカルファイルを識別できない場合
  （たとえばパッケージスクリプト、eval 形式、ランタイム固有のローダーチェーン、曖昧な複数ファイル
  形式）、承認に裏付けられた実行は、実際には持たない意味的なカバレッジを主張する代わりに拒否されます。
- それらのワークフローでは、サンドボックス化、別のホスト境界、またはオペレーターがより広いランタイムセマンティクスを受け入れる
  明示的に信頼された許可リスト/完全なワークフローを推奨します。

承認が必要な場合、exec ツールは承認 ID とともに即座に返ります。その ID を使って
後続のシステムイベント（`Exec finished` / `Exec denied`）を関連付けてください。タイムアウト前に
判断が届かない場合、そのリクエストは承認タイムアウトとして扱われ、拒否理由として表示されます。

### フォローアップ配信の挙動

承認された async exec が完了した後、OpenClaw は同じセッションにフォローアップの `agent` ターンを送信します。

- 有効な外部配信先が存在する場合（配信可能なチャンネルとターゲット `to`）、フォローアップ配信はそのチャンネルを使用します。
- 外部ターゲットのない webchat のみ、または内部セッションのフローでは、フォローアップ配信はセッション内のみ（`deliver: false`）に留まります。
- 呼び出し元が解決可能な外部チャンネルなしで厳密な外部配信を明示的に要求した場合、リクエストは `INVALID_REQUEST` で失敗します。
- `bestEffortDeliver` が有効で、外部チャンネルを解決できない場合、配信は失敗ではなくセッション内のみにダウングレードされます。

## チャットチャンネルへの承認転送

exec 承認プロンプトは任意のチャットチャンネル（Plugin チャンネルを含む）に転送し、
`/approve` で承認できます。これは通常のアウトバウンド配信パイプラインを使用します。

設定:
__OC_I18N_900001__
チャットで返信:
__OC_I18N_900002__
`/approve` コマンドは exec 承認と Plugin 承認の両方を処理します。ID が保留中の exec 承認と一致しない場合、
代わりに Plugin 承認を自動的に確認します。

### Plugin 承認転送

Plugin 承認転送は exec 承認と同じ配信パイプラインを使用しますが、
`approvals.plugin` の下に独立した設定を持ちます。一方を有効または無効にしても、もう一方には影響しません。
__OC_I18N_900003__
設定の形状は `approvals.exec` と同一です: `enabled`, `mode`, `agentFilter`,
`sessionFilter`, `targets` は同じように動作します。

共有インタラクティブ返信をサポートするチャンネルは、exec と
Plugin 承認の両方に同じ承認ボタンを表示します。共有インタラクティブ UI のないチャンネルは、`/approve`
手順を含むプレーンテキストにフォールバックします。

### 任意のチャンネルでの同一チャット承認

exec または Plugin の承認リクエストが配信可能なチャットサーフェスから発生した場合、同じチャットで
デフォルトで `/approve` により承認できます。これは既存の Web UI と端末 UI フローに加えて、
Slack、Matrix、Microsoft Teams などのチャンネルにも適用されます。

この共有テキストコマンドパスは、その会話の通常のチャンネル認証モデルを使用します。
発信元チャットがすでにコマンドを送信し、返信を受け取れる場合、承認リクエストが保留状態を維持するためだけに
別個のネイティブ配信アダプターを必要とすることはなくなります。

Discord と Telegram も同一チャットの `/approve` をサポートしますが、これらのチャンネルは
ネイティブ承認配信が無効な場合でも、認可には解決済みの承認者リストを引き続き使用します。

Telegram および Gateway を直接呼び出すその他のネイティブ承認クライアントでは、
このフォールバックは意図的に「承認が見つからない」失敗に限定されています。実際の
exec 承認の拒否/エラーが、Plugin 承認として暗黙に再試行されることはありません。

### ネイティブ承認配信

一部のチャンネルはネイティブ承認クライアントとしても機能できます。ネイティブクライアントは、共有の同一チャット `/approve`
フローの上に、承認者への DM、発信元チャットへのファンアウト、チャンネル固有のインタラクティブ承認 UX を追加します。

ネイティブの承認カード/ボタンが利用できる場合、そのネイティブ UI がエージェント向けの主要な経路です。ツール結果がチャット承認を利用できない、または手動承認が唯一残された経路だと示していない限り、エージェントは重複するプレーンなチャットの `/approve` コマンドも反復表示すべきではありません。

ネイティブ承認クライアントが設定されているが、発信元チャネルでネイティブランタイムが有効でない場合、OpenClaw はローカルの決定論的な `/approve` プロンプトを表示したままにします。ネイティブランタイムが有効で配信を試みたものの、どのターゲットもカードを受け取らなかった場合、OpenClaw は同じチャットにフォールバック通知を送信し、リクエストを引き続き解決できるように正確な `/approve <id> <decision>` コマンドを含めます。

汎用モデル:

- ホストの exec ポリシーが、exec 承認が必要かどうかを引き続き決定する
- `approvals.exec` は、承認プロンプトを他のチャット宛先へ転送するかどうかを制御する
- `channels.<channel>.execApprovals` は、そのチャネルがネイティブ承認クライアントとして動作するかどうかを制御する

ネイティブ承認クライアントは、次のすべてが true の場合に DM 優先の配信を自動有効化します:

- チャネルがネイティブ承認配信をサポートしている
- 承認者を明示的な `execApprovals.approvers` または `commands.ownerAllowFrom` などの所有者
  ID から解決できる
- `channels.<channel>.execApprovals.enabled` が未設定、または `"auto"` である

ネイティブ承認クライアントを明示的に無効化するには、`enabled: false` を設定します。承認者を解決できる場合に強制的に有効化するには、`enabled: true` を設定します。公開の発信元チャット配信は、`channels.<channel>.execApprovals.target` を通じて引き続き明示的に設定します。

FAQ: [チャット承認に exec 承認設定が 2 つあるのはなぜですか?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

これらのネイティブ承認クライアントは、共有の同じチャットの `/approve` フローと共有の承認ボタンの上に、DM ルーティングと任意のチャネルファンアウトを追加します。

共有される動作:

- Slack、Matrix、Microsoft Teams、および同様の配信可能なチャットは、同じチャットの `/approve` に通常のチャネル認証モデルを使用する
- ネイティブ承認クライアントが自動有効化されると、デフォルトのネイティブ配信ターゲットは承認者の DM になる
- Discord と Telegram では、解決済みの承認者だけが承認または拒否できる
- Discord の承認者は明示的に指定することも (`execApprovals.approvers`)、`commands.ownerAllowFrom` から推論することもできる
- Telegram の承認者は明示的に指定することも (`execApprovals.approvers`)、`commands.ownerAllowFrom` から推論することもできる
- Slack の承認者は明示的に指定することも (`execApprovals.approvers`)、`commands.ownerAllowFrom` から推論することもできる
- Slack のネイティブボタンは承認 ID の種類を保持するため、`plugin:` ID は 2 つ目の Slack ローカルフォールバック層なしで Plugin 承認を解決できる
- Matrix のネイティブ DM/チャネルルーティングとリアクションショートカットは、exec 承認と Plugin 承認の両方を処理する。
  Plugin 認可は引き続き `channels.matrix.dm.allowFrom` から取得される
- Matrix のネイティブプロンプトは、最初のプロンプトイベントに `com.openclaw.approval` カスタムイベント内容を含めるため、OpenClaw 対応の Matrix クライアントは構造化された承認状態を読み取れ、標準クライアントはプレーンテキストの `/approve` フォールバックを保持する
- リクエスト元が承認者である必要はない
- 発信元チャットがすでにコマンドと返信をサポートしている場合、そのチャットは `/approve` で直接承認できる
- ネイティブ Discord 承認ボタンは承認 ID の種類でルーティングする: `plugin:` ID は
  直接 Plugin 承認へ、それ以外はすべて exec 承認へ送られる
- ネイティブ Telegram 承認ボタンは、`/approve` と同じ制限付きの exec から Plugin へのフォールバックに従う
- ネイティブの `target` が発信元チャット配信を有効にしている場合、承認プロンプトにはコマンドテキストが含まれる
- 保留中の exec 承認はデフォルトで 30 分後に期限切れになる
- オペレーター UI または設定済みの承認クライアントがリクエストを受け入れられない場合、プロンプトは `askFallback` にフォールバックする

`/diagnostics` や `/export-trajectory` などの機密性の高い所有者専用グループコマンドは、承認プロンプトと最終結果にプライベート所有者ルーティングを使用します。OpenClaw はまず、所有者がコマンドを実行したのと同じサーフェスでプライベートルートを試します。そのサーフェスにプライベート所有者ルートがない場合、`commands.ownerAllowFrom` から最初に利用可能な所有者ルートへフォールバックするため、Telegram が設定済みの主要なプライベートインターフェイスである場合でも、Discord グループコマンドは承認と結果を所有者の Telegram DM に送信できます。グループチャットには短い確認応答だけが届きます。

Telegram はデフォルトで承認者 DM (`target: "dm"`) を使用します。承認プロンプトを発信元の Telegram チャット/トピックにも表示したい場合は、`channel` または `both` に切り替えられます。Telegram フォーラムトピックでは、OpenClaw は承認プロンプトと承認後のフォローアップでトピックを保持します。

参照:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC フロー
__OC_I18N_900004__
セキュリティ上の注意:

- Unix ソケットモード `0600`、トークンは `exec-approvals.json` に保存されます。
- 同一 UID ピアチェック。
- チャレンジ/レスポンス (nonce + HMAC トークン + リクエストハッシュ) + 短い TTL。

## 関連

- [Exec 承認](/ja-JP/tools/exec-approvals) — コアポリシーと承認フロー
- [Exec ツール](/ja-JP/tools/exec)
- [昇格モード](/ja-JP/tools/elevated)
- [Skills](/ja-JP/tools/skills) — skill ベースの自動許可動作
