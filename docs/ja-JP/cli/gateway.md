---
read_when:
    - CLI から Gateway を実行する（開発環境またはサーバー）
    - Gateway の認証、バインドモード、接続性のデバッグ
    - Bonjour による Gateway の検出 (ローカル + 広域 DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gatewayを実行、照会、検出する
title: Gateway
x-i18n:
    generated_at: "2026-05-02T22:17:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7f948a8f0ee6e065afa02f354e690ad5cc4f71bdb8b8674f1b0396c439ab242
    source_path: cli/gateway.md
    workflow: 16
---

Gateway は OpenClaw の WebSocket サーバー（チャンネル、ノード、セッション、フック）です。このページのサブコマンドは `openclaw gateway …` の下にあります。

<CardGroup cols={3}>
  <Card title="Bonjour 検出" href="/ja-JP/gateway/bonjour">
    ローカル mDNS + 広域 DNS-SD のセットアップ。
  </Card>
  <Card title="検出の概要" href="/ja-JP/gateway/discovery">
    OpenClaw が Gateway を広告し、見つける仕組み。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration">
    トップレベルの gateway 設定キー。
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
    - デフォルトでは、Gateway は `~/.openclaw/openclaw.json` で `gateway.mode=local` が設定されていない限り起動を拒否します。アドホック/開発用の実行には `--allow-unconfigured` を使用してください。
    - `openclaw onboard --mode local` と `openclaw setup` は `gateway.mode=local` を書き込む想定です。ファイルは存在するが `gateway.mode` がない場合は、ローカルモードを暗黙に仮定するのではなく、壊れた、または上書きされた設定として扱い、修復してください。
    - ファイルが存在し、`gateway.mode` がない場合、Gateway はそれを疑わしい設定破損として扱い、代わりに「local と推測」することを拒否します。
    - 認証なしで loopback を超えてバインドすることはブロックされます（安全ガードレール）。
    - `SIGUSR1` は、許可されている場合にプロセス内再起動をトリガーします（`commands.restart` はデフォルトで有効です。手動再起動をブロックするには `commands.restart: false` を設定しますが、gateway tool/config apply/update は引き続き許可されます）。
    - `SIGINT`/`SIGTERM` ハンドラーは gateway プロセスを停止しますが、カスタムのターミナル状態は復元しません。CLI を TUI や raw-mode 入力でラップしている場合は、終了前にターミナルを復元してください。

  </Accordion>
</AccordionGroup>

### オプション

<ParamField path="--port <port>" type="number">
  WebSocket ポート（デフォルトは config/env から取得されます。通常は `18789`）。
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
  gateway パスワードをファイルから読み取ります。
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Tailscale 経由で Gateway を公開します。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  シャットダウン時に Tailscale serve/funnel 設定をリセットします。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  config に `gateway.mode=local` がなくても gateway の起動を許可します。アドホック/開発用ブートストラップに限り起動ガードをバイパスします。設定ファイルの書き込みや修復は行いません。
</ParamField>
<ParamField path="--dev" type="boolean">
  見つからない場合に開発用 config + ワークスペースを作成します（BOOTSTRAP.md をスキップ）。
</ParamField>
<ParamField path="--reset" type="boolean">
  開発用 config + 認証情報 + セッション + ワークスペースをリセットします（`--dev` が必要）。
</ParamField>
<ParamField path="--force" type="boolean">
  起動前に、選択したポート上の既存リスナーをすべて終了します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  詳細ログ。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  コンソールには CLI バックエンドログのみを表示します（stdout/stderr も有効化）。
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  WebSocket ログスタイル。
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
インラインの `--password` はローカルのプロセス一覧で露出する可能性があります。`--password-file`、env、または SecretRef に基づく `gateway.auth.password` を推奨します。
</Warning>

### 起動プロファイリング

- Gateway 起動中のフェーズタイミングをログ出力するには `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を設定します。これには、フェーズごとの `eventLoopMax` 遅延と、installed-index、manifest registry、起動計画、owner-map 作業の Plugin ルックアップテーブルタイミングが含まれます。
- 外部 QA ハーネス向けにベストエフォートの JSONL 起動診断タイムラインを書き込むには、`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` とともに `OPENCLAW_DIAGNOSTICS=timeline` を設定します。config 内の `diagnostics.flags: ["timeline"]` でもフラグを有効化できます。パスは引き続き env で指定します。イベントループサンプルを含めるには `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` を追加します。
- Gateway 起動をベンチマークするには `pnpm test:startup:gateway -- --runs 5 --warmup 1` を実行します。このベンチマークは、最初のプロセス出力、`/healthz`、`/readyz`、起動トレースタイミング、イベントループ遅延、Plugin ルックアップテーブルのタイミング詳細を記録します。

## 実行中の Gateway を照会する

すべての照会コマンドは WebSocket RPC を使用します。

<Tabs>
  <Tab title="出力モード">
    - デフォルト: 人間が読める形式（TTY では色付き）。
    - `--json`: 機械可読 JSON（スタイル/スピナーなし）。
    - `--no-color`（または `NO_COLOR=1`）: 人間向けレイアウトを維持したまま ANSI を無効化します。

  </Tab>
  <Tab title="共通オプション">
    - `--url <url>`: Gateway WebSocket URL。
    - `--token <token>`: Gateway トークン。
    - `--password <password>`: Gateway パスワード。
    - `--timeout <ms>`: タイムアウト/予算（コマンドにより異なります）。
    - `--expect-final`: 「final」レスポンスを待ちます（エージェント呼び出し）。

  </Tab>
</Tabs>

<Note>
`--url` を設定すると、CLI は config や環境の認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` エンドポイントは liveness probe です。サーバーが HTTP に応答できるようになると返ります。HTTP `/readyz` エンドポイントはより厳密で、起動時の Plugin サイドカー、チャンネル、または設定済みフックがまだ安定していない間は赤のままです。ローカルまたは認証済みの詳細な readiness レスポンスには、イベントループ遅延、イベントループ使用率、CPU コア比率、`degraded` フラグを含む `eventLoop` 診断ブロックが含まれます。

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

実行中の Gateway から最近の診断安定性レコーダーを取得します。

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
  実行中の Gateway を呼び出す代わりに、永続化された安定性バンドルを読み取ります。状態ディレクトリ配下の最新バンドルには `--bundle latest`（または単に `--bundle`）を使用するか、バンドル JSON パスを直接渡します。
</ParamField>
<ParamField path="--export" type="boolean">
  安定性の詳細を出力する代わりに、共有可能なサポート診断 zip を書き込みます。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` の出力パス。
</ParamField>

<AccordionGroup>
  <Accordion title="プライバシーとバンドルの動作">
    - レコードは運用メタデータを保持します。イベント名、回数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャンネル/Plugin 名、秘匿化されたセッションサマリーです。チャットテキスト、Webhook 本文、ツール出力、生のリクエスト/レスポンス本文、トークン、Cookie、シークレット値、ホスト名、生のセッション ID は保持しません。レコーダー全体を無効にするには `diagnostics.enabled: false` を設定します。
    - 致命的な Gateway 終了、シャットダウンタイムアウト、再起動時の起動失敗が発生した場合、レコーダーにイベントがあれば、OpenClaw は同じ診断スナップショットを `~/.openclaw/logs/stability/openclaw-stability-*.json` に書き込みます。最新バンドルを調べるには `openclaw gateway stability --bundle latest` を使用します。`--limit`、`--type`、`--since-seq` もバンドル出力に適用されます。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

バグレポートに添付することを想定したローカル診断 zip を書き込みます。プライバシーモデルとバンドル内容については、[診断エクスポート](/ja-JP/gateway/diagnostics) を参照してください。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  出力 zip パス。デフォルトでは状態ディレクトリ配下のサポートエクスポートになります。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  含めるサニタイズ済みログ行の最大数。
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  調査するログバイト数の最大値。
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
  status/health スナップショットのタイムアウト。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  永続化された安定性バンドルの検索をスキップします。
</ParamField>
<ParamField path="--json" type="boolean">
  書き込まれたパス、サイズ、manifest を JSON として出力します。
</ParamField>

エクスポートには、manifest、Markdown サマリー、config の形状、サニタイズ済み config 詳細、サニタイズ済みログサマリー、サニタイズ済み Gateway status/health スナップショット、存在する場合は最新の安定性バンドルが含まれます。

これは共有されることを想定しています。デバッグに役立つ運用詳細、たとえば安全な OpenClaw ログフィールド、サブシステム名、ステータスコード、所要時間、設定済みモード、ポート、Plugin ID、プロバイダー ID、シークレットではない機能設定、秘匿化された運用ログメッセージを保持します。チャットテキスト、Webhook 本文、ツール出力、認証情報、Cookie、アカウント/メッセージ識別子、プロンプト/指示テキスト、ホスト名、シークレット値は省略または秘匿化します。LogTape 形式のメッセージがユーザー/チャット/ツールのペイロードテキストのように見える場合、エクスポートではメッセージが省略されたこととそのバイト数のみを保持します。

### `gateway status`

`gateway status` は Gateway サービス（launchd/systemd/schtasks）に加えて、接続性/認証機能の任意のプローブを表示します。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  明示的なプローブ対象を追加します。設定済みのリモート + localhost も引き続きプローブされます。
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
  接続性プローブをスキップします（サービスのみのビュー）。
</ParamField>
<ParamField path="--deep" type="boolean">
  システムレベルのサービスもスキャンします。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  デフォルトの接続性プローブを読み取りプローブにアップグレードし、その読み取りプローブが失敗した場合は 0 以外で終了します。`--no-probe` と組み合わせることはできません。
</ParamField>

<AccordionGroup>
  <Accordion title="ステータスの意味">
    - `gateway status` は、ローカル CLI 設定が見つからない、または無効な場合でも診断用に利用できます。
    - 既定の `gateway status` は、サービス状態、WebSocket 接続、ハンドシェイク時に見える認証 capability を証明します。読み取り/書き込み/admin 操作は証明しません。
    - 診断プローブは、初回のデバイス認証に対して非変更です。既存のキャッシュ済みデバイストークンがある場合は再利用しますが、ステータス確認だけのために新しい CLI デバイス identity や読み取り専用のデバイスペアリング記録を作成することはありません。
    - `gateway status` は、可能な場合、プローブ認証用に設定済みの認証 SecretRef を解決します。
    - このコマンドパスで必須の認証 SecretRef が未解決の場合、プローブの接続性/認証が失敗すると `gateway status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
    - プローブが成功した場合、誤検知を避けるため未解決の auth-ref 警告は抑制されます。
    - 待機中のサービスだけでは不十分で、読み取りスコープの RPC 呼び出しも正常である必要があるスクリプトや自動化では、`--require-rpc` を使用してください。
    - `--deep` は、追加の launchd/systemd/schtasks インストールに対するベストエフォートのスキャンを追加します。複数の Gateway のようなサービスが検出された場合、人間向け出力はクリーンアップのヒントを表示し、ほとんどのセットアップでは 1 台のマシンにつき 1 つの Gateway を実行すべきであると警告します。
    - 人間向け出力には、解決済みのファイルログパスに加えて、プロファイルや state-dir のずれを診断しやすくするための CLI 対サービスの設定パス/有効性スナップショットが含まれます。

  </Accordion>
  <Accordion title="Linux systemd の認証ドリフトチェック">
    - Linux systemd インストールでは、サービス認証ドリフトチェックが unit から `Environment=` と `EnvironmentFile=` の両方の値を読み取ります（`%h`、引用符付きパス、複数ファイル、省略可能な `-` ファイルを含む）。
    - ドリフトチェックは、マージされたランタイム env（最初にサービスコマンド env、次にプロセス env フォールバック）を使用して `gateway.auth.token` SecretRef を解決します。
    - トークン認証が実質的に有効でない場合（明示的な `gateway.auth.mode` が `password`/`none`/`trusted-proxy`、または mode が未設定で password が優先される可能性があり、勝てるトークン候補がない場合）、token-drift チェックは設定トークンの解決をスキップします。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` は「すべてをデバッグする」コマンドです。常に次をプローブします。

- 設定済みのリモート Gateway（設定されている場合）、および
- リモートが設定されている場合でも localhost（loopback）。

`--url` を渡すと、その明示的なターゲットが両方より先に追加されます。人間向け出力では、ターゲットは次のようにラベル付けされます。

- `URL (explicit)`
- `Remote (configured)` または `Remote (configured, inactive)`
- `Local loopback`

<Note>
複数の Gateway に到達可能な場合、それらすべてを表示します。分離されたプロファイル/ポート（例: レスキューボット）を使用する場合、複数の Gateway はサポートされていますが、ほとんどのインストールでは単一の Gateway を実行します。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="解釈">
    - `Reachable: yes` は、少なくとも 1 つのターゲットが WebSocket 接続を受け入れたことを意味します。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` は、プローブが認証について証明できた内容を報告します。これは到達可能性とは別です。
    - `Read probe: ok` は、読み取りスコープの詳細 RPC 呼び出し（`health`/`status`/`system-presence`/`config.get`）も成功したことを意味します。
    - `Read probe: limited - missing scope: operator.read` は、接続は成功したものの、読み取りスコープ RPC が制限されていることを意味します。これは完全な失敗ではなく、**低下した** 到達可能性として報告されます。
    - `Connect: ok` の後の `Read probe: failed` は、Gateway が WebSocket 接続を受け入れたものの、後続の読み取り診断がタイムアウトまたは失敗したことを意味します。これも到達不能な Gateway ではなく、**低下した** 到達可能性です。
    - `gateway status` と同様に、probe は既存のキャッシュ済みデバイス認証を再利用しますが、初回のデバイス identity やペアリング状態は作成しません。
    - 終了コードが非ゼロになるのは、プローブされたターゲットが 1 つも到達可能でない場合のみです。

  </Accordion>
  <Accordion title="JSON 出力">
    トップレベル:

    - `ok`: 少なくとも 1 つのターゲットに到達可能です。
    - `degraded`: 少なくとも 1 つのターゲットが接続を受け入れたものの、完全な詳細 RPC 診断を完了しませんでした。
    - `capability`: 到達可能なターゲット全体で見られた最良の capability（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope`、または `unknown`）。
    - `primaryTargetId`: 次の順序でアクティブな勝者として扱う最良のターゲット: 明示的な URL、SSH トンネル、設定済みリモート、local loopback。
    - `warnings[]`: `code`、`message`、および省略可能な `targetIds` を含むベストエフォートの警告レコード。
    - `network`: 現在の設定とホストネットワークから派生した local loopback/tailnet URL のヒント。
    - `discovery.timeoutMs` と `discovery.count`: このプローブ実行で使用された実際の discovery 予算/結果数。

    ターゲットごと（`targets[].connect`）:

    - `ok`: 接続後の到達可能性 + degraded 分類。
    - `rpcOk`: 完全な詳細 RPC の成功。
    - `scopeLimited`: operator scope がないため詳細 RPC が失敗しました。

    ターゲットごと（`targets[].auth`）:

    - `role`: 利用可能な場合、`hello-ok` で報告された認証ロール。
    - `scopes`: 利用可能な場合、`hello-ok` で報告された付与済み scopes。
    - `capability`: そのターゲットに表示される認証 capability 分類。

  </Accordion>
  <Accordion title="一般的な警告コード">
    - `ssh_tunnel_failed`: SSH トンネルのセットアップに失敗しました。コマンドは直接プローブにフォールバックしました。
    - `multiple_gateways`: 複数のターゲットに到達可能でした。レスキューボットのように分離されたプロファイルを意図的に実行している場合を除き、これは通常ではありません。
    - `auth_secretref_unresolved`: 設定済みの認証 SecretRef を失敗したターゲット用に解決できませんでした。
    - `probe_scope_limited`: WebSocket 接続は成功しましたが、読み取りプローブが `operator.read` の欠落によって制限されました。

  </Accordion>
</AccordionGroup>

#### SSH 経由のリモート（Mac アプリとの同等性）

macOS アプリの「SSH 経由のリモート」モードは、ローカルポート転送を使用するため、（loopback のみにバインドされている可能性がある）リモート Gateway が `ws://127.0.0.1:<port>` で到達可能になります。

CLI での同等機能:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` または `user@host:port`（port の既定値は `22`）。
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Identity ファイル。
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  解決済みの discovery endpoint（`local.` に設定済みの広域ドメインがあればそれを加えたもの）から、最初に検出された Gateway ホストを SSH ターゲットとして選択します。TXT のみのヒントは無視されます。
</ParamField>

設定（省略可能、既定値として使用）:

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低レベル RPC ヘルパー。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  params 用の JSON object 文字列。
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
  主に、最終 payload の前に中間イベントをストリームする agent-style RPC 用です。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読 JSON 出力。
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

### ラッパー付きでインストールする

管理対象サービスを別の実行可能ファイル経由で起動する必要がある場合は、`--wrapper` を使用します。たとえば、
シークレットマネージャーの shim や run-as ヘルパーです。ラッパーは通常の Gateway args を受け取り、
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

環境経由でラッパーを設定することもできます。`gateway install` は、そのパスが
実行可能ファイルであることを検証し、ラッパーをサービスの `ProgramArguments` に書き込み、後続の強制再インストール、更新、doctor
修復のために `OPENCLAW_WRAPPER` をサービス環境に永続化します。

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

永続化されたラッパーを削除するには、再インストール時に `OPENCLAW_WRAPPER` をクリアします。

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="コマンドオプション">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="ライフサイクル動作">
    - 管理対象サービスを再起動するには `gateway restart` を使用します。再起動の代用として `gateway stop` と `gateway start` を連結しないでください。macOS では、`gateway stop` は停止前に LaunchAgent を意図的に無効化します。
    - `gateway restart --wait 30s` は、その再起動について設定済みの restart drain 予算を上書きします。単位のない数値はミリ秒です。`s`、`m`、`h` などの単位を使用できます。`--wait 0` は無期限に待機します。
    - `gateway restart --force` は active-work drain をスキップして即座に再起動します。オペレーターが表示されたタスク blocker をすでに確認しており、今すぐ Gateway を戻したい場合に使用してください。
    - ライフサイクルコマンドは、スクリプト用に `--json` を受け付けます。

  </Accordion>
  <Accordion title="インストール時の認証と SecretRefs">
    - トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、`gateway install` は SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータへ永続化しません。
    - トークン認証にトークンが必要で、設定済みトークン SecretRef が未解決の場合、インストールはフォールバックの平文を永続化する代わりに fail closed します。
    - `gateway run` の password 認証では、インライン `--password` よりも `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef-backed の `gateway.auth.password` を優先してください。
    - 推論された auth mode では、shell のみの `OPENCLAW_GATEWAY_PASSWORD` はインストール時のトークン要件を緩和しません。管理対象サービスをインストールするときは、永続的な設定（`gateway.auth.password` または config `env`）を使用してください。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、mode が明示的に設定されるまでインストールはブロックされます。

  </Accordion>
</AccordionGroup>

## Gateway を検出する（Bonjour）

`gateway discover` は Gateway beacon（`_openclaw-gw._tcp`）をスキャンします。

- Multicast DNS-SD: `local.`
- Unicast DNS-SD（Wide-Area Bonjour）: ドメイン（例: `openclaw.internal.`）を選び、split DNS + DNS サーバーを設定します。[Bonjour](/ja-JP/gateway/bonjour) を参照してください。

Bonjour discovery が有効な Gateway（既定）のみが beacon をアドバタイズします。

広域 discovery レコードには次が含まれます（TXT）:

- `role`（Gateway role ヒント）
- `transport`（transport ヒント、例: `gateway`）
- `gatewayPort`（WebSocket port、通常 `18789`）
- `sshPort`（省略可能。存在しない場合、clients は SSH targets の既定値を `22` にします）
- `tailnetDns`（利用可能な場合、MagicDNS hostname）
- `gatewayTls` / `gatewayTlsSha256`（TLS 有効 + cert fingerprint）
- `cliPath`（広域 zone に書き込まれる remote-install ヒント）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  コマンドごとのタイムアウト（browse/resolve）。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読の出力（スタイル設定とスピナーも無効化）。
</ParamField>

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI は、有効化されている場合、`local.` に加えて設定済みの広域ドメインをスキャンします。
- JSON 出力の `wsUrl` は、`lanHost` や `tailnetDns` などの TXT のみのヒントではなく、解決されたサービスエンドポイントから派生します。
- `local.` mDNS では、`sshPort` と `cliPath` は `discovery.mdns.mode` が `full` の場合にのみブロードキャストされます。ワイドエリア DNS-SD でも `cliPath` は引き続き書き込まれます。`sshPort` はそこでも省略可能なままです。

</Note>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
