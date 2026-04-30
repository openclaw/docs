---
read_when:
    - CLI から Gateway を実行する（開発環境またはサーバー）
    - Gateway 認証、バインドモード、接続性のデバッグ
    - Bonjour による Gateway の検出（ローカル + ワイドエリア DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gatewayを実行、照会、検出する
title: Gateway
x-i18n:
    generated_at: "2026-04-30T05:04:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe53f1ec289bf463766634a9b03bc234e109fdddf35b3fa3958fb8c5255c81a9
    source_path: cli/gateway.md
    workflow: 16
---

Gateway は OpenClaw の WebSocket サーバー（チャンネル、ノード、セッション、フック）です。このページのサブコマンドは `openclaw gateway …` 配下にあります。

<CardGroup cols={3}>
  <Card title="Bonjour 検出" href="/ja-JP/gateway/bonjour">
    ローカル mDNS + 広域 DNS-SD のセットアップ。
  </Card>
  <Card title="検出の概要" href="/ja-JP/gateway/discovery">
    OpenClaw が Gateway をアドバタイズし、検出する方法。
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
    - デフォルトでは、Gateway は `~/.openclaw/openclaw.json` で `gateway.mode=local` が設定されていない限り起動を拒否します。アドホック/開発用の実行には `--allow-unconfigured` を使用します。
    - `openclaw onboard --mode local` と `openclaw setup` は `gateway.mode=local` を書き込む想定です。ファイルが存在するのに `gateway.mode` がない場合は、ローカルモードを暗黙に想定せず、壊れているか上書きで破損した設定として扱い、修復してください。
    - ファイルが存在し `gateway.mode` がない場合、Gateway はそれを疑わしい設定破損として扱い、ユーザーの代わりに「local だと推測」することを拒否します。
    - 認証なしでループバックを超えてバインドすることはブロックされます（安全のためのガードレール）。
    - `SIGUSR1` は、許可されている場合にプロセス内再起動をトリガーします（`commands.restart` はデフォルトで有効です。手動再起動をブロックするには `commands.restart: false` を設定します。ただし、Gateway ツール/設定の適用/更新は引き続き許可されます）。
    - `SIGINT`/`SIGTERM` ハンドラーは Gateway プロセスを停止しますが、カスタム端末状態は復元しません。CLI を TUI や raw モード入力でラップしている場合は、終了前に端末を復元してください。

  </Accordion>
</AccordionGroup>

### オプション

<ParamField path="--port <port>" type="number">
  WebSocket ポート（デフォルトは設定または環境変数から取得されます。通常は `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  リスナーのバインドモード。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  認証モードのオーバーライド。
</ParamField>
<ParamField path="--token <token>" type="string">
  トークンのオーバーライド（プロセスに対して `OPENCLAW_GATEWAY_TOKEN` も設定します）。
</ParamField>
<ParamField path="--password <password>" type="string">
  パスワードのオーバーライド。
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
  設定に `gateway.mode=local` がなくても Gateway の起動を許可します。アドホック/開発ブートストラップ専用に起動ガードをバイパスします。設定ファイルの書き込みや修復は行いません。
</ParamField>
<ParamField path="--dev" type="boolean">
  見つからない場合に開発用設定 + ワークスペースを作成します（BOOTSTRAP.md はスキップします）。
</ParamField>
<ParamField path="--reset" type="boolean">
  開発用設定 + 認証情報 + セッション + ワークスペースをリセットします（`--dev` が必要）。
</ParamField>
<ParamField path="--force" type="boolean">
  起動前に、選択したポート上の既存リスナーをすべて強制終了します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  詳細ログ。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  コンソールには CLI バックエンドログのみを表示します（stdout/stderr も有効にします）。
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  WebSocket ログのスタイル。
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
インラインの `--password` はローカルのプロセス一覧に露出する可能性があります。`--password-file`、環境変数、または SecretRef ベースの `gateway.auth.password` を推奨します。
</Warning>

### 起動プロファイリング

- Gateway 起動中のフェーズタイミングをログ出力するには `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を設定します。これにはフェーズごとの `eventLoopMax` 遅延と、インストール済みインデックス、マニフェストレジストリ、起動計画、owner-map 処理の Plugin ルックアップテーブルタイミングが含まれます。
- 外部 QA ハーネス向けにベストエフォートの JSONL 起動診断タイムラインを書き込むには、`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` とともに `OPENCLAW_DIAGNOSTICS=timeline` を設定します。設定内の `diagnostics.flags: ["timeline"]` でもフラグを有効にできますが、パスは引き続き環境変数で指定します。イベントループサンプルを含めるには `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` を追加します。
- Gateway 起動のベンチマークを行うには `pnpm test:startup:gateway -- --runs 5 --warmup 1` を実行します。このベンチマークは、最初のプロセス出力、`/healthz`、`/readyz`、起動トレースのタイミング、イベントループ遅延、Plugin ルックアップテーブルのタイミング詳細を記録します。

