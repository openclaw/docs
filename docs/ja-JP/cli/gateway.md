---
read_when:
    - CLI から Gateway を実行する（開発環境またはサーバー）
    - Gateway 認証、bind モード、および接続性のデバッグ
    - Bonjour による Gateway の検出（ローカルおよび広域 DNS-SD）
summary: OpenClaw Gateway CLI（`openclaw gateway`）— Gateway の実行、照会、検出
title: gateway
x-i18n:
    generated_at: "2026-04-23T14:01:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9160017a4d1326819f6b4d067bd99aa02ee37689b96c185defedef6200c19cf
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway CLI

Gateway は OpenClaw の WebSocket サーバーです（channels、nodes、sessions、hooks）。

このページのサブコマンドは `openclaw gateway …` の下にあります。

関連ドキュメント:

- [/gateway/bonjour](/ja-JP/gateway/bonjour)
- [/gateway/discovery](/ja-JP/gateway/discovery)
- [/gateway/configuration](/ja-JP/gateway/configuration)

## Gateway を実行する

ローカル Gateway プロセスを実行します:

```bash
openclaw gateway
```

フォアグラウンド alias:

```bash
openclaw gateway run
```

注記:

- デフォルトでは、`~/.openclaw/openclaw.json` に `gateway.mode=local` が設定されていない限り、Gateway は起動を拒否します。アドホック/開発用の実行には `--allow-unconfigured` を使用してください。
- `openclaw onboard --mode local` と `openclaw setup` は `gateway.mode=local` を書き込むことが想定されています。ファイルが存在するのに `gateway.mode` が欠けている場合は、暗黙に local モードを想定するのではなく、壊れているか上書きされた config とみなして修復してください。
- ファイルが存在し、`gateway.mode` が欠けている場合、Gateway はそれを疑わしい config の破損とみなし、こちらの代わりに「local と推測する」ことはしません。
- 認証なしで loopback を超えて bind することはブロックされます（安全ガードレール）。
- `SIGUSR1` は、認可されていればプロセス内再起動をトリガーします（`commands.restart` はデフォルトで有効です。手動再起動をブロックするには `commands.restart: false` を設定してください。ただし gateway tool/config apply/update は引き続き許可されます）。
- `SIGINT`/`SIGTERM` ハンドラーは gateway プロセスを停止しますが、カスタム terminal 状態は復元しません。CLI を TUI または raw-mode 入力でラップしている場合は、終了前に terminal を復元してください。

### オプション

- `--port <port>`: WebSocket ポート（デフォルトは config/env 由来。通常は `18789`）。
- `--bind <loopback|lan|tailnet|auto|custom>`: listener の bind モード。
- `--auth <token|password>`: auth モードの上書き。
- `--token <token>`: token の上書き（プロセス用に `OPENCLAW_GATEWAY_TOKEN` も設定）。
- `--password <password>`: password の上書き。警告: インライン password はローカルの process list で露出する可能性があります。
- `--password-file <path>`: ファイルから gateway password を読み取ります。
- `--tailscale <off|serve|funnel>`: Tailscale 経由で Gateway を公開します。
- `--tailscale-reset-on-exit`: シャットダウン時に Tailscale serve/funnel config をリセットします。
- `--allow-unconfigured`: config に `gateway.mode=local` がなくても gateway の起動を許可します。これはアドホック/開発用 bootstrap のためだけに起動ガードをバイパスするもので、config ファイルを書き込んだり修復したりはしません。
- `--dev`: dev config + workspace がなければ作成します（`BOOTSTRAP.md` をスキップ）。
- `--reset`: dev config + credentials + sessions + workspace をリセットします（`--dev` が必要）。
- `--force`: 起動前に、選択したポートで既存の listener をすべて終了します。
- `--verbose`: 詳細ログ。
- `--cli-backend-logs`: コンソールには CLI backend logs のみ表示します（stdout/stderr も有効化）。
- `--ws-log <auto|full|compact>`: websocket ログ形式（デフォルトは `auto`）。
- `--compact`: `--ws-log compact` の alias。
- `--raw-stream`: 生の model stream event を jsonl に記録します。
- `--raw-stream-path <path>`: 生 stream の jsonl パス。

起動プロファイリング:

