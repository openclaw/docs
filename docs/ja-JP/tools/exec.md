---
read_when:
    - exec ツールの使用または変更
    - stdin または TTY の動作のデバッグ
summary: Exec ツールの使用法、stdin モード、TTY サポート
title: 実行ツール
x-i18n:
    generated_at: "2026-05-11T20:38:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43ed3dc70d1998f2f2a3eed70aaf20da61ba93d23b7fa7d378f22e8635c6ec68
    source_path: tools/exec.md
    workflow: 16
---

ワークスペースでシェルコマンドを実行します。`exec` は変更を伴うシェルサーフェスです。選択されたホストまたはサンドボックスのファイルシステムが許可する場所であれば、コマンドはファイルを作成、編集、削除できます。`write`、`edit`、`apply_patch` などの OpenClaw ファイルシステムツールを無効にしても、`exec` は読み取り専用になりません。

`process` によるフォアグラウンド実行とバックグラウンド実行に対応しています。`process` が許可されていない場合、`exec` は同期的に実行され、`yieldMs`/`background` を無視します。
バックグラウンドセッションはエージェントごとにスコープされます。`process` は同じエージェントのセッションのみを参照します。

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
この遅延時間（ms）の後に、コマンドを自動的にバックグラウンド化します。
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` を待たず、コマンドを即座にバックグラウンド化します。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
この呼び出しに対して、設定済みの exec タイムアウトを上書きします。コマンドを exec プロセスタイムアウトなしで実行する必要がある場合のみ、`timeout: 0` を設定します。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
利用可能な場合、疑似端末で実行します。TTY 専用 CLI、コーディングエージェント、ターミナル UI に使用します。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
実行場所。`auto` は、サンドボックスランタイムがアクティブな場合は `sandbox` に、それ以外の場合は `gateway` に解決されます。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
通常のツール呼び出しでは無視されます。`gateway` / `node` のセキュリティは
`tools.exec.security` と `~/.openclaw/exec-approvals.json` によって制御されます。昇格モードで
`security=full` を強制できるのは、オペレーターが明示的に昇格アクセスを許可した場合のみです。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 実行の承認プロンプト動作。
</ParamField>

<ParamField path="node" type="string">
`host=node` の場合の Node ID/名前。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
昇格モードを要求します。サンドボックスを抜け、設定済みホストパスへ移動します。昇格が `full` に解決される場合のみ、`security=full` が強制されます。
</ParamField>

注:

- `host` のデフォルトは `auto` です。セッションでサンドボックスランタイムがアクティブな場合は sandbox、それ以外の場合は gateway になります。
- `host` が受け付けるのは `auto`、`sandbox`、`gateway`、`node` のみです。ホスト名セレクターではありません。ホスト名のような値は、コマンド実行前に拒否されます。
- `auto` はデフォルトのルーティング戦略であり、ワイルドカードではありません。`auto` から呼び出しごとに `host=node` を指定することは許可されます。呼び出しごとの `host=gateway` は、サンドボックスランタイムがアクティブでない場合のみ許可されます。
- 追加設定がなくても、`host=auto` はそのまま動作します。サンドボックスがなければ `gateway` に解決され、稼働中のサンドボックスがあればサンドボックス内に留まります。
- `elevated` は、サンドボックスを抜けて設定済みホストパスへ移動します。デフォルトでは `gateway`、`tools.exec.host=node` の場合（またはセッションのデフォルトが `host=node` の場合）は `node` です。これは、現在のセッション/プロバイダーで昇格アクセスが有効な場合のみ利用できます。
- `gateway`/`node` の承認は `~/.openclaw/exec-approvals.json` によって制御されます。
- `node` にはペアリング済み Node（コンパニオンアプリまたはヘッドレス Node ホスト）が必要です。
- 複数の Node が利用可能な場合は、`exec.node` または `tools.exec.node` を設定して 1 つを選択します。
- `exec host=node` は Node に対する唯一のシェル実行パスです。従来の `nodes.run` ラッパーは削除されました。
- `timeout` は、フォアグラウンド、バックグラウンド、`yieldMs`、gateway、sandbox、Node の `system.run` 実行に適用されます。省略した場合、OpenClaw は `tools.exec.timeoutSec` を使用します。明示的な `timeout: 0` は、その呼び出しの exec プロセスタイムアウトを無効にします。
- Windows 以外のホストでは、exec は `SHELL` が設定されている場合それを使用します。`SHELL` が `fish` の場合、fish と互換性のないスクリプトを避けるため、`PATH` から `bash`（または `sh`）を優先し、どちらも存在しない場合は `SHELL` にフォールバックします。
- Windows ホストでは、exec は PowerShell 7（`pwsh`）の検出（Program Files、ProgramW6432、次に PATH）を優先し、その後 Windows PowerShell 5.1 にフォールバックします。
- ホスト実行（`gateway`/`node`）では、バイナリの乗っ取りや注入コードを防ぐため、`env.PATH` とローダーオーバーライド（`LD_*`/`DYLD_*`）を拒否します。
- OpenClaw は、シェル/プロファイルルールが exec ツールコンテキストを検出できるように、起動されるコマンド環境（PTY とサンドボックス実行を含む）で `OPENCLAW_SHELL=exec` を設定します。
- `openclaw channels login` は対話型のチャンネル認証フローであるため、`exec` からはブロックされます。Gateway ホスト上のターミナルで実行するか、存在する場合はチャットからチャンネルネイティブのログインツールを使用してください。
- 重要: サンドボックス化は**デフォルトでオフ**です。サンドボックス化がオフの場合、暗黙の `host=auto` は `gateway` に解決されます。明示的な `host=sandbox` は、Gateway ホストで黙って実行されるのではなく、クローズドに失敗します。サンドボックス化を有効にするか、承認付きで `host=gateway` を使用してください。
- スクリプトの事前チェック（一般的な Python/Node のシェル構文ミス向け）は、有効な `workdir` 境界内のファイルのみを検査します。スクリプトパスが `workdir` の外に解決される場合、そのファイルの事前チェックはスキップされます。
- 今すぐ開始する長時間実行の作業では、一度だけ開始し、自動完了ウェイクが有効で、コマンドが出力するか失敗したときの自動完了ウェイクに依存してください。ログ、状態、入力、介入には `process` を使用します。sleep ループ、timeout ループ、反復ポーリングでスケジューリングを模倣しないでください。
- 後で実行する作業やスケジュール実行する作業には、`exec` の sleep/遅延パターンではなく cron を使用してください。

## 設定

- `tools.exec.notifyOnExit`（デフォルト: true）: true の場合、バックグラウンド化された exec セッションは終了時にシステムイベントをキューに入れ、Heartbeat を要求します。
- `tools.exec.approvalRunningNoticeMs`（デフォルト: 10000）: 承認ゲート付き exec がこの時間を超えて実行された場合、単一の「running」通知を出します（0 で無効）。
- `tools.exec.timeoutSec`（デフォルト: 1800）: コマンドごとのデフォルト exec タイムアウト秒数。呼び出しごとの `timeout` がこれを上書きします。呼び出しごとの `timeout: 0` は exec プロセスタイムアウトを無効にします。
- `tools.exec.host`（デフォルト: `auto`; サンドボックスランタイムがアクティブな場合は `sandbox`、それ以外の場合は `gateway` に解決）
- `tools.exec.security`（デフォルト: sandbox では `deny`、未設定の場合 gateway + node では `full`）
- `tools.exec.ask`（デフォルト: `off`）
- 承認なしのホスト exec が gateway + node のデフォルトです。承認/allowlist 動作が必要な場合は、`tools.exec.*` とホストの `~/.openclaw/exec-approvals.json` の両方を厳格化してください。[Exec approvals](/ja-JP/tools/exec-approvals#yolo-mode-no-approval) を参照してください。
- YOLO はホストポリシーのデフォルト（`security=full`、`ask=off`）から来るものであり、`host=auto` から来るものではありません。gateway または node へのルーティングを強制したい場合は、`tools.exec.host` を設定するか `/exec host=...` を使用してください。
- `security=full` かつ `ask=off` モードでは、ホスト exec は設定済みポリシーに直接従います。追加のヒューリスティックなコマンド難読化プリフィルターや、スクリプト事前チェックの拒否レイヤーはありません。
- `tools.exec.node`（デフォルト: 未設定）
- `tools.exec.strictInlineEval`（デフォルト: false）: true の場合、`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e` などのインラインインタープリター eval 形式は常に明示的な承認を必要とします。`allow-always` は無害なインタープリター/スクリプト呼び出しを引き続き永続化できますが、インライン eval 形式は毎回プロンプトを表示します。
- `tools.exec.commandHighlighting`（デフォルト: false）: true の場合、承認プロンプトはコマンドテキスト内のパーサー由来のコマンド範囲を強調表示できます。exec 承認ポリシーを変更せずにコマンドテキストの強調表示を有効にするには、グローバルまたはエージェントごとに `true` を設定します。
- `tools.exec.pathPrepend`: exec 実行時に `PATH` の先頭へ追加するディレクトリ一覧（gateway + sandbox のみ）。
- `tools.exec.safeBins`: 明示的な allowlist エントリーなしで実行できる stdin 専用の安全なバイナリ。動作の詳細は [Safe bins](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only) を参照してください。
- `tools.exec.safeBinTrustedDirs`: `safeBins` パスチェックで信頼する追加の明示的ディレクトリ。`PATH` エントリーは自動的に信頼されません。組み込みのデフォルトは `/bin` と `/usr/bin` です。
- `tools.exec.safeBinProfiles`: 安全なバイナリごとの任意のカスタム argv ポリシー（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。

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

- `host=gateway`: ログインシェルの `PATH` を exec 環境へマージします。ホスト実行では `env.PATH` オーバーライドは拒否されます。デーモン自体は引き続き最小限の `PATH` で実行されます。
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: コンテナー内で `sh -lc`（ログインシェル）を実行するため、`/etc/profile` が `PATH` をリセットすることがあります。OpenClaw は、プロファイル読み込み後に内部環境変数経由（シェル補間なし）で `env.PATH` を先頭に追加します。`tools.exec.pathPrepend` もここで適用されます。
- `host=node`: 渡したブロック対象外の環境オーバーライドのみが Node に送信されます。`env.PATH` オーバーライドはホスト実行では拒否され、Node ホストでは無視されます。Node 上で追加の PATH エントリーが必要な場合は、Node ホストサービス環境（systemd/launchd）を設定するか、標準の場所にツールをインストールしてください。

エージェントごとの Node バインディング（設定ではエージェントリストのインデックスを使用）:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

コントロール UI: Nodes タブには、同じ設定用の小さな「Exec node binding」パネルがあります。

## セッションオーバーライド（`/exec`）

`/exec` を使用して、`host`、`security`、`ask`、`node` の**セッションごとの**デフォルトを設定します。
現在の値を表示するには、引数なしで `/exec` を送信します。

例:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 認可モデル

`/exec` は**認可済み送信者**（チャンネル allowlist/ペアリングと `commands.useAccessGroups`）に対してのみ有効です。
これは**セッション状態のみ**を更新し、設定を書き込みません。exec を完全に無効化するには、ツールポリシー（`tools.deny: ["exec"]` またはエージェントごとの設定）で拒否してください。明示的に `security=full` と `ask=off` を設定しない限り、ホスト承認は引き続き適用されます。

## Exec approvals（コンパニオンアプリ / Node ホスト）

サンドボックス化されたエージェントは、Gateway または Node ホストで `exec` が実行される前に、リクエストごとの承認を要求できます。
ポリシー、allowlist、UI フローについては [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

承認が必要な場合、exec ツールは
`status: "approval-pending"` と承認 ID を返して即座に終了します。承認（または拒否 / タイムアウト）されると、
Gateway はシステムイベント（`Exec finished` / `Exec denied`）を発行します。コマンドが
`tools.exec.approvalRunningNoticeMs` を過ぎてもまだ実行中の場合、単一の `Exec running` 通知が発行されます。
ネイティブの承認カード/ボタンを持つチャンネルでは、エージェントはまずそのネイティブ UI に依存し、ツール結果がチャット承認を利用できない、または手動承認が唯一の経路であると明示している場合にのみ、手動の `/approve` コマンドを含めるべきです。

## Allowlist + safe bins

手動 allowlist の適用は、解決済みバイナリパスの glob とベアコマンド名の
glob に一致します。ベア名は PATH 経由で呼び出されたコマンドのみに一致するため、コマンドが `rg` の場合、`rg` は
`/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には一致しません。
`security=allowlist` の場合、シェルコマンドは、すべてのパイプライン
セグメントが allowlist 登録済みまたは安全なバイナリである場合のみ自動許可されます。チェーン（`;`、`&&`、`||`）とリダイレクトは、
すべてのトップレベルセグメントが allowlist（安全なバイナリを含む）を満たす場合を除き、allowlist モードでは拒否されます。リダイレクトは引き続き未対応です。
永続的な `allow-always` 信頼はそのルールをバイパスしません。チェーンされたコマンドでは、引き続きすべての
トップレベルセグメントが一致する必要があります。

