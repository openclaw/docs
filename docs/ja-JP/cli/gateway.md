---
read_when:
    - CLI（開発環境またはサーバー）から Gateway を実行する
    - Gateway 認証、バインドモード、接続性のデバッグ
    - Bonjour（ローカル + 広域 DNS-SD）による Gateway の検出
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway を実行、照会、検出する
title: Gateway
x-i18n:
    generated_at: "2026-07-05T11:08:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb1eb4aaba7681699f6048fc9a91b4117e90f20f24c9a696f688f0ac3b39a49e
    source_path: cli/gateway.md
    workflow: 16
---

Gateway は OpenClaw の WebSocket サーバー（チャンネル、ノード、セッション、フック）です。以下のすべてのサブコマンドは `openclaw gateway ...` 配下にあります。

<CardGroup cols={3}>
  <Card title="Bonjour 検出" href="/ja-JP/gateway/bonjour">
    ローカル mDNS + ワイドエリア DNS-SD のセットアップ。
  </Card>
  <Card title="検出の概要" href="/ja-JP/gateway/discovery">
    OpenClaw が Gateway をアドバタイズして見つける仕組み。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration">
    トップレベルの Gateway 設定キー。
  </Card>
</CardGroup>

## Gateway を実行する

```bash
openclaw gateway
openclaw gateway run   # equivalent, explicit form
```

<AccordionGroup>
  <Accordion title="起動時の動作">
    - `~/.openclaw/openclaw.json` で `gateway.mode=local` が設定されていない限り、起動を拒否します。アドホック/開発用の実行には `--allow-unconfigured` を使用してください。これは設定を書き込んだり修復したりせずにガードをバイパスします。
    - `openclaw onboard --mode local` と `openclaw setup` は `gateway.mode=local` を書き込みます。設定ファイルは存在するが `gateway.mode` が欠けている場合、それは破損/上書きされた設定として扱われ、Gateway はユーザーの代わりに `local` を推測することを拒否します。オンボーディングを再実行するか、キーを手動で設定するか、`--allow-unconfigured` を渡してください。
    - 認証なしで loopback を超えてバインドすることはブロックされます。
    - `--bind` の値 `lan`、`tailnet`、`custom` は、現時点では IPv4 のみのパスで解決されます。IPv6 のみの持ち込みホスト構成では、Gateway の前段に IPv4 サイドカーまたはプロキシが必要です。
    - `SIGUSR1` は、許可されている場合にプロセス内再起動をトリガーします。`commands.restart`（デフォルト: 有効）は外部から送信される `SIGUSR1` を制御します。手動の OS シグナルによる再起動をブロックしつつ、`gateway restart` コマンド、gateway ツール、config-apply/update による再起動は引き続き許可するには、これを `false` に設定します。
    - `SIGINT`/`SIGTERM` はプロセスを停止しますが、カスタム端末状態は復元しません。CLI を TUI や raw モード入力でラップしている場合は、終了前に端末を自分で復元してください。

  </Accordion>
</AccordionGroup>

### オプション

<ParamField path="--port <port>" type="number">
  WebSocket ポート（設定/env からのデフォルト。通常は `18789`）。
</ParamField>
<ParamField path="--bind <mode>" type="string">
  バインドモード: `loopback`（デフォルト）、`lan`、`tailnet`、`auto`、`custom`。
</ParamField>
<ParamField path="--token <token>" type="string">
  `connect.params.auth.token` 用の共有トークン。設定されている場合は `OPENCLAW_GATEWAY_TOKEN` がデフォルトです。
</ParamField>
<ParamField path="--auth <mode>" type="string">
  認証モード: `none`、`token`、`password`、`trusted-proxy`。
</ParamField>
<ParamField path="--password <password>" type="string">
  `--auth password` 用のパスワード。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Gateway パスワードをファイルから読み取ります。
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Tailscale 公開: `off`、`serve`、`funnel`。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  シャットダウン時に Tailscale serve/funnel 設定をリセットします。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  `gateway.mode=local` の強制なしで起動します。アドホック/開発用ブートストラップのみ。設定を永続化または修復しません。
</ParamField>
<ParamField path="--dev" type="boolean">
  存在しない場合は開発用設定 + ワークスペースを作成します（`BOOTSTRAP.md` はスキップ）。
</ParamField>
<ParamField path="--reset" type="boolean">
  開発用設定、認証情報、セッション、ワークスペースをリセットします。`--dev` が必要です。
