---
read_when:
    - Pianificare il passaggio da BlueBubbles al plugin iMessage incluso nel pacchetto
    - Traduzione delle chiavi di configurazione di BlueBubbles nei corrispondenti equivalenti di iMessage
    - Verifica di imsg prima di abilitare il plugin iMessage
summary: 'Migra le vecchie configurazioni di BlueBubbles al plugin iMessage incluso: mappatura delle chiavi, controlli dell''elenco consentito dei gruppi e verifica del passaggio.'
title: Passaggio da BlueBubbles
x-i18n:
    generated_at: "2026-07-12T06:47:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Il supporto per BlueBubbles è stato rimosso. OpenClaw supporta iMessage solo tramite il Plugin `imessage` incluso, che controlla [`steipete/imsg`](https://github.com/steipete/imsg) tramite JSON-RPC e accede alla stessa superficie API privata utilizzata da BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, sondaggi nativi, gestione dei gruppi, allegati). Un unico eseguibile CLI sostituisce il server BlueBubbles, l'app client e l'infrastruttura webhook: nessun endpoint REST, nessuna autenticazione webhook.

Questa guida illustra la migrazione delle vecchie configurazioni `channels.bluebubbles` a `channels.imessage`. Non sono supportati altri percorsi di migrazione. Nella versione attuale di OpenClaw, un blocco `channels.bluebubbles` residuo è inerte: nessun componente di runtime lo legge.

<Note>
Per l'annuncio breve e il riepilogo destinato agli operatori, consulta [Rimozione di BlueBubbles e percorso iMessage tramite imsg](/it/announcements/bluebubbles-imessage).
</Note>

## Lista di controllo per la migrazione

Il percorso sicuro più breve, se conosci già la tua vecchia configurazione BlueBubbles:

