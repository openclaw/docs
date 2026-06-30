---
read_when:
    - CLI から Gateway を実行する（開発またはサーバー）
    - Gateway 認証、バインドモード、接続性のデバッグ
    - Bonjour による Gateway の検出（ローカル + 広域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway の実行、照会、検出
title: Gateway
x-i18n:
    generated_at: "2026-06-30T13:47:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c33900a9bdc61c1e922e424dbfce139c6591a7a5071ed8263b172e19bdf653b
    source_path: cli/gateway.md
    workflow: 16
---

Gateway は OpenClaw の WebSocket サーバー（チャネル、ノード、セッション、フック）です。このページのサブコマンドは `openclaw gateway …` 配下にあります。

<CardGroup cols={3}>
  <Card title="Bonjour 検出" href="/ja-JP/gateway/bonjour">
    ローカル mDNS + 広域 DNS-SD のセットアップ。
  </Card>
  <Card title="検出の概要" href="/ja-JP/gateway/discovery">
    OpenClaw が Gateway をアドバタイズして検出する仕組み。
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
    - デフォルトでは、`~/.openclaw/openclaw.json` で `gateway.mode=local` が設定されていない限り、Gateway は起動を拒否します。アドホック/開発用の実行には `--allow-unconfigured` を使用します。
    - `openclaw onboard --mode local` と `openclaw setup` は `gateway.mode=local` を書き込む想定です。ファイルは存在するが `gateway.mode` がない場合は、local モードを暗黙に仮定するのではなく、壊れているか上書きされた設定として扱い、修復してください。
    - ファイルが存在し、`gateway.mode` がない場合、Gateway はそれを疑わしい設定破損として扱い、「guess local」を自動では行わず、起動を拒否します。
    - 認証なしで loopback を越えてバインドすることはブロックされます（安全ガードレール）。
    - `lan`、`tailnet`、`custom` は現在、IPv4 のみの BYOH パスで解決されます。
    - IPv6 のみの BYOH は、現在このパスではネイティブにサポートされていません。ホスト自体が IPv6 のみの場合は、IPv4 サイドカーまたはプロキシを使用してください。
    - `SIGUSR1` は、許可されている場合にプロセス内再起動をトリガーします（`commands.restart` はデフォルトで有効です。手動再起動をブロックするには `commands.restart: false` を設定します。この場合も gateway ツール/設定の apply/update は許可されたままです）。
    - `SIGINT`/`SIGTERM` ハンドラーは gateway プロセスを停止しますが、カスタムのターミナル状態は復元しません。TUI や raw-mode 入力で CLI をラップしている場合は、終了前にターミナルを復元してください。

  </Accordion>
</AccordionGroup>

### オプション

<ParamField path="--port <port>" type="number">
  WebSocket ポート（デフォルトは config/env 由来。通常は `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  リスナーのバインドモード。`lan`、`tailnet`、`custom` は現在、IPv4 のみのパスで解決されます。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  認証モードの上書き。
</ParamField>
<ParamField path="--token <token>" type="string">
  トークンの上書き（プロセス用に `OPENCLAW_GATEWAY_TOKEN` も設定します）。
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
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  現在は IPv4 アドレスを想定しています。IPv6 のみの BYOH では、Gateway の前段に IPv4 サイドカーまたはプロキシを配置し、OpenClaw からその IPv4 エンドポイントを指すようにします。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  設定内に `gateway.mode=local` がなくても gateway の起動を許可します。アドホック/開発用ブートストラップのためだけに起動ガードをバイパスします。設定ファイルの書き込みや修復は行いません。
</ParamField>
<ParamField path="--dev" type="boolean">
  不足している場合に開発用設定 + ワークスペースを作成します（BOOTSTRAP.md はスキップ）。
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

## Gateway を再起動する

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` は、実行中の Gateway に対してアクティブな作業を事前確認し、アクティブな作業が排出された後に統合された再起動を 1 回スケジュールするよう依頼します。デフォルトの安全な再起動は、設定された `gateway.reload.deferralTimeoutMs`（デフォルト 5 分）までアクティブな作業を待機します。その予算が期限切れになると再起動は強制されます。強制されない無期限の安全待機にするには、`gateway.reload.deferralTimeoutMs` を `0` に設定します。通常の `restart` は既存のサービスマネージャー動作を維持します。`--force` は即時上書きパスのままです。