## 実行中の Gateway を照会する

すべての照会コマンドは WebSocket RPC を使用します。

<Tabs>
  <Tab title="出力モード">
    - デフォルト: 人間が読める形式（TTY では色付き）。
    - `--json`: 機械可読 JSON（スタイル/スピナーなし）。
    - `--no-color`（または `NO_COLOR=1`）: 人間向けレイアウトを維持したまま ANSI を無効にします。

  </Tab>
  <Tab title="共通オプション">
    - `--url <url>`: Gateway WebSocket URL。
    - `--token <token>`: Gateway トークン。
    - `--password <password>`: Gateway パスワード。
    - `--timeout <ms>`: タイムアウト/予算（コマンドにより異なります）。
    - `--expect-final`: "final" 応答を待ちます（エージェント呼び出し）。

  </Tab>
</Tabs>

<Note>
`--url` を設定すると、CLI は設定や環境の認証情報へフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` エンドポイントはライブネスプローブです。サーバーが HTTP に応答できるようになると返ります。HTTP `/readyz` エンドポイントはより厳格で、起動サイドカー、チャンネル、または設定済みフックがまだ安定していない間は赤のままです。ローカルまたは認証済みの詳細 readiness 応答には、イベントループ遅延、イベントループ使用率、CPU コア比率、`degraded` フラグを含む `eventLoop` 診断ブロックが含まれます。

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
  `payload.large` や `diagnostic.memory.pressure` などの診断イベントタイプでフィルタリングします。
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
    - レコードは運用メタデータ（イベント名、カウント、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャンネル/Plugin 名、秘匿化済みセッションサマリー）を保持します。チャットテキスト、Webhook ボディ、ツール出力、生のリクエストまたはレスポンスボディ、トークン、Cookie、シークレット値、ホスト名、生のセッション ID は保持しません。レコーダーを完全に無効にするには `diagnostics.enabled: false` を設定します。
    - 致命的な Gateway 終了、シャットダウンタイムアウト、再起動時の起動失敗では、レコーダーにイベントがある場合、OpenClaw は同じ診断スナップショットを `~/.openclaw/logs/stability/openclaw-stability-*.json` に書き込みます。最新のバンドルは `openclaw gateway stability --bundle latest` で確認します。`--limit`、`--type`、`--since-seq` はバンドル出力にも適用されます。

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
  出力 zip パス。デフォルトは状態ディレクトリ配下のサポートエクスポートです。
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

エクスポートには、マニフェスト、Markdown サマリー、設定構造、サニタイズ済み設定詳細、サニタイズ済みログサマリー、サニタイズ済み Gateway ステータス/ヘルススナップショット、および存在する場合は最新の安定性バンドルが含まれます。

共有を前提としています。デバッグに役立つ運用詳細（安全な OpenClaw ログフィールド、サブシステム名、ステータスコード、所要時間、設定済みモード、ポート、Plugin ID、プロバイダー ID、非シークレットの機能設定、秘匿化済み運用ログメッセージなど）を保持します。チャットテキスト、Webhook ボディ、ツール出力、認証情報、Cookie、アカウント/メッセージ識別子、プロンプト/指示テキスト、ホスト名、シークレット値は省略または秘匿化されます。LogTape 形式のメッセージがユーザー/チャット/ツールのペイロードテキストのように見える場合、エクスポートはメッセージが省略されたこととそのバイト数だけを保持します。

### `gateway status`

`gateway status` は Gateway サービス（launchd/systemd/schtasks）に加えて、任意で接続性/認証機能のプローブを表示します。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  明示的なプローブ対象を追加します。設定済みリモート + localhost も引き続きプローブされます。
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
  デフォルトの接続性プローブを読み取りプローブに引き上げ、その読み取りプローブが失敗した場合は非ゼロで終了します。`--no-probe` とは併用できません。
</ParamField>

<AccordionGroup>
  <Accordion title="ステータスの意味">
    - `gateway status` は、ローカル CLI 設定が欠落している場合や無効な場合でも、診断のために引き続き利用できます。
    - 既定の `gateway status` は、サービス状態、WebSocket 接続、ハンドシェイク時に見える認証 capability を証明します。読み取り/書き込み/管理操作は証明しません。
    - 診断プローブは、初回デバイス認証に対して非変更です。既存のキャッシュ済みデバイストークンがある場合はそれを再利用しますが、ステータス確認のためだけに新しい CLI デバイス identity や読み取り専用デバイスの pairing レコードは作成しません。
    - `gateway status` は、可能な場合、プローブ認証用に設定済みの認証 SecretRefs を解決します。
    - このコマンドパスで必須の認証 SecretRef が未解決の場合、プローブの接続性/認証が失敗すると `gateway status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先に secret source を解決してください。
    - プローブが成功した場合、誤検知を避けるため未解決の auth-ref 警告は抑制されます。
    - 待ち受け中のサービスだけでは不十分で、read-scope RPC 呼び出しも正常である必要があるスクリプトや自動化では、`--require-rpc` を使用します。
    - `--deep` は、追加の launchd/systemd/schtasks インストールをベストエフォートでスキャンします。複数の gateway らしいサービスが検出された場合、人間向け出力はクリーンアップのヒントを表示し、ほとんどのセットアップでは 1 台のマシンにつき 1 つの gateway を実行すべきだと警告します。
    - 人間向け出力には、プロファイルや state-dir のずれを診断しやすくするため、解決済みのファイルログパスに加えて、CLI とサービスの設定パス/妥当性のスナップショットが含まれます。

  </Accordion>
  <Accordion title="Linux systemd 認証ドリフトチェック">
    - Linux systemd インストールでは、サービス認証ドリフトチェックが unit から `Environment=` と `EnvironmentFile=` の両方の値を読み取ります（`%h`、引用符付きパス、複数ファイル、任意の `-` ファイルを含む）。
    - ドリフトチェックは、マージされたランタイム env（まずサービスコマンド env、次に process env fallback）を使って `gateway.auth.token` SecretRefs を解決します。
    - トークン認証が実質的に有効でない場合（明示的な `gateway.auth.mode` が `password`/`none`/`trusted-proxy`、または mode が未設定で password が優先され、token candidate が優先されない場合）、token-drift チェックは config token の解決をスキップします。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` は「すべてをデバッグする」コマンドです。常に次をプローブします。

- 設定済みのリモート Gateway（設定されている場合）と、
- リモートが設定されていても localhost（loopback）。

`--url` を渡すと、その明示的なターゲットが両方より前に追加されます。人間向け出力では、ターゲットは次のようにラベル付けされます。

- `URL (explicit)`
- `Remote (configured)` または `Remote (configured, inactive)`
- `Local loopback`

<Note>
複数の Gateway に到達できる場合は、それらすべてが表示されます。rescue bot などで分離されたプロファイル/ポートを使う場合は複数の Gateway がサポートされますが、ほとんどのインストールでは引き続き単一の Gateway を実行します。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="解釈">
    - `Reachable: yes` は、少なくとも 1 つのターゲットが WebSocket 接続を受け入れたことを意味します。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` は、プローブが認証について証明できた内容を報告します。到達可能性とは別です。
    - `Read probe: ok` は、read-scope の詳細 RPC 呼び出し（`health`/`status`/`system-presence`/`config.get`）も成功したことを意味します。
    - `Read probe: limited - missing scope: operator.read` は、接続は成功したが read-scope RPC が制限されていることを意味します。これは完全な失敗ではなく、到達可能性の **degraded** として報告されます。
    - `Connect: ok` の後の `Read probe: failed` は、Gateway が WebSocket 接続を受け入れたものの、後続の読み取り診断がタイムアウトしたか失敗したことを意味します。これも到達不能な Gateway ではなく、到達可能性の **degraded** です。
    - `gateway status` と同様に、probe は既存のキャッシュ済みデバイス認証を再利用しますが、初回のデバイス identity や pairing state は作成しません。
    - 終了コードがゼロ以外になるのは、プローブされたターゲットに 1 つも到達できない場合のみです。

  </Accordion>
  <Accordion title="JSON 出力">
    最上位:

    - `ok`: 少なくとも 1 つのターゲットに到達できます。
    - `degraded`: 少なくとも 1 つのターゲットが接続を受け入れましたが、完全な詳細 RPC 診断を完了しませんでした。
    - `capability`: 到達可能なターゲット全体で確認された最良の capability（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope`、または `unknown`）。
    - `primaryTargetId`: アクティブな勝者として扱う最良のターゲット。順序は、明示的な URL、SSH tunnel、設定済みリモート、local loopback です。
    - `warnings[]`: `code`、`message`、任意の `targetIds` を含むベストエフォートの警告レコード。
    - `network`: 現在の設定と host networking から派生した local loopback/tailnet URL のヒント。
    - `discovery.timeoutMs` と `discovery.count`: このプローブ実行で使われた実際の discovery budget/result count。

    ターゲットごと（`targets[].connect`）:

    - `ok`: connect + degraded classification 後の到達可能性。
    - `rpcOk`: 完全な詳細 RPC の成功。
    - `scopeLimited`: operator scope の欠落により詳細 RPC が失敗しました。

    ターゲットごと（`targets[].auth`）:

    - `role`: 利用可能な場合、`hello-ok` で報告された認証 role。
    - `scopes`: 利用可能な場合、`hello-ok` で報告された付与済み scopes。
    - `capability`: そのターゲットについて表示される認証 capability classification。

  </Accordion>
  <Accordion title="一般的な警告コード">
    - `ssh_tunnel_failed`: SSH tunnel のセットアップに失敗しました。コマンドは direct probes にフォールバックしました。
    - `multiple_gateways`: 複数のターゲットに到達できました。rescue bot など、分離されたプロファイルを意図的に実行している場合を除き、これは通常ではありません。
    - `auth_secretref_unresolved`: 設定済みの認証 SecretRef を失敗したターゲット向けに解決できませんでした。
    - `probe_scope_limited`: WebSocket 接続は成功しましたが、read probe は `operator.read` の欠落により制限されました。

  </Accordion>
</AccordionGroup>

#### SSH 経由のリモート（Mac アプリとの parity）

macOS アプリの「Remote over SSH」モードは、ローカル port-forward を使うことで、remote gateway（loopback のみに bind されている場合があります）を `ws://127.0.0.1:<port>` で到達可能にします。

