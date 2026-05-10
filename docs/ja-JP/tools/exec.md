---
read_when:
    - execツールの使用または変更
    - stdin または TTY の動作のデバッグ
summary: Exec ツールの使用方法、stdin モード、TTY サポート
title: 実行ツール
x-i18n:
    generated_at: "2026-05-10T19:54:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 445b09c1c6cdc1998c1c2a6b1223fdef438011413d246c4de0de0436465b448f
    source_path: tools/exec.md
    workflow: 16
---

ワークスペース内でシェルコマンドを実行します。`exec` は変更を伴うシェルサーフェスです。コマンドは、選択されたホストまたはサンドボックスのファイルシステムが許可する場所で、ファイルの作成、編集、削除を実行できます。`write`、`edit`、`apply_patch` などの OpenClaw ファイルシステムツールを無効にしても、`exec` が読み取り専用になるわけではありません。

`process` によるフォアグラウンド実行とバックグラウンド実行をサポートします。`process` が許可されていない場合、`exec` は同期的に実行され、`yieldMs`/`background` を無視します。
バックグラウンドセッションはエージェントごとにスコープされます。`process` で見えるのは同じエージェントのセッションだけです。

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
この遅延時間 (ms) の後にコマンドを自動的にバックグラウンド化します。
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` を待たずに、コマンドをただちにバックグラウンド化します。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
この呼び出しに対して、設定済みの exec タイムアウトをオーバーライドします。コマンドを exec プロセスタイムアウトなしで実行する必要がある場合にのみ、`timeout: 0` を設定します。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
利用可能な場合、疑似端末で実行します。TTY 専用 CLI、コーディングエージェント、端末 UI に使用します。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
実行場所。サンドボックスランタイムが有効な場合、`auto` は `sandbox` に解決され、それ以外の場合は `gateway` に解決されます。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 実行の適用モード。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 実行の承認プロンプト動作。
</ParamField>

<ParamField path="node" type="string">
`host=node` の場合の Node ID/名前。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
昇格モードをリクエストします。サンドボックスを抜けて、設定済みのホストパス上で実行します。`elevated` が `full` に解決される場合にのみ、`security=full` が強制されます。
</ParamField>

注:

- `host` のデフォルトは `auto` です。セッションでサンドボックスランタイムが有効な場合は sandbox、それ以外の場合は gateway になります。
- `host` が受け付けるのは `auto`、`sandbox`、`gateway`、`node` だけです。これはホスト名セレクターではありません。ホスト名のような値は、コマンド実行前に拒否されます。
- `auto` はデフォルトのルーティング戦略であり、ワイルドカードではありません。`auto` から呼び出しごとに `host=node` を指定することは許可されます。呼び出しごとの `host=gateway` は、サンドボックスランタイムが有効でない場合にのみ許可されます。
- 追加設定がなくても、`host=auto` はそのまま動作します。サンドボックスがなければ `gateway` に解決され、稼働中のサンドボックスがあればサンドボックス内に留まります。
- `elevated` は、サンドボックスを抜けて設定済みのホストパス上で実行します。デフォルトでは `gateway`、`tools.exec.host=node` の場合 (またはセッションのデフォルトが `host=node` の場合) は `node` です。現在のセッション/プロバイダーで昇格アクセスが有効な場合にのみ利用できます。
- `gateway`/`node` の承認は `~/.openclaw/exec-approvals.json` で制御されます。
- `node` にはペアリング済みの Node (コンパニオンアプリまたはヘッドレス Node ホスト) が必要です。
- 複数の Node が利用可能な場合は、`exec.node` または `tools.exec.node` を設定して 1 つ選択します。
- `exec host=node` は Node 用の唯一のシェル実行パスです。従来の `nodes.run` ラッパーは削除されています。
- `timeout` はフォアグラウンド、バックグラウンド、`yieldMs`、gateway、sandbox、Node の `system.run` 実行に適用されます。省略した場合、OpenClaw は `tools.exec.timeoutSec` を使用します。明示的な `timeout: 0` は、その呼び出しの exec プロセスタイムアウトを無効にします。
- Windows 以外のホストでは、exec は `SHELL` が設定されている場合にそれを使用します。`SHELL` が `fish` の場合、fish と互換性のないスクリプトを避けるために、`PATH` から `bash` (または `sh`) を優先し、どちらも存在しない場合は `SHELL` にフォールバックします。
- Windows ホストでは、exec は PowerShell 7 (`pwsh`) の検出 (Program Files、ProgramW6432、次に PATH) を優先し、その後 Windows PowerShell 5.1 にフォールバックします。
- ホスト実行 (`gateway`/`node`) は、バイナリの乗っ取りやコード注入を防ぐために、`env.PATH` とローダーオーバーライド (`LD_*`/`DYLD_*`) を拒否します。
- OpenClaw は、シェル/プロファイルルールが exec ツールのコンテキストを検出できるように、生成されたコマンド環境 (PTY とサンドボックス実行を含む) に `OPENCLAW_SHELL=exec` を設定します。
- `openclaw channels login` はインタラクティブなチャネル認証フローであるため、`exec` からはブロックされます。gateway ホスト上の端末で実行するか、存在する場合はチャットからチャネルネイティブのログインツールを使用します。
- 重要: サンドボックス化は**デフォルトでオフ**です。サンドボックス化がオフの場合、暗黙の `host=auto` は `gateway` に解決されます。明示的な `host=sandbox` は、gateway ホストで暗黙に実行するのではなく、閉じた状態で失敗します。サンドボックス化を有効にするか、承認付きで `host=gateway` を使用してください。
- スクリプトの事前チェック (一般的な Python/Node シェル構文ミス向け) は、有効な `workdir` 境界内のファイルだけを検査します。スクリプトパスが `workdir` の外に解決される場合、そのファイルの事前チェックはスキップされます。
- いま開始する長時間実行の作業では、一度だけ起動し、有効になっている場合は、コマンドが出力を発するか失敗したときの自動完了ウェイクに依存します。ログ、ステータス、入力、介入には `process` を使用します。sleep ループ、timeout ループ、反復ポーリングでスケジューリングを模倣しないでください。
- 後で実行する必要がある作業やスケジュール実行する作業には、`exec` の sleep/遅延パターンではなく cron を使用してください。

## 設定

- `tools.exec.notifyOnExit` (デフォルト: true): true の場合、バックグラウンド化された exec セッションは終了時にシステムイベントをキューに入れ、Heartbeat をリクエストします。
- `tools.exec.approvalRunningNoticeMs` (デフォルト: 10000): 承認ゲート付きの exec がこの時間より長く実行された場合に、単一の「実行中」通知を発します (0 で無効)。
- `tools.exec.timeoutSec` (デフォルト: 1800): コマンドごとのデフォルト exec タイムアウト (秒)。呼び出しごとの `timeout` がこれをオーバーライドします。呼び出しごとの `timeout: 0` は exec プロセスタイムアウトを無効にします。
- `tools.exec.host` (デフォルト: `auto`; サンドボックスランタイムが有効な場合は `sandbox`、それ以外の場合は `gateway` に解決)
- `tools.exec.security` (デフォルト: sandbox は `deny`、gateway + node は未設定の場合 `full`)
- `tools.exec.ask` (デフォルト: `off`)
- 承認なしのホスト exec が、gateway + node のデフォルトです。承認/allowlist 動作が必要な場合は、`tools.exec.*` とホストの `~/.openclaw/exec-approvals.json` の両方を厳格化してください。[Exec 承認](/ja-JP/tools/exec-approvals#yolo-mode-no-approval)を参照してください。
- YOLO はホストポリシーのデフォルト (`security=full`、`ask=off`) に由来するものであり、`host=auto` に由来するものではありません。gateway または node のルーティングを強制したい場合は、`tools.exec.host` を設定するか `/exec host=...` を使用します。
- `security=full` かつ `ask=off` モードでは、ホスト exec は設定済みポリシーに直接従います。追加のヒューリスティックなコマンド難読化プリフィルターやスクリプト事前チェック拒否レイヤーはありません。
- `tools.exec.node` (デフォルト: 未設定)
- `tools.exec.strictInlineEval` (デフォルト: false): true の場合、`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e` などのインラインインタープリター eval 形式は常に明示的な承認を必要とします。`allow-always` は無害なインタープリター/スクリプト呼び出しを引き続き永続化できますが、インライン eval 形式は毎回プロンプトを表示します。
- `tools.exec.pathPrepend`: exec 実行時に `PATH` の先頭に追加するディレクトリのリスト (gateway + sandbox のみ)。
- `tools.exec.safeBins`: 明示的な allowlist エントリーなしで実行できる stdin 専用の安全なバイナリ。動作の詳細は、[安全な bin](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only)を参照してください。
- `tools.exec.safeBinTrustedDirs`: `safeBins` パスチェックで信頼される追加の明示的なディレクトリ。`PATH` エントリーは自動的には信頼されません。組み込みのデフォルトは `/bin` と `/usr/bin` です。
- `tools.exec.safeBinProfiles`: 安全な bin ごとの任意のカスタム argv ポリシー (`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`)。

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

- `host=gateway`: ログインシェルの `PATH` を exec 環境にマージします。`env.PATH` のオーバーライドはホスト実行では拒否されます。デーモン自体は引き続き最小限の `PATH` で実行されます。
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: コンテナー内で `sh -lc` (ログインシェル) を実行するため、`/etc/profile` が `PATH` をリセットする場合があります。OpenClaw は、プロファイルの読み込み後に内部 env var 経由で `env.PATH` を先頭に追加します (シェル補間なし)。`tools.exec.pathPrepend` もここで適用されます。
- `host=node`: 渡した env オーバーライドのうち、ブロックされていないものだけが Node に送信されます。`env.PATH` のオーバーライドはホスト実行では拒否され、Node ホストでは無視されます。Node 上で追加の PATH エントリーが必要な場合は、Node ホストサービス環境 (systemd/launchd) を設定するか、標準の場所にツールをインストールしてください。

エージェントごとの Node バインディング (config 内のエージェントリストインデックスを使用):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

コントロール UI: Nodes タブには、同じ設定のための小さな「Exec node binding」パネルがあります。

## セッションオーバーライド (`/exec`)

`/exec` を使用して、`host`、`security`、`ask`、`node` の**セッションごとの**デフォルトを設定します。
引数なしで `/exec` を送信すると、現在の値が表示されます。

例:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 認可モデル

`/exec` は**認可済み送信者** (チャネル allowlist/ペアリングと `commands.useAccessGroups`) に対してのみ有効です。
これは**セッション状態のみ**を更新し、config には書き込みません。exec を完全に無効化するには、ツールポリシー (`tools.deny: ["exec"]` またはエージェントごと) で拒否してください。`security=full` と `ask=off` を明示的に設定しない限り、ホスト承認は引き続き適用されます。

## Exec 承認 (コンパニオンアプリ / Node ホスト)

サンドボックス化されたエージェントでは、`exec` を gateway または Node ホスト上で実行する前に、リクエストごとの承認を要求できます。
ポリシー、allowlist、UI フローについては、[Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

承認が必要な場合、exec ツールは `status: "approval-pending"` と承認 ID を返してただちに終了します。承認されると (または拒否/タイムアウトされると)、Gateway はシステムイベント (`Exec finished` / `Exec denied`) を発します。コマンドが `tools.exec.approvalRunningNoticeMs` の後もまだ実行中の場合、単一の `Exec running` 通知が発せられます。
ネイティブ承認カード/ボタンがあるチャネルでは、エージェントはまずそのネイティブ UI に依存し、ツール結果がチャット承認を利用できない、または手動承認が唯一の経路であると明示している場合にのみ、手動の `/approve` コマンドを含めるべきです。

## Allowlist + 安全な bin

手動 allowlist の適用は、解決済みバイナリパスの glob と素のコマンド名 glob に一致します。素の名前は PATH 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` の場合は `rg` が `/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には一致しません。
`security=allowlist` の場合、シェルコマンドが自動許可されるのは、すべてのパイプラインセグメントが allowlist に含まれているか、安全な bin である場合だけです。チェーン (`;`、`&&`、`||`) とリダイレクトは、すべてのトップレベルセグメントが (安全な bin を含めて) allowlist を満たさない限り、allowlist モードでは拒否されます。リダイレクトは引き続き未サポートです。
永続的な `allow-always` 信頼はこのルールをバイパスしません。チェーンされたコマンドでも、すべてのトップレベルセグメントが一致する必要があります。

`autoAllowSkills` は exec 承認内の別の利便性パスです。これは手動パス allowlist エントリーと同じではありません。厳密で明示的な信頼を行う場合は、`autoAllowSkills` を無効のままにしてください。

2 つの制御は用途ごとに使い分けます。

- `tools.exec.safeBins`: 小さな stdin 専用のストリームフィルター。
- `tools.exec.safeBinTrustedDirs`: 安全な bin 実行可能ファイルパス用の明示的な追加の信頼済みディレクトリ。
- `tools.exec.safeBinProfiles`: カスタム安全 bin の明示的な argv ポリシー。
- allowlist: 実行可能ファイルパスに対する明示的な信頼。

`safeBins` を汎用の許可リストとして扱わず、インタープリター/ランタイムのバイナリ (例: `python3`、`node`、`ruby`、`bash`) を追加しないでください。それらが必要な場合は、明示的な許可リストエントリを使用し、承認プロンプトを有効のままにしてください。
`openclaw security audit` は、インタープリター/ランタイムの `safeBins` エントリに明示的なプロファイルがない場合に警告し、`openclaw doctor --fix` は不足しているカスタム `safeBinProfiles` エントリをひな形として生成できます。
`openclaw security audit` と `openclaw doctor` は、`jq` のような広範な振る舞いを持つ bin を `safeBins` に明示的に戻した場合にも警告します。
インタープリターを明示的に許可リストに入れる場合は、インラインのコード評価形式でも新しい承認が必要になるように `tools.exec.strictInlineEval` を有効にしてください。

ポリシーの詳細と例については、[exec 承認](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only) と [安全な bin と許可リストの違い](/ja-JP/tools/exec-approvals-advanced#safe-bins-versus-allowlist) を参照してください。

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

ポーリングはオンデマンドのステータス確認用であり、待機ループ用ではありません。自動完了ウェイクが有効な場合、コマンドは出力を出したとき、または失敗したときにセッションを起動できます。

キー送信 (tmux 形式):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

送信 (CR のみ送信):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼り付け (デフォルトではブラケット付き):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` は、構造化された複数ファイル編集のための `exec` のサブツールです。
OpenAI および OpenAI Codex モデルではデフォルトで有効です。無効化する場合、または特定のモデルに制限する場合にのみ設定を使用してください。

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
- ツールポリシーは引き続き適用されます。`allow: ["write"]` は暗黙的に `apply_patch` を許可します。
- `deny: ["write"]` は `apply_patch` を拒否しません。`apply_patch` を明示的に拒否するか、パッチ書き込みもブロックする必要がある場合は `deny: ["group:fs"]` を使用してください。
- 設定は `tools.exec.applyPatch` 配下にあります。
- `tools.exec.applyPatch.enabled` のデフォルトは `true` です。OpenAI モデルでこのツールを無効化するには `false` に設定してください。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true` (ワークスペース内に限定) です。`apply_patch` がワークスペースディレクトリの外に書き込み/削除を行うことを意図している場合にのみ `false` に設定してください。

## 関連項目

- [exec 承認](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [サンドボックス化](/ja-JP/gateway/sandboxing) — サンドボックス環境でのコマンド実行
- [バックグラウンドプロセス](/ja-JP/gateway/background-process) — 長時間実行される exec と process ツール
- [セキュリティ](/ja-JP/gateway/security) — ツールポリシーと昇格アクセス
