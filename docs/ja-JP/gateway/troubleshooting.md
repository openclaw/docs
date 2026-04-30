---
read_when:
    - トラブルシューティングハブから、より詳しい診断のためにここへ案内されました
    - 正確なコマンドを含む、安定した症状ベースのランブックセクションが必要です
sidebarTitle: Troubleshooting
summary: Gateway、チャンネル、自動化、ノード、ブラウザー向けの詳細なトラブルシューティングランブック
title: トラブルシューティング
x-i18n:
    generated_at: "2026-04-30T05:16:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48735a68daa92678867a9cafb3ceeb37063bb91dee8c4c94e185f74eb0296fcb
    source_path: gateway/troubleshooting.md
    workflow: 16
---

このページは詳細なランブックです。先に高速なトリアージフローを確認したい場合は、[/help/troubleshooting](/ja-JP/help/troubleshooting) から始めてください。

## コマンドの手順

最初に、次の順序で実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常時に期待されるシグナル:

- `openclaw gateway status` に `Runtime: running`、`Connectivity probe: ok`、および `Capability: ...` 行が表示される。
- `openclaw doctor` がブロック要因となる設定/サービスの問題を報告しない。
- `openclaw channels status --probe` がアカウントごとのライブ転送ステータスと、対応している場合は `works` や `audit ok` などのプローブ/監査結果を表示する。

## 分裂したインストールと新しい設定ガード

更新後に Gateway サービスが予期せず停止する場合、またはログに、ある `openclaw` バイナリが最後に `openclaw.json` を書き込んだバージョンより古いことが示される場合に使用します。

OpenClaw は設定の書き込みに `meta.lastTouchedVersion` を記録します。読み取り専用コマンドは、より新しい OpenClaw によって書き込まれた設定を引き続き検査できますが、プロセスとサービスの変更は古いバイナリからの継続を拒否します。ブロックされる操作には、Gateway サービスの開始、停止、再起動、アンインストール、強制サービス再インストール、サービスモードでの Gateway 起動、`gateway --force` のポートクリーンアップが含まれます。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH を修正する">
    `openclaw` がより新しいインストールを解決するように `PATH` を修正し、その後アクションを再実行します。
  </Step>
  <Step title="Gateway サービスを再インストールする">
    より新しいインストールから、意図した Gateway サービスを再インストールします。

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="古いラッパーを削除する">
    古い `openclaw` バイナリをまだ指している、古いシステムパッケージまたは古いラッパーエントリを削除します。
  </Step>
</Steps>

<Warning>
意図的なダウングレードまたは緊急復旧の場合にのみ、単一のコマンドに対して `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` を設定してください。通常運用では未設定のままにします。
</Warning>

## 長いコンテキストには Anthropic 429 の追加使用量が必要

ログ/エラーに `HTTP 429: rate_limit_error: Extra usage is required for long context requests` が含まれる場合に使用します。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認する内容:

- 選択された Anthropic Opus/Sonnet モデルに `params.context1m: true` がある。
- 現在の Anthropic 認証情報が長いコンテキストの使用対象ではない。
- リクエストが、1M ベータパスを必要とする長いセッション/モデル実行でのみ失敗する。

修正オプション:

<Steps>
  <Step title="context1m を無効にする">
    そのモデルの `context1m` を無効にして、通常のコンテキストウィンドウへフォールバックします。
  </Step>
  <Step title="対象となる認証情報を使用する">
    長いコンテキストリクエストの対象となる Anthropic 認証情報を使用するか、Anthropic API キーに切り替えます。
  </Step>
  <Step title="フォールバックモデルを設定する">
    Anthropic の長いコンテキストリクエストが拒否されても実行が継続するように、フォールバックモデルを設定します。
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

確認する内容:

- 小さな直接呼び出しは成功するが、OpenClaw の実行は大きなプロンプトでのみ失敗する
- 同じ素のモデル ID で直接 `/v1/chat/completions`
  が動作しているにもかかわらず、`model_not_found` または 404 エラーが発生する
