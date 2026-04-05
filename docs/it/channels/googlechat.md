---
read_when:
    - Lavori sulle funzionalità del canale Google Chat
summary: Stato del supporto dell'app Google Chat, capacità e configurazione
title: Google Chat
x-i18n:
    generated_at: "2026-04-05T13:42:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 570894ed798dd0b9ba42806b050927216379a1228fcd2f96de565bc8a4ac7c2c
    source_path: channels/googlechat.md
    workflow: 15
---

# Google Chat (API Chat)

Stato: pronto per messaggi diretti + spazi tramite webhook dell'API Google Chat (solo HTTP).

## Configurazione rapida (principianti)

1. Crea un progetto Google Cloud e abilita la **Google Chat API**.
   - Vai a: [Credenziali API Google Chat](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Abilita l'API se non è già abilitata.
2. Crea un **Account di servizio**:
   - Premi **Create Credentials** > **Service Account**.
   - Assegna il nome che preferisci (ad esempio `openclaw-chat`).
   - Lascia vuote le autorizzazioni (premi **Continue**).
   - Lascia vuoti i principal con accesso (premi **Done**).
3. Crea e scarica la **chiave JSON**:
   - Nell'elenco degli account di servizio, fai clic su quello che hai appena creato.
   - Vai alla scheda **Keys**.
   - Fai clic su **Add Key** > **Create new key**.
   - Seleziona **JSON** e premi **Create**.
4. Salva il file JSON scaricato sul tuo host gateway (ad esempio `~/.openclaw/googlechat-service-account.json`).
5. Crea un'app Google Chat nella [Configurazione Chat di Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Compila le **informazioni dell'applicazione**:
     - **App name**: (ad esempio `OpenClaw`)
     - **Avatar URL**: (ad esempio `https://openclaw.ai/logo.png`)
     - **Description**: (ad esempio `Assistente AI personale`)
   - Abilita **Interactive features**.
   - In **Functionality**, seleziona **Join spaces and group conversations**.
   - In **Connection settings**, seleziona **HTTP endpoint URL**.
   - In **Triggers**, seleziona **Use a common HTTP endpoint URL for all triggers** e impostalo sull'URL pubblico del tuo gateway seguito da `/googlechat`.
     - _Suggerimento: esegui `openclaw status` per trovare l'URL pubblico del tuo gateway._
   - In **Visibility**, seleziona **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;**.
   - Inserisci il tuo indirizzo email (ad esempio `user@example.com`) nella casella di testo.
   - Fai clic su **Save** in basso.
6. **Abilita lo stato dell'app**:
   - Dopo aver salvato, **aggiorna la pagina**.
   - Cerca la sezione **App status** (di solito vicino alla parte superiore o inferiore dopo il salvataggio).
   - Cambia lo stato in **Live - available to users**.
   - Fai nuovamente clic su **Save**.
7. Configura OpenClaw con il percorso dell'account di servizio + audience del webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Oppure config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Imposta il tipo + valore dell'audience del webhook (deve corrispondere alla configurazione della tua app Chat).
9. Avvia il gateway. Google Chat invierà richieste POST al percorso del tuo webhook.

## Aggiungere a Google Chat

Una volta che il gateway è in esecuzione e il tuo indirizzo email è stato aggiunto all'elenco di visibilità:

1. Vai su [Google Chat](https://chat.google.com/).
2. Fai clic sull'icona **+** (più) accanto a **Direct Messages**.
3. Nella barra di ricerca (dove normalmente aggiungi persone), digita il nome dell'**App name** che hai configurato in Google Cloud Console.
   - **Nota**: il bot _non_ comparirà nell'elenco di navigazione "Marketplace" perché è un'app privata. Devi cercarlo per nome.
4. Seleziona il tuo bot dai risultati.
5. Fai clic su **Add** o **Chat** per avviare una conversazione 1:1.
6. Invia "Hello" per attivare l'assistente!

## URL pubblico (solo webhook)

I webhook di Google Chat richiedono un endpoint HTTPS pubblico. Per sicurezza, **esponi a internet solo il percorso `/googlechat`**. Mantieni la dashboard OpenClaw e gli altri endpoint sensibili sulla tua rete privata.

### Opzione A: Tailscale Funnel (consigliato)

Usa Tailscale Serve per la dashboard privata e Funnel per il percorso del webhook pubblico. In questo modo `/` resta privato mentre viene esposto solo `/googlechat`.

1. **Controlla a quale indirizzo è associato il tuo gateway:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Annota l'indirizzo IP (ad esempio `127.0.0.1`, `0.0.0.0` oppure il tuo IP Tailscale come `100.x.x.x`).

2. **Esponi la dashboard solo alla tailnet (porta 8443):**

   ```bash
   # Se è associato a localhost (127.0.0.1 o 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Se è associato solo all'IP Tailscale (ad esempio 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Esponi pubblicamente solo il percorso del webhook:**

   ```bash
   # Se è associato a localhost (127.0.0.1 o 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Se è associato solo all'IP Tailscale (ad esempio 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorizza il nodo per l'accesso Funnel:**
   Se richiesto, visita l'URL di autorizzazione mostrato nell'output per abilitare Funnel per questo nodo nella policy della tua tailnet.

5. **Verifica la configurazione:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Il tuo URL pubblico del webhook sarà:
`https://<node-name>.<tailnet>.ts.net/googlechat`

La tua dashboard privata resterà disponibile solo nella tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Usa l'URL pubblico (senza `:8443`) nella configurazione dell'app Google Chat.

> Nota: questa configurazione persiste anche dopo i riavvii. Per rimuoverla in seguito, esegui `tailscale funnel reset` e `tailscale serve reset`.

### Opzione B: proxy inverso (Caddy)

Se usi un proxy inverso come Caddy, instrada solo il percorso specifico:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Con questa configurazione, qualsiasi richiesta a `your-domain.com/` verrà ignorata o riceverà una risposta 404, mentre `your-domain.com/googlechat` verrà instradata in modo sicuro a OpenClaw.

### Opzione C: Cloudflare Tunnel

Configura le regole di ingresso del tuo tunnel in modo da instradare solo il percorso del webhook:

- **Percorso**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Regola predefinita**: HTTP 404 (Not Found)

## Come funziona

1. Google Chat invia richieste POST del webhook al gateway. Ogni richiesta include un'intestazione `Authorization: Bearer <token>`.
   - OpenClaw verifica l'autenticazione bearer prima di leggere/analizzare i corpi completi del webhook quando l'intestazione è presente.
   - Le richieste di Google Workspace Add-on che includono `authorizationEventObject.systemIdToken` nel body sono supportate tramite un budget del body di pre-autenticazione più restrittivo.
2. OpenClaw verifica il token rispetto a `audienceType` + `audience` configurati:
   - `audienceType: "app-url"` → l'audience è il tuo URL HTTPS del webhook.
   - `audienceType: "project-number"` → l'audience è il numero del progetto Cloud.
3. I messaggi vengono instradati in base allo spazio:
   - I messaggi diretti usano la chiave di sessione `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Gli spazi usano la chiave di sessione `agent:<agentId>:googlechat:group:<spaceId>`.
4. L'accesso ai messaggi diretti usa il pairing per impostazione predefinita. I mittenti sconosciuti ricevono un codice di pairing; approvalo con:
   - `openclaw pairing approve googlechat <code>`
5. Per impostazione predefinita, gli spazi di gruppo richiedono una @-mention. Usa `botUser` se il rilevamento della mention richiede il nome utente dell'app.

## Destinazioni

Usa questi identificatori per la consegna e le allowlist:

- Messaggi diretti: `users/<userId>` (consigliato).
- L'email non elaborata `name@example.com` è modificabile e viene usata solo per la corrispondenza diretta nelle allowlist quando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Deprecato: `users/<email>` viene trattato come un ID utente, non come una allowlist email.
- Spazi: `spaces/<spaceId>`.

## Punti salienti della configurazione

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Note:

- Le credenziali dell'account di servizio possono anche essere passate inline con `serviceAccount` (stringa JSON).
- Anche `serviceAccountRef` è supportato (env/file SecretRef), inclusi i ref per account sotto `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Il percorso predefinito del webhook è `/googlechat` se `webhookPath` non è impostato.
- `dangerouslyAllowNameMatching` riabilita la corrispondenza con principal email modificabili per le allowlist (modalità compatibilità break-glass).
- Le reazioni sono disponibili tramite lo strumento `reactions` e `channels action` quando `actions.reactions` è abilitato.
- Le azioni dei messaggi espongono `send` per il testo e `upload-file` per gli invii espliciti di allegati. `upload-file` accetta `media` / `filePath` / `path` più `message`, `filename` e targeting del thread facoltativi.
- `typingIndicator` supporta `none`, `message` (predefinito) e `reaction` (le reaction richiedono OAuth utente).
- Gli allegati vengono scaricati tramite la Chat API e memorizzati nella pipeline dei media (dimensione limitata da `mediaMaxMb`).

Dettagli di riferimento dei segreti: [Gestione dei segreti](/gateway/secrets).

## Risoluzione dei problemi

### 405 Method Not Allowed

Se Google Cloud Logs Explorer mostra errori come:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Significa che l'handler del webhook non è registrato. Cause comuni:

1. **Canale non configurato**: la sezione `channels.googlechat` manca dalla tua configurazione. Verifica con:

   ```bash
   openclaw config get channels.googlechat
   ```

   Se restituisce "Config path not found", aggiungi la configurazione (vedi [Punti salienti della configurazione](#config-highlights)).

2. **Plugin non abilitato**: controlla lo stato del plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Se mostra "disabled", aggiungi `plugins.entries.googlechat.enabled: true` alla tua configurazione.

3. **Gateway non riavviato**: dopo aver aggiunto la configurazione, riavvia il gateway:

   ```bash
   openclaw gateway restart
   ```

Verifica che il canale sia in esecuzione:

```bash
openclaw channels status
# Dovrebbe mostrare: Google Chat default: enabled, configured, ...
```

### Altri problemi

- Controlla `openclaw channels status --probe` per errori di autenticazione o configurazione dell'audience mancante.
- Se non arrivano messaggi, conferma l'URL del webhook dell'app Chat + le sottoscrizioni agli eventi.
- Se il controllo delle mention blocca le risposte, imposta `botUser` sul nome della risorsa utente dell'app e verifica `requireMention`.
- Usa `openclaw logs --follow` mentre invii un messaggio di test per vedere se le richieste raggiungono il gateway.

Documentazione correlata:

- [Configurazione del gateway](/gateway/configuration)
- [Sicurezza](/gateway/security)
- [Reazioni](/tools/reactions)

## Correlati

- [Panoramica dei canali](/channels) — tutti i canali supportati
- [Pairing](/channels/pairing) — autenticazione dei DM e flusso di pairing
- [Gruppi](/channels/groups) — comportamento delle chat di gruppo e controllo delle mention
- [Instradamento del canale](/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/gateway/security) — modello di accesso e hardening
