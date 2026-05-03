---
read_when:
    - execツールの使用または変更
    - stdin または TTY の動作のデバッグ
summary: Exec ツールの使用方法、stdin モード、TTY サポート
title: 実行ツール
x-i18n:
    generated_at: "2026-05-03T21:39:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: dbc8dda08abfd4d7b2e2cd5c7319a7eddf1575156bbfbc52df841908589c8c81
    source_path: tools/exec.md
    workflow: 16
---

ワークスペースでシェルコマンドを実行します。`process` によるフォアグラウンド + バックグラウンド実行をサポートします。
`process` が許可されていない場合、`exec` は同期的に実行され、`yieldMs`/`background` を無視します。
バックグラウンドセッションはエージェントごとにスコープされます。`process` には同じエージェントのセッションだけが表示されます。

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
この遅延時間 (ms) の後、コマンドを自動的にバックグラウンド化します。
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` を待たずに、コマンドを即座にバックグラウンド化します。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
この呼び出しに設定済みの exec タイムアウトを上書きします。コマンドを exec プロセスタイムアウトなしで実行する必要がある場合にのみ、`timeout: 0` を設定してください。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
利用可能な場合は疑似端末で実行します。TTY 専用 CLI、コーディングエージェント、端末 UI に使用します。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
実行場所。`auto` は、サンドボックスランタイムがアクティブな場合は `sandbox` に、それ以外の場合は `gateway` に解決されます。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 実行の適用モード。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 実行の承認プロンプト動作。
</ParamField>

<ParamField path="node" type="string">
`host=node` の場合の Node id/名前。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
昇格モードを要求します — サンドボックスを抜けて、設定済みのホストパスで実行します。`elevated` が `full` に解決される場合にのみ、`security=full` が強制されます。
</ParamField>

注記:

- `host` のデフォルトは `auto` です。セッションでサンドボックスランタイムがアクティブな場合は sandbox、それ以外の場合は gateway になります。
- `host` は `auto`、`sandbox`、`gateway`、`node` のみを受け付けます。これはホスト名セレクターではありません。ホスト名のような値は、コマンド実行前に拒否されます。
- `auto` はデフォルトのルーティング戦略であり、ワイルドカードではありません。呼び出しごとの `host=node` は `auto` から許可されます。呼び出しごとの `host=gateway` は、サンドボックスランタイムがアクティブでない場合にのみ許可されます。
- 追加設定がなくても、`host=auto` はそのまま動作します。サンドボックスがなければ `gateway` に解決され、ライブサンドボックスがあればサンドボックス内に留まります。
- `elevated` はサンドボックスを抜けて、設定済みのホストパスで実行します。デフォルトでは `gateway`、または `tools.exec.host=node` の場合（またはセッションのデフォルトが `host=node` の場合）は `node` です。現在のセッション/プロバイダーで昇格アクセスが有効な場合にのみ利用できます。
- `gateway`/`node` の承認は `~/.openclaw/exec-approvals.json` によって制御されます。
- `node` にはペアリング済みの Node（コンパニオンアプリまたはヘッドレス Node ホスト）が必要です。
- 複数の Node が利用可能な場合は、`exec.node` または `tools.exec.node` を設定して 1 つを選択します。
- `exec host=node` は Node 用の唯一のシェル実行パスです。レガシーの `nodes.run` ラッパーは削除されました。
- `timeout` は、フォアグラウンド、バックグラウンド、`yieldMs`、gateway、sandbox、node の `system.run` 実行に適用されます。省略した場合、OpenClaw は `tools.exec.timeoutSec` を使用します。明示的な `timeout: 0` は、その呼び出しの exec プロセスタイムアウトを無効にします。
- Windows 以外のホストでは、exec は `SHELL` が設定されている場合それを使用します。`SHELL` が `fish` の場合は、fish 非互換のスクリプトを避けるために `PATH` から `bash`（または `sh`）を優先し、どちらも存在しない場合は `SHELL` にフォールバックします。
- Windows ホストでは、exec は PowerShell 7 (`pwsh`) の検出（Program Files、ProgramW6432、その後 PATH）を優先し、その後 Windows PowerShell 5.1 にフォールバックします。
- ホスト実行（`gateway`/`node`）では、バイナリの乗っ取りやコード注入を防ぐために、`env.PATH` とローダーオーバーライド（`LD_*`/`DYLD_*`）を拒否します。
- OpenClaw は、シェル/プロファイルのルールが exec ツールのコンテキストを検出できるよう、生成されたコマンド環境（PTY とサンドボックス実行を含む）で `OPENCLAW_SHELL=exec` を設定します。
- `openclaw channels login` は対話型のチャネル認証フローであるため、`exec` からはブロックされます。Gateway ホスト上の端末で実行するか、存在する場合はチャットからチャネルネイティブのログインツールを使用してください。
- 重要: サンドボックス化は**デフォルトでオフ**です。サンドボックス化がオフの場合、暗黙の `host=auto` は `gateway` に解決されます。明示的な `host=sandbox` は、Gateway ホストで暗黙に実行されるのではなく、閉じた状態で失敗します。サンドボックス化を有効にするか、承認付きで `host=gateway` を使用してください。
- スクリプトのプリフライトチェック（一般的な Python/Node シェル構文ミス用）は、有効な `workdir` 境界内のファイルだけを検査します。スクリプトパスが `workdir` の外側に解決される場合、そのファイルのプリフライトはスキップされます。
- いま開始する長時間実行の作業では、一度だけ開始し、有効な場合は、コマンドが出力を発行するか失敗したときの自動完了ウェイクに依存してください。ログ、状態、入力、介入には `process` を使用し、sleep ループ、timeout ループ、反復ポーリングでスケジューリングを模倣しないでください。
- 後で実行すべき作業、またはスケジュールで実行すべき作業には、`exec` の sleep/遅延パターンではなく Cron を使用してください。

## 設定

- `tools.exec.notifyOnExit`（デフォルト: true）: true の場合、バックグラウンド化された exec セッションは、終了時にシステムイベントをキューに入れ、Heartbeat を要求します。
- `tools.exec.approvalRunningNoticeMs`（デフォルト: 10000）: 承認ゲート付き exec がこれより長く実行された場合に、単一の「実行中」通知を発行します（0 で無効化）。
- `tools.exec.timeoutSec`（デフォルト: 1800）: コマンドごとのデフォルト exec タイムアウト秒数。呼び出しごとの `timeout` がこれを上書きします。呼び出しごとの `timeout: 0` は exec プロセスタイムアウトを無効にします。
- `tools.exec.host`（デフォルト: `auto`; サンドボックスランタイムがアクティブな場合は `sandbox`、それ以外の場合は `gateway` に解決）
- `tools.exec.security`（デフォルト: sandbox は `deny`、未設定時の gateway + node は `full`）
- `tools.exec.ask`（デフォルト: `off`）
- 承認なしのホスト exec は、gateway + node のデフォルトです。承認/許可リスト動作が必要な場合は、`tools.exec.*` とホストの `~/.openclaw/exec-approvals.json` の両方を厳格化してください。[Exec approvals](/ja-JP/tools/exec-approvals#yolo-mode-no-approval) を参照してください。
- YOLO はホストポリシーのデフォルト（`security=full`, `ask=off`）に由来し、`host=auto` に由来するものではありません。gateway または node のルーティングを強制したい場合は、`tools.exec.host` を設定するか `/exec host=...` を使用してください。
- `security=full` かつ `ask=off` モードでは、ホスト exec は設定済みポリシーに直接従います。追加のヒューリスティックなコマンド難読化プリフィルターや、スクリプトプリフライト拒否レイヤーはありません。
- `tools.exec.node`（デフォルト: 未設定）
- `tools.exec.strictInlineEval`（デフォルト: false）: true の場合、`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e` などのインラインインタープリター eval 形式は常に明示的な承認を必要とします。`allow-always` は無害なインタープリター/スクリプト呼び出しを引き続き永続化できますが、インライン eval 形式は毎回プロンプトを表示します。
- `tools.exec.pathPrepend`: exec 実行時に `PATH` の前に追加するディレクトリの一覧（gateway + sandbox のみ）。
- `tools.exec.safeBins`: 明示的な許可リストエントリなしで実行できる、stdin 専用の安全なバイナリ。動作の詳細については、[Safe bins](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only) を参照してください。
- `tools.exec.safeBinTrustedDirs`: `safeBins` パスチェックで信頼する追加の明示的なディレクトリ。`PATH` エントリは自動的には信頼されません。組み込みのデフォルトは `/bin` と `/usr/bin` です。
- `tools.exec.safeBinProfiles`: 安全なバイナリごとの任意のカスタム argv ポリシー（`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`）。

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
- `host=sandbox`: コンテナー内で `sh -lc`（ログインシェル）を実行するため、`/etc/profile` が `PATH` をリセットする場合があります。OpenClaw は、内部環境変数経由（シェル補間なし）でプロファイル読み込み後に `env.PATH` を前置します。`tools.exec.pathPrepend` もここで適用されます。
- `host=node`: 渡したブロックされていない env オーバーライドだけが Node に送信されます。`env.PATH` のオーバーライドはホスト実行では拒否され、Node ホストでは無視されます。Node に追加の PATH エントリが必要な場合は、Node ホストサービス環境（systemd/launchd）を設定するか、標準の場所にツールをインストールしてください。

エージェントごとの Node バインディング（config 内のエージェント一覧インデックスを使用）:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

コントロール UI: Nodes タブには、同じ設定のための小さな「Exec node binding」パネルがあります。

## セッションオーバーライド（`/exec`）

`/exec` を使用して、`host`、`security`、`ask`、`node` の**セッションごとの**デフォルトを設定します。
現在の値を表示するには、引数なしで `/exec` を送信します。

例:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 承認モデル

`/exec` は**承認済み送信者**（チャネル許可リスト/ペアリング + `commands.useAccessGroups`）に対してのみ尊重されます。
これは**セッション状態のみ**を更新し、設定を書き込みません。exec を強制的に無効化するには、ツールポリシー（`tools.deny: ["exec"]` またはエージェントごと）で拒否してください。明示的に `security=full` と `ask=off` を設定しない限り、ホスト承認は引き続き適用されます。

## Exec 承認（コンパニオンアプリ / Node ホスト）

サンドボックス化されたエージェントでは、`exec` が Gateway または Node ホスト上で実行される前にリクエストごとの承認を要求できます。
ポリシー、許可リスト、UI フローについては、[Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

承認が必要な場合、exec ツールは `status: "approval-pending"` と承認 id を付けて即座に返します。承認（または拒否 / タイムアウト）されると、Gateway はシステムイベント（`Exec finished` / `Exec denied`）を発行します。コマンドが `tools.exec.approvalRunningNoticeMs` の後も実行中の場合、単一の `Exec running` 通知が発行されます。ネイティブの承認カード/ボタンを備えたチャネルでは、エージェントはまずそのネイティブ UI に依存し、ツール結果がチャット承認は利用できない、または手動承認が唯一の経路であると明示している場合にのみ、手動の `/approve` コマンドを含めるべきです。

## 許可リスト + 安全なバイナリ

手動の許可リスト適用は、解決済みバイナリパス glob と素のコマンド名 glob に一致します。素の名前は PATH 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` の場合、`rg` は `/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には一致しません。
`security=allowlist` の場合、シェルコマンドは、すべてのパイプラインセグメントが許可リスト対象または安全なバイナリである場合にのみ自動許可されます。チェーン（`;`, `&&`, `||`）とリダイレクトは、すべてのトップレベルセグメントが（安全なバイナリを含めて）許可リストを満たさない限り、許可リストモードで拒否されます。リダイレクトは引き続きサポートされません。
永続的な `allow-always` 信頼は、このルールをバイパスしません。チェーンされたコマンドでは、引き続きすべてのトップレベルセグメントが一致する必要があります。

`autoAllowSkills` は exec 承認内の別個の便利な経路です。これは手動のパス許可リストエントリとは同じではありません。厳密で明示的な信頼のためには、`autoAllowSkills` を無効のままにしてください。

2 つの制御は用途を分けて使用します。

- `tools.exec.safeBins`: 小さな stdin 専用のストリームフィルター。
- `tools.exec.safeBinTrustedDirs`: 安全なバイナリの実行可能ファイルパス用の明示的な追加信頼ディレクトリ。
- `tools.exec.safeBinProfiles`: カスタム安全バイナリ用の明示的な argv ポリシー。
- allowlist: 実行可能ファイルパスへの明示的な信頼。

`safeBins` を汎用的な許可リストとして扱わず、インタープリター/ランタイムのバイナリ（例: `python3`、`node`、`ruby`、`bash`）を追加しないでください。それらが必要な場合は、明示的な許可リストエントリを使い、承認プロンプトを有効にしたままにしてください。
`openclaw security audit` は、インタープリター/ランタイムの `safeBins` エントリに明示的なプロファイルがない場合に警告し、`openclaw doctor --fix` は不足しているカスタム `safeBinProfiles` エントリをひな形として作成できます。
`openclaw security audit` と `openclaw doctor` は、`jq` のように動作範囲の広い bin を明示的に `safeBins` へ戻した場合にも警告します。
インタープリターを明示的に許可リストへ追加する場合は、インラインのコード評価形式でも新しい承認が引き続き必要になるように `tools.exec.strictInlineEval` を有効にしてください。

ポリシーの詳細と例については、[exec の承認](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only) と [safe bins と許可リストの違い](/ja-JP/tools/exec-approvals-advanced#safe-bins-versus-allowlist) を参照してください。

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

ポーリングはオンデマンドの状態確認用であり、待機ループ用ではありません。自動完了ウェイクが有効な場合、コマンドは出力を発したとき、または失敗したときにセッションを起こすことができます。

キー送信（tmux 形式）:

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

送信（CR のみ送信）:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼り付け（デフォルトでブラケット付き）:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` は、構造化された複数ファイル編集のための `exec` のサブツールです。
OpenAI および OpenAI Codex モデルではデフォルトで有効です。無効化したい場合や特定のモデルに制限したい場合にのみ config を使ってください。

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
- `deny: ["write"]` は `apply_patch` を拒否しません。`apply_patch` を明示的に拒否するか、パッチによる書き込みもブロックする必要がある場合は `deny: ["group:fs"]` を使ってください。
- config は `tools.exec.applyPatch` の下にあります。
- `tools.exec.applyPatch.enabled` のデフォルトは `true` です。OpenAI モデルでこのツールを無効化するには `false` に設定してください。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true`（ワークスペース内に限定）です。`apply_patch` がワークスペースディレクトリ外へ書き込み/削除することを意図している場合にのみ、`false` に設定してください。

## 関連

- [exec の承認](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [サンドボックス化](/ja-JP/gateway/sandboxing) — サンドボックス化された環境でのコマンド実行
- [バックグラウンドプロセス](/ja-JP/gateway/background-process) — 長時間実行される exec と process ツール
- [セキュリティ](/ja-JP/gateway/security) — ツールポリシーと昇格アクセス