- Gateway 起動中のフェーズ時間を記録するには `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を設定します。
- Gateway 起動をベンチマークするには `pnpm test:startup:gateway -- --runs 5 --warmup 1` を実行します。このベンチマークでは、最初の process 出力、`/healthz`、`/readyz`、および startup trace の時間を記録します。

## 実行中の Gateway を照会する

すべての照会コマンドは WebSocket RPC を使用します。

出力モード:

- デフォルト: 人が読みやすい形式（TTY では色付き）。
- `--json`: 機械可読な JSON（スタイルや spinner なし）。
- `--no-color`（または `NO_COLOR=1`）: 人向けレイアウトを維持したまま ANSI を無効化。

共通オプション（対応している場合）:

- `--url <url>`: Gateway WebSocket URL。
- `--token <token>`: Gateway token。
- `--password <password>`: Gateway password。
- `--timeout <ms>`: timeout/budget（コマンドごとに異なります）。
- `--expect-final`: 「final」レスポンスを待ちます（agent calls）。

注: `--url` を設定すると、CLI は config や environment credentials にフォールバックしません。
`--token` または `--password` を明示的に渡してください。明示的 credentials がない場合はエラーです。

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP の `/healthz` endpoint は liveness probe です。サーバーが HTTP に応答できるようになれば返ります。HTTP の `/readyz` endpoint はより厳格で、startup sidecar、channels、または設定済み hooks の安定化が終わるまで red のままです。

### `gateway usage-cost`

セッションログから usage-cost のサマリーを取得します。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

オプション:

- `--days <days>`: 含める日数（デフォルト `30`）。

### `gateway stability`

実行中の Gateway から最近の diagnostic stability recorder を取得します。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

オプション:

- `--limit <limit>`: 含める最近の event の最大数（デフォルト `25`、最大 `1000`）。
- `--type <type>`: `payload.large` や `diagnostic.memory.pressure` などの diagnostic event type でフィルタします。
- `--since-seq <seq>`: 指定した diagnostic sequence number より後の event のみ含めます。
- `--bundle [path]`: 実行中の Gateway を呼び出す代わりに、永続化された stability bundle を読み取ります。state directory 配下の最新 bundle には `--bundle latest`（または単に `--bundle`）を使うか、bundle JSON path を直接渡してください。
- `--export`: stability 詳細を表示する代わりに、共有可能なサポート診断 zip を書き出します。
- `--output <path>`: `--export` の出力パス。

注記:

- レコードには運用メタデータが保持されます: event 名、件数、byte サイズ、memory 読み取り値、queue/session 状態、channel/plugin 名、サニタイズされた session summary。chat text、webhook body、tool output、生の request または response body、token、cookie、secret 値、hostname、生の session id は保持されません。recorder を完全に無効にするには `diagnostics.enabled: false` を設定してください。
- Gateway の致命的終了、shutdown timeout、再起動時の startup failure では、recorder に event がある場合、OpenClaw は同じ diagnostic snapshot を `~/.openclaw/logs/stability/openclaw-stability-*.json` に書き込みます。最新 bundle は `openclaw gateway stability --bundle latest` で確認できます。`--limit`、`--type`、`--since-seq` も bundle 出力に適用されます。

### `gateway diagnostics export`

バグレポートに添付するためのローカル diagnostics zip を書き出します。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

オプション:

- `--output <path>`: 出力 zip パス。デフォルトは state directory 配下の support export。
- `--log-lines <count>`: 含めるサニタイズ済みログ行数の最大値（デフォルト `5000`）。
- `--log-bytes <bytes>`: 検査するログ byte 数の最大値（デフォルト `1000000`）。
- `--url <url>`: health snapshot 用の Gateway WebSocket URL。
- `--token <token>`: health snapshot 用の Gateway token。
- `--password <password>`: health snapshot 用の Gateway password。
- `--timeout <ms>`: status/health snapshot timeout（デフォルト `3000`）。
- `--no-stability-bundle`: 永続化された stability bundle の探索をスキップします。
- `--json`: 書き込まれた path、サイズ、manifest を JSON で出力します。

この export には、manifest、Markdown summary、config shape、サニタイズ済み config 詳細、サニタイズ済みログ summary、サニタイズ済み Gateway status/health snapshot、および存在する場合は最新の stability bundle が含まれます。

これは共有されることを想定しています。安全な OpenClaw ログフィールド、subsystem 名、status code、duration、設定済みモード、port、plugin id、provider id、secret ではない feature 設定、サニタイズされた運用ログメッセージなど、デバッグに役立つ運用詳細は保持されます。chat text、webhook body、tool output、credentials、cookie、account/message identifier、prompt/instruction text、hostname、secret 値は省略またはサニタイズされます。LogTape 形式のメッセージが user/chat/tool payload text に見える場合、この export には、そのメッセージが省略されたこととその byte 数だけが保持されます。

### `gateway status`

`gateway status` は Gateway service（launchd/systemd/schtasks）に加え、接続性/auth capability の任意 probe を表示します。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

オプション:

- `--url <url>`: 明示的な probe target を追加します。設定済み remote + localhost も引き続き probe されます。
- `--token <token>`: probe 用の token auth。
- `--password <password>`: probe 用の password auth。
- `--timeout <ms>`: probe timeout（デフォルト `10000`）。
- `--no-probe`: 接続性 probe をスキップします（service-only 表示）。
- `--deep`: system レベル service もスキャンします。
- `--require-rpc`: デフォルトの接続性 probe を read probe に引き上げ、その read probe が失敗した場合は非ゼロで終了します。`--no-probe` とは併用できません。

注記:

- `gateway status` は、ローカル CLI config が欠けているか無効な場合でも診断用に利用できます。
- デフォルトの `gateway status` は、service 状態、WebSocket connect、および handshake 時に見える auth capability を証明します。read/write/admin 操作までは証明しません。
- `gateway status` は、可能であれば probe auth 用に設定済み auth SecretRef を解決します。
- このコマンド経路で必要な auth SecretRef が未解決の場合、`gateway status --json` は probe の接続性/auth が失敗したときに `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先に secret source を解決してください。
- probe が成功した場合、誤検知を避けるため未解決 auth-ref 警告は抑制されます。
- 待ち受け service だけでは不十分で、read-scope RPC call も健全である必要がある script や automation では `--require-rpc` を使用してください。
- `--deep` は、追加の launchd/systemd/schtasks install をベストエフォートでスキャンします。複数の gateway 風 service が検出された場合、人向け出力では cleanup のヒントを表示し、多くのセットアップでは 1 台のマシンにつき 1 つの gateway を実行するのが普通であると警告します。
- 人向け出力には、profile または state-dir のずれを診断しやすいよう、解決済みファイルログ path と CLI 対 service の config path/妥当性 snapshot が含まれます。
- Linux systemd install では、service auth drift チェックは unit の `Environment=` と `EnvironmentFile=` の両方から値を読み取ります（`%h`、引用付き path、複数ファイル、任意の `-` ファイルを含む）。
- drift チェックは、マージ済み runtime env（service command env を優先し、その後 process env にフォールバック）を使って `gateway.auth.token` SecretRef を解決します。
- token auth が実効的に有効でない場合（明示的な `gateway.auth.mode` が `password`/`none`/`trusted-proxy`、または mode 未設定で password が優先されうる一方で token 候補が勝てない場合）、token-drift チェックは config token 解決をスキップします。

