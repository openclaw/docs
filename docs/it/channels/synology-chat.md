---
read_when:
    - Configurazione di Synology Chat con OpenClaw
    - Debug del routing del Webhook di Synology Chat
summary: Configurazione del Webhook di Synology Chat e configurazione di OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-21T19:20:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7288e2aa873ee1a1f57861d839cfb44ff324e3d40a7f36da07c6ba43cbe1e6e6
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Stato: plugin incluso per canale di messaggi diretti che usa i Webhook di Synology Chat.
Il plugin accetta i messaggi in ingresso dai Webhook in uscita di Synology Chat e invia le risposte
tramite un Webhook in ingresso di Synology Chat.

## Plugin incluso

Synology Chat è distribuito come plugin incluso nelle attuali release di OpenClaw, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

Se utilizzi una build meno recente o un'installazione personalizzata che esclude Synology Chat,
installalo manualmente:

Installa da un checkout locale:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Dettagli: [Plugins](/it/tools/plugin)

## Configurazione rapida

1. Assicurati che il plugin Synology Chat sia disponibile.
   - Le attuali release pacchettizzate di OpenClaw lo includono già.
   - Le installazioni meno recenti/personalizzate possono aggiungerlo manualmente da un checkout del sorgente con il comando sopra.
   - `openclaw onboard` ora mostra Synology Chat nello stesso elenco di configurazione dei canali di `openclaw channels add`.
   - Configurazione non interattiva: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Nelle integrazioni di Synology Chat:
   - Crea un Webhook in ingresso e copiane l'URL.
   - Crea un Webhook in uscita con il tuo token segreto.
3. Punta l'URL del Webhook in uscita al tuo Gateway OpenClaw:
   - `https://gateway-host/webhook/synology` per impostazione predefinita.
   - Oppure il tuo `channels.synology-chat.webhookPath` personalizzato.
4. Completa la configurazione in OpenClaw.
   - Guidata: `openclaw onboard`
   - Diretta: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Riavvia il Gateway e invia un DM al bot di Synology Chat.

Dettagli di autenticazione del Webhook:

- OpenClaw accetta il token del Webhook in uscita da `body.token`, poi
  `?token=...`, poi dalle intestazioni.
- Formati di intestazione accettati:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- I token vuoti o mancanti falliscono in modalità chiusa.

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

## Criteri DM e controllo degli accessi

- `dmPolicy: "allowlist"` è l'impostazione predefinita consigliata.
- `allowedUserIds` accetta un elenco (o una stringa separata da virgole) di ID utente Synology.
- In modalità `allowlist`, un elenco `allowedUserIds` vuoto viene trattato come configurazione errata e la route del Webhook non verrà avviata (usa `dmPolicy: "open"` per consentire tutti).
- `dmPolicy: "open"` consente qualsiasi mittente.
- `dmPolicy: "disabled"` blocca i DM.
- L'associazione del destinatario delle risposte rimane basata per impostazione predefinita su `user_id` numerico stabile. `channels.synology-chat.dangerouslyAllowNameMatching: true` è una modalità di compatibilità di emergenza che riabilita la ricerca tramite username/nickname modificabili per la consegna delle risposte.
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
Gli URL dei file in uscita devono usare `http` o `https`, e le destinazioni di rete private o altrimenti bloccate vengono rifiutate prima che OpenClaw inoltri l'URL al Webhook del NAS.

## Multi-account

Sono supportati più account Synology Chat in `channels.synology-chat.accounts`.
Ogni account può sovrascrivere token, URL in ingresso, percorso del Webhook, criteri DM e limiti.
Le sessioni di messaggi diretti sono isolate per account e utente, quindi lo stesso `user_id` numerico
su due diversi account Synology non condivide lo stato della trascrizione.
Assegna a ogni account abilitato un `webhookPath` distinto. OpenClaw ora rifiuta i percorsi esatti duplicati
e si rifiuta di avviare account con nome che ereditano solo un percorso Webhook condiviso nelle configurazioni multi-account.
Se intenzionalmente hai bisogno dell'ereditarietà legacy per un account con nome, imposta
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

## Note sulla sicurezza

- Mantieni segreto `token` e ruotalo se viene esposto.
- Mantieni `allowInsecureSsl: false` a meno che tu non ti fidi esplicitamente di un certificato NAS locale autofirmato.
- Le richieste del Webhook in ingresso sono verificate tramite token e soggette a limitazione di frequenza per mittente.
- I controlli dei token non validi usano un confronto del segreto a tempo costante e falliscono in modalità chiusa.
- Per la produzione, preferisci `dmPolicy: "allowlist"`.
- Mantieni `dangerouslyAllowNameMatching` disattivato a meno che tu non abbia esplicitamente bisogno della consegna delle risposte legacy basata su username.
- Mantieni `dangerouslyAllowInheritedWebhookPath` disattivato a meno che tu non accetti esplicitamente il rischio di instradamento su percorso condiviso in una configurazione multi-account.

## Risoluzione dei problemi

- `Missing required fields (token, user_id, text)`:
  - nel payload del Webhook in uscita manca uno dei campi obbligatori
  - se Synology invia il token nelle intestazioni, assicurati che il Gateway/proxy preservi tali intestazioni
- `Invalid token`:
  - il segreto del Webhook in uscita non corrisponde a `channels.synology-chat.token`
  - la richiesta sta raggiungendo l'account o il percorso Webhook sbagliato
  - un reverse proxy ha rimosso l'intestazione del token prima che la richiesta raggiungesse OpenClaw
- `Rate limit exceeded`:
  - troppi tentativi con token non validi dalla stessa origine possono bloccare temporaneamente tale origine
  - i mittenti autenticati hanno anche un limite di frequenza separato per i messaggi per utente
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` è abilitato ma non è configurato alcun utente
- `User not authorized`:
  - `user_id` numerico del mittente non è in `allowedUserIds`

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento della chat di gruppo e controllo delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
