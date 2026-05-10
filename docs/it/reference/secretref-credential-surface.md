---
read_when:
    - Verifica della copertura delle credenziali SecretRef
    - Verifica se una credenziale è idonea per `secrets configure` o `secrets apply`
    - Verificare perché una credenziale è fuori dalla superficie supportata
summary: Superficie canonica supportata e non supportata per le credenziali SecretRef
title: Superficie delle credenziali SecretRef
x-i18n:
    generated_at: "2026-05-10T19:51:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2778ea781f7b6fc4d579892225f9cf29bfb8f9ece5961554620ca8e82123ceff
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Questa pagina definisce la superficie canonica delle credenziali SecretRef.

Intento dell'ambito:

- Incluso nell'ambito: credenziali fornite rigorosamente dall'utente che OpenClaw non genera né ruota.
- Fuori dall'ambito: credenziali generate a runtime o a rotazione, materiale di refresh OAuth e artefatti assimilabili a sessioni.

## Credenziali supportate

### Target di `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` tramite campo sibling `serviceAccountRef` (eccezione di compatibilità)
- `channels.googlechat.accounts.*.serviceAccount` tramite campo sibling `serviceAccountRef` (eccezione di compatibilità)

### Target di `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; non supportato quando `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; non supportato quando `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Note:

- I target del piano dei profili di autenticazione richiedono `agentId`.
- Le voci del piano puntano a `profiles.*.key` / `profiles.*.token` e scrivono riferimenti sibling (`keyRef` / `tokenRef`).
- I riferimenti dei profili di autenticazione sono inclusi nella risoluzione a runtime e nella copertura dell'audit.
- In `openclaw.json`, i SecretRef devono usare oggetti strutturati come `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Le stringhe marker legacy `secretref-env:<ENV_VAR>` vengono rifiutate nei percorsi delle credenziali SecretRef; esegui `openclaw doctor --fix` per migrare i marker validi.
- Guardia della policy OAuth: `auth.profiles.<id>.mode = "oauth"` non può essere combinato con input SecretRef per quel profilo. Avvio/ricaricamento e risoluzione dei profili di autenticazione falliscono rapidamente quando questa policy viene violata.
- Per i provider di modelli gestiti da SecretRef, le voci generate `agents/*/agent/models.json` mantengono marker non segreti (non valori segreti risolti) per le superfici `apiKey`/header.
- La persistenza dei marker è autorevole rispetto alla sorgente: OpenClaw scrive i marker dallo snapshot della configurazione sorgente attiva (prima della risoluzione), non dai valori segreti runtime risolti.
- Per la ricerca web:
  - In modalità provider esplicita (`tools.web.search.provider` impostato), è attiva solo la chiave del provider selezionato.
  - In modalità automatica (`tools.web.search.provider` non impostato), è attiva solo la prima chiave del provider che viene risolta in base alla precedenza.
  - In modalità automatica, i riferimenti dei provider non selezionati vengono trattati come inattivi finché non vengono selezionati.
  - I percorsi provider legacy `tools.web.search.*` continuano a risolversi durante la finestra di compatibilità, ma la superficie SecretRef canonica è `plugins.entries.<plugin>.config.webSearch.*`.

## Credenziali non supportate

Le credenziali fuori dall'ambito includono:

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

Motivazione:

- Queste credenziali sono classi generate, ruotate, portatrici di sessione o durevoli OAuth che non si adattano alla risoluzione SecretRef esterna in sola lettura.

## Correlati

- [Gestione dei segreti](/it/gateway/secrets)
- [Semantica delle credenziali di autenticazione](/it/auth-credential-semantics)
