---
read_when:
    - Il trasporto del canale risulta connesso, ma le risposte non vanno a buon fine
    - Sono necessari controlli specifici del canale prima della documentazione approfondita del provider
summary: Risoluzione rapida dei problemi a livello di canale con firme degli errori e correzioni per canale
title: Risoluzione dei problemi del canale
x-i18n:
    generated_at: "2026-04-30T08:40:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6024f2ae0a058b2296758c237c912a5cd8ea6bbafea33cc201690cc081efcbee
    source_path: channels/troubleshooting.md
    workflow: 16
---

Usa questa pagina quando un canale si connette ma il comportamento è errato.

## Sequenza dei comandi

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
- `Capability: read-only`, `write-capable`, or `admin-capable`
- Il probe del canale mostra il trasporto connesso e, dove supportato, `works` o `audit ok`

## WhatsApp

### Firme di errore WhatsApp

| Sintomo                         | Verifica più rapida                                  | Correzione                                                                                                                           |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Connesso ma nessuna risposta DM | `openclaw pairing list whatsapp`                     | Approva il mittente o cambia la policy/allowlist DM.                                                                                 |
| Messaggi di gruppo ignorati     | Controlla `requireMention` + i pattern di menzione nella configurazione | Menziona il bot o allenta la policy di menzione per quel gruppo.                                                                     |
| Login QR scade con 408          | Controlla le variabili env `HTTPS_PROXY` / `HTTP_PROXY` del Gateway | Imposta un proxy raggiungibile; usa `NO_PROXY` solo per i bypass.                                                                     |
| Disconnessioni o cicli di nuovo login casuali | `openclaw channels status --probe` + log             | Le riconnessioni recenti vengono segnalate anche quando attualmente connesso; osserva i log, riavvia il Gateway, poi ricollega se l'instabilità continua. |

