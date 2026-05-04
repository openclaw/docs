---
read_when:
    - Il trasporto del canale risulta connesso ma le risposte non vanno a buon fine
    - Sono necessari controlli specifici per canale prima della documentazione approfondita sui provider
summary: Risoluzione rapida dei problemi a livello di canale con firme di errore e correzioni per canale
title: Risoluzione dei problemi del canale
x-i18n:
    generated_at: "2026-05-04T02:22:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3a0737156ae83897c44d18505e0355a5d8e5700106b984496d94874c270deb2
    source_path: channels/troubleshooting.md
    workflow: 16
---

Usa questa pagina quando un canale si connette ma il comportamento è errato.

## Sequenza di comandi

Esegui prima questi comandi in ordine:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Stato di riferimento corretto:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, o `admin-capable`
- Il probe del canale mostra il transport connesso e, dove supportato, `works` o `audit ok`

## WhatsApp

### Segnali di errore di WhatsApp

| Sintomo                         | Controllo più rapido                                 | Correzione                                                                                                                       |
| ------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Connesso ma nessuna risposta DM | `openclaw pairing list whatsapp`                     | Approva il mittente o cambia policy/allowlist dei DM.                                                                            |
| Messaggi di gruppo ignorati     | Controlla `requireMention` + pattern di menzione nella config | Menziona il bot o rendi meno restrittiva la policy di menzione per quel gruppo.                                                  |
| Login QR in timeout con 408     | Controlla env `HTTPS_PROXY` / `HTTP_PROXY` del Gateway | Imposta un proxy raggiungibile; usa `NO_PROXY` solo per i bypass.                                                                |
| Disconnessioni casuali/cicli di nuovo login | `openclaw channels status --probe` + log             | Le riconnessioni recenti vengono segnalate anche quando ora è connesso; osserva i log, riavvia il Gateway, poi ricollega se l'instabilità continua. |

