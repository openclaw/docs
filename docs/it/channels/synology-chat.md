---
read_when:
    - Configurazione di Synology Chat con OpenClaw
    - Debug dell'instradamento del webhook Synology Chat
summary: Configurazione del webhook Synology Chat e configurazione di OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-05T13:44:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddb25fc6b53f896f15f43b4936d69ea071a29a91838a5b662819377271e89d81
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Stato: canale di messaggi diretti con plugin incluso che usa webhook Synology Chat.
Il plugin accetta messaggi in ingresso dai webhook in uscita di Synology Chat e invia le risposte
tramite un webhook in ingresso di Synology Chat.

## Plugin incluso

Synology Chat è fornito come plugin incluso nelle attuali release di OpenClaw, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

Se usi una build più vecchia o un'installazione personalizzata che esclude Synology Chat,
installalo manualmente:

Installa da un checkout locale:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Dettagli: [Plugins](/tools/plugin)

## Configurazione rapida

1. Assicurati che il plugin Synology Chat sia disponibile.
   - Le attuali release pacchettizzate di OpenClaw lo includono già.
   - Le installazioni vecchie/personalizzate possono aggiungerlo manualmente da un checkout del sorgente con il comando sopra.
   - `openclaw onboard` ora mostra Synology Chat nello stesso elenco di configurazione canali di `openclaw channels add`.
   - Configurazione non interattiva: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Nelle integrazioni Synology Chat:
   - Crea un webhook in ingresso e copia il suo URL.
   - Crea un webhook in uscita con il tuo token segreto.
3. Punta l'URL del webhook in uscita al tuo gateway OpenClaw:
   - `https://gateway-host/webhook/synology` per impostazione predefinita.
   - Oppure al tuo `channels.synology-chat.webhookPath` personalizzato.
4. Completa la configurazione in OpenClaw.
   - Guidata: `openclaw onboard`
   - Diretta: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Riavvia il gateway e invia un DM al bot Synology Chat.

Dettagli di autenticazione del webhook:

- OpenClaw accetta il token del webhook in uscita da `body.token`, poi
  `?token=...`, poi dagli header.
- Forme di header accettate:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- I token vuoti o mancanti falliscono in modalità fail-closed.

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

Per l'account predefinito, puoi usare variabili d'ambiente:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (separati da virgole)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

I valori di configurazione hanno la precedenza sulle variabili d'ambiente.

## Policy DM e controllo degli accessi

- `dmPolicy: "allowlist"` è il valore predefinito consigliato.
- `allowedUserIds` accetta un elenco (o una stringa separata da virgole) di ID utente Synology.
- In modalità `allowlist`, un elenco `allowedUserIds` vuoto viene trattato come configurazione errata e la route del webhook non verrà avviata (usa `dmPolicy: "open"` per consentire tutti).
- `dmPolicy: "open"` consente qualsiasi mittente.
- `dmPolicy: "disabled"` blocca i DM.
- Il binding del destinatario della risposta resta associato di default allo stabile `user_id` numerico. `channels.synology-chat.dangerouslyAllowNameMatching: true` è una modalità di compatibilità di emergenza che riabilita la ricerca di username/nickname modificabili per la consegna delle risposte.
- Le approvazioni di pairing funzionano con:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Consegna in uscita

Usa ID utente numerici di Synology Chat come destinazioni.

Esempi:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

L'invio di contenuti multimediali è supportato tramite consegna di file basata su URL.

## Account multipli

Sono supportati più account Synology Chat sotto `channels.synology-chat.accounts`.
Ogni account può sovrascrivere token, URL in ingresso, percorso del webhook, policy DM e limiti.
Le sessioni di messaggi diretti sono isolate per account e utente, quindi lo stesso `user_id` numerico
su due account Synology diversi non condivide lo stato della trascrizione.
Assegna a ogni account abilitato un `webhookPath` distinto. OpenClaw ora rifiuta percorsi esatti duplicati
e si rifiuta di avviare account nominati che ereditano soltanto un percorso webhook condiviso nelle configurazioni multi-account.
Se hai intenzionalmente bisogno dell'ereditarietà legacy per un account nominato, imposta
`dangerouslyAllowInheritedWebhookPath: true` su quell'account o su `channels.synology-chat`,
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
- Mantieni `allowInsecureSsl: false` a meno che tu non ti fidi esplicitamente di un certificato NAS locale self-signed.
- Le richieste webhook in ingresso vengono verificate tramite token e soggette a rate limit per mittente.
- I controlli su token non validi usano un confronto del segreto a tempo costante e falliscono in modalità fail-closed.
- Preferisci `dmPolicy: "allowlist"` per la produzione.
- Mantieni `dangerouslyAllowNameMatching` disattivato a meno che tu non abbia esplicitamente bisogno della consegna delle risposte legacy basata su username.
- Mantieni `dangerouslyAllowInheritedWebhookPath` disattivato a meno che tu non accetti esplicitamente il rischio di instradamento su percorso condiviso in una configurazione multi-account.

## Risoluzione dei problemi

- `Missing required fields (token, user_id, text)`:
  - nel payload del webhook in uscita manca uno dei campi richiesti
  - se Synology invia il token negli header, assicurati che il gateway/proxy preservi tali header
- `Invalid token`:
  - il segreto del webhook in uscita non corrisponde a `channels.synology-chat.token`
  - la richiesta sta colpendo l'account o il percorso webhook sbagliato
  - un reverse proxy ha rimosso l'header del token prima che la richiesta raggiungesse OpenClaw
- `Rate limit exceeded`:
  - troppi tentativi con token non validi dalla stessa origine possono bloccare temporaneamente quell'origine
  - i mittenti autenticati hanno anche un rate limit separato per utente
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` è abilitato ma non sono configurati utenti
- `User not authorized`:
  - il `user_id` numerico del mittente non è in `allowedUserIds`

## Correlati

- [Panoramica dei canali](/channels) — tutti i canali supportati
- [Pairing](/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento dei canali](/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/gateway/security) — modello di accesso e hardening
