---
read_when:
    - CLI から Gateway を実行する場合（開発またはサーバー）
    - Gateway 認証、バインドモード、接続性をデバッグする場合
    - Bonjour（ローカル + 広域 DNS-SD）で Gateway をディスカバーする場合
summary: OpenClaw Gateway CLI（`openclaw gateway`）— Gateway の実行、照会、ディスカバリー
title: Gateway
x-i18n:
    generated_at: "2026-04-24T04:50:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 011b8c8f86de6ecafbf17357a458956357ebe8285fe86e2bf875a4e2d87b5126
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway CLI

Gateway は OpenClaw の WebSocket サーバーです（channels、nodes、sessions、hooks）。

このページのサブコマンドは `openclaw gateway …` 配下にあります。

関連ドキュメント:

- [/gateway/bonjour](/ja-JP/gateway/bonjour)
- [/gateway/discovery](/ja-JP/gateway/discovery)
- [/gateway/configuration](/ja-JP/gateway/configuration)

## Gateway を実行する

ローカルの Gateway プロセスを実行します。

```bash
openclaw gateway
```

フォアグラウンドのエイリアス:

```bash
openclaw gateway run
```

注:

- デフォルトでは、`~/.openclaw/openclaw.json` に `gateway.mode=local` が設定されていない限り、Gateway は起動を拒否します。アドホック/開発実行には `--allow-unconfigured` を使用してください。
- `openclaw onboard --mode local` と `openclaw setup` は `gateway.mode=local` を書き込む想定です。ファイルが存在するのに `gateway.mode` がない場合、それは壊れた設定または上書きされた設定として扱い、ローカルモードを暗黙に仮定するのではなく修復してください。
- ファイルが存在し、`gateway.mode` がない場合、Gateway はそれを疑わしい設定破損として扱い、ユーザーのために「local を推測」することはしません。
- 認証なしで loopback を超えてバインドすることはブロックされます（安全ガードレール）。
- `SIGUSR1` は、認可されている場合にプロセス内再起動をトリガーします（`commands.restart` はデフォルトで有効。手動再起動をブロックするには `commands.restart: false` を設定してください。gateway の tool/config apply/update は引き続き許可されます）。
- `SIGINT`/`SIGTERM` ハンドラーは gateway プロセスを停止しますが、カスタム端末状態は復元しません。CLI を TUI や raw-mode 入力でラップしている場合は、終了前に端末を復元してください。

### オプション

- `--port <port>`: WebSocket ポート（デフォルトは config/env 由来。通常は `18789`）
- `--bind <loopback|lan|tailnet|auto|custom>`: リスナーバインドモード
- `--auth <token|password>`: 認証モードの上書き
- `--token <token>`: トークンの上書き（プロセスに `OPENCLAW_GATEWAY_TOKEN` も設定）
- `--password <password>`: パスワードの上書き。警告: インラインパスワードはローカルのプロセス一覧に露出する可能性があります。
- `--password-file <path>`: ファイルから gateway パスワードを読み取ります
- `--tailscale <off|serve|funnel>`: Tailscale 経由で Gateway を公開します
- `--tailscale-reset-on-exit`: 終了時に Tailscale serve/funnel 設定をリセットします
- `--allow-unconfigured`: config に `gateway.mode=local` がなくても gateway の起動を許可します。これはアドホック/開発ブートストラップ向けに起動ガードをバイパスするだけで、設定ファイルの書き込みや修復は行いません。
- `--dev`: dev 用の config + workspace がなければ作成します（`BOOTSTRAP.md` はスキップ）
- `--reset`: dev 用の config + credentials + sessions + workspace をリセットします（`--dev` が必要）
- `--force`: 起動前に選択ポート上の既存リスナーを強制終了します
- `--verbose`: 詳細ログ
- `--cli-backend-logs`: CLI バックエンドログのみをコンソールに表示します（stdout/stderr も有効化）
- `--ws-log <auto|full|compact>`: websocket ログスタイル（デフォルト `auto`）
- `--compact`: `--ws-log compact` のエイリアス
- `--raw-stream`: 生のモデルストリームイベントを jsonl に記録します
- `--raw-stream-path <path>`: 生ストリーム jsonl のパス

