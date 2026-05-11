---
read_when:
    - SecretRef-credentialdekking verifiëren
    - Controleren of een aanmeldgegeven in aanmerking komt voor `secrets configure` of `secrets apply`
    - Controleren waarom een aanmeldingsgegeven buiten het ondersteunde oppervlak valt
summary: Canonieke ondersteunde versus niet-ondersteunde SecretRef-interface voor inloggegevens
title: SecretRef-interface voor inloggegevens
x-i18n:
    generated_at: "2026-05-11T20:49:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2778ea781f7b6fc4d579892225f9cf29bfb8f9ece5961554620ca8e82123ceff
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Deze pagina definieert het canonieke SecretRef-credentialoppervlak.

Scope-intentie:

- Binnen scope: strikt door gebruikers aangeleverde credentials die OpenClaw niet aanmaakt of roteert.
- Buiten scope: tijdens runtime aangemaakte of roterende credentials, OAuth-refreshmateriaal en sessieachtige artefacten.

## Ondersteunde credentials

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
- `channels.googlechat.serviceAccount` via naastgelegen `serviceAccountRef` (compatibiliteitsuitzondering)
- `channels.googlechat.accounts.*.serviceAccount` via naastgelegen `serviceAccountRef` (compatibiliteitsuitzondering)

### `auth-profiles.json`-doelen (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; niet ondersteund wanneer `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; niet ondersteund wanneer `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Opmerkingen:

- Auth-profile-plandoelen vereisen `agentId`.
- Planvermeldingen richten zich op `profiles.*.key` / `profiles.*.token` en schrijven naastgelegen refs (`keyRef` / `tokenRef`).
- Auth-profile-refs zijn opgenomen in runtimeresolutie en auditdekking.
- In `openclaw.json` moeten SecretRefs gestructureerde objecten gebruiken, zoals `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Verouderde `secretref-env:<ENV_VAR>`-markertekens worden geweigerd op SecretRef-credentialpaden; voer `openclaw doctor --fix` uit om geldige markertekens te migreren.
- OAuth-beleidsbewaking: `auth.profiles.<id>.mode = "oauth"` kan niet worden gecombineerd met SecretRef-invoer voor dat profiel. Opstarten/herladen en auth-profile-resolutie falen snel wanneer dit beleid wordt geschonden.
- Voor door SecretRef beheerde modelproviders blijven gegenereerde `agents/*/agent/models.json`-vermeldingen niet-geheime markertekens behouden (niet opgeloste geheime waarden) voor `apiKey`-/headeroppervlakken.
- Markerpersistentie is brongezaghebbend: OpenClaw schrijft markertekens uit de actieve bronconfiguratiesnapshot (vóór resolutie), niet uit opgeloste runtimegeheimwaarden.
- Voor webzoekopdrachten:
  - In expliciete providermodus (`tools.web.search.provider` ingesteld) is alleen de geselecteerde providersleutel actief.
  - In automatische modus (`tools.web.search.provider` niet ingesteld) is alleen de eerste providersleutel die volgens prioriteit wordt opgelost actief.
  - In automatische modus worden niet-geselecteerde providerrefs als inactief behandeld totdat ze worden geselecteerd.
  - Verouderde `tools.web.search.*`-providerpaden worden tijdens de compatibiliteitsperiode nog steeds opgelost, maar het canonieke SecretRef-oppervlak is `plugins.entries.<plugin>.config.webSearch.*`.

## Niet-ondersteunde credentials

Credentials buiten scope zijn onder andere:

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

Motivering:

- Deze credentials zijn aangemaakte, geroteerde, sessiedragende of OAuth-duurzame klassen die niet passen bij alleen-lezen externe SecretRef-resolutie.

## Gerelateerd

- [Geheimenbeheer](/nl/gateway/secrets)
- [Semantiek van auth-credentials](/nl/auth-credential-semantics)