</ParamField>
<ParamField path="--force" type="boolean">
  起動前にターゲットポート上の既存リスナーをすべて終了します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  stdout/stderr への詳細ログ出力。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  コンソールには CLI バックエンドログのみを表示します（stdout/stderr も有効にします）。
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  WebSocket ログスタイル: `auto`、`full`、`compact`。
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` のエイリアス。
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  生のモデルストリームイベントを JSONL にログ出力します。
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  生ストリーム JSONL パス。
</ParamField>

`--claude-cli-logs` は `--cli-backend-logs` の非推奨エイリアスです。

`--bind custom` では、`gateway.customBindHost` を IPv4 アドレスに設定します。そのアドレスが利用できない場合、Gateway は `0.0.0.0` にフォールバックします。IPv6 のみの持ち込みホスト構成では、Gateway の前段に IPv4 サイドカーまたはプロキシが必要です。

## Gateway を再起動する

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` は、実行中の Gateway にアクティブな作業の事前チェックを依頼し、その作業がドレインした後に 1 回にまとめた再起動をスケジュールします。待機は `gateway.reload.deferralTimeoutMs`（デフォルト: 5 分 / `300000`）で上限が設定されます。予算が切れると再起動は強制されます。強制せずに無期限で待つ（まだ保留中であることを定期的に警告する）には、`deferralTimeoutMs: 0` を設定します。`--safe` は `--force` または `--wait` と組み合わせることはできません。

`--skip-deferral` は safe restart のアクティブ作業延期ゲートをバイパスするため、報告されたブロッカーがあっても Gateway はすぐに再起動します。これには `--safe` が必要です。延期が暴走タスクで詰まっている場合に使用します。

`--wait <duration>` は、通常（non-safe）の再起動のドレイン予算を上書きします。単位なしのミリ秒、または単位サフィックス `ms`、`s`、`m`、`h`、`d`（例: `30s`、`5m`、`1h30m`）を受け付けます。`--wait 0` は無期限に待機します。`--force` または `--safe` とは互換性がありません。

`--force` はアクティブ作業のドレインをスキップし、ただちに再起動します。通常の `restart`（フラグなし）は既存のサービスマネージャー再起動動作を維持します。

<Warning>
インラインの `--password` はローカルプロセス一覧で露出する可能性があります。`--password-file`、env、または SecretRef で裏付けられた `gateway.auth.password` を優先してください。
</Warning>

### Gateway プロファイリング

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` は、各フェーズの `eventLoopMax` 遅延と Plugin ルックアップテーブルのタイミング（installed-index、manifest registry、startup planning、owner-map work）を含む起動時のフェーズタイミングをログ出力します。
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` は、再起動スコープの `restart trace:` 行をログ出力します。シグナル処理、アクティブ作業のドレイン、シャットダウンフェーズ、次回起動、ready タイミング、メモリメトリクスが含まれます。
- `OPENCLAW_DIAGNOSTICS=timeline` と `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` は、外部 QA ハーネス向けにベストエフォートの JSONL 起動診断タイムラインを書き込みます（設定 `diagnostics.flags: ["timeline"]` と同等。パスは引き続き env のみです）。イベントループサンプルを含めるには `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` を追加します。
- `pnpm build` の後に `pnpm test:startup:gateway -- --runs 5 --warmup 1` を実行すると、ビルド済み CLI エントリに対して Gateway 起動をベンチマークします。対象は、最初のプロセス出力、`/healthz`、`/readyz`、起動トレースタイミング、イベントループ遅延、Plugin ルックアップテーブルのタイミングです。
- `pnpm build` の後に `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` を実行すると、macOS または Linux 上のプロセス内再起動をベンチマークします（Windows ではサポートされません。再起動には `SIGUSR1` が必要です）。`SIGUSR1` を使用し、子プロセスで両方のトレースを有効にし、次の `/healthz`、次の `/readyz`、ダウンタイム、ready タイミング、CPU、RSS、再起動トレースメトリクスを記録します。
- `/healthz` は liveness、`/readyz` は利用可能な readiness です。トレース行とベンチマーク出力は所有者帰属のシグナルとして扱い、単一のスパンやサンプルからの完全な性能結論として扱わないでください。

## 実行中の Gateway を問い合わせる

すべての問い合わせコマンドは WebSocket RPC を使用します。

