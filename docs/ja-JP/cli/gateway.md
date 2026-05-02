---
read_when:
    - CLI から Gateway を実行する（開発環境またはサーバー）
    - Gateway の認証、バインドモード、接続性のデバッグ
    - Bonjour による Gateway の検出（ローカル + ワイドエリア DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gatewayを実行、照会、検出する
title: Gateway
x-i18n:
    generated_at: "2026-05-02T04:51:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f204b58e03c9dd1b75a7ddb2be0634ee70b42aa317a2668ab86cb33a0570b01
    source_path: cli/gateway.md
    workflow: 16
---

Gateway は OpenClaw の WebSocket サーバー（チャンネル、ノード、セッション、フック）です。このページのサブコマンドは `openclaw gateway …` 配下にあります。

<CardGroup cols={3}>
  <Card title="Bonjour 検出" href="/ja-JP/gateway/bonjour">
    ローカル mDNS + ワイドエリア DNS-SD のセットアップ。
  </Card>
  <Card title="検出の概要" href="/ja-JP/gateway/discovery">
    OpenClaw が Gateway を広告して検出する仕組み。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration">
    トップレベルの Gateway 設定キー。
  </Card>
</CardGroup>

## Gateway を実行する

ローカル Gateway プロセスを実行します。

```bash
openclaw gateway
```

フォアグラウンドのエイリアス:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="起動時の動作">
    - 既定では、`~/.openclaw/openclaw.json` に `gateway.mode=local` が設定されていない限り、Gateway は起動を拒否します。アドホック/開発用の実行には `--allow-unconfigured` を使います。
    - `openclaw onboard --mode local` と `openclaw setup` は `gateway.mode=local` を書き込む想定です。ファイルは存在するが `gateway.mode` がない場合、local モードを暗黙に仮定するのではなく、壊れた、または上書きされた設定として扱い、修復してください。
    - ファイルが存在し、`gateway.mode` がない場合、Gateway はそれを疑わしい設定破損として扱い、「local を推測」することを拒否します。
    - 認証なしで loopback を超えてバインドすることはブロックされます（安全ガードレール）。
    - `SIGUSR1` は認可されている場合、プロセス内再起動をトリガーします（`commands.restart` は既定で有効です。手動再起動をブロックするには `commands.restart: false` を設定します。一方で gateway ツール/設定の apply/update は引き続き許可されます）。
    - `SIGINT`/`SIGTERM` ハンドラーは gateway プロセスを停止しますが、カスタムのターミナル状態は復元しません。CLI を TUI や raw-mode 入力でラップしている場合は、終了前にターミナルを復元してください。

  </Accordion>
</AccordionGroup>

### オプション

<ParamField path="--port <port>" type="number">
  WebSocket ポート（既定は設定/env から取得されます。通常は `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  リスナーのバインドモード。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  認証モードの上書き。
</ParamField>
<ParamField path="--token <token>" type="string">
  トークンの上書き（プロセスに対して `OPENCLAW_GATEWAY_TOKEN` も設定します）。
</ParamField>
<ParamField path="--password <password>" type="string">
  パスワードの上書き。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Gateway パスワードをファイルから読み取ります。
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Tailscale 経由で Gateway を公開します。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  シャットダウン時に Tailscale serve/funnel 設定をリセットします。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  設定内に `gateway.mode=local` がなくても gateway の起動を許可します。アドホック/開発用 bootstrap のためだけに起動ガードをバイパスします。設定ファイルの書き込みや修復は行いません。
</ParamField>
<ParamField path="--dev" type="boolean">
  存在しない場合は開発用設定 + ワークスペースを作成します（BOOTSTRAP.md はスキップします）。
</ParamField>
<ParamField path="--reset" type="boolean">
  開発用設定 + 認証情報 + セッション + ワークスペースをリセットします（`--dev` が必要です）。
</ParamField>
<ParamField path="--force" type="boolean">
  起動前に、選択したポートの既存リスナーをすべて強制終了します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  詳細ログ。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  コンソールには CLI バックエンドログのみを表示します（stdout/stderr も有効にします）。
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Websocket ログスタイル。
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` のエイリアス。
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  生のモデルストリームイベントを jsonl にログ出力します。
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  生ストリーム jsonl のパス。
</ParamField>

<Warning>
インラインの `--password` はローカルプロセス一覧に露出する可能性があります。`--password-file`、env、または SecretRef で裏付けられた `gateway.auth.password` を優先してください。
</Warning>

