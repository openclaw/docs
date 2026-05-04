---
read_when:
    - CLI から Gateway を実行する（開発環境またはサーバー）
    - Gateway の認証、バインドモード、接続性のデバッグ
    - Bonjour による Gateway の検出 (ローカル + 広域 DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gatewayを実行、照会、検出する
title: Gateway
x-i18n:
    generated_at: "2026-05-04T18:23:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 310867c59148577f2e8ce6f708da6bce936e09243ce7fbe5daeb453c6b3b370d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway は OpenClaw の WebSocket サーバー（channels、nodes、sessions、hooks）です。このページのサブコマンドは `openclaw gateway …` の下にあります。

<CardGroup cols={3}>
  <Card title="Bonjour 検出" href="/ja-JP/gateway/bonjour">
    ローカル mDNS + 広域 DNS-SD のセットアップ。
  </Card>
  <Card title="検出の概要" href="/ja-JP/gateway/discovery">
    OpenClaw が Gateway を通知し、見つける方法。
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
    - デフォルトでは、`~/.openclaw/openclaw.json` で `gateway.mode=local` が設定されていない限り、Gateway は起動を拒否します。アドホック/開発用の実行には `--allow-unconfigured` を使用します。
    - `openclaw onboard --mode local` と `openclaw setup` は `gateway.mode=local` を書き込む想定です。ファイルが存在するのに `gateway.mode` がない場合は、local モードを暗黙に仮定するのではなく、壊れたか上書きされた設定として扱い、修復してください。
    - ファイルが存在し、`gateway.mode` がない場合、Gateway はそれを疑わしい設定破損として扱い、代わりに「local を推測する」ことを拒否します。
    - 認証なしでループバックを超えてバインドすることはブロックされます（安全ガードレール）。
    - `SIGUSR1` は、許可されている場合にプロセス内再起動をトリガーします（`commands.restart` はデフォルトで有効です。手動再起動をブロックするには `commands.restart: false` を設定しますが、gateway ツール/設定の apply/update は引き続き許可されます）。
    - `SIGINT`/`SIGTERM` ハンドラーは gateway プロセスを停止しますが、カスタム端末状態は復元しません。CLI を TUI または raw-mode 入力でラップする場合は、終了前に端末を復元してください。

  </Accordion>
</AccordionGroup>

### オプション

<ParamField path="--port <port>" type="number">
  WebSocket ポート（デフォルトは設定/env から取得され、通常は `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  リスナーバインドモード。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  認証モードのオーバーライド。
</ParamField>
<ParamField path="--token <token>" type="string">
  トークンのオーバーライド（プロセスに `OPENCLAW_GATEWAY_TOKEN` も設定します）。
</ParamField>
<ParamField path="--password <password>" type="string">
  パスワードのオーバーライド。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  ファイルから gateway パスワードを読み取ります。
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway を Tailscale 経由で公開します。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  シャットダウン時に Tailscale serve/funnel 設定をリセットします。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  設定内に `gateway.mode=local` がなくても gateway の起動を許可します。アドホック/開発用ブートストラップのために起動ガードをバイパスするだけで、設定ファイルの書き込みや修復は行いません。
</ParamField>
<ParamField path="--dev" type="boolean">
  見つからない場合は開発用設定 + ワークスペースを作成します（BOOTSTRAP.md をスキップします）。
</ParamField>
<ParamField path="--reset" type="boolean">
  開発用設定 + 認証情報 + セッション + ワークスペースをリセットします（`--dev` が必要）。
</ParamField>
<ParamField path="--force" type="boolean">
  起動前に、選択したポート上の既存リスナーを強制終了します。
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
  生のモデルストリームイベントを jsonl にログ記録します。
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  生ストリーム jsonl パス。
</ParamField>

## Gateway を再起動する

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` は、再起動前に実行中の Gateway へアクティブな OpenClaw 作業のプリフライトを依頼します。キューに入った操作、返信配信、埋め込み実行、またはタスク実行がアクティブな場合、Gateway はブロッカーを報告し、重複する安全な再起動リクエストを統合し、アクティブな作業が流れ切った後に再起動します。プレーンな `restart` は、互換性のため既存のサービスマネージャー動作を維持します。即時オーバーライドパスを明示的に使いたい場合にのみ `--force` を使用してください。

<Warning>
インラインの `--password` はローカルのプロセス一覧に露出する可能性があります。`--password-file`、env、または SecretRef で裏付けられた `gateway.auth.password` を優先してください。
</Warning>

### 起動プロファイリング

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を設定すると、Gateway 起動時のフェーズタイミングをログ記録します。フェーズごとの `eventLoopMax` 遅延と、installed-index、manifest registry、startup planning、owner-map 作業の Plugin ルックアップテーブルタイミングを含みます。
- `OPENCLAW_DIAGNOSTICS=timeline` と `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` を設定すると、外部 QA ハーネス向けにベストエフォートの JSONL 起動診断タイムラインを書き込みます。設定内の `diagnostics.flags: ["timeline"]` でもフラグを有効化できますが、パスは引き続き env から提供されます。イベントループサンプルを含めるには `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` を追加します。
- `pnpm test:startup:gateway -- --runs 5 --warmup 1` を実行して Gateway 起動をベンチマークします。このベンチマークは、最初のプロセス出力、`/healthz`、`/readyz`、起動トレースタイミング、イベントループ遅延、Plugin ルックアップテーブルタイミングの詳細を記録します。

## 実行中の Gateway に問い合わせる

すべての問い合わせコマンドは WebSocket RPC を使用します。

<Tabs>
  <Tab title="出力モード">
    - デフォルト: 人間が読める形式（TTY では色付き）。
    - `--json`: 機械可読 JSON（スタイル/スピナーなし）。
    - `--no-color`（または `NO_COLOR=1`）: 人間向けレイアウトを維持したまま ANSI を無効化します。

  </Tab>
  <Tab title="共有オプション">
    - `--url <url>`: Gateway WebSocket URL。
    - `--token <token>`: Gateway トークン。
    - `--password <password>`: Gateway パスワード。
    - `--timeout <ms>`: タイムアウト/予算（コマンドにより異なります）。
    - `--expect-final`: 「final」レスポンスを待ちます（エージェント呼び出し）。

  </Tab>
</Tabs>

<Note>
`--url` を設定すると、CLI は設定または環境認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` エンドポイントは liveness probe です。サーバーが HTTP に応答できるようになると返ります。HTTP `/readyz` エンドポイントはより厳密で、起動時の Plugin サイドカー、チャンネル、または設定済み hooks がまだ安定化中の間は赤のままです。ローカルまたは認証済みの詳細な readiness レスポンスには、イベントループ遅延、イベントループ使用率、CPU コア比率、`degraded` フラグを含む `eventLoop` 診断ブロックが含まれます。

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
  `payload.large` や `diagnostic.memory.pressure` などの診断イベントタイプでフィルターします。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  診断シーケンス番号より後のイベントのみを含めます。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  実行中の Gateway を呼び出す代わりに、永続化された stability bundle を読み取ります。状態ディレクトリ下の最新 bundle には `--bundle latest`（または単に `--bundle`）を使用するか、bundle JSON パスを直接渡します。
</ParamField>
<ParamField path="--export" type="boolean">
  stability 詳細を出力する代わりに、共有可能なサポート診断 zip を書き込みます。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` の出力パス。
</ParamField>

<AccordionGroup>
  <Accordion title="プライバシーと bundle の動作">
    - レコードは運用メタデータを保持します。イベント名、件数、バイトサイズ、メモリ測定値、キュー/セッション状態、チャンネル/Plugin 名、編集済みセッションサマリーなどです。チャットテキスト、webhook 本文、ツール出力、生のリクエストまたはレスポンス本文、トークン、Cookie、秘密値、ホスト名、生のセッション ID は保持しません。レコーダー全体を無効にするには `diagnostics.enabled: false` を設定します。
    - 致命的な Gateway 終了、シャットダウンタイムアウト、再起動時の起動失敗では、レコーダーにイベントがある場合、OpenClaw は同じ診断スナップショットを `~/.openclaw/logs/stability/openclaw-stability-*.json` に書き込みます。最新 bundle は `openclaw gateway stability --bundle latest` で調査します。`--limit`、`--type`、`--since-seq` も bundle 出力に適用されます。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

バグ報告に添付することを目的としたローカル診断 zip を書き込みます。プライバシーモデルと bundle の内容については、[診断エクスポート](/ja-JP/gateway/diagnostics) を参照してください。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  出力 zip パス。デフォルトでは状態ディレクトリ下のサポートエクスポートです。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  含めるサニタイズ済みログ行の最大数。
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  調査するログバイトの最大数。
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

エクスポートには、manifest、Markdown サマリー、設定の形状、サニタイズ済み設定詳細、サニタイズ済みログサマリー、サニタイズ済み Gateway status/health スナップショット、存在する場合は最新の stability bundle が含まれます。

共有されることを想定しています。デバッグに役立つ運用詳細を保持します。たとえば、安全な OpenClaw ログフィールド、サブシステム名、ステータスコード、期間、設定済みモード、ポート、Plugin ID、provider ID、非秘密の機能設定、編集済み運用ログメッセージなどです。チャットテキスト、webhook 本文、ツール出力、認証情報、Cookie、アカウント/メッセージ識別子、プロンプト/指示テキスト、ホスト名、秘密値は省略または編集されます。LogTape 形式のメッセージがユーザー/チャット/ツールのペイロードテキストのように見える場合、エクスポートはメッセージが省略されたこととそのバイト数のみを保持します。

### `gateway status`

`gateway status` は、Gateway サービス（launchd/systemd/schtasks）に加えて、接続性/認証機能の任意の probe を表示します。

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
  接続プローブをスキップします（サービスのみの表示）。
</ParamField>
<ParamField path="--deep" type="boolean">
  システムレベルのサービスもスキャンします。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  デフォルトの接続プローブを読み取りプローブにアップグレードし、その読み取りプローブが失敗した場合はゼロ以外で終了します。`--no-probe` と組み合わせることはできません。
</ParamField>

<AccordionGroup>
  <Accordion title="ステータスの意味">
    - ローカル CLI 設定が存在しない、または無効な場合でも、`gateway status` は診断用に引き続き利用できます。
    - デフォルトの `gateway status` は、サービス状態、WebSocket 接続、ハンドシェイク時に見える認証機能を証明します。読み取り/書き込み/管理操作は証明しません。
    - 診断プローブは初回デバイス認証に対して非変更です。既存のキャッシュ済みデバイストークンがある場合は再利用しますが、ステータス確認だけのために新しい CLI デバイス ID や読み取り専用デバイスペアリングレコードを作成しません。
    - `gateway status` は、可能な場合にプローブ認証用として設定済み認証 SecretRefs を解決します。
    - このコマンドパスで必須の認証 SecretRef が未解決の場合、プローブの接続/認証が失敗すると `gateway status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
    - プローブが成功した場合、未解決の認証参照警告は誤検知を避けるため抑制されます。
    - リスニング中のサービスだけでは不十分で、読み取りスコープの RPC 呼び出しも正常である必要があるスクリプトや自動化では、`--require-rpc` を使用してください。
    - `--deep` は追加の launchd/systemd/schtasks インストールをベストエフォートでスキャンします。複数の Gateway らしきサービスが検出されると、人間向け出力はクリーンアップのヒントを表示し、ほとんどのセットアップではマシンごとに 1 つの Gateway を実行すべきだと警告します。
    - 人間向け出力には、解決済みのファイルログパスに加えて、プロファイルや状態ディレクトリのずれを診断しやすくするための CLI 対サービスの設定パス/妥当性スナップショットが含まれます。

  </Accordion>
  <Accordion title="Linux systemd の認証ずれチェック">
    - Linux systemd インストールでは、サービス認証のずれチェックはユニットから `Environment=` と `EnvironmentFile=` の両方の値を読み取ります（`%h`、引用符付きパス、複数ファイル、任意指定の `-` ファイルを含む）。
    - ずれチェックは、マージされたランタイム環境（サービスコマンド環境が先、次にプロセス環境フォールバック）を使用して `gateway.auth.token` SecretRefs を解決します。
    - トークン認証が実質的に有効でない場合（明示的な `gateway.auth.mode` が `password`/`none`/`trusted-proxy`、または mode が未設定でパスワードが優先される可能性があり、勝てるトークン候補がない場合）、トークンずれチェックは設定トークンの解決をスキップします。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` は「すべてをデバッグする」コマンドです。常に次をプローブします。

- 設定済みのリモート Gateway（設定されている場合）と
- localhost（ループバック）。**リモートが設定されている場合でも**対象です。

`--url` を渡すと、その明示的な対象が両方の前に追加されます。人間向け出力では対象に次のラベルが付きます。

- `URL (explicit)`
- `Remote (configured)` または `Remote (configured, inactive)`
- `Local loopback`

<Note>
複数の Gateway に到達できる場合、それらをすべて表示します。分離されたプロファイル/ポート（例: レスキューボット）を使用する場合、複数 Gateway はサポートされますが、ほとんどのインストールでは引き続き単一の Gateway を実行します。
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
    - `Read probe: limited - missing scope: operator.read` は、接続は成功したが読み取りスコープ RPC が制限されていることを意味します。これは完全な失敗ではなく、**低下した**到達可能性として報告されます。
    - `Connect: ok` の後の `Read probe: failed` は、Gateway が WebSocket 接続を受け入れたものの、後続の読み取り診断がタイムアウトまたは失敗したことを意味します。これも到達不能な Gateway ではなく、**低下した**到達可能性です。
    - `gateway status` と同様に、probe は既存のキャッシュ済みデバイス認証を再利用しますが、初回デバイス ID やペアリング状態は作成しません。
    - 終了コードがゼロ以外になるのは、プローブされた対象に 1 つも到達できない場合だけです。

  </Accordion>
  <Accordion title="JSON 出力">
    トップレベル:

    - `ok`: 少なくとも 1 つの対象に到達できます。
    - `degraded`: 少なくとも 1 つの対象が接続を受け入れたものの、完全な詳細 RPC 診断を完了しませんでした。
    - `capability`: 到達可能な対象全体で確認された最良の機能（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope`、または `unknown`）。
    - `primaryTargetId`: アクティブな勝者として扱う最良の対象。順序は、明示的 URL、SSH トンネル、設定済みリモート、local loopback です。
    - `warnings[]`: `code`、`message`、任意の `targetIds` を含むベストエフォートの警告レコード。
    - `network`: 現在の設定とホストネットワークから派生した local loopback/tailnet URL ヒント。
    - `discovery.timeoutMs` と `discovery.count`: このプローブ実行で使用された実際の検出予算/結果数。

    対象ごと（`targets[].connect`）:

    - `ok`: 接続 + 低下分類後の到達可能性。
    - `rpcOk`: 完全な詳細 RPC の成功。
    - `scopeLimited`: 必要な operator スコープが不足したため詳細 RPC が失敗しました。

    対象ごと（`targets[].auth`）:

    - `role`: 利用可能な場合、`hello-ok` で報告された認証ロール。
    - `scopes`: 利用可能な場合、`hello-ok` で報告された付与スコープ。
    - `capability`: その対象について表面化された認証機能分類。

  </Accordion>
  <Accordion title="一般的な警告コード">
    - `ssh_tunnel_failed`: SSH トンネルのセットアップに失敗しました。コマンドは直接プローブにフォールバックしました。
    - `multiple_gateways`: 複数の対象に到達できました。レスキューボットのように分離されたプロファイルを意図的に実行している場合を除き、これは通常とは異なります。
    - `auth_secretref_unresolved`: 失敗した対象に対して、設定済み認証 SecretRef を解決できませんでした。
    - `probe_scope_limited`: WebSocket 接続は成功しましたが、読み取りプローブは `operator.read` の不足により制限されました。

  </Accordion>
</AccordionGroup>

#### SSH 経由のリモート（Mac アプリ同等）

macOS アプリの「Remote over SSH」モードはローカルポートフォワードを使用するため、リモート Gateway（ループバックのみにバインドされている場合があります）が `ws://127.0.0.1:<port>` で到達可能になります。

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
  解決済み検出エンドポイント（`local.` に設定済みワイドエリアドメインを加えたもの、存在する場合）から、最初に検出された Gateway ホストを SSH 対象として選択します。TXT のみのヒントは無視されます。
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

### ラッパーを使用してインストールする

管理対象サービスを別の実行ファイル経由で起動する必要がある場合は、`--wrapper` を使用します。たとえば、シークレットマネージャーのシムや実行ユーザーヘルパーです。ラッパーは通常の Gateway 引数を受け取り、最終的にそれらの引数で `openclaw` または Node を exec する責任があります。

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

環境経由でラッパーを設定することもできます。`gateway install` はパスが実行可能ファイルであることを検証し、ラッパーをサービスの `ProgramArguments` に書き込み、後の強制再インストール、更新、doctor 修復のためにサービス環境へ `OPENCLAW_WRAPPER` を永続化します。

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
    - `gateway status`: `--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
    - `gateway install`: `--port`、`--runtime <node|bun>`、`--token`、`--wrapper <path>`、`--force`、`--json`
    - `gateway restart`: `--force`、`--wait <duration>`、`--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="ライフサイクルの動作">
    - 管理対象サービスを再起動するには `gateway restart` を使用します。再起動の代替として `gateway stop` と `gateway start` を連鎖させないでください。macOS では、`gateway stop` は停止前に LaunchAgent を意図的に無効化します。
    - `gateway restart --wait 30s` は、その再起動について設定済みの再起動ドレイン予算を上書きします。単位なしの数値はミリ秒です。`s`、`m`、`h` などの単位を使用できます。`--wait 0` は無期限に待機します。
    - `gateway restart --force` はアクティブ作業のドレインをスキップし、すぐに再起動します。operator が一覧表示されたタスクブロッカーをすでに確認し、Gateway を今すぐ戻したい場合に使用します。
    - ライフサイクルコマンドはスクリプト用に `--json` を受け入れます。

  </Accordion>
  <Accordion title="インストール時の認証と SecretRefs">
    - トークン認証がトークンを必要とし、`gateway.auth.token` が SecretRef 管理の場合、`gateway install` は SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータには永続化しません。
    - トークン認証がトークンを必要とし、設定済みトークン SecretRef が未解決の場合、フォールバックの平文を永続化するのではなく、インストールは閉じた状態で失敗します。
    - `gateway run` のパスワード認証では、インラインの `--password` より `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef で裏付けられた `gateway.auth.password` を優先してください。
    - 推論された認証モードでは、シェルのみの `OPENCLAW_GATEWAY_PASSWORD` はインストール時のトークン要件を緩和しません。管理対象サービスをインストールする場合は、永続的な設定（`gateway.auth.password` または設定 `env`）を使用してください。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、mode が明示的に設定されるまでインストールはブロックされます。

  </Accordion>
</AccordionGroup>

## Gateway を検出する（Bonjour）

`gateway discover` は Gateway ビーコン（`_openclaw-gw._tcp`）をスキャンします。

- マルチキャスト DNS-SD: `local.`
- ユニキャスト DNS-SD (Wide-Area Bonjour): ドメインを選択し (例: `openclaw.internal.`)、スプリット DNS + DNS サーバーを設定します。詳しくは [Bonjour](/ja-JP/gateway/bonjour) を参照してください。

Bonjour 検出が有効 (デフォルト) な Gateway のみがビーコンをアドバタイズします。

Wide-Area 検出レコードには次が含まれます (TXT):

- `role` (Gateway ロールのヒント)
- `transport` (トランスポートのヒント、例: `gateway`)
- `gatewayPort` (WebSocket ポート、通常は `18789`)
- `sshPort` (任意。存在しない場合、クライアントは SSH ターゲットのデフォルトを `22` にします)
- `tailnetDns` (MagicDNS ホスト名、利用可能な場合)
- `gatewayTls` / `gatewayTlsSha256` (TLS 有効 + 証明書フィンガープリント)
- `cliPath` (Wide-Area ゾーンに書き込まれるリモートインストールのヒント)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  コマンドごとのタイムアウト (ブラウズ/解決)。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読の出力 (スタイルやスピナーも無効化します)。
</ParamField>

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI は `local.` に加えて、有効化されている場合は設定済みの Wide-Area ドメインをスキャンします。
- JSON 出力の `wsUrl` は、`lanHost` や `tailnetDns` などの TXT のみのヒントではなく、解決されたサービスエンドポイントから導出されます。
- `local.` mDNS では、`sshPort` と `cliPath` は `discovery.mdns.mode` が `full` の場合にのみブロードキャストされます。Wide-Area DNS-SD では引き続き `cliPath` が書き込まれます。そこでも `sshPort` は任意のままです。

</Note>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
