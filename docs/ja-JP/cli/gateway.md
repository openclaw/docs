---
read_when:
    - CLI から Gateway を実行する（開発環境またはサーバー）
    - Gateway の認証、バインドモード、接続性のデバッグ
    - Bonjour を介した Gateway の検出（ローカル + 広域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gatewayを実行、照会、検出する
title: Gateway
x-i18n:
    generated_at: "2026-05-12T12:50:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b19babe545895b8a5fc4b49bef5a0f9103091795f3e3c9bbcdf9ba9d7784538
    source_path: cli/gateway.md
    workflow: 16
---

Gateway は OpenClaw の WebSocket サーバー（チャネル、ノード、セッション、フック）です。このページのサブコマンドは `openclaw gateway …` 配下にあります。

<CardGroup cols={3}>
  <Card title="Bonjour 検出" href="/ja-JP/gateway/bonjour">
    ローカル mDNS + 広域 DNS-SD のセットアップ。
  </Card>
  <Card title="検出の概要" href="/ja-JP/gateway/discovery">
    OpenClaw が Gateway をアドバタイズし、見つける仕組み。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration">
    トップレベルの Gateway 設定キー。
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
  <Accordion title="起動時の動作">
    - 既定では、`~/.openclaw/openclaw.json` に `gateway.mode=local` が設定されていない限り、Gateway は起動を拒否します。アドホック/開発用の実行には `--allow-unconfigured` を使用します。
    - `openclaw onboard --mode local` と `openclaw setup` は `gateway.mode=local` を書き込む想定です。ファイルが存在するのに `gateway.mode` がない場合は、暗黙的にローカルモードとみなすのではなく、破損または上書きされた設定として扱い、修復してください。
    - ファイルが存在し、`gateway.mode` がない場合、Gateway はそれを疑わしい設定破損として扱い、ユーザーの代わりに「ローカルと推測」することを拒否します。
    - 認証なしでループバックを越えてバインドすることはブロックされます（安全ガードレール）。
    - `SIGUSR1` は、許可されている場合にプロセス内再起動をトリガーします（`commands.restart` は既定で有効です。手動再起動をブロックするには `commands.restart: false` を設定しますが、Gateway ツール/設定の適用/更新は引き続き許可されます）。
    - `SIGINT`/`SIGTERM` ハンドラーは Gateway プロセスを停止しますが、カスタムの端末状態は復元しません。CLI を TUI や raw モード入力でラップする場合は、終了前に端末を復元してください。

  </Accordion>
</AccordionGroup>

### オプション

<ParamField path="--port <port>" type="number">
  WebSocket ポート（既定値は設定/env から取得されます。通常は `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  リスナーのバインドモード。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  認証モードの上書き。
</ParamField>
<ParamField path="--token <token>" type="string">
  トークンの上書き（プロセスの `OPENCLAW_GATEWAY_TOKEN` も設定します）。
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
  設定内に `gateway.mode=local` がなくても Gateway の起動を許可します。アドホック/開発用のブートストラップに限り起動ガードをバイパスします。設定ファイルの書き込みや修復は行いません。
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
  Websocket ログのスタイル。
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

## Gateway を再起動する

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` は、再起動前に実行中の Gateway にアクティブな OpenClaw 作業の事前確認を依頼します。キュー済み操作、返信配信、埋め込み実行、またはタスク実行がアクティブな場合、Gateway はブロッカーを報告し、重複する安全な再起動リクエストをまとめ、アクティブな作業が排出された後に再起動します。プレーンな `restart` は互換性のために既存のサービスマネージャーの動作を維持します。即時上書きパスを明示的に使いたい場合にのみ `--force` を使用してください。

`openclaw gateway restart --safe --skip-deferral` は `--safe` と同じ OpenClaw 対応の協調再起動を実行しますが、アクティブ作業の延期ゲートをバイパスするため、ブロッカーが報告されていても Gateway はただちに再起動を発行します。タスク実行の停止で延期が固定され、`--safe` だけでは無期限に待機してしまう場合のオペレーター用エスケープハッチとして使用してください。`--skip-deferral` には `--safe` が必要です。

<Warning>
インラインの `--password` はローカルのプロセス一覧に露出する可能性があります。`--password-file`、env、または SecretRef によって裏付けられた `gateway.auth.password` を優先してください。
</Warning>