- `messages[].content` が文字列を期待しているというバックエンドエラー
- OpenAI 互換ローカルバックエンドで、断続的に `incomplete turn detected ... stopReason=stop payloads=0` 警告が出る
- より大きなプロンプトトークン数または完全なエージェントランタイムプロンプトでのみ発生するバックエンドクラッシュ

<AccordionGroup>
  <Accordion title="一般的なシグネチャ">
    - ローカル MLX/vLLM スタイルのサーバーで `model_not_found` → `baseUrl` に `/v1` が含まれること、`/v1/chat/completions` バックエンドでは `api` が `"openai-completions"` であること、`models.providers.<provider>.models[].id` が素のプロバイダー内 ID であることを確認します。選択時は一度だけプロバイダープレフィックス付きで指定します。例: `mlx/mlx-community/Qwen3-30B-A3B-6bit`; カタログエントリは `mlx-community/Qwen3-30B-A3B-6bit` のままにします。
    - `messages[...].content: invalid type: sequence, expected a string` → バックエンドが構造化された Chat Completions コンテンツパーツを拒否しています。修正: `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
    - `incomplete turn detected ... stopReason=stop payloads=0` → バックエンドは Chat Completions リクエストを完了しましたが、そのターンにユーザーが見えるアシスタントテキストを返していません。OpenClaw は再生しても安全な空の OpenAI 互換ターンを一度だけ再試行します。継続的な失敗は通常、バックエンドが空/非テキストのコンテンツを出力しているか、最終回答テキストを抑制していることを意味します。
    - 小さな直接リクエストは成功するが、OpenClaw エージェント実行がバックエンド/モデルのクラッシュで失敗する（例: 一部の `inferrs` ビルド上の Gemma）→ OpenClaw の転送はおそらくすでに正しいです。バックエンドが、より大きなエージェントランタイムプロンプト形状で失敗しています。
    - ツールを無効化すると失敗は減るが消えない → ツールスキーマは負荷の一部でしたが、残る問題は依然として上流モデル/サーバーの容量またはバックエンドのバグです。

  </Accordion>
  <Accordion title="修正オプション">
    1. 文字列のみの Chat Completions バックエンドには `compat.requiresStringContent: true` を設定します。
    2. OpenClaw のツールスキーマサーフェスを確実に処理できないモデル/バックエンドには `compat.supportsTools: false` を設定します。
    3. 可能な範囲でプロンプト負荷を下げます: より小さいワークスペースブートストラップ、より短いセッション履歴、より軽いローカルモデル、またはより強力な長いコンテキスト対応を持つバックエンド。
    4. 小さな直接リクエストは通り続ける一方で OpenClaw エージェントターンがバックエンド内部でまだクラッシュする場合は、上流サーバー/モデルの制限として扱い、受け入れられたペイロード形状とともにそこで再現報告を提出します。
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

確認する内容:

- DM 送信者のペアリングが保留中。
- グループメンションのゲート制御（`requireMention`、`mentionPatterns`）。
- チャンネル/グループの許可リスト不一致。

一般的なシグネチャ:

- `drop guild message (mention required` → メンションされるまでグループメッセージは無視されます。
- `pairing request` → 送信者の承認が必要です。
- `blocked` / `allowlist` → 送信者/チャンネルがポリシーによってフィルタリングされました。

関連:

- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
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

確認する内容:

- 正しいプローブ URL とダッシュボード URL。
- クライアントと Gateway の間の認証モード/トークン不一致。
- デバイス ID が必要な場所で HTTP を使用している。

<AccordionGroup>
  <Accordion title="接続 / 認証シグネチャ">
    - `device identity required` → 非セキュアコンテキスト、またはデバイス認証の欠落。
    - `origin not allowed` → ブラウザーの `Origin` が `gateway.controlUi.allowedOrigins` に含まれていません（または明示的な許可リストなしで非ループバックブラウザーオリジンから接続しています）。
    - `device nonce required` / `device nonce mismatch` → クライアントがチャレンジベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していません。
    - `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったペイロード（または古いタイムスタンプ）に署名しました。
    - `AUTH_TOKEN_MISMATCH` かつ `canRetryWithDeviceToken=true` → クライアントはキャッシュ済みデバイストークンで信頼済みリトライを一度実行できます。
    - そのキャッシュトークンリトライでは、ペアリング済みデバイストークンとともに保存されたキャッシュ済みスコープセットを再利用します。明示的な `deviceToken` / 明示的な `scopes` 呼び出し元は、代わりに要求したスコープセットを保持します。
    - そのリトライパスの外では、接続認証の優先順位は、明示的な共有トークン/パスワード、次に明示的な `deviceToken`、次に保存済みデバイストークン、最後にブートストラップトークンです。
    - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, ip}` に対する失敗試行は、リミッターが失敗を記録する前に直列化されます。そのため、同じクライアントからの不正な同時リトライが 2 つある場合、2 つの単純な不一致ではなく、2 回目の試行で `retry later` が表面化することがあります。
    - ブラウザーオリジンのループバッククライアントから `too many failed authentication attempts (retry later)` → 同じ正規化済み `Origin` からの失敗が繰り返され、一時的にロックアウトされています。別の localhost オリジンは別バケットを使用します。
    - そのリトライ後も `unauthorized` が繰り返される → 共有トークン/デバイストークンのずれです。必要に応じてトークン設定を更新し、デバイストークンを再承認/ローテーションします。
    - `gateway connect failed:` → ホスト/ポート/URL ターゲットが誤っています。

  </Accordion>
</AccordionGroup>

### 認証詳細コードのクイックマップ

失敗した `connect` レスポンスの `error.details.code` を使用して、次のアクションを選択します。

| 詳細コード                  | 意味                                                                                                                                                                                      | 推奨される対応                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | クライアントが必要な共有トークンを送信しませんでした。                                                                                                                                                 | クライアントにトークンを貼り付けるか設定して、再試行します。ダッシュボードのパスの場合: `openclaw config get gateway.auth.token` を実行してから、Control UI 設定に貼り付けます。                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共有トークンが Gateway 認証トークンと一致しませんでした。                                                                                                                                               | `canRetryWithDeviceToken=true` の場合は、信頼済みの再試行を 1 回許可します。キャッシュされたトークンでの再試行では、保存済みの承認済みスコープを再利用します。明示的な `deviceToken` / `scopes` 呼び出し元は要求したスコープを保持します。それでも失敗する場合は、[トークンドリフト復旧チェックリスト](/ja-JP/cli/devices#token-drift-recovery-checklist)を実行します。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | キャッシュされたデバイスごとのトークンが古いか、取り消されています。                                                                                                                                                 | [デバイス CLI](/ja-JP/cli/devices) を使ってデバイストークンをローテーションまたは再承認してから、再接続します。                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | デバイス ID の承認が必要です。`error.details.reason` で `not-paired`、`scope-upgrade`、`role-upgrade`、または `metadata-upgrade` を確認し、存在する場合は `requestId` / `remediationHint` を使用します。 | 保留中のリクエストを承認します: `openclaw devices list` の後に `openclaw devices approve <requestId>` を実行します。スコープ/ロールのアップグレードでは、要求されたアクセスを確認した後に同じフローを使用します。                                                                                                               |

<Note>
共有 Gateway トークン/パスワードで認証される直接 loopback バックエンド RPC は、CLI のペアリング済みデバイススコープのベースラインに依存すべきではありません。サブエージェントやその他の内部呼び出しがまだ `scope-upgrade` で失敗する場合は、呼び出し元が `client.id: "gateway-client"` と `client.mode: "backend"` を使用しており、明示的な `deviceIdentity` やデバイストークンを強制していないことを確認してください。
</Note>

デバイス認証 v2 の移行チェック:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログに nonce/署名エラーが表示される場合は、接続元クライアントを更新して検証します。

<Steps>
  <Step title="connect.challenge を待つ">
    クライアントは Gateway が発行した `connect.challenge` を待ちます。
  </Step>
  <Step title="ペイロードに署名する">
    クライアントはチャレンジにバインドされたペイロードに署名します。
  </Step>
  <Step title="デバイス nonce を送信する">
    クライアントは同じチャレンジ nonce を使用して `connect.params.device.nonce` を送信します。
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` が予期せず拒否される場合:

- ペアリング済みデバイストークンのセッションは、呼び出し元が `operator.admin` も持っていない限り、**自身の**デバイスしか管理できません
- `openclaw devices rotate --scope ...` は、呼び出し元セッションがすでに保持しているオペレータースコープのみ要求できます

関連:

- [構成](/ja-JP/gateway/configuration) (Gateway 認証モード)
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

確認する項目:

- `Runtime: stopped` と終了ヒント。
- サービス構成の不一致 (`Config (cli)` と `Config (service)`)。
- ポート/リスナーの競合。
- `--deep` が使用されている場合の追加の launchd/systemd/schtasks インストール。
- `Other gateway-like services detected (best effort)` のクリーンアップヒント。

<AccordionGroup>
  <Accordion title="一般的なシグネチャ">
    - `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → ローカル Gateway モードが有効になっていないか、構成ファイルが上書きされて `gateway.mode` が失われています。修正: 構成で `gateway.mode="local"` を設定するか、`openclaw onboard --mode local` / `openclaw setup` を再実行して、想定されるローカルモード構成を再スタンプします。Podman 経由で OpenClaw を実行している場合、デフォルトの構成パスは `~/.openclaw/openclaw.json` です。
    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証パス (トークン/パスワード、または構成済みの場合は信頼済みプロキシ) なしで非 loopback にバインドしようとしています。
    - `another gateway instance is already listening` / `EADDRINUSE` → ポート競合です。
    - `Other gateway-like services detected (best effort)` → 古い、または並行する launchd/systemd/schtasks ユニットが存在します。ほとんどのセットアップでは、1 台のマシンにつき 1 つの Gateway にするべきです。複数必要な場合は、ポート + 構成/状態/ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。
    - doctor からの `System-level OpenClaw gateway service detected` → ユーザーレベルのサービスがない一方で、systemd システムユニットが存在します。doctor にユーザーサービスをインストールさせる前に重複を削除または無効化するか、システムユニットが意図したスーパーバイザーである場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。
    - `Gateway service port does not match current gateway config` → インストール済みのスーパーバイザーがまだ古い `--port` を固定しています。`openclaw doctor --fix` または `openclaw gateway install --force` を実行してから、Gateway サービスを再起動します。

  </Accordion>
</AccordionGroup>

関連:

- [バックグラウンド実行とプロセスツール](/ja-JP/gateway/background-process)
- [構成](/ja-JP/gateway/configuration)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway が最後に正常だった構成を復元した

Gateway は起動するものの、ログで `openclaw.json` を復元したと表示される場合に使用します。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

確認する項目:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- アクティブな構成の横にある、タイムスタンプ付きの `openclaw.json.clobbered.*` ファイル
- `Config recovery warning` で始まるメインエージェントのシステムイベント

<AccordionGroup>
  <Accordion title="何が起きたか">
    - 拒否された構成は、起動中またはホットリロード中の検証に通りませんでした。
    - OpenClaw は拒否されたペイロードを `.clobbered.*` として保持しました。
    - アクティブな構成は、最後に検証された last-known-good コピーから復元されました。
    - 次のメインエージェントターンには、拒否された構成を無条件に書き直さないよう警告されます。
    - すべての検証問題が `plugins.entries.<id>...` の下にある場合、OpenClaw はファイル全体を復元しません。Plugin ローカルの失敗は明示されたまま、無関係なユーザー設定はアクティブな構成に残ります。

  </Accordion>
  <Accordion title="検査と修復">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="一般的なシグネチャ">
    - `.clobbered.*` が存在する → 外部からの直接編集、または起動時の読み取りが復元されました。
    - `.rejected.*` が存在する → OpenClaw 所有の構成書き込みが、コミット前にスキーマまたは clobber チェックに失敗しました。
    - `Config write rejected:` → 書き込みが必要な形状を落とそうとした、ファイルを急激に縮小しようとした、または無効な構成を永続化しようとしました。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good`、または `size-drop-vs-last-good:*` → 現在のファイルが、last-known-good バックアップと比較してフィールドまたはサイズを失っていたため、起動時に clobber されたものとして扱われました。
    - `Config last-known-good promotion skipped` → 候補に `***` などの秘匿済みシークレットプレースホルダーが含まれていました。

  </Accordion>
  <Accordion title="修正オプション">
    1. 復元されたアクティブ構成が正しければ、そのまま保持します。
    2. `.clobbered.*` または `.rejected.*` から意図したキーだけをコピーし、`openclaw config set` または `config.patch` で適用します。
    3. 再起動する前に `openclaw config validate` を実行します。
    4. 手作業で編集する場合は、変更したい部分オブジェクトだけではなく、完全な JSON5 構成を保持します。
  </Accordion>
