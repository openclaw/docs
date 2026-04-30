---
read_when:
    - SecretRef 認証情報カバレッジの検証
    - 認証情報が `secrets configure` または `secrets apply` の対象かどうかを監査する
    - 認証情報がサポート対象の範囲外にある理由を検証する
summary: SecretRef 認証情報サーフェスにおける正規のサポート対象と非サポート対象
title: SecretRef 認証情報サーフェス
x-i18n:
    generated_at: "2026-04-30T05:33:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b04902427e9851cc36c1dfd07ed44b46b55450c251075e9955af6696f08bc334
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

このページでは、正準の SecretRef 認証情報サーフェスを定義します。

スコープの意図:

- 対象: OpenClaw が発行またはローテーションしない、厳密にユーザー指定の認証情報。
- 対象外: ランタイムで発行される、またはローテーションされる認証情報、OAuth 更新用マテリアル、セッションに類するアーティファクト。

## サポートされる認証情報

### `openclaw.json` ターゲット (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `plugins.entries.voice-call.config.tts.providers.*.apiKey`
- `plugins.entries.voice-call.config.twilio.authToken`
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
- `channels.googlechat.serviceAccount` は兄弟の `serviceAccountRef` 経由 (互換性の例外)
- `channels.googlechat.accounts.*.serviceAccount` は兄弟の `serviceAccountRef` 経由 (互換性の例外)

### `auth-profiles.json` ターゲット (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; `auth.profiles.<id>.mode = "oauth"` の場合はサポート対象外)
- `profiles.*.tokenRef` (`type: "token"`; `auth.profiles.<id>.mode = "oauth"` の場合はサポート対象外)

[//]: # "secretref-supported-list-end"

注:

- 認証プロファイルの計画ターゲットには `agentId` が必要です。
- 計画エントリは `profiles.*.key` / `profiles.*.token` をターゲットにし、兄弟 ref (`keyRef` / `tokenRef`) を書き込みます。
- 認証プロファイル ref はランタイム解決と監査対象範囲に含まれます。
- `openclaw.json` では、SecretRef は `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` のような構造化オブジェクトを使用する必要があります。レガシーの `secretref-env:<ENV_VAR>` マーカー文字列は、SecretRef 認証情報パスでは拒否されます。有効なマーカーを移行するには `openclaw doctor --fix` を実行してください。
- OAuth ポリシーガード: `auth.profiles.<id>.mode = "oauth"` は、そのプロファイルの SecretRef 入力と組み合わせることはできません。このポリシーに違反すると、起動/再読み込みと認証プロファイル解決は即座に失敗します。
- SecretRef 管理のモデルプロバイダーでは、生成された `agents/*/agent/models.json` エントリは `apiKey`/ヘッダーサーフェスについて、シークレット値を解決した値ではなく、非シークレットのマーカーを永続化します。
- マーカーの永続化はソースを正とします。OpenClaw は解決済みのランタイムシークレット値ではなく、アクティブなソース設定スナップショット (解決前) からマーカーを書き込みます。
- Web 検索について:
  - 明示的なプロバイダーモード (`tools.web.search.provider` が設定済み) では、選択されたプロバイダーキーのみがアクティブです。
  - 自動モード (`tools.web.search.provider` が未設定) では、優先順位に従って解決される最初のプロバイダーキーのみがアクティブです。
  - 自動モードでは、選択されていないプロバイダー ref は選択されるまで非アクティブとして扱われます。
  - レガシーの `tools.web.search.*` プロバイダーパスは互換性期間中も引き続き解決されますが、正準の SecretRef サーフェスは `plugins.entries.<plugin>.config.webSearch.*` です。

## サポート対象外の認証情報

対象外の認証情報には次が含まれます。

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

- これらの認証情報は、発行済み、ローテーション対象、セッション保持型、または OAuth の永続クラスであり、読み取り専用の外部 SecretRef 解決に適合しません。

## 関連

- [シークレット管理](/ja-JP/gateway/secrets)
- [認証情報セマンティクス](/ja-JP/auth-credential-semantics)