### 起動プロファイリング

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を設定すると、Gateway 起動中のフェーズタイミングをログ出力します。これにはフェーズごとの `eventLoopMax` 遅延と、installed-index、manifest registry、起動計画、owner-map 作業の Plugin ルックアップテーブルタイミングが含まれます。
- `OPENCLAW_DIAGNOSTICS=timeline` と `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` を設定すると、外部 QA ハーネス向けにベストエフォートの JSONL 起動診断タイムラインを書き込みます。設定で `diagnostics.flags: ["timeline"]` を使ってフラグを有効にすることもできます。この場合もパスは env で指定します。イベントループサンプルを含めるには `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` を追加します。
- `pnpm test:startup:gateway -- --runs 5 --warmup 1` を実行すると、Gateway 起動をベンチマークします。ベンチマークは、最初のプロセス出力、`/healthz`、`/readyz`、起動トレースタイミング、イベントループ遅延、Plugin ルックアップテーブルタイミングの詳細を記録します。

## 実行中の Gateway に問い合わせる

すべてのクエリコマンドは WebSocket RPC を使用します。

<Tabs>
  <Tab title="出力モード">
    - 既定: 人間が読める形式（TTY では色付き）。
    - `--json`: 機械可読 JSON（スタイル/スピナーなし）。
    - `--no-color`（または `NO_COLOR=1`）: 人間向けレイアウトを維持したまま ANSI を無効化します。

  </Tab>
  <Tab title="共有オプション">
    - `--url <url>`: Gateway WebSocket URL。
    - `--token <token>`: Gateway トークン。
    - `--password <password>`: Gateway パスワード。
    - `--timeout <ms>`: タイムアウト/予算（コマンドごとに異なります）。
    - `--expect-final`: 「final」レスポンスを待機します（エージェント呼び出し）。

  </Tab>
</Tabs>

<Note>
`--url` を設定すると、CLI は設定や環境の資格情報へフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な資格情報がない場合はエラーです。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` エンドポイントは liveness プローブです。サーバーが HTTP に応答できるようになると返ります。HTTP `/readyz` エンドポイントはより厳格で、起動時の Plugin サイドカー、チャネル、または設定済みフックがまだ安定していない間は赤のままです。ローカルまたは認証済みの詳細な readiness レスポンスには、イベントループ遅延、イベントループ使用率、CPU コア比率、`degraded` フラグを含む `eventLoop` 診断ブロックが含まれます。

### `gateway usage-cost`

セッションログから使用コストのサマリーを取得します。

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
  安定性の詳細を表示する代わりに、共有可能なサポート診断 zip を書き込みます。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` の出力パス。
</ParamField>

<AccordionGroup>
  <Accordion title="プライバシーとバンドルの動作">
    - レコードは運用メタデータを保持します。イベント名、カウント、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャネル/Plugin 名、編集済みセッションサマリーです。チャットテキスト、Webhook 本文、ツール出力、生のリクエストまたはレスポンス本文、トークン、Cookie、シークレット値、ホスト名、生のセッション ID は保持しません。レコーダーを完全に無効化するには `diagnostics.enabled: false` を設定します。
    - 致命的な Gateway 終了、シャットダウンタイムアウト、再起動時の起動失敗では、レコーダーにイベントがある場合、OpenClaw は同じ診断スナップショットを `~/.openclaw/logs/stability/openclaw-stability-*.json` に書き込みます。最新バンドルは `openclaw gateway stability --bundle latest` で確認します。`--limit`、`--type`、`--since-seq` もバンドル出力に適用されます。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

バグレポートに添付することを目的としたローカル診断 zip を書き込みます。プライバシーモデルとバンドル内容については、[診断エクスポート](/ja-JP/gateway/diagnostics) を参照してください。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  出力 zip パス。既定では状態ディレクトリ配下のサポートエクスポートです。
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

エクスポートには、マニフェスト、Markdown サマリー、設定の形状、サニタイズ済み設定詳細、サニタイズ済みログサマリー、サニタイズ済み Gateway ステータス/ヘルススナップショット、および存在する場合は最新の安定性バンドルが含まれます。

これは共有を目的としています。安全な OpenClaw ログフィールド、サブシステム名、ステータスコード、所要時間、設定済みモード、ポート、Plugin ID、プロバイダー ID、シークレットではない機能設定、編集済み運用ログメッセージなど、デバッグに役立つ運用詳細を保持します。チャットテキスト、Webhook 本文、ツール出力、資格情報、Cookie、アカウント/メッセージ識別子、プロンプト/指示テキスト、ホスト名、シークレット値は省略または編集されます。LogTape スタイルのメッセージがユーザー/チャット/ツールのペイロードテキストに見える場合、エクスポートはメッセージが省略されたこととそのバイト数のみを保持します。