`openclaw gateway restart --safe --skip-deferral` は `--safe` と同じ OpenClaw 対応の協調再起動を実行しますが、アクティブ作業の延期ゲートをバイパスするため、ブロッカーが報告されていても Gateway は即座に再起動を発行します。タスク実行の停滞によって延期が固定され、`--safe` だけでは `gateway.reload.deferralTimeoutMs` によって制限される可能性がある場合のオペレーター用脱出口として使用してください。`--skip-deferral` には `--safe` が必要です。

<Warning>
インラインの `--password` はローカルのプロセス一覧に露出する可能性があります。`--password-file`、env、または SecretRef ベースの `gateway.auth.password` を優先してください。
</Warning>

### Gateway プロファイリング

- Gateway 起動中のフェーズごとのタイミングを記録するには `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を設定します。フェーズごとの `eventLoopMax` 遅延と、installed-index、manifest registry、startup planning、owner-map 作業の Plugin ルックアップテーブルのタイミングを含みます。
- 再起動シグナル処理、アクティブ作業の排出、シャットダウンフェーズ、次回起動、ready タイミング、メモリメトリクスについて、再起動範囲の `restart trace:` 行を記録するには `OPENCLAW_GATEWAY_RESTART_TRACE=1` を設定します。
- 外部 QA ハーネス向けにベストエフォートの JSONL 起動診断タイムラインを書き込むには、`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` とともに `OPENCLAW_DIAGNOSTICS=timeline` を設定します。設定内の `diagnostics.flags: ["timeline"]` でもフラグを有効化できます。パスは引き続き env で指定します。イベントループサンプルを含めるには `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` を追加します。
- まず `pnpm build` を実行し、次に `pnpm test:startup:gateway -- --runs 5 --warmup 1` を実行して、ビルド済み CLI エントリに対する Gateway 起動をベンチマークします。このベンチマークは、最初のプロセス出力、`/healthz`、`/readyz`、起動トレースのタイミング、イベントループ遅延、Plugin ルックアップテーブルのタイミング詳細を記録します。
- まず `pnpm build` を実行し、次に `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` を実行して、macOS または Linux 上でビルド済み CLI エントリに対するプロセス内 Gateway 再起動をベンチマークします。再起動ベンチマークは SIGUSR1 を使用し、子プロセスで起動トレースと再起動トレースの両方を有効化し、次の `/healthz`、次の `/readyz`、ダウンタイム、ready タイミング、CPU、RSS、再起動トレースメトリクスを記録します。
- `/healthz` は liveness、`/readyz` は利用可能な readiness として扱ってください。トレース行とベンチマーク出力は所有者の特定用です。1 つのトレーススパンや 1 つのサンプルを完全な性能結論として扱わないでください。

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
    - `--timeout <ms>`: タイムアウト/予算（コマンドにより異なる）。
    - `--expect-final`: 「final」レスポンスを待機します（エージェント呼び出し）。

  </Tab>
</Tabs>

<Note>
`--url` を設定すると、CLI は設定や環境の認証情報へフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

HTTP `/healthz` エンドポイントは liveness プローブです。サーバーが HTTP に応答できるようになると返ります。HTTP `/readyz` エンドポイントはより厳密で、起動時の Plugin サイドカー、チャネル、または設定済みフックがまだ安定化中の場合は red のままです。ローカルまたは認証済みの詳細 readiness レスポンスには、イベントループ遅延、イベントループ使用率、CPU コア比率、`degraded` フラグを含む `eventLoop` 診断ブロックが含まれます。

<ParamField path="--port <port>" type="number">
  このポート上の local loopback Gateway を対象にします。これは health 呼び出しに対して `OPENCLAW_GATEWAY_URL` と `OPENCLAW_GATEWAY_PORT` を上書きします。
</ParamField>

### `gateway usage-cost`

セッションログから usage-cost サマリーを取得します。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  含める日数。
</ParamField>
<ParamField path="--agent <id>" type="string">
  コストサマリーのスコープを、設定済みエージェント ID の 1 つに限定します。
</ParamField>
<ParamField path="--all-agents" type="boolean">
  設定済みのすべてのエージェント全体でコストサマリーを集計します。`--agent` と組み合わせることはできません。
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
  実行中の Gateway を呼び出す代わりに、永続化された stability bundle を読み取ります。状態ディレクトリ配下の最新 bundle には `--bundle latest`（または単に `--bundle`）を使用するか、bundle JSON パスを直接渡します。
</ParamField>
<ParamField path="--export" type="boolean">
  stability の詳細を出力する代わりに、共有可能なサポート診断 zip を書き込みます。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` の出力パス。