1. Verifica direttamente `imsg` sul Mac che esegue Messages.app (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. Copia le chiavi di comportamento da `channels.bluebubbles` a `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` e `actions`.
3. Elimina le chiavi di trasporto che non esistono più: `serverUrl`, `password`, gli URL dei webhook e la configurazione del server BlueBubbles.
4. Se il Gateway non è in esecuzione sul Mac con Messages, imposta `channels.imessage.cliPath` su un wrapper SSH e configura `remoteHost` per il recupero remoto degli allegati.
5. Abilita `channels.imessage`, riavvia il Gateway, quindi esegui `openclaw channels status --probe --channel imessage`.
6. Verifica un messaggio diretto, un gruppo consentito, gli allegati se abilitati e ogni azione dell'API privata che prevedi venga utilizzata dall'agente.
7. Elimina il server BlueBubbles e la vecchia configurazione `channels.bluebubbles` dopo aver verificato il percorso iMessage.

## Funzionamento di imsg

`imsg` è una CLI macOS locale per Messages. OpenClaw avvia `imsg rpc` come processo figlio e comunica tramite JSON-RPC su stdin/stdout. Non sono presenti server HTTP, URL webhook, demoni in background, agenti di avvio o porte da esporre.

- Le letture provengono da `~/Library/Messages/chat.db` tramite un handle SQLite di sola lettura.
- I messaggi in ingresso in tempo reale provengono da `imsg watch` / `watch.subscribe`, che monitora gli eventi del file system di `chat.db` con il polling come meccanismo di riserva.
- Gli invii utilizzano l'automazione di Messages.app per i normali messaggi di testo e file.
- Le azioni avanzate utilizzano `imsg launch` per inserire l'helper `imsg` in Messages.app. Ciò abilita le conferme di lettura, gli indicatori di digitazione, gli invii avanzati, la modifica, l'annullamento dell'invio, le risposte nei thread, i tapback, i sondaggi e la gestione dei gruppi.
- Le build Linux possono esaminare una copia di `chat.db`, ma non possono inviare messaggi, monitorare il database attivo del Mac o controllare Messages.app. Per iMessage in OpenClaw, esegui `imsg` sul Mac su cui è stato effettuato l'accesso oppure tramite un wrapper SSH verso tale Mac.

## Prima di iniziare

1. Installa `imsg` sul Mac che esegue Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   Per la normale configurazione locale, la procedura di configurazione di OpenClaw può proporre un'installazione o un aggiornamento di `imsg` tramite Homebrew, previa conferma dell'utente, sul Mac con Messages su cui è stato effettuato l'accesso. La configurazione manuale e le topologie con wrapper SSH restano gestite dall'operatore: ripeti l'aggiornamento Homebrew nello stesso contesto utente locale o remoto che eseguirà `imsg`. Se `imsg chats` non riesce con `unable to open database file`, non produce alcun risultato oppure restituisce `authorization denied`, concedi l'accesso completo al disco al terminale, all'editor, al processo Node, al servizio Gateway o al processo SSH padre che avvia `imsg`, quindi riapri tale processo padre.

2. Verifica le funzionalità di lettura, monitoraggio, invio e RPC prima di modificare la configurazione di OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Sostituisci `42` con un ID chat reale ottenuto da `imsg chats`. L'invio richiede l'autorizzazione di automazione per Messages.app. Se OpenClaw verrà eseguito tramite SSH, esegui questi comandi tramite lo stesso wrapper SSH o contesto utente che utilizzerà OpenClaw. Se le letture funzionano ma gli invii non riescono con AppleEvents `-1743`, verifica se l'autorizzazione di automazione è stata assegnata a `/usr/libexec/sshd-keygen-wrapper`; consulta [Gli invii tramite wrapper SSH non riescono con AppleEvents -1743](/it/channels/imessage#requirements-and-permissions-macos).

3. Abilita il bridge dell'API privata. È fortemente consigliato per iMessage in OpenClaw, poiché le risposte, i tapback, gli effetti, i sondaggi, le risposte agli allegati e le azioni sui gruppi dipendono da esso:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` richiede che SIP sia disabilitato (e, nelle versioni moderne di macOS, che la convalida delle librerie sia attenuata; consulta [Abilitazione dell'API privata di imsg](/it/channels/imessage#enabling-the-imsg-private-api)). L'invio di base, la cronologia e il monitoraggio funzionano senza `imsg launch`; l'intera gamma di azioni iMessage di OpenClaw no.

4. Dopo aver abilitato `channels.imessage` e avviato il Gateway, verifica il bridge tramite OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   L'account iMessage dovrebbe indicare `works`; con `--json`, il payload della verifica include `privateApi.available: true`. Se indica `false`, risolvi prima questo problema; consulta [Rilevamento delle funzionalità](/it/channels/imessage#private-api-actions). La verifica richiede un Gateway raggiungibile (in caso contrario, la CLI ripiega su un output basato esclusivamente sulla configurazione) e controlla solo gli account configurati e abilitati.

5. Crea un'istantanea della configurazione:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## Traduzione della configurazione

iMessage e BlueBubbles condividono la maggior parte delle chiavi di comportamento a livello di canale. Ciò che cambia è il trasporto (server REST rispetto a CLI locale) e il formato della chiave del registro dei gruppi.

| BlueBubbles                                                | iMessage integrato                        | Note                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Stessa semantica (valore predefinito `true` una volta che il blocco esiste).                                                                                                                                                                                                                                          |
| `channels.bluebubbles.serverUrl`                           | _(rimosso)_                               | Nessun server REST: il plugin avvia `imsg rpc` tramite stdio.                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.password`                            | _(rimosso)_                               | Non è necessaria l'autenticazione del webhook.                                                                                                                                                                                                                                                                        |
| _(implicito)_                                              | `channels.imessage.cliPath`               | Percorso di `imsg` (valore predefinito `imsg`); usare uno script wrapper per SSH.                                                                                                                                                                                                                                     |
| _(implicito)_                                              | `channels.imessage.dbPath`                | Sostituzione facoltativa del percorso di `chat.db` di Messages.app; viene rilevato automaticamente se omesso.                                                                                                                                                                                                          |
| _(implicito)_                                              | `channels.imessage.remoteHost`            | `host` o `user@host`: necessario solo quando `cliPath` è un wrapper SSH e si desidera recuperare gli allegati tramite SCP.                                                                                                                                                                                             |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Stessi valori (`pairing` / `allowlist` / `open` / `disabled`); valore predefinito `pairing`.                                                                                                                                                                                                                           |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Stessi formati degli identificativi (`+15555550123`, `user@example.com`). Le approvazioni dell'archivio di associazione non vengono trasferite: vedere di seguito.                                                                                                                                                       |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Stessi valori (`allowlist` / `open` / `disabled`); valore predefinito `allowlist`.                                                                                                                                                                                                                                    |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Uguale. Se non impostato, iMessage usa come ripiego `allowFrom`; un `groupAllowFrom: []` esplicitamente vuoto blocca tutti i gruppi con `groupPolicy: "allowlist"`.                                                                                                                                                      |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | Copiare alla lettera la voce jolly `"*"`; modificare le chiavi delle voci per singolo gruppo usando il valore numerico `chat_id` di iMessage; vedere «Insidia del registro dei gruppi». `requireMention`, `tools`, `toolsBySender` e `systemPrompt` vengono mantenuti.                                                     |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Valore predefinito `true`. Con il plugin integrato, questa funzione si attiva solo quando il controllo dell'API privata è operativo.                                                                                                                                                                                    |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Stessa struttura e stessa disattivazione predefinita. Se gli allegati venivano trasferiti con BlueBubbles, impostare esplicitamente questa opzione: le foto e i contenuti multimediali in entrata vengono ignorati senza alcun avviso (nessuna riga di log `Inbound message`) finché non viene configurata.                |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Radici locali; stesse regole per i caratteri jolly.                                                                                                                                                                                                                                                                    |
| _(N/D)_                                                    | `channels.imessage.remoteAttachmentRoots` | Utilizzato solo quando `remoteHost` è impostato per i recuperi tramite SCP.                                                                                                                                                                                                                                            |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Valore predefinito 16 MB su iMessage (quello di BlueBubbles era 8 MB). Impostarlo esplicitamente per mantenere il limite inferiore.                                                                                                                                                                                      |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Valore predefinito 4000 per entrambi.                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Stessa attivazione facoltativa. Solo per i messaggi diretti: i gruppi mantengono l'inoltro per singolo messaggio. Estende a 7000 ms il debounce predefinito in entrata, salvo che sia impostato `messages.inbound.byChannel.imessage` o il valore globale `messages.inbound.debounceMs`. Vedere [Aggregazione dei messaggi diretti inviati separatamente](/it/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/D)_                                   | `imsg` espone già i nomi visualizzati dei mittenti da `chat.db`.                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Stesse opzioni per singola azione (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`), oltre alla nuova `polls`. Tutte sono abilitate per impostazione predefinita; le azioni dell'API privata richiedono comunque il bridge. |