### 起動プロファイリング

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を設定すると、Gateway 起動中のフェーズごとのタイミングをログ出力します。これには、フェーズごとの `eventLoopMax` 遅延と、installed-index、manifest registry、起動計画、owner-map 作業の plugin lookup-table タイミングが含まれます。
- `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` とともに `OPENCLAW_DIAGNOSTICS=timeline` を設定すると、外部 QA ハーネス向けのベストエフォートな JSONL 起動診断タイムラインを書き込みます。設定内の `diagnostics.flags: ["timeline"]` でもフラグを有効にできます。パスは引き続き env で指定します。event-loop サンプルを含めるには `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` を追加します。
- Gateway 起動をベンチマークするには `pnpm test:startup:gateway -- --runs 5 --warmup 1` を実行します。このベンチマークは、最初のプロセス出力、`/healthz`、`/readyz`、起動トレースのタイミング、event-loop 遅延、plugin lookup-table タイミングの詳細を記録します。

## 実行中の Gateway を照会する

すべての照会コマンドは WebSocket RPC を使います。

<Tabs>
  <Tab title="出力モード">
    - 既定: 人間が読める形式（TTY では色付き）。
    - `--json`: 機械可読 JSON（スタイル/スピナーなし）。
    - `--no-color`（または `NO_COLOR=1`）: 人間向けレイアウトを保ったまま ANSI を無効にします。

  </Tab>
  <Tab title="共通オプション">
    - `--url <url>`: Gateway WebSocket URL。
    - `--token <token>`: Gateway トークン。
    - `--password <password>`: Gateway パスワード。
    - `--timeout <ms>`: タイムアウト/予算（コマンドによって異なります）。
    - `--expect-final`: 「final」応答を待ちます（エージェント呼び出し）。

  </Tab>
</Tabs>

<Note>
`--url` を設定すると、CLI は設定や環境認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` エンドポイントは liveness probe です。サーバーが HTTP に応答できるようになると返ります。HTTP `/readyz` エンドポイントはより厳密で、起動時の plugin sidecar、チャンネル、または設定済みフックがまだ落ち着いていない間は赤のままです。ローカルまたは認証済みの詳細 readiness 応答には、event-loop 遅延、event-loop 使用率、CPU コア比率、`degraded` フラグを含む `eventLoop` 診断ブロックが含まれます。

### `gateway usage-cost`

セッションログから usage-cost サマリーを取得します。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  含める日数。
</ParamField>

### `gateway stability`

実行中の Gateway から最近の診断 stability recorder を取得します。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  含める最近のイベントの最大数（最大 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  `payload.large` や `diagnostic.memory.pressure` など、診断イベントタイプでフィルターします。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  診断シーケンス番号より後のイベントのみを含めます。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  実行中の Gateway を呼び出す代わりに、永続化された stability bundle を読み取ります。状態ディレクトリ配下の最新 bundle には `--bundle latest`（または単に `--bundle`）を使うか、bundle JSON パスを直接渡します。
</ParamField>
<ParamField path="--export" type="boolean">
  stability の詳細を出力する代わりに、共有可能なサポート診断 zip を書き込みます。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` の出力パス。
</ParamField>

<AccordionGroup>
  <Accordion title="プライバシーと bundle の動作">
    - レコードは運用メタデータを保持します: イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャンネル/plugin 名、墨消し済みセッションサマリー。チャットテキスト、Webhook 本文、ツール出力、生のリクエスト本文やレスポンス本文、トークン、Cookie、シークレット値、ホスト名、生のセッション ID は保持しません。recorder を完全に無効にするには `diagnostics.enabled: false` を設定します。
    - 致命的な Gateway 終了、シャットダウンタイムアウト、再起動時の起動失敗では、recorder にイベントがある場合、OpenClaw は同じ診断スナップショットを `~/.openclaw/logs/stability/openclaw-stability-*.json` に書き込みます。最新 bundle は `openclaw gateway stability --bundle latest` で確認します。`--limit`、`--type`、`--since-seq` は bundle 出力にも適用されます。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

バグレポートに添付するために設計されたローカル診断 zip を書き込みます。プライバシーモデルと bundle の内容については、[診断エクスポート](/ja-JP/gateway/diagnostics) を参照してください。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  出力 zip パス。既定では状態ディレクトリ配下のサポートエクスポートになります。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  含めるサニタイズ済みログ行の最大数。
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  検査するログバイトの最大数。
</ParamField>
<ParamField path="--url <url>" type="string">
  health スナップショット用の Gateway WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  health スナップショット用の Gateway トークン。
