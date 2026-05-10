---
read_when:
    - トラブルシューティングハブから、より詳しい診断のためにここへ案内されました
    - 正確なコマンドを含む、症状ベースで安定したランブックセクションが必要です
sidebarTitle: Troubleshooting
summary: Gateway、チャンネル、自動化、ノード、ブラウザー向けの詳細なトラブルシューティングランブック
title: トラブルシューティング
x-i18n:
    generated_at: "2026-05-10T19:37:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 798016211b615242abca327295c76223ff2dfd3d83dc8a08e396d9e65b9efed4
    source_path: gateway/troubleshooting.md
    workflow: 16
---

このページは詳細なランブックです。最初に高速なトリアージフローを使いたい場合は、[/help/troubleshooting](/ja-JP/help/troubleshooting) から始めてください。

## コマンドの段階

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
- `openclaw doctor` が、ブロック要因となる設定/サービスの問題を報告しない。
- `openclaw channels status --probe` が、アカウントごとのライブなトランスポート状態と、サポートされる場合は `works` や `audit ok` などのプローブ/監査結果を表示する。

## 分断されたインストールと新しい設定ガード

更新後に Gateway サービスが予期せず停止した場合、またはログから、ある `openclaw` バイナリが最後に `openclaw.json` を書き込んだバージョンより古いことが分かる場合に使用します。

OpenClaw は設定への書き込みに `meta.lastTouchedVersion` を刻印します。読み取り専用コマンドは新しい OpenClaw が書き込んだ設定を引き続き検査できますが、古いバイナリからのプロセスやサービスの変更は続行を拒否します。ブロックされる操作には、Gateway サービスの開始、停止、再起動、アンインストール、強制サービス再インストール、サービスモードの Gateway 起動、および `gateway --force` のポートクリーンアップが含まれます。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    `PATH` を修正して `openclaw` が新しいインストールを解決するようにし、その後アクションを再実行します。
  </Step>
  <Step title="Reinstall the gateway service">
    新しいインストールから、意図した Gateway サービスを再インストールします。

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    古い `openclaw` バイナリをまだ指している、古いシステムパッケージまたは古いラッパーエントリを削除します。
  </Step>
</Steps>

<Warning>
意図的なダウングレードまたは緊急リカバリの場合に限り、単一のコマンドに対して `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` を設定します。通常運用では未設定のままにしてください。
</Warning>

## Skill シンボリックリンクがパスエスケープとしてスキップされる

ログに次が含まれる場合に使用します。

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw は各 Skill ルートを封じ込め境界として扱います。
`~/.agents/skills`、`<workspace>/.agents/skills`、`<workspace>/skills`、または
`~/.openclaw/skills` の下にあるシンボリックリンクは、その実体のターゲットがそのルート外に解決される場合、
ターゲットが明示的に信頼されていない限りスキップされます。

リンクを検査します。

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

ターゲットが意図したものである場合は、直接の Skill ルートと許可されたシンボリックリンクターゲットの両方を設定します。

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

その後、新しいセッションを開始するか、Skills ウォッチャーの更新を待ちます。実行中のプロセスが設定変更より前のものなら、Gateway を再起動します。

`~`、`/`、または同期済みプロジェクトフォルダー全体などの広範なターゲットは使用しないでください。
`allowSymlinkTargets` は、信頼済みの `SKILL.md` ディレクトリを含む実際の Skill ルートに限定してください。

関連:

- [Skills 設定](/ja-JP/tools/skills-config#symlinked-sibling-repos)
- [設定例](/ja-JP/gateway/configuration-examples#symlinked-sibling-skill-repo)

## 長いコンテキストで Anthropic 429 の追加使用量が必要

ログ/エラーに `HTTP 429: rate_limit_error: Extra usage is required for long context requests` が含まれる場合に使用します。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認する項目:

- 選択された Anthropic Opus/Sonnet モデルに `params.context1m: true` がある。
- 現在の Anthropic 認証情報が長いコンテキストの使用対象ではない。
- リクエストが、1M ベータパスを必要とする長いセッション/モデル実行でのみ失敗する。

修正オプション:

<Steps>
  <Step title="Disable context1m">
    そのモデルの `context1m` を無効にし、通常のコンテキストウィンドウにフォールバックします。
  </Step>
  <Step title="Use an eligible credential">
    長いコンテキストリクエストの対象となる Anthropic 認証情報を使用するか、Anthropic API キーに切り替えます。
  </Step>
  <Step title="Configure fallback models">
    Anthropic の長いコンテキストリクエストが拒否された場合でも実行が継続するよう、フォールバックモデルを設定します。
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

確認する項目:

- 直接の小さな呼び出しは成功するが、OpenClaw の実行は大きなプロンプトでのみ失敗する
- 同じ素のモデル ID では直接 `/v1/chat/completions` が動作するにもかかわらず、
  `model_not_found` または 404 エラーが発生する
- `messages[].content` が文字列を期待しているというバックエンドエラー
- OpenAI 互換ローカルバックエンドで、`incomplete turn detected ... stopReason=stop payloads=0` 警告が断続的に発生する
- 大きなプロンプトトークン数または完全なエージェントランタイムプロンプトでのみ発生するバックエンドクラッシュ

<AccordionGroup>
  <Accordion title="Common signatures">
    - ローカル MLX/vLLM スタイルのサーバーでの `model_not_found` → `baseUrl` に `/v1` が含まれること、`/v1/chat/completions` バックエンドでは `api` が `"openai-completions"` であること、`models.providers.<provider>.models[].id` が素のプロバイダー内ローカル ID であることを確認します。選択時は、たとえば `mlx/mlx-community/Qwen3-30B-A3B-6bit` のようにプロバイダープレフィックスを一度付けます。カタログエントリは `mlx-community/Qwen3-30B-A3B-6bit` のままにします。
    - `messages[...].content: invalid type: sequence, expected a string` → バックエンドが構造化された Chat Completions コンテンツパートを拒否しています。修正: `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
    - `validation.keys` または `["role","content"]` のような許可されたメッセージキー → バックエンドが Chat Completions メッセージ上の OpenAI 形式のリプレイメタデータを拒否しています。修正: `models.providers.<provider>.models[].compat.strictMessageKeys: true` を設定します。
    - `incomplete turn detected ... stopReason=stop payloads=0` → バックエンドは Chat Completions リクエストを完了しましたが、そのターンでユーザーに見えるアシスタントテキストを返しませんでした。OpenClaw はリプレイ安全な空の OpenAI 互換ターンを一度再試行します。失敗が続く場合は通常、バックエンドが空/非テキストのコンテンツを出力しているか、最終回答テキストを抑制していることを意味します。
    - 直接の小さなリクエストは成功するが、OpenClaw エージェント実行はバックエンド/モデルクラッシュで失敗する（一部の `inferrs` ビルド上の Gemma など）→ OpenClaw のトランスポートはすでに正しい可能性が高く、バックエンドがより大きなエージェントランタイムプロンプト形状で失敗しています。
    - ツールを無効化すると失敗は減るが消えない → ツールスキーマが負荷の一因でしたが、残る問題は依然として上流モデル/サーバーの容量、またはバックエンドのバグです。

  </Accordion>
  <Accordion title="Fix options">
    1. 文字列のみの Chat Completions バックエンドには `compat.requiresStringContent: true` を設定します。
    2. 各メッセージで `role` と `content` のみを受け付ける厳密な Chat Completions バックエンドには、`compat.strictMessageKeys: true` を設定します。
    3. OpenClaw のツールスキーマサーフェスを確実に処理できないモデル/バックエンドには、`compat.supportsTools: false` を設定します。
    4. 可能な範囲でプロンプト負荷を下げます。より小さいワークスペースブートストラップ、短いセッション履歴、軽量なローカルモデル、または長いコンテキストのサポートが強いバックエンドを使います。
    5. 直接の小さなリクエストが引き続き成功する一方で、OpenClaw エージェントターンがバックエンド内でまだクラッシュする場合は、上流サーバー/モデルの制限として扱い、受け付けられたペイロード形状を添えてそちらに再現を報告します。
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

確認する項目:

- DM 送信者のペアリングが保留中。
- グループメンションのゲート制御（`requireMention`、`mentionPatterns`）。
- チャンネル/グループの許可リスト不一致。

よくあるシグネチャ:

- `drop guild message (mention required` → メンションされるまでグループメッセージは無視されます。
- `pairing request` → 送信者に承認が必要です。
- `blocked` / `allowlist` → 送信者/チャンネルがポリシーによりフィルターされました。

関連:

- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [グループ](/ja-JP/channels/groups)
- [ペアリング](/ja-JP/channels/pairing)

## ダッシュボードコントロール UI の接続性

ダッシュボード/コントロール UI が接続できない場合は、URL、認証モード、セキュアコンテキストの前提を検証します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認する項目:

- 正しいプローブ URL とダッシュボード URL。
- クライアントと Gateway の間の認証モード/トークン不一致。
- デバイス ID が必要な場所で HTTP を使用している。

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → 非セキュアコンテキスト、またはデバイス認証がありません。
    - `origin not allowed` → ブラウザーの `Origin` が `gateway.controlUi.allowedOrigins` に含まれていません（または明示的な許可リストなしで非ループバックのブラウザーオリジンから接続しています）。
    - `device nonce required` / `device nonce mismatch` → クライアントがチャレンジベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していません。
    - `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったペイロード（または古いタイムスタンプ）に署名しました。
    - `AUTH_TOKEN_MISMATCH` で `canRetryWithDeviceToken=true` → クライアントはキャッシュ済みデバイストークンで信頼済みの再試行を一度実行できます。
    - そのキャッシュ済みトークンの再試行では、ペアリング済みデバイストークンとともに保存されたキャッシュ済みスコープセットを再利用します。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、代わりにリクエストしたスコープセットを保持します。
    - その再試行パスの外では、接続認証の優先順位は明示的な共有トークン/パスワードが最初、次に明示的な `deviceToken`、次に保存済みデバイストークン、次にブートストラップトークンです。
    - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, ip}` に対する失敗した試行は、リミッターが失敗を記録する前に直列化されます。そのため、同じクライアントからの2つの不正な同時再試行では、2つの単純な不一致ではなく、2回目の試行で `retry later` が表面化することがあります。
    - ブラウザーオリジンのループバッククライアントからの `too many failed authentication attempts (retry later)` → 同じ正規化済み `Origin` からの失敗の繰り返しが一時的にロックアウトされています。別の localhost オリジンは別のバケットを使用します。
    - その再試行後も `unauthorized` が繰り返される → 共有トークン/デバイストークンのドリフトです。トークン設定を更新し、必要に応じてデバイストークンを再承認/ローテーションしてください。
    - `gateway connect failed:` → ホスト/ポート/URL ターゲットが誤っています。

  </Accordion>
</AccordionGroup>

### 認証詳細コードのクイックマップ

失敗した `connect` レスポンスの `error.details.code` を使用して、次のアクションを選びます。

| 詳細コード                  | 意味                                                                                                                                                                                      | 推奨アクション                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | クライアントが必須の共有トークンを送信しませんでした。                                                                                                                                                 | クライアントにトークンを貼り付けるか設定して、再試行します。ダッシュボードパスの場合: `openclaw config get gateway.auth.token` を実行し、Control UI 設定に貼り付けます。                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共有トークンが Gateway 認証トークンと一致しませんでした。                                                                                                                                               | `canRetryWithDeviceToken=true` の場合は、信頼済みの再試行を 1 回許可します。キャッシュ済みトークンの再試行では、保存済みの承認済みスコープを再利用します。明示的な `deviceToken` / `scopes` 呼び出し元は、要求したスコープを維持します。それでも失敗する場合は、[トークンドリフト復旧チェックリスト](/ja-JP/cli/devices#token-drift-recovery-checklist)を実行します。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | キャッシュ済みのデバイス別トークンが古いか、取り消されています。                                                                                                                                                 | [デバイス CLI](/ja-JP/cli/devices) を使ってデバイストークンをローテーションまたは再承認し、その後再接続します。                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | デバイス ID に承認が必要です。`not-paired`、`scope-upgrade`、`role-upgrade`、または `metadata-upgrade` について `error.details.reason` を確認し、存在する場合は `requestId` / `remediationHint` を使用します。 | 保留中のリクエストを承認します: `openclaw devices list` の後に `openclaw devices approve <requestId>` を実行します。スコープ/ロールのアップグレードも、要求されたアクセスを確認した後に同じフローを使用します。                                                                                                               |

<Note>
共有 Gateway トークン/パスワードで認証された直接 loopback バックエンド RPC は、CLI のペアリング済みデバイススコープベースラインに依存しないようにする必要があります。サブエージェントやその他の内部呼び出しがまだ `scope-upgrade` で失敗する場合は、呼び出し元が `client.id: "gateway-client"` と `client.mode: "backend"` を使用しており、明示的な `deviceIdentity` またはデバイストークンを強制していないことを確認してください。
</Note>

デバイス認証 v2 移行チェック:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログに nonce/signature エラーが表示される場合は、接続元クライアントを更新して検証します。

<Steps>
  <Step title="connect.challenge を待つ">
    クライアントは Gateway が発行した `connect.challenge` を待ちます。
  </Step>
  <Step title="ペイロードに署名する">
    クライアントはチャレンジにバインドされたペイロードに署名します。
  </Step>
  <Step title="デバイス nonce を送信する">
    クライアントは同じチャレンジ nonce を使って `connect.params.device.nonce` を送信します。
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` が予期せず拒否される場合:

- ペアリング済みデバイストークンセッションは、呼び出し元が `operator.admin` も持っていない限り、**自分自身の**デバイスのみ管理できます
- `openclaw devices rotate --scope ...` は、呼び出し元セッションがすでに保持している operator スコープのみ要求できます

関連:

- [設定](/ja-JP/gateway/configuration) (Gateway 認証モード)
- [Control UI](/ja-JP/web/control-ui)
- [デバイス](/ja-JP/cli/devices)
- [リモートアクセス](/ja-JP/gateway/remote)
- [信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)

## Gateway サービスが実行されていない

サービスはインストール済みだが、プロセスが起動したままにならない場合に使用します。

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
- `--deep` が使用された場合の余分な launchd/systemd/schtasks インストール。
- `Other gateway-like services detected (best effort)` のクリーンアップヒント。

<AccordionGroup>
  <Accordion title="一般的なシグネチャ">
    - `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → ローカル Gateway モードが有効になっていないか、設定ファイルが上書きされて `gateway.mode` が失われています。修正: 設定で `gateway.mode="local"` を設定するか、`openclaw onboard --mode local` / `openclaw setup` を再実行して、期待されるローカルモード設定を再スタンプします。Podman 経由で OpenClaw を実行している場合、デフォルト設定パスは `~/.openclaw/openclaw.json` です。
    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証パス (トークン/パスワード、または設定済みの場合は信頼済みプロキシ) なしの非 loopback バインドです。
    - `another gateway instance is already listening` / `EADDRINUSE` → ポート競合です。
    - `Other gateway-like services detected (best effort)` → 古い、または並列の launchd/systemd/schtasks ユニットが存在します。ほとんどのセットアップでは、マシンごとに Gateway を 1 つだけ維持する必要があります。複数必要な場合は、ポート + 設定/状態/ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。
    - doctor からの `System-level OpenClaw gateway service detected` → ユーザーレベルサービスがない一方で、systemd システムユニットが存在します。doctor にユーザーサービスをインストールさせる前に重複を削除または無効化するか、システムユニットが意図した supervisor の場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。
    - `Gateway service port does not match current gateway config` → インストール済み supervisor がまだ古い `--port` を固定しています。`openclaw doctor --fix` または `openclaw gateway install --force` を実行し、その後 Gateway サービスを再起動します。

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

確認項目:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- アクティブな設定の横にある、タイムスタンプ付きの `openclaw.json.rejected.*` ファイル
- `doctor --fix` が壊れた直接編集を修復した場合の、タイムスタンプ付きの `openclaw.json.clobbered.*` ファイル

<AccordionGroup>
  <Accordion title="何が起きたか">
    - 起動、ホットリロード、または OpenClaw が所有する書き込み中に設定の検証に失敗しました。
    - Gateway の起動は `openclaw.json` を書き換える代わりにフェイルクローズします。
    - ホットリロードは無効な外部編集をスキップし、現在のランタイム設定をアクティブに保ちます。
    - OpenClaw が所有する書き込みは、コミット前に無効/破壊的なペイロードを拒否し、`.rejected.*` を保存します。
    - `openclaw doctor --fix` が修復を担います。非 JSON プレフィックスの削除、または拒否されたペイロードを `.clobbered.*` として保持しながら最後の正常なコピーを復元できます。

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
    - `.clobbered.*` が存在する → doctor がアクティブな設定を修復しながら、壊れた外部編集を保持しました。
    - `.rejected.*` が存在する → OpenClaw が所有する設定書き込みが、コミット前にスキーマまたは上書きチェックに失敗しました。
    - `Config write rejected:` → 書き込みが必須構造を削除する、ファイルを大幅に縮小する、または無効な設定を永続化しようとしました。
    - `config reload skipped (invalid config):` → 直接編集が検証に失敗し、実行中の Gateway によって無視されました。
    - `Invalid config at ...` → Gateway サービスが起動する前に起動が失敗しました。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good`、または `size-drop-vs-last-good:*` → OpenClaw が所有する書き込みが、最後の正常なバックアップと比べてフィールドまたはサイズを失ったため拒否されました。
    - `Config last-known-good promotion skipped` → 候補に `***` などのマスク済みシークレットプレースホルダーが含まれていました。

  </Accordion>
  <Accordion title="修正オプション">
    1. `openclaw doctor --fix` を実行して、doctor にプレフィックス付き/上書きされた設定の修復、または最後の正常な設定の復元を任せます。
    2. `.clobbered.*` または `.rejected.*` から意図したキーのみをコピーし、`openclaw config set` または `config.patch` で適用します。
    3. 再起動前に `openclaw config validate` を実行します。
    4. 手作業で編集する場合は、変更したい部分オブジェクトだけでなく、JSON5 設定全体を保持します。
  </Accordion>
</AccordionGroup>

関連:

- [Config](/ja-JP/cli/config)
- [設定: ホットリロード](/ja-JP/gateway/configuration#config-hot-reload)
- [設定: 厳格な検証](/ja-JP/gateway/configuration#strict-validation)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway プローブ警告

`openclaw gateway probe` が何かに到達するものの、警告ブロックも出力する場合に使用します。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認項目:

- JSON 出力の `warnings[].code` と `primaryTargetId`。
- 警告が SSH フォールバック、複数 Gateway、スコープ不足、または未解決の認証参照に関するものかどうか。

一般的なシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH セットアップに失敗しましたが、コマンドは引き続き設定済み/loopback の直接ターゲットを試しました。
- `multiple reachable gateways detected` → 複数のターゲットが応答しました。通常は意図的な複数 Gateway セットアップ、または古い/重複したリスナーを意味します。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続は成功しましたが、詳細 RPC はスコープで制限されています。デバイス ID をペアリングするか、`operator.read` を持つ認証情報を使用してください。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 接続は成功しましたが、完全な診断 RPC セットがタイムアウトまたは失敗しました。これは診断が劣化した到達可能な Gateway として扱い、`--json` 出力の `connect.ok` と `connect.rpcOk` を比較してください。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → Gateway は応答しましたが、このクライアントは通常の operator アクセスの前にまだペアリング/承認が必要です。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef 警告テキスト → 失敗したターゲットについて、このコマンドパスで認証マテリアルを利用できませんでした。

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

確認項目:

- DM ポリシー（`pairing`、`allowlist`、`open`、`disabled`）。
- グループ許可リストとメンション要件。
- チャンネル API の権限/スコープ不足。

一般的なシグネチャ:

- `mention required` → グループメンションポリシーによりメッセージが無視された。
- `pairing` / 承認待ちトレース → 送信者が承認されていない。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → チャンネル認証/権限の問題。

関連:

- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [Discord](/ja-JP/channels/discord)
- [Telegram](/ja-JP/channels/telegram)
- [WhatsApp](/ja-JP/channels/whatsapp)

## Cron と Heartbeat の配信

Cron または Heartbeat が実行されなかった、または配信されなかった場合は、まずスケジューラーの状態を確認し、その後に配信先を確認する。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認すること:

- Cron が有効で、次回の起動が存在する。
- ジョブ実行履歴のステータス（`ok`、`skipped`、`error`）。
- Heartbeat のスキップ理由（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="一般的なシグネチャ">
    - `cron: scheduler disabled; jobs will not run automatically` → cron が無効。
    - `cron: timer tick failed` → スケジューラーの tick が失敗した。ファイル/ログ/ランタイムエラーを確認する。
    - `heartbeat skipped` かつ `reason=quiet-hours` → アクティブ時間帯の範囲外。
    - `heartbeat skipped` かつ `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在するが、空行 / markdown ヘッダーのみを含むため、OpenClaw はモデル呼び出しをスキップする。
    - `heartbeat skipped` かつ `reason=no-tasks-due` → `HEARTBEAT.md` に `tasks:` ブロックが含まれているが、この tick で期限のタスクがない。
    - `heartbeat: unknown accountId` → Heartbeat 配信先のアカウント ID が無効。
    - `heartbeat skipped` かつ `reason=dm-blocked` → Heartbeat のターゲットが DM 形式の宛先に解決されたが、`agents.defaults.heartbeat.directPolicy`（またはエージェントごとの上書き）が `block` に設定されている。

  </Accordion>
</AccordionGroup>

関連:

- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュール済みタスク](/ja-JP/automation/cron-jobs)
- [スケジュール済みタスク: トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting)

## Node はペアリング済みだが、ツールが失敗する

Node がペアリング済みでもツールが失敗する場合は、フォアグラウンド、権限、承認状態を切り分ける。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認すること:

- Node がオンラインで、想定されるケイパビリティを持っている。
- カメラ/マイク/位置情報/画面に対する OS 権限の付与。
- Exec 承認と許可リストの状態。

一般的なシグネチャ:

- `NODE_BACKGROUND_UNAVAILABLE` → Node アプリがフォアグラウンドにある必要がある。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 権限が不足している。
- `SYSTEM_RUN_DENIED: approval required` → exec 承認が保留中。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが許可リストによりブロックされた。

関連:

- [Exec 承認](/ja-JP/tools/exec-approvals)
- [Node のトラブルシューティング](/ja-JP/nodes/troubleshooting)
- [Nodes](/ja-JP/nodes/index)

## ブラウザーツールが失敗する

Gateway 自体は正常でもブラウザーツールのアクションが失敗する場合に使用する。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認すること:

- `plugins.allow` が設定されており、`browser` が含まれているか。
- 有効なブラウザー実行ファイルのパス。
- CDP プロファイルの到達可能性。
- `existing-session` / `user` プロファイル用のローカル Chrome の可用性。

<AccordionGroup>
  <Accordion title="Plugin / 実行ファイルのシグネチャ">
    - `unknown command "browser"` または `unknown command 'browser'` → バンドルされたブラウザー Plugin が `plugins.allow` により除外されている。
    - `browser.enabled=true` なのにブラウザーツールがない / 利用不可 → `plugins.allow` が `browser` を除外しているため、Plugin が読み込まれていない。
    - `Failed to start Chrome CDP on port` → ブラウザープロセスの起動に失敗した。
    - `browser.executablePath not found` → 設定されたパスが無効。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定された CDP URL が `file:` や `ftp:` などの未対応スキームを使用している。
    - `browser.cdpUrl has invalid port` → 設定された CDP URL のポートが不正、または範囲外。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在の Gateway インストールにはコアブラウザーランタイム依存関係がない。OpenClaw を再インストールまたは更新してから、Gateway を再起動する。ARIA スナップショットと基本的なページスクリーンショットは引き続き機能する可能性があるが、ナビゲーション、AI スナップショット、CSS セレクター要素スクリーンショット、PDF エクスポートは利用できないままになる。

  </Accordion>
  <Accordion title="Chrome MCP / 既存セッションのシグネチャ">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP の既存セッションが、選択されたブラウザーデータディレクトリにまだアタッチできなかった。ブラウザーの inspect ページを開き、リモートデバッグを有効にし、ブラウザーを開いたままにして、最初のアタッチプロンプトを承認してから再試行する。サインイン状態が不要な場合は、管理対象の `openclaw` プロファイルを優先する。
    - `No Chrome tabs found for profile="user"` → Chrome MCP のアタッチプロファイルに、開いているローカル Chrome タブがない。
    - `Remote CDP for profile "<name>" is not reachable` → 設定されたリモート CDP エンドポイントに Gateway ホストから到達できない。
    - `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → アタッチ専用プロファイルに到達可能なターゲットがない、または HTTP エンドポイントは応答したが CDP WebSocket を開けなかった。

  </Accordion>
  <Accordion title="要素 / スクリーンショット / アップロードのシグネチャ">
    - `fullPage is not supported for element screenshots` → スクリーンショットリクエストで `--full-page` と `--ref` または `--element` が混在している。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` のスクリーンショット呼び出しでは、CSS `--element` ではなく、ページキャプチャまたはスナップショット `--ref` を使用する必要がある。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP のアップロードフックには、CSS セレクターではなくスナップショット ref が必要。
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP プロファイルでは、呼び出しごとに 1 つのアップロードを送信する。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP プロファイルのダイアログフックはタイムアウト上書きをサポートしない。
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP 既存セッションプロファイルの `act:type` では `timeoutMs` を省略する。カスタムタイムアウトが必要な場合は、管理対象/CDP ブラウザープロファイルを使用する。
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP 既存セッションプロファイルの `act:evaluate` では `timeoutMs` を省略する。カスタムタイムアウトが必要な場合は、管理対象/CDP ブラウザープロファイルを使用する。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` には引き続き、管理対象ブラウザーまたは raw CDP プロファイルが必要。
    - アタッチ専用またはリモート CDP プロファイルで viewport / ダークモード / ロケール / オフラインの上書きが古い → Gateway 全体を再起動せずにアクティブな制御セッションを閉じ、Playwright/CDP エミュレーション状態を解放するには、`openclaw browser stop --browser-profile <name>` を実行する。

  </Accordion>
</AccordionGroup>

関連:

- [ブラウザー（OpenClaw 管理）](/ja-JP/tools/browser)
- [ブラウザーのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)

## アップグレード後に何かが突然壊れた場合

アップグレード後の破損の多くは、設定ドリフト、またはより厳格なデフォルトが現在適用されていることが原因。

<AccordionGroup>
  <Accordion title="1. 認証と URL 上書きの動作が変更された">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    確認すること:

    - `gateway.mode=remote` の場合、ローカルサービスが正常でも CLI 呼び出しがリモートを対象にしている可能性がある。
    - 明示的な `--url` 呼び出しは、保存済み認証情報にフォールバックしない。

    一般的なシグネチャ:

    - `gateway connect failed:` → URL ターゲットが誤っている。
    - `unauthorized` → エンドポイントには到達できるが、認証が誤っている。

  </Accordion>
  <Accordion title="2. bind と認証ガードレールがより厳格になった">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    確認すること:

    - 非ループバック bind（`lan`、`tailnet`、`custom`）には、有効な Gateway 認証経路が必要: 共有トークン/パスワード認証、または正しく設定された非ループバック `trusted-proxy` デプロイ。
    - `gateway.token` のような古いキーは `gateway.auth.token` を置き換えない。

    一般的なシグネチャ:

    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証経路がない非ループバック bind。
    - ランタイムが実行中なのに `Connectivity probe: failed` → Gateway は生きているが、現在の認証/URL ではアクセスできない。

  </Accordion>
  <Accordion title="3. ペアリングとデバイス ID 状態が変更された">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    確認すること:

    - ダッシュボード/Node の保留中デバイス承認。
    - ポリシーまたは ID 変更後の保留中 DM ペアリング承認。

    一般的なシグネチャ:

    - `device identity required` → デバイス認証が満たされていない。
    - `pairing required` → 送信者/デバイスの承認が必要。

  </Accordion>
</AccordionGroup>

確認後もサービス設定とランタイムが一致しない場合は、同じプロファイル/状態ディレクトリからサービスメタデータを再インストールする。

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
- [Gateway runbook](/ja-JP/gateway)
