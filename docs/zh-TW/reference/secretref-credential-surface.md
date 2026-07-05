---
read_when:
    - 驗證 SecretRef 憑證涵蓋範圍
    - 稽核憑證是否符合 `secrets configure` 或 `secrets apply` 的資格
    - 驗證為何某個憑證位於支援範圍之外
summary: 正式支援與不支援的 SecretRef 憑證介面
title: SecretRef 認證資訊介面
x-i18n:
    generated_at: "2026-07-05T11:41:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

此頁面定義標準 SecretRef 認證介面：哪些認證欄位接受 `SecretRef`（由 env/file/exec 支援的參照），而不是原始密鑰值。

範圍：

- 範圍內：嚴格限於使用者提供、OpenClaw 不會簽發或輪替的認證。
- 範圍外：執行階段簽發或輪替的認證、OAuth 重新整理素材，以及類似工作階段的產物。

下列清單由來源目標登錄檔產生，並在 CI 中對照 `docs/reference/secretref-user-supplied-credentials-matrix.json` 檢查；請勿手動編輯項目。

## 支援的認證

### `openclaw.json` 目標（`secrets configure` + `secrets apply` + `secrets audit`）

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
- `channels.googlechat.serviceAccount` 透過同層級 `serviceAccountRef`（相容性例外）
- `channels.googlechat.accounts.*.serviceAccount` 透過同層級 `serviceAccountRef`（相容性例外）

### `auth-profiles.json` 目標（`secrets configure` + `secrets apply` + `secrets audit`）

- `profiles.*.keyRef`（`type: "api_key"`；當 `auth.profiles.<id>.mode = "oauth"` 時不支援）
- `profiles.*.tokenRef`（`type: "token"`；當 `auth.profiles.<id>.mode = "oauth"` 時不支援）

[//]: # "secretref-supported-list-end"

注意事項：

- Auth-profile 計畫目標需要 `agentId`；計畫項目以 `profiles.*.key` / `profiles.*.token` 為目標，並寫入同層級參照（`keyRef` / `tokenRef`）。Auth-profile 參照包含在執行階段解析與稽核涵蓋範圍內。
- 在 `openclaw.json` 中，SecretRefs 必須使用結構化物件，例如 `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`。舊版 `secretref-env:<ENV_VAR>` 標記字串會在 SecretRef 認證路徑上遭拒；請執行 `openclaw doctor --fix` 以遷移有效標記。
- OAuth 原則防護：`auth.profiles.<id>.mode = "oauth"` 不能與該設定檔的 SecretRef 輸入合併使用。當此原則遭違反時，啟動/重新載入與 auth-profile 解析會快速失敗。
- 對於由 SecretRef 管理的模型提供者，產生的 `agents/*/agent/models.json` 項目會針對 `apiKey`/標頭介面保留非密鑰標記（不是已解析的密鑰值）。標記持久化以來源為權威：OpenClaw 會從作用中的來源設定快照（解析前）寫入標記，而不是從已解析的執行階段密鑰值寫入。
- 對於網頁搜尋：在明確提供者模式（已設定 `tools.web.search.provider`）中，只有選取的提供者金鑰會啟用。在自動模式（未設定 `tools.web.search.provider`）中，只有依優先順序解析成功的第一個提供者金鑰會啟用，未選取的提供者參照在被選取前會視為未啟用。舊版 `tools.web.search.*` 提供者路徑在相容性期間仍會解析，但標準 SecretRef 介面是 `plugins.entries.<plugin>.config.webSearch.*`。

## 不支援的認證

這些認證屬於已簽發、已輪替、帶有工作階段，或 OAuth 持久類別，不適合唯讀外部 SecretRef 解析：

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

## 相關

- [密鑰管理](/zh-TW/gateway/secrets)
- [驗證認證語意](/zh-TW/auth-credential-semantics)
