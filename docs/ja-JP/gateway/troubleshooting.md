---
read_when:
    - トラブルシューティングハブから、より詳細な診断のためにここへ案内されました
    - 正確なコマンドを含む、症状ベースの安定したランブックセクションが必要です
sidebarTitle: Troubleshooting
summary: Gateway、チャンネル、自動化、ノード、ブラウザー向けの詳細なトラブルシューティングランブック
title: トラブルシューティング
x-i18n:
    generated_at: "2026-05-03T21:34:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19422615706ca09124b19dd3e21b2c13391d6daf2b1807e01b4ce2047d02e522
    source_path: gateway/troubleshooting.md
    workflow: 16
---

このページは詳細なランブックです。まず高速なトリアージフローを使いたい場合は、[/help/troubleshooting](/ja-JP/help/troubleshooting) から始めてください。

## コマンド手順

最初にこの順序で実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常時に期待されるシグナル:

- `openclaw gateway status` に `Runtime: running`、`Connectivity probe: ok`、および `Capability: ...` 行が表示される。
- `openclaw doctor` が、ブロック要因となる設定/サービスの問題を報告しない。
- `openclaw channels status --probe` がアカウントごとのライブなトランスポート状態を表示し、サポートされる場合は `works` や `audit ok` などのプローブ/監査結果も表示する。

## 分裂したインストールと新しい設定ガード

更新後に Gateway サービスが予期せず停止する場合、またはログで、ある `openclaw` バイナリが `openclaw.json` を最後に書き込んだバージョンより古いことが示される場合に使用します。

OpenClaw は設定書き込みに `meta.lastTouchedVersion` を記録します。読み取り専用コマンドは、新しい OpenClaw によって書き込まれた設定を引き続き検査できますが、古いバイナリからのプロセスおよびサービスの変更は続行を拒否します。ブロックされる操作には、Gateway サービスの開始、停止、再起動、アンインストール、強制サービス再インストール、サービスモードでの Gateway 起動、`gateway --force` によるポートクリーンアップが含まれます。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH を修正">
    `PATH` を修正して `openclaw` が新しいインストールを指すようにし、その後アクションを再実行します。
  </Step>
  <Step title="Gateway サービスを再インストール">
    新しいインストールから意図した Gateway サービスを再インストールします。

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="古いラッパーを削除">
    古い `openclaw` バイナリをまだ指している古いシステムパッケージまたはラッパーエントリを削除します。
  </Step>
</Steps>

<Warning>
意図的なダウングレードまたは緊急復旧の場合のみ、単一のコマンドに対して `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` を設定します。通常運用では未設定のままにしてください。
</Warning>

## Anthropic 429 で長いコンテキストに追加使用量が必要

ログ/エラーに `HTTP 429: rate_limit_error: Extra usage is required for long context requests` が含まれる場合に使用します。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認する点:

- 選択された Anthropic Opus/Sonnet モデルに `params.context1m: true` がある。
- 現在の Anthropic 認証情報が長いコンテキストの使用対象ではない。
- リクエストが、1M ベータパスを必要とする長いセッション/モデル実行でのみ失敗する。

修正オプション:

<Steps>
  <Step title="context1m を無効化">
    そのモデルの `context1m` を無効化し、通常のコンテキストウィンドウにフォールバックします。
  </Step>
  <Step title="対象の認証情報を使用">
    長いコンテキストリクエストの対象である Anthropic 認証情報を使用するか、Anthropic API キーに切り替えます。
  </Step>
  <Step title="フォールバックモデルを設定">
    Anthropic の長いコンテキストリクエストが拒否された場合でも実行が続くように、フォールバックモデルを設定します。
  </Step>
</Steps>

関連:

