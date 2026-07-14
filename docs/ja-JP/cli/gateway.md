---
read_when:
    - CLI から Gateway を実行する（開発環境またはサーバー）
    - Gateway の認証、バインドモード、接続性のデバッグ
    - Bonjour による Gateway の検出（ローカル + 広域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway の実行、照会、検出
title: Gateway
x-i18n:
    generated_at: "2026-07-14T13:35:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: fbbd236611d20a703b64719c2f05a95554107b8e847fb1a4dca55025890f238d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway は OpenClaw の WebSocket サーバー（チャンネル、Node、セッション、フック）です。以下のすべてのサブコマンドは `openclaw gateway ...` の下にあります。

<CardGroup cols={3}>
  <Card title="Bonjour 検出" href="/ja-JP/gateway/bonjour">
    ローカル mDNS + 広域 DNS-SD のセットアップ。
  </Card>
  <Card title="検出の概要" href="/ja-JP/gateway/discovery">
    OpenClaw が Gateway を公開および検出する仕組み。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration">
    トップレベルの Gateway 設定キー。
  </Card>
</CardGroup>

## Gateway を実行する

```bash
openclaw gateway
openclaw gateway run   # equivalent, explicit form
```

<AccordionGroup>
  <Accordion title="起動時の動作">
    - `~/.openclaw/openclaw.json` で `gateway.mode=local` が設定されていない限り、起動を拒否します。アドホック実行や開発時の実行には `--allow-unconfigured` を使用してください。設定の書き込みや修復を行わずに、このガードを回避します。
    - `openclaw onboard --mode local` と `openclaw setup` は `gateway.mode=local` を書き込みます。設定ファイルが存在するのに `gateway.mode` がない場合、設定が破損または上書きされたものとして扱われ、Gateway は `local` を推測しません。オンボーディングを再実行するか、キーを手動で設定するか、`--allow-unconfigured` を渡してください。
    - 認証なしでループバック以外にバインドすることは禁止されています。
    - `--bind` の値 `lan`、`tailnet`、`custom` は、現在 IPv4 のみの経路で解決されます。IPv6 のみの独自ホスト構成では、Gateway の前段に IPv4 サイドカーまたはプロキシが必要です。
    - `SIGUSR1` は、許可されている場合にプロセス内再起動をトリガーします。`commands.restart`（デフォルト: 有効）は、外部から送信された `SIGUSR1` を制御します。`gateway restart` コマンド、Gateway ツール、設定の適用や更新による再起動を許可したまま、OS シグナルによる手動再起動を禁止するには、`false` に設定します。
    - `SIGINT`/`SIGTERM` はプロセスを停止しますが、カスタム端末状態を復元しません。CLI を TUI または raw モード入力でラップしている場合は、終了前に端末を復元してください。

  </Accordion>
</AccordionGroup>

### オプション

<ParamField path="--port <port>" type="number">
  WebSocket ポート（デフォルトは設定または環境変数から取得。通常は `18789`）。
</ParamField>
<ParamField path="--bind <mode>" type="string">
  バインドモード: `loopback`（デフォルト）、`lan`、`tailnet`、`auto`、`custom`。
</ParamField>
<ParamField path="--token <token>" type="string">
  `connect.params.auth.token` 用の共有トークン。設定されている場合、デフォルトは `OPENCLAW_GATEWAY_TOKEN` です。
</ParamField>
<ParamField path="--auth <mode>" type="string">
  認証モード: `none`、`token`、`password`、`trusted-proxy`。
</ParamField>
<ParamField path="--password <password>" type="string">
  `--auth password` 用のパスワード。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Gateway のパスワードをファイルから読み取ります。
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Tailscale 公開方法: `off`、`serve`、`funnel`。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  シャットダウン時に Tailscale の serve/funnel 設定をリセットします。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  `gateway.mode=local` を強制せずに起動します。アドホックまたは開発用のブートストラップ専用であり、設定の永続化や修復は行いません。
</ParamField>
<ParamField path="--dev" type="boolean">
  存在しない場合に開発用の設定とワークスペースを作成します（`BOOTSTRAP.md` をスキップ）。