起動プロファイリング:

- Gateway 起動中のフェーズ時間を記録するには `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を設定します。
- Gateway 起動をベンチマークするには `pnpm test:startup:gateway -- --runs 5 --warmup 1` を実行します。このベンチマークは、最初のプロセス出力、`/healthz`、`/readyz`、および起動トレース時間を記録します。

## 実行中の Gateway を照会する

すべての照会コマンドは WebSocket RPC を使用します。

出力モード:

- デフォルト: 人間向け可読形式（TTY では色付き）
- `--json`: 機械可読 JSON（スタイル/スピナーなし）
- `--no-color`（または `NO_COLOR=1`）: 人間向けレイアウトを維持したまま ANSI を無効化

共通オプション（対応コマンドのみ）:

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway トークン
- `--password <password>`: Gateway パスワード
- `--timeout <ms>`: タイムアウト/予算（コマンドごとに異なります）
- `--expect-final`: 「final」レスポンスを待機します（agent 呼び出し）

注: `--url` を設定すると、CLI は config や環境の認証情報にフォールバックしません。
`--token` または `--password` を明示的に渡してください。明示的な認証情報がないのはエラーです。

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP の `/healthz` エンドポイントは liveness probe です。サーバーが HTTP に応答できるようになると返ります。HTTP の `/readyz` エンドポイントはより厳格で、起動サイドカー、channels、または設定済み hooks がまだ安定していない間は red のままです。

### `gateway usage-cost`

セッションログから usage-cost サマリーを取得します。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

オプション:

- `--days <days>`: 含める日数（デフォルト `30`）

### `gateway stability`

実行中の Gateway から最近の診断 stability recorder を取得します。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

オプション:

- `--limit <limit>`: 含める最近のイベントの最大数（デフォルト `25`、最大 `1000`）
- `--type <type>`: `payload.large` や `diagnostic.memory.pressure` などの診断イベントタイプでフィルタリングします
- `--since-seq <seq>`: 指定した診断シーケンス番号以降のイベントのみを含めます
- `--bundle [path]`: 実行中の Gateway を呼び出す代わりに、永続化された stability bundle を読み取ります。state ディレクトリ配下の最新 bundle には `--bundle latest`（または単に `--bundle`）を使用するか、bundle JSON パスを直接渡してください。
- `--export`: stability の詳細を表示する代わりに、共有可能なサポート診断 zip を書き出します
- `--output <path>`: `--export` の出力パス

注:

- 記録には運用メタデータが保持されます: イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、channel/plugin 名、伏せ字化されたセッションサマリー。チャットテキスト、webhook body、tool 出力、生の request/response body、トークン、cookie、シークレット値、ホスト名、生のセッション ID は保持されません。レコーダー全体を無効にするには `diagnostics.enabled: false` を設定してください。
- Gateway の致命的終了、シャットダウンタイムアウト、再起動時の起動失敗では、レコーダーにイベントがある場合、OpenClaw は同じ診断スナップショットを `~/.openclaw/logs/stability/openclaw-stability-*.json` に書き込みます。最新 bundle を確認するには `openclaw gateway stability --bundle latest` を使用してください。`--limit`、`--type`、`--since-seq` も bundle 出力に適用されます。

### `gateway diagnostics export`

バグ報告への添付を想定したローカル診断 zip を書き出します。
プライバシーモデルと bundle 内容については [Diagnostics Export](/ja-JP/gateway/diagnostics) を参照してください。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

オプション:

- `--output <path>`: 出力 zip パス。デフォルトは state ディレクトリ配下のサポートエクスポートです。
- `--log-lines <count>`: 含めるサニタイズ済みログ行数の最大値（デフォルト `5000`）
- `--log-bytes <bytes>`: 検査するログバイト数の最大値（デフォルト `1000000`）
- `--url <url>`: health スナップショット用の Gateway WebSocket URL
- `--token <token>`: health スナップショット用の Gateway トークン
- `--password <password>`: health スナップショット用の Gateway パスワード
- `--timeout <ms>`: status/health スナップショットのタイムアウト（デフォルト `3000`）
- `--no-stability-bundle`: 永続化された stability bundle の検索をスキップします
- `--json`: 書き込まれたパス、サイズ、manifest を JSON で出力します

このエクスポートには、manifest、Markdown サマリー、config shape、サニタイズ済み config 詳細、サニタイズ済みログサマリー、サニタイズ済み Gateway status/health スナップショット、および存在する場合は最新の stability bundle が含まれます。

これは共有されることを想定しています。安全な OpenClaw ログフィールド、サブシステム名、ステータスコード、所要時間、設定済みモード、ポート、plugin ID、provider ID、非シークレット機能設定、伏せ字化された運用ログメッセージなど、デバッグに役立つ運用詳細は保持されます。チャットテキスト、webhook body、tool 出力、認証情報、cookie、アカウント/メッセージ識別子、prompt/instruction テキスト、ホスト名、シークレット値は省略または伏せ字化されます。LogTape 形式のメッセージがユーザー/チャット/tool ペイロードテキストに見える場合、エクスポートにはメッセージが省略されたこととそのバイト数のみが保持されます。

### `gateway status`

`gateway status` は Gateway サービス（launchd/systemd/schtasks）に加え、接続性/認証機能の任意 probe を表示します。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

オプション:

- `--url <url>`: 明示的な probe ターゲットを追加します。設定済み remote + localhost も引き続き probe されます。
- `--token <token>`: probe 用トークン認証
- `--password <password>`: probe 用パスワード認証
- `--timeout <ms>`: probe タイムアウト（デフォルト `10000`）
- `--no-probe`: 接続性 probe をスキップします（サービスのみ表示）
- `--deep`: システムレベルサービスもスキャンします
- `--require-rpc`: デフォルトの接続性 probe を read probe に強化し、その read probe が失敗した場合は非ゼロで終了します。`--no-probe` とは併用できません。

注:

- `gateway status` は、ローカル CLI config が存在しない場合や無効な場合でも、診断用として利用可能です。
- デフォルトの `gateway status` は、サービス状態、WebSocket 接続、およびハンドシェイク時に見える認証機能を証明します。read/write/admin 操作までは証明しません。
- `gateway status` は、可能な場合、probe 認証のために設定済み auth SecretRef を解決します。
- 必須の auth SecretRef がこのコマンド経路で未解決の場合、`gateway status --json` は probe 接続性/認証が失敗したときに `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
- probe が成功した場合、未解決 auth-ref 警告は誤検知を避けるため抑制されます。
- リスニングサービスだけでは不十分で、read-scope RPC 呼び出しも正常である必要があるスクリプトや自動化では `--require-rpc` を使用してください。
- `--deep` は、追加の launchd/systemd/schtasks インストールを best-effort でスキャンします。gateway らしきサービスが複数検出された場合、人間向け出力ではクリーンアップヒントを表示し、ほとんどの構成では 1 マシンにつき 1 gateway を実行すべきだと警告します。
- 人間向け出力には、解決済みファイルログパスと、CLI 対サービスの config パス/有効性スナップショットが含まれ、profile や state-dir のずれの診断に役立ちます。
- Linux systemd インストールでは、サービス認証のドリフトチェックが unit の `Environment=` と `EnvironmentFile=` の両方の値を読み取ります（`%h`、引用付きパス、複数ファイル、任意の `-` ファイルを含む）。
- ドリフトチェックは、マージされたランタイム環境を使って `gateway.auth.token` SecretRef を解決します（まず service command env、次に process env へフォールバック）。
- トークン認証が実効的に有効でない場合（`gateway.auth.mode` が明示的に `password`/`none`/`trusted-proxy`、または mode 未設定で password が優先され得てトークン候補が勝てない場合）、token-drift チェックは config トークン解決をスキップします。

