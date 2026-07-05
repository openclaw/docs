---
read_when:
    - exec ツールの使用または変更
    - stdin または TTY の動作をデバッグする
summary: Execツールの使用方法、stdinモード、TTYサポート
title: 実行ツール
x-i18n:
    generated_at: "2026-07-05T11:54:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64121c1affd7d44ebac49b2cd1986ad393e90a52ddc66d4ddefdfecb4bffa17b
    source_path: tools/exec.md
    workflow: 16
---

ワークスペースでシェルコマンドを実行します。`exec` は変更を伴うシェルサーフェスです。選択されたホストまたはサンドボックスのファイルシステムが許可する場所で、コマンドはファイルを作成、編集、削除できます。`write`、`edit`、`apply_patch` などの OpenClaw ファイルシステムツールを無効にしても、`exec` が読み取り専用になるわけではありません。

`process` によるフォアグラウンド実行とバックグラウンド実行をサポートします。`process` が許可されていない場合、`exec` は同期的に実行され、`yieldMs`/`background` を無視します。バックグラウンドセッションはエージェントごとにスコープされます。`process` は同じエージェントのセッションのみを参照します。

## パラメータ

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
この遅延（ms）の後にコマンドを自動的にバックグラウンド化します。
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` を待たずに、コマンドをただちにバックグラウンド化します。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
この呼び出しの設定済み exec タイムアウトを秒単位で上書きします。フォアグラウンド、バックグラウンド、`yieldMs`、gateway、サンドボックス、node `system.run` 実行に適用されます。`timeout: 0` は、その呼び出しの exec プロセスタイムアウトを無効にします。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
利用可能な場合は疑似ターミナルで実行します。TTY 専用 CLI、コーディングエージェント、ターミナル UI に使用します。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
実行場所。`auto` は、サンドボックスランタイムがアクティブな場合は `sandbox` に、それ以外の場合は `gateway` に解決されます。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
通常のツール呼び出しでは無視されます。`gateway`/`node` のセキュリティは `tools.exec.security` とホスト承認ファイルで制御されます。昇格モードは、オペレーターが明示的に昇格アクセスを許可した場合にのみ `security=full` を強制できます。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
ベースラインの確認モードは `tools.exec.ask` とホスト承認から取得されます。チャネル起点のモデル呼び出しでは、有効なホスト確認が `off` の場合、呼び出しごとの `ask` は無視されます。それ以外の場合は、より厳格なモードへ強化することだけができます。明示的な `ask` 値で exec ツールを構築する信頼済みの内部/API 呼び出し元は変更されません。
</ParamField>

<ParamField path="node" type="string">
`host=node` の場合の Node ID/名前。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
昇格モードをリクエストします。サンドボックスを抜けて設定済みホストパス上で実行します。`security=full` は、elevated が `full` に解決される場合にのみ強制されます。
</ParamField>

注記:

- `host` は `auto`、`sandbox`、`gateway`、`node` のみを受け付けます。これはホスト名セレクターではありません。ホスト名のような値は、コマンド実行前に拒否されます。
- 呼び出しごとの `host=node` は `auto` から許可されます。呼び出しごとの `host=gateway` は、サンドボックスランタイムがアクティブでない場合にのみ許可されます。
- 追加設定がなくても、`host=auto` はそのまま動作します。サンドボックスがない場合は `gateway` に解決され、稼働中のサンドボックスがある場合はサンドボックス内に留まります。
- `elevated` はサンドボックスを抜けて設定済みホストパス上で実行します。デフォルトでは `gateway`、または `tools.exec.host=node` の場合（またはセッションデフォルトが `host=node` の場合）は `node` です。現在のセッション/プロバイダーで昇格アクセスが有効な場合にのみ利用できます。
- `gateway`/`node` の承認はホスト承認ファイルで制御されます。
- `node` にはペアリング済み Node（コンパニオンアプリまたはヘッドレス Node ホスト）が必要です。複数の Node が利用可能な場合は、`exec.node` または `tools.exec.node` を設定して 1 つを選択します。
- `exec host=node` は Node の唯一のシェル実行パスです。従来の `nodes.run` ラッパーは削除されました。
- Windows 以外のホストでは、exec は `SHELL` が設定されている場合にそれを使用します。`SHELL` が `fish` の場合、fish と互換性のない bashism を避けるため、`PATH` から `bash`（または `sh`）を優先し、どちらも存在しない場合に `SHELL` へフォールバックします。
- Windows ホストでは、exec は PowerShell 7（`pwsh`）の検出（Program Files、ProgramW6432、その後 PATH）を優先し、その後 Windows PowerShell 5.1 へフォールバックします。
- Windows 以外の Gateway ホストでは、bash および zsh の exec コマンドは起動時スナップショットを使用します。OpenClaw は、shell 起動ファイルから source 可能なエイリアス/関数と小さな安全な環境セットを `$OPENCLAW_STATE_DIR/cache/shell-snapshots/` に取り込み、各 exec コマンドの前にそのスナップショットを source します。シークレットのように見える変数は除外されます。サンドボックスと node exec はこのスナップショットを使用しません。このスナップショットパスを無効にするには、Gateway プロセス環境で `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` を設定します。
- ホスト実行（`gateway`/`node`）は、バイナリの乗っ取りやコード注入を防ぐため、`env.PATH` とローダーオーバーライド（`LD_*`/`DYLD_*`）を拒否します。
- OpenClaw は、生成されるコマンド環境（PTY とサンドボックス実行を含む）に `OPENCLAW_SHELL=exec` を設定し、shell/profile ルールが exec ツールのコンテキストを検出できるようにします。
- チャネル起点の実行では、チャネルがそれらの ID を提供した場合、OpenClaw は狭い範囲の送信者/チャット ID JSON ペイロードも `OPENCLAW_CHANNEL_CONTEXT` で公開します。
- `exec` は `openclaw channels login` または `/approve` シェルコマンドを実行できません。`openclaw channels login` は対話型のチャネル認証フローであり、`/approve` はシェルではなく承認コマンドハンドラーを通る必要があります。チャネルログインは gateway ホスト上のターミナルで実行するか、存在する場合はチャネル固有のログインエージェントツール（例: `whatsapp_login`）を使用します。
- 重要: サンドボックス化は**デフォルトでオフ**です。サンドボックス化がオフの場合、暗黙の `host=auto` は `gateway` に解決されます。明示的な `host=sandbox` は、gateway ホスト上で黙って実行されるのではなく、引き続き fail closed します。サンドボックス化を有効にするか、承認付きで `host=gateway` を使用してください。
- スクリプトの事前チェック（一般的な Python/Node のシェル構文ミス向け）は、有効な `workdir` 境界内のファイルのみを検査します。スクリプトパスが `workdir` の外に解決される場合、そのファイルの事前チェックはスキップされます。また、`host=gateway` で有効なポリシーが `security=full` かつ `ask=off` の場合、事前チェックは完全にスキップされます。
- すぐに開始する長時間実行の作業では、一度だけ開始し、自動完了 wake が有効で、コマンドが出力を発するか失敗した場合はそれに依存します。ログ、ステータス、入力、介入には `process` を使用してください。sleep ループ、timeout ループ、繰り返しポーリングでスケジューリングを模倣しないでください。
- 後で実行する必要がある作業、またはスケジュール上で実行する必要がある作業には、`exec` の sleep/delay パターンではなく cron を使用してください。

## 設定

| キー                                  | デフォルト                                             | 注記                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | コマンドごとのデフォルト exec タイムアウト（秒）。呼び出しごとの `timeout` がこれを上書きします。呼び出しごとの `timeout: 0` は exec プロセスタイムアウトを無効にします。 |
| `tools.exec.host`                    | `auto`                                                 | サンドボックスランタイムがアクティブな場合は `sandbox` に、それ以外の場合は `gateway` に解決されます。                                                   |
| `tools.exec.security`                | sandbox では `deny`、未設定時の gateway/node では `full` |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | 未設定                                                 | 正規化されたポリシーノブ。下記の[モード](#modes)を参照してください。`tools.exec.security`/`tools.exec.ask` と組み合わせることはできません。              |
| `tools.exec.node`                    | 未設定                                                 |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | true の場合、バックグラウンド化された exec セッションは終了時にシステムイベントをキューに入れ、Heartbeat をリクエストします。                            |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | 承認でゲートされた exec がこれより長く実行された場合に、単一の「実行中」通知を出します（`0` で無効）。                                                   |
| `tools.exec.strictInlineEval`        | `false`                                                | [インライン eval](#inline-eval-strictinlineeval) を参照してください。                                                                                    |
| `tools.exec.commandHighlighting`     | `false`                                                | true の場合、承認プロンプトはコマンドテキスト内のパーサー由来のコマンド範囲をハイライトできます。グローバルまたはエージェントごとに設定します。承認ポリシーは変更されません。 |
| `tools.exec.pathPrepend`             | 未設定                                                 | exec 実行時に `PATH` の先頭へ追加するディレクトリのリスト（gateway + sandbox のみ）。                                                                    |
| `tools.exec.safeBins`                | 未設定                                                 | 明示的な allowlist エントリなしで実行できる stdin 専用の安全なバイナリ。[安全なバイナリ](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only)を参照してください。 |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | `safeBins` のパスチェックで信頼される追加の明示的ディレクトリ。`PATH` エントリは自動的には信頼されません。                                                |
| `tools.exec.safeBinProfiles`         | 未設定                                                 | safe bin ごとの任意のカスタム argv ポリシー（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。                                    |

承認なしのホスト exec は gateway と node のデフォルト（`security=full`、`ask=off`）です。これはホストポリシーのデフォルトに由来し、`host=auto` に由来するものではありません。承認/allowlist の動作が必要な場合は、`tools.exec.*` とホスト承認ファイルの両方を厳格化してください。[Exec 承認](/ja-JP/tools/exec-approvals#yolo-mode-no-approval)を参照してください。サンドボックス状態に関係なく gateway または node ルーティングを強制するには、`tools.exec.host` を設定するか、`/exec host=...` を使用します。

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

### モード

`tools.exec.mode` は正規化されたポリシーノブです。これを設定すると `security`/`ask` が導出され、明示的な `tools.exec.security`/`tools.exec.ask` と組み合わせることはできません。

| モード        | security    | ask       | 動作                                                                                                                       |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Exec は拒否されます。                                                                                                                |
| `allowlist` | `allowlist` | `off`     | 許可リスト済み/安全な bin コマンドのみが実行され、それ以外は確認されません。                                                                 |
| `ask`       | `allowlist` | `on-miss` | 許可リストに一致するものは直接実行され、それ以外は人間に確認されます。                                                                  |
| `auto`      | `allowlist` | `on-miss` | 許可リスト/安全な bin に一致するものは直接実行され、それ以外は人間に確認する前に OpenClaw のネイティブ自動レビューアを経由します。 |
| `full`      | `full`      | `off`     | 承認ゲートはありません。                                                                                                              |

`ask`/`ask=always` は、モードに関係なく毎回人間に確認します。

### インライン eval (`strictInlineEval`)

`tools.exec.strictInlineEval` が `true` の場合、インラインのインタープリター eval 形式にはレビューアまたは明示的な承認が必要です: `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e`、および他のサポート対象インタープリターやコマンドキャリア（`awk`、`find -exec`、`make`、`sed`、`xargs` など）にまたがる類似形式。`mode=auto` では、通常の exec 承認パスにより、ネイティブ自動レビューアが明確に低リスクな単発コマンドを許可できる場合があります。直接の node-host `system.run` 呼び出しは、コマンドを人間の承認ルートへ渡せないため、引き続き明示的な承認が必要です。レビューアが確認を求めた場合、リクエストは人間へ送られます。`allow-always` は無害なインタープリター/スクリプト呼び出しを引き続き永続化できますが、インライン eval 形式が永続的な許可ルールになることはありません。

### PATH の扱い

- `host=gateway`: ログインシェルの `PATH` を exec 環境にマージします。`env.PATH` の上書きはホスト実行では拒否されます。デーモン自体は引き続き最小限の `PATH` で実行されます:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - 起動中にユーザーのシェル設定（`~/.zshenv` や `/etc/zshenv` など）が優先パスを上書きしないように、`tools.exec.pathPrepend` エントリは実行直前、シェルコマンド内の最終的な `PATH` に安全に先頭追加されます。
- `host=sandbox`: コンテナ内で `sh -lc`（ログインシェル）を実行するため、`/etc/profile` が `PATH` をリセットする場合があります。OpenClaw は内部 env var（シェル補間なし）を介して profile の読み込み後に `env.PATH` を先頭追加します。`tools.exec.pathPrepend` もここに適用されます。
- `host=node`: 渡した env 上書きのうち、ブロックされていないものだけがノードへ送信されます。`env.PATH` の上書きはホスト実行では拒否され、node ホストでは無視されます。ノードに追加の PATH エントリが必要な場合は、node ホストサービス環境（systemd/launchd）を設定するか、標準の場所にツールをインストールしてください。

エージェントごとの node バインド（config 内のエージェントリストのインデックスを使用）:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: Nodes タブには、同じ設定用の小さな「Exec node binding」パネルがあります。

## セッション上書き (`/exec`)

`/exec` を使用して、`host`、`security`、`ask`、`node` の**セッションごとの**デフォルトを設定します。現在の値を表示するには、引数なしで `/exec` を送信します。

例:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` は**認可済み送信者**（チャンネル許可リスト/ペアリングに加えて `commands.useAccessGroups`）に対してのみ有効です。これは**セッション状態のみ**を更新し、config には書き込みません。認可済みの外部チャンネル送信者は、これらのセッションデフォルトを設定できます。内部 gateway/webchat クライアントが永続化するには `operator.admin` が必要です。

