---
read_when:
    - CLI から Gateway を実行する (開発またはサーバー)
    - Gateway 認証、バインドモード、接続性のデバッグ
    - Bonjour による Gateway の検出 (ローカル + ワイドエリア DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gatewayを実行、照会、検出する
title: Gateway
x-i18n:
    generated_at: "2026-05-05T01:44:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 521558189b150b2faa22f95ec32419ac9e02c5f47c72b9095f40d1432840c038
    source_path: cli/gateway.md
    workflow: 16
---

Gateway は OpenClaw の WebSocket サーバーです（チャネル、ノード、セッション、フック）。このページのサブコマンドは `openclaw gateway …` 配下にあります。

<CardGroup cols={3}>
  <Card title="Bonjour 検出" href="/ja-JP/gateway/bonjour">
    ローカル mDNS + 広域 DNS-SD の設定。
  </Card>
  <Card title="検出の概要" href="/ja-JP/gateway/discovery">
    OpenClaw が Gateway を告知し、見つける仕組み。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration">
    トップレベルの Gateway 設定キー。
  </Card>
</CardGroup>

## Gateway を実行する

ローカル Gateway プロセスを実行します:

```bash
openclaw gateway
```

フォアグラウンドのエイリアス:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="起動時の動作">
    - デフォルトでは、`~/.openclaw/openclaw.json` で `gateway.mode=local` が設定されていない限り、Gateway は起動を拒否します。アドホック/開発用の実行には `--allow-unconfigured` を使用します。
    - `openclaw onboard --mode local` と `openclaw setup` は `gateway.mode=local` を書き込むことが想定されています。ファイルは存在するが `gateway.mode` がない場合は、ローカルモードを暗黙に仮定するのではなく、壊れた、または上書きされた設定として扱い、修復します。
    - ファイルが存在し、`gateway.mode` がない場合、Gateway はそれを疑わしい設定破損として扱い、ユーザーのために「ローカルだと推測」することを拒否します。
    - 認証なしでループバックを超えてバインドすることはブロックされます（安全ガードレール）。
    - `SIGUSR1` は、許可されている場合にプロセス内再起動をトリガーします（`commands.restart` はデフォルトで有効です。手動再起動をブロックするには `commands.restart: false` を設定します。ただし、Gateway ツール/設定の適用/更新は引き続き許可されます）。
    - `SIGINT`/`SIGTERM` ハンドラーは Gateway プロセスを停止しますが、カスタム端末状態は復元しません。CLI を TUI や raw モード入力でラップしている場合は、終了前に端末を復元してください。

  </Accordion>
</AccordionGroup>

### オプション

<ParamField path="--port <port>" type="number">
  WebSocket ポート（デフォルトは設定/環境変数から取得され、通常は `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  リスナーのバインドモード。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  認証モードの上書き。
</ParamField>
<ParamField path="--token <token>" type="string">
  トークンの上書き（プロセスに `OPENCLAW_GATEWAY_TOKEN` も設定します）。
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
  設定内に `gateway.mode=local` がなくても Gateway の起動を許可します。アドホック/開発用ブートストラップのためだけに起動ガードをバイパスします。設定ファイルの書き込みや修復は行いません。
</ParamField>
<ParamField path="--dev" type="boolean">
  存在しない場合に開発用設定 + ワークスペースを作成します（BOOTSTRAP.md をスキップします）。
</ParamField>
<ParamField path="--reset" type="boolean">
  開発用設定 + 資格情報 + セッション + ワークスペースをリセットします（`--dev` が必要）。
</ParamField>
<ParamField path="--force" type="boolean">
  起動前に、選択されたポート上の既存リスナーをすべて終了します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  詳細ログ。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  コンソールには CLI バックエンドログのみを表示します（stdout/stderr も有効にします）。
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  WebSocket ログの形式。
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

## Gateway を再起動する

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` は、再起動前に実行中の Gateway にアクティブな OpenClaw 作業の事前確認を要求します。キュー済み操作、返信配信、埋め込み実行、またはタスク実行がアクティブな場合、Gateway はブロッカーを報告し、重複する安全な再起動リクエストをまとめ、アクティブな作業がなくなったら再起動します。通常の `restart` は互換性のため、既存のサービスマネージャー動作を維持します。即時上書きパスを明示的に使いたい場合にのみ `--force` を使用してください。

<Warning>
インラインの `--password` は、ローカルプロセス一覧に露出する可能性があります。`--password-file`、環境変数、または SecretRef に基づく `gateway.auth.password` を優先してください。
</Warning>

### 起動プロファイリング

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を設定すると、Gateway 起動中のフェーズ時間がログに記録されます。これには、フェーズごとの `eventLoopMax` 遅延と、インストール済みインデックス、マニフェストレジストリ、起動計画、owner-map 処理に関する Plugin ルックアップテーブルの時間が含まれます。
- `OPENCLAW_DIAGNOSTICS=timeline` と `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` を設定すると、外部 QA ハーネス向けにベストエフォートの JSONL 起動診断タイムラインを書き込みます。設定内の `diagnostics.flags: ["timeline"]` でフラグを有効にすることもできますが、パスは引き続き環境変数から指定します。イベントループサンプルを含めるには `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` を追加します。
- `pnpm test:startup:gateway -- --runs 5 --warmup 1` を実行して Gateway 起動をベンチマークします。ベンチマークは、最初のプロセス出力、`/healthz`、`/readyz`、起動トレースの時間、イベントループ遅延、Plugin ルックアップテーブル時間の詳細を記録します。

## 実行中の Gateway に問い合わせる

すべての問い合わせコマンドは WebSocket RPC を使用します。

<Tabs>
  <Tab title="出力モード">
    - デフォルト: 人間が読みやすい形式（TTY では色付き）。
    - `--json`: 機械可読 JSON（スタイル/スピナーなし）。
    - `--no-color`（または `NO_COLOR=1`）: 人間向けレイアウトを維持しながら ANSI を無効化します。

  </Tab>
  <Tab title="共通オプション">
    - `--url <url>`: Gateway WebSocket URL。
    - `--token <token>`: Gateway トークン。
    - `--password <password>`: Gateway パスワード。
    - `--timeout <ms>`: タイムアウト/予算（コマンドごとに異なります）。
    - `--expect-final`: 「final」レスポンスを待ちます（エージェント呼び出し）。

  </Tab>
</Tabs>

<Note>
`--url` を設定すると、CLI は設定や環境変数の資格情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な資格情報がない場合はエラーです。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` エンドポイントは liveness プローブです。サーバーが HTTP に応答できるようになると返ります。HTTP `/readyz` エンドポイントはより厳密で、起動時の Plugin サイドカー、チャネル、または設定済みフックがまだ安定していない間は赤のままです。ローカルまたは認証済みの詳細 readiness レスポンスには、イベントループ遅延、イベントループ使用率、CPU コア比率、`degraded` フラグを含む `eventLoop` 診断ブロックが含まれます。

### `gateway usage-cost`

セッションログから使用コストの概要を取得します。

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
  `payload.large` や `diagnostic.memory.pressure` など、診断イベントタイプで絞り込みます。
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
    - レコードは運用メタデータを保持します。イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャネル/Plugin 名、編集済みのセッション概要です。チャットテキスト、Webhook 本文、ツール出力、生のリクエスト本文またはレスポンス本文、トークン、Cookie、シークレット値、ホスト名、生のセッション ID は保持しません。レコーダーを完全に無効化するには `diagnostics.enabled: false` を設定します。
    - 致命的な Gateway 終了、シャットダウンタイムアウト、再起動時の起動失敗では、レコーダーにイベントがある場合、OpenClaw は同じ診断スナップショットを `~/.openclaw/logs/stability/openclaw-stability-*.json` に書き込みます。最新バンドルは `openclaw gateway stability --bundle latest` で確認できます。`--limit`、`--type`、`--since-seq` もバンドル出力に適用されます。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

バグレポートに添付するために設計されたローカル診断 zip を書き込みます。プライバシーモデルとバンドル内容については、[診断エクスポート](/ja-JP/gateway/diagnostics) を参照してください。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  出力 zip パス。デフォルトでは、状態ディレクトリ配下のサポートエクスポートです。
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

エクスポートには、マニフェスト、Markdown 概要、設定の形状、サニタイズ済み設定詳細、サニタイズ済みログ概要、サニタイズ済み Gateway ステータス/ヘルススナップショット、存在する場合は最新の安定性バンドルが含まれます。

これは共有を前提としています。安全な OpenClaw ログフィールド、サブシステム名、ステータスコード、期間、設定済みモード、ポート、Plugin ID、プロバイダー ID、非シークレットの機能設定、編集済みの運用ログメッセージなど、デバッグに役立つ運用詳細を保持します。チャットテキスト、Webhook 本文、ツール出力、資格情報、Cookie、アカウント/メッセージ識別子、プロンプト/指示テキスト、ホスト名、シークレット値は省略または編集します。LogTape 形式のメッセージがユーザー/チャット/ツールのペイロードテキストのように見える場合、エクスポートはメッセージが省略されたこととそのバイト数のみを保持します。

### `gateway status`

`gateway status` は Gateway サービス（launchd/systemd/schtasks）に加え、接続性/認証機能の任意のプローブを表示します。

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
  既定の接続性プローブを読み取りプローブに昇格し、その読み取りプローブが失敗した場合はゼロ以外で終了します。`--no-probe` と組み合わせることはできません。
</ParamField>

<AccordionGroup>
  <Accordion title="ステータスの意味">
    - ローカル CLI 設定が存在しない、または無効な場合でも、`gateway status` は診断用に引き続き使用できます。
    - 既定の `gateway status` は、サービス状態、WebSocket 接続、ハンドシェイク時に見える認証機能を証明します。読み取り/書き込み/管理操作は証明しません。
    - 診断プローブは、初回デバイス認証に対して非変更です。既存のキャッシュ済みデバイストークンがある場合はそれを再利用しますが、ステータス確認のためだけに新しい CLI デバイス ID や読み取り専用デバイスペアリングレコードを作成することはありません。
    - `gateway status` は、可能な場合、プローブ認証用に設定済みの認証 SecretRef を解決します。
    - このコマンドパスで必須の認証 SecretRef が未解決の場合、プローブの接続性/認証が失敗すると `gateway status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
    - プローブが成功した場合、誤検知を避けるため未解決の auth-ref 警告は抑制されます。
    - リスニングサービスだけでは不十分で、読み取りスコープの RPC 呼び出しも正常である必要があるスクリプトや自動化では、`--require-rpc` を使用します。
    - `--deep` は、追加の launchd/systemd/schtasks インストールをベストエフォートでスキャンします。複数の Gateway らしきサービスが検出された場合、人間向け出力はクリーンアップのヒントを出力し、ほとんどのセットアップでは 1 台のマシンにつき 1 つの Gateway を実行すべきだと警告します。
    - 人間向け出力には、プロファイルや状態ディレクトリのずれを診断しやすくするため、解決済みのファイルログパスに加えて CLI とサービスの設定パス/有効性のスナップショットが含まれます。

  </Accordion>
  <Accordion title="Linux systemd の認証ずれチェック">
    - Linux systemd インストールでは、サービス認証ずれチェックがユニットから `Environment=` と `EnvironmentFile=` の両方の値を読み取ります（`%h`、引用符付きパス、複数ファイル、省略可能な `-` ファイルを含む）。
    - ずれチェックは、マージされたランタイム環境（先にサービスコマンド環境、次にプロセス環境フォールバック）を使用して `gateway.auth.token` SecretRef を解決します。
    - トークン認証が実質的に有効でない場合（明示的な `gateway.auth.mode` が `password`/`none`/`trusted-proxy`、またはモード未設定でパスワードが優先され、勝てるトークン候補がない場合）、トークンずれチェックは設定トークンの解決をスキップします。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` は「すべてをデバッグする」コマンドです。常に次をプローブします。

- 設定済みのリモート Gateway（設定されている場合）、および
- localhost（ループバック）。**リモートが設定されている場合でも**対象です。

`--url` を渡すと、その明示的な対象が両方より前に追加されます。人間向け出力では対象に次のラベルが付きます。

- `URL (explicit)`
- `Remote (configured)` または `Remote (configured, inactive)`
- `Local loopback`

<Note>
複数の Gateway に到達できる場合は、それらすべてを出力します。分離されたプロファイル/ポート（例: レスキューボット）を使用する場合、複数の Gateway はサポートされますが、ほとんどのインストールでは単一の Gateway を実行します。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="解釈">
    - `Reachable: yes` は、少なくとも 1 つの対象が WebSocket 接続を受け入れたことを意味します。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` は、プローブが認証について証明できた内容を報告します。到達可能性とは別です。
    - `Read probe: ok` は、読み取りスコープの詳細 RPC 呼び出し（`health`/`status`/`system-presence`/`config.get`）も成功したことを意味します。
    - `Read probe: limited - missing scope: operator.read` は、接続は成功したが、読み取りスコープ RPC が制限されていることを意味します。これは完全な失敗ではなく、**劣化した**到達可能性として報告されます。
    - `Connect: ok` の後の `Read probe: failed` は、Gateway が WebSocket 接続を受け入れたものの、後続の読み取り診断がタイムアウトまたは失敗したことを意味します。これも到達不能な Gateway ではなく、**劣化した**到達可能性です。
    - `gateway status` と同様に、プローブは既存のキャッシュ済みデバイス認証を再利用しますが、初回デバイス ID やペアリング状態は作成しません。
    - プローブされた対象に到達可能なものが 1 つもない場合にのみ、終了コードはゼロ以外になります。

  </Accordion>
  <Accordion title="JSON 出力">
    トップレベル:

    - `ok`: 少なくとも 1 つの対象に到達可能です。
    - `degraded`: 少なくとも 1 つの対象が接続を受け入れましたが、完全な詳細 RPC 診断を完了しませんでした。
    - `capability`: 到達可能な対象全体で確認された最良の機能（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope`、または `unknown`）。
    - `primaryTargetId`: アクティブな勝者として扱う最良の対象。優先順は、明示的な URL、SSH トンネル、設定済みリモート、local loopback です。
    - `warnings[]`: `code`、`message`、および省略可能な `targetIds` を含むベストエフォートの警告レコード。
    - `network`: 現在の設定とホストネットワークから派生した local loopback/tailnet URL ヒント。
    - `discovery.timeoutMs` と `discovery.count`: このプローブパスで使用された実際の検出予算/結果数。

    対象ごと（`targets[].connect`）:

    - `ok`: 接続後の到達可能性と劣化分類。
    - `rpcOk`: 完全な詳細 RPC の成功。
    - `scopeLimited`: operator スコープ不足により詳細 RPC が失敗しました。

    対象ごと（`targets[].auth`）:

    - `role`: 利用可能な場合、`hello-ok` で報告された認証ロール。
    - `scopes`: 利用可能な場合、`hello-ok` で報告された付与済みスコープ。
    - `capability`: その対象に対して表面化された認証機能の分類。

  </Accordion>
  <Accordion title="一般的な警告コード">
    - `ssh_tunnel_failed`: SSH トンネルのセットアップに失敗しました。コマンドは直接プローブにフォールバックしました。
    - `multiple_gateways`: 複数の対象に到達可能でした。レスキューボットなど、分離されたプロファイルを意図的に実行している場合を除き、これは通常ではありません。
    - `auth_secretref_unresolved`: 設定済みの認証 SecretRef を失敗した対象向けに解決できませんでした。
    - `probe_scope_limited`: WebSocket 接続は成功しましたが、`operator.read` が不足していたため読み取りプローブが制限されました。

  </Accordion>
</AccordionGroup>

#### SSH 経由のリモート（Mac アプリとの同等性）

macOS アプリの「Remote over SSH」モードはローカルポート転送を使用するため、リモート Gateway（ループバックのみにバインドされている場合があります）に `ws://127.0.0.1:<port>` で到達できるようになります。

CLI での同等操作:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` または `user@host:port`（ポートの既定値は `22`）。
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ID ファイル。
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  解決済みの検出エンドポイント（`local.` に加え、設定済みの広域ドメインがあればそれも）から、最初に検出された Gateway ホストを SSH 対象として選択します。TXT のみのヒントは無視されます。
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
  主に、最終ペイロードの前に中間イベントをストリーミングするエージェント形式の RPC 向けです。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読の JSON 出力。
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

管理対象サービスを別の実行可能ファイル経由で起動する必要がある場合は、`--wrapper` を使用します。たとえば、シークレットマネージャーの shim や run-as ヘルパーです。ラッパーは通常の Gateway 引数を受け取り、最終的にそれらの引数で `openclaw` または Node を exec する責任を持ちます。

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

環境からラッパーを設定することもできます。`gateway install` は、そのパスが実行可能ファイルであることを検証し、ラッパーをサービスの `ProgramArguments` に書き込み、後の強制再インストール、更新、doctor 修復のためにサービス環境へ `OPENCLAW_WRAPPER` を永続化します。

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
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="ライフサイクル動作">
    - 管理対象サービスを再起動するには `gateway restart` を使用します。再起動の代替として `gateway stop` と `gateway start` を連結しないでください。macOS では、`gateway stop` は停止前に LaunchAgent を意図的に無効化します。
    - `gateway restart --safe` は、実行中の Gateway にアクティブな OpenClaw 作業のプリフライトを依頼し、返信配信、埋め込み実行、タスク実行がドレインされるまで再起動を延期します。`--safe` は `--force` または `--wait` と組み合わせることはできません。
    - `gateway restart --wait 30s` は、その再起動について設定済みの再起動ドレイン予算を上書きします。単位なしの数値はミリ秒です。`s`、`m`、`h` などの単位を使用できます。`--wait 0` は無期限に待機します。
    - `gateway restart --force` はアクティブ作業のドレインをスキップし、即座に再起動します。オペレーターが一覧表示されたタスクブロッカーをすでに確認し、今すぐ Gateway を戻したい場合に使用します。
    - ライフサイクルコマンドはスクリプト用に `--json` を受け付けます。

  </Accordion>
  <Accordion title="インストール時の認証とSecretRefs">
    - トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、`gateway install` は SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータには永続化しません。
    - トークン認証でトークンが必要で、設定されたトークンの SecretRef が未解決の場合、インストールはフォールバックの平文を永続化せずにフェイルクローズします。
    - `gateway run` のパスワード認証では、インラインの `--password` よりも `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef で裏付けられた `gateway.auth.password` を優先してください。
    - 推論された認証モードでは、シェル限定の `OPENCLAW_GATEWAY_PASSWORD` によってインストール時のトークン要件は緩和されません。管理対象サービスをインストールするときは、永続的な設定（`gateway.auth.password` または設定の `env`）を使用してください。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでインストールはブロックされます。

  </Accordion>
</AccordionGroup>

## Gateway を検出する（Bonjour）

`gateway discover` は Gateway ビーコン（`_openclaw-gw._tcp`）をスキャンします。

- Multicast DNS-SD: `local.`
- Unicast DNS-SD（Wide-Area Bonjour）: ドメイン（例: `openclaw.internal.`）を選択し、分割 DNS + DNS サーバーを設定します。[Bonjour](/ja-JP/gateway/bonjour) を参照してください。

Bonjour 検出が有効（デフォルト）な Gateway だけがビーコンをアドバタイズします。

Wide-Area 検出レコードには以下が含まれます（TXT）:

- `role`（Gateway ロールのヒント）
- `transport`（トランスポートのヒント、例: `gateway`）
- `gatewayPort`（WebSocket ポート、通常は `18789`）
- `sshPort`（任意。存在しない場合、クライアントは SSH ターゲットのデフォルトを `22` にします）
- `tailnetDns`（MagicDNS ホスト名、利用可能な場合）
- `gatewayTls` / `gatewayTlsSha256`（TLS 有効 + 証明書フィンガープリント）
- `cliPath`（wide-area ゾーンに書き込まれるリモートインストールのヒント）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  コマンドごとのタイムアウト（参照/解決）。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な出力（スタイル設定/スピナーも無効化します）。
</ParamField>

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI は `local.` に加えて、有効化されている場合は設定された wide-area ドメインもスキャンします。
- JSON 出力の `wsUrl` は、`lanHost` や `tailnetDns` のような TXT のみのヒントではなく、解決済みのサービスエンドポイントから導出されます。
- `local.` mDNS では、`sshPort` と `cliPath` は `discovery.mdns.mode` が `full` の場合にのみブロードキャストされます。Wide-area DNS-SD でも `cliPath` は書き込まれますが、`sshPort` はそこでも任意のままです。

</Note>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
