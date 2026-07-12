---
read_when:
    - SecretRef 認証情報の対応範囲を検証する
    - 認証情報が `secrets configure` または `secrets apply` の対象となるかを監査する
    - 認証情報がサポート対象外である理由の確認
summary: 正規にサポートされる SecretRef 認証情報サーフェスとサポートされないサーフェス
title: SecretRef 認証情報サーフェス
x-i18n:
    generated_at: "2026-07-11T22:40:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

このページでは、正規の SecretRef 認証情報サーフェス、つまり生のシークレット値の代わりに `SecretRef`（環境変数／ファイル／exec を基盤とする参照）を受け入れる認証情報フィールドを定義します。

対象範囲：

- 対象：OpenClaw が発行もローテーションもしない、厳密にユーザー指定の認証情報。
- 対象外：実行時に発行される認証情報またはローテーションされる認証情報、OAuth 更新用データ、セッションに類するアーティファクト。

以下のリストはソースのターゲットレジストリから生成され、CI で `docs/reference/secretref-user-supplied-credentials-matrix.json` と照合されます。エントリを手動で編集しないでください。

## サポートされる認証情報

### `openclaw.json` ターゲット（`secrets configure` + `secrets apply` + `secrets audit`）

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
- `agents.list[].tts.providers.*.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `talk.realtime.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.codex.config.appServer.authToken`
- `plugins.entries.codex.config.appServer.headers.*`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google-meet.config.realtime.providers.*.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `plugins.entries.parallel.config.webSearch.apiKey`
- `plugins.entries.voice-call.config.realtime.providers.*.apiKey`
- `plugins.entries.voice-call.config.streaming.providers.*.apiKey`
- `plugins.entries.voice-call.config.tts.providers.*.apiKey`
- `plugins.entries.voice-call.config.twilio.authToken`
- `tools.web.search.*.apiKey`
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
- `channels.slack.relay.authToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.relay.authToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.sms.authToken`
- `channels.sms.accounts.*.authToken`
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
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.qqbot.clientSecret`
- `channels.qqbot.accounts.*.clientSecret`
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
- `channels.googlechat.serviceAccount`（同階層の `serviceAccountRef` を使用、互換性の例外）
- `channels.googlechat.accounts.*.serviceAccount`（同階層の `serviceAccountRef` を使用、互換性の例外）

### `auth-profiles.json` ターゲット（`secrets configure` + `secrets apply` + `secrets audit`）

- `profiles.*.keyRef`（`type: "api_key"`。`auth.profiles.<id>.mode = "oauth"` の場合は未サポート）
- `profiles.*.tokenRef`（`type: "token"`。`auth.profiles.<id>.mode = "oauth"` の場合は未サポート）

[//]: # "secretref-supported-list-end"

注記：

- 認証プロファイルのプランターゲットには `agentId` が必要です。プランエントリは `profiles.*.key` / `profiles.*.token` を対象とし、同階層の参照（`keyRef` / `tokenRef`）を書き込みます。認証プロファイルの参照は、実行時の解決と監査の対象範囲に含まれます。
- `openclaw.json` では、SecretRef に `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` のような構造化オブジェクトを使用する必要があります。従来の `secretref-env:<ENV_VAR>` マーカー文字列は、SecretRef 認証情報パスでは拒否されます。有効なマーカーを移行するには、`openclaw doctor --fix` を実行してください。
- OAuth ポリシーガード：`auth.profiles.<id>.mode = "oauth"` と、そのプロファイルに対する SecretRef 入力を組み合わせることはできません。このポリシーに違反すると、起動／再読み込みおよび認証プロファイルの解決は即座に失敗します。
- SecretRef で管理されるモデルプロバイダーでは、生成された `agents/*/agent/models.json` エントリの `apiKey`／ヘッダーサーフェスに、シークレットではないマーカー（解決済みのシークレット値ではないもの）が永続化されます。マーカーの永続化ではソースを正とします。OpenClaw は解決済みの実行時シークレット値ではなく、アクティブなソース設定のスナップショット（解決前）からマーカーを書き込みます。
- Web 検索では、明示的なプロバイダーモード（`tools.web.search.provider` が設定済み）では、選択したプロバイダーのキーだけがアクティブになります。自動モード（`tools.web.search.provider` が未設定）では、優先順位に従って最初に解決されたプロバイダーのキーだけがアクティブになり、選択されていないプロバイダーの参照は、選択されるまで非アクティブとして扱われます。従来の `tools.web.search.*` プロバイダーパスも互換期間中は引き続き解決されますが、正規の SecretRef サーフェスは `plugins.entries.<plugin>.config.webSearch.*` です。

## サポートされない認証情報

これらの認証情報は、発行、ローテーション、セッション保持、または OAuth の永続データに該当し、読み取り専用の外部 SecretRef 解決には適合しません。

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

## 関連項目

- [シークレット管理](/ja-JP/gateway/secrets)
- [認証情報のセマンティクス](/ja-JP/auth-credential-semantics)