`autoAllowSkills` は exec 承認内の別の便利な経路です。これは
手動パス allowlist エントリーと同じではありません。厳密で明示的な信頼が必要な場合は、`autoAllowSkills` を無効のままにしてください。

用途に応じて 2 つの制御を使い分けます:

- `tools.exec.safeBins`: 小さな stdin 専用ストリームフィルター。
- `tools.exec.safeBinTrustedDirs`: safe-bin 実行可能パス用の明示的な追加の信頼済みディレクトリ。
- `tools.exec.safeBinProfiles`: カスタム safe bin 用の明示的な argv ポリシー。
- allowlist: 実行可能パスに対する明示的な信頼。

`safeBins` を汎用 allowlist として扱わず、インタープリター/ランタイムバイナリ（例: `python3`、`node`、`ruby`、`bash`）を追加しないでください。それらが必要な場合は、明示的な allowlist エントリを使用し、承認プロンプトを有効なままにしてください。
`openclaw security audit` は、インタープリター/ランタイムの `safeBins` エントリに明示的なプロファイルがない場合に警告し、`openclaw doctor --fix` は不足しているカスタム `safeBinProfiles` エントリのひな形を生成できます。
`openclaw security audit` と `openclaw doctor` は、`jq` のような広範な動作を持つ bin を `safeBins` に明示的に戻した場合にも警告します。
インタープリターを明示的に allowlist に追加する場合は、インラインコード評価形式が引き続き新しい承認を必要とするように、`tools.exec.strictInlineEval` を有効にしてください。

