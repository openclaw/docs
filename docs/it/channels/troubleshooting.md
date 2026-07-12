---
read_when:
    - Il trasporto del canale risulta connesso, ma le risposte non vengono inviate
    - Sono necessari controlli specifici per il canale prima della documentazione approfondita del provider
summary: Risoluzione rapida dei problemi a livello di canale con indicatori di errore e correzioni specifici per ciascun canale
title: Risoluzione dei problemi dei canali
x-i18n:
    generated_at: "2026-07-12T06:49:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

Usa questa pagina quando un canale si connette, ma il comportamento non è corretto.

## Sequenza di comandi

Esegui prima questi comandi nell'ordine indicato:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Condizioni di funzionamento normali:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` o `admin-capable`
- Il controllo del canale mostra che il trasporto è connesso e, dove supportato, `works` o `audit ok`

## Dopo un aggiornamento

Usa questa procedura quando Telegram, iMessage, le configurazioni dell'epoca di BlueBubbles o un altro canale Plugin scompare
dopo l'aggiornamento.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Cerca `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` nell'output di `openclaw
status --all`. Significa che il canale è configurato, ma la configurazione o il caricamento del Plugin ha riscontrato un albero
delle dipendenze danneggiato invece di registrare il canale. `openclaw doctor --fix` rimuove i collegamenti simbolici obsoleti
delle dipendenze del runtime del Plugin e le copie obsolete dei dati di autenticazione, quindi `openclaw gateway restart` ricarica
uno stato pulito.

## WhatsApp

### Indicatori di errore di WhatsApp

| Sintomo                              | Controllo più rapido                                  | Soluzione                                                                                                                                                                                     |
| ------------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connesso ma nessuna risposta ai DM   | `openclaw pairing list whatsapp`                      | Approva il mittente oppure modifica i criteri o l'elenco di elementi consentiti per i DM.                                                                                                     |
| Messaggi di gruppo ignorati          | Controlla `requireMention` e i modelli di menzione nella configurazione | Menziona il bot oppure rendi meno restrittivi i criteri di menzione per il gruppo.                                                                                          |
| Accesso tramite QR scaduto con 408   | Controlla le variabili di ambiente `HTTPS_PROXY` / `HTTP_PROXY` del Gateway | Imposta un proxy raggiungibile; usa `NO_PROXY` solo per le esclusioni.                                                                                                      |
| Disconnessioni casuali o cicli di nuovo accesso | `openclaw channels status --probe` e log       | Le riconnessioni recenti vengono segnalate anche quando la connessione è attualmente attiva; controlla i log, riavvia il Gateway, quindi ripeti il collegamento se l'instabilità continua. |
| Ciclo `status=408 Request Time-out`  | Controllo, log, doctor, quindi stato del Gateway       | Correggi prima i problemi di connettività o temporizzazione dell'host; esegui il backup dei dati di autenticazione e ricollega l'account se il ciclo persiste.                                  |
| Le risposte arrivano con secondi o minuti di ritardo | `openclaw doctor --fix`                  | Doctor arresta i client TUI locali obsoleti verificati quando compromettono il ciclo degli eventi del Gateway.                                                                                |

