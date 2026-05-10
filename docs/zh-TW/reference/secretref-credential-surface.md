---
read_when:
    - 驗證 SecretRef 憑證涵蓋範圍
    - 稽核憑證是否符合 `secrets configure` 或 `secrets apply` 的資格
    - 驗證憑證為何超出支援範圍
summary: 標準的 SecretRef 憑證支援與不支援介面
title: SecretRef 憑證介面
x-i18n:
    generated_at: "2026-05-10T19:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2778ea781f7b6fc4d579892225f9cf29bfb8f9ece5961554620ca8e82123ceff
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

此頁面定義標準 SecretRef 憑證介面。

範圍意圖：

- 範圍內：嚴格限於使用者提供、且 OpenClaw 不會簽發或輪替的憑證。
- 範圍外：執行階段簽發或輪替的憑證、OAuth 重新整理材料，以及類工作階段成品。

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

注意事項：

- 驗證設定檔計畫目標需要 `agentId`。
- 計畫項目以 `profiles.*.key` / `profiles.*.token` 為目標，並寫入同層參照（`keyRef` / `tokenRef`）。
- 驗證設定檔參照會納入執行階段解析與稽核涵蓋範圍。
- 在 `openclaw.json` 中，SecretRef 必須使用結構化物件，例如 `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`。舊版 `secretref-env:<ENV_VAR>` 標記字串在 SecretRef 憑證路徑上會被拒絕；請執行 `openclaw doctor --fix` 來遷移有效標記。
- OAuth 政策防護：`auth.profiles.<id>.mode = "oauth"` 不能與該設定檔的 SecretRef 輸入合併使用。當違反此政策時，啟動/重新載入與驗證設定檔解析會快速失敗。
- 對於由 SecretRef 管理的模型提供者，產生的 `agents/*/agent/models.json` 項目會保留 `apiKey`/標頭介面的非秘密標記（而非已解析的秘密值）。
- 標記持久化以來源為準：OpenClaw 會從作用中來源設定快照（解析前）寫入標記，而不是從已解析的執行階段秘密值寫入。
- 對於網頁搜尋：
  - 在明確提供者模式（已設定 `tools.web.search.provider`）中，只有所選的提供者金鑰是作用中的。
  - 在自動模式（未設定 `tools.web.search.provider`）中，只有第一個依優先順序解析成功的提供者金鑰是作用中的。
  - 在自動模式中，未選取的提供者參照在被選取前會視為非作用中。
  - 舊版 `tools.web.search.*` 提供者路徑在相容性期間仍會解析，但標準 SecretRef 介面是 `plugins.entries.<plugin>.config.webSearch.*`。

## 不支援的憑證

範圍外的憑證包括：

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

- 這些憑證屬於已簽發、會輪替、承載工作階段，或 OAuth 持久類別，不符合唯讀外部 SecretRef 解析模型。

## 相關

- [秘密管理](/zh-TW/gateway/secrets)
- [驗證憑證語意](/zh-TW/auth-credential-semantics)
