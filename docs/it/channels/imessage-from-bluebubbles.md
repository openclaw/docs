---
read_when:
    - Pianificare il passaggio da BlueBubbles al Plugin iMessage incluso
    - Traduzione delle chiavi di configurazione di BlueBubbles negli equivalenti di iMessage
    - Verifica di imsg prima di abilitare il Plugin iMessage
summary: Migra le vecchie configurazioni di BlueBubbles al Plugin iMessage incluso senza perdere l’associazione, gli elenchi consentiti o i collegamenti dei gruppi.
title: Se provieni da BlueBubbles
x-i18n:
    generated_at: "2026-05-10T19:21:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Il Plugin `imessage` incluso ora raggiunge la stessa superficie API privata di BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, gestione dei gruppi, allegati) pilotando [`steipete/imsg`](https://github.com/steipete/imsg) tramite JSON-RPC. Se esegui già un Mac con `imsg` installato, puoi eliminare il server BlueBubbles e lasciare che il Plugin parli direttamente con Messages.app.

Il supporto per BlueBubbles è stato rimosso. OpenClaw supporta iMessage solo tramite `imsg`. Questa guida serve per migrare le vecchie configurazioni `channels.bluebubbles` a `channels.imessage`; non esiste un altro percorso di migrazione supportato.

## Quando questa migrazione ha senso