### `gateway probe`

`gateway probe` は「すべてをデバッグする」ためのコマンドです。常に次を probe します。

- 設定済みの remote gateway（設定されている場合）
- remote が設定されていても **localhost（loopback）**

`--url` を渡した場合、その明示的なターゲットが両方より前に追加されます。人間向け出力では
ターゲットは次のようにラベル付けされます。

- `URL (explicit)`
- `Remote (configured)` または `Remote (configured, inactive)`
- `Local loopback`

複数の gateway に到達可能な場合は、それらをすべて表示します。分離された profile/port（たとえば rescue bot）を使う場合は複数 gateway をサポートしますが、ほとんどのインストールでは依然として単一 gateway を実行します。

```bash
openclaw gateway probe
openclaw gateway probe --json
```

解釈:

- `Reachable: yes` は、少なくとも 1 つのターゲットが WebSocket 接続を受け入れたことを意味します。
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` は、probe が認証について何を証明できたかを示します。これは到達可能性とは別です。
- `Read probe: ok` は、read-scope の詳細 RPC 呼び出し（`health`/`status`/`system-presence`/`config.get`）も成功したことを意味します。
- `Read probe: limited - missing scope: operator.read` は、接続は成功したが read-scope RPC が制限されていることを意味します。これは完全な失敗ではなく、**degraded** な到達可能性として報告されます。
- 終了コードが非ゼロになるのは、probe したターゲットのいずれにも到達できなかった場合のみです。

JSON の注記（`--json`）:

- トップレベル:
  - `ok`: 少なくとも 1 つのターゲットに到達可能です。
  - `degraded`: 少なくとも 1 つのターゲットでスコープ制限付きの詳細 RPC が発生しました。
  - `capability`: 到達可能なターゲット全体で確認された最良の機能（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope`、または `unknown`）。
  - `primaryTargetId`: この順序でアクティブな勝者として扱う最良ターゲット: 明示的 URL、SSH トンネル、設定済み remote、その後 local loopback。
  - `warnings[]`: `code`、`message`、および任意の `targetIds` を含む best-effort の警告レコード。
  - `network`: 現在の設定とホストネットワークから導出された local loopback/tailnet URL ヒント。
  - `discovery.timeoutMs` と `discovery.count`: この probe パスで実際に使用されたディスカバリー予算/結果件数。