Risoluzione completa dei problemi: [Risoluzione dei problemi WhatsApp](/it/channels/whatsapp#troubleshooting)

## Telegram

### Firme di errore Telegram

| Sintomo                              | Verifica più rapida                                 | Correzione                                                                                                                       |
| ------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `/start` ma nessun flusso di risposta utilizzabile | `openclaw pairing list telegram`                    | Approva il pairing o cambia la policy DM.                                                                                        |
| Bot online ma il gruppo resta silenzioso | Verifica il requisito di menzione e la modalità privacy del bot | Disabilita la modalità privacy per la visibilità nel gruppo o menziona il bot.                                                    |
| Errori di invio con errori di rete   | Ispeziona i log per errori nelle chiamate API Telegram | Correggi il routing DNS/IPv6/proxy verso `api.telegram.org`.                                                                      |
| L'avvio segnala `getMe returned 401` | Controlla la fonte del token configurata            | Ricopia o rigenera il token BotFather e aggiorna `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` dell'account predefinito.        |
| Il polling si blocca o si riconnette lentamente | `openclaw logs --follow` per diagnostica del polling | Esegui l'upgrade; se i riavvii sono falsi positivi, regola `pollingStallThresholdMs`. I blocchi persistenti indicano ancora proxy/DNS/IPv6. |
| `setMyCommands` rifiutato all'avvio | Ispeziona i log per `BOT_COMMANDS_TOO_MUCH`         | Riduci i comandi Plugin/skill/personalizzati Telegram o disabilita i menu nativi.                                                 |
| Dopo l'upgrade l'allowlist ti blocca | `openclaw security audit` e allowlist di configurazione | Esegui `openclaw doctor --fix` o sostituisci `@username` con ID mittente numerici.                                                |

Risoluzione completa dei problemi: [Risoluzione dei problemi Telegram](/it/channels/telegram#troubleshooting)

## Discord

### Firme di errore Discord

| Sintomo                         | Verifica più rapida                   | Correzione                                                  |
| ------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| Bot online ma nessuna risposta nella guild | `openclaw channels status --probe`    | Consenti guild/canale e verifica l'intent del contenuto dei messaggi. |
| Messaggi di gruppo ignorati     | Controlla nei log gli scarti per gating delle menzioni | Menziona il bot o imposta `requireMention: false` per guild/canale. |
| Risposte DM mancanti            | `openclaw pairing list discord`       | Approva il pairing DM o modifica la policy DM.              |

Risoluzione completa dei problemi: [Risoluzione dei problemi Discord](/it/channels/discord#troubleshooting)

## Slack

### Firme di errore Slack

| Sintomo                                | Verifica più rapida                          | Correzione                                                                                                                                              |
| -------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modalità socket connessa ma nessuna risposta | `openclaw channels status --probe`           | Verifica app token + bot token e gli scope richiesti; osserva `botTokenStatus` / `appTokenStatus = configured_unavailable` nelle configurazioni basate su SecretRef. |
| DM bloccati                            | `openclaw pairing list slack`                | Approva il pairing o allenta la policy DM.                                                                                                              |
| Messaggio di canale ignorato           | Controlla `groupPolicy` e allowlist del canale | Consenti il canale o cambia la policy in `open`.                                                                                                        |

Risoluzione completa dei problemi: [Risoluzione dei problemi Slack](/it/channels/slack#troubleshooting)

## iMessage e BlueBubbles

### Firme di errore iMessage e BlueBubbles

| Sintomo                          | Verifica più rapida                                                   | Correzione                                             |
| -------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| Nessun evento in ingresso        | Verifica raggiungibilità di Webhook/server e permessi dell'app        | Correggi l'URL del Webhook o lo stato del server BlueBubbles. |
| Può inviare ma non riceve su macOS | Controlla i permessi privacy di macOS per l'automazione di Messages   | Concedi di nuovo i permessi TCC e riavvia il processo del canale. |
| Mittente DM bloccato             | `openclaw pairing list imessage` o `openclaw pairing list bluebubbles` | Approva il pairing o aggiorna l'allowlist.             |

Risoluzione completa dei problemi:

- [Risoluzione dei problemi iMessage](/it/channels/imessage#troubleshooting)
- [Risoluzione dei problemi BlueBubbles](/it/channels/bluebubbles#troubleshooting)

## Signal

### Firme di errore Signal

| Sintomo                         | Verifica più rapida                         | Correzione                                                |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| Daemon raggiungibile ma bot silenzioso | `openclaw channels status --probe`          | Verifica URL/account del daemon `signal-cli` e modalità di ricezione. |
| DM bloccato                     | `openclaw pairing list signal`              | Approva il mittente o modifica la policy DM.              |
| Le risposte di gruppo non si attivano | Controlla allowlist del gruppo e pattern di menzione | Aggiungi mittente/gruppo o allenta il gating.             |

Risoluzione completa dei problemi: [Risoluzione dei problemi Signal](/it/channels/signal#troubleshooting)

## QQ Bot

### Firme di errore QQ Bot

| Sintomo                         | Verifica più rapida                             | Correzione                                                       |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| Il bot risponde "gone to Mars"  | Verifica `appId` e `clientSecret` nella configurazione | Imposta le credenziali o riavvia il Gateway.                     |
| Nessun messaggio in ingresso    | `openclaw channels status --probe`              | Verifica le credenziali sulla QQ Open Platform.                  |
| Voce non trascritta             | Controlla la configurazione del provider STT    | Configura `channels.qqbot.stt` o `tools.media.audio`.            |
| Messaggi proattivi non ricevuti | Controlla i requisiti di interazione della piattaforma QQ | QQ può bloccare messaggi iniziati dal bot senza interazione recente. |

Risoluzione completa dei problemi: [Risoluzione dei problemi QQ Bot](/it/channels/qqbot#troubleshooting)

## Matrix

### Firme di errore Matrix

| Sintomo                             | Verifica più rapida                         | Correzione                                                             |
| ----------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| Ha effettuato l'accesso ma ignora i messaggi della stanza | `openclaw channels status --probe`          | Controlla `groupPolicy`, allowlist della stanza e gating delle menzioni. |
| I DM non vengono elaborati          | `openclaw pairing list matrix`              | Approva il mittente o modifica la policy DM.                           |
| Le stanze crittografate falliscono  | `openclaw matrix verify status`             | Verifica di nuovo il dispositivo, poi controlla `openclaw matrix verify backup status`. |
| Il ripristino del backup è in sospeso/non funzionante | `openclaw matrix verify backup status`      | Esegui `openclaw matrix verify backup restore` o ripeti con una chiave di recupero. |
| Cross-signing/bootstrap sembra errato | `openclaw matrix verify bootstrap`          | Ripara secret storage, cross-signing e stato del backup in un unico passaggio. |

Configurazione e setup completi: [Matrix](/it/channels/matrix)

## Correlati

- [Pairing](/it/channels/pairing)
- [Routing dei canali](/it/channels/channel-routing)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
