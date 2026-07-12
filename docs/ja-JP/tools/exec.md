---
read_when:
    - exec ツールの使用または変更
    - 標準入力または TTY の動作をデバッグする
summary: Exec ツールの使用方法、標準入力モード、TTY サポート
title: 実行ツール
x-i18n:
    generated_at: "2026-07-12T14:52:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b8d7c3fcaa670851635cbd029d73f529a50be8c8c4df69565a1f96ea28757d04
    source_path: tools/exec.md
    workflow: 16
---

ワークスペース内でシェルコマンドを実行します。`exec` は変更を伴うシェルサーフェスです。選択したホストまたはサンドボックスのファイルシステムで許可されている範囲なら、コマンドはどこでもファイルを作成、編集、削除できます。`write`、`edit`、`apply_patch` などの OpenClaw ファイルシステムツールを無効にしても、`exec` は読み取り専用にはなりません。

`process` を介したフォアグラウンド実行とバックグラウンド実行をサポートします。`process` が許可されていない場合、`exec` は同期的に実行され、`yieldMs`/`background` を無視します。バックグラウンドセッションはエージェントごとにスコープされ、`process` から参照できるのは同じエージェントのセッションだけです。

## パラメーター

<ParamField path="command" type="string" required>
実行するシェルコマンド。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
コマンドの作業ディレクトリ。
</ParamField>

