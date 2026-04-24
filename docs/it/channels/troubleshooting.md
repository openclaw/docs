---
read_when:
    - Il trasporto del canale risulta connesso ma le risposte non vengono inviate
    - Hai bisogno di controlli specifici del canale prima di consultare la documentazione approfondita del provider
summary: Risoluzione rapida dei problemi a livello di canale con firme di errore e correzioni per canale
title: Risoluzione dei problemi del canale
x-i18n:
    generated_at: "2026-04-24T08:31:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae605835c3566958341b11d8bdfc3cd4cb4656142bb2953933d06ed6018a483f
    source_path: channels/troubleshooting.md
    workflow: 15
---

Usa questa pagina quando un canale si connette ma il comportamento è errato.

## Sequenza di comandi

Esegui prima questi, in quest'ordine:

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
- `Capability: read-only`, `write-capable` oppure `admin-capable`
- Il probe del canale mostra il trasporto connesso e, dove supportato, `works` oppure `audit ok`

## WhatsApp

### Firme di errore di WhatsApp

| Sintomo                        | Controllo più rapido                              | Correzione                                             |
| ----------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| Connesso ma nessuna risposta DM | `openclaw pairing list whatsapp`                  | Approva il mittente oppure cambia criterio DM/allowlist. |
| I messaggi di gruppo vengono ignorati | Controlla `requireMention` + pattern di menzione nella configurazione | Menziona il bot oppure allenta il criterio di menzione per quel gruppo. |
| Disconnessioni/cicli di nuovo login casuali | `openclaw channels status --probe` + log         | Esegui di nuovo il login e verifica che la directory delle credenziali sia integra. |

