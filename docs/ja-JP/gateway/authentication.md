---
read_when:
    - モデル認証または OAuth の有効期限切れのデバッグ
    - 認証または認証情報の保存の文書化
summary: 'モデル認証: OAuth、API キー、Claude CLI の再利用、Anthropic setup-token'
title: 認証
x-i18n:
    generated_at: "2026-05-07T13:16:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95ac66b4771ee4058f81294b54b345d9bf688da9d985e45e056547c9d395d37
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
このページは、**モデルプロバイダー**認証のリファレンスです（API キー、OAuth、Claude CLI の再利用、Anthropic setup-token）。**Gateway 接続**認証（トークン、パスワード、trusted-proxy）については、[設定](/ja-JP/gateway/configuration)と[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。
</Note>

OpenClaw はモデルプロバイダー向けに OAuth と API キーをサポートします。常時稼働の Gateway
ホストでは、通常 API キーが最も予測しやすい選択肢です。サブスクリプション/OAuth
フローも、プロバイダーアカウントモデルに合う場合はサポートされます。

OAuth フロー全体とストレージ
レイアウトについては、[/concepts/oauth](/ja-JP/concepts/oauth)を参照してください。
SecretRef ベースの認証（`env`/`file`/`exec` プロバイダー）については、[シークレット管理](/ja-JP/gateway/secrets)を参照してください。
`models status --probe` で使われる資格情報の適格性/理由コードのルールについては、
[認証資格情報のセマンティクス](/ja-JP/auth-credential-semantics)を参照してください。

## 推奨セットアップ（API キー、任意のプロバイダー）

長期間稼働する Gateway を実行している場合は、選択した
プロバイダーの API キーから始めてください。
Anthropic に限ると、API キー認証は今でも最も予測しやすいサーバー
セットアップですが、OpenClaw はローカルの Claude CLI ログインの再利用もサポートします。

1. プロバイダーコンソールで API キーを作成します。
2. それを **Gateway ホスト**（`openclaw gateway` を実行するマシン）に置きます。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway が systemd/launchd の下で実行される場合は、デーモンが読み取れるように、
   キーを `~/.openclaw/.env` に置くことを推奨します。

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

その後、デーモン（または Gateway プロセス）を再起動し、再確認します。

```bash
openclaw models status
openclaw doctor
```

env var を自分で管理したくない場合、オンボーディングでデーモン用の
API キーを保存できます: `openclaw onboard`。

env 継承（`env.shellEnv`、
`~/.openclaw/.env`、systemd/launchd）の詳細は[ヘルプ](/ja-JP/help)を参照してください。

## Anthropic: Claude CLI とトークン互換性

Anthropic setup-token 認証は、サポートされるトークン
経路として OpenClaw で引き続き利用できます。Anthropic スタッフはその後、OpenClaw スタイルの Claude CLI 使用が
再び許可されたと伝えてきたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの統合について Claude CLI の再利用と `claude -p` の使用を
認可済みとして扱います。ホストで
Claude CLI の再利用が利用できる場合は、それが現在の推奨経路です。

長期間稼働する Gateway ホストでは、Anthropic API キーが今でも最も予測しやすい
セットアップです。同じホスト上の既存の Claude ログインを再利用したい場合は、オンボーディング/設定で
Anthropic Claude CLI 経路を使用してください。

Claude CLI 再利用の推奨ホストセットアップ:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

これは 2 段階のセットアップです。

1. Gateway ホスト上で Claude Code 自体を Anthropic にログインさせます。
2. Anthropic モデル選択をローカルの `claude-cli`
   バックエンドに切り替え、一致する OpenClaw 認証プロファイルを保存するよう OpenClaw に指示します。

`claude` が `PATH` 上にない場合は、先に Claude Code をインストールするか、
`agents.defaults.cliBackends.claude-cli.command` を実際のバイナリパスに設定してください。

手動トークン入力（任意のプロバイダー。`auth-profiles.json` に書き込み、config を更新）:

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` は資格情報のみを保存します。正規形状は次のとおりです。

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

OpenClaw は実行時に正規の `version` + `profiles` 形状を期待します。古いインストールに `{ "openrouter": { "apiKey": "..." } }` のようなフラットファイルがまだある場合は、`openclaw doctor --fix` を実行して `openrouter:default` API キープロファイルとして書き換えてください。doctor は元ファイルの横に `.legacy-flat.*.bak` コピーを保持します。`baseUrl`、`api`、モデル ID、ヘッダー、タイムアウトなどのエンドポイント詳細は、`auth-profiles.json` ではなく、`openclaw.json` または `models.json` の `models.providers.<id>` の下に置きます。

Bedrock の `auth: "aws-sdk"` のような外部認証ルートも資格情報ではありません。名前付きの Bedrock ルートが必要な場合は、`openclaw.json` に `auth.profiles.<id>.mode: "aws-sdk"` を置いてください。`auth-profiles.json` に `type: "aws-sdk"` を書かないでください。`openclaw doctor --fix` はレガシー AWS SDK マーカーを資格情報ストアから config メタデータへ移動します。

認証プロファイル参照は静的資格情報にも対応しています。

- `api_key` 資格情報は `keyRef: { source, provider, id }` を使用できます
- `token` 資格情報は `tokenRef: { source, provider, id }` を使用できます
- OAuth モードのプロファイルは SecretRef 資格情報をサポートしません。`auth.profiles.<id>.mode` が `"oauth"` に設定されている場合、そのプロファイルに対する SecretRef ベースの `keyRef`/`tokenRef` 入力は拒否されます。

自動化しやすいチェック（期限切れ/欠落時は終了 `1`、期限切れ間近は `2`）:

```bash
openclaw models status --check
```

ライブ認証プローブ:

```bash
openclaw models status --probe
```

注:

- プローブ行は、認証プロファイル、env 資格情報、または `models.json` から来ることがあります。
- 明示的な `auth.order.<provider>` が保存済みプロファイルを省略している場合、プローブはそのプロファイルを試行する代わりに
  `excluded_by_auth_order` を報告します。
- 認証は存在するが OpenClaw がそのプロバイダーについてプローブ可能なモデル候補を解決できない場合、プローブは `status: no_model` を報告します。
- レート制限クールダウンはモデル単位の場合があります。ある
  モデルでクールダウン中のプロファイルでも、同じプロバイダー上の兄弟モデルにはまだ使用できる場合があります。

任意の運用スクリプト（systemd/Termux）はここに記載されています。
[認証監視スクリプト](/ja-JP/help/scripts#auth-monitoring-scripts)

## Anthropic に関する注記

Anthropic `claude-cli` バックエンドは再びサポートされています。

- Anthropic スタッフは、この OpenClaw 統合経路が再び許可されたと伝えてきました。
- そのため OpenClaw は、Anthropic が新しいポリシーを公開しない限り、Anthropic バックエンドの実行について Claude CLI の再利用と `claude -p` の使用を認可済みとして扱います。
- Anthropic API キーは、長期間稼働する Gateway
  ホストと明示的なサーバー側課金制御にとって、引き続き最も予測しやすい選択肢です。

## モデル認証ステータスの確認

```bash
openclaw models status
openclaw doctor
```

## API キーのローテーション動作（Gateway）

一部のプロバイダーは、API 呼び出しがプロバイダーのレート制限に
達したとき、代替キーでリクエストを再試行することをサポートしています。

- 優先順位:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一の上書き）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google プロバイダーでは、追加のフォールバックとして `GOOGLE_API_KEY` も含まれます。
- 同じキーリストは使用前に重複排除されます。
- OpenClaw は、レート制限エラーの場合にのみ次のキーで再試行します（たとえば
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached`、または
  `workers_ai ... quota limit exceeded`）。
- レート制限以外のエラーでは代替キーで再試行しません。
- すべてのキーが失敗した場合は、最後の試行からの最終エラーが返されます。

## 使用する資格情報の制御

### セッションごと（チャットコマンド）

現在のセッションで特定のプロバイダー資格情報を固定するには、`/model <alias-or-id>@<profileId>` を使用します（プロファイル ID の例: `anthropic:default`、`anthropic:work`）。

コンパクトなピッカーには `/model`（または `/model list`）を使用し、完全な表示（候補 + 次の認証プロファイル、設定済みの場合はプロバイダーエンドポイント詳細も）には `/model status` を使用します。

### エージェントごと（CLI 上書き）

エージェントの明示的な認証プロファイル順序の上書きを設定します（そのエージェントの `auth-state.json` に保存されます）。

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

特定のエージェントを対象にするには `--agent <id>` を使用します。省略すると、設定済みのデフォルトエージェントが使用されます。
順序の問題をデバッグするとき、`openclaw models status --probe` は保存済みプロファイルが省略されている場合、黙ってスキップする代わりに
`excluded_by_auth_order` として表示します。
クールダウンの問題をデバッグするときは、レート制限クールダウンがプロバイダープロファイル全体ではなく、1 つのモデル ID に紐づく場合があることを覚えておいてください。

## トラブルシューティング

### 「No credentials found」

Anthropic プロファイルが欠落している場合は、**Gateway ホスト**に Anthropic API キーを設定するか、Anthropic setup-token 経路をセットアップしてから再確認してください。

```bash
openclaw models status
```

### トークンの期限切れ間近/期限切れ

どのプロファイルが期限切れ間近かを確認するには、`openclaw models status` を実行します。
Anthropic トークンプロファイルが欠落しているか期限切れの場合は、setup-token でそのセットアップを更新するか、Anthropic API キーへ移行してください。

## 関連

- [シークレット管理](/ja-JP/gateway/secrets)
- [リモートアクセス](/ja-JP/gateway/remote)
- [認証ストレージ](/ja-JP/concepts/oauth)
