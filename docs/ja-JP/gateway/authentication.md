---
read_when:
    - モデル認証または OAuth の有効期限切れをデバッグする
    - 認証または認証情報の保存を文書化する
summary: 'モデル認証: OAuth、APIキー、Claude CLI の再利用、Anthropic setup-token'
title: 認証
x-i18n:
    generated_at: "2026-04-30T05:11:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
このページは、**モデルプロバイダー**認証のリファレンスです（APIキー、OAuth、Claude CLI の再利用、Anthropic setup-token）。**Gateway 接続**認証（トークン、パスワード、trusted-proxy）については、[設定](/ja-JP/gateway/configuration)と[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。
</Note>

OpenClaw はモデルプロバイダー向けに OAuth と APIキーをサポートしています。常時稼働の Gateway
ホストでは、通常 APIキーが最も予測しやすい選択肢です。サブスクリプション/OAuth
フローも、プロバイダーアカウントモデルに合う場合はサポートされています。

OAuth フロー全体とストレージ
レイアウトについては、[/concepts/oauth](/ja-JP/concepts/oauth)を参照してください。
SecretRef ベースの認証（`env`/`file`/`exec` プロバイダー）については、[シークレット管理](/ja-JP/gateway/secrets)を参照してください。
`models status --probe` で使われる認証情報の適格性/理由コードのルールについては、
[認証情報セマンティクス](/ja-JP/auth-credential-semantics)を参照してください。

## 推奨セットアップ（APIキー、任意のプロバイダー）

長期間稼働する Gateway を実行している場合は、選択した
プロバイダーの APIキーから始めてください。
Anthropic については特に、APIキー認証が今も最も予測しやすいサーバー
セットアップですが、OpenClaw はローカルの Claude CLI ログインの再利用もサポートしています。

1. プロバイダーコンソールで APIキーを作成します。
2. それを**Gateway ホスト**（`openclaw gateway` を実行しているマシン）に配置します。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway が systemd/launchd の下で動作している場合は、デーモンが読み取れるように
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

環境変数を自分で管理したくない場合は、オンボーディングでデーモン用の
APIキーを保存できます: `openclaw onboard`。

環境継承（`env.shellEnv`、
`~/.openclaw/.env`、systemd/launchd）の詳細については、[ヘルプ](/ja-JP/help)を参照してください。

## Anthropic: Claude CLI とトークン互換性

Anthropic setup-token 認証は、サポート済みのトークン
パスとして OpenClaw で引き続き利用できます。その後 Anthropic のスタッフから、OpenClaw スタイルの Claude CLI 利用は
再び許可されたと伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの統合における Claude CLI の再利用と `claude -p` の使用を
認可済みとして扱います。ホストで
Claude CLI の再利用が可能な場合、現在はそのパスが推奨されます。

長期間稼働する Gateway ホストでは、Anthropic APIキーが今も最も予測しやすい
セットアップです。同じホスト上の既存の Claude ログインを再利用したい場合は、オンボーディング/設定で
Anthropic Claude CLI パスを使用してください。

Claude CLI 再利用の推奨ホストセットアップ:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

これは2段階のセットアップです。

1. Gateway ホストで Claude Code 自体を Anthropic にログインさせます。
2. Anthropic モデル選択をローカルの `claude-cli`
   バックエンドに切り替え、一致する OpenClaw 認証プロファイルを保存するよう OpenClaw に指示します。

`claude` が `PATH` 上にない場合は、先に Claude Code をインストールするか、
`agents.defaults.cliBackends.claude-cli.command` を実際のバイナリパスに設定します。

手動トークン入力（任意のプロバイダー。`auth-profiles.json` を書き込み、設定を更新します）:

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` は認証情報のみを保存します。標準の形は次のとおりです。

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

OpenClaw は実行時に標準の `version` + `profiles` 形を想定します。古いインストールに `{ "openrouter": { "apiKey": "..." } }` のようなフラットファイルがまだある場合は、`openclaw doctor --fix` を実行して `openrouter:default` APIキー プロファイルに書き換えてください。doctor は元のファイルの隣に `.legacy-flat.*.bak` コピーを保持します。`baseUrl`、`api`、モデル ID、ヘッダー、タイムアウトなどのエンドポイント詳細は、`auth-profiles.json` ではなく、`openclaw.json` または `models.json` の `models.providers.<id>` の下に置きます。

静的認証情報では、認証プロファイル参照もサポートされています。

- `api_key` 認証情報は `keyRef: { source, provider, id }` を使用できます
- `token` 認証情報は `tokenRef: { source, provider, id }` を使用できます
- OAuth モードのプロファイルは SecretRef 認証情報をサポートしません。`auth.profiles.<id>.mode` が `"oauth"` に設定されている場合、そのプロファイルに対する SecretRef バックの `keyRef`/`tokenRef` 入力は拒否されます。

自動化しやすいチェック（期限切れ/欠落時は終了コード `1`、期限切れ間近は `2`）:

```bash
openclaw models status --check
```

ライブ認証プローブ:

```bash
openclaw models status --probe
```

注:

- プローブ行は、認証プロファイル、環境認証情報、または `models.json` から取得される場合があります。
- 明示的な `auth.order.<provider>` が保存済みプロファイルを省略している場合、プローブはそのプロファイルを試行せず、
  そのプロファイルに対して `excluded_by_auth_order` を報告します。
- 認証は存在するが、そのプロバイダーについて OpenClaw がプローブ可能なモデル候補を解決できない場合、
  プローブは `status: no_model` を報告します。
- レート制限のクールダウンはモデル単位の場合があります。ある
  モデルでクールダウン中のプロファイルでも、同じプロバイダーの兄弟モデルではまだ使用できる場合があります。

任意の運用スクリプト（systemd/Termux）はここで説明されています:
[認証監視スクリプト](/ja-JP/help/scripts#auth-monitoring-scripts)

## Anthropic に関する注記

Anthropic `claude-cli` バックエンドは再びサポートされています。

- Anthropic のスタッフから、この OpenClaw 統合パスは再び許可されたと伝えられました。
- したがって、Anthropic が新しいポリシーを公開しない限り、OpenClaw は Claude CLI の再利用と `claude -p` の使用を Anthropic バックの実行で
  認可済みとして扱います。
- 長期間稼働する Gateway
  ホストと明示的なサーバー側課金管理では、Anthropic APIキーが引き続き最も予測しやすい選択肢です。

## モデル認証ステータスの確認

```bash
openclaw models status
openclaw doctor
```

## APIキー ローテーション動作（Gateway）

一部のプロバイダーでは、API 呼び出しがプロバイダーのレート制限に
達した場合、代替キーでリクエストを再試行できます。

- 優先順位:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一の上書き）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google プロバイダーでは、追加のフォールバックとして `GOOGLE_API_KEY` も含まれます。
- 同じキーリストは使用前に重複排除されます。
- OpenClaw はレート制限エラーの場合にのみ次のキーで再試行します（たとえば
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached`、または
  `workers_ai ... quota limit exceeded`）。
- レート制限以外のエラーでは代替キーによる再試行は行われません。
- すべてのキーが失敗した場合、最後の試行からの最終エラーが返されます。

## 使用する認証情報の制御

### セッション単位（チャットコマンド）

現在のセッションに特定のプロバイダー認証情報を固定するには、`/model <alias-or-id>@<profileId>` を使用します（プロファイル ID の例: `anthropic:default`、`anthropic:work`）。

コンパクトなピッカーには `/model`（または `/model list`）を使用します。完全なビュー（候補 + 次の認証プロファイル、設定済みの場合はプロバイダーエンドポイントの詳細）には `/model status` を使用します。

### エージェント単位（CLI 上書き）

エージェントに対して明示的な認証プロファイル順序の上書きを設定します（そのエージェントの `auth-state.json` に保存されます）。

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

特定のエージェントを対象にするには `--agent <id>` を使用します。省略すると、設定済みのデフォルトエージェントが使われます。
順序の問題をデバッグする場合、`openclaw models status --probe` は保存済みプロファイルのうち省略されたものを、黙ってスキップするのではなく
`excluded_by_auth_order` として表示します。
クールダウンの問題をデバッグする場合、レート制限のクールダウンはプロバイダープロファイル全体ではなく、
1つのモデル ID に紐づく場合があることに注意してください。

## トラブルシューティング

### 「認証情報が見つかりません」

Anthropic プロファイルが欠落している場合は、
**Gateway ホスト**で Anthropic APIキーを設定するか、Anthropic setup-token パスをセットアップしてから、再確認します。

```bash
openclaw models status
```

### トークンが期限切れ間近/期限切れ

どのプロファイルが期限切れ間近かを確認するには、`openclaw models status` を実行します。
Anthropic トークンプロファイルが欠落しているか期限切れの場合は、
setup-token でそのセットアップを更新するか、Anthropic APIキーへ移行してください。

## 関連

- [シークレット管理](/ja-JP/gateway/secrets)
- [リモートアクセス](/ja-JP/gateway/remote)
- [認証ストレージ](/ja-JP/concepts/oauth)
