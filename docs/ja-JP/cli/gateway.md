---
read_when:
    - CLI から Gateway を実行する（開発環境またはサーバー）
    - Gateway の認証、バインドモード、接続性のデバッグ
    - Bonjour による Gateway の検出（ローカル + 広域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway の実行、照会、検出
title: Gateway
x-i18n:
    generated_at: "2026-07-11T22:07:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Gateway は OpenClaw の WebSocket サーバーです（チャネル、ノード、セッション、フック）。以下のすべてのサブコマンドは `openclaw gateway ...` 配下にあります。

<CardGroup cols={3}>
  <Card title="Bonjour 検出" href="/ja-JP/gateway/bonjour">
    ローカル mDNS + 広域 DNS-SD のセットアップ。
  </Card>
  <Card title="検出の概要" href="/ja-JP/gateway/discovery">
    OpenClaw が Gateway を通知および検出する仕組み。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration">
    トップレベルの Gateway 設定キー。
  </Card>
</CardGroup>

## Gateway を実行する

```bash
openclaw gateway
openclaw gateway run   # 同等の明示的な形式
```

<AccordionGroup>
  <Accordion title="起動時の動作">
    - `~/.openclaw/openclaw.json` に `gateway.mode=local` が設定されていない場合、起動を拒否します。一時的な実行や開発用の実行には `--allow-unconfigured` を使用してください。このフラグは、設定の書き込みや修復を行わずにガードを回避します。
    - `openclaw onboard --mode local` と `openclaw setup` は `gateway.mode=local` を書き込みます。設定ファイルは存在するものの `gateway.mode` がない場合、設定が破損または上書きされたものとして扱われ、Gateway は `local` であると推測することを拒否します。オンボーディングを再実行するか、キーを手動で設定するか、`--allow-unconfigured` を渡してください。
    - 認証なしでループバック以外にバインドすることはブロックされます。
    - 現在、`--bind` の値 `lan`、`tailnet`、`custom` は IPv4 専用の経路で解決されます。IPv6 専用の持ち込みホスト構成では、Gateway の前段に IPv4 サイドカーまたはプロキシが必要です。
    - 許可されている場合、`SIGUSR1` はプロセス内再起動をトリガーします。外部から送信される `SIGUSR1` は `commands.restart`（デフォルト: 有効）によって制御されます。`false` に設定すると、`gateway restart` コマンド、Gateway ツール、設定の適用や更新による再起動は許可したまま、OS シグナルを手動送信する再起動をブロックできます。
    - `SIGINT`/`SIGTERM` はプロセスを停止しますが、カスタムの端末状態は復元しません。CLI を TUI または raw モード入力でラップする場合は、終了前に端末を自分で復元してください。

  </Accordion>
</AccordionGroup>

### オプション

<ParamField path="--port <port>" type="number">
  WebSocket ポート（デフォルト値は設定または環境変数から取得。通常は `18789`）。
</ParamField>
<ParamField path="--bind <mode>" type="string">
  バインドモード: `loopback`（デフォルト）、`lan`、`tailnet`、`auto`、`custom`。
</ParamField>
<ParamField path="--token <token>" type="string">
  `connect.params.auth.token` 用の共有トークン。`OPENCLAW_GATEWAY_TOKEN` が設定されている場合は、その値がデフォルトになります。
</ParamField>
<ParamField path="--auth <mode>" type="string">
  認証モード: `none`、`token`、`password`、`trusted-proxy`。
</ParamField>
<ParamField path="--password <password>" type="string">
  `--auth password` 用のパスワード。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  ファイルから Gateway のパスワードを読み取ります。
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Tailscale での公開方法: `off`、`serve`、`funnel`。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  シャットダウン時に Tailscale の serve/funnel 設定をリセットします。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  `gateway.mode=local` を強制せずに起動します。一時的な実行や開発用のブートストラップ専用であり、設定の永続化や修復は行いません。
</ParamField>
<ParamField path="--dev" type="boolean">
  存在しない場合に開発用の設定とワークスペースを作成します（`BOOTSTRAP.md` はスキップします）。