Le configurazioni con più account (`channels.bluebubbles.accounts.*`) si traducono direttamente in `channels.imessage.accounts.*`.

## Insidia del registro dei gruppi

Il plugin iMessage integrato esegue consecutivamente due controlli per i gruppi. Un messaggio di gruppo deve superarli entrambi per raggiungere l'agente:

1. **Elenco consentiti dei mittenti/destinatari delle chat** (`channels.imessage.groupAllowFrom`): verifica la corrispondenza con l'identificativo del mittente o con il destinatario della chat (voci `chat_id:`, `chat_guid:`, `chat_identifier:`). Quando `groupAllowFrom` non è impostato, questo controllo usa come ripiego `allowFrom`; un `groupAllowFrom: []` esplicito disabilita tale ripiego e scarta ogni messaggio di gruppo con `groupPolicy: "allowlist"`.
2. **Registro dei gruppi** (`channels.imessage.groups`): usa come chiave il valore numerico `chat_id` di iMessage:
   - Nessun blocco `groups` (o un blocco vuoto): i gruppi superano questo controllo purché il controllo 1 disponga di un elenco consentiti effettivo e non vuoto per i mittenti; il filtro dei mittenti regola l'accesso e all'avvio non viene emesso alcun avviso relativo allo scarto totale.
   - `groups` con voci ma senza `"*"`: vengono accettate solo le chiavi `chat_id` elencate. L'inserimento di un qualsiasi gruppo trasforma il registro in un elenco consentiti, anche con `groupPolicy: "open"`.
   - `groups: { "*": { ... } }`: ogni gruppo supera questo controllo.

L'insidia della migrazione: BlueBubbles usava come chiavi delle voci `groups` il GUID o l'identificatore della chat, mentre il registro di iMessage usa il valore numerico `chat_id`. Le voci per singolo gruppo copiate alla lettera creano un registro non vuoto le cui chiavi non corrispondono mai; di conseguenza, ogni messaggio di gruppo viene scartato al controllo 2. Copiare alla lettera la voce jolly `"*"`; modificare le chiavi delle voci relative a gruppi specifici usando i valori `chat_id` ottenuti da `imsg chats`.

Entrambi i percorsi di scarto sono visibili al livello di log predefinito tramite righe `warn`:

