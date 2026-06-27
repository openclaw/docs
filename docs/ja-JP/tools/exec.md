---
read_when:
    - exec ツールの使用または変更
    - stdin または TTY 動作のデバッグ
summary: execツールの使用方法、stdinモード、TTYサポート
title: 実行ツール
x-i18n:
    generated_at: "2026-06-27T13:12:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

ワークスペースでシェルコマンドを実行します。`exec` は変更可能なシェルサーフェスです。コマンドは、選択されたホストまたはサンドボックスのファイルシステムで許可される場所ならどこでも、ファイルの作成、編集、削除ができます。`write`、`edit`、`apply_patch` などの OpenClaw ファイルシステムツールを無効にしても、`exec` が読み取り専用になるわけではありません。

`process` によるフォアグラウンド実行とバックグラウンド実行をサポートします。`process` が許可されていない場合、`exec` は同期的に実行され、`yieldMs`/`background` を無視します。
バックグラウンドセッションはエージェントごとにスコープされます。`process` は同じエージェントのセッションだけを参照します。

## パラメーター

<ParamField path="command" type="string" required>
実行するシェルコマンド。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
コマンドの作業ディレクトリ。
</ParamField>

<ParamField path="env" type="object">
継承された環境の上にマージされるキー/値の環境オーバーライド。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
この遅延（ミリ秒）の後、コマンドを自動的にバックグラウンド化します。
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` を待たずに、コマンドを即座にバックグラウンド化します。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
この呼び出しの設定済み exec タイムアウトを上書きします。コマンドを exec プロセスのタイムアウトなしで実行する必要がある場合にのみ、`timeout: 0` を設定してください。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
利用可能な場合、疑似ターミナルで実行します。TTY 専用 CLI、コーディングエージェント、ターミナル UI に使用します。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
実行場所。`auto` は、サンドボックスランタイムがアクティブな場合は `sandbox` に、それ以外の場合は `gateway` に解決されます。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
通常のツール呼び出しでは無視されます。`gateway` / `node` のセキュリティは
`tools.exec.security` とホスト承認ファイルによって制御されます。昇格モードでは、
オペレーターが明示的に昇格アクセスを許可した場合にのみ `security=full` を強制できます。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
ベースラインの確認モードは `tools.exec.ask` とホスト承認から取得されます。
チャネル由来のモデル呼び出しでは、有効なホスト確認が `off` の場合、呼び出しごとの `ask` は無視されます。それ以外の場合は、より厳格なモードに強化することだけができます。明示的な `ask` 値で exec ツールを構築する信頼済みの内部/API 呼び出し元は変更されません。
</ParamField>

<ParamField path="node" type="string">
`host=node` の場合の Node ID/名前。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
昇格モードを要求します。サンドボックスを抜けて、設定済みホストパスへ移動します。昇格が `full` に解決される場合にのみ `security=full` が強制されます。
</ParamField>

注記:

- `host` のデフォルトは `auto` です。セッションでサンドボックスランタイムがアクティブな場合はサンドボックス、それ以外の場合は Gateway です。
- `host` は `auto`、`sandbox`、`gateway`、`node` のみを受け付けます。これはホスト名セレクターではありません。ホスト名のような値は、コマンド実行前に拒否されます。
- `auto` はデフォルトのルーティング戦略であり、ワイルドカードではありません。`auto` から呼び出しごとに `host=node` を指定できます。呼び出しごとの `host=gateway` は、サンドボックスランタイムがアクティブでない場合にのみ許可されます。
- `tools.exec.mode` は正規化されたポリシーノブです。値は `deny`、`allowlist`、`ask`、`auto`、`full` です。`auto` は、決定的な allowlist/safe-bin の一致を直接実行し、残りすべての exec 承認ケースを、人間に確認する前に OpenClaw のネイティブ自動レビュアーへルーティングします。`ask` / `ask=always` は引き続き毎回人間に確認します。
- 追加設定がなくても、`host=auto` はそのまま機能します。サンドボックスがない場合は `gateway` に解決され、ライブサンドボックスがある場合はサンドボックス内に留まります。
- `elevated` はサンドボックスを抜けて、設定済みホストパスへ移動します。デフォルトでは `gateway`、または `tools.exec.host=node`（またはセッションのデフォルトが `host=node`）の場合は `node` です。これは、現在のセッション/プロバイダーで昇格アクセスが有効な場合にのみ利用できます。
- `gateway`/`node` の承認はホスト承認ファイルによって制御されます。
- `node` にはペアリング済み Node（コンパニオンアプリまたはヘッドレス Node ホスト）が必要です。
- 複数の Node が利用可能な場合は、`exec.node` または `tools.exec.node` を設定して 1 つ選択します。
- `exec host=node` は Node の唯一のシェル実行パスです。レガシーの `nodes.run` ラッパーは削除されました。
- `timeout` は、フォアグラウンド、バックグラウンド、`yieldMs`、Gateway、サンドボックス、Node の `system.run` 実行に適用されます。省略した場合、OpenClaw は `tools.exec.timeoutSec` を使用します。明示的な `timeout: 0` は、その呼び出しの exec プロセスタイムアウトを無効にします。
- Windows 以外のホストでは、exec は設定されている場合 `SHELL` を使用します。`SHELL` が `fish` の場合は、fish 非互換スクリプトを避けるため `PATH` から `bash`（または `sh`）を優先し、どちらも存在しない場合は `SHELL` にフォールバックします。
- Windows ホストでは、exec は PowerShell 7（`pwsh`）の検出（Program Files、ProgramW6432、その後 PATH）を優先し、
  その後 Windows PowerShell 5.1 にフォールバックします。
- Windows 以外の Gateway ホストでは、bash と zsh の exec コマンドは起動スナップショットを使用します。OpenClaw は、シェル起動ファイルから source 可能なエイリアス/関数と小さな安全な環境セットを
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/` にキャプチャし、各 exec コマンドの前にそのスナップショットを source します。
  シークレットらしい変数は除外されます。サンドボックスと Node exec はこのスナップショットを使用しません。このスナップショットパスを無効にするには、Gateway プロセス環境で
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` を設定します。
- ホスト実行（`gateway`/`node`）は、バイナリハイジャックや注入コードを防ぐため、
  `env.PATH` とローダーオーバーライド（`LD_*`/`DYLD_*`）を拒否します。
- OpenClaw は、シェル/プロファイルルールが exec ツールのコンテキストを検出できるよう、生成されたコマンド環境（PTY とサンドボックス実行を含む）で `OPENCLAW_SHELL=exec` を設定します。
- チャネル由来の実行では、チャネルがそれらの ID を提供した場合、OpenClaw は狭い送信者/チャット ID JSON ペイロードも
  `OPENCLAW_CHANNEL_CONTEXT` で公開します。
- `openclaw channels login` は対話型のチャネル認証フローであるため、`exec` からはブロックされます。Gateway ホスト上のターミナルで実行するか、存在する場合はチャットからチャネルネイティブのログインツールを使用してください。
- 重要: サンドボックス化は**デフォルトでオフ**です。サンドボックス化がオフの場合、暗黙の `host=auto` は
  `gateway` に解決されます。明示的な `host=sandbox` は、Gateway ホストで黙って実行されるのではなく、引き続きクローズドに失敗します。サンドボックス化を有効にするか、承認付きで `host=gateway` を使用してください。
- スクリプトの事前チェック（一般的な Python/Node シェル構文ミス用）は、有効な `workdir` 境界内のファイルだけを検査します。スクリプトパスが `workdir` の外に解決される場合、そのファイルの事前チェックはスキップされます。
- いま開始する長時間実行の作業では、一度だけ開始し、有効になっていてコマンドが出力を発するか失敗したときの自動完了ウェイクに依存してください。
  ログ、ステータス、入力、介入には `process` を使用してください。sleep ループ、timeout ループ、反復ポーリングでスケジューリングを模倣しないでください。
- 後で発生すべき作業やスケジュール上の作業には、`exec` の sleep/delay パターンではなく cron を使用してください。

## 設定

- `tools.exec.notifyOnExit`（デフォルト: true）: true の場合、バックグラウンド化された exec セッションは終了時にシステムイベントをキューに入れ、Heartbeat を要求します。
- `tools.exec.approvalRunningNoticeMs`（デフォルト: 10000）: 承認ゲート付き exec がこれより長く実行された場合、単一の「実行中」通知を発行します（0 で無効）。
- `tools.exec.timeoutSec`（デフォルト: 1800）: コマンドごとのデフォルト exec タイムアウト秒数。呼び出しごとの `timeout` がこれを上書きします。呼び出しごとの `timeout: 0` は exec プロセスタイムアウトを無効にします。
- `tools.exec.host`（デフォルト: `auto`; サンドボックスランタイムがアクティブな場合は `sandbox`、それ以外の場合は `gateway` に解決）
- `tools.exec.security`（デフォルト: サンドボックスでは `deny`、未設定の場合は Gateway + Node で `full`）
- `tools.exec.ask`（デフォルト: `off`）
- Gateway + Node では承認なしのホスト exec がデフォルトです。承認/allowlist 動作が必要な場合は、`tools.exec.*` とホスト承認ファイルの両方を厳しくしてください。[Exec 承認](/ja-JP/tools/exec-approvals#yolo-mode-no-approval)を参照してください。
- YOLO は `host=auto` ではなく、ホストポリシーのデフォルト（`security=full`、`ask=off`）に由来します。Gateway または Node へのルーティングを強制したい場合は、`tools.exec.host` を設定するか `/exec host=...` を使用してください。
- `security=full` かつ `ask=off` モードでは、ホスト exec は設定済みポリシーに直接従います。追加のヒューリスティックなコマンド難読化プリフィルターやスクリプト事前チェック拒否レイヤーはありません。
- `tools.exec.node`（デフォルト: 未設定）
- `tools.exec.strictInlineEval`（デフォルト: false）: true の場合、`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e` などのインラインインタープリター eval 形式には、レビュアーまたは明示的な承認が必要です。`mode=auto` では、通常の exec 承認パスにより、ネイティブ自動レビュアーが明らかに低リスクな一回限りのコマンドを許可する場合があります。直接の Node ホスト `system.run` 呼び出しは、人間の承認ルートにコマンドを渡せないため、引き続き明示的な承認が必要です。レビュアーが確認を求めた場合、リクエストは人間に送られます。`allow-always` は引き続き無害なインタープリター/スクリプト呼び出しを永続化できますが、インライン eval 形式が永続的な許可ルールになることはありません。
- `tools.exec.commandHighlighting`（デフォルト: false）: true の場合、承認プロンプトはコマンドテキスト内のパーサー由来のコマンド範囲を強調表示できます。exec 承認ポリシーを変更せずにコマンドテキスト強調表示を有効にするには、グローバルまたはエージェントごとに `true` を設定します。
- `tools.exec.pathPrepend`: exec 実行時に `PATH` の前に追加するディレクトリのリスト（Gateway + サンドボックスのみ）。
- `tools.exec.safeBins`: 明示的な allowlist エントリなしで実行できる stdin 専用の安全なバイナリ。動作の詳細については、[安全な bin](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only)を参照してください。
- `tools.exec.safeBinTrustedDirs`: `safeBins` パスチェックで信頼される追加の明示的ディレクトリ。`PATH` エントリは自動的に信頼されません。組み込みのデフォルトは `/bin` と `/usr/bin` です。
- `tools.exec.safeBinProfiles`: safe bin ごとの任意のカスタム argv ポリシー（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。

例:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### PATH の処理

- `host=gateway`: ログインシェルの `PATH` を exec 環境にマージします。ホスト実行では `env.PATH` オーバーライドは拒否されます。デーモン自体は引き続き最小限の `PATH` で実行されます:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
    - 起動中にユーザーのシェル設定（`~/.zshenv` や `/etc/zshenv` など）が優先パスを上書きするのを防ぐため、`tools.exec.pathPrepend` エントリは、実行直前のシェルコマンド内で最終的な `PATH` に安全に先頭追加されます。
- `host=sandbox`: コンテナー内で `sh -lc`（ログインシェル）を実行するため、`/etc/profile` が `PATH` をリセットする場合があります。
  OpenClaw は、内部環境変数（シェル補間なし）を介してプロファイル source 後に `env.PATH` を先頭追加します。
  `tools.exec.pathPrepend` もここで適用されます。
- `host=node`: 渡されたブロックされていない env オーバーライドだけが Node に送信されます。`env.PATH` オーバーライドはホスト実行で拒否され、Node ホストでは無視されます。Node で追加の PATH エントリが必要な場合は、
  Node ホストサービス環境（systemd/launchd）を設定するか、標準の場所にツールをインストールしてください。

エージェントごとの Node バインディング（設定内のエージェントリストインデックスを使用）:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: Nodes タブには、同じ設定用の小さな「Exec node binding」パネルがあります。

## セッションオーバーライド（`/exec`）

`/exec` を使用して、`host`、`security`、`ask`、`node` の**セッションごとの**デフォルトを設定します。
現在の値を表示するには、引数なしで `/exec` を送信します。

例:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 認可モデル

`/exec` は **承認済み送信者**（チャンネルの許可リスト/ペアリングに加えて `commands.useAccessGroups`）に対してのみ適用されます。
これは **セッション状態のみ** を更新し、config には書き込みません。承認済みの外部チャンネル送信者は、
これらのセッション既定値を設定できます。内部 Gateway/webchat クライアントがそれらを永続化するには `operator.admin` が必要です。
exec を完全に無効化するには、tool policy（`tools.deny: ["exec"]` またはエージェント単位）で拒否します。Host approvals は、
`security=full` と `ask=off` を明示的に設定しない限り引き続き適用されます。

## exec 承認（コンパニオンアプリ / ノードホスト）

サンドボックス化されたエージェントでは、Gateway またはノードホスト上で `exec` が実行される前に、リクエストごとの承認を必須にできます。
ポリシー、許可リスト、UI フローについては、[exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

承認が必要な場合、exec tool は
`status: "approval-pending"` と承認 ID を返してすぐに終了します。承認されると（または拒否 / タイムアウトされると）、
Gateway は承認済みの実行についてのみコマンド進行状況と完了のシステムイベント
（`Exec running` / `Exec finished`）を発行します。拒否またはタイムアウトされた承認は終端状態であり、
拒否のシステムイベントでエージェントセッションを起動しません。
ネイティブの承認カード/ボタンがあるチャンネルでは、エージェントはまずその
ネイティブ UI に依存し、tool の結果がチャット承認を利用できない、または手動承認が
唯一の経路だと明示している場合にのみ、手動の `/approve` コマンドを含めるべきです。

## 許可リスト + 安全なバイナリ

手動の許可リスト適用では、解決済みバイナリパスの glob と素のコマンド名の
glob を照合します。素の名前は PATH 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` の場合、
`rg` は `/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には一致しません。
`security=allowlist` の場合、shell コマンドは、すべてのパイプライン
セグメントが許可リストに含まれているか安全なバイナリである場合にのみ自動許可されます。チェーン（`;`、`&&`、`||`）とリダイレクトは、
すべてのトップレベルセグメントが許可リスト（安全なバイナリを含む）を満たさない限り、allowlist モードでは拒否されます。
リダイレクトは引き続きサポートされていません。
永続的な `allow-always` 信頼はこのルールをバイパスしません。チェーンされたコマンドでは、依然としてすべての
トップレベルセグメントが一致する必要があります。

`autoAllowSkills` は exec 承認における別の利便性パスです。これは
手動パス許可リストエントリと同じではありません。厳密で明示的な信頼には、`autoAllowSkills` を無効のままにしてください。

2 つの制御は別々の用途に使います。

- `tools.exec.safeBins`: 小さな stdin 専用ストリームフィルター。
- `tools.exec.safeBinTrustedDirs`: 安全なバイナリ実行可能パスのための、明示的な追加の信頼済みディレクトリ。
- `tools.exec.safeBinProfiles`: カスタム安全バイナリのための明示的な argv ポリシー。
- 許可リスト: 実行可能パスに対する明示的な信頼。

`safeBins` を汎用の許可リストとして扱わないでください。また、インタープリター/ランタイムのバイナリ（例: `python3`、`node`、`ruby`、`bash`）を追加しないでください。それらが必要な場合は、明示的な許可リストエントリを使用し、承認プロンプトを有効のままにしてください。
`openclaw security audit` は、インタープリター/ランタイムの `safeBins` エントリに明示的なプロファイルがない場合に警告し、`openclaw doctor --fix` は不足しているカスタム `safeBinProfiles` エントリをスキャフォールドできます。
`openclaw security audit` と `openclaw doctor` は、`jq` のような広い振る舞いを持つバイナリを `safeBins` に明示的に戻した場合にも警告します。
インタープリターを明示的に許可リストに入れる場合は、インラインのコード評価形式が引き続きレビュアーまたは明示的な承認を必要とするように、`tools.exec.strictInlineEval` を有効にしてください。

完全なポリシーの詳細と例については、[exec 承認](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only)と[安全なバイナリと許可リストの比較](/ja-JP/tools/exec-approvals-advanced#safe-bins-versus-allowlist)を参照してください。

## 例

フォアグラウンド:

```json
{ "tool": "exec", "command": "ls -la" }
```

バックグラウンド + ポーリング:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

ポーリングはオンデマンドのステータス確認用であり、待機ループ用ではありません。自動完了による起動が
有効な場合、コマンドは出力を発行したとき、または失敗したときにセッションを起動できます。

キー送信（tmux 形式）:

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

送信（CR のみを送信）:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼り付け（既定でブラケット付き）:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` は、構造化された複数ファイル編集のための `exec` のサブtoolです。
OpenAI および OpenAI Codex モデルでは既定で有効です。config は、
無効化したい場合、または特定のモデルに制限したい場合にのみ使用してください。

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

注記:

- OpenAI/OpenAI Codex モデルでのみ利用できます。
- Tool policy は引き続き適用されます。`allow: ["write"]` は暗黙的に `apply_patch` を許可します。
- `deny: ["write"]` は `apply_patch` を拒否しません。`apply_patch` を明示的に拒否するか、patch 書き込みもブロックすべき場合は `deny: ["group:fs"]` を使用してください。
- config は `tools.exec.applyPatch` の下にあります。
- `tools.exec.applyPatch.enabled` の既定値は `true` です。OpenAI モデルでこの tool を無効化するには `false` に設定します。
- `tools.exec.applyPatch.workspaceOnly` の既定値は `true`（workspace 内限定）です。`apply_patch` に workspace ディレクトリ外への書き込み/削除を意図的に許可したい場合にのみ、`false` に設定してください。

## 関連

- [exec 承認](/ja-JP/tools/exec-approvals) — shell コマンドの承認ゲート
- [サンドボックス化](/ja-JP/gateway/sandboxing) — サンドボックス化された環境でコマンドを実行する
- [バックグラウンドプロセス](/ja-JP/gateway/background-process) — 長時間実行される exec と process tool
- [セキュリティ](/ja-JP/gateway/security) — tool policy と昇格アクセス
