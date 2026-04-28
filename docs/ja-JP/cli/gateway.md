---
read_when:
    - CLI から Gateway を実行する（開発環境またはサーバー）
    - Gateway 認証、bind モード、接続性のデバッグ
    - Bonjour による Gateway の検出（ローカルおよび広域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway の実行、照会、検出
title: Gateway
x-i18n:
    generated_at: "2026-04-26T11:26:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8cdca95676f0b098e2dd79ff4245a32eaae82711ed6c2b7e39522331872cfd9
    source_path: cli/gateway.md
    workflow: 15
---

Gateway は OpenClaw の WebSocket サーバーです（channels、nodes、sessions、hooks）。このページのサブコマンドは `openclaw gateway …` 配下にあります。

<CardGroup cols={3}>
  <Card title="Bonjour 検出" href="/ja-JP/gateway/bonjour">
    ローカル mDNS + 広域 DNS-SD のセットアップ。
  </Card>
  <Card title="検出の概要" href="/ja-JP/gateway/discovery">
    OpenClaw が Gateway を公開し、検出する方法。
  </Card>
  <Card title="Configuration" href="/ja-JP/gateway/configuration">
    最上位の Gateway config キー。
  </Card>
</CardGroup>

## Gateway を実行する

ローカルの Gateway プロセスを実行します。

```bash
openclaw gateway
```

フォアグラウンドのエイリアス:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="起動時の挙動">
    - デフォルトでは、`~/.openclaw/openclaw.json` に `gateway.mode=local` が設定されていない限り、Gateway は起動を拒否します。アドホックな実行/開発実行には `--allow-unconfigured` を使用してください。
    - `openclaw onboard --mode local` と `openclaw setup` は `gateway.mode=local` を書き込むことが想定されています。ファイルが存在するのに `gateway.mode` がない場合は、暗黙的に local mode を仮定するのではなく、壊れたまたは上書きされた config とみなして修復してください。
    - ファイルが存在し、`gateway.mode` が欠けている場合、Gateway はそれを疑わしい config 破損とみなし、あなたの代わりに「local と推測」することはありません。
    - 認証なしで loopback を超えて bind することはブロックされます（安全ガードレール）。
    - 認可されている場合、`SIGUSR1` はインプロセス再起動をトリガーします（`commands.restart` はデフォルトで有効です。手動再起動をブロックするには `commands.restart: false` を設定してください。ただし gateway tool/config apply/update は引き続き許可されます）。
    - `SIGINT`/`SIGTERM` ハンドラーは gateway プロセスを停止しますが、カスタム terminal 状態は復元しません。CLI を TUI や raw-mode 入力でラップしている場合は、終了前に terminal を復元してください。

  </Accordion>
</AccordionGroup>

### オプション

<ParamField path="--port <port>" type="number">
  WebSocket ポート（デフォルトは config/env から取得。通常は `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  リスナー bind モード。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  認証モードのオーバーライド。
</ParamField>
<ParamField path="--token <token>" type="string">
  token のオーバーライド（プロセスの `OPENCLAW_GATEWAY_TOKEN` も設定します）。
</ParamField>
<ParamField path="--password <password>" type="string">
  password のオーバーライド。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  ファイルから gateway password を読み込みます。
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Tailscale 経由で Gateway を公開します。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  シャットダウン時に Tailscale serve/funnel 設定をリセットします。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  config 内に `gateway.mode=local` がなくても gateway の起動を許可します。アドホックな実行/開発用ブートストラップのためだけに起動ガードをバイパスしますが、config ファイルの書き込みや修復は行いません。
</ParamField>
<ParamField path="--dev" type="boolean">
  不足している場合は dev config + workspace を作成します（`BOOTSTRAP.md` はスキップ）。
</ParamField>
<ParamField path="--reset" type="boolean">
  dev config + credentials + sessions + workspace をリセットします（`--dev` が必要）。
</ParamField>
<ParamField path="--force" type="boolean">
  起動前に、選択したポートで既存の listener を強制終了します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  詳細ログ。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  コンソールには CLI バックエンドログのみを表示します（stdout/stderr も有効化）。
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Websocket ログスタイル。
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` のエイリアス。
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  生のモデルストリームイベントを jsonl に記録します。
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  生ストリーム jsonl のパス。
</ParamField>

