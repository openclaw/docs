---
read_when:
    - Exec tool を使う、または変更する場合
    - stdin や TTY の動作をデバッグする場合
summary: Exec tool の使い方、stdin モード、TTY サポート
title: Exec tool
x-i18n:
    generated_at: "2026-04-24T05:24:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cad17fecfaf7d6a523282ef4f0090e4ffaab89ab53945b5cd831e426f3fc3ac
    source_path: tools/exec.md
    workflow: 15
---

workspace でシェルコマンドを実行します。`process` によるフォアグラウンド + バックグラウンド実行をサポートします。
`process` が許可されていない場合、`exec` は同期実行され、`yieldMs`/`background` は無視されます。
バックグラウンドセッションはエージェント単位でスコープされます。`process` は同じエージェントのセッションだけを参照します。

## パラメーター

<ParamField path="command" type="string" required>
実行するシェルコマンド。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
コマンドの作業ディレクトリ。
</ParamField>

<ParamField path="env" type="object">
継承された環境の上にマージされるキー/値の環境上書き。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
この遅延（ms）の後でコマンドを自動的にバックグラウンド化します。
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` を待たずに、ただちにコマンドをバックグラウンド化します。
</ParamField>

<ParamField path="timeout" type="number" default="1800">
この秒数を過ぎたらコマンドを kill します。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
利用可能な場合は擬似端末で実行します。TTY 専用 CLI、コーディング agent、ターミナル UI に使います。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
実行場所。`auto` は、sandbox ランタイムがアクティブな場合は `sandbox` に、そうでなければ `gateway` に解決されます。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 実行の enforcement mode。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 実行の承認プロンプト動作。
</ParamField>

<ParamField path="node" type="string">
`host=node` のときの Node id/name。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
elevated mode を要求します — sandbox を抜けて設定済み host パス上で実行します。`security=full` が強制されるのは、elevated が `full` に解決された場合だけです。
</ParamField>

メモ:

- `host` のデフォルトは `auto` です: セッションで sandbox ランタイムがアクティブなら sandbox、そうでなければ gateway。
- `auto` はデフォルトのルーティング戦略であり、ワイルドカードではありません。`auto` からの呼び出しごとの `host=node` は許可されます。呼び出しごとの `host=gateway` は、sandbox ランタイムがアクティブでない場合にのみ許可されます。
- 追加設定がなくても、`host=auto` はそのまま「ただ動きます」: sandbox がなければ `gateway` に解決され、生きている sandbox があれば sandbox 内に留まります。
- `elevated` は sandbox を抜けて設定済み host パス上で実行します: デフォルトでは `gateway`、`tools.exec.host=node`（またはセッションデフォルトが `host=node`）なら `node`。これは、現在のセッション/provider で elevated access が有効な場合にのみ利用できます。
- `gateway`/`node` の承認は `~/.openclaw/exec-approvals.json` で制御されます。
- `node` にはペアリング済み Node（companion app または headless Node host）が必要です。
- 複数の Node が利用可能な場合は、1 つ選ぶために `exec.node` または `tools.exec.node` を設定してください。
- `exec host=node` は Node 用の唯一のシェル実行パスです。旧来の `nodes.run` ラッパーは削除されました。
- 非 Windows host では、exec は設定されていれば `SHELL` を使います。`SHELL` が `fish` の場合は、fish 非互換スクリプトを避けるため、`PATH` 上の `bash`（または `sh`）を優先し、それらが存在しない場合のみ `SHELL` にフォールバックします。
- Windows host では、exec はまず PowerShell 7（`pwsh`）の検出（Program Files、ProgramW6432、次に PATH）を優先し、その後 Windows PowerShell 5.1 にフォールバックします。
- Host 実行（`gateway`/`node`）では、バイナリ hijacking や注入コードを防ぐため、
  `env.PATH` と loader 上書き（`LD_*`/`DYLD_*`）を拒否します。
- OpenClaw は、シェル/プロファイルルールが exec-tool コンテキストを検出できるよう、spawn されたコマンド環境（PTY と sandbox 実行を含む）で `OPENCLAW_SHELL=exec` を設定します。
- 重要: sandbox 化は**デフォルトでオフ**です。sandbox 化がオフの場合、暗黙の `host=auto` は `gateway` に解決されます。明示的な `host=sandbox` は、黙って gateway host 上で動くのではなく、クローズドに失敗します。sandbox 化を有効にするか、承認付きで `host=gateway` を使ってください。
- スクリプト preflight チェック（一般的な Python/Node シェル構文ミス向け）は、
  有効な `workdir` 境界内のファイルだけを検査します。スクリプトパスが `workdir` の外に解決される場合、
  そのファイルの preflight はスキップされます。
- 今すぐ始める長時間の作業では、1 回だけ開始し、自動完了 wake が有効で、コマンドが出力するか失敗したときに起きることを前提にしてください。
  ログ、状態、入力、介入には `process` を使ってください。sleep ループ、
  timeout ループ、繰り返し polling でスケジューリングを模倣しないでください。
- 後で実行すべき作業や定期実行する作業には、
  `exec` の sleep/delay パターンではなく Cron を使ってください。

## Config

- `tools.exec.notifyOnExit`（デフォルト: true）: true の場合、バックグラウンド化された exec セッションは終了時にシステムイベントを enqueue し、Heartbeat を要求します。
- `tools.exec.approvalRunningNoticeMs`（デフォルト: 10000）: 承認ゲート付き exec がこの時間を超えて実行されると、単一の「running」通知を出します（0 で無効）。
- `tools.exec.host`（デフォルト: `auto`; sandbox ランタイムがアクティブなら `sandbox`、そうでなければ `gateway` に解決）
- `tools.exec.security`（デフォルト: sandbox では `deny`、未設定時の gateway + node では `full`）
- `tools.exec.ask`（デフォルト: `off`）
- 承認なし host exec は gateway + node のデフォルトです。承認/allowlist 動作が必要なら、`tools.exec.*` と host の `~/.openclaw/exec-approvals.json` の両方を厳しくしてください。[Exec approvals](/ja-JP/tools/exec-approvals#no-approval-yolo-mode) を参照してください。
- YOLO は `host=auto` ではなく、host-policy デフォルト（`security=full`, `ask=off`）から来ます。gateway または node ルーティングを強制したい場合は、`tools.exec.host` を設定するか `/exec host=...` を使ってください。
- `security=full` かつ `ask=off` モードでは、host exec は設定済みポリシーに直接従います。追加のヒューリスティックなコマンド難読化 prefilter や script-preflight 拒否レイヤーはありません。
- `tools.exec.node`（デフォルト: 未設定）
- `tools.exec.strictInlineEval`（デフォルト: false）: true の場合、`python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` のようなインラインインタープリター eval 形式は、常に明示的承認が必要になります。`allow-always` で無害なインタープリター/スクリプト呼び出しを永続化することはできますが、インライン eval 形式は毎回プロンプトされます。
- `tools.exec.pathPrepend`: exec 実行時に `PATH` の先頭に追加するディレクトリ一覧（gateway + sandbox のみ）。
- `tools.exec.safeBins`: 明示的 allowlist エントリーなしで実行できる stdin 専用 safe binary。動作の詳細は [Safe bins](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only) を参照してください。
- `tools.exec.safeBinTrustedDirs`: `safeBins` のパスチェックで信頼する追加の明示的ディレクトリ。`PATH` エントリーが自動的に信頼されることはありません。組み込みデフォルトは `/bin` と `/usr/bin` です。
- `tools.exec.safeBinProfiles`: custom safe bin ごとの任意の argv ポリシー（`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`）。

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

- `host=gateway`: あなたの login-shell の `PATH` を exec 環境にマージします。`env.PATH` 上書きは
  host 実行では拒否されます。daemon 自体は引き続き最小の `PATH` で動作します:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: コンテナ内で `sh -lc`（login shell）を実行するため、`/etc/profile` が `PATH` をリセットすることがあります。
  OpenClaw は profile 読み込み後に内部 env var 経由で `env.PATH` を先頭追加します（シェル補間なし）。
  `tools.exec.pathPrepend` もここに適用されます。
- `host=node`: あなたが渡したブロックされていない env 上書きだけが Node に送られます。`env.PATH` 上書きは
  host 実行では拒否され、Node host では無視されます。Node 上で追加の PATH エントリーが必要な場合は、
  Node host サービス環境（systemd/launchd）を設定するか、標準的な場所に tool を install してください。

エージェントごとの Node binding（config では agent list index を使う）:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

制御 UI: Nodes タブには同じ設定のための小さな「Exec node binding」パネルがあります。

## セッション上書き（`/exec`）

`/exec` を使うと、`host`、`security`、`ask`、`node` の**セッションごとの**デフォルトを設定できます。
現在値を表示するには、引数なしで `/exec` を送ってください。

例:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 認可モデル

`/exec` は**認可された送信者**に対してのみ有効です（チャネル allowlist/ペアリング + `commands.useAccessGroups`）。
これは**セッション state のみ**を更新し、config には書き込みません。exec を完全に無効化するには、tool
ポリシー（`tools.deny: ["exec"]` またはエージェントごと）で拒否してください。
`security=full` と `ask=off` を明示設定しない限り、host 承認は引き続き適用されます。

## Exec approvals（companion app / Node host）

sandbox 化された agent は、gateway または Node host 上で `exec` を実行する前に、リクエストごとの承認を要求できます。
ポリシー、allowlist、UI フローについては [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

承認が必要な場合、exec tool は
`status: "approval-pending"` と承認 ID を返してただちに戻ります。承認（または拒否 / timeout）後、
Gateway はシステムイベント（`Exec finished` / `Exec denied`）を送出します。コマンドが
`tools.exec.approvalRunningNoticeMs` を超えてまだ実行中なら、単一の `Exec running` 通知が送出されます。
ネイティブ承認カード/ボタンを持つチャネルでは、agent はまずその
ネイティブ UI に依存し、chat 承認が利用できない、または手動承認が唯一の経路だと tool
結果が明示した場合にのみ、手動の `/approve` コマンドを含めるべきです。

## Allowlist + safe bins

手動 allowlist enforcement は**解決済みバイナリパスのみ**に一致します（basename 一致はしません）。
`security=allowlist` の場合、すべての pipeline segment が
allowlist 済みまたは safe bin であるときにのみ、シェルコマンドは自動許可されます。chaining（`;`, `&&`, `||`）と redirection は、
すべてのトップレベル segment が allowlist（safe bins を含む）を満たさない限り、
allowlist モードで拒否されます。redirection は依然として未サポートです。
永続的な `allow-always` trust でもこのルールは回避されません。chained コマンドでは、依然としてすべての
トップレベル segment が一致する必要があります。

`autoAllowSkills` は exec approvals における別の便宜パスです。これは
手動パス allowlist エントリーと同じものではありません。厳密に明示的な trust が必要なら、`autoAllowSkills` は無効のままにしてください。

2 つの制御は用途を分けて使ってください。

- `tools.exec.safeBins`: 小さな stdin 専用ストリームフィルター。
- `tools.exec.safeBinTrustedDirs`: safe-bin 実行ファイルパス用の、明示的な追加信頼ディレクトリ。
- `tools.exec.safeBinProfiles`: custom safe bins 用の明示的 argv ポリシー。
- allowlist: 実行ファイルパスへの明示的 trust。

`safeBins` を汎用 allowlist として扱わないでください。また、インタープリター/ランタイムバイナリ（たとえば `python3`, `node`, `ruby`, `bash`）を追加しないでください。これらが必要な場合は、明示的 allowlist エントリーを使い、承認プロンプトを有効のままにしてください。
`openclaw security audit` は、インタープリター/ランタイムの `safeBins` エントリーに明示的 profile が欠けている場合に警告し、`openclaw doctor --fix` は不足している custom `safeBinProfiles` エントリーを足場生成できます。
`openclaw security audit` と `openclaw doctor` は、`jq` のような広範な動作を持つ bin を明示的に `safeBins` に追加した場合にも警告します。
インタープリターを明示的に allowlist する場合は、インライン code-eval 形式で新たな承認が必要になるよう、`tools.exec.strictInlineEval` を有効にしてください。

完全なポリシー詳細と例については、[Exec approvals](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only) と [Safe bins versus allowlist](/ja-JP/tools/exec-approvals-advanced#safe-bins-versus-allowlist) を参照してください。

## 例

フォアグラウンド:

```json
{ "tool": "exec", "command": "ls -la" }
```

バックグラウンド + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

polling はオンデマンド状態確認用であり、待機ループ用ではありません。自動完了 wake
が有効なら、コマンドは出力または失敗時にセッションを起こせます。

キー送信（tmux 形式）:

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

送信（CR のみを送る）:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼り付け（デフォルトで bracketed）:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` は、構造化された複数ファイル編集のための `exec` の subtool です。
OpenAI および OpenAI Codex モデルではデフォルトで有効です。無効化したい場合、または特定モデルのみに制限したい場合にのみ config を使ってください。

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

メモ:

- OpenAI/OpenAI Codex モデルでのみ利用可能です。
- tool policy は引き続き適用されます。`allow: ["write"]` は暗黙的に `apply_patch` を許可します。
- config は `tools.exec.applyPatch` 配下にあります。
- `tools.exec.applyPatch.enabled` のデフォルトは `true` です。OpenAI モデルでこの tool を無効化するには `false` に設定してください。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true`（workspace 内限定）です。`apply_patch` に workspace ディレクトリ外への書き込み/削除を意図的に許可したい場合にのみ `false` に設定してください。

## 関連

- [Exec Approvals](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox 化環境でコマンドを実行する
- [Background Process](/ja-JP/gateway/background-process) — 長時間実行の exec と process tool
- [Security](/ja-JP/gateway/security) — tool policy と elevated access
