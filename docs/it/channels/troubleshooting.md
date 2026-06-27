---
read_when:
    - Il trasporto del canale risulta connesso ma le risposte non riescono
    - Hai bisogno di controlli specifici del canale prima della documentazione approfondita del provider
summary: Risoluzione rapida dei problemi a livello di canale con firme e correzioni degli errori per ciascun canale
title: Risoluzione dei problemi dei canali
x-i18n:
    generated_at: "2026-06-27T17:14:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
    source_path: channels/troubleshooting.md
    workflow: 16
---

Usa questa pagina quando un canale si connette ma il comportamento è errato.

## Scaletta dei comandi

Esegui prima questi in ordine:

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

## Dopo un aggiornamento

Usa questo quando Telegram, iMessage, configurazioni dell'era BlueBubbles o un altro canale
Plugin scompare dopo l'aggiornamento.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Cerca `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix` in `openclaw status --all`. Significa che il canale è configurato, ma
il percorso di configurazione/caricamento del Plugin ha incontrato un albero delle dipendenze corrotto invece di registrare
il canale. `openclaw doctor --fix` rimuove directory di staging delle dipendenze del Plugin obsolete
e shadow auth obsoleti, quindi `openclaw gateway restart` ricarica lo
stato pulito.

## WhatsApp

### Firme di errore WhatsApp

| Sintomo                             | Controllo più rapido                                  | Correzione                                                                                                                       |
| ----------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Connesso ma nessuna risposta in DM  | `openclaw pairing list whatsapp`                      | Approva il mittente o cambia policy/allowlist DM.                                                                                |
| Messaggi di gruppo ignorati         | Controlla `requireMention` + pattern di menzione nella config | Menziona il bot o allenta la policy di menzione per quel gruppo.                                                                 |
| Login QR scade con 408              | Controlla le env `HTTPS_PROXY` / `HTTP_PROXY` del Gateway | Imposta un proxy raggiungibile; usa `NO_PROXY` solo per i bypass.                                                                |
| Cicli casuali di disconnessione/nuovo login | `openclaw channels status --probe` + log          | Le riconnessioni recenti sono segnalate anche quando attualmente connesso; osserva i log, riavvia il Gateway, poi ricollega se le oscillazioni continuano. |
| Loop `status=408 Request Time-out`  | Probe, log, doctor, poi stato del Gateway             | Correggi prima connettività/timing dell'host; esegui il backup dell'auth e ricollega l'account se il loop persiste.             |
| Le risposte arrivano con secondi/minuti di ritardo | `openclaw doctor --fix`                 | Doctor arresta i client TUI locali obsoleti verificati quando degradano l'event loop del Gateway.                               |

