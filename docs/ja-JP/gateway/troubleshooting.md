---
read_when:
    - トラブルシューティングハブから、より深い診断のためにここへ案内されました
    - 症状ベースの安定した手順書セクションと正確なコマンドが必要です
summary: gateway、チャネル、自動化、Nodes、browserのための詳細なトラブルシューティング手順書
title: トラブルシューティング
x-i18n:
    generated_at: "2026-04-24T05:00:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32c4cbbbe8b1cd5eaca34503f4a363d3fa2650e491f83455958eb5725f9d50c5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gatewayトラブルシューティング

このページは詳細な手順書です。
まず高速なトリアージフローを使いたい場合は [/help/troubleshooting](/ja-JP/help/troubleshooting) から始めてください。

## コマンドラダー

まず次を、この順番で実行してください:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常時に期待されるシグナル:

- `openclaw gateway status` に `Runtime: running`、`Connectivity probe: ok`、および `Capability: ...` 行が表示される。
- `openclaw doctor` が、設定/サービスに関するブロッキングな問題を報告しない。
- `openclaw channels status --probe` が、アカウントごとのライブトランスポート状態と、対応している場合は `works` や `audit ok` のようなprobe/audit結果を表示する。

## 長いコンテキストで追加使用量が必要というAnthropic 429

ログ/エラーに次が含まれる場合に使います:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認ポイント:

- 選択されているAnthropic Opus/Sonnetモデルに `params.context1m: true` がある。
- 現在のAnthropic認証情報がlong-context利用に対応していない。
- 失敗するのが、1M beta pathを必要とする長いセッション/モデル実行だけである。

修正方法:

1. そのモデルの `context1m` を無効にして、通常のコンテキストウィンドウにフォールバックする。
2. long-contextリクエストに対応しているAnthropic認証情報を使うか、Anthropic API keyへ切り替える。
3. Anthropicのlong-contextリクエストが拒否されたときでも実行が継続するよう、フォールバックモデルを設定する。

関連:

- [/providers/anthropic](/ja-JP/providers/anthropic)
- [/reference/token-use](/ja-JP/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/ja-JP/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ローカルのOpenAI互換バックエンドは直接probeには通るが、agent実行が失敗する

次の場合に使います:

- `curl ... /v1/models` は動作する
- 小さな直接 `/v1/chat/completions` 呼び出しは動作する
- OpenClawのモデル実行が通常のagentターンでのみ失敗する

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

確認ポイント:

- 直接の小さな呼び出しは成功するが、OpenClaw実行は大きいプロンプトでのみ失敗する
- バックエンドエラーに `messages[].content` が文字列を期待しているとある
- バックエンドクラッシュが、より大きなprompt-token数や完全なagent runtime promptでのみ発生する

よくあるシグネチャ:

- `messages[...].content: invalid type: sequence, expected a string` → バックエンドが構造化されたChat Completions content partsを拒否している。修正: `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定する。
- 直接の小さなリクエストは成功するが、OpenClaw agent実行がバックエンド/モデルクラッシュで失敗する（たとえば一部の `inferrs` ビルドのGemma） → OpenClawトランスポート自体はおそらくすでに正しい。バックエンドがより大きいagent-runtime prompt shapeで失敗している。
- ツールを無効にすると失敗は減るが消えない → ツールschemaも圧力の一部だったが、残っている問題は依然としてupstreamのモデル/サーバー能力またはバックエンドバグである。

修正方法:

1. 文字列のみのChat Completionsバックエンドには `compat.requiresStringContent: true` を設定する。
2. OpenClawのツールschemaサーフェスを安定して処理できないモデル/バックエンドには `compat.supportsTools: false` を設定する。
3. 可能な限りプロンプト圧力を下げる: より小さいworkspace bootstrap、より短いsession history、より軽いローカルモデル、またはより強いlong-context対応を持つバックエンド。
4. 直接の小さなリクエストが通り続けるのにOpenClaw agentターンがバックエンド内部で依然としてクラッシュするなら、upstreamのサーバー/モデルの制限として扱い、受理されたペイロード形状付きでそこへ再現例を報告する。

関連:

- [/gateway/local-models](/ja-JP/gateway/local-models)
- [/gateway/configuration](/ja-JP/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)

## 返信がない

チャネルは起動しているのに何も応答しない場合は、何かを再接続する前にルーティングとポリシーを確認してください。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認ポイント:

- DM送信者に対してペアリングが保留中である。
- グループメンションゲーティング（`requireMention`、`mentionPatterns`）。
- チャネル/グループallowlistの不一致。

よくあるシグネチャ:

- `drop guild message (mention required` → メンションされるまでグループメッセージは無視される。
- `pairing request` → 送信者に承認が必要。
- `blocked` / `allowlist` → 送信者/チャネルがポリシーによりフィルタされた。

関連:

- [/channels/troubleshooting](/ja-JP/channels/troubleshooting)
- [/channels/pairing](/ja-JP/channels/pairing)
- [/channels/groups](/ja-JP/channels/groups)

## Dashboard control UI接続性

dashboard/control UIが接続できない場合は、URL、auth mode、secure context前提を検証します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認ポイント:

- 正しいprobe URLとdashboard URL。
- クライアントとgateway間のauth mode/token不一致。
- device identityが必要な場面でHTTPを使っている。

よくあるシグネチャ:

- `device identity required` → 非secure context、またはdevice auth欠落。
- `origin not allowed` → ブラウザの `Origin` が `gateway.controlUi.allowedOrigins` に入っていない（または、明示的allowlistなしでloopback外のブラウザoriginから接続している）。
- `device nonce required` / `device nonce mismatch` → クライアントがchallengeベースのdevice authフロー（`connect.challenge` + `device.nonce`）を完了していない。
- `device signature invalid` / `device signature expired` → クライアントが現在のhandshakeに対して間違ったペイロード（または古いタイムスタンプ）に署名している。
- `AUTH_TOKEN_MISMATCH` かつ `canRetryWithDeviceToken=true` → クライアントはキャッシュ済みdevice tokenで1回だけ信頼された再試行が可能。
- そのキャッシュ済みtoken再試行では、ペアリング済みdevice tokenと一緒に保存されたキャッシュ済みscopeセットを再利用する。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、要求したscopeセットを維持する。
- その再試行経路以外では、接続認証の優先順位は、まず明示的な共有token/password、次に明示的な `deviceToken`、次に保存済みdevice token、最後にbootstrap token。
- 非同期のTailscale Serve Control UI経路では、同じ `{scope, ip}` に対する失敗試行は、limiterが失敗を記録する前に直列化される。そのため、同じクライアントからの悪い同時再試行2件では、2件とも単純な不一致になる代わりに、2件目で `retry later` が出ることがある。
- ブラウザoriginのloopbackクライアントから `too many failed authentication attempts (retry later)` → 同じ正規化済み `Origin` からの繰り返し失敗は一時的にロックアウトされる。別のlocalhost originは別バケットを使う。
- その再試行後も `unauthorized` が繰り返される → 共有token/device tokenのずれ。token設定を更新し、必要ならdevice tokenを再承認/ローテーションする。
- `gateway connect failed:` → host/port/urlターゲットが間違っている。

### Auth detail codeクイックマップ

失敗した `connect` 応答の `error.details.code` を使って、次のアクションを選びます:

| Detail code | 意味 | 推奨アクション |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING` | 必要な共有tokenをクライアントが送信していない。 | クライアントにtokenを貼り付け/設定して再試行する。dashboard経路では: `openclaw config get gateway.auth.token` を実行し、その値をControl UI設定へ貼り付ける。 |
| `AUTH_TOKEN_MISMATCH` | 共有tokenがgateway auth tokenと一致しなかった。 | `canRetryWithDeviceToken=true` の場合、1回だけ信頼された再試行を許可する。キャッシュ済みtoken再試行は保存済み承認scopeを再利用する。明示的な `deviceToken` / `scopes` の呼び出し元は要求scopeを維持する。それでも失敗する場合は、[トークンドリフト復旧チェックリスト](/ja-JP/cli/devices#token-drift-recovery-checklist) を実行する。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | キャッシュ済みデバイス単位tokenが古いか失効している。 | [devices CLI](/ja-JP/cli/devices) を使ってdevice tokenをローテーション/再承認し、その後再接続する。 |
| `PAIRING_REQUIRED` | device identityに承認が必要。`error.details.reason` で `not-paired`、`scope-upgrade`、`role-upgrade`、`metadata-upgrade` を確認し、存在する場合は `requestId` / `remediationHint` を使う。 | 保留中要求を承認する: `openclaw devices list` してから `openclaw devices approve <requestId>`。scope/roleアップグレードも、要求されたアクセスを確認したうえで同じフローを使う。 |

device auth v2移行チェック:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログにnonce/signatureエラーが出る場合は、接続しているクライアントを更新し、次を確認してください:

1. `connect.challenge` を待つ
2. challenge束縛ペイロードに署名する
3. 同じchallenge nonce付きで `connect.params.device.nonce` を送る

`openclaw devices rotate` / `revoke` / `remove` が予期せず拒否される場合:

- ペアリング済みデバイストークンセッションは、呼び出し元が `operator.admin` も持っていない限り、**自分自身の**デバイスしか管理できない
- `openclaw devices rotate --scope ...` は、呼び出し元セッションがすでに保持しているoperator scopesしか要求できない

関連:

- [/web/control-ui](/ja-JP/web/control-ui)
- [/gateway/configuration](/ja-JP/gateway/configuration)（gateway auth modes）
- [/gateway/trusted-proxy-auth](/ja-JP/gateway/trusted-proxy-auth)
- [/gateway/remote](/ja-JP/gateway/remote)
- [/cli/devices](/ja-JP/cli/devices)

## Gatewayサービスが起動していない

サービスはインストールされているが、プロセスが起動したままにならない場合に使います。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

確認ポイント:

- `Runtime: stopped` と終了ヒント。
- サービス設定の不一致（`Config (cli)` と `Config (service)`）。
- ポート/リスナーの競合。
- `--deep` 使用時の追加のlaunchd/systemd/schtasksインストール。
- `Other gateway-like services detected (best effort)` のクリーンアップヒント。

よくあるシグネチャ:

- `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → ローカルgateway modeが有効ではない、または設定ファイルが壊れて `gateway.mode` が失われている。修正: 設定で `gateway.mode="local"` を設定するか、`openclaw onboard --mode local` / `openclaw setup` を再実行して、期待されるlocal-mode設定を書き戻す。Podman経由でOpenClawを実行している場合、デフォルトの設定パスは `~/.openclaw/openclaw.json`。
- `refusing to bind gateway ... without auth` → 有効なgateway auth経路（token/password、または設定済みのtrusted-proxy）がないままloopback以外へbindしようとしている。
- `another gateway instance is already listening` / `EADDRINUSE` → ポート競合。
- `Other gateway-like services detected (best effort)` → 古い、または並行するlaunchd/systemd/schtasksユニットが存在する。ほとんどの構成では1台のマシンにつき1つのgatewayだけを維持するべきであり、複数必要な場合はポート + config/state/workspaceを分離する。[複数Gatewayを同一ホストで](/ja-JP/gateway#multiple-gateways-same-host) を参照。

関連:

- [/gateway/background-process](/ja-JP/gateway/background-process)
- [/gateway/configuration](/ja-JP/gateway/configuration)
- [/gateway/doctor](/ja-JP/gateway/doctor)

## Gatewayがlast-known-good設定を復元した

Gatewayは起動するが、ログに `openclaw.json` を復元したと出る場合に使います。

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
- 有効な設定の隣にあるタイムスタンプ付き `openclaw.json.clobbered.*` ファイル
- `Config recovery warning` で始まるmain-agent system event

何が起きたか:

- 起動時またはhot reload中に、拒否された設定が検証に通らなかった。
- OpenClawは拒否されたペイロードを `.clobbered.*` として保存した。
- アクティブ設定は、最後に検証済みのlast-known-goodコピーから復元された。
- 次のmain-agentターンには、拒否された設定を盲目的に書き直さないよう警告が出る。

確認と修復:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

よくあるシグネチャ:

- `.clobbered.*` が存在する → 外部の直接編集または起動時読み取りが復元された。
- `.rejected.*` が存在する → OpenClaw所有の設定書き込みが、commit前にschemaまたはclobberチェックに失敗した。
- `Config write rejected:` → 書き込みが必須形状を削除しようとした、ファイルサイズを急激に縮小しようとした、または無効な設定を永続化しようとした。
- `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good`、または `size-drop-vs-last-good:*` → 起動時に、last-known-good backupと比べてフィールドまたはサイズが失われていたため、現在のファイルがclobberedとして扱われた。
- `Config last-known-good promotion skipped` → 候補に `***` のような秘匿済みsecret placeholderが含まれていた。

修正方法:

1. 復元されたアクティブ設定が正しければ、それをそのまま維持する。
2. `.clobbered.*` または `.rejected.*` から意図したキーだけをコピーし、`openclaw config set` または `config.patch` で適用する。
3. 再起動前に `openclaw config validate` を実行する。
4. 手動編集する場合は、変更したい部分オブジェクトだけでなく、完全なJSON5設定を維持する。

関連:

- [/gateway/configuration#strict-validation](/ja-JP/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/ja-JP/gateway/configuration#config-hot-reload)
- [/cli/config](/ja-JP/cli/config)
- [/gateway/doctor](/ja-JP/gateway/doctor)

## Gateway probe警告

`openclaw gateway probe` が何かには到達するが、それでも警告ブロックを表示する場合に使います。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認ポイント:

- JSON出力内の `warnings[].code` と `primaryTargetId`。
- 警告がSSHフォールバック、複数gateway、欠落scope、未解決auth refのどれに関するものか。

よくあるシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH構成に失敗したが、コマンドは引き続き設定済み/loopbackターゲットへの直接probeを試みた。
- `multiple reachable gateways detected` → 複数のターゲットが応答した。通常は意図的なmulti-gateway構成か、古い/重複したlistenerを意味する。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続自体は成功したが、詳細RPCがscope制限されている。device identityをペアリングするか、`operator.read` を持つ認証情報を使う。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → gatewayは応答したが、このクライアントには通常のoperatorアクセスの前にペアリング/承認がまだ必要。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef 警告テキスト → 失敗したターゲットについて、このコマンド経路でauth materialを利用できなかった。

関連:

- [/cli/gateway](/ja-JP/cli/gateway)
- [/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host)
- [/gateway/remote](/ja-JP/gateway/remote)

## チャネルは接続済みだがメッセージが流れない

チャネル状態は接続済みなのにメッセージフローが止まっている場合は、ポリシー、権限、チャネル固有の配信ルールに注目してください。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認ポイント:

- DMポリシー（`pairing`、`allowlist`、`open`、`disabled`）。
- グループallowlistとメンション必須条件。
- チャネルAPIの権限/scope不足。

よくあるシグネチャ:

- `mention required` → グループメンションポリシーによりメッセージが無視された。
- `pairing` / 保留中承認の痕跡 → 送信者が承認されていない。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → チャネル認証/権限の問題。

関連:

- [/channels/troubleshooting](/ja-JP/channels/troubleshooting)
- [/channels/whatsapp](/ja-JP/channels/whatsapp)
- [/channels/telegram](/ja-JP/channels/telegram)
- [/channels/discord](/ja-JP/channels/discord)

## CronとHeartbeatの配信

CronまたはHeartbeatが実行されなかった、または配信されなかった場合は、まずscheduler状態を確認し、その後配信ターゲットを確認してください。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認ポイント:

- Cronが有効で、次回起動時刻が存在する。
- ジョブ実行履歴の状態（`ok`、`skipped`、`error`）。
- Heartbeatのスキップ理由（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

よくあるシグネチャ:

- `cron: scheduler disabled; jobs will not run automatically` → cronが無効。
- `cron: timer tick failed` → scheduler tickに失敗した。ファイル/ログ/ランタイムエラーを確認する。
- `heartbeat skipped` with `reason=quiet-hours` → active hoursの時間帯外。
- `heartbeat skipped` with `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在するが、空行/Markdownヘッダーしか含んでいないため、OpenClawがモデル呼び出しをスキップしている。
- `heartbeat skipped` with `reason=no-tasks-due` → `HEARTBEAT.md` に `tasks:` ブロックがあるが、このtickで期限到来のタスクがない。
- `heartbeat: unknown accountId` → Heartbeat配信ターゲットのaccount idが不正。
- `heartbeat skipped` with `reason=dm-blocked` → HeartbeatターゲットがDM形式の宛先に解決されたが、`agents.defaults.heartbeat.directPolicy`（またはエージェントごとの上書き）が `block` に設定されている。

関連:

- [/automation/cron-jobs#troubleshooting](/ja-JP/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ja-JP/automation/cron-jobs)
- [/gateway/heartbeat](/ja-JP/gateway/heartbeat)

## ペアリング済みnodeのツールが失敗する

nodeはペアリング済みだがツールが失敗する場合は、foreground、権限、承認状態を切り分けます。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認ポイント:

- nodeがオンラインで、期待されるcapabilitiesを持っている。
- camera/mic/location/screen に対するOS権限付与。
- Exec承認とallowlist状態。

よくあるシグネチャ:

- `NODE_BACKGROUND_UNAVAILABLE` → nodeアプリがforegroundにある必要がある。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS権限不足。
- `SYSTEM_RUN_DENIED: approval required` → exec承認が保留中。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドがallowlistでブロックされた。

関連:

- [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)
- [/nodes/index](/ja-JP/nodes/index)
- [/tools/exec-approvals](/ja-JP/tools/exec-approvals)

## browserツールが失敗する

gateway自体は正常なのにbrowserツールアクションが失敗する場合に使います。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認ポイント:

- `plugins.allow` が設定されており、`browser` を含んでいるか。
- 有効なbrowser executable path。
- CDP profileの到達性。
- `existing-session` / `user` profiles向けのローカルChrome利用可否。

よくあるシグネチャ:

- `unknown command "browser"` または `unknown command 'browser'` → バンドル済みbrowser pluginが `plugins.allow` により除外されている。
- `browser.enabled=true` なのにbrowserツールが欠落/利用不可 → `plugins.allow` が `browser` を除外しているため、pluginがロードされていない。
- `Failed to start Chrome CDP on port` → browser processの起動に失敗した。
- `browser.executablePath not found` → 設定されたパスが無効。
- `browser.cdpUrl must be http(s) or ws(s)` → 設定されたCDP URLが `file:` や `ftp:` のような未対応スキームを使っている。
- `browser.cdpUrl has invalid port` → 設定されたCDP URLのポートが不正または範囲外。
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session が選択されたbrowser data dirにまだアタッチできない。browser inspectページを開き、remote debuggingを有効にし、browserを開いたままにして、最初のattach promptを承認してから再試行する。サインイン状態が不要なら、管理された `openclaw` profileを推奨。
- `No Chrome tabs found for profile="user"` → Chrome MCP attach profileに開いているローカルChromeタブがない。
- `Remote CDP for profile "<name>" is not reachable` → 設定されたremote CDP endpointにgateway hostから到達できない。
- `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only profileに到達可能なターゲットがない、またはHTTP endpointは応答したがCDP WebSocketが開けない。
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在のgateway installには、バンドル済みbrowser pluginの `playwright-core` ランタイム依存関係がない。`openclaw doctor --fix` を実行してからgatewayを再起動する。ARIA snapshots と基本的なページスクリーンショットは引き続き動作するが、ナビゲーション、AI snapshots、CSSセレクタ要素スクリーンショット、PDFエクスポートは引き続き利用不可。
- `fullPage is not supported for element screenshots` → スクリーンショット要求で `--full-page` と `--ref` または `--element` を混在させている。
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` のスクリーンショット呼び出しでは、CSS `--element` ではなくページキャプチャまたはsnapshot `--ref` を使う必要がある。
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP upload hooksでは、CSSセレクタではなくsnapshot refが必要。
- `existing-session file uploads currently support one file at a time.` → Chrome MCP profileでは、uploadは1回の呼び出しにつき1ファイルずつ送る。
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profileのdialog hooksではtimeout上書きをサポートしない。
- `response body is not supported for existing-session profiles yet.` → `responsebody` は依然として管理されたbrowserまたは生CDP profileが必要。
- attach-onlyまたはremote CDP profileで古いviewport / dark-mode / locale / offline上書きが残っている → `openclaw browser stop --browser-profile <name>` を実行し、gateway全体を再起動せずに、アクティブなcontrol sessionを閉じてPlaywright/CDPのエミュレーション状態を解放する。

関連:

- [/tools/browser-linux-troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)
- [/tools/browser](/ja-JP/tools/browser)

## アップグレード後に突然何かが壊れた場合

アップグレード後の不具合の多くは、設定ドリフト、またはより厳格なデフォルトが適用されるようになったことが原因です。

### 1) AuthとURL上書きの動作が変わった

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

確認ポイント:

- `gateway.mode=remote` の場合、ローカルサービスが正常でもCLI呼び出しがリモートを対象にしている可能性がある。
- 明示的な `--url` 呼び出しは、保存済み認証情報にフォールバックしない。

よくあるシグネチャ:

- `gateway connect failed:` → URLターゲットが間違っている。
- `unauthorized` → endpointには到達しているがauthが間違っている。

### 2) Bindとauthのガードレールが厳格になった

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

確認ポイント:

- loopback以外へのbind（`lan`、`tailnet`、`custom`）には、有効なgateway auth経路が必要: shared token/password auth、または正しく設定されたloopback外の `trusted-proxy` デプロイ。
- `gateway.token` のような古いキーでは `gateway.auth.token` を置き換えられない。

よくあるシグネチャ:

- `refusing to bind gateway ... without auth` → 有効なgateway auth経路がないままloopback以外へbindしようとしている。
- `Connectivity probe: failed` なのにruntimeは動作中 → gatewayは生きているが、現在のauth/urlでは到達できない。

### 3) Pairingとdevice identityの状態が変わった

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

確認ポイント:

- dashboard/Nodes向けの保留中device承認。
- ポリシーまたはidentity変更後の保留中DMペアリング承認。

よくあるシグネチャ:

- `device identity required` → device authが満たされていない。
- `pairing required` → 送信者/deviceに承認が必要。

確認後もサービス設定とruntimeが食い違っている場合は、同じprofile/state directoryからサービスメタデータを再インストールします:

```bash
openclaw gateway install --force
openclaw gateway restart
```

関連:

- [/gateway/pairing](/ja-JP/gateway/pairing)
- [/gateway/authentication](/ja-JP/gateway/authentication)
- [/gateway/background-process](/ja-JP/gateway/background-process)

## 関連

- [Gateway手順書](/ja-JP/gateway)
- [Doctor](/ja-JP/gateway/doctor)
- [FAQ](/ja-JP/help/faq)