### `gateway probe`

`gateway probe` は「すべてをデバッグする」コマンドです。常に以下を probe します:

- 設定済みの remote gateway（設定されている場合）
- remote が設定されていても **localhost（loopback）**

`--url` を渡すと、その明示 target が両方の先頭に追加されます。人向け出力では
targets は次のようにラベル付けされます:

- `URL (explicit)`
- `Remote (configured)` または `Remote (configured, inactive)`
- `Local loopback`

複数の gateway に到達可能な場合は、そのすべてを表示します。isolated profile/port（たとえば rescue bot）を使う場合には複数 gateway がサポートされますが、ほとんどの install では依然として単一 gateway を実行します。

```bash
openclaw gateway probe
openclaw gateway probe --json
```

解釈:

- `Reachable: yes` は、少なくとも 1 つの target が WebSocket connect を受け入れたことを意味します。
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` は、probe が auth について何を証明できたかを示します。これは reachability とは別です。
- `Read probe: ok` は、read-scope の詳細 RPC calls（`health`/`status`/`system-presence`/`config.get`）も成功したことを意味します。
- `Read probe: limited - missing scope: operator.read` は、connect は成功したが read-scope RPC が制限されていることを意味します。これは完全な失敗ではなく、**degraded** reachability として報告されます。
- 終了コードが非ゼロになるのは、probe した target のいずれにも到達できない場合だけです。

JSON に関する注記（`--json`）:

- トップレベル:
  - `ok`: 少なくとも 1 つの target に到達可能です。
  - `degraded`: 少なくとも 1 つの target で scope 制限付きの詳細 RPC がありました。
  - `capability`: 到達可能な targets 全体で確認された最高 capability（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope`、または `unknown`）。
  - `primaryTargetId`: 次の順序でアクティブな勝者として扱うべき最良 target: 明示 URL、SSH tunnel、設定済み remote、その後 local loopback。
  - `warnings[]`: `code`、`message`、および任意の `targetIds` を持つベストエフォートの警告レコード。
  - `network`: 現在の config とホストネットワークから導出される local loopback/tailnet URL のヒント。
  - `discovery.timeoutMs` と `discovery.count`: この probe パスで実際に使用された discovery budget/result 件数。
- target ごと（`targets[].connect`）:
  - `ok`: connect 後の到達可能性と degraded 分類。
  - `rpcOk`: 完全な詳細 RPC 成功。
  - `scopeLimited`: `operator.read` scope 不足のため詳細 RPC が失敗。
