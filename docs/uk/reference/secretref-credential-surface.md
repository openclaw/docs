---
read_when:
    - Перевірка покриття облікових даних SecretRef
    - Аудит того, чи придатний обліковий запис для `secrets configure` або `secrets apply`
    - Перевірка того, чому облікові дані знаходяться поза підтримуваною поверхнею
summary: Канонічна підтримувана й непідтримувана поверхня облікових даних SecretRef
title: Поверхня облікових даних SecretRef
x-i18n:
    generated_at: "2026-04-23T21:10:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e5ec5affbdb186f33f0d5c38fb42b92a74c3ce9fa7967c1e28633c9579fe46f
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

Ця сторінка визначає канонічну поверхню облікових даних SecretRef.

Намір області охоплення:

- У межах області: суворо користувацькі облікові дані, які OpenClaw не створює й не ротуює.
- Поза областю: облікові дані, створені під час виконання або такі, що ротуються, матеріали OAuth refresh і артефакти, подібні до сесій.

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
- `channels.googlechat.serviceAccount` через сусідній `serviceAccountRef` (виняток сумісності)
- `channels.googlechat.accounts.*.serviceAccount` через сусідній `serviceAccountRef` (виняток сумісності)

### Цілі `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; не підтримується, коли `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; не підтримується, коли `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Примітки:

- Цілі плану auth-profile вимагають `agentId`.
- Записи плану націлюються на `profiles.*.key` / `profiles.*.token` і записують сусідні refs (`keyRef` / `tokenRef`).
- Refs auth-profile включені до runtime resolution і coverage аудиту.
- Захист політики OAuth: `auth.profiles.<id>.mode = "oauth"` не можна поєднувати з SecretRef input для цього profile. Startup/reload і розв’язання auth-profile завершуються fail-fast, коли цю політику порушено.
- Для provider-ів моделей, керованих через SecretRef, згенеровані записи `agents/*/agent/models.json` зберігають маркери без секретів (а не розв’язані секретні значення) для поверхонь `apiKey`/header.
- Збереження маркерів є source-authoritative: OpenClaw записує маркери з активного source config snapshot (до розв’язання), а не з розв’язаних runtime secret values.
- Для web search:
  - У явному режимі provider-а (задано `tools.web.search.provider`) активний лише ключ вибраного provider-а.
  - У режимі auto (`tools.web.search.provider` не задано) активний лише перший ключ provider-а, який розв’язується за precedence.
  - У режимі auto refs невибраних provider-ів вважаються неактивними, доки їх не буде вибрано.
  - Legacy-шляхи provider-а `tools.web.search.*` усе ще розв’язуються в межах вікна сумісності, але канонічна поверхня SecretRef — це `plugins.entries.<plugin>.config.webSearch.*`.

## Непідтримувані облікові дані

До облікових даних поза областю охоплення належать:

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

- Ці облікові дані належать до класів, які створюються, ротуються, несуть стан сесії або є тривалими для OAuth, і не підходять для read-only external SecretRef resolution.