</ParamField>

<AccordionGroup>
  <Accordion title="プライバシーと bundle の動作">
    - レコードは運用メタデータを保持します。イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、チャネル/Plugin 名、墨消しされたセッションサマリーです。チャットテキスト、Webhook 本文、ツール出力、生のリクエストまたはレスポンス本文、トークン、Cookie、シークレット値、ホスト名、生のセッション ID は保持しません。recorder 全体を無効化するには `diagnostics.enabled: false` を設定します。
    - 致命的な Gateway 終了、シャットダウンタイムアウト、再起動時の起動失敗では、recorder にイベントがある場合、OpenClaw は同じ診断スナップショットを `~/.openclaw/logs/stability/openclaw-stability-*.json` に書き込みます。最新の bundle は `openclaw gateway stability --bundle latest` で確認してください。`--limit`、`--type`、`--since-seq` も bundle 出力に適用されます。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

バグレポートに添付することを想定したローカル診断 zip を書き込みます。プライバシーモデルと bundle の内容については、[Diagnostics Export](/ja-JP/gateway/diagnostics) を参照してください。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  出力 zip パス。デフォルトでは、状態ディレクトリ配下のサポート用エクスポートになります。
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

エクスポートには、マニフェスト、Markdown サマリー、設定形状、サニタイズ済み設定詳細、サニタイズ済みログサマリー、サニタイズ済み Gateway ステータス/ヘルススナップショット、存在する場合は最新の安定性バンドルが含まれます。

これは共有されることを想定しています。安全な OpenClaw ログフィールド、サブシステム名、ステータスコード、所要時間、設定済みモード、ポート、plugin ID、プロバイダー ID、非機密の機能設定、秘匿化された運用ログメッセージなど、デバッグに役立つ運用上の詳細を保持します。チャット本文、webhook 本文、ツール出力、認証情報、Cookie、アカウント/メッセージ識別子、プロンプト/指示文、ホスト名、シークレット値は省略または秘匿化します。LogTape 形式のメッセージがユーザー/チャット/ツールのペイロードテキストのように見える場合、エクスポートにはメッセージが省略されたことと、そのバイト数だけが保持されます。

### `gateway status`

`gateway status` は Gateway サービス（launchd/systemd/schtasks）に加え、接続性/認証機能の任意のプローブを表示します。

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
  デフォルトの接続性プローブを読み取りプローブに昇格し、その読み取りプローブが失敗した場合は非ゼロで終了します。`--no-probe` と組み合わせることはできません。
</ParamField>

