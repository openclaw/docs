---
read_when:
    - Проверка охвата учетных данных SecretRef
    - Проверка возможности использования учётных данных для `secrets configure` или `secrets apply`
    - Проверка причин, по которым учётные данные находятся за пределами поддерживаемой области применения
summary: Каноническая поддерживаемая и неподдерживаемая область применения учётных данных SecretRef
title: Поверхность учетных данных SecretRef
x-i18n:
    generated_at: "2026-07-12T11:50:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Эта страница определяет каноническую поверхность учетных данных SecretRef: какие поля учетных данных принимают `SecretRef` (ссылку на основе переменной окружения, файла или исполняемой команды) вместо необработанного значения секрета.

Область применения:

- Включено: исключительно предоставляемые пользователем учетные данные, которые OpenClaw не создает и не ротирует.
- Исключено: учетные данные, создаваемые или ротируемые во время выполнения, данные обновления OAuth и артефакты, подобные сеансам.

Приведенные ниже списки генерируются из исходного реестра целей и проверяются в CI по файлу `docs/reference/secretref-user-supplied-credentials-matrix.json`; не редактируйте записи вручную.

## Поддерживаемые учетные данные

### Цели `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` через соседнее поле `serviceAccountRef` (исключение для совместимости)
- `channels.googlechat.accounts.*.serviceAccount` через соседнее поле `serviceAccountRef` (исключение для совместимости)

### Цели `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; не поддерживается, если `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; не поддерживается, если `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Примечания:

- Для целей плана профиля аутентификации требуется `agentId`; записи плана нацелены на `profiles.*.key` / `profiles.*.token` и записывают соседние ссылки (`keyRef` / `tokenRef`). Ссылки профиля аутентификации учитываются при разрешении во время выполнения и охватываются аудитом.
- В `openclaw.json` ссылки SecretRef должны использовать структурированные объекты, например `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Устаревшие строки-маркеры `secretref-env:<ENV_VAR>` отклоняются в путях учетных данных SecretRef; выполните `openclaw doctor --fix`, чтобы перенести допустимые маркеры.
- Ограничение политики OAuth: `auth.profiles.<id>.mode = "oauth"` нельзя сочетать с входными данными SecretRef для этого профиля. При нарушении этой политики запуск, перезагрузка и разрешение профиля аутентификации немедленно завершаются с ошибкой.
- Для провайдеров моделей, управляемых через SecretRef, сгенерированные записи `agents/*/agent/models.json` сохраняют несекретные маркеры, а не разрешенные значения секретов, для поверхностей `apiKey` и заголовков. Сохранение маркеров определяется источником: OpenClaw записывает маркеры из активного снимка исходной конфигурации до разрешения, а не из разрешенных значений секретов среды выполнения.
- Для веб-поиска: в режиме явно заданного провайдера, когда установлено `tools.web.search.provider`, активен только ключ выбранного провайдера. В автоматическом режиме, когда `tools.web.search.provider` не задано, активен только первый ключ провайдера, успешно разрешенный в соответствии с приоритетом, а ссылки невыбранных провайдеров считаются неактивными до их выбора. Устаревшие пути провайдеров `tools.web.search.*` по-прежнему разрешаются в течение периода совместимости, но канонической поверхностью SecretRef является `plugins.entries.<plugin>.config.webSearch.*`.

## Неподдерживаемые учетные данные

Эти учетные данные относятся к создаваемым, ротируемым, содержащим сеанс или долговременно хранимым классам OAuth, которые не соответствуют модели разрешения внешних SecretRef только для чтения:

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
- [Семантика учетных данных аутентификации](/ru/auth-credential-semantics)
