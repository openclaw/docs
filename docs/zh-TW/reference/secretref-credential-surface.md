---
read_when:
    - 驗證 SecretRef 憑證涵蓋範圍
    - 稽核憑證是否符合 `secrets configure` 或 `secrets apply` 的使用資格
    - 驗證憑證為何不在支援範圍內
summary: SecretRef 憑證介面的標準支援與不支援範圍
title: SecretRef 憑證介面
x-i18n:
    generated_at: "2026-07-11T21:46:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

本頁定義標準的 SecretRef 憑證介面：哪些憑證欄位可接受 `SecretRef`（由環境變數／檔案／執行命令支援的參照），而非原始祕密值。

範圍：

- 範圍內：嚴格限於由使用者提供，且 OpenClaw 不會產生或輪替的憑證。
- 範圍外：執行階段產生或輪替的憑證、OAuth 重新整理資料，以及類似工作階段的成品。

以下清單由來源目標登錄檔產生，並在 CI 中與 `docs/reference/secretref-user-supplied-credentials-matrix.json` 核對；請勿手動編輯項目。

## 支援的憑證

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
- `channels.googlechat.serviceAccount` 透過同層的 `serviceAccountRef`（相容性例外）
- `channels.googlechat.accounts.*.serviceAccount` 透過同層的 `serviceAccountRef`（相容性例外）

### `auth-profiles.json` 目標（`secrets configure` + `secrets apply` + `secrets audit`）

- `profiles.*.keyRef`（`type: "api_key"`；當 `auth.profiles.<id>.mode = "oauth"` 時不支援）
- `profiles.*.tokenRef`（`type: "token"`；當 `auth.profiles.<id>.mode = "oauth"` 時不支援）

[//]: # "secretref-supported-list-end"

注意事項：

- 驗證設定檔的方案目標需要 `agentId`；方案項目以 `profiles.*.key`／`profiles.*.token` 為目標，並寫入同層參照（`keyRef`／`tokenRef`）。驗證設定檔參照包含在執行階段解析與稽核涵蓋範圍內。
- 在 `openclaw.json` 中，SecretRef 必須使用結構化物件，例如 `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`。SecretRef 憑證路徑會拒絕舊版 `secretref-env:<ENV_VAR>` 標記字串；請執行 `openclaw doctor --fix` 以遷移有效標記。
- OAuth 原則防護：`auth.profiles.<id>.mode = "oauth"` 不得與該設定檔的 SecretRef 輸入結合使用。違反此原則時，啟動／重新載入及驗證設定檔解析會立即失敗。
- 對於由 SecretRef 管理的模型供應商，產生的 `agents/*/agent/models.json` 項目會為 `apiKey`／標頭介面保存非祕密標記，而非已解析的祕密值。標記保存以來源為準：OpenClaw 從使用中的來源設定快照（解析前）寫入標記，而非從已解析的執行階段祕密值寫入。
- 對於網頁搜尋：在明確供應商模式（已設定 `tools.web.search.provider`）中，只有所選供應商的金鑰有效。在自動模式（未設定 `tools.web.search.provider`）中，只有依優先順序第一個成功解析的供應商金鑰有效，未選取供應商的參照在被選取前會視為非作用中。舊版 `tools.web.search.*` 供應商路徑在相容期內仍會解析，但標準 SecretRef 介面為 `plugins.entries.<plugin>.config.webSearch.*`。

## 不支援的憑證

這些憑證屬於產生、輪替、帶有工作階段，或可長期保存的 OAuth 類別，不適用於唯讀的外部 SecretRef 解析：

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

## 相關內容

- [祕密管理](/zh-TW/gateway/secrets)
- [驗證憑證語意](/zh-TW/auth-credential-semantics)
