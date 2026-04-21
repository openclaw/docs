---
read_when:
    - exec ツールの使用または変更
    - stdin または TTY の動作をデバッグする
summary: exec ツールの使用法、stdin モード、TTY サポート
title: Exec ツール
x-i18n:
    generated_at: "2026-04-21T13:39:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5018468f31bb76fc142ddef7002c7bbc617406de7ce912670d1b9edef6a9a042
    source_path: tools/exec.md
    workflow: 15
---

# Exec ツール

ワークスペース内でシェルコマンドを実行します。`process` によるフォアグラウンド + バックグラウンド実行をサポートします。
`process` が許可されていない場合、`exec` は同期実行され、`yieldMs` / `background` は無視されます。
バックグラウンドセッションはエージェントごとにスコープされます。`process` は同じエージェントのセッションだけを参照できます。

## パラメータ

- `command`（必須）
- `workdir`（デフォルトは cwd）
- `env`（キー/値の上書き）
- `yieldMs`（デフォルト 10000）: 遅延後に自動でバックグラウンド化
- `background`（bool）: 即座にバックグラウンド化
- `timeout`（秒、デフォルト 1800）: 期限切れで kill
- `pty`（bool）: 利用可能な場合は疑似端末で実行（TTY 専用 CLI、coding agents、TUI）
- `host`（`auto | sandbox | gateway | node`）: 実行場所
- `security`（`deny | allowlist | full`）: `gateway` / `node` の強制モード
- `ask`（`off | on-miss | always`）: `gateway` / `node` の承認プロンプト
- `node`（string）: `host=node` 用の node ID/名前
- `elevated`（bool）: elevated モードを要求します（sandbox を抜けて設定済み host 経路へ移動）。`security=full` は elevated が `full` に解決される場合にのみ強制されます

注記:

- `host` のデフォルトは `auto` です: セッションで sandbox ランタイムが有効なときは sandbox、それ以外は gateway。
- `auto` はデフォルトのルーティング戦略であり、ワイルドカードではありません。呼び出しごとの `host=node` は `auto` から許可されます。呼び出しごとの `host=gateway` は、sandbox ランタイムが有効でない場合にのみ許可されます。
- 追加設定がなくても、`host=auto` はそのまま「動作します」。sandbox がなければ `gateway` に解決され、生きている sandbox があれば sandbox に留まります。
- `elevated` は、設定済みの host 経路へ sandbox を抜けます。デフォルトは `gateway`、`tools.exec.host=node`（またはセッションデフォルトが `host=node`）のときは `node` です。現在のセッション/プロバイダーで elevated access が有効な場合にのみ利用できます。
- `gateway` / `node` の承認は `~/.openclaw/exec-approvals.json` によって制御されます。
- `node` にはペア済み node（companion app または headless node host）が必要です。
- 複数の node がある場合は、選択のために `exec.node` または `tools.exec.node` を設定してください。
- `exec host=node` は node 用の唯一のシェル実行経路です。旧来の `nodes.run` ラッパーは削除されました。
- Windows 以外の host では、exec は `SHELL` が設定されていればそれを使います。`SHELL` が `fish` の場合は、fish 非互換スクリプトを避けるため、`PATH` 上の `bash`（または `sh`）を優先し、どちらも存在しない場合に `SHELL` へフォールバックします。
- Windows host では、exec はまず PowerShell 7（`pwsh`）の検出を試みます（Program Files、ProgramW6432、次に PATH）。その後、Windows PowerShell 5.1 にフォールバックします。
- Host 実行（`gateway` / `node`）では、バイナリハイジャックや注入コードを防ぐため、`env.PATH` とローダー上書き（`LD_*` / `DYLD_*`）を拒否します。
- OpenClaw は、シェル/プロファイル規則が exec ツールのコンテキストを検出できるよう、生成されたコマンド環境（PTY と sandbox 実行を含む）に `OPENCLAW_SHELL=exec` を設定します。
- 重要: sandboxing は**デフォルトで無効**です。sandboxing が無効な場合、暗黙の `host=auto` は `gateway` に解決されます。明示的な `host=sandbox` は、黙って gateway host で実行されるのではなく、引き続き fail closed します。sandboxing を有効にするか、承認付きで `host=gateway` を使ってください。
- スクリプトの事前チェック（一般的な Python/Node シェル構文ミス向け）は、実効 `workdir` 境界内のファイルだけを検査します。スクリプトパスが `workdir` の外に解決される場合、そのファイルの事前チェックはスキップされます。
- 今すぐ開始する長時間作業では、一度だけ開始し、自動完了 wake が有効なら、コマンドが出力するか失敗したときの自動 wake に任せてください。ログ、ステータス、入力、介入には `process` を使い、sleep ループ、timeout ループ、反復ポーリングでスケジューリングをエミュレートしないでください。
- 後で、またはスケジュールで実行すべき作業には、`exec` の sleep/delay パターンではなく Cron を使ってください。