</ParamField>
<ParamField path="--reset" type="boolean">
  開発用の設定、認証情報、セッション、ワークスペースをリセットします。`--dev` が必要です。
</ParamField>
<ParamField path="--force" type="boolean">
  起動前に、対象ポートで待ち受けている既存のプロセスをすべて終了します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  詳細なログを stdout/stderr に出力します。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  コンソールには CLI バックエンドのログのみを表示します（stdout/stderr への出力も有効になります）。
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  WebSocket ログの形式: `auto`、`full`、`compact`。
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` のエイリアス。
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  生のモデルストリームイベントを JSONL に記録します。
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  生のストリームを記録する JSONL のパス。
</ParamField>

`--claude-cli-logs` は非推奨となった `--cli-backend-logs` のエイリアスです。

`--bind custom` を使用する場合は、`gateway.customBindHost` に IPv4 アドレスを設定してください。`127.0.0.1` または `0.0.0.0` 以外のアドレスを指定すると、同一ホスト上のクライアント向けに同じポートの `127.0.0.1` も必要になります。いずれかのリスナーがバインドできない場合、起動は失敗します。ワイルドカードの `0.0.0.0` では、別途必須となるエイリアスは追加されません。IPv6 専用の持ち込みホスト構成では、Gateway の前段に IPv4 サイドカーまたはプロキシが必要です。

## Gateway を再起動する

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` は、実行中の Gateway にアクティブな処理の事前確認を要求し、その処理が完了した後に、統合された 1 回の再起動をスケジュールします。待機時間は `gateway.reload.deferralTimeoutMs`（デフォルト: 5 分 / `300000`）で制限され、時間切れになると再起動が強制されます。強制せずに無期限で待機するには、`deferralTimeoutMs: 0` を設定してください（保留中であることを示す警告が定期的に出力されます）。`--safe` は `--force` または `--wait` と併用できません。

`--skip-deferral` は安全な再起動におけるアクティブな処理の延期ゲートを回避するため、報告されたブロッカーがある場合でも Gateway を直ちに再起動します。`--safe` が必要です。暴走タスクによって延期が停止している場合に使用してください。

`--wait <duration>` は、通常の（安全モードではない）再起動における処理完了の待機時間を上書きします。単位なしのミリ秒、または単位サフィックス `ms`、`s`、`m`、`h`、`d` を受け付けます（例: `30s`、`5m`、`1h30m`）。`--wait 0` は無期限に待機します。`--force` または `--safe` とは併用できません。

`--force` はアクティブな処理の完了待ちをスキップし、直ちに再起動します。通常の `restart`（フラグなし）では、既存のサービスマネージャーによる再起動動作を維持します。

<Warning>
インラインの `--password` はローカルのプロセス一覧に表示される可能性があります。`--password-file`、環境変数、または SecretRef を利用する `gateway.auth.password` を推奨します。
</Warning>

### Gateway のプロファイリング

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` は、各フェーズの `eventLoopMax` 遅延と Plugin ルックアップテーブルの所要時間（インストール済みインデックス、マニフェストレジストリ、起動計画、所有者マップの処理）を含む、起動中の各フェーズの所要時間を記録します。
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` は、再起動単位の `restart trace:` 行として、シグナル処理、アクティブな処理の完了待ち、シャットダウンフェーズ、次回起動、準備完了までの時間、メモリ指標を記録します。
- `OPENCLAW_DIAGNOSTICS=timeline` と `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` を指定すると、外部 QA ハーネス向けに、ベストエフォート形式の起動診断タイムラインが JSONL で書き込まれます（設定の `diagnostics.flags: ["timeline"]` と同等ですが、パスは引き続き環境変数でのみ指定できます）。イベントループのサンプルを含めるには、`OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` を追加します。
- `pnpm build` の後に `pnpm test:startup:gateway -- --runs 5 --warmup 1` を実行すると、ビルド済み CLI エントリを使用して Gateway の起動をベンチマークします。測定対象には、最初のプロセス出力、`/healthz`、`/readyz`、起動トレースの所要時間、イベントループの遅延、Plugin ルックアップテーブルの所要時間が含まれます。
- `pnpm build` の後に `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` を実行すると、macOS または Linux 上でプロセス内再起動をベンチマークします（Windows ではサポートされません。再起動には `SIGUSR1` が必要です）。`SIGUSR1` を使用し、子プロセスで両方のトレースを有効化して、次回の `/healthz`、次回の `/readyz`、停止時間、準備完了までの時間、CPU、RSS、再起動トレース指標を記録します。
- `/healthz` は稼働状態を示し、`/readyz` は利用可能な準備状態を示します。トレース行とベンチマーク出力は、単一の期間やサンプルから導く完全なパフォーマンス評価ではなく、所有箇所の特定に役立つシグナルとして扱ってください。