<ParamField path="env" type="object">
継承した環境にマージして上書きする、キーと値の環境設定。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
この遅延時間（ms）の経過後、コマンドを自動的にバックグラウンド化します。
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` を待たずに、コマンドを直ちにバックグラウンド化します。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
この呼び出しに設定された exec タイムアウトを秒単位で上書きします。フォアグラウンド、バックグラウンド、`yieldMs`、gateway、サンドボックス、および node の `system.run` 実行に適用されます。`timeout: 0` を指定すると、その呼び出しの exec プロセスタイムアウトが無効になります。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
利用可能な場合は擬似端末内で実行します。TTY 専用 CLI、コーディングエージェント、およびターミナル UI に使用します。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
実行場所。サンドボックスランタイムがアクティブな場合、`auto` は `sandbox` に解決され、それ以外の場合は `gateway` に解決されます。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
通常のツール呼び出しでは無視されます。`gateway`/`node` のセキュリティは `tools.exec.security` とホスト承認ファイルによって制御されます。昇格モードで `security=full` を強制できるのは、オペレーターが昇格アクセスを明示的に許可した場合だけです。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
基準となる確認モードは `tools.exec.ask` とホスト承認から取得されます。チャンネル起点のモデル呼び出しでは、有効なホスト確認設定が `off` の場合、呼び出しごとの `ask` は無視されます。それ以外の場合は、より厳格なモードにのみ強化できます。明示的な `ask` 値を使用して exec ツールを構築する、信頼された内部/API 呼び出し元の動作は変わりません。
</ParamField>

<ParamField path="node" type="string">
`host=node` の場合の Node ID/名前。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
昇格モードを要求します。サンドボックスを抜け、設定されたホストパス上で実行します。`security=full` が強制されるのは、昇格が `full` に解決された場合だけです。
</ParamField>

注:

- `host` に指定できるのは `auto`、`sandbox`、`gateway`、`node` だけです。ホスト名を選択するものではありません。ホスト名のような値は、コマンドが実行される前に拒否されます。
- 呼び出しごとの `host=node` は `auto` から指定できます。呼び出しごとの `host=gateway` は、サンドボックスランタイムがアクティブでない場合にのみ指定できます。
- 追加設定がなくても、`host=auto` はそのまま「機能します」。サンドボックスがなければ `gateway` に解決され、稼働中のサンドボックスがあればサンドボックス内に留まります。
- `elevated` はサンドボックスを抜け、設定されたホストパス上で実行します。デフォルトでは `gateway`、`tools.exec.host=node` の場合（またはセッションのデフォルトが `host=node` の場合）は `node` です。現在のセッション/プロバイダーで昇格アクセスが有効な場合にのみ使用できます。
- `gateway`/`node` の承認は、ホスト承認ファイルによって制御されます。
- `node` にはペアリング済み Node（コンパニオンアプリまたはヘッドレス Node ホスト）が必要です。複数の Node が利用可能な場合は、`exec.node` または `tools.exec.node` を設定して選択します。
- `exec host=node` は Node でシェルを実行する唯一の経路です。従来の `nodes.run` ラッパーは削除されました。
- Windows 以外のホストでは、exec は `SHELL` が設定されている場合にそれを使用します。`SHELL` が `fish` の場合、fish と互換性のない bash 構文を避けるため、`PATH` にある `bash`（または `sh`）を優先し、どちらも存在しない場合は `SHELL` にフォールバックします。
- Windows ホストでは、exec は PowerShell 7（`pwsh`）の検出を優先し（Program Files、ProgramW6432、PATH の順）、その後 Windows PowerShell 5.1 にフォールバックします。
- Windows 以外の gateway ホストでは、bash および zsh の exec コマンドは起動時スナップショットを使用します。OpenClaw は、source 可能なエイリアス/関数と、シェル起動ファイルから取得した小規模で安全な環境設定を `$OPENCLAW_STATE_DIR/cache/shell-snapshots/` に保存し、各 exec コマンドの前にそのスナップショットを source します。シークレットらしい変数は除外されます。サンドボックスおよび node の exec はこのスナップショットを使用しません。このスナップショット経路を無効にするには、Gateway プロセス環境で `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` を設定します。
- ホスト実行（`gateway`/`node`）では、バイナリの乗っ取りやコード注入を防ぐため、`env.PATH` およびローダーの上書き（`LD_*`/`DYLD_*`）が拒否されます。
- OpenClaw は、シェル/プロファイルルールが exec ツールのコンテキストを検出できるよう、生成されたコマンド環境（PTY およびサンドボックス実行を含む）に `OPENCLAW_SHELL=exec` を設定します。
- チャンネル起点の実行では、そのチャンネルから該当 ID が提供された場合、OpenClaw は範囲を限定した送信者/チャット ID の JSON ペイロードも `OPENCLAW_CHANNEL_CONTEXT` で公開します。
- `exec` では `openclaw channels login` または `/approve` シェルコマンドを実行できません。`openclaw channels login` は対話型のチャンネル認証フローであり、`/approve` はシェルではなく承認コマンドハンドラーを経由する必要があります。チャンネルへのログインは gateway ホスト上のターミナルで実行するか、利用可能な場合はチャンネル固有のログイン用エージェントツール（例: `whatsapp_login`）を使用します。
- 重要: サンドボックス化は**デフォルトでオフ**です。サンドボックス化がオフの場合、暗黙の `host=auto` は `gateway` に解決されます。明示的な `host=sandbox` は、gateway ホスト上で暗黙に実行されるのではなく、安全側に倒して失敗します。サンドボックス化を有効にするか、承認付きの `host=gateway` を使用してください。
- スクリプトの事前チェック（一般的な Python/Node のシェル構文ミスを対象）は、有効な `workdir` 境界内のファイルのみを検査します。スクリプトのパスが `workdir` 外に解決される場合、そのファイルの事前チェックはスキップされます。また、`host=gateway` かつ有効なポリシーが `security=full`、`ask=off` の場合、事前チェックはすべてスキップされます。
- 今すぐ開始する長時間実行作業は、一度だけ開始し、自動完了ウェイクが有効で、コマンドが出力を生成するか失敗した場合は、それに依存してください。ログ、ステータス、入力、または介入には `process` を使用します。sleep ループ、タイムアウトループ、または反復ポーリングでスケジューリングを模倣しないでください。
- 後で、またはスケジュールに従って実行する作業には、`exec` の sleep/遅延パターンではなく cron を使用してください。

## 設定

| キー                                 | デフォルト                                             | 注記                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | コマンドごとのデフォルトの exec タイムアウト（秒）。呼び出しごとの `timeout` で上書きできます。呼び出しごとの `timeout: 0` で exec プロセスタイムアウトが無効になります。 |
| `tools.exec.host`                    | `auto`                                                 | サンドボックスランタイムがアクティブな場合は `sandbox` に、それ以外の場合は `gateway` に解決されます。                                                 |
| `tools.exec.security`                | sandbox では `deny`、未設定時の gateway/node では `full` |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | 未設定                                                 | 正規化されたポリシー設定。以下の[モード](#modes)を参照してください。`tools.exec.security`/`tools.exec.ask` と組み合わせることはできません。              |
| `tools.exec.reviewer.model`          | 設定されたエージェントのプライマリ                     | `mode=auto` レビュー用のオプションのプロバイダー/モデル上書き。                                                                                         |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | 人間へのフォールバック前に行われる、レビュアーモデルの準備および完了のステージごとのタイムアウト。                                                     |
| `tools.exec.node`                    | 未設定                                                 |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | true の場合、バックグラウンド化された exec セッションは終了時にシステムイベントをキューへ追加し、Heartbeat を要求します。                              |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | 承認が必要な exec がこの時間を超えて実行された場合、単一の「実行中」通知を出します（`0` で無効）。                                                     |
| `tools.exec.strictInlineEval`        | `false`                                                | [インライン評価](#inline-eval-strictinlineeval)を参照してください。                                                                                     |
| `tools.exec.commandHighlighting`     | `false`                                                | true の場合、承認プロンプトで、パーサーによって導出されたコマンド範囲をコマンドテキスト内で強調表示できます。グローバルまたはエージェントごとに設定できます。承認ポリシーは変更されません。 |
| `tools.exec.pathPrepend`             | 未設定                                                 | exec 実行時に `PATH` の先頭へ追加するディレクトリのリスト（gateway + sandbox のみ）。                                                                    |
| `tools.exec.safeBins`                | 未設定                                                 | 明示的な許可リストエントリなしで実行できる、標準入力専用の安全なバイナリ。[安全なバイナリ](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only)を参照してください。 |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | `safeBins` のパスチェックで信頼される追加の明示的ディレクトリ。`PATH` のエントリが自動的に信頼されることはありません。                                  |
| `tools.exec.safeBinProfiles`         | 未設定                                                 | 安全なバイナリごとのオプションのカスタム argv ポリシー（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。                          |

承認なしのホスト exec は gateway および node のデフォルトです（`security=full`、`ask=off`）。これは `host=auto` ではなく、ホストポリシーのデフォルトに由来します。承認/許可リストの動作が必要な場合は、`tools.exec.*` とホスト承認ファイルの両方を厳格化してください。[Exec の承認](/ja-JP/tools/exec-approvals#yolo-mode-no-approval)を参照してください。サンドボックスの状態にかかわらず gateway または node へのルーティングを強制するには、`tools.exec.host` を設定するか、`/exec host=...` を使用します。

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

`tools.exec.mode` は正規化されたポリシー設定です。これを設定すると `security`/`ask` が導出され、明示的な `tools.exec.security`/`tools.exec.ask` と組み合わせることはできません。

| モード      | security    | ask       | 動作                                                                                                                           |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Exec は拒否されます。                                                                                                          |
| `allowlist` | `allowlist` | `off`     | 許可リスト登録済みまたは safe-bin のコマンドのみ実行され、それ以外について確認は行われません。                                |
| `ask`       | `allowlist` | `on-miss` | 許可リストに一致するものは直接実行され、それ以外はすべて人間に確認されます。                                                   |
| `auto`      | `allowlist` | `on-miss` | 許可リストまたは safe-bin に一致するものは直接実行され、それ以外は人間に確認する前に OpenClaw のネイティブ自動レビューを経由します。 |
| `full`      | `full`      | `off`     | 承認ゲートはありません。                                                                                                       |

`ask`/`ask=always` は、モードに関係なく毎回人間に確認します。

自動レビューによる承認は一度限りです。Gateway では、OpenClaw は解決済みの実行可能ファイルパスをレビュアーに渡し、実行をその同じパスに固定します。heredoc、シェル展開、サポートされていないラッパーのクォートなど、強制可能な単一の実行計画に還元できないコマンドは、モデルが許可する場合でも人間による承認にフォールバックします。

明示的なランタイムポリシーまたはネイティブポリシーですでに判断されていない Codex app-server のコマンド承認では、人間による承認経路を使用します。Codex は、レビュー判断を Codex が実行するコマンドに結び付けられる、強制可能な解決済み実行可能ファイルを公開しないため、OpenClaw はこれらのリクエストに対して設定済みの Exec レビュアーを実行しません。

### インライン評価（`strictInlineEval`）

`tools.exec.strictInlineEval` が `true` の場合、インラインのインタープリター評価形式には、レビュアーまたは明示的な承認が必要です。対象には `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e` のほか、サポートされているその他のインタープリターやコマンドキャリア（`awk`、`find -exec`、`make`、`sed`、`xargs` など）での同様の形式が含まれます。`mode=auto` では、通常の Exec 承認経路により、明らかに低リスクな一度限りのコマンドをネイティブ自動レビュアーが許可できる場合があります。一方、Node ホストへの直接の `system.run` 呼び出しでは、コマンドを人間による承認経路に渡せないため、引き続き明示的な承認が必要です。レビュアーが確認を求めた場合、リクエストは人間に送られます。`allow-always` では無害なインタープリターやスクリプトの呼び出しを引き続き永続化できますが、インライン評価形式が永続的な許可ルールになることはありません。

### PATH の処理

- `host=gateway`: ログインシェルの `PATH` を Exec 環境にマージします。ホスト実行では `env.PATH` による上書きは拒否されます。デーモン自体は引き続き最小限の `PATH` で実行されます。
  - macOS: `/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux: `/usr/local/bin`、`/usr/bin`、`/bin`
  - 起動時にユーザーのシェル設定（`~/.zshenv` や `/etc/zshenv` など）が優先パスを上書きするのを防ぐため、実行直前にシェルコマンド内で `tools.exec.pathPrepend` のエントリが最終的な `PATH` の先頭へ安全に追加されます。
