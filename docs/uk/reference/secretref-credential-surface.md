---
read_when:
    - Перевірка охоплення облікових даних SecretRef
    - Перевірка, чи облікові дані придатні для `secrets configure` або `secrets apply`
    - Перевірка причини, чому облікові дані перебувають поза межами підтримуваної поверхні
summary: Канонічна підтримувана й непідтримувана область облікових даних SecretRef
title: Поверхня облікових даних SecretRef
x-i18n:
    generated_at: "2026-07-16T18:35:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a4c7d8d5baf082f5524b93608584600856e48f9076df915c4db301a4ecd814c9
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Ця сторінка визначає канонічну поверхню облікових даних SecretRef: які поля облікових даних приймають `SecretRef` (посилання на основі env/file/exec) замість необробленого значення секрету.

Область застосування:

- У межах області застосування: лише надані користувачем облікові дані, які OpenClaw не створює та не оновлює.
- Поза областю застосування: облікові дані, створені або оновлювані під час виконання, матеріали оновлення OAuth і артефакти, подібні до сеансових.

Наведені нижче списки генеруються з реєстру цільових об’єктів у вихідному коді та перевіряються щодо `docs/reference/secretref-user-supplied-credentials-matrix.json` у CI; не редагуйте записи вручну.

## Підтримувані облікові дані

### Цільові об’єкти `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` через сусіднє `serviceAccountRef` (виняток для сумісності)
- `channels.googlechat.accounts.*.serviceAccount` через сусіднє `serviceAccountRef` (виняток для сумісності)

### Цільові об’єкти `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; не підтримується, коли `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; не підтримується, коли `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Примітки:

- Цільові об’єкти плану профілю автентифікації потребують `agentId`; записи плану націлені на `profiles.*.key` / `profiles.*.token` і записують сусідні посилання (`keyRef` / `tokenRef`). Посилання профілю автентифікації охоплено розв’язанням під час виконання та аудитом.
- У `openclaw.json` SecretRef мають використовувати структуровані об’єкти, як-от `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Застарілі рядки-маркери `secretref-env:<ENV_VAR>` відхиляються в шляхах облікових даних SecretRef; запустіть `openclaw doctor --fix`, щоб перенести допустимі маркери.
- Захисне правило політики OAuth: `auth.profiles.<id>.mode = "oauth"` не можна поєднувати з вхідними даними SecretRef для цього профілю. Запуск/перезавантаження та розв’язання профілю автентифікації негайно завершуються помилкою в разі порушення цієї політики.
- Для постачальників моделей, керованих через SecretRef, згенеровані записи `agents/*/agent/models.json` зберігають несекретні маркери (а не розв’язані значення секретів) для поверхонь `apiKey`/заголовків. Збереження маркерів визначається джерелом: OpenClaw записує маркери з активного знімка вихідної конфігурації (до розв’язання), а не з розв’язаних значень секретів під час виконання.
- Для вебпошуку: у режимі явно вказаного постачальника (задано `tools.web.search.provider`) активний лише ключ вибраного постачальника. В автоматичному режимі (`tools.web.search.provider` не задано) активний лише перший ключ постачальника, розв’язаний за порядком пріоритету, а посилання невибраних постачальників вважаються неактивними, доки відповідного постачальника не буде вибрано. Застарілі шляхи постачальника `tools.web.search.*` усе ще розв’язуються протягом періоду сумісності, але канонічною поверхнею SecretRef є `plugins.entries.<plugin>.config.webSearch.*`.

## Непідтримувані облікові дані

Ці облікові дані належать до класів створюваних, оновлюваних, пов’язаних із сеансом або довготривалих OAuth-даних, які не відповідають зовнішньому розв’язанню SecretRef лише для читання:

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