<Warning>
インラインの `--password` はローカルのプロセス一覧に露出する可能性があります。`--password-file`、env、または SecretRef ベースの `gateway.auth.password` を推奨します。
</Warning>

### 起動プロファイリング

- Gateway 起動時のフェーズごとの所要時間をログするには `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を設定します。
- Gateway 起動をベンチマークするには `pnpm test:startup:gateway -- --runs 5 --warmup 1` を実行します。このベンチマークは、最初のプロセス出力、`/healthz`、`/readyz`、および起動トレースの所要時間を記録します。

## 実行中の Gateway を照会する

すべての照会コマンドは WebSocket RPC を使用します。

<Tabs>
  <Tab title="出力モード">
    - デフォルト: 人間向け可読形式（TTY では色付き）。
    - `--json`: 機械可読な JSON（スタイル/スピナーなし）。
    - `--no-color`（または `NO_COLOR=1`）: 人間向けレイアウトを維持したまま ANSI を無効化。

  </Tab>
  <Tab title="共通オプション">
    - `--url <url>`: Gateway WebSocket URL。
    - `--token <token>`: Gateway token。
    - `--password <password>`: Gateway password。
    - `--timeout <ms>`: タイムアウト/予算（コマンドごとに異なります）。
    - `--expect-final`: 「final」レスポンスを待機します（agent 呼び出し）。

  </Tab>
</Tabs>

<Note>
`--url` を設定すると、CLI は config や環境の認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` エンドポイントは生存確認プローブです。サーバーが HTTP に応答できるようになると返ります。HTTP `/readyz` エンドポイントはより厳格で、起動時の sidecar、channels、または設定済み hooks の安定化が完了するまでは red のままです。

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
  `payload.large` や `diagnostic.memory.pressure` などの診断イベント種別でフィルタします。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  診断シーケンス番号以降のイベントのみを含めます。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  実行中の Gateway を呼び出す代わりに、永続化された stability bundle を読み込みます。state ディレクトリ配下の最新 bundle には `--bundle latest`（または単に `--bundle`）を使用するか、bundle JSON パスを直接渡してください。
