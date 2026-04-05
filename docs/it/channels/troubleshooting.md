---
read_when:
    - Il trasporto del canale risulta connesso ma le risposte non funzionano
    - Hai bisogno di controlli specifici per il canale prima di consultare la documentazione approfondita del provider
summary: Risoluzione rapida dei problemi a livello di canale con firme di errore e correzioni per ciascun canale
title: Risoluzione dei problemi dei canali
x-i18n:
    generated_at: "2026-04-05T13:45:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: d45d8220505ea420d970b20bc66e65216c2d7024b5736db1936421ffc0676e1f
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Risoluzione dei problemi dei canali

Usa questa pagina quando un canale si connette ma il comportamento non è corretto.

## Sequenza di comandi

Esegui prima questi, in questo ordine:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Baseline sana:

- `Runtime: running`
- `RPC probe: ok`
- La probe del canale mostra il trasporto connesso e, dove supportato, `works` o `audit ok`

## WhatsApp

### Firme di errore di WhatsApp

| Sintomo                        | Controllo più rapido                                 | Correzione                                                   |
| ------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------ |
| Connesso ma nessuna risposta DM | `openclaw pairing list whatsapp`                     | Approva il mittente o cambia la policy/allowlist dei DM.     |
| Messaggi di gruppo ignorati    | Controlla `requireMention` + i pattern di menzione nella config | Menziona il bot o allenta la policy di menzione per quel gruppo. |
| Disconnessioni casuali/cicli di nuovo login | `openclaw channels status --probe` + log            | Effettua di nuovo il login e verifica che la directory delle credenziali sia integra. |

