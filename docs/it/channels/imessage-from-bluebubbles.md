---
read_when:
    - Pianificare il passaggio da BlueBubbles al Plugin iMessage incluso
    - Traduzione delle chiavi di configurazione BlueBubbles negli equivalenti iMessage
    - Verifica imsg prima di abilitare il Plugin iMessage
summary: Migra le vecchie configurazioni di BlueBubbles al Plugin iMessage incluso senza perdere abbinamento, allowlist o associazioni di gruppo.
title: In arrivo da BlueBubbles
x-i18n:
    generated_at: "2026-06-27T17:10:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Il Plugin `imessage` incluso ora raggiunge la stessa superficie API privata di BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, gestione dei gruppi, allegati) pilotando [`steipete/imsg`](https://github.com/steipete/imsg) tramite JSON-RPC. Se esegui già un Mac con `imsg` installato, puoi eliminare il server BlueBubbles e lasciare che il Plugin comunichi direttamente con Messages.app.

Il supporto a BlueBubbles è stato rimosso. OpenClaw supporta iMessage solo tramite `imsg`. Questa guida serve a migrare le vecchie configurazioni `channels.bluebubbles` a `channels.imessage`; non esiste un altro percorso di migrazione supportato.

<Note>
Per l'annuncio breve e il riepilogo per gli operatori, consulta [Rimozione di BlueBubbles e percorso iMessage con imsg](/it/announcements/bluebubbles-imessage).
</Note>

## Checklist di migrazione

Usa questa checklist quando conosci già la tua vecchia configurazione BlueBubbles e vuoi il percorso sicuro più breve:

1. Verifica `imsg` direttamente sul Mac che esegue Messages.app (`imsg chats`, `imsg history`, `imsg send` e `imsg rpc --help`).
2. Copia le chiavi di comportamento da `channels.bluebubbles` a `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` e `actions`.
3. Rimuovi le chiavi di trasporto che non esistono più: `serverUrl`, `password`, URL Webhook e configurazione del server BlueBubbles.
4. Se il Gateway non è in esecuzione sul Mac di Messages, imposta `channels.imessage.cliPath` su un wrapper SSH e imposta `remoteHost` per il recupero remoto degli allegati.
5. Con il Gateway arrestato, abilita `channels.imessage`, quindi esegui `openclaw channels status --probe --channel imessage`.
6. Testa un DM, un gruppo consentito, gli allegati se abilitati e ogni azione API privata che ti aspetti che l'agente usi.
7. Elimina il server BlueBubbles e la vecchia configurazione `channels.bluebubbles` dopo aver verificato il percorso iMessage.

## Quando questa migrazione ha senso

