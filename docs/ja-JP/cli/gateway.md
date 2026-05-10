---
read_when:
    - CLI から Gateway を実行する（開発環境またはサーバー）
    - Gateway 認証、バインドモード、接続性のデバッグ
    - Bonjour（ローカル + 広域 DNS-SD）による Gateway の検出
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gatewayを実行、照会、検出する
title: Gateway
x-i18n:
    generated_at: "2026-05-10T19:28:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e436abba80f643f3b0bfc0a7d2f344beb18c3849a49e5d0825767ae7a81ae1d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway は OpenClaw の WebSocket サーバーです（チャネル、ノード、セッション、hook）。このページのサブコマンドは `openclaw gateway …` 配下にあります。

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/ja-JP/gateway/bonjour">
    ローカル mDNS + 広域 DNS-SD のセットアップ。
  </Card>
  <Card title="Discovery overview" href="/ja-JP/gateway/discovery">
    OpenClaw が Gateway を通知し、検出する仕組み。
  </Card>
  <Card title="Configuration" href="/ja-JP/gateway/configuration">
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
  <Accordion title="Startup behavior">
    - デフォルトでは、`~/.openclaw/openclaw.json` で `gateway.mode=local` が設定されていない限り、Gateway は起動を拒否します。アドホック/開発用の実行には `--allow-unconfigured` を使用してください。
    - `openclaw onboard --mode local` と `openclaw setup` は `gateway.mode=local` を書き込む想定です。ファイルは存在するが `gateway.mode` がない場合は、ローカルモードを暗黙に仮定するのではなく、設定が壊れているか上書きされたものとして扱い、修復してください。
    - ファイルが存在し、`gateway.mode` がない場合、Gateway はそれを疑わしい設定破損として扱い、ユーザーの代わりに「local だと推測」することを拒否します。
    - 認証なしで loopback を超えてバインドすることはブロックされます（安全ガードレール）。
    - `SIGUSR1` は、許可されている場合にプロセス内再起動をトリガーします（`commands.restart` はデフォルトで有効です。手動再起動をブロックするには `commands.restart: false` を設定しますが、gateway ツール/設定の apply/update は引き続き許可されます）。
    - `SIGINT`/`SIGTERM` ハンドラーは gateway プロセスを停止しますが、カスタムのターミナル状態は復元しません。CLI を TUI や raw-mode 入力でラップする場合は、終了前にターミナルを復元してください。

  </Accordion>
</AccordionGroup>

### オプション

<ParamField path="--port <port>" type="number">
  WebSocket ポート（デフォルトは設定/env から取得されます。通常は `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  リスナーのバインドモード。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  認証モードのオーバーライド。
</ParamField>
<ParamField path="--token <token>" type="string">
  トークンのオーバーライド（プロセス用に `OPENCLAW_GATEWAY_TOKEN` も設定します）。
</ParamField>
<ParamField path="--password <password>" type="string">
  パスワードのオーバーライド。
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
  設定内に `gateway.mode=local` がなくても gateway の起動を許可します。アドホック/開発用 bootstrap のためだけに起動ガードを迂回します。設定ファイルの書き込みや修復は行いません。
</ParamField>
<ParamField path="--dev" type="boolean">
  見つからない場合に開発用設定 + ワークスペースを作成します（BOOTSTRAP.md はスキップします）。
</ParamField>
<ParamField path="--reset" type="boolean">
  開発用設定 + 認証情報 + セッション + ワークスペースをリセットします（`--dev` が必要）。
</ParamField>
<ParamField path="--force" type="boolean">
  起動前に、選択されたポート上の既存リスナーをすべて終了します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  詳細ログ。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  コンソールには CLI バックエンドログのみを表示します（stdout/stderr も有効化します）。
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Websocket ログスタイル。
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` のエイリアス。
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  raw model stream イベントを jsonl にログ出力します。
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  raw stream jsonl パス。
</ParamField>