Risoluzione completa dei problemi: [Risoluzione dei problemi di WhatsApp](/it/channels/whatsapp#troubleshooting)

## Telegram

### Segnali di errore di Telegram

| Sintomo                              | Controllo più rapido                                  | Correzione                                                                                                                       |
| ------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/start` ma nessun flusso di risposta utilizzabile | `openclaw pairing list telegram`                      | Approva il pairing o cambia la policy dei DM.                                                                                    |
| Bot online ma il gruppo resta silenzioso | Verifica il requisito di menzione e la modalità privacy del bot | Disattiva la modalità privacy per la visibilità nel gruppo o menziona il bot.                                                    |
| Errori di invio con errori di rete   | Ispeziona i log per errori nelle chiamate API Telegram | Correggi routing DNS/IPv6/proxy verso `api.telegram.org`.                                                                        |
| L'avvio segnala `getMe returned 401` | Controlla la fonte del token configurata              | Ricopia o rigenera il token BotFather e aggiorna `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` dell'account predefinito.        |
| Polling bloccato o riconnessioni lente | `openclaw logs --follow` per diagnostica del polling  | Aggiorna; se i riavvii sono falsi positivi, regola `pollingStallThresholdMs`. Blocchi persistenti indicano ancora proxy/DNS/IPv6. |
| `setMyCommands` rifiutato all'avvio | Ispeziona i log per `BOT_COMMANDS_TOO_MUCH`           | Riduci i comandi Telegram di plugin/skill/personalizzati o disattiva i menu nativi.                                             |
| Dopo l'upgrade l'allowlist ti blocca | `openclaw security audit` e allowlist nella config    | Esegui `openclaw doctor --fix` o sostituisci `@username` con ID mittente numerici.                                               |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Telegram](/it/channels/telegram#troubleshooting)

## Discord

### Segnali di errore di Discord

| Sintomo                                   | Controllo più rapido                                                         | Correzione                                                                                                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online ma nessuna risposta nella guild | `openclaw channels status --probe`                                            | Consenti guild/canale e verifica l'intent per il contenuto dei messaggi.                                                                                                |
| Messaggi di gruppo ignorati              | Controlla nei log gli scarti dovuti al gating delle menzioni                  | Menziona il bot o imposta `requireMention: false` per guild/canale.                                                                                                     |
| Uso di typing/token ma nessun messaggio Discord | Il log della sessione mostra testo dell'assistente con `didSendViaMessagingTool: false` | Il modello ha risposto privatamente invece di chiamare lo strumento di messaggistica. Usa un modello affidabile per le chiamate strumento, oppure imposta `messages.groupChat.visibleReplies: "automatic"` per pubblicare automaticamente. |
| Risposte DM mancanti                      | `openclaw pairing list discord`                                               | Approva il pairing DM o modifica la policy dei DM.                                                                                                                      |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Discord](/it/channels/discord#troubleshooting)

## Slack

### Segnali di errore di Slack

| Sintomo                                | Controllo più rapido                          | Correzione                                                                                                                                          |
| -------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode connesso ma nessuna risposta | `openclaw channels status --probe`             | Verifica app token + bot token e gli scope richiesti; controlla `botTokenStatus` / `appTokenStatus = configured_unavailable` nelle configurazioni basate su SecretRef. |
| DM bloccati                            | `openclaw pairing list slack`                  | Approva il pairing o rendi meno restrittiva la policy dei DM.                                                                                       |
| Messaggio di canale ignorato           | Controlla `groupPolicy` e allowlist del canale | Consenti il canale o cambia la policy in `open`.                                                                                                    |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Slack](/it/channels/slack#troubleshooting)

## iMessage e BlueBubbles

### Segnali di errore di iMessage e BlueBubbles

| Sintomo                          | Controllo più rapido                                                      | Correzione                                             |
| -------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| Nessun evento in ingresso        | Verifica raggiungibilità webhook/server e permessi dell'app                | Correggi l'URL del Webhook o lo stato del server BlueBubbles. |
| Puoi inviare ma non ricevere su macOS | Controlla i permessi privacy di macOS per l'automazione di Messages        | Concedi di nuovo i permessi TCC e riavvia il processo del canale. |
| Mittente DM bloccato             | `openclaw pairing list imessage` o `openclaw pairing list bluebubbles`     | Approva il pairing o aggiorna l'allowlist.             |

Risoluzione completa dei problemi:

- [Risoluzione dei problemi di iMessage](/it/channels/imessage#troubleshooting)
- [Risoluzione dei problemi di BlueBubbles](/it/channels/bluebubbles#troubleshooting)

## Signal

### Segnali di errore di Signal

| Sintomo                         | Controllo più rapido                       | Correzione                                             |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| Daemon raggiungibile ma bot silenzioso | `openclaw channels status --probe`         | Verifica URL/account del daemon `signal-cli` e modalità di ricezione. |
| DM bloccato                     | `openclaw pairing list signal`             | Approva il mittente o modifica la policy dei DM.       |
| Le risposte di gruppo non si attivano | Controlla allowlist del gruppo e pattern di menzione | Aggiungi mittente/gruppo o allenta il gating.          |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Signal](/it/channels/signal#troubleshooting)

## QQ Bot

### Segnali di errore di QQ Bot

| Sintomo                         | Controllo più rapido                              | Correzione                                                     |
| ------------------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| Il bot risponde "gone to Mars"  | Verifica `appId` e `clientSecret` nella config    | Imposta le credenziali o riavvia il Gateway.                   |
| Nessun messaggio in ingresso    | `openclaw channels status --probe`                | Verifica le credenziali sulla QQ Open Platform.                |
| Voce non trascritta             | Controlla la config del provider STT              | Configura `channels.qqbot.stt` o `tools.media.audio`.          |
| Messaggi proattivi non ricevuti | Controlla i requisiti di interazione della piattaforma QQ | QQ può bloccare i messaggi avviati dal bot senza un'interazione recente. |

Risoluzione completa dei problemi: [Risoluzione dei problemi di QQ Bot](/it/channels/qqbot#troubleshooting)

## Matrix

### Segnali di errore di Matrix

| Sintomo                             | Controllo più rapido                       | Correzione                                                                 |
| ----------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| Accesso effettuato ma ignora i messaggi della stanza | `openclaw channels status --probe`         | Controlla `groupPolicy`, allowlist della stanza e gating delle menzioni.   |
| I DM non vengono elaborati          | `openclaw pairing list matrix`             | Approva il mittente o modifica la policy dei DM.                           |
| Stanze cifrate non funzionano       | `openclaw matrix verify status`            | Verifica di nuovo il dispositivo, poi controlla `openclaw matrix verify backup status`. |
| Ripristino del backup in sospeso/non funzionante | `openclaw matrix verify backup status`     | Esegui `openclaw matrix verify backup restore` o ripeti con una chiave di recovery. |
| Cross-signing/bootstrap sembra errato | `openclaw matrix verify bootstrap`         | Ripara secret storage, cross-signing e stato del backup in un solo passaggio. |

Configurazione completa e setup: [Matrix](/it/channels/matrix)

## Correlati

- [Pairing](/it/channels/pairing)
- [Instradamento del canale](/it/channels/channel-routing)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
