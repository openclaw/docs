---
read_when:
    - SecretRef資格情報カバレッジを検証している場合
    - 資格情報が`secrets configure`または`secrets apply`の対象かどうかを監査している場合
    - 資格情報がサポート対象インターフェース外である理由を確認している場合
summary: 正規のサポート対象および非サポート対象のSecretRef資格情報インターフェース
title: SecretRef資格情報インターフェース
x-i18n:
    generated_at: "2026-04-24T05:19:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddb8d7660f2757e3d2a078c891f52325bf9ec9291ec7d5f5e06daef4041e2006
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

このページでは、正規のSecretRef資格情報インターフェースを定義します。

スコープ意図:

- スコープ内: OpenClaw自身が発行やローテーションを行わない、厳密にユーザー提供の資格情報。
- スコープ外: ランタイムが発行する、またはローテーションされる資格情報、OAuth refresh素材、およびセッション的なアーティファクト。

## サポートされる資格情報

### `openclaw.json`ターゲット（`secrets configure` + `secrets apply` + `secrets audit`）

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
- `channels.googlechat.serviceAccount`（兄弟`serviceAccountRef`経由。互換性例外）
- `channels.googlechat.accounts.*.serviceAccount`（兄弟`serviceAccountRef`経由。互換性例外）

### `auth-profiles.json`ターゲット（`secrets configure` + `secrets apply` + `secrets audit`）

- `profiles.*.keyRef`（`type: "api_key"`; `auth.profiles.<id>.mode = "oauth"`の場合は非対応）
- `profiles.*.tokenRef`（`type: "token"`; `auth.profiles.<id>.mode = "oauth"`の場合は非対応）

[//]: # "secretref-supported-list-end"

注意:

- Auth-profileプランターゲットには`agentId`が必要です。
- プランエントリは`profiles.*.key` / `profiles.*.token`を対象にし、兄弟ref（`keyRef` / `tokenRef`）を書き込みます。
- auth-profile refは、ランタイム解決および監査対象に含まれます。
- OAuthポリシーガード: `auth.profiles.<id>.mode = "oauth"`は、そのプロファイルに対するSecretRef入力と組み合わせることはできません。このポリシーに違反すると、起動/リロードおよびauth-profile解決は即座に失敗します。
- SecretRef管理のモデルプロバイダーでは、生成される`agents/*/agent/models.json`エントリは、`apiKey`/headerインターフェース向けに非シークレットマーカー（解決済みsecret値ではない）を保持します。
- マーカー保持はsource authoritativeです。OpenClawは、解決済みランタイムsecret値からではなく、有効なsource configスナップショット（解決前）からマーカーを書き込みます。
- Web検索について:
  - 明示的providerモード（`tools.web.search.provider`が設定されている）では、選択されたprovider keyだけが有効です。
  - 自動モード（`tools.web.search.provider`未設定）では、優先順位で最初に解決されたprovider keyだけが有効です。
  - 自動モードでは、選択されていないprovider refは、選択されるまで非アクティブとして扱われます。
  - レガシーの`tools.web.search.*` provider pathは互換期間中は引き続き解決されますが、正規のSecretRefインターフェースは`plugins.entries.<plugin>.config.webSearch.*`です。

## サポートされない資格情報

スコープ外の資格情報には次が含まれます。

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

理由:

- これらの資格情報は、発行される、ローテーションされる、セッションを持つ、またはOAuth永続クラスであり、読み取り専用の外部SecretRef解決には適合しません。

## 関連

- [Secrets management](/ja-JP/gateway/secrets)
- [Auth credential semantics](/ja-JP/auth-credential-semantics)
