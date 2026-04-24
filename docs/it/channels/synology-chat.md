---
read_when:
    - Configurare Synology Chat con OpenClaw
    - Eseguire il debug dell’instradamento del Webhook di Synology Chat
summary: Configurazione del Webhook di Synology Chat e di OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-24T08:31:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5135e9aa1fd86437a635378dfbbde321bbd2e5f6fef7a3cc740ea54ebf4b76d5
    source_path: channels/synology-chat.md
    workflow: 15
---

Stato: Plugin incluso per canali a messaggio diretto che usa Webhook di Synology Chat.
Il Plugin accetta messaggi in ingresso dai Webhook in uscita di Synology Chat e invia le risposte
tramite un Webhook in ingresso di Synology Chat.

## Plugin incluso

Synology Chat viene distribuito come Plugin incluso nelle versioni attuali di OpenClaw, quindi le normali build pacchettizzate non richiedono un’installazione separata.

Se usi una build più vecchia o un’installazione personalizzata che esclude Synology Chat,
installalo manualmente:

Installa da un checkout locale:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Dettagli: [Plugins](/it/tools/plugin)

## Configurazione rapida

1. Assicurati che il Plugin Synology Chat sia disponibile.
   - Le attuali versioni pacchettizzate di OpenClaw lo includono già.
   - Le installazioni più vecchie o personalizzate possono aggiungerlo manualmente da un checkout del codice sorgente con il comando sopra.
   - `openclaw onboard` ora mostra Synology Chat nello stesso elenco di configurazione canali di `openclaw channels add`.
   - Configurazione non interattiva: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Nelle integrazioni di Synology Chat:
   - Crea un Webhook in ingresso e copiane l’URL.
   - Crea un Webhook in uscita con il tuo token segreto.
3. Punta l’URL del Webhook in uscita al tuo gateway OpenClaw:
   - `https://gateway-host/webhook/synology` per impostazione predefinita.
   - Oppure il tuo `channels.synology-chat.webhookPath` personalizzato.
4. Completa la configurazione in OpenClaw.
   - Guidata: `openclaw onboard`
   - Diretta: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Riavvia il gateway e invia un DM al bot di Synology Chat.

Dettagli sull’autenticazione del Webhook:

- OpenClaw accetta il token del Webhook in uscita da `body.token`, poi
  `?token=...`, poi dalle intestazioni.
- Formati di intestazione accettati:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- I token vuoti o mancanti vengono rifiutati in modalità fail-closed.

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

## Variabili d’ambiente

Per l’account predefinito, puoi usare variabili d’ambiente:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (separati da virgole)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

I valori di configurazione hanno la precedenza sulle variabili d’ambiente.

`SYNOLOGY_CHAT_INCOMING_URL` non può essere impostato da un `.env` del workspace; vedi [File `.env` del workspace](/it/gateway/security).

## Policy DM e controllo degli accessi

- `dmPolicy: "allowlist"` è il valore predefinito consigliato.
- `allowedUserIds` accetta un elenco (o una stringa separata da virgole) di ID utente Synology.
- In modalità `allowlist`, un elenco `allowedUserIds` vuoto viene trattato come configurazione errata e la route Webhook non verrà avviata (usa `dmPolicy: "open"` per consentire tutti).
- `dmPolicy: "open"` consente qualsiasi mittente.
- `dmPolicy: "disabled"` blocca i DM.
- Il binding del destinatario della risposta rimane associato di default a `user_id` numerico stabile. `channels.synology-chat.dangerouslyAllowNameMatching: true` è una modalità di compatibilità di emergenza che riabilita la ricerca tramite username/nickname modificabile per la consegna delle risposte.
- Le approvazioni pairing funzionano con:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Consegna in uscita

Usa ID utente numerici di Synology Chat come destinazioni.

Esempi:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Gli invii di media sono supportati tramite consegna di file basata su URL.
Gli URL dei file in uscita devono usare `http` oppure `https`, e le destinazioni di rete private o altrimenti bloccate vengono rifiutate prima che OpenClaw inoltri l’URL al Webhook del NAS.

## Multi-account

Più account Synology Chat sono supportati sotto `channels.synology-chat.accounts`.
Ogni account può sostituire token, URL in ingresso, percorso Webhook, policy DM e limiti.
Le sessioni di messaggi diretti sono isolate per account e utente, quindi lo stesso `user_id` numerico
su due diversi account Synology non condivide lo stato della trascrizione.
Assegna a ogni account abilitato un `webhookPath` distinto. OpenClaw ora rifiuta i percorsi esatti duplicati
e si rifiuta di avviare account con nome che ereditano solo un percorso Webhook condiviso nelle configurazioni multi-account.
Se intenzionalmente ti serve l’ereditarietà legacy per un account con nome, imposta
`dangerouslyAllowInheritedWebhookPath: true` su quell’account o su `channels.synology-chat`,
ma i percorsi esatti duplicati vengono comunque rifiutati in modalità fail-closed. Preferisci percorsi espliciti per account.

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

## Note di sicurezza

- Mantieni segreto `token` e ruotalo se viene esposto.
- Mantieni `allowInsecureSsl: false` a meno che tu non ti fidi esplicitamente di un certificato NAS locale autofirmato.
- Le richieste Webhook in ingresso vengono verificate tramite token e limitate in frequenza per mittente.
- I controlli sui token non validi usano un confronto dei segreti a tempo costante e falliscono in modalità fail-closed.
- Per la produzione, preferisci `dmPolicy: "allowlist"`.
- Mantieni `dangerouslyAllowNameMatching` disattivato a meno che tu non abbia esplicitamente bisogno della consegna delle risposte legacy basata su username.
- Mantieni `dangerouslyAllowInheritedWebhookPath` disattivato a meno che tu non accetti esplicitamente il rischio di instradamento su percorso condiviso in una configurazione multi-account.

## Risoluzione dei problemi

- `Missing required fields (token, user_id, text)`:
  - nel payload del Webhook in uscita manca uno dei campi richiesti
  - se Synology invia il token nelle intestazioni, assicurati che il gateway/proxy conservi tali intestazioni
- `Invalid token`:
  - il segreto del Webhook in uscita non corrisponde a `channels.synology-chat.token`
  - la richiesta sta raggiungendo l’account o il percorso Webhook sbagliato
  - un proxy inverso ha rimosso l’intestazione del token prima che la richiesta raggiungesse OpenClaw
- `Rate limit exceeded`:
  - troppi tentativi con token non validi dalla stessa origine possono bloccare temporaneamente quella origine
  - i mittenti autenticati hanno anche un limite di frequenza separato per utente
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` è abilitato ma nessun utente è configurato
- `User not authorized`:
  - il `user_id` numerico del mittente non è in `allowedUserIds`

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Groups](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Channel Routing](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Security](/it/gateway/security) — modello di accesso e hardening
