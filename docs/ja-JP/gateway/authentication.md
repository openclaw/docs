---
read_when:
    - モデル認証または OAuth の有効期限切れのデバッグ
    - 認証または認証情報の保存についての文書化
summary: モデル認証：OAuth、API キー、Claude CLI の再利用、Anthropic セットアップトークン
title: 認証
x-i18n:
    generated_at: "2026-07-11T22:14:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
このページでは、**モデルプロバイダー**の認証（API キー、OAuth、Claude CLI の再利用、Anthropic setup-token）について説明します。**Gateway 接続**の認証（トークン、パスワード、trusted-proxy）については、[設定](/ja-JP/gateway/configuration)および[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。
</Note>

OpenClaw は、モデルプロバイダー向けに OAuth と API キーをサポートしています。常時稼働する Gateway ホストでは、API キーが最も予測可能な選択肢です。サブスクリプション/OAuth フローも、プロバイダーアカウントのモデルと一致する場合は使用できます。

- OAuth フロー全体とストレージ構成：[/concepts/oauth](/ja-JP/concepts/oauth)
- SecretRef ベースの認証（`env`/`file`/`exec`プロバイダー）：[シークレット管理](/ja-JP/gateway/secrets)
- `models status --probe`で使用される認証情報の適格性/理由コード：[認証情報のセマンティクス](/ja-JP/auth-credential-semantics)

## 推奨設定：API キー（任意のプロバイダー）

1. プロバイダーのコンソールで API キーを作成します。
2. そのキーを**Gateway ホスト**（`openclaw gateway`を実行しているマシン）に設定します。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway が systemd/launchd で動作している場合は、デーモンが読み取れるようにキーを`~/.openclaw/.env`に設定します。

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. Gateway プロセス（またはデーモン）を再起動し、再確認します。

```bash
openclaw models status
openclaw doctor
```

環境変数を自分で管理したくない場合は、`openclaw onboard`でデーモン用の API キーを保存することもできます。環境変数の読み込み優先順位（`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd）の全容については、[環境変数](/ja-JP/help/environment)を参照してください。

## Anthropic：Claude CLI の再利用

Anthropic setup-token 認証は、引き続きサポートされる方法です。この連携では Claude CLI の再利用（`claude -p`形式の使用）も正式に認められており、ホスト上で Claude CLI のログインが利用できる場合、ローカル/デスクトップでの使用にはこれが推奨されます。長期間稼働する Gateway ホストでは、サーバー側の課金を明示的に制御できる Anthropic API キーが、引き続き最も予測可能な選択肢です。

Claude CLI を再利用するためのホスト設定：

```bash
# Gateway ホストで実行
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

これは 2 段階の手順です。まずホスト上の Claude Code を Anthropic にログインさせ、次に Anthropic モデルの選択をローカルの`claude-cli`バックエンド経由にするよう OpenClaw に指示し、対応する OpenClaw 認証プロファイルを保存します。

`claude`が`PATH`にない場合は、Claude Code をインストールするか、`agents.defaults.cliBackends.claude-cli.command`をバイナリのパスに設定します。

## トークンの手動入力

すべてのプロバイダーで使用でき、エージェント単位の SQLite 認証ストアへの書き込みと設定の更新を行います。

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw は、各エージェントの`openclaw-agent.sqlite`から認証プロファイルを読み取ります。エンドポイントの詳細（`baseUrl`、`api`、モデル ID、ヘッダー、タイムアウト）は、認証プロファイルではなく、`openclaw.json`または`models.json`の`models.providers.<id>`に設定します。

古いインストールに`auth-profiles.json`、`auth-state.json`、または`{ "openrouter": { "apiKey": "..." } }`のようなフラットな形式が残っている場合は、`openclaw doctor --fix`を実行して SQLite にインポートします。doctor は元の JSON ファイルと同じ場所に、タイムスタンプ付きのバックアップを保持します。

Bedrock の`auth: "aws-sdk"`のような外部認証ルートは認証情報ではありません。名前付き Bedrock ルートでは、`openclaw.json`の`auth.profiles.<id>.mode: "aws-sdk"`を設定してください。認証プロファイルストアに`type: "aws-sdk"`を書き込まないでください。`openclaw doctor --fix`は、従来の AWS SDK マーカーを認証情報ストアから設定メタデータへ移行します。

### SecretRef を使用する認証情報

- `api_key`認証情報では、`keyRef: { source, provider, id }`を使用できます
- `token`認証情報では、`tokenRef: { source, provider, id }`を使用できます
- OAuth モードのプロファイルでは SecretRef 認証情報は拒否されます。`auth.profiles.<id>.mode`が`"oauth"`の場合、そのプロファイルに SecretRef を使用した`keyRef`/`tokenRef`を設定すると拒否されます。

## モデル認証状態の確認

```bash
openclaw models status
openclaw doctor
```

自動化に適した確認方法です。期限切れ/欠落時は終了コード`1`、期限切れ間近の場合は`2`になります。

```bash
openclaw models status --check
```

認証のライブプローブ（範囲を絞るには、`--probe-provider`、`--probe-profile`、`--probe-timeout`、`--probe-concurrency`、または`--probe-max-tokens`を追加）：

```bash
openclaw models status --probe
```

注意事項：

- プローブ行の情報源には、認証プロファイル、環境変数の認証情報、または`models.json`があります。
- `auth.order.<provider>`に保存済みプロファイルが含まれていない場合、プローブはそのプロファイルを試行せず、`excluded_by_auth_order`を報告します。
- 認証情報が存在していても、OpenClaw がそのプロバイダーでプローブ可能なモデルを解決できない場合、プローブは`status: no_model`を報告します。
- レート制限のクールダウンはモデル単位で適用される場合があります。あるモデルでクールダウン中のプロファイルでも、同じプロバイダー上の別のモデルには引き続き使用できます。

任意の運用スクリプト（systemd/Termux）：[認証監視スクリプト](/ja-JP/help/scripts#auth-monitoring-scripts)。

## API キーのローテーション（Gateway）

一部のプロバイダーでは、呼び出しがプロバイダーのレート制限に達すると、設定済みの別のキーを使用してリクエストを再試行します。

プロバイダーごとのキーの優先順位：

1. `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一の上書き。1 つのキーに固定）
2. `<PROVIDER>_API_KEYS`（カンマ/空白/セミコロン区切りのリスト）
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*`（この接頭辞を持つ任意の環境変数）

Google プロバイダー（`google`、`google-vertex`）では、さらに`GOOGLE_API_KEY`へフォールバックします。結合されたリストは、使用前に重複が除去されます。

OpenClaw が次のキーへローテーションするのは、エラーメッセージが`rate_limit`、`rate limit`、`429`、`quota exceeded`/`quota_exceeded`、`resource exhausted`/`resource_exhausted`、または`too many requests`に一致する場合のみです。それ以外のエラーでは、別のキーを使用した再試行は行われません。すべてのキーで失敗した場合は、最後の試行で発生した最終エラーが返されます。

<Note>
`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`のようなプロバイダー固有の表現は、**フェイルオーバー/再試行の分類**（繰り返し失敗したときのモデルまたはプロバイダーの切り替え）に使用されます。これは、前述の API キーローテーションとは別の仕組みです。
</Note>

保存済みの認証情報を削除しても、プロバイダー側のキーは失効しません。プロバイダー側で無効化する必要がある場合は、プロバイダーのダッシュボードでキーをローテーションまたは失効させてください。

## Gateway の実行中にプロバイダー認証を削除する

Gateway のコントロールプレーンを介してプロバイダー認証を削除すると、OpenClaw はそのプロバイダーの保存済み認証プロファイルを削除し、選択されているモデルプロバイダーが削除対象と一致する、実行中のチャット/エージェント処理を中断します。中断された処理は、`stopReason: "auth-revoked"`を含む通常のキャンセル/ライフサイクルイベントを送出するため、接続中のクライアントは認証情報が削除されたため処理が停止したことを表示できます。

## 使用する認証情報の制御

### OpenAI と従来の`openai-codex` ID

OpenAI API キープロファイルと ChatGPT/Codex OAuth プロファイルは、どちらも正規のプロバイダー ID`openai`を使用します。新しい設定では、`openai:*`プロファイル ID と`auth.order.openai`を使用してください。

古い設定、認証プロファイル ID、または`auth.order.openai-codex`に`openai-codex`がある場合は、従来形式の移行入力として扱い、新しい`openai-codex`プロファイルを作成しないでください。次を実行します。

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

doctor は、従来の`openai-codex:*`プロファイル ID と`auth.order.openai-codex`エントリを、正規の`openai`ルートへ書き換えます。OpenAI 固有のモデル/ランタイムルーティングについては、[OpenAI](/ja-JP/providers/openai)を参照してください。

### ログイン時（CLI）

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id`を使用すると、同じプロバイダーに対する複数の OAuth ログインを、1 つのエージェント内で個別に保持できます。

`--force`は、選択したエージェントディレクトリ内に保存されている、そのプロバイダーの認証プロファイルを削除してから、同じ認証フローを再実行します。保存済みプロファイルが処理不能、期限切れ、または誤ったアカウントに関連付けられている場合に使用します。プロバイダー側の認証情報は失効しません。

```bash
openclaw models auth login --provider anthropic --force
```

### セッション単位（チャットコマンド）

- `/model <alias-or-id>@<profileId>`は、現在のセッションで特定のプロバイダー認証情報を固定します（プロファイル ID の例：`anthropic:default`、`anthropic:work`）。
- `/model`（または`/model list`）はコンパクトな選択画面を表示し、`/model status`は完全なビュー（候補と次の認証プロファイル、および設定されている場合はプロバイダーのエンドポイント詳細）を表示します。

すでに実行中のチャットに対して認証順序またはプロファイルの固定を変更した場合は、`/new`または`/reset`を送信して新しいセッションを開始してください。既存のセッションでは、リセットされるまで現在のモデル/プロファイルの選択が維持されます。

### エージェント単位（CLI による上書き）

認証順序の上書きは、そのエージェントの SQLite 認証状態に保存されます。

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

特定のエージェントを対象にするには`--agent <id>`を使用します。省略すると、設定済みのデフォルトエージェントが使用されます。`openclaw models status --probe`は、除外された保存済みプロファイルを暗黙にスキップするのではなく、`excluded_by_auth_order`として表示します。

## トラブルシューティング

### 「認証情報が見つかりません」

**Gateway ホスト**に Anthropic API キーを設定するか、Anthropic setup-token の経路を設定してから、再確認します。

```bash
openclaw models status
```

### トークンが期限切れ間近/期限切れ

`openclaw models status`を実行して、どのプロファイルが期限切れ間近かを確認します。Anthropic トークンプロファイルが欠落しているか期限切れの場合は、setup-token を使用して更新するか、Anthropic API キーへ移行してください。

## 関連項目

- [シークレット管理](/ja-JP/gateway/secrets)
- [リモートアクセス](/ja-JP/gateway/remote)
- [認証ストレージ](/ja-JP/concepts/oauth)