- Esegui già `imsg` sullo stesso Mac (o su uno raggiungibile tramite SSH) in cui Messages.app ha effettuato l'accesso.
- Vuoi un componente in meno da gestire: nessun server BlueBubbles separato, nessun endpoint REST da autenticare, nessun impianto Webhook. Un singolo binario CLI invece di server + app client + helper.
- Usi una [build macOS / `imsg` supportata](/it/channels/imessage#requirements-and-permissions-macos) in cui la sonda API privata segnala `available: true`.

## Cosa fa imsg

`imsg` è una CLI macOS locale per Messages. OpenClaw avvia `imsg rpc` come processo figlio e comunica via JSON-RPC su stdin/stdout. Non ci sono server HTTP, URL Webhook, daemon in background, launch agent o porte da esporre.

- Le letture provengono da `~/Library/Messages/chat.db` usando un handle SQLite in sola lettura.
- I messaggi in ingresso live provengono da `imsg watch` / `watch.subscribe`, che segue gli eventi del filesystem di `chat.db` con un fallback a polling.
- Gli invii usano l'automazione di Messages.app per testo normale e invio di file.
- Le azioni avanzate usano `imsg launch` per iniettare l'helper `imsg` in Messages.app. È ciò che sblocca conferme di lettura, indicatori di digitazione, invii avanzati, modifica, annullamento dell'invio, risposta in thread, tapback e gestione dei gruppi.
- Le build Linux possono ispezionare un `chat.db` copiato, ma non possono inviare, osservare il database live del Mac o pilotare Messages.app. Per OpenClaw iMessage, esegui `imsg` sul Mac con accesso effettuato o tramite un wrapper SSH verso quel Mac.

## Prima di iniziare

1. Installa `imsg` sul Mac che esegue Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Se `imsg chats` fallisce con `unable to open database file`, output vuoto o `authorization denied`, concedi Accesso completo al disco al terminale, all'editor, al processo Node, al servizio Gateway o al processo padre SSH che avvia `imsg`, quindi riapri quel processo padre.

2. Verifica le superfici di lettura, osservazione, invio e RPC prima di modificare la configurazione di OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Sostituisci `42` con un ID chat reale da `imsg chats`. L'invio richiede il permesso Automazione per Messages.app. Se OpenClaw verrà eseguito tramite SSH, esegui questi comandi tramite lo stesso wrapper SSH o contesto utente che userà OpenClaw. Se letture/sonde funzionano ma gli invii falliscono con AppleEvents `-1743`, controlla se Automazione è finita su `/usr/libexec/sshd-keygen-wrapper`; consulta [Gli invii tramite wrapper SSH falliscono con AppleEvents -1743](/it/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

3. Abilita il bridge API privato quando ti servono azioni avanzate:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` richiede che SIP sia disabilitato. Invio di base, cronologia e osservazione funzionano senza `imsg launch`; le azioni avanzate no.

4. Dopo aver aggiunto una configurazione `channels.imessage` abilitata, verifica il bridge tramite OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Devi ottenere `imessage.privateApi.available: true`. Se segnala `false`, risolvi prima quello: consulta [Rilevamento delle capacità](/it/channels/imessage#private-api-actions). `channels status --probe` sonda solo gli account configurati e abilitati.

5. Crea uno snapshot della configurazione:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Traduzione della configurazione

iMessage e BlueBubbles condividono gran parte della configurazione a livello di canale. Le chiavi che cambiano sono soprattutto quelle di trasporto (server REST rispetto a CLI locale). Le chiavi di comportamento (`dmPolicy`, `groupPolicy`, `allowFrom`, ecc.) mantengono lo stesso significato.

| BlueBubbles                                                | iMessage in bundle                        | Note                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Stessa semantica.                                                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.serverUrl`                           | _(rimosso)_                               | Nessun server REST: il Plugin avvia `imsg rpc` su stdio.                                                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.password`                            | _(rimosso)_                               | Nessuna autenticazione Webhook necessaria.                                                                                                                                                                                                                                                                                                                                           |
| _(implicito)_                                              | `channels.imessage.cliPath`               | Percorso di `imsg` (predefinito `imsg`); usa uno script wrapper per SSH.                                                                                                                                                                                                                                                                                                             |
| _(implicito)_                                              | `channels.imessage.dbPath`                | Override facoltativo di `chat.db` di Messages.app; rilevato automaticamente quando omesso.                                                                                                                                                                                                                                                                                           |
| _(implicito)_                                              | `channels.imessage.remoteHost`            | `host` o `user@host`: necessario solo quando `cliPath` è un wrapper SSH e vuoi recuperare gli allegati tramite SCP.                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Stessi valori (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Le approvazioni di associazione vengono trasferite per handle, non per token.                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Stessi valori (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Uguale.                                                                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Copia questo alla lettera, inclusa qualsiasi voce jolly `groups: { "*": { ... } }`.** `requireMention`, `tools`, `toolsBySender` per gruppo vengono trasferiti. Con `groupPolicy: "allowlist"`, un blocco `groups` vuoto o mancante scarta silenziosamente ogni messaggio di gruppo: vedi "Tranello del registro gruppi" sotto.                                                    |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Predefinito `true`. Con il Plugin in bundle, questo viene eseguito solo quando il probe dell'API privata è attivo.                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Stessa forma, **stesso disattivato per impostazione predefinita**. Se su BlueBubbles gli allegati erano attivi, devi reimpostarlo esplicitamente nel blocco iMessage: non viene trasferito implicitamente, e foto/media in ingresso verranno scartati silenziosamente senza riga di log `Inbound message` finché non lo fai.                                                          |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Radici locali; stesse regole per i caratteri jolly.                                                                                                                                                                                                                                                                                                                                  |
| _(N/D)_                                                    | `channels.imessage.remoteAttachmentRoots` | Usato solo quando `remoteHost` è impostato per recuperi SCP.                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Predefinito 16 MB su iMessage (il predefinito di BlueBubbles era 8 MB). Impostalo esplicitamente se vuoi mantenere il limite più basso.                                                                                                                                                                                                                                              |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Predefinito 4000 su entrambi.                                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Stesso opt-in. Solo DM: le chat di gruppo mantengono l'invio immediato per messaggio su entrambi i canali. Quando abilitato senza un `messages.inbound.byChannel.imessage` esplicito o un `messages.inbound.debounceMs` globale, amplia il debounce in ingresso predefinito a 7000 ms. Vedi [documentazione iMessage § Unione dei DM split-send](/it/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/D)_                                   | iMessage legge già i nomi visualizzati dei mittenti da `chat.db`.                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Toggle per azione: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                                                  |

Le configurazioni multi-account (`channels.bluebubbles.accounts.*`) si traducono uno-a-uno in `channels.imessage.accounts.*`.

## Tranello del registro gruppi

Il Plugin iMessage in bundle esegue **due** gate allowlist di gruppo separati in sequenza. Entrambi devono passare perché un messaggio di gruppo raggiunga l'agente:

1. **Allowlist mittente / destinazione chat** (`channels.imessage.groupAllowFrom`): controllata da `isAllowedIMessageSender`. Corrisponde ai messaggi in ingresso per handle del mittente, `chat_guid`, `chat_identifier` o `chat_id`. Stessa forma di BlueBubbles.
2. **Registro gruppi** (`channels.imessage.groups`): controllato da `resolveChannelGroupPolicy` da `inbound-processing.ts:199`. Con `groupPolicy: "allowlist"`, questo gate richiede:
   - una voce jolly `groups: { "*": { ... } }` (imposta `allowAll = true`), oppure
   - una voce esplicita per `chat_id` sotto `groups`.

Se il gate 1 passa ma il gate 2 fallisce, il messaggio viene scartato. Il Plugin emette due segnali di livello `warn`, quindi questo non è più silenzioso al livello di log predefinito:

- Un `warn` una tantum all'avvio per account quando `groupPolicy: "allowlist"` è impostato ma `channels.imessage.groups` è vuoto (nessun carattere jolly `"*"`, nessuna voce per `chat_id`): viene emesso prima che arrivi qualsiasi messaggio.
- Un `warn` una tantum per `chat_id` la prima volta che uno specifico gruppo viene scartato in runtime, indicando il chat_id e la chiave esatta da aggiungere a `groups` per consentirlo.

I DM continuano a funzionare perché seguono un percorso di codice diverso.

Questa è la modalità di errore più comune nella migrazione da BlueBubbles a iMessage integrato: gli operatori copiano `groupAllowFrom` e `groupPolicy` ma saltano il blocco `groups`, perché `groups: { "*": { "requireMention": true } }` di BlueBubbles sembra un'impostazione di menzione non correlata. In realtà è essenziale per il gate del registro.

La configurazione minima per mantenere attivi i messaggi di gruppo dopo `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` sotto `*` è innocuo quando non sono configurati pattern di menzione: il runtime imposta `canDetectMention = false` e interrompe rapidamente lo scarto per menzione in `inbound-processing.ts:512`. Con pattern di menzione configurati (`agents.list[].groupChat.mentionPatterns`), funziona come previsto.

Se i log del gateway riportano `imessage: dropping group message from chat_id=<id>` o la riga di avvio `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, il gate 2 sta scartando i messaggi: aggiungi il blocco `groups`.

## Passo dopo passo

1. Aggiungi un blocco iMessage accanto al blocco BlueBubbles esistente. Lascialo disabilitato mentre il Gateway sta ancora instradando il traffico BlueBubbles:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **Esegui una verifica prima che il traffico conti**: arresta il Gateway, abilita temporaneamente il blocco iMessage e conferma dalla CLI che iMessage risulti integro:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` verifica solo gli account configurati e abilitati. Non riavviare il Gateway con BlueBubbles e iMessage entrambi abilitati, a meno che tu non voglia intenzionalmente avere entrambi i monitor dei canali in esecuzione. Se non effettui subito il cutover, imposta di nuovo `channels.imessage.enabled` su `false` prima di riavviare il Gateway. Usa i comandi diretti `imsg` in [Prima di iniziare](#before-you-start) per convalidare il Mac prima di abilitare il traffico OpenClaw.

3. **Esegui il cutover.** Quando l'account iMessage abilitato risulta integro, rimuovi la configurazione BlueBubbles e lascia iMessage abilitato:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Riavvia il gateway. Il traffico iMessage in ingresso ora passa attraverso il Plugin integrato.

4. **Verifica i DM.** Invia un messaggio diretto all'agente; conferma che la risposta arrivi.

5. **Verifica i gruppi separatamente.** DM e gruppi seguono percorsi di codice diversi: il successo dei DM non dimostra che i gruppi siano instradati. Invia un messaggio all'agente in una chat di gruppo associata e conferma che la risposta arrivi. Se il gruppo resta silenzioso (nessuna risposta dell'agente, nessun errore), controlla nel log del gateway `imessage: dropping group message from chat_id=<id>` o la riga di avvio `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`: entrambe vengono emesse al livello di log predefinito. Se compare una delle due, il tuo blocco `groups` manca o è vuoto: vedi "Inciampo del registro dei gruppi" sopra.

6. **Verifica la superficie delle azioni**: da un DM associato, chiedi all'agente di reagire, modificare, annullare l'invio, rispondere, inviare una foto e (in un gruppo) rinominare il gruppo / aggiungere o rimuovere un partecipante. Ogni azione dovrebbe arrivare nativamente in Messages.app. Se una qualsiasi genera "iMessage `<action>` requires the imsg private API bridge", esegui di nuovo `imsg launch` e aggiorna `channels status --probe`.

7. **Rimuovi il server e la configurazione BlueBubbles** dopo aver verificato DM, gruppi e azioni iMessage. OpenClaw non userà `channels.bluebubbles`.

## Parità delle azioni in sintesi

| Azione                                              | BlueBubbles legacy                  | iMessage integrato                                                            |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Inviare testo / fallback SMS                        | ✅                                  | ✅                                                                            |
| Inviare media (foto, video, file, voce)             | ✅                                  | ✅                                                                            |
| Risposta in thread (`reply_to_guid`)                | ✅                                  | ✅ (chiude [#51892](https://github.com/openclaw/openclaw/issues/51892))       |
| Tapback (`react`)                                   | ✅                                  | ✅                                                                            |
| Modifica / annullamento invio (macOS 13+ destinatari) | ✅                                | ✅                                                                            |
| Inviare con effetto schermo                         | ✅                                  | ✅ (chiude parte di [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Testo ricco grassetto / corsivo / sottolineato / barrato | ✅                             | ✅ (formattazione typed-run tramite attributedBody)                           |
| Rinominare gruppo / impostare icona gruppo          | ✅                                  | ✅                                                                            |
| Aggiungere / rimuovere partecipante, lasciare gruppo | ✅                                 | ✅                                                                            |
| Conferme di lettura e indicatore di digitazione     | ✅                                  | ✅ (protetto da verifica API privata)                                         |
| Coalescenza DM stesso mittente                      | ✅                                  | ✅ (solo DM; opt-in tramite `channels.imessage.coalesceSameSenderDms`)        |
| Recupero in ingresso dopo un riavvio                | ✅ (replay Webhook + fetch cronologia) | ✅ (automatico: replay dei mancati via since_rowid + deduplica; finestra più ampia in locale) |

iMessage recupera i messaggi persi mentre il gateway era inattivo: all'avvio riproduce dall'ultimo rowid inviato tramite `imsg watch.subscribe` `since_rowid` e deduplica per GUID, mentre un limite di età del backlog obsoleto sopprime la "bomba di backlog" del flush Push. Questo avviene sulla connessione RPC `imsg`, quindi funziona anche per configurazioni `cliPath` SSH remote; le configurazioni locali hanno una finestra di recupero più ampia perché possono leggere `chat.db`. Vedi [Recupero in ingresso dopo il riavvio di un bridge o del gateway](/it/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Associazioni, sessioni e binding ACP

- **Le approvazioni di associazione** vengono trasferite per handle. Non devi riapprovare i mittenti noti: `channels.imessage.allowFrom` riconosce le stesse stringhe `+15555550123` / `user@example.com` usate da BlueBubbles.
- **Le sessioni** restano circoscritte per agente + chat. I DM collassano nella sessione principale dell'agente con `session.dmScope=main` predefinito; le sessioni di gruppo restano isolate per `chat_id`. Le chiavi di sessione sono diverse (`agent:<id>:imessage:group:<chat_id>` rispetto all'equivalente BlueBubbles): la vecchia cronologia delle conversazioni sotto le chiavi di sessione BlueBubbles non viene trasferita nelle sessioni iMessage.
- **I binding ACP** che fanno riferimento a `match.channel: "bluebubbles"` devono essere aggiornati a `"imessage"`. Le forme di `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, handle semplice) sono identiche.

## Nessun canale di rollback

Non esiste un runtime BlueBubbles supportato a cui tornare. Se la verifica iMessage fallisce, imposta `channels.imessage.enabled: false`, riavvia il Gateway, correggi il blocco di `imsg` e riprova il cutover.

La cache delle risposte vive nello stato Plugin SQLite. `openclaw doctor --fix` importa e archivia il vecchio sidecar `imessage/reply-cache.jsonl` quando presente.

## Correlati

- [Rimozione di BlueBubbles e percorso iMessage imsg](/it/announcements/bluebubbles-imessage): breve annuncio e riepilogo per gli operatori.
- [iMessage](/it/channels/imessage): riferimento completo del canale iMessage, inclusi configurazione `imsg launch` e rilevamento delle capacità.
- `/channels/bluebubbles`: URL legacy che reindirizza a questa guida alla migrazione.
- [Associazione](/it/channels/pairing): autenticazione DM e flusso di associazione.
- [Instradamento dei canali](/it/channels/channel-routing): come il gateway sceglie un canale per le risposte in uscita.
