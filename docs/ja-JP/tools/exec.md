---
read_when:
    - exec ツールの使用または変更
    - stdin または TTY の動作のデバッグ
summary: Exec ツールの使用方法、stdin モード、TTY サポート
title: 実行ツール
x-i18n:
    generated_at: "2026-05-02T22:23:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67d2847f70142b326f527a79ffddab1015b897e8ec4d7ce4557430e57fe0956a
    source_path: tools/exec.md
    workflow: 16
---

ワークスペースでシェルコマンドを実行します。`process` により、フォアグラウンド実行とバックグラウンド実行をサポートします。
`process` が許可されていない場合、`exec` は同期的に実行され、`yieldMs`/`background` は無視されます。
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
この遅延時間 (ms) の後にコマンドを自動的にバックグラウンド化します。
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` を待たずに、ただちにコマンドをバックグラウンド化します。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
この呼び出しに対して、設定済みの exec タイムアウトをオーバーライドします。コマンドを exec プロセスのタイムアウトなしで実行する必要がある場合にのみ、`timeout: 0` を設定してください。
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
`host=node` の場合の Node id/name。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
昇格モードを要求します — サンドボックスを抜けて、設定済みのホストパス上で実行します。`elevated` が `full` に解決される場合にのみ、`security=full` が強制されます。
</ParamField>

注:

- `host` のデフォルトは `auto` です。セッションでサンドボックスランタイムがアクティブな場合は sandbox、それ以外の場合は gateway になります。
- `host` が受け付けるのは `auto`、`sandbox`、`gateway`、`node` だけです。ホスト名セレクターではありません。ホスト名のような値は、コマンド実行前に拒否されます。
- `auto` はデフォルトのルーティング戦略であり、ワイルドカードではありません。`auto` から呼び出しごとの `host=node` は許可されます。呼び出しごとの `host=gateway` は、サンドボックスランタイムがアクティブでない場合にのみ許可されます。
- 追加設定がなくても、`host=auto` はそのまま動作します。サンドボックスがなければ `gateway` に解決され、稼働中のサンドボックスがあればサンドボックス内に留まります。
- `elevated` はサンドボックスを抜けて、設定済みのホストパス上で実行します。デフォルトは `gateway`、または `tools.exec.host=node` の場合（またはセッションのデフォルトが `host=node` の場合）は `node` です。現在のセッション/プロバイダーで昇格アクセスが有効な場合にのみ利用できます。
- `gateway`/`node` の承認は `~/.openclaw/exec-approvals.json` で制御されます。
- `node` にはペアリング済み Node（コンパニオンアプリまたはヘッドレス Node ホスト）が必要です。
- 複数の Node が利用可能な場合は、`exec.node` または `tools.exec.node` を設定して 1 つを選択します。
- `exec host=node` は Node 向けの唯一のシェル実行パスです。従来の `nodes.run` ラッパーは削除されました。
- `timeout` は、フォアグラウンド、バックグラウンド、`yieldMs`、Gateway、sandbox、Node の `system.run` 実行に適用されます。省略した場合、OpenClaw は `tools.exec.timeoutSec` を使用します。明示的な `timeout: 0` は、その呼び出しの exec プロセスタイムアウトを無効にします。
- Windows 以外のホストでは、exec は `SHELL` が設定されている場合にそれを使用します。`SHELL` が `fish` の場合は、fish と互換性のないスクリプトを避けるため、`PATH` から `bash`（または `sh`）を優先し、どちらも存在しない場合は `SHELL` にフォールバックします。
- Windows ホストでは、exec は PowerShell 7 (`pwsh`) の検出（Program Files、ProgramW6432、その後 PATH）を優先し、その後 Windows PowerShell 5.1 にフォールバックします。
- ホスト実行（`gateway`/`node`）では、バイナリのハイジャックやコード注入を防ぐため、`env.PATH` とローダーオーバーライド（`LD_*`/`DYLD_*`）を拒否します。
- OpenClaw は、シェル/プロファイルのルールが exec ツールのコンテキストを検出できるように、生成されるコマンド環境（PTY と sandbox 実行を含む）で `OPENCLAW_SHELL=exec` を設定します。
- `openclaw channels login` は対話型のチャンネル認証フローであるため、`exec` からはブロックされます。Gateway ホスト上の端末で実行するか、存在する場合はチャットからチャンネルネイティブのログインツールを使用してください。
- 重要: サンドボックスは**デフォルトでオフ**です。サンドボックスがオフの場合、暗黙の `host=auto` は `gateway` に解決されます。明示的な `host=sandbox` は、Gateway ホスト上で黙って実行されるのではなく、クローズドに失敗します。サンドボックスを有効にするか、承認付きで `host=gateway` を使用してください。
- スクリプトの事前チェック（よくある Python/Node のシェル構文ミス向け）は、有効な `workdir` 境界内にあるファイルだけを検査します。スクリプトパスが `workdir` の外に解決される場合、そのファイルの事前チェックはスキップされます。
- 今すぐ開始する長時間実行の作業では、一度だけ開始し、有効になっている場合は、コマンドが出力するか失敗したときの自動完了ウェイクに依存してください。ログ、ステータス、入力、介入には `process` を使用してください。sleep ループ、timeout ループ、反復ポーリングでスケジューリングを模倣しないでください。
- 後で実行する作業やスケジュール実行する作業には、`exec` の sleep/delay パターンではなく cron を使用してください。

## 設定

- `tools.exec.notifyOnExit`（デフォルト: true）: true の場合、バックグラウンド化された exec セッションは終了時にシステムイベントをキューに入れ、Heartbeat を要求します。
- `tools.exec.approvalRunningNoticeMs`（デフォルト: 10000）: 承認ゲート付きの exec がこの時間を超えて実行された場合に、単一の「実行中」通知を発行します（0 で無効）。
- `tools.exec.timeoutSec`（デフォルト: 1800）: コマンドごとのデフォルト exec タイムアウト（秒）。呼び出しごとの `timeout` がこれをオーバーライドします。呼び出しごとの `timeout: 0` は exec プロセスタイムアウトを無効にします。
- `tools.exec.host`（デフォルト: `auto`; サンドボックスランタイムがアクティブな場合は `sandbox`、それ以外の場合は `gateway` に解決されます）
- `tools.exec.security`（デフォルト: sandbox では `deny`、未設定時の gateway + node では `full`）
- `tools.exec.ask`（デフォルト: `off`）
- 承認なしのホスト exec は gateway + node のデフォルトです。承認/allowlist 動作が必要な場合は、`tools.exec.*` とホストの `~/.openclaw/exec-approvals.json` の両方を厳格にしてください。[Exec 承認](/ja-JP/tools/exec-approvals#yolo-mode-no-approval)を参照してください。
- YOLO はホストポリシーのデフォルト（`security=full`, `ask=off`）に由来し、`host=auto` に由来するものではありません。Gateway または Node ルーティングを強制したい場合は、`tools.exec.host` を設定するか `/exec host=...` を使用してください。
- `security=full` かつ `ask=off` モードでは、ホスト exec は設定済みポリシーに直接従います。追加のヒューリスティックなコマンド難読化事前フィルターや、スクリプト事前チェックによる拒否レイヤーはありません。
- `tools.exec.node`（デフォルト: 未設定）
- `tools.exec.strictInlineEval`（デフォルト: false）: true の場合、`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e` などのインラインインタープリター eval 形式は常に明示的な承認を必要とします。`allow-always` は無害なインタープリター/スクリプト呼び出しを引き続き永続化できますが、インライン eval 形式は毎回プロンプトされます。
- `tools.exec.pathPrepend`: exec 実行時に `PATH` の先頭へ追加するディレクトリのリスト（gateway + sandbox のみ）。
- `tools.exec.safeBins`: 明示的な allowlist エントリなしで実行できる stdin 専用の安全なバイナリ。動作の詳細は [Safe bins](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only) を参照してください。
- `tools.exec.safeBinTrustedDirs`: `safeBins` のパスチェックで信頼される、追加の明示的なディレクトリ。`PATH` エントリが自動的に信頼されることはありません。組み込みのデフォルトは `/bin` と `/usr/bin` です。
- `tools.exec.safeBinProfiles`: safe bin ごとの任意のカスタム argv ポリシー（`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`）。

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

- `host=gateway`: ログインシェルの `PATH` を exec 環境にマージします。ホスト実行では `env.PATH` オーバーライドは拒否されます。デーモン自体は最小限の `PATH` で実行されます。
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: コンテナー内で `sh -lc`（ログインシェル）を実行するため、`/etc/profile` が `PATH` をリセットする場合があります。OpenClaw は内部 env var（シェル補間なし）を介して、プロファイルの読み込み後に `env.PATH` を先頭へ追加します。`tools.exec.pathPrepend` もここで適用されます。
- `host=node`: 渡したブロックされていない env オーバーライドだけが Node に送信されます。`env.PATH` オーバーライドはホスト実行では拒否され、Node ホストでは無視されます。Node で追加の PATH エントリが必要な場合は、Node ホストサービス環境（systemd/launchd）を設定するか、標準の場所にツールをインストールしてください。

エージェントごとの Node バインディング（設定内のエージェントリストインデックスを使用）:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Nodes タブには、同じ設定のための小さな「Exec Node バインディング」パネルがあります。

## セッションオーバーライド（`/exec`）

`/exec` を使用して、`host`、`security`、`ask`、`node` の**セッションごとの**デフォルトを設定します。
現在の値を表示するには、引数なしで `/exec` を送信します。

例:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 認可モデル

`/exec` は**認可済み送信者**（チャンネル allowlist/ペアリングに加えて `commands.useAccessGroups`）に対してのみ尊重されます。
これは**セッション状態のみ**を更新し、設定は書き込みません。exec を強制的に無効化するには、ツールポリシー（`tools.deny: ["exec"]` またはエージェントごと）で拒否してください。`security=full` と `ask=off` を明示的に設定しない限り、ホスト承認は引き続き適用されます。

## Exec 承認（コンパニオンアプリ / Node ホスト）

サンドボックス化されたエージェントでは、`exec` が Gateway または Node ホスト上で実行される前に、リクエストごとの承認を要求できます。
ポリシー、allowlist、UI フローについては [Exec 承認](/ja-JP/tools/exec-approvals) を参照してください。

承認が必要な場合、exec ツールは `status: "approval-pending"` と承認 id を付けてただちに返ります。承認（または拒否 / タイムアウト）されると、Gateway はシステムイベント（`Exec finished` / `Exec denied`）を発行します。コマンドが `tools.exec.approvalRunningNoticeMs` 後もまだ実行中の場合、単一の `Exec running` 通知が発行されます。
ネイティブの承認カード/ボタンがあるチャンネルでは、エージェントはまずそのネイティブ UI に依存し、ツール結果がチャット承認は利用できない、または手動承認が唯一のパスであると明示的に示す場合にのみ、手動の `/approve` コマンドを含めるべきです。

## Allowlist + safe bins

手動 allowlist の適用は、解決済みバイナリパスの glob とベアコマンド名の glob に一致します。ベア名は PATH 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` の場合、`rg` は `/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には一致しません。
`security=allowlist` の場合、シェルコマンドはすべてのパイプラインセグメントが allowlist にあるか safe bin である場合にのみ自動許可されます。チェーン（`;`, `&&`, `||`）とリダイレクトは、allowlist モードでは、すべてのトップレベルセグメントが allowlist（safe bins を含む）を満たさない限り拒否されます。リダイレクトは引き続きサポートされません。
永続的な `allow-always` 信頼はこのルールを迂回しません。チェーンされたコマンドでも、すべてのトップレベルセグメントが一致する必要があります。

`autoAllowSkills` は exec 承認内の別の利便性パスです。手動パス allowlist エントリと同じではありません。厳密で明示的な信頼が必要な場合は、`autoAllowSkills` を無効のままにしてください。

2 つのコントロールは用途ごとに使い分けます。

- `tools.exec.safeBins`: 小さな stdin 専用ストリームフィルター。
- `tools.exec.safeBinTrustedDirs`: safe-bin 実行可能ファイルパス向けの、明示的に追加された信頼済みディレクトリ。
- `tools.exec.safeBinProfiles`: カスタム safe bins 向けの明示的な argv ポリシー。
- allowlist: 実行可能ファイルパスに対する明示的な信頼。

`safeBins` を汎用的な許可リストとして扱わず、インタープリター/ランタイムのバイナリ (たとえば `python3`、`node`、`ruby`、`bash`) を追加しないでください。それらが必要な場合は、明示的な許可リスト項目を使用し、承認プロンプトを有効なままにしてください。
`openclaw security audit` は、インタープリター/ランタイムの `safeBins` 項目に明示的なプロファイルがない場合に警告し、`openclaw doctor --fix` は不足しているカスタム `safeBinProfiles` 項目をスキャフォールドできます。
`openclaw security audit` と `openclaw doctor` は、`jq` のような広範な挙動を持つ bin を `safeBins` に明示的に戻した場合にも警告します。
インタープリターを明示的に許可リストに追加する場合は、インラインのコード評価形式が引き続き新しい承認を必要とするように、`tools.exec.strictInlineEval` を有効にしてください。

完全なポリシーの詳細と例については、[Exec の承認](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only) と [安全な bin と許可リスト](/ja-JP/tools/exec-approvals-advanced#safe-bins-versus-allowlist) を参照してください。

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

ポーリングはオンデマンドのステータス確認用であり、待機ループ用ではありません。自動完了ウェイクが
有効な場合、コマンドは出力を発行したとき、または失敗したときにセッションを起こせます。

キーを送信 (tmux 形式):

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
OpenAI および OpenAI Codex モデルではデフォルトで有効です。無効にしたい場合、または特定のモデルに制限したい場合にのみ
設定を使用してください:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

注:

- OpenAI/OpenAI Codex モデルでのみ利用できます。
- ツールポリシーは引き続き適用されます。`allow: ["write"]` は暗黙的に `apply_patch` を許可します。
- 設定は `tools.exec.applyPatch` の下にあります。
- `tools.exec.applyPatch.enabled` のデフォルトは `true` です。OpenAI モデルでこのツールを無効にするには `false` に設定してください。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true` (ワークスペース内に限定) です。`apply_patch` がワークスペースディレクトリの外で書き込み/削除を行うことを意図している場合にのみ、`false` に設定してください。

## 関連

- [Exec の承認](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [サンドボックス化](/ja-JP/gateway/sandboxing) — サンドボックス環境でのコマンド実行
- [バックグラウンドプロセス](/ja-JP/gateway/background-process) — 長時間実行される exec と process ツール
- [セキュリティ](/ja-JP/gateway/security) — ツールポリシーと昇格アクセス
