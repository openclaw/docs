---
read_when:
    - Il trasporto del canale risulta connesso, ma le risposte non vanno a buon fine
    - Sono necessari controlli specifici per canale prima della documentazione approfondita sui provider
summary: Risoluzione rapida dei problemi a livello di canale con firme di errore e correzioni per ciascun canale
title: Risoluzione dei problemi dei canali
x-i18n:
    generated_at: "2026-05-05T08:25:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360184c41ce6929c696688af597c5104a8a28b54620c354f7ee400a2e5490519
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

Baseline sana:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, o `admin-capable`
- Il probe del canale mostra il trasporto connesso e, dove supportato, `works` o `audit ok`

## WhatsApp

### Firme di errore di WhatsApp

| Sintomo                             | Controllo più rapido                                | Correzione                                                                                                                                    |
| ----------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Connesso ma nessuna risposta DM     | `openclaw pairing list whatsapp`                    | Approva il mittente o cambia la policy DM/allowlist.                                                                                           |
| Messaggi di gruppo ignorati         | Controlla `requireMention` + pattern di menzione nella configurazione | Menziona il bot o allenta la policy sulle menzioni per quel gruppo.                                                                            |
| Il login QR va in timeout con 408   | Controlla le env `HTTPS_PROXY` / `HTTP_PROXY` del Gateway | Imposta un proxy raggiungibile; usa `NO_PROXY` solo per i bypass.                                                                               |
| Disconnessioni/cicli di nuovo login casuali | `openclaw channels status --probe` + log     | Le riconnessioni recenti vengono segnalate anche quando ora è connesso; osserva i log, riavvia il Gateway, poi ricollega se l'instabilità continua. |
| Le risposte arrivano con secondi/minuti di ritardo | `openclaw doctor --fix`            | Doctor arresta i client TUI locali stale verificati quando degradano l'event loop del Gateway.                                                  |