## Gateway を再起動する

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` は、再起動前に実行中の Gateway にアクティブな OpenClaw 作業の事前確認を求めます。キュー済み操作、返信配信、埋め込み実行、またはタスク実行がアクティブな場合、Gateway はブロッカーを報告し、重複する safe restart 要求をまとめ、アクティブな作業が排出されてから再起動します。通常の `restart` は互換性のために既存のサービスマネージャー動作を維持します。即時オーバーライド経路を明示的に使用したい場合のみ `--force` を使用してください。

`openclaw gateway restart --safe --skip-deferral` は `--safe` と同じ OpenClaw 対応の協調再起動を実行しますが、アクティブ作業の延期ゲートを迂回するため、ブロッカーが報告されても Gateway は直ちに再起動を発行します。スタックしたタスク実行によって延期が固定され、`--safe` だけでは無期限に待機してしまう場合のオペレーター向け escape hatch として使用してください。`--skip-deferral` には `--safe` が必要です。

<Warning>
インラインの `--password` はローカルのプロセス一覧に露出する可能性があります。`--password-file`、env、または SecretRef-backed の `gateway.auth.password` を優先してください。
</Warning>

### 起動プロファイリング

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を設定すると、Gateway 起動中のフェーズタイミングをログ出力します。これにはフェーズごとの `eventLoopMax` 遅延と、installed-index、manifest registry、startup planning、owner-map 作業の Plugin ルックアップテーブルタイミングが含まれます。
- `OPENCLAW_DIAGNOSTICS=timeline` と `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` を設定すると、外部 QA ハーネス向けにベストエフォートの JSONL 起動診断タイムラインを書き込みます。設定内の `diagnostics.flags: ["timeline"]` でフラグを有効にすることもできます。パスは引き続き env で指定します。event-loop サンプルを含めるには `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` を追加します。
- `pnpm test:startup:gateway -- --runs 5 --warmup 1` を実行すると、Gateway 起動をベンチマークします。このベンチマークは、最初のプロセス出力、`/healthz`、`/readyz`、起動トレースタイミング、event-loop 遅延、Plugin ルックアップテーブルのタイミング詳細を記録します。

## 実行中の Gateway にクエリする

すべてのクエリコマンドは WebSocket RPC を使用します。

<Tabs>
  <Tab title="Output modes">
    - デフォルト: 人間が読める形式（TTY では色付き）。
    - `--json`: 機械可読 JSON（スタイル/スピナーなし）。
    - `--no-color`（または `NO_COLOR=1`）: 人間向けレイアウトを維持しつつ ANSI を無効化します。

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: Gateway WebSocket URL。
    - `--token <token>`: Gateway トークン。
    - `--password <password>`: Gateway パスワード。
    - `--timeout <ms>`: タイムアウト/予算（コマンドごとに異なります）。
    - `--expect-final`: 「final」応答を待機します（agent calls）。

  </Tab>
</Tabs>

<Note>
`--url` を設定すると、CLI は設定や環境の認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` endpoint は liveness probe です。サーバーが HTTP に応答できるようになると返ります。HTTP `/readyz` endpoint はより厳格で、起動時の Plugin sidecar、チャネル、または設定済み hook がまだ安定していない間は red のままです。ローカルまたは認証済みの詳細な readiness 応答には、event-loop 遅延、event-loop utilization、CPU コア比率、`degraded` フラグを含む `eventLoop` 診断ブロックが含まれます。

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
  `payload.large` や `diagnostic.memory.pressure` など、診断イベントタイプでフィルタリングします。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  診断シーケンス番号より後のイベントのみを含めます。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  実行中の Gateway を呼び出す代わりに、永続化された stability bundle を読み取ります。state ディレクトリ配下の最新 bundle には `--bundle latest`（または単に `--bundle`）を使用するか、bundle JSON パスを直接渡します。