<Tabs>
  <Tab title="出力モード">
    - デフォルト: 人間が読みやすい形式（TTY では色付き）。
    - `--json`: 機械可読 JSON（スタイル/スピナーなし）。
    - `--no-color`（または `NO_COLOR=1`）: 人間向けレイアウトを維持しつつ ANSI を無効化します。

  </Tab>
  <Tab title="共有オプション">
    - `--url <url>`: Gateway WebSocket URL。
    - `--token <token>`: Gateway トークン。
    - `--password <password>`: Gateway パスワード。
    - `--timeout <ms>`: タイムアウト/予算（デフォルトはコマンドごとに異なります。下記の各コマンドを参照）。
    - `--expect-final`: 「final」レスポンスを待ちます（エージェント呼び出し）。

  </Tab>
</Tabs>

<Note>
`--url` を設定すると、CLI は設定や環境の認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` は liveness プローブです。サーバーが HTTP に応答できるようになるとすぐに返ります。`/readyz` はより厳格で、起動時の Plugin サイドカー、チャンネル、または設定済みフックがまだ安定していない間は赤のままです。ローカルまたは認証済みの詳細な `/readyz` レスポンスには、`eventLoop` 診断ブロック（遅延、使用率、CPU コア比率、`degraded` フラグ）が含まれます。

<ParamField path="--port <port>" type="number">
  このポート上の local loopback Gateway を対象にします。この呼び出しでは `OPENCLAW_GATEWAY_URL` と `OPENCLAW_GATEWAY_PORT` を上書きします。
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
  サマリーのスコープを、設定済みの 1 つのエージェント ID に限定します。
</ParamField>
<ParamField path="--all-agents" type="boolean">
  設定済みのすべてのエージェントを集計します。`--agent` と組み合わせることはできません。
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
  診断イベントタイプでフィルターします。例: `payload.large` または `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  診断シーケンス番号より後のイベントのみを含めます。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  実行中の Gateway を呼び出す代わりに、永続化された stability bundle を読み取ります。`--bundle latest`（または単独の `--bundle`）は state ディレクトリ配下の最新 bundle を選びます。bundle JSON パスを直接渡すこともできます。
