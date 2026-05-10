---
read_when:
    - Il trasporto del canale risulta connesso, ma l'invio delle risposte non riesce.
    - Servono controlli specifici per canale prima della documentazione approfondita sui fornitori
summary: Risoluzione rapida dei problemi a livello di canale con firme di errore e correzioni per canale
title: Risoluzione dei problemi dei canali
x-i18n:
    generated_at: "2026-05-10T19:24:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a314cd772e15c038008b78603f811caaa40a3be31e7268c8fb1eefbb000b32
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
- `Capability: read-only`, `write-capable` o `admin-capable`
- Il probe del canale mostra il trasporto connesso e, dove supportato, `works` o `audit ok`

## WhatsApp

### Segnali di errore di WhatsApp

| Sintomo                             | Controllo più rapido                                | Correzione                                                                                                                           |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Connesso ma nessuna risposta ai DM  | `openclaw pairing list whatsapp`                    | Approva il mittente o cambia la policy/l'allowlist dei DM.                                                                           |
| Messaggi di gruppo ignorati         | Controlla `requireMention` + i pattern di menzione nella config | Menziona il bot o allenta la policy di menzione per quel gruppo.                                                                     |
| Il login QR scade con 408           | Controlla le variabili env `HTTPS_PROXY` / `HTTP_PROXY` del Gateway | Imposta un proxy raggiungibile; usa `NO_PROXY` solo per i bypass.                                                                     |
| Disconnessioni/nuovi login casuali in loop | `openclaw channels status --probe` + log            | Le riconnessioni recenti vengono segnalate anche quando il canale è attualmente connesso; osserva i log, riavvia il Gateway, poi ricollega se l'instabilità continua. |
| Le risposte arrivano con secondi/minuti di ritardo | `openclaw doctor --fix`                             | Doctor arresta i client TUI locali obsoleti verificati quando degradano l'event loop del Gateway.                                    |