CLI での同等操作:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` または `user@host:port`（port の既定値は `22`）。
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  identity file。
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  解決済みの discovery endpoint（`local.` に設定済み wide-area domain があればそれを加えたもの）から、最初に検出された gateway host を SSH target として選択します。TXT-only のヒントは無視されます。
</ParamField>

設定（任意、既定値として使用）:

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低レベル RPC ヘルパー。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  params 用の JSON object string。
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
  Timeout budget。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主に、final payload の前に intermediate events を stream する agent-style RPC 向けです。
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

managed service を別の実行ファイルを通じて起動する必要がある場合、たとえば
secrets manager shim や run-as helper を使う場合は、`--wrapper` を使用します。wrapper は通常の Gateway args を受け取り、
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

wrapper は environment 経由でも設定できます。`gateway install` は path が実行可能ファイルであることを検証し、
wrapper を service `ProgramArguments` に書き込み、後続の forced reinstall、update、doctor
repair のために service environment に `OPENCLAW_WRAPPER` を永続化します。

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

永続化された wrapper を削除するには、再インストール時に `OPENCLAW_WRAPPER` を空にします。

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
  <Accordion title="ライフサイクルの挙動">
    - managed service を再起動するには `gateway restart` を使用します。再起動の代替として `gateway stop` と `gateway start` を連結しないでください。macOS では、`gateway stop` は停止前に LaunchAgent を意図的に無効化します。
    - ライフサイクルコマンドはスクリプト用に `--json` を受け付けます。

  </Accordion>
  <Accordion title="インストール時の認証と SecretRefs">
    - token auth が token を必要とし、`gateway.auth.token` が SecretRef 管理の場合、`gateway install` は SecretRef が解決可能であることを検証しますが、解決済み token を service environment metadata に永続化しません。
    - token auth が token を必要とし、設定済み token SecretRef が未解決の場合、fallback plaintext を永続化するのではなく、install は fail closed します。
    - `gateway run` での password auth では、inline `--password` よりも `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef-backed の `gateway.auth.password` を優先してください。
    - inferred auth mode では、shell-only の `OPENCLAW_GATEWAY_PASSWORD` は install token requirements を緩和しません。managed service をインストールする場合は、durable config（`gateway.auth.password` または config `env`）を使用してください。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、mode が明示的に設定されるまで install はブロックされます。

  </Accordion>