## 実行中の Gateway に問い合わせる

すべての問い合わせコマンドは WebSocket RPC を使用します。

<Tabs>
  <Tab title="出力モード">
    - デフォルト: 人間が読みやすい形式（TTY では色付き）。
    - `--json`: 機械可読な JSON（装飾やスピナーなし）。
    - `--no-color`（または `NO_COLOR=1`）: 人間向けのレイアウトを維持したまま ANSI を無効化します。

  </Tab>
  <Tab title="共通オプション">
    - `--url <url>`: Gateway の WebSocket URL。
    - `--token <token>`: Gateway のトークン。
    - `--password <password>`: Gateway のパスワード。
    - `--timeout <ms>`: タイムアウトまたは時間枠（デフォルトはコマンドごとに異なります。以下の各コマンドを参照してください）。
    - `--expect-final`: 「final」レスポンスを待機します（エージェント呼び出し）。

  </Tab>
</Tabs>

<Note>
`--url` を設定した場合、CLI は設定または環境変数の認証情報へフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーになります。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` は稼働確認プローブです。サーバーが HTTP に応答できるようになると、直ちに応答を返します。`/readyz` はより厳格で、起動中の Plugin サイドカー、チャネル、または設定済みのフックがまだ安定していない間は異常状態のままです。ローカルまたは認証済みの詳細な `/readyz` レスポンスには、`eventLoop` 診断ブロック（遅延、使用率、CPU コア比率、`degraded` フラグ）が含まれます。

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

実行中の Gateway から、最近の診断安定性レコーダーを取得します。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  対象に含める最近のイベントの最大数（上限 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  診断イベントの種類で絞り込みます。例: `payload.large` または `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  指定した診断シーケンス番号より後のイベントのみを含めます。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  実行中の Gateway を呼び出す代わりに、永続化された安定性バンドルを読み取ります。`--bundle latest`（または引数なしの `--bundle`）は、状態ディレクトリ内の最新バンドルを選択します。バンドルの JSON パスを直接渡すこともできます。
</ParamField>
<ParamField path="--export" type="boolean">
  安定性の詳細を表示する代わりに、共有可能なサポート診断用 ZIP を書き込みます。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` の出力パス。
</ParamField>

<AccordionGroup>
  <Accordion title="プライバシーとバンドルの動作">
    - 記録には、イベント名、件数、バイトサイズ、メモリ測定値、キューやセッションの状態、承認 ID、チャネルや Plugin の名前、秘匿化されたセッション概要などの運用メタデータが保持されます。チャット本文、Webhook 本文、ツール出力、生のリクエストやレスポンスの本文、トークン、Cookie、シークレット値、ホスト名、生のセッション ID は除外されます。レコーダーを完全に無効化するには、`diagnostics.enabled: false` を設定してください。
    - レコーダーにイベントがある場合、Gateway の致命的な終了、シャットダウンのタイムアウト、再起動時の起動失敗が発生すると、同じ診断スナップショットが `~/.openclaw/logs/stability/openclaw-stability-*.json` に書き込まれます。最新のバンドルは `openclaw gateway stability --bundle latest` で確認できます。`--limit`、`--type`、`--since-seq` はバンドル出力にも適用されます。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

バグ報告向けに設計されたローカル診断用 ZIP を書き込みます。プライバシーモデルとバンドルの内容については、[診断のエクスポート](/ja-JP/gateway/diagnostics)を参照してください。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  出力する zip のパス。デフォルトでは、状態ディレクトリ配下のサポート用エクスポートです。
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
  ステータス／ヘルススナップショットのタイムアウト。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  永続化された安定性バンドルの検索をスキップします。
</ParamField>
<ParamField path="--json" type="boolean">
  書き込まれたパス、サイズ、マニフェストを JSON として出力します。
</ParamField>

エクスポートには、`manifest.json`（ファイル一覧）、`summary.md`（Markdown の概要）、`diagnostics.json`（最上位の設定／ログ／検出／安定性／ステータス／ヘルスの概要）、`config/sanitized.json`、`status/gateway-status.json`、`health/gateway-health.json`、`logs/openclaw-sanitized.jsonl`、およびバンドルが存在する場合は `stability/latest.json` が含まれます。

これは共有を前提として設計されています。デバッグに役立つ運用情報（安全なログフィールド、サブシステム名、ステータスコード、所要時間、設定済みモード、ポート、Plugin／プロバイダー ID、機密ではない機能設定、編集済みの運用ログメッセージ）は保持し、チャット本文、Webhook 本文、ツール出力、認証情報、Cookie、アカウント／メッセージ識別子、プロンプト／指示文、ホスト名、機密値は省略または編集します。ログメッセージがユーザー／チャット／ツールのペイロード本文に見える場合（例：「ユーザーの発言」「チャット本文」「ツール出力」「Webhook 本文」）、エクスポートにはメッセージが省略されたという事実と、そのバイト数のみが保持されます。

### `gateway status`

Gateway サービス（launchd／systemd／schtasks）と、任意の接続性／認証プローブを表示します。

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
  接続性プローブをスキップします（サービスのみを表示）。
</ParamField>
<ParamField path="--deep" type="boolean">
  システムレベルのサービスもスキャンします。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  接続性プローブを読み取りプローブに強化し、失敗した場合はゼロ以外で終了します。`--no-probe` とは併用できません。
</ParamField>

<AccordionGroup>
  <Accordion title="ステータスの意味">
    - ローカル CLI 設定が存在しない、または無効な場合でも、診断に利用できます。
    - デフォルト出力が確認するのは、サービス状態、WebSocket 接続、ハンドシェイク時に確認できる認証能力です。読み取り／書き込み／管理操作を確認するものではありません。
    - 初回のデバイス認証に対してプローブは変更を加えません。既存のキャッシュ済みデバイストークンがあれば再利用しますが、ステータス確認だけのために新しい CLI デバイス ID や読み取り専用のペアリングレコードを作成することはありません。
    - 可能な場合、設定済みの認証用 SecretRef をプローブ認証のために解決します。必須の SecretRef を解決できず、プローブの接続性／認証に失敗した場合、`--json` は `rpc.authWarning` を報告します。`--token`／`--password` を明示的に渡すか、シークレットソースを修正してください。プローブが成功すると、未解決の認証に関する警告は表示されなくなります。
    - 実行中の Gateway がバージョンを報告する場合、JSON 出力には `gateway.version` が含まれます。ハンドシェイクプローブからバージョンメタデータを取得できない場合、`--require-rpc` は `status.runtimeVersion` RPC ペイロードにフォールバックできます。
    - 待ち受け中のサービスだけでは不十分で、読み取りスコープの RPC も正常である必要があるスクリプト／自動化では、`--require-rpc` を使用します。
    - `--deep` は追加の launchd／systemd／schtasks インストールをスキャンします。Gateway に似たサービスが複数見つかった場合、人間向け出力にはクリーンアップのヒント（通常はマシンごとに 1 つの Gateway を実行）が表示され、該当する場合は最近行われたスーパーバイザー再起動の引き継ぎも報告されます。
    - `--deep` は Plugin 対応モード（`pluginValidation: "full"`）で設定検証も実行し、Plugin マニフェストの警告（例：チャンネル設定メタデータの欠落）を表示します。デフォルトの `gateway status` では、Plugin 検証を省略する高速な読み取り専用パスが維持されます。
    - 人間向け出力には、解決済みのファイルログパスに加え、プロファイルや状態ディレクトリのずれを診断しやすくするため、CLI とサービスの設定パスおよび有効性が表示されます。

  </Accordion>
  <Accordion title="Linux systemd の認証ずれチェック">
    - サービスの認証ずれチェックでは、ユニットから `Environment=` と `EnvironmentFile=` の両方を読み取ります（`%h`、引用符付きパス、複数ファイル、任意指定の `-` ファイルを含む）。
    - 統合されたランタイム環境（最初にサービスコマンドの環境、次にプロセス環境へのフォールバック）を使用して、`gateway.auth.token` の SecretRef を解決します。
    - トークン認証が実質的に有効でない場合（`gateway.auth.mode` が明示的に `password`／`none`／`trusted-proxy` である場合、またはモードが未設定でパスワードが優先され得る一方、優先可能なトークン候補がない場合）、トークンのずれチェックでは設定トークンの解決をスキップします。

  </Accordion>
</AccordionGroup>

### `gateway probe`

「あらゆるものをデバッグする」コマンドです。常に以下をプローブします。

- 設定済みのリモート Gateway（設定されている場合）
- localhost（local loopback）。**リモートが設定されている場合でも対象です**。

`--url` を渡すと、その明示的な対象が両者より前に追加されます。人間向け出力では、対象に `URL (explicit)`、`Remote (configured)`／`Remote (configured, inactive)`、`Local loopback` というラベルが付けられます。

<Note>
複数のプローブ対象に到達できる場合は、すべて出力されます。SSH トンネル、TLS／プロキシ URL、設定済みのリモート URL は、トランスポートポートが異なっていても同じ Gateway を指すことがあります。`multiple_gateways` は、別個の Gateway、または ID が曖昧な到達可能 Gateway のために予約されています。分離されたプロファイル（例：レスキューボット）で複数の Gateway を実行することはサポートされていますが、ほとんどのインストールでは単一の Gateway を実行します。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  local loopback のプローブ対象と SSH トンネルのリモートポートに、このポートを使用します。`--url` を指定しない場合、設定済みの Gateway 環境 URL、環境ポート、またはリモート対象の代わりに、local loopback の対象のみを選択します。
</ParamField>

<AccordionGroup>
  <Accordion title="解釈">
    - `Reachable: yes` は、少なくとも 1 つの対象が WebSocket 接続を受け入れたことを意味します。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` は、到達可能性とは別に、プローブが認証について確認できた能力を報告します。
    - `Read probe: ok` は、読み取りスコープの詳細 RPC 呼び出し（`health`／`status`／`system-presence`／`config.get`）も成功したことを意味します。
    - `Read probe: limited - missing scope: operator.read` は、接続には成功したものの、読み取りスコープの RPC が制限されていることを意味します。完全な失敗ではなく、到達可能性が **低下している** と報告されます。
    - `Connect: ok` の後に `Read probe: failed` と表示される場合は、WebSocket には接続できたものの、後続の読み取り診断がタイムアウトまたは失敗したことを意味します。これも到達不能ではなく、**低下状態** です。
    - `gateway status` と同様に、プローブは既存のキャッシュ済みデバイス認証を再利用しますが、初回のデバイス ID やペアリング状態は作成しません。
    - プローブ対象のいずれにも到達できない場合に限り、終了コードはゼロ以外になります。

  </Accordion>
  <Accordion title="JSON 出力">
    最上位：

    - `ok`：少なくとも 1 つの対象に到達できます。
    - `degraded`：少なくとも 1 つの対象が接続を受け入れたものの、完全な詳細 RPC 診断を完了できませんでした。
    - `capability`：到達可能な対象全体で確認された最良の能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope`、または `unknown`）。
    - `primaryTargetId`：アクティブな優先対象として扱う最良の対象。優先順は、明示的 URL、SSH トンネル、設定済みリモート、local loopback です。
    - `warnings[]`：`code`、`message`、任意の `targetIds` を持つ、ベストエフォート方式の警告レコード。
    - `network`：現在の設定とホストネットワークから導出された local loopback／tailnet URL のヒント。
    - `discovery.timeoutMs`／`discovery.count`：このプローブ実行で実際に使用された検出時間枠／結果件数。

    対象ごと（`targets[].connect`）：`ok`（到達可能性と低下状態の分類）、`rpcOk`（完全な詳細 RPC の成功）、`scopeLimited`（operator スコープ不足により詳細 RPC が失敗）。

    対象ごと（`targets[].auth`）：利用可能な場合は `hello-ok` で報告された `role` と `scopes`、および表示される `capability` 分類。

  </Accordion>
  <Accordion title="一般的な警告コード">
    - `ssh_tunnel_failed`：SSH トンネルのセットアップに失敗したため、コマンドは直接プローブにフォールバックしました。
    - `multiple_gateways`：別個の Gateway ID に到達できたか、到達可能な対象が同一の Gateway であることを OpenClaw が確認できませんでした。同じ Gateway を指す SSH トンネル、プロキシ URL、または設定済みリモート URL では、この警告は発生しません。
    - `auth_secretref_unresolved`：失敗した対象に対して、設定済みの認証用 SecretRef を解決できませんでした。
    - `probe_scope_limited`：WebSocket 接続には成功しましたが、`operator.read` がないため、読み取りプローブが制限されました。
    - `local_tls_runtime_unavailable`：ローカル Gateway の TLS は有効ですが、OpenClaw はローカル証明書のフィンガープリントを読み込めませんでした。

  </Accordion>
</AccordionGroup>

#### SSH 経由のリモート（Mac アプリとの同等性）

macOS アプリの「Remote over SSH」モードはローカルポートフォワーディングを使用するため、local loopback のみを待ち受けるリモート Gateway に `ws://127.0.0.1:<port>` で到達できるようになります。

