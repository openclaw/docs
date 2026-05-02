---
read_when:
    - トラブルシューティングハブから、より詳しい診断のためにここへ案内されました。
    - 正確なコマンドを含む、安定した症状ベースのランブックセクションが必要です
sidebarTitle: Troubleshooting
summary: Gateway、チャネル、自動化、ノード、ブラウザー向けの詳細トラブルシューティングランブック
title: トラブルシューティング
x-i18n:
    generated_at: "2026-05-02T04:56:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 815fbbca4d12b4b9c65b1172e07606d0eaf4c64df7fd6ca23a8f8d104b78c2a9
    source_path: gateway/troubleshooting.md
    workflow: 16
---

このページは詳細なランブックです。まず迅速なトリアージフローを確認したい場合は [/help/troubleshooting](/ja-JP/help/troubleshooting) から始めてください。

## コマンド手順

まず次の順序で実行します:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常時に期待されるシグナル:

- `openclaw gateway status` に `Runtime: running`、`Connectivity probe: ok`、および `Capability: ...` 行が表示される。
- `openclaw doctor` が、ブロックする設定/サービスの問題がないことを報告する。
- `openclaw channels status --probe` が、アカウントごとのライブなトランスポート状態と、サポートされている場合は `works` や `audit ok` などのプローブ/監査結果を表示する。

## スプリットブレインのインストールと新しい設定ガード

Gateway サービスが更新後に予期せず停止する場合、またはログで、ある `openclaw` バイナリが最後に `openclaw.json` を書き込んだバージョンより古いことが示される場合に使用します。

OpenClaw は設定書き込みに `meta.lastTouchedVersion` を記録します。読み取り専用コマンドは、より新しい OpenClaw によって書き込まれた設定を引き続き検査できますが、プロセスおよびサービスの変更は、古いバイナリからの継続を拒否します。ブロックされる操作には、Gateway サービスの起動、停止、再起動、アンインストール、強制サービス再インストール、サービスモードの Gateway 起動、および `gateway --force` のポートクリーンアップが含まれます。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH を修正する">
    `PATH` を修正して `openclaw` が新しいインストールを解決するようにし、その後アクションを再実行します。
  </Step>
  <Step title="Gateway サービスを再インストールする">
    新しいインストールから目的の Gateway サービスを再インストールします:

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
意図的なダウングレードまたは緊急復旧の場合にのみ、単一コマンドに対して `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` を設定します。通常運用では未設定のままにしてください。
</Warning>

## 長いコンテキストには Anthropic 429 の追加使用量が必要

ログ/エラーに `HTTP 429: rate_limit_error: Extra usage is required for long context requests` が含まれる場合に使用します。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認する点:

- 選択された Anthropic Opus/Sonnet モデルに `params.context1m: true` がある。
- 現在の Anthropic 認証情報が長いコンテキストの使用資格を持っていない。
- 1M ベータパスが必要な長いセッション/モデル実行でのみリクエストが失敗する。

修正オプション:

<Steps>
  <Step title="context1m を無効化する">
    そのモデルの `context1m` を無効化して、通常のコンテキストウィンドウにフォールバックします。
  </Step>
  <Step title="対象資格のある認証情報を使用する">
    長いコンテキストリクエストの対象資格がある Anthropic 認証情報を使用するか、Anthropic API キーに切り替えます。
  </Step>
  <Step title="フォールバックモデルを設定する">
    Anthropic の長いコンテキストリクエストが拒否されたときも実行が継続するように、フォールバックモデルを設定します。
  </Step>
</Steps>

関連:

- [Anthropic](/ja-JP/providers/anthropic)
- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [Anthropic から HTTP 429 が表示されるのはなぜですか?](/ja-JP/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ローカルの OpenAI 互換バックエンドは直接プローブに合格するが、エージェント実行は失敗する

次の場合に使用します:

- `curl ... /v1/models` は動作する
- 小さな直接 `/v1/chat/completions` 呼び出しは動作する
- OpenClaw のモデル実行が通常のエージェントターンでのみ失敗する

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

確認する点:

- 小さな直接呼び出しは成功するが、OpenClaw の実行は大きなプロンプトでのみ失敗する
- 同じ素のモデル ID で直接 `/v1/chat/completions` が動作するにもかかわらず、`model_not_found` または 404 エラーが発生する
- `messages[].content` が文字列であることを期待するバックエンドエラー
- OpenAI 互換ローカルバックエンドで、断続的な `incomplete turn detected ... stopReason=stop payloads=0` 警告が出る
- より大きなプロンプトトークン数または完全なエージェントランタイムプロンプトでのみ現れるバックエンドクラッシュ

<AccordionGroup>
  <Accordion title="よくあるシグネチャ">
    - ローカルの MLX/vLLM 形式サーバーで `model_not_found` → `baseUrl` に `/v1` が含まれていること、`/v1/chat/completions` バックエンドでは `api` が `"openai-completions"` であること、`models.providers.<provider>.models[].id` が素のプロバイダー内 ID であることを確認します。選択時はプロバイダープレフィックスを一度付けます。例: `mlx/mlx-community/Qwen3-30B-A3B-6bit`。カタログエントリは `mlx-community/Qwen3-30B-A3B-6bit` のままにします。
    - `messages[...].content: invalid type: sequence, expected a string` → バックエンドが構造化された Chat Completions のコンテンツパーツを拒否しています。修正: `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
    - `incomplete turn detected ... stopReason=stop payloads=0` → バックエンドは Chat Completions リクエストを完了しましたが、そのターンでユーザーに表示されるアシスタントテキストを返しませんでした。OpenClaw は再生しても安全な空の OpenAI 互換ターンを 1 回再試行します。失敗が続く場合、通常はバックエンドが空/非テキストのコンテンツを出力しているか、最終回答テキストを抑制していることを意味します。
    - 直接の小さなリクエストは成功するが、OpenClaw エージェント実行はバックエンド/モデルのクラッシュで失敗する（例: 一部の `inferrs` ビルドでの Gemma）→ OpenClaw のトランスポートはすでに正しい可能性が高く、バックエンドがより大きなエージェントランタイムのプロンプト形状で失敗しています。
    - ツールを無効化すると失敗は減るが消えない → ツールスキーマは負荷要因の一部でしたが、残る問題は依然として上流モデル/サーバーの容量、またはバックエンドのバグです。

  </Accordion>
  <Accordion title="修正オプション">
    1. 文字列のみの Chat Completions バックエンドには `compat.requiresStringContent: true` を設定します。
    2. OpenClaw のツールスキーマサーフェスを確実に扱えないモデル/バックエンドには `compat.supportsTools: false` を設定します。
    3. 可能な場合はプロンプト負荷を下げます: より小さいワークスペースブートストラップ、より短いセッション履歴、より軽量なローカルモデル、またはより強力な長いコンテキスト対応を持つバックエンド。
    4. 小さな直接リクエストは通り続ける一方で、OpenClaw エージェントターンがバックエンド内部でまだクラッシュする場合は、上流サーバー/モデルの制限として扱い、受け入れられたペイロード形状とともに再現手順を提出します。
  </Accordion>
</AccordionGroup>

関連:

- [設定](/ja-JP/gateway/configuration)
- [ローカルモデル](/ja-JP/gateway/local-models)
- [OpenAI 互換エンドポイント](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)

## 返信がない

チャネルが起動しているのに何も応答しない場合は、何かを再接続する前にルーティングとポリシーを確認します。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認する点:

- DM 送信者のペアリングが保留中。
- グループメンションゲート（`requireMention`、`mentionPatterns`）。
- チャネル/グループ許可リストの不一致。

よくあるシグネチャ:

- `drop guild message (mention required` → メンションされるまでグループメッセージは無視されます。
- `pairing request` → 送信者の承認が必要です。
- `blocked` / `allowlist` → 送信者/チャネルがポリシーによってフィルターされました。

関連:

- [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [グループ](/ja-JP/channels/groups)
- [ペアリング](/ja-JP/channels/pairing)

## ダッシュボード制御 UI の接続性

ダッシュボード/制御 UI が接続できない場合は、URL、認証モード、およびセキュアコンテキストの前提を検証します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認する点:

- 正しいプローブ URL とダッシュボード URL。
- クライアントと Gateway の間の認証モード/トークン不一致。
- デバイス ID が必要な場所で HTTP を使用している。

<AccordionGroup>
  <Accordion title="接続/認証シグネチャ">
    - `device identity required` → 非セキュアコンテキスト、またはデバイス認証の欠落。
    - `origin not allowed` → ブラウザーの `Origin` が `gateway.controlUi.allowedOrigins` に含まれていません（または、明示的な許可リストなしで local loopback ではないブラウザーオリジンから接続しています）。
    - `device nonce required` / `device nonce mismatch` → クライアントがチャレンジベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していません。
    - `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったペイロード（または古いタイムスタンプ）に署名しました。
    - `AUTH_TOKEN_MISMATCH` かつ `canRetryWithDeviceToken=true` → クライアントはキャッシュ済みデバイストークンで信頼された再試行を 1 回実行できます。
    - そのキャッシュ済みトークンでの再試行は、ペアリング済みデバイストークンとともに保存されたキャッシュ済みスコープセットを再利用します。明示的な `deviceToken` / 明示的な `scopes` 呼び出し元は、代わりに要求したスコープセットを保持します。
    - その再試行パスの外では、接続認証の優先順位は、明示的な共有トークン/パスワード、次に明示的な `deviceToken`、次に保存済みデバイストークン、次にブートストラップトークンです。
    - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, ip}` に対する失敗した試行は、リミッターが失敗を記録する前に直列化されます。そのため、同じクライアントからの 2 つの同時の不正な再試行では、2 つの単純な不一致ではなく、2 回目の試行で `retry later` が表面化することがあります。
    - ブラウザーオリジンの loopback クライアントから `too many failed authentication attempts (retry later)` → 同じ正規化済み `Origin` からの失敗が繰り返されたため、一時的にロックアウトされています。別の localhost オリジンは別のバケットを使用します。
    - その再試行後も `unauthorized` が繰り返される → 共有トークン/デバイストークンのずれです。トークン設定を更新し、必要に応じてデバイストークンを再承認/ローテーションします。
    - `gateway connect failed:` → ホスト/ポート/URL ターゲットが間違っています。

  </Accordion>
</AccordionGroup>

### 認証詳細コードのクイックマップ

失敗した `connect` 応答の `error.details.code` を使用して、次のアクションを選択します:

| 詳細コード                  | 意味                                                                                                                                                                                      | 推奨アクション                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | クライアントが必要な共有トークンを送信しませんでした。                                                                                                                                                 | クライアントにトークンを貼り付けるか設定して、再試行します。ダッシュボードのパスの場合: `openclaw config get gateway.auth.token` を実行し、Control UI 設定に貼り付けます。                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共有トークンが Gateway 認証トークンと一致しませんでした。                                                                                                                                               | `canRetryWithDeviceToken=true` の場合は、信頼済みの再試行を 1 回許可します。キャッシュ済みトークンによる再試行では、保存され承認済みのスコープを再利用します。明示的な `deviceToken` / `scopes` 呼び出し元は要求したスコープを維持します。それでも失敗する場合は、[トークンドリフト復旧チェックリスト](/ja-JP/cli/devices#token-drift-recovery-checklist)を実行します。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | キャッシュ済みのデバイス別トークンが古いか、取り消されています。                                                                                                                                                 | [デバイス CLI](/ja-JP/cli/devices) を使ってデバイストークンをローテーションまたは再承認してから、再接続します。                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | デバイス ID に承認が必要です。`not-paired`、`scope-upgrade`、`role-upgrade`、または `metadata-upgrade` について `error.details.reason` を確認し、存在する場合は `requestId` / `remediationHint` を使用します。 | 保留中の要求を承認します: `openclaw devices list` の後に `openclaw devices approve <requestId>` を実行します。スコープ/ロールのアップグレードでは、要求されたアクセスを確認した後に同じフローを使用します。                                                                                                               |

<Note>
共有 Gateway トークン/パスワードで認証された直接 loopback バックエンド RPC は、CLI のペアリング済みデバイスのスコープベースラインに依存すべきではありません。サブエージェントやその他の内部呼び出しがまだ `scope-upgrade` で失敗する場合は、呼び出し元が `client.id: "gateway-client"` と `client.mode: "backend"` を使用しており、明示的な `deviceIdentity` またはデバイストークンを強制していないことを確認してください。
</Note>

デバイス認証 v2 移行チェック:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログに nonce/署名エラーが表示される場合は、接続元クライアントを更新して検証します:

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

- ペアリング済みデバイストークンセッションは、呼び出し元が `operator.admin` も持っていない限り、**自分自身の**デバイスのみを管理できます
- `openclaw devices rotate --scope ...` は、呼び出し元セッションがすでに保持している operator スコープのみを要求できます

関連:

- [設定](/ja-JP/gateway/configuration) (Gateway 認証モード)
- [Control UI](/ja-JP/web/control-ui)
- [デバイス](/ja-JP/cli/devices)
- [リモートアクセス](/ja-JP/gateway/remote)
- [信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)

## Gateway サービスが実行されていない

サービスはインストールされているが、プロセスが起動したままにならない場合に使用します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

確認項目:

- 終了ヒント付きの `Runtime: stopped`。
- サービス設定の不一致 (`Config (cli)` と `Config (service)`)。
- ポート/リスナーの競合。
- `--deep` 使用時の追加の launchd/systemd/schtasks インストール。
- `Other gateway-like services detected (best effort)` のクリーンアップヒント。

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → ローカル Gateway モードが有効ではないか、設定ファイルが上書きされて `gateway.mode` が失われています。修正: 設定で `gateway.mode="local"` を設定するか、`openclaw onboard --mode local` / `openclaw setup` を再実行して、期待されるローカルモード設定を再スタンプします。Podman 経由で OpenClaw を実行している場合、デフォルトの設定パスは `~/.openclaw/openclaw.json` です。
    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証パス (トークン/パスワード、または設定済みの場合は信頼済みプロキシ) なしの非 loopback バインドです。
    - `another gateway instance is already listening` / `EADDRINUSE` → ポート競合です。
    - `Other gateway-like services detected (best effort)` → 古い、または並列の launchd/systemd/schtasks ユニットが存在します。ほとんどのセットアップでは、マシンごとに Gateway は 1 つにするべきです。複数必要な場合は、ポート + 設定/状態/ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。
    - doctor からの `System-level OpenClaw gateway service detected` → ユーザーレベルサービスがない一方で、systemd システムユニットが存在します。doctor にユーザーサービスをインストールさせる前に重複を削除または無効化するか、そのシステムユニットが意図したスーパーバイザーである場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。
    - `Gateway service port does not match current gateway config` → インストール済みスーパーバイザーがまだ古い `--port` を固定しています。`openclaw doctor --fix` または `openclaw gateway install --force` を実行してから、Gateway サービスを再起動します。

  </Accordion>
</AccordionGroup>

関連:

- [バックグラウンド実行とプロセスツール](/ja-JP/gateway/background-process)
- [設定](/ja-JP/gateway/configuration)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway が最後の正常設定を復元した

Gateway は起動するが、ログに `openclaw.json` を復元したと表示される場合に使用します。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

確認項目:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- アクティブな設定の横にあるタイムスタンプ付きの `openclaw.json.clobbered.*` ファイル
- `Config recovery warning` で始まる main-agent システムイベント

<AccordionGroup>
  <Accordion title="What happened">
    - 拒否された設定は、起動中またはホットリロード中に検証を通りませんでした。
    - OpenClaw は拒否されたペイロードを `.clobbered.*` として保持しました。
    - アクティブな設定は、最後に検証済みの最後の正常コピーから復元されました。
    - 次の main-agent ターンには、拒否された設定を無条件に書き直さないよう警告されます。
    - すべての検証問題が `plugins.entries.<id>...` の配下にある場合、OpenClaw はファイル全体を復元しません。Plugin ローカルの失敗は明示したまま、無関係なユーザー設定はアクティブな設定に残ります。

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
    - `.clobbered.*` が存在する → 外部からの直接編集または起動時読み取りが復元されました。
    - `.rejected.*` が存在する → OpenClaw 管理の設定書き込みが、コミット前にスキーマまたは上書きチェックで失敗しました。
    - `Config write rejected:` → 書き込みが必要な形状を落とそうとした、ファイルを急激に縮小しようとした、または無効な設定を永続化しようとしました。
    - `Rejected validation details:` → 復旧ログまたは main-agent 通知に、`agents.defaults.execution` や `gateway.auth.password.source` など、復元の原因となったスキーマパスが含まれています。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good`、または `size-drop-vs-last-good:*` → 起動時に現在のファイルが、最後の正常バックアップと比べてフィールドやサイズを失っていたため、上書きされたものとして扱われました。
    - `Config last-known-good promotion skipped` → 候補に `***` などのリダクト済みシークレットプレースホルダーが含まれていました。

  </Accordion>
  <Accordion title="Fix options">
    1. 復元されたアクティブ設定が正しければ、そのまま維持します。
    2. `.clobbered.*` または `.rejected.*` から意図したキーだけをコピーし、`openclaw config set` または `config.patch` で適用します。
    3. 再起動する前に `openclaw config validate` を実行します。
    4. 手動で編集する場合は、変更したい部分オブジェクトだけでなく、JSON5 設定全体を維持します。
  </Accordion>
</AccordionGroup>

関連:

- [設定](/ja-JP/cli/config)
- [設定: ホットリロード](/ja-JP/gateway/configuration#config-hot-reload)
- [設定: 厳格な検証](/ja-JP/gateway/configuration#strict-validation)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway プローブの警告

`openclaw gateway probe` が何かに到達するものの、警告ブロックも出力する場合に使用します。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認項目:

- JSON 出力内の `warnings[].code` と `primaryTargetId`。
- 警告が SSH フォールバック、複数 Gateway、スコープ不足、未解決の認証参照のどれに関するものか。

一般的なシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH セットアップに失敗しましたが、コマンドは設定済み/loopback の直接ターゲットも試行しました。
- `multiple reachable gateways detected` → 複数のターゲットが応答しました。通常は意図的な複数 Gateway セットアップ、または古い/重複したリスナーを意味します。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続は成功しましたが、詳細 RPC がスコープで制限されています。デバイス ID をペアリングするか、`operator.read` を持つ認証情報を使用します。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 接続は成功しましたが、完全な診断 RPC セットがタイムアウトしたか失敗しました。これは診断が低下した到達可能な Gateway として扱い、`--json` 出力で `connect.ok` と `connect.rpcOk` を比較します。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → Gateway は応答しましたが、このクライアントは通常の operator アクセス前にまだペアリング/承認が必要です。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef 警告テキスト → 失敗したターゲットについて、このコマンドパスで認証情報素材を利用できませんでした。

関連:

- [Gateway](/ja-JP/cli/gateway)
- [同じホスト上の複数 Gateway](/ja-JP/gateway#multiple-gateways-same-host)
- [リモートアクセス](/ja-JP/gateway/remote)

## チャネルは接続済みだが、メッセージが流れない

チャネル状態が接続済みでもメッセージフローが止まっている場合は、ポリシー、権限、チャネル固有の配信ルールに注目します。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認項目:

- DM ポリシー（`pairing`、`allowlist`、`open`、`disabled`）。
- グループ許可リストとメンション要件。
- 不足しているチャンネル API 権限/スコープ。

一般的なシグネチャ:

- `mention required` → グループメンションポリシーによりメッセージが無視されました。
- `pairing` / 保留中の承認トレース → 送信者が承認されていません。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → チャンネル認証/権限の問題。

関連:

- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [Discord](/ja-JP/channels/discord)
- [Telegram](/ja-JP/channels/telegram)
- [WhatsApp](/ja-JP/channels/whatsapp)

## Cron と Heartbeat 配信

Cron または Heartbeat が実行されなかった、または配信されなかった場合は、まずスケジューラーの状態を確認し、その後で配信先を確認します。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認すること:

- Cron が有効で、次回起動が存在する。
- ジョブ実行履歴のステータス（`ok`、`skipped`、`error`）。
- Heartbeat のスキップ理由（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="一般的なシグネチャ">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron が無効です。
    - `cron: timer tick failed` → スケジューラーの tick に失敗しました。ファイル/ログ/ランタイムエラーを確認してください。
    - `heartbeat skipped` かつ `reason=quiet-hours` → アクティブ時間帯の範囲外です。
    - `heartbeat skipped` かつ `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在しますが、空行または Markdown ヘッダーのみを含むため、OpenClaw はモデル呼び出しをスキップします。
    - `heartbeat skipped` かつ `reason=no-tasks-due` → `HEARTBEAT.md` に `tasks:` ブロックがありますが、この tick で期限になっているタスクがありません。
    - `heartbeat: unknown accountId` → Heartbeat 配信先のアカウント ID が無効です。
    - `heartbeat skipped` かつ `reason=dm-blocked` → Heartbeat の対象が DM 形式の宛先として解決されましたが、`agents.defaults.heartbeat.directPolicy`（またはエージェントごとの上書き）が `block` に設定されています。

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

確認すること:

- Node がオンラインで、想定される機能を持っている。
- カメラ/マイク/位置情報/画面の OS 権限付与。
- Exec 承認と許可リストの状態。

一般的なシグネチャ:

- `NODE_BACKGROUND_UNAVAILABLE` → Node アプリがフォアグラウンドにある必要があります。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 権限が不足しています。
- `SYSTEM_RUN_DENIED: approval required` → exec 承認が保留中です。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが許可リストによってブロックされています。

関連:

- [Exec 承認](/ja-JP/tools/exec-approvals)
- [Node のトラブルシューティング](/ja-JP/nodes/troubleshooting)
- [Node](/ja-JP/nodes/index)

## ブラウザーツールが失敗する

Gateway 自体は正常なのにブラウザーツールのアクションが失敗する場合に使用します。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認すること:

- `plugins.allow` が設定され、`browser` を含んでいるか。
- 有効なブラウザー実行ファイルパス。
- CDP プロファイルの到達可能性。
- `existing-session` / `user` プロファイル向けのローカル Chrome の利用可能性。

<AccordionGroup>
  <Accordion title="Plugin / 実行ファイルのシグネチャ">
    - `unknown command "browser"` または `unknown command 'browser'` → バンドルされたブラウザー Plugin が `plugins.allow` によって除外されています。
    - `browser.enabled=true` なのにブラウザーツールが見つからない / 利用できない → `plugins.allow` が `browser` を除外しているため、Plugin が読み込まれていません。
    - `Failed to start Chrome CDP on port` → ブラウザープロセスの起動に失敗しました。
    - `browser.executablePath not found` → 設定されたパスが無効です。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定された CDP URL が `file:` や `ftp:` などのサポートされていないスキームを使用しています。
    - `browser.cdpUrl has invalid port` → 設定された CDP URL のポートが不正、または範囲外です。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在の Gateway インストールにはコアブラウザーランタイム依存関係がありません。OpenClaw を再インストールまたは更新してから、Gateway を再起動してください。ARIA スナップショットと基本的なページスクリーンショットは引き続き動作しますが、ナビゲーション、AI スナップショット、CSS セレクター要素スクリーンショット、PDF エクスポートは利用できないままです。

  </Accordion>
  <Accordion title="Chrome MCP / 既存セッションのシグネチャ">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP の既存セッションが、選択されたブラウザーデータディレクトリにまだアタッチできませんでした。ブラウザーの inspect ページを開き、リモートデバッグを有効にし、ブラウザーを開いたままにして、最初のアタッチプロンプトを承認してから再試行してください。サインイン状態が不要な場合は、管理対象の `openclaw` プロファイルを優先してください。
    - `No Chrome tabs found for profile="user"` → Chrome MCP のアタッチプロファイルに開いているローカル Chrome タブがありません。
    - `Remote CDP for profile "<name>" is not reachable` → 設定されたリモート CDP エンドポイントに Gateway ホストから到達できません。
    - `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → アタッチ専用プロファイルに到達可能なターゲットがない、または HTTP エンドポイントは応答したが CDP WebSocket を開けませんでした。

  </Accordion>
  <Accordion title="要素 / スクリーンショット / アップロードのシグネチャ">
    - `fullPage is not supported for element screenshots` → スクリーンショット要求で `--full-page` と `--ref` または `--element` が混在しています。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` のスクリーンショット呼び出しでは、CSS の `--element` ではなく、ページキャプチャまたはスナップショットの `--ref` を使用する必要があります。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP のアップロードフックには CSS セレクターではなくスナップショット参照が必要です。
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP プロファイルでは、呼び出しごとに 1 つのアップロードを送信してください。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP プロファイルのダイアログフックはタイムアウト上書きをサポートしていません。
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP 既存セッションプロファイルでの `act:type` では `timeoutMs` を省略するか、カスタムタイムアウトが必要な場合は管理対象/CDP ブラウザープロファイルを使用してください。
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP 既存セッションプロファイルでの `act:evaluate` では `timeoutMs` を省略するか、カスタムタイムアウトが必要な場合は管理対象/CDP ブラウザープロファイルを使用してください。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` にはまだ管理対象ブラウザーまたは raw CDP プロファイルが必要です。
    - アタッチ専用またはリモート CDP プロファイルで viewport / ダークモード / ロケール / オフライン上書きが古いままになる → Gateway 全体を再起動せずにアクティブな制御セッションを閉じ、Playwright/CDP エミュレーション状態を解放するには、`openclaw browser stop --browser-profile <name>` を実行します。

  </Accordion>
</AccordionGroup>

関連:

- [ブラウザー（OpenClaw管理）](/ja-JP/tools/browser)
- [ブラウザーのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)

## アップグレード後に突然何かが壊れた場合

アップグレード後の破損の多くは、設定ドリフト、またはより厳格なデフォルトが新たに強制されるようになったことが原因です。

<AccordionGroup>
  <Accordion title="1. 認証と URL 上書きの動作が変わった">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    確認すること:

    - `gateway.mode=remote` の場合、ローカルサービスは正常でも CLI 呼び出しがリモートを対象にしている可能性があります。
    - 明示的な `--url` 呼び出しは、保存済みの認証情報にフォールバックしません。

    一般的なシグネチャ:

    - `gateway connect failed:` → URL ターゲットが誤っています。
    - `unauthorized` → エンドポイントには到達できますが、認証が誤っています。

  </Accordion>
  <Accordion title="2. バインドと認証のガードレールがより厳格になった">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    確認すること:

    - 非ループバックバインド（`lan`、`tailnet`、`custom`）には、有効な Gateway 認証パスが必要です。共有トークン/パスワード認証、または正しく設定された非ループバックの `trusted-proxy` デプロイを使用します。
    - `gateway.token` のような古いキーは `gateway.auth.token` の代わりにはなりません。

    一般的なシグネチャ:

    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証パスなしで非ループバックにバインドしようとしています。
    - ランタイムが実行中なのに `Connectivity probe: failed` → Gateway は稼働していますが、現在の認証/URL ではアクセスできません。

  </Accordion>
  <Accordion title="3. ペアリングとデバイス ID 状態が変わった">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    確認すること:

    - ダッシュボード/Node の保留中のデバイス承認。
    - ポリシーまたは ID 変更後の保留中の DM ペアリング承認。

    一般的なシグネチャ:

    - `device identity required` → デバイス認証が満たされていません。
    - `pairing required` → 送信者/デバイスを承認する必要があります。

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
- [Gateway 管理のペアリング](/ja-JP/gateway/pairing)

## 関連

- [Doctor](/ja-JP/gateway/doctor)
- [FAQ](/ja-JP/help/faq)
- [Gateway ランブック](/ja-JP/gateway)