</ParamField>
<ParamField path="--password <password>" type="string">
  health スナップショット用の Gateway パスワード。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  ステータス/health スナップショットのタイムアウト。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  永続化された stability bundle の検索をスキップします。
</ParamField>
<ParamField path="--json" type="boolean">
  書き込まれたパス、サイズ、manifest を JSON として出力します。
</ParamField>

エクスポートには、manifest、Markdown サマリー、設定形状、サニタイズ済み設定詳細、サニタイズ済みログサマリー、サニタイズ済み Gateway ステータス/health スナップショット、存在する場合は最新の stability bundle が含まれます。

これは共有を意図しています。デバッグに役立つ運用詳細を保持します。たとえば、安全な OpenClaw ログフィールド、サブシステム名、ステータスコード、期間、設定済みモード、ポート、plugin ID、provider ID、シークレットではない機能設定、墨消し済み運用ログメッセージなどです。チャットテキスト、Webhook 本文、ツール出力、認証情報、Cookie、アカウント/メッセージ識別子、プロンプト/指示テキスト、ホスト名、シークレット値は省略または墨消しされます。LogTape 形式のメッセージがユーザー/チャット/ツール payload テキストのように見える場合、エクスポートではメッセージが省略された事実とそのバイト数のみを保持します。

### `gateway status`

`gateway status` は Gateway サービス（launchd/systemd/schtasks）に加えて、接続性/認証機能の任意の probe を表示します。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  明示的な probe 対象を追加します。設定済み remote + localhost も引き続き probe されます。
</ParamField>
<ParamField path="--token <token>" type="string">
  probe 用のトークン認証。
</ParamField>
<ParamField path="--password <password>" type="string">
  probe 用のパスワード認証。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  probe タイムアウト。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  接続性 probe をスキップします（サービスのみのビュー）。
</ParamField>
<ParamField path="--deep" type="boolean">
  システムレベルのサービスもスキャンします。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  既定の接続性 probe を read probe にアップグレードし、その read probe が失敗した場合は非ゼロで終了します。`--no-probe` と組み合わせることはできません。
</ParamField>

<AccordionGroup>
  <Accordion title="ステータスの意味">
    - `gateway status` は、ローカル CLI 設定が存在しない、または無効な場合でも診断用に利用できます。
    - デフォルトの `gateway status` は、サービス状態、WebSocket 接続、ハンドシェイク時に見える認証ケイパビリティを確認します。読み取り/書き込み/管理者操作は確認しません。
    - 診断プローブは、初回デバイス認証に対して変更を行いません。既存のキャッシュ済みデバイストークンがある場合は再利用しますが、ステータス確認のためだけに新しい CLI デバイス ID や読み取り専用デバイスペアリングレコードを作成することはありません。
    - `gateway status` は、可能な場合、プローブ認証用に設定済みの認証 SecretRefs を解決します。
    - このコマンドパスで必須の認証 SecretRef が未解決の場合、プローブの接続性/認証に失敗すると `gateway status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
    - プローブが成功した場合、誤検出を避けるため未解決の auth-ref 警告は抑制されます。
    - リスン中のサービスだけでは不十分で、読み取りスコープの RPC 呼び出しも正常である必要があるスクリプトや自動化では、`--require-rpc` を使用してください。
    - `--deep` は、追加の launchd/systemd/schtasks インストールをベストエフォートでスキャンします。複数の gateway らしいサービスが検出された場合、人間向け出力はクリーンアップのヒントを出力し、ほとんどの構成ではマシンごとに 1 つの gateway を実行すべきだと警告します。
    - 人間向け出力には、解決済みのファイルログパスと、CLI とサービスの設定パス/有効性のスナップショットが含まれ、プロファイルや状態ディレクトリのずれを診断しやすくします。

  </Accordion>
  <Accordion title="Linux systemd の認証ドリフトチェック">
    - Linux systemd インストールでは、サービス認証ドリフトチェックはユニットから `Environment=` と `EnvironmentFile=` の両方の値を読み取ります（`%h`、引用符付きパス、複数ファイル、任意の `-` ファイルを含む）。
    - ドリフトチェックは、マージされたランタイム env（まずサービスコマンド env、次にプロセス env フォールバック）を使用して `gateway.auth.token` SecretRefs を解決します。
    - トークン認証が実質的に有効でない場合（明示的な `gateway.auth.mode` が `password`/`none`/`trusted-proxy`、または mode が未設定で password が優先される可能性があり、かつ token 候補が優先されない場合）、token-drift チェックは設定トークンの解決をスキップします。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` は「すべてをデバッグする」コマンドです。常に次をプローブします。

