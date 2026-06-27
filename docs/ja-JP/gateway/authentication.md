---
read_when:
    - モデル認証またはOAuth の有効期限切れのデバッグ
    - 認証または認証情報ストレージのドキュメント化
summary: 'モデル認証: OAuth、API キー、Claude CLI の再利用、Anthropic setup-token'
title: 認証
x-i18n:
    generated_at: "2026-06-27T11:20:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
このページは、**モデルプロバイダー**認証のリファレンス（APIキー、OAuth、Claude CLI の再利用、Anthropic setup-token）です。**Gateway 接続**認証（token、password、trusted-proxy）については、[設定](/ja-JP/gateway/configuration) と [信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth) を参照してください。
</Note>

OpenClaw はモデルプロバイダー向けに OAuth と APIキーをサポートします。常時稼働の Gateway
ホストでは、通常 APIキーが最も予測しやすい選択肢です。サブスクリプション/OAuth
フローも、プロバイダーアカウントのモデルに合う場合はサポートされます。

完全な OAuth フローとストレージ
レイアウトについては、[/concepts/oauth](/ja-JP/concepts/oauth) を参照してください。
SecretRef ベースの認証（`env`/`file`/`exec` プロバイダー）については、[シークレット管理](/ja-JP/gateway/secrets) を参照してください。
`models status --probe` で使われる資格情報の適格性/理由コードのルールについては、
[認証資格情報セマンティクス](/ja-JP/auth-credential-semantics) を参照してください。

## 推奨セットアップ（APIキー、任意のプロバイダー）

長時間稼働する Gateway を実行している場合は、選択した
プロバイダーの APIキーから始めてください。
Anthropic については特に、APIキー認証が今でも最も予測しやすいサーバー
セットアップですが、OpenClaw はローカルの Claude CLI ログインの再利用もサポートします。

1. プロバイダーコンソールで APIキーを作成します。
2. それを **Gateway ホスト**（`openclaw gateway` を実行しているマシン）に置きます。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway が systemd/launchd の下で実行される場合は、デーモンが読み取れるように、
   `~/.openclaw/.env` にキーを置くことを推奨します。

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

その後、デーモンを再起動（または Gateway プロセスを再起動）し、再確認します。

```bash
openclaw models status
openclaw doctor
```

env vars を自分で管理したくない場合は、オンボーディングでデーモン利用向けに
APIキーを保存できます: `openclaw onboard`。

env の継承（`env.shellEnv`、
`~/.openclaw/.env`、systemd/launchd）の詳細は [ヘルプ](/ja-JP/help) を参照してください。

## Anthropic: Claude CLI とトークン互換性

Anthropic setup-token 認証は、サポート対象のトークン
パスとして OpenClaw で引き続き利用できます。その後 Anthropic スタッフから、OpenClaw 形式の Claude CLI 利用は
再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、
OpenClaw はこの統合における Claude CLI の再利用と `claude -p` の利用を
認められたものとして扱います。ホストで Claude CLI の再利用が利用可能な場合、現在はそれが推奨パスです。

長時間稼働する Gateway ホストでは、Anthropic APIキーが今でも最も予測しやすい
セットアップです。同じホスト上の既存の Claude ログインを再利用したい場合は、
オンボーディング/設定で Anthropic Claude CLI パスを使用してください。

Claude CLI 再利用の推奨ホストセットアップ:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

これは 2 段階のセットアップです。

1. Gateway ホスト上で Claude Code 自体を Anthropic にログインさせます。
2. OpenClaw に、Anthropic モデル選択をローカルの `claude-cli`
   バックエンドへ切り替え、対応する OpenClaw 認証プロファイルを保存するよう指示します。

`claude` が `PATH` 上にない場合は、先に Claude Code をインストールするか、
`agents.defaults.cliBackends.claude-cli.command` を実際のバイナリパスに設定してください。

手動トークン入力（任意のプロバイダー。エージェントごとの SQLite 認証ストアに書き込み、設定を更新します）:

```bash
openclaw models auth paste-token --provider openrouter
```

