---
read_when:
    - Verifica della copertura delle credenziali SecretRef
    - Verifica dell'idoneità di una credenziale per `secrets configure` o `secrets apply`
    - Verifica del motivo per cui una credenziale non rientra nell'ambito supportato
summary: Superficie canonica supportata e non supportata delle credenziali SecretRef
title: Superficie delle credenziali SecretRef
x-i18n:
    generated_at: "2026-07-16T15:02:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a4c7d8d5baf082f5524b93608584600856e48f9076df915c4db301a4ecd814c9
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Questa pagina definisce la superficie canonica delle credenziali SecretRef: quali campi delle credenziali accettano un `SecretRef` (riferimento basato su env/file/exec) anziché un valore segreto non elaborato.

Ambito:

- Incluso nell'ambito: esclusivamente credenziali fornite dall'utente che OpenClaw non genera né ruota.
- Escluso dall'ambito: credenziali generate o ruotate durante l'esecuzione, materiale di aggiornamento OAuth e artefatti assimilabili a sessioni.

Gli elenchi seguenti vengono generati dal registro delle destinazioni nel codice sorgente e verificati rispetto a `docs/reference/secretref-user-supplied-credentials-matrix.json` nella CI; non modificare manualmente le voci.

## Credenziali supportate

### Destinazioni `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` tramite il valore adiacente `serviceAccountRef` (eccezione di compatibilità)
- `channels.googlechat.accounts.*.serviceAccount` tramite il valore adiacente `serviceAccountRef` (eccezione di compatibilità)

### Destinazioni `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; non supportato quando `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; non supportato quando `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Note:

- Le destinazioni del piano del profilo di autenticazione richiedono `agentId`; le voci del piano hanno come destinazione `profiles.*.key` / `profiles.*.token` e scrivono riferimenti adiacenti (`keyRef` / `tokenRef`). I riferimenti dei profili di autenticazione sono inclusi nella risoluzione in fase di esecuzione e nella copertura di audit.
- In `openclaw.json`, i SecretRef devono utilizzare oggetti strutturati come `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Le stringhe marcatore `secretref-env:<ENV_VAR>` legacy vengono rifiutate nei percorsi delle credenziali SecretRef; eseguire `openclaw doctor --fix` per migrare i marcatori validi.
- Protezione dei criteri OAuth: `auth.profiles.<id>.mode = "oauth"` non può essere combinato con input SecretRef per tale profilo. L'avvio/ricaricamento e la risoluzione del profilo di autenticazione generano immediatamente un errore quando questi criteri vengono violati.
- Per i provider di modelli gestiti tramite SecretRef, le voci `agents/*/agent/models.json` generate conservano marcatori non segreti (non valori segreti risolti) per le superfici `apiKey`/header. La persistenza dei marcatori è determinata dalla fonte: OpenClaw scrive i marcatori dall'istantanea di configurazione della fonte attiva (prima della risoluzione), non dai valori segreti risolti in fase di esecuzione.
- Per la ricerca web: in modalità provider esplicito (`tools.web.search.provider` impostato), è attiva solo la chiave del provider selezionato. In modalità automatica (`tools.web.search.provider` non impostato), è attiva solo la prima chiave del provider risolta in base alla precedenza, mentre i riferimenti dei provider non selezionati vengono considerati inattivi finché non vengono selezionati. I percorsi legacy del provider `tools.web.search.*` continuano a essere risolti durante il periodo di compatibilità, ma la superficie SecretRef canonica è `plugins.entries.<plugin>.config.webSearch.*`.

## Credenziali non supportate

Queste credenziali appartengono a classi generate, ruotate, associate a sessioni o persistenti OAuth che non sono compatibili con la risoluzione SecretRef esterna in sola lettura:

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

## Contenuti correlati

- [Gestione dei segreti](/it/gateway/secrets)
- [Semantica delle credenziali di autenticazione](/it/auth-credential-semantics)
