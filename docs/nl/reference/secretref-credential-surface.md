---
read_when:
    - Dekking van SecretRef-referenties verifiëren
    - Controleren of een credential in aanmerking komt voor `secrets configure` of `secrets apply`
    - Controleren waarom een inloggegeven buiten het ondersteunde bereik valt
summary: Canoniek ondersteund versus niet-ondersteund SecretRef-referentieoppervlak voor aanmeldgegevens
title: SecretRef-referentie voor inloggegevens
x-i18n:
    generated_at: "2026-07-16T16:32:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a4c7d8d5baf082f5524b93608584600856e48f9076df915c4db301a4ecd814c9
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Deze pagina definieert het canonieke SecretRef-oppervlak voor referenties: welke referentievelden een `SecretRef` (een door env/file/exec ondersteunde referentie) accepteren in plaats van een onbewerkte geheime waarde.

Bereik:

- Binnen bereik: uitsluitend door gebruikers verstrekte referenties die OpenClaw niet uitgeeft of roteert.
- Buiten bereik: tijdens runtime uitgegeven of roterende referenties, OAuth-vernieuwingsmateriaal en sessieachtige artefacten.

De onderstaande lijsten worden gegenereerd vanuit het bronregister met doelen en in CI gecontroleerd aan de hand van `docs/reference/secretref-user-supplied-credentials-matrix.json`; bewerk de vermeldingen niet handmatig.

## Ondersteunde referenties

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
- `channels.googlechat.serviceAccount` via naastliggende `serviceAccountRef` (compatibiliteitsuitzondering)
- `channels.googlechat.accounts.*.serviceAccount` via naastliggende `serviceAccountRef` (compatibiliteitsuitzondering)

### `auth-profiles.json`-doelen (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; niet ondersteund wanneer `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; niet ondersteund wanneer `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Opmerkingen:

- Doelen voor authenticatieprofielplannen vereisen `agentId`; planvermeldingen richten zich op `profiles.*.key` / `profiles.*.token` en schrijven naastliggende verwijzingen (`keyRef` / `tokenRef`). Verwijzingen naar authenticatieprofielen vallen onder de runtime-resolutie en auditdekking.
- In `openclaw.json` moeten SecretRefs gestructureerde objecten gebruiken, zoals `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Verouderde `secretref-env:<ENV_VAR>`-markeringstekenreeksen worden geweigerd op SecretRef-referentiepaden; voer `openclaw doctor --fix` uit om geldige markeringen te migreren.
- OAuth-beleidsbeveiliging: `auth.profiles.<id>.mode = "oauth"` kan niet worden gecombineerd met SecretRef-invoer voor dat profiel. Opstarten/herladen en de resolutie van authenticatieprofielen mislukken onmiddellijk wanneer dit beleid wordt geschonden.
- Voor door SecretRef beheerde modelproviders bewaren gegenereerde `agents/*/agent/models.json`-vermeldingen niet-geheime markeringen (geen opgeloste geheime waarden) voor `apiKey`-/headeroppervlakken. Het bewaren van markeringen volgt de gezaghebbende bron: OpenClaw schrijft markeringen vanuit de actieve momentopname van de bronconfiguratie (vóór resolutie), niet vanuit opgeloste geheime runtimewaarden.
- Voor zoeken op internet: in de expliciete providermodus (`tools.web.search.provider` ingesteld) is alleen de sleutel van de geselecteerde provider actief. In de automatische modus (`tools.web.search.provider` niet ingesteld) is alleen de eerste providersleutel actief die volgens de prioriteitsvolgorde wordt opgelost, en verwijzingen naar niet-geselecteerde providers worden als inactief behandeld totdat ze worden geselecteerd. Verouderde `tools.web.search.*`-providerpaden worden tijdens de compatibiliteitsperiode nog steeds opgelost, maar het canonieke SecretRef-oppervlak is `plugins.entries.<plugin>.config.webSearch.*`.

## Niet-ondersteunde referenties

Deze referenties worden uitgegeven of geroteerd, bevatten sessiegegevens of behoren tot duurzame OAuth-klassen die niet geschikt zijn voor alleen-lezenresolutie van externe SecretRefs:

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

- [Geheimenbeheer](/nl/gateway/secrets)
- [Semantiek van authenticatiereferenties](/nl/auth-credential-semantics)