- 設定済みのリモート gateway（設定されている場合）、および
- localhost（loopback）。**リモートが設定されていても**対象になります。

`--url` を渡すと、その明示的なターゲットが両方より前に追加されます。人間向け出力では、ターゲットに次のラベルが付きます。

- `URL (explicit)`
- `Remote (configured)` または `Remote (configured, inactive)`
- `Local loopback`

<Note>
複数の gateways に到達できる場合、それらすべてを出力します。分離されたプロファイル/ポート（例: レスキューボット）を使用する場合は複数 gateways がサポートされますが、ほとんどのインストールでは単一の gateway を実行します。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="解釈">
    - `Reachable: yes` は、少なくとも 1 つのターゲットが WebSocket 接続を受け入れたことを意味します。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` は、プローブが認証について確認できた内容を報告します。到達可能性とは別です。
    - `Read probe: ok` は、読み取りスコープの詳細 RPC 呼び出し（`health`/`status`/`system-presence`/`config.get`）も成功したことを意味します。
    - `Read probe: limited - missing scope: operator.read` は、接続は成功したが読み取りスコープの RPC が制限されていることを意味します。これは完全な失敗ではなく、到達可能性の**劣化**として報告されます。
    - `Connect: ok` の後の `Read probe: failed` は、Gateway が WebSocket 接続を受け入れたものの、後続の読み取り診断がタイムアウトまたは失敗したことを意味します。これも到達不能な Gateway ではなく、到達可能性の**劣化**です。
    - `gateway status` と同様に、probe は既存のキャッシュ済みデバイス認証を再利用しますが、初回デバイス ID やペアリング状態は作成しません。
    - 終了コードが 0 以外になるのは、プローブされたどのターゲットにも到達できない場合だけです。

  </Accordion>
  <Accordion title="JSON 出力">
    トップレベル:

    - `ok`: 少なくとも 1 つのターゲットに到達できます。
    - `degraded`: 少なくとも 1 つのターゲットが接続を受け入れたが、詳細 RPC 診断を完全には完了しませんでした。
    - `capability`: 到達可能なターゲット全体で確認された最良のケイパビリティ（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope`、または `unknown`）。
    - `primaryTargetId`: アクティブな勝者として扱う最良のターゲット。順序は、明示的 URL、SSH トンネル、設定済みリモート、local loopback です。
    - `warnings[]`: `code`、`message`、任意の `targetIds` を持つベストエフォートの警告レコード。
    - `network`: 現在の設定とホストネットワークから導出された local loopback/tailnet URL ヒント。
    - `discovery.timeoutMs` と `discovery.count`: このプローブパスで使用された実際の discovery 予算/結果数。

    ターゲットごと（`targets[].connect`）:

    - `ok`: 接続後の到達可能性 + 劣化分類。
    - `rpcOk`: 詳細 RPC が完全に成功しました。
    - `scopeLimited`: 必要な operator scope がないため、詳細 RPC が失敗しました。

    ターゲットごと（`targets[].auth`）:

    - `role`: 利用可能な場合、`hello-ok` で報告された認証ロール。
    - `scopes`: 利用可能な場合、`hello-ok` で報告された付与済みスコープ。
    - `capability`: そのターゲットについて表面化された認証ケイパビリティ分類。

  </Accordion>
  <Accordion title="一般的な警告コード">
    - `ssh_tunnel_failed`: SSH トンネルのセットアップに失敗しました。コマンドは直接プローブにフォールバックしました。
    - `multiple_gateways`: 複数のターゲットに到達できました。レスキューボットなど、分離されたプロファイルを意図的に実行している場合を除き、これは通常ではありません。
    - `auth_secretref_unresolved`: 失敗したターゲットについて、設定済みの認証 SecretRef を解決できませんでした。
    - `probe_scope_limited`: WebSocket 接続は成功しましたが、`operator.read` がないため読み取りプローブが制限されました。

  </Accordion>
</AccordionGroup>

#### SSH 経由のリモート（Mac アプリとの同等性）

macOS アプリの「Remote over SSH」モードはローカルのポートフォワードを使用するため、リモート gateway（loopback のみにバインドされている可能性があります）が `ws://127.0.0.1:<port>` で到達可能になります。

