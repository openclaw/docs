---
read_when:
    - Перевірка покриття облікових даних SecretRef
    - Перевірка, чи облікові дані придатні для `secrets configure` або `secrets apply`
    - Перевірка, чому облікові дані перебувають поза підтримуваною поверхнею
summary: Канонічна підтримувана й непідтримувана поверхня облікових даних SecretRef
title: Поверхня облікових даних SecretRef
x-i18n:
    generated_at: "2026-05-11T20:56:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2778ea781f7b6fc4d579892225f9cf29bfb8f9ece5961554620ca8e82123ceff
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Ця сторінка визначає канонічну поверхню облікових даних SecretRef.

Намір області застосування:

- В області застосування: суворо надані користувачем облікові дані, які OpenClaw не створює й не ротирує.
- Поза областю застосування: облікові дані, створені під час виконання або ротовані, матеріали оновлення OAuth і артефакти, подібні до сесій.

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
- `channels.googlechat.serviceAccount` через сусідній `serviceAccountRef` (виняток сумісності)
- `channels.googlechat.accounts.*.serviceAccount` через сусідній `serviceAccountRef` (виняток сумісності)

### Цілі `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; не підтримується, коли `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; не підтримується, коли `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Примітки:

- Цілі плану профілю автентифікації потребують `agentId`.
- Записи плану націлюються на `profiles.*.key` / `profiles.*.token` і записують сусідні посилання (`keyRef` / `tokenRef`).
- Посилання профілю автентифікації включено до розв’язання під час виконання та покриття аудиту.
- В `openclaw.json` SecretRefs мають використовувати структуровані об’єкти, як-от `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Застарілі рядки-маркери `secretref-env:<ENV_VAR>` відхиляються на шляхах облікових даних SecretRef; запустіть `openclaw doctor --fix`, щоб мігрувати дійсні маркери.
- Захист політики OAuth: `auth.profiles.<id>.mode = "oauth"` не можна поєднувати з вхідними даними SecretRef для цього профілю. Запуск/перезавантаження та розв’язання профілю автентифікації швидко завершуються з помилкою, коли цю політику порушено.
- Для провайдерів моделей, керованих SecretRef, згенеровані записи `agents/*/agent/models.json` зберігають несекретні маркери (а не розв’язані секретні значення) для поверхонь `apiKey`/заголовків.
- Збереження маркерів є авторитетним щодо джерела: OpenClaw записує маркери з активного знімка конфігурації джерела (до розв’язання), а не з розв’язаних секретних значень під час виконання.
- Для вебпошуку:
  - У режимі явного провайдера (задано `tools.web.search.provider`) активним є лише ключ вибраного провайдера.
  - В автоматичному режимі (`tools.web.search.provider` не задано) активним є лише перший ключ провайдера, що розв’язується за пріоритетом.
  - В автоматичному режимі посилання невибраних провайдерів вважаються неактивними, доки їх не вибрано.
  - Застарілі шляхи провайдерів `tools.web.search.*` досі розв’язуються протягом вікна сумісності, але канонічною поверхнею SecretRef є `plugins.entries.<plugin>.config.webSearch.*`.

## Непідтримувані облікові дані

Облікові дані поза областю застосування включають:

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

- Ці облікові дані належать до класів створюваних, ротованих, сесійних або довготривалих OAuth-даних, які не відповідають розв’язанню зовнішнього SecretRef лише для читання.

## Пов’язане

- [Керування секретами](/uk/gateway/secrets)
- [Семантика облікових даних автентифікації](/uk/auth-credential-semantics)