exec を完全に無効化するには、ツールポリシーで拒否します（`tools.deny: ["exec"]` またはエージェントごと）。明示的に `security=full` と `ask=off` を設定しない限り、ホスト承認は引き続き適用されます。

## Exec 承認（コンパニオンアプリ / node ホスト）

サンドボックス化されたエージェントでは、`exec` が Gateway または node ホストで実行される前に、リクエストごとの承認が必要になる場合があります。ポリシー、許可リスト、UI フローについては [Exec 承認](/ja-JP/tools/exec-approvals) を参照してください。

承認が必要な場合、exec ツールは `status: "approval-pending"` と承認 id を返して即座に終了します。承認（または拒否 / タイムアウト）されると、Gateway は承認済みの実行に対してのみ、コマンド進行状況と完了のシステムイベントを発行します（`Exec running` / `Exec finished`）。拒否またはタイムアウトした承認は終端状態であり、拒否のシステムイベントでエージェントセッションを起こすことはありません。

ネイティブ承認カード/ボタンがあるチャンネルでは、エージェントはまずそのネイティブ UI に依存し、ツール結果がチャット承認を利用できない、または手動承認が唯一のパスであると明示している場合にのみ、手動の `/approve` コマンドを含めるべきです。

## 許可リスト + 安全な bin

