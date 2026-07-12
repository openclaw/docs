---
read_when:
    - Sviluppo delle funzionalità del canale Google Chat
summary: Stato del supporto, funzionalità e configurazione dell'app Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T06:47:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat viene eseguito come Plugin ufficiale `@openclaw/googlechat`: messaggi diretti e spazi tramite Webhook dell'API Google Chat (solo endpoint HTTP, senza Pub/Sub).

## Installazione

```bash
openclaw plugins install @openclaw/googlechat
```

Checkout locale (durante l'esecuzione da un repository git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Configurazione rapida (principianti)

1. Crea un progetto Google Cloud e abilita la **Google Chat API**.
   - Vai a: [Credenziali della Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Abilita l'API se non è già abilitata.
2. Crea un **Service Account**:
   - Premi **Create Credentials** > **Service Account**.
   - Assegnagli il nome che preferisci (ad esempio, `openclaw-chat`).
   - Lascia vuoti autorizzazioni e principal (**Continue**, quindi **Done**).
3. Crea e scarica la **chiave JSON**:
   - Fai clic sul nuovo account di servizio > scheda **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. Archivia il file JSON scaricato sull'host del Gateway (ad esempio, `~/.openclaw/googlechat-service-account.json`).
5. Crea un'app Google Chat nella [configurazione di Chat in Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Compila **Application info** (nome dell'app, URL dell'avatar, descrizione).
   - Abilita **Interactive features**.
   - In **Functionality**, seleziona **Join spaces and group conversations**.
   - In **Connection settings**, seleziona **HTTP endpoint URL**.
   - In **Triggers**, seleziona **Use a common HTTP endpoint URL for all triggers** e impostalo sull'URL pubblico del Gateway seguito da `/googlechat` (consulta [URL pubblico](#public-url-webhook-only)).
   - In **Visibility**, seleziona **Make this Chat app available to specific people and groups in `<Your Domain>`** e inserisci il tuo indirizzo email.
   - Fai clic su **Save**.
6. Abilita lo stato dell'app: aggiorna la pagina, trova **App status**, impostalo su **Live - available to users** e fai nuovamente clic su **Save**.
7. Configura OpenClaw con l'account di servizio e il destinatario del Webhook (deve corrispondere alla configurazione dell'app Chat):
   - Variabile di ambiente: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (solo account predefinito), oppure
   - Configurazione: consulta [Elementi principali della configurazione](#config-highlights). `openclaw channels add --channel googlechat` accetta anche `--audience-type`, `--audience`, `--webhook-path` e `--webhook-url`.
8. Avvia il Gateway. Google Chat invierà richieste POST al percorso del Webhook (per impostazione predefinita `/googlechat`).

## Aggiunta a Google Chat

Quando il Gateway è in esecuzione e il tuo indirizzo email è incluso nell'elenco di visibilità:

1. Vai a [Google Chat](https://chat.google.com/).
2. Fai clic sull'icona **+** (più) accanto a **Direct Messages**.
3. Cerca l'**App name** configurato in Google Cloud Console.
   - Il bot _non_ compare nell'elenco di consultazione del Marketplace perché è un'app privata; cercalo per nome.
4. Seleziona il bot, fai clic su **Add** o **Chat** e invia un messaggio.

## URL pubblico (solo Webhook)

I Webhook di Google Chat richiedono un endpoint HTTPS pubblico. Per motivi di sicurezza, esponi a Internet **solo il percorso `/googlechat`** e mantieni privati la dashboard di OpenClaw e gli altri endpoint.

### Opzione A: Tailscale Funnel (consigliata)

Usa Tailscale Serve per la dashboard privata e Funnel per il percorso pubblico del Webhook.

1. Controlla l'indirizzo a cui è associato il Gateway:

   ```bash
   ss -tlnp | grep 18789
   ```

   Prendi nota dell'IP (ad esempio, `127.0.0.1`, `0.0.0.0` o un indirizzo Tailscale `100.x.x.x`).

2. Esponi la dashboard solo alla tailnet (porta 8443):

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to a Tailscale IP only:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Esponi pubblicamente solo il percorso del Webhook:

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to a Tailscale IP only:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Se richiesto, visita l'URL di autorizzazione mostrato nell'output per abilitare Funnel per questo Node.

5. Verifica:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

L'URL pubblico del Webhook è `https://<node-name>.<tailnet>.ts.net/googlechat`; la dashboard rimane accessibile solo dalla tailnet all'indirizzo `https://<node-name>.<tailnet>.ts.net:8443/`. Usa l'URL pubblico (senza `:8443`) nella configurazione dell'app Google Chat.

> Nota: questa configurazione persiste dopo i riavvii. Per rimuoverla in seguito, usa `tailscale funnel reset` e `tailscale serve reset`.

### Opzione B: proxy inverso (Caddy)

Inoltra tramite proxy solo il percorso del Webhook:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Le richieste a `your-domain.com/` vengono ignorate o restituiscono 404, mentre `your-domain.com/googlechat` viene instradato a OpenClaw.

### Opzione C: Cloudflare Tunnel

Configura le regole di ingresso del tunnel in modo che instradino solo il percorso del Webhook:

- **Percorso**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Regola predefinita**: HTTP 404 (non trovato)

## Funzionamento

1. Google Chat invia JSON tramite POST al percorso del Webhook del Gateway (solo POST, tipo di contenuto JSON obbligatorio, limite di frequenza per IP).
2. OpenClaw autentica ogni richiesta prima dell'inoltro:
   - Gli eventi dell'app Chat includono `Authorization: Bearer <token>`; il token viene verificato prima di analizzare il corpo completo.
   - Gli eventi dei componenti aggiuntivi di Google Workspace includono il token nel corpo (`authorizationEventObject.systemIdToken`) e vengono letti con limiti di preautenticazione più restrittivi (16 KB, 3 s) prima della verifica.
3. Il token viene verificato rispetto a `audienceType` + `audience`:
   - `audienceType: "app-url"` → il destinatario è l'URL HTTPS del Webhook.
   - `audienceType: "project-number"` → il destinatario è il numero del progetto Cloud.
   - I token dei componenti aggiuntivi con `app-url` richiedono inoltre che `appPrincipal` sia impostato sull'ID client OAuth 2.0 numerico dell'app (21 cifre, non un indirizzo email); in caso contrario, la verifica non riesce e viene registrato un avviso.
4. I messaggi vengono instradati in base allo spazio:
   - Gli spazi ricevono sessioni specifiche per spazio `agent:<agentId>:googlechat:group:<spaceId>`; le risposte vengono inviate al thread del messaggio.
   - Per impostazione predefinita, i messaggi diretti confluiscono nella sessione principale dell'agente; imposta `session.dmScope` per sessioni di messaggi diretti specifiche per interlocutore (consulta [Sessione](/it/concepts/session)).
5. Per impostazione predefinita, l'accesso tramite messaggi diretti usa l'associazione. I mittenti sconosciuti ricevono un codice di associazione; approvalo con:
   - `openclaw pairing approve googlechat <code>`
6. Per impostazione predefinita, gli spazi di gruppo richiedono una @menzione. Le menzioni vengono rilevate dalle annotazioni `USER_MENTION` di Chat indirizzate all'app; imposta `botUser` (ad esempio, `users/1234567890`) se il rilevamento richiede il nome della risorsa utente dell'app.
7. Quando un'approvazione di esecuzione o del Plugin viene avviata da Google Chat ed è configurato un approvatore stabile `users/<id>`, OpenClaw pubblica una scheda di approvazione nativa (`cardsV2`) nello spazio o nel thread di origine. I pulsanti della scheda contengono token di callback opachi; la richiesta manuale `/approve <id> <decision>` compare solo quando la consegna nativa non è disponibile.

## Destinazioni

Usa questi identificatori per la consegna e gli elenchi di elementi consentiti:

- Messaggi diretti: `users/<userId>` (consigliato).
- Spazi: `spaces/<spaceId>`.
- L'indirizzo email non elaborato `name@example.com` è modificabile e viene usato per la corrispondenza con l'elenco di elementi consentiti solo quando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsoleto: `users/<email>` viene trattato come ID utente, non come voce email dell'elenco di elementi consentiti.
- I prefissi `googlechat:`, `google-chat:` e `gchat:` vengono accettati e rimossi.

## Elementi principali della configurazione

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // add-on verification only; numeric OAuth client ID
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Note:

- Credenziali dell'account di servizio: `serviceAccountFile` (percorso), `serviceAccount` (stringa JSON incorporata od oggetto) oppure `serviceAccountRef` (SecretRef di variabile di ambiente/file). Le variabili di ambiente `GOOGLE_CHAT_SERVICE_ACCOUNT` (JSON incorporato) e `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (percorso) si applicano solo all'account predefinito. Le configurazioni con più account usano `channels.googlechat.accounts.<id>` con le stesse chiavi, incluso un `serviceAccountRef` per ciascun account.
- Quando `webhookPath` non è impostato, il percorso predefinito del Webhook è `/googlechat`; in alternativa, `webhookUrl` può fornire il percorso.
- Le chiavi dei gruppi devono essere ID stabili degli spazi (`spaces/<spaceId>`). Le chiavi basate sul nome visualizzato sono obsolete e vengono registrate come tali.
- `dangerouslyAllowNameMatching` riabilita la corrispondenza dei principal tramite indirizzi email modificabili per gli elenchi di elementi consentiti (modalità di compatibilità di emergenza); doctor segnala le voci email.
- Le azioni di reazione di Google Chat non sono esposte. Il Plugin usa l'autenticazione tramite account di servizio, mentre gli endpoint delle reazioni di Google Chat richiedono l'autenticazione dell'utente. La configurazione esistente `actions.reactions` viene accettata per compatibilità, ma non produce alcun effetto.
- Le schede di approvazione native usano i clic sui pulsanti `cardsV2` di Google Chat, non gli eventi di reazione. Gli approvatori provengono da `dm.allowFrom` o `defaultTo` e devono essere valori numerici stabili nel formato `users/<id>`.
- Le azioni dei messaggi espongono solo l'invio di testo tramite `send`. Il caricamento degli allegati di Google Chat richiede l'autenticazione dell'utente, mentre questo Plugin usa l'autenticazione tramite account di servizio; pertanto, il caricamento di file in uscita non è esposto.
- `typingIndicator`: `message` (impostazione predefinita) pubblica un segnaposto `_<Bot> is typing..._` e lo modifica trasformandolo nella prima risposta; `none` lo disabilita; `reaction` richiede OAuth utente e, con l'autenticazione tramite account di servizio, attualmente ripiega su `message` registrando un errore.
- Gli allegati in entrata (il primo allegato di ogni messaggio) vengono scaricati tramite l'API Chat nella pipeline multimediale, con un limite definito da `mediaMaxMb` (20 per impostazione predefinita).
- Per impostazione predefinita, i messaggi creati dai bot vengono ignorati. Con `allowBots: true`, i messaggi dei bot accettati usano la [protezione condivisa dai cicli dei bot](/it/channels/bot-loop-protection): configura `channels.defaults.botLoopProtection`, quindi esegui l'override con `channels.googlechat.botLoopProtection` o `channels.googlechat.groups.<space>.botLoopProtection`.

Dettagli sui riferimenti ai segreti: [Gestione dei segreti](/it/gateway/secrets).

## Risoluzione dei problemi

### 405 Metodo non consentito

Se Logs Explorer di Google Cloud mostra errori come:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Il gestore del Webhook non è registrato. Cause comuni:

1. **Canale non configurato**: la sezione `channels.googlechat` è assente. Verifica con:

   ```bash
   openclaw config get channels.googlechat
   ```

   Se restituisce "Config path not found", aggiungi la configurazione (consulta [Elementi principali della configurazione](#config-highlights)).

2. **Plugin non abilitato**: controlla lo stato del Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Se mostra "disabled", aggiungi `plugins.entries.googlechat.enabled: true` alla configurazione.

3. **Gateway non riavviato** dopo le modifiche alla configurazione:

   ```bash
   openclaw gateway restart
   ```

Verifica che il canale sia in esecuzione:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Altri problemi

- `openclaw channels status --probe` mostra gli errori di autenticazione e l'eventuale configurazione mancante del destinatario (`audience` e `audienceType` sono entrambi obbligatori).
- Se non arriva alcun messaggio, verifica l'URL del Webhook dell'app Chat e la configurazione dei trigger.
- Se il controllo delle menzioni blocca le risposte, imposta `botUser` sul nome della risorsa utente dell'app e controlla `requireMention`.
- L'esecuzione di `openclaw logs --follow` durante l'invio di un messaggio di prova mostra se le richieste raggiungono il Gateway.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Configurazione del Gateway](/it/gateway/configuration)
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e filtro basato sulle menzioni
- [Associazione](/it/channels/pairing) — autenticazione dei messaggi diretti e flusso di associazione
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento della sicurezza