</AccordionGroup>

## Gateway を検出する（Bonjour）

`gateway discover` は Gateway beacons（`_openclaw-gw._tcp`）をスキャンします。

- Multicast DNS-SD: `local.`
- Unicast DNS-SD（Wide-Area Bonjour）: domain を選択し（例: `openclaw.internal.`）、split DNS + DNS server をセットアップします。[Bonjour](/ja-JP/gateway/bonjour) を参照してください。

Bonjour discovery が有効な Gateway のみ（既定）beacon を advertise します。

Wide-Area discovery records には次が含まれます（TXT）:

- `role`（gateway role hint）
- `transport`（transport hint、例: `gateway`）
- `gatewayPort`（WebSocket port、通常は `18789`）
- `sshPort`（任意。存在しない場合、clients は SSH targets の既定値を `22` にします）
- `tailnetDns`（利用可能な場合の MagicDNS hostname）
- `gatewayTls` / `gatewayTlsSha256`（TLS enabled + cert fingerprint）
- `cliPath`（wide-area zone に書き込まれる remote-install hint）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  コマンドごとの timeout（browse/resolve）。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な出力（styling/spinner も無効化します）。
</ParamField>

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI は、有効になっている場合、`local.` に加えて構成済みの広域ドメインをスキャンします。
- JSON 出力の `wsUrl` は、`lanHost` や `tailnetDns` などの TXT のみのヒントではなく、解決されたサービスエンドポイントから派生します。
- `local.` mDNS では、`sshPort` と `cliPath` は `discovery.mdns.mode` が `full` の場合にのみブロードキャストされます。広域 DNS-SD でも引き続き `cliPath` は書き込まれます。`sshPort` はそこでも任意のままです。

</Note>

## 関連情報

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
