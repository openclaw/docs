---
read_when:
    - SecretRef 資格情報のカバレッジを検証する
    - 認証情報が `secrets configure` または `secrets apply` の対象かどうかを監査する
    - サポート対象範囲外に認証情報がある理由を検証する
summary: 正規のサポート対象および非サポート対象の SecretRef 認証情報サーフェス
title: SecretRef 認証情報サーフェス
x-i18n:
    generated_at: "2026-06-27T13:01:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 668ee7e72565194bfe53a397767d060e5fe7743c9bf8bde2597ec3dad2a32431
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

このページでは、正準の SecretRef 認証情報サーフェスを定義します。

スコープの意図:

- スコープ内: OpenClaw が発行またはローテーションしない、厳密にユーザー指定の認証情報。
- スコープ外: 実行時に発行される、またはローテーションされる認証情報、OAuth リフレッシュ用素材、およびセッション類似のアーティファクト。

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
- 兄弟 `serviceAccountRef` 経由の `channels.googlechat.serviceAccount` (互換性の例外)
- 兄弟 `serviceAccountRef` 経由の `channels.googlechat.accounts.*.serviceAccount` (互換性の例外)

### `auth-profiles.json` ターゲット (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; `auth.profiles.<id>.mode = "oauth"` の場合は未サポート)
- `profiles.*.tokenRef` (`type: "token"`; `auth.profiles.<id>.mode = "oauth"` の場合は未サポート)

[//]: # "secretref-supported-list-end"

注記:

- auth-profile プランターゲットには `agentId` が必要です。
- プランエントリは `profiles.*.key` / `profiles.*.token` をターゲットにし、兄弟 ref (`keyRef` / `tokenRef`) を書き込みます。
- auth-profile ref は実行時解決と監査カバレッジに含まれます。
- `openclaw.json` では、SecretRef は `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` のような構造化オブジェクトを使用する必要があります。レガシーの `secretref-env:<ENV_VAR>` マーカー文字列は SecretRef 認証情報パスでは拒否されます。有効なマーカーを移行するには `openclaw doctor --fix` を実行してください。
- OAuth ポリシーガード: `auth.profiles.<id>.mode = "oauth"` は、そのプロファイルの SecretRef 入力と組み合わせることはできません。このポリシーに違反すると、起動/再読み込みおよび auth-profile 解決は即座に失敗します。
- SecretRef 管理のモデルプロバイダーでは、生成される `agents/*/agent/models.json` エントリは、`apiKey`/ヘッダーサーフェスについて非シークレットのマーカー (解決済みのシークレット値ではない) を永続化します。
- マーカーの永続化はソースを権威とします。OpenClaw は解決済みの実行時シークレット値からではなく、アクティブなソース設定スナップショット (解決前) からマーカーを書き込みます。
- Web 検索について:
  - 明示的なプロバイダーモード (`tools.web.search.provider` が設定されている) では、選択されたプロバイダーキーのみがアクティブです。
  - 自動モード (`tools.web.search.provider` が未設定) では、優先順位によって解決される最初のプロバイダーキーのみがアクティブです。
  - 自動モードでは、選択されていないプロバイダー ref は選択されるまで非アクティブとして扱われます。
  - レガシーの `tools.web.search.*` プロバイダーパスは互換性期間中も引き続き解決されますが、正準の SecretRef サーフェスは `plugins.entries.<plugin>.config.webSearch.*` です。

## サポートされない認証情報

スコープ外の認証情報には以下が含まれます:

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

- これらの認証情報は、発行済み、ローテーション対象、セッションを持つ、または OAuth で永続するクラスであり、読み取り専用の外部 SecretRef 解決には適合しません。

## 関連

- [シークレット管理](/ja-JP/gateway/secrets)
- [認証情報セマンティクス](/ja-JP/auth-credential-semantics)
