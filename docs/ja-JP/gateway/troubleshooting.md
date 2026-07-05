---
read_when:
    - トラブルシューティングハブから、より詳細な診断のためにここへ案内されました
    - 安定した症状ベースのランブックセクションと正確なコマンドが必要です
sidebarTitle: Troubleshooting
summary: Gateway、チャンネル、自動化、ノード、ブラウザーの詳細トラブルシューティングランブック
title: トラブルシューティング
x-i18n:
    generated_at: "2026-07-05T11:25:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1975522afa7eada6b79e7ea4b117e645b0273b506ecf2e071542d820555adff0
    source_path: gateway/troubleshooting.md
    workflow: 16
---

これは詳細なランブックです。まず高速なトリアージフローとして [/help/troubleshooting](/ja-JP/help/troubleshooting) から始めてください。

## コマンドラダー

次の順序で実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常なシグナル:

- `openclaw gateway status` に `Runtime: running`、`Connectivity probe: ok`、および `Capability: ...` 行が表示される。
- `openclaw doctor` がブロック要因となる設定/サービスの問題を報告しない。
- `openclaw channels status --probe` にアカウントごとのライブなトランスポート状態が表示され、サポートされる場合は `works` または `audit ok` が表示される。

## 更新後

更新は完了したが Gateway が停止している、チャンネルが空、またはモデル呼び出しが 401 で失敗する場合に使用します。

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

確認する内容:

- `openclaw status` / `openclaw status --all` 内の `Update restart`。保留中または失敗した引き継ぎには、次に実行するコマンドが含まれます。
- Channels 配下の `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`: チャンネル設定はまだ存在しますが、チャンネルを読み込む前に Plugin 登録が失敗しています。
- 再認証後のプロバイダー 401: `openclaw doctor --fix` は、古いエージェントごとの OAuth 認証シャドウを確認し、古いコピーを削除して、すべてのエージェントが現在の共有プロファイルを解決するようにします。

## 分裂したインストールと新しい設定ガード

更新後に Gateway サービスが予期せず停止する場合、またはログで、ある `openclaw` バイナリが最後に `openclaw.json` を書き込んだバージョンより古いことが示される場合に使用します。

OpenClaw は設定書き込みに `meta.lastTouchedVersion` をスタンプします。読み取り専用コマンドは新しい OpenClaw が書き込んだ設定を検査できますが、プロセスとサービスの変更は古いバイナリからの実行を拒否します。ブロックされるアクション: Gateway サービスの start/stop/restart/uninstall、強制サービス再インストール、サービスモードの Gateway 起動、および `gateway --force` のポートクリーンアップ。

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
    新しいインストールから意図した Gateway サービスを再インストールします。

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    古い `openclaw` バイナリをまだ指している古いシステムパッケージまたはラッパーエントリを削除します。
  </Step>
</Steps>

<Warning>
意図的なダウングレードまたは緊急復旧の場合にのみ、単一コマンドに対して `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` を設定します。通常運用では未設定のままにします。
</Warning>

## ロールバック後のプロトコル不一致

ダウングレードまたはロールバック後にログが `protocol mismatch` を出し続ける場合に使用します。古い Gateway が動作していますが、新しいローカルクライアントプロセスが、古い Gateway では話せないプロトコル範囲でまだ再接続しています。

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

確認する内容:

- Gateway ログ内の `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`。
- `openclaw gateway status --deep` 内の `Established clients:`、または `openclaw doctor --deep` 内の `Gateway clients`: Gateway ポートに接続しているアクティブな TCP クライアント。OS が許可する場合は PID とコマンドラインも含まれます。
- コマンドラインが、ロールバック元の新しい OpenClaw インストールまたはラッパーを指しているクライアントプロセス。

修正:

1. `gateway status --deep` に表示された古い OpenClaw クライアントプロセスを停止または再起動します。
2. OpenClaw を埋め込むアプリまたはラッパーを再起動します: ローカルダッシュボード、エディター、アプリサーバーヘルパー、または長時間実行中の `openclaw logs --follow` シェル。
3. `openclaw gateway status --deep` または `openclaw doctor --deep` を再実行し、古いクライアント PID がなくなったことを確認します。

古い Gateway が新しい互換性のないプロトコルを受け入れるようにしないでください。プロトコルのバンプはワイヤ契約を保護します。ロールバック復旧はプロセス/バージョンのクリーンアップ問題です。

## パスエスケープとしてスキップされた Skill シンボリックリンク

ログに次が含まれる場合に使用します。

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

すべての Skill ルートは封じ込め境界です。`~/.agents/skills`、`<workspace>/.agents/skills`、`<workspace>/skills`、または `~/.openclaw/skills` 配下のシンボリックリンクは、その実体ターゲットがそのルートの外に解決される場合、ターゲットが明示的に信頼されていない限りスキップされます。

リンクを検査します。

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

ターゲットが意図したものなら、直接の Skill ルートと許可するシンボリックリンクターゲットの両方を設定します。

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

`~`、`/`、または同期済みプロジェクトフォルダー全体のような広いターゲットは使用しないでください。`allowSymlinkTargets` は、信頼できる `SKILL.md` ディレクトリを含む実際の Skill ルートに限定してください。