- target ごと（`targets[].auth`）:
  - `role`: 利用可能な場合、`hello-ok` で報告された auth role。
  - `scopes`: 利用可能な場合、`hello-ok` で報告された付与済み scopes。
  - `capability`: その target に対して表面化した auth capability 分類。

一般的な warning code:

- `ssh_tunnel_failed`: SSH tunnel のセットアップに失敗したため、コマンドは直接 probe にフォールバックしました。
- `multiple_gateways`: 2 つ以上の target に到達可能でした。rescue bot のような isolated profile を意図的に実行している場合を除き、これは通常ではありません。
- `auth_secretref_unresolved`: 設定済み auth SecretRef を、失敗した target に対して解決できませんでした。
- `probe_scope_limited`: WebSocket connect は成功しましたが、read probe は `operator.read` 不足により制限されました。

#### SSH 経由の remote（Mac app parity）

macOS app の「Remote over SSH」モードでは、リモート Gateway（loopback のみに bind されている場合があります）に `ws://127.0.0.1:<port>` で到達できるよう、ローカルの port-forward を使用します。

CLI 相当:

```bash
openclaw gateway probe --ssh user@gateway-host
```

オプション:

- `--ssh <target>`: `user@host` または `user@host:port`（port のデフォルトは `22`）。
- `--ssh-identity <path>`: identity ファイル。
- `--ssh-auto`: 解決済みの discovery endpoint（`local.` と、設定されていれば wide-area domain）から、最初に発見された gateway host を SSH target として選択します。TXT のみのヒントは無視されます。

config（任意、デフォルトとして使用）:

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低レベルの RPC ヘルパーです。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

オプション:

- `--params <json>`: params 用 JSON オブジェクト文字列（デフォルト `{}`）
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

注記:

- `--params` は有効な JSON である必要があります。
- `--expect-final` は、最終 payload の前に中間 event を stream する agent スタイル RPC で主に使われます。

## Gateway service を管理する

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

コマンドオプション:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

注記:

- `gateway install` は `--port`、`--runtime`、`--token`、`--force`、`--json` をサポートします。
- token auth に token が必要で、`gateway.auth.token` が SecretRef 管理の場合、`gateway install` はその SecretRef が解決可能かを検証しますが、解決済み token を service environment metadata に永続化しません。
- token auth に token が必要で、設定済み token SecretRef が未解決の場合、install はフォールバックの平文を永続化せず fail closed します。
- `gateway run` で password auth を使う場合は、インラインの `--password` より `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef バックの `gateway.auth.password` を推奨します。
- 推論 auth モードでは、shell のみの `OPENCLAW_GATEWAY_PASSWORD` は install 時の token 要件を緩和しません。管理 service をインストールする場合は、永続 config（`gateway.auth.password` または config `env`）を使用してください。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されており、`gateway.auth.mode` が未設定の場合、mode が明示的に設定されるまで install はブロックされます。
- ライフサイクルコマンドは scripting 用に `--json` を受け付けます。

## Gateway を検出する（Bonjour）

`gateway discover` は Gateway beacon（`_openclaw-gw._tcp`）をスキャンします。

- マルチキャスト DNS-SD: `local.`
- ユニキャスト DNS-SD（Wide-Area Bonjour）: domain（例: `openclaw.internal.`）を選び、split DNS + DNS サーバーを設定します。[/gateway/bonjour](/ja-JP/gateway/bonjour) を参照してください

Bonjour discovery が有効な Gateway のみ（デフォルトで有効）が beacon を広告します。

Wide-Area discovery record には次が含まれます（TXT）:

- `role`（gateway role のヒント）
- `transport`（`gateway` などの transport ヒント）
- `gatewayPort`（WebSocket port。通常は `18789`）
- `sshPort`（任意。ない場合、client のデフォルト SSH target は `22`）
- `tailnetDns`（利用可能な場合の MagicDNS hostname）
- `gatewayTls` / `gatewayTlsSha256`（TLS 有効化 + cert fingerprint）
- `cliPath`（wide-area zone に書き込まれる remote-install のヒント）

### `gateway discover`

```bash
openclaw gateway discover
```

オプション:

- `--timeout <ms>`: コマンドごとの timeout（browse/resolve）。デフォルト `2000`。
- `--json`: 機械可読な出力（スタイル/spinner も無効化）。

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

注記:

- CLI は `local.` と、設定されていれば wide-area domain の両方をスキャンします。
- JSON 出力の `wsUrl` は、`lanHost` や `tailnetDns` のような TXT のみのヒントではなく、解決済み service endpoint から導出されます。
- `local.` mDNS では、`sshPort` と `cliPath` がブロードキャストされるのは `discovery.mdns.mode` が `full` の場合のみです。Wide-area DNS-SD では引き続き `cliPath` が書き込まれ、`sshPort` も引き続き任意です。