- Una volta per account all'avvio, quando è impostato `groupPolicy: "allowlist"` e l'elenco consentiti effettivo dei mittenti dei gruppi è vuoto: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. Impostare `groupAllowFrom` (o `allowFrom`) per ammettere i mittenti; l'aggiunta del solo `groups` non soddisfa il controllo dei mittenti.
- Una volta per `chat_id` durante l'esecuzione, quando il registro scarta un gruppo: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`, indicando la chiave esatta da aggiungere.

I messaggi diretti continuano a funzionare in entrambi i casi: seguono un percorso di codice diverso, quindi il corretto funzionamento dei messaggi diretti non dimostra che l'instradamento dei gruppi funzioni.

La configurazione minima limitata ai mittenti con `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

Questa configurazione ammette i mittenti configurati in qualsiasi gruppo. Aggiungere voci `groups` per limitare le chat consentite o impostare opzioni per singola chat, come `requireMention`; copiare alla lettera la voce `"*"` di BlueBubbles, ma modificare le chiavi delle voci specifiche usando i valori numerici `chat_id` di iMessage.

## Procedura dettagliata

1. Traduci la configurazione. Mantieni il nuovo blocco disabilitato durante la modifica; il vecchio blocco `channels.bluebubbles` viene ignorato dalla versione attuale di OpenClaw e può rimanere accanto come riferimento:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // imposta su true quando sei pronto per la migrazione
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copia da bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copia da bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // il carattere jolly viene copiato letteralmente; modifica le chiavi delle voci per chat usando chat_id
         // le azioni sono abilitate per impostazione predefinita; imposta i singoli interruttori su false per disabilitarle
       },
     },
   }
   ```