- Esegui già `imsg` sullo stesso Mac (o su uno raggiungibile tramite SSH) in cui Messages.app ha effettuato l'accesso.
- Vuoi una parte mobile in meno: nessun server BlueBubbles separato, nessun endpoint REST da autenticare, nessun cablaggio Webhook. Un singolo binario CLI invece di un server + app client + helper.
- Usi una [build macOS / `imsg` supportata](/it/channels/imessage#requirements-and-permissions-macos) in cui il probe dell'API privata segnala `available: true`.

## Cosa fa imsg

`imsg` è una CLI macOS locale per Messages. OpenClaw avvia `imsg rpc` come processo figlio e comunica tramite JSON-RPC su stdin/stdout. Non ci sono server HTTP, URL Webhook, daemon in background, launch agent o porte da esporre.

- Le letture provengono da `~/Library/Messages/chat.db` usando un handle SQLite di sola lettura.
- I messaggi in ingresso live provengono da `imsg watch` / `watch.subscribe`, che segue gli eventi del file system di `chat.db` con un fallback a polling.
- Gli invii usano l'automazione di Messages.app per i normali invii di testo e file.
- Le azioni avanzate usano `imsg launch` per iniettare l'helper `imsg` in Messages.app. Questo sblocca conferme di lettura, indicatori di digitazione, invii rich, modifica, annullamento dell'invio, risposta in thread, tapback e gestione dei gruppi.
- Le build Linux possono ispezionare una copia di `chat.db`, ma non possono inviare, osservare il database live del Mac o pilotare Messages.app. Per OpenClaw iMessage, esegui `imsg` sul Mac con accesso effettuato o tramite un wrapper SSH verso quel Mac.

## Prima di iniziare

1. Installa `imsg` sul Mac che esegue Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Se `imsg chats` fallisce con `unable to open database file`, output vuoto o `authorization denied`, concedi Accesso completo al disco al terminale, editor, processo Node, servizio Gateway o processo padre SSH che avvia `imsg`, quindi riapri quel processo padre.

2. Verifica le superfici di lettura, osservazione, invio e RPC prima di modificare la configurazione OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Sostituisci `42` con un vero id chat da `imsg chats`. L'invio richiede il permesso Automazione per Messages.app. Se OpenClaw verrà eseguito tramite SSH, esegui questi comandi tramite lo stesso wrapper SSH o contesto utente che userà OpenClaw.

3. Abilita il bridge dell'API privata quando ti servono azioni avanzate:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` richiede che SIP sia disabilitato. Invio di base, cronologia e osservazione funzionano senza `imsg launch`; le azioni avanzate no.

4. Verifica il bridge tramite OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Vuoi `imessage.privateApi.available: true`. Se segnala `false`, risolvi prima quello: vedi [Rilevamento delle capacità](/it/channels/imessage#private-api-actions).

5. Crea uno snapshot della configurazione:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Traduzione della configurazione

iMessage e BlueBubbles condividono gran parte della configurazione a livello di canale. Le chiavi che cambiano sono principalmente quelle di trasporto (server REST vs CLI locale). Le chiavi di comportamento (`dmPolicy`, `groupPolicy`, `allowFrom`, ecc.) mantengono lo stesso significato.

| BlueBubbles                                                | iMessage in bundle                        | Note                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Stessa semantica.                                                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.serverUrl`                           | _(rimosso)_                               | Nessun server REST: il Plugin avvia `imsg rpc` su stdio.                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.password`                            | _(rimosso)_                               | Non è necessaria alcuna autenticazione webhook.                                                                                                                                                                                                                                                                                                     |
| _(implicito)_                                              | `channels.imessage.cliPath`               | Percorso di `imsg` (predefinito `imsg`); usa uno script wrapper per SSH.                                                                                                                                                                                                                                                                            |
| _(implicito)_                                              | `channels.imessage.dbPath`                | Override opzionale di Messages.app `chat.db`; rilevato automaticamente quando omesso.                                                                                                                                                                                                                                                               |
| _(implicito)_                                              | `channels.imessage.remoteHost`            | `host` o `user@host`: necessario solo quando `cliPath` è un wrapper SSH e vuoi recuperare gli allegati con SCP.                                                                                                                                                                                                                                     |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Stessi valori (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Le approvazioni di abbinamento vengono mantenute per handle, non per token.                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Stessi valori (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Uguale.                                                                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Copia questo alla lettera, inclusa qualsiasi voce jolly `groups: { "*": { ... } }`.** Le impostazioni per gruppo `requireMention`, `tools`, `toolsBySender` vengono mantenute. Con `groupPolicy: "allowlist"`, un blocco `groups` vuoto o mancante scarta silenziosamente ogni messaggio di gruppo: vedi "Insidia del registro gruppi" sotto. |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Predefinito `true`. Con il Plugin in bundle questo viene eseguito solo quando il probe dell'API privata è attivo.                                                                                                                                                                                                                                   |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Stessa forma, **stessa disattivazione predefinita**. Se su BlueBubbles avevi allegati in transito, devi reimpostarlo esplicitamente nel blocco iMessage: non viene mantenuto implicitamente, e foto/media in ingresso verranno scartati silenziosamente senza alcuna riga di log `Inbound message` finché non lo fai.                              |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Root locali; stesse regole jolly.                                                                                                                                                                                                                                                                                                                   |
| _(N/D)_                                                    | `channels.imessage.remoteAttachmentRoots` | Usato solo quando `remoteHost` è impostato per i recuperi SCP.                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Predefinito 16 MB su iMessage (il predefinito di BlueBubbles era 8 MB). Impostalo esplicitamente se vuoi mantenere il limite più basso.                                                                                                                                                                                                             |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Predefinito 4000 su entrambi.                                                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Stesso opt-in. Solo DM: le chat di gruppo mantengono l'invio immediato per messaggio su entrambi i canali. Amplia il debounce predefinito in ingresso a 2500 ms quando abilitato senza un `messages.inbound.byChannel.imessage` esplicito. Vedi [documentazione iMessage § Coalescenza dei DM inviati in parti separate](/it/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/D)_                                   | iMessage legge già i nomi visualizzati dei mittenti da `chat.db`.                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Toggle per azione: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                 |

Le configurazioni multi-account (`channels.bluebubbles.accounts.*`) si traducono uno a uno in `channels.imessage.accounts.*`.

## Insidia del registro gruppi

Il Plugin iMessage in bundle esegue **due** gate di allowlist di gruppo separati, uno dopo l'altro. Entrambi devono passare perché un messaggio di gruppo raggiunga l'agente:

1. **Allowlist del mittente / target della chat** (`channels.imessage.groupAllowFrom`): controllata da `isAllowedIMessageSender`. Abbina i messaggi in ingresso per handle del mittente, `chat_guid`, `chat_identifier` o `chat_id`. Stessa forma di BlueBubbles.
2. **Registro gruppi** (`channels.imessage.groups`): controllato da `resolveChannelGroupPolicy` da `inbound-processing.ts:199`. Con `groupPolicy: "allowlist"`, questo gate richiede:
   - una voce jolly `groups: { "*": { ... } }` (imposta `allowAll = true`), oppure
   - una voce esplicita per `chat_id` sotto `groups`.

Se il gate 1 passa ma il gate 2 fallisce, il messaggio viene scartato. Il Plugin emette due segnali di livello `warn`, quindi questo non è più silenzioso al livello di log predefinito:

- Un `warn` una tantum all'avvio per account quando `groupPolicy: "allowlist"` è impostato ma `channels.imessage.groups` è vuoto (nessun jolly `"*"`, nessuna voce per `chat_id`): emesso prima dell'arrivo di qualsiasi messaggio.
- Un `warn` una tantum per `chat_id` la prima volta che uno specifico gruppo viene scartato in runtime, indicando il chat_id e la chiave esatta da aggiungere a `groups` per consentirlo.

I DM continuano a funzionare perché usano un percorso di codice diverso.

Questa è la modalità di errore più comune nella migrazione da BlueBubbles a iMessage in bundle: gli operatori copiano `groupAllowFrom` e `groupPolicy` ma saltano il blocco `groups`, perché `groups: { "*": { "requireMention": true } }` di BlueBubbles sembra un'impostazione di menzione non correlata. In realtà è fondamentale per il gate del registro.

La configurazione minima per mantenere attivo il flusso dei messaggi di gruppo dopo `groupPolicy: "allowlist"`:

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

`requireMention: true` sotto `*` è innocuo quando non sono configurati pattern di menzione: il runtime imposta `canDetectMention = false` e interrompe subito lo scarto della menzione in `inbound-processing.ts:512`. Con i pattern di menzione configurati (`agents.list[].groupChat.mentionPatterns`), funziona come previsto.

Se i log del Gateway mostrano `imessage: dropping group message from chat_id=<id>` oppure la riga di avvio `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, il gate 2 sta scartando il messaggio: aggiungi il blocco `groups`.

## Passo per passo

1. Aggiungi un blocco iMessage accanto al blocco BlueBubbles esistente. Mantieni il vecchio blocco solo come fonte da cui copiare finché il nuovo percorso non è verificato:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
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

2. **Sonda dry-run**: avvia il Gateway e conferma che iMessage risulti integro:

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   Poiché `imessage.enabled` è ancora `false`, nessun traffico iMessage in ingresso viene ancora instradato, ma `--probe` esercita il bridge così puoi individuare problemi di permessi/installazione prima del passaggio.

3. **Esegui il passaggio.** Rimuovi la configurazione BlueBubbles e abilita iMessage con una singola modifica alla configurazione:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Riavvia il Gateway. Il traffico iMessage in ingresso ora passa attraverso il Plugin incluso.

4. **Verifica i DM.** Invia all’agente un messaggio diretto; conferma che la risposta arrivi.

5. **Verifica i gruppi separatamente.** DM e gruppi usano percorsi di codice diversi: il successo dei DM non prova che i gruppi vengano instradati. Invia all’agente un messaggio in una chat di gruppo associata e conferma che la risposta arrivi. Se il gruppo resta silenzioso (nessuna risposta dell’agente, nessun errore), controlla nel log del Gateway la riga `imessage: dropping group message from chat_id=<id>` oppure la riga di avvio `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`: entrambe vengono emesse al livello di log predefinito. Se compare una delle due, il tuo blocco `groups` manca o è vuoto: vedi “Group registry footgun” sopra.

6. **Verifica la superficie delle azioni**: da un DM associato, chiedi all’agente di reagire, modificare, annullare l’invio, rispondere, inviare una foto e (in un gruppo) rinominare il gruppo / aggiungere o rimuovere un partecipante. Ogni azione dovrebbe arrivare in modo nativo in Messages.app. Se una qualsiasi genera “iMessage `<action>` requires the imsg private API bridge”, esegui di nuovo `imsg launch` e aggiorna `channels status --probe`.

7. **Rimuovi il server e la configurazione BlueBubbles** dopo aver verificato DM, gruppi e azioni iMessage. OpenClaw non userà `channels.bluebubbles`.

## Parità delle azioni in sintesi

| Azione                                                     | BlueBubbles legacy                  | iMessage incluso                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Invio testo / fallback SMS                                 | ✅                                  | ✅                                                                                                                      |
| Invio media (foto, video, file, voce)                      | ✅                                  | ✅                                                                                                                      |
| Risposta in thread (`reply_to_guid`)                       | ✅                                  | ✅ (chiude [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                 |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Modifica / annullamento invio (destinatari macOS 13+)      | ✅                                  | ✅                                                                                                                      |
| Invio con effetto schermo                                  | ✅                                  | ✅ (chiude parte di [#9394](https://github.com/openclaw/openclaw/issues/9394))                                          |
| Testo ricco grassetto / corsivo / sottolineato / barrato   | ✅                                  | ✅ (formattazione typed-run tramite attributedBody)                                                                     |
| Rinomina gruppo / impostazione icona gruppo                | ✅                                  | ✅                                                                                                                      |
| Aggiunta / rimozione partecipante, uscita dal gruppo       | ✅                                  | ✅                                                                                                                      |
| Conferme di lettura e indicatore di digitazione            | ✅                                  | ✅ (protetto dalla sonda dell’API privata)                                                                              |
| Coalescenza DM dello stesso mittente                       | ✅                                  | ✅ (solo DM; opt-in tramite `channels.imessage.coalesceSameSenderDms`)                                                  |
| Catchup dei messaggi in ingresso ricevuti mentre il Gateway è inattivo | ✅ (replay Webhook + recupero cronologia) | ✅ (opt-in tramite `channels.imessage.catchup.enabled`; chiude [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

Il catchup di iMessage è ora disponibile come funzionalità opt-in nel Plugin incluso. All’avvio del Gateway, se `channels.imessage.catchup.enabled` è `true`, il Gateway esegue un passaggio `chats.list` + `messages.history` per chat contro lo stesso client JSON-RPC usato da `imsg watch`, riproduce ogni riga in ingresso persa attraverso il percorso di dispatch live (allowlist, policy di gruppo, debouncer, cache degli echo) e persiste un cursore per account così gli avvii successivi riprendono da dove erano rimasti. Vedi [Recupero dopo inattività del Gateway](/it/channels/imessage#catching-up-after-gateway-downtime) per la configurazione fine.

## Associazione, sessioni e binding ACP

- **Le approvazioni di associazione** si trasferiscono per handle. Non devi riapprovare i mittenti noti: `channels.imessage.allowFrom` riconosce le stesse stringhe `+15555550123` / `user@example.com` usate da BlueBubbles.
- **Le sessioni** restano limitate per agente + chat. I DM confluiscono nella sessione principale dell’agente con il valore predefinito `session.dmScope=main`; le sessioni di gruppo restano isolate per `chat_id`. Le chiavi di sessione differiscono (`agent:<id>:imessage:group:<chat_id>` rispetto all’equivalente BlueBubbles): la cronologia delle vecchie conversazioni sotto le chiavi di sessione BlueBubbles non viene trasferita nelle sessioni iMessage.
- **I binding ACP** che fanno riferimento a `match.channel: "bluebubbles"` devono essere aggiornati a `"imessage"`. Le forme di `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, handle semplice) sono identiche.

## Nessun canale di rollback

Non esiste un runtime BlueBubbles supportato a cui tornare. Se la verifica di iMessage fallisce, imposta `channels.imessage.enabled: false`, riavvia il Gateway, risolvi il blocco di `imsg` e riprova il passaggio.

La cache delle risposte si trova in `~/.openclaw/state/imessage/reply-cache.jsonl` (modalità `0600`, directory padre `0700`). Puoi eliminarla in sicurezza se vuoi ripartire da zero.

## Correlati

- [iMessage](/it/channels/imessage) — riferimento completo del canale iMessage, inclusi setup di `imsg launch` e rilevamento delle capacità.
- `/channels/bluebubbles` — URL legacy che reindirizza a questa guida di migrazione.
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione.
- [Instradamento dei canali](/it/channels/channel-routing) — come il Gateway sceglie un canale per le risposte in uscita.