### `gateway status`

`gateway status` は Gateway サービス（launchd/systemd/schtasks）と、接続性/認証機能の任意のプローブを表示します。

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
  接続性プローブをスキップします（サービスのみのビュー）。
</ParamField>
<ParamField path="--deep" type="boolean">
  システムレベルのサービスもスキャンします。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  デフォルトの接続性プローブを読み取りプローブに昇格し、その読み取りプローブが失敗した場合は 0 以外で終了します。`--no-probe` と組み合わせることはできません。
</ParamField>

<AccordionGroup>
  <Accordion title="ステータスの意味">
    - `gateway status` は、ローカル CLI 設定がない場合や無効な場合でも、診断用に引き続き利用できます。
    - デフォルトの `gateway status` は、サービス状態、WebSocket 接続、ハンドシェイク時に見える認証機能を証明します。読み取り/書き込み/管理操作は証明しません。
    - 診断プローブは、初回デバイス認証に対して変更を加えません。既存のキャッシュ済みデバイストークンがある場合はそれを再利用しますが、ステータス確認のためだけに新しい CLI デバイス ID や読み取り専用デバイスのペアリングレコードを作成することはありません。
    - `gateway status` は、可能な場合、プローブ認証用に設定済みの認証 SecretRefs を解決します。
    - 必須の認証 SecretRef がこのコマンドパスで未解決の場合、プローブの接続性/認証が失敗すると `gateway status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
    - プローブが成功した場合、未解決の auth-ref 警告は誤検知を避けるため抑制されます。
    - 待ち受け中のサービスだけでは不十分で、読み取りスコープの RPC 呼び出しも正常である必要があるスクリプトや自動化では、`--require-rpc` を使用してください。
    - `--deep` は、追加の launchd/systemd/schtasks インストールをベストエフォートでスキャンします。複数の Gateway らしきサービスが検出された場合、人間向け出力にはクリーンアップのヒントが表示され、ほとんどのセットアップでは 1 台のマシンにつき 1 つの Gateway を実行すべきだと警告します。
    - `--deep` は、サービスプロセスが外部 supervisor による再起動のため正常終了した場合に、最近の Gateway supervisor 再起動ハンドオフも報告します。
    - `--deep` は Plugin 対応モード（`pluginValidation: "full"`）で設定検証を実行し、設定済み Plugin マニフェストの警告（たとえばチャンネル設定メタデータの欠落）を表示するため、インストールや更新のスモークチェックで検出できます。デフォルトの `gateway status` は、Plugin 検証をスキップする高速な読み取り専用パスを維持します。
    - 人間向け出力には、解決済みのファイルログパスに加えて、CLI とサービスの設定パス/有効性のスナップショットが含まれ、プロファイルや state-dir のずれを診断しやすくします。

  </Accordion>
  <Accordion title="Linux systemd の認証ずれチェック">
    - Linux systemd インストールでは、サービス認証ずれチェックがユニットから `Environment=` と `EnvironmentFile=` の値の両方を読み取ります（`%h`、引用符付きパス、複数ファイル、省略可能な `-` ファイルを含む）。
    - ずれチェックは、マージされたランタイム環境（まずサービスコマンド環境、次にプロセス環境のフォールバック）を使用して `gateway.auth.token` SecretRefs を解決します。
    - トークン認証が実質的に有効ではない場合（明示的な `gateway.auth.mode` が `password`/`none`/`trusted-proxy`、または mode が未設定でパスワードが優先され得るうえ、勝てるトークン候補がない場合）、トークンずれチェックは設定トークンの解決をスキップします。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` は「すべてをデバッグする」コマンドです。常に次をプローブします。

- 設定済みのリモート Gateway（設定されている場合）、および
- リモートが設定されている場合でも localhost（loopback）。

`--url` を渡すと、その明示的な対象が両方より前に追加されます。人間向け出力では対象に次のラベルが付きます。

- `URL (explicit)`
- `Remote (configured)` または `Remote (configured, inactive)`
- `Local loopback`