</ParamField>
<ParamField path="--reset" type="boolean">
  開発用の設定、認証情報、セッション、ワークスペースをリセットします。`--dev` が必要です。
</ParamField>
<ParamField path="--force" type="boolean">
  起動前に、対象ポート上の既存のリスナーをすべて終了します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  stdout/stderr に詳細ログを出力します。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  コンソールには CLI バックエンドのログのみを表示します（stdout/stderr も有効にします）。
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  WebSocket ログ形式: `auto`、`full`、`compact`。
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` のエイリアス。
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  生のモデルストリームイベントを JSONL に記録します。
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  生ストリームの JSONL パス。
</ParamField>

`--claude-cli-logs` は `--cli-backend-logs` の非推奨エイリアスです。

`--bind custom` では、`gateway.customBindHost` を IPv4 アドレスに設定します。`127.0.0.1` または `0.0.0.0` 以外のアドレスでは、同一ホストのクライアント向けに同じポート上の `127.0.0.1` も必要です。いずれかのリスナーをバインドできない場合、起動は失敗します。ワイルドカード `0.0.0.0` によって、必須の別エイリアスが追加されることはありません。IPv6 のみの独自ホスト構成では、Gateway の前段に IPv4 サイドカーまたはプロキシが必要です。

## Gateway を再起動する

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` は、実行中の Gateway にアクティブな処理の事前確認を要求し、その処理が完了した後に統合された再起動を 1 回スケジュールします。待機時間は `gateway.reload.deferralTimeoutMs`（デフォルト: 5 分 / `300000`）によって制限され、時間切れになると再起動が強制されます。強制せずに無期限に待機するには、`deferralTimeoutMs: 0` を設定します（保留中であることを示す警告が定期的に表示されます）。`--safe` は `--force` または `--wait` と併用できません。

`--skip-deferral` は安全な再起動時のアクティブ処理の延期ゲートを回避するため、ブロッカーが報告されていても Gateway をただちに再起動します。`--safe` が必要です。暴走タスクによって延期が停止している場合に使用してください。

`--wait <duration>` は、通常の（安全ではない）再起動におけるドレイン時間の上限を上書きします。単位なしのミリ秒、または単位接尾辞 `ms`、`s`、`m`、`h`、`d`（例: `30s`、`5m`、`1h30m`）を使用できます。`--wait 0` は無期限に待機します。`--force` または `--safe` とは互換性がありません。

`--force` はアクティブ処理のドレインをスキップし、ただちに再起動します。通常の `restart`（フラグなし）では、既存のサービスマネージャーによる再起動動作が維持されます。

<Warning>
インラインの `--password` は、ローカルのプロセス一覧に表示される可能性があります。`--password-file`、環境変数、または SecretRef を使用する `gateway.auth.password` を推奨します。
</Warning>

### Gateway のプロファイリング

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` は、各フェーズの `eventLoopMax` 遅延や Plugin ルックアップテーブルのタイミング（インストール済みインデックス、マニフェストレジストリ、起動計画、所有者マップ処理）を含む、起動中のフェーズ別所要時間を記録します。
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` は、再起動単位の `restart trace:` 行を記録します。対象はシグナル処理、アクティブ処理のドレイン、シャットダウンフェーズ、次回起動、準備完了までの時間、メモリメトリクスです。
- `OPENCLAW_DIAGNOSTICS=timeline` を `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` とともに使用すると、外部 QA ハーネス向けにベストエフォートの JSONL 起動診断タイムラインを書き込みます（設定の `diagnostics.flags: ["timeline"]` と同等ですが、パスは引き続き環境変数でのみ指定できます）。イベントループのサンプルを含めるには `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` を追加します。
- `pnpm build`、続いて `pnpm test:startup:gateway -- --runs 5 --warmup 1` を実行すると、ビルド済み CLI エントリを基準に Gateway の起動をベンチマークします。対象は最初のプロセス出力、`/healthz`、`/readyz`、起動トレースのタイミング、イベントループ遅延、Plugin ルックアップテーブルのタイミングです。
- `pnpm build`、続いて `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` を実行すると、macOS または Linux 上でプロセス内再起動をベンチマークします（Windows ではサポートされません。再起動には `SIGUSR1` が必要です）。`SIGUSR1` を使用し、子プロセスで両方のトレースを有効にして、次回の `/healthz`、次回の `/readyz`、ダウンタイム、準備完了までの時間、CPU、RSS、再起動トレースのメトリクスを記録します。
- `/healthz` は生存状態、`/readyz` は利用可能な準備状態を示します。トレース行とベンチマーク出力は所有者の特定に役立つシグナルとして扱い、1 つの区間やサンプルだけから完全なパフォーマンス上の結論を導かないでください。