Risoluzione completa dei problemi: [Risoluzione dei problemi di WhatsApp](/it/channels/whatsapp#troubleshooting)

## Telegram

### Indicatori di errore di Telegram

| Sintomo                              | Controllo più rapido                                  | Soluzione                                                                                                                                                                                 |
| ------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/start` ma nessun flusso di risposta utilizzabile | `openclaw pairing list telegram`          | Approva l'associazione oppure modifica i criteri dei DM.                                                                                                                                  |
| Bot online ma il gruppo rimane silenzioso | Verifica l'obbligo di menzione e la modalità privacy del bot | Disabilita la modalità privacy per rendere visibile il gruppo oppure menziona il bot.                                                                                         |
| Invii non riusciti con errori di rete | Esamina i log per individuare errori nelle chiamate API di Telegram | Correggi l'instradamento DNS/IPv6/proxy verso `api.telegram.org`.                                                                                                            |
| All'avvio viene segnalato `getMe returned 401` | Controlla l'origine configurata del token | Copia nuovamente o rigenera il token di BotFather e aggiorna `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` dell'account predefinito.                                                       |
| Il polling si blocca o si riconnette lentamente | Controlla `openclaw logs --follow` per la diagnostica del polling | Esegui l'aggiornamento; se i riavvii sono falsi positivi, regola `pollingStallThresholdMs`. I blocchi persistenti indicano comunque problemi di proxy, DNS o IPv6.              |
| `setMyCommands` rifiutato all'avvio  | Esamina i log per `BOT_COMMANDS_TOO_MUCH`             | Riduci i comandi Telegram di Plugin, Skills o personalizzati oppure disabilita i menu nativi.                                                                                              |
| Dopo l'aggiornamento l'elenco di elementi consentiti ti blocca | `openclaw security audit` e gli elenchi di elementi consentiti nella configurazione | Esegui `openclaw doctor --fix` oppure sostituisci `@username` con gli ID numerici dei mittenti.                  |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Telegram](/it/channels/telegram#troubleshooting)

## Discord

### Indicatori di errore di Discord

| Sintomo                                     | Controllo più rapido                                                                                                            | Soluzione                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online ma nessuna risposta nel server   | `openclaw channels status --probe`                                                                                              | Consenti il server e il canale e verifica l'intento relativo al contenuto dei messaggi.                                                                                                                                                                                                                                                 |
| Messaggi di gruppo ignorati                 | Controlla nei log i messaggi scartati per il filtro delle menzioni                                                              | Menziona il bot oppure imposta `requireMention: false` per il server o il canale.                                                                                                                                                                                                                                                        |
| Utilizzo di digitazione/token ma nessun messaggio Discord | Controlla se si tratta di un evento di una stanza ambientale o di una stanza `message_tool` abilitata in cui il modello non ha eseguito `message(action=send)` | Esamina il log dettagliato del Gateway per i metadati del payload finale soppresso, verifica `messages.groupChat.unmentionedInbound`, leggi [Eventi delle stanze ambientali](/it/channels/ambient-room-events) oppure mantieni `messages.groupChat.visibleReplies: "automatic"` per le normali richieste di gruppo. |
| Risposte DM mancanti                        | `openclaw pairing list discord`                                                                                                 | Approva l'associazione dei DM oppure modifica i relativi criteri.                                                                                                                                                                                                                                                                       |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Discord](/it/channels/discord#troubleshooting)

## Slack

### Indicatori di errore di Slack

| Sintomo                                        | Controllo più rapido                             | Soluzione                                                                                                                                                                                   |
| ---------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modalità socket connessa ma nessuna risposta   | `openclaw channels status --probe`               | Verifica il token dell'app, il token del bot e gli ambiti richiesti; nelle configurazioni basate su SecretRef, controlla la presenza di `botTokenStatus` / `appTokenStatus = configured_unavailable`. |
| DM bloccati                                    | `openclaw pairing list slack`                    | Approva l'associazione oppure rendi meno restrittivi i criteri dei DM.                                                                                                                       |
| Messaggio del canale ignorato                  | Controlla `groupPolicy` e l'elenco dei canali consentiti | Consenti il canale oppure imposta i criteri su `open`.                                                                                                                              |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Slack](/it/channels/slack#troubleshooting)

## iMessage

### Indicatori di errore di iMessage

| Sintomo                               | Controllo più rapido                                      | Soluzione                                                                                         |
| ------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `imsg` mancante o non funzionante su sistemi diversi da macOS | `openclaw channels status --probe --channel imessage` | Esegui OpenClaw sul Mac con Messaggi oppure usa un wrapper SSH per `cliPath`.                  |
| Invio possibile ma nessuna ricezione su macOS | Controlla le autorizzazioni alla privacy di macOS per l'automazione di Messaggi | Concedi nuovamente le autorizzazioni TCC e riavvia il processo del canale. |
| Mittente DM bloccato                  | `openclaw pairing list imessage`                           | Approva l'associazione oppure aggiorna l'elenco di elementi consentiti.                            |

Risoluzione completa dei problemi: [Risoluzione dei problemi di iMessage](/it/channels/imessage#troubleshooting)

## Signal

### Indicatori di errore di Signal

| Sintomo                            | Controllo più rapido                                  | Soluzione                                                                 |
| ---------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| Daemon raggiungibile ma bot silenzioso | `openclaw channels status --probe`                | Verifica l'URL o l'account del daemon `signal-cli` e la modalità di ricezione. |
| DM bloccato                        | `openclaw pairing list signal`                        | Approva il mittente oppure modifica i criteri dei DM.                     |
| Le risposte di gruppo non si attivano | Controlla l'elenco dei gruppi consentiti e i modelli di menzione | Aggiungi il mittente o il gruppo oppure rendi meno restrittivo il filtro. |

Risoluzione completa dei problemi: [Risoluzione dei problemi di Signal](/it/channels/signal#troubleshooting)

## Bot QQ

### Indicatori di errore del Bot QQ

| Sintomo                                  | Controllo più rapido                                  | Soluzione                                                                         |
| ---------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| Il bot risponde "gone to Mars"           | Verifica `appId` e `clientSecret` nella configurazione | Imposta le credenziali oppure riavvia il Gateway.                                |
| Nessun messaggio in entrata              | `openclaw channels status --probe`                    | Verifica le credenziali sulla QQ Open Platform.                                   |
| Voce non trascritta                      | Controlla la configurazione del provider STT          | Configura `channels.qqbot.stt` oppure `tools.media.audio`.                        |
| I messaggi proattivi non arrivano        | Controlla i requisiti di interazione della piattaforma QQ | QQ potrebbe bloccare i messaggi avviati dal bot in assenza di interazioni recenti. |

Risoluzione completa dei problemi: [Risoluzione dei problemi del Bot QQ](/it/channels/qqbot#troubleshooting)

## Matrix

### Segnali di errore di Matrix

| Sintomo                                      | Verifica più rapida                     | Soluzione                                                                                               |
| -------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Ha effettuato l'accesso ma ignora i messaggi delle stanze | `openclaw channels status --probe`       | Verificare `groupPolicy`, l'elenco consentito delle stanze e il filtro delle menzioni.                   |
| I messaggi diretti non vengono elaborati     | `openclaw pairing list matrix`           | Approvare il mittente o modificare la politica dei messaggi diretti.                                    |
| Le stanze crittografate non funzionano       | `openclaw matrix verify status`          | Verificare nuovamente il dispositivo, quindi controllare `openclaw matrix verify backup status`.        |
| Il ripristino del backup è in sospeso o non funziona | `openclaw matrix verify backup status`   | Eseguire `openclaw matrix verify backup restore` oppure riprovare con una chiave di recupero.            |
| La firma incrociata o l'inizializzazione sembra errata | `openclaw matrix verify bootstrap`       | Correggere in un solo passaggio l'archiviazione dei segreti, la firma incrociata e lo stato del backup.  |

Configurazione completa: [Matrix](/it/channels/matrix)

## Contenuti correlati

- [Associazione](/it/channels/pairing)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
