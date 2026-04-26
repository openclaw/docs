---
read_when:
    - Перевірка покриття облікових даних SecretRef
    - Аудит того, чи облікові дані придатні для `secrets configure` або `secrets apply`
    - Перевірка того, чому облікові дані перебувають поза підтримуваною поверхнею
summary: Канонічна підтримувана та непідтримувана поверхня облікових даних SecretRef
title: поверхня облікових даних SecretRef
x-i18n:
    generated_at: "2026-04-26T01:57:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ffdf545e954f8d73d18adfeb196d9092bf346bd86648f09314bad2a0f40bb6c
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

Ця сторінка визначає канонічну поверхню облікових даних SecretRef.

Призначення області:

- В області: суворо лише надані користувачем облікові дані, які OpenClaw не випускає і не ротує.
- Поза областю: облікові дані, що випускаються або ротуються під час виконання, матеріали оновлення OAuth та артефакти на кшталт сесій.

## Підтримувані облікові дані

### Цілі `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
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
- `channels.googlechat.serviceAccount` через сусідній `serviceAccountRef` (виняток для сумісності)
- `channels.googlechat.accounts.*.serviceAccount` через сусідній `serviceAccountRef` (виняток для сумісності)

### Цілі `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; не підтримується, коли `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; не підтримується, коли `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Примітки:

- Цілі плану профілю автентифікації потребують `agentId`.
- Записи плану націлюються на `profiles.*.key` / `profiles.*.token` і записують сусідні посилання (`keyRef` / `tokenRef`).
- Посилання профілю автентифікації включені до покриття під час виконання та аудиту.
- У `openclaw.json` SecretRef мають використовувати структуровані об’єкти, такі як `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Застарілі рядки-маркери `secretref-env:<ENV_VAR>` відхиляються на шляхах облікових даних SecretRef; запустіть `openclaw doctor --fix`, щоб мігрувати дійсні маркери.
- Захист політики OAuth: `auth.profiles.<id>.mode = "oauth"` не можна поєднувати з вхідними даними SecretRef для цього профілю. Під час запуску/перезавантаження та розв’язання профілю автентифікації відбувається негайне завершення з помилкою, якщо цю політику порушено.
- Для модельних провайдерів, керованих SecretRef, згенеровані записи `agents/*/agent/models.json` зберігають несекретні маркери (а не розв’язані секретні значення) для поверхонь `apiKey`/заголовків.
- Збереження маркерів є авторитетним щодо джерела: OpenClaw записує маркери з активного знімка конфігурації джерела (до розв’язання), а не з розв’язаних значень секретів під час виконання.
- Для вебпошуку:
  - У режимі явного провайдера (`tools.web.search.provider` встановлено) активний лише ключ вибраного провайдера.
  - В автоматичному режимі (`tools.web.search.provider` не встановлено) активний лише перший ключ провайдера, який розв’язується за пріоритетом.
  - В автоматичному режимі посилання невибраних провайдерів вважаються неактивними, доки їх не буде вибрано.
  - Застарілі шляхи провайдерів `tools.web.search.*` усе ще розв’язуються протягом вікна сумісності, але канонічною поверхнею SecretRef є `plugins.entries.<plugin>.config.webSearch.*`.

## Непідтримувані облікові дані

До облікових даних поза областю належать:

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

Обґрунтування:

- Ці облікові дані належать до класів, які випускаються, ротуються, пов’язані із сесіями або є довготривалими для OAuth, і не відповідають моделі зовнішнього розв’язання SecretRef лише для читання.

## Пов’язане

- [Керування секретами](/uk/gateway/secrets)
- [Семантика облікових даних автентифікації](/uk/auth-credential-semantics)
