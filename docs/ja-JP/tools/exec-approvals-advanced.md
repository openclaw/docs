---
read_when:
    - セーフビンまたはカスタムセーフビンプロファイルの設定
    - Slack/Discord/Telegram またはその他のチャットチャンネルに承認を転送する
    - チャネル向けのネイティブ承認クライアントの実装
summary: '高度な exec 承認: 安全なバイナリ、インタープリターのバインディング、承認の転送、ネイティブ配信'
title: 実行承認 — 高度
x-i18n:
    generated_at: "2026-05-07T01:54:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d876efbfa34ef951b47cbfec9cc6a6a69a69f5b84365165d423d251163373040
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

高度な exec 承認トピック: `safeBins` 高速パス、インタープリター/ランタイムのバインド、およびチャットチャネルへの承認転送（ネイティブ配信を含む）。中核ポリシーと承認フローについては、[Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

## Safe bins（stdin のみ）

`tools.exec.safeBins` は、明示的な許可リスト項目**なしで**許可リストモードで実行できる、少数の **stdin のみ**のバイナリ（例: `cut`）を定義します。Safe bins は位置指定のファイル引数とパス風のトークンを拒否するため、入力ストリームに対してのみ動作できます。これは汎用的な信頼リストではなく、ストリームフィルター向けの限定的な高速パスとして扱ってください。

<Warning>
インタープリターまたはランタイムのバイナリ（例: `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）を `safeBins` に追加しないでください。コマンドがコードを評価したり、サブコマンドを実行したり、設計上ファイルを読み取ったりできる場合は、明示的な許可リスト項目を優先し、承認プロンプトを有効なままにしてください。カスタム safe bins では、`tools.exec.safeBinProfiles.<bin>` に明示的なプロファイルを定義する必要があります。
</Warning>

既定の safe bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` と `sort` は既定のリストに含まれていません。オプトインする場合は、stdin 以外のワークフローについて明示的な許可リスト項目を維持してください。safe-bin モードの `grep` では、`-e`/`--regexp` でパターンを指定してください。位置指定のパターン形式は拒否されるため、ファイルオペランドを曖昧な位置引数として紛れ込ませることはできません。

### Argv 検証と拒否されるフラグ

検証は argv の形状のみから決定的に行われます（ホストファイルシステムの存在チェックは行いません）。これにより、許可/拒否の差異がファイル存在のオラクルとして機能することを防ぎます。既定の safe bins では、ファイル指向のオプションは拒否されます。ロングオプションはフェイルクローズで検証されます（未知のフラグや曖昧な省略形は拒否されます）。

safe-bin プロファイル別の拒否フラグ:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins は、stdin のみのセグメントについて、実行時に argv トークンを**リテラルテキスト**として扱うことも強制します（グロブ展開も `$VARS` 展開もありません）。そのため、`*` や `$HOME/...` のようなパターンを使ってファイル読み取りを紛れ込ませることはできません。

### 信頼されたバイナリディレクトリ

Safe bins は信頼されたバイナリディレクトリ（システム既定値に加えて任意の `tools.exec.safeBinTrustedDirs`）から解決される必要があります。`PATH` 項目が自動的に信頼されることはありません。既定の信頼済みディレクトリは意図的に最小限です: `/bin`、`/usr/bin`。safe-bin 実行ファイルがパッケージマネージャー/ユーザーパス（例: `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`）にある場合は、`tools.exec.safeBinTrustedDirs` に明示的に追加してください。

### シェル連結、ラッパー、マルチプレクサー

シェル連結（`&&`、`||`、`;`）は、すべてのトップレベルセグメントが許可リスト（safe bins または Skills 自動許可を含む）を満たす場合に許可されます。リダイレクトは許可リストモードでは引き続きサポートされません。コマンド置換（`$()` / バッククォート）は、二重引用符内を含め、許可リスト解析中に拒否されます。リテラルの `$()` テキストが必要な場合は単一引用符を使用してください。

macOS コンパニオンアプリの承認では、シェル制御または展開構文（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）を含む生のシェルテキストは、シェルバイナリ自体が許可リストに登録されていない限り、許可リスト不一致として扱われます。

シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの env オーバーライドは小さな明示的な許可リスト（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に削減されます。

許可リストモードでの `allow-always` 決定では、既知のディスパッチラッパー（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）はラッパーパスではなく内部の実行ファイルパスを永続化します。シェルマルチプレクサー（`busybox`、`toybox`）も、シェルアプレット（`sh`、`ash` など）について同じ方法でアンラップされます。ラッパーまたはマルチプレクサーを安全にアンラップできない場合、許可リスト項目は自動的には永続化されません。

`python3` や `node` のようなインタープリターを許可リストに登録する場合は、`tools.exec.strictInlineEval=true` を優先してください。これにより、インライン評価では引き続き明示的な承認が必要になります。strict モードでは、`allow-always` は無害なインタープリター/スクリプト呼び出しを引き続き永続化できますが、インライン評価キャリアは自動的には永続化されません。

### Safe bins と許可リストの比較

| トピック            | `tools.exec.safeBins`                                  | 許可リスト（`exec-approvals.json`）                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目的             | 限定的な stdin フィルターを自動許可                        | 特定の実行ファイルを明示的に信頼                                              |
| 一致タイプ       | 実行ファイル名 + safe-bin argv ポリシー                 | 解決済み実行ファイルパスの glob、または PATH 経由で呼び出されたコマンド向けの裸のコマンド名 glob |
| 引数スコープ   | safe-bin プロファイルとリテラルトークン規則で制限 | 既定ではパス一致。任意の `argPattern` で解析済み argv を制限可能              |
| 典型例 | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, カスタム CLI                                     |
| 最適な用途         | パイプライン内の低リスクなテキスト変換                  | より広範な動作または副作用を持つ任意のツール                                     |

設定場所:

- `safeBins` は設定（`tools.exec.safeBins` またはエージェントごとの `agents.list[].tools.exec.safeBins`）から取得されます。
- `safeBinTrustedDirs` は設定（`tools.exec.safeBinTrustedDirs` またはエージェントごとの `agents.list[].tools.exec.safeBinTrustedDirs`）から取得されます。
- `safeBinProfiles` は設定（`tools.exec.safeBinProfiles` またはエージェントごとの `agents.list[].tools.exec.safeBinProfiles`）から取得されます。エージェントごとのプロファイルキーはグローバルキーを上書きします。
- 許可リスト項目は、ホストローカルの `~/.openclaw/exec-approvals.json` の `agents.<id>.allowlist` 配下（または Control UI / `openclaw approvals allowlist ...` 経由）にあります。
- `openclaw security audit` は、インタープリター/ランタイムの bin が明示的なプロファイルなしで `safeBins` に現れた場合、`tools.exec.safe_bins_interpreter_unprofiled` で警告します。
- `openclaw doctor --fix` は、不足しているカスタム `safeBinProfiles.<bin>` 項目を `{}` として足場生成できます（その後レビューして絞り込んでください）。インタープリター/ランタイムの bin は自動足場生成されません。

カスタムプロファイルの例:
__OC_I18N_900000__
`jq` を `safeBins` に明示的にオプトインしても、OpenClaw は safe-bin モードで `env` ビルトインを拒否するため、`jq -n env` が明示的な許可リストパスまたは承認プロンプトなしでホストプロセス環境をダンプすることはできません。

## インタープリター/ランタイムコマンド

承認に基づくインタープリター/ランタイムの実行は、意図的に保守的です。

- 正確な argv/cwd/env コンテキストが常にバインドされます。
- 直接のシェルスクリプト形式と直接のランタイムファイル形式は、ベストエフォートで 1 つの具体的なローカルファイルスナップショットにバインドされます。
- それでも 1 つの直接的なローカルファイルに解決される一般的なパッケージマネージャーラッパー形式（例: `pnpm exec`、`pnpm node`、`npm exec`、`npx`）は、バインド前にアンラップされます。
- OpenClaw がインタープリター/ランタイムコマンドについて、具体的なローカルファイルを正確に 1 つ識別できない場合（例: パッケージスクリプト、eval 形式、ランタイム固有のローダーチェーン、曖昧な複数ファイル形式）、実際には持たない意味的カバレッジを主張する代わりに、承認に基づく実行は拒否されます。
- これらのワークフローでは、サンドボックス化、別のホスト境界、またはオペレーターがより広範なランタイムセマンティクスを受け入れる明示的に信頼された許可リスト/完全なワークフローを優先してください。

承認が必要な場合、exec ツールは承認 ID とともに即座に返ります。その ID を使って、後続のシステムイベント（`Exec finished` / `Exec denied`）を関連付けてください。タイムアウト前に決定が届かない場合、そのリクエストは承認タイムアウトとして扱われ、拒否理由として表示されます。

### フォローアップ配信の動作

承認された非同期 exec が完了すると、OpenClaw は同じセッションにフォローアップの `agent` ターンを送信します。

- 有効な外部配信先が存在する場合（配信可能なチャネルとターゲット `to`）、フォローアップ配信はそのチャネルを使用します。
- 外部ターゲットがない webchat のみ、または内部セッションのフローでは、フォローアップ配信はセッション内のみに留まります（`deliver: false`）。
- 呼び出し元が解決可能な外部チャネルなしで厳密な外部配信を明示的に要求した場合、リクエストは `INVALID_REQUEST` で失敗します。
- `bestEffortDeliver` が有効で、外部チャネルを解決できない場合、失敗する代わりに配信はセッション内のみにダウングレードされます。

## チャットチャネルへの承認転送

exec 承認プロンプトは、任意のチャットチャネル（Plugin チャネルを含む）に転送し、`/approve` で承認できます。これは通常のアウトバウンド配信パイプラインを使用します。

設定:
__OC_I18N_900001__
チャットで返信:
__OC_I18N_900002__
`/approve` コマンドは exec 承認と Plugin 承認の両方を処理します。ID が保留中の exec 承認に一致しない場合、自動的に代わりに Plugin 承認を確認します。

### Plugin 承認の転送

Plugin 承認の転送は exec 承認と同じ配信パイプラインを使用しますが、`approvals.plugin` 配下に独立した専用設定があります。一方を有効または無効にしても、もう一方には影響しません。
__OC_I18N_900003__
設定の形状は `approvals.exec` と同一です: `enabled`、`mode`、`agentFilter`、`sessionFilter`、`targets` は同じように機能します。

共有インタラクティブ返信をサポートするチャネルは、exec と Plugin の両方の承認について同じ承認ボタンをレンダリングします。共有インタラクティブ UI のないチャネルでは、`/approve` 手順を含むプレーンテキストにフォールバックします。
Plugin 承認リクエストは、利用可能な決定を制限する場合があります。承認サーフェスはリクエストで宣言された決定セットを使用し、Gateway は提示されなかった決定の送信試行を拒否します。

### 任意のチャネルでの同一チャット承認

exec または Plugin の承認リクエストが配信可能なチャットサーフェスから発生した場合、同じチャットで既定により `/approve` を使って承認できるようになりました。これは既存の Web UI とターミナル UI のフローに加えて、Slack、Matrix、Microsoft Teams などのチャネルにも適用されます。

この共有テキストコマンドパスは、その会話の通常のチャネル認証モデルを使用します。発生元のチャットがすでにコマンドを送信し返信を受信できる場合、承認リクエストを保留状態に保つためだけに別個のネイティブ配信アダプターは不要になりました。

Discord と Telegram も同一チャットの `/approve` をサポートしますが、これらのチャネルではネイティブ承認配信が無効な場合でも、認可には引き続き解決済みの承認者リストを使用します。

Telegram および Gateway を直接呼び出すその他のネイティブ承認クライアントでは、このフォールバックは意図的に「承認が見つからない」失敗に限定されています。実際の exec 承認の拒否/エラーが、Plugin 承認として暗黙に再試行されることはありません。

### ネイティブ承認配信

一部のチャネルは、ネイティブ承認クライアントとしても動作できます。ネイティブクライアントは、共有の同一チャット `/approve`
フローの上に、承認者へのDM、元チャットへのファンアウト、チャネル固有のインタラクティブな承認UXを追加します。

ネイティブ承認カード/ボタンが利用可能な場合、そのネイティブUIが主な
エージェント向け経路です。ツール結果でチャット承認が利用できない、または
手動承認が唯一残された経路であると示されていない限り、エージェントは重複するプレーンチャットの
`/approve` コマンドを追加でエコーすべきではありません。

ネイティブ承認クライアントが設定されているものの、発信元チャネルでネイティブランタイムが有効でない場合、
OpenClaw はローカルの決定的な `/approve`
プロンプトを表示したままにします。ネイティブランタイムが有効で配信を試みたものの、
どのターゲットもカードを受信しない場合、OpenClaw は同一チャットのフォールバック通知で
正確な `/approve <id> <decision>` コマンドを送信し、リクエストを引き続き解決できるようにします。

汎用モデル:

- ホストのexecポリシーは、exec承認が必要かどうかを引き続き決定する
- `approvals.exec` は、承認プロンプトを他のチャット宛先へ転送するかどうかを制御する
- `channels.<channel>.execApprovals` は、そのチャネルがネイティブ承認クライアントとして動作するかどうかを制御する

ネイティブ承認クライアントは、次のすべてがtrueの場合にDM優先配信を自動的に有効化します:

- チャネルがネイティブ承認配信をサポートしている
- 承認者を明示的な `execApprovals.approvers` または `commands.ownerAllowFrom`
  などの所有者IDから解決できる
- `channels.<channel>.execApprovals.enabled` が未設定、または `"auto"` である

ネイティブ承認クライアントを明示的に無効化するには `enabled: false` を設定します。承認者を解決できる場合に強制的に
有効化するには `enabled: true` を設定します。公開の元チャット配信は
`channels.<channel>.execApprovals.target` を通じて明示的なままです。

FAQ: [チャット承認にexec承認設定が2つあるのはなぜですか？](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

これらのネイティブ承認クライアントは、共有の同一チャット `/approve` フローと共有承認ボタンの上に、
DMルーティングと任意のチャネルファンアウトを追加します。

共有動作:

- Slack、Matrix、Microsoft Teams、および類似の配信可能なチャットは、同一チャットの `/approve` に通常のチャネル認証モデルを使用する
- ネイティブ承認クライアントが自動有効化されると、デフォルトのネイティブ配信ターゲットは承認者DMになる
- Discord と Telegram では、解決済みの承認者だけが承認または拒否できる
- Discord 承認者は明示的に指定する（`execApprovals.approvers`）か、`commands.ownerAllowFrom` から推論できる
- Telegram 承認者は明示的に指定する（`execApprovals.approvers`）か、`commands.ownerAllowFrom` から推論できる
- Slack 承認者は明示的に指定する（`execApprovals.approvers`）か、`commands.ownerAllowFrom` から推論できる
- Slack のネイティブボタンは承認IDの種類を保持するため、`plugin:` ID は2つ目のSlackローカルのフォールバック層なしでPlugin承認を解決できる
- Matrix のネイティブDM/チャネルルーティングとリアクションショートカットはexec承認とPlugin承認の両方を処理する。
  Plugin認可は引き続き `channels.matrix.dm.allowFrom` から取得される
- Matrix のネイティブプロンプトは最初のプロンプトイベントに `com.openclaw.approval` カスタムイベントコンテンツを含めるため、
  OpenClaw対応のMatrixクライアントは構造化された承認状態を読み取ることができ、標準クライアントは
  プレーンテキストの `/approve` フォールバックを維持する
- リクエスト元が承認者である必要はない
- 発信元チャットがすでにコマンドと返信をサポートしている場合、そのチャットは `/approve` で直接承認できる
- ネイティブDiscord承認ボタンは承認IDの種類でルーティングする: `plugin:` ID は
  直接Plugin承認へ進み、それ以外はexec承認へ進む
- ネイティブTelegram承認ボタンは `/approve` と同じ、境界付けられたexecからPluginへのフォールバックに従う
- ネイティブの `target` が元チャット配信を有効にしている場合、承認プロンプトにはコマンドテキストが含まれる
- 保留中のexec承認はデフォルトで30分後に期限切れになる
- リクエストを受け付けられるオペレーターUIまたは設定済み承認クライアントがない場合、プロンプトは `askFallback` にフォールバックする

`/diagnostics` や `/export-trajectory` などの機密性の高い所有者専用グループコマンドは、承認プロンプトと最終結果にプライベートな
所有者ルーティングを使用します。OpenClaw はまず、所有者がコマンドを実行した同じサーフェス上のプライベート経路を試行します。
そのサーフェスにプライベート所有者経路がない場合、`commands.ownerAllowFrom` から利用可能な最初の所有者経路に
フォールバックするため、Telegram が設定済みのプライマリプライベートインターフェイスである場合でも、Discord グループコマンドは
承認と結果を所有者のTelegram DMへ送信できます。グループチャットには短い確認応答だけが送られます。

Telegram はデフォルトで承認者DM（`target: "dm"`）を使用します。承認プロンプトを発信元のTelegramチャット/トピックにも表示したい場合は、
`channel` または `both` に切り替えられます。Telegramフォーラムトピックでは、OpenClaw は承認プロンプトと承認後のフォローアップのためにトピックを保持します。

参照:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPCフロー
__OC_I18N_900004__
セキュリティメモ:

- Unixソケットモード `0600`、トークンは `exec-approvals.json` に保存される。
- 同一UIDピアチェック。
- チャレンジ/レスポンス（nonce + HMAC token + request hash）+ 短いTTL。

## 関連

- [Exec承認](/ja-JP/tools/exec-approvals) — コアポリシーと承認フロー
- [Execツール](/ja-JP/tools/exec)
- [昇格モード](/ja-JP/tools/elevated)
- [Skills](/ja-JP/tools/skills) — skillに基づく自動許可動作