- ターゲットごと（`targets[].connect`）:
  - `ok`: 接続後および degraded 分類後の到達可能性。
  - `rpcOk`: 詳細 RPC が完全に成功。
  - `scopeLimited`: `operator` スコープ不足のために詳細 RPC が失敗。
- ターゲットごと（`targets[].auth`）:
  - `role`: 利用可能な場合、`hello-ok` で報告される認証ロール。
  - `scopes`: 利用可能な場合、`hello-ok` で報告される付与済みスコープ。
  - `capability`: そのターゲットに対して表面化された認証機能分類。

一般的な警告コード:

- `ssh_tunnel_failed`: SSH トンネルのセットアップに失敗しました。コマンドは direct probe にフォールバックしました。
- `multiple_gateways`: 複数のターゲットに到達可能でした。rescue bot など、意図的に分離された profile を実行している場合を除き、これは通常ではありません。
- `auth_secretref_unresolved`: 設定済み auth SecretRef を、失敗したターゲットに対して解決できませんでした。
- `probe_scope_limited`: WebSocket 接続は成功しましたが、`operator.read` 不足のため read probe が制限されました。

#### SSH 経由の remote（Mac アプリ相当）

macOS アプリの「Remote over SSH」モードでは、ローカルのポートフォワードを使用するため、remote gateway（loopback のみにバインドされている可能性があります）に `ws://127.0.0.1:<port>` で到達可能になります。

