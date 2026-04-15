---
read_when:
    - SecretRef認証情報のカバレッジを確認する
    - 認証情報が `secrets configure` または `secrets apply` の対象かどうかを監査する
    - 認証情報がサポート対象外のサーフェスにある理由を確認する
summary: SecretRef認証情報サーフェスの正式なサポート対象と非サポート対象
title: SecretRef認証情報サーフェス
x-i18n:
    generated_at: "2026-04-15T04:44:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd0b9c379236b17a72f552d6360b8b5a2269009e019c138c6bb50f4f7328ddaf
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

# SecretRef認証情報サーフェス

このページでは、正式なSecretRef認証情報サーフェスを定義します。

スコープの意図:

- 対象: OpenClawが発行またはローテーションしない、厳密にユーザー提供の認証情報。
- 対象外: ランタイム時に発行される、またはローテーションされる認証情報、OAuthリフレッシュ用データ、およびセッションに類するアーティファクト。

## サポート対象の認証情報

### `openclaw.json` の対象（`secrets configure` + `secrets apply` + `secrets audit`）

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `models.providers.*.request.auth.token`
- `models.providers.*.request.auth.value`
- `models.providers.*.request.headers.*`
- `models.providers.*.request.proxy.tls.ca`
- `models.providers.*.request.proxy.tls.cert`
- `models.providers.*.request.proxy.tls.key`
- `models.providers.*.request.proxy.tls.passphrase`
- `models.providers.*.request.tls.ca`
- `models.providers.*.request.tls.cert`
- `models.providers.*.request.tls.key`
- `models.providers.*.request.tls.passphrase`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `tools.web.search.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.providers.*.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.providers.*.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.accessToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.accessToken`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` は兄弟 `serviceAccountRef` 経由（互換性のための例外）
- `channels.googlechat.accounts.*.serviceAccount` は兄弟 `serviceAccountRef` 経由（互換性のための例外）

### `auth-profiles.json` の対象（`secrets configure` + `secrets apply` + `secrets audit`）

- `profiles.*.keyRef`（`type: "api_key"`; `auth.profiles.<id>.mode = "oauth"` の場合は非サポート）
- `profiles.*.tokenRef`（`type: "token"`; `auth.profiles.<id>.mode = "oauth"` の場合は非サポート）

[//]: # "secretref-supported-list-end"

注記:

- Auth-profileのplan対象には `agentId` が必要です。
- Planエントリは `profiles.*.key` / `profiles.*.token` を対象とし、兄弟ref（`keyRef` / `tokenRef`）を書き込みます。
- Auth-profileのrefは、ランタイム解決および監査カバレッジに含まれます。
- OAuthポリシーガード: `auth.profiles.<id>.mode = "oauth"` は、そのprofileに対するSecretRef入力と組み合わせることはできません。このポリシーに違反すると、起動/リロードおよびauth-profile解決は即座に失敗します。
- SecretRef管理対象のモデルproviderでは、生成される `agents/*/agent/models.json` エントリに、`apiKey`/headerサーフェス用の非シークレットマーカー（解決済みのシークレット値ではない）が永続化されます。
- マーカーの永続化はソースを正とします: OpenClawは、解決済みランタイムシークレット値からではなく、アクティブなソース設定スナップショット（解決前）からマーカーを書き込みます。
- web searchについて:
  - 明示的providerモード（`tools.web.search.provider` が設定されている）では、選択されたproviderキーのみが有効です。
  - 自動モード（`tools.web.search.provider` が未設定）では、優先順位に従って解決される最初のproviderキーのみが有効です。
  - 自動モードでは、未選択のprovider refは選択されるまで非アクティブとして扱われます。
  - レガシーな `tools.web.search.*` providerパスも互換性ウィンドウ中は引き続き解決されますが、正式なSecretRefサーフェスは `plugins.entries.<plugin>.config.webSearch.*` です。

## サポート対象外の認証情報

対象外の認証情報には、以下が含まれます:

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `channels.discord.threadBindings.webhookToken`
- `channels.discord.accounts.*.threadBindings.webhookToken`
- `channels.whatsapp.creds.json`
- `channels.whatsapp.accounts.*.creds.json`

[//]: # "secretref-unsupported-list-end"

根拠:

- これらの認証情報は、発行される、ローテーションされる、セッション性を持つ、またはOAuthの永続クラスに属しており、読み取り専用の外部SecretRef解決には適しません。