Risoluzione completa dei problemi: [Risoluzione dei problemi di WhatsApp](/it/channels/whatsapp#troubleshooting)

## Telegram

### Firme di errore di Telegram

| Sintomo                            | Controllo più rapido                              | Correzione                                                                                                               |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `/start` ma nessun flusso di risposta utilizzabile | `openclaw pairing list telegram`                  | Approva l'abbinamento oppure cambia il criterio DM.                                                                     |
| Bot online ma il gruppo resta silenzioso | Verifica il requisito di menzione e la privacy mode del bot | Disabilita la privacy mode per la visibilità nel gruppo oppure menziona il bot.                                        |
| Errori di invio con errori di rete | Controlla i log per gli errori delle chiamate API Telegram | Correggi l'instradamento DNS/IPv6/proxy verso `api.telegram.org`.                                                      |
| Il polling si blocca o si riconnette lentamente | `openclaw logs --follow` per la diagnostica del polling | Aggiorna; se i riavvii sono falsi positivi, regola `pollingStallThresholdMs`. I blocchi persistenti indicano ancora problemi di proxy/DNS/IPv6. |
| `setMyCommands` rifiutato all'avvio | Controlla i log per `BOT_COMMANDS_TOO_MUCH`       | Riduci i comandi Telegram di plugin/Skills/personalizzati oppure disabilita i menu nativi.                            |
| Hai aggiornato e l'allowlist ti blocca | `openclaw security audit` e allowlist della configurazione | Esegui `openclaw doctor --fix` oppure sostituisci `@username` con ID mittente numerici.                               |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Telegram](/it/channels/telegram#troubleshooting)

## Discord

### Firme di errore di Discord

| Sintomo                        | Controllo più rapido               | Correzione                                                  |
| ----------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| Bot online ma nessuna risposta nel server | `openclaw channels status --probe` | Consenti il server/canale e verifica l'intent del contenuto dei messaggi. |
| I messaggi di gruppo vengono ignorati | Controlla nei log i blocchi dovuti al controllo menzioni | Menziona il bot oppure imposta `guild/channel requireMention: false`. |
| Mancano le risposte ai DM     | `openclaw pairing list discord`    | Approva l'abbinamento DM oppure modifica il criterio DM.    |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Discord](/it/channels/discord#troubleshooting)

## Slack

### Firme di errore di Slack

| Sintomo                               | Controllo più rapido                      | Correzione                                                                                                                                            |
| ------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode connessa ma nessuna risposta | `openclaw channels status --probe`        | Verifica app token + bot token e gli scope richiesti; controlla `botTokenStatus` / `appTokenStatus = configured_unavailable` nelle configurazioni supportate da SecretRef. |
| DM bloccati                           | `openclaw pairing list slack`             | Approva l'abbinamento oppure allenta il criterio DM.                                                                                                  |
| Messaggio del canale ignorato         | Controlla `groupPolicy` e l'allowlist del canale | Consenti il canale oppure cambia il criterio in `open`.                                                                                               |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Slack](/it/channels/slack#troubleshooting)

## iMessage e BlueBubbles

### Firme di errore di iMessage e BlueBubbles

| Sintomo                         | Controllo più rapido                                                        | Correzione                                            |
| ------------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------- |
| Nessun evento in ingresso      | Verifica raggiungibilità webhook/server e permessi dell'app                 | Correggi l'URL del webhook o lo stato del server BlueBubbles. |
| Può inviare ma non ricevere su macOS | Controlla i permessi privacy macOS per l'automazione di Messages            | Concedi nuovamente i permessi TCC e riavvia il processo del canale. |
| Mittente DM bloccato           | `openclaw pairing list imessage` oppure `openclaw pairing list bluebubbles` | Approva l'abbinamento oppure aggiorna l'allowlist.    |

Risoluzione completa dei problemi:

- [Risoluzione dei problemi di iMessage](/it/channels/imessage#troubleshooting)
- [Risoluzione dei problemi di BlueBubbles](/it/channels/bluebubbles#troubleshooting)

## Signal

### Firme di errore di Signal

| Sintomo                        | Controllo più rapido               | Correzione                                                  |
| ----------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| Demone raggiungibile ma bot silenzioso | `openclaw channels status --probe` | Verifica l'URL/account del demone `signal-cli` e la modalità di ricezione. |
| DM bloccato                   | `openclaw pairing list signal`     | Approva il mittente oppure modifica il criterio DM.         |
| Le risposte di gruppo non si attivano | Controlla allowlist di gruppo e pattern di menzione | Aggiungi mittente/gruppo oppure allenta i controlli.        |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Signal](/it/channels/signal#troubleshooting)

## QQ Bot

### Firme di errore di QQ Bot

| Sintomo                        | Controllo più rapido                              | Correzione                                                        |
| ----------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| Il bot risponde "gone to Mars" | Verifica `appId` e `clientSecret` nella configurazione | Imposta le credenziali oppure riavvia il gateway.                 |
| Nessun messaggio in ingresso  | `openclaw channels status --probe`                | Verifica le credenziali sulla QQ Open Platform.                   |
| Voce non trascritta           | Controlla la configurazione del provider STT      | Configura `channels.qqbot.stt` oppure `tools.media.audio`.        |
| I messaggi proattivi non arrivano | Controlla i requisiti di interazione della piattaforma QQ | QQ può bloccare i messaggi avviati dal bot senza un'interazione recente. |

Risoluzione completa dei problemi: [Risoluzione dei problemi di QQ Bot](/it/channels/qqbot#troubleshooting)

## Matrix

### Firme di errore di Matrix

| Sintomo                            | Controllo più rapido                     | Correzione                                                               |
| ---------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| Accesso eseguito ma i messaggi della stanza vengono ignorati | `openclaw channels status --probe`       | Controlla `groupPolicy`, l'allowlist della stanza e il controllo delle menzioni. |
| I DM non vengono elaborati         | `openclaw pairing list matrix`           | Approva il mittente oppure modifica il criterio DM.                      |
| Le stanze cifrate falliscono       | `openclaw matrix verify status`          | Verifica di nuovo il dispositivo, poi controlla `openclaw matrix verify backup status`. |
| Il ripristino del backup è in sospeso/non funziona | `openclaw matrix verify backup status`   | Esegui `openclaw matrix verify backup restore` oppure riesegui con una chiave di ripristino. |
| Cross-signing/bootstrap sembrano errati | `openclaw matrix verify bootstrap`       | Ripara secret storage, cross-signing e stato del backup in un unico passaggio. |

Configurazione e impostazione complete: [Matrix](/it/channels/matrix)

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Risoluzione dei problemi del gateway](/it/gateway/troubleshooting)