CLI での同等の操作：

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` または `user@host:port`（デフォルトのポートは `22`）。
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ID ファイル。
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  解決済みの検出エンドポイント（`local.` と、設定されている場合は広域ドメイン）から最初に検出された Gateway ホストを SSH 対象として選択します。TXT のみのヒントは無視されます。
</ParamField>

設定のデフォルト値（任意）：`gateway.remote.sshTarget`、`gateway.remote.sshIdentity`。

### `gateway call <method>`

低レベルの RPC ヘルパー。

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
  タイムアウト時間枠。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主に、最終ペイロードの前に中間イベントをストリーミングするエージェント形式の RPC で使用します。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な JSON 出力。
</ParamField>

<Note>
`--params` は有効な JSON である必要があり、各メソッドはそれぞれ独自のパラメーター形式を検証します（余分なフィールドや名前を誤ったフィールドは拒否されます）。
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

管理対象サービスを別の実行ファイル経由で起動する必要がある場合（例：シークレットマネージャーのシムや実行ユーザー指定ヘルパー）は、`--wrapper` を使用します。ラッパーは通常の Gateway 引数を受け取り、最終的にその引数を指定して `openclaw` または Node を exec する責任を負います。

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

環境変数を通じてラッパーを設定することもできます。`gateway install` は、パスが実行可能ファイルであることを検証し、ラッパーをサービスの `ProgramArguments` に書き込み、後で強制再インストール、更新、doctor による修復を行うために、サービス環境へ `OPENCLAW_WRAPPER` を永続化します。

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
    - `gateway install`: `--port`、`--runtime <node|bun>`（デフォルト: `node`）、`--token`、`--wrapper <path>`、`--force`、`--json`
    - `gateway restart`: `--safe`、`--skip-deferral`、`--force`、`--wait <duration>`、`--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`、`--json`

  </Accordion>
  <Accordion title="ライフサイクルの動作">
    - 管理対象サービスを再起動するには、`gateway restart` を使用します。再起動の代わりに `gateway stop` と `gateway start` を連続実行しないでください。
    - macOS では、`gateway stop` はデフォルトで `launchctl bootout` を使用します。これにより、無効化状態を永続化せずに現在のブートセッションから LaunchAgent が削除されます。KeepAlive による自動復旧は今後のクラッシュに対して有効なままで、`gateway start` を実行すれば、手動で `launchctl enable` を実行することなく正常に再有効化されます。KeepAlive と RunAtLoad を永続的に抑制し、次に明示的な `gateway start` を実行するまで Gateway が再起動しないようにするには、`--disable` を渡します。手動停止を再起動後も維持する必要がある場合に使用してください。
    - ライフサイクルコマンドは、スクリプト処理用の `--json` を受け付けます。

  </Accordion>
  <Accordion title="インストール時の認証と SecretRef">
    - トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef で管理されている場合、`gateway install` は SecretRef を解決できることを検証しますが、解決したトークンをサービス環境のメタデータへ永続化しません。
    - トークン認証にトークンが必要で、設定済みのトークン SecretRef を解決できない場合、フォールバックの平文を永続化せず、インストールは安全側に失敗します。
    - `gateway run` でパスワード認証を使用する場合は、インラインの `--password` よりも、`OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef を使用する `gateway.auth.password` を優先してください。
    - 推論された認証モードでは、シェル内のみの `OPENCLAW_GATEWAY_PASSWORD` によってインストール時のトークン要件が緩和されることはありません。管理対象サービスをインストールする場合は、永続的な設定（`gateway.auth.password` または設定内の `env`）を使用してください。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードを明示的に設定するまでインストールはブロックされます。

  </Accordion>