<AccordionGroup>
  <Accordion title="ステータスの意味">
    - `gateway status` は、ローカル CLI 設定が存在しない、または無効な場合でも診断用に利用できます。
    - デフォルトの `gateway status` は、サービス状態、WebSocket 接続、ハンドシェイク時に見える認証機能を証明します。読み取り/書き込み/管理操作は証明しません。
    - 診断プローブは、初回デバイス認証に対して非変更です。既存のキャッシュ済みデバイストークンが存在する場合は再利用しますが、ステータス確認のためだけに新しい CLI デバイス ID や読み取り専用のデバイスペアリングレコードを作成することはありません。
    - `gateway status` は、可能な場合、プローブ認証用に設定済み認証 SecretRef を解決します。
    - このコマンドパスで必須の認証 SecretRef が未解決の場合、プローブの接続性/認証が失敗すると `gateway status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
    - プローブが成功した場合、誤検知を避けるため未解決の auth-ref 警告は抑制されます。
    - プローブが有効な場合、実行中の Gateway が報告するなら JSON 出力に `gateway.version` が含まれます。後続のハンドシェイクプローブがバージョンメタデータを提供できない場合、`--require-rpc` は `status.runtimeVersion` RPC ペイロードにフォールバックできます。
    - リッスン中のサービスだけでは不十分で、読み取りスコープの RPC 呼び出しも正常である必要があるスクリプトや自動化では、`--require-rpc` を使用してください。
    - `--deep` は追加の launchd/systemd/schtasks インストールをベストエフォートでスキャンします。複数の gateway らしきサービスが検出された場合、人間向け出力はクリーンアップのヒントを表示し、ほとんどのセットアップではマシンごとに 1 つの gateway を実行すべきであると警告します。
    - `--deep` は、サービスプロセスが外部スーパーバイザーによる再起動のために正常終了した場合、最近の Gateway スーパーバイザー再起動ハンドオフも報告します。
    - `--deep` は plugin 対応モード（`pluginValidation: "full"`）で設定検証を実行し、設定済み plugin マニフェストの警告（たとえば channel 設定メタデータの欠落）を表示するため、インストールおよび更新のスモークチェックで検出できます。デフォルトの `gateway status` は、plugin 検証をスキップする高速な読み取り専用パスを維持します。
    - 人間向け出力には、解決済みのファイルログパスに加えて、プロファイルや state-dir のずれを診断しやすくするための CLI とサービスの設定パス/有効性スナップショットが含まれます。

  </Accordion>
  <Accordion title="Linux systemd の認証ドリフトチェック">
    - Linux systemd インストールでは、サービス認証ドリフトチェックはユニットから `Environment=` と `EnvironmentFile=` の両方の値（`%h`、引用符付きパス、複数ファイル、任意の `-` ファイルを含む）を読み取ります。
    - ドリフトチェックは、マージされたランタイム環境（まずサービスコマンド環境、次にプロセス環境フォールバック）を使用して `gateway.auth.token` SecretRef を解決します。
    - トークン認証が実質的に有効でない場合（明示的な `gateway.auth.mode` が `password`/`none`/`trusted-proxy`、またはモード未設定でパスワードが優先され、勝てるトークン候補がない場合）、トークンドリフトチェックは設定トークンの解決をスキップします。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` は「すべてをデバッグ」するコマンドです。常に次をプローブします。

- 設定済みのリモート gateway（設定されている場合）、および
- リモートが設定されている場合でも localhost（loopback）。

`--url` を渡すと、その明示的な対象が両方より前に追加されます。人間向け出力では対象に次のラベルが付きます。

- `URL (explicit)`
- `Remote (configured)` または `Remote (configured, inactive)`
- `Local loopback`

<Note>
複数のプローブ対象に到達できる場合、それらすべてが表示されます。SSH トンネル、TLS/proxy URL、設定済みリモート URL は、トランスポートポートが異なっていても同じ gateway を指すことがあります。`multiple_gateways` は、別個または ID が曖昧な到達可能 gateway のために予約されています。分離されたプロファイル（例: レスキューボット）を使用する場合は複数の gateway がサポートされますが、ほとんどのインストールでは単一の gateway を実行します。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  local loopback プローブ対象と SSH トンネルのリモートポートにこのポートを使用します。`--url` がない場合、設定済み Gateway 環境 URL、環境ポート、またはリモート対象ではなく、local loopback 対象を選択します。
</ParamField>