</ParamField>
<ParamField path="--export" type="boolean">
  stability の詳細を出力する代わりに、共有可能なサポート診断 zip を書き込みます。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` の出力パス。
</ParamField>

<AccordionGroup>
  <Accordion title="プライバシーと bundle の動作">
    - レコードは運用メタデータを保持します。イベント名、件数、バイトサイズ、メモリ読み取り値、キュー/セッション状態、承認 ID、チャンネル/Plugin 名、編集済みセッションサマリーが含まれます。チャットテキスト、webhook 本文、ツール出力、生のリクエスト/レスポンス本文、トークン、Cookie、シークレット値、ホスト名、生のセッション ID は除外されます。recorder を完全に無効化するには `diagnostics.enabled: false` を設定します。
    - Gateway の致命的な終了、シャットダウンのタイムアウト、再起動時の起動失敗は、recorder にイベントがある場合、同じ診断スナップショットを `~/.openclaw/logs/stability/openclaw-stability-*.json` に書き込みます。最新の bundle は `openclaw gateway stability --bundle latest` で調べます。`--limit`、`--type`、`--since-seq` は bundle 出力にも適用されます。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

バグ報告用に設計されたローカル診断 zip を書き込みます。プライバシーモデルと bundle の内容については、[Diagnostics Export](/ja-JP/gateway/diagnostics) を参照してください。

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

エクスポートには、バンドルが存在する場合、`manifest.json`（ファイル一覧）、`summary.md`（Markdown サマリー）、`diagnostics.json`（トップレベルの設定/ログ/検出/安定性/ステータス/ヘルスのサマリー）、`config/sanitized.json`、`status/gateway-status.json`、`health/gateway-health.json`、`logs/openclaw-sanitized.jsonl`、`stability/latest.json` が含まれます。

これは共有されることを想定して設計されています。デバッグに有用な運用詳細（安全なログフィールド、サブシステム名、ステータスコード、所要時間、設定済みモード、ポート、plugin/provider ID、秘密ではない機能設定、秘匿化された運用ログメッセージ）は保持し、チャット本文、webhook 本文、ツール出力、認証情報、Cookie、アカウント/メッセージ識別子、プロンプト/指示テキスト、ホスト名、シークレット値は省略または秘匿化します。ログメッセージがユーザー/チャット/ツールのペイロードテキストに見える場合（例: "user said"、"chat text"、"tool output"、"webhook body"）、エクスポートではメッセージが省略された事実とそのバイト数のみを保持します。

### `gateway status`

Gateway サービス（launchd/systemd/schtasks）と、任意の接続性/認証プローブを表示します。

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
  接続性プローブを読み取りプローブに昇格し、失敗した場合はゼロ以外で終了します。`--no-probe` とは併用できません。
</ParamField>

<AccordionGroup>
  <Accordion title="ステータスの意味">
    - ローカル CLI 設定が欠落または無効な場合でも、診断用に引き続き利用できます。
    - デフォルト出力は、サービス状態、WebSocket 接続、ハンドシェイク時点で見える認証機能を証明します。読み取り/書き込み/管理操作を証明するものではありません。
    - プローブは初回デバイス認証に対して非変更です。既存のキャッシュ済みデバイストークンがある場合は再利用しますが、ステータス確認だけのために新しい CLI デバイス ID や読み取り専用ペアリングレコードを作成することはありません。
    - 可能な場合、プローブ認証用に設定済み認証 SecretRef を解決します。必須の SecretRef が未解決の場合、プローブの接続性/認証が失敗すると `--json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、シークレットソースを修正してください。未解決認証の警告は、プローブが成功すると抑制されます。
    - JSON 出力には、実行中の Gateway が報告する場合に `gateway.version` が含まれます。ハンドシェイクプローブがバージョンメタデータを提供できない場合、`--require-rpc` は `status.runtimeVersion` RPC ペイロードにフォールバックできます。
    - リスニング中のサービスだけでは不十分で、読み取りスコープ RPC も正常である必要があるスクリプト/自動化では、`--require-rpc` を使用します。
    - `--deep` は追加の launchd/systemd/schtasks インストールをスキャンします。複数の gateway らしきサービスが見つかった場合、人間向け出力はクリーンアップのヒント（通常はマシンごとに 1 つの gateway を実行）を表示し、関連がある場合は最近のスーパーバイザー再起動の引き継ぎを報告します。
    - `--deep` は plugin 対応モード（`pluginValidation: "full"`）で設定検証も実行し、plugin マニフェスト警告（例: チャンネル設定メタデータの欠落）を表示します。デフォルトの `gateway status` は、plugin 検証をスキップする高速な読み取り専用パスを維持します。
    - 人間向け出力には、プロファイルまたは状態ディレクトリのずれの診断に役立つように、解決済みファイルログパスと CLI 対サービスの設定パス/妥当性が含まれます。

  </Accordion>
  <Accordion title="Linux systemd 認証ドリフトチェック">
    - サービス認証ドリフトチェックは、ユニットから `Environment=` と `EnvironmentFile=` の両方を読み取ります（`%h`、引用符付きパス、複数ファイル、任意の `-` ファイルを含む）。
    - マージされたランタイム環境（最初にサービスコマンド環境、次にプロセス環境へのフォールバック）を使用して、`gateway.auth.token` SecretRef を解決します。
    - トークンドリフトチェックは、トークン認証が実質的に有効でない場合（`gateway.auth.mode` が明示的に `password`/`none`/`trusted-proxy`、またはモード未設定でパスワードが勝ち得てトークン候補が勝ち得ない場合）、設定トークンの解決をスキップします。

  </Accordion>
</AccordionGroup>

### `gateway probe`

「すべてをデバッグする」コマンドです。常に次をプローブします。

- 設定済みのリモート gateway（設定されている場合）、および
- localhost（ループバック）。**リモートが設定されている場合でも**同様です。

`--url` を渡すと、その明示的な対象が両方より前に追加されます。人間向け出力では、対象に `URL (explicit)`、`Remote (configured)` / `Remote (configured, inactive)`、`Local loopback` というラベルが付けられます。

<Note>
複数のプローブ対象に到達可能な場合、すべて出力されます。SSH トンネル、TLS/proxy URL、設定済みリモート URL は、異なるトランスポートポートでも同じ gateway を指すことがあります。`multiple_gateways` は、別個または ID が曖昧な到達可能 gateway のために予約されています。複数の gateway の実行は、分離されたプロファイル（例: レスキューボット）ではサポートされますが、ほとんどのインストールでは単一の gateway を実行します。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  ローカル local loopback プローブ対象と SSH トンネルのリモートポートにこのポートを使用します。`--url` がない場合、これは設定済み gateway 環境 URL、環境ポート、またはリモート対象の代わりに、ローカル local loopback 対象のみを選択します。
</ParamField>