手動の許可リスト適用は、解決済みバイナリパスの glob と裸のコマンド名 glob に一致します。裸の名前は PATH 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` の場合は `rg` が `/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には一致しません。

`security=allowlist` の場合、シェルコマンドは、すべてのパイプラインセグメントが許可リスト済みまたは安全な bin の場合にのみ自動許可されます。チェーン（`;`、`&&`、`||`）とリダイレクトは、すべてのトップレベルセグメントが許可リスト（安全な bin を含む）を満たさない限り、allowlist モードで拒否されます。リダイレクトは引き続き未サポートです。永続的な `allow-always` 信頼はそのルールをバイパスしません。チェーンされたコマンドでは、引き続きすべてのトップレベルセグメントが一致する必要があります。

`autoAllowSkills` は exec 承認内の別個の便利パスであり、手動パス許可リストエントリと同じものではありません。厳密で明示的な信頼を求める場合は、`autoAllowSkills` を無効のままにしてください。

2 つのコントロールは異なる用途に使用します:

- `tools.exec.safeBins`: 小さな stdin 専用ストリームフィルター。
- `tools.exec.safeBinTrustedDirs`: 安全な bin 実行可能パス用の明示的な追加信頼済みディレクトリ。
- `tools.exec.safeBinProfiles`: カスタムの安全な bin 用の明示的な argv ポリシー。
- allowlist: 実行可能パスへの明示的な信頼。