Risoluzione completa dei problemi: [Risoluzione dei problemi di WhatsApp](/it/channels/whatsapp#troubleshooting)

## Telegram

### Firme di errore di Telegram

| Sintomo                              | Controllo più rapido                              | Correzione                                                                                                                        |
| ------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/start` ma nessun flusso di risposta utilizzabile | `openclaw pairing list telegram`      | Approva il pairing o cambia la policy DM.                                                                                         |
| Bot online ma il gruppo resta silenzioso | Verifica il requisito di menzione e la modalità privacy del bot | Disattiva la modalità privacy per la visibilità nel gruppo o menziona il bot.                                                      |
| Invii non riusciti con errori di rete | Ispeziona i log per errori nelle chiamate API Telegram | Correggi il routing DNS/IPv6/proxy verso `api.telegram.org`.                                                                       |
| L'avvio segnala `getMe returned 401` | Controlla la fonte del token configurata          | Ricopia o rigenera il token BotFather e aggiorna `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` dell'account predefinito.          |
| Il polling si blocca o si riconnette lentamente | `openclaw logs --follow` per diagnostica del polling | Aggiorna; se i riavvii sono falsi positivi, regola `pollingStallThresholdMs`. I blocchi persistenti indicano ancora proxy/DNS/IPv6. |
| `setMyCommands` rifiutato all'avvio | Ispeziona i log per `BOT_COMMANDS_TOO_MUCH`       | Riduci i comandi Telegram di Plugin/skill/personalizzati o disabilita i menu nativi.                                                |
| Dopo l'aggiornamento l'allowlist ti blocca | `openclaw security audit` e allowlist di configurazione | Esegui `openclaw doctor --fix` o sostituisci `@username` con ID mittente numerici.                                                  |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Telegram](/it/channels/telegram#troubleshooting)

## Discord

### Firme di errore di Discord

| Sintomo                                   | Controllo più rapido                                                          | Correzione                                                                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online ma nessuna risposta nel guild  | `openclaw channels status --probe`                                            | Consenti guild/canale e verifica l'intent del contenuto dei messaggi.                                                                                               |
| Messaggi di gruppo ignorati               | Controlla nei log gli scarti dovuti al gating sulle menzioni                  | Menziona il bot o imposta `requireMention: false` per guild/canale.                                                                                                 |
| Uso di typing/token ma nessun messaggio Discord | Il log della sessione mostra testo dell'assistente con `didSendViaMessagingTool: false` | Il modello ha risposto privatamente invece di chiamare lo strumento di messaggistica. Usa un modello affidabile nelle tool call, oppure imposta `messages.groupChat.visibleReplies: "automatic"` per pubblicare automaticamente. |
| Risposte DM mancanti                      | `openclaw pairing list discord`                                               | Approva il pairing DM o regola la policy DM.                                                                                                                       |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Discord](/it/channels/discord#troubleshooting)

## Slack

### Firme di errore di Slack

| Sintomo                                | Controllo più rapido                             | Correzione                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Socket mode connesso ma nessuna risposta | `openclaw channels status --probe`             | Verifica app token + bot token e gli scope richiesti; controlla `botTokenStatus` / `appTokenStatus = configured_unavailable` nelle configurazioni basate su SecretRef. |
| DM bloccati                            | `openclaw pairing list slack`                   | Approva il pairing o allenta la policy DM.                                                                                                                   |
| Messaggio di canale ignorato           | Controlla `groupPolicy` e allowlist del canale  | Consenti il canale o cambia la policy in `open`.                                                                                                             |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Slack](/it/channels/slack#troubleshooting)

## iMessage e BlueBubbles

### Firme di errore di iMessage e BlueBubbles

| Sintomo                          | Controllo più rapido                                                   | Correzione                                            |
| -------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Nessun evento in ingresso         | Verifica la raggiungibilità di webhook/server e i permessi dell'app   | Correggi l'URL del Webhook o lo stato del server BlueBubbles. |
| Può inviare ma non riceve su macOS | Controlla i permessi privacy di macOS per l'automazione di Messages   | Riconcedi i permessi TCC e riavvia il processo del canale. |
| Mittente DM bloccato              | `openclaw pairing list imessage` o `openclaw pairing list bluebubbles` | Approva il pairing o aggiorna l'allowlist.            |

Risoluzione completa dei problemi:

- [Risoluzione dei problemi di iMessage](/it/channels/imessage#troubleshooting)
- [Risoluzione dei problemi di BlueBubbles](/it/channels/bluebubbles#troubleshooting)

## Signal

### Firme di errore di Signal

| Sintomo                         | Controllo più rapido                      | Correzione                                                   |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| Daemon raggiungibile ma bot silenzioso | `openclaw channels status --probe` | Verifica l'URL/account del daemon `signal-cli` e la modalità di ricezione. |
| DM bloccato                     | `openclaw pairing list signal`            | Approva il mittente o regola la policy DM.                   |
| Le risposte di gruppo non si attivano | Controlla allowlist del gruppo e pattern di menzione | Aggiungi mittente/gruppo o allenta il gating.                |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Signal](/it/channels/signal#troubleshooting)

## QQ Bot

### Firme di errore di QQ Bot

| Sintomo                         | Controllo più rapido                         | Correzione                                                         |
| ------------------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| Il bot risponde "andato su Marte" | Verifica `appId` e `clientSecret` nella configurazione | Imposta le credenziali o riavvia il Gateway.                       |
| Nessun messaggio in ingresso     | `openclaw channels status --probe`            | Verifica le credenziali sulla QQ Open Platform.                    |
| Voce non trascritta              | Controlla la configurazione del provider STT  | Configura `channels.qqbot.stt` o `tools.media.audio`.              |
| Messaggi proattivi non arrivano  | Controlla i requisiti di interazione della piattaforma QQ | QQ può bloccare i messaggi avviati dal bot senza interazioni recenti. |

Risoluzione completa dei problemi: [Risoluzione dei problemi di QQ Bot](/it/channels/qqbot#troubleshooting)

## Matrix

### Firme di errore di Matrix

| Sintomo                             | Controllo più rapido                    | Correzione                                                               |
| ----------------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| Effettua il login ma ignora i messaggi della stanza | `openclaw channels status --probe` | Controlla `groupPolicy`, allowlist delle stanze e gating sulle menzioni. |
| I DM non vengono elaborati          | `openclaw pairing list matrix`          | Approva il mittente o regola la policy DM.                               |
| Le stanze cifrate falliscono        | `openclaw matrix verify status`         | Riverifica il dispositivo, poi controlla `openclaw matrix verify backup status`. |
| Il ripristino del backup è in sospeso/rotto | `openclaw matrix verify backup status` | Esegui `openclaw matrix verify backup restore` o rilancia con una chiave di recupero. |
| Cross-signing/bootstrap sembra errato | `openclaw matrix verify bootstrap`    | Ripara secret storage, cross-signing e stato del backup in un solo passaggio. |

Configurazione e setup completi: [Matrix](/it/channels/matrix)

## Correlati

- [Pairing](/it/channels/pairing)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