- `host=sandbox`: コンテナ内で `sh -lc`（ログインシェル）を実行するため、`/etc/profile` が `PATH` をリセットする場合があります。OpenClaw は、内部環境変数を介してプロファイルの読み込み後に `env.PATH` を先頭へ追加します（シェル補間は行いません）。ここでも `tools.exec.pathPrepend` が適用されます。
- `host=node`: 渡した環境変数のうち、ブロックされていないものだけが Node に送信されます。ホスト実行では `env.PATH` による上書きは拒否され、Node ホストでは無視されます。Node に追加の PATH エントリが必要な場合は、Node ホストサービスの環境（systemd/launchd）を設定するか、標準の場所にツールをインストールしてください。

エージェントごとの Node バインディング（設定内のエージェントリストのインデックスを使用）:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: **Devices** ページには、同じ設定用の小さな「Exec node binding」パネルがあります。

## セッション単位の上書き（`/exec`）

`/exec` を使用して、`host`、`security`、`ask`、`node` の**セッションごとの**デフォルトを設定します。現在の値を表示するには、引数なしで `/exec` を送信します。

例:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` は、**承認済みの送信者**（チャンネルの許可リストまたはペアリングに加えて `commands.useAccessGroups`）に対してのみ有効です。これは**セッション状態のみ**を更新し、設定には書き込みません。承認済みの外部チャンネル送信者は、これらのセッションデフォルトを設定できます。内部の Gateway/Web チャットクライアントがこれらを永続化するには、`operator.admin` が必要です。

Exec を完全に無効化するには、ツールポリシーで拒否してください（`tools.deny: ["exec"]` またはエージェントごとの設定）。`security=full` と `ask=off` を明示的に設定しない限り、ホスト承認は引き続き適用されます。

## Exec の承認（コンパニオンアプリ / Node ホスト）

サンドボックス化されたエージェントでは、Gateway または Node ホストで `exec` を実行する前に、リクエストごとの承認を必須にできます。ポリシー、許可リスト、UI フローについては、[Exec の承認](/ja-JP/tools/exec-approvals)を参照してください。

人間による承認が必要な場合、Node ホストおよび非ネイティブの Gateway フローは、`status: "approval-pending"` と承認 ID を付けて即座に返します。ネイティブチャットおよび Web UI の Gateway フローでは、代わりにその場で待機し、承認後に最終的なコマンド結果を返すことができます。`approval-pending` の結果はコマンドがまだ開始されていないことを意味するため、フォアグラウンドへのフォールバック警告は、承認されたコマンドが実際にその場で実行された場合にのみ表示されます。承認された非同期実行では、コマンドの進行状況と完了を示すシステムイベント（`Exec running` / `Exec finished`）が発行されます。拒否またはタイムアウトした承認は終端状態となり、拒否を示すシステムイベントでエージェントセッションを再開することはありません。

ネイティブの承認カードやボタンを備えたチャンネルでは、エージェントはまずそのネイティブ UI を使用し、ツール結果でチャット承認が利用できない、または手動承認が唯一の経路であると明示された場合にのみ、手動の `/approve` コマンドを含める必要があります。

## 許可リストと safe bin

手動の許可リスト適用では、解決済みバイナリパスの glob と、パスを含まないコマンド名の glob が照合されます。パスを含まない名前は PATH 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` の場合、`rg` は `/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には一致しません。

`security=allowlist` の場合、すべてのパイプラインセグメントが許可リスト登録済みまたは safe bin である場合に限り、シェルコマンドが自動的に許可されます。連結（`;`、`&&`、`||`）とリダイレクトは、すべての最上位セグメントが許可リストを満たす場合（safe bin を含む）を除き、許可リストモードでは拒否されます。リダイレクトは引き続きサポートされません。永続的な `allow-always` の信頼設定でもこのルールを回避できません。連結されたコマンドでは、すべての最上位セグメントが引き続き一致する必要があります。

`autoAllowSkills` は Exec の承認における独立した利便機能であり、手動のパス許可リストエントリとは異なります。厳格かつ明示的な信頼設定にするには、`autoAllowSkills` を無効のままにしてください。

2 つの制御を用途別に使い分けてください。

- `tools.exec.safeBins`: stdin のみを使用する小規模なストリームフィルター。
- `tools.exec.safeBinTrustedDirs`: safe-bin の実行可能ファイルパスに対する、明示的に追加された信頼済みディレクトリ。
- `tools.exec.safeBinProfiles`: カスタム safe bin に対する明示的な argv ポリシー。
- 許可リスト: 実行可能ファイルパスに対する明示的な信頼。

`safeBins` を汎用の許可リストとして扱ったり、インタープリターやランタイムのバイナリ（たとえば `python3`、`node`、`ruby`、`bash`）を追加したりしないでください。それらが必要な場合は、明示的な許可リストエントリを使用し、承認プロンプトを有効のままにしてください。

`openclaw security audit` は、インタープリターやランタイムの `safeBins` エントリに明示的なプロファイルがない場合に警告し、`openclaw doctor --fix` は不足しているカスタム `safeBinProfiles` エントリのひな形を作成できます。`openclaw security audit` と `openclaw doctor` は、`jq` のように幅広い動作が可能な bin を `safeBins` に明示的に再追加した場合にも警告します（`jq` は環境データを読み取り、モジュールや起動ファイルから jq コードを読み込めるため、代わりに明示的な許可リストエントリまたは承認ゲート付きの実行を使用してください）。`jq` は明示的に登録されていても safe bin として拒否されます。インタープリターを明示的に許可リストへ登録する場合は、`tools.exec.strictInlineEval` を有効にして、インラインコード評価形式には引き続きレビュアーまたは明示的な承認が必要となるようにしてください。

ポリシーの詳細と例については、[Exec の承認](/ja-JP/tools/exec-approvals-advanced#safe-bins-stdin-only)および[Safe bin と許可リストの比較](/ja-JP/tools/exec-approvals-advanced#safe-bins-versus-allowlist)を参照してください。

## 例

フォアグラウンド:

```json
{ "tool": "exec", "command": "ls -la" }
```

バックグラウンドとポーリング:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

ポーリングはオンデマンドの状態確認用であり、待機ループ用ではありません。自動完了時の再開が有効な場合、コマンドは出力を生成したとき、または失敗したときにセッションを再開できます。

キーの送信（tmux 形式）:

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

送信（CR のみを送信）:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼り付け（デフォルトでは bracketed paste）:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` は、構造化された複数ファイルの編集を行う `exec` のサブツールです。デフォルトで有効であり、どのモデルプロバイダーでも利用できます。`allowModels` で使用を制限できます。無効にする場合、または特定のモデルに制限する場合にのみ設定を使用してください。

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.6-sol"] },
    },
  },
}
```

注:

- ツールポリシーは引き続き適用されます。`allow: ["write"]` は暗黙的に `apply_patch` を許可します。
- `deny: ["write"]` では `apply_patch` は拒否されません。パッチによる書き込みもブロックする場合は、`apply_patch` を明示的に拒否するか、`deny: ["group:fs"]` を使用してください。
- 設定は `tools.exec.applyPatch` 配下にあります。
- `tools.exec.applyPatch.enabled` のデフォルトは `true` です。ツールを無効にするには `false` に設定します。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true`（ワークスペース内に限定）です。`apply_patch` がワークスペースディレクトリ外へ書き込みまたは削除することを意図している場合にのみ、`false` に設定してください。
- `tools.exec.applyPatch.allowModels` は、モデル ID の任意の許可リストです（`gpt-5.4` のような未修飾形式、または `openai/gpt-5.4` のような完全形式）。設定した場合、一致するモデルだけがツールを使用できます。未設定の場合、すべてのモデルがツールを使用できます。

## 関連項目

- [Exec の承認](/ja-JP/tools/exec-approvals) — シェルコマンドの承認ゲート
- [サンドボックス化](/ja-JP/gateway/sandboxing) — サンドボックス環境でのコマンド実行
- [バックグラウンドプロセス](/ja-JP/gateway/background-process) — 長時間実行される Exec およびプロセスツール
- [セキュリティ](/ja-JP/gateway/security) — ツールポリシーと昇格アクセス
