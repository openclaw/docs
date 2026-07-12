---
read_when:
    - トラブルシューティングハブから、より詳しい診断のためにこのページへ案内されました
    - 正確なコマンドを含む、症状別の安定したランブックセクションが必要です
sidebarTitle: Troubleshooting
summary: Gateway、チャネル、自動化、Node、ブラウザの詳細なトラブルシューティング手順書
title: トラブルシューティング
x-i18n:
    generated_at: "2026-07-12T14:31:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

これは詳細なランブックです。まず [/help/troubleshooting](/ja-JP/help/troubleshooting) の迅速なトリアージフローから開始してください。

## コマンドの実行順序

次の順序で実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常性を示すシグナル：

- `openclaw gateway status` に `Runtime: running`、`Connectivity probe: ok`、および `Capability: ...` 行が表示される。
- `openclaw doctor` で、処理を妨げる設定やサービスの問題が報告されない。
- `openclaw channels status --probe` にアカウントごとの現在のトランスポート状態が表示され、対応している場合は `works` または `audit ok` が表示される。

## 更新後

更新が完了したものの、Gateway が停止している、チャネルが空である、またはモデル呼び出しが 401 で失敗する場合に使用します。

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

確認項目：

- `openclaw status` / `openclaw status --all` の `Update restart`。保留中または失敗した引き継ぎには、次に実行するコマンドが含まれます。
- Channels の `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`：チャネル設定はまだ存在しますが、チャネルを読み込む前に Plugin の登録が失敗しています。
- 再認証後のプロバイダー 401：`openclaw doctor --fix` は、エージェントごとに残っている古い OAuth 認証のシャドウコピーを確認して削除し、すべてのエージェントが現在の共有プロファイルを解決できるようにします。

## 分断されたインストールと新しい設定の保護

更新後に Gateway サービスが予期せず停止した場合、またはログで、ある `openclaw` バイナリが最後に `openclaw.json` を書き込んだバージョンより古いことが示される場合に使用します。

OpenClaw は設定の書き込み時に `meta.lastTouchedVersion` を記録します。読み取り専用コマンドは新しい OpenClaw が書き込んだ設定を検査できますが、古いバイナリからのプロセスおよびサービスの変更操作は実行を拒否されます。ブロックされる操作：Gateway サービスの開始、停止、再起動、アンインストール、サービスの強制再インストール、サービスモードでの Gateway 起動、および `gateway --force` によるポートのクリーンアップ。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH を修正する">
    `openclaw` が新しいインストールを解決するように `PATH` を修正し、操作を再実行します。
  </Step>
  <Step title="Gateway サービスを再インストールする">
    新しいインストールから、意図した Gateway サービスを再インストールします。

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="古いラッパーを削除する">
    古い `openclaw` バイナリを参照し続けている、古いシステムパッケージまたはラッパーのエントリを削除します。
  </Step>
</Steps>

<Warning>
意図的なダウングレードまたは緊急復旧の場合に限り、単一のコマンドに対して `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` を設定します。通常運用では設定しないでください。
</Warning>

## ロールバック後のプロトコル不一致

ダウングレードまたはロールバック後、ログに `protocol mismatch` が繰り返し出力される場合に使用します。古い Gateway が動作していますが、新しいローカルクライアントプロセスが、古い Gateway が対応できないプロトコル範囲を使って再接続し続けています。

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

確認項目：

- Gateway ログの `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`。
- `openclaw gateway status --deep` の `Established clients:` または `openclaw doctor --deep` の `Gateway clients`：Gateway ポートに接続しているアクティブな TCP クライアント。OS が許可する場合は PID とコマンドラインも表示されます。
- コマンドラインが、ロールバック元の新しい OpenClaw インストールまたはラッパーを指しているクライアントプロセス。

修正方法：

1. `gateway status --deep` に表示された古い OpenClaw クライアントプロセスを停止または再起動します。
2. OpenClaw を組み込んでいるアプリまたはラッパーを再起動します。たとえば、ローカルダッシュボード、エディター、アプリサーバーヘルパー、長時間実行中の `openclaw logs --follow` シェルなどです。
3. `openclaw gateway status --deep` または `openclaw doctor --deep` を再実行し、古いクライアント PID がなくなったことを確認します。

古い Gateway が、互換性のない新しいプロトコルを受け入れるように変更しないでください。プロトコルのバージョン更新は通信規約を保護します。ロールバックからの復旧は、プロセスとバージョンのクリーンアップの問題です。

## パス脱出としてスキップされた Skill シンボリックリンク

ログに次の内容が含まれる場合に使用します。

```text
設定されたルート外へ脱出する Skill パスをスキップしています：... reason=symlink-escape
```

各 Skill ルートは封じ込め境界です。`~/.agents/skills`、`<workspace>/.agents/skills`、`<workspace>/skills`、または `~/.openclaw/skills` 配下のシンボリックリンクは、その実際のリンク先がルート外に解決される場合、リンク先が明示的に信頼されていない限りスキップされます。

リンクを調査します。

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

リンク先が意図したものである場合は、直接の Skill ルートと許可するシンボリックリンク先の両方を設定します。

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

その後、新しいセッションを開始するか、Skills ウォッチャーが更新されるまで待ちます。実行中のプロセスが設定変更より前に起動されている場合は、Gateway を再起動します。

`~`、`/`、同期対象プロジェクトフォルダー全体など、広範なリンク先を使用しないでください。`allowSymlinkTargets` の範囲は、信頼された `SKILL.md` ディレクトリを含む実際の Skill ルートに限定してください。

Skill Workshop の適用時に、信頼されたシンボリックリンク先のワークスペース Skill パスにも書き込む必要がある場合は、`skills.workshop.allowSymlinkTargetWrites` を有効にします。読み取り専用の共有 Skill ルートでは無効のままにしてください。

関連項目：