## 実行中の Gateway に問い合わせる

すべての問い合わせコマンドは WebSocket RPC を使用します。

<Tabs>
  <Tab title="出力モード">
    - デフォルト: 人間が読みやすい形式（TTY では色付き）。
    - `--json`: 機械可読な JSON（装飾やスピナーなし）。
    - `--no-color`（または `NO_COLOR=1`）: 人間向けのレイアウトを維持したまま ANSI を無効にします。

  </Tab>
  <Tab title="共通オプション">
    - `--url <url>`: Gateway の WebSocket URL。
    - `--token <token>`: Gateway のトークン。
    - `--password <password>`: Gateway のパスワード。
    - `--timeout <ms>`: タイムアウトまたは時間上限（デフォルトはコマンドごとに異なります。各コマンドの説明を参照してください）。
    - `--expect-final`: 「final」レスポンスを待機します（エージェント呼び出し）。

  </Tab>
</Tabs>

<Note>
`--url` を設定すると、CLI は設定または環境変数の認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーになります。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` は生存確認プローブです。サーバーが HTTP に応答できるようになると、ただちに結果を返します。`/readyz` はより厳格で、起動時の Plugin サイドカー、チャンネル、または設定済みフックの準備が完了するまで異常状態のままです。ローカルまたは認証済みの詳細な `/readyz` レスポンスには、`eventLoop` 診断ブロック（遅延、使用率、CPU コア比率、`degraded` フラグ）が含まれます。

<ParamField path="--port <port>" type="number">
  このポート上の local loopback Gateway を対象にします。この呼び出しでは `OPENCLAW_GATEWAY_URL` と `OPENCLAW_GATEWAY_PORT` を上書きします。
</ParamField>

### `gateway usage-cost`

セッションログから使用量とコストの概要を取得します。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  対象に含める日数。
</ParamField>
<ParamField path="--agent <id>" type="string">
  概要の対象を、設定済みの 1 つのエージェント ID に限定します。
</ParamField>
<ParamField path="--all-agents" type="boolean">
  設定済みのすべてのエージェントを集計します。`--agent` とは併用できません。
</ParamField>

### `gateway stability`

実行中の Gateway から、直近の診断安定性レコーダーを取得します。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  対象に含める直近イベントの最大数（最大 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  診断イベントタイプでフィルタリングします（例: `payload.large` または `diagnostic.memory.pressure`）。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  診断シーケンス番号より後のイベントのみを含めます。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  実行中の Gateway を呼び出す代わりに、永続化された安定性バンドルを読み取ります。`--bundle latest`（または引数なしの `--bundle`）は、状態ディレクトリ内の最新バンドルを選択します。バンドルの JSON パスを直接渡すこともできます。
</ParamField>
<ParamField path="--export" type="boolean">
  安定性の詳細を出力する代わりに、共有可能なサポート診断 zip を書き込みます。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` の出力パス。
</ParamField>

<AccordionGroup>
  <Accordion title="プライバシーとバンドルの動作">
    - レコードには、イベント名、件数、バイトサイズ、メモリ使用量、キュー/セッションの状態、承認 ID、チャンネル/Plugin 名、編集済みのセッション概要といった運用メタデータが保持されます。チャットテキスト、Webhook 本文、ツール出力、生のリクエスト/レスポンス本文、トークン、Cookie、シークレット値、ホスト名、生のセッション ID は含まれません。レコーダーを完全に無効にするには、`diagnostics.enabled: false` を設定します。
    - レコーダーにイベントがある場合、Gateway の致命的な終了、シャットダウンのタイムアウト、再起動時の起動失敗では、同じ診断スナップショットが `~/.openclaw/logs/stability/openclaw-stability-*.json` に書き込まれます。最新のバンドルは `openclaw gateway stability --bundle latest` で確認できます。`--limit`、`--type`、`--since-seq` はバンドル出力にも適用されます。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