## 設定

- `tools.exec.notifyOnExit`（デフォルト: true）: true の場合、バックグラウンド化された exec セッションは終了時に system event をキューし、heartbeat を要求します。
- `tools.exec.approvalRunningNoticeMs`（デフォルト: 10000）: 承認ゲート付き exec がこれより長く実行された場合、単一の「running」通知を出します（0 で無効）。
- `tools.exec.host`（デフォルト: `auto`。sandbox ランタイムが有効なら `sandbox`、そうでなければ `gateway` に解決）
- `tools.exec.security`（デフォルト: sandbox では `deny`、gateway + node では未設定時に `full`）
- `tools.exec.ask`（デフォルト: `off`）
- 承認なし host exec は gateway + node のデフォルトです。承認/allowlist 動作が必要な場合は、`tools.exec.*` と host 側の `~/.openclaw/exec-approvals.json` の両方を厳しくしてください。[Exec approvals](/ja-JP/tools/exec-approvals#no-approval-yolo-mode) を参照してください。
- YOLO は `host=auto` 由来ではなく、host ポリシーのデフォルト（`security=full`、`ask=off`）由来です。gateway または node ルーティングを強制したい場合は、`tools.exec.host` を設定するか `/exec host=...` を使ってください。
- `security=full` かつ `ask=off` モードでは、host exec は設定されたポリシーに直接従います。追加のヒューリスティックなコマンド難読化プリフィルタや、スクリプト事前チェック拒否レイヤーはありません。
- `tools.exec.node`（デフォルト: 未設定）
- `tools.exec.strictInlineEval`（デフォルト: false）: true の場合、`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e` のようなインラインインタープリタ eval 形式は常に明示的承認が必要です。`allow-always` は無害なインタープリタ/スクリプト呼び出しを引き続き永続化できますが、インライン eval 形式は毎回プロンプトされます。
- `tools.exec.pathPrepend`: exec 実行時の `PATH` 先頭に追加するディレクトリ一覧（gateway + sandbox のみ）。
- `tools.exec.safeBins`: 明示的な allowlist エントリなしで実行できる、stdin のみの safe binary。動作詳細は [Safe bins](/ja-JP/tools/exec-approvals#safe-bins-stdin-only) を参照してください。
- `tools.exec.safeBinTrustedDirs`: `safeBins` のパスチェックで信頼する追加の明示ディレクトリ。`PATH` エントリは自動では信頼されません。組み込みデフォルトは `/bin` と `/usr/bin` です。
- `tools.exec.safeBinProfiles`: カスタム safe bin ごとの任意の argv ポリシー（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。

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

- `host=gateway`: ログインシェルの `PATH` を exec 環境にマージします。host 実行では `env.PATH` 上書きは拒否されます。デーモン自体は引き続き最小限の `PATH` で実行されます:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: コンテナ内で `sh -lc`（ログインシェル）を実行するため、`/etc/profile` が `PATH` をリセットすることがあります。OpenClaw は内部 env var 経由で、プロファイル読み込み後に `env.PATH` を先頭追加します（シェル補間なし）。`tools.exec.pathPrepend` もここで適用されます。
- `host=node`: あなたが渡した、ブロックされていない env 上書きだけが node に送られます。host 実行では `env.PATH` 上書きは拒否され、node host でも無視されます。node 上で追加の PATH エントリが必要な場合は、node host サービス環境（systemd/launchd）を設定するか、標準場所にツールをインストールしてください。

エージェントごとの node バインディング（設定ではエージェントリスト index を使用）:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Nodes タブには、同じ設定用の小さな「Exec node binding」パネルがあります。

## セッション上書き（`/exec`）

`/exec` を使って、`host`、`security`、`ask`、`node` の**セッションごとの**デフォルトを設定します。
引数なしで `/exec` を送ると現在の値を表示します。

例:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 認可モデル

`/exec` は**認可済み送信者**（チャンネル allowlist/ペアリング + `commands.useAccessGroups`）に対してのみ有効です。
これは**セッション状態のみ**を更新し、設定には書き込みません。exec を完全に無効化するには、ツール
ポリシー（`tools.deny: ["exec"]` またはエージェントごと）で拒否してください。
`security=full` と `ask=off` を明示的に設定しない限り、host 承認は引き続き適用されます。

## Exec approvals（companion app / node host）

sandbox 化されたエージェントでは、exec が gateway または node host 上で実行される前に、リクエストごとの承認を要求できます。
ポリシー、allowlist、UI フローについては [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

承認が必要な場合、exec ツールは
`status: "approval-pending"` と承認 ID を返してすぐに戻ります。承認（または拒否 / タイムアウト）されると、
Gateway は system event（`Exec finished` / `Exec denied`）を発行します。コマンドがまだ
`tools.exec.approvalRunningNoticeMs` 後も実行中であれば、単一の `Exec running` 通知が発行されます。
ネイティブ承認カード/ボタンを持つチャンネルでは、エージェントはまずその
ネイティブ UI に依存し、ツール結果がチャット承認を利用不可と明示する場合、または手動承認が
唯一の経路である場合にのみ、手動の `/approve` コマンドを含めるべきです。

## Allowlist + safe bins

手動 allowlist の強制は、**解決済みバイナリパスのみ**に一致します（basename 一致なし）。
`security=allowlist` の場合、すべてのパイプラインセグメントが
allowlist 済みまたは safe bin であるときにのみ、シェルコマンドは自動許可されます。連結（`;`、`&&`、`||`）とリダイレクトは、
すべてのトップレベルセグメントが allowlist を満たす（safe bins を含む）場合を除き、
allowlist モードでは拒否されます。リダイレクトは引き続き非対応です。
永続的な `allow-always` 信頼でもこの規則は回避されません。連結コマンドでは引き続きすべての
トップレベルセグメントが一致する必要があります。

`autoAllowSkills` は exec approvals における別の利便経路です。これは
手動パス allowlist エントリと同じではありません。厳格で明示的な信頼が必要なら、`autoAllowSkills` を無効のままにしてください。

2 つの制御は用途ごとに使い分けてください。

- `tools.exec.safeBins`: 小さく、stdin のみのストリームフィルタ。
- `tools.exec.safeBinTrustedDirs`: safe-bin 実行可能パス用の明示的な追加信頼ディレクトリ。
- `tools.exec.safeBinProfiles`: カスタム safe bin 用の明示的 argv ポリシー。
- allowlist: 実行可能パスへの明示的信頼。

`safeBins` を汎用 allowlist として扱わないでください。また、インタープリタ/ランタイムバイナリ（たとえば `python3`、`node`、`ruby`、`bash`）を追加しないでください。必要なら、明示的 allowlist エントリを使い、承認プロンプトを有効のままにしてください。
`openclaw security audit` は、インタープリタ/ランタイムの `safeBins` エントリに明示的プロファイルがない場合に警告し、`openclaw doctor --fix` は不足しているカスタム `safeBinProfiles` エントリを雛形生成できます。
`openclaw security audit` と `openclaw doctor` は、`jq` のような広範囲動作 bin を明示的に `safeBins` に戻した場合にも警告します。
インタープリタを明示的に allowlist する場合は、インラインコード eval 形式で引き続き新たな承認が必要になるよう `tools.exec.strictInlineEval` を有効にしてください。

完全なポリシー詳細と例については、[Exec approvals](/ja-JP/tools/exec-approvals#safe-bins-stdin-only) および [Safe bins versus allowlist](/ja-JP/tools/exec-approvals#safe-bins-versus-allowlist) を参照してください。

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

ポーリングはオンデマンドのステータス確認用であり、待機ループ用ではありません。自動完了 wake
が有効であれば、コマンドは出力するか失敗したときにセッションを wake できます。

キー送信（tmux 風）:

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

`apply_patch` は `exec` のサブツールで、構造化された複数ファイル編集を行います。
これは OpenAI および OpenAI Codex モデルでデフォルト有効です。設定が必要なのは、
無効にしたい場合、または特定モデルに制限したい場合だけです。

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

注記:

- OpenAI/OpenAI Codex モデルでのみ利用可能です。
- ツールポリシーは引き続き適用されます。`allow: ["write"]` は暗黙的に `apply_patch` も許可します。
- 設定は `tools.exec.applyPatch` 配下にあります。
- `tools.exec.applyPatch.enabled` のデフォルトは `true` です。OpenAI モデルでこのツールを無効にするには `false` に設定してください。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true`（ワークスペース内限定）です。`apply_patch` でワークスペースディレクトリ外への書き込み/削除を意図的に許可したい場合にのみ `false` に設定してください。

## 関連

- [Exec Approvals](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox 化された環境でのコマンド実行
- [Background Process](/ja-JP/gateway/background-process) — 長時間実行される exec と process ツール
- [セキュリティ](/ja-JP/gateway/security) — ツールポリシーと elevated access