2. **Esegui la migrazione e la verifica.** Imposta `channels.imessage.enabled: true`, riavvia il Gateway e verifica che il canale risulti integro:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # attenditi "works"; --json mostra privateApi.available: true
   ```

   La verifica richiede un Gateway raggiungibile e controlla solo gli account configurati e abilitati. Usa i comandi diretti `imsg` in [Prima di iniziare](#before-you-start) per convalidare il Mac stesso.

3. **Verifica i messaggi diretti.** Invia un messaggio diretto all'agente e verifica che la risposta venga recapitata.

4. **Verifica separatamente i gruppi.** I messaggi diretti e i gruppi seguono percorsi di codice diversi: il corretto funzionamento dei messaggi diretti non dimostra che l'instradamento dei gruppi funzioni. Invia un messaggio in una chat di gruppo consentita e verifica che la risposta venga recapitata. Se il gruppo non riceve più risposte (nessuna risposta dell'agente, nessun errore), controlla nel log del Gateway le due righe `warn` indicate sopra in "Insidia del registro dei gruppi". L'avviso all'avvio indica che l'elenco effettivo dei mittenti consentiti è vuoto; un avviso relativo a uno specifico `chat_id` indica che un registro `groups` popolato non contiene quella chat.

5. **Verifica le azioni disponibili.** Da un messaggio diretto associato, chiedi all'agente di aggiungere una reazione, modificare, annullare l'invio, rispondere, inviare una foto e, in un gruppo, rinominare il gruppo oppure aggiungere o rimuovere un partecipante. Ogni azione deve essere eseguita in modo nativo in Messages.app. Se un'azione genera l'errore `iMessage <action> requires the imsg private API bridge`, esegui nuovamente `imsg launch` e aggiorna lo stato con `openclaw channels status --probe`.

6. **Rimuovi il server BlueBubbles e il blocco `channels.bluebubbles`** dopo aver verificato i messaggi diretti, i gruppi e le azioni di iMessage. OpenClaw non legge `channels.bluebubbles`.

## Confronto rapido delle azioni

| Azione                                              | BlueBubbles precedente | iMessage incluso                                                               |
| --------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| Invio di testo / ripiego su SMS                     | ✅                     | ✅                                                                             |
| Invio di contenuti multimediali (foto, video, file, voce) | ✅                | ✅                                                                             |
| Risposta in thread (`reply_to_guid`)                 | ✅                     | ✅ (risolve [#51892](https://github.com/openclaw/openclaw/issues/51892))        |
| Tapback (`react`)                                   | ✅                     | ✅                                                                             |
| Modifica / annullamento dell'invio (destinatari macOS 13+) | ✅              | ✅                                                                             |
| Invio con effetto schermo                           | ✅                     | ✅ (risolve parte di [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Testo formattato in grassetto / corsivo / sottolineato / barrato | ✅          | ✅ (formattazione tipizzata tramite attributedBody)                            |
| Sondaggi nativi di Messages (creazione e voto)      | ❌                     | ✅ (`actions.polls`; i destinatari necessitano di iOS/macOS 26+ per la visualizzazione nativa) |
| Ridenominazione del gruppo / impostazione dell'icona del gruppo | ✅            | ✅                                                                             |
| Aggiunta / rimozione di partecipanti, abbandono del gruppo | ✅                | ✅                                                                             |
| Conferme di lettura e indicatore di digitazione     | ✅                     | ✅ (subordinato alla verifica dell'API privata)                                |
| Accorpamento dei messaggi diretti dello stesso mittente | ✅                  | ✅ (solo messaggi diretti; attivabile tramite `channels.imessage.coalesceSameSenderDms`) |
| Recupero dei messaggi in entrata dopo un riavvio    | ✅                     | ✅ (automatico: riproduzione `since_rowid` + deduplicazione GUID; intervallo più ampio in locale) |

iMessage recupera i messaggi persi mentre il Gateway non era in esecuzione: all'avvio riproduce i messaggi a partire dall'ultimo rowid inviato tramite `imsg watch.subscribe` `since_rowid`, li deduplica in base al GUID e un limite sull'età dei messaggi arretrati obsoleti impedisce la "bomba di messaggi arretrati" dovuta allo svuotamento Push. Questa procedura avviene tramite la connessione RPC di `imsg`, quindi funziona anche nelle configurazioni remote di `cliPath` tramite SSH; le configurazioni locali dispongono di un intervallo di recupero più ampio perché possono leggere `chat.db`. Consulta [Recupero dei messaggi in entrata dopo il riavvio di un bridge o del Gateway](/it/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Associazione, sessioni e collegamenti ACP

- **Gli elenchi di elementi consentiti vengono mantenuti in base all'identificativo.** `channels.imessage.allowFrom` riconosce le stesse stringhe `+15555550123` / `user@example.com` usate da BlueBubbles: copiale letteralmente.
- **Le approvazioni dell'archivio delle associazioni non vengono trasferite.** L'archivio delle associazioni è specifico per ciascun canale e nulla migra il vecchio archivio di BlueBubbles. I mittenti approvati esclusivamente tramite associazione devono associarsi nuovamente con iMessage; in alternativa, aggiungi i loro identificativi a `allowFrom`.
- **Le sessioni** rimangono circoscritte a ogni coppia agente + chat. Con il valore predefinito `session.dmScope=main`, i messaggi diretti confluiscono nella sessione principale dell'agente; le sessioni di gruppo rimangono isolate per `chat_id` (`agent:<agentId>:imessage:group:<chat_id>`). La cronologia precedente delle conversazioni associata alle chiavi di sessione di BlueBubbles non viene trasferita nelle sessioni di iMessage.
- **I collegamenti ACP** che fanno riferimento a `match.channel: "bluebubbles"` devono essere modificati in `"imessage"`. I formati di `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, identificativo senza prefisso) sono identici.

## Nessun canale di ripristino

Non esiste un runtime BlueBubbles supportato a cui tornare. Se la verifica di iMessage non riesce, imposta `channels.imessage.enabled: false`, riavvia il Gateway, risolvi il problema che blocca `imsg` e riprova la migrazione.

La cache delle risposte risiede nello stato SQLite del Plugin. Quando è presente, `openclaw doctor --fix` importa e archivia il vecchio file complementare `imessage/reply-cache.jsonl`.

## Contenuti correlati

- [Rimozione di BlueBubbles e percorso iMessage tramite imsg](/it/announcements/bluebubbles-imessage) — breve annuncio e riepilogo per gli operatori.
- [iMessage](/it/channels/imessage) — riferimento completo del canale iMessage, inclusi la configurazione di `imsg launch` e il rilevamento delle funzionalità.
- `/channels/bluebubbles` — URL precedente che reindirizza a questa guida alla migrazione.
- [Associazione](/it/channels/pairing) — autenticazione dei messaggi diretti e flusso di associazione.
- [Instradamento dei canali](/it/channels/channel-routing) — modalità con cui il Gateway seleziona un canale per le risposte in uscita.
