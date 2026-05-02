---
read_when:
    - SecretRef 認証情報のカバレッジを検証する
    - 認証情報が `secrets configure` または `secrets apply` の対象かどうかを監査する
    - 認証情報がサポート対象の範囲外にある理由を確認する
summary: 正規の SecretRef 認証情報サーフェスにおけるサポート対象と非サポート対象
title: SecretRef 認証情報サーフェス
x-i18n:
    generated_at: "2026-05-02T05:05:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41111ac82142c906005e0f585c86f2ff0b454afdaec07343c295e6b83571718e
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

このページでは、正規の SecretRef 認証情報サーフェスを定義します。

スコープの意図:

- スコープ内: OpenClaw が発行またはローテーションしない、厳密にユーザーが提供する認証情報。
- スコープ外: ランタイムで発行またはローテーションされる認証情報、OAuth リフレッシュ素材、セッションに類する成果物。

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
- `plugins.entries.voice-call.config.realtime.providers.*.apiKey`
- `plugins.entries.voice-call.config.streaming.providers.*.apiKey`
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
- `channels.googlechat.serviceAccount` は隣接する `serviceAccountRef` 経由 (互換性例外)
- `channels.googlechat.accounts.*.serviceAccount` は隣接する `serviceAccountRef` 経由 (互換性例外)

### `auth-profiles.json` ターゲット (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; `auth.profiles.<id>.mode = "oauth"` の場合は非サポート)
- `profiles.*.tokenRef` (`type: "token"`; `auth.profiles.<id>.mode = "oauth"` の場合は非サポート)

[//]: # "secretref-supported-list-end"

注:

- 認証プロファイルのプランターゲットには `agentId` が必要です。
- プランエントリは `profiles.*.key` / `profiles.*.token` をターゲットにし、隣接する参照 (`keyRef` / `tokenRef`) を書き込みます。
- 認証プロファイルの参照は、ランタイム解決と監査範囲に含まれます。
- `openclaw.json` では、SecretRefs は `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` のような構造化オブジェクトを使用する必要があります。レガシーの `secretref-env:<ENV_VAR>` マーカー文字列は、SecretRef 認証情報パスでは拒否されます。有効なマーカーを移行するには `openclaw doctor --fix` を実行してください。
- OAuth ポリシーガード: `auth.profiles.<id>.mode = "oauth"` は、そのプロファイルの SecretRef 入力と組み合わせることはできません。このポリシーに違反すると、起動/再読み込みと認証プロファイル解決は即座に失敗します。
- SecretRef 管理のモデルプロバイダーでは、生成された `agents/*/agent/models.json` エントリは、`apiKey`/ヘッダーサーフェスについて非シークレットのマーカー (解決済みシークレット値ではない) を永続化します。
- マーカーの永続化はソースを正とします。OpenClaw は、解決済みランタイムシークレット値ではなく、アクティブなソース設定スナップショット (解決前) からマーカーを書き込みます。
- ウェブ検索について:
  - 明示的なプロバイダーモード (`tools.web.search.provider` が設定済み) では、選択されたプロバイダーキーのみがアクティブです。
  - 自動モード (`tools.web.search.provider` が未設定) では、優先順位によって解決される最初のプロバイダーキーのみがアクティブです。
  - 自動モードでは、選択されていないプロバイダー参照は、選択されるまで非アクティブとして扱われます。
  - レガシーの `tools.web.search.*` プロバイダーパスは互換性期間中も解決されますが、正規の SecretRef サーフェスは `plugins.entries.<plugin>.config.webSearch.*` です。

## サポートされない認証情報

スコープ外の認証情報には次が含まれます:

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

- これらの認証情報は、発行、ローテーション、セッション保持、または OAuth で永続化される分類であり、読み取り専用の外部 SecretRef 解決には適合しません。

## 関連

- [シークレット管理](/ja-JP/gateway/secrets)
- [認証情報のセマンティクス](/ja-JP/auth-credential-semantics)
