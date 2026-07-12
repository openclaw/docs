---
read_when:
    - Перевірка охоплення облікових даних SecretRef
    - Перевірка придатності облікових даних для `secrets configure` або `secrets apply`
    - Перевірка причин, чому облікові дані перебувають поза межами підтримуваної поверхні
summary: Канонічна підтримувана й непідтримувана поверхня облікових даних SecretRef
title: Поверхня облікових даних SecretRef
x-i18n:
    generated_at: "2026-07-12T13:40:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Ця сторінка визначає канонічну поверхню облікових даних SecretRef: які поля облікових даних приймають `SecretRef` (посилання на основі змінної середовища, файла або виконуваної команди) замість необробленого секретного значення.

Область застосування:

- У межах області: лише облікові дані, надані користувачем, які OpenClaw не створює та не ротирує.
- Поза межами області: облікові дані, створені або ротовані під час виконання, матеріали оновлення OAuth і артефакти, подібні до сеансових.

Наведені нижче списки генеруються з реєстру цільових полів у вихідному коді та перевіряються в CI за файлом `docs/reference/secretref-user-supplied-credentials-matrix.json`; не редагуйте записи вручну.

## Підтримувані облікові дані

### Цільові поля `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` через сусіднє поле `serviceAccountRef` (виняток для сумісності)
- `channels.googlechat.accounts.*.serviceAccount` через сусіднє поле `serviceAccountRef` (виняток для сумісності)

### Цільові поля `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; не підтримується, коли `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; не підтримується, коли `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Примітки:

- Цільові поля плану профілю автентифікації потребують `agentId`; записи плану націлені на `profiles.*.key` / `profiles.*.token` і записують сусідні посилання (`keyRef` / `tokenRef`). Посилання профілів автентифікації враховуються під час визначення значень у середовищі виконання та перевірки.
- У `openclaw.json` SecretRef мають використовувати структуровані об’єкти, як-от `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Застарілі рядки-маркери `secretref-env:<ENV_VAR>` відхиляються у шляхах облікових даних SecretRef; виконайте `openclaw doctor --fix`, щоб перенести коректні маркери.
- Обмеження політики OAuth: `auth.profiles.<id>.mode = "oauth"` не можна поєднувати з вхідними значеннями SecretRef для цього профілю. Запуск, перезавантаження та визначення профілю автентифікації негайно завершуються помилкою в разі порушення цієї політики.
- Для постачальників моделей, керованих через SecretRef, створені записи `agents/*/agent/models.json` зберігають несекретні маркери, а не визначені секретні значення, для поверхонь `apiKey` і заголовків. Збереження маркерів визначається джерелом: OpenClaw записує маркери з активного знімка конфігурації джерела до визначення значень, а не з визначених секретних значень середовища виконання.
- Для вебпошуку: у режимі явно заданого постачальника (коли встановлено `tools.web.search.provider`) активним є лише ключ вибраного постачальника. В автоматичному режимі (коли `tools.web.search.provider` не встановлено) активним є лише перший ключ постачальника, значення якого визначено відповідно до порядку пріоритету, а посилання невибраних постачальників вважаються неактивними, доки їх не буде вибрано. Застарілі шляхи постачальників `tools.web.search.*` і далі визначаються протягом періоду сумісності, але канонічною поверхнею SecretRef є `plugins.entries.<plugin>.config.webSearch.*`.

## Непідтримувані облікові дані

Ці облікові дані належать до класів, що створюються, ротируються, містять сеансові дані або довготривалі дані OAuth, тому вони не відповідають моделі зовнішнього визначення SecretRef лише для читання:

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

## Пов’язані матеріали

- [Керування секретами](/uk/gateway/secrets)
- [Семантика облікових даних автентифікації](/uk/auth-credential-semantics)
