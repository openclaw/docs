---
read_when:
    - Dekking van SecretRef-referenties verifiëren
    - Controleren of een aanmeldgegeven in aanmerking komt voor `secrets configure` of `secrets apply`
    - Controleren waarom een aanmeldgegeven buiten het ondersteunde oppervlak valt
summary: Canoniek ondersteund versus niet-ondersteund SecretRef-oppervlak voor inloggegevens
title: SecretRef-oppervlak voor inloggegevens
x-i18n:
    generated_at: "2026-04-29T23:16:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: b04902427e9851cc36c1dfd07ed44b46b55450c251075e9955af6696f08bc334
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Deze pagina definieert het canonieke SecretRef-referentieoppervlak.

Doel van de scope:

- Binnen scope: strikt door de gebruiker aangeleverde referenties die OpenClaw niet aanmaakt of roteert.
- Buiten scope: referenties die tijdens runtime worden aangemaakt of roteren, OAuth-verversingsmateriaal en sessieachtige artefacten.

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
- `channels.googlechat.serviceAccount` via zuster-`serviceAccountRef` (compatibiliteitsuitzondering)
- `channels.googlechat.accounts.*.serviceAccount` via zuster-`serviceAccountRef` (compatibiliteitsuitzondering)

### `auth-profiles.json`-doelen (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; niet ondersteund wanneer `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; niet ondersteund wanneer `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Opmerkingen:

- Auth-profielplandoelen vereisen `agentId`.
- Planvermeldingen richten zich op `profiles.*.key` / `profiles.*.token` en schrijven zusterrefs (`keyRef` / `tokenRef`).
- Auth-profielrefs zijn opgenomen in runtime-resolutie en auditdekking.
- In `openclaw.json` moeten SecretRefs gestructureerde objecten gebruiken zoals `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Verouderde `secretref-env:<ENV_VAR>`-markertekens worden geweigerd op SecretRef-referentiepaden; voer `openclaw doctor --fix` uit om geldige markeringen te migreren.
- OAuth-beleidsbewaking: `auth.profiles.<id>.mode = "oauth"` kan niet worden gecombineerd met SecretRef-invoer voor dat profiel. Opstarten/herladen en auth-profielresolutie falen snel wanneer dit beleid wordt geschonden.
- Voor door SecretRef beheerde modelproviders blijven gegenereerde `agents/*/agent/models.json`-vermeldingen niet-geheime markeringen behouden (niet opgeloste geheime waarden) voor `apiKey`-/headeroppervlakken.
- Markeringspersistentie is brongezaghebbend: OpenClaw schrijft markeringen vanuit de actieve bronconfiguratiesnapshot (vóór resolutie), niet vanuit opgeloste runtime-geheime waarden.
- Voor webzoekopdrachten:
  - In expliciete providermodus (`tools.web.search.provider` ingesteld) is alleen de geselecteerde providersleutel actief.
  - In automatische modus (`tools.web.search.provider` niet ingesteld) is alleen de eerste providersleutel die volgens de prioriteit wordt opgelost actief.
  - In automatische modus worden niet-geselecteerde providerrefs als inactief behandeld totdat ze worden geselecteerd.
  - Verouderde `tools.web.search.*`-providerpaden worden tijdens de compatibiliteitsperiode nog steeds opgelost, maar het canonieke SecretRef-oppervlak is `plugins.entries.<plugin>.config.webSearch.*`.

## Niet-ondersteunde referenties

Referenties buiten scope omvatten:

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

Reden:

- Deze referenties zijn klassen die worden aangemaakt, geroteerd, sessiedragend zijn of OAuth-duurzaam zijn en niet passen bij alleen-lezen externe SecretRef-resolutie.

## Gerelateerd

- [Geheimenbeheer](/nl/gateway/secrets)
- [Semantiek van auth-referenties](/nl/auth-credential-semantics)