</AccordionGroup>

関連:

- [Config](/ja-JP/cli/config)
- [構成: ホットリロード](/ja-JP/gateway/configuration#config-hot-reload)
- [構成: 厳密な検証](/ja-JP/gateway/configuration#strict-validation)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway プローブ警告

`openclaw gateway probe` が何かに到達するものの、警告ブロックも出力する場合に使用します。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認する項目:

- JSON 出力内の `warnings[].code` と `primaryTargetId`。
- 警告が SSH フォールバック、複数 Gateway、スコープ不足、または未解決の認証参照に関するものかどうか。

一般的なシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH セットアップに失敗しましたが、コマンドは構成済み/loopback ターゲットへの直接プローブを試行しました。
- `multiple reachable gateways detected` → 複数のターゲットが応答しました。通常、これは意図的な複数 Gateway セットアップ、または古い/重複したリスナーを意味します。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続は成功しましたが、詳細 RPC はスコープで制限されています。デバイス ID をペアリングするか、`operator.read` を持つ認証情報を使用してください。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 接続は成功しましたが、完全な診断 RPC セットがタイムアウトまたは失敗しました。これは診断機能が低下した到達可能な Gateway として扱い、`--json` 出力の `connect.ok` と `connect.rpcOk` を比較してください。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → Gateway は応答しましたが、このクライアントは通常のオペレーターアクセスの前に、まだペアリング/承認が必要です。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef 警告テキスト → 失敗したターゲットについて、このコマンドパスで認証素材を利用できませんでした。

関連:

- [Gateway](/ja-JP/cli/gateway)
- [同じホスト上の複数 Gateway](/ja-JP/gateway#multiple-gateways-same-host)
- [リモートアクセス](/ja-JP/gateway/remote)

## チャネルは接続済みだが、メッセージが流れない

チャネル状態が接続済みでもメッセージフローが停止している場合は、ポリシー、権限、チャネル固有の配信ルールに注目します。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認する項目:

- DM ポリシー (`pairing`、`allowlist`、`open`、`disabled`)。
- グループ許可リストとメンション要件。
- 不足しているチャネル API 権限/スコープ。

一般的なシグネチャ:

- `mention required` → グループメンションポリシーによりメッセージは無視されます。
- `pairing` / 承認待ちのトレース → 送信者が承認されていません。
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → チャンネルの認証/権限の問題です。

関連:

- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [Discord](/ja-JP/channels/discord)
- [Telegram](/ja-JP/channels/telegram)
- [WhatsApp](/ja-JP/channels/whatsapp)

## Cron と Heartbeat の配信

Cron または Heartbeat が実行されなかった、または配信されなかった場合は、まずスケジューラの状態を確認し、その後で配信先を確認します。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認する内容:

- Cron が有効で、次回の起床時刻が存在すること。
- ジョブ実行履歴のステータス (`ok`, `skipped`, `error`)。
- Heartbeat のスキップ理由 (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)。

<AccordionGroup>
  <Accordion title="一般的なシグネチャ">
    - `cron: scheduler disabled; jobs will not run automatically` → cron が無効です。
    - `cron: timer tick failed` → スケジューラの tick に失敗しました。ファイル/ログ/ランタイムエラーを確認してください。
    - `heartbeat skipped` で `reason=quiet-hours` → アクティブ時間帯の範囲外です。
    - `heartbeat skipped` で `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在しますが、空行または Markdown 見出ししか含まれていないため、OpenClaw はモデル呼び出しをスキップします。
    - `heartbeat skipped` で `reason=no-tasks-due` → `HEARTBEAT.md` に `tasks:` ブロックがありますが、この tick で期限に達したタスクがありません。
    - `heartbeat: unknown accountId` → Heartbeat 配信先のアカウント ID が無効です。
    - `heartbeat skipped` で `reason=dm-blocked` → `agents.defaults.heartbeat.directPolicy` (またはエージェントごとの上書き) が `block` に設定されている間に、Heartbeat の送信先が DM 形式の送信先として解決されました。

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

確認する内容:

- Node がオンラインで、期待される機能を持っていること。
- カメラ/マイク/位置情報/画面に対する OS 権限の付与。
- 実行承認と allowlist の状態。

一般的なシグネチャ:

- `NODE_BACKGROUND_UNAVAILABLE` → node アプリをフォアグラウンドにする必要があります。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 権限が不足しています。
- `SYSTEM_RUN_DENIED: approval required` → 実行承認が保留中です。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが allowlist によってブロックされています。

関連:

- [実行承認](/ja-JP/tools/exec-approvals)
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

確認する内容:

- `plugins.allow` が設定されており、`browser` を含んでいるか。
- 有効なブラウザ実行ファイルのパス。
- CDP プロファイルに到達できるか。
- `existing-session` / `user` プロファイル用のローカル Chrome が利用可能か。

<AccordionGroup>
  <Accordion title="Plugin / 実行ファイルのシグネチャ">
    - `unknown command "browser"` または `unknown command 'browser'` → バンドルされたブラウザ Plugin が `plugins.allow` によって除外されています。
    - `browser.enabled=true` なのにブラウザツールが見つからない/利用できない → `plugins.allow` が `browser` を除外しているため、Plugin が読み込まれていません。
    - `Failed to start Chrome CDP on port` → ブラウザプロセスの起動に失敗しました。
    - `browser.executablePath not found` → 設定されたパスが無効です。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定された CDP URL が `file:` や `ftp:` などのサポートされないスキームを使用しています。
    - `browser.cdpUrl has invalid port` → 設定された CDP URL のポートが不正、または範囲外です。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在の gateway インストールには、バンドルされたブラウザ Plugin の `playwright-core` ランタイム依存関係がありません。`openclaw doctor --fix` を実行し、その後 Gateway を再起動してください。ARIA スナップショットと基本的なページスクリーンショットは引き続き動作しますが、ナビゲーション、AI スナップショット、CSS セレクタ要素スクリーンショット、PDF エクスポートは利用できないままです。

  </Accordion>
  <Accordion title="Chrome MCP / existing-session のシグネチャ">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session は、選択されたブラウザデータディレクトリにまだ接続できませんでした。ブラウザの inspect ページを開き、リモートデバッグを有効にし、ブラウザを開いたままにして、最初の接続プロンプトを承認してから再試行してください。サインイン状態が不要な場合は、管理対象の `openclaw` プロファイルを優先してください。
    - `No Chrome tabs found for profile="user"` → Chrome MCP 接続プロファイルに、開いているローカル Chrome タブがありません。
    - `Remote CDP for profile "<name>" is not reachable` → 設定されたリモート CDP エンドポイントに Gateway ホストから到達できません。
    - `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only プロファイルに到達可能なターゲットがない、または HTTP エンドポイントは応答したものの CDP WebSocket を開けませんでした。

  </Accordion>
  <Accordion title="要素 / スクリーンショット / アップロードのシグネチャ">
    - `fullPage is not supported for element screenshots` → スクリーンショットリクエストで `--full-page` と `--ref` または `--element` が混在しています。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` のスクリーンショット呼び出しでは、CSS の `--element` ではなく、ページキャプチャまたはスナップショットの `--ref` を使用する必要があります。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP のアップロードフックには、CSS セレクタではなくスナップショット ref が必要です。
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP プロファイルでは、1 回の呼び出しにつき 1 ファイルを送信してください。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP プロファイルのダイアログフックはタイムアウトの上書きをサポートしていません。
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session プロファイルで `act:type` を使う場合は `timeoutMs` を省略してください。カスタムタイムアウトが必要な場合は、管理対象/CDP ブラウザプロファイルを使用してください。
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session プロファイルで `act:evaluate` を使う場合は `timeoutMs` を省略してください。カスタムタイムアウトが必要な場合は、管理対象/CDP ブラウザプロファイルを使用してください。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` には、まだ管理対象ブラウザまたは raw CDP プロファイルが必要です。
    - attach-only またはリモート CDP プロファイルでの古い viewport / dark-mode / locale / offline 上書き → Gateway 全体を再起動せずにアクティブな制御セッションを閉じ、Playwright/CDP エミュレーション状態を解放するには、`openclaw browser stop --browser-profile <name>` を実行します。

  </Accordion>
</AccordionGroup>

関連:

- [ブラウザ (OpenClaw 管理)](/ja-JP/tools/browser)
- [ブラウザのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)

## アップグレード後に突然何かが壊れた場合

アップグレード後の破損の多くは、設定のドリフト、またはより厳格なデフォルトが現在適用されていることが原因です。

<AccordionGroup>
  <Accordion title="1. 認証と URL 上書きの動作が変更されました">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    確認する内容:

    - `gateway.mode=remote` の場合、ローカルサービスに問題がなくても CLI 呼び出しがリモートを対象にしている可能性があります。
    - 明示的な `--url` 呼び出しは、保存済み資格情報にフォールバックしません。

    一般的なシグネチャ:

    - `gateway connect failed:` → URL ターゲットが誤っています。
    - `unauthorized` → エンドポイントには到達できますが、認証が誤っています。

  </Accordion>
  <Accordion title="2. バインドと認証のガードレールがより厳格になりました">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    確認する内容:

    - 非ループバックバインド (`lan`, `tailnet`, `custom`) には、有効な Gateway 認証パスが必要です。共有トークン/パスワード認証、または正しく設定された非ループバックの `trusted-proxy` デプロイです。
    - `gateway.token` のような古いキーは `gateway.auth.token` の代わりにはなりません。

    一般的なシグネチャ:

    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証パスなしの非ループバックバインドです。
    - ランタイムは実行中なのに `Connectivity probe: failed` → Gateway は生きていますが、現在の認証/URL ではアクセスできません。

  </Accordion>
  <Accordion title="3. ペアリングとデバイス ID の状態が変更されました">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    確認する内容:

    - ダッシュボード/Node の保留中のデバイス承認。
    - ポリシーまたは ID 変更後の保留中の DM ペアリング承認。

    一般的なシグネチャ:

    - `device identity required` → デバイス認証が満たされていません。
    - `pairing required` → 送信者/デバイスを承認する必要があります。

  </Accordion>
</AccordionGroup>

確認後もサービス設定とランタイムがまだ一致しない場合は、同じプロファイル/状態ディレクトリからサービスメタデータを再インストールしてください。

```bash
openclaw gateway install --force
openclaw gateway restart
```

関連:

- [認証](/ja-JP/gateway/authentication)
- [バックグラウンド実行とプロセスツール](/ja-JP/gateway/background-process)
- [Gateway 所有のペアリング](/ja-JP/gateway/pairing)

## 関連

- [Doctor](/ja-JP/gateway/doctor)
- [FAQ](/ja-JP/help/faq)
- [Gateway ランブック](/ja-JP/gateway)