CLI での同等操作:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` または `user@host:port`（port のデフォルトは `22`）。
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Identity ファイル。
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  解決済み discovery endpoint（`local.` に加えて、設定済みの wide-area domain があればそれも）から、最初に検出された gateway ホストを SSH ターゲットとして選択します。TXT のみのヒントは無視されます。
</ParamField>

設定（任意、デフォルトとして使用）:

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低レベル RPC ヘルパー。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  params 用の JSON オブジェクト文字列。
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
<ParamField path="--timeout <ms>" type="number">
  タイムアウト予算。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主に、最終ペイロードの前に中間イベントをストリーミングする agent 形式の RPC 向けです。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な JSON 出力。
</ParamField>

<Note>
`--params` は有効な JSON である必要があります。
</Note>

## Gateway サービスを管理する

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### wrapper 付きでインストールする

管理対象サービスを別の実行ファイル経由で起動する必要がある場合、たとえば
secrets manager shim や run-as helper などでは、`--wrapper` を使用します。wrapper は通常の Gateway args を受け取り、
最終的にそれらの args で `openclaw` または Node を exec する責任があります。

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

環境経由で wrapper を設定することもできます。`gateway install` は、パスが
実行可能ファイルであることを検証し、wrapper をサービス `ProgramArguments` に書き込み、
後続の強制再インストール、更新、doctor 修復のためにサービス環境に
`OPENCLAW_WRAPPER` を永続化します。

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

永続化された wrapper を削除するには、再インストール時に `OPENCLAW_WRAPPER` をクリアします。

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="コマンドオプション">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="ライフサイクルの動作">
    - 管理対象サービスを再起動するには `gateway restart` を使用します。再起動の代わりとして `gateway stop` と `gateway start` を連鎖させないでください。macOS では、`gateway stop` は停止前に意図的に LaunchAgent を無効化します。
    - ライフサイクルコマンドは、スクリプト用に `--json` を受け付けます。

  </Accordion>
  <Accordion title="インストール時の認証と SecretRefs">
    - トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef で管理されている場合、`gateway install` は SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータには永続化しません。
    - トークン認証にトークンが必要で、設定済みの token SecretRef が未解決の場合、fallback plaintext を永続化するのではなく、インストールは fail closed します。
    - `gateway run` のパスワード認証では、インラインの `--password` よりも `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef で裏付けられた `gateway.auth.password` を優先してください。
    - 推論される認証モードでは、shell のみの `OPENCLAW_GATEWAY_PASSWORD` はインストール時の token 要件を緩和しません。管理対象サービスをインストールする場合は、永続的な設定（`gateway.auth.password` または config `env`）を使用してください。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、mode が明示的に設定されるまでインストールはブロックされます。

  </Accordion>
</AccordionGroup>

## gateways を検出する（Bonjour）

`gateway discover` は Gateway beacons（`_openclaw-gw._tcp`）をスキャンします。

- Multicast DNS-SD: `local.`
- Unicast DNS-SD（Wide-Area Bonjour）: domain（例: `openclaw.internal.`）を選択し、split DNS + DNS server をセットアップします。[Bonjour](/ja-JP/gateway/bonjour) を参照してください。

Bonjour discovery が有効（デフォルト）な gateways のみが beacon をアドバタイズします。

Wide-Area discovery records には以下が含まれます（TXT）:

- `role`（gateway role ヒント）
- `transport`（transport ヒント、例: `gateway`）
- `gatewayPort`（WebSocket port、通常は `18789`）
- `sshPort`（任意。存在しない場合、clients は SSH targets のデフォルトを `22` にします）
- `tailnetDns`（利用可能な場合、MagicDNS hostname）
- `gatewayTls` / `gatewayTlsSha256`（TLS 有効 + cert fingerprint）
- `cliPath`（wide-area zone に書き込まれる remote-install ヒント）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  コマンドごとのタイムアウト（browse/resolve）。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な出力（スタイリング/spinner も無効にします）。
</ParamField>

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI は、有効化されている場合、`local.` と構成済みのワイドエリアドメインをスキャンします。
- JSON 出力の `wsUrl` は、`lanHost` や `tailnetDns` のような TXT のみのヒントではなく、解決されたサービスエンドポイントから派生します。
- `local.` mDNS では、`sshPort` と `cliPath` は `discovery.mdns.mode` が `full` の場合にのみブロードキャストされます。ワイドエリア DNS-SD でも `cliPath` は書き込まれますが、そこでも `sshPort` は任意のままです。

</Note>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
