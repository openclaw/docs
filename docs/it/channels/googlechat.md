---
read_when:
    - Lavoro sulle funzionalità del canale Google Chat
summary: Stato del supporto, funzionalità e configurazione dell'app Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-05-02T08:15:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdb8dcf651602e92801d7107646d853871ea6cef188a8733a831695a1243740e
    source_path: channels/googlechat.md
    workflow: 16
---

Status: Plugin scaricabile per DM e spazi tramite webhook Google Chat API (solo HTTP).

## Installazione

Installa Google Chat prima di configurare il canale:

```bash
openclaw plugins install @openclaw/googlechat
```

Checkout locale (quando eseguito da un repository git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Configurazione rapida (principianti)

1. Crea un progetto Google Cloud e abilita la **Google Chat API**.
   - Vai a: [Credenziali Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Abilita l'API se non è già abilitata.
2. Crea un **Service Account**:
   - Premi **Create Credentials** > **Service Account**.
   - Assegnagli il nome che preferisci (ad es. `openclaw-chat`).
   - Lascia vuote le autorizzazioni (premi **Continue**).
   - Lascia vuoti i principal con accesso (premi **Done**).
3. Crea e scarica la **JSON Key**:
   - Nell'elenco dei service account, fai clic su quello che hai appena creato.
   - Vai alla scheda **Keys**.
   - Fai clic su **Add Key** > **Create new key**.
   - Seleziona **JSON** e premi **Create**.
4. Salva il file JSON scaricato sull'host del Gateway (ad es. `~/.openclaw/googlechat-service-account.json`).
5. Crea un'app Google Chat nella [Configurazione Chat di Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Compila le **Application info**:
     - **App name**: (ad es. `OpenClaw`)
     - **Avatar URL**: (ad es. `https://openclaw.ai/logo.png`)
     - **Description**: (ad es. `Personal AI Assistant`)
   - Abilita **Interactive features**.
   - In **Functionality**, seleziona **Join spaces and group conversations**.
   - In **Connection settings**, seleziona **HTTP endpoint URL**.
   - In **Triggers**, seleziona **Use a common HTTP endpoint URL for all triggers** e impostalo sull'URL pubblico del tuo Gateway seguito da `/googlechat`.
     - _Suggerimento: esegui `openclaw status` per trovare l'URL pubblico del tuo Gateway._
   - In **Visibility**, seleziona **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Inserisci il tuo indirizzo email (ad es. `user@example.com`) nella casella di testo.
   - Fai clic su **Save** in basso.
6. **Abilita lo stato dell'app**:
   - Dopo il salvataggio, **aggiorna la pagina**.
   - Cerca la sezione **App status** (di solito vicino alla parte superiore o inferiore dopo il salvataggio).
   - Cambia lo stato in **Live - available to users**.
   - Fai di nuovo clic su **Save**.
7. Configura OpenClaw con il percorso del service account + il pubblico del webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Oppure config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Imposta il tipo e il valore del pubblico del webhook (corrispondenti alla configurazione della tua app Chat).
9. Avvia il Gateway. Google Chat invierà richieste POST al percorso del tuo webhook.

## Aggiungi a Google Chat

Quando il Gateway è in esecuzione e la tua email è stata aggiunta all'elenco di visibilità:

1. Vai a [Google Chat](https://chat.google.com/).
2. Fai clic sull'icona **+** (più) accanto a **Direct Messages**.
3. Nella barra di ricerca (dove di solito aggiungi persone), digita l'**App name** che hai configurato in Google Cloud Console.
   - **Nota**: il bot _non_ comparirà nell'elenco di navigazione del "Marketplace" perché è un'app privata. Devi cercarlo per nome.
4. Seleziona il tuo bot dai risultati.
5. Fai clic su **Add** o **Chat** per avviare una conversazione 1:1.
6. Invia "Hello" per attivare l'assistente!

## URL pubblico (solo webhook)

I webhook Google Chat richiedono un endpoint HTTPS pubblico. Per sicurezza, **esponi a Internet solo il percorso `/googlechat`**. Mantieni la dashboard OpenClaw e gli altri endpoint sensibili sulla tua rete privata.

### Opzione A: Tailscale Funnel (consigliata)

Usa Tailscale Serve per la dashboard privata e Funnel per il percorso pubblico del webhook. Questo mantiene `/` privato esponendo solo `/googlechat`.

1. **Controlla a quale indirizzo è associato il tuo Gateway:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Annota l'indirizzo IP (ad es. `127.0.0.1`, `0.0.0.0` o il tuo IP Tailscale come `100.x.x.x`).

2. **Esponi la dashboard solo alla tailnet (porta 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Esponi pubblicamente solo il percorso del webhook:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorizza il nodo per l'accesso Funnel:**
   Se richiesto, visita l'URL di autorizzazione mostrato nell'output per abilitare Funnel per questo nodo nella policy della tua tailnet.

5. **Verifica la configurazione:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

L'URL pubblico del tuo webhook sarà:
`https://<node-name>.<tailnet>.ts.net/googlechat`

La tua dashboard privata resta accessibile solo dalla tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Usa l'URL pubblico (senza `:8443`) nella configurazione dell'app Google Chat.

> Nota: questa configurazione persiste tra i riavvii. Per rimuoverla in seguito, esegui `tailscale funnel reset` e `tailscale serve reset`.

### Opzione B: Reverse proxy (Caddy)

Se usi un reverse proxy come Caddy, instrada tramite proxy solo il percorso specifico:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Con questa configurazione, qualsiasi richiesta a `your-domain.com/` verrà ignorata o restituita come 404, mentre `your-domain.com/googlechat` viene instradato in modo sicuro a OpenClaw.

### Opzione C: Cloudflare Tunnel

Configura le regole di ingresso del tuo tunnel per instradare solo il percorso del webhook:

- **Percorso**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Regola predefinita**: HTTP 404 (Not Found)

## Come funziona

1. Google Chat invia POST webhook al Gateway. Ogni richiesta include un'intestazione `Authorization: Bearer <token>`.
   - OpenClaw verifica l'autenticazione bearer prima di leggere/analizzare i corpi completi dei webhook quando l'intestazione è presente.
   - Le richieste Google Workspace Add-on che contengono `authorizationEventObject.systemIdToken` nel corpo sono supportate tramite un budget del corpo pre-autenticazione più rigoroso.
2. OpenClaw verifica il token rispetto a `audienceType` + `audience` configurati:
   - `audienceType: "app-url"` → il pubblico è l'URL HTTPS del tuo webhook.
   - `audienceType: "project-number"` → il pubblico è il numero del progetto Cloud.
3. I messaggi vengono instradati per spazio:
   - I DM usano la chiave di sessione `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Gli spazi usano la chiave di sessione `agent:<agentId>:googlechat:group:<spaceId>`.
4. L'accesso ai DM usa il pairing per impostazione predefinita. I mittenti sconosciuti ricevono un codice di pairing; approva con:
   - `openclaw pairing approve googlechat <code>`
5. Gli spazi di gruppo richiedono per impostazione predefinita una @-menzione. Usa `botUser` se il rilevamento delle menzioni richiede il nome utente dell'app.

## Destinazioni

Usa questi identificatori per recapito e allowlist:

- Messaggi diretti: `users/<userId>` (consigliato).
- L'email grezza `name@example.com` è modificabile e viene usata solo per la corrispondenza delle allowlist dirette quando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Deprecato: `users/<email>` viene trattato come un ID utente, non come un'allowlist email.
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

- Le credenziali del service account possono anche essere passate inline con `serviceAccount` (stringa JSON).
- È supportato anche `serviceAccountRef` (env/file SecretRef), inclusi i riferimenti per account in `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Il percorso webhook predefinito è `/googlechat` se `webhookPath` non è impostato.
- `dangerouslyAllowNameMatching` riabilita la corrispondenza dei principal email modificabili per le allowlist (modalità di compatibilità break-glass).
- Le reazioni sono disponibili tramite lo strumento `reactions` e `channels action` quando `actions.reactions` è abilitato.
- Le azioni dei messaggi espongono `send` per il testo e `upload-file` per invii espliciti di allegati. `upload-file` accetta `media` / `filePath` / `path` più `message`, `filename` e destinazione thread opzionali.
- `typingIndicator` supporta `none`, `message` (predefinito) e `reaction` (`reaction` richiede OAuth utente).
- Gli allegati vengono scaricati tramite la Chat API e archiviati nella pipeline multimediale (dimensione limitata da `mediaMaxMb`).

Dettagli sui riferimenti ai segreti: [Gestione dei segreti](/it/gateway/secrets).

## Risoluzione dei problemi

### 405 Method Not Allowed

Se Google Cloud Logs Explorer mostra errori come:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Questo significa che il gestore del webhook non è registrato. Cause comuni:

1. **Canale non configurato**: la sezione `channels.googlechat` manca dalla tua configurazione. Verifica con:

   ```bash
   openclaw config get channels.googlechat
   ```

   Se restituisce "Config path not found", aggiungi la configurazione (vedi [Punti salienti della configurazione](#config-highlights)).

2. **Plugin non abilitato**: controlla lo stato del Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Se mostra "disabled", aggiungi `plugins.entries.googlechat.enabled: true` alla tua configurazione.

3. **Gateway non riavviato**: dopo aver aggiunto la configurazione, riavvia il Gateway:

   ```bash
   openclaw gateway restart
   ```

Verifica che il canale sia in esecuzione:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Altri problemi

- Controlla `openclaw channels status --probe` per errori di autenticazione o configurazione mancante del pubblico.
- Se non arriva alcun messaggio, conferma l'URL webhook + le sottoscrizioni agli eventi dell'app Chat.
- Se il gating delle menzioni blocca le risposte, imposta `botUser` sul nome risorsa utente dell'app e verifica `requireMention`.
- Usa `openclaw logs --follow` mentre invii un messaggio di prova per vedere se le richieste raggiungono il Gateway.

Documenti correlati:

- [Configurazione del Gateway](/it/gateway/configuration)
- [Sicurezza](/it/gateway/security)
- [Reazioni](/it/tools/reactions)

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