<Note>
複数の Gateway に到達できる場合、それらすべてが表示されます。レスキュー bot など、分離されたプロファイル/ポートを使う場合は複数の Gateway がサポートされますが、ほとんどのインストールでは単一の Gateway を実行します。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="解釈">
    - `Reachable: yes` は、少なくとも 1 つの対象が WebSocket 接続を受け入れたことを意味します。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` は、認証についてプローブが証明できた内容を報告します。到達可能性とは別です。
    - `Read probe: ok` は、読み取りスコープの詳細 RPC 呼び出し（`health`/`status`/`system-presence`/`config.get`）も成功したことを意味します。
    - `Read probe: limited - missing scope: operator.read` は、接続は成功したが読み取りスコープの RPC が制限されていることを意味します。これは完全な失敗ではなく、**劣化した** 到達可能性として報告されます。
    - `Connect: ok` の後の `Read probe: failed` は、Gateway が WebSocket 接続を受け入れたものの、後続の読み取り診断がタイムアウトしたか失敗したことを意味します。これも到達不能な Gateway ではなく、**劣化した** 到達可能性です。
    - `gateway status` と同様に、probe は既存のキャッシュ済みデバイス認証を再利用しますが、初回デバイス ID やペアリング状態は作成しません。
    - 終了コードが 0 以外になるのは、プローブ対象のどれにも到達できない場合だけです。

  </Accordion>
  <Accordion title="JSON 出力">
    トップレベル:

    - `ok`: 少なくとも 1 つの対象に到達できます。
    - `degraded`: 少なくとも 1 つの対象が接続を受け入れたものの、完全な詳細 RPC 診断を完了しませんでした。
    - `capability`: 到達可能な対象全体で見つかった最良の機能（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope`、または `unknown`）。
    - `primaryTargetId`: アクティブな勝者として扱う最良の対象。優先順は、明示的な URL、SSH トンネル、設定済みリモート、local loopback です。
    - `warnings[]`: `code`、`message`、任意の `targetIds` を持つベストエフォートの警告レコード。
    - `network`: 現在の設定とホストネットワークから導出された local loopback/tailnet URL のヒント。
    - `discovery.timeoutMs` と `discovery.count`: このプローブパスで使用された実際の検出予算/結果数。

    対象ごと（`targets[].connect`）:

    - `ok`: 接続後の到達可能性 + 劣化分類。
    - `rpcOk`: 完全な詳細 RPC の成功。
    - `scopeLimited`: 必要な operator スコープがないため詳細 RPC が失敗しました。

    対象ごと（`targets[].auth`）:

    - `role`: 利用可能な場合、`hello-ok` で報告された認証ロール。
    - `scopes`: 利用可能な場合、`hello-ok` で報告された付与済みスコープ。
    - `capability`: その対象について表示される認証機能の分類。

  </Accordion>
  <Accordion title="一般的な警告コード">
    - `ssh_tunnel_failed`: SSH トンネルのセットアップに失敗しました。コマンドは直接プローブにフォールバックしました。
    - `multiple_gateways`: 複数の対象に到達できました。レスキュー bot など、分離されたプロファイルを意図的に実行している場合を除き、これは通常ではありません。
    - `auth_secretref_unresolved`: 設定済みの認証 SecretRef を、失敗した対象向けに解決できませんでした。
    - `probe_scope_limited`: WebSocket 接続は成功しましたが、読み取りプローブが `operator.read` の欠落により制限されました。

  </Accordion>
</AccordionGroup>

#### SSH 経由のリモート（Mac アプリとの同等性）

macOS アプリの「Remote over SSH」モードは、ローカルポートフォワードを使用するため、リモート Gateway（loopback のみにバインドされている場合があります）が `ws://127.0.0.1:<port>` で到達可能になります。

CLI での同等操作:

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
  解決済みの検出エンドポイント（`local.` に設定済みの広域ドメインがあればそれを加えたもの）から、最初に検出された Gateway ホストを SSH 対象として選択します。TXT のみのヒントは無視されます。
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
  主に、最終ペイロードの前に中間イベントをストリーミングするエージェント風 RPC 向けです。
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

管理対象サービスを別の実行ファイル経由で開始する必要がある場合、たとえば
シークレットマネージャー shim や run-as ヘルパーを使う場合は、`--wrapper` を使用します。wrapper は通常の Gateway 引数を受け取り、
最終的にそれらの引数で `openclaw` または Node を exec する責任があります。

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

