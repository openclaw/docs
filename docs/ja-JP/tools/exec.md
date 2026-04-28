---
read_when:
    - exec ツールを使う、または変更する場合
    - stdin または TTY の動作をデバッグする場合
summary: Exec ツールの使用方法、stdin モード、TTY サポート
title: Exec ツール
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T14:00:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358f9155120382fa2b03b22e22408bdb9e51715f80c8b1701a1ff7fd05850188
    source_path: tools/exec.md
    workflow: 15
---

ワークスペースでシェルコマンドを実行します。`process` によるフォアグラウンド実行とバックグラウンド実行をサポートします。
`process` が許可されていない場合、`exec` は同期実行され、`yieldMs` / `background` は無視されます。
バックグラウンドセッションはエージェントごとにスコープされます。`process` が参照できるのは同じエージェントのセッションだけです。

## パラメータ

<ParamField path="command" type="string" required>
実行するシェルコマンド。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
コマンドの作業ディレクトリ。
</ParamField>

<ParamField path="env" type="object">
継承した環境変数の上にマージされる、キー/値の環境変数上書き。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
この遅延（ms）の後にコマンドを自動でバックグラウンド化します。
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` を待たずに、ただちにコマンドをバックグラウンド化します。
</ParamField>

<ParamField path="timeout" type="number" default="1800">
この秒数を過ぎたらコマンドを終了します。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
利用可能な場合は擬似端末で実行します。TTY 専用 CLI、コーディングエージェント、端末 UI に使います。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
実行場所。`auto` は、sandbox ランタイムがアクティブな場合は `sandbox` に、そうでない場合は `gateway` に解決されます。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 実行の強制モード。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 実行の承認プロンプト動作。
</ParamField>

<ParamField path="node" type="string">
`host=node` のときの Node id/name。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
昇格モードを要求します — sandbox から、設定されたホストパスへ抜けます。`elevated` が `full` に解決される場合にのみ `security=full` が強制されます。
</ParamField>

注記:

- `host` のデフォルトは `auto` です。セッションで sandbox ランタイムがアクティブなら `sandbox`、そうでなければ `gateway` に解決されます。
- `auto` はデフォルトのルーティング戦略であり、ワイルドカードではありません。呼び出しごとの `host=node` は `auto` から許可されます。呼び出しごとの `host=gateway` は、sandbox ランタイムがアクティブでない場合にのみ許可されます。
- 追加設定がなくても、`host=auto` はそのままで動作します。sandbox がなければ `gateway` に解決され、稼働中の sandbox があればその sandbox 内にとどまります。
- `elevated` は sandbox から、設定されたホストパスへ抜けます。デフォルトでは `gateway`、`tools.exec.host=node`（またはセッションデフォルトが `host=node`）なら `node` です。現在のセッション/Provider で昇格アクセスが有効な場合にのみ利用できます。
- `gateway`/`node` の承認は `~/.openclaw/exec-approvals.json` で制御されます。
- `node` にはペアリング済み Node（companion app または headless node host）が必要です。
- 利用可能な Node が複数ある場合は、`exec.node` または `tools.exec.node` を設定して 1 つ選択してください。
- `exec host=node` は Node 向けの唯一のシェル実行経路です。レガシーの `nodes.run` ラッパーは削除されています。
- Windows 以外のホストでは、exec は `SHELL` が設定されていればそれを使用します。`SHELL` が `fish` の場合は、fish 非互換スクリプトを避けるため、まず `PATH` 上の `bash`（または `sh`）を優先し、どちらもなければ `SHELL` にフォールバックします。
- Windows ホストでは、exec はまず PowerShell 7（`pwsh`）を探索し（Program Files、ProgramW6432、次に PATH）、その後 Windows PowerShell 5.1 にフォールバックします。
- ホスト実行（`gateway`/`node`）では、バイナリハイジャックやコード注入を防ぐため、`env.PATH` とローダー上書き（`LD_*`/`DYLD_*`）は拒否されます。
- OpenClaw は、シェル/プロファイルのルールが exec ツールの文脈を検出できるよう、生成されたコマンド環境（PTY と sandbox 実行を含む）に `OPENCLAW_SHELL=exec` を設定します。
- 重要: sandboxing は**デフォルトではオフ**です。sandboxing がオフの場合、暗黙の `host=auto` は `gateway` に解決されます。明示的な `host=sandbox` は、黙って gateway ホスト上で実行されるのではなく、クローズドフェイルします。sandboxing を有効にするか、承認付きで `host=gateway` を使ってください。
- スクリプトの preflight チェック（Python/Node の一般的なシェル構文ミス向け）は、有効な `workdir` 境界内のファイルだけを検査します。スクリプトパスが `workdir` の外側に解決される場合、そのファイルの preflight はスキップされます。
- 今すぐ始まる長時間実行の処理では、一度だけ開始し、自動完了 wake が有効なら、コマンドが出力を出すか失敗したときの自動 wake に任せてください。ログ、ステータス、入力、介入には `process` を使ってください。sleep ループ、timeout ループ、繰り返しポーリングでスケジューリングをまねしないでください。
- 後で実行する、またはスケジュール実行する処理には、`exec` の sleep/delay パターンではなく Cron を使ってください。

## 設定

- `tools.exec.notifyOnExit`（デフォルト: true）: true の場合、バックグラウンド化された exec セッションは終了時に system event をキューに入れ、Heartbeat を要求します。
- `tools.exec.approvalRunningNoticeMs`（デフォルト: 10000）: 承認が必要な exec がこの時間を超えて実行されると、単一の「running」通知を出します（0 で無効）。
- `tools.exec.host`（デフォルト: `auto`。sandbox ランタイムがアクティブな場合は `sandbox`、そうでない場合は `gateway` に解決）
- `tools.exec.security`（デフォルト: sandbox では `deny`、gateway + node では未設定時に `full`）
- `tools.exec.ask`（デフォルト: `off`）
- gateway + node では、承認なしホスト exec がデフォルトです。承認/allowlist 動作が必要なら、`tools.exec.*` とホスト側の `~/.openclaw/exec-approvals.json` の両方を厳しくしてください。詳しくは [Exec approvals](/ja-JP/tools/exec-approvals#no-approval-yolo-mode) を参照してください。
- YOLO は `host=auto` ではなく、ホストポリシーデフォルト（`security=full`、`ask=off`）から来ます。gateway または node ルーティングを強制したい場合は、`tools.exec.host` を設定するか `/exec host=...` を使ってください。
- `security=full` かつ `ask=off` モードでは、ホスト exec は設定済みポリシーに直接従います。追加のヒューリスティックなコマンド難読化プレフィルタやスクリプト preflight 拒否レイヤーはありません。
- `tools.exec.node`（デフォルト: 未設定）
- `tools.exec.strictInlineEval`（デフォルト: false）: true の場合、`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e` のようなインラインインタープリタ eval 形式は、常に明示的な承認が必要です。`allow-always` で無害なインタープリタ/スクリプト呼び出しを永続化することはできますが、インライン eval 形式は毎回プロンプトが出ます。
- `tools.exec.pathPrepend`: exec 実行時の `PATH` の先頭に追加するディレクトリ一覧（gateway + sandbox のみ）。
- `tools.exec.safeBins`: 明示的な allowlist エントリなしで実行できる、stdin 専用の安全なバイナリ。動作の詳細は [Safe bins](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only) を参照してください。
- `tools.exec.safeBinTrustedDirs`: `safeBins` のパスチェックで信頼する追加の明示的ディレクトリ。`PATH` エントリは自動的には信頼されません。組み込みデフォルトは `/bin` と `/usr/bin` です。
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

### PATH の扱い

- `host=gateway`: ログインシェルの `PATH` を exec 環境にマージします。`env.PATH` の上書きはホスト実行では拒否されます。デーモン自体は引き続き最小限の `PATH` で動作します。
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: コンテナ内で `sh -lc`（ログインシェル）を実行するため、`/etc/profile` が `PATH` をリセットすることがあります。OpenClaw は、profile 読み込み後に内部環境変数を通じて `env.PATH` を先頭追加します（シェル補間なし）。`tools.exec.pathPrepend` もここで適用されます。
- `host=node`: 渡した、ブロックされていない環境変数上書きだけが Node に送られます。`env.PATH` の上書きはホスト実行では拒否され、Node ホストでは無視されます。Node 上で追加の PATH エントリが必要な場合は、Node ホストサービス環境（systemd/launchd）を設定するか、標準的な場所にツールをインストールしてください。

エージェントごとの Node バインディング（設定ではエージェント一覧インデックスを使用）:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Nodes タブには、同じ設定向けの小さな「Exec node binding」パネルもあります。

## セッション上書き（`/exec`）

`/exec` を使うと、`host`、`security`、`ask`、`node` の**セッションごとの**デフォルトを設定できます。
引数なしで `/exec` を送ると現在値を表示します。

例:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 認可モデル

`/exec` は**認可済み送信者**に対してのみ有効です（チャネル allowlist/ペアリングと `commands.useAccessGroups`）。
これは**セッション状態のみ**を更新し、設定には書き込みません。exec を完全に無効化したい場合は、ツールポリシー（`tools.deny: ["exec"]` またはエージェントごと）で拒否してください。
`security=full` と `ask=off` を明示的に設定しない限り、ホスト承認は引き続き適用されます。

## Exec approvals（companion app / node host）

sandbox 化されたエージェントでは、exec が gateway または node host 上で実行される前に、リクエストごとの承認が必要になる場合があります。
ポリシー、allowlist、UI フローについては [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

承認が必要な場合、exec ツールは `status: "approval-pending"` と承認 id を返してただちに戻ります。承認（または拒否 / タイムアウト）後、Gateway は system event（`Exec finished` / `Exec denied`）を発行します。コマンドが `tools.exec.approvalRunningNoticeMs` を超えてまだ実行中の場合は、単一の `Exec running` 通知が発行されます。
ネイティブ承認カード/ボタンを持つチャネルでは、エージェントはまずそのネイティブ UI に依存し、ツール結果がチャット承認を利用できない、または手動承認しか手段がないと明示した場合にのみ、手動の `/approve` コマンドを含めるべきです。

## Allowlist + safe bins

手動 allowlist の強制は、解決済みバイナリパス glob と、裸のコマンド名 glob に一致させます。裸の名前は PATH 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` なら `rg` は `/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には一致しません。
`security=allowlist` の場合、シェルコマンドは、すべてのパイプラインセグメントが allowlist 済みか safe bin であるときにのみ自動許可されます。チェーン（`;`、`&&`、`||`）とリダイレクトは、すべてのトップレベルセグメントが allowlist を満たす（safe bin を含む）場合を除いて、allowlist モードでは拒否されます。リダイレクトは引き続き未対応です。
永続的な `allow-always` 信頼でもこのルールは回避できません。チェーンされたコマンドでは、すべてのトップレベルセグメントが一致する必要があります。

`autoAllowSkills` は exec approvals 内の別個の利便経路です。手動パス allowlist エントリと同じものではありません。厳密で明示的な信頼が必要なら、`autoAllowSkills` は無効のままにしてください。

2 つの制御は異なる用途に使ってください。

- `tools.exec.safeBins`: 小さな stdin 専用ストリームフィルタ。
- `tools.exec.safeBinTrustedDirs`: safe bin 実行ファイルパス向けの、明示的な追加信頼ディレクトリ。
- `tools.exec.safeBinProfiles`: カスタム safe bin 向けの明示的な argv ポリシー。
- allowlist: 実行ファイルパスへの明示的信頼。

`safeBins` を汎用 allowlist として扱わず、インタープリタ/ランタイムのバイナリ（例: `python3`、`node`、`ruby`、`bash`）を追加しないでください。それらが必要なら、明示的な allowlist エントリを使い、承認プロンプトを有効のままにしてください。
`openclaw security audit` は、インタープリタ/ランタイムの `safeBins` エントリに明示的なプロファイルがない場合に警告を出し、`openclaw doctor --fix` は欠けているカスタム `safeBinProfiles` エントリのひな形を生成できます。
`openclaw security audit` と `openclaw doctor` は、`jq` のような広範な動作を持つバイナリを明示的に `safeBins` に戻した場合にも警告します。
インタープリタを明示的に allowlist する場合は、インラインコード eval 形式でも毎回新しい承認が必要になるように `tools.exec.strictInlineEval` を有効にしてください。

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

ポーリングはオンデマンドのステータス確認用であり、待機ループ用ではありません。自動完了 wake が有効なら、コマンドは出力を出すか失敗したときにセッションを wake できます。

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

貼り付け（デフォルトでは bracketed）:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` は、構造化された複数ファイル編集のための `exec` のサブツールです。
OpenAI および OpenAI Codex モデルではデフォルトで有効です。無効化したい場合や、特定のモデルに制限したい場合にのみ設定を使用してください。

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
- ツールポリシーは引き続き適用されます。`allow: ["write"]` は暗黙的に `apply_patch` も許可します。
- 設定は `tools.exec.applyPatch` 配下にあります。
- `tools.exec.applyPatch.enabled` のデフォルトは `true` です。OpenAI モデルでこのツールを無効にするには `false` に設定してください。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true`（ワークスペース内限定）です。`apply_patch` がワークスペースディレクトリ外へ書き込み/削除できるよう意図的にしたい場合にのみ `false` に設定してください。

## 関連

- [Exec approvals](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox 化された環境でコマンドを実行する
- [バックグラウンドプロセス](/ja-JP/gateway/background-process) — 長時間実行の exec と process ツール
- [Security](/ja-JP/gateway/security) — ツールポリシーと昇格アクセス
