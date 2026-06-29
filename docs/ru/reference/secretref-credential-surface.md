---
read_when:
    - Проверка покрытия учетных данных SecretRef
    - Аудит того, подходит ли учетные данные для `secrets configure` или `secrets apply`
    - Проверка того, почему учетные данные находятся за пределами поддерживаемой поверхности
summary: Каноническая поддерживаемая и неподдерживаемая поверхность учетных данных SecretRef
title: Поверхность учетных данных SecretRef
x-i18n:
    generated_at: "2026-06-28T23:44:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 668ee7e72565194bfe53a397767d060e5fe7743c9bf8bde2597ec3dad2a32431
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Эта страница определяет каноническую поверхность учетных данных SecretRef.

Назначение области:

- В области: строго предоставленные пользователем учетные данные, которые OpenClaw не выпускает и не ротирует.
- Вне области: выпущенные во время выполнения или ротируемые учетные данные, материалы обновления OAuth и артефакты, похожие на сеанс.

## Поддерживаемые учетные данные

### Целевые элементы `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` через соседний `serviceAccountRef` (исключение совместимости)
- `channels.googlechat.accounts.*.serviceAccount` через соседний `serviceAccountRef` (исключение совместимости)

### Целевые элементы `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; не поддерживается, когда `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; не поддерживается, когда `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Примечания:

- Целевые элементы плана auth-profile требуют `agentId`.
- Записи плана нацеливаются на `profiles.*.key` / `profiles.*.token` и записывают соседние ссылки (`keyRef` / `tokenRef`).
- Ссылки auth-profile включены в разрешение во время выполнения и покрытие аудита.
- В `openclaw.json` SecretRefs должны использовать структурированные объекты, такие как `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Устаревшие строки-маркеры `secretref-env:<ENV_VAR>` отклоняются на путях учетных данных SecretRef; выполните `openclaw doctor --fix`, чтобы мигрировать допустимые маркеры.
- Защита политики OAuth: `auth.profiles.<id>.mode = "oauth"` нельзя сочетать с входными данными SecretRef для этого профиля. Запуск/перезагрузка и разрешение auth-profile быстро завершаются ошибкой при нарушении этой политики.
- Для поставщиков моделей, управляемых SecretRef, сгенерированные записи `agents/*/agent/models.json` сохраняют несекретные маркеры (а не разрешенные значения секретов) для поверхностей `apiKey`/заголовков.
- Сохранение маркеров авторитетно относительно источника: OpenClaw записывает маркеры из активного снимка конфигурации источника (до разрешения), а не из разрешенных секретных значений во время выполнения.
- Для веб-поиска:
  - В режиме явного поставщика (задан `tools.web.search.provider`) активен только ключ выбранного поставщика.
  - В автоматическом режиме (`tools.web.search.provider` не задан) активен только первый ключ поставщика, который разрешается по приоритету.
  - В автоматическом режиме ссылки невыбранных поставщиков считаются неактивными, пока они не выбраны.
  - Устаревшие пути поставщиков `tools.web.search.*` все еще разрешаются в течение окна совместимости, но каноническая поверхность SecretRef — `plugins.entries.<plugin>.config.webSearch.*`.

## Неподдерживаемые учетные данные

Учетные данные вне области включают:

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

Обоснование:

- Эти учетные данные относятся к классам, которые выпускаются, ротируются, несут сеансовое состояние или долговечны для OAuth и не подходят для read-only внешнего разрешения SecretRef.

## Связанные материалы

- [Управление секретами](/ru/gateway/secrets)
- [Семантика учетных данных аутентификации](/ru/auth-credential-semantics)