環境を通じて wrapper を設定することもできます。`gateway install` はパスが
実行可能ファイルであることを検証し、wrapper をサービスの `ProgramArguments` に書き込み、
`OPENCLAW_WRAPPER` をサービス環境に永続化して、以後の強制再インストール、更新、doctor
修復で使用します。

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
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="ライフサイクル動作">
    - 管理対象サービスを再起動するには `gateway restart` を使用します。再起動の代替として `gateway stop` と `gateway start` を連結しないでください。
    - macOS では、`gateway stop` はデフォルトで `launchctl bootout` を使用します。これにより、無効化を永続化せずに現在のブートセッションから LaunchAgent が削除されます。KeepAlive の自動復旧は今後のクラッシュに対して引き続き有効で、`gateway start` は手動の `launchctl enable` なしで正常に再有効化します。Gateway が次の明示的な `gateway start` まで再起動しないよう、KeepAlive と RunAtLoad を永続的に抑制するには `--disable` を渡します。手動停止を再起動やシステム再起動後も維持する必要がある場合に使用してください。
    - `gateway restart --safe` は、実行中の Gateway にアクティブな OpenClaw 作業の事前確認を要求し、返信配信、埋め込み実行、タスク実行がドレインされるまで再起動を延期します。`--safe` は `--force` または `--wait` と組み合わせることはできません。
    - `gateway restart --wait 30s` は、その再起動について設定済みの再起動ドレイン予算を上書きします。単位なしの数値はミリ秒です。`s`、`m`、`h` などの単位を使用できます。`--wait 0` は無期限に待機します。
    - `gateway restart --safe --skip-deferral` は OpenClaw 対応の安全な再起動を実行しますが、延期ゲートをバイパスするため、ブロッカーが報告されても Gateway はただちに再起動を発行します。停止したタスク実行の延期に対するオペレーター用のエスケープハッチです。`--safe` が必要です。
    - `gateway restart --force` はアクティブ作業のドレインをスキップし、ただちに再起動します。オペレーターが一覧表示されたタスクブロッカーをすでに確認しており、Gateway を今すぐ戻したい場合に使用します。
    - ライフサイクルコマンドはスクリプト用に `--json` を受け付けます。

  </Accordion>
  <Accordion title="インストール時の認証と SecretRefs">
    - トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、`gateway install` は SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータに永続化しません。
    - トークン認証でトークンが必要で、設定済みのトークン SecretRef が未解決の場合、フォールバックのプレーンテキストを永続化するのではなく、インストールは安全側で失敗します。
    - `gateway run` のパスワード認証では、インラインの `--password` よりも `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef-backed `gateway.auth.password` を優先してください。
    - 推論された認証モードでは、シェルだけの `OPENCLAW_GATEWAY_PASSWORD` はインストール時のトークン要件を緩和しません。管理対象サービスをインストールする場合は、永続的な設定（`gateway.auth.password` または config `env`）を使用してください。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、mode が明示的に設定されるまでインストールはブロックされます。

  </Accordion>
</AccordionGroup>

## Gateway を検出する（Bonjour）

`gateway discover` は Gateway ビーコン（`_openclaw-gw._tcp`）をスキャンします。

- マルチキャスト DNS-SD: `local.`
- ユニキャスト DNS-SD（Wide-Area Bonjour）: ドメイン（例: `openclaw.internal.`）を選択し、split DNS と DNS サーバーを設定します。[Bonjour](/ja-JP/gateway/bonjour) を参照してください。

Bonjour 検出が有効な Gateway（デフォルト）だけがビーコンを広告します。

広域検出レコードには、次の TXT ヒントを含めることができます。

- `role`（Gateway ロールのヒント）
- `transport`（トランスポートのヒント、例: `gateway`）
- `gatewayPort`（WebSocket ポート、通常は `18789`）
- `sshPort`（完全検出モードのみ。存在しない場合、クライアントは SSH ターゲットのデフォルトを `22` にします）
- `tailnetDns`（利用可能な場合の MagicDNS ホスト名）
- `gatewayTls` / `gatewayTlsSha256`（TLS 有効 + 証明書フィンガープリント）
- `cliPath`（完全検出モードのみ）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  コマンドごとのタイムアウト（参照/解決）。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読出力（スタイルとスピナーも無効化）。
</ParamField>

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI は `local.` に加えて、有効化されている場合は設定済みの広域ドメインをスキャンします。
- JSON 出力の `wsUrl` は、`lanHost` や `tailnetDns` などの TXT のみのヒントではなく、解決済みサービスエンドポイントから派生します。
- `local.` mDNS と広域 DNS-SD では、`sshPort` と `cliPath` は `discovery.mdns.mode` が `full` の場合にのみ公開されます。

</Note>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