</ParamField>
<ParamField path="--export" type="boolean">
  stability の詳細を出力する代わりに、共有可能なサポート診断 zip を書き込みます。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` の出力パス。
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - レコードは運用メタデータを保持します。イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャネル/Plugin 名、redacted セッションサマリーです。チャットテキスト、webhook 本文、ツール出力、raw request または response body、トークン、Cookie、secret values、ホスト名、raw session ids は保持しません。recorder を完全に無効化するには `diagnostics.enabled: false` を設定します。
    - 致命的な Gateway 終了、シャットダウンタイムアウト、再起動時の起動失敗では、recorder にイベントがある場合、OpenClaw は同じ診断スナップショットを `~/.openclaw/logs/stability/openclaw-stability-*.json` に書き込みます。最新 bundle は `openclaw gateway stability --bundle latest` で確認してください。`--limit`、`--type`、`--since-seq` も bundle 出力に適用されます。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

バグ報告に添付するために設計されたローカル診断 zip を書き込みます。プライバシーモデルと bundle の内容については、[Diagnostics Export](/ja-JP/gateway/diagnostics) を参照してください。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  出力 zip パス。デフォルトでは state ディレクトリ配下のサポート export になります。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  含める sanitized ログ行の最大数。
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
  status/health スナップショットのタイムアウト。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  永続化された stability bundle の検索をスキップします。
</ParamField>
<ParamField path="--json" type="boolean">
  書き込まれたパス、サイズ、manifest を JSON として出力します。
</ParamField>

export には、manifest、Markdown サマリー、設定の形状、sanitized 設定詳細、sanitized ログサマリー、sanitized Gateway status/health スナップショット、存在する場合は最新の stability bundle が含まれます。

これは共有を前提としています。デバッグに役立つ運用詳細を保持します。たとえば、安全な OpenClaw ログフィールド、サブシステム名、ステータスコード、duration、設定済みモード、ポート、Plugin ids、provider ids、secret ではない feature settings、redacted 運用ログメッセージなどです。チャットテキスト、webhook 本文、ツール出力、認証情報、Cookie、account/message identifiers、prompt/instruction text、ホスト名、secret values は省略または redacted されます。LogTape-style のメッセージがユーザー/チャット/ツール payload text のように見える場合、export はメッセージが省略されたことと、そのバイト数のみを保持します。

### `gateway status`

`gateway status` は Gateway サービス（launchd/systemd/schtasks）に加え、任意で connectivity/auth capability の probe を表示します。

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
  接続性プローブをスキップします（サービスのみの表示）。
</ParamField>
<ParamField path="--deep" type="boolean">
  システムレベルのサービスもスキャンします。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  デフォルトの接続性プローブを読み取りプローブに昇格し、その読み取りプローブが失敗した場合は 0 以外で終了します。`--no-probe` と組み合わせることはできません。
</ParamField>

<AccordionGroup>
  <Accordion title="ステータスの意味">
    - `gateway status` は、ローカル CLI 設定がない場合や無効な場合でも診断用に引き続き利用できます。
    - デフォルトの `gateway status` は、サービス状態、WebSocket 接続、ハンドシェイク時に見える認証ケイパビリティを確認します。読み取り/書き込み/管理操作は確認しません。
    - 診断プローブは、初回デバイス認証では変更を行いません。既存のキャッシュ済みデバイストークンがある場合はそれを再利用しますが、ステータス確認のためだけに新しい CLI デバイス ID や読み取り専用デバイスペアリングレコードを作成することはありません。
    - `gateway status` は、可能な場合、プローブ認証用に設定済みの認証 SecretRefs を解決します。
    - このコマンドパスで必須の認証 SecretRef が未解決の場合、`gateway status --json` はプローブの接続性/認証が失敗すると `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
    - プローブが成功した場合、誤検知を避けるため未解決の auth-ref 警告は抑制されます。
    - リスニング中のサービスだけでは不十分で、読み取りスコープの RPC 呼び出しも正常である必要があるスクリプトや自動化では、`--require-rpc` を使用します。
    - `--deep` は、追加の launchd/systemd/schtasks インストールに対するベストエフォートのスキャンを追加します。複数の Gateway らしきサービスが検出された場合、人間向け出力にはクリーンアップのヒントが表示され、多くの構成では 1 台のマシンにつき 1 つの Gateway を実行すべきであることを警告します。
    - `--deep` は、外部スーパーバイザーによる再起動のためにサービスプロセスが正常終了した場合、直近の Gateway スーパーバイザー再起動ハンドオフも報告します。
    - 人間向け出力には、プロファイルや状態ディレクトリのずれを診断しやすくするため、解決済みのファイルログパスと、CLI とサービスの設定パス/有効性のスナップショットが含まれます。

  </Accordion>
  <Accordion title="Linux systemd の認証ドリフトチェック">
    - Linux systemd インストールでは、サービス認証ドリフトチェックはユニットから `Environment=` と `EnvironmentFile=` の両方の値を読み取ります（`%h`、引用符付きパス、複数ファイル、任意指定の `-` ファイルを含む）。
    - ドリフトチェックは、マージされたランタイム環境（まずサービスコマンド環境、次にプロセス環境へのフォールバック）を使用して `gateway.auth.token` SecretRefs を解決します。
    - トークン認証が実質的に有効でない場合（明示的な `gateway.auth.mode` が `password`/`none`/`trusted-proxy`、または mode が未設定でパスワードが優先される可能性があり、優先されるトークン候補がない場合）、トークンドリフトチェックは設定トークンの解決をスキップします。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` は「すべてをデバッグする」コマンドです。常に次をプローブします。

- 設定済みのリモート Gateway（設定されている場合）
- localhost（loopback）**リモートが設定されている場合でも**

`--url` を渡すと、その明示的な対象が両方の前に追加されます。人間向け出力では、対象に次のラベルが付きます。

- `URL (explicit)`
- `Remote (configured)` または `Remote (configured, inactive)`
- `Local loopback`

<Note>
複数の Gateway に到達できる場合は、そのすべてが出力されます。レスキュー bot など、分離されたプロファイル/ポートを使用する場合は複数の Gateway がサポートされますが、多くのインストールでは引き続き単一の Gateway を実行します。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="解釈">
    - `Reachable: yes` は、少なくとも 1 つの対象が WebSocket 接続を受け入れたことを意味します。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` は、プローブが認証について確認できた内容を報告します。到達性とは別です。
    - `Read probe: ok` は、読み取りスコープの詳細 RPC 呼び出し（`health`/`status`/`system-presence`/`config.get`）も成功したことを意味します。
    - `Read probe: limited - missing scope: operator.read` は、接続は成功したものの、読み取りスコープの RPC が制限されていることを意味します。これは完全な失敗ではなく、**低下した**到達性として報告されます。
    - `Connect: ok` の後の `Read probe: failed` は、Gateway が WebSocket 接続を受け入れたものの、後続の読み取り診断がタイムアウトしたか失敗したことを意味します。これも到達不能な Gateway ではなく、**低下した**到達性です。
    - `gateway status` と同様に、probe は既存のキャッシュ済みデバイス認証を再利用しますが、初回デバイス ID やペアリング状態は作成しません。
    - 終了コードが 0 以外になるのは、プローブした対象に 1 つも到達できない場合のみです。

  </Accordion>
  <Accordion title="JSON 出力">
    トップレベル:

    - `ok`: 少なくとも 1 つの対象に到達できます。
    - `degraded`: 少なくとも 1 つの対象が接続を受け入れたものの、完全な詳細 RPC 診断を完了しませんでした。
    - `capability`: 到達可能な対象全体で見られた最良のケイパビリティ（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope`、または `unknown`）。
    - `primaryTargetId`: アクティブな勝者として扱う最良の対象。順序は、明示的 URL、SSH トンネル、設定済みリモート、local loopback です。
    - `warnings[]`: `code`、`message`、任意の `targetIds` を持つベストエフォートの警告レコード。
    - `network`: 現在の設定とホストネットワークから派生した local loopback/tailnet URL ヒント。
    - `discovery.timeoutMs` と `discovery.count`: このプローブ実行で使用された実際の検出予算/結果数。

    対象ごと（`targets[].connect`）:

    - `ok`: 接続後の到達性 + 低下分類。
    - `rpcOk`: 完全な詳細 RPC の成功。
    - `scopeLimited`: 必要な operator スコープがないため、詳細 RPC が失敗しました。

    対象ごと（`targets[].auth`）:

    - `role`: 利用可能な場合に `hello-ok` で報告される認証ロール。
    - `scopes`: 利用可能な場合に `hello-ok` で報告される付与済みスコープ。
    - `capability`: その対象について表面化された認証ケイパビリティ分類。

  </Accordion>
  <Accordion title="一般的な警告コード">
    - `ssh_tunnel_failed`: SSH トンネルのセットアップに失敗しました。コマンドは直接プローブにフォールバックしました。
    - `multiple_gateways`: 複数の対象に到達できました。レスキュー bot など、分離されたプロファイルを意図的に実行している場合を除き、これは通常ではありません。
    - `auth_secretref_unresolved`: 設定済みの認証 SecretRef を、失敗した対象に対して解決できませんでした。
    - `probe_scope_limited`: WebSocket 接続は成功しましたが、`operator.read` がないため読み取りプローブが制限されました。

  </Accordion>
</AccordionGroup>

#### SSH 経由のリモート（Mac アプリとの同等性）

macOS アプリの「Remote over SSH」モードは、ローカルポートフォワードを使用するため、loopback のみにバインドされている可能性があるリモート Gateway が `ws://127.0.0.1:<port>` で到達可能になります。

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
  解決済み検出エンドポイント（`local.` に、設定済みの広域ドメインがあればそれを加えたもの）から、最初に検出された Gateway ホストを SSH 対象として選択します。TXT のみのヒントは無視されます。
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
  主に、最終ペイロードの前に中間イベントをストリームするエージェント形式の RPC 用です。
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

