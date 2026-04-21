---
read_when:
    - トラブルシューティングハブから、より詳細な診断のためにここへ案内されました
    - 安定した症状ベースの runbook セクションと正確なコマンドが必要です
summary: Gateway、channels、automation、Node、およびブラウザー向けの詳細なトラブルシューティング runbook
title: トラブルシューティング
x-i18n:
    generated_at: "2026-04-21T04:46:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2afb105376bb467e5a344e6d73726908cb718fa13116b751fddb494a0b641c42
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway のトラブルシューティング

このページは詳細な runbook です。  
まず高速なトリアージフローを確認したい場合は [/help/troubleshooting](/ja-JP/help/troubleshooting) から始めてください。

## コマンドの段階的確認

まず次のコマンドを、この順番で実行してください:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常時に期待されるシグナル:

- `openclaw gateway status` に `Runtime: running`、`Connectivity probe: ok`、および `Capability: ...` 行が表示される。
- `openclaw doctor` が、構成またはサービスに関するブロッキングな問題なしと報告する。
- `openclaw channels status --probe` が、アカウントごとのライブなトランスポート状態と、サポートされる場合は `works` や `audit ok` などの probe/audit 結果を表示する。

## 長いコンテキストに対して Anthropic 429 で追加使用量が必要

ログやエラーに次が含まれる場合に使用します:  
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認するポイント:

- 選択された Anthropic Opus/Sonnet モデルで `params.context1m: true` になっている。
- 現在の Anthropic 認証情報が long-context 使用の対象ではない。
- リクエストが失敗するのは、1M ベータパスが必要な長いセッション/モデル実行時のみ。

対処方法:

1. そのモデルの `context1m` を無効にして、通常のコンテキストウィンドウにフォールバックする。
2. long-context リクエストの対象となる Anthropic 認証情報を使用するか、Anthropic API キーに切り替える。
3. Anthropic の long-context リクエストが拒否されたときでも実行を継続できるように、フォールバックモデルを設定する。

関連:

- [/providers/anthropic](/ja-JP/providers/anthropic)
- [/reference/token-use](/ja-JP/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/ja-JP/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ローカルの OpenAI 互換バックエンドでは直接 probe は通るが agent 実行が失敗する

次の場合に使用します:

- `curl ... /v1/models` は動作する
- 小さな直接 `/v1/chat/completions` 呼び出しは動作する
- OpenClaw のモデル実行は通常の agent ターンでのみ失敗する

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

確認するポイント:

- 小さな直接呼び出しは成功するが、OpenClaw 実行は大きなプロンプトでのみ失敗する
- `messages[].content` が文字列を期待しているというバックエンドエラー
- 大きな prompt-token 数または完全な agent runtime prompt でのみ発生するバックエンドクラッシュ

よくあるシグネチャ:

- `messages[...].content: invalid type: sequence, expected a string` → バックエンドが構造化された Chat Completions content parts を拒否している。対処: `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定する。
- 小さな直接リクエストは成功するが、OpenClaw agent 実行はバックエンド/モデルクラッシュで失敗する（たとえば一部の `inferrs` ビルド上の Gemma）→ OpenClaw のトランスポートはすでに正しい可能性が高く、バックエンドがより大きな agent-runtime prompt 形状で失敗している。
- ツールを無効化すると失敗は減るが消えない → tool schema が負荷の一部だったが、残っている問題は依然として上流のモデル/サーバー容量またはバックエンドバグ。

対処方法:

1. 文字列のみの Chat Completions バックエンドに対して `compat.requiresStringContent: true` を設定する。
2. OpenClaw の tool schema surface を安定して処理できないモデル/バックエンドに対して `compat.supportsTools: false` を設定する。
3. 可能な範囲でプロンプト負荷を下げる: より小さい workspace bootstrap、より短いセッション履歴、より軽いローカルモデル、または long-context サポートがより強いバックエンドを使う。
4. 小さな直接リクエストは通り続ける一方で OpenClaw agent ターンが依然としてバックエンド内部でクラッシュする場合は、上流のサーバー/モデル制限として扱い、受理された payload 形状とともにその先へ再現例を報告する。

関連:

- [/gateway/local-models](/ja-JP/gateway/local-models)
- [/gateway/configuration](/ja-JP/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)

## 返信がない

channel は動作しているのに何も応答しない場合は、何かを再接続する前にルーティングとポリシーを確認してください。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認するポイント:

- DM 送信者に対してペアリングが保留中。
- グループのメンションゲート（`requireMention`, `mentionPatterns`）。
- channel/group allowlist の不一致。

よくあるシグネチャ:

- `drop guild message (mention required` → メンションされるまでグループメッセージは無視される。
- `pairing request` → 送信者は承認が必要。
- `blocked` / `allowlist` → 送信者または channel がポリシーでフィルタされた。

関連:

- [/channels/troubleshooting](/ja-JP/channels/troubleshooting)
- [/channels/pairing](/ja-JP/channels/pairing)
- [/channels/groups](/ja-JP/channels/groups)

## Dashboard control ui の接続性

dashboard/control UI が接続できない場合は、URL、認証モード、および secure context の前提を確認してください。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認するポイント:

- 正しい probe URL と dashboard URL。
- クライアントと gateway 間の auth mode/token の不一致。
- device identity が必要な場面での HTTP 使用。

よくあるシグネチャ:

- `device identity required` → non-secure context、または device auth が不足している。
- `origin not allowed` → ブラウザーの `Origin` が `gateway.controlUi.allowedOrigins` に入っていない（または、明示的な allowlist なしで non-loopback の browser origin から接続している）。
- `device nonce required` / `device nonce mismatch` → クライアントが challenge ベースの device auth フロー（`connect.challenge` + `device.nonce`）を完了していない。
- `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤った payload（または古い timestamp）に署名した。
- `AUTH_TOKEN_MISMATCH` かつ `canRetryWithDeviceToken=true` → クライアントはキャッシュされた device token で 1 回だけ trusted retry できる。
- その cached-token retry は、paired device token とともに保存されているキャッシュ済み scope set を再利用する。明示的な `deviceToken` / 明示的な `scopes` 呼び出し側は、要求した scope set をそのまま維持する。
- その retry パス以外では、connect auth の優先順位は、明示的な shared token/password、次に明示的な `deviceToken`、次に保存済み device token、最後に bootstrap token。
- 非同期の Tailscale Serve Control UI パスでは、同じ `{scope, ip}` に対する失敗試行は limiter が失敗を記録する前に直列化される。そのため、同じクライアントからの 2 つの誤った同時再試行では、2 回とも単純な mismatch になる代わりに、2 回目が `retry later` になることがある。
- browser-origin の loopback クライアントからの `too many failed authentication attempts (retry later)` → 同じ正規化 `Origin` からの繰り返し失敗は一時的にロックアウトされる。別の localhost origin は別バケットを使う。
- その retry の後も `unauthorized` が繰り返される → shared token/device token のずれ。必要に応じて token 設定を更新し、device token を再承認/再ローテーションする。
- `gateway connect failed:` → host/port/url の指定先が誤っている。

### 認証詳細コードのクイック対応表

失敗した `connect` レスポンスの `error.details.code` を使って次のアクションを選んでください:

| Detail code                  | 意味                                                                                                                                                                            | 推奨アクション                                                                                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | クライアントが必要な shared token を送信していない。                                                                                                                            | クライアントに token を貼り付け/設定して再試行する。dashboard パスでは: `openclaw config get gateway.auth.token` を実行し、Control UI settings に貼り付ける。                                                                                                                      |
| `AUTH_TOKEN_MISMATCH`        | shared token が gateway auth token と一致しなかった。                                                                                                                           | `canRetryWithDeviceToken=true` なら、1 回だけ trusted retry を許可する。cached-token retry は保存済みの承認済み scope を再利用する。明示的な `deviceToken` / `scopes` 呼び出し側は要求した scope を維持する。それでも失敗する場合は、[token drift recovery checklist](/cli/devices#token-drift-recovery-checklist) を実行する。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | キャッシュされたデバイス単位 token が古い、または取り消されている。                                                                                                             | [devices CLI](/cli/devices) を使って device token をローテーション/再承認し、その後再接続する。                                                                                                                                                                                    |
| `PAIRING_REQUIRED`           | device identity に承認が必要。`error.details.reason` で `not-paired`、`scope-upgrade`、`role-upgrade`、または `metadata-upgrade` を確認し、存在する場合は `requestId` / `remediationHint` を使う。 | 保留中の要求を承認する: `openclaw devices list` の後に `openclaw devices approve <requestId>` を実行する。scope/role のアップグレードも、要求されたアクセスを確認した後は同じフローを使う。                                                                                           |

Device auth v2 の移行確認:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログに nonce/signature エラーが出る場合は、接続側クライアントを更新して、次を確認してください:

1. `connect.challenge` を待つ
2. challenge に束縛された payload に署名する
3. 同じ challenge nonce を使って `connect.params.device.nonce` を送信する

`openclaw devices rotate` / `revoke` / `remove` が予期せず拒否される場合:

- paired-device token セッションは、呼び出し側が `operator.admin` も持っていない限り、**自分自身** の device しか管理できない
- `openclaw devices rotate --scope ...` は、呼び出し側セッションがすでに保持している operator scope しか要求できない

関連:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/ja-JP/gateway/configuration)（gateway auth mode）
- [/gateway/trusted-proxy-auth](/ja-JP/gateway/trusted-proxy-auth)
- [/gateway/remote](/ja-JP/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway サービスが動作していない

サービスはインストールされているが、プロセスが起動したまま維持されない場合に使用します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # system レベルのサービスも走査
```

確認するポイント:

- 終了のヒント付きで `Runtime: stopped` になっている。
- サービス構成の不一致（`Config (cli)` と `Config (service)`）。
- ポート/リスナーの競合。
- `--deep` 使用時の余分な launchd/systemd/schtasks インストール。
- `Other gateway-like services detected (best effort)` のクリーンアップヒント。

よくあるシグネチャ:

- `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → local gateway mode が有効になっていないか、config ファイルが壊れて `gateway.mode` を失っています。対処: config に `gateway.mode="local"` を設定するか、`openclaw onboard --mode local` / `openclaw setup` を再実行して、期待される local-mode config を再作成してください。Podman 経由で OpenClaw を実行している場合、デフォルトの config パスは `~/.openclaw/openclaw.json` です。
- `refusing to bind gateway ... without auth` → 有効な gateway auth 経路（token/password、または設定済みの trusted-proxy）なしで non-loopback bind しようとしています。
- `another gateway instance is already listening` / `EADDRINUSE` → ポート競合。
- `Other gateway-like services detected (best effort)` → 古い、または並行する launchd/systemd/schtasks unit が存在します。ほとんどの構成では、1 台のマシンにつき 1 つの gateway にしてください。複数必要な場合は、ポート + config/state/workspace を分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。

関連:

- [/gateway/background-process](/ja-JP/gateway/background-process)
- [/gateway/configuration](/ja-JP/gateway/configuration)
- [/gateway/doctor](/ja-JP/gateway/doctor)

## Gateway が last-known-good config を復元した

Gateway は起動するが、ログに `openclaw.json` を復元したと出る場合に使用します。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

確認するポイント:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- アクティブな config の隣にタイムスタンプ付きの `openclaw.json.clobbered.*` ファイルがある
- `Config recovery warning` で始まる main-agent system event がある

起きたこと:

- 拒否された config は、起動時または hot reload 時の検証に失敗しました。
- OpenClaw は拒否された payload を `.clobbered.*` として保存しました。
- アクティブな config は、最後に検証済みだった last-known-good のコピーから復元されました。
- 次の main-agent ターンでは、拒否された config を盲目的に書き戻さないよう警告されます。

確認と修復:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

よくあるシグネチャ:

- `.clobbered.*` が存在する → 外部からの直接編集、または起動時読み込みが復元された。
- `.rejected.*` が存在する → OpenClaw 自身による config 書き込みが、commit 前に schema または clobber チェックに失敗した。
- `Config write rejected:` → 必須形状の欠落、ファイルの急激な縮小、または無効な config の永続化を試みた。
- `Config last-known-good promotion skipped` → 候補に `***` のようなマスク済みシークレットプレースホルダーが含まれていた。

対処方法:

1. 復元されたアクティブ config が正しければ、そのまま使う。
2. `.clobbered.*` または `.rejected.*` から意図したキーだけをコピーし、`openclaw config set` または `config.patch` で適用する。
3. 再起動前に `openclaw config validate` を実行する。
4. 手動編集する場合は、変更したい部分オブジェクトだけではなく、完全な JSON5 config を保つ。

関連:

- [/gateway/configuration#strict-validation](/ja-JP/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/ja-JP/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/ja-JP/gateway/doctor)

## Gateway probe の警告

`openclaw gateway probe` が何かには到達するが、それでも警告ブロックを表示する場合に使用します。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認するポイント:

- JSON 出力の `warnings[].code` と `primaryTargetId`。
- 警告が SSH フォールバック、複数 gateway、不足 scope、または未解決 auth ref のどれに関するものか。

よくあるシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH セットアップは失敗したが、コマンドは引き続き直接設定済み/loopback ターゲットを試した。
- `multiple reachable gateways detected` → 複数のターゲットが応答した。通常は意図的な multi-gateway 構成、または古い/重複した listener が原因。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続は成功したが、詳細 RPC は scope 制限を受けている。device identity をペアリングするか、`operator.read` を持つ認証情報を使用する。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → gateway は応答したが、このクライアントは通常の operator アクセス前にまだペアリング/承認が必要。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef 警告テキスト → 失敗したターゲットに対するこのコマンド経路では auth material を利用できなかった。

関連:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host)
- [/gateway/remote](/ja-JP/gateway/remote)

## Channel は接続済みだがメッセージが流れない

channel 状態は接続済みだがメッセージフローが止まっている場合は、ポリシー、権限、および channel 固有の配信ルールに注目してください。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認するポイント:

- DM policy（`pairing`、`allowlist`、`open`、`disabled`）。
- グループ allowlist とメンション必須設定。
- channel API の権限/scope 不足。

よくあるシグネチャ:

- `mention required` → グループのメンションポリシーによりメッセージが無視された。
- `pairing` / 保留中承認の痕跡 → 送信者は未承認。
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → channel の auth/権限の問題。

関連:

- [/channels/troubleshooting](/ja-JP/channels/troubleshooting)
- [/channels/whatsapp](/ja-JP/channels/whatsapp)
- [/channels/telegram](/ja-JP/channels/telegram)
- [/channels/discord](/ja-JP/channels/discord)

## Cron と Heartbeat の配信

Cron または Heartbeat が実行されなかった、あるいは配信されなかった場合は、まず scheduler 状態を確認し、その後で配信先を確認してください。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認するポイント:

- Cron が有効で、次回 wake が存在する。
- ジョブ実行履歴の状態（`ok`、`skipped`、`error`）。
- Heartbeat の skip reason（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

よくあるシグネチャ:

- `cron: scheduler disabled; jobs will not run automatically` → Cron が無効。
- `cron: timer tick failed` → scheduler の tick に失敗。ファイル/ログ/runtime エラーを確認する。
- `heartbeat skipped` かつ `reason=quiet-hours` → アクティブ時間帯の外。
- `heartbeat skipped` かつ `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在するが、空行または markdown 見出ししか含まれていないため、OpenClaw はモデル呼び出しをスキップする。
- `heartbeat skipped` かつ `reason=no-tasks-due` → `HEARTBEAT.md` に `tasks:` ブロックはあるが、この tick で期限到来したタスクがない。
- `heartbeat: unknown accountId` → Heartbeat 配信先の account id が無効。
- `heartbeat skipped` かつ `reason=dm-blocked` → Heartbeat のターゲットが DM 形式の送信先に解決されたが、`agents.defaults.heartbeat.directPolicy`（または agent 単位上書き）が `block` に設定されている。

関連:

- [/automation/cron-jobs#troubleshooting](/ja-JP/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ja-JP/automation/cron-jobs)
- [/gateway/heartbeat](/ja-JP/gateway/heartbeat)

## ペアリング済み Node のツールが失敗する

Node はペアリング済みだがツールが失敗する場合は、foreground、権限、および承認状態を切り分けてください。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認するポイント:

- Node がオンラインで、期待どおりの capability を持っている。
- camera/mic/location/screen に対する OS 権限が付与されている。
- Exec 承認と allowlist の状態。

よくあるシグネチャ:

- `NODE_BACKGROUND_UNAVAILABLE` → Node app が foreground にある必要がある。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 権限が不足している。
- `SYSTEM_RUN_DENIED: approval required` → exec 承認が保留中。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが allowlist によりブロックされた。

関連:

- [/nodes/troubleshooting](/ja-JP/nodes/troubleshooting)
- [/nodes/index](/ja-JP/nodes/index)
- [/tools/exec-approvals](/ja-JP/tools/exec-approvals)

## ブラウザーツールが失敗する

gateway 自体は正常なのに browser tool のアクションが失敗する場合に使用します。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認するポイント:

- `plugins.allow` が設定されており、`browser` を含んでいるか。
- 有効なブラウザー実行ファイルパス。
- CDP profile への到達性。
- `existing-session` / `user` profile 用のローカル Chrome の可用性。

よくあるシグネチャ:

- `unknown command "browser"` または `unknown command 'browser'` → 同梱 browser Plugin が `plugins.allow` によって除外されている。
- `browser.enabled=true` なのに browser tool がない / 利用不可 → `plugins.allow` が `browser` を除外しているため、Plugin が読み込まれていない。
- `Failed to start Chrome CDP on port` → browser プロセスの起動に失敗した。
- `browser.executablePath not found` → 設定されたパスが無効。
- `browser.cdpUrl must be http(s) or ws(s)` → 設定された CDP URL が `file:` や `ftp:` など未対応の scheme を使っている。
- `browser.cdpUrl has invalid port` → 設定された CDP URL のポートが不正、または範囲外。
- `No Chrome tabs found for profile="user"` → Chrome MCP attach profile に開いているローカル Chrome タブがない。
- `Remote CDP for profile "<name>" is not reachable` → 設定されたリモート CDP endpoint に gateway host から到達できない。
- `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only profile に到達可能なターゲットがない、または HTTP endpoint は応答したが CDP WebSocket をまだ開けなかった。
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在の gateway インストールには完全な Playwright パッケージがない。ARIA スナップショットと基本的なページスクリーンショットは動作することがあるが、ナビゲーション、AI スナップショット、CSS セレクターによる要素スクリーンショット、および PDF エクスポートは利用できない。
- `fullPage is not supported for element screenshots` → スクリーンショット要求で `--full-page` と `--ref` または `--element` を混在させている。
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` のスクリーンショット呼び出しでは、CSS `--element` ではなく、ページキャプチャまたはスナップショットの `--ref` を使う必要がある。
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP のアップロードフックでは、CSS セレクターではなくスナップショット参照が必要。
- `existing-session file uploads currently support one file at a time.` → Chrome MCP profile では、1 回の呼び出しにつき 1 ファイルずつアップロードする。
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profile の dialog フックは timeout 上書きをサポートしない。
- `response body is not supported for existing-session profiles yet.` → `responsebody` は、引き続き managed browser または raw CDP profile が必要。
- attach-only または remote CDP profile で viewport / dark-mode / locale / offline 上書きが古いまま残る → `openclaw browser stop --browser-profile <name>` を実行して、gateway 全体を再起動せずにアクティブな control session を閉じ、Playwright/CDP のエミュレーション状態を解放する。

関連:

- [/tools/browser-linux-troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)
- [/tools/browser](/ja-JP/tools/browser)

## アップグレード後に突然何かが壊れた場合

アップグレード後の不具合の多くは、config drift またはより厳格なデフォルトが新たに適用されたことが原因です。

### 1) Auth と URL 上書きの挙動が変わった

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

確認するポイント:

- `gateway.mode=remote` の場合、ローカルサービスは正常でも CLI 呼び出しが remote を対象にしている可能性がある。
- 明示的な `--url` 呼び出しは、保存済み認証情報にはフォールバックしない。

よくあるシグネチャ:

- `gateway connect failed:` → URL の指定先が誤っている。
- `unauthorized` → endpoint には到達しているが auth が誤っている。

### 2) Bind と auth のガードレールがより厳格になった

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

確認するポイント:

- non-loopback bind（`lan`、`tailnet`、`custom`）には、有効な gateway auth 経路が必要です: shared token/password auth、または正しく構成された non-loopback の `trusted-proxy` デプロイ。
- `gateway.token` のような古いキーは、`gateway.auth.token` の代わりにはなりません。

よくあるシグネチャ:

- `refusing to bind gateway ... without auth` → 有効な gateway auth 経路なしで non-loopback bind している。
- runtime は動作しているのに `Connectivity probe: failed` → gateway は生きているが、現在の auth/url ではアクセスできない。

### 3) Pairing と device identity の状態が変わった

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

確認するポイント:

- dashboard/nodes に対する保留中の device 承認。
- policy または identity の変更後に保留中になっている DM pairing 承認。

よくあるシグネチャ:

- `device identity required` → device auth が満たされていない。
- `pairing required` → 送信者/デバイスの承認が必要。

確認後もサービス config と runtime が一致しない場合は、同じ profile/state ディレクトリからサービスメタデータを再インストールしてください:

```bash
openclaw gateway install --force
openclaw gateway restart
```

関連:

- [/gateway/pairing](/ja-JP/gateway/pairing)
- [/gateway/authentication](/ja-JP/gateway/authentication)
- [/gateway/background-process](/ja-JP/gateway/background-process)
