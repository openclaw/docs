---
read_when:
    - Configurare Synology Chat con OpenClaw
    - Debug dell'instradamento del Webhook di Synology Chat
summary: Configurazione del Webhook di Synology Chat e configurazione di OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-30T08:39:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

Stato: canale di messaggi diretti del Plugin incluso che usa Webhook di Synology Chat.
Il Plugin accetta messaggi in ingresso dai Webhook in uscita di Synology Chat e invia risposte
tramite un Webhook in ingresso di Synology Chat.

## Plugin incluso

Synology Chat viene distribuito come Plugin incluso nelle versioni attuali di OpenClaw, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

Se usi una build precedente o un'installazione personalizzata che esclude Synology Chat,
installalo manualmente:

Installa da un checkout locale:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida

1. Assicurati che il Plugin Synology Chat sia disponibile.
   - Le versioni pacchettizzate attuali di OpenClaw lo includono già.
   - Le installazioni precedenti/personalizzate possono aggiungerlo manualmente da un checkout dei sorgenti con il comando sopra.
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
5. Riavvia il Gateway e invia un DM al bot Synology Chat.

Dettagli sull'autenticazione del Webhook:

- OpenClaw accetta il token del Webhook in uscita da `body.token`, poi
  `?token=...`, poi dagli header.
- Forme di header accettate:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- I token vuoti o mancanti vengono rifiutati in modo chiuso.

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

Per l'account predefinito, puoi usare le variabili d'ambiente:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (separati da virgole)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

I valori di configurazione sovrascrivono le variabili d'ambiente.

`SYNOLOGY_CHAT_INCOMING_URL` non può essere impostato da un `.env` del workspace; consulta [File `.env` del workspace](/it/gateway/security).

## Criterio DM e controllo degli accessi

- `dmPolicy: "allowlist"` è il valore predefinito consigliato.
- `allowedUserIds` accetta un elenco (o una stringa separata da virgole) di ID utente Synology.
- In modalità `allowlist`, un elenco `allowedUserIds` vuoto viene trattato come configurazione errata e la route del Webhook non verrà avviata (usa `dmPolicy: "open"` con `allowedUserIds: ["*"]` per consentire tutti).
- `dmPolicy: "open"` consente DM pubblici solo quando `allowedUserIds` include `"*"`; con voci restrittive, solo gli utenti corrispondenti possono chattare.
- `dmPolicy: "disabled"` blocca i DM.
- Il binding del destinatario della risposta resta per impostazione predefinita sul valore numerico stabile `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` è una modalità di compatibilità di emergenza che riabilita la ricerca tramite username/nickname modificabili per la consegna delle risposte.
- Le approvazioni di associazione funzionano con:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Consegna in uscita

Usa gli ID utente numerici di Synology Chat come destinatari.

Esempi:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Gli invii di contenuti multimediali sono supportati tramite consegna di file basata su URL.
Gli URL dei file in uscita devono usare `http` o `https` e i target di rete privati o altrimenti bloccati vengono rifiutati prima che OpenClaw inoltri l'URL al Webhook del NAS.

## Multi-account

Sono supportati più account Synology Chat in `channels.synology-chat.accounts`.
Ogni account può sovrascrivere token, URL in ingresso, percorso del Webhook, criterio DM e limiti.
Le sessioni di messaggi diretti sono isolate per account e utente, quindi lo stesso `user_id` numerico
su due account Synology diversi non condivide lo stato della trascrizione.
Assegna a ogni account abilitato un `webhookPath` distinto. OpenClaw ora rifiuta i percorsi esatti duplicati
e rifiuta di avviare account denominati che ereditano soltanto un percorso Webhook condiviso nelle configurazioni multi-account.
Se hai intenzionalmente bisogno dell'ereditarietà legacy per un account denominato, imposta
`dangerouslyAllowInheritedWebhookPath: true` su quell'account o in `channels.synology-chat`,
ma i percorsi esatti duplicati vengono comunque rifiutati in modo chiuso. Preferisci percorsi espliciti per account.

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
- Mantieni `allowInsecureSsl: false` a meno che tu non consideri attendibile esplicitamente un certificato NAS locale autofirmato.
- Le richieste Webhook in ingresso sono verificate tramite token e limitate per frequenza per mittente.
- I controlli sui token non validi usano un confronto del segreto a tempo costante e falliscono in modo chiuso.
- Preferisci `dmPolicy: "allowlist"` per la produzione.
- Mantieni disattivato `dangerouslyAllowNameMatching` a meno che tu non abbia esplicitamente bisogno della consegna legacy delle risposte basata su username.
- Mantieni disattivato `dangerouslyAllowInheritedWebhookPath` a meno che tu non accetti esplicitamente il rischio di routing con percorso condiviso in una configurazione multi-account.

## Risoluzione dei problemi

- `Missing required fields (token, user_id, text)`:
  - nel payload del Webhook in uscita manca uno dei campi obbligatori
  - se Synology invia il token negli header, assicurati che il Gateway/proxy conservi quegli header
- `Invalid token`:
  - il segreto del Webhook in uscita non corrisponde a `channels.synology-chat.token`
  - la richiesta sta raggiungendo l'account/percorso Webhook sbagliato
  - un proxy inverso ha rimosso l'header del token prima che la richiesta raggiungesse OpenClaw
- `Rate limit exceeded`:
  - troppi tentativi con token non valido dalla stessa origine possono bloccare temporaneamente quell'origine
  - anche i mittenti autenticati hanno un limite di frequenza dei messaggi separato per utente
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` è abilitato ma non è configurato alcun utente
- `User not authorized`:
  - il `user_id` numerico del mittente non è in `allowedUserIds`

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Routing dei canali](/it/channels/channel-routing) — routing delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