### ラッパー付きでインストールする

管理対象サービスを別の実行可能ファイル経由で起動する必要がある場合、たとえば
シークレットマネージャーの shim や run-as ヘルパーを使う場合は、`--wrapper` を使用します。ラッパーは通常の Gateway 引数を受け取り、
最終的にそれらの引数で `openclaw` または Node を exec する責任を持ちます。

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

環境からラッパーを設定することもできます。`gateway install` はパスが
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
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="ライフサイクルの動作">
    - マネージドサービスを再起動するには `gateway restart` を使用します。再起動の代替として `gateway stop` と `gateway start` を連鎖させないでください。
    - macOS では、`gateway stop` はデフォルトで `launchctl bootout` を使用します。これは無効化を永続化せずに現在の起動セッションから LaunchAgent を削除します — KeepAlive の自動復旧は将来のクラッシュに対して引き続き有効で、`gateway start` は手動の `launchctl enable` なしでクリーンに再有効化します。Gateway が次の明示的な `gateway start` まで再起動しないよう、KeepAlive と RunAtLoad を永続的に抑制するには `--disable` を渡します。手動停止を再起動やシステム再起動後も維持したい場合に使用します。
    - `gateway restart --safe` は実行中の Gateway にアクティブな OpenClaw 作業の事前確認を依頼し、返信配信、埋め込み実行、タスク実行が排出されるまで再起動を延期します。`--safe` は `--force` または `--wait` と組み合わせることはできません。
    - `gateway restart --wait 30s` は、その再起動に対して設定済みの再起動排出予算を上書きします。単位なしの数値はミリ秒です。`s`、`m`、`h` などの単位を使用できます。`--wait 0` は無期限に待機します。
    - `gateway restart --safe --skip-deferral` は OpenClaw 対応の安全な再起動を実行しますが、延期ゲートを迂回するため、ブロッカーが報告されていても Gateway は即座に再起動を発行します。スタックしたタスク実行の延期に対するオペレーター用の逃げ道です。`--safe` が必要です。
    - `gateway restart --force` はアクティブ作業の排出をスキップし、即座に再起動します。オペレーターが一覧表示されたタスクブロッカーをすでに確認済みで、Gateway を今すぐ戻したい場合に使用します。
    - ライフサイクルコマンドはスクリプト用に `--json` を受け付けます。

  </Accordion>
  <Accordion title="インストール時の認証と SecretRefs">
    - トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、`gateway install` は SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータへ永続化しません。
    - トークン認証にトークンが必要で、設定されたトークン SecretRef が未解決の場合、インストールはフォールバックの平文を永続化する代わりにフェイルクローズします。
    - `gateway run` のパスワード認証では、インラインの `--password` よりも `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef を使った `gateway.auth.password` を優先してください。
    - 推論された認証モードでは、シェル限定の `OPENCLAW_GATEWAY_PASSWORD` はインストール時のトークン要件を緩和しません。マネージドサービスをインストールするときは、永続的な設定（`gateway.auth.password` または設定の `env`）を使用してください。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでインストールはブロックされます。

  </Accordion>
</AccordionGroup>

## Gateway を検出する (Bonjour)

`gateway discover` は Gateway ビーコン（`_openclaw-gw._tcp`）をスキャンします。

- マルチキャスト DNS-SD: `local.`
- ユニキャスト DNS-SD（Wide-Area Bonjour）: ドメイン（例: `openclaw.internal.`）を選択し、分割 DNS と DNS サーバーをセットアップします。[Bonjour](/ja-JP/gateway/bonjour) を参照してください。

Bonjour 検出が有効（デフォルト）な Gateway のみがビーコンをアドバタイズします。

Wide-Area 検出レコードには次が含まれます（TXT）:

- `role`（Gateway ロールのヒント）
- `transport`（トランスポートのヒント、例: `gateway`）
- `gatewayPort`（WebSocket ポート、通常は `18789`）
- `sshPort`（任意。存在しない場合、クライアントは SSH ターゲットのデフォルトを `22` にします）
- `tailnetDns`（利用可能な場合は MagicDNS ホスト名）
- `gatewayTls` / `gatewayTlsSha256`（TLS 有効化 + 証明書フィンガープリント）
- `cliPath`（Wide-Area ゾーンに書き込まれるリモートインストールのヒント）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  コマンドごとのタイムアウト（browse/resolve）。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な出力（スタイル付けとスピナーも無効化します）。
</ParamField>

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI は `local.` に加えて、有効化されている場合は設定済みの Wide-Area ドメインをスキャンします。
- JSON 出力の `wsUrl` は、`lanHost` や `tailnetDns` などの TXT のみのヒントではなく、解決されたサービスエンドポイントから導出されます。
- `local.` mDNS では、`sshPort` と `cliPath` は `discovery.mdns.mode` が `full` の場合にのみブロードキャストされます。Wide-Area DNS-SD でも `cliPath` は書き込まれます。そこでも `sshPort` は任意のままです。

</Note>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