バグ報告用に設計されたローカル診断 zip を書き出します。プライバシーモデルとバンドル内容については、[診断のエクスポート](/ja-JP/gateway/diagnostics)を参照してください。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  出力 zip のパス。デフォルトでは、状態ディレクトリ配下のサポート用エクスポートになります。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  含めるサニタイズ済みログ行の最大数。
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  検査するログの最大バイト数。
</ParamField>
<ParamField path="--url <url>" type="string">
  ヘルススナップショット用の Gateway WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  ヘルススナップショット用の Gateway トークン。
</ParamField>
<ParamField path="--password <password>" type="string">
  ヘルススナップショット用の Gateway パスワード。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  ステータス/ヘルススナップショットのタイムアウト。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  永続化された安定性バンドルの検索をスキップします。
</ParamField>
<ParamField path="--json" type="boolean">
  書き込まれたパス、サイズ、マニフェストを JSON として出力します。
</ParamField>

エクスポートには、`manifest.json`（ファイル一覧）、`summary.md`（Markdown 概要）、`diagnostics.json`（トップレベルの設定/ログ/検出/安定性/ステータス/ヘルス概要）、`config/sanitized.json`、`status/gateway-status.json`、`health/gateway-health.json`、`logs/openclaw-sanitized.jsonl`、およびバンドルが存在する場合は `stability/latest.json` が含まれます。

共有を前提として設計されています。デバッグに役立つ運用情報（安全なログフィールド、サブシステム名、ステータスコード、所要時間、設定済みモード、ポート、Plugin/プロバイダー ID、シークレットではない機能設定、編集済みの運用ログメッセージ）を保持し、チャットテキスト、Webhook 本文、ツール出力、認証情報、Cookie、アカウント/メッセージ識別子、プロンプト/指示テキスト、ホスト名、シークレット値は省略または編集します。ログメッセージがユーザー/チャット/ツールのペイロードテキスト（例: 「user said」、「chat text」、「tool output」、「webhook body」）のように見える場合、エクスポートにはメッセージが省略されたという事実とそのバイト数のみが保持されます。

### `gateway status`

Gateway サービス（launchd/systemd/schtasks）と、オプションの接続性/認証プローブを表示します。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  明示的なプローブ対象を追加します。設定済みのリモートと localhost も引き続きプローブされます。
</ParamField>
<ParamField path="--token <token>" type="string">
  プローブ用のトークン認証。
</ParamField>
<ParamField path="--password <password>" type="string">
  プローブ用のパスワード認証。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  プローブのタイムアウト。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  接続性プローブをスキップします（サービスのみの表示）。
</ParamField>
<ParamField path="--deep" type="boolean">
  システムレベルのサービスもスキャンします。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  接続性プローブを読み取りプローブに強化し、失敗した場合はゼロ以外で終了します。`--no-probe` とは併用できません。
</ParamField>

