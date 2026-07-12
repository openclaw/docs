---
read_when:
    - Dekking van SecretRef-referenties verifiëren
    - Controleren of een aanmeldgegeven in aanmerking komt voor `secrets configure` of `secrets apply`
    - Controleren waarom een inloggegeven buiten het ondersteunde bereik valt
summary: Canoniek ondersteund versus niet-ondersteund SecretRef-referentieoppervlak voor aanmeldgegevens
title: SecretRef-inloggegevensoppervlak
x-i18n:
    generated_at: "2026-07-12T09:17:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Deze pagina definieert het canonieke referentievlak voor SecretRef-inloggegevens: welke velden voor inloggegevens een `SecretRef` (een door env/bestand/exec ondersteunde verwijzing) accepteren in plaats van een onbewerkte geheime waarde.

Bereik:

- Binnen bereik: uitsluitend door de gebruiker aangeleverde inloggegevens die OpenClaw niet aanmaakt of roteert.
- Buiten bereik: tijdens runtime aangemaakte of roterende inloggegevens, OAuth-vernieuwingsmateriaal en sessieachtige artefacten.

De onderstaande lijsten worden gegenereerd vanuit het bronregister met doelen en in CI gecontroleerd aan de hand van `docs/reference/secretref-user-supplied-credentials-matrix.json`; bewerk de vermeldingen niet handmatig.

## Ondersteunde inloggegevens

### `openclaw.json`-doelen (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` via naastgelegen `serviceAccountRef` (compatibiliteitsuitzondering)
- `channels.googlechat.accounts.*.serviceAccount` via naastgelegen `serviceAccountRef` (compatibiliteitsuitzondering)

### `auth-profiles.json`-doelen (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; niet ondersteund wanneer `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; niet ondersteund wanneer `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Opmerkingen:

- Plandoelen voor authenticatieprofielen vereisen `agentId`; planvermeldingen zijn gericht op `profiles.*.key` / `profiles.*.token` en schrijven naastgelegen verwijzingen (`keyRef` / `tokenRef`). Verwijzingen van authenticatieprofielen worden meegenomen in runtime-resolutie en auditdekking.
- In `openclaw.json` moeten SecretRefs gestructureerde objecten gebruiken, zoals `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Verouderde markeringstekenreeksen van de vorm `secretref-env:<ENV_VAR>` worden geweigerd op paden voor SecretRef-inloggegevens; voer `openclaw doctor --fix` uit om geldige markeringen te migreren.
- OAuth-beleidscontrole: `auth.profiles.<id>.mode = "oauth"` kan niet worden gecombineerd met SecretRef-invoer voor dat profiel. Opstarten/herladen en de resolutie van authenticatieprofielen mislukken onmiddellijk wanneer dit beleid wordt geschonden.
- Voor door SecretRef beheerde modelproviders bewaren gegenereerde vermeldingen in `agents/*/agent/models.json` niet-geheime markeringen (geen opgeloste geheime waarden) voor `apiKey`-/header-oppervlakken. Het bewaren van markeringen is brongezaghebbend: OpenClaw schrijft markeringen vanuit de momentopname van de actieve bronconfiguratie (vóór resolutie), niet vanuit opgeloste geheime runtimewaarden.
- Voor zoeken op het web: in de expliciete providermodus (`tools.web.search.provider` ingesteld) is alleen de sleutel van de geselecteerde provider actief. In de automatische modus (`tools.web.search.provider` niet ingesteld) is alleen de eerste providersleutel actief die volgens de voorrangsvolgorde kan worden opgelost, en verwijzingen van niet-geselecteerde providers worden als inactief beschouwd totdat ze worden geselecteerd. Verouderde providerpaden onder `tools.web.search.*` worden tijdens het compatibiliteitsvenster nog steeds opgelost, maar het canonieke SecretRef-oppervlak is `plugins.entries.<plugin>.config.webSearch.*`.

## Niet-ondersteunde inloggegevens

Deze inloggegevens behoren tot klassen die worden aangemaakt, geroteerd, sessies bevatten of duurzaam voor OAuth zijn en daarom niet passen bij alleen-lezen externe SecretRef-resolutie:

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

## Gerelateerd

- [Beheer van geheimen](/nl/gateway/secrets)
- [Semantiek van authenticatiegegevens](/nl/auth-credential-semantics)