- [Skills の設定](/ja-JP/tools/skills-config#symlinked-skill-roots)
- [設定例](/ja-JP/gateway/configuration-examples#symlinked-sibling-skill-repo)

## 長いコンテキストに追加利用枠が必要な Anthropic 429

ログまたはエラーに `HTTP 429: rate_limit_error: Extra usage is required for long context requests` が含まれる場合に使用します。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認項目：

- 選択した Anthropic モデルが一般提供されている 1M 対応の Claude 4.x モデル（Opus 4.6/4.7/4.8、Sonnet 4.6）であるか、モデル設定に従来の `params.context1m: true` がまだ残っている。
- 現在の Anthropic 認証情報が長いコンテキストの利用対象ではない。
- 1M コンテキスト経路を必要とする長いセッションまたはモデル実行でのみリクエストが失敗する。

修正オプション：

<Steps>
  <Step title="標準コンテキストウィンドウを使用する">
    標準ウィンドウのモデルに切り替えるか、1M コンテキストが一般提供されていない古い
    モデル設定から従来の `context1m` を削除します。
  </Step>
  <Step title="対象となる認証情報を使用する">
    長いコンテキストのリクエストを利用できる Anthropic 認証情報を使用するか、Anthropic API キーに切り替えます。
  </Step>
  <Step title="フォールバックモデルを設定する">
    Anthropic の長いコンテキストのリクエストが拒否された場合も実行を継続できるよう、フォールバックモデルを設定します。
  </Step>
</Steps>

関連項目：

- [Anthropic](/ja-JP/providers/anthropic)
- [トークンの使用量とコスト](/ja-JP/reference/token-use)
- [Anthropic から HTTP 429 が返されるのはなぜですか？](/ja-JP/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## アップストリームからの 403 ブロック応答

アップストリームの LLM プロバイダーから `Your request was blocked` などの一般的な `403` が返される場合に使用します。

これが常に OpenClaw の設定上の問題だと仮定しないでください。この応答は、OpenAI 互換エンドポイントの前段にある CDN、WAF、ボット管理ルール、リバースプロキシなど、アップストリームのセキュリティレイヤーから返される場合があります。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

確認項目：

- 同じプロバイダーの複数のモデルが同様に失敗する。
- 通常のプロバイダー API エラーではなく、HTML または一般的なセキュリティメッセージが返される。
- 同じリクエスト時刻に対応するプロバイダー側のセキュリティイベントがある。
- 小さな直接 `curl` プローブは成功する一方で、通常の SDK 形式のリクエストは失敗する。

WAF/CDN によるブロックを示す証拠がある場合は、まずプロバイダー側のフィルタリングを修正します。OpenClaw が使用する API パスに限定した許可ルールまたはスキップルールを使用し、サイト全体の保護を無効にしないでください。

<Warning>
最小限の `curl` が成功しても、実際の SDK 形式のリクエストが同じアップストリームのセキュリティレイヤーを通過できるとは限りません。
</Warning>

関連項目：

- [OpenAI 互換エンドポイント](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)
- [プロバイダー設定](/ja-JP/providers)
- [ログ](/ja-JP/logging)

## ローカルの OpenAI 互換バックエンドへの直接プローブは成功するが、エージェント実行は失敗する

次の場合に使用します。

- `curl ... /v1/models` が動作する。
- 小さな直接 `/v1/chat/completions` 呼び出しが動作する。
- OpenClaw のモデル実行が通常のエージェントターンでのみ失敗する。

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

確認項目：

- 小さな直接呼び出しは成功するが、OpenClaw の実行は大きなプロンプトでのみ失敗する。
- 同じプレフィックスなしのモデル ID を使った直接 `/v1/chat/completions` は動作するにもかかわらず、`model_not_found` または 404 エラーが発生する。
- `messages[].content` に文字列を要求するバックエンドエラー。
- OpenAI 互換ローカルバックエンドで断続的に発生する `incomplete turn detected ... stopReason=stop payloads=0` 警告。
- 大きなプロンプトトークン数または完全なエージェントランタイムプロンプトでのみ発生するバックエンドのクラッシュ。

<AccordionGroup>
  <Accordion title="一般的な兆候">
    - ローカルの MLX/vLLM 形式サーバーでの `model_not_found`：`baseUrl` に `/v1` が含まれ、`/v1/chat/completions` バックエンドでは `api` が `"openai-completions"` であり、`models.providers.<provider>.models[].id` がプロバイダー内でのプレフィックスなしの ID であることを確認します。選択時にプロバイダーのプレフィックスを一度だけ付けます。たとえば `mlx/mlx-community/Qwen3-30B-A3B-6bit` とし、カタログエントリは `mlx-community/Qwen3-30B-A3B-6bit` のままにします。
    - `messages[...].content: invalid type: sequence, expected a string`：バックエンドが構造化された Chat Completions の content パーツを拒否しています。修正：`models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
    - `validation.keys`、または `["role","content"]` のような許可されるメッセージキー：バックエンドが Chat Completions メッセージ内の OpenAI 形式のリプレイメタデータを拒否しています。修正：`models.providers.<provider>.models[].compat.strictMessageKeys: true` を設定します。
    - `incomplete turn detected ... stopReason=stop payloads=0`：バックエンドは Chat Completions リクエストを完了しましたが、そのターンでユーザーに表示するアシスタントテキストを返しませんでした。OpenClaw は、リプレイしても安全な空の OpenAI 互換ターンを一度再試行します。失敗が続く場合、通常はバックエンドが空またはテキスト以外のコンテンツを出力しているか、最終回答のテキストを抑制しています。
    - 小さな直接リクエストは成功するが、OpenClaw のエージェント実行ではバックエンドまたはモデルがクラッシュする場合（たとえば、一部の `inferrs` ビルド上の Gemma）：OpenClaw のトランスポートはすでに正しい可能性が高く、より大きなエージェントランタイムプロンプト形式でバックエンドが失敗しています。
    - ツールを無効にすると失敗が減るものの解消しない場合：ツールスキーマも負荷の一部でしたが、残る問題は依然としてアップストリームのモデルやサーバーの容量、またはバックエンドのバグです。

  </Accordion>
  <Accordion title="修正オプション">
    1. 文字列のみを受け付ける Chat Completions バックエンドには `compat.requiresStringContent: true` を設定します。
    2. 各メッセージで `role` と `content` のみを受け付ける厳格な Chat Completions バックエンドには `compat.strictMessageKeys: true` を設定します。
    3. OpenClaw のツールスキーマ群を安定して処理できないモデルやバックエンドには `compat.supportsTools: false` を設定します。
    4. 可能な範囲でプロンプト負荷を下げます。ワークスペースのブートストラップを小さくする、セッション履歴を短くする、より軽量なローカルモデルを使用する、または長いコンテキストへの対応がより強力なバックエンドを使用します。
    5. 小さな直接リクエストが成功し続ける一方で、OpenClaw のエージェントターンがバックエンド内で引き続きクラッシュする場合は、アップストリームのサーバーまたはモデルの制限として扱い、受け入れられたペイロード形式を添えてアップストリームに再現報告を提出します。
  </Accordion>
</AccordionGroup>

関連項目：

- [設定](/ja-JP/gateway/configuration)
- [ローカルモデル](/ja-JP/gateway/local-models)
- [OpenAI 互換エンドポイント](/ja-JP/gateway/configuration-reference#openai-compatible-endpoints)

## 応答がない

チャネルが稼働しているのに何も応答しない場合は、何かを再接続する前にルーティングとポリシーを確認してください。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認事項:

- DM 送信者のペアリングが保留中になっている。
- グループのメンション制限（`requireMention`、`mentionPatterns`）。
- チャンネル/グループの許可リストの不一致。

一般的なシグネチャ:

- `drop guild message (mention required` → メンションされるまでグループメッセージは無視されます。
- `pairing request` → 送信者の承認が必要です。
- `blocked` / `allowlist` → 送信者/チャンネルがポリシーによって除外されました。

関連項目:

- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [グループ](/ja-JP/channels/groups)
- [ペアリング](/ja-JP/channels/pairing)

## ダッシュボードのコントロール UI 接続

ダッシュボード/コントロール UI に接続できない場合は、URL、認証モード、およびセキュアコンテキストに関する前提を検証します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認事項:

- プローブ URL とダッシュボード URL が正しい。
- クライアントと Gateway の間で認証モード/トークンが一致していない。
- デバイス ID が必要な場所で HTTP を使用している。

更新後にローカルブラウザから `127.0.0.1:18789` に接続できない場合は、まずローカルの Gateway サービスを復旧し、ダッシュボードが配信されていることを確認します。

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

`curl` が OpenClaw の HTML を返す場合、Gateway は動作しており、残っている問題はブラウザキャッシュ、古いディープリンク、または古いタブの状態である可能性があります。`http://127.0.0.1:18789` を直接開き、ダッシュボードから移動してください。再起動後もサービスが稼働し続けない場合は、`openclaw gateway start` を実行し、`openclaw gateway status` を再確認します。

<AccordionGroup>
  <Accordion title="接続/認証のシグネチャ">
    - `device identity required` → セキュアでないコンテキスト、またはデバイス認証がありません。
    - `origin not allowed` → ブラウザの `Origin` が `gateway.controlUi.allowedOrigins` に含まれていません（または、明示的な許可リストなしで非ループバックのブラウザオリジンから接続しています）。
    - `device nonce required` / `device nonce mismatch` → クライアントがチャレンジベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していません。
    - `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったペイロード（または古いタイムスタンプ）に署名しました。
    - `AUTH_TOKEN_MISMATCH` と `canRetryWithDeviceToken=true` → クライアントは、キャッシュ済みデバイストークンを使用して信頼済みの再試行を 1 回実行できます。
    - そのキャッシュ済みトークンによる再試行では、ペアリングされたデバイストークンとともに保存されているキャッシュ済みスコープセットが再利用されます。明示的な `deviceToken` / `scopes` の呼び出し元では、代わりに要求したスコープセットが維持されます。
    - `AUTH_SCOPE_MISMATCH` → デバイストークンは認識されましたが、承認済みスコープがこの接続要求をカバーしていません。共有 Gateway トークンをローテーションするのではなく、再ペアリングするか、要求されたスコープ契約を承認してください。
    - この再試行パス以外では、接続認証の優先順位は、明示的な共有トークン/パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
    - 非同期の Tailscale Serve コントロール UI パスでは、同じ `{scope, ip}` に対する失敗した試行は、リミッターが失敗を記録する前に直列化されます。そのため、同じクライアントから不正な再試行を 2 回同時に行うと、単純な不一致が 2 回表示される代わりに、2 回目の試行で `retry later` が表示される場合があります。
    - ブラウザオリジンのループバッククライアントからの `too many failed authentication attempts (retry later)` → 同じ正規化済み `Origin` からの失敗が繰り返されたため、一時的にロックアウトされています。別の localhost オリジンでは別のバケットが使用されます。
    - その再試行後も `unauthorized` が繰り返される → 共有トークン/デバイストークンにずれがあります。トークン設定を更新し、必要に応じてデバイストークンを再承認またはローテーションしてください。
    - `gateway connect failed:` → ホスト/ポート/URL の接続先が誤っています。

  </Accordion>
</AccordionGroup>

### 認証詳細コードのクイックマップ

失敗した `connect` 応答の `error.details.code` を使用して、次の操作を選択します。

| 詳細コード                   | 意味                                                                                                                                                                                                         | 推奨される操作                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | クライアントが必須の共有トークンを送信しませんでした。                                                                                                                                                       | クライアントにトークンを貼り付けるか設定して、再試行します。ダッシュボードパスの場合: `openclaw config get gateway.auth.token` を実行し、コントロール UI の設定に貼り付けます。                                                                                                                                                                  |
| `AUTH_TOKEN_MISMATCH`        | 共有トークンが Gateway の認証トークンと一致しませんでした。                                                                                                                                                  | `canRetryWithDeviceToken=true` の場合は、信頼済みの再試行を 1 回許可します。キャッシュ済みトークンによる再試行では、保存済みの承認済みスコープが再利用されます。明示的な `deviceToken` / `scopes` の呼び出し元では、要求したスコープが維持されます。それでも失敗する場合は、[トークンのずれの復旧チェックリスト](/ja-JP/cli/devices#token-drift-recovery-checklist)を実行してください。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | キャッシュ済みのデバイスごとのトークンが古いか、取り消されています。                                                                                                                                         | [デバイス CLI](/ja-JP/cli/devices) を使用してデバイストークンをローテーションまたは再承認し、再接続します。                                                                                                                                                                                                                                           |
| `AUTH_SCOPE_MISMATCH`        | デバイストークンは有効ですが、承認済みのロール/スコープがこの接続要求をカバーしていません。                                                                                                                  | デバイスを再ペアリングするか、要求されたスコープ契約を承認してください。これを共有トークンのずれとして扱わないでください。                                                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | デバイス ID の承認が必要です。`error.details.reason` で `not-paired`、`scope-upgrade`、`role-upgrade`、または `metadata-upgrade` を確認し、存在する場合は `requestId` / `remediationHint` を使用してください。 | 保留中の要求を承認します: `openclaw devices list`、続けて `openclaw devices approve <requestId>`。スコープ/ロールのアップグレードでも、要求されたアクセスを確認した後に同じフローを使用します。                                                                                                                                                   |

<Note>
共有 Gateway トークン/パスワードで認証された直接のループバックバックエンド RPC は、CLI のペアリング済みデバイスのスコープベースラインに依存すべきではありません。サブエージェントやその他の内部呼び出しが引き続き `scope-upgrade` で失敗する場合は、呼び出し元が `client.id: "gateway-client"` と `client.mode: "backend"` を使用しており、明示的な `deviceIdentity` またはデバイストークンを強制していないことを確認してください。
</Note>

デバイス認証 v2 の移行確認:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログに nonce/署名エラーが表示される場合は、接続クライアントを更新し、次のように検証します。

<Steps>
  <Step title="connect.challenge を待機">
    クライアントは、Gateway が発行する `connect.challenge` を待機します。
  </Step>
  <Step title="ペイロードに署名">
    クライアントは、チャレンジに紐付けられたペイロードに署名します。
  </Step>
  <Step title="デバイス nonce を送信">
    クライアントは、同じチャレンジ nonce とともに `connect.params.device.nonce` を送信します。
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` が予期せず拒否される場合:

- ペアリング済みデバイストークンのセッションは、呼び出し元が `operator.admin` も持っていない限り、**自身の**デバイスのみを管理できます。
- `openclaw devices rotate --scope ...` で要求できるのは、呼び出し元のセッションがすでに保持しているオペレータースコープのみです。

関連項目:

- [設定](/ja-JP/gateway/configuration)（Gateway の認証モード）
- [コントロール UI](/ja-JP/web/control-ui)
- [デバイス](/ja-JP/cli/devices)
- [リモートアクセス](/ja-JP/gateway/remote)
- [信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)

## Gateway サービスが実行されていない

サービスはインストールされているものの、プロセスが稼働し続けない場合に使用します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # システムレベルのサービスもスキャン
```

確認事項:

- 終了に関するヒントを伴う `Runtime: stopped`。
- サービス設定の不一致（`Config (cli)` と `Config (service)`）。
- ポート/リスナーの競合。
- `--deep` 使用時に検出される追加の launchd/systemd/schtasks インストール。
- `Other gateway-like services detected (best effort)` のクリーンアップに関するヒント。

<AccordionGroup>
  <Accordion title="一般的なシグネチャ">
    - `Gateway start blocked: set gateway.mode=local` または `existing config is missing gateway.mode` → ローカル Gateway モードが有効になっていないか、設定ファイルが上書きされて `gateway.mode` が失われています。修正方法: 設定で `gateway.mode="local"` を指定するか、`openclaw onboard --mode local` / `openclaw setup` を再実行して、想定されるローカルモード設定を再設定します。Podman 経由で OpenClaw を実行している場合、デフォルトの設定パスは `~/.openclaw/openclaw.json` です。
    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証パス（トークン/パスワード、または設定されている場合は信頼済みプロキシ）なしで非ループバックにバインドしています。
    - `another gateway instance is already listening` / `EADDRINUSE` → ポートが競合しています。
    - `Other gateway-like services detected (best effort)` → 古い、または並行して動作する launchd/systemd/schtasks ユニットが存在します。ほとんどの構成では、マシンごとに 1 つの Gateway のみを維持する必要があります。複数必要な場合は、ポート、設定/状態/ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。
    - doctor の `System-level OpenClaw gateway service detected` → ユーザーレベルのサービスが存在しない一方で、systemd のシステムユニットが存在します。doctor にユーザーサービスをインストールさせる前に重複を削除または無効化するか、システムユニットを意図したスーパーバイザーとして使用する場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。
    - `Gateway service port does not match current gateway config` → インストール済みのスーパーバイザーが引き続き古い `--port` を固定しています。`openclaw doctor --fix` または `openclaw gateway install --force` を実行してから、Gateway サービスを再起動してください。

  </Accordion>
</AccordionGroup>

関連項目:

- [バックグラウンド実行とプロセスツール](/ja-JP/gateway/background-process)
- [設定](/ja-JP/gateway/configuration)
- [Doctor](/ja-JP/gateway/doctor)

## macOS の Gateway が応答を停止し、ダッシュボードを操作すると再開する

macOS ホスト上のチャンネル（Telegram、WhatsApp など）が数分から数時間にわたって反応しなくなり、コントロール UI を開く、SSH で接続する、またはその他の方法でホストを操作した瞬間に Gateway が復帰するように見える場合に使用します。確認する頃には Gateway が再び稼働しているため、通常 `openclaw status` には明らかな症状が表示されません。

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

確認事項:

- `~/.openclaw/logs/stability/` に、`error.code` が `ENETDOWN`、`ENETUNREACH`、`EHOSTUNREACH`、`ECONNREFUSED` などの一時的なネットワークコードに設定された `*-uncaught_exception.json` バンドルが 1 つ以上ある。
- クラッシュのタイムスタンプと一致する、`Entering Sleep state due to 'Maintenance Sleep'` や `en0 driver is slow (msg: WillChangeState to 0)` のような `pmset -g log` の行。Power Nap / Maintenance Sleep は Wi-Fi ドライバーを一時的に状態 0 にします。この時間帯に発生した外向きの `connect()` は、それ以外では完全なネットワーク接続があるホストでも `ENETDOWN` で失敗する可能性があります。
- `launchctl print` の出力に、直近の複数の `runs` と終了コードとともに `state = not running` が表示される。特に、クラッシュから次の起動までの間隔が数秒ではなく 1 時間程度の場合。macOS の launchd はクラッシュが短期間に集中した後、文書化されていない再起動保護ゲートを適用します。このゲートにより、対話型ログイン、ダッシュボード接続、`launchctl kickstart` などの外部トリガーが再有効化するまで、`KeepAlive=true` が無視されることがあります。

一般的な兆候:

- `error.code` が `ENETDOWN` または同種のコードであり、コールスタックが Node の `net` にある `lookupAndConnect` / `Socket.connect` を示す安定性バンドル。OpenClaw `2026.5.26` 以降では、これらは無害な一時的ネットワークエラーとして分類されるため、トップレベルの未捕捉ハンドラーまで伝播しなくなりました。古いリリースを使用している場合は、まずアップグレードしてください。
- Control UI に接続するか、ホストへ SSH 接続した瞬間に終了する長い無通信期間。launchd の再起動ゲートを再有効化するのは、ダッシュボードが Gateway に対して行う処理ではなく、ユーザーから見えるアクティビティです。
- `~/Library/Logs/openclaw/gateway.log` に対応する `received SIG*; shutting down` 行がないまま、1 日を通して `runs` のカウントが増加する。正常なシャットダウンではシグナルがログに記録されますが、一時的なクラッシュでは記録されません。

対処方法:

1. `2026.5.26` より前のリリースを実行している場合は、**Gateway をアップグレード**します。アップグレード後、以降の `ENETDOWN` エラーはプロセスを終了させる代わりに警告として記録されます。
2. 常時稼働サーバーとして使用する Mac mini / デスクトップホストでは、**メンテナンススリープの動作を減らします**:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   これにより、根本にあるドライバーの瞬断は大幅に減少しますが、完全には解消されません。これらのフラグに関係なく、TCP keepalive と mDNS の維持のために、システムが一部のメンテナンススリープを実行する場合があります。

3. launchd によって待機状態にされた将来の連続クラッシュを迅速に検出できるように、**稼働監視ウォッチドッグを追加**します:

   ```bash
   # 5 分間隔の cron または LaunchAgent に適した、launchd 対応の稼働確認例
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   目的は、再起動ゲートを外部から再有効化することです。macOS では連続クラッシュ後、`KeepAlive=true` だけでは不十分です。

関連項目:

- [macOS プラットフォームの注意事項](/ja-JP/platforms/macos)
- [ログ記録](/ja-JP/logging)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway/node の重複した LaunchAgent による macOS launchd 監視ループ

macOS のインストール環境が数秒ごとに再起動し続け、`openclaw`
のヘルスチェック結果が正常と利用不可の間で変動し、サービスが実行中に
見えるにもかかわらず、チャンネルのディスパッチが停止する場合に使用します。

これは、`ai.openclaw.gateway` と `ai.openclaw.node` の両方の
LaunchAgent が有効で、それぞれが `OPENCLAW_LAUNCHD_LABEL` を注入していた
古いインストール環境で確認されています。この状態では、OpenClaw が launchd
による監視を検出し、再起動を launchd に戻そうとして、安定した 1 つの Gateway
プロセスではなく、高速な `EADDRINUSE`/再起動ループに陥ることがあります。

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

確認事項:

- 30 秒間のサンプルで、安定した 1 つのプロセスではなく複数の Gateway PID が
  表示される。
- `gateway.log` に `EADDRINUSE`、`another gateway instance is already listening`、
  または再起動/引き渡しの行が繰り返し表示される。
- 管理対象の Gateway サービスを 1 つだけ実行すべきホストで、
  `~/Library/LaunchAgents/ai.openclaw.gateway.plist` と
  `~/Library/LaunchAgents/ai.openclaw.node.plist` の両方が同時に読み込まれている。

対処方法:

1. このホストで Gateway サービスだけを実行する場合は、OpenClaw を通じて
   管理対象の Node サービスを削除します。リモート Node 機能のために Node
   サービスを実際に使用している場合は、アンインストールするとこのホスト上の
   それらの機能が停止するため、**この手順をスキップ**してください:

   ```bash
   openclaw node uninstall
   ```

2. OpenClaw を起動する前に、継承された launchd マーカーを消去する永続的な
   Gateway ラッパーをインストールします。サポートされている `--wrapper`
   オプションを使用してください。サービスの再インストール、更新、Doctor
   による修復で再生成されるため、`~/.openclaw/service-env/` 配下の生成済み
   ファイルは編集しないでください:

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` は、強制再インストール、更新、Doctor による修復を行っても、
   ラッパーのパスを保持します。

3. Gateway が単にリッスンしているだけでなく、安定して RPC を提供していることを
   確認します:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   PID サンプルには、入れ替わり続ける複数の PID ではなく、安定した 1 つの
   プロセスが表示され、受信チャンネルのディスパッチが再開する必要があります。

4. 根本的な LaunchAgent の二重ループが修正されたリリースへアップグレードした後、
   回避策を削除し、通常の管理対象サービスを再インストールします:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

関連項目:

- [macOS プラットフォームの注意事項](/ja-JP/platforms/mac/bundled-gateway)
- [Doctor](/ja-JP/gateway/doctor)
- [Gateway CLI](/ja-JP/cli/gateway)

## メモリ使用量が多いときに Gateway が終了する

負荷がかかると Gateway が消失する場合、スーパーバイザーが OOM 形式の再起動を報告する場合、またはログに `critical memory pressure bundle written` と記録されている場合に使用します。

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

確認事項:

- 最新の安定性バンドルに `Reason: diagnostic.memory.pressure.critical` がある。
- `Memory pressure:` に `critical/rss_threshold`、`critical/heap_threshold`、または `critical/rss_growth` がある。
- `V8 heap:` の値がヒープ上限に近い。
- `Largest session files:` に `agents/<agent>/sessions/<session>.jsonl` や `sessions/<session>.jsonl` などのエントリがある。
- Gateway がコンテナまたはメモリ制限付きサービス内で実行されている場合、Linux cgroup のメモリカウンターがある。

一般的な兆候:

- 再起動の直前に `critical memory pressure bundle written` が表示される → OpenClaw が OOM 前の安定性バンドルを取得しました。`openclaw gateway stability --bundle latest` で確認してください。
- Gateway ログに `memory pressure: level=critical ... memoryPressureSnapshot=disabled` が表示される → OpenClaw は重大なメモリ圧迫を検出しましたが、OOM 前の安定性スナップショットは無効です。
- `Largest session files:` が非常に大きな編集済みトランスクリプトのパスを示す → 保持するセッション履歴を減らすか、セッションの増大を調査するか、再起動前に古いトランスクリプトをアクティブストアの外へ移動してください。
- `V8 heap:` の使用済みバイト数がヒープ上限に近い → プロンプト/セッションの負荷を下げるか、同時実行作業を減らすか、ワークロードが想定どおりであることを確認した後にのみ Node のヒープ上限を引き上げてください。
- `Memory pressure: critical/rss_growth` → 1 回のサンプリング期間内にメモリが急増しました。最新ログで、大規模なインポート、制御不能なツール出力、繰り返される再試行、またはキューに入ったエージェント作業の一括処理を確認してください。
- 重大なメモリ圧迫がログに表示されるが、バンドルが存在しない → これがデフォルトです。今後の重大なメモリ圧迫イベントで OOM 前の安定性バンドルを取得するには、`diagnostics.memoryPressureSnapshot: true` を設定してください。

安定性バンドルにはペイロードが含まれません。メッセージ本文、Webhook 本文、認証情報、トークン、Cookie、生のセッション ID ではなく、運用上のメモリ情報と編集済みの相対ファイルパスが含まれます。生のログをコピーする代わりに、診断エクスポートをバグ報告へ添付してください。

関連項目:

- [Gateway のヘルス](/ja-JP/gateway/health)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [セッション](/ja-JP/cli/sessions)

## Gateway が無効な設定を拒否した

Gateway の起動が `Invalid config` で失敗する場合、またはホットリロードのログに無効な編集をスキップしたと記録されている場合に使用します。

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
- アクティブな設定ファイルの隣に、タイムスタンプ付きの `openclaw.json.rejected.*` ファイルがある。
- `doctor --fix` が壊れた直接編集を修復した場合、タイムスタンプ付きの `openclaw.json.clobbered.*` ファイルがある。
- OpenClaw は設定パスごとに最新の 32 個の `.clobbered.*` ファイルを保持し、それより古いものをローテーションします。

<AccordionGroup>
  <Accordion title="発生したこと">
    - 起動時、ホットリロード時、または OpenClaw が所有する書き込み時に、設定の検証に失敗しました。
    - Gateway の起動は `openclaw.json` を書き換えず、安全側に失敗します。
    - ホットリロードは無効な外部編集をスキップし、現在のランタイム設定を有効なまま維持します。
    - OpenClaw が所有する書き込みは、コミット前に無効または破壊的なペイロードを拒否し、`.rejected.*` として保存します。
    - 修復は `openclaw doctor --fix` が担当します。JSON ではないプレフィックスの削除や、拒否されたペイロードを `.clobbered.*` として保持しながら、最後に正常だったコピーを復元できます。
    - 1 つの設定パスで多数の修復が発生すると、OpenClaw は古い `.clobbered.*` ファイルをローテーションし、最新の修復済みペイロードを引き続き利用できるようにします。

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
    - `.clobbered.*` が存在する → Doctor はアクティブな設定を修復しながら、壊れた外部編集を保持しました。
    - `.rejected.*` が存在する → OpenClaw が所有する設定書き込みが、コミット前にスキーマまたは上書きチェックに失敗しました。
    - `Config write rejected:` → 書き込みが必須の構造を削除しようとしたか、ファイルを急激に縮小しようとしたか、無効な設定を永続化しようとしました。
    - `config reload skipped (invalid config):` → 直接編集が検証に失敗し、実行中の Gateway に無視されました。
    - `Invalid config at ...` → Gateway サービスが起動する前に、起動処理が失敗しました。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good`、または `size-drop-vs-last-good:*` → OpenClaw が所有する書き込みは、最後に正常だったバックアップと比較してフィールドまたはサイズが失われていたため拒否されました。
    - `Config last-known-good promotion skipped` → 候補に `***` などの編集済みシークレットプレースホルダーが含まれていました。

  </Accordion>
  <Accordion title="修復方法">
    1. `openclaw doctor --fix` を実行し、Doctor にプレフィックス付きまたは上書きされた設定を修復させるか、最後に正常だった設定を復元させます。
    2. `.clobbered.*` または `.rejected.*` から意図したキーのみをコピーし、`openclaw config set` または `config.patch` で適用します。
    3. 再起動する前に `openclaw config validate` を実行します。
    4. 手動で編集する場合は、変更したい部分オブジェクトだけでなく、JSON5 設定全体を維持してください。
  </Accordion>
</AccordionGroup>

関連項目:

- [設定](/ja-JP/cli/config)
- [設定: ホットリロード](/ja-JP/gateway/configuration#config-hot-reload)
- [設定: 厳格な検証](/ja-JP/gateway/configuration#strict-validation)
- [Doctor](/ja-JP/gateway/doctor)

## Gateway プローブの警告

`openclaw gateway probe` が何らかの対象に到達しているにもかかわらず、警告ブロックが表示される場合に使用します。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

確認項目:

- JSON 出力の `warnings[].code` と `primaryTargetId`。
- 警告が SSH フォールバック、複数の Gateway、スコープ不足、未解決の認証参照のいずれに関するものか。

一般的なシグネチャ:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH のセットアップに失敗しましたが、コマンドは設定済みの直接ターゲット/local loopback ターゲットへのプローブを引き続き試行しました。
- `multiple reachable gateway identities detected` → 異なる Gateway が応答したか、到達可能なターゲットが同じ Gateway であることを OpenClaw が証明できませんでした。同じ Gateway への SSH トンネル、プロキシ URL、または設定済みリモート URL は、トランスポートのポートが異なる場合でも、複数のトランスポートを持つ 1 つの Gateway として扱われます。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 接続には成功しましたが、詳細 RPC はスコープによって制限されています。デバイス ID をペアリングするか、`operator.read` を持つ認証情報を使用してください。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 接続には成功しましたが、完全な診断 RPC セットがタイムアウトまたは失敗しました。これは診断機能が低下した到達可能な Gateway として扱い、`--json` 出力の `connect.ok` と `connect.rpcOk` を比較してください。
- `Capability: pairing-pending` または `gateway closed (1008): pairing required` → Gateway は応答しましたが、このクライアントが通常のオペレーターアクセスを行うには、引き続きペアリング/承認が必要です。
- 未解決の `gateway.auth.*` / `gateway.remote.*` SecretRef 警告テキスト → 失敗したターゲットに対して、このコマンドパスでは認証情報を利用できませんでした。

関連項目:

- [Gateway](/ja-JP/cli/gateway)
- [同じホスト上の複数の Gateway](/ja-JP/gateway#multiple-gateways-same-host)
- [リモートアクセス](/ja-JP/gateway/remote)

## チャンネルは接続済みだが、メッセージが流れない

チャンネルの状態が接続済みでもメッセージフローが停止している場合は、ポリシー、権限、チャンネル固有の配信ルールに注目してください。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認項目:

- DM ポリシー（`pairing`、`allowlist`、`open`、`disabled`）。
- グループの許可リストとメンション要件。
- 不足しているチャンネル API の権限/スコープ。

一般的なシグネチャ:

- `mention required` → グループのメンションポリシーによりメッセージが無視されました。
- `pairing` / 承認待ちのトレース → 送信者が承認されていません。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → チャンネルの認証/権限に問題があります。

関連項目:

- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [Discord](/ja-JP/channels/discord)
- [Telegram](/ja-JP/channels/telegram)
- [WhatsApp](/ja-JP/channels/whatsapp)

## Cron と Heartbeat の配信

Cron または Heartbeat が実行されなかった、あるいは配信されなかった場合は、まずスケジューラーの状態を確認し、次に配信先を確認してください。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認項目:

- Cron が有効で、次回のウェイク時刻が存在すること。
- ジョブ実行履歴のステータス（`ok`、`skipped`、`error`）。
- Heartbeat のスキップ理由（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="一般的なシグネチャ">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron が無効です。
    - `cron: timer tick failed` → スケジューラーのティックに失敗しました。ファイル/ログ/ランタイムのエラーを確認してください。
    - `heartbeat skipped` と `reason=quiet-hours` → アクティブ時間帯の範囲外です。
    - `heartbeat skipped` と `reason=empty-heartbeat-file` → `HEARTBEAT.md` は存在しますが、空白、コメント、ヘッダー、フェンス、または空のチェックリストの雛形しか含まれていないため、OpenClaw はモデル呼び出しをスキップします。
    - `heartbeat skipped` と `reason=no-tasks-due` → `HEARTBEAT.md` に `tasks:` ブロックがありますが、このティックで期限を迎えるタスクはありません。
    - `heartbeat: unknown accountId` → Heartbeat の配信先に指定されたアカウント ID が無効です。
    - `heartbeat skipped` と `reason=dm-blocked` → `agents.defaults.heartbeat.directPolicy`（またはエージェントごとのオーバーライド）が `block` に設定されている状態で、Heartbeat の配信先が DM 形式の宛先として解決されました。

  </Accordion>
</AccordionGroup>

関連項目:

- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュールされたタスク](/ja-JP/automation/cron-jobs)
- [スケジュールされたタスク: トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting)

## Node はペアリング済みだが、ツールが失敗する

Node がペアリング済みでもツールが失敗する場合は、フォアグラウンド、権限、承認の状態を切り分けてください。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認項目:

- Node がオンラインで、想定される機能を備えていること。
- カメラ/マイク/位置情報/画面に対する OS 権限の付与。
- Exec の承認と許可リストの状態。

一般的なシグネチャ:

- `NODE_BACKGROUND_UNAVAILABLE` → Node アプリがフォアグラウンドにある必要があります。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 権限が不足しています。
- `SYSTEM_RUN_DENIED: approval required` → Exec の承認待ちです。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが許可リストによってブロックされました。

関連項目:

- [Exec の承認](/ja-JP/tools/exec-approvals)
- [Node のトラブルシューティング](/ja-JP/nodes/troubleshooting)
- [Node](/ja-JP/nodes/index)

## ブラウザーツールが失敗する

Gateway 自体は正常でも、ブラウザーツールのアクションが失敗する場合に使用します。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認項目:

- `plugins.allow` が設定され、`browser` が含まれているか。
- ブラウザーの実行可能ファイルへのパスが有効か。
- CDP プロファイルに到達可能か。
- `existing-session` / `user` プロファイルでローカルの Chrome が利用可能か。

<AccordionGroup>
  <Accordion title="Plugin / 実行可能ファイルのシグネチャ">
    - `unknown command "browser"` または `unknown command 'browser'` → バンドルされたブラウザー Plugin が `plugins.allow` によって除外されています。
    - `browser.enabled=true` であるにもかかわらずブラウザーツールが存在しない/利用できない → `plugins.allow` が `browser` を除外しているため、Plugin が読み込まれていません。
    - `Failed to start Chrome CDP on port` → ブラウザープロセスの起動に失敗しました。
    - `browser.executablePath not found` → 設定されたパスが無効です。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定された CDP URL が `file:` や `ftp:` などのサポートされていないスキームを使用しています。
    - `browser.cdpUrl has invalid port` → 設定された CDP URL のポートが不正、または範囲外です。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 現在インストールされている Gateway には、コアのブラウザーランタイム依存関係がありません。OpenClaw を再インストールまたは更新してから、Gateway を再起動してください。ARIA スナップショットと基本的なページスクリーンショットは引き続き機能しますが、ナビゲーション、AI スナップショット、CSS セレクターによる要素スクリーンショット、PDF エクスポートは引き続き利用できません。

  </Accordion>
  <Accordion title="Chrome MCP / existing-session のシグネチャ">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP の existing-session が、選択されたブラウザーデータディレクトリにまだアタッチできませんでした。ブラウザーの検査ページを開き、リモートデバッグを有効にして、ブラウザーを開いたままにし、最初のアタッチプロンプトを承認してから再試行してください。サインイン済みの状態が不要な場合は、管理対象の `openclaw` プロファイルを推奨します。
    - `No browser tabs found for profile="user"` → Chrome MCP のアタッチプロファイルに、開かれているローカル Chrome タブがありません。
    - `Remote CDP for profile "<name>" is not reachable` → 設定されたリモート CDP エンドポイントに Gateway ホストから到達できません。
    - `Browser attachOnly is enabled ... not reachable` または `Browser attachOnly is enabled and CDP websocket ... is not reachable` → アタッチ専用プロファイルに到達可能なターゲットがないか、HTTP エンドポイントは応答したものの CDP WebSocket を開けませんでした。

  </Accordion>
  <Accordion title="要素 / スクリーンショット / アップロードのシグネチャ">
    - `fullPage is not supported for element screenshots` → スクリーンショットのリクエストで `--full-page` と `--ref` または `--element` が併用されています。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` のスクリーンショット呼び出しでは、CSS の `--element` ではなく、ページキャプチャまたはスナップショットの `--ref` を使用する必要があります。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP のアップロードフックでは、CSS セレクターではなくスナップショット参照が必要です。
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP プロファイルでは、1 回の呼び出しにつき 1 ファイルをアップロードしてください。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP プロファイルのダイアログフックは、タイムアウトのオーバーライドをサポートしていません。
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP の existing-session プロファイルで `act:type` を使用する場合は `timeoutMs` を省略するか、カスタムタイムアウトが必要な場合は管理対象/CDP ブラウザープロファイルを使用してください。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` には引き続き管理対象ブラウザーまたは raw CDP プロファイルが必要です。
    - アタッチ専用またはリモート CDP プロファイルに残っているビューポート/ダークモード/ロケール/オフラインのオーバーライド → `openclaw browser stop --browser-profile <name>` を実行し、Gateway 全体を再起動せずにアクティブな制御セッションを閉じて Playwright/CDP のエミュレーション状態を解放してください。

  </Accordion>
</AccordionGroup>

関連項目:

- [ブラウザー（OpenClaw 管理）](/ja-JP/tools/browser)
- [ブラウザーのトラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)

## アップグレード後に突然問題が発生した場合

アップグレード後の問題の多くは、設定のずれ、または以前より厳格なデフォルトが適用されるようになったことが原因です。

<AccordionGroup>
  <Accordion title="1. 認証と URL オーバーライドの動作が変更された">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    確認事項:

    - `gateway.mode=remote` の場合、ローカルサービスが正常でも、CLI 呼び出しがリモートを対象としている可能性があります。
    - 明示的な `--url` 呼び出しでは、保存済みの認証情報にフォールバックしません。

    一般的なシグネチャ:

    - `gateway connect failed:` → URL ターゲットが正しくありません。
    - `unauthorized` → エンドポイントには到達可能ですが、認証が正しくありません。

  </Accordion>
  <Accordion title="2. バインドと認証のガードレールが厳格化された">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    確認事項:

    - 非 local loopback バインド（`lan`、`tailnet`、`custom`）には、有効な Gateway 認証パスが必要です。共有トークン/パスワード認証、または正しく設定された非 local loopback の `trusted-proxy` デプロイメントを使用してください。
    - `gateway.token` のような古いキーは `gateway.auth.token` の代わりにはなりません。

    一般的なシグネチャ:

    - `refusing to bind gateway ... without auth` → 有効な Gateway 認証パスがない非 local loopback バインドです。
    - ランタイムが実行中なのに `Connectivity probe: failed` → Gateway は稼働していますが、現在の認証/URL ではアクセスできません。

  </Accordion>
  <Accordion title="3. ペアリングとデバイス ID の状態が変更された">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    確認事項:

    - ダッシュボード/Node のデバイス承認待ち。
    - ポリシーまたは ID の変更後に保留中となった DM ペアリング承認。

    一般的なシグネチャ:

    - `device identity required` → デバイス認証の要件を満たしていません。
    - `pairing required` → 送信者/デバイスを承認する必要があります。

  </Accordion>
</AccordionGroup>

確認後もサービス設定とランタイムが一致しない場合は、同じプロファイル/状態ディレクトリからサービスメタデータを再インストールしてください。

```bash
openclaw gateway install --force
openclaw gateway restart
```

関連項目:

- [認証](/ja-JP/gateway/authentication)
- [バックグラウンド Exec とプロセスツール](/ja-JP/gateway/background-process)
- [Node のペアリング](/ja-JP/gateway/pairing)

## 関連項目

- [Doctor](/ja-JP/gateway/doctor)
- [よくある質問](/ja-JP/help/faq)
- [Gateway ランブック](/ja-JP/gateway)
