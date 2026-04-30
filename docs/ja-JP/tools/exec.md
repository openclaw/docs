---
read_when:
    - exec ツールの使用または変更
    - stdin または TTY の動作のデバッグ
summary: Exec ツールの使用方法、stdin モード、TTY サポート
title: 実行ツール
x-i18n:
    generated_at: "2026-04-30T05:37:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7949cfde9f141202a3bc36c2be72ecdf6d43305b5f16fb02835a69bcaa46067b
    source_path: tools/exec.md
    workflow: 16
---

ワークスペースでシェルコマンドを実行します。`process` によるフォアグラウンド + バックグラウンド実行をサポートします。
`process` が許可されていない場合、`exec` は同期的に実行され、`yieldMs`/`background` を無視します。
バックグラウンドセッションはエージェントごとにスコープされます。`process` から見えるのは同じエージェントのセッションだけです。

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
この遅延時間 (ms) の後に、コマンドを自動的にバックグラウンド化します。
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` を待たずに、コマンドを即座にバックグラウンド化します。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
この呼び出しに対して、設定済みの exec タイムアウトをオーバーライドします。コマンドを exec プロセスのタイムアウトなしで実行すべき場合にのみ、`timeout: 0` を設定してください。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
利用可能な場合は疑似端末で実行します。TTY 専用の CLI、コーディングエージェント、端末 UI に使用します。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
実行場所。`auto` は、サンドボックスランタイムがアクティブな場合は `sandbox` に、それ以外の場合は `gateway` に解決されます。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 実行の強制モード。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 実行の承認プロンプト動作。
</ParamField>

<ParamField path="node" type="string">
`host=node` の場合の Node ID/名前。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
昇格モードを要求します。サンドボックスを抜けて、設定済みのホストパス上で実行します。昇格が `full` に解決される場合にのみ、`security=full` が強制されます。
</ParamField>

注:

- `host` のデフォルトは `auto` です。セッションでサンドボックスランタイムがアクティブな場合は sandbox、それ以外の場合は gateway になります。
- `host` は `auto`、`sandbox`、`gateway`、または `node` のみを受け付けます。これはホスト名セレクターではありません。ホスト名に似た値は、コマンド実行前に拒否されます。
- `auto` はデフォルトのルーティング戦略であり、ワイルドカードではありません。`auto` から呼び出しごとに `host=node` を指定することは許可されます。呼び出しごとの `host=gateway` は、サンドボックスランタイムがアクティブでない場合にのみ許可されます。
- 追加設定がなくても、`host=auto` はそのまま動作します。サンドボックスがなければ `gateway` に解決され、ライブサンドボックスがあればサンドボックス内に留まります。
- `elevated` はサンドボックスを抜けて、設定済みのホストパス上で実行します。デフォルトでは `gateway`、`tools.exec.host=node` の場合、またはセッションのデフォルトが `host=node` の場合は `node` です。これは、現在のセッション/プロバイダーで昇格アクセスが有効な場合にのみ利用できます。
- `gateway`/`node` の承認は `~/.openclaw/exec-approvals.json` によって制御されます。
- `node` には、ペアリング済みの Node (コンパニオンアプリまたはヘッドレス Node ホスト) が必要です。
- 複数の Node が利用可能な場合は、`exec.node` または `tools.exec.node` を設定して 1 つを選択します。
- `exec host=node` は Node に対する唯一のシェル実行パスです。従来の `nodes.run` ラッパーは削除されました。
- `timeout` は、フォアグラウンド、バックグラウンド、`yieldMs`、gateway、sandbox、node の `system.run` 実行に適用されます。省略した場合、OpenClaw は `tools.exec.timeoutSec` を使用します。明示的な `timeout: 0` は、その呼び出しの exec プロセスタイムアウトを無効にします。
- Windows 以外のホストでは、exec は `SHELL` が設定されている場合それを使用します。`SHELL` が `fish` の場合は、fish と互換性のないスクリプトを避けるため、`PATH` から `bash` (または `sh`) を優先し、どちらも存在しない場合は `SHELL` にフォールバックします。
- Windows ホストでは、exec は PowerShell 7 (`pwsh`) の検出を優先し (Program Files、ProgramW6432、次に PATH)、その後 Windows PowerShell 5.1 にフォールバックします。
- ホスト実行 (`gateway`/`node`) は、バイナリの乗っ取りや注入されたコードを防ぐため、`env.PATH` とローダーオーバーライド (`LD_*`/`DYLD_*`) を拒否します。
- OpenClaw は、シェル/プロファイルルールが exec ツールのコンテキストを検出できるように、生成されるコマンド環境 (PTY とサンドボックス実行を含む) に `OPENCLAW_SHELL=exec` を設定します。
- `openclaw channels login` は、インタラクティブなチャンネル認証フローであるため `exec` からブロックされます。gateway ホスト上の端末で実行するか、存在する場合はチャットからチャンネルネイティブのログインツールを使用してください。
- 重要: サンドボックス化は**デフォルトでオフ**です。サンドボックス化がオフの場合、暗黙の `host=auto` は `gateway` に解決されます。明示的な `host=sandbox` は、gateway ホスト上で暗黙的に実行されるのではなく、クローズドに失敗します。サンドボックス化を有効にするか、承認付きで `host=gateway` を使用してください。
- スクリプトの事前チェック (一般的な Python/Node のシェル構文ミス向け) は、有効な `workdir` 境界内のファイルのみを検査します。スクリプトパスが `workdir` の外に解決される場合、そのファイルの事前チェックはスキップされます。
- 今すぐ開始する長時間実行の作業では、一度だけ開始し、自動完了ウェイクが有効で、コマンドが出力を生成するか失敗した場合はそれに依存してください。ログ、状態、入力、介入には `process` を使用してください。sleep ループ、timeout ループ、繰り返しポーリングでスケジューリングを模倣しないでください。
- 後で実行する作業やスケジュール実行すべき作業には、`exec` の sleep/遅延パターンではなく cron を使用してください。

## 設定

- `tools.exec.notifyOnExit` (デフォルト: true): true の場合、バックグラウンド化された exec セッションは終了時にシステムイベントをキューに入れ、Heartbeat を要求します。
- `tools.exec.approvalRunningNoticeMs` (デフォルト: 10000): 承認ゲート付き exec がこの時間より長く実行された場合、単一の「running」通知を発行します (0 で無効化)。
- `tools.exec.timeoutSec` (デフォルト: 1800): コマンドごとのデフォルト exec タイムアウト秒数。呼び出しごとの `timeout` がこれをオーバーライドします。呼び出しごとの `timeout: 0` は exec プロセスタイムアウトを無効にします。
- `tools.exec.host` (デフォルト: `auto`; サンドボックスランタイムがアクティブな場合は `sandbox` に、それ以外の場合は `gateway` に解決)
- `tools.exec.security` (デフォルト: sandbox では `deny`、未設定時の gateway + node では `full`)
- `tools.exec.ask` (デフォルト: `off`)
- 承認なしのホスト exec は、gateway + node のデフォルトです。承認/許可リストの動作が必要な場合は、`tools.exec.*` とホストの `~/.openclaw/exec-approvals.json` の両方を厳格化してください。[Exec 承認](/ja-JP/tools/exec-approvals#no-approval-yolo-mode)を参照してください。
- YOLO はホストポリシーのデフォルト (`security=full`, `ask=off`) に由来し、`host=auto` に由来するものではありません。gateway または node へのルーティングを強制したい場合は、`tools.exec.host` を設定するか `/exec host=...` を使用してください。
- `security=full` かつ `ask=off` モードでは、ホスト exec は設定済みポリシーに直接従います。追加のヒューリスティックなコマンド難読化事前フィルターやスクリプト事前チェック拒否レイヤーはありません。
- `tools.exec.node` (デフォルト: 未設定)
- `tools.exec.strictInlineEval` (デフォルト: false): true の場合、`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e` などのインラインインタープリター eval 形式は、常に明示的な承認を必要とします。`allow-always` は引き続き無害なインタープリター/スクリプト呼び出しを永続化できますが、インライン eval 形式は毎回プロンプトを表示します。
- `tools.exec.pathPrepend`: exec 実行時に `PATH` の先頭に追加するディレクトリのリスト (gateway + sandbox のみ)。
- `tools.exec.safeBins`: 明示的な許可リストエントリーなしで実行できる、stdin 専用の安全なバイナリ。動作の詳細は、[安全なバイナリ](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only)を参照してください。
- `tools.exec.safeBinTrustedDirs`: `safeBins` のパスチェックで信頼される追加の明示的なディレクトリ。`PATH` エントリーは自動的には信頼されません。組み込みのデフォルトは `/bin` と `/usr/bin` です。
- `tools.exec.safeBinProfiles`: 安全なバイナリごとの任意のカスタム argv ポリシー (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`)。

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