</AccordionGroup>

## Gateway を検出する（Bonjour）

`gateway discover` は、Gateway ビーコン（`_openclaw-gw._tcp`）をスキャンします。

- マルチキャスト DNS-SD: `local.`
- ユニキャスト DNS-SD（広域 Bonjour）: ドメイン（例: `openclaw.internal.`）を選択し、スプリット DNS と DNS サーバーを設定します。[Bonjour](/ja-JP/gateway/bonjour) を参照してください。

Bonjour 検出が有効（デフォルト）な Gateway のみがビーコンを通知します。

すべてのビーコンに含まれる TXT ヒント: `role`（Gateway のロールに関するヒント）、`transport`（トランスポートに関するヒント、例: `gateway`）、`gatewayPort`（WebSocket ポート、通常は `18789`）、`tailnetDns`（利用可能な場合の MagicDNS ホスト名）、`gatewayTls` / `gatewayTlsSha256`（TLS の有効状態と証明書フィンガープリント）。`sshPort` と `cliPath` は、完全検出モード（`discovery.mdns.mode: "full"`）でのみ公開されます。デフォルトは `"minimal"` で、これらは省略されます。その場合、クライアントは SSH 接続先のデフォルトポートとして `22` を使用します。

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  コマンドごとのタイムアウト（参照/解決）。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な出力（スタイル表示とスピナーも無効化します）。
</ParamField>

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- `local.` に加えて、有効になっている場合は設定済みの広域ドメインもスキャンします。
- JSON 出力の `wsUrl` は、`lanHost` や `tailnetDns` などの TXT のみのヒントではなく、解決されたサービスエンドポイントから導出されます。
- `discovery.mdns.mode` は、`local.` mDNS と広域 DNS-SD の両方で `sshPort` / `cliPath` を公開するかどうかを制御します（前述を参照）。

</Note>

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Gateway 運用手順書](/ja-JP/gateway)