`safeBins` を汎用の許可リストとして扱わないでください。また、インタープリター/ランタイムのバイナリ（例: `python3`、`node`、`ruby`、`bash`）を追加しないでください。それらが必要な場合は、明示的な許可リストエントリを使用し、承認プロンプトを有効のままにしてください。

`openclaw security audit` は、インタープリター/ランタイムの `safeBins` エントリに明示的なプロファイルがない場合に警告し、`openclaw doctor --fix` は不足しているカスタム `safeBinProfiles` エントリをスキャフォールドできます。`openclaw security audit` と `openclaw doctor` は、`jq` のような広範な動作を持つ bin を明示的に `safeBins` へ戻した場合にも警告します（`jq` は広範なプログラムとビルトインをサポートするため、代わりに明示的な許可リストエントリまたは承認ゲート付き実行を優先してください）。インタープリターを明示的に許可リスト化する場合は、インライン code-eval 形式に引き続きレビューアまたは明示的な承認が必要になるように、`tools.exec.strictInlineEval` を有効にしてください。

完全なポリシーの詳細と例については、[Exec 承認](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only) と [安全な bin と許可リストの比較](/ja-JP/tools/exec-approvals-advanced#safe-bins-versus-allowlist) を参照してください。

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

ポーリングはオンデマンドのステータス用であり、待機ループ用ではありません。自動完了 wake が有効な場合、コマンドは出力を発行したとき、または失敗したときにセッションを起こすことができます。

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

`apply_patch` は、構造化された複数ファイル編集のための `exec` のサブツールです。これはデフォルトで有効で、どのモデルプロバイダーでも利用できます。`allowModels` で制限できます。無効化したい場合、または特定のモデルに制限したい場合にのみ config を使用してください:

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

- ツールポリシーは引き続き適用されます。`allow: ["write"]` は暗黙的に `apply_patch` を許可します。
- `deny: ["write"]` は `apply_patch` を拒否しません。`apply_patch` を明示的に拒否するか、パッチ書き込みもブロックする必要がある場合は `deny: ["group:fs"]` を使用してください。
- Config は `tools.exec.applyPatch` の下にあります。
- `tools.exec.applyPatch.enabled` のデフォルトは `true` です。ツールを無効化するには `false` に設定します。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true`（ワークスペース内限定）です。`apply_patch` にワークスペースディレクトリ外への書き込み/削除を意図的に許可したい場合にのみ、`false` に設定してください。
- `tools.exec.applyPatch.allowModels` は、モデル id の任意の許可リストです（`gpt-5.4` のような raw、または `openai/gpt-5.4` のような full）。設定されている場合、一致するモデルだけがツールを取得します。未設定の場合、すべてのモデルが取得します。

## 関連

- [Exec 承認](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [サンドボックス化](/ja-JP/gateway/sandboxing) — サンドボックス化された環境でコマンドを実行する
- [バックグラウンドプロセス](/ja-JP/gateway/background-process) — 長時間実行される exec と process ツール
- [セキュリティ](/ja-JP/gateway/security) — ツールポリシーと昇格アクセス
