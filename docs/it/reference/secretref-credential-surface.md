---
read_when:
    - Verifica della copertura delle credenziali SecretRef
    - Verifica se una credenziale è idonea per `secrets configure` o `secrets apply`
    - Verifica del motivo per cui una credenziale è al di fuori della superficie supportata
summary: Superficie canonica delle credenziali SecretRef supportate rispetto a quelle non supportate
title: Superficie delle credenziali SecretRef
x-i18n:
    generated_at: "2026-04-05T14:03:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf997389de1dae8c059d8dfbf186eda979f864de632a033177d6cd5e5544675d
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

# Superficie delle credenziali SecretRef

Questa pagina definisce la superficie canonica delle credenziali SecretRef.

Obiettivo dell'ambito:

- Nell'ambito: credenziali fornite rigorosamente dall'utente che OpenClaw non genera né ruota.
- Fuori ambito: credenziali generate a runtime o soggette a rotazione, materiale di refresh OAuth e artefatti simili a sessioni.

## Credenziali supportate

### Target `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `plugins.entries.firecrawl.config.webFetch.apiKey`
- `plugins.entries.brave.config.webSearch.apiKey`
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
- `channels.googlechat.serviceAccount` tramite `serviceAccountRef` sibling (eccezione di compatibilità)
- `channels.googlechat.accounts.*.serviceAccount` tramite `serviceAccountRef` sibling (eccezione di compatibilità)

### Target `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; non supportato quando `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; non supportato quando `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Note:

- I target del piano auth-profile richiedono `agentId`.
- Le voci del piano prendono di mira `profiles.*.key` / `profiles.*.token` e scrivono ref sibling (`keyRef` / `tokenRef`).
- I ref auth-profile sono inclusi nella risoluzione a runtime e nella copertura dell'audit.
- Guardrail del criterio OAuth: `auth.profiles.<id>.mode = "oauth"` non può essere combinato con input SecretRef per quel profilo. L'avvio/ricaricamento e la risoluzione dell'auth-profile falliscono immediatamente quando questo criterio viene violato.
- Per i model provider gestiti da SecretRef, le voci generate `agents/*/agent/models.json` persistono marker non segreti (non valori segreti risolti) per le superfici `apiKey`/header.
- La persistenza dei marker è autorevole rispetto alla sorgente: OpenClaw scrive i marker dallo snapshot di configurazione sorgente attivo (pre-risoluzione), non dai valori segreti risolti a runtime.
- Per la web search:
  - In modalità provider esplicita (`tools.web.search.provider` impostato), è attiva solo la chiave del provider selezionato.
  - In modalità automatica (`tools.web.search.provider` non impostato), è attiva solo la prima chiave provider che si risolve in base alla precedenza.
  - In modalità automatica, i ref dei provider non selezionati vengono trattati come inattivi fino alla selezione.
  - I percorsi legacy del provider `tools.web.search.*` continuano a risolversi durante la finestra di compatibilità, ma la superficie canonica SecretRef è `plugins.entries.<plugin>.config.webSearch.*`.

## Credenziali non supportate

Le credenziali fuori ambito includono:

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

- Queste credenziali sono generate, ruotate, associate a sessioni oppure appartengono a classi OAuth durevoli che non si adattano alla risoluzione esterna SecretRef in sola lettura.
