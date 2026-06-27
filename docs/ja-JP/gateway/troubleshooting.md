---
read_when:
    - トラブルシューティングハブから、より詳しい診断のためにここへ案内されました
    - 安定した症状別のランブックセクションと正確なコマンドが必要です
sidebarTitle: Troubleshooting
summary: Gateway、チャネル、自動化、ノード、ブラウザ向けの詳細トラブルシューティング ランブック
title: トラブルシューティング
x-i18n:
    generated_at: "2026-06-27T11:39:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

このページは詳細なランブックです。まず高速なトリアージフローを使いたい場合は、[/help/troubleshooting](/ja-JP/help/troubleshooting) から始めてください。

## コマンドラダー

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
- `openclaw channels status --probe` が、アカウントごとのライブなトランスポート状態と、サポートされている場合は `works` や `audit ok` などのプローブ/監査結果を表示する。

## 更新後

更新が完了したが Gateway が停止している、チャンネルが空である、または
モデル呼び出しが 401 で失敗し始めた場合に使用します。

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

確認すること:

- `openclaw status` / `openclaw status --all` の `Update restart`。保留中または
  失敗した引き継ぎには、次に実行するコマンドが含まれます。
- Channels の下にある `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`。
  これは、チャンネル設定はまだ存在するものの、チャンネルを読み込む前に Plugin
  登録が失敗したことを意味します。
- 再認証後のプロバイダー 401。`openclaw doctor --fix` は、古い
  エージェントごとの OAuth 認証シャドウを確認し、古いコピーを削除して、すべてのエージェントが
  現在の共有プロファイルを解決できるようにします。

## 分断されたインストールと新しい設定ガード

更新後に gateway サービスが予期せず停止する場合、またはログで、ある `openclaw` バイナリが `openclaw.json` を最後に書き込んだバージョンより古いことが示される場合に使用します。

OpenClaw は設定書き込みに `meta.lastTouchedVersion` を刻印します。読み取り専用コマンドは、より新しい OpenClaw によって書き込まれた設定を引き続き検査できますが、古いバイナリからのプロセスおよびサービスの変更は続行を拒否します。ブロックされる操作には、gateway サービスの開始、停止、再起動、アンインストール、強制サービス再インストール、サービスモードの gateway 起動、および `gateway --force` によるポートクリーンアップが含まれます。

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
    新しいインストールから、意図した gateway サービスを再インストールします。

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    まだ古い `openclaw` バイナリを指している古いシステムパッケージまたは古いラッパーエントリを削除します。
  </Step>
</Steps>

<Warning>
意図的なダウングレードまたは緊急復旧の場合に限り、単一のコマンドに対して `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` を設定します。通常運用では未設定のままにしてください。
</Warning>

## ロールバック後のプロトコル不一致

OpenClaw をダウングレードまたはロールバックした後も、ログに `protocol mismatch` が出続ける場合に使用します。これは、古い Gateway が実行中である一方で、より新しいローカルクライアントプロセスが、古い Gateway では扱えないプロトコル範囲で再接続しようとしていることを意味します。

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

確認すること:

- Gateway ログ内の `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`。
- `openclaw gateway status --deep` の `Established clients:`、または `openclaw doctor --deep` の `Gateway clients`。これは、Gateway ポートに接続しているアクティブな TCP クライアントを一覧表示し、OS が許可する場合は PID とコマンドラインも含みます。
- コマンドラインが、ロールバック元のより新しい OpenClaw インストールまたはラッパーを指しているクライアントプロセス。

修正:

1. `gateway status --deep` に表示される古い OpenClaw クライアントプロセスを停止または再起動します。
2. ローカルダッシュボード、エディター、アプリサーバーヘルパー、長時間実行中の `openclaw logs --follow` シェルなど、OpenClaw を組み込んでいるアプリやラッパーを再起動します。
3. `openclaw gateway status --deep` または `openclaw doctor --deep` を再実行し、古いクライアント PID がなくなっていることを確認します。

古い Gateway に、新しい互換性のないプロトコルを受け入れさせないでください。プロトコルの引き上げはワイヤ契約を保護します。ロールバック復旧は、プロセス/バージョンのクリーンアップ問題です。

## パスエスケープとしてスキルのシンボリックリンクがスキップされる

ログに次が含まれる場合に使用します。

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw はすべてのスキルルートを封じ込め境界として扱います。
`~/.agents/skills`、`<workspace>/.agents/skills`、`<workspace>/skills`、または
`~/.openclaw/skills` の下にあるシンボリックリンクは、ターゲットが明示的に信頼されていない限り、
実際のターゲットがそのルートの外に解決されるとスキップされます。

リンクを検査します。

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

ターゲットが意図したものなら、直接のスキルルートと許可されたシンボリックリンクターゲットの両方を設定します。

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

その後、新しいセッションを開始するか、skills watcher が更新されるのを待ちます。実行中のプロセスが設定変更より前のものである場合は、gateway を再起動します。

`~`、`/`、または同期済みプロジェクトフォルダー全体のような広いターゲットは使用しないでください。
`allowSymlinkTargets` は、信頼された `SKILL.md` ディレクトリを含む実際のスキルルートに限定してください。