ポリシーの詳細と例については、[Exec 承認](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only) と [Safe bins と allowlist](/ja-JP/tools/exec-approvals-advanced#safe-bins-versus-allowlist) を参照してください。

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

ポーリングはオンデマンドの状態確認用であり、待機ループ用ではありません。自動完了ウェイクが有効な場合、コマンドは出力を生成したとき、または失敗したときにセッションをウェイクできます。

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

貼り付け（デフォルトで bracketed）:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` は、構造化された複数ファイル編集のための `exec` のサブツールです。
OpenAI および OpenAI Codex モデルではデフォルトで有効です。無効化する場合、または特定のモデルに制限したい場合にのみ設定を使用してください。

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
- `deny: ["write"]` は `apply_patch` を拒否しません。パッチ書き込みもブロックする必要がある場合は、`apply_patch` を明示的に拒否するか、`deny: ["group:fs"]` を使用してください。
- 設定は `tools.exec.applyPatch` の下にあります。
- `tools.exec.applyPatch.enabled` のデフォルトは `true` です。OpenAI モデルでツールを無効化するには `false` に設定してください。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true`（ワークスペース内）です。`apply_patch` がワークスペースディレクトリの外側に書き込み/削除することを意図している場合にのみ、`false` に設定してください。

## 関連

- [Exec 承認](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [サンドボックス化](/ja-JP/gateway/sandboxing) — サンドボックス化された環境でコマンドを実行する
- [バックグラウンドプロセス](/ja-JP/gateway/background-process) — 長時間実行される exec と process ツール
- [セキュリティ](/ja-JP/gateway/security) — ツールポリシーと昇格アクセス