</ParamField>
<ParamField path="--export" type="boolean">
  stability の詳細を表示する代わりに、共有可能なサポート診断 zip を書き出します。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` の出力パス。
</ParamField>

<AccordionGroup>
  <Accordion title="プライバシーと bundle の挙動">
    - レコードには運用メタデータが保持されます。イベント名、件数、バイト数、メモリ測定値、キュー/セッション状態、channel/Plugin 名、伏せ字化されたセッションサマリーなどです。チャット本文、Webhook 本文、tool 出力、生のリクエスト/レスポンス本文、token、cookie、秘密値、ホスト名、生の session id は保持しません。recorder を完全に無効化するには `diagnostics.enabled: false` を設定してください。
    - Gateway の致命的終了、シャットダウンタイムアウト、再起動時の起動失敗時には、recorder にイベントがある場合、OpenClaw は同じ診断スナップショットを `~/.openclaw/logs/stability/openclaw-stability-*.json` に書き込みます。最新 bundle は `openclaw gateway stability --bundle latest` で確認できます。`--limit`、`--type`、`--since-seq` は bundle 出力にも適用されます。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

バグ報告への添付を想定したローカル診断 zip を書き出します。プライバシーモデルと bundle 内容については [Diagnostics Export](/ja-JP/gateway/diagnostics) を参照してください。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  出力 zip パス。デフォルトは state ディレクトリ配下のサポート export です。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  含めるサニタイズ済みログ行の最大数。
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  検査するログバイト数の最大値。
</ParamField>
<ParamField path="--url <url>" type="string">
  ヘルススナップショット用の Gateway WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  ヘルススナップショット用の Gateway token。
</ParamField>
<ParamField path="--password <password>" type="string">
  ヘルススナップショット用の Gateway password。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  status/health スナップショットのタイムアウト。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  永続化された stability bundle の検索をスキップします。
</ParamField>
<ParamField path="--json" type="boolean">
  書き込まれたパス、サイズ、manifest を JSON として出力します。
</ParamField>

この export には、manifest、Markdown サマリー、config 形式、サニタイズ済み config 詳細、サニタイズ済みログサマリー、サニタイズ済み Gateway status/health スナップショット、および存在する場合は最新の stability bundle が含まれます。

これは共有することを前提としています。デバッグに役立つ運用詳細、たとえば安全な OpenClaw ログフィールド、サブシステム名、status code、所要時間、設定されたモード、ポート、plugin id、provider id、秘密でない機能設定、伏せ字化された運用ログメッセージは保持します。一方で、チャット本文、Webhook 本文、tool 出力、認証情報、cookie、アカウント/メッセージ識別子、prompt/instruction 本文、ホスト名、秘密値は省略または伏せ字化されます。LogTape 形式のメッセージがユーザー/チャット/tool ペイロード本文のように見える場合、export には「メッセージが省略された」という情報とそのバイト数だけが保持されます。

### `gateway status`

`gateway status` は Gateway サービス（launchd/systemd/schtasks）と、オプションで接続性/認証能力の probe を表示します。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  明示的な probe 対象を追加します。設定済みのリモート + localhost も引き続き probe されます。
</ParamField>
<ParamField path="--token <token>" type="string">
  probe 用の token 認証。
</ParamField>
<ParamField path="--password <password>" type="string">
  probe 用の password 認証。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  probe のタイムアウト。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  接続性 probe をスキップします（サービスのみの表示）。
</ParamField>
<ParamField path="--deep" type="boolean">
  システムレベルのサービスもスキャンします。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  デフォルトの接続性 probe を read probe に引き上げ、その read probe が失敗した場合は非ゼロで終了します。`--no-probe` とは併用できません。
</ParamField>

<AccordionGroup>
  <Accordion title="status の意味">
    - `gateway status` は、ローカル CLI config が存在しない、または無効な場合でも、診断のために利用できます。
    - デフォルトの `gateway status` は、サービス状態、WebSocket 接続、そしてハンドシェイク時点で見える認証能力を確認します。read/write/admin 操作までは確認しません。
    - 診断 probe は、初回デバイス認証に対して非破壊です。既存のキャッシュ済みデバイス token があれば再利用しますが、status 確認のためだけに新しい CLI デバイス ID や read-only デバイスペアリングレコードを作成することはありません。
    - `gateway status` は、可能な場合 probe 認証のために設定済みの auth SecretRef を解決します。
    - このコマンド経路で必要な auth SecretRef が未解決の場合、probe の接続/認証が失敗すると、`gateway status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先に secret source を解決してください。
    - probe が成功した場合、auth-ref 未解決の警告は誤検知を避けるため抑制されます。
    - リッスン中のサービスだけでは不十分で、read スコープの RPC 呼び出しも正常である必要があるスクリプトや自動化では、`--require-rpc` を使ってください。
    - `--deep` は、追加の launchd/systemd/schtasks インストールをベストエフォートでスキャンします。複数の gateway 類似サービスが検出された場合、人間向け出力ではクリーンアップのヒントを表示し、ほとんどのセットアップでは 1 台のマシンにつき 1 つの gateway を実行するのが一般的であると警告します。
    - 人間向け出力には、プロファイルや state-dir のずれを診断しやすくするために、解決済みのファイルログパスと、CLI とサービスの config パス/妥当性スナップショットが含まれます。

  </Accordion>
  <Accordion title="Linux systemd の auth-drift チェック">
    - Linux systemd インストールでは、サービスの auth drift チェックは unit の `Environment=` と `EnvironmentFile=` の値の両方を読み取ります（`%h`、引用付きパス、複数ファイル、任意指定の `-` ファイルを含む）。
    - drift チェックは、マージされたランタイム env（サービスコマンド env を優先し、その後でプロセス env にフォールバック）を使って `gateway.auth.token` SecretRef を解決します。
    - token 認証が実質的に有効でない場合（`gateway.auth.mode` が明示的に `password`/`none`/`trusted-proxy`、または mode 未設定で password が優先され得て token 候補が有効になり得ない場合）、token drift チェックは config token の解決をスキップします。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` は「全部デバッグする」コマンドです。常に次を probe します。

- 設定済みのリモート gateway（設定されている場合）
- localhost（loopback）**リモートが設定されていても**

`--url` を渡すと、その明示的な対象が両方より前に追加されます。人間向け出力では対象は次のように表示されます。

- `URL (explicit)`
- `Remote (configured)` または `Remote (configured, inactive)`
- `Local loopback`

<Note>
複数の gateway に到達可能な場合は、それらすべてが表示されます。分離されたプロファイル/ポート（たとえば rescue bot）を使う場合は複数 gateway もサポートされますが、ほとんどのインストールでは依然として単一の gateway を実行します。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="解釈">
    - `Reachable: yes` は、少なくとも 1 つの対象が WebSocket 接続を受け入れたことを意味します。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` は、probe によって認証について確認できた内容を表します。これは reachability とは別です。
    - `Read probe: ok` は、read スコープの詳細 RPC 呼び出し（`health`/`status`/`system-presence`/`config.get`）も成功したことを意味します。
    - `Read probe: limited - missing scope: operator.read` は、接続には成功したが、read スコープ RPC が制限されていることを意味します。これは完全な失敗ではなく、**degraded** な到達性として報告されます。
    - `gateway status` と同様に、probe は既存のキャッシュ済みデバイス認証を再利用しますが、初回デバイス ID やペアリング状態は作成しません。
    - 終了コードが非ゼロになるのは、probe 対象のどれにも到達できなかった場合だけです。

  </Accordion>
  <Accordion title="JSON 出力">
    最上位:

    - `ok`: 少なくとも 1 つの対象に到達可能。
    - `degraded`: 少なくとも 1 つの対象でスコープ制限付きの詳細 RPC があった。
    - `capability`: 到達可能な対象全体で確認された最良の能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope`、または `unknown`）。
    - `primaryTargetId`: 次の順序でアクティブな勝者として扱う最良の対象: 明示的 URL、SSH トンネル、設定済みリモート、ローカル loopback。
    - `warnings[]`: `code`、`message`、オプションの `targetIds` を持つベストエフォートの警告レコード。
    - `network`: 現在の config とホストネットワークから導出されたローカル loopback/tailnet の URL ヒント。
    - `discovery.timeoutMs` と `discovery.count`: この probe パスで実際に使われた discovery の予算/結果件数。

    対象ごと（`targets[].connect`）:

    - `ok`: connect + degraded 分類後の到達性。
    - `rpcOk`: 完全な詳細 RPC 成功。
    - `scopeLimited`: operator スコープ不足により詳細 RPC が失敗した。

    対象ごと（`targets[].auth`）:

    - `role`: 利用可能な場合、`hello-ok` で報告された auth role。
    - `scopes`: 利用可能な場合、`hello-ok` で報告された付与済み scopes。
    - `capability`: その対象に対して表面化された auth 能力分類。

  </Accordion>
  <Accordion title="一般的な警告コード">
    - `ssh_tunnel_failed`: SSH トンネルのセットアップに失敗し、コマンドは直接 probe にフォールバックしました。
    - `multiple_gateways`: 複数の対象に到達可能でした。これは、rescue bot のように意図的に分離プロファイルを実行している場合を除き、通常ではありません。
    - `auth_secretref_unresolved`: 失敗した対象に対して設定済みの auth SecretRef を解決できませんでした。
    - `probe_scope_limited`: WebSocket 接続には成功しましたが、read probe が `operator.read` 不足によって制限されました。

  </Accordion>
</AccordionGroup>

#### SSH 経由のリモート（Mac app と同等）

macOS アプリの「Remote over SSH」モードはローカルのポートフォワードを使用するため、リモート gateway（loopback のみに bind されている場合もあります）に `ws://127.0.0.1:<port>` で到達できるようになります。