### PATH の扱い

- `host=gateway`: ログインシェルの `PATH` を exec 環境にマージします。`env.PATH` のオーバーライドはホスト実行では拒否されます。デーモン自体は引き続き最小限の `PATH` で実行されます。
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: コンテナー内で `sh -lc` (ログインシェル) を実行するため、`/etc/profile` が `PATH` をリセットする場合があります。OpenClaw はプロファイル読み込み後に内部 env 変数経由で `env.PATH` を先頭に追加します (シェル補間なし)。`tools.exec.pathPrepend` もここで適用されます。
- `host=node`: 渡したブロックされていない env オーバーライドのみが node に送信されます。`env.PATH` のオーバーライドはホスト実行では拒否され、node ホストでは無視されます。node で追加の PATH エントリーが必要な場合は、node ホストサービス環境 (systemd/launchd) を設定するか、標準の場所にツールをインストールしてください。

エージェントごとの node バインディング (設定内のエージェントリストインデックスを使用):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

コントロール UI: Nodes タブには、同じ設定用の小さな「Exec node binding」パネルがあります。

## セッションのオーバーライド (`/exec`)

`/exec` を使用して、`host`、`security`、`ask`、`node` の**セッションごとの**デフォルトを設定します。
引数なしで `/exec` を送信すると、現在の値が表示されます。

例:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 認可モデル

`/exec` は、**認可済み送信者** (チャンネル許可リスト/ペアリングに加えて `commands.useAccessGroups`) に対してのみ有効です。
これは**セッション状態のみ**を更新し、設定を書き込みません。exec を強制的に無効化するには、ツールポリシー (`tools.deny: ["exec"]` またはエージェントごと) で拒否してください。`security=full` と `ask=off` を明示的に設定しない限り、ホスト承認は引き続き適用されます。

## Exec 承認 (コンパニオンアプリ / node ホスト)

サンドボックス化されたエージェントは、`exec` が gateway または node ホスト上で実行される前に、リクエストごとの承認を要求できます。
ポリシー、許可リスト、UI フローについては、[Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

承認が必要な場合、exec ツールは `status: "approval-pending"` と承認 ID を付けて即座に返ります。承認された (または拒否 / タイムアウトした) 後、Gateway はシステムイベント (`Exec finished` / `Exec denied`) を発行します。コマンドが `tools.exec.approvalRunningNoticeMs` 後もまだ実行中の場合、単一の `Exec running` 通知が発行されます。
ネイティブの承認カード/ボタンを持つチャンネルでは、エージェントはまずそのネイティブ UI に依存し、ツール結果がチャット承認を利用できない、または手動承認が唯一の経路であると明示的に示す場合にのみ、手動の `/approve` コマンドを含めるべきです。

## 許可リスト + 安全なバイナリ

手動の許可リスト適用は、解決済みバイナリパスの glob と裸のコマンド名の glob に一致します。裸の名前は PATH 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` の場合は `rg` が `/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には一致しません。
`security=allowlist` の場合、シェルコマンドはすべてのパイプラインセグメントが許可リストに含まれているか、安全なバイナリである場合にのみ自動許可されます。チェーン (`;`, `&&`, `||`) とリダイレクトは、最上位のすべてのセグメントが許可リスト (安全なバイナリを含む) を満たさない限り、allowlist モードでは拒否されます。リダイレクトは引き続きサポートされていません。
永続的な `allow-always` の信頼は、そのルールを迂回しません。チェーンされたコマンドでは、引き続きすべての最上位セグメントが一致する必要があります。

`autoAllowSkills` は exec 承認における別個の便利な経路です。これは手動のパス許可リストエントリーと同じではありません。厳密な明示的信頼には、`autoAllowSkills` を無効のままにしてください。

用途に応じて 2 種類の制御を使い分けます。

- `tools.exec.safeBins`: 小さな stdin 専用ストリームフィルター。
- `tools.exec.safeBinTrustedDirs`: 安全なバイナリ実行可能ファイルパスのための、明示的な追加の信頼済みディレクトリ。
- `tools.exec.safeBinProfiles`: カスタムの安全なバイナリ用の明示的な argv ポリシー。
- 許可リスト: 実行可能ファイルパスに対する明示的な信頼。

`safeBins` を汎用の許可リストとして扱わず、インタープリター/ランタイムのバイナリ（例: `python3`, `node`, `ruby`, `bash`）を追加しないでください。それらが必要な場合は、明示的な許可リスト項目を使い、承認プロンプトを有効のままにしてください。
`openclaw security audit` は、インタープリター/ランタイムの `safeBins` 項目に明示的なプロファイルがない場合に警告し、`openclaw doctor --fix` は不足しているカスタム `safeBinProfiles` 項目をひな形生成できます。
`openclaw security audit` と `openclaw doctor` は、`jq` のような広範な動作を持つ bin を明示的に `safeBins` へ戻した場合にも警告します。
インタープリターを明示的に許可リストへ追加する場合は、インラインのコード評価形式が引き続き新しい承認を必要とするように、`tools.exec.strictInlineEval` を有効にしてください。

ポリシーの詳細と例については、[exec 承認](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only) と [Safe bins と許可リストの比較](/ja-JP/tools/exec-approvals-advanced#safe-bins-versus-allowlist) を参照してください。

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

ポーリングはオンデマンドの状態確認用であり、待機ループ用ではありません。自動完了のウェイクが
有効な場合、コマンドが出力を発したとき、または失敗したときにセッションを起こせます。

キーを送信（tmux 形式）:

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

送信（CR のみ送信）:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼り付け（デフォルトではブラケット付き）:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` は、構造化された複数ファイル編集のための `exec` のサブツールです。
OpenAI および OpenAI Codex モデルではデフォルトで有効です。無効化する場合、または特定のモデルに制限したい場合にのみ設定を使ってください:

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
- 設定は `tools.exec.applyPatch` の下にあります。
- `tools.exec.applyPatch.enabled` のデフォルトは `true` です。OpenAI モデルでこのツールを無効にするには `false` に設定してください。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true`（ワークスペース内に限定）です。意図的に `apply_patch` がワークスペースディレクトリ外へ書き込み/削除するようにしたい場合にのみ、`false` に設定してください。

## 関連

- [exec 承認](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [サンドボックス化](/ja-JP/gateway/sandboxing) — サンドボックス環境でのコマンド実行
- [バックグラウンドプロセス](/ja-JP/gateway/background-process) — 長時間実行される exec と process ツール
- [セキュリティ](/ja-JP/gateway/security) — ツールポリシーと昇格アクセス
