---
read_when:
    - トラブルシューティングハブから、より詳しい診断のためにここへ案内されました
    - 正確なコマンドを含む、症状別の安定したランブックセクションが必要です
sidebarTitle: Troubleshooting
summary: Gateway、チャンネル、自動化、ノード、ブラウザー向けの詳細なトラブルシューティングランブック
title: トラブルシューティング
x-i18n:
    generated_at: "2026-05-01T05:01:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: a808dcfd8527b041f629cff24308550f961e9eeb4d7d4ce6f1ce84dff6bbef89
    source_path: gateway/troubleshooting.md
    workflow: 16
---

このページは詳細なランブックです。まず高速なトリアージフローを確認したい場合は、[/help/troubleshooting](/ja-JP/help/troubleshooting) から始めてください。

## コマンドの順序

まず、次の順序で実行します。

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
- `openclaw channels status --probe` に、アカウントごとのライブのトランスポート状態と、対応している場合は `works` や `audit ok` などのプローブ/監査結果が表示される。

## スプリットブレインインストールと新しい設定ガード

更新後に Gateway サービスが予期せず停止する場合、またはログに、ある `openclaw` バイナリが最後に `openclaw.json` を書き込んだバージョンより古いことが示されている場合に使用します。

OpenClaw は設定の書き込みに `meta.lastTouchedVersion` をスタンプします。読み取り専用コマンドは、新しい OpenClaw が書き込んだ設定を引き続き検査できますが、プロセスとサービスの変更は古いバイナリからの続行を拒否します。ブロックされる操作には、Gateway サービスの起動、停止、再起動、アンインストール、強制サービス再インストール、サービスモードでの Gateway 起動、`gateway --force` によるポートクリーンアップが含まれます。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH を修正する">
    `PATH` を修正して、`openclaw` が新しいインストール先を解決するようにしてから、操作を再実行します。
  </Step>
  <Step title="Gateway サービスを再インストールする">
    新しいインストール先から意図した Gateway サービスを再インストールします。

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="古いラッパーを削除する">
    古い `openclaw` バイナリをまだ指している古いシステムパッケージまたはラッパーのエントリを削除します。
  </Step>
</Steps>

<Warning>
意図的なダウングレードまたは緊急復旧の場合のみ、その単一のコマンドに `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` を設定してください。通常運用では未設定のままにします。
</Warning>

## 長いコンテキストには Anthropic 429 追加使用量が必要

ログ/エラーに `HTTP 429: rate_limit_error: Extra usage is required for long context requests` が含まれる場合に使用します。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認すること:

- 選択された Anthropic Opus/Sonnet モデルに `params.context1m: true` がある。
- 現在の Anthropic 認証情報が長いコンテキストの使用対象ではない。
- 失敗するのは、1M ベータパスを必要とする長いセッション/モデル実行のみ。

修正オプション:

<Steps>
  <Step title="context1m を無効にする">
    そのモデルの `context1m` を無効にして、通常のコンテキストウィンドウにフォールバックします。
  </Step>
  <Step title="対象となる認証情報を使用する">
    長いコンテキスト要求の対象となる Anthropic 認証情報を使用するか、Anthropic API キーに切り替えます。
  </Step>
  <Step title="フォールバックモデルを設定する">
    Anthropic の長いコンテキスト要求が拒否された場合でも実行が継続されるように、フォールバックモデルを設定します。
  </Step>
</Steps>

関連:

- [Anthropic](/ja-JP/providers/anthropic)
- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [Anthropic から HTTP 429 が表示されるのはなぜですか?](/ja-JP/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ローカルの OpenAI 互換バックエンドは直接プローブに通るが、エージェント実行が失敗する

次の場合に使用します。

- `curl ... /v1/models` が動作する
- 小さな直接 `/v1/chat/completions` 呼び出しが動作する
- OpenClaw のモデル実行が通常のエージェントターンでのみ失敗する

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

確認すること:

- 小さな直接呼び出しは成功するが、OpenClaw の実行は大きなプロンプトでのみ失敗する
- 同じ素のモデル ID で直接 `/v1/chat/completions`
  は動作するにもかかわらず、`model_not_found` または 404 エラーが発生する
- `messages[].content` が文字列を想定しているというバックエンドエラー
- OpenAI 互換のローカルバックエンドで断続的に発生する `incomplete turn detected ... stopReason=stop payloads=0` 警告
- より大きなプロンプトトークン数または完全なエージェントランタイムプロンプトでのみ発生するバックエンドクラッシュ

<AccordionGroup>
  <Accordion title="一般的なシグネチャ">
    - ローカルの MLX/vLLM スタイルのサーバーで `model_not_found` → `baseUrl` に `/v1` が含まれていること、`/v1/chat/completions` バックエンドでは `api` が `"openai-completions"` であること、`models.providers.<provider>.models[].id` が素のプロバイダーローカル ID であることを確認してください。たとえば `mlx/mlx-community/Qwen3-30B-A3B-6bit` のように、プロバイダープレフィックスを一度付けて選択します。カタログエントリは `mlx-community/Qwen3-30B-A3B-6bit` のままにします。
    - `messages[...].content: invalid type: sequence, expected a string` → バックエンドが構造化された Chat Completions のコンテンツパーツを拒否しています。修正: `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
    - `incomplete turn detected ... stopReason=stop payloads=0` → バックエンドは Chat Completions 要求を完了しましたが、そのターンでユーザーに表示されるアシスタントテキストを返していません。OpenClaw は、再生しても安全な空の OpenAI 互換ターンを 1 回再試行します。失敗が継続する場合、通常はバックエンドが空/非テキストのコンテンツを出力しているか、最終回答テキストを抑制していることを意味します。
    - 小さな直接要求は成功するが、OpenClaw エージェント実行がバックエンド/モデルのクラッシュで失敗する（たとえば一部の `inferrs` ビルド上の Gemma）→ OpenClaw のトランスポートはすでに正しい可能性が高く、バックエンドが大きなエージェントランタイムプロンプト形状で失敗しています。
    - ツールを無効にすると失敗は減るが、消えない → ツールスキーマは負荷の一部でしたが、残る問題は依然として上流のモデル/サーバー容量、またはバックエンドのバグです。

  </Accordion>
  <Accordion title="修正オプション">
    1. 文字列のみの Chat Completions バックエンドには `compat.requiresStringContent: true` を設定します。
    2. OpenClaw のツールスキーマサーフェスを安定して処理できないモデル/バックエンドには `compat.supportsTools: false` を設定します。
    3. 可能な範囲でプロンプト負荷を下げます。小さめのワークスペースブートストラップ、短いセッション履歴、軽量なローカルモデル、またはより強い長いコンテキスト対応を持つバックエンドを使用します。
    4. 小さな直接要求が通り続ける一方で OpenClaw エージェントターンがバックエンド内でまだクラッシュする場合は、上流のサーバー/モデルの制限として扱い、受け入れられたペイロード形状とともに再現手順をそちらに報告します。
  </Accordion>
</AccordionGroup>

関連:

- [設定](/ja-JP/gateway/configuration)
- [ローカルモデル](/ja-JP/gateway/local-models)
- [OpenAI 互換エンドポイント](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)

## 返信がない

チャンネルが稼働しているのに何も応答しない場合は、何かを再接続する前にルーティングとポリシーを確認します。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認すること:

- DM 送信者のペアリングが保留中。
- グループメンションゲーティング（`requireMention`、`mentionPatterns`）。
- チャンネル/グループの許可リスト不一致。

一般的なシグネチャ:

- `drop guild message (mention required` → メンションされるまでグループメッセージは無視されます。
- `pairing request` → 送信者には承認が必要です。
- `blocked` / `allowlist` → 送信者/チャンネルがポリシーによってフィルタリングされました。

関連:

- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [グループ](/ja-JP/channels/groups)
- [ペアリング](/ja-JP/channels/pairing)

## ダッシュボード制御 UI の接続性

ダッシュボード/制御 UI が接続しない場合は、URL、認証モード、およびセキュアコンテキストの前提を検証します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認すること:

- 正しいプローブ URL とダッシュボード URL。
- クライアントと Gateway の間で認証モード/トークンが不一致。
- デバイス ID が必要な場所で HTTP を使用している。

<AccordionGroup>
  <Accordion title="接続 / 認証シグネチャ">
    - `device identity required` → 非セキュアコンテキスト、またはデバイス認証の欠落。
    - `origin not allowed` → ブラウザーの `Origin` が `gateway.controlUi.allowedOrigins` に含まれていません（または、明示的な許可リストなしで非ループバックのブラウザーオリジンから接続しています）。
    - `device nonce required` / `device nonce mismatch` → クライアントがチャレンジベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していません。
    - `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったペイロード（または古いタイムスタンプ）に署名しました。
    - `AUTH_TOKEN_MISMATCH` かつ `canRetryWithDeviceToken=true` → クライアントはキャッシュ済みデバイストークンで信頼済みリトライを 1 回実行できます。
    - そのキャッシュ済みトークンでのリトライは、ペアリング済みデバイストークンとともに保存されたキャッシュ済みスコープセットを再利用します。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、代わりに要求したスコープセットを維持します。
    - そのリトライパス以外では、接続認証の優先順位は、明示的な共有トークン/パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
    - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, ip}` の失敗試行は、リミッターが失敗を記録する前にシリアル化されます。そのため、同じクライアントからの 2 つの不正な同時リトライでは、2 つの単純な不一致ではなく、2 回目の試行で `retry later` が表面化することがあります。
    - ブラウザーオリジンのループバッククライアントから `too many failed authentication attempts (retry later)` → 同じ正規化済み `Origin` からの繰り返し失敗が一時的にロックアウトされています。別の localhost オリジンは別のバケットを使用します。
    - そのリトライ後も `unauthorized` が繰り返される → 共有トークン/デバイストークンのドリフトです。トークン設定を更新し、必要に応じてデバイストークンを再承認/ローテーションしてください。
    - `gateway connect failed:` → ホスト/ポート/URL ターゲットが間違っています。

  </Accordion>
</AccordionGroup>

### 認証詳細コードのクイックマップ

失敗した `connect` レスポンスの `error.details.code` を使用して、次の操作を選択します。

| 詳細コード                 | 意味                                                                                                                                                                                      | 推奨アクション                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | クライアントが必須の共有トークンを送信しませんでした。                                                                                                                                                 | クライアントにトークンを貼り付けるか設定して、再試行します。ダッシュボード経路の場合: `openclaw config get gateway.auth.token` を実行してから Control UI 設定に貼り付けます。                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共有トークンが Gateway 認証トークンと一致しませんでした。                                                                                                                                               | `canRetryWithDeviceToken=true` の場合は、信頼済みの再試行を 1 回許可します。キャッシュ済みトークンによる再試行では、保存済みの承認済みスコープを再利用します。明示的な `deviceToken` / `scopes` 呼び出し元は、要求したスコープを維持します。それでも失敗する場合は、[トークンドリフト復旧チェックリスト](/ja-JP/cli/devices#token-drift-recovery-checklist)を実行します。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | キャッシュ済みのデバイス単位トークンが古いか、取り消されています。                                                                                                                                                 | [devices CLI](/ja-JP/cli/devices) を使ってデバイストークンをローテートまたは再承認し、その後再接続します。                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | デバイス ID の承認が必要です。`error.details.reason` で `not-paired`、`scope-upgrade`、`role-upgrade`、または `metadata-upgrade` を確認し、存在する場合は `requestId` / `remediationHint` を使います。 | 保留中のリクエストを承認します: `openclaw devices list` の後に `openclaw devices approve <requestId>` を実行します。スコープ/ロールのアップグレードも、要求されたアクセスを確認した後に同じフローを使います。                                                                                                               |

<Note>
共有 Gateway トークン/パスワードで認証された直接 loopback バックエンド RPC は、CLI のペアリング済みデバイスのスコープベースラインに依存すべきではありません。サブエージェントやその他の内部呼び出しがまだ `scope-upgrade` で失敗する場合は、呼び出し元が `client.id: "gateway-client"` と `client.mode: "backend"` を使っており、明示的な `deviceIdentity` やデバイストークンを強制していないことを確認します。
</Note>

デバイス認証 v2 の移行チェック:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログに nonce/署名エラーが表示される場合は、接続元クライアントを更新して検証します:

<Steps>
  <Step title="connect.challenge を待機">
    クライアントは Gateway が発行する `connect.challenge` を待機します。
  </Step>
  <Step title="ペイロードに署名">
    クライアントはチャレンジに紐づいたペイロードに署名します。
  </Step>
  <Step title="デバイス nonce を送信">
    クライアントは同じチャレンジ nonce を使って `connect.params.device.nonce` を送信します。
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` が予期せず拒否される場合:

- ペアリング済みデバイストークンのセッションは、呼び出し元が `operator.admin` も持っていない限り、**自身の** デバイスしか管理できません
- `openclaw devices rotate --scope ...` は、呼び出し元セッションがすでに保持している operator スコープのみを要求できます

関連:

- [構成](/ja-JP/gateway/configuration) (Gateway 認証モード)
- [Control UI](/ja-JP/web/control-ui)
- [デバイス](/ja-JP/cli/devices)
- [リモートアクセス](/ja-JP/gateway/remote)
- [信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)

## Gateway サービスが実行されていない

サービスはインストール済みだが、プロセスが起動し続けない場合に使います。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

確認すること:

- `Runtime: stopped` と終了ヒント。
- サービス構成の不一致 (`Config (cli)` と `Config (service)`)。
- ポート/リスナーの競合。
- `--deep` を使った場合の余分な launchd/systemd/schtasks インストール。
- `Other gateway-like services detected (best effort)` のクリーンアップヒント。

<AccordionGroup>
  <Accordion title="一般的な兆候">
    - `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → local Gateway モードが有効ではない、または構成ファイルが上書きされて `gateway.mode` が失われています。修正: 構成で `gateway.mode="local"` を設定するか、`openclaw onboard --mode local` / `openclaw setup` を再実行して、想定される local モード構成を再スタンプします。Podman 経由で OpenClaw を実行している場合、デフォルトの構成パスは `~/.openclaw/openclaw.json` です。
    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証経路 (トークン/パスワード、または構成済みの場合は信頼済みプロキシ) なしで非 loopback にバインドしようとしています。
    - `another gateway instance is already listening` / `EADDRINUSE` → ポート競合です。
    - `Other gateway-like services detected (best effort)` → 古い、または並列の launchd/systemd/schtasks ユニットが存在します。ほとんどのセットアップでは、1 台のマシンにつき 1 つの Gateway にするべきです。複数必要な場合は、ポート + 構成/状態/ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。
    - doctor の `System-level OpenClaw gateway service detected` → ユーザーレベルサービスがない一方で systemd システムユニットが存在します。doctor にユーザーサービスのインストールを許可する前に重複を削除または無効化するか、システムユニットが意図したスーパーバイザーである場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。
    - `Gateway service port does not match current gateway config` → インストール済みスーパーバイザーがまだ古い `--port` を固定しています。`openclaw doctor --fix` または `openclaw gateway install --force` を実行してから、Gateway サービスを再起動します。

  </Accordion>
</AccordionGroup>

関連:

- [バックグラウンド実行とプロセスツール](/ja-JP/gateway/background-process)
- [構成](/ja-JP/gateway/configuration)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway が最後の正常な構成を復元した

Gateway は起動するが、ログに `openclaw.json` を復元したと表示される場合に使います。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

確認すること:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- アクティブな構成の隣にある、タイムスタンプ付きの `openclaw.json.clobbered.*` ファイル
- `Config recovery warning` で始まるメインエージェントのシステムイベント

<AccordionGroup>
  <Accordion title="何が起きたか">
    - 拒否された構成は、起動中またはホットリロード中に検証に合格しませんでした。
    - OpenClaw は拒否されたペイロードを `.clobbered.*` として保存しました。
    - アクティブな構成は、最後に検証済みの last-known-good コピーから復元されました。
    - 次のメインエージェントターンでは、拒否された構成を盲目的に書き直さないよう警告されます。
    - すべての検証問題が `plugins.entries.<id>...` の下にあった場合、OpenClaw はファイル全体を復元しません。Plugin ローカルの失敗は明確に残り、無関係なユーザー設定はアクティブな構成に残ります。

  </Accordion>
  <Accordion title="調査と修復">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="一般的な兆候">
    - `.clobbered.*` が存在する → 外部からの直接編集または起動時読み取りが復元されました。
    - `.rejected.*` が存在する → OpenClaw が所有する構成書き込みが、コミット前にスキーマまたは上書きチェックで失敗しました。
    - `Config write rejected:` → 書き込みが必須の形を落とす、ファイルを急激に縮小する、または無効な構成を永続化しようとしました。
    - `Rejected validation details:` → 復旧ログまたはメインエージェント通知に、復元の原因となったスキーマパスが含まれます。例: `agents.defaults.execution` または `gateway.auth.password.source`。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good`、または `size-drop-vs-last-good:*` → 現在のファイルが last-known-good バックアップと比較してフィールドまたはサイズを失っていたため、起動時に上書きされたものとして扱われました。
    - `Config last-known-good promotion skipped` → 候補に `***` などの墨消し済みシークレットプレースホルダーが含まれていました。

  </Accordion>
  <Accordion title="修正オプション">
    1. 復元されたアクティブな構成が正しい場合は、そのまま維持します。
    2. `.clobbered.*` または `.rejected.*` から意図したキーだけをコピーし、`openclaw config set` または `config.patch` で適用します。
    3. 再起動前に `openclaw config validate` を実行します。
    4. 手作業で編集する場合は、変更したい部分オブジェクトだけではなく、完全な JSON5 構成を保持します。
  </Accordion>
</AccordionGroup>

関連:

- [Config](/ja-JP/cli/config)
- [構成: ホットリロード](/ja-JP/gateway/configuration#config-hot-reload)
- [構成: 厳格な検証](/ja-JP/gateway/configuration#strict-validation)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway probe の警告

`openclaw gateway probe` が何かに到達するものの、警告ブロックも表示する場合に使います。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認すること:

- JSON 出力の `warnings[].code` と `primaryTargetId`。
- 警告が SSH フォールバック、複数の Gateway、不足スコープ、未解決の認証参照のいずれに関するものか。

一般的な兆候:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH セットアップに失敗しましたが、コマンドは引き続き構成済み/loopback の直接ターゲットを試しました。
- `multiple reachable gateways detected` → 複数のターゲットが応答しました。通常これは、意図的なマルチ Gateway セットアップ、または古い/重複したリスナーを意味します。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続は成功しましたが、詳細 RPC はスコープによって制限されています。デバイス ID をペアリングするか、`operator.read` を持つ認証情報を使ってください。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 接続は成功しましたが、完全な診断 RPC セットがタイムアウトまたは失敗しました。これは診断が劣化した到達可能な Gateway として扱い、`--json` 出力の `connect.ok` と `connect.rpcOk` を比較します。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → Gateway は応答しましたが、このクライアントは通常の operator アクセスの前にまだペアリング/承認が必要です。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef 警告テキスト → 失敗したターゲットに対して、このコマンド経路では認証素材を利用できませんでした。

関連:

- [Gateway](/ja-JP/cli/gateway)
- [同じホスト上の複数 Gateway](/ja-JP/gateway#multiple-gateways-same-host)
- [リモートアクセス](/ja-JP/gateway/remote)

## チャネルは接続済みだが、メッセージが流れない

チャネル状態が接続済みだがメッセージフローが停止している場合は、ポリシー、権限、チャネル固有の配信ルールに注目します。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認すること:

- DM ポリシー（`pairing`、`allowlist`、`open`、`disabled`）。
- グループの許可リストとメンション要件。
- チャネル API 権限/スコープの不足。

一般的な兆候:

- `mention required` → グループのメンションポリシーによりメッセージが無視されました。
- `pairing` / 承認待ちのトレース → 送信者が承認されていません。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → チャネル認証/権限の問題です。

関連:

- [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [Discord](/ja-JP/channels/discord)
- [Telegram](/ja-JP/channels/telegram)
- [WhatsApp](/ja-JP/channels/whatsapp)

## Cron と Heartbeat の配信

Cron または Heartbeat が実行されなかった、または配信されなかった場合は、まずスケジューラーの状態を確認し、その後に配信先を確認します。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認すること:

- Cron が有効で、次回の起動が存在する。
- ジョブ実行履歴の状態（`ok`、`skipped`、`error`）。
- Heartbeat のスキップ理由（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron が無効です。
    - `cron: timer tick failed` → スケジューラーの tick に失敗しました。ファイル/ログ/ランタイムエラーを確認してください。
    - `heartbeat skipped` と `reason=quiet-hours` → アクティブ時間帯の範囲外です。
    - `heartbeat skipped` と `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在しますが、空行または Markdown 見出ししか含まれていないため、OpenClaw はモデル呼び出しをスキップします。
    - `heartbeat skipped` と `reason=no-tasks-due` → `HEARTBEAT.md` に `tasks:` ブロックが含まれていますが、この tick で期限を迎えるタスクがありません。
    - `heartbeat: unknown accountId` → Heartbeat 配信先のアカウント ID が無効です。
    - `heartbeat skipped` と `reason=dm-blocked` → `agents.defaults.heartbeat.directPolicy`（またはエージェントごとの上書き）が `block` に設定されている間に、Heartbeat の対象が DM 形式の宛先に解決されました。

  </Accordion>
</AccordionGroup>

関連:

- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュール済みタスク](/ja-JP/automation/cron-jobs)
- [スケジュール済みタスク: トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting)

## Node はペアリング済みだがツールが失敗する

Node がペアリング済みでもツールが失敗する場合は、フォアグラウンド、権限、承認の状態を切り分けます。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認すること:

- Node がオンラインで、期待される機能を備えている。
- カメラ/マイク/位置情報/画面の OS 権限付与。
- exec 承認と許可リストの状態。

一般的な兆候:

- `NODE_BACKGROUND_UNAVAILABLE` → Node アプリをフォアグラウンドにする必要があります。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 権限が不足しています。
- `SYSTEM_RUN_DENIED: approval required` → exec 承認が保留中です。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが許可リストによりブロックされました。

関連:

- [Exec 承認](/ja-JP/tools/exec-approvals)
- [Node のトラブルシューティング](/ja-JP/nodes/troubleshooting)
- [Node](/ja-JP/nodes/index)

## ブラウザツールが失敗する

Gateway 自体は正常でもブラウザツールのアクションが失敗する場合に使用します。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認すること:

- `plugins.allow` が設定され、`browser` を含んでいるか。
- 有効なブラウザ実行ファイルパス。
- CDP プロファイルへの到達性。
- `existing-session` / `user` プロファイル向けのローカル Chrome の可用性。

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` または `unknown command 'browser'` → 同梱のブラウザ Plugin が `plugins.allow` により除外されています。
    - `browser.enabled=true` の間にブラウザツールが欠落/利用不可 → `plugins.allow` が `browser` を除外しているため、Plugin が読み込まれていません。
    - `Failed to start Chrome CDP on port` → ブラウザプロセスの起動に失敗しました。
    - `browser.executablePath not found` → 設定されたパスが無効です。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定された CDP URL が `file:` や `ftp:` などの未対応スキームを使用しています。
    - `browser.cdpUrl has invalid port` → 設定された CDP URL のポートが不正または範囲外です。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在の Gateway インストールには、同梱ブラウザ Plugin の `playwright-core` ランタイム依存関係がありません。`openclaw doctor --fix` を実行してから Gateway を再起動してください。ARIA スナップショットと基本的なページスクリーンショットは引き続き動作する場合がありますが、ナビゲーション、AI スナップショット、CSS セレクター要素スクリーンショット、PDF エクスポートは利用できません。

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP の existing-session が、選択されたブラウザデータディレクトリにまだアタッチできませんでした。ブラウザの inspect ページを開き、リモートデバッグを有効にし、ブラウザを開いたままにして、最初のアタッチプロンプトを承認してから再試行してください。サインイン状態が不要な場合は、管理対象の `openclaw` プロファイルを優先してください。
    - `No Chrome tabs found for profile="user"` → Chrome MCP のアタッチプロファイルに、開いているローカル Chrome タブがありません。
    - `Remote CDP for profile "<name>" is not reachable` → 設定されたリモート CDP エンドポイントに Gateway ホストから到達できません。
    - `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → アタッチ専用プロファイルに到達可能なターゲットがないか、HTTP エンドポイントは応答したものの CDP WebSocket を開けませんでした。

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → スクリーンショット要求で `--full-page` と `--ref` または `--element` が混在しています。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` のスクリーンショット呼び出しでは、CSS `--element` ではなく、ページキャプチャまたはスナップショットの `--ref` を使用する必要があります。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP のアップロードフックには、CSS セレクターではなくスナップショット ref が必要です。
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP プロファイルでは、1 回の呼び出しにつき 1 ファイルをアップロードしてください。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP プロファイル上のダイアログフックはタイムアウトの上書きをサポートしていません。
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session プロファイルの `act:type` では `timeoutMs` を省略するか、カスタムタイムアウトが必要な場合は管理対象/CDP ブラウザプロファイルを使用してください。
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session プロファイルの `act:evaluate` では `timeoutMs` を省略するか、カスタムタイムアウトが必要な場合は管理対象/CDP ブラウザプロファイルを使用してください。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` にはまだ管理対象ブラウザまたは raw CDP プロファイルが必要です。
    - アタッチ専用またはリモート CDP プロファイルで viewport / dark-mode / locale / offline の上書きが古い → Gateway 全体を再起動せずに、`openclaw browser stop --browser-profile <name>` を実行してアクティブな制御セッションを閉じ、Playwright/CDP エミュレーション状態を解放してください。

  </Accordion>
</AccordionGroup>

関連:

- [ブラウザ（OpenClaw 管理）](/ja-JP/tools/browser)
- [ブラウザのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)

## アップグレード後に何かが突然壊れた場合

アップグレード後の破損の多くは、設定のドリフト、または現在はより厳格なデフォルトが適用されていることが原因です。

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    確認すること:

    - `gateway.mode=remote` の場合、ローカルサービスは正常でも CLI 呼び出しがリモートを対象にしている可能性があります。
    - 明示的な `--url` 呼び出しは、保存済みの認証情報にフォールバックしません。

    一般的な兆候:

    - `gateway connect failed:` → URL ターゲットが誤っています。
    - `unauthorized` → エンドポイントには到達できますが、認証が誤っています。

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

    - 非ループバックバインド（`lan`、`tailnet`、`custom`）には、有効な Gateway 認証パスが必要です。共有トークン/パスワード認証、または正しく設定された非ループバックの `trusted-proxy` デプロイです。
    - `gateway.token` のような古いキーは `gateway.auth.token` を置き換えません。

    一般的な兆候:

    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証パスなしの非ループバックバインドです。
    - ランタイムが実行中なのに `Connectivity probe: failed` → Gateway は稼働していますが、現在の認証/URL ではアクセスできません。

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    確認すること:

    - ダッシュボード/Node の保留中デバイス承認。
    - ポリシーまたは ID 変更後の保留中 DM ペアリング承認。

    一般的な兆候:

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