Risoluzione completa dei problemi: [Risoluzione dei problemi WhatsApp](/it/channels/whatsapp#troubleshooting)

## Telegram

### Firme di errore Telegram

| Sintomo                              | Controllo più rapido                              | Correzione                                                                                                                 |
| ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` ma nessun flusso di risposta utilizzabile | `openclaw pairing list telegram`          | Approva il pairing o cambia la policy DM.                                                                                  |
| Bot online ma gruppo silenzioso      | Verifica requisito di menzione e modalità privacy del bot | Disabilita la modalità privacy per la visibilità del gruppo o menziona il bot.                                             |
| Errori di invio con errori di rete   | Ispeziona i log per errori nelle chiamate API Telegram | Correggi routing DNS/IPv6/proxy verso `api.telegram.org`.                                                                  |
| Avvio segnala `getMe returned 401`   | Controlla la sorgente del token configurata       | Ricopia o rigenera il token BotFather e aggiorna `botToken`, `tokenFile` o l'account predefinito `TELEGRAM_BOT_TOKEN`.     |
| Polling in stallo o riconnessioni lente | `openclaw logs --follow` per diagnostica del polling | Aggiorna; se i riavvii sono falsi positivi, regola `pollingStallThresholdMs`. Gli stalli persistenti indicano ancora proxy/DNS/IPv6. |
| `setMyCommands` rifiutato all'avvio | Ispeziona i log per `BOT_COMMANDS_TOO_MUCH`       | Riduci i comandi Telegram di Plugin/skill/personalizzati o disabilita i menu nativi.                                       |
| Dopo l'upgrade l'allowlist ti blocca | `openclaw security audit` e allowlist di config   | Esegui `openclaw doctor --fix` o sostituisci `@username` con ID mittente numerici.                                         |

Risoluzione completa dei problemi: [Risoluzione dei problemi Telegram](/it/channels/telegram#troubleshooting)

## Discord

### Firme di errore Discord

| Sintomo                                   | Controllo più rapido                                                                                                      | Correzione                                                                                                                                                                                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online ma nessuna risposta nella guild | `openclaw channels status --probe`                                                                                        | Consenti guild/canale e verifica l'intent del contenuto dei messaggi.                                                                                                                                                                                                 |
| Messaggi di gruppo ignorati               | Controlla i log per drop dovuti al gate delle menzioni                                                                     | Menziona il bot o imposta `requireMention: false` per guild/canale.                                                                                                                                                                                                   |
| Uso di typing/token ma nessun messaggio Discord | Controlla se si tratta di un evento stanza ambient o di una stanza `message_tool` con opt-in in cui il modello ha mancato `message(action=send)` | Ispeziona il log verboso del Gateway per metadati del payload finale soppressi, verifica `messages.groupChat.unmentionedInbound`, leggi [Eventi stanza ambient](/it/channels/ambient-room-events), o mantieni `messages.groupChat.visibleReplies: "automatic"` per normali richieste di gruppo. |
| Risposte DM mancanti                      | `openclaw pairing list discord`                                                                                           | Approva il pairing DM o modifica la policy DM.                                                                                                                                                                                                                        |

Risoluzione completa dei problemi: [Risoluzione dei problemi Discord](/it/channels/discord#troubleshooting)

## Slack

### Firme di errore Slack

| Sintomo                                | Controllo più rapido                         | Correzione                                                                                                                                          |
| -------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode connesso ma nessuna risposta | `openclaw channels status --probe`          | Verifica app token + bot token e gli scope richiesti; osserva `botTokenStatus` / `appTokenStatus = configured_unavailable` nelle configurazioni basate su SecretRef. |
| DM bloccati                            | `openclaw pairing list slack`                | Approva il pairing o allenta la policy DM.                                                                                                           |
| Messaggio canale ignorato              | Controlla `groupPolicy` e allowlist del canale | Consenti il canale o cambia la policy in `open`.                                                                                                    |

Risoluzione completa dei problemi: [Risoluzione dei problemi Slack](/it/channels/slack#troubleshooting)

## iMessage

### Firme di errore iMessage

| Sintomo                              | Controllo più rapido                                         | Correzione                                                            |
| ------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| `imsg` mancante o errore su non-macOS | `openclaw channels status --probe --channel imessage`        | Esegui OpenClaw sul Mac con Messaggi o usa un wrapper SSH per `cliPath`. |
| Può inviare ma non riceve su macOS   | Controlla i permessi privacy macOS per l'automazione di Messaggi | Concedi di nuovo i permessi TCC e riavvia il processo del canale.     |
| Mittente DM bloccato                 | `openclaw pairing list imessage`                              | Approva il pairing o aggiorna l'allowlist.                            |

Risoluzione completa dei problemi:

- [Risoluzione dei problemi iMessage](/it/channels/imessage#troubleshooting)

## Signal

### Firme di errore Signal

| Sintomo                         | Controllo più rapido                         | Correzione                                                |
| ------------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| Daemon raggiungibile ma bot silenzioso | `openclaw channels status --probe`     | Verifica URL/account del daemon `signal-cli` e modalità di ricezione. |
| DM bloccato                     | `openclaw pairing list signal`               | Approva il mittente o modifica la policy DM.              |
| Le risposte di gruppo non si attivano | Controlla allowlist del gruppo e pattern di menzione | Aggiungi mittente/gruppo o allenta il gating.             |

Risoluzione completa dei problemi: [Risoluzione dei problemi Signal](/it/channels/signal#troubleshooting)

## QQ Bot

### Firme di errore QQ Bot

| Sintomo                         | Controllo più rapido                            | Correzione                                                          |
| ------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| Il bot risponde "gone to Mars"  | Verifica `appId` e `clientSecret` nella config   | Imposta le credenziali o riavvia il Gateway.                        |
| Nessun messaggio in ingresso    | `openclaw channels status --probe`               | Verifica le credenziali sulla QQ Open Platform.                     |
| Voce non trascritta             | Controlla la config del provider STT             | Configura `channels.qqbot.stt` o `tools.media.audio`.               |
| Messaggi proattivi non arrivano | Controlla i requisiti di interazione della piattaforma QQ | QQ può bloccare i messaggi avviati dal bot senza interazioni recenti. |

Risoluzione completa dei problemi: [Risoluzione dei problemi di QQ Bot](/it/channels/qqbot#troubleshooting)

## Matrix

### Firme di errore di Matrix

| Sintomo                             | Verifica più rapida                    | Correzione                                                               |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| Accesso effettuato ma ignora i messaggi delle stanze | `openclaw channels status --probe`     | Controlla `groupPolicy`, l’elenco di stanze consentite e il controllo delle menzioni. |
| I messaggi diretti non vengono elaborati | `openclaw pairing list matrix`         | Approva il mittente o modifica la policy dei messaggi diretti.           |
| Le stanze crittografate non funzionano | `openclaw matrix verify status`        | Verifica di nuovo il dispositivo, poi controlla `openclaw matrix verify backup status`. |
| Il ripristino del backup è in sospeso o interrotto | `openclaw matrix verify backup status` | Esegui `openclaw matrix verify backup restore` o ripeti l’esecuzione con una chiave di recupero. |
| La firma incrociata/bootstrap sembra errata | `openclaw matrix verify bootstrap`     | Ripara archiviazione segreta, firma incrociata e stato del backup in un unico passaggio. |

Configurazione e setup completi: [Matrix](/it/channels/matrix)

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