CLI での同等操作:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` または `user@host:port`（port のデフォルトは `22`）。
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ID ファイル。
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  解決済み discovery endpoint（`local.` と、設定されていれば設定済み広域ドメイン）から、最初に検出された gateway host を SSH 対象として選択します。TXT のみのヒントは無視されます。
</ParamField>

Config（任意、デフォルトとして使用）:

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低レベル RPC ヘルパーです。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  params 用 JSON オブジェクト文字列。
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway token。
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway password。
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  タイムアウト予算。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主に、中間イベントをストリームした後に final ペイロードを返す agent 形式の RPC 用です。
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

<AccordionGroup>
  <Accordion title="コマンドオプション">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="サービスのインストールとライフサイクルに関する注意">
    - `gateway install` は `--port`, `--runtime`, `--token`, `--force`, `--json` をサポートします。
    - 管理対象サービスを再起動するには `gateway restart` を使ってください。`gateway stop` と `gateway start` をつないで再起動の代用にしないでください。macOS では、`gateway stop` は停止前に LaunchAgent を意図的に無効化します。
    - token 認証で token が必要で、`gateway.auth.token` が SecretRef 管理の場合、`gateway install` はその SecretRef が解決可能であることを検証しますが、解決済み token をサービス環境メタデータへ永続化はしません。
    - token 認証で token が必要なのに、設定済み token SecretRef が未解決の場合、インストールは平文フォールバックを永続化するのではなく closed fail します。
    - `gateway run` の password 認証では、インラインの `--password` より `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef ベースの `gateway.auth.password` を推奨します。
    - 推論 auth モードでは、シェルの `OPENCLAW_GATEWAY_PASSWORD` だけではインストール時の token 要件は緩和されません。管理対象サービスをインストールする場合は、永続的な config（`gateway.auth.password` または config `env`）を使用してください。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、mode を明示的に設定するまでインストールはブロックされます。
    - ライフサイクルコマンドはスクリプト向けに `--json` を受け付けます。

  </Accordion>