- [Anthropic](/ja-JP/providers/anthropic)
- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [Anthropic から HTTP 429 が表示されるのはなぜですか？](/ja-JP/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ローカルの OpenAI 互換バックエンドは直接プローブに合格するが、エージェント実行が失敗する

次の場合に使用します。

- `curl ... /v1/models` が動作する
- 小さな直接 `/v1/chat/completions` 呼び出しが動作する
- OpenClaw モデル実行が通常のエージェントターンでのみ失敗する

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

確認する点:

- 直接の小さな呼び出しは成功するが、OpenClaw 実行は大きなプロンプトでのみ失敗する
- 同じ素のモデル ID で直接 `/v1/chat/completions` が動作するにもかかわらず、`model_not_found` または 404 エラーが発生する
- `messages[].content` が文字列を期待しているというバックエンドエラー
- OpenAI 互換ローカルバックエンドで、断続的な `incomplete turn detected ... stopReason=stop payloads=0` 警告が出る
- 大きなプロンプトトークン数または完全なエージェントランタイムプロンプトでのみ発生するバックエンドクラッシュ

<AccordionGroup>
  <Accordion title="一般的な兆候">
    - ローカル MLX/vLLM 風サーバーで `model_not_found` → `baseUrl` に `/v1` が含まれていること、`/v1/chat/completions` バックエンドでは `api` が `"openai-completions"` であること、`models.providers.<provider>.models[].id` がプロバイダー内の素の ID であることを確認します。プロバイダープレフィックス付きで一度選択します。例: `mlx/mlx-community/Qwen3-30B-A3B-6bit`。カタログエントリは `mlx-community/Qwen3-30B-A3B-6bit` のままにします。
    - `messages[...].content: invalid type: sequence, expected a string` → バックエンドが構造化された Chat Completions のコンテンツパートを拒否しています。修正: `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
    - `incomplete turn detected ... stopReason=stop payloads=0` → バックエンドは Chat Completions リクエストを完了したものの、そのターンでユーザーに表示されるアシスタントテキストを返していません。OpenClaw はリプレイ安全な空の OpenAI 互換ターンを 1 回再試行します。失敗が続く場合は通常、バックエンドが空/非テキストコンテンツを出力しているか、最終回答テキストを抑制していることを意味します。
    - 直接の小さなリクエストは成功するが、OpenClaw エージェント実行がバックエンド/モデルクラッシュで失敗する（一部の `inferrs` ビルド上の Gemma など）→ OpenClaw トランスポートはすでに正しい可能性が高く、バックエンドがより大きなエージェントランタイムプロンプト形状で失敗しています。
    - ツールを無効化すると失敗が減るが消えない → ツールスキーマも負荷の一部でしたが、残る問題は依然として上流のモデル/サーバー容量またはバックエンドのバグです。

  </Accordion>
  <Accordion title="修正オプション">
    1. 文字列のみの Chat Completions バックエンドには `compat.requiresStringContent: true` を設定します。
    2. OpenClaw のツールスキーマ面を安定して処理できないモデル/バックエンドには `compat.supportsTools: false` を設定します。
    3. 可能な範囲でプロンプト負荷を下げます。より小さなワークスペースブートストラップ、より短いセッション履歴、より軽いローカルモデル、または長いコンテキストのサポートが強いバックエンドを使用します。
    4. 直接の小さなリクエストが成功し続ける一方で、OpenClaw エージェントターンがバックエンド内部でまだクラッシュする場合は、上流サーバー/モデルの制限として扱い、受け入れられたペイロード形状とともに再現例を提出します。
  </Accordion>
</AccordionGroup>

関連:

- [設定](/ja-JP/gateway/configuration)
- [ローカルモデル](/ja-JP/gateway/local-models)
- [OpenAI 互換エンドポイント](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)

## 返信がない

チャネルが起動しているのに何も応答しない場合は、再接続する前にルーティングとポリシーを確認します。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認する点:

- DM 送信者のペアリングが保留中。
- グループメンションのゲート設定（`requireMention`、`mentionPatterns`）。
- チャネル/グループの許可リスト不一致。

一般的な兆候:

- `drop guild message (mention required` → メンションされるまでグループメッセージは無視されます。
- `pairing request` → 送信者に承認が必要です。
- `blocked` / `allowlist` → 送信者/チャネルがポリシーによってフィルタリングされました。

関連:

- [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [グループ](/ja-JP/channels/groups)
- [ペアリング](/ja-JP/channels/pairing)

## ダッシュボード制御 UI の接続性

ダッシュボード/制御 UI が接続しない場合は、URL、認証モード、セキュアコンテキストの前提を検証します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認する点:

- 正しいプローブ URL とダッシュボード URL。
- クライアントと Gateway 間の認証モード/トークン不一致。
- デバイス ID が必要な場面で HTTP を使用している。

<AccordionGroup>
  <Accordion title="接続/認証の兆候">
    - `device identity required` → 非セキュアコンテキスト、またはデバイス認証がありません。
    - `origin not allowed` → ブラウザーの `Origin` が `gateway.controlUi.allowedOrigins` に含まれていません（または明示的な許可リストなしで非ループバックのブラウザーオリジンから接続しています）。
    - `device nonce required` / `device nonce mismatch` → クライアントがチャレンジベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していません。
    - `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったペイロード（または古いタイムスタンプ）に署名しました。
    - `AUTH_TOKEN_MISMATCH` で `canRetryWithDeviceToken=true` → クライアントはキャッシュ済みデバイストークンを使って信頼された再試行を 1 回実行できます。
    - そのキャッシュ済みトークンの再試行では、ペアリング済みデバイストークンとともに保存されたキャッシュ済みスコープセットを再利用します。明示的な `deviceToken` / 明示的な `scopes` 呼び出し元は、代わりに要求したスコープセットを保持します。
    - その再試行パス以外では、接続認証の優先順位は、明示的な共有トークン/パスワードが最初、次に明示的な `deviceToken`、次に保存済みデバイストークン、次にブートストラップトークンです。
    - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, ip}` に対する失敗した試行は、リミッターが失敗を記録する前に直列化されます。そのため、同じクライアントからの 2 つの不正な同時再試行では、2 つの単純な不一致ではなく、2 回目の試行で `retry later` が表示されることがあります。
    - ブラウザーオリジンのループバッククライアントから `too many failed authentication attempts (retry later)` → 同じ正規化済み `Origin` からの繰り返し失敗が一時的にロックアウトされています。別の localhost オリジンは別のバケットを使用します。
    - その再試行後も `unauthorized` が繰り返される → 共有トークン/デバイストークンの不一致です。トークン設定を更新し、必要に応じてデバイストークンを再承認/ローテーションします。
    - `gateway connect failed:` → ホスト/ポート/URL ターゲットが間違っています。

  </Accordion>
</AccordionGroup>

### 認証詳細コードのクイックマップ

失敗した `connect` レスポンスの `error.details.code` を使って、次のアクションを選びます。

| 詳細コード                  | 意味                                                                                                                                                                                      | 推奨アクション                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | クライアントが必要な共有トークンを送信しませんでした。                                                                                                                                                 | クライアントでトークンを貼り付けるか設定し、再試行します。ダッシュボードパスの場合: `openclaw config get gateway.auth.token` を実行し、Control UI 設定に貼り付けます。                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共有トークンが Gateway 認証トークンと一致しませんでした。                                                                                                                                               | `canRetryWithDeviceToken=true` の場合は、信頼済みの再試行を1回許可します。キャッシュ済みトークンの再試行では、保存済みの承認済みスコープを再利用します。明示的な `deviceToken` / `scopes` 呼び出し元は要求済みスコープを保持します。それでも失敗する場合は、[トークンドリフト復旧チェックリスト](/ja-JP/cli/devices#token-drift-recovery-checklist)を実行します。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | キャッシュ済みのデバイスごとのトークンが古いか、取り消されています。                                                                                                                                                 | [デバイス CLI](/ja-JP/cli/devices) を使用してデバイストークンをローテーションまたは再承認し、その後再接続します。                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | デバイス ID の承認が必要です。`not-paired`、`scope-upgrade`、`role-upgrade`、または `metadata-upgrade` について `error.details.reason` を確認し、存在する場合は `requestId` / `remediationHint` を使用します。 | 保留中のリクエストを承認します: `openclaw devices list` の後に `openclaw devices approve <requestId>` を実行します。スコープ/ロールのアップグレードも、要求されたアクセスを確認した後で同じフローを使用します。                                                                                                               |

<Note>
共有 Gateway トークン/パスワードで認証される直接 loopback バックエンド RPC は、CLI のペアリング済みデバイススコープのベースラインに依存すべきではありません。サブエージェントやその他の内部呼び出しが `scope-upgrade` でまだ失敗する場合は、呼び出し元が `client.id: "gateway-client"` と `client.mode: "backend"` を使用しており、明示的な `deviceIdentity` またはデバイストークンを強制していないことを確認してください。
</Note>

デバイス認証 v2 移行チェック:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログに nonce/署名エラーが表示される場合は、接続中のクライアントを更新して検証します:

<Steps>
  <Step title="Wait for connect.challenge">
    クライアントは Gateway が発行した `connect.challenge` を待機します。
  </Step>
  <Step title="Sign the payload">
    クライアントはチャレンジに紐付いたペイロードに署名します。
  </Step>
  <Step title="Send the device nonce">
    クライアントは同じチャレンジ nonce で `connect.params.device.nonce` を送信します。
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` が予期せず拒否される場合:

- ペアリング済みデバイストークンのセッションは、呼び出し元が `operator.admin` も持っていない限り、**自分自身の**デバイスだけを管理できます
- `openclaw devices rotate --scope ...` は、呼び出し元セッションがすでに保持している operator スコープだけを要求できます

関連:

- [設定](/ja-JP/gateway/configuration)（Gateway 認証モード）
- [Control UI](/ja-JP/web/control-ui)
- [デバイス](/ja-JP/cli/devices)
- [リモートアクセス](/ja-JP/gateway/remote)
- [信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)

## Gateway サービスが実行されていない

サービスはインストールされているがプロセスが起動したままにならない場合に使用します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

確認する項目:

- 終了ヒント付きの `Runtime: stopped`。
- サービス設定の不一致（`Config (cli)` と `Config (service)`）。
- ポート/リスナーの競合。
- `--deep` を使用したときの余分な launchd/systemd/schtasks インストール。
- `Other gateway-like services detected (best effort)` のクリーンアップヒント。

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → ローカル Gateway モードが有効ではない、または設定ファイルが上書きされて `gateway.mode` が失われています。修正: 設定で `gateway.mode="local"` を設定するか、`openclaw onboard --mode local` / `openclaw setup` を再実行して、期待されるローカルモード設定を再スタンプします。Podman 経由で OpenClaw を実行している場合、デフォルトの設定パスは `~/.openclaw/openclaw.json` です。
    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証パス（トークン/パスワード、または設定済みの場合は trusted-proxy）なしの非 loopback バインド。
    - `another gateway instance is already listening` / `EADDRINUSE` → ポート競合。
    - `Other gateway-like services detected (best effort)` → 古い、または並行する launchd/systemd/schtasks ユニットが存在します。ほとんどのセットアップでは、1台のマシンにつき Gateway は1つにするべきです。複数必要な場合は、ポート + 設定/状態/ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。
    - doctor からの `System-level OpenClaw gateway service detected` → ユーザーレベルのサービスが存在しない一方で、systemd システムユニットが存在します。doctor にユーザーサービスのインストールを許可する前に重複を削除または無効化するか、そのシステムユニットが意図したスーパーバイザーである場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。
    - `Gateway service port does not match current gateway config` → インストール済みのスーパーバイザーがまだ古い `--port` を固定しています。`openclaw doctor --fix` または `openclaw gateway install --force` を実行し、その後 Gateway サービスを再起動します。

  </Accordion>
</AccordionGroup>

関連:

- [バックグラウンド実行とプロセスツール](/ja-JP/gateway/background-process)
- [設定](/ja-JP/gateway/configuration)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway が無効な設定を拒否した

Gateway の起動が `Invalid config` で失敗する場合、またはホットリロードログに
無効な編集をスキップしたと表示される場合に使用します。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

確認する項目:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- アクティブ設定の横にあるタイムスタンプ付きの `openclaw.json.rejected.*` ファイル
- `doctor --fix` が壊れた直接編集を修復した場合のタイムスタンプ付きの `openclaw.json.clobbered.*` ファイル

<AccordionGroup>
  <Accordion title="What happened">
    - 起動、ホットリロード、または OpenClaw 所有の書き込み中に設定が検証に通りませんでした。
    - Gateway 起動は `openclaw.json` を書き換える代わりにフェイルクローズします。
    - ホットリロードは無効な外部編集をスキップし、現在のランタイム設定をアクティブなままにします。
    - OpenClaw 所有の書き込みは、コミット前に無効/破壊的なペイロードを拒否し、`.rejected.*` を保存します。
    - `openclaw doctor --fix` が修復を担当します。非 JSON プレフィックスを削除したり、拒否されたペイロードを `.clobbered.*` として保持しながら最後に正常だったコピーを復元したりできます。

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - `.clobbered.*` が存在する → doctor がアクティブ設定を修復する間、壊れた外部編集を保持しました。
    - `.rejected.*` が存在する → OpenClaw 所有の設定書き込みが、コミット前にスキーマまたは上書きチェックに失敗しました。
    - `Config write rejected:` → 書き込みが必須の形状を削除する、ファイルを急激に縮小する、または無効な設定を永続化しようとしました。
    - `config reload skipped (invalid config):` → 直接編集が検証に失敗し、実行中の Gateway に無視されました。
    - `Invalid config at ...` → Gateway サービスが起動する前に起動が失敗しました。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good`、または `size-drop-vs-last-good:*` → OpenClaw 所有の書き込みが、最後に正常だったバックアップと比較してフィールドまたはサイズを失ったため拒否されました。
    - `Config last-known-good promotion skipped` → 候補に `***` などのマスク済みシークレットプレースホルダーが含まれていました。

  </Accordion>
  <Accordion title="Fix options">
    1. `openclaw doctor --fix` を実行し、doctor にプレフィックス付き/上書きされた設定の修復、または最後に正常だった設定の復元を任せます。
    2. `.clobbered.*` または `.rejected.*` から意図したキーだけをコピーし、`openclaw config set` または `config.patch` で適用します。
    3. 再起動前に `openclaw config validate` を実行します。
    4. 手作業で編集する場合は、変更したい部分オブジェクトだけではなく、完全な JSON5 設定を保持します。
  </Accordion>
</AccordionGroup>

関連:

- [Config](/ja-JP/cli/config)
- [設定: ホットリロード](/ja-JP/gateway/configuration#config-hot-reload)
- [設定: 厳格な検証](/ja-JP/gateway/configuration#strict-validation)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway プローブ警告

`openclaw gateway probe` が何かに到達するものの、警告ブロックを表示する場合に使用します。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認する項目:

- JSON 出力の `warnings[].code` と `primaryTargetId`。
- 警告が SSH フォールバック、複数 Gateway、不足しているスコープ、または未解決の認証参照に関するものかどうか。

一般的なシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH セットアップが失敗しましたが、コマンドは設定済み/loopback ターゲットへの直接プローブを引き続き試行しました。
- `multiple reachable gateways detected` → 複数のターゲットが応答しました。通常これは、意図したマルチ Gateway セットアップ、または古い/重複したリスナーを意味します。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続は機能しましたが、詳細 RPC はスコープにより制限されています。デバイス ID をペアリングするか、`operator.read` を持つ認証情報を使用します。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 接続は機能しましたが、完全な診断 RPC セットがタイムアウトまたは失敗しました。これは診断が低下した到達可能な Gateway として扱い、`--json` 出力の `connect.ok` と `connect.rpcOk` を比較します。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → Gateway は応答しましたが、このクライアントは通常の operator アクセスの前にまだペアリング/承認が必要です。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef 警告テキスト → 失敗したターゲットについて、このコマンドパスで認証素材を利用できませんでした。

関連:

- [Gateway](/ja-JP/cli/gateway)
- [同じホスト上の複数 Gateway](/ja-JP/gateway#multiple-gateways-same-host)
- [リモートアクセス](/ja-JP/gateway/remote)

## チャンネルは接続済みだが、メッセージが流れない

チャンネル状態が接続済みでもメッセージフローが停止している場合は、ポリシー、権限、チャンネル固有の配信ルールに注目します。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認する項目:

- DM ポリシー（`pairing`、`allowlist`、`open`、`disabled`）。
- グループの許可リストとメンション要件。
- チャンネル API の権限/スコープ不足。

よくある特徴:

- `mention required` → グループメンションポリシーによりメッセージが無視された。
- `pairing` / 承認待ちのトレース → 送信者が承認されていない。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → チャンネル認証/権限の問題。

関連:

- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [Discord](/ja-JP/channels/discord)
- [Telegram](/ja-JP/channels/telegram)
- [WhatsApp](/ja-JP/channels/whatsapp)

## Cron と Heartbeat の配信

Cron または Heartbeat が実行されなかった、または配信されなかった場合は、まずスケジューラの状態を確認し、その後に配信先を確認します。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認する点:

- Cron が有効で、次回起動が存在する。
- ジョブ実行履歴のステータス（`ok`、`skipped`、`error`）。
- Heartbeat のスキップ理由（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → cron が無効。
    - `cron: timer tick failed` → スケジューラの tick が失敗した。ファイル/ログ/ランタイムエラーを確認する。
    - `heartbeat skipped` と `reason=quiet-hours` → アクティブ時間帯の範囲外。
    - `heartbeat skipped` と `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在するが空行/Markdown ヘッダーしか含まないため、OpenClaw はモデル呼び出しをスキップする。
    - `heartbeat skipped` と `reason=no-tasks-due` → `HEARTBEAT.md` に `tasks:` ブロックが含まれるが、この tick で期限を迎えるタスクがない。
    - `heartbeat: unknown accountId` → Heartbeat 配信先のアカウント ID が無効。
    - `heartbeat skipped` と `reason=dm-blocked` → Heartbeat のターゲットが DM 形式の宛先に解決されたが、`agents.defaults.heartbeat.directPolicy`（またはエージェントごとのオーバーライド）が `block` に設定されている。

  </Accordion>
</AccordionGroup>

関連:

- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュール済みタスク](/ja-JP/automation/cron-jobs)
- [スケジュール済みタスク: トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting)