<AccordionGroup>
  <Accordion title="ステータスの意味">
    - ローカル CLI 設定が存在しないか無効な場合でも、診断に使用できます。
    - デフォルト出力で確認できるのは、サービスの状態、WebSocket 接続、およびハンドシェイク時に確認できる認証機能です。読み取り/書き込み/管理操作までは確認しません。
    - 初回のデバイス認証に対してプローブは変更を加えません。既存のキャッシュ済みデバイストークンがある場合は再利用しますが、ステータス確認のためだけに新しい CLI デバイス ID や読み取り専用ペアリングレコードを作成することはありません。
    - 可能な場合、プローブ認証用に設定済みの認証 SecretRef を解決します。必要な SecretRef が未解決で、プローブの接続性/認証が失敗した場合、`--json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、シークレットソースを修正してください。未解決の認証に関する警告は、プローブが成功すると抑制されます。
    - 実行中の Gateway が報告する場合、JSON 出力には `gateway.version` が含まれます。ハンドシェイクプローブからバージョンメタデータを取得できない場合、`--require-rpc` は `status.runtimeVersion` RPC ペイロードにフォールバックできます。
    - リッスン中のサービスだけでは不十分で、読み取りスコープの RPC も正常である必要があるスクリプト/自動化では、`--require-rpc` を使用します。
    - `--deep` は追加の launchd/systemd/schtasks インストールをスキャンします。Gateway に類似したサービスが複数見つかった場合、人間向け出力にはクリーンアップのヒント（通常はマシンごとに 1 つの Gateway を実行）が表示され、該当する場合は直近のスーパーバイザー再起動の引き継ぎも報告されます。
    - `--deep` は、Plugin 対応モード（`pluginValidation: "full"`）で設定検証も実行し、Plugin マニフェストの警告（例: チャンネル設定メタデータの欠落）を表示します。デフォルトの `gateway status` では、Plugin 検証をスキップする高速な読み取り専用パスが維持されます。
    - 人間向け出力には、解決済みのファイルログパスに加えて、プロファイルまたは状態ディレクトリのずれを診断しやすいよう、CLI とサービスの設定パスおよび有効性が表示されます。

  </Accordion>
  <Accordion title="Linux systemd の認証ずれチェック">
    - サービスの認証ずれチェックでは、ユニットから `Environment=` と `EnvironmentFile=` の両方を読み取ります（`%h`、引用符で囲まれたパス、複数ファイル、オプションの `-` ファイルを含む）。
    - マージされたランタイム環境（最初にサービスコマンド環境、次にプロセス環境へのフォールバック）を使用して、`gateway.auth.token` SecretRef を解決します。
    - トークン認証が実質的に有効でない場合（`gateway.auth.mode` が明示的に `password`/`none`/`trusted-proxy`、またはモードが未設定でパスワードが優先され、どのトークン候補も優先されない場合）、トークンずれチェックは設定トークンの解決をスキップします。

  </Accordion>
</AccordionGroup>

### `gateway probe`

「すべてをデバッグする」コマンドです。常に次をプローブします。

- 設定済みのリモート Gateway（設定されている場合）、および
- localhost（ループバック）。**リモートが設定されている場合でも**プローブします。

`--url` を渡すと、その明示的な対象が両方より前に追加されます。人間向け出力では、対象に `URL (explicit)`、`Remote (configured)` / `Remote (configured, inactive)`、`Local loopback` というラベルが付けられます。

<Note>
複数のプローブ対象に到達できる場合は、すべて出力されます。SSH トンネル、TLS/プロキシ URL、設定済みのリモート URL は、転送ポートが異なっていても同じ Gateway を指すことがあります。`multiple_gateways` は、別個の Gateway に到達できる場合、または到達可能な Gateway の ID が曖昧な場合にのみ使用されます。分離されたプロファイル（例: レスキューボット）では複数の Gateway の実行がサポートされていますが、ほとんどのインストールでは単一の Gateway を実行します。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  local loopback プローブ対象および SSH トンネルのリモートポートにこのポートを使用します。`--url` を指定しない場合、設定済みの Gateway 環境 URL、環境ポート、リモート対象ではなく、local loopback 対象のみが選択されます。
</ParamField>

<AccordionGroup>
  <Accordion title="解釈">
    - `Reachable: yes` は、少なくとも 1 つの対象が WebSocket 接続を受け入れたことを意味します。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` は、到達可能性とは別に、プローブが認証について確認できた内容を報告します。
    - `Read probe: ok` は、読み取りスコープの詳細 RPC 呼び出し（`health`/`status`/`system-presence`/`config.get`）も成功したことを意味します。
    - `Read probe: limited - missing scope: operator.read` は、接続は成功したものの、読み取りスコープの RPC が制限されていることを意味します。完全な失敗ではなく、到達可能性が **低下** した状態として報告されます。
    - `Connect: ok` の後の `Read probe: failed` は、WebSocket は接続されたものの、後続の読み取り診断がタイムアウトまたは失敗したことを意味します。これも到達不能ではなく **低下** 状態です。
    - `gateway status` と同様に、プローブは既存のキャッシュ済みデバイス認証を再利用しますが、初回のデバイス ID やペアリング状態は作成しません。
    - プローブ対象のいずれにも到達できない場合にのみ、終了コードがゼロ以外になります。

  </Accordion>
  <Accordion title="JSON 出力">
    トップレベル:

    - `ok`: 少なくとも 1 つの対象に到達できます。
    - `degraded`: 少なくとも 1 つの対象が接続を受け入れましたが、完全な詳細 RPC 診断は完了しませんでした。
    - `capability`: 到達可能な対象全体で確認された最良の機能（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope`、または `unknown`）。
    - `primaryTargetId`: アクティブな優先対象として扱う最適な対象。優先順は、明示的な URL、SSH トンネル、設定済みのリモート、local loopback です。
    - `warnings[]`: `code`、`message`、およびオプションの `targetIds` を含むベストエフォートの警告レコード。
    - `network`: 現在の設定とホストネットワークから導出された local loopback/tailnet URL のヒント。
    - `discovery.timeoutMs` / `discovery.count`: このプローブ処理で実際に使用された検出予算/結果件数。

    対象ごと（`targets[].connect`）: `ok`（到達可能性 + 低下状態の分類）、`rpcOk`（完全な詳細 RPC の成功）、`scopeLimited`（operator スコープ不足による詳細 RPC の失敗）。

    対象ごと（`targets[].auth`）: 使用可能な場合は `role` と `scopes` が `hello-ok` に報告され、さらに表示対象の `capability` 分類が含まれます。

  </Accordion>
  <Accordion title="一般的な警告コード">
    - `ssh_tunnel_failed`: SSH トンネルの設定に失敗し、コマンドは直接プローブにフォールバックしました。
    - `multiple_gateways`: 別個の Gateway ID に到達できたか、到達可能な対象が同じ Gateway であることを OpenClaw が確認できませんでした。同じ Gateway への SSH トンネル、プロキシ URL、または設定済みのリモート URL では、この警告は発生しません。
    - `auth_secretref_unresolved`: 失敗した対象について、設定済みの認証 SecretRef を解決できませんでした。
    - `probe_scope_limited`: WebSocket 接続は成功しましたが、`operator.read` がないため読み取りプローブが制限されました。
    - `local_tls_runtime_unavailable`: ローカル Gateway の TLS は有効ですが、OpenClaw がローカル証明書のフィンガープリントを読み込めませんでした。

  </Accordion>
</AccordionGroup>

#### SSH 経由のリモート（Mac アプリと同等）

macOS アプリの「Remote over SSH」モードではローカルポートフォワーディングを使用し、ループバック限定のリモート Gateway に `ws://127.0.0.1:<port>` で到達できるようにします。

