---
read_when:
    - 驗證 SecretRef 憑證涵蓋範圍
    - 稽核憑證是否符合 `secrets configure` 或 `secrets apply` 的資格
    - 驗證憑證為何位於支援範圍之外
summary: 標準支援與不支援的 SecretRef 憑證介面
title: SecretRef 憑證介面
x-i18n:
    generated_at: "2026-05-03T21:42:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f95ca284f241e40f233fc9e388c26be094dd8bc878daf8a420453ef65b0ad6d
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

此頁定義標準 SecretRef 憑證介面。

範圍意圖：

- 範圍內：嚴格限於使用者提供，且 OpenClaw 不會鑄發或輪替的憑證。
- 範圍外：執行階段鑄發或輪替的憑證、OAuth 重新整理資料，以及類似工作階段的成品。

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
- `channels.googlechat.serviceAccount` 透過同層 `serviceAccountRef`（相容性例外）
- `channels.googlechat.accounts.*.serviceAccount` 透過同層 `serviceAccountRef`（相容性例外）

### `auth-profiles.json` 目標（`secrets configure` + `secrets apply` + `secrets audit`）

- `profiles.*.keyRef`（`type: "api_key"`；當 `auth.profiles.<id>.mode = "oauth"` 時不支援）
- `profiles.*.tokenRef`（`type: "token"`；當 `auth.profiles.<id>.mode = "oauth"` 時不支援）

[//]: # "secretref-supported-list-end"

附註：

- 驗證設定檔計畫目標需要 `agentId`。
- 計畫項目會以 `profiles.*.key` / `profiles.*.token` 為目標，並寫入同層參照（`keyRef` / `tokenRef`）。
- 驗證設定檔參照包含在執行階段解析與稽核涵蓋範圍中。
- 在 `openclaw.json` 中，SecretRefs 必須使用結構化物件，例如 `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`。舊版 `secretref-env:<ENV_VAR>` 標記字串會在 SecretRef 憑證路徑上遭到拒絕；請執行 `openclaw doctor --fix` 來遷移有效標記。
- OAuth 政策防護：`auth.profiles.<id>.mode = "oauth"` 不能與該設定檔的 SecretRef 輸入合併使用。啟動/重新載入與驗證設定檔解析會在違反此政策時快速失敗。
- 對於由 SecretRef 管理的模型提供者，產生的 `agents/*/agent/models.json` 項目會為 `apiKey`/標頭介面保留非機密標記（而非已解析的機密值）。
- 標記持久化以來源為準：OpenClaw 會從作用中的來源設定快照（解析前）寫入標記，而不是從已解析的執行階段機密值寫入。
- 對於網頁搜尋：
  - 在明確提供者模式（已設定 `tools.web.search.provider`）中，只有選取的提供者金鑰是作用中的。
  - 在自動模式（未設定 `tools.web.search.provider`）中，只有第一個依優先順序解析成功的提供者金鑰是作用中的。
  - 在自動模式中，未選取的提供者參照在被選取前會視為非作用中。
  - 舊版 `tools.web.search.*` 提供者路徑在相容性期間仍會解析，但標準 SecretRef 介面是 `plugins.entries.<plugin>.config.webSearch.*`。

## 不支援的憑證

範圍外憑證包含：

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

理由：

- 這些憑證屬於已鑄發、會輪替、帶有工作階段，或 OAuth 持久類別，不符合唯讀外部 SecretRef 解析。

## 相關

- [機密管理](/zh-TW/gateway/secrets)
- [驗證憑證語意](/zh-TW/auth-credential-semantics)