Skill Workshop の apply でも、信頼されたシンボリックリンクされたワークスペース Skill パスへ書き込む必要がある場合は、`skills.workshop.allowSymlinkTargetWrites` を有効にします。読み取り専用の共有 Skill ルートでは無効のままにします。

関連:

- [Skills 設定](/ja-JP/tools/skills-config#symlinked-skill-roots)
- [設定例](/ja-JP/gateway/configuration-examples#symlinked-sibling-skill-repo)

## 長いコンテキストに Anthropic 429 の追加使用量が必要

ログ/エラーに `HTTP 429: rate_limit_error: Extra usage is required for long context requests` が含まれる場合に使用します。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認する内容:

- 選択された Anthropic モデルが GA 対応の 1M Claude 4.x モデル (Opus 4.6/4.7/4.8、Sonnet 4.6) である、またはモデル設定にまだレガシーの `params.context1m: true` が含まれている。
- 現在の Anthropic 認証情報が長いコンテキストの使用対象ではない。
- 1M コンテキストパスを必要とする長いセッション/モデル実行でのみリクエストが失敗する。

修正オプション:

<Steps>
  <Step title="Use a standard context window">
    標準ウィンドウのモデルに切り替えるか、1M コンテキストで GA 対応ではない古い
    モデル設定からレガシーの `context1m` を削除します。
  </Step>
  <Step title="Use an eligible credential">
    長いコンテキストリクエストの対象となる Anthropic 認証情報を使用するか、Anthropic API キーに切り替えます。
  </Step>
  <Step title="Configure fallback models">
    Anthropic の長いコンテキストリクエストが拒否されても実行が継続するように、フォールバックモデルを設定します。
  </Step>
</Steps>

関連:

- [Anthropic](/ja-JP/providers/anthropic)
- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [Anthropic から HTTP 429 が表示されるのはなぜですか?](/ja-JP/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## アップストリームの 403 ブロック応答

アップストリームの LLM プロバイダーが `Your request was blocked` のような汎用 `403` を返す場合に使用します。

これが常に OpenClaw の設定問題だと仮定しないでください。応答は、OpenAI 互換エンドポイントの前段にある CDN、WAF、ボット管理ルール、またはリバースプロキシなどのアップストリームのセキュリティ層から返されることがあります。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

確認する内容:

- 同じプロバイダー配下の複数のモデルが同じ方法で失敗している。
- 通常のプロバイダー API エラーではなく、HTML または汎用セキュリティテキストが返されている。
- 同じリクエスト時刻にプロバイダー側のセキュリティイベントがある。
- 小さな直接 `curl` プローブは成功するが、通常の SDK 形式のリクエストは失敗する。

証拠が WAF/CDN ブロックを示す場合は、まずプロバイダー側のフィルタリングを修正します。OpenClaw が使用する API パスに対して狭くスコープした許可またはスキップルールを優先し、サイト全体の保護を無効にすることは避けてください。

<Warning>
最小限の `curl` が成功しても、実際の SDK 形式のリクエストが同じアップストリームのセキュリティ層を通過することは保証されません。
</Warning>

関連:

- [OpenAI 互換エンドポイント](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)
- [プロバイダー設定](/ja-JP/providers)
- [ログ](/ja-JP/logging)

## ローカルの OpenAI 互換バックエンドは直接プローブに通るが、エージェント実行が失敗する

次の場合に使用します。

- `curl ... /v1/models` が動作する。
- 小さな直接 `/v1/chat/completions` 呼び出しが動作する。
- OpenClaw モデル実行が通常のエージェントターンでのみ失敗する。

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

確認する内容:

- 直接の小さな呼び出しは成功するが、OpenClaw 実行は大きなプロンプトでのみ失敗する。
- 同じ素のモデル ID で直接 `/v1/chat/completions` が動作しているにもかかわらず、`model_not_found` または 404 エラーが発生する。
- `messages[].content` が文字列を期待しているというバックエンドエラー。
- OpenAI 互換ローカルバックエンドで、断続的な `incomplete turn detected ... stopReason=stop payloads=0` 警告が発生する。
- 大きなプロンプトトークン数または完全なエージェントランタイムプロンプトでのみ発生するバックエンドクラッシュ。

<AccordionGroup>
  <Accordion title="Common signatures">
    - ローカル MLX/vLLM 形式サーバーでの `model_not_found`: `baseUrl` に `/v1` が含まれること、`/v1/chat/completions` バックエンドでは `api` が `"openai-completions"` であること、`models.providers.<provider>.models[].id` が素のプロバイダーローカル ID であることを確認します。たとえば `mlx/mlx-community/Qwen3-30B-A3B-6bit` のように、プロバイダープレフィックスを一度だけ付けて選択します。カタログエントリは `mlx-community/Qwen3-30B-A3B-6bit` のままにします。
    - `messages[...].content: invalid type: sequence, expected a string`: バックエンドが構造化された Chat Completions のコンテンツパーツを拒否しています。修正: `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
    - `validation.keys` または `["role","content"]` のような許可メッセージキー: バックエンドが Chat Completions メッセージ上の OpenAI 形式のリプレイメタデータを拒否しています。修正: `models.providers.<provider>.models[].compat.strictMessageKeys: true` を設定します。
    - `incomplete turn detected ... stopReason=stop payloads=0`: バックエンドは Chat Completions リクエストを完了しましたが、そのターンのユーザーに見えるアシスタントテキストを返しませんでした。OpenClaw はリプレイ安全な空の OpenAI 互換ターンを一度だけ再試行します。永続的な失敗は通常、バックエンドが空/非テキストコンテンツを出力しているか、最終回答テキストを抑制していることを意味します。
    - 直接の小さなリクエストは成功するが、OpenClaw エージェント実行がバックエンド/モデルクラッシュで失敗する (たとえば一部の `inferrs` ビルド上の Gemma): OpenClaw のトランスポートはすでに正しい可能性が高く、バックエンドがより大きなエージェントランタイムプロンプト形状で失敗しています。
    - ツールを無効にすると失敗は減るが、消えない: ツールスキーマは負荷の一部でしたが、残る問題は依然としてアップストリームのモデル/サーバー容量またはバックエンドのバグです。

  </Accordion>
  <Accordion title="Fix options">
    1. 文字列のみの Chat Completions バックエンドには `compat.requiresStringContent: true` を設定します。
    2. 各メッセージで `role` と `content` のみを受け入れる厳格な Chat Completions バックエンドには `compat.strictMessageKeys: true` を設定します。
    3. OpenClaw のツールスキーマサーフェスを確実に扱えないモデル/バックエンドには `compat.supportsTools: false` を設定します。
    4. 可能な範囲でプロンプト負荷を下げます: より小さなワークスペースブートストラップ、短いセッション履歴、軽量なローカルモデル、またはより強力な長いコンテキスト対応のバックエンド。
    5. 小さな直接リクエストは通り続けるのに OpenClaw エージェントターンがバックエンド内部でまだクラッシュする場合は、アップストリームのサーバー/モデル制限として扱い、受け入れられたペイロード形状を添えてそちらに再現報告を提出します。
  </Accordion>
</AccordionGroup>

関連:

- [設定](/ja-JP/gateway/configuration)
- [ローカルモデル](/ja-JP/gateway/local-models)
- [OpenAI 互換エンドポイント](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)

## 返信がない

チャンネルは起動しているのに何も応答しない場合は、何かを再接続する前にルーティングとポリシーを確認してください。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認する項目:

- DM 送信者のペアリングが保留中になっている。
- グループメンションのゲート制御（`requireMention`, `mentionPatterns`）。
- チャンネル/グループの許可リスト不一致。

よくあるシグネチャ:

- `drop guild message (mention required` → メンションされるまでグループメッセージは無視される。
- `pairing request` → 送信者に承認が必要。
- `blocked` / `allowlist` → 送信者/チャンネルがポリシーによってフィルターされた。

関連:

- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [グループ](/ja-JP/channels/groups)
- [ペアリング](/ja-JP/channels/pairing)

## ダッシュボード Control UI の接続性

ダッシュボード/Control UI が接続できない場合は、URL、認証モード、セキュアコンテキストの前提を検証します。

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

更新後にローカルブラウザーが `127.0.0.1:18789` に接続できない場合は、まずローカル Gateway サービスを復旧し、ダッシュボードを提供していることを確認します。

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

`curl` が OpenClaw HTML を返す場合、Gateway は動作しており、残る問題はブラウザーキャッシュ、古いディープリンク、または古いタブ状態である可能性があります。`http://127.0.0.1:18789` を直接開き、ダッシュボードから移動してください。再起動してもサービスが稼働したままにならない場合は、`openclaw gateway start` を実行し、`openclaw gateway status` を再確認します。

<AccordionGroup>
  <Accordion title="接続 / 認証シグネチャ">
    - `device identity required` → 非セキュアコンテキスト、またはデバイス認証が不足している。
    - `origin not allowed` → ブラウザーの `Origin` が `gateway.controlUi.allowedOrigins` に含まれていない（または明示的な許可リストなしに非ループバックのブラウザーオリジンから接続している）。
    - `device nonce required` / `device nonce mismatch` → クライアントがチャレンジベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していない。
    - `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったペイロード（または古いタイムスタンプ）に署名した。
    - `AUTH_TOKEN_MISMATCH` かつ `canRetryWithDeviceToken=true` → クライアントはキャッシュ済みデバイストークンで信頼済みの再試行を 1 回実行できる。
    - そのキャッシュ済みトークンでの再試行は、ペアリング済みデバイストークンと一緒に保存されたキャッシュ済みスコープセットを再利用する。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、代わりに要求したスコープセットを維持する。
    - `AUTH_SCOPE_MISMATCH` → デバイストークンは認識されたが、その承認済みスコープがこの接続リクエストをカバーしていない。共有 Gateway トークンをローテーションするのではなく、再ペアリングするか、要求されたスコープ契約を承認する。
    - その再試行パスの外では、接続認証の優先順位は、明示的な共有トークン/パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順になる。
    - 非同期の Tailscale Serve Control UI パスでは、同じ `{scope, ip}` に対する失敗した試行は、リミッターが失敗を記録する前に直列化される。そのため、同じクライアントから 2 つの不正な再試行が並行して行われると、2 つの単純な不一致ではなく、2 回目の試行で `retry later` が表示されることがある。
    - ブラウザーオリジンのループバッククライアントからの `too many failed authentication attempts (retry later)` → 同じ正規化済み `Origin` からの失敗が繰り返され、一時的にロックアウトされている。別の localhost オリジンは別のバケットを使用する。
    - その再試行後も `unauthorized` が繰り返される → 共有トークン/デバイストークンのずれ。必要に応じてトークン設定を更新し、デバイストークンを再承認/ローテーションする。
    - `gateway connect failed:` → ホスト/ポート/URL ターゲットが誤っている。

  </Accordion>
</AccordionGroup>

### 認証詳細コードのクイックマップ

失敗した `connect` レスポンスの `error.details.code` を使って、次のアクションを選びます。

| 詳細コード                  | 意味                                                                                                                                                                                      | 推奨アクション                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | クライアントが必須の共有トークンを送信しなかった。                                                                                                                                                 | クライアントにトークンを貼り付ける/設定して再試行する。ダッシュボードパスの場合: `openclaw config get gateway.auth.token` を実行してから、Control UI 設定に貼り付ける。                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共有トークンが Gateway 認証トークンと一致しなかった。                                                                                                                                               | `canRetryWithDeviceToken=true` の場合、信頼済みの再試行を 1 回許可する。キャッシュ済みトークンでの再試行は保存済みの承認済みスコープを再利用する。明示的な `deviceToken` / `scopes` の呼び出し元は、要求したスコープを維持する。それでも失敗する場合は、[トークンずれ復旧チェックリスト](/ja-JP/cli/devices#token-drift-recovery-checklist)を実行する。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | キャッシュ済みのデバイスごとのトークンが古い、または取り消されている。                                                                                                                                                 | [devices CLI](/ja-JP/cli/devices) を使ってデバイストークンをローテーション/再承認し、その後再接続する。                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | デバイストークンは有効だが、その承認済みロール/スコープがこの接続リクエストをカバーしていない。                                                                                                       | デバイスを再ペアリングするか、要求されたスコープ契約を承認する。これを共有トークンのずれとして扱わない。                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | デバイス ID に承認が必要。`not-paired`、`scope-upgrade`、`role-upgrade`、または `metadata-upgrade` については `error.details.reason` を確認し、存在する場合は `requestId` / `remediationHint` を使用する。 | 保留中のリクエストを承認する: `openclaw devices list` の後に `openclaw devices approve <requestId>` を実行する。スコープ/ロールのアップグレードも、要求されたアクセスを確認した後、同じフローを使用する。                                                                                                               |

<Note>
共有 Gateway トークン/パスワードで認証された直接のループバックバックエンド RPC は、CLI のペアリング済みデバイススコープベースラインに依存すべきではありません。サブエージェントやその他の内部呼び出しがまだ `scope-upgrade` で失敗する場合は、呼び出し元が `client.id: "gateway-client"` と `client.mode: "backend"` を使用しており、明示的な `deviceIdentity` またはデバイストークンを強制していないことを確認してください。
</Note>

デバイス認証 v2 の移行チェック:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログに nonce/署名エラーが表示される場合は、接続元クライアントを更新して検証します。

<Steps>
  <Step title="connect.challenge を待機する">
    クライアントは Gateway が発行した `connect.challenge` を待機します。
  </Step>
  <Step title="ペイロードに署名する">
    クライアントはチャレンジに紐づいたペイロードに署名します。
  </Step>
  <Step title="デバイス nonce を送信する">
    クライアントは同じチャレンジ nonce を含む `connect.params.device.nonce` を送信します。
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` が予期せず拒否される場合:

- ペアリング済みデバイストークンセッションは、呼び出し元が `operator.admin` も持っていない限り、**自分自身の**デバイスだけを管理できます。
- `openclaw devices rotate --scope ...` は、呼び出し元セッションがすでに保持しているオペレータースコープのみを要求できます。

関連:

- [設定](/ja-JP/gateway/configuration)（Gateway 認証モード）
- [Control UI](/ja-JP/web/control-ui)
- [デバイス](/ja-JP/cli/devices)
- [リモートアクセス](/ja-JP/gateway/remote)
- [信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)

## Gateway サービスが実行されていない

サービスはインストールされているが、プロセスが起動し続けない場合に使用します。

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
- `--deep` を使用したときの追加の launchd/systemd/schtasks インストール。
- `Other gateway-like services detected (best effort)` のクリーンアップヒント。

<AccordionGroup>
  <Accordion title="よくあるシグネチャ">
    - `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → ローカル Gateway モードが有効になっていない、または設定ファイルが上書きされて `gateway.mode` が失われている。修正: 設定で `gateway.mode="local"` を設定するか、`openclaw onboard --mode local` / `openclaw setup` を再実行して、想定されるローカルモード設定を再スタンプする。Podman 経由で OpenClaw を実行している場合、デフォルトの設定パスは `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証パス（トークン/パスワード、または設定済みの場合は信頼済みプロキシ）なしに非ループバックへバインドしようとしている。
    - `another gateway instance is already listening` / `EADDRINUSE` → ポート競合。
    - `Other gateway-like services detected (best effort)` → 古い、または並行する launchd/systemd/schtasks ユニットが存在する。ほとんどのセットアップでは、マシンごとに Gateway を 1 つだけ維持する必要がある。複数必要な場合は、ポート + 設定/状態/ワークスペースを分離する。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照。
    - doctor からの `System-level OpenClaw gateway service detected` → ユーザーレベルサービスがない一方で、systemd のシステムユニットが存在する。doctor にユーザーサービスをインストールさせる前に重複を削除または無効化するか、システムユニットが意図したスーパーバイザーである場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定する。
    - `Gateway service port does not match current gateway config` → インストール済みのスーパーバイザーがまだ古い `--port` を固定している。`openclaw doctor --fix` または `openclaw gateway install --force` を実行し、その後 Gateway サービスを再起動する。

  </Accordion>
</AccordionGroup>

関連:

- [バックグラウンド exec とプロセスツール](/ja-JP/gateway/background-process)
- [設定](/ja-JP/gateway/configuration)
- [Doctor](/ja-JP/gateway/doctor)

## macOS Gateway が黙って応答を停止し、ダッシュボードに触れると再開する

macOS ホスト上のチャンネル（Telegram、WhatsApp など）が数分から数時間静かになり、Control UI を開く、SSH で入る、または何らかの形でホストとやり取りした瞬間に Gateway が復帰するように見える場合に使用します。通常、`openclaw status` には明確な症状はありません。確認する頃には Gateway が再び稼働しているためです。

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

確認する項目:

- `~/.openclaw/logs/stability/` 内の 1 つ以上の `*-uncaught_exception.json` バンドルで、`error.code` が `ENETDOWN`、`ENETUNREACH`、`EHOSTUNREACH`、`ECONNREFUSED` などの一時的なネットワークコードに設定されている。
- クラッシュ時刻と一致する、`Entering Sleep state due to 'Maintenance Sleep'` や `en0 driver is slow (msg: WillChangeState to 0)` のような `pmset -g log` 行。Power Nap / Maintenance Sleep は Wi-Fi ドライバーを短時間 state 0 にする。その時間帯に発生した外向きの `connect()` は、通常は完全なネットワーク接続があるホストでも `ENETDOWN` で失敗することがある。
- `launchctl print` 出力に、複数の最近の `runs` と終了コードを伴う `state = not running` が表示される。特に、クラッシュから次の起動までの間隔が数秒ではなく 1 時間程度の場合。macOS launchd はクラッシュの連続後に未文書化の再起動保護ゲートを適用し、対話型ログイン、ダッシュボード接続、`launchctl kickstart` などの外部トリガーで再び有効化されるまで、`KeepAlive=true` を尊重しなくなることがある。

よくある兆候:

- `error.code` が `ENETDOWN` または関連コードで、コールスタックが Node `net` の `lookupAndConnect` / `Socket.connect` を指している安定性バンドル。OpenClaw `2026.5.26` 以降は、これらを無害な一時的ネットワークエラーとして分類するため、トップレベルの uncaught ハンドラーには伝播しなくなった。古いリリースを使用している場合は、まずアップグレードする。
- Control UI に接続するかホストへ SSH した瞬間に終わる長い無音期間: launchd の再起動ゲートを再び有効化するのはユーザーに見えるアクティビティであり、ダッシュボードが Gateway に対して行う処理ではない。
- 1 日を通して `runs` カウントが増えているのに、`~/Library/Logs/openclaw/gateway.log` に対応する `received SIG*; shutting down` 行がない: クリーンシャットダウンではシグナルが記録されるが、一時的なクラッシュでは記録されない。

対処方法:

1. `2026.5.26` より前のリリースを実行している場合は、**Gateway をアップグレード**する。アップグレード後は、今後の `ENETDOWN` エラーはプロセスを終了させる代わりに警告として記録される。
2. 常時稼働サーバーとして使う Mac mini / デスクトップホストでは、**メンテナンススリープの動作を減らす**:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   これにより、根本のドライバーフラップは大幅に減るが、完全にはなくならない。これらのフラグにかかわらず、システムは TCP keepalive や mDNS 保守のために一部のメンテナンススリープを実行することがある。

3. launchd によって保留された将来のクラッシュ連続をすばやく検出できるように、**liveness watchdog を追加**する:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   目的は、外部から再起動ゲートを再び有効化すること。macOS ではクラッシュ連続後に `KeepAlive=true` だけでは十分ではない。

関連:

- [macOS プラットフォームノート](/ja-JP/platforms/macos)
- [ログ記録](/ja-JP/logging)
- [診断](/ja-JP/gateway/doctor)

## メモリ使用量が多いときに Gateway が終了する

負荷中に Gateway が消える、スーパーバイザーが OOM 形式の再起動を報告する、またはログに `critical memory pressure bundle written` と表示される場合に使用する。

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

確認する項目:

- 最新の安定性バンドル内の `Reason: diagnostic.memory.pressure.critical`。
- `critical/rss_threshold`、`critical/heap_threshold`、または `critical/rss_growth` を伴う `Memory pressure:`。
- ヒープ制限に近い `V8 heap:` 値。
- `agents/<agent>/sessions/<session>.jsonl` や `sessions/<session>.jsonl` などの `Largest session files:` エントリ。
- Gateway がコンテナーまたはメモリ制限付きサービス内で実行されている場合の Linux cgroup メモリカウンター。

よくある兆候:

- 再起動の直前に `critical memory pressure bundle written` が表示される → OpenClaw が OOM 前の安定性バンドルを取得した。`openclaw gateway stability --bundle latest` で確認する。
- Gateway ログに `memory pressure: level=critical ... memoryPressureSnapshot=disabled` が表示される → OpenClaw は重大なメモリプレッシャーを検出したが、OOM 前の安定性スナップショットはオフになっている。
- `Largest session files:` が非常に大きな編集済みトランスクリプトパスを指している → 再起動前に、保持するセッション履歴を減らす、セッションの増加を調べる、または古いトランスクリプトをアクティブストアから移動する。
- `V8 heap:` の使用済みバイト数がヒープ制限に近い → ワークロードが想定どおりであることを確認してから、プロンプト/セッションの負荷を下げる、同時作業を減らす、または Node ヒープ制限を引き上げる。
- `Memory pressure: critical/rss_growth` → 1 つのサンプリングウィンドウ内でメモリが急増した。大きなインポート、暴走したツール出力、繰り返しリトライ、またはキュー内のエージェント作業のまとまりがないか、最新ログを確認する。
- ログに重大なメモリプレッシャーが表示されるがバンドルが存在しない → これが既定値。今後の重大なメモリプレッシャーイベントで OOM 前の安定性バンドルを取得するには、`diagnostics.memoryPressureSnapshot: true` を設定する。

安定性バンドルにはペイロードは含まれない。運用上のメモリ証拠と編集済みの相対ファイルパスが含まれ、メッセージ本文、webhook 本文、認証情報、トークン、Cookie、生のセッション ID は含まれない。バグ報告には生ログをコピーする代わりに、診断エクスポートを添付する。

関連:

- [Gateway の健全性](/ja-JP/gateway/health)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [セッション](/ja-JP/cli/sessions)

## Gateway が無効な設定を拒否した

Gateway の起動が `Invalid config` で失敗する場合、またはホットリロードログに無効な編集をスキップしたと表示される場合に使用する。

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
- アクティブな設定の横にある、タイムスタンプ付きの `openclaw.json.rejected.*` ファイル。
- `doctor --fix` が壊れた直接編集を修復した場合の、タイムスタンプ付きの `openclaw.json.clobbered.*` ファイル。
- OpenClaw は各設定パスについて最新 32 個の `.clobbered.*` ファイルを保持し、古いものをローテーションする。

<AccordionGroup>
  <Accordion title="何が起きたか">
    - 起動時、ホットリロード時、または OpenClaw 所有の書き込み時に設定が検証に失敗した。
    - Gateway の起動は `openclaw.json` を書き換える代わりにフェイルクローズする。
    - ホットリロードは無効な外部編集をスキップし、現在のランタイム設定をアクティブなままにする。
    - OpenClaw 所有の書き込みは、コミット前に無効または破壊的なペイロードを拒否し、`.rejected.*` を保存する。
    - `openclaw doctor --fix` が修復を担当する。JSON ではない接頭辞を削除したり、最後に正常だったコピーを復元したりでき、拒否されたペイロードは `.clobbered.*` として保持する。
    - 1 つの設定パスで多数の修復が発生すると、OpenClaw は古い `.clobbered.*` ファイルをローテーションし、最新の修復済みペイロードを利用可能な状態に保つ。

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
  <Accordion title="よくある兆候">
    - `.clobbered.*` が存在する → doctor が壊れた外部編集を保持しながらアクティブな設定を修復した。
    - `.rejected.*` が存在する → OpenClaw 所有の設定書き込みが、コミット前にスキーマまたは上書きチェックで失敗した。
    - `Config write rejected:` → 書き込みが必須の形を削除する、ファイルを急激に縮小する、または無効な設定を永続化しようとした。
    - `config reload skipped (invalid config):` → 直接編集が検証に失敗し、実行中の Gateway に無視された。
    - `Invalid config at ...` → Gateway サービスの起動前に起動が失敗した。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good`、または `size-drop-vs-last-good:*` → OpenClaw 所有の書き込みが、最後に正常だったバックアップと比べてフィールドまたはサイズを失ったため拒否された。
    - `Config last-known-good promotion skipped` → 候補に `***` などの編集済みシークレットプレースホルダーが含まれていた。

  </Accordion>
  <Accordion title="修正オプション">
    1. `openclaw doctor --fix` を実行し、doctor に接頭辞付き/上書きされた設定を修復させるか、最後に正常だった設定を復元させる。
    2. `.clobbered.*` または `.rejected.*` から意図したキーだけをコピーし、`openclaw config set` または `config.patch` で適用する。
    3. 再起動前に `openclaw config validate` を実行する。
    4. 手動で編集する場合は、変更したかった部分オブジェクトだけではなく、完全な JSON5 設定を保持する。
  </Accordion>
</AccordionGroup>

関連:

- [設定](/ja-JP/cli/config)
- [設定: ホットリロード](/ja-JP/gateway/configuration#config-hot-reload)
- [設定: 厳密な検証](/ja-JP/gateway/configuration#strict-validation)
- [診断](/ja-JP/gateway/doctor)

## Gateway プローブの警告

`openclaw gateway probe` が何かに到達するが、それでも警告ブロックを表示する場合に使用する。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認する項目:

- JSON 出力内の `warnings[].code` と `primaryTargetId`。
- 警告が SSH フォールバック、複数の Gateway、不足しているスコープ、または未解決の認証参照に関するものかどうか。

よくある兆候:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH セットアップは失敗したが、コマンドは引き続き設定済み/loopback の直接ターゲットを試した。
- `multiple reachable gateway identities detected` → 別々の Gateway が応答した、または OpenClaw が到達可能なターゲットが同じ Gateway であることを証明できなかった。同じ Gateway への SSH トンネル、プロキシ URL、または設定済みリモート URL は、トランスポートポートが異なる場合でも、複数トランスポートを持つ 1 つの Gateway として扱われる。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続は成功したが、詳細 RPC がスコープで制限されている。デバイス ID をペアリングするか、`operator.read` を持つ認証情報を使用する。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 接続は成功したが、完全な診断 RPC セットがタイムアウトまたは失敗した。これは診断が劣化した到達可能な Gateway として扱い、`--json` 出力で `connect.ok` と `connect.rpcOk` を比較する。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → Gateway は応答したが、このクライアントは通常の operator アクセスの前にペアリング/承認がまだ必要。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef 警告テキスト → 失敗したターゲットについて、このコマンドパスでは認証素材を利用できなかった。

関連:

- [Gateway](/ja-JP/cli/gateway)
- [同じホスト上の複数 Gateway](/ja-JP/gateway#multiple-gateways-same-host)
- [リモートアクセス](/ja-JP/gateway/remote)

## チャンネルは接続済みだがメッセージが流れない

チャンネル状態が接続済みなのにメッセージフローが止まっている場合は、ポリシー、権限、チャンネル固有の配信ルールに注目する。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認する項目:

- DM ポリシー (`pairing`、`allowlist`、`open`、`disabled`)。
- グループ allowlist とメンション要件。
- 不足しているチャンネル API 権限/スコープ。

よくある兆候:

- `mention required` → グループメンションポリシーによりメッセージが無視された。
- `pairing` / 承認待ちトレース → 送信者が承認されていない。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → チャンネル認証/権限の問題。

関連:

- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [Discord](/ja-JP/channels/discord)
- [Telegram](/ja-JP/channels/telegram)
- [WhatsApp](/ja-JP/channels/whatsapp)

## Cron と Heartbeat の配信

Cron または Heartbeat が実行されなかった、または配信されなかった場合は、まずスケジューラー状態を確認し、次に配信ターゲットを確認する。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認する項目:

- Cron が有効で、次回の起床が存在する。
- ジョブ実行履歴のステータス（`ok`、`skipped`、`error`）。
- Heartbeat のスキップ理由（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="一般的なシグネチャ">
    - `cron: scheduler disabled; jobs will not run automatically` → cron が無効。
    - `cron: timer tick failed` → スケジューラーの tick に失敗。ファイル、ログ、ランタイムエラーを確認する。
    - `heartbeat skipped` と `reason=quiet-hours` → アクティブ時間帯の範囲外。
    - `heartbeat skipped` と `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在するが、空白、コメント、ヘッダー、フェンス、または空のチェックリストの足場だけを含むため、OpenClaw はモデル呼び出しをスキップする。
    - `heartbeat skipped` と `reason=no-tasks-due` → `HEARTBEAT.md` に `tasks:` ブロックは含まれるが、この tick で期限のタスクがない。
    - `heartbeat: unknown accountId` → Heartbeat 配信先のアカウント ID が無効。
    - `heartbeat skipped` と `reason=dm-blocked` → `agents.defaults.heartbeat.directPolicy`（またはエージェントごとの上書き）が `block` に設定されている間に、Heartbeat の宛先が DM 形式の宛先として解決された。

  </Accordion>
</AccordionGroup>

関連:

- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュールされたタスク](/ja-JP/automation/cron-jobs)
- [スケジュールされたタスク: トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting)

## Node はペアリング済みだが、ツールが失敗する

Node がペアリング済みでもツールが失敗する場合は、フォアグラウンド、権限、承認状態を切り分ける。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認する内容:

- Node がオンラインで、期待される機能を持っている。
- カメラ、マイク、位置情報、画面に対する OS 権限付与。
- Exec 承認と許可リストの状態。

一般的なシグネチャ:

- `NODE_BACKGROUND_UNAVAILABLE` → Node アプリがフォアグラウンドにある必要がある。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 権限が不足している。
- `SYSTEM_RUN_DENIED: approval required` → exec 承認が保留中。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが許可リストでブロックされている。

関連:

- [Exec 承認](/ja-JP/tools/exec-approvals)
- [Node トラブルシューティング](/ja-JP/nodes/troubleshooting)
- [Nodes](/ja-JP/nodes/index)

## ブラウザツールが失敗する

Gateway 自体は正常なのにブラウザツールのアクションが失敗する場合に使用する。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認する内容:

- `plugins.allow` が設定されており、`browser` を含んでいるか。
- 有効なブラウザ実行ファイルパス。
- CDP プロファイルの到達可能性。
- `existing-session` / `user` プロファイル向けのローカル Chrome の可用性。

<AccordionGroup>
  <Accordion title="Plugin / 実行ファイルのシグネチャ">
    - `unknown command "browser"` または `unknown command 'browser'` → バンドルされたブラウザ Plugin が `plugins.allow` によって除外されている。
    - `browser.enabled=true` の間にブラウザツールが欠落 / 利用不可 → `plugins.allow` が `browser` を除外しているため、Plugin が読み込まれていない。
    - `Failed to start Chrome CDP on port` → ブラウザプロセスの起動に失敗した。
    - `browser.executablePath not found` → 設定されたパスが無効。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定された CDP URL が `file:` や `ftp:` などのサポートされないスキームを使用している。
    - `browser.cdpUrl has invalid port` → 設定された CDP URL のポートが不正、または範囲外。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在の Gateway インストールにコアブラウザランタイム依存関係がない。OpenClaw を再インストールまたは更新してから、Gateway を再起動する。ARIA スナップショットと基本的なページスクリーンショットは引き続き動作する可能性があるが、ナビゲーション、AI スナップショット、CSS セレクターによる要素スクリーンショット、PDF エクスポートは利用できないまま。

  </Accordion>
  <Accordion title="Chrome MCP / existing-session のシグネチャ">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session は、選択されたブラウザデータディレクトリにまだアタッチできなかった。ブラウザの inspect ページを開き、リモートデバッグを有効にし、ブラウザを開いたままにし、最初のアタッチプロンプトを承認してから再試行する。サインイン状態が不要な場合は、管理対象の `openclaw` プロファイルを優先する。
    - `No browser tabs found for profile="user"` → Chrome MCP アタッチプロファイルに、開いているローカル Chrome タブがない。
    - `Remote CDP for profile "<name>" is not reachable` → 設定されたリモート CDP エンドポイントに Gateway ホストから到達できない。
    - `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only プロファイルに到達可能なターゲットがない、または HTTP エンドポイントは応答したが CDP WebSocket を開けなかった。

  </Accordion>
  <Accordion title="要素 / スクリーンショット / アップロードのシグネチャ">
    - `fullPage is not supported for element screenshots` → スクリーンショット要求で `--full-page` と `--ref` または `--element` が混在している。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` のスクリーンショット呼び出しでは、CSS の `--element` ではなく、ページキャプチャまたはスナップショットの `--ref` を使用する必要がある。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP のアップロードフックには、CSS セレクターではなくスナップショット ref が必要。
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP プロファイルでは、呼び出しごとに 1 つのアップロードを送信する。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP プロファイルのダイアログフックはタイムアウト上書きをサポートしていない。
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session プロファイルの `act:type` では `timeoutMs` を省略する。カスタムタイムアウトが必要な場合は、管理対象 / CDP ブラウザプロファイルを使用する。
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session プロファイルの `act:evaluate` では `timeoutMs` を省略する。カスタムタイムアウトが必要な場合は、管理対象 / CDP ブラウザプロファイルを使用する。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` には引き続き、管理対象ブラウザまたは raw CDP プロファイルが必要。
    - attach-only またはリモート CDP プロファイルで、ビューポート / ダークモード / ロケール / オフラインの上書きが古い → Gateway 全体を再起動せずに、`openclaw browser stop --browser-profile <name>` を実行してアクティブな制御セッションを閉じ、Playwright/CDP エミュレーション状態を解放する。

  </Accordion>
</AccordionGroup>

関連:

- [ブラウザ（OpenClaw 管理）](/ja-JP/tools/browser)
- [ブラウザのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)

## アップグレード後に何かが突然壊れた場合

アップグレード後の破損の多くは、設定のずれ、またはより厳格なデフォルトが現在適用されていることが原因。

<AccordionGroup>
  <Accordion title="1. 認証と URL 上書きの挙動が変更された">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    確認する内容:

    - `gateway.mode=remote` の場合、ローカルサービスが正常でも CLI 呼び出しはリモートを対象にしている可能性がある。
    - 明示的な `--url` 呼び出しは、保存済み認証情報にフォールバックしない。

    一般的なシグネチャ:

    - `gateway connect failed:` → URL ターゲットが間違っている。
    - `unauthorized` → エンドポイントには到達できるが、認証が間違っている。

  </Accordion>
  <Accordion title="2. bind と認証のガードレールがより厳格になった">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    確認する内容:

    - 非 loopback bind（`lan`、`tailnet`、`custom`）には、有効な Gateway 認証パスが必要。共有トークン / パスワード認証、または正しく設定された非 loopback の `trusted-proxy` デプロイメント。
    - `gateway.token` のような古いキーは `gateway.auth.token` の代替にはならない。

    一般的なシグネチャ:

    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証パスなしで非 loopback bind が行われている。
    - `Connectivity probe: failed` でランタイムは実行中 → Gateway は稼働しているが、現在の認証 / URL ではアクセスできない。

  </Accordion>
  <Accordion title="3. ペアリングとデバイス ID 状態が変更された">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    確認する内容:

    - ダッシュボード / Node の保留中デバイス承認。
    - ポリシーまたは ID 変更後の保留中 DM ペアリング承認。

    一般的なシグネチャ:

    - `device identity required` → デバイス認証が満たされていない。
    - `pairing required` → 送信者 / デバイスを承認する必要がある。

  </Accordion>
</AccordionGroup>

確認後もサービス設定とランタイムが一致しない場合は、同じプロファイル / 状態ディレクトリからサービスメタデータを再インストールする。

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