<AccordionGroup>
  <Accordion title="解釈">
    - `Reachable: yes` は、少なくとも 1 つの対象が WebSocket 接続を受け入れたことを意味します。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` は、到達可能性とは別に、プローブが認証について証明できた内容を報告します。
    - `Read probe: ok` は、読み取りスコープの詳細 RPC 呼び出し（`health`/`status`/`system-presence`/`config.get`）も成功したことを意味します。
    - `Read probe: limited - missing scope: operator.read` は、接続は成功したが読み取りスコープ RPC が制限されていることを意味します。完全な失敗ではなく、**劣化**した到達可能性として報告されます。
    - `Connect: ok` の後の `Read probe: failed` は、WebSocket は接続されたものの、後続の読み取り診断がタイムアウトまたは失敗したことを意味します。これも到達不能ではなく**劣化**です。
    - `gateway status` と同様に、probe は既存のキャッシュ済みデバイス認証を再利用しますが、初回デバイス ID やペアリング状態は作成しません。
    - 終了コードがゼロ以外になるのは、プローブされた対象が 1 つも到達可能でない場合のみです。

  </Accordion>
  <Accordion title="JSON 出力">
    トップレベル:

    - `ok`: 少なくとも 1 つの対象に到達可能です。
    - `degraded`: 少なくとも 1 つの対象が接続を受け入れたものの、完全な詳細 RPC 診断を完了しませんでした。
    - `capability`: 到達可能な対象全体で確認された最良の機能（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope`、または `unknown`）。
    - `primaryTargetId`: アクティブな勝者として扱う最良の対象。順序は明示的 URL、SSH トンネル、設定済みリモート、local loopback です。
    - `warnings[]`: `code`、`message`、任意の `targetIds` を持つベストエフォートの警告レコード。
    - `network`: 現在の設定とホストネットワークから導出された local loopback/tailnet URL ヒント。
    - `discovery.timeoutMs` / `discovery.count`: このプローブパスで使用された実際の検出予算/結果数。

    対象ごと（`targets[].connect`）: `ok`（到達可能性 + 劣化分類）、`rpcOk`（完全な詳細 RPC 成功）、`scopeLimited`（operator スコープ欠落により詳細 RPC が失敗）。

    対象ごと（`targets[].auth`）: 利用可能な場合は `hello-ok` で報告された `role` と `scopes`、および表示された `capability` 分類。

  </Accordion>
  <Accordion title="一般的な警告コード">
    - `ssh_tunnel_failed`: SSH トンネルのセットアップに失敗しました。コマンドは直接プローブにフォールバックしました。
    - `multiple_gateways`: 別個の gateway ID に到達可能だった、または OpenClaw が到達可能な対象が同じ gateway であることを証明できませんでした。同じ gateway への SSH トンネル、proxy URL、または設定済みリモート URL ではこれは発生しません。
    - `auth_secretref_unresolved`: 失敗した対象について、設定済み認証 SecretRef を解決できませんでした。
    - `probe_scope_limited`: WebSocket 接続は成功しましたが、`operator.read` の欠落により読み取りプローブが制限されました。
    - `local_tls_runtime_unavailable`: ローカル Gateway TLS は有効ですが、OpenClaw はローカル証明書フィンガープリントを読み込めませんでした。

  </Accordion>
</AccordionGroup>

#### SSH 経由のリモート（Mac アプリ互換）

macOS アプリの「Remote over SSH」モードは、ローカルポートフォワードを使用し、ループバック専用のリモート gateway を `ws://127.0.0.1:<port>` で到達可能にします。

CLI の同等操作:

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
  解決済み検出エンドポイント（`local.` と、設定済みの広域ドメインがある場合はそれを加えたもの）から、最初に検出された gateway ホストを SSH 対象として選択します。TXT のみのヒントは無視されます。
</ParamField>

設定デフォルト（任意）: `gateway.remote.sshTarget`、`gateway.remote.sshIdentity`。

### `gateway call <method>`

低レベル RPC ヘルパー。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
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
<ParamField path="--timeout <ms>" type="number" default="10000">
  タイムアウト予算。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主に、最終ペイロードの前に中間イベントをストリームするエージェント形式の RPC 向けです。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な JSON 出力。
</ParamField>