Skill Workshop apply でも、これらの信頼されたシンボリックリンク先の
ワークスペーススキルパスに書き込む必要がある場合は、`skills.workshop.allowSymlinkTargetWrites` を有効にします。
読み取り専用の共有スキルルートでは無効のままにしてください。

関連:

- [Skills 設定](/ja-JP/tools/skills-config#symlinked-skill-roots)
- [設定例](/ja-JP/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 で長いコンテキストに追加利用が必要

ログ/エラーに `HTTP 429: rate_limit_error: Extra usage is required for long context requests` が含まれる場合に使用します。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認すること:

- 選択された Anthropic モデルが GA 対応の 1M Claude 4.x モデルである、またはモデルにレガシーの `params.context1m: true` がある。
- 現在の Anthropic 認証情報が長いコンテキストの利用対象ではない。
- 1M コンテキストパスを必要とする長いセッション/モデル実行でのみリクエストが失敗する。

修正オプション:

<Steps>
  <Step title="Use a standard context window">
    標準ウィンドウのモデルに切り替えるか、1M コンテキストに GA 対応していない古い
    モデル設定からレガシーの `context1m` を削除します。
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

## アップストリームの 403 ブロック応答

アップストリームの LLM プロバイダーが `Your request was blocked` のような汎用的な
`403` を返す場合に使用します。

これが常に OpenClaw の設定問題であると仮定しないでください。この応答は、
OpenAI互換エンドポイントの前段にある CDN、WAF、ボット管理ルール、リバースプロキシなど、
アップストリームのセキュリティ層から返されることがあります。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

確認すること:

- 同じプロバイダー配下の複数モデルが同じ方法で失敗している
- 通常のプロバイダー API エラーではなく、HTML または汎用的なセキュリティテキストが返っている
- 同じリクエスト時刻にプロバイダー側のセキュリティイベントがある
- 小さな直接 `curl` プローブは成功するが、通常の SDK 形式のリクエストは失敗する

証拠が WAF/CDN ブロックを示している場合は、先にプロバイダー側のフィルタリングを修正します。
OpenClaw が使用する API パスに対して狭くスコープした許可またはスキップルールを優先し、
サイト全体の保護を無効にすることは避けてください。

<Warning>
最小限の `curl` が成功しても、実際の SDK スタイルのリクエストが同じアップストリームセキュリティ層を通過できるとは限りません。
</Warning>

関連:

- [OpenAI互換エンドポイント](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)
- [プロバイダー設定](/ja-JP/providers)
- [ログ](/ja-JP/logging)

## ローカルの OpenAI互換バックエンドは直接プローブに通るがエージェント実行が失敗する

次の場合に使用します。

- `curl ... /v1/models` が動作する
- 小さな直接 `/v1/chat/completions` 呼び出しが動作する
- OpenClaw のモデル実行が、通常のエージェントターンでのみ失敗する

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

確認すること:

- 直接の小さな呼び出しは成功するが、OpenClaw の実行は大きなプロンプトでのみ失敗する
- 同じ素のモデル id で直接 `/v1/chat/completions` が動作するにもかかわらず、
  `model_not_found` または 404 エラーが発生する
- `messages[].content` が文字列であることを期待するバックエンドエラー
- OpenAI互換のローカルバックエンドで断続的に発生する `incomplete turn detected ... stopReason=stop payloads=0` 警告
- より大きなプロンプトトークン数または完全なエージェントランタイムプロンプトでのみ現れるバックエンドクラッシュ

<AccordionGroup>
  <Accordion title="Common signatures">
    - ローカル MLX/vLLM スタイルのサーバーで `model_not_found` → `baseUrl` に `/v1` が含まれていること、`/v1/chat/completions` バックエンドでは `api` が `"openai-completions"` であること、`models.providers.<provider>.models[].id` が素のプロバイダーローカル id であることを確認します。たとえば `mlx/mlx-community/Qwen3-30B-A3B-6bit` のように、プロバイダープレフィックス付きで一度選択します。カタログエントリは `mlx-community/Qwen3-30B-A3B-6bit` のままにします。
    - `messages[...].content: invalid type: sequence, expected a string` → バックエンドが構造化された Chat Completions コンテンツパーツを拒否しています。修正: `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
    - `validation.keys` または `["role","content"]` のような許可メッセージキー → バックエンドが Chat Completions メッセージ上の OpenAI スタイルのリプレイメタデータを拒否しています。修正: `models.providers.<provider>.models[].compat.strictMessageKeys: true` を設定します。
    - `incomplete turn detected ... stopReason=stop payloads=0` → バックエンドは Chat Completions リクエストを完了しましたが、そのターンでユーザーに表示される assistant テキストを返していません。OpenClaw は、リプレイ安全な空の OpenAI互換ターンを一度再試行します。永続的な失敗は通常、バックエンドが空/非テキストのコンテンツを出力しているか、最終回答テキストを抑制していることを意味します。
    - 直接の小さなリクエストは成功するが、OpenClaw エージェント実行がバックエンド/モデルのクラッシュで失敗する（たとえば一部の `inferrs` ビルド上の Gemma） → OpenClaw のトランスポートはすでに正しい可能性が高く、バックエンドがより大きなエージェントランタイムプロンプト形状で失敗しています。
    - ツールを無効化すると失敗が減るが消えない → ツールスキーマは負荷の一部でしたが、残る問題は依然としてアップストリームのモデル/サーバー容量またはバックエンドのバグです。

  </Accordion>
  <Accordion title="Fix options">
    1. 文字列のみの Chat Completions バックエンドには `compat.requiresStringContent: true` を設定します。
    2. 各メッセージで `role` と `content` のみを受け入れる厳格な Chat Completions バックエンドには `compat.strictMessageKeys: true` を設定します。
    3. OpenClaw のツールスキーマサーフェスを信頼性高く扱えないモデル/バックエンドには `compat.supportsTools: false` を設定します。
    4. 可能な範囲でプロンプト負荷を下げます。より小さなワークスペースブートストラップ、短いセッション履歴、軽量なローカルモデル、またはより強力な長いコンテキスト対応を持つバックエンドを使用します。
    5. 小さな直接リクエストは成功し続ける一方で、OpenClaw エージェントターンがバックエンド内部でクラッシュし続ける場合は、アップストリームサーバー/モデルの制限として扱い、受け入れられたペイロード形状とともに再現を提出します。
  </Accordion>
</AccordionGroup>

関連:

- [設定](/ja-JP/gateway/configuration)
- [ローカルモデル](/ja-JP/gateway/local-models)
- [OpenAI 互換エンドポイント](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)

## 応答がない

チャネルは起動しているのに何も応答しない場合は、何かを再接続する前にルーティングとポリシーを確認します。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認すること:

- DM 送信者のペアリングが保留中。
- グループメンションのゲート制御（`requireMention`、`mentionPatterns`）。
- チャネル/グループの許可リスト不一致。

よくある兆候:

- `drop guild message (mention required` → メンションされるまでグループメッセージは無視される。
- `pairing request` → 送信者に承認が必要。
- `blocked` / `allowlist` → 送信者/チャネルがポリシーでフィルタされた。

関連:

- [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
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

確認すること:

- 正しいプローブ URL とダッシュボード URL。
- クライアントと Gateway の間での認証モード/トークン不一致。
- デバイス ID が必要な場所で HTTP を使用している。

更新後にローカルブラウザーが `127.0.0.1:18789` に接続できない場合は、まず
ローカル Gateway サービスを復旧し、ダッシュボードを提供していることを確認します。

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

`curl` が OpenClaw HTML を返す場合、Gateway は動作しており、残りの問題は
ブラウザーキャッシュ、古いディープリンク、または古いタブ状態である可能性が高いです。
`http://127.0.0.1:18789` を直接開き、ダッシュボードから移動してください。再起動後も
サービスが稼働しない場合は、`openclaw gateway start` を実行し、
`openclaw gateway status` を再確認します。

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → 非セキュアコンテキスト、またはデバイス認証の欠落。
    - `origin not allowed` → ブラウザーの `Origin` が `gateway.controlUi.allowedOrigins` に含まれていない（または明示的な許可リストなしで非ループバックのブラウザーオリジンから接続している）。
    - `device nonce required` / `device nonce mismatch` → クライアントがチャレンジベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していない。
    - `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったペイロード（または古いタイムスタンプ）に署名した。
    - `AUTH_TOKEN_MISMATCH` かつ `canRetryWithDeviceToken=true` → クライアントはキャッシュ済みデバイストークンで 1 回だけ信頼済みリトライを実行できる。
    - そのキャッシュ済みトークンによるリトライは、ペアリング済みデバイストークンと一緒に保存されたキャッシュ済みスコープセットを再利用する。明示的な `deviceToken` / 明示的な `scopes` 呼び出し元は、代わりに要求したスコープセットを維持する。
    - `AUTH_SCOPE_MISMATCH` → デバイストークンは認識されたが、その承認済みスコープがこの接続リクエストをカバーしていない。共有 Gateway トークンをローテーションするのではなく、再ペアリングするか要求されたスコープ契約を承認する。
    - そのリトライ経路以外では、接続認証の優先順位は、明示的な共有トークン/パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順。
    - 非同期 Tailscale Serve Control UI 経路では、同じ `{scope, ip}` に対する失敗した試行は、リミッターが失敗を記録する前に直列化される。そのため、同じクライアントから 2 つの不正なリトライが同時に行われると、2 つの通常の不一致ではなく、2 回目の試行で `retry later` が表面化することがある。
    - ブラウザーオリジンのループバッククライアントからの `too many failed authentication attempts (retry later)` → 同じ正規化済み `Origin` からの失敗が繰り返されたため、一時的にロックアウトされている。別の localhost オリジンは別のバケットを使用する。
    - そのリトライ後も `unauthorized` が繰り返される → 共有トークン/デバイストークンのずれ。必要に応じてトークン設定を更新し、デバイストークンを再承認/ローテーションする。
    - `gateway connect failed:` → ホスト/ポート/URL ターゲットが誤っている。

  </Accordion>
</AccordionGroup>

### 認証詳細コードのクイックマップ

失敗した `connect` レスポンスの `error.details.code` を使って、次の対応を選びます。

| 詳細コード                 | 意味                                                                                                                                                                                      | 推奨対応                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | クライアントが必要な共有トークンを送信しなかった。                                                                                                                                                 | クライアントにトークンを貼り付ける/設定してリトライする。ダッシュボード経路の場合: `openclaw config get gateway.auth.token` の後、Control UI 設定に貼り付ける。                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共有トークンが Gateway 認証トークンと一致しなかった。                                                                                                                                               | `canRetryWithDeviceToken=true` の場合は、1 回の信頼済みリトライを許可する。キャッシュ済みトークンのリトライは保存済みの承認済みスコープを再利用する。明示的な `deviceToken` / `scopes` 呼び出し元は要求したスコープを維持する。それでも失敗する場合は、[トークンずれ復旧チェックリスト](/ja-JP/cli/devices#token-drift-recovery-checklist)を実行する。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | キャッシュ済みのデバイスごとのトークンが古い、または失効している。                                                                                                                                                 | [devices CLI](/ja-JP/cli/devices) を使ってデバイストークンをローテーション/再承認し、再接続する。                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | デバイストークンは有効だが、その承認済みロール/スコープがこの接続リクエストをカバーしていない。                                                                                                       | デバイスを再ペアリングするか、要求されたスコープ契約を承認する。これを共有トークンのずれとして扱わない。                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | デバイス ID に承認が必要。`error.details.reason` で `not-paired`、`scope-upgrade`、`role-upgrade`、または `metadata-upgrade` を確認し、存在する場合は `requestId` / `remediationHint` を使用する。 | 保留中のリクエストを承認する: `openclaw devices list` の後、`openclaw devices approve <requestId>`。スコープ/ロールのアップグレードも、要求されたアクセスを確認した後に同じフローを使用する。                                                                                                               |

<Note>
共有 Gateway トークン/パスワードで認証された直接のループバックバックエンド RPC は、CLI のペアリング済みデバイスのスコープベースラインに依存するべきではありません。サブエージェントやその他の内部呼び出しがまだ `scope-upgrade` で失敗する場合は、呼び出し元が `client.id: "gateway-client"` と `client.mode: "backend"` を使用しており、明示的な `deviceIdentity` またはデバイストークンを強制していないことを確認してください。
</Note>

デバイス認証 v2 移行チェック:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログに nonce/署名エラーが表示される場合は、接続元クライアントを更新して検証します。

<Steps>
  <Step title="Wait for connect.challenge">
    クライアントは Gateway が発行した `connect.challenge` を待つ。
  </Step>
  <Step title="Sign the payload">
    クライアントはチャレンジに紐づいたペイロードに署名する。
  </Step>
  <Step title="Send the device nonce">
    クライアントは同じチャレンジ nonce とともに `connect.params.device.nonce` を送信する。
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` が予期せず拒否される場合:

- ペアリング済みデバイストークンのセッションは、呼び出し元が `operator.admin` も持っていない限り、**自分自身の** デバイスのみ管理できる
- `openclaw devices rotate --scope ...` は、呼び出し元セッションがすでに保持している operator スコープのみ要求できる

関連:

- [設定](/ja-JP/gateway/configuration)（Gateway 認証モード）
- [Control UI](/ja-JP/web/control-ui)
- [デバイス](/ja-JP/cli/devices)
- [リモートアクセス](/ja-JP/gateway/remote)
- [信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)

## Gateway サービスが実行されていない

サービスはインストールされているが、プロセスが稼働し続けない場合に使用します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

確認すること:

- `Runtime: stopped` と終了ヒント。
- サービス設定の不一致（`Config (cli)` と `Config (service)`）。
- ポート/リスナー競合。
- `--deep` 使用時の追加の launchd/systemd/schtasks インストール。
- `Other gateway-like services detected (best effort)` のクリーンアップヒント。

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → ローカル Gateway モードが有効ではない、または設定ファイルが上書きされて `gateway.mode` が失われている。修正: 設定で `gateway.mode="local"` を設定するか、`openclaw onboard --mode local` / `openclaw setup` を再実行して期待されるローカルモード設定を再スタンプする。Podman 経由で OpenClaw を実行している場合、デフォルト設定パスは `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証経路（トークン/パスワード、または設定済みの場合は信頼済みプロキシ）なしで非ループバックにバインドしている。
    - `another gateway instance is already listening` / `EADDRINUSE` → ポート競合。
    - `Other gateway-like services detected (best effort)` → 古い、または並列の launchd/systemd/schtasks ユニットが存在する。ほとんどのセットアップでは、マシンごとに Gateway は 1 つにするべきです。複数必要な場合は、ポート + 設定/状態/ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。
    - doctor からの `System-level OpenClaw gateway service detected` → ユーザーレベルサービスがない一方で、systemd システムユニットが存在する。doctor にユーザーサービスをインストールさせる前に重複を削除または無効化するか、そのシステムユニットが意図したスーパーバイザーである場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定する。
    - `Gateway service port does not match current gateway config` → インストール済みスーパーバイザーがまだ古い `--port` を固定している。`openclaw doctor --fix` または `openclaw gateway install --force` を実行し、その後 Gateway サービスを再起動する。

  </Accordion>
</AccordionGroup>

関連:

- [バックグラウンド実行とプロセスツール](/ja-JP/gateway/background-process)
- [設定](/ja-JP/gateway/configuration)
- [Doctor](/ja-JP/gateway/doctor)

## macOS Gateway が黙って応答を停止し、ダッシュボードに触れると再開する

macOS ホスト上のチャネル（Telegram、WhatsApp など）が数分から数時間にわたって静かになり、Control UI を開く、SSH で入る、またはその他の方法でホストとやり取りした瞬間に Gateway が戻ってくるように見える場合に使用します。通常、`openclaw status` には明らかな症状はありません。確認する頃には Gateway が再び稼働しているためです。

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

確認する内容:

- `~/.openclaw/logs/stability/` にある 1 つ以上の `*-uncaught_exception.json` バンドルで、`error.code` が `ENETDOWN`、`ENETUNREACH`、`EHOSTUNREACH`、`ECONNREFUSED` などの一時的なネットワークコードに設定されている。
- `pmset -g log` の `Entering Sleep state due to 'Maintenance Sleep'` や `en0 driver is slow (msg: WillChangeState to 0)` のような行が、クラッシュ時刻と一致している。Power Nap / Maintenance Sleep は Wi-Fi ドライバーを短時間だけ状態 0 にする。その時間枠に入った送信 `connect()` は、それ以外では完全なネットワーク接続があるホストでも `ENETDOWN` で失敗することがある。
- `launchctl print` の出力で、`state = not running` と複数の直近 `runs` および終了コードが表示されている。特にクラッシュから次の起動までの間隔が数秒ではなく 1 時間程度の場合。macOS launchd はクラッシュの連続後に未文書化の再生成保護ゲートを適用し、対話ログイン、ダッシュボード接続、`launchctl kickstart` などの外部トリガーで再武装されるまで `KeepAlive=true` を尊重しなくなることがある。

よくあるシグネチャ:

- `error.code` が `ENETDOWN` または関連コードで、コールスタックが Node `net` の `lookupAndConnect` / `Socket.connect` を指している安定性バンドル。OpenClaw `2026.5.26` 以降はこれらを無害な一時的ネットワークエラーとして分類するため、トップレベルの未捕捉ハンドラーに伝播しなくなる。古いリリースを使っている場合は、まずアップグレードする。
- Control UI に接続した瞬間、またはホストに SSH した瞬間に終わる長い無音期間: 再武装されるのは launchd の再生成ゲートであり、ダッシュボードが Gateway に対して何かを行っているわけではない。
- 1 日を通して `runs` 数が増えているが、`~/Library/Logs/openclaw/gateway.log` に対応する `received SIG*; shutting down` 行がない: クリーンシャットダウンではシグナルがログに出る。一時的なクラッシュでは出ない。

対処方法:

1. `2026.5.26` より前のリリースを実行している場合は、**Gateway をアップグレード**する。アップグレード後、今後の `ENETDOWN` エラーはプロセスを終了する代わりに警告としてログに記録される。
2. 常時稼働サーバーとして動かす想定の Mac mini / デスクトップホストでは、**メンテナンススリープの動作を減らす**:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   これにより、根本にあるドライバーの揺らぎは大幅に減るが、完全にはなくならない。これらのフラグに関係なく、システムは TCP keepalive や mDNS 維持のために一部のメンテナンススリープを引き続き実行できる。

3. launchd によって保留された将来のクラッシュ連続をすばやく検知できるように、**ライブネスウォッチドッグを追加**する:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   目的は、再生成ゲートを外部から再武装することにある。macOS では、クラッシュの連続後に `KeepAlive=true` だけでは十分ではない。

関連:

- [macOS プラットフォームノート](/ja-JP/platforms/macos)
- [ログ記録](/ja-JP/logging)
- [診断](/ja-JP/gateway/doctor)

## 高メモリ使用時に Gateway が終了する

負荷中に Gateway が消える、スーパーバイザーが OOM 風の再起動を報告する、またはログに `critical memory pressure bundle written` が出る場合に使う。

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

確認する内容:

- 最新の安定性バンドルにある `Reason: diagnostic.memory.pressure.critical`。
- `critical/rss_threshold`、`critical/heap_threshold`、`critical/rss_growth` を伴う `Memory pressure:`。
- ヒープ上限に近い `V8 heap:` の値。
- `agents/<agent>/sessions/<session>.jsonl` や `sessions/<session>.jsonl` などの `Largest session files:` エントリ。
- Gateway がコンテナまたはメモリ制限付きサービス内で動作している場合の Linux cgroup メモリカウンター。

よくあるシグネチャ:

- 再起動の少し前に `critical memory pressure bundle written` が出る → OpenClaw が OOM 前の安定性バンドルを取得した。`openclaw gateway stability --bundle latest` で調べる。
- Gateway ログに `memory pressure: level=critical ... memoryPressureSnapshot=disabled` が出る → OpenClaw は重大なメモリ圧迫を検知したが、OOM 前の安定性スナップショットはオフになっている。
- `Largest session files:` が非常に大きい編集済みトランスクリプトパスを指している → 再起動前に、保持するセッション履歴を減らす、セッションの増加を調べる、または古いトランスクリプトをアクティブストアの外へ移動する。
- `V8 heap:` の使用済みバイトがヒープ上限に近い → プロンプト/セッション負荷を下げる、同時作業を減らす、またはそのワークロードが想定内であることを確認してから Node のヒープ上限を上げる。
- `Memory pressure: critical/rss_growth` → 1 回のサンプリング時間枠内でメモリが急増した。最新ログで、大きなインポート、暴走したツール出力、繰り返しリトライ、またはキューに入ったエージェント作業のバッチを確認する。
- ログに重大なメモリ圧迫が出ているがバンドルが存在しない → これはデフォルト。今後の重大なメモリ圧迫イベントで OOM 前の安定性バンドルを取得するには、`diagnostics.memoryPressureSnapshot: true` を設定する。

安定性バンドルにペイロードは含まれない。含まれるのは運用上のメモリ証拠と編集済みの相対ファイルパスであり、メッセージ本文、Webhook 本文、認証情報、トークン、Cookie、生のセッション ID は含まれない。バグ報告には生ログをコピーする代わりに、診断エクスポートを添付する。

関連:

- [Gateway ヘルス](/ja-JP/gateway/health)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [セッション](/ja-JP/cli/sessions)

## Gateway が無効な設定を拒否した

Gateway の起動が `Invalid config` で失敗する、またはホットリロードログに
無効な編集をスキップしたと出る場合に使う。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

確認する内容:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- アクティブな設定の横にある、タイムスタンプ付きの `openclaw.json.rejected.*` ファイル
- `doctor --fix` が壊れた直接編集を修復した場合の、タイムスタンプ付きの `openclaw.json.clobbered.*` ファイル
- OpenClaw は各設定パスについて最新 32 個の `.clobbered.*` ファイルを保持し、古いものをローテーションする

<AccordionGroup>
  <Accordion title="起きたこと">
    - 起動中、ホットリロード中、または OpenClaw が所有する書き込み中に設定が検証を通らなかった。
    - Gateway の起動は `openclaw.json` を書き換える代わりにフェイルクローズする。
    - ホットリロードは無効な外部編集をスキップし、現在のランタイム設定をアクティブのままにする。
    - OpenClaw が所有する書き込みは、コミット前に無効/破壊的なペイロードを拒否し、`.rejected.*` を保存する。
    - 修復は `openclaw doctor --fix` が所有する。拒否されたペイロードを `.clobbered.*` として保持しながら、JSON ではないプレフィックスを削除したり、最後に正常だったコピーを復元したりできる。
    - 1 つの設定パスで多数の修復が発生した場合、OpenClaw は古い `.clobbered.*` ファイルをローテーションし、最新の修復済みペイロードを引き続き利用可能にする。

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
  <Accordion title="よくあるシグネチャ">
    - `.clobbered.*` が存在する → doctor はアクティブ設定を修復しながら、壊れた外部編集を保持した。
    - `.rejected.*` が存在する → OpenClaw が所有する設定書き込みが、コミット前にスキーマまたは上書きチェックで失敗した。
    - `Config write rejected:` → 書き込みが必須の形を落とす、ファイルを急激に縮小する、または無効な設定を永続化しようとした。
    - `config reload skipped (invalid config):` → 直接編集が検証に失敗し、実行中の Gateway に無視された。
    - `Invalid config at ...` → Gateway サービスが起動する前に起動が失敗した。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good`、または `size-drop-vs-last-good:*` → OpenClaw が所有する書き込みが、最後に正常だったバックアップと比べてフィールドまたはサイズを失ったため拒否された。
    - `Config last-known-good promotion skipped` → 候補に `***` などの編集済みシークレットプレースホルダーが含まれていた。

  </Accordion>
  <Accordion title="修正オプション">
    1. `openclaw doctor --fix` を実行し、doctor にプレフィックス付き/上書きされた設定を修復させるか、最後に正常だった状態を復元させる。
    2. `.clobbered.*` または `.rejected.*` から意図したキーだけをコピーし、`openclaw config set` または `config.patch` で適用する。
    3. 再起動前に `openclaw config validate` を実行する。
    4. 手作業で編集する場合は、変更したかった部分オブジェクトだけではなく、完全な JSON5 設定を保持する。
  </Accordion>
</AccordionGroup>

関連:

- [設定](/ja-JP/cli/config)
- [設定: ホットリロード](/ja-JP/gateway/configuration#config-hot-reload)
- [設定: 厳密な検証](/ja-JP/gateway/configuration#strict-validation)
- [診断](/ja-JP/gateway/doctor)

## Gateway プローブ警告

`openclaw gateway probe` が何かに到達するが、それでも警告ブロックを表示する場合に使う。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認する内容:

- JSON 出力の `warnings[].code` と `primaryTargetId`。
- 警告が SSH フォールバック、複数 Gateway、欠落スコープ、または未解決の認証参照に関するものか。

よくあるシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH セットアップは失敗したが、コマンドは設定済み/ループバックの直接ターゲットを引き続き試した。
- `multiple reachable gateway identities detected` → 別々の Gateway が応答した、または OpenClaw が到達可能なターゲットが同じ Gateway であると証明できなかった。同じ Gateway への SSH トンネル、プロキシ URL、または設定済みリモート URL は、トランスポートポートが異なる場合でも、複数トランスポートを持つ 1 つの Gateway として扱われる。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続は成功したが、詳細 RPC はスコープで制限されている。デバイス ID をペアリングするか、`operator.read` を持つ認証情報を使う。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 接続は成功したが、完全な診断 RPC セットがタイムアウトまたは失敗した。診断が劣化した到達可能な Gateway として扱い、`--json` 出力の `connect.ok` と `connect.rpcOk` を比較する。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → Gateway は応答したが、このクライアントは通常のオペレーターアクセスの前にまだペアリング/承認が必要。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef 警告テキスト → 失敗したターゲットについて、このコマンドパスで認証素材を利用できなかった。

関連:

- [Gateway](/ja-JP/cli/gateway)
- [同じホスト上の複数 Gateway](/ja-JP/gateway#multiple-gateways-same-host)
- [リモートアクセス](/ja-JP/gateway/remote)

## チャンネルは接続済みだが、メッセージが流れない

チャンネル状態が接続済みなのにメッセージフローが停止している場合は、ポリシー、権限、チャンネル固有の配信ルールに注目する。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認する内容:

- DM ポリシー (`pairing`、`allowlist`、`open`、`disabled`)。
- グループ allowlist とメンション要件。
- 欠落しているチャンネル API 権限/スコープ。

よくあるシグネチャ:

- `mention required` → グループメンションポリシーによりメッセージが無視された。
- `pairing` / 保留中の承認トレース → 送信者が承認されていない。
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

- Cron が有効で、次回ウェイクが存在する。
- ジョブ実行履歴のステータス (`ok`, `skipped`, `error`)。
- Heartbeat のスキップ理由 (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)。

<AccordionGroup>
  <Accordion title="一般的なシグネチャ">
    - `cron: scheduler disabled; jobs will not run automatically` → cron が無効。
    - `cron: timer tick failed` → スケジューラの tick が失敗した。ファイル、ログ、ランタイムエラーを確認する。
    - `heartbeat skipped` with `reason=quiet-hours` → アクティブ時間帯の範囲外。
    - `heartbeat skipped` with `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在するが、空白、コメント、ヘッダー、フェンス、または空のチェックリストのひな形だけを含むため、OpenClaw はモデル呼び出しをスキップする。
    - `heartbeat skipped` with `reason=no-tasks-due` → `HEARTBEAT.md` には `tasks:` ブロックがあるが、この tick で期限を迎えるタスクがない。
    - `heartbeat: unknown accountId` → Heartbeat 配信ターゲットのアカウント ID が無効。
    - `heartbeat skipped` with `reason=dm-blocked` → `agents.defaults.heartbeat.directPolicy` (またはエージェントごとのオーバーライド) が `block` に設定されている状態で、Heartbeat ターゲットが DM 形式の宛先に解決された。

  </Accordion>
</AccordionGroup>

関連:

- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュール済みタスク](/ja-JP/automation/cron-jobs)
- [スケジュール済みタスク: トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting)

## Node はペアリング済みだが、ツールが失敗する

ノードがペアリング済みでもツールが失敗する場合は、フォアグラウンド、権限、承認状態を切り分ける。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認する項目:

- ノードがオンラインで、期待される機能を持っている。
- カメラ、マイク、位置情報、画面に対する OS 権限付与。
- Exec 承認と許可リストの状態。

一般的なシグネチャ:

- `NODE_BACKGROUND_UNAVAILABLE` → ノードアプリをフォアグラウンドにする必要がある。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 権限が不足している。
- `SYSTEM_RUN_DENIED: approval required` → exec 承認が保留中。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが許可リストによってブロックされた。

関連:

- [Exec 承認](/ja-JP/tools/exec-approvals)
- [Node トラブルシューティング](/ja-JP/nodes/troubleshooting)
- [Node](/ja-JP/nodes/index)

## ブラウザツールが失敗する

Gateway 自体は正常でもブラウザツールのアクションが失敗する場合に使用する。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認する項目:

- `plugins.allow` が設定されていて、`browser` が含まれているか。
- 有効なブラウザ実行ファイルパス。
- CDP プロファイルへの到達性。
- `existing-session` / `user` プロファイル用のローカル Chrome の可用性。

<AccordionGroup>
  <Accordion title="Plugin / 実行ファイルのシグネチャ">
    - `unknown command "browser"` or `unknown command 'browser'` → バンドル済みブラウザ Plugin が `plugins.allow` によって除外されている。
    - browser tool missing / unavailable while `browser.enabled=true` → `plugins.allow` が `browser` を除外しているため、Plugin が読み込まれていない。
    - `Failed to start Chrome CDP on port` → ブラウザプロセスの起動に失敗した。
    - `browser.executablePath not found` → 設定されたパスが無効。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定された CDP URL が `file:` や `ftp:` などのサポート対象外スキームを使用している。
    - `browser.cdpUrl has invalid port` → 設定された CDP URL のポートが不正、または範囲外。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在の Gateway インストールにはコアブラウザランタイム依存関係がない。OpenClaw を再インストールまたは更新してから、Gateway を再起動する。ARIA スナップショットと基本的なページスクリーンショットは引き続き動作する場合があるが、ナビゲーション、AI スナップショット、CSS セレクタ要素のスクリーンショット、PDF エクスポートは利用できないままになる。

  </Accordion>
  <Accordion title="Chrome MCP / 既存セッションのシグネチャ">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP の既存セッションが、選択されたブラウザデータディレクトリにまだアタッチできなかった。ブラウザの inspect ページを開き、リモートデバッグを有効にし、ブラウザを開いたままにして、最初のアタッチプロンプトを承認してから再試行する。サインイン状態が不要な場合は、管理対象の `openclaw` プロファイルを優先する。
    - `No Chrome tabs found for profile="user"` → Chrome MCP アタッチプロファイルに、開いているローカル Chrome タブがない。
    - `Remote CDP for profile "<name>" is not reachable` → 設定されたリモート CDP エンドポイントに Gateway ホストから到達できない。
    - `Browser attachOnly is enabled ... not reachable` or `Browser attachOnly is enabled and CDP websocket ... is not reachable` → アタッチ専用プロファイルに到達可能なターゲットがない、または HTTP エンドポイントは応答したが CDP WebSocket を開けなかった。

  </Accordion>
  <Accordion title="要素 / スクリーンショット / アップロードのシグネチャ">
    - `fullPage is not supported for element screenshots` → スクリーンショット要求で `--full-page` と `--ref` または `--element` が混在している。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` のスクリーンショット呼び出しでは、CSS `--element` ではなく、ページキャプチャまたはスナップショットの `--ref` を使用する必要がある。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP アップロードフックでは、CSS セレクタではなくスナップショット ref が必要。
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP プロファイルでは、1 回の呼び出しにつき 1 つのアップロードを送信する。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP プロファイルのダイアログフックは、タイムアウトのオーバーライドをサポートしない。
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP 既存セッションプロファイルで `act:type` に `timeoutMs` を指定しない。カスタムタイムアウトが必要な場合は、管理対象または CDP ブラウザプロファイルを使用する。
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP 既存セッションプロファイルで `act:evaluate` に `timeoutMs` を指定しない。カスタムタイムアウトが必要な場合は、管理対象または CDP ブラウザプロファイルを使用する。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` には引き続き管理対象ブラウザまたは raw CDP プロファイルが必要。
    - stale viewport / dark-mode / locale / offline overrides on attach-only or remote CDP profiles → Gateway 全体を再起動せずにアクティブな制御セッションを閉じ、Playwright/CDP エミュレーション状態を解放するには、`openclaw browser stop --browser-profile <name>` を実行する。

  </Accordion>
</AccordionGroup>

関連:

- [ブラウザ (OpenClaw 管理)](/ja-JP/tools/browser)
- [ブラウザのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)

## アップグレード後に突然何かが壊れた場合

アップグレード後の破損の多くは、設定のドリフト、またはより厳格なデフォルトが適用されるようになったことが原因。

<AccordionGroup>
  <Accordion title="1. 認証と URL オーバーライドの動作が変更された">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    確認する内容:

    - `gateway.mode=remote` の場合、ローカルサービスは正常でも CLI 呼び出しがリモートをターゲットにしている可能性がある。
    - 明示的な `--url` 呼び出しは、保存済み認証情報へフォールバックしない。

    一般的なシグネチャ:

    - `gateway connect failed:` → URL ターゲットが間違っている。
    - `unauthorized` → エンドポイントには到達できるが、認証が間違っている。

  </Accordion>
  <Accordion title="2. バインドと認証のガードレールがより厳格になった">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    確認する内容:

    - 非ループバックバインド (`lan`, `tailnet`, `custom`) には、有効な Gateway 認証パスが必要: 共有トークン/パスワード認証、または正しく設定された非ループバックの `trusted-proxy` デプロイ。
    - `gateway.token` のような古いキーは `gateway.auth.token` を置き換えない。

    一般的なシグネチャ:

    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証パスなしの非ループバックバインド。
    - `Connectivity probe: failed` while runtime is running → Gateway は稼働しているが、現在の auth/url ではアクセスできない。

  </Accordion>
  <Accordion title="3. ペアリングとデバイス ID 状態が変更された">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    確認する内容:

    - ダッシュボード/ノードの保留中デバイス承認。
    - ポリシーまたは ID 変更後の保留中 DM ペアリング承認。

    一般的なシグネチャ:

    - `device identity required` → デバイス認証が満たされていない。
    - `pairing required` → 送信者/デバイスを承認する必要がある。

  </Accordion>
</AccordionGroup>

確認後もサービス設定とランタイムが一致しない場合は、同じプロファイル/状態ディレクトリからサービスメタデータを再インストールする:

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
