---
read_when:
    - Configurazione di Synology Chat con OpenClaw
    - Debug del routing del Webhook di Synology Chat
summary: Configurazione del Webhook di Synology Chat e di OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-07-12T06:49:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat si connette a OpenClaw tramite una coppia di Webhook: un Webhook in uscita di Synology Chat invia i messaggi diretti in entrata al Gateway, mentre le risposte tornano tramite un Webhook in entrata di Synology Chat.

Stato: Plugin ufficiale, installato separatamente. Solo messaggi diretti; sono supportati l'invio di testo e di file basato su URL.

## Installazione

```bash
openclaw plugins install @openclaw/synology-chat
```

Checkout locale (durante l'esecuzione da un repository git):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida

1. Installa il Plugin (vedi sopra).
2. Nelle integrazioni di Synology Chat:
   - Crea un Webhook in entrata e copiane l'URL.
   - Crea un Webhook in uscita con il tuo token segreto.
3. Imposta come URL del Webhook in uscita quello del tuo Gateway OpenClaw:
   - `https://gateway-host/webhook/synology` per impostazione predefinita.
   - Oppure il percorso personalizzato `channels.synology-chat.webhookPath`.
4. Completa la configurazione in OpenClaw. Synology Chat appare nello stesso elenco di configurazione dei canali in entrambi i flussi:
   - Guidato: `openclaw onboard` o `openclaw channels add`
   - Diretto: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Riavvia il Gateway e invia un messaggio diretto al bot di Synology Chat.

Dettagli sull'autenticazione del Webhook:

- OpenClaw accetta il token del Webhook in uscita prima da `body.token`, poi da
  `?token=...`, infine dalle intestazioni.
- Forme di intestazione accettate:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- I token vuoti o mancanti causano un rifiuto sicuro.
- I payload possono essere `application/x-www-form-urlencoded` o `application/json`; `token`, `user_id` e `text` sono obbligatori.

Configurazione minima:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Variabili d'ambiente

Per l'account predefinito puoi utilizzare le variabili d'ambiente:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (separati da virgole)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

I valori della configurazione hanno la precedenza sulle variabili d'ambiente.

`SYNOLOGY_CHAT_INCOMING_URL` e `SYNOLOGY_NAS_HOST` non possono essere impostate da un file `.env` dell'area di lavoro; consulta [File `.env` dell'area di lavoro](/it/gateway/security#workspace-env-files).

## Criteri per i messaggi diretti e controllo degli accessi

- Valori `dmPolicy` supportati: `allowlist` (predefinito), `open` e `disabled`. Synology Chat non dispone di un flusso di associazione; autorizza i mittenti aggiungendo i loro ID utente numerici di Synology a `allowedUserIds`.
- `allowedUserIds` accetta un elenco (o una stringa separata da virgole) di ID utente di Synology.
- In modalità `allowlist`, un elenco `allowedUserIds` vuoto viene considerato una configurazione errata e la rotta del Webhook non viene avviata.
- `dmPolicy: "open"` consente messaggi diretti pubblici solo quando `allowedUserIds` include `"*"`; con voci restrittive, possono conversare solo gli utenti corrispondenti. Anche `open` con un elenco `allowedUserIds` vuoto impedisce l'avvio della rotta.
- `dmPolicy: "disabled"` blocca i messaggi diretti.
- Per impostazione predefinita, l'associazione del destinatario delle risposte rimane basata sul valore numerico stabile `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` è una modalità di compatibilità di emergenza che riattiva la ricerca tramite nome utente o soprannome modificabile per la consegna delle risposte.

## Consegna in uscita

Utilizza gli ID utente numerici di Synology Chat come destinatari. Sono accettati i prefissi `synology-chat:`, `synology_chat:` e `synology:`.

Esempi:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

Il testo in uscita viene suddiviso in blocchi di 2000 caratteri. L'invio di contenuti multimediali è supportato tramite la consegna di file basata su URL: il NAS scarica e allega il file (massimo 32 MB). Gli URL dei file in uscita devono utilizzare `http` o `https`; le destinazioni di rete private o altrimenti bloccate vengono rifiutate prima che OpenClaw inoltri l'URL al Webhook del NAS.

## Account multipli

Sono supportati più account Synology Chat in `channels.synology-chat.accounts`.
Ogni account può sovrascrivere token, URL in entrata, percorso del Webhook, criteri per i messaggi diretti e limiti.
Le sessioni dei messaggi diretti sono isolate per account e utente, pertanto lo stesso valore numerico `user_id`
su due account Synology diversi non condivide lo stato della trascrizione.
Assegna a ogni account abilitato un `webhookPath` distinto. OpenClaw rifiuta i percorsi esattamente duplicati
e, nelle configurazioni con più account, non avvia gli account denominati che si limitano a ereditare un percorso Webhook condiviso.
Se hai intenzionalmente bisogno dell'ereditarietà preesistente per un account denominato, imposta
`dangerouslyAllowInheritedWebhookPath: true` su tale account o in `channels.synology-chat`,
ma i percorsi esattamente duplicati vengono comunque rifiutati in modo sicuro. Preferisci percorsi espliciti per ciascun account.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Note sulla sicurezza

- Mantieni segreto `token` e sostituiscilo se viene divulgato.
- Mantieni `allowInsecureSsl: false`, a meno che tu non consideri esplicitamente attendibile un certificato locale autofirmato del NAS.
- Le richieste Webhook in entrata vengono verificate tramite token e sottoposte a un limite di frequenza per mittente (`rateLimitPerMinute`, valore predefinito 30).
- I controlli sui token non validi utilizzano un confronto dei segreti a tempo costante e causano un rifiuto sicuro; tentativi ripetuti con token non validi bloccano temporaneamente l'indirizzo IP di origine.
- Il testo dei messaggi in entrata viene ripulito dai modelli noti di prompt injection e troncato a 4000 caratteri.
- Per la produzione, preferisci `dmPolicy: "allowlist"`.
- Mantieni disattivato `dangerouslyAllowNameMatching`, a meno che tu non abbia esplicitamente bisogno della consegna preesistente delle risposte basata sul nome utente.
- Mantieni disattivato `dangerouslyAllowInheritedWebhookPath`, a meno che tu non accetti esplicitamente il rischio dell'instradamento tramite percorso condiviso in una configurazione con più account.

## Risoluzione dei problemi

- `Missing required fields (token, user_id, text)`:
  - nel payload del Webhook in uscita manca uno dei campi obbligatori
  - se Synology invia il token nelle intestazioni, assicurati che il Gateway o il proxy conservi tali intestazioni
- `Invalid token`:
  - il segreto del Webhook in uscita non corrisponde a `channels.synology-chat.token`
  - la richiesta raggiunge l'account o il percorso Webhook errato
  - un proxy inverso ha rimosso l'intestazione del token prima che la richiesta raggiungesse OpenClaw
- `Rate limit exceeded`:
  - troppi tentativi con token non validi dalla stessa origine possono bloccare temporaneamente tale origine
  - anche i mittenti autenticati hanno un limite separato alla frequenza dei messaggi per utente
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` è abilitato, ma non è configurato alcun utente
- `User not authorized`:
  - il valore numerico `user_id` del mittente non è presente in `allowedUserIds`

## Contenuti correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento della sicurezza