CLI での同等の操作:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` または `user@host:port`（ポートのデフォルトは `22`）。
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ID ファイル。
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  解決済みの検出エンドポイント（`local.` と、設定されている場合は設定済みの広域ドメイン）から、最初に検出された Gateway ホストを SSH 対象として選択します。TXT のみのヒントは無視されます。
</ParamField>

設定のデフォルト（任意）: `gateway.remote.sshTarget`、`gateway.remote.sshIdentity`。

### `gateway call <method>`

低レベル RPC ヘルパー。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  パラメーター用の JSON オブジェクト文字列。
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway トークン。
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway パスワード。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  タイムアウトの上限。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主に、最終ペイロードの前に中間イベントをストリーミングするエージェント形式の RPC 用です。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な JSON 出力。
</ParamField>

<Note>
`--params` は有効な JSON である必要があり、各メソッドは独自のパラメーター形式を検証します（余分なフィールドや誤った名前のフィールドは拒否されます）。
</Note>

## Gateway サービスを管理する

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### ラッパーを使用してインストールする

管理対象サービスを別の実行可能ファイル（たとえば、シークレットマネージャーの shim や別ユーザーとして実行するためのヘルパー）経由で起動する必要がある場合は、`--wrapper` を使用します。ラッパーは通常の Gateway 引数を受け取り、最終的にそれらの引数を指定して `openclaw` または Node を exec する役割を担います。

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

環境からラッパーを設定することもできます。`gateway install` は、パスが実行可能ファイルであることを検証し、ラッパーをサービスの `ProgramArguments` に書き込み、後続の強制再インストール、更新、および doctor による修復に備えて、サービス環境に `OPENCLAW_WRAPPER` を永続化します。

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

永続化されたラッパーを削除するには、再インストール時に `OPENCLAW_WRAPPER` を空にします。

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="コマンドオプション">
    - `gateway status`: `--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
    - `gateway install`: `--port`、`--runtime <node>`（デフォルト: `node`）、`--token`、`--wrapper <path>`、`--force`、`--json`
    - `gateway restart`: `--safe`、`--skip-deferral`、`--force`、`--wait <duration>`、`--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`、`--json`

  </Accordion>
  <Accordion title="ライフサイクルの動作">
    - 管理対象サービスを再起動するには、`gateway restart` を使用します。再起動の代わりとして `gateway stop` と `gateway start` を連結して実行しないでください。
    - macOS では、`gateway stop` はデフォルトで `launchctl bootout` を使用します。これにより、無効化を永続化せずに現在のブートセッションから LaunchAgent が削除されます。KeepAlive による自動復旧は将来のクラッシュに対して有効なままで、`gateway start` は手動で `launchctl enable` を実行しなくても正常に再有効化されます。Gateway が次回明示的に `gateway start` を実行するまで再生成されないよう、KeepAlive と RunAtLoad を永続的に抑止するには、`--disable` を指定します。手動停止を再起動後も維持する必要がある場合に使用してください。
    - ライフサイクルコマンドは、スクリプト処理用に `--json` を受け付けます。

  </Accordion>
  <Accordion title="インストール時の認証と SecretRef">
    - トークン認証でトークンが必要であり、`gateway.auth.token` が SecretRef で管理されている場合、`gateway install` は SecretRef を解決できることを検証しますが、解決されたトークンをサービス環境のメタデータには永続化しません。
    - トークン認証でトークンが必要な場合に、設定済みのトークン SecretRef を解決できなければ、フォールバック用の平文を永続化せず、安全側に倒してインストールに失敗します。
    - `gateway run` でのパスワード認証には、インラインの `--password` よりも、`OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef を利用する `gateway.auth.password` を推奨します。
    - 推論された認証モードでは、シェル限定の `OPENCLAW_GATEWAY_PASSWORD` によってインストール時のトークン要件が緩和されることはありません。管理対象サービスをインストールする場合は、永続的な設定（`gateway.auth.password` または設定の `env`）を使用してください。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードを明示的に設定するまでインストールはブロックされます。

  </Accordion>
</AccordionGroup>

## Gateway を検出する（Bonjour）

`gateway discover` は Gateway ビーコン（`_openclaw-gw._tcp`）をスキャンします。

- マルチキャスト DNS-SD: `local.`
- ユニキャスト DNS-SD（広域 Bonjour）: ドメイン（例: `openclaw.internal.`）を選択し、スプリット DNS と DNS サーバーを設定します。[Bonjour](/ja-JP/gateway/bonjour) を参照してください。

Bonjour 検出が有効（デフォルト）な Gateway のみがビーコンをアドバタイズします。

各ビーコンの TXT ヒント: `role`（Gateway ロールのヒント）、`transport`（トランスポートのヒント、例: `gateway`）、`gatewayPort`（WebSocket ポート、通常は `18789`）、`tailnetDns`（利用可能な場合は MagicDNS ホスト名）、`gatewayTls` / `gatewayTlsSha256`（TLS の有効化状態と証明書フィンガープリント）。`sshPort` と `cliPath` は、完全検出モード（`discovery.mdns.mode: "full"`。デフォルトはこれらを省略する `"minimal"`）でのみ公開されます。その場合、クライアントは SSH ターゲットのデフォルトポートとして `22` を使用します。

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  コマンドごとのタイムアウト（参照/解決）。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な出力（スタイルとスピナーも無効化）。
</ParamField>

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- `local.` に加え、有効になっている場合は設定済みの広域ドメインもスキャンします。
- JSON 出力の `wsUrl` は、`lanHost` や `tailnetDns` などの TXT のみのヒントではなく、解決済みのサービスエンドポイントから導出されます。
- `discovery.mdns.mode` は、`local.` mDNS と広域 DNS-SD の両方における `sshPort`/`cliPath` の公開を制御します（前述を参照）。

</Note>

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Gateway 運用手順](/ja-JP/gateway)
