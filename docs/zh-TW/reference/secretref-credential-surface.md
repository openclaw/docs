---
read_when:
    - 驗證 SecretRef 認證資訊涵蓋範圍
    - 稽核認證資訊是否符合 `secrets configure` 或 `secrets apply` 的資格
    - 驗證認證資訊為何不在支援範圍內
summary: 支援與不支援的 SecretRef 認證資訊標準介面
title: SecretRef 認證資訊介面
x-i18n:
    generated_at: "2026-07-16T12:03:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a4c7d8d5baf082f5524b93608584600856e48f9076df915c4db301a4ecd814c9
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

此頁面定義標準的 SecretRef 認證資訊介面：哪些認證資訊欄位可接受 `SecretRef`（由環境變數／檔案／執行命令支援的參照），而非原始密鑰值。

範圍：

- 範圍內：僅限由使用者提供，且 OpenClaw 不會建立或輪替的認證資訊。
- 範圍外：執行階段建立或輪替的認證資訊、OAuth 更新權杖資料，以及類似工作階段的成品。

以下清單由來源目標登錄檔產生，並在 CI 中對照 `docs/reference/secretref-user-supplied-credentials-matrix.json` 檢查；請勿手動編輯項目。

## 支援的認證資訊

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
- `channels.clickclack.token`
- `channels.clickclack.accounts.*.token`
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
- `channels.googlechat.serviceAccount`，透過同層的 `serviceAccountRef`（相容性例外）
- `channels.googlechat.accounts.*.serviceAccount`，透過同層的 `serviceAccountRef`（相容性例外）

### `auth-profiles.json` 目標（`secrets configure` + `secrets apply` + `secrets audit`）

- `profiles.*.keyRef`（`type: "api_key"`；當 `auth.profiles.<id>.mode = "oauth"` 時不支援）
- `profiles.*.tokenRef`（`type: "token"`；當 `auth.profiles.<id>.mode = "oauth"` 時不支援）

[//]: # "secretref-supported-list-end"

注意事項：

- 認證設定檔方案目標需要 `agentId`；方案項目以 `profiles.*.key` / `profiles.*.token` 為目標，並寫入同層參照（`keyRef` / `tokenRef`）。認證設定檔參照包含在執行階段解析及稽核涵蓋範圍內。
- 在 `openclaw.json` 中，SecretRef 必須使用如 `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` 的結構化物件。SecretRef 認證資訊路徑會拒絕舊版 `secretref-env:<ENV_VAR>` 標記字串；請執行 `openclaw doctor --fix` 以遷移有效標記。
- OAuth 原則防護：該設定檔的 `auth.profiles.<id>.mode = "oauth"` 不得與 SecretRef 輸入搭配使用。違反此原則時，啟動／重新載入及認證設定檔解析會立即失敗。
- 對於由 SecretRef 管理的模型提供者，產生的 `agents/*/agent/models.json` 項目會為 `apiKey`／標頭介面保存非密鑰標記（而非已解析的密鑰值）。標記持久化以來源為權威：OpenClaw 從有效的來源設定快照（解析前）寫入標記，而非從已解析的執行階段密鑰值寫入。
- 針對網頁搜尋：在明確提供者模式下（已設定 `tools.web.search.provider`），只有所選提供者的金鑰有效。在自動模式下（未設定 `tools.web.search.provider`），只有依優先順序第一個解析成功的提供者金鑰有效，未選取的提供者參照在被選取前會視為非作用中。在相容性期間，舊版 `tools.web.search.*` 提供者路徑仍可解析，但標準 SecretRef 介面為 `plugins.entries.<plugin>.config.webSearch.*`。

## 不支援的認證資訊

這些認證資訊屬於建立、輪替、帶有工作階段，或可長期用於 OAuth 的類別，不適用於唯讀的外部 SecretRef 解析：

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

- [密鑰管理](/zh-TW/gateway/secrets)
- [認證資訊語意](/zh-TW/auth-credential-semantics)