Risoluzione completa dei problemi: [/channels/whatsapp#troubleshooting](/channels/whatsapp#troubleshooting)

## Telegram

### Firme di errore di Telegram

| Sintomo                            | Controllo più rapido                            | Correzione                                                                  |
| ---------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `/start` ma nessun flusso di risposta utilizzabile | `openclaw pairing list telegram`                | Approva l'associazione o modifica la policy dei DM.                         |
| Bot online ma il gruppo resta silenzioso | Verifica il requisito di menzione e la modalità privacy del bot | Disabilita la modalità privacy per la visibilità nel gruppo oppure menziona il bot. |
| Errori di invio con errori di rete | Ispeziona i log per i fallimenti delle chiamate API di Telegram | Correggi il routing DNS/IPv6/proxy verso `api.telegram.org`.                |
| `setMyCommands` rifiutato all'avvio | Ispeziona i log per `BOT_COMMANDS_TOO_MUCH`     | Riduci i comandi Telegram di plugin/Skills/personalizzati oppure disabilita i menu nativi. |
| Hai effettuato un upgrade e l'allowlist ti blocca | `openclaw security audit` e le allowlist della config | Esegui `openclaw doctor --fix` oppure sostituisci `@username` con ID numerici del mittente. |

Risoluzione completa dei problemi: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Firme di errore di Discord

| Sintomo                        | Controllo più rapido                  | Correzione                                                    |
| ------------------------------ | ------------------------------------- | ------------------------------------------------------------- |
| Bot online ma nessuna risposta nel server | `openclaw channels status --probe`   | Consenti server/canale e verifica l'intento del contenuto dei messaggi. |
| Messaggi di gruppo ignorati    | Controlla nei log i blocchi dovuti alla regola di menzione | Menziona il bot o imposta `requireMention: false` per server/canale. |
| Risposte DM mancanti           | `openclaw pairing list discord`       | Approva l'associazione DM o regola la policy dei DM.          |

Risoluzione completa dei problemi: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Firme di errore di Slack

| Sintomo                               | Controllo più rapido                      | Correzione                                                                                                                                              |
| ------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode connessa ma nessuna risposta | `openclaw channels status --probe`        | Verifica app token + bot token e gli scope richiesti; controlla `botTokenStatus` / `appTokenStatus = configured_unavailable` nelle configurazioni basate su SecretRef. |
| DM bloccati                           | `openclaw pairing list slack`             | Approva l'associazione o allenta la policy dei DM.                                                                                                      |
| Messaggio del canale ignorato         | Controlla `groupPolicy` e l'allowlist del canale | Consenti il canale o cambia la policy in `open`.                                                                                                        |

Risoluzione completa dei problemi: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage e BlueBubbles

### Firme di errore di iMessage e BlueBubbles

| Sintomo                         | Controllo più rapido                                                    | Correzione                                            |
| ------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Nessun evento in ingresso       | Verifica la raggiungibilità del webhook/server e i permessi dell'app    | Correggi l'URL del webhook o lo stato del server BlueBubbles. |
| Può inviare ma non ricevere su macOS | Controlla i permessi privacy di macOS per l'automazione di Messages | Concedi di nuovo i permessi TCC e riavvia il processo del canale. |
| Mittente DM bloccato            | `openclaw pairing list imessage` o `openclaw pairing list bluebubbles` | Approva l'associazione o aggiorna l'allowlist.        |

Risoluzione completa dei problemi:

- [/channels/imessage#troubleshooting](/it/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/it/channels/bluebubbles#troubleshooting)

## Signal

### Firme di errore di Signal

| Sintomo                        | Controllo più rapido                       | Correzione                                              |
| ------------------------------ | ------------------------------------------ | ------------------------------------------------------- |
| Demone raggiungibile ma bot silenzioso | `openclaw channels status --probe`         | Verifica URL/account del demone `signal-cli` e la modalità di ricezione. |
| DM bloccato                    | `openclaw pairing list signal`             | Approva il mittente o regola la policy dei DM.          |
| Le risposte nei gruppi non si attivano | Controlla l'allowlist del gruppo e i pattern di menzione | Aggiungi mittente/gruppo o allenta il gating.           |

Risoluzione completa dei problemi: [/channels/signal#troubleshooting](/it/channels/signal#troubleshooting)

## QQ Bot

### Firme di errore di QQ Bot

| Sintomo                        | Controllo più rapido                         | Correzione                                                          |
| ------------------------------ | -------------------------------------------- | ------------------------------------------------------------------- |
| Il bot risponde "gone to Mars" | Verifica `appId` e `clientSecret` nella config | Imposta le credenziali o riavvia il gateway.                        |
| Nessun messaggio in ingresso   | `openclaw channels status --probe`           | Verifica le credenziali sulla QQ Open Platform.                     |
| Voce non trascritta            | Controlla la config del provider STT         | Configura `channels.qqbot.stt` o `tools.media.audio`.               |
| I messaggi proattivi non arrivano | Controlla i requisiti di interazione della piattaforma QQ | QQ può bloccare i messaggi avviati dal bot senza un'interazione recente. |

Risoluzione completa dei problemi: [/channels/qqbot#troubleshooting](/it/channels/qqbot#troubleshooting)

## Matrix

### Firme di errore di Matrix

| Sintomo                            | Controllo più rapido                    | Correzione                                                                |
| ---------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| Accesso eseguito ma i messaggi della stanza vengono ignorati | `openclaw channels status --probe`      | Controlla `groupPolicy`, l'allowlist delle stanze e il gating delle menzioni. |
| I DM non vengono elaborati         | `openclaw pairing list matrix`          | Approva il mittente o regola la policy dei DM.                            |
| Le stanze crittografate non funzionano | `openclaw matrix verify status`         | Verifica di nuovo il dispositivo, poi controlla `openclaw matrix verify backup status`. |
| Il ripristino del backup è in sospeso/non funziona | `openclaw matrix verify backup status` | Esegui `openclaw matrix verify backup restore` o ripeti l'operazione con una chiave di recupero. |
| Cross-signing/bootstrap sembra errato | `openclaw matrix verify bootstrap`      | Ripara secret storage, cross-signing e stato del backup in un solo passaggio. |

Configurazione e setup completi: [Matrix](/channels/matrix)