<AccordionGroup>
  <Accordion title="解釈">
    - `Reachable: yes` は、少なくとも 1 つの対象が WebSocket 接続を受け入れたことを意味します。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` は、プローブが認証について証明できた内容を報告します。到達可能性とは別です。
    - `Read probe: ok` は、読み取りスコープの詳細 RPC 呼び出し（`health`/`status`/`system-presence`/`config.get`）も成功したことを意味します。
    - `Read probe: limited - missing scope: operator.read` は、接続は成功したが読み取りスコープ RPC が制限されていることを意味します。これは完全な失敗ではなく、**低下した**到達可能性として報告されます。
    - `Connect: ok` の後の `Read probe: failed` は、Gateway が WebSocket 接続を受け入れたものの、後続の読み取り診断がタイムアウトまたは失敗したことを意味します。これも到達不能な Gateway ではなく、**低下した**到達可能性です。
    - `gateway status` と同様に、probe は既存のキャッシュ済みデバイス認証を再利用しますが、初回デバイス ID やペアリング状態は作成しません。
    - 終了コードが非ゼロになるのは、プローブされた対象に 1 つも到達できない場合だけです。

  </Accordion>
  <Accordion title="JSON 出力">
    トップレベル:

    - `ok`: 少なくとも 1 つの対象に到達可能です。
    - `degraded`: 少なくとも 1 つの対象が接続を受け入れましたが、完全な詳細 RPC 診断を完了しませんでした。
    - `capability`: 到達可能な対象全体で見られた最良の機能（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope`、または `unknown`）。
    - `primaryTargetId`: アクティブな勝者として扱う最良の対象。順序は、明示的 URL、SSH トンネル、設定済みリモート、local loopback です。
    - `warnings[]`: `code`、`message`、任意の `targetIds` を含むベストエフォートの警告レコード。
    - `network`: 現在の設定とホストネットワークから導出された local loopback/tailnet URL ヒント。
    - `discovery.timeoutMs` と `discovery.count`: このプローブパスで使用された実際の検出予算/結果数。

    対象ごと（`targets[].connect`）:

    - `ok`: 接続後の到達可能性 + 低下分類。
    - `rpcOk`: 完全な詳細 RPC の成功。
    - `scopeLimited`: 必要な operator スコープがないため詳細 RPC が失敗しました。

    対象ごと（`targets[].auth`）:

    - `role`: 利用可能な場合、`hello-ok` で報告された認証ロール。
    - `scopes`: 利用可能な場合、`hello-ok` で報告された付与済みスコープ。
    - `capability`: その対象について表示された認証機能分類。

  </Accordion>
  <Accordion title="一般的な警告コード">
    - `ssh_tunnel_failed`: SSH トンネルのセットアップに失敗しました。コマンドは直接プローブにフォールバックしました。
    - `multiple_gateways`: 別個の gateway ID に到達可能だった、または OpenClaw が到達可能な対象が同じ gateway であることを証明できませんでした。同じ gateway への SSH トンネル、proxy URL、または設定済みリモート URL は、この警告を発生させません。
    - `auth_secretref_unresolved`: 失敗した対象について、設定済み認証 SecretRef を解決できませんでした。
    - `probe_scope_limited`: WebSocket 接続は成功しましたが、`operator.read` がないため読み取りプローブが制限されました。

  </Accordion>
</AccordionGroup>

#### SSH 経由のリモート（Mac アプリとの同等性）

macOS アプリの「Remote over SSH」モードはローカルポートフォワードを使用するため、リモート gateway（loopback のみにバインドされている場合があります）は `ws://127.0.0.1:<port>` で到達可能になります。

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
  解決済み検出エンドポイント（`local.` に設定済みの広域ドメインがあればそれを加えたもの）から、最初に検出された gateway ホストを SSH 対象として選択します。TXT のみのヒントは無視されます。
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
`--params` は有効な JSON でなければなりません。
</Note>

## Gateway サービスを管理する

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### ラッパーを使ってインストールする

管理対象サービスを別の実行ファイル経由で起動する必要がある場合は、`--wrapper` を使用します。たとえば、シークレットマネージャーの shim や run-as ヘルパーです。ラッパーは通常の Gateway 引数を受け取り、最終的にそれらの引数で `openclaw` または Node を exec する責任を持ちます。

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

