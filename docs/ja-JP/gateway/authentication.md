---
read_when:
    - モデル認証または OAuth 有効期限切れのデバッグ
    - 認証または認証情報ストレージを文書化しています
summary: 'モデル認証: OAuth、API キー、Claude CLI の再利用、Anthropic setup-token'
title: 認証
x-i18n:
    generated_at: "2026-04-24T04:55:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 371aa5a66bcec5c0271c6b7dcb0fcbb05a075f61ffd2c67616b6ea3a48f54934
    source_path: gateway/authentication.md
    workflow: 15
---

# 認証（モデルプロバイダー）

<Note>
このページでは、**モデルプロバイダー**の認証（API キー、OAuth、Claude CLI の再利用、Anthropic setup-token）を扱います。**Gateway 接続**の認証（トークン、パスワード、trusted-proxy）については、[Configuration](/ja-JP/gateway/configuration) と [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください。
</Note>

OpenClaw は、モデルプロバイダー向けに OAuth と API キーをサポートしています。常時稼働する Gateway
ホストでは、通常 API キーが最も予測しやすい選択肢です。サブスクリプション/OAuth
フローも、プロバイダーのアカウントモデルに合っていればサポートされます。

完全な OAuth フローとストレージレイアウトについては [/concepts/oauth](/ja-JP/concepts/oauth) を参照してください。
SecretRef ベースの認証（`env`/`file`/`exec` プロバイダー）については、[Secrets Management](/ja-JP/gateway/secrets) を参照してください。
`models status --probe` が使用する認証情報の適格性/理由コード規則については、
[Auth Credential Semantics](/ja-JP/auth-credential-semantics) を参照してください。

## 推奨セットアップ（API キー、任意のプロバイダー）

長期間稼働する Gateway を実行している場合は、選択した
プロバイダーの API キーから始めてください。
Anthropic に限って言えば、API キー認証が依然として最も予測しやすいサーバー
セットアップですが、OpenClaw はローカルの Claude CLI ログイン再利用もサポートしています。

1. プロバイダーのコンソールで API キーを作成します。
2. それを **Gateway ホスト**（`openclaw gateway` を実行しているマシン）に配置します。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway が systemd/launchd 配下で動作している場合は、デーモンが読み取れるように、
   キーを `~/.openclaw/.env` に置くのを推奨します。

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

その後、デーモンを再起動し（または Gateway プロセスを再起動し）、再確認します。

```bash
openclaw models status
openclaw doctor
```

env var を自分で管理したくない場合は、オンボーディングで
API キーをデーモン用に保存できます: `openclaw onboard`

env 継承（`env.shellEnv`、
`~/.openclaw/.env`、systemd/launchd）の詳細は [Help](/ja-JP/help) を参照してください。

## Anthropic: Claude CLI とトークン互換性

Anthropic setup-token 認証は、サポートされるトークン
パスとして OpenClaw で引き続き利用できます。その後、Anthropic のスタッフから、OpenClaw 形式の Claude CLI 使用は
再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、
OpenClaw はこの統合において Claude CLI の再利用と `claude -p` の使用を許可されたものとして扱います。ホスト上で
Claude CLI の再利用が利用可能な場合、現在はこちらが推奨パスです。

長期間稼働する Gateway ホストでは、Anthropic API キーが依然として最も予測しやすい
セットアップです。同じホスト上の既存の Claude ログインを再利用したい場合は、
オンボーディング/設定内の Anthropic Claude CLI パスを使用してください。

Claude CLI 再利用の推奨ホストセットアップ:

```bash
# Gateway ホスト上で実行
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

これは 2 ステップのセットアップです。

1. Gateway ホスト上で Claude Code 自体を Anthropic にログインさせる。
2. OpenClaw に、Anthropic のモデル選択をローカルの `claude-cli`
   バックエンドへ切り替え、一致する OpenClaw auth profile を保存するよう伝える。

`claude` が `PATH` 上にない場合は、先に Claude Code をインストールするか、
`agents.defaults.cliBackends.claude-cli.command` を実際のバイナリパスに設定してください。

手動トークン入力（任意のプロバイダー。`auth-profiles.json` に書き込み + config を更新）:

```bash
openclaw models auth paste-token --provider openrouter
```

静的認証情報では auth profile ref もサポートされます。

- `api_key` 認証情報は `keyRef: { source, provider, id }` を使用できます
- `token` 認証情報は `tokenRef: { source, provider, id }` を使用できます
- OAuth モードのプロファイルは SecretRef 認証情報をサポートしません。`auth.profiles.<id>.mode` が `"oauth"` に設定されている場合、そのプロファイルへの SecretRef ベースの `keyRef`/`tokenRef` 入力は拒否されます。

自動化向けチェック（期限切れ/欠落で終了コード `1`、期限切れ間近で `2`）:

```bash
openclaw models status --check
```

ライブ認証プローブ:

```bash
openclaw models status --probe
```

注意:

- プローブ行は、auth profiles、env 認証情報、または `models.json` から取得されることがあります。
- 明示的な `auth.order.<provider>` に保存済みプロファイルが含まれていない場合、
  プローブはそのプロファイルを試す代わりに
  `excluded_by_auth_order` を報告します。
- 認証は存在しても、そのプロバイダーに対して OpenClaw がプローブ可能なモデル候補を解決できない場合、
  プローブは `status: no_model` を報告します。
- レート制限クールダウンはモデル単位であることがあります。ある
  モデルでクールダウン中のプロファイルでも、同じプロバイダー上の別の兄弟モデルではまだ使用可能な場合があります。

任意の運用スクリプト（systemd/Termux）については、ここに記載されています:
[認証監視スクリプト](/ja-JP/help/scripts#auth-monitoring-scripts)

## Anthropic に関する注記

Anthropic の `claude-cli` バックエンドは再びサポートされています。

- Anthropic のスタッフから、この OpenClaw 統合パスは再び許可されていると伝えられました。
- そのため OpenClaw は、Anthropic が新しいポリシーを公開しない限り、
  Anthropic バックの実行に対して Claude CLI の再利用と `claude -p` の使用を許可されたものとして扱います。
- Anthropic API キーは、長期間稼働する Gateway
  ホストと、明示的なサーバー側課金制御にとって、依然として最も予測しやすい選択肢です。

## モデル認証状態の確認

```bash
openclaw models status
openclaw doctor
```

## API キーローテーション動作（Gateway）

一部のプロバイダーは、API 呼び出しがプロバイダーのレート制限に達したとき、
代替キーでのリトライをサポートしています。

- 優先順位:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一上書き）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 系プロバイダーには、追加フォールバックとして `GOOGLE_API_KEY` も含まれます。
- 同じキー一覧は使用前に重複排除されます。
- OpenClaw は、レート制限エラーの場合にのみ次のキーでリトライします（例:
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached`、または
  `workers_ai ... quota limit exceeded`）。
- レート制限以外のエラーでは、代替キーでリトライしません。
- すべてのキーが失敗した場合、最後の試行の最終エラーが返されます。

## 使用する認証情報を制御する

### セッションごと（チャットコマンド）

`/model <alias-or-id>@<profileId>` を使用して、現在のセッションに特定のプロバイダー認証情報を固定します（プロファイル ID の例: `anthropic:default`、`anthropic:work`）。

コンパクトな picker には `/model`（または `/model list`）を、完全な表示（候補 + 次の auth profile、および設定されていればプロバイダー endpoint 詳細）には `/model status` を使用します。

### エージェントごと（CLI 上書き）

エージェントに明示的な auth profile order 上書きを設定します（そのエージェントの `auth-state.json` に保存されます）。

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

特定のエージェントを対象にするには `--agent <id>` を使用し、設定済みのデフォルトエージェントを使う場合は省略します。
順序の問題をデバッグするときは、`openclaw models status --probe` により、省略された
保存済みプロファイルは黙ってスキップされるのではなく `excluded_by_auth_order` として表示されます。
クールダウン問題をデバッグするときは、レート制限クールダウンが
プロバイダープロファイル全体ではなく 1 つのモデル ID に結び付くことがある点に注意してください。

## トラブルシューティング

### 「認証情報が見つかりません」

Anthropic プロファイルが見つからない場合は、**Gateway ホスト**上で
Anthropic API キーを設定するか、Anthropic setup-token パスをセットアップしてから、再確認してください。

```bash
openclaw models status
```

### トークンが期限切れ間近/期限切れ

どのプロファイルが期限切れ間近かを確認するには `openclaw models status` を実行します。Anthropic の
トークンプロファイルが見つからない、または期限切れの場合は、
setup-token でそのセットアップを更新するか、Anthropic API キーへ移行してください。

## 関連

- [Secrets management](/ja-JP/gateway/secrets)
- [Remote access](/ja-JP/gateway/remote)
- [Auth storage](/ja-JP/concepts/oauth)