</AccordionGroup>

## Gateway を検出する（Bonjour）

`gateway discover` は Gateway ビーコン（`_openclaw-gw._tcp`）をスキャンします。

- マルチキャスト DNS-SD: `local.`
- ユニキャスト DNS-SD（Wide-Area Bonjour）: ドメインを選び（例: `openclaw.internal.`）、split DNS + DNS サーバーを設定します。詳細は [Bonjour](/ja-JP/gateway/bonjour) を参照してください。

Bonjour discovery が有効な gateway のみ（デフォルトで有効）がビーコンを公開します。

Wide-Area discovery レコードには（TXT）次が含まれます。

- `role`（gateway role ヒント）
- `transport`（トランスポートヒント。例: `gateway`）
- `gatewayPort`（WebSocket port、通常は `18789`）
- `sshPort`（任意。未指定時、クライアントの SSH 対象はデフォルトで `22`）
- `tailnetDns`（利用可能な場合の MagicDNS ホスト名）
- `gatewayTls` / `gatewayTlsSha256`（TLS 有効 + 証明書フィンガープリント）
- `cliPath`（広域ゾーンに書き込まれるリモートインストールヒント）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  コマンドごとのタイムアウト（browse/resolve）。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な出力（スタイル/スピナーも無効化）。
</ParamField>

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI は `local.` と、設定されていれば設定済み広域ドメインをスキャンします。
- JSON 出力の `wsUrl` は、`lanHost` や `tailnetDns` のような TXT のみのヒントからではなく、解決されたサービス endpoint から導出されます。
- `local.` mDNS では、`sshPort` と `cliPath` がブロードキャストされるのは `discovery.mdns.mode` が `full` のときだけです。Wide-Area DNS-SD では引き続き `cliPath` が書き込まれます。`sshPort` も引き続き任意です。

</Note>

## 関連

- [CLI reference](/ja-JP/cli)
- [Gateway runbook](/ja-JP/gateway)