環境経由でラッパーを設定することもできます。`gateway install` はパスが実行可能ファイルであることを検証し、ラッパーをサービスの `ProgramArguments` に書き込み、後続の強制再インストール、更新、doctor 修復のためにサービス環境へ `OPENCLAW_WRAPPER` を永続化します。

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
  <Accordion title="ライフサイクル動作">
    - 管理対象サービスを再起動するには `gateway restart` を使用します。再起動の代替として `gateway stop` と `gateway start` を連結しないでください。
    - macOS では、`gateway stop` はデフォルトで `launchctl bootout` を使用します。これは、無効化を永続化せずに現在の起動セッションから LaunchAgent を削除します。KeepAlive の自動復旧は将来のクラッシュに対して有効なままで、`gateway start` は手動の `launchctl enable` なしでクリーンに再有効化します。Gateway が次の明示的な `gateway start` まで再生成されないように KeepAlive と RunAtLoad を永続的に抑制するには、`--disable` を渡します。手動停止を再起動やシステム再起動後も維持する必要がある場合に使用します。
    - `gateway restart --safe` は、実行中の Gateway にアクティブな作業の事前確認を依頼し、アクティブな作業が排出された後に 1 回にまとめた再起動をスケジュールします。デフォルトの安全な再起動は、設定された `gateway.reload.deferralTimeoutMs`（デフォルト 5 分）までアクティブな作業を待機します。その予算が切れると、再起動は強制されます。強制されない無期限の安全な待機にするには、`gateway.reload.deferralTimeoutMs` を `0` に設定します。`--safe` は `--force` または `--wait` と組み合わせることはできません。
    - `gateway restart --wait 30s` は、その再起動について設定済みの再起動ドレイン予算を上書きします。単位なしの数値はミリ秒です。`s`、`m`、`h` などの単位を使用できます。`--wait 0` は無期限に待機します。
    - `gateway restart --safe --skip-deferral` は、OpenClaw 対応の安全な再起動を実行しますが、延期ゲートをバイパスするため、ブロッカーが報告されていても Gateway はただちに再起動を発行します。停止したタスク実行の延期に対するオペレーター用の退避手段です。`--safe` が必要です。
    - `gateway restart --force` は、アクティブな作業のドレインをスキップしてただちに再起動します。オペレーターが一覧表示されたタスクブロッカーをすでに確認しており、今すぐ Gateway を戻したい場合に使用します。
    - ライフサイクルコマンドはスクリプト用に `--json` を受け付けます。

  </Accordion>
  <Accordion title="インストール時の認証と SecretRefs">
    - トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、`gateway install` は SecretRef が解決可能であることを検証しますが、解決されたトークンをサービス環境メタデータへ永続化しません。
    - トークン認証でトークンが必要で、設定されたトークン SecretRef が未解決の場合、フォールバックの平文を永続化するのではなく、インストールは fail closed します。
    - `gateway run` でのパスワード認証では、インラインの `--password` よりも `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef に裏付けられた `gateway.auth.password` を優先してください。
    - 推論された認証モードでは、シェル限定の `OPENCLAW_GATEWAY_PASSWORD` はインストール時のトークン要件を緩和しません。管理対象サービスをインストールする場合は、永続的な設定（`gateway.auth.password` または config `env`）を使用してください。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定されており、`gateway.auth.mode` が未設定の場合、mode が明示的に設定されるまでインストールはブロックされます。

  </Accordion>
</AccordionGroup>

## Gateway を検出する（Bonjour）

`gateway discover` は Gateway ビーコン（`_openclaw-gw._tcp`）をスキャンします。

- マルチキャスト DNS-SD: `local.`
- ユニキャスト DNS-SD（Wide-Area Bonjour）: ドメイン（例: `openclaw.internal.`）を選択し、split DNS と DNS サーバーを設定します。[Bonjour](/ja-JP/gateway/bonjour) を参照してください。

Bonjour 検出が有効な Gateway（デフォルト）のみがビーコンを広告します。

Wide-area 検出レコードには、これらの TXT ヒントを含めることができます。

- `role`（Gateway ロールのヒント）
- `transport`（トランスポートのヒント、例: `gateway`）
- `gatewayPort`（WebSocket ポート、通常は `18789`）
- `sshPort`（完全検出モードのみ。存在しない場合、クライアントは SSH ターゲットのデフォルトを `22` にします）
- `tailnetDns`（MagicDNS ホスト名、利用可能な場合）
- `gatewayTls` / `gatewayTlsSha256`（TLS 有効化 + 証明書フィンガープリント）
- `cliPath`（完全検出モードのみ）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  コマンドごとのタイムアウト（browse/resolve）。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な出力（スタイルとスピナーも無効化します）。
</ParamField>

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI は `local.` に加えて、設定された wide-area ドメインが有効な場合はそれもスキャンします。
- JSON 出力の `wsUrl` は、`lanHost` や `tailnetDns` などの TXT 限定ヒントではなく、解決されたサービスエンドポイントから導出されます。
- `local.` mDNS と wide-area DNS-SD では、`sshPort` と `cliPath` は `discovery.mdns.mode` が `full` の場合にのみ公開されます。

</Note>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