<Note>
`--params` は有効な JSON である必要があり、各メソッドは独自の param 形状を検証します（余分なフィールドや名前の誤ったフィールドは拒否されます）。
</Note>

## Gateway サービスの管理

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### ラッパーを使用したインストール

管理対象サービスを別の実行ファイルを通じて起動する必要がある場合、たとえばシークレットマネージャーのシムや run-as ヘルパーを使う場合は、`--wrapper` を使用します。ラッパーは通常の Gateway 引数を受け取り、最終的にそれらの引数で `openclaw` または Node を exec する責任を持ちます。

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

環境経由でラッパーを設定することもできます。`gateway install` は、パスが実行可能ファイルであることを検証し、ラッパーをサービスの `ProgramArguments` に書き込み、後続の強制再インストール、更新、doctor 修復のためにサービス環境へ `OPENCLAW_WRAPPER` を永続化します。

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
    - `gateway install`: `--port`, `--runtime <node|bun>` (デフォルト: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="ライフサイクルの挙動">
    - 管理対象サービスを再起動するには `gateway restart` を使用します。再起動の代替として `gateway stop` と `gateway start` を連結しないでください。
    - macOS では、`gateway stop` はデフォルトで `launchctl bootout` を使用します。これにより、無効化を永続化せずに現在の起動セッションから LaunchAgent が削除されます。KeepAlive の自動復旧は将来のクラッシュに対して有効なままで、`gateway start` は手動の `launchctl enable` なしできれいに再有効化します。KeepAlive と RunAtLoad を永続的に抑止し、次に明示的な `gateway start` が実行されるまで Gateway が再起動しないようにするには、`--disable` を渡します。手動停止を再起動後も維持したい場合に使用してください。
    - ライフサイクルコマンドはスクリプト用途向けに `--json` を受け付けます。

  </Accordion>
  <Accordion title="インストール時の認証と SecretRef">
    - トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、`gateway install` は SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータへ永続化しません。
    - トークン認証でトークンが必要で、設定済みのトークン SecretRef が未解決の場合、インストールはフォールバックの平文を永続化するのではなく、閉じた状態で失敗します。
    - `gateway run` のパスワード認証では、インラインの `--password` よりも `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、または SecretRef に裏付けられた `gateway.auth.password` を優先してください。
    - 推論認証モードでは、シェル内だけの `OPENCLAW_GATEWAY_PASSWORD` はインストール時のトークン要件を緩和しません。管理対象サービスをインストールする場合は、永続的な設定 (`gateway.auth.password` または設定の `env`) を使用してください。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでインストールはブロックされます。

  </Accordion>
</AccordionGroup>

## Gatewayを検出する (Bonjour)

`gateway discover` は Gatewayビーコン (`_openclaw-gw._tcp`) をスキャンします。

- マルチキャスト DNS-SD: `local.`
- ユニキャスト DNS-SD (広域 Bonjour): ドメインを選択し (例: `openclaw.internal.`)、分割 DNS と DNS サーバーを設定します。[Bonjour](/ja-JP/gateway/bonjour) を参照してください。

Bonjour 検出が有効な Gateway (デフォルト) のみがビーコンを広告します。

すべてのビーコンの TXT ヒント: `role` (Gateway のロールヒント)、`transport` (トランスポートヒント、例: `gateway`)、`gatewayPort` (WebSocket ポート、通常は `18789`)、`tailnetDns` (利用可能な場合は MagicDNS ホスト名)、`gatewayTls` / `gatewayTlsSha256` (TLS 有効 + 証明書フィンガープリント)。`sshPort` と `cliPath` は完全検出モード (`discovery.mdns.mode: "full"`、デフォルトは `"minimal"` で、これらは省略されます) の場合にのみ公開されます。クライアントはその場合、SSH ターゲットのデフォルトとしてポート `22` を使用します。

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  コマンドごとのタイムアウト (参照/解決)。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な出力 (スタイル設定/スピナーも無効化します)。
</ParamField>

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- `local.` に加えて、有効化されている場合は設定済みの広域ドメインをスキャンします。
- JSON 出力の `wsUrl` は、`lanHost` や `tailnetDns` のような TXT のみのヒントからではなく、解決済みサービスエンドポイントから導出されます。
- `discovery.mdns.mode` は、`local.` mDNS と広域 DNS-SD の両方で `sshPort`/`cliPath` の公開を制御します (上記参照)。

</Note>

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