Risoluzione completa dei problemi: [Risoluzione dei problemi di WhatsApp](/it/channels/whatsapp#troubleshooting)

## Telegram

### Segnali di errore di Telegram

| Sintomo                              | Controllo più rapido                             | Correzione                                                                                                                     |
| ------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `/start` ma nessun flusso di risposta utilizzabile | `openclaw pairing list telegram`                 | Approva il pairing o cambia la policy dei DM.                                                                                  |
| Bot online ma il gruppo resta silenzioso | Verifica il requisito di menzione e la modalità privacy del bot | Disattiva la modalità privacy per la visibilità del gruppo o menziona il bot.                                                   |
| Invii non riusciti con errori di rete | Ispeziona i log per errori nelle chiamate API di Telegram | Correggi il routing DNS/IPv6/proxy verso `api.telegram.org`.                                                                    |
| L'avvio segnala `getMe returned 401` | Controlla la sorgente del token configurata       | Copia di nuovo o rigenera il token BotFather e aggiorna `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` dell'account predefinito. |
| Il polling si blocca o si riconnette lentamente | `openclaw logs --follow` per la diagnostica del polling | Aggiorna; se i riavvii sono falsi positivi, regola `pollingStallThresholdMs`. I blocchi persistenti indicano comunque proxy/DNS/IPv6. |
| `setMyCommands` rifiutato all'avvio  | Ispeziona i log per `BOT_COMMANDS_TOO_MUCH`       | Riduci i comandi Telegram di plugin/Skill/personalizzati o disattiva i menu nativi.                                             |
| Dopo l'upgrade l'allowlist ti blocca | `openclaw security audit` e allowlist di config   | Esegui `openclaw doctor --fix` o sostituisci `@username` con ID mittente numerici.                                               |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Telegram](/it/channels/telegram#troubleshooting)

## Discord

### Segnali di errore di Discord

| Sintomo                                   | Controllo più rapido                                               | Correzione                                                                                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online ma nessuna risposta nella guild | `openclaw channels status --probe`                                 | Consenti guild/canale e verifica l'intent per il contenuto dei messaggi.                                                                                                |
| Messaggi di gruppo ignorati               | Controlla nei log gli scarti dovuti al gating delle menzioni        | Menziona il bot o imposta `requireMention: false` per guild/canale.                                                                                                      |
| Uso di digitazione/token ma nessun messaggio Discord | Il log della sessione mostra testo dell'assistente con `didSendViaMessagingTool: false` | Il modello ha risposto privatamente invece di chiamare lo strumento di messaggistica. Usa un modello affidabile nelle chiamate strumento, oppure imposta `messages.groupChat.visibleReplies: "automatic"` per pubblicare automaticamente. |
| Risposte DM mancanti                      | `openclaw pairing list discord`                                    | Approva il pairing DM o modifica la policy DM.                                                                                                                          |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Discord](/it/channels/discord#troubleshooting)

## Slack

### Segnali di errore di Slack

| Sintomo                                | Controllo più rapido                      | Correzione                                                                                                                                                 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode connessa ma nessuna risposta | `openclaw channels status --probe`        | Verifica app token + bot token e gli scope richiesti; osserva `botTokenStatus` / `appTokenStatus = configured_unavailable` nelle configurazioni basate su SecretRef. |
| DM bloccati                            | `openclaw pairing list slack`             | Approva il pairing o allenta la policy DM.                                                                                                                 |
| Messaggio di canale ignorato           | Controlla `groupPolicy` e l'allowlist del canale | Consenti il canale o passa la policy a `open`.                                                                                                             |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Slack](/it/channels/slack#troubleshooting)

## iMessage

### Segnali di errore di iMessage

| Sintomo                              | Controllo più rapido                                      | Correzione                                                                |
| ------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| `imsg` mancante o non funzionante su non-macOS | `openclaw channels status --probe --channel imessage`     | Esegui OpenClaw sul Mac con Messaggi o usa un wrapper SSH per `cliPath`.  |
| Può inviare ma non riceve su macOS   | Controlla le autorizzazioni privacy di macOS per l'automazione di Messaggi | Concedi di nuovo le autorizzazioni TCC e riavvia il processo del canale.  |
| Mittente DM bloccato                 | `openclaw pairing list imessage`                          | Approva il pairing o aggiorna l'allowlist.                                |

Risoluzione completa dei problemi:

- [Risoluzione dei problemi di iMessage](/it/channels/imessage#troubleshooting)

## Signal

### Segnali di errore di Signal

| Sintomo                         | Controllo più rapido                      | Correzione                                                   |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| Daemon raggiungibile ma bot silenzioso | `openclaw channels status --probe`        | Verifica URL/account del daemon `signal-cli` e modalità di ricezione. |
| DM bloccato                     | `openclaw pairing list signal`            | Approva il mittente o modifica la policy DM.                 |
| Le risposte di gruppo non si attivano | Controlla l'allowlist del gruppo e i pattern di menzione | Aggiungi mittente/gruppo o allenta il gating.                |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Signal](/it/channels/signal#troubleshooting)

## QQ Bot

### Segnali di errore di QQ Bot

| Sintomo                         | Controllo più rapido                              | Correzione                                                       |
| ------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| Il bot risponde "andato su Marte" | Verifica `appId` e `clientSecret` nella config    | Imposta le credenziali o riavvia il Gateway.                     |
| Nessun messaggio in ingresso    | `openclaw channels status --probe`                | Verifica le credenziali sulla QQ Open Platform.                  |
| Voce non trascritta             | Controlla la config del provider STT              | Configura `channels.qqbot.stt` o `tools.media.audio`.            |
| Messaggi proattivi non arrivano | Controlla i requisiti di interazione della piattaforma QQ | QQ può bloccare i messaggi avviati dal bot senza interazione recente. |

Risoluzione completa dei problemi: [Risoluzione dei problemi di QQ Bot](/it/channels/qqbot#troubleshooting)

## Matrix

### Segnali di errore di Matrix

| Sintomo                             | Controllo più rapido                       | Correzione                                                                 |
| ----------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| Autenticato ma ignora i messaggi della stanza | `openclaw channels status --probe`         | Controlla `groupPolicy`, allowlist della stanza e gating delle menzioni.   |
| I DM non vengono elaborati          | `openclaw pairing list matrix`             | Approva il mittente o modifica la policy DM.                               |
| Le stanze cifrate falliscono        | `openclaw matrix verify status`            | Verifica di nuovo il dispositivo, poi controlla `openclaw matrix verify backup status`. |
| Ripristino del backup in sospeso/rotto | `openclaw matrix verify backup status`     | Esegui `openclaw matrix verify backup restore` o riesegui con una chiave di recupero. |
| Cross-signing/bootstrap sembra errato | `openclaw matrix verify bootstrap`         | Ripara archiviazione segreta, cross-signing e stato del backup in un unico passaggio. |

Configurazione e setup completi: [Matrix](/it/channels/matrix)

## Correlati

- [Pairing](/it/channels/pairing)
- [Routing dei canali](/it/channels/channel-routing)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
