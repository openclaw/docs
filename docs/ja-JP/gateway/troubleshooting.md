---
read_when:
    - トラブルシューティングハブから、より詳細な診断のためにここへ案内されました
    - 正確なコマンドを含む、安定した症状ベースのランブックセクションが必要です
sidebarTitle: Troubleshooting
summary: Gateway、チャネル、自動化、ノード、ブラウザーの詳細トラブルシューティングランブック
title: トラブルシューティング
x-i18n:
    generated_at: "2026-05-11T20:31:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 146a593493ce265da9a24660e8a9fc2effa25cae16cf00bf77cc1f2fec84275d
    source_path: gateway/troubleshooting.md
    workflow: 16
---

このページは詳細なランブックです。まず高速なトリアージフローを確認したい場合は、[/help/troubleshooting](/ja-JP/help/troubleshooting) から始めてください。

## コマンドの手順

まず次をこの順序で実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常時に期待されるシグナル:

- `openclaw gateway status` に `Runtime: running`、`Connectivity probe: ok`、および `Capability: ...` 行が表示される。
- `openclaw doctor` が、ブロック要因となる設定やサービスの問題を報告しない。
- `openclaw channels status --probe` がアカウントごとのライブなトランスポート状態を表示し、対応している場合は `works` や `audit ok` などのプローブ/監査結果も表示する。

## 分断されたインストールと新しい設定ガード

更新後に Gateway サービスが予期せず停止する場合、またはログで、ある `openclaw` バイナリが最後に `openclaw.json` を書き込んだバージョンより古いことが示される場合に使用します。

OpenClaw は設定の書き込みに `meta.lastTouchedVersion` を記録します。読み取り専用コマンドは新しい OpenClaw が書き込んだ設定を引き続き検査できますが、古いバイナリからのプロセスやサービスの変更は続行を拒否します。ブロックされる操作には、Gateway サービスの開始、停止、再起動、アンインストール、強制的なサービス再インストール、サービスモードの Gateway 起動、`gateway --force` によるポートクリーンアップが含まれます。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH を修正する">
    `PATH` を修正して `openclaw` が新しいインストールを解決するようにし、その後操作を再実行します。
  </Step>
  <Step title="Gateway サービスを再インストールする">
    新しいインストールから意図した Gateway サービスを再インストールします。

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="古いラッパーを削除する">
    古い `openclaw` バイナリをまだ指している古いシステムパッケージや古いラッパーエントリを削除します。
  </Step>
</Steps>

<Warning>
意図的なダウングレードまたは緊急復旧の場合にのみ、単一のコマンドに対して `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` を設定します。通常運用では未設定のままにしてください。
</Warning>

## Skill のシンボリックリンクがパスエスケープとしてスキップされる

ログに次が含まれる場合に使用します。

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw はすべての skill ルートを包含境界として扱います。
`~/.agents/skills`、`<workspace>/.agents/skills`、`<workspace>/skills`、または
`~/.openclaw/skills` 配下のシンボリックリンクは、ターゲットが明示的に信頼されていない限り、実際のターゲットがそのルートの外側に解決されるとスキップされます。

リンクを検査します。

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

ターゲットが意図したものである場合は、直接の skill ルートと許可されたシンボリックリンクターゲットの両方を設定します。

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

その後、新しいセッションを開始するか、skills ウォッチャーが更新されるのを待ちます。実行中のプロセスが設定変更より前に開始されている場合は、Gateway を再起動します。

`~`、`/`、同期プロジェクトフォルダー全体のような広いターゲットは使用しないでください。
`allowSymlinkTargets` は、信頼された `SKILL.md` ディレクトリを含む実際の skill ルートに限定してください。

関連:

- [Skills 設定](/ja-JP/tools/skills-config#symlinked-sibling-repos)
- [設定例](/ja-JP/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 長いコンテキストには追加利用が必要

ログ/エラーに `HTTP 429: rate_limit_error: Extra usage is required for long context requests` が含まれる場合に使用します。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認点:

- 選択された Anthropic Opus/Sonnet モデルに `params.context1m: true` がある。
- 現在の Anthropic 認証情報が長いコンテキストの使用対象ではない。
- 1M ベータパスを必要とする長いセッション/モデル実行でのみリクエストが失敗する。

修正オプション:

<Steps>
  <Step title="context1m を無効化する">
    そのモデルの `context1m` を無効化し、通常のコンテキストウィンドウへフォールバックします。
  </Step>
  <Step title="対象となる認証情報を使用する">
    長いコンテキストリクエストの対象となる Anthropic 認証情報を使用するか、Anthropic API キーへ切り替えます。
  </Step>
  <Step title="フォールバックモデルを設定する">
    Anthropic の長いコンテキストリクエストが拒否された場合でも実行が継続するように、フォールバックモデルを設定します。
  </Step>
</Steps>

関連:

- [Anthropic](/ja-JP/providers/anthropic)
- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [Anthropic から HTTP 429 が表示されるのはなぜですか？](/ja-JP/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ローカルの OpenAI 互換バックエンドは直接プローブを通過するが、エージェント実行が失敗する

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

確認点:

- 小さな直接呼び出しは成功するが、OpenClaw の実行は大きなプロンプトでのみ失敗する
- 同じ素のモデル ID で直接 `/v1/chat/completions` が動作するにもかかわらず、`model_not_found` または 404 エラーが出る
- `messages[].content` が文字列を期待しているというバックエンドエラー
- OpenAI 互換のローカルバックエンドで、`incomplete turn detected ... stopReason=stop payloads=0` 警告が断続的に出る
- 大きなプロンプトトークン数または完全なエージェントランタイムプロンプトでのみ発生するバックエンドクラッシュ

<AccordionGroup>
  <Accordion title="一般的なシグネチャ">
    - ローカル MLX/vLLM スタイルのサーバーで `model_not_found` → `baseUrl` に `/v1` が含まれていること、`/v1/chat/completions` バックエンドでは `api` が `"openai-completions"` であること、`models.providers.<provider>.models[].id` が素のプロバイダーローカル ID であることを確認します。選択時は一度だけプロバイダープレフィックスを付けます。例: `mlx/mlx-community/Qwen3-30B-A3B-6bit`。カタログエントリは `mlx-community/Qwen3-30B-A3B-6bit` のままにします。
    - `messages[...].content: invalid type: sequence, expected a string` → バックエンドが構造化された Chat Completions コンテンツパーツを拒否しています。修正: `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
    - `validation.keys` または `["role","content"]` のような許可済みメッセージキー → バックエンドが Chat Completions メッセージ上の OpenAI スタイルの再生メタデータを拒否しています。修正: `models.providers.<provider>.models[].compat.strictMessageKeys: true` を設定します。
    - `incomplete turn detected ... stopReason=stop payloads=0` → バックエンドは Chat Completions リクエストを完了しましたが、そのターンでユーザーに表示されるアシスタントテキストを返しませんでした。OpenClaw は再生しても安全な空の OpenAI 互換ターンを一度だけ再試行します。失敗が継続する場合、通常はバックエンドが空/非テキストのコンテンツを出力しているか、最終回答テキストを抑制しています。
    - 小さな直接リクエストは成功するが、OpenClaw エージェント実行がバックエンド/モデルのクラッシュで失敗する（たとえば一部の `inferrs` ビルド上の Gemma）→ OpenClaw トランスポートはすでに正しい可能性が高く、バックエンドがより大きなエージェントランタイムプロンプト形状で失敗しています。
    - ツールを無効化すると失敗が減るが、消えない → ツールスキーマは負荷要因の一部でしたが、残る問題は依然として上流モデル/サーバーの容量またはバックエンドのバグです。

  </Accordion>
  <Accordion title="修正オプション">
    1. 文字列専用の Chat Completions バックエンドには `compat.requiresStringContent: true` を設定します。
    2. 各メッセージで `role` と `content` のみを受け付ける厳格な Chat Completions バックエンドには `compat.strictMessageKeys: true` を設定します。
    3. OpenClaw のツールスキーマ面を安定して処理できないモデル/バックエンドには `compat.supportsTools: false` を設定します。
    4. 可能な範囲でプロンプト負荷を下げます。より小さいワークスペースブートストラップ、短いセッション履歴、軽量なローカルモデル、またはより強い長いコンテキスト対応を持つバックエンドを使用します。
    5. 小さな直接リクエストが通り続ける一方で、OpenClaw エージェントターンがバックエンド内でまだクラッシュする場合は、上流サーバー/モデルの制限として扱い、受け入れられたペイロード形状とともにそこで再現手順を報告します。
  </Accordion>
</AccordionGroup>

関連:

- [設定](/ja-JP/gateway/configuration)
- [ローカルモデル](/ja-JP/gateway/local-models)
- [OpenAI 互換エンドポイント](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)

## 返信がない

チャンネルが起動しているのに何も応答しない場合は、何かを再接続する前にルーティングとポリシーを確認します。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認点:

- DM 送信者の Pairing が保留中。
- グループメンションのゲート設定（`requireMention`、`mentionPatterns`）。
- チャンネル/グループの許可リストの不一致。

一般的なシグネチャ:

- `drop guild message (mention required` → メンションされるまでグループメッセージは無視される。
- `pairing request` → 送信者に承認が必要。
- `blocked` / `allowlist` → 送信者/チャンネルがポリシーでフィルターされた。

関連:

- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [グループ](/ja-JP/channels/groups)
- [Pairing](/ja-JP/channels/pairing)

## ダッシュボード制御 UI の接続性

ダッシュボード/制御 UI が接続できない場合は、URL、認証モード、セキュアコンテキストの前提を検証します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認点:

- 正しいプローブ URL とダッシュボード URL。
- クライアントと Gateway の間の認証モード/トークンの不一致。
- デバイス ID が必要な場所で HTTP を使用している。

<AccordionGroup>
  <Accordion title="接続/認証シグネチャ">
    - `device identity required` → 非セキュアコンテキスト、またはデバイス認証の欠落。
    - `origin not allowed` → ブラウザーの `Origin` が `gateway.controlUi.allowedOrigins` に含まれていない（または明示的な許可リストなしに非ループバックのブラウザーオリジンから接続している）。
    - `device nonce required` / `device nonce mismatch` → クライアントがチャレンジベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していない。
    - `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったペイロード（または古いタイムスタンプ）に署名した。
    - `AUTH_TOKEN_MISMATCH` かつ `canRetryWithDeviceToken=true` → クライアントはキャッシュ済みデバイストークンで信頼済み再試行を一度だけ実行できる。
    - そのキャッシュ済みトークン再試行は、ペアリング済みデバイストークンとともに保存されたキャッシュ済みスコープセットを再利用する。明示的な `deviceToken` / 明示的な `scopes` 呼び出し元は、代わりに要求したスコープセットを保持する。
    - `AUTH_SCOPE_MISMATCH` → デバイストークンは認識されたが、その承認済みスコープがこの接続リクエストをカバーしていない。共有 Gateway トークンをローテーションするのではなく、再ペアリングするか、要求されたスコープ契約を承認する。
    - その再試行パスの外では、接続認証の優先順位は、明示的な共有トークン/パスワードが最初、次に明示的な `deviceToken`、次に保存済みデバイストークン、最後にブートストラップトークン。
    - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, ip}` に対する失敗試行は、リミッターが失敗を記録する前に直列化される。そのため、同じクライアントからの不正な同時再試行が 2 件ある場合、2 件の単純な不一致ではなく、2 回目の試行で `retry later` が表面化することがある。
    - ブラウザーオリジンのループバッククライアントから `too many failed authentication attempts (retry later)` → 同じ正規化済み `Origin` からの失敗の繰り返しは一時的にロックアウトされる。別の localhost オリジンは別のバケットを使用する。
    - その再試行後も `unauthorized` が繰り返される → 共有トークン/デバイストークンのずれ。必要に応じてトークン設定を更新し、デバイストークンを再承認/ローテーションする。
    - `gateway connect failed:` → ホスト/ポート/URL ターゲットが誤っている。

  </Accordion>
</AccordionGroup>

### 認証詳細コードのクイックマップ

失敗した `connect` レスポンスの `error.details.code` を使って、次の操作を選択します。

| 詳細コード                 | 意味                                                                                                                                                                               | 推奨される対応                                                                                                                                                                                                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | クライアントが必要な共有トークンを送信しませんでした。                                                                                                                                                 | クライアントにトークンを貼り付けるか設定し、再試行します。ダッシュボードパスの場合: `openclaw config get gateway.auth.token` を実行してから Control UI 設定に貼り付けます。                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共有トークンが Gateway 認証トークンと一致しませんでした。                                                                                                                                               | `canRetryWithDeviceToken=true` の場合、信頼済みの再試行を 1 回許可します。キャッシュ済みトークンの再試行では保存済みの承認済みスコープが再利用されます。明示的な `deviceToken` / `scopes` 呼び出し元は要求されたスコープを維持します。それでも失敗する場合は、[トークンドリフト復旧チェックリスト](/ja-JP/cli/devices#token-drift-recovery-checklist)を実行します。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | キャッシュ済みのデバイスごとのトークンが古いか、取り消されています。                                                                                                                                                 | [devices CLI](/ja-JP/cli/devices) を使ってデバイストークンをローテーションまたは再承認し、再接続します。                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | デバイストークンは有効ですが、承認済みのロール/スコープがこの接続要求をカバーしていません。                                                                                                       | デバイスを再ペアリングするか、要求されたスコープ契約を承認します。これを共有トークンのドリフトとして扱わないでください。                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | デバイス ID に承認が必要です。`not-paired`、`scope-upgrade`、`role-upgrade`、または `metadata-upgrade` について `error.details.reason` を確認し、存在する場合は `requestId` / `remediationHint` を使用します。 | 保留中の要求を承認します: `openclaw devices list` の後に `openclaw devices approve <requestId>` を実行します。スコープ/ロールのアップグレードは、要求されたアクセスを確認した後、同じフローを使用します。                                                                                                               |

<Note>
共有 Gateway トークン/パスワードで認証された直接 loopback バックエンド RPC は、CLI のペアリング済みデバイススコープベースラインに依存すべきではありません。サブエージェントやその他の内部呼び出しが `scope-upgrade` でまだ失敗する場合は、呼び出し元が `client.id: "gateway-client"` と `client.mode: "backend"` を使用しており、明示的な `deviceIdentity` またはデバイストークンを強制していないことを確認してください。
</Note>

デバイス認証 v2 移行チェック:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログに nonce/signature エラーが表示される場合は、接続するクライアントを更新し、検証します:

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

- ペアリング済みデバイストークンセッションは、呼び出し元が `operator.admin` も持っていない限り、**自身の**デバイスのみ管理できます
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
openclaw gateway status --deep   # システムレベルのサービスもスキャンする
```

確認事項:

- 終了ヒント付きの `Runtime: stopped`。
- サービス設定の不一致 (`Config (cli)` と `Config (service)`)。
- ポート/リスナーの競合。
- `--deep` 使用時の余分な launchd/systemd/schtasks インストール。
- `Other gateway-like services detected (best effort)` のクリーンアップヒント。

<AccordionGroup>
  <Accordion title="一般的なシグネチャ">
    - `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → ローカル Gateway モードが有効になっていないか、設定ファイルが上書きされて `gateway.mode` が失われています。修正: 設定で `gateway.mode="local"` を設定するか、`openclaw onboard --mode local` / `openclaw setup` を再実行して期待されるローカルモード設定を再スタンプします。Podman 経由で OpenClaw を実行している場合、デフォルトの設定パスは `~/.openclaw/openclaw.json` です。
    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証パス (トークン/パスワード、または設定されている場合は信頼済みプロキシ) なしで非 loopback にバインドしようとしています。
    - `another gateway instance is already listening` / `EADDRINUSE` → ポート競合です。
    - `Other gateway-like services detected (best effort)` → 古い、または並列の launchd/systemd/schtasks ユニットが存在します。ほとんどのセットアップでは、1 台のマシンにつき Gateway は 1 つにすべきです。複数必要な場合は、ポート + 設定/状態/ワークスペースを分離します。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。
    - doctor からの `System-level OpenClaw gateway service detected` → ユーザーレベルのサービスがない一方で、systemd システムユニットが存在します。doctor にユーザーサービスをインストールさせる前に重複を削除または無効化するか、システムユニットが意図した supervisor である場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。
    - `Gateway service port does not match current gateway config` → インストール済み supervisor がまだ古い `--port` を固定しています。`openclaw doctor --fix` または `openclaw gateway install --force` を実行してから、Gateway サービスを再起動します。

  </Accordion>
</AccordionGroup>

関連:

- [バックグラウンド実行とプロセスツール](/ja-JP/gateway/background-process)
- [設定](/ja-JP/gateway/configuration)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway が無効な設定を拒否した

Gateway 起動が `Invalid config` で失敗する場合、またはホットリロードログに
無効な編集をスキップしたと表示される場合に使用します。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

確認事項:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- アクティブな設定の横にあるタイムスタンプ付きの `openclaw.json.rejected.*` ファイル
- `doctor --fix` が壊れた直接編集を修復した場合の、タイムスタンプ付きの `openclaw.json.clobbered.*` ファイル

<AccordionGroup>
  <Accordion title="何が起きたか">
    - 起動、ホットリロード、または OpenClaw 所有の書き込み中に設定が検証に通りませんでした。
    - Gateway 起動は `openclaw.json` を書き換えるのではなく、フェイルクローズします。
    - ホットリロードは無効な外部編集をスキップし、現在のランタイム設定をアクティブに保ちます。
    - OpenClaw 所有の書き込みは、コミット前に無効/破壊的なペイロードを拒否し、`.rejected.*` を保存します。
    - `openclaw doctor --fix` が修復を担当します。非 JSON プレフィックスを削除したり、拒否されたペイロードを `.clobbered.*` として保持しながら last-known-good コピーを復元したりできます。

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
    - `.clobbered.*` が存在する → doctor がアクティブな設定を修復する間、壊れた外部編集を保持しました。
    - `.rejected.*` が存在する → OpenClaw 所有の設定書き込みが、コミット前にスキーマまたは clobber チェックに失敗しました。
    - `Config write rejected:` → 書き込みが必要な形状を削除する、ファイルを急激に縮小する、または無効な設定を永続化しようとしました。
    - `config reload skipped (invalid config):` → 直接編集が検証に失敗し、実行中の Gateway に無視されました。
    - `Invalid config at ...` → Gateway サービスが起動する前に起動が失敗しました。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good`、または `size-drop-vs-last-good:*` → OpenClaw 所有の書き込みが、last-known-good バックアップと比べてフィールドまたはサイズを失ったため拒否されました。
    - `Config last-known-good promotion skipped` → 候補に `***` などの伏せ字のシークレットプレースホルダーが含まれていました。

  </Accordion>
  <Accordion title="修正オプション">
    1. `openclaw doctor --fix` を実行して、doctor にプレフィックス付き/clobbered 設定を修復させるか、last-known-good を復元させます。
    2. `.clobbered.*` または `.rejected.*` から意図したキーのみをコピーし、`openclaw config set` または `config.patch` で適用します。
    3. 再起動前に `openclaw config validate` を実行します。
    4. 手動で編集する場合は、変更したい部分オブジェクトだけでなく、完全な JSON5 設定を保持してください。
  </Accordion>
</AccordionGroup>

関連:

- [Config](/ja-JP/cli/config)
- [設定: ホットリロード](/ja-JP/gateway/configuration#config-hot-reload)
- [設定: 厳密な検証](/ja-JP/gateway/configuration#strict-validation)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway probe 警告

`openclaw gateway probe` が何かに到達するものの、警告ブロックも表示する場合に使用します。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認事項:

- JSON 出力内の `warnings[].code` と `primaryTargetId`。
- 警告が SSH フォールバック、複数の Gateway、欠落したスコープ、または未解決の認証参照のどれに関するものか。

一般的なシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH セットアップに失敗しましたが、コマンドは引き続き直接設定済み/loopback ターゲットを試行しました。
- `multiple reachable gateways detected` → 複数のターゲットが応答しました。通常、これは意図的なマルチ Gateway セットアップ、または古い/重複したリスナーを意味します。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続は成功しましたが、詳細 RPC はスコープ制限されています。デバイス ID をペアリングするか、`operator.read` を持つ認証情報を使用してください。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 接続は成功しましたが、完全な診断 RPC セットがタイムアウトまたは失敗しました。これは診断が劣化した到達可能な Gateway として扱い、`--json` 出力の `connect.ok` と `connect.rpcOk` を比較してください。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → Gateway は応答しましたが、このクライアントは通常の operator アクセスの前にまだペアリング/承認が必要です。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef 警告テキスト → 失敗したターゲットに対して、このコマンドパスでは認証素材を利用できませんでした。

関連:

- [Gateway](/ja-JP/cli/gateway)
- [同じホスト上の複数の Gateway](/ja-JP/gateway#multiple-gateways-same-host)
- [リモートアクセス](/ja-JP/gateway/remote)

## チャネルは接続済みだが、メッセージが流れない

チャネル状態が接続済みなのにメッセージフローが止まっている場合は、ポリシー、権限、チャネル固有の配送ルールに注目してください。

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
- チャネル API の権限/スコープ不足。

よくある兆候:

- `mention required` → グループメンションポリシーによりメッセージが無視されています。
- `pairing` / 承認待ちの痕跡 → 送信者が承認されていません。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → チャネル認証/権限の問題です。

関連:

- [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [Discord](/ja-JP/channels/discord)
- [Telegram](/ja-JP/channels/telegram)
- [WhatsApp](/ja-JP/channels/whatsapp)

## Cron と Heartbeat の配送

Cron または Heartbeat が実行されなかった、または配送されなかった場合は、まずスケジューラーの状態を確認し、次に配送先を確認してください。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認する項目:

- Cron が有効で、次回の起動が存在すること。
- ジョブ実行履歴の状態（`ok`、`skipped`、`error`）。
- Heartbeat のスキップ理由（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="よくある兆候">
    - `cron: scheduler disabled; jobs will not run automatically` → cron が無効です。
    - `cron: timer tick failed` → スケジューラーの tick に失敗しました。ファイル/ログ/ランタイムエラーを確認してください。
    - `heartbeat skipped` で `reason=quiet-hours` → アクティブ時間帯の外です。
    - `heartbeat skipped` で `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在しますが、空行または Markdown ヘッダーのみを含むため、OpenClaw はモデル呼び出しをスキップします。
    - `heartbeat skipped` で `reason=no-tasks-due` → `HEARTBEAT.md` に `tasks:` ブロックがありますが、この tick で期限を迎えるタスクがありません。
    - `heartbeat: unknown accountId` → Heartbeat 配送先のアカウント ID が無効です。
    - `heartbeat skipped` で `reason=dm-blocked` → Heartbeat の送信先が DM 形式の宛先に解決されましたが、`agents.defaults.heartbeat.directPolicy`（またはエージェント単位の上書き）が `block` に設定されています。

  </Accordion>
</AccordionGroup>

関連:

- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュールされたタスク](/ja-JP/automation/cron-jobs)
- [スケジュールされたタスク: トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting)

## Node はペアリング済みだが、ツールが失敗する

Node がペアリング済みでもツールが失敗する場合は、フォアグラウンド、権限、承認状態を切り分けてください。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認する項目:

- Node がオンラインで、想定される機能を持っていること。
- カメラ/マイク/位置情報/画面に対する OS 権限の付与。
- Exec 承認と許可リストの状態。

よくある兆候:

- `NODE_BACKGROUND_UNAVAILABLE` → Node アプリをフォアグラウンドにする必要があります。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 権限が不足しています。
- `SYSTEM_RUN_DENIED: approval required` → exec 承認が保留中です。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが許可リストによりブロックされています。

関連:

- [Exec 承認](/ja-JP/tools/exec-approvals)
- [Node のトラブルシューティング](/ja-JP/nodes/troubleshooting)
- [Node](/ja-JP/nodes/index)

## ブラウザツールが失敗する

Gateway 自体は正常なのにブラウザツールのアクションが失敗する場合に使用します。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認する項目:

- `plugins.allow` が設定され、`browser` を含んでいるか。
- 有効なブラウザ実行ファイルパス。
- CDP プロファイルへの到達性。
- `existing-session` / `user` プロファイル向けのローカル Chrome の可用性。

<AccordionGroup>
  <Accordion title="Plugin / 実行ファイルの兆候">
    - `unknown command "browser"` または `unknown command 'browser'` → バンドルされたブラウザ plugin が `plugins.allow` により除外されています。
    - `browser.enabled=true` なのにブラウザツールがない / 利用できない → `plugins.allow` が `browser` を除外しているため、plugin が読み込まれていません。
    - `Failed to start Chrome CDP on port` → ブラウザプロセスの起動に失敗しました。
    - `browser.executablePath not found` → 設定されたパスが無効です。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定された CDP URL が `file:` や `ftp:` などの未対応スキームを使用しています。
    - `browser.cdpUrl has invalid port` → 設定された CDP URL のポートが不正または範囲外です。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在の Gateway インストールには、コアブラウザランタイム依存関係がありません。OpenClaw を再インストールまたは更新してから、Gateway を再起動してください。ARIA スナップショットと基本的なページスクリーンショットは引き続き動作しますが、ナビゲーション、AI スナップショット、CSS セレクター要素スクリーンショット、PDF エクスポートは利用できないままです。

  </Accordion>
  <Accordion title="Chrome MCP / 既存セッションの兆候">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP 既存セッションは、選択されたブラウザデータディレクトリにまだアタッチできませんでした。ブラウザの検査ページを開き、リモートデバッグを有効にし、ブラウザを開いたままにして、最初のアタッチプロンプトを承認してから再試行してください。サインイン状態が不要な場合は、管理対象の `openclaw` プロファイルを優先してください。
    - `No Chrome tabs found for profile="user"` → Chrome MCP アタッチプロファイルに、開いているローカル Chrome タブがありません。
    - `Remote CDP for profile "<name>" is not reachable` → 設定されたリモート CDP エンドポイントに Gateway ホストから到達できません。
    - `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → アタッチ専用プロファイルに到達可能なターゲットがないか、HTTP エンドポイントは応答したものの CDP WebSocket を開けませんでした。

  </Accordion>
  <Accordion title="要素 / スクリーンショット / アップロードの兆候">
    - `fullPage is not supported for element screenshots` → スクリーンショット要求で `--full-page` と `--ref` または `--element` が混在しています。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` のスクリーンショット呼び出しでは、CSS `--element` ではなく、ページキャプチャまたはスナップショット `--ref` を使用する必要があります。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP アップロードフックには、CSS セレクターではなくスナップショット参照が必要です。
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP プロファイルでは、呼び出しごとに 1 つのアップロードを送信してください。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP プロファイル上のダイアログフックは、タイムアウト上書きをサポートしていません。
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP 既存セッションプロファイルの `act:type` では `timeoutMs` を省略するか、カスタムタイムアウトが必要な場合は管理対象/CDP ブラウザプロファイルを使用してください。
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP 既存セッションプロファイルの `act:evaluate` では `timeoutMs` を省略するか、カスタムタイムアウトが必要な場合は管理対象/CDP ブラウザプロファイルを使用してください。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` には引き続き、管理対象ブラウザまたは raw CDP プロファイルが必要です。
    - アタッチ専用またはリモート CDP プロファイルで viewport / ダークモード / ロケール / オフライン上書きが古い → Gateway 全体を再起動せずにアクティブな制御セッションを閉じ、Playwright/CDP エミュレーション状態を解放するには、`openclaw browser stop --browser-profile <name>` を実行してください。

  </Accordion>
</AccordionGroup>

関連:

- [ブラウザ（OpenClaw 管理）](/ja-JP/tools/browser)
- [ブラウザのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)

## アップグレード後に何かが突然壊れた場合

アップグレード後の破損の多くは、設定のずれ、またはより厳格なデフォルトが現在適用されていることが原因です。

<AccordionGroup>
  <Accordion title="1. 認証と URL 上書きの挙動が変更された">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    確認すること:

    - `gateway.mode=remote` の場合、ローカルサービスは正常でも、CLI 呼び出しがリモートを対象にしている可能性があります。
    - 明示的な `--url` 呼び出しは、保存された認証情報にフォールバックしません。

    よくある兆候:

    - `gateway connect failed:` → URL の対象が間違っています。
    - `unauthorized` → エンドポイントには到達できますが、認証が間違っています。

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

    - 非ループバックバインド（`lan`、`tailnet`、`custom`）には、有効な Gateway 認証パスが必要です。共有トークン/パスワード認証、または正しく設定された非ループバック `trusted-proxy` デプロイです。
    - `gateway.token` のような古いキーは `gateway.auth.token` の代わりにはなりません。

    よくある兆候:

    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証パスなしで非ループバックにバインドしています。
    - ランタイムは実行中なのに `Connectivity probe: failed` → Gateway は動作していますが、現在の認証/URL ではアクセスできません。

  </Accordion>
  <Accordion title="3. ペアリングとデバイス ID 状態が変更された">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    確認すること:

    - ダッシュボード/Node の保留中のデバイス承認。
    - ポリシーまたは ID の変更後の保留中の DM ペアリング承認。

    よくある兆候:

    - `device identity required` → デバイス認証が満たされていません。
    - `pairing required` → 送信者/デバイスを承認する必要があります。

  </Accordion>
</AccordionGroup>

確認後もサービス設定とランタイムが一致しない場合は、同じプロファイル/状態ディレクトリからサービスメタデータを再インストールしてください。

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