認証プロファイルストアは資格情報のみを保持します。レガシーの `auth-profiles.json` ファイルは、この正規形を使用していました。

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw は現在、各エージェントの `openclaw-agent.sqlite` から認証プロファイルを読み取ります。古いインストールに `auth-profiles.json`、`auth-state.json`、または `{ "openrouter": { "apiKey": "..." } }` のようなフラットな認証プロファイルファイルがまだある場合は、`openclaw doctor --fix` を実行して SQLite にインポートしてください。doctor は元の JSON ファイルの隣にタイムスタンプ付きバックアップを保持します。`baseUrl`、`api`、モデル ID、ヘッダー、タイムアウトなどのエンドポイント詳細は、認証プロファイルではなく、`openclaw.json` または `models.json` の `models.providers.<id>` に属します。

Bedrock `auth: "aws-sdk"` などの外部認証ルートも資格情報ではありません。名前付きの Bedrock ルートが必要な場合は、`openclaw.json` に `auth.profiles.<id>.mode: "aws-sdk"` を置いてください。認証プロファイルストアに `type: "aws-sdk"` を書き込まないでください。`openclaw doctor --fix` は、レガシーの AWS SDK マーカーを資格情報ストアから設定メタデータへ移動します。

静的資格情報では、認証プロファイル参照もサポートされます。

- `api_key` 資格情報は `keyRef: { source, provider, id }` を使用できます
- `token` 資格情報は `tokenRef: { source, provider, id }` を使用できます
- OAuth モードのプロファイルは SecretRef 資格情報をサポートしません。`auth.profiles.<id>.mode` が `"oauth"` に設定されている場合、そのプロファイルに対する SecretRef バックの `keyRef`/`tokenRef` 入力は拒否されます。

自動化向けチェック（期限切れ/欠落時は終了 `1`、期限切れ間近は `2`）:

```bash
openclaw models status --check
```

ライブ認証プローブ:

```bash
openclaw models status --probe
```

注:

- プローブ行は、認証プロファイル、env 資格情報、または `models.json` から来る場合があります。
- 明示的な `auth.order.<provider>` が保存済みプロファイルを省略している場合、プローブはそのプロファイルを試行せずに
  `excluded_by_auth_order` を報告します。
- 認証は存在するが、OpenClaw がそのプロバイダーについてプローブ可能なモデル候補を解決できない場合、
  プローブは `status: no_model` を報告します。
- レート制限のクールダウンはモデルスコープの場合があります。ある
  モデルでクールダウン中のプロファイルでも、同じプロバイダー上の兄弟モデルでは引き続き使用できる場合があります。

