---
read_when:
    - モデル認証またはOAuthの有効期限切れのデバッグ
    - 認証または認証情報ストレージの文書化
summary: 'モデル認証: OAuth、APIキー、Claude CLIの再利用、およびAnthropicのセットアップトークン'
title: 認証
x-i18n:
    generated_at: "2026-04-23T15:00:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a7c20872b915d1d079f0578c933e43cbdb97eca1c60d8c4e6e5137ca83f8b2
    source_path: gateway/authentication.md
    workflow: 15
---

# 認証（モデルプロバイダー）

<Note>
このページでは、**モデルプロバイダー**の認証（APIキー、OAuth、Claude CLIの再利用、およびAnthropicのセットアップトークン）を扱います。**Gateway接続**の認証（トークン、パスワード、trusted-proxy）については、[Configuration](/ja-JP/gateway/configuration)および[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth)を参照してください。
</Note>

OpenClawは、モデルプロバイダー向けにOAuthとAPIキーをサポートしています。常時稼働するGatewayホストでは、通常、APIキーが最も予測しやすい選択肢です。プロバイダーのアカウントモデルに合っていれば、サブスクリプション/OAuthフローもサポートされています。

OAuthフロー全体とストレージレイアウトについては、[/concepts/oauth](/ja-JP/concepts/oauth)を参照してください。
SecretRefベースの認証（`env`/`file`/`exec`プロバイダー）については、[Secrets Management](/ja-JP/gateway/secrets)を参照してください。
`models status --probe`で使用される認証情報の適格性/理由コードのルールについては、
[Auth Credential Semantics](/ja-JP/auth-credential-semantics)を参照してください。

## 推奨セットアップ（APIキー、任意のプロバイダー）

長期間稼働するGatewayを運用している場合は、選択したプロバイダーのAPIキーから始めてください。
Anthropicについては、APIキー認証が依然として最も予測しやすいサーバーセットアップですが、OpenClawはローカルのClaude CLIログインの再利用もサポートしています。

1. プロバイダーのコンソールでAPIキーを作成します。
2. それを**Gatewayホスト**（`openclaw gateway`を実行しているマシン）に配置します。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gatewayがsystemd/launchdの下で動作している場合は、デーモンが読み取れるように、キーを`~/.openclaw/.env`に配置することを推奨します。

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

その後、デーモンを再起動し（またはGatewayプロセスを再起動し）、再確認します。

```bash
openclaw models status
openclaw doctor
```

環境変数を自分で管理したくない場合は、オンボーディングで
デーモン用のAPIキーを保存できます: `openclaw onboard`。

`env`の継承（`env.shellEnv`、
`~/.openclaw/.env`、systemd/launchd）について詳しくは、[Help](/ja-JP/help)を参照してください。

## Anthropic: Claude CLIとトークンの互換性

Anthropicのセットアップトークン認証は、OpenClawでサポートされているトークン経路として引き続き利用可能です。その後、Anthropicのスタッフから、OpenClawスタイルのClaude CLI使用は再び許可されていると伝えられたため、Anthropicが新しいポリシーを公開しない限り、OpenClawはこの統合においてClaude CLIの再利用と`claude -p`の使用を許可されたものとして扱います。ホストでClaude CLIの再利用が可能な場合、現在はそれが推奨経路です。

長期間稼働するGatewayホストでは、Anthropic APIキーが依然として最も予測しやすいセットアップです。同じホスト上で既存のClaudeログインを再利用したい場合は、オンボーディング/設定でAnthropic Claude CLI経路を使用してください。

Claude CLI再利用の推奨ホストセットアップ:

```bash
# Gatewayホストで実行
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

これは2段階のセットアップです。

1. Gatewayホスト上でClaude Code自体をAnthropicにログインさせます。
2. Anthropicモデルの選択をローカルの`claude-cli`
   バックエンドに切り替え、対応するOpenClaw認証プロファイルを保存するようOpenClawに指示します。

`claude`が`PATH`上にない場合は、まずClaude Codeをインストールするか、
`agents.defaults.cliBackends.claude-cli.command`を実際のバイナリパスに設定してください。

手動トークン入力（任意のプロバイダー; `auth-profiles.json`に書き込み + 設定を更新）:

```bash
openclaw models auth paste-token --provider openrouter
```

静的な認証情報向けに認証プロファイル参照もサポートされています。

- `api_key`認証情報は`keyRef: { source, provider, id }`を使用できます
- `token`認証情報は`tokenRef: { source, provider, id }`を使用できます
- OAuthモードのプロファイルはSecretRef認証情報をサポートしません。`auth.profiles.<id>.mode`が`"oauth"`に設定されている場合、そのプロファイルに対するSecretRefベースの`keyRef`/`tokenRef`入力は拒否されます。

自動化向けチェック（期限切れ/未設定で終了コード`1`、期限が近い場合は`2`）:

```bash
openclaw models status --check
```

ライブ認証プローブ:

```bash
openclaw models status --probe
```

注意:

- プローブ行は、認証プロファイル、環境変数の認証情報、または`models.json`から取得される場合があります。
- 明示的な`auth.order.<provider>`に保存済みプロファイルが含まれていない場合、
  プローブはそのプロファイルを試行せず、`excluded_by_auth_order`を
  そのプロファイルに対して報告します。
- 認証が存在しても、そのプロバイダーに対してプローブ可能なモデル候補をOpenClawが解決できない場合、
  プローブは`status: no_model`を報告します。
- レート制限のクールダウンはモデル単位の場合があります。ある
  モデルでクールダウン中のプロファイルでも、同じプロバイダー上の兄弟モデルでは引き続き使用可能な場合があります。

オプションの運用スクリプト（systemd/Termux）については、こちらに記載されています:
[認証監視スクリプト](/ja-JP/help/scripts#auth-monitoring-scripts)

## Anthropicに関する注記

Anthropicの`claude-cli`バックエンドは再びサポートされています。

- Anthropicのスタッフから、このOpenClaw統合経路は再び許可されていると伝えられました。
- そのためOpenClawは、Anthropicが新しいポリシーを公開しない限り、Anthropicをバックエンドとする実行においてClaude CLIの再利用と`claude -p`の使用を許可されたものとして扱います。
- Anthropic APIキーは、長期間稼働するGateway
  ホストおよび明示的なサーバー側課金管理のための最も予測しやすい選択肢であり続けます。

## モデル認証ステータスの確認

```bash
openclaw models status
openclaw doctor
```

## APIキーのローテーション動作（gateway）

一部のプロバイダーでは、API呼び出しがプロバイダーのレート制限に達した際に、別のキーでリクエストを再試行することをサポートしています。

- 優先順:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一の上書き）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Googleプロバイダーでは、追加のフォールバックとして`GOOGLE_API_KEY`も含まれます。
- 同じキーの一覧は、使用前に重複排除されます。
- OpenClawは、レート制限エラーの場合にのみ次のキーで再試行します（例:
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached`、または
  `workers_ai ... quota limit exceeded`）。
- レート制限以外のエラーでは、代替キーによる再試行は行われません。
- すべてのキーが失敗した場合は、最後の試行で発生した最終エラーが返されます。

## 使用する認証情報の制御

### セッション単位（チャットコマンド）

現在のセッションで特定のプロバイダー認証情報を固定するには、`/model <alias-or-id>@<profileId>`を使用します（プロファイルIDの例: `anthropic:default`、`anthropic:work`）。

コンパクトなピッカーには`/model`（または`/model list`）を使用します。完全な表示（候補 + 次の認証プロファイル、および設定されている場合はプロバイダーのエンドポイント詳細）には`/model status`を使用します。

### エージェント単位（CLI上書き）

エージェントに対する明示的な認証プロファイル順序の上書きを設定します（そのエージェントの`auth-state.json`に保存されます）。

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

特定のエージェントを対象にするには`--agent <id>`を使用し、設定済みのデフォルトエージェントを使う場合は省略します。
順序の問題をデバッグする際、`openclaw models status --probe`は省略された
保存済みプロファイルを黙ってスキップする代わりに`excluded_by_auth_order`として表示します。
クールダウンの問題をデバッグする際は、レート制限のクールダウンが
プロバイダープロファイル全体ではなく、1つのモデルIDに結び付けられている場合があることを忘れないでください。

## トラブルシューティング

### 「認証情報が見つかりません」

Anthropicプロファイルが存在しない場合は、
**Gatewayホスト**上でAnthropic APIキーを設定するか、Anthropicのセットアップトークン経路を設定してから、再確認してください。

```bash
openclaw models status
```

### トークンの有効期限が近い/期限切れ

どのプロファイルの有効期限が近いかを確認するには、`openclaw models status`を実行します。Anthropicトークンプロファイルが存在しない、または期限切れの場合は、
setup-tokenでそのセットアップを更新するか、Anthropic APIキーに移行してください。
