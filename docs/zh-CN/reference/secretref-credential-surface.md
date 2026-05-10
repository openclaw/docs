---
read_when:
    - 验证 SecretRef 凭证覆盖范围
    - 审核凭证是否符合 `secrets configure` 或 `secrets apply` 的条件
    - 验证凭证为何不在受支持范围内
summary: 规范支持与不支持的 SecretRef 凭证接口面
title: SecretRef 凭证接口
x-i18n:
    generated_at: "2026-05-10T19:48:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2778ea781f7b6fc4d579892225f9cf29bfb8f9ece5961554620ca8e82123ceff
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

本页定义规范的 SecretRef 凭证表面。

范围意图：

- 范围内：严格限于用户提供且 OpenClaw 不签发或轮换的凭证。
- 范围外：运行时签发或轮换的凭证、OAuth 刷新材料，以及类似会话的制品。

## 支持的凭证

### `openclaw.json` 目标（`secrets configure` + `secrets apply` + `secrets audit`）

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
- 通过同级 `serviceAccountRef` 使用的 `channels.googlechat.serviceAccount`（兼容性例外）
- 通过同级 `serviceAccountRef` 使用的 `channels.googlechat.accounts.*.serviceAccount`（兼容性例外）

### `auth-profiles.json` 目标（`secrets configure` + `secrets apply` + `secrets audit`）

- `profiles.*.keyRef`（`type: "api_key"`；当 `auth.profiles.<id>.mode = "oauth"` 时不支持）
- `profiles.*.tokenRef`（`type: "token"`；当 `auth.profiles.<id>.mode = "oauth"` 时不支持）

[//]: # "secretref-supported-list-end"

注意：

- 凭证配置文件计划目标需要 `agentId`。
- 计划条目以 `profiles.*.key` / `profiles.*.token` 为目标，并写入同级引用（`keyRef` / `tokenRef`）。
- 凭证配置文件引用包含在运行时解析和审计覆盖范围内。
- 在 `openclaw.json` 中，SecretRefs 必须使用结构化对象，例如 `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`。旧版 `secretref-env:<ENV_VAR>` 标记字符串在 SecretRef 凭证路径上会被拒绝；运行 `openclaw doctor --fix` 迁移有效标记。
- OAuth 策略保护：`auth.profiles.<id>.mode = "oauth"` 不能与该配置文件的 SecretRef 输入组合使用。当违反此策略时，启动/重新加载和凭证配置文件解析会快速失败。
- 对于由 SecretRef 管理的模型提供商，生成的 `agents/*/agent/models.json` 条目会为 `apiKey`/标头表面持久化非秘密标记（而不是已解析的秘密值）。
- 标记持久化以来源为权威：OpenClaw 会从活动源配置快照（解析前）写入标记，而不是从已解析的运行时秘密值写入。
- 对于 Web 搜索：
  - 在显式提供商模式（设置了 `tools.web.search.provider`）下，只有所选提供商键处于活动状态。
  - 在自动模式（未设置 `tools.web.search.provider`）下，只有按优先级解析出的第一个提供商键处于活动状态。
  - 在自动模式下，未选中的提供商引用会被视为非活动状态，直到被选中。
  - 旧版 `tools.web.search.*` 提供商路径在兼容窗口期间仍会解析，但规范的 SecretRef 表面是 `plugins.entries.<plugin>.config.webSearch.*`。

## 不支持的凭证

范围外凭证包括：

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

- 这些凭证属于已签发、已轮换、携带会话或 OAuth 持久化的类别，不适合只读外部 SecretRef 解析。

## 相关

- [Secrets 管理](/zh-CN/gateway/secrets)
- [凭证语义](/zh-CN/auth-credential-semantics)
