---
read_when:
    - トラブルシューティングハブから、より詳細な診断のためにここへ案内されました
    - 安定した症状ベースの手順書セクションと正確なコマンドが必要です
summary: Gateway、チャネル、自動化、Node、ブラウザ向けの詳細なトラブルシューティング手順書
title: トラブルシューティング
x-i18n:
    generated_at: "2026-04-21T13:35:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: add7625785e3b78897c750b4785b7fe84a3d91c23c4175de750c4834272967f9
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway のトラブルシューティング

このページは詳細な手順書です。
まず迅速なトリアージの流れを確認したい場合は、[/help/troubleshooting](/ja-JP/help/troubleshooting) から始めてください。

## コマンドの段階的確認

まず以下を、この順番で実行してください。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

期待される正常なシグナル:

- `openclaw gateway status` に `Runtime: running`、`Connectivity probe: ok`、および `Capability: ...` 行が表示される。
- `openclaw doctor` が、設定やサービスに関するブロッキングな問題を報告しない。
- `openclaw channels status --probe` が、アカウントごとのライブなトランスポート状態と、サポートされている場合は `works` や `audit ok` のような probe/audit 結果を表示する。

## 長いコンテキストに対して追加利用枠が必要な Anthropic 429

ログやエラーに以下が含まれる場合に使用します:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認ポイント:

- 選択されている Anthropic の Opus/Sonnet モデルに `params.context1m: true` がある。
- 現在の Anthropic 認証情報が長文コンテキスト利用の対象ではない。
- リクエストが失敗するのは、1M ベータパスを必要とする長いセッションやモデル実行時のみである。

修正オプション:

1. そのモデルの `context1m` を無効にして、通常のコンテキストウィンドウにフォールバックする。
2. 長文コンテキストのリクエスト対象となる Anthropic 認証情報を使うか、Anthropic API キーに切り替える。
3. Anthropic の長文コンテキストリクエストが拒否されたときにも実行を継続できるよう、フォールバックモデルを設定する。

関連:

- [/providers/anthropic](/ja-JP/providers/anthropic)
- [/reference/token-use](/ja-JP/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/ja-JP/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ローカルの OpenAI 互換バックエンドは直接 probe では成功するが、agent 実行は失敗する

次の場合に使用します:

- `curl ... /v1/models` は動作する
- 小さな直接の `/v1/chat/completions` 呼び出しは動作する
- OpenClaw のモデル実行は通常の agent ターンでのみ失敗する

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

確認ポイント:

- 直接の小さな呼び出しは成功するが、OpenClaw の実行はより大きいプロンプトでのみ失敗する
- バックエンドエラーで `messages[].content` が文字列を期待している
- より大きな prompt-token 数や完全な agent ランタイムプロンプトでのみ発生するバックエンドクラッシュ

よくあるシグネチャ:

- `messages[...].content: invalid type: sequence, expected a string` → バックエンドが構造化された Chat Completions の content parts を拒否しています。修正: `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
- 直接の小さなリクエストは成功するが、OpenClaw の agent 実行がバックエンド/モデルのクラッシュで失敗する（たとえば一部の `inferrs` ビルド上の Gemma）→ OpenClaw のトランスポート自体はすでに正しい可能性が高く、バックエンドがより大きい agent ランタイムのプロンプト形状で失敗しています。
- ツールを無効にすると失敗は減るが消えない → ツールスキーマが負荷の一部ではありましたが、残っている問題は依然として上流のモデル/サーバー容量またはバックエンドのバグです。

修正オプション:

1. 文字列のみの Chat Completions バックエンド向けに `compat.requiresStringContent: true` を設定する。
2. OpenClaw のツールスキーマ表面を信頼して処理できないモデル/バックエンド向けに `compat.supportsTools: false` を設定する。
3. 可能な範囲でプロンプト負荷を下げる: より小さいワークスペースのブートストラップ、より短いセッション履歴、より軽量なローカルモデル、または長文コンテキスト対応がより強いバックエンドを使う。
4. 直接の小さなリクエストが引き続き成功する一方で、OpenClaw の agent ターンが依然としてバックエンド内部でクラッシュするなら、それは上流のサーバー/モデルの制限として扱い、受理されたペイロード形状を添えてそこで再現報告を行う。

関連:

- [/gateway/local-models](/ja-JP/gateway/local-models)
- [/gateway/configuration](/ja-JP/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)

## 返信がない

チャネルが稼働しているのに何も返ってこない場合は、何かを再接続する前にルーティングとポリシーを確認してください。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認ポイント:

- DM 送信者のペアリングが保留中。
- グループのメンション制御（`requireMention`、`mentionPatterns`）。
- チャネル/グループの allowlist の不一致。

よくあるシグネチャ:

- `drop guild message (mention required` → メンションされるまでグループメッセージは無視されます。
- `pairing request` → 送信者の承認が必要です。
- `blocked` / `allowlist` → 送信者/チャネルがポリシーによってフィルタリングされました。

関連:

- [/channels/troubleshooting](/ja-JP/channels/troubleshooting)
- [/channels/pairing](/ja-JP/channels/pairing)
- [/channels/groups](/ja-JP/channels/groups)

## Dashboard control UI の接続性

dashboard/control UI が接続できない場合は、URL、認証モード、セキュアコンテキスト前提を確認してください。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認ポイント:

- 正しい probe URL と dashboard URL。
- クライアントと Gateway 間の認証モード/トークン不一致。
- デバイス ID が必要な場面で HTTP を使っている。

よくあるシグネチャ:

- `device identity required` → 非セキュアコンテキスト、またはデバイス認証がありません。
- `origin not allowed` → ブラウザの `Origin` が `gateway.controlUi.allowedOrigins` に含まれていない（または、明示的な allowlist なしで非 loopback のブラウザ origin から接続しています）。
- `device nonce required` / `device nonce mismatch` → クライアントがチャレンジベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していません。
- `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったペイロード（または古いタイムスタンプ）に署名しました。
- `AUTH_TOKEN_MISMATCH` と `canRetryWithDeviceToken=true` → クライアントはキャッシュ済みデバイストークンを使って 1 回だけ信頼済みリトライを行えます。
- そのキャッシュ済みトークンによるリトライでは、ペアリング済みデバイストークンとともに保存されているキャッシュ済み scope セットを再利用します。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、要求した scope セットをそのまま維持します。
- そのリトライパス以外では、接続認証の優先順位は、まず明示的な共有トークン/パスワード、次に明示的な `deviceToken`、次に保存済みデバイストークン、最後に bootstrap トークンです。
- 非同期の Tailscale Serve Control UI パスでは、同じ `{scope, ip}` に対する失敗した試行は、limiter が失敗を記録する前に直列化されます。そのため、同じクライアントから同時に 2 回不正な再試行を行うと、2 回とも単純な mismatch になる代わりに、2 回目で `retry later` が出ることがあります。
- ブラウザ origin の loopback クライアントから `too many failed authentication attempts (retry later)` → 同じ正規化された `Origin` からの繰り返し失敗は一時的にロックアウトされます。別の localhost origin は別バケットを使います。
- そのリトライ後も `unauthorized` が繰り返される → 共有トークン/デバイストークンの不整合です。必要に応じてトークン設定を更新し、デバイストークンを再承認/ローテーションしてください。
- `gateway connect failed:` → host/port/url の接続先が間違っています。

### 認証の詳細コード クイック対応表

失敗した `connect` レスポンスの `error.details.code` を使って、次の対応を選んでください。

| Detail code                  | 意味                                                                                                                                                                           | 推奨対応                                                                                                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | クライアントが必要な共有トークンを送信していません。                                                                                                                           | クライアントにトークンを貼り付ける/設定して再試行してください。dashboard パスの場合: `openclaw config get gateway.auth.token` を実行し、その値を Control UI settings に貼り付けてください。                                                                                           |
| `AUTH_TOKEN_MISMATCH`        | 共有トークンが gateway auth token と一致しませんでした。                                                                                                                       | `canRetryWithDeviceToken=true` の場合は、信頼済みリトライを 1 回許可してください。キャッシュ済みトークンのリトライでは、保存済みの承認済み scopes を再利用します。明示的な `deviceToken` / `scopes` 呼び出し元は要求した scopes を維持します。それでも失敗する場合は、[token drift recovery checklist](/cli/devices#token-drift-recovery-checklist) を実行してください。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | デバイスごとのキャッシュ済みトークンが古いか、取り消されています。                                                                                                             | [devices CLI](/cli/devices) を使ってデバイストークンをローテーション/再承認してから、再接続してください。                                                                                                                                                                              |
| `PAIRING_REQUIRED`           | デバイス ID に承認が必要です。`error.details.reason` で `not-paired`、`scope-upgrade`、`role-upgrade`、`metadata-upgrade` を確認し、存在する場合は `requestId` / `remediationHint` を使ってください。 | 保留中のリクエストを承認します: `openclaw devices list` の後に `openclaw devices approve <requestId>` を実行してください。scope/role のアップグレードも、要求されたアクセスを確認した後は同じフローを使います。                                                                      |

デバイス認証 v2 の移行確認:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログに nonce/signature エラーが出る場合は、接続しているクライアントを更新し、以下を確認してください:

1. `connect.challenge` を待つ
2. challenge に束縛されたペイロードに署名する
3. 同じ challenge nonce を使って `connect.params.device.nonce` を送る

`openclaw devices rotate` / `revoke` / `remove` が予期せず拒否される場合:

- ペアリング済みデバイストークンのセッションは、呼び出し元が `operator.admin` も持っていない限り、**自分自身の**デバイスしか管理できません
- `openclaw devices rotate --scope ...` は、呼び出し元セッションがすでに保持している operator scope しか要求できません

関連:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/ja-JP/gateway/configuration)（Gateway 認証モード）
- [/gateway/trusted-proxy-auth](/ja-JP/gateway/trusted-proxy-auth)
- [/gateway/remote](/ja-JP/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway サービスが実行されていない

サービスはインストール済みだが、プロセスが起動し続けない場合に使用します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

確認ポイント:

- `Runtime: stopped` と終了のヒント。
- サービス設定の不一致（`Config (cli)` と `Config (service)`）。
- ポート/リスナーの競合。
- `--deep` 使用時の追加の launchd/systemd/schtasks インストール。
- `Other gateway-like services detected (best effort)` のクリーンアップヒント。

よくあるシグネチャ:

- `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → local Gateway モードが有効ではないか、設定ファイルが壊れて `gateway.mode` が失われています。修正: 設定で `gateway.mode="local"` を設定するか、`openclaw onboard --mode local` / `openclaw setup` を再実行して、期待される local モード設定を再スタンプしてください。Podman 経由で OpenClaw を実行している場合、デフォルトの設定パスは `~/.openclaw/openclaw.json` です。
- `refusing to bind gateway ... without auth` → 有効な Gateway 認証経路（トークン/パスワード、または設定済みの trusted-proxy）なしで non-loopback に bind しようとしています。
- `another gateway instance is already listening` / `EADDRINUSE` → ポート競合です。
- `Other gateway-like services detected (best effort)` → 古い、または並行する launchd/systemd/schtasks ユニットが存在します。ほとんどのセットアップでは、1 台のマシンにつき 1 つの Gateway を維持するのが一般的です。複数必要な場合は、ポート、設定、状態、ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。

関連:

- [/gateway/background-process](/ja-JP/gateway/background-process)
- [/gateway/configuration](/ja-JP/gateway/configuration)
- [/gateway/doctor](/ja-JP/gateway/doctor)

## Gateway が last-known-good 設定を復元した

Gateway は起動するが、ログに `openclaw.json` を復元したと出る場合に使用します。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

確認ポイント:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- アクティブな設定の隣にあるタイムスタンプ付きの `openclaw.json.clobbered.*` ファイル
- `Config recovery warning` で始まる main-agent の system event

何が起きたか:

- 拒否された設定は、起動時またはホットリロード時の検証に失敗しました。
- OpenClaw は拒否されたペイロードを `.clobbered.*` として保存しました。
- アクティブな設定は、最後に検証済みだった last-known-good のコピーから復元されました。
- 次の main-agent ターンには、拒否された設定を盲目的に上書きしないよう警告が出ます。

確認と修復:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

よくあるシグネチャ:

- `.clobbered.*` が存在する → 外部からの直接編集、または起動時の読み込み内容が復元されました。
- `.rejected.*` が存在する → OpenClaw 管理下の設定書き込みが、コミット前に schema または clobber チェックに失敗しました。
- `Config write rejected:` → 書き込みによって必要な形状が失われる、ファイルが急激に縮小する、または無効な設定を永続化しようとしました。
- `Config last-known-good promotion skipped` → 候補に `***` のようなマスク済み secret placeholder が含まれていました。

修正オプション:

1. 復元されたアクティブ設定が正しいなら、そのまま使う。
2. `.clobbered.*` または `.rejected.*` から意図したキーだけをコピーし、`openclaw config set` または `config.patch` で適用する。
3. 再起動前に `openclaw config validate` を実行する。
4. 手動で編集する場合は、変更したい部分オブジェクトだけでなく、完全な JSON5 設定を保持する。

関連:

- [/gateway/configuration#strict-validation](/ja-JP/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/ja-JP/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/ja-JP/gateway/doctor)

## Gateway probe の警告

`openclaw gateway probe` が何かには到達しているが、それでも警告ブロックが表示される場合に使用します。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認ポイント:

- JSON 出力内の `warnings[].code` と `primaryTargetId`。
- 警告が SSH フォールバック、複数 Gateway、不足している scope、未解決の認証参照のどれに関するものか。

よくあるシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH セットアップに失敗しましたが、コマンドは引き続き設定済み/loopback の接続先へ直接 probe を試みました。
- `multiple reachable gateways detected` → 複数の接続先が応答しました。通常、これは意図的な複数 Gateway 構成か、古い/重複したリスナーを意味します。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続自体は成功しましたが、詳細 RPC は scope 制限を受けています。デバイス ID をペアリングするか、`operator.read` を持つ認証情報を使ってください。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → Gateway は応答しましたが、このクライアントは通常の operator アクセスの前にまだペアリング/承認が必要です。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef 警告テキスト → 失敗した接続先に対するこのコマンド経路では認証情報を利用できませんでした。

関連:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host)
- [/gateway/remote](/ja-JP/gateway/remote)

## チャネルは接続済みだがメッセージが流れない

チャネル状態は connected なのにメッセージの流れが止まっている場合は、ポリシー、権限、チャネル固有の配信ルールに注目してください。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認ポイント:

- DM ポリシー（`pairing`、`allowlist`、`open`、`disabled`）。
- グループ allowlist とメンション要件。
- チャネル API の権限/scope 不足。

よくあるシグネチャ:

- `mention required` → グループのメンションポリシーによりメッセージが無視されました。
- `pairing` / 保留中の承認トレース → 送信者が承認されていません。
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → チャネル認証/権限の問題です。

関連:

- [/channels/troubleshooting](/ja-JP/channels/troubleshooting)
- [/channels/whatsapp](/ja-JP/channels/whatsapp)
- [/channels/telegram](/ja-JP/channels/telegram)
- [/channels/discord](/ja-JP/channels/discord)

## Cron と Heartbeat の配信

Cron または Heartbeat が実行されなかった、または配信されなかった場合は、まず scheduler の状態を確認し、その後で配信先を確認してください。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認ポイント:

- Cron が有効で、次回 wake が存在すること。
- ジョブ実行履歴の状態（`ok`、`skipped`、`error`）。
- Heartbeat の skip 理由（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

よくあるシグネチャ:

- `cron: scheduler disabled; jobs will not run automatically` → Cron が無効です。
- `cron: timer tick failed` → scheduler の tick が失敗しました。ファイル、ログ、ランタイムエラーを確認してください。
- `heartbeat skipped` と `reason=quiet-hours` → アクティブ時間帯の外です。
- `heartbeat skipped` と `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在するものの、空行または markdown 見出ししか含まず、OpenClaw がモデル呼び出しをスキップしています。
- `heartbeat skipped` と `reason=no-tasks-due` → `HEARTBEAT.md` に `tasks:` ブロックはありますが、この tick 時点で期限の来ているタスクがありません。
- `heartbeat: unknown accountId` → Heartbeat 配信先の account id が無効です。
- `heartbeat skipped` と `reason=dm-blocked` → Heartbeat の宛先が DM 形式の送信先に解決されましたが、`agents.defaults.heartbeat.directPolicy`（または agent ごとの override）が `block` に設定されています。

関連:

- [/automation/cron-jobs#troubleshooting](/ja-JP/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ja-JP/automation/cron-jobs)
- [/gateway/heartbeat](/ja-JP/gateway/heartbeat)

## Node のペア済みツールが失敗する

Node はペアリング済みだがツールが失敗する場合は、フォアグラウンド、権限、承認状態を切り分けてください。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認ポイント:

- Node がオンラインで、期待される capability を持っていること。
- カメラ、マイク、位置情報、画面に対する OS 権限が付与されていること。
- exec 承認と allowlist の状態。

よくあるシグネチャ:

- `NODE_BACKGROUND_UNAVAILABLE` → Node アプリはフォアグラウンドにある必要があります。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 権限が不足しています。
- `SYSTEM_RUN_DENIED: approval required` → exec 承認が保留中です。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが allowlist によりブロックされました。

関連:

- [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)
- [/nodes/index](/ja-JP/nodes/index)
- [/tools/exec-approvals](/ja-JP/tools/exec-approvals)

## ブラウザツールが失敗する

Gateway 自体は正常なのにブラウザツールの操作が失敗する場合に使用します。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認ポイント:

- `plugins.allow` が設定され、`browser` を含んでいるか。
- ブラウザ実行ファイルのパスが有効か。
- CDP プロファイルに到達可能か。
- `existing-session` / `user` プロファイル用のローカル Chrome が利用可能か。

よくあるシグネチャ:

- `unknown command "browser"` または `unknown command 'browser'` → 同梱の browser Plugin が `plugins.allow` によって除外されています。
- `browser.enabled=true` なのに browser ツールがない / 利用できない → `plugins.allow` が `browser` を除外しているため、Plugin がロードされていません。
- `Failed to start Chrome CDP on port` → ブラウザプロセスの起動に失敗しました。
- `browser.executablePath not found` → 設定されたパスが無効です。
- `browser.cdpUrl must be http(s) or ws(s)` → 設定された CDP URL が `file:` や `ftp:` など未対応のスキームを使っています。
- `browser.cdpUrl has invalid port` → 設定された CDP URL のポートが不正、または範囲外です。
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session が、選択されたブラウザのデータディレクトリにまだ接続できません。ブラウザの inspect ページを開き、remote debugging を有効にし、ブラウザを開いたままにして、最初の attach プロンプトを承認してから再試行してください。サインイン状態が不要なら、管理対象の `openclaw` プロファイルを推奨します。
- `No Chrome tabs found for profile="user"` → Chrome MCP の attach プロファイルに、開いているローカル Chrome タブがありません。
- `Remote CDP for profile "<name>" is not reachable` → 設定されたリモート CDP エンドポイントに Gateway ホストから到達できません。
- `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only プロファイルに到達可能な接続先がないか、HTTP エンドポイントは応答しても CDP WebSocket をまだ開けませんでした。
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在の Gateway インストールには完全な Playwright パッケージが含まれていません。ARIA スナップショットや基本的なページスクリーンショットは動作する場合がありますが、ナビゲーション、AI スナップショット、CSS セレクターによる要素スクリーンショット、PDF エクスポートは利用できません。
- `fullPage is not supported for element screenshots` → スクリーンショット要求で `--full-page` と `--ref` または `--element` を混在させています。
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` のスクリーンショット呼び出しでは、CSS `--element` ではなくページキャプチャまたはスナップショットの `--ref` を使う必要があります。
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP のアップロードフックには、CSS セレクターではなく snapshot ref が必要です。
- `existing-session file uploads currently support one file at a time.` → Chrome MCP プロファイルでは、アップロードは 1 回の呼び出しにつき 1 ファイルずつ送ってください。
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP プロファイルのダイアログフックは timeout の上書きをサポートしていません。
- `response body is not supported for existing-session profiles yet.` → `responsebody` はまだ managed browser または raw CDP プロファイルが必要です。
- attach-only または remote CDP プロファイルで viewport / dark-mode / locale / offline の override が古いまま残る → `openclaw browser stop --browser-profile <name>` を実行し、Gateway 全体を再起動せずに、アクティブな制御セッションを閉じて Playwright/CDP のエミュレーション状態を解放してください。

関連:

- [/tools/browser-linux-troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)
- [/tools/browser](/ja-JP/tools/browser)

## アップグレード後に突然何かが壊れた場合

アップグレード後の不具合の多くは、設定のずれ、またはより厳格なデフォルトが適用されるようになったことが原因です。

### 1) 認証と URL override の挙動が変わった

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

確認すること:

- `gateway.mode=remote` の場合、ローカルサービスが正常でも CLI 呼び出しはリモートを対象にしている可能性があります。
- 明示的な `--url` 呼び出しは、保存済み認証情報へフォールバックしません。

よくあるシグネチャ:

- `gateway connect failed:` → URL の接続先が間違っています。
- `unauthorized` → エンドポイントには到達できていますが、認証が誤っています。

### 2) bind と認証のガードレールがより厳格になった

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

確認すること:

- non-loopback bind（`lan`、`tailnet`、`custom`）には、有効な Gateway 認証経路が必要です: 共有トークン/パスワード認証、または正しく設定された non-loopback の `trusted-proxy` デプロイメント。
- `gateway.token` のような古いキーは、`gateway.auth.token` の代わりにはなりません。

よくあるシグネチャ:

- `refusing to bind gateway ... without auth` → 有効な Gateway 認証経路なしで non-loopback に bind しようとしています。
- ランタイムが動作中なのに `Connectivity probe: failed` → Gateway は生きていますが、現在の auth/url ではアクセスできません。

### 3) ペアリングとデバイス ID の状態が変わった

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

確認すること:

- dashboard/nodes 向けの保留中のデバイス承認。
- ポリシーまたは ID 変更後の、保留中の DM ペアリング承認。

よくあるシグネチャ:

- `device identity required` → デバイス認証が満たされていません。
- `pairing required` → 送信者/デバイスを承認する必要があります。

確認後もサービス設定とランタイムが一致しない場合は、同じ profile/state ディレクトリからサービスメタデータを再インストールしてください。

```bash
openclaw gateway install --force
openclaw gateway restart
```

関連:

- [/gateway/pairing](/ja-JP/gateway/pairing)
- [/gateway/authentication](/ja-JP/gateway/authentication)
- [/gateway/background-process](/ja-JP/gateway/background-process)
