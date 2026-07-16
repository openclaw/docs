---
read_when:
    - Проверка охвата учетных данных SecretRef
    - Проверка того, подходит ли учетная информация для `secrets configure` или `secrets apply`
    - Проверка причин, по которым учётные данные находятся за пределами поддерживаемой области применения
summary: Каноническая поддерживаемая и неподдерживаемая область учётных данных SecretRef
title: Поверхность учётных данных SecretRef
x-i18n:
    generated_at: "2026-07-16T16:47:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a4c7d8d5baf082f5524b93608584600856e48f9076df915c4db301a4ecd814c9
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Эта страница определяет каноническую поверхность учётных данных SecretRef: какие поля учётных данных принимают `SecretRef` (ссылку на основе переменной окружения, файла или исполняемой команды) вместо необработанного значения секрета.

Область действия:

- Входит в область действия: исключительно предоставляемые пользователем учётные данные, которые OpenClaw не выпускает и не ротирует.
- Не входит в область действия: выпускаемые во время выполнения или ротируемые учётные данные, данные обновления OAuth и артефакты, подобные сеансам.

Приведённые ниже списки создаются из реестра целевых объектов исходного кода и сверяются с `docs/reference/secretref-user-supplied-credentials-matrix.json` в CI; не редактируйте записи вручную.

## Поддерживаемые учётные данные

### Целевые объекты `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` через соседний `serviceAccountRef` (исключение для совместимости)
- `channels.googlechat.accounts.*.serviceAccount` через соседний `serviceAccountRef` (исключение для совместимости)

### Целевые объекты `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; не поддерживается, когда `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; не поддерживается, когда `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Примечания:

- Для целевых объектов плана профиля аутентификации требуется `agentId`; записи плана нацелены на `profiles.*.key` / `profiles.*.token` и записывают соседние ссылки (`keyRef` / `tokenRef`). Ссылки профиля аутентификации включены в разрешение во время выполнения и охват аудитом.
- В `openclaw.json` ссылки SecretRef должны использовать структурированные объекты, например `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Устаревшие строки-маркеры `secretref-env:<ENV_VAR>` отклоняются в путях учётных данных SecretRef; выполните `openclaw doctor --fix`, чтобы перенести допустимые маркеры.
- Защитное правило политики OAuth: `auth.profiles.<id>.mode = "oauth"` нельзя сочетать с входными данными SecretRef для этого профиля. При нарушении этой политики запуск или перезагрузка и разрешение профиля аутентификации немедленно завершаются с ошибкой.
- Для поставщиков моделей, управляемых через SecretRef, созданные записи `agents/*/agent/models.json` сохраняют несекретные маркеры, а не разрешённые значения секретов, для поверхностей `apiKey`/заголовков. Сохранение маркеров определяется источником: OpenClaw записывает маркеры из активного снимка исходной конфигурации до разрешения, а не из разрешённых значений секретов среды выполнения.
- Для веб-поиска: в режиме явного выбора поставщика (задано `tools.web.search.provider`) активен только ключ выбранного поставщика. В автоматическом режиме (`tools.web.search.provider` не задано) активен только первый ключ поставщика, который разрешается согласно порядку приоритетов, а ссылки невыбранных поставщиков считаются неактивными до их выбора. Устаревшие пути поставщика `tools.web.search.*` продолжают разрешаться в течение периода совместимости, но канонической поверхностью SecretRef является `plugins.entries.<plugin>.config.webSearch.*`.

## Неподдерживаемые учётные данные

Эти учётные данные относятся к классам выпускаемых, ротируемых, содержащих сеанс или долговременно сохраняемых OAuth-данных, которые несовместимы с разрешением внешних ссылок SecretRef только для чтения:

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

## Связанные материалы

- [Управление секретами](/ru/gateway/secrets)
- [Семантика учётных данных аутентификации](/ru/auth-credential-semantics)