任意の運用スクリプト（systemd/Termux）はここに記載されています:
[認証監視スクリプト](/ja-JP/help/scripts#auth-monitoring-scripts)

## Anthropic の注記

Anthropic `claude-cli` バックエンドは再びサポートされています。

- Anthropic スタッフから、この OpenClaw 統合パスは再び許可されていると伝えられました。
- そのため OpenClaw は、Anthropic が新しいポリシーを公開しない限り、Anthropic バックの実行における Claude CLI の再利用と `claude -p` の利用を
  認められたものとして扱います。
- Anthropic APIキーは、長時間稼働する Gateway
  ホストと明示的なサーバー側課金管理において、引き続き最も予測しやすい選択肢です。

## モデル認証ステータスの確認

```bash
openclaw models status
openclaw doctor
```

## APIキーのローテーション動作（Gateway）

一部のプロバイダーは、API 呼び出しがプロバイダーのレート制限に
達した場合に、代替キーでリクエストを再試行することをサポートします。

- 優先順位:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一の上書き）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google プロバイダーは、追加のフォールバックとして `GOOGLE_API_KEY` も含めます。
- 同じキーリストは使用前に重複排除されます。
- OpenClaw は、レート制限エラー（たとえば
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached`、または
  `workers_ai ... quota limit exceeded`）の場合にのみ、次のキーで再試行します。
- レート制限以外のエラーでは、代替キーによる再試行は行われません。
- すべてのキーが失敗した場合、最後の試行の最終エラーが返されます。

## Gateway 実行中にプロバイダー認証を削除する

プロバイダー認証が Gateway コントロールプレーンを通じて削除されると、OpenClaw は
そのプロバイダーの保存済み認証プロファイルを削除し、選択されたモデルプロバイダーが削除されたプロバイダーに一致するアクティブなチャットまたはエージェント実行を
中止します。中止された実行は、通常のチャットキャンセルイベントとライフサイクルイベントを
`stopReason: "auth-revoked"` とともに発行するため、接続中のクライアントは資格情報が削除されたため実行が
停止されたことを表示できます。

保存済み認証の削除は、プロバイダー側のキーを取り消しません。プロバイダー側で無効化する必要がある場合は、
プロバイダーダッシュボードでキーをローテーションまたは取り消してください。

## 使用する資格情報を制御する

### OpenAI とレガシー `openai-codex` ID

OpenAI APIキー プロファイルと ChatGPT/Codex OAuth プロファイルは、どちらも正規の
プロバイダー ID `openai` を使用します。新しい設定では `openai:*` プロファイル ID と
`auth.order.openai` を使用してください。

古い設定、認証プロファイル ID、または
`auth.order.openai-codex` に `openai-codex` がある場合、それはレガシー移行入力として扱ってください。新しい
`openai-codex` プロファイルは作成しないでください。次を実行します。

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor は、レガシーの `openai-codex:*` プロファイル ID と
`auth.order.openai-codex` エントリを、正規の `openai` 認証ルートに書き換えます。
OpenAI 固有のモデル/ランタイムルーティングについては、[OpenAI](/ja-JP/providers/openai) を参照してください。

### ログイン中（CLI）

ログイン中に名前付き認証プロファイルをサポートするプロバイダーでは、
`openclaw models auth login --provider <id> --profile-id <profileId>` を使用します。

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

これは、同じプロバイダーの複数の OAuth ログインを 1 つのエージェント内で
分離して保持する最も簡単な方法です。

保存済みプロバイダープロファイルがスタックしている、期限切れ、または
間違ったアカウントに結び付いていて、通常のログインコマンドがそれを再利用し続ける場合は、`--force` を使用します。`--force` は、選択されたエージェントディレクトリ内のそのプロバイダーの保存済み認証プロファイルを削除し、
同じプロバイダー認証フローを再度実行します。これはプロバイダー側の資格情報を取り消しません。
プロバイダー側で無効化する必要がある場合は、プロバイダーダッシュボードでローテーションまたは取り消してください。

```bash
openclaw models auth login --provider anthropic --force
```

### セッションごと（チャットコマンド）

現在のセッションに特定のプロバイダー資格情報を固定するには、`/model <alias-or-id>@<profileId>` を使用します（プロファイル ID の例: `anthropic:default`、`anthropic:work`）。

コンパクトなピッカーには `/model`（または `/model list`）を使用し、完全なビュー（候補 + 次の認証プロファイル、さらに設定済みの場合はプロバイダーエンドポイント詳細）には `/model status` を使用します。

### エージェントごと（CLI 上書き）

エージェントの明示的な認証プロファイル順序の上書きを設定します（そのエージェントの SQLite 認証状態に保存されます）。

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

特定のエージェントを対象にするには `--agent <id>` を使用します。省略すると、設定済みの既定エージェントが使用されます。
順序の問題をデバッグするとき、`openclaw models status --probe` は、省略された
保存済みプロファイルを暗黙にスキップするのではなく、`excluded_by_auth_order` として表示します。
クールダウンの問題をデバッグするときは、レート制限のクールダウンが
プロバイダープロファイル全体ではなく 1 つのモデル ID に結び付いている場合があることを覚えておいてください。

すでに実行中のチャットで認証順序またはプロファイル固定を変更した場合は、
そのチャットで `/new` または `/reset` を送信して新しいセッションを開始してください。既存の
セッションは、リセットされるまで現在のモデル/プロファイル選択を維持できます。

## トラブルシューティング

### 「資格情報が見つかりません」

Anthropic プロファイルがない場合は、**Gateway ホスト**に Anthropic APIキーを設定するか、
Anthropic setup-token パスをセットアップしてから、再確認します。

```bash
openclaw models status
```

### トークンが期限切れ間近/期限切れ

どのプロファイルが期限切れになりつつあるかを確認するには、`openclaw models status` を実行します。
Anthropic トークンプロファイルがない、または期限切れの場合は、そのセットアップを
setup-token で更新するか、Anthropic APIキーに移行してください。

## 関連

- [シークレット管理](/ja-JP/gateway/secrets)
- [リモートアクセス](/ja-JP/gateway/remote)
- [認証ストレージ](/ja-JP/concepts/oauth)