## Node はペアリング済みだが、ツールが失敗する

Node がペアリング済みでもツールが失敗する場合は、フォアグラウンド、権限、承認状態を切り分けます。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認する点:

- Node がオンラインで、期待される機能を持っている。
- カメラ/マイク/位置情報/画面に対する OS 権限の付与。
- Exec 承認と許可リストの状態。

よくある特徴:

- `NODE_BACKGROUND_UNAVAILABLE` → Node アプリをフォアグラウンドにする必要がある。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 権限が不足している。
- `SYSTEM_RUN_DENIED: approval required` → exec 承認待ち。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが許可リストによりブロックされた。

関連:

- [Exec 承認](/ja-JP/tools/exec-approvals)
- [Node のトラブルシューティング](/ja-JP/nodes/troubleshooting)
- [Nodes](/ja-JP/nodes/index)

## ブラウザツールが失敗する

Gateway 自体は正常でも、ブラウザツールのアクションが失敗する場合に使用します。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認する点:

- `plugins.allow` が設定されていて、`browser` を含んでいるか。
- 有効なブラウザ実行可能ファイルのパス。
- CDP プロファイルの到達性。
- `existing-session` / `user` プロファイル用のローカル Chrome の可用性。

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` または `unknown command 'browser'` → バンドルされたブラウザ Plugin が `plugins.allow` により除外されている。
    - `browser.enabled=true` なのにブラウザツールが見つからない / 利用できない → `plugins.allow` が `browser` を除外しているため、Plugin が読み込まれていない。
    - `Failed to start Chrome CDP on port` → ブラウザプロセスの起動に失敗した。
    - `browser.executablePath not found` → 設定されたパスが無効。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定された CDP URL が `file:` や `ftp:` などの未対応スキームを使用している。
    - `browser.cdpUrl has invalid port` → 設定された CDP URL のポートが不正、または範囲外。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在の Gateway インストールにはコアブラウザランタイム依存関係がない。OpenClaw を再インストールまたは更新してから、Gateway を再起動する。ARIA スナップショットと基本的なページスクリーンショットは引き続き動作する場合があるが、ナビゲーション、AI スナップショット、CSS セレクタ要素スクリーンショット、PDF エクスポートは利用できないままになる。

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP の existing-session は、選択されたブラウザデータディレクトリにまだアタッチできなかった。ブラウザの inspect ページを開き、リモートデバッグを有効にし、ブラウザを開いたままにし、最初のアタッチプロンプトを承認してから再試行する。サインイン状態が不要な場合は、管理対象の `openclaw` プロファイルを優先する。
    - `No Chrome tabs found for profile="user"` → Chrome MCP アタッチプロファイルに、開いているローカル Chrome タブがない。
    - `Remote CDP for profile "<name>" is not reachable` → 設定されたリモート CDP エンドポイントに Gateway ホストから到達できない。
    - `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → アタッチ専用プロファイルに到達可能なターゲットがない、または HTTP エンドポイントは応答したが CDP WebSocket を開けなかった。

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → スクリーンショットリクエストで `--full-page` と `--ref` または `--element` が混在している。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` のスクリーンショット呼び出しでは、CSS `--element` ではなくページキャプチャまたはスナップショットの `--ref` を使用する必要がある。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP アップロードフックでは CSS セレクタではなくスナップショット参照が必要。
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP プロファイルでは、呼び出しごとに 1 つのアップロードを送信する。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP プロファイルのダイアログフックはタイムアウトのオーバーライドに対応していない。
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session プロファイルで `act:type` に `timeoutMs` を指定しない。カスタムタイムアウトが必要な場合は、管理対象/CDP ブラウザプロファイルを使用する。
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session プロファイルで `act:evaluate` に `timeoutMs` を指定しない。カスタムタイムアウトが必要な場合は、管理対象/CDP ブラウザプロファイルを使用する。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` にはまだ管理対象ブラウザまたは raw CDP プロファイルが必要。
    - アタッチ専用またはリモート CDP プロファイルで viewport / dark-mode / locale / offline のオーバーライドが古い → Gateway 全体を再起動せずに、`openclaw browser stop --browser-profile <name>` を実行してアクティブな制御セッションを閉じ、Playwright/CDP エミュレーション状態を解放する。

  </Accordion>
