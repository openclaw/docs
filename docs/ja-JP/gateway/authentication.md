---
read_when:
    - モデル認証または OAuth 有効期限切れのデバッグ
    - 認証または認証情報ストレージのドキュメント化
summary: 'モデル認証: OAuth、API キー、Claude CLI の再利用、Anthropic setup-token'
title: 認証
x-i18n:
    generated_at: "2026-07-05T11:23:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
このページでは、**モデルプロバイダー**認証（API キー、OAuth、Claude CLI の再利用、Anthropic setup-token）について説明します。**Gateway 接続**認証（トークン、パスワード、trusted-proxy）については、[設定](/ja-JP/gateway/configuration)と[Trusted Proxy 認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。
</Note>

OpenClaw はモデルプロバイダー向けに OAuth と API キーをサポートしています。常時稼働する Gateway ホストでは、API キーが最も予測しやすい選択肢です。サブスクリプション/OAuth フローも、プロバイダーアカウントのモデルに合っていれば利用できます。

- 完全な OAuth フローとストレージレイアウト: [/concepts/oauth](/ja-JP/concepts/oauth)
- SecretRef ベースの認証（`env`/`file`/`exec` プロバイダー）: [シークレット管理](/ja-JP/gateway/secrets)
- `models status --probe` で使用される認証情報の適格性/理由コード: [認証情報セマンティクス](/ja-JP/auth-credential-semantics)

## 推奨セットアップ: API キー（任意のプロバイダー）

1. プロバイダーのコンソールで API キーを作成します。
2. **Gateway ホスト**（`openclaw gateway` を実行するマシン）に配置します。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway が systemd/launchd の下で動作する場合は、デーモンが読み取れるように `~/.openclaw/.env` にキーを配置します。

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. Gateway プロセス（またはデーモン）を再起動してから、再確認します。

```bash
openclaw models status
openclaw doctor
```

環境変数を自分で管理したくない場合、`openclaw onboard` でもデーモン用の API キーを保存できます。完全な環境変数読み込みの優先順位（`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd）については、[環境変数](/ja-JP/help/environment)を参照してください。

## Anthropic: Claude CLI の再利用

Anthropic setup-token 認証は、引き続きサポートされる経路です。Claude CLI の再利用（`claude -p` スタイルの利用）もこの連携で正式に認められています。ホストで Claude CLI ログインを利用できる場合、local/デスクトップ利用ではそれが推奨経路です。長期稼働する Gateway ホストでは、明示的なサーバー側の課金制御ができる Anthropic API キーが、引き続き最も予測しやすい選択肢です。

Claude CLI 再利用のホストセットアップ:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

これは 2 段階です。ホスト上で Claude Code を Anthropic にログインし、その後 OpenClaw に Anthropic モデル選択をローカルの `claude-cli` バックエンド経由にルーティングし、対応する OpenClaw 認証プロファイルを保存するよう指示します。

`claude` が `PATH` にない場合は、Claude Code をインストールするか、`agents.defaults.cliBackends.claude-cli.command` をバイナリパスに設定してください。

## 手動トークン入力

任意のプロバイダーで動作します。エージェントごとの SQLite 認証ストアに書き込み、設定を更新します。

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw は各エージェントの `openclaw-agent.sqlite` から認証プロファイルを読み取ります。エンドポイントの詳細（`baseUrl`、`api`、モデル ID、ヘッダー、タイムアウト）は、認証プロファイルではなく、`openclaw.json` または `models.json` の `models.providers.<id>` の下に属します。

古いインストールにまだ `auth-profiles.json`、`auth-state.json`、または `{ "openrouter": { "apiKey": "..." } }` のようなフラットな形がある場合は、`openclaw doctor --fix` を実行して SQLite にインポートしてください。doctor は元の JSON ファイルの横にタイムスタンプ付きバックアップを保持します。

Bedrock の `auth: "aws-sdk"` などの外部認証ルートは認証情報ではありません。名前付き Bedrock ルートでは、認証プロファイルストアに `type: "aws-sdk"` を書き込まず、`openclaw.json` で `auth.profiles.<id>.mode: "aws-sdk"` を設定してください。`openclaw doctor --fix` は、レガシー AWS SDK マーカーを認証情報ストアから設定メタデータへ移行します。

### SecretRef で裏付けられた認証情報

- `api_key` 認証情報は `keyRef: { source, provider, id }` を使用できます
- `token` 認証情報は `tokenRef: { source, provider, id }` を使用できます
- OAuth モードのプロファイルは SecretRef 認証情報を拒否します。`auth.profiles.<id>.mode` が `"oauth"` の場合、そのプロファイルに対する SecretRef で裏付けられた `keyRef`/`tokenRef` は拒否されます。

## モデル認証ステータスの確認

```bash
openclaw models status
openclaw doctor
```

自動化向けのチェック。期限切れ/欠落時は `1`、期限間近のときは `2` で終了します。

```bash
openclaw models status --check
```

ライブ認証プローブ（範囲を絞るには `--probe-provider`、`--probe-profile`、`--probe-timeout`、`--probe-concurrency`、または `--probe-max-tokens` を追加します）:

```bash
openclaw models status --probe
```

注記:

- プローブ行は、認証プロファイル、環境認証情報、または `models.json` から来る場合があります。
- `auth.order.<provider>` が保存済みプロファイルを省略している場合、プローブはそのプロファイルを試す代わりに `excluded_by_auth_order` を報告します。
- 認証は存在するが、OpenClaw がそのプロバイダー向けのプローブ可能なモデルを解決できない場合、プローブは `status: no_model` を報告します。
- レート制限クールダウンはモデル単位にできます。あるモデルでクールダウン中のプロファイルでも、同じプロバイダー上の兄弟モデルには引き続き対応できます。

任意の運用スクリプト（systemd/Termux）: [認証監視スクリプト](/ja-JP/help/scripts#auth-monitoring-scripts)。

## API キーのローテーション（Gateway）

一部のプロバイダーでは、呼び出しがプロバイダーのレート制限に達した場合、設定済みの代替キーでリクエストを再試行します。

プロバイダーごとのキー優先順位:

1. `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一の上書き。1 つのキーに固定）
2. `<PROVIDER>_API_KEYS`（カンマ/スペース/セミコロン区切りのリスト）
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*`（この接頭辞を持つ任意の環境変数）

Google プロバイダー（`google`、`google-vertex`）はさらに `GOOGLE_API_KEY` にフォールバックします。結合されたリストは、使用前に重複排除されます。

OpenClaw が次のキーへローテーションするのは、エラーメッセージが `rate_limit`、`rate limit`、`429`、`quota exceeded`/`quota_exceeded`、`resource exhausted`/`resource_exhausted`、または `too many requests` に一致する場合のみです。その他のエラーは代替キーで再試行されません。すべてのキーが失敗した場合、最後の試行からの最終エラーが返されます。

<Note>
`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` のようなプロバイダー固有の語句は、**フェイルオーバー/再試行分類**（失敗が繰り返されたときにモデルまたはプロバイダーを切り替える）を駆動します。これは上記の API キーローテーションとは別の仕組みです。
</Note>

保存済み認証を削除しても、プロバイダー側でキーは失効しません。プロバイダー側で無効化する必要がある場合は、プロバイダーダッシュボードでローテーションまたは失効してください。

## Gateway の実行中にプロバイダー認証を削除する

Gateway コントロールプレーン経由でプロバイダー認証を削除すると、OpenClaw はそのプロバイダーの保存済み認証プロファイルを削除し、選択中のモデルプロバイダーが削除されたものと一致するアクティブなチャット/エージェント実行を中止します。中止された実行は `stopReason: "auth-revoked"` とともに通常のキャンセル/ライフサイクルイベントを発行するため、接続中のクライアントは認証情報が削除されたため実行が停止したことを表示できます。

## 使用する認証情報を制御する

### OpenAI とレガシー `openai-codex` ID

OpenAI API キープロファイルと ChatGPT/Codex OAuth プロファイルは、どちらも正規プロバイダー ID `openai` を使用します。新しい設定では、`openai:*` プロファイル ID と `auth.order.openai` を使用してください。

古い設定、認証プロファイル ID、または `auth.order.openai-codex` に `openai-codex` が表示される場合は、それをレガシー移行入力として扱い、新しい `openai-codex` プロファイルを作成しないでください。次を実行します。

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor は、レガシー `openai-codex:*` プロファイル ID と `auth.order.openai-codex` エントリを正規の `openai` ルートへ書き換えます。OpenAI 固有のモデル/ランタイムルーティングについては、[OpenAI](/ja-JP/providers/openai)を参照してください。

### ログイン中（CLI）

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id` は、同じプロバイダーに対する複数の OAuth ログインを、1 つのエージェント内で分離して保持します。

`--force` は、選択したエージェントディレクトリ内のそのプロバイダーの保存済み認証プロファイルを削除し、同じ認証フローを再実行します。保存済みプロファイルが詰まっている、期限切れになっている、または誤ったアカウントに紐づいている場合に使用します。これはプロバイダー側の認証情報を失効しません。

```bash
openclaw models auth login --provider anthropic --force
```

### セッションごと（チャットコマンド）

- `/model <alias-or-id>@<profileId>` は、現在のセッションに特定のプロバイダー認証情報を固定します（プロファイル ID の例: `anthropic:default`、`anthropic:work`）。
- `/model`（または `/model list`）はコンパクトなピッカーを表示します。`/model status` は完全なビュー（候補 + 次の認証プロファイル、設定されている場合はプロバイダーエンドポイントの詳細も含む）を表示します。

すでに実行中のチャットで認証順序やプロファイル固定を変更した場合は、`/new` または `/reset` を送信して新しいセッションを開始してください。既存のセッションは、リセットされるまで現在のモデル/プロファイル選択を保持します。

### エージェントごと（CLI 上書き）

認証順序の上書きは、そのエージェントの SQLite 認証状態に保存されます。

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

特定のエージェントを対象にするには `--agent <id>` を使用します。省略すると、設定済みのデフォルトエージェントを使用します。`openclaw models status --probe` は、省略された保存済みプロファイルを暗黙にスキップするのではなく、`excluded_by_auth_order` として表示します。

## トラブルシューティング

### 「認証情報が見つかりません」

**Gateway ホスト**に Anthropic API キーを設定するか、Anthropic setup-token 経路を設定してから、再確認します。

```bash
openclaw models status
```

### トークンの期限切れ間近/期限切れ

`openclaw models status` を実行して、どのプロファイルが期限切れ間近かを確認します。Anthropic トークンプロファイルが欠落している、または期限切れの場合は、setup-token 経由で更新するか、Anthropic API キーへ移行してください。

## 関連

- [シークレット管理](/ja-JP/gateway/secrets)
- [リモートアクセス](/ja-JP/gateway/remote)
- [認証ストレージ](/ja-JP/concepts/oauth)
