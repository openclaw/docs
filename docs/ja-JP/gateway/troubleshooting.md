---
read_when:
    - トラブルシューティングハブから、より詳細な診断のためにここへ案内されました
    - 症状別の安定したランブックセクションと正確なコマンドが必要です
sidebarTitle: Troubleshooting
summary: gateway、チャンネル、自動化、node、Browser向けの詳細なトラブルシューティングランブック
title: トラブルシューティング
x-i18n:
    generated_at: "2026-04-26T11:32:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc6b2a0e8522a761dcee0a3b9bc024eefbd7a5ab4118fc090401868a571bcf
    source_path: gateway/troubleshooting.md
    workflow: 15
---

このページは詳細ランブックです。まず高速トリアージフローを使いたい場合は [/help/troubleshooting](/ja-JP/help/troubleshooting) から始めてください。

## コマンドラダー

まず、次の順に実行してください。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常時に期待されるシグナル:

- `openclaw gateway status` に `Runtime: running`、`Connectivity probe: ok`、および `Capability: ...` 行が表示される。
- `openclaw doctor` が設定/サービスに関するブロッキング問題を報告しない。
- `openclaw channels status --probe` が、アカウントごとのライブ転送状態と、サポートされている場合は `works` や `audit ok` のようなprobe/audit結果を表示する。

## split brainインストールと新しい設定ガード

更新後にgatewayサービスが予期せず停止した場合、またはログに、ある `openclaw` バイナリが `openclaw.json` を最後に書き込んだバージョンより古いと表示される場合に使用します。

OpenClawは設定書き込み時に `meta.lastTouchedVersion` を記録します。読み取り専用コマンドは新しいOpenClawによって書かれた設定を引き続き検査できますが、古いバイナリからのプロセスおよびサービス変更は続行を拒否します。ブロックされる操作には、gatewayサービスの開始、停止、再起動、アンインストール、強制サービス再インストール、サービスモードのgateway起動、および `gateway --force` ポートクリーンアップが含まれます。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATHを修正する">
    `openclaw` が新しいインストール先を指すように `PATH` を修正し、その後アクションを再実行します。
  </Step>
  <Step title="gatewayサービスを再インストールする">
    新しいインストール先から、意図したgatewayサービスを再インストールします。

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="古いラッパーを削除する">
    古い `openclaw` バイナリをまだ指している、古いシステムパッケージまたはラッパーエントリを削除します。
  </Step>
</Steps>

<Warning>
意図的なダウングレードまたは緊急復旧の場合に限り、その単一コマンドに対して `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` を設定してください。通常運用では未設定のままにしてください。
</Warning>

## 長いコンテキストに対するAnthropic 429 extra usage required

ログ/エラーに `HTTP 429: rate_limit_error: Extra usage is required for long context requests` が含まれる場合に使用します。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認ポイント:

- 選択されたAnthropic Opus/Sonnetモデルに `params.context1m: true` がある。
- 現在のAnthropic認証情報が長いコンテキスト利用の対象ではない。
- リクエストが失敗するのは、1M beta経路を必要とする長いセッション/モデル実行時のみである。

修正オプション:

<Steps>
  <Step title="context1mを無効化する">
    そのモデルの `context1m` を無効化し、通常のコンテキストウィンドウにフォールバックします。
  </Step>
  <Step title="対象の認証情報を使用する">
    長いコンテキストリクエストに対応したAnthropic認証情報を使用するか、Anthropic APIキーへ切り替えます。
  </Step>
  <Step title="フォールバックモデルを設定する">
    Anthropicの長いコンテキストリクエストが拒否された場合でも実行が継続するよう、フォールバックモデルを設定します。
  </Step>
</Steps>

関連:

- [Anthropic](/ja-JP/providers/anthropic)
- [Token use and costs](/ja-JP/reference/token-use)
- [Why am I seeing HTTP 429 from Anthropic?](/ja-JP/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ローカルのOpenAI互換バックエンドは直接probeでは通るがagent実行は失敗する

次の場合に使用します。

- `curl ... /v1/models` は動作する
- 小さな直接 `/v1/chat/completions` 呼び出しは動作する
- OpenClawのモデル実行は通常のagentターンでのみ失敗する

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

確認ポイント:

- 直接の小さな呼び出しは成功するが、OpenClawの実行はより大きなプロンプトでのみ失敗する
- バックエンドエラーが、`messages[].content` に文字列を期待している
- バックエンドクラッシュが、より大きなprompt-token数または完全なagentランタイムプロンプトでのみ発生する

<AccordionGroup>
  <Accordion title="よくあるシグネチャ">
    - `messages[...].content: invalid type: sequence, expected a string` → バックエンドが構造化されたChat Completionsコンテンツパーツを拒否しています。修正: `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
    - 直接の小さなリクエストは成功するが、OpenClawのagent実行がバックエンド/モデルクラッシュで失敗する（たとえば一部の `inferrs` ビルド上のGemma） → OpenClawの転送自体はすでに正しい可能性が高く、バックエンドがより大きなagentランタイムプロンプト形式で失敗しています。
    - toolsを無効化すると失敗は減るが消えない → tool schemaが負荷の一部だっただけで、残る問題は依然として上流のモデル/サーバー容量またはバックエンドバグです。

  </Accordion>
  <Accordion title="修正オプション">
    1. 文字列のみのChat Completionsバックエンドに対して `compat.requiresStringContent: true` を設定します。
    2. OpenClawのtool schemaサーフェスを安定して処理できないモデル/バックエンドに対して `compat.supportsTools: false` を設定します。
    3. 可能であればプロンプト負荷を下げます: より小さいworkspace bootstrap、より短いセッション履歴、より軽量なローカルモデル、または長いコンテキスト対応が強いバックエンド。
    4. 直接の小さなリクエストが通り続ける一方で、OpenClawのagentターンがバックエンド内部でなおクラッシュする場合は、上流のサーバー/モデル制限として扱い、受理されたペイロード形式を添えてそこで再現報告を行ってください。
  </Accordion>
</AccordionGroup>

関連:

- [Configuration](/ja-JP/gateway/configuration)
- [Local models](/ja-JP/gateway/local-models)
- [OpenAI-compatible endpoints](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)

## 返信がない

チャンネルは稼働しているのに何も応答しない場合は、何かを再接続する前にルーティングとポリシーを確認してください。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認ポイント:

- DM送信者のペアリングが保留中。
- グループのメンション必須設定（`requireMention`, `mentionPatterns`）。
- チャンネル/グループのallowlist不一致。

よくあるシグネチャ:

- `drop guild message (mention required` → メンションされるまでグループメッセージは無視されます。
- `pairing request` → 送信者には承認が必要です。
- `blocked` / `allowlist` → 送信者/チャンネルがポリシーによりフィルタされました。

関連:

- [Channel troubleshooting](/ja-JP/channels/troubleshooting)
- [Groups](/ja-JP/channels/groups)
- [Pairing](/ja-JP/channels/pairing)

## ダッシュボードControl UI接続性

dashboard/control UIが接続できない場合は、URL、認証モード、安全なコンテキスト前提を検証してください。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認ポイント:

- 正しいprobe URLとdashboard URL。
- クライアントとgateway間の認証モード/トークン不一致。
- デバイスアイデンティティが必要な場面でHTTPを使っている。

<AccordionGroup>
  <Accordion title="接続 / 認証シグネチャ">
    - `device identity required` → 安全でないコンテキスト、またはデバイス認証が欠落しています。
    - `origin not allowed` → browserの `Origin` が `gateway.controlUi.allowedOrigins` に入っていない（または明示的なallowlistなしでloopback以外のbrowser originから接続している）。
    - `device nonce required` / `device nonce mismatch` → クライアントがchallengeベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していません。
    - `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったペイロード（または古いタイムスタンプ）に署名しました。
    - `AUTH_TOKEN_MISMATCH` と `canRetryWithDeviceToken=true` → クライアントはキャッシュ済みdevice tokenで1回だけ信頼済みリトライできます。
    - そのキャッシュトークンのリトライでは、ペアリング済みdevice tokenと一緒に保存されたキャッシュ済みscope集合を再利用します。明示的な `deviceToken` / 明示的な `scopes` 呼び出し元は、要求したscope集合を維持します。
    - そのリトライ経路以外では、接続認証の優先順位は、明示的な共有token/passwordが先、その後に明示的な `deviceToken`、保存済みdevice token、bootstrap tokenの順です。
    - 非同期のTailscale Serve Control UI経路では、同じ `{scope, ip}` に対する失敗試行は、リミッターが失敗を記録する前に直列化されます。そのため、同じクライアントからの2回の悪い同時リトライでは、2回とも単純な不一致になる代わりに、2回目が `retry later` になることがあります。
    - browser originのloopbackクライアントからの `too many failed authentication attempts (retry later)` → 同じ正規化済み `Origin` からの繰り返し失敗は一時的にロックアウトされます。別のlocalhost originは別バケットを使用します。
    - そのリトライ後も `unauthorized` が繰り返される → 共有token/device tokenのドリフトです。トークン設定を更新し、必要ならdevice tokenを再承認/ローテーションしてください。
    - `gateway connect failed:` → host/port/urlターゲットが誤っています。

  </Accordion>
</AccordionGroup>

### 認証詳細コードのクイックマップ

次のアクションを選ぶには、失敗した `connect` レスポンスの `error.details.code` を使用してください。

| Detail code                  | 意味                                                                                                                                                                             | 推奨アクション                                                                                                                                                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | クライアントが必要な共有トークンを送信していません。                                                                                                                            | クライアントにトークンを貼り付け/設定して再試行してください。dashboard経路では: `openclaw config get gateway.auth.token` を実行し、それをControl UI設定に貼り付けます。                                                                                                                |
| `AUTH_TOKEN_MISMATCH`        | 共有トークンがgateway認証トークンと一致しませんでした。                                                                                                                          | `canRetryWithDeviceToken=true` なら、信頼済みの1回リトライを許可します。キャッシュトークンリトライは保存済みの承認scopeを再利用します。明示的な `deviceToken` / `scopes` 呼び出し元は要求scopeを維持します。それでも失敗する場合は、[token drift recovery checklist](/ja-JP/cli/devices#token-drift-recovery-checklist) を実行してください。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | デバイス単位のキャッシュ済みトークンが古いか失効しています。                                                                                                                    | [devices CLI](/ja-JP/cli/devices) を使ってdevice tokenをローテーション/再承認してから再接続してください。                                                                                                                                                                                       |
| `PAIRING_REQUIRED`           | デバイスアイデンティティに承認が必要です。`error.details.reason` で `not-paired`, `scope-upgrade`, `role-upgrade`, `metadata-upgrade` を確認し、存在する場合は `requestId` / `remediationHint` を使用してください。 | 保留中リクエストを承認します: `openclaw devices list` の後に `openclaw devices approve <requestId>`。scope/roleアップグレードも、要求アクセスを確認した後、同じフローを使います。                                                                                                      |

<Note>
共有gateway token/passwordで認証された直接のloopbackバックエンドRPCは、CLIのペアリング済みデバイスscope基準に依存すべきではありません。subagentやその他の内部呼び出しが引き続き `scope-upgrade` で失敗する場合は、呼び出し元が `client.id: "gateway-client"` と `client.mode: "backend"` を使用していて、明示的な `deviceIdentity` やdevice tokenを強制していないことを確認してください。
</Note>

デバイス認証v2移行チェック:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログにnonce/signatureエラーがある場合は、接続側クライアントを更新し、次を確認してください。

<Steps>
  <Step title="connect.challengeを待つ">
    クライアントはgatewayが発行した `connect.challenge` を待ちます。
  </Step>
  <Step title="ペイロードに署名する">
    クライアントはchallengeに束縛されたペイロードに署名します。
  </Step>
  <Step title="デバイスnonceを送信する">
    クライアントは同じchallenge nonceを含む `connect.params.device.nonce` を送信します。
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` が予期せず拒否される場合:

- ペアリング済みデバイストークンセッションは、呼び出し元が `operator.admin` も持っていない限り、**自分自身の** デバイスしか管理できません
- `openclaw devices rotate --scope ...` は、呼び出し元セッションがすでに持っているoperator scopeしか要求できません

関連:

- [Configuration](/ja-JP/gateway/configuration)（gateway auth modes）
- [Control UI](/ja-JP/web/control-ui)
- [Devices](/ja-JP/cli/devices)
- [Remote access](/ja-JP/gateway/remote)
- [Trusted proxy auth](/ja-JP/gateway/trusted-proxy-auth)

## Gatewayサービスが実行されていない

サービスはインストール済みだが、プロセスが起動し続けない場合に使用します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # システムレベルのサービスもスキャン
```

確認ポイント:

- 終了ヒント付きの `Runtime: stopped`。
- サービス設定不一致（`Config (cli)` vs `Config (service)`）。
- ポート/リスナー競合。
- `--deep` 使用時の追加の launchd/systemd/schtasks インストール。
- `Other gateway-like services detected (best effort)` のクリーンアップヒント。

<AccordionGroup>
  <Accordion title="よくあるシグネチャ">
    - `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → ローカルgatewayモードが有効ではないか、設定ファイルが壊れて `gateway.mode` が失われています。修正: 設定に `gateway.mode="local"` を設定するか、`openclaw onboard --mode local` / `openclaw setup` を再実行して、期待されるlocal-mode設定を再記録してください。Podman経由でOpenClawを実行している場合、デフォルトの設定パスは `~/.openclaw/openclaw.json` です。
    - `refusing to bind gateway ... without auth` → 有効なgateway認証経路（token/password、または設定済みのtrusted-proxy）がない状態での非loopback bindです。
    - `another gateway instance is already listening` / `EADDRINUSE` → ポート競合です。
    - `Other gateway-like services detected (best effort)` → 古いまたは並列の launchd/systemd/schtasks unit が存在します。ほとんどの構成ではマシンごとに1つのgatewayを維持すべきです。複数必要な場合は、ポート + config/state/workspace を分離してください。参照: [/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host)。

  </Accordion>
</AccordionGroup>

関連:

- [Background exec and process tool](/ja-JP/gateway/background-process)
- [Configuration](/ja-JP/gateway/configuration)
- [Doctor](/ja-JP/gateway/doctor)

## Gatewayがlast-known-good設定を復元した

Gatewayは起動するが、ログに `openclaw.json` を復元したと出る場合に使用します。

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
- アクティブ設定の隣にあるタイムスタンプ付き `openclaw.json.clobbered.*` ファイル
- `Config recovery warning` で始まるmain-agentシステムイベント

<AccordionGroup>
  <Accordion title="何が起きたか">
    - 拒否された設定は、起動時またはhot reload時の検証に通りませんでした。
    - OpenClawは拒否されたペイロードを `.clobbered.*` として保存しました。
    - アクティブ設定は、最後に検証済みだったlast-known-goodコピーから復元されました。
    - 次のmain-agentターンでは、拒否された設定をむやみに書き直さないよう警告されます。
    - すべての検証問題が `plugins.entries.<id>...` 配下にあった場合、OpenClawはファイル全体を復元しません。Pluginローカルの失敗は明示的なままにしつつ、関係ないユーザー設定はアクティブ設定に残ります。

  </Accordion>
  <Accordion title="確認と修復">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="よくあるシグネチャ">
    - `.clobbered.*` が存在する → 外部の直接編集または起動時読み取りが復元されました。
    - `.rejected.*` が存在する → OpenClaw自身の設定書き込みが、コミット前にスキーマまたは上書きチェックに失敗しました。
    - `Config write rejected:` → 書き込みが、必須構造の削除、大幅なファイル縮小、または無効設定の永続化を試みました。
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, または `size-drop-vs-last-good:*` → 起動時に、現在ファイルがlast-known-goodバックアップと比べてフィールドやサイズを失っていたため、破損と見なされました。
    - `Config last-known-good promotion skipped` → 候補に `***` のようなマスク済みシークレットプレースホルダーが含まれていました。

  </Accordion>
  <Accordion title="修正オプション">
    1. 復元されたアクティブ設定が正しければ、そのまま維持します。
    2. `.clobbered.*` または `.rejected.*` から意図したキーだけをコピーし、`openclaw config set` または `config.patch` で適用します。
    3. 再起動前に `openclaw config validate` を実行します。
    4. 手動編集する場合は、変更したい部分オブジェクトだけでなく、完全なJSON5設定を維持してください。
  </Accordion>
</AccordionGroup>

関連:

- [Config](/ja-JP/cli/config)
- [Configuration: hot reload](/ja-JP/gateway/configuration#config-hot-reload)
- [Configuration: strict validation](/ja-JP/gateway/configuration#strict-validation)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway probe警告

`openclaw gateway probe` が何かには到達するが、それでも警告ブロックを表示する場合に使用します。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認ポイント:

- JSON出力内の `warnings[].code` と `primaryTargetId`。
- 警告がSSHフォールバック、複数gateway、scope不足、未解決auth refのどれに関するものか。

よくあるシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH設定に失敗しましたが、コマンドは引き続き直接の設定済み/loopbackターゲットを試しました。
- `multiple reachable gateways detected` → 複数のターゲットが応答しました。通常は意図的な複数gateway構成か、古い/重複リスナーを意味します。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続は成功しましたが、詳細RPCはscope制限されています。デバイスアイデンティティをペアリングするか、`operator.read` を持つ認証情報を使用してください。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → gatewayは応答しましたが、このクライアントは通常のoperatorアクセスの前にまだペアリング/承認が必要です。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文 → 失敗したターゲットに対して、このコマンド経路では認証情報が利用できませんでした。

関連:

- [Gateway](/ja-JP/cli/gateway)
- [Multiple gateways on the same host](/ja-JP/gateway#multiple-gateways-same-host)
- [Remote access](/ja-JP/gateway/remote)

## チャンネルは接続済みだがメッセージが流れない

チャンネル状態が接続済みなのにメッセージフローが止まっている場合は、ポリシー、権限、チャンネル固有の配信ルールに注目してください。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認ポイント:

- DMポリシー（`pairing`, `allowlist`, `open`, `disabled`）。
- グループallowlistとメンション必須条件。
- 不足しているチャンネルAPI権限/scope。

よくあるシグネチャ:

- `mention required` → グループのメンションポリシーによりメッセージが無視されました。
- `pairing` / 保留中承認のトレース → 送信者が未承認です。
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → チャンネル認証/権限の問題です。

関連:

- [Channel troubleshooting](/ja-JP/channels/troubleshooting)
- [Discord](/ja-JP/channels/discord)
- [Telegram](/ja-JP/channels/telegram)
- [WhatsApp](/ja-JP/channels/whatsapp)

## CronとHeartbeat配信

CronまたはHeartbeatが実行されなかった、あるいは配信されなかった場合は、まずscheduler状態、次に配信ターゲットを確認してください。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認ポイント:

- Cronが有効で、次回起動予定がある。
- ジョブ実行履歴の状態（`ok`, `skipped`, `error`）。
- Heartbeatスキップ理由（`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`）。

<AccordionGroup>
  <Accordion title="よくあるシグネチャ">
    - `cron: scheduler disabled; jobs will not run automatically` → cronが無効です。
    - `cron: timer tick failed` → scheduler tickが失敗しました。ファイル/ログ/ランタイムエラーを確認してください。
    - `heartbeat skipped` と `reason=quiet-hours` → アクティブ時間外です。
    - `heartbeat skipped` と `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在しますが、空行またはmarkdown見出ししか含まれていないため、OpenClawはモデル呼び出しをスキップします。
    - `heartbeat skipped` と `reason=no-tasks-due` → `HEARTBEAT.md` に `tasks:` ブロックはありますが、このtick時点で期限のタスクがありません。
    - `heartbeat: unknown accountId` → Heartbeat配信ターゲットのaccount idが無効です。
    - `heartbeat skipped` と `reason=dm-blocked` → HeartbeatターゲットがDM形式の宛先に解決されましたが、`agents.defaults.heartbeat.directPolicy`（またはagentごとの上書き）が `block` に設定されています。

  </Accordion>
</AccordionGroup>

関連:

- [Heartbeat](/ja-JP/gateway/heartbeat)
- [Scheduled tasks](/ja-JP/automation/cron-jobs)
- [Scheduled tasks: troubleshooting](/ja-JP/automation/cron-jobs#troubleshooting)

## Nodeはペアリング済みだがtoolが失敗する

nodeはペアリング済みなのにtoolが失敗する場合は、foreground、権限、承認状態を切り分けてください。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認ポイント:

- nodeがオンラインで、期待される機能を持っている。
- camera/mic/location/screen に対するOS権限許可。
- exec承認とallowlist状態。

よくあるシグネチャ:

- `NODE_BACKGROUND_UNAVAILABLE` → nodeアプリはforegroundである必要があります。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS権限が不足しています。
- `SYSTEM_RUN_DENIED: approval required` → exec承認が保留中です。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドがallowlistでブロックされました。

関連:

- [Exec approvals](/ja-JP/tools/exec-approvals)
- [Node troubleshooting](/ja-JP/nodes/troubleshooting)
- [Nodes](/ja-JP/nodes/index)

## Browserツールが失敗する

gateway自体は正常なのにBrowserツールアクションが失敗する場合に使用します。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認ポイント:

- `plugins.allow` が設定されていて `browser` を含んでいるか。
- 有効なBrowser実行ファイルパス。
- CDPプロファイルの到達可能性。
- `existing-session` / `user` プロファイル向けのローカルChromeの可用性。

<AccordionGroup>
  <Accordion title="Plugin / 実行ファイルのシグネチャ">
    - `unknown command "browser"` または `unknown command 'browser'` → バンドルされたbrowser Pluginが `plugins.allow` によって除外されています。
    - `browser.enabled=true` なのにbrowserツールが見つからない / 利用できない → `plugins.allow` が `browser` を除外しているため、Pluginが読み込まれていません。
    - `Failed to start Chrome CDP on port` → Browserプロセスの起動に失敗しました。
    - `browser.executablePath not found` → 設定されたパスが無効です。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定されたCDP URLが `file:` や `ftp:` のような未対応スキームを使っています。
    - `browser.cdpUrl has invalid port` → 設定されたCDP URLのポートが不正、または範囲外です。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在のgatewayインストールには、バンドルされたbrowser Pluginの `playwright-core` ランタイム依存関係がありません。`openclaw doctor --fix` を実行してからgatewayを再起動してください。ARIAスナップショットと基本的なページスクリーンショットは引き続き動作することがありますが、ナビゲーション、AIスナップショット、CSSセレクター要素スクリーンショット、PDFエクスポートは引き続き利用できません。

  </Accordion>
  <Accordion title="Chrome MCP / existing-session のシグネチャ">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session が、選択されたBrowserデータディレクトリにまだ接続できませんでした。Browser inspectページを開き、リモートデバッグを有効にし、Browserを開いたままにして、最初の接続プロンプトを承認してから再試行してください。サインイン状態が不要なら、管理された `openclaw` プロファイルを推奨します。
    - `No Chrome tabs found for profile="user"` → Chrome MCP接続プロファイルに、開いているローカルChromeタブがありません。
    - `Remote CDP for profile "<name>" is not reachable` → 設定されたリモートCDPエンドポイントにgatewayホストから到達できません。
    - `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-onlyプロファイルに到達可能なターゲットがないか、HTTPエンドポイントは応答したもののCDP WebSocketを開けませんでした。

  </Accordion>
  <Accordion title="要素 / スクリーンショット / アップロードのシグネチャ">
    - `fullPage is not supported for element screenshots` → スクリーンショット要求で `--full-page` と `--ref` または `--element` を混在させています。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` のスクリーンショット呼び出しでは、CSS `--element` ではなくページキャプチャまたはスナップショットの `--ref` を使用する必要があります。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCPのアップロードフックでは、CSSセレクターではなくスナップショットrefが必要です。
    - `existing-session file uploads currently support one file at a time.` → Chrome MCPプロファイルでは、アップロードは1回の呼び出しにつき1ファイルずつ送信してください。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCPプロファイル上のダイアログフックでは、タイムアウト上書きはサポートされません。
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session プロファイルでは `act:type` に `timeoutMs` を指定しないでください。カスタムタイムアウトが必要な場合は管理Browser/CDPプロファイルを使用してください。
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session プロファイルでは `act:evaluate` に `timeoutMs` を指定しないでください。カスタムタイムアウトが必要な場合は管理Browser/CDPプロファイルを使用してください。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` には、引き続き管理Browserまたは生のCDPプロファイルが必要です。
    - attach-only またはリモートCDPプロファイルで viewport / dark-mode / locale / offline 上書きが古いまま残る → `openclaw browser stop --browser-profile <name>` を実行して、gateway全体を再起動せずに、アクティブな制御セッションを閉じ、Playwright/CDPエミュレーション状態を解放してください。

  </Accordion>
</AccordionGroup>

関連:

- [Browser (OpenClaw-managed)](/ja-JP/tools/browser)
- [Browser troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)

## アップグレード後に突然何かが壊れた場合

アップグレード後の不具合の多くは、設定ドリフトか、より厳格なデフォルトが現在適用されていることが原因です。

<AccordionGroup>
  <Accordion title="1. 認証とURL上書きの挙動が変わった">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    確認すること:

    - `gateway.mode=remote` の場合、ローカルサービスは正常でもCLI呼び出しがリモートを対象にしていることがあります。
    - 明示的な `--url` 呼び出しは、保存済み認証情報にフォールバックしません。

    よくあるシグネチャ:

    - `gateway connect failed:` → URLターゲットが誤っています。
    - `unauthorized` → エンドポイントには到達できていますが、認証が誤っています。

  </Accordion>
  <Accordion title="2. bindと認証のガードレールがより厳格になった">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    確認すること:

    - 非loopback bind（`lan`, `tailnet`, `custom`）には有効なgateway認証経路が必要です: 共有token/password認証、または正しく設定された非loopback `trusted-proxy` デプロイ。
    - `gateway.token` のような古いキーは `gateway.auth.token` の代わりにはなりません。

    よくあるシグネチャ:

    - `refusing to bind gateway ... without auth` → 有効なgateway認証経路なしでの非loopback bindです。
    - ランタイムは動いているのに `Connectivity probe: failed` → gatewayは生きていますが、現在のauth/urlでは到達できません。

  </Accordion>
  <Accordion title="3. ペアリングとデバイスアイデンティティ状態が変わった">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    確認すること:

    - dashboard/node向けの保留中デバイス承認。
    - ポリシーまたはアイデンティティ変更後の、保留中DMペアリング承認。

    よくあるシグネチャ:

    - `device identity required` → デバイス認証が満たされていません。
    - `pairing required` → 送信者/デバイスに承認が必要です。

  </Accordion>
</AccordionGroup>

確認後もサービス設定とランタイムが一致しない場合は、同じプロファイル/状態ディレクトリからサービスメタデータを再インストールしてください。

```bash
openclaw gateway install --force
openclaw gateway restart
```

関連:

- [Authentication](/ja-JP/gateway/authentication)
- [Background exec and process tool](/ja-JP/gateway/background-process)
- [Gateway-owned pairing](/ja-JP/gateway/pairing)

## 関連

- [Doctor](/ja-JP/gateway/doctor)
- [FAQ](/ja-JP/help/faq)
- [Gateway runbook](/ja-JP/gateway)