</AccordionGroup>

関連:

- [ブラウザ（OpenClaw 管理）](/ja-JP/tools/browser)
- [ブラウザのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)

## アップグレード後に突然何かが壊れた場合

アップグレード後の不具合の多くは、設定のずれ、またはより厳格なデフォルトが適用されるようになったことが原因です。

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    確認すること:

    - `gateway.mode=remote` の場合、ローカルサービスは正常でも CLI 呼び出しがリモートを対象にしている可能性がある。
    - 明示的な `--url` 呼び出しは、保存済み認証情報にフォールバックしない。

    よくある特徴:

    - `gateway connect failed:` → URL ターゲットが誤っている。
    - `unauthorized` → エンドポイントには到達できるが、認証が誤っている。

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    確認すること:

    - local loopback 以外の bind（`lan`、`tailnet`、`custom`）には、有効な Gateway 認証経路が必要です。共有トークン/パスワード認証、または正しく設定された local loopback 以外の `trusted-proxy` デプロイです。
    - `gateway.token` のような古いキーは、`gateway.auth.token` の代わりにはならない。

    よくある特徴:

    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証経路なしで local loopback 以外に bind しようとしている。
    - ランタイムは実行中だが `Connectivity probe: failed` → Gateway は稼働しているが、現在の認証/URL ではアクセスできない。

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    確認すること:

    - ダッシュボード/Nodes の保留中のデバイス承認。
    - ポリシーまたは ID の変更後に保留中の DM ペアリング承認。

    よくある特徴:

    - `device identity required` → デバイス認証が満たされていない。
    - `pairing required` → 送信者/デバイスの承認が必要。

  </Accordion>
</AccordionGroup>

確認後もサービス設定とランタイムが一致しない場合は、同じプロファイル/状態ディレクトリからサービスメタデータを再インストールします。

```bash
openclaw gateway install --force
openclaw gateway restart
```

関連:

- [認証](/ja-JP/gateway/authentication)
- [バックグラウンド exec とプロセスツール](/ja-JP/gateway/background-process)
- [Gateway 所有のペアリング](/ja-JP/gateway/pairing)

## 関連

- [Doctor](/ja-JP/gateway/doctor)
- [FAQ](/ja-JP/help/faq)
- [Gateway ランブック](/ja-JP/gateway)