CLI 相当:

```bash
openclaw gateway probe --ssh user@gateway-host
```

オプション:

- `--ssh <target>`: `user@host` または `user@host:port`（port のデフォルトは `22`）
- `--ssh-identity <path>`: identity ファイル
- `--ssh-auto`: 解決済み
  ディスカバリーエンドポイント（`local.` と、設定されている場合は構成済み広域ドメイン）から、最初に見つかった gateway ホストを SSH ターゲットとして選びます。TXT のみの
  ヒントは無視されます。

設定（任意。デフォルトとして使用）:

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低レベル RPC ヘルパーです。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

オプション:

- `--params <json>`: params 用の JSON オブジェクト文字列（デフォルト `{}`）
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

注:

- `--params` は有効な JSON である必要があります。
- `--expect-final` は主に、最終ペイロードの前に中間イベントをストリームする agent 形式の RPC 向けです。

## Gateway サービスを管理する

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

注:

- `gateway install` は `--port`、`--runtime`、`--token`、`--force`、`--json` をサポートします。
- トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、`gateway install` は SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータに永続化しません。
- トークン認証でトークンが必要かつ設定済みトークン SecretRef が未解決の場合、インストールはフォールバック平文を永続化する代わりに closed で失敗します。
- `gateway run` のパスワード認証では、インライン `--password` よりも `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef に支えられた `gateway.auth.password` を推奨します。
- 推論された認証モードでは、シェルのみの `OPENCLAW_GATEWAY_PASSWORD` は install 時のトークン要件を緩和しません。管理サービスをインストールする場合は、永続的な設定（`gateway.auth.password` または config `env`）を使用してください。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、mode が明示的に設定されるまで install はブロックされます。
- ライフサイクルコマンドはスクリプト向けに `--json` を受け付けます。

## Gateway をディスカバーする（Bonjour）

`gateway discover` は Gateway ビーコン（`_openclaw-gw._tcp`）をスキャンします。

- マルチキャスト DNS-SD: `local.`
- ユニキャスト DNS-SD（Wide-Area Bonjour）: ドメイン（例: `openclaw.internal.`）を選び、split DNS + DNS サーバーを設定します。[/gateway/bonjour](/ja-JP/gateway/bonjour) を参照してください

Bonjour ディスカバリーが有効な Gateway のみ（デフォルトで有効）がビーコンを広告します。

Wide-Area ディスカバリーレコードには次が含まれます（TXT）:

- `role`（gateway ロールヒント）
- `transport`（トランスポートヒント。例: `gateway`）
- `gatewayPort`（WebSocket ポート。通常 `18789`）
- `sshPort`（任意。存在しない場合、クライアントの SSH ターゲットはデフォルトで `22`）
- `tailnetDns`（利用可能な場合は MagicDNS ホスト名）
- `gatewayTls` / `gatewayTlsSha256`（TLS 有効 + 証明書フィンガープリント）
- `cliPath`（wide-area zone に書き込まれる remote-install ヒント）

### `gateway discover`

```bash
openclaw gateway discover
```

オプション:

- `--timeout <ms>`: コマンドごとのタイムアウト（browse/resolve）。デフォルト `2000`
- `--json`: 機械可読出力（スタイル/スピナーも無効化）

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

注:

- CLI は、wide-area ドメインが有効な場合、`local.` と設定済み広域ドメインをスキャンします。
- JSON 出力の `wsUrl` は、`lanHost` や `tailnetDns` のような TXT のみの
  ヒントからではなく、解決済みサービスエンドポイントから導出されます。
- `local.` の mDNS では、`sshPort` と `cliPath` は
  `discovery.mdns.mode` が `full` の場合にのみブロードキャストされます。wide-area DNS-SD では引き続き `cliPath` が書き込まれます。`sshPort`
  はそこでも引き続き任意です。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway runbook](/ja-JP/gateway)
